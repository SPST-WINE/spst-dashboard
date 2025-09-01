// app/login/page.tsx
'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { authClient } from '@/lib/firebase-client';

const LOGO =
  'https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/68079e968300482f70a36a4a_output-onlinepngtools%20(1).png';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    try {
      // 1) Check su Airtable
      const res = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.status === 404) {
        setErr('Email non trovata. Contatta il supporto SPST per ottenere l’accesso.');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data?.detail || 'SERVER_ERROR');
        return;
      }

      const data = await res.json();
      const enabled: boolean =
        typeof data?.enabled === 'boolean' ? data.enabled : true; // default: abilitato

      if (!enabled) {
        setErr('Account non abilitato. Contatta il supporto SPST per l’accesso.');
        return;
      }

      // 2) Login Firebase
      await signInWithEmailAndPassword(authClient(), email, password);

      // 3) Redirect
      startTransition(() => {
        router.replace(next);
      });
    } catch (e: any) {
      const msg = e?.code || e?.message || 'Errore imprevisto';
      setErr(msg);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col items-center gap-1">
          <Image src={LOGO} alt="SPST" width={44} height={44} priority />
          <h1 className="text-lg font-semibold mt-2">Benvenuto in SPST</h1>
          <p className="text-xs text-slate-500">Accedi con le tue credenziali</p>
        </div>

        <div className="space-y-2">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1c3e5e]/30"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1c3e5e]/30"
            placeholder="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {err && <div className="text-xs text-red-600">{err}</div>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-[#1c3e5e] px-3 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
        >
          {pending ? 'Accesso…' : 'Entra'}
        </button>
      </form>
    </div>
  );
}
