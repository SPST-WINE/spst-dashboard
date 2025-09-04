// app/dashboard/quotazioni/nuova/page.tsx
'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { FilePlus2, ArrowLeft } from 'lucide-react';

import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import { Select } from '@/components/nuova/Field';
import { getIdToken } from '@/lib/firebase-client-auth';

const blankParty: Party = {
  ragioneSociale: '',
  referente: '',
  paese: '',
  citta: '',
  cap: '',
  indirizzo: '',
  telefono: '',
  piva: '',
};

export default function NuovaQuotazionePage() {
  const topRef = useRef<HTMLDivElement>(null);

  // Tipologie
  const [tipo, setTipo] = useState<'vino' | 'altro'>('vino');
  const [sottotipo, setSottotipo] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');

  // Parti
  const [mittente, setMittente] = useState<Party>(blankParty);
  const [destinatario, setDestinatario] = useState<Party>(blankParty);

  // Colli / contenuto
  const [colli, setColli] = useState<Collo[]>([
    { lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null },
  ]);
  const [formato, setFormato] = useState<'Pacco' | 'Pallet'>('Pacco');
  const [contenuto, setContenuto] = useState<string>('');

  // Ritiro
  const [ritiroData, setRitiroData] = useState<Date | undefined>(undefined);
  const [ritiroNote, setRitiroNote] = useState('');

  // Note generiche
  const [noteGen, setNoteGen] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [ok, setOk] = useState<{ id: string } | null>(null);

  function validate(): string[] {
    const errs: string[] = [];
    if (!mittente.ragioneSociale?.trim()) errs.push('Mittente: ragione sociale obbligatoria.');
    if (!destinatario.ragioneSociale?.trim()) errs.push('Destinatario: ragione sociale obbligatoria.');
    colli.forEach((c, i) => {
      const miss = c.lunghezza_cm == null || c.larghezza_cm == null || c.altezza_cm == null || c.peso_kg == null;
      const nonPos =
        (c.lunghezza_cm ?? 0) <= 0 ||
        (c.larghezza_cm ?? 0) <= 0 ||
        (c.altezza_cm ?? 0) <= 0 ||
        (c.peso_kg ?? 0) <= 0;
      if (miss || nonPos) errs.push(`Collo #${i + 1}: inserire tutte le misure e un peso > 0.`);
    });
    return errs;
  }

  async function salva() {
    if (saving) return;
    const v = validate();
    if (v.length) {
      setErrors(v);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setErrors(null);
    setSaving(true);
    try {
      const t = await getIdToken();
      const r = await fetch('/api/quotazioni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: JSON.stringify({
          sorgente: tipo,
          tipoSped: sottotipo,
          formato,
          contenuto,
          ritiroData: ritiroData ? ritiroData.toISOString() : undefined,
          ritiroNote,
          mittente,
          destinatario,
          noteGeneriche: noteGen,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'SERVER_ERROR');
      setOk({ id: j.id });
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      setErrors(['Errore durante il salvataggio della quotazione.']);
    } finally {
      setSaving(false);
    }
  }

  // --- SUCCESS ---
  if (ok) {
    return (
      <div ref={topRef} className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-800">Quotazione salvata</h1>
          <Link
            href="/dashboard/quotazioni"
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-[#1c3e5e] hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alle quotazioni
          </Link>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm">
            ID preventivo: <span className="font-mono">{ok.id}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Il back office potrà ora elaborare le opzioni e inviarti il link pubblico.
          </p>
        </div>
      </div>
    );
  }

  // --- FORM ---
  return (
    <div ref={topRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Nuova quotazione</h1>
        <Link
          href="/dashboard/quotazioni"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-[#1c3e5e] hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alle quotazioni
        </Link>
      </div>

      {!!errors?.length && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
          <div className="font-medium mb-1">Controlla questi campi:</div>
          <ul className="list-disc ml-5 space-y-1">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Tipologia"
            value={tipo}
            onChange={(v) => setTipo(v as 'vino' | 'altro')}
            options={[
              { label: 'Vino', value: 'vino' },
              { label: 'Altro', value: 'altro' },
            ]}
          />
          <Select
            label="Categoria"
            value={sottotipo}
            onChange={(v) => setSottotipo(v as 'B2B' | 'B2C' | 'Sample')}
            options={[
              { label: 'B2B — azienda', value: 'B2B' },
              { label: 'B2C — privato', value: 'B2C' },
              { label: 'Sample — campionatura', value: 'Sample' },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PartyCard title="Mittente" value={mittente} onChange={setMittente} />
        <PartyCard title="Destinatario" value={destinatario} onChange={setDestinatario} />
      </div>

      <ColliCard
        colli={colli}
        onChange={setColli}
        formato={formato}
        setFormato={setFormato}
        contenuto={contenuto}
        setContenuto={setContenuto}
      />

      <RitiroCard date={ritiroData} setDate={setRitiroData} note={ritiroNote} setNote={setRitiroNote} />

      <div className="rounded-2xl border bg-white p-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">Note generiche sulla spedizione</label>
        <textarea
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
          rows={3}
          value={noteGen}
          onChange={(e) => setNoteGen(e.target.value)}
          placeholder="Informazioni utili per il preventivo..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={salva}
          disabled={saving}
          aria-busy={saving}
          className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border border-slate-400 border-t-transparent" />
          )}
          <FilePlus2 className="h-4 w-4" />
          {saving ? 'Salvataggio…' : 'Salva quotazione'}
        </button>
      </div>
    </div>
  );
}
