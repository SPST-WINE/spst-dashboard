// components/ShipmentDetail.tsx
'use client';

type Row = { id: string; [k: string]: any };
type Att = { url: string; filename?: string };

const pickStr = (obj: any, names: string[], scanTokens?: string[]) => {
  for (const n of names) {
    const v = obj?.[n];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  if (scanTokens?.length) {
    for (const [k, v] of Object.entries(obj || {})) {
      const key = String(k).toLowerCase();
      if (scanTokens.some(t => key.includes(t)) && typeof v === 'string' && v.trim()) {
        return v.trim();
      }
    }
  }
  return undefined;
};

const pickBool = (obj: any, names: string[]) => {
  for (const n of names) {
    const v = obj?.[n];
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (['true', 'si', 'sì', 'yes', '1'].includes(s)) return true;
      if (['false', 'no', '0'].includes(s)) return false;
    }
  }
  return undefined;
};

const pickAtt = (obj: any, names: string[], tokens: string[]): Att[] => {
  for (const n of names) {
    const v = obj?.[n];
    if (Array.isArray(v) && v.length && v[0]?.url) return v as Att[];
  }
  for (const [k, v] of Object.entries(obj || {})) {
    const key = String(k).toLowerCase();
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

function PartyCard({
  title,
  rs, tel, piva, ind, cap, citta, paese,
}: {
  title: string;
  rs?: string; tel?: string; piva?: string; ind?: string; cap?: string; citta?: string; paese?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs text-slate-500 mb-1">{title}</div>
      <div className="text-sm font-medium">{rs || '-'}</div>
      <div className="mt-1 text-sm text-slate-700">
        {ind || '-'}{cap ? `, ${cap}` : ''}{citta ? ` — ${citta}` : ''}{paese ? `, ${paese}` : ''}
      </div>
      <div className="mt-1 text-xs text-slate-500">Tel: {tel || '-'}</div>
      <div className="text-xs text-slate-500">P.IVA/CF: {piva || '-'}</div>
    </div>
  );
}

export default function ShipmentDetail({ f }: { f: Row }) {
  const idSped =
    f['ID Spedizione'] || f['ID SPST'] || f['ID Spedizione (custom)'] || f.id;

  // Mittente
  const m = {
    rs:   pickStr(f, ['Mittente - Ragione Sociale', 'Mittente']),
    ref:  pickStr(f, ['Mittente - Referente']),
    tel:  pickStr(f, ['Mittente - Telefono', 'Telefono Mittente']),
    piva: pickStr(f, ['Mittente - P.IVA/CF', 'Mittente - PIVA/CF']),
    ind:  pickStr(f, ['Mittente - Indirizzo', 'Indirizzo Mittente']),
    cap:  pickStr(f, ['Mittente - CAP', 'CAP Mittente']),
    citta: pickStr(f, ['Mittente - Città', 'Città Mittente']),
    paese: pickStr(f, ['Mittente - Paese', 'Paese Mittente']),
  };

  // Destinatario
  const d = {
    rs:   pickStr(f, ['Destinatario - Ragione Sociale', 'Destinatario']),
    ref:  pickStr(f, ['Destinatario - Referente']),
    tel:  pickStr(f, ['Destinatario - Telefono', 'Telefono Destinatario']),
    piva: pickStr(f, ['Destinatario - P.IVA/CF', 'Destinatario - PIVA/CF']),
    ind:  pickStr(f, ['Destinatario - Indirizzo']),
    cap:  pickStr(f, ['Destinatario - CAP', 'CAP Destinatario']),
    citta: pickStr(f, ['Destinatario - Città', 'Città Destinatario']),
    paese: pickStr(f, ['Destinatario - Paese', 'Paese Destinatario']),
  };

  // Fatturazione
  const fatt = {
    rs:   pickStr(f, ['FATT Ragione Sociale']),
    ref:  pickStr(f, ['FATT Referente']),
    tel:  pickStr(f, ['FATT Telefono']),
    piva: pickStr(f, ['FATT PIVA/CF', 'FATT PIVA', 'FATT P.IVA/CF']),
    ind:  pickStr(f, ['FATT Indirizzo']),
    cap:  pickStr(f, ['FATT CAP']),
    citta: pickStr(f, ['FATT Città']),
    paese: pickStr(f, ['FATT Paese']),
    sameAsDest: pickBool(f, ['FATT Uguale a Destinatario']),
    delega: pickBool(f, ['Fattura - Delega a SPST', 'Fattura – Delega a SPST', 'Delega Fattura']),
  };

  const dataRitiro = pickStr(f, ['Ritiro - Data', 'Ritiro Data']);
  const incoterm = pickStr(f, ['Incoterm']);
  const tipo = pickStr(f, ['Sottotipo', 'Sottotipo (B2B, B2C, Sample)', 'Tipo spedizione']);

  // Allegati
  const ldv = pickAtt(f, ['LDV', 'Lettera di Vettura', 'AWB'], ['ldv', 'vettura', 'awb', 'lettera']);
  const fattAtt = pickAtt(
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
        <PartyCard title="Mittente" {...m} />
        <PartyCard title="Destinatario" {...d} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="Data ritiro" value={dataRitiro} />
        <Field label="Incoterm" value={incoterm} />
        <Field label="Tipo spedizione" value={tipo} />
      </div>

      {/* Fatturazione + Delega */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <PartyCard title="Fatturazione" {...fatt} />
        </div>
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-slate-500 mb-1">Opzioni fattura</div>
          <div>Uguale a destinatario: <span className="font-medium">{fatt.sameAsDest === true ? 'Sì' : fatt.sameAsDest === false ? 'No' : '-'}</span></div>
          <div>Delega a SPST: <span className="font-medium">{fatt.delega === true ? 'Sì' : fatt.delega === false ? 'No' : '-'}</span></div>
        </div>
      </div>

      {/* Allegati */}
      <div className="rounded-lg border bg-white p-3">
        <div className="text-xs text-slate-500 mb-2">Allegati</div>

        <div className="mb-2">
          <div className="text-xs text-slate-500">Lettera di vettura</div>
          {ldv.length ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {ldv.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                   className="rounded-md border px-3 py-1 text-xs hover:bg-slate-50">
                  {a.filename || `LDV ${i + 1}`}
                </a>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 mt-1">LDV non disponibile</div>
          )}
        </div>

        <div className="mb-2">
          <div className="text-xs text-slate-500">Fattura</div>
          {fattAtt.length ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {fattAtt.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                   className="rounded-md border px-3 py-1 text-xs hover:bg-slate-50">
                  {a.filename || `Fattura ${i + 1}`}
                </a>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 mt-1">Nessuna fattura allegata</div>
          )}
        </div>

        <div>
          <div className="text-xs text-slate-500">Packing List</div>
          {pl.length ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {pl.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                   className="rounded-md border px-3 py-1 text-xs hover:bg-slate-50">
                  {a.filename || `PL ${i + 1}`}
                </a>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 mt-1">Nessuna packing list allegata</div>
          )}
        </div>
      </div>
    </div>
  );
}
