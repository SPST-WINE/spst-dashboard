'use client';

import { useEffect, useState } from 'react';

type Att = { url: string; filename?: string; name?: string };
type FMap = Record<string, any>;

function getStr(f: FMap, keys: string[], def = '—') {
  for (const k of keys) {
    const v = f?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return def;
}
function getBool(f: FMap, keys: string[]) {
  for (const k of keys) {
    const v = f?.[k];
    if (typeof v === 'boolean') return v;
    if (v === 'true' || v === '1' || v === 1) return true;
  }
  return false;
}
function getDateStr(f: FMap, keys: string[]) {
  const s = getStr(f, keys, '');
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString(); } catch { return s; }
}

// Attachment grouping
function pickAttachments(f: FMap) {
  const all: { key: string; list: Att[] }[] = [];
  for (const [k, v] of Object.entries(f || {})) {
    if (Array.isArray(v) && v.length && typeof v[0] === 'object' && v[0] && 'url' in v[0]) {
      all.push({ key: k, list: v as Att[] });
    }
  }
  const match = (k: string, re: RegExp) => re.test(k.toLowerCase());
  const ldv = all.find(a => match(a.key, /(ldv|awb|lettera.*vett|waybill)/i))?.list ?? [];
  const fattura = all.find(a => match(a.key, /fattur/i))?.list ?? [];
  const packing = all.find(a => match(a.key, /packing/i))?.list ?? [];
  const known = new Set([...(ldv ?? []), ...(fattura ?? []), ...(packing ?? [])]);
  const altri: Att[] = [];
  for (const a of all) for (const it of a.list) if (!known.has(it)) altri.push(it);
  return { ldv, fattura, packing, altri };
}

type ColloRow = { l?: number | null; w?: number | null; h?: number | null; peso?: number | null };

export default function ShipmentDetail({ f }: { f: FMap }) {
const [colli, setColli] = useState<
  { lunghezza_cm: number | null; larghezza_cm: number | null; altezza_cm: number | null; peso_kg: number | null }[]
>([]);

  const recId = f?.id || f?.['id'];
  useEffect(() => {
  let stop = false;
  (async () => {
    try {
      const r = await fetch(`/api/spedizioni/${f.id}/colli`, { cache: 'no-store' });
      const j = await r.json();
      if (!stop && Array.isArray(j?.rows)) setColli(j.rows);
    } catch {
      if (!stop) setColli([]);
    }
  })();
  return () => { stop = true; };
}, [f.id]);
  
  // Header info
  const id = getStr(f, ['ID Spedizione', 'ID SPST', 'ID Spedizione (custom)']);
  const incoterm = getStr(f, ['Incoterm']);
  const tipo = getStr(f, ['Sottotipo', 'Tipo spedizione', 'Sottotipo (B2B, B2C, Sample)']);
  const dataRitiro = getDateStr(f, ['Ritiro - Data', 'Ritiro Data', 'Data ritiro']);

  // Mittente
  const m_rs   = getStr(f, ['Mittente - Ragione Sociale']);
  const m_ref  = getStr(f, ['Mittente - Referente']);
  const m_tel  = getStr(f, ['Mittente - Telefono']);
  const m_addr = [getStr(f, ['Mittente - Indirizzo',''], ''), getStr(f, ['Mittente - CAP',''], ''),
                  getStr(f, ['Mittente - Città',''], ''), getStr(f, ['Mittente - Paese',''], '')]
                  .filter(Boolean).join(', ') || '—';

  // Destinatario
  const d_rs   = getStr(f, ['Destinatario - Ragione Sociale','Destinatario']);
  const d_ref  = getStr(f, ['Destinatario - Referente']);
  const d_tel  = getStr(f, ['Destinatario - Telefono']);
  const d_addr = [getStr(f, ['Destinatario - Indirizzo',''], ''), getStr(f, ['Destinatario - CAP',''], ''),
                  getStr(f, ['Destinatario - Città',''], ''), getStr(f, ['Destinatario - Paese',''], '')]
                  .filter(Boolean).join(', ') || '—';
  const d_abil = getBool(f, ['Destinatario abilitato import', 'Destinatario abilitato all’import', "Destinatario abilitato all'import"]);

  // Fatturazione
  const f_rs   = getStr(f, ['FATT Ragione Sociale']);
  const f_ref  = getStr(f, ['FATT Referente']);
  const f_tel  = getStr(f, ['FATT Telefono']);
  const f_addr = [getStr(f, ['FATT Indirizzo',''], ''), getStr(f, ['FATT CAP',''], ''),
                  getStr(f, ['FATT Città',''], ''), getStr(f, ['FATT Paese',''], '')]
                  .filter(Boolean).join(', ') || '—';
  const f_piva = getStr(f, ['FATT PIVA/CF','FATT P.IVA/CF','FATT PIVA','FATT P.IVA'], '—');
  const f_same = getBool(f, ['FATT Uguale a Destinatario']);
  const f_delega = getBool(f, ['Fattura - Delega a SPST', 'Fattura – Delega a SPST', 'Delega Fattura']);

  const att = pickAttachments(f);

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-slate-500">ID Spedizione</div>
        <div className="font-medium">{id}</div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-md border p-2">
          <div className="text-xs font-semibold">Mittente</div>
          <div className="text-sm">{m_rs}</div>
          <div className="text-xs text-slate-600">{m_ref !== '—' ? m_ref : ''}</div>
          <div className="text-xs text-slate-600">{m_addr}</div>
          <div className="text-xs">Tel: {m_tel}</div>
        </div>
        <div className="rounded-md border p-2">
          <div className="text-xs font-semibold">Destinatario</div>
          <div className="text-sm">{d_rs}</div>
          <div className="text-xs text-slate-600">{d_ref !== '—' ? d_ref : ''}</div>
          <div className="text-xs text-slate-600">{d_addr}</div>
          <div className="text-xs">Tel: {d_tel}</div>
          <div className="mt-1 text-[11px]">
            Abilitato import:{' '}
            <span className={d_abil ? 'text-green-700' : 'text-slate-600'}>
              {d_abil ? 'Sì' : 'No'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3 text-sm">
        <div className="rounded-md border p-2">
          <div className="text-xs text-slate-500">Data ritiro</div>
          <div>{dataRitiro}</div>
        </div>
        <div className="rounded-md border p-2">
          <div className="text-xs text-slate-500">Incoterm</div>
          <div className="font-medium">{incoterm}</div>
        </div>
        <div className="rounded-md border p-2">
          <div className="text-xs text-slate-500">Tipo spedizione</div>
          <div>{tipo}</div>
        </div>
      </div>

      <div className="rounded-md border p-2">
        <div className="text-xs font-semibold">Fatturazione</div>
        <div className="text-sm">{f_rs}</div>
        <div className="text-xs text-slate-600">{f_ref !== '—' ? f_ref : ''}</div>
        <div className="text-xs text-slate-600">{f_addr}</div>
        <div className="text-xs">P.IVA/CF: {f_piva}</div>
        <div className="mt-1 text-[11px]">
          Uguale a Destinatario:{' '}
          <span className={f_same ? 'text-green-700' : 'text-slate-600'}>
            {f_same ? 'Sì' : 'No'}
          </span>
          {' · '}
          Delega fattura a SPST:{' '}
          <span className={f_delega ? 'text-green-700' : 'text-slate-600'}>
            {f_delega ? 'Sì' : 'No'}
          </span>
        </div>
      </div>

      {/* COLLI */}
      <div className="rounded-lg border p-3">
  <div className="mb-1 text-sm font-medium">Colli</div>
  {colli.length === 0 ? (
    <div className="text-sm text-slate-500">Nessun collo disponibile</div>
  ) : (
    <div className="grid gap-2 md:grid-cols-2">
      {colli.map((c, i) => (
        <div key={i} className="rounded border p-2 text-sm">
          <div className="font-medium mb-1">Collo #{i + 1}</div>
          <div>L × W × H: {c.lunghezza_cm ?? '—'} × {c.larghezza_cm ?? '—'} × {c.altezza_cm ?? '—'} cm</div>
          <div>Peso: {c.peso_kg ?? '—'} kg</div>
        </div>
      ))}
    </div>
  )}
</div>


      {/* ALLEGATI */}
      <div className="rounded-md border p-2 text-sm space-y-2">
        <div className="text-xs font-semibold">Allegati</div>
        <div className="flex flex-wrap gap-2">
          {att.ldv.length ? (
            att.ldv.map((a, i) => (
              <a key={`ldv-${i}`} href={a.url} target="_blank" rel="noopener noreferrer"
                 className="rounded border px-2 py-1 text-xs hover:bg-slate-50">
                Scarica LDV
              </a>
            ))
          ) : (
            <span className="rounded border px-2 py-1 text-xs text-slate-500">LDV non disponibile</span>
          )}

          {att.fattura.map((a, i) => (
            <a key={`fatt-${i}`} href={a.url} target="_blank" rel="noopener noreferrer"
               className="rounded border px-2 py-1 text-xs hover:bg-slate-50">
              Fattura
            </a>
          ))}

          {att.packing.map((a, i) => (
            <a key={`pl-${i}`} href={a.url} target="_blank" rel="noopener noreferrer"
               className="rounded border px-2 py-1 text-xs hover:bg-slate-50">
              Packing List
            </a>
          ))}

          {att.altri.map((a, i) => (
            <a key={`alt-${i}`} href={a.url} target="_blank" rel="noopener noreferrer"
               className="rounded border px-2 py-1 text-xs hover:bg-slate-50">
              Allegato
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
