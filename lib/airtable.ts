// lib/airtable.ts
import Airtable from 'airtable';
import { TABLE, F, FCOLLO, FPL } from './airtable.schema';

const AIRTABLE_TOKEN =
  process.env.AIRTABLE_API_TOKEN || process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
  // Non tiriamo errore a import-time: i route API possono gestirlo in TRY/CATCH
  // ma lasciamo una traccia in console
  // eslint-disable-next-line no-console
  console.warn(
    '[Airtable] Missing envs:',
    { AIRTABLE_TOKEN: !!AIRTABLE_TOKEN, AIRTABLE_BASE_ID: !!AIRTABLE_BASE_ID }
  );
}

const base = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID);

export type Party = {
  ragioneSociale?: string;
  referente?: string;
  paese?: string;
  citta?: string;
  cap?: string;
  indirizzo?: string;
  telefono?: string;
  piva?: string;
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
  valuta: string;
  peso_netto_bott: number;
  peso_lordo_bott: number;
};

export type SpedizionePayload = {
  sorgente: 'vino' | 'altro';
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  contenuto?: string;
  formato?: 'Pacco' | 'Pallet';
  ritiroData?: string; // ISO
  ritiroNote?: string;
  mittente: Party;
  destinatario: Party;
  incoterm?: 'DAP' | 'DDP' | 'EXW';
  valuta?: 'EUR' | 'USD' | 'GBP';
  noteFatt?: string;
  fatturazione?: Party;
  fattSameAsDest?: boolean;
  fattDelega?: boolean;
  fatturaFileName?: string | null;
  destAbilitato?: boolean;
  colli: Collo[];
  packingList?: RigaPL[];
  createdByEmail?: string;    // DEPREC
  createdBy?: string;         // DEPREC
  createdByUser?: string;     // DEPREC
  createdByEmailOverride?: string;
  createdByEmail?: string | undefined; // usato nel route.ts
  createdByEmailResolved?: string;     // normalizzato
  createdBy?: string | undefined;
  createdByDisplay?: string | undefined;
  createdByRaw?: any;
  createdById?: string | undefined;
};

function toDateOnly(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  // Airtable Date (senza orario): 'YYYY-MM-DD'
  return d.toISOString().slice(0, 10);
}

function genCustomId(): string {
  const n = Math.floor(Math.random() * 10000); // 0..9999
  const pad = String(n).padStart(4, '0');
  // prefisso con data per leggibilità
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `SP-${ymd}-${pad}`;
}

export async function airtableEnvStatus() {
  return {
    hasToken: !!AIRTABLE_TOKEN,
    hasBaseId: !!AIRTABLE_BASE_ID,
    tables: {
      SPEDIZIONI_WEBAPP: !!TABLE.SPED,
      SPED_COLLI: !!TABLE.COLLI,
      SPED_PL: !!TABLE.PL,
    },
  };
}

export async function createSpedizioneWebApp(payload: SpedizionePayload) {
  if (!AIRTABLE_TOKEN) throw new Error('AIRTABLE_API_TOKEN is missing');
  if (!AIRTABLE_BASE_ID) throw new Error('AIRTABLE_BASE_ID is missing');

  // Normalizza createdByEmail
  const createdByEmail =
    payload.createdByEmail ||
    payload.createdByEmailOverride ||
    payload.createdBy ||
    undefined;

  // Prepara campi tabella principale
  const fields: Record<string, any> = {};

  // Tipo principale (Vino/Altro)
  if (F.Sorgente) {
    fields[F.Sorgente] = payload.sorgente === 'vino' ? 'Vino' : 'Altro';
  }

  // Sottotipo (B2B/B2C/Sample)
  if (F.Tipo && payload.tipoSped) {
    fields[F.Tipo] = payload.tipoSped;
  }

  // Formato (se tenuto in principale)
  if (F.Formato && payload.formato) {
    fields[F.Formato] = payload.formato;
  }

  // Contenuto
  if (F.Contenuto && payload.contenuto) {
    fields[F.Contenuto] = payload.contenuto;
  }

  // Ritiro
  if (F.RitiroData) fields[F.RitiroData] = toDateOnly(payload.ritiroData);
  if (F.RitiroNote && payload.ritiroNote) fields[F.RitiroNote] = payload.ritiroNote;

  // Creato da (email)
  if (F.CreatoDaEmail && createdByEmail) fields[F.CreatoDaEmail] = createdByEmail;

  // Mittente
  if (payload.mittente) {
    fields[F.M_RS] = payload.mittente.ragioneSociale || '';
    fields[F.M_REF] = payload.mittente.referente || '';
    fields[F.M_PAESE] = payload.mittente.paese || '';
    fields[F.M_CITTA] = payload.mittente.citta || '';
    fields[F.M_CAP] = payload.mittente.cap || '';
    fields[F.M_INDIRIZZO] = payload.mittente.indirizzo || '';
    fields[F.M_TEL] = payload.mittente.telefono || '';
    fields[F.M_PIVA] = payload.mittente.piva || '';
  }

  // Destinatario
  if (payload.destinatario) {
    fields[F.D_RS] = payload.destinatario.ragioneSociale || '';
    fields[F.D_REF] = payload.destinatario.referente || '';
    fields[F.D_PAESE] = payload.destinatario.paese || '';
    fields[F.D_CITTA] = payload.destinatario.citta || '';
    fields[F.D_CAP] = payload.destinatario.cap || '';
    fields[F.D_INDIRIZZO] = payload.destinatario.indirizzo || '';
    fields[F.D_TEL] = payload.destinatario.telefono || '';
    fields[F.D_PIVA] = payload.destinatario.piva || '';
  }

  // Destinatario abilitato import (checkbox)
  if (typeof payload.destAbilitato === 'boolean' && F.D_Abilitato) {
    fields[F.D_Abilitato] = payload.destAbilitato;
  }

  // Fatturazione
  const fatt = payload.fattSameAsDest ? payload.destinatario : payload.fatturazione;
  if (fatt) {
    fields[F.F_RS] = fatt.ragioneSociale || '';
    fields[F.F_REF] = fatt.referente || '';
    fields[F.F_PAESE] = fatt.paese || '';
    fields[F.F_CITTA] = fatt.citta || '';
    fields[F.F_CAP] = fatt.cap || '';
    fields[F.F_INDIRIZZO] = fatt.indirizzo || '';
    fields[F.F_TEL] = fatt.telefono || '';
    fields[F.F_PIVA] = fatt.piva || '';
  }
  if (F.F_SAME_DEST && typeof payload.fattSameAsDest === 'boolean') {
    fields[F.F_SAME_DEST] = payload.fattSameAsDest;
  }

  if (F.Incoterm && payload.incoterm) fields[F.Incoterm] = payload.incoterm;
  if (F.Valuta && payload.valuta) fields[F.Valuta] = payload.valuta;
  if (F.NoteFatt && payload.noteFatt) fields[F.NoteFatt] = payload.noteFatt;

  // Delega fattura: valorizza entrambi i campi, se esistono
  if (typeof payload.fattDelega === 'boolean') {
    if (F.F_Delega) fields[F.F_Delega] = payload.fattDelega;
    if (F.F_DelegaAlt) fields[F.F_DelegaAlt] = payload.fattDelega;
  }

  if (process.env.DEBUG_AIRTABLE === '1') {
    // eslint-disable-next-line no-console
    console.log('[Airtable] Fields (main) ->', fields);
  }

  // 1) Crea record principale
  const main = await base(TABLE.SPED).create([{ fields }]);
  const recId = main[0].id;

  // 1b) Aggiorna ID Spedizione (campo di testo, NON il campo formula "ID")
  try {
    if (F.ID_Spedizione) {
      await base(TABLE.SPED).update([{ id: recId, fields: { [F.ID_Spedizione]: genCustomId() } }]);
    }
  } catch (e: any) {
    if (process.env.DEBUG_AIRTABLE === '1') {
      // eslint-disable-next-line no-console
      console.error('[Airtable] Cannot update custom ID field', e?.message);
    }
  }

  // 2) Inserisci COLLI
  if (Array.isArray(payload.colli) && payload.colli.length > 0) {
    const batches: any[] = [];
    payload.colli.forEach((c, i) => {
      batches.push({
        fields: {
          [FCOLLO.LinkSped]: [recId],
          [FCOLLO.Numero]: i + 1,
          [FCOLLO.L]: c.lunghezza_cm ?? null,
          [FCOLLO.W]: c.larghezza_cm ?? null,
          [FCOLLO.H]: c.altezza_cm ?? null,
          [FCOLLO.Peso]: c.peso_kg ?? null,
        },
      });
    });

    // Airtable max 10 per batch
    for (let i = 0; i < batches.length; i += 10) {
      const slice = batches.slice(i, i + 10);
      await base(TABLE.COLLI).create(slice);
    }
  }

  // 3) Inserisci PACKING LIST (solo per Vino)
  if (payload.sorgente === 'vino' && Array.isArray(payload.packingList) && payload.packingList.length > 0) {
    const plRows: any[] = payload.packingList.map((r) => ({
      fields: {
        [FPL.LinkSped]: [recId],
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

    for (let i = 0; i < plRows.length; i += 10) {
      const slice = plRows.slice(i, i + 10);
      await base(TABLE.PL).create(slice);
    }
  }

  return { id: recId };
}

// Utility: lista spedizioni per email (se serve nel client)
export async function listSpedizioniByEmail(email?: string) {
  if (!AIRTABLE_TOKEN) throw new Error('AIRTABLE_API_TOKEN is missing');
  if (!AIRTABLE_BASE_ID) throw new Error('AIRTABLE_BASE_ID is missing');

  const filter = email
    ? `FIND("${email}", {${F.CreatoDaEmail}})`
    : '';

  const records = await base(TABLE.SPED)
    .select({
      view: 'Grid view',
      filterByFormula: filter || undefined,
      pageSize: 50,
    })
    .all();

  return records.map((r) => ({ id: r.id, ...r.fields }));
}
