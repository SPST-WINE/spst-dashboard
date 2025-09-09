'use client';

import { FileText, Boxes, Package, Download } from 'lucide-react';
import Link from 'next/link';

// Mini util per classi
function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

type Guide = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const guides: Guide[] = [
  {
    title: 'Guida alla Preparazione del Pallet',
    description:
      'Scopri come preparare un pallet in modo corretto per evitare costi aggiuntivi, ritardi e rifiuti da parte del corriere.',
    href: 'https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/68552b0539a032b44d4d54c5_GUIDA%20PALLET%20SNS.pdf',
    icon: Boxes, // <— sostituisce Pallet
  },
  {
    title: 'Guida alla Preparazione dei Pacchi',
    description:
      'Le regole fondamentali per imballare correttamente pacchi di piccole dimensioni, compresi quelli contenenti vino.',
    href: 'https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/6855774c7ac5278ddcbb9003_GUIDA%20PACCHI.pdf',
    icon: Package,
  },
  {
    title: 'Regole di Compliance e Accise',
    description:
      'Tutto ciò che c’è da sapere su accise, responsabilità del mittente e regole base di compliance per l’export conforme.',
    href: 'https://cdn.prod.website-files.com/6800cc3b5f399f3e2b7f2ffa/6855352a2db24df3341935b0_COMPLIANCE%20PDF.pdf',
    icon: FileText,
  },
];

const faqs: Array<{ q: string; a: string }> = [
  { q: 'Quali documenti devo attaccare sul pacco?',
    a: "L'etichetta di spedizione e, se richiesto, la dichiarazione di libera esportazione e la fattura proforma. Tutti devono essere visibili e leggibili." },
  { q: 'Che tempi di consegna ci sono?',
    a: 'In Europa 24–72h; extra-UE 2–7 giorni lavorativi salvo ritardi doganali.' },
  { q: 'Come funziona il servizio Express 12?',
    a: 'Consegna entro le 12:00 del giorno lavorativo successivo, solo nelle zone coperte.' },
  { q: "Come funziona l'Express Internazionale?",
    a: 'Servizio più veloce per l’estero: ritiro prioritario, sdoganamento rapido, consegna 1–3 giorni nei Paesi principali.' },
  { q: 'Cosa è una dichiarazione di libera esportazione?',
    a: "Documento che attesta che la merce può uscire dall’UE senza restrizioni. Necessario per spedizioni extra-UE." },
  { q: 'Cosa succede se non pago le accise?',
    a: 'La merce può essere bloccata, respinta o sequestrata. Le accise devono essere assolte o sospese regolarmente.' },
  { q: 'Chi paga i costi accessori?',
    a: 'Di norma il mittente (salvo accordi). Nascono da fuori formato, giacenze o errori di imballo.' },
  { q: 'Cosa sono gli Incoterm?',
    a: 'Termini internazionali che definiscono chi paga cosa (trasporto, assicurazione, dazi, responsabilità). DDP = Tutto a carico del mittente, DAP = Spedizione a carico del mittente, dazi ed oneri doganali a carico del destinatario, EXW = Tutto a carico del destinatario' },
  { q: 'Chi paga la dogana?',
    a: "Dipende dall'Incoterm. In genere l’importatore, ma può essere a carico del mittente se previsto." },
  { q: 'Cosa è una dogana?',
    a: 'Autorità che controlla l’ingresso/uscita delle merci e può applicare dazi, blocchi o ispezioni.' },
  { q: 'Come faccio a prenotare un ritiro con SPST?',
    a: 'Compila il modulo online o invia i dati via email/WhatsApp. Ti inviamo lettera di vettura e istruzioni.' },
  { q: 'Posso spedire vino a privati all’estero (B2C)?',
    a: 'Sì, verso alcuni Paesi autorizzati. SPST verifica la fattibilità e gestisce le pratiche necessarie.' },
  { q: 'È obbligatorio includere una fattura proforma?',
    a: 'Sì per extra-UE. In UE dipende da contenuto e Paese. SPST può generarla per te quando serve.' },
  { q: 'Che cos’è l’accisa assolta?',
    a: 'Tasse sull’alcol già pagate in Italia. Obbligatoria per vendite B2C o spedizioni senza e-DAS.' },
  { q: 'Posso usare una mia etichetta di spedizione?',
    a: 'No. L’etichetta viene generata dal nostro sistema e va applicata così com’è.' },
  { q: 'Come traccio la mia spedizione?',
    a: 'Ricevi un link di tracking; in alternativa accedi alla tua area riservata SPST.' },
  { q: 'Posso spedire prodotti diversi nello stesso collo?',
    a: 'Sì, se compatibili e ben separati. Ogni prodotto va dichiarato correttamente.' },
  { q: 'È possibile spedire con temperatura controllata?',
    a: 'Al momento no. Consigliamo packaging termico professionale per merce delicata.' },
  { q: 'SPST si occupa anche dello sdoganamento?',
    a: 'Sì, offriamo assistenza e, dove incluso, gestiamo direttamente lo sdoganamento.' },
  { q: 'Posso assicurare la mia spedizione?',
    a: 'Sì, assicurazione sul valore dichiarato (smarrimento, furto, danneggiamento).' },
];

export default function InfoUtiliPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Documenti &amp; informazioni utili</h2>

      {/* Cards guide */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {guides.map((g) => (
          <div
            key={g.title}
            className="rounded-2xl border bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <g.icon className="h-6 w-6 text-[#F7911E]" strokeWidth={2.25} />
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-800">
                  {g.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{g.description}</p>
              </div>
            </div>
            <div className="mt-4 text-right">
              <Link
                href={g.href}
                target="_blank"
                className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800"
              >
                <Download className="h-4 w-4" />
                Scarica PDF
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-800">Domande frequenti</h3>
        <div className="divide-y">
          {faqs.map(({ q, a }, i) => (
            <details key={i} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#F7911E]">
                <span>{q}</span>
                <span
                  className={cn(
                    'ml-3 inline-block text-[10px] text-slate-500 transition-transform',
                    'group-open:rotate-180'
                  )}
                >
                  ▾
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
