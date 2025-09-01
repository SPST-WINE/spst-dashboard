'use client';

import * as React from 'react';
import type { Party } from '@/components/nuova/PartyCard';
import Switch from '@/components/nuova/Switch';

type Incoterm = 'DAP' | 'DDP' | 'EXW';
type Valuta = 'EUR' | 'USD' | 'GBP';

type Props = {
  // commerciali
  incoterm: Incoterm;
  setIncoterm: (v: Incoterm) => void;
  valuta: Valuta;
  setValuta: (v: Valuta) => void;
  note: string;
  setNote: (v: string) => void;

  // delega creazione documento
  delega: boolean;
  setDelega: (v: boolean) => void;

  // dati fatturazione (sempre salvati nello stato spedizione)
  fatturazione: Party;
  setFatturazione: (p: Party) => void;

  // sorgente per "uguale al destinatario"
  destinatario: Party;
  sameAsDest: boolean;
  setSameAsDest: (v: boolean) => void;

  // allegato fattura (opzionale, disabilitato se delega = true)
  fatturaFile?: File;
  setFatturaFile?: (f?: File) => void;
};

const ORANGE = '#f7911e';
const inputCls =
  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1c3e5e] disabled:bg-slate-50 disabled:text-slate-500';

export default function FatturaCard({
  incoterm,
  setIncoterm,
  valuta,
  setValuta,
  note,
  setNote,
  delega,
  setDelega,
  fatturazione,
  setFatturazione,
  destinatario,
  sameAsDest,
  setSameAsDest,
  fatturaFile,
  setFatturaFile,
}: Props) {
  // Quando "uguale al destinatario" è attivo, copia i dati del destinatario
  React.useEffect(() => {
    if (sameAsDest) setFatturazione(destinatario);
  }, [sameAsDest, destinatario, setFatturazione]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!setFatturaFile) return;
    const f = e.target.files?.[0];
    setFatturaFile(f);
  };

  const set = <K extends keyof Party,>(k: K, v: Party[K]) =>
    setFatturazione({ ...fatturazione, [k]: v });

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold" style={{ color: ORANGE }}>
          Dati fattura
        </h3>

        <div className="flex items-center gap-3">
          <Switch
            checked={sameAsDest}
            onChange={setSameAsDest}
            label="Dati fatturazione uguali ai dati del destinatario"
          />
        </div>
      </div>

      {/* dati anagrafici fatturazione */}
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <input
          className={inputCls}
          placeholder="Ragione sociale"
          value={fatturazione.ragioneSociale}
          onChange={(e) => set('ragioneSociale', e.target.value)}
          disabled={sameAsDest}
        />
        <input
          className={inputCls}
          placeholder="Persona di riferimento"
          value={fatturazione.referente}
          onChange={(e) => set('referente', e.target.value)}
          disabled={sameAsDest}
        />
        <input
          className={inputCls}
          placeholder="Paese"
          value={fatturazione.paese}
          onChange={(e) => set('paese', e.target.value)}
          disabled={sameAsDest}
        />
        <input
          className={inputCls}
          placeholder="Città"
          value={fatturazione.citta}
          onChange={(e) => set('citta', e.target.value)}
          disabled={sameAsDest}
        />
        <input
          className={inputCls}
          placeholder="CAP"
          value={fatturazione.cap}
          onChange={(e) => set('cap', e.target.value)}
          disabled={sameAsDest}
        />
        <input
          className={inputCls}
          placeholder="Telefono"
          value={fatturazione.telefono}
          onChange={(e) => set('telefono', e.target.value)}
          disabled={sameAsDest}
        />
        <input
          className={'md:col-span-2 ' + inputCls}
          placeholder="Indirizzo"
          value={fatturazione.indirizzo}
          onChange={(e) => set('indirizzo', e.target.value)}
          disabled={sameAsDest}
        />
        <input
          className={'md:col-span-2 ' + inputCls}
          placeholder="Partita IVA / Codice Fiscale"
          value={fatturazione.piva}
          onChange={(e) => set('piva', e.target.value)}
          disabled={sameAsDest}
        />
      </div>

      {/* incoterm / valuta su una riga */}
      <div className="mb-3 grid gap-3 md:grid-cols-[1fr_180px]">
        <select
          className={inputCls}
          value={incoterm}
          onChange={(e) => setIncoterm(e.target.value as Incoterm)}
        >
          <option value="DAP">
            DAP - Spedizione a carico del mittente - dazi, oneri e accise a carico del destinatario
          </option>
          <option value="DDP">DDP - Tutto a carico del mittente</option>
          <option value="EXW">EXW - Tutto a carico del destinatario</option>
        </select>

        <select
          className={inputCls}
          value={valuta}
          onChange={(e) => setValuta(e.target.value as Valuta)}
        >
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
        </select>
      </div>

      <textarea
        className={'mb-3 h-28 ' + inputCls}
        placeholder="Note per la fattura"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {/* flusso domanda: delega oppure allega */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={delega}
            onChange={(e) => setDelega(e.target.checked)}
          />
          <span>
            <span className="font-medium">Non ho la fattura</span>, delego a SPST la creazione del documento
          </span>
        </label>

        <div className="flex items-center gap-3">
          {fatturaFile && !delega && (
            <span className="max-w-[260px] truncate text-xs text-slate-500">
              {fatturaFile.name}
            </span>
          )}
          <label
            className={`inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-sm ${
              delega ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-50'
            }`}
          >
            Allega fattura (PDF)
            <input
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={onPick}
              disabled={delega}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
