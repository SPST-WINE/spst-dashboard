'use client';

import { useState } from 'react';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import FatturaCard from '@/components/nuova/FatturaCard';
import { Select } from '@/components/nuova/Field';

const [sameAsDest, setSameAsDest] = useState(false);

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
  // Tipologia (niente switch “abilitato all’import” su ALTRO)
  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');

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

  // Fattura (commerciali + anagrafica fatturazione)
  const [incoterm, setIncoterm] = useState<'DAP' | 'DDP' | 'EXW'>('DAP');
  const [valuta, setValuta] = useState<'EUR' | 'USD' | 'GBP'>('EUR');
  const [noteFatt, setNoteFatt] = useState('');
  const [delega, setDelega] = useState(false);

  const [fatturazione, setFatturazione] = useState<Party>(blankParty);
  const [fatturaFile, setFatturaFile] = useState<File | undefined>(undefined);

  const salva = () => {
    console.log({
      tipoSped,
      mittente,
      destinatario,
      colli,
      formato,
      contenuto,
      ritiroData,
      ritiroNote,
      incoterm,
      valuta,
      noteFatt,
      delega,
      fatturazione,
      sameAsMitt,
      fatturaFileName: fatturaFile?.name,
    });
    alert('Dati raccolti (placeholder).');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Nuova spedizione — altre spedizioni</h2>

      {/* Tipologia spedizione */}
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-spst-orange">
          Tipologia spedizione
        </h3>
        <Select
          label="Stai spedendo ad un privato? O ad una azienda?"
          value={tipoSped}
          onChange={(v) => setTipoSped(v as 'B2B' | 'B2C' | 'Sample')}
          options={[
            { label: 'B2C — Sto spedendo ad un privato / cliente', value: 'B2C' },
            { label: 'B2B — Sto spedendo ad una azienda', value: 'B2B' },
            {
              label: 'Sample — Sto spedendo una campionatura ad una azienda / importatore',
              value: 'Sample',
            },
          ]}
        />
      </div>

      {/* Mittente / Destinatario */}
      <div className="grid gap-4 md:grid-cols-2">
        <PartyCard title="Mittente" value={mittente} onChange={setMittente} />
        <PartyCard title="Destinatario" value={destinatario} onChange={setDestinatario} />
      </div>

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
  destinatario={destinatario}       // <-- nuovo prop
  sameAsDest={sameAsDest}           // <-- nuovo state
  setSameAsDest={setSameAsDest}     // <-- nuovo setter
  fatturaFile={fatturaFile}
  setFatturaFile={setFatturaFile}
/>


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
