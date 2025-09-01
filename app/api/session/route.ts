// app/api/check-user/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { getUtenteByEmail } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(origin),
  });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  const cors = buildCorsHeaders(origin);

  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email) {
      return NextResponse.json({ ok: false, error: 'EMAIL_REQUIRED' }, { status: 400, headers: cors });
    }

    if (process.env.DEBUG_CHECK_USER === '1') {
      return NextResponse.json({ ok: true, exists: true }, { headers: cors });
    }

    const record = await getUtenteByEmail(email);
    return NextResponse.json(
      { ok: true, exists: !!record, recordId: record?.id ?? null },
      { headers: cors },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors },
    );
  }
}
