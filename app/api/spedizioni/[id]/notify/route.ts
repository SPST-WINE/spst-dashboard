// app/api/spedizioni/[id]/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { auth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// invio via API HTTP di Resend, senza SDK
async function sendWithResend(apiKey: string, payload: any) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Resend ${r.status}: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth Firebase
    const authz = req.headers.get('authorization') || '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
    if (!token) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401, headers: buildCorsHeaders() }
      );
    }
    await auth.verifyIdToken(token);

    const body = await req.json().catch(() => ({} as any));
    const to: string | undefined = body?.to; // destinatario obbligatorio per invio
    const spedId = params.id;

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@spst.it';

    // Se mancano le config o il destinatario, non falliamo il flow:
    if (!RESEND_API_KEY || !to) {
      return NextResponse.json(
        { ok: true, sent: false, reason: 'missing-config-or-recipient' },
        { headers: buildCorsHeaders() }
      );
    }

    const subject =
      body?.subject || `SPST – Spedizione creata (ID ${spedId})`;
    const text =
      body?.text ||
      `La tua spedizione è stata creata correttamente.\nID: ${spedId}\nTi aggiorneremo sugli stati.`;
    const html =
      body?.html ||
      `<p>La tua spedizione è stata creata correttamente.</p><p><b>ID:</b> ${spedId}</p><p>Ti aggiorneremo sugli stati.</p>`;

    const res = await sendWithResend(RESEND_API_KEY, {
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    return NextResponse.json(
      { ok: true, sent: true, id: res?.id ?? res?.data?.id ?? null },
      { headers: buildCorsHeaders() }
    );
  } catch (e) {
    console.error('notify error', e);
    return NextResponse.json(
      { error: 'internal' },
      { status: 500, headers: buildCorsHeaders() }
    );
  }
}
