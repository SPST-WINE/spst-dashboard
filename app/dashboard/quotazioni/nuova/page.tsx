// app/dashboard/quotazioni/nuova/page.tsx
'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { getIdToken } from '@/lib/firebase-client-auth';

type PartyQ = {
  ragioneSociale?: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  paese?: string;
  telefono?: string;
  taxId?: string; // P.IVA / EORI / EIN
};

type ColloQ = {
  qty?: number;
  l1_cm?: number | null;
  l2_cm?: number | null;
  l3_cm?: number | null;
  peso_kg?: number | null;
};

export default function NuovaQuotazionePage() {
  const topRef = useRef<HTMLDivElement>(null);

  const [mittente, setMittente] = useState<PartyQ>({});
  const [destinatario, setDestinatario] = useState<PartyQ>({});
  const [valuta, setValuta] = useState<'EUR' | 'USD' | 'GBP'>('EUR');
  const [ritiroData, setRitiroData] = useState<string>('');
  const [noteGeneriche, setNoteGeneriche] = useState<string>('');
  const [docFatturaRichiesta, setDocFatturaRichiesta] = useState(false);
  const [docPLRichiesta, setDocPLRichiesta] = useState(false);

  const [colli, setColli] = useState<ColloQ[]>([
    { qty: 1, l1_cm: null, l2_cm: null, l3_cm: null, peso_kg: null },
  ]);

  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<{ id: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const addCollo = () =>
    setColli((v) => [...v, { qty: 1, l1_cm: null, l2_cm: null, l3_cm: null, peso_kg: null }]);

  async function onSubmit() {
    setErr(null);
    setSaving(true);
    try {
      const token = await getIdToken();

      const payload = {
        valuta,
        ritiroData: ritiroData || undefined,
        noteGeneriche: noteGeneriche || undefined,
        docFatturaRichiesta,
        docPLRichiesta,
        mittente,       // <- contiene taxId
        destinatario,   // <- contiene taxId
        colli,
      };

      const r = await fetch('/api/quotazioni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'SERVER_ERROR');
      setOk({ id: j.id });
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (e: any) {
      setErr(e?.message || 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  }

  if (ok) {
    return (
      <div ref={topRef} className="space-y-6">
        <h1 className="text-2xl font-semibold">Quotazione creata</h1>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm mb-2">ID record Airtable</div>
          <div className="font-mono text-sm">{ok.id}</div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/quotazioni" className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50">
              Le mie quotazioni
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Nuova quotazione</h1>
        <Link href="/dashboard/quotazioni" className="text-sm underline underline-offset-4 text-slate-600">
          Vedi tutte
        </Link>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {err}
        </div>
      )}

      {/* Mittente */}
      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <h2 className="text-base font-semibold">Mittente</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input placeholder="Ragione sociale"
            className="rounded-lg border px-3 py-2 text-sm"
            value={mittente.ragioneSociale || ''} onChange={e => setMittente(v => ({ ...v, ragioneSociale: e.target.value }))} />
          <input placeholder="Indirizzo"
            className="rounded-lg border px-3 py-2 text-sm"
            value={mittente.indirizzo || ''} onChange={e => setMittente(v => ({ ...v, indirizzo: e.target.value }))} />
          <input placeholder="CAP"
            className="rounded-lg border px-3 py-2 text-sm"
            value={mittente.cap || ''} onChange={e => setMittente(v => ({ ...v, cap: e.target.value }))} />
          <input placeholder="Città"
            className="rounded-lg border px-3 py-2 text-sm"
            value={mittente.citta || ''} onChange={e => setMittente(v => ({ ...v, citta: e.target.value }))} />
          <input placeholder="Paese (es. IT)"
            className="rounded-lg border px-3 py-2 text-sm"
            value={mittente.paese || ''} onChange={e => setMittente(v => ({ ...v, paese: e.target.value }))} />
          <input placeholder="Telefono"
            className="rounded-lg border px-3 py-2 text-sm"
            value={mittente.telefono || ''} onChange={e => setMittente(v => ({ ...v, telefono: e.target.value }))} />
          <input placeholder="P.IVA / Tax ID (Mittente)"
            className="rounded-lg border px-3 py-2 text-sm md:col-span-2"
            value={mittente.taxId || ''} onChange={e => setMittente(v => ({ ...v, taxId: e.target.value }))} />
        </div>
      </div>

      {/* Destinatario */}
      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <h2 className="text-base font-semibold">Destinatario</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input placeholder="Ragione sociale"
            className="rounded-lg border px-3 py-2 text-sm"
            value={destinatario.ragioneSociale || ''} onChange={e => setDestinatario(v => ({ ...v, ragioneSociale: e.target.value }))} />
          <input placeholder="Indirizzo"
            className="rounded-lg border px-3 py-2 text-sm"
            value={destinatario.indirizzo || ''} onChange={e => setDestinatario(v => ({ ...v, indirizzo: e.target.value }))} />
          <input placeholder="CAP"
            className="rounded-lg border px-3 py-2 text-sm"
            value={destinatario.cap || ''} onChange={e => setDestinatario(v => ({ ...v, cap: e.target.value }))} />
          <input placeholder="Città"
            className="rounded-lg border px-3 py-2 text-sm"
            value={destinatario.citta || ''} onChange={e => setDestinatario(v => ({ ...v, citta: e.target.value }))} />
          <input placeholder="Paese (es. FR)"
            className="rounded-lg border px-3 py-2 text-sm"
            value={destinatario.paese || ''} onChange={e => setDestinatario(v => ({ ...v, paese: e.target.value }))} />
          <input placeholder="Telefono"
            className="rounded-lg border px-3 py-2 text-sm"
            value={destinatario.telefono || ''} onChange={e => setDestinatario(v => ({ ...v, telefono: e.target.value }))} />
          <input placeholder="P.IVA / Tax ID (Destinatario)"
            className="rounded-lg border px-3 py-2 text-sm md:col-span-2"
            value={destinatario.taxId || ''} onChange={e => setDestinatario(v => ({ ...v, taxId: e.target.value }))} />
        </div>
      </div>

      {/* Colli */}
      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <h2 className="text-base font-semibold">Colli</h2>
        <div className="space-y-3">
          {colli.map((c, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-5">
              <input type="number" placeholder="Q.tà"
                className="rounded-lg border px-3 py-2 text-sm"
                value={c.qty ?? ''} onChange={e => setColli(v => v.map((x, k) => k===i ? { ...x, qty: Number(e.target.value) || undefined } : x))} />
              <input type="number" placeholder="L1 (cm)"
                className="rounded-lg border px-3 py-2 text-sm"
                value={c.l1_cm ?? ''} onChange={e => setColli(v => v.map((x, k) => k===i ? { ...x, l1_cm: e.target.value ? Number(e.target.value) : null } : x))} />
              <input type="number" placeholder="L2 (cm)"
                className="rounded-lg border px-3 py-2 text-sm"
                value={c.l2_cm ?? ''} onChange={e => setColli(v => v.map((x, k) => k===i ? { ...x, l2_cm: e.target.value ? Number(e.target.value) : null } : x))} />
              <input type="number" placeholder="L3 (cm)"
                className="rounded-lg border px-3 py-2 text-sm"
                value={c.l3_cm ?? ''} onChange={e => setColli(v => v.map((x, k) => k===i ? { ...x, l3_cm: e.target.value ? Number(e.target.value) : null } : x))} />
              <input type="number" placeholder="Peso (kg)"
                className="rounded-lg border px-3 py-2 text-sm"
                value={c.peso_kg ?? ''} onChange={e => setColli(v => v.map((x, k) => k===i ? { ...x, peso_kg: e.target.value ? Number(e.target.value) : null } : x))} />
            </div>
          ))}
        </div>
        <button type="button" onClick={addCollo} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
          + Aggiungi collo
        </button>
      </div>

      {/* Altri dettagli */}
      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <h2 className="text-base font-semibold">Dettagli</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <select value={valuta} onChange={e => setValuta(e.target.value as any)}
            className="rounded-lg border px-3 py-2 text-sm">
            <option value="EUR">Valuta: EUR</option>
            <option value="USD">Valuta: USD</option>
            <option value="GBP">Valuta: GBP</option>
          </select>
          <input type="date" value={ritiroData} onChange={e => setRitiroData(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm" />
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={docFatturaRichiesta} onChange={e => setDocFatturaRichiesta(e.target.checked)} />
            Richiedi Fattura al cliente
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={docPLRichiesta} onChange={e => setDocPLRichiesta(e.target.checked)} />
            Richiedi Packing List
          </label>
        </div>
        <textarea
          placeholder="Note generiche sulla spedizione"
          className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
          rows={4}
          value={noteGeneriche}
          onChange={e => setNoteGeneriche(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {saving ? 'Salvataggio…' : 'Crea preventivo'}
        </button>
      </div>
    </div>
  );
}
