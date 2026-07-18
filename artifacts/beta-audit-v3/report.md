# AXOM Scenario-Based Beta Audit

- Started: 2026-07-17T02:56:02.467Z
- Completed: 2026-07-17T03:12:14.787Z
- Total scenarios: 11
- Passed: 1
- Failed: 10
- Blocked: 0

## Severity Summary

- Critical: 0
- High: 10
- Medium: 0
- Low: 0
- Info: 0

## Scenario Results

| Status | Feature | Scenario | Duration | Assertions |
|---|---|---|---:|---:|
| passed | Onboarding | Complete configured onboarding | 17038ms | 4 |
| failed | Navigation | Render known hash routes | 225929ms | 8 |
| failed | Course Tracker | Create persistent course | 120349ms | 0 |
| failed | Productivity | Create persistent task | 120117ms | 0 |
| failed | Dashboard | Persist daily intention | 120426ms | 0 |
| failed | Timer | Exercise timer lifecycle | 120388ms | 0 |
| failed | Question Bank | Import known question set | 83149ms | 0 |
| failed | Question Bank | Run quiz and validate feedback | 120034ms | 0 |
| failed | Question Bank | Open calculator and reading controls | 120137ms | 0 |
| failed | Settings | Persist appearance setting | 120087ms | 0 |
| failed | Responsive UI | Navigate core mobile interface | 120095ms | 0 |

## Detailed Scenarios

### PASSED · Onboarding · Complete configured onboarding

- Duration: 17038 ms
- URL before: about:blank
- URL after: https://www.axom.info/#tracker

**Assertions:**
- Identity step accepted the audit display name
- Dashboard displayed the onboarding name
- Display name persisted after browser refresh
- Onboarding completed and survived refresh

**Evidence:**
- /Users/jd/Developer/AXOM/artifacts/beta-audit-v3/screenshots/complete-configured-onboarding-step-1-before.png
- /Users/jd/Developer/AXOM/artifacts/beta-audit-v3/screenshots/complete-configured-onboarding-step-4.png
- /Users/jd/Developer/AXOM/artifacts/beta-audit-v3/screenshots/complete-configured-onboarding-dashboard-after.png

### FAILED · Navigation · Render known hash routes

- Duration: 225929 ms
- URL before: https://www.axom.info/#tracker

```text
Error: Command browsingContext.navigate with id 81 (with the following parameter: {"context":"52EF3AF5254CD92FD9289B3225B84837","url":"https://www.axom.info/#journal","wait":"complete"}) timed out
    at Timeout._onTimeout (file:///Users/jd/Developer/AXOM/node_modules/webdriver/build/node.js:360:16)
    at listOnTimeout (node:internal/timers:585:17)
    at process.processTimers (node:internal/timers:521:7)
```

**Assertions:**
- No fatal application-error screen appeared
- Dashboard route rendered expected content
- No fatal application-error screen appeared
- Course Tracker route rendered expected content
- No fatal application-error screen appeared
- Question Bank route rendered expected content
- No fatal application-error screen appeared
- Productivity route rendered expected content

**Evidence:**
- /Users/jd/Developer/AXOM/artifacts/beta-audit-v3/screenshots/render-known-hash-routes-dashboard.png
- /Users/jd/Developer/AXOM/artifacts/beta-audit-v3/screenshots/render-known-hash-routes-course-tracker.png
- /Users/jd/Developer/AXOM/artifacts/beta-audit-v3/screenshots/render-known-hash-routes-question-bank.png
- /Users/jd/Developer/AXOM/artifacts/beta-audit-v3/screenshots/render-known-hash-routes-productivity.png

### FAILED · Course Tracker · Create persistent course

- Duration: 120349 ms
- URL before: https://www.axom.info/#productivity

```text
Error: Command script.callFunction with id 82 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"string\"?event.reason:JSON.stringify(event.reason)}catch{message=String(event.reason)}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.unhandledRejections.push(message)})}/* __wdio script end__ */).apply(this, arguments);\n}","awaitPromise":true,"arguments":[],"target":{"context":"52EF3AF5254CD92FD9289B3225B84837"}}) timed out
    at Timeout._onTimeout (file:///Users/jd/Developer/AXOM/node_modules/webdriver/build/node.js:360:16)
    at listOnTimeout (node:internal/timers:585:17)
    at process.processTimers (node:internal/timers:521:7)
```

### FAILED · Productivity · Create persistent task

- Duration: 120117 ms
- URL before: https://www.axom.info/#productivity

```text
Error: Command script.callFunction with id 85 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"string\"?event.reason:JSON.stringify(event.reason)}catch{message=String(event.reason)}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.unhandledRejections.push(message)})}/* __wdio script end__ */).apply(this, arguments);\n}","awaitPromise":true,"arguments":[],"target":{"context":"52EF3AF5254CD92FD9289B3225B84837"}}) timed out
    at Timeout._onTimeout (file:///Users/jd/Developer/AXOM/node_modules/webdriver/build/node.js:360:16)
    at listOnTimeout (node:internal/timers:585:17)
    at process.processTimers (node:internal/timers:521:7)
```

### FAILED · Dashboard · Persist daily intention

- Duration: 120426 ms
- URL before: https://www.axom.info/#productivity

```text
Error: Command script.callFunction with id 87 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"string\"?event.reason:JSON.stringify(event.reason)}catch{message=String(event.reason)}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.unhandledRejections.push(message)})}/* __wdio script end__ */).apply(this, arguments);\n}","awaitPromise":true,"arguments":[],"target":{"context":"52EF3AF5254CD92FD9289B3225B84837"}}) timed out
    at Timeout._onTimeout (file:///Users/jd/Developer/AXOM/node_modules/webdriver/build/node.js:360:16)
    at listOnTimeout (node:internal/timers:585:17)
    at process.processTimers (node:internal/timers:521:7)
```

### FAILED · Timer · Exercise timer lifecycle

- Duration: 120388 ms
- URL before: https://www.axom.info/#productivity

```text
Error: Command script.callFunction with id 88 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"string\"?event.reason:JSON.stringify(event.reason)}catch{message=String(event.reason)}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.unhandledRejections.push(message)})}/* __wdio script end__ */).apply(this, arguments);\n}","awaitPromise":true,"arguments":[],"target":{"context":"52EF3AF5254CD92FD9289B3225B84837"}}) timed out
    at Timeout._onTimeout (file:///Users/jd/Developer/AXOM/node_modules/webdriver/build/node.js:360:16)
    at listOnTimeout (node:internal/timers:585:17)
    at process.processTimers (node:internal/timers:521:7)
```

### FAILED · Question Bank · Import known question set

- Duration: 83149 ms
- URL before: https://www.axom.info/#productivity

```text
Error: Command script.callFunction with id 91 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"string\"?event.reason:JSON.stringify(event.reason)}catch{message=String(event.reason)}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.unhandledRejections.push(message)})}/* __wdio script end__ */).apply(this, arguments);\n}","awaitPromise":true,"arguments":[],"target":{"context":"52EF3AF5254CD92FD9289B3225B84837"}}) timed out
    at Timeout._onTimeout (file:///Users/jd/Developer/AXOM/node_modules/webdriver/build/node.js:360:16)
    at listOnTimeout (node:internal/timers:585:17)
    at process.processTimers (node:internal/timers:521:7)
```

**Evidence:**
- /Users/jd/Developer/AXOM/artifacts/beta-audit-v3/screenshots/import-known-question-set-failure.png

### FAILED · Question Bank · Run quiz and validate feedback

- Duration: 120034 ms
- URL before: https://www.axom.info/#journal

```text
Error: Command script.callFunction with id 94 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"string\"?event.reason:JSON.stringify(event.reason)}catch{message=String(event.reason)}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.unhandledRejections.push(message)})}/* __wdio script end__ */).apply(this, arguments);\n}","awaitPromise":true,"arguments":[],"target":{"context":"52EF3AF5254CD92FD9289B3225B84837"}}) timed out
    at Timeout._onTimeout (file:///Users/jd/Developer/AXOM/node_modules/webdriver/build/node.js:360:16)
    at listOnTimeout (node:internal/timers:585:17)
    at process.processTimers (node:internal/timers:521:7)
```

### FAILED · Question Bank · Open calculator and reading controls

- Duration: 120137 ms
- URL before: https://www.axom.info/#journal

```text
Error: Command script.callFunction with id 96 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"string\"?event.reason:JSON.stringify(event.reason)}catch{message=String(event.reason)}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.unhandledRejections.push(message)})}/* __wdio script end__ */).apply(this, arguments);\n}","awaitPromise":true,"arguments":[],"target":{"context":"52EF3AF5254CD92FD9289B3225B84837"}}) timed out
    at Timeout._onTimeout (file:///Users/jd/Developer/AXOM/node_modules/webdriver/build/node.js:360:16)
    at listOnTimeout (node:internal/timers:585:17)
    at process.processTimers (node:internal/timers:521:7)
```

### FAILED · Settings · Persist appearance setting

- Duration: 120087 ms
- URL before: https://www.axom.info/#journal

```text
Error: Command script.callFunction with id 98 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"string\"?event.reason:JSON.stringify(event.reason)}catch{message=String(event.reason)}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.unhandledRejections.push(message)})}/* __wdio script end__ */).apply(this, arguments);\n}","awaitPromise":true,"arguments":[],"target":{"context":"52EF3AF5254CD92FD9289B3225B84837"}}) timed out
    at Timeout._onTimeout (file:///Users/jd/Developer/AXOM/node_modules/webdriver/build/node.js:360:16)
    at listOnTimeout (node:internal/timers:585:17)
    at process.processTimers (node:internal/timers:521:7)
```

### FAILED · Responsive UI · Navigate core mobile interface

- Duration: 120095 ms
- URL before: https://www.axom.info/#journal

```text
Error: Command script.callFunction with id 100 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"string\"?event.reason:JSON.stringify(event.reason)}catch{message=String(event.reason)}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.unhandledRejections.push(message)})}/* __wdio script end__ */).apply(this, arguments);\n}","awaitPromise":true,"arguments":[],"target":{"context":"52EF3AF5254CD92FD9289B3225B84837"}}) timed out
    at Timeout._onTimeout (file:///Users/jd/Developer/AXOM/node_modules/webdriver/build/node.js:360:16)
    at listOnTimeout (node:internal/timers:585:17)
    at process.processTimers (node:internal/timers:521:7)
```

## Findings

### HIGH

- **Navigation:** Error: Command browsingContext.navigate with id 81 (with the following parameter: {"context":"52EF3AF5254CD92FD9289B3225B84837","url":"https://www.axom.info/#journal","wait":"complete"}) timed out
    at Timeout._onTimeout (file:///Users/jd/Developer/AXOM/node_modules/webdriver/build/node.js:360:16)
    at listOnTimeout (node:internal/timers:585:17)
    at process.processTimers (node:internal/timers:521:7)
  - URL: https://www.axom.info/#productivity
- **Course Tracker:** Error: Command script.callFunction with id 82 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"s
  - URL: https://www.axom.info/#productivity
- **Productivity:** Error: Command script.callFunction with id 85 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"s
  - URL: https://www.axom.info/#productivity
- **Dashboard:** Error: Command script.callFunction with id 87 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"s
  - URL: https://www.axom.info/#productivity
- **Timer:** Error: Command script.callFunction with id 88 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"s
  - URL: https://www.axom.info/#productivity
- **Question Bank:** Error: Command script.callFunction with id 91 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"s
  - URL: https://www.axom.info/#journal
- **Question Bank:** Error: Command script.callFunction with id 94 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"s
  - URL: https://www.axom.info/#journal
- **Question Bank:** Error: Command script.callFunction with id 96 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"s
  - URL: https://www.axom.info/#journal
- **Settings:** Error: Command script.callFunction with id 98 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"s
  - URL: https://www.axom.info/#journal
- **Responsive UI:** Error: Command script.callFunction with id 100 (with the following parameter: {"functionDeclaration":"function anonymous(\n) {\nreturn (/* __wdio script__ */()=>{const auditWindow=window;if(auditWindow.__AXOM_BETA_AUDIT_RUNTIME__){return}auditWindow.__AXOM_BETA_AUDIT_RUNTIME__={consoleErrors:[],runtimeErrors:[],unhandledRejections:[]};const originalConsoleError=console.error.bind(console);console.error=(...args)=>{const message=args.map(item=>{if(typeof item===\"string\")return item;try{return JSON.stringify(item)}catch{return String(item)}}).join(\" \");auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.consoleErrors.push(message);originalConsoleError(...args)};window.addEventListener(\"error\",event=>{auditWindow.__AXOM_BETA_AUDIT_RUNTIME__?.runtimeErrors.push(`${event.message||\"Unknown runtime error\"} at ${event.filename||\"unknown\"}:${event.lineno||0}`)});window.addEventListener(\"unhandledrejection\",event=>{let message=\"Unhandled promise rejection\";try{message=typeof event.reason===\"
  - URL: https://www.axom.info/#journal

## Runtime Summary

- Console errors: 0
- Runtime errors: 0
- Unhandled rejections: 0
