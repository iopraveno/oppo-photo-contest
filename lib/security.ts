import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';

export async function clientIp() {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  return (forwarded?.split(',')[0] || h.get('x-real-ip') || 'unknown').trim();
}

export function hashIp(ip: string) {
  return createHash('sha256')
    .update(`${process.env.VOTE_SALT || 'salt'}:${ip}`)
    .digest('hex')
    .slice(0, 32);
}

/** Cloudflare Turnstile check. Passes when Turnstile is not configured. */
export async function verifyTurnstile(token: string | null | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: ip });
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}
