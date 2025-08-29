"use client";
type RecordFields = Record<string, any>;
type Doc = { label: string; url: string };

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

export default function ShipmentCard({
  f, onOpen,
}: { f: RecordFields; onOpen: () => void }) {
  const id = f["ID Spedizione"] || f.id || "N/A";
  const docs = pickDocs(f);

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
              target="_blank" rel="noreferrer"
              className="inline-flex items-center rounded-md bg-[#25D366] px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >💬 Supporto WhatsApp</a>

            <button
              onClick={onOpen}
              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-gray-50"
            >Apri dettagli ▸</button>
          </div>
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
