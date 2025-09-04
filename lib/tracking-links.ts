// lib/tracking-links.ts
// Costruisce l’URL pubblico di tracking a partire da corriere + numero.
// Se in Airtable esiste già un "Tracking URL", usalo come priorità.

export function clean(s?: string | null) {
  return (s || '').toString().trim();
}

export function buildTrackingUrl(carrierRaw?: string | null, numRaw?: string | null, fallbackUrlRaw?: string | null) {
  const carrier = clean(carrierRaw).toLowerCase();
  const num = clean(numRaw);
  const fallback = clean(fallbackUrlRaw);

  // 1) se c'è un Tracking URL in Airtable lo usiamo così com'è
  if (fallback) return fallback;

  // 2) altrimenti proviamo a costruire in base al corriere
  if (!carrier) return undefined;

  try {
    switch (carrier) {
      case 'dhl':
        return num ? `https://www.dhl.com/it-it/home/tracking.html?tracking-id=${encodeURIComponent(num)}` : 'https://www.dhl.com/it-it/home/tracking.html';
      case 'fedex':
        return num ? `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(num)}` : 'https://www.fedex.com/fedextrack/';
      case 'ups':
        return num ? `https://www.ups.com/track?tracknum=${encodeURIComponent(num)}` : 'https://www.ups.com/track';
      case 'tnt':
        // ✅ TNT Italia: pagina locale (il form non accetta una query affidabile)
        // Meglio atterrare sulla pagina italiana ufficiale.
        return 'https://www.tnt.it/tracking/Tracking.do';
      case 'gls':
        // Sito GLS Italy con match se disponibile
        return num ? `https://www.gls-italy.com/it/servizi-online/ricerca-spedizioni?match=${encodeURIComponent(num)}` : 'https://www.gls-italy.com/it/servizi-online/ricerca-spedizioni';
      case 'tnt it':
      case 'tnt-italia':
      case 'tnt_it':
        return 'https://www.tnt.it/tracking/Tracking.do';
      case 'privato':
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}
