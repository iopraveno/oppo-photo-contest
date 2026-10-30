/** Pulls the post code out of any Instagram post or reel link. */
export function parseInstagramUrl(input: string): { shortcode: string; permalink: string } | null {
  const text = input.trim();
  let url: URL;
  try {
    url = new URL(text.startsWith('http') ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (!/(^|\.)instagram\.com$/i.test(url.hostname)) return null;
  const match = url.pathname.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]{5,})/);
  if (!match) return null;
  const shortcode = match[1];
  return { shortcode, permalink: `https://www.instagram.com/p/${shortcode}/` };
}

export function embedUrl(shortcode: string) {
  return `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/embed/`;
}

export function normalizeHandle(input: string) {
  return input
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
}

export function isValidHandle(handle: string) {
  return /^[a-z0-9._]{1,30}$/.test(handle);
}
