// components/nuova/PackingListVino.tsx
'use client';
import * as React from 'react';

export type Valuta = 'EUR' | 'USD' | 'GBP';

export type RigaPL = {
  etichetta: string;
  bottiglie: number | null;
  formato_litri: number | null;
  gradazione: number | null;
  prezzo: number | null;
  valuta: Valuta;
  peso_netto_bott: number | null;
  peso_lordo_bott: number | null;
};

type Props = {
  value: RigaPL[];
  onChange: (rows: RigaPL[]) => void;
  /** ✅ nuovo: multi-file */
  onFiles?: (files: File[]) => void;
  /** 🔁 compatibilità: singolo file (usa il primo dei files) */
  onPickFile?: (file?: File) => void;
};

const ORANGE = '#f7911e';
const inputCls =
  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1c3e5e]';

// stesse colonne/gap per header e righe → allineamento perfetto
const COLS =
  'md:grid-cols-[minmax(180px,1fr)_96px_110px_100px_110px_110px_130px_130px_90px]';
const GAP = 'gap-3';

const emptyRow: RigaPL = {
  etichetta: '',
  bottiglie: null,
  formato_litri: null,
  gradazione: null,
  prezzo: null,
  valuta: 'EUR',
  peso_netto_bott: null,
  peso_lordo_bott: null,
};

export default function PackingListVino({ value, onChange, onFiles, onPickFile }: Props) {
  const rows = value ?? [];

  const toNumOrNull = (s: string): number | null => {
    const t = s.trim();
    if (!t) return null;
    const n = parseFloat(t.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };

  const update = <K extends keyof RigaPL>(i: number, k: K, v: RigaPL[K]) => {
    const next = rows.slice();
    next[i] = { ...next[i], [k]: v } as RigaPL;
    onChange(next);
  };

  const addRow = () => onChange([...rows, { ...emptyRow }]);
  const remove = (i: number) => onChange(rows.filter((_, j) => j !== i));

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      onFiles?.(files);
      // retrocompatibilità: se qualcuno passa ancora onPickFile, prendi il primo
      if (onPickFile) onPickFile(files[0]);
    } else {
      onPickFile?.(undefined);
    }
    // reset per poter riselezionare gli stessi file in seguito
    e.currentTarget.value = '';
  };

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

          {/* 👇 identico look, ma ora multi-file */}
          <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
            Allega packing list
            <input
              type="file"
              accept="application/pdf,image/*"
              multiple
              className="hidden"
              onChange={onPick}
            />
          </label>
        </div>
      </div>

      {/* HEADER */}
      <div
        className={`hidden md:grid ${COLS} ${GAP} pb-2 text-[11px] font-medium text-slate-500`}
      >
        <div>Etichetta</div>
        <div>Bott.</div>
        <div>Formato (L)</div>
        <div>Grad. %</div>
        <div>Prezzo</div>
        <div>Valuta</div>
        <div>Peso netto (kg)</div>
        <div>Peso lordo (kg)</div>
        <div className="text-transparent select-none">Azioni</div>
      </div>

      {/* RIGHE */}
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className={`grid ${COLS} ${GAP} items-center`}>
            <input
              className={inputCls}
              placeholder="Nome etichetta"
              aria-label="Etichetta"
              value={r.etichetta}
              onChange={(e) => update(i, 'etichetta', e.target.value)}
            />
            <input
              className={inputCls}
              placeholder="1"
              aria-label="Bottiglie"
              inputMode="numeric"
              value={r.bottiglie ?? ''}
              onChange={(e) => update(i, 'bottiglie', toNumOrNull(e.target.value))}
            />
            <input
              className={inputCls}
              placeholder="0,75"
              aria-label="Formato in litri"
              inputMode="decimal"
              value={r.formato_litri ?? ''}
              onChange={(e) => update(i, 'formato_litri', toNumOrNull(e.target.value))}
            />
            <input
              className={inputCls}
              placeholder="12"
              aria-label="Gradazione percentuale"
              inputMode="decimal"
              value={r.gradazione ?? ''}
              onChange={(e) => update(i, 'gradazione', toNumOrNull(e.target.value))}
            />
            <input
              className={inputCls}
              placeholder="0"
              aria-label="Prezzo unitario"
              inputMode="decimal"
              value={r.prezzo ?? ''}
              onChange={(e) => update(i, 'prezzo', toNumOrNull(e.target.value))}
            />
            <select
              className={inputCls}
              aria-label="Valuta"
              value={r.valuta}
              onChange={(e) => update(i, 'valuta', e.target.value as Valuta)}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
            <input
              className={inputCls}
              placeholder="0,75"
              aria-label="Peso netto per bottiglia (kg)"
              inputMode="decimal"
              value={r.peso_netto_bott ?? ''}
              onChange={(e) => update(i, 'peso_netto_bott', toNumOrNull(e.target.value))}
            />
            <input
              className={inputCls}
              placeholder="1,3"
              aria-label="Peso lordo per bottiglia (kg)"
              inputMode="decimal"
              value={r.peso_lordo_bott ?? ''}
              onChange={(e) => update(i, 'peso_lordo_bott', toNumOrNull(e.target.value))}
            />

            <div className="flex items-center justify-end">
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
