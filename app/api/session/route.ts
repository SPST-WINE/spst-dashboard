// app/api/utenti/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getUtenteByEmail, upsertUtente } from '@/lib/airtable';
import { buildCorsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders() });
}

// GET /api/utenti?email=...
export async function GET(req: NextRequest) {
  const cors = buildCorsHeaders();
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400, headers: cors });
    }
    const record = await getUtenteByEmail(email);
    return NextResponse.json({ record }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: buildCorsHeaders() },
    );
  }
}

// POST /api/utenti  { email: string, fields?: Record<string, any> }
export async function POST(req: Request) {
  const cors = buildCorsHeaders();
  try {
    const body = (await req.json()) as { email?: string; fields?: Record<string, any> };
    const email = body?.email?.trim();
    const fields = body?.fields || {};
    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400, headers: cors });
    }
    // FIX: pass (email, fields) as separate args (do NOT pass an object)
    const record = await upsertUtente(email, fields);
    return NextResponse.json({ record }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors },
    );
  }
}
