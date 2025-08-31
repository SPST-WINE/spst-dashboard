'use client';

import React from 'react';

type BaseProps = { label: string; className?: string };

export function Text({
  label, value, onChange, placeholder, className = '',
}: BaseProps & {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-spst-blue/20"
      />
    </div>
  );
}

export function NumberField({
  label, value, onChange, step = 1, min, max, className = '',
}: BaseProps & {
  value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        step={step} min={min} max={max}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-spst-blue/20"
      />
    </div>
  );
}

export function Area({
  label, value, onChange, rows = 5, className = '', placeholder,
}: BaseProps & {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-spst-blue/20"
      />
    </div>
  );
}

/** Select semplificata (tipizzata a string per compatibilità con setState) */
export function Select({
  label, value, onChange, options, className = '',
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-spst-blue/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
