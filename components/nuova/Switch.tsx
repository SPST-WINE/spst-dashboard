'use client';

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  id?: string;
};

export default function Switch({ checked, onChange, label, id }: Props) {
  const inputId = id || `sw-${Math.random().toString(36).slice(2)}`;

  return (
    <label htmlFor={inputId} className="inline-flex items-center gap-3 cursor-pointer select-none">
      <input
        id={inputId}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {/* Track */}
      <span className="relative inline-block h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-[#1c3e5e]">
        {/* Thumb */}
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}
