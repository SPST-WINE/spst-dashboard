'use client';

import * as React from 'react';
import {
  addMonths,
  startOfMonth,
  endOfMonth,
  getDay,
  eachDayOfInterval,
  isBefore,
  isWeekend,
  isSameDay,
  format,
} from 'date-fns';
import { it } from 'date-fns/locale';

type Props = {
  date?: Date;
  setDate: (d?: Date) => void;
  note: string;
  setNote: (v: string) => void;
  /** opzionale: cambia la prima data selezionabile (default: domani) */
  minSelectableDate?: Date;
};

const BLUE = '#1c3e5e';   // SPST blu
const ORANGE = '#f7911e'; // SPST arancio

export default function RitiroCard({
  date,
  setDate,
  note,
  setNote,
  minSelectableDate,
}: Props) {
  // Domani 00:00 come minimo, se non specificato
  const minDate = React.useMemo(() => {
    const d = minSelectableDate ? new Date(minSelectableDate) : new Date();
    if (!minSelectableDate) d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [minSelectableDate]);

  // Mese mostrato
  const [month, setMonth] = React.useState<Date>(date ?? minDate);

  // Giorni del mese corrente
  const firstOfMonth = startOfMonth(month);
  const lastOfMonth = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: firstOfMonth, end: lastOfMonth });

  // indice del giorno della settimana per il 1° del mese (lunedì=0 … domenica=6)
  const firstWeekday = (getDay(firstOfMonth) + 6) % 7;

  // quanti “vuoti” prima e dopo per completare una griglia multipla di 7
  const leadingBlanks = Array.from({ length: firstWeekday });
  const totalCells = leadingBlanks.length + daysInMonth.length;
  const trailingBlanks = Array.from({ length: (7 - (totalCells % 7 || 7)) });

  const canSelect = (d: Date) =>
    !isWeekend(d) && !isBefore(d, minDate);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold" style={{ color: ORANGE }}>
        Ritiro
      </h3>

      <div className="grid items-start gap-4 md:grid-cols-[minmax(280px,340px)_1fr]">
        {/* CALENDARIO */}
        <div className="rounded-xl border p-3">
          {/* Header mese */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, -1))}
              aria-label="Mese precedente"
              className="grid h-8 w-8 place-items-center rounded-md border hover:bg-slate-50"
            >
              ‹
            </button>
            <div className="text-sm font-semibold">
              {format(month, 'LLLL yyyy', { locale: it })}
            </div>
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, 1))}
              aria-label="Mese successivo"
              className="grid h-8 w-8 place-items-center rounded-md border hover:bg-slate-50"
            >
              ›
            </button>
          </div>

          {/* Intestazione giorni (lun…dom) */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-600">
            {['lun','mar','mer','gio','ven','sab','dom'].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          {/* Griglia giorni */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* vuoti iniziali */}
            {leadingBlanks.map((_, i) => (
              <div key={`lead-${i}`} className="h-10" />
            ))}

            {/* giorni del mese */}
            {daysInMonth.map((d) => {
              const selected = !!date && isSameDay(d, date);
              const disabled = !canSelect(d);

              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => setDate(d)}
                  className={[
                    'h-10 w-10 md:h-10 md:w-10',
                    'mx-auto grid place-items-center rounded-lg text-sm leading-none',
                    disabled
                      ? 'cursor-not-allowed opacity-40 text-slate-400'
                      : 'hover:bg-slate-100',
                    selected ? 'text-white ring-2 ring-[#0f2233]' : 'text-slate-800',
                  ].join(' ')}
                  style={{ backgroundColor: selected ? BLUE : 'transparent' }}
                >
                  {format(d, 'd', { locale: it })}
                </button>
              );
            })}

            {/* vuoti finali */}
            {trailingBlanks.map((_, i) => (
              <div key={`trail-${i}`} className="h-10" />
            ))}
          </div>
        </div>

        {/* DATA & NOTE */}
        <div className="rounded-xl border p-3 md:min-h-[340px]">
          <div className="mb-3 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Data selezionata: </span>
            {date ? format(date, 'd LLLL yyyy', { locale: it }) : '—'}
          </div>
          <label className="mb-1 block text-sm text-slate-600">Note sul ritiro</label>
          <textarea
            rows={9}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-[#1c3e5e]"
            placeholder="Es. orario preferito, contatto magazzino, accessi, ecc."
          />
        </div>
      </div>
    </div>
  );
}
