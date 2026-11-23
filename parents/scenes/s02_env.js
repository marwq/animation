// Private helpers for SC 02 («ЛЕГЕНДА CUBE CITY» + the Saturday family meeting): the voice-driven cut list (shared with
// audio/cues/gen_sc02.js), transitions, freeze-frame + intro name cards, bubbles, and the small custom drawings of this
// scene (school photo, boss cards, DarkBlade's profile, Dad's "Nintendo" cards, Mom's word chart, Granny's scoreboard…).
'use strict';

const V = require('./vo');
const { L } = V;

// ================================================================= timing (pure: only the voice timeline)
function timing() {
  const A = Array.from({ length: 21 }, (_, i) => L('02.' + i));
  const w = (i, word, n = 0) => A[i].word(word, n).t0, w1 = (i, word, n = 0) => A[i].word(word, n).t1;
  const T0 = V.scene('SC 02').start;
  const END = V.scene('SC 03').start;
  const b = {
    // 02.0 this is you … a legend
    this: w(0, 'This'), you: w(0, 'you'), real: w(0, 'real'), kid: w(0, 'kid'), but: w(0, 'But'), cube: w(0, 'Cube'), legend: w(0, 'legend'), legend1: w1(0, 'legend'),
    // 02.1 stats
    level: w(1, 'Level'), ninety: w(1, 'ninety-nine'), ninety1: w1(1, 'ninety-nine'), best: w(1, 'best'), base: w(1, 'base'), tycoon: w(1, 'Tycoon'), valley: w(1, 'Valley'),
    two: w(1, 'Two'), thousand: w(1, 'thousand'), wins: w(1, 'wins'), arena: w(1, 'arena'),
    // 02.2 two thousand and ONE
    two2: w(2, 'Two'), one: w(2, 'ONE'),
    // 02.3 the tour
    welcome: w(3, 'Welcome'), castle: w(3, 'castle'), lava: w(3, 'Lava'), pool: w(3, 'pool'), trophy: w(3, 'Trophy'), room: w(3, 'room'), and: w(3, 'And'), thisW: w(3, 'this'), is: w(3, 'is'), throne: w(3, 'throne'),
    // 02.4 a very expensive chair
    the4: w(4, 'The'), chair: w(4, 'chair'), a4: w(4, 'A', 1), very: w(4, 'very'), expensive: w(4, 'expensive'), chair2: w(4, 'chair', 1),
    // 02.5 Noodle
    noodle: w(5, 'Noodle'), best5: w(5, 'best'), friend: w(5, 'friend'), youve: w(5, "You've"), never5: w(5, 'never'), met: w(5, 'met'), real5: w(5, 'real'), life5: w(5, 'life'),
    but5: w(5, 'but'), beaten: w(5, 'beaten'), four: w(5, 'four'), hundred: w(5, 'hundred'), bosses: w(5, 'bosses'), together: w(5, 'together'),
    // 02.6 bro bro bro
    bro: [w(6, 'Bro', 0), w(6, 'Bro', 1), w(6, 'bro', 2), w(6, 'bro', 3)], newW: w(6, 'New'), update: w(6, 'update'), the6: w(6, 'The'), block: w(6, 'Block'), king: w(6, 'King'), coming: w(6, 'coming'),
    // 02.7 DarkBlade
    and7: w(7, 'And'), darkblade: w(7, 'DarkBlade'), nobody: w(7, 'Nobody'), who: w(7, 'who'), really: w(7, 'really'), is7: w(7, 'is'), nobody2: w(7, 'Nobody', 1), why: w(7, 'why'), always: w(7, 'always'), angry: w(7, 'angry'),
    // 02.8 / 02.9
    you8: w(8, 'You'), lucky: w(8, 'lucky'), last: w(8, 'last'), time: w(8, 'time'), YOU8: w(8, 'YOU', 1), enjoy: w(8, 'Enjoy'), little: w(8, 'little'), castle8: w(8, 'castle'),
    enjoy9: w(9, 'Enjoy'), little9: w(9, 'little'), losing: w(9, 'losing'), streak: w(9, 'streak'),
    // 02.10 Saturday morning
    but10: w(10, 'But'), saturday: w(10, 'Saturday'), morning: w(10, 'morning'), real10: w(10, 'real'), happened: w(10, 'happened'),
    // 02.11 Dad
    dad: w(11, 'Dad'), accountant: w(11, 'accountant'), he: w(11, 'He'), every: w(11, 'every'), video: w(11, 'video'), game: w(11, 'game'), called: w(11, 'called'), nintendo: w(11, 'Nintendo'),
    // 02.12 Mom
    mom: w(12, 'Mom'), very12: w(12, 'very'), quiet: w(12, 'quiet'), librarian: w(12, 'librarian'), she: w(12, 'She'), shh: w(12, 'shh'), more: w(12, 'more'), other: w(12, 'other'), word: w(12, 'word'),
    // 02.13 Granny
    granny: w(13, 'Granny'), knits: w(13, 'knits'), bakes: w(13, 'bakes'), and13: w(13, 'And', 1), never: w(13, 'never'), lost: w(13, 'lost'), argument: w(13, 'argument'), life: w(13, 'life'),
    // 02.14 Family meeting!
    family: w(14, 'Family'), meeting: w(14, 'meeting'), your: w(14, 'Your'), noticed: w(14, 'noticed'), spend: w(14, 'spend'), eleven: w(14, 'eleven'), hours: w(14, 'hours'), day: w(14, 'day'), in14: w(14, 'in'), the14: w(14, 'the'), nintendo14: w(14, 'Nintendo'),
    // 02.15
    its: w(15, "It's"), not: w(15, 'not'), nintendo15: w(15, 'Nintendo'), dad15: w(15, 'Dad'), its2: w(15, "It's", 1), cube15: w(15, 'Cube'),
    // 02.16 Mom: decision / Tonight
    so: w(16, 'So'), decision: w(16, 'decision'), tonight: w(16, 'Tonight'), family16: w(16, 'Family'), game16: w(16, 'Game'), night: w(16, 'Night'),
    // 02.17 board games
    oh: w(17, 'Oh'), board: w(17, 'Board'), games: w(17, 'games'), okay: w(17, 'Okay'), fine: w(17, 'fine'),
    // 02.18 Granny: No, dear
    no: w(18, 'No'), dear: w(18, 'dear'), were: w(18, "We're"), joining: w(18, 'joining'), YOUR: w(18, 'YOUR'), game18: w(18, 'game'),
    // 02.19 / 02.20
    youre: w(19, "You're"), joining19: w(19, 'joining'), my: w(19, 'my'), server: w(19, 'SERVER'),
    it20: w(20, 'It'), scariest: w(20, 'scariest'), sentence: w(20, 'sentence'), ever: w(20, 'ever'), heard: w(20, 'heard'),
  };
  const C = {};
  C.open = T0;                           // Cube City by day: crane down to the hero on a rooftop, freeze on "you" + YOU card
  C.photo = b.real - 0.3;                // real life: the school photo, flash, JUST A KID
  C.legend = b.but - 0.1;                // the castle: crane up to the roof, LEGEND
  C.level = A[1].a - 0.2;                // stats montage: LVL 1 -> 99
  C.base = b.best - 0.22;                // Tycoon Valley: #1 BASE
  C.arena = b.two - 0.15;                // the arena: 2,000 WINS, KO
  C.one = A[2].a - 0.18;                 // "Two thousand and ONE" close-up, 2,001
  C.welcome = A[3].a - 0.22;             // the castle gate, the red carpet
  C.lava = b.lava - 0.2;                 // lava pool (a noob dives in)
  C.trophy = b.trophy - 0.18;            // trophy room
  C.throne = b.and - 0.14;               // the walk to the throne, sit
  C.chair = A[4].a - 0.12;               // deadpan: FIG. 1 — A CHAIR
  C.tag = b.a4 - 0.16;                   // the price tag 99,999 — wallet 1
  C.noodle = A[5].a - 0.12;              // Noodle runs in, freeze + NOODLE card, fist bump
  C.met = b.youve - 0.15;                // split: real life — the hero | ??? with a ramen cup
  C.bosses = b.but5 - 0.12;              // montage: 400 bosses
  C.bro = A[6].a - 0.16;                 // NOODLE close-up: bro bro bro
  C.update = b.newW - 0.14;              // NEW UPDATE banner
  C.king = b.the6 - 0.12;                // the Block King teaser over the city
  C.gulp = A[6].b + 0.05;                // reaction: the two friends gulp
  C.dark = A[7].a - 0.1;                 // DarkBlade lands (+ clan), freeze + card
  C.who = b.nobody - 0.18;               // close-up + profile card ???
  C.angry = b.nobody2 - 0.15;            // the noob says hi — DarkBlade's eyes flare
  C.taunt = A[8].a - 0.25;               // standoff: "You got lucky last time, YOU."
  C.little = b.enjoy - 0.22;             // "Enjoy your little castle."
  C.streak = A[9].a - 0.2;               // the hero: "Enjoy your little losing streak." — BURN
  C.fume = A[9].b + 0.02;                // (beat) DarkBlade fumes, steam, the clan snickers
  C.sat = b.but10 - 0.3;                 // pull out of the tablet: the kitchen, Saturday morning
  C.dad = A[11].a - 0.05;                // Dad portrait, freeze + DAD card
  C.dadNin = b.he - 0.14;                // Dad's thought: every game = NINTENDO
  C.mom = A[12].a - 0.08;                // Mom portrait, freeze + MOM card, volume 1
  C.shh = b.she - 0.22;                  // SHH! + Mom's top words chart
  C.granny = A[13].a - 0.08;             // Granny portrait, freeze + GRANNY card, knits / bakes
  C.argue = b.and13 - 0.14;              // never lost an argument: WON 9,999 · LOST 0
  C.meeting = A[14].a - 0.24;            // Dad at the flip chart: FAMILY MEETING!
  C.notice = b.your - 0.2;               // the chart: 11 HRS/DAY
  C.nin = b.the14 - 0.2;                 // smash: NINTENDO 90%
  C.notNin = A[15].a - 0.16;             // the hero: it's CUBE CITY (tablet up)
  C.decision = A[16].a - 0.2;            // Mom: so we made a decision
  C.tonight = b.tonight - 0.2;           // TONIGHT stamp + FAMILY GAME NIGHT title
  C.boardG = A[17].a - 0.15;             // relieved: board games thought bubble
  C.no = A[18].a - 0.12;                 // Granny: No, dear.
  C.joining = b.were - 0.15;             // triptych: phone / laptop / tablet slam in
  C.flake = A[18].b + 0.06;              // ⏱ the cereal flake falls back into the bowl
  C.server = A[19].a - 0.1;              // the hero: my SERVER?!
  C.scary = A[20].a - 0.1;               // dolly zoom: the scariest sentence
  C.family = b.heard - 0.06;             // the family smiling with their devices; whip out to SC 03
  // keep the cuts in order even if the voice squeezes them (min 0.2 s per shot)
  const ks = Object.keys(C);
  for (let i = 1; i < ks.length; i++) if (C[ks[i]] < C[ks[i - 1]] + 0.2) C[ks[i]] = C[ks[i - 1]] + 0.2;
  return { A, C, b, T0, END };
}

// ================================================================= drawing helpers
const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const LINE = '#151515';
const W = 1920, H = 1080;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const TS = (txt, x, y, size, fill, extra = {}) => T(esc(txt), x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(esc(txt), x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.14, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
// cam that puts world (wx, wy) of the k 1 plane at screen (sx, sy)
const at = (wx, wy, zoom = 1, sx = 960, sy = 540) => ({ zoom, x: wx - 960 - (sx - 960) / zoom, y: wy - 540 - (sy - 540) / zoom });
// world point -> screen for a cam at parallax 1
const toScr = (cam, x, y) => { const z = cam.zoom ?? 1; return [960 + (cam.sx || 0) + z * (x - 960 - (cam.x || 0)), 540 + (cam.sy || 0) + z * (y - 540 - (cam.y || 0))]; };
function shakeAll(cam, t, list) {
  cam = { ...cam };
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); cam.sx = (cam.sx || 0) + s.sx; cam.sy = (cam.sy || 0) + s.sy; }
  return cam;
}
function clipTo(x, y, w, h, inner, r = 0) {
  const id = S.uid('s02c');
  return S.clipDef(id, S.rect(x, y, w, h, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}
function clipPathD(d, inner) {
  const id = S.uid('s02p');
  return S.clipDef(id, S.path(d)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}
// feet y that puts a rig character's face centre at y fy (size = the design's size factor)
const faceAt = (fy, s, size = 1) => fy + 720 * s * size;
const zoomAbout = (svg, cx, cy, z) => (Math.abs(z - 1) < 1e-4 ? svg : S.g(svg, `translate(${f(cx)} ${f(cy)}) scale(${f(z)}) translate(${f(-cx)} ${f(-cy)})`));
// squash/stretch impulse after t0
function boing(t, t0, amp = 0.2, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}
// a hop arc: lift height over [t0, t0 + d]
const hop = (t, t0, d = 0.35, h = 60) => (t > t0 && t < t0 + d ? h * Math.sin(((t - t0) / d) * Math.PI) : 0);

// ---------------------------------------------------------------- transitions
function whip(t, tc, dir = 1, dur = 0.1) {
  const d = t - tc;
  if (Math.abs(d) > dur) return '';
  const k = 1 - Math.abs(d) / dur;
  let p = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7) * H, len = 300 + hash(i) * 700, th = 8 + hash(i * 2.2) * 16;
    const x = ((hash(i * 5.1) * 2600 + dir * d * 16000) % 2600 + 2600) % 2600 - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.6 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.75) => (t >= tc && t < tc + dur ? K.C.whiteFlash(a * (1 - (t - tc) / dur)) : '');
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22, r0 = 380) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, rr = r0 + hash(i + Math.floor(t * 12)) * 160, r1 = rr + 900;
    const w_ = 10 + hash(i * 1.7) * 14;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * w_, ny = ax * w_;
    d += `M${f(cx + ax * rr)} ${f(cy + ay * rr)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.75 * k) });
}
function streaks(k, dir = 1, seed = 1, col = '#FFFFFF', vertical = false) {
  if (k <= 0.01) return '';
  let p = '';
  for (let i = 0; i < 14; i++) {
    const a = hash(i * 3.7 + seed), len = 400 + hash(i + seed) * 900, th = 6 + hash(i * 2.2 + seed) * 14, b = hash(i * 5.1 + seed) * 2400 - 300;
    p += vertical ? `M${f(a * W)} ${f(b)}v${f(len)}h${f(th)}v${f(-len)}Z` : `M${f(b)} ${f(a * H)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.path(p, { fill: col, opacity: f(0.7 * k) });
}
// freeze-frame: the picture tilts into a white-bordered still on a dark ground (k 0..1)
function freeze(svg, k, rot = -2.5, ground = '#1E1A2E', tint = '#FFE8C8') {
  if (k <= 0.001) return svg;
  const e = ease.outBack(clamp(k, 0, 1));
  const sc = lerp(1, 0.9, e), r = lerp(0, rot, e);
  // the sets are padded far beyond the frame: instead of a (slow) clip-path, an even-odd ring in the ground colour hides
  // everything outside the photo, then the white border ring — so the still really reads as a photo
  const hole = `M0 0 V${H} H${W} V0 Z`;
  let g = svg + S.rect(0, 0, W, H, 0, { fill: tint, opacity: f(0.12 * e) });
  g += S.path(`M-4000 -4000 H${W + 4000} V${H + 4000} H-4000 Z ` + hole, { fill: ground, 'fill-rule': 'evenodd' });
  g += S.path(`M-18 -18 H${W + 18} V${H + 18} H-18 Z ` + hole, { fill: '#FFFFFF', 'fill-rule': 'evenodd' }) + S.rect(-18, -18, W + 36, H + 36, 6, { fill: 'none', stroke: '#151515', 'stroke-width': 6 });
  return S.g(g, `translate(960 540) rotate(${f(r)}) scale(${f(sc)}) translate(-960 -540)`);
}

// ---------------------------------------------------------------- intro name card (slams in, sub ribbon, optional pointer)
function nameCard(t, t0, x, y, name, sub, col = '#FF5A3D', o = {}) {
  const k = pop(t, t0, 0.32);
  if (k <= 0.01) return '';
  const out = o.tOut !== undefined ? ease.in(seg(t, o.tOut, o.tOut + 0.22)) : 0;
  if (out >= 1) return '';
  const size = o.size || 104;
  const w_ = Math.max(240, name.length * size * 0.6 + 90), h = size * 1.18;
  const rot = (o.rot ?? -5) + 8 * (1 - seg(t, t0, t0 + 0.25));
  let g = '';
  if (o.ax !== undefined) {
    const dx = o.ax - x, dy = o.ay - y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const sx = x + ux * (w_ * 0.3), sy = y + uy * (h * 0.4), ex = o.ax - ux * 30, ey = o.ay - uy * 30;
    const nx = -uy, ny = ux;
    const d = `M${f(sx + nx * 24)} ${f(sy + ny * 24)} L${f(ex - ux * 40 + nx * 15)} ${f(ey - uy * 40 + ny * 15)} L${f(ex - ux * 40 + nx * 38)} ${f(ey - uy * 40 + ny * 38)} L${f(ex)} ${f(ey)} L${f(ex - ux * 40 - nx * 38)} ${f(ey - uy * 40 - ny * 38)} L${f(ex - ux * 40 - nx * 15)} ${f(ey - uy * 40 - ny * 15)} L${f(sx - nx * 24)} ${f(sy - ny * 24)} Z`;
    const ak = seg(t, t0 + 0.12, t0 + 0.36);
    if (ak > 0) g += S.g(S.path(d, ol('#FFFFFF', 7)), null, { opacity: f(ak * (1 - out)) });
  }
  let p = S.rect(-w_ / 2 + 12, -h / 2 + 16, w_, h, h * 0.34, { fill: '#000', opacity: 0.3 });
  p += S.rect(-w_ / 2, -h / 2, w_, h, h * 0.34, ol(col, 9));
  p += S.rect(-w_ / 2 + 14, -h / 2 + 12, w_ - 28, h * 0.3, h * 0.15, { fill: '#FFFFFF', opacity: 0.22 });
  p += TS(name, 0, size * 0.36, size, '#FFFFFF');
  if (sub) {
    const sw = Math.max(200, sub.length * 19 + 64), sk = pop(t, o.subAt ?? t0 + 0.14, 0.26);
    if (sk > 0.01) p += S.g(S.rect(-sw / 2, -25, sw, 52, 16, ol('#1E1A2E', 6)) + TF(esc(sub), 0, 11, 30, o.subCol || '#FFE14D'), `translate(${f(o.subDx ?? 30)} ${f(h / 2 + 24)}) rotate(3) scale(${f(sk)})`);
  }
  const sp = bump(t, t0 + 0.05, t0 + 0.55);
  if (sp > 0) p += K.F.sparkle(-w_ / 2 - 10, -h / 2 - 6, 30 * sp, '#FFFFFF') + K.F.sparkle(w_ / 2 + 6, -h / 2 + 4, 22 * sp, '#FFE14D') + K.F.sparkle(w_ / 2 - 20, h / 2 + 4, 18 * sp, '#FFFFFF');
  g += S.g(p, tf(x, y + 60 * out, k * (1 - 0.3 * out), rot), out > 0 ? { opacity: f(1 - out) } : {});
  return g;
}

// ---------------------------------------------------------------- bubbles
function speech(x, y, txt, k, o = {}) {
  if (k <= 0.01) return '';
  const size = o.size || 64, w_ = o.w || txt.length * size * 0.56 + 80, h = size * 1.5;
  const tx = o.tail ?? -1, col = o.col || '#FFFFFF', ink = o.ink || '#1E1A2E';
  let g = S.path(`M${f(tx * w_ * 0.18 - 26)} ${f(h / 2 - 8)} L${f(tx * (w_ * 0.32 + 30))} ${f(h / 2 + 60)} L${f(tx * w_ * 0.18 + 30)} ${f(h / 2 - 8)} Z`, ol(col, 7));
  g += S.rect(-w_ / 2, -h / 2, w_, h, h * 0.42, ol(col, 7)) + S.path(`M${f(tx * w_ * 0.18 - 20)} ${f(h / 2 - 4)} L${f(tx * w_ * 0.18 + 24)} ${f(h / 2 - 4)}`, { stroke: col, 'stroke-width': 12 });
  g += T(esc(txt), 0, size * 0.36, size, ink);
  return S.g(g, tf(x, y, ease.outBack(clamp(k, 0, 1)), o.rot || 0));
}
function thought(x, y, w_, h, k, inner = '', o = {}) {
  if (k <= 0.01) return '';
  const n = 12;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, r = 0.5 + 0.08 * hash(i * 3.3 + (o.seed || 0));
    d += `M${f(Math.cos(a) * w_ * 0.46 - w_ * r * 0.22)} ${f(Math.sin(a) * h * 0.44)} a${f(w_ * r * 0.22)} ${f(h * r * 0.3)} 0 1 1 ${f(w_ * r * 0.44)} 0 a${f(w_ * r * 0.22)} ${f(h * r * 0.3)} 0 1 1 ${f(-w_ * r * 0.44)} 0Z`;
  }
  const col = o.col || '#FFFFFF';
  let g = S.path(d, { fill: col, stroke: LINE, 'stroke-width': 7 }) + S.ellipse(0, 0, w_ * 0.47, h * 0.44, { fill: col });
  const [px, py] = o.tail || [-w_ * 0.3, h * 0.75];
  for (let i = 0; i < 3; i++) { const u = 0.45 + i * 0.25; g += S.ellipse(px * u, py * u, 26 - i * 7, 20 - i * 5, ol(col, 6)); }
  g += inner;
  return S.g(g, tf(x, y, ease.outBack(clamp(k, 0, 1))));
}
function starD(r, n = 5, inner = 0.46) {
  let d = '';
  for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, rr = i % 2 ? r * inner : r; d += (i ? 'L' : 'M') + f(Math.cos(a) * rr) + ' ' + f(Math.sin(a) * rr); }
  return d + 'Z';
}
const star = (x, y, r, col = '#FFD21F', lw = 5, rot = 0) => S.path(starD(r), { ...ol(col, lw), transform: `translate(${f(x)} ${f(y)}) rotate(${f(rot)})` });

// ---------------------------------------------------------------- small UI cards
// dark info card with rows that pop in: rows [{label, value, at, col}]
function infoCard(t, x, y, w_, title, rows, k, o = {}) {
  if (k <= 0.01) return '';
  const rh = o.rh || 74, h = 110 + rows.length * rh;
  const acc = o.accent || '#FF4B5C';
  let g = S.rect(12, 16, w_, h, 34, { fill: '#000', opacity: 0.3 });
  g += S.rect(0, 0, w_, h, 34, ol('#1C1B2E', 8)) + S.rect(10, 10, w_ - 20, h - 20, 26, { fill: 'none', stroke: acc, 'stroke-width': 4, opacity: 0.8 });
  g += S.rect(0, 0, w_, 84, 34, { fill: acc }) + S.rect(0, 50, w_, 34, 0, { fill: acc }) + S.path(`M0 84 H${w_}`, ln(7));
  g += S.rect(0, 0, w_, h, 34, { fill: 'none', stroke: LINE, 'stroke-width': 8 });
  g += TS(title, w_ / 2, 60, 46, '#FFFFFF');
  rows.forEach((r, i) => {
    const rk = pop(t, r.at, 0.25);
    if (rk <= 0.01) return;
    const ry = 110 + i * rh + rh * 0.55;
    let q = TF(esc(r.label), 34, ry, 34, '#9AA6C0', { 'text-anchor': 'start', 'letter-spacing': 1 });
    q += T(esc(r.value), w_ - 34, ry + 4, r.size || 50, r.col || '#FFFFFF', { 'text-anchor': 'end', stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke' });
    g += S.g(q, `translate(${f(60 * (1 - ease.out(clamp(rk, 0, 1))))} 0)`, { opacity: f(clamp(rk * 1.6, 0, 1)) });
  });
  return S.g(g, tf(x, y, ease.outBack(clamp(k, 0, 1)), o.rot || 0));
}

// ---------------------------------------------------------------- boss cards for the 400-bosses montage (simple icons)
function bossIcon(kind, s = 1) {
  let g = '';
  if (kind === 0) {        // slime cube
    g += S.path('M-70 40 Q-80 -50 -40 -70 Q0 -84 40 -70 Q80 -50 70 40 Z', ol('#6EDB5A', 6)) + S.path('M-50 -40 Q-30 -60 -10 -62', ln(8, '#FFFFFF', 0.6));
    g += S.ellipse(-24, -10, 12, 16, ol('#FFFFFF', 4)) + S.ellipse(24, -10, 12, 16, ol('#FFFFFF', 4)) + S.path('M-20 20 Q0 34 20 20', ln(5));
  } else if (kind === 1) { // cube dragon head
    g += S.rect(-70, -50, 140, 100, 14, ol('#E8463C', 6)) + S.rect(10, -10, 80, 60, 10, ol('#E8463C', 6)) + S.path('M-50 -50 L-62 -86 L-30 -50 M10 -50 L0 -86 L30 -50', ol('#FFD21F', 5));
    g += S.rect(-40, -24, 26, 20, 4, ol('#FFE14D', 4)) + S.path('M30 30 h50 M40 44 h40', ln(5)) + S.path('M60 10 l10 -8 l10 8', ln(4, '#FFFFFF'));
  } else if (kind === 2) { // robot head
    g += S.rect(-66, -60, 132, 120, 18, ol('#9AA4B8', 6)) + S.path('M0 -60 V-90', ln(6)) + S.circle(0, -96, 10, ol('#FF4B5C', 4));
    g += S.rect(-46, -30, 36, 26, 6, ol('#33D6FF', 4)) + S.rect(10, -30, 36, 26, 6, ol('#33D6FF', 4)) + S.rect(-40, 18, 80, 20, 6, ol('#3A3F52', 4));
  } else if (kind === 3) { // giant chicken
    g += S.ellipse(0, 10, 70, 64, ol('#FFFFFF', 6)) + S.path('M-20 -54 q10 -30 20 0 q10 -30 20 0', ol('#FF4B5C', 5)) + S.path('M50 0 L84 10 L50 22 Z', ol('#FFB13B', 5));
    g += S.circle(26, -10, 9, { fill: LINE }) + S.path('M14 30 q8 14 0 22', ol('#FF4B5C', 4));
  } else if (kind === 4) { // pumpkin
    g += S.ellipse(0, 10, 76, 62, ol('#FF8A2B', 6)) + S.path('M-26 -46 Q-36 10 -26 66 M26 -46 Q36 10 26 66', ln(5, '#C85A10')) + S.rect(-8, -72, 16, 26, 4, ol('#3E8A4A', 4));
    g += S.path('M-40 -6 L-20 -20 L-12 0 Z M40 -6 L20 -20 L12 0 Z', { fill: '#3A1A08' }) + S.path('M-36 26 L-24 40 L-12 28 L0 42 L12 28 L24 40 L36 26', ln(6, '#3A1A08'));
  } else {                 // ghost
    g += S.path('M-60 60 L-60 -20 Q-60 -80 0 -80 Q60 -80 60 -20 L60 60 L40 44 L20 60 L0 44 L-20 60 L-40 44 Z', ol('#EAE6FF', 6));
    g += S.ellipse(-22, -24, 10, 16, { fill: LINE }) + S.ellipse(22, -24, 10, 16, { fill: LINE }) + S.ellipse(0, 10, 12, 16, { fill: LINE });
  }
  return S.g(g, `scale(${f(s)})`);
}
// a polaroid boss card with a red X and DEFEATED (centre, k pops it, s scale, rot)
function bossCard(x, y, kind, k, s = 1, rot = 0, bg = '#BFE3F2') {
  if (k <= 0.01) return '';
  let g = S.rect(-110 + 8, -130 + 10, 220, 260, 10, { fill: '#000', opacity: 0.25 }) + S.rect(-110, -130, 220, 260, 10, ol('#FFFFFF', 6)) + S.rect(-94, -114, 188, 170, 4, { fill: bg, stroke: LINE, 'stroke-width': 4 });
  g += S.g(bossIcon(kind, 0.95), 'translate(0 -26)');
  g += S.path('M-70 -96 L70 36 M70 -96 L-70 36', ln(16, '#FF3B4E', 0.85));
  g += TF('DEFEATED', 0, 98, 30, '#E0263C', { 'letter-spacing': 1 });
  return S.g(g, tf(x, y, s * ease.outBack(clamp(k, 0, 1)), rot));
}

// ---------------------------------------------------------------- Dad's "Nintendo" game cards
function gameCard(kind, k, label, stampK) {
  if (k <= 0.01) return '';
  let g = S.rect(-100, -110, 200, 220, 20, ol('#FFFFFF', 6));
  const bgc = ['#7FD3FF', '#FFE07A', '#9AE08A', '#E8E4F4'][kind];
  g += S.rect(-84, -94, 168, 130, 12, { fill: bgc, stroke: LINE, 'stroke-width': 4 });
  if (kind === 0) {        // Cube City: an iso cube
    g += S.path('M0 -78 L46 -54 L0 -30 L-46 -54 Z', ol('#FFB13B', 4)) + S.path('M-46 -54 L0 -30 L0 22 L-46 -2 Z', ol('#FF8A2B', 4)) + S.path('M46 -54 L0 -30 L0 22 L46 -2 Z', ol('#E06A10', 4));
  } else if (kind === 1) { // racing car
    g += S.path('M-66 4 L-60 -22 L-24 -26 L-10 -48 L30 -48 L44 -24 L66 -18 L68 4 Z', ol('#FF4B5C', 4)) + S.circle(-36, 8, 14, ol('#2A2A30', 4)) + S.circle(40, 8, 14, ol('#2A2A30', 4)) + S.rect(-4, -42, 26, 16, 3, ol('#BFE8FF', 3));
  } else if (kind === 2) { // soccer ball
    g += S.circle(0, -28, 50, ol('#FFFFFF', 5)) + S.path('M0 -48 L18 -34 L11 -12 L-11 -12 L-18 -34 Z', { fill: LINE }) + S.path('M0 -48 V-78 M18 -34 L46 -44 M11 -12 L28 12 M-11 -12 L-28 12 M-18 -34 L-46 -44', ln(4));
  } else {                 // Dad's calculator
    g += S.rect(-44, -86, 88, 116, 12, ol('#5A6070', 4)) + S.rect(-34, -76, 68, 26, 4, { fill: '#B8E0A0', stroke: LINE, 'stroke-width': 3 }) + T('1040', 26, -56, 20, '#2A3A20', { 'text-anchor': 'end' });
    let keys = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) keys += `M${-32 + c * 24} ${-40 + r * 22} h18 v16 h-18 Z`;
    g += S.path(keys, { fill: '#E8ECF4', stroke: LINE, 'stroke-width': 2.5 });
  }
  g += TF(esc(label), 0, 84, 26, '#2A2A30');
  if (stampK > 0.01) {
    const sk = stampK < 0.3 ? lerp(2.2, 0.95, ease.in(stampK / 0.3)) : lerp(0.95, 1, ease.outBack(seg(stampK, 0.3, 0.6)));
    g += S.g(S.rect(-108, -30, 216, 60, 10, { fill: '#FFFFFF', opacity: 0.85, stroke: '#E0263C', 'stroke-width': 7 }) + T('NINTENDO', 0, 18, 42, '#E0263C', { 'letter-spacing': 1 }), `translate(0 -20) rotate(-14) scale(${f(sk)})`, { opacity: f(clamp(stampK * 4, 0, 1)) });
  }
  return S.g(g, `scale(${f(ease.outBack(clamp(k, 0, 1)))})`);
}

// ---------------------------------------------------------------- TV-style volume OSD (Mom: very quiet)
function volumeOSD(x, y, k, level, t) {
  if (k <= 0.01) return '';
  let g = S.rect(-210, -60, 420, 120, 26, { fill: '#10131E', opacity: 0.88, stroke: LINE, 'stroke-width': 6 });
  g += S.path('M-176 -14 H-160 L-134 -36 V36 L-160 14 H-176 Z', ol('#FFFFFF', 4));
  if (level <= 0.05) g += S.path('M-120 -18 L-96 18 M-96 -18 L-120 18', ln(7, '#FF4B5C'));
  else g += S.path('M-118 -16 Q-106 0 -118 16', ln(6, '#FFFFFF'));
  const n = 10, on = Math.round(level * n);
  for (let i = 0; i < n; i++) g += S.rect(-76 + i * 26, 20 - 8 - i * 3, 18, 18 + i * 3, 4, { fill: i < on ? '#3DDC84' : '#3A3F52', stroke: LINE, 'stroke-width': 3 });
  g += TF('VOLUME', 70, -24, 26, '#9AA6C0', { 'letter-spacing': 3 });
  return S.g(g, tf(x, y, ease.outBack(clamp(k, 0, 1))));
}

// ---------------------------------------------------------------- Mom's top words: horizontal bar chart
function wordChart(t, x, y, k, grow, o = {}) {
  if (k <= 0.01) return '';
  const rows = [['SHH', 1], ['SWEETIE', 0.16], ['OKAY', 0.1], ['HELLO', 0.07]];
  let g = S.rect(-20 + 10, -20 + 14, 700, 430, 30, { fill: '#000', opacity: 0.25 }) + S.rect(-20, -20, 700, 430, 30, ol('#FFF8EA', 7));
  g += T("MOM'S TOP WORDS", 330, 40, 46, '#2E5FB8') + S.path('M60 58 Q330 70 600 56', ln(5, '#E04848'));
  rows.forEach(([w_, v], i) => {
    const ry = 110 + i * 74;
    g += TF(w_, 150, ry + 14, 34, '#2A2A30', { 'text-anchor': 'end' });
    const len = (i === 0 ? lerp(40, 1500, ease.inOut(clamp(grow, 0, 1))) : 470 * v) * clamp(k * 1.5, 0, 1);
    const cl = i === 0 ? '#E86A8A' : '#7FC8E8';
    g += S.rect(166, ry - 20, Math.max(10, len), 44, 10, ol(cl, 5));
    if (i === 0 && len > 520) g += TS('!!!', 166 + len - 60, ry - 34, 54, '#FFD21F');
  });
  return S.g(g, tf(x, y, ease.outBack(clamp(k, 0, 1)), o.rot || 2));
}

// ---------------------------------------------------------------- Granny's argument scoreboard
function argueBoard(t, x, y, k, won, lostK, o = {}) {
  if (k <= 0.01) return '';
  let g = S.rect(-300 + 10, -150 + 14, 600, 300, 30, { fill: '#000', opacity: 0.3 }) + S.rect(-300, -150, 600, 300, 30, ol('#232238', 8));
  g += S.rect(-286, -136, 572, 272, 22, { fill: 'none', stroke: '#B57BFF', 'stroke-width': 4 });
  g += TF('ARGUMENTS', 0, -94, 40, '#B9A6FF', { 'letter-spacing': 4 });
  g += TF('WON', -150, -36, 32, '#9AA6C0') + TF('LOST', 150, -36, 32, '#9AA6C0');
  const wonS = Math.round(won).toLocaleString('en-US');
  g += T(wonS, -150, 70, 96, '#3DDC84', { stroke: LINE, 'stroke-width': 10, 'paint-order': 'stroke' });
  const lp = 1 + 0.25 * Math.max(0, Math.sin(lostK * Math.PI * 3)) * (lostK < 1 ? 1 : 0);
  g += S.g(T('0', 0, 34, 120, '#FF4B5C', { stroke: LINE, 'stroke-width': 12, 'paint-order': 'stroke' }), `translate(150 36) scale(${f(lp)})`);
  g += S.path('M0 -60 V110', ln(5, '#3A3F52'));
  return S.g(g, tf(x, y, ease.outBack(clamp(k, 0, 1)), o.rot || -3));
}

// ---------------------------------------------------------------- a long wooden pointer stick (prop; grip at 0,0, tip up -y)
const pointerStick = (x, y, rot, len = 420) => S.g(S.path(`M0 0 L0 ${-len}`, ln(16)) + S.path(`M0 0 L0 ${-len}`, ln(9, '#C98A52')) + S.circle(0, -len, 9, ol('#E04848', 4)), tf(x, y, 1, rot));

// ---------------------------------------------------------------- board-game box (thought bubble)
function boardGame(s = 1) {
  let g = S.path('M-140 -40 L120 -70 L160 -10 L-100 20 Z', ol('#E8D0A0', 5)) + S.path('M-100 20 L160 -10 L160 40 L-100 70 Z', ol('#C9A870', 5)) + S.path('M-140 -40 L-100 20 L-100 70 L-140 10 Z', ol('#B08A50', 5));
  g += S.g(T('WORD', 0, 0, 40, '#2E5FB8') + T('TILES', 0, 34, 30, '#E04848'), 'translate(10 -38) rotate(-7) skewX(-20) scale(0.9 0.6)');
  g += S.g(S.rect(-26, -26, 52, 52, 10, ol('#FFFFFF', 5)) + S.circle(-12, -12, 6, { fill: LINE }) + S.circle(12, 12, 6, { fill: LINE }) + S.circle(0, 0, 6, { fill: LINE }), 'translate(-120 -100) rotate(14)');
  g += S.g(S.rect(-22, -22, 44, 44, 9, ol('#FF6A6A', 5)) + S.circle(-9, -9, 5, { fill: '#FFF' }) + S.circle(9, 9, 5, { fill: '#FFF' }), 'translate(140 -110) rotate(-18)');
  return S.g(g, `scale(${f(s)})`);
}

// ---------------------------------------------------------------- ramen cup (Noodle's real-life hint) + the silhouette
function ramenCup(x, y, s, t) {
  let g = S.path('M-60 -110 L60 -110 L46 0 L-46 0 Z', ol('#FFFFFF', 6)) + S.path('M-56 -80 L56 -80 L52 -50 L-52 -50 Z', { fill: '#E8463C' }) + TF('RAMEN', 0, -58, 20, '#FFFFFF');
  g += S.path('M-62 -112 L62 -112', ln(10, '#E8E4D8')) + S.path('M-62 -112 L62 -112', ln(4));
  for (let i = 0; i < 3; i++) { const ph = (t * 0.7 + i / 3) % 1; g += S.path(`M${-24 + i * 24} ${-124 - ph * 90} q-12 -20 0 -40`, ln(6, '#FFFFFF', 0.7 * (1 - ph))); }
  return S.g(g, tf(x, y, s));
}
function silhouette(x, y, s, t) {
  const by = Math.sin(t * 3) * 4;
  let g = S.path('M-170 0 L-150 -250 Q-140 -300 -90 -300 L90 -300 Q140 -300 150 -250 L170 0 Z', { fill: '#0B0D18', stroke: '#33D6FF', 'stroke-width': 5, opacity: 0.98 });
  g += S.rect(-110, -560 + by, 220, 240, 40, { fill: '#0B0D18', stroke: '#33D6FF', 'stroke-width': 5 });
  g += TS('?', 0, -380 + by, 180, '#FFFFFF');
  return S.g(g, tf(x, y, s));
}

// ---------------------------------------------------------------- red carpet that unrolls toward the camera (k 0..1)
function carpet(x, y0, y1, w0, w1, k) {
  if (k <= 0.01) return '';
  const ye = lerp(y0, y1, ease.out(clamp(k, 0, 1)));
  const we = lerp(w0, w1, (ye - y0) / (y1 - y0));
  let g = S.path(`M${f(x - w0 / 2)} ${f(y0)} L${f(x + w0 / 2)} ${f(y0)} L${f(x + we / 2)} ${f(ye)} L${f(x - we / 2)} ${f(ye)} Z`, ol('#D8262E', 5));
  g += S.path(`M${f(x - w0 / 2 + 10)} ${f(y0)} L${f(x - we / 2 + 14)} ${f(ye)} M${f(x + w0 / 2 - 10)} ${f(y0)} L${f(x + we / 2 - 14)} ${f(ye)}`, ln(5, '#FFD21F'));
  if (k < 1) g += S.ellipse(x, ye, we / 2 + 10, 26, ol('#B01D24', 5));
  return g;
}

// ---------------------------------------------------------------- museum label (the throne: "FIG. 1 — A CHAIR")
function museumLabel(x, y, k, ax, ay) {
  if (k <= 0.01) return '';
  let g = S.path(`M${f(x - 140)} ${f(y + 40)} L${f(ax)} ${f(ay)}`, ln(6, '#FFFFFF')) + S.path(`M${f(x - 140)} ${f(y + 40)} L${f(ax)} ${f(ay)}`, ln(3, LINE)) + S.circle(ax, ay, 9, ol('#FFFFFF', 3));
  let c = S.rect(-210, -70, 420, 140, 6, ol('#F4F1E8', 5)) + S.rect(-196, -56, 392, 112, 2, { fill: 'none', stroke: '#B8B0A0', 'stroke-width': 2 });
  c += TF('FIG. 1', 0, -18, 28, '#6A6458', { 'letter-spacing': 6, 'font-weight': 600 }) + TF('A CHAIR.', 0, 32, 46, '#2A2A30', { 'letter-spacing': 3 });
  g += S.g(c, tf(x, y, ease.outBack(clamp(k, 0, 1)), 0));
  return g;
}

// ---------------------------------------------------------------- "LOSING STREAK x47" badge
function streakBadge(x, y, k, t) {
  if (k <= 0.01) return '';
  let g = S.rect(-250 + 10, -60 + 12, 500, 120, 60, { fill: '#000', opacity: 0.3 }) + S.rect(-250, -60, 500, 120, 60, ol('#2A0C12', 7)) + S.rect(-238, -48, 476, 96, 48, { fill: 'none', stroke: '#FF4B5C', 'stroke-width': 4 });
  g += S.path('M-196 -26 L-196 22 M-212 6 L-196 26 L-180 6', ln(10, '#FF4B5C'));
  g += TF('LOSING STREAK', 10, -8, 30, '#FF9AA6', { 'letter-spacing': 2 }) + T('x47', 10, 40, 50, '#FFFFFF', { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke' });
  g += S.path(starD(22), { ...ol('#FFD21F', 4), transform: `translate(${f(200)} 0) rotate(${f(t * 90)})` });
  return S.g(g, tf(x, y, ease.outBack(clamp(k, 0, 1)), -4));
}

// ---------------------------------------------------------------- "SATURDAY · 8:00 AM" title chip
function dayChip(x, y, k, text) {
  if (k <= 0.01) return '';
  const w_ = text.length * 26 + 90;
  return S.g(S.rect(-w_ / 2 + 8, -44 + 10, w_, 88, 30, { fill: '#000', opacity: 0.25 }) + S.rect(-w_ / 2, -44, w_, 88, 30, ol('#2A2246', 6)) + TF(esc(text), 0, 15, 44, '#FFE14D', { 'letter-spacing': 3 }), tf(x, y, ease.outBack(clamp(k, 0, 1)), -2));
}

module.exports = {
  timing, LINE, W, H, esc, tf, TS, TFS, pop, at, toScr, shakeAll, clipTo, clipPathD, faceAt, zoomAbout, boing, hop,
  whip, smash, zoomLines, streaks, freeze, nameCard, speech, thought, starD, star, infoCard, bossIcon, bossCard, gameCard,
  volumeOSD, wordChart, argueBoard, pointerStick, boardGame, ramenCup, silhouette, carpet, museumLabel, streakBadge, dayChip,
};
