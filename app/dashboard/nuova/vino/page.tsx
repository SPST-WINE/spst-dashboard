'use client';

import { useEffect, useRef, useState } from 'react';
import PartyCard, { Party } from '@/components/nuova/PartyCard';
import ColliCard, { Collo } from '@/components/nuova/ColliCard';
import RitiroCard from '@/components/nuova/RitiroCard';
import FatturaCard from '@/components/nuova/FatturaCard';
import PackingListVino, { RigaPL } from '@/components/nuova/PackingListVino';
import { Select } from '@/components/nuova/Field';
import { postSpedizione, postSpedizioneAttachments, postSpedizioneNotify } from '@/lib/api';
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
  recId: string;    // recordId Airtable (serve per notify/attach)
  displayId: string;    // "ID Spedizione" leggibile (campo Airtable)
  tipoSped: 'B2B' | 'B2C' | 'Sample';
  incoterm: 'DAP' | 'DDP' | 'EXW';
  dataRitiro?: string;
  colli: number;
  formato: 'Pacco' | 'Pallet';
  destinatario: Party;
};

// Aggiungi un'interfaccia per la risposta dell'API
interface SpedizioneResponse {
  ok: boolean;
  id: string;
  displayId: string;
}

export default function NuovaVinoPage() {
  // Tipologia
  const [tipoSped, setTipoSped] = useState<'B2B' | 'B2C' | 'Sample'>('B2B');
  const [destAbilitato, setDestAbilitato] = useState(false);

  // Parti
  const [mittente, setMittente] = useState<Party>(blankParty);
  const [destinatario, setDestinatario] = useState<Party>(blankParty);

  // Colli
  const [colli, setColli] = useState<Collo[]>([
    { lunghezza_cm: null, larghezza_cm: null, altezza_cm: null, peso_kg: null },
  ]);
  const [formato, setFormato] = useState<'Pacco' | 'Pallet'>('Pacco');
  const [contenuto, setContenuto] = useState<string>('');

  // Ritiro
  const [ritiroData, setRitiroData] = useState<Date | undefined>(undefined);
  const [ritiroNote, setRitiroNote] = useState('');

  // Fattura
  const [incoterm, setIncoterm] = useState<'DAP' | 'DDP' | 'EXW'>('DAP');
  const [valuta, setValuta] = useState<'EUR' | 'USD' | 'GBP'>('EUR');
  const [noteFatt, setNoteFatt] = useState('');
  const [delega, setDelega] = useState(false);
  const [fatturazione, setFatturazione] = useState<Party>(blankParty);
  const [sameAsDest, setSameAsDest] = useState(false);
  const [fatturaFile, setFatturaFile] = useState<File | undefined>(undefined);

  // Packing list (righe + file)
  const [pl, setPl] = useState<RigaPL[]>([
    {
      etichetta: '',
      bottiglie: 1,
      formato_litri: 0.75,
      gradazione: 12,
      prezzo: 0,
      valuta: 'EUR',
      peso_netto_bott: 0.75,
      peso_lordo_bott: 1.3,
    },
  ]);
  const [plFiles, setPlFiles] = useState<File[]>([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const [emailSent, setEmailSent] = useState<null | 'ok' | 'err'>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [errors.length]);

  // ------- Upload allegati (Firebase) + attach su Airtable -------
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

  // ------- Validazione client -------
  function validate(): string[] {
    const errs: string[] = [];

    // Mittente: P.IVA obbligatoria
    if (!mittente.piva?.trim()) errs.push('Partita IVA/Codice Fiscale del mittente mancante.');

    // Colli: per ogni collo servono TUTTE le misure e il peso (>0)
    colli.forEach((c, i) => {
      const miss =
        c.lunghezza_cm == null ||
        c.larghezza_cm == null ||
        c.altezza_cm == null ||
        c.peso_kg == null;
      const nonPos =
        (c.lunghezza_cm ?? 0) <= 0 ||
        (c.larghezza_cm ?? 0) <= 0 ||
        (c.altezza_cm ?? 0) <= 0 ||
        (c.peso_kg ?? 0) <= 0;
      if (miss || nonPos) errs.push(`Collo #${i + 1}: inserire tutte le misure e un peso > 0.`);
    });

    // Data ritiro
    if (!ritiroData) errs.push('Seleziona il giorno di ritiro.');

    // Dati fattura: se NON c’è file allegato, applica regole
    if (!fatturaFile) {
      const fatt = sameAsDest ? destinatario : fatturazione;
      if (!fatt.ragioneSociale?.trim()) errs.push('Dati fattura: ragione sociale mancante.');
      // CF/P.IVA obbligatorio per B2B e Sample, non per B2C
      if ((tipoSped === 'B2B' || tipoSped === 'Sample') && !fatt.piva?.trim()) {
        errs.push('Dati fattura: P.IVA/CF obbligatoria per B2B e Campionatura.');
      }
    }

    return errs;
  }

  // ------- Salva -------
  const salva = async () => {
    if (saving) return; // blocca doppio click

    const v = validate();
    if (v.length) {
      setErrors(v);
      return;
    } else {
      setErrors([]);
    }

    setSaving(true);
    setEmailSent(null);
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

      // Usa l'interfaccia SpedizioneResponse per tipizzare la risposta
      const res: SpedizioneResponse = await postSpedizione(payload, getIdToken);
      await uploadAndAttach(res.id);

      setSuccess({
        recId: res.id,
        displayId: res.displayId ?? res.id,  // fallback al recordId se manca
        tipoSped,
        incoterm,
        dataRitiro: ritiroData?.toLocaleDateString(),
        colli: colli.length,
        formato,
        destinatario,
      });

    } catch (e) {
      console.error('Errore salvataggio/allegati', e);
      setErrors(['Si è verificato un errore durante il salvataggio. Riprova più tardi.']);
    } finally {
      setSaving(false);
      if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ------- Invio email -------
  const inviaEmail = async () => {
    if (!success) return;
    try {
      await postSpedizioneNotify(success.recId, getIdToken);
      setEmailSent('ok');
    } catch (e) {
      console.error(e);
      setEmailSent('err');
    }
  };

  // ------- UI -------
  if (success) {
    return (
      <div className="space-y-4" ref={topRef}>
        <h2 className="text-lg font-semibold">Spedizione creata</h2>

        <div className="rounded-2xl border bg-white p-4">
          <div className="mb-3 text-sm">
            <div className="font-medium">ID Spedizione</div>
            <div className="font-mono">{success.displayId}</div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div><span className="text-slate-500">Tipo:</span> {success.tipoSped}</div>
            <div><span className="text-slate-500">Incoterm:</span> {success.incoterm}</div>
            <div><span className="text-slate-500">Data ritiro:</span> {success.dataRitiro ?? '—'}</div>
            <div><span className="text-slate-500">Colli:</span> {success.colli} ({success.formato})</div>
            <div className="md:col-span-2">
              <span className="text-slate-500">Destinatario:</span>{' '}
              {success.destinatario.ragioneSociale} — {success.destinatario.citta}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={inviaEmail}
              className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              Invia email al cliente
            </button>
            {emailSent === 'ok' && (
              <span className="text-sm text-green-700">Email inviata ✅</span>
            )}
            {emailSent === 'err' && (
              <span className="text-sm text-red-700">Invio email fallito</span>
            )}
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

      {/* blocco errori */}
      {!!errors.length && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <div className="font-medium mb-1">Controlla questi campi:</div>
          <ul className="list-disc ml-5 space-y-1">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Tipologia spedizione */}
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

      {/* Mittente / Destinatario */}
      <div className="grid gap-4 md:grid-cols-2">
        <PartyCard title="Mittente" value={mittente} onChange={setMittente} />
        <PartyCard
          title="Destinatario"
          value={destinatario}
          onChange={setDestinatario}
          extraSwitch={{
            label: 'Destinatario abilitato all’import',
            checked: destAbilitato,
            onChange: setDestAbilitato,
          }}
        />
      </div>

      {/* Packing list (righe) + upload PL */}
      <PackingListVino
        value={pl}
        onChange={setPl}
        files={plFiles}
        onFiles={setPlFiles}
      />

      {/* Colli */}
      <ColliCard
        colli={colli}
        onChange={setColli}
        formato={formato}
        setFormato={setFormato}
        contenuto={contenuto}
        setContenuto={setContenuto}
      />

      {/* Ritiro */}
      <RitiroCard
        date={ritiroData}
        setDate={setRitiroData}
        note={ritiroNote}
        setNote={setRitiroNote}
      />

      {/* Fattura */}
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

      {/* CTA */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={salva}
          disabled={saving}
          aria-busy={saving}
          className={`rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2`}
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
