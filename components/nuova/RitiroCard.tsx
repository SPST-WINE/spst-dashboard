'use client';
import './daypicker.css';
import { DayPicker } from 'react-day-picker';
import { Area } from './Field';

export default function RitiroCard({ date, setDate, note, setNote }:{
  date: Date|undefined; setDate: (d:Date|undefined)=>void;
  note: string; setNote: (s:string)=>void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-spst-orange">Ritiro</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-3">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={{ before: new Date() }}
            weekStartsOn={1}
          />
        </div>
        <div>
          <p className="mb-2 text-sm text-slate-600">
            Data selezionata: <span className="font-medium">{date?.toLocaleDateString('it-IT') ?? '—'}</span>
          </p>
          <Area label="Note sul ritiro" value={note} onChange={setNote} rows={8} />
        </div>
      </div>
    </div>
  );
}
