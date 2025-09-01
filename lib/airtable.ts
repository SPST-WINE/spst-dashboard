// lib/airtable.ts
import { TABLE, F, FCOLLO, FPL } from './airtable.schema';

const AIRTABLE_TOKEN = process.env.AIRTABLE_API_TOKEN!;
const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID_SPST!;
if (!AIRTABLE_TOKEN) throw new Error('Missing AIRTABLE_API_TOKEN');
if (!AIRTABLE_BASE) throw new Error('Missing AIRTABLE_BASE_ID_SPST');

const API = `https://api.airtable.com/v0/${AIRTABLE_BASE}`;

// ---- opzionale: tabella UTENTI per check-login / abilitazioni -------------
const TABLE_USERS =
  process.env.AIRTABLE_TABLE_UTENTI || 'Utenti';
const FIELD_USER_EMAIL =
  process.env.AIRTABLE_USERS_EMAIL_FIELD || 'Email';
const FIELD_USER_ENABLED =
  process.env.AIRTABLE_USERS_ENABLED_FIELD || 'Abilitato';

// ---------------------------------------------------------------------------

type SingleSelect = string;

export type Party = {
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
  formato: 'Pacco' | 'Pallet';
  contenuto?: string;

  ritiroData?: string; // ISO
  ritiroNote?: string;

  mittente: Party;
  destinatario: Party;

  incoterm: 'DAP' | 'DDP' | 'EXW';
  valuta: 'EUR' | 'USD' | 'GBP';
  noteFatt?: string;
  fatturazione: Party;
  fattSameAsDest?: boolean;
  fattDelega?: boolean;
  fatturaFileName?: string | null;

  colli: Collo[];
  packingList?: RigaPL[];

  createdByEmail?: string;
};

// ------------------ helpers -------------------------------------------------

async function at<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      throw new Error(`AT_${res.status}: ${j?.error?.message || j?.message || text}`);
    } catch {
      throw new Error(`AT_${res.status}: ${text}`);
    }
  }
  return res.json() as Promise<T>;
}

function chunk<T>(arr: T[], size = 10): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function escFormula(str: string) {
  // escape singoli apici per formula Airtable
  return String(str).replace(/'/g, "\\'");
}

// ------------------------ CREATE SPEDIZIONE --------------------------------

export async function createSpedizioneWebApp(payload: SpedizionePayload) {
  const fields: Record<string, any> = {
    [F.Stato]: 'Nuova',
    [F.Sorgente]: payload.sorgente === 'vino' ? 'Vino' : 'Altro',
    [F.Tipo]: payload.tipoSped,
    [F.Formato]: payload.formato,
    [F.Contenuto]: payload.contenuto || '',
    [F.RitiroData]: payload.ritiroData || null,
    [F.RitiroNote]: payload.ritiroNote || '',
    [F.CreatoDaEmail]: payload.createdByEmail || '',

    // Mittente
    [F.M_RS]: payload.mittente.ragioneSociale,
    [F.M_REF]: payload.mittente.referente,
    [F.M_PAESE]: payload.mittente.paese,
    [F.M_CITTA]: payload.mittente.citta,
    [F.M_CAP]: payload.mittente.cap,
    [F.M_INDIRIZZO]: payload.mittente.indirizzo,
    [F.M_TEL]: payload.mittente.telefono,
    [F.M_PIVA]: payload.mittente.piva,

    // Destinatario
    [F.D_RS]: payload.destinatario.ragioneSociale,
    [F.D_REF]: payload.destinatario.referente,
    [F.D_PAESE]: payload.destinatario.paese,
    [F.D_CITTA]: payload.destinatario.citta,
    [F.D_CAP]: payload.destinatario.cap,
    [F.D_INDIRIZZO]: payload.destinatario.indirizzo,
    [F.D_TEL]: payload.destinatario.telefono,
    [F.D_PIVA]: payload.destinatario.piva,

    // Fatturazione
    [F.F_RS]: payload.fatturazione.ragioneSociale,
    [F.F_REF]: payload.fatturazione.referente,
    [F.F_PAESE]: payload.fatturazione.paese,
    [F.F_CITTA]: payload.fatturazione.citta,
    [F.F_CAP]: payload.fatturazione.cap,
    [F.F_INDIRIZZO]: payload.fatturazione.indirizzo,
    [F.F_TEL]: payload.fatturazione.telefono,
    [F.F_PIVA]: payload.fatturazione.piva,
    [F.F_SAME_DEST]: !!payload.fattSameAsDest,
    [F.Incoterm]: payload.incoterm as SingleSelect,
    [F.Valuta]: payload.valuta as SingleSelect,
    [F.NoteFatt]: payload.noteFatt || '',
    [F.F_Delega]: !!payload.fattDelega,
    // Allegati (F.F_Att / LDV / DLE / etc.) non gestiti in questo endpoint
  };

  const main = await at<{ id: string }>(`${TABLE.SPED}`, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });

  const parentId = main.id;

  // COLLI
  const colli = (payload.colli || []).filter(
    (c) => c.lunghezza_cm || c.larghezza_cm || c.altezza_cm || c.peso_kg
  );
  if (colli.length) {
    const recs = colli.map((c) => ({
      fields: {
        [FCOLLO.LinkSped]: [parentId],
        [FCOLLO.L]: c.lunghezza_cm ?? null,
        [FCOLLO.W]: c.larghezza_cm ?? null,
        [FCOLLO.H]: c.altezza_cm ?? null,
        [FCOLLO.Peso]: c.peso_kg ?? null,
      },
    }));
    for (const group of chunk(recs, 10)) {
      await at(`${TABLE.COLLI}`, {
        method: 'POST',
        body: JSON.stringify({ records: group }),
      });
    }
  }

  // PL (solo vino)
  if (payload.sorgente === 'vino' && payload.packingList?.length) {
    const recsPL = payload.packingList.map((r) => ({
      fields: {
        [FPL.LinkSped]: [parentId],
        [FPL.Etichetta]: r.etichetta,
        [FPL.Bottiglie]: r.bottiglie,
        [FPL.FormatoL]: r.formato_litri,
        [FPL.Grad]: r.gradazione,
        [FPL.Prezzo]: r.prezzo,
        [FPL.Valuta]: r.valuta,
        [FPL.PesoNettoBott]: r.peso_netto_bott,
        [FPL.PesoLordoBott]: r.peso_lordo_bott,
      },
    }));
    for (const group of chunk(recsPL, 10)) {
      await at(`${TABLE.PL}`, {
        method: 'POST',
        body: JSON.stringify({ records: group }),
      });
    }
  }

  return { id: parentId };
}

// ------------------------ LIST SPEDIZIONI ----------------------------------

type ListOpts = { email?: string };

export async function listSpedizioni(opts: ListOpts = {}) {
  const params: string[] = [];
  if (opts.email) {
    const formula = `{${FIELD_USER_EMAIL || F.CreatoDaEmail}}='${escFormula(
      opts.email.toLowerCase()
    )}'`;
    // proviamo prima sul campo "Creato da" se esiste; fallback al campo email utente
    const formulaOR = `OR({${F.CreatoDaEmail}}='${escFormula(
      opts.email
    )}', LOWER({${F.CreatoDaEmail}})='${escFormula(
      opts.email.toLowerCase()
    )}', LOWER({${FIELD_USER_EMAIL}})='${escFormula(opts.email.toLowerCase())}')`;
    params.push(`filterByFormula=${encodeURIComponent(formulaOR)}`);
  }
  // rimuovi se non hai un campo creato/adatto
  // params.push(`sort[0][field]=Created`);
  // params.push(`sort[0][direction]=desc`);

  const out: any[] = [];
  let offset: string | undefined;

  do {
    const url =
      `${TABLE.SPED}?pageSize=100` +
      (offset ? `&offset=${offset}` : '') +
      (params.length ? `&${params.join('&')}` : '');

    const page = await at<{
      records: { id: string; createdTime: string; fields: Record<string, any> }[];
      offset?: string;
    }>(url);

    for (const r of page.records) {
      const f = r.fields;
      out.push({
        id: r.id,
        createdTime: r.createdTime,

        ['ID Spedizione']: r.id,
        ['Destinatario']: f[F.D_RS] || '',
        ['Città Destinatario']: f[F.D_CITTA] || '',
        ['Paese Destinatario']: f[F.D_PAESE] || '',
        ['Stato']: f[F.Stato] || '',

        mittente: {
          ragioneSociale: f[F.M_RS] || '',
          paese: f[F.M_PAESE] || '',
          citta: f[F.M_CITTA] || '',
        },
        destinatario: {
          ragioneSociale: f[F.D_RS] || '',
          paese: f[F.D_PAESE] || '',
          citta: f[F.D_CITTA] || '',
        },
        tipo: f[F.Sorgente] || '',
        sottotipo: f[F.Tipo] || '',
        formato: f[F.Formato] || '',
        contenuto: f[F.Contenuto] || '',
        ritiroData: f[F.RitiroData] || null,
        ritiroNote: f[F.RitiroNote] || '',
        corriere: f[F.Corriere] || '',
        tracking: f[F.Tracking] || '',
        incoterm: f[F.Incoterm] || '',
        valuta: f[F.Valuta] || '',
        noteFatt: f[F.NoteFatt] || '',
      });
    }

    offset = (page as any).offset;
  } while (offset);

  return out;
}

// ------------------------ UTENTI (per /api/check-user & /api/utenti) -------

export async function getUtenteByEmail(email: string) {
  const formula = `LOWER({${FIELD_USER_EMAIL}})='${escFormula(
    email.toLowerCase()
  )}'`;
  const url = `${TABLE_USERS}?maxRecords=1&filterByFormula=${encodeURIComponent(
    formula
  )}`;

  const res = await at<{
    records: { id: string; fields: Record<string, any> }[];
  }>(url);

  if (!res.records.length) return null;

  const rec = res.records[0];
  const f = rec.fields;
  const rawEnabled = f[FIELD_USER_ENABLED] ?? f['Enabled'] ?? f['Abilitato'];
  const enabled =
    typeof rawEnabled === 'boolean'
      ? rawEnabled
      : typeof rawEnabled === 'string'
      ? ['true', 'si', 'sì', 'yes', '1'].includes(rawEnabled.toLowerCase())
      : !!rawEnabled;

  return {
    id: rec.id,
    email: f[FIELD_USER_EMAIL] || email,
    enabled,
    fields: f,
  };
}

type UpsertArgs =
  | { email: string; fields?: Record<string, any> }
  | string;

export async function upsertUtente(arg1: UpsertArgs, fields?: Record<string, any>) {
  const email = typeof arg1 === 'string' ? arg1 : arg1.email;
  const extra = typeof arg1 === 'string' ? fields || {} : arg1.fields || {};

  // cerca esistente
  const existing = await getUtenteByEmail(email);

  const bodyFields = {
    [FIELD_USER_EMAIL]: email,
    ...extra,
  };

  if (existing?.id) {
    // PATCH
    const recId = existing.id;
    const res = await at<{ id: string }>(`${TABLE_USERS}/${recId}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: bodyFields }),
    });
    return { id: res.id, updated: true };
  } else {
    // CREATE
    const res = await at<{ id: string }>(`${TABLE_USERS}`, {
      method: 'POST',
      body: JSON.stringify({ fields: bodyFields }),
    });
    return { id: res.id, created: true };
  }
}
