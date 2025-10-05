// components/nuova/PartyCard.tsx
'use client';

import * as React from 'react';
import Switch from '@/components/nuova/Switch';

export type Party = {
  ragioneSociale: string;
  referente: string;
  paese: string;
  citta: string;
  cap: string;
  indirizzo: string;
  telefono: string;
  piva: string;
};

type Props = {
  title: string;
  value: Party;
  onChange: (p: Party) => void;

  /** Opzionale: toggle mostrato nell’header della card (es. "Destinatario abilitato all’import") */
  extraSwitch?: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  };

  /** 🔹 Usato per collegare Google Maps Autocomplete ("mittente" o "destinatario") */
  gmapsTag?: 'mittente' | 'destinatario';
};

const ORANGE = '#f7911e';
const inputCls =
  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1c3e5e]';

export default function PartyCard({ title, value, onChange, extraSwitch, gmapsTag }: Props) {
  const set = <K extends keyof Party,>(k: K, v: Party[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold" style={{ color: ORANGE }}>
          {title}
        </h3>

        {extraSwitch && (
          <Switch
            checked={extraSwitch.checked}
            onChange={extraSwitch.onChange}
            label={extraSwitch.label}
          />
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          className={inputCls}
          placeholder="Ragione sociale"
          value={value.ragioneSociale}
          onChange={(e) => set('ragioneSociale', e.target.value)}
        />
        <input
          className={inputCls}
          placeholder="Persona di riferimento"
          value={value.referente}
          onChange={(e) => set('referente', e.target.value)}
        />
        <input
          className={inputCls}
          placeholder="Paese"
          value={value.paese}
          onChange={(e) => set('paese', e.target.value)}
        />
        <input
          className={inputCls}
          placeholder="Città"
          value={value.citta}
          onChange={(e) => set('citta', e.target.value)}
        />
        <input
          className={inputCls}
          placeholder="CAP"
          value={value.cap}
          onChange={(e) => set('cap', e.target.value)}
        />
        <input
          className={inputCls}
          placeholder="Telefono"
          value={value.telefono}
          onChange={(e) => set('telefono', e.target.value)}
        />

        {/* 🔹 Indirizzo con supporto a Google Maps */}
        <input
          className={'md:col-span-2 ' + inputCls}
          placeholder="Indirizzo"
          value={value.indirizzo}
          onChange={(e) => set('indirizzo', e.target.value)}
          // 👇 Attributi per l'autocomplete
          data-gmaps={gmapsTag ? `indirizzo-${gmapsTag}` : undefined}
          id={gmapsTag ? `input-indirizzo-${gmapsTag}` : undefined}
          autoComplete="street-address"
        />

        <input
          className={'md:col-span-2 ' + inputCls}
          placeholder="Partita IVA / Codice Fiscale"
          value={value.piva}
          onChange={(e) => set('piva', e.target.value)}
        />
      </div>
    </div>
  );
}
