export type QuoteCategory =
  | "brutal-reality"
  | "shame-guilt"
  | "discipline"
  | "perspective"
  | "success-ambition"
  | "axom-original";

export type QuoteAttributionStatus =
  | "verified"
  | "commonly-attributed"
  | "paraphrased"
  | "axom-original"
  | "unverified";

export interface AxomQuote {
  id: string;
  text: string;
  author: string;
  category: QuoteCategory;
  intensity: 1 | 2 | 3 | 4 | 5;
  guilt: boolean;
  attributionStatus: QuoteAttributionStatus;
  attributionNote: string;
}

/** Exact text of the 100 numbered entries in `Quote Librabry v1.txt.rtf`. */
const QUOTE_TEXTS = [
  "The person you become is hidden inside the work you’re avoiding.",
  "Comfort has never introduced anyone to greatness.",
  "Your future is quietly watching what you do today.",
  "Every excuse sounds reasonable until someone else succeeds anyway.",
  "Discipline is choosing what you want most over what you want now.",
  "One day or day one. You decide.",
  "You cannot cheat your future self.",
  "No one is coming to rescue your potential.",
  "Talent is rented. Rent is due every day.",
  "Nothing changes if nothing changes.",
  "Dreams don’t die. They get abandoned.",
  "The clock never asks whether you felt motivated.",
  "Your habits are voting for the person you’ll become.",
  "The cost of discipline is always less than the cost of regret.",
  "You are always practicing something.",
  "Average is built one comfortable decision at a time.",
  "Action creates confidence. Waiting creates doubt.",
  "Your competition isn’t resting because you’re tired.",
  "Hard choices create easy lives.",
  "If you keep negotiating with laziness, laziness always wins.",
  "The version of you that dreamed about this life deserved better than today’s excuses.",
  "You prayed for opportunities you’re now too distracted to use.",
  "Your younger self believed you’d be farther by now.",
  "No one ruined your momentum today. Check your screen time.",
  "Imagine explaining your habits to the person who sacrificed everything for you.",
  "Regret is interest paid on procrastination.",
  "You know exactly what you’re avoiding.",
  "Every skipped session teaches your brain quitting is acceptable.",
  "You don’t hate studying. You hate starting.",
  "The guilt you feel tonight is tomorrow asking for help.",
  "The life you want cannot be built between notifications.",
  "Your goals don’t need another promise. They need another hour.",
  "Nobody remembers the intentions you never acted on.",
  "You can lie to everyone except your own potential.",
  "Somewhere, someone with half your talent is building twice your future.",
  "Avoidance feels safe until years disappear.",
  "The mirror keeps every receipt.",
  "Every day you postpone becoming disciplined, life keeps charging interest.",
  "Excuses are usually true. They’re just irrelevant.",
  "Your future isn’t angry. It’s disappointed.",
  "We are what we repeatedly do. Excellence, then, is not an act but a habit.",
  "Do the hard thing first.",
  "Small wins become unstoppable momentum.",
  "Consistency beats intensity.",
  "Your schedule reveals your priorities.",
  "Motivation is unreliable. Systems endure.",
  "Routine defeats resistance.",
  "Discipline is freedom.",
  "Success is rented. Rent is due daily.",
  "Master boring.",
  "The first five minutes decide the next five hours.",
  "Start before you’re ready.",
  "The hardest part is often standing up.",
  "Done beats perfect.",
  "Repetition builds identity.",
  "Momentum loves movement.",
  "Work while emotions are quiet.",
  "Train consistency, not heroics.",
  "Keep promises made to yourself.",
  "The work counts whether anyone notices or not.",
  "Comparison steals gratitude.",
  "A bad day is not a bad life.",
  "Progress is rarely dramatic.",
  "Storms produce stronger roots.",
  "Pressure creates diamonds, provided the carbon doesn’t file a complaint.",
  "Patience is active, not passive.",
  "Growth feels like discomfort.",
  "You don’t rise to goals. You fall to systems.",
  "Your pace is not your destination.",
  "The mountain never gets smaller. You get stronger.",
  "Every expert once looked ridiculous.",
  "Confidence follows competence.",
  "The seed grows underground first.",
  "Every masterpiece looked unfinished once.",
  "Time rewards the consistent.",
  "Stay hungry. Stay foolish.",
  "Fortune favors the bold.",
  "Greatness compounds.",
  "The best investment is yourself.",
  "Earn the confidence you seek.",
  "Nobody can outwork time, but many waste it.",
  "Vision without execution is fantasy.",
  "Success whispers before it shouts.",
  "Be impossible to ignore.",
  "Your work introduces you.",
  "Reputation is built in private.",
  "The world rewards value.",
  "Focus is a competitive advantage.",
  "Build skills that survive trends.",
  "Leave evidence of your effort.",
  "The person you become is the greatest project you’ll ever build.",
  "Every study session is another brick in a future no one else can see.",
  "The world doesn’t owe you motivation. Build discipline instead.",
  "Knowledge compounds. So does neglect.",
  "Today’s effort is tomorrow’s confidence.",
  "If today felt ordinary, remember that extraordinary lives are assembled from ordinary days repeated.",
  "Your future patients deserve today’s discipline.",
  "You don’t have to feel ready. You only have to begin.",
  "One focused hour outweighs ten distracted ones.",
  "Become someone your past self would trust with their dreams.",
] as const;

const SOURCE_ATTRIBUTIONS: Partial<Record<number, { author: string; status: QuoteAttributionStatus; note: string }>> = {
  5: { author: "Abraham Lincoln", status: "commonly-attributed", note: "Source file labels this attribution as disputed." },
  6: { author: "Common proverb", status: "commonly-attributed", note: "Presented as a common proverb; no original author supplied." },
  9: { author: "J. J. Watt", status: "unverified", note: "Source file attributes this to J. J. Watt without a verification source." },
  10: { author: "Common saying", status: "commonly-attributed", note: "Presented as a common saying; no original author supplied." },
  13: { author: "James Clear", status: "paraphrased", note: "Source file explicitly identifies this as a paraphrased idea." },
  19: { author: "Jerzy Gregorek", status: "unverified", note: "Source file attributes this to Jerzy Gregorek without a verification source." },
  41: { author: "Will Durant", status: "paraphrased", note: "Source file describes this as Will Durant summarizing Aristotle." },
  48: { author: "Jocko Willink", status: "unverified", note: "Source file attributes this to Jocko Willink without a verification source." },
  61: { author: "Theodore Roosevelt", status: "unverified", note: "Source file supplies this attribution without a verification source." },
  76: { author: "Steve Jobs", status: "unverified", note: "Source file supplies this attribution without a verification source." },
};

function sourceCategory(number: number): { category: QuoteCategory; intensity: 1 | 2 | 3 | 4 | 5; guilt: boolean } {
  if (number <= 20) return { category: "brutal-reality", intensity: 4, guilt: false };
  if (number <= 40) return { category: "shame-guilt", intensity: 5, guilt: true };
  if (number <= 60) return { category: "discipline", intensity: 3, guilt: false };
  if (number <= 75) return { category: "perspective", intensity: 2, guilt: false };
  if (number <= 90) return { category: "success-ambition", intensity: 3, guilt: false };
  return { category: "axom-original", intensity: 3, guilt: false };
}

function attribution(number: number) {
  const explicit = SOURCE_ATTRIBUTIONS[number];
  if (explicit) return explicit;
  if (number <= 4 || (number >= 7 && number <= 8) || (number >= 11 && number <= 18) || number === 20 || (number >= 21 && number <= 40) || number >= 91) {
    return { author: "AXOM", status: "axom-original" as const, note: "Identified as an AXOM Original in the source file." };
  }
  return { author: "Unattributed", status: "unverified" as const, note: "No attribution was supplied in the source file." };
}

export const AXOM_QUOTES: readonly AxomQuote[] = Object.freeze(QUOTE_TEXTS.map((text, index) => {
  const number = index + 1;
  const source = attribution(number);
  return {
    id: `quote-${String(number).padStart(3, "0")}`,
    text,
    author: source.author,
    ...sourceCategory(number),
    attributionStatus: source.status,
    attributionNote: source.note,
  };
}));
