import Link from "next/link";
/* eslint-disable @next/next/no-html-link-for-pages -- Home intentionally starts a new request for fresh random picks. */
export function Footer() {
  return (
    <footer className="site-footer shell">
      <a className="footer-brand" href="/">
        FILM STOCK
      </a>
      <p>영화는 끝나도, 기록은 남는다.</p>
      <Link href="/about">About this archive</Link>
    </footer>
  );
}
