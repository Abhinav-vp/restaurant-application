import { redirect } from "next/navigation";

export default function DashboardRedirect() {
  // Dashboard removed — redirect visitors to the homepage.
  redirect("/");
}
