'use client';

import { NumberField, Text } from './Field';

export type RigaPL = {
  etichetta: string;
  bottiglie: number;
  formato_litri: number;
  gradazione: number;
  costo_unit: number;
  peso_netto_bott: number;
  peso_lordo_bott: number;
};

type Props = {
  righe: RigaPL[];
  onChange: (next: RigaPL[]) => void;
};

export default function PackingListVino({ righe, onChange }: Props) {
  const set =
    (i: number, key: keyof RigaPL) =>
    (v: string | number) => {
      const next = [...righe];
      // coercizione numerica dove serve
      const isNum = ['bottiglie', 'formato_litri', 'gradazione', 'costo_unit', 'peso_netto_bott', 'peso_lordo_bott'].includes(
        key as string
      );
      // @ts-ignore
      next[i][key] = isNum ? Number(v) : (v as string);
      onChange(next);
    };

  const add = () =>
    onChange([
      ...righe,
      {
        etichetta: '',
        bottiglie: 1,
        formato_litri: 0.75,
        gradazione: 12,
        costo_unit: 0,
        peso_netto_bott: 0.75,
        peso_lordo_bott: 1.3,
      },
    ]);

  const remove = (i: number) => onChange(righe.filter((_, idx) => idx !== i));

  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-spst-orange">Packing list (vino)</h3>

      <div className="space-y-3">
        {righe.map((r, i) => (
          <div key={i} className="rounded-xl border p-3">
            <div className="grid gap-3 md:grid-cols-7">
              <Text label="Etichetta" value={r.etichetta} onChange={set(i, 'etichetta')} />
              <NumberField label="Bott." value={r.bottiglie} onChange={set(i, 'bottiglie')} />
              <NumberField label="Formato (L)" step={0.01} value={r.formato_litri} onChange={set(i, 'formato_litri')} />
              <NumberField label="Grad. %" step={0.1} value={r.gradazione} onChange={set(i, 'gradazione')} />
              <NumberField label="Costo €" step={0.01} value={r.costo_unit} onChange={set(i, 'costo_unit')} />
              <NumberField label="Peso netto (kg)" step={0.01} value={r.peso_netto_bott} onChange={set(i, 'peso_netto_bott')} />
              <NumberField label="Peso lordo (kg)" step={0.01} value={r.peso_lordo_bott} onChange={set(i, 'peso_lordo_bott')} />
            </div>
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Rimuovi riga
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-3 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
      >
        + Aggiungi riga
      </button>
    </div>
  );
}
