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
  /** File di Packing List selezionati (multi) */
  files?: File[];
  /** Setter per i file di Packing List */
  onFiles?: (files: File[]) => void;
};

const ORANGE = '#f7911e';
const inputCls =
  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1c3e5e]';

// Stesse colonne/gap per header e righe → allineamento perfetto
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

export default function PackingListVino({ value, onChange, files, onFiles }: Props) {
  const rows = value ?? [];
  const fileList = files ?? [];

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

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onFiles) return;
    const picked = Array.from(e.target.files || []);
    // unisci evitando duplicati per nome (semplice euristica)
    const next = [...fileList];
    for (const f of picked) {
      if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
    }
    onFiles(next);
    // reset input per permettere lo stesso file due volte se serve
    e.currentTarget.value = '';
  };

  const removeFile = (idx: number) => {
    if (!onFiles) return;
    const next = fileList.filter((_, i) => i !== idx);
    onFiles(next);
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

          {/* Upload PL integrato nella card */}
          {onFiles && (
            <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
              Allega packing list
              <input
                type="file"
                accept="application/pdf,image/*"
                multiple
                className="hidden"
                onChange={onPickFiles}
              />
            </label>
          )}
        </div>
      </div>

      {/* Lista file caricati (se presenti) */}
      {fileList.length > 0 && (
        <div className="mb-3 rounded-lg border bg-slate-50 p-2">
          <div className="mb-1 text-xs font-medium text-slate-600">File allegati</div>
          <ul className="text-xs">
            {fileList.map((f, i) => (
              <li key={i} className="flex items-center justify-between py-1">
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="ml-3 rounded border px-2 py-0.5 hover:bg-white"
                  title="Rimuovi"
                >
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* HEADER — usa stesse colonne e stesso gap delle righe */}
      <div className={`hidden md:grid ${COLS} ${GAP} pb-2 text-[11px] font-medium text-slate-500`}>
        <div>Etichetta</div>
        <div>Bott.</div>
        <div>Formato (L)</div>
        <div>Grad. %</div>
        <div>Prezzo</div>
        <div>Valuta</div>
        <div>Peso netto (kg)</div>
        <div>Peso lordo (kg)</div>
        <div className="select-none text-transparent">Azioni</div>
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
