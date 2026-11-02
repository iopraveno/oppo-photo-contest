import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabasePublicKey, supabaseUrl } from '@/lib/env';

// Keeps the Supabase session cookie fresh on every page view.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = supabaseUrl();
  const key = supabasePublicKey();
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  try {
    await supabase.auth.getUser();
  } catch (e) {
    console.error('middleware: session refresh failed', e);
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|fonts|favicon.ico|.*\\.(?:png|jpg|svg|webp|woff2)$).*)'],
};
