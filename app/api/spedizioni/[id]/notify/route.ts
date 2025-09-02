// app/api/spedizioni/[id]/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);
  const recId = ctx.params.id;

  // Estrai il token dall'header Authorization: Bearer <idToken>
  const authz = req.headers.get('authorization') || '';
  const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : undefined;

  try {
    // Ricava l'email dell'utente autenticato
    let userEmail: string | undefined;
    if (idToken) {
      const decoded = await adminAuth().verifyIdToken(idToken, true);
      userEmail = decoded.email || undefined;
    }
    // Se non ho l'email, non fallire: ritorna ok ma sent:false (evita 500)
    if (!userEmail) {
      return NextResponse.json(
        { ok: true, sent: false, reason: 'NO_EMAIL' },
        { headers: cors }
      );
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@spst.it';

    // Se mancano le env necessarie, non inviare ma non andare in errore
    if (!RESEND_API_KEY || !EMAIL_FROM) {
      return NextResponse.json(
        { ok: true, sent: false, reason: 'MISSING_RESEND_ENV' },
        { headers: cors }
      );
    }

    // Subject/body base (se vuoi, personalizza: recupera displayId lato client e includilo nella pagina)
    const subject = `Conferma invio spedizione – ID record ${recId}`;
    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
        <p>Grazie! La tua richiesta di spedizione è stata registrata.</p>
        <p><strong>ID record Airtable:</strong> ${recId}</p>
        <p>Conserva questo identificativo per future comunicazioni.</p>
        <p>Team SPST</p>
      </div>
    `;

    // Chiamata REST a Resend (no libreria)
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [userEmail],
        subject,
        html,
      }),
    });

    // Se Resend risponde 2xx consideriamo inviato
    if (resp.ok) {
      return NextResponse.json({ ok: true, sent: true }, { headers: cors });
    } else {
      const err = await safeJson(resp);
      return NextResponse.json(
        { ok: true, sent: false, reason: 'RESEND_ERROR', detail: err },
        { headers: cors }
      );
    }
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}

async function safeJson(r: Response) {
  try {
    return await r.json();
  } catch {
    return { status: r.status, statusText: r.statusText };
  }
}
