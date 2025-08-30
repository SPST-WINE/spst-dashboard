// ====== CREAZIONE SPEDIZIONE ======
type Collo = { lunghezza_cm: number; larghezza_cm: number; altezza_cm: number; peso_kg: number };
type PackingItem = { descrizione: string; quantita: number; valore_unit: number; volume_l?: number; gradazione?: number };

export async function createSpedizione(input: {
  email: string;
  tipo_generale: 'VINO' | 'ALTRO';
  tipo_spedizione: 'B2B' | 'B2C' | 'Campionatura';
  mittente: { ragione: string; paese: string; indirizzo: string; cap: string; citta: string; telefono: string; referente?: string; piva_cf?: string };
  destinatario: { ragione: string; paese: string; indirizzo: string; cap: string; citta: string; telefono: string; referente?: string; piva_cf?: string };
  colli: Collo[];
  formato: 'Pallet' | 'Pacco';
  note_ritiro?: string;
  contenuto?: string;               // usato per ALTRO
  data_ritiro?: string;             // yyyy-mm-dd
  fattura?: {
    incoterm: 'DAP' | 'DDP' | 'EXW';
    valuta: 'EUR' | 'USD' | 'GBP' | 'CHF' | string;
    note?: string;
    url?: string;                   // link a proforma/commerciale (se disponibile)
    delega_creazione?: boolean;     // se true, SPST crea documento
  };
  packingList?: PackingItem[];      // usato per VINO
}) {
  const table = encodeURIComponent(TBL_SPEDIZIONI);
  const url = `${API}/${AIRTABLE_BASE}/${table}`;

  const totColli = input.colli?.length || 0;
  const totPeso = (input.colli || []).reduce((s, c) => s + (Number(c.peso_kg) || 0), 0);

  const fields: Record<string, any> = {
    'Mail Cliente': input.email,
    'Tipo Generale': input.tipo_generale,             // VINO | ALTRO
    'Tipo Spedizione': input.tipo_spedizione,         // B2B | B2C | Campionatura
    // Mittente
    'Mittente': input.mittente.ragione,
    'Paese Mittente': input.mittente.paese,
    'Indirizzo Mittente': input.mittente.indirizzo,
    'CAP Mittente': input.mittente.cap,
    'Città Mittente': input.mittente.citta,
    'Telefono Mittente': input.mittente.telefono,
    'Referente Mittente': input.mittente.referente || '',
    'PIVA/CF Mittente': input.mittente.piva_cf || '',
    // Destinatario
    'Destinatario': input.destinatario.ragione,
    'Paese Destinatario': input.destinatario.paese,
    'Indirizzo Destinatario': input.destinatario.indirizzo,
    'CAP Destinatario': input.destinatario.cap,
    'Città Destinatario': input.destinatario.citta,
    'Telefono Destinatario': input.destinatario.telefono,
    'Referente Destinatario': input.destinatario.referente || '',
    'PIVA/CF Destinatario': input.destinatario.piva_cf || '',
    // Colli
    'Numero Colli': totColli,
    'Peso Totale kg': Number(totPeso.toFixed(2)),
    'Colli JSON': JSON.stringify(input.colli || []),
    'Formato': input.formato,                           // Pallet | Pacco
    'Note Ritiro': input.note_ritiro || '',
    'Contenuto Colli': input.contenuto || '',
    'Data Ritiro': input.data_ritiro || '',
    // Fattura
    'Incoterm': input.fattura?.incoterm || '',
    'Valuta': input.fattura?.valuta || '',
    'Note Fattura': input.fattura?.note || '',
    'Fattura URL': input.fattura?.url || '',
    'Delega Creazione Fattura': !!input.fattura?.delega_creazione,
  };

  if (input.tipo_generale === 'VINO') {
    fields['Packing List JSON'] = JSON.stringify(input.packingList || []);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...HDRS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!res.ok) throw new Error('Airtable createSpedizione failed');
  return res.json();
}
