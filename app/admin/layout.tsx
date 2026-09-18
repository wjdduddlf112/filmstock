import { Suspense } from "react";
import "./admin.css";
import { Loading } from "@/components/shared/States";
export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}
