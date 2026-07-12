# AXOM Daily Word dictionary provenance

## Current contract: `general-2`

AXOM `general-2` is derived locally from **SCOWLv2 2026.02.25**, maintained by
Kevin Atkinson in the English Speller Database project:

- Upstream: <https://github.com/en-wl/wordlist>
- Release tag: `rel-2026.02.25`
- Commit: `7e99edab8e32f9f9ea2b15f249ca8d4d67237410`
- License: the permissive SCOWL/related notices reproduced verbatim in
  `web/public/third-party/DAILY_WORD_SCOWL_LICENSE.txt` (and therefore copied
  into production builds as supporting documentation)

No official daily-game answer feed, branding, asset, endpoint, or copied
publisher list is used. The generated files are bundled locally; gameplay makes
no dictionary network request.

The allowed-guess list is the lowercase, five-ASCII-letter subset of SCOWL's
American size-80 generated word list. Entries carrying SCOWL's vulgar or
offensive usage levels 1–3 and a small AXOM editorial exclusion set were
removed. It contains 8,659 words.

The answer list is the lowercase, five-ASCII-letter, American base-word subset
at SCOWL size 35. The same usage and editorial exclusions apply. It contains
1,981 words. This narrower answer policy keeps the daily answer materially more
familiar than the validation dictionary, though an occasional uncommon answer
can still occur. `HELLO` and `ENVOY` are in both lists.

The exact normalized checksum input is every uppercase word in deterministic
order, joined by `\n`, with one final `\n`:

- answers SHA-256:
  `5847d238f353fc55217a0c3183a226212316c74e581b2d17a1f0d89b4e6c3cae`
- allowed guesses SHA-256:
  `c5db32f9c4c3cd17b042451d9adf29f175773a111fd5491bb96efdcc4cd0215d`

Answer order is part of the deterministic puzzle contract. Do not reorder,
insert, or delete entries under `general-2`; publish a new version identifier.

## Legacy contract: `general-1`

The original 241-answer AXOM `general-1` sequence remains bundled only so an
active or incomplete historical puzzle keeps its original deterministic answer.
New puzzles use `general-2`. Existing puzzle IDs, guesses, completions, and
statistics are not rewritten or rescored against the new answer sequence.

Bundled client-side words and derived answers are inspectable. AXOM does not
claim that client-side obfuscation can keep a local puzzle answer secret.
