// lib/airtable.schema.ts

// --- Tabelle ---------------------------------------------------------------
export const TABLE = {
  SPED: process.env.AIRTABLE_TABLE_SPEDIZIONI_WEBAPP || 'SpedizioniWebApp',
  COLLI: process.env.AIRTABLE_TABLE_SPED_COLLI || 'SPED_COLLI',
  PL: process.env.AIRTABLE_TABLE_SPED_PL || 'SPED_PL',
  UTENTI: process.env.AIRTABLE_TABLE_UTENTI || 'UTENTI',
} as const;

// --- Campi tabella UTENTI --------------------------------------------------
export const FUSER = {
  Email: 'Mail Cliente',
  Mittente: 'Mittente',
  Paese: 'Paese Mittente',
  Citta: 'Città Mittente',
  CAP: 'CAP Mittente',
  Indirizzo: 'Indirizzo Mittente',
  Telefono: 'Telefono Mittente',
  PIVA: 'Partita IVA Mittente',
  CreatedAt: 'Data Creazione',
} as const;

// --- Campi tabella principale: SpedizioniWebApp ----------------------------
export const F = {
  // Generali
  Stato: 'Stato',
  Sorgente: 'Tipo (Vino, Altro)',                 // Tipo principale (Vino/Altro)
  Tipo: 'Sottotipo (B2B, B2C, Sample)',           // Sottotipo spedizione
  Formato: 'Formato',
  Contenuto: 'Contenuto Colli',
  RitiroData: 'Ritiro - Data',                    // date-only
  RitiroNote: 'Ritiro - Note',
  CreatoDaEmail: 'Creato da',

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
  D_Abilitato: 'Destinatario abilitato import',   // boolean

  // Fatturazione
  F_RS: 'FATT Ragione Sociale',
  F_REF: 'FATT Referente',
  F_PAESE: 'FATT Paese',
  F_CITTA: 'FATT Città',
  F_CAP: 'FATT CAP',
  F_INDIRIZZO: 'FATT Indirizzo',
  F_TEL: 'FATT Telefono',
  F_PIVA: 'FATT PIVA/CF',
  F_SAME_DEST: 'FATT Uguale a Destinatario',      // boolean
  Incoterm: 'Incoterm',
  Valuta: 'Valuta',
  NoteFatt: 'Note Fattura',
  F_Delega: 'Fattura - Delega a SPST',            // checkbox ufficiale
  F_DelegaAlt: 'Delega Fattura',                  // eventuale duplicato

  // Allegati
  Fattura_Att: 'Fattura - Allegato Cliente',      // Attachment
  PL_Att: 'Packing List - Allegato Cliente',

  // Link a tabelle figlie
  LinkColli: 'COLLI (link)',
  LinkPL: 'PL (link)',

  // Campo ID custom
  ID_Spedizione: 'ID Spedizione',

  // Tracking
  Corriere: 'Corriere',
  TrackingNumber: 'Tracking Number',
  TrackingURL: 'Tracking URL',
  ETA: 'ETA',                                     // opzionale, se lo usi in Overview
} as const;

// --- Campi tabella figlia: SPED_COLLI --------------------------------------
export const FCOLLO = {
  LinkSped: 'Spedizione',
  Tot: '#',
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

// --- Tabelle preventivi (portale) ------------------------------------------
export const QTABLE = {
  PREVENTIVI: process.env.AIRTABLE_TABLE_PREVENTIVI || 'Preventivi',
  OPZIONI: process.env.AIRTABLE_TABLE_OPZIONI_PREVENTIVO || 'OpzioniPreventivo',
  COLLI: process.env.AIRTABLE_TABLE_COLLI_PREVENTIVI || 'Colli',
} as const;

// --- Campi tabella Preventivi ----------------------------------------------
export const QF = {
  // meta
  EmailCliente: 'Email_Cliente',
  Stato: 'Stato',                       // es. Bozza (cliente) | Pubblicato | Accettato | Convertito ...
  SlugPubblico: 'Slug_Pubblico',
  Valuta: 'Valuta',
  Validita: 'Valido_Fino_Al',
  NoteGlobali: 'Note_Globali',
  NoteSpedizione: 'Note generiche sulla spedizione',

  // link alla spedizione creata post-accettazione
  SpedizioneCreata: 'Spedizione_Creata',

  // richieste documenti
  DocFatturaRichiesta: 'Doc_Fattura_Richiesta',
  DocPLRichiesta: 'Doc_PL_Richiesta',

  // Mittente
  M_RS: 'Mittente_Nome',
  M_PAESE: 'Mittente_Paese',
  M_CITTA: 'Mittente_Citta',
  M_CAP: 'Mittente_CAP',
  M_INDIRIZZO: 'Mittente_Indirizzo',
  M_TEL: 'Mittente_Telefono',
  M_TAX: 'Mittente_Tax',                // PIVA / EORI

  // Destinatario
  D_RS: 'Destinatario_Nome',
  D_PAESE: 'Destinatario_Paese',
  D_CITTA: 'Destinatario_Citta',
  D_CAP: 'Destinatario_CAP',
  D_INDIRIZZO: 'Destinatario_Indirizzo',
  D_TEL: 'Destinatario_Telefono',
  D_TAX: 'Destinatario_Tax',            // Tax ID / EORI / EIN
} as const;

// --- Campi tabella Colli (per preventivi) ----------------------------------
export const QCOLLO = {
  LinkPreventivo: 'Preventivo',         // linked record al parent
  Quantita: 'Quantita',
  L: 'Lunghezza',
  W: 'Larghezza',
  H: 'Altezza',
  Peso: 'Peso_Kg',
} as const;

