// app/dashboard/nuova/vino/page.tsx
'use client';

import { useState } from 'react';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import FatturaCard from '@/components/nuova/FatturaCard';
import PackingListVino, { RigaPL } from '@/components/nuova/PackingListVino';
import { Select } from '@/components/nuova/Field';
import Switch from '@/components/nuova/Switch';
import { postSpedizione } from '@/lib/api';
import { getIdToken } from '@/lib/firebase-client-auth';

const ORANGE = '#f7911e';

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
  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');
  const [destAbilitato, setDestAbilitato] = useState(false);

  const [mittente, setMittente] = useState<Party>(blankParty);
  const [destinatario, setDestinatario] = useState<Party>(blankParty);

  const [colli, setColli] = useState<Collo[]>([
    { lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null },
  ]);
  const [formato, setFormato] = useState<'Pacco' | 'Pallet'>('Pacco');

  const [ritiroData, setRitiroData] = useState<Date | undefined>(undefined);
  const [ritiroNote, setRitiroNote] = useState('');

  const [incoterm, setIncoterm] = useState<'DAP' | 'DDP' | 'EXW'>('DAP');
  const [valuta, setValuta] = useState<'EUR' | 'USD' | 'GBP'>('EUR');
  const [noteFatt, setNoteFatt] = useState('');
  const [delega, setDelega] = useState(false);

  const [fatturazione, setFatturazione] = useState<Party>(blankParty);
  const [sameAsDest, setSameAsDest] = useState(false);
  const [fatturaFile, setFatturaFile] = useState<File | undefined>(undefined);

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

  async function salva() {
    const payload = {
      sorgente: 'vino' as const,
      tipoSped,
      destAbilitato,
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
    alert(`Spedizione creata! ID: ${res.id}`);
  }

  return (
    <div className="space-y-4">
      {/* Tipologia + abilitazione import */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: ORANGE }}>
            Tipologia spedizione
          </h3>
          <div className="flex items-center gap-3">
            <Switch
              checked={destAbilitato}
              onChange={setDestAbilitato}
              label="Destinatario abilitato all’import"
            />
          </div>
        </div>

        <Select
          label="Stai spedendo ad un privato? O ad una azienda?"
          value={tipoSped}
          onChange={(v) => setTipoSped(v as 'B2B' | 'B2C' | 'Sample')}
          options={[
            { label: 'B2C — Sto spedendo ad un privato / cliente', value: 'B2C' },
            { label: 'B2B — Sto spedendo ad una azienda', value: 'B2B' },
            {
              label:
                'Sample — Sto spedendo una campionatura ad una azienda / importatore',
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

      {/* Packing list (vino) — usa la prop corretta "value" */}
      <PackingListVino value={pl} onChange={setPl} />

      {/* Colli */}
      <ColliCard colli={colli} onChange={setColli} formato={formato} setFormato={setFormato} />

      {/* Ritiro */}
      <RitiroCard date={ritiroData} setDate={setRitiroData} note={ritiroNote} setNote={setRitiroNote} />

      {/* Fattura */}
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
