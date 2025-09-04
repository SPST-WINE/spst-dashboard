// lib/airtable.quotes.ts
import Airtable from 'airtable';

// ENV
const API_TOKEN =
  process.env.AIRTABLE_API_TOKEN || process.env.AIRTABLE_API_KEY || '';
const BASE_ID = process.env.AIRTABLE_BASE_ID_SPST || '';
const TB_PREVENTIVI = process.env.AIRTABLE_TABLE_PREVENTIVI || 'Preventivi';
const TB_COLLI = process.env.AIRTABLE_TABLE_SPED_COLLI || 'SPED_COLLI';

function assertEnv() {
  if (!API_TOKEN) throw new Error('AIRTABLE_API_TOKEN (o AIRTABLE_API_KEY) mancante');
  if (!BASE_ID) throw new Error('AIRTABLE_BASE_ID_SPST mancante');
}

function base() {
  assertEnv();
  Airtable.configure({ apiKey: API_TOKEN });
  return new Airtable().base(BASE_ID);
}

// Debug helper (GET ?debug=env)
export async function airtableQuotesStatus(): Promise<{
  hasToken: boolean;
  hasBaseId: boolean;
  tables: { preventivi: boolean; colli: boolean };
  probe?: { preventiviOk?: boolean; colliOk?: boolean };
}> {
  const b = base();
  const out: any = {
    hasToken: !!API_TOKEN,
    hasBaseId: !!BASE_ID,
    tables: { preventivi: !!TB_PREVENTIVI, colli: !!TB_COLLI },
  };
  try {
    await b(TB_PREVENTIVI).select({ maxRecords: 1 }).firstPage();
    out.probe = { ...(out.probe || {}), preventiviOk: true };
  } catch (e) {
    out.probe = { ...(out.probe || {}), preventiviOk: false };
    console.error('[airtable.quotes] probe preventivi failed', e);
  }
  try {
    await b(TB_COLLI).select({ maxRecords: 1 }).firstPage();
    out.probe = { ...(out.probe || {}), colliOk: true };
  } catch (e) {
    out.probe = { ...(out.probe || {}), colliOk: false };
    console.error('[airtable.quotes] probe colli failed', e);
  }
  return out;
}

// Utils
function dateOnlyISO(d?: string | Date) {
  if (!d) return undefined;
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}
function optional<T>(v: T | null | undefined) {
  return v == null ? undefined : v;
}

// Tipi minimi lato client
export type ColloQ = {
  qty?: number;
  l1_cm?: number | null;
  l2_cm?: number | null;
  l3_cm?: number | null;
  peso_kg?: number | null;
};
export type PreventivoPayload = {
  createdByEmail?: string; // impostato da route se assente
  customerEmail?: string;
  valuta?: 'EUR' | 'USD' | 'GBP';
  ritiroData?: string; // ISO
  noteGeneriche?: string;
  colli?: ColloQ[];
};

// Campi “tolleranti” (alias) per PREVENTIVI
const F = {
  Stato: 'Stato', // Single select
  EmailCliente: ['Email_Cliente', 'Email Cliente', 'Cliente_Email'],
  CreatoDaEmail: ['CreatoDaEmail', 'Creato da (email)', 'Created By Email'],
  Valuta: ['Valuta', 'Currency'],
  RitiroData: ['Ritiro_Data', 'Data_Ritiro', 'RitiroData', 'PickUp_Date'],
  NoteGeneriche: [
    'Note generiche sulla spedizione',
    'Note_Spedizione',
    'Shipment_Notes',
    'Note spedizione',
  ],
} as const;

// helper: set campo con lista alias
function setField(obj: Record<string, any>, aliases: string | string[], value: any) {
  if (value == null) return;
  const keys = Array.isArray(aliases) ? aliases : [aliases];
  for (const k of keys) {
    obj[k] = value;
    return;
  }
}

// CREATE
export async function createPreventivo(payload: PreventivoPayload): Promise<{ id: string }> {
  const b = base();

  // Campi base (tolleranti)
  const fields: Record<string, any> = {};
  setField(fields, F.Stato, 'Bozza');
  if (payload.createdByEmail) setField(fields, F.CreatoDaEmail, payload.createdByEmail);
  if (payload.customerEmail) setField(fields, F.EmailCliente, payload.customerEmail);
  if (payload.valuta) setField(fields, F.Valuta, payload.valuta);
  if (payload.ritiroData) setField(fields, F.RitiroData, dateOnlyISO(payload.ritiroData));
  if (payload.noteGeneriche) setField(fields, F.NoteGeneriche, payload.noteGeneriche);

  try {
    const created = await b(TB_PREVENTIVI).create([{ fields }]);
    const recId = created[0].id;

    // (FACOLTATIVO) gestione colli — abilitalo solo se il link è certo
    // Se in SPED_COLLI hai un campo link al preventivo, definiscilo qui:
    // const LINK_FIELD = 'Preventivo'; // oppure 'Preventivo_Id' (testo)
    // if (payload.colli?.length) {
    //   const rows = payload.colli.map((c) => ({
    //     fields: {
    //       [LINK_FIELD]: [recId],        // se è un linked record
    //       Qty: optional(c.qty),
    //       L_cm: optional(c.l1_cm),
    //       W_cm: optional(c.l2_cm),
    //       H_cm: optional(c.l3_cm),
    //       Peso_Kg: optional(c.peso_kg),
    //     },
    //   }));
    //   const BATCH = 10;
    //   for (let i = 0; i < rows.length; i += BATCH) {
    //     await b(TB_COLLI).create(rows.slice(i, i + BATCH));
    //   }
    // }

    return { id: recId };
  } catch (e: any) {
    // Log esteso lato server
    console.error('[airtable.quotes] createPreventivo failed', {
      message: e?.message,
      statusCode: e?.statusCode,
      airtable: e?.error,
      fieldsTried: fields,
      tables: { TB_PREVENTIVI, TB_COLLI },
    });
    throw e;
  }
}

// LIST
export async function listPreventivi(opts?: { email?: string }): Promise<Array<{ id: string; fields: any }>> {
  const b = base();
  const all: any[] = [];

  const select: any = { pageSize: 50, sort: [{ field: 'Last modified time', direction: 'desc' }] };

  if (opts?.email) {
    const safe = String(opts.email).replace(/"/g, '\\"');
    // filtro su email cliente O creatore — adattalo alla tua base
    select.filterByFormula = `OR(
      LOWER({Email_Cliente}) = LOWER("${safe}"),
      LOWER({CreatoDaEmail}) = LOWER("${safe}")
    )`;
  }

  try {
    await b(TB_PREVENTIVI)
      .select(select)
      .eachPage((records, next) => {
        for (const r of records) all.push({ id: r.id, fields: r.fields });
        next();
      });
  } catch (e) {
    console.error('[airtable.quotes] listPreventivi failed', e);
    throw e;
  }

  return all;
}
