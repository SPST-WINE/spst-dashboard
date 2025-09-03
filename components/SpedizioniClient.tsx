'use client';

import { useEffect, useMemo, useState } from 'react';
import { getIdToken } from '@/lib/firebase-client-auth';
import Drawer from '@/components/Drawer';
import ShipmentDetail from '@/components/ShipmentDetail';

type Row = { id: string; [k: string]: any };
type Att = { url: string; filename?: string };

const ATT_FIELDS = {
  LDV: ['LDV', 'Lettera di Vettura', 'Lettera di vettura', 'AWB'],
  FATT: ['Fattura - Allegato Cliente', 'Fattura – Allegato Cliente', 'Fattura Cliente', 'Fattura', 'Invoice'],
  PL: ['Packing List - Allegato Cliente', 'Packing List', 'PL - Allegato Cliente'],
};

function getDisplayId(r: Row) {
  return (
    r['ID Spedizione'] ||
    r['ID SPST'] ||
    r['ID Spedizione (custom)'] ||
    r.id
  );
}

function isAttArray(v: any): v is Att[] {
  return Array.isArray(v) && v.length > 0 && typeof v[0]?.url === 'string';
}

// tenta lista nomi, altrimenti fa una scansione “furba” di tutte le chiavi
function pickAttSmart(r: Row, preferredNames: string[], fallbackTokens: string[]): Att[] {
  for (const n of preferredNames) {
    const v = r?.[n];
    if (isAttArray(v)) return v;
  }
  // scan di tutti i campi: cerca chiavi che contengono i token e con allegati
  const entries = Object.entries(r);
  for (const [k, v] of entries) {
    const key = String(k).toLowerCase();
    if (fallbackTokens.some(tok => key.includes(tok)) && isAttArray(v)) {
      return v;
    }
  }
  return [];
}

export default function SpedizioniClient() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<Row | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const emailLS =
          (typeof window !== 'undefined' && localStorage.getItem('userEmail')?.trim()) || '';
        const token = await getIdToken().catch(() => undefined);

        const url = emailLS
          ? `/api/spedizioni?email=${encodeURIComponent(emailLS)}`
          : `/api/spedizioni`;

        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const j = await res.json();
        const list: Row[] = Array.isArray(j?.rows)
          ? j.rows
          : Array.isArray(j?.data)
          ? j.data
          : Array.isArray(j)
          ? j
          : [];

        if (!cancelled) setRows(list);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Errore di caricamento');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return rows;

    const pick = (r: Row, keys: string[]) =>
      keys
        .map((kk) => String(r?.[kk] ?? '').toLowerCase())
        .find((s) => s);

    return rows.filter((r) => {
      const id = String(getDisplayId(r)).toLowerCase();
      const dRS = pick(r, ['Destinatario - Ragione Sociale', 'Destinatario']) || '';
      const dCity = pick(r, ['Destinatario - Città', 'Città Destinatario']) || '';
      const dCountry = pick(r, ['Destinatario - Paese', 'Paese Destinatario']) || '';
      return id.includes(k) || dRS.includes(k) || dCity.includes(k) || dCountry.includes(k);
    });
  }, [rows, q]);

  if (err) return <div className="text-sm text-rose-700">Errore: {err}</div>;

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <input
          placeholder="Cerca per ID, destinatario, città, paese…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-xl rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
        />
        <div className="text-sm text-slate-500">
          {loading ? 'Caricamento…' : `${filtered.length} risultati`}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Recupero spedizioni…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-slate-500">0 risultati</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => {
            const id = getDisplayId(r);
            const stato = r['Stato'] || '—';
            const destRS = r['Destinatario - Ragione Sociale'] || r['Destinatario'] || '—';
            const destCity = r['Destinatario - Città'] || r['Città Destinatario'] || '';
            const destCountry = r['Destinatario - Paese'] || r['Paese Destinatario'] || '';
            const ritiro = r['Ritiro - Data'] || r['Ritiro Data'] || '—';

            // Allegati: smart pick
            const ldv = pickAttSmart(r, ATT_FIELDS.LDV, ['ldv', 'vettura', 'awb', 'lettera']);
            const fatt = pickAttSmart(r, ATT_FIELDS.FATT, ['fatt', 'invoice']);
            const pl = pickAttSmart(r, ATT_FIELDS.PL, ['packing', 'pl']);

            return (
              <div key={r.id} className="rounded-xl border bg-white p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-mono font-medium">{id}</div>
                  <div className="rounded-md border px-2 py-0.5 text-xs">{stato}</div>
                </div>

                <div className="mt-2 text-slate-700">
                  <span className="text-slate-500">Destinatario: </span>
                  {destRS}
                  {destCity ? ` — ${destCity}` : ''}
                  {destCountry ? `, ${destCountry}` : ''}
                </div>

                <div className="mt-1 text-slate-700">
                  <span className="text-slate-500">Ritiro: </span>
                  {ritiro}
                </div>

                {/* Allegati */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
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

                  <button
                    type="button"
                    onClick={() => setSelected(r)}
                    className="ml-auto rounded-md border px-3 py-1 text-xs hover:bg-slate-50"
                  >
                    Mostra dettagli
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Dettagli spedizione">
        {selected && <ShipmentDetail f={selected} />}
      </Drawer>
    </>
  );
}
