// lib/airtable.schema.ts

export const TABLE = {
  SPED: process.env.AIRTABLE_TABLE_SPEDIZIONI_WEBAPP || 'SpedizioniWebApp',
  COLLI: process.env.AIRTABLE_TABLE_SPED_COLLI || 'SPED_COLLI',
  PL: process.env.AIRTABLE_TABLE_SPED_PL || 'SPED_PL',
} as const;

/**
 * Elenco "candidati" per ogni campo, così troviamo quello realmente presente
 * nel tuo base (trattini normali vs en-dash, virgolette dritte vs curve, ecc.).
 */
export const CANDIDATES = {
  // Generali
  Sorgente: ['Tipo (Vino, Altro)', 'Tipo', 'Sorgente'],
  Tipo: ['Sottotipo (B2B, B2C, Sample)', 'Sottotipo', 'Tipo spedizione', 'Tipo Spedizione'],
  Formato: ['Formato'],
  Contenuto: ['Contenuto Colli', 'Contenuto'],
  RitiroData: ['Ritiro - Data', 'Ritiro – Data', 'Data Ritiro'],
  RitiroNote: ['Ritiro - Note', 'Ritiro – Note', 'Note Ritiro'],
  CreatoDaEmail: ['Creato da', 'Creato da (email)', 'CreatoDa'],

  // Mittente
  M_RS: ['Mittente - Ragione Sociale'],
  M_REF: ['Mittente - Referente'],
  M_PAESE: ['Mittente - Paese'],
  M_CITTA: ['Mittente - Città'],
  M_CAP: ['Mittente - CAP'],
  M_INDIRIZZO: ['Mittente - Indirizzo'],
  M_TEL: ['Mittente - Telefono'],
  M_PIVA: ['Mittente - P.IVA/CF'],

  // Destinatario
  D_RS: ['Destinatario - Ragione Sociale'],
  D_REF: ['Destinatario - Referente'],
  D_PAESE: ['Destinatario - Paese'],
  D_CITTA: ['Destinatario - Città'],
  D_CAP: ['Destinatario - CAP'],
  D_INDIRIZZO: ['Destinatario - Indirizzo'],
  D_TEL: ['Destinatario - Telefono'],
  D_PIVA: ['Destinatario - P.IVA/CF'],
  D_AbilImport: [
    "Destinatario abilitato all’import",
    "Destinatario abilitato all'import",
    "Destinatario abilitato import"
  ],

  // Fatturazione
  F_RS: ['FATT Ragione sociale'],
  F_REF: ['FATT Referente'],
  F_PAESE: ['FATT Paese'],
  F_CITTA: ['FATT Città'],
  F_CAP: ['FATT CAP'],
  F_INDIRIZZO: ['FATT Indirizzo'],
  F_TEL: ['FATT Telefono'],
  F_PIVA: ['FATT PIVA/CF'],
  F_SAME_DEST: ['FATT Uguale a Destinatario'],
  Incoterm: ['Incoterm'],
  Valuta: ['Valuta'],
  NoteFatt: ['Note Fattura'],
  F_Delega: ['Fattura - Delega a SPST', 'Fattura – Delega a SPST', 'Delega Fattura'],
  F_Att: ['Fattura - Allegato Cliente', 'Fattura – Allegato Cliente'],

  // Extra
  ID_Sped: ['ID Spedizione', 'Codice Spedizione'],

  // Link figli
  LinkColli: ['COLLI (link)', 'COLLI', 'Link COLLI'],
  LinkPL: ['PL (link)', 'PL', 'Link PL'],
} as const;

/** Campi COLLI (candidati) */
export const CAND_COLLO = {
  LinkSped: ['Spedizione', 'ID Spedizione', 'Link Spedizione'],
  N: ['#', 'N', 'Numero'],
  L: ['Lunghezza (cm)', 'L'],
  W: ['Larghezza (cm)', 'W'],
  H: ['Altezza (cm)', 'H'],
  Peso: ['Peso (kg)', 'Peso'],
} as const;

/** Campi PL (candidati) */
export const CAND_PL = {
  LinkSped: ['Spedizione', 'ID Spedizione', 'Link Spedizione'],
  Etichetta: ['Etichetta'],
  Bottiglie: ['Bottiglie', 'Quantità bottiglie'],
  FormatoL: ['Formato (L)', 'Formato L', 'Formato_litri'],
  Grad: ['Gradazione (% vol)', 'Grad. %'],
  Prezzo: ['Prezzo'],
  Valuta: ['Valuta'],
  PesoNettoBott: ['Peso netto bott. (kg)'],
  PesoLordoBott: ['Peso lordo bott. (kg)'],
} as const;
