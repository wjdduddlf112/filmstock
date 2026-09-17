import type { Movie } from "@/types/movie";

export function shortId(id: string): string {
  // Encode the full UUID, avoiding collisions from truncating it to six characters.
  const hex = id.replaceAll("-", "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) throw new Error("Invalid movie ID");
  return BigInt(`0x${hex}`).toString(36);
}

export function movieSlug(movie: Pick<Movie, "id" | "title">): string {
  const title =
    movie.title
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || "film";
  return `${title}-${shortId(movie.id)}`;
}

export function parseMovieId(slug: string): string | null {
  const token = slug.split("-").at(-1) ?? "";
  if (!/^[0-9a-z]{1,25}$/.test(token) || !slug.includes("-")) return null;
  let number = 0n;
  for (const char of token) number = number * 36n + BigInt(parseInt(char, 36));
  const hex = number.toString(16).padStart(32, "0");
  if (hex.length !== 32) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function movieHref(movie: Pick<Movie, "id" | "title">): string {
  return `/film/${encodeURIComponent(movieSlug(movie))}`;
}

export function isCanonicalMovieSlug(slug: string, movie: Pick<Movie, "id" | "title">): boolean {
  const canonical = movieSlug(movie);
  return slug === canonical || slug === encodeURIComponent(canonical);
}
