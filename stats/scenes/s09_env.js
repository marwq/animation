// SC 09 helpers: the cut list + beats from the voice (shared with audio/cues/gen_sc09.js) and the 1979 flashback kit: a sepia
// palette (every colour mapped onto one brown ramp — props, the cheap crowd and the young designs all go through it), young
// Grandpa Lou (brown pompadour + brown walrus moustache, mustard tee), young Grandma (red bouffant, striped boat-neck), BIG MIKE
// the 1979 champion, the Super-8 film frame (sprockets, grain, scratches, flicker, a '79 date stamp), the 1979 fair stage, the
// arm-wrestling insert (two forearms, the slam) and the 1979 night bench (same layout as fairBench: the match cut).
'use strict';

const K = require('./kit');
const FS = require('./sets_fair');
const { makeDesign } = require('../rig/r6');
const { drawCharacter } = require('../rig/body');
const L3 = require('../rig/looks3'), L4 = require('../rig/looks4'), L5 = require('../rig/looks5'), L6 = require('../rig/looks6'), L7 = require('../rig/looks7');
const { S, f, clamp, lerp, ease, seg, bump, hash, ln } = K;

// ================================================================ times (from the voice only)
function times(V) {
  const { L } = V;
  const l = (i) => L('09.' + i);
  const START = V.scene('SC 09').start, END = V.scene('SC 10').start;
  const C = {}, B = {};
  // -- "Breathe, kid. Sit with me for one second."
  C.hand = START;
  B.hand = l(0).a - 0.12;
  B.breathe = l(0).word('Breathe').t0;
  C.bench = l(0).word('Sit').t0 - 0.32;
  B.sit = l(0).word('second').t0 - 0.05;
  // -- "You know my story. Nineteen seventy-nine. The finals. But I never told you the end."
  C.story = l(1).a - 0.12;
  B.patch = l(1).word('Nineteen').t0 - 0.1;
  C.finals = l(1).word('The').t0 - 0.15;
  C.end = l(1).word('But').t0 - 0.15;
  // -- "I lost. Lost the final. In front of everybody."
  C.lost = l(2).a - 0.1;
  C.fb1 = l(2).word('Lost', 1).t0 - 0.22;
  B.everybody = l(2).word('everybody').t0;
  // -- "You... LOST?"
  C.youLost = l(3).a - 0.18;
  B.LOST = l(3).word('LOST').t0;
  // -- "Arm went down in two seconds. The whole town laughed."
  C.arm = l(4).a - 0.3;
  B.down = l(4).word('down').t0;
  B.two = l(4).word('two').t0;
  C.laugh = l(4).word('The').t0 - 0.15;
  B.laughed = l(4).word('laughed').t0;
  // -- (beat) young Lou alone at night; "And that night, I met your grandma. Best loss of my whole life."
  C.night = l(4).b + 0.4;
  B.met = l(5).word('met').t0;
  B.grandma = l(5).word('grandma').t0;
  C.match = l(5).word('Best').t0 - 0.38;
  B.best = l(5).word('Best').t0;
  // -- "Numbers tell you how strong somebody is. They don't tell you who they are."
  C.numbers = l(6).a - 0.1;
  B.strong = l(6).word('strong').t0;
  C.who = l(6).word('They').t0 - 0.2;
  B.who = l(6).word('who').t0;
  // -- "I think I stopped seeing people, Grandpa. I only saw numbers."
  C.iThink = l(7).a - 0.12;
  C.onlySaw = l(7).word('I', 2).t0 - 0.15;
  B.saw = l(7).word('numbers').t0;
  // -- "Hey. What's that little X up in the corner?"
  C.x = l(8).a - 0.12;
  B.hey = l(8).a;
  B.X = l(8).word('X').t0;
  B.corner = l(8).word('corner').t0;
  // -- "...An X?"
  C.anX = l(9).a - 0.22;
  // -- "It was on page one. Of four thousand, eight hundred and twelve."
  C.page = l(10).a - 0.12;
  B.pageOne = l(10).word('page').t0;
  B.of = l(10).word('Of').t0;
  B.twelve = l(10).word('twelve').t0;
  // -- SYSTEM "Reality HUD... off." — he presses the X; on "off" the HUD shatters; then true silence
  C.press = l(10).b + 0.02;
  B.reach = C.press + 0.1;
  B.press = l(11).a - 0.08;
  B.shatter = l(11).word('off').t0 - 0.04;
  C.clean = B.shatter + 1.75;
  C.look = C.clean + Math.max(1.2, (END - C.clean) * 0.48);
  return { START, END, C, B };
}

// ================================================================ sepia (1979)
const DARK = [34, 20, 10], LIGHT = [252, 238, 208];
const sepCache = new Map();
function SEP(col) {
  if (typeof col !== 'string') return col;
  const raw = col[0] === '!' ? col.slice(1) : col;
  if (raw[0] !== '#' || raw.length !== 7) return raw;
  let v = sepCache.get(raw);
  if (v) return v;
  const r = parseInt(raw.slice(1, 3), 16), g = parseInt(raw.slice(3, 5), 16), b = parseInt(raw.slice(5, 7), 16);
  const y = clamp((0.3 * r + 0.59 * g + 0.11 * b) / 255, 0, 1);
  const k = Math.pow(clamp((y - 0.06) / 0.88, 0, 1), 1.55);
  v = '#' + [0, 1, 2].map((i) => Math.round(lerp(DARK[i], LIGHT[i], k)).toString(16).padStart(2, '0')).join('').toUpperCase();
  sepCache.set(raw, v);
  return v;
}
const LINE = '#2C1B0E';
// map every colour of an svg string onto the sepia ramp (characters, props, crowd — eye whites and blush included)
const sepia = (svg) => svg.replace(/#[0-9A-Fa-f]{6}\b/g, SEP);
function sepiaTone() {
  const c = (col) => (typeof col !== 'string' || col[0] === 'u' || col === 'none' ? col : SEP(col));
  const ol = (fill, w = 6, extra) => ({ fill: c(fill), stroke: LINE, 'stroke-width': f(w), 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });
  const ln_ = (w, col = '#151515', o2) => ({ fill: 'none', stroke: col === '#151515' ? LINE : c(col), 'stroke-width': f(w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(o2 !== undefined ? { opacity: f(o2) } : {}) });
  const fl = (col, o2) => (o2 === undefined ? { fill: c(col) } : { fill: c(col), opacity: f(o2) });
  return { c, ol, ln: ln_, fl, line: LINE, lw: 1, dusk: 0, golden: 0, o: {} };
}
const TN = sepiaTone();
const sepCols = (cols) => Object.fromEntries(Object.entries(cols).map(([k, v]) => [k, SEP(v)]));

// ================================================================ the 1979 cast (designs in sepia colours)
const design = (style) => L7.dress7(L6.dress6(L5.dress5(L4.dress4(L3.dress(makeDesign(style))))));
const LOU = design({
  hair: 'pompadour', eyeStyle: 'dot', top: 'tee', sleeve: 'short', pantsShape: 'straight', size: 1.1, torsoW: 108, taper: -6, shoe: 'loafer', bicep: true,
  eye: { pupil: 1.0 }, brows: { L: [-6, 4], R: [-6, 4] }, neutralMouth: 'smile', acc: { hugeWalrus: 1.1, cheekBlush: SEP('#FF9F8F') },
  col: sepCols({ skin: '#F4C9A8', skinShade: '#E2AF8C', skinShade2: '#C98A6A', hair: '#6B4226', hairShade: '#4A2C18', hairHi: '#9A6A44', hairStreak: '#4A2C18', brow: '#4A2C18', stache: '#6B4226', stacheHi: '#9A6A44',
    top: '#E8A33A', topShade: '#C9862A', sleeve: '#E8A33A', cuff: '#C9862A', shirt: '#E8A33A', shirtShade: '#C9862A', pants: '#8A6A4A', pantsShade: '#6E5238', sole: '#6A4428', soleShade: '#4E3018', toe: '#8A5A34' }),
});
const GMA = design({
  hair: 'bouffant', eyeStyle: 'mid', lashes: true, top: 'momStripes', sleeve: 'short', pantsShape: 'straight', size: 1.0, torsoW: 96, shoe: 'sneaker', eye: { iris: SEP('#6A8A4A'), pupil: 0.95 },
  brows: { L: [-4, 0], R: [-4, 0] }, neutralMouth: 'smile', blush: true, acc: { cheekBlush: SEP('#FF9F8F') },
  col: sepCols({ skin: '#F6D8C0', skinShade: '#E6BEA2', hair: '#B8562A', hairShade: '#8E3E1A', hairHi: '#D8784A', brow: '#8E3E1A', top: '#FFFFFF', topShade: '#E4E4EC', sleeve: '#FFFFFF', cuff: '#E4E4EC', stripe: '#4A6CB8', accent: '#4A6CB8',
    pants: '#3E5C8A', pantsShade: '#30486E', sole: '#FFFFFF', soleShade: '#E0E0EA', toe: '#F27C6B' }),
});
const MIKE = design({
  hair: 'flatTop', eyeStyle: 'dot', top: 'tee', sleeve: 'none', pantsShape: 'straight', size: 1.38, headK: 0.88, torsoW: 130, taper: 10, armW: 1.3, legW: 1.2, hipK: 1.4, fist: true, shoe: 'boot', bicep: true,
  eye: { pupil: 0.85 }, brows: { L: [12, -4], R: [12, -4] }, neutralMouth: 'smirk', acc: { hugeWalrus: 0.9 },
  col: sepCols({ skin: '#D8A27A', skinShade: '#C08A62', skinShade2: '#A87050', hair: '#2A1E18', hairShade: '#1A1210', hairHi: '#4A3A30', brow: '#2A1E18', stache: '#2A1E18', stacheHi: '#4A3A30',
    top: '#F2F2F2', topShade: '#D8D8D8', shirt: '#F2F2F2', shirtShade: '#D8D8D8', sleeve: '#F2F2F2', cuff: '#D8D8D8', pants: '#3A3A48', pantsShade: '#2A2A36', sole: '#2A1E18', soleShade: '#1A1210', toe: '#3A2A20' }),
});
const draw79 = (d, p) => drawCharacter(d, { shade: true, shadow: true, ...p });

// ================================================================ the Super-8 film look (screen space, over the flashback)
function film(t, o = {}) {
  const k = o.k ?? 1;
  if (k <= 0) return '';
  const st = Math.floor(t * 18);
  let g = S.rect(0, 0, 1920, 1080, 0, { fill: '#C8964E', opacity: f(0.07 * k) });
  // flicker
  g += S.rect(0, 0, 1920, 1080, 0, { fill: hash(st * 1.7) > 0.5 ? '#FFF2D0' : '#2A1808', opacity: f((0.025 + 0.03 * hash(st * 2.9)) * k) });
  // burnt edges: nested rounded frames (evenodd), darker outside
  [[0, 0.5], [26, 0.32], [60, 0.2], [110, 0.12]].forEach(([d, a]) => {
    g += S.path(`M-10 -10H1930V1090H-10Z M${100 + d} ${40 + d}H${1820 - d}Q${1850 - d} ${40 + d} ${1850 - d} ${80 + d}V${1000 - d}Q${1850 - d} ${1040 - d} ${1820 - d} ${1040 - d}H${100 + d}Q${70 + d} ${1040 - d} ${70 + d} ${1000 - d}V${80 + d}Q${70 + d} ${40 + d} ${100 + d} ${40 + d}Z`, { fill: '#1E1208', opacity: f(a * k), 'fill-rule': 'evenodd' });
  });
  // the film strip: black side bars with sprocket holes rolling down
  const off = (t * 220) % 120;
  let holes = '';
  for (let y = -120 + off; y < 1140; y += 120) holes += `M14 ${f(y)}h34v60h-34Z M1872 ${f(y)}h34v60h-34Z`;
  g += S.path(`M-10 -10H64V1090H-10Z M1856 -10H1930V1090H1856Z`, { fill: '#120B05', opacity: f(k) }) + S.path(holes, { fill: '#E8D6B0', opacity: f(0.85 * k) });
  // grain specks + hairs + scratches
  let d = '';
  for (let i = 0; i < 26; i++) { const x = 70 + hash(st * 3.1 + i * 7.7) * 1780, y = hash(st * 5.3 + i * 3.9) * 1080, r = 1.5 + 3 * hash(i * 1.3 + st); d += `M${f(x)} ${f(y)}h${f(r)}v${f(r)}h${f(-r)}Z`; }
  g += S.path(d, { fill: hash(st) > 0.5 ? '#FFF4DC' : '#1E1208', opacity: f(0.5 * k) });
  let sc = '';
  for (let i = 0; i < 3; i++) { if (hash(st * 0.7 + i * 11) < 0.5) continue; const x = 120 + hash(Math.floor(t * 3) + i * 9.1) * 1680 + (hash(st + i) - 0.5) * 12; sc += `M${f(x)} -10 L${f(x + (hash(i * 4 + st) - 0.5) * 30)} 1090`; }
  if (sc) g += S.path(sc, ln(2, '#FFF4DC', 0.35 * k));
  if (hash(st * 0.37) > 0.82) g += S.path(`M${f(400 + hash(st) * 1100)} ${f(200 + hash(st * 2) * 600)} q40 -30 70 10 t60 -20`, ln(2.5, '#1E1208', 0.5 * k));
  // the date stamp (orange LED, like an old camera)
  if (o.stamp !== false) g += K.T("'79  7  14", 1640, 980, 46, '#FF9A3C', { 'letter-spacing': 4, opacity: f(0.85 * k), stroke: '#5A2A08', 'stroke-width': 3, 'paint-order': 'stroke' });
  return g;
}
// film-burn transition (k 0..1..0): an orange-white bloom from one side
function burn(k, side = 1) {
  if (k <= 0.01) return '';
  const x = side > 0 ? 1920 : 0;
  let g = '';
  [[1.0, 0.25], [0.7, 0.35], [0.45, 0.5], [0.25, 0.7]].forEach(([r, a]) => { g += S.ellipse(x, 540, 1500 * r * k + 60, 1100 * r * k + 60, { fill: r < 0.5 ? '#FFF6E0' : '#FFB04A', opacity: f(a * k) }); });
  return g;
}

// ================================================================ the 1979 fair: a stage + crowd (world: k 1 plane, floor 960 like the fair)
const sAt = FS.SPOTS.fair.sAt;
function stage79(t, cam, o = {}) {
  const V = (svg, k = 1) => S.g(svg, FS.camTf(cam, k));
  const tn = TN;
  // sky + sun
  let bg = S.rect(-2000, -1600, 6000, 3200, 0, { fill: SEP('#BFD8F0') }) + S.rect(-2000, 380, 6000, 800, 0, { fill: SEP('#D8E8F4') });
  bg += S.circle(1500, 120, 90, { fill: SEP('#FFF4C8') });
  let far = '';
  // tents + big top behind (k .7)
  far += S.g(FS.bigTop(tn, 12, t), 'translate(250 720) scale(0.38)') + S.g(FS.tent(1300, 1100, '#EE3B4C', '#FFFDF6', tn, 14, 0, t, 2), 'translate(1650 740) scale(0.34)');
  far += S.g(FS.tent(1200, 1000, '#22B4BE', '#FFFDF6', tn, 14, 0, t, 5), 'translate(-300 740) scale(0.32)') + S.g(FS.stall(1100, 'POPCORN', '#EE3B4C', '#FFFDF6', tn, 16, 0), 'translate(2150 760) scale(0.3)');
  bg += V(far, 0.7) + V(S.rect(-2000, 700, 6000, 1400, 0, { fill: SEP('#EAC594') }), 1);
  // the stage
  let st = S.rect(380, 560, 1160, 110, 10, tn.ol('#C98A4E', 6)) + S.rect(380, 560, 1160, 22, 6, tn.fl('#E0A868'));
  for (let x = 420; x < 1520; x += 110) st += S.path(`M${x} 600 v60`, tn.ln(4, '#9C6235'));
  st += S.rect(420, -40, 14, 620, 4, tn.ol('#9C6235', 5)) + S.rect(1486, -40, 14, 620, 4, tn.ol('#9C6235', 5));
  st += FS.bunting(420, -30, 1500, -30, 40, 26, tn) + S.rect(560, -6, 800, 96, 16, tn.ol('#EE3B4C', 6));
  st += K.T('ARM WRESTLING · FINAL', 960, 60, 54, SEP('#FFFDF6'), { stroke: LINE, 'stroke-width': 6, 'paint-order': 'stroke' });
  // the table (in front of the wrestlers)
  const table = S.rect(800, 452, 320, 26, 6, tn.ol('#9C6235', 5)) + S.rect(830, 478, 24, 88, 4, tn.ol('#7A4A22', 4)) + S.rect(1066, 478, 24, 88, 4, tn.ol('#7A4A22', 4));
  return { bg, stage: V(st), table: V(table) };
}
// cheap crowd rows of the 1979 fair (world, sepia): FS.crowd with the sepia tone
function crowd79(t, cam, rows, o = {}) {
  const v = FS.vis(cam, 1);
  return S.g(FS.crowd(rows, { tone: TN, t, zoom: cam.zoom, x0: v.x0 - 200, x1: v.x1 + 200, cheer: o.cheer || 0, faces: o.faces }), FS.camTf(cam, 1));
}
const row79 = (y, seed, dens = 1, gaps = []) => ({ y, s: sAt(y), seed, dens, dx: 270, jit: 10, gaps });

// ================================================================ the arm-wrestling insert (screen space)
// u 0..1 = how far the arms went down (0 locked upright, 1 Lou's hand flat on the table), shake 0..1, slam 0..1 (impact)
function armInsert(t, u, o = {}) {
  const tn = TN;
  let g = S.rect(0, 0, 1920, 1080, 0, { fill: SEP('#8A6A9A') });
  // blurred crowd behind (soft discs)
  let d = '';
  for (let i = 0; i < 26; i++) d += `M${f(hash(i * 3.3) * 2000 - 40)} ${f(140 + hash(i * 5.1) * 360)}a${f(60 + 40 * hash(i))} ${f(70 + 40 * hash(i))} 0 1 0 1 0Z`;
  g += S.path(d, { fill: SEP('#C8A080'), opacity: 0.55 });
  // the table top
  g += S.rect(-20, 860, 1960, 260, 0, tn.ol('#C98A4E', 8)) + S.path('M-20 940 H1940 M-20 1020 H1940', tn.ln(5, '#9C6235')) + S.rect(-20, 860, 1960, 24, 0, tn.fl('#E0A868'));
  // the pads under the elbows
  g += S.ellipse(800, 880, 120, 26, tn.ol('#5A3A22', 5)) + S.ellipse(1140, 880, 140, 28, tn.ol('#5A3A22', 5));
  const sh = (o.shake || 0) * 6;
  const jx = Math.sin(t * 61) * sh, jy = Math.cos(t * 53) * sh;
  // geometry: Mike's elbow E2, fists P on an arc around it; Lou's forearm from E1 to P
  const E1 = [790, 870], E2 = [1140, 870], R = 420;
  const th = lerp(0.36, Math.PI / 2 * 1.02, ease.in(clamp(u, 0, 1)));
  const P = [E2[0] - R * Math.sin(th) + jx, E2[1] - R * Math.cos(th) + jy];
  const limb = (a, b, w, col, sh_) => S.path(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`, { fill: 'none', stroke: LINE, 'stroke-width': f(w + 12), 'stroke-linecap': 'round' }) + S.path(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`, { fill: 'none', stroke: SEP(col), 'stroke-width': f(w), 'stroke-linecap': 'round' }) +
    S.path(`M${f(a[0] + 10)} ${f(a[1] - 6)}L${f(b[0] + 10)} ${f(b[1] - 6)}`, { fill: 'none', stroke: SEP(sh_), 'stroke-width': f(w * 0.28), 'stroke-linecap': 'round', opacity: 0.6 });
  // upper arms coming from below the frame (the bodies are off-screen)
  g += limb([520, 1160], E1, 110, '#F4C9A8', '#E2AF8C') + S.path(`M${f(400)} 1180 L${f(560)} 1000 L${f(690)} 1090 L${f(560)} 1260 Z`, tn.ol('#E8A33A', 7));     // Lou's mustard sleeve
  g += limb([1500, 1180], E2, 160, '#D8A27A', '#C08A62');
  // forearms
  g += limb(E2, P, 150, '#D8A27A', '#C08A62');
  // Mike's arm hair + an anchor tattoo
  const mid = [lerp(E2[0], P[0], 0.5), lerp(E2[1], P[1], 0.5)];
  let hair = '';
  for (let i = 0; i < 9; i++) { const a = [lerp(E2[0], P[0], 0.2 + i * 0.07) + 30, lerp(E2[1], P[1], 0.2 + i * 0.07)]; hair += `M${f(a[0])} ${f(a[1])} l12 -10`; }
  g += S.path(hair, tn.ln(3, '#2A1E18'));
  // an anchor tattoo
  g += S.g(S.path('M0 -34 V30 M-22 -18 H22 M-30 8 Q-26 34 0 34 Q26 34 30 8', ln(7, SEP('#3A4A8A'), 0.8)) + S.circle(0, -42, 9, { fill: 'none', stroke: SEP('#3A4A8A'), 'stroke-width': 6, opacity: 0.8 }), `translate(${f(mid[0] + 8)} ${f(mid[1])}) rotate(${f(Math.atan2(P[1] - E2[1], P[0] - E2[0]) * 180 / Math.PI + 90)})`);
  g += limb(E1, P, 104, '#F4C9A8', '#E2AF8C');
  // the clasped fists
  const ang = Math.atan2(P[1] - E2[1], P[0] - E2[0]) * 180 / Math.PI + 90;
  let fist = S.rect(-120, -110, 240, 190, 48, tn.ol('#D8A27A', 8)) + S.rect(-92, -52, 196, 140, 40, tn.ol('#F4C9A8', 8));
  fist += S.path('M-40 -10 v40 M0 -12 v44 M40 -10 v40', tn.ln(5, '#C98A6A'));
  g += S.g(fist, `translate(${f(P[0])} ${f(P[1])}) rotate(${f(ang)})`);
  // the slam: impact star + dust
  const sl = o.slam || 0;
  if (sl > 0 && sl < 1) {
    const r = 120 + 360 * ease.out(sl);
    let star = '';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r1 = i % 2 ? r * 0.55 : r; star += `${i ? 'L' : 'M'}${f(P[0] + Math.cos(a) * r1)} ${f(P[1] - 40 + Math.sin(a) * r1 * 0.6)}`; }
    g += S.path(star + 'Z', { fill: SEP('#FFF4C8'), opacity: f(0.8 * (1 - sl)), stroke: LINE, 'stroke-width': 6, 'stroke-opacity': f(1 - sl) });
    let dust = '';
    for (let i = 0; i < 10; i++) { const a = Math.PI + (i / 9) * Math.PI, dd = 90 + 260 * ease.out(sl); dust += `M${f(P[0] + Math.cos(a) * dd)} ${f(880 + Math.sin(a) * dd * 0.3)}a${f(26 * (1 - sl) + 8)} ${f(20 * (1 - sl) + 6)} 0 1 0 1 0Z`; }
    g += S.path(dust, { fill: SEP('#E8D6B0'), opacity: f(0.8 * (1 - sl)) });
  }
  return { svg: g, P };
}

// ================================================================ the 1979 night bench (same layout as fairBench: seats x 730 / 1190, hips 848, s .58)
function bench79(t, o = {}) {
  const tn = TN;
  const BN = { floor: 1000, s: 0.58, x: 960, w: 1520, lamp: 300, lampH: 1340 };
  let g = S.rect(-900, -400, 3720, 1400, 0, { fill: SEP('#3A3E6A') }) + S.rect(-900, 520, 3720, 400, 0, { fill: SEP('#4A4A7A') });
  // stars + moon
  let st = '';
  for (let i = 0; i < 40; i++) st += `M${f(hash(i * 3.7) * 1920)} ${f(hash(i * 5.3) * 520)}h4v4h-4Z`;
  g += S.path(st, { fill: SEP('#FFF4D0'), opacity: 0.8 }) + S.circle(1560, 170, 56, { fill: SEP('#FFF4D0') }) + S.circle(1584, 158, 50, { fill: SEP('#3A3E6A') });
  // far fair silhouettes (a little Ferris wheel, tents) — the fair after closing
  let fw = '';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; fw += `M1420 420L${f(1420 + Math.cos(a) * 300)} ${f(420 + Math.sin(a) * 300)}`; }
  g += S.circle(1420, 420, 300, { fill: 'none', stroke: SEP('#6A6A9A'), 'stroke-width': 16 }) + S.path(fw, { fill: 'none', stroke: SEP('#6A6A9A'), 'stroke-width': 7 }) + S.path('M1420 420 L1240 820 M1420 420 L1600 820', { fill: 'none', stroke: SEP('#6A6A9A'), 'stroke-width': 18 });
  g += S.path('M-900 820 L-200 820 L0 620 L200 820 L500 820 L700 650 L900 820 L2820 820 V1400 H-900 Z', { fill: SEP('#5A4A7A') });
  // ground + hedge
  g += S.rect(-900, 880, 3720, 900, 0, tn.fl('#4FA142')) + S.path('M-900 930 Q960 900 2820 930 V1800 H-900 Z', tn.fl('#D6A874'));
  let hedge = '';
  for (let i = 0; i < 16; i++) hedge += `M${f(330 + i * 86 - 75)} ${f(820)}a75 70 0 1 0 1 0Z`;
  g += S.path(hedge, tn.ol('#4F9A52', 5)) + S.rect(240, 806, 1440, 110, 20, tn.ol('#4F9A52', 5));
  g += S.g(FS.lampPost(tn, 6 / BN.s, 1, BN.lampH), `translate(${BN.lamp} ${BN.floor - 40}) scale(${BN.s})`);
  g += S.ellipse(BN.x, BN.floor + 8, BN.w * BN.s * 0.62, 34, { fill: '#000', opacity: 0.16 });
  g += S.g(FS.bench(tn, 6 / BN.s, BN.w), `translate(${BN.x} ${BN.floor}) scale(${BN.s})`);
  return g;
}
// the lamp light of the night bench (screen space)
function benchLight79() {
  const gy = 1000 - 40 - (1340 + 30) * 0.58;
  return S.ellipse(300, gy, 260, 240, { fill: SEP('#FFF0B8'), opacity: 0.22 }) + S.ellipse(300, gy, 140, 130, { fill: SEP('#FFF6D8'), opacity: 0.3 }) +
    S.path(`M260 ${f(gy + 40)} L340 ${f(gy + 40)} L920 1040 L-260 1040 Z`, { fill: SEP('#FFE9A8'), opacity: 0.16 });
}
// a vintage heart (sepia, outlined) popping (k 0..1)
function heart79(x, y, k, s = 1) {
  if (k <= 0) return '';
  const sc = ease.outBack(clamp(k, 0, 1)) * s, b = 1 + 0.06 * Math.sin(k * 30);
  return S.g(S.path(K.F.heartPath(0, 0, 60), { fill: SEP('#E8453C'), stroke: LINE, 'stroke-width': 7 }) + S.ellipse(-20, -22, 12, 8, { fill: SEP('#FFFFFF'), opacity: 0.7 }), `translate(${f(x)} ${f(y)}) scale(${f(sc * b)})`);
}

module.exports = { times, SEP, sepia, TN, LOU, GMA, MIKE, draw79, film, burn, stage79, crowd79, row79, armInsert, bench79, benchLight79, heart79, LINE };
