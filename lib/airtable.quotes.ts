// lib/airtable.quotes.ts
import Airtable from 'airtable';

// --- ENV ---
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

function dateOnlyISO(d?: string | Date) {
  if (!d) return undefined;
  try { return new Date(d).toISOString().slice(0, 10); } catch { return undefined; }
}
function optional<T>(v: T | null | undefined) { return v == null ? undefined : v; }

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
  docFatturaRichiesta?: boolean;
  docPLRichiesta?: boolean;

  mittente?: PartyQ;
  destinatario?: PartyQ;
  colli?: ColloQ[];
};

// ---- Alias campo PREVENTIVI (tolleranti) ----
const F = {
  Stato: ['Stato', 'Status'],
  EmailCliente: ['Email_Cliente', 'Email Cliente', 'Cliente_Email', 'Customer_Email', 'Email'],
  CreatoDaEmail: ['CreatoDaEmail', 'Creato da (email)', 'Created By Email', 'Creato da Email'],
  Valuta: ['Valuta', 'Currency'],
  RitiroData: ['Ritiro_Data', 'Data_Ritiro', 'RitiroData', 'PickUp_Date'],
  NoteGeneriche: [
    'Note generiche sulla spedizione',
    'Note_Spedizione',
    'Shipment_Notes',
    'Note spedizione',
  ],
  // Flag documenti richiesti
  DocFattRich: ['Doc_Fattura_Richiesta', 'Fattura_Richiesta', 'Richiesta Fattura'],
  DocPLRich: ['Doc_PL_Richiesta', 'Packing_Richiesta', 'Richiesta PL'],
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

// ---- update tollerante (table parametrica) ----
async function tryUpdateField(
  b: ReturnType<typeof base>,
  tableName: string,
  recId: string,
  aliases: ReadonlyArray<string> | string,
  value: any,
  debug: string[],
): Promise<boolean> {
  if (value == null || value === '') return true;
  const keys = Array.isArray(aliases) ? [...aliases] : [aliases];
  for (const k of keys) {
    try {
      await b(tableName).update(recId, { [k]: value });
      debug.push(`${tableName}: OK ${k}`);
      return true;
    } catch {
      // next alias
    }
  }
  debug.push(`${tableName}: SKIP ${Array.isArray(aliases) ? aliases.join('|') : aliases}`);
  return false;
}

// ---- crea riga COLLI robusta: prima link, poi update campi con alias ----
async function tryCreateColloRow(
  b: ReturnType<typeof base>,
  parentId: string,
  c: ColloQ,
  debug: string[],
) {
  // 1) crea con link (o, se fallisce, con id testuale)
  let createdId: string | undefined;

  const attemptCreate = async (fields: Record<string, any>) => {
    try {
      const created = await b(TB_COLLI).create([{ fields }]);
      return created[0].id as string;
    } catch {
      return undefined;
    }
  };

  createdId = await attemptCreate({ [C.LinkPreventivo[0]]: [parentId] });
  if (!createdId) {
    createdId = await attemptCreate({ [C.PreventivoIdTxt[0]]: parentId });
  }
  if (!createdId) {
    console.warn('[airtable.quotes] impossibile creare riga colli (link/text falliti)');
    return;
  }

  // 2) aggiorna dimensioni/peso con alias tolleranti
  await tryUpdateField(b, TB_COLLI, createdId, C.Qty, optional(c.qty), debug);
  await tryUpdateField(b, TB_COLLI, createdId, C.L, optional(c.l1_cm), debug);
  await tryUpdateField(b, TB_COLLI, createdId, C.W, optional(c.l2_cm), debug);
  await tryUpdateField(b, TB_COLLI, createdId, C.H, optional(c.l3_cm), debug);
  await tryUpdateField(b, TB_COLLI, createdId, C.Peso, optional(c.peso_kg), debug);
}

// ---------------------------------------------------------------
// CREATE preventivo
// ---------------------------------------------------------------
export async function createPreventivo(payload: PreventivoPayload): Promise<{ id: string }> {
  const b = base();
  const debugSet: string[] = [];

  try {
    // 1) record vuoto
    const created = await b(TB_PREVENTIVI).create([{ fields: {} }]);
    const recId = created[0].id;

    // 2) campi base
    await tryUpdateField(b, TB_PREVENTIVI, recId, F.Stato, 'Bozza', debugSet);

    if (payload.createdByEmail) {
      await tryUpdateField(b, TB_PREVENTIVI, recId, F.CreatoDaEmail, payload.createdByEmail, debugSet);
    }

    const emailCliente = payload.customerEmail || payload.createdByEmail;
    if (emailCliente) {
      await tryUpdateField(b, TB_PREVENTIVI, recId, F.EmailCliente, emailCliente, debugSet);
    }

    if (payload.valuta) {
      await tryUpdateField(b, TB_PREVENTIVI, recId, F.Valuta, payload.valuta, debugSet);
    }
    if (payload.ritiroData) {
      await tryUpdateField(b, TB_PREVENTIVI, recId, F.RitiroData, dateOnlyISO(payload.ritiroData), debugSet);
    }
    if (payload.noteGeneriche) {
      await tryUpdateField(b, TB_PREVENTIVI, recId, F.NoteGeneriche, payload.noteGeneriche, debugSet);
    }
    if (typeof payload.docFatturaRichiesta === 'boolean') {
      await tryUpdateField(b, TB_PREVENTIVI, recId, F.DocFattRich, !!payload.docFatturaRichiesta, debugSet);
    }
    if (typeof payload.docPLRichiesta === 'boolean') {
      await tryUpdateField(b, TB_PREVENTIVI, recId, F.DocPLRich, !!payload.docPLRichiesta, debugSet);
    }

    // 3) mittente
    const M = payload.mittente || {};
    if (M.ragioneSociale) await tryUpdateField(b, TB_PREVENTIVI, recId, F.M_Nome, M.ragioneSociale, debugSet);
    if (M.indirizzo)     await tryUpdateField(b, TB_PREVENTIVI, recId, F.M_Ind,  M.indirizzo,     debugSet);
    if (M.cap)           await tryUpdateField(b, TB_PREVENTIVI, recId, F.M_CAP,  M.cap,           debugSet);
    if (M.citta)         await tryUpdateField(b, TB_PREVENTIVI, recId, F.M_Citta,M.citta,         debugSet);
    if (M.paese)         await tryUpdateField(b, TB_PREVENTIVI, recId, F.M_Paese,M.paese,         debugSet);
    if (M.telefono)      await tryUpdateField(b, TB_PREVENTIVI, recId, F.M_Tel,  M.telefono,      debugSet);
    if (M.taxId)         await tryUpdateField(b, TB_PREVENTIVI, recId, F.M_Tax,  M.taxId,         debugSet);

    // 4) destinatario
    const D = payload.destinatario || {};
    if (D.ragioneSociale) await tryUpdateField(b, TB_PREVENTIVI, recId, F.D_Nome, D.ragioneSociale, debugSet);
    if (D.indirizzo)      await tryUpdateField(b, TB_PREVENTIVI, recId, F.D_Ind,  D.indirizzo,      debugSet);
    if (D.cap)            await tryUpdateField(b, TB_PREVENTIVI, recId, F.D_CAP,  D.cap,            debugSet);
    if (D.citta)          await tryUpdateField(b, TB_PREVENTIVI, recId, F.D_Citta,D.citta,          debugSet);
    if (D.paese)          await tryUpdateField(b, TB_PREVENTIVI, recId, F.D_Paese,D.paese,          debugSet);
    if (D.telefono)       await tryUpdateField(b, TB_PREVENTIVI, recId, F.D_Tel,  D.telefono,       debugSet);
    if (D.taxId)          await tryUpdateField(b, TB_PREVENTIVI, recId, F.D_Tax,  D.taxId,          debugSet);

    // 5) colli
    if (payload.colli?.length) {
      for (const c of payload.colli) {
        await tryCreateColloRow(b, recId, c, debugSet);
      }
    }

    console.log('[airtable.quotes] createPreventivo set fields:', debugSet);
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
// LIST preventivi per email (filtro lato Node)
// ---------------------------------------------------------------
export async function listPreventivi(
  opts?: { email?: string }
): Promise<Array<{ id: string; fields: any }>> {
  const b = base();
  const all: Array<{ id: string; fields: any }> = [];

  await b(TB_PREVENTIVI)
    .select({ pageSize: 100 })
    .eachPage((recs, next) => {
      for (const r of recs) all.push({ id: r.id, fields: r.fields });
      next();
    });

  if (!opts?.email) return all;

  const needle = String(opts.email).toLowerCase();
  const emailFields = [...F.EmailCliente, ...F.CreatoDaEmail];
  return all.filter(({ fields }) => {
    for (const k of emailFields) {
      const v = (fields?.[k] ?? '') as string;
      if (typeof v === 'string' && v.toLowerCase() === needle) return true;
    }
    return false;
  });
}
