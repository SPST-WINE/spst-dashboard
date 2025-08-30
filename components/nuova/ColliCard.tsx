'use client';
import { NumberField } from './Field';
import { useMemo } from 'react';

export type Collo = { lunghezza_cm:number; larghezza_cm:number; altezza_cm:number; peso_kg:number };

export default function ColliCard({
  colli, setColli, formato, setFormato,
}:{
  colli: Collo[];
  setColli: (c: Collo[])=>void;
  formato: 'Pacco' | 'Pallet';
  setFormato: (f: 'Pacco'|'Pallet')=>void;
}) {
  function upd(i:number, key:keyof Collo, val:number) {
    setColli(colli.map((c,idx)=> idx===i ? { ...c, [key]: val } : c));
  }
  const totals = useMemo(()=>{
    const reale = colli.reduce((s,c)=> s + (+c.peso_kg||0), 0);
    const volum = colli.reduce((s,c)=> s + (((+c.lunghezza_cm||0) * (+c.larghezza_cm||0) * (+c.altezza_cm||0))/4000), 0);
    return { reale: +reale.toFixed(2), volumetrico: +volum.toFixed(2), tariffato: +Math.max(reale,volum).toFixed(2) };
  }, [colli]);

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-spst-orange">Colli</h3>
        <div className="flex gap-2">
          {(['Pacco','Pallet'] as const).map(f=>(
            <button key={f} type="button" onClick={()=>setFormato(f)}
              className={['rounded-lg px-3 py-1.5 text-xs', formato===f ? 'bg-spst-blue text-white' : 'border'].join(' ')}
            >{f}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {colli.map((c,i)=>(
          <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumberField label="Lunghezza (cm)" value={c.lunghezza_cm} onChange={v=>upd(i,'lunghezza_cm',v)} />
            <NumberField label="Larghezza (cm)"  value={c.larghezza_cm}  onChange={v=>upd(i,'larghezza_cm',v)} />
            <NumberField label="Altezza (cm)"    value={c.altezza_cm}    onChange={v=>upd(i,'altezza_cm',v)} />
            <NumberField label="Peso (kg)"       value={c.peso_kg}       onChange={v=>upd(i,'peso_kg',v)} />
          </div>
        ))}
        <div className="flex gap-2">
          <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={()=>setColli([...colli, {lunghezza_cm:0,larghezza_cm:0,altezza_cm:0,peso_kg:0}])}>+ Aggiungi collo</button>
          {colli.length>1 && (
            <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={()=>setColli(colli.slice(0,-1))}>− Rimuovi ultimo</button>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm">
        <div className="flex flex-wrap gap-4">
          <div><span className="text-slate-500">Peso reale:</span> <span className="font-medium">{totals.reale} kg</span></div>
          <div><span className="text-slate-500">Volumetrico:</span> <span className="font-medium">{totals.volumetrico} kg</span> <span className="text-xs text-slate-500">(L×W×H/4000)</span></div>
          <div><span className="text-slate-500">Peso tariffato:</span> <span className="font-semibold text-spst-blue">{totals.tariffato} kg</span></div>
        </div>
      </div>
    </div>
  );
}
