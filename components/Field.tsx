'use client';
export function Text({ label, value, onChange, placeholder, className='' }:{
  label:string; value:string; onChange:(v:string)=>void; placeholder?:string; className?:string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
      />
    </div>
  );
}
export function NumberField({ label, value, onChange, className='' }:{
  label:string; value:number; onChange:(v:number)=>void; className?:string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="number" value={Number.isFinite(value)?value:''}
        onChange={e=>onChange(parseFloat(e.target.value || '0'))}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
      />
    </div>
  );
}
export function Area({ label, value, onChange, rows=3, className='' }:{
  label:string; value:string; onChange:(v:string)=>void; rows?:number; className?:string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        rows={rows} value={value} onChange={e=>onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
      />
    </div>
  );
}
