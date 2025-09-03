// lib/tracking-links.ts
export function buildTrackingUrl(carrier?: string | null, code?: string | null) {
  const c = (carrier || "").toLowerCase().trim();
  const n = (code || "").trim();
  if (!c || !n) return null;

  // mapping base (puoi ampliare quando serve)
  if (c.includes("dhl"))    return `https://www.dhl.com/track?tracking-number=${encodeURIComponent(n)}`;
  if (c.includes("ups"))    return `https://www.ups.com/track?loc=it_IT&tracknum=${encodeURIComponent(n)}`;
  if (c.includes("fedex"))  return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`;
  if (c.includes("tnt"))    return `https://www.tnt.com/express/it_it/site/shipping-tools/tracking.html?cons=${encodeURIComponent(n)}`;
  if (c.includes("gls"))    return `https://gls-group.com/track?match=${encodeURIComponent(n)}`;
  if (c.includes("brt"))    return `https://vas.brt.it/vas/sped_numspe_par.htm?sped_num=${encodeURIComponent(n)}`;
  if (c.includes("poste"))  return `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${encodeURIComponent(n)}`;
  if (c.includes("sda"))    return `https://www.sda.it/wps/portal/Servizi_online/ricerca_spedizioni?locale=it&tracing-codes=${encodeURIComponent(n)}`;

  // privato/altro → nessun link esterno
  return null;
}
