"use client";
import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import {
  catalogHref,
  filterLabels,
  sortOptions,
  type CatalogState,
  type FilterOptions,
  type FilterKey,
  type Sort,
} from "@/lib/movies/catalog";

function Fields({
  state,
  options,
  prefix,
}: {
  state: CatalogState;
  options: FilterOptions;
  prefix: string;
}) {
  return (Object.entries(filterLabels) as [FilterKey, string][]).map(
    ([key, label]) => (
      <div className="filter-field" key={key}>
        <label htmlFor={`${prefix}-${key}`}>{label}</label>
        <select name={key} id={`${prefix}-${key}`} defaultValue={state[key]}>
          <option value="">전체</option>
          {state[key] && !options[key].includes(state[key]) && (
            <option value={state[key]}>{state[key]} (결과 없음)</option>
          )}
          {options[key].map((value) => (
            <option key={value} value={value}>
              {key === "review"
                ? value === "yes"
                  ? "리뷰 있음"
                  : "리뷰 없음"
                : value}
              {key === "rating" ? "점 이상" : ""}
            </option>
          ))}
        </select>
      </div>
    ),
  );
}
export function FilterPanel({
  state,
  options,
}: {
  state: CatalogState;
  options: FilterOptions;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const active = Object.keys(filterLabels).filter(
    (key) => state[key as FilterKey],
  ).length;
  function apply(form: HTMLFormElement) {
    const data = new FormData(form);
    const next = { ...state, page: 1 };
    for (const key of Object.keys(filterLabels) as FilterKey[])
      next[key] = String(data.get(key) ?? "");
    startTransition(() => router.push(catalogHref(next)));
    dialog.current?.close();
  }
  const reset = () => {
    startTransition(() => router.push("/films"));
    dialog.current?.close();
  };
  return (
    <>
      <aside className="filter-sidebar">
        <div className="filter-heading">
          <h2>필터</h2>
          <button
            type="button"
            className="icon-button"
            onClick={reset}
            title="필터 전체 초기화"
            aria-label="필터 전체 초기화"
          >
            <RotateCcw size={17} />
          </button>
        </div>
        <form
          key={catalogHref(state)}
          onSubmit={(e) => {
            e.preventDefault();
            apply(e.currentTarget);
          }}
          aria-busy={pending}
        >
          <Fields state={state} options={options} prefix="desktop" />
          <button className="button button-full" disabled={pending}>
            {pending ? "적용 중…" : "필터 적용"}
          </button>
        </form>
      </aside>
      <button
        type="button"
        className="text-button mobile-filter-button"
        onClick={() => dialog.current?.showModal()}
      >
        <SlidersHorizontal size={18} />
        필터{active > 0 ? ` (${active})` : ""}
      </button>
      <dialog
        ref={dialog}
        className="filter-dialog"
        aria-labelledby="mobile-filter-heading"
        onClick={(e) => {
          if (e.currentTarget === e.target) dialog.current?.close();
        }}
      >
        <div className="dialog-heading">
          <h2 id="mobile-filter-heading">필터</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="필터 닫기"
            title="닫기"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
        </div>
        <form
          key={catalogHref(state)}
          onSubmit={(e) => {
            e.preventDefault();
            apply(e.currentTarget);
          }}
        >
          <Fields state={state} options={options} prefix="mobile" />
          <div className="filter-actions">
            <button type="button" className="text-button" onClick={reset}>
              <RotateCcw size={16} />
              초기화
            </button>
            <button className="button" disabled={pending}>
              필터 적용
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
export function SortControl({ state }: { state: CatalogState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className="sort-control">
      <span className="sr-only">영화 정렬</span>
      <select
        aria-label="영화 정렬"
        value={state.sort}
        disabled={pending}
        onChange={(e) => {
          const sort = e.target.value as Sort;
          startTransition(() =>
            router.push(catalogHref({ ...state, sort, page: 1 })),
          );
        }}
      >
        {Object.entries(sortOptions).map(([value, label]) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
