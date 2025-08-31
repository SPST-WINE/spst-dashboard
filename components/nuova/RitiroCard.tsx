'use client';

import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { it } from 'date-fns/locale';
import { format } from 'date-fns';

type Props = {
  date?: Date;
  setDate: (d?: Date) => void;
  note: string;
  setNote: (v: string) => void;
};

export default function RitiroCard({ date, setDate, note, setNote }: Props) {
  const tomorrow = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-spst-orange">Ritiro</h3>

      {/* sinistra: calendario (auto), destra: note (1fr) */}
      <div className="grid items-start gap-4 md:grid-cols-[auto,1fr]">
        <div className="inline-block rounded-xl border bg-white p-3">
          <DayPicker
            mode="single"
            locale={it}
            selected={date}
            onSelect={setDate}
            showOutsideDays
            // weekend off + niente date prima di domani
            disabled={[{ dayOfWeek: [0, 6] }, { before: tomorrow }]}
            // mostro come mese iniziale quello di domani (o la data già scelta)
            defaultMonth={date ?? tomorrow}
            className="rdp !m-0"
            formatters={{
              // intestazioni brevi in italiano: lun, mar, mer, gio, ven
              formatWeekdayName: (day, options) => format(day, 'eee', { locale: it }),
            }}
          />
        </div>

        <div className="rounded-xl border bg-white p-3 md:min-h-[360px]">
          <div className="mb-3 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Data selezionata: </span>
            {date ? format(date, 'PPP', { locale: it }) : '—'}
          </div>
          <label className="mb-1 block text-sm text-slate-600">Note sul ritiro</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={8}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-[#1c3e5e]"
            placeholder="Es. orario preferito, contatto magazzino, accessi, ecc."
          />
        </div>
      </div>

      {/* Fix visuali DayPicker: colonne allineate 7x7 e hover centrato */}
      <style jsx global>{`
        .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #1c3e5e; /* blu SPST */
          --rdp-background-color: #eaf1f7;
          font-size: 14px;
        }
        .rdp-months { gap: 8px; }
        .rdp-month { margin: 0; padding: 0; }
        .rdp-table { border-collapse: collapse; table-layout: fixed; }
        .rdp-head_row { height: 28px; }
        .rdp-head_cell,
        .rdp-day {
          width: var(--rdp-cell-size);       /* <— fondamentale per allineare header/giorni */
          min-width: var(--rdp-cell-size);
          text-align: center;
        }
        .rdp-head_cell {
          color: #64748b;
          font-weight: 600;
          text-transform: lowercase;
          padding: 4px 0;
        }
        .rdp-day {
          height: var(--rdp-cell-size);
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          transition: background-color .15s ease, color .15s ease, box-shadow .15s ease;
        }
        .rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_selected) {
          background-color: var(--rdp-background-color);
        }
        .rdp-day_selected {
          background-color: var(--rdp-accent-color) !important;
          color: #fff !important;
          box-shadow: inset 0 0 0 2px #0f2233;
        }
        .rdp-day_disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .rdp-caption { padding: 4px 0 8px; }
        .rdp-nav { gap: 6px; }
        .rdp-button_reset { margin: 0; }
      `}</style>
    </div>
  );
}
