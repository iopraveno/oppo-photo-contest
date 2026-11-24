# OPPO Photo Contest: Lovci světla

Web fotosoutěže pro Instagram. Soutěžící dají fotku na Instagram s **#OPPOLovciSvetla** a označením účtu OPPO CZ. Tým OPPO příspěvky jednou až dvakrát denně přidá do administrace. Web je ukáže v galerii a registrovaní uživatelé (ověřený e-mail) pro ně hlasují.

- Next.js 15 (App Router) + Supabase (databáze a přihlášení kódem z e-mailu), nasazení na Vercel
- Bez Instagram API: fotky se zobrazují přes oficiální vložení příspěvku z Instagramu
- Milníky výher podle počtu soutěžících (0 → Enco Air5 Pro, 50 → Watch S, 150 → Find X10)
- Ochrana hlasování: ověřený e-mail, blokace jednorázových e-mailů, limit hlasů z jedné IP, volitelná captcha (Cloudflare Turnstile), přehled podezřelých hlasů a jejich rušení v administraci

## Stránky

| Adresa | Co tam je |
| --- | --- |
| `/` | Úvod: jak se zapojit, milníky, ceny, nejnovější fotky, termíny |
| `/galerie` | Všechny fotky, filtr #ShotOnOPPO, řazení podle hlasů |
| `/foto/[id]` | Detail fotky s hlasováním a sdílením (tento odkaz soutěžící posílají kamarádům) |
| `/zebricek` | Pořadí podle hlasů |
| `/prihlaseni` | Přihlášení e-mailem (6místný kód) |
| `/pravidla` | **Návrh** pravidel, před spuštěním doplnit a nechat zkontrolovat |
| `/admin` | Přidávání příspěvků, skrývání, mazání, exporty CSV |
| `/admin/hlasy` | Kontrola hlasů: hlasy podle IP, skoky za hodinu, rušení hlasů |
| `/photowalk` | Skrytá stránka photo walku s Martinem Rakem: přihláška, volná místa, program, mapa (bez odkazu v menu, mimo vyhledávače) |
| `/admin/photowalk` | Přihlášky na photo walk: potvrzení místa, uvolnění, odmítnutí, export CSV |
| `/dotaznik` | Dotazník o širokých telefonech: jen klikání, jedna otázka na obrazovku, na konci volitelná pozvánka na osobní setkání (bez hlavičky a patičky soutěže) |
| `/admin/dotaznik` | Odpovědi z dotazníku: grafy, filtry, zdroje odkazů, kandidáti na setkání, tabulka, export CSV |

## Spuštění krok za krokem

### 1. Supabase (databáze a přihlášení)

1. Založ projekt na [supabase.com](https://supabase.com), region ideálně Frankfurt (EU).
2. **SQL Editor** → vlož obsah `supabase/schema.sql` → Run.
3. **Authentication → Sign In / Providers → Email**: nech zapnuté.
4. **Authentication → Emails → Templates**: v šablonách **Confirm signup** i **Magic Link** nahraď text odkazu kódem, například:
   ```html
   <h2>Tvůj kód pro hlasování v soutěži Lovci světla</h2>
   <p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
   <p>Kód opiš na webu soutěže. Platí jednu hodinu.</p>
   ```
   Kód místo odkazu je schválně: lidé přicházejí z Instagramu a e-mail často otevřou v jiném prohlížeči, kde by odkaz nefungoval.
5. **Authentication → Emails → SMTP Settings**: nastav vlastní SMTP (firemní, Brevo, Resend…). Vestavěné odesílání v Supabase má velmi nízký limit e-mailů za hodinu a je jen na testování.
6. **Authentication → Rate Limits**: po nastavení SMTP zvyš limit e-mailů za hodinu (např. 200+).
7. **Authentication → URL Configuration**: Site URL = adresa webu.
8. **Project Settings → API Keys**: zkopíruj URL projektu, veřejný klíč (anon / publishable) a tajný klíč (service_role / secret).

### 2. Proměnné prostředí

Zkopíruj `.env.example` do `.env.local` (lokálně) nebo je vlož do Vercelu (Settings → Environment Variables):

| Proměnná | Význam |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL projektu Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | veřejný klíč (anon / publishable); funguje i `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` z integrace Vercel ↔ Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | tajný klíč (service_role / secret), nikdy ho nedávej do prohlížeče; funguje i `SUPABASE_SECRET_KEY` z integrace |
| `NEXT_PUBLIC_SITE_URL` | adresa webu bez lomítka na konci; na Vercelu nepovinné, bez ní se použije produkční doména projektu |
| `NEXT_PUBLIC_IG_HANDLE` | instagramový účet OPPO CZ bez @ |
| `ADMIN_EMAILS` | e-maily (oddělené čárkou), které smí do `/admin` |
| `SURVEY_ADMIN_EMAILS` | volitelné: e-maily, které smí jen do `/admin/dotaznik` (kolegové na vyhodnocení dotazníku) |
| `VOTE_SALT` | náhodný dlouhý řetězec pro anonymizaci IP adres |
| `VOTES_PER_IP_PER_HOUR` | max. hlasů z jedné IP za hodinu (výchozí 40; sdílené Wi-Fi a mobilní sítě mají jednu IP pro víc lidí) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | volitelné: captcha Cloudflare Turnstile při přihlášení |

### 3. Vercel

1. Na [vercel.com](https://vercel.com) → Add New → Project → importuj toto repo.
2. Vlož proměnné prostředí z kroku 2 a dej Deploy.
3. Volitelně připoj vlastní doménu a uprav `NEXT_PUBLIC_SITE_URL` i Site URL v Supabase.

### 4. Před spuštěním

- [ ] `lib/config.ts`: zkontroluj termíny, hashtagy, výhry a limit fotek
- [ ] `app/pravidla/page.tsx`: doplň pořadatele a místa v [hranatých závorkách], nech zkontrolovat právníkem
- [ ] přihlas se na webu svým admin e-mailem a otevři `/admin`
- [ ] zkus přidat testovací příspěvek, zahlasovat a pak ho smazat

## Photo walk (skrytá stránka /photowalk)

Přihláška na photo walk s Martinem Rakem. Odkaz na `/photowalk` je jen v pozvánce e-mailem, web na stránku nikde neodkazuje a vyhledávače ji neindexují.

Jak to funguje:

1. Člověk vyplní jméno, e-mail, telefon a jaký má telefon (OPPO nebo OnePlus a model). Přijde mu e-mail, že je přihláška u nás.
2. V `/admin/photowalk` přihlášku potvrdíš tlačítkem **Potvrdit místo**. Zaplní se jeden čtvereček (na webu i v adminu) a účastníkovi odejde potvrzovací e-mail s programem, mapou a pozvánkou do kalendáře (příloha `.ics` a odkaz do Google Kalendáře).
3. Když je potvrzených 12 míst, další přihlášky se zapisují jako náhradníci. Místo jde kdykoli uvolnit (**Uvolnit místo**).

Spuštění:

1. **Supabase → SQL Editor**: vlož obsah `supabase/photowalk.sql` → Run (založí tabulku `photowalk_signups`).
2. **Vercel → Settings → Environment Variables**: doplň SMTP pro odesílání e-mailů. Použij stejnou schránku, ze které Supabase posílá přihlašovací kódy (Supabase → Authentication → Emails → SMTP Settings):

   | Proměnná | Význam |
   | --- | --- |
   | `SMTP_HOST` | např. `smtp.forpsi.com` |
   | `SMTP_PORT` | `465` (SSL) nebo `587` |
   | `SMTP_USER`, `SMTP_PASS` | přihlášení ke schránce |
   | `MAIL_FROM` | odesílatel, např. `OPPO Česko <ahoj@opposoutez.cz>` (výchozí je `SMTP_USER`) |
   | `MAIL_REPLY_TO` | nepovinné, kam chodí odpovědi (výchozí `ahoj@opposoutez.cz`) |
   | `PHOTOWALK_NOTIFY_EMAILS` | nepovinné, e-maily (oddělené čárkou), kterým přijde upozornění na každou novou přihlášku |
   | `PHOTOWALK_ADMIN_EMAILS` | nepovinné, e-maily (oddělené čárkou), které smí jen do `/admin/photowalk`, ne do zbytku administrace. Kdo je v `ADMIN_EMAILS`, má přístup i sem |

3. Redeploy. Admin ukáže červené upozornění, dokud SMTP chybí.

Datum, kapacita, uzávěrka přihlášek, program a zastávky jsou v `lib/config.ts` (`PHOTOWALK`). Obrázky jsou v `public/img/photowalk/`, verze pro e-maily v `public/img/photowalk/email/` (používá je i pozvánka).

## Lokální vývoj

```bash
npm install
npm run dev
```

Bez vyplněného Supabase běží web v ukázkovém režimu s vymyšlenými daty (jen při `npm run dev`).

## Denní práce moderátora

1. Na Instagramu projdi hashtag **#OPPOLovciSvetla** a záložku **Označení** na profilu OPPO CZ.
2. Pro každý vhodný příspěvek: zkopíruj odkaz (… → Kopírovat odkaz) a v `/admin` ho vlož spolu se jménem autora. Zaškrtni #ShotOnOPPO, pokud ho má v popisku.
3. Administrace hlídá limit (1 fotka týdně, max 3 na osobu) a upozorní na duplicity.
4. Kdo dal fotku jen na Instagram a nesplňuje pravidla (soukromý účet, album, mimo téma), tomu napiš komentář.
5. Jednou denně mrkni do `/admin/hlasy` na podezřelé skoky.

Milník počítá počet různých instagramových účtů se schválenou fotkou.

## Písmo

`public/fonts/OPPOSans.woff2` je OPPO Sans 4.0 zmenšené na latinku. Pokud máte oficiální soubor písma od OPPO, nahraďte ho (stejný název souboru).

## Dotazník o širokých telefonech (/dotaznik)

Dotazník pro zákazníky, fanoušky, média a influencery. Jen klikání, nejvýš 5 minut, 25 otázek v pěti částech: tvar (klasický A, široký B, široký skládací C), cena, paměť a RAM, nákup a pár otázek o respondentovi. Na konci jsou nepovinné volné odpovědi a otázka, jestli chce respondent pozvat na osobní setkání. Kdo řekne ano, musí vyplnit e-mail a dát souhlas. Lidem do 18 let se kontakt nenabízí.

- Otázky, možnosti a krátké názvy sloupců jsou na jednom místě: `lib/survey.ts`. Hodnoty (`value`) se ukládají do databáze, popisky (`label`) jde měnit kdykoli.
- **Zdroj odkazu:** každý influencer nebo médium dostane vlastní odkaz, třeba `/dotaznik?src=petr` nebo `?utm_source=newsletter`. V adminu je přehled podle zdrojů a filtr.
- Rozepsaný dotazník si prohlížeč pamatuje, takže se po zavření dá dokončit. Po odeslání ukáže „váš příští telefon“ a tlačítko na sdílení.
- Ochrana: skryté pole proti robotům a nejvýš 30 odpovědí z jedné IP za hodinu.

Zprovoznění:

1. V Supabase v **SQL Editoru** spusť `supabase/dotaznik.sql` (vytvoří tabulku `survey_responses`).
2. Volitelně přidej do Vercelu `SURVEY_ADMIN_EMAILS` pro kolegy, kteří mají vidět jen odpovědi z dotazníku.
3. Otevři `/admin/dotaznik`. Export do CSV otevřeš v Google Sheets (Soubor, Importovat) nebo v Excelu.

### Anketa (`/dotaznik/anketa`)

Kratší testovací anketa vedle hlavního dotazníku. Otázky a větvení jsou v `lib/survey-anketa.ts`: podle toho, jestli člověk o širokých telefonech slyšel a jestli ho zajímají, dostane jednu ze tří cest (`anketaFlow`). Server ukládá jen otázky z cesty, kterou člověk opravdu prošel. Odpovědi mají slug `wide-2026-anketa-2`; první verze ankety (`wide-2026-anketa`) zůstává v adminu jako „Anketa, 1. verze“ (`lib/survey-anketa-v1.ts`).

Kontakt k osobnímu setkání (telefon nebo e-mail, jméno, čas souhlasu) je v `open_answers.meet_contact`, `contact_name` a `meet_consent_at`, aby sloupce `email` a `contact_consent` zůstaly vyhrazené pro novinky.

### Nepovinné novinky v anketě

Na konci `/dotaznik/anketa` je nepovinný odběr novinek OPPO. „Ne, děkuji“ odešle odpovědi bez kontaktu; „Ano“ vyžaduje platný e-mail a samostatný souhlas. E-mail a souhlas se neukládají do konceptu v prohlížeči. Při odmítnutí server ignoruje i dříve vyplněný e-mail.

Používají se existující sloupce `survey_responses.email` a `contact_consent`, s účelem odlišeným slugem ankety. Znění, verze a čas souhlasu jsou v `open_answers.newsletter_consent_text`, `newsletter_consent_version` a `newsletter_consent_at`. Kontakty jsou v administraci ankety a v CSV včetně záznamu souhlasu. Není potřeba SQL migrace. Změna sbírá přihlášky; automatické rozesílání ani přenos do externího newsletterového nástroje nezavádí. Žádosti o ukončení odběru se vyřizují přes kontaktní e-mail uvedený v souhlasu.

Validaci kontaktu a ukládání obou větví serverové akce ověřuje `npm run test:survey`.
