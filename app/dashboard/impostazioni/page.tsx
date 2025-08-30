'use client';

import { useEffect, useMemo, useState } from 'react';

type FormState = {
  paese: string;
  mittente: string;
  citta: string;
  cap: string;
  indirizzo: string;
  telefono: string;
};

const initialState: FormState = {
  paese: '',
  mittente: '',
  citta: '',
  cap: '',
  indirizzo: '',
  telefono: '',
};

export default function ImpostazioniPage() {
  const [email, setEmail] = useState<string>('');
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Prende email dall'auth esistente (per l’MVP: localStorage)
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (stored) setEmail(stored);
    setLoading(false);
  }, []);

  // Carica eventuali dati utente
  useEffect(() => {
    if (!email) return;
    let aborted = false;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/utenti?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
        const data = await res.json();
        if (aborted) return;
        if (data?.fields) {
          setForm({
            paese: data.fields['Paese Mittente'] || '',
            mittente: data.fields['Mittente'] || '',
            citta: data.fields['Città Mittente'] || '',
            cap: data.fields['CAP Mittente'] || '',
            indirizzo: data.fields['Indirizzo Mittente'] || '',
            telefono: data.fields['Telefono Mittente'] || '',
          });
        }
      } catch {
        // silenzio per MVP
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [email]);

  const canSave = useMemo(() => {
    return !!email && (form.mittente.trim().length > 0 || form.indirizzo.trim().length > 0);
  }, [email, form]);

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setMessage({ type: 'err', text: 'Inserisci/recupera la tua email prima di salvare.' });
      return;
    }
    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        email,
        'Paese Mittente': form.paese,
        'Mittente': form.mittente,
        'Città Mittente': form.citta,
        'CAP Mittente': form.cap,
        'Indirizzo Mittente': form.indirizzo,
        'Telefono Mittente': form.telefono,
      };

      const res = await fetch('/api/utenti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Errore salvataggio');
      setMessage({ type: 'ok', text: 'Dati salvati correttamente.' });
    } catch (err: any) {
      setMessage({ type: 'err', text: 'Errore durante il salvataggio.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Email (solo se non la recuperiamo dall’auth) */}
      {!email && (
        <div className="mb-4 rounded-lg border bg-white p-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Email account</label>
          <input
            type="email"
            placeholder="email@azienda.it"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
            onChange={(e) => setEmail(e.target.value.trim())}
          />
          <p className="mt-2 text-xs text-slate-500">
            (Per l’MVP l’email identifica il tuo profilo. Se fai login in futuro, verrà compilata automaticamente.)
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-4 text-base font-semibold tracking-tight">Impostazioni mittente</h2>

          {/* Griglia 3 righe × 2 colonne */}
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
          </div>

          {/* Feedback */}
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
                (!canSave || saving || loading) ? 'opacity-60 cursor-not-allowed' : '',
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
