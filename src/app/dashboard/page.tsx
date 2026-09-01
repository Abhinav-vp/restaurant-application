import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import DashboardClient from "./dashboard-client";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const configured = isSupabaseConfigured();
  let userEmail = "";

  if (configured) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect("/");
    }
    userEmail = user.email || "";
  } else {
    const cookieStore = await cookies();
    const demoUser = cookieStore.get("demo-user");
    if (!demoUser) {
      redirect("/");
    }
    userEmail = demoUser.value || "";
  }

  return (
    <DashboardClient 
      userEmail={userEmail} 
      isConfigured={configured} 
    />
  );
}
