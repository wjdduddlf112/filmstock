import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FILM STOCK",
  description: "개인 영화 아카이브",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
