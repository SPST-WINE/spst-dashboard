// app/dashboard/nuova/altro/page.tsx
'use client';

import { useEffect, useState } from 'react';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import { postSpedizione, postSpedizioneAttachments, getUserProfile } from '@/lib/api';
import { getIdToken } from '@/lib/firebase-client-auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';

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

export default function NuovaAltroPage() {
  const router = useRouter();

  // ----- stato base -----
  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');
  const [formato, setFormato] = useState<'Pacco' | 'Pallet'>('Pacco');
  const [incoterm, setIncoterm] = useState<'DAP' | 'DDP' | 'EXW'>('DAP');
  const [valuta, setValuta] = useState<'EUR' | 'USD' | 'GBP'>('EUR');

  const [mittente, setMittente] = useState<Party>(blankParty);
  const [destinatario, setDestinatario] = useState<Party>(blankParty);

  const [colli, setColli] = useState<Collo[]>([
    { lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null },
  ]);

  const [ritiroData, setRitiroData] = useState<string | undefined>(undefined); // ISO date (YYYY-MM-DD)
  const [ritiroNote, setRitiroNote] = useState('');

  const [noteFatt, setNoteFatt] = useState('');
  const [delega, setDelega] = useState(false);
  const [sameAsDest, setSameAsDest] = useState(false);
  const [fatturazione, setFatturazione] = useState<Party>(blankParty);

  // ----- allegati -----
  const [fatturaFile, setFatturaFile] = useState<File | null>(null);
  const [plFiles, setPlFiles] = useState<File[]>([]);

  // Prefill mittente da profilo Airtable (tabella UTENTI)
  useEffect(() => {
    (async () => {
      try {
        const r = await getUserProfile(getIdToken);
        if (r?.ok && r?.party) {
          setMittente(prev => ({ ...prev, ...r.party }));
          // se vuoi pre-fill anche la fatturazione:
          setFatturazione(prev => ({ ...prev, ...r.party }));
        }
      } catch { /* opzionale: ignora errori */ }
    })();
  }, []);

  // Upload + attach su Firebase Storage -> Airtable
  async function uploadAndAttach(spedId: string) {
    const storage = getStorage();
    const fattura: { url: string; filename?: string }[] = [];
    const packing: { url: string; filename?: string }[] = [];

    if (fatturaFile) {
      const r = ref(storage, `spedizioni/${spedId}/fattura/${fatturaFile.name}`);
      await uploadBytes(r, fatturaFile);
      const url = await getDownloadURL(r);
      fattura.push({ url, filename: fatturaFile.name });
    }

    for (const f of plFiles) {
      const r = ref(storage, `spedizioni/${spedId}/packing/${f.name}`);
      await uploadBytes(r, f);
      const url = await getDownloadURL(r);
      packing.push({ url, filename: f.name });
    }

    if (fattura.length || packing.length) {
      await postSpedizioneAttachments(spedId, { fattura, packing }, getIdToken);
    }
  }

  async function salva() {
    const payload = {
      sorgente: 'altro' as const,
      tipoSped,
      contenuto: '', // opzionale per "altro"
      formato,
      ritiroData: ritiroData ? new Date(ritiroData).toISOString() : undefined,
      ritiroNote,
      mittente,
      destinatario,
      incoterm,
      valuta,
      noteFatt,
      fatturazione: sameAsDest ? destinatario : fatturazione,
      fattSameAsDest: sameAsDest,
      fattDelega: delega,
      fatturaFileName: fatturaFile?.name || null,
      colli,
    };

    const res = await postSpedizione(payload, getIdToken);
    try {
      await uploadAndAttach(res.id);
      // Vai alla lista o mostra conferma
      router.push(`/dashboard/nuova/altro?ok=${encodeURIComponent(res.id)}`);
    } catch (e) {
      console.error('Upload allegati fallito:', e);
      router.push(`/dashboard/nuova/altro?ok=${encodeURIComponent(res.id)}&attach=ko`);
    }
  }

  return (
    <div className="space-y-4">
      {/* Dettagli spedizione (selettori base) */}
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="mb-3 font-medium">Dettagli spedizione</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm">Tipo</label>
            <select
              value={tipoSped}
              onChange={(e) => setTipoSped(e.target.value as any)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
              <option value="Sample">Sample</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Formato</label>
            <select
              value={formato}
              onChange={(e) => setFormato(e.target.value as any)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="Pacco">Pacco</option>
              <option value="Pallet">Pallet</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Incoterm</label>
            <select
              value={incoterm}
              onChange={(e) => setIncoterm(e.target.value as any)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="DAP">DAP</option>
              <option value="DDP">DDP</option>
              <option value="EXW">EXW</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Valuta</label>
            <select
              value={valuta}
              onChange={(e) => setValuta(e.target.value as any)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mittente / Destinatario */}
      <div className="grid gap-4 md:grid-cols-2">
        <PartyCard title="Mittente" value={mittente} onChange={setMittente} />
        <PartyCard title="Destinatario" value={destinatario} onChange={setDestinatario} />
      </div>

      {/* Ritiro */}
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="mb-3 font-medium">Ritiro</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm">Data ritiro</label>
            <input
              type="date"
              value={ritiroData || ''}
              onChange={(e) => setRitiroData(e.target.value || undefined)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Note ritiro</label>
            <input
              type="text"
              value={ritiroNote}
              onChange={(e) => setRitiroNote(e.target.value)}
              placeholder="Istruzioni per il ritiro…"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Colli */}
      <ColliCard colli={colli} onChange={setColli} />

      {/* Fatturazione */}
      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <h3 className="font-medium">Fatturazione</h3>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sameAsDest}
            onChange={(e) => setSameAsDest(e.target.checked)}
          />
          <span>Uguale al Destinatario</span>
        </label>

        {!sameAsDest && (
          <PartyCard title="Dati fatturazione" value={fatturazione} onChange={setFatturazione} />
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={delega}
              onChange={(e) => setDelega(e.target.checked)}
            />
            <span>Delega fattura a SPST</span>
          </label>

          <div>
            <label className="mb-1 block text-sm">Note fattura</label>
            <input
              type="text"
              value={noteFatt}
              onChange={(e) => setNoteFatt(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Note opzionali…"
            />
          </div>
        </div>
      </div>

      {/* Allegati (opzionali) */}
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-medium mb-2">Allegati (opzionali)</h3>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm mb-1">Fattura (PDF/JPG/PNG)</label>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFatturaFile(e.target.files?.[0] ?? null)}
              className="block w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Packing List (uno o più file)</label>
            <input
              type="file"
              multiple
              accept="application/pdf,image/*"
              onChange={(e) => setPlFiles(Array.from(e.target.files || []))}
              className="block w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={salva}
          className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
        >
          Salva
        </button>
      </div>
    </div>
  );
}
