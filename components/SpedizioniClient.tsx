// components/SpedizioniClient.tsx
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

  const filtered = useMemo(() => {
    if (!data) return null;
    const term = q.trim().toLowerCase();
    if (!term) return data;

    const pick = (f: any, k: string) =>
      String(f?.[k] ?? '').toLowerCase();

    return data.filter((f: any) =>
      pick(f, 'ID Spedizione').includes(term) ||
      pick(f, 'Destinatario').includes(term) ||
      pick(f, 'Città Destinatario').includes(term) ||
      pick(f, 'Paese Destinatario').includes(term)
    );
  }, [data, q]);

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
