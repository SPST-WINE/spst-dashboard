// lib/airtable.quotes.ts
// Robust helpers per CRUD Preventivi/Colli su Airtable.
// - Salva correttamente "Data Ritiro" (campo data) e "Email_Cliente"
// - Crea i Colli popolando sempre L_cm, W_cm, H_cm e Peso (number)
// - getPreventivo accetta sia recordId che ID visuale (es. Q-2025-00082)
//   con ricerca tollerante (case/space-insensitive) e carica i Colli via filterByFormula

import Airtable from 'airtable';

/* ============================= ENV ============================= */
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

/* ========================= UTILITIES =========================== */
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
function parseNum(v: any): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}
function qe(s: string) {
  return s.replace(/"/g, '\\"');
}

/* ======================== TIPI UI PAYLOAD ====================== */
export type PartyQ = {
  ragioneSociale?: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  paese?: string;
  telefono?: string;
  taxId?: string; // P.IVA/EORI/EIN
};

export type ColloQ = {
  quantita?: number;
  lunghezza_cm?: number | string | null;
  larghezza_cm?: number | string | null;
  altezza_cm?: number | string | null;
  l1_cm?: number | string | null;
  l2_cm?: number | string | null;
  l3_cm?: number | string | null;
  peso_kg?: number | string | null;
};

export type PreventivoPayload = {
  createdByEmail?: string;
  customerEmail?: string; // Email_Cliente
  valuta?: 'EUR' | 'USD' | 'GBP';
  ritiroData?: string; // ISO date
  noteGeneriche?: string;
  tipoSped?: 'B2B' | 'B2C' | 'Sample';
  incoterm?: 'DAP' | 'DDP' | 'EXW';
  mittente?: PartyQ;
  destinatario?: PartyQ;
  colli?: ColloQ[];
};

/* ===================== ALIAS PREVENTIVI ======================== */
const F = {
  Stato: ['Stato', 'Status'],
  EmailCliente: ['Email_Cliente', 'Email Cliente', 'Cliente_Email', 'Customer_Email'],
  CreatoDaEmail: ['CreatoDaEmail', 'Creato da (email)', 'Created By Email', 'Creato da Email'],
  Valuta: ['Valuta', 'Currency'],
  // include esattamente "Data Ritiro" (campo data in Airtable)
  RitiroData: ['Ritiro_Data', 'Data_Ritiro', 'RitiroData', 'PickUp_Date', 'Data Ritiro'],
  NoteGeneriche: [
    'Note generiche sulla spedizione',
    'Note_Spedizione',
    'Shipment_Notes',
    'Note spedizione',
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

/* ======================== CAMPI COLLI ========================== */
const C = {
  LinkPreventivo: ['Preventivi'], // Linked a Preventivi
  PreventivoIdTxt: ['Preventivo_Id'], // Single line (fallback)
  Qty: ['Quantita', 'Quantità'],
  L: ['L_cm'],
  W: ['W_cm'],
  H: ['H_cm'],
  Peso: ['Peso'],
} as const;

/* ===================== HELPERS DI UPDATE ======================= */
async function tryUpdateField(
  b: ReturnType<typeof base>,
  recId: string,
  aliases: ReadonlyArray<string> | string,
  value: any,
  debug: string[],
): Promise<boolean> {
  if (value == null) return true;
  const keys = Array.isArray(aliases) ? [...aliases] : [aliases];
  for (const k of keys) {
    try {
      await b(TB_PREVENTIVI).update(recId, { [k]: value });
      debug.push(`OK ${k}`);
      return true;
    } catch {
      /* tenta prossimo alias */
    }
  }
  debug.push(`SKIP ${Array.isArray(aliases) ? aliases.join('|') : aliases}`);
  return false;
}

async function tryCreateColloRow(
  b: ReturnType<typeof base>,
  recId: string,
  c: ColloQ
) {
  const L = parseNum(c.lunghezza_cm ?? c.l1_cm);
  const W = parseNum(c.larghezza_cm ?? c.l2_cm);
  const H = parseNum(c.altezza_cm ?? c.l3_cm);
  const peso = parseNum(c.peso_kg);

  const fields: Record<string, any> = {
    [C.LinkPreventivo[0]]: [recId], // linked: Preventivi
    [C.PreventivoIdTxt[0]]: recId,  // testo: recordId (fallback)
    [C.Qty[0]]: optional(c.quantita ?? 1),
    [C.L[0]]: optional(L),
    [C.W[0]]: optional(W),
    [C.H[0]]: optional(H),
    [C.Peso[0]]: optional(peso),
  };

  // 1) tentativo completo (con linked)
  try {
    await b(TB_COLLI).create([{ fields }]);
    return;
  } catch {
    // 2) fallback senza linked
    try {
      const { [C.LinkPreventivo[0]]: _omit, ...noLink } = fields;
      await b(TB_COLLI).create([{ fields: noLink }]);
    } catch (e) {
      console.warn('[airtable.quotes] impossibile creare riga colli', e);
    }
  }
}

/* ========================== CREATE ============================= */
export async function createPreventivo(
  payload: PreventivoPayload
): Promise<{ id: string; displayId?: string }> {
  const b = base();
  const debugSet: string[] = [];

  try {
    // 1) record vuoto
    const created = await b(TB_PREVENTIVI).create([{ fields: {} }]);
    const recId = created[0].id;

    // 2) campi base
    await tryUpdateField(b, recId, F.Stato, 'In lavorazione', debugSet);
    if (payload.createdByEmail)
      await tryUpdateField(b, recId, F.CreatoDaEmail, payload.createdByEmail, debugSet);
    if (payload.customerEmail)
      await tryUpdateField(b, recId, F.EmailCliente, payload.customerEmail, debugSet);
    if (payload.valuta)
      await tryUpdateField(b, recId, F.Valuta, payload.valuta, debugSet);
    if (payload.ritiroData)
      await tryUpdateField(b, recId, F.RitiroData, dateOnlyISO(payload.ritiroData), debugSet);
    if (payload.noteGeneriche)
      await tryUpdateField(b, recId, F.NoteGeneriche, payload.noteGeneriche, debugSet);
    if (payload.tipoSped)
      await tryUpdateField(b, recId, F.TipoSped, payload.tipoSped, debugSet);
    if (payload.incoterm)
      await tryUpdateField(b, recId, F.Incoterm, payload.incoterm, debugSet);

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

    // 6) ID visuale (formula ID_Preventivo / ID Preventivo)
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

/* =========================== LIST ============================== */
export async function listPreventivi(opts?: {
  email?: string;
}): Promise<
  Array<{
    id: string;
    displayId?: string;
    fields: any;
  }>
> {
  const b = base();
  const all: Array<{ id: string; fields: any }> = [];

  await b(TB_PREVENTIVI)
    .select({ pageSize: 100 })
    .eachPage((recs, next) => {
      for (const r of recs) all.push({ id: r.id, fields: r.fields });
      next();
    });

  const filtered = (() => {
    if (!opts?.email) return all;
    const needle = String(opts.email).toLowerCase();
    const emailFields = [
      'Email_Cliente',
      'Email Cliente',
      'Cliente_Email',
      'Customer_Email',
      'CreatoDaEmail',
      'Creato da (email)',
      'Created By Email',
      'Creato da Email',
    ];
    return all.filter(({ fields }) =>
      emailFields.some((k) => {
        const v = fields?.[k];
        return typeof v === 'string' && v.toLowerCase() === needle;
      }),
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

  // Ordine: Seq (se presente) -> displayId -> id
  rows.sort((a, b) => {
    const sa = typeof a.fields?.Seq === 'number' ? (a.fields.Seq as number) : null;
    const sb = typeof b.fields?.Seq === 'number' ? (b.fields.Seq as number) : null;
    if (sa != null && sb != null) return sb - sa;

    const da = (a.displayId || '') as string;
    const db = (b.displayId || '') as string;
    if (da && db) return db.localeCompare(da);

    return (b.id || '').localeCompare(a.id || '');
  });

  return rows;
}

/* ============================ GET ============================== */
// --- helpers di logging (lascia come sono, o aggiungili se non ci sono già)
const DEBUG_QUOTES = process.env.DEBUG_QUOTES === '1';
function _log(...args: any[]) { if (DEBUG_QUOTES) console.log('[quotes]', ...args); }
function _push(dbg: any[] | undefined, label: string, extra?: any) {
  const row = { at: new Date().toISOString(), label, ...(extra ?? {}) };
  dbg?.push(row);
  _log(label, extra ?? '');
}

// --- ordine dei campi da provare (uno per volta)
const DISPLAY_FIELDS_TRY_ORDER = [
  'ID_Preventivo',
  'ID Preventivo',
  // se vuoi estendere, aggiungi qui, ma senza rompere:
  // 'Name', 'Preventivo', 'Numero_Preventivo', 'Numero Preventivo'
] as const;

// Prova a cercare per un singolo campo; ignora elegantemente i campi inesistenti
async function tryFindByField(
  b: ReturnType<typeof base>,
  field: string,
  raw: string,
  norm: string,
  debug?: any[],
) {
  const esc = (s: string) => s.replace(/"/g, '\\"');

  // 1) match esatto
  for (const ff of [
    `{${field}}="${esc(raw)}"`,
    // 2) match normalizzato: minuscole + rimozione spazi
    `LOWER(SUBSTITUTE({${field}}," ",""))="${esc(norm)}"`,
  ]) {
    try {
      const found: any[] = [];
      await b(TB_PREVENTIVI)
        .select({ pageSize: 10, filterByFormula: ff })
        .eachPage((rows, next) => { found.push(...rows); next(); });

      _push(debug, 'probeField:ok', { field, filterByFormula: ff, count: found.length });
      if (found.length) return found[0];
    } catch (e: any) {
      const msg = e?.message || '';
      if (/Unknown field names?/i.test(msg)) {
        _push(debug, 'probeField:unknown', { field, message: msg });
        // Campo inesistente: interrompi ulteriori tentativi su questo campo
        break;
      } else {
        _push(debug, 'probeField:error', { field, message: msg });
        // altri errori: continua con l'altra variante o col prossimo campo
      }
    }
  }

  return null;
}

export async function getPreventivo(
  idOrDisplayId: string,
  debug?: any[],
): Promise<{
  id: string;
  displayId?: string;
  fields: any;
  colli: Array<{ id: string; fields: any }>;
} | null> {
  const b = base();

  const raw = String(idOrDisplayId ?? '').trim();
  const norm = raw.toLowerCase().replace(/\s+/g, '');
  _push(debug, 'input', { raw, norm, TB_PREVENTIVI, TB_COLLI });

  // 1) tentativo come recordId diretto
  let rec: any | null = null;
  try {
    rec = await b(TB_PREVENTIVI).find(raw);
    _push(debug, 'findByRecordId', { success: !!rec, idTried: raw });
  } catch (e: any) {
    _push(debug, 'findByRecordId:error', { message: e?.message, status: e?.statusCode });
  }

  // 2) se non trovato, prova i campi display uno per volta
  if (!rec) {
    for (const field of DISPLAY_FIELDS_TRY_ORDER) {
      rec = await tryFindByField(b, field, raw, norm, debug);
      if (rec) { _push(debug, 'matchedField', { field }); break; }
    }
  }

  if (!rec) {
    _push(debug, 'NOT_FOUND', { triedFields: DISPLAY_FIELDS_TRY_ORDER });
    return null;
  }

  // displayId robusto (solo i due campi principali che conosciamo davvero)
  const displayId =
    (rec.fields['ID_Preventivo'] as string) ||
    (rec.fields['ID Preventivo'] as string) ||
    undefined;

   // 3) colli collegati — scan lato Node per evitare formule su linked
  const colli: Array<{ id: string; fields: any }> = [];
  try {
    _push(debug, 'colliScan:start', {});
    await b(TB_COLLI)
      .select({ pageSize: 100 })
      .eachPage((rows, next) => {
        for (const r of rows) {
          const f = r.fields || {};

          const linkedArr: string[] = Array.isArray(f[C.LinkPreventivo[0]])
            ? (f[C.LinkPreventivo[0]] as string[])
            : [];
          const linked = linkedArr.includes(rec.id);

          const txt = String(f[C.PreventivoIdTxt[0]] ?? '').trim();
          const txtMatch = !!txt && (txt === rec.id || (displayId && txt === displayId));

          if (linked || txtMatch) colli.push({ id: r.id, fields: r.fields });
        }
        next();
      });

    _push(debug, 'colliScan:done', { count: colli.length, sampleIds: colli.slice(0, 5).map(c => c.id) });
  } catch (e: any) {
    _push(debug, 'colliScan:error', { message: e?.message, status: e?.statusCode });
  }

  _push(debug, 'OK', { recId: rec.id, displayId, colli: colli.length });
  return { id: rec.id, displayId, fields: rec.fields, colli };
}


