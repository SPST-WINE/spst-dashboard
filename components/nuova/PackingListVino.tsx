// components/nuova/PackingListVino.tsx
'use client';
import * as React from 'react';

export type Valuta = 'EUR' | 'USD' | 'GBP';

export type RigaPL = {
  etichetta: string;
  bottiglie: number;
  formato_litri: number;
  gradazione: number;
  prezzo: number;
  valuta: Valuta;
  peso_netto_bott: number;
  peso_lordo_bott: number;
};

type Props = {
  value: RigaPL[];
  onChange: (rows: RigaPL[]) => void;
  onPickFile?: (file?: File) => void; // opzionale: “Allega packing list”
};

const ORANGE = '#f7911e';
const inputCls =
  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1c3e5e]';

export default function PackingListVino({ value, onChange, onPickFile }: Props) {
  const rows = value ?? [];

  const toNum = (s: string) => {
    const n = parseFloat(String(s).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };

  const update = <K extends keyof RigaPL>(i: number, k: K, v: RigaPL[K]) => {
    const next = rows.slice();
    next[i] = { ...next[i], [k]: v } as RigaPL;
    onChange(next);
  };

  const addRow = () => {
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
  };

  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) =>
    onPickFile?.(e.target.files?.[0] ?? undefined);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold" style={{ color: ORANGE }}>
          Packing list (vino)
        </h3>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addRow}
            className="rounded-lg border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            + Aggiungi riga
          </button>

          <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
            Allega packing list
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={onPick}
            />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div
            key={i}
            className="grid gap-3 md:grid-cols-[minmax(160px,1fr)_90px_110px_100px_110px_110px_130px_130px_auto]"
          >
            {/* Etichetta */}
            <input
              className={inputCls}
              placeholder="Nome etichetta"
              value={r.etichetta}
              onChange={(e) => update(i, 'etichetta', e.target.value)}
            />

            {/* Bottiglie */}
            <input
              className={inputCls}
              placeholder="1"
              inputMode="numeric"
              value={r.bottiglie}
              onChange={(e) =>
                update(i, 'bottiglie', Math.max(1, Math.trunc(toNum(e.target.value))))
              }
            />

            {/* Formato (L) */}
            <input
              className={inputCls}
              placeholder="0,75"
              inputMode="decimal"
              value={r.formato_litri}
              onChange={(e) => update(i, 'formato_litri', toNum(e.target.value))}
            />

            {/* Gradazione % */}
            <input
              className={inputCls}
              placeholder="12"
              inputMode="decimal"
              value={r.gradazione}
              onChange={(e) => update(i, 'gradazione', toNum(e.target.value))}
            />

            {/* Prezzo */}
            <input
              className={inputCls}
              placeholder="0"
              inputMode="decimal"
              value={r.prezzo}
              onChange={(e) => update(i, 'prezzo', toNum(e.target.value))}
            />

            {/* Valuta */}
            <select
              className={inputCls}
              value={r.valuta}
              onChange={(e) => update(i, 'valuta', e.target.value as Valuta)}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>

            {/* Peso netto (kg) */}
            <input
              className={inputCls}
              placeholder="0,75"
              inputMode="decimal"
              value={r.peso_netto_bott}
              onChange={(e) => update(i, 'peso_netto_bott', toNum(e.target.value))}
            />

            {/* Peso lordo (kg) */}
            <input
              className={inputCls}
              placeholder="1,3"
              inputMode="decimal"
              value={r.peso_lordo_bott}
              onChange={(e) => update(i, 'peso_lordo_bott', toNum(e.target.value))}
            />

            {/* Azioni */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Rimuovi
              </button>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="text-sm text-slate-500">
            Nessuna riga. Aggiungi una riga per iniziare.
          </div>
        )}
      </div>
    </div>
  );
}
