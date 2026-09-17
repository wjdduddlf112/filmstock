import { connection } from "next/server";
import { getMovies } from "@/lib/notion/movies";
import { aggregateStats } from "@/lib/stats/aggregate";
import { BarChart } from "@/components/stats/BarChart";
import { EmptyState } from "@/components/shared/States";
export const metadata = {
  title: "Stats",
  description: "FILM STOCK 영화 컬렉션의 평점, 장르, 국가, 감독, 배우 통계.",
  alternates: { canonical: "/stats" },
};
export default async function Stats() {
  await connection();
  const stats = aggregateStats(await getMovies());
  return (
    <div className="shell stats-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">THE BIG PICTURE</p>
          <h1>Stats</h1>
        </div>
        <p>숫자로 펼쳐보는 영화의 취향.</p>
      </header>
      {stats.total ? (
        <>
          <dl className="stats-summary">
            <div>
              <dt>기록한 영화</dt>
              <dd>
                {stats.total.toLocaleString("ko")}
                <small>편</small>
              </dd>
            </div>
            <div>
              <dt>평균 평점</dt>
              <dd>
                {stats.average?.toFixed(2) ?? "—"}
                <small>/ 5</small>
              </dd>
            </div>
            <div>
              <dt>평점을 남긴 영화</dt>
              <dd>
                {stats.rated.toLocaleString("ko")}
                <small>편</small>
              </dd>
            </div>
            <div>
              <dt>영화의 국적</dt>
              <dd>
                {stats.countries.length}
                <small>개</small>
              </dd>
            </div>
          </dl>
          <div className="stats-grid">
            <BarChart
              title="평점의 분포"
              entries={stats.distribution.filter(({ label }) => Number(label) >= 1)}
              limit={9}
              note="가장 가까운 0.5점 구간"
            />
            <BarChart title="장르" entries={stats.genres} note="상위 10개" />
            <BarChart title="국가" entries={stats.countries} note="상위 10개" />
            <BarChart title="감독" entries={stats.directors} note="상위 10명" />
            <BarChart title="배우" entries={stats.actors} note="상위 10명" />
            <BarChart title="OTT" entries={stats.ott} note="상위 10개" />
            <BarChart
              title="개봉연도"
              entries={stats.releaseYears}
              limit={stats.releaseYears.length}
              note="최신 연도부터"
            />
          </div>
          <p className="stats-note">
            평균 평점은 평점이 기록된 영화만 집계합니다. 여러 장르·국가·인물이
            있는 영화는 각각의 항목에 포함됩니다.
          </p>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
