// app/api/places/autocomplete/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing GOOGLE_MAPS_API_KEY' }, { status: 500 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}

  const languageCode = body?.languageCode || process.env.NEXT_PUBLIC_GOOGLE_MAPS_LANGUAGE || 'it';
  const sessionToken = body?.sessionToken || String(Date.now());
  const input = body?.input || '';

  // ⚠️ raggio ≤ 50.000m
  const payload = {
    input,
    languageCode,
    sessionToken,
    includedPrimaryTypes: ['street_address', 'premise', 'route', 'subpremise'],
    // Hint geografico non vincolante (Italia) — 50 km max
    locationBias: {
      circle: { center: { latitude: 41.87194, longitude: 12.56738 }, radius: 50000 },
    },
  };

  const resp = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat',
      // ✅ workaround se la chiave è limitata per referrer HTTP
      'Referer': process.env.NEXT_PUBLIC_SITE_ORIGIN || 'https://app.spst.it',
    },
    body: JSON.stringify(payload),
  });

  const json = await resp.json().catch(() => ({}));
  return NextResponse.json(json, { status: resp.status });
}
