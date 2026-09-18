import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { HeaderAccount } from "@/components/layout/HeaderAccount";
import { Footer } from "@/components/layout/Footer";
import { themeScript } from "@/lib/theme";
import { Analytics } from "@/components/shared/Analytics";
import { Loading } from "@/components/shared/States";
import { siteUrl, siteDescription, jsonLd } from "@/lib/seo/site";
import "./globals.css";
const noto = Noto_Sans_KR({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto",
});
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "FILM STOCK | 영화의 기록", template: "%s | FILM STOCK" },
  description: siteDescription,
  openGraph: {
    type: "website",
    siteName: "FILM STOCK",
    locale: "ko_KR",
    title: "FILM STOCK",
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FILM STOCK",
    description: siteDescription,
    images: ["/opengraph-image"],
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="ko" suppressHydrationWarning className={noto.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          본문으로 건너뛰기
        </a>
        <Suspense fallback={<div className="header-placeholder" />}>
          <Header
            account={
              <Suspense fallback={<span className="account-placeholder" />}>
                <HeaderAccount />
              </Suspense>
            }
          />
        </Suspense>
        <main id="main">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </main>
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "FILM STOCK",
              url: siteUrl(),
              description: siteDescription,
              inLanguage: "ko",
            }),
          }}
        />
        {ga && /^G-[A-Z0-9]+$/.test(ga) ? (
          <Suspense fallback={null}>
            <Analytics id={ga} />
          </Suspense>
        ) : null}
      </body>
    </html>
  );
}
