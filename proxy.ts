import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = supabaseConfig();
  if (
    config &&
    request.cookies.getAll().some((c) => c.name.startsWith("sb-"))
  ) {
    const supabase = createServerClient(config.url, config.key, {
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: init?.signal ?? AbortSignal.timeout(10000),
          }),
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([name, value]) =>
            response.headers.set(name, value),
          );
        },
      },
    });
    try {
      await supabase.auth.getClaims();
    } catch {
      /* Access checks fail closed in the server layer. */
    }
  }
  response.headers.set("Cache-Control", "private, no-store");
  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/auth")
  )
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
export const config = {
  matcher: [
    "/",
    "/films",
    "/stats",
    "/about",
    "/admin/:path*",
    "/auth/:path*",
    "/film/:path*",
  ],
};
