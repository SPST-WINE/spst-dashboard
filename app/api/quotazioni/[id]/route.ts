import { NextResponse } from 'next/server';
import { getPreventivo } from '@/lib/airtable.quotes';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = decodeURIComponent((params?.id || '').trim());
  try {
    const data = await getPreventivo(id);
    if (!data) return NextResponse.json({ error: 'NOT_FOUND', id }, { status: 404 });
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('[api/quotazioni/[id]]', id, e?.message || e);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
