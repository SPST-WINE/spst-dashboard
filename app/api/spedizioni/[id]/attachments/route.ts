// app/api/spedizioni/[id]/attachments/route.ts
import { NextResponse } from 'next/server';
import { attachFilesToSpedizione, type Att } from '@/lib/airtable';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  fattura?: Att[];
  packing?: Att[];
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing record id' }, { status: 400 });
    }

    const body = (await req.json()) as Body;

    // validazione soft
    const isArr = (a: any) => Array.isArray(a) && a.every(x => x && typeof x.url === 'string');
    const fattura = isArr(body.fattura) ? (body.fattura as Att[]) : undefined;
    const packing = isArr(body.packing) ? (body.packing as Att[]) : undefined;

    await attachFilesToSpedizione(id, { fattura, packing });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message || 'ERR_ATTACH';
    // log server-side
    console.error('[attachments] error:', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
