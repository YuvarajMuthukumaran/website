// Tulasi Healthcare: 4 hospitals and 2 clinics. Names, addresses and "Get directions" links as
// published on the live /map-direction/ page (six centres in four cities). Nothing here is
// invented: no opening hours, bed counts, e-mail addresses or services per centre.
//
// `type` decides "hospital" or "clinic". Add a `photo` to show a real picture of that centre
// on its card; every place that lists locations (home page, /locations/, the menu) updates.
// The hospital photos below are the campus photos already on the site, as stand-ins.

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

export const LOCATIONS: Location[] = [
  {
    id: "gurugram",
    type: "hospital",
    name: "Tulasi Healthcare",
    title: "Gurugram",
    city: "Gurugram",
    area: "Sector 64, Golf Course Extension Road",
    address: "Sector 64, Golf Course Extension Road, Gurugram, Haryana 122102",
    mapsUrl: "https://goo.gl/maps/G8LAxcJGdmqw9ziG9",
    photo: "/wp-content/uploads/2022/12/lasi-healthcare-psychiatric-hospital.webp",
  },
  {
    id: "mehrauli-rehabilitation-centre",
    type: "hospital",
    name: "Tulasi Psychiatric & Rehabilitation Center",
    title: "Mehrauli, Delhi",
    city: "Delhi",
    area: "Mandi Village",
    address: "Next to Lingaya Inst., Jonapur Mandi Road, Mandi Village, Mehrauli, New Delhi, Delhi 110030",
    mapsUrl: "https://goo.gl/maps/dDyNznHtuGN1N85z8",
    photo: "/wp-content/uploads/2022/12/47-1024x768-1.webp",
  },
  {
    id: "healourmind",
    type: "hospital",
    name: "Tulasi Healthcare Healourmind",
    title: "Andheria Morde, Delhi",
    city: "Delhi",
    area: "Behind Shamsi Talab, Mehrauli",
    address: "Farm No. 5, Andheria Morde, Behind Shamsi Talab, Mehrauli, New Delhi, Delhi 110030",
    mapsUrl: "https://goo.gl/maps/WPq899KbQXpLGphc7",
    photo: "/wp-content/uploads/2022/12/49-1024x768-1.webp",
  },
  {
    id: "paras-hospital-clinic",
    type: "hospital",
    name: "Tulasi Clinic, Paras Hospital Gurgaon",
    title: "Paras Hospital, Gurugram",
    city: "Gurugram",
    area: "Sushant Lok, Sector 43",
    address: "Phase-I, C-1, Sushant Lok Rd, Sector 43, Gurugram, Haryana 122002",
    mapsUrl: "https://goo.gl/maps/4UvFg6o7acXSDvZQ8",
    photo: "/wp-content/uploads/2022/12/lasi-healthcare-psychiatric-hospital.webp",
  },
  {
    id: "faridabad-clinic",
    type: "clinic",
    name: "Tulasi Clinic Faridabad",
    title: "Faridabad",
    city: "Faridabad",
    area: "Old Faridabad",
    address: "Sayad Wara, Old Faridabad, Faridabad, Haryana 121002",
    mapsUrl: "https://maps.app.goo.gl/KVitj1zEScg84zTa8",
  },
  {
    id: "noida-clinic",
    type: "clinic",
    name: "Tulasi Healthcare Clinic, Noida",
    title: "Noida",
    city: "Noida",
    area: "Sector 49, near Sector 76 Rd",
    address: "BR 03, Basement below Puma Outlet, beside Karma Hyundai Showroom, Sector 76 Rd, Sector 49, Noida, Uttar Pradesh 201304",
    mapsUrl: "https://maps.app.goo.gl/43V57NSSRqZAu79m8",
  },
];

export const HOSPITALS = LOCATIONS.filter((l) => l.type === "hospital");
export const CLINICS = LOCATIONS.filter((l) => l.type === "clinic");
export const CITIES = [...new Set(LOCATIONS.map((l) => l.city))];

/** "3 hospitals and 3 clinics in 4 cities", always from the data above. */
export function locationSummary() {
  const n = (c: number, one: string, many = `${one}s`) => `${c} ${c === 1 ? one : many}`;
  return `${n(HOSPITALS.length, "hospital")} and ${n(CLINICS.length, "clinic")} in ${n(CITIES.length, "city", "cities")}`;
}
