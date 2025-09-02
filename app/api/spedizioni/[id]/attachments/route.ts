// app/api/spedizioni/[id]/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { auth } from '@/lib/firebase-admin'; // già presente nel progetto
import { listSpedizioni } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // verifica token (ricaviamo l'email del cliente che ha creato)
    const authz = req.headers.get('authorization') || '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
    const decoded = token ? await auth.verifyIdToken(token) : null;
    const userEmail = decoded?.email;

    // carica record per sicurezza (per esempio per future info nell'email)
    const all = await listSpedizioni({ email: userEmail ?? undefined });
    const rec = all.find((r) => r.id === params.id);

    // se non abbiamo provider email configurato, esci "OK"
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@spst.it';
    if (!RESEND_API_KEY || !EMAIL_FROM || !userEmail) {
      return NextResponse.json({ ok: true, sent: false }, { headers: buildCorsHeaders() });
    }

    // invio con Resend
    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);

    const subject = `Conferma spedizione SPST — ID ${params.id}`;
    const lines = [
      `Ciao,`,
      ``,
      `la tua spedizione è stata registrata correttamente.`,
      `ID: ${params.id}`,
      rec?.['Ritiro - Data'] ? `Ritiro: ${rec['Ritiro - Data']}` : undefined,
      rec?.Incoterm ? `Incoterm: ${rec.Incoterm}` : undefined,
      `Grazie per aver scelto SPST.`,
    ].filter(Boolean);

    await resend.emails.send({
      from: EMAIL_FROM,
      to: userEmail,
      subject,
      text: lines.join('\n'),
    });

    return NextResponse.json({ ok: true, sent: true }, { headers: buildCorsHeaders() });
  } catch (e) {
    console.error('notify error', e);
    return NextResponse.json({ ok: false }, { status: 500, headers: buildCorsHeaders() });
  }
}
