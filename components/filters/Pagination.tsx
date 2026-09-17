import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  catalogHref,
  paginationItems,
  type CatalogState,
} from "@/lib/movies/catalog";
export function Pagination({
  state,
  page,
  pages,
}: {
  state: CatalogState;
  page: number;
  pages: number;
}) {
  if (pages < 2) return null;
  return (
    <nav aria-label="영화 목록 페이지" className="pagination">
      {page > 1 ? (
        <Link
          className="icon-button"
          href={catalogHref({ ...state, page: page - 1 })}
          prefetch={false}
          aria-label="이전 페이지"
        >
          <ChevronLeft size={18} />
        </Link>
      ) : (
        <span className="icon-button disabled" aria-disabled="true">
          <ChevronLeft size={18} />
        </span>
      )}
      {paginationItems(page, pages).map((item, i) =>
        item === "ellipsis" ? (
          <span className="ellipsis" key={`gap-${i}`}>
            …
          </span>
        ) : (
          <Link
            key={item}
            href={catalogHref({ ...state, page: item })}
            prefetch={false}
            aria-current={item === page ? "page" : undefined}
            aria-label={`${item}페이지`}
          >
            {item}
          </Link>
        ),
      )}
      {page < pages ? (
        <Link
          className="icon-button"
          href={catalogHref({ ...state, page: page + 1 })}
          prefetch={false}
          aria-label="다음 페이지"
        >
          <ChevronRight size={18} />
        </Link>
      ) : (
        <span className="icon-button disabled" aria-disabled="true">
          <ChevronRight size={18} />
        </span>
      )}
    </nav>
  );
}
