'use client';
import { Text } from './Field';

export type Party = {
  ragione: string; paese: string; indirizzo: string; cap: string; citta: string; telefono: string;
  referente?: string; piva_cf?: string;
};

export default function PartyCard({
  title, value, onChange,
}:{ title: string; value: Party; onChange: (p: Party)=>void; }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-spst-orange">{title}</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Text label="Ragione sociale / Nome" value={value.ragione} onChange={v=>onChange({ ...value, ragione:v })} />
        <Text label="Paese" value={value.paese} onChange={v=>onChange({ ...value, paese:v })} placeholder="IT / FR / US…" />
        <Text label="Indirizzo" value={value.indirizzo} onChange={v=>onChange({ ...value, indirizzo:v })} className="md:col-span-2" />
        <Text label="CAP" value={value.cap} onChange={v=>onChange({ ...value, cap:v })} />
        <Text label="Città" value={value.citta} onChange={v=>onChange({ ...value, citta:v })} />
        <Text label="Telefono" value={value.telefono} onChange={v=>onChange({ ...value, telefono:v })} />
        <Text label="Referente" value={value.referente || ''} onChange={v=>onChange({ ...value, referente:v })} />
        <Text label="Partita IVA / CF" value={value.piva_cf || ''} onChange={v=>onChange({ ...value, piva_cf:v })} />
      </div>
    </div>
  );
}
