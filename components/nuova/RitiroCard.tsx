'use client';

import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { it } from 'date-fns/locale';
import { format } from 'date-fns';
import React from 'react';

type Props = {
  date?: Date;
  setDate: (d?: Date) => void;
  note: string;
  setNote: (v: string) => void;
};

export default function RitiroCard({ date, setDate, note, setNote }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-spst-orange">Ritiro</h3>

      {/* 2 colonne: calendario + dettagli */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Calendario */}
        <div className="rounded-xl border bg-white p-3">
          <DayPicker
            mode="single"
            locale={it}
            selected={date}
            onSelect={setDate}
            showOutsideDays
            disabled={{ dayOfWeek: [0, 6] }}     // 0 = domenica, 6 = sabato
            className="rdp !m-0"
            formatters={{
              // Intestazione giorni: lun, mar, mer, gio, ven
              formatWeekdayName: (day, options) => format(day, 'eee', { locale: it }),
            }}
          />
        </div>

        {/* Data selezionata + note */}
        <div className="rounded-xl border bg-white p-3">
          <div className="mb-3 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Data selezionata: </span>
            {date ? format(date, 'PPP', { locale: it }) : '—'}
          </div>
          <label className="mb-1 block text-sm text-slate-600">Note sul ritiro</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-[#1c3e5e]"
            placeholder="Es. orario preferito, contatto magazzino, accessi, ecc."
          />
        </div>
      </div>

      {/* Override stile DayPicker: allineamenti, hover e dimensioni coerenti */}
      <style jsx global>{`
        /* Variabili e palette */
        .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #1c3e5e;         /* blu SPST */
          --rdp-background-color: #eaf1f7;
          --rdp-outline: 2px solid var(--rdp-accent-color);
          --rdp-outline-selected: 2px solid var(--rdp-accent-color);
          font-size: 14px;
        }

        /* Griglia giorni coerente (niente offset strani) */
        .rdp-months { gap: 8px; }
        .rdp-month { padding: 4px; }
        .rdp-table { border-collapse: separate; border-spacing: 6px; }
        .rdp-head_cell { color: #64748b; font-weight: 600; text-transform: lowercase; }
        .rdp-head_cell:first-letter { text-transform: lowercase; }

        /* Giorno come “pallino” centrato */
        .rdp-day {
          height: var(--rdp-cell-size);
          width: var(--rdp-cell-size);
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          position: relative;
          transition: background-color 0.15s ease;
        }

        /* Hover preciso */
        .rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_selected) {
          background-color: var(--rdp-background-color);
        }

        /* Selected */
        .rdp-day_selected {
          background-color: var(--rdp-accent-color) !important;
          color: #fff !important;
        }

        /* Disabled (weekend) */
        .rdp-day_disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Niente margini strani attorno al calendario */
        .rdp-button_reset { margin: 0; }
        .rdp-caption_label { font-weight: 600; }
      `}</style>
    </div>
  );
}
