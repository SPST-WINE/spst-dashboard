// app/api/spedizioni/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Airtable from "airtable";
import { adminAuth } from "@/lib/firebase-admin";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_TOKEN as string })
  .base(process.env.AIRTABLE_BASE_ID_SPST as string);

async function listByEmail(table: string, email: string) {
  const records = await base(table)
    .select({ filterByFormula: `{Mail Cliente} = '${email}'`, maxRecords: 200 })
    .all();
  return records.map(r => ({ id: r.id, ...r.fields }));
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) return NextResponse.json({ error: "No token" }, { status: 401 });

  const decoded = await adminAuth().verifyIdToken(idToken);
  const email = decoded.email;
  if (!email) return NextResponse.json({ error: "No email" }, { status: 403 });

  const [a, b] = await Promise.all([
    listByEmail(process.env.AIRTABLE_TABLE_SPEDIZIONI as string, email),
    listByEmail(process.env.AIRTABLE_TABLE_SPEDIZIONI_RIV as string, email),
  ]);

  const all = [...a, ...b].sort((x: any, y: any) => {
    const dx = new Date(x["Data Ritiro"] || x["Data"] || 0).getTime();
    const dy = new Date(y["Data Ritiro"] || y["Data"] || 0).getTime();
    return dy - dx;
  });

  return NextResponse.json(all);
}
