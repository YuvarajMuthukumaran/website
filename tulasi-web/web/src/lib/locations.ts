// Tulasi Healthcare's centres, taken from the clinic's Google Business Profile listings (the
// "Tulasi Healthcare" audit sheet, one tab per listing): five hospital and care-home sites and two
// clinics. Names, addresses and phone are exactly as Google shows them. Nothing here is invented:
// no bed counts, e-mail addresses or services per centre.
//
// `type` decides "hospital" or "clinic". `mapsUrl` opens Google Maps directions to the address.
// The photos are the campus pictures already on the site, used as stand-ins: add a `photo` of the
// real centre and every place that lists locations (home page, /locations/, the menu) updates.

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
  /** Optional real photo of this centre: shown on the card front when set. */
  photo?: string;
}

const directions = (name: string, address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${name}, ${address}`)}`;

type Seed = Omit<Location, "mapsUrl">;
const seeds: Seed[] = [
  {
    id: "gurugram",
    type: "hospital",
    name: "Tulasi Healthcare",
    title: "Gurugram",
    city: "Gurugram",
    area: "Sector 64, Golf Course Extension Road",
    address: "Sector 64, Golf Course Extension Road, opposite M3M URBANA, next to Shriram Millennium School, Sector 64, Gurugram, Haryana 122101",
    photo: "/wp-content/uploads/2022/12/lasi-healthcare-psychiatric-hospital.webp",
  },
  {
    id: "mehrauli-long-care-home",
    type: "hospital",
    name: "Tulasi Healthcare Mehrauli, Long Care Home",
    title: "Mehrauli, Delhi",
    city: "Delhi",
    area: "Andheria Morde, behind Shamsi Talab",
    address: "Farm No. 5, Andheria Morde, Behind Shamsi Talab, Mehrauli, New Delhi, Delhi 110030",
    photo: "/hero/mehrauli.webp",
  },
  {
    id: "tulasi-home-mandi",
    type: "hospital",
    name: "Tulasi Home, Schizophrenia & Psychiatric Rehabilitation",
    title: "Tulasi Home, Mandi",
    city: "Delhi",
    area: "Mandi-Jonapur Main Road, near Lingaya's",
    address: "Plot No 850/1, Mandi-Jonapur Main Road, near Lingaya's Lalita Devi Institute of Management, Mandi, New Delhi, Delhi 110047",
    photo: "/wp-content/uploads/2022/12/49-1024x768-1.webp",
  },
  {
    id: "adolescents-and-women",
    type: "hospital",
    name: "Tulasi Healthcare, Rehabilitation Centre for Adolescents and Women",
    title: "Adolescents & Women",
    city: "Delhi",
    area: "Aam Bagh, Khandsa Colony, Mehrauli",
    address: "2, Ward No 6, Aam Bagh, Khandsa Colony, Mehrauli, New Delhi, Delhi 110030",
    photo: "/wp-content/uploads/2022/12/47-1024x768-1.webp",
  },
  {
    id: "dementia-care-home-gurugram",
    type: "hospital",
    name: "Tulasi Healthcare, Dementia Care Home & Alzheimer's Assisted Care",
    title: "Dementia Care Home",
    city: "Gurugram",
    area: "Sector 64, Golf Course Extension Road",
    address: "India Culture & Convention Center, Golf Course Extn. Road, Sector 64, Gurugram, Haryana 122101",
    photo: "/hero/gurugram.webp",
  },
  {
    id: "noida-clinic",
    type: "clinic",
    name: "Tulasi Healthcare Clinic, Noida",
    title: "Noida",
    city: "Noida",
    area: "Sector 49, Puma building",
    address: "3rd floor, Puma building, BR/03, Sector 49, Noida, Uttar Pradesh 201304",
  },
  {
    id: "hauz-khas-clinic",
    type: "clinic",
    name: "Tulasi Psychiatric Clinic",
    title: "Hauz Khas, Delhi",
    city: "Delhi",
    area: "Sarvapriya Vihar",
    address: "2/6, Block 2, Sarvapriya Vihar, New Delhi, Delhi 110016",
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
