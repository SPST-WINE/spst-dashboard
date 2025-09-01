// lib/airtable.ts
// Helpers Airtable lato server (Node runtime)

import Airtable from 'airtable';

const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN!;
const AIRTABLE_BASE_ID_SPST = process.env.AIRTABLE_BASE_ID_SPST!;

const AIRTABLE_TABLE_UTENTI =
  process.env.AIRTABLE_TABLE_UTENTI ?? 'UTENTI';

const AIRTABLE_USERS_EMAIL_FIELD =
  process.env.AIRTABLE_USERS_EMAIL_FIELD ?? 'Mail Cliente';

const AIRTABLE_TABLE_SPED_WEBAPP =
  process.env.AIRTABLE_TABLE_SPED_WEBAPP ?? 'SpedizioniWebApp';

const AIRTABLE_TABLE_SPED_COLLI =
  process.env.AIRTABLE_TABLE_SPED_COLLI ?? 'SPED_COLLI';

const AIRTABLE_TABLE_SPED_PL =
  process.env.AIRTABLE_TABLE_SPED_PL ?? 'SPED_PL';

const AIRTABLE_LINK_FIELD_COLLI =
  process.env.AIRTABLE_LINK_FIELD_COLLI ?? 'Spedizione';

const AIRTABLE_LINK_FIELD_PL =
  process.env.AIRTABLE_LINK_FIELD_PL ?? 'Spedizione';

if (!AIRTABLE_API_TOKEN) throw new Error('Missing AIRTABLE_API_TOKEN');
if (!AIRTABLE_BASE_ID_SPST) throw new Error('Missing AIRTABLE_BASE_ID_SPST');

const base = new Airtable({ apiKey: AIRTABLE_API_TOKEN }).base(
  AIRTABLE_BASE_ID_SPST
);

type AirtRecord = Airtable.Record<any>;

/* =========================
   TYPES condivisi col FE
========================= */

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

export type ColloInput = {
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
  // Se in Airtable non hai un campo Valuta in PL, questo valore
  // viene ignorato nella scrittura delle righe PL.
  valuta?: 'EUR' | 'USD' | 'GBP';
  peso_netto_bott: number;
  peso_lordo_bott: number;
};

export type SpedizionePayload = {
  // tipologia
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  formato: 'Pacco' | 'Pallet';
  contenuto?: string;

  // soggetti
  mittente: Party;
  destinatario: Party;

  // solo pagina vino (opzionale)
  destAbilitato?: boolean;

  // colli
  colli: ColloInput[];

  // ritiro
  ritiroData?: string | Date;
  ritiroNote?: string;

  // fattura commerciale
  incoterm: 'DAP' | 'DDP' | 'EXW';
  valuta: 'EUR' | 'USD' | 'GBP';
  noteFatt?: string;

  // fattura: dati anagrafici
  fatturazione: Party;
  sameAsDest?: boolean;
  delega: boolean;
  fatturaFileUrl?: string; // URL pubblico se vuoi allegare subito

  // packing list (solo vino)
  packingList?: RigaPL[];

  // opzionale: per tracciare chi crea
  createdByEmail?: string;
};

/* =========================
   UTILS
========================= */

function toObj(rec: AirtRecord) {
  return { id: rec.id, fields: rec.fields as Record<string, any> };
}

function escapeFormulaString(value: string) {
  return value.replace(/'/g, "\\'");
}

function toIsoOrUndefined(d?: string | Date) {
  if (!d) return undefined;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

async function createInChunks(
  table: Airtable.Table<any>,
  rows: Array<{ fields: Record<string, any> }>
) {
  const chunk = 10;
  for (let i = 0; i < rows.length; i += chunk) {
    await table.create(rows.slice(i, i + chunk));
  }
}

/* =========================
   UTENTI
========================= */

export async function getUtenteByEmail(email: string) {
  const table = base.table(AIRTABLE_TABLE_UTENTI);
  const emailNorm = email.trim().toLowerCase();
  const emailEsc = escapeFormulaString(emailNorm);
  const formula = `LOWER(TRIM({${AIRTABLE_USERS_EMAIL_FIELD}})) = '${emailEsc}'`;

  const records = await table
    .select({ maxRecords: 1, filterByFormula: formula })
    .firstPage();

  if (!records || records.length === 0) return null;
  return toObj(records[0]);
}

export async function upsertUtente(params: {
  email: string;
  fields?: Record<string, any>;
}) {
  const email = params.email.trim();
  const fields = params.fields ?? {};

  const fieldsWithEmail = {
    ...fields,
    [AIRTABLE_USERS_EMAIL_FIELD]: email,
  };

  const existing = await getUtenteByEmail(email);
  const table = base.table(AIRTABLE_TABLE_UTENTI);

  if (existing) {
    const updated = await table.update(existing.id, fieldsWithEmail);
    return toObj(updated);
  } else {
    const created = await table.create(fieldsWithEmail);
    return toObj(created);
  }
}

/* =========================
   SPEDIZIONI WEB APP
========================= */

export async function createSpedizioneWebApp(payload: SpedizionePayload) {
  const {
    tipoSped,
    formato,
    contenuto,
    mittente,
    destinatario,
    destAbilitato,
    colli,
    ritiroData,
    ritiroNote,
    incoterm,
    valuta,
    noteFatt,
    fatturazione,
    sameAsDest,
    delega,
    fatturaFileUrl,
    packingList,
    createdByEmail,
  } = payload;

  const spedTable = base.table(AIRTABLE_TABLE_SPED_WEBAPP);
  const colliTable = base.table(AIRTABLE_TABLE_SPED_COLLI);
  const plTable = base.table(AIRTABLE_TABLE_SPED_PL);

  // Mappa campi MAIN (SpedizioniWebApp)
  const mainFields: Record<string, any> = {
    // tipologia
    'Tipo spedizione': tipoSped,
    Formato: formato,
    Contenuto: contenuto ?? '',

    // ritiro
    'Ritiro data': toIsoOrUndefined(ritiroData),
    'Ritiro note': ritiroNote ?? '',

    // stato iniziale
    Stato: 'Nuova',

    // opzionale: traccia chi crea
    'Creato da (email)': createdByEmail ?? undefined,

    // mittente
    'Mitt Ragione sociale': mittente.ragioneSociale,
    'Mitt Referente': mittente.referente,
    'Mitt Paese': mittente.paese,
    'Mitt Città': mittente.citta,
    'Mitt CAP': mittente.cap,
    'Mitt Indirizzo': mittente.indirizzo,
    'Mitt Telefono': mittente.telefono,
    'Mitt PIVA/CF': mittente.piva,

    // destinatario
    'Dest Ragione sociale': destinatario.ragioneSociale,
    'Dest Referente': destinatario.referente,
    'Dest Paese': destinatario.paese,
    'Dest Città': destinatario.citta,
    'Dest CAP': destinatario.cap,
    'Dest Indirizzo': destinatario.indirizzo,
    'Dest Telefono': destinatario.telefono,
    'Dest PIVA/CF': destinatario.piva,

    // solo vino (se presente)
    'Dest abilitato import vino': typeof destAbilitato === 'boolean' ? destAbilitato : undefined,

    // commerciale fattura
    Incoterm: incoterm,
    Valuta: valuta,
    'Note Fattura': noteFatt ?? '',

    // fatturazione anagrafica
    'FATT Ragione sociale': fatturazione.ragioneSociale,
    'FATT Referente': fatturazione.referente,
    'FATT Paese': fatturazione.paese,
    'FATT Città': fatturazione.citta,
    'FATT CAP': fatturazione.cap,
    'FATT Indirizzo': fatturazione.indirizzo,
    'FATT Telefono': fatturazione.telefono,
    'FATT PIVA/CF': fatturazione.piva,
    'FATT Uguale a Destinatario': typeof sameAsDest === 'boolean' ? sameAsDest : undefined,

    // fattura flusso
    'Fattura – Delega a SPST': delega,
    'Fattura – Allegato': fatturaFileUrl
      ? [{ url: fatturaFileUrl }]
      : undefined,
  };

  // Crea record principale
  const createdMain = await spedTable.create(mainFields);
  const main = toObj(createdMain);
  const link = [main.id];

  // Crea COLLI (a chunk di 10)
  if (Array.isArray(colli) && colli.length > 0) {
    const rows = colli.map((c) => ({
      fields: {
        [AIRTABLE_LINK_FIELD_COLLI]: link,
        'Lunghezza (cm)': c.lunghezza_cm ?? undefined,
        'Larghezza (cm)': c.larghezza_cm ?? undefined,
        'Altezza (cm)': c.altezza_cm ?? undefined,
        'Peso (kg)': c.peso_kg ?? undefined,
      },
    }));
    await createInChunks(colliTable, rows);
  }

  // Crea PACKING LIST (se presente). Nota: non scriviamo la valuta per riga
  // se il campo non esiste nella base. Manteniamo "Prezzo" numerico.
  if (Array.isArray(packingList) && packingList.length > 0) {
    const rows = packingList.map((r) => ({
      fields: {
        [AIRTABLE_LINK_FIELD_PL]: link,
        Etichetta: r.etichetta,
        Bottiglie: r.bottiglie,
        'Formato (L)': r.formato_litri,
        Gradazione: r.gradazione,
        Prezzo: r.prezzo,
        'Peso netto bott (kg)': r.peso_netto_bott,
        'Peso lordo bott (kg)': r.peso_lordo_bott,
        // Se nella tua base hai anche un campo "Valuta" nella tabella PL,
        // decommenta la riga seguente e assicurati che il nome del campo combaci.
        // Valuta: r.valuta,
      },
    }));
    await createInChunks(plTable, rows);
  }

  return main; // { id, fields }
}
