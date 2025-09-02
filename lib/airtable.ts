// lib/airtable.ts
import Airtable from 'airtable';
import { TABLE, F, FCOLLO, FPL } from './airtable.schema';

// ----------- Setup client ---------------------------------------------------
const apiKey = process.env.AIRTABLE_API_KEY!;
const baseId = process.env.AIRTABLE_BASE_ID!;
const base = new Airtable({ apiKey }).base(baseId);

// Abilita log verbose via env: AIRTABLE_DEBUG=true
const DEBUG = process.env.AIRTABLE_DEBUG === 'true';
const log = (...args: any[]) => { if (DEBUG) console.log('[AT]', ...args); };

// ----------- Tipi payload ---------------------------------------------------
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
  // sorgente e selezioni
  sorgente: 'vino' | 'altro';
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  formato: 'Pacco' | 'Pallet';

  // info generali
  contenuto?: string;
  ritiroData?: string;             // ISO string
  ritiroNote?: string;

  // parti
  mittente: Party;
  destinatario: Party;

  // fattura
  incoterm: 'DAP' | 'DDP' | 'EXW';
  valuta: 'EUR' | 'USD' | 'GBP';
  noteFatt?: string;
  fatturazione: Party;
  fattSameAsDest: boolean;
  fattDelega: boolean;

  // altri flag
  destAbilitato?: boolean;

  // allegati (solo nome client-side — l’upload arriverà dopo)
  fatturaFileName?: string | null;

  // colli e PL
  colli: Collo[];
  packingList?: RigaPL[];

  // impostato server-side dal route (email dell’utente)
  createdByEmail?: string;
};

// ----------- Helpers --------------------------------------------------------
function dateOnly(iso?: string) {
  if (!iso) return undefined;
  // Airtable (campo "Date" senza time) accetta "YYYY-MM-DD"
  return new Date(iso).toISOString().slice(0, 10);
}

function defined<T extends object>(obj: T) {
  const out: any = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  });
  return out;
}

function idUmano() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rnd = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `SP-${y}${m}${day}-${rnd}`;
}

// ----------- Create ---------------------------------------------------------
export async function createSpedizioneWebApp(payload: SpedizionePayload): Promise<{ id: string; airtableId: string; }> {
  log('createSpedizioneWebApp: payload', JSON.stringify(payload, null, 2));

  const idSped = idUmano();

  const fieldsMain = defined({
    // selezioni
    [F.Sorgente]: payload.sorgente === 'vino' ? 'Vino' : 'Altro',
    [F.Tipo]: payload.tipoSped,
    [F.Formato]: payload.formato,

    // generali
    [F.Contenuto]: payload.contenuto,
    [F.RitiroData]: dateOnly(payload.ritiroData),
    [F.RitiroNote]: payload.ritiroNote,
    [F.CreatoDaEmail]: payload.createdByEmail,
    [F.DestAbilitato]: !!payload.destAbilitato,

    // ID umano
    [F.IdSpedizione]: idSped,

    // mittente
    [F.M_RS]: payload.mittente.ragioneSociale,
    [F.M_REF]: payload.mittente.referente,
    [F.M_PAESE]: payload.mittente.paese,
    [F.M_CITTA]: payload.mittente.citta,
    [F.M_CAP]: payload.mittente.cap,
    [F.M_INDIRIZZO]: payload.mittente.indirizzo,
    [F.M_TEL]: payload.mittente.telefono,
    [F.M_PIVA]: payload.mittente.piva,

    // destinatario
    [F.D_RS]: payload.destinatario.ragioneSociale,
    [F.D_REF]: payload.destinatario.referente,
    [F.D_PAESE]: payload.destinatario.paese,
    [F.D_CITTA]: payload.destinatario.citta,
    [F.D_CAP]: payload.destinatario.cap,
    [F.D_INDIRIZZO]: payload.destinatario.indirizzo,
    [F.D_TEL]: payload.destinatario.telefono,
    [F.D_PIVA]: payload.destinatario.piva,

    // fatturazione
    [F.F_RS]: payload.fatturazione.ragioneSociale,
    [F.F_REF]: payload.fatturazione.referente,
    [F.F_PAESE]: payload.fatturazione.paese,
    [F.F_CITTA]: payload.fatturazione.citta,
    [F.F_CAP]: payload.fatturazione.cap,
    [F.F_INDIRIZZO]: payload.fatturazione.indirizzo,
    [F.F_TEL]: payload.fatturazione.telefono,
    [F.F_PIVA]: payload.fatturazione.piva,
    [F.F_SAME_DEST]: !!payload.fattSameAsDest,
    [F.Incoterm]: payload.incoterm,
    [F.Valuta]: payload.valuta,
    [F.NoteFatt]: payload.noteFatt,
    [F.F_Delega]: !!payload.fattDelega,
    // [F.F_Att]:  // upload allegati — arriverà in una fase successiva
  });

  log('MAIN.fields', fieldsMain);

  // 1) crea record principale
  const main = await base(TABLE.SPED).create([{ fields: fieldsMain }]);
  const mainId = main[0].getId();
  log('MAIN.created', mainId);

  // 2) crea colli (con enumerazione #)
  if (payload.colli?.length) {
    const rows = payload.colli.map((c, idx) =>
      defined({
        [FCOLLO.LinkSped]: [mainId],
        [FCOLLO.N]: idx + 1,
        [FCOLLO.L]: c.lunghezza_cm ?? undefined,
        [FCOLLO.W]: c.larghezza_cm ?? undefined,
        [FCOLLO.H]: c.altezza_cm ?? undefined,
        [FCOLLO.Peso]: c.peso_kg ?? undefined,
      })
    );

    // batch in chunk da 10 (limite Airtable)
    const chunkSize = 10;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const slice = rows.slice(i, i + chunkSize);
      log(`COLLI.create batch ${i}-${i + slice.length - 1}`);
      await base(TABLE.COLLI).create(slice.map((fields) => ({ fields })));
    }
  }

  // 3) se “vino”, crea PL
  if (payload.sorgente === 'vino' && payload.packingList?.length) {
    const rows = payload.packingList.map((r) =>
      defined({
        [FPL.LinkSped]: [mainId],
        [FPL.Etichetta]: r.etichetta,
        [FPL.Bottiglie]: r.bottiglie,
        [FPL.FormatoL]: r.formato_litri,
        [FPL.Grad]: r.gradazione,
        [FPL.Prezzo]: r.prezzo,
        [FPL.Valuta]: r.valuta,
        [FPL.PesoNettoBott]: r.peso_netto_bott,
        [FPL.PesoLordoBott]: r.peso_lordo_bott,
      })
    );

    const chunkSize = 10;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const slice = rows.slice(i, i + chunkSize);
      log(`PL.create batch ${i}-${i + slice.length - 1}`);
      await base(TABLE.PL).create(slice.map((fields) => ({ fields })));
    }
  }

  return { id: idSped, airtableId: mainId };
}
