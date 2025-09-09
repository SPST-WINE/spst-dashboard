'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import { getIdToken } from '@/lib/firebase-client-auth';

type Row = { id: string; fields: Record<string, any>; _createdTime?: string };

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export default function SpedizioniPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState<string>('');
  const [sort, setSort] = useState<'created_desc' | 'ritiro_desc' | 'dest_az' | 'status'>('created_desc');
  const abortRef = useRef<AbortController | null>(null);

  async function fetchRows(opts?: { q?: string; sort?: string }) {
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts?.q) params.set('q', opts.q);
      if (opts?.sort) params.set('sort', opts.sort);

      // Prova con Authorization: Bearer <idToken>
      const token = await getIdToken().catch(() => undefined);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      else {
        // fallback: email da localStorage (retro-compatibilità)
        const email = (typeof window !== 'undefined' && localStorage.getItem('userEmail')) || '';
        if (email) params.set('email', email);
      }

      const res = await fetch(`/api/spedizioni?${params.toString()}`, {
        headers,
        cache: 'no-store',
        signal: ac.signal,
      });
      const json = await res.json();
      if (json?.ok) setRows(json.rows || []);
      else setRows([]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // first load
  useEffect(() => {
    fetchRows({ sort });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ricerca con piccolo debounce
  useEffect(() => {
    const t = setTimeout(() => fetchRows({ q, sort }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort]);

  const visible = rows;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Le mie spedizioni</h1>
          <p className="text-slate-500 text-sm mt-1">Lista spedizioni filtrata per il tuo account.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border px-2.5 py-2 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="created_desc">Data creazione (nuove prima)</option>
            <option value="ritiro_desc">Data ritiro (più recenti)</option>
            <option value="dest_az">Destinazione (A→Z)</option>
            <option value="status">Stato</option>
          </select>
        </div>
      </header>

      {/* search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca: destinatario, città, paese, ID..."
          className="w-full rounded-xl border bg-white pl-9 pr-3 py-2.5 text-sm"
        />
      </div>

      {/* list */}
      <div className="rounded-2xl border bg-white">
        {loading ? (
          <div className="p-8 flex items-center gap-2 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Caricamento spedizioni…
          </div>
        ) : visible.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">Nessuna spedizione trovata.</div>
        ) : (
          <ul className="divide-y">
            {visible.map((r) => {
              const f = r.fields || {};
              const ref = f['ID Spedizione'] || r.id;
              const destCity = f['Destinatario - Città'] || '';
              const destCountry = f['Destinatario - Paese'] || '';
              const stato = f['Tracking Status'] || f['Stato'] || '—';
              const rit = f['Ritiro - Data'] ? new Date(f['Ritiro - Data']) : null;

              return (
                <li key={r.id} className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{ref}</div>
                      <div className="text-sm text-slate-500">
                        {destCity}
                        {destCountry ? ` (${destCountry})` : ''} · {stato}
                        {rit ? ` · ritiro ${format(rit, 'd MMM yyyy', { locale: it })}` : ''}
                      </div>
                    </div>
                    <Link
                      href="/dashboard/spedizioni"
                      className="inline-flex items-center gap-1 text-[#1c3e5e] hover:underline text-sm whitespace-nowrap"
                    >
                      Dettagli <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
