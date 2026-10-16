import "server-only";

import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { isFullPage, isNotionClientError } from "@notionhq/client";
import type { Movie } from "@/types/movie";
import { createNotionClient } from "./client";
import { mapNotionPageToMovie, sortMoviesByWatchedDate } from "./mapper";
import { collectPages } from "./pagination";

async function getCachedMovies(): Promise<Movie[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 1800, expire: 2700 });
  cacheTag("filmstock-movies");
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID?.trim();
  if (!dataSourceId) throw new Error("Missing NOTION_DATA_SOURCE_ID");

  const notion = createNotionClient();
  if (process.env.FILMSTOCK_CACHE_DEBUG === "1")
    console.info("[FILM STOCK cache] Notion dataset refresh started");
  const pages = await collectPages((cursor) =>
    notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    }),
  );

  const movies = sortMoviesByWatchedDate(
    pages.filter(isFullPage).map(mapNotionPageToMovie),
  );
  if (process.env.FILMSTOCK_CACHE_DEBUG === "1")
    console.info("[FILM STOCK cache] Notion dataset refresh completed", movies.length);
  return movies;
}

// Share a dataset across routes; also deduplicate metadata/page reads in one render.
export const getMovies = cache(async () => {
  try {
    return await getCachedMovies();
  } catch (error) {
    logMovieLoadError(error);
    throw new Error("Film archive unavailable");
  }
});

export function logMovieLoadError(error: unknown): void {
  const missing = ["NOTION_TOKEN", "NOTION_DATA_SOURCE_ID"].filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missing.length > 0) {
    console.error(
      "[FILM STOCK] Missing environment variables:",
      missing.join(", "),
    );
    return;
  }
  const code = isNotionClientError(error)
    ? error.code
    : "configuration_or_query_error";
  console.error("[FILM STOCK] Movie load failed:", code);
}
