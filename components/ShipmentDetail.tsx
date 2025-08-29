"use client";
export default function ShipmentDetail({ f }: { f: Record<string, any> }) {
  const id = f["ID Spedizione"] || f.id || "N/A";
  const colli = typeof f["Lista Colli Ordinata"] === "string" && f["Lista Colli Ordinata"].trim()
    ? f["Lista Colli Ordinata"].trim()
    : "";

  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className="text-xs text-gray-500">ID Spedizione</div>
        <div className="font-semibold">{id}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-lg border p-3">
          <div className="font-medium mb-1">Mittente</div>
          <div>{f["Mittente"] || "-"}</div>
          <div>{f["Indirizzo Mittente"] || "-"} {f["CAP Mittente"] || ""} {f["Città Mittente"] || ""} {f["Paese Mittente"] || ""}</div>
          <div>Tel: {f["Telefono Mittente"] || "-"}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="font-medium mb-1">Destinatario</div>
          <div>{f["Destinatario"] || "-"}</div>
          <div>{f["Indirizzo Destinatario"] || "-"} {f["CAP Destinatario"] || ""} {f["Città Destinatario"] || ""} {f["Paese Destinatario"] || ""}</div>
          <div>Tel: {f["Telefono Destinatario"] || "-"}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded-lg border p-3"><div className="text-xs text-gray-500">Data ritiro</div>{f["Data Ritiro"] || "-"}</div>
        <div className="rounded-lg border p-3"><div className="text-xs text-gray-500">Incoterm</div>{f["Incoterm"] || "-"}</div>
        <div className="rounded-lg border p-3"><div className="text-xs text-gray-500">Tipo spedizione</div>{f["Tipo Spedizione"] || "-"}</div>
      </div>

      <div className="rounded-lg border p-3">
        <div className="font-medium mb-1">Colli</div>
        {colli ? <pre className="whitespace-pre-wrap text-xs">{colli}</pre> : <i className="text-xs">Nessun collo disponibile</i>}
      </div>
    </div>
  );
}
