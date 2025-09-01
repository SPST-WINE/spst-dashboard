// app/api/spedizioni/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

// ---- CORS helpers -----------------------------------------------------------
const ALLOWED = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function buildCorsHeaders(origin: string | null) {
  const isAllowed = origin && (ALLOWED.length === 0 || ALLOWED.includes(origin));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin! : '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

function withCors(req: NextRequest, res: NextResponse) {
  const headers = buildCorsHeaders(req.headers.get('origin'));
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function OPTIONS(req: NextRequest) {
  return withCors(req, new NextResponse(null, { status: 204 }));
}

// ---- POST /api/spedizioni ---------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const { idToken, payload } = await req.json();

    if (!idToken) {
      return withCors(req, NextResponse.json({ error: 'No token' }, { status: 401 }));
    }

    // 👇 FIX: adminAuth è un oggetto, NON va chiamato come funzione
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email;
    if (!email) {
      return withCors(req, NextResponse.json({ error: 'No email on token' }, { status: 403 }));
    }

    if (!payload) {
      return withCors(req, NextResponse.json({ error: 'Missing payload' }, { status: 400 }));
    }

    // TODO: scrittura su Airtable (collega qui la tua createSpedizione(payload, email))
    // const record = await createSpedizione(payload, email);

    return withCors(
      req,
      NextResponse.json({
        ok: true,
        by: email,
        // record,
      })
    );
  } catch (e: any) {
    return withCors(
      req,
      NextResponse.json({ error: e?.message || 'server error' }, { status: 500 })
    );
  }
}
