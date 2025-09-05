'use client';

import { useEffect, useMemo, useState } from 'react';
import { getIdToken } from '@/lib/firebase-client-auth';
import Link from 'next/link';

type Row = {
  id: string;
  displayId?: string;
  fields: Record<string, any>;
  colli: Array<{ id: string; fields: Record<string, any> }>;
};

function getFirst<T = string>(f: Record<string, any>, keys: string[], fallback: any = undefined): T | undefined {
  for (const k of keys) {
    const v = f?.[k];
    if (v != null && v !== '') return v as T;
  }
  return fallback;
}

function fmtDate(d?: string) {
  if (!d) return undefined;
  const x = new Date(d);
  if (isNaN(x.getTime())) return undefined;
  return x.toLocaleDateString();
}

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const token = await getIdToken();
        const res = await fetch(`/api/quotazioni/${encodeURIComponent(params.id)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.status === 404) {
          if (!abort) setNotFound(true);
          return;
        }
        const json = await res.json();
        if (!abort && json?.ok) setRow(json.row as Row);
      } catch {
        // noop
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [params.id]);

  const f = row?.fields || {};

  // alias lato UI (solo lettura)
  const displayId = row?.displayId || getFirst<string>(f, ['ID_Preventivo', 'ID Preventivo']) || params.id;

  const stato = getFirst<string>(f, ['Stato', 'Status'], '—');
  const incoterm = getFirst<string>(f, ['Incoterm', 'Incoterms', 'Incoterm_Selezionato', 'Incoterm Selezionato'], '—');
  const tipoSped = getFirst<string>(f, ['Tipo_Spedizione', 'Tipo spedizione', 'Tipo Spedizione', 'Tipologia', 'Tipo', 'TipoSped'], '—');
  const dataRitiroRaw = getFirst<string>(
    f,
    ['Ritiro_Data', 'Data_Ritiro', 'RitiroData', 'PickUp_Date', 'Data ritiro', 'Data Ritiro', ' Data Ritiro ']
  );
  const dataRitiro = fmtDate(dataRitiroRaw) || '—';

  const mittenteRag = getFirst<string>(f, ['Mittente_Nome', 'Mittente', 'Ragione sociale Mittente', 'Mittente RS'], '—');
  const mittenteAddr = [
    getFirst<string>(f, ['Mittente_Indirizzo', 'Indirizzo Mittente', 'Mittente Indirizzo']),
    [getFirst<string>(f, ['Mittente_Citta', 'Città Mittente', 'Mittente Citta']), getFirst<string>(f, ['Mittente_CAP', 'CAP Mittente'])].filter(Boolean).join(' '),
    getFirst<string>(f, ['Mittente_Paese', 'Paese Mittente']),
  ].filter(Boolean).join(', ') || '—';

  const destRag = getFirst<string>(f, ['Destinatario_Nome', 'Destinatario', 'Ragione sociale Destinatario', 'Destinatario RS'], '—');
  const destAddr = [
    getFirst<string>(f, ['Destinatario_Indirizzo', 'Indirizzo Destinatario']),
    [getFirst<string>(f, ['Destinatario_Citta', 'Città Destinatario', 'Destinatario Citta']), getFirst<string>(f, ['Destinatario_CAP', 'CAP Destinatario'])].filter(Boolean).join(' '),
    getFirst<string>(f, ['Destinatario_Paese', 'Paese Destinatario']),
  ].filter(Boolean).join(', ') || '—';

  const colli = useMemo(() => {
    return (row?.colli || []).map((c, i) => {
      const cf = c.fields || {};
      const qta = getFirst<number>(cf, ['Quantita', 'Quantità', 'Qty', 'Q.ta'], 1) ?? 1;
      const l = getFirst<number>(cf, ['L_cm', 'Lato 1', 'Lato1', 'Lunghezza', 'L']);
      const w = getFirst<number>(cf, ['W_cm', 'Lato 2', 'Lato2', 'Larghezza', 'W']);
      const h = getFirst<number>(cf, ['H_cm', 'Lato 3', 'Lato3', 'Altezza', 'H']);
      const peso = getFirst<number>(cf, ['Peso', 'Peso (Kg)', 'Peso_Kg', 'Kg', 'Weight'], 0) ?? 0;
      const dims = (l || w || h) ? `${l ?? '—'} × ${w ?? '—'} × ${h ?? '—'}` : '—';
      return { i: i + 1, qta, dims, peso };
    });
  }, [row?.colli]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Dettaglio preventivo</h2>

      {loading && <div className="text-sm text-slate-500">Caricamento…</div>}
      {!loading && notFound && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Preventivo non trovato.
        </div>
      )}

      {!loading && !!row && (
        <>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase text-slate-500">ID preventivo</div>
                <div className="font-medium">{displayId}</div>
                <div className="mt-4 text-xs uppercase text-slate-500">Tipo spedizione</div>
                <div className="font-medium">{tipoSped}</div>
                <div className="mt-4 text-xs uppercase text-slate-500">Data ritiro</div>
                <div className="font-medium">{dataRitiro}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-500">Stato</div>
                <div className="font-medium">{stato}</div>
                <div className="mt-4 text-xs uppercase text-slate-500">Incoterm</div>
                <div className="font-medium">{incoterm}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-sm font-medium">Mittente</div>
              <div className="mt-1 text-sm text-slate-700">
                <div className="font-medium">{mittenteRag}</div>
                <div className="text-slate-500">{mittenteAddr}</div>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-sm font-medium">Destinatario</div>
              <div className="mt-1 text-sm text-slate-700">
                <div className="font-medium">{destRag}</div>
                <div className="text-slate-500">{destAddr}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-medium mb-3">Colli</div>
            {colli.length === 0 ? (
              <div className="text-sm text-slate-500">Nessun collo indicato.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-2 pr-4">#</th>
                      <th className="py-2 pr-4">Quantità</th>
                      <th className="py-2 pr-4">Dimensioni (cm)</th>
                      <th className="py-2 pr-0">Peso (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colli.map((c) => (
                      <tr key={c.i} className="border-t">
                        <td className="py-2 pr-4">{c.i}</td>
                        <td className="py-2 pr-4">{c.qta}</td>
                        <td className="py-2 pr-4">{c.dims}</td>
                        <td className="py-2 pr-0">{c.peso}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <div>
        <Link href="/dashboard/quotazioni" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
          Torna alla lista
        </Link>
      </div>
    </div>
  );
}
