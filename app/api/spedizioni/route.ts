// app/api/spedizioni/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from '@/lib/cors';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- helpers ---------------------------------------------------------------

async function getEmailFromAuth(req: NextRequest): Promise<string | undefined> {
  const authz = req.headers.get('authorization');
  const idToken = authz?.startsWith('Bearer ') ? authz.slice(7) : undefined;
  if (!idToken) return undefined;

  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    return decoded?.email || undefined;
  } catch (err) {
    // token invalido/scaduto non deve causare 500
    console.warn('[api/spedizioni] verifyIdToken failed:', (err as any)?.message);
    return undefined;
  }
}

async function getAirtableCreateFn() {
  const airtableMod: any = await import('@/lib/airtable');
  // prova i nomi funzione più comuni
  const fn =
    airtableMod.createSpedizioneWebApp ||
    airtableMod.createSpedizione ||
    airtableMod.upsertSpedizione;

  if (typeof fn !== 'function') {
    throw new Error(
      'Funzione di creazione spedizione non trovata in "@/lib/airtable". ' +
        'Esporta createSpedizioneWebApp(payload) oppure createSpedizione(payload).'
    );
  }
  return fn as (payload: any) => Promise<{ id: string } | any>;
}

// --- CORS preflight --------------------------------------------------------

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

// --- GET: elenco spedizioni (se disponibile nel modulo airtable) ----------

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const email = await getEmailFromAuth(req);
    const airtableMod: any = await import('@/lib/airtable');

    let data: any[] = [];
    if (typeof airtableMod.listSpedizioniByEmail === 'function') {
      data = await airtableMod.listSpedizioniByEmail(email);
    } else if (typeof airtableMod.listSpedizioni === 'function') {
      data = await airtableMod.listSpedizioni({ email });
    } else if (typeof airtableMod.getSpedizioni === 'function') {
      data = await airtableMod.getSpedizioni(email);
    } else {
      // Non bloccare: ritorna array vuoto con messaggio
      return NextResponse.json(
        { ok: true, data: [], note: 'Nessuna funzione di listing trovata in lib/airtable' },
        { headers: cors }
      );
    }

    return NextResponse.json({ ok: true, data }, { headers: cors });
  } catch (e: any) {
    console.error('[api/spedizioni][GET] error:', e);
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500, headers: cors }
    );
  }
}

// --- POST: crea spedizione -------------------------------------------------

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') ?? undefined;
  const cors = buildCorsHeaders(origin);

  try {
    const email = await getEmailFromAuth(req);
    const body: any = await req.json();

    // Non tipizziamo rigidamente il body per evitare 500 lato server:
    // aggiungiamo solo createdByEmail se disponibile.
    const payload = email ? { ...body, createdByEmail: email } : body;

    const createFn = await getAirtableCreateFn();
    const result = await createFn(payload);

    // normalizziamo l'output per il client
    const id = typeof result === 'object' && result?.id ? result.id : String(result);
    return NextResponse.json({ ok: true, id }, { headers: cors });
  } catch (e: any) {
    console.error('[api/spedizioni][POST] error:', e);
    // Propaga il messaggio reale se disponibile (es. errori campi Airtable)
    const msg =
      e?.message ||
      e?.error ||
      (typeof e === 'string' ? e : 'SERVER_ERROR');
    return NextResponse.json({ ok: false, error: msg }, { status: 500, headers: cors });
  }
}
