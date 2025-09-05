// app/api/quotazioni/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { getPreventivo } from '@/lib/airtable.quotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const id = decodeURIComponent(params.id);
    const row = await getPreventivo(id);
    if (!row) {
      return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404, headers: cors });
    }
    return NextResponse.json({ ok: true, row }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500, headers: cors });
  }
}
