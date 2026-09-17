import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export const metadata = {
  title: "About",
  description:
    "영화를 보고, 기록하고, 다시 발견하는 개인 영화 아카이브 FILM STOCK.",
  alternates: { canonical: "/about" },
};
export default function About() {
  return (
    <div className="shell about-page">
      <p className="eyebrow accent">ABOUT THE ARCHIVE</p>
      <h1>FILM STOCK</h1>
      <p className="about-lead">
        영화는 끝나도,
        <br />
        기록은 남는다.
      </p>
      <div className="about-body">
        <p>
          어떤 영화는 한 장면으로, 어떤 영화는 오래 남는 기분으로 기억됩니다.
          FILM STOCK은 그렇게 보고 느낀 영화들을 한 편씩 모아두는 개인 영화
          아카이브입니다.
        </p>
        <p>
          별점에는 그날의 취향을, 한줄평에는 영화가 남긴 여운을 담습니다. 정답을
          정하는 평가보다, 다시 꺼내볼 수 있는 기억에 가깝습니다.
        </p>
        <div className="about-note">
          <h2>기록을 읽는 방법</h2>
          <p>
            평점은 5점 만점입니다. 숫자는 기록한 원래 평점이며, 별은 가장 가까운
            반 개 단위로 표시합니다. 평점이 없는 영화는 아직 평가를 남기지 않은
            기록입니다.
          </p>
        </div>
        <Link className="button" href="/films">
          영화 기록 둘러보기
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </div>
  );
}
