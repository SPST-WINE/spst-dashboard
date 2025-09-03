// app/api/spedizioni/[id]/meta/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { readSpedizioneMeta } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);
  const recId = params.id;

  try {
    const meta = await readSpedizioneMeta(recId);
    return NextResponse.json(
      {
        ok: true,
        idSpedizione: meta.idSpedizione || recId,
        creatoDaEmail: meta.creatoDaEmail ?? null,
      },
      { headers: cors }
    );
  } catch {
    // fallback “soft” per evitare 404 in UI
    return NextResponse.json(
      { ok: true, idSpedizione: recId, creatoDaEmail: null },
      { headers: cors }
    );
  }
}
