import type { Movie } from "@/types/movie";
import { splitPeople } from "@/lib/stats/aggregate";

export function homeCandidates(movies: Movie[]): Movie[] {
  return movies.filter((movie) => movie.oneLineReview.trim().length > 0);
}

export function selectFeatured(movies: Movie[], random = Math.random): Movie[] {
  const pool = [
    ...new Map(homeCandidates(movies).map((m) => [m.id, m])).values(),
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 4);
}

export function relatedMovies(
  movie: Movie,
  movies: Movie[],
  limit = 4,
): Movie[] {
  const overlap = (a: string[], b: string[]) =>
    a.filter((value) => b.includes(value)).length;
  const score = (other: Movie) =>
    overlap(splitPeople(movie.director), splitPeople(other.director)) * 5 +
    overlap(movie.genres, other.genres) * 3 +
    overlap(movie.tags, other.tags) * 2 +
    overlap(movie.countries, other.countries);
  return movies
    .filter((other) => other.id !== movie.id)
    .map((other) => ({ movie: other, score: score(other) }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.movie.rating ?? -1) - (a.movie.rating ?? -1) ||
        a.movie.id.localeCompare(b.movie.id),
    )
    .slice(0, limit)
    .map((item) => item.movie);
}
