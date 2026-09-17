import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getMovies } from "@/lib/notion/movies";
import { movieHref } from "@/lib/movies/slug";
import { siteUrl } from "@/lib/seo/site";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = siteUrl();
  const movies = await getMovies();
  return [
    ...["", "/films", "/stats", "/about"].map((path) => ({
      url: `${base}${path}`,
      changeFrequency: "weekly" as const,
    })),
    ...movies.map((movie) => ({
      url: `${base}${movieHref(movie)}`,
      changeFrequency: "weekly" as const,
    })),
  ];
}
