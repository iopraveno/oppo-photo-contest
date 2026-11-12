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
  // From supabase/photowalk-ucast.sql; missing until that migration runs.
  rsvp_token?: string;
  attendance?: Attendance | null;
  attendance_at?: string | null;
  reminder_sent_at?: string | null;
};

/** The participant's own answer from /photowalk/potvrzeni: yes = will come, no = gave the place up. */
export type Attendance = 'yes' | 'no';

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

// ---- Attendance confirmation ----------------------------------------------

/** Token that opens /photowalk/potvrzeni as a read-only sample (for the admin's test e-mail). */
export const RSVP_SAMPLE = 'ukazka';

/** Personal link from the reminder e-mail. `v` only pre-selects a button: e-mail scanners open links, so nothing is saved on GET. */
export function rsvpUrl(token: string, choice?: 'ano' | 'ne') {
  return `${PHOTOWALK_URL}/potvrzeni?t=${encodeURIComponent(token)}${choice ? `&v=${choice}` : ''}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function findSignupByToken(token: string): Promise<Signup | null> {
  if (!UUID.test(token) || !isSupabaseConfigured()) return null;
  const { data, error } = await createAdminClient()
    .from('photowalk_signups')
    .select('*')
    .eq('event', PHOTOWALK.slug)
    .eq('rsvp_token', token)
    .maybeSingle();
  if (error) {
    console.error('findSignupByToken failed (is supabase/photowalk-ucast.sql applied?):', error.message);
    return null;
  }
  return (data as Signup) ?? null;
}

/** True once supabase/photowalk-ucast.sql has run (the attendance columns exist). */
export async function attendanceReady() {
  if (!isSupabaseConfigured()) return false;
  const { error } = await createAdminClient().from('photowalk_signups').select('rsvp_token').limit(1);
  return !error;
}

/** Answers are open from the moment a place is confirmed until the walk starts. */
export const attendanceOpen = (now = new Date()) => now < new Date(PHOTOWALK.start);

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
/** Deadline after "do": "neděle 8. 11." */
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
