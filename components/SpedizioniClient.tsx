"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase-client";

export default function SpedizioniClient() {
  const [data, setData] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const auth = getAuth(app);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return; // gestisci redirect altrove
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/spedizioni", {
          headers: { Authorization: "Bearer " + idToken },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setErr(e.message || "Errore caricamento");
      }
    });
    return () => unsub();
  }, [auth]);

  if (err) return <div className="p-4 text-red-600">Errore: {err}</div>;
  if (!data.length) return <div className="p-4">Caricamento…</div>;

  return (
    <div className="p-4 border rounded-xl">
      {data.map((s: any) => (
        <div key={s.id} className="border-b py-2 text-sm">
          <div><b>Spedizione:</b> {s["ID Spedizione"] || s.id}</div>
          <div><b>Cliente:</b> {s["Mail Cliente"]}</div>
          <div><b>Data ritiro:</b> {s["Data Ritiro"] || "-"}</div>
          <div><b>Stato:</b> {s["Stato"] || "-"}</div>
        </div>
      ))}
    </div>
  );
}
