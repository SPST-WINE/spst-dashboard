// app/api/health/airtable/route.ts
import { NextResponse } from 'next/server';
import { airtableEnvStatus } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const st = airtableEnvStatus();
  const ok = (st.hasKey || st.hasToken) && st.hasBaseId;
  return NextResponse.json(st, { status: ok ? 200 : 500 });
}
