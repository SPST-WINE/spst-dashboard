// app/dashboard/nuova/vino/page.tsx
'use client';

import { useState } from 'react';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import FatturaCard from '@/components/nuova/FatturaCard';
import PackingListVino, { RigaPL } from '@/components/nuova/PackingListVino';
import { Select } from '@/components/nuova/Field';
import { postSpedizione, postSpedizioneAttachments } from '@/lib/api';
import { getIdToken } from '@/lib/firebase-client-auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

export default function NuovaVinoPage() {
  // Tipologia
  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');
  const [destAbilitato, setDestAbilitato] = useState(false);

  // Parti
  const [mittente, setMittente] = useState<Party>(blankParty);
  const [destinatario, setDestinatario] = useState<Party>(blankParty);

  // Colli
  const [colli, setColli] = useState<Collo[]>([
    { lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null },
  ]);
  const [formato, setFormato] = useState<'Pacco' | 'Pallet'>('Pacco');
  const [contenuto, setContenuto] = useState<string>('');

  // Ritiro
  const [ritiroData, setRitiroData] = useState<Date | undefined>(undefined);
  const [ritiroNote, setRitiroNote] = useState('');

  // Fattura
  const [incoterm, setIncoterm] = useState<'DAP' | 'DDP' | 'EXW'>('DAP');
  const [valuta, setValuta] = useState<'EUR' | 'USD' | 'GBP'>('EUR');
  const [noteFatt, setNoteFatt] = useState('');
  const [delega, setDelega] = useState(false);
  const [fatturazione, setFatturazione] = useState<Party>(blankParty);
  const [sameAsDest, setSameAsDest] = useState(false);
  const [fatturaFile, setFatturaFile] = useState<File | undefined>(undefined); // usato da FatturaCard

  // Allegati PL (multi-file)
  const [plFiles, setPlFiles] = useState<File[]>([]);

  // Packing list vino (righe dati)
  const [pl, setPl] = useState<RigaPL[]>([
    {
      etichetta: '',
      bottiglie: 1,
      formato_litri: 0.75,
      gradazione: 12,
      prezzo: 0,
      valuta: 'EUR',
      peso_netto_bott: 0.75,
      peso_lordo_bott: 1.3,
    },
  ]);

  // Upload su Firebase Storage + attach in Airtable
  async function uploadAndAttach(spedId: string) {
    const storage = getStorage();
    const fattura: { url: string; filename?: string }[] = [];
    const packing: { url: string; filename?: string }[] = [];

    // fattura singola (se presente dal FatturaCard)
    if (fatturaFile) {
      const r = ref(storage, `spedizioni/${spedId}/fattura/${fatturaFile.name}`);
      await uploadBytes(r, fatturaFile);
      const url = await getDownloadURL(r);
      fattura.push({ url, filename: fatturaFile.name });
    }

    // packing list multipli
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

  // Salva -> POST /api/spedizioni
  const salva = async () => {
    const payload = {
      sorgente: 'vino' as const,
      tipoSped,
      destAbilitato,
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
      fatturaFileName: fatturaFile?.name || null,
      colli,
      packingList: pl,
    };

    const res = await postSpedizione(payload, getIdToken);
    try {
      await uploadAndAttach(res.id);
      alert(`Spedizione creata! ID: ${res.id}`);
    } catch (e) {
      console.error('Allegati: errore upload/attach', e);
      alert(`Spedizione creata (ID: ${res.id}) ma upload allegati fallito.`);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Nuova spedizione — vino</h2>

      {/* Tipologia spedizione */}
      <div className="rounded-2xl border bg-white p-4">
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
      </div>

      {/* Mittente / Destinatario */}
      <div className="grid gap-4 md:grid-cols-2">
        <PartyCard title="Mittente" value={mittente} onChange={setMittente} />
        <PartyCard
          title="Destinatario"
          value={destinatario}
          onChange={setDestinatario}
          extraSwitch={{
            label: 'Destinatario abilitato all’import',
            checked: destAbilitato,
            onChange: setDestAbilitato,
          }}
        />
      </div>

      {/* Packing list (righe dati vino) */}
      <PackingListVino value={pl} onChange={setPl} />

      {/* Colli */}
      <ColliCard
        colli={colli}
        onChange={setColli}
        formato={formato}
        setFormato={setFormato}
        contenuto={contenuto}
        setContenuto={setContenuto}
      />

      {/* Ritiro */}
      <RitiroCard
        date={ritiroData}
        setDate={setRitiroData}
        note={ritiroNote}
        setNote={setRitiroNote}
      />

      {/* Fattura (contiene anche l'input singolo fatturaFile) */}
      <FatturaCard
        incoterm={incoterm}
        setIncoterm={setIncoterm}
        valuta={valuta}
        setValuta={setValuta}
        note={noteFatt}
        setNote={setNoteFatt}
        delega={delega}
        setDelega={setDelega}
        fatturazione={fatturazione}
        setFatturazione={setFatturazione}
        destinatario={destinatario}
        sameAsDest={sameAsDest}
        setSameAsDest={setSameAsDest}
        fatturaFile={fatturaFile}
        setFatturaFile={setFatturaFile}
      />

      {/* Allegati (Packing List multipli) */}
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-medium mb-2">Allegati (opzionali)</h3>
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
