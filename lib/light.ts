import SunCalc from 'suncalc';

// Golden hour: sun between -4° and +6°. Blue hour: between -6° and -4°.
// SunCalc already knows -6° (dawn/dusk) and +6° (goldenHourEnd/goldenHour); -4° is added here once.
const registered = (SunCalc as unknown as { times: [number, string, string][] }).times;
if (!registered.some(([angle]) => angle === -4)) SunCalc.addTime(-4, 'morningBlueEnd', 'eveningBlueStart');

const PRAGUE = { lat: 50.0755, lng: 14.4378 };
const TZ = 'Europe/Prague';

export type LightDay = {
  dawn: number;
  morningBlueEnd: number;
  sunrise: number;
  morningGoldenEnd: number;
  eveningGoldenStart: number;
  sunset: number;
  eveningBlueStart: number;
  dusk: number;
};

function pragueDateParts(ms: number) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day') };
}

/** Light phases in Prague for the calendar day (Prague time) that contains `ms`. */
export function lightDay(ms: number, dayOffset = 0): LightDay {
  const { y, m, d } = pragueDateParts(ms);
  const noon = new Date(Date.UTC(y, m - 1, d + dayOffset, 11));
  const t = SunCalc.getTimes(noon, PRAGUE.lat, PRAGUE.lng) as SunCalc.GetTimesResult & Record<string, Date>;
  return {
    dawn: t.dawn.getTime(),
    morningBlueEnd: t.morningBlueEnd.getTime(),
    sunrise: t.sunrise.getTime(),
    morningGoldenEnd: t.goldenHourEnd.getTime(),
    eveningGoldenStart: t.goldenHour.getTime(),
    sunset: t.sunset.getTime(),
    eveningBlueStart: t.eveningBlueStart.getTime(),
    dusk: t.dusk.getTime(),
  };
}

const timeFmt = new Intl.DateTimeFormat('cs-CZ', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('cs-CZ', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });

export const hhmm = (ms: number) => timeFmt.format(new Date(ms));
export const dayLabel = (ms: number) => dayFmt.format(new Date(ms));
export const range = (a: number, b: number) => `${hhmm(a)}–${hhmm(b)}`;

function inMinutes(from: number, to: number) {
  const min = Math.max(1, Math.round((to - from) / 60000));
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
}

/** One sentence about the light right now, e.g. "Právě je zlatá hodina, potrvá do 16:57." */
export function lightNow(now: number): string {
  const t = lightDay(now);
  if (now < t.dawn) return `Ranní modrá hodina začne v ${hhmm(t.dawn)}, zlatá v ${hhmm(t.morningBlueEnd)}.`;
  if (now < t.morningBlueEnd) return `Právě je modrá hodina. Zlatá začne v ${hhmm(t.morningBlueEnd)}.`;
  if (now < t.morningGoldenEnd) return `Právě je ranní zlatá hodina, potrvá do ${hhmm(t.morningGoldenEnd)}.`;
  if (now < t.eveningGoldenStart) return `Zlatá hodina začne v ${hhmm(t.eveningGoldenStart)}, za ${inMinutes(now, t.eveningGoldenStart)}.`;
  if (now < t.eveningBlueStart) return `Právě je zlatá hodina, potrvá do ${hhmm(t.eveningBlueStart)}.`;
  if (now < t.dusk) return `Právě je modrá hodina, potrvá do ${hhmm(t.dusk)}.`;
  const tomorrow = lightDay(now, 1);
  return `Dnešní světlo skončilo. Zítra ráno modrá hodina v ${hhmm(tomorrow.dawn)}, zlatá v ${hhmm(tomorrow.morningBlueEnd)}.`;
}
