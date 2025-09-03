# SPST WebApp – Mini‑Docs / README

> **Stack**: Next.js 14 (App Router) · TypeScript · TailwindCSS · Airtable (API) · Firebase (Auth + Storage) · Resend (Email) · Deploy: Vercel (Node 20.x)

Questa mini‑documentazione riassume architettura, flussi, pagine, endpoint, schemi Airtable, variabili d’ambiente e gotcha già risolti. È pensata per essere incollata pari‑pari in una nuova repo o per allineare un collaboratore.

---

## Struttura del progetto

```
app/
  api/
    spedizioni/route.ts                     # POST crea spedizione, GET lista (con filtro per email)
    spedizioni/[id]/attachments/route.ts    # POST: allega file (URL Firebase) su Airtable
    spedizioni/[id]/colli/route.ts          # GET: lista colli (patch: filtro lato Node su linked IDs)
    spedizioni/[id]/meta/route.ts           # GET: id pubblico & creato-da-email
    spedizioni/[id]/notify/route.ts         # POST: invia mail di conferma (Resend) + CTA WhatsApp
    utenti/route.ts                         # GET: profilo da tab. UTENTI; POST: upsert profilo
    profile/route.ts                        # GET: profilo Party per prefill (usa tab. UTENTI)
  dashboard/
    page.tsx                                # (TODO) Overview
    spedizioni/page.tsx                     # Lista spedizioni + Drawer dettagli (client)
    nuova/vino/page.tsx                     # Form completo (vino) con packing list
    nuova/altro/page.tsx                    # Identico a vino, senza packing list
    impostazioni/page.tsx                   # Dati mittente (tab. UTENTI)
    informazioni-utili/page.tsx             # Statica/risorse (OK)
    compliance/page.tsx                     # (TODO)
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
    Field.tsx (Select, input helpers)
lib/
  airtable.schema.ts     # Nomi tabelle/campi (TABLE, F, FCOLLO, FPL, FUSER)
  airtable.ts            # Logica Airtable (create/list/attach/meta/utenti/colli + utils)
  api.ts                 # Facade client: postSpedizione, postSpedizioneAttachments, postSpedizioneNotify, getUserProfile
  authed-fetch.ts        # fetch con Bearer token
  cors.ts                # CORS helper
  firebase-client-auth.ts / firebase-client.ts
styles & config (tailwind, postcss, next.config, tsconfig)
```

---

## Schemi Airtable

### Tabelle

* **SpedizioniWebApp** (`TABLE.SPED`, default `"SpedizioniWebApp"`)
* **SPED\_COLLI** (`TABLE.COLLI`, default `"SPED_COLLI"`)
* **SPED\_PL** (`TABLE.PL`, default `"SPED_PL"`) – solo per vino
* **UTENTI** (`TABLE.UTENTI`, default `"UTENTI"`)

### Campi principali (estratto)

**`F` (tab. SpedizioniWebApp)**

* **Stato**, **Incoterm**, **Valuta**, **Note Fattura**, **Creato da**
* Blocchi Mittente / Destinatario / FATT (tutti i campi: RS, Referente, Paese, Città, CAP, Indirizzo, Telefono, P.IVA/CF)
* `Ritiro - Data` *(date only)*, `Ritiro - Note`
* `Fattura - Delega a SPST` *(checkbox)*
* `Fattura - Allegato Cliente` *(Attachment)*, `Packing List - Allegato Cliente` *(Attachment)*
* `ID Spedizione` *(testo, opzionale ma consigliato)*, `LinkColli`, `LinkPL`

**`FCOLLO` (tab. SPED\_COLLI)**

* **Spedizione** *(link)*, **Lunghezza (cm)**, **Larghezza (cm)**, **Altezza (cm)**, **Peso (kg)**, `#` *(tot opzionale)*

**`FPL` (tab. SPED\_PL)**

* **Spedizione** *(link)*, **Etichetta**, **Bottiglie**, **Formato (L)**, **Gradazione (% vol)**, **Prezzo**, **Valuta**, **Peso netto/lordo bott**

**`FUSER` (tab. UTENTI)**

* `Mail Cliente`, `Mittente`, `Paese Mittente`, `Città Mittente`, `CAP Mittente`, `Indirizzo Mittente`, **`Telefono Mittente`**, `Partita IVA Mittente`, `Data Creazione`

> **Nota:** `Telefono Mittente` è stato aggiunto in schema e nelle mappe; prima mancava ed era la causa del mancato salvataggio.

---

## Tipi / Contratti (TS)

### Party

```ts
export type Party = {
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

### Collo

```ts
export type Collo = {
  lunghezza_cm: number | null;
  larghezza_cm: number | null;
  altezza_cm: number | null;
  peso_kg: number | null;
}
```

### RigaPL (vino)

```ts
export type RigaPL = {
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
export interface SpedizionePayload {
  sorgente: 'vino' | 'altro';
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  destAbilitato?: boolean;

  contenuto?: string;
  formato: 'Pacco' | 'Pallet';

  ritiroData?: string;  // ISO; viene convertito in AAAA-MM-GG per Airtable
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
  packingList?: RigaPL[];    // solo per 'vino'

  createdByEmail?: string;    // opzionale; se presente viene scritto in F.CreatoDaEmail
}
```

---

## Flussi principali

### 1) Creazione spedizione (vino/altro)

1. **Form** in `app/dashboard/nuova/[vino|altro]/page.tsx`

   * “altro” = identico a “vino” **senza** packing list (righe & file)
   * Validazioni base (misure colli, data ritiro, dati fattura se manca allegato fattura)
2. **POST** `/api/spedizioni` con `SpedizionePayload`
3. **Upload allegati** su Firebase Storage

   * sottocartelle: `spedizioni/<recId>/fattura` e `…/packing`
   * si ottengono URL pubblici (signed)
4. **POST** `/api/spedizioni/[id]/attachments` con `{ fattura?: Att[]; packing?: Att[] }`

   * `lib/airtable.ts/attachFilesToSpedizione` scrive gli attachment su `F.Fattura_Att` e `F.PL_Att`
5. **POST** `/api/spedizioni/[id]/notify` *(best effort)*

   * invia mail “brandizzata” con **logo**, **CTA WhatsApp**, link “Documenti & info utili”
6. **GET** `/api/spedizioni/[id]/meta` → recupera `ID Spedizione` (umano); se assente, usa l’id record Airtable
7. **UI success** → ID, info principali + pulsanti: Le mie spedizioni · Documenti & info utili · Supporto WhatsApp

> **Gotcha data:** su Airtable scrivere `Ritiro - Data` in **YYYY-MM-DD** (date-only).
> Usare `formatAirtableDateOnly()` (non `toLocaleDateString()`).

### 2) Lista spedizioni + dettagli

* **GET** `/api/spedizioni` → `listSpedizioni()`

  * supporta `?email=...` (filtro su `LOWER({Creato da})`)
* **UI** `components/SpedizioniClient.tsx`

  * legge `localStorage.userEmail` e id token Firebase
  * card con ID/stato/destinatario/ritiro + bottoni **LDV**, **Fattura**, **Packing List**, **Mostra dettagli**
  * ordinamento: `Ritiro - Data` **desc**; se assente, `createdTime` **desc** (parse sicuro)
  * **smart pick** degli attachment: prima nomi ufficiali, poi **fallback** su chiavi simili (ldv/awb/lettera, fatt/invoice, packing/pl)
* **Drawer dettagli** (`ShipmentDetail.tsx`)

  * mostra Mittente, Destinatario, “Destinatario abilitato import”, Data ritiro, Incoterm, Tipo spedizione
  * sezione **Fatturazione** (RS/indirizzo/piva + “Uguale a destinatario” + “Delega fattura a SPST”)
  * sezione **Colli** → **GET** `/api/spedizioni/[id]/colli`

    * ⚠️ **Fix**: non usare formula Airtable con `ARRAYJOIN({Spedizione})` (restituisce *nomi*, non *id*)
    * filtrare **in Node** sull’array di **linked record IDs** (patch `listColliBySpedId`)

### 3) Impostazioni (profilo UTENTI)

* Pagina `app/dashboard/impostazioni/page.tsx`

  * seleziona email (o legge da `localStorage.userEmail`)
  * **GET** `/api/utenti?email=...` → pre‑fill form (mappa UTENTI → Party)
  * **POST** `/api/utenti` con payload:

```json
{
  "email": "user@dominio.it",
  "fields": {
    "Paese Mittente": "...",
    "Mittente": "...",
    "Città Mittente": "...",
    "CAP Mittente": "...",
    "Indirizzo Mittente": "...",
    "Telefono Mittente": "...",
    "Partita IVA Mittente": "..."
  }
}
```

* `upsertUserProfile()` crea/aggiorna in **UTENTI**

### 4) Auth (client‑side)

* Firebase (login fuori scope)
* `getIdToken()` per `Authorization: Bearer <token>`
* `onAuthStateChanged()` per trigger fetch
* *(facoltativo)* validazione server del token via middleware o direttamente negli endpoint

### 5) Email di notifica

* **Route:** `/api/spedizioni/[id]/notify` (Node runtime)
* **Provider:** Resend
* **Contenuto:** logo SPST, testo cortesia (“stiamo elaborando la tua spedizione…”),

  * **Bottone WhatsApp** da `NEXT_PUBLIC_WHATSAPP_URL`
  * **Bottone Documenti & info utili** da `NEXT_PUBLIC_INFO_URL`
* **Best effort:** eventuale errore non blocca il salvataggio

---

## Endpoints (contratti rapidi)

* `POST /api/spedizioni` → body: `SpedizionePayload` → `{ id, idSpedizione }`
* `POST /api/spedizioni/:id/attachments` → `{ fattura?: Att[]; packing?: Att[] }` → `204`
* `GET  /api/spedizioni/:id/meta` → `{ idSpedizione?: string, creatoDaEmail?: string }`
* `GET  /api/spedizioni/:id/colli` → `{ ok: true, rows: Collo[] }`
* `POST /api/spedizioni/:id/notify` → `{ ok: true }` *(best effort)*
* `GET  /api/spedizioni[?email=...]` → `any[]` (records Airtable con `id` + `fields`)
* `GET  /api/utenti?email=...` → `{ ok: true, data: [ { id, fields } ] }`
* `POST /api/utenti` → vedi payload sopra → `{ ok: true, record }`
* `GET  /api/profile` → `{ ok: true, party?: Party }` *(prefill mittente)*

---

## Variabili d’ambiente

### Airtable

* `AIRTABLE_API_TOKEN` *(o `AIRTABLE_API_KEY`)*
* `AIRTABLE_BASE_ID_SPST`
* `AIRTABLE_TABLE_SPEDIZIONI_WEBAPP` *(default `SpedizioniWebApp`)*
* `AIRTABLE_TABLE_SPED_COLLI` *(default `SPED_COLLI`)*
* `AIRTABLE_TABLE_SPED_PL` *(default `SPED_PL`)*
* `AIRTABLE_TABLE_UTENTI` *(default `UTENTI`)*

### Email

* `RESEND_API_KEY`

### Firebase (client)

* `NEXT_PUBLIC_FIREBASE_API_KEY`
* `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
* `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
* `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
* `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
* `NEXT_PUBLIC_FIREBASE_APP_ID`

### UI / link

* `NEXT_PUBLIC_WHATSAPP_URL` (es. `https://wa.me/39xxxxxxxxxx`)
* `NEXT_PUBLIC_INFO_URL` (es. `/dashboard/informazioni-utili` o URL esterno)

### Note runtime

* **Node 20.x** (impostare su Vercel)
* aggiungere `export const runtime = 'nodejs'` sulle route server dove necessario

#### `.env.example`

```bash
# Airtable
AIRTABLE_API_TOKEN=
AIRTABLE_BASE_ID_SPST=
AIRTABLE_TABLE_SPEDIZIONI_WEBAPP=SpedizioniWebApp
AIRTABLE_TABLE_SPED_COLLI=SPED_COLLI
AIRTABLE_TABLE_SPED_PL=SPED_PL
AIRTABLE_TABLE_UTENTI=UTENTI

# Email
RESEND_API_KEY=

# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# UI / Links
NEXT_PUBLIC_WHATSAPP_URL=
NEXT_PUBLIC_INFO_URL=
```

---

## Gotcha / Fix già risolti (da ricordare)

1. **Telefono Mittente** → aggiunto a `FUSER` + mappatura in upsert/get (prima mancava → non salvava)
2. **Colli non visibili** → il filtro formula su link record **non** può usare gli **ID** record; patch `listColliBySpedId`: **filtra in Node** sugli array di linked record IDs
3. **Date Airtable** → scrivere **YYYY-MM-DD** per “date only” (`formatAirtableDateOnly()`)
4. **Attachment “ballerini”** → card usa “smart pick”: nomi ufficiali + fallback su chiavi simili (ldv/awb/lettera, fatt/invoice, packing/pl)
5. **Ordinamento card** → `Ritiro - Data` desc; se assente, `createdTime` desc (parse sicuro)

---

## Pagine & UI

* **Dashboard / Overview** *(TODO)*

  * widget “Prossimi ritiri” (`Ritiro - Data` ≥ oggi, ultimi N)
  * contatori per **Stato**
  * scorciatoie: Nuova spedizione · Informazioni utili · Supporto WhatsApp
  * “last 5 attività”
* **Compliance** *(TODO)*

  * pagina info statiche + allegati scaricabili (template dichiarazioni, deleghe, etichette)
  * eventuale form per upload documenti ricorrenti collegati all’utente → nuova tabella Airtable `COMPLIANCE_DOCS` link a **UTENTI**

---

## Setup & Deploy – Checklist

1. Impostare **ENV** (Airtable, Firebase, Resend, WhatsApp/Info URL)
2. Verificare su Airtable che i **nomi campo** combacino con `airtable.schema.ts` (o regolare gli alias previsti)
3. Deploy su **Vercel** (Node 20.x; Serverless Functions)
4. **Firebase Storage**: permettere lettura pubblica o utilizzare **signed URLs** per gli allegati
5. *(Opzionale)* Aggiungere verifica server del **Bearer token** nei route API

---

## Note operative

* `/api/spedizioni/[id]/notify` è **best effort**: fallimenti non bloccano il flusso di creazione
* Gli ID “umani” sono in campo `ID Spedizione`; se assenti, usare l’**id record** Airtable

---

## Licenza

TBD (aggiungere in base alla repo).
