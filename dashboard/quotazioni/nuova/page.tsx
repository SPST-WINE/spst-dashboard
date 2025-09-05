'use client';

import { useRef, useState } from 'react';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import { postPreventivo } from '@/lib/api';
import { getIdToken } from '@/lib/firebase-client-auth';
import { useRouter } from 'next/navigation';

const blank: Party = {
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
  const router = useRouter();
  const [mittente, setMittente] = useState<Party>(blank);
  const [destinatario, setDestinatario] = useState<Party>(blank);
  const [colli, setColli] = useState<Collo[]>([
    { lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null },
  ]);
  const [valuta, setValuta] = useState<'EUR'|'USD'|'GBP'>('EUR');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  function validate(): string[] {
    const e: string[] = [];
    if (!mittente.ragioneSociale?.trim()) e.push('Mittente: ragione sociale mancante.');
    if (!mittente.paese?.trim() || !mittente.citta?.trim() || !mittente.indirizzo?.trim()) e.push('Mittente: indirizzo incompleto.');
    if (!destinatario.ragioneSociale?.trim()) e.push('Destinatario: ragione sociale/nome mancante.');
    if (!destinatario.paese?.trim() || !destinatario.citta?.trim() || !destinatario.indirizzo?.trim()) e.push('Destinatario: indirizzo incompleto.');
    if (colli.some(c => c.lunghezza_cm==null || c.larghezza_cm==null || c.altezza_cm==null || c.peso_kg==null)) {
      e.push('Inserisci dimensioni e peso per tutti i colli.');
    }
    return e;
  }

  async function salva() {
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
     await postPreventivo(
  {
    mittente: {
      ragioneSociale: mittente.ragioneSociale,
      paese: mittente.paese,
      citta: mittente.citta,
      cap: mittente.cap,
      indirizzo: mittente.indirizzo,
      telefono: mittente.telefono || undefined,
      taxId: mittente.piva || undefined,
    },
    destinatario: {
      ragioneSociale: destinatario.ragioneSociale,
      paese: destinatario.paese,
      citta: destinatario.citta,
      cap: destinatario.cap,
      indirizzo: destinatario.indirizzo,
      telefono: destinatario.telefono || undefined,
      taxId: destinatario.piva || undefined,
    },
    colli: (colli || []).map(c => ({
      quantita: 1,
      lunghezza_cm: c.lunghezza_cm ?? null,
      larghezza_cm: c.larghezza_cm ?? null,
      altezza_cm: c.altezza_cm ?? null,
      peso_kg: c.peso_kg ?? null,
    })),
    valuta,                               // 'EUR' | 'USD' | 'GBP'
    noteGeneriche: note,                  // <-- QUI il fix: mappa note -> noteGeneriche
    ritiroData: ritiroData ? ritiroData.toISOString() : undefined,
    tipoSped,                             // 'B2B' | 'B2C' | 'Sample' (se presenti nello state)
    incoterm,                             // 'DAP' | 'DDP' | 'EXW'   (se presenti nello state)
  },
  getIdToken
);


  return (
    <div className="space-y-4" ref={topRef}>
      <h2 className="text-lg font-semibold">Nuova quotazione</h2>

      {!!errors.length && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <div className="font-medium mb-1">Controlla questi campi:</div>
          <ul className="ml-5 list-disc space-y-1">{errors.map((e,i)=><li key={i}>{e}</li>)}</ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <PartyCard title="Mittente" value={mittente} onChange={setMittente} />
        <PartyCard title="Destinatario" value={destinatario} onChange={setDestinatario} />
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <label className="block text-sm font-medium mb-1 text-slate-700">Valuta</label>
        <select value={valuta} onChange={e=>setValuta(e.target.value as any)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
        </select>

        <label className="block text-sm font-medium mb-1 mt-4 text-slate-700">Note generiche spedizione</label>
        <textarea value={note} onChange={e=>setNote(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" rows={3} placeholder="Restrizioni, vincoli orari, documenti disponibili..." />
      </div>

      <ColliCard colli={colli} onChange={setColli} formato={'Pacco'} setFormato={()=>{}} contenuto={''} setContenuto={()=>{}} />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={salva}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {saving && <span className="inline-block h-4 w-4 animate-spin rounded-full border border-slate-400 border-t-transparent" />}
          {saving ? 'Invio…' : 'Invia richiesta di preventivo'}
        </button>
      </div>
    </div>
  );
}
