"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { browserSupabase } from "@/lib/supabase/browser";
import { safeLoginPath } from "@/lib/auth/helpers";
import { logoutAdmin } from "@/app/admin/actions";

export function GoogleLogin({ next }: { next: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <>
      <button
        className="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(false);
          try {
            const callback = new URL("/auth/callback", window.location.origin);
            callback.searchParams.set("next", safeLoginPath(next));
            const { error } = await browserSupabase().auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: callback.href },
            });
            if (error) throw error;
          } catch {
            setError(true);
            setBusy(false);
          }
        }}
      >
        <LogIn size={18} />
        {busy ? "연결 중..." : "Google로 로그인"}
      </button>
      {error && (
        <p role="alert">
          로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      )}
    </>
  );
}
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <>
      <button
        className="text-button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(false);
          try {
            if ((await logoutAdmin()).ok) {
              router.replace("/");
              router.refresh();
              return;
            }
          } catch {}
          setBusy(false);
          setError(true);
        }}
      >
        <LogOut size={16} />
        로그아웃
      </button>
      {error && (
        <p role="alert">로그아웃에 실패했습니다. 다시 시도해 주세요.</p>
      )}
    </>
  );
}
