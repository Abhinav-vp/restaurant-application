import { cookies } from "next/headers";
import DashboardClient from "./dashboard-client";
import { redirect } from "next/navigation";
import { verifyAdminSessionToken } from "@/lib/auth-security";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("admin-auth");
  const isValid = await verifyAdminSessionToken(adminAuth?.value);

  if (!isValid) {
    redirect("/login");
  }

  return <DashboardClient userEmail="admin" />;
}

