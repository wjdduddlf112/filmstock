import { getAdminAccess } from "@/lib/auth/admin";
import { AccountButton } from "./AccountButton";

export async function HeaderAccount() {
  const access = await getAdminAccess();
  return (
    <AccountButton
      signedIn={access.kind === "admin" || access.kind === "forbidden"}
      admin={access.kind === "admin"}
      available={
        access.kind !== "configuration" && access.kind !== "unavailable"
      }
    />
  );
}
