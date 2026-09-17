import assert from "node:assert/strict";
import test from "node:test";
import { isCanonicalMovieSlug, movieSlug } from "../lib/movies/slug";

test("Korean detail URLs accept encoded and decoded params without redirect loops", () => {
  const movie = { id: "11111111-2222-3333-4444-555555555555", title: "기생충" };
  const slug = movieSlug(movie);
  assert.equal(isCanonicalMovieSlug(slug, movie), true);
  assert.equal(isCanonicalMovieSlug(encodeURIComponent(slug), movie), true);
  assert.equal(isCanonicalMovieSlug(slug, { ...movie, title: "새 제목" }), false);
});
