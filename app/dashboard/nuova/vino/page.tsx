// app/dashboard/nuova/vino/page.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import FatturaCard from '@/components/nuova/FatturaCard';
import PackingListVino, { RigaPL } from '@/components/nuova/PackingListVino';
import { Select } from '@/components/nuova/Field';
import { postSpedizione, postSpedizioneAttachments, postSpedizioneNotify, ApiError, getUserProfile } from '@/lib/api';
import { getIdToken } from '@/lib/firebase-client-auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

type SuccessInfo = {
  recId: string;
  idSped: string;
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  incoterm: 'DAP' | 'DDP' | 'EXW';
  dataRitiro?: string;
  colli: number;
  formato: 'Pacco' | 'Pallet';
  destinatario: Party;
};

const DEST_PIVA_MSG =
  'Per le spedizioni vino di tipo B2B o Sample è obbligatoria la Partita IVA / Codice Fiscale del destinatario.';

// ---------- UTIL: parsing Place (nuove API) ----------
function parsePlace(place: any) {
  const get = (t: string) =>
    place?.addressComponents?.find((c: any) => c.types?.includes(t)) ||
    place?.address_components?.find?.((c: any) => c.types?.includes(t));

  const street = get('route')?.longText || get('route')?.long_name || '';
  const streetNumber = get('street_number')?.longText || get('street_number')?.long_name || '';
  const city =
    get('locality')?.longText || get('locality')?.long_name ||
    get('postal_town')?.longText || get('postal_town')?.long_name ||
    get('administrative_area_level_3')?.longText || get('administrative_area_level_3')?.long_name || '';
  const province =
    get('administrative_area_level_2')?.shortText || get('administrative_area_level_2')?.short_name ||
    get('administrative_area_level_1')?.shortText || get('administrative_area_level_1')?.short_name || '';
  const postalCode = get('postal_code')?.longText || get('postal_code')?.long_name || '';
  const country = get('country')?.shortText || get('country')?.short_name || '';

  const via = [street, streetNumber].filter(Boolean).join(' ');
  return { via, city, province, postalCode, country };
}

export default function NuovaVinoPage() {
  const router = useRouter();

  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');
  const [destAbilitato, setDestAbilitato] = useState(false);

  const [mittente, setMittente] = useState<Party>(blankParty);
  const [destinatario, setDestinatario] = useState<Party>(blankParty);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getUserProfile(getIdToken);
        if (!cancelled && r?.ok && r?.party) {
          setMittente(prev => ({ ...prev, ...r.party }));
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const [colli, setColli] = useState<Collo[]>([
    { lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null },
  ]);
  const [formato, setFormato] = useState<'Pacco' | 'Pallet'>('Pacco');
  const [contenuto, setContenuto] = useState<string>('');
  const [ritiroData, setRitiroData] = useState<Date | undefined>(undefined);
  const [ritiroNote, setRitiroNote] = useState('');
  const [incoterm, setIncoterm] = useState<'DAP' | 'DDP' | 'EXW'>('DAP');
  const [valuta, setValuta] = useState<'EUR' | 'USD' | 'GBP'>('EUR');
  const [noteFatt, setNoteFatt] = useState('');
  const [delega, setDelega] = useState(false);
  const [fatturazione, setFatturazione] = useState<Party>(blankParty);
  const [sameAsDest, setSameAsDest] = useState(false);
  const [fatturaFile, setFatturaFile] = useState<File | undefined>(undefined);

  const [pl, setPl] = useState<RigaPL[]>([
    {
      etichetta: '',
      tipologia: 'vino fermo',
      bottiglie: 1,
      formato_litri: 0.75,
      gradazione: 12,
      prezzo: 0,
      valuta: 'EUR',
      peso_netto_bott: 1.2,
      peso_lordo_bott: 1.5,
    },
  ]);
  const [plFiles, setPlFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [errors.length]);

  useEffect(() => {
    if (tipoSped === 'B2C') {
      setErrors(prev => prev.filter(msg => msg !== DEST_PIVA_MSG));
    }
  }, [tipoSped, destinatario.piva]);

  async function fetchIdSpedizione(recId: string): Promise<string> {
    try {
      const t = await getIdToken();
      const r = await fetch(`/api/spedizioni/${recId}/meta`, {
        headers: t ? { Authorization: `Bearer ${t}` } : undefined,
      });
      const j = await r.json();
      return j?.idSpedizione || recId;
    } catch {
      return recId;
    }
  }

  async function uploadAndAttach(spedId: string) {
    const storage = getStorage();
    const fattura: { url: string; filename?: string }[] = [];
    const packing: { url: string; filename?: string }[] = [];

    if (fatturaFile) {
      const r = ref(storage, `spedizioni/${spedId}/fattura/${fatturaFile.name}`);
      await uploadBytes(r, fatturaFile);
      const url = await getDownloadURL(r);
      fattura.push({ url, filename: fatturaFile.name });
    }

    for (const f of plFiles) {
      const r = ref(storage, `spedizioni/${spedId}/packing/${f.name}`);
      await uploadBytes(r, f);
      const url = await getDownloadURL(r);
      packing.push({ url, filename: f.name });
    }

    if (fattura.length || packing.length) {
      await postSpedizioneAttachments(spedId, { fattura, packing }, getIdToken);
    }
  }

  function isPhoneValid(raw?: string) {
    if (!raw) return false;
    const v = raw.replace(/\s+/g, '');
    return /^\+?[1-9]\d{6,14}$/.test(v);
  }

  function validatePLConditional(rows: RigaPL[] | undefined): string[] {
    const out: string[] = [];
    if (!rows || rows.length === 0) {
      out.push('Packing list obbligatoria per spedizioni vino.');
      return out;
    }
    rows.forEach((r, i) => {
      const idx = `Riga PL #${i + 1}`;
      if (!r.etichetta?.trim()) out.push(`${idx}: etichetta prodotto mancante.`);
      if (!r['tipologia']) out.push(`${idx}: seleziona la tipologia (vino fermo/spumante o brochure/depliant).`);

      const isBrochure = r['tipologia'] === 'brochure/depliant';
      if (isBrochure) {
        if (!r.bottiglie || r.bottiglie <= 0) out.push(`${idx}: quantità (pezzi) > 0 obbligatoria per brochure/depliant.`);
        if (r.peso_netto_bott == null || r.peso_netto_bott <= 0) out.push(`${idx}: peso netto/pezzo (kg) obbligatorio per brochure/depliant.`);
        if (r.peso_lordo_bott == null || r.peso_lordo_bott <= 0) out.push(`${idx}: peso lordo/pezzo (kg) obbligatorio per brochure/depliant.`);
      } else {
        if (!r.bottiglie || r.bottiglie <= 0) out.push(`${idx}: numero bottiglie > 0 obbligatorio.`);
        if (r.formato_litri == null || r.formato_litri <= 0) out.push(`${idx}: formato bottiglia (L) obbligatorio.`);
        if (r.gradazione == null || Number.isNaN(r.gradazione)) out.push(`${idx}: gradazione alcolica (% vol) obbligatoria.`);
        else if (r.gradazione < 4 || r.gradazione > 25) out.push(`${idx}: gradazione fuori range plausibile (4–25% vol).`);
        if (r.peso_netto_bott == null || r.peso_netto_bott <= 0) out.push(`${idx}: peso netto/bottiglia (kg) obbligatorio.`);
        if (r.peso_lordo_bott == null || r.peso_lordo_bott <= 0) out.push(`${idx}: peso lordo/bottiglia (kg) obbligatorio.`);
      }
    });
    return out;
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!isPhoneValid(mittente.telefono)) errs.push('Telefono mittente obbligatorio in formato internazionale (es. +393201441789).');
    if (!isPhoneValid(destinatario.telefono)) errs.push('Telefono destinatario obbligatorio in formato internazionale.');
    if ((tipoSped === 'B2B' || tipoSped === 'Sample') && !destinatario.piva?.trim()) {
      errs.push(DEST_PIVA_MSG);
    }
    if (!mittente.piva?.trim()) errs.push('Partita IVA/Codice Fiscale del mittente mancante.');
    colli.forEach((c, i) => {
      const miss = c.lunghezza_cm == null || c.larghezza_cm == null || c.altezza_cm == null || c.peso_kg == null;
      const nonPos = (c.lunghezza_cm ?? 0) <= 0 || (c.larghezza_cm ?? 0) <= 0 || (c.altezza_cm ?? 0) <= 0 || (c.peso_kg ?? 0) <= 0;
      if (miss || nonPos) errs.push(`Collo #${i + 1}: inserire tutte le misure e un peso > 0.`);
    });
    if (!ritiroData) errs.push('Seleziona il giorno di ritiro.');
    errs.push(...validatePLConditional(pl));
    if (!fatturaFile) {
      const fatt = sameAsDest ? destinatario : fatturazione;
      if (!fatt.ragioneSociale?.trim()) errs.push('Dati fattura: ragione sociale mancante.');
      if ((tipoSped === 'B2B' || tipoSped === 'Sample') && !fatt.piva?.trim()) {
        errs.push('Dati fattura: P.IVA/CF obbligatoria per B2B e Campionatura.');
      }
    }
    return errs;
  }

  const salva = async () => {
    if (saving) return;
    const v = validate();
    if (v.length) {
      setErrors(v);
      return;
    } else {
      setErrors([]);
    }
    setSaving(true);
    try {
      const payload = {
        sorgente: 'vino' as const,
        tipoSped,
        destAbilitato,
        contenuto,
        formato,
        ritiroData: ritiroData ? ritiroData.toISOString() : undefined,
        ritiroNote,
        mittente,
        destinatario,
        incoterm,
        valuta,
        noteFatt,
        fatturazione: sameAsDest ? destinatario : fatturazione,
        fattSameAsDest: sameAsDest,
        fattDelega: delega,
        fatturaFileName: fatturaFile?.name || null,
        colli,
        packingList: pl,
      };

      const res = await postSpedizione(payload, getIdToken);
      await uploadAndAttach(res.id);
      try { await postSpedizioneNotify(res.id, getIdToken); } catch {}
      const idSped = await fetchIdSpedizione(res.id);

      setSuccess({
        recId: res.id,
        idSped,
        tipoSped,
        incoterm,
        dataRitiro: ritiroData?.toLocaleDateString(),
        colli: colli.length,
        formato,
        destinatario,
      });
      if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'Si è verificato un errore durante il salvataggio. Riprova più tardi.';
      setErrors([msg]);
      console.error('Errore salvataggio/allegati', e);
    } finally {
      setSaving(false);
    }
  };

  // ---------- AUTOCOMPLETE (aggancio affidabile via data-gmaps) ----------
  const attachAutocomplete = useCallback((input: HTMLInputElement, who: 'mittente' | 'destinatario') => {
    if (!input) return;

    if (!input.id) input.id = `input-indirizzo-${who}`;
    if (document.querySelector(`gmpx-place-autocomplete[for="${input.id}"]`)) return;

    const el = document.createElement('gmpx-place-autocomplete');
    el.setAttribute('for', input.id);
    el.setAttribute(
      'autocompleteoptions',
      JSON.stringify({
        componentRestrictions: {
          country: ['it', 'fr', 'de', 'es', 'gb', 'us', 'ca', 'at', 'be', 'nl', 'se', 'dk', 'fi', 'no', 'cz', 'sk', 'pl'],
        },
        fields: ['address_components', 'formatted_address', 'geometry'],
      }),
    );

    document.body.appendChild(el);
    (el.style as any).zIndex = '9999';

    el.addEventListener('gmpx-placechange', () => {
      // @ts-ignore
      const place = el.value || el.getAttribute('value');
      if (!place) return;
      const { via, city, province, postalCode, country } = parsePlace(place);

      if (who === 'mittente') {
        setMittente(prev => ({
          ...prev,
          indirizzo: via || prev.indirizzo,
          citta: city || prev.citta,
          cap: postalCode || prev.cap,
          paese: country || prev.paese,
        }));
      } else {
        setDestinatario(prev => ({
          ...prev,
          indirizzo: via || prev.indirizzo,
          citta: city || prev.citta,
          cap: postalCode || prev.cap,
          paese: country || prev.paese,
        }));
      }
    });
  }, []);

  useEffect(() => {
    const ready = () => (window as any).google && customElements.get('gmpx-place-autocomplete');

    const tryAttach = () => {
      const mittInput = document.querySelector<HTMLInputElement>('input[data-gmaps="indirizzo-mittente"]');
      const destInput = document.querySelector<HTMLInputElement>('input[data-gmaps="indirizzo-destinatario"]');
      if (mittInput) attachAutocomplete(mittInput, 'mittente');
      if (destInput) attachAutocomplete(destInput, 'destinatario');
    };

    if (ready()) {
      tryAttach();
      return;
    }
    const int = window.setInterval(() => {
      if (ready()) {
        window.clearInterval(int);
        tryAttach();
      }
    }, 250);
    return () => window.clearInterval(int);
  }, [attachAutocomplete]);
  // ---------- /AUTOCOMPLETE ----------

  if (success) {
    const INFO_URL = process.env.NEXT_PUBLIC_INFO_URL || '/dashboard/informazioni-utili';
    const WHATSAPP_URL_BASE = process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/message/CP62RMFFDNZPO1';
    const whatsappHref = `${WHATSAPP_URL_BASE}?text=${encodeURIComponent(
      `Ciao SPST, ho bisogno di supporto sulla spedizione ${success.idSped}`
    )}`;

    return (
      <div className="space-y-4" ref={topRef}>
        <h2 className="text-lg font-semibold">Spedizione creata</h2>

        <div className="rounded-2xl border bg-white p-4">
          <div className="mb-3 text-sm">
            <div className="font-medium">ID Spedizione</div>
            <div className="font-mono">{success.idSped}</div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div><span className="text-slate-500">Tipo:</span> {success.tipoSped}</div>
            <div><span className="text-slate-500">Incoterm:</span> {success.incoterm}</div>
            <div><span className="text-slate-500">Data ritiro:</span> {success.dataRitiro ?? '—'}</div>
            <div><span className="text-slate-500">Colli:</span> {success.colli} ({success.formato})</div>
            <div className="md:col-span-2">
              <span className="text-slate-500">Destinatario:</span>{' '}
              {success.destinatario.ragioneSociale || '—'}{success.destinatario.citta ? ` — ${success.destinatario.citta}` : ''}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard/spedizioni')}
              className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              Le mie spedizioni
            </button>

            <a href={INFO_URL} className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50">
              Documenti & info utili
            </a>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
              style={{ borderColor: '#f7911e' }}
            >
              Supporto WhatsApp
            </a>

            <span className="text-sm text-green-700">Email di conferma inviata ✅</span>
          </div>

          <div className="mt-6 text-xs text-slate-500">
            Suggerimento: conserva l’ID per future comunicazioni. Puoi chiudere questa pagina.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={topRef}>
      <h2 className="text-lg font-semibold">Nuova spedizione — vino</h2>

      {!!errors.length && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <div className="font-medium mb-1">Controlla questi campi:</div>
          <ul className="list-disc ml-5 space-y-1">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4">
        <Select
          label="Stai spedendo ad un privato? O ad una azienda?"
          value={tipoSped}
          onChange={(v) => setTipoSped(v as 'B2B' | 'B2C' | 'Sample')}
          options={[
            { label: 'B2C — privato / cliente', value: 'B2C' },
            { label: 'B2B — azienda', value: 'B2B' },
            { label: 'Sample — campionatura', value: 'Sample' },
          ]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* MITTENTE */}
        <div className="rounded-2xl border bg-white p-4">
          <PartyCard title="Mittente" value={mittente} onChange={setMittente} gmapsTag="mittente" />
        </div>
        {/* DESTINATARIO */}
        <div className="rounded-2xl border bg-white p-4">
          <PartyCard
            title="Destinatario"
            value={destinatario}
            onChange={setDestinatario}
            gmapsTag="destinatario"
            extraSwitch={{
              label: 'Destinatario abilitato all’import',
              checked: destAbilitato,
              onChange: setDestAbilitato,
            }}
          />
        </div>
      </div>

      <PackingListVino value={pl} onChange={setPl} files={plFiles} onFiles={setPlFiles} />

      <ColliCard
        colli={colli}
        onChange={setColli}
        formato={formato}
        setFormato={setFormato}
        contenuto={contenuto}
        setContenuto={setContenuto}
      />

      <RitiroCard date={ritiroData} setDate={setRitiroData} note={ritiroNote} setNote={setRitiroNote} />

      <FatturaCard
        incoterm={incoterm}
        setIncoterm={setIncoterm}
        valuta={valuta}
        setValuta={setValuta}
        note={noteFatt}
        setNote={setNoteFatt}
        delega={delega}
        setDelega={setDelega}
        fatturazione={fatturazione}
        setFatturazione={setFatturazione}
        destinatario={destinatario}
        sameAsDest={sameAsDest}
        setSameAsDest={setSameAsDest}
        fatturaFile={fatturaFile}
        setFatturaFile={setFatturaFile}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={salva}
          disabled={saving}
          aria-busy={saving}
          className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {saving && <span className="inline-block h-4 w-4 animate-spin rounded-full border border-slate-400 border-t-transparent" />}
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>
      </div>
    </div>
  );
}
