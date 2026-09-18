import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ReviewAction } from "@/components/admin/ReviewAction";
import { getPublishedIds, getPublishedReview } from "@/lib/reviews/public";
import { connection } from "next/server";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getMovies } from "@/lib/notion/movies";
import {
  parseMovieId,
  isCanonicalMovieSlug,
  movieHref,
} from "@/lib/movies/slug";
import { relatedMovies } from "@/lib/movies/discovery";
import { usableCover } from "@/lib/movies/cover";
import { splitPeople } from "@/lib/stats/aggregate";
import { jsonLd, siteUrl } from "@/lib/seo/site";
import { Poster } from "@/components/movie/Poster";
import { Rating } from "@/components/movie/Rating";
import { MovieCard } from "@/components/movie/MovieCard";
import { ReviewSection } from "@/components/movie/ReviewSection";
import { ShareButtons } from "@/components/movie/ShareButtons";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const id = parseMovieId(slug);
  if (!id)
    return { title: "영화를 찾을 수 없습니다", robots: { index: false } };
  const movie = (await getMovies()).find((m) => m.id.toLowerCase() === id);
  if (!movie)
    return { title: "영화를 찾을 수 없습니다", robots: { index: false } };
  const title = movie.title || "제목 없음";
  const review = await getPublishedReview(movie.id);
  const description = `${(movie.oneLineReview || `${title}의 영화 정보와 평점.`).slice(0, 140)}${review ? " FILM STOCK의 긴 리뷰를 만나보세요." : " FILM STOCK 개인 영화 아카이브."}`;
  return {
    title,
    description,
    alternates: { canonical: movieHref(movie) },
    openGraph: {
      title,
      description,
      type: "article",
      url: movieHref(movie),
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}
export default async function FilmDetail({ params }: Props) {
  await connection();
  const { slug } = await params;
  const id = parseMovieId(slug);
  if (!id) notFound();
  const movies = await getMovies();
  const movie = movies.find((m) => m.id.toLowerCase() === id);
  if (!movie) notFound();
  if (!isCanonicalMovieSlug(slug, movie)) permanentRedirect(movieHref(movie));
  const related = relatedMovies(movie, movies);
  const review = await getPublishedReview(movie.id);
  const published = await getPublishedIds();
  const url = `${siteUrl()}${movieHref(movie)}`;
  const fields = [
    ["감독", movie.director],
    ["배우", movie.actors],
    ["장르", movie.genres.join(" · ")],
    ["국가", movie.countries.join(" · ")],
    ["상영시간", movie.runtime === null ? "" : `${movie.runtime}분`],
    ["개봉일", movie.releaseDate?.slice(0, 10)],
  ];
  return (
    <div className="shell detail-page">
      <Link className="back-link" href="/films">
        <ArrowLeft size={16} />
        Films
      </Link>
      <section className="film-detail">
        <div className="detail-poster">
          <Poster
            cover={usableCover(movie.cover)}
            title={movie.title}
            priority
            sizes="(max-width: 700px) 70vw, 360px"
          />
        </div>
        <div className="detail-copy">
          <p className="eyebrow accent">
            FILM / {movie.releaseDate?.slice(0, 4) || "ARCHIVE"}
          </p>
          <h1>{movie.title || "제목 없음"}</h1>
          <Rating rating={movie.rating} />
          <blockquote>
            {movie.oneLineReview || "아직 한줄평이 없습니다."}
          </blockquote>
          <dl className="detail-metadata">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || "미기록"}</dd>
              </div>
            ))}
          </dl>
          <ShareButtons title={movie.title} url={url} />
          <Suspense fallback={null}>
            <ReviewAction pageId={movie.id} href={movieHref(movie)} />
          </Suspense>
        </div>
      </section>
      <ReviewSection review={review} />
      {related.length > 0 && (
        <section className="related-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">KEEP WATCHING</p>
              <h2>이어지는 영화들</h2>
            </div>
          </div>
          <div className="movie-grid related-grid">
            {related.map((m) => (
              <MovieCard
                key={m.id}
                movie={m}
                hasReview={published.has(m.id.toLowerCase())}
              />
            ))}
          </div>
        </section>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Movie",
            name: movie.title,
            url,
            description: movie.oneLineReview || undefined,
            datePublished: movie.releaseDate?.slice(0, 10),
            genre: movie.genres,
            director: splitPeople(movie.director).map((name) => ({
              "@type": "Person",
              name,
            })),
            actor: splitPeople(movie.actors).map((name) => ({
              "@type": "Person",
              name,
            })),
            countryOfOrigin: movie.countries.map((name) => ({
              "@type": "Country",
              name,
            })),
            duration:
              movie.runtime !== null && movie.runtime > 0
                ? `PT${movie.runtime}M`
                : undefined,
          }),
        }}
      />
    </div>
  );
}
