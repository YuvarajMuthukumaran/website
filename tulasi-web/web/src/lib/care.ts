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
  { label: "Addiction", href: "/addiction-treatment/", specialty: "addiction", who: ["self", "loved", "child", "elder"] },
  { label: "ADHD", href: "/adhd-treatment/", specialty: "adhd", who: ["child", "self"] },
  { label: "Autism", href: "/autism-care-centre/", specialty: "autism", who: ["child"] },
  { label: "Child & teen mental health", href: "/child-psychiatry-hospital-services/", specialty: "child_adolescent", who: ["child"] },
  { label: "Dementia & memory", href: "/treatment-of-dementia/", specialty: "geriatric_dementia", who: ["elder"] },
  { label: "Personality disorders", href: "/treatment-of-personality-disorders/", specialty: "personality_disorder", who: ["self", "loved"] },
  { label: "Relationships & marriage", href: "/marriage-counselling/", specialty: "relationship", who: ["self", "loved"] },
  { label: "Sexual health", href: "/sexologist-in-delhi/", specialty: "sexual_disorder", who: ["self", "loved"] },
  { label: "LGBTQ+ support", href: "/lgbtq-support/", specialty: "stress", who: ["self", "loved", "child"] },
  { label: "Stress & burnout", href: "/counsellor-near-me/", specialty: "stress", who: ["self", "loved"] },
];

/** Quiet line icons for the condition tiles (brand icons; "i:" prefix = UI icon). */
export const CONCERN_ICON: Record<string, string> = {
  Anxiety: "breath",
  Depression: "moon",
  OCD: "link",
  "Bipolar disorder": "balance",
  "Schizophrenia & psychosis": "waves",
  Addiction: "sprout",
  "LGBTQ+ support": "family",
  ADHD: "i:spark",
  Autism: "child",
  "Child & teen mental health": "cradle",
  "Dementia & memory": "memory",
  "Personality disorders": "therapy",
  "Relationships & marriage": "family",
  "Sexual health": "i:heart",
  "Stress & burnout": "sunrise",
};

export type Pathway = { title: string; href: string; text: string; icon: "stethoscope" | "clipboard" | "talk" | "home" | "leaf" | "child" | "elder" | "wave" | "briefcase" };

export const PATHWAYS: Pathway[] = [
  { title: "OPD consultation", href: "/book-appointment/", icon: "stethoscope", text: "See a psychiatrist or psychologist without being admitted: assessment, medicines, therapy and follow-up visits, booked online or by phone." },
  { title: "Psychological assessment & testing", href: "/psychological-services/", icon: "clipboard", text: "Psychometric testing, neuropsychological and developmental assessments, with a written report and feedback." },
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
  clipboard: "M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1zM6 6h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM9 12h6M9 16h4",
  stethoscope: "M6 3v6a4 4 0 0 0 8 0V3M10 13v3a5 5 0 0 0 10 0v-2m0 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  talk: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12zM8.5 11h.01M12 11h.01M15.5 11h.01",
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  leaf: "M5 19c8 0 14-6 14-14-8 0-14 6-14 14zm0 0 7-7",
  child: "M12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 22v-6l-2-4 6-2 6 2-2 4v6M9.5 22h5",
  elder: "M12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM10 22l1-8-3 2-1 6M14 10l2 4h3M18 14v8",
  wave: "M2 12h3l2-6 3 12 3-9 2 5 2-2h5",
  briefcase: "M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18",
};

/** Click-to-chat link built from the clinic's phone number (tel:8800000255 -> wa.me/918800000255). */
export function whatsappLink(phoneHref: string, text = "Hello Tulasi Healthcare, I would like some help.") {
  const digits = phoneHref.replace(/\D/g, "").replace(/^0+/, "");
  const number = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Psychological services (clinical psychologists). Shown on /psychological-services/ and in the Services menu. */
export const PSYCH_SERVICES: { id: string; title: string; text: string; who: string; covers: string[] }[] = [
  {
    id: "psychometric-testing",
    title: "Psychometric testing",
    text: "Standardised tests, given and interpreted by a clinical psychologist, that measure how a person thinks, feels and behaves.",
    who: "Adults, teens and children; schools, families and employers",
    covers: ["Intelligence (IQ) and cognitive ability", "Personality and emotional functioning", "Aptitude, interests and career guidance", "Behaviour and emotional screening"],
  },
  {
    id: "neuropsychological-assessment",
    title: "Neuropsychological assessment",
    text: "A detailed look at memory, attention, planning and thinking speed, often alongside a psychiatrist’s or neurologist’s assessment.",
    who: "Memory complaints, head injury, concentration problems, older adults",
    covers: ["Memory and attention", "Planning and problem solving", "Changes with age or illness", "Baseline and follow-up testing"],
  },
  {
    id: "developmental-assessment",
    title: "ADHD, autism and learning assessment",
    text: "Structured assessment of children and adults when attention, social communication or learning is a concern.",
    who: "Children, teens and adults",
    covers: ["ADHD and attention", "Autism and social communication", "Learning difficulties", "Reports for school or workplace support"],
  },
  {
    id: "psychotherapy",
    title: "Individual therapy",
    text: "Regular one-to-one sessions with an RCI-registered psychologist, using evidence-based approaches such as CBT.",
    who: "Anxiety, low mood, trauma, OCD, stress and more",
    covers: ["Cognitive behavioural therapy (CBT)", "Trauma-focused therapy", "Stress and anger management", "Relapse-prevention therapy"],
  },
  {
    id: "couple-family-counselling",
    title: "Couple and family counselling",
    text: "A calm space to work through conflict, communication and caring for someone with a mental illness.",
    who: "Couples and families",
    covers: ["Marriage and relationship counselling", "Family sessions", "Caregiver support and psychoeducation"],
  },
  {
    id: "child-adolescent-counselling",
    title: "Child and teen counselling",
    text: "Age-appropriate sessions, with parents involved, for emotional, behavioural and school-related difficulties.",
    who: "Children and teens",
    covers: ["Anxiety and school stress", "Behaviour and anger", "Social and screen-use concerns", "Parent guidance"],
  },
  {
    id: "addiction-counselling",
    title: "Addiction counselling",
    text: "Motivational and relapse-prevention counselling for the person and their family, alongside medical treatment.",
    who: "People recovering from alcohol, drug or behavioural addiction, and their families",
    covers: ["Motivation and readiness to change", "Relapse prevention", "Family counselling"],
  },
  {
    id: "workplace-wellbeing",
    title: "Workplace and career wellbeing",
    text: "Counselling and assessments for stress, burnout and career decisions, including our Employee Assistance Program.",
    who: "Employees and organisations",
    covers: ["Stress and burnout", "Career counselling", "Employee Assistance Program"],
  },
];

/** "Best Psychiatrist in Delhi for Therapy ..." becomes "Psychiatrist in Delhi": role + place, nothing else. */
export function roleInPlace(label: string) {
  const m = label.match(/^(?:best\s+)?((?:child\s+)?(?:psychiatrist|psychologist|counsellor))\s+(?:in\s+([A-Za-z]+)|near\s+me)/i);
  if (!m) return label;
  const role = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  return m[2] ? `${role} in ${m[2]}` : `${role} near me`;
}
