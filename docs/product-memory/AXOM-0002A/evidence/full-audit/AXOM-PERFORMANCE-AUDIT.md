# AXOM Performance and Bundle Audit

Production build passed. Principal outputs:

| Asset | Bytes | Classification |
|---|---:|---|
| pdf.worker.min | 1,255,067 | PDF worker, separate |
| xlsx.min | 862,990 | heavy spreadsheet dependency |
| App JS | 819,498 (234,486 gzip verifier) | oversized eager shell/routes |
| lib JS | 497,263 | shared dependency chunk |
| pdf JS | 425,260 | PDF engine |
| main CSS | 318,224 | global/route styles |
| Daily Word stats | 257,795 | optional game support |
| index JS | 180,665 | framework/bootstrap |
| word list | 66,153 (28,514 gzip) | correctly isolated |
| DailyWord route | 16,371 (5,978 gzip) | correctly isolated |
| Doctordle route | 1,024 (547 gzip) | placeholder |

P0 before public Alpha: exclude API responses from service-worker caching; verify cache bounds; measure startup on a mid-range phone; test large question imports for main-thread stalls and quota errors. P1: lazy-load Question Bank/import dependencies, Course Tracker, Anki, and blueprint families; consider loading XLSX/PDF adapters only after file selection; split CSS only where ownership remains clear. Beta: workerize large PDF/parser/OCR work and introduce bounded binary/blob lifecycle. Later: granular vendor tuning only if field traces justify it.

Do not split small cohesive utilities. The immediate maintainability/performance win is route-family boundaries and on-demand document parsers, not dozens of microchunks. The 10,660-line word source is generated data and already isolated; the 5,200-line pages.css and 2,273-line blueprint catalog are stronger source-maintenance concerns.
