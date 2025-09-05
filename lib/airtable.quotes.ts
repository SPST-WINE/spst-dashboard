// lib/airtable.quotes.ts
import Airtable from 'airtable';

// ---------- ENV ----------
const API_TOKEN =
  process.env.AIRTABLE_API_TOKEN || process.env.AIRTABLE_API_KEY || '';
const BASE_ID = process.env.AIRTABLE_BASE_ID_SPST || '';

const TB_PREVENTIVI = process.env.AIRTABLE_TABLE_PREVENTIVI || 'Preventivi';
const TB_COLLI =
  process.env.AIRTABLE_TABLE_PREVENTIVI_COLLI ||
  process.env.AIRTABLE_TABLE_COLLI ||
  'Colli';

function assertEnv() {
  if (!API_TOKEN) throw new Error('AIRTABLE_API_TOKEN (o AIRTABLE_API_KEY) mancante');
  if (!BASE_ID) throw new Error('AIRTABLE_BASE_ID_SPST mancante');
}
function base() {
  assertEnv();
  Airtable.configure({ apiKey: API_TOKEN });
  return new Airtable().base(BASE_ID);
}

function dateOnlyISO(d?: string | Date) {
  if (!d) return undefined;
  try { return new Date(d).toISOString().slice(0, 10); } catch { return undefined; }
}
function optional<T>(v: T | null | undefined) { return v == null ? undefined : v; }
function esc(s: string) { return String(s).replace(/"/g, '\\"'); }

// ---------- Tipi ----------
export type PartyQ = {
  ragioneSociale?: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  paese?: string;
  telefono?: string;
  taxId?: string;
};
export type ColloQ = {
  qty?: number;
  l1_cm?: number | null;
  l2_cm?: number | null;
  l3_cm?: number | null;
  peso_kg?: number | null;
};
export type PreventivoPayload = {
  createdByEmail?: string;
  customerEmail?: string;
  valuta?: 'EUR' | 'USD' | 'GBP';
  ritiroData?: string;        // ISO date
  noteGeneriche?: string;
  tipoSped?: 'B2B' | 'B2C' | 'Sample';
  incoterm?: 'DAP' | 'DDP' | 'EXW';
  mittente?: PartyQ;
  destinatario?: PartyQ;
  colli?: ColloQ[];
};

// ---------- Alias campi ----------
const F = {
  Stato: ['Stato', 'Status'],
  EmailCliente: ['Email_Cliente', 'Email Cliente', 'Cliente_Email', 'Customer_Email'],
  CreatoDaEmail: ['CreatoDaEmail', 'Creato da (email)', 'Created By Email', 'Creato da Email'],
  Valuta: ['Valuta', 'Currency'],
  // includi tutte le varianti, anche con spazi
  RitiroData: [
    'Ritiro_Data', 'Data_Ritiro', 'RitiroData', 'PickUp_Date',
    'Data ritiro', 'Data Ritiro', ' Data Ritiro ', ' Data ritiro '
  ],
  NoteGeneriche: [
    'Note generiche sulla spedizione', 'Note_Spedizione',
    'Shipment_Notes', 'Note spedizione'
  ],
  TipoSped: ['Tipo_Spedizione', 'Tipo spedizione', 'Tipo Spedizione', 'Tipologia', 'Tipo', 'TipoSped'],
  Incoterm: ['Incoterm', 'Incoterms', 'Incoterm_Selezionato', 'Incoterm Selezionato'],

  // Mittente
  M_Nome: ['Mittente_Nome', 'Mittente', 'Ragione sociale Mittente', 'Mittente RS'],
  M_Ind: ['Mittente_Indirizzo', 'Indirizzo Mittente', 'Mittente Indirizzo'],
  M_CAP: ['Mittente_CAP', 'CAP Mittente'],
  M_Citta: ['Mittente_Citta', 'Città Mittente', 'Mittente Citta'],
  M_Paese: ['Mittente_Paese', 'Paese Mittente'],
  M_Tel: ['Mittente_Telefono', 'Telefono Mittente'],
  M_Tax: ['Mittente_Tax', 'Mittente_PIVA', 'Mittente_EORI', 'P.IVA Mittente', 'PIVA Mittente'],

  // Destinatario
  D_Nome: ['Destinatario_Nome', 'Destinatario', 'Ragione sociale Destinatario', 'Destinatario RS'],
  D_Ind: ['Destinatario_Indirizzo', 'Indirizzo Destinatario'],
  D_CAP: ['Destinatario_CAP', 'CAP Destinatario'],
  D_Citta: ['Destinatario_Citta', 'Città Destinatario', 'Destinatario Citta'],
  D_Paese: ['Destinatario_Paese', 'Paese Destinatario'],
  D_Tel: ['Destinatario_Telefono', 'Telefono Destinatario'],
  D_Tax: ['Destinatario_Tax', 'Destinatario_EORI', 'Dest_TaxID', 'TaxID Destinatario'],
} as const;

const C = {
  // tabella "Colli"
  LinkPreventivo: ['Preventivi', 'Preventivo', 'Link Preventivo'], // linked-record
  PreventivoIdTxt: ['Preventivo_Id', 'Preventivo ID (testo)'],
  Qty: ['Quantita', 'Quantità', 'Qty', 'Q.ta'],
  L: ['L_cm', 'Lato 1', 'Lato1', 'Lunghezza', 'L'],
  W: ['W_cm', 'Lato 2', 'Lato2', 'Larghezza', 'W'],
  H: ['H_cm', 'Lato 3', 'Lato3', 'Altezza', 'H'],
  Peso: ['Peso', 'Peso (Kg)', 'Peso_Kg', 'Kg', 'Weight'],
} as const;

// ---------- helpers ----------
async function tryUpdateField(
  b: ReturnType<typeof base>,
  recId: string,
  aliases: ReadonlyArray<string> | string,
  value: any,
  debug: string[],
): Promise<boolean> {
  if (value == null) return true;
  const keys = Array.isArray(aliases) ? aliases : [aliases];
  for (const k of keys) {
    try {
      await b(TB_PREVENTIVI).update(recId, { [k]: value });
      debug.push(`OK ${k}`);
      return true;
    } catch {}
  }
  debug.push(`SKIP ${Array.isArray(aliases) ? aliases.join('|') : aliases}`);
  return false;
}

async function tryCreateColloRow(
  b: ReturnType<typeof base>,
  recId: string,
  c: ColloQ
) {
  // 1° tentativo: con linked-record
  try {
    await b(TB_COLLI).create([{
      fields: {
        [C.LinkPreventivo[0]]: [recId],
        [C.PreventivoIdTxt[0]]: recId,
        [C.Qty[0]]: optional(c.qty ?? 1),
        [C.L[0]]: optional(c.l1_cm),
        [C.W[0]]: optional(c.l2_cm),
        [C.H[0]]: optional(c.l3_cm),
        [C.Peso[0]]: optional(c.peso_kg),
      }
    }]);
    return;
  } catch {}

  // 2° tentativo: senza linked (fallback)
  try {
    await b(TB_COLLI).create([{
      fields: {
        [C.PreventivoIdTxt[0]]: recId,
        [C.Qty[0]]: optional(c.qty ?? 1),
        [C.L[0]]: optional(c.l1_cm),
        [C.W[0]]: optional(c.l2_cm),
        [C.H[0]]: optional(c.l3_cm),
        [C.Peso[0]]: optional(c.peso_kg),
      }
    }]);
  } catch (e) {
    console.warn('[airtable.quotes] impossibile creare riga colli', e);
  }
}

// ---------- CREATE ----------
export async function createPreventivo(
  payload: PreventivoPayload
): Promise<{ id: string; displayId?: string }> {
  const b = base();
  const debugSet: string[] = [];

  // 1) record vuoto
  const created = await b(TB_PREVENTIVI).create([{ fields: {} }]);
  const recId = created[0].id;

  // 2) campi base
  await tryUpdateField(b, recId, F.Stato, 'In lavorazione', debugSet);
  if (payload.createdByEmail) await tryUpdateField(b, recId, F.CreatoDaEmail, payload.createdByEmail, debugSet);
  if (payload.customerEmail) await tryUpdateField(b, recId, F.EmailCliente, payload.customerEmail, debugSet);
  if (payload.valuta) await tryUpdateField(b, recId, F.Valuta, payload.valuta, debugSet);
  if (payload.ritiroData) await tryUpdateField(b, recId, F.RitiroData, dateOnlyISO(payload.ritiroData), debugSet);
  if (payload.noteGeneriche) await tryUpdateField(b, recId, F.NoteGeneriche, payload.noteGeneriche, debugSet);
  if (payload.tipoSped) await tryUpdateField(b, recId, F.TipoSped, payload.tipoSped, debugSet);
  if (payload.incoterm) await tryUpdateField(b, recId, F.Incoterm, payload.incoterm, debugSet);

  // 3) mittente
  const M = payload.mittente || {};
  if (M.ragioneSociale) await tryUpdateField(b, recId, F.M_Nome, M.ragioneSociale, debugSet);
  if (M.indirizzo) await tryUpdateField(b, recId, F.M_Ind, M.indirizzo, debugSet);
  if (M.cap) await tryUpdateField(b, recId, F.M_CAP, M.cap, debugSet);
  if (M.citta) await tryUpdateField(b, recId, F.M_Citta, M.citta, debugSet);
  if (M.paese) await tryUpdateField(b, recId, F.M_Paese, M.paese, debugSet);
  if (M.telefono) await tryUpdateField(b, recId, F.M_Tel, M.telefono, debugSet);
  if (M.taxId) await tryUpdateField(b, recId, F.M_Tax, M.taxId, debugSet);

  // 4) destinatario
  const D = payload.destinatario || {};
  if (D.ragioneSociale) await tryUpdateField(b, recId, F.D_Nome, D.ragioneSociale, debugSet);
  if (D.indirizzo) await tryUpdateField(b, recId, F.D_Ind, D.indirizzo, debugSet);
  if (D.cap) await tryUpdateField(b, recId, F.D_CAP, D.cap, debugSet);
  if (D.citta) await tryUpdateField(b, recId, F.D_Citta, D.citta, debugSet);
  if (D.paese) await tryUpdateField(b, recId, F.D_Paese, D.paese, debugSet);
  if (D.telefono) await tryUpdateField(b, recId, F.D_Tel, D.telefono, debugSet);
  if (D.taxId) await tryUpdateField(b, recId, F.D_Tax, D.taxId, debugSet);

  // 5) colli
  if (payload.colli?.length) {
    for (const c of payload.colli) await tryCreateColloRow(b, recId, c);
  }

  // 6) displayId (formula)
  let displayId: string | undefined;
  try {
    const rec = await b(TB_PREVENTIVI).find(recId);
    displayId =
      (rec.fields['ID_Preventivo'] as string) ||
      (rec.fields['ID Preventivo'] as string) ||
      undefined;
  } catch {}

  console.log('[airtable.quotes] createPreventivo set fields:', debugSet);
  return { id: recId, displayId };
}

// ---------- LIST ----------
export async function listPreventivi(opts?: { email?: string }): Promise<Array<{
  id: string;
  displayId?: string;
  fields: any;
}>> {
  const b = base();
  const all: Array<{ id: string; fields: any }> = [];

  await b(TB_PREVENTIVI)
    .select({ pageSize: 100 })
    .eachPage((recs, next) => { for (const r of recs) all.push({ id: r.id, fields: r.fields }); next(); });

  const filtered = (() => {
    if (!opts?.email) return all;
    const needle = String(opts.email).toLowerCase();
    const emailFields = [
      'Email_Cliente', 'Email Cliente', 'Cliente_Email', 'Customer_Email',
      'CreatoDaEmail', 'Creato da (email)', 'Created By Email', 'Creato da Email',
    ];
    return all.filter(({ fields }) =>
      emailFields.some((k) => {
        const v = fields?.[k];
        return typeof v === 'string' && v.toLowerCase() === needle;
      })
    );
  })();

  const rows = filtered.map((r) => ({
    id: r.id,
    displayId:
      (r.fields['ID_Preventivo'] as string) ||
      (r.fields['ID Preventivo'] as string) ||
      undefined,
    fields: r.fields,
  }));

  rows.sort((a, b) => {
    const sa = typeof a.fields?.Seq === 'number' ? a.fields.Seq as number : null;
    const sb = typeof b.fields?.Seq === 'number' ? b.fields.Seq as number : null;
    if (sa != null && sb != null) return sb - sa;
    const da = (a.displayId || '');
    const db = (b.displayId || '');
    if (da && db) return db.localeCompare(da);
    return (b.id || '').localeCompare(a.id || '');
  });

  return rows;
}

// ---------- GET ONE ----------
export async function getPreventivo(idOrDisplayId: string): Promise<{
  id: string;
  displayId?: string;
  fields: any;
  colli: Array<{ id: string; fields: any }>;
} | null> {
  const b = base();
  const key = String(idOrDisplayId).trim();

  let rec: any | null = null;

  // 1) se sembra un recordId, prova find()
  if (/^rec[a-zA-Z0-9]{14}$/.test(key)) {
    try { rec = await b(TB_PREVENTIVI).find(key); } catch {}
  }

  // 2) ricerca su ID_Preventivo (case/trim insensitive)
  if (!rec) {
    const fbf = `OR(
      LOWER(TRIM({ID_Preventivo}))=LOWER("${esc(key)}"),
      LOWER(TRIM({ID Preventivo}))=LOWER("${esc(key)}")
    )`;
    try {
      const found: any[] = [];
      await b(TB_PREVENTIVI).select({ pageSize: 50, filterByFormula: fbf })
        .eachPage((rows, next) => { for (const r of rows) found.push(r); next(); });
      rec = found[0] || null;
    } catch {}
  }

  // 3) fallback: scan all + match lato Node
  if (!rec) {
    const all: any[] = [];
    await b(TB_PREVENTIVI)
      .select({ pageSize: 100 })
      .eachPage((rows, next) => { for (const r of rows) all.push(r); next(); });
    rec = all.find((r) => {
      const f = r.fields || {};
      const disp = (f['ID_Preventivo'] as string) || (f['ID Preventivo'] as string) || (f['ID'] as string) || '';
      return disp && String(disp).trim().toLowerCase() === key.toLowerCase();
    }) || null;
  }

  if (!rec) return null;

  // displayId
  const displayId =
    (rec.fields['ID_Preventivo'] as string) ||
    (rec.fields['ID Preventivo'] as string) ||
    undefined;

  // colli: match per linked-record o per testo (recordId o displayId)
  const colli: Array<{ id: string; fields: any }> = [];
  await b(TB_COLLI)
    .select({ pageSize: 100 })
    .eachPage((rows, next) => {
      for (const r of rows) {
        const f = r.fields || {};

        const linkedArr: string[] =
          (Array.isArray(f['Preventivi']) ? f['Preventivi'] as string[] :
            Array.isArray(f['Preventivo']) ? f['Preventivo'] as string[] :
              Array.isArray(f['Link Preventivo']) ? f['Link Preventivo'] as string[] : []);

        const linked = linkedArr.includes(rec.id);

        const txt = String(
          f['Preventivo_Id'] ?? f['Preventivo ID (testo)'] ?? ''
        ).trim();

        const txtMatch = !!txt && (txt === rec.id || (displayId && txt === displayId));

        if (linked || txtMatch) colli.push({ id: r.id, fields: r.fields });
      }
      next();
    });

  return { id: rec.id, displayId, fields: rec.fields, colli };
}
