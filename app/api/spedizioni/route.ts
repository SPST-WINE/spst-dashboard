import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';
import { createSpedizioneWebApp, getSpedizioneById, extractPublicId } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const body = await req.json();
    const idToken: string | undefined = body?.idToken;

    // Prende email dal token (se presente)
    let email: string | undefined;
    if (idToken) {
      // CORREZIONE: Chiamo adminAuth() per ottenere l'istanza e poi uso il metodo.
      const decoded = await adminAuth().verifyIdToken(idToken, true);
      email = decoded.email || decoded.firebase?.identities?.email?.[0];
    }
    if (!email && typeof body?.createdByEmail === 'string') {
      email = body.createdByEmail;
    }

    // Inoltra al payload per Airtable
    const payload = { ...body, createdByEmail: email };

    const { id } = await createSpedizioneWebApp(payload);

    // Leggo il campo "ID Spedizione" per restituirlo al client
    let displayId = id;
    try {
      const rec = await getSpedizioneById(id);
      displayId = extractPublicId(rec.fields) || id;
    } catch {}

    return NextResponse.json({ ok: true, id, displayId }, { headers: cors });
  } catch (e: any) {
    // Aggiungo il log per capire l'errore a runtime
    console.error('Errore nella POST per /api/spedizioni:', e);
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
