"use client";
import { useState } from "react";

type Doc = { label: string; url: string };
type RecordFields = Record<string, any>;

function pickDocs(f: RecordFields): Doc[] {
  const map: Record<string,string> = {
    "Lettera di Vettura": "Lettera di Vettura",
    "Fattura Proforma": "Fattura Proforma",
    "Dichiarazione Esportazione": "Dichiarazione Esportazione",
    "Packing List": "Packing List",
    "Prior Notice": "Prior Notice",
  };
  const docs: Doc[] = [];
  for (const k of Object.keys(map)) {
    const v = f[k];
    const url = Array.isArray(v) && v[0]?.url ? v[0].url : null;
    if (url) docs.push({ label: map[k], url });
  }
  return docs;
}

export default function ShipmentCard({ f }: { f: RecordFields }) {
  const [open, setOpen] = useState(false);
  const docs = pickDocs(f);
  const id = f["ID Spedizione"] || f.id || "N/A";
  const listaColli = typeof f["Lista Colli Ordinata"] === "string" && f["Lista Colli Ordinata"].trim()
    ? f["Lista Colli Ordinata"].trim()
    : "";

  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="min-w-[240px]">
          <h3 className="text-sm font-semibold">📦 Spedizione {id}</h3>
          <p className="text-sm"><b>Destinatario:</b> {f["Destinatario"] || "N/A"}</p>
          <p className="text-sm"><b>Data ritiro:</b> {f["Data Ritiro"] || "N/A"}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <a
              href="https://wa.me/393519230881"
              className="inline-flex items-center rounded-md bg-[#25D366] px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90"
              target="_blank"
              rel="noreferrer"
            >💬 Supporto WhatsApp</a>

            <button
              onClick={() => setOpen(s => !s)}
              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-gray-50"
              aria-expanded={open}
            >
              <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
              {open ? "Nascondi dettagli" : "Mostra dettagli"}
            </button>
          </div>

          {open && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
              <p><b>Indirizzo:</b> {f["Indirizzo Destinatario"] || "N/A"}, {f["CAP Destinatario"] || ""} {f["Città Destinatario"] || ""}, {f["Paese Destinatario"] || ""}</p>
              <p><b>Telefono:</b> {f["Telefono Destinatario"] || "N/A"}</p>
              <p><b>Incoterm:</b> {f["Incoterm"] || "N/A"}</p>
              <p><b>Tipo spedizione:</b> {f["Tipo Spedizione"] || "N/A"}</p>
              <p className="mt-1"><b>Colli:</b></p>
              {listaColli ? (
                <pre className="whitespace-pre-wrap text-xs">{listaColli}</pre>
              ) : (
                <i className="text-xs">Nessun collo disponibile</i>
              )}
            </div>
          )}
        </div>

        <div className="min-w-[220px]">
          {docs.length ? (
            <div className="flex flex-col items-start gap-1 text-sm">
              {docs.map(d => (
                <a key={d.url} href={d.url} target="_blank" rel="noreferrer" className="text-[#15395C] hover:underline">
                  📎 {d.label}
                </a>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Nessun documento scaricabile</div>
          )}
        </div>
      </div>
    </div>
  );
}
