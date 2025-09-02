// app/api/health/airtable/route.ts
import { NextResponse } from 'next/server';
import { airtableEnvStatus/*, airtableQuickPing*/ } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const status = airtableEnvStatus();
  return NextResponse.json({ ok: true, status });
}

// Se vuoi testare anche la connessione reale, abilita la POST:
// export async function POST() {
//   try {
//     const ping = await airtableQuickPing();
//     return NextResponse.json(ping);
//   } catch (e: any) {
//     return NextResponse.json({ ok: false, error: e?.message || 'PING_ERROR' }, { status: 500 });
//   }
// }
