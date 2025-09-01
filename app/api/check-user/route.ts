// app/api/check-user/route.ts
import { NextResponse } from 'next/server';
import { getAirtableUserByEmail } from '@/lib/airtable';
import { buildCorsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

function guessEnabled(fields: Record<string, any>): boolean {
  // Nomi possibili del campo "abilitazione"
  const candidates = [
    'Abilitato',
    'abilitato',
    'Enabled',
    'enabled',
    'Attivo',
    'attivo',
    'Accesso',
    'Accesso abilitato',
    'accessEnabled',
  ];

  let found = false;
  let value: any = undefined;

  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      found = true;
      value = fields[key];
      break;
    }
  }

  // Se il campo NON esiste -> di default è ABILITATO
  if (!found) return true;

  // Se il campo esiste, consideriamo "non abilitato" solo se è esplicitamente false/0/"no"
  if (value === false || value === 0) return false;
  if (typeof value === 'string' && value.trim().toLowerCase() === 'no') return false;

  // Tutto il resto (true, "si", "yes", checkbox spuntato, testo qualunque) -> abilitato
  return true;
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) });
}

export async function POST(req: Request) {
  const cors = buildCorsHeaders(req);
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400, headers: cors });
    }

    const rec = await getAirtableUserByEmail(email);
    if (!rec) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: cors });
    }

    const enabled = guessEnabled(rec.fields || {});
    return NextResponse.json(
      { ok: true, id: rec.id, fields: rec.fields, enabled },
      { headers: cors }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: e?.message || 'unknown' },
      { status: 500, headers: cors }
    );
  }
}

export async function GET(req: Request) {
  const cors = buildCorsHeaders(req);
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim();
    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400, headers: cors });
    }

    const rec = await getAirtableUserByEmail(email);
    if (!rec) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: cors });
    }

    const enabled = guessEnabled(rec.fields || {});
    return NextResponse.json(
      { ok: true, id: rec.id, fields: rec.fields, enabled },
      { headers: cors }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: e?.message || 'unknown' },
      { status: 500, headers: cors }
    );
  }
}
