'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getIdToken } from '@/lib/firebase-client-auth';

// chiamata diretta per evitare dipendenze: /api/quotazioni/[id]
async function fetchPreventivo(id: string) {
  const token = await getIdToken();
  const res = await fetch(`/api/quotazioni/${encodeURIComponent(id)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.ok === false) throw new Error(json?.error || `HTTP_${res.status}`);
  return json?.row as { id: string; displayId?: string; fields: any; colli: any[] } | null;
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="text-sm">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="font-medium">{value || '—'}</div>
    </div>
  );
}

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [row, setRow] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetchPreventivo(id);
        if (!abort) setRow(r);
      } catch (e: any) {
        if (!abort) setErr(e?.message || 'Errore');
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [id]);

  if (loading) return <div className="text-sm text-slate-500">Caricamento…</div>;
  if (err) return (
    <div className="space-y-3">
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
        {err || 'Preventivo non trovato.'}
      </div>
      <Link href="/dashboard/quotazioni" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
        Torna alla lista
      </Link>
    </div>
  );
  if (!row) return (
    <div className="space-y-3">
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
        Preventivo non trovato.
      </div>
      <Link href="/dashboard/quotazioni" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
        Torna alla lista
      </Link>
    </div>
  );

  const f = row.fields || {};
  const idDisplay = row.displayId || id;

  // campi principali
  const tipoSped = f['Tipo_Spedizione'] || f['Tipologia'] || f['Tipo'] || f['TipoSped'] || f['Tipo spedizione'] || '—';
  const stato = f['Stato'] || f['Status'] || '—';
  const incoterm = f['Incoterm'] || f['Incoterms'] || '—';

  // Data Ritiro: prendi "Data Ritiro" (spazio) o altri alias
  const ritiroDate =
    f['Data Ritiro'] || f['Ritiro_Data'] || f['Data_Ritiro'] || f['RitiroData'] || f['PickUp_Date'] || '';

  // mittente / destinatario
  const M_rs = f['Mittente_Nome'] || f['Mittente'] || '';
  const M_addr = [f['Mittente_Indirizzo'], f['Mittente_Citta'], f['Mittente_CAP'], f['Mittente_Paese']]
    .filter(Boolean).join(', ');

  const D_rs = f['Destinatario_Nome'] || f['Destinatario'] || '';
  const D_addr = [f['Destinatario_Indirizzo'], f['Destinatario_Citta'], f['Destinatario_CAP'], f['Destinatario_Paese']]
    .filter(Boolean).join(', ');

  const colli: any[] = Array.isArray(row.colli) ? row.colli : [];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Dettaglio preventivo</h2>

      <div className="grid gap-4 rounded-xl border bg-white p-4 shadow-sm md:grid-cols-2">
        <Field label="ID Preventivo" value={idDisplay} />
        <Field label="Stato" value={stato} />
        <Field label="Tipo spedizione" value={tipoSped} />
        <Field label="Incoterm" value={incoterm} />
        <Field label="Data ritiro" value={ritiroDate ? String(ritiroDate) : '—'} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Mittente</div>
          <div className="text-sm font-medium">{M_rs || '—'}</div>
          <div className="text-sm text-slate-600">{M_addr || '—'}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Destinatario</div>
          <div className="text-sm font-medium">{D_rs || '—'}</div>
          <div className="text-sm text-slate-600">{D_addr || '—'}</div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold">Colli</div>

        {colli.length === 0 ? (
          <div className="text-sm text-slate-500">Nessun collo indicato.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="w-10 py-2">#</th>
                  <th className="py-2">Quantità</th>
                  <th className="py-2">Dimensioni (cm)</th>
                  <th className="py-2">Peso (kg)</th>
                </tr>
              </thead>
              <tbody>
                {colli.map((c, idx) => {
                  const cf = c.fields || {};
                  const qta = cf['Quantita'] ?? cf['Quantità'] ?? cf['Qty'] ?? cf['Q.ta'] ?? 1;

                  const L = cf['L_cm'];
                  const W = cf['W_cm'];
                  const H = cf['H_cm'];
                  const hasDims = [L, W, H].some((v) => v != null && v !== '');
                  const dims = hasDims ? `${L ?? '—'} × ${W ?? '—'} × ${H ?? '—'}` : '—';

                  const peso = cf['Peso'] ?? cf['Peso (Kg)'] ?? cf['Peso_Kg'] ?? cf['Kg'] ?? '—';

                  return (
                    <tr key={c.id} className="border-t">
                      <td className="py-2">{idx + 1}</td>
                      <td className="py-2">{qta ?? '—'}</td>
                      <td className="py-2">{dims}</td>
                      <td className="py-2">{peso ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Link href="/dashboard/quotazioni" className="inline-block rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
        Torna alla lista
      </Link>
    </div>
  );
}
