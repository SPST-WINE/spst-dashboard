"use client";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { authClient } from "@/lib/firebase-client";
import { authedJson } from "@/lib/authed-fetch";
import ShipmentCard from "@/components/ShipmentCard";
import Drawer from "@/components/Drawer";
import ShipmentDetail from "@/components/ShipmentDetail";
import { ShipmentCardSkeleton } from "@/components/Skeletons";

export default function SpedizioniClient() {
  const [data, setData] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const PAGE = 10;

  useEffect(() => {
    const unsub = onAuthStateChanged(authClient(), async (user) => {
      if (!user) return;
      try {
        const json = await authedJson("/api/spedizioni");
        setData(json);
      } catch (e: any) { setErr(e.message || "Errore"); }
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (!data) return null;
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter((f: any) =>
      String(f["ID Spedizione"] || "").toLowerCase().includes(term) ||
      String(f["Destinatario"] || "").toLowerCase().includes(term) ||
      String(f["Città Destinatario"] || "").toLowerCase().includes(term) ||
      String(f["Paese Destinatario"] || "").toLowerCase().includes(term)
    );
  }, [data, q]);

  // loading
  if (err) return <div className="p-4 text-red-600">Errore: {err}</div>;
  if (!filtered) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="w-full md:max-w-md h-9 bg-gray-100 rounded" />
          <div className="h-5 w-20 bg-gray-100 rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => <ShipmentCardSkeleton key={i} />)}
      </div>
    );
  }

  const shown = filtered.slice(0, page * PAGE);

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-3">
        <input
          className="w-full md:max-w-md border rounded-lg px-3 py-2"
          placeholder="Cerca per ID, destinatario, città, paese…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <div className="text-sm text-gray-500">{filtered.length} risultati</div>
      </div>

      <div className="grid gap-3">
        {shown.map((f: any) => (
          <ShipmentCard key={f.id || f["ID Spedizione"]} f={f} onOpen={() => setSelected(f)} />
        ))}
      </div>

      {shown.length < filtered.length && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setPage(p => p + 1)}
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
