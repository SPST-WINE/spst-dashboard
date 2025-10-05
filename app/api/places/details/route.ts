// app/api/places/details/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing GOOGLE_MAPS_API_KEY' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('placeId');
  const sessionToken = searchParams.get('sessionToken') || '';
  const languageCode =
    searchParams.get('languageCode') || process.env.NEXT_PUBLIC_GOOGLE_MAPS_LANGUAGE || 'it';
  const regionCode =
    searchParams.get('regionCode') || process.env.NEXT_PUBLIC_GOOGLE_MAPS_REGION || 'IT';

  if (!placeId) {
    return NextResponse.json({ error: 'Missing placeId' }, { status: 400 });
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  url.searchParams.set('languageCode', languageCode);
  url.searchParams.set('regionCode', regionCode);
  if (sessionToken) url.searchParams.set('sessionToken', sessionToken);

  const resp = await fetch(url.toString(), {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'id,formattedAddress,addressComponents,location',
      // ✅ stesso workaround referrer
      'Referer': process.env.NEXT_PUBLIC_SITE_ORIGIN || 'https://app.spst.it',
    },
  });

  const json = await resp.json().catch(() => ({}));
  return NextResponse.json(json, { status: resp.status });
}
