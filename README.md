
# SPST WebApp — README (MVP Spedizioni + Quotazioni)

> **Stack**: Next.js 14 (App Router) · TypeScript · TailwindCSS · Airtable (API) · Firebase (Auth + Storage) · Resend (Email) · Deploy: Vercel (Node 20.x)

Mini-documentazione operativa che copre architettura, flussi, pagine, endpoint, schemi Airtable, env e gotcha. Include sia **spedizioni** sia **quotazioni/preventivi**.

---

## Struttura progetto

```
app/
  api/
    # --- Spedizioni ---
    spedizioni/route.ts                     # POST crea spedizione · GET lista (?email=...)
    spedizioni/[id]/attachments/route.ts    # POST: allega file (URL Firebase) su Airtable
    spedizioni/[id]/colli/route.ts          # GET: lista colli (patch filtro lato Node su linked IDs)
    spedizioni/[id]/meta/route.ts           # GET: id pubblico & creato-da-email
    spedizioni/[id]/notify/route.ts         # POST: invia mail (Resend) + CTA WhatsApp

    # --- Utenti / profilo ---
    utenti/route.ts                         # GET: profilo da tab. UTENTI · POST: upsert profilo
    profile/route.ts                        # GET: profilo Party per prefill (usa tab. UTENTI)

    # --- Quotazioni (Preventivi) ---
    quotazioni/route.ts                     # GET :idOrDisplayId · GET ?email=... · POST create

  dashboard/
    page.tsx                                # (TODO) Overview
    spedizioni/page.tsx                     # Lista spedizioni + Drawer dettagli (client)
    nuova/vino/page.tsx                     # Form completo (vino) con packing list
    nuova/altro/page.tsx                    # Identico a vino, senza packing list
    impostazioni/page.tsx                   # Dati mittente (tab. UTENTI)
    informazioni-utili/page.tsx             # Statica/risorse (OK)
    compliance/page.tsx                     # (TODO)
    # (TODO) quotazioni/page.tsx            # Lista preventivi + dettaglio (vedi Gap & TODO)

components/
  Drawer.tsx
  Protected.tsx
  ShipmentCard.tsx
  ShipmentDetail.tsx
  Skeletons.tsx
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
  firebase-client-auth.ts / firebase-client.ts

styles & config (tailwind, postcss, next.config, tsconfig)
```

> Per le route che parlano con Airtable, aggiungere se non già presente:
> `export const runtime = 'nodejs'` (per evitare Edge).

---

## Schemi Airtable

### Tabelle Spedizioni

* **SpedizioniWebApp** (`TABLE.SPED`, default `"SpedizioniWebApp"`)
* **SPED\_COLLI** (`TABLE.COLLI`, default `"SPED_COLLI"`)
* **SPED\_PL** (`TABLE.PL`, default `"SPED_PL"`) – solo per vino
* **UTENTI** (`TABLE.UTENTI`, default `"UTENTI"`)

**Campi principali (estratto)**

* **F** (SpedizioniWebApp): Stato, Incoterm, Valuta, Note Fattura, Creato da, blocchi Mitt/Dest/Fatt, `Ritiro - Data` *(date only)*, `Ritiro - Note`, `Fattura - Delega a SPST` *(checkbox)*, `Fattura - Allegato Cliente` *(Attachment)*, `Packing List - Allegato Cliente` *(Attachment)*, `ID Spedizione` (umano), link a Colli/PL.
* **FCOLLO** (SPED\_COLLI): Spedizione *(link)*, Lunghezza/Larghezza/Altezza (cm), Peso (kg), Quantità.
* **FPL** (SPED\_PL): Spedizione *(link)*, Etichetta, Bottiglie, Formato (L), Gradazione, Prezzo, Valuta, Pesi netti/lordi.
* **FUSER** (UTENTI): Mail Cliente, Mittente, Paese/Città/CAP/Indirizzo/Telefono Mittente, P.IVA Mittente, Data Creazione.
  ✅ **Telefono Mittente** è stato aggiunto e mappato.

### Tabelle Quotazioni (Preventivi)

* **Preventivi** (default `"Preventivi"`)
* **Colli** (default `"Colli"`) — collegata a Preventivi con field linked **`Preventivi`** + fallback testo **`Preventivo_Id`**

**Campi canonici (estratto)**

* **Preventivi**:

  * ID visuale (formula): **`ID_Preventivo`** o **`ID Preventivo`** (usati per ricerca/mostra)
  * Stato, Email Cliente, CreatoDaEmail, Valuta, **Data Ritiro** *(date only ISO)*, Note generiche, Tipo sped, Incoterm
  * Mittente/Destinatario: RS, Indirizzo, CAP, Città, Paese, Telefono, TaxID
* **Colli**:

  * Link preventivo (linked) **`Preventivi`**, fallback **`Preventivo_Id`**
  * **`Quantita`**, **`L_cm`**, **`W_cm`**, **`H_cm`**, **`Peso`**

**Alias robusti (lettura/scrittura)**: vedi `lib/airtable.quotes.ts` (supporto a varianti tipo “Lunghezza (cm)”, “Peso (Kg)”, ecc. + parsing dimensioni testuali “40x30x20 cm”).

---

## Tipi / Contratti (TS)

### Party (spedizioni)

```ts
type Party = {
  ragioneSociale: string;
  referente: string;
  paese: string;
  citta: string;
  cap: string;
  indirizzo: string;
  telefono: string;
  piva: string;
}
```

### Collo (spedizioni)

```ts
type Collo = {
  lunghezza_cm: number | null;
  larghezza_cm: number | null;
  altezza_cm: number | null;
  peso_kg: number | null;
}
```

### RigaPL (vino)

```ts
type RigaPL = {
  etichetta: string;
  bottiglie: number;
  formato_litri: number;
  gradazione: number;
  prezzo: number;
  valuta: 'EUR' | 'USD' | 'GBP';
  peso_netto_bott: number;
  peso_lordo_bott: number;
}
```

### SpedizionePayload (POST /api/spedizioni)

```ts
interface SpedizionePayload {
  sorgente: 'vino' | 'altro';
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  destAbilitato?: boolean;
  contenuto?: string;
  formato: 'Pacco' | 'Pallet';
  ritiroData?: string;     // ISO → salvato come YYYY-MM-DD
  ritiroNote?: string;

  mittente: Party;
  destinatario: Party;

  incoterm: 'DAP' | 'DDP' | 'EXW';
  valuta: 'EUR' | 'USD' | 'GBP';
  noteFatt?: string;

  fatturazione: Party;
  fattSameAsDest?: boolean;
  fattDelega?: boolean;
  fatturaFileName?: string | null;

  colli: Collo[];
  packingList?: RigaPL[];  // solo 'vino'

  createdByEmail?: string; // scritto in F.CreatoDaEmail se presente
}
```

### Quotazioni (tipi UI)

```ts
type PartyQ = { ragioneSociale?: string; indirizzo?: string; cap?: string; citta?: string; paese?: string; telefono?: string; taxId?: string; };

type ColloQ = {
  quantita?: number;
  lunghezza_cm?: number | string | null;
  larghezza_cm?: number | string | null;
  altezza_cm?: number | string | null;
  l1_cm?: number | string | null; l2_cm?: number | string | null; l3_cm?: number | string | null;
  peso_kg?: number | string | null;
};

type PreventivoPayload = {
  createdByEmail?: string;
  customerEmail?: string;
  valuta?: 'EUR'|'USD'|'GBP';
  ritiroData?: string;     // ISO → YYYY-MM-DD
  noteGeneriche?: string;
  tipoSped?: 'B2B'|'B2C'|'Sample';
  incoterm?: 'DAP'|'DDP'|'EXW';
  mittente?: PartyQ;
  destinatario?: PartyQ;
  colli?: ColloQ[];
};
```

---

## Flussi principali

### A) Spedizioni

1. **Creazione** (`dashboard/nuova/vino|altro`)

* POST `/api/spedizioni` con `SpedizionePayload`
* Upload allegati su Firebase → POST `/api/spedizioni/[id]/attachments`
* Mail cortesia **best-effort**: POST `/api/spedizioni/[id]/notify` (Resend + CTA WhatsApp)
* GET `/api/spedizioni/[id]/meta` per ID “umano”
* UI success con scorciatoie (Le mie spedizioni / Info utili / WhatsApp)

2. **Lista & dettagli** (`dashboard/spedizioni`)

* GET `/api/spedizioni[?email=...]` → card con ID/stato/dest/ritiro + bottoni LDV/Fatt/PL
* Drawer dettagli → GET `/api/spedizioni/[id]/colli`
  ⚠️ **Fix**: niente formula con `ARRAYJOIN({Spedizione})` sugli ID; filtro **in Node** su linked IDs.

3. **Impostazioni (UTENTI)** (`dashboard/impostazioni`)

* GET `/api/utenti?email=...` (prefill) · POST `/api/utenti` (upsert)

### B) Quotazioni (Preventivi)

* **GET** `/api/quotazioni/:idOrDisplayId` → dettaglio preventivo + **colli normalizzati**
  (ricerca per recordId o per `ID_Preventivo`/`ID Preventivo`, case/space-insensitive)
* **GET** `/api/quotazioni?email=...` → lista preventivi per email (alias robusti)
* **POST** `/api/quotazioni` → crea preventivo, set `Stato="In lavorazione"`, valorizza alias, **crea colli** (tentativo con link + fallback senza link, salvando `Preventivo_Id`)
* **Normalizzazione colli in uscita**: garantiamo **`L_cm`/`W_cm`/`H_cm`/`Peso`/`Quantita`** anche se in Airtable le misure sono sparse/nominate diversamente o dentro testo tipo “40x30x20 cm”.

---

## Endpoints (contratti rapidi)

**Spedizioni**

* `POST /api/spedizioni` → body `SpedizionePayload` → `{ id, idSpedizione }`
* `GET  /api/spedizioni[?email=...]` → array (records con `id` + `fields`)
* `GET  /api/spedizioni/:id/meta` → `{ idSpedizione?: string, creatoDaEmail?: string }`
* `GET  /api/spedizioni/:id/colli` → `{ ok: true, rows: Collo[] }`
* `POST /api/spedizioni/:id/attachments` → `{ fattura?: Att[]; packing?: Att[] }` → `204`
* `POST /api/spedizioni/:id/notify` → `{ ok: true }` *(best effort)*

**Utenti / profilo**

* `GET  /api/utenti?email=...` → `{ ok: true, data: [{ id, fields }] }`
* `POST /api/utenti` → `{ ok: true, record }`
* `GET  /api/profile` → `{ ok: true, party?: Party }`

**Quotazioni**

* `GET  /api/quotazioni/:idOrDisplayId` → `{ id, displayId?, fields, colli: [{id,fields}] }`
* `GET  /api/quotazioni?email=...` → lista con `{ id, displayId?, fields }`
* `POST /api/quotazioni` → `{ id, displayId? }`

---

## Variabili d’ambiente

### Airtable (Spedizioni)

```
AIRTABLE_API_TOKEN=...           # o AIRTABLE_API_KEY
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
# opzionale (fallback):
AIRTABLE_TABLE_COLLI=Colli
# logging debug per quotes:
DEBUG_QUOTES=0|1
```

### Email / Firebase / UI

```
RESEND_API_KEY=...

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

NEXT_PUBLIC_WHATSAPP_URL=https://wa.me/39XXXXXXXXX
NEXT_PUBLIC_INFO_URL=/dashboard/informazioni-utili
```

> **Runtime**: Node **20.x** su Vercel. Aggiungere `export const runtime = 'nodejs'` nelle route server Airtable-dipendenti.

---

## Gotcha / Fix già risolti

1. **Telefono Mittente** (UTENTI) mancava → aggiunto in schema + mapping.
2. **SPED\_COLLI**: filtro con link → **filtro in Node** su linked IDs (no `ARRAYJOIN` su id).
3. **Date Airtable (date-only)** → scrivere **YYYY-MM-DD** (no `toLocaleDateString`).
4. **Attachment “ballerini”** → smart-pick nomi (LDV/AWB/Lettera · Fatt/Invoice · Packing/PL).
5. **Ordinamento card** → `Ritiro - Data` desc, fallback `createdTime` desc.
6. **Quotazioni**: normalizzazione colli → alias multipli + parsing testo “40x30x20” + fallback da record Preventivo.

---

## Sviluppo locale

```bash
cp .env.example .env.local
npm i
npm run dev
```

---

## MVP: stato lato cliente (cosa può fare oggi)

* **Creare spedizioni** (vino/altro), caricare allegati, ricevere **mail di conferma** con CTA WhatsApp → **OK**
* **Vedere le spedizioni** nell’area riservata con dettaglio e colli → **OK**
* **Gestire profilo mittente** (UTENTI) e pre-fill nei form → **OK**
* **Creare/leggere quotazioni** via **API** con dimensioni colli normalizzate → **OK**
* **Vedere quotazioni nell’area riservata** → **DA AGGIUNGERE** (manca la pagina `dashboard/quotazioni`)

### Gap & TODO consigliati

* [ ] **UI Quotazioni**: `app/dashboard/quotazioni/page.tsx` (lista + drawer dettaglio come spedizioni) consumando `/api/quotazioni`.
* [ ] **Tracking “live”**: oggi c’è la sola mail cortesia; per aggiornamenti reali servono:
  • endpoint webhook carrier (`/api/tracking/webhook`) → update stato su Airtable
  • timeline UI in `ShipmentDetail` (stati evento)
  • job/polling se il carrier non supporta webhook.
* [ ] (Opzionale) **Verifica Bearer** lato server per hardening auth sulle route API.

---

## Licenza

TBD.

---

### Check rapido contenuti/routing/struttura

* **Routing**: le route App Router sono coerenti, i segmenti dinamici `[id]` corretti; ricorda `runtime='nodejs'`.
* **Struttura**: separazione chiara `lib/airtable.ts` (spedizioni) vs `lib/airtable.quotes.ts` (preventivi); `authed-fetch` usa Bearer Firebase (ok).
* **Contenuti**: mapping Airtable allineato (incluso `Telefono Mittente`); normalizzazione dimensioni **OK**; patch linked IDs **OK**.
* **Client**: lo **strumentario c’è** per creare spedizioni e quotazioni (API), per vedere spedizioni; per **vedere i preventivi** serve la pagina UI indicata sopra; per **tracking** servono integrazioni aggiuntive (webhook/UI).
