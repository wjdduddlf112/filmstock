export function starFills(rating: number): number[] {
  const rounded =
    Math.round(
      Math.min(5, Math.max(0, Number.isFinite(rating) ? rating : 0)) * 2,
    ) / 2;
  return Array.from(
    { length: 5 },
    (_, i) => Math.min(1, Math.max(0, rounded - i)) * 100,
  );
}
