import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import DashboardClient from "./dashboard-client";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const configured = isSupabaseConfigured();
  let userEmail = "";
  let demoBypass = false;

  if (configured) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Allow a dev-only bypass using the `demo-user` cookie when no Supabase session
      // This helps local testing when env keys exist but no auth session is present.
      if (process.env.NODE_ENV !== "production") {
        const cookieStore = await cookies();
        const demoUserCookie = cookieStore.get("demo-user");
        if (demoUserCookie) {
          userEmail = demoUserCookie.value || "";
          demoBypass = true;
        } else {
          redirect("/");
        }
      } else {
        redirect("/");
      }
    } else {
      userEmail = user.email || "";
    }
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
      demoBypass={demoBypass}
    />
  );
}
