'use client';

import * as React from 'react';

export type Valuta = 'EUR' | 'USD' | 'GBP';

export type RigaPL = {
  etichetta: string;
  bottiglie: number;
  formato_litri: number;   // es. 0.75
  gradazione: number;      // %
  prezzo: number;          // per bottiglia
  valuta: Valuta;
  peso_netto_bott: number; // kg
  peso_lordo_bott: number; // kg
};

type Props = {
  righe: RigaPL[];
  onChange: (rows: RigaPL[]) => void;
  setAllegato?: (file?: File) => void;
  allegato?: File;
};

const ORANGE = '#f7911e';

export default function PackingListVino({
  righe,
  onChange,
  setAllegato,
  allegato,
}: Props) {
  const changeRow = <K extends keyof RigaPL>(i: number, key: K, val: RigaPL[K]) => {
    const next = [...righe];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  };

  const addRow = () => {
    onChange([
      ...righe,
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

  const removeRow = (i: number) => onChange(righe.filter((_, idx) => idx !== i));

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (setAllegato) setAllegato(f);
  };

  const inputCls =
    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1c3e5e]';

  return (
    <div className="rounded-2xl border bg-white p-4">
      {/* header */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold" style={{ color: ORANGE }}>
          Packing list (vino)
        </h3>

        <div className="flex items-center gap-3">
          {allegato && (
            <span className="max-w-[220px] truncate text-xs text-slate-500">
              {allegato.name}
            </span>
          )}
          <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
            Allega packing list
            <input
              type="file"
              className="hidden"
              accept=".pdf,.csv,.xlsx,.xls"
              onChange={onPickFile}
            />
          </label>
        </div>
      </div>

      {/* intestazioni allineate alla griglia a 12 colonne */}
      <div className="mb-2 grid grid-cols-12 items-center gap-3 text-xs font-medium text-slate-600">
        <div className="col-span-12 md:col-span-3">Etichetta</div>
        <div className="col-span-6 md:col-span-1">Bott.</div>
        <div className="col-span-6 md:col-span-2">Formato (L)</div>
        <div className="col-span-6 md:col-span-1">Grad. %</div>
        <div className="col-span-6 md:col-span-1">Prezzo</div>
        <div className="col-span-6 md:col-span-1">Valuta</div>
        <div className="col-span-6 md:col-span-1">Peso netto (kg)</div>
        <div className="col-span-6 md:col-span-1">Peso lordo (kg)</div>
        <div className="col-span-12 md:col-span-1 text-right pr-1"> </div>
      </div>

      {/* righe */}
      <div className="space-y-3">
        {righe.map((r, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-3">
            <input
              className={`${inputCls} col-span-12 md:col-span-3`}
              placeholder="Nome etichetta"
              value={r.etichetta}
              onChange={(e) => changeRow(i, 'etichetta', e.target.value)}
            />

            <input
              type="number"
              min={0}
              className={`${inputCls} col-span-6 md:col-span-1`}
              value={r.bottiglie}
              onChange={(e) => changeRow(i, 'bottiglie', Number(e.target.value))}
            />

            <input
              type="number"
              step="0.01"
              min={0}
              className={`${inputCls} col-span-6 md:col-span-2`}
              value={r.formato_litri}
              onChange={(e) => changeRow(i, 'formato_litri', Number(e.target.value))}
            />

            <input
              type="number"
              step="0.1"
              min={0}
              className={`${inputCls} col-span-6 md:col-span-1`}
              value={r.gradazione}
              onChange={(e) => changeRow(i, 'gradazione', Number(e.target.value))}
            />

            <input
              type="number"
              step="0.01"
              min={0}
              className={`${inputCls} col-span-6 md:col-span-1`}
              value={r.prezzo}
              onChange={(e) => changeRow(i, 'prezzo', Number(e.target.value))}
            />

            <select
              className={`${inputCls} col-span-6 md:col-span-1`}
              value={r.valuta}
              onChange={(e) => changeRow(i, 'valuta', e.target.value as Valuta)}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>

            <input
              type="number"
              step="0.01"
              min={0}
              className={`${inputCls} col-span-6 md:col-span-1`}
              value={r.peso_netto_bott}
              onChange={(e) => changeRow(i, 'peso_netto_bott', Number(e.target.value))}
            />

            <input
              type="number"
              step="0.01"
              min={0}
              className={`${inputCls} col-span-6 md:col-span-1`}
              value={r.peso_lordo_bott}
              onChange={(e) => changeRow(i, 'peso_lordo_bott', Number(e.target.value))}
            />

            <div className="col-span-12 flex justify-end md:col-span-1">
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
              >
                Rimuovi
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={addRow}
          className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          + Aggiungi riga
        </button>
      </div>
    </div>
  );
}
