// lib/airtable.ts
// - Conversione data in YYYY-MM-DD
// - Log dettagliati (DEBUG_AIRTABLE=1)
// - Retry automatico su 422 UNKNOWN_FIELD_NAME (rinomina/drops campo e ritenta)

import { TABLE, F, FCOLLO, FPL } from './airtable.schema';

const AIRTABLE_TOKEN =
  process.env.AIRTABLE_API_TOKEN || process.env.AIRTABLE_PAT || '';
const AIRTABLE_BASE =
  process.env.AIRTABLE_BASE_ID_SPST || process.env.AIRTABLE_BASE_ID || '';

const DEBUG_AT =
  String(process.env.DEBUG_AIRTABLE || '').toLowerCase() === '1' ||
  String(process.env.DEBUG_AIRTABLE || '').toLowerCase() === 'true';

function dlog(...a: any[]) {
  if (DEBUG_AT) console.log('[airtable]', ...a);
}

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE) {
  console.warn('[airtable] Missing AIRTABLE_API_TOKEN or AIRTABLE_BASE_ID_SPST');
}

// ===== Tipi =====
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
  sorgente: 'vino' | 'altro';
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  formato: 'Pacco' | 'Pallet';
  contenuto?: string;

  ritiroData?: string; // ISO string dal client
  ritiroNote?: string;

  mittente: Party;
  destinatario: Party;

  incoterm: 'DAP' | 'DDP' | 'EXW';
  valuta: 'EUR' | 'USD' | 'GBP';
  noteFatt?: string;
  fatturazione: Party;
  fattSameAsDest?: boolean;
  fattDelega?: boolean;
  fatturaFileUrl?: string | null;

  colli: Collo[];
  packingList?: RigaPL[];

  createdByEmail?: string;
};

// ===== Helpers HTTP =====
const API_ROOT = 'https://api.airtable.com/v0';

function encodePath(p: string) {
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

type AirtableError = {
  type?: string;
  message?: string;
};

async function atFetch<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = `${API_ROOT}/${AIRTABLE_BASE}/${encodePath(path)}`;

  // logging (richiesta)
  const logBodyReq =
    init.body && typeof init.body === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(init.body as string);
            return JSON.stringify(parsed).slice(0, 2000);
          } catch {
            return String(init.body).slice(0, 2000);
          }
        })()
      : undefined;
  dlog('REQUEST', { url, method: init.method || 'GET', body: logBodyReq });

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { error: { type: 'INVALID_JSON', message: text } };
  }

  dlog('RESPONSE', {
    url,
    status: res.status,
    ok: res.ok,
    body: typeof json === 'string' ? json.slice(0, 2000) : json,
  });

  if (!res.ok) {
    const errObj: any = new Error(
      `AT_${res.status}: ${JSON.stringify({ error: json?.error })}`
    );
    errObj.status = res.status;
    errObj.airtable = (json && json.error) as AirtableError;
    throw errObj;
  }
  return json as T;
}

// ===== Date helper: Airtable (Date only) vuole "YYYY-MM-DD" =====
function dateOnlyOrNull(d?: string) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ===== Alias/varianti campi incerti =====
const FIELD_ALIASES: Record<string, string[]> = {
  // "Tipo (Vino, Altro)" potrebbe essere "Tipo"
  [F.Sorgente]: [
    process.env.AIRTABLE_FIELD_SORGENTE_ALT || 'Tipo',
    'Sorgente',
    'Tipo (Vino/Altro)',
  ],
  // safety: alcune basi hanno EN DASH / EM DASH
  [F.RitiroData]: ['Ritiro – Data', 'Ritiro — Data'],
  [F.RitiroNote]: ['Ritiro – Note', 'Ritiro — Note'],
};

// ===== Retry POST con handling di UNKNOWN_FIELD_NAME =====
async function safeCreateRecord(
  table: string,
  fields: Record<string, any>
): Promise<{ id: string; fields: Record<string, any> }> {
  let current = { ...fields };

  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await atFetch<{ id: string; fields: Record<string, any> }>(
        `${table}`,
        { method: 'POST', body: JSON.stringify({ fields: current }) }
      );
      return res;
    } catch (e: any) {
      const status = e?.status;
      const type = e?.airtable?.type as string | undefined;
      const msg = e?.airtable?.message as string | undefined;

      if (status === 422 && type === 'UNKNOWN_FIELD_NAME' && msg) {
        const m = msg.match(/Unknown field name:\s*"(.+?)"/);
        const bad = m?.[1];
        if (bad && bad in current) {
          dlog('UNKNOWN_FIELD_NAME ->', bad);

          // prova alias
          const aliases = FIELD_ALIASES[bad] || [];
          const alias = aliases.find(Boolean);
          if (alias) {
            current[alias] = current[bad];
            delete current[bad];
            dlog(`Retry con alias campo: ${bad} -> ${alias}`);
            continue;
          }

          // altrimenti droppa il campo e ritenta
          delete current[bad];
          dlog(`Retry senza campo sconosciuto: ${bad}`);
          continue;
        }
      }
      // se non gestibile, rilancia
      throw e;
    }
  }
  throw new Error('AT_RETRY_EXCEEDED');
}

// ===== MAPPING principale =====
function buildMainFields(payload: SpedizionePayload): Record<string, any> {
  const p = payload;

  const base: Record<string, any> = {
    [F.Stato]: 'Nuova',
    // F.Sorgente può causare 422 se il campo non esiste -> safeCreateRecord gestirà alias/drop
    [F.Sorgente]: p.sorgente === 'vino' ? 'Vino' : 'Altro',
    [F.Tipo]: p.tipoSped,
    [F.Formato]: p.formato,
    [F.Contenuto]: p.contenuto || '',
    [F.RitiroData]: dateOnlyOrNull(p.ritiroData),
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
    base[F.F_Att] = [{ url: p.fatturaFileUrl }];
  }

  // rimuovi undefined (Airtable non gradisce)
  for (const k of Object.keys(base)) {
    if (base[k] === undefined) delete base[k];
  }

  return base;
}

// ===== CREATE: Spedizione + Colli + PL =====
export async function createSpedizioneWebApp(payload: SpedizionePayload): Promise<{
  id: string;
  colliCreated: number;
  plCreated: number;
}> {
  dlog('createSpedizioneWebApp.payload', {
    ...payload,
    fatturaFileUrl: payload.fatturaFileUrl ? '[URL]' : null,
  });

  // record principale (con retry e alias su campi incerti)
  const main = await safeCreateRecord(`${TABLE.SPED}`, buildMainFields(payload));
  const parentId = main.id;

  // ---- COLLI
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
      // anche qui usiamo safeCreate in bulk: proviamo intero batch, se fallisce per campo ignoto, droppa e ritenta
      const payloadBulk = toRecordsPayload(recs);
      try {
        const res = await atFetch<{ records: Array<{ id: string }> }>(
          `${TABLE.COLLI}`,
          { method: 'POST', body: JSON.stringify(payloadBulk) }
        );
        colliCreated += res.records?.length || 0;
      } catch (e: any) {
        // fallback: invia riga per riga con safeCreateRecord per isolare eventuali campi sconosciuti
        dlog('COLLI bulk failed, fallback per-record...', e?.airtable || e?.message);
        for (const r of recs) {
          const one = await safeCreateRecord(`${TABLE.COLLI}`, r);
          if (one?.id) colliCreated += 1;
        }
      }
    }
  }

  // ---- PACKING LIST
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

      const payloadBulk = toRecordsPayload(recs);
      try {
        const res = await atFetch<{ records: Array<{ id: string }> }>(
          `${TABLE.PL}`,
          { method: 'POST', body: JSON.stringify(payloadBulk) }
        );
        plCreated += res.records?.length || 0;
      } catch (e: any) {
        dlog('PL bulk failed, fallback per-record...', e?.airtable || e?.message);
        for (const r of recs) {
          const one = await safeCreateRecord(`${TABLE.PL}`, r);
          if (one?.id) plCreated += 1;
        }
      }
    }
  }

  dlog('createSpedizioneWebApp.result', {
    parentId,
    colliCreated,
    plCreated,
  });

  return { id: parentId, colliCreated, plCreated };
}

// ===== LIST dashboard =====
export async function listSpedizioni(opts?: { email?: string }): Promise<any[]> {
  const params = new URLSearchParams();
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
        'ID Spedizione': rec.id,
        'Destinatario': f[F.D_RS] || '',
        'Città Destinatario': f[F.D_CITTA] || '',
        'Paese Destinatario': f[F.D_PAESE] || '',
        'Stato': f[F.Stato] || '',
        'Corriere': f[F.Corriere] || '',
        'Tracking Number': f[F.Tracking] || '',
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

export async function listSpedizioniByEmail(email?: string) {
  return listSpedizioni({ email });
}

// ===== Utenti =====
const USERS_TABLE =
  process.env.AIRTABLE_TABLE_UTENTI || process.env.AIRTABLE_TABLE_USERS || 'Utenti';
const USERS_EMAIL_F =
  process.env.AIRTABLE_USERS_EMAIL_FIELD ||
  process.env.AIRTABLE_USERS_EMAIL ||
  'Email';
const USERS_ENABLED_F =
  process.env.AIRTABLE_USERS_ENABLED_FIELD || 'Enabled';

export async function getUtenteByEmail(email: string) {
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
) {
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
    return atFetch<{ id: string; fields: Record<string, any> }>(
      `${USERS_TABLE}/${id}`,
      { method: 'PATCH', body: JSON.stringify({ fields }) }
    );
  } else {
    const fields = { [USERS_EMAIL_F]: email, ...extra };
    return atFetch<{ id: string; fields: Record<string, any> }>(
      `${USERS_TABLE}`,
      { method: 'POST', body: JSON.stringify({ fields }) }
    );
  }
}

export async function getAirtableUserByEmail(email: string) {
  const rec = await getUtenteByEmail(email);
  if (!rec) return { exists: false, enabled: false };
  const enabledValue = rec.fields?.[USERS_ENABLED_F];
  const enabled =
    typeof enabledValue === 'boolean'
      ? enabledValue
      : String(enabledValue || '').toLowerCase() === 'true';
  return { exists: true, enabled, record: rec };
}
