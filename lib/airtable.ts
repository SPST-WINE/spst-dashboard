// lib/airtable.ts
// Server-side Airtable helpers (Node runtime only)

import Airtable from 'airtable';

const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN!;
const AIRTABLE_BASE_ID_SPST = process.env.AIRTABLE_BASE_ID_SPST!;
const AIRTABLE_TABLE_UTENTI = process.env.AIRTABLE_TABLE_UTENTI ?? 'UTENTI';
const AIRTABLE_USERS_EMAIL_FIELD =
  process.env.AIRTABLE_USERS_EMAIL_FIELD ?? 'Mail Cliente';

if (!AIRTABLE_API_TOKEN) throw new Error('Missing AIRTABLE_API_TOKEN');
if (!AIRTABLE_BASE_ID_SPST) throw new Error('Missing AIRTABLE_BASE_ID_SPST');

const base = new Airtable({ apiKey: AIRTABLE_API_TOKEN }).base(
  AIRTABLE_BASE_ID_SPST
);

type AirtRecord = Airtable.Record<any>;

function escapeFormulaString(value: string) {
  // Escape single quotes for Airtable formula strings
  return value.replace(/'/g, "\\'");
}

/** Normalizza il record in un oggetto semplice { id, fields } */
function toObj(rec: AirtRecord) {
  return { id: rec.id, fields: rec.fields as Record<string, any> };
}

/**
 * Cerca un utente per email nella tabella UTENTI (campo configurabile via env AIRTABLE_USERS_EMAIL_FIELD).
 * Ritorna { id, fields } oppure null se non trovato.
 */
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

/**
 * Crea o aggiorna un utente identificato dall'email.
 * Se esiste, aggiorna i campi passati in "fields"; altrimenti crea un nuovo record.
 * Ritorna { id, fields } dell'utente upsertato.
 */
export async function upsertUtente(params: {
  email: string;
  fields?: Record<string, any>;
}) {
  const email = params.email.trim();
  const fields = params.fields ?? {};

  // Garantisci che il campo email della tabella venga popolato
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
