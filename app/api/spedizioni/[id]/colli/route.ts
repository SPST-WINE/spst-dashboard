// app/api/spedizioni/[id]/colli/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cors = buildCorsHeaders(_req.headers.get('origin') ?? undefined);
  try {
    const { listColliBySpedizione } = await import('@/lib/airtable');
    const colli = await listColliBySpedizione(params.id);
    return NextResponse.json({ ok: true, colli }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  const cors = buildCorsHeaders(req.headers.get('origin') ?? undefined);
  return new NextResponse(null, { status: 204, headers: cors });
}
