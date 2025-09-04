// app/dashboard/quotazioni/page.tsx
import Link from 'next/link';
import { ReceiptText, FilePlus2, Clock, CircleDot } from 'lucide-react';

export default function QuotazioniPage() {
  // TODO: sostituire con fetch verso /api/quotazioni quando pronto
  const quotes: Array<{
    id: string;
    ref: string;
    to: string;
    status: 'Bozza' | 'Pubblicato' | 'Accettato' | 'Scaduto' | 'Annullato';
    updatedAt?: string;
  }> = [];

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Quotazioni</h1>
          <p className="text-slate-500 text-sm mt-1">
            Crea preventivi e tieni traccia di quelli inviati ai clienti.
          </p>
        </div>
        <Link
          href="/dashboard/quotazioni/nuova"
          className="inline-flex items-center gap-2 rounded-lg bg-[#1c3e5e] px-3 py-2 text-sm text-white hover:opacity-95"
        >
          <FilePlus2 className="h-4 w-4" />
          Nuova quotazione
        </Link>
      </header>

      {/* Azioni rapide */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-[#f7911e]">Azioni rapide</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/dashboard/quotazioni/nuova"
            className="group rounded-2xl border bg-white p-4 hover:shadow-md transition"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-[#1c3e5e]/10 p-2 text-[#1c3e5e]">
                <ReceiptText className="h-5 w-5" />
              </span>
              <div>
                <div className="font-medium text-slate-900">Crea una nuova quotazione</div>
                <p className="text-sm text-slate-500">Stessi dati della spedizione, ma per un preventivo.</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/spedizioni"
            className="group rounded-2xl border bg-white p-4 hover:shadow-md transition"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-[#1c3e5e]/10 p-2 text-[#1c3e5e]">
                <CircleDot className="h-5 w-5" />
              </span>
              <div>
                <div className="font-medium text-slate-900">Vai alle spedizioni</div>
                <p className="text-sm text-slate-500">Confermate o derivanti da preventivi accettati.</p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Lista quotazioni (empty state per ora) */}
      <section className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#f7911e]">Le mie quotazioni</h3>
          <div className="text-xs text-slate-500 inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            aggiornato adesso
          </div>
        </div>

        {quotes.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-slate-600">
              Non hai ancora creato nessuna quotazione.
            </p>
            <div className="mt-3">
              <Link
                href="/dashboard/quotazioni/nuova"
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-[#1c3e5e] hover:bg-slate-50"
              >
                <FilePlus2 className="h-4 w-4" />
                Crea la prima quotazione
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-2 py-2 font-medium">Riferimento</th>
                  <th className="px-2 py-2 font-medium">Destinazione</th>
                  <th className="px-2 py-2 font-medium">Stato</th>
                  <th className="px-2 py-2 font-medium">Ultimo aggiornamento</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {quotes.map((q) => (
                  <tr key={q.id} className="text-slate-800">
                    <td className="px-2 py-2">{q.ref}</td>
                    <td className="px-2 py-2">{q.to}</td>
                    <td className="px-2 py-2">{q.status}</td>
                    <td className="px-2 py-2">{q.updatedAt || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
