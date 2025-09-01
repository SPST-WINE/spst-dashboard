// lib/airtable.ts
import { TABLE, F, FCOLLO, FPL } from './airtable.schema';

const AIRTABLE_TOKEN = process.env.AIRTABLE_API_TOKEN!;
const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID_SPST!;

if (!AIRTABLE_TOKEN) throw new Error('Missing AIRTABLE_API_TOKEN');
if (!AIRTABLE_BASE) throw new Error('Missing AIRTABLE_BASE_ID_SPST');

const API = `https://api.airtable.com/v0/${AIRTABLE_BASE}`;

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
  // “Tipo (Vino, Altro)”
  sorgente: 'vino' | 'altro';
  // “Sottotipo (B2B, B2C, Sample)”
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  // “Formato”
  formato: 'Pacco' | 'Pallet';
  // “Contenuto Colli”
  contenuto?: string;

  // Ritiro
  ritiroData?: string; // ISO
  ritiroNote?: string;

  // Parti
  mittente: Party;
  destinatario: Party;

  // Fattura
  incoterm: 'DAP' | 'DDP' | 'EXW';
  valuta: 'EUR' | 'USD' | 'GBP';
  noteFatt?: string;
  fatturazione: Party;
  fattSameAsDest?: boolean;
  fattDelega?: boolean;
  fatturaFileName?: string | null; // solo nome; nessun upload via API in questo step

  // Colli
  colli: Collo[];

  // PL vino
  packingList?: RigaPL[];

  // Server-side derivato dal token
  createdByEmail?: string;
};

async function at<T = any>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    // ATTENZIONE: niente cache—siamo in API route
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      const j = JSON.parse(text);
      detail = j?.error?.message || j?.message || text;
    } catch {}
    throw new Error(`AT_${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

function chunk<T>(arr: T[], size = 10): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ------------------------ CREATE -------------------------------------------

export async function createSpedizioneWebApp(payload: SpedizionePayload) {
  // 1) crea record principale
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
    // [F.F_Att]: allegati: omessi (non abbiamo URL da caricare ora)
  };

  const main = await at<{ id: string }>(`${TABLE.SPED}`, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });

  const parentId = main.id;

  // 2) crea COLLI
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

  // 3) crea PL (solo se sorgente = vino)
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

// ------------------------ LIST ---------------------------------------------

type ListOpts = { email?: string };

export async function listSpedizioni(opts: ListOpts = {}) {
  const params = new URLSearchParams();

  // Filtro per email se presente
  if (opts.email) {
    // formula: {Creato da} = 'email'
    params.set(
      'filterByFormula',
      encodeURIComponent(`{${F.CreatoDaEmail}}='${opts.email.replace(/'/g, "\\'")}'`)
    );
  }

  // ordina per createdTime desc (visuale più comoda)
  params.set(
    'sort[0][field]',
    'Created'
  ); // se non hai un campo "Created", commenta; in alternativa Airtable usa createdTime()
  params.set('sort[0][direction]', 'desc');

  // NB: se non hai un campo “Created”, rimuovi il sort qui sopra

  const out: any[] = [];
  let offset: string | undefined = undefined;

  do {
    const url =
      `${TABLE.SPED}?pageSize=100` +
      (offset ? `&offset=${offset}` : '') +
      (params.toString() ? `&${params.toString()}` : '');

    const page = await at<{
      records: { id: string; createdTime: string; fields: Record<string, any> }[];
      offset?: string;
    }>(url);

    for (const r of page.records) {
      const f = r.fields;

      // Oggetto “arricchito” per la UI attuale (con fallback chiavi legacy)
      out.push({
        id: r.id,
        createdTime: r.createdTime,

        // per ricerca/compat con UI
        ['ID Spedizione']: r.id,
        ['Destinatario']: f[F.D_RS] || '',
        ['Città Destinatario']: f[F.D_CITTA] || '',
        ['Paese Destinatario']: f[F.D_PAESE] || '',
        ['Stato']: f[F.Stato] || '',

        // altri dati utili in dettaglio
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
