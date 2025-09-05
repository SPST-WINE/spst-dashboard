// app/api/quotazioni/[id]/route.ts
// ───────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { getPreventivo } from '@/lib/airtable.quotes';

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const id = decodeURIComponent(ctx?.params?.id ?? '').trim();

  try {
    const row = await getPreventivo(id);
    if (!row) {
      return NextResponse.json({ ok: false, error: 'NOT_FOUND', id }, { status: 404 });
    }
    return NextResponse.json({ ok: true, row }, { status: 200 });
  } catch (err: any) {
    console.error('[api/quotazioni/[id]]', err?.message || err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
