"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function Page() {
  const [out, setOut] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(getAuth(), async (user) => {
      if (!user) { setErr("Non loggato"); return; }
      try {
        const idToken = await user.getIdToken();
        const r = await fetch("/api/spedizioni", { headers: { Authorization: "Bearer " + idToken }});
        setOut({ status: r.status, body: await r.json() });
      } catch (e:any) { setErr(e.message); }
    });
  }, []);

  return <pre style={{padding:16}}>{err ? `Errore: ${err}` : JSON.stringify(out, null, 2)}</pre>;
}
