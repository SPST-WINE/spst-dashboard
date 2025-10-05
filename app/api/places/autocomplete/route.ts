// app/api/places/autocomplete/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY; // chiave server-side
  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing GOOGLE_MAPS_API_KEY' }, { status: 500 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}

  const {
    input = '',
    languageCode = process.env.NEXT_PUBLIC_GOOGLE_MAPS_LANGUAGE || 'it',
    sessionToken,
  } = body || {};

  const payload = {
    input,
    languageCode,
    sessionToken,
    // tipi indirizzo; niente region strict per non “strozzare” i risultati
    includedPrimaryTypes: ['street_address', 'premise', 'route', 'subpremise'],
    // hint geografico (non vincolante) Italia
    locationBias: {
      circle: { center: { latitude: 41.87194, longitude: 12.56738 }, radius: 600000 },
    },
  };

  const resp = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat',
    },
    body: JSON.stringify(payload),
    // no-cors non serve qui; è server-to-server
  });

  const json = await resp.json().catch(() => ({}));
  return NextResponse.json(json, { status: resp.status });
}
