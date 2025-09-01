// app/api/spedizioni/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { createSpedizioneWebApp, type SpedizionePayload } from '@/lib/airtable';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Preflight CORS
 */
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(origin),
  });
}

/**
 * Elenco spedizioni per la dashboard (GET)
 * - Verifica opzionale idToken da Authorization: Bearer <token>
 * - Se presente l'email nel token, prova a filtrare le spedizioni per quell'utente
 * - Import dinamico per compat con diverse funzioni del tuo modulo Airtable
 */
export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    // Auth opzionale (se fai chiamate autenticate dal client con authedJson)
    const authz = req.headers.get('authorization');
    const idToken = authz?.startsWith('Bearer ') ? authz.slice(7) : undefined;

    let email: string | undefined;
    if (idToken) {
      const decoded = await adminAuth().verifyIdToken(idToken);
      email = decoded?.email || undefined;
    }

    // Import dinamico per evitare errori di build se i nomi export differiscono
    const airtableMod: any = await import('@/lib/airtable');

    let data: any[] = [];
    if (typeof airtableMod.listSpedizioniByEmail === 'function') {
      data = await airtableMod.listSpedizioniByEmail(email);
    } else if (typeof airtableMod.listSpedizioni === 'function') {
      // molte codebase usano una firma con opzioni { email?: string }
      data = await airtableMod.listSpedizioni({ email });
    } else if (typeof airtableMod.getSpedizioni === 'function') {
      data = await airtableMod.getSpedizioni(email);
    } else {
      // Fallback chiaro se nessuna funzione di listing è disponibile
      throw new Error(
        'Funzione di listing non trovata in "@/lib/airtable". ' +
          'Aggiungi listSpedizioniByEmail(email) o listSpedizioni({ email }).'
      );
    }

    return NextResponse.json(data, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}

/**
 * Creazione spedizione (POST)
 * - Legge idToken da Authorization per settare createdByEmail
 * - Passa il payload ad Airtable
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    // Auth: idToken via Authorization: Bearer ... (o cookie sessione validato a monte)
    const authz = req.headers.get('authorization');
    const idToken = authz?.startsWith('Bearer ') ? authz.slice(7) : undefined;

    let email: string | undefined;
    if (idToken) {
      const decoded = await adminAuth().verifyIdToken(idToken);
      email = decoded?.email || undefined;
    }

    const body = (await req.json()) as SpedizionePayload;
    const payload: SpedizionePayload = {
      ...body,
      createdByEmail: email,
    };

    const result = await createSpedizioneWebApp(payload);
    return NextResponse.json({ ok: true, id: result.id }, { headers: cors });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}
