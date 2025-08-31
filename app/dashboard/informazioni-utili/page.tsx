'use client';

import { FileText, Pallet, Package, Download, ChevronDown } from 'lucide-react';
import { useState } from 'react';

type Guide = {
  icon: 'pallet' | 'package' | 'file';
  title: string;
  description: string;
  href: string;
};

type Faq = { q: string; a: React.ReactNode };

const ORANGE = '#f7911e';

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-xl ring-1"
      style={{ backgroundColor: '#FFF4E6', color: ORANGE, borderColor: 'rgba(247,145,30,0.35)' }}
    >
      {children}
    </div>
  );
}

function InfoCard({ guide }: { guide: Guide }) {
  const icon =
    guide.icon === 'pallet' ? <Pallet className="h-5 w-5" strokeWidth={2.25} /> :
    guide.icon === 'package' ? <Package className="h-5 w-5" strokeWidth={2.25} /> :
    <FileText className="h-5 w-5" strokeWidth={2.25} />;

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <IconWrap>{icon}</IconWrap>
        <div className="min-w-0">
          <h3 className="text-base font-semibold" style={{ color: ORANGE }}>
            {guide.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{guide.description}</p>
          <div className="mt-3 text-right">
            <a
              href={guide.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50"
            >
              <Download className="h-4 w-4" />
              Scarica il PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ item }: { item: Faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b py-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <span className="text-[15px] font-semibold" style={{ color: ORANGE }}>
          {item.q}
        </span>
        <ChevronDown
          className={`mt-0.5 h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          color="#1d3e5e"
        />
      </button>
      {open && <div className="mt-2 text-[15px] leading-relaxed text-[#1d3e5e]">{item.a}</div>}
    </div>
  );
}

export default function InformazioniUtiliPage() {
  const guides: Guide[] = [
    {
      icon: 'pallet',
      title: 'Guida alla Preparazione del Pallet',
      description:
        'Scopri come preparare un pallet in modo corretto per evitare costi aggiuntivi, ritardi e rifiuti da parte del corriere.',
      href:
        'https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/68552b0539a032b44d4d54c5_GUIDA%20PALLET%20SNS.pdf',
    },
    {
      icon: 'package',
      title: 'Guida alla Preparazione dei Pacchi',
      description:
        'Regole fondamentali per imballare correttamente pacchi di piccole dimensioni (anche vino) ed evitare danni e costi extra.',
      href:
        'https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/6855774c7ac5278ddcbb9003_GUIDA%20PACCHI.pdf',
    },
    {
      icon: 'file',
      title: 'Regole di Compliance e Accise',
      description:
        'Tutto ciò che serve sapere su accise, responsabilità del mittente e regole base di compliance per export conformi.',
      href:
        'https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/6855352a2db24df3341935b0_COMPLIANCE%20PDF.pdf',
    },
  ];

  const faqs: Faq[] = [
    {
      q: 'Quali documenti devo attaccare sul pacco?',
      a: (
        <p>
          <strong>L&apos;etichetta di spedizione</strong> e, se richiesto,{' '}
          <strong>la dichiarazione di libera esportazione</strong> e la{' '}
          <strong>fattura proforma</strong>. Tutti devono essere{' '}
          <strong>visibili, leggibili e non coperti</strong>.
        </p>
      ),
    },
    {
      q: 'Che tempi di consegna ci sono?',
      a: (
        <p>
          In Europa: <strong>24–72h</strong> in base alla destinazione e al servizio scelto.
          Extra-UE: <strong>2–7 giorni lavorativi</strong>, salvo ritardi doganali.
        </p>
      ),
    },
    {
      q: 'Come funziona il servizio Express 12?',
      a: (
        <p>
          Consegna <strong>entro le 12:00</strong> del giorno lavorativo successivo al ritiro,{' '}
          <strong>solo nelle zone coperte</strong>.
        </p>
      ),
    },
    {
      q: "Come funziona l'Express Internazionale?",
      a: (
        <p>
          Servizio estero più veloce: include <strong>ritiro prioritario</strong>,{' '}
          <strong>sdoganamento rapido</strong> e <strong>consegna urgente</strong> in 1–3 giorni verso i principali Paesi.
        </p>
      ),
    },
    {
      q: 'Cosa è una dichiarazione di libera esportazione?',
      a: (
        <p>
          Documento che attesta che la merce può uscire dall’UE <strong>senza restrizioni</strong>.
          Serve per spedizioni <strong>extra-UE</strong>.
        </p>
      ),
    },
    {
      q: 'Cosa succede se non pago le accise?',
      a: (
        <p>
          La merce può essere <strong>bloccata, respinta o sequestrata</strong>. SPST verifica che
          le accise siano <strong>assolte o sospese regolarmente</strong>.
        </p>
      ),
    },
    {
      q: 'Chi paga i costi accessori?',
      a: (
        <p>
          Generalmente il <strong>mittente</strong>, salvo accordi diversi. Possono derivare da{' '}
          <strong>fuori formato, giacenze (anche in dogana), errori d’imballaggio</strong>.
        </p>
      ),
    },
    {
      q: 'Cosa sono gli Incoterm?',
      a: (
        <p>
          Termini internazionali che definiscono <strong>chi paga cosa</strong> (trasporto,
          assicurazione, dazi, responsabilità). Vanno concordati prima della spedizione.
        </p>
      ),
    },
    {
      q: 'Chi paga la dogana?',
      a: (
        <p>
          Dipende dall’Incoterm. Di norma paga <strong>l’importatore (destinatario)</strong>, ma può
          essere a carico <strong>del mittente</strong> se previsto.
        </p>
      ),
    },
    {
      q: 'Cosa è una dogana?',
      a: (
        <p>
          Autorità che <strong>controlla e autorizza</strong> l’ingresso/uscita delle merci. Può
          richiedere documenti e applicare <strong>dazi, blocchi o ispezioni</strong>.
        </p>
      ),
    },
    {
      q: 'Come faccio a prenotare un ritiro con SPST?',
      a: (
        <p>
          Puoi <strong>compilare il modulo online</strong> o inviare i dati via email/WhatsApp.
          Riceverai <strong>lettera di vettura e istruzioni</strong>.
        </p>
      ),
    },
    {
      q: 'Posso spedire vino a privati all’estero (B2C)?',
      a: (
        <p>
          Sì, verso <strong>alcuni Paesi autorizzati</strong>. SPST verifica la fattibilità e{' '}
          <strong>gestisce le pratiche necessarie</strong>.
        </p>
      ),
    },
    {
      q: 'È obbligatorio includere una fattura proforma?',
      a: (
        <p>
          <strong>Sì</strong> per extra-UE. In UE dipende da contenuto e Paese. SPST può{' '}
          <strong>generarla automaticamente</strong> quando necessaria.
        </p>
      ),
    },
    {
      q: 'Che cos’è l’accisa assolta?',
      a: (
        <p>
          Le <strong>tasse sull’alcol sono già state pagate in Italia</strong>. Obbligatoria per
          B2C o vino senza e-DAS.
        </p>
      ),
    },
    {
      q: 'Posso usare una mia etichetta di spedizione?',
      a: (
        <p>
          <strong>No</strong>. L’etichetta è generata dal nostro sistema <strong>per ogni
          spedizione</strong> e va applicata così com’è.
        </p>
      ),
    },
    {
      q: 'Come traccio la mia spedizione?',
      a: (
        <p>
          Ricevi un <strong>link di tracking</strong> alla partenza. In alternativa, nell’{' '}
          <strong>Area Riservata SPST</strong> vedi stato e documenti.
        </p>
      ),
    },
    {
      q: 'Posso spedire prodotti diversi nello stesso collo?',
      a: (
        <p>
          Sì, se <strong>compatibili e ben separati</strong>. Ogni prodotto va{' '}
          <strong>dichiarato correttamente</strong> in documentazione.
        </p>
      ),
    },
    {
      q: 'È possibile spedire con temperatura controllata?',
      a: (
        <p>
          Al momento no: servizi <strong>espresso standard</strong>. Per merce delicata consigliamo{' '}
          <strong>packaging termico professionale</strong>.
        </p>
      ),
    },
    {
      q: 'SPST si occupa anche dello sdoganamento?',
      a: (
        <p>
          Sì. Offriamo assistenza completa e, dove incluso, <strong>gestiamo lo sdoganamento</strong>{' '}
          e il flusso documentale.
        </p>
      ),
    },
    {
      q: 'Posso assicurare la mia spedizione?',
      a: (
        <p>
          Certo. Possibile assicurazione sul <strong>valore dichiarato</strong> (smarrimento, furto,
          danneggiamento).
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Documenti e informazioni utili</h2>

      {/* Cards documentazione */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {guides.map((g) => (
          <InfoCard key={g.title} guide={g} />
        ))}
      </div>

      {/* FAQ */}
      <section className="rounded-2xl border bg-white p-6">
        <h3 className="mb-2 text-xl font-bold" style={{ color: '#1d3e5e' }}>
          Domande Frequenti
        </h3>
        <div className="divide-y">
          {faqs.map((f, i) => (
            <FaqItem key={i} item={f} />
          ))}
        </div>
      </section>
    </div>
  );
}
