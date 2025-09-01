// app/api/check-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAirtableUserByEmail } from '@/lib/airtable';

export const runtime = 'nodejs';        // evita Edge (env + logging affidabili)
export const dynamic = 'force-dynamic'; // disattiva cache

type Body = { email?: string };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'MISSING_EMAIL' }, { status: 400 });
    }

    const rec = await getAirtableUserByEmail(email);

    if (!rec) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    // restituisci solo campi non sensibili
    return NextResponse.json(
      {
        exists: true,
        id: rec.id,
        fields: {
          email,
          ragioneSociale: rec.fields['A_Mittente'] ?? rec.fields['Ragione sociale'] ?? null,
          paese: rec.fields['A_Paese Mittente'] ?? rec.fields['Paese'] ?? null,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[check-user] ERROR', err?.message || err);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err?.message ?? 'Unknown error' },
      { status: 500 },
    );
  }
}
