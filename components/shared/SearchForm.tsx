import { Search, ArrowRight } from "lucide-react";
import type { CatalogState } from "@/lib/movies/catalog";

export function SearchForm({
  query = "",
  state,
  compact = false,
}: {
  query?: string;
  state?: CatalogState;
  compact?: boolean;
}) {
  return (
    <form
      action="/films"
      role="search"
      className={`search-form ${compact ? "search-compact" : ""}`}
    >
      <Search size={compact ? 18 : 22} aria-hidden="true" />
      <input
        type="search"
        name="q"
        aria-label="영화 검색"
        placeholder={compact ? "영화 검색" : "영화, 감독, 배우를 찾아보세요"}
        defaultValue={query}
        maxLength={300}
      />
      {state &&
        Object.entries(state)
          .filter(([key, value]) => !["q", "page"].includes(key) && value)
          .map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
      <button
        className="icon-button"
        type="submit"
        aria-label="검색"
        title="검색"
      >
        <ArrowRight size={20} />
      </button>
    </form>
  );
}
