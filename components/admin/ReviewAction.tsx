import Link from "next/link";
import { PenLine } from "lucide-react";
import { getAdminAccess } from "@/lib/auth/admin";
export async function ReviewAction({
  pageId,
  href,
}: {
  pageId: string;
  href: string;
}) {
  const access = await getAdminAccess();
  if (access.kind !== "admin") return null;
  const { data, error } = await access.supabase
    .from("reviews")
    .select("id")
    .eq("notion_page_id", pageId)
    .maybeSingle();
  return (
    <Link
      className="text-button admin-review-action"
      href={`/admin${href}/edit`}
      prefetch={false}
    >
      <PenLine size={16} />
      {error ? "리뷰 관리" : data ? "리뷰 수정" : "리뷰 작성"}
    </Link>
  );
}
