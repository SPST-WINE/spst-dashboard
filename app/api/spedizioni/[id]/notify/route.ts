// app/api/spedizioni/[id]/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { auth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth (id token Firebase)
    const authz = req.headers.get('authorization') || '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: buildCorsHeaders() });
    }
    await auth.verifyIdToken(token);

    // Body opzionale: { to?: string, subject?: string, text?: string, html?: string }
    const body = await req.json().catch(() => ({} as any));
    const to: string | undefined = body?.to;
    const spedId = params.id;

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@spst.it';

    // Se non ho le env per l’invio, esco "morbido"
    if (!RESEND_API_KEY || !EMAIL_FROM || !to) {
      return NextResponse.json(
        { ok: true, sent: false, reason: 'missing-config-or-recipient' },
        { headers: buildCorsHeaders() }
      );
    }

    // Import dinamico: viene risolto solo se davvero devo inviare
    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);

    const subject = body?.subject || `SPST – Spedizione creata (ID ${spedId})`;
    const text =
      body?.text ||
      `La tua spedizione è stata creata correttamente.\nID: ${spedId}\nTi aggiorneremo sugli stati.`;
    const html =
      body?.html ||
      `<p>La tua spedizione è stata creata correttamente.</p><p><b>ID:</b> ${spedId}</p><p>Ti aggiorneremo sugli stati.</p>`;

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    return NextResponse.json(
      { ok: true, sent: true, id: result?.data?.id ?? null },
      { headers: buildCorsHeaders() }
    );
  } catch (e) {
    console.error('notify error', e);
    return NextResponse.json({ error: 'internal' }, { status: 500, headers: buildCorsHeaders() });
  }
}
