"use server";
import { revalidatePath } from "next/cache";
import { getAdminAccess } from "@/lib/auth/admin";
import { serverSupabase } from "@/lib/supabase/server";
import { getMovies } from "@/lib/notion/movies";
import { movieHref } from "@/lib/movies/slug";
import { validSaveInput } from "@/lib/reviews/helpers";
import type { SaveReviewResult } from "@/types/review";

export async function saveReview(input: unknown): Promise<SaveReviewResult> {
  const access = await getAdminAccess();
  if (access.kind === "configuration" || access.kind === "unavailable")
    return {
      ok: false,
      reason: "unavailable",
      message:
        "인증 서버에 연결하지 못했습니다. 입력한 내용을 유지한 채 다시 저장해 주세요.",
    };
  if (access.kind !== "admin")
    return {
      ok: false,
      reason: access.kind === "anonymous" ? "auth" : "permission",
      message: "관리자 인증을 확인해 주세요. 입력한 내용은 유지됩니다.",
    };
  if (!validSaveInput(input))
    return {
      ok: false,
      reason: "invalid",
      message: "저장할 내용을 확인해 주세요. 본문은 최대 200,000자입니다.",
    };
  try {
    const pageId = input.notionPageId.toLowerCase();
    const movie = (await getMovies()).find(
      (m) => m.id.toLowerCase() === pageId,
    );
    if (!movie)
      return {
        ok: false,
        reason: "invalid",
        message: "연결된 영화를 찾을 수 없습니다.",
      };
    // Conditional UPDATE is atomic. A second tab must reload rather than overwrite.
    const updatedAt = new Date(
      Math.max(
        Date.now(),
        input.expectedVersion ? Date.parse(input.expectedVersion) + 1 : 0,
      ),
    ).toISOString();
    const values = {
      content: input.content,
      status: input.status,
      spoiler: input.spoiler,
      updated_at: updatedAt,
    };
    const query =
      input.expectedVersion === null
        ? access.supabase
            .from("reviews")
            .insert({ ...values, notion_page_id: pageId })
        : access.supabase
            .from("reviews")
            .update(values)
            .eq("notion_page_id", pageId)
            .eq("updated_at", input.expectedVersion);
    const { data, error } = await query.select("updated_at").maybeSingle();
    if (error?.code === "23505" || (!error && !data))
      return {
        ok: false,
        reason: "conflict",
        message:
          "다른 탭에서 리뷰가 변경되었습니다. 입력한 글을 보관한 뒤 새로고침해 주세요.",
      };
    if (error || !data)
      return {
        ok: false,
        reason: "unavailable",
        message:
          "저장에 실패했습니다. 연결과 권한을 확인한 뒤 다시 저장해 주세요.",
      };
    revalidatePath(movieHref(movie));
    revalidatePath("/films");
    revalidatePath("/");
    return { ok: true, version: data.updated_at };
  } catch {
    return {
      ok: false,
      reason: "unavailable",
      message: "저장에 실패했습니다. 입력한 내용은 유지됩니다.",
    };
  }
}

export async function logoutAdmin(): Promise<{ ok: boolean }> {
  try {
    const supabase = await serverSupabase();
    if (!supabase) return { ok: false };
    const { error } = await supabase.auth.signOut({ scope: "local" });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}
