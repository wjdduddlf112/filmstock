import { Star } from "lucide-react";
import { starFills } from "@/lib/movies/rating";
export function Rating({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="unrated">평점 미기록</span>;
  return (
    <span className="rating" aria-label={`5점 만점에 ${rating}점`}>
      <span className="stars" aria-hidden="true">
        {starFills(rating).map((fill, i) => (
          <span key={i} className="star">
            <Star className="star-empty" />
            <span className="star-fill" style={{ width: `${fill}%` }}>
              <Star />
            </span>
          </span>
        ))}
      </span>
      <span className="rating-number" aria-hidden="true">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}
