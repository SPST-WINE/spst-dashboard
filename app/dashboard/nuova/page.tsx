'use client';

import { useMemo, useState } from 'react';

type Collo = { lunghezza_cm: number; larghezza_cm: number; altezza_cm: number; peso_kg: number };
type Party = { ragione: string; paese: string; indirizzo: string; cap: string; citta: string; telefono: string; referente?: string; piva_cf?: string };
type PackingItem = { descrizione: string; quantita: number; valore_unit: number; volume_l?: number; gradazione?: number };

const emptyCollo: Collo = { lunghezza_cm: 0, larghezza_cm: 0, altezza_cm: 0, peso_kg: 0 };
const emptyParty: Party = { ragione: '', paese: '', indirizzo: '', cap: '', citta: '', telefono: '', referente: '', piva_cf: '' };
const emptyItem: PackingItem = { descrizione: '', quantita: 1, valore_unit: 0, volume_l: undefined, gradazione: undefined };

export default function NuovaSpedizionePage() {
  const email = typeof window !== 'undefined' ? (localStorage.getItem('userEmail') || '') : '';

  const [tab, setTab] = useState<'VINO' | 'ALTRO'>('VINO');
  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Campionatura'>('B2B');

  const [mittente, setMittente] = useState<Party>({ ...emptyParty });
  const [destinatario, setDestinatario] = useState<Party>({ ...emptyParty });

  const [colli, setColli] = useState<Collo[]>([ { ...emptyCollo } ]);
  const [formato, setFormato] = useState<'Pallet' | 'Pacco'>('Pacco');
  const [noteRitiro, setNoteRitiro] = useState('');
  const [contenuto, setContenuto] = useState('');       // per ALTRO
  const [dataRitiro, setDataRitiro] = useState<string>('');

  const [incoterm, setIncoterm] = useState<'DAP' | 'DDP' | 'EXW'>('DAP');
  const [valuta, setValuta] = useState('EUR');
  const [noteFatt, setNoteFatt] = useState('');
  const [fattURL, setFattURL] = useState('');
  const [delegaFatt, setDelegaFatt] = useState(false);

  const [packing, setPacking] = useState<PackingItem[]>([{ ...emptyItem }]); // per vino
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{t:'ok'|'err'; m:string}|null>(null);

  const canSave = useMemo(() => {
    const p = (party: Party) => party.ragione && party.paese && party.indirizzo && party.cap && party.citta && party.telefono;
    if (!p(mittente) || !p(destinatario)) return false;
    if (colli.length === 0) return false;
    return true;
  }, [mittente, destinatario, colli]);

  function updateCollo(i: number, key: keyof Collo, value: number) {
    setColli(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: value } : c));
  }

  function partyInputs(label: string, party: Party, setParty: (p: Party) => void) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">{label}</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Text label="Ragione sociale / Nome" value={party.ragione} onChange={v => setParty({ ...party, ragione: v })} />
          <Text label="Paese" value={party.paese} onChange={v => setParty({ ...party, paese: v })} placeholder="IT / FR / US..." />
          <Text label="Indirizzo" value={party.indirizzo} onChange={v => setParty({ ...party, indirizzo: v })} className="md:col-span-2" />
          <Text label="CAP" value={party.cap} onChange={v => setParty({ ...party, cap: v })} />
          <Text label="Città" value={party.citta} onChange={v => setParty({ ...party, citta: v })} />
          <Text label="Telefono" value={party.telefono} onChange={v => setParty({ ...party, telefono: v })} />
          <Text label="Referente" value={party.referente || ''} onChange={v => setParty({ ...party, referente: v })} />
          <Text label="Partita IVA / CF" value={party.piva_cf || ''} onChange={v => setParty({ ...party, piva_cf: v })} />
        </div>
      </div>
    );
  }

  async function onSubmit() {
    if (!email) { setMsg({t:'err', m:'Email non presente (MVP). Fai login o inserisci email nelle impostazioni.'}); return; }
    try {
      setSaving(true); setMsg(null);
      const payload: any = {
        email,
        tipo_generale: tab,
        tipo_spedizione: tipoSped,
        mittente,
        destinatario,
        colli,
        formato,
        note_ritiro: noteRitiro,
        data_ritiro: dataRitiro,
        fattura: { incoterm, valuta, note: noteFatt, url: fattURL, delega_creazione: delegaFatt },
      };
      if (tab === 'ALTRO') payload.contenuto = contenuto;
      if (tab === 'VINO') payload.packingList = packing;

      const res = await fetch('/api/spedizioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Errore creazione');
      setMsg({ t:'ok', m:'Spedizione creata. La troverai in “Le mie spedizioni”.' });
    } catch {
      setMsg({ t:'err', m:'Errore durante il salvataggio.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('VINO')}  className={tab==='VINO'  ? 'rounded-lg bg-spst-blue text-white px-3 py-1.5 text-sm' : 'rounded-lg border px-3 py-1.5 text-sm'}>
          Spedizione Vino
        </button>
        <button onClick={() => setTab('ALTRO')} className={tab==='ALTRO' ? 'rounded-lg bg-spst-blue text-white px-3 py-1.5 text-sm' : 'rounded-lg border px-3 py-1.5 text-sm'}>
          Altre spedizioni
        </button>
      </div>

      {/* Tipo spedizione */}
      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">Tipo di spedizione</h3>
        <div className="flex flex-wrap gap-2">
          {(['B2B','B2C','Campionatura'] as const).map(t => (
            <button key={t} onClick={() => setTipoSped(t)}
              className={['rounded-lg px-3 py-1.5 text-sm',
                        tipoSped===t ? 'bg-sppst-blue bg-spst-blue text-white' : 'border'].join(' ')}
            >{t}</button>
          ))}
        </div>
      </div>

      {partyInputs('Mittente', mittente, setMittente)}
      {partyInputs('Destinatario', destinatario, setDestinatario)}

      {/* Colli */}
      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">Colli</h3>
        <div className="space-y-3">
          {colli.map((c, i) => (
            <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Number label="Lunghezza (cm)" value={c.lunghezza_cm} onChange={v => updateCollo(i,'lunghezza_cm',v)} />
              <Number label="Larghezza (cm)"  value={c.larghezza_cm} onChange={v => updateCollo(i,'larghezza_cm',v)} />
              <Number label="Altezza (cm)"    value={c.altezza_cm}   onChange={v => updateCollo(i,'altezza_cm',v)} />
              <Number label="Peso (kg)"       value={c.peso_kg}      onChange={v => updateCollo(i,'peso_kg',v)} />
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setColli(prev => [...prev, { ...emptyCollo }])}>+ Aggiungi collo</button>
            {colli.length>1 && <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setColli(prev => prev.slice(0,-1))}>− Rimuovi ultimo</button>}
          </div>
        </div>
      </div>

      {/* Formato & Note & Data */}
      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">Ritiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Formato</label>
            <select className="w-full rounded-lg border px-3 py-2 text-sm" value={formato} onChange={e => setFormato(e.target.value as any)}>
              <option>Pacco</option>
              <option>Pallet</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Data ritiro</label>
            <input type="date" className="w-full rounded-lg border px-3 py-2 text-sm" value={dataRitiro} onChange={e => setDataRitiro(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium">Note sul ritiro</label>
            <textarea className="w-full rounded-lg border px-3 py-2 text-sm" value={noteRitiro} onChange={e => setNoteRitiro(e.target.value)} rows={3}/>
          </div>
        </div>
      </div>

      {/* Contenuto (ALTRO) */}
      {tab === 'ALTRO' && (
        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Contenuto colli</h3>
          <TextArea value={contenuto} onChange={setContenuto} placeholder="Descrivi brevemente (brochure, etichette, ecc.)" />
        </div>
      )}

      {/* Packing list (VINO) */}
      {tab === 'VINO' && (
        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Packing list (vino)</h3>
          <div className="space-y-3">
            {packing.map((p, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Text label="Descrizione" value={p.descrizione} onChange={v => setPacking(prev => prev.map((x,idx)=> idx===i?{...x, descrizione:v}:x))} className="md:col-span-2" />
                <Number label="Quantità" value={p.quantita} onChange={v => setPacking(prev => prev.map((x,idx)=> idx===i?{...x, quantita:v}:x))}/>
                <Number label="Valore unit." value={p.valore_unit} onChange={v => setPacking(prev => prev.map((x,idx)=> idx===i?{...x, valore_unit:v}:x))}/>
                <Number label="Volume (L)" value={p.volume_l || 0} onChange={v => setPacking(prev => prev.map((x,idx)=> idx===i?{...x, volume_l:v}:x))}/>
                <Number label="Gradazione (%)" value={p.gradazione || 0} onChange={v => setPacking(prev => prev.map((x,idx)=> idx===i?{...x, gradazione:v}:x))}/>
              </div>
            ))}
            <div className="flex gap-2">
              <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setPacking(prev => [...prev, { ...emptyItem }])}>+ Aggiungi riga</button>
              {packing.length>1 && <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setPacking(prev => prev.slice(0,-1))}>− Rimuovi ultima</button>}
            </div>
          </div>
        </div>
      )}

      {/* Fattura */}
      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">Dati fattura</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Incoterm</label>
            <select className="w-full rounded-lg border px-3 py-2 text-sm" value={incoterm} onChange={e => setIncoterm(e.target.value as any)}>
              <option>DAP</option><option>DDP</option><option>EXW</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Valuta</label>
            <select className="w-full rounded-lg border px-3 py-2 text-sm" value={valuta} onChange={e => setValuta(e.target.value)}>
              <option>EUR</option><option>USD</option><option>GBP</option><option>CHF</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium">Note</label>
            <textarea className="w-full rounded-lg border px-3 py-2 text-sm" value={noteFatt} onChange={e => setNoteFatt(e.target.value)} rows={3}/>
          </div>
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Text label="Link fattura (proforma/commerciale)" value={fattURL} onChange={setFattURL} placeholder="https://..." />
            <div className="flex items-center gap-2">
              <input id="delega" type="checkbox" className="h-4 w-4" checked={delegaFatt} onChange={e => setDelegaFatt(e.target.checked)} />
              <label htmlFor="delega" className="text-sm">Non ho un documento: delego creazione a SPST</label>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className={['rounded-md px-3 py-2 text-sm',
          msg.t==='ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'].join(' ')}
        >
          {msg.m}
        </div>
      )}

      <div className="flex gap-2">
        <button disabled={!canSave || saving} onClick={onSubmit}
          className={['rounded-lg px-4 py-2 text-sm font-medium border',
                      !canSave || saving ? 'opacity-60 cursor-not-allowed' : 'bg-spst-blue text-white hover:opacity-95'].join(' ')}>
          {saving ? 'Salvataggio…' : 'Crea spedizione'}
        </button>
      </div>
    </div>
  );
}

/* ---------- piccoli input helper ---------- */
function Text({ label, value, onChange, placeholder, className='' }:{label:string; value:string; onChange:(v:string)=>void; placeholder?:string; className?:string}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
             className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"/>
    </div>
  );
}
function Number({ label, value, onChange, className='' }:{label:string; value:number; onChange:(v:number)=>void; className?:string}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value || '0'))}
             className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"/>
    </div>
  );
}
function TextArea({ value, onChange, placeholder }:{value:string; onChange:(v:string)=>void; placeholder?:string}) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                   className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20" rows={3} />;
}
