'use client';

import { Text } from './Field';

export type Party = {
  ragioneSociale: string;
  referente: string;
  paese: string;
  citta: string;
  cap: string;
  indirizzo: string;
  telefono: string;
  piva: string; // P.IVA / CF
};

type Props = {
  title: string;
  value: Party;
  onChange: (next: Party) => void;
};

export default function PartyCard({ title, value, onChange }: Props) {
  const set =
    <K extends keyof Party>(key: K) =>
    (val: string) =>
      onChange({ ...value, [key]: val });

  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-spst-orange">{title}</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <Text
          label="Ragione sociale"
          value={value.ragioneSociale}
          onChange={set('ragioneSociale')}
        />
        <Text
          label="Persona di riferimento"
          value={value.referente}
          onChange={set('referente')}
        />
        <Text label="Paese" value={value.paese} onChange={set('paese')} />
        <Text label="Città" value={value.citta} onChange={set('citta')} />
        <Text label="CAP" value={value.cap} onChange={set('cap')} />
        <Text label="Telefono" value={value.telefono} onChange={set('telefono')} />

        <Text
          className="md:col-span-2"
          label="Indirizzo"
          value={value.indirizzo}
          onChange={set('indirizzo')}
        />

        <Text
          className="md:col-span-2"
          label="Partita IVA / Codice Fiscale"
          value={value.piva}
          onChange={set('piva')}
        />
      </div>
    </div>
  );
}
