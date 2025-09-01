// app/dashboard/spedizioni/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSpedizioni } from '@/lib/api';
import { getIdToken } from '@/lib/firebase-client-auth';

type Row = {
  id: string;
  Stato?: string;
  Corriere?: string;
  Tracking?: string;
  CreatedAt?: string;
  Destinatario?: string;
};

function Badge({ text }: { text?: string }) {
  const t = (text || '').toLowerCase();
  const cls =
    t === 'nuova'
      ? 'bg-amber-100 text-amber-800'
      : t === 'in transito'
      ? 'bg-blue-100 text-blue-800'
      : t === 'evasa'
      ? 'bg-emerald-100 text-emerald-800'
      : t === 'consegnata'
      ? 'bg-emerald-100 text-emerald-800'
      : t === 'annullata'
      ? 'bg-rose-100 text-rose-800'
      : 'bg-slate-100 text-slate-800';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {text || '—'}
    </span>
  );
}

const hcell = 'px-3 py-2 text-left text-xs font-semibold text-slate-600';
const cell = 'px-3 py-2 text-sm text-slate-800';

export default function SpedizioniPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSpedizioni(getIdToken);
        // Normalizzazione difensiva (evita .slice su valori non stringa)
        const list: Row[] = Array.isArray(data)
          ? data.map((r: any) => {
              const fields = r?.fields ?? r;
              const id =
                r?.id ??
                r?.recordId ??
                // fallback sicuro ad una stringa
                String(fields?.ID || fields?.Id || crypto.randomUUID());

              const take = (v: any) => (v == null ? undefined : String(v));

              return {
                id: String(id),
                Stato: take(fields?.Stato ?? fields?.status),
                Corriere: take(fields?.Corriere ?? fields?.carrier),
                Tracking: take(fields?.['Tracking Number'] ?? fields?.tracking),
                CreatedAt: take(fields?.CreatedAt ?? fields?.['Created At'] ?? fields?.createdAt),
                Destinatario:
                  take(
                    fields?.['Destinatario – Ragione sociale'] ??
                      fields?.Destinatario ??
                      fields?.recipient_name
                  ) || undefined,
              };
            })
          : [];
        setRows(list);
      } catch (e: any) {
        setErr(e?.message || 'Errore caricamento');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Le mie spedizioni</h2>
        <div className="flex gap-2">
          <Link
            href="/dashboard/nuova/vino"
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            + Nuova (vino)
          </Link>
          <Link
            href="/dashboard/nuova/altro"
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            + Nuova (altro)
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50">
              <th className={hcell}>ID</th>
              <th className={hcell}>Destinatario</th>
              <th className={hcell}>Stato</th>
              <th className={hcell}>Corriere</th>
              <th className={hcell}>Tracking</th>
              <th className={hcell}>Creata il</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className={cell} colSpan={6}>
                  Caricamento…
                </td>
              </tr>
            )}
            {err && !loading && (
              <tr>
                <td className={cell} colSpan={6}>
                  <span className="text-rose-600">Errore: {err}</span>
                </td>
              </tr>
            )}
            {!loading && !err && rows.length === 0 && (
              <tr>
                <td className={cell} colSpan={6}>
                  Nessuna spedizione trovata.
                </td>
              </tr>
            )}
            {!loading &&
              !err &&
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className={cell}>
                    <code className="rounded bg-slate-50 px-1">{r.id}</code>
                  </td>
                  <td className={cell}>{r.Destinatario || '—'}</td>
                  <td className={cell}>
                    <Badge text={r.Stato} />
                  </td>
                  <td className={cell}>{r.Corriere || '—'}</td>
                  <td className={cell}>{r.Tracking || '—'}</td>
                  <td className={cell}>
                    {r.CreatedAt ? new Date(r.CreatedAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
