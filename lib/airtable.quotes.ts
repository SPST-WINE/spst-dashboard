// lib/airtable.quotes.ts
import Airtable from 'airtable';
import { QTABLE, QF, QCOLLO } from './airtable.schema';

export type QParty = {
  ragioneSociale: string;
  paese: string;
  citta: string;
  cap: string;
  indirizzo: string;
  telefono?: string;
  taxId?: string; // PIVA/EORI/EIN
};

export type QCollo = {
  quantita?: number;        // default 1
  lunghezza_cm?: number|null;
  larghezza_cm?: number|null;
  altezza_cm?: number|null;
  peso_kg?: number|null;
};

export interface QuotePayload {
  mittente: QParty;
  destinatario: QParty;
  colli: QCollo[];
  valuta: 'EUR'|'USD'|'GBP';
  note?: string;            // note generiche spedizione
}

const API_TOKEN = process.env.AIRTABLE_API_TOKEN || process.env.AIRTABLE_API_KEY || '';
const BASE_ID   = process.env.AIRTABLE_BASE_ID_SPST || '';

function assertEnv() {
  if (!API_TOKEN) throw new Error('AIRTABLE_API_TOKEN mancante');
  if (!BASE_ID) throw new Error('AIRTABLE_BASE_ID_SPST mancante');
}

function base() {
  assertEnv();
  Airtable.configure({ apiKey: API_TOKEN });
  return new Airtable().base(BASE_ID);
}

const b = () => base();

const safe = (v: any) => (v === undefined || v === null ? undefined : v);

/** Crea un preventivo in stato "Bozza (cliente)" + colli (se presenti) */
export async function createPreventivoBozza(payload: QuotePayload, email?: string) {
  const fields: Record<string, any> = {
    [QF.Stato]: 'Bozza (cliente)',
    [QF.Valuta]: payload.valuta,
    [QF.NoteSpedizione]: payload.note || '',
    [QF.EmailCliente]: email || '',
    // Mittente
    [QF.M_RS]: payload.mittente.ragioneSociale,
    [QF.M_PAESE]: payload.mittente.paese,
    [QF.M_CITTA]: payload.mittente.citta,
    [QF.M_CAP]: payload.mittente.cap,
    [QF.M_INDIRIZZO]: payload.mittente.indirizzo,
    [QF.M_TEL]: safe(payload.mittente.telefono),
    [QF.M_TAX]: safe(payload.mittente.taxId),
    // Destinatario
    [QF.D_RS]: payload.destinatario.ragioneSociale,
    [QF.D_PAESE]: payload.destinatario.paese,
    [QF.D_CITTA]: payload.destinatario.citta,
    [QF.D_CAP]: payload.destinatario.cap,
    [QF.D_INDIRIZZO]: payload.destinatario.indirizzo,
    [QF.D_TEL]: safe(payload.destinatario.telefono),
    [QF.D_TAX]: safe(payload.destinatario.taxId),
  };

  const created = await b()(QTABLE.PREVENTIVI).create([{ fields }]);
  const recId = created[0].id;

  // Colli
  if (payload.colli?.length) {
    const rows = payload.colli.map((c) => ({
      fields: {
        [QCOLLO.LinkPreventivo]: [recId],
        [QCOLLO.Quantita]: c.quantita ?? 1,
        [QCOLLO.L]: safe(c.lunghezza_cm),
        [QCOLLO.W]: safe(c.larghezza_cm),
        [QCOLLO.H]: safe(c.altezza_cm),
        [QCOLLO.Peso]: safe(c.peso_kg),
      },
    }));
    for (let i = 0; i < rows.length; i += 10) {
      await b()(QTABLE.COLLI).create(rows.slice(i, i + 10));
    }
  }

  return { id: recId };
}

/** Lista preventivi per email cliente. Restituisce i campi + meta minimi */
export async function listPreventiviByEmail(email: string) {
  const all: Array<{ id: string; fields: any; _created?: string }> = [];
  const filter = `LOWER({${QF.EmailCliente}}) = LOWER("${String(email).replace(/"/g,'\\"')}")`;

  await b()(QTABLE.PREVENTIVI)
    .select({
      filterByFormula: filter,
      pageSize: 50,
      sort: [{ field: QF.Validita, direction: 'desc' }],
    })
    .eachPage((records, next) => {
      for (const r of records) {
        all.push({ id: r.id, fields: r.fields, _created: (r as any)?._rawJson?.createdTime });
      }
      next();
    });

  // fallback sort by created desc
  all.sort((a, b) => {
    const ca = a._created ? new Date(a._created).getTime() : 0;
    const cb = b._created ? new Date(b._created).getTime() : 0;
    return cb - ca;
  });

  return all;
}
