// SC 09 · THE PLAN — a rainy kerb at night under Pickle's umbrella → Mia's phone hologram of the Central Bank of Robux
// (coin-stack tower, the Robux Printer at 1000%) → the plan ("UN-robbing it") → Grandma goes LIVE → Dad's minivan, RGB socks,
// under the speed limit. The rain eases off as hope rises.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor, coin } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');

const START = K.V.scene('SC 09').start, END = K.V.scene('SC 10').start;
const l0 = L('09.0'), l1 = L('09.1'), l2 = L('09.2'), l3 = L('09.3'), l4 = L('09.4'), l5 = L('09.5'), l6 = L('09.6'), l7 = L('09.7'), l8 = L('09.8');

// beats (all from the voice)
const tSit = l0.word("We've").t0 - 0.2, tLook = l0.word('Look').t0;
const c1 = l1.a - 0.15, tPrinter = l1.word('Printer').t0;
const c2 = l1.word('Every').t0 - 0.1, tWorld = l1.word('world').t0, tOne = l1.word('one').t0;
const c3 = l1.word('And').t0 - 0.1, tThousand = l1.word('thousand').t0, tPercent = l1.word('percent').t0;
const c4 = l2.a - 0.1, tOff = l2.word('off').t0, tStop = l2.word('stop').t0, tUp = l2.word('up').t0;
const c5 = l3.a - 0.05, tGuy = l3.word('Guy').t0, tTaking = l3.word('taking').t0, tEvery = l3.word('EVERYTHING').t0;
const c6 = l4.a - 0.05, tBuilding = l4.word('building').t0;
const c7 = l5.a - 0.25, tRob = l5.word('rob').t0, tBank = l5.word('bank').t0;
const c8 = l6.a - 0.05, tUn = l6.word('UN-robbing').t0, tGo = l6.word("Let's").t0;
const c9 = l7.a - 0.2, tDistr = l7.word('distraction').t0, tSweetie = l7.word('sweetie').t0;
const c10 = l7.word('Chat').t0 - 0.12, tLive = l7.word('LIVE').t0;
const c11 = l8.a - 0.2, tCar = l8.word('car').t0;
const c12 = l8.word('Very').t0 - 0.12, tCare = l8.word('carefully').t0;
const c13 = l8.word('Under').t0 - 0.15, tLimit = l8.word('limit').t0;

// rain: full storm until "Let's go", then it eases off and stops on "speed limit"
const storm = (t) => 1 - ease.inOut(seg(t, tGo - 0.4, tLimit + 0.2));

// ---------------------------------------------------------------- defs
const DEFS = `<defs>
<pattern id="s09brick" patternUnits="userSpaceOnUse" width="320" height="140">
<rect width="320" height="140" fill="#21163F"/>
<rect x="5" y="4" width="150" height="62" rx="6" fill="#3A2A66"/><rect x="165" y="4" width="150" height="62" rx="6" fill="#36285F"/>
<rect x="-75" y="74" width="150" height="62" rx="6" fill="#33265A"/><rect x="85" y="74" width="150" height="62" rx="6" fill="#3A2A66"/><rect x="245" y="74" width="150" height="62" rx="6" fill="#33265A"/>
<rect x="12" y="8" width="136" height="6" rx="3" fill="#4C3B80"/><rect x="92" y="78" width="136" height="6" rx="3" fill="#4C3B80"/><rect x="172" y="8" width="136" height="6" rx="3" fill="#47387A"/>
</pattern>
<linearGradient id="s09sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B0824"/><stop offset="0.6" stop-color="#22184C"/><stop offset="1" stop-color="#3A2A6A"/></linearGradient>
<linearGradient id="s09skyClear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#142A6A"/><stop offset="0.6" stop-color="#3A3C8E"/><stop offset="1" stop-color="#7A62B0"/></linearGradient>
<radialGradient id="s09lamp" cx="0.5" cy="0" r="1"><stop offset="0" stop-color="#FFD98A" stop-opacity="0.5"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>
<linearGradient id="s09cone" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#5CF2FF" stop-opacity="0.55"/><stop offset="1" stop-color="#5CF2FF" stop-opacity="0"/></linearGradient>
<radialGradient id="s09glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#5CF2FF" stop-opacity="0.45"/><stop offset="1" stop-color="#5CF2FF" stop-opacity="0"/></radialGradient>
<radialGradient id="s09warm" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFE9A8" stop-opacity="0.6"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>
<radialGradient id="s09head" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF6D0" stop-opacity="0.85"/><stop offset="1" stop-color="#FFF6D0" stop-opacity="0"/></radialGradient>
<pattern id="s09scan" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="3" fill="#5CF2FF" opacity="0.18"/></pattern>
<pattern id="s09grid" patternUnits="userSpaceOnUse" width="80" height="80"><path d="M80 0 L0 0 L0 80" fill="none" stroke="#5CF2FF" stroke-width="2" opacity="0.25"/></pattern>
<pattern id="s09blue" patternUnits="userSpaceOnUse" width="60" height="60"><rect width="60" height="60" fill="#1C4FA0"/><path d="M60 0 L0 0 L0 60" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.22"/></pattern>
</defs>`;

// ---------------------------------------------------------------- small helpers
const ZS = { ty: 1, mia: 1.04, pickle: 0.95, dad: 1.1, grandma: 0.98, thirty: 0.7 };
const HC = '#5CF2FF';
const hol = (w = 4, op = 0.16) => ({ fill: HC, 'fill-opacity': op, stroke: HC, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const glowText = (s, x, y, size, col = HC, extra = {}) => T(s, x, y, size, col, { stroke: '#06222A', 'stroke-width': size * 0.12, 'paint-order': 'stroke', ...extra });
const rot = (svg, deg, cx = 960, cy = 540) => (deg ? S.g(svg, `rotate(${f(deg)} ${cx} ${cy})`) : svg);
const shook = (cam, t, a, dur, amp) => { const s = K.shake(t, a, dur, amp); cam.sx = (cam.sx || 0) + s.sx; cam.sy = (cam.sy || 0) + s.sy; return cam; };

// actor with head-attached props (they follow the auto head bob/tilt)
function who(name, t, pose = {}, act = {}, head = []) {
  const auto = K.V.perform(name.toUpperCase(), t, { seed: name.length * 3.7 + (act.seed || 0), ...act });
  const p = { ...auto, ...pose };
  const props = [...(pose.props || [])];
  for (const h of head) if (h) props.push({ svg: S.g(h, `translate(0 ${f(p.headY || 0)}) rotate(${f(p.headRot || 0)} 0 -560)`), layer: 'front' });
  return actor(name, t, { shadow: false, ...pose, props }, act);
}
// Mia's beret (body space); wet = droopier
function beret(view = 'front', wet = 0) {
  const d = 'M-196 12 Q-206 -92 -20 -112 Q178 -116 200 0 Q196 34 0 38 Q-192 40 -196 12 Z';
  const g = S.path(d, ol('#E0405E', 7)) + S.path('M-150 -40 Q-60 -92 70 -90', ln(12, '#FF8AA2')) + S.path('M-186 16 Q0 44 190 6', ln(6, '#B52A48')) +
    S.path('M-8 -108 Q-4 -140 18 -146', ln(12, '#151515')) + S.path('M-8 -108 Q-4 -140 18 -146', ln(6, '#C22E4C'));
  const tf = view === 'side' ? `translate(26 -968) rotate(${f(-4 + wet * 8)}) scale(0.9 ${f(1 - wet * 0.15)})` : `translate(-4 -958) rotate(${f(-9 + wet * 6)}) scale(1 ${f(1 - wet * 0.15)})`;
  return S.g(g, tf);
}
// seated (front view): the actor is clipped at the hips and gets foreshortened legs that hang over the kerb
const DES = require('../rig/cast').D;
function seatedLegs(name, spread = 0, swing = 0) {
  const c = DES[name].style.col, sock = DES[name].style.sock;
  let o = '';
  for (const sd of [-1, 1]) {
    const cx = sd * (54 + spread), sw = swing * sd;
    o += S.g(S.rect(-42, 0, 84, 150, 14, ol(c.pantsShade || c.pants, 6)) +
      (sock && sock.side === sd
        ? S.path(S.roundedPath([[-46, 136], [46, 136], [50, 196], [-50, 196]], 20), ol(sock.col || '#FFFFFF', 6)) + S.path('M-34 156 L34 156', ln(4, '#0002'))
        : S.rect(-56, 140, 112, 54, 22, ol(c.sole, 6)) + S.ellipse(0, 150, 42, 24, ol(c.toe, 5)) + (c.toe !== c.sole ? S.path('M-22 138 Q0 128 22 138', ln(4, '#FFFFFF')) : '')),
    `translate(${cx} 44) rotate(${f(sw)})`);
    o += S.rect(cx - 52, -16, 104, 80, 24, ol(c.pants, 6)) + S.rect(cx - 38, -6, 76, 14, 7, { fill: '#FFFFFF', opacity: 0.2 });
  }
  return o;
}
// hips land on screen y = top; pose/act/head as in who()
function seat(name, t, x, top, s, pose = {}, act = {}, head = [], legs = {}) {
  const k = s * ZS[name];
  const id = S.uid('s09seat');
  const cut = top + 10 * k;
  const clip = S.rect(x - 3000, -5000, 6000, cut + 5000) + S.rect(x - 3000, cut - 1, 3000 - 98 * k, 4000) + S.rect(x + 98 * k, cut - 1, 3000, 4000);
  const body = who(name, t, { x, y: top + 306 * k, s, armL: 16, armR: 16, ...pose }, act, head);
  return S.clipDef(id, clip) + S.g(body, null, { 'clip-path': `url(#${id})` }) + S.g(seatedLegs(name, legs.spread || 0, legs.swing || 0), `translate(${f(x)} ${f(top)}) scale(${f(k)})`);
}
// body-space hand tip for a front-view arm angle, including bodyY
const handAt = (a, side, B = 0) => { const h = A.hand(a, side); return [h[0], h[1] + B]; };

// rain drawn everywhere except a sheltered polygon (evenodd clip)
function rainOutside(t, n, hole, opts = {}) {
  if (n < 1) return '';
  const r = K.rain(t, Math.round(n), { op: 0.5, ...opts });
  if (!hole) return r;
  const id = S.uid('s09rc');
  const d = 'M-2000 -2000 L4000 -2000 L4000 3000 L-2000 3000 Z M' + hole.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L') + ' Z';
  return S.clipDef(id, S.path(d, { 'clip-rule': 'evenodd' })) + S.g(r, null, { 'clip-path': `url(#${id})` });
}
function ripples(t, x0, x1, y0, y1, n, k = 1, seed = 1) {
  if (k <= 0.02) return '';
  let o = '';
  for (let i = 0; i < n; i++) {
    const per = 0.7 + hash(i * 3 + seed) * 0.6;
    const ph = ((t + hash(i + seed) * 5) % per) / per;
    const cyc = Math.floor((t + hash(i + seed) * 5) / per);
    const x = lerp(x0, x1, hash(i * 7.1 + cyc * 1.3 + seed)), y = lerp(y0, y1, hash(i * 2.9 + cyc * 0.7 + seed));
    o += S.ellipse(x, y, 8 + ph * 46, 3 + ph * 12, { fill: 'none', stroke: '#A9C7FF', 'stroke-width': 3, opacity: f(0.6 * (1 - ph) * k) });
  }
  return o;
}
function drips(t, x, y, n = 3, seed = 0, len = 120) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const ph = ((t * 1.6 + hash(i + seed)) % 1);
    const dx = (hash(i * 3 + seed) - 0.5) * 70;
    o += S.path(`M${f(x + dx)} ${f(y + ph * len)} q-7 13 0 19 q7 -6 0 -19 Z`, { fill: '#9FD8FF', stroke: '#151515', 'stroke-width': 2.5, opacity: f(1 - ph * 0.6) });
  }
  return o;
}

// ---------------------------------------------------------------- the night street (same rainy city as the end of SC 08)
function lampPost(x, base, t, h = 560) {
  let o = S.path(`M${x} ${base} L${x} ${base - h} Q${x} ${base - h - 40} ${x + 40} ${base - h - 40} L${x + 120} ${base - h - 40}`, ln(22, '#151515')) +
    S.path(`M${x} ${base} L${x} ${base - h} Q${x} ${base - h - 40} ${x + 40} ${base - h - 40} L${x + 120} ${base - h - 40}`, ln(12, '#3B3360'));
  o += S.rect(x - 26, base - 40, 52, 40, 8, ol('#2A2244', 5));
  o += S.path(`M${x + 80} ${base - h - 40} L${x + 160} ${base - h - 40} L${x + 176} ${base - h - 6} L${x + 64} ${base - h - 6} Z`, ol('#2A2244', 5));
  o += S.ellipse(x + 120, base - h - 4, 52, 12, { fill: '#FFF1B8' });
  const fl = 0.92 + 0.08 * Math.sin(t * 23) * Math.sin(t * 7);
  o += S.path(`M${x + 70} ${base - h} L${x - 160} ${base + 40} L${x + 420} ${base + 40} L${x + 170} ${base - h} Z`, { fill: 'url(#s09lamp)', opacity: f(fl) });
  o += S.circle(x + 120, base - h - 4, 90, { fill: 'url(#s09warm)', opacity: f(fl) });
  return o;
}
function shopFront(x, y, t) {
  // closed bakery with a flickering neon price sign (callback to the bread prices)
  let o = S.rect(x, y, 520, 470, 10, ol('#2A2050', 7));
  o += S.rect(x + 30, y + 120, 300, 350, 6, ol('#1A1430', 6));
  for (let i = 0; i < 9; i++) o += S.rect(x + 34, y + 128 + i * 38, 292, 26, 3, { fill: '#3F3770' });
  o += S.rect(x + 360, y + 120, 130, 350, 6, ol('#3A2C24', 6)) + S.circle(x + 380, y + 300, 9, { fill: '#C9A04A' });
  o += S.rect(x + 20, y + 20, 480, 80, 14, ol('#41306E', 6)) + TF('BAKERY', x + 260, y + 80, 52, '#C9B8F0');
  const on = Math.floor(t * 6) % 7 !== 0;
  o += S.g(S.rect(-110, -46, 220, 92, 18, { fill: 'none', stroke: on ? '#FF5AA8' : '#5A2A44', 'stroke-width': 7 }) + TF('BREAD', 0, -6, 34, on ? '#FFB3DA' : '#6A3A54') +
    T('5,000 R$', 0, 32, 36, on ? '#FFE14D' : '#6A5A2A'), `translate(${x + 180} ${y + 220}) rotate(-4)`);
  if (on) o += S.circle(x + 180, y + 220, 160, { fill: 'url(#s09warm)', opacity: 0.25 });
  return o;
}
function poster(x, y, rotd, txt, sub, col) {
  return S.g(S.rect(-90, -120, 180, 240, 6, ol('#E9E2D6', 5)) + S.rect(-70, -100, 140, 120, 4, { fill: col }) + T(txt, 0, 70, 46, '#2A1640') + TF(sub, 0, 104, 22, '#5A4A6A') +
    S.path('M70 -120 L90 -100 L90 -120 Z', { fill: '#BFB6A6' }), `translate(${x} ${y}) rotate(${rotd})`);
}
function drainPipe(x, top, base, t, k = 1) {
  let o = S.rect(x - 22, top, 44, base - top - 60, 8, ol('#4A4270', 6));
  o += S.path(`M${x - 22} ${base - 70} Q${x - 22} ${base - 30} ${x + 30} ${base - 30} L${x + 60} ${base - 30} L${x + 60} ${base - 6} L${x + 30} ${base - 6} Q${x - 46} ${base - 6} ${x - 46} ${base - 70} Z`, ol('#4A4270', 6));
  if (k > 0.05) for (let i = 0; i < 5; i++) {
    const ph = (t * 2.2 + i / 5) % 1;
    o += S.ellipse(x + 64 + ph * 60, base - 18 + ph * ph * 120, 8, 12, { fill: '#9FD8FF', opacity: f(k * (1 - ph)) });
  }
  return o;
}
// the whole street for the front-facing kerb shots; kerb top at y = top
function street(t, o = {}) {
  const { top = 800, lampX = 1560, extraLeft = true } = o;
  const k = storm(t);
  const wallB = top - 110;
  let s = S.rect(-700, -900, 3400, wallB + 900, 0, { fill: 'url(#s09brick)' });
  s += S.rect(-700, wallB - 30, 3400, 30, 0, { fill: '#1A1236' });
  s += shopFront(-150, wallB - 470, t);
  s += poster(520, 300, -4, '1000%', 'PRICES ↑', '#FF5A6E') + poster(700, 330, 5, 'R$?!', 'LOST: VALUE', '#7A6BFF');
  s += drainPipe(1180, -700, wallB, t, k);
  s += S.rect(1260, wallB - 420, 220, 300, 8, ol('#1F1838', 6)) + S.rect(1280, wallB - 400, 180, 120, 4, { fill: '#FFD98A', opacity: 0.55 }) + S.path(`M1370 ${wallB - 400} L1370 ${wallB - 280}`, ln(5));
  s += S.rect(1880, wallB - 520, 360, 520, 10, ol('#2A2050', 7)) + S.rect(1910, wallB - 490, 300, 200, 6, ol('#141026', 5)) + TF('CLOSED', 2060, wallB - 375, 48, '#FF5A6E');
  // sidewalk + kerb + road
  s += S.rect(-700, wallB, 3400, 110, 0, { fill: '#2E2556' });
  for (let x = -700; x < 2700; x += 260) s += S.path(`M${x} ${wallB} L${x - 40} ${top}`, ln(4, '#241C46'));
  s += S.rect(-700, wallB + 4, 3400, 8, 0, { fill: '#3E3470' });
  s += S.rect(-700, top, 3400, 48, 0, { fill: '#4B4180' }) + S.rect(-700, top - 6, 3400, 14, 0, { fill: '#8A7FD0' }) + S.rect(-700, top + 40, 3400, 10, 0, { fill: '#2A2050' });
  s += S.rect(-700, top + 48, 3400, 900, 0, { fill: '#1A1433' });
  s += S.rect(-700, top + 48, 3400, 40, 0, { fill: '#221A42' });
  for (let x = -600; x < 2700; x += 420) s += S.rect(x, top + 230, 200, 22, 8, { fill: '#C9B860', opacity: 0.35 });
  // puddles with the lamp's reflection
  for (const [px, py, rx] of [[260, top + 150, 190], [980, top + 210, 240], [1700, top + 140, 210], [2300, top + 200, 180]]) {
    s += S.ellipse(px, py, rx, 34, { fill: '#3A3270', opacity: 0.8 }) + S.ellipse(px + 30, py - 4, rx * 0.5, 10, { fill: '#8A7FD0', opacity: 0.4 });
  }
  s += S.ellipse(lampX + 120, top + 160, 120, 22, { fill: '#FFE9A8', opacity: 0.25 });
  s += lampPost(lampX, wallB + 60, t);
  s += ripples(t, -300, 2300, top + 110, top + 280, 14, k);
  return s;
}

// ---------------------------------------------------------------- umbrella (Pickle's)
// handle at (hx, hy); canopy `len` above along angle rotd; open 0..1
function umbrella(hx, hy, len, rotd, R, t, open = 1, k = 1) {
  const w = R * lerp(0.28, 1, open), h = R * lerp(1.1, 0.62, open);
  let o = S.path(`M0 0 L0 ${-len}`, ln(16, '#151515')) + S.path(`M0 0 L0 ${-len}`, ln(8, '#8A5A34'));
  o += S.path('M0 0 L0 28 Q0 62 -30 62 Q-56 62 -56 36', ln(22, '#151515')) + S.path('M0 0 L0 28 Q0 62 -30 62 Q-56 62 -56 36', ln(13, '#C2452D'));
  const n = 6;
  let d = `M${f(-w)} ${-len} Q${f(-w)} ${f(-len - h)} 0 ${f(-len - h * 1.02)} Q${f(w)} ${f(-len - h)} ${f(w)} ${-len}`;
  for (let i = n - 1; i >= 0; i--) {
    const xa = -w + (2 * w * i) / n, xb = -w + (2 * w * (i + 1)) / n;
    d += ` Q${f((xa + xb) / 2)} ${f(-len - h * 0.16)} ${f(xa)} ${-len}`;
  }
  o += S.path(d + ' Z', ol('#58B947', 8));
  for (let i = 1; i < n; i += 2) {
    const xa = -w + (2 * w * i) / n, xb = -w + (2 * w * (i + 1)) / n;
    o += S.path(`M${f(xa)} ${-len} Q${f(xa * 0.55)} ${f(-len - h * 0.8)} 0 ${f(-len - h * 1.02)} Q${f(xb * 0.55)} ${f(-len - h * 0.8)} ${f(xb)} ${-len} Q${f((xa + xb) / 2)} ${f(-len - h * 0.16)} ${f(xa)} ${-len} Z`, { fill: '#449A36' });
  }
  for (let i = 0; i <= n; i++) {
    const x = -w + (2 * w * i) / n;
    o += S.path(`M${f(x)} ${-len} Q${f(x * 0.55)} ${f(-len - h * 0.8)} 0 ${f(-len - h * 1.02)}`, ln(5, '#151515'));
  }
  o += S.path(`M${f(-w * 0.7)} ${f(-len - h * 0.5)} Q${f(-w * 0.4)} ${f(-len - h * 0.92)} ${f(-w * 0.05)} ${f(-len - h * 0.98)}`, ln(10, '#A6F08A', 0.7));
  o += S.path(`M0 ${f(-len - h * 1.02)} L0 ${f(-len - h * 1.02 - 40)}`, ln(12));
  // little pickle emblem
  o += S.g(S.ellipse(0, 0, 40, 20, ol('#2F7A26', 4)) + S.circle(-14, -4, 4, { fill: '#A6F08A' }) + S.circle(10, 4, 4, { fill: '#A6F08A' }), `translate(${f(w * 0.35)} ${f(-len - h * 0.45)}) rotate(-20) scale(${f(open)} 1)`);
  // rain splashes on top
  if (k > 0.05) for (let i = 0; i < 6; i++) {
    const ph = (t * 3 + hash(i) * 3) % 1;
    const u = hash(i * 5 + Math.floor(t * 3 + hash(i) * 3)) * 1.6 - 0.8;
    const sx = u * w, sy = -len - h * Math.sqrt(Math.max(0, 1 - u * u)) * 0.98;
    o += S.path(`M${f(sx - 10 - ph * 16)} ${f(sy - 4 - ph * 14)} L${f(sx - 4)} ${f(sy - 2)} M${f(sx + 10 + ph * 16)} ${f(sy - 4 - ph * 14)} L${f(sx + 4)} ${f(sy - 2)}`, ln(4, '#CFE4FF', (1 - ph) * k));
  }
  return S.g(o, `translate(${f(hx)} ${f(hy)}) rotate(${f(rotd)})`);
}
// shelter polygon (world) under an umbrella defined like above
function shelter(hx, hy, len, rotd, R, open = 1, depth = 900) {
  const w = R * lerp(0.28, 1, open) * 0.96;
  const a = (rotd * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const P = (x, y) => [hx + x * ca - y * sa, hy + x * sa + y * ca];
  const [l, r] = [P(-w, -len), P(w, -len)];
  return [l, r, [r[0] + 60, r[1] + depth], [l[0] - 60, l[1] + depth]];
}

// ---------------------------------------------------------------- hologram art
// the Central Bank of Robux: coin-stack tower with the Robux Printer on top. mode 'holo' | 'gold'. Base at (0,0), ~1000 tall.
function towerArt(t, mode = 'holo', power = 1) {
  const H = mode === 'holo';
  const st = (fill, w = 6, op = 0.16) => (H ? hol(w * 0.66, op) : ol(fill, w));
  let o = '';
  o += S.rect(-230, -36, 460, 36, 8, st('#C9D8D4')) + S.rect(-200, -60, 400, 26, 6, st('#DCE7E4'));
  o += S.rect(-180, -200, 360, 142, 6, st('#EEF4F2', 6, 0.08));
  for (let i = 0; i < 5; i++) o += S.rect(-160 + i * 70, -186, 30, 124, 6, st('#FFFFFF', 5, 0.2));
  o += S.path('M-205 -200 L0 -276 L205 -200 Z', st('#E8C25A'));
  o += S.circle(0, -228, 20, st('#FFC93C', 5, 0.3));
  // coin stack
  let y = -276;
  for (let i = 0; i < 7; i++) {
    const cx = (hash(i * 3.1 + 2) - 0.5) * 34 + Math.sin(t * 2 + i) * (H ? 3 : 0), rx = 150 - i * 6, ry = 28, h = 70;
    o += S.ellipse(cx, y, rx, ry, st('#C98A12', 6, 0.08));
    o += S.rect(cx - rx, y - h, 2 * rx, h, 0, H ? { fill: HC, 'fill-opacity': 0.12 } : { fill: '#E0A21A' });
    o += S.path(`M${f(cx - rx)} ${y - h} L${f(cx - rx)} ${y} M${f(cx + rx)} ${y - h} L${f(cx + rx)} ${y}`, H ? ln(3, HC) : ln(6));
    for (let j = 1; j < 8; j++) { const xx = cx - rx + (2 * rx * j) / 8; o += S.path(`M${f(xx)} ${y - h + 10} L${f(xx)} ${y + 10 - Math.abs(xx - cx) * 0.05}`, H ? ln(2, HC, 0.5) : ln(4, '#B97A0E')); }
    o += S.ellipse(cx, y - h, rx, ry, st('#FFC93C', 6, 0.22));
    if (!H) o += S.path(`M${f(cx - rx * 0.6)} ${y - h - 8} Q${f(cx)} ${y - h - 22} ${f(cx + rx * 0.5)} ${y - h - 10}`, ln(6, '#FFF1B0'));
    y -= h;
  }
  // the Robux Printer
  const jig = Math.sin(t * 40) * 3 * power;
  let p = S.rect(-120, -150, 240, 150, 18, st('#2E8C8C'));
  p += S.rect(-90, -120, 110, 70, 10, st('#0E3B43', 5, 0.3));
  p += S.circle(70, -82, 34, st('#FFC93C', 5, 0.25)) + S.path(`M70 -82 L${f(70 + 26 * Math.cos(t * 9))} ${f(-82 + 26 * Math.sin(t * 9))}`, H ? ln(4, HC) : ln(5));
  p += S.rect(40, -250, 56, 104, 8, st('#3AA6A6')) + S.rect(30, -262, 76, 24, 8, st('#2E8C8C'));
  p += S.rect(-100, -190, 90, 44, 10, st('#3AA6A6'));
  for (let i = 0; i < 3; i++) p += S.circle(-70 + i * 36, -32, 9, H ? hol(2, 0.5) : { fill: ['#FF5A5A', '#FFD21F', '#3BD16F'][i], stroke: '#151515', 'stroke-width': 4 });
  o += S.g(p, `translate(${f(jig)} ${y})`);
  // the coin fountain
  const n = Math.round(16 * power);
  for (let i = 0; i < n; i++) {
    const per = 1.1, ph = ((t + (i / n) * per) % per) / per;
    const vx = (hash(i * 3.3) - 0.5) * 520, vy = -760 - hash(i * 1.7) * 280;
    const x = 68 + vx * ph, yy = y - 262 + vy * ph + 0.5 * 1500 * ph * ph;
    o += coin(x, yy, 16 + hash(i) * 8, i * 30, t * 8 + i);
  }
  return o;
}
// a projection: cone from (x, y) up to a hologram box (w x h centred on cx, cy)
function holoPanel(t, cx, cy, w, h, k, inner, fromX, fromY) {
  if (k <= 0.01) return '';
  const fl = (0.85 + 0.15 * Math.sin(t * 31) * Math.sin(t * 13)) * k;
  let o = '';
  if (fromX !== undefined) o += S.path(`M${fromX - 30} ${fromY} L${cx - w / 2} ${cy + h / 2} L${cx + w / 2} ${cy + h / 2} L${fromX + 30} ${fromY} Z`, { fill: 'url(#s09cone)', opacity: f(0.8 * fl) });
  const sc = ease.outBack(clamp(k, 0, 1));
  let g = S.ellipse(0, h / 2, w * 0.45, 26, { fill: HC, opacity: 0.25 }) + S.circle(0, 0, Math.max(w, h) * 0.62, { fill: 'url(#s09glow)' });
  g += inner;
  g += S.rect(-w / 2, -h / 2, w, h, 0, { fill: 'url(#s09scan)' });
  const by = ((t * 260) % h) - h / 2;
  g += S.rect(-w / 2, by, w, 10, 0, { fill: HC, opacity: 0.22 });
  o += S.g(g, `translate(${cx} ${cy}) scale(${f(sc)} ${f(sc * (0.9 + 0.1 * k))})`, { opacity: f(fl) });
  return o;
}

// ---------------------------------------------------------------- the trio on the kerb (front)
const TOP = 800;
function trioKerb(t, o = {}) {
  const { pickleX = 640, tyX = 900, miaX = 1180, s = 0.56, umbRot = 0, umbOpen = 1, miaState = 'sit', miaPhone = 0, tyFace, pickleFace, miaFace } = o;
  let out = '';
  const k = storm(t);
  // Pickle (umbrella in his raised screen-right hand)
  const pk = s * ZS.pickle;
  const pArm = 150 - umbRot * 0.4;
  const ph = A.hand(pArm, 1);
  const umb = { hx: pickleX + ph[0] * pk, hy: TOP + 306 * pk + ph[1] * pk, len: 330, rot: 6 + umbRot, R: 340 };
  out += seat('pickle', t, pickleX, TOP, s, { armR: pArm, armL: 18, face: pickleFace, headRot: 3 * Math.sin(t * 1.3) }, { arms: false }, [], { swing: 4 * Math.sin(t * 3) });
  // Ty in the middle
  out += seat('ty', t, tyX, TOP, s, { armL: 18, armR: 18, face: tyFace }, { arms: false });
  // Mia: walks in from the right, then sits with her phone
  if (miaState === 'walk') {
    const u = seg(t, START, tSit - 0.25);
    const x = lerp(2150, miaX + 40, ease.out(u));
    const wk = A.walk(t * 9);
    out += who('mia', t, { x, y: TOP - 30, s, view: 'side', ...wk, face: miaFace || { name: 'determined' } }, { arms: false }, [beret('side', 1)]);
    out += drips(t, x - 10, TOP - 30 - 470 * s * ZS.mia, 3, 2, 160);
  } else {
    const land = bump(t, tSit - 0.25, tSit + 0.15);
    const mArm = miaPhone ? lerp(20, 62, ease.outBack(seg(t, tLook - 0.2, tLook + 0.2))) : 18;
    const mh = A.hand(mArm, -1);
    const phoneSvg = S.g(K.phone(0, 0, 0.42, -8, S.rect(-150, -280, 300, 560, 0, { fill: miaPhone > 0.5 ? '#0E5A66' : '#2A2E44' }) + (miaPhone > 0.5 ? towerMini(t) : '')), `translate(${f(mh[0])} ${f(mh[1] - 40)})`);
    out += seat('mia', t, miaX, TOP + 14 * land, s, { sy: 1 - 0.06 * land, armL: mArm, armR: 18, props: [{ svg: phoneSvg, layer: 'front' }], face: miaFace }, { arms: false }, [beret('front', 1)]);
    out += drips(t, miaX, TOP - 420 * s, 2, 5, 140);
    if (land > 0) out += S.path(`M${miaX - 120} ${TOP + 10} q-30 -40 -60 -20 M${miaX + 120} ${TOP + 10} q30 -40 60 -20 M${miaX - 60} ${TOP} q-10 -50 -30 -60 M${miaX + 60} ${TOP} q10 -50 30 -60`, ln(6, '#9FD8FF', land));
  }
  out += umbrella(umb.hx, umb.hy, umb.len, umb.rot, umb.R, t, umbOpen, k);
  return { svg: out, umb };
}
function towerMini(t) {
  return S.g(towerArt(t, 'holo', 0.6), 'translate(0 230) scale(0.42)');
}

// ---------------------------------------------------------------- shots
function shotKerb(t) {
  // S1: Ty + Pickle under the umbrella, Mia walks in wet and plops down; "Look at this."
  const cam = camKeys(t, [[START, { zoom: 1.0, x: 120, y: -20 }], [tSit, { zoom: 1.06, x: 120, y: 20 }], [c1, { zoom: 1.2, x: 160, y: 60 }]]);
  shook(cam, t, tSit, 0.25, 6);
  const tri = trioKerb(t, {
    miaState: t < tSit - 0.25 ? 'walk' : 'sit', miaPhone: t > tLook - 0.2 ? 1 : 0, umbRot: 14 * ease.inOut(seg(t, tSit + 0.6, tSit + 1.3)),
    tyFace: t < START + 0.9 ? { name: 'sad' } : { name: 'neutral', eyes: { look: [0.8, 0] } }, pickleFace: t < tSit + 0.5 ? { name: 'happy', eyes: { look: [0.7, 0] } } : 'happy',
  });
  const w = street(t) + tri.svg;
  const hole = shelter(tri.umb.hx, tri.umb.hy, tri.umb.len, tri.umb.rot, tri.umb.R);
  let o = view(cam, w + rainOutside(t, 150 * storm(t), hole), 1);
  // phone glow on "Look at this"
  const g = seg(t, tLook, tLook + 0.4);
  if (g > 0) o += view(cam, S.circle(1080, 560, 260 * g, { fill: 'url(#s09glow)' }), 1);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#000', opacity: f(1 - seg(t, START, START + 0.3)) });
  return o;
}

function shotHolo(t) {
  // S2: the hologram rises from Mia's phone; faces lit cyan; push-in to the printer on "Printer"
  const HX = 900, HY = 470;
  const cam = camKeys(t, [[c1, { zoom: 1.0, x: 0, y: 0 }], [tPrinter - 0.1, { zoom: 1.04, x: -20, y: -10 }], [tPrinter + 0.4, { zoom: 1.55, x: HX - 960 + 40, y: -330 }], [c2, { zoom: 1.62, x: HX - 960 + 40, y: -340 }]]);
  let w = S.rect(-400, -400, 2800, 1900, 0, { fill: 'url(#s09brick)' }) + S.rect(-400, -400, 2800, 1900, 0, { fill: '#0B0824', opacity: 0.55 });
  w += lampPost(1640, 760, t, 700);
  // the trio, close (upper bodies), looking up into the hologram light
  let m = '';
  const pk = 0.78 * ZS.pickle, pH = A.hand(168, 1);
  m += who('pickle', t, { x: 170, y: 1330, s: 0.78, turn: 0.4, armR: 168, armL: 20, face: { name: 'amazed', eyes: { look: [0.7, -0.7] } } }, { arms: false });
  m += who('ty', t, { x: 500, y: 1360, s: 0.82, turn: 0.45, armL: 14, armR: 14, face: { name: 'amazed', eyes: { look: [0.6, -0.8] } } }, { arms: false });
  const mk = 0.84 * ZS.mia, mh = A.hand(80, -1);
  const phx = 1520 + mh[0] * mk, phy = 1330 + mh[1] * mk;
  m += who('mia', t, { x: 1520, y: 1330, s: 0.84, turn: -0.35, armL: 80, armR: 16, face: { name: 'smug', eyes: { look: [-0.6, -0.6] } } }, { arms: false }, [beret('front', 1)]);
  m += K.phone(phx, phy - 40, 0.36, -10, S.rect(-150, -280, 300, 560, 0, { fill: '#0E5A66' }) + S.circle(0, 0, 120, { fill: 'url(#s09glow)' }));
  // umbrella rim frames the top of the shot; the shaft comes down to Pickle's hand
  m += umbrella(170 + pH[0] * pk, 1330 + pH[1] * pk, 700, 3, 980, t, 1, storm(t));
  // hologram tower
  const k = seg(t, c1, c1 + 0.5);
  let inner = S.g(towerArt(t, 'holo', 1), 'translate(0 330) scale(0.62)');
  const lk = seg(t, tPrinter, tPrinter + 0.3);
  if (lk > 0) {
    inner += S.g(S.rect(-200, -40, 400, 80, 20, { fill: '#06222A', stroke: HC, 'stroke-width': 5 }) + glowText('ROBUX PRINTER', 0, 18, 46), `translate(230 -300) scale(${f(ease.outBack(lk) * 0.62)})`);
    inner += S.path('M110 -300 L60 -280', ln(5, HC, lk));
  }
  m += holoPanel(t, HX, HY, 640, 760, k, inner, phx, phy - 120);
  m += S.ellipse(500, 760, 260, 300, { fill: HC, opacity: 0.1 }) + S.ellipse(1460, 760, 220, 300, { fill: HC, opacity: 0.1 });
  let o = view(cam, w, 0.5) + view(cam, m + K.rain(t, 70 * storm(t), { op: 0.35 }), 1);
  return o;
}

function globe(t, r) {
  const id = S.uid('s09gl');
  let land = '';
  for (let i = -1; i < 3; i++) {
    const x = ((t * 60) % (r * 2.4)) + i * r * 2.4 - r;
    land += S.path(`M${f(x - 60)} -60 q40 -50 90 -20 q30 30 -10 70 q-50 30 -70 -10 Z M${f(x + 80)} 30 q50 -10 70 30 q-10 50 -60 50 q-30 -40 -10 -80 Z M${f(x - 120)} 60 q30 -10 40 20 q-20 30 -40 -20 Z`, hol(3, 0.35));
  }
  return S.circle(0, 0, r, hol(5, 0.12)) + S.clipDef(id, S.circle(0, 0, r - 3)) + S.g(land, null, { 'clip-path': `url(#${id})` }) +
    S.ellipse(0, 0, r, r * 0.35, { fill: 'none', stroke: HC, 'stroke-width': 2, opacity: 0.4 }) + S.ellipse(0, 0, r * 0.45, r, { fill: 'none', stroke: HC, 'stroke-width': 2, opacity: 0.4 });
}
function gift(x, y, s, rotd) {
  return S.g(S.rect(-30, -24, 60, 50, 6, hol(3, 0.3)) + S.rect(-36, -36, 72, 16, 4, hol(3, 0.4)) + S.path('M0 -36 L0 26 M-14 -40 Q-24 -60 0 -38 Q24 -60 14 -40', ln(3, '#FFE14D')), `translate(${f(x)} ${f(y)}) rotate(${f(rotd)}) scale(${f(s)})`);
}
function shotRewards(t) {
  // S2b: inside the hologram — every daily reward in the world pours out of ONE machine
  const cam = camKeys(t, [[c2, { zoom: 1.12, x: -40, y: 20 }], [tOne, { zoom: 1.0, x: 0, y: 0 }], [c3, { zoom: 1.08, x: 20, y: -30 }]]);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#04161C' }) + S.rect(-200, -200, 2400, 1500, 0, { fill: 'url(#s09grid)' });
  let w = '';
  // printer (upper right) feeding the globe (lower left)
  const mx = 1320, my = 600;
  w += S.g(towerArt(t, 'holo', 1), `translate(${mx} 930) scale(0.74)`);
  const gk = ease.outBack(seg(t, tWorld - 0.3, tWorld + 0.2));
  w += S.g(globe(t, 230), `translate(470 640) scale(${f(Math.max(0.01, gk))})`);
  // stream of rewards + coins from the printer chute to the globe
  for (let i = 0; i < 22; i++) {
    const ph = ((t * 0.55 + i / 22) % 1);
    const x = lerp(mx + 50, 470, ph), y = lerp(250, 560, ph) - Math.sin(ph * Math.PI) * 110;
    w += i % 3 ? coin(x, y, 18, i * 30, t * 7 + i) : gift(x, y, 0.8, Math.sin(t * 5 + i) * 20);
  }
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + t * 0.6;
    w += TF('+1', 470 + Math.cos(a) * 300, 640 + Math.sin(a) * 300, 34, '#FFE14D', { stroke: '#04161C', 'stroke-width': 6, 'paint-order': 'stroke', opacity: f(gk) });
  }
  w += glowText('DAILY REWARDS', 470, 330, 54, HC, { opacity: f(seg(t, c2, c2 + 0.3)) });
  // "this ONE machine": target ring snaps onto the printer
  const rk = seg(t, tOne - 0.15, tOne + 0.15);
  if (rk > 0) {
    const R = lerp(600, 230, ease.out(rk));
    w += S.g(S.circle(0, 0, R, { fill: 'none', stroke: '#FFE14D', 'stroke-width': 10, 'stroke-dasharray': '40 24' }) + S.path(`M${-R - 40} 0 L${-R + 30} 0 M${R + 40} 0 L${R - 30} 0 M0 ${-R - 40} L0 ${-R + 30} M0 ${R + 40} L0 ${R - 30}`, ln(10, '#FFE14D')), `translate(${mx + 20} 280) rotate(${f(t * 40)})`);
    w += K.bang('1 MACHINE', mx + 20, 560, rk, 80, -5, '#FFE14D');
  }
  o += view(cam, w, 1);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s09scan)' });
  o += C.whiteFlash(0.4 * bump(t, c2 - 0.02, c2 + 0.12));
  return o;
}

function gauge(t, val, crack) {
  let o = S.circle(0, 0, 330, hol(8, 0.1)) + S.circle(0, 0, 300, { fill: '#06222A', opacity: 0.6 });
  o += S.path('M-260 0 A260 260 0 0 1 260 0', { fill: 'none', stroke: HC, 'stroke-width': 26, opacity: 0.35 });
  o += S.path(`M${f(260 * Math.cos(Math.PI * 1.25))} ${f(260 * Math.sin(Math.PI * 1.25))} A260 260 0 0 1 260 0`, { fill: 'none', stroke: '#FF3B5C', 'stroke-width': 26, opacity: 0.8 });
  const labels = ['0', '250', '500', '750', '1000'];
  labels.forEach((s, i) => {
    const a = Math.PI + (i / 4) * Math.PI;
    o += S.path(`M${f(Math.cos(a) * 220)} ${f(Math.sin(a) * 220)} L${f(Math.cos(a) * 280)} ${f(Math.sin(a) * 280)}`, ln(8, i === 4 ? '#FF3B5C' : HC));
    o += TF(s, Math.cos(a) * 170, Math.sin(a) * 170 + 14, 36, i === 4 ? '#FF6F86' : HC);
  });
  const a = Math.PI + clamp(val / 1000, -0.1, 1.08) * Math.PI;
  o += S.path(`M0 0 L${f(Math.cos(a) * 250)} ${f(Math.sin(a) * 250)}`, ln(16, '#151515')) + S.path(`M0 0 L${f(Math.cos(a) * 246)} ${f(Math.sin(a) * 246)}`, ln(9, '#FFE14D'));
  o += S.circle(0, 0, 30, ol('#FFE14D', 6));
  o += T(`${Math.round(Math.max(0, val))}%`, 0, 140, 90, val > 900 ? '#FF3B5C' : HC, { stroke: '#06222A', 'stroke-width': 10, 'paint-order': 'stroke' });
  if (crack > 0) o += S.path('M60 -240 L20 -150 L70 -90 L10 -20 M20 -150 L-60 -130 M70 -90 L150 -60', ln(6, '#FFFFFF', crack));
  return o;
}
function shotGauge(t) {
  // S2c: "running at a thousand percent" — the needle slams to 1000%, alarms, cracked glass
  const hit = tThousand + 0.1;
  const cam = camKeys(t, [[c3, { zoom: 1.0, x: 0, y: -20 }], [hit, { zoom: 1.12, x: -60, y: -40 }], [c4, { zoom: 1.24, x: -80, y: -50 }]]);
  shook(cam, t, hit, 1.2, 16);
  const red = t > hit ? 0.5 + 0.5 * Math.sin((t - hit) * 16) : 0;
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#04161C' }) + S.rect(-200, -200, 2400, 1500, 0, { fill: 'url(#s09grid)' });
  let w = '';
  // the printer housing behind the gauge
  w += S.rect(260, 110, 1400, 800, 60, hol(8, 0.08));
  for (let i = 0; i < 6; i++) w += S.circle(360 + i * 240, 170, 26, hol(4, 0.3));
  w += S.g(towerArt(t, 'holo', 1.6), 'translate(1560 960) scale(0.55)');
  const v = t < hit ? lerp(100, 1000, ease.in(seg(t, c3 + 0.2, hit))) : 1000 + Math.sin(t * 70) * 25;
  w += S.g(gauge(t, v, seg(t, tPercent, tPercent + 0.1)), 'translate(860 520) scale(0.92)');
  // steam puffs
  for (let i = 0; i < 6; i++) {
    const ph = ((t - hit) * 1.4 + i / 6) % 1;
    if (t > hit) w += S.circle(860 + (i % 2 ? 380 : -380) + (i % 2 ? 1 : -1) * ph * 120, 260 - ph * 220, 30 + ph * 60, { fill: '#DDF6FF', opacity: f(0.5 * (1 - ph)) });
  }
  o += view(cam, w, 1);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF0033', opacity: f(0.2 * red) });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s09scan)' });
  o += K.bang('1000%!!', 1420, 260, seg(t, hit, hit + 0.12), 120, -8, '#FF3B5C');
  o += C.whiteFlash(0.4 * bump(t, c3 - 0.02, c3 + 0.12));
  return o;
}

function priceChart(t, kx, stopK) {
  // red prices climbing; after "stop" the line goes flat and green
  const stopU = 0.58;
  const pts = Array.from({ length: 50 }, (_, i) => {
    const u = i / 49, uu = Math.min(u, stopU);
    return [u, 0.08 + 2.2 * uu * uu + 0.02 * Math.sin(u * 40) * (u < stopU ? 1 : 0.3)];
  });
  return K.chart(-330, -200, 660, 400, pts, kx, stopK > 0 ? '#3BD16F' : '#FF3B5C', stopK > 0 ? '' : '↑↑↑');
}
function lever(t, on) {
  let o = S.rect(-120, -180, 240, 360, 30, hol(6, 0.12));
  o += glowText('ON', 0, -120, 54, on > 0.5 ? '#3BD16F' : HC) + glowText('OFF', 0, 160, 54, on > 0.5 ? HC : '#FF6F86');
  o += S.rect(-24, -80, 48, 160, 20, { fill: '#06222A', stroke: HC, 'stroke-width': 4 });
  const a = lerp(-40, 40, 1 - on);
  o += S.g(S.path('M0 0 L0 -130', ln(20, '#151515')) + S.path('M0 0 L0 -130', ln(12, '#C9D8D4')) + S.circle(0, -140, 34, ol('#FF3B5C', 6)), `rotate(${f(180 - a)})`);
  return o;
}
function shotTyIdea(t) {
  // S3: Ty — "turn it off... prices stop going up!"
  const cam = camKeys(t, [[c4, { zoom: 1.0, x: 0, y: 0 }], [tStop, { zoom: 1.06, x: 30, y: 0 }], [c5, { zoom: 1.12, x: 50, y: 0 }]]);
  let o = S.rect(-200, -200, 2400, 1500, 0, { fill: 'url(#s09brick)' }) + S.rect(0, 0, 1920, 1080, 0, { fill: '#0B0824', opacity: 0.5 });
  let w = '';
  const up = seg(t, tUp - 0.1, tUp + 0.2);
  w += S.ellipse(520, 520, 320, 420, { fill: HC, opacity: 0.1 });
  w += who('ty', t, { x: 470, y: 1230 - 40 * ease.outBack(up), s: 0.92, turn: 0.35, armL: lerp(16, 165, ease.outBack(up)), armR: lerp(16, 150, ease.outBack(up)), face: t < tOff ? { name: 'confused', eyes: { look: [0.7, -0.2] } } : t < tUp ? { name: 'excited', eyes: { look: [0.7, -0.2] } } : 'excited' }, { arms: false });
  // hologram: switch, then the price chart
  const on = 1 - ease.outBack(seg(t, tOff, tOff + 0.25));
  let inner = S.g(lever(t, on), 'translate(-330 0) scale(0.95)');
  const kx = t < tStop ? 0.58 * seg(t, c4 + 0.3, tStop) : 0.58 + 0.42 * seg(t, tStop, tStop + 0.6);
  inner += S.g(priceChart(t, Math.max(0.04, kx), t > tStop ? 1 : 0), 'translate(170 20) scale(0.95)');
  if (t > tStop) inner += S.g(S.path('M-50 -60 L50 -60 L80 -30 L80 30 L50 60 L-50 60 L-80 30 L-80 -30 Z', ol('#E2233B', 6)) + T('STOP', 0, 20, 48, '#FFFFFF'), `translate(300 -170) scale(${f(ease.outBack(seg(t, tStop, tStop + 0.25)))}) rotate(-8)`);
  w += holoPanel(t, 1290, 440, 1060, 620, seg(t, c4 - 0.1, c4 + 0.25), inner);
  o += view(cam, w + K.rain(t, 90 * storm(t), { op: 0.35 }), 1);
  o += K.bang('CLICK!', 900, 220, bump(t, tOff, tOff + 0.6), 70, -8, HC);
  return o;
}

function iconCut(kind, x, y, k, t) {
  // an icon with a 30% slice flying out (k 0..1)
  let o = '';
  const art = {
    coin: () => coin(0, 0, 60, 0, 0),
    house: () => S.path('M-60 -10 L0 -64 L60 -10 L60 54 L-60 54 Z', ol('#FFB4C8', 5)) + S.rect(-16, 14, 32, 40, 4, ol('#7A3B52', 4)),
    sandwich: () => S.path('M-66 10 Q0 -60 66 10 Z', ol('#E8B060', 5)) + S.rect(-66, 10, 132, 14, 4, ol('#5BD15B', 4)) + S.rect(-66, 24, 132, 14, 4, ol('#E2533B', 4)) + S.rect(-66, 38, 132, 20, 8, ol('#E8B060', 5)),
    car: () => S.rect(-70, -20, 140, 50, 16, ol('#34C3FF', 5)) + S.path('M-40 -20 L-24 -50 L30 -50 L46 -20 Z', ol('#BDEBFF', 4)) + S.circle(-38, 34, 16, ol('#23262F', 4)) + S.circle(38, 34, 16, ol('#23262F', 4)),
    hat: () => S.path('M-70 30 L70 30 L50 20 L40 -40 L-40 -40 L-50 20 Z', ol('#5A4A3A', 5)) + S.rect(-42, -2, 84, 14, 0, { fill: '#E0405E' }),
    pad: () => S.rect(-70, -34, 140, 68, 30, ol('#6A6AE0', 5)) + S.circle(-36, 0, 10, { fill: '#FFF' }) + S.circle(36, -8, 7, { fill: '#FF5A5A' }) + S.circle(48, 6, 7, { fill: '#3BD16F' }),
  }[kind]();
  const id = S.uid('s09ic');
  // 70% stays: clip away a wedge (the cut appears on k > 0)
  const a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * 0.3;
  const wedge = `M0 0 L${f(Math.cos(a0) * 140)} ${f(Math.sin(a0) * 140)} L${f(Math.cos((a0 + a1) / 2) * 200)} ${f(Math.sin((a0 + a1) / 2) * 200)} L${f(Math.cos(a1) * 140)} ${f(Math.sin(a1) * 140)} Z`;
  const rest = `M-200 -200 L200 -200 L200 200 L-200 200 Z ${wedge}`;
  if (k <= 0) o += art;
  else {
    o += S.clipDef(id, S.path(rest, { 'clip-rule': 'evenodd' })) + S.g(art, null, { 'clip-path': `url(#${id})` });
    const id2 = S.uid('s09ic');
    const fx = -ease.in(k) * x * 0.9, fy = ease.in(k) * (120 - y) * 0.9;
    o += S.clipDef(id2, S.path(wedge)) + S.g(S.g(art, null, { 'clip-path': `url(#${id2})` }), `translate(${f(fx + 30 * k)} ${f(fy - 30 * k)}) scale(${f(1 - 0.5 * k)})`, { opacity: f(1 - seg(k, 0.8, 1)) });
    o += TF('-30%', 0, 110, 40, '#FF6F86', { stroke: '#06222A', 'stroke-width': 6, 'paint-order': 'stroke', opacity: f(seg(k, 0, 0.2)) });
  }
  return S.g(o, `translate(${f(x)} ${f(y)})`);
}
function shotThirtyHolo(t) {
  // S4: Pickle — "the Thirty Percent Guy... thirty percent of EVERYTHING"; the hologram goblin grows out of the frame
  const cam = camKeys(t, [[c5, { zoom: 1.0, x: 0, y: 0 }], [tEvery, { zoom: 1.06, x: 120, y: -10 }], [c6, { zoom: 1.14, x: 200, y: -20 }]]);
  let o = S.rect(-200, -200, 2400, 1500, 0, { fill: 'url(#s09brick)' }) + S.rect(0, 0, 1920, 1080, 0, { fill: '#0B0824', opacity: 0.5 });
  let w = '';
  const shiver = Math.sin(t * 40) * 3;
  const pk = 0.9 * ZS.pickle, pH = A.hand(150, -1);
  w += S.ellipse(420, 520, 300, 420, { fill: HC, opacity: 0.08 });
  w += who('pickle', t, { x: 420 + shiver, y: 1250, s: 0.9, turn: 0.4, armL: 150, armR: 30, face: { name: 'scared', eyes: { look: [0.8, -0.3] } } }, { arms: false });
  w += umbrella(420 + pH[0] * pk + shiver, 1250 + pH[1] * pk, 300, -12 + Math.sin(t * 30) * 2, 400, t, 1, storm(t));
  // hologram card
  const grow = ease.inOut(seg(t, tEvery - 0.1, tEvery + 0.8));
  let inner = S.rect(-460, -330, 920, 660, 30, { fill: '#06222A', opacity: 0.4, stroke: HC, 'stroke-width': 6 });
  inner += glowText('THE THIRTY PERCENT GUY', 0, -270, 48, '#7CFF6B');
  const gs = lerp(0.52, 1.25, grow);
  inner += actor('thirty', t, { x: 0, y: 300 + grow * 420, s: gs, turn: -0.1, armL: 40 + 60 * grow, armR: 100 + 30 * Math.sin(t * 6), face: grow > 0.3 ? 'joy' : 'smug', shadow: false });
  inner += S.rect(-460, -330, 920, 660, 30, { fill: HC, opacity: 0.18 });
  const items = [['coin', -330, -110], ['house', -340, 110], ['sandwich', 330, -110], ['car', 340, 110], ['hat', -200, 240], ['pad', 200, 240]];
  items.forEach(([kind, x, y], i) => {
    const tk = tTaking + i * 0.18;
    inner += S.g(iconCut(kind, x, y, seg(t, tk, tk + 0.7), t), '', { opacity: f(1 - grow * 0.8) });
  });
  const stamp = seg(t, tGuy - 0.05, tGuy + 0.1);
  if (stamp > 0) inner += S.g(S.rect(-110, -50, 220, 100, 14, { fill: 'none', stroke: '#FF3B5C', 'stroke-width': 10 }) + T('-30%', 0, 34, 84, '#FF3B5C'), `translate(300 -150) rotate(-12) scale(${f(lerp(2, 1, ease.out(stamp)))})`, { opacity: f(stamp * (1 - grow)) });
  w += holoPanel(t, 1290, 450, 920, 660, seg(t, c5 - 0.1, c5 + 0.25), inner);
  if (grow > 0.3) w += K.bang('EVERYTHING!', 1290, 130, seg(t, tEvery + 0.2, tEvery + 0.35), 100, -6, '#7CFF6B');
  o += view(cam, w + K.rain(t, 90 * storm(t), { op: 0.35 }), 1);
  return o;
}

// ---------------------------------------------------------------- back view: the city across the street
function skyline(x0, x1, base, col, winCol, seed, lit = 0.5) {
  let o = '', x = x0, i = 0;
  while (x < x1) {
    const w = 110 + hash(seed + i) * 140, h = 160 + hash(seed + i * 3.7) * 320;
    o += S.rect(x, base - h, w, h + 400, 6, { fill: col });
    for (let yy = base - h + 30; yy < base - 30; yy += 52) for (let xx = x + 18; xx < x + w - 30; xx += 42) if (hash(xx * 0.37 + yy * 0.11 + seed) > 1 - lit) o += S.rect(xx, yy, 18, 24, 3, { fill: winCol });
    x += w + 10 + hash(seed + i * 9) * 30; i++;
  }
  return o;
}
function thirtyTower(x, base) {
  let o = S.rect(x - 110, base - 640, 220, 1000, 10, { fill: '#1A1236', stroke: '#0A0618', 'stroke-width': 6 });
  for (let yy = base - 600; yy < base; yy += 50) for (let xx = x - 86; xx < x + 80; xx += 40) if (hash(xx + yy) > 0.4) o += S.rect(xx, yy, 18, 26, 3, { fill: '#7CFF6B', opacity: 0.5 });
  o += S.rect(x - 90, base - 760, 180, 120, 6, { fill: '#2A2050', stroke: '#0A0618', 'stroke-width': 5 }) + S.rect(x - 110, base - 650, 220, 16, 0, { fill: '#E2B33C' });
  for (let i = 0; i < 3; i++) o += S.rect(x - 76 + i * 56, base - 740, 36, 30, 4, { fill: '#FFE9A8', opacity: 0.8 });
  o += S.rect(x - 70, base - 790, 140, 32, 4, { fill: '#2A2A36' });
  o += S.rect(x - 150, base - 560, 300, 64, 12, { fill: '#0A0618', stroke: '#7CFF6B', 'stroke-width': 5 }) + T('THIRTY TOWER', x, base - 514, 36, '#7CFF6B');
  return o;
}
function giantSilhouette(x, base, s, eyes = 1) {
  const c = '#0A0718';
  let o = S.rect(-120, -320, 90, 320, 10, { fill: c }) + S.rect(30, -320, 90, 320, 10, { fill: c });
  o += S.rect(-170, -620, 340, 320, 24, { fill: c });
  o += S.path('M-170 -600 L-250 -360 L-200 -350 L-150 -520 Z M170 -600 L270 -380 L220 -370 L150 -520 Z', { fill: c });
  o += S.rect(-200, -980, 400, 360, 40, { fill: c });
  o += S.path('M-200 -900 L-360 -1000 L-260 -820 Z M200 -900 L360 -1000 L260 -820 Z', { fill: c });
  o += S.rect(-230, -1000, 460, 50, 20, { fill: c });
  if (eyes > 0) o += S.ellipse(-80, -820, 34, 22, { fill: '#7CFF6B', opacity: f(eyes) }) + S.ellipse(80, -820, 34, 22, { fill: '#7CFF6B', opacity: f(eyes) }) +
    S.circle(-80, -820, 70, { fill: 'url(#s09glow)', opacity: f(eyes) }) + S.circle(80, -820, 70, { fill: 'url(#s09glow)', opacity: f(eyes) });
  return S.g(o, `translate(${f(x)} ${f(base)}) scale(${f(s)})`);
}
function shotBuilding(t) {
  // S5: from behind the trio — lightning on "building" reveals a skyscraper-sized Thirty Percent Guy
  const fl = Math.max(bump(t, tBuilding - 0.02, tBuilding + 0.18), 0.6 * bump(t, tBuilding + 0.26, tBuilding + 0.4));
  const cam = camKeys(t, [[c6, { zoom: 1.0, x: 0, y: 30 }], [tBuilding, { zoom: 1.04, x: 60, y: 0 }], [c7, { zoom: 1.12, x: 120, y: -40 }]]);
  shook(cam, t, tBuilding + 0.05, 0.9, 14);
  let sky = S.rect(-400, -400, 2800, 1900, 0, { fill: 'url(#s09sky)' });
  sky += S.rect(-400, -400, 2800, 1900, 0, { fill: '#D9CCFF', opacity: f(0.75 * fl) });
  if (fl > 0.3) sky += S.path('M1080 -40 L1020 120 L1070 130 L980 330', ln(10, '#FFFFFF', fl));
  let far = skyline(-300, 2300, 640, '#2A1E58', '#6A5AA8', 3, 0.25);
  far += thirtyTower(1790, 660);
  far += giantSilhouette(1400, 790, 0.6, 0.35 + 0.65 * seg(t, tBuilding, tBuilding + 0.2));
  let mid = skyline(-300, 2300, 720, '#1C1440', '#FFD98A', 11, 0.3);
  mid += S.rect(-400, 720, 2800, 400, 0, { fill: '#1A1433' }) + S.rect(-400, 720, 2800, 10, 0, { fill: '#2E2556' });
  for (let x = -300; x < 2300; x += 380) mid += S.rect(x, 860, 190, 16, 6, { fill: '#C9B860', opacity: 0.3 });
  mid += ripples(t, -200, 2200, 760, 900, 12, storm(t), 4);
  // the trio from behind, sitting on the near kerb (legs hidden past the kerb edge)
  const s = 0.6;
  let fg = '';
  const pk = s * ZS.pickle, pH = A.hand(160, 1);
  fg += who('pickle', t, { x: 470, y: 1100, s, view: 'back', armR: 160, armL: 14 }, { arms: false });
  fg += who('ty', t, { x: 780, y: 1110, s, view: 'back', armL: 14, armR: 14, headRot: 4 * Math.sin(t) }, { arms: false });
  fg += who('mia', t, { x: 1120, y: 1110, s, view: 'back', armL: 12, armR: 16 }, { arms: false }, [beret('front', 1)]);
  fg += umbrella(470 + pH[0] * pk, 1100 + pH[1] * pk, 330, -14, 440, t, 1, storm(t));
  fg += S.rect(-400, 1010, 2800, 200, 0, { fill: '#2E2556' }) + S.rect(-400, 1004, 2800, 10, 0, { fill: '#6A5FA8' });
  let o = view(cam, sky, 0.2) + view(cam, far, 0.45) + view(cam, mid, 0.7) + view(cam, fg + K.rain(t, 120, { op: 0.4 }), 1);
  o += K.bang('KRA-KOOM!', 1000, 160, bump(t, tBuilding, tBuilding + 0.9), 90, -8, '#E9DDFF');
  return o;
}

function blueprint(t, k) {
  let o = S.rect(-520, -340, 1040, 680, 20, { fill: 'url(#s09blue)', stroke: '#FFFFFF', 'stroke-width': 6 });
  o += T('THE PLAN', -330, -270, 56, '#FFFFFF');
  o += S.g(towerArt(t, 'holo', 0.4).replace(new RegExp(HC, 'g'), '#FFFFFF'), 'translate(-60 300) scale(0.5)');
  // route line: door → up the stack → the printer
  const path = [[-260, 280], [-120, 280], [-120, 120], [10, 120], [10, -60], [-80, -60], [-80, -180], [20, -200]];
  let d = '', len = 0;
  const segs = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let left = total * k;
  d = `M${path[0][0]} ${path[0][1]}`;
  for (let i = 1; i < path.length && left > 0; i++) {
    const L0 = segs[i - 1], u = Math.min(1, left / L0);
    d += ` L${f(lerp(path[i - 1][0], path[i][0], u))} ${f(lerp(path[i - 1][1], path[i][1], u))}`;
    left -= L0;
  }
  o += S.path(d, { fill: 'none', stroke: '#FF4D6D', 'stroke-width': 10, 'stroke-dasharray': '22 14', 'stroke-linecap': 'round' });
  if (k > 0.97) o += S.path('M-10 -230 L50 -170 M50 -230 L-10 -170', ln(14, '#FF4D6D'));
  o += TF('START', -300, 320, 30, '#FFFFFF') + TF('PRINTER', 140, -200, 30, '#FFE14D');
  return o;
}
function shotMia(t) {
  // S6: Mia CU, phone light from below — "So... who wants to rob a bank?"; the hologram becomes a blueprint
  const cam = camKeys(t, [[c7, { zoom: 1.0, x: 0, y: 0 }], [tRob, { zoom: 1.06, x: 0, y: -10 }], [tBank, { zoom: 1.06, x: 0, y: -10 }], [tBank + 0.15, { zoom: 1.32, x: -300, y: -80 }], [c8, { zoom: 1.34, x: -300, y: -80 }]]);
  let o = S.rect(-200, -200, 2400, 1500, 0, { fill: 'url(#s09brick)' }) + S.rect(0, 0, 1920, 1080, 0, { fill: '#0B0824', opacity: 0.55 });
  let w = '';
  const bp = seg(t, tRob - 0.2, tRob + 0.15);
  w += S.g(blueprint(t, seg(t, tRob, tBank + 0.5)), `translate(1300 450) scale(${f(0.72 * ease.outBack(bp))})`, { opacity: f(bp) });
  w += S.ellipse(620, 560, 330, 300, { fill: HC, opacity: 0.12 });
  const mk = 1.02 * ZS.mia, mh = A.hand(36, -1);
  w += who('mia', t, { x: 620, y: 1290, s: 1.02, turn: 0.25, armL: 36, armR: 16, face: t > tRob - 0.1 ? { name: 'smug', mouth: 'smirk' } : { name: 'determined', eyes: { look: [0.3, 0.3] } } }, { arms: false }, [beret('front', 1)]);
  w += K.phone(620 + mh[0] * mk, 1290 + mh[1] * mk - 60, 0.5, 12, S.rect(-150, -280, 300, 560, 0, { fill: '#0E5A66' }));
  w += drips(t, 620, 300, 2, 9, 200);
  o += view(cam, w + K.rain(t, 70 * storm(t), { op: 0.35 }), 1);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#000', opacity: f(0.3 * seg(t, tBank, tBank + 0.1)) });
  return o;
}

function shotUnrob(t) {
  // S7: Ty stands up — "Technically, we're UN-robbing it. Let's go." The umbrella closes; the rain starts to ease.
  const cam = camKeys(t, [[c8, { zoom: 1.25, x: -20, y: 40 }], [tGo - 0.1, { zoom: 1.15, x: 0, y: 0 }], [tGo + 0.3, { zoom: 1.05, x: 0, y: -20 }], [c9, { zoom: 1.0, x: 0, y: -20 }]]);
  const st = ease.outBack(seg(t, c8 + 0.05, c8 + 0.45));
  const all = seg(t, tGo - 0.1, tGo + 0.1) > 0.5;
  const hop = (d = 0) => 36 * bump(t, tGo + d, tGo + d + 0.4);
  let w = street(t);
  const s = 0.56, pk = s * ZS.pickle;
  let hx, hy, urot;
  if (!all) {
    const pH = A.hand(150, 1);
    w += seat('pickle', t, 640, TOP, s, { armR: 150, armL: 18, face: { name: 'happy', eyes: { look: [0.8, -0.3] } } }, { arms: false });
    hx = 640 + pH[0] * pk; hy = TOP + 306 * pk + pH[1] * pk; urot = 20;
  } else {
    const pH = A.hand(60, 1);
    w += who('pickle', t, { x: 640, y: TOP - 20, s, armR: 60, armL: 160, face: 'excited', lift: hop(0.05) }, { arms: false });
    hx = 640 + pH[0] * pk; hy = TOP - 20 - hop(0.05) + pH[1] * pk; urot = -40;
  }
  const unrob = seg(t, tUn - 0.1, tUn + 0.1);
  if (st < 0.5) w += seat('ty', t, 900, TOP, s, { armL: 18, armR: 18, face: 'determined' }, { arms: false });
  else w += who('ty', t, { x: 900, y: TOP - 20, s, armR: all ? 165 : 150 - 30 * unrob, armL: all ? 150 : 20, face: all ? 'excited' : 'determined', lift: hop() }, { arms: false });
  if (!all) w += seat('mia', t, 1180, TOP, s, { armL: 30, armR: 18, face: { name: 'deadpan', eyes: { look: [-0.7, -0.3] } } }, { arms: false }, [beret('front', 1)]);
  else w += who('mia', t, { x: 1180, y: TOP - 20, s, armL: 120, armR: 20, face: { name: 'smug' }, lift: hop(0.1) }, { arms: false }, [beret('front', 0.6)]);
  const open = 1 - ease.inOut(seg(t, tGo - 0.3, tGo));
  if (!all) w += umbrella(hx, hy, 330, urot, 340, t, open, storm(t));
  else w += C.dust(hx - 60, hy - 120, tGo + 0.05, t);
  const hole = open > 0.5 ? shelter(hx, hy, 330, urot, 340, open) : null;
  w += rainOutside(t, 150 * storm(t), hole, { op: 0.5 });
  let o = view(cam, w, 1);
  // UN-ROB sign
  const k = seg(t, tUn - 0.1, tUn + 0.05);
  if (k > 0) {
    let g = S.rect(-330, -90, 660, 180, 30, ol('#2A1640', 10)) + T('ROB', 120, 50, 140, '#FF5A6E', { stroke: '#151515', 'stroke-width': 12, 'paint-order': 'stroke' });
    const k2 = ease.outBack(seg(t, tUn + 0.15, tUn + 0.35));
    g += S.g(T('UN-', 0, 0, 140, '#7CFF6B', { stroke: '#151515', 'stroke-width': 12, 'paint-order': 'stroke' }), `translate(-150 50) scale(${f(k2)}) rotate(-8)`);
    o += S.g(g, `translate(1420 250) rotate(-5) scale(${f(ease.outBack(k) * (1 - seg(t, tGo - 0.4, tGo - 0.1)))})`);
  }
  o += K.bang("LET'S GO!", 960, 210, seg(t, tGo, tGo + 0.15) * (1 - seg(t, c9 - 0.2, c9)), 110, -6, '#FFD21F');
  o += C.burst(960, 300, seg(t, tGo, tGo + 0.5));
  return o;
}

// Grandma's streaming rig (body space, in her hand): selfie stick + ring light + phone
function streamRig(t, live) {
  let o = S.path('M0 0 L0 -300', ln(16, '#151515')) + S.path('M0 0 L0 -300', ln(8, '#9AA0AE'));
  o += S.circle(0, -380, 100, { fill: 'none', stroke: '#151515', 'stroke-width': 34 }) + S.circle(0, -380, 100, { fill: 'none', stroke: '#FFF6E0', 'stroke-width': 22 });
  o += S.rect(-40, -450, 80, 140, 14, ol('#20232E', 6)) + S.rect(-30, -440, 60, 100, 8, { fill: live ? '#FF4D8D' : '#2A2E44' });
  if (live) o += S.rect(-28, -470, 56, 26, 8, ol('#FF2D55', 4)) + TF('LIVE', 0, -450, 18, '#FFFFFF');
  return o;
}
function shotGrandma(t) {
  // S8a: Grandma pops in with her streaming rig — "You need a distraction? Leave that to me, sweetie."
  const cam = camKeys(t, [[c9, { zoom: 1.0, x: 0, y: -20 }], [tDistr, { zoom: 1.12, x: -200, y: -20 }], [c10, { zoom: 1.2, x: -240, y: -30 }]]);
  let w = street(t);
  const s = 0.56;
  const pop = ease.outBack(seg(t, c9 + 0.05, c9 + 0.45));
  w += who('pickle', t, { x: 640, y: TOP - 20, s, turn: -0.5, armR: 16, armL: 20, face: { name: 'amazed', eyes: { look: [-0.8, 0] } } }, { arms: false });
  w += who('ty', t, { x: 900, y: TOP - 20, s, turn: -0.5, armL: 14, armR: 14, face: { name: 'shocked', eyes: { look: [-0.8, 0] } } }, { arms: false });
  w += who('mia', t, { x: 1180, y: TOP - 20, s, turn: -0.4, armL: 14, armR: 30, face: { name: 'deadpan', eyes: { look: [-0.8, 0] } } }, { arms: false }, [beret('front', 0.5)]);
  // Grandma slides in from the left
  const gx = lerp(-250, 330, pop);
  const wink = t > tSweetie - 0.1 && t < tSweetie + 0.5;
  const gH = A.hand(150, 1);
  w += who('grandma', t, { x: gx, y: TOP - 20, s: 0.58, turn: 0.4, armR: 150, armL: lerp(10, 60, seg(t, tSweetie - 0.3, tSweetie)), lean: -6 * (1 - pop), face: wink ? { name: 'happy', eyes: { type: 'happy' } } : 'excited', props: [{ svg: S.g(streamRig(t, false), `translate(${f(gH[0])} ${f(gH[1])}) rotate(20)`), layer: 'front' }] }, {});
  if (wink) w += K.sparkles([[gx + 80, TOP - 520, 28]], t);
  w += rainOutside(t, 150 * storm(t), null, { op: 0.45 });
  let o = view(cam, w, 1);
  o += view(cam, C.dust(gx - 140, TOP - 10, c9 + 0.35, t), 1);
  o += K.bang('TA-DA!', 380, 300, bump(t, c9 + 0.1, c9 + 0.9), 80, -10, '#FF6FB0');
  return o;
}

function streamUI(t, k, viewers, liveK) {
  let o = '';
  // live pill
  const lk = ease.outBack(clamp(liveK, 0, 1));
  if (lk > 0) {
    const blink = Math.floor(t * 2) % 2 ? 1 : 0.4;
    o += S.g(S.rect(0, 0, 210, 74, 37, ol('#FF2D55', 6)) + S.circle(42, 37, 14, { fill: '#FFFFFF', opacity: blink }) + T('LIVE', 128, 56, 50, '#FFFFFF'), `translate(70 60) scale(${f(lk)})`);
  }
  o += S.g(S.rect(0, 0, 300, 74, 37, { fill: '#000', opacity: 0.5 }) + S.ellipse(50, 37, 24, 14, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 5 }) + S.circle(50, 37, 7, { fill: '#FFFFFF' }) +
    TF(viewers, 180, 52, 40, '#FFFFFF'), 'translate(300 60)');
  o += S.g(S.rect(0, 0, 420, 60, 20, { fill: '#000', opacity: 0.45 }) + TF('NanaBea_Plays', 210, 42, 34, '#FFC7E0'), 'translate(70 150)');
  // chat column
  const msgs = [['xX_Noob_Xx', 'W GRANDMA'], ['ObbyQueen', 'HEIST ARC??'], ['potato77', 'nana pog'], ['Bloxy', 'is that ty??'], ['coinman', 'LETS GOOO'], ['grandkid#2', 'hi nana!!'], ['zzz', 'drive safe dad'], ['Kaboom', '♥♥♥']];
  const n = Math.floor((t - c10) * 3.2);
  let chat = S.rect(0, 0, 400, 600, 26, { fill: '#000', opacity: 0.45 }) + TF('CHAT', 200, 50, 34, '#FFFFFF');
  for (let i = 0; i < 6; i++) {
    const m = msgs[(n + i) % msgs.length];
    const y = 120 + i * 78 - ((t - c10) * 3.2 % 1) * 78;
    if (y < 80 || y > 580) continue;
    chat += TF(m[0] + ':', 24, y, 26, ['#7CF7FF', '#FFE14D', '#7CFF6B', '#FF8AA2'][i % 4], { 'text-anchor': 'start' }) + TF(m[1], 24, y + 34, 30, '#FFFFFF', { 'text-anchor': 'start' });
  }
  o += S.g(chat, `translate(${f(1920 - 440 * ease.out(k))} 220)`);
  // hearts
  for (let i = 0; i < 8; i++) {
    const ph = ((t * 0.8 + i / 8) % 1);
    const x = 1380 + Math.sin(ph * 8 + i) * 40 + i * 10, y = 880 - ph * 560;
    o += S.g(S.path('M0 10 C-30 -14 -18 -40 0 -24 C18 -40 30 -14 0 10 Z', ol(['#FF4D8D', '#FF6FB5', '#FFD21F'][i % 3], 4)), `translate(${f(x)} ${f(y)}) scale(${f(1.2 - ph * 0.5)})`, { opacity: f(1 - ph) });
  }
  return o;
}
function shotStream(t) {
  // S8b: Grandma's stream POV — "Chat! We're going LIVE in front of the bank!"
  const cam = camKeys(t, [[c10, { zoom: 1.05, x: 0, y: 0 }], [tLive, { zoom: 1.05, x: 0, y: 0 }], [tLive + 0.12, { zoom: 1.2, x: -40, y: -40 }], [c11, { zoom: 1.22, x: -40, y: -40 }]]);
  // handheld wobble
  cam.sx = Math.sin(t * 3.1) * 8; cam.sy = Math.sin(t * 2.3) * 6;
  let w = S.rect(-400, -400, 2800, 2000, 0, { fill: 'url(#s09brick)' });
  w += lampPost(1500, 800, t, 640) + S.rect(-400, 800, 2800, 600, 0, { fill: '#2E2556' });
  // the trio behind her, waving (Mia: not waving)
  const s = 0.55;
  w += who('pickle', t, { x: 930, y: 1000, s, armR: 140 + 25 * Math.sin(t * 12), armL: 20, face: 'excited' }, { arms: false });
  w += who('ty', t, { x: 1110, y: 1010, s, armL: 20, armR: 130 + 20 * Math.sin(t * 10 + 1), face: { name: 'happy', mouth: 'uh' } }, { arms: false });
  w += who('mia', t, { x: 1290, y: 1020, s, armL: 16, armR: 16, face: 'deadpan' }, { arms: false }, [beret('front', 0.4)]);
  // Grandma selfie close-up
  w += who('grandma', t, { x: 560, y: 1440, s: 1.2, turn: 0.15, armL: 130, armR: 20, face: t > tLive - 0.1 ? 'excited' : 'joy' }, { energy: 1.4, arms: false });
  w += rainOutside(t, 100 * storm(t), null, { op: 0.35 });
  let o = view(cam, w, 1);
  const vNum = Math.round(3 + 52400 * ease.in(seg(t, c10 + 0.2, c11)));
  const vTxt = vNum > 999 ? (vNum / 1000).toFixed(1) + 'K' : String(vNum);
  o += streamUI(t, seg(t, c10, c10 + 0.3), vTxt, seg(t, tLive - 0.05, tLive + 0.2));
  // camera frame corners
  for (const [x, y, sx, sy] of [[40, 40, 1, 1], [1880, 40, -1, 1], [40, 1040, 1, -1], [1880, 1040, -1, -1]]) o += S.path(`M${x} ${y + sy * 80} L${x} ${y} L${x + sx * 80} ${y}`, ln(8, '#FFFFFF', 0.85));
  o += C.whiteFlash(0.5 * bump(t, tLive - 0.02, tLive + 0.12));
  return o;
}

// ---------------------------------------------------------------- Dad + the family minivan
// side view, facing right; occupants(svg) drawn behind the body and show through the window holes
function minivan(x, y, s, t, occupants = '', moving = 0, lights = 1) {
  const body = 'M-300 -40 L-300 -230 Q-300 -280 -250 -286 L120 -296 Q180 -296 220 -240 L290 -150 Q320 -140 320 -100 L320 -40 Q320 -10 290 -10 L-270 -10 Q-300 -10 -300 -40 Z';
  const wins = 'M-270 -250 L-150 -258 L-150 -170 L-270 -170 Z M-130 -260 L20 -268 L20 -170 L-130 -170 Z M40 -270 L120 -272 Q160 -272 190 -236 L236 -170 L40 -170 Z';
  let o = S.ellipse(0, -4, 330, 20, { fill: '#000', opacity: 0.35 });
  if (occupants) { const id = S.uid('s09van'); o += S.clipDef(id, S.path(body)) + S.g(occupants, null, { 'clip-path': `url(#${id})` }); }
  o += S.path(body + ' ' + wins, { ...ol('#8FB8DE', 8), 'fill-rule': 'evenodd' });
  o += S.path('M-298 -120 L318 -120 L318 -86 L-298 -86 Z', { fill: '#A87442' }) + S.path('M-298 -112 L318 -112 M-298 -94 L318 -94', ln(3, '#7A4A1E'));
  o += S.path(wins, { fill: '#BDEBFF', opacity: 0.22, stroke: '#151515', 'stroke-width': 6 });
  o += S.path('M-250 -246 L-200 -250 L-250 -190 Z M-110 -256 L-60 -258 L-110 -196 Z', { fill: '#FFFFFF', opacity: 0.35 });
  o += S.path('M-20 -168 L-20 -40', ln(5)) + S.rect(-60, -150, 26, 10, 5, { fill: '#151515' });
  o += S.rect(-280, -320, 380, 18, 6, ol('#5A6070', 5)) + S.path('M-260 -302 L-260 -290 M80 -302 L80 -290', ln(6));
  o += S.rect(286, -150, 30, 26, 8, ol('#FFF6C8', 5)) + S.rect(-306, -150, 18, 30, 6, ol('#FF4D4D', 4));
  if (lights > 0) o += S.path('M316 -138 L900 -260 L900 20 Z', { fill: 'url(#s09lamp)', opacity: f(0.8 * lights) });
  o += S.g(S.rect(-60, -24, 120, 48, 10, ol('#FFE14D', 4)) + TF('DAD ON', 0, -2, 20, '#2A1640') + TF('BOARD', 0, 18, 20, '#2A1640'), 'translate(-190 -140) rotate(-6) scale(0.9)');
  for (const wx of [-190, 200]) {
    o += S.circle(wx, -20, 56, ol('#23262F', 7)) + S.circle(wx, -20, 26, ol('#C9CED8', 5));
    o += S.path(`M${wx - 18} -20 L${wx + 18} -20`, { stroke: '#7A8090', 'stroke-width': 6, transform: `rotate(${f(moving * t * 400)} ${wx} -20)` });
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function shotVan(t) {
  // S9a: headlights sweep in; the minivan stops at the kerb — "And I'll drive the getaway car!"
  const stopT = tCar - 0.6;
  const u = ease.out(seg(t, c11, stopT));
  const vx = lerp(-700, 820, u);
  const cam = camKeys(t, [[c11, { zoom: 1.0, x: 0, y: 40 }], [tCar, { zoom: 1.1, x: -60, y: 60 }], [c12, { zoom: 1.16, x: -80, y: 60 }]]);
  let w = street(t, { top: 760 });
  const s = 0.42;
  w += who('pickle', t, { x: 1100, y: 740, s, armL: 14, armR: 14, face: { name: 'amazed', eyes: { look: [-0.6, 0] } } }, { arms: false });
  w += who('ty', t, { x: 1310, y: 740, s, armL: 14, armR: 14, face: { name: 'shocked', eyes: { look: [-0.6, 0] } } }, { arms: false });
  w += who('mia', t, { x: 1520, y: 740, s, armL: 14, armR: 14, face: { name: 'deadpan', eyes: { look: [-0.6, 0] } } }, { arms: false }, [beret('front', 0.4)]);
  w += who('grandma', t, { x: 1720, y: 740, s: 0.44, armL: 14, armR: 150, face: 'excited', props: [{ svg: S.g(streamRig(t, true), `translate(${f(A.hand(150, 1)[0])} ${f(A.hand(150, 1)[1])}) rotate(16)`), layer: 'front' }] }, { arms: false });
  // the van with Dad in the driver window
  const lean = ease.outBack(seg(t, stopT + 0.1, stopT + 0.5));
  const thumbs = seg(t, tCar - 0.1, tCar + 0.1);
  const dad = who('dad', t, { x: 120 + 20 * lean, y: 15, s: 0.3, turn: 0.6, armR: lerp(10, 150, thumbs), armL: 10, face: t > tCar ? { name: 'smug', mouth: 'grin' } : 'happy' }, {});
  const bounce = 6 * Math.sin(t * 20) * (1 - u) + 10 * bump(t, stopT, stopT + 0.3);
  w += minivan(vx, 1010 + bounce, 1.25, t, dad, 1 - u, 1);
  if (thumbs > 0) w += K.F.sparkle(vx + 200, 700, 30 * bump(t, tCar, tCar + 0.6));
  w += rainOutside(t, 120 * storm(t), null, { op: 0.4 });
  let o = view(cam, w, 1);
  o += K.bang('HONK!', 360, 300, bump(t, stopT + 0.1, stopT + 0.8), 90, -8, '#FFE14D');
  return o;
}

function rgbSock(t) {
  const cols = ['#FF3B5C', '#FF9A2B', '#FFE14D', '#3BD16F', '#34C3FF', '#7A5CFF', '#FF5AD8'];
  const sh = Math.floor(t * 10);
  let o = S.rect(-80, -560, 170, 300, 20, ol('#2E3A55', 7));
  const id = S.uid('s09sock');
  const d = 'M-70 -300 L80 -300 L80 -60 Q80 -10 140 0 L300 10 Q350 20 350 60 Q350 100 300 100 L-30 100 Q-80 100 -80 50 Z';
  let stripes = '';
  for (let i = 0; i < 9; i++) stripes += S.rect(-200, -300 + i * 50, 700, 50, 0, { fill: cols[(i + sh) % cols.length] });
  o += S.clipDef(id, S.path(d)) + S.g(stripes, null, { 'clip-path': `url(#${id})` }) + S.path(d, ol('none', 8));
  o += S.path('M-60 -60 Q40 -40 80 20', ln(8, '#FFFFFF', 0.4));
  for (let i = 0; i < 5; i++) o += S.circle(-40 + i * 80, 60 - (i > 1 ? 10 : 0), 9, { fill: '#FFFFFF', opacity: 0.9 });
  return o;
}
function shotSocks(t) {
  // S9b: footwell close-up — Dad's RGB socks tap the gas pedal "very carefully"
  const cam = camKeys(t, [[c12, { zoom: 1.1, x: 0, y: 0 }], [c13, { zoom: 1.2, x: 40, y: 20 }]]);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#120E22' });
  let w = S.rect(-200, 820, 2400, 400, 0, { fill: '#2A2440' }) + S.rect(-200, -200, 2400, 360, 0, { fill: '#1E1A30' });
  for (let x = -100; x < 2200; x += 80) w += S.rect(x, 860, 40, 220, 8, { fill: '#221E36' });
  // pedals
  w += S.path('M1180 300 L1180 560', ln(26, '#151515')) + S.rect(1100, 540, 180, 260, 26, ol('#3A3F55', 8));
  for (let i = 0; i < 5; i++) w += S.rect(1120, 570 + i * 44, 140, 16, 8, { fill: '#2A2E40' });
  w += S.path('M720 300 L720 600', ln(26, '#151515')) + S.rect(620, 580, 200, 140, 26, ol('#3A3F55', 8));
  w += TF('GAS', 1190, 830, 40, '#7A80A0') + TF('BRAKE', 720, 760, 40, '#7A80A0');
  const press = bump(t, tCare - 0.15, tCare + 0.35);
  w += S.g(rgbSock(t), `translate(1010 ${f(420 + 40 * press)}) rotate(${f(4 + 6 * press)})`);
  // RGB glow
  w += S.circle(1060, 520, 380, { fill: 'url(#s09glow)', opacity: 0.6 });
  o += view(cam, w, 1);
  o += K.bang('tap.', 1350, 420, bump(t, tCare, tCare + 0.7), 64, -6, '#FFFFFF');
  o += S.g(S.rect(-170, -40, 340, 80, 30, { fill: '#000', opacity: 0.5 }) + TF('RGB SOCKS', 0, 14, 40, '#FFE14D'), 'translate(300 140)', { opacity: f(seg(t, c12 + 0.1, c12 + 0.3)) });
  return o;
}

function speedo(val) {
  let o = S.circle(0, 0, 130, ol('#14182A', 8));
  for (let i = 0; i <= 8; i++) { const a = Math.PI * 0.75 + (i / 8) * Math.PI * 1.5; o += S.path(`M${f(Math.cos(a) * 96)} ${f(Math.sin(a) * 96)} L${f(Math.cos(a) * 116)} ${f(Math.sin(a) * 116)}`, ln(6, '#FFFFFF')); }
  const a = Math.PI * 0.75 + (val / 80) * Math.PI * 1.5;
  o += S.path(`M0 0 L${f(Math.cos(a) * 100)} ${f(Math.sin(a) * 100)}`, ln(9, '#FF3B5C')) + S.circle(0, 0, 14, { fill: '#FF3B5C' });
  o += T(String(Math.round(val)), 0, 74, 54, '#FFFFFF') + TF('MPH', 0, 104, 22, '#9AA0AE');
  return o;
}
function snail(x, y, s, t) {
  let o = S.path('M-60 0 Q-70 -14 -40 -16 L50 -16 Q70 -16 74 -40 L80 -56 M66 -36 L62 -60', { ...ol('#C9E07A', 5) });
  o += S.path('M-60 0 L70 0 Q80 -16 50 -16 L-40 -16 Q-70 -14 -60 0 Z', ol('#C9E07A', 5));
  o += S.circle(-6, -48, 42, ol('#E8A05A', 5)) + S.path('M-6 -48 m-24 0 a24 24 0 1 1 24 24 a14 14 0 1 1 -14 -14', ln(5));
  o += S.circle(80, -60, 6, { fill: '#151515' }) + S.circle(62, -64, 6, { fill: '#151515' });
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function shotLimit(t) {
  // S9c: wide — the minivan crawls under the speed limit; a snail overtakes; the rain stops, the clouds part, the bank glows
  const cam = camKeys(t, [[c13, { zoom: 1.1, x: -80, y: 20 }], [END, { zoom: 1.0, x: 40, y: -20 }]]);
  const clear = ease.inOut(seg(t, c13, END));
  let sky = S.rect(-400, -400, 2800, 1900, 0, { fill: 'url(#s09sky)' }) + S.rect(-400, -400, 2800, 1900, 0, { fill: 'url(#s09skyClear)', opacity: f(clear) });
  for (let i = 0; i < 22; i++) sky += K.F.sparkle(hash(i * 3) * 1920, hash(i * 7) * 380, (6 + hash(i) * 8) * clear * (0.6 + 0.4 * Math.sin(t * 4 + i)));
  sky += S.circle(1720, 150, 70, { fill: '#FFF6D8', opacity: f(0.3 + 0.7 * clear) }) + S.circle(1720, 150, 160, { fill: 'url(#s09warm)', opacity: f(clear) });
  // clouds part
  for (const [x, y, s, dir] of [[1300, 160, 1.4, -1], [1700, 200, 1.2, 1], [500, 120, 1.3, -1], [900, 230, 1, 1]]) {
    const dx = dir * 500 * clear;
    sky += S.g(S.ellipse(0, 0, 200, 60, { fill: '#2A2058' }) + S.ellipse(-80, -30, 110, 60, { fill: '#2E2462' }) + S.ellipse(70, -36, 120, 66, { fill: '#33296A' }), `translate(${f(x + dx)} ${y}) scale(${s})`);
  }
  let far = skyline(-300, 2300, 700, '#2A1E58', '#6A5AA8', 21, 0.3);
  far += S.circle(1060, 420, 320, { fill: 'url(#s09warm)', opacity: f(0.25 + 0.4 * clear) }) + S.g(towerArt(t, 'gold', 1), 'translate(1060 700) scale(0.42)');
  let w = S.rect(-400, 700, 2800, 600, 0, { fill: '#1A1433' }) + S.rect(-400, 700, 2800, 12, 0, { fill: '#2E2556' });
  for (let x = -300; x < 2300; x += 380) w += S.rect(x, 790, 190, 16, 6, { fill: '#C9B860', opacity: 0.35 });
  w += S.ellipse(1500, 940, 240, 30, { fill: '#FFF6D8', opacity: f(0.15 * clear) });
  // speed limit sign
  w += S.path('M1560 860 L1560 560', ln(14, '#151515')) + S.path('M1560 860 L1560 560', ln(7, '#9AA0AE'));
  w += S.rect(1480, 400, 160, 200, 12, ol('#FFFFFF', 7)) + TF('SPEED', 1560, 450, 32, '#151515') + TF('LIMIT', 1560, 484, 32, '#151515') + T('25', 1560, 576, 84, '#151515');
  // van crawling
  const vx = lerp(560, 760, seg(t, c13, END));
  let occ = who('dad', t, { x: 120, y: 15, s: 0.3, turn: 0.6, armL: 10, armR: 10, face: { name: 'happy', mouth: 'smallSmile' } }, {});
  occ += who('pickle', t, { x: -55, y: -8, s: 0.3, turn: 0.4, armL: 10, armR: 10, face: 'happy' }, { arms: false });
  occ += who('ty', t, { x: -210, y: -2, s: 0.3, turn: 0.3, armL: 10, armR: 10, face: { name: 'deadpan' } }, { arms: false });
  w += minivan(vx, 850, 0.9, t, occ, 0.15, 1 - clear * 0.3);
  // the snail overtakes
  const sx = lerp(300, 1250, seg(t, c13 + 0.1, END));
  w += S.path(`M300 902 L${f(sx - 70)} 902`, ln(10, '#BFD8FF', 0.45)) + snail(sx, 900, 1.1, t) + C.speedLines(sx - 330, sx - 160, 855, 4, 3, '#FFFFFF', 50);
  w += K.F.sparkle(sx + 90, 810, 26 * bump(t, tLimit, tLimit + 0.5));
  w += rainOutside(t, 120 * storm(t), null, { op: 0.4 });
  let o = view(cam, sky, 0.2) + view(cam, far, 0.5) + view(cam, w, 1);
  o += S.g(speedo(12 + Math.sin(t * 3)), `translate(240 260) scale(${f(ease.outBack(seg(t, tLimit - 0.4, tLimit)))})`);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(0.6 * seg(t, END - 0.12, END)) });
  return o;
}

// ---------------------------------------------------------------- router
const SHOTS = [[c1, shotKerb], [c2, shotHolo], [c3, shotRewards], [c4, shotGauge], [c5, shotTyIdea], [c6, shotThirtyHolo], [c7, shotBuilding], [c8, shotMia],
  [c9, shotUnrob], [c10, shotGrandma], [c11, shotStream], [c12, shotVan], [c13, shotSocks], [Infinity, shotLimit]];
function scene(t) {
  const sh = SHOTS.find(([b]) => t < b);
  let o = sh[1](t);
  // quick white whip-flash on the hard cuts into and out of the hologram
  for (const tc of [c1, c4, c7]) o += C.whiteFlash(0.35 * bump(t, tc - 0.05, tc + 0.07));
  return o;
}
const look = (t) => (t >= c13 ? { grade: 'cool', vignette: 0.9 } : (t >= c2 && t < c5) ? { grade: 'cool', vignette: 1 } : { grade: 'night', vignette: 1 });

module.exports = { scene, look, DEFS, towerArt, beret, who, umbrella, minivan, streamRig, ZS };
