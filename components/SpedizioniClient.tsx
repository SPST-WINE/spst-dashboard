// components/SpedizioniClient.tsx
"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { authClient } from "@/lib/firebase-client";

export default function SpedizioniClient() {
  const [data, setData] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(authClient(), async (user) => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/spedizioni", {
          headers: { Authorization: "Bearer " + idToken },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text());
        setData(await res.json());
      } catch (e: any) {
        setErr(e.message || "Errore");
      }
    });
    return () => unsub();
  }, []);

  if (err) return <div className="p-4 text-red-600">Errore: {err}</div>;
  if (!data) return <div className="p-4">Caricamento…</div>;
  if (data.length === 0) return <div className="p-4">Nessuna spedizione.</div>;

  return (
    <div className="overflow-auto border rounded-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="p-3">ID</th>
            <th className="p-3">Cliente</th>
            <th className="p-3">Data ritiro</th>
            <th className="p-3">Stato</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s: any) => (
            <tr key={s.id} className="border-t">
              <td className="p-3">{s["ID Spedizione"] || s.id}</td>
              <td className="p-3">{s["Mail Cliente"] || "-"}</td>
              <td className="p-3">{s["Data Ritiro"] || "-"}</td>
              <td className="p-3">{s["Stato"] || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
