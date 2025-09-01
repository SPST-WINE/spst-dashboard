// components/nuova/PackingListVino.tsx
'use client';

import * as React from 'react';

export type RigaPL = {
  etichetta: string;
  bottiglie: number;
  formato_litri: number;   // 0.75, 1.5, ecc.
  gradazione: number;      // %
  prezzo: number;          // prezzo per bottiglia
  valuta: 'EUR' | 'USD' | 'GBP';
  peso_netto_bott: number; // kg per bottiglia
  peso_lordo_bott: number; // kg per bottiglia
};

type Props = {
  value: RigaPL[];
  onChange: (rows: RigaPL[]) => void;
};

const ORANGE = '#f7911e';
const inputCls =
  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1c3e5e]';

export default function PackingListVino({ value, onChange }: Props) {
  const rows = value;

  const set =
    (i: number) =>
    <K extends keyof RigaPL>(k: K, v: RigaPL[K]) => {
      const next = [...rows];
      next[i] = { ...next[i], [k]: v };
      onChange(next);
    };

  const addRow = () =>
    onChange([
      ...rows,
      {
        etichetta: '',
        bottiglie: 1,
        formato_litri: 0.75,
        gradazione: 12,
        prezzo: 0,
        valuta: 'EUR',
        peso_netto_bott: 0.75,
        peso_lordo_bott: 1.3,
      },
    ]);

  const removeRow = (i: number) => {
    const next = rows.slice();
    next.splice(i, 1);
    onChange(next.length ? next : [
      {
        etichetta: '',
        bottiglie: 1,
        formato_litri: 0.75,
        gradazione: 12,
        prezzo: 0,
        valuta: 'EUR',
        peso_netto_bott: 0.75,
        peso_lordo_bott: 1.3,
      },
    ]);
  };

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: ORANGE }}>
          Packing list (vino)
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addRow}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            + Aggiungi riga
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div
            key={i}
            className="grid gap-3 md:grid-cols-[2fr_100px_120px_100px_120px_110px_120px_120px] items-start"
          >
            <input
              className={inputCls}
              placeholder="Nome Etichetta"
              value={r.etichetta}
              onChange={(e) => set(i)('etichetta', e.target.value)}
            />

            <input
              className={inputCls}
              placeholder="Qt."
              type="number"
              min={0}
              value={r.bottiglie}
              onChange={(e) => set(i)('bottiglie', Number(e.target.value))}
            />

            <input
              className={inputCls}
              placeholder="Formato (L)"
              type="number"
              step="0.01"
              min={0}
              value={r.formato_litri}
              onChange={(e) => set(i)('formato_litri', Number(e.target.value))}
            />

            <input
              className={inputCls}
              placeholder="Grad. %"
              type="number"
              step="0.1"
              min={0}
              value={r.gradazione}
              onChange={(e) => set(i)('gradazione', Number(e.target.value))}
            />

            <input
              className={inputCls}
              placeholder="Prezzo"
              type="number"
              step="0.01"
              min={0}
              value={r.prezzo}
              onChange={(e) => set(i)('prezzo', Number(e.target.value))}
            />

            <select
              className={inputCls}
              value={r.valuta}
              onChange={(e) =>
                set(i)('valuta', e.target.value as RigaPL['valuta'])
              }
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>

            <input
              className={inputCls}
              placeholder="Peso netto (kg)"
              type="number"
              step="0.01"
              min={0}
              value={r.peso_netto_bott}
              onChange={(e) => set(i)('peso_netto_bott', Number(e.target.value))}
            />

            <div className="flex items-center gap-2">
              <input
                className={inputCls + ' flex-1'}
                placeholder="Peso lordo (kg)"
                type="number"
                step="0.01"
                min={0}
                value={r.peso_lordo_bott}
                onChange={(e) =>
                  set(i)('peso_lordo_bott', Number(e.target.value))
                }
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Rimuovi
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
