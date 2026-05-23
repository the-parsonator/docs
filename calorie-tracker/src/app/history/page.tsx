import { redirect } from "next/navigation";
import { getUserIdFromCookies } from "@/lib/auth";
import { HistoryClient } from "@/components/history/HistoryClient";

export default async function HistoryPage() {
  const userId = await getUserIdFromCookies();
  if (!userId) redirect("/login");
  return <HistoryClient />;
}
