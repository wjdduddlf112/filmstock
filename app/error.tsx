"use client";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <section className="shell empty-state" role="alert">
      <p className="eyebrow">잠시 쉬어가는 장면</p>
      <h1>영화 기록을 불러오지 못했습니다.</h1>
      <p>잠시 후 다시 시도해 주세요.</p>
      <button
        className="button"
        onClick={() => {
          router.refresh();
          reset();
        }}
      >
        <RotateCcw size={16} />
        다시 시도
      </button>
    </section>
  );
}
