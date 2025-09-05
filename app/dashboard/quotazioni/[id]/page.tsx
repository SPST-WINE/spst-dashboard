'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Row = {
  id: string;
  displayId?: string;
  fields: any;
  colli: Array<{ id: string; fields: any }>;
};

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/quotazioni/${encodeURIComponent(params.id)}`);
        const j = await res.json();
        if (!abort) setRow(j?.row || null);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [params.id]);

  if (loading) return <div className="text-sm text-slate-500">Caricamento…</div>;
  if (!row) return <div className="text-sm text-rose-600">Preventivo non trovato.</div>;

  const f = row.fields || {};
  const idVis = row.displayId || row.id;

  const stato = f['Stato_Computato'] || f['Stato'] || 'In lavorazione';
  const tipoSped = f['Tipo_Spedizione'] || f['Tipologia'] || f['Tipo'] || '—';
  const incoterm = f['Incoterm'] || '—';
  const ritiro = f['Ritiro_Data'] || f['RitiroData'] || '—';

  const mittNome = f['Mittente_Nome'] || '—';
  const mittAddr = [f['Mittente_Indirizzo'], f['Mittente_Citta'], f['Mittente_Paese']].filter(Boolean).join(', ');
  const destNome = f['Destinatario_Nome'] || '—';
  const destAddr = [f['Destinatario_Indirizzo'], f['Destinatario_Citta'], f['Destinatario_Paese']].filter(Boolean).join(', ');

  const colli = row.colli || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dettaglio preventivo</h1>
        <Link href="/dashboard/quotazioni" className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50">
          Torna alla lista
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-sm text-slate-500">ID Preventivo</div>
            <div className="font-medium">{idVis}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Stato</div>
            <div className="font-medium">{stato || 'In lavorazione'}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Tipo spedizione</div>
            <div className="font-medium">{tipoSped}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Incoterm</div>
            <div className="font-medium">{incoterm}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Data ritiro</div>
            <div className="font-medium">{ritiro || '—'}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="mb-2 text-base font-semibold text-spst-blue">Mittente</h2>
          <div className="text-sm">
            <div className="font-medium">{mittNome}</div>
            <div className="text-slate-600">{mittAddr || '—'}</div>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="mb-2 text-base font-semibold text-spst-blue">Destinatario</h2>
          <div className="text-sm">
            <div className="font-medium">{destNome}</div>
            <div className="text-slate-600">{destAddr || '—'}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-spst-blue">Colli</h2>
        {colli.length === 0 ? (
          <div className="text-sm text-slate-500">Nessun collo indicato.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4">Quantità</th>
                  <th className="py-2 pr-4">L (cm)</th>
                  <th className="py-2 pr-4">W (cm)</th>
                  <th className="py-2 pr-4">H (cm)</th>
                  <th className="py-2 pr-4">Peso (kg)</th>
                </tr>
              </thead>
              <tbody>
                {colli.map((c) => {
                  const cf = c.fields || {};
                  const qty = cf['Quantita'] ?? cf['Quantità'] ?? cf['Qty'] ?? 1;
                  const L = cf['Lato 1'] ?? cf['L_cm'] ?? cf['Lunghezza'] ?? cf['L'] ?? '—';
                  const W = cf['Lato 2'] ?? cf['W_cm'] ?? cf['Larghezza'] ?? cf['W'] ?? '—';
                  const H = cf['Lato 3'] ?? cf['H_cm'] ?? cf['Altezza'] ?? cf['H'] ?? '—';
                  const P = cf['Peso (Kg)'] ?? cf['Peso_Kg'] ?? cf['Peso'] ?? cf['Kg'] ?? '—';
                  return (
                    <tr key={c.id} className="border-t">
                      <td className="py-2 pr-4">{qty}</td>
                      <td className="py-2 pr-4">{L}</td>
                      <td className="py-2 pr-4">{W}</td>
                      <td className="py-2 pr-4">{H}</td>
                      <td className="py-2 pr-4">{P}</td>
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
