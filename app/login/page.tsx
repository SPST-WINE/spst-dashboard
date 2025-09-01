'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
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
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      // 1) Firebase auth
      await signInWithEmailAndPassword(authClient(), email, password);

      // 2) Verifica che l'utente esista su Airtable (tabella UTENTI)
      const r = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      if (!r.ok || !j?.exists) {
        // non autorizzato su Airtable -> signout e errore
        await signOut(authClient());
        throw new Error(
          j?.error ||
            'Account non abilitato. Contatta il supporto SPST per l’accesso.'
        );
      }

      // 3) Ok -> dentro
      router.replace(next);
    } catch (e: any) {
      setErr(e?.message || 'Errore di accesso');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm"
      >
        <div className="mb-4 flex flex-col items-center gap-2">
          {/* usa <img> per evitare config immagini; se preferisci next/image aggiungi remotePatterns */}
          <img src={LOGO} alt="SPST" className="h-9" />
          <h1 className="text-lg font-semibold text-slate-900">
            Benvenuto in SPST
          </h1>
          <p className="text-sm text-slate-500">
            Accedi con le tue credenziali
          </p>
        </div>

        <label className="mb-1 block text-sm text-slate-600" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="mb-3 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-[#1c3e5e]"
          placeholder="tu@azienda.it"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label
          className="mb-1 mt-1 block text-sm text-slate-600"
          htmlFor="password"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          className="mb-3 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-[#1c3e5e]"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#1c3e5e] px-4 py-2 text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Accesso…' : 'Entra'}
        </button>

        {/* eventuale link recupero password in futuro */}
        {/* <div className="mt-3 text-center">
          <a href="/reset" className="text-sm text-[#1c3e5e] hover:underline">
            Hai dimenticato la password?
          </a>
        </div> */}
      </form>
    </div>
  );
}
