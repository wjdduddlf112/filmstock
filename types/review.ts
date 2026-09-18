export type ReviewStatus = "draft" | "private" | "published";
export type Review = {
  id: string;
  notion_page_id: string;
  content: string;
  status: ReviewStatus;
  spoiler: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};
export type ReviewDraft = Pick<Review, "content" | "status" | "spoiler">;
export type SaveReviewInput = ReviewDraft & {
  notionPageId: string;
  expectedVersion: string | null;
};
export type SaveReviewResult =
  | { ok: true; version: string }
  | {
      ok: false;
      reason: "auth" | "permission" | "conflict" | "invalid" | "unavailable";
      message: string;
    };
