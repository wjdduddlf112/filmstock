import "server-only";

import { isFullPage, isNotionClientError } from "@notionhq/client";
import type { Movie } from "@/types/movie";
import { createNotionClient } from "./client";
import { mapNotionPageToMovie, sortMoviesByWatchedDate } from "./mapper";
import { collectPages } from "./pagination";

export async function getMovies(): Promise<Movie[]> {
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID?.trim();
  if (!dataSourceId) throw new Error("Missing NOTION_DATA_SOURCE_ID");

  const notion = createNotionClient();
  const pages = await collectPages((cursor) => notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 100,
    ...(cursor ? { start_cursor: cursor } : {}),
  }));

  return sortMoviesByWatchedDate(pages.filter(isFullPage).map(mapNotionPageToMovie));
}

export function logMovieLoadError(error: unknown): void {
  const missing = ["NOTION_TOKEN", "NOTION_DATA_SOURCE_ID"].filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missing.length > 0) {
    console.error("[FILM STOCK] Missing environment variables:", missing.join(", "));
    return;
  }
  const code = isNotionClientError(error) ? error.code : "configuration_or_query_error";
  console.error("[FILM STOCK] Movie load failed:", code);
}
