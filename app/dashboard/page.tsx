// app/dashboard/page.tsx
import Link from 'next/link';
import {
  Package,
  Truck,
  Clock,
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

const stats: Stat[] = [
  { label: 'Spedizioni in corso', value: '12', icon: Truck },
  { label: 'In consegna oggi', value: '3', icon: Package },
  { label: 'Azioni richieste', value: '2', icon: AlertTriangle },
  { label: 'Tempo medio consegna', value: '2,1 gg', icon: Clock },
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

      {/* KPI */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <p className=
