// app/api/health/airtable/route.ts
import { NextResponse } from 'next/server';
import { airtableEnvStatus /*, airtableQuickPing */ } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const st = airtableEnvStatus();
  const ok = st.hasToken && st.hasBaseId;
  return NextResponse.json({ ok, ...st }, { status: ok ? 200 : 500 });
}

// Se vuoi testare anche la connessione reale, puoi abilitare la POST:
// export async function POST() {
//   try {
//     const ping = await airtableQuickPing();
//     return NextResponse.json(ping);
//   } catch (e: any) {
//     return NextResponse.json({ ok: false, error: e?.message || 'PING_ERROR' }, { status: 500 });
//   }
// }
