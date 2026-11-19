// SC 08 · СОХРАНЕНИЕ ПОВРЕЖДЕНО — Friday noon, the alarm.
// The schoolyard sky floods red, the giant WARNING / SAVE FILE CORRUPTED window crt-opens, "Respawns used" rolls to 9,999 over
// the hero's shoulder. Red checkpoint flags slam into the yard and grey ghost-YOUs pour out of them, each looping one fail
// (skateboard crash, dodgeball to the face, tray slip, stairs tumble, sitting in foam); the beat: the whole town fills up
// (roofs, the bus roof, lamps, a tree). Tip: "those are your fails" (2x2 split of fails, the steps, a red "Fail saved" toast).
// Kids point and laugh, a waterfall of ghost skaters ("a HUNDRED times"), Principal Pemberton showered with spaghetti by a
// ghost ("AGAIN?!"), the town street points at the roofs, crane-out over all 9,999; the hero hides his face, "I've HAD this
// nightmare" (dream-bubble insert). The warm beat: Ivy watches one ghost fall and get back up (FELL 56 -> GOT UP 56). The world
// freezes: Dad loops "Why did the pan—", Bea loops on the trampoline, Tip's urgent warning, everything stops -> the frozen,
// red, ghost-filled town (SC 09 follows).
'use strict';

const K = require('./kit');
const R = require('./respawn');
const H = require('./sets_home');
const SS = require('./sets_school');
const X = require('../rig/extras');
const AC = require('./acting');
const E = require('./s07_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { pop, at, toScr, shakeAll, boing, breathe, scaleG, TS, TFS, ghostFail, liteCrowd } = E;
const draw = K.draw;

const A = Array.from({ length: 13 }, (_, i) => L('08.' + i));
const T0 = K.V.TL.scenes['SC 08'].start;
const END = K.V.TL.scenes['SC 09'].start;
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

// ---------------------------------------------------------------- beats
const CUT = {};
CUT.alarm = T0;
const tCorr = w(0, 'corrupted');
CUT.count = w(0, 'Respawns') - 0.12;
const tRoll0 = w(0, 'nine'), tRoll1 = w1(0, 'ninetynine');
CUT.undone = A[1].a - 0.1;
CUT.back = w(1, 'came') - 0.1;
const tCame = w(1, 'came');
CUT.flood = A[1].b + 0.2;
CUT.tip1 = A[2].a - 0.1;
CUT.all = w(2, 'All') - 0.08;
CUT.never = w(2, 'They') - 0.1;
CUT.saved = w(2, 'They', 1) - 0.1;
const tSaved = w(2, 'saved');
CUT.kid = A[3].a - 0.1;
CUT.hundred = w(3, 'HUNDRED') - 0.12;
CUT.prin = A[4].a - 0.1;
CUT.again = w(4, 'AGAIN') - 0.1;
CUT.everyone = A[5].a - 0.1;
CUT.all9999 = w(5, 'All') - 0.1;
CUT.hide = A[5].b + 0.05;
CUT.literally = w(6, 'Literally') - 0.12;
CUT.dream = w(6, 'ive') - 0.12;
CUT.ivy = A[7].a - 0.12;
CUT.only = A[8].a - 0.1;
CUT.cool = A[9].a - 0.1;
CUT.dad = A[10].a - 0.15;
CUT.bea = A[11].a - 0.1;
CUT.tip2 = A[12].a - 0.1;
CUT.frozen = w(12, 'If') - 0.1;
CUT.forever = w(12, 'FOREVER') - 0.12;
const tFreeze = w(12, 'stuck');                     // the moment the whole world stops

// ================================================================= the schoolyard, red
const SY = SS.SPOTS.schoolyard;
const sAt = (y) => 0.5 * (y - 160) / 800;
function yardR(t, cam, between = '', front = '', o = {}) {
  const Ly = SS.schoolyard.layers(o.tm ?? t, cam, { time: 'day', red: o.red ?? 1, frozen: o.frozen || 0, clock: '12:00' });
  return Ly.bg + Ly.mid + view(cam, between, 1) + Ly.pole + Ly.front + view(cam, front, 1) + Ly.fg + Ly.light;
}
// red checkpoint flags in the yard (where the ghosts pour out)
const FLAGS = [
  { x: 560, y: 905, plant: () => w(1, 'everything') }, { x: 1290, y: 880, plant: () => w(1, 'you') },
  { x: 880, y: 790, plant: () => w(1, 'had') }, { x: 1700, y: 830, plant: () => w(1, 'ever') }, { x: 220, y: 860, plant: () => w(1, 'undone') },
].map((q) => ({ ...q, s: sAt(q.y), tp: q.plant() }));
function flagsSvg(t, k = 1) {
  let o = '';
  for (const q of FLAGS) {
    const pl = seg(t, q.tp - 0.12, q.tp + 0.9);
    if (pl <= 0) continue;
    const fall = ease.in(seg(t, q.tp - 0.12, q.tp));
    o += R.flag({ x: q.x, y: t < q.tp ? lerp(q.y - 900, q.y, fall) : q.y, s: q.s * 0.9, state: 'red', t, plant: t < q.tp ? 0 : pl });
  }
  return o;
}
// the near ghosts in the yard: kind, spot, flag they pour out of
const YG = [
  { kind: 'skate', x: 380, y: 960, flip: true, fl: 0 },
  { kind: 'ball', x: 1580, y: 930, flip: true, fl: 1 },
  { kind: 'tray', x: 1820, y: 880, flip: false, fl: 3 },
  { kind: 'foam', x: 640, y: 850, flip: true, fl: 2 },
  { kind: 'trip', x: 190, y: 890, flip: true, fl: 4 },
  { kind: 'stairs', x: 1000, y: 700, flip: true, fl: 2, dx: 120, dy: 90 },
  { kind: 'ball', x: 1350, y: 800, flip: false, fl: 1 },
].map((g, i) => ({ ...g, s: sAt(g.y), born: tCame + 0.06 + i * 0.12 }));
const ARC = 0.42;
// one ghost: before it is born nothing; then it flies out of its flag on an arc; then it loops its fail
function yardGhost(t, g, o = {}) {
  if (t < g.born) return '';
  const age = t - g.born;
  const q = FLAGS[g.fl];
  if (age < ARC) {
    const u = age / ARC;
    const x = lerp(q.x, g.x, u), y = lerp(q.y, g.y, u) - Math.sin(u * Math.PI) * 260 * g.s * 2;
    let s_ = R.respawnPop({ x: q.x, y: q.y, s: g.s, age: age - 0.02, col: '#B7C1CF', part: 'all' });
    return s_ + draw.ghost({ x, y, s: g.s, alpha: 0.6, armL: 150 + 20 * Math.sin(t * 30), armR: 150 - 20 * Math.sin(t * 30), rot: (g.x > q.x ? 1 : -1) * 30 * Math.sin(u * Math.PI), face: 'scream' });
  }
  const P = E.GP[g.kind];
  const ph = -(g.born + ARC) + P * 0.02;
  return ghostFail(g.kind, t, { x: g.x, y: g.y, s: g.s, flip: g.flip, ph, freeze: o.freeze, dx: g.dx, dy: g.dy, rim: o.rim });
}
function yardGhosts(t, o = {}) {
  let back = '', front = '';
  let vx0 = -1e9, vx1 = 1e9;
  if (o.cam) { const z = o.cam.zoom ?? 1; vx0 = (o.cam.x || 0) + 960 - 960 / z - 160; vx1 = (o.cam.x || 0) + 960 + 960 / z + 160; }
  for (const [gi, g] of YG.entries()) {
    if (o.only && !o.only.includes(gi)) continue;
    if (o.ex && g.x >= o.ex[0] && g.x <= o.ex[1]) continue;
    if (g.x < vx0 || g.x > vx1) continue;
    const sv = yardGhost(t, g, o);
    if (g.y < 820) back += sv; else front += sv;
  }
  return { back, front };
}
// far ghosts on the school roof (lite crowd, born in a wave)
const ROOF = Array.from({ length: 16 }, (_, i) => ({ x: -500 + i * 190 + 60 * hash(i * 2.2), y: 238, s: 0.3, i: i + 3, born: tCame + 0.35 + 0.08 * i, kind: ['flail', 'sit', 'fall', 'tumble'][i % 4] }));
// (skipped when the camera does not see the roof line)
const roofCrowd = (t, freeze, cam) => {
  if (cam) { const z = cam.zoom ?? 1; if ((cam.y || 0) + 540 - 540 / z > 262) return ''; }
  return liteCrowd(t, ROOF, { alpha: 1, col: '#C7AEB8', freeze });
};

// laughing / pointing kids (cheap crowd)
function kidLaugh(i, t, x, y, s, o = {}) {
  const lg = o.freeze !== undefined ? o.freeze : t;
  const bob = Math.abs(Math.sin(lg * 9 + i)) * 10;
  const point = o.point ?? (i % 2 === 0);
  return draw.kid(i, { x, y, s, turn: o.turn ?? 0, bodyY: bob, armR: point ? 105 + 5 * Math.sin(lg * 6) : 40 + 30 * Math.sin(lg * 12 + i), armL: point ? 20 : 40 + 30 * Math.sin(lg * 12 + i + 1), lean: 3 * Math.sin(lg * 9 + i), face: o.face || { name: 'joy' }, shade: true, shadow: true, volume: false, ...(o.pose || {}) });
}

// ================================================================= 1. THE ALARM
function skyWindow(t, x, y, wd, ht, k, roll, o = {}) {
  const n = roll === undefined ? null : Math.round(lerp(0, 9999, ease.out(clamp(roll, 0, 1))));
  const lines = ['SAVE FILE CORRUPTED'];
  if (n !== null) lines.push('Respawns used: ' + n.toLocaleString('en-US'));
  const spike = (hash(Math.floor(t * 9)) > 0.92 ? 0.18 : 0) + (o.glitch || 0);
  return R.sysWindow({ x, y, w: wd, h: ht, k, open: 'crt', t, theme: 'red', title: 'WARNING', lines, small: n !== null ? 'Too many respawns. The world may lag.' : '', glitch: 0.02 + spike });
}
function shAlarm(t) {
  const tW = w(0, 'Warning');
  const redK = ease.out(seg(t, tW - 0.06, tW + 0.9));
  const cam = shakeAll(camKeys(t, [[T0, { x: 80, y: 40, zoom: 1.05 }], [T0 + 0.35, { x: 80, y: 30, zoom: 1.04 }], [tCorr, SY.cams.red], [CUT.count, { ...SY.cams.red, zoom: 0.62 }]]), t, [[tW - 0.04, 0.5, 14], [tCorr + 0.1, 0.4, 10]]);
  const look = t > tW + 0.1;
  let ch = '';
  const kids = [[3, 760, 930], [7, 1330, 950], [11, 1560, 900], [2, 600, 860], [9, 1820, 920]];
  for (const [i, x, y] of kids) ch += draw.kid(i, { x, y, s: sAt(y), volume: false, turn: (x - 1040) / 1400, lift: look ? 14 * bump(t, tW + 0.12 + i * 0.03, tW + 0.45) : 0, face: { name: look ? 'shocked' : 'happy', eyes: { look: [0, look ? -1 : 0] } }, armL: look ? 30 : 10, armR: look ? 30 : 10, ...breathe(t, i) });
  ch += actor('you', t, { ...SY.walk, backpack: true, turn: 0.1, armL: look ? 40 : 10, armR: look ? 40 : 10, face: { name: look ? 'scared' : 'happy', eyes: { look: [0, look ? -1 : 0] } }, lift: look ? 20 * bump(t, tW + 0.1, tW + 0.42) : 0 });
  let o = yardR(t, cam, '', ch, { red: redK });
  // the sky window (screen space, the empty sky above the school)
  const kw = seg(t, tCorr - 0.12, tCorr + 0.5);
  o += skyWindow(t, 960, 250, 1080, 400, kw);
  o += E.redPulse(t, redK, 9);
  // siren light sweeps
  if (redK > 0) o += S.path(`M960 -40 L${f(960 + 1400 * Math.cos(t * 4))} 1200 L${f(960 + 1400 * Math.cos(t * 4 + 0.5))} 1200 Z`, { fill: '#FF3B4E', opacity: f(0.1 * redK) });
  o += E.smash(t, T0, 0.3, 0.6, '#FF2E3E');
  return o;
}
// ---- over the hero's shoulder: the counter rolls to 9,999
function shCount(t) {
  const roll = seg(t, tRoll0, tRoll1);
  const tHit = tRoll1 - 0.05;
  const cam = shakeAll(camKeys(t, [[CUT.count, { ...SY.cams.red, zoom: 0.66, y: -260 }], [CUT.undone, { ...SY.cams.red, zoom: 0.72, y: -290 }]]), t, [[tHit, 0.5, 18]]);
  let o = yardR(t, cam, roofCrowd(t, undefined, cam), '');
  const zw = 1 + 0.06 * bump(t, tHit, tHit + 0.35);
  o += scaleG(skyWindow(t, 960, 300, 1320, 480, 1, roll, { glitch: 0.25 * bump(t, tHit, tHit + 0.25) }), zw, 960, 300);
  // the hero from behind (near camera), looking up at it
  o += actor('you', t, { x: 470, y: 1330, s: 0.72, volume: false, view: 'back', backpack: true, headRot: -4, armL: 18, armR: 22, lift: 20 * bump(t, tHit, tHit + 0.3), ...breathe(t) });
  o += draw.kid(5, { x: 1500, y: 1330, s: 0.6, view: 'back', volume: false, armL: 10, armR: 12, ...breathe(t, 1) });
  o += E.redPulse(t, 1, 9);
  o += E.smash(t, tHit, 0.14, 0.45, '#FF5A6A');
  return o;
}

// ================================================================= 2. EVERYTHING YOU UNDID CAME BACK
function shUndone(t) {
  const cam = camKeys(t, [[CUT.undone, { x: 80, y: -30, zoom: 0.95 }], [CUT.back, { x: 60, y: -10, zoom: 1.0 }]]);
  let fl = flagsSvg(t);
  let ch = actor('you', t, { ...SY.walk, backpack: true, turn: 0.2 * Math.sin(t * 1.3), ...breathe(t), face: { name: 'scared', eyes: { look: [Math.sin(t * 1.3), 0.2] } } });
  let o = yardR(t, shakeAll(cam, t, FLAGS.map((q) => [q.tp, 0.2, 8])), '', fl + ch);
  return o + E.redPulse(t, 1);
}
function shBack(t) {
  const cam = shakeAll(camKeys(t, [[CUT.back, { x: 60, y: -10, zoom: 1.0 }], [CUT.flood, { x: 60, y: -60, zoom: 0.88 }]]), t, [[tCame, 0.6, 16]]);
  const G = yardGhosts(t, { cam });
  let ch = actor('you', t, { ...SY.walk, backpack: true, armL: 130, armR: 130, lift: 30 * bump(t, tCame, tCame + 0.4), face: 'scream', ...boing(t, tCame + 0.4, 0.2) });
  let o = yardR(t, cam, roofCrowd(t, undefined, cam), flagsSvg(t) + G.back + ch + G.front);
  o += E.redPulse(t, 1) + E.zoomLines(960, 600, 0.7 * bump(t, tCame, tCame + 0.6), t, '#FFD0D6');
  return o;
}
// ---- the beat: the whole town fills up with ghosts
const TS_ = H.SPOTS.town;
function townGhosts(t, cam, o = {}) {
  const t0 = o.born ?? CUT.flood;
  const fz = o.freeze;
  const rows = { 0.25: [], 0.42: [], 0.68: [], 1: [] };
  let n = 0;
  const add = (k, a, j = 0) => { rows[k].push({ ...a, i: n, born: o.noBorn ? undefined : t0 + 0.05 + 1.2 * hash(n * 1.37) * (o.spread ?? 1) }); n++; };
  for (const a of TS_.roofs) {
    const cnt = a.row === 'houses' ? 2 : a.row === 'shops' ? 3 : 2;
    for (let j = 0; j < cnt; j++) add(a.k, { x: a.x + (j - (cnt - 1) / 2) * (a.row === 'shops' ? 80 : 70), y: a.y, s: a.s }, j);
  }
  for (const a of TS_.lamps) add(1, { x: a.x, y: a.y + 4, s: a.s, kind: 'flail' });
  for (const a of TS_.trees.slice(0, 4)) add(1, { x: a.x + 30, y: a.y + 70, s: a.s, kind: 'sit' });
  for (let j = 0; j < 4; j++) add(1, { x: TS_.busRoof.x0 + 60 + j * 110, y: TS_.busRoof.y, s: TS_.busRoof.s, kind: ['flail', 'fall', 'tumble', 'sit'][j] });
  if (!o.noStreet) for (let x = -700; x < 2700; x += 340) add(0.68, { x: x + 80 * hash(x), y: TS_.street[1].y, s: TS_.street[1].s });
  for (let x = -600; x < 2600; x += o.noStreet ? 600 : 360) add(0.42, { x: x + 90 * hash(x * 2), y: TS_.street[2].y, s: TS_.street[2].s });
  let out = '';
  // far rows: opaque lites in a dusty ghost-pink (cheap: no group opacity); near rows: translucent
  for (const k of [0.25, 0.42, 0.68, 1]) {
    if (!rows[k].length) continue;
    const far = k < 0.9;
    out += view(cam, liteCrowd(t, rows[k], far ? { alpha: 1, col: '#C7AEB8', freeze: fz } : { alpha: 0.62, freeze: fz }), k);
  }
  return out;
}
// pop flashes for the visible born ghosts (a few, near ones only)
function townPops(t, cam, t0) {
  let o = '';
  for (let j = 0; j < 8; j++) {
    const a = j < 4 ? TS_.lamps[j % TS_.lamps.length] : { x: TS_.busRoof.x0 + 60 + (j - 4) * 110, y: TS_.busRoof.y, s: TS_.busRoof.s, k: 1 };
    const tb = t0 + 0.05 + 1.2 * hash((j < 4 ? 0 : 0) + j * 0.77);
    o += view(cam, R.ghostPop({ x: a.x, y: a.y, s: a.s, age: t - tb, seed: j }), a.k ?? 1);
  }
  return o;
}
function town(t, cam, o = {}) {
  const Lt = H.town.layers(o.tm ?? t, cam, { time: 'day', red: 1, frozen: o.frozen || 0, freezeAt: o.freezeAt, bus: 1560 });
  return Lt.bg + Lt.mid + (o.between || '') + townGhosts(t, cam, o) + (o.front || '') + Lt.fg + Lt.light;
}
function shFlood(t) {
  const cam = camKeys(t, [[CUT.flood, { zoom: 0.78, x: 40, y: 40 }], [CUT.tip1, { zoom: 0.7, x: 40, y: 20 }]]);
  let o = town(t, cam, { born: CUT.flood - 0.1 });
  o += townPops(t, cam, CUT.flood - 0.1);
  o += skyWindow(t, 960, 200, 900, 330, 1);
  return o + E.redPulse(t, 1);
}

// ================================================================= 3. "THOSE ARE YOUR FAILS"
function shTip1(t) {
  const cam = camKeys(t, [[CUT.tip1, at(1000, 660, 1.25)], [CUT.all, at(1010, 650, 1.32)]]);
  const G = yardGhosts(t, { only: [0, 1, 3], cam, rim: false });
  let ch = actor('you', t, { x: 1080, y: 960, s: 0.5, backpack: true, turn: -0.3, ...breathe(t), face: { name: 'scared', eyes: { look: [-0.6, -0.3] } } });
  let o = yardR(t, cam, roofCrowd(t, undefined, cam), G.back + ch + G.front);
  const [tx, ty] = toScr(cam, 1300, 430);
  o += R.tip({ x: tx, y: ty, s: 1.25, t, glitch: 0.45 + 0.4 * bump(t, A[2].a, A[2].a + 0.4), look: [-0.8, 0.3], mood: 'worried' });
  return o + E.redPulse(t, 1);
}
// ---- "All of them." — 2x2 split of fails
const PANEL_TAG = { stairs: 'FAIL #2,113', foam: 'FAIL #3,412', ball: 'FAIL #988', tray: 'FAIL #5,067' };
function panel(t, kind, flip, bgCol, seed) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: bgCol });
  for (let i = 0; i < 9; i++) o += S.rect(hash(i * 3 + seed) * 1920, hash(i * 5 + seed) * 700, 70, 70, 0, { fill: '#FF4A5E', opacity: 0.22 });
  o += S.rect(0, 900, 1920, 180, 0, { fill: '#4A121E' }) + S.path('M0 900 H1920', ln(8));
  if (kind === 'stairs') {
    for (let i = 0; i < 5; i++) o += S.rect(-200 + i * 260, 300 + i * 120, 2400, 130, 6, ol('#B88890', 7));
    o += ghostFail('stairs', t, { x: 520, y: 330, s: 0.78, flip: true, dx: 900, dy: 470, ph: seed });
  } else o += ghostFail(kind, t, { x: kind === 'tray' ? 1200 : 960, y: 960, s: 0.8, flip, ph: seed });
  o += S.rect(60, 50, 520, 110, 55, { fill: '#2A0810', stroke: '#FF3B4E', 'stroke-width': 8 }) + TF(PANEL_TAG[kind], 320, 128, 64, '#FFFFFF');
  return o;
}
function shAll(t) {
  const marks = [w(2, 'All'), w(2, 'of'), w(2, 'them')];
  const P = [['stairs', true, '#8A2232', 0.3], ['foam', false, '#7A1E30', 1.1], ['ball', true, '#922634', 0.6], ['tray', false, '#82202E', 1.7]];
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#120408' });
  P.forEach(([kind, flip, col, sd], i) => {
    const tp = i === 0 ? CUT.all : marks[Math.min(2, i - 1)] + (i === 3 ? 0.18 : 0);
    const k = ease.outBack(seg(t, tp, tp + 0.25));
    if (k <= 0.01) return;
    const x = (i % 2) * 960, y = Math.floor(i / 2) * 540;
    const id = S.uid('s08p');
    const inner = S.g(panel(t, kind, flip, col, sd), `translate(${x} ${y}) scale(0.5)`);
    o += S.g(S.clipDef(id, S.rect(x + 8, y + 8, 944, 524, 14)) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.rect(x + 8, y + 8, 944, 524, 14, { fill: 'none', stroke: '#FF3B4E', 'stroke-width': 6 }), `translate(${x + 480} ${y + 270}) scale(${f(k)}) translate(${-x - 480} ${-y - 270})`);
  });
  o += E.redPulse(t, 0.8);
  return o;
}
// ---- "They never went away." — the entrance steps, a ghost tumbles down again and again
function shNever(t) {
  const cam = camKeys(t, [[CUT.never, at(1020, 700, 1.35)], [CUT.saved, at(1030, 690, 1.55)]]);
  let back = ghostFail('stairs', t, { x: 1000, y: 692, s: 0.36, flip: true, dx: 90, dy: 150, ph: 0.4 });
  let front = ghostFail('foam', t, { x: 700, y: 900, s: sAt(900), flip: true, ph: 0.2 }) + ghostFail('ball', t, { x: 1380, y: 930, s: sAt(930), flip: true, ph: 0.9 });
  let o = yardR(t, cam, roofCrowd(t, undefined, cam), back + front);
  return o + E.redPulse(t, 1);
}
// ---- "They were just... saved." — Tip close, the red "Fail saved" toast
function shSaved(t) {
  const cam = camKeys(t, [[CUT.saved, at(1100, 560, 1.8)], [CUT.kid, at(1110, 560, 1.95)]]);
  const G = yardGhosts(t, { ex: [850, 1450], cam, rim: false });
  let ch = actor('you', t, { x: 1000, y: 960, s: 0.5, volume: false, backpack: true, turn: 0.4, ...breathe(t), face: { name: 'scared', eyes: { look: [0.8, -0.4] } } });
  let o = yardR(t, cam, roofCrowd(t, undefined, cam), G.back + ch + G.front);
  const [tx, ty] = toScr(cam, 1250, 470);
  const gl = 0.5 + 0.5 * bump(t, tSaved - 0.1, tSaved + 0.4);
  o += R.tip({ x: tx, y: ty, s: 1.7, t, glitch: gl, look: [-0.6, 0.2], mood: 'sad' });
  o += E.redToast(960, 170, seg(t, tSaved - 0.05, tSaved + 0.35), 'Fail saved  x9,999', { t });
  return o + E.redPulse(t, 1);
}

// ================================================================= 4. EVERYONE SEES
// ---- the skate area: kids point and laugh at the ghost skaters
const SK = SY.ramp;
function skaters(t, freeze, noBail) {
  let o = '';
  o += ghostFail('skate', t, { x: 3560, y: 968, s: 0.5, flip: true, ph: 0.2, freeze });
  o += ghostFail('skate', t, { x: 4000, y: 968, s: 0.5, flip: false, ph: 1.3, freeze });
  // ghosts launching off the quarter-pipe lip and bailing
  for (let j = 0; j < (noBail ? 0 : 3); j++) {
    const P = 1.5, u = E.mod(((freeze ?? t) + j * 0.5) / P, 1);
    const x = lerp(SK.lip.x - 20, SK.landing.x + 120 + j * 60, u), y = lerp(SK.lip.y, SK.landing.y, u) - Math.sin(u * Math.PI) * 330;
    o += draw.ghost({ x, y, s: 0.48, alpha: 0.55, view: 'side', rot: -200 * u - 30, legL: 60, legR: 30, kneeL: 40, armL: 150, armR: 110, face: 'scream' });
    o += R.tint(X.skateboard(x - 60, y + 120, 0.48, 400 * u, { flipK: (u * 2) % 1 }), 'ghost', 0.5);
  }
  return o;
}
function shKid(t) {
  const cam = camKeys(t, [[CUT.kid, at(3780, 640, 1.02)], [CUT.hundred, at(3820, 620, 1.1)]]);
  let back = '';
  SY.crowd.forEach((c, i) => { back += kidLaugh(i + 1, t, c.x, c.y, c.s, { turn: 0.3, point: i % 3 !== 1 }); });
  let speaker = actor('kid', t, { i: 4, x: 3300, y: 990, s: 0.52, turn: 0.45, armR: 108, armL: 20, volume: false, ...breathe(t) }, { arms: false });
  let o = yardR(t, cam, back, skaters(t) + speaker);
  o += E.redPulse(t, 1);
  return o;
}
// ---- "a HUNDRED times": a waterfall of ghost skaters off the lip
function shHundred(t) {
  const tH = w(3, 'HUNDRED');
  const cam = shakeAll(camKeys(t, [[CUT.hundred, at(4400, 640, 1.45)], [tH + 0.12, at(4340, 600, 1.2)], [CUT.prin, at(4330, 590, 1.12)]]), t, [[tH, 0.3, 14]]);
  let fall = [];
  let boards = '';
  for (let j = 0; j < 6; j++) {
    const P = 1.5, u = E.mod((t + j * 0.25) / P, 1);
    const x = lerp(SK.lip.x - 30, SK.landing.x - 200 + 150 * hash(j), u), y = lerp(SK.lip.y - 20, SK.landing.y, u) - Math.sin(u * Math.PI) * (180 + 120 * hash(j));
    fall.push({ x, y, s: 0.46, view: 'side', rot: -360 * u, legL: 60, legR: 30, kneeL: 30, armL: 150, armR: 100 });
    boards += X.skateboard(x + 120, y - 60 + 140 * u, 0.46, 500 * u + j * 40, { flipK: (u * 2.5) % 1 });
  }
  let o = yardR(t, cam, '', R.tint(boards, 'ghost', 0.45) + draw.ghostCrowd(fall, { alpha: 0.66 }) + skaters(t, undefined, true));
  o += R.counterHUD({ x: 1860, y: 84, anchor: 'right', k: pop(t, tH - 0.05, 0.3), t, label: 'SKATE FAILS:', value: 100, roll: seg(t, tH - 0.05, tH + 0.6), from: 1, theme: 'red', icon: 'retry', bump: seg(t, tH + 0.6, tH + 1.05) });
  o += E.zoomLines(960, 500, bump(t, tH, tH + 0.5), t, '#FFD0D6');
  return o + E.redPulse(t, 1);
}
// ---- Principal Pemberton showered with spaghetti (by the entrance)
const PEM = { x: 1250, y: 940, s: 0.5 };
const SPAG = { P: 1.8 };
const spagHits = () => [w(4, 'spaghetti') - 0.1, w(4, 'AGAIN') - 0.05];
function spagThrow(t) {
  // the ghost walks in, slips on the tray, the spaghetti arcs onto her head; synced so the hits land on the words
  const hits = spagHits();
  let k = 0;
  while (k + 1 < hits.length && t > hits[k] + 0.6) k++;
  const tHit = hits[k];
  const u = (t - (tHit - 1.1)) / 1.7;               // 0 .. 1 over one throw (hit at u ≈ 0.65)
  return { tHit, u, k };
}
function principal(t, hitsSoFar, pose = {}) {
  const lvl = clamp(hitsSoFar * 0.5, 0, 1);
  return actor('principal', t, { ...PEM, turn: -0.35, spaghetti: lvl, ...pose });
}
function spagScene(t, cam, o2 = {}) {
  const hits = spagHits();
  const done = hits.filter((h) => t >= h).length;
  const { tHit, u } = spagThrow(t);
  let front = '';
  // the ghost: walks from the left with the tray, slips at x 900
  const gs = 0.5, gx0 = 420, gx1 = 900;
  if (u < 0.45) {
    const e = clamp(u / 0.45, 0, 1);
    const gx = lerp(gx0, gx1, e);
    front += draw.ghost({ x: gx, y: 950, s: gs, alpha: 0.6, view: 'side', flip: true, ...AC.walk(t * 9), armL: 80, armR: 74, face: 'happy' });
    front += R.tint(X.lunchTray({ x: gx + 250 * gs, y: 950 - 470 * gs, s: gs * 0.95, spaghetti: 1 }), 'ghost', 0.65);
  } else {
    const ua = seg(u, 0.45, 0.62), ug = seg(u, 0.85, 1);
    const rot = 84 * ease.out(ua);
    front += draw.ghost({ x: gx1 + 40, y: 950 - Math.sin(ua * Math.PI) * 60 + 235 * gs * Math.sin((rot * Math.PI) / 180), s: gs, alpha: 0.6 * (1 - ug), view: 'side', flip: true, rot, legL: 110, legR: 70, armL: 160, armR: 130, face: 'scream' });
  }
  // the flying spaghetti clump: from the tray to her head
  const head = [PEM.x - 20, PEM.y - 1173 * PEM.s * 0.86];
  const fa = seg(t, tHit - 0.45, tHit);
  if (fa > 0 && fa < 1) {
    const x = lerp(gx1 + 130, head[0], fa), y = lerp(950 - 240, head[1], fa) - Math.sin(fa * Math.PI) * 260;
    front += X.spaghetti({ x, y, s: 0.6, mode: 'fly', k: fa, t, seed: 4, rot: fa * 200 });
  }
  const hitAge = t - tHit;
  let pem = principal(t, done, { armL: hitAge > 0 && hitAge < 2 ? 140 : 20, armR: hitAge > 0 && hitAge < 2 ? 150 : 24, lift: hitAge > 0 ? 18 * bump(hitAge, 0, 0.3) : 0, face: hitAge > 0 ? 'angry' : { name: 'neutral', eyes: { look: [-1, 0] } } });
  if (hitAge > 0 && hitAge < 0.5) front += X.spaghetti({ x: head[0], y: head[1] + 40, s: 0.6, mode: 'splat', seed: 6 });
  let o = yardR(t, cam, roofCrowd(t, undefined, cam) + (o2.back || ''), front + pem + (o2.front || ''));
  return o;
}
function shPrin(t) {
  const cam = camKeys(t, [[CUT.prin, at(1060, 640, 1.2)], [CUT.again, at(1100, 620, 1.3)]]);
  let kids = kidLaugh(6, t, 1650, 860, sAt(860), { turn: -0.5 }) + kidLaugh(9, t, 1780, 900, sAt(900), { turn: -0.6, point: false });
  let o = spagScene(t, cam, { back: kids });
  const [h0] = spagHits();
  const [sx, sy] = toScr(cam, PEM.x + 120, PEM.y - 620);
  o += K.bang('SPLAT!', sx + 140, sy - 100, pop(t, h0, 0.18) * (1 - seg(t, h0 + 0.6, h0 + 0.8)), 90, 8, '#FFC86B');
  return o + E.redPulse(t, 1);
}
function shAgain(t) {
  const [, h1] = spagHits();
  const cam = shakeAll(camKeys(t, [[CUT.again, at(PEM.x - 40, PEM.y - 640 * PEM.s * 1.1, 2.2)], [CUT.everyone, at(PEM.x - 40, PEM.y - 650 * PEM.s * 1.1, 2.5)]]), t, [[h1, 0.35, 18]]);
  let o = spagScene(t, cam);
  o += E.zoomLines(960, 480, bump(t, h1, h1 + 0.5), t, '#FFE2A8');
  o += E.smash(t, h1, 0.1, 0.4);
  return o + E.redPulse(t, 1);
}

// ---- the town: everyone points at the roofs
function townFolk(t, freeze, few) {
  const tt = freeze ?? t;
  let o = '';
  let P = [[-200, 0, 'adult', 3], [120, 1, 'kid', 8], [420, 0, 'adult', 6], [700, 1, 'kid', 12], [980, 0, 'adult', 9], [1300, 1, 'kid', 2], [1900, 0, 'adult', 1], [2200, 1, 'kid', 14]];
  if (few) P = P.filter((_, j) => j % 2 === 0);
  for (const [x, kid, kind, i] of P) {
    const y = 990, s = kind === 'kid' ? 0.26 : 0.24;
    const pose = { x, y, s, volume: false, shade: true, shadow: true, turn: 0.2 * Math.sin(i), armR: 140 + 10 * Math.sin(tt * 5 + i), armL: i % 3 === 0 ? 120 : 15, face: { name: i % 2 ? 'joy' : 'shocked', eyes: { look: [0.2, -1] } }, bodyY: kid ? Math.abs(Math.sin(tt * 8 + i)) * 8 : 0 };
    o += kind === 'kid' ? draw.kid(i, pose) : draw.adult(i, pose);
  }
  // a mom filming it with her phone
  o += draw.adult(11, { x: 1640, y: 990, s: 0.24, volume: false, turn: -0.2, armR: 150, armL: 10, face: { name: 'amazed', eyes: { look: [0, -1] } }, props: [{ svg: X.phone({ x: 100 + 250 * Math.sin((150 * Math.PI) / 180) + 22, y: -515 + 250 * Math.cos((150 * Math.PI) / 180) - 40, s: 0.7, face: 'back', rec: true, t: tt }), layer: 'front' }] });
  return o;
}
function shEveryone(t) {
  const cam = camKeys(t, [[CUT.everyone, { zoom: 1.5, x: -60, y: 150 }], [CUT.all9999, { zoom: 1.55, x: 400, y: 120 }]]);
  let o = town(t, cam, { noBorn: true, noStreet: true, front: view(cam, townFolk(t), 1) });
  return o + E.redPulse(t, 1);
}
function shAll9999(t) {
  const tN = w1(5, 'ninetynine');
  const cam = shakeAll(camKeys(t, [[CUT.all9999, { zoom: 1.2, x: 300, y: 120 }], [tN, { zoom: 0.66, x: 40, y: 10 }], [CUT.hide, { zoom: 0.64, x: 40, y: 0 }]], ease.inOut), t, [[tN, 0.4, 12]]);
  let o = town(t, cam, { noBorn: true, front: view(cam, townFolk(t, undefined, true), 1) });
  o += R.counterHUD({ x: 960, y: 90, anchor: 'center', k: pop(t, w(5, 'nine') - 0.1, 0.3), t, label: 'FAILS ON DISPLAY:', value: 9999, roll: seg(t, w(5, 'nine'), tN), from: 0, theme: 'red', bump: seg(t, tN, tN + 0.45), size: 70 });
  return o + E.redPulse(t, 1);
}

// ================================================================= 5. THE HERO HIDES
function shHide(t) {
  const cam = camKeys(t, [[CUT.hide, at(1040, 700, 1.3)], [CUT.literally, at(1040, 700, 1.55)]]);
  const G = yardGhosts(t, { only: [1, 3], cam, rim: false });
  let around = '';
  const K_ = [[1, 640, 900, 0.5], [6, 1420, 920, -0.5], [10, 1640, 860, -0.6]];
  for (const [i, x, y, tn] of K_) around += kidLaugh(i, t, x, y, sAt(y), { turn: tn, point: i % 2 === 1 });
  let hero = actor('you', t, { x: 1040, y: 960, s: 0.5, view: 'side', backpack: true, armL: 128, armR: 118, headRot: 20, lean: 10, legL: 20, legR: 10, kneeL: 40, kneeR: 50, bodyY: 40 + 4 * Math.sin(t * 14), face: { name: 'crying' } });
  let o = yardR(t, cam, roofCrowd(t, undefined, cam), G.back + around + hero + G.front);
  return o + E.redPulse(t, 1);
}
function shLiterally(t) {
  const cam = at(1050, 600, 2.1);
  const G = yardGhosts(t, { ex: [800, 1400], cam, rim: false });
  const peek = ease.inOut(seg(t, CUT.literally, CUT.literally + 0.35));
  let hero = actor('you', t, { x: 1040, y: 960, s: 0.5, volume: false, turn: 0.15, backpack: true, armL: lerp(128, 60, peek), armR: lerp(118, 40, peek), headRot: lerp(12, 0, peek), face: { name: 'deadpan', eyes: { look: [0, 0] }, fx: ['sweat'] } }, { arms: false });
  let o = yardR(t, cam, '', G.back + hero + G.front);
  return o + E.redPulse(t, 1) + E.edgeDark(0.3);
}
// ---- "I've HAD this nightmare." — the night insert with a dream bubble
function shDream(t) {
  const RM = H.SPOTS.heroRoom;
  const cam = camKeys(t, [[CUT.dream, at(560, 560, 1.3)], [CUT.ivy, at(580, 560, 1.38)]]);
  const Lr = H.heroRoom.layers(t, { time: 'night', sleep: true, clock: '3:00', lights: 0.6 });
  const toss = Math.sin(t * 9) * 4;
  let sleeper = actor('you', t, { ...RM.bed.lie, rot: -90 + toss, face: { name: 'scared', eyes: { type: 'closed' }, fx: ['sweat', 'sweat2'] } });
  let o = view(cam, Lr.bg, 0.85) + view(cam, Lr.mid + sleeper + Lr.front + Lr.light, 1);
  // the dream: red sky, ghosts, a pointing kid
  let dream = S.rect(-500, -300, 1000, 600, 0, { fill: '#8A1424' });
  for (let i = 0; i < 5; i++) dream += S.rect(-480 + i * 210, -260 + 40 * hash(i), 160, 120, 0, { fill: '#B01E34', opacity: 0.6 });
  const crowd = [];
  for (let i = 0; i < 12; i++) crowd.push(E.litePose(E.LITE_KINDS[i % 8], t, { x: -420 + i * 78, y: 140 + (i % 2) * 40, s: 0.18 }, i));
  dream += draw.ghostCrowd(crowd, { alpha: 0.7 });
  dream += draw.kid(4, { x: 300, y: 300, s: 0.3, armR: 110, face: 'joy', volume: false });
  const [hx, hy] = toScr(cam, 200, 820);
  o += E.dreamBubble(1240, 360, 1000, 560, seg(t, CUT.dream + 0.05, CUT.dream + 0.4), dream, hx + 120, hy - 120);
  return o;
}

// ================================================================= 6. IVY (the warm beat)
const IV = { x: 3250, y: 965, s: 0.5 };
const HERO_IV = { x: 2960, y: 960, s: 0.5 };
const GH_IV = { x: 3700, y: 968, s: 0.5 };
function warmGlow(cx, cy, k) {
  if (k <= 0) return '';
  let o = '';
  for (let i = 0; i < 4; i++) o += S.ellipse(cx, cy, 520 - i * 100, 380 - i * 70, { fill: '#FFC98A', opacity: f(0.06 * k) });
  return o;
}
function ivyScene(t, cam, o2 = {}) {
  const g = ghostFail('skate', t, { ...GH_IV, flip: true, ph: 0.6 });
  let back = '';
  SY.crowd.slice(4).forEach((c, i) => { back += kidLaugh(i + 9, t, c.x + 200, c.y, c.s, { turn: 0.3, point: i % 2 === 0, face: { name: 'neutral' } }); });
  let ivy = actor('ivy', t, { ...IV, turn: 0.5, book: true, ...breathe(t, 1), ...(o2.ivy || {}) });
  let hero = actor('you', t, { ...HERO_IV, backpack: true, turn: 0.4, ...breathe(t), ...(o2.hero || {}) });
  let o = yardR(t, cam, back, warmGlow(IV.x - 120, 700, o2.warm ?? 1) + g + hero + ivy);
  return o;
}
function shIvy(t) {
  const f1 = w(7, 'fiftysix'), f2 = w(7, 'fiftysix', 1);
  const cam = camKeys(t, [[CUT.ivy, at(3380, 640, 1.15)], [CUT.only, at(3400, 640, 1.28)]]);
  let o = ivyScene(t, cam, { ivy: { face: t > A[7].a ? undefined : { name: 'amazed', eyes: { look: [1, 0] } } }, hero: { face: { name: 'sad', eyes: { look: [1, 0.2] } } } });
  const [gx, gy] = toScr(cam, GH_IV.x + 100, GH_IV.y - 640);
  const up = t >= f2 - 0.05;
  o += R.counterHUD({ x: gx, y: gy - 60, anchor: 'center', k: pop(t, f1 - 0.05, 0.3), t, label: up ? 'GOT UP:' : 'FELL:', value: 56, theme: up ? 'green' : 'red', icon: up ? 'check' : 'warn', bump: up ? seg(t, f2, f2 + 0.45) : seg(t, f1, f1 + 0.45), s: 0.85 });
  if (up) o += K.sparkles([[gx - 230, gy - 90, 28], [gx + 230, gy - 40, 24]], t);
  return o + E.redPulse(t, 0.5);
}
function shOnly(t) {
  const cam = camKeys(t, [[CUT.only, at(3060, 600, 1.75)], [CUT.cool, at(3050, 610, 1.85)]]);
  let o = ivyScene(t, cam, { hero: { volume: false, turn: 0.2, headRot: 10, armL: 10, armR: 10, face: { name: 'sad', eyes: { look: [0.3, 0.8] } } }, ivy: { volume: false, face: { name: 'neutral', eyes: { look: [-1, 0.1] } } } });
  return o + E.redPulse(t, 0.4) + E.edgeDark(0.25);
}
function shCool(t) {
  const tS = w(9, 'Still'), tC = w(9, 'cool');
  const cam = camKeys(t, [[CUT.cool, at(3220, 560, 1.9)], [tC, at(3200, 560, 2.05)], [CUT.dad, at(3200, 560, 2.1)]]);
  const smile = t > tS;
  let o = ivyScene(t, cam, { warm: 1 + 0.6 * seg(t, tS, tC), hero: { volume: false, face: { name: t > tC + 0.2 ? 'happy' : 'sad', mouth: t > tC + 0.2 ? 'smallSmile' : undefined, eyes: { look: [1, 0] } } }, ivy: { volume: false, turn: 0.2, face: smile ? undefined : { name: 'neutral' } } });
  if (t > tC) o += K.sparkles([[760, 360, 30 * pop(t, tC, 0.3)], [1240, 300, 24 * pop(t, tC + 0.1, 0.3)], [1380, 520, 18 * pop(t, tC + 0.2, 0.3)]], t);
  return o + E.redPulse(t, 0.3);
}

// ================================================================= 7. THE WORLD FREEZES
const SR = H.SPOTS.street;
const DAD = { x: 1120, y: 838, s: 0.32 };
function street(t, cam, between = '', o = {}) {
  const Ls = H.street.layers(o.tm ?? t, cam, { time: 'day', red: 1, frozen: o.frozen ?? 0.4, freezeAt: o.freezeAt });
  return Ls.bg + Ls.mid + view(cam, between, 1) + Ls.fg + Ls.light;
}
// the house's roof + yard get some ghosts too
const STREET_G = [{ x: 760, y: 236, s: 0.22, i: 1, kind: 'flail' }, { x: 960, y: 210, s: 0.22, i: 2, kind: 'sit' }, { x: 1180, y: 300, s: 0.22, i: 3, kind: 'fall' }, { x: 2050, y: 520, s: 0.22, i: 4, kind: 'tumble' }];
function shDad(t) {
  const whys = [w(10, 'Why'), w(10, 'Why', 1), w(10, 'Why', 2)];
  let k = 0;
  while (k + 1 < whys.length && t >= whys[k + 1] - 0.02) k++;
  const tl = t - whys[k];                                     // the same loop every time
  const reset = t >= whys[1] - 0.02 && tl < 0.08;
  const cam = camKeys(t, [[CUT.dad, at(DAD.x, 620, 2.0)], [CUT.bea, at(DAD.x, 620, 2.0)]]);
  const raise = ease.out(seg(tl, -0.1, 0.4));
  const stuck = tl > 0.95;
  let dad = actor('dad', t, { ...DAD, spatula: true, pancake: true, turn: 0.15, armR: lerp(30, 120, raise), armL: 20 + 30 * raise, lean: -4 * raise, headRot: 4 * Math.sin(tl * 8), face: { name: stuck ? 'scared' : 'happy', eyes: { look: [0, 0] } } }, { arms: false });
  if (stuck || reset) dad = R.rgbSplit(dad, 1, { t, dx: 10 });
  let o = street(t, cam, liteCrowd(t, STREET_G, { alpha: 0.6 }) + dad);
  const [lx, ly] = toScr(cam, DAD.x + 220, DAD.y - 460);
  o += R.counterHUD({ x: 1860, y: 84, anchor: 'right', k: pop(t, whys[1] - 0.05, 0.3), t, label: 'LOOP', value: k + 1, theme: 'grey', icon: 'retry', bump: seg(t, whys[k], whys[k] + 0.4) });
  if (stuck) o += E.loadRing(lx, ly, 26, t, '#FFFFFF', 1);
  o += E.glitchHit(t, whys[1] - 0.02, 0.12, 3) + E.glitchHit(t, whys[2] - 0.02, 0.12, 4);
  return o + E.redPulse(t, 0.8);
}
function shBea(t) {
  const helps = [w(11, 'Help'), w(11, 'Help', 1), w(11, 'Help', 2)];
  let k = 0;
  while (k + 1 < helps.length && t >= helps[k + 1] - 0.08) k++;
  const tl = t - (helps[k] - 0.08);
  const TR = SR.trampoline;
  const cam = camKeys(t, [[CUT.bea, at(TR.x, 610, 2.9)], [CUT.tip2, at(TR.x, 600, 3.0)]]);
  const hop = Math.sin(clamp(tl / 0.55, 0, 1) * Math.PI);
  const bea = actor('bea', t, { x: TR.x, y: TR.y - hop * 120, s: TR.s, t, armL: 150 + 20 * Math.sin(t * 20), armR: 150 - 20 * Math.sin(t * 20), sy: tl < 0.06 ? 0.85 : 1, sx: tl < 0.06 ? 1.12 : 1, face: 'scream' }, { arms: false });
  let o = street(t, cam, bea);
  o += R.counterHUD({ x: 1860, y: 84, anchor: 'right', k: pop(t, helps[0], 0.3), t, label: 'LOOP', value: k + 1, theme: 'grey', icon: 'retry', bump: seg(t, helps[k], helps[k] + 0.4) });
  if (tl < 0.09 && k > 0) o += E.glitchHit(t, helps[k] - 0.06, 0.1, 6 + k);
  return o + E.redPulse(t, 0.8);
}
// ---- Tip's urgent warning, frost creeping in
function frost(k, t) {
  if (k <= 0) return '';
  let o = '';
  for (let i = 0; i < 2; i++) {
    const d = (90 + 140 * i) * k, a = f(0.2 * k);
    o += S.rect(0, 0, 1920, d * 0.6, 0, { fill: '#D8F2FF', opacity: a }) + S.rect(0, 1080 - d * 0.6, 1920, d * 0.6, 0, { fill: '#D8F2FF', opacity: a });
    o += S.rect(0, 0, d, 1080, 0, { fill: '#D8F2FF', opacity: a }) + S.rect(1920 - d, 0, d, 1080, 0, { fill: '#D8F2FF', opacity: a });
  }
  let cr = '';
  for (let i = 0; i < 14; i++) {
    const side = i % 4, u = hash(i * 3.3);
    const [x, y] = side === 0 ? [u * 1920, 0] : side === 1 ? [u * 1920, 1080] : side === 2 ? [0, u * 1080] : [1920, u * 1080];
    const a = Math.atan2(540 - y, 960 - x) + (hash(i) - 0.5) * 0.8, L_ = (120 + 200 * hash(i * 7)) * k;
    cr += `M${f(x)} ${f(y)} L${f(x + Math.cos(a) * L_)} ${f(y + Math.sin(a) * L_)} M${f(x + Math.cos(a) * L_ * 0.6)} ${f(y + Math.sin(a) * L_ * 0.6)} l${f(Math.cos(a + 0.7) * L_ * 0.3)} ${f(Math.sin(a + 0.7) * L_ * 0.3)} `;
  }
  return o + S.path(cr, ln(5, '#FFFFFF', 0.7 * k));
}
function shTip2(t) {
  const cam = camKeys(t, [[CUT.tip2, at(1060, 560, 1.75)], [CUT.frozen, at(1060, 570, 1.9)]]);
  const fr = seg(t, CUT.tip2, CUT.forever) * 0.6;
  const G = yardGhosts(t, { ex: [820, 1450], cam, rim: false });
  let hero = actor('you', t, { x: 980, y: 960, s: 0.5, volume: false, backpack: true, turn: 0.4, ...breathe(t), face: { name: 'scared', eyes: { look: [0.8, -0.3] }, fx: ['sweat'] } });
  let o = yardR(t, cam, '', G.back + hero + G.front, { frozen: fr });
  const [tx, ty] = toScr(cam, 1240, 470);
  const tF = w(12, 'fffreezing');
  o += R.tip({ x: tx, y: ty, s: 1.9, t, glitch: 0.55 + 0.45 * bump(t, tF, tF + 0.5), look: [-0.8, 0.2], mood: 'worried' });
  o += frost(fr * 1.2, t);
  return o + E.redPulse(t, 0.8);
}
// ---- "If it freezes... everyone gets stuck." — the yard stops, mid-laugh
function shFrozen(t) {
  const fz = Math.min(t, tFreeze);                         // the frozen clock
  const st = t < tFreeze ? E.choppy(t, lerp(24, 4, seg(t, CUT.frozen, tFreeze))) : fz;
  const cam = camKeys(t, [[CUT.frozen, { x: 80, y: 0, zoom: 1.12 }], [tFreeze, { x: 80, y: -20, zoom: 1.04 }], [CUT.forever, { x: 80, y: -30, zoom: 1.02 }]]);
  const G = yardGhosts(st, { freeze: st, cam, only: [0, 1, 2, 3], rim: false });
  let around = '';
  const K_ = [[1, 640, 900, 0.5], [6, 1420, 920, -0.5], [10, 1680, 860, -0.6]];
  for (const [i, x, y, tn] of K_) around += kidLaugh(i, st, x, y, sAt(y), { turn: tn, freeze: st });
  around += actor('principal', st, { x: 1600, y: 960, s: 0.5, turn: -0.4, spaghetti: 1, armL: 140, armR: 150, face: 'scream' });
  around += actor('you', st, { x: 1040, y: 960, s: 0.5, backpack: true, turn: 0.1, armL: 60, armR: 60, face: 'scared' });
  const frK = 0.5 + 0.5 * seg(t, tFreeze - 0.1, tFreeze + 0.3);
  let o = yardR(st, cam, roofCrowd(st, st, cam), G.back + around + G.front, { frozen: frK, tm: st });
  o += frost(0.7 + 0.3 * seg(t, tFreeze, tFreeze + 0.4), t);
  if (t >= tFreeze) o += R.flash(0.6 * (1 - seg(t, tFreeze, tFreeze + 0.25)), '#DFF6FF') + TFS('II', 1840, 110, 80, '#FFFFFF');
  return o + E.redPulse(t, 0.6);
}
// ---- "FOREVER!" — smash out over the frozen town (hand-over to SC 09)
function shForever(t) {
  const tF = w(12, 'FOREVER');
  const fz = tFreeze;
  const cam = shakeAll(camKeys(t, [[CUT.forever, { zoom: 1.2, x: 300, y: 100 }], [tF + 0.25, { zoom: 0.72, x: 40, y: 20 }], [END, { zoom: 0.7, x: 40, y: 15 }]], ease.out), t, [[tF, 0.4, 16]]);
  let o = town(fz, cam, { noBorn: true, freeze: fz, frozen: 1, freezeAt: fz, tm: fz, front: view(cam, townFolk(fz, fz, true), 1) });
  o += frost(0.55, t) + E.redPulse(t, 0.6, 3);
  o += E.zoomLines(960, 540, 0.8 * bump(t, tF, tF + 0.45), t, '#DFF6FF');
  o += E.smash(t, CUT.forever, 0.12, 0.6, '#DFF6FF');
  return o;
}

// ================================================================= dispatch
const RT = E.router([
  [CUT.alarm, shAlarm], [CUT.count, shCount], [CUT.undone, shUndone], [CUT.back, shBack], [CUT.flood, shFlood],
  [CUT.tip1, shTip1], [CUT.all, shAll], [CUT.never, shNever], [CUT.saved, shSaved], [CUT.kid, shKid], [CUT.hundred, shHundred],
  [CUT.prin, shPrin], [CUT.again, shAgain], [CUT.everyone, shEveryone], [CUT.all9999, shAll9999], [CUT.hide, shHide],
  [CUT.literally, shLiterally], [CUT.dream, shDream], [CUT.ivy, shIvy], [CUT.only, shOnly], [CUT.cool, shCool],
  [CUT.dad, shDad], [CUT.bea, shBea], [CUT.tip2, shTip2], [CUT.frozen, shFrozen], [CUT.forever, shForever],
], {
  whips: [[CUT.flood, 1], [CUT.kid, 1], [CUT.prin, -1], [CUT.everyone, 1], [CUT.ivy, -1], [CUT.tip2, 1]],
  glitches: [[CUT.count, 2], [CUT.tip1, 3], [CUT.never, 4], [CUT.hide, 5], [CUT.dream, 6], [CUT.dad, 7], [CUT.bea, 8], [CUT.frozen, 9]],
});
function scene(t) { return RT.scene(t); }
function look(t) {
  if (t >= CUT.dream && t < CUT.ivy) return { grade: 'night', vignette: 0.7 };
  if (t >= CUT.ivy && t < CUT.dad) return { grade: 'warm', vignette: 0.6 };
  if (t >= CUT.frozen) return { grade: 'cool', vignette: 0.7 };
  return { grade: null, vignette: 0.65 };
}

module.exports = { scene, look, CUT, RT, _dbg: { yardR, yardGhosts, roofCrowd, flagsSvg, kidLaugh, frost, town, townFolk } };
