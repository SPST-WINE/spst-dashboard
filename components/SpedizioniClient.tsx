'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { authClient } from '@/lib/firebase-client';
import { authedJson } from '@/lib/authed-fetch';
import ShipmentCard from '@/components/ShipmentCard';
import Drawer from '@/components/Drawer';
import ShipmentDetail from '@/components/ShipmentDetail';
import { ShipmentCardSkeleton } from '@/components/Skeletons';

function normalizeArray(json: any): any[] {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.results)) return json.results;
  return [];
}

const pickStr = (f: any, keys: string[]) => {
  for (const k of keys) {
    const v = f?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
};

// estrae timestamp (UTC) dal formato SP-YYYY-MM-DD-XXXX
function tsFromIdSped(f: any): number {
  const id = pickStr(f, ['ID Spedizione', 'ID SPST', 'ID Spedizione (custom)']);
  const m = id.match(/SP-(\d{4})-(\d{2})-(\d{2})-/i);
  if (!m) return 0;
  const y = +m[1], mo = +m[2] - 1, d = +m[3];
  return Date.UTC(y, mo, d);
}

function tsFromRitiro(f: any): number {
  const s = pickStr(f, ['Ritiro - Data', 'Ritiro Data', 'Data ritiro']);
  const t = s ? Date.parse(s) : NaN;
  return isNaN(t) ? 0 : t;
}

export default function SpedizioniClient() {
  const [data, setData] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const PAGE = 10;

  useEffect(() => {
    const unsub = onAuthStateChanged(authClient(), async (user) => {
      if (!user) return;
      try {
        const json = await authedJson('/api/spedizioni');
        setData(normalizeArray(json));
      } catch (e: any) {
        setErr(e?.message || 'Errore');
      }
    });
    return () => unsub();
  }, []);

  // ORDINA: più recenti prima (ID Sped -> data; fallback: ritiro)
  const sorted = useMemo(() => {
    if (!data) return null;
    const copy = [...data];
    copy.sort((a, b) => {
      const byId = tsFromIdSped(b) - tsFromIdSped(a);
      if (byId !== 0) return byId;
      return tsFromRitiro(b) - tsFromRitiro(a);
    });
    return copy;
  }, [data]);

  // FILTRO
  const filtered = useMemo(() => {
    if (!sorted) return null;
    const term = q.trim().toLowerCase();
    if (!term) return sorted;

    const get = (f: any, k: string) => String(f?.[k] ?? '').toLowerCase();
    return sorted.filter((f: any) =>
      get(f, 'ID Spedizione').includes(term) ||
      get(f, 'Destinatario').includes(term) ||
      get(f, 'Destinatario - Ragione Sociale').includes(term) ||
      get(f, 'Destinatario - Città').includes(term) ||
      get(f, 'Destinatario - Paese').includes(term) ||
      get(f, 'Città Destinatario').includes(term) ||
      get(f, 'Paese Destinatario').includes(term)
    );
  }, [sorted, q]);

  if (err) return <div className="p-4 text-red-600">Errore: {err}</div>;

  if (!filtered) {
    return (
      <div className="space-y-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="h-9 w-full rounded bg-gray-100 md:max-w-md" />
          <div className="h-5 w-20 rounded bg-gray-100" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <ShipmentCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const shown = filtered.slice(0, page * PAGE);

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <input
          className="w-full rounded-lg border px-3 py-2 md:max-w-md"
          placeholder="Cerca per ID, destinatario, città, paese…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <div className="text-sm text-gray-500">{filtered.length} risultati</div>
      </div>

      <div className="grid gap-3">
        {shown.map((f: any) => (
          <ShipmentCard key={f.id || f['ID Spedizione']} f={f} onOpen={() => setSelected(f)} />
        ))}
      </div>

      {shown.length < filtered.length && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Carica altri
          </button>
        </div>
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Dettagli spedizione">
        {selected && <ShipmentDetail f={selected} />}
      </Drawer>
    </>
  );
}
