// app/dashboard/nuova/vino/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import FatturaCard from '@/components/nuova/FatturaCard';
import PackingListVino, { RigaPL } from '@/components/nuova/PackingListVino';
import { Select } from '@/components/nuova/Field';
import {
  postSpedizione,
  postSpedizioneAttachments,
  postSpedizioneNotify,
  ApiError,
  getUserProfile,
} from '@/lib/api';
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

// ---------- UTIL: parsing Place (compat legacy se servisse) ----------
function parsePlace(place: any) {
  const get = (t: string) =>
    place?.addressComponents?.find((c: any) => c.types?.includes(t)) ||
    place?.address_components?.find?.((c: any) => c.types?.includes(t));

  const street = get('route')?.longText || get('route')?.long_name || '';
  const streetNumber = get('street_number')?.longText || get('street_number')?.long_name || '';
  const city =
    get('locality')?.longText ||
    get('locality')?.long_name ||
    get('postal_town')?.longText ||
    get('postal_town')?.long_name ||
    get('administrative_area_level_3')?.longText ||
    get('administrative_area_level_3')?.long_name ||
    '';
  const postalCode = get('postal_code')?.longText || get('postal_code')?.long_name || '';
  const country = get('country')?.shortText || get('country')?.short_name || '';

  const via = [street, streetNumber].filter(Boolean).join(' ');
  return { via, city, postalCode, country };
}

export default function NuovaVinoPage() {
  const router = useRouter();

  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');
  const [destAbilitato, setDestAbilitato] = useState(false);

  const [mittente, setMittente] = useState<Party>(blankParty);
  const [destinatario, setDestinatario] = useState<Party>(blankParty);

  // Prefill mittente da UTENTI (Airtable)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getUserProfile(getIdToken);
        if (!cancelled && r?.ok && r?.party) {
          setMittente((prev) => ({ ...prev, ...r.party }));
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
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

  // ▼▼ PL iniziale ▼▼
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

  // se ho errori scorro su
  useEffect(() => {
    if (errors.length && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [errors.length]);

  // pulizia messaggio P.IVA quando passo a B2C
  useEffect(() => {
    if (tipoSped === 'B2C') {
      setErrors((prev) => prev.filter((msg) => msg !== DEST_PIVA_MSG));
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

  // --- Validazioni ---
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
        if (!r.bottiglie || r.bottiglie <= 0)
          out.push(`${idx}: quantità (pezzi) > 0 obbligatoria per brochure/depliant.`);
        if (r.peso_netto_bott == null || r.peso_netto_bott <= 0)
          out.push(`${idx}: peso netto/pezzo (kg) obbligatorio per brochure/depliant.`);
        if (r.peso_lordo_bott == null || r.peso_lordo_bott <= 0)
          out.push(`${idx}: peso lordo/pezzo (kg) obbligatorio per brochure/depliant.`);
      } else {
        if (!r.bottiglie || r.bottiglie <= 0) out.push(`${idx}: numero bottiglie > 0 obbligatorio.`);
        if (r.formato_litri == null || r.formato_litri <= 0)
          out.push(`${idx}: formato bottiglia (L) obbligatorio.`);
        if (r.gradazione == null || Number.isNaN(r.gradazione))
          out.push(`${idx}: gradazione alcolica (% vol) obbligatoria.`);
        else if (r.gradazione < 4 || r.gradazione > 25)
          out.push(`${idx}: gradazione fuori range plausibile (4–25% vol).`);
        if (r.peso_netto_bott == null || r.peso_netto_bott <= 0)
          out.push(`${idx}: peso netto/bottiglia (kg) obbligatorio.`);
        if (r.peso_lordo_bott == null || r.peso_lordo_bott <= 0)
          out.push(`${idx}: peso lordo/bottiglia (kg) obbligatorio.`);
      }
    });
    return out;
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!isPhoneValid(mittente.telefono))
      errs.push('Telefono mittente obbligatorio in formato internazionale (es. +393201441789).');
    if (!isPhoneValid(destinatario.telefono))
      errs.push('Telefono destinatario obbligatorio in formato internazionale.');

    if ((tipoSped === 'B2B' || tipoSped === 'Sample') && !destinatario.piva?.trim()) {
      errs.push(DEST_PIVA_MSG);
    }
    if (!mittente.piva?.trim()) errs.push('Partita IVA/Codice Fiscale del mittente mancante.');

    colli.forEach((c, i) => {
      const miss =
        c.lunghezza_cm == null || c.larghezza_cm == null || c.altezza_cm == null || c.peso_kg == null;
      const nonPos =
        (c.lunghezza_cm ?? 0) <= 0 ||
        (c.larghezza_cm ?? 0) <= 0 ||
        (c.altezza_cm ?? 0) <= 0 ||
        (c.peso_kg ?? 0) <= 0;
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
      try {
        await postSpedizioneNotify(res.id, getIdToken);
      } catch {}
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

  // =====================================================================
  // AUTOCOMPLETE (Places "New" via REST) — DEBUG MODE
  // =====================================================================
  const GMAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string;
  const GMAPS_LANG = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_LANGUAGE || 'it') as string;
  const GMAPS_REGION = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_REGION || 'IT') as string;

  const DEBUG_AC = true;
  const log = {
    info: (...a: any[]) => DEBUG_AC && console.info('[AC]', ...a),
    warn: (...a: any[]) => DEBUG_AC && console.warn('[AC]', ...a),
    error: (...a: any[]) => DEBUG_AC && console.error('[AC]', ...a),
    group: (title: string) => DEBUG_AC && console.groupCollapsed(`🧭 ${title}`),
    groupEnd: () => DEBUG_AC && console.groupEnd(),
  };

  type Suggestion = { id: string; main: string; secondary: string };

  function ensureAutocompleteStyles() {
    if (document.getElementById('spst-gmaps-autocomplete-css')) return;
    const st = document.createElement('style');
    st.id = 'spst-gmaps-autocomplete-css';
    st.textContent = `
      .spst-ac-list{position:absolute; z-index:99999; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,.08); width:100%; max-height:260px; overflow:auto;}
      .spst-ac-item{padding:.6rem .75rem; cursor:pointer; line-height:1.2; font-size:14px; display:flex; flex-direction:column; gap:2px}
      .spst-ac-item:hover, .spst-ac-item[aria-selected="true"]{background:#f8fafc}
      .spst-ac-main{font-weight:600; color:#0f172a}
      .spst-ac-sec{font-size:12px; color:#64748b}
    `;
    document.head.appendChild(st);
  }

  function createListEl(anchor: HTMLInputElement) {
    const wrap = document.createElement('div');
    wrap.className = 'spst-ac-list';
    const place = () => {
      const r = anchor.getBoundingClientRect();
      wrap.style.left = `${window.scrollX + r.left}px`;
      wrap.style.top = `${window.scrollY + r.bottom + 4}px`;
      wrap.style.width = `${r.width}px`;
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    (wrap as any)._cleanup = () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      wrap.remove();
    };
    document.body.appendChild(wrap);
    return wrap;
  }

  function newSessionToken() {
    return (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : `${Date.now()}_${Math.random()}`;
  }

  // fetch suggestions — parametri "rilassati" + log
  async function fetchSuggestions(input: string, sessionToken: string): Promise<Suggestion[]> {
    if (!GMAPS_API_KEY) {
      log.warn('Manca NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
      return [];
    }
    const url = 'https://places.googleapis.com/v1/places:autocomplete';
    const body: any = {
      input,
      languageCode: GMAPS_LANG,
      sessionToken,
      includedPrimaryTypes: ['street_address', 'premise', 'route', 'subpremise'],
      // hint (non vincolante) verso Italia
      locationBias: {
        circle: { center: { latitude: 41.87194, longitude: 12.56738 }, radius: 600000 },
      },
    };

    log.group('Autocomplete → request');
    console.log('POST', url, body);
    console.time('autocomplete');
    let resp: Response;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GMAPS_API_KEY,
          'X-Goog-FieldMask':
            'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat',
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.timeEnd('autocomplete');
      log.error('Network error suggestions:', e);
      log.groupEnd();
      return [];
    }
    console.timeEnd('autocomplete');

    let j: any;
    try {
      j = await resp.json();
    } catch (e) {
      log.error('JSON parse error (suggestions):', e);
      log.groupEnd();
      return [];
    }

    if (!resp.ok || j?.error) {
      log.error('API error (suggestions):', j?.error || j);
      log.groupEnd();
      return [];
    }

    const arr = (j?.suggestions || []) as any[];
    const out = arr
      .map((s) => {
        const pred = s.placePrediction || {};
        const fmt = pred.structuredFormat || {};
        return {
          id: pred.placeId,
          main: fmt.mainText?.text || '',
          secondary: fmt.secondaryText?.text || '',
        } as Suggestion;
      })
      .filter((s: Suggestion) => !!s.id && (!!s.main || !!s.secondary));

    console.log('[AC] suggestions count =', out.length);
    if (out.length) console.table(out);
    log.groupEnd();
    return out;
  }

  async function fetchPlaceDetails(placeId: string, sessionToken?: string) {
    const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
    url.searchParams.set('languageCode', GMAPS_LANG);
    url.searchParams.set('regionCode', GMAPS_REGION);
    if (sessionToken) url.searchParams.set('sessionToken', sessionToken);

    log.group('Place Details → request');
    console.log('GET', url.toString());
    let resp: Response;
    try {
      resp = await fetch(url.toString(), {
        headers: {
          'X-Goog-Api-Key': GMAPS_API_KEY,
          'X-Goog-FieldMask': 'id,formattedAddress,addressComponents,location',
        },
      });
    } catch (e) {
      log.error('Network error details:', e);
      log.groupEnd();
      return null;
    }

    let j: any;
    try {
      j = await resp.json();
    } catch (e) {
      log.error('JSON parse error (details):', e);
      log.groupEnd();
      return null;
    }

    if (!resp.ok || j?.error) {
      log.error('API error (details):', j?.error || j);
      log.groupEnd();
      return null;
    }

    console.log('[AC] details ok');
    log.groupEnd();
    return j;
  }

  function parseAddressFromDetails(d: any) {
    const comps: any[] = d?.addressComponents || [];
    const get = (type: string) =>
      comps.find((c) => Array.isArray(c.types) && c.types.includes(type)) || null;

    const country = get('country');
    const locality = get('locality') || get('postal_town');
    const admin2 = get('administrative_area_level_2');
    const admin1 = get('administrative_area_level_1');
    const postal = get('postal_code');
    const route = get('route');
    const streetNumber = get('street_number');
    const premise = get('premise');

    const line = [
      route?.shortText || route?.longText,
      streetNumber?.shortText || streetNumber?.longText,
      premise?.longText,
    ]
      .filter(Boolean)
      .join(' ');

    return {
      indirizzo: line || d?.formattedAddress || '',
      citta: locality?.longText || admin2?.longText || admin1?.longText || '',
      cap: postal?.shortText || postal?.longText || '',
      paese: country?.shortText || country?.longText || '',
    };
  }

  function attachPlacesToInput(
    input: HTMLInputElement,
    who: 'mittente' | 'destinatario',
    onFill: (patch: Partial<Party>) => void
  ) {
    ensureAutocompleteStyles();
    log.info(`attach → ${who}`, input);

    let listEl: HTMLDivElement | null = null;
    let items: Suggestion[] = [];
    let highlighted = -1;
    let session = newSessionToken();
    let debounce: number | undefined;

    const close = () => {
      if (listEl) {
        (listEl as any)._cleanup?.();
        listEl = null;
      }
      items = [];
      highlighted = -1;
    };

    // === render: mostra anche “nessun suggerimento” per debug UI
    function render() {
      if (!listEl) listEl = createListEl(input);
      listEl.innerHTML = '';

      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'spst-ac-item';
        empty.innerHTML = `<div class="spst-ac-main">Nessun suggerimento</div>
                           <div class="spst-ac-sec">Controlla Console/Network per il dettaglio</div>`;
        listEl!.appendChild(empty);
        return;
      }

      items.forEach((sug, i) => {
        const item = document.createElement('div');
        item.className = 'spst-ac-item';
        item.setAttribute('role', 'option');
        if (i === highlighted) item.setAttribute('aria-selected', 'true');
        const main = document.createElement('div');
        main.className = 'spst-ac-main';
        main.textContent = sug.main || sug.secondary;
        const sec = document.createElement('div');
        sec.className = 'spst-ac-sec';
        sec.textContent = sug.secondary || '';
        item.append(main);
        if (sug.secondary) item.append(sec);
        item.addEventListener('mousedown', async (e) => {
          e.preventDefault();
          log.info('choose', sug);
          await choose(i);
        });
        listEl!.appendChild(item);
      });
    }

    const choose = async (idx: number) => {
      const sel = items[idx];
      if (!sel) return;
      close();
      input.value = sel.main + (sel.secondary ? `, ${sel.secondary}` : '');
      const details = await fetchPlaceDetails(sel.id, session);
      session = newSessionToken();
      if (!details) return;
      const addr = parseAddressFromDetails(details);
      log.info('fill →', who, addr);
      onFill(addr);
    };

    const onInput = () => {
      const q = input.value.trim();
      window.clearTimeout(debounce);
      if (!q) {
        close();
        return;
      }
      debounce = window.setTimeout(async () => {
        try {
          items = await fetchSuggestions(q, session);
          highlighted = -1;
          render();
        } catch (e) {
          log.error('onInput fetchSuggestions error:', e);
          close();
        }
      }, 180);
    };

    const onKey = async (e: KeyboardEvent) => {
      if (!items.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlighted = (highlighted + 1) % items.length;
        render();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlighted = (highlighted - 1 + items.length) % items.length;
        render();
      } else if (e.key === 'Enter' && highlighted >= 0) {
        e.preventDefault();
        await choose(highlighted);
      } else if (e.key === 'Escape') {
        close();
      }
    };

    const onBlur = () => setTimeout(close, 120);

    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKey);
    input.addEventListener('blur', onBlur);

    return () => {
      input.removeEventListener('input', onInput);
      input.removeEventListener('keydown', onKey);
      input.removeEventListener('blur', onBlur);
      close();
    };
  }

  // Hook: collega agli input indirizzo (PartyCard deve avere data-gmaps)
  useEffect(() => {
    const mitt = document.querySelector<HTMLInputElement>(
      'input[data-gmaps="indirizzo-mittente"]'
    );
    const dest = document.querySelector<HTMLInputElement>(
      'input[data-gmaps="indirizzo-destinatario"]'
    );
    log.group('Bootstrap autocomplete');
    log.info('API key present?', !!GMAPS_API_KEY);
    log.info('mittente input found?', !!mitt);
    log.info('destinatario input found?', !!dest);
    log.groupEnd();

    const cleanups: Array<() => void> = [];
    if (mitt)
      cleanups.push(
        attachPlacesToInput(mitt, 'mittente', (patch) => setMittente((p) => ({ ...p, ...patch })))
      );
    if (dest)
      cleanups.push(
        attachPlacesToInput(dest, 'destinatario', (patch) =>
          setDestinatario((p) => ({ ...p, ...patch }))
        )
      );

    // diagnostica da console
    (window as any).SPSTPlacesDiag = async (q = 'Viale Suzzani 10, Milano') => {
      console.log('SPSTPlacesDiag → query:', q);
      const token = newSessionToken();
      const s = await fetchSuggestions(q, token);
      console.table(s);
      if (s[0]?.id) {
        const d = await fetchPlaceDetails(s[0].id, token);
        console.log('details for first suggestion:', d);
      }
    };

    return () => cleanups.forEach((fn) => fn());
  }, []);
  // ===================== FINE AUTOCOMPLETE DEBUG =====================

  if (success) {
    const INFO_URL = process.env.NEXT_PUBLIC_INFO_URL || '/dashboard/informazioni-utili';
    const WHATSAPP_URL_BASE =
      process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/message/CP62RMFFDNZPO1';
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
            <div>
              <span className="text-slate-500">Tipo:</span> {success.tipoSped}
            </div>
            <div>
              <span className="text-slate-500">Incoterm:</span> {success.incoterm}
            </div>
            <div>
              <span className="text-slate-500">Data ritiro:</span> {success.dataRitiro ?? '—'}
            </div>
            <div>
              <span className="text-slate-500">Colli:</span> {success.colli} ({success.formato})
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-500">Destinatario:</span>{' '}
              {success.destinatario.ragioneSociale || '—'}
              {success.destinatario.citta ? ` — ${success.destinatario.citta}` : ''}
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

            <a
              href={INFO_URL}
              className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
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
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
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
        <PartyCard title="Mittente" value={mittente} onChange={setMittente} gmapsTag="mittente" />
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
          {saving && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border border-slate-400 border-t-transparent" />
          )}
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>
      </div>
    </div>
  );
}
