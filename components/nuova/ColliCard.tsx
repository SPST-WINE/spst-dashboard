'use client';

import { NumberField, Select, Text } from './Field';
import { useMemo } from 'react';

export type Collo = {
  lunghezza_cm: number;
  larghezza_cm: number;
  altezza_cm: number;
  peso_kg: number;
};

type Props = {
  colli: Collo[];
  onChange: (next: Collo[]) => void;
  formato: 'Pacco' | 'Pallet';
  setFormato: (v: 'Pacco' | 'Pallet') => void;
  contenuto: string;
  setContenuto: (v: string) => void;
};

export default function ColliCard({
  colli, onChange, formato, setFormato, contenuto, setContenuto,
}: Props) {
  const setCollo =
    (i: number, key: keyof Collo) =>
    (v: number) => {
      const next = [...colli];
      next[i] = { ...next[i], [key]: v };
      onChange(next);
    };

  const addCollo = () =>
    onChange([...colli, { lunghezza_cm: 0, larghezza_cm: 0, altezza_cm: 0, peso_kg: 0 }]);

  const removeCollo = (i: number) => onChange(colli.filter((_, idx) => idx !== i));

  const totals = useMemo(() => {
    const pesoReale = colli.reduce((s, c) => s + (c.peso_kg || 0), 0);
    const volKg = colli.reduce((s, c) => {
      const vol = ((c.lunghezza_cm || 0) * (c.larghezza_cm || 0) * (c.altezza_cm || 0)) / 4000;
      return s + vol;
    }, 0);
    const tariffato = Math.max(pesoReale, volKg);
    return { pesoReale, volKg, tariffato };
  }, [colli]);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-spst-orange">Colli</h3>

      <div className="mb-3 grid gap-3 md:grid-cols-3">
        <Select
          label="Formato"
          value={formato}
          onChange={(v) => setFormato(v as 'Pacco' | 'Pallet')}
          options={[
            { label: 'Pacco', value: 'Pacco' },
            { label: 'Pallet', value: 'Pallet' },
          ]}
        />
        <Text
          label="Contenuto colli"
          value={contenuto}
          onChange={setContenuto}
          className="md:col-span-2"
        />
      </div>

      <div className="space-y-3">
        {colli.map((c, i) => (
          <div key={i} className="rounded-xl border p-3">
            <div className="mb-2 text-xs font-medium text-slate-500">Collo #{i + 1}</div>
            <div className="grid gap-3 md:grid-cols-5">
              <NumberField label="L (cm)" value={c.lunghezza_cm} onChange={setCollo(i, 'lunghezza_cm')} />
              <NumberField label="W (cm)" value={c.larghezza_cm} onChange={setCollo(i, 'larghezza_cm')} />
              <NumberField label="H (cm)" value={c.altezza_cm} onChange={setCollo(i, 'altezza_cm')} />
              <NumberField label="Peso (kg)" step={0.1} value={c.peso_kg} onChange={setCollo(i, 'peso_kg')} />
              <button
                type="button"
                onClick={() => removeCollo(i)}
                className="mt-6 h-10 rounded-lg border px-3 text-sm hover:bg-slate-50"
              >
                Rimuovi
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={addCollo} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">
          + Aggiungi collo
        </button>

        <span className="ml-auto rounded-md border bg-white px-2 py-1 text-xs">
          Peso reale: <b>{totals.pesoReale.toFixed(2)} kg</b>
        </span>
        <span className="rounded-md border bg-white px-2 py-1 text-xs">
          Volumetrico: <b>{totals.volKg.toFixed(2)} kg</b> (L×W×H/4000)
        </span>
        <span className="rounded-md border bg-white px-2 py-1 text-xs">
          Peso tariffato: <b>{totals.tariffato.toFixed(2)} kg</b>
        </span>
      </div>
    </div>
  );
}
