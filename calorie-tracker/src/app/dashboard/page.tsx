import { redirect } from "next/navigation";
import { getUserIdFromCookies } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const userId = await getUserIdFromCookies();
  if (!userId) redirect("/login");
  return <DashboardClient />;
}
