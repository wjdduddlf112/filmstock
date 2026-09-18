import type { Movie } from "@/types/movie";

export const PAGE_SIZE = 12;
export const sortOptions = {
  "watched-desc": "최근 관람순",
  "watched-asc": "오래된 관람순",
  "rating-desc": "평점 높은순",
  "rating-asc": "평점 낮은순",
  "release-desc": "개봉 최신순",
  "release-asc": "개봉 오래된순",
  title: "제목 가나다순",
} as const;
export type Sort = keyof typeof sortOptions;
export const filterLabels = {
  genre: "장르",
  country: "국가",
  ott: "OTT",
  rating: "최소 평점",
  watchedYear: "관람연도",
  releaseYear: "개봉연도",
  tag: "태그",
  review: "리뷰 여부",
} as const;
export type FilterKey = keyof typeof filterLabels;
export type CatalogState = Record<FilterKey | "q", string> & {
  sort: Sort;
  page: number;
};
export type FilterOptions = Record<FilterKey, string[]>;
export type Query = Record<string, string | string[] | undefined>;
const collator = new Intl.Collator("ko", { numeric: true });

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ko")
    .trim()
    .replace(/\s+/g, " ");
}

export function parseCatalogState(query: Query): CatalogState {
  const value = (key: string) =>
    typeof query[key] === "string" ? (query[key] as string) : "";
  const page = Number(value("page"));
  const sort = value("sort");
  return {
    q: normalizeSearch(value("q")).slice(0, 300),
    genre: value("genre"),
    country: value("country"),
    ott: value("ott"),
    rating: value("rating"),
    watchedYear: value("watchedYear"),
    releaseYear: value("releaseYear"),
    tag: value("tag"),
    review: ["yes", "no"].includes(value("review")) ? value("review") : "",
    sort: Object.hasOwn(sortOptions, sort) ? (sort as Sort) : "watched-desc",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function catalogHref(state: Partial<CatalogState>): string {
  const params = new URLSearchParams();
  for (const key of [
    "q",
    ...Object.keys(filterLabels),
    "sort",
    "page",
  ] as (keyof CatalogState)[]) {
    const value = state[key];
    if (
      value &&
      !(key === "page" && value === 1) &&
      !(key === "sort" && value === "watched-desc")
    )
      params.set(key, String(value));
  }
  return `/films${params.size ? `?${params}` : ""}`;
}

export function deriveFilterOptions(movies: Movie[]): FilterOptions {
  const unique = (values: string[]) =>
    [...new Set(values.filter(Boolean))].sort(collator.compare);
  return {
    genre: unique(movies.flatMap((m) => m.genres)),
    review: ["yes", "no"],
    country: unique(movies.flatMap((m) => m.countries)),
    ott: unique(movies.flatMap((m) => m.ott)),
    tag: unique(movies.flatMap((m) => m.tags)),
    rating: unique(
      movies.flatMap((m) => (m.rating === null ? [] : [String(m.rating)])),
    ).sort((a, b) => Number(a) - Number(b)),
    watchedYear: unique(
      movies.flatMap((m) => (m.watchedDate ? [m.watchedDate.slice(0, 4)] : [])),
    ).reverse(),
    releaseYear: unique(
      movies.flatMap((m) => (m.releaseDate ? [m.releaseDate.slice(0, 4)] : [])),
    ).reverse(),
  };
}

export function sortMovies(movies: Movie[], sort: Sort): Movie[] {
  const compareNullable = (
    a: number | null,
    b: number | null,
    direction: number,
  ) =>
    a === null ? (b === null ? 0 : 1) : b === null ? -1 : (a - b) * direction;
  return [...movies].sort((a, b) => {
    let diff = 0;
    if (sort === "title") diff = collator.compare(a.title, b.title);
    else if (sort.startsWith("rating"))
      diff = compareNullable(a.rating, b.rating, sort.endsWith("asc") ? 1 : -1);
    else {
      const field = sort.startsWith("release") ? "releaseDate" : "watchedDate";
      diff = compareNullable(
        a[field] ? Date.parse(a[field]) : null,
        b[field] ? Date.parse(b[field]) : null,
        sort.endsWith("asc") ? 1 : -1,
      );
    }
    return (
      diff || collator.compare(a.title, b.title) || a.id.localeCompare(b.id)
    );
  });
}

export function queryMovies(
  movies: Movie[],
  state: CatalogState,
  published: ReadonlySet<string> = new Set(),
) {
  const words = state.q.split(" ").filter(Boolean);
  const filtered = movies.filter((m) => {
    const haystack = normalizeSearch(
      [m.title, m.director, m.actors, m.oneLineReview, ...m.tags].join(" "),
    );
    return (
      words.every((word) => haystack.includes(word)) &&
      (!state.review ||
        published.has(m.id.toLowerCase()) === (state.review === "yes")) &&
      (!state.genre || m.genres.includes(state.genre)) &&
      (!state.country || m.countries.includes(state.country)) &&
      (!state.ott || m.ott.includes(state.ott)) &&
      (!state.tag || m.tags.includes(state.tag)) &&
      (!state.rating ||
        (m.rating !== null &&
          Number.isFinite(Number(state.rating)) &&
          m.rating >= Number(state.rating))) &&
      (!state.watchedYear ||
        m.watchedDate?.slice(0, 4) === state.watchedYear) &&
      (!state.releaseYear || m.releaseDate?.slice(0, 4) === state.releaseYear)
    );
  });
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(state.page, pages);
  return {
    total,
    pages,
    page,
    movies: sortMovies(filtered, state.sort).slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE,
    ),
  };
}

export function paginationItems(
  page: number,
  pages: number,
): (number | "ellipsis")[] {
  const numbers = [
    ...new Set(
      [1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages),
    ),
  ].sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  numbers.forEach((n, i) => {
    if (i > 0 && n - numbers[i - 1] > 1) result.push("ellipsis");
    result.push(n);
  });
  return result;
}
