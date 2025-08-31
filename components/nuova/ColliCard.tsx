'use client';

import React from 'react';

export type Collo = {
  lunghezza_cm: number | null;
  larghezza_cm: number | null;
  altezza_cm: number | null;
  peso_kg: number | null;
};

type Props = {
  colli: Collo[];
  onChange: (c: Collo[]) => void;

  formato: 'Pacco' | 'Pallet';
  setFormato: (f: 'Pacco' | 'Pallet') => void;

  contenuto: string;
  setContenuto: (v: string) => void;
};

const toNum = (v: number | null) => (typeof v === 'number' && !isNaN(v) ? v : 0);
const strVal = (v: number | null) => (v === null || isNaN(v as number) ? '' : String(v));

export default function ColliCard({
  colli,
  onChange,
  formato,
  setFormato,
  contenuto,
  setContenuto,
}: Props) {
  const setField = (
    index: number,
    key: keyof Collo,
    raw: string
  ) => {
    const next = [...colli];
    const cleaned = raw.replace(',', '.'); // accetta virgola
    next[index] = {
      ...next[index],
      [key]: cleaned === '' ? null : Number(cleaned),
    };
    onChange(next);
  };

  const addCollo = () =>
    onChange([
      ...colli,
      { lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null },
    ]);

  const removeCollo = (i: number) => {
    const next = colli.filter((_, idx) => idx !== i);
    onChange(next.length ? next : [{ lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null }]);
  };

  const totalePesoReale = colli.reduce((s, c) => s + toNum(c.peso_kg), 0);
  const totaleVolumetrico = colli.reduce(
    (s, c) =>
      s + (toNum(c.lunghezza_cm) * toNum(c.larghezza_cm) * toNum(c.altezza_cm)) / 4000,
    0
  );
  const pesoTariffato = Math.max(totalePesoReale, totaleVolumetrico);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-spst-orange">Colli</h3>

      {/* Formato + Contenuto colli */}
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-600">Formato</label>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            value={formato}
            onChange={(e) => setFormato(e.target.value as 'Pacco' | 'Pallet')}
          >
            <option value="Pacco">Pacco</option>
            <option value="Pallet">Pallet</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-600">Contenuto colli</label>
          <input
            type="text"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Es. bottiglie vino, brochure, etichette…"
            value={contenuto}
            onChange={(e) => setContenuto(e.target.value)}
          />
        </div>
      </div>

      {/* Lista colli */}
      <div className="mt-4 space-y-3">
        {colli.map((c, i) => (
          <div key={i} className="rounded-xl border p-3">
            <div className="mb-2 text-xs font-medium text-slate-500">
              Collo #{i + 1}
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <NumberInput
                label="L (cm)"
                value={strVal(c.lunghezza_cm)}
                onChange={(v) => setField(i, 'lunghezza_cm', v)}
              />
              <NumberInput
                label="W (cm)"
                value={strVal(c.larghezza_cm)}
                onChange={(v) => setField(i, 'larghezza_cm', v)}
              />
              <NumberInput
                label="H (cm)"
                value={strVal(c.altezza_cm)}
                onChange={(v) => setField(i, 'altezza_cm', v)}
              />
              <NumberInput
                label="Peso (kg)"
                value={strVal(c.peso_kg)}
                onChange={(v) => setField(i, 'peso_kg', v)}
              />
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => removeCollo(i)}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Rimuovi
              </button>
            </div>
          </div>
        ))}

        <div>
          <button
            type="button"
            onClick={addCollo}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            + Aggiungi collo
          </button>
        </div>
      </div>

      {/* Totali */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <Badge> Peso reale: {totalePesoReale.toFixed(2)} kg </Badge>
        <Badge>
          Volumetrico: {totaleVolumetrico.toFixed(2)} kg (L×W×H/4000)
        </Badge>
        <Badge> Peso tariffato: {pesoTariffato.toFixed(2)} kg </Badge>
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-600">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.,]?[0-9]*"
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border bg-slate-50 px-2 py-1">{children}</span>
  );
}
