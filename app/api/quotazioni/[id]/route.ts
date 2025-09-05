// app/api/quotazioni/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { getPreventivo } from '@/lib/airtable.quotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const id = decodeURIComponent(ctx.params.id);
    const row = await getPreventivo(id); // accetta recId o ID_Preventivo
    return NextResponse.json({ ok: true, row }, { headers: cors });
  } catch (e: any) {
    const code = e?.message === 'NOT_FOUND' ? 404 : 500;
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: code, headers: cors },
    );
  }
}
