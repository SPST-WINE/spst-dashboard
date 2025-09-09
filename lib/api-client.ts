// lib/api-client.ts
'use client';

import { getIdToken } from '@/lib/firebase-client-auth';

export type SortKey = 'created_desc' | 'ritiro_desc' | 'dest_az' | 'status';

export async function getMySpedizioni(opts?: { q?: string; sort?: SortKey }) {
  const qs = new URLSearchParams();
  if (opts?.q) qs.set('q', opts.q);
  if (opts?.sort) qs.set('sort', opts.sort);

  // 1) prova con Bearer token (email dal JWT lato server)
  const token = await getIdToken().catch(() => undefined);
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // 2) fallback retro-compatibile
    const email =
      (typeof window !== 'undefined' && localStorage.getItem('userEmail')) || '';
    if (email) qs.set('email', email);
  }

  const res = await fetch(`/api/spedizioni?${qs.toString()}`, {
    headers,
    cache: 'no-store',
  });

  if (!res.ok) return [];
  const json = await res.json();
  return (json?.rows as any[]) || [];
}
