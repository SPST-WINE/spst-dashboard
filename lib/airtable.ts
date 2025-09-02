// lib/airtable.ts
import Airtable from 'airtable';
import {
  TABLE,
  CANDIDATES,
  CAND_COLLO,
  CAND_PL,
} from './airtable.schema';

type Party = {
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
  contenuto?: string;
  formato: 'Pacco' | 'Pallet';
  ritiroData?: string; // ISO
  ritiroNote?: string;
  mittente: Party;
  destinatario: Party;
  destAbilitato?: boolean;
  incoterm: 'DAP' | 'DDP' | 'EXW';
  valuta: 'EUR' | 'USD' | 'GBP';
  noteFatt?: string;
  fatturazione: Party;
  fattSameAsDest: boolean;
  fattDelega: boolean;
  fatturaFileName?: string | null;
  colli: Collo[];
  packingList?: RigaPL[];
  createdByEmail?: string | undefined;
};

// ---------- Setup Airtable ----------
const API_TOKEN = process.env.AIRTABLE_API_TOKEN || process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID_SPST || process.env.AIRTABLE_BASE_ID;

if (!API_TOKEN) throw new Error('AIRTABLE_API_TOKEN is missing');
if (!BASE_ID) throw new Error('AIRTABLE_BASE_ID_SPST is missing');

const base = new Airtable({ apiKey: API_TOKEN }).base(BASE_ID);

// Cache semplice dei nomi campo per tabella
const fieldCache = new Map<string, string[]>();

async function listFieldNames(tableName: string): Promise<string[]> {
  if (fieldCache.has(tableName)) return fieldCache.get(tableName)!;
  // Prendiamo 1 record (se esiste) e ricaviamo le chiavi del payload "fields"
  // NB: se la tabella è vuota, proviamo a leggere la lista colonne da 1 view
  try {
    const recs = await base(tableName).select({ pageSize: 1 }).firstPage();
    const names = recs.length ? Object.keys(recs[0].fields) : [];
    fieldCache.set(tableName, names);
    return names;
  } catch (e) {
    // In caso di errore (tabella senza permessi?), non mettiamo in cache
    return [];
  }
}

function pick(cands: readonly string[], existing: string[]) {
  return cands.find((c) => existing.includes(c));
}

// Utility Airtable date: se il campo è "Date" senza ora, preferiamo YYYY-MM-DD
function toAirtableDateOnly(iso?: string) {
  if (!iso) return undefined;
  return iso.slice(0, 10); // 'YYYY-MM-DD'
}

// Genera codice tipo "SP-20250902-1234"
function genCustomId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rnd = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `SP-${y}${m}${day}-${rnd}`;
}

// ---------- API principali ----------
export function airtableEnvStatus() {
  return {
    hasToken: !!API_TOKEN,
    hasBaseId: !!BASE_ID,
    tables: {
      SPEDIZIONI_WEBAPP: !!TABLE.SPED,
      SPED_COLLI: !!TABLE.COLLI,
      SPED_PL: !!TABLE.PL,
    },
  };
}

/** Crea la spedizione + colli + (eventuale) PL vino */
export async function createSpedizioneWebApp(payload: SpedizionePayload) {
  const srcLabel = payload.sorgente === 'vino' ? 'Vino' : 'Altro';
  const names = await listFieldNames(TABLE.SPED);

  // Risolviamo ogni campo con i nomi presenti realmente nella tabella
  const f = (k: keyof typeof CANDIDATES) => pick(CANDIDATES[k], names);

  const fields: Record<string, any> = {};

  // Generali
  const fSorg = f('Sorgente'); if (fSorg) fields[fSorg] = srcLabel;
  const fTipo = f('Tipo'); if (fTipo) fields[fTipo] = payload.tipoSped;
  const fFormato = f('Formato'); if (fFormato) fields[fFormato] = payload.formato;
  const fCont = f('Contenuto'); if (fCont && payload.contenuto) fields[fCont] = payload.contenuto;
  const fRD = f('RitiroData'); if (fRD && payload.ritiroData) fields[fRD] = toAirtableDateOnly(payload.ritiroData);
  const fRN = f('RitiroNote'); if (fRN && payload.ritiroNote) fields[fRN] = payload.ritiroNote;
  const fBy = f('CreatoDaEmail'); if (fBy && payload.createdByEmail) fields[fBy] = payload.createdByEmail;

  // Mittente
  const M = payload.mittente;
  const fM = {
    rs: f('M_RS'), ref: f('M_REF'), paese: f('M_PAESE'), citta: f('M_CITTA'),
    cap: f('M_CAP'), ind: f('M_INDIRIZZO'), tel: f('M_TEL'), piva: f('M_PIVA')
  };
  if (fM.rs) fields[fM.rs] = M.ragioneSociale;
  if (fM.ref) fields[fM.ref] = M.referente;
  if (fM.paese) fields[fM.paese] = M.paese;
  if (fM.citta) fields[fM.citta] = M.citta;
  if (fM.cap) fields[fM.cap] = M.cap;
  if (fM.ind) fields[fM.ind] = M.indirizzo;
  if (fM.tel) fields[fM.tel] = M.telefono;
  if (fM.piva) fields[fM.piva] = M.piva;

  // Destinatario
  const D = payload.destinatario;
  const fD = {
    rs: f('D_RS'), ref: f('D_REF'), paese: f('D_PAESE'), citta: f('D_CITTA'),
    cap: f('D_CAP'), ind: f('D_INDIRIZZO'), tel: f('D_TEL'), piva: f('D_PIVA'),
    abil: f('D_AbilImport')
  };
  if (fD.rs) fields[fD.rs] = D.ragioneSociale;
  if (fD.ref) fields[fD.ref] = D.referente;
  if (fD.paese) fields[fD.paese] = D.paese;
  if (fD.citta) fields[fD.citta] = D.citta;
  if (fD.cap) fields[fD.cap] = D.cap;
  if (fD.ind) fields[fD.ind] = D.indirizzo;
  if (fD.tel) fields[fD.tel] = D.telefono;
  if (fD.piva) fields[fD.piva] = D.piva;
  if (fD.abil) fields[fD.abil] = !!payload.destAbilitato;

  // Fatturazione
  const FATT = payload.fatturazione;
  const fF = {
    rs: f('F_RS'), ref: f('F_REF'), paese: f('F_PAESE'), citta: f('F_CITTA'),
    cap: f('F_CAP'), ind: f('F_INDIRIZZO'), tel: f('F_TEL'), piva: f('F_PIVA'),
    same: f('F_SAME_DEST'), inc: f('Incoterm'), val: f('Valuta'), note: f('NoteFatt'),
    delega: f('F_Delega'), att: f('F_Att')
  };
  if (fF.rs) fields[fF.rs] = FATT.ragioneSociale;
  if (fF.ref) fields[fF.ref] = FATT.referente;
  if (fF.paese) fields[fF.paese] = FATT.paese;
  if (fF.citta) fields[fF.citta] = FATT.citta;
  if (fF.cap) fields[fF.cap] = FATT.cap;
  if (fF.ind) fields[fF.ind] = FATT.indirizzo;
  if (fF.tel) fields[fF.tel] = FATT.telefono;
  if (fF.piva) fields[fF.piva] = FATT.piva;
  if (fF.same) fields[fF.same] = !!payload.fattSameAsDest;
  if (fF.inc) fields[fF.inc] = payload.incoterm;
  if (fF.val) fields[fF.val] = payload.valuta;
  if (fF.note && payload.noteFatt) fields[fF.note] = payload.noteFatt;
  if (fF.delega) fields[fF.delega] = !!payload.fattDelega;
  // Allegato: se è Attachment Airtable servono URL pubblici; al momento saltiamo il fileName
  // if (fF.att && payload.fatturaFileName) { ... }

  // ID Spedizione custom (se esiste il campo lo valorizziamo dopo la create)
  const fID = pick(CANDIDATES.ID_Sped, names);

  if (process.env.DEBUG_AIRTABLE === '1') {
    console.log('[Airtable] Fields resolved:', { names, fields });
  }

   // 1) Crea record principale
  const main = await base(TABLE.SPED).create([{ fields }]);
  const recId = main[0].id;

  // 1b) Se esiste un campo testuale per l'ID custom, valorizzalo
  const fID = pick(CANDIDATES.ID_Sped, names);
  if (fID) {
    try {
      // Per sicurezza: NON scrivere mai nel campo "ID" (quasi sempre formula)
      if (fID !== 'ID') {
        await base(TABLE.SPED).update([
          { id: recId, fields: { [fID]: genCustomId() } }
        ]);
      }
    } catch (e: any) {
      if (process.env.DEBUG_AIRTABLE === '1') {
        console.error('[Airtable] ID custom update failed', {
          field: fID,
          message: e?.message
        });
      }
      // non rilanciamo: la spedizione è stata comunque creata
    }
  }


  // 2) Crea COLLI
  if (payload.colli?.length) {
    const colNames = await listFieldNames(TABLE.COLLI);
    const c = (k: keyof typeof CAND_COLLO) => pick(CAND_COLLO[k], colNames);

    const link = c('LinkSped');
    const fN = c('N');
    const fL = c('L');
    const fW = c('W');
    const fH = c('H');
    const fP = c('Peso');

    const rows: any[] = payload.colli.map((collo, idx) => {
      const row: Record<string, any> = {};
      if (link) row[link] = [recId];
      if (fN) row[fN] = idx + 1; // enumerazione #1, #2, ...
      if (fL && collo.lunghezza_cm != null) row[fL] = collo.lunghezza_cm;
      if (fW && collo.larghezza_cm != null) row[fW] = collo.larghezza_cm;
      if (fH && collo.altezza_cm != null) row[fH] = collo.altezza_cm;
      if (fP && collo.peso_kg != null) row[fP] = collo.peso_kg;
      return { fields: row };
    });

    if (rows.length) await base(TABLE.COLLI).create(rows);
  }

  // 3) Crea PL (solo per sorgente "Vino")
  if (payload.sorgente === 'vino' && payload.packingList?.length) {
    const plNames = await listFieldNames(TABLE.PL);
    const p = (k: keyof typeof CAND_PL) => pick(CAND_PL[k], plNames);

    const link = p('LinkSped');
    const fEt = p('Etichetta');
    const fBo = p('Bottiglie');
    const fFo = p('FormatoL');
    const fGr = p('Grad');
    const fPr = p('Prezzo');
    const fVa = p('Valuta');
    const fPn = p('PesoNettoBott');
    const fPl = p('PesoLordoBott');

    const rows: any[] = payload.packingList.map((r) => {
      const row: Record<string, any> = {};
      if (link) row[link] = [recId];
      if (fEt) row[fEt] = r.etichetta;
      if (fBo) row[fBo] = r.bottiglie;
      if (fFo) row[fFo] = r.formato_litri;
      if (fGr) row[fGr] = r.gradazione;
      if (fPr) row[fPr] = r.prezzo;
      if (fVa) row[fVa] = r.valuta;
      if (fPn) row[fPn] = r.peso_netto_bott;
      if (fPl) row[fPl] = r.peso_lordo_bott;
      return { fields: row };
    });

    if (rows.length) await base(TABLE.PL).create(rows);
  }

  return { id: recId };
}
