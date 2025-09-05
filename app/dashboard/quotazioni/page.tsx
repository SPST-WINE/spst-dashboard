// app/dashboard/quotazioni/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getPreventivi } from '@/lib/api';
import { getIdToken } from '@/lib/firebase-client-auth';

const STATUS_COLORS: Record<string, string> = {
  Accettato: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Convertito: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Pubblicato: 'bg-blue-100 text-blue-700 border-blue-200',
  'Bozza (cliente)': 'bg-amber-100 text-amber-700 border-amber-200',
  Scaduto: 'bg-slate-200 text-slate-600 border-slate-300',
};

function StatusBadge({ value }: { value?: string }) {
  const cls =
    STATUS_COLORS[value || ''] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${cls}`}>
      {value || '—'}
    </span>
  );
}

export default function QuotazioniListPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      try {
        const r = await getPreventivi(getIdToken);
        if (!abort) setRows(r || []);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      const f = r.fields || {};
      const txt = [
        f['Destinatario_Nome'],
        f['Destinatario_Citta'],
        f['Destinatario_Paese'],
        f['Mittente_Nome'],
        f['Slug_Pubblico'],
        r.displayId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (
        txt.includes(needle) ||
        String(r.id).toLowerCase().includes(needle)
      );
    });
  }, [rows, q]);

  const PUBLIC_BASE =
    process.env.NEXT_PUBLIC_PUBLIC_QUOTE_BASE_URL ||
    'https://spst-logistics.vercel.app/quote';

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Le mie quotazioni</h2>

      <div className="flex items-center justify-between">
        <input
          className="w-full max-w-md rounded-lg border px-3 py-2 text-sm"
          placeholder="Cerca per destinatario, città, paese, ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {loading && <div className="text-sm text-slate-500">Caricamento…</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-sm text-slate-500">Nessun preventivo.</div>
        )}

        {filtered.map((r) => {
          const f = r.fields || {};

          // ID visuale (Airtable formula) con fallback
          const displayId =
            r.displayId ||
            f['ID_Preventivo'] ||
            f['ID Preventivo'] ||
            r.id;

          const slug = f['Slug_Pubblico'];
          const linkPubblico = slug ? `${PUBLIC_BASE}/${slug}` : undefined;

          // Se vuoi mostrare SOLO il paese in lista, usa direttamente f['Destinatario_Paese']
          const destRagSoc = f['Destinatario_Nome'] || '—';
          const loc = [f['Destinatario_Citta'], f['Destinatario_Paese']]
            .filter(Boolean)
            .join(', ');

          const stato =
            f['Stato_Computato'] || // calcolato
            f['Stato']; // originale

          const spedLinkId =
            Array.isArray(f['Spedizione_Creata']) && f['Spedizione_Creata'][0];

          return (
            <div key={r.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{displayId}</div>
                <StatusBadge value={stato} />
              </div>

              <div className="mt-1 text-sm text-slate-700">
                <div className="font-medium">{destRagSoc}</div>
                <div className="text-slate-500">{loc || '—'}</div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/quotazioni/${encodeURIComponent(displayId)}`}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Mostra dettagli
                </Link>

                {linkPubblico ? (
                  <a
                    href={linkPubblico}
                    target="_blank"
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
                  >
                    Apri preventivo pubblico
                  </a>
                ) : (
                  <button
                    disabled
                    className="rounded-lg border px-3 py-1.5 text-sm opacity-50 cursor-not-allowed"
                  >
                    Apri preventivo pubblico
                  </button>
                )}

                {spedLinkId ? (
                  <Link
                    href="/dashboard/spedizioni"
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
                  >
                    Spedizione creata: vai alla lista
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
