// app/api/utenti/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function readOrigin(req: NextRequest) {
  return req.headers.get('origin') ?? undefined;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(readOrigin(req)),
  });
}

// GET /api/utenti?email=...
export async function GET(req: NextRequest) {
  const origin = readOrigin(req);
  const cors = buildCorsHeaders(origin);

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || undefined;

    const airtable: any = await import('@/lib/airtable').catch(() => ({}));
    const fn = airtable?.getUtenteByEmail;

    if (email && typeof fn === 'function') {
      const rec = await fn(email);
      // Rispondo in modo "compatibile": record singolo + fields + anche data:[] per retrocompatibilità
      return NextResponse.json(
        { ok: true, record: rec || null, fields: rec?.fields || null, data: rec ? [rec] : [] },
        { headers: cors }
      );
    }

    return NextResponse.json({ ok: true, record: null, fields: null, data: [] }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors },
    );
  }
}

// POST /api/utenti
// Accetta SIA { email, fields: {...} } SIA un body piatto { email, "Paese Mittente": "...", ... }
export async function POST(req: NextRequest) {
  const origin = readOrigin(req);
  const cors = buildCorsHeaders(origin);

  try {
    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body?.email;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'EMAIL_REQUIRED' },
        { status: 400, headers: cors },
      );
    }

    // Allowlist dei campi accettati
    const ALLOWED = new Set<string>([
      'Paese Mittente',
      'Mittente',
      'Città Mittente',
      'CAP Mittente',
      'Indirizzo Mittente',
      'Partita IVA Mittente',
      'Telefono Mittente', // 👈 telefono
    ]);

    // Normalizza: se non arriva "fields", estrai dal body piatto
    const incoming: Record<string, any> = body?.fields && typeof body.fields === 'object'
      ? body.fields
      : body;

    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(incoming)) {
      if (k === 'email') continue;
      if (ALLOWED.has(k)) fields[k] = v;
    }

    const airtable: any = await import('@/lib/airtable').catch(() => ({}));
    const fn = airtable?.upsertUtente;

    if (typeof fn === 'function') {
      const record = await fn(email, fields);
      return NextResponse.json({ ok: true, record }, { headers: cors });
    }

    return NextResponse.json(
      { ok: true, record: null, note: 'upsertUtente non implementato' },
      { headers: cors },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors },
    );
  }
}
