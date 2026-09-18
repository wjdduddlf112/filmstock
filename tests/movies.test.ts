import assert from "node:assert/strict";
import test from "node:test";
import { mapNotionPageToMovie, mapCover } from "../lib/notion/mapper";
import { shortId, movieSlug, parseMovieId } from "../lib/movies/slug";
import { ratingToStars, starFills } from "../lib/movies/rating";
import {
  normalizeSearch,
  parseCatalogState,
  catalogHref,
  deriveFilterOptions,
  sortMovies,
  queryMovies,
  paginationItems,
} from "../lib/movies/catalog";
import { aggregateStats, splitPeople } from "../lib/stats/aggregate";
import { relatedMovies, selectFeatured } from "../lib/movies/discovery";
import {
  usableCover,
  safeImageUrl,
  canOptimizeCover,
} from "../lib/movies/cover";
import { jsonLd } from "../lib/seo/site";
import type { Movie } from "../types/movie";

function movie(index: number, fields: Partial<Movie> = {}): Movie {
  return {
    ...mapNotionPageToMovie({
      id: `00000000-0000-0000-0000-${String(index).padStart(12, "0")}`,
    }),
    title: `영화 ${index}`,
    ...fields,
  };
}

test("full UUID short IDs are stable and collision-free even for identical prefixes", () => {
  const a = movie(1, { title: "같은 영화! / 第1部" }),
    b = movie(2, { title: a.title });
  assert.notEqual(shortId(a.id), shortId(b.id));
  assert.equal(parseMovieId(movieSlug(a)), a.id);
  assert.equal(parseMovieId(movieSlug({ ...a, title: "새 이름" })), a.id);
  const max = { ...a, id: "ffffffff-ffff-ffff-ffff-ffffffffffff" };
  assert.equal(parseMovieId(movieSlug(max)), max.id);
  assert.equal(parseMovieId("bad"), null);
  assert.equal(parseMovieId("film-zzzzzzzzzzzzzzzzzzzzzzzzz"), null);
  assert.throws(() => shortId("invalid"));
});

test("stars follow every FILM STOCK range boundary without rounding", () => {
  const ranges = [[10,14,1], [15,19,1.5], [20,24,2], [25,29,2.5],
    [30,33,3], [34,38,3.5], [39,43,4], [44,46,4.5], [47,50,5]];
  for (const [low, high, stars] of ranges) {
    for (let tenth = low; tenth <= high; tenth++) {
      assert.equal(ratingToStars(tenth / 10), stars);
      assert.equal(starFills(tenth / 10).reduce((a, b) => a + b, 0) / 100, stars);
    }
  }
  assert.deepEqual(starFills(4.5), [100, 100, 100, 100, 50]);
  assert.deepEqual(starFills(3.8), [100, 100, 100, 50, 0]);
});

test("missing and out-of-range ratings do not invent a star rating", () => {
  for (const rating of [null, undefined, NaN, Infinity, -1, 0, 0.5, 8]) {
    assert.equal(ratingToStars(rating), null);
    assert.deepEqual(starFills(rating), []);
  }
});

test("search normalizes unicode, case, whitespace and searches all specified fields", () => {
  assert.equal(normalizeSearch("  FILM\n  Stock  "), "film stock");
  assert.equal(normalizeSearch("ＦＩＬＭ"), "film");
  const movies = [
    movie(1, {
      title: "필름",
      director: "Director",
      actors: "Some Actor",
      oneLineReview: "좋은 장면",
      tags: ["다시 보기"],
    }),
  ];
  for (const q of [
    "필름",
    "DIRECTOR",
    "some   actor",
    "좋은 장면",
    "다시 보기",
  ])
    assert.equal(queryMovies(movies, parseCatalogState({ q })).total, 1);
  assert.equal(
    queryMovies(movies, parseCatalogState({ q: "없는 영화" })).total,
    0,
  );
});

test("filters intersect and preserve zero ratings, years and URL state", () => {
  const a = movie(1, {
    genres: ["SF"],
    countries: ["한국"],
    ott: ["극장"],
    rating: 0,
    tags: ["기록"],
    watchedDate: "2026-01-01",
    releaseDate: "2025-01-01",
  });
  const state = parseCatalogState({
    genre: "SF",
    country: "한국",
    ott: "극장",
    rating: "0",
    tag: "기록",
    watchedYear: "2026",
    releaseYear: "2025",
    sort: "rating-desc",
    page: "2",
  });
  assert.equal(queryMovies([a, movie(2)], state).total, 1);
  assert.equal(queryMovies([a], { ...state, rating: "1" }).total, 0);
  assert.equal(queryMovies([a], { ...state, country: "없는 국가" }).total, 0);
  assert.deepEqual(
    parseCatalogState(
      Object.fromEntries(
        new URL(catalogHref(state), "https://example.com").searchParams,
      ),
    ),
    state,
  );
  assert.equal(parseCatalogState({ page: "-1", sort: "bad" }).page, 1);
  assert.equal(parseCatalogState({ page: "2.5" }).page, 1);
  assert.deepEqual(deriveFilterOptions([a]).genre, ["SF"]);
  assert.deepEqual(deriveFilterOptions([]).rating, []);
});

test("all sort modes put nulls last and do not mutate input", () => {
  const movies = [
    movie(1, { title: "나" }),
    movie(2, {
      title: "다",
      rating: 0,
      watchedDate: "2024-01-01",
      releaseDate: "2020-01-01",
    }),
    movie(3, {
      title: "가",
      rating: 5,
      watchedDate: "2025-01-01",
      releaseDate: "2021-01-01",
    }),
  ];
  for (const sort of ["watched-desc", "rating-desc", "release-desc"] as const)
    assert.deepEqual(
      sortMovies(movies, sort).map((m) => m.id),
      [movies[2].id, movies[1].id, movies[0].id],
    );
  for (const sort of ["watched-asc", "rating-asc", "release-asc"] as const)
    assert.deepEqual(
      sortMovies(movies, sort).map((m) => m.id),
      [movies[1].id, movies[2].id, movies[0].id],
    );
  assert.deepEqual(
    sortMovies(movies, "title").map((m) => m.title),
    ["가", "나", "다"],
  );
  assert.equal(movies[0].title, "나");
});

test("638 rows paginate into 54 pages with compact controls and clamped URLs", () => {
  const movies = Array.from({ length: 638 }, (_, i) => movie(i));
  const first = queryMovies(movies, parseCatalogState({}));
  assert.equal(first.pages, 54);
  assert.equal(first.movies.length, 12);
  const last = queryMovies(movies, parseCatalogState({ page: "999" }));
  assert.equal(last.page, 54);
  assert.equal(last.movies.length, 2);
  assert.deepEqual(paginationItems(27, 54), [
    1,
    "ellipsis",
    26,
    27,
    28,
    "ellipsis",
    54,
  ]);
  assert.equal(queryMovies([], parseCatalogState({})).total, 0);
});

test("home uses reviewed candidates without duplicates or mutating the dataset", () => {
  const movies = Array.from({ length: 10 }, (_, i) =>
    movie(i, { oneLineReview: i === 0 ? " " : "한줄평" }),
  );
  const selected = selectFeatured([...movies, movies[1]], () => 0.2);
  assert.equal(selected.length, 4);
  assert.equal(new Set(selected.map((m) => m.id)).size, 4);
  assert.ok(selected.every((m) => m.oneLineReview.trim()));
  assert.notDeepEqual(
    selected.map((m) => m.id),
    selectFeatured(movies, () => 0.8).map((m) => m.id),
  );
  assert.equal(selectFeatured([]).length, 0);
  assert.equal(movies[0].oneLineReview, " ");
});

test("people aggregation respects clear separators, not spaces, periods or hyphens", () => {
  assert.deepEqual(
    splitPeople(
      "봉준호, 박찬욱\n김지운 · Jean-Luc Godard / Robert Downey Jr.; O'Connor",
    ),
    [
      "봉준호",
      "박찬욱",
      "김지운",
      "Jean-Luc Godard",
      "Robert Downey Jr.",
      "O'Connor",
    ],
  );
  const stats = aggregateStats([
    movie(1, {
      rating: 0,
      director: "A,A / B",
      actors: "C · D",
      genres: ["SF", "SF"],
      releaseDate: "2025-01-01",
    }),
    movie(2, { rating: 4.5, director: "A", actors: "C" }),
    movie(3),
  ]);
  assert.equal(stats.total, 3);
  assert.equal(stats.rated, 2);
  assert.equal(stats.average, 2.25);
  assert.equal(stats.distribution[0].count, 1);
  assert.equal(stats.distribution[9].count, 1);
  assert.deepEqual(stats.directors, [
    { label: "A", count: 2 },
    { label: "B", count: 1 },
  ]);
  assert.deepEqual(stats.genres, [{ label: "SF", count: 1 }]);
  assert.equal(aggregateStats([]).average, null);
});

test("related movies exclude self and use deterministic relevance tie-breaking", () => {
  const a = movie(1, { director: "A", genres: ["SF"] }),
    b = movie(2, { director: "A", genres: ["SF"] }),
    c = movie(3, { genres: ["SF"] });
  assert.deepEqual(
    relatedMovies(a, [a, c, b]).map((m) => m.id),
    [b.id, c.id],
  );
  assert.deepEqual(relatedMovies(a, [b, a, c]), relatedMovies(a, [c, b, a]));
  assert.deepEqual(relatedMovies(a, [movie(4)]), []);
});

test("cover parsing, expiry and optimization domains fail safely", () => {
  const file = mapCover({
    type: "file",
    file: {
      url: "https://secure.notion-static.com/cover.jpg",
      expiry_time: "2026-09-18T01:00:00Z",
    },
  });
  assert.equal(file?.type, "file");
  assert.equal(usableCover(file, Date.parse("2026-09-18T00:00:00Z")), file);
  assert.equal(usableCover(file, Date.parse("2026-09-18T01:00:00Z")), null);
  assert.equal(
    mapCover({ type: "external", external: { url: "javascript:alert(1)" } }),
    null,
  );
  assert.equal(safeImageUrl("https://user:pass@example.com/a"), null);
  assert.equal(mapCover(null), null);
  assert.equal(
    mapCover({
      type: "external",
      external: { url: "https://example.com/poster.jpg" },
    })?.expiresAt,
    null,
  );
  assert.equal(canOptimizeCover("https://example.com/poster.jpg"), false);
  assert.equal(
    canOptimizeCover("https://secure.notion-static.com/poster.jpg"),
    true,
  );
  assert.equal(
    canOptimizeCover("https://secure.notion-static.com.evil.example/a"),
    false,
  );
});

test("JSON-LD cannot escape its script element", () => {
  assert.equal(
    jsonLd({ name: "</script><script>alert(1)</script>" }).includes("<"),
    false,
  );
});
