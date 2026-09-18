import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { safeLoginPath } from "@/lib/auth/helpers";

export async function GET(request: NextRequest) {
  const next = safeLoginPath(request.nextUrl.searchParams.get("next"));
  const code = request.nextUrl.searchParams.get("code");
  let target = "/admin/login?error=oauth";
  try {
    const supabase = await serverSupabase();
    if (supabase && code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) target = next;
    }
  } catch {
    /* Never expose OAuth codes, tokens, or provider error details. */
  }
  // Keep the browser's origin instead of trusting a forwarded host header.
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: target },
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
