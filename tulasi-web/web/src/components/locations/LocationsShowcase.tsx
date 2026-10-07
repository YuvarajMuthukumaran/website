// The turning location cards, filled from the real data (lib/locations.ts) with the clinic's phone number.
import "server-only";
import { PASTELS } from "@/components/team";
import { getSite } from "@/lib/content";
import { LOCATIONS } from "@/lib/locations";
import { LocationsClient } from "./LocationsClient";

export function LocationsShowcase({ filters = false }: { filters?: boolean }) {
  const site = getSite();
  return <LocationsClient locations={LOCATIONS} tints={[...PASTELS]} phone={{ display: site.contact.phoneDisplay, href: site.contact.phoneHref }} filters={filters} />;
}
