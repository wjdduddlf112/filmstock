import { createHash } from "node:crypto";
import type { Movie, MovieCover } from "@/types/movie";
import manifest from "./poster-manifest.json";

export type PosterEntry = { source: string; small: string; large: string };
export type PosterManifest = Record<string, PosterEntry>;

// Notion file URLs are signed afresh on each query. The underlying object path
// identifies the cover; external URLs keep their query because it may matter.
export function posterSourceKey(cover: MovieCover): string {
  const url = new URL(cover.url);
  url.hash = "";
  if (cover.type === "file") url.search = "";
  return createHash("sha256").update("v1:" + cover.type + ":" + url.href).digest("hex");
}

export function withPreoptimizedPoster(
  movie: Movie,
  entries: PosterManifest = manifest as PosterManifest,
): Movie {
  if (!movie.cover) return movie;
  const entry = entries[movie.id.toLowerCase()];
  if (!entry || entry.source !== posterSourceKey(movie.cover)) return movie;
  const pathPattern = /^\/posters\/[a-f0-9-]+-(480|800)\.webp$/;
  if (!pathPattern.test(entry.small) || !pathPattern.test(entry.large)) return movie;
  return {
    ...movie,
    cover: {
      ...movie.cover,
      url: entry.large,
      thumbnailUrl: entry.small,
      expiresAt: null,
    },
  };
}
