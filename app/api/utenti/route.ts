// app/api/utenti/route.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { base } from "@/lib/airtable";

export const runtime = "nodejs";

const TBL = process.env.AIRTABLE_TABLE_UTENTI || "UTENTI";
const ALLOWED = [
  "Paese Mittente",
  "Mittente",
  "Città Mittente",
  "CAP Mittente",
  "Indirizzo Mittente",
  "Telefono Mittente",
];

// GET: restituisce il record utente (se esiste)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) return NextResponse.json({ error: "No token" }, { status: 401 });

  const decoded = await adminAuth().verifyIdToken(idToken);
  const email = decoded.email;
  if (!email) return NextResponse.json({ error: "No email" }, { status: 403 });

  const table = base(TBL);
  const list = await table
    .select({ filterByFormula: `{Mail Cliente} = '${email}'`, maxRecords: 1 })
    .firstPage();

  if (!list[0]) return NextResponse.json(null); // nessun record ancora
  return NextResponse.json({ id: list[0].id, ...list[0].fields });
}

// POST: upsert dei campi consentiti
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) return NextResponse.json({ error: "No token" }, { status: 401 });

  const decoded = await adminAuth().verifyIdToken(idToken);
  const email = decoded.email;
  if (!email) return NextResponse.json({ error: "No email" }, { status: 403 });

  const body = await req.json();
  const fields: Record<string, any> = {};
  for (const k of ALLOWED) if (k in body) fields[k] = body[k];

  const table = base(TBL);
  const list = await table
    .select({ filterByFormula: `{Mail Cliente} = '${email}'`, maxRecords: 1 })
    .firstPage();

  if (list[0]) {
    await table.update(list[0].id, fields as any);
    return NextResponse.json({ ok: true, id: list[0].id });
  } else {
    const created = await table.create([
      { fields: { "Mail Cliente": email, ...fields } as any },
    ]);
    return NextResponse.json({ ok: true, id: created[0].id });
  }
}
