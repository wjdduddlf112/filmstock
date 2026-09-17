export type Movie = {
  id: string;
  title: string;
  director: string;
  actors: string;
  releaseDate: string | null;
  watchedDate: string | null;
  countries: string[];
  genres: string[];
  ott: string[];
  runtime: number | null;
  rating: number | null;
  oneLineReview: string;
  tags: string[];
};
