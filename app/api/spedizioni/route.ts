// app/api/spedizioni/route.ts
import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { createSpedizioneWebApp, NewSpedizionePayload } from '@/lib/airtable';

export const runtime = 'nodejs'; // evita Edge (firebase-admin non supportato in Edge)

function corsHeaders(origin?: string) {
  const allowed = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const isAllowed = origin && allowed.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin! : allowed[0] || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  };
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin') || undefined;
  return new NextResponse(null, { headers: corsHeaders(origin) });
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin') || undefined;

  try {
    // Auth Firebase (Bearer idToken)
    const authz = req.headers.get('authorization') || '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : null;
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'No token' }),
        { status: 401, headers: corsHeaders(origin) },
      );
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token);
    const email = decoded.email;
    if (!email) {
      return new NextResponse(
        JSON.stringify({ error: 'No email in token' }),
        { status: 403, headers: corsHeaders(origin) },
      );
    }

    // Body
    const body = (await req.json()) as NewSpedizionePayload;

    // Validazioni minime
    if (!body || !body.tipoSped || !body.mittente || !body.destinatario) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: corsHeaders(origin) },
      );
    }

    // Crea record principale + figli (colli/PL)
    const created = await createSpedizioneWebApp(body);

    return new NextResponse(
      JSON.stringify({ ok: true, id: created.id }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } },
    );
  } catch (e: any) {
    console.error('POST /api/spedizioni error:', e);
    return new NextResponse(
      JSON.stringify({ error: e?.message || 'unknown error' }),
      { status: 500, headers: corsHeaders(origin) },
    );
  }
}
