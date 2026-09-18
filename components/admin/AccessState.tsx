import { redirect } from "next/navigation";
import { LogoutButton } from "./AuthButtons";
import { safeAdminPath } from "@/lib/auth/helpers";

export function AccessState({
  kind,
  next = "/admin",
}: {
  kind: string;
  next?: string;
}) {
  if (kind === "anonymous")
    redirect(`/admin/login?next=${encodeURIComponent(safeAdminPath(next))}`);
  return (
    <section className="shell admin-state">
      <p className="eyebrow accent">FILM STOCK / ADMIN</p>
      <h1>
        {kind === "forbidden"
          ? "관리자 권한이 없는 계정입니다."
          : "관리자 연결을 확인해 주세요."}
      </h1>
      <p>
        {kind === "configuration"
          ? "NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 설정이 필요합니다."
          : kind === "forbidden"
            ? "등록된 관리자 계정으로 로그인해 주세요."
            : "Supabase 연결 또는 admin_users 조회 권한을 확인해 주세요."}
      </p>
      <LogoutButton />
    </section>
  );
}
