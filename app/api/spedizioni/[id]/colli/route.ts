// app/api/spedizioni/[id]/colli/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { listColliBySpedId } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const rows = await listColliBySpedId(ctx.params.id);
    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
