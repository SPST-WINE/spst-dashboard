// app/api/spedizioni/[id]/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';
import { readSpedizioneMeta } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);
  const recId = params.id;

  try {
    // Prova a leggere l'email dall'ID token (Authorization: Bearer <idToken>)
    const authHeader = req.headers.get('authorization') ?? '';
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    let userEmail: string | undefined;
    if (m) {
      try {
        const decoded = await adminAuth().verifyIdToken(m[1], true);
        userEmail = decoded.email || undefined;
      } catch {}
    }

    // Meta da Airtable: ID Spedizione (custom) + eventuale email creatore
    const meta = await readSpedizioneMeta(recId);
    const idSped = meta.idSpedizione || recId;
    const to = userEmail || meta.creatoDaEmail;

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM = process.env.EMAIL_FROM || 'notification@spst.it';

    // Se mancano variabili o destinatario, esci senza errore per non bloccare il flusso
    if (!RESEND_API_KEY || !EMAIL_FROM || !to) {
      return NextResponse.json({ ok: true, sent: false }, { headers: cors });
    }

    // Invia email via REST API di Resend (niente import 'resend')
    const subject = `SPST - Spedizione Confermata — ${idSped}`;
    const text = `Grazie! La tua richiesta di spedizione è stata registrata.

ID spedizione: ${idSped}

Conserva questo identificativo per future comunicazioni.

Team SPST`;
    const html = `
      <p>Grazie! La tua richiesta di spedizione è stata registrata.</p>
      <p><strong>ID spedizione:</strong> ${idSped}</p>
      <p>Conserva questo identificativo per future comunicazioni.</p>
      <p>Team SPST</p>
    `;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject,
        text,
        html,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      throw new Error(`Resend API error ${resp.status}: ${body}`);
    }

    return NextResponse.json({ ok: true, sent: true }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
