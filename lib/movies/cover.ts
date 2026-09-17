import type { MovieCover } from "@/types/movie";

export function safeImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

export function canOptimizeCover(url: string): boolean {
  const parsed = new URL(url);
  return (
    parsed.protocol === "https:" &&
    ([
      "prod-files-secure.s3.us-west-2.amazonaws.com",
      "secure.notion-static.com",
      "images.unsplash.com",
    ].includes(parsed.hostname) ||
      (parsed.hostname === "s3.us-west-2.amazonaws.com" &&
        parsed.pathname.startsWith("/secure.notion-static.com/")))
  );
}

// Server callers evaluate expiry per request, outside the cached Notion dataset.
export function usableCover(
  cover: MovieCover | null,
  now = Date.now(),
): MovieCover | null {
  if (
    !cover ||
    (cover.expiresAt && Date.parse(cover.expiresAt) <= now + 30_000)
  )
    return null;
  return cover;
}
