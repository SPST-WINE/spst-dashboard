'use client';
import { useMemo, useState } from 'react';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import PackingListVino, { PLItem } from '@/components/nuova/PackingListVino';
import FatturaCard from '@/components/nuova/FatturaCard';

export default function NuovaVino() {
  const email = typeof window !== 'undefined' ? (localStorage.getItem('userEmail') || '') : '';

  const [tipoSped, setTipoSped] = useState<'B2B'|'B2C'|'Campionatura'>('B2B');
  const [mittente, setMittente] = useState<Party>({ ragione:'', paese:'', indirizzo:'', cap:'', citta:'', telefono:'', referente:'', piva_cf:'' });
  const [destinatario, setDestinatario] = useState<Party>({ ragione:'', paese:'', indirizzo:'', cap:'', citta:'', telefono:'', referente:'', piva_cf:'' });

  const [colli, setColli] = useState<Collo[]>([{ lunghezza_cm:0, larghezza_cm:0, altezza_cm:0, peso_kg:0 }]);
  const [formato, setFormato] = useState<'Pacco'|'Pallet'>('Pacco');

  const [date, setDate] = useState<Date|undefined>();
  const [noteRitiro, setNoteRitiro] = useState('');

  const [items, setItems] = useState<PLItem[]>([
    { etichetta:'', bottiglie:1, formato:'0.75 L', gradazione:12, costo_unit:0, peso_netto_unit:0.75, peso_lordo_unit:1.3 }
  ]);

  const [incoterm, setIncoterm] = useState<'DAP'|'DDP'|'EXW'>('DAP');
  const [valuta, setValuta] = useState('EUR');
  const [noteFatt, setNoteFatt] = useState('');
  const [fattURL, setFattURL] = useState('');
  const [delegaFatt, setDelegaFatt] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{t:'ok'|'err'; m:string}|null>(null);

  const canSave = useMemo(()=>{
    const okParty = (p:Party)=> !!(p.ragione && p.paese && p.indirizzo && p.cap && p.citta && p.telefono);
    return okParty(mittente) && okParty(destinatario) && colli.length>0;
  }, [mittente,destinatario,colli]);

  async function onSubmit() {
    if (!email) { setMsg({t:'err', m:'Email non presente (MVP). Inseriscila nelle Impostazioni.'}); return; }
    try {
      setSaving(true); setMsg(null);
      const payload = {
        email,
        tipo_generale: 'VINO' as const,
        tipo_spedizione: tipoSped,
        mittente, destinatario,
        colli, formato,
        note_ritiro: noteRitiro,
        data_ritiro: date ? date.toISOString().slice(0,10) : '',
        fattura: { incoterm, valuta, note: noteFatt, url: fattURL, delega_creazione: delegaFatt },
        packingList: items.map(i=>({
          descrizione: i.etichetta,
          quantita: i.bottiglie,
          valore_unit: i.costo_unit,
          volume_l: parseFloat((parseFloat(i.formato)||0).toString()),
          gradazione: i.gradazione,
        })),
      };
      const res = await fetch('/api/spedizioni', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      setMsg({ t:'ok', m:'Spedizione vino creata. La troverai in “Le mie spedizioni”.' });
    } catch {
      setMsg({ t:'err', m:'Errore durante il salvataggio.' });
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      {/* switch tipo spedizione */}
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-spst-orange">Tipo di spedizione</h3>
        <div className="flex flex-wrap gap-2">
          {(['B2B','B2C','Campionatura'] as const).map(t=>(
            <button key={t} onClick={()=>setTipoSped(t)} className={['rounded-lg px-3 py-1.5 text-sm', tipoSped===t?'bg-spst-blue text-white':'border'].join(' ')}>{t}</button>
          ))}
        </div>
      </div>

      {/* Mittente + Destinatario su unica riga */}
      <div className="grid gap-4 md:grid-cols-2">
        <PartyCard title="Mittente" value={mittente} onChange={setMittente} />
        <PartyCard title="Destinatario" value={destinatario} onChange={setDestinatario} />
      </div>

      <ColliCard colli={colli} setColli={setColli} formato={formato} setFormato={setFormato} />

      <RitiroCard date={date} setDate={setDate} note={noteRitiro} setNote={setNoteRitiro} />

      <PackingListVino items={items} setItems={setItems} />

      <FatturaCard
        incoterm={incoterm} setIncoterm={setIncoterm}
        valuta={valuta} setValuta={setValuta}
        note={noteFatt} setNote={setNoteFatt}
        url={fattURL} setUrl={setFattURL}
        delega={delegaFatt} setDelega={setDelegaFatt}
      />

      {msg && (
        <div className={['rounded-md px-3 py-2 text-sm',
          msg.t==='ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'].join(' ')}>
          {msg.m}
        </div>
      )}

      <button disabled={!canSave || saving}
        onClick={onSubmit}
        className={['rounded-lg px-4 py-2 text-sm font-medium',
        !canSave || saving ? 'opacity-60 cursor-not-allowed border' : 'bg-spst-blue text-white'].join(' ')}
      >
        {saving ? 'Salvataggio…' : 'Crea spedizione vino'}
      </button>
    </div>
  );
}
