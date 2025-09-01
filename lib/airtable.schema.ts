// lib/airtable.schema.ts
// Mappa *esatta* dei nomi campo Airtable (usa il trattino ASCII "-")

export const TABLE = {
  SPED: process.env.AIRTABLE_TABLE_SPEDIZIONI_WEBAPP || 'SpedizioniWebApp',
  COLLI: process.env.AIRTABLE_TABLE_SPED_COLLI || 'SPED_COLLI',
  PL: process.env.AIRTABLE_TABLE_SPED_PL || 'SPED_PL',
} as const;

export const F = {
  // Generali
  Stato: 'Stato',
  Sorgente: 'Tipo (Vino, Altro)',
  Tipo: 'Sottotipo (B2B, B2C, Sample)',
  Formato: 'Formato',
  Contenuto: 'Contenuto Colli',
  RitiroData: 'Ritiro - Data',      // <<— TRATTINO ASCII
  RitiroNote: 'Ritiro - Note',      // <<— TRATTINO ASCII
  CreatoDaEmail: 'Creato da',
  Corriere: 'Corriere',
  Tracking: 'Tracking Number',

  // Mittente
  M_RS: 'Mittente - Ragione Sociale',
  M_REF: 'Mittente - Referente',
  M_PAESE: 'Mittente - Paese',
  M_CITTA: 'Mittente - Città',
  M_CAP: 'Mittente - CAP',
  M_INDIRIZZO: 'Mittente - Indirizzo',
  M_TEL: 'Mittente - Telefono',
  M_PIVA: 'Mittente - P.IVA/CF',

  // Destinatario
  D_RS: 'Destinatario - Ragione Sociale',
  D_REF: 'Destinatario - Referente',
  D_PAESE: 'Destinatario - Paese',
  D_CITTA: 'Destinatario - Città',
  D_CAP: 'Destinatario - CAP',
  D_INDIRIZZO: 'Destinatario - Indirizzo',
  D_TEL: 'Destinatario - Telefono',
  D_PIVA: 'Destinatario - P.IVA/CF',

  // Fatturazione
  F_RS: 'FATT Ragione sociale',
  F_REF: 'FATT Referente',
  F_PAESE: 'FATT Paese',
  F_CITTA: 'FATT Città',
  F_CAP: 'FATT CAP',
  F_INDIRIZZO: 'FATT Indirizzo',
  F_TEL: 'FATT Telefono',
  F_PIVA: 'FATT PIVA/CF',
  F_SAME_DEST: 'FATT Uguale a Destinatario',
  Incoterm: 'Incoterm',
  Valuta: 'Valuta',
  NoteFatt: 'Note Fattura',
  F_Delega: 'Fattura – Delega a SPST',
  F_Att: 'Fattura – Allegato Cliente',

  // Allegati spedizione
  LDV: 'Allegato LDV',
  DLE: 'Allegato DLE',
  Fattura: 'Allegato Fattura',
  ATT1: 'Allegato 1',
  ATT2: 'Allegato 2',
  ATT3: 'Allegato 3',

  // Link a tabelle figlie
  LinkColli: 'COLLI (link)',
  LinkPL: 'PL (link)',
} as const;

export const FCOLLO = {
  LinkSped: 'Spedizione',
  L: 'Lunghezza (cm)',
  W: 'Larghezza (cm)',
  H: 'Altezza (cm)',
  Peso: 'Peso (kg)',
} as const;

export const FPL = {
  LinkSped: 'Spedizione',
  Etichetta: 'Etichetta',
  Bottiglie: 'Bottiglie',
  FormatoL: 'Formato (L)',
  Grad: 'Gradazione (% vol)',
  Prezzo: 'Prezzo',
  Valuta: 'Valuta',
  PesoNettoBott: 'Peso netto bott. (kg)',
  PesoLordoBott: 'Peso lordo bott. (kg)',
} as const;
