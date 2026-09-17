export type MovieCover = {
  url: string;
  type: "file" | "external";
  expiresAt: string | null;
};

export type Movie = {
  id: string;
  cover: MovieCover | null;
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
