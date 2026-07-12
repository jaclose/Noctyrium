/**
 * AXOM Daily Word list metadata.
 *
 * This is an original AXOM curation assembled independently from common
 * English vocabulary. It was not sourced from any external game's answer or
 * guess list. The answer ordering is part of the
 * deterministic `general-1` contract and must not be changed in place.
 */
export const DAILY_WORD_LIST_METADATA = Object.freeze({
  version: "general-1",
  language: "en-US",
  provenance: "Original AXOM curation of common five-letter English vocabulary.",
  affiliation: "No affiliation with any external word-game publisher.",
  bundleSentinel: "AXOM_WORD_LIST_SENTINEL_GENERAL_1",
} as const);

export const WORD_LIST_VERSION = DAILY_WORD_LIST_METADATA.version;
export const DAILY_WORD_LIST_SENTINEL = DAILY_WORD_LIST_METADATA.bundleSentinel;

/** Immutable within general-1. Publish a new version before changing order. */
export const DAILY_WORD_ANSWERS = Object.freeze([
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

const EXTRA_ALLOWED_GUESSES = [
  "ABOUT", "ABOVE", "ACTOR", "ACUTE", "ADMIT", "ADOPT", "AFTER", "AGAIN", "AGENT", "AGREE",
  "AHEAD", "ALARM", "ALIEN", "ALLOW", "ALONE", "ALONG", "ALTER", "AMONG", "ANGER", "ANGLE",
  "ANKLE", "APPLY", "ARENA", "ARROW", "ASIDE", "ASSET", "AUDIO", "AUDIT", "BACON", "BATCH",
  "BATON", "BEGIN", "BELOW", "BLADE", "BLAME", "BLANK", "BLAST", "BLEED", "BLESS", "BLIND",
  "BLOCK", "BLOOD", "BONUS", "BOOST", "BOOTH", "BOUND", "BOWEL", "BOXER", "BRAND", "BREAK",
  "BREED", "BRIEF", "BRING", "BROKE", "BROOK", "BROOM", "BURST", "BUYER", "CACTI",
  "CANOE", "CARGO", "CATCH", "CAUSE", "CHAIN", "CHAOS", "CHEAP", "CHECK", "CHESS", "CHIEF",
  "CHILD", "CHILI", "CHOIR", "CHUNK", "CIVIC", "CLASS", "CLIFF", "CLOSE", "COACH", "COMET",
  "COMIC", "COUCH", "COULD", "COURT", "COVER", "CRACK", "CREAM", "CRIME", "CROSS", "CURVE",
  "DAILY", "DAIRY", "DECAY", "DELAY", "DENSE", "DIGIT", "DINER", "DIZZY", "DOUBT", "DOZEN",
  "DRAFT", "DRAMA", "DRESS", "DRILL", "DROVE", "EAGER", "EARLY", "EASEL", "EATEN",
  "EERIE", "EQUAL", "ERROR", "EVENT", "EVERY", "EXACT", "EXTRA", "FAIRY", "FALSE", "FANCY",
  "FAVOR", "FERRY", "FEVER", "FIBER", "FINAL", "FIRST", "FLAKE", "FLASH", "FLEET",
  "FLESH", "FLOAT", "FLOOD", "FORCE", "FORGE", "FORTH", "FORTY", "FOUND", "FOXES", "FRAIL",
  "FRANK", "FROST", "FUNNY", "GHOST", "GLOBE", "GLORY", "GOING", "GOOSE", "GRADE", "GRANT",
  "GUARD", "GUEST", "HAPPY", "HEARD", "HEAVY", "HEDGE", "HOTEL", "HOVER", "HURRY", "IDEAS",
  "IMPLY", "INBOX", "INPUT", "ISSUE", "IVORY", "JUDGE", "KAYAK", "KNEAD", "KNOCK", "KNOWN",
  "LANCE", "LARGE", "LAUGH", "LEAST", "LEAVE", "LEVER", "LLAMA", "LOCAL", "LOGIC", "LOOSE",
  "LOVER", "LUCKY", "LUNCH", "MAJOR", "MAKER", "MANGO", "MARCH", "MATCH", "MAYBE", "MAYOR",
  "MEDIA", "MERIT", "MIGHT", "MINOR", "MIXED", "MOTOR", "MOUNT", "MOVIE", "NEVER", "NEWER",
  "NINTH", "NOISE", "NURSE", "OCCUR", "OTHER", "OUGHT", "OUNCE", "OWNER", "PATCH", "PAUSE",
  "PEACE", "PEEPS", "PITCH", "PLACE", "PLANE", "PLAZA", "POISE", "POUCH", "PRESS", "PRICE",
  "PROUD", "QUEEN", "QUEST", "REACH", "REACT", "READY", "REPLY", "RIGHT", "RIVAL", "ROAST",
  "ROUTE", "RURAL", "SALAD", "SAUCE", "SCORE", "SCOUT", "SERVE", "SEVEN", "SHADE", "SHAKE",
  "SHARE", "SHINE", "SHIRT", "SHOCK", "SHOOT", "SHOWN", "SIGHT", "SINCE", "SIXTH", "SLEEP",
  "SLICE", "SMART", "SMOKE", "SOLID", "SOLVE", "SORRY", "SPEED", "SPELL", "SPEND", "SPINE",
  "SPOON", "STACK", "STAIR", "STAKE", "STAND", "START", "STATE", "STEEP", "STILL", "STOCK",
  "STOOD", "STUCK", "SWEET", "SWING", "TASTE", "TEETH", "THANK", "THEIR", "THERE", "THICK",
  "THING", "THINK", "THIRD", "THOSE", "THREE", "THROW", "TIGHT", "TIMER", "TIRED", "TOTAL",
  "TOUCH", "TOUGH", "TRADE", "TREAT", "TREND", "TRIAL", "TRUCK", "TRULY", "TWICE", "UNDER",
  "UNITY", "UPPER", "URBAN", "USAGE", "USUAL", "VALID", "VISIT", "WASTE", "WATCH", "WEARY",
  "WEIGH", "WEIRD", "WHILE", "WOMAN", "WOMEN", "WOULD", "WRONG", "WROTE", "YEARN",
  "YIELD", "YOUNG", "ZEBRA",
] as const;

/** Larger validation dictionary; every answer is always accepted as a guess. */
export const DAILY_WORD_ALLOWED_GUESSES: readonly string[] = Object.freeze([
  ...new Set<string>([...DAILY_WORD_ANSWERS, ...EXTRA_ALLOWED_GUESSES]),
]);
