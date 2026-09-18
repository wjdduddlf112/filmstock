import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/auth/admin";
import { safeLoginPath } from "@/lib/auth/helpers";
import { GoogleLogin } from "@/components/admin/AuthButtons";
import { AccessState } from "@/components/admin/AccessState";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  await connection();
  const query = await searchParams;
  const next = safeLoginPath(query.next);
  const access = await getAdminAccess();
  if (access.kind === "admin") redirect(next);
  if (access.kind !== "anonymous") return <AccessState kind={access.kind} />;
  return (
    <section className="shell admin-state">
      <p className="eyebrow accent">FILM STOCK</p>
      <h1>관리자 로그인</h1>
      {query.error && (
        <p role="alert">로그인을 완료하지 못했습니다. 다시 시도해 주세요.</p>
      )}
      <GoogleLogin next={next} />
    </section>
  );
}
