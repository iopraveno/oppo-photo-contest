import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabasePublicKey, supabaseUrl } from '@/lib/env';

/** Supabase client bound to the visitor's session cookies (auth only). */
export async function createSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), supabasePublicKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are refreshed by the middleware instead.
        }
      },
    },
  });
}
