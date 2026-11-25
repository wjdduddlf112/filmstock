import test from "node:test";
import assert from "node:assert/strict";
import { posterSourceKey, withPreoptimizedPoster } from "../lib/movies/preoptimized-poster";
import { mapNotionPageToMovie } from "../lib/notion/mapper";
import { usableCover } from "../lib/movies/cover";

const id = "12345678-1234-1234-1234-123456789abc";
const page = (url: string, type: "file" | "external" = "file") => mapNotionPageToMovie({
  id,
  cover: { type, [type]: { url, expiry_time: "2020-01-01T00:00:00Z" } },
});

test("signed Notion URL rotation reuses the optimized cover", () => {
  const movie = page("https://secure.notion-static.com/poster.jpg?signature=first");
  const refreshed = page("https://secure.notion-static.com/poster.jpg?signature=second");
  const source = posterSourceKey(movie.cover!);
  assert.equal(posterSourceKey(refreshed.cover!), source);
  const small = "/posters/1234-abcd-480.webp";
  const large = "/posters/1234-abcd-800.webp";
  const result = withPreoptimizedPoster(refreshed, { [id]: { source, small, large } });
  assert.equal(result.cover?.url, large);
  assert.equal(result.cover?.thumbnailUrl, small);
  assert.equal(result.cover?.expiresAt, null);
  assert.equal(usableCover(result.cover)?.url, large);
});

test("new or changed covers use the original until synchronized", () => {
  const old = page("https://secure.notion-static.com/old.jpg?token=1");
  const updated = page("https://secure.notion-static.com/new.jpg?token=2");
  const entry = { source: posterSourceKey(old.cover!), small: "/posters/1234-abcd-480.webp", large: "/posters/1234-abcd-800.webp" };
  assert.equal(withPreoptimizedPoster(updated, { [id]: entry }), updated);
  assert.equal(withPreoptimizedPoster(old, {}), old);
  const noCover = mapNotionPageToMovie({ id });
  assert.equal(withPreoptimizedPoster(noCover, { [id]: entry }), noCover);
});

test("external query parameters stay part of the identity", () => {
  const a = page("https://image.tmdb.org/t/p/a?version=1", "external");
  const b = page("https://image.tmdb.org/t/p/a?version=2", "external");
  assert.notEqual(posterSourceKey(a.cover!), posterSourceKey(b.cover!));
});

test("manifest entries must point to local WebP assets", () => {
  const movie = page("https://secure.notion-static.com/poster.jpg");
  assert.equal(withPreoptimizedPoster(movie, { [id]: {
    source: posterSourceKey(movie.cover!), small: "https://example.com/image.webp", large: "/posters/1234-abcd-800.webp",
  } }), movie);
});
