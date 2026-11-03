// Accept both the classic key names and the ones the Vercel ↔ Supabase integration creates.
export const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
export const supabasePublicKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  '';
export const supabaseSecretKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl() && supabasePublicKey() && supabaseSecretKey());
}

// Accepts commas, semicolons, spaces or new lines between addresses (people paste lists in all of these forms).
const emailList = (value: string | undefined) =>
  (value || '')
    .split(/[\s,;]+/)
    .map((e) => e.trim().replace(/^["'<]+|[">']+$/g, '').toLowerCase())
    .filter((e) => e.includes('@'));

/** Full admins: the whole /admin. */
export function adminEmails(): string[] {
  return emailList(process.env.ADMIN_EMAILS);
}

/** Photo walk only: /admin/photowalk and its CSV export. Full admins have access too. */
export function photowalkAdminEmails(): string[] {
  return emailList(process.env.PHOTOWALK_ADMIN_EMAILS);
}
