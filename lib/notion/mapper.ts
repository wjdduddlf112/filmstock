import type { Movie } from "@/types/movie";

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function propertyValue(value: unknown, type: string): unknown {
  const property = record(value);
  return property?.type === type ? property[type] : undefined;
}

function text(value: unknown, type: "title" | "rich_text"): string {
  const parts = propertyValue(value, type);
  if (!Array.isArray(parts)) return "";
  return parts.map((part) => {
    const plainText = record(part)?.plain_text;
    return typeof plainText === "string" ? plainText : "";
  }).join("");
}

function multiSelect(value: unknown): string[] {
  const options = propertyValue(value, "multi_select");
  if (!Array.isArray(options)) return [];
  return options.flatMap((option) => {
    const name = record(option)?.name;
    return typeof name === "string" ? [name] : [];
  });
}

function date(value: unknown): string | null {
  const start = record(propertyValue(value, "date"))?.start;
  return typeof start === "string" && Number.isFinite(Date.parse(start))
    ? start
    : null;
}

function number(value: unknown): number | null {
  const result = propertyValue(value, "number");
  return typeof result === "number" && Number.isFinite(result) ? result : null;
}

export function mapNotionPageToMovie(page: { id: string; properties?: unknown }): Movie {
  const properties = record(page.properties) ?? {};
  return {
    id: page.id,
    title: text(properties["이름"], "title"),
    director: text(properties["감독"], "rich_text"),
    actors: text(properties["배우"], "rich_text"),
    releaseDate: date(properties["개봉일"]),
    watchedDate: date(properties["관람일"]),
    countries: multiSelect(properties["국가"]),
    genres: multiSelect(properties["장르"]),
    ott: multiSelect(properties["OTT"]),
    runtime: number(properties["상영시간"]),
    rating: number(properties["평점"]),
    oneLineReview: text(properties["한줄평"], "rich_text"),
    tags: multiSelect(properties["태그"]),
  };
}

export function sortMoviesByWatchedDate(movies: Movie[]): Movie[] {
  return [...movies].sort((a, b) => {
    if (!a.watchedDate) return b.watchedDate ? 1 : 0;
    if (!b.watchedDate) return -1;
    return Date.parse(b.watchedDate) - Date.parse(a.watchedDate);
  });
}
