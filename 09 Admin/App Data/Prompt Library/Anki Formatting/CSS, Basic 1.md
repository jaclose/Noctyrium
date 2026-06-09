/* =====================================
ANKI FUTURE GLASS — FINAL STABLE BUILD V3
Minimal smoother cursor-reactive movement
No cursor light / no center glow
Premium restrained motion
===================================== */
 
/* Logo only — no badge bubble */
.logo-wrap {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 46px;
  height: 46px;
  overflow: visible;
}

.jd-logo {
  display: block;
  width: 42px;
  height: 42px;
  object-fit: contain;

  filter:
    drop-shadow(0 8px 18px rgba(0, 0, 0, 0.38))
    drop-shadow(0 0 14px rgba(147, 197, 253, 0.16));

  opacity: 0.96;
}



:root {
--bg-0: #030711;
--bg-1: #070b17;
--bg-2: #101827;
 
--glass-a: rgba(255, 255, 255, 0.105);
--glass-b: rgba(255, 255, 255, 0.047);
--glass-c: rgba(255, 255, 255, 0.022);
 
--stroke: rgba(255, 255, 255, 0.155);
 
--text-main: #f8fafc;
--text-soft: #cbd5e1;
--text-muted: #94a3b8;
 
--blue: #93c5fd;
--cyan: #67e8f9;
--violet: #c4b5fd;
--green: #86efac;
--amber: #fde68a;
--red: #fecaca;
}
 
/* Base Anki card */
.card {
margin: 0;
padding: 0;
min-height: 100vh;
 
color: var(--text-main);
font-family:
    "Futura PT",
    "FuturaPT",
    "Futura PT Book",
    "Futura PT Medium",
    Futura,
    Inconsolata,
    sans-serif;
font-size: clamp(16px, 1.7vw, 19px);
line-height: 1.56;
text-align: left;
 
background:
radial-gradient(circle at 14% 12%, rgba(99, 102, 241, 0.20), transparent 28%),
radial-gradient(circle at 82% 18%, rgba(14, 165, 233, 0.145), transparent 31%),
radial-gradient(circle at 48% 92%, rgba(20, 184, 166, 0.09), transparent 34%),
linear-gradient(145deg, var(--bg-0), var(--bg-1) 42%, var(--bg-2));
 
background-attachment: fixed;
overflow-x: hidden;
}
 
/* Stage */
.anki-stage {
position: relative;
box-sizing: border-box;
 
min-height: 100vh;
width: 100%;
 
display: flex;
justify-content: center;
align-items: center;
 
padding:
clamp(22px, 5vh, 58px)
clamp(12px, 3vw, 34px);
 
overflow: visible;
isolation: isolate;
}
 
@media screen and (max-height: 760px) {
.anki-stage {
align-items: flex-start;
}
}
 
/* Ambient background orbs */
.ambient-orb {
position: fixed;
z-index: -3;
border-radius: 999px;
filter: blur(38px);
opacity: 0.42;
pointer-events: none;
transform: translateZ(0);
}
 
.orb-a {
width: 340px;
height: 340px;
top: 7%;
left: 7%;
background: radial-gradient(circle, rgba(147, 197, 253, 0.31), transparent 67%);
animation: orbDriftA 18s ease-in-out infinite alternate;
}
 
.orb-b {
width: 430px;
height: 430px;
right: 3%;
bottom: 6%;
background: radial-gradient(circle, rgba(196, 181, 253, 0.24), transparent 68%);
animation: orbDriftB 21s ease-in-out infinite alternate;
}
 
.orb-c {
width: 250px;
height: 250px;
left: 46%;
bottom: 10%;
background: radial-gradient(circle, rgba(103, 232, 249, 0.15), transparent 70%);
animation: orbDriftC 24s ease-in-out infinite alternate;
}
 
/* Main glass card */
.glass-card {
position: relative;
box-sizing: border-box;
 
width: min(920px, 94vw);
height: auto;
 
padding:
clamp(24px, 4vw, 42px)
clamp(22px, 4.5vw, 48px);
 
border-radius: clamp(24px, 3vw, 34px);
 
--rx: 0deg;
--ry: 0deg;
--mx: 0px;
--my: 0px;
--active: 0;
 
background:
linear-gradient(
145deg,
var(--glass-a),
var(--glass-b) 44%,
var(--glass-c)
);
 
border: 1px solid
rgba(
255,
255,
255,
calc(0.155 + var(--active) * 0.025)
);
 
box-shadow:
0 38px 95px rgba(0, 0, 0, 0.50),
0 14px 38px rgba(15, 23, 42, 0.42),
0 0 calc(18px * var(--active)) rgba(147, 197, 253, 0.075),
0 0 calc(30px * var(--active)) rgba(196, 181, 253, 0.045),
inset 0 1px 0 rgba(255, 255, 255, 0.24),
inset 0 -1px 0 rgba(255, 255, 255, 0.055);
 
backdrop-filter: blur(26px) saturate(155%);
-webkit-backdrop-filter: blur(26px) saturate(155%);
 
transform-style: preserve-3d;
transform-origin: center center;
 
overflow: hidden;
 
transform:
perspective(1200px)
translate3d(var(--mx), var(--my), 0)
rotateX(var(--rx))
rotateY(var(--ry));
 
transition:
transform 320ms cubic-bezier(.16,.84,.28,1),
border-color 280ms ease-out,
box-shadow 340ms ease-out;
 
animation:
cardEntrance 520ms cubic-bezier(.18,.9,.24,1) both,
floatDepth 20s ease-in-out 650ms infinite;
}
 
/* Generated glass border */
.glass-card::before {
content: "";
position: absolute;
inset: 0;
border-radius: inherit;
padding: 1.2px;
pointer-events: none;
z-index: 0;
 
background:
linear-gradient(
135deg,
rgba(255,255,255,0.42),
rgba(147,197,253,0.115) 24%,
transparent 46%,
rgba(196,181,253,0.115) 72%,
rgba(255,255,255,0.22)
);
 
-webkit-mask:
linear-gradient(#000 0 0) content-box,
linear-gradient(#000 0 0);
-webkit-mask-composite: xor;
mask-composite: exclude;
 
opacity: calc(0.70 + var(--active) * 0.045);
}
 
/* Inner dimensional glass surface */
.glass-card::after {
content: "";
position: absolute;
inset: 1px;
border-radius: inherit;
pointer-events: none;
z-index: 0;
 
background:
radial-gradient(circle at 20% 0%, rgba(255,255,255,0.12), transparent 28%),
linear-gradient(
180deg,
rgba(255,255,255,0.04),
transparent 34%,
rgba(0,0,0,0.08)
);
 
opacity: 0.80;
}
 
/* Luster sweep every 7.5 seconds */
.edge-luster {
position: absolute;
inset: -2px;
border-radius: inherit;
pointer-events: none;
overflow: hidden;
z-index: 2;
}
 
.edge-luster::after {
content: "";
position: absolute;
top: -50%;
left: -42%;
width: 42%;
height: 200%;
 
background:
linear-gradient(
100deg,
transparent,
rgba(255, 255, 255, 0.115),
rgba(147, 197, 253, 0.07),
transparent
);
 
transform: rotate(17deg);
animation: lusterSweep 5.5s ease-in-out 700ms infinite;
}
 
/* Bottom spawn glow */
.bottom-spawn {
position: absolute;
left: 8%;
right: 8%;
bottom: 0;
height: 120px;
z-index: 2;
pointer-events: none;
 
background:
radial-gradient(
ellipse at bottom,
rgba(147, 197, 253, 0.18),
rgba(196, 181, 253, 0.075) 36%,
transparent 72%
);
 
opacity: 0;
transform: translateY(18px) scaleX(0.72);
filter: blur(14px);
 
animation: bottomWake 900ms ease-out 120ms both;
}
 
/* Content always above glass layers */
.topline,
.front-content,
.front-review,
.glass-divider,
.back-content {
position: relative;
z-index: 3;
}
 
/* Header */
.topline {
display: flex;
justify-content: space-between;
align-items: center;
gap: 18px;
 
margin-bottom: clamp(20px, 3vw, 30px);
}
 
/* NB3 luxury glass badge */
.deck-mark {
padding: 7px 15px;
border-radius: 999px;
 
color: rgba(248, 250, 252, 0.96);
 
font-family:
    "Futura PT",
    "FuturaPT",
    "Futura PT Book",
    "Futura PT Medium",
    Futura,
    Inconsolata,
    sans-serif;
 
font-size: 18px;
font-weight: 500;
letter-spacing: 0.19em;
text-transform: uppercase;
 
background:
linear-gradient(
145deg,
rgba(255, 255, 255, 0.17),
rgba(255, 255, 255, 0.06) 48%,
rgba(255, 255, 255, 0.032)
);
 
border: 1px solid rgba(255, 255, 255, 0.17);
 
box-shadow:
inset 0 1px 0 rgba(255, 255, 255, 0.30),
inset 0 -1px 0 rgba(255, 255, 255, 0.065),
0 10px 26px rgba(0, 0, 0, 0.22),
0 0 calc(24px + 5px * var(--active)) rgba(147, 197, 253, 0.08);
 
backdrop-filter: blur(18px) saturate(165%);
-webkit-backdrop-filter: blur(18px) saturate(165%);
 
text-shadow:
1px 2px 1px rgba(255, 255, 255, 0.14),
1px 1px 14px rgba(147, 197, 253, 0.16);
}
 
/* Symbols */
.symbols {
color: rgba(248, 250, 252, 0.82);
font-size: clamp(16px, 2vw, 22px);
letter-spacing: clamp(3px, 0.8vw, 8px);
white-space: nowrap;
 
text-shadow:
0 0 calc(16px + 3px * var(--active)) rgba(147, 197, 253, 0.24),
0 0 calc(30px + 4px * var(--active)) rgba(196, 181, 253, 0.12);
}
 
/* Text */
.front-content {
color: var(--text-main);
font-family:
    "Futura PT",
    "FuturaPT",
    "Futura PT Book",
    "Futura PT Medium",
    Futura,
    Inconsolata,
    sans-serif;
font-weight: 400;
letter-spacing: -0.005em;
}
 
.front-review {
color: var(--text-soft);
font-family:
    "Futura PT",
    "FuturaPT",
    "Futura PT Book",
    "Futura PT Medium",
    Futura,
    Inconsolata,
    sans-serif;
font-size: clamp(14.5px, 1.4vw, 16.5px);
font-weight: 400;
line-height: 1.48;
letter-spacing: -0.005em;
opacity: 0.84;
}
 
.back-content {
color: var(--text-main);
font-family:
    "Futura PT",
    "FuturaPT",
    "Futura PT Book",
    "Futura PT Medium",
    Futura,
    Inconsolata,
    sans-serif;
font-size: clamp(15.5px, 1.6vw, 18px);
font-weight: 400;
line-height: 1.6;
letter-spacing: -0.005em;
}
 
.front-content,
.back-content {
text-shadow:
0 0 calc(5px * var(--active)) rgba(147, 197, 253, 0.035),
0 0 calc(10px * var(--active)) rgba(196, 181, 253, 0.025);
}
 
/* Divider */
.glass-divider {
height: 1.5px;
margin: clamp(22px, 3vw, 30px) 0;
 
background:
linear-gradient(
90deg,
transparent,
rgba(147, 197, 253, 0.38),
rgba(196, 181, 253, 0.28),
transparent
);
 
box-shadow: 2.5px 2px 16px rgba(147, 197, 253, 0.08);
}
 
/* Typography helpers */
b,
strong {
color: #ffffff;
font-weight: 650;
}
 
a {
color: var(--cyan);
text-decoration: none;
border-bottom: 1px solid rgba(103, 232, 249, 0.35);
}
 
.front-content br,
.front-review br,
.back-content br {
line-height: 1.85;
}
 
::selection {
background: rgba(147, 197, 253, 0.28);
color: #ffffff;
}
 
/* Optional label chips */
.label {
display: inline-flex;
align-items: center;
 
margin: 5px 0 8px;
padding: 4px 10px;
border-radius: 999px;
 
color: #e0f2fe;
font-size: 0.78em;
font-weight: 650;
letter-spacing: 0.055em;
text-transform: uppercase;
 
background: rgba(255, 255, 255, 0.075);
border: 1px solid rgba(255, 255, 255, 0.115);
 
box-shadow:
inset 1px 2px 1px rgba(255, 255, 255, 0.14),
0 8px 18px rgba(0, 0, 0, 0.16);
}
 
.label.answer {
color: var(--green);
}
 
.label.wrong {
color: var(--red);
}
 
.label.keywords {
color: var(--amber);
}
 
.label.clinical {
color: var(--blue);
}
 
.label.source {
color: var(--violet);
}
 
.cloze {
color: var(--cyan);
font-weight: 650;
text-shadow: 0 0 14px rgba(103, 232, 249, 0.16);
}
 
/* Spawn */
.spawn-main,
.spawn-1,
.spawn-2,
.spawn-3,
.spawn-4,
.reveal-line {
opacity: 0;
filter: blur(7px);
animation: textSpawn 560ms cubic-bezier(.18,.9,.24,1) both;
}
 
.spawn-main {
animation-delay: 130ms;
}
 
.spawn-1 {
animation-delay: 80ms;
}
 
.spawn-2 {
animation-delay: 210ms;
}
 
.spawn-3 {
animation-delay: 330ms;
}
 
.spawn-4 {
animation-delay: 450ms;
}
 
/* Enhanced line-by-line option */
.answer-stack {
display: grid;
gap: 18px;
}
 
.reveal-line {
padding-left: 0;
}
 
.reveal-line:nth-child(1) { animation-delay: 300ms; }
.reveal-line:nth-child(2) { animation-delay: 420ms; }
.reveal-line:nth-child(3) { animation-delay: 540ms; }
.reveal-line:nth-child(4) { animation-delay: 660ms; }
.reveal-line:nth-child(5) { animation-delay: 780ms; }
.reveal-line:nth-child(6) { animation-delay: 900ms; }
.reveal-line:nth-child(7) { animation-delay: 1020ms; }
.reveal-line:nth-child(8) { animation-delay: 1140ms; }
.reveal-line:nth-child(9) { animation-delay: 1260ms; }
.reveal-line:nth-child(10) { animation-delay: 1380ms; }
 
/* Animations */
@keyframes cardEntrance {
0% {
opacity: 0;
filter: blur(12px);
}
 
100% {
opacity: 1;
filter: blur(0);
}
}
 
@keyframes textSpawn {
0% {
opacity: 0;
filter: blur(8px);
}
 
100% {
opacity: 1;
filter: blur(0);
}
}
 
@keyframes bottomWake {
0% {
opacity: 0;
transform: translateY(22px) scaleX(0.58);
filter: blur(20px);
}
 
45% {
opacity: 0.75;
}
 
100% {
opacity: 0.20;
transform: translateY(0) scaleX(1);
filter: blur(18px);
}
}
 
@keyframes lusterSweep {
0% {
transform: translateX(-75%) rotate(17deg);
opacity: 0;
}
 
7% {
opacity: 0.82;
}
 
22% {
transform: translateX(355%) rotate(17deg);
opacity: 0;
}
 
100% {
transform: translateX(355%) rotate(17deg);
opacity: 0;
}
}
 
/* Soft idle depth only */
@keyframes floatDepth {
0% {
box-shadow:
0 38px 95px rgba(0, 0, 0, 0.50),
0 14px 38px rgba(15, 23, 42, 0.42),
0 0 calc(18px * var(--active)) rgba(147, 197, 253, 0.075),
0 0 calc(30px * var(--active)) rgba(196, 181, 253, 0.045),
inset 0 1px 0 rgba(255, 255, 255, 0.24),
inset 0 -1px 0 rgba(255, 255, 255, 0.055);
}
 
50% {
box-shadow:
0 41px 102px rgba(0, 0, 0, 0.515),
0 15px 40px rgba(15, 23, 42, 0.43),
0 0 calc(21px * var(--active)) rgba(147, 197, 253, 0.08),
0 0 calc(33px * var(--active)) rgba(196, 181, 253, 0.05),
inset 0 1px 0 rgba(255, 255, 255, 0.25),
inset 0 -1px 0 rgba(255, 255, 255, 0.058);
}
 
100% {
box-shadow:
0 38px 95px rgba(0, 0, 0, 0.50),
0 14px 38px rgba(15, 23, 42, 0.42),
0 0 calc(18px * var(--active)) rgba(147, 197, 253, 0.075),
0 0 calc(30px * var(--active)) rgba(196, 181, 253, 0.045),
inset 0 1px 0 rgba(255, 255, 255, 0.24),
inset 0 -1px 0 rgba(255, 255, 255, 0.055);
}
}
 
@keyframes orbDriftA {
from {
transform: translate3d(0, 0, 0) scale(1);
}
 
to {
transform: translate3d(20px, 14px, 0) scale(1.06);
}
}
 
@keyframes orbDriftB {
from {
transform: translate3d(0, 0, 0) scale(1);
}
 
to {
transform: translate3d(-22px, -12px, 0) scale(1.045);
}
}
 
@keyframes orbDriftC {
from {
transform: translate3d(0, 0, 0) scale(1);
}
 
to {
transform: translate3d(14px, -18px, 0) scale(1.07);
}
}
 
/* Mobile */
@media screen and (max-width: 700px) {
.anki-stage {
align-items: flex-start;
padding: 14px 8px;
}
 
.glass-card {
width: calc(100vw - 18px);
border-radius: 24px;
padding: 24px 20px;
 
--rx: 0deg;
--ry: 0deg;
--mx: 0px;
--my: 0px;
--active: 0;
 
transform:
perspective(1000px)
translate3d(0, 0, 0)
rotateX(0deg)
rotateY(0deg);
 
animation:
cardEntrance 520ms cubic-bezier(.18,.9,.24,1) both,
floatDepth 20s ease-in-out 650ms infinite;
}
 
.topline {
margin-bottom: 20px;
}
 
.deck-mark {
font-size: 11px;
padding: 6px 12px;
}
 
.symbols {
letter-spacing: 3px;
}
}
 
/* Accessibility */
@media (prefers-reduced-motion: reduce) {
.glass-card,
.ambient-orb,
.edge-luster::after,
.bottom-spawn,
.spawn-main,
.spawn-1,
.spawn-2,
.spawn-3,
.spawn-4,
.reveal-line {
animation: none !important;
opacity: 1 !important;
filter: none !important;
}
 
.glass-card {
transform: none !important;
transition: none !important;
}
}