// app/api/spedizioni/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';
import type { SpedizionePayload } from '@/lib/airtable'; // TYPE-ONLY (no runtime import!)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function originOf(req: NextRequest) {
  return req.headers.get('origin') ?? undefined;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(originOf(req)),
  });
}

export async function GET(req: NextRequest) {
  const cors = buildCorsHeaders(originOf(req));
  try {
    // opzionale: auth per filtrare per email
    const authz = req.headers.get('authorization');
    const idToken = authz?.startsWith('Bearer ') ? authz.slice(7) : undefined;
    let email: string | undefined;
    if (idToken) {
      const decoded = await adminAuth().verifyIdToken(idToken);
      email = decoded?.email || undefined;
    }

    // ⬇️ IMPORT DINAMICO: evita di caricare Airtable in fase di build
    const airtable: any = await import('@/lib/airtable');

    let data: any[] = [];
    if (typeof airtable.listSpedizioniByEmail === 'function') {
      data = await airtable.listSpedizioniByEmail(email);
    } else if (typeof airtable.listSpedizioni === 'function') {
      data = await airtable.listSpedizioni({ email });
    } else if (typeof airtable.getSpedizioni === 'function') {
      data = await airtable.getSpedizioni(email);
    } else {
      throw new Error(
        'Nessuna funzione di listing trovata in "@/lib/airtable".'
      );
    }

    // Lo storico client si aspetta un array “puro”
    return NextResponse.json(data, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(originOf(req));
  try {
    // Auth opzionale per createdByEmail
    const authz = req.headers.get('authorization');
    const idToken = authz?.startsWith('Bearer ') ? authz.slice(7) : undefined;
    let email: string | undefined;
    if (idToken) {
      const decoded = await adminAuth.verifyIdToken(idToken);
      email = decoded?.email || undefined;
    }

    const body = (await req.json()) as SpedizionePayload;

    // ⬇️ IMPORT DINAMICO: evita inizializzazioni Airtable a build-time
    const { createSpedizioneWebApp }: any = await import('@/lib/airtable');

    if (typeof createSpedizioneWebApp !== 'function') {
      throw new Error('createSpedizioneWebApp non è esportata da "@/lib/airtable".');
    }

    const result = await createSpedizioneWebApp({
      ...body,
      createdByEmail: email,
    });

    return NextResponse.json({ ok: true, id: result.id }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
