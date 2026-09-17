import Link from "next/link";
import { ArrowRight } from "lucide-react";
export default function NotFound() {
  return (
    <section className="shell empty-state">
      <p className="eyebrow">404 / MISSING FRAME</p>
      <h1>이 장면은 찾을 수 없습니다.</h1>
      <p>주소를 확인하거나 다른 영화를 만나보세요.</p>
      <Link href="/films" className="button">
        영화 둘러보기
        <ArrowRight size={18} />
      </Link>
    </section>
  );
}
