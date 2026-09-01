import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import DashboardClient from "./dashboard-client";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const configured = isSupabaseConfigured();
  let userEmail = "";

  // Check Supabase session first when configured
  if (configured) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email) {
      userEmail = user.email || "";
    } else {
      // allow dev console cookie: `dev-admin` matching NEXT_PUBLIC_DEV_ADMIN_KEY
      if (process.env.NODE_ENV !== "production") {
        const cookieStore = await cookies();
        const dev = cookieStore.get("dev-admin");
        if (!dev || dev.value !== (process.env.NEXT_PUBLIC_DEV_ADMIN_KEY || "")) {
          redirect("/");
        } else {
          userEmail = "dev-admin";
        }
      } else {
        redirect("/");
      }
    }
  } else {
    const cookieStore = await cookies();
    const demoUser = cookieStore.get("demo-user");
    if (!demoUser) redirect("/");
    userEmail = demoUser.value || "";
  }

  return <DashboardClient userEmail={userEmail} />;
}
