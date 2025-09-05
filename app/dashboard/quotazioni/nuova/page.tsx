// app/dashboard/quotazioni/nuova/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import { getIdToken } from '@/lib/firebase-client-auth';
import { getUserProfile } from '@/lib/api';

type TipoSped = 'B2B' | 'B2C' | 'Sample';
type Incoterm = 'DAP' | 'DDP' | 'EXW';

const blankParty: Party = {
  ragioneSociale: '',
  referente: '',
  paese: '',
  citta: '',
  cap: '',
  indirizzo: '',
  telefono: '',
  piva: '',
};

export default function NuovaQuotazionePage() {
  const topRef = useRef<HTMLDivElement>(null);

  // email (dal profilo)
  const [email, setEmail] = useState<string>('');

  // Parti
  const [mittente, setMittente] = useState<Party>(blankParty);
  const [destinatario, setDestinatario] = useState<Party>(blankParty);

  // Colli / dettagli merce
  const [colli, setColli] = useState<Collo[]>([
    { lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null },
  ]);
  const [formato, setFormato] = useState<'Pacco' | 'Pallet'>('Pacco');
  const [contenuto, setContenuto] = useState<string>('');

  // Ritiro
  const [ritiroData, setRitiroData] = useState<Date | undefined>(undefined);
  const [ritiroNote, setRitiroNote] = useState('');

  // Selettori business
  const [tipoSped, setTipoSped] = useState<TipoSped>('B2B');
  const [incoterm, setIncoterm] = useState<Incoterm>('DAP');

  // Note generiche
  const [noteGeneriche, setNoteGeneriche] = useState('');

  // UI
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [okId, setOkId] = useState<string | null>(null); // recId Airtable
  const [okDisplayId, setOkDisplayId] = useState<string | null>(null); // ID_Preventivo formula

  // Prefill mittente da profilo & email utente
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getUserProfile(getIdToken);
        if (!cancelled && r?.ok) {
          if (r.email) setEmail(r.email);
          if (r.party) {
            setMittente((prev) => ({ ...prev, ...r.party }));
          }
        }
      } catch {
        // Ignora, utente compila a mano
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Validazione minima per la quotazione
  function validate(): string[] {
    const errs: string[] = [];
    if (!mittente.ragioneSociale?.trim()) errs.push('Inserisci la ragione sociale del mittente.');
    if (!destinatario.ragioneSociale?.trim()) errs.push('Inserisci la ragione sociale del destinatario.');
    if (!ritiroData) errs.push('Seleziona il giorno di ritiro.');
    // Almeno un collo completo
    const invalid = colli.some(
      (c) =>
        c.lunghezza_cm == null ||
        c.larghezza_cm == null ||
        c.altezza_cm == null ||
        c.peso_kg == null ||
        (c.lunghezza_cm ?? 0) <= 0 ||
        (c.larghezza_cm ?? 0) <= 0 ||
        (c.altezza_cm ?? 0) <= 0 ||
        (c.peso_kg ?? 0) <= 0,
    );
    if (invalid) errs.push('Inserisci misure e pesi > 0 per ogni collo.');
    return errs;
  }

  async function salva() {
    if (saving) return;
    const v = validate();
    if (v.length) {
      setErrors(v);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    } else {
      setErrors([]);
    }

    setSaving(true);
    try {
      const t = await getIdToken();

      // Mappatura verso API /api/quotazioni (airtable.quotes)
      const payload = {
        createdByEmail: email || undefined,
        customerEmail: email || undefined, // popola Email_Cliente
        valuta: 'EUR' as const,
        ritiroData: ritiroData ? ritiroData.toISOString() : undefined,
        noteGeneriche: noteGeneriche || undefined,
        tipoSped, // 'B2B' | 'B2C' | 'Sample'
        incoterm, // 'DAP' | 'DDP' | 'EXW'
        mittente: {
          ragioneSociale: mittente.ragioneSociale || undefined,
          indirizzo: mittente.indirizzo || undefined,
          cap: mittente.cap || undefined,
          citta: mittente.citta || undefined,
          paese: mittente.paese || undefined,
          telefono: mittente.telefono || undefined,
          taxId: mittente.piva || undefined, // -> Mittente_Tax
        },
        destinatario: {
          ragioneSociale: destinatario.ragioneSociale || undefined,
          indirizzo: destinatario.indirizzo || undefined,
          cap: destinatario.cap || undefined,
          citta: destinatario.citta || undefined,
          paese: destinatario.paese || undefined,
          telefono: destinatario.telefono || undefined,
          taxId: destinatario.piva || undefined, // -> Destinatario_Tax
        },
        colli: (colli || []).map((c) => ({
          qty: 1,
          l1_cm: c.lunghezza_cm ?? undefined,
          l2_cm: c.larghezza_cm ?? undefined,
          l3_cm: c.altezza_cm ?? undefined,
          peso_kg: c.peso_kg ?? undefined,
        })),
      };

      const res = await fetch('/api/quotazioni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'SERVER_ERROR');

      setOkId(j.id as string);
      setOkDisplayId((j.displayId as string) ?? null);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      console.error('Errore creazione preventivo', e);
      setErrors(['Errore durante la creazione della quotazione. Riprova.']);
    } finally {
      setSaving(false);
    }
  }

  // Success UI (riepilogo completo)
  if (okId) {
    const fmtDate =
      ritiroData ? ritiroData.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

    return (
      <div ref={topRef} className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-800">Quotazione inviata</h1>

        <div className="rounded-2xl border bg-white p-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm text-slate-500">ID Preventivo</div>
              <div className="font-mono text-base">{okDisplayId || '—'}</div>
              <div className="text-xs text-slate-400">Record: {okId}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500">Tipo spedizione</div>
                <div className="font-medium">{tipoSped}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Incoterm</div>
                <div className="font-medium">{incoterm}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Data ritiro</div>
                <div className="font-medium">{fmtDate}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Colli</div>
                <div className="font-medium">
                  {colli.length} ({formato})
                </div>
              </div>
            </div>
          </div>

          {/* Colli - dimensioni/peso */}
          <div className="mt-6">
            <div className="mb-2 text-sm font-semibold text-spst-blue">Dettaglio colli</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">#</th>
                    <th className="py-2 pr-4">L (cm)</th>
                    <th className="py-2 pr-4">W (cm)</th>
                    <th className="py-2 pr-4">H (cm)</th>
                    <th className="py-2 pr-4">Peso (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {colli.map((c, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 pr-4">{i + 1}</td>
                      <td className="py-2 pr-4">{c.lunghezza_cm}</td>
                      <td className="py-2 pr-4">{c.larghezza_cm}</td>
                      <td className="py-2 pr-4">{c.altezza_cm}</td>
                      <td className="py-2 pr-4">{c.peso_kg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mittente / Destinatario */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-sm font-semibold text-spst-blue">Mittente</div>
              <div className="text-sm">
                <div className="font-medium">{mittente.ragioneSociale}</div>
                <div>
                  {mittente.indirizzo}
                  {mittente.indirizzo ? ', ' : ''}
                  {mittente.citta} {mittente.cap} {mittente.paese}
                </div>
                {mittente.piva ? <div>P.IVA / Tax: {mittente.piva}</div> : null}
                {mittente.telefono ? <div>{mittente.telefono}</div> : null}
              </div>
            </div>
            <div>
              <div className="mb-1 text-sm font-semibold text-spst-blue">Destinatario</div>
              <div className="text-sm">
                <div className="font-medium">{destinatario.ragioneSociale}</div>
                <div>
                  {destinatario.indirizzo}
                  {destinatario.indirizzo ? ', ' : ''}
                  {destinatario.citta} {destinatario.cap} {destinatario.paese}
                </div>
                {destinatario.piva ? <div>Tax ID / EORI: {destinatario.piva}</div> : null}
                {destinatario.telefono ? <div>{destinatario.telefono}</div> : null}
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-sm font-semibold text-spst-blue">Contenuto</div>
              <div className="text-sm">{contenuto || '—'}</div>
            </div>
            <div>
              <div className="mb-1 text-sm font-semibold text-spst-blue">Note</div>
              <div className="text-sm whitespace-pre-line">{noteGeneriche || '—'}</div>
              {ritiroNote ? (
                <div className="text-sm text-slate-600">Note ritiro: {ritiroNote}</div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/dashboard/quotazioni" className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50">
              Le mie quotazioni
            </Link>
            <Link
              href="/dashboard/quotazioni/nuova"
              className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              Nuova quotazione
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // FORM (layout “di prima” + titoli blu)
  return (
    <div ref={topRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Nuova quotazione</h1>
        <Link href="/dashboard/quotazioni" className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50">
          Le mie quotazioni
        </Link>
      </div>

      {!!errors.length && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
          <div className="mb-1 font-medium">Controlla questi campi:</div>
          <ul className="ml-5 list-disc space-y-1">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Selettori business */}
      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-spst-blue">Dettagli spedizione</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo spedizione</label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={tipoSped}
              onChange={(e) => setTipoSped(e.target.value as TipoSped)}
            >
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
              <option value="Sample">Sample</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Incoterm</label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={incoterm}
              onChange={(e) => setIncoterm(e.target.value as Incoterm)}
            >
              <option value="DAP">DAP</option>
              <option value="DDP">DDP</option>
              <option value="EXW">EXW</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mittente / Destinatario */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="mb-3 text-base font-semibold text-spst-blue">Mittente</h2>
          <PartyCard value={mittente} onChange={setMittente} title="" />
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="mb-3 text-base font-semibold text-spst-blue">Destinatario</h2>
          <PartyCard value={destinatario} onChange={setDestinatario} title="" />
        </div>
      </div>

      {/* Colli / Contenuto */}
      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-spst-blue">Colli e contenuto</h2>
        <ColliCard
          colli={colli}
          onChange={setColli}
          formato={formato}
          setFormato={setFormato}
          contenuto={contenuto}
          setContenuto={setContenuto}
        />
      </div>

      {/* Ritiro */}
      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-spst-blue">Ritiro</h2>
        <RitiroCard date={ritiroData} setDate={setRitiroData} note={ritiroNote} setNote={setRitiroNote} />
      </div>

      {/* Note generiche */}
      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-spst-blue">Note & documenti</h2>
        <label className="mb-1 block text-sm font-medium text-slate-700">Note generiche sulla spedizione</label>
        <textarea
          value={noteGeneriche}
          onChange={(e) => setNoteGeneriche(e.target.value)}
          rows={4}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spst-blue/20"
          placeholder="Es. orari preferiti, vincoli, dettagli utili…"
        />
        <p className="mt-2 text-xs text-slate-500">
          Gli eventuali documenti richiesti saranno determinati automaticamente in back office.
        </p>
      </div>

      {/* CTA */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={salva}
          disabled={saving}
          aria-busy={saving}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <span className="inline-block h-4 w-4 animate-spin rounded-full border border-slate-400 border-t-transparent" />}
          {saving ? 'Invio…' : 'Invia richiesta'}
        </button>
      </div>
    </div>
  );
}
