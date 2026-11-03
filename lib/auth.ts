import 'server-only';
import { redirect } from 'next/navigation';
import { createSessionClient } from './supabase/server';
import { adminEmails, isSupabaseConfigured } from './env';

export type SessionUser = { id: string; email: string };

export async function getUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSessionClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user || !data.user.email) return null;
    return { id: data.user.id, email: data.user.email.toLowerCase() };
  } catch (e) {
    console.error('getUser failed (check NEXT_PUBLIC_SUPABASE_URL / ANON_KEY):', e);
    return null;
  }
}

export function isAdminEmail(email: string | null | undefined) {
  return Boolean(email && adminEmails().includes(email.toLowerCase()));
}

/** `next` is where the sign-in page sends the admin back to. */
export async function requireAdmin(next = '/admin'): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect(`/prihlaseni?next=${encodeURIComponent(next)}`);
  if (!isAdminEmail(user.email)) redirect('/bez-pristupu');
  return user;
}
