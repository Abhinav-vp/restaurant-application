import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && url !== "your-supabase-url-here" && key && key !== "your-supabase-anon-key-here");
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    // Return a dummy client so things compiling doesn't crash on startup
    return createBrowserClient(
      "https://dummy-project.supabase.co",
      "dummy-anon-key"
    );
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
