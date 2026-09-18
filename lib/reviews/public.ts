import "server-only";
import { cache } from "react";
import { publicSupabase } from "@/lib/supabase/public";
import { asReview, publishedIdSet } from "./helpers";

// Request-only deduplication: unpublishing must not leave a shared cached body visible.
export const getPublishedIds = cache(async (): Promise<Set<string>> => {
  const supabase = publicSupabase();
  if (!supabase) return new Set();
  try {
    const rows: { notion_page_id: string; status: string }[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase
        .from("reviews")
        .select("notion_page_id,status")
        .eq("status", "published")
        .order("notion_page_id")
        .range(offset, offset + 499);
      if (error) throw new Error("Review index unavailable");
      rows.push(...(data ?? []));
      if (!data || data.length < 500) break;
    }
    return publishedIdSet(rows);
  } catch {
    console.warn("[FILM STOCK] Public review index unavailable");
    return new Set();
  }
});
export const getPublishedReview = cache(async (pageId: string) => {
  const supabase = publicSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        "id,notion_page_id,content,status,spoiler,created_at,updated_at,published_at",
      )
      .eq("notion_page_id", pageId)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error("Review unavailable");
    const review = asReview(data);
    return review?.status === "published" ? review : null;
  } catch {
    console.warn("[FILM STOCK] Public review unavailable");
    return null;
  }
});
