import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { getAdminAccess } from "@/lib/auth/admin";
import { reviewStatusLabels } from "@/lib/reviews/helpers";
import { AccessState } from "@/components/admin/AccessState";
import { LogoutButton } from "@/components/admin/AuthButtons";
export default async function Admin() {
  await connection();
  const access = await getAdminAccess();
  if (access.kind !== "admin") return <AccessState kind={access.kind} />;
  const counts = [];
  for (const [status, label] of Object.entries(reviewStatusLabels)) {
    const { count, error } = await access.supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", status);
    counts.push({ label, count: error ? null : count });
  }
  return (
    <div className="shell admin-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow accent">FILM STOCK</p>
          <h1>Admin</h1>
          <p className="muted">{access.user.email ?? access.user.id}</p>
        </div>
        <LogoutButton />
      </header>
      <dl className="admin-counts">
        {counts.map((c) => (
          <div key={c.label}>
            <dt>{c.label}</dt>
            <dd>{c.count ?? "조회 실패"}</dd>
          </div>
        ))}
      </dl>
      <Link className="button" href="/films">
        전체 영화 보기
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}
