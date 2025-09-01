// lib/cors.ts
export function buildCorsHeaders(req: Request) {
  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const reqOrigin = req.headers.get('origin') || '*';
  const allow =
    origins.length === 0 || origins.includes('*') || origins.includes(reqOrigin)
      ? reqOrigin
      : origins[0];

  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}
