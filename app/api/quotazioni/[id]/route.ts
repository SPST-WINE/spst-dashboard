import { NextResponse } from 'next/server';
import { getPreventivo } from '@/lib/airtable.quotes';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = decodeURIComponent((params?.id || '').trim());
  const wantDebug = new URL(req.url).searchParams.get('debug') === '1';
  const debug: any[] = [];

  try {
    const data = await getPreventivo(id, wantDebug ? debug : undefined);

    if (!data) {
      if (wantDebug) console.warn('[api GET /quotazioni/:id] NOT_FOUND', { id, debug });
      return NextResponse.json({ error: 'NOT_FOUND', id, debug: wantDebug ? debug : undefined }, { status: 404 });
    }

    if (wantDebug) console.log('[api GET /quotazioni/:id] OK', { id, recId: data.id, debug });
    return NextResponse.json(wantDebug ? { ...data, debug } : data);
  } catch (e: any) {
    console.error('[api GET /quotazioni/:id] ERROR', id, e?.message || e);
    return NextResponse.json({ error: 'SERVER_ERROR', message: e?.message }, { status: 500 });
  }
}
