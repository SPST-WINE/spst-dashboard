// app/api/spedizioni/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { createSpedizioneWebApp, type SpedizionePayload } from '@/lib/airtable';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  const cors = buildCorsHeaders(origin);

  try {
    // auth: idToken via Authorization: Bearer ... oppure cookie sessione già validata a monte
    const authz = req.headers.get('authorization');
    const idToken = authz?.startsWith('Bearer ') ? authz.slice(7) : undefined;
    let email: string | undefined;

    if (idToken) {
      const decoded = await adminAuth().verifyIdToken(idToken);
      email = decoded?.email || undefined;
    }

    const body = (await req.json()) as SpedizionePayload;
    const payload: SpedizionePayload = {
      ...body,
      createdByEmail: email,
    };

    const result = await createSpedizioneWebApp(payload);
    return NextResponse.json({ ok: true, id: result.id }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors },
    );
  }
}
