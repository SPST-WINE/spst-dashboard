import { NextRequest, NextResponse } from "next/server";
import { buildTrackingUrl } from "@/lib/tracking-links";
import { TABLE, F } from "@/lib/airtable.schema";
import { getAirtableClient } from "@/lib/airtable";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const baseId = process.env.AIRTABLE_BASE_ID_SPST!;
  const tableName = process.env.AIRTABLE_TABLE_SPEDIZIONI_WEBAPP || TABLE.SPED;
  const base = getAirtableClient().base(baseId);
  const table = base(tableName);

  // body opzionale: { id?: string } → aggiorna solo quel record
  const body = (await req.json().catch(() => ({}))) as { id?: string };

  const selector = body.id
    ? { filterByFormula: `RECORD_ID()='${body.id.replace(/'/g, "\\'")}'` }
    : { }; // tutto (puoi sostituire con una vista o filtro)

  const records = await table.select({ ...selector, pageSize: 50 }).all();

  const updates: Array<{ id: string; fields: any }> = [];
  for (const r of records) {
    const carrier = (r.get(F.Corriere) as any) || "";
    const code = (r.get(F.TrackingNumber) as any) || "";
    const current = (r.get(F.TrackingURL) as any) || "";
    const url = buildTrackingUrl(
      typeof carrier === "object" && carrier?.name ? carrier.name : carrier,
      code
    );

    if (url && url !== current) {
      updates.push({ id: r.id, fields: { [F.TrackingURL]: url } });
    }
  }

  if (updates.length) await table.update(updates);
  return NextResponse.json({ ok: true, updated: updates.length });
}
