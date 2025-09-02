// app/api/spedizioni/[id]/attachments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { auth } from '@/lib/firebase-admin';
import { attachFilesToSpedizione } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth
    const authz = req.headers.get('authorization') || '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: buildCorsHeaders() });
    }
    await auth.verifyIdToken(token);

    // Body: { fattura?: {url, filename?}[], packing?: {url, filename?}[] }
    const body = await req.json();
    const { fattura, packing } = body ?? {};

    await attachFilesToSpedizione(params.id, { fattura, packing });

    return NextResponse.json({ ok: true }, { headers: buildCorsHeaders() });
  } catch (e) {
    console.error('attachments error', e);
    return NextResponse.json({ error: 'internal' }, { status: 500, headers: buildCorsHeaders() });
  }
}
