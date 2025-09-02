'use client';

import { useState } from 'react';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import FatturaCard from '@/components/nuova/FatturaCard';
import { Select } from '@/components/nuova/Field';
import { postSpedizione, postSpedizioneAttachments } from '@/lib/api';
import { getIdToken } from '@/lib/firebase-client-auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const blankParty: Party = {
  ragioneSociale: '', referente: '', paese: '', citta: '',
  cap: '', indirizzo: '', telefono: '', piva: '',
};

export default function NuovaAltroPage() {
  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');
  const [mittente, setMittente] = useState<Party>(blankParty);
  const [destinatario, setDestinatario] = useState<Party>(blankParty);

  const [colli, setColli] = useState<Collo[]>([
    { lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null }
  ]);
  const [formato, setFormato] = useState<'Pacco' | 'Pallet'>('Pacco');
  const [contenuto, setContenuto] = useState<string>('');

  const [ritiroData, setRitiroData] = useState<Date | undefined>(undefined);
  const [ritiroNote, setRitiroNote] = useState('');

  const [incoterm, setIncoterm] = useState<'DAP' | 'DDP' | 'EXW'>('DAP');
  const [valuta, setValuta] = useState<'EUR' | 'USD' | 'GBP'>('EUR');
  const [noteFatt, setNoteFatt] = useState('');
  const [delega, setDelega] = useState(false);

  const [fatturazione, setFatturazione] = useState<Party>(blankParty);
  const [sameAsDest, setSameAsDest] = useState(false);

  // 🔽 NUOVI STATE PER ALLEGATI
  const [fatturaFile, setFatturaFile] = useState<File | null>(null);
  const [plFiles, setPlFiles] = useState<File[]>([]);

  // Helper upload + attach
  async function uploadAndAttach(spedId: string) {
    const storage = getStorage();
    const fattura: { url: string; filename?: string }[] = [];
    const packing: { url: string; filename?: string }[] = [];

    // Fattura singola
    if (fatturaFile) {
      const r = ref(storage, `spedizioni/${spedId}/fattura/${fatturaFile.name}`);
      await uploadBytes(r, fatturaFile);
      const url = await getDownloadURL(r);
      fattura.push({ url, filename: fatturaFile.name });
    }

    // Packing list multipli (opzionale anche per "Altro")
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

  const salva = async () => {
    const payload = {
      sorgente: 'altro' as const,
      tipoSped,
      contenuto,
      formato,
      ritiroData: ritiroData ? ritiroData.toISOString() : undefined,
      ritiroNote,
      mittente,
      destinatario,
      incoterm,
      valuta,
      noteFatt,
      fatturazione: sameAsDest ? destinatario : fatturazione,
      fattSameAsDest: sameAsDest,
      fattDelega: delega,
      // facoltativo: salvo anche il nome file, non obbligatorio
      fatturaFileName: fatturaFile?.name || null,
      colli,
    };

    const res = await postSpedizione(payload, getIdToken);
    try {
      await uploadAndAttach(res.id);
      alert(`Spedizione creata! ID: ${res.id}`);
    } catch (e: any) {
      console.error('Allegati: errore upload/attach', e);
      alert(`Spedizione creata (ID: ${res.id}) ma upload allegati fallito. Puoi ritentare dal dettaglio.`);
    }
  };

  return (
    <div className="space-y-4">
      {/* ...tutto il resto invariato... */}

      {/* 🔽 SEZIONE ALLEGATI */}
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
