// app/dashboard/spedizioni/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Package, Boxes, Search, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

type Row = {
  id: string;
  _createdTime?: string | null;
  [key: string]: any; // campi flatten
};

function norm(s?: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function StatusBadge({ value }: { value?: string }) {
  const v = (value || '').toLowerCase();
  let cls = 'bg-amber-50 text-amber-700 ring-amber-200'; // default arancione
  let text = value || '—';

  if (v.includes('in transito') || v.includes('intransit')) {
    cls = 'bg-sky-50 text-sky-700 ring-sky-200'; // blu
  } else if (v.includes('consegn')) {
    cls = 'bg-emerald-50 text-emerald-700 ring-emerald-200'; // verde
  } else if (v.includes('eccez') || v.includes('exception') || v.includes('failed')) {
    cls = 'bg-rose-50 text-rose-700 ring-rose-200'; // rosso
  } else if (v.includes('in consegna') || v.includes('outfordelivery')) {
    cls = 'bg-amber-50 text-amber-700 ring-amber-200'; // arancione
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${cls}`}>
      {text}
    </span>
  );
}

function Card({ r }: { r: Row }) {
  const formato: string = r['Formato'] || '';
  const isPallet = /pallet/i.test(formato);
  const ref = r['ID Spedizione'] || r.id;
  const dest = [r['Destinatario - Città'], r['Destinatario - Paese']].filter(Boolean).join(' (') + (r['Destinatario - Paese'] ? ')' : '');
  const stato = r['Stato'] || r['Tracking Status'] || '—';

  return (
    <div className="rounded-2xl border bg-white p-4 flex items-start gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shrink-0">
        {isPallet ? <Boxes className="h-5 w-5" /> : <Package className="h-5 w-5" />}
      </span>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium text-slate-900 truncate">{ref}</div>
          <StatusBadge value={stato} />
        </div>
        <div className="text-sm text-slate-600 truncate">{dest || '—'}</div>
        {/* azioni essenziali: dettagli + documenti */}
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href={`/api/spedizioni/${r.id}/meta`} className="text-xs text-[#1c3e5e] underline">
            Dettagli
          </Link>
          {/* se hai già bottoni LDV/Fattura/Packing, puoi aggiungerli qui come in origine */}
        </div>
      </div>
    </div>
  );
}

export default function MyShipmentsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'created_desc'|'ritiro_desc'|'dest_az'|'status'>('created_desc');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    // NB: inviamo q e sort al backend per ridurre i dati; il sort finale lo rifacciamo comunque client
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (sort) params.set('sort', sort);
    fetch(`/api/spedizioni?${params.toString()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(j => {
        if (!alive) return;
        if (j?.ok) setRows(j.rows || []);
        else setRows([]);
      })
      .catch(() => alive && setRows([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [q, sort]);

  const filtered = useMemo(() => {
    // filtro client-side extra (accent-insensitive)
    const needle = norm(q);
    const arr = !needle ? rows : rows.filter(r => {
      const hay = [
        r['ID Spedizione'],
        r['Destinatario - Ragione Sociale'],
        r['Destinatario - Città'],
        r['Destinatario - Paese'],
        r['Mittente - Ragione Sociale'],
      ].map(norm).join(' | ');
      return hay.includes(needle);
    });

    // sort client definitivo
    const copy = [...arr];
    copy.sort((a, b) => {
      if (sort === 'ritiro_desc') {
        const da = a['Ritiro - Data'] ? new Date(a['Ritiro - Data']).getTime() : 0;
        const db = b['Ritiro - Data'] ? new Date(b['Ritiro - Data']).getTime() : 0;
        return db - da;
      }
      if (sort === 'dest_az') {
        const aa = `${a['Destinatario - Città'] || ''} ${a['Destinatario - Paese'] || ''}`.toLowerCase();
        const bb = `${b['Destinatario - Città'] || ''} ${b['Destinatario - Paese'] || ''}`.toLowerCase();
        return aa.localeCompare(bb);
      }
      if (sort === 'status') {
        const order = (s?: string) => {
          const v = (s || '').toLowerCase();
          if (v.includes('in transito') || v.includes('intransit')) return 2;
          if (v.includes('in consegna') || v.includes('outfordelivery')) return 1;
          if (v.includes('consegn')) return 0;
          if (v.includes('eccez') || v.includes('exception') || v.includes('failed')) return 3;
          return 4;
        };
        return order(a['Stato']) - order(b['Stato']);
      }
      // created_desc
      const ca = a._createdTime ? new Date(a._createdTime).getTime() : 0;
      const cb = b._createdTime ? new Date(b._createdTime).getTime() : 0;
      return cb - ca;
    });

    return copy;
  }, [rows, q, sort]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Le mie spedizioni</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca: destinatario, città, paese, ID…"
              className="pl-8 pr-3 py-2 text-sm rounded-lg border bg-white w-64"
            />
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="pl-8 pr-3 py-2 text-sm rounded-lg border bg-white"
              title="Ordina per"
            >
              <option value="created_desc">Data creazione (nuove prima)</option>
              <option value="ritiro_desc">Data ritiro (recenti prima)</option>
              <option value="dest_az">Destinazione A → Z</option>
              <option value="status">Stato</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid cards */}
      {loading ? (
        <div className="text-sm text-slate-500">Caricamento…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-slate-500">Nessuna spedizione trovata.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(r => <Card key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}
