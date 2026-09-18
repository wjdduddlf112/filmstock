import type { Review } from "@/types/review";
import { Markdown } from "@/components/review/Markdown";
export function ReviewSection({ review }: { review?: Review | null }) {
  const published = review?.status === "published" ? review : null;
  return (
    <section className="review-section" aria-labelledby="review-heading">
      <div className="section-heading">
        <h2 id="review-heading">Review</h2>
        <span className="eyebrow">영화의 여운</span>
      </div>
      {published ? (
        <>
          {published.spoiler && (
            <p className="spoiler-warning">
              이 리뷰에는 스포일러가 포함되어 있습니다.
            </p>
          )}
          <Markdown content={published.content} />
        </>
      ) : (
        <p className="review-empty">아직 리뷰를 작성하지 않았습니다.</p>
      )}
    </section>
  );
}
