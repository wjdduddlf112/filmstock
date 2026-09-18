export function safeLoginPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  try {
    const decoded = decodeURIComponent(value);
    if (
      !decoded.startsWith("/") ||
      decoded.startsWith("//") ||
      /[%\\\x00-\x20]/.test(decoded)
    )
      return "/";
    const url = new URL(decoded, "https://filmstock.invalid");
    if (url.origin !== "https://filmstock.invalid") return "/";
    const path = url.pathname;
    const allowed =
      ["/", "/films", "/stats", "/about", "/admin"].includes(path) ||
      path.startsWith("/film/") ||
      path.startsWith("/admin/film/");
    return allowed ? `${path}${url.search}` : "/";
  } catch {
    return "/";
  }
}

export function safeAdminPath(value: unknown): string {
  if (typeof value !== "string") return "/admin";
  try {
    const decoded = decodeURIComponent(value);
    if (
      /[%\\\x00-\x20]/.test(decoded) ||
      (decoded !== "/admin" && !decoded.startsWith("/admin/"))
    )
      return "/admin";
    const url = new URL(decoded, "https://filmstock.invalid");
    if (
      url.origin !== "https://filmstock.invalid" ||
      !(url.pathname === "/admin" || url.pathname.startsWith("/admin/"))
    )
      return "/admin";
    if (url.pathname.startsWith("/admin/login")) return "/admin";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/admin";
  }
}

export function hasAdminMembership(userId: string, row: unknown): boolean {
  return (
    !!userId &&
    typeof row === "object" &&
    row !== null &&
    "user_id" in row &&
    row.user_id === userId
  );
}
