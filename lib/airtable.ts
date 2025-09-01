// lib/airtable.ts
import Airtable from 'airtable';

const {
  AIRTABLE_API_TOKEN,
  AIRTABLE_BASE_ID_SPST,
  AIRTABLE_TABLE_SPEDIZIONI_WEBAPP,
  AIRTABLE_TABLE_SPED_COLLI,
  AIRTABLE_TABLE_SPED_PL,
} = process.env;

if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID_SPST) {
  throw new Error('Airtable env missing: AIRTABLE_API_TOKEN or AIRTABLE_BASE_ID_SPST');
}
if (!AIRTABLE_TABLE_SPEDIZIONI_WEBAPP || !AIRTABLE_TABLE_SPED_COLLI || !AIRTABLE_TABLE_SPED_PL) {
  throw new Error('Airtable env missing: AIRTABLE_TABLE_SPEDIZIONI_WEBAPP / _SPED_COLLI / _SPED_PL');
}

const base = new Airtable({ apiKey: AIRTABLE_API_TOKEN }).base(AIRTABLE_BASE_ID_SPST);

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
  destAbilitato?: boolean; // solo vino
  contenuto: string;
  formato: 'Pacco' | 'Pallet';
  ritiroData?: string; // ISO date (yyyy-mm-dd) o datetime
  ritiroNote?: string;

  mittente: Party;
  destinatario: Party;

  incoterm: 'DAP' | 'DDP' | 'EXW';
  valuta: 'EUR' | 'USD' | 'GBP';
  noteFatt?: string;

  fatturazione: Party;
  fattSameAsDest: boolean;
  fattDelega: boolean;
  fatturaFileName?: string | null;

  colli: Collo[];

  packingList?: RigaPL[]; // solo per vino
  createdByEmail?: string; // server-side fill
};

function nonEmpty(v?: string | null) {
  return v && v.trim().length > 0 ? v : undefined;
}

function toAirtableDate(d?: string) {
  // Se arriva ISO completa, Airtable accetta anche 'YYYY-MM-DD' o ISO string
  return d ? d : undefined;
}

export async function createSpedizioneWebApp(payload: SpedizionePayload) {
  // 1) CREA RECORD MASTER
  const fields: Record<string, any> = {
    // meta
    'Sorgente': payload.sorgente === 'vino' ? 'Vino' : 'Altro',
    'Stato': 'Nuova',
    'Creato da (email)': nonEmpty(payload.createdByEmail),
    'Creato il': new Date().toISOString(),

    // tipologia & contenuto
    'Tipo Spedizione': payload.tipoSped,
    'Formato': payload.formato,
    'Contenuto': nonEmpty(payload.contenuto),
    'Data Ritiro': toAirtableDate(payload.ritiroData),
    'Note Ritiro': nonEmpty(payload.ritiroNote),

    // vino only
    'Destinatario abilitato import': payload.sorgente === 'vino' ? !!payload.destAbilitato : undefined,

    // mittente
    'MITT Ragione sociale': nonEmpty(payload.mittente.ragioneSociale),
    'MITT Referente': nonEmpty(payload.mittente.referente),
    'MITT Paese': nonEmpty(payload.mittente.paese),
    'MITT Città': nonEmpty(payload.mittente.citta),
    'MITT CAP': nonEmpty(payload.mittente.cap),
    'MITT Indirizzo': nonEmpty(payload.mittente.indirizzo),
    'MITT Telefono': nonEmpty(payload.mittente.telefono),
    'MITT PIVA/CF': nonEmpty(payload.mittente.piva),

    // destinatario
    'DEST Ragione sociale': nonEmpty(payload.destinatario.ragioneSociale),
    'DEST Referente': nonEmpty(payload.destinatario.referente),
    'DEST Paese': nonEmpty(payload.destinatario.paese),
    'DEST Città': nonEmpty(payload.destinatario.citta),
    'DEST CAP': nonEmpty(payload.destinatario.cap),
    'DEST Indirizzo': nonEmpty(payload.destinatario.indirizzo),
    'DEST Telefono': nonEmpty(payload.destinatario.telefono),
    'DEST PIVA/CF': nonEmpty(payload.destinatario.piva),

    // fatturazione
    'FATT Ragione sociale': nonEmpty(payload.fatturazione.ragioneSociale),
    'FATT Referente': nonEmpty(payload.fatturazione.referente),
    'FATT Paese': nonEmpty(payload.fatturazione.paese),
    'FATT Città': nonEmpty(payload.fatturazione.citta),
    'FATT CAP': nonEmpty(payload.fatturazione.cap),
    'FATT Indirizzo': nonEmpty(payload.fatturazione.indirizzo),
    'FATT Telefono': nonEmpty(payload.fatturazione.telefono),
    'FATT PIVA/CF': nonEmpty(payload.fatturazione.piva),
    'FATT Uguale a Destinatario': !!payload.fattSameAsDest,
    'Fattura – Delega a SPST': !!payload.fattDelega,
    // allegati: da popolare in step successivo (URL)
    // 'Fattura – Allegato': [{ url: '...' }],

    // commerciali
    'Incoterm': payload.incoterm,
    'Valuta': payload.valuta,
    'Note Fattura': nonEmpty(payload.noteFatt),
  };

  const master = await base(AIRTABLE_TABLE_SPEDIZIONI_WEBAPP!).create([{ fields }], { typecast: true });
  const masterId = master[0].id;

  // 2) COLLI (link a master)
  if (payload.colli?.length) {
    const chunks = chunk(payload.colli, 10);
    for (const c of chunks) {
      await base(AIRTABLE_TABLE_SPED_COLLI!).create(
        c.map((collo) => ({
          fields: {
            'Spedizione': [masterId],
            'Lunghezza (cm)': safeNum(collo.lunghezza_cm),
            'Larghezza (cm)': safeNum(collo.larghezza_cm),
            'Altezza (cm)': safeNum(collo.altezza_cm),
            'Peso (kg)': safeNum(collo.peso_kg),
          },
        })),
        { typecast: true },
      );
    }
  }

  // 3) PACKING LIST (solo vino)
  if (payload.sorgente === 'vino' && payload.packingList?.length) {
    const chunks = chunk(payload.packingList, 10);
    for (const ch of chunks) {
      await base(AIRTABLE_TABLE_SPED_PL!).create(
        ch.map((r) => ({
          fields: {
            'Spedizione': [masterId],
            'Etichetta': nonEmpty(r.etichetta),
            'Bottiglie': r.bottiglie,
            'Formato (L)': r.formato_litri,
            'Gradazione (%)': r.gradazione,
            'Prezzo': r.prezzo,
            'Valuta': r.valuta,
            'Peso netto bott (kg)': r.peso_netto_bott,
            'Peso lordo bott (kg)': r.peso_lordo_bott,
          },
        })),
        { typecast: true },
      );
    }
  }

  return { id: masterId };
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function safeNum(n: number | null | undefined) {
  return typeof n === 'number' ? n : undefined;
}
