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
    // 1) Prova a leggere l'email dell'utente dal Bearer token (se presente)
    const authHeader = req.headers.get('authorization') ?? '';
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    let userEmail: string | undefined;
    if (m) {
      try {
        const decoded = await adminAuth().verifyIdToken(m[1], true);
        userEmail = decoded.email || undefined;
      } catch {
        // ignora, userEmail rimane undefined
      }
    }

    // 2) Leggi meta da Airtable -> ID Spedizione "umano" + email di chi ha creato
    const meta = await readSpedizioneMeta(recId);
    const idSped = meta.idSpedizione || recId;
    const to = userEmail || meta.creatoDaEmail;

    // 3) Se mancano credenziali o destinatario, esci "ok" senza inviare
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM = process.env.EMAIL_FROM || 'notification@spst.it';
    if (!RESEND_API_KEY || !EMAIL_FROM || !to) {
      return NextResponse.json({ ok: true, sent: false }, { headers: cors });
    }

    // 4) Branding / Link (customizzabili via env)
    const BRAND_PRIMARY = '#1c3e5e';
    const BRAND_ACCENT = '#f7911e';
    const BRAND_BG = '#f6f8fb';
    const LOGO_URL = process.env.EMAIL_LOGO_URL || 'https://app.spst.it/logo-email.png';

    const DASH_URL = process.env.APP_DASHBOARD_URL || 'https://app.spst.it/dashboard';
    const INFO_URL = process.env.INFO_URL || `${DASH_URL}/info`;
    const WHATSAPP_URL =
      process.env.WHATSAPP_URL ||
      `https://wa.me/393000000000?text=${encodeURIComponent(
        `Ciao SPST, ho bisogno di supporto sulla spedizione ${idSped}`
      )}`;

    const subject = `SPST – Spedizione Confermata — ${idSped}`;
    const text = `Grazie! La tua richiesta di spedizione è stata registrata.

ID spedizione: ${idSped}

Stiamo elaborando la tua spedizione: a breve riceverai in area riservata e via email tutti i documenti necessari.
Nella mail di evasione riceverai indicazioni sulla preparazione del collo e sui documenti da applicare.

Documenti & informazioni utili: ${INFO_URL}
Supporto WhatsApp: ${WHATSAPP_URL}

Team SPST`;

    const preheader = `Spedizione confermata — ${idSped}. Riceverai a breve i documenti necessari.`;

    const html = `
<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${subject}</title>
    <style>
      img { border:0; outline:none; text-decoration:none; display:block; }
      table { border-collapse:collapse; }
      a { text-decoration:none; }
      .btn { border-radius:10px; font-weight:600; }
      @media (max-width: 620px) {
        .container { width:100% !important; }
        .px { padding-left:20px !important; padding-right:20px !important; }
      }
    </style>
  </head>
  <body style="margin:0; background:${BRAND_BG};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      ${preheader}
    </div>

    <table role="presentation" width="100%" bgcolor="${BRAND_BG}">
      <tr><td align="center" style="padding:28px 16px;">
        <table role="presentation" width="600" class="container" style="width:600px; max-width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 14px rgba(0,0,0,0.07);">
          <tr>
            <td class="px" style="padding:22px 28px; background:${BRAND_PRIMARY};">
              <img src="${LOGO_URL}" alt="SPST" width="120" height="auto" style="filter: brightness(110%);" />
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:28px;">
              <h1 style="margin:0 0 6px; font-family:Inter,Arial,sans-serif; font-size:22px; line-height:1.3; color:#111827;">
                Spedizione confermata ✅
              </h1>
              <p style="margin:0 0 14px; font-family:Inter,Arial,sans-serif; font-size:14px; color:#374151;">
                Grazie! La tua richiesta di spedizione è stata registrata.
              </p>

              <table role="presentation" style="width:100%; margin:16px 0 8px;">
                <tr>
                  <td style="font-family:Inter,Arial,sans-serif; font-size:12px; color:#6b7280; padding-bottom:4px;">ID spedizione</td>
                </tr>
                <tr>
                  <td style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:14px; padding:10px 12px; border:1px solid #e5e7eb; border-radius:8px; background:#f9fafb; color:#111827;">
                    ${idSped}
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0; font-family:Inter,Arial,sans-serif; font-size:14px; color:#374151;">
                Stiamo elaborando la tua spedizione: a breve troverai in <strong>Area Riservata</strong> e riceverai via email
                tutti i documenti necessari.
              </p>
              <p style="margin:10px 0 18px; font-family:Inter,Arial,sans-serif; font-size:14px; color:#374151;">
                Riceverai indicazioni dettagliate sulla <strong>preparazione del collo</strong> e sui <strong>documenti da applicare</strong>
                nella mail di evasione.
              </p>

              <table role="presentation" width="100%" style="margin:4px 0 6px;">
                <tr>
                  <td align="left" style="padding:6px 0;">
                    <a href="${INFO_URL}" class="btn" style="display:inline-block; background:${BRAND_PRIMARY}; color:#ffffff; padding:12px 16px; font-family:Inter,Arial,sans-serif; font-size:14px;">
                      Documenti & Informazioni utili
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding:6px 0;">
                    <a href="${WHATSAPP_URL}" class="btn" style="display:inline-block; background:${BRAND_ACCENT}; color:#111827; padding:12px 16px; font-family:Inter,Arial,sans-serif; font-size:14px;">
                      Supporto WhatsApp
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:18px 0 0; font-family:Inter,Arial,sans-serif; font-size:12px; color:#6b7280;">
                Suggerimento: conserva l’ID per eventuali comunicazioni con il team SPST.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px; background:#f3f4f6;">
              <p style="margin:0; font-family:Inter,Arial,sans-serif; font-size:11px; color:#6b7280;">
                © ${new Date().getFullYear()} SPST • <a href="${DASH_URL}" style="color:#374151;">Area Riservata</a>
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
`;

    // 5) Invio via Resend (dynamic import per evitare errori in build)
    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    return NextResponse.json({ ok: true, sent: true }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
