import 'server-only';
import { createAdminClient } from './supabase/admin';
import { isSupabaseConfigured } from './env';
import { PHOTOWALK, SITE_URL } from './config';

export type SignupStatus = 'pending' | 'confirmed' | 'declined';

export type Signup = {
  id: string;
  event: string;
  name: string;
  email: string;
  phone: string;
  brand: string;
  model: string;
  status: SignupStatus;
  created_at: string;
  confirmed_at: string | null;
  confirm_email_sent_at: string | null;
};

export type SeatCounts = { confirmed: number; pending: number; declined: number };

// Local preview before Supabase is set up.
const DEMO = process.env.NODE_ENV !== 'production' && !isSupabaseConfigured();

export async function getSeatCounts(): Promise<SeatCounts> {
  if (!isSupabaseConfigured()) return DEMO ? { confirmed: 5, pending: 3, declined: 0 } : { confirmed: 0, pending: 0, declined: 0 };
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('photowalk_signups').select('status').eq('event', PHOTOWALK.slug);
  if (error) {
    console.error('getSeatCounts failed (is supabase/photowalk.sql applied?):', error.message);
    return { confirmed: 0, pending: 0, declined: 0 };
  }
  const counts: SeatCounts = { confirmed: 0, pending: 0, declined: 0 };
  (data ?? []).forEach((r) => {
    const s = r.status as SignupStatus;
    if (s in counts) counts[s] += 1;
  });
  return counts;
}

export async function listSignups(): Promise<Signup[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('photowalk_signups')
    .select('*')
    .eq('event', PHOTOWALK.slug)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('listSignups failed (is supabase/photowalk.sql applied?):', error.message);
    return [];
  }
  return (data ?? []) as Signup[];
}

/** "OPPO Find X10", or just what they wrote for another brand ("iPhone 16 Pro"). */
export function phoneLabel(brand: string, model: string) {
  return brand === PHOTOWALK.otherBrand ? model : `${brand} ${model}`;
}

export function isSignupOpen(now = new Date()) {
  return now <= new Date(PHOTOWALK.signupEnd) && now < new Date(PHOTOWALK.start);
}

export const PHOTOWALK_URL = `${SITE_URL}/photowalk`;

// ---- Calendar -------------------------------------------------------------

const prague = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', ...opts });

/** "sobota 14. listopadu" */
export const eventDayLabel = () => prague({ weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(PHOTOWALK.start));
/** "14:00-17:00" */
export const eventTimeLabel = () => {
  const t = prague({ hour: 'numeric', minute: '2-digit' });
  return `${t.format(new Date(PHOTOWALK.start))}-${t.format(new Date(PHOTOWALK.end))}`;
};
const WEEKDAY_GENITIVE: Record<string, string> = {
  pondělí: 'pondělí', úterý: 'úterý', středa: 'středy', čtvrtek: 'čtvrtka', pátek: 'pátku', sobota: 'soboty', neděle: 'neděle',
};
/** Deadline after "do": "soboty 7. 11." */
export const signupEndLabel = () => {
  const d = new Date(PHOTOWALK.signupEnd);
  const day = prague({ day: 'numeric' }).format(d).replace(/\.$/, '');
  const weekday = prague({ weekday: 'long' }).format(d);
  return `${WEEKDAY_GENITIVE[weekday] ?? weekday} ${day}. ${prague({ month: 'numeric' }).format(d)}.`;
};

const utcStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const calendarText = () =>
  `Photo walk po Vyšehradě s fotografem Martinem Rakem. Sraz ve 14:00 ve ${PHOTOWALK.place}, ${PHOTOWALK.address}. ` +
  `S sebou nabitý telefon a teplé oblečení. Detaily: ${PHOTOWALK_URL}`;

export function googleCalendarUrl() {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: PHOTOWALK.title,
    dates: `${utcStamp(PHOTOWALK.start)}/${utcStamp(PHOTOWALK.end)}`,
    details: calendarText(),
    location: `${PHOTOWALK.place}, ${PHOTOWALK.address}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsEscape(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/** Folds a content line to 75 octets as RFC 5545 asks. */
function fold(line: string) {
  const out: string[] = [];
  let current = '';
  for (const ch of line) {
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (Buffer.byteLength(current + ch, 'utf8') > limit) {
      out.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.join('\r\n ');
}

export function buildIcs() {
  const host = new URL(SITE_URL).hostname;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OPPO Cesko//Photo Walk//CS',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:photowalk-${PHOTOWALK.slug}@${host}`,
    `DTSTAMP:${utcStamp(new Date().toISOString())}`,
    `DTSTART:${utcStamp(PHOTOWALK.start)}`,
    `DTEND:${utcStamp(PHOTOWALK.end)}`,
    `SUMMARY:${icsEscape(PHOTOWALK.title)}`,
    `LOCATION:${icsEscape(`${PHOTOWALK.place}, ${PHOTOWALK.address}`)}`,
    `DESCRIPTION:${icsEscape(calendarText())}`,
    `URL:${PHOTOWALK_URL}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(PHOTOWALK.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}
