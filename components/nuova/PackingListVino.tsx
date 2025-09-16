// components/nuova/PackingListVino.tsx
'use client';
import * as React from 'react';

export type Valuta = 'EUR' | 'USD' | 'GBP';
export type TipologiaPL = 'vino fermo' | 'vino spumante' | 'brochure/depliant';

export type RigaPL = {
  etichetta: string;
  bottiglie: number | null;
  formato_litri: number | null;
  gradazione: number | null;
  prezzo: number | null;
  valuta: Valuta;
  peso_netto_bott: number | null;
  peso_lordo_bott: number | null;
  tipologia: TipologiaPL;
};

type Props = {
  value: RigaPL[];
  onChange: (rows: RigaPL[]) => void;
  files?: File[];
  onFiles?: (files: File[]) => void;
};

const ORANGE = '#f7911e';
const inputCls =
  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1c3e5e]';

// Layout: Etichetta | Tipologia | Bott. | Formato(L) | Grad% | Prezzo | Valuta | Peso netto | Peso lordo | Azioni
const COLS =
  'md:grid-cols-[minmax(160px,1fr)_150px_96px_110px_100px_110px_110px_130px_130px_90px]';
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
  tipologia: 'vino fermo',
};

// Campi numerici gestiti in bozza stringa
type NumKey =
  | 'bottiglie'
  | 'formato_litri'
  | 'gradazione'
  | 'prezzo'
  | 'peso_netto_bott'
  | 'peso_lordo_bott';

const NUM_KEYS: NumKey[] = [
  'bottiglie',
  'formato_litri',
  'gradazione',
  'prezzo',
  'peso_netto_bott',
  'peso_lordo_bott',
];

export default function PackingListVino({ value, onChange, files, onFiles }: Props) {
  const rows = value ?? [];
  const fileList = files ?? [];

  // Stato locale "bozza" per i campi numerici, così si può digitare 0, 0,7, ecc.
  const [draft, setDraft] = React.useState<Array<Partial<Record<NumKey, string>>>>([]);

  // inizializza/sincronizza la bozza quando cambia il numero di righe
  React.useEffect(() => {
    setDraft(prev => {
      const next = rows.map((r, i) => {
        const old = prev[i] || {};
        const initFromRow = (k: NumKey) =>
          old[k] ??
          (r[k] != null
            ? String(r[k] as number).replace('.', ',')
            : '');
        return {
          bottiglie: initFromRow('bottiglie'),
          formato_litri: initFromRow('formato_litri'),
          gradazione: initFromRow('gradazione'),
          prezzo: initFromRow('prezzo'),
          peso_netto_bott: initFromRow('peso_netto_bott'),
          peso_lordo_bott: initFromRow('peso_lordo_bott'),
        };
      });
      return next;
    });
  }, [rows.length]); // mantieni l’editing corrente se la lunghezza non cambia

  const toNumber = (s: string): number | null => {
    if (!s || !s.trim()) return null;
    const n = parseFloat(s.replace(/\s+/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };

  const toInt = (s: string): number | null => {
    if (!s || !s.trim()) return null;
    const n = Math.floor(Number(s.replace(/\s+/g, '').replace(',', '.')));
    return Number.isFinite(n) ? n : null;
  };

  const commitNumber = (rowIdx: number, key: NumKey) => {
    const raw = draft[rowIdx]?.[key] ?? '';
    const n = key === 'bottiglie' ? toInt(raw) : toNumber(raw);
    const next = rows.slice();
    (next[rowIdx] as any)[key] = n;
    onChange(next);
  };

  const setDraftVal = (rowIdx: number, key: NumKey, val: string) => {
    setDraft(prev => {
      const next = prev.slice();
      next[rowIdx] = { ...(next[rowIdx] || {}), [key]: val };
      return next;
    });
  };

  const update = <K extends keyof RigaPL>(i: number, k: K, v: RigaPL[K]) => {
    const next = rows.slice();
    next[i] = { ...next[i], [k]: v } as RigaPL;
    onChange(next);
  };

  const addRow = () => onChange([...rows, { ...emptyRow }]);
  const remove = (i: number) => {
    onChange(rows.filter((_, j) => j !== i));
    setDraft(d => d.filter((_, j) => j !== i));
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onFiles) return;
    const picked = Array.from(e.target.files || []);
    const next = [...fileList];
    for (const f of picked) {
      if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
    }
    onFiles(next);
    e.currentTarget.value = '';
  };

  const removeFile = (idx: number) => {
    if (!onFiles) return;
    const next = fileList.filter((_, i) => i !== idx);
    onFiles(next);
  };

  const display = (i: number, k: NumKey) =>
    (draft[i]?.[k] ?? (rows[i][k] != null ? String(rows[i][k] as number).replace('.', ',') : ''));

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

      {/* HEADER */}
      <div className={`hidden md:grid ${COLS} ${GAP} pb-2 text-[11px] font-medium text-slate-500`}>
        <div>Etichetta</div>
        <div>Tipologia</div>
        <div>Quantità</div>
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
        {rows.map((r, i) => {
          const isBrochure = r.tipologia === 'brochure/depliant';
          return (
            <div key={i} className={`grid ${COLS} ${GAP} items-center`}>
              {/* Etichetta */}
              <input
                className={inputCls}
                placeholder="Nome etichetta"
                aria-label="Etichetta"
                value={r.etichetta}
                onChange={(e) => update(i, 'etichetta', e.target.value)}
              />

              {/* Tipologia */}
              <select
                className={inputCls}
                aria-label="Tipologia"
                value={r.tipologia}
                onChange={(e) => update(i, 'tipologia', e.target.value as TipologiaPL)}
              >
                <option value="vino fermo">vino fermo</option>
                <option value="vino spumante">vino spumante</option>
                <option value="brochure/depliant">brochure/depliant</option>
              </select>

              {/* Quantità: bottiglie o pezzi */}
              <input
                className={inputCls}
                placeholder={isBrochure ? 'pezzi' : 'bott.'}
                aria-label="Quantità"
                inputMode="numeric"
                pattern="[0-9]*"
                value={display(i, 'bottiglie')}
                onChange={(e) => setDraftVal(i, 'bottiglie', e.target.value)}
                onBlur={() => commitNumber(i, 'bottiglie')}
                onKeyDown={(e) => e.key === 'Enter' && commitNumber(i, 'bottiglie')}
              />

              {/* Formato (L) — disabilitato per brochure */}
              <input
                className={inputCls}
                placeholder="0,75"
                aria-label="Formato in litri"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={display(i, 'formato_litri')}
                onChange={(e) => setDraftVal(i, 'formato_litri', e.target.value)}
                onBlur={() => commitNumber(i, 'formato_litri')}
                onKeyDown={(e) => e.key === 'Enter' && commitNumber(i, 'formato_litri')}
                disabled={isBrochure}
              />

              {/* Gradazione — disabilitata per brochure */}
              <input
                className={inputCls}
                placeholder="12"
                aria-label="Gradazione percentuale"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={display(i, 'gradazione')}
                onChange={(e) => setDraftVal(i, 'gradazione', e.target.value)}
                onBlur={() => commitNumber(i, 'gradazione')}
                onKeyDown={(e) => e.key === 'Enter' && commitNumber(i, 'gradazione')}
                disabled={isBrochure}
              />

              {/* Prezzo */}
              <input
                className={inputCls}
                placeholder="0"
                aria-label="Prezzo unitario"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={display(i, 'prezzo')}
                onChange={(e) => setDraftVal(i, 'prezzo', e.target.value)}
                onBlur={() => commitNumber(i, 'prezzo')}
                onKeyDown={(e) => e.key === 'Enter' && commitNumber(i, 'prezzo')}
              />

              {/* Valuta */}
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

              {/* Peso netto/lordo (per bottiglia o per pezzo) */}
              <input
                className={inputCls}
                placeholder={isBrochure ? 'peso netto/pezzo (kg)' : 'peso netto/bott (kg)'}
                aria-label="Peso netto"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={display(i, 'peso_netto_bott')}
                onChange={(e) => setDraftVal(i, 'peso_netto_bott', e.target.value)}
                onBlur={() => commitNumber(i, 'peso_netto_bott')}
                onKeyDown={(e) => e.key === 'Enter' && commitNumber(i, 'peso_netto_bott')}
              />
              <input
                className={inputCls}
                placeholder={isBrochure ? 'peso lordo/pezzo (kg)' : 'peso lordo/bott (kg)'}
                aria-label="Peso lordo"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={display(i, 'peso_lordo_bott')}
                onChange={(e) => setDraftVal(i, 'peso_lordo_bott', e.target.value)}
                onBlur={() => commitNumber(i, 'peso_lordo_bott')}
                onKeyDown={(e) => e.key === 'Enter' && commitNumber(i, 'peso_lordo_bott')}
              />

              {/* Azioni */}
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
          );
        })}

        {rows.length === 0 && (
          <div className="text-sm text-slate-500">
            Nessuna riga. Aggiungi una riga per iniziare.
          </div>
        )}
      </div>
    </div>
  );
}
