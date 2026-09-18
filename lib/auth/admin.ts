import "server-only";
import { cache } from "react";
import { serverSupabase } from "@/lib/supabase/server";
import { hasAdminMembership } from "./helpers";

export const getAdminAccess = cache(async () => {
  const supabase = await serverSupabase();
  if (!supabase) return { kind: "configuration" as const };
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (
      error &&
      ((error.status ?? 0) >= 500 || error.name === "AuthRetryableFetchError")
    )
      return { kind: "unavailable" as const };
    if (error || !user) return { kind: "anonymous" as const };
    const { data, error: membershipError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (membershipError) return { kind: "unavailable" as const };
    if (!hasAdminMembership(user.id, data))
      return { kind: "forbidden" as const, user };
    return { kind: "admin" as const, user, supabase };
  } catch {
    return { kind: "unavailable" as const };
  }
});
