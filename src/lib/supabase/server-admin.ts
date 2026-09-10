import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-project.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Verify service key looks like a valid JWT or Supabase secret key (not just a project ref)
  const isServiceKeyValid = !!(serviceKey && (serviceKey.startsWith('ey') || serviceKey.startsWith('sb_secret_')));
  const key = isServiceKeyValid ? serviceKey : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key');

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
