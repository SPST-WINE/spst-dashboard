// lib/airtable.ts
// Wrapper Airtable + funzioni di dominio per SPST

import { TABLE, F, FCOLLO, FPL } from './airtable.schema';

// === ENV ===================================================================
const AIRTABLE_TOKEN =
  process.env.AIRTABLE_API_TOKEN || process.env.AIRTABLE_PAT || '';
const AIRTABLE_BASE =
  process.env.AIRTABLE_BASE_ID_SPST || process.env.AIRTABLE_BASE_ID || '';

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE) {
  // Non interrompo il build: l’API restituirà 500 se chiamata senza env corretti
  console.warn('[airtable] Missing AIRTABLE_API_TOKEN or AIRTABLE_BASE_ID_SPST');
}

// === TIPI condivisi con le page “vino/altro” ===============================
export type Party = {
  ragioneSociale: string;
  referente: string;
  paese: string;
  citta: string;
  cap: string;
  indirizzo: string;
  telefono: string;
  piva: string;
};

export type Collo = {
  lunghezza_cm: number | null;
  larghezza_cm: number | null;
  altezza_cm: number | null;
  peso_kg: number | null;
};

export type RigaPL = {
  etichetta: string;
  bottiglie: number;
  formato_litri: number;
  gradazione: number;
  prezzo: number;
  valuta: 'EUR' | 'USD' | 'GBP';
  peso_netto_bott: number;
  peso_lordo_bott: number;
};

export type SpedizionePayload = {
  // “Tipo” in Airtable (Vino / Altro)
  sorgente: 'vino' | 'altro';
  // “Sottotipo” (B2B / B2C / Sample)
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  // “Formato” (Pacco / Pallet)
  formato: 'Pacco' | 'Pallet';
  // “Contenuto Colli”
  contenuto?: string;

  // Ritiro
  ritiroData?: string; // ISO string
  ritiroNote?: string;

  // Parti
  mittente: Party;
  destinatario: Party;

  // Fatturazione
  incoterm: 'DAP' | 'DDP' | 'EXW';
  valuta: 'EUR' | 'USD' | 'GBP';
  noteFatt?: string;
  fatturazione: Party;
  fattSameAsDest?: boolean;
  fattDelega?: boolean;
  fatturaFileUrl?: string | null; // opzionale (se già caricato altrove)

  // Colli e PL
  colli: Collo[];
  packingList?: RigaPL[];

  // Audit
  createdByEmail?: string;
};

// === HTTP helpers ==========================================================
const API_ROOT = 'https://api.airtable.com/v0';

async function atFetch<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_ROOT}/${AIRTABLE_BASE}/${encodePath(path)}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    // forziamo no-caching lato server
    cache: 'no-store',
  });

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { error: { type: 'INVALID_JSON', message: text } };
  }

  if (!res.ok) {
    const err = json?.error || { message: `HTTP_${res.status}` };
    throw new Error(`AT_${res.status}: ${JSON.stringify({ error: err })}`);
  }
  return json as T;
}

function encodePath(p: string) {
  // Airtable vuole il nome tabella URI-encoded (spazi -> %20, slash mantenuti)
  return p
    .split('/')
    .map((seg, i) => (i === 0 ? encodeURIComponent(seg) : seg))
    .join('/');
}

function toRecordsPayload(items: Array<Record<string, any>>) {
  return { records: items.map((fields) => ({ fields })) };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function esc(str: string) {
  return (str || '').replace(/"/g, '\\"');
}

// === MAPPING: record principale ============================================
function isoOrNull(d?: string) {
  return d ? new Date(d).toISOString() : null;
}

function buildMainFields(payload: SpedizionePayload): Record<string, any> {
  const p = payload;

  const fields: Record<string, any> = {
    [F.Stato]: 'Nuova',
    [F.Sorgente]: p.sorgente === 'vino' ? 'Vino' : 'Altro',
    [F.Tipo]: p.tipoSped,
    [F.Formato]: p.formato,
    [F.Contenuto]: p.contenuto || '',
    [F.RitiroData]: isoOrNull(p.ritiroData),
    [F.RitiroNote]: p.ritiroNote || '',
    [F.CreatoDaEmail]: p.createdByEmail || '',

    // Mittente
    [F.M_RS]: p.mittente?.ragioneSociale || '',
    [F.M_REF]: p.mittente?.referente || '',
    [F.M_PAESE]: p.mittente?.paese || '',
    [F.M_CITTA]: p.mittente?.citta || '',
    [F.M_CAP]: p.mittente?.cap || '',
    [F.M_INDIRIZZO]: p.mittente?.indirizzo || '',
    [F.M_TEL]: p.mittente?.telefono || '',
    [F.M_PIVA]: p.mittente?.piva || '',

    // Destinatario
    [F.D_RS]: p.destinatario?.ragioneSociale || '',
    [F.D_REF]: p.destinatario?.referente || '',
    [F.D_PAESE]: p.destinatario?.paese || '',
    [F.D_CITTA]: p.destinatario?.citta || '',
    [F.D_CAP]: p.destinatario?.cap || '',
    [F.D_INDIRIZZO]: p.destinatario?.indirizzo || '',
    [F.D_TEL]: p.destinatario?.telefono || '',
    [F.D_PIVA]: p.destinatario?.piva || '',

    // Fatturazione
    [F.F_RS]: p.fatturazione?.ragioneSociale || '',
    [F.F_REF]: p.fatturazione?.referente || '',
    [F.F_PAESE]: p.fatturazione?.paese || '',
    [F.F_CITTA]: p.fatturazione?.citta || '',
    [F.F_CAP]: p.fatturazione?.cap || '',
    [F.F_INDIRIZZO]: p.fatturazione?.indirizzo || '',
    [F.F_TEL]: p.fatturazione?.telefono || '',
    [F.F_PIVA]: p.fatturazione?.piva || '',
    [F.F_SAME_DEST]: !!p.fattSameAsDest,
    [F.Incoterm]: p.incoterm,
    [F.Valuta]: p.valuta,
    [F.NoteFatt]: p.noteFatt || '',
    [F.F_Delega]: !!p.fattDelega,
  };

  if (p.fatturaFileUrl) {
    fields[F.F_Att] = [{ url: p.fatturaFileUrl }];
  }

  return fields;
}

// === CREATE: Spedizione + Colli + PL =======================================
export async function createSpedizioneWebApp(payload: SpedizionePayload): Promise<{
  id: string;
  colliCreated: number;
  plCreated: number;
}> {
  // 1) record principale
  const main = await atFetch<{ id: string; fields: any }>(`${TABLE.SPED}`, {
    method: 'POST',
    body: JSON.stringify({ fields: buildMainFields(payload) }),
  });

  const parentId = main.id;

  // 2) colli (se presenti)
  const validColli = (payload.colli || []).filter((c) =>
    [c.lunghezza_cm, c.larghezza_cm, c.altezza_cm, c.peso_kg].some(
      (v) => v !== null && v !== undefined
    )
  );

  let colliCreated = 0;
  if (validColli.length) {
    const batches = chunk(validColli, 10);
    for (const b of batches) {
      const recs = b.map((c) => ({
        [FCOLLO.LinkSped]: [parentId],
        [FCOLLO.L]: c.lunghezza_cm ?? null,
        [FCOLLO.W]: c.larghezza_cm ?? null,
        [FCOLLO.H]: c.altezza_cm ?? null,
        [FCOLLO.Peso]: c.peso_kg ?? null,
      }));
      const res = await atFetch<{ records: Array<{ id: string }> }>(
        `${TABLE.COLLI}`,
        {
          method: 'POST',
          body: JSON.stringify(toRecordsPayload(recs)),
        }
      );
      colliCreated += res.records?.length || 0;
    }
  }

  // 3) packing list (solo se “vino” e righe presenti)
  const rows = (payload.packingList || []).filter(
    (r) =>
      r &&
      (r.etichetta ||
        r.bottiglie ||
        r.formato_litri ||
        r.prezzo ||
        r.gradazione)
  );

  let plCreated = 0;
  if (rows.length) {
    const batches = chunk(rows, 10);
    for (const b of batches) {
      const recs = b.map((r) => ({
        [FPL.LinkSped]: [parentId],
        [FPL.Etichetta]: r.etichetta || '',
        [FPL.Bottiglie]: r.bottiglie ?? null,
        [FPL.FormatoL]: r.formato_litri ?? null,
        [FPL.Grad]: r.gradazione ?? null,
        [FPL.Prezzo]: r.prezzo ?? null,
        [FPL.Valuta]: r.valuta || payload.valuta || 'EUR',
        [FPL.PesoNettoBott]: r.peso_netto_bott ?? null,
        [FPL.PesoLordoBott]: r.peso_lordo_bott ?? null,
      }));
      const res = await atFetch<{ records: Array<{ id: string }> }>(
        `${TABLE.PL}`,
        {
          method: 'POST',
          body: JSON.stringify(toRecordsPayload(recs)),
        }
      );
      plCreated += res.records?.length || 0;
    }
  }

  return { id: parentId, colliCreated, plCreated };
}

// === LIST: spedizioni per dashboard ========================================
export async function listSpedizioni(opts?: {
  email?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();

  // Limita i campi per performance (puoi allargarli se servono)
  const fieldsToSelect = [
    F.Stato,
    F.Sorgente,
    F.Tipo,
    F.Formato,
    F.D_RS,
    F.D_CITTA,
    F.D_PAESE,
    F.Corriere,
    F.Tracking,
    F.CreatoDaEmail,
  ];
  for (const f of fieldsToSelect) params.append('fields[]', f);

  if (opts?.email) {
    const formula = `LOWER({${F.CreatoDaEmail}}) = "${esc(
      opts.email.toLowerCase()
    )}"`;
    params.set('filterByFormula', formula);
  }

  // paginazione
  let offset: string | undefined = undefined;
  const out: any[] = [];

  do {
    const url =
      `${TABLE.SPED}?` +
      params.toString() +
      (offset ? `&offset=${encodeURIComponent(offset)}` : '');

    const json = await atFetch<{
      records: Array<{ id: string; fields: Record<string, any> }>;
      offset?: string;
    }>(url);

    for (const rec of json.records || []) {
      const f = rec.fields || {};
      out.push({
        id: rec.id,
        // campi “comodi” per il client attuale
        'ID Spedizione': rec.id,
        'Destinatario': f[F.D_RS] || '',
        'Città Destinatario': f[F.D_CITTA] || '',
        'Paese Destinatario': f[F.D_PAESE] || '',
        'Stato': f[F.Stato] || '',
        'Corriere': f[F.Corriere] || '',
        'Tracking Number': f[F.Tracking] || '',
        // extra utili
        sorgente: f[F.Sorgente] || '',
        sottotipo: f[F.Tipo] || '',
        formato: f[F.Formato] || '',
        creatoDa: f[F.CreatoDaEmail] || '',
      });
    }

    offset = (json as any).offset;
  } while (offset);

  return out;
}

// retro-compat, se il tuo /api/spedizioni prova questa firma
export async function listSpedizioniByEmail(email?: string) {
  return listSpedizioni({ email });
}

// === UTENTI (per /api/check-user o /api/utenti) ============================
// Se non li usi più, puoi ignorare questi export. Li lasciamo per evitare errori di build.
const USERS_TABLE =
  process.env.AIRTABLE_TABLE_UTENTI || process.env.AIRTABLE_TABLE_USERS || 'Utenti';
const USERS_EMAIL_F =
  process.env.AIRTABLE_USERS_EMAIL_FIELD ||
  process.env.AIRTABLE_USERS_EMAIL ||
  'Email';
const USERS_ENABLED_F =
  process.env.AIRTABLE_USERS_ENABLED_FIELD || 'Enabled';

export async function getUtenteByEmail(email: string): Promise<{
  id: string;
  fields: Record<string, any>;
} | null> {
  if (!email) return null;
  const params = new URLSearchParams();
  const formula = `LOWER({${USERS_EMAIL_F}}) = "${esc(email.toLowerCase())}"`;
  params.set('filterByFormula', formula);
  params.append('maxRecords', '1');

  const res = await atFetch<{
    records: Array<{ id: string; fields: Record<string, any> }>;
  }>(`${USERS_TABLE}?${params.toString()}`);

  return res.records?.[0] || null;
}

export async function upsertUtente(
  emailOrObj: string | { email: string; fields?: Record<string, any> },
  maybeFields?: Record<string, any>
): Promise<{ id: string; fields: Record<string, any> }> {
  const email =
    typeof emailOrObj === 'string' ? emailOrObj : emailOrObj.email;
  const extra =
    typeof emailOrObj === 'string'
      ? maybeFields || {}
      : emailOrObj.fields || {};

  const existing = await getUtenteByEmail(email);
  if (existing) {
    const id = existing.id;
    const fields = { ...existing.fields, ...extra };
    const patched = await atFetch<{ id: string; fields: Record<string, any> }>(
      `${USERS_TABLE}/${id}`,
      { method: 'PATCH', body: JSON.stringify({ fields }) }
    );
    return patched;
  } else {
    const fields = { [USERS_EMAIL_F]: email, ...extra };
    const created = await atFetch<{ id: string; fields: Record<string, any> }>(
      `${USERS_TABLE}`,
      { method: 'POST', body: JSON.stringify({ fields }) }
    );
    return created;
  }
}

// Facoltativo: esporto anche un helper per check-user più “parlante”
export async function getAirtableUserByEmail(email: string): Promise<{
  exists: boolean;
  enabled: boolean;
  record?: { id: string; fields: Record<string, any> };
}> {
  const rec = await getUtenteByEmail(email);
  if (!rec) return { exists: false, enabled: false };
  const enabledValue = rec.fields?.[USERS_ENABLED_F];
  const enabled =
    typeof enabledValue === 'boolean'
      ? enabledValue
      : String(enabledValue || '').toLowerCase() === 'true';
  return { exists: true, enabled, record: rec };
}
