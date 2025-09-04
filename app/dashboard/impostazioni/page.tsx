// app/dashboard/impostazioni/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { getUserProfile, saveUserProfile } from '@/lib/api';
import { getIdToken } from '@/lib/firebase-client-auth';

type FormState = {
  paese: string;
  mittente: string;
  citta: string;
  cap: string;
  indirizzo: string;
  telefono: string;
  piva: string;
};

const initialState: FormState = {
  paese: '',
  mittente: '',
  citta: '',
  cap: '',
  indirizzo: '',
  telefono: '',
  piva: '',
};

export default function ImpostazioniPage() {
  const [email, setEmail] = useState<string>('');
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Load profilo (solo client → niente schermata “buggy”)
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        const r = await getUserProfile(getIdToken);
        if (aborted) return;
        if (r?.email) setEmail(r.email);
        if (r?.party) {
          setForm({
            paese: r.party.paese ?? '',
            mittente: r.party.ragioneSociale ?? '',
            citta: r.party.citta ?? '',
            cap: r.party.cap ?? '',
            indirizzo: r.party.indirizzo ?? '',
            telefono: r.party.telefono ?? '',
            piva: r.party.piva ?? '',
          });
        }
        // fallback soft: mostra eventuale email salvata localmente (read-only)
        if (!r?.email && typeof window !== 'undefined') {
          const stored = localStorage.getItem('userEmail');
          if (stored) setEmail(stored);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

  // si può salvare se c'è almeno un campo base (non vincoliamo più all'email UI)
  const canSave = useMemo(() => {
    return (form.mittente.trim().length > 0 || form.indirizzo.trim().length > 0);
  }, [form]);

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const party = {
        ragioneSociale: form.mittente,
        referente: '',
        paese: form.paese,
        citta: form.citta,
        cap: form.cap,
        indirizzo: form.indirizzo,
        telefono: form.telefono,
        piva: form.piva,
      };
      await saveUserProfile(party, getIdToken);
      // conserva email in locale solo per display futuro (read-only)
      if (email && typeof window !== 'undefined') localStorage.setItem('userEmail', email);
      setMessage({ type: 'ok', text: 'Dati salvati correttamente.' });
    } catch {
      setMessage({ type: 'err', text: 'Errore durante il salvataggio.' });
    } finally {
      setSaving(false);
    }
  }

  // Skeleton durante il load
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="mb-3 h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-9 w-full animate-pulse rounded bg-slate-200" />
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {/* Email account (sempre visibile, read-only) */}
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-[#f7911e]">Email account</h2>
        <label className="block">
          <div className="mb-1 text-xs font-medium text-slate-600">Email</div>
          <input
            type="email"
            value={email}
            disabled
            placeholder="—"
            className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
          />
        </label>
        <p className="mt-2 text-xs text-slate-500">
          L’email identifica il tuo profilo e non è modificabile da questa pagina.
        </p>
      </section>

      {/* Form impostazioni mittente */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="mb-4 text-base font-semibold tracking-tight">Impostazioni mittente</h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Paese</label>
              <input
                value={form.paese}
                onChange={(e) => onChange('paese', e.target.value)}
                placeholder="IT, FR, ES…"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mittente</label>
              <input
                value={form.mittente}
                onChange={(e) => onChange('mittente', e.target.value)}
                placeholder="Ragione sociale / Nome"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Città</label>
              <input
                value={form.citta}
                onChange={(e) => onChange('citta', e.target.value)}
                placeholder="Avellino"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">CAP</label>
              <input
                value={form.cap}
                onChange={(e) => onChange('cap', e.target.value)}
                placeholder="83100"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Indirizzo</label>
              <input
                value={form.indirizzo}
                onChange={(e) => onChange('indirizzo', e.target.value)}
                placeholder="Via / Piazza e numero civico"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Telefono</label>
              <input
                value={form.telefono}
                onChange={(e) => onChange('telefono', e.target.value)}
                placeholder="+39 320 000 0000"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Partita IVA</label>
              <input
                value={form.piva}
                onChange={(e) => onChange('piva', e.target.value)}
                placeholder="IT01234567890"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
              />
            </div>
          </div>

          {message && (
            <div
              className={[
                'mt-4 rounded-md px-3 py-2 text-sm',
                message.type === 'ok'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200',
              ].join(' ')}
            >
              {message.text}
            </div>
          )}

          <div className="mt-4">
            <button
              type="submit"
              disabled={!canSave || saving || loading}
              className={[
                'w-full md:w-auto rounded-lg px-4 py-2 text-sm font-medium',
                'border bg-spst-blue text-white hover:opacity-95',
                !canSave || saving || loading ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {saving ? 'Salvataggio…' : 'Salva'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
