// app/dashboard/quotazioni/nuova/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import { getIdToken } from '@/lib/firebase-client-auth';
import { getUserProfile } from '@/lib/api';
import { Select } from '@/components/nuova/Field'; // 👈 usiamo lo stesso Select delle spedizioni

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

  // email (dal profilo)
  const [email, setEmail] = useState<string>('');

  // Parti
  const [mittente, setMittente] = useState<Party>(blankParty);
  const [destinatario, setDestinatario] = useState<Party>(blankParty);

  // Colli / dettagli merce
  const [colli, setColli] = useState<Collo[]>([
    { lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null },
  ]);
  const [formato, setFormato] = useState<'Pacco' | 'Pallet'>('Pacco');
  const [contenuto, setContenuto] = useState<string>('');

  // Ritiro
  const [ritiroData, setRitiroData] = useState<Date | undefined>(undefined);
  const [ritiroNote, setRitiroNote] = useState('');

  // Parametri commerciali
  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');
  const [incoterm, setIncoterm] = useState<'DAP' | 'DDP' | 'EXW'>('DAP'); // DDP (non DPP)

  // Note generiche
  const [noteGeneriche, setNoteGeneriche] = useState('');

  // UI
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [okId, setOkId] = useState<string | null>(null);

  // Prefill mittente da profilo & email utente
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getUserProfile(getIdToken);
        if (!cancelled && r?.ok) {
          if (r.email) setEmail(r.email);
          if (r.party) setMittente(prev => ({ ...prev, ...r.party }));
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // Validazione minima per la quotazione
  function validate(): string[] {
    const errs: string[] = [];
    if (!mittente.ragioneSociale?.trim()) errs.push('Inserisci la ragione sociale del mittente.');
    if (!destinatario.ragioneSociale?.trim()) errs.push('Inserisci la ragione sociale del destinatario.');
    if (!ritiroData) errs.push('Seleziona il giorno di ritiro.');
    const invalid = colli.some(c =>
      c.lunghezza_cm == null || c.larghezza_cm == null || c.altezza_cm == null || c.peso_kg == null ||
      (c.lunghezza_cm ?? 0) <= 0 || (c.larghezza_cm ?? 0) <= 0 || (c.altezza_cm ?? 0) <= 0 || (c.peso_kg ?? 0) <= 0
    );
    if (invalid) errs.push('Inserisci misure e pesi > 0 per ogni collo.');
    return errs;
  }

  async function salva() {
    if (saving) return;
    const v = validate();
    if (v.length) {
      setErrors(v);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    } else {
      setErrors([]);
    }

    setSaving(true);
    try {
      const t = await getIdToken();

      // Unisco le note del ritiro alle note generiche, così arrivano in Airtable
      const noteCombined = [noteGeneriche, ritiroNote?.trim() ? `Note ritiro: ${ritiroNote.trim()}` : '']
        .filter(Boolean)
        .join('\n');

      // Payload per /api/quotazioni
      const payload = {
        createdByEmail: email || undefined,
        customerEmail: email || undefined,
        valuta: 'EUR' as const,
        tipoSped,                 // 👈 nuovo
        incoterm,                 // 👈 nuovo
        ritiroData: ritiroData ? ritiroData.toISOString() : undefined,
        noteGeneriche: noteCombined || undefined,
        mittente: {
          ragioneSociale: mittente.ragioneSociale || undefined,
          indirizzo: mittente.indirizzo || undefined,
          cap: mittente.cap || undefined,
          citta: mittente.citta || undefined,
          paese: mittente.paese || undefined,
          telefono: mittente.telefono || undefined,
          taxId: mittente.piva || undefined, // -> Mittente_Tax
        },
        destinatario: {
          ragioneSociale: destinatario.ragioneSociale || undefined,
          indirizzo: destinatario.indirizzo || undefined,
          cap: destinatario.cap || undefined,
          citta: destinatario.citta || undefined,
          paese: destinatario.paese || undefined,
          telefono: destinatario.telefono || undefined,
          taxId: destinatario.piva || undefined, // -> Destinatario_Tax
        },
        colli: (colli || []).map(c => ({
          qty: 1,
          l1_cm: c.lunghezza_cm ?? undefined,
          l2_cm: c.larghezza_cm ?? undefined,
          l3_cm: c.altezza_cm ?? undefined,
          peso_kg: c.peso_kg ?? undefined,
        })),
      };

      const res = await fetch('/api/quotazioni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'SERVER_ERROR');
      setOkId(j.id as string);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      console.error('Errore creazione preventivo', e);
      setErrors(['Errore durante la creazione della quotazione. Riprova.']);
    } finally {
      setSaving(false);
    }
  }

  // Success UI
  if (okId) {
    return (
      <div ref={topRef} className="space-y-4">
        <h2 className="text-lg font-semibold">Quotazione inviata</h2>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm">
            Il tuo preventivo è stato creato (ID: <span className="font-mono">{okId}</span>).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/quotazioni" className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50">Le mie quotazioni</Link>
            <Link href="/dashboard/quotazioni/nuova" className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50">Nuova quotazione</Link>
          </div>
        </div>
      </div>
    );
  }

  // FORM
  return (
    <div ref={topRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Nuova quotazione</h1>
        <Link href="/dashboard/quotazioni" className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50">Le mie quotazioni</Link>
      </div>

      {!!errors.length && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
          <div className="font-medium mb-1">Controlla questi campi:</div>
          <ul className="list-disc ml-5 space-y-1">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {/* Parametri: tipo + incoterm */}
      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-spst-blue">Parametri spedizione</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            label="Stai spedendo ad un privato? O ad una azienda?"
            value={tipoSped}
            onChange={(v) => setTipoSped(v as 'B2B' | 'B2C' | 'Sample')}
            options={[
              { label: 'B2C — privato / cliente', value: 'B2C' },
              { label: 'B2B — azienda', value: 'B2B' },
              { label: 'Sample — campionatura', value: 'Sample' },
            ]}
          />
          <Select
            label="Incoterm"
            value={incoterm}
            onChange={(v) => setIncoterm(v as 'DAP' | 'DDP' | 'EXW')}
            options={[
              { label: 'DAP — Spedizione a carico del mittente, dazi ed oneri a carico del destinatario', value: 'DAP' },
              { label: 'DDP — Tutte le spese a carico del mittente', value: 'DDP' }, // 👈 non "DPP"
              { label: 'EXW — Tutte le spese a carico del destinatario', value: 'EXW' },
            ]}
          />
        </div>
      </div>

      {/* Mittente / Destinatario */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="mb-3 text-base font-semibold text-spst-blue">Mittente</h2>
          <PartyCard value={mittente} onChange={setMittente} title="" />
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="mb-3 text-base font-semibold text-spst-blue">Destinatario</h2>
          <PartyCard value={destinatario} onChange={setDestinatario} title="" />
        </div>
      </div>

      {/* Colli / Contenuto */}
      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-spst-blue">Colli e contenuto</h2>
        <ColliCard
          colli={colli}
          onChange={setColli}
          formato={formato}
          setFormato={setFormato}
          contenuto={contenuto}
          setContenuto={setContenuto}
        />
      </div>

      {/* Ritiro */}
      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-spst-blue">Ritiro</h2>
        <RitiroCard date={ritiroData} setDate={setRitiroData} note={ritiroNote} setNote={setRitiroNote} />
      </div>

      {/* Note generiche */}
      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-spst-blue">Note & documenti</h2>
        <label className="mb-1 block text-sm font-medium text-slate-700">Note generiche sulla spedizione</label>
        <textarea
          value={noteGeneriche}
          onChange={(e) => setNoteGeneriche(e.target.value)}
          rows={4}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
          placeholder="Es. orari preferiti, vincoli, dettagli utili…"
        />
      </div>

      {/* CTA */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={salva}
          disabled={saving}
          aria-busy={saving}
          className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {saving && <span className="inline-block h-4 w-4 animate-spin rounded-full border border-slate-400 border-t-transparent" />}
          {saving ? 'Invio…' : 'Invia richiesta'}
        </button>
      </div>
    </div>
  );
}
