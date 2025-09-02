// app/api/spedizioni/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { createSpedizioneWebApp, type SpedizionePayload } from '@/lib/airtable';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(origin),
  });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    // Auth (opzionale). Se presente prende l’email dell’utente
    const authz = req.headers.get('authorization');
    const idToken = authz?.startsWith('Bearer ') ? authz.slice(7) : undefined;

    let email: string | undefined;
    if (idToken) {
      const decoded = await adminAuth().verifyIdToken(idToken);
      email = decoded?.email || undefined;
    }

    const body = (await req.json()) as SpedizionePayload;

    // Normalizza booleani per evitare falsy/undefined
    const payload: SpedizionePayload = {
      ...body,
      createdByEmail: email,
      destAbilitato: !!body.destAbilitato,
      fattSameAsDest: !!body.fattSameAsDest,
      fattDelega: !!body.fattDelega,
    };

    const result = await createSpedizioneWebApp(payload);

    // Ritorna l’ID umano (e l’id Airtable se serve debug)
    return NextResponse.json(
      { ok: true, id: result.id, airtableId: result.airtableId },
      { headers: cors }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
