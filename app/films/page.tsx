import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { X } from "lucide-react";
import { getMovies } from "@/lib/notion/movies";
import {
  parseCatalogState,
  queryMovies,
  deriveFilterOptions,
  filterLabels,
  catalogHref,
  type FilterKey,
  type Query,
} from "@/lib/movies/catalog";
import { SearchForm } from "@/components/shared/SearchForm";
import { MovieCard } from "@/components/movie/MovieCard";
import { FilterPanel, SortControl } from "@/components/filters/CatalogControls";
import { Pagination } from "@/components/filters/Pagination";
import { EmptyState } from "@/components/shared/States";
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Query>;
}): Promise<Metadata> {
  const query = await searchParams;
  return {
    title: "Films",
    description:
      "FILM STOCK의 전체 영화 아카이브. 감독, 장르, 평점으로 영화를 발견하세요.",
    alternates: { canonical: "/films" },
    robots: Object.keys(query).length
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}
export default async function Films({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  await connection();
  const state = parseCatalogState(await searchParams);
  const movies = await getMovies();
  const result = queryMovies(movies, state);
  if (result.page !== state.page)
    redirect(catalogHref({ ...state, page: result.page }));
  const selected = (Object.keys(filterLabels) as FilterKey[]).filter(
    (key) => state[key],
  );
  return (
    <div className="shell archive-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">THE COLLECTION</p>
          <h1>
            Films<span className="heading-count">{movies.length}</span>
          </h1>
        </div>
        <p>한 편씩 쌓아온 영화의 기록.</p>
      </header>
      <div className="archive-layout">
        <FilterPanel state={state} options={deriveFilterOptions(movies)} />
        <section className="archive-results" aria-label="영화 검색 결과">
          <SearchForm key={state.q} query={state.q} state={state} />
          {(selected.length > 0 || state.q) && (
            <div className="active-filters">
              {state.q && (
                <Link
                  href={catalogHref({ ...state, q: "", page: 1 })}
                  className="filter-chip"
                >
                  검색: {state.q}
                  <X size={14} />
                  <span className="sr-only">검색어 제거</span>
                </Link>
              )}
              {selected.map((key) => (
                <Link
                  key={key}
                  className="filter-chip"
                  href={catalogHref({ ...state, [key]: "", page: 1 })}
                >
                  {filterLabels[key]}: {state[key]}
                  <X size={14} />
                  <span className="sr-only">필터 제거</span>
                </Link>
              ))}
              <Link className="reset-link" href="/films">
                전체 초기화
              </Link>
            </div>
          )}
          <div className="results-toolbar">
            <p aria-live="polite">
              <strong>{result.total}</strong>편
              {result.total > 0 && (
                <span className="muted">
                  {" "}
                  · {result.page} / {result.pages} 페이지
                </span>
              )}
            </p>
            <SortControl state={state} />
          </div>
          {result.total ? (
            <div className="movie-grid archive-grid">
              {result.movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={movies.length ? "조건에 맞는 영화가 없습니다." : undefined}
              description={
                movies.length ? "다른 검색어나 필터로 찾아보세요." : undefined
              }
              reset={movies.length > 0}
            />
          )}
          <Pagination state={state} page={result.page} pages={result.pages} />
        </section>
      </div>
    </div>
  );
}
