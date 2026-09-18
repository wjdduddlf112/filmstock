"use client";
import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, UserRound, X, Settings } from "lucide-react";
import { GoogleLogin, LogoutButton } from "@/components/admin/AuthButtons";

export function AccountButton({
  signedIn,
  admin,
  available,
}: {
  signedIn: boolean;
  admin: boolean;
  available: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const path = usePathname();
  const label = signedIn ? "내 계정" : "Google로 로그인";
  return (
    <>
      <button
        className="icon-button"
        type="button"
        title={label}
        aria-label={label}
        onClick={() => dialog.current?.showModal()}
      >
        {signedIn ? <UserRound size={19} /> : <LogIn size={19} />}
      </button>
      <dialog
        ref={dialog}
        className="account-dialog"
        aria-labelledby="account-heading"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <div className="dialog-heading">
          <h2 id="account-heading">{signedIn ? "내 계정" : "로그인"}</h2>
          <button
            className="icon-button"
            aria-label="로그인 창 닫기"
            title="닫기"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        {!available ? (
          <p role="alert">
            로그인 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        ) : signedIn ? (
          <div className="account-actions">
            {admin ? (
              <Link
                className="text-button"
                href="/admin"
                prefetch={false}
                onClick={() => dialog.current?.close()}
              >
                <Settings size={16} />
                관리자
              </Link>
            ) : (
              <p className="muted">관리자 권한이 없는 계정입니다.</p>
            )}
            <LogoutButton />
          </div>
        ) : (
          <GoogleLogin next={path.startsWith("/admin") ? "/" : path} />
        )}
      </dialog>
    </>
  );
}
