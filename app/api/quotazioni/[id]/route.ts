import { NextResponse } from 'next/server';
import { getPreventivo as getPreventivoAT } from '@/lib/airtable.quotes';

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const raw = ctx?.params?.id ?? '';
  const id = decodeURIComponent(raw);

  try {
    const row = await getPreventivoAT(id);
    if (!row) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', id },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, row }, { status: 200 });
  } catch (e: any) {
    console.error('[api/quotazioni/[id]] GET error', {
      id,
      message: e?.message,
      statusCode: e?.statusCode,
    });
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
