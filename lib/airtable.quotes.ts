// lib/airtable.quotes.ts
import Airtable from 'airtable';

// --- ENV ---
const API_TOKEN = process.env.AIRTABLE_API_TOKEN || process.env.AIRTABLE_API_KEY || '';
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

// ---- Tipi payload UI ----
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
  qty?: number;
  l1_cm?: number | null;
  l2_cm?: number | null;
  l3_cm?: number | null;
  peso_kg?: number | null;
};

export type PreventivoPayload = {
  createdByEmail?: string;
  customerEmail?: string;   // email cliente finale
  valuta?: 'EUR' | 'USD' | 'GBP';
  ritiroData?: string;      // ISO date
  noteGeneriche?: string;

  // nuovi campi
  tipoSped?: 'B2B' | 'B2C' | 'Sample';
  incoterm?: 'DAP' | 'DDP' | 'EXW';

  mittente?: PartyQ;
  destinatario?: PartyQ;
  colli?: ColloQ[];
};

// ---- Alias campo PREVENTIVI (tolleranti) ----
const F = {
  Stato: ['Stato', 'Status'],
  EmailCliente: ['Email_Cliente', 'Email Cliente', 'Cliente_Email', 'Customer_Email'],
  CreatoDaEmail: ['CreatoDaEmail', 'Creato da (email)', 'Created By Email', 'Creato da Email'],
  Valuta: ['Valuta', 'Currency'],
  RitiroData: ['Ritiro_Data', 'Data_Ritiro', 'RitiroData', 'PickUp_Date'],
  NoteGeneriche: [
    'Note generiche sulla spedizione',
    'Note_Spedizione',
    'Shipment_Notes',
    'Note spedizione',
  ],

  // nuovi alias
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

// ---- Alias campo COLLI (tolleranti) ----
const C = {
  LinkPreventivo: ['Preventivo', 'Link Preventivo'],  // linked-record
  PreventivoIdTxt: ['Preventivo_Id', 'Preventivo ID (testo)'],
  Qty: ['Quantita', 'Quantità', 'Qty', 'Q.ta'],
  L: ['Lato 1', 'Lato1', 'L_cm', 'Lunghezza', 'L'],
  W: ['Lato 2', 'Lato2', 'W_cm', 'Larghezza', 'W'],
  H: ['Lato 3', 'Lato3', 'H_cm', 'Altezza', 'H'],
  Peso: ['Peso (Kg)', 'Peso_Kg', 'Peso', 'Kg', 'Weight'],
} as const;

// utility update con alias multipli
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
      // prova alias successivo
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
  const attempt = async (fields: Record<string, any>) => {
    try {
      await b(TB_COLLI).create([{ fields }]);
      return true;
    } catch {
      return false;
    }
  };

  const baseFields = {
    [C.Qty[0]]: optional(c.qty),
    [C.L[0]]: optional(c.l1_cm),
    [C.W[0]]: optional(c.l2_cm),
    [C.H[0]]: optional(c.l3_cm),
    [C.Peso[0]]: optional(c.peso_kg),
  };

  // 1) linked record
  let ok = await attempt({ ...baseFields, [C.LinkPreventivo[0]]: [recId] });
  if (ok) return;

  // 2) id testo
  ok = await attempt({ ...baseFields, [C.PreventivoIdTxt[0]]: recId });
  if (!ok) console.warn('[airtable.quotes] impossibile creare riga colli');
}

// ---------------------------------------------------------------
// CREATE preventivo
// ---------------------------------------------------------------
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
    await tryUpdateField(b, recId, F.Stato, 'Bozza', debugSet);
    if (payload.createdByEmail) await tryUpdateField(b, recId, F.CreatoDaEmail, payload.createdByEmail, debugSet);
    if (payload.customerEmail) await tryUpdateField(b, recId, F.EmailCliente, payload.customerEmail, debugSet);
    if (payload.valuta) await tryUpdateField(b, recId, F.Valuta, payload.valuta, debugSet);
    if (payload.ritiroData) await tryUpdateField(b, recId, F.RitiroData, dateOnlyISO(payload.ritiroData), debugSet);
    if (payload.noteGeneriche) await tryUpdateField(b, recId, F.NoteGeneriche, payload.noteGeneriche, debugSet);

    // nuovi: tipo spedizione + incoterm
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

    // 6) leggo l'ID visuale (formula ID_Preventivo)
    let displayId: string | undefined;
    try {
      const rec = await b(TB_PREVENTIVI).find(recId);
      displayId =
        (rec.fields['ID_Preventivo'] as string) ||
        (rec.fields['ID Preventivo'] as string) ||
        (rec.fields['ID'] as string) ||
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

// ---------------------------------------------------------------
// LIST preventivi per email (filtro lato Node) + fallback sort
// ---------------------------------------------------------------
export async function listPreventivi(
  opts?: { email?: string }
): Promise<Array<{ id: string; fields: any; displayId?: string }>> {
  const b = base();

  // NB: usiamo `any` per evitare problemi con i generics di Airtable typings
  const fetchAll = async (params: any) =>
    new Promise<Array<{ id: string; fields: any }>>((resolve, reject) => {
      const out: Array<{ id: string; fields: any }> = [];
      b(TB_PREVENTIVI)
        .select(params)
        .eachPage(
          (recs, next) => {
            for (const r of recs) out.push({ id: r.id, fields: r.fields });
            next();
          },
          (err) => (err ? reject(err) : resolve(out))
        );
    });

  // 1) tenta sort per "Last modified time"
  let rows: Array<{ id: string; fields: any }>;
  try {
    rows = await fetchAll({
      pageSize: 100,
      sort: [{ field: 'Last modified time', direction: 'desc' }],
    });
  } catch (e: any) {
    // 2) se il campo non esiste → fallback senza sort
    if (e?.statusCode === 422 || e?.error === 'UNKNOWN_FIELD_NAME') {
      console.warn('[airtable.quotes] listPreventivi: sort field missing, fallback to unsorted.', {
        message: e?.message,
        statusCode: e?.statusCode,
        airtable: e?.error,
      });
      rows = await fetchAll({ pageSize: 100 });
    } else {
      console.error('[airtable.quotes] listPreventivi fatal:', {
        message: e?.message,
        statusCode: e?.statusCode,
        airtable: e?.error,
      });
      throw e;
    }
  }

  // 3) filtro opzionale per email
  let filtered = rows;
  if (opts?.email) {
    const needle = String(opts.email).toLowerCase();
    const emailFields = [...F.EmailCliente, ...F.CreatoDaEmail];
    filtered = rows.filter(({ fields }) =>
      emailFields.some((k) => {
        const v = fields?.[k];
        return typeof v === 'string' && v.toLowerCase() === needle;
      })
    );
  }

  // 4) aggiungo displayId per la UI (ID_Preventivo o simili)
  return filtered.map((r) => ({
    id: r.id,
    displayId:
      (r.fields['ID_Preventivo'] as string) ||
      (r.fields['ID Preventivo'] as string) ||
      (r.fields['ID'] as string) ||
      undefined,
    fields: r.fields,
  }));
}
