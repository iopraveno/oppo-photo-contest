import 'server-only';
import { ORGANIZER, PHOTOWALK, SITE_URL } from './config';
import { buildIcs, eventDayLabel, eventTimeLabel, googleCalendarUrl, phoneLabel, PHOTOWALK_URL, rsvpUrl, type SeatCounts, type Signup } from './photowalk';
import type { Mail } from './mail';

// Table-based HTML so it renders the same in Gmail, Outlook and Apple Mail. Same look as the invitation e-mail.

const F = "font-family:'OPPO Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
const IMG = `${SITE_URL}/img/photowalk/email`;
const T = 'role="presentation" cellpadding="0" cellspacing="0" border="0"';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function layout(opts: { preheader: string; title: string; body: string; hero?: boolean }) {
  const hero = opts.hero
    ? `<tr><td style="background-color:#0E0E0D;padding:0 40px 8px 40px;">
        <img src="${IMG}/hero.jpg" width="520" height="347" alt="Praha, foto Martin Rak" style="display:block;width:100%;max-width:520px;height:auto;background-color:#24231F;">
        <div style="${F}font-size:12px;line-height:16px;color:#6F6A62;text-align:right;padding-top:8px;">Foto: Martin Rak</div>
      </td></tr>`
    : '';
  return `<!DOCTYPE html>
<html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${esc(opts.title)}</title>
<style>
  body{margin:0;padding:0;} table,td{border-collapse:collapse;} img{border:0;display:block;} a{text-decoration:none;}
  @media screen and (max-width:620px){ .px{padding-left:24px !important;padding-right:24px !important;} .h1{font-size:32px !important;line-height:37px !important;} .stack{display:block !important;width:auto !important;} }
</style></head>
<body style="margin:0;padding:0;background-color:#E7E3DC;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(opts.preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table ${T} width="100%" style="background-color:#E7E3DC;"><tr><td align="center" style="padding:24px 0;">
<table ${T} width="600" style="width:600px;max-width:100%;">
  <tr><td class="px" style="background-color:#0E0E0D;padding:30px 40px 30px 40px;">
    <table ${T} width="100%"><tr>
      <td><img src="${IMG}/logo.png" width="96" height="23" alt="OPPO" style="display:block;width:96px;height:23px;color:#F2EFEA;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;"></td>
      <td align="right" style="${F}font-size:13px;line-height:18px;color:#9A958C;">Photo Walk&nbsp;&nbsp;<span style="color:#F07C2E;">&#9679;</span>&nbsp;&nbsp;Praha</td>
    </tr></table>
  </td></tr>
  ${hero}
  <tr><td class="px" style="background-color:#FAF8F4;padding:44px 48px 44px 48px;">${opts.body}</td></tr>
  <tr><td class="px" style="background-color:#0E0E0D;padding:28px 48px 30px 48px;${F}font-size:12px;line-height:19px;color:#8A857C;">
    Máte dotaz? Stačí odpovědět na tento e-mail.<br>${esc(ORGANIZER.name)}, autorizovaný distributor značky OPPO pro ČR<br>
    <a href="${PHOTOWALK_URL}" style="color:#CFCAC2;text-decoration:underline;">${esc(PHOTOWALK_URL.replace(/^https?:\/\//, ''))}</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const h1 = (t: string) => `<h1 class="h1" style="margin:0;${F}font-size:36px;line-height:41px;font-weight:700;letter-spacing:-0.8px;color:#141414;">${t}</h1>`;
const p = (t: string, top = 16) => `<p style="margin:0;padding-top:${top}px;${F}font-size:16px;line-height:26px;color:#2A2825;">${t}</p>`;
const muted = (t: string, top = 16) => `<p style="margin:0;padding-top:${top}px;${F}font-size:14px;line-height:22px;color:#5F5A53;">${t}</p>`;

function details(rows: [string, string][]) {
  const tr = rows
    .map(
      ([k, v], i) => `<tr>
        <td class="stack" width="120" valign="top" style="width:120px;${i ? 'border-top:1px solid #DDD6CC;' : ''}padding:12px 0;${F}font-size:15px;line-height:22px;font-weight:700;color:#141414;">${k}</td>
        <td class="stack" valign="top" style="${i ? 'border-top:1px solid #DDD6CC;' : ''}padding:12px 0;${F}font-size:15px;line-height:22px;color:#2A2825;">${v}</td>
      </tr>`,
    )
    .join('');
  return `<table ${T} width="100%" style="margin-top:24px;background-color:#F0ECE5;"><tr><td style="padding:8px 24px;"><table ${T} width="100%">${tr}</table></td></tr></table>`;
}

function button(href: string, label: string, dark = true) {
  const bg = dark ? '#141414' : '#F07C2E';
  const fg = dark ? '#F2EFEA' : '#141414';
  return `<a href="${href}" target="_blank" style="display:inline-block;background-color:${bg};color:${fg};${F}font-size:15px;line-height:20px;font-weight:700;padding:14px 26px;border-radius:999px;margin:0 8px 8px 0;">${label}</a>`;
}

const when = () => `${eventDayLabel()}, ${eventTimeLabel()}`;
/** "v sobotu 14. listopadu" (eventDayLabel is in the nominative). */
const WEEKDAY_ACC: Record<string, string> = { středa: 'středu', sobota: 'sobotu', neděle: 'neděli' };
const onDay = () => {
  const [weekday, ...rest] = eventDayLabel().split(' ');
  return { weekday: WEEKDAY_ACC[weekday] ?? weekday, full: [WEEKDAY_ACC[weekday] ?? weekday, ...rest].join(' ') };
};
const where = () =>
  `${PHOTOWALK.place}, ${PHOTOWALK.address}<br><span style="color:#5F5A53;">${PHOTOWALK.transport}</span> &nbsp;<a href="${PHOTOWALK.mapsUrl}" target="_blank" style="color:#141414;text-decoration:underline;">Mapa</a>`;

/** Right after the form is sent. */
export function receivedEmail(s: Pick<Signup, 'brand' | 'model'>, waitlist: boolean): Mail {
  const lead = waitlist
    ? `Díky za přihlášku na photo walk s Martinem Rakem. Všech ${PHOTOWALK.capacity} míst je teď obsazených, takže jsme vás zapsali mezi náhradníky. Kdyby se místo uvolnilo, hned se ozveme.`
    : 'Díky za přihlášku na photo walk s Martinem Rakem. Teď ji projdeme a místo vám potvrdíme dalším e-mailem.';
  const body = `
    ${h1(waitlist ? 'Jste mezi náhradníky' : 'Přihláška je u nás')}
    ${p('Dobrý den,', 22)}
    ${p(lead)}
    ${details([
      ['Kdy', when()],
      ['Kde', where()],
      ['Telefon', esc(phoneLabel(s.brand, s.model))],
    ])}
    ${muted('Kdybyste nakonec nemohli dorazit, stačí odpovědět na tento e-mail. Místo pak dostane někdo další.', 24)}
    ${p('Těšíme se,<br><strong>tým OPPO Česko</strong>', 24)}`;
  const text = [
    waitlist ? 'Jste mezi náhradníky' : 'Přihláška je u nás',
    '',
    'Dobrý den,',
    lead,
    '',
    `Kdy: ${when()}`,
    `Kde: ${PHOTOWALK.place}, ${PHOTOWALK.address} (${PHOTOWALK.transport})`,
    `Telefon: ${phoneLabel(s.brand, s.model)}`,
    '',
    'Kdybyste nakonec nemohli dorazit, stačí odpovědět na tento e-mail.',
    '',
    'Tým OPPO Česko',
    PHOTOWALK_URL,
  ].join('\n');
  return {
    to: '',
    subject: waitlist ? 'Photo walk s Martinem Rakem: jste mezi náhradníky' : 'Přihláška na photo walk s Martinem Rakem je u nás',
    html: layout({ preheader: lead, title: 'Přihláška na photo walk', body }),
    text,
  };
}

/** When an admin confirms the place. Carries the calendar file. */
export function confirmedEmail(): Mail {
  const bring = ['Nabitý telefon', 'Powerbanku', 'Teplou bundu a pohodlné boty'];
  const list = bring
    .map(
      (b) => `<tr><td width="26" valign="top" style="width:26px;padding:7px 0 0 0;"><table ${T}><tr><td width="10" height="10" style="width:10px;height:10px;border:2px solid #F07C2E;font-size:0;line-height:0;">&nbsp;</td></tr></table></td>
      <td style="padding:2px 0 6px 0;${F}font-size:15px;line-height:24px;color:#141414;">${b}</td></tr>`,
    )
    .join('');
  const program = PHOTOWALK.program
    .map(
      (it, i) => `<tr>
        <td width="64" valign="top" style="width:64px;${i ? 'border-top:1px solid #DDD6CC;' : ''}padding:12px 0;${F}font-size:15px;line-height:22px;font-weight:700;color:#B5531A;">${it.time}</td>
        <td valign="top" style="${i ? 'border-top:1px solid #DDD6CC;' : ''}padding:12px 0;${F}font-size:15px;line-height:22px;color:#2A2825;"><strong style="color:#141414;">${it.title}</strong></td>
      </tr>`,
    )
    .join('');
  const body = `
    ${h1('Máte potvrzené místo')}
    ${p('Dobrý den,', 22)}
    ${p('počítáme s vámi na photo walku s Martinem Rakem. Tady je všechno, co budete potřebovat.')}
    ${details([
      ['Kdy', `${when()}<br><span style="color:#5F5A53;">sraz ve 14:00, ať stihneme kávu i úvod</span>`],
      ['Kde', where()],
      ['Telefon', `<a href="tel:${PHOTOWALK.contactPhone.replace(/\s/g, '')}" style="color:#141414;font-weight:700;text-decoration:none;">${PHOTOWALK.contactPhone}</a><br><span style="color:#5F5A53;">když nestíháte, nemůžete nás najít nebo nakonec nedorazíte</span>`],
    ])}
    <div style="padding-top:22px;">
      ${button(googleCalendarUrl(), 'Přidat do Google Kalendáře')}
      ${button(`${PHOTOWALK_URL}/kalendar.ics`, 'Stáhnout do kalendáře', false)}
    </div>
    ${muted('Událost do kalendáře najdete i v příloze tohoto e-mailu (photowalk.ics).', 4)}

    <h2 style="margin:0;padding-top:36px;${F}font-size:22px;line-height:28px;font-weight:700;color:#141414;">Program</h2>
    <table ${T} width="100%" style="margin-top:8px;">${program}</table>

    <h2 style="margin:0;padding-top:32px;${F}font-size:22px;line-height:28px;font-weight:700;color:#141414;">Sbalte si</h2>
    <table ${T} width="100%" style="margin-top:12px;">${list}</table>
    ${muted(`Na vyzkoušení budeme mít i Find X10 s telekonvertorem. Každý účastník dostane ${PHOTOWALK.voucher.charAt(0).toLowerCase() + PHOTOWALK.voucher.slice(1)}.`, 8)}

    <table ${T} width="100%" style="margin-top:28px;"><tr><td>
      <img src="${IMG}/mapa.jpg" width="504" height="717" alt="Mapa trasy po Vyšehradě" style="display:block;width:100%;max-width:504px;height:auto;background-color:#F0ECE5;">
    </td></tr></table>

    ${muted('Během odpoledne bude kolegyně Jana fotit a natáčet pro sítě OPPO. Kdo nechce být v záběru, stačí jí to říct.', 24)}
    ${p('Těšíme se na vás,<br><strong>tým OPPO Česko</strong>', 24)}
    ${muted(`P.S. Kdybyste nakonec nemohli dorazit, zavolejte nám prosím na ${PHOTOWALK.contactPhone} nebo odpovězte na tento e-mail. Místo pak dostane někdo z náhradníků.`, 20)}`;
  const text = [
    'Máte potvrzené místo',
    '',
    'Dobrý den,',
    'počítáme s vámi na photo walku s Martinem Rakem.',
    '',
    `Kdy: ${when()} (sraz ve 14:00)`,
    `Kde: ${PHOTOWALK.place}, ${PHOTOWALK.address} (${PHOTOWALK.transport})`,
    `Mapa: ${PHOTOWALK.mapsUrl}`,
    `Telefon v den akce: ${PHOTOWALK.contactPhone} (když nestíháte, nemůžete nás najít nebo nakonec nedorazíte)`,
    `Do kalendáře: ${googleCalendarUrl()}`,
    '',
    'Program:',
    ...PHOTOWALK.program.map((it) => `${it.time} ${it.title}`),
    '',
    'Sbalte si: nabitý telefon, powerbanku, teplou bundu a pohodlné boty.',
    '',
    `Kdybyste nakonec nemohli dorazit, zavolejte nám prosím na ${PHOTOWALK.contactPhone} nebo odpovězte na tento e-mail.`,
    '',
    'Tým OPPO Česko',
    PHOTOWALK_URL,
  ].join('\n');
  return {
    to: '',
    subject: 'Máte potvrzené místo na photo walku s Martinem Rakem',
    html: layout({ preheader: `${when()}, ${PHOTOWALK.place}. Přidejte si to do kalendáře.`, title: 'Potvrzené místo na photo walku', body, hero: true }),
    text,
    attachments: [{ filename: 'photowalk.ics', content: buildIcs(), contentType: 'text/calendar; charset=utf-8; method=PUBLISH' }],
  };
}

/** A few days before the walk: confirm you are coming, or give the place to someone on the waiting list. */
export function reminderEmail(token: string): Mail {
  const yes = rsvpUrl(token, 'ano');
  const no = rsvpUrl(token, 'ne');
  const lead = `v ${onDay().full} ve 14:00 vyrážíme s Martinem Rakem fotit Vyšehrad a vy máte jedno z ${PHOTOWALK.capacity} míst. Dejte nám prosím vědět, jestli platí, že dorazíte. Když to nevyjde, uvolněte místo, ať ho můžeme nabídnout někomu z náhradníků.`;
  const body = `
    ${h1(`Dorazíte v ${onDay().weekday}?`)}
    ${p('Dobrý den,', 22)}
    ${p(lead)}
    <div style="padding-top:26px;">
      ${button(yes, 'Ano, dorazím', false)}
      ${button(no, 'Nedorazím, uvolním místo')}
    </div>
    ${muted('Tlačítko otevře stránku, kde odpověď jedním klepnutím potvrdíte. Kdyby se vám plány změnily, odpověď tam jde upravit.', 6)}
    ${details([
      ['Kdy', `${when()}<br><span style="color:#5F5A53;">sraz ve 14:00, ať stihneme kávu i úvod</span>`],
      ['Kde', where()],
      ['Telefon', `<a href="tel:${PHOTOWALK.contactPhone.replace(/\s/g, '')}" style="color:#141414;font-weight:700;text-decoration:none;">${PHOTOWALK.contactPhone}</a><br><span style="color:#5F5A53;">v den akce, když nestíháte nebo nás nemůžete najít</span>`],
    ])}
    ${muted('S sebou nabitý telefon, powerbanku a teplé oblečení. Na vyzkoušení budeme mít i nové Find X10.', 24)}
    ${p('Těšíme se,<br><strong>tým OPPO Česko</strong>', 24)}`;
  const text = [
    `Dorazíte v ${onDay().weekday}?`,
    '',
    'Dobrý den,',
    lead,
    '',
    `Ano, dorazím: ${yes}`,
    `Nedorazím, uvolním místo: ${no}`,
    '',
    `Kdy: ${when()} (sraz ve 14:00)`,
    `Kde: ${PHOTOWALK.place}, ${PHOTOWALK.address} (${PHOTOWALK.transport})`,
    `Telefon v den akce: ${PHOTOWALK.contactPhone}`,
    '',
    'Tým OPPO Česko',
  ].join('\n');
  return {
    to: '',
    subject: 'Sobota s Martinem Rakem: dorazíte?',
    html: layout({ preheader: 'Potvrďte prosím jedním klepnutím, že dorazíte, nebo uvolněte místo pro náhradníka.', title: 'Dorazíte na photo walk?', body }),
    text,
  };
}

/** Heads-up for the team when someone answers from /photowalk/potvrzeni in a way that changes the seats. */
export function attendanceNotifyEmail(s: Pick<Signup, 'name' | 'email' | 'phone'>, change: 'freed' | 'back', counts: SeatCounts): Mail {
  const free = Math.max(PHOTOWALK.capacity - counts.confirmed, 0);
  const lines = [
    change === 'freed' ? `${s.name} nedorazí a uvolnil(a) místo.` : `${s.name} nakonec dorazí a vzal(a) si místo zpátky.`,
    `E-mail: ${s.email}`,
    `Telefon: ${s.phone}`,
    '',
    `Potvrzeno ${counts.confirmed} z ${PHOTOWALK.capacity}, volných míst ${free}, náhradníků čeká ${counts.pending}.`,
    change === 'freed' && counts.pending > 0 ? `Potvrdit náhradníka: ${SITE_URL}/admin/photowalk` : `Přehled: ${SITE_URL}/admin/photowalk`,
  ];
  return {
    to: '',
    subject: change === 'freed' ? `Photo walk: ${s.name} uvolnil(a) místo` : `Photo walk: ${s.name} se vrací`,
    html: `<div style="${F}font-size:15px;line-height:24px;color:#141414;">${lines.map((l) => esc(l)).join('<br>')}</div>`,
    text: lines.join('\n'),
  };
}

/** Short heads-up for the team about a new sign-up. */
export function adminNotifyEmail(s: Pick<Signup, 'name' | 'email' | 'phone' | 'brand' | 'model'>, counts: SeatCounts): Mail {
  const lines = [
    `Jméno: ${s.name}`,
    `E-mail: ${s.email}`,
    `Telefon: ${s.phone}`,
    `Telefon: ${phoneLabel(s.brand, s.model)}${s.brand === PHOTOWALK.otherBrand ? ' (jiná značka)' : ''}`,
    '',
    `Potvrzeno ${counts.confirmed} z ${PHOTOWALK.capacity}, čeká ${counts.pending}.`,
    `Potvrdit: ${SITE_URL}/admin/photowalk`,
  ];
  return {
    to: '',
    subject: `Photo walk: nová přihláška (${s.name})`,
    html: `<div style="${F}font-size:15px;line-height:24px;color:#141414;">${lines.map((l) => esc(l)).join('<br>')}</div>`,
    text: lines.join('\n'),
  };
}
