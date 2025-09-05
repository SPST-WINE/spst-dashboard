// app/dashboard/quotazioni/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Collo = { qty?: number; l1_cm?: number | null; l2_cm?: number | null; l3_cm?: number | null; peso_kg?: number | null };
type Row = {
  id: string;
  displayId?: string;
  stato?: string;
  tipoSped?: string;
  incoterm?: string;
  valuta?: string;
  ritiroData?: string;
  noteGeneriche?: string;
  destination?: string;
  updatedAt?: string;
  mittente: any;
  destinatario: any;
  colli: Collo[];
};

export default function PreventivoDettaglioPage({ params }: { params: { id: string } }) {
  const [row, setRow] = useState<Row | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const r = await fetch(`/api/quotazioni/${encodeURIComponent(params.id)}`, { cache: 'no-store' });
        const j = await r.json();
        if (!r.ok || !j?.ok) throw new Error(j?.error || 'SERVER_ERROR');
        if (!abort) setRow(j.row as Row);
      } catch (e: any) {
        if (!abort) setErr(e?.message || 'Errore caricamento');
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [params.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Dettaglio preventivo</h1>
        <Link href="/dashboard/quotazioni" className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50">
          Torna alla lista
        </Link>
      </div>

      {loading && <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">Caricamento…</div>}
      {err && !loading && <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-700 text-sm">Errore: {err}</div>}
      {!loading && !err && row && (
        <>
          {/* Testata */}
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <div className="text-lg font-semibold">
                {row.displayId || row.id}
              </div>
              <div className="text-sm text-slate-500">Stato: <span className="font-medium text-slate-700">{row.stato || '—'}</span></div>
              <div className="text-sm text-slate-500">Tipo spedizione: <span className="font-medium text-slate-700">{row.tipoSped || '—'}</span></div>
              <div className="text-sm text-slate-500">Incoterm: <span className="font-medium text-slate-700">{row.incoterm || '—'}</span></div>
              <div className="text-sm text-slate-500">Valuta: <span className="font-medium text-slate-700">{row.valuta || '—'}</span></div>
              <div className="text-sm text-slate-500">Data ritiro: <span className="font-medium text-slate-700">{row.ritiroData || '—'}</span></div>
            </div>
          </div>

          {/* Parti */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4">
              <h2 className="mb-2 text-base font-semibold text-spst-blue">Mittente</h2>
              <div className="text-sm">
                <div className="font-medium text-slate-800">{row.mittente?.ragioneSociale || '—'}</div>
                <div className="text-slate-600">{row.mittente?.indirizzo || '—'}</div>
                <div className="text-slate-600">
                  {[row.mittente?.cap, row.mittente?.citta, row.mittente?.paese].filter(Boolean).join(' ') || '—'}
                </div>
                <div className="text-slate-600">Tel: {row.mittente?.telefono || '—'}</div>
                <div className="text-slate-600">Tax ID: {row.mittente?.taxId || '—'}</div>
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <h2 className="mb-2 text-base font-semibold text-spst-blue">Destinatario</h2>
              <div className="text-sm">
                <div className="font-medium text-slate-800">{row.destinatario?.ragioneSociale || '—'}</div>
                <div className="text-slate-600">{row.destinatario?.indirizzo || '—'}</div>
                <div className="text-slate-600">
                  {[row.destinatario?.cap, row.destinatario?.citta, row.destinatario?.paese].filter(Boolean).join(' ') || '—'}
                </div>
                <div className="text-slate-600">Tel: {row.destinatario?.telefono || '—'}</div>
                <div className="text-slate-600">Tax ID: {row.destinatario?.taxId || '—'}</div>
              </div>
            </div>
          </div>

          {/* Colli */}
          <div className="rounded-2xl border bg-white p-4">
            <h2 className="mb-3 text-base font-semibold text-spst-blue">Colli</h2>
            {(!row.colli || row.colli.length === 0) ? (
              <div className="text-sm text-slate-500">Nessun collo presente.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Qty</th>
                      <th className="px-3 py-2 text-left font-medium">Lato 1 (cm)</th>
                      <th className="px-3 py-2 text-left font-medium">Lato 2 (cm)</th>
                      <th className="px-3 py-2 text-left font-medium">Lato 3 (cm)</th>
                      <th className="px-3 py-2 text-left font-medium">Peso (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.colli.map((c, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{c.qty ?? 1}</td>
                        <td className="px-3 py-2">{c.l1_cm ?? '—'}</td>
                        <td className="px-3 py-2">{c.l2_cm ?? '—'}</td>
                        <td className="px-3 py-2">{c.l3_cm ?? '—'}</td>
                        <td className="px-3 py-2">{c.peso_kg ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="rounded-2xl border bg-white p-4">
            <h2 className="mb-2 text-base font-semibold text-spst-blue">Note</h2>
            <div className="text-sm whitespace-pre-wrap">{row.noteGeneriche || '—'}</div>
          </div>
        </>
      )}
    </div>
  );
}
