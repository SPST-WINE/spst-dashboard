// lib/airtable.ts
// Server-only helpers per Airtable (Node runtime)

import Airtable from 'airtable';
import { TABLE, F, FCOLLO, FPL } from './airtable.schema';

// -------------------------------------------------------------
// Tipi base (coerenti con i componenti del form)
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// Payload creazione spedizione
// -------------------------------------------------------------
export interface SpedizionePayload {
  sorgente: 'vino' | 'altro';
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  destAbilitato?: boolean;

  contenuto?: string;
  formato: 'Pacco' | 'Pallet';

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

  // opzionale: se non arriva, la POST /api valorizza da idToken
  createdByEmail?: string;
}

// -------------------------------------------------------------
// ENV & init client
// -------------------------------------------------------------
const API_TOKEN =
  process.env.AIRTABLE_API_TOKEN || process.env.AIRTABLE_API_KEY || '';
const BASE_ID = process.env.AIRTABLE_BASE_ID_SPST || '';

function assertEnv() {
  if (!API_TOKEN) throw new Error('AIRTABLE_API_TOKEN (o AIRTABLE_API_KEY) mancante');
  if (!BASE_ID) throw new Error('AIRTABLE_BASE_ID mancante');
}

function base() {
  assertEnv();
  Airtable.configure({ apiKey: API_TOKEN });
  return new Airtable().base(BASE_ID);
}

// -------------------------------------------------------------
// Health: stato variabili / tabelle
// -------------------------------------------------------------
export async function airtableEnvStatus(): Promise<{
  hasToken: boolean;
  hasBaseId: boolean;
  tables: {
    SPEDIZIONI_WEBAPP: boolean;
    SPED_COLLI: boolean;
    SPED_PL: boolean;
  };
}> {
  return {
    hasToken: !!API_TOKEN,
    hasBaseId: !!BASE_ID,
    tables: {
      SPEDIZIONI_WEBAPP: !!TABLE.SPED,
      SPED_COLLI: !!TABLE.COLLI,
      SPED_PL: !!TABLE.PL,
    },
  };
}

// -------------------------------------------------------------
// Utils
// -------------------------------------------------------------
function optional<T>(value: T | undefined | null) {
  return value === undefined || value === null ? undefined : value;
}

// sostituisci la tua formatDateISO con questa
function formatAirtableDateOnly(d?: string) {
  if (!d) return undefined;
  try {
    // toISOString è sempre UTC -> prendiamo solo AAAA-MM-GG
    return new Date(d).toISOString().slice(0, 10); // es. "2025-09-02"
  } catch {
    return undefined;
  }
}


function buildIdCustom() {
  const n = Math.floor(Math.random() * 10000);
  const padded = String(n).padStart(4, '0');
  return `SP-${new Date().toISOString().slice(0, 10)}-${padded}`;
}

// -------------------------------------------------------------
// CREATE
// -------------------------------------------------------------
export async function createSpedizioneWebApp(
  payload: SpedizionePayload
): Promise<{ id: string; idSpedizione: string }> {
  const b = base();

  const fields: Record<string, any> = {};

  // Generali (⚠️ NON scrivo Sorgente qui; lo faccio post-create in modo tollerante)
  // fields[F.Sorgente] = payload.sorgente === 'vino' ? 'Vino' : 'Altro';
  fields[F.Stato] = 'Nuova';  
  if (F.Formato) fields[F.Formato] = payload.formato;
  if (payload.contenuto) fields[F.Contenuto] = payload.contenuto;
  if (payload.ritiroNote) fields[F.RitiroNote] = payload.ritiroNote;
  const dt = formatAirtableDateOnly(payload.ritiroData);
  if (dt) fields[F.RitiroData] = dt;
  fields[F.Incoterm] = payload.incoterm;
  fields[F.Valuta] = payload.valuta;
  if (payload.noteFatt) fields[F.NoteFatt] = payload.noteFatt;

  if (payload.createdByEmail) fields[F.CreatoDaEmail] = payload.createdByEmail;

  // Mittente
  fields[F.M_RS] = optional(payload.mittente.ragioneSociale);
  fields[F.M_REF] = optional(payload.mittente.referente);
  fields[F.M_PAESE] = optional(payload.mittente.paese);
  fields[F.M_CITTA] = optional(payload.mittente.citta);
  fields[F.M_CAP] = optional(payload.mittente.cap);
  fields[F.M_INDIRIZZO] = optional(payload.mittente.indirizzo);
  fields[F.M_TEL] = optional(payload.mittente.telefono);
  fields[F.M_PIVA] = optional(payload.mittente.piva);

  // Destinatario
  fields[F.D_RS] = optional(payload.destinatario.ragioneSociale);
  fields[F.D_REF] = optional(payload.destinatario.referente);
  fields[F.D_PAESE] = optional(payload.destinatario.paese);
  fields[F.D_CITTA] = optional(payload.destinatario.citta);
  fields[F.D_CAP] = optional(payload.destinatario.cap);
  fields[F.D_INDIRIZZO] = optional(payload.destinatario.indirizzo);
  fields[F.D_TEL] = optional(payload.destinatario.telefono);
  fields[F.D_PIVA] = optional(payload.destinatario.piva);

  // Fatturazione
  fields[F.F_RS] = optional(payload.fatturazione.ragioneSociale);
  fields[F.F_REF] = optional(payload.fatturazione.referente);
  fields[F.F_PAESE] = optional(payload.fatturazione.paese);
  fields[F.F_CITTA] = optional(payload.fatturazione.citta);
  fields[F.F_CAP] = optional(payload.fatturazione.cap);
  fields[F.F_INDIRIZZO] = optional(payload.fatturazione.indirizzo);
  fields[F.F_TEL] = optional(payload.fatturazione.telefono);
  fields[F.F_PIVA] = optional(payload.fatturazione.piva);
  if (typeof payload.fattSameAsDest === 'boolean') fields[F.F_SAME_DEST] = payload.fattSameAsDest;
  if (typeof payload.fattDelega === 'boolean') fields[F.F_Delega] = payload.fattDelega;

  // 1) Crea record principale
  const created = await b(TABLE.SPED).create([{ fields }]);
  const recId = created[0].id;

  // Helper per update tolleranti
  async function tryUpdateField(fieldName: string, value: any) {
    try { await b(TABLE.SPED).update(recId, { [fieldName]: value }); return true; }
    catch { return false; }
  }

  // 1a) Sorgente / "Tipo (Vino, Altro)" — post-create, nomi alternativi
  {
    const sorgenteVal = payload.sorgente === 'vino' ? 'Vino' : 'Altro';
    const candidates = [
      'Tipo (Vino, Altro)',
      'Tipo (Vino Altro)',
      'Tipo (Vino/Altro)',
      'Tipo',
      'Sorgente',
    ];
    for (const name of candidates) {
      const ok = await tryUpdateField(name, sorgenteVal);
      if (ok) break;
    }
  }

  // Sottotipo (B2B, B2C, Sample) — update tollerante post-create
{
  const sottotipoVal = payload.tipoSped; // 'B2B' | 'B2C' | 'Sample'
  const candidates = [
    'Sottotipo',                        // ✅ nome reale nel tuo base
    'Tipo spedizione',
    'Sottotipo (B2B, B2C, Sample)',
    'Tipo',                             // eventuali vecchi alias
  ];
  for (const name of candidates) {
    const ok = await tryUpdateField(name, sottotipoVal);
    if (ok) break;
  }
}


  // 1b) Destinatario abilitato import — post-create
  if (typeof payload.destAbilitato === 'boolean') {
    const candidates = [
      'Destinatario abilitato import',
      "Destinatario abilitato all’import",
      "Destinatario abilitato all'import",
    ];
    for (const name of candidates) {
      const ok = await tryUpdateField(name, payload.destAbilitato);
      if (ok) break;
    }
  }

  // 1c) Delega Fattura — post-create, nomi alternativi
  if (typeof payload.fattDelega === 'boolean') {
    const candidates = [
      'Fattura – Delega a SPST',
      'Fattura - Delega a SPST',
      'Delega Fattura',
    ];
    for (const name of candidates) {
      const ok = await tryUpdateField(name, payload.fattDelega);
      if (ok) break;
    }
  }

  // 1d) Nome file fattura (campo TESTUALE, se presente)
  if (payload.fatturaFileName) {
    const candidates = [
      'Fattura – Allegato Cliente',
      'Fattura - Allegato Cliente',
      'Nome file fattura',
      'Allegato Fattura (nome)',
    ];
    for (const name of candidates) {
      const ok = await tryUpdateField(name, payload.fatturaFileName);
      if (ok) break;
    }
  }

  // 1e) ID Spedizione custom (se esiste un campo testuale)
  const idCustom = buildIdCustom();
  {
    const idCandidates = ['ID Spedizione', 'ID Spedizione (custom)', 'ID SPST'];
    for (const name of idCandidates) {
      const ok = await tryUpdateField(name, idCustom);
      if (ok) break;
    }
  }


  // 2) COLLI
if (payload.colli?.length) {
  const tot = payload.colli.length;

  const rows = payload.colli.map((c) => ({
    fields: {
      [FCOLLO.LinkSped]: [recId],
      [FCOLLO.L]: optional(c.lunghezza_cm),
      [FCOLLO.W]: optional(c.larghezza_cm),
      [FCOLLO.H]: optional(c.altezza_cm),
      [FCOLLO.Peso]: optional(c.peso_kg),
      // se il campo '#' esiste, metto il totale su ogni riga
      ...(FCOLLO as any).Tot ? { [(FCOLLO as any).Tot]: tot } : {},
    },
  }));

  const BATCH = 10;
  for (let i = 0; i < rows.length; i += BATCH) {
    await b(TABLE.COLLI).create(rows.slice(i, i + BATCH));
  }
}


  // 3) PACKING LIST (Vino)
  if (payload.sorgente === 'vino' && payload.packingList?.length) {
    const rows = payload.packingList.map((r) => ({
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
    const BATCH = 10;
    for (let i = 0; i < rows.length; i += BATCH) {
      await b(TABLE.PL).create(rows.slice(i, i + BATCH));
    }
  }

   return { id: recId, idSpedizione: idCustom };
}


// -------------------------------------------------------------
// LIST (usata dalla GET /api/spedizioni)
// -------------------------------------------------------------
export async function listSpedizioni(opts?: { email?: string }): Promise<any[]> {
  const b = base();
  const all: any[] = [];
  const filter =
    opts?.email
      ? `LOWER({${F.CreatoDaEmail}}) = LOWER("${String(opts.email).replace(/"/g, '\\"')}")`
      : undefined;

  await b(TABLE.SPED)
    .select({
      filterByFormula: filter,
      pageSize: 50,
      sort: [{ field: F.RitiroData, direction: 'desc' }],
    })
    .eachPage((records, next) => {
      for (const r of records) {
        all.push({ id: r.id, ...r.fields });
      }
      next();
    });

  return all;
}

// lib/airtable.ts (append in fondo)

// Tipo comodo per passare URL+filename
export type Att = { url: string; filename?: string };

/**
 * Aggiorna gli attachment della spedizione su Airtable.
 * Passa array di { url, filename } ottenuti da getDownloadURL(Firebase).
 */
export async function attachFilesToSpedizione(
  recId: string,
  opts: { fattura?: Att[]; packing?: Att[] }
): Promise<void> {
  const b = base();

  const asAtt = (arr: Att[]) => arr.map(a => ({ url: a.url, filename: a.filename }));

  const updates: Record<string, any> = {};
  if (opts.fattura?.length) updates[F.Fattura_Att] = asAtt(opts.fattura);
  if (opts.packing?.length) updates[F.PL_Att] = asAtt(opts.packing);

  if (Object.keys(updates).length === 0) return;

  await b(TABLE.SPED).update(recId, updates);
}

// --- Helpers lettura record singolo / meta -------------------
export async function getSpedizioneById(recId: string): Promise<{ id: string; fields: Record<string, any> }> {
  const b = base();
  const r = await b(TABLE.SPED).find(recId);
  return { id: r.id, fields: r.fields as Record<string, any> };
}

export function extractPublicId(fields: Record<string, any>): string | undefined {
  const candidates = [
    (F as any).ID_Spedizione,   // se nel tuo schema esiste
    'ID Spedizione',
    'ID SPST',
    'ID Spedizione (custom)',
  ].filter(Boolean) as string[];
  for (const k of candidates) {
    const v = fields[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

export function extractCreatorEmail(fields: Record<string, any>): string | undefined {
  const candidates = [
    (F as any).CreatoDaEmail,
    'Creato da (email)',
    'Created By Email',
    'Creato da Email',
  ].filter(Boolean) as string[];
  for (const k of candidates) {
    const v = fields[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

export async function readSpedizioneMeta(recId: string): Promise<{
  idSpedizione?: string;
  creatoDaEmail?: string;
}> {
  const b = base();
  const r = await b(TABLE.SPED).find(recId);
  const f = r.fields as Record<string, any>;

  const idCandidates = ['ID Spedizione', 'ID Spedizione (custom)', 'ID SPST'];
  let idSpedizione: string | undefined;
  for (const k of idCandidates) {
    if (typeof f[k] === 'string' && f[k]) { idSpedizione = f[k]; break; }
  }

  const emailCandidates = [F.CreatoDaEmail, 'Creato da', 'Creato da email'];
  let creatoDaEmail: string | undefined;
  for (const k of emailCandidates) {
    if (typeof f[k] === 'string' && f[k]) { creatoDaEmail = f[k]; break; }
  }

  return { idSpedizione, creatoDaEmail };
}
