'use client';

import { NumberField, Select, Text } from './Field';

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

export default function ColliCard({
  colli,
  onChange,
  formato,
  setFormato,
  contenuto,
  setContenuto,
}: Props) {
  const update = (idx: number, patch: Partial<Collo>) => {
    const copy = [...colli];
    copy[idx] = { ...copy[idx], ...patch };
    onChange(copy);
  };

  const addCollo = () =>
    onChange([
      ...colli,
      { lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null },
    ]);

  const removeCollo = (idx: number) => {
    const copy = colli.slice();
    copy.splice(idx, 1);
    onChange(copy.length ? copy : [{ lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null }]);
  };

  const pesoReale =
    colli.reduce((s, c) => s + (c.peso_kg ?? 0), 0) || 0;

  const pesoVolumetrico =
    colli.reduce((s, c) => {
      const L = c.lunghezza_cm ?? 0;
      const W = c.larghezza_cm ?? 0;
      const H = c.altezza_cm ?? 0;
      return s + (L * W * H) / 4000;
    }, 0) || 0;

  const pesoTariffato = Math.max(pesoReale, pesoVolumetrico);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-spst-orange">Colli</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <Select
          label="Formato"
          value={formato}
          onChange={(v) => setFormato((v as 'Pacco' | 'Pallet') ?? 'Pacco')}
          options={[
            { label: 'Pacco', value: 'Pacco' },
            { label: 'Pallet', value: 'Pallet' },
          ]}
        />
        <Text
          label="Contenuto colli"
          value={contenuto}
          onChange={setContenuto}
          placeholder="Es. bottiglie vino, brochure, etichette…"
        />
      </div>

      {/* Lista colli */}
      <div className="mt-3 space-y-3">
        {colli.map((c, i) => (
          <div
            key={i}
            className="rounded-xl border bg-slate-50/60 p-3"
          >
            <div className="mb-2 text-xs font-medium text-slate-500">
              Collo #{i + 1}
            </div>

            {/* Riga unica con tutti i campi + bottone rimuovi allineato a destra */}
            <div className="flex flex-wrap items-end gap-3">
              <NumberField
                label="Lato 1 (cm)"
                value={c.lunghezza_cm}
                onChange={(v) => update(i, { lunghezza_cm: v })}
                min={0}
                step="any"
                className="min-w-[120px] flex-1"
              />
              <NumberField
                label="Lato 2 (cm)"
                value={c.larghezza_cm}
                onChange={(v) => update(i, { larghezza_cm: v })}
                min={0}
                step="any"
                className="min-w-[120px] flex-1"
              />
              <NumberField
                label="Lato 3 (cm)"
                value={c.altezza_cm}
                onChange={(v) => update(i, { altezza_cm: v })}
                min={0}
                step="any"
                className="min-w-[120px] flex-1"
              />
              <NumberField
                label="Peso (kg)"
                value={c.peso_kg}
                onChange={(v) => update(i, { peso_kg: v })}
                min={0}
                step="any"
                className="min-w-[120px] flex-1"
              />

              <button
                type="button"
                onClick={() => removeCollo(i)}
                className="ml-auto rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
              >
                Rimuovi
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Barra azioni: aggiungi + badge pesi a destra */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={addCollo}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          + Aggiungi collo
        </button>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md border border-slate-300 bg-white px-2 py-1">
            Peso reale: <span className="font-semibold">{pesoReale.toFixed(2)} kg</span>
          </span>
          <span className="rounded-md border border-slate-300 bg-white px-2 py-1">
            Volumetrico: <span className="font-semibold">{pesoVolumetrico.toFixed(2)} kg</span> (L×W×H/4000)
          </span>
          <span className="rounded-md border border-slate-300 bg-white px-2 py-1">
            Peso tariffato: <span className="font-semibold">{pesoTariffato.toFixed(2)} kg</span>
          </span>
        </div>
      </div>
    </div>
  );
}
