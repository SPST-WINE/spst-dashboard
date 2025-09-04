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
  try { return new Date(d).toISOString().slice(0, 10); } catch { return undefined; }
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
  createdByEmail?: string;   // email utente autenticato (facoltativa)
  customerEmail?: string;    // email del cliente finale (facoltativa)
  valuta?: 'EUR' | 'USD' | 'GBP';
  ritiroData?: string;       // ISO
  noteGeneriche?: string;
  colli?: ColloQ[];
};

// Campi “tolleranti” (alias) per PREVENTIVI
const F = {
  // NB: tieni "Stato" se c’è, altrimenti verrà semplicemente saltato
  Stato: ['Stato', 'Status'],
  EmailCliente: ['Email_Cliente', 'Email Cliente', 'Cliente_Email'],
  CreatoDaEmail: ['CreatoDaEmail', 'Creato da (email)', 'Created By Email', 'Creato da Email'],
  Valuta: ['Valuta', 'Currency'],
  RitiroData: ['Ritiro_Data', 'Data_Ritiro', 'RitiroData', 'PickUp_Date'],
  NoteGeneriche: [
    'Note generiche sulla spedizione',
    'Note_Spedizione',
    'Shipment_Notes',
    'Note spedizione',
  ],
} as const;

// --- helper di update tollerante su più alias -----------------
async function tryUpdateField(
  b: ReturnType<typeof base>,
  recId: string,
  aliases: ReadonlyArray<string> | string,
  value: any
): Promise<boolean> {
  if (value == null) return true;
  const keys = Array.isArray(aliases) ? aliases : [aliases];
  for (const k of keys) {
    try {
      await b(TB_PREVENTIVI).update(recId, { [k]: value });
      return true;
    } catch {
      // passo al prossimo alias
    }
  }
  return false;
}

// ---------------------------------------------------------------
// CREATE preventivo (tollerante ai nomi campo)
// ---------------------------------------------------------------
export async function createPreventivo(payload: PreventivoPayload): Promise<{ id: string }> {
  const b = base();
  try {
    // 1) creo il record vuoto: evita errori UNKNOWN_FIELD_NAME in create
    const created = await b(TB_PREVENTIVI).create([{ fields: {} }]);
    const recId = created[0].id;

    // 2) aggiorno i campi uno a uno provando gli alias
    await tryUpdateField(b, recId, F.Stato, 'Bozza');
    if (payload.createdByEmail) await tryUpdateField(b, recId, F.CreatoDaEmail, payload.createdByEmail);
    if (payload.customerEmail) await tryUpdateField(b, recId, F.EmailCliente, payload.customerEmail);
    if (payload.valuta) await tryUpdateField(b, recId, F.Valuta, payload.valuta);
    if (payload.ritiroData) await tryUpdateField(b, recId, F.RitiroData, dateOnlyISO(payload.ritiroData));
    if (payload.noteGeneriche) await tryUpdateField(b, recId, F.NoteGeneriche, payload.noteGeneriche);

    // 3) (FACOLTATIVO) gestione colli — attiva quando mi confermi il nome del campo link in SPED_COLLI
    // const LINK_FIELD = 'Preventivo'; // oppure 'Preventivo_Id'
    // if (payload.colli?.length) {
    //   const rows = payload.colli.map((c) => ({
    //     fields: {
    //       [LINK_FIELD]: [recId],             // se è un linked record
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
    console.error('[airtable.quotes] createPreventivo failed', {
      message: e?.message,
      statusCode: e?.statusCode,
      airtable: e?.error,
      tables: { TB_PREVENTIVI, TB_COLLI },
    });
    throw e;
  }
}

// ---------------------------------------------------------------
// LIST preventivi (filtro lato Node per evitare formule rotte)
// ---------------------------------------------------------------
export async function listPreventivi(
  opts?: { email?: string }
): Promise<Array<{ id: string; fields: any }>> {
  const b = base();
  const all: Array<{ id: string; fields: any }> = [];

  try {
    await b(TB_PREVENTIVI)
      .select({
        pageSize: 100,
        sort: [{ field: 'Last modified time', direction: 'desc' }],
      })
      .eachPage((records, next) => {
        for (const r of records) all.push({ id: r.id, fields: r.fields });
        next();
      });
  } catch (e) {
    console.error('[airtable.quotes] listPreventivi failed', e);
    throw e;
  }

  if (opts?.email) {
    const needle = String(opts.email).toLowerCase();
    const emailFields = [
      'Email_Cliente',
      'Email Cliente',
      'Cliente_Email',
      'CreatoDaEmail',
      'Creato da (email)',
      'Created By Email',
      'Creato da Email',
    ];
    return all.filter(({ fields }) => {
      for (const k of emailFields) {
        const v = (fields?.[k] ?? '') as string;
        if (typeof v === 'string' && v.toLowerCase() === needle) return true;
      }
      return false;
    });
  }

  return all;
}
