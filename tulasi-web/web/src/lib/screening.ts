// Free self-check instruments. PHQ-9 (low mood) and GAD-7 (anxiety) were developed
// by Drs. Spitzer, Williams and Kroenke with a grant from Pfizer Inc., and are free
// to use without permission. Scores are computed in the browser and never sent anywhere.
// This is a screening guide, not a diagnosis.

export type Option = { value: number; label: string };
export const FREQUENCY: Option[] = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];

export type Band = { max: number; label: string; advice: string };
export type Instrument = {
  id: "phq9" | "gad7";
  title: string;
  short: string;
  blurb: string;
  /** Concern key understood by POST /api/match, used for the "find a specialist" hand-off. */
  specialty: string;
  questions: string[];
  /** Index of an item that asks about self-harm: any answer above 0 triggers the crisis message. */
  safetyItem?: number;
  bands: Band[];
};

export const INSTRUMENTS: Record<Instrument["id"], Instrument> = {
  phq9: {
    id: "phq9",
    title: "Mood check-in",
    short: "PHQ-9",
    blurb: "Nine questions about low mood, energy and sleep.",
    specialty: "depression",
    questions: [
      "Little interest or pleasure in doing things",
      "Feeling down, depressed, or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself, or that you are a failure or have let yourself or your family down",
      "Trouble concentrating on things, such as reading or watching television",
      "Moving or speaking so slowly that other people could have noticed, or being so fidgety or restless that you have been moving around a lot more than usual",
      "Thoughts that you would be better off dead, or of hurting yourself in some way",
    ],
    safetyItem: 8,
    bands: [
      { max: 4, label: "Minimal", advice: "Your answers suggest few or no signs of low mood right now. If something still feels off, it is always fine to talk to someone." },
      { max: 9, label: "Mild", advice: "Your answers suggest mild symptoms. Rest, routine and talking to someone you trust can help, and a conversation with a counsellor is a good idea if this continues." },
      { max: 14, label: "Moderate", advice: "Your answers suggest moderate symptoms. We would recommend speaking with one of our specialists." },
      { max: 19, label: "Moderately severe", advice: "Your answers suggest symptoms that are likely affecting daily life. Please consider seeing a psychiatrist or psychologist soon." },
      { max: 27, label: "Severe", advice: "Your answers suggest severe symptoms. Please see a specialist as soon as you can. We are here to help." },
    ],
  },
  gad7: {
    id: "gad7",
    title: "Anxiety check-in",
    short: "GAD-7",
    blurb: "Seven questions about worry, tension and restlessness.",
    specialty: "anxiety",
    questions: [
      "Feeling nervous, anxious, or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it is hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid, as if something awful might happen",
    ],
    bands: [
      { max: 4, label: "Minimal", advice: "Your answers suggest few or no signs of anxiety right now." },
      { max: 9, label: "Mild", advice: "Your answers suggest mild anxiety. Breathing exercises, sleep and regular movement can help, and talking to a counsellor is a good idea if this continues." },
      { max: 14, label: "Moderate", advice: "Your answers suggest moderate anxiety. We would recommend speaking with one of our specialists." },
      { max: 21, label: "Severe", advice: "Your answers suggest severe anxiety. Please see a specialist as soon as you can. We are here to help." },
    ],
  },
};

export const score = (answers: number[]) => answers.reduce((a, b) => a + b, 0);
export const bandFor = (inst: Instrument, total: number) => inst.bands.find((b) => total <= b.max) ?? inst.bands[inst.bands.length - 1];
/** True when the self-harm item is anything other than "Not at all". */
export const needsSafetyNet = (inst: Instrument, answers: number[]) => inst.safetyItem !== undefined && (answers[inst.safetyItem] ?? 0) > 0;
