"use client";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { authClient } from "@/lib/firebase-client";
import { authedJson } from "@/lib/authed-fetch";
import ShipmentCard from "./ShipmentCard";

export default function SpedizioniClient() {
  const [data, setData] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

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
    return data.filter((r) => {
      const f = r as any;
      return (
        String(f["ID Spedizione"] || "").toLowerCase().includes(term) ||
        String(f["Destinatario"] || "").toLowerCase().includes(term) ||
        String(f["Città Destinatario"] || "").toLowerCase().includes(term) ||
        String(f["Paese Destinatario"] || "").toLowerCase().includes(term)
      );
    });
  }, [data, q]);

  if (err) return <div className="p-4 text-red-600">Errore: {err}</div>;
  if (!filtered) return <div className="p-4">Caricamento…</div>;
  if (!filtered.length) return (
    <div className="p-6 text-sm text-gray-600 border rounded-2xl">
      Nessuna spedizione trovata.
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <input
          className="w-full md:max-w-md border rounded-lg px-3 py-2"
          placeholder="Cerca per ID, destinatario, città, paese…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="text-sm text-gray-500">{filtered.length} risultati</div>
      </div>

      <div className="grid gap-3">
        {filtered.map((r: any) => (
          <ShipmentCard key={r.id || r["ID Spedizione"]} f={r} />
        ))}
      </div>
    </div>
  );
}
