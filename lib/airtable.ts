// lib/airtable.ts
// Complete module: utenti helpers + creazione spedizione/collo/PL

const AIRTABLE_API = 'https://api.airtable.com/v0';

const BASE_ID = process.env.AIRTABLE_BASE_ID_SPST!;
const TOKEN = process.env.AIRTABLE_API_TOKEN!;

const T_SPED = process.env.AIRTABLE_TABLE_SPED_WEBAPP || 'SpedizioniWebApp';
const T_COLLI = process.env.AIRTABLE_TABLE_SPED_COLLI || 'SPED_COLLI';
const T_PL = process.env.AIRTABLE_TABLE_SPED_PL || 'SPED_PL';

const T_UTENTI = process.env.AIRTABLE_TABLE_UTENTI || 'UTENTI';
const USERS_EMAIL_FIELD = process.env.AIRTABLE_USERS_EMAIL_FIELD || 'Mail Cliente';

if (!BASE_ID || !TOKEN) {
  throw new Error('Missing AIRTABLE_BASE_ID_SPST or AIRTABLE_API_TOKEN');
}

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

type Collo = {
  lunghezza_cm: number | null;
  larghezza_cm: number | null;
  altezza_cm: number | null;
  peso_kg: number | null;
};

type RigaPL = {
  etichetta: string;
  bottiglie: number;
  formato_litri: number;
  gradazione: number;
  prezzo: number;
  peso_netto_bott: number;
  peso_lordo_bott: number;
};

export type NewSpedizionePayload = {
  tipoContenuto: 'vino' | 'altro';
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  destAbilitato?: boolean;

  mittente: Party;
  destinatario: Party;

  contenuto: string;
  formato: 'Pacco' | 'Pallet';

  colli: Collo[];

  ritiroData?: string; // yyyy-mm-dd
  ritiroNote?: string;

  incoterm: 'DAP' | 'DDP' | 'EXW';
  valuta: 'EUR' | 'USD' | 'GBP';
  noteFatt?: string;

  fatturazione: Party;
  sameAsDest: boolean;
  delegaFattura: boolean;

  fatturaUrl?: string;

  packingList?: RigaPL[];

  stato?: 'Nuova' | 'Evasa' | 'In transito' | 'Consegnata' | 'Annullata';
  corriere?: 'DHL' | 'FedEx' | 'TNT' | 'UPS' | 'GLS' | 'Privato';
  tracking?: string;
};

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };
}

async function airtableFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${AIRTABLE_API}/${BASE_ID}/${encodeURIComponent(path)}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers || {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Airtable ${res.status} ${res.statusText} – ${text}`);
  }
  return res.json() as Promise<T>;
}

function partyToFields(prefix: string, p: Party) {
  return {
    [`${prefix} Ragione sociale`]: p.ragioneSociale || '',
    [`${prefix} Referente`]: p.referente || '',
    [`${prefix} Paese`]: p.paese || '',
    [`${prefix} Città`]: p.citta || '',
    [`${prefix} CAP`]: p.cap || '',
    [`${prefix} Indirizzo`]: p.indirizzo || '',
    [`${prefix} Telefono`]: p.telefono || '',
    [`${prefix} PIVA/CF`]: p.piva || '',
  };
}

/* =========================
   UTENTI: get/upsert helpers
   ========================= */

type AirtableListResponse<T = any> = { records: Array<{ id: string; fields: T }> };
type AirtableRecord<T = any> = { id: string; fields: T };

function encodeFormula(formula: string) {
  return encodeURIComponent(formula);
}

export async function getAirtableUserByEmail(email: string): Promise<AirtableRecord | null> {
  const emailLower = (email || '').trim().toLowerCase();
  const formula = `LOWER({${USERS_EMAIL_FIELD}})='${emailLower.replace(/'/g, "\\'")}'`;
  const url = `${T_UTENTI}?maxRecords=1&filterByFormula=${encodeFormula(formula)}`;
  const data = await airtableFetch<AirtableListResponse>(url);
  return data.records?.[0] || null;
}

// Alias per compatibilità con import esistenti
export const getUtenteByEmail = getAirtableUserByEmail;

export async function upsertUtente(email: string, extra?: Record<string, any>) {
  const found = await getAirtableUserByEmail(email);
  if (found) {
    const updated = await airtableFetch<AirtableRecord>(`${T_UTENTI}/${found.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: { ...(extra || {}) } }),
    });
    return updated;
  }

  const created = await airtableFetch<AirtableRecord>(T_UTENTI, {
    method: 'POST',
    body: JSON.stringify({
      fields: {
        [USERS_EMAIL_FIELD]: email,
        ...(extra || {}),
      },
      typecast: true,
    }),
  });
  return created;
}

/* ======================================
   SPEDIZIONI: main + colli + packing list
   ====================================== */

export async function createSpedizioneWebApp(payload: NewSpedizionePayload) {
  const fields: Record<string, any> = {
    'Tipo spedizione': payload.tipoSped,
    'Contenuto': payload.contenuto || '',
    'Formato': payload.formato,

    ...partyToFields('Mitt', payload.mittente),
    ...partyToFields('Dest', payload.destinatario),

    ...(typeof payload.destAbilitato === 'boolean'
      ? { 'Destinatario abil. import': payload.destAbilitato }
      : {}),

    'Data ritiro': payload.ritiroData || null,
    'Note ritiro': payload.ritiroNote || '',

    'Incoterm': payload.incoterm,
    'Valuta': payload.valuta,
    'Note Fattura': payload.noteFatt || '',

    'FATT Ragione sociale': payload.fatturazione.ragioneSociale || '',
    'FATT Referente': payload.fatturazione.referente || '',
    'FATT Paese': payload.fatturazione.paese || '',
    'FATT Città': payload.fatturazione.citta || '',
    'FATT CAP': payload.fatturazione.cap || '',
    'FATT Indirizzo': payload.fatturazione.indirizzo || '',
    'FATT Telefono': payload.fatturazione.telefono || '',
    'FATT PIVA/CF': payload.fatturazione.piva || '',
    'FATT Uguale a Destinatario': !!payload.sameAsDest,

    'Fattura – Delega a SPST': !!payload.delegaFattura,

    'Stato': payload.stato || 'Nuova',
    ...(payload.corriere ? { 'Corriere': payload.corriere } : {}),
    ...(payload.tracking ? { 'Tracking Number': payload.tracking } : {}),
  };

  if (payload.fatturaUrl) {
    fields['Fattura – Allegato'] = [{ url: payload.fatturaUrl }];
  }

  const created = await airtableFetch<AirtableRecord>(T_SPED, {
    method: 'POST',
    body: JSON.stringify({
      fields,
      typecast: true,
    }),
  });

  const spedId = created.id;

  if (payload.colli && payload.colli.length > 0) {
    const recs = payload.colli.map((c) => ({
      fields: {
        'Spedizione': [spedId],
        'Lunghezza cm': c.lunghezza_cm ?? null,
        'Larghezza cm': c.larghezza_cm ?? null,
        'Altezza cm': c.altezza_cm ?? null,
        'Peso kg': c.peso_kg ?? null,
      },
    }));
    for (let i = 0; i < recs.length; i += 10) {
      await airtableFetch<any>(`${T_COLLI}`, {
        method: 'POST',
        body: JSON.stringify({ records: recs.slice(i, i + 10) }),
      });
    }
  }

  if (payload.packingList && payload.packingList.length > 0) {
    const recs = payload.packingList.map((r) => ({
      fields: {
        'Spedizione': [spedId],
        'Etichetta': r.etichetta || '',
        'Bottiglie': r.bottiglie ?? null,
        'Formato L': r.formato_litri ?? null,
        'Gradazione %': r.gradazione ?? null,
        'Prezzo': r.prezzo ?? null,
        'Peso netto bottiglia kg': r.peso_netto_bott ?? null,
        'Peso lordo bottiglia kg': r.peso_lordo_bott ?? null,
      },
    }));
    for (let i = 0; i < recs.length; i += 10) {
      await airtableFetch<any>(`${T_PL}`, {
        method: 'POST',
        body: JSON.stringify({ records: recs.slice(i, i + 10) }),
      });
    }
  }

  return { id: spedId };
}
