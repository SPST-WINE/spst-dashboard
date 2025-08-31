'use client';

import * as React from 'react';
import {
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isBefore,
  isWeekend,
  format,
} from 'date-fns';
import { it } from 'date-fns/locale';

type Props = {
  date?: Date;
  setDate: (d?: Date) => void;
  note: string;
  setNote: (v: string) => void;
};

const CELL = 40; // lato cella in px
const BLUE = '#1c3e5e';

export default function RitiroCard({ date, setDate, note, setNote }: Props) {
  // domani alle 00:00 = prima data selezionabile
  const minDate = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [month, setMonth] = React.useState<Date>(date ?? minDate);

  const weeks = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const days: Date[] = [];
    let cur = start;
    while (cur <= end) {
      days.push(cur);
      cur = addDays(cur, 1);
    }
    // chunk per settimane
    const out: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [month]);

  const canSelect = (d: Date) =>
    !isWeekend(d) && !isBefore(d, minDate) && isSameMonth(d, month);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold" style={{ color: '#f7911e' }}>
        Ritiro
      </h3>

      <div className="grid items-start gap-4 md:grid-cols-[auto,1fr]">
        {/* Calendario */}
        <div className="rounded-xl border p-3">
          {/* Caption */}
          <div className="flex items-center justify-between px-1 pb-2" style={{ width: CELL * 7 }}>
            <button
              type="button"
              aria-label="Mese precedente"
              onClick={() => setMonth(addMonths(month, -1))}
              className="grid h-8 w-8 place-items-center rounded-md border hover:bg-slate-50"
            >
              ‹
            </button>
            <div className="text-sm font-semibold">
              {format(month, 'LLLL yyyy', { locale: it })}
            </div>
            <button
              type="button"
              aria-label="Mese successivo"
              onClick={() => setMonth(addMonths(month, 1))}
              className="grid h-8 w-8 place-items-center rounded-md border hover:bg-slate-50"
            >
              ›
            </button>
          </div>

          {/* Weekdays */}
          <div
            className="grid text-center text-xs font-semibold text-slate-600"
            style={{ gridTemplateColumns: 'repeat(7, 1fr)', width: CELL * 7 }}
          >
            {['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div
            className="grid gap-[6px]"
            style={{
              gridTemplateColumns: 'repeat(7, 1fr)',
              width: CELL * 7,
            }}
          >
            {weeks.flat().map((d, idx) => {
              const selected = !!date && isSameDay(d, date);
              const outside = !isSameMonth(d, month);
              const disabled = isWeekend(d) || isBefore(d, minDate) || outside;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled}
                  onClick={() => setDate(d)}
                  className={`grid place-items-center rounded-[10px] text-sm transition
                    ${disabled ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}
                    ${selected ? 'text-white' : 'text-slate-800'}
                  `}
                  style={{
                    width: CELL,
                    height: CELL,
                    backgroundColor: selected ? BLUE : 'transparent',
                    boxShadow: selected ? 'inset 0 0 0 2px #0f2233' : undefined,
                  }}
                >
                  <span>{format(d, 'd', { locale: it })}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div className="rounded-xl border p-3 md:min-h-[360px]">
          <div className="mb-3 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Data selezionata: </span>
            {date ? format(date, 'd LLLL yyyy', { locale: it }) : '—'}
          </div>
          <label className="mb-1 block text-sm text-slate-600">Note sul ritiro</label>
          <textarea
            rows={8}
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
