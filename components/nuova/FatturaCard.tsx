'use client';
import { Area, Text } from './Field';

export default function FatturaCard({
  incoterm, setIncoterm, valuta, setValuta, note, setNote, url, setUrl, delega, setDelega,
}:{
  incoterm: 'DAP'|'DDP'|'EXW'; setIncoterm:(v:any)=>void;
  valuta: string; setValuta:(v:string)=>void;
  note: string; setNote:(v:string)=>void;
  url: string; setUrl:(v:string)=>void;
  delega: boolean; setDelega:(v:boolean)=>void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <h3 className="text-sm font-semibold text-spst-orange">Dati fattura</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Incoterm</label>
          <select className="w-full rounded-lg border px-3 py-2 text-sm" value={incoterm} onChange={e=>setIncoterm(e.target.value as any)}>
            <option>DAP</option><option>DDP</option><option>EXW</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Valuta</label>
          <select className="w-full rounded-lg border px-3 py-2 text-sm" value={valuta} onChange={e=>setValuta(e.target.value)}>
            <option>EUR</option><option>USD</option><option>GBP</option><option>CHF</option>
          </select>
        </div>
      </div>

      <Area label="Note" value={note} onChange={setNote} />

      <div className="grid gap-3 md:grid-cols-2">
        <Text label="Link fattura (proforma/commerciale)" value={url} onChange={setUrl} placeholder="https://…" />
        <div className="flex items-center gap-2">
          <input id="delega" type="checkbox" className="h-4 w-4" checked={delega} onChange={e=>setDelega(e.target.checked)} />
          <label htmlFor="delega" className="text-sm">
            Non hai una fattura? <span className="font-medium">Creiamo noi il documento</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="rounded-lg border px-3 py-1.5 text-sm cursor-pointer">
          Allega file
          <input type="file" className="hidden" />
        </label>
        <span className="text-xs text-slate-500">Oppure incolla un link nel campo sopra</span>
      </div>
    </div>
  );
}
