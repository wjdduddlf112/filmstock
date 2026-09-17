import { MovieCard } from "@/components/MovieCard";
import { getMovies, logMovieLoadError } from "@/lib/notion/movies";
import type { Movie } from "@/types/movie";

export const dynamic = "force-dynamic";

export default async function Home() {
  let movies: Movie[] = [];
  let failed = false;
  try {
    movies = await getMovies();
  } catch (error) {
    failed = true;
    logMovieLoadError(error);
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-3 border-b border-zinc-300 pb-5">
        <h1 className="text-3xl font-bold">FILM STOCK</h1>
        {!failed && <p className="text-sm text-zinc-600">{movies.length}편의 영화</p>}
      </header>
      {failed ? (
        <p role="alert" className="border-l-2 border-red-700 py-3 pl-4 text-sm text-red-800">
          영화 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : movies.length === 0 ? (
        <p className="py-12 text-center text-zinc-600">아직 기록된 영화가 없습니다.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {movies.map((movie) => <li key={movie.id} className="min-w-0"><MovieCard movie={movie} /></li>)}
        </ul>
      )}
    </main>
  );
}
