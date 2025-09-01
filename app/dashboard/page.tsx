// app/dashboard/page.tsx
import Link from 'next/link';
import {
  Package,
  Truck,
  AlertTriangle,
  FileText,
  HelpCircle,
  PlusCircle,
  Boxes,
  ArrowRight,
  Calendar,
} from 'lucide-react';

type Stat = { label: string; value: string; icon: React.ElementType };
type Shipment = {
  id: string;
  ref: string;
  to: string;
  eta: string;
  status: 'in_transito' | 'in_consegna' | 'consegnata' | 'azione_richiesta';
};

// 3 KPI (tempo medio rimosso)
const stats: Stat[] = [
  { label: 'Spedizioni in corso', value: '12', icon: Truck },
  { label: 'In consegna oggi', value: '3', icon: Package },
  { label: 'Azioni richieste', value: '2', icon: AlertTriangle },
];

const recent: Shipment[] = [
  { id: '1', ref: 'SPST-24081', to: 'Berlino (DE)', eta: 'Oggi', status: 'in_consegna' },
  { id: '2', ref: 'SPST-24080', to: 'Parigi (FR)', eta: 'Domani', status: 'in_transito' },
  { id: '3', ref: 'SPST-24079', to: 'Milano (IT)', eta: '—', status: 'consegnata' },
  { id: '4', ref: 'SPST-24078', to: 'Londra (UK)', eta: '—', status: 'azione_richiesta' },
];

function StatusBadge({ s }: { s: Shipment['status'] }) {
  const map: Record<Shipment['status'], { text: string; cls: string }> = {
    in_transito: { text: 'In transito', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
    in_consegna: { text: 'In consegna', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    consegnata: { text: 'Consegnata', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    azione_richiesta: { text: 'Azione richiesta', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${map[s].cls}`}>
      {map[s].text}
    </span>
  );
}

export default function DashboardOverview() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">
          Riepilogo account, azioni rapide e ultime attività.
        </p>
      </header>

      {/* KPI (3 card) */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#1c3e5e]/10 text-[#1c3e5e]">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
                  <div className="text-xl font-semibold text-slate-900">{value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Azioni rapide */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-[#f7911e]">Azioni rapide</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/dashboard/nuova/vino"
            className="group rounded-2xl border bg-white p-4 hover:shadow-md transition"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-[#1c3e5e]/10 p-2 text-[#1c3e5e]">
                <PlusCircle className="h-5 w-5" />
              </span>
              <div>
                <div className="font-medium text-slate-900">Spedizione vino</div>
                <p className="text-sm text-slate-500">Dati completi, fatture e packing list.</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/nuova/altro"
            className="group rounded-2xl border bg-white p-4 hover:shadow-md transition"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-[#1c3e5e]/10 p-2 text-[#1c3e5e]">
                <Boxes className="h-5 w-5" />
              </span>
              <div>
                <div className="font-medium text-slate-900">Altre spedizioni</div>
                <p className="text-sm text-slate-500">Materiali, brochure e non accise.</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/informazioni-utili"
            className="group rounded-2xl border bg-white p-4 hover:shadow-md transition"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-[#1c3e5e]/10 p-2 text-[#1c3e5e]">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <div className="font-medium text-slate-900">Documenti utili</div>
                <p className="text-sm text-slate-500">Guide pallet/pacchi, compliance e FAQ.</p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Ultime spedizioni + Compliance */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Tabella */}
        <div className="rounded-2xl border bg-white p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-[#f7911e]">Ultime spedizioni</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-2 py-2 font-medium">Riferimento</th>
                  <th className="px-2 py-2 font-medium">Destinazione</th>
                  <th className="px-2 py-2 font-medium">ETA</th>
                  <th className="px-2 py-2 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recent.map((r) => (
                  <tr key={r.id} className="text-slate-800">
                    <td className="px-2 py-2">{r.ref}</td>
                    <td className="px-2 py-2">{r.to}</td>
                    <td className="px-2 py-2">{r.eta}</td>
                    <td className="px-2 py-2">
                      <StatusBadge s={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-right">
            <Link
              href="/dashboard/spedizioni"
              className="inline-flex items-center gap-1 text-[#1c3e5e] hover:underline"
            >
              Vedi tutte <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Compliance / To-do */}
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#f7911e]">Compliance / To-do</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
              <div>
                Completa <span className="font-medium">dichiarazione libera esportazione</span>{' '}
                per SPST-24078.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 text-sky-600" />
              <div>
                Carica <span className="font-medium">fattura proforma</span> per le spedizioni Extra-UE.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <HelpCircle className="mt-0.5 h-4 w-4 text-slate-500" />
              <div>
                Dubbi sulle accise? Vedi{' '}
                <Link href="/dashboard/informazioni-utili" className="text-[#1c3e5e] underline">
                  Documenti utili
                </Link>
                .
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Ritiri + Supporto */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#f7911e]">Ritiri programmati</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#1c3e5e]" />
                <span>12 settembre 2025 – Milano (IT)</span>
              </div>
              <span className="text-xs text-slate-500">Fascia 14-17</span>
            </li>
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#1c3e5e]" />
                <span>13 settembre 2025 – Siena (IT)</span>
              </div>
              <span className="text-xs text-slate-500">Fascia 9-12</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#f7911e]">Supporto</h3>
          <p className="text-sm text-slate-600">
            Hai bisogno di aiuto? Siamo a disposizione per domande su compliance, documenti e tracking.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {/* stessa misura (padding) per entrambi i bottoni */}
            <Link
              href="/dashboard/informazioni-utili"
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-[#1c3e5e] hover:bg-slate-50"
            >
              <FileText className="h-4 w-4" />
              Documenti utili
            </Link>
            <Link
              href="https://wa.me/393204662570"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg bg-[#f7911e] px-3 py-2 text-sm text-white hover:opacity-95"
            >
              <HelpCircle className="h-4 w-4" />
              WhatsApp
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
