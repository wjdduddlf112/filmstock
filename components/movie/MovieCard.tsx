import Link from "next/link";
import type { Movie } from "@/types/movie";
import { movieHref } from "@/lib/movies/slug";
import { usableCover } from "@/lib/movies/cover";
import { Rating } from "./Rating";
import { Poster } from "./Poster";
export function MovieCard({
  movie,
  hasReview = false,
}: {
  movie: Movie;
  hasReview?: boolean;
}) {
  return (
    <article className="movie-card">
      <Link
        href={movieHref(movie)}
        prefetch={false}
        className="movie-card-link"
      >
        <div className="card-visual">
          {hasReview && <span className="review-badge">REVIEW</span>}
          <Poster cover={usableCover(movie.cover)} title={movie.title} />
          <dl className="card-hover-meta">
            <div>
              <dt>개봉</dt>
              <dd>{movie.releaseDate?.slice(0, 4) || "미기록"}</dd>
            </div>
            <div>
              <dt>국가</dt>
              <dd>{movie.countries.join(" · ") || "미기록"}</dd>
            </div>
            <div>
              <dt>상영시간</dt>
              <dd>
                {movie.runtime === null ? "미기록" : `${movie.runtime}분`}
              </dd>
            </div>
          </dl>
        </div>
        <div className="card-copy">
          <h3>{movie.title || "제목 없음"}</h3>
          <p className="card-director">{movie.director || "감독 미기록"}</p>
          <Rating rating={movie.rating} />
          <p className="card-genres">
            {movie.genres.join(" · ") || "장르 미기록"}
          </p>
          <p className="card-review">
            {movie.oneLineReview || "아직 한줄평이 없습니다."}
          </p>
        </div>
      </Link>
    </article>
  );
}
