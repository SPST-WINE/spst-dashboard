// app/api/tracking/build-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { F, TABLE } from "@/lib/airtable.schema";

// Se hai creato il file lib/tracking-links.ts, puoi usarlo. Altrimenti
// la funzione buildTrackingUrl locale qui sotto fa lo stesso lavoro.
function buildTrackingUrl(carrier?: string | null, code?: string | null) {
  const c = (carrier || "").toLowerCase().trim();
  const n = (code || "").trim();
  if (!c || !n) return null;

  if (c.includes("dhl"))   return `https://www.dhl.com/track?tracking-number=${encodeURIComponent(n)}`;
  if (c.includes("ups"))   return `https://www.ups.com/track?loc=it_IT&tracknum=${encodeURIComponent(n)}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`;
  if (c.includes("tnt"))   return `https://www.tnt.com/express/it_it/site/shipping-tools/tracking.html?cons=${encodeURIComponent(n)}`;
  if (c.includes("gls"))   return `https://gls-group.com/track?match=${encodeURIComponent(n)}`;
  if (c.includes("brt"))   return `https://vas.brt.it/vas/sped_numspe_par.htm?sped_num=${encodeURIComponent(n)}`;
  if (c.includes("poste")) return `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${encodeURIComponent(n)}`;
  if (c.includes("sda"))   return `https://www.sda.it/wps/portal/Servizi_online/ricerca_spedizioni?locale=it&tracing-codes=${encodeURIComponent(n)}`;
  return null;
}

export const runtime = "nodejs";

const AIRTABLE_API = "https://api.airtable.com/v0";

type AirtableRecord = {
  id: string;
  fields: Record<string, any>;
};

export async function POST(req: NextRequest) {
  try {
    const baseId = process.env.AIRTABLE_BASE_ID_SPST!;
    const tableName = TABLE.SPED; // già risolve con ENV override nel tuo schema
    const token = process.env.AIRTABLE_API_TOKEN || process.env.AIRTABLE_API_KEY;
    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing AIRTABLE_API_TOKEN (or AIRTABLE_API_KEY)" }, { status: 500 });
    }

    // body opzionale: { id?: string } → aggiorna solo quel record
    const body = (await req.json().catch(() => ({}))) as { id?: string };

    // 1) Leggi i record target
    let records: AirtableRecord[] = [];

    if (body.id) {
      // GET di un solo record
      const one = await fetch(`${AIRTABLE_API}/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}/${encodeURIComponent(body.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (one.status === 404) {
        return NextResponse.json({ ok: false, error: "Record not found" }, { status: 404 });
      }
      if (!one.ok) {
        const t = await one.text();
        throw new Error(`Airtable single GET failed: ${one.status} ${t}`);
      }
      const rec = (await one.json()) as AirtableRecord;
      records = [rec];
    } else {
      // GET batch (puoi sostituire con una vista filtrata: ?view=NomeVista)
      let offset: string | undefined = undefined;
      do {
        const url = new URL(`${AIRTABLE_API}/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}`);
        url.searchParams.set("pageSize", "100");
        if (offset) url.searchParams.set("offset", offset);

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Airtable list failed: ${res.status} ${t}`);
        }
        const data = (await res.json()) as { records: AirtableRecord[]; offset?: string };
        records.push(...data.records);
        offset = data.offset;
      } while (offset);
    }

    // 2) Prepara gli update per i record che hanno carrier+code validi
    const updates: { id: string; fields: Record<string, any> }[] = [];

    for (const r of records) {
      // ATTENZIONE: "Corriere" in Airtable single select può essere stringa oppure {name: "..."}
      const carrierRaw = r.fields[F.Corriere];
      const carrier =
        (typeof carrierRaw === "object" && carrierRaw?.name) ? carrierRaw.name : (carrierRaw as string | undefined);

      const code = r.fields[F.TrackingNumber] as string | undefined;
      const currentUrl = r.fields[F.TrackingURL] as string | undefined;

      const url = buildTrackingUrl(carrier, code);
      if (url && url !== currentUrl) {
        updates.push({ id: r.id, fields: { [F.TrackingURL]: url } });
      }
    }

    // 3) Effettua PATCH batch (Airtable max 10 record per volta)
    let updated = 0;
    for (let i = 0; i < updates.length; i += 10) {
      const chunk = updates.slice(i, i + 10);
      const res = await fetch(`${AIRTABLE_API}/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: chunk }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Airtable PATCH failed: ${res.status} ${t}`);
      }
      updated += chunk.length;
    }

    return NextResponse.json({ ok: true, updated });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "internal error" }, { status: 500 });
  }
}
