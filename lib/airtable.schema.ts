// lib/airtable.schema.ts

// --- Tabelle ---------------------------------------------------------------
export const TABLE = {
  SPED: process.env.AIRTABLE_TABLE_SPEDIZIONI_WEBAPP || 'SpedizioniWebApp',
  COLLI: process.env.AIRTABLE_TABLE_SPED_COLLI || 'SPED_COLLI',
  PL: process.env.AIRTABLE_TABLE_SPED_PL || 'SPED_PL',
} as const;

// --- Campi tabella principale: SpedizioniWebApp ----------------------------
export const F = {
  // Generali
  Stato: 'Stato',
  Sorgente: 'Tipo',                              // ⬅️ rinominato da "Tipo (Vino, Altro)"
  Tipo: 'Sottotipo',                             // ⬅️ rinominato da "Sottotipo (B2B, B2C, Sample)"
  Formato: 'Formato',
  Contenuto: 'Contenuto Colli',
  RitiroData: 'Ritiro – Data',
  RitiroNote: 'Ritiro – Note',
  CreatoDaEmail: 'Creato da',
  Corriere: 'Corriere',
  Tracking: 'Tracking Number',

  // Mittente (prefisso “Mittente - …”)
  M_RS: 'Mittente - Ragione Sociale',
  M_REF: 'Mittente - Referente',
  M_PAESE: 'Mittente - Paese',
  M_CITTA: 'Mittente - Città',
  M_CAP: 'Mittente - CAP',
  M_INDIRIZZO: 'Mittente - Indirizzo',
  M_TEL: 'Mittente - Telefono',
  M_PIVA: 'Mittente - P.IVA/CF',

  // Destinatario (prefisso “Destinatario - …”)
  D_RS: 'Destinatario - Ragione Sociale',
  D_REF: 'Destinatario - Referente',
  D_PAESE: 'Destinatario - Paese',
  D_CITTA: 'Destinatario - Città',
  D_CAP: 'Destinatario - CAP',
  D_INDIRIZZO: 'Destinatario - Indirizzo',
  D_TEL: 'Destinatario - Telefono',
  D_PIVA: 'Destinatario - P.IVA/CF',

  // Fatturazione (prefisso “FATT …”)
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

// --- Campi tabella figlia: SPED_COLLI --------------------------------------
export const FCOLLO = {
  LinkSped: 'Spedizione',
  L: 'Lunghezza (cm)',
  W: 'Larghezza (cm)',
  H: 'Altezza (cm)',
  Peso: 'Peso (kg)',
} as const;

// --- Campi tabella figlia: SPED_PL (packing list vino) ----------------------
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
