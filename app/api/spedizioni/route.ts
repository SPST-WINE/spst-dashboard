import { NextRequest, NextResponse } from "next/server";
import Airtable from "airtable";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_TOKEN as string })
  .base(process.env.AIRTABLE_BASE_ID_SPST as string);

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "https://www.spst.it,https://spst.it")
  .split(",").map(s => s.trim());

function applyCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.headers.set("Access-Control-Allow-Origin", allowed);
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return res;
}

export async function OPTIONS(req: NextRequest) {
  return applyCors(req, new NextResponse(null, { status: 204 }));
}

async function listByEmail(table: string, email: string) {
  const records = await base(table)
    .select({ filterByFormula: `{Mail Cliente} = '${email}'`, maxRecords: 200 })
    .all();
  return records.map(r => ({ id: r.id, ...r.fields }));
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) return applyCors(req, NextResponse.json({ error: "No token" }, { status: 401 }));

    const decoded = await adminAuth().verifyIdToken(idToken);
    const email = decoded.email;
    if (!email) return applyCors(req, NextResponse.json({ error: "No email" }, { status: 403 }));

    const [a, b] = await Promise.all([
      listByEmail(process.env.AIRTABLE_TABLE_SPEDIZIONI as string, email),
      listByEmail(process.env.AIRTABLE_TABLE_SPEDIZIONI_RIV as string, email),
    ]);

    const all = [...a, ...b].sort((x: any, y: any) => {
      const dx = new Date(x["Data Ritiro"] || x["Data"] || 0).getTime();
      const dy = new Date(y["Data Ritiro"] || y["Data"] || 0).getTime();
      return dy - dx;
    });

    return applyCors(req, NextResponse.json(all));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
