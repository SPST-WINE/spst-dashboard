// lib/quotes.ts
// Helper server-side per la tabella Preventivi (Airtable) – indipendente da lib/airtable.ts

import Airtable from 'airtable';

// ENV condivisi con Spedizioni
const API_TOKEN =
  process.env.AIRTABLE_API_TOKEN || process.env.AIRTABLE_API_KEY || '';
const BASE_ID = process.env.AIRTABLE_BASE_ID_SPST || '';

// Tabelle Preventivi (solo questa per ora)
const TB_PREVENTIVI = process.env.AIRTABLE_TABLE_PREVENTIVI || 'Preventivi';

function assertEnv() {
  if (!API_TOKEN) throw new Error('AIRTABLE_API_TOKEN (o AIRTABLE_API_KEY) mancante');
  if (!BASE_ID) throw new Error('AIRTABLE_BASE_ID_SPST mancante');
}

function base() {
  assertEnv();
  Airtable.configure({ apiKey: API_TOKEN });
  return new Airtable().base(BASE_ID);
}

// ---- Tipi base (riuso gli stessi del form Spedizioni dove utile)
export type Party = {
  ragioneSociale: string;
  referente: string;
  paese: string;
  citta: string;
  cap: string;
  indirizzo: string;
  telefono: string;
  piva: string; // Tax/EORI/ecc. nel preventivo
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

  // opzionale: se non arriva, la API valorizza da idToken
  createdByEmail?: string;
}

function optional<T>(v: T | undefined | null) {
  return v === undefined || v === null ? undefined : v;
}
function formatAirtableDateOnly(d?: string) {
  if (!d) return undefined;
  try { return new Date(d).toISOString().slice(0, 10); } catch { return undefined; }
}

// Aggiornamento “tollerante” su più possibili alias di campo
async function tryUpdateMany(recId: string, fields: Array<[string, any]>) {
  const b = base();
  for (const [name, value] of fields) {
    try { await b(TB_PREVENTIVI).update(recId, { [name]: value }); } catch {}
  }
}

// --- CREATE ---------------------------------------------------
export async function createPreventivo(payload: QuotePayload): Promise<{ id: string }> {
  const b = base();

  // Campi minimi: Stato, Email cliente (se disponibile), meta, mittente/destinatario, ritiro, contenuto/formato, note
  const fields: Record<string, any> = {};

  // Stato iniziale
  // NB: lasciare “Bozza” o “Inviato” a tua scelta (di default Bozza)
  fields['Stato'] = 'Bozza';

  // Email cliente (salva su alias più comuni in post-create)
  // (in create metto un campo “sicuro”, poi sotto aggiorno alias)
  if (payload.createdByEmail) {
    fields['Email_Cliente'] = payload.createdByEmail;
  }

  // Sorgente + sottotipo
  fields['Sorgente'] = payload.sorgente === 'vino' ? 'Vino' : 'Altro';
  fields['Sottotipo'] = payload.tipoSped;

  // Formato + contenuto
  fields['Formato'] = payload.formato;
  if (payload.contenuto) fields['Contenuto Colli'] = payload.contenuto;

  // Ritiro
  const d = formatAirtableDateOnly(payload.ritiroData);
  if (d) fields['Ritiro - Data'] = d;
  if (payload.ritiroNote) fields['Ritiro - Note'] = payload.ritiroNote;

  // Mittente (prefisso “Mittente_” usato dal BO)
  fields['Mittente_Nome'] = optional(payload.mittente.ragioneSociale);
  fields['Mittente_Indirizzo'] = optional(payload.mittente.indirizzo);
  fields['Mittente_CAP'] = optional(payload.mittente.cap);
  fields['Mittente_Citta'] = optional(payload.mittente.citta);
  fields['Mittente_Paese'] = optional(payload.mittente.paese);
  fields['Mittente_Telefono'] = optional(payload.mittente.telefono);
  fields['Mittente_Tax'] = optional(payload.mittente.piva);

  // Destinatario (prefisso “Destinatario_” usato dal BO)
  fields['Destinatario_Nome'] = optional(payload.destinatario.ragioneSociale);
  fields['Destinatario_Indirizzo'] = optional(payload.destinatario.indirizzo);
  fields['Destinatario_CAP'] = optional(payload.destinatario.cap);
  fields['Destinatario_Citta'] = optional(payload.destinatario.citta);
  fields['Destinatario_Paese'] = optional(payload.destinatario.paese);
  fields['Destinatario_Telefono'] = optional(payload.destinatario.telefono);
  fields['Destinatario_Tax'] = optional(payload.destinatario.piva);

  // Note generiche sulla spedizione (campo BO)
  if (payload.noteGeneriche) {
    fields['Note generiche sulla spedizione'] = payload.noteGeneriche;
  }

  const created = await b(TB_PREVENTIVI).create([{ fields }]);
  const recId = created[0].id;

  // Post-create: prova alias alternativi senza fallire la transazione
  if (payload.createdByEmail) {
    await tryUpdateMany(recId, [
      ['Email Cliente', payload.createdByEmail],
      ['Email', payload.createdByEmail],
      ['Cliente_Email', payload.createdByEmail],
    ]);
  }

  return { id: recId };
}

// --- LIST -----------------------------------------------------
export async function listPreventivi(opts?: { email?: string; q?: string }): Promise<any[]> {
  const b = base();
  const out: any[] = [];

  const select: any = {
    pageSize: 50,
    sort: [{ field: 'Created', direction: 'desc' }], // se non esiste, Airtable ignora
  };

  // Filtro per email cliente (alias più comuni)
  if (opts?.email && opts.email.trim()) {
    const safe = String(opts.email).replace(/"/g, '\\"').trim();
    const candidates = ['Email_Cliente', 'Email Cliente', 'Email', 'Cliente_Email'];
    const or = candidates.map((c) => `LOWER({${c}}) = LOWER("${safe}")`).join(',');
    select.filterByFormula = `OR(${or})`;
  }

  await b(TB_PREVENTIVI)
    .select(select)
    .eachPage((records, next) => {
      for (const r of records) {
        out.push({ id: r.id, ...r.fields });
      }
      next();
    });

  // Ordina per createdTime se disponibile
  out.sort((a, b) => {
    const ca = (a as any)._rawJson?.createdTime ? new Date((a as any)._rawJson.createdTime).getTime() : 0;
    const cb = (b as any)._rawJson?.createdTime ? new Date((b as any)._rawJson.createdTime).getTime() : 0;
    return cb - ca;
  });

  return out;
}
