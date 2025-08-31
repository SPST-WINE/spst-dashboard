'use client';

import { useState } from 'react';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import FatturaCard from '@/components/nuova/FatturaCard';
import { Select } from '@/components/nuova/Field';

const blankParty: Party = {
  ragioneSociale: '', referente: '', paese: '', citta: '',
  cap: '', indirizzo: '', telefono: '', piva: '',
};

export default function NuovaAltroPage() {
  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');

  const [mittente, setMittente] = useState<Party>(blankParty);
  const [destinatario, setDestinatario] = useState<Party>(blankParty);

  const [colli, setColli] = useState<Collo[]>([
    { lunghezza_cm: 0, larghezza_cm: 0, altezza_cm: 0, peso_kg: 0 },
  ]);
  const [formato, setFormato] = useState<'Pacco' | 'Pallet'>('Pacco');
  const [contenuto, setContenuto] = useState('');

  const [ritiroData, setRitiroData] = useState<Date | undefined>(undefined);
  const [ritiroNote, setRitiroNote] = useState('');

  const [incoterm, setIncoterm] = useState<'DAP' | 'DDP' | 'EXW'>('DAP');
  const [valuta, setValuta] = useState<'EUR' | 'USD' | 'GBP'>('EUR');
  const [noteFatt, setNoteFatt] = useState('');
  const [delega, setDelega] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Nuova spedizione — altre spedizioni</h2>

      <div className="rounded-2xl border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-spst-orange">Tipologia spedizione</h3>
        <div className="w-full md:max-w-xl">
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
    </div>
  );
}
