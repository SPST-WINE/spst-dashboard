// components/Protected.tsx
"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { authClient } from "@/lib/firebase-client";
import { useRouter } from "next/navigation";

export default function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(authClient(), (user) => {
      if (!user) router.replace("/login");
      else setReady(true);
    });
    return () => unsub();
  }, [router]);

  if (!ready) return <div className="p-6">Caricamento…</div>;
  return <>{children}</>;
}
