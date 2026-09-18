import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  safeAdminPath,
  safeLoginPath,
  hasAdminMembership,
} from "../lib/auth/helpers";
import {
  reviewTemplate,
  validSaveInput,
  publishedIdSet,
  selectHomeMovies,
  MAX_REVIEW_LENGTH,
} from "../lib/reviews/helpers";
import { createSaveQueue } from "../lib/reviews/save-queue";
import { mapNotionPageToMovie } from "../lib/notion/mapper";
import {
  queryMovies,
  parseCatalogState,
  catalogHref,
} from "../lib/movies/catalog";
import { Markdown } from "../components/review/Markdown";
import { ReviewSection } from "../components/movie/ReviewSection";
import type { Review, ReviewDraft, SaveReviewResult } from "../types/review";

const id = "11111111-2222-3333-4444-555555555555";
test("header login returns to the public site while explicit editor requests stay local", () => {
  assert.equal(safeLoginPath(undefined), "/");
  for (const path of [
    "/",
    "/films",
    "/stats",
    "/about",
    "/admin/film/title-123/edit",
  ])
    assert.equal(safeLoginPath(path), path);
  assert.equal(
    safeLoginPath("/film/기생충-123"),
    "/film/%EA%B8%B0%EC%83%9D%EC%B6%A9-123",
  );
  for (const path of [
    "https://evil.test",
    "//evil.test",
    "/%2fevil.test",
    "/\\evil.test",
    "/auth/callback",
    "/admin/login",
    "/admin/../../evil",
    "/%250aevil",
  ])
    assert.equal(safeLoginPath(path), "/");
});
const draft: ReviewDraft = {
  content: "## Summary\n\n본문",
  status: "draft",
  spoiler: false,
};
test("redirects accept local admin paths including Korean slugs and reject escapes", () => {
  const path = "/admin/film/기생충-abc/edit";
  assert.equal(
    safeAdminPath(path),
    "/admin/film/%EA%B8%B0%EC%83%9D%EC%B6%A9-abc/edit",
  );
  assert.equal(safeAdminPath(encodeURI(path)), safeAdminPath(path));
  for (const unsafe of [
    null,
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/admin/../../evil",
    "/admin/%2e%2e/%2e%2e/evil",
    "/admin/%5cevil",
    "/admin/%250aevil",
    "/admin/%0aevil",
    "/administrator",
    "/admin/login",
    "javascript:alert(1)",
  ])
    assert.equal(safeAdminPath(unsafe), "/admin");
});
test("admin membership requires a matching server-verified user ID", () => {
  assert.equal(hasAdminMembership(id, { user_id: id }), true);
  for (const row of [
    null,
    {},
    { user_id: "other" },
    { email: "admin@example.test" },
  ])
    assert.equal(hasAdminMembership(id, row), false);
  assert.equal(hasAdminMembership("", { user_id: "" }), false);
});
test("save validation preserves explicit statuses and never accepts unsafe payloads", () => {
  const input = { ...draft, notionPageId: id, expectedVersion: null };
  for (const status of ["draft", "private", "published"])
    assert.equal(validSaveInput({ ...input, status }), true);
  for (const status of ["admin", "__proto__", undefined])
    assert.equal(validSaveInput({ ...input, status }), false);
  assert.equal(
    validSaveInput({ ...input, content: "x".repeat(MAX_REVIEW_LENGTH + 1) }),
    false,
  );
  assert.equal(validSaveInput({ ...input, expectedVersion: "bad" }), false);
  assert.equal(
    validSaveInput({ ...input, notionPageId: "movie-title" }),
    false,
  );
  assert.equal(validSaveInput({ ...input, spoiler: "false" }), false);
  assert.match(reviewTemplate, /^## Summary/);
  assert.match(reviewTemplate, /## View Point/);
  assert.match(reviewTemplate, /## Review/);
});
const films = Array.from({ length: 7 }, (_, index) => ({
  ...mapNotionPageToMovie({
    id: `00000000-0000-0000-0000-${String(index).padStart(12, "0")}`,
  }),
  title: `Film ${index}`,
  oneLineReview: index ? "한줄평" : "",
}));
test("published ID index excludes draft/private and deduplicates canonical IDs", () => {
  const ids = publishedIdSet([
    { notion_page_id: id, status: "published" },
    { notion_page_id: id, status: "published" },
    { notion_page_id: films[1].id, status: "draft" },
    { notion_page_id: films[2].id, status: "private" },
  ]);
  assert.deepEqual([...ids], [id]);
});
test("home prioritizes 1-3 published films, fills shortages, and uses only published when 4+ exist", () => {
  for (const count of [0, 1, 2, 3, 4, 6]) {
    const ids = new Set(films.slice(0, count).map((m) => m.id));
    const result = selectHomeMovies([...films, films[0]], ids, () => 0.4);
    assert.equal(result.length, 4);
    assert.equal(new Set(result.map((m) => m.id)).size, 4);
    assert.equal(
      result.filter((m) => ids.has(m.id)).length,
      Math.min(count, 4),
    );
    if (!count) assert.ok(result.every((m) => m.oneLineReview));
  }
});
test("review filters use only the public ID set and round-trip in URLs", () => {
  const ids = new Set([films[0].id]);
  assert.equal(
    queryMovies(films, parseCatalogState({ review: "yes" }), ids).total,
    1,
  );
  assert.equal(
    queryMovies(films, parseCatalogState({ review: "no" }), ids).total,
    6,
  );
  const state = parseCatalogState({ review: "yes", q: "Film", page: "2" });
  assert.deepEqual(
    parseCatalogState(
      Object.fromEntries(
        new URL(catalogHref(state), "https://example.test").searchParams,
      ),
    ),
    state,
  );
});
test("save queue serializes in-flight saves and passes the latest returned version", async () => {
  const calls: string[] = [];
  let release!: (value: SaveReviewResult) => void;
  const queue = createSaveQueue(null, async (value, version) => {
    calls.push(`${value.content}:${version}`);
    if (calls.length === 1)
      return new Promise((resolve) => {
        release = resolve;
      });
    return { ok: true, version: "v2" };
  });
  const first = queue({ ...draft, content: "first" });
  const second = queue({ ...draft, content: "latest", status: "published" });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(calls, ["first:null"]);
  release({ ok: true, version: "v1" });
  await first;
  await second;
  assert.deepEqual(calls, ["first:null", "latest:v1"]);
  await queue({ ...draft, content: "latest", status: "published" });
  assert.equal(calls.length, 2);
});
test("published saves preserve status and wait for persistence before reporting success", async () => {
  let release!: (value: SaveReviewResult) => void;
  let completed = false;
  const queue = createSaveQueue("v1", async (value) => {
    assert.equal(value.status, "published");
    return new Promise<SaveReviewResult>((resolve) => { release = resolve; });
  });
  const result = queue({ ...draft, status: "published", content: "updated" });
  void result.then(() => { completed = true; });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(completed, false);
  release({ ok: true, version: "v2" });
  assert.deepEqual(await result, { ok: true, version: "v2" });
});

test("conflicting saves stop queued writes; transient failures can be retried", async () => {
  let count = 0;
  const conflict = createSaveQueue("v1", async () => {
    count++;
    return { ok: false, reason: "conflict", message: "Conflict" };
  });
  await conflict(draft);
  await conflict({ ...draft, content: "newer" });
  assert.equal(count, 1);
  let attempts = 0;
  const retry = createSaveQueue("v1", async () => {
    if (++attempts === 1) throw new Error("offline");
    return { ok: true, version: "v2" };
  });
  assert.equal((await retry(draft)).ok, false);
  assert.equal((await retry(draft)).ok, true);
});
test("Markdown supports article formatting without executable HTML or unsafe URLs", () => {
  const html = renderToStaticMarkup(
    createElement(Markdown, {
      content:
        "## Heading\n\n**bold** *italic*\n\n> quote\n\n- item\n\n---\n\n[unsafe](javascript:alert%281%29)\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>",
    }),
  );
  for (const tag of ["<h2>", "<strong>", "<em>", "<blockquote>", "<ul>", "<hr"])
    assert.ok(html.includes(tag));
  assert.doesNotMatch(html, /<script|onerror=|href="javascript:/i);
});
test("public ReviewSection never renders private or draft text even when passed accidentally", () => {
  const review = {
    id,
    notion_page_id: id,
    content: "PRIVATE_SENTINEL",
    status: "private",
    spoiler: true,
    updated_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    published_at: null,
  } satisfies Review;
  for (const status of ["private", "draft"] as const)
    assert.doesNotMatch(
      renderToStaticMarkup(
        createElement(ReviewSection, { review: { ...review, status } }),
      ),
      /PRIVATE_SENTINEL/,
    );
  const html = renderToStaticMarkup(
    createElement(ReviewSection, {
      review: { ...review, status: "published" },
    }),
  );
  assert.match(html, /PRIVATE_SENTINEL/);
  assert.match(html, /스포일러/);
});
