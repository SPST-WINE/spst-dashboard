// components/SpedizioniClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { getIdToken } from '@/lib/firebase-client-auth';

type Row = { id: string; [k: string]: any };

export default function SpedizioniClient() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const emailLS =
          (typeof window !== 'undefined' && localStorage.getItem('userEmail')?.trim()) || '';
        const token = await getIdToken().catch(() => undefined);

        const url = emailLS
          ? `/api/spedizioni?email=${encodeURIComponent(emailLS)}`
          : `/api/spedizioni`;

        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: 'no-store',
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const j = await res.json();
        const list: Row[] = Array.isArray(j?.rows)
          ? j.rows
          : Array.isArray(j?.data)
          ? j.data
          : [];

        if (!cancelled) setRows(list);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Errore di caricamento');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function getDisplayId(r: Row) {
    return (
      r['ID Spedizione'] ||
      r['ID SPST'] ||
      r['ID Spedizione (custom)'] ||
      r.id
    );
  }

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return rows;

    return rows.filter((r) => {
      const id = String(getDisplayId(r)).toLowerCase();
      const dRS = String(
        r['Destinatario - Ragione Sociale'] || r['Destinatario'] || ''
      ).toLowerCase();
      const dCity = String(
        r['Destinatario - Città'] || r['Città Destinatario'] || ''
      ).toLowerCase();
      const dCountry = String(
        r['Destinatario - Paese'] || r['Paese Destinatario'] || ''
      ).toLowerCase();

      return (
        id.includes(k) || dRS.includes(k) || dCity.includes(k) || dCountry.includes(k)
      );
    });
  }, [rows, q]);

  if (err) {
    return <div className="text-sm text-rose-700">Errore: {err}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <input
          placeholder="Cerca per ID, destinatario, città, paese…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-xl rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
        />
        <div className="text-sm text-slate-500">
          {loading ? 'Caricamento…' : `${filtered.length} risultati`}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Recupero spedizioni…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-slate-500">0 risultati</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => {
            const id = getDisplayId(r);
            const stato = r['Stato'] || '—';
            const destRS = r['Destinatario - Ragione Sociale'] || r['Destinatario'] || '—';
            const destCity = r['Destinatario - Città'] || r['Città Destinatario'] || '';
            const destCountry = r['Destinatario - Paese'] || r['Paese Destinatario'] || '';
            const ritiro = r['Ritiro - Data'] || r['Ritiro Data'] || '—';

            return (
              <div key={r.id} className="rounded-xl border bg-white p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-mono font-medium">{id}</div>
                  <div className="rounded-md border px-2 py-0.5 text-xs">{stato}</div>
                </div>

                <div className="mt-2 text-slate-700">
                  <span className="text-slate-500">Destinatario: </span>
                  {destRS}
                  {destCity ? ` — ${destCity}` : ''}
                  {destCountry ? `, ${destCountry}` : ''}
                </div>

                <div className="mt-1 text-slate-700">
                  <span className="text-slate-500">Ritiro: </span>
                  {ritiro}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
