// app/api/spedizioni/route.ts
// Aggiunge log dettagliati lato API (abilita con DEBUG_SPEDIZIONI=1)

import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { createSpedizioneWebApp, type SpedizionePayload, listSpedizioniByEmail, listSpedizioni } from '@/lib/airtable';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEBUG =
  String(process.env.DEBUG_SPEDIZIONI || '').toLowerCase() === '1' ||
  String(process.env.DEBUG_SPEDIZIONI || '').toLowerCase() === 'true';

function slog(...a: any[]) {
  if (DEBUG) console.log('[api/spedizioni]', ...a);
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(origin),
  });
}

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

    slog('GET list', { email: email || '(anon)' });

    // preferisci una sola funzione? qui proviamo entrambe per compat
    const data = email
      ? await listSpedizioniByEmail(email)
      : await listSpedizioni();

    return NextResponse.json(data, { headers: cors });
  } catch (e: any) {
    slog('GET error', e?.message, e?.stack);
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}

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

    // log payload (sanitizzato)
    slog('POST body', {
      ...body,
      createdByEmail: email || body.createdByEmail || null,
      fatturaFileUrl: body.fatturaFileUrl ? '[URL]' : null,
    });

    const result = await createSpedizioneWebApp({
      ...body,
      createdByEmail: email || body.createdByEmail,
    });

    slog('POST result', result);

    return NextResponse.json({ ok: true, id: result.id }, { headers: cors });
  } catch (e: any) {
    slog('POST error', e?.message, e?.stack);
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
