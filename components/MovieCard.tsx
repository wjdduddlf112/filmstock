import type { Movie } from "@/types/movie";

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <article className="h-full rounded-lg border border-zinc-200 bg-white p-5 [overflow-wrap:anywhere]">
      <h2 className="text-xl font-semibold">{movie.title || "제목 없음"}</h2>
      <dl className="mt-4 grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm leading-6">
        <dt className="text-zinc-500">감독</dt>
        <dd>{movie.director || "미기록"}</dd>
        <dt className="text-zinc-500">평점</dt>
        <dd className="font-medium text-emerald-800">{movie.rating === null ? "미기록" : `${movie.rating} / 5`}</dd>
        <dt className="text-zinc-500">장르</dt>
        <dd>{movie.genres.join(" · ") || "미기록"}</dd>
        <dt className="text-zinc-500">관람일</dt>
        <dd>{movie.watchedDate ? <time dateTime={movie.watchedDate}>{movie.watchedDate.slice(0, 10)}</time> : "미기록"}</dd>
      </dl>
      <p className="mt-5 border-t border-zinc-100 pt-4 text-sm leading-7 whitespace-pre-wrap text-zinc-700">
        {movie.oneLineReview || "한줄평이 없습니다."}
      </p>
    </article>
  );
}
