'use client';

import { useState } from 'react';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import FatturaCard from '@/components/nuova/FatturaCard';
import PackingListVino, { RigaPL } from '@/components/nuova/PackingListVino';
import { Select } from '@/components/nuova/Field';
import Switch from '@/components/nuova/Switch';

const blankParty: Party = {
  ragioneSociale: '', referente: '', paese: '', citta: '',
  cap: '', indirizzo: '', telefono: '', piva: '',
};

export default function NuovaVinoPage() {
  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');
  const [destAbilitato, setDestAbilitato] = useState<boolean>(false);

  const [mittente, setMittente] = useState<Party>(blankParty);
  const [destinatario, setDestinatario] = useState<Party>(blankParty);

  const [colli, setColli] = useState<Collo[]>([
    { lunghezza_cm: 0, larghezza_cm: 0, altezza_cm: 0, peso_kg: 0 },
  ]);
  const [formato, setFormato] = useState<'Pacco' | 'Pallet'>('Pacco');

  const [ritiroData, setRitiroData] = useState<Date | undefined>(undefined);
  const [ritiroNote, setRitiroNote] = useState('');

  const [incoterm, setIncoterm] = useState<'DAP' | 'DDP' | 'EXW'>('DAP');
  const [valuta, setValuta] = useState<'EUR' | 'USD' | 'GBP'>('EUR');
  const [noteFatt, setNoteFatt] = useState('');
  const [delega, setDelega] = useState(false);

  // packing list (nuovi campi: prezzo + valuta)
  const [pl, setPl] = useState<RigaPL[]>([{
    etichetta: '',
    bottiglie: 1,
    formato_litri: 0.75,
    gradazione: 12,
    prezzo: 0,
    valuta: 'EUR',
    peso_netto_bott: 0.75,
    peso_lordo_bott: 1.3,
  }]);

  // allegato opzionale della packing list
  const [plFile, setPlFile] = useState<File | undefined>(undefined);

  const salva = () => {
    console.log({
      tipoSped,
      destAbilitato,
      mittente,
      destinatario,
      colli,
      formato,
      ritiroData,
      ritiroNote,
      incoterm,
      valuta,
      noteFatt,
      delega,
      packingList: pl,
      packingListFileName: plFile?.name ?? null,
    });
    alert('Dati raccolti (placeholder).');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Nuova spedizione — vino</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-spst-orange">Tipologia spedizione</h3>
          <div className="space-y-3">
            <Select
              label="Stai spedendo ad un privato? O ad una azienda?"
              value={tipoSped}
              onChange={(v) => setTipoSped(v as 'B2B' | 'B2C' | 'Sample')}
              options={[
                { label: 'B2C — Sto spedendo ad un privato / cliente', value: 'B2C' },
                { label: 'B2B — Sto spedendo ad una azienda', value: 'B2B' },
                { label: 'Sample — Sto spedendo una campionatura ad una azienda / importatore', value: 'Sample' },
              ]}
            />
            <Switch
              checked={destAbilitato}
              onChange={setDestAbilitato}
              label="Il destinatario è un soggetto abilitato ad importare vino nel paese di destinazione?"
            />
          </div>
        </div>
        <div className="hidden md:block" />
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
        contenuto={''}
        setContenuto={() => {}}
      />

      <RitiroCard date={ritiroData} setDate={setRitiroData} note={ritiroNote} setNote={setRitiroNote} />

      <PackingListVino
        righe={pl}
        onChange={setPl}
        allegato={plFile}
        setAllegato={setPlFile}
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
