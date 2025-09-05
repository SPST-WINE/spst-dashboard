'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getIdToken } from '@/lib/firebase-client-auth';

type ApiRow = {
  id: string;
  displayId?: string;
  fields: Record<string, any>;
  colli: Array<{ id: string; fields: Record<string, any> }>;
};

function prettyDate(d?: string) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (Number.isNaN(+dt)) return '—';
    return dt.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

// ---- alias lato UI (tolleranti, uguali a quelli del backend) ----
const F = {
  Stato: ['Stato', 'Status'],
  TipoSped: ['Tipo_Spedizione', 'Tipo spedizione', 'Tipo Spedizione', 'Tipologia', 'Tipo', 'TipoSped'],
  Incoterm: ['Incoterm', 'Incoterms', 'Incoterm_Selezionato', 'Incoterm Selezionato'],
  RitiroData: ['Ritiro_Data', 'Data_Ritiro', 'RitiroData', 'PickUp_Date'],

  M_Nome: ['Mittente_Nome', 'Mittente', 'Ragione sociale Mittente', 'Mittente RS'],
  M_Ind: ['Mittente_Indirizzo', 'Indirizzo Mittente', 'Mittente Indirizzo'],
  M_CAP: ['Mittente_CAP', 'CAP Mittente'],
  M_Citta: ['Mittente_Citta', 'Città Mittente', 'Mittente Citta'],
  M_Paese: ['Mittente_Paese', 'Paese Mittente'],

  D_Nome: ['Destinatario_Nome', 'Destinatario', 'Ragione sociale Destinatario', 'Destinatario RS'],
  D_Ind: ['Destinatario_Indirizzo', 'Indirizzo Destinatario'],
  D_CAP: ['Destinatario_CAP', 'CAP Destinatario'],
  D_Citta: ['Destinatario_Citta', 'Città Destinatario', 'Destinatario Citta'],
  D_Paese: ['Destinatario_Paese', 'Paese Destinatario'],
} as const;

const C = {
  Qty: ['Quantita', 'Quantità', 'Qty', 'Q.ta'],
  L: ['Lato 1', 'Lato1', 'L_cm', 'Lunghezza', 'L'],
  W: ['Lato 2', 'Lato2', 'W_cm', 'Larghezza', 'W'],
  H: ['Lato 3', 'Lato3', 'H_cm', 'Altezza', 'H'],
  Peso: ['Peso (Kg)', 'Peso_Kg', 'Peso', 'Kg', 'Weight'],
} as const;

function pick(fields: Record<string, any>, aliases: readonly string[], fallback: any = undefined) {
  for (const k of aliases) {
    if (fields[k] != null && fields[k] !== '') return fields[k];
  }
  return fallback;
}

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id || '');
  const [row, setRow] = useState<ApiRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        const token = await getIdToken();
        const res = await fetch(`/api/quotazioni/${encodeURIComponent(id)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await res.json().catch(() => ({}));
        if (!abort) {
          if (res.ok && json?.ok && json?.row) setRow(json.row as ApiRow);
          else setRow(null);
        }
      } catch {
        if (!abort) setRow(null);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [id]);

  const f = row?.fields || {};
  const stato = (pick(f, F.Stato) as string) || 'In lavorazione'; // fallback richiesto
  const tipoSped = pick(f, F.TipoSped, '—') as string | undefined;
  const incoterm = pick(f, F.Incoterm, '—') as string | undefined;
  const ritiro = pick(f, F.RitiroData) as string | undefined;

  const mittente = {
    nome: pick(f, F.M_Nome, '—'),
    ind: pick(f, F.M_Ind),
    cap: pick(f, F.M_CAP),
    citta: pick(f, F.M_Citta),
    paese: pick(f, F.M_Paese),
  };
  const destinatario = {
    nome: pick(f, F.D_Nome, '—'),
    ind: pick(f, F.D_Ind),
    cap: pick(f, F.D_CAP),
    citta: pick(f, F.D_Citta),
    paese: pick(f, F.D_Paese),
  };

  const colli = useMemo(() => {
    const list = row?.colli || [];
    return list.map((r) => {
      const cf = r.fields || {};
      const qty = pick(cf, C.Qty) ?? 1;
      const l = pick(cf, C.L);
      const w = pick(cf, C.W);
      const h = pick(cf, C.H);
      const peso = pick(cf, C.Peso);
      return { id: r.id, qty, l, w, h, peso };
    });
  }, [row]);

  if (loading) {
    return <div className="text-sm text-slate-500">Caricamento…</div>;
  }

  if (!row) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Dettaglio preventivo</h1>
        <div className="rounded-xl border bg-white p-4 text-rose-600">Preventivo non trovato.</div>
        <div className="mt-4">
          <button
            onClick={() => router.push('/dashboard/quotazioni')}
            className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Torna alla lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dettaglio preventivo</h1>
        <button
          onClick={() => router.push('/dashboard/quotazioni')}
          className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
        >
          Torna alla lista
        </button>
      </div>

      {/* Header info */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">ID Preventivo</div>
            <div className="font-medium">{row.displayId || row.id}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Stato</div>
            <div className="font-medium">{stato || 'In lavorazione'}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Tipo spedizione</div>
            <div className="font-medium">{tipoSped || '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Incoterm</div>
            <div className="font-medium">{incoterm || '—'}</div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Data ritiro</div>
            <div className="font-medium">{prettyDate(ritiro)}</div>
          </div>
        </div>
      </div>

      {/* Mittente / Destinatario */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold text-spst-blue mb-1">Mittente</div>
          <div className="text-sm">
            <div className="font-medium">{mittente.nome}</div>
            <div className="text-slate-600">
              {[mittente.ind, [mittente.citta, mittente.cap].filter(Boolean).join(' '), mittente.paese]
                .filter(Boolean)
                .join(', ')}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold text-spst-blue mb-1">Destinatario</div>
          <div className="text-sm">
            <div className="font-medium">{destinatario.nome}</div>
            <div className="text-slate-600">
              {[destinatario.ind, [destinatario.citta, destinatario.cap].filter(Boolean).join(' '), destinatario.paese]
                .filter(Boolean)
                .join(', ')}
            </div>
          </div>
        </div>
      </div>

      {/* Colli */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="text-sm font-semibold text-spst-blue mb-3">Colli</div>

        {colli.length === 0 ? (
          <div className="text-sm text-slate-500">Nessun collo indicato.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Quantità</th>
                  <th className="py-2 pr-3">Dimensioni (cm)</th>
                  <th className="py-2 pr-3">Peso (kg)</th>
                </tr>
              </thead>
              <tbody>
                {colli.map((c, idx) => {
                  const dims = [c.l, c.w, c.h].every((v) => v != null)
                    ? `${c.l} × ${c.w} × ${c.h}`
                    : '—';
                  return (
                    <tr key={c.id} className="border-t">
                      <td className="py-2 pr-3">{idx + 1}</td>
                      <td className="py-2 pr-3">{c.qty ?? 1}</td>
                      <td className="py-2 pr-3">{dims}</td>
                      <td className="py-2 pr-3">{c.peso ?? '—'}</td>
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
