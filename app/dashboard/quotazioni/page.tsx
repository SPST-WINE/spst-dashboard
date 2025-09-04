// app/dashboard/quotazioni/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ReceiptText, FilePlus2, Clock, BadgeCheck, AlertCircle, Ban } from 'lucide-react';
import { getIdToken } from '@/lib/firebase-client-auth';

type QuoteRow = {
  id: string;
  [k: string]: any; // campi Airtable dinamici
};

function StatusBadge({ s }: { s?: string }) {
  const v = (s || '').toLowerCase();
  const map =
    v.includes('accett') ? { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Icon: BadgeCheck, label: 'Accettato' } :
    v.includes('pubbl')  ? { cls: 'bg-blue-50 text-blue-700 ring-blue-200', Icon: Clock, label: 'Pubblicato' } :
    v.includes('scad')   ? { cls: 'bg-amber-50 text-amber-700 ring-amber-200', Icon: AlertCircle, label: 'Scaduto' } :
    v.includes('annul')  ? { cls: 'bg-rose-50 text-rose-700 ring-rose-200', Icon: Ban, label: 'Annullato' } :
                           { cls: 'bg-slate-50 text-slate-700 ring-slate-200', Icon: Clock, label: 'Bozza' };
  const I = map.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ring-1 ${map.cls}`}>
      <I className="h-3.5 w-3.5" />
      {map.label}
    </span>
  );
}

export default function QuotazioniPage() {
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const t = await getIdToken();
        const r = await fetch('/api/quotazioni', {
          headers: t ? { Authorization: `Bearer ${t}` } : undefined,
          cache: 'no-store',
        });
        const j = await r.json();
        if (!abort && j?.ok) setRows(Array.isArray(j.rows) ? j.rows : []);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Quotazioni</h1>
          <p className="text-slate-500 text-sm mt-1">
            Crea preventivi e tieni traccia di quelli inviati ai clienti.
          </p>
        </div>
        <Link
          href="/dashboard/quotazioni/nuova"
          className="inline-flex items-center gap-2 rounded-lg bg-[#1c3e5e] px-3 py-2 text-sm text-white hover:opacity-95"
        >
          <FilePlus2 className="h-4 w-4" />
          Nuova quotazione
        </Link>
      </header>

      <section className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#f7911e]">Le mie quotazioni</h3>
          <div className="text-xs text-slate-500 inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {loading ? 'caricamento…' : 'aggiornato adesso'}
          </div>
        </div>

        {(!rows || rows.length === 0) ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-slate-600">Non hai ancora creato nessuna quotazione.</p>
            <div className="mt-3">
              <Link
                href="/dashboard/quotazioni/nuova"
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-[#1c3e5e] hover:bg-slate-50"
              >
                <ReceiptText className="h-4 w-4" />
                Crea la prima quotazione
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-2 py-2 font-medium">Riferimento</th>
                  <th className="px-2 py-2 font-medium">Destinazione</th>
                  <th className="px-2 py-2 font-medium">Stato</th>
                  <th className="px-2 py-2 font-medium">Ultimo aggiornamento</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id} className="text-slate-800">
                    <td className="px-2 py-2">{r['ID Preventivo'] || r['Slug_Pubblico'] || r.id}</td>
                    <td className="px-2 py-2">
                      {r['Destinatario_Citta'] || '—'}{r['Destinatario_Paese'] ? ` (${r['Destinatario_Paese']})` : ''}
                    </td>
                    <td className="px-2 py-2">
                      <StatusBadge s={r['Stato']} />
                    </td>
                    <td className="px-2 py-2">{r['Last Modified'] || r['Ultimo Aggiornamento'] || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
