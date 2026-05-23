import { redirect } from "next/navigation";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";

export default async function Home() {
  const token = await getTokenFromCookies();
  if (token) {
    const payload = await verifyToken(token);
    if (payload) redirect("/dashboard");
  }
  redirect("/login");
}
