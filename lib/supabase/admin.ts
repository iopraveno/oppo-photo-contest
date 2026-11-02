import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { supabaseSecretKey, supabaseUrl } from '@/lib/env';

/** Service-role client. Server only: bypasses row level security. */
export function createAdminClient() {
  return createClient(supabaseUrl(), supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
