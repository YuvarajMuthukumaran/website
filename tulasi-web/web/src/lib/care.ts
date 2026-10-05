// How people find care on the home page: concerns, care pathways and locations.
// Every link points at an existing page (no new URLs); blurbs are taken from
// each page's own published meta description (sales tails like "Call now!"
// trimmed), so nothing here is invented.

export type Who = "self" | "child" | "elder" | "loved";

export const WHO: { id: Who; label: string }[] = [
  { id: "self", label: "Myself" },
  { id: "child", label: "My child or teen" },
  { id: "elder", label: "A parent or elder" },
  { id: "loved", label: "A partner or family member" },
];

/** `specialty` matches the booking API's specialty tags. */
export const CONCERNS: { label: string; href: string; specialty: string; who: Who[] }[] = [
  { label: "Anxiety", href: "/anxiety/", specialty: "anxiety", who: ["self", "child", "loved"] },
  { label: "Depression", href: "/depression/", specialty: "depression", who: ["self", "elder", "loved"] },
  { label: "OCD", href: "/obsessive-compulsive-disorder-treatment/", specialty: "ocd", who: ["self", "child", "loved"] },
  { label: "Bipolar disorder", href: "/bipolar-disorder-treatment-delhi-gurgaon/", specialty: "bipolar", who: ["self", "loved"] },
  { label: "Schizophrenia & psychosis", href: "/schizophrenia-treatment-delhi-gurgaon-ncr/", specialty: "schizophrenia", who: ["self", "loved", "elder"] },
  { label: "Alcohol addiction", href: "/deaddiction-centre/alcohol-addiction/", specialty: "addiction", who: ["self", "loved", "elder"] },
  { label: "Drug addiction", href: "/drug-addiction-treatment-in-delhi-gurgaon-and-ncr/", specialty: "addiction", who: ["self", "loved", "child"] },
  { label: "Gaming & digital addiction", href: "/digital-and-gaming-addiction/", specialty: "addiction", who: ["child", "self", "loved"] },
  { label: "ADHD", href: "/adhd-treatment/", specialty: "adhd", who: ["child", "self"] },
  { label: "Autism", href: "/autism-care-centre/", specialty: "autism", who: ["child"] },
  { label: "Dementia & memory", href: "/treatment-of-dementia/", specialty: "geriatric_dementia", who: ["elder"] },
  { label: "Personality disorders", href: "/treatment-of-personality-disorders/", specialty: "personality_disorder", who: ["self", "loved"] },
  { label: "Relationships & marriage", href: "/marriage-counselling/", specialty: "relationship", who: ["self", "loved"] },
  { label: "Sexual health", href: "/sexologist-in-delhi/", specialty: "sexual_disorder", who: ["self", "loved"] },
  { label: "Stress & burnout", href: "/counsellor-near-me/", specialty: "stress", who: ["self", "loved"] },
];

export type Pathway = { title: string; href: string; text: string; icon: "stethoscope" | "talk" | "home" | "leaf" | "child" | "elder" | "wave" | "briefcase" };

export const PATHWAYS: Pathway[] = [
  { title: "Psychiatry", href: "/best-psychiatrist-in-delhi/", icon: "stethoscope", text: "Personalized mental health care from psychiatrists with decades of experience." },
  { title: "Therapy & counselling", href: "/psychologist-in-delhi/", icon: "talk", text: "RCI-registered psychologists for therapy, counselling, emotional well-being and mental health support." },
  { title: "Inpatient & rehabilitation", href: "/rehabilitation-centre/", icon: "home", text: "Residential treatment and psychosocial rehabilitation by a highly trained team of professionals." },
  { title: "De-addiction", href: "/deaddiction-centre/", icon: "leaf", text: "De-addiction treatment in Delhi NCR and Gurgaon for alcohol, drugs and other addictions." },
  { title: "Child & adolescent", href: "/child-psychiatry-hospital-services/", icon: "child", text: "Help for ADHD, autism, anxiety, behavioural and emotional problems in children and teens." },
  { title: "Dementia & elderly care", href: "/treatment-of-dementia/", icon: "elder", text: "Careful assessment and diagnosis, treatment and palliative care for dementia." },
  { title: "Deep TMS", href: "/deep-tms-treatment/", icon: "wave", text: "Deep TMS therapy for major depressive disorder, OCD and smoking cessation." },
  { title: "Employee Assistance Program", href: "/employee-assistance-program/", icon: "briefcase", text: "Multifaceted support for employees: mental health, growth and productivity." },
];

/** What the guided matcher recommends for "how much support" answers. */
export const INTENSITY = [
  { id: "talk", label: "I’d like to talk to a specialist", hint: "Outpatient consultation" },
  { id: "intensive", label: "We need more intensive or residential support", hint: "Inpatient care & rehabilitation" },
  { id: "unsure", label: "I’m not sure yet", hint: "We’ll help you decide" },
] as const;

export const CARE_PATHWAY_ICON: Record<Pathway["icon"], string> = {
  stethoscope: "M6 3v6a4 4 0 0 0 8 0V3M10 13v3a5 5 0 0 0 10 0v-2m0 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  talk: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12zM8.5 11h.01M12 11h.01M15.5 11h.01",
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  leaf: "M5 19c8 0 14-6 14-14-8 0-14 6-14 14zm0 0 7-7",
  child: "M12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 22v-6l-2-4 6-2 6 2-2 4v6M9.5 22h5",
  elder: "M12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM10 22l1-8-3 2-1 6M14 10l2 4h3M18 14v8",
  wave: "M2 12h3l2-6 3 12 3-9 2 5 2-2h5",
  briefcase: "M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18",
};
