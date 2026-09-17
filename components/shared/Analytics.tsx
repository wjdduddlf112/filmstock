"use client";
import Script from "next/script";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
export function Analytics({ id }: { id: string }) {
  const path = usePathname();
  const query = useSearchParams().toString();
  const lastPage = useRef("");
  useEffect(() => {
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = (...args: unknown[]) => {
        window.dataLayer?.push(args);
      };
      window.gtag("js", new Date());
      window.gtag("config", id, { send_page_view: false });
    }
    const page = `${path}${query ? `?${query}` : ""}`;
    if (lastPage.current !== page) {
      window.gtag("event", "page_view", {
        page_location: `${location.origin}${page}`,
        page_path: page,
      });
      lastPage.current = page;
    }
  }, [id, path, query]);
  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
      strategy="afterInteractive"
    />
  );
}
