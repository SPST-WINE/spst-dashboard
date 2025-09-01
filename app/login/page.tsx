'use client';

import Image from 'next/image';
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { authClient } from '@/lib/firebase-client';

const LOGO =
  'https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/68079e968300482f70a36a4a_output-onlinepngtools%20(1).png';

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      // 1) check su Airtable (abilitazione)
      const check = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (check.status === 404) {
        setErr('Email non trovata. Contatta il supporto SPST.');
        setLoading(false);
        return;
      }
      if (!check.ok) {
        const data = await check.json().catch(() => ({}));
        setErr(data?.detail || 'SERVER_ERROR');
        setLoading(false);
        return;
      }

      const data = await check.json();
      const enabled = typeof data?.enabled === 'boolean' ? data.enabled : true;
      if (!enabled) {
        setErr('Account non abilitato. Contatta il supporto SPST per l’accesso.');
        setLoading(false);
        return;
      }

      // 2) login Firebase (client)
      const auth = authClient();
      await signInWithEmailAndPassword(auth, email, password);

      // 3) crea cookie di sessione (server) per la middleware
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) {
        setErr('Impossibile creare la sessione.');
        setLoading(false);
        return;
      }
      const sessionRes = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });
      if (!sessionRes.ok) {
        const d = await sessionRes.json().catch(() => ({}));
        setErr(d?.error || 'Errore di sessione.');
        setLoading(false);
        return;
      }

      // 4) redirect alla pagina desiderata (ora la middleware ti lascia passare)
      router.replace(next);
    } catch (e: any) {
      setErr(e?.code || e?.message || 'Errore imprevisto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
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
          disabled={loading}
          className="w-full rounded-lg bg-[#1c3e5e] px-3 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
        >
          {loading ? 'Accesso…' : 'Entra'}
        </button>
      </form>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="mx-auto h-11 w-11 rounded-full bg-slate-200" />
          <div className="h-4 w-2/3 mx-auto bg-slate-200 rounded" />
          <div className="h-3 w-1/2 mx-auto bg-slate-200 rounded" />
          <div className="h-9 w-full bg-slate-200 rounded mt-4" />
          <div className="h-9 w-full bg-slate-200 rounded" />
          <div className="h-9 w-full bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}
