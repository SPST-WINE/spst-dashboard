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
  // Bearer token (Firebase ID token)
  const m = (req.headers.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i);
  if (m) {
    try {
      const decoded = await adminAuth().verifyIdToken(m[1], true);
      return decoded.email || (decoded.firebase?.identities as any)?.email?.[0] || undefined;
    } catch {}
  }
  // Session cookie
  const session = req.cookies.get('spst_session')?.value;
  if (session) {
    try {
      const decoded = await adminAuth().verifySessionCookie(session, true);
      return decoded.email || (decoded.firebase?.identities as any)?.email?.[0] || undefined;
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

    // Fallback email da auth se non passata dal client
    if (!body.createdByEmail) {
      const email = await getEmailFromAuth(req);
      if (email) body.createdByEmail = email;
    }
    if (!body.customerEmail) {
      body.customerEmail = body.createdByEmail;
    }

    const created = await createPreventivo({
      createdByEmail: body.createdByEmail,
      customerEmail: body.customerEmail,
      valuta: body.valuta ?? 'EUR',
      ritiroData: body.ritiroData,
      noteGeneriche: body.noteGeneriche,

      // nuovi campi richiesti
      tipoSped: body.tipoSped,     // 'B2B' | 'B2C' | 'Sample'
      incoterm: body.incoterm,     // 'DAP' | 'DDP' | 'EXW'

      mittente: body.mittente,
      destinatario: body.destinatario,
      colli: body.colli,
    });

    // include anche displayId (ID_Preventivo)
    return NextResponse.json(
      { ok: true, id: created.id, displayId: (created as any).displayId },
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
