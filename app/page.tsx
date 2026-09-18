import Link from "next/link";
import { connection } from "next/server";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { getMovies } from "@/lib/notion/movies";
import { selectHomeMovies } from "@/lib/reviews/helpers";
import { getPublishedIds } from "@/lib/reviews/public";
import { movieHref } from "@/lib/movies/slug";
import { usableCover } from "@/lib/movies/cover";
import { Poster } from "@/components/movie/Poster";
import { Rating } from "@/components/movie/Rating";
import { MovieCard } from "@/components/movie/MovieCard";
import { SearchForm } from "@/components/shared/SearchForm";
import { EmptyState } from "@/components/shared/States";
export const metadata = { alternates: { canonical: "/" } };
export default async function Home() {
  await connection();
  const [movies, published] = await Promise.all([getMovies(), getPublishedIds()]);
  const [featured, ...picks] = selectHomeMovies(movies, published);
  return (
    <div className="shell home-page">
      <div className="home-search">
        <span className="eyebrow">A PERSONAL CINEMA ARCHIVE</span>
        <SearchForm />
      </div>
      {featured ? (
        <>
          <section className="featured">
            <div className="featured-poster">
              <Link href={movieHref(featured)} prefetch={false}>
                <Poster
                  cover={usableCover(featured.cover)}
                  title={featured.title}
                  priority
                  sizes="(max-width: 700px) 65vw, 330px"
                />
              </Link>
            </div>
            <div className="featured-copy">
              {published.has(featured.id.toLowerCase()) && (
                <span className="review-label">REVIEW</span>
              )}
              <p className="eyebrow accent">IN THE SPOTLIGHT</p>
              <h1>{featured.title || "제목 없음"}</h1>
              <p className="featured-director">
                {featured.director || "감독 미기록"}
              </p>
              <Rating rating={featured.rating} />
              <p className="muted">
                {featured.genres.join(" · ") || "장르 미기록"}
              </p>
              <blockquote>{featured.oneLineReview}</blockquote>
              <Link
                className="button"
                href={movieHref(featured)}
                prefetch={false}
              >
                영화 자세히 보기
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </section>
          {picks.length > 0 && (
            <section className="home-picks">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">ANOTHER FRAME</p>
                  <h2>우연히 만난 영화</h2>
                </div>
                <Link className="text-link" href="/films">
                  모든 영화
                  <ArrowRight size={16} />
                </Link>
              </div>
              <div className="movie-grid home-grid">
                {picks.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    hasReview={published.has(movie.id.toLowerCase())}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <EmptyState
          title={
            movies.length ? "아직 한줄평이 기록되지 않았습니다." : undefined
          }
          reset={movies.length > 0}
        />
      )}
    </div>
  );
}
