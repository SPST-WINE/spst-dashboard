import Link from 'next/link';
import { Package, User2, CalendarDays, FileDown, ChevronRight } from 'lucide-react';

type ShipmentFields = {
  ID?: string;
  Destinatario?: string;
  DataRitiro?: string;
  LetteraDiVetturaURL?: string;
  ProformaURL?: string;
  DLEURL?: string;
  Stato?: string;
};

type AirtableRecord = { id: string; fields: ShipmentFields };

type Props = { data?: AirtableRecord; f?: any; onOpen?: () => void };

function normalizeProps(props: Props): { rec: AirtableRecord; onOpen?: () => void } {
  if (props.data) return { rec: props.data, onOpen: props.onOpen };
  const legacy = props.f ?? {};
  const id =
    legacy.id ||
    legacy.ID ||
    legacy['ID'] ||
    legacy['ID Spedizione'] ||
    legacy['Id Spedizione'] ||
    '';
  const fields: ShipmentFields =
    legacy.fields ??
    ({
      ID: legacy.ID || legacy['ID'] || legacy['ID Spedizione'] || id,
      Destinatario: legacy.Destinatario || legacy['Destinatario'],
      DataRitiro: legacy.DataRitiro || legacy['Data Ritiro'] || legacy['Data ritiro'],
      LetteraDiVetturaURL: legacy.LetteraDiVetturaURL || legacy['Lettera di Vettura'],
      ProformaURL: legacy.ProformaURL || legacy['Proforma+Packing'],
      DLEURL: legacy.DLEURL || legacy['DLE'],
      Stato: legacy.Stato || legacy['Stato'],
    } as ShipmentFields);
  return { rec: { id, fields }, onOpen: props.onOpen };
}

export default function ShipmentCard(props: Props) {
  const { rec, onOpen } = normalizeProps(props);
  const f = rec.fields ?? {};

  const docLinks = [
    { label: 'Lettera di Vettura', href: f.LetteraDiVetturaURL },
    { label: 'Proforma+Packing', href: f.ProformaURL },
    { label: 'DLE', href: f.DLEURL },
  ].filter((d) => !!d.href) as { label: string; href: string }[];

  return (
    <div className="group rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg border bg-slate-50 p-2">
            <Package className="h-5 w-5 text-slate-700" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Spedizione</div>
            <div className="text-base font-semibold tracking-tight">{f.ID || rec.id || '—'}</div>

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

        {/* Azioni: allegati + Apri dettagli (stessa dimensione) */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {docLinks.map((d) => (
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
            {onOpen ? (
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-slate-50"
              >
                <ChevronRight className="h-3.5 w-3.5" />
                Apri dettagli
              </button>
            ) : (
              <Link
                href={`/dashboard/spedizioni/${rec.id}`}
                className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-slate-50"
              >
                <ChevronRight className="h-3.5 w-3.5" />
                Apri dettagli
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
