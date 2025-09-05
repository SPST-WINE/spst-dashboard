// app/api/quotazioni/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { getPreventivo } from '@/lib/airtable.quotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

export async function GET(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const raw = ctx?.params?.id ?? '';
    const id = decodeURIComponent(raw).trim();

    const rec = await getPreventivo(id);
    if (!rec) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND' },
        { status: 404, headers: cors }
      );
    }

    return NextResponse.json({ ok: true, row: rec }, { headers: cors });
  } catch (e: any) {
    console.error('GET /api/quotazioni/[id] error:', {
      message: e?.message,
      statusCode: e?.statusCode,
      airtable: e?.error,
    });
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
