import Link from "next/link";
import { ArrowRight, Film } from "lucide-react";
export function EmptyState({
  title = "아직 기록된 영화가 없습니다.",
  description,
  reset = false,
}: {
  title?: string;
  description?: string;
  reset?: boolean;
}) {
  return (
    <div className="empty-state">
      <Film size={30} strokeWidth={1} />
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {reset && (
        <Link href="/films" className="text-link">
          전체 영화 보기
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function Loading() {
  return (
    <div
      className="shell loading-state"
      role="status"
      aria-label="영화를 불러오는 중"
    >
      <div className="skeleton skeleton-title" />
      <div className="skeleton-grid">
        {[1, 2, 3].map((i) => (
          <div className="skeleton skeleton-poster" key={i} />
        ))}
      </div>
      <span className="sr-only">영화를 불러오는 중입니다.</span>
    </div>
  );
}
