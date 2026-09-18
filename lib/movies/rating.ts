export function ratingToStars(rating: number | null | undefined): number | null {
  if (rating == null || !Number.isFinite(rating) || rating < 1 || rating > 5)
    return null;
  if (rating < 1.5) return 1;
  if (rating < 2) return 1.5;
  if (rating < 2.5) return 2;
  if (rating < 3) return 2.5;
  if (rating < 3.4) return 3;
  if (rating < 3.9) return 3.5;
  if (rating < 4.4) return 4;
  if (rating < 4.7) return 4.5;
  return 5;
}

export function starFills(rating: number | null | undefined): number[] {
  const stars = ratingToStars(rating);
  if (stars === null) return [];
  return Array.from(
    { length: 5 },
    (_, i) => Math.min(1, Math.max(0, stars - i)) * 100,
  );
}
