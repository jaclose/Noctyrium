/**
 * Small, eager-safe Daily Word metadata for Help/About surfaces.
 *
 * Keep the bundle sentinel and the generated lists out of this module: global
 * help is part of the eager shell while the game engine and dictionary must
 * remain lazy.
 */
export const DAILY_WORD_PUBLIC_METADATA = Object.freeze({
  version: "general-2",
  language: "en-US",
  sourceName: "SCOWLv2",
  sourceRelease: "2026.02.25",
  upstream: "https://github.com/en-wl/wordlist",
  upstreamCommit: "7e99edab8e32f9f9ea2b15f249ca8d4d67237410",
  answerCount: 1_981,
  allowedGuessCount: 8_659,
  licensePath: "public/third-party/DAILY_WORD_SCOWL_LICENSE.txt",
  localValidation: true,
} as const);
