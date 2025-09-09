// app/api/spedizioni/route.ts
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

/**
 * Estrae l'email SOLO dal Bearer token dell'Authorization header.
 * (Niente cookie: evita di “ereditare” sessioni di altri utenti.)
 */
async function getEmailFromBearer(req: NextRequest): Promise<string | undefined> {
  const m = (req.headers.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i);
  if (!m) return undefined;
  try {
    const decoded = await adminAuth().verifyIdToken(m[1], true);
    return decoded.email || decoded.firebase?.identities?.email?.[0] || undefined;
  } catch {
    return undefined;
  }
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email') || undefined;
    const q = searchParams.get('q') || undefined;
    const sort = (searchParams.get('sort') as any) || undefined;

    // 1) preferisci SEMPRE il Bearer (email sicura dal token)
    const emailFromToken = await getEmailFromBearer(req);
    // 2) se non c'è token, usa la querystring (meno sicura ma OK per client già autenticato)
    const email = emailFromToken || emailParam;

    // Se non abbiamo né token né email esplicita => non ritorniamo dati
    if (!email) {
      return NextResponse.json({ ok: true, rows: [] }, { headers: cors });
    }

    const rows = await listSpedizioni({
      email,
      ...(q ? { q } : {}),
      ...(sort ? { sort } : {}),
    });

    return NextResponse.json({ ok: true, rows }, { headers: cors });
  } catch (e: any) {
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

    // Opzione: creazione session cookie da token (usata altrove; NON letta in GET)
    if (payload.token) {
      const sessionCookie = await adminAuth().createSessionCookie(payload.token, {
        expiresIn: 60 * 60 * 24 * 5 * 1000,
      });
      const res = NextResponse.json({ ok: true, message: 'Sessione creata' }, { headers: cors });
      res.cookies.set({
        name: 'spst_session',
        value: sessionCookie,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
      return res;
    }

    // ✅ Regola aggiornata: P.IVA/CF del DESTINATARIO obbligatoria solo per VINO + (B2B|Sample)
    const isVino = String(payload?.sorgente || '').toLowerCase() === 'vino';
    const tipo: string = payload?.tipoSped || '';
    const richiedePivaDest = isVino && (tipo === 'B2B' || tipo === 'Sample');
    if (richiedePivaDest) {
      const pivaDest = String(payload?.destinatario?.piva || '').trim();
      if (!pivaDest) {
        return NextResponse.json(
          {
            ok: false,
            error: 'DEST_PIVA_REQUIRED',
            message:
              'Per le spedizioni vino di tipo B2B o Sample è obbligatoria la Partita IVA / Codice Fiscale del destinatario.',
          },
          { status: 400, headers: cors }
        );
      }
    }

    // Fallback: createdByEmail dal Bearer se non presente
    if (!payload.createdByEmail) {
      const email = await getEmailFromBearer(req);
      if (email) payload.createdByEmail = email;
    }

    const created = await createSpedizioneWebApp(payload);
    return NextResponse.json(
      { ok: true, id: created.id, idSpedizione: created.idSpedizione },
      { headers: cors }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
