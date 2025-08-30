// lib/airtable.ts

// ==== Config di base (Airtable) ====
const API = 'https://api.airtable.com/v0';

const AIRTABLE_BASE = process.env.AIRTABLE_BASE_SPST!;
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const HDRS = { Authorization: `Bearer ${AIRTABLE_TOKEN}` };

export const TBL_SPEDIZIONI = process.env.AIRTABLE_TABLE_SPEDIZIONI || 'SPEDIZIONI';
export const TBL_UTENTI = process.env.AIRTABLE_TABLE_UTENTI || 'UTENTI';

// ==== Tipi utili ====
export type AirtableRecord<T = any> = { id: string; fields: T };

export type Collo = { lunghezza_cm: number; larghezza_cm: number; altezza_cm: number; peso_kg: number };
export type Party = {
  ragione: string; paese: string; indirizzo: string; cap: string; citta: string; telefono: string;
  referente?: string; piva_cf?: string;
};
export type PackingItem = { descrizione: string; quantita: number; valore_unit: number; volume_l?: number; gradazione?: number };

export type CreateSpedizioneInput = {
  email: string;
  tipo_generale: 'VINO' | 'ALTRO';
  tipo_spedizione: 'B2B' | 'B2C' | 'Campionatura';
  mittente: Party;
  destinatario: Party;
  colli: Collo[];
  formato: 'Pallet' | 'Pacco';
  note_ritiro?: string;
  contenuto?: string;           // usato per ALTRO
  data_ritiro?: string;         // yyyy-mm-dd
  fattura?: {
    incoterm: 'DAP' | 'DDP' | 'EXW';
    valuta: 'EUR' | 'USD' | 'GBP' | 'CHF' | string;
    note?: string;
    url?: string;               // link doc
    delega_creazione?: boolean;
  };
  packingList?: PackingItem[];  // usato per VINO
};

// ==== UTENTI ====

// Cerca record utente per email (colonna "Mail Cliente")
export async function getUtenteByEmail(email: string) {
  const f = encodeURIComponent(`{Mail Cliente} = '${email.replace(/'/g, "\\'")}'`);
  const listUrl = `${API}/${AIRTABLE_BASE}/${encodeURIComponent(TBL_UTENTI)}?filterByFormula=${f}&maxRecords=1`;
  const res = await fetch(listUrl, { headers: HDRS, cache: 'no-store' });
  const json = await res.json();
  if (!Array.isArray(json.records) || json.records.length === 0) return null;
  return json.records[0] as AirtableRecord;
}

// Upsert (PATCH se esiste, altrimenti POST)
export async function upsertUtente(email: string, payload: Record<string, any>) {
  const existing = await getUtenteByEmail(email);
  if (existing) {
    const patchRes = await fetch(`${API}/${AIRTABLE_BASE}/${encodeURIComponent(TBL_UTENTI)}`, {
      method: 'PATCH',
      headers: { ...HDRS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [{ id: existing.id, fields: { 'Mail Cliente': email, ...payload } }],
        typecast: true,
      }),
    });
    return patchRes.json();
  }
  const postRes = await fetch(`${API}/${AIRTABLE_BASE}/${encodeURIComponent(TBL_UTENTI)}`, {
    method: 'POST',
    headers: { ...HDRS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      records: [{ fields: { 'Mail Cliente': email, ...payload } }],
      typecast: true,
    }),
  });
  return postRes.json();
}

// ==== SPEDIZIONI (read) ====

export async function listSpedizioni() {
  const url = `${API}/${AIRTABLE_BASE}/${encodeURIComponent(TBL_SPEDIZIONI)}`;
  const res = await fetch(url, { headers: HDRS, cache: 'no-store' });
  const json = await res.json();
  return (json.records || []) as AirtableRecord[];
}

export async function getSpedizione(id: string) {
  const res = await fetch(`${API}/${AIRTABLE_BASE}/${encodeURIComponent(TBL_SPEDIZIONI)}/${id}`, {
    headers: HDRS, cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as AirtableRecord;
}

// ==== SPEDIZIONI (create) ====

export async function createSpedizione(input: CreateSpedizioneInput) {
  const table = encodeURIComponent(TBL_SPEDIZIONI);
  const url = `${API}/${AIRTABLE_BASE}/${table}`;

  const totColli = input.colli?.length || 0;
  const totPeso = (input.colli || []).reduce((s, c) => s + (Number(c.peso_kg) || 0), 0);

  const fields: Record<string, any> = {
    'Mail Cliente': input.email,
    'Tipo Generale': input.tipo_generale,        // VINO | ALTRO
    'Tipo Spedizione': input.tipo_spedizione,    // B2B | B2C | Campionatura

    // Mittente
    'Mittente': input.mittente.ragione,
    'Paese Mittente': input.mittente.paese,
    'Indirizzo Mittente': input.mittente.indirizzo,
    'CAP Mittente': input.mittente.cap,
    'Città Mittente': input.mittente.citta,
    'Telefono Mittente': input.mittente.telefono,
    'Referente Mittente': input.mittente.referente || '',
    'PIVA/CF Mittente': input.mittente.piva_cf || '',

    // Destinatario
    'Destinatario': input.destinatario.ragione,
    'Paese Destinatario': input.destinatario.paese,
    'Indirizzo Destinatario': input.destinatario.indirizzo,
    'CAP Destinatario': input.destinatario.cap,
    'Città Destinatario': input.destinatario.citta,
    'Telefono Destinatario': input.destinatario.telefono,
    'Referente Destinatario': input.destinatario.referente || '',
    'PIVA/CF Destinatario': input.destinatario.piva_cf || '',

    // Colli
    'Numero Colli': totColli,
    'Peso Totale kg': Number(totPeso.toFixed(2)),
    'Colli JSON': JSON.stringify(input.colli || []),
    'Formato': input.formato,                    // Pallet | Pacco

    // Ritiro
    'Note Ritiro': input.note_ritiro || '',
    'Data Ritiro': input.data_ritiro || '',

    // Contenuto / Fattura
    'Contenuto Colli': input.contenuto || '',
    'Incoterm': input.fattura?.incoterm || '',
    'Valuta': input.fattura?.valuta || '',
    'Note Fattura': input.fattura?.note || '',
    'Fattura URL': input.fattura?.url || '',
    'Delega Creazione Fattura': !!input.fattura?.delega_creazione,
  };

  if (input.tipo_generale === 'VINO') {
    fields['Packing List JSON'] = JSON.stringify(input.packingList || []);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...HDRS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!res.ok) throw new Error('Airtable createSpedizione failed');
  return res.json();
}
