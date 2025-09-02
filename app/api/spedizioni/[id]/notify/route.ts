import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';
import { getSpedizioneById, extractPublicId, extractCreatorEmail } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);
  const recId = ctx.params.id;

  try {
    const { idToken } = await req.json().catch(() => ({}));

    // verifica token per sicurezza (se c'è)
    let tokenEmail: string | undefined;
    if (idToken) {
      const decoded = await adminAuth.verifyIdToken(idToken, true);
      tokenEmail = decoded.email || decoded.firebase?.identities?.email?.[0];
    }

    // leggo dati spedizione da Airtable
    const rec = await getSpedizioneById(recId);
    const publicId = extractPublicId(rec.fields) || recId;
    const creatorEmail = extractCreatorEmail(rec.fields);

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@spst.it';

    const to = creatorEmail || tokenEmail;
    if (!RESEND_API_KEY || !EMAIL_FROM || !to) {
      // niente crash: ritorno 200 ma sent:false
      return NextResponse.json(
        { ok: true, sent: false, reason: 'missing_config_or_recipient' },
        { headers: cors }
      );
    }

    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);

    const subject = `Conferma richiesta spedizione ${publicId}`;
    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
        <p>Abbiamo ricevuto la tua richiesta di spedizione <b>${publicId}</b>.</p>
        <p>Ti contatteremo a breve con i dettagli operativi.</p>
        <p style="font-size:12px;color:#667">ID record: ${recId}</p>
      </div>
    `;

    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    return NextResponse.json({ ok: true, sent: true }, { headers: cors });
  } catch (e: any) {
    // non esplodere: log utile e 200 con sent:false
    console.error('notify error', e);
    return NextResponse.json(
      { ok: true, sent: false, error: e?.message ?? 'notify_failed' },
      { headers: cors }
    );
  }
}
