"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  Quote,
  Heading2,
  Minus,
  Save,
  Eye,
  Code,
} from "lucide-react";
import { Markdown } from "@/components/review/Markdown";
import {
  reviewTemplate,
  reviewStatusLabels,
  MAX_REVIEW_LENGTH,
} from "@/lib/reviews/helpers";
import { createSaveQueue } from "@/lib/reviews/save-queue";
import { saveReview } from "@/app/admin/actions";
import type { Review, ReviewDraft, ReviewStatus } from "@/types/review";

export function ReviewEditor({
  pageId,
  initial,
  movieUrl,
}: {
  pageId: string;
  initial: Review | null;
  movieUrl: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ReviewDraft>(() => ({
    content: initial?.content ?? reviewTemplate,
    status: initial?.status ?? "draft",
    spoiler: initial?.spoiler ?? false,
  }));
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState(
    initial ? "저장됨" : "아직 저장하지 않음",
  );
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(0);
  const [saveMode, setSaveMode] = useState<"manual" | "auto">("manual");
  const saving = useRef(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locked, setLocked] = useState(false);
  const [savedTick, setSavedTick] = useState(0);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const latest = useRef(draft);
  const saved = useRef(JSON.stringify(draft));
  const blocked = useRef(false);
  const [enqueue] = useState(() =>
    createSaveQueue(initial?.updated_at ?? null, (value, version) =>
      saveReview({ ...value, notionPageId: pageId, expectedVersion: version }),
    ),
  );
  const persist = useCallback(
    async (snapshot: ReviewDraft, mode: "manual" | "auto") => {
      if (blocked.current || saving.current) return;
      if (mode === "auto" && JSON.stringify(snapshot) === saved.current) return;
      saving.current = true;
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      setSaveMode(mode);
      setPending((n) => n + 1);
      setFailed(false);
      setMessage(mode === "manual" ? "저장 중..." : "자동 저장 중...");
      const result = await enqueue(snapshot);
      saving.current = false;
      setPending((n) => n - 1);
      if (result.ok) {
        saved.current = JSON.stringify(snapshot);
        setSavedTick((n) => n + 1);
        const dirty = saved.current !== JSON.stringify(latest.current);
        // Do not discard edits made while the save request was in flight.
        if (
          mode === "manual" &&
          (snapshot.status === "published" || snapshot.status === "private") &&
          !dirty
        ) {
          blocked.current = true;
          setLocked(true);
          setMessage("저장되었습니다. 영화 페이지로 이동합니다.");
          router.push(movieUrl);
          return;
        }
        setMessage(mode === "manual"
          ? `저장되었습니다.${dirty ? " 새 변경 사항은 아직 저장되지 않았습니다." : ""}`
          : dirty ? "자동 저장됨 · 새 변경 사항 있음" : "자동 저장됨");
        if (mode === "manual") {
          feedbackTimer.current = setTimeout(() => {
            setMessage(saved.current === JSON.stringify(latest.current)
              ? "저장됨" : "변경 사항 있음");
          }, 1800);
        }
      } else {
        setFailed(true);
        const prefix = mode === "manual" ? "저장에 실패했습니다." : "자동 저장에 실패했습니다.";
        setMessage(`${prefix} ${result.message.replace(/^저장에 실패했습니다\.\s*/, "")}`);
        if (["conflict", "auth", "permission"].includes(result.reason)) {
          blocked.current = true;
          setLocked(true);
        }
      }
    },
    [enqueue, movieUrl, router],
  );
  const change = (next: ReviewDraft) => {
    latest.current = next;
    setDraft(next);
    if (!blocked.current && !saving.current) {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      setFailed(false);
      setMessage("변경 사항 있음");
    }
  };
  useEffect(() => {
    if (JSON.stringify(draft) === saved.current || blocked.current) return;
    const timer = window.setTimeout(() => {
      void persist(draft, "auto");
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [draft, persist, savedTick]);
  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);
  useEffect(() => {
    const dirty = () => JSON.stringify(latest.current) !== saved.current;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const leaving = (event: MouseEvent) => {
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        anchor &&
        dirty() &&
        !window.confirm("저장하지 않은 변경 사항이 있습니다. 이동할까요?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", leaving, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", leaving, true);
    };
  }, []);
  function insert(before: string, after = "", placeholder = "텍스트") {
    const field = textarea.current;
    if (!field) return;
    const start = field.selectionStart,
      end = field.selectionEnd;
    const selection = draft.content.slice(start, end) || placeholder;
    const content =
      draft.content.slice(0, start) +
      before +
      selection +
      after +
      draft.content.slice(end);
    change({ ...draft, content });
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(
        start + before.length,
        start + before.length + selection.length,
      );
    });
  }
  const tools = [
    { label: "제목", Icon: Heading2, before: "\n## " },
    { label: "굵게", Icon: Bold, before: "**", after: "**" },
    { label: "기울임", Icon: Italic, before: "*", after: "*" },
    { label: "링크", Icon: LinkIcon, before: "[", after: "](https://)" },
    { label: "인용", Icon: Quote, before: "\n> " },
    { label: "구분선", Icon: Minus, before: "\n\n---\n\n", placeholder: "" },
  ];
  return (
    <section className="review-editor" aria-label="리뷰 편집기">
      <div className="editor-settings">
        <label>
          공개 상태
          <select
            value={draft.status}
            onChange={(e) => {
              const status = e.target.value as ReviewStatus;
              if (
                status === "published" &&
                draft.status !== "published" &&
                !window.confirm("이 리뷰를 공개 발행할까요?")
              )
                return;
              change({ ...draft, status });
            }}
          >
            {Object.entries(reviewStatusLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="spoiler-toggle">
          <input
            type="checkbox"
            checked={draft.spoiler}
            onChange={(e) => change({ ...draft, spoiler: e.target.checked })}
          />
          스포일러 포함
        </label>
        <div className="editor-modes" role="group" aria-label="편집 모드">
          <button
            className="icon-button"
            title="Markdown 편집"
            aria-label="Markdown 편집"
            aria-pressed={!preview}
            onClick={() => setPreview(false)}
          >
            <Code size={18} />
          </button>
          <button
            className="icon-button"
            title="미리보기"
            aria-label="미리보기"
            aria-pressed={preview}
            onClick={() => setPreview(true)}
          >
            <Eye size={18} />
          </button>
        </div>
        <button
          className="button"
          disabled={pending > 0 || locked}
          onClick={() => void persist(draft, "manual")}
        >
          <Save size={17} />
          {pending > 0 && saveMode === "manual" ? "저장 중..." : "저장"}
        </button>
      </div>
      <div
        className="editor-save-state"
        role="status"
        aria-live="polite"
        data-error={failed}
      >
        {message}
      </div>
      {preview ? (
        <div className="editor-preview">
          {draft.spoiler && (
            <p className="spoiler-warning">
              이 리뷰에는 스포일러가 포함되어 있습니다.
            </p>
          )}
          <Markdown content={draft.content} />
        </div>
      ) : (
        <>
          <div
            className="editor-toolbar"
            role="toolbar"
            aria-label="Markdown 도구"
          >
            {tools.map(({ label, Icon, before, after, placeholder }) => (
              <button
                key={label}
                type="button"
                className="icon-button"
                title={label}
                aria-label={label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insert(before, after, placeholder)}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
          <textarea
            ref={textarea}
            className="markdown-input"
            aria-label="리뷰 Markdown 본문"
            value={draft.content}
            maxLength={MAX_REVIEW_LENGTH}
            spellCheck={false}
            onChange={(e) => change({ ...draft, content: e.target.value })}
          />
        </>
      )}
    </section>
  );
}
