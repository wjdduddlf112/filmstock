"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Home intentionally starts a new request for fresh random picks. */

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { SearchForm } from "@/components/shared/SearchForm";

const links = [
  ["/", "Home"],
  ["/films", "Films"],
  ["/stats", "Stats"],
  ["/about", "About"],
];
export function Header({ account }: { account?: React.ReactNode }) {
  const path = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const active = (href: string) =>
    href === "/films" ? path.startsWith("/film") : path === href;
  const navigation = links.map(([href, label]) =>
    href === "/" ? (
      <a
        key={href}
        href={href}
        aria-current={active(href) ? "page" : undefined}
        onClick={() => dialog.current?.close()}
      >
        {label}
      </a>
    ) : (
      <Link
        key={href}
        href={href}
        prefetch={false}
        aria-current={active(href) ? "page" : undefined}
        onClick={() => dialog.current?.close()}
      >
        {label}
      </Link>
    ),
  );
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a href="/" className="brand" aria-label="FILM STOCK 홈">
          FILM<span>STOCK</span>
          <i aria-hidden="true" />
        </a>
        <nav className="desktop-nav" aria-label="주 메뉴">
          {navigation}
        </nav>
        <div className="header-tools">
          <div className="header-search">
            <SearchForm compact />
          </div>
          <ThemeToggle />
          {account}
          <button
            className="icon-button mobile-menu-button"
            type="button"
            title="메뉴 열기"
            aria-label="메뉴 열기"
            onClick={() => dialog.current?.showModal()}
          >
            <Menu size={22} />
          </button>
        </div>
        <dialog
          ref={dialog}
          className="mobile-navigation"
          aria-label="모바일 메뉴"
          onClick={(e) => {
            if (e.target === e.currentTarget) dialog.current?.close();
          }}
        >
          <div className="dialog-heading">
            <span className="eyebrow">FILM STOCK</span>
            <button
              className="icon-button"
              aria-label="메뉴 닫기"
              title="닫기"
              onClick={() => dialog.current?.close()}
            >
              <X />
            </button>
          </div>
          <nav aria-label="모바일 주 메뉴">{navigation}</nav>
          <SearchForm compact />
        </dialog>
      </div>
    </header>
  );
}
