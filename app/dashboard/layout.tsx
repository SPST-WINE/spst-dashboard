// app/dashboard/layout.tsx
import "@/app/globals.css";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import Protected from "@/components/Protected";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <div className="min-h-screen grid md:grid-cols-12">
        <aside className="md:col-span-2 border-r p-4">
          <Sidebar />
        </aside>
        <main className="md:col-span-10">
          <Topbar />
          <div className="p-6">{children}</div>
        </main>
      </div>
    </Protected>
  );
}

// app/dashboard/layout.tsx
import AppSidebar from '@/components/AppSidebar';
import AppTopbar from '@/components/AppTopbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <AppSidebar />
      <div className="flex min-h-screen flex-col">
        <AppTopbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

// components/ShipmentCard.tsx
import Link from 'next/link';
import { Package, User2, CalendarDays, FileDown } from 'lucide-react';

type Props = {
  data: {
    id: string;
    fields: {
      ID?: string;
      Destinatario?: string;
      DataRitiro?: string;
      LetteraDiVetturaURL?: string;
      ProformaURL?: string;
      DLEURL?: string;
      Stato?: string;
    };
  };
};

export default function ShipmentCard({ data }: Props) {
  const f = data.fields ?? {};
  const docLinks = [
    { label: 'Lettera di Vettura', href: f.LetteraDiVetturaURL },
    { label: 'Proforma+Packing', href: f.ProformaURL },
    { label: 'DLE', href: f.DLEURL },
  ].filter(d => !!d.href) as { label: string; href: string }[];

  return (
    <div className="group rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg border bg-slate-50 p-2">
            <Package className="h-5 w-5 text-slate-700" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Spedizione</div>
            <div className="text-base font-semibold tracking-tight">
              {f.ID || data.id}
            </div>

            <div className="mt-2 grid gap-1 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <User2 className="h-4 w-4" />
                <span className="font-medium">Destinatario:</span>
                <span className="text-slate-800">{f.Destinatario || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarDays className="h-4 w-4" />
                <span className="font-medium">Data ritiro:</span>
                <span className="text-slate-800">{f.DataRitiro || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {docLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {docLinks.map(d => (
                <a
                  key={d.label}
                  href={d.href}
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-slate-50"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  {d.label}
                </a>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <a
              href={process.env.NEXT_PUBLIC_WHATSAPP_LINK}
              target="_blank"
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Supporto WhatsApp
            </a>
            <Link
              href={`/dashboard/spedizioni/${data.id}`}
              className="rounded-md border px-3 py-1.5 text-xs hover:bg-slate-50"
            >
              Apri dettagli →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

