import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/lib/seo';
import { CONTEST, ORGANIZER, TURNSTILE_SITE_KEY } from '@/lib/config';
import { longDate } from '@/lib/contest';

export const metadata: Metadata = pageMeta({
  title: 'Ochrana osobních údajů',
  description: `Jak pořadatel fotosoutěže OPPO ${CONTEST.name} zpracovává osobní údaje hlasujících a soutěžících: jaké údaje, proč, jak dlouho a jaká máš práva.`,
  path: '/ochrana-osobnich-udaju',
});

// Written for this contest website; OPPO's general privacy policy covers OPPO's own products and services.
export default function PrivacyPage() {
  const h = CONTEST.instagramHandle;
  const mail = <a href={`mailto:${ORGANIZER.email}`}>{ORGANIZER.email}</a>;

  return (
    <section className="section">
      <div className="container prose">
        <p className="eyebrow">Osobní údaje</p>
        <h1 className="section-title">Zásady zpracování osobních údajů</h1>
        <p>
          Tyto zásady vysvětlují, jak při fotosoutěži {CONTEST.fullName} zpracováváme osobní údaje lidí, kteří na tomto webu
          hlasují, a soutěžících, jejichž fotky jsou v galerii. Řídíme se nařízením EU 2016/679 (GDPR) a zákonem č. 110/2019 Sb.
          Zpracování osobních údajů při používání produktů a služeb OPPO popisují{' '}
          <a href="https://www.oppo.com/cz/privacy/" target="_blank" rel="noopener noreferrer">zásady ochrany osobních údajů OPPO</a>.
        </p>

        <h2>1. Kdo údaje zpracovává</h2>
        <p>
          Správcem osobních údajů je pořadatel soutěže {ORGANIZER.name}, IČO {ORGANIZER.ico}, se sídlem {ORGANIZER.address},{' '}
          {ORGANIZER.register} (dále jen „pořadatel“ nebo „my“). Napsat nám můžeš na {mail}.
        </p>

        <h2>2. Jaké údaje zpracováváme</h2>
        <ul>
          <li>
            <strong>Hlasující:</strong> e-mailová adresa, informace o tom, pro které fotky jsi hlasoval(a) a kdy, a IP adresa v
            nevratně zašifrované podobě (otisk), kterou nelze převést zpět na původní adresu.
          </li>
          <li>
            <strong>Soutěžící:</strong> uživatelské jméno na Instagramu, odkaz na soutěžní příspěvek, informace, zda příspěvek obsahuje{' '}
            {CONTEST.oppoHashtag}, a počet hlasů. Samotná fotka zůstává na Instagramu a na webu se zobrazuje přes vložený příspěvek.
          </li>
          <li>
            <strong>Výherci:</strong> jméno a příjmení, doručovací adresa a telefon pro doručení výhry. U výherce OPPO Find X10 také
            údaje potřebné k uzavření dohody o natočení videa.
          </li>
          <li>
            <strong>Technické údaje:</strong> přihlašovací cookie a běžné záznamy o provozu serveru (například IP adresa a čas
            požadavku), které vznikají při každé návštěvě webu.
          </li>
        </ul>

        <h2>3. Proč a na jakém základě</h2>
        <ul>
          <li>
            <strong>Organizace soutěže</strong> (přihlášení e-mailem, započítání hlasů, zobrazení fotek v galerii, vyhodnocení a
            předání výher): plnění pravidel soutěže, kterých se účastníš, podle čl. 6 odst. 1 písm. b) GDPR.
          </li>
          <li>
            <strong>Ochrana před podvody</strong> (kontrola hromadně zakládaných e-mailů a neobvyklého množství hlasů z jednoho
            připojení, rušení neplatných hlasů) a <strong>bezpečnost webu</strong>: náš oprávněný zájem na férovém průběhu soutěže
            podle čl. 6 odst. 1 písm. f) GDPR.
          </li>
          <li>
            <strong>Daňové a účetní povinnosti</strong> spojené s výhrami: plnění právní povinnosti podle čl. 6 odst. 1 písm. c)
            GDPR.
          </li>
        </ul>
        <p>
          E-mail hlasujících nepoužíváme k zasílání reklamy ani novinek a nikomu ho neprodáváme. Výherce kontaktujeme zprávou na
          Instagramu z účtu @{h}.
        </p>

        <h2>4. Kdo nám se zpracováním pomáhá</h2>
        <p>Údaje zpracovávají jen naši zpracovatelé, a to v rozsahu nutném pro provoz webu a soutěže:</p>
        <ul>
          <li>Vercel Inc., USA: provoz (hosting) webu,</li>
          <li>Supabase, Inc., USA: databáze a přihlašování e-mailem,</li>
          <li>INTERNET CZ, a.s. (FORPSI), IČO 26043319, Ktiš 2: odesílání e-mailů s přihlašovacím kódem,</li>
          {TURNSTILE_SITE_KEY && <li>Cloudflare, Inc., USA: ochrana přihlášení před roboty (Turnstile),</li>}
          <li>přepravci a doručovací služby: doručení výher.</li>
        </ul>
        <p>
          Vercel a Supabase mají sídlo v USA. Pokud dochází k předání údajů mimo EU, je chráněno standardními smluvními doložkami
          schválenými Evropskou komisí nebo rámcem EU–USA pro ochranu osobních údajů (Data Privacy Framework).
        </p>

        <h2>5. Instagram</h2>
        <p>
          Soutěžní fotky na webu zobrazujeme jako vložené příspěvky z Instagramu. Při jejich načtení se tvůj prohlížeč spojuje se
          servery Instagramu a společnost Meta Platforms Ireland Limited může zpracovávat tvou IP adresu a své cookies podle{' '}
          <a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noopener noreferrer">zásad Instagramu</a>.
          Příspěvky soutěžících jsou na Instagramu veřejné a řídí se podmínkami Instagramu. Soutěž není s Instagramem nijak
          spojena.
        </p>

        <h2>6. Jak dlouho údaje uchováváme</h2>
        <ul>
          <li>
            E-maily hlasujících, záznamy o hlasech a otisky IP adres smažeme po předání výher. Hlasování končí{' '}
            {longDate(CONTEST.votingEnd)} 2026.
          </li>
          <li>Údaje o soutěžních příspěvcích uchováváme po dobu trvání soutěže a předání výher.</li>
          <li>Údaje výherců uchováváme po dobu, kterou vyžadují daňové a účetní předpisy.</li>
        </ul>

        <h2>7. Cookies</h2>
        <p>
          Na tomto webu používáme jen technicky nezbytnou cookie, která tě po přihlášení drží přihlášeného(ou), abys mohl(a)
          hlasovat. Nepoužíváme analytické ani reklamní cookies, takže k nim nežádáme souhlas. Cookies Instagramu popisuje bod 5.
        </p>

        <h2>8. Tvoje práva</h2>
        <p>V souvislosti se zpracováním osobních údajů máš právo:</p>
        <ul>
          <li>na přístup k údajům a na jejich kopii,</li>
          <li>na opravu nepřesných údajů,</li>
          <li>na výmaz (například když chceš zrušit svůj účet pro hlasování; tvé hlasy se tím zruší),</li>
          <li>na omezení zpracování,</li>
          <li>na přenositelnost údajů,</li>
          <li>vznést námitku proti zpracování na základě oprávněného zájmu,</li>
          <li>
            podat stížnost u Úřadu pro ochranu osobních údajů, Pplk. Sochora 27, 170 00 Praha 7,{' '}
            <a href="https://uoou.gov.cz" target="_blank" rel="noopener noreferrer">uoou.gov.cz</a>.
          </li>
        </ul>
        <p>
          Svá práva uplatníš e-mailem na {mail}. Kvůli ochraně tvých údajů ti můžeme poslat ověřovací zprávu na e-mail, kterým jsi
          hlasoval(a). Odpovíme bez zbytečného odkladu, nejpozději do jednoho měsíce.
        </p>

        <h2>9. Změny</h2>
        <p>
          Tyto zásady můžeme upravit, například když se změní způsob provozu soutěže. Aktuální znění najdeš vždy na této stránce.
          Pravidla soutěže jsou na stránce <Link href="/pravidla">Pravidla soutěže</Link>.
        </p>
        <p className="muted small">Poslední aktualizace: 2. listopadu 2026</p>
      </div>
    </section>
  );
}
