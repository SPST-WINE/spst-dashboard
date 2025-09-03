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
    // prova a prendere l'email dal token client
    const authHeader = req.headers.get('authorization') ?? '';
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    let userEmail: string | undefined;
    if (m) {
      try {
        const decoded = await adminAuth().verifyIdToken(m[1], true);
        userEmail = decoded.email || undefined;
      } catch {}
    }

    // leggi meta da Airtable (ID Spedizione & eventuale email creatore)
    const meta = await readSpedizioneMeta(recId);
    const idSped = meta.idSpedizione || recId;
    const to = userEmail || meta.creatoDaEmail;

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM = process.env.EMAIL_FROM || 'notification@spst.it';
    if (!RESEND_API_KEY || !EMAIL_FROM || !to) {
      return NextResponse.json({ ok: true, sent: false }, { headers: cors });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `SPST - Spedizione Confermata — ${idSped}`,
      text: `Grazie! La tua richiesta di spedizione è stata registrata.\n\nID spedizione: ${idSped}\n\nConserva questo identificativo per future comunicazioni.\n\nTeam SPST`,
      html: `
        <p>Grazie! La tua richiesta di spedizione è stata registrata.</p>
        <p><strong>ID spedizione:</strong> ${idSped}</p>
        <p>Conserva questo identificativo per future comunicazioni.</p>
        <p>Team SPST</p>
      `,
    });

    return NextResponse.json({ ok: true, sent: true }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
