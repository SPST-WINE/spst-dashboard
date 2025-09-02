// app/api/health/airtable/route.ts
import { NextResponse } from 'next/server';
import { airtableEnvStatus } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const st = await airtableEnvStatus(); // <- serve await
  const ok = st.hasToken && st.hasBaseId;
  return NextResponse.json({ ok, ...st }, { status: ok ? 200 : 500 });
}
