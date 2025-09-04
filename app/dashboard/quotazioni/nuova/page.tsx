// app/dashboard/quotazioni/nuova/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FilePlus2, ArrowLeft } from 'lucide-react';

export default function NuovaQuotazionePage() {
  // Per ora solo placeholder UI (nessun submit verso API)
  const [tipo, setTipo] = useState<'vino' | 'altro'>('vino');
  const [sottotipo, setSottotipo] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Nuova quotazione</h1>
        <Link
          href="/dashboard/quotazioni"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-[#1c3e5e] hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alle quotazioni
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipologia</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'vino' | 'altro')}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
            >
              <option value="vino">Vino</option>
              <option value="altro">Altro</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
            <select
              value={sottotipo}
              onChange={(e) => setSottotipo(e.target.value as 'B2B' | 'B2C' | 'Sample')}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
            >
              <option value="B2B">B2B — azienda</option>
              <option value="B2C">B2C — privato</option>
              <option value="Sample">Sample — campionatura</option>
            </select>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Questa schermata replicherà i campi della spedizione (mittente, destinatario, colli, ritiro, ecc.) ma senza creare la spedizione.
          Per ora è un placeholder così non hai 404 e puoi procedere con il resto del lavoro.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-lg bg-[#1c3e5e] px-3 py-2 text-sm text-white opacity-60 cursor-not-allowed"
            title="In arrivo"
          >
            <FilePlus2 className="h-4 w-4" />
            Salva quotazione
          </button>
          <Link
            href="/dashboard/quotazioni"
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-[#1c3e5e] hover:bg-slate-50"
          >
            Annulla
          </Link>
        </div>
      </div>
    </div>
  );
}
