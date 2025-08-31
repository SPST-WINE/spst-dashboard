'use client';

import * as React from 'react';
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
  // domani (h 00:00) = prima data selezionabile
  const tomorrow = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // dimensione cella coerente (7 colonne)
  const CELL = 40; // px
  const TABLE_W = CELL * 7; // 280px

  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-spst-orange">Ritiro</h3>

      {/* sinistra: calendario, destra: note */}
      <div className="grid items-start gap-4 md:grid-cols-[auto,1fr]">
        <div className="inline-block rounded-xl border bg-white p-3">
          <DayPicker
            mode="single"
            locale={it}
            selected={date}
            onSelect={setDate}
            showOutsideDays
            /* blocca weekend e date prima di domani */
            disabled={[{ dayOfWeek: [0, 6] }, { before: tomorrow }]}
            fromDate={tomorrow}
            defaultMonth={date ?? tomorrow}
            /* stili "hard" applicati direttamente ai nodi del calendario */
            styles={{
              months: { margin: 0 },
              month: { margin: 0 },
              caption: { padding: '4px 0 8px', width: TABLE_W },
              nav: { display: 'flex', gap: 6 },
              table: { tableLayout: 'fixed', width: TABLE_W },
              head_row: { height: 28 },
              head_cell: {
                width: CELL,
                minWidth: CELL,
                textAlign: 'center',
                color: '#64748b',
                fontWeight: 600,
                textTransform: 'lowercase',
                padding: '4px 0',
              },
              row: {},
              day: {
                width: CELL,
                height: CELL,
                minWidth: CELL,
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                margin: 0,
              },
              day_selected: {
                backgroundColor: '#1c3e5e',
                color: '#fff',
                boxShadow: 'inset 0 0 0 2px #0f2233',
              },
              day_disabled: { opacity: 0.4, cursor: 'not-allowed' },
            }}
            /* abbreviazioni giorni in italiano */
            formatters={{
              formatWeekdayName: (day) => format(day, 'eee', { locale: it }),
            }}
            /* classi extra solo per hover */
            classNames={{
              day: 'tw-day',
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
            rows={8}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-[#1c3e5e]"
            placeholder="Es. orario preferito, contatto magazzino, accessi, ecc."
          />
        </div>
      </div>

      {/* Hover armonizzato (fuori da react-day-picker) */}
      <style jsx global>{`
        .tw-day:hover:not(.rdp-day_disabled):not(.rdp-day_selected) {
          background-color: #eaf1f7;
        }
      `}</style>
    </div>
  );
}
