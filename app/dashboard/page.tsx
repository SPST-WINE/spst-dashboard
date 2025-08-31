// app/dashboard/nuova/page.tsx
import Link from 'next/link';
import { Wine, Package } from 'lucide-react';

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-spst-orange ring-1 ring-orange-200">
      {children}
    </div>
  );
}

export default function NuovaSpedizionePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Nuova spedizione</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card: Spedizione vino */}
        <Link
          href="/dashboard/nuova/vino"
          className="group rounded-2xl border bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <IconBadge>
              <Wine className="h-5 w-5" aria-hidden />
            </IconBadge>
            <div>
              <h3 className="text-sm font-semibold text-spst-orange">
                Spedizione vino
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Dati completi, fatture e packing list. Tutto ciò che serve per
                spedire prodotti soggetti ad accisa.
              </p>
            </div>
          </div>
        </Link>

        {/* Card: Altre spedizioni */}
        <Link
          href="/dashboard/nuova/altro"
          className="group rounded-2xl border bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <IconBadge>
              <Package className="h-5 w-5" aria-hidden />
            </IconBadge>
            <div>
              <h3 className="text-sm font-semibold text-spst-orange">
                Altre spedizioni
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Documenti non soggetti ad accisa, materiali, brochure, ecc.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
