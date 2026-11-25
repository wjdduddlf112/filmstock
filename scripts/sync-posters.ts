import { Client, isFullPage } from "@notionhq/client";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, unlink, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { collectPages } from "../lib/notion/pagination";
import { mapCover } from "../lib/notion/mapper";
import { canOptimizeCover } from "../lib/movies/cover";
import { posterSourceKey, type PosterManifest, type PosterEntry } from "../lib/movies/preoptimized-poster";
import type { MovieCover } from "../types/movie";

const manifestPath = "lib/movies/poster-manifest.json";
const outputDir = "public/posters";
const MAX_BYTES = 20 * 1024 * 1024;
const force = process.env.REFRESH_ALL === "true";

function allowed(url: URL): boolean {
  if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
  return canOptimizeCover(url.href) || [
    "image.tmdb.org", "m.media-amazon.com", "images-na.ssl-images-amazon.com",
    "upload.wikimedia.org", "image.cine21.com", "img.cgv.co.kr",
    "movie-phinf.pstatic.net", "search.pstatic.net",
  ].includes(url.hostname);
}

async function download(source: string): Promise<Buffer> {
  let url = new URL(source);
  for (let i = 0; i < 5; i++) {
    if (!allowed(url)) throw new Error("unsupported_source");
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(25_000),
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      await res.body?.cancel();
      if (!location) throw new Error("invalid_redirect");
      url = new URL(location, url);
      continue;
    }
    if (!res.ok || !res.body) throw new Error("download_failed");
    if (Number(res.headers.get("content-length")) > MAX_BYTES) {
      await res.body.cancel();
      throw new Error("too_large");
    }
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > MAX_BYTES) throw new Error("too_large");
        chunks.push(value);
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    return Buffer.concat(chunks);
  }
  throw new Error("redirect_limit");
}

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

async function valid(entry: PosterEntry | undefined): Promise<boolean> {
  if (!entry) return false;
  const paths = [entry.small, entry.large];
  return paths.every((p) => /^\/posters\/[a-f0-9-]+-(480|800)\.webp$/.test(p)) &&
    (await Promise.all(paths.map((p) => exists("public" + p)))).every(Boolean);
}

async function generate(id: string, cover: MovieCover, source: string): Promise<PosterEntry> {
  const original = await download(cover.url);
  const image = sharp(original, { limitInputPixels: 40_000_000, failOn: "error" });
  const metadata = await image.metadata();
  if (!metadata.format || !["jpeg", "png", "webp", "gif", "heif", "avif", "tiff"].includes(metadata.format))
    throw new Error("unsupported_format");
  const [small, large] = await Promise.all([480, 800].map((width) =>
    image.clone().rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer(),
  ));
  const hash = createHash("sha256").update(small).update(large).digest("hex").slice(0, 24);
  const base = id + "-" + hash;
  const entry = { source, small: "/posters/" + base + "-480.webp", large: "/posters/" + base + "-800.webp" };
  for (const [path, data] of [[entry.small, small], [entry.large, large]] as const) {
    if (!await exists("public" + path)) {
      await writeFile("public" + path + ".tmp", data);
      await rename("public" + path + ".tmp", "public" + path);
    }
  }
  return entry;
}

async function main() {
  const auth = process.env.NOTION_TOKEN?.trim();
  const dataSource = process.env.NOTION_DATA_SOURCE_ID?.trim();
  if (!auth || !dataSource) throw new Error("Set NOTION_TOKEN and NOTION_DATA_SOURCE_ID in Actions secrets");
  const notion = new Client({ auth, notionVersion: "2026-03-11", timeoutMs: 20_000, logger: () => {} });
  const pages = await collectPages((cursor) => notion.dataSources.query({
    data_source_id: dataSource,
    page_size: 100,
    ...(cursor ? { start_cursor: cursor } : {}),
  }));
  const full = pages.filter(isFullPage);
  if (full.length !== pages.length) throw new Error("Incomplete Notion pages; refusing to prune posters");
  const previous = JSON.parse(await readFile(manifestPath, "utf8")) as PosterManifest;
  if (!full.length && Object.keys(previous).length) throw new Error("Empty Notion dataset; refusing to prune posters");
  await mkdir(outputDir, { recursive: true });
  const next: PosterManifest = {};
  let reused = 0, generated = 0, failed = 0, unsupported = 0;
  let index = 0;
  async function worker() {
    while (index < full.length) {
      const page = full[index++];
      const id = page.id.toLowerCase();
      if (!/^[a-f0-9-]{36}$/.test(id)) continue;
      const cover = mapCover(page.cover);
      if (!cover) continue;
      const source = posterSourceKey(cover);
      const prior = previous[id];
      const reusable = prior?.source === source && await valid(prior);
      if (reusable && !force) { next[id] = prior; reused++; continue; }
      if (!allowed(new URL(cover.url))) { unsupported++; continue; }
      try {
        next[id] = await generate(id, cover, source);
        generated++;
      } catch {
        failed++;
        if (reusable) next[id] = prior;
        console.warn("Poster download/encode failed for page", id);
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  const ordered = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)));
  // Never write a partial/empty archive due to a widespread source failure.
  if (failed > 0 && generated === 0 && reused === 0)
    throw new Error("No poster could be processed; leaving manifest unchanged");
  await writeFile(manifestPath, JSON.stringify(ordered, null, 2) + "\n");
  const retained = new Set(Object.values(ordered).flatMap((entry) => [entry.small, entry.large]).map((p) => p.split("/").pop()));
  for (const file of await readdir(outputDir)) {
    if (/^[a-f0-9-]+-(480|800)\.webp(?:\.tmp)?$/.test(file) && !retained.has(file))
      await unlink(join(outputDir, file));
  }
  console.log(JSON.stringify({ pages: full.length, generated, reused, failed, unsupported }));
}
main().catch(() => {
  // Do not print exception details containing signed URLs or request credentials.
  console.error("Poster synchronization failed. Check Notion permissions, Actions secrets and source availability.");
  process.exitCode = 1;
});
