// lib/airtable.ts
// ⚠️ NIENTE INIZIALIZZAZIONI A TOP-LEVEL CHE TOCCANO AIRTABLE
//     (così Next non rompe in “Collecting page data” durante il build)

import Airtable from 'airtable';
import { TABLE, F, FCOLLO, FPL } from './airtable.schema';

let __base: Airtable.Base | null = null;
function getBase(): Airtable.Base {
  if (__base) return __base;
  const key = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!key) throw new Error('AIRTABLE_API_KEY is missing');
  if (!baseId) throw new Error('AIRTABLE_BASE_ID is missing');
  __base = new Airtable({ apiKey: key }).base(baseId);
  return __base;
}

// --- TIPI (semplificati) ---------------------------------------------------
export type Party = {
  ragioneSociale?: string; referente?: string; paese?: string; citta?: string;
  cap?: string; indirizzo?: string; telefono?: string; piva?: string;
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
  // sorgente non la persistiamo: la deduci dalla pagina
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  contenuto?: string;
  formato?: 'Pacco' | 'Pallet';
  ritiroData?: string; // ISO
  ritiroNote?: string;
  mittente: Party;
  destinatario: Party;

  // fatturazione
  incoterm: 'DAP' | 'DDP' | 'EXW';
  valuta: 'EUR' | 'USD' | 'GBP';
  noteFatt?: string;
  fatturazione: Party;
  fattSameAsDest?: boolean;
  fattDelega?: boolean;
  fatturaFileName?: string | null;

  // vino
  destAbilitato?: boolean;
  packingList?: RigaPL[];

  // colli
  colli: Collo[];

  // meta
  createdByEmail?: string;
};

// --- HELPERS ---------------------------------------------------------------
function nonEmpty(s?: string | null) {
  return (s ?? '').trim() || undefined;
}
function bool(v?: boolean) {
  return !!v;
}
function mapParty(prefix: 'Mittente' | 'Destinatario' | 'FATT', p: Party) {
  const P = (k: string) => {
    if (prefix === 'Mittente') return (F as any)[`M_${k}`];
    if (prefix === 'Destinatario') return (F as any)[`D_${k}`];
    return (F as any)[`F_${k}`];
  };
  return {
    [P('RS')]: nonEmpty(p.ragioneSociale),
    [P('REF')]: nonEmpty(p.referente),
    [P('PAESE')]: nonEmpty(p.paese),
    [P('CITTA')]: nonEmpty(p.citta),
    [P('CAP')]: nonEmpty(p.cap),
    [P('INDIRIZZO')]: nonEmpty(p.indirizzo),
    [P('TEL')]: nonEmpty(p.telefono),
    [P('PIVA')]: nonEmpty(p.piva),
  };
}

// --- CREATE ---------------------------------------------------------------
export async function createSpedizioneWebApp(payload: SpedizionePayload) {
  const base = getBase();

  // record principale
  const fields: any = {
    [F.Tipo]: payload.tipoSped,
    [F.Formato]: payload.formato,
    [F.Contenuto]: nonEmpty(payload.contenuto),
    [F.RitiroData]: payload.ritiroData ? new Date(payload.ritiroData) : undefined,
    [F.RitiroNote]: nonEmpty(payload.ritiroNote),
    [F.CreatoDaEmail]: nonEmpty(payload.createdByEmail),

    ...mapParty('Mittente', payload.mittente),
    ...mapParty('Destinatario', payload.destinatario),

    [F.Incoterm]: payload.incoterm,
    [F.Valuta]: payload.valuta,
    [F.NoteFatt]: nonEmpty(payload.noteFatt),
    ...mapParty('FATT', payload.fatturazione),
    [F.F_SAME_DEST]: bool(payload.fattSameAsDest),
    [F.F_Delega]: bool(payload.fattDelega),
    [F.F_Att]: payload.fatturaFileName ? [{ url: `https://dummy.local/${payload.fatturaFileName}` }] : undefined,
  };

  // flag “destinatario abilitato import” se esiste in base (ignorato se non presente)
  if ((F as any).DestAbilitato) {
    fields[(F as any).DestAbilitato] = bool(payload.destAbilitato);
  }

  const rec = await base(TABLE.SPED).create([{ fields }]).then((r) => r[0]);

  // colli
  const colli = (payload.colli || []).filter(
    (c) => c.lunghezza_cm || c.larghezza_cm || c.altezza_cm || c.peso_kg
  );
  if (colli.length) {
    const rows = colli.map((c, i) => ({
      fields: {
        [FCOLLO.LinkSped]: [rec.id],
        '#': i + 1,
        [FCOLLO.L]: c.lunghezza_cm ?? undefined,
        [FCOLLO.W]: c.larghezza_cm ?? undefined,
        [FCOLLO.H]: c.altezza_cm ?? undefined,
        [FCOLLO.Peso]: c.peso_kg ?? undefined,
      },
    }));
    // batch in gruppi da 10
    for (let i = 0; i < rows.length; i += 10) {
      await base(TABLE.COLLI).create(rows.slice(i, i + 10));
    }
  }

  // packing list (vino)
  const pl = payload.packingList || [];
  if (pl.length) {
    const rows = pl.map((r) => ({
      fields: {
        [FPL.LinkSped]: [rec.id],
        [FPL.Etichetta]: nonEmpty(r.etichetta),
        [FPL.Bottiglie]: r.bottiglie,
        [FPL.FormatoL]: r.formato_litri,
        [FPL.Grad]: r.gradazione,
        [FPL.Prezzo]: r.prezzo,
        [FPL.Valuta]: r.valuta,
        [FPL.PesoNettoBott]: r.peso_netto_bott,
        [FPL.PesoLordoBott]: r.peso_lordo_bott,
      },
    }));
    for (let i = 0; i < rows.length; i += 10) {
      await base(TABLE.PL).create(rows.slice(i, i + 10));
    }
  }

  return { id: rec.id };
}

// --- LIST (usata da /api/spedizioni/GET) -----------------------------------
export async function listSpedizioni(opts?: { email?: string }) {
  const base = getBase();
  const filter = opts?.email
    ? `FIND("${opts.email}", {${F.CreatoDaEmail}})`
    : '';
  const res = await base(TABLE.SPED)
    .select({ filterByFormula: filter || undefined, pageSize: 50 })
    .all();
  return res.map((r) => ({ id: r.id, ...r.fields }));
}
export async function listSpedizioniByEmail(email?: string) {
  return listSpedizioni({ email });
}
