// lib/airtable.ts
import Airtable from "airtable";

export const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_TOKEN as string,
}).base(process.env.AIRTABLE_BASE_ID_SPST as string);

export async function upsertUtente(email: string, fields: Record<string, any>) {
  const table = base(process.env.AIRTABLE_TABLE_UTENTI || "UTENTI");
  const found = await table
    .select({ filterByFormula: `{Mail Cliente} = '${email}'`, maxRecords: 1 })
    .firstPage();

  if (found[0]) {
    await table.update(found[0].id, fields as any);
    return found[0].id;
  } else {
    const created = await table.create([{ fields: { "Mail Cliente": email, ...fields } as any }]);
    return created[0].id;
  }
}
