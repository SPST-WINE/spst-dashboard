'use client';
import { Area } from './Field';
import { DayPicker } from 'react-day-picker';
import { addDays, isBefore, startOfToday, format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function RitiroCard({
  date, setDate, note, setNote,
}:{
  date: Date|undefined; setDate: (d:Date|undefined)=>void;
  note: string; setNote: (s:string)=>void;
}) {
  const today = startOfToday();
  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-spst-orange">Ritiro</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={it}
            disabled={ d => isBefore(d!, today) }
            fromDate={today}
            toDate={addDays(today, 120)}
            showOutsideDays
            fixedWeeks
          />
        </div>
        <div>
          <div className="mb-2 text-sm">Data selezionata: <span className="font-medium">{date ? format(date,'dd/MM/yyyy') : '—'}</span></div>
          <Area label="Note sul ritiro" value={note} onChange={setNote} rows={6} />
        </div>
      </div>
    </div>
  );
}
