"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { authClient } from "@/lib/firebase-client";

export default function Page() {
  const [out, setOut] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // qui usiamo SEMPRE authClient() che garantisce l'init di Firebase
    const unsub = onAuthStateChanged(authClient(), async (user) => {
      if (!user) { setErr("Non loggato"); return; }
      try {
        const idToken = await user.getIdToken();
        const r = await fetch("/api/spedizioni", {
          headers: { Authorization: "Bearer " + idToken },
          cache: "no-store",
        });
        setOut({ status: r.status, body: await r.json() });
      } catch (e: any) {
        setErr(e.message || "Errore");
      }
    });
    return () => unsub();
  }, []);

  if (err) return <pre style={{ padding: 16 }}>Errore: {err}</pre>;
  if (!out) return <pre style={{ padding: 16 }}>Caricamento…</pre>;
  return <pre style={{ padding: 16 }}>{JSON.stringify(out, null, 2)}</pre>;
}
