import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OSShell } from "@/components/layout/os-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return <OSShell>{children}</OSShell>;
}
