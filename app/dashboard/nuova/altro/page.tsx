// app/dashboard/nuova/altro/page.tsx  (solo handler "salva" aggiornato)
'use client';

import { useState } from 'react';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import FatturaCard from '@/components/nuova/FatturaCard';
import { Select } from '@/components/nuova/Field';
import { postSpedizione } from '@/lib/api';
import { getIdToken } from '@/lib/firebase-client-auth';

const blankParty: Party = {
  ragioneSociale: '', referente: '', paese: '', citta: '',
  cap: '', indirizzo: '', telefono: '', piva: '',
};

export default function NuovaAltroPage() {
  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');
  const [mittente, setMittente] = useState<Party>(blankParty);
  const [destinatario, setDestinatario] = useState<Party>(blankParty);

  const [colli, setColli] = useState<Collo[]>([{ lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null }]);
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
  const [fatturaFile, setFatturaFile] = useState<File | undefined>(undefined);

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
      fatturaFileName: fatturaFile?.name || null,
      colli,
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
