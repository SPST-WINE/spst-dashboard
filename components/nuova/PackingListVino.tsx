// components/nuova/PackingListVino.tsx
'use client';

import { useRef } from 'react';

export type RigaPL = {
  etichetta: string;
  bottiglie: number;
  formato_litri: number;
  gradazione: number;
  prezzo: number;
  valuta: 'EUR' | 'USD' | 'GBP';
  peso_netto_bott: number;
  peso_lordo_bott: number;
};

type Props = {
  value: RigaPL[];
  onChange: (rows: RigaPL[]) => void;
  /** NUOVO: upload file packing list (multi) */
  onFiles?: (files: File[]) => void;
};

export default function PackingListVino({ value, onChange, onFiles }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addRow = () =>
    onChange([
      ...value,
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

  const removeRow = (idx: number) => {
    const copy = [...value];
    copy.splice(idx, 1);
    onChange(copy);
  };

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Packing list (vino)</h3>

        <div className="flex items-center gap-2">
          {/* NUOVO: bottone allega (estetica uguale agli altri bottoni) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Allega packing list
          </button>

          <button
            type="button"
            onClick={addRow}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            + Aggiungi riga
          </button>
        </div>

        {/* NUOVO: input file nascosto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            if (files.length && onFiles) onFiles(files);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />
      </div>

      {/* …qui restano i tuoi campi/righe attuali… */}
      {value.map((row, i) => (
        <div key={i} className="grid grid-cols-8 gap-2 items-center">
          {/* esempio minimal per non cambiare estetica: sostituisci con i tuoi input */}
          <input
            className="col-span-2 rounded border px-2 py-1 text-sm"
            placeholder="Nome etichetta"
            value={row.etichetta}
            onChange={(e) => {
              const copy = [...value];
              copy[i] = { ...copy[i], etichetta: e.target.value };
              onChange(copy);
            }}
          />
          {/* …altri input come già li avevi… */}
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="col-span-1 justify-self-end rounded border px-2 py-1 text-sm hover:bg-slate-50"
          >
            Rimuovi
          </button>
        </div>
      ))}
    </div>
  );
}
