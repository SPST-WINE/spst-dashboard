import type { NextApiRequest, NextApiResponse } from 'next';
import { getPreventivo } from '@/lib/airtable.quotes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = decodeURIComponent(String(req.query.id ?? '')).trim();
  if (req.method !== 'GET') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  try {
    const data = await getPreventivo(id);
    if (!data) return res.status(404).json({ error: 'NOT_FOUND', id });
    return res.status(200).json(data);
  } catch (e: any) {
    console.error('[api/quotazioni/[id]]', id, e?.message || e);
    return res.status(500).json({ error: 'SERVER_ERROR' });
  }
}
