// Location data for all Tulasi Healthcare sites.
// ⚠ Swap placeholder images and real data before launch.

export type LocationType = "hospital" | "clinic";

export interface Location {
  id: string;
  type: LocationType;
  name: string;
  area: string;          // e.g. "Gurugram" or "South Delhi"
  tagline: string;       // Short punch-line shown on card back
  photo: string;         // /wp-content/uploads/... or /team-cutouts/...
  address: string;
  phone: string;
  phoneHref: string;
  email: string;
  hours: string;         // e.g. "Open 24 hours" or "Mon–Sat  9 am – 6 pm"
  openNow: boolean;      // computed at build time or toggled manually
  mapsUrl: string;       // full Google Maps link
  services: string[];    // chip labels on card back
  emergency: boolean;    // shows "24×7 Emergency" ribbon on hospital cards
  beds?: number;         // optional for hospitals
}

export const LOCATIONS: Location[] = [
  {
    id: "gurgaon-hospital",
    type: "hospital",
    name: "Tulasi Healthcare — Gurugram",
    area: "Gurugram (Main Campus)",
    tagline: "Our flagship NABH-accredited psychiatric hospital and rehabilitation centre.",
    photo: "/wp-content/uploads/2022/12/lasi-healthcare-psychiatric-hospital.webp",
    address: "2A, Vishal Mega Mart Road, Sector 43, Gurugram, Haryana 122003",
    phone: "+91 88 000 00 255",
    phoneHref: "tel:+918800000255",
    email: "info@tulasihealthcare.com",
    hours: "Open 24 hours · 7 days a week",
    openNow: true,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tulasi+Healthcare+Gurugram",
    services: ["Psychiatry", "De-addiction", "Rehabilitation", "OPD & IPD", "Emergency", "Psychotherapy"],
    emergency: true,
    beds: 200,
  },
  {
    id: "delhi-hospital",
    type: "hospital",
    name: "Tulasi Healthcare — South Delhi",
    area: "South Delhi",
    tagline: "Full-service psychiatric hospital with inpatient and outpatient care.",
    photo: "/wp-content/uploads/2022/12/49-1024x768-1.webp",
    address: "F-6, Kalkaji, South Delhi, New Delhi 110019",
    phone: "+91 88 000 00 255",
    phoneHref: "tel:+918800000255",
    email: "delhi@tulasihealthcare.com",
    hours: "Open 24 hours · 7 days a week",
    openNow: true,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tulasi+Healthcare+South+Delhi",
    services: ["Psychiatry", "Psychotherapy", "De-addiction", "Child & Teen", "OPD & IPD"],
    emergency: true,
    beds: 100,
  },
  {
    id: "noida-hospital",
    type: "hospital",
    name: "Tulasi Healthcare — Noida",
    area: "Noida, UP",
    tagline: "Comprehensive mental health care serving Noida and the eastern NCR.",
    photo: "/wp-content/uploads/2022/12/lasi-healthcare-psychiatric-hospital.webp",
    address: "B-12, Sector 63, Noida, Uttar Pradesh 201307",
    phone: "+91 88 000 00 255",
    phoneHref: "tel:+918800000255",
    email: "noida@tulasihealthcare.com",
    hours: "Open 24 hours · 7 days a week",
    openNow: true,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tulasi+Healthcare+Noida",
    services: ["Psychiatry", "Rehabilitation", "Substance Abuse", "OPD & IPD", "Geriatric Care"],
    emergency: true,
    beds: 80,
  },
  {
    id: "faridabad-hospital",
    type: "hospital",
    name: "Tulasi Healthcare — Faridabad",
    area: "Faridabad, Haryana",
    tagline: "Accessible psychiatric and rehabilitation care for southern Haryana.",
    photo: "/wp-content/uploads/2022/12/49-1024x768-1.webp",
    address: "14, NIT, Faridabad, Haryana 121001",
    phone: "+91 88 000 00 255",
    phoneHref: "tel:+918800000255",
    email: "faridabad@tulasihealthcare.com",
    hours: "Open 24 hours · 7 days a week",
    openNow: true,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tulasi+Healthcare+Faridabad",
    services: ["Psychiatry", "De-addiction", "Counselling", "OPD & IPD"],
    emergency: true,
    beds: 60,
  },
  {
    id: "gurgaon-clinic",
    type: "clinic",
    name: "Tulasi Mind Clinic — Cyber City",
    area: "Cyber City, Gurugram",
    tagline: "Outpatient consultations in Gurgaon's corporate hub — no long waits.",
    photo: "/wp-content/uploads/2022/12/lasi-healthcare-psychiatric-hospital.webp",
    address: "Unit 302, Unitech Cyber Park, Sector 39, Gurugram, Haryana 122003",
    phone: "+91 88 000 00 255",
    phoneHref: "tel:+918800000255",
    email: "clinic@tulasihealthcare.com",
    hours: "Mon – Sat · 9 am – 7 pm",
    openNow: true,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tulasi+Mind+Clinic+Cyber+City",
    services: ["Psychiatry OPD", "Counselling", "Stress & Burnout", "Corporate EAP"],
    emergency: false,
  },
  {
    id: "delhi-clinic",
    type: "clinic",
    name: "Tulasi Mind Clinic — Central Delhi",
    area: "Connaught Place, Delhi",
    tagline: "Walk-in and appointment-based consultations in the heart of Delhi.",
    photo: "/wp-content/uploads/2022/12/49-1024x768-1.webp",
    address: "M-22, Inner Circle, Connaught Place, New Delhi 110001",
    phone: "+91 88 000 00 255",
    phoneHref: "tel:+918800000255",
    email: "cp@tulasihealthcare.com",
    hours: "Mon – Sat · 10 am – 6 pm",
    openNow: false,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tulasi+Mind+Clinic+Connaught+Place",
    services: ["Psychiatry OPD", "Psychotherapy", "Anxiety & Depression", "Couple Therapy"],
    emergency: false,
  },
];

export const HOSPITALS = LOCATIONS.filter((l) => l.type === "hospital");
export const CLINICS   = LOCATIONS.filter((l) => l.type === "clinic");
