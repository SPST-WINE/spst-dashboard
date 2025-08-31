'use client';

import React from 'react';
import clsx from 'clsx';

type BaseProps = {
  label: string;
  className?: string;
  hint?: string;
};

export function Text({
  label,
  value,
  onChange,
  placeholder,
  className,
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className={clsx('space-y-1', className)}>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
      />
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  step = 'any',
  placeholder,
  className,
}: BaseProps & {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  step?: number | 'any';
  placeholder?: string;
}) {
  return (
    <div className={clsx('space-y-1', className)}>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '' || v === '-') onChange(null);
          else onChange(Number(v));
        }}
        min={min}
        step={step}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
      />
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  className,
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div className={clsx('space-y-1', className)}>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-400 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
