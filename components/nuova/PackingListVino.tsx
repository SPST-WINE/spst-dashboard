'use client';
import { NumberField, Text } from './Field';

export type PLItem = {
  etichetta: string;
  bottiglie: number;
  formato: string; // 0.375L, 0.75L, 1.5L...
  gradazione: number;
  costo_unit: number;
  peso_netto_unit: number;
  peso_lordo_unit: number;
};

export default function PackingListVino({
  items, setItems,
}:{ items: PLItem[]; setItems: (x:PLItem[])=>void; }) {
  function upd(i:number, patch:Partial<PLItem>) { setItems(items.map((r,idx)=> idx===i ? { ...r, ...patch } : r)); }

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <h3 className="text-sm font-semibold text-spst-orange">Packing list (vino)</h3>

      {items.map((r,i)=>(
        <div key={i} className="grid gap-3 md:grid-cols-7">
          <Text label="Etichetta" value={r.etichetta} onChange={v=>upd(i,{etichetta:v})} className="md:col-span-2" />
          <NumberField label="Bott." value={r.bottiglie} onChange={v=>upd(i,{bottiglie:v})} />
          <Text label="Formato" value={r.formato} onChange={v=>upd(i,{formato:v})} placeholder="0.75 L" />
          <NumberField label="Grad. %" value={r.gradazione} onChange={v=>upd(i,{gradazione:v})} />
          <NumberField label="Costo €" value={r.costo_unit} onChange={v=>upd(i,{costo_unit:v})} />
          <div className="grid grid-cols-2 gap-3 md:col-span-2">
            <NumberField label="Peso netto (kg)" value={r.peso_netto_unit} onChange={v=>upd(i,{peso_netto_unit:v})} />
            <NumberField label="Peso lordo (kg)" value={r.peso_lordo_unit} onChange={v=>upd(i,{peso_lordo_unit:v})} />
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={()=>setItems([...items,
          { etichetta:'', bottiglie:1, formato:'0.75 L', gradazione:12, costo_unit:0, peso_netto_unit:0.75, peso_lordo_unit:1.3 }
        ])}>+ Aggiungi riga</button>
        {items.length>1 && <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={()=>setItems(items.slice(0,-1))}>− Rimuovi ultima</button>}
      </div>
    </div>
  );
}
