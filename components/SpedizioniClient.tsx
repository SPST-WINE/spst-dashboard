// components/SpedizioniClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Package, Boxes, Search, ArrowUpDown } from 'lucide-react';
import Drawer from '@/components/Drawer';
import ShipmentDetail from '@/components/ShipmentDetail';

type Row = {
  id: string;
  _createdTime?: string | null;
  [key: string]: any;
};

function norm(s?: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function StatusBadge({ value }: { value?: string }) {
  const v = (value || '').toLowerCase();
  let cls = 'bg-amber-50 text-amber-700 ring-amber-200';
  let text = value || '—';

  if (v.includes('in transito') || v.includes('intransit')) cls = 'bg-sky-50 text-sky-700 ring-sky-200';
  else if (v.includes('in consegna') || v.includes('outfordelivery')) cls = 'bg-amber-50 text-amber-700 ring-amber-200';
  else if (v.includes('consegn')) cls = 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  else if (v.includes('eccez') || v.includes('exception') || v.includes('failed')) cls = 'bg-rose-50 text-rose-700 ring-rose-200';

  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${cls}`}>{text}</span>;
}

type Att = { url: string; filename?: string };
function firstAttachmentLike(fields: any, hints: string[]): Att | undefined {
  for (const [k, v] of Object.entries(fields || {})) {
    const key = k.toLowerCase();
    if (!Array.isArray(v)) continue;
    const arr = v as any[];
    if (!arr.length || !arr[0]?.url) continue;
    if (hints.some(h => key.includes(h))) {
      return { url: arr[0].url as string, filename: arr[0].filename as string | undefined };
    }
  }
  return undefined;
}

function DocButtons({ row }: { row: Row }) {
  const f = row as any;

  const ldv =
    firstAttachmentLike(f, ['ldv', 'awb', 'lettera', 'vettura']) ||
    (Array.isArray(f['LDV']) && f['LDV'][0]?.url ? { url: f['LDV'][0].url, filename: f['LDV'][0].filename } : undefined);

  const fatt =
    firstAttachmentLike(f, ['fatt', 'invoice']) ||
    (Array.isArray(f['Fattura - Allegato Cliente']) && f['Fattura - Allegato Cliente'][0]?.url
      ? { url: f['Fattura - Allegato Cliente'][0].url, filename: f['Fattura - Allegato Cliente'][0].filename }
      : undefined);

  const pack =
    firstAttachmentLike(f, ['pack', 'pl']) ||
    (Array.isArray(f['Packing List - Allegato Cliente']) && f['Packing List - Allegato Cliente'][0]?.url
      ? { url: f['Packing List - Allegato Cliente'][0].url, filename: f['Packing List - Allegato Cliente'][0].filename }
      : undefined);

  const Btn = ({ available, href, label }: { available: boolean; href?: string; label: string }) =>
    available && href ? (
      <a
        href={href}
        target="_blank"
        className="inline-flex items-center rounded-md bg-[#1c3e5e] px-2.5 py-1 text-xs font-medium text-white hover:opacity-95"
      >
        {label}
      </a>
    ) : (
      <span className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs text-slate-500">
        {label} non disponibile
      </span>
    );

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Btn available={!!ldv} href={ldv?.url} label="LDV" />
      <Btn available={!!fatt} href={fatt?.url} label="Fattura" />
      <Btn available={!!pack} href={pack?.url} label="Packing List" />
    </div>
  );
}

function Card({ r, onDetails }: { r: Row; onDetails: () => void }) {
  const formato: string = r['Formato'] || '';
  const isPallet = /pallet/i.test(formato);
  const ref = r['ID Spedizione'] || r.id;
  const destCitta = r['Destinatario - Città'];
  const destPaese = r['Destinatario - Paese'];
  const dest =
    destCitta || destPaese
      ? `${destCitta || ''}${destCitta && destPaese ? ' ' : ''}${destPaese ? `(${destPaese})` : ''}`
      : '—';
  const stato = r['Stato'] || r['Tracking Status'] || '—';

  return (
    <div className="rounded-2xl border bg-white p-4 flex items-start gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shrink-0">
        {isPallet ? <Boxes className="h-5 w-5" /> : <Package className="h-5 w-5" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium text-slate-900 truncate">{ref}</div>
          <StatusBadge value={stato} />
        </div>
        <div className="text-sm text-slate-600 truncate">{dest}</div>

        <DocButtons row={r} />

        <div className="mt-2">
          <button onClick={onDetails} className="text-xs text-[#1c3e5e] underline">
            Mostra dettagli
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SpedizioniClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'created_desc' | 'ritiro_desc' | 'dest_az' | 'status'>('created_desc');

  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Row | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (sort) params.set('sort', sort);

    fetch(`/api/spedizioni?${params.toString()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(j => {
        if (!alive) return;
        if (j?.ok) {
          // flatten: { id, _createdTime, ...fields }
          const flat: Row[] = (j.rows || []).map((r: any) => ({
            id: r.id,
            _createdTime: r._createdTime ?? r.createdTime ?? r._rawJson?.createdTime ?? null,
            ...(r.fields || r),
          }));
          setRows(flat);
        } else {
          setRows([]);
        }
      })
      .catch(() => alive && setRows([]))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [q, sort]);

  const filtered = useMemo(() => {
    const needle = norm(q);
    const arr = !needle
      ? rows
      : rows.filter(r => {
          const hay = [
            r['ID Spedizione'],
            r['Destinatario - Ragione Sociale'],
            r['Destinatario - Città'],
            r['Destinatario - Paese'],
            r['Mittente - Ragione Sociale'],
          ]
            .map(norm)
            .join(' | ');
          return hay.includes(needle);
        });

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
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Cerca: destinatario, città, paese, ID…"
            className="pl-8 pr-3 py-2 text-sm rounded-lg border bg-white w-72"
          />
        </div>
        <div className="relative">
          <ArrowUpDown className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as any)}
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

      {/* Lista 1 card per riga */}
      {loading ? (
        <div className="text-sm text-slate-500">Caricamento…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-slate-500">Nessuna spedizione trovata.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <Card key={r.id} r={r} onDetails={() => { setSel(r); setOpen(true); }} />
          ))}
        </div>
      )}

      {/* Drawer dettagli */}
      <Drawer open={open} onClose={() => setOpen(false)} title={sel ? (sel['ID Spedizione'] || sel.id) : undefined}>
        {/* ShipmentDetail nel tuo progetto vuole f: FMap */}
        {sel ? <ShipmentDetail f={(sel as any).fields ?? (sel as any)} /> : null}
      </Drawer>
    </>
  );
}
