// app/api/health/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const env = {
    AIRTABLE_API_KEY: !!process.env.AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID: !!process.env.AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_USERS: process.env.AIRTABLE_TABLE_USERS ?? 'UTENTI',
    AIRTABLE_USERS_EMAIL_FIELD: process.env.AIRTABLE_USERS_EMAIL_FIELD ?? 'Mail Cliente',
  };

  // opzionale: ping minimale ad Airtable per capire se le credenziali sono valide
  let airtableOk = false;
  try {
    if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
      const url = new URL(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(
          process.env.AIRTABLE_TABLE_USERS || 'UTENTI',
        )}`,
      );
      url.searchParams.set('maxRecords', '1');
      const r = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
        cache: 'no-store',
      });
      airtableOk = r.ok;
    }
  } catch {
    airtableOk = false;
  }

  return NextResponse.json({ ok: true, env, airtableOk });
}
