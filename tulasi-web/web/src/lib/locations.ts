// Tulasi Healthcare's six centres, as the clinic names them: Gurugram Hospital, Delhi Women's Center,
// Delhi Male Center, Delhi Mandi, the Hauz Khas clinic in Delhi and the Noida clinic. Addresses are as
// Google shows them on each Business Profile. Nothing here is invented: no bed counts, e-mail addresses
// or services per centre. Photos are the clinic's own, from its shared Drive folder (Tulasi Healthcare
// Pictures); the two clinics have none yet, so their cards stay plain until a photo is added.
//
// `type` decides "hospital" or "clinic" (the filter and the counts). `badge` is the small label on the
// card. `mapsUrl` opens Google Maps directions to the address.

export type LocationType = "hospital" | "clinic";

export interface Location {
  id: string;
  type: LocationType;
  /** The centre's published name. */
  name: string;
  /** Short title for the card front. */
  title: string;
  /** City, used for the count of cities. */
  city: string;
  /** Neighbourhood or landmark line shown under the title. */
  area: string;
  /** Published address. */
  address: string;
  /** Published "Get directions" link. */
  mapsUrl: string;
  /** Small label on the card, for example "Women's Center". Defaults to Hospital or Clinic. */
  badge?: string;
  /** Optional real photo of this centre: shown on the card front when set. */
  photo?: string;
}

const directions = (name: string, address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${name}, ${address}`)}`;

type Seed = Omit<Location, "mapsUrl">;
const seeds: Seed[] = [
  {
    id: "gurugram-hospital",
    type: "hospital",
    badge: "Hospital",
    name: "Tulasi Healthcare",
    title: "Gurugram Hospital",
    city: "Gurugram",
    area: "Sector 64, Golf Course Extension Road",
    address: "Sector 64, Golf Course Extension Road, opposite M3M URBANA, next to Shriram Millennium School, Sector 64, Gurugram, Haryana 122101",
    photo: "/locations/gurugram-hospital.webp",
  },
  {
    id: "delhi-womens-center",
    type: "hospital",
    badge: "Women’s Center",
    name: "Tulasi Healthcare, Rehabilitation Centre for Adolescents and Women",
    title: "Delhi Women’s Center",
    city: "Delhi",
    area: "Aam Bagh, Khandsa Colony, Mehrauli",
    address: "2, Ward No 6, Aam Bagh, Khandsa Colony, Mehrauli, New Delhi, Delhi 110030",
    photo: "/locations/delhi-womens-center.webp",
  },
  {
    id: "delhi-male-center",
    type: "hospital",
    badge: "Male Center",
    name: "Tulasi Healthcare Mehrauli, Long Care Home",
    title: "Delhi Male Center",
    city: "Delhi",
    area: "Andheria Morde, behind Shamsi Talab",
    address: "Farm No. 5, Andheria Morde, Behind Shamsi Talab, Mehrauli, New Delhi, Delhi 110030",
    photo: "/locations/delhi-male-center.webp",
  },
  {
    id: "delhi-mandi",
    type: "hospital",
    badge: "Mandi Centre",
    name: "Tulasi Home, Schizophrenia & Psychiatric Rehabilitation",
    title: "Delhi Mandi",
    city: "Delhi",
    area: "Mandi-Jonapur Main Road, near Lingaya’s",
    address: "Plot No 850/1, Mandi-Jonapur Main Road, near Lingaya's Lalita Devi Institute of Management, Mandi, New Delhi, Delhi 110047",
    photo: "/locations/delhi-mandi.webp",
  },
  {
    id: "hauz-khas-clinic",
    type: "clinic",
    badge: "Clinic",
    name: "Tulasi Psychiatric Clinic",
    title: "Delhi Clinic, Hauz Khas",
    city: "Delhi",
    area: "Sarvapriya Vihar",
    address: "2/6, Block 2, Sarvapriya Vihar, New Delhi, Delhi 110016",
  },
  {
    id: "noida-clinic",
    type: "clinic",
    badge: "Clinic",
    name: "Tulasi Healthcare Clinic, Noida",
    title: "Noida Clinic",
    city: "Noida",
    area: "Sector 49, Puma building",
    address: "3rd floor, Puma building, BR/03, Sector 49, Noida, Uttar Pradesh 201304",
  },
];

export const LOCATIONS: Location[] = seeds.map((l) => ({ ...l, mapsUrl: directions(l.name, l.address) }));

export const HOSPITALS = LOCATIONS.filter((l) => l.type === "hospital");
export const CLINICS = LOCATIONS.filter((l) => l.type === "clinic");
export const CITIES = [...new Set(LOCATIONS.map((l) => l.city))];

/** "3 hospitals and 3 clinics in 4 cities", always from the data above. */
export function locationSummary() {
  const n = (c: number, one: string, many = `${one}s`) => `${c} ${c === 1 ? one : many}`;
  return `${n(HOSPITALS.length, "hospital")} and ${n(CLINICS.length, "clinic")} in ${n(CITIES.length, "city", "cities")}`;
}
