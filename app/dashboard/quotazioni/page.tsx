// app/dashboard/quotazioni/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Row = {
  id: string;                 // Airtable recId
  displayId?: string;         // ID_Preventivo (Q-YYYY-xxxxx)
  destination?: string;       // Paese destinatario
  fields: Record<string, any>;
};

export default function QuotazioniPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // piccoli alias lato client per sicurezza/fallback
  const pick = (obj: any, keys: string[]) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
    return undefined;
  };

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch('/api/quotazioni', { cache: 'no-store' });
        const j = await r.json();
        if (!r.ok || !j?.ok) throw new Error(j?.error || 'SERVER_ERROR');

        const data: Row[] = (j.rows || []).map((row: any) => {
          // fallback se l’API non avesse messo i campi
          const displayId =
            row.displayId ||
            pick(row.fields, ['ID_Preventivo', 'ID Preventivo', 'ID']) ||
            row.id;

          const destination =
            row.destination ||
            pick(row.fields, [
              'Destinatario_Paese',
              'Destinatario Paese',
              'Paese Destinatario',
              'DestinatarioPaese',
            ]) ||
            '—';

          return { ...row, displayId, destination };
        });

        if (!abort) {
          setRows(data);
          setErr(null);
        }
      } catch (e: any) {
        if (!abort) setErr(e?.message || 'Errore di caricamento');
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Quotazioni</h1>
          <p className="mt-1 text-sm text-slate-500">
            Crea preventivi e tieni traccia di quelli inviati ai clienti.
          </p>
        </div>
        <Link
          href="/dashboard/quotazioni/nuova"
          className="rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Nuova quotazione
        </Link>
      </div>

      <div className="rounded-2xl border bg-white">
        <div className="border-b px-4 py-3 text-sm font-medium text-slate-700">
          Le mie quotazioni
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">Caricamento…</div>
        ) : err ? (
          <div className="p-6 text-sm text-rose-700">
            Errore: {err}
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            Non hai ancora creato nessuna quotazione.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Riferimento</th>
                  <th className="px-4 py-2 text-left font-medium">Destinazione</th>
                  <th className="px-4 py-2 text-left font-medium">Stato</th>
                  <th className="px-4 py-2 text-left font-medium">Ultimo aggiornamento</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const stato =
                    r.fields['Stato'] ??
                    r.fields['Status'] ??
                    '—';

                  const updated =
                    r.fields['Last modified time'] ||
                    r.fields['Ultima Modifica'] ||
                    '—';

                  return (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-2 font-medium text-slate-800">{r.displayId}</td>
                      <td className="px-4 py-2">{r.destination || '—'}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          {String(stato)}
                        </span>
                      </td>
                      <td className="px-4 py-2">{String(updated).slice(0, 16)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
