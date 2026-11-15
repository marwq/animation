// Private helpers for SC 12 (ПОСЛЕ) and SC 13 (АУТРО): costume props (Dex's helmet + knee pads, Mom's robe + towel),
// small props (Dad's laptop, Pip's clipboard, phones), news graphics, Dex's front stoop, the end-card island.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const ST = require('./sets');
const F = K.F;
const LINE = '#151515';
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const P = (d, a = {}) => S.path(d, a);
const CI = (x, y, r, a = {}) => S.circle(x, y, r, a);
const EL = (x, y, rx, ry, a = {}) => S.ellipse(x, y, rx, ry, a);
const G = (inner, tf, extra) => S.g(inner, tf, extra);
const tr = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const OUT = (w = 8) => ({ stroke: LINE, 'stroke-width': w, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
const ob = (u) => (u <= 0 ? 0 : ease.outBack(Math.min(1, u)));

// ---------------------------------------------------------------- auto-acting values (so head props follow the head)
const SPK = { juno: 'JUNO', dex: 'DEX', pip: 'PIP', grandpa: 'GRANDPA', dad: 'DAD', anchor: 'ANCHOR' };
function auto(name, t, act = {}) {
  const sp = SPK[name];
  if (!sp) return { headRot: 0, headY: 0, bodyY: 0 };
  return K.V.perform(sp, t, { seed: name.length * 3.7 + (act.seed || 0), ...act });
}
// wraps body-space svg so it follows the head (same transform the rig applies to the head)
const onHead = (svg, headRot = 0, headY = 0) => G(svg, `translate(0 ${f(headY)}) rotate(${f(headRot)} 0 -560)`);
// knee position (body space) for a front-view leg with an explicit thigh angle (side -1 = screen-left)
function knee(side, ang = 0, bodyY = 0) {
  const a = (ang * Math.PI) / 180;
  return [side * 48 + side * Math.sin(a) * 140, -306 + bodyY + Math.cos(a) * 140];
}

// ---------------------------------------------------------------- Dex: bike helmet + knee pads
function helmet() {
  let o = '';
  // the blue spikes poke out through the vents
  for (const [x, h, r] of [[-120, 120, -24], [0, 150, 0], [120, 120, 24]]) o += G(P(`M-26 0 L0 ${-h} L26 0 Z`, ol('#1E8BFF', 6)) + P(`M-6 -10 L0 ${-h + 30}`, ln(6, '#8BE0FF')), tr(x, -985 + Math.abs(x) * 0.35, 1, r));
  const dome = 'M-262 -792 Q-268 -1010 0 -1046 Q268 -1010 262 -792 Q130 -812 0 -812 Q-130 -812 -262 -792 Z';
  o += P(dome, ol('#FF5A3D', 9));
  o += P('M-220 -830 Q-200 -980 -40 -1010 M220 -830 Q200 -980 40 -1010', ln(18, '#FFFFFF', 0.85));
  for (const [x, w] of [[-120, 40], [0, 44], [120, 40]]) o += R(x - w / 2, -1000 + Math.abs(x) * 0.35, w, 46, 14, ol('#2A2D36', 5));
  o += P('M-262 -792 Q-130 -812 0 -812 Q130 -812 262 -792 L262 -770 Q130 -790 0 -790 Q-130 -790 -262 -770 Z', ol('#2A2D36', 6));
  o += P('M-180 -980 Q-120 -1010 -60 -1016', ln(10, '#FFB0A0', 0.9));
  // chin strap
  o += P('M-232 -780 L-150 -600 L-10 -548 M232 -780 L150 -600 L10 -548', ln(12, LINE)) + P('M-232 -780 L-150 -600 L-10 -548 M232 -780 L150 -600 L10 -548', ln(6, '#FFD21F'));
  o += R(-22, -566, 44, 30, 8, ol('#2A2D36', 4));
  return o;
}
function kneePad(x, y, s = 1) {
  return G(R(-58, -46, 116, 92, 28, ol('#2A2D36', 7)) + R(-40, -32, 80, 56, 20, ol('#FF5A3D', 5)) + P('M-26 -14 Q0 -26 26 -14', ln(5, '#FFB0A0')), tr(x, y, s));
}
// props for dex: helmet follows the head; knee pads follow explicit leg angles
function dexGear(t, pose = {}, act = {}) {
  const au = auto('dex', t, act);
  const hr = pose.headRot ?? au.headRot ?? 0, hy = pose.headY ?? au.headY ?? 0, by = pose.bodyY ?? au.bodyY ?? 0;
  const kL = knee(-1, pose.legL || 0, by), kR = knee(1, pose.legR || 0, by);
  return [
    { svg: onHead(helmet(), hr, hy), layer: 'front' },
    { svg: kneePad(kL[0], kL[1] + 6, 0.92) + kneePad(kR[0], kR[1] + 6, 0.92), layer: 'top' },
  ];
}

// ---------------------------------------------------------------- Mom: bathrobe, towel turban, wrinkles
const ROBE = '#FF9EC4', ROBE_D = '#E978A6', ROBE_L = '#FFD2E4';
function robeBody() {
  let o = P('M-150 -540 L150 -540 Q176 -330 168 -150 L-168 -150 Q-176 -330 -150 -540 Z', ol(ROBE, 8));
  o += P('M-150 -540 L-10 -330 L-10 -150 M150 -540 L30 -330', ln(8, ROBE_D)) + P('M-96 -548 L0 -420 L96 -548', ol(ROBE_L, 6));
  o += R(-170, -330, 340, 34, 14, ol(ROBE_D, 6)) + P('M-20 -300 Q-50 -230 -40 -190 M10 -300 Q30 -230 52 -200', ln(14, LINE)) + P('M-20 -300 Q-50 -230 -40 -190 M10 -300 Q30 -230 52 -200', ln(7, ROBE_D));
  o += R(60, -280, 80, 70, 14, ol(ROBE_L, 5));
  return o;
}
function robeSleeve(side, ang) {
  // over the arm: pivot at the shoulder (side*100, -515), the arm hangs along +y, rotated by -ang mirrored by side
  const s = R(-58, -30, 116, 220, 34, ol(ROBE, 7)) + P('M-30 40 L-24 150 M22 60 L26 160', ln(5, ROBE_D)) + R(-60, 168, 120, 44, 18, ol(ROBE_L, 6));
  return G(s, `translate(${side * 100} -515) scale(${side} 1) rotate(${f(-ang)})`);
}
function turban() {
  return G(turban0(), 'translate(0 -36)');
}
function turban0() {
  let o = P('M-210 -840 Q-250 -1050 -60 -1110 Q120 -1150 210 -1020 Q250 -930 200 -840 Q0 -880 -210 -840 Z', ol('#FFFFFF', 8));
  o += P('M-180 -930 Q-40 -1010 160 -960 M-120 -1050 Q20 -1090 170 -1020', ln(7, '#C9D8EA'));
  o += P('M40 -1110 Q90 -1210 170 -1180 Q140 -1120 120 -1060 Z', ol('#FFFFFF', 7));
  o += P('M-210 -840 Q0 -880 200 -840 L196 -810 Q0 -850 -206 -812 Z', ol('#E9F2FB', 5));
  return o;
}
function wrinkles(k = 1) {
  if (k <= 0) return '';
  const w = ln(5, '#9A5A40', f(0.75 * k));
  let o = '';
  for (const sx of [-1, 1]) o += P(`M${sx * 112} -716 q${sx * 12} 16 0 32 q${sx * -12} 16 0 32 M${sx * 136} -700 q${sx * 10} 14 0 28 M${sx * 30} -622 q${sx * 24} 10 ${sx * 50} 0 q${sx * 24} -10 ${sx * 50} 0`, w);
  return o;
}
// wrinkly "prune" hand overlay at a hand tip (body space)
function pruneHand(x, y, s = 1) {
  return G(EL(0, 0, 48, 54, ol('#D69A78', 6)) + P('M-30 -26 q10 8 0 16 q-10 8 0 16 M-8 -36 q10 8 0 16 q-10 8 0 16 q10 8 0 16 M16 -30 q10 8 0 16 q-10 8 0 16 M30 -12 q8 8 0 16', ln(5, '#8A5238')), tr(x, y, s));
}

// Dad's glasses turn into two loading spinners (body space; lens centres at (+-61, -714))
function spinnerSpecs(t, k = 1) {
  let o = '';
  for (const sx of [-1, 1]) o += R(sx * 61 - 50, -748, 100, 70, 12, { fill: '#2A2E3A', opacity: f(0.85 * k) }) + ST.spinner(sx * 61, -713, 24, t + (sx > 0 ? 0.3 : 0), '#FFFFFF', 8, 6.5);
  return o;
}

// ---------------------------------------------------------------- small props
// Dad's laptop (open, screen facing the viewer). screen: svg|fn(w,h) for a 300x170 box
function dadLaptop(x, y, s = 1, screen = '', o = {}) {
  const id = S.uid('s12lap');
  let g = R(-170, -210, 340, 200, 16, ol('#3A3F4E', 8)) + S.clipDef(id, R(-150, -195, 300, 170, 6));
  const inner = typeof screen === 'function' ? screen(300, 170) : screen;
  g += G(G(R(-150, -85, 300, 170, 0, { fill: '#123' }) + inner, 'translate(0 -110)'), null, { 'clip-path': `url(#${id})` });
  g += R(-150, -195, 300, 170, 6, { fill: 'url(#setsScreenShine)' });
  g += P('M-200 -10 L200 -10 L230 20 L-230 20 Z', ol('#5A6070', 7)) + R(-40, -2, 80, 10, 4, { fill: '#3A3F4E' });
  if (o.sticker) g += G(R(-22, -16, 44, 32, 6, ol('#FFD21F', 3)) + P('M-12 0 Q-2 -10 8 0 Q-2 10 -12 0 Z M8 0 L16 -6 L16 6 Z', ol('#FF8A3D', 2)), tr(120, -176, 0.8, 10));
  return G(g, tr(x, y, s, o.rot || 0));
}
// a tablet seen from the front, screen box 220x140
function tablet(x, y, s = 1, screen = '', rot = 0) {
  const id = S.uid('s12tab');
  const inner = typeof screen === 'function' ? screen(220, 140) : screen;
  let g = R(-130, -86, 260, 172, 22, ol('#2C303C', 8)) + S.clipDef(id, R(-110, -70, 220, 140, 6));
  g += G(R(-110, -70, 220, 140, 0, { fill: '#123' }) + inner, null, { 'clip-path': `url(#${id})` }) + R(-110, -70, 220, 140, 6, { fill: 'url(#setsScreenShine)' });
  return G(g, tr(x, y, s, rot));
}
// the frozen screen: grey + spinner (+ "No internet")
function frozenScreen(w, h, t, label = true) {
  let o = R(-w / 2, -h / 2, w, h, 0, { fill: '#2A2E3A' }) + ST.spinner(0, label ? -h * 0.08 : 0, Math.min(w, h) * 0.2, t, '#DDE3EE', 8);
  if (label && h > 100) o += TF('NO INTERNET', 0, h * 0.32, Math.max(14, h * 0.13), '#FF8A9A');
  return o;
}
// the fishing game (Dad's): water, line, golden fish; k = 0 hooked .. 1 out of the water
function fishGame(w, h, t, k = 0, opts = {}) {
  const sx = w / 1920, sy = h / 1080;
  let o = R(0, 0, 1920, 1080, 0, { fill: '#8FDBFF' }) + R(0, 520, 1920, 560, 0, { fill: '#2E8BD6' }) + R(0, 520, 1920, 18, 0, { fill: '#BFF0FF' });
  o += CI(1600, 200, 110, ol('#FFE14D', 8));
  for (let i = 0; i < 6; i++) o += P(`M${100 + i * 330} ${640 + (i % 2) * 120} q40 -24 80 0 q40 24 80 0`, ln(10, '#7FCBF5'));
  // dock + rod
  o += R(0, 430, 520, 70, 6, ol('#A86B3C', 8)) + R(60, 500, 30, 300, 6, ol('#8A5530', 6)) + R(400, 500, 30, 300, 6, ol('#8A5530', 6));
  const fx = 1100, fy = lerp(700, 320, ease.out(k)) + Math.sin(t * 9) * 10 * (1 - k);
  o += P(`M380 200 Q${f(lerp(900, 980, k))} ${f(lerp(150, 120, k))} ${fx} ${f(fy - 70)}`, ln(5, '#FFFFFF'));
  o += P('M120 430 L380 200', ln(18, LINE)) + P('M120 430 L380 200', ln(10, '#C9A06A'));
  // the golden fish (wiggling)
  const wig = Math.sin(t * 22) * 14;
  let fish = P('M-150 0 Q-60 -90 80 -46 L160 -96 L140 0 L160 96 L80 46 Q-60 90 -150 0 Z', ol('#FFC93C', 10)) + CI(-90, -14, 14, { fill: LINE }) + CI(-94, -18, 5, { fill: '#FFF' });
  fish += P('M-30 -60 Q-10 0 -30 60 M20 -50 Q40 0 20 50', ln(7, '#E09A1A')) + P('M-140 10 Q-120 30 -100 18', ln(6));
  if (k > 0.4) fish += P('M-70 -110 l0 -40 M-40 -100 l20 -30 M-100 -100 l-20 -30', ln(8, '#FFFFFF'));
  o += G(fish, tr(fx, fy, 1, -20 + wig));
  if (k > 0) for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i - 4.5) * 0.28, r = 120 + 360 * k; o += CI(fx + Math.cos(a) * r, 560 + Math.sin(a) * r * 0.8 + 300 * k * k, 18 * (1 - k * 0.6), { fill: '#FFFFFF', opacity: f(1 - k * 0.7) }); }
  // HUD
  o += R(40, 36, 420, 80, 22, { fill: '#1B2340', opacity: 0.75 }) + T(opts.hud || 'LEVEL 900', 250, 96, 52, '#FFFFFF');
  o += R(1460, 36, 420, 80, 22, { fill: '#1B2340', opacity: 0.75 }) + T('FISH TOWN', 1670, 96, 52, '#FFD21F');
  return G(o, `translate(${f(-w / 2)} ${f(-h / 2)}) scale(${f(sx)} ${f(sy)})`);
}
// Pip's critic clipboard (held in front, body space centred at its middle)
function clipboard(stars = 0) {
  let o = R(-90, -120, 180, 240, 16, ol('#C98A52', 7)) + R(-74, -96, 148, 200, 6, ol('#FFFFFF', 4)) + R(-40, -134, 80, 34, 10, ol('#9AA3B2', 5));
  o += TF('ELEVATOR', 0, -64, 22, '#2A2246') + TF('REVIEW', 0, -40, 22, '#2A2246');
  for (let i = 0; i < 5; i++) o += P(F.starPath(-52 + i * 26, 0, 13), ol(i < stars ? '#FFD21F' : '#E3E6EE', 3));
  o += P('M-50 40 L50 40 M-50 64 L30 64', ln(5, '#9AA3B2'));
  return o;
}
// a smartphone lying face-down / standing (simple)
function phoneDown(x, y, s = 1, rot = 0, col = '#7C5CFF') {
  return G(R(-70, -16, 140, 32, 12, ol(col, 6)) + R(-20, -18, 40, 6, 3, { fill: '#2C303C' }) + CI(46, 0, 6, { fill: '#2C303C' }), tr(x, y, s, rot));
}

// ---------------------------------------------------------------- news graphics
// rubber stamp: text in a rounded frame, slams in with k 0..1 (big -> 1)
function stamp(x, y, txt, k, size = 120, col = '#E8243C', rot = -10, sub = '') {
  if (k <= 0) return '';
  const sc = lerp(2.6, 1, ease.out(clamp(k, 0, 1)));
  const w = txt.length * size * 0.56 + 80;
  let o = R(-w / 2, -size * 0.8, w, size * (sub ? 1.5 : 1.15), 26, { fill: '#FFFFFF', opacity: 0.85, stroke: col, 'stroke-width': 14 });
  o += R(-w / 2 + 14, -size * 0.8 + 14, w - 28, size * (sub ? 1.5 : 1.15) - 28, 18, { fill: 'none', stroke: col, 'stroke-width': 5 });
  o += T(txt, 0, size * 0.18, size, col);
  if (sub) o += TF(sub, 0, size * 0.56, size * 0.3, col);
  return G(o, tr(x, y, sc, rot), { opacity: f(clamp(k * 3, 0, 1)) });
}
// a "LIVE" news camera panel: inner = svg drawn in a 1920x1080 frame, shown in w x h
function livePanel(x, y, w, h, inner, label, k, t, rot = 0) {
  if (k <= 0) return '';
  const id = S.uid('s12live');
  let o = R(-w / 2 + 10, -h / 2 + 14, w, h, 18, { fill: '#000', opacity: 0.25 });
  o += S.clipDef(id, R(-w / 2, -h / 2, w, h, 14)) + G(G(inner, `translate(${f(-w / 2)} ${f(-h / 2)}) scale(${f(w / 1920)} ${f(h / 1080)})`), null, { 'clip-path': `url(#${id})` });
  o += R(-w / 2, -h / 2, w, h, 14, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 10 }) + R(-w / 2, -h / 2, w, h, 14, { fill: 'none', stroke: LINE, 'stroke-width': 4 });
  o += R(-w / 2 + 16, -h / 2 + 16, 96, 38, 10, { fill: '#E8243C' }) + CI(-w / 2 + 34, -h / 2 + 35, 7, { fill: Math.floor(t * 2) % 2 ? '#FFFFFF' : '#FFB0B8' }) + TF('LIVE', -w / 2 + 74, -h / 2 + 46, 24, '#FFFFFF');
  o += R(-w / 2, h / 2 - 50, w, 50, 0, { fill: '#10162A', opacity: 0.82 }) + TF(label, 0, h / 2 - 15, 28, '#FFE14D');
  return G(o, tr(x, y, ob(k), rot));
}
// flat crowd silhouettes looking up (cheap: one path per colour)
function crowdUp(x0, x1, base, n, t, seed = 1, cols = ['#FF6B6B', '#4ECDC4', '#FFD166', '#6A4C93', '#1982C4', '#8AC926']) {
  const by = cols.map(() => ''), heads = [];
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, (i + 0.5) / n) + (hash(i + seed) - 0.5) * 40, s = 0.8 + hash(i * 3 + seed) * 0.4;
    const bob = Math.abs(Math.sin(t * 3 + i)) * 6;
    const c = Math.floor(hash(i * 7 + seed) * cols.length);
    by[c] += `M${f(x - 34 * s)} ${base} L${f(x - 30 * s)} ${f(base - 120 * s - bob)} L${f(x + 30 * s)} ${f(base - 120 * s - bob)} L${f(x + 34 * s)} ${base} Z `;
    const wave = i % 3 === 0;
    if (wave) by[c] += `M${f(x + 24 * s)} ${f(base - 116 * s - bob)} L${f(x + 52 * s + Math.sin(t * 8 + i) * 8)} ${f(base - 200 * s - bob)} L${f(x + 66 * s + Math.sin(t * 8 + i) * 8)} ${f(base - 194 * s - bob)} L${f(x + 36 * s)} ${f(base - 110 * s - bob)} Z `;
    heads.push([x, base - 150 * s - bob, 30 * s]);
  }
  let o = by.map((d, i) => (d ? P(d, { fill: cols[i], stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' }) : '')).join('');
  o += P(heads.map(([x, y, r]) => `M${f(x - r)} ${f(y)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`).join(' '), { fill: '#F2C9A0', stroke: LINE, 'stroke-width': 5 });
  // everyone looks up: two dots high on each head
  o += P(heads.map(([x, y, r]) => `M${f(x - r * 0.35)} ${f(y - r * 0.3)} l0.1 0 M${f(x + r * 0.35)} ${f(y - r * 0.3)} l0.1 0`).join(' '), ln(7));
  return o;
}

// ---------------------------------------------------------------- Dex's front stoop (morning)
// Front view of Dex's house: the door at the top of a short stoop whose steps come DOWN TOWARD the camera.
// Feet y per level (0 = landing at the door .. 4 = sidewalk): STOOP.y[i], a fitting rig scale STOOP.s[i].
// Above the roof (y < 120) a big morning sky continues up to y -900 for the tilt-up "graphics" shot.
const STOOP = { x: 960, y: [652, 732, 812, 892, 1000], s: [0.46, 0.49, 0.52, 0.55, 0.6] };
function stoop(t, opts = {}) {
  let o = R(-800, -1200, 3520, 2600, 0, { fill: 'url(#s12morn)' });
  // the sky (big: the camera tilts up into it)
  o += CI(1500, -420, 300, { fill: 'url(#s12warm)' }) + CI(1500, -420, 120, ol('#FFE14D', 9));
  o += K.rays(1500, -420, 16, 900, '#FFF6C8', 0.18, t * 8);
  for (const [x0, y, s, sp] of [[100, -700, 1.4, 16], [800, -560, 1.0, 10], [1300, -160, 0.9, 20], [-200, -260, 1.1, 12], [700, -60, 0.8, 14]]) o += K.E.cloud(((x0 + t * sp) % 2600) - 400, y, s);
  // rainbow
  const rb = ['#FF5A5A', '#FFB13B', '#FFE14D', '#5DCB6A', '#3FA9FF', '#9B6BFF'];
  rb.forEach((c, i) => { o += P(`M${-100 + i * 26} 140 A${880 - i * 26} ${760 - i * 26} 0 0 1 ${1660 - i * 26} 140`, ln(26, c, 0.55)); });
  // birds
  for (let i = 0; i < 5; i++) { const bx = ((t * 120 + i * 300) % 2600) - 400, by = -520 + i * 70 + Math.sin(t * 2 + i) * 14, fl = Math.sin(t * 14 + i) * 16; o += P(`M${f(bx - 30)} ${f(by - fl)} Q${f(bx - 14)} ${f(by - 16)} ${f(bx)} ${f(by)} Q${f(bx + 14)} ${f(by - 16)} ${f(bx + 30)} ${f(by - fl)}`, ln(7)); }
  // house: roof + wall
  o += P('M-200 130 L960 -60 L2120 130 L2120 170 L-200 170 Z', ol('#E8604A', 9)) + P('M-200 170 L2120 170', ln(10, '#B8452A'));
  o += R(-200, 170, 2320, 900, 0, { fill: '#BFE3F5' }) + R(-200, 170, 2320, 900, 0, { fill: 'url(#setsSiding)' });
  // windows with flower boxes
  for (const wx of [330, 1590]) {
    o += R(wx - 170, 260, 340, 260, 10, ol('#FFFFFF', 8)) + R(wx - 152, 278, 304, 224, 4, { fill: '#BFF0FF' }) + R(wx - 6, 278, 12, 224, 2, { fill: '#FFFFFF' }) + P(`M${wx - 120} 480 L${wx - 30} 300 L${wx} 300 L${wx - 90} 480 Z`, { fill: '#FFFFFF', opacity: 0.4 });
    o += R(wx - 190, 520, 380, 56, 10, ol('#C98A52', 6));
    for (let i = 0; i < 6; i++) o += CI(wx - 150 + i * 60, 512, 20, ol(['#FF6FA8', '#FFD34D', '#FF8A4C'][i % 3], 4)) + CI(wx - 150 + i * 60, 512, 6, { fill: '#FFF6C8' });
  }
  // door (opts.doorOpen 0..1)
  const k = clamp(opts.doorOpen || 0, 0, 1);
  o += R(830, 210, 260, 450, 12, ol('#FFFFFF', 9));
  o += R(850, 230, 220, 430, 6, { fill: '#2A1E2E' });
  o += P(`M850 230 L${f(1070 - 200 * k)} ${f(230 - 26 * k)} L${f(1070 - 200 * k)} ${f(660 + 26 * k)} L850 660 Z`, ol('#2E7BD6', 7));
  if (k < 0.6) o += R(880, 270, 160, 150, 8, { fill: 'none', stroke: '#1E5FA8', 'stroke-width': 6, opacity: f(1 - k / 0.6) }) + CI(1040 - 180 * k, 460, 11, ol('#FFD34D', 4));
  o += R(910, 150, 100, 46, 8, ol('#2EA39A', 4)) + T('12', 960, 186, 34, '#FFFFFF');
  // stoop: landing + three steps toward the camera (each wider), side walls, rails
  const lv = [[760, 1160, 652], [720, 1200, 732], [680, 1240, 812], [640, 1280, 892]];
  for (let i = 0; i < lv.length; i++) {
    const [x0, x1, y] = lv[i];
    o += R(x0, y - 22, x1 - x0, 30, 6, ol(i ? '#E3E7EE' : '#D6DBE4', 6)) + R(x0, y + 8, x1 - x0, 72, 0, ol('#B9C0CC', 6));
    o += P(`M${x0 + 20} ${y + 30} L${x1 - 20} ${y + 30}`, ln(4, '#A3AAB7', 0.6));
  }
  // sidewalk + lawn strips
  o += R(-800, 970, 3520, 400, 0, { fill: '#D9DEE7' }) + P('M-800 972 L2720 972', ln(6, '#9AA3B2'));
  o += R(-800, 940, 1440, 34, 0, { fill: '#7ED36A' }) + R(1280, 940, 1440, 34, 0, { fill: '#7ED36A' }) + P('M-800 940 L640 940 M1280 940 L2720 940', ln(5, '#4FA84A'));
  for (let x = -760; x < 2720; x += 300) o += P(`M${x} 972 L${x - 40} 1100`, ln(4, '#B9C0CC'));
  // bushes either side of the stoop
  for (const [bx, by, br] of [[560, 900, 110], [1360, 900, 110], [120, 930, 150], [1800, 930, 150]]) o += CI(bx, by, br, ol('#4FB86A', 7)) + CI(bx - br * 0.3, by - br * 0.4, br * 0.3, { fill: '#7FDB8E' }) + CI(bx + br * 0.35, by - br * 0.05, br * 0.12, { fill: '#FF8FB8' });
  // rails (left and right), from the landing down to the sidewalk
  for (const sd of [-1, 1]) {
    const xa = 960 + sd * 160, xb = 960 + sd * 290;
    const d = `M${xa} 470 L${xb} 860`;
    o += P(d, ln(22, LINE)) + P(d, ln(12, '#3A3F4E')) + P(d, ln(4, '#8A93A6'));
    o += R(xa - 9, 470, 18, 190, 4, ol('#3A3F4E', 4));
  }
  // mailbox
  o += R(1690, 760, 18, 220, 4, ol('#8A5530', 4)) + R(1620, 690, 160, 84, 30, ol('#3F72C0', 6)) + R(1770, 650, 10, 60, 2, ol('#E8243C', 3)) + R(1770, 650, 40, 24, 3, ol('#E8243C', 3)) + TF('DEX', 1700, 744, 28, '#FFFFFF');
  return o;
}
// railing parts that go IN FRONT of a character standing between the rails (posts at the bottom)
function stoopFront() {
  let o = '';
  for (const sd of [-1, 1]) { const xb = 960 + sd * 290; o += R(xb - 10, 860, 20, 130, 4, ol('#3A3F4E', 4)) + CI(xb, 860, 14, ol('#5A6070', 4)); }
  return o;
}

// ---------------------------------------------------------------- the porch step seen from above (phones insert)
function stepTop(t, k = 1) {
  let o = R(-800, -600, 3520, 2280, 0, { fill: '#C98A5A' });
  for (let y = -40; y < 1200; y += 150) o += R(-800, y, 3520, 146, 0, { fill: y % 300 ? '#D9A066' : '#CF965E' }) + P(`M-800 ${y + 146} L2720 ${y + 146}`, ln(6, '#9A6A40'));
  for (let i = 0; i < 9; i++) o += P(`M${f(hash(i) * 1900)} ${f(-40 + (i % 8) * 150 + 40)} q60 -10 120 0 q60 10 120 0`, ln(4, '#B8804E', 0.6));
  // long golden light + shadows of the family's legs
  o += R(-800, -600, 3520, 2280, 0, { fill: '#FF9A4D', opacity: 0.18 });
  for (let i = 0; i < 5; i++) o += P(`M${-200 + i * 420} -100 L${-60 + i * 420} -100 L${400 + i * 420} 1200 L${200 + i * 420} 1200 Z`, { fill: '#5A2A20', opacity: 0.08 });
  o += R(-800, -600, 3520, 2280, 0, { fill: 'url(#s12warm)', opacity: 0.4 * k });
  return o;
}
// a hand + sleeve reaching in from (x0, y0) toward (x, y); col = sleeve colour; skin
function reachHand(x0, y0, x, y, col, skin = '#F2C9A0') {
  const a = Math.atan2(y - y0, x - x0) * 180 / Math.PI;
  const len = Math.hypot(x - x0, y - y0);
  let o = R(-40, -66, len - 60, 132, 46, ol(col, 8)) + R(len - 110, -60, 40, 120, 14, ol(col, 7));
  o += EL(len + 30, 22, 30, 22, { ...ol(skin, 6), transform: `rotate(40 ${f(len + 30)} 22)` });
  o += R(len - 76, -52, 150, 104, 46, ol(skin, 7)) + P(`M${f(len + 20)} -30 L${f(len + 64)} -30 M${f(len + 20)} -4 L${f(len + 70)} -4 M${f(len + 20)} 22 L${f(len + 62)} 22`, ln(5, '#C98E6A', 0.7));
  return G(o, `translate(${f(x0)} ${f(y0)}) rotate(${f(a)})`);
}
// a big phone lying on the step: flip 0 = screen up (lit) .. 1 = face down
function bigPhone(x, y, s, rot, flip, col, t) {
  const sy = Math.cos(clamp(flip, 0, 1) * Math.PI);
  const face = sy > 0;
  let o = R(-110, -210, 220, 420, 34, ol(face ? '#20232E' : col, 8));
  if (face) o += R(-94, -186, 188, 372, 20, { fill: '#5BC0EB' }) + CI(0, -20, 50, { fill: '#FFFFFF', opacity: 0.6 }) + R(-60, 80, 120, 24, 10, { fill: '#FFFFFF', opacity: 0.5 });
  else o += R(-60, -170, 56, 56, 16, ol('#2C303C', 5)) + CI(-46, -156, 10, { fill: '#5A6070' }) + CI(-18, -128, 8, { fill: '#5A6070' }) + P('M-30 60 Q0 40 30 60', ln(6, '#FFFFFF', 0.3));
  return G(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)} ${f(s * Math.max(0.05, Math.abs(sy)))})`);
}

// ---------------------------------------------------------------- fallback rack hall (only if farm.rackHall ever fails)
function simpleHall(t, cam, dist = 0) {
  let w = R(-900, -700, 3720, 2480, 0, { fill: '#0B1433' }) + R(-900, 900, 3720, 600, 0, { fill: '#101C46' });
  for (let i = -6; i < 16; i++) {
    const x = i * 210 - (dist % 210);
    w += R(x, 270, 180, 630, 8, ol('#1C2D63', 6));
    for (let j = 0; j < 9; j++) w += R(x + 18, 300 + j * 64, 144, 40, 4, { fill: '#13204A' }) + CI(x + 140, 320 + j * 64, 5, { fill: Math.floor(t * 2 + i + j) % 3 ? '#46F58C' : '#5CE1FF' });
  }
  return { bg: G(w, K.E.camTf(cam, 1)), mid: '', fg: '' };
}

// ---------------------------------------------------------------- end card bits (SC 13)
// floating grassy island the cast stands on (grass top at y)
function island(x, y, w, t) {
  const h = w * 0.36;
  let o = P(`M${f(-w / 2)} 0 L${f(w / 2)} 0 L${f(w * 0.4)} ${f(h * 0.4)} L${f(w * 0.18)} ${f(h * 0.62)} L${f(w * 0.04)} ${f(h)} L${f(-w * 0.14)} ${f(h * 0.6)} L${f(-w * 0.38)} ${f(h * 0.42)} Z`, ol('#B87A4A', 8));
  o += P(`M${f(-w * 0.34)} ${f(h * 0.2)} L${f(w * 0.3)} ${f(h * 0.2)} M${f(-w * 0.12)} ${f(h * 0.44)} L${f(w * 0.14)} ${f(h * 0.44)}`, ln(6, '#94603A', 0.8));
  o += R(-w / 2 - 14, -38, w + 28, 64, 26, ol('#5FCB5E', 8)) + R(-w / 2 + 10, -30, w - 20, 16, 8, { fill: '#A2EC8E' });
  for (let i = 0; i < 9; i++) { const gx = -w * 0.45 + i * w * 0.112; o += P(`M${f(gx)} 22 q14 26 28 0`, { fill: '#5FCB5E', stroke: LINE, 'stroke-width': 5 }); }
  return G(o, tr(x, y));
}
// a soap bubble (outline + shine)
function bubble(x, y, r, op = 1) {
  return G(CI(0, 0, r, { fill: '#FFFFFF', 'fill-opacity': 0.14, stroke: '#B8A8F0', 'stroke-width': Math.max(3, r * 0.05) }) + P(`M${f(-r * 0.62)} ${f(-r * 0.3)} A${f(r * 0.7)} ${f(r * 0.7)} 0 0 1 ${f(-r * 0.2)} ${f(-r * 0.66)}`, ln(Math.max(3, r * 0.08), '#FFFFFF', 0.9)) + CI(r * 0.38, r * 0.4, r * 0.08, { fill: '#FFFFFF', opacity: 0.7 }), tr(x, y), { opacity: f(op) });
}

const DEFS = `<defs>
<linearGradient id="s12morn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6EC6FF"/><stop offset="0.65" stop-color="#C6ECFF"/><stop offset="1" stop-color="#FFF1C9"/></linearGradient>
<linearGradient id="s12space" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1440"/><stop offset="1" stop-color="#2A2A7A"/></linearGradient>
<radialGradient id="s12warm"><stop offset="0" stop-color="#FFE7A8" stop-opacity="0.7"/><stop offset="1" stop-color="#FFE7A8" stop-opacity="0"/></radialGradient>
<radialGradient id="s12glowG"><stop offset="0" stop-color="#7CFFB0" stop-opacity="0.6"/><stop offset="1" stop-color="#7CFFB0" stop-opacity="0"/></radialGradient>
<linearGradient id="s13sky" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#9FD8FF"/><stop offset="0.55" stop-color="#E3D4FF"/><stop offset="1" stop-color="#FFD9EC"/></linearGradient>
</defs>`;

module.exports = {
  DEFS, auto, onHead, knee, helmet, kneePad, dexGear, robeBody, robeSleeve, turban, wrinkles, pruneHand, spinnerSpecs, simpleHall,
  dadLaptop, tablet, frozenScreen, fishGame, clipboard, phoneDown, stamp, livePanel, crowdUp, stoop, stoopFront, STOOP, stepTop, reachHand, bigPhone, island, bubble, ob,
};
