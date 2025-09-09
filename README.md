# SPST WebApp — README (MVP Spedizioni + Quotazioni)

> **Stack**: Next.js 14 (App Router) · TypeScript · TailwindCSS · Airtable (API) · Firebase (Auth + Storage) · Resend (Email) · Deploy: Vercel (Node 20.x)

Mini-documentazione operativa che copre architettura, flussi, pagine, endpoint, schemi Airtable, env, sicurezza e gotcha. Include **spedizioni** e **quotazioni/preventivi**.

---

## Struttura progetto

```
app/
  api/
    # --- Spedizioni ---
    spedizioni/route.ts                     # POST crea spedizione · GET lista (?email=... | auth)
    spedizioni/[id]/attachments/route.ts    # POST: allega file (URL Firebase) su Airtable
    spedizioni/[id]/colli/route.ts          # GET: lista colli (patch filtro lato Node su linked IDs)
    spedizioni/[id]/meta/route.ts           # GET: id pubblico & creato-da-email
    spedizioni/[id]/notify/route.ts         # POST: mail "Spedizione confermata" (Resend) + CTA WhatsApp

    # --- Utenti / profilo ---
    utenti/route.ts                         # GET: profilo da tab. UTENTI · POST: upsert profilo
    profile/route.ts                        # GET: Party mittente per prefill (da UTENTI)

    # --- Quotazioni (Preventivi) ---
    quotazioni/route.ts                     # GET :idOrDisplayId · GET ?email=... · POST create

  dashboard/
    page.tsx                                # Overview (KPI, tracking, ritiri) — filtrata per utente
    spedizioni/page.tsx                     # "Le mie spedizioni" + Drawer dettagli (client)
    nuova/vino/page.tsx                     # Form completo (vino) con packing list
    nuova/altro/page.tsx                    # Identico a vino, senza packing list
    impostazioni/page.tsx                   # Dati mittente (tab. UTENTI)
    informazioni-utili/page.tsx             # Statica/risorse
    compliance/page.tsx                     # (TODO)
    # quotazioni/page.tsx                   # (TODO) lista preventivi + dettaglio

components/
  Drawer.tsx
  Protected.tsx
  ShipmentCard.tsx
  ShipmentDetail.tsx
  Skeletons.tsx
  SpedizioniClient.tsx                      # Lista "Le mie spedizioni" (layout classico ripristinato)
  nuova/
    PartyCard.tsx
    ColliCard.tsx
    RitiroCard.tsx
    FatturaCard.tsx
    PackingListVino.tsx
    Field.tsx                               # Select & input helpers

lib/
  airtable.schema.ts                        # Nomi tabelle/campi Spedizioni (TABLE, F, FCOLLO, FPL, FUSER)
  airtable.ts                               # Spedizioni: create/list/attach/meta/utenti/colli + utils
  airtable.quotes.ts                        # Quotazioni: create/list/get + normalizzazione colli
  api.ts                                    # Facade client: postSpedizione, attachments, notify, getUserProfile
  authed-fetch.ts                           # fetch con Bearer token Firebase
  cors.ts                                   # CORS helper
  firebase-client.ts / firebase-client-auth.ts

styles & config (tailwind, postcss, next.config, tsconfig)
```

> Per le route che parlano con Airtable, aggiungere se non presente:
> `export const runtime = 'nodejs'` (evita Edge runtime).

---

## Cosa può fare il cliente (MVP)

**Spedizioni**

* Creare spedizioni *vino/altro* con colli e (per vino) packing list ✔
* Caricare **allegati** (fattura/packing) su Firebase e salvarli su Airtable ✔
* Ricevere **mail di conferma** *“Spedizione confermata”* (Resend, stile coerente) ✔
* Vedere **le mie spedizioni** (lista + drawer dettagli + colli) ✔
* Scaricare documenti (LDV/AWB, Fattura, Packing List, altri) con **smart-pick** ✔
* Overview: KPI + tracking “in corso” + **ritiri programmati** (filtrati per utente) ✔

**Profilo**

* Gestire **profilo mittente** (UTENTI) con prefill nei form ✔

**Quotazioni / Preventivi**

* Creare preventivi via API (con colli normalizzati) ✔
* Cercare/leggere preventivi per **ID visuale** o **recordId**, e per **email** ✔
* Normalizzazione **L/W/H/Peso/Quantita** anche da alias o testo libero tipo “40x30x20 cm” ✔

**Tracking**

* Mail “conferma” lato WebApp ✔
  *(La mail “in transito/evasione” è inviata dal backoffice; lo stile è stato allineato.)*

---

## Sicurezza & Filtri per utente

* **Auth Firebase** (client): l’App invia `Authorization: Bearer <idToken>` alle API.
* **GET /api/spedizioni** filtra per:

  * `?email=` **oppure** email estratta dal **Bearer**.
  * Il filtro avviene **server-side** in Airtable: `LOWER({Creato da}) = LOWER("<email>")`.
* **Overview** e **Le mie spedizioni** consumano solo record filtrati per utente → **niente cross-leak**.
* *(Opzionale)* è possibile rafforzare con verifica token lato server su tutte le route.

---

## Schemi Airtable

### Tabelle Spedizioni

* **SpedizioniWebApp** (`TABLE.SPED`, default `SpedizioniWebApp`)
* **SPED\_COLLI** (`TABLE.COLLI`, default `SPED_COLLI`)
* **SPED\_PL** (`TABLE.PL`, default `SPED_PL`) – solo vino
* **UTENTI** (`TABLE.UTENTI`, default `UTENTI`)

**Campi principali (estratto)**

* **F** (SpedizioniWebApp):
  `Stato`, `Incoterm`, `Valuta`, `Note Fattura`, `Creato da (email)`,
  blocchi **Mittente / Destinatario / Fatturazione**: RS, Referente, Paese, Città, CAP, Indirizzo, Telefono, P.IVA/CF,
  `Ritiro - Data` *(date-only)*, `Ritiro - Note`,
  `Fattura - Delega a SPST` *(checkbox)*,
  `Fattura - Allegato Cliente` *(Attachment)*, `Packing List - Allegato Cliente` *(Attachment)*,
  `ID Spedizione` *(umano, testo)*, `LinkColli`, `LinkPL`.
* **FCOLLO** (SPED\_COLLI):
  `Spedizione` *(link)*, `Lunghezza (cm)`, `Larghezza (cm)`, `Altezza (cm)`, `Peso (kg)`, `Quantità`.
* **FPL** (SPED\_PL):
  `Spedizione` *(link)*, `Etichetta`, `Bottiglie`, `Formato (L)`, `Gradazione (% vol)`, `Prezzo`, `Valuta`, `Peso netto/lordo bott`.
* **FUSER** (UTENTI):
  `Mail Cliente`, `Mittente`, `Paese Mittente`, `Città Mittente`, `CAP Mittente`, `Indirizzo Mittente`, **`Telefono Mittente`**, `Partita IVA Mittente`, `Data Creazione`.

### Tabelle Quotazioni

* **Preventivi** (default `Preventivi`)
* **Colli** (default `Colli`) — link `Preventivi` + fallback testo `Preventivo_Id`

**Campi canonici/alias (estratto)**

* **Preventivi**: `ID_Preventivo` | `ID Preventivo`, `Stato`, `Email_Cliente`, `CreatoDaEmail`, `Valuta`, `Data Ritiro` *(YYYY-MM-DD)*, `Note`, `Tipo Sped`, `Incoterm`, blocchi Mitt/Dest (RS, Indirizzo, CAP, Città, Paese, Telefono, TaxID).
* **Colli**: `Preventivi` *(link)*, `Preventivo_Id` *(fallback)*, `Quantita`, `L_cm`, `W_cm`, `H_cm`, `Peso`.
  Alias robusti e parsing dimensioni in `lib/airtable.quotes.ts`.

---

## Tipi / Contratti (TS)

### Spedizioni

```ts
type Party = {
  ragioneSociale: string; referente: string;
  paese: string; citta: string; cap: string; indirizzo: string;
  telefono: string; piva: string;
};

type Collo = {
  lunghezza_cm: number | null; larghezza_cm: number | null;
  altezza_cm: number | null; peso_kg: number | null;
};

type RigaPL = {
  etichetta: string; bottiglie: number; formato_litri: number;
  gradazione: number; prezzo: number; valuta: 'EUR'|'USD'|'GBP';
  peso_netto_bott: number; peso_lordo_bott: number;
};

interface SpedizionePayload {
  sorgente: 'vino'|'altro';
  tipoSped: 'B2B'|'B2C'|'Sample';
  destAbilitato?: boolean;
  contenuto?: string;
  formato: 'Pacco'|'Pallet';
  ritiroData?: string; ritiroNote?: string;
  mittente: Party; destinatario: Party;
  incoterm: 'DAP'|'DDP'|'EXW'; valuta: 'EUR'|'USD'|'GBP'; noteFatt?: string;
  fatturazione: Party; fattSameAsDest?: boolean; fattDelega?: boolean; fatturaFileName?: string | null;
  colli: Collo[]; packingList?: RigaPL[];
  createdByEmail?: string;
}
```

### Quotazioni (estratto)

```ts
type PartyQ = { ragioneSociale?: string; indirizzo?: string; cap?: string; citta?: string; paese?: string; telefono?: string; taxId?: string; };

type ColloQ = {
  quantita?: number;
  lunghezza_cm?: number|string|null; larghezza_cm?: number|string|null; altezza_cm?: number|string|null;
  l1_cm?: number|string|null; l2_cm?: number|string|null; l3_cm?: number|string|null;
  peso_kg?: number|string|null;
};

type PreventivoPayload = {
  createdByEmail?: string; customerEmail?: string; valuta?: 'EUR'|'USD'|'GBP';
  ritiroData?: string; noteGeneriche?: string; tipoSped?: 'B2B'|'B2C'|'Sample'; incoterm?: 'DAP'|'DDP'|'EXW';
  mittente?: PartyQ; destinatario?: PartyQ; colli?: ColloQ[];
};
```

---

## Flussi principali

### A) Spedizioni

1. **Creazione** (`/dashboard/nuova/vino|altro`)
   → `POST /api/spedizioni` con `SpedizionePayload`
   → Upload su Firebase → `POST /api/spedizioni/[id]/attachments`
   → Mail **conferma** (*best effort*): `POST /api/spedizioni/[id]/notify`
   → `GET /api/spedizioni/[id]/meta` (ID umano)
   → UI success con scorciatoie.

2. **Lista & dettagli** (`/dashboard/spedizioni`)
   → `GET /api/spedizioni[?email=...]` (o email da Bearer)
   → Card + **Drawer** (mitt/dest/fatt/incoterm)
   → Colli: `GET /api/spedizioni/[id]/colli` (**filtro lato Node** su linked IDs).

3. **Impostazioni (UTENTI)** (`/dashboard/impostazioni`)
   → `GET /api/utenti?email=...` (prefill) · `POST /api/utenti` (upsert).

4. **Overview** (`/dashboard`)
   → KPI (in corso / in consegna oggi), **Tracking** (stati attivi), **Ritiri programmati**
   → **Tutto filtrato** per l’utente loggato.

### B) Quotazioni (Preventivi)

* `GET /api/quotazioni/:idOrDisplayId` → trova per recordId o `ID_Preventivo`/`ID Preventivo` (case/space-insensitive) + carica **colli** con **normalizzazione**.
* `GET /api/quotazioni?email=...` → lista preventivi per email (alias robusti).
* `POST /api/quotazioni` → crea preventivo, valorizza alias, **crea colli** (tentativo con link + fallback senza link scrivendo `Preventivo_Id`).

---

## Endpoints (contratti rapidi)

**Spedizioni**

* `POST /api/spedizioni` → body `SpedizionePayload` → `{ id, idSpedizione }`
* `GET  /api/spedizioni[?email=...]` → `{ ok:true, rows:[{ id, fields, _createdTime? }] }`
* `GET  /api/spedizioni/:id/meta` → `{ idSpedizione?: string, creatoDaEmail?: string }`
* `GET  /api/spedizioni/:id/colli` → `{ ok:true, rows: { l?:number|null; w?:number|null; h?:number|null; peso?:number|null }[] }`
* `POST /api/spedizioni/:id/attachments` → `{ fattura?: Att[]; packing?: Att[] }` → `204`
* `POST /api/spedizioni/:id/notify` → `{ ok:true }` *(best effort)*

**Utenti / Profilo**

* `GET  /api/utenti?email=...` → `{ ok:true, data:[{ id, fields }] }`
* `POST /api/utenti` → `{ ok:true, record }`
* `GET  /api/profile` → `{ ok:true, party?: Party }`

**Quotazioni**

* `GET  /api/quotazioni/:idOrDisplayId` → `{ id, displayId?, fields, colli:[{ id, fields }] }`
* `GET  /api/quotazioni?email=...` → `[ { id, displayId?, fields } ]`
* `POST /api/quotazioni` → `{ id, displayId? }`

---

## Variabili d’ambiente

### Airtable (Spedizioni)

```
AIRTABLE_API_TOKEN=...                # o AIRTABLE_API_KEY
AIRTABLE_BASE_ID_SPST=...
AIRTABLE_TABLE_SPEDIZIONI_WEBAPP=SpedizioniWebApp
AIRTABLE_TABLE_SPED_COLLI=SPED_COLLI
AIRTABLE_TABLE_SPED_PL=SPED_PL
AIRTABLE_TABLE_UTENTI=UTENTI
```

### Airtable (Quotazioni)

```
AIRTABLE_TABLE_PREVENTIVI=Preventivi
AIRTABLE_TABLE_PREVENTIVI_COLLI=Colli
# opzionale fallback:
AIRTABLE_TABLE_COLLI=Colli
# logging
DEBUG_QUOTES=0|1
```

### Email / UI / Firebase

```
RESEND_API_KEY=...
EMAIL_FROM=notification@spst.it
EMAIL_LOGO_URL=https://app.spst.it/logo-email.png
APP_DASHBOARD_URL=https://app.spst.it/dashboard
INFO_URL=https://app.spst.it/dashboard/informazioni-utili
WHATSAPP_URL=https://wa.me/39XXXXXXXXXX

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

NEXT_PUBLIC_WHATSAPP_URL=https://wa.me/39XXXXXXXXX
NEXT_PUBLIC_INFO_URL=/dashboard/informazioni-utili
```

> **Runtime**: Node **20.x** (Vercel). Sulle route server aggiungere `export const runtime = 'nodejs'` ove serve.

---

## Gotcha / Fix recenti

1. **Overview**: ora usa **solo** record dell’utente loggato (email da Bearer o query) per **KPI**, **Tracking** e **Ritiri**.
2. **SpedizioniClient**: ripristinato layout “card per riga” + **Drawer**; fixata ricerca/ordinamento; dettaglio funzionante.
3. **Colli**: niente formula con `ARRAYJOIN` sugli ID; **filtro in Node** sugli array di linked record IDs.
4. **Date Airtable (date-only)**: salvare in **YYYY-MM-DD**.
5. **Attachment smart-pick**: LDV/AWB/Lettera · Fatt/Invoice · Packing/PL (fallback su nomi simili).
6. **Email notify (conferma)**: HTML/stile allineato alla mail “in transito” del backoffice.
7. **Quotazioni**: fix TypeScript (alias `ReadonlyArray`), parsing dimensioni da testo “40x30x20”, fallback da record Preventivo, logging `DEBUG_QUOTES`.
8. **Node runtime** esplicito sulle API Airtable per evitare Edge.

---

## Sviluppo locale

```bash
cp .env.example .env.local
npm i
npm run dev
```

---

## Roadmap breve

* [ ] **UI Quotazioni**: `app/dashboard/quotazioni/page.tsx` (lista + drawer) usando `/api/quotazioni`.
* [ ] **Tracking “live”**: webhook carrier (`/api/tracking/webhook`) + timeline eventi in `ShipmentDetail`.
* [ ] (Opzionale) Validazione server di tutti i Bearer Token sulle API.

---

## Licenza

TBD.
