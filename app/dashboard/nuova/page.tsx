'use client';

import Link from 'next/link';

export default function NuovaPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Nuova spedizione</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/nuova/vino"
          className="rounded-2xl border p-6 transition hover:shadow-sm"
        >
          <h3 className="mb-2 text-spst-orange">Spedizione vino</h3>
          <p className="text-sm text-slate-600">
            Dati completi, fatture e packing list. Tutto ciò che serve per spedire prodotti soggetti ad accisa.
          </p>
        </Link>

        <Link
          href="/dashboard/nuova/altro"
          className="rounded-2xl border p-6 transition hover:shadow-sm"
        >
          <h3 className="mb-2 text-spst-orange">Altre spedizioni</h3>
          <p className="text-sm text-slate-600">
            Documenti non soggetti ad accisa, materiali, brochure, ecc.
          </p>
        </Link>
      </div>
    </div>
  );
}
