// components/Drawer.tsx
'use client';

import { ReactNode } from 'react';

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode | (() => ReactNode); // accetta testo, nodo o anche una funzione che ritorna un nodo
  children: ReactNode;
};

export default function Drawer({ open, onClose, title, children }: DrawerProps) {
  if (!open) return null;

  const renderedTitle =
    typeof title === 'function' ? (title as () => ReactNode)() : title;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* backdrop */}
      <button
        aria-label="Chiudi"
        onClick={onClose}
        className="flex-1 bg-black/30"
      />
      {/* pannello */}
      <div className="h-full w-full max-w-xl overflow-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-3">
          <div className="text-sm font-semibold">
            {renderedTitle ?? 'Dettagli'}
          </div>
          <button
            onClick={onClose}
            className="rounded-md border px-2 py-1 text-sm hover:bg-slate-50"
          >
            Chiudi
          </button>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}
