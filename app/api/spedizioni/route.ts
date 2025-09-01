// app/api/spedizioni/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { createSpedizioneWebApp, listSpedizioni, type SpedizionePayload } from '@/lib/airtable';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

// GET elenco
export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const authz = req.headers.get('authorization');
    const idToken = authz?.startsWith('Bearer ') ? authz.slice(7) : undefined;

    let email: string | undefined;
    if (idToken) {
      const decoded = await adminAuth().verifyIdToken(idToken);
      email = decoded?.email || undefined;
    }

    const data = await listSpedizioni({ email });
    return NextResponse.json(data, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500, headers: cors });
  }
}

// POST crea
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const authz = req.headers.get('authorization');
    const idToken = authz?.startsWith('Bearer ') ? authz.slice(7) : undefined;

    let email: string | undefined;
    if (idToken) {
      const decoded = await adminAuth().verifyIdToken(idToken);
      email = decoded?.email || undefined;
    }

    const body = (await req.json()) as SpedizionePayload;
    const result = await createSpedizioneWebApp({ ...body, createdByEmail: email });

    return NextResponse.json({ ok: true, id: result.id }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500, headers: cors });
  }
}
