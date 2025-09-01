'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';

// Icona bicchiere di vino (SVG inline, stile lucide-like)
function WineGlassIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* coppa */}
      <path d="M7 3h10v2a5 5 0 0 1-5 5h0a5 5 0 0 1-5-5V3z" />
      {/* stelo */}
      <path d="M12 10v7" />
      {/* base */}
      <path d="M8 21h8" />
      {/* livello vino (leggera curva interna) */}
      <path d="M8 6.5c1.2.8 2.8 1.3 4 1.3s2.8-.5 4-1.3" />
    </svg>
  );
}

const SPST_BLUE = '#1c3e5e';

export default function NuovaSpedizioneSelettore() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mt-2 flex min-h-[55vh] items-center justify-center">
        <div className="flex w-full flex-col items-center md:flex-row md:justify-center md:gap-12">
          {/* CARD: VINO */}
          <Link
            href="/dashboard/nuova/vino"
            aria-label="Crea una nuova spedizione vino"
            className="group w-full max-w-md rounded-2xl border bg-white p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1c3e5e]/30"
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
                style={{
                  color: SPST_BLUE,
                  backgroundColor: '#eef4f9',
                  borderColor: `${SPST_BLUE}4D`, // ~30% alpha
                }}
              >
                <WineGlassIcon width={22} height={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  <span className="text-spst-orange">Spedizione vino</span>
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Dati completi e fatture. Tutto ciò che serve per spedire prodotti soggetti ad accisa.
                </p>
              </div>
            </div>
          </Link>

          {/* divisore */}
          <div className="my-6 h-px w-full bg-slate-200 md:my-0 md:h-72 md:w-px md:rounded-full" />

          {/* CARD: ALTRE SPEDIZIONI */}
          <Link
            href="/dashboard/nuova/altro"
            aria-label="Crea una nuova spedizione altre merci"
            className="group w-full max-w-md rounded-2xl border bg-white p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1c3e5e]/30"
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
                style={{
                  color: SPST_BLUE,
                  backgroundColor: '#eef4f9',
                  borderColor: `${SPST_BLUE}4D`,
                }}
              >
                <FileText size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  <span className="text-spst-orange">Altre spedizioni</span>
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Documenti non soggetti ad accisa, materiali, brochure, ecc.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
