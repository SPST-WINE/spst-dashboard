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

  <div className="grid gap-3 md:grid-cols-2">
    <Text label="Ragione sociale" value={ragioneSociale} onChange={setRagioneSociale} />
    <Text label="Persona di riferimento" value={referente} onChange={setReferente} />
    <Text label="Paese" value={paese} onChange={setPaese} />
    <Text label="Città" value={citta} onChange={setCitta} />
    <Text label="CAP" value={cap} onChange={setCap} />
    <Text label="Telefono" value={telefono} onChange={setTelefono} />
    <Text className="md:col-span-2" label="Indirizzo" value={indirizzo} onChange={setIndirizzo} />

    {/* P.IVA / CF a tutta riga */}
    <Text
      className="md:col-span-2"
      label="Partita IVA / Codice Fiscale"
      value={piva}
      onChange={setPiva}
    />
  </div>
</div>
  );
}
