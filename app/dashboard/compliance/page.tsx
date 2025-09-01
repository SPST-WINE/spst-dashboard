'use client';

import { useMemo, useState } from 'react';
import {
  ShieldCheck, AlertTriangle, FileText, Upload, Globe, Building2,
  CheckCircle2, XCircle, Download, PackageSearch, ClipboardList
} from 'lucide-react';

type Tipo = 'B2B' | 'B2C' | 'Sample';
type Status = 'ok' | 'warn' | 'bad';

type CountryRule = {
  code: 'DE' | 'FR' | 'US';
  name: string;
  b2c: boolean;
  note: string;
  /** limite indicativo in litri (opzionale) */
  maxLitri?: number;
};

const SPST_ORANGE = 'text-spst-orange';
const BRAND_BLUE = '#1c3e5e';

const PAESI: CountryRule[] = [
  { code: 'DE', name: 'Germania', b2c: true,  note: 'B2C consentito con accisa assolta o schema OSS (se applicabile).', maxLitri: 90 },
  { code: 'FR', name: 'Francia',  b2c: true,  note: 'Obbligo accisa assolta per B2C; e-DAS se in sospensione.',        maxLitri: 90 },
  { code: 'US', name: 'Stati Uniti', b2c: false, note: 'Solo B2B con importatore autorizzato (licenza TTB necessaria).' },
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className={`mb-3 text-sm font-semibold ${SPST_ORANGE}`}>{title}</h3>
      {children}
    </div>
  );
}

function Badge({ status, children }: { status: Status; children: React.ReactNode }) {
  const map = {
    ok:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
    warn: 'bg-amber-50 text-amber-700 ring-amber-200',
    bad:  'bg-rose-50 text-rose-700 ring-rose-200',
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ring-1 ${map[status]}`}>
      {status === 'ok' && <CheckCircle2 size={14} />}
      {status === 'warn' && <AlertTriangle size={14} />}
      {status === 'bad' && <XCircle size={14} />}
      {children}
    </span>
  );
}

function ComplianceScore({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const dash = `${pct},100`;
  return (
    <Card title="Stato compliance">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16">
          <svg viewBox="0 0 36 36" className="h-16 w-16">
            <path stroke="#e5e7eb" strokeWidth="4" fill="none" d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32"/>
            <path stroke="#10b981" strokeWidth="4" fill="none" strokeDasharray={dash} d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32"/>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{pct}%</span>
        </div>
        <div className="text-sm text-slate-600">
          <p>Completa i requisiti per portare la spedizione a livello <span className="font-medium text-slate-900">compliant</span>.</p>
          <ul className="mt-2 list-disc pl-4">
            <li>Documenti obbligatori</li>
            <li>Verifica destinatario</li>
            <li>Regole del Paese</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

export default function CompliancePage() {
  // Wizard preliminare
  const [tipo, setTipo] = useState<Tipo>('B2B');
  const [dest, setDest] = useState<CountryRule['code']>('DE');
  const [abv, setAbv] = useState<number>(12);
  const [litri, setLitri] = useState<number>(9);

  // Checklist documenti
  const [docProforma, setDocProforma] = useState(false);
  const [docLiberaExp, setDocLiberaExp] = useState(false);
  const [docEDAS, setDocEDAS] = useState(false);
  const [docAccisaAssolta, setDocAccisaAssolta] = useState(false);
  const [docLicenzaImp, setDocLicenzaImp] = useState(false);

  // Verifica destinatario (mock)
  const [piva, setPiva] = useState('');
  const [eori, setEori] = useState('');
  const [importerOk, setImporterOk] = useState(false);

  const paese = useMemo(() => PAESI.find(p => p.code === dest)!, [dest]);

  const esito = useMemo(() => {
    if (tipo === 'B2C' && !paese.b2c) {
      return { status: 'bad' as Status, msg: 'B2C non consentito verso questo Paese.' };
    }
    if (tipo !== 'B2C' && paese.code === 'US' && !importerOk) {
      return { status: 'warn' as Status, msg: 'Serve importatore abilitato; verifica i dati.' };
    }
    if (typeof paese.maxLitri === 'number' && litri > paese.maxLitri) {
      return { status: 'warn' as Status, msg: `Quantità oltre la soglia suggerita (${paese.maxLitri} L).` };
    }
    return { status: 'ok' as Status, msg: 'Nessun blocco preliminare rilevato.' };
  }, [tipo, paese, litri, importerOk]);

  const docObbligatori = useMemo(() => {
    const arr = [
      { id: 'proforma', label: 'Fattura commerciale / proforma', checked: docProforma, set: setDocProforma },
      { id: 'libera',   label: 'Dichiarazione di libera esportazione (extra-UE)', checked: docLiberaExp, set: setDocLiberaExp },
      { id: 'edas',     label: 'e-DAS/EMCS (sospensione accisa)', checked: docEDAS, set: setDocEDAS },
      { id: 'accisa',   label: 'Prova accisa assolta (B2C UE)', checked: docAccisaAssolta, set: setDocAccisaAssolta },
      { id: 'licenza',  label: 'Licenza importatore / TTB (alcuni Paesi)', checked: docLicenzaImp, set: setDocLicenzaImp },
    ] as const;

    return arr.filter(d => {
      if (d.id === 'libera')  return paese.code === 'US';                 // extra-UE (esempio)
      if (d.id === 'accisa')  return tipo === 'B2C' && paese.b2c;         // B2C UE
      if (d.id === 'edas')    return tipo === 'B2B' && paese.code !== 'US';
      if (d.id === 'licenza') return paese.code === 'US' || (!paese.b2c && tipo !== 'B2C');
      return true; // proforma
    });
  }, [tipo, paese, docProforma, docLiberaExp, docEDAS, docAccisaAssolta, docLicenzaImp]);

  const score = useMemo(() => {
    const base = esito.status === 'ok' ? 40 : esito.status === 'warn' ? 20 : 10;
    const done = docObbligatori.filter(d => d.checked).length;
    const max = docObbligatori.length || 1;
    return base + Math.round((done / max) * 60);
  }, [esito.status, docObbligatori]);

  function simulaVerifica() {
    const ivaOk = piva.replace(/\W/g, '').length >= 10;
    const eoriOk = /^[A-Z]{2}/i.test(eori);
    setImporterOk(ivaOk && eoriOk);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: BRAND_BLUE }}>Compliance</h2>

      {/* score + wizard */}
      <div className="grid gap-4 md:grid-cols-[360px_1fr]">
        <ComplianceScore score={score} />

        <Card title="Verifica preliminare">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Tipologia</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as Tipo)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="B2B">B2B — Azienda</option>
                <option value="B2C">B2C — Privato</option>
                <option value="Sample">Sample — Campionatura</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Destinazione</label>
              <select
                value={dest}
                onChange={e => setDest(e.target.value as CountryRule['code'])}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                {PAESI.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Grado alcolico (% vol)</label>
              <input
                type="number" inputMode="decimal" min={0} step="0.1"
                value={abv || ''} onChange={e => setAbv(Number(e.target.value))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Quantità (L totali)</label>
              <input
                type="number" inputMode="decimal" min={0} step="0.1"
                value={litri || ''} onChange={e => setLitri(Number(e.target.value))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg border px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <PackageSearch size={16} className="text-slate-500" />
              <span className="text-slate-700">{esito.msg}</span>
            </div>
            <Badge status={esito.status}>esito</Badge>
          </div>
        </Card>
      </div>

      {/* Documenti + Verifica destinatario */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Documenti obbligatori / consigliati">
          <ul className="space-y-2">
            {docObbligatori.map(d => (
              <li key={d.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <FileText size={16} className="text-slate-500" />
                  {d.label}
                </div>
                <input
                  type="checkbox"
                  checked={d.checked}
                  onChange={e => d.set(e.target.checked)}
                  className="h-4 w-4 accent-[var(--brand-blue,#1c3e5e)]"
                />
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center justify-between">
            <label className="text-xs text-slate-600">Allega documenti (PDF)</label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50">
              <Upload size={16} />
              Carica PDF
              <input type="file" accept="application/pdf" className="hidden" />
            </label>
          </div>
        </Card>

        <Card title="Verifica destinatario">
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">P. IVA / VAT</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={piva} onChange={e => setPiva(e.target.value)}
                    placeholder="IT12345678901"
                    className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">EORI</label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={eori} onChange={e => setEori(e.target.value)}
                    placeholder="IT1234567890"
                    className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={simulaVerifica}
                className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
              >
                <ClipboardList size={16} /> Simula verifica
              </button>
              {importerOk ? (
                <Badge status="ok">dati ok</Badge>
              ) : (
                <Badge status="warn">verifica richiesta</Badge>
              )}
            </div>

            <p className="text-xs text-slate-500">
              * In seguito colleghiamo verifiche reali (VIES, EORI, licenze) lato server.
            </p>
          </div>
        </Card>
      </div>

      {/* Regole Paese + Template */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Regole per Paese (riepilogo)">
          <div className="flex items-center gap-2 text-sm">
            <Globe size={16} className="text-slate-500" />
            <span className="font-medium text-slate-800">{paese.name}</span>
            <Badge status={paese.b2c ? 'ok' : 'bad'}>
              {paese.b2c ? 'B2C consentito' : 'B2C non consentito'}
            </Badge>
          </div>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            {typeof paese.maxLitri === 'number' && <li>Limite indicativo: {paese.maxLitri} L totali</li>}
            <li>{paese.note}</li>
            <li>Weekend: ritiro non disponibile (Sa/Do)</li>
          </ul>
        </Card>

        <Card title="Template & risorse">
          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href="https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/68552b0539a032b44d4d54c5_GUIDA%20PALLET%20SNS.pdf"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              <Download size={16} /> Guida pallet
            </a>
            <a
              href="https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/6855774c7ac5278ddcbb9003_GUIDA%20PACCHI.pdf"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              <Download size={16} /> Guida pacchi
            </a>
            <a
              href="https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/6855352a2db24df3341935b0_COMPLIANCE%20PDF.pdf"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              <Download size={16} /> Regole accise
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              <Download size={16} /> Proforma (template)
            </a>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            A breve aggiungiamo generatori guidati (proforma, dichiarazione, delega SPST).
          </p>
        </Card>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 text-emerald-600" size={18} />
          <p className="text-xs text-slate-600">
            Le indicazioni hanno valore informativo. La responsabilità della compliance rimane al mittente.
            SPST fornisce supporto operativo e documentale.
          </p>
        </div>
      </div>
    </div>
  );
}
