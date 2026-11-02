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
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | veřejný klíč (anon / publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | tajný klíč (service_role / secret), nikdy ho nedávej do prohlížeče |
| `NEXT_PUBLIC_SITE_URL` | adresa webu bez lomítka na konci; na Vercelu nepovinné, bez ní se použije produkční doména projektu |
| `NEXT_PUBLIC_IG_HANDLE` | instagramový účet OPPO CZ bez @ |
| `ADMIN_EMAILS` | e-maily (oddělené čárkou), které smí do `/admin` |
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
