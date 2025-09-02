// lib/airtable.ts
import Airtable from 'airtable';
import { TABLE, F, FCOLLO, FPL } from './airtable.schema';

// ---------- ENV SAFE HELPERS (no top-level failures) ----------
function requireAirtableEnv() {
  const apiKey =
    process.env.AIRTABLE_API_KEY ||
    process.env.AIRTABLE_API_TOKEN || // <-- supporto al tuo nome variabile
    '';

  const baseId = process.env.AIRTABLE_BASE_ID || '';

  const missing: string[] = [];
  if (!apiKey) missing.push('AIRTABLE_API_KEY or AIRTABLE_API_TOKEN');
  if (!baseId) missing.push('AIRTABLE_BASE_ID');

  if (missing.length) {
    const vercelEnv = process.env.VERCEL_ENV || 'unknown';
    const onVercel = process.env.VERCEL ? 'yes' : 'no';
    throw new Error(
      `AIRTABLE_ENV_MISSING: ${missing.join(', ')} (VERCEL_ENV=${vercelEnv}, ON_VERCEL=${onVercel})`
    );
  }

  // identifica quale chiave stiamo usando (solo per debug)
  const keySource = process.env.AIRTABLE_API_KEY
    ? 'AIRTABLE_API_KEY'
    : process.env.AIRTABLE_API_TOKEN
    ? 'AIRTABLE_API_TOKEN'
    : 'unknown';

  return { apiKey, baseId, keySource };
}

let __base: Airtable.Base | null = null;
function getBase(): Airtable.Base {
  if (__base) return __base;
  const { apiKey, baseId } = requireAirtableEnv();
  __base = new Airtable({ apiKey }).base(baseId);
  return __base!;
}

// ---------- Tipi ----------
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
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  contenuto?: string;
  formato?: 'Pacco' | 'Pallet';
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
  destAbilitato?: boolean;
  packingList?: RigaPL[];
  colli: Collo[];
  createdByEmail?: string;
};

// ---------- Utils ----------
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

// ---------- CREATE ----------
export async function createSpedizioneWebApp(payload: SpedizionePayload) {
  const base = getBase();

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

  if ((F as any).DestAbilitato) {
    fields[(F as any).DestAbilitato] = bool(payload.destAbilitato);
  }

  const rec = await base(TABLE.SPED).create([{ fields }]).then(r => r[0]);

  const colli = (payload.colli || []).filter(
    c => c.lunghezza_cm || c.larghezza_cm || c.altezza_cm || c.peso_kg
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
    for (let i = 0; i < rows.length; i += 10) {
      await base(TABLE.COLLI).create(rows.slice(i, i + 10));
    }
  }

  const pl = payload.packingList || [];
  if (pl.length) {
    const rows = pl.map(r => ({
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

// ---------- LIST ----------
export async function listSpedizioni(opts?: { email?: string }) {
  const base = getBase();
  const filter = opts?.email ? `FIND("${opts.email}", {${F.CreatoDaEmail}})` : '';
  const res = await base(TABLE.SPED)
    .select({ filterByFormula: filter || undefined, pageSize: 50 })
    .all();
  return res.map(r => ({ id: r.id, ...r.fields }));
}
export async function listSpedizioniByEmail(email?: string) {
  return listSpedizioni({ email });
}

// ---------- HEALTH ----------
export function airtableEnvStatus() {
  const using =
    process.env.AIRTABLE_API_KEY ? 'AIRTABLE_API_KEY'
    : process.env.AIRTABLE_API_TOKEN ? 'AIRTABLE_API_TOKEN'
    : 'none';
  return {
    hasKey: !!process.env.AIRTABLE_API_KEY,
    hasToken: !!process.env.AIRTABLE_API_TOKEN,
    hasBaseId: !!process.env.AIRTABLE_BASE_ID,
    using,
    vercelEnv: process.env.VERCEL_ENV || 'unknown',
  };
}
