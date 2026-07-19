# AXOM Quality Gates

Baseline: `26707a8713105746c641846bf51b3f92f000b260`. Commands ran in two clean `git archive` copies under this audit directory; neither repository was modified. Node v26.3.0, npm 11.16.0, macOS 26.3.1 arm64.

| Gate | Command | Exit | Time | Result |
|---|---|---:|---:|---|
| Root install | `npm ci` | 0 | 1.52s | 7 packages, 0 vulnerabilities |
| Web install after root | `npm --prefix web ci` | 0 | 2.78s | 303 packages, 0 vulnerabilities |
| Typecheck | `npm --prefix web run typecheck` | 0 | 10.09s | pass |
| Lint | `npm --prefix web run lint` | 0 | 7.50s | pass |
| Unit | `npm --prefix web test` | 0 | 16.85s | 107 files, 817 tests |
| Existing E2E | `npm --prefix web run test:e2e` | 0 | 25.42s | 6/6 |
| Build | `npm --prefix web run build` | 0 | 10.17s | pass |
| Import verifier | `npm --prefix web run verify:question-imports` | 0 | 1.15s | pass; PDF font-data warning only |
| Daily offline | `npm --prefix web run verify:daily-games-offline` | 0 | 3.17s | pass; no workspace localStorage keys |
| Daily bundle | `npm --prefix web run verify:daily-games-bundle` | 0 | 0.54s | pass |
| Diff check | `git -C /Users/jd/Developer/axom-audit diff --check` | 0 | 0.00s | pass |
| Audit route sweep | `node audit-browser.mjs` | 0 | ~28s | 96 route/viewport checks; 0 console/page errors; 0 overflow |
| Web-only typecheck | `npm --prefix web run typecheck` | 1 | 7.89s | expected boundary failure: node:crypto/node:fs types |
| Web-only build | `npm --prefix web run build` | 1 | 7.01s | same cause |

## Build contradiction verdict

Root `package.json` is authoritative for a full repository clone and declares `@types/node`. A root install makes it resolvable from `web`; all gates pass. The web manifest presents runnable build scripts and a web-local README, but does not declare `@types/node`, while its single tsconfig includes all tests and Vite config. Thus this is **root/web package dependency ambiguity plus an incomplete standalone web environment**. It is not incremental state and not a production dependency leak. Minimal repair: declare `@types/node` in web devDependencies if standalone web installs remain supported. Better build hygiene: separate app/build and test tsconfigs so production build does not compile tests; tests may keep Node APIs. Using Web Crypto/File APIs is optional, not required.

The original failed `git diff --check` log in the archive copy is an audit-harness environment error (git metadata is absent), superseded by the passing command against the detached worktree.
