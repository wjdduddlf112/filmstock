import type { ReviewDraft, SaveReviewResult } from "@/types/review";
export function createSaveQueue(
  version: string | null,
  persist: (
    draft: ReviewDraft,
    version: string | null,
  ) => Promise<SaveReviewResult>,
) {
  let tail = Promise.resolve();
  let blocked: SaveReviewResult | null = null;
  let saved: string | null = null;
  return (draft: ReviewDraft): Promise<SaveReviewResult> => {
    const snapshot = { ...draft };
    const result = tail.then(async () => {
      if (blocked) return blocked;
      const fingerprint = JSON.stringify(snapshot);
      if (saved === fingerprint && version)
        return { ok: true as const, version };
      let response: SaveReviewResult;
      try {
        response = await persist(snapshot, version);
      } catch {
        response = {
          ok: false,
          reason: "unavailable",
          message: "저장에 실패했습니다. 다시 시도해 주세요.",
        };
      }
      if (response.ok) {
        version = response.version;
        saved = fingerprint;
      } else if (
        response.reason === "conflict" ||
        response.reason === "auth" ||
        response.reason === "permission"
      )
        blocked = response;
      return response;
    });
    tail = result.then(() => undefined);
    return result;
  };
}
