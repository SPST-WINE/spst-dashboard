// app/api/utenti/route.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { upsertUtente } from "@/lib/airtable";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) return NextResponse.json({ error: "No token" }, { status: 401 });

    const decoded = await adminAuth().verifyIdToken(idToken);
    const email = decoded.email;
    if (!email) return NextResponse.json({ error: "No email" }, { status: 403 });

    const body = await req.json();

    // whitelist base campi per sicurezza (adatta ai tuoi nomi campi Airtable)
    const allowed = [
      "Paese Mittente",
      "Mittente",
      "Città Mittente",
      "CAP Mittente",
      "Indirizzo Mittente",
      "Telefono Mittente",
    ];
    const fields: Record<string, any> = {};
    for (const k of allowed) if (k in body) fields[k] = body[k];

    const id = await upsertUtente(email, fields);
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
