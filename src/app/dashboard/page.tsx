import { cookies } from "next/headers";
import DashboardClient from "./dashboard-client";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("admin-auth");

  if (!adminAuth || adminAuth.value !== "authenticated") {
    redirect("/login");
  }

  return <DashboardClient userEmail="admin" />;
}
