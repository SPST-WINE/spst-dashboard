'use client';
import Link from 'next/link';
import { Wine, Package } from 'lucide-react';

export default function NuovaSelezione() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Nuova spedizione</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/nuova/vino"
          className="group rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <Wine className="h-6 w-6 text-spst-blue" />
            <h2 className="text-base font-semibold text-spst-orange">Spedizione Vino</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Packing list dedicata, incoterm, colli/pallet e tutto ciò che serve per il vino.
          </p>
        </Link>

        <Link
          href="/dashboard/nuova/altro"
          className="group rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-spst-blue" />
            <h2 className="text-base font-semibold text-spst-orange">Altre spedizioni</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Brochure, etichette, colli senza accisa: dati essenziali e via.
          </p>
        </Link>
      </div>
    </div>
  );
}
