import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { getMovies } from "@/lib/notion/movies";
import { parseMovieId, movieHref } from "@/lib/movies/slug";
import { usableCover } from "@/lib/movies/cover";
import { asReview } from "@/lib/reviews/helpers";
import { AccessState } from "@/components/admin/AccessState";
import { ReviewEditor } from "@/components/admin/ReviewEditor";
import { Poster } from "@/components/movie/Poster";
import { Rating } from "@/components/movie/Rating";
export default async function EditReview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const access = await getAdminAccess();
  if (access.kind !== "admin")
    return <AccessState kind={access.kind} next={`/admin/film/${slug}/edit`} />;
  const id = parseMovieId(slug);
  if (!id) notFound();
  const movie = (await getMovies()).find((m) => m.id.toLowerCase() === id);
  if (!movie) notFound();
  const { data, error } = await access.supabase
    .from("reviews")
    .select(
      "id,notion_page_id,content,status,spoiler,created_at,updated_at,published_at",
    )
    .eq("notion_page_id", movie.id)
    .maybeSingle();
  const review = asReview(data);
  if (error || (data && !review))
    return (
      <section className="shell admin-state">
        <h1>리뷰를 불러오지 못했습니다.</h1>
        <p>
          기존 리뷰를 보호하기 위해 편집기를 열지 않았습니다. 연결과 권한을
          확인해 주세요.
        </p>
        <Link href="/admin">관리자로 돌아가기</Link>
      </section>
    );
  return (
    <div className="shell admin-page">
      <nav className="editor-nav">
        <Link href="/admin">Admin</Link>
        <Link href={movieHref(movie)} prefetch={false}>
          공개 영화 페이지
        </Link>
      </nav>
      <header className="editor-film">
        <div className="editor-poster">
          <Poster
            cover={usableCover(movie.cover)}
            title={movie.title}
            sizes="100px"
          />
        </div>
        <div>
          <p className="eyebrow accent">REVIEW</p>
          <h1>{movie.title}</h1>
          <p>{movie.director}</p>
          <Rating rating={movie.rating} />
          <p className="muted">{movie.oneLineReview}</p>
        </div>
      </header>
      <ReviewEditor key={movie.id} pageId={movie.id} initial={review} movieUrl={movieHref(movie)} />
    </div>
  );
}
