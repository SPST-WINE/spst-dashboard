'use client';

import { Select, Text, Area } from './Field';

type Props = {
  incoterm: 'DAP' | 'DDP' | 'EXW';
  setIncoterm: (v: 'DAP' | 'DDP' | 'EXW') => void;
  valuta: 'EUR' | 'USD' | 'GBP';
  setValuta: (v: 'EUR' | 'USD' | 'GBP') => void;
  note: string;
  setNote: (v: string) => void;
  delega: boolean;
  setDelega: (v: boolean) => void;
};

export default function FatturaCard({
  incoterm,
  setIncoterm,
  valuta,
  setValuta,
  note,
  setNote,
  delega,
  setDelega,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-spst-orange">Dati fattura</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <Select
          label="Incoterm"
          value={incoterm}
          onChange={setIncoterm}
          options={[
            { label: 'DAP', value: 'DAP' },
            { label: 'DDP', value: 'DDP' },
            { label: 'EXW', value: 'EXW' },
          ]}
        />
        <Select
          label="Valuta"
          value={valuta}
          onChange={setValuta}
          options={[
            { label: 'EUR', value: 'EUR' },
            { label: 'USD', value: 'USD' },
            { label: 'GBP', value: 'GBP' },
          ]}
        />
        <Area
          className="md:col-span-2"
          label="Note"
          value={note}
          onChange={setNote}
          rows={4}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={delega}
            onChange={(e) => setDelega(e.target.checked)}
          />
          Non ho la fattura, <b>createla voi</b> (SPST)
        </label>

        <button
          type="button"
          className="ml-auto rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
        >
          Allega fattura (PDF)
        </button>
      </div>
    </div>
  );
}
