import type { Movie } from "@/types/movie";
import type { Review, SaveReviewInput } from "@/types/review";

export const reviewTemplate =
  "## Summary\n\n\n\n## View Point\n\n### \n\n\n\n### \n\n\n\n## Review\n\n";
export const reviewStatusLabels = {
  draft: "초안",
  private: "비공개",
  published: "발행",
} as const;
export const MAX_REVIEW_LENGTH = 200_000;
export const isPageId = (id: unknown): id is string =>
  typeof id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export function validSaveInput(value: unknown): value is SaveReviewInput {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    isPageId(v.notionPageId) &&
    typeof v.content === "string" &&
    v.content.length <= MAX_REVIEW_LENGTH &&
    typeof v.spoiler === "boolean" &&
    typeof v.status === "string" &&
    Object.hasOwn(reviewStatusLabels, v.status) &&
    (v.expectedVersion === null ||
      (typeof v.expectedVersion === "string" &&
        /^\d{4}-\d{2}-\d{2}T/.test(v.expectedVersion) &&
        Number.isFinite(Date.parse(v.expectedVersion))))
  );
}
export function publishedIdSet(
  rows: { notion_page_id: string; status: string }[],
): Set<string> {
  return new Set(
    rows
      .filter((r) => r.status === "published" && isPageId(r.notion_page_id))
      .map((r) => r.notion_page_id.toLowerCase()),
  );
}
export function selectHomeMovies(
  movies: Movie[],
  published: ReadonlySet<string>,
  random = Math.random,
): Movie[] {
  const unique = [...new Map(movies.map((m) => [m.id, m])).values()];
  const shuffle = (items: Movie[]) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  const reviewed = shuffle(
    unique.filter((m) => published.has(m.id.toLowerCase())),
  );
  const fallback = shuffle(
    unique.filter(
      (m) => !published.has(m.id.toLowerCase()) && m.oneLineReview.trim(),
    ),
  );
  return [...reviewed, ...fallback].slice(0, 4);
}
export function asReview(value: unknown): Review | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Review;
  return typeof row.id === "string" &&
    isPageId(row.notion_page_id) &&
    typeof row.content === "string" &&
    Object.hasOwn(reviewStatusLabels, row.status) &&
    typeof row.updated_at === "string"
    ? row
    : null;
}
