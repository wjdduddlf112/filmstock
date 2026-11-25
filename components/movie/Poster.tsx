"use client";
import Image from "next/image";
import { useState } from "react";
import { Film } from "lucide-react";
import type { MovieCover } from "@/types/movie";

export function Poster({
  cover,
  title,
  priority = false,
  sizes = "(max-width: 600px) 46vw, (max-width: 1000px) 30vw, 280px",
}: {
  cover: MovieCover | null;
  title: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const src = priority ? cover?.url : cover?.thumbnailUrl ?? cover?.url;
  return (
    <div className="poster">
      {src && failedUrl !== src ? (
        <Image
          src={src}
          alt={`${title || "제목 없는 영화"} 포스터`}
          fill
          sizes={sizes}
          preload={priority}
          loading={priority ? undefined : "lazy"}
          unoptimized
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(src)}
        />
      ) : (
        <div
          className="poster-placeholder"
          role="img"
          aria-label={`${title || "제목 없는 영화"} 포스터 없음`}
        >
          <Film size={38} strokeWidth={1} />
          <span>
            FILM
            <br />
            STOCK
          </span>
          <small>NO POSTER</small>
        </div>
      )}
    </div>
  );
}
