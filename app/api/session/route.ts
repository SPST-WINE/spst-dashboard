///spst-dashboard/app/api/session/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';
import { createSpedizioneWebApp, listSpedizioni } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

async function getEmailFromAuth(req: NextRequest): Promise<string | undefined> {
  // 1) Bearer ID token nell'Authorization header
  const authHeader = req.headers.get('authorization') ?? '';
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (m) {
    try {
      const decoded = await adminAuth().verifyIdToken(m[1], true);
      console.log('Token ID decodificato con successo:', decoded.email); // Debug Log
      return decoded.email || decoded.firebase?.identities?.email?.[0] || undefined;
    } catch (e) {
      console.error('Errore nella verifica del token ID:', e); // Debug Log
      // continua coi fallback
    }
  }

  // 2) Session cookie creato da /api/session
  const session = req.cookies.get('spst_session')?.value;
  if (session) {
    try {
      const decoded = await adminAuth().verifySessionCookie(session, true);
      console.log('Session cookie decodificato con successo:', decoded.email); // Debug Log
      return decoded.email || decoded.firebase?.identities?.email?.[0] || undefined;
    } catch (e) {
      console.error('Errore nella verifica del session cookie:', e); // Debug Log
      // ignore
    }
  }

  return undefined;
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const email = await getEmailFromAuth(req);
    const rows = await listSpedizioni(email ? { email } : undefined);
    return NextResponse.json({ ok: true, rows }, { headers: cors });
  } catch (e: any) {
    console.error('Errore nella GET request:', e); // Debug Log
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
    const payload: any = await req.json();
    console.log('Payload ricevuto:', payload); // Debug Log

    if (payload.token) {
        // Crea un session cookie dal token ID
        const sessionCookie = await adminAuth().createSessionCookie(payload.token, { expiresIn: 60 * 60 * 24 * 5 * 1000 });
        const response = NextResponse.json({ ok: true, message: 'Sessione creata' }, { headers: cors });
        response.cookies.set({
            name: 'spst_session',
            value: sessionCookie,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });
        return response;
    } else {
        // Se non c'è il token, gestisci la logica di fallback
        // Se non arriva già dal client, prova a valorizzare createdByEmail dai token/cookie
        if (!payload.createdByEmail) {
          const email = await getEmailFromAuth(req);
          if (email) payload.createdByEmail = email;
        }
        const res = await createSpedizioneWebApp(payload);
        console.log('Risposta da Airtable:', res); // Debug Log
        return NextResponse.json({ ok: true, id: res.id }, { headers: cors });
    }
  } catch (e: any) {
    // Questo log è il più importante e ti darà la causa esatta del 500.
    console.error('Errore critico nella POST request:', e);
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
