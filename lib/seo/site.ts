export const siteName = "FILM STOCK";
export const siteDescription =
  "보고, 남기고, 다시 발견하는 영화. FILM STOCK의 영화 기록과 한줄평을 만나보세요.";

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  try {
    const url = new URL(
      configured || (vercel ? `https://${vercel}` : "http://localhost:3000"),
    );
    return ["https:", "http:"].includes(url.protocol)
      ? url.origin
      : "http://localhost:3000";
  } catch {
    return "http://localhost:3000";
  }
}

export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
