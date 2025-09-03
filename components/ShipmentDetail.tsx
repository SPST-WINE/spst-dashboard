// components/ShipmentDetail.tsx
'use client';

type Row = { id: string; [k: string]: any };
type Att = { url: string; filename?: string };

const pick = (obj: any, keys: string[], fallbackScan?: (o: any) => string | undefined) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return fallbackScan ? fallbackScan(obj) : undefined;
};

const pickAtt = (obj: any, names: string[], tokens: string[]): Att[] => {
  for (const n of names) {
    const v = obj?.[n];
    if (Array.isArray(v) && v.length && v[0]?.url) return v as Att[];
  }
  // scan generico
  for (const [k, v] of Object.entries(obj)) {
    const key = k.toLowerCase();
    if (tokens.some(t => key.includes(t)) && Array.isArray(v) && v.length && v[0]?.url) {
      return v as Att[];
    }
  }
  return [];
};

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm">{value || '-'}</div>
    </div>
  );
}

export default function ShipmentDetail({ f }: { f: Row }) {
  const idSped =
    f['ID Spedizione'] || f['ID SPST'] || f['ID Spedizione (custom)'] || f.id;

  const mRS = pick(f, ['Mittente - Ragione Sociale', 'Mittente']);
  const mTel = pick(f, ['Mittente - Telefono', 'Telefono Mittente']);
  const dRS = pick(f, ['Destinatario - Ragione Sociale', 'Destinatario']);
  const dTel = pick(f, ['Destinatario - Telefono', 'Telefono Destinatario']);

  const dataRitiro = pick(f, ['Ritiro - Data', 'Ritiro Data']);
  const incoterm = pick(f, ['Incoterm']);
  const tipo = pick(f, ['Sottotipo', 'Sottotipo (B2B, B2C, Sample)', 'Tipo spedizione']);

  const colliCount =
    f['#'] || f['Colli'] || f['Numero colli'] || f['N° colli'] || '';

  const ldv = pickAtt(f, ['LDV', 'Lettera di Vettura', 'AWB'], ['ldv', 'vettura', 'awb', 'lettera']);
  const fatt = pickAtt(
    f,
    ['Fattura - Allegato Cliente', 'Fattura – Allegato Cliente', 'Fattura', 'Invoice'],
    ['fatt', 'invoice']
  );
  const pl = pickAtt(
    f,
    ['Packing List - Allegato Cliente', 'Packing List', 'PL - Allegato Cliente'],
    ['packing', 'pl']
  );

  return (
    <div className="space-y-3 text-sm">
      <div>
        <div className="text-xs text-slate-500">ID Spedizione</div>
        <div className="font-mono">{idSped}</div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-slate-500 mb-1">Mittente</div>
          <div>{mRS || '-'}</div>
          <div className="text-xs text-slate-500 mt-1">Tel: {mTel || '-'}</div>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-slate-500 mb-1">Destinatario</div>
          <div>{dRS || '-'}</div>
          <div className="text-xs text-slate-500 mt-1">Tel: {dTel || '-'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="Data ritiro" value={dataRitiro} />
        <Field label="Incoterm" value={incoterm} />
        <Field label="Tipo spedizione" value={tipo} />
      </div>

      <div className="rounded-lg border bg-white p-3">
        <div className="text-xs text-slate-500 mb-1">Colli</div>
        <div className="italic text-slate-600">
          {colliCount ? `${colliCount} colli` : 'Nessun collo disponibile'}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-3">
        <div className="text-xs text-slate-500 mb-2">Allegati</div>
        <div className="flex flex-wrap items-center gap-2">
          {ldv.length ? (
            <a
              href={ldv[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border px-3 py-1 text-xs hover:bg-slate-50"
            >
              Scarica LDV
            </a>
          ) : (
            <span className="rounded-md border px-3 py-1 text-xs text-slate-500">
              LDV non disponibile
            </span>
          )}

          {fatt.length > 0 && (
            <a
              href={fatt[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border px-3 py-1 text-xs hover:bg-slate-50"
            >
              Fattura{fatt.length > 1 ? ` (${fatt.length})` : ''}
            </a>
          )}

          {pl.length > 0 && (
            <a
              href={pl[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border px-3 py-1 text-xs hover:bg-slate-50"
            >
              Packing List{pl.length > 1 ? ` (${pl.length})` : ''}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
