"use client";

import { useEffect, useRef } from "react";

type Address = {
  formatted: string;
  street?: string;
  streetNumber?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string; // ISO (es. IT)
  lat?: number;
  lng?: number;
};

export default function AddressAutocomplete({
  id,
  placeholder = "Via e numero civico",
  defaultValue = "",
  className,
  onSelect,
}: {
  id: string;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  onSelect?: (addr: Address) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let inited = false;
    const timer = window.setInterval(() => {
      const g = (window as any).google;
      if (!inputRef.current || !g?.maps?.places || inited) return;

      inited = true;
      const ac = new g.maps.places.Autocomplete(inputRef.current!, {
        types: ["address"],
        fields: ["address_components", "geometry", "formatted_address"],
        componentRestrictions: { country: ["it","fr","de","es","gb","us","ca","at","be","nl","se","dk","fi","no","cz","sk","pl"] },
      });

      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const res: Address = {
          formatted: place.formatted_address || "",
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
        };
        const get = (t: string) => place.address_components?.find((c: any) => c.types.includes(t));
        res.street = get("route")?.long_name || "";
        res.streetNumber = get("street_number")?.long_name || "";
        res.city =
          get("locality")?.long_name ||
          get("postal_town")?.long_name ||
          get("administrative_area_level_3")?.long_name || "";
        res.province =
          get("administrative_area_level_2")?.short_name ||
          get("administrative_area_level_1")?.short_name || "";
        res.postalCode = get("postal_code")?.long_name || "";
        res.country = get("country")?.short_name || "";
        onSelect?.(res);
      });
    }, 200);

    return () => window.clearInterval(timer);
  }, [onSelect]);

  return (
    <input
      id={id}
      ref={inputRef}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={className}
      autoComplete="street-address"
      inputMode="text"
    />
  );
}
