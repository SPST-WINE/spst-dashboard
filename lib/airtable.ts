// lib/airtable.ts
import Airtable from 'airtable';
import type { FieldSet, Records } from 'airtable';
import { TABLE, F, FCOLLO, FPL } from './airtable.schema';

/** ----------------------------------------------------------------
 *  ENV reali su Vercel (con fallback solo dove utile)
 *  ---------------------------------------------------------------- */
const AIRTABLE_TOKEN =
  process.env.AIRTABLE_API_TOKEN || // <-- nome reale nel tuo progetto
  process.env.AIRTABLE_API_KEY ||   // fallback se in locale hai KEY
  '';

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID_SPST || '';

const T_SPED = process.env.AIRTABLE_TABLE_SPEDIZIONI_WEBAPP || TABLE.SPED;
const T_COLLI = process.env.AIRTABLE_TABLE_SPED_COLLI || TABLE.COLLI;
const T_PL = process.env.AIRTABLE_TABLE_SPED_PL || TABLE.PL;

const T_UTENTI = process.env.AIRTABLE_TABLE_UTENTI || 'UTENTI';
const USERS_EMAIL_FIELD = process.env.AIRTABLE_USERS_EMAIL_FIELD || 'Email';

const DEBUG_AIRTABLE = process.env.DEBUG_AIRTABLE === '1' || false;

/** Evita di istanziare l’SDK in fase di build */
function getBase() {
  if (!AIRTABLE_TOKEN) {
    throw new Error('AIRTABLE_API_TOKEN is missing');
  }
  if (!AIRTABLE_BASE_ID) {
    throw new Error('AIRTABLE_BASE_ID_SPST is missing');
  }
  const client = new Airtable({ apiKey: AIRTABLE_TOKEN });
  return client.base(AIRTABLE_BASE_ID);
}

/** Utils */
function dlog(...args: any[]) {
  if (DEBUG_AIRTABLE) {
    // non stampiamo mai il token
    console.log('[AIRTABLE]', ...args);
  }
}

function toAirtableDate(dateISO?: string) {
  if (!dateISO) return undefined;
  // Se il campo è "Date" (senza time) Airtable preferisce "YYYY-MM-DD"
  // Se passa una ISO con orario, molte volte fallisce.
  try {
    return dateISO.slice(0, 10); // YYYY-MM-DD
  } catch {
    return undefined;
  }
}

/** ----------------------------------------------------------------
 *  Tipi del payload accettato dall’API
 *  ---------------------------------------------------------------- */
export type Party = {
  ragioneSociale: string; referente: string; paese: string; citta: string;
  cap: string; indirizzo: string; telefono: string; piva: string;
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
  valuta: 'EUR' | 'USD' | 'GBP' | string;
  peso_netto_bott: number;
  peso_lordo_bott: number;
};

export type SpedizionePayload = {
  // “vino” | “altro” -> mappato su F.Sorgente = "Vino"/"Altro"
  sorgente: 'vino' | 'altro';

  // Sottotipo -> B2B | B2C | Sample
  tipoSped: 'B2B' | 'B2C' | 'Sample';

  // opzionale flag per pagina vino
  destAbilitato?: boolean;

  // descrizione contenuto colli
  contenuto?: string;

  // Pacco | Pallet (lo salviamo in tabella principale se hai un campo Formato)
  formato?: 'Pacco' | 'Pallet';

  ritiroData?: string;   // ISO o YYYY-MM-DD
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

  // impostato server-side dalla route
  createdByEmail?: string;
};

/** ----------------------------------------------------------------
 *  CREATE spedizione + righe figlie
 *  ---------------------------------------------------------------- */
export async function createSpedizioneWebApp(payload: SpedizionePayload) {
  const base = getBase();

  // Normalizzazioni
  const tipoSorgente = payload.sorgente === 'vino' ? 'Vino' : 'Altro';
  const sottotipo = payload.tipoSped; // "B2B" | "B2C" | "Sample"
  const ritiroDate = toAirtableDate(payload.ritiroData);

  const fieldsMain: Record<string, any> = {
    // Generali
    [F.Sorgente]: tipoSorgente,
    [F.Tipo]: sottotipo,
    ...(payload.formato ? { [F.Formato]: payload.formato } : {}),
    ...(payload.contenuto ? { [F.Contenuto]: payload.contenuto } : {}),
    ...(ritiroDate ? { [F.RitiroData]: ritiroDate } : {}),
    ...(payload.ritiroNote ? { [F.RitiroNote]: payload.ritiroNote } : {}),
    ...(payload.createdByEmail ? { [F.CreatoDaEmail]: payload.createdByEmail } : {}),

    // Mittente
    [F.M_RS]: payload.mittente.ragioneSociale || '',
    [F.M_REF]: payload.mittente.referente || '',
    [F.M_PAESE]: payload.mittente.paese || '',
    [F.M_CITTA]: payload.mittente.citta || '',
    [F.M_CAP]: payload.mittente.cap || '',
    [F.M_INDIRIZZO]: payload.mittente.indirizzo || '',
    [F.M_TEL]: payload.mittente.telefono || '',
    [F.M_PIVA]: payload.mittente.piva || '',

    // Destinatario
    [F.D_RS]: payload.destinatario.ragioneSociale || '',
    [F.D_REF]: payload.destinatario.referente || '',
    [F.D_PAESE]: payload.destinatario.paese || '',
    [F.D_CITTA]: payload.destinatario.citta || '',
    [F.D_CAP]: payload.destinatario.cap || '',
    [F.D_INDIRIZZO]: payload.destinatario.indirizzo || '',
    [F.D_TEL]: payload.destinatario.telefono || '',
    [F.D_PIVA]: payload.destinatario.piva || '',

    // Fatturazione
    [F.F_RS]: payload.fatturazione.ragioneSociale || '',
    [F.F_REF]: payload.fatturazione.referente || '',
    [F.F_PAESE]: payload.fatturazione.paese || '',
    [F.F_CITTA]: payload.fatturazione.citta || '',
    [F.F_CAP]: payload.fatturazione.cap || '',
    [F.F_INDIRIZZO]: payload.fatturazione.indirizzo || '',
    [F.F_TEL]: payload.fatturazione.telefono || '',
    [F.F_PIVA]: payload.fatturazione.piva || '',
    [F.F_SAME_DEST]: !!payload.fattSameAsDest,

    // Commerciali
    [F.Incoterm]: payload.incoterm,
    [F.Valuta]: payload.valuta,
    ...(payload.noteFatt ? { [F.NoteFatt]: payload.noteFatt } : {}),
    [F.F_Delega]: !!payload.fattDelega,
    ...(payload.fatturaFileName ? { [F.F_Att]: payload.fatturaFileName } : {}),
  };

  dlog('CREATE main', { table: T_SPED, fields: Object.keys(fieldsMain) });

  const main = await base(T_SPED).create([{ fields: fieldsMain }]);
  const rec = main[0];
  const spedId = rec.getId();

  dlog('CREATED', spedId);

  // --- Colli
  if (Array.isArray(payload.colli) && payload.colli.length > 0) {
    const batch: { fields: Record<string, any> }[] = payload.colli.map((c, idx) => ({
      fields: {
        [FCOLLO.LinkSped]: [spedId],
        [FCOLLO.L]: c.lunghezza_cm ?? null,
        [FCOLLO.W]: c.larghezza_cm ?? null,
        [FCOLLO.H]: c.altezza_cm ?? null,
        [FCOLLO.Peso]: c.peso_kg ?? null,
        // se in tabella hai un campo "#" di tipo "Number", lo popoliamo con l'indice 1-based
        ['#' as string]: idx + 1,
      },
    }));

    dlog('CREATE colli', batch.length);
    // Airtable accetta batch di max 10 record
    for (let i = 0; i < batch.length; i += 10) {
      await base(T_COLLI).create(batch.slice(i, i + 10));
    }
  }

  // --- Packing list (solo vino)
  if (tipoSorgente === 'Vino' && Array.isArray(payload.packingList) && payload.packingList.length > 0) {
    const batchPL: { fields: Record<string, any> }[] = payload.packingList.map((r) => ({
      fields: {
        [FPL.LinkSped]: [spedId],
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

    dlog('CREATE PL', batchPL.length);
    for (let i = 0; i < batchPL.length; i += 10) {
      await base(T_PL).create(batchPL.slice(i, i + 10));
    }
  }

  return { id: spedId };
}

/** ----------------------------------------------------------------
 *  LIST by email (usato dalla dashboard)
 *  ---------------------------------------------------------------- */
export async function listSpedizioniByEmail(email?: string | null) {
  const base = getBase();

  const opt: Airtable.SelectOptions<FieldSet> = {
    pageSize: 50,
    sort: [{ field: 'Created', direction: 'desc' } as any].filter(Boolean),
  };

  if (email) {
    // filtro su campo "Creato da" (single line text)
    opt.filterByFormula = `LOWER({${F.CreatoDaEmail}}) = '${String(email).toLowerCase()}'`;
  }

  dlog('LIST', { table: T_SPED, email: email || null });

  const page: Records<FieldSet> = await base(T_SPED).select(opt).all();
  return page.map((r) => ({ id: r.getId(), ...r.fields }));
}

/** Alias generico per retrocompatibilità di route diverse */
export async function listSpedizioni(arg?: { email?: string }) {
  return listSpedizioniByEmail(arg?.email);
}

/** ----------------------------------------------------------------
 *  UTENTI (per eventuale /api/check-user o /api/utenti)
 *  ---------------------------------------------------------------- */
export async function getUtenteByEmail(email: string) {
  const base = getBase();
  const formula = `LOWER({${USERS_EMAIL_FIELD}}) = '${String(email).toLowerCase()}'`;
  const recs = await base(T_UTENTI).select({ maxRecords: 1, filterByFormula: formula }).firstPage();
  const rec = recs[0];
  return rec ? { id: rec.getId(), fields: rec.fields } : null;
}

export async function upsertUtente(args: { email: string; fields: Record<string, any> }) {
  const base = getBase();
  const found = await getUtenteByEmail(args.email);
  if (found) {
    await base(T_UTENTI).update([{ id: found.id, fields: args.fields }]);
    return { id: found.id, ...args.fields };
  }
  const created = await base(T_UTENTI).create([{ fields: { [USERS_EMAIL_FIELD]: args.email, ...args.fields } }]);
  return { id: created[0].getId(), ...args.fields };
}
