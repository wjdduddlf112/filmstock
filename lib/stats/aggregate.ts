import type { Movie } from "@/types/movie";

export type StatEntry = { label: string; count: number };

export function splitPeople(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,，;；\n·、|/]+/u)
        .map((name) => name.trim().replace(/\s+/g, " "))
        .filter(Boolean),
    ),
  ];
}

function counts(values: string[][]): StatEntry[] {
  const count = new Map<string, number>();
  for (const group of values)
    for (const label of new Set(group))
      if (label) count.set(label, (count.get(label) ?? 0) + 1);
  return [...count]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko"));
}

export function aggregateStats(movies: Movie[]) {
  const rated = movies.flatMap((m) =>
    m.rating !== null && m.rating >= 0 && m.rating <= 5 ? [m.rating] : [],
  );
  const distribution = Array.from({ length: 11 }, (_, i) => ({
    label: (i / 2).toFixed(1),
    count: 0,
  }));
  for (const rating of rated) distribution[Math.round(rating * 2)].count++;
  return {
    total: movies.length,
    rated: rated.length,
    average: rated.length
      ? rated.reduce((a, b) => a + b, 0) / rated.length
      : null,
    distribution,
    genres: counts(movies.map((m) => m.genres)),
    countries: counts(movies.map((m) => m.countries)),
    directors: counts(movies.map((m) => splitPeople(m.director))),
    actors: counts(movies.map((m) => splitPeople(m.actors))),
    ott: counts(movies.map((m) => m.ott)),
    releaseYears: counts(
      movies.map((m) => (m.releaseDate ? [m.releaseDate.slice(0, 4)] : [])),
    ).sort((a, b) => Number(b.label) - Number(a.label)),
  };
}
