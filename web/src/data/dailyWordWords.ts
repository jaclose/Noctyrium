import {
  SCOWL_GENERAL_2_ALLOWED_GUESSES,
  SCOWL_GENERAL_2_ANSWERS,
} from "./dailyWordScowlGeneral2";

/** AXOM's current versioned Daily Word dictionary contract. */
export const DAILY_WORD_LIST_METADATA = Object.freeze({
  version: "general-2",
  language: "en-US",
  provenance: "SCOWLv2 2026.02.25, filtered and curated locally for AXOM.",
  upstream: "https://github.com/en-wl/wordlist",
  upstreamCommit: "7e99edab8e32f9f9ea2b15f249ca8d4d67237410",
  license: "SCOWL permissive notice; see public/third-party/DAILY_WORD_SCOWL_LICENSE.txt.",
  answersSha256: "5847d238f353fc55217a0c3183a226212316c74e581b2d17a1f0d89b4e6c3cae",
  allowedGuessesSha256: "c5db32f9c4c3cd17b042451d9adf29f175773a111fd5491bb96efdcc4cd0215d",
  affiliation: "No affiliation with any external word-game publisher.",
  bundleSentinel: "AXOM_WORD_LIST_SENTINEL_GENERAL_2_SCOWL_2026_02_25",
} as const);

export const WORD_LIST_VERSION = DAILY_WORD_LIST_METADATA.version;
export const DAILY_WORD_LIST_SENTINEL = DAILY_WORD_LIST_METADATA.bundleSentinel;

/** Immutable legacy list required to finish active general-1 puzzles safely. */
export const DAILY_WORD_GENERAL_1_ANSWERS = Object.freeze([
  "ABIDE", "ACORN", "ADAPT", "AGILE", "AISLE", "ALBUM", "ALERT", "ALIVE", "AMBER", "AMPLE",
  "ANGEL", "APPLE", "APRON", "ARGUE", "ARISE", "ARMOR", "ARRAY", "AVOID", "AWAKE", "BADGE",
  "BAKER", "BANAL", "BASIC", "BEACH", "BEARD", "BENCH", "BERRY", "BIRTH", "BLACK", "BLEND",
  "BLOOM", "BOARD", "BRAIN", "BRAVE", "BREAD", "BRICK", "BRIDE", "BRISK", "BROAD", "BROWN",
  "BRUSH", "BUILD", "CABIN", "CABLE", "CAMEL", "CANDY", "CARRY", "CARVE", "CHAIR", "CHARM",
  "CHART", "CHASE", "CHEER", "CHEST", "CHIME", "CLAIM", "CLEAN", "CLEAR", "CLERK", "CLIMB",
  "CLOCK", "CLOUD", "COAST", "COLOR", "CORAL", "COUNT", "CRAFT", "CRANE", "CRISP", "CROWD",
  "CROWN", "DANCE", "DEALT", "DELTA", "DEPTH", "DIARY", "DREAM", "DRINK", "DRIVE", "EARTH",
  "EIGHT", "ELBOW", "ELDER", "EMPTY", "ENJOY", "ENTRY", "FAITH", "FIELD", "FLAME", "FLAIR",
  "FLOOR", "FLOUR", "FOCUS", "FRAME", "FRESH", "FRONT", "FRUIT", "GIANT", "GIVEN", "GLASS",
  "GLOVE", "GRACE", "GRAIN", "GRAND", "GRAPE", "GRAPH", "GRASS", "GREAT", "GREEN", "GROUP",
  "GUIDE", "HEART", "HONEY", "HORSE", "HOUSE", "HUMAN", "IDEAL", "IMAGE", "INDEX", "INNER",
  "JELLY", "JOINT", "JUICE", "KNIFE", "LABEL", "LASER", "LATER", "LAYER", "LEARN", "LEMON",
  "LEVEL", "LIGHT", "LIMIT", "LINEN", "LIVER", "LODGE", "MAGIC", "MAPLE", "METAL", "MODEL",
  "MONEY", "MONTH", "MOUSE", "MUSIC", "NERVE", "NIGHT", "NOBLE", "NORTH", "NOVEL", "OCEAN",
  "OFFER", "OLIVE", "OPERA", "ORBIT", "PAINT", "PANEL", "PAPER", "PEACH", "PEARL", "PIANO",
  "PILOT", "PLAIN", "PLANT", "PLATE", "POINT", "POUND", "POWER", "PRIDE", "PRIME", "PRINT",
  "QUICK", "QUIET", "RADIO", "RAISE", "RANGE", "RIVER", "ROBIN", "ROUGH", "ROUND", "ROYAL",
  "SCALE", "SASSY", "SCENE", "SCOPE", "SHAPE", "SHARP", "SHEEP", "SHELF", "SHORE", "SHORT",
  "SKILL", "SLATE", "SMALL", "SMILE", "SOLAR", "SOUND", "SOUTH", "SPACE", "SPARK", "SPEAK",
  "SPICE", "SPIRE", "SPORT", "STAGE", "STEAM", "STEEL", "STONE", "STORE", "STORM", "STORY",
  "STRAW", "STYLE", "SUGAR", "TABLE", "TEACH", "THEME", "TIGER", "TITLE", "TOAST", "TODAY",
  "TOPIC", "TOWER", "TRACE", "TRACK", "TRAIL", "TRAIN", "TRUST", "UNION", "VALUE", "VIDEO",
  "VITAL", "VOICE", "WATER", "WHEAT", "WHEEL", "WHITE", "WHOLE", "WORLD", "WORTH", "WRITE",
  "YOUTH",
] as const);

/** Current deterministic answer list. Immutable within general-2. */
export const DAILY_WORD_ANSWERS = SCOWL_GENERAL_2_ANSWERS;

/** Current local validation dictionary. */
export const DAILY_WORD_ALLOWED_GUESSES = SCOWL_GENERAL_2_ALLOWED_GUESSES;

/**
 * Resolve a historical answer contract without changing the current validation
 * dictionary. This keeps an unfinished general-1 puzzle on its original answer
 * after general-2 ships.
 */
export function dailyWordAnswersForVersion(version: string): readonly string[] | undefined {
  if (version === "general-1") return DAILY_WORD_GENERAL_1_ANSWERS;
  if (version === WORD_LIST_VERSION) return DAILY_WORD_ANSWERS;
  return undefined;
}
