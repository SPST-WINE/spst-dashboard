// app/api/quotazioni/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';
import { createPreventivo, listPreventivi } from '@/lib/airtable.quotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

async function getEmailFromAuth(req: NextRequest): Promise<string | undefined> {
  const m = (req.headers.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i);
  if (m) {
    try {
      const decoded = await adminAuth().verifyIdToken(m[1], true);
      return decoded.email || decoded.firebase?.identities?.email?.[0] || undefined;
    } catch {}
  }
  const session = req.cookies.get('spst_session')?.value;
  if (session) {
    try {
      const decoded = await adminAuth().verifySessionCookie(session, true);
      return decoded.email || decoded.firebase?.identities?.email?.[0] || undefined;
    } catch {}
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);
  try {
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email') || undefined;
    const email = emailParam || (await getEmailFromAuth(req));
    const rows = await listPreventivi(email ? { email } : undefined);
    return NextResponse.json({ ok: true, rows }, { headers: cors });
  } catch (e: any) {
    console.error('GET /api/quotazioni error:', {
      message: e?.message,
      statusCode: e?.statusCode,
      airtable: e?.error,
    });
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
    const body = await req.json();

    // se non arriva, prendo l'email dall'autenticazione e la salvo in CreatoDaEmail
    if (!body.createdByEmail) {
      const email = await getEmailFromAuth(req);
      if (email) body.createdByEmail = email;
    }

    // normalizzo data ritiro (accetto varie chiavi)
    const ritiroRaw: string | Date | undefined =
      body.ritiroData ??
      body.dataRitiro ??
      body['Data Ritiro'] ??
      body.ritiro_date ??
      undefined;

    // normalizzo i colli: quantita/lunghezza/larghezza/altezza -> qty/l1_cm/l2_cm/l3_cm
    const normalizedColli = Array.isArray(body.colli)
      ? body.colli.map((c: any) => ({
          qty: c?.qty ?? c?.quantita ?? c?.quantity ?? 1,
          l1_cm: c?.l1_cm ?? c?.lunghezza_cm ?? c?.length_cm ?? c?.l ?? null,
          l2_cm: c?.l2_cm ?? c?.larghezza_cm ?? c?.width_cm ?? c?.w ?? null,
          l3_cm: c?.l3_cm ?? c?.altezza_cm ?? c?.height_cm ?? c?.h ?? null,
          peso_kg: c?.peso_kg ?? c?.peso ?? c?.weight_kg ?? c?.kg ?? null,
        }))
      : [];

    const created = await createPreventivo({
      createdByEmail: body.createdByEmail,
      customerEmail: body.customerEmail,
      valuta: body.valuta,
      ritiroData: ritiroRaw ? new Date(ritiroRaw).toISOString() : undefined,
      noteGeneriche: body.noteGeneriche ?? body.note ?? undefined,
      // nuovi:
      tipoSped: body.tipoSped,
      incoterm: body.incoterm,
      // parti & colli
      mittente: body.mittente,
      destinatario: body.destinatario,
      colli: normalizedColli,
    });

    return NextResponse.json(
      { ok: true, id: created.id, displayId: created.displayId },
      { headers: cors }
    );
  } catch (e: any) {
    console.error('POST /api/quotazioni error:', e);
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
