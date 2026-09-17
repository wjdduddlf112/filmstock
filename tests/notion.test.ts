import assert from "node:assert/strict";
import test from "node:test";
import { mapNotionPageToMovie, sortMoviesByWatchedDate } from "../lib/notion/mapper";
import { collectPages } from "../lib/notion/pagination";

test("maps Korean Notion properties and ignores formulas", () => {
  const movie = mapNotionPageToMovie({ id: "movie", properties: {
    이름: { type: "title", title: [{ plain_text: "Film " }, { plain_text: "Stock" }] },
    감독: { type: "rich_text", rich_text: [{ plain_text: "Director" }] },
    배우: { type: "rich_text", rich_text: [{ plain_text: "Actor" }] },
    개봉일: { type: "date", date: { start: "2025-01-01" } },
    관람일: { type: "date", date: { start: "2026-09-17" } },
    국가: { type: "multi_select", multi_select: [{ name: "한국" }] },
    장르: { type: "multi_select", multi_select: [{ name: "드라마" }, { name: "SF" }] },
    OTT: { type: "multi_select", multi_select: [{ name: "Netflix" }] },
    상영시간: { type: "number", number: 120 },
    "상영 시간": { type: "formula", formula: { string: "wrong" } },
    평점: { type: "number", number: 4.5 },
    별점: { type: "formula", formula: { number: 1 } },
    한줄평: { type: "rich_text", rich_text: [{ plain_text: "Review" }] },
    태그: { type: "multi_select", multi_select: [{ name: "재관람" }] },
  } });
  assert.deepEqual(movie, {
    id: "movie", title: "Film Stock", director: "Director", actors: "Actor",
    releaseDate: "2025-01-01", watchedDate: "2026-09-17", countries: ["한국"],
    genres: ["드라마", "SF"], ott: ["Netflix"], runtime: 120, rating: 4.5,
    oneLineReview: "Review", tags: ["재관람"],
  });
});

test("missing, empty, malformed and wrong-type properties use defaults", () => {
  const blank = mapNotionPageToMovie({ id: "empty" });
  assert.deepEqual(blank, {
    id: "empty", title: "", director: "", actors: "", releaseDate: null,
    watchedDate: null, countries: [], genres: [], ott: [], runtime: null,
    rating: null, oneLineReview: "", tags: [],
  });
  assert.deepEqual(mapNotionPageToMovie({ id: "empty", properties: {
    이름: { type: "title", title: [null, { plain_text: 42 }] },
    감독: { type: "number", number: 1 },
    배우: { type: "rich_text", rich_text: null },
    관람일: { type: "date", date: { start: "invalid" } },
    개봉일: { type: "date", date: null },
    국가: { type: "multi_select", multi_select: [null, { name: 42 }] },
    장르: { type: "select", select: { name: "SF" } },
    OTT: null, 상영시간: { type: "number", number: "120" },
    평점: { type: "number", number: NaN },
  } }), blank);
  assert.equal(mapNotionPageToMovie({ id: "zero", properties: {
    평점: { type: "number", number: 0 },
  } }).rating, 0);
});

test("sorts newest watched dates first, missing dates last, without mutation", () => {
  const base = mapNotionPageToMovie({ id: "blank" });
  const movies = [base, { ...base, id: "older", watchedDate: "2025-01-01" }, { ...base, id: "newer", watchedDate: "2026-01-01" }];
  assert.deepEqual(sortMoviesByWatchedDate(movies).map((movie) => movie.id), ["newer", "older", "blank"]);
  assert.equal(movies[0].id, "blank");
});

test("paginates beyond 100 rows and continues through an empty result page", async () => {
  const calls: (string | undefined)[] = [];
  const rows = Array.from({ length: 100 }, (_, i) => i);
  const result = await collectPages(async (cursor) => {
    calls.push(cursor);
    if (!cursor) return { results: rows, has_more: true, next_cursor: "second" };
    if (cursor === "second") return { results: [], has_more: true, next_cursor: "third" };
    return { results: [100], has_more: false, next_cursor: null };
  });
  assert.deepEqual(calls, [undefined, "second", "third"]);
  assert.deepEqual(result, [...rows, 100]);
});

test("handles empty sources and rejects errors instead of returning partial data", async () => {
  assert.deepEqual(await collectPages(async () => ({ results: [], has_more: false, next_cursor: null })), []);
  await assert.rejects(collectPages(async () => ({ results: [], has_more: true, next_cursor: null })), /cursor/);
  await assert.rejects(collectPages(async () => ({ results: [], has_more: true, next_cursor: "repeated" })), /cursor/);
  await assert.rejects(collectPages(async (cursor) => {
    if (cursor) throw new Error("API unavailable");
    return { results: [1], has_more: true, next_cursor: "next" };
  }), /API unavailable/);
  await assert.rejects(collectPages(async () => ({ results: [1], has_more: false, next_cursor: null, request_status: { type: "incomplete" } })), /limit/);
});
