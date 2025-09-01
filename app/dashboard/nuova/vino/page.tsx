// app/dashboard/nuova/vino/page.tsx  (solo handler "salva" aggiornato)
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
import { getIdToken } from '@/lib/firebase-client-auth'; // funzione che ritorna l'idToken corrente (implementata nel tuo client)

const blankParty: Party = {
  ragioneSociale: '', referente: '', paese: '', citta: '',
  cap: '', indirizzo: '', telefono: '', piva: '',
};

export default function NuovaVinoPage() {
  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');
  const [destAbilitato, setDestAbilitato] = useState<boolean>(false);

  const [mittente, setMittente] = useState<Party>(blankParty);
  const [destinatario, setDestinatario] = useState<Party>(blankParty);

  const [colli, setColli] = useState<Collo[]>([{ lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null }]);
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
    { etichetta: '', bottiglie: 1, formato_litri: 0.75, gradazione: 12, prezzo: 0, valuta: 'EUR', peso_netto_bott: 0.75, peso_lordo_bott: 1.3 },
  ]);

  const salva = async () => {
    const payload = {
      sorgente: 'vino' as const,
      tipoSped,
      destAbilitato,
      contenuto: '', // se lo usi altrove, portalo qui
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
  };

  return (
    <div className="space-y-4">
      {/* ...tutto il resto invariato... */}
      <div className="flex justify-end">
        <button type="button" onClick={salva} className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50">
          Salva
        </button>
      </div>
    </div>
  );
}
