// lib/airtable.quotes.ts
// Helpers server-only per la tabella Preventivi (quotazioni)

import Airtable from 'airtable';

// ---- ENV / Tabelle ---------------------------------------------------------
const API_TOKEN =
  process.env.AIRTABLE_API_TOKEN || process.env.AIRTABLE_API_KEY || '';
const BASE_ID =
  process.env.AIRTABLE_BASE_ID_SPST ||
  process.env.AIRTABLE_BASE_ID ||
  '';

const TABLE_Q = {
  PREVENTIVI:
    process.env.AIRTABLE_TABLE_PREVENTIVI ||
    process.env.TB_PREVENTIVI ||
    'Preventivi',
  COLLI:
    process.env.AIRTABLE_TABLE_QUOTE_COLLI ||
    process.env.TB_COLLI ||
    'Colli',
} as const;

function assertEnv() {
  if (!API_TOKEN) throw new Error('AIRTABLE_API_TOKEN/AIRTABLE_API_KEY mancante');
  if (!BASE_ID) throw new Error('AIRTABLE_BASE_ID_SPST/AIRTABLE_BASE_ID mancante');
}

function base() {
  assertEnv();
  Airtable.configure({ apiKey: API_TOKEN });
  return new Airtable().base(BASE_ID);
}

export type Party = {
  ragioneSociale: string;
  referente?: string;
  paese: string;
  citta: string;
  cap: string;
  indirizzo: string;
  telefono?: string;
  piva?: string; // Tax / EORI
};

export type Collo = {
  lunghezza_cm: number | null;
  larghezza_cm: number | null;
  altezza_cm: number | null;
  peso_kg: number | null;
};

export interface QuotePayload {
  sorgente: 'vino' | 'altro';
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  formato: 'Pacco' | 'Pallet';
  contenuto?: string;

  ritiroData?: string; // ISO
  ritiroNote?: string;

  mittente: Party;
  destinatario: Party;

  noteGeneriche?: string;

  colli?: Collo[];

  createdByEmail?: string; // opzionale: se manca lo valorizza la route da auth
}

const F = {
  // campi principali (coerenti col back office già in uso)
  EmailCliente: 'Email_Cliente',
  CreatoDaEmail: 'Creato da',

  NoteGeneriche: 'Note generiche sulla spedizione',

  // mittente
  M_Nome: 'Mittente_Nome',
  M_Paese: 'Mittente_Paese',
  M_Citta: 'Mittente_Citta',
  M_CAP: 'Mittente_CAP',
  M_Indirizzo: 'Mittente_Indirizzo',
  M_Tel: 'Mittente_Telefono',
  M_Tax: 'Mittente_Tax',

  // destinatario
  D_Nome: 'Destinatario_Nome',
  D_Paese: 'Destinatario_Paese',
  D_Citta: 'Destinatario_Citta',
  D_CAP: 'Destinatario_CAP',
  D_Indirizzo: 'Destinatario_Indirizzo',
  D_Tel: 'Destinatario_Telefono',
  D_Tax: 'Destinatario_Tax',

  // logistica
  RitiroData: 'Ritiro - Data',
  RitiroNote: 'Ritiro - Note',

  // descrizione
  Formato: 'Formato',
  Contenuto: 'Contenuto',
  Tipo: 'Sottotipo (B2B, B2C, Sample)',
  Sorgente: 'Tipo (Vino, Altro)',
} as const;

// util
const opt = <T>(v: T | null | undefined) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
    ? undefined
    : v;

// ----------------------------------------------------------------------------
// CREATE
// ----------------------------------------------------------------------------
export async function createPreventivo(
  payload: QuotePayload
): Promise<{ id: string }> {
  const b = base();

  const fields: Record<string, any> = {};

  // email cliente/creatore
  if (payload.createdByEmail) {
    fields[F.EmailCliente] = payload.createdByEmail;
    fields[F.CreatoDaEmail] = payload.createdByEmail;
  }

  // mapping base
  fields[F.NoteGeneriche] = opt(payload.noteGeneriche);

  // mittente
  fields[F.M_Nome] = opt(payload.mittente?.ragioneSociale);
  fields[F.M_Paese] = opt(payload.mittente?.paese);
  fields[F.M_Citta] = opt(payload.mittente?.citta);
  fields[F.M_CAP] = opt(payload.mittente?.cap);
  fields[F.M_Indirizzo] = opt(payload.mittente?.indirizzo);
  fields[F.M_Tel] = opt(payload.mittente?.telefono);
  fields[F.M_Tax] = opt(payload.mittente?.piva);

  // destinatario
  fields[F.D_Nome] = opt(payload.destinatario?.ragioneSociale);
  fields[F.D_Paese] = opt(payload.destinatario?.paese);
  fields[F.D_Citta] = opt(payload.destinatario?.citta);
  fields[F.D_CAP] = opt(payload.destinatario?.cap);
  fields[F.D_Indirizzo] = opt(payload.destinatario?.indirizzo);
  fields[F.D_Tel] = opt(payload.destinatario?.telefono);
  fields[F.D_Tax] = opt(payload.destinatario?.piva);

  // logistica/descrizione (i nomi combaciano con quanto già usi nel BO)
  fields[F.RitiroData] = opt(payload.ritiroData ? new Date(payload.ritiroData).toISOString().slice(0, 10) : undefined);
  fields[F.RitiroNote] = opt(payload.ritiroNote);
  fields[F.Formato] = opt(payload.formato);
  fields[F.Contenuto] = opt(payload.contenuto);
  fields[F.Tipo] = opt(payload.tipoSped);
  fields[F.Sorgente] = opt(payload.sorgente === 'vino' ? 'Vino' : 'Altro');

  // create parent
  const created = await b(TABLE_Q.PREVENTIVI).create([{ fields }]);
  const recId = created[0].id;

  // figli "Colli": best-effort (se lo schema diverge non blocca la POST)
  try {
    const rows = (payload.colli ?? []).map((c) => ({
      fields: {
        // in BO è accettato "Preventivo_Id" come chiave testuale di collegamento
        Preventivo_Id: recId,
        // alias più comuni; se uno non esiste Airtable lo ignora? no → per sicurezza uso nomi generici diffusi
        Quantita: 1,
        L_cm: opt(c.lunghezza_cm),
        W_cm: opt(c.larghezza_cm),
        H_cm: opt(c.altezza_cm),
        Peso_Kg: opt(c.peso_kg),
      },
    }));
    if (rows.length) {
      const BATCH = 10;
      for (let i = 0; i < rows.length; i += BATCH) {
        await b(TABLE_Q.COLLI).create(rows.slice(i, i + BATCH));
      }
    }
  } catch (err) {
    // non rompiamo il flusso se la figlia ha nomi diversi: li mapperai dal BO
    console.warn('Colli create skipped:', (err as Error)?.message);
  }

  return { id: recId };
}

// ----------------------------------------------------------------------------
// LIST (per /dashboard/quotazioni)
// ----------------------------------------------------------------------------
export async function listPreventivi(opts?: {
  email?: string;
}): Promise<Array<{ id: string; fields: Record<string, any> }>> {
  const b = base();
  const all: Array<{ id: string; fields: Record<string, any> }> = [];

  let filter: string | undefined;
  if (opts?.email && opts.email.trim()) {
    const safe = opts.email.replace(/"/g, '\\"');
    // match su Email_Cliente O Creato da
    filter = `OR(LOWER({${F.EmailCliente}})=LOWER("${safe}"), LOWER({${F.CreatoDaEmail}})=LOWER("${safe}"))`;
  }

  await b(TABLE_Q.PREVENTIVI)
    .select({
      pageSize: 50,
      ...(filter ? { filterByFormula: filter } : {}),
      sort: [{ field: 'createdTime', direction: 'desc' } as any], // fallback, molti base lo accettano
    })
    .eachPage((records, next) => {
      for (const r of records) {
        all.push({ id: r.id, fields: r.fields as Record<string, any> });
      }
      next();
    });

  return all;
}
