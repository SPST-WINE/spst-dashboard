'use client';

import { useState } from 'react';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import FatturaCard from '@/components/nuova/FatturaCard';
import PackingListVino, { RigaPL } from '@/components/nuova/PackingListVino';
import { Select } from '@/components/nuova/Field';

const blankParty: Party = {
  ragioneSociale: '', referente: '', paese: '', citta: '',
  cap: '', indirizzo: '', telefono: '', piva: '',
};

export default function NuovaVinoPage() {
  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Campionatura'>('B2B');
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
  const [pl, setPl] = useState<RigaPL[]>([{
    etichetta: '', bottiglie: 1, formato_litri: 0.75, gradazione: 12,
    costo_unit: 0, peso_netto_bott: 0.75, peso_lordo_bott: 1.3,
  }]);

  const salva = () => {
    console.log({
      tipoSped,
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
    });
    alert('Dati raccolti (placeholder).');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Nuova spedizione — vino</h2>

      <div className="rounded-2xl border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-spst-orange">Tipologia spedizione</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <Select
            label="Tipo"
            value={tipoSped}
            onChange={(v) => setTipoSped(v as 'B2B' | 'B2C' | 'Campionatura')}
            options={[
              { label: 'B2B', value: 'B2B' },
              { label: 'B2C', value: 'B2C' },
              { label: 'Campionatura', value: 'Campionatura' },
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
        contenuto={''}
        setContenuto={() => {}}
      />

      <RitiroCard
        date={ritiroData}
        setDate={setRitiroData}
        note={ritiroNote}
        setNote={setRitiroNote}
      />

      <PackingListVino righe={pl} onChange={setPl} />

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
