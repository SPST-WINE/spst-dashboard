// app/api/geo/reverse/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing GOOGLE_MAPS_API_KEY' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const language = searchParams.get('language') || 'it';

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('latlng', `${lat},${lng}`);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('language', language);

  const resp = await fetch(url.toString(), {
    // se la chiave ha ancora restrizioni referrer, inviamo un referrer lecito
    headers: { Referer: process.env.NEXT_PUBLIC_SITE_ORIGIN || 'https://app.spst.it' },
  });

  const json = await resp.json().catch(() => ({}));
  return NextResponse.json(json, { status: resp.status });
}
