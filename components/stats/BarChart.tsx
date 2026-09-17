import type { StatEntry } from "@/lib/stats/aggregate";
export function BarChart({
  title,
  entries,
  note,
  limit = 10,
}: {
  title: string;
  entries: StatEntry[];
  note?: string;
  limit?: number;
}) {
  const values = entries.slice(0, limit);
  const max = Math.max(1, ...values.map((entry) => entry.count));
  return (
    <section className="stat-chart">
      <div className="section-heading">
        <h2>{title}</h2>
        {note && <span className="muted">{note}</span>}
      </div>
      {values.length ? (
        <ol className="bar-list">
          {values.map((entry) => (
            <li key={entry.label}>
              <div className="bar-label">
                <span>{entry.label}</span>
                <span>
                  {entry.count}
                  <small>편</small>
                </span>
              </div>
              <div className="bar-track" aria-hidden="true">
                <div style={{ width: `${(entry.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">기록된 정보가 없습니다.</p>
      )}
    </section>
  );
}
