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
    <label
      htmlFor={inputId}
      className="inline-flex items-center gap-3 cursor-pointer select-none"
      aria-label={label}
    >
      <input
        id={inputId}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {/* Track + Thumb (via :after) */}
      <span
        className="
          relative inline-block h-6 w-11 rounded-full bg-slate-300 transition-colors
          peer-checked:bg-[#1c3e5e]
          after:content-[''] after:absolute after:left-0.5 after:top-0.5
          after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow
          after:transition-transform after:duration-200
          peer-checked:after:translate-x-5
        "
        aria-hidden="true"
      />
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}
