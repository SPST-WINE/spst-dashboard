// app/dashboard/page.tsx
import Link from "next/link";
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
} from "lucide-react";

import { listSpedizioni } from "@/lib/airtable";
import { F } from "@/lib/airtable.schema";
import { format, isToday } from "date-fns";
import { it } from "date-fns/locale";

// ------- helpers locali -------
function norm(val?: string | null) {
  return (val || "").toString().trim();
}

// Costruisce l'URL pubblico di tracking sul sito del corriere
function buildTrackingUrl(carrier?: string | null, code?: string | null) {
  const c = norm(carrier).toLowerCase();
  const n = norm(code);
  if (!c || !n) return null;

  if (c.includes("dhl")) return `https://www.dhl.com/track?tracking-number=${encodeURIComponent(n)}`;
  if (c.includes("ups")) return `https://www.ups.com/track?loc=it_IT&tracknum=${encodeURIComponent(n)}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`;
  if (c.includes("tnt")) return `https://www.tnt.com/express/it_it/site/shipping-tools/tracking.html?cons=${encodeURIComponent(n)}`;
  if (c.includes("gls")) return `https://gls-group.com/track?match=${encodeURIComponent(n)}`;
  if (c.includes("brt")) return `https://vas.brt.it/vas/sped_numspe_par.htm?sped_num=${encodeURIComponent(n)}`;
  if (c.includes("poste")) return `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${encodeURIComponent(n)}`;
  if (c.includes("sda")) return `https://www.sda.it/wps/portal/Servizi_online/ricerca_spedizioni?locale=it&tracing-codes=${encodeURIComponent(n)}`;

  return null; // Privato/altro → nessun link pubblico
}

// Stati considerati "attivi / in corso"
const ACTIVE_STATES = new Set([
  "In elaborazione",
  "In transito",
  "In consegna",
  // eventuali normalizzazioni alternative se in tabella usi inglese:
  "Pending",
  "InfoReceived",
  "InTransit",
  "OutForDelivery",
  "Exception",
  "FailedAttempt",
  "Unknown",
]);

// ------- Page (Server Component) -------
export default async function DashboardOverview() {
  // Legge tutte le spedizioni (id + fields)
  const rows: any[] = await listSpedizioni();

  // KPI
  const inCorso = rows.filter((r) => ACTIVE_STATES.has(norm(r.fields["Stato"] || r.fields["Tracking Status"]))).length;

  const inConsegnaOggi = rows.filter((r) => {
    const stato = norm(r.fields["Stato"] || r.fields["Tracking Status"]);
    const etaStr = r.fields["ETA"];
    const eta = etaStr ? new Date(etaStr) : null;
    return stato === "In consegna" || (eta && isToday(eta));
  }).length;

  const kpi = [
    { label: "Spedizioni in corso", value: String(inCorso), icon: Truck },
    { label: "In consegna oggi", value: String(inConsegnaOggi), icon: Package },
    { label: "Azioni richieste", value: "0", icon: AlertTriangle }, // se hai una logica dedicata, sostituisci
  ] as const;

  // Area Tracking: ultime 10 spedizioni attive con link al corriere
  const trackingItems = rows
    .filter((r) => ACTIVE_STATES.has(norm(r.fields["Stato"] || r.fields["Tracking Status"])))
    .slice(0, 10)
    .map((r) => {
      const ref = r.fields["ID Spedizione"] || r.id;
      const city = r.fields["Destinatario - Città"] || "";
      const country = r.fields["Destinatario - Paese"] || "";
      const etaStr = r.fields["ETA"];
      const eta = etaStr ? format(new Date(etaStr), "d MMM", { locale: it }) : "—";
      const stato = r.fields["Tracking Status"] || r.fields["Stato"] || "—";

      // Il campo Corriere su Airtable (single select) può arrivare come {name: "..."} oppure stringa
      const carrier =
        (typeof r.fields[F.Corriere] === "object" && r.fields[F.Corriere]?.name) ||
        r.fields[F.Corriere] ||
        null;

      const code = r.fields[F.TrackingNumber] || null;
      const url = r.fields[F.TrackingURL] || buildTrackingUrl(carrier, code);

      return {
        id: r.id,
        ref,
        dest: [city, country].filter(Boolean).join(" (") + (country ? ")" : ""),
        eta,
        stato,
        url,
      };
    });

  // Ritiri programmati: prendi prossimi 5 da "Ritiro - Data"
  const ritiri = rows
    .map((r) => {
      const d = r.fields["Ritiro - Data"] ? new Date(r.fields["Ritiro - Data"]) : null;
      const city = r.fields["Destinatario - Città"] || "";
      const country = r.fields["Destinatario - Paese"] || "";
      return { id: r.id, date: d, city, country };
    })
    .filter((r) => r.date && r.date >= new Date(new Date().toDateString()))
    .sort((a, b) => a.date!.getTime() - b.date!.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">
          Riepilogo account, azioni rapide e tracking.
        </p>
      </header>

      {/* KPI (3 card) */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpi.map(({ label, value, icon: Icon }) => (
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

      {/* Area tracking + Ritiri programmati */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* AREA TRACKING (sostituisce 'Ultime spedizioni' + 'Compliance/To-do') */}
        <div className="rounded-2xl border bg-white p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-[#f7911e]">Tracking spedizioni</h3>
          {trackingItems.length === 0 ? (
            <p className="text-sm text-slate-500">Nessuna spedizione in corso.</p>
          ) : (
            <div className="divide-y">
              {trackingItems.map((row) => (
                <div key={row.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{row.ref}</div>
                    <div className="text-sm text-slate-500">
                      {row.dest || "—"} · ETA {row.eta} · {row.stato}
                    </div>
                  </div>
                  {row.url ? (
                    <a
                      className="inline-flex items-center gap-1 text-[#1c3e5e] hover:underline text-sm"
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Apri tracking <ArrowRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400">N/D</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 text-right">
            <Link
              href="/dashboard/spedizioni"
              className="inline-flex items-center gap-1 text-[#1c3e5e] hover:underline text-sm"
            >
              Vedi tutte <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* RITIRI PROGRAMMATI (mantieni) */}
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#f7911e]">Ritiri programmati</h3>
          {ritiri.length === 0 ? (
            <p className="text-sm text-slate-500">Nessun ritiro programmato.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {ritiri.map((r) => (
                <li key={r.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#1c3e5e]" />
                    <span>{format(r.date!, "d MMMM yyyy", { locale: it })} – {r.city} {r.country ? `(${r.country})` : ""}</span>
                  </div>
                  {/* Se hai una fascia oraria in tabella puoi stamparla qui */}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Supporto */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#f7911e]">Supporto</h3>
          <p className="text-sm text-slate-600">
            Hai bisogno di aiuto? Siamo a disposizione per domande su compliance, documenti e tracking.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
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
        <div className="rounded-2xl border bg-white p-4">
          {/* spazio libero per un widget futuro (es. scorciatoie o note) */}
        </div>
      </section>
    </div>
  );
}
