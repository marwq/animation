// Private helpers for SC 10 (ШОУ ТАЛАНТОВ БЕЗ РЕСПАУНА): the voice-derived cut/beat table (shared with
// audio/cues/gen_sc10.js), the stage layout of the act, cameras with rotation, transitions, the magic table + hat,
// the toppling mic stand and its cable, flying flasks, foam aftermath, disco ball + sweeping colour beams, the cricket,
// the crayon doodle frame, the phone screen, small UI bits ("no checkpoint", snap sparks) and character wrappers.
'use strict';

const K = require('./kit');
const R = require('./respawn');
const SS = require('./sets_school');
const X = require('../rig/extras');
const AC = require('./acting');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;

const LINE = '#151515';
const W = 1920, H = 1080;

// ================================================================ timing (from the voice only)
// times(V) with V = require('./vo'): every cut and beat of the scene. The cue generator calls the same function.
function times(V) {
  const L = V.L;
  const n = Array.from({ length: 17 }, (_, i) => L('10.' + i));
  const w = (i, word, k = 0) => n[i].word(word, k).t0;
  const w1 = (i, word, k = 0) => n[i].word(word, k).t1;
  const START = V.TL.scenes['SC 10'].start, END = V.TL.scenes['SC 11'].start;
  const C = {};
  // --- Friday night, the perfect acts
  C.marquee = START;                              // marquee bulbs, pull back, house lights dim
  C.house = w(0, 'The') - 0.12;                   // the whole school
  C.juggler = w(0, 'And') - 0.15;                 // 7 pins
  C.twins = w(0, 'yours') - 0.1;                  // synchronized twins -> "perfect"
  // --- the family
  C.dad = n[1].a - 0.12;
  C.mom = w(1, 'Mom') - 0.1;
  C.bea = w(1, 'And') - 0.1;
  C.sign = n[1].b + 0.06;                         // the 1 s beat: GO MUSHROOM! close-up
  // --- the announcement
  C.principal = n[2].a - 0.1;
  C.you = w(2, 'you') - 0.08;                     // spotlight finds the hero in the wings
  C.magic = w(2, 'With') - 0.05;                  // marquee flips to SCIENCE MAGIC
  // --- backstage
  C.noCp = n[3].a - 0.1;
  C.noReset = w(3, 'No', 1) - 0.1;
  C.noMenu = w(3, 'No', 2) - 0.1;
  C.justYou = w(3, 'Just') - 0.1;
  C.people = w(3, 'and') - 0.08;
  C.hands = n[4].a - 0.1;
  C.oneTry = w(4, 'Only') - 0.1;
  C.walkOn = n[4].b + 0.05;                       // the silent beat: Ivy strides out into the light
  // --- the act
  C.ladies = n[5].a - 0.12;
  C.hat = w(5, 'From') - 0.1;
  C.walk = w(5, 'I') - 0.1;
  C.foot = w(5, 'pull') - 0.02;
  C.slowmo = w1(5, 'out') - 0.04;
  C.erupt = w(6, 'you') - 0.06;
  C.gasp = n[6].b - 0.04;
  C.silence = n[6].b + 0.45;
  C.reset1 = n[7].a - 0.1;
  C.reset2 = w(7, 'reset', 1) - 0.1;
  C.reset3 = w(7, 'reset', 2) - 0.08;
  C.whisper = n[8].a - 0.1;
  C.letsMake = w(8, "Let's") - 0.1;
  C.slide = n[9].a - 0.05;
  const dive = n[9].a + 0.3, plunge = dive + 0.6;
  C.hesitate = Math.min(Math.max(plunge + 0.4, w(9, 'you', 1)), w(9, 'never') - 0.15);
  C.jump = w(9, 'you', 2) - 0.15;
  // --- the foam disco
  C.disco = n[9].b + 0.2;
  C.disco2 = lerp(C.disco, n[10].a - 0.1, 0.5);   // the disco beat is long: two shots
  C.foam1 = n[10].a - 0.1;
  C.foam2 = w(10, 'FOAM', 1) - 0.06;
  C.foam3 = w(10, 'FOAM', 2) - 0.06;
  C.foam4 = w(10, 'FOAM', 3) - 0.06;
  C.mom2 = n[11].a - 0.12;
  C.phone = w(11, 'WHOLE') - 0.15;
  C.bea2 = n[12].a - 0.1;
  C.mushroom = w(12, "He's") - 0.1;
  C.best = n[13].a - 0.12;
  // --- trophies + the end
  C.noWin = n[14].a - 0.1;
  C.pins = w(14, 'The') - 0.1;
  C.fair = w(14, 'Honestly') - 0.1;
  C.unforget = n[15].a - 0.1;
  C.final = n[16].a - 0.1;
  C.final2 = n[16].b + 0.15;                      // pull back: the whole house on its feet

  // beats / hits
  const B = {};
  B.lightsOut = w1(0, 'there');                   // house lights fully down
  B.pin = w(0, 'act');                            // juggler: pin flourish
  B.perfect = w(0, 'perfect');                    // twins' final pose
  B.dadWave = w(1, 'Dad');
  B.momSit = w(1, 'shift');                       // Mom drops into her seat
  B.signUp = w(1, 'sign');                        // Bea lifts the sign
  B.next = w(2, 'next');
  B.squint = w1(2, 'and', 1);                     // she squints at the card ("Ivy and... ")
  B.spot = w(2, 'you');                           // the spotlight hits him
  B.banner = w(2, 'Science');                     // marquee flips
  B.cp = w(3, 'checkpoint');
  B.reset = w(3, 'reset');
  B.snap = w(3, 'pause') - 0.05;                  // snap -> the broken menu
  B.four = w(3, 'four');
  B.people = w1(3, 'people');
  B.one = w(4, 'One');
  B.only = w(4, 'Only');
  B.spots = n[5].a - 0.02;                        // spotlights slam on
  B.gentlemen = w(5, 'gentlemen');
  B.hatShow = w(5, 'hat');
  B.trip = w(5, 'pull') + 0.12;                   // the foot hooks the cable
  B.land = w(6, 'you');                           // flask drops into the hat
  B.erupt = B.land + 0.06;
  B.splat = w(6, 'up') + 0.04;                    // the foam lands on the principal
  B.gasp = n[6].b;
  B.chirp1 = n[6].b + 0.75;
  B.drip = n[7].a - 0.32;
  B.snap1 = w(7, 'reset') + 0.12;
  B.snap2 = w(7, 'reset', 1) + 0.12;
  B.scream = w(7, 'reset', 2);
  B.book = w(8, 'Fail');
  B.n313 = w(8, 'thirteen');
  B.wink = w(8, 'good');
  B.dive = dive;
  B.plunge = plunge;
  B.gulp = w(9, 'never');
  B.breath = w(9, 'before');
  B.leap = Math.max(C.jump + 0.35, w(9, 'going') - 0.1);
  B.splash = n[9].b;
  B.ball = C.disco + 0.1;
  B.chant = [0, 1, 2, 3].map((k) => w(10, 'FOAM', k));
  B.sent = w(11, 'family');
  B.brother = w(12, 'BROTHER');
  B.mush = w(12, 'mushroom');
  B.best = w(13, 'Best');
  B.disaster = w(13, 'Disaster');
  B.ever = w(13, 'Ever');
  B.smile = n[13].b + 0.2;                        // the stern principal cracks a tiny smile
  B.notWin = w(14, 'win');
  B.won = w(14, 'won');
  B.fair = w(14, 'Fair');
  B.most = w(15, 'Most');
  B.see = w(16, 'See');
  B.told = w(16, 'Told');
  B.fun = w(16, 'fun');
  return { START, END, n, w, w1, C, B };
}

// ================================================================ the stage layout of the act (stage view, world px)
const ST = {
  floor: 770, s: 0.45,
  ivy: 830, table: 1060, mic: 1300, prin: 1480, trip: 470, wingX: 150,
  tableTop: 612,                           // table surface y
  hatS: 0.5,                               // hat scale; crown 190·s below the opening
};
ST.hat = { x: ST.table, y: ST.tableTop - 190 * ST.hatS };   // centre of the hat opening (mouth up)
ST.fall = 500;                             // where the hero ends face-down after the trip (hip x; head reaches ~740)
ST.mound = { x: 1390, w: 560, h: 240 };    // the big foam mound (buries the principal up to the shoulders)
ST.stache = { x: ST.prin + 2, y: 444, s: 0.46 };   // under the principal's nose
// the mic cable from the mic base to the left wing; the hero trips at ST.trip
const CABLE = [[ST.mic, 776], [1150, 794], [960, 792], [760, 786], [600, 776], [ST.trip, 770], [360, 758], [250, 740], [140, 728]];

// ================================================================ camera
const at = (wx, wy, zoom = 1, rot = 0) => ({ zoom, x: wx - 960, y: wy - 540, rot });
const toScr = (cam, x, y) => { const z = cam.zoom ?? 1; return [960 + (cam.sx || 0) + z * (x - 960 - (cam.x || 0)), 540 + (cam.sy || 0) + z * (y - 540 - (cam.y || 0))]; };
function camTf(cam, k = 1) {
  const base = SS.camTf(cam, k);
  return cam.rot ? `rotate(${f(cam.rot * k)} 960 540) ${base}` : base;
}
const view = (cam, inner, k = 1) => (inner ? S.g(inner, camTf(cam, k)) : '');
function shook(cam, t, list) {
  const c = { ...cam };
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); c.sx = (c.sx || 0) + s.sx; c.sy = (c.sy || 0) + s.sy; }
  return c;
}
// lerp between two cams with an easing
function camLerp(a, b, u, e = ease.inOut) {
  const k = e(clamp(u, 0, 1));
  const o = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) o[key] = lerp(a[key] ?? 0, b[key] ?? 0, k);
  return o;
}

// ================================================================ transitions / accents
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
  return S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.55 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const flashAt = (t, tc, dur = 0.16, a = 0.8, col = '#FFFFFF') => (t >= tc && t < tc + dur ? R.flash(a * (1 - (t - tc) / dur), col) : '');
// radial zoom lines around (cx, cy) for punchlines (k 0..1)
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22) {
  if (k <= 0.01) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, r0 = 420 + hash(i + Math.floor(t * 12)) * 160, r1 = r0 + 600;
    const wd = 8 + hash(i * 1.7) * 12;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * wd, ny = ax * wd;
    d += `M${f(cx + ax * r0)} ${f(cy + ay * r0)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.7 * k) });
}
// cinema letterbox (slow-mo, the hesitation)
const letterbox = (k, h = 92) => (k > 0.01 ? S.rect(0, 0, W, h * k, 0, { fill: '#05030A' }) + S.rect(0, H - h * k, W, h * k, 0, { fill: '#05030A' }) : '');
// cool "slow motion" grade: blue wash + drifting light streaks (screen space)
function slowGrade(t, k) {
  if (k <= 0.01) return '';
  let o = S.rect(0, 0, W, H, 0, { fill: '#3A4AA8', opacity: f(0.16 * k) });
  let d = '';
  for (let i = 0; i < 9; i++) {
    const y = 120 + hash(i * 4.1) * 840, x = ((hash(i * 2.3) * 2400 + t * (60 + 40 * hash(i))) % 2400) - 240;
    d += `M${f(x)} ${f(y)}h${f(160 + 200 * hash(i * 7.7))}`;
  }
  return o + S.path(d, ln(5, '#DDE6FF', 0.35 * k)) + letterbox(k);
}
// pop-in scale for UI
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
// outlined lettering
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.14, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;

// ================================================================ stage props
// magician's pedestal table (x = centre, top = surface y, floor = foot y)
function magicTable(x, top = ST.tableTop, floor = ST.floor, s = 1) {
  const w = 96 * s;
  let o = S.path(`M${f(x - 46 * s)} ${f(floor)} L${f(x + 46 * s)} ${f(floor)} L${f(x + 18 * s)} ${f(floor - 16 * s)} L${f(x - 18 * s)} ${f(floor - 16 * s)} Z`, ol('#2A1E3A', 5));
  o += S.rect(x - 9 * s, top + 20 * s, 18 * s, floor - top - 34 * s, 4, ol('#E8B84A', 4));
  // draped cloth with gold fringe + a star
  o += S.path(`M${f(x - w)} ${f(top)} L${f(x + w)} ${f(top)} L${f(x + w * 0.92)} ${f(top + 64 * s)} Q${f(x)} ${f(top + 80 * s)} ${f(x - w * 0.92)} ${f(top + 64 * s)} Z`, ol('#B3164C', 5));
  o += S.path(`M${f(x - w * 0.92)} ${f(top + 64 * s)} Q${f(x)} ${f(top + 80 * s)} ${f(x + w * 0.92)} ${f(top + 64 * s)}`, ln(7 * s, '#E8B84A'));
  o += S.ellipse(x, top, w, 14 * s, ol('#D6336C', 5)) + S.path(starPath(x, top + 36 * s, 16 * s), ol('#FFD23F', 3));
  return o;
}
function starPath(cx, cy, r) {
  const p = [];
  for (let i = 0; i < 10; i++) { const a = (-90 + i * 36) * Math.PI / 180, rr = i % 2 ? r * 0.46 : r; p.push(`${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`); }
  return 'M' + p.join(' L') + 'Z';
}
// the hat on the table (mouth up), wobbling when hit; foam spilling from it (k)
function tableHat(t, wob = 0, foam = 0) {
  const r = Math.sin(t * 40) * 6 * wob;
  return X.topHat({ x: ST.hat.x, y: ST.hat.y, s: ST.hatS, rot: r, mouth: 'up', foam: 0 }) + (foam > 0 ? R.foamBlobs(ST.hat.x, ST.hat.y - 10, 0.9, foam, 7, { t }) : '');
}
// magic wand (grip at 0,0), body units of the holder
const wand = (rot = 0, s = 1) => S.g(S.rect(-8, -170, 16, 190, 6, ol('#1E1A26', 4)) + S.rect(-8, -170, 16, 34, 5, ol('#FFFFFF', 4)), `rotate(${f(rot)}) scale(${f(s)})`);
// the mic stand (like the set's, boom to the right), tipping over `tip` degrees around its base (- = to the left)
function micStand(x, y, s = 0.95, tip = 0) {
  let o = S.path('M0 0 L-46 14 M0 0 L46 14 M0 0 L0 18', ln(10, LINE)) + S.path('M0 0 L-46 14 M0 0 L46 14 M0 0 L0 18', ln(5, '#5A6070'));
  o += S.path('M0 0 V-300', ln(12, LINE)) + S.path('M0 0 V-300', ln(6, '#9AA4B8')) + S.path('M0 -300 L26 -338', ln(10, LINE)) + S.path('M0 -300 L26 -338', ln(5, '#9AA4B8'));
  o += S.g(S.rect(-14, -40, 28, 52, 12, ol('#2A2E3A', 4)) + S.rect(-12, -38, 24, 26, 10, { fill: '#5A6070' }) + S.path('M-10 -30 H10 M-10 -22 H10', ln(2, '#2A2E3A')), 'translate(30 -344) rotate(30)');
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})${tip ? ` rotate(${f(tip)} 0 0)` : ''}`);
}
// the cable: snag 0..1 lifts a loop around the trip point (pulled by the foot), pull drags it toward the hero
function cable(snag = 0, footX = ST.trip, tipped = 0) {
  const pts = CABLE.map(([x, y], i) => {
    let yy = y, xx = x;
    const d = Math.abs(x - footX);
    if (snag > 0 && d < 160) yy -= snag * 46 * (1 - d / 160);
    if (i === 0 && tipped) { xx = x - 20 * tipped; }
    return [xx, yy];
  });
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; d += ` Q${f(x0)} ${f(y0)} ${f((x0 + x1) / 2)} ${f((y0 + y1) / 2)}`; }
  d += ` L${f(pts[pts.length - 1][0])} ${f(pts[pts.length - 1][1])}`;
  return S.path(d, ln(12, LINE)) + S.path(d, ln(6, '#2E3442'));
}
// broken glass + coloured puddles (after the crash)
function shards(x, y, k = 1, col = '#FF6FA8', seed = 1) {
  if (k <= 0.01) return '';
  let o = S.ellipse(x, y + 4, 70 * k, 14 * k, { fill: col, opacity: 0.75, stroke: LINE, 'stroke-width': 3 });
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = hash(i * 3.3 + seed) * Math.PI * 2, r = 40 + 50 * hash(i * 1.9 + seed), px = x + Math.cos(a) * r * k, py = y + Math.sin(a) * r * 0.25 * k;
    d += `M${f(px)} ${f(py - 12)} l8 10 l-12 6 Z `;
  }
  return o + S.path(d, { fill: '#DFF4FF', stroke: LINE, 'stroke-width': 2.5 });
}
// falling foam drips from a point (loop), k = amount
function drips(x, y, t, k = 1, o = {}) {
  if (k <= 0.01) return '';
  const { n = 3, fall = 220, spread = 60, seed = 1, rate = 0.9, r = 9 } = o;
  let d = '';
  for (let i = 0; i < n; i++) {
    const ph = ((t * rate + hash(i * 3.1 + seed)) % 1 + 1) % 1;
    const px = x + (hash(i * 5.3 + seed) - 0.5) * spread, py = y + ph * ph * fall;
    const rr = r * (1 - 0.3 * ph);
    d += `M${f(px)} ${f(py - rr * 1.6)} Q${f(px + rr)} ${f(py)} ${f(px)} ${f(py + rr)} Q${f(px - rr)} ${f(py)} ${f(px)} ${f(py - rr * 1.6)}Z `;
  }
  return S.path(d, { fill: '#FFFFFF', stroke: '#5A6A80', 'stroke-width': 3, opacity: f(k) });
}
// one drip hanging + falling at time tf (from (x, y)), for the "plip"
function dropAt(x, y, t, tf, len = 160) {
  const g = seg(t, tf - 0.5, tf), fall = t > tf ? (t - tf) * (t - tf) * 2200 : 0;
  if (fall > len + 40) return '';
  const rr = 8 + 6 * g;
  const py = y + 6 + rr * g + fall;
  return S.path(`M${f(x)} ${f(py - rr * 1.7)} Q${f(x + rr)} ${f(py)} ${f(x)} ${f(py + rr)} Q${f(x - rr)} ${f(py)} ${f(x)} ${f(py - rr * 1.7)}Z`, { fill: '#FFFFFF', stroke: '#5A6A80', 'stroke-width': 3 });
}
// the cricket (tiny, at the stage lip): legs rub on chirps
function cricket(x, y, s, t, chirpT = []) {
  const on = chirpT.some((c) => t >= c && t < c + 0.4);
  const rub = on ? Math.sin(t * 90) * 8 : 0;
  let o = S.path('M-34 -2 L-60 -40 M-26 -4 L-44 22 M20 -4 L38 24', ln(5, '#2E5A1E'));
  o += S.path(`M-10 -14 L${f(-40 + rub * 0.4)} ${f(-46 - rub)} L-70 6`, ln(6, '#2E5A1E'));
  o += S.ellipse(0, -10, 46, 18, ol('#5BAA3A', 4)) + S.ellipse(34, -16, 18, 15, ol('#4E9A30', 4)) + S.circle(42, -20, 4, { fill: LINE });
  o += S.path('M46 -28 Q90 -90 130 -80 M40 -30 Q60 -100 100 -110', ln(3, '#2E5A1E'));
  let txt = '';
  chirpT.forEach((c, i) => { const k = seg(t, c, c + 0.12) * (1 - seg(t, c + 0.5, c + 0.7)); if (k > 0) txt += TF('chirp', 60 + i * 26, -80 - 30 * seg(t, c, c + 0.7), 30, '#D8FFC0', { opacity: f(k), 'font-style': 'italic' }); });
  return S.g(o + txt, tf(x, y, s));
}

// ================================================================ foam aftermath on stage
// the foam landscape after the eruption: k = amount (0..1 grows them in); slip = the floor carpet
function foamScape(t, k = 1, o = {}) {
  if (k <= 0.01) return { back: '', front: '' };
  const g = ease.out(clamp(k, 0, 1));
  let back = '', front = '';
  // a thin carpet of foam across the stage floor (slippery)
  back += R.foamPile(1060, 784, 820 * g, 60 * g, { t, seed: 11, stripes: false });
  // the table pile
  back += R.foamPile(ST.table, 776, 300 * g, 130 * g, { t, seed: 5 });
  // the big mound that buries the principal (drawn in FRONT of her)
  const M = ST.mound;
  front += R.foamPile(M.x, 776, M.w * g, M.h * g * (o.moundH ?? 1), { t, seed: 2 });
  front += R.foamPile(M.x + 250, 780, 260 * g, 150 * g, { t, seed: 8 });
  return { back, front };
}
// foam on the marquee banner's right end (+ drips)
const bannerFoam = (t, k = 1) => (k > 0.01 ? R.foamBlobs(1300, 140, 0.9, k, 4, { t }) + drips(1300, 170, t, k, { n: 2, fall: 160, spread: 50, seed: 4 }) : '');

// ================================================================ party lights
// coloured beams sweeping from the top (world px), k = intensity
const BEAM_COLS = ['#FF4FD8', '#3FE0FF', '#FFE14D', '#6BFF8A', '#9B6BFF'];
function beams(t, k = 1, o = {}) {
  if (k <= 0.01) return '';
  const { n = 5, x0 = 260, x1 = 1660, top = -200, floor = 790, w = 240, speed = 1 } = o;
  let out = '';
  for (let i = 0; i < n; i++) {
    const src = lerp(x0, x1, (i + 0.5) / n);
    const sw = Math.sin(t * (1.3 + 0.37 * i) * speed + i * 1.7) * 420;
    const px = src + sw, col = BEAM_COLS[i % BEAM_COLS.length];
    out += S.path(`M${f(src - 20)} ${top} L${f(src + 20)} ${top} L${f(px + w / 2)} ${floor} L${f(px - w / 2)} ${floor} Z`, { fill: col, opacity: f(0.16 * k) });
    out += S.ellipse(px, floor - 6, w * 0.55, 26, { fill: col, opacity: f(0.3 * k) });
  }
  return out;
}
// disco ball hanging from y0 (descends with k), sparkle specks over the scene
function discoBall(x, y, r, t, k = 1, y0 = -400) {
  if (k <= 0.01) return '';
  const yy = lerp(y0, y, ease.outBack(clamp(k, 0, 1)));
  let o = S.path(`M${f(x)} ${f(y0 - 600)} L${f(x)} ${f(yy - r)}`, ln(5, '#2A2032'));
  o += S.circle(x, yy, r, ol('#B9C2D2', 6));
  let tiles = '';
  const rot = t * 1.6;
  for (let j = -3; j <= 3; j++) {
    const lat = (j / 4) * Math.PI / 2, cy = yy + Math.sin(lat) * r, rr = Math.cos(lat) * r;
    for (let i = 0; i < 8; i++) {
      const a = rot + (i / 8) * Math.PI * 2, c = Math.cos(a);
      if (c < 0) continue;
      const cx = x + Math.sin(a) * rr, sz = 6 + 7 * c * Math.cos(lat);
      const lit = (i + j + Math.floor(t * 8)) % 3 === 0;
      tiles += `M${f(cx - sz)} ${f(cy - sz * 0.8)}h${f(sz * 2)}v${f(sz * 1.6)}h${f(-sz * 2)}Z`;
      if (lit) tiles += '';
    }
  }
  o += S.path(tiles, { fill: '#E6ECF6', stroke: '#7E8798', 'stroke-width': 2 });
  o += S.path(`M${f(x - r * 0.5)} ${f(yy - r * 0.55)} Q${f(x - r * 0.2)} ${f(yy - r * 0.85)} ${f(x + r * 0.2)} ${f(yy - r * 0.8)}`, ln(8, '#FFFFFF', 0.9));
  o += K.F.sparkle(x + r * 0.5, yy - r * 0.4, 18 * (0.6 + 0.4 * Math.sin(t * 9)));
  return o;
}
// light specks flying around the room from the disco ball (screen or world px)
function specks(t, k = 1, o = {}) {
  if (k <= 0.01) return '';
  const { n = 34, x0 = 0, x1 = W, y0 = 0, y1 = H, seed = 3 } = o;
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + (((hash(i * 1.7 + seed) * (x1 - x0) + t * (80 + 60 * hash(i))) % (x1 - x0)) + (x1 - x0)) % (x1 - x0);
    const y = y0 + hash(i * 3.9 + seed) * (y1 - y0) + Math.sin(t * 2 + i) * 20;
    const sz = 5 + 5 * hash(i * 2.2);
    d += `M${f(x)} ${f(y - sz)} L${f(x + sz)} ${f(y)} L${f(x)} ${f(y + sz)} L${f(x - sz)} ${f(y)}Z`;
  }
  return S.path(d, { fill: '#FFFFFF', opacity: f(0.75 * k) });
}
// soap bubbles drifting up (world px)
function bubbles(t, k = 1, o = {}) {
  if (k <= 0.01) return '';
  const { n = 14, x0 = 300, x1 = 1700, y0 = 800, rise = 700, seed = 2 } = o;
  let d = '', hl = '';
  for (let i = 0; i < n; i++) {
    const ph = ((t * (0.18 + 0.1 * hash(i * 2.1 + seed)) + hash(i * 4.4 + seed)) % 1 + 1) % 1;
    const x = lerp(x0, x1, hash(i * 1.3 + seed)) + Math.sin(t * 1.5 + i) * 30, y = y0 - ph * rise, r = 10 + 16 * hash(i * 6.1 + seed);
    d += `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
    hl += `M${f(x - r * 0.5)} ${f(y - r * 0.3)}q${f(r * 0.2)} ${f(-r * 0.4)} ${f(r * 0.55)} ${f(-r * 0.4)}`;
  }
  return S.path(d, { fill: '#DDF4FF', 'fill-opacity': f(0.25 * k), stroke: '#FFFFFF', 'stroke-width': 3, 'stroke-opacity': f(0.8 * k) }) + S.path(hl, ln(3, '#FFFFFF', 0.9 * k));
}

// ================================================================ small UI / FX
// "No checkpoint": dashed outline of the flag where it used to be + a red X badge (k pops it in)
function missingFlag(x, y, s, k, t) {
  if (k <= 0.01) return '';
  const sc = ease.outBack(clamp(k, 0, 1)) * s;
  let o = S.path('M0 0 V-300 M0 -300 L150 -262 L0 -222', { fill: 'none', stroke: '#9AE8B6', 'stroke-width': 8, 'stroke-dasharray': '18 14', 'stroke-linecap': 'round', opacity: f(0.55 + 0.25 * Math.sin(t * 8)) });
  o += S.ellipse(0, 6, 90, 22, { fill: 'none', stroke: '#9AE8B6', 'stroke-width': 6, 'stroke-dasharray': '14 12', opacity: 0.5 });
  o += S.circle(110, -330, 44, ol('#FF3B4E', 6)) + S.path('M88 -352 L132 -308 M132 -352 L88 -308', ln(12, '#FFFFFF'));
  return S.g(o, tf(x, y, sc));
}
// a greyed-out RESET button with a padlock (screen px)
function lockedButton(x, y, k, t, label = 'RESET CHARACTER') {
  if (k <= 0.01) return '';
  const sc = ease.outBack(clamp(k, 0, 1));
  let o = S.rect(-300, -54, 600, 108, 30, { fill: '#2A2E3A', stroke: '#5A6070', 'stroke-width': 6, opacity: 0.92 });
  o += S.circle(-226, 0, 30, ol('#5A6070', 4)) + S.path('M-238 -2 L-238 -14 Q-226 -34 -214 -14 L-214 -2', ln(6, '#2A2E3A'));
  o += S.rect(-246, -6, 40, 30, 6, ol('#8E96A6', 4));
  o += TF(label, 40, 14, 40, '#7E8596', { 'letter-spacing': 2 });
  o += S.path('M-260 0 H290', ln(6, '#FF3B4E', 0.85));
  return S.g(o, tf(x, y, sc));
}
// finger-snap sparks at (x, y) (screen or world), age seconds since the snap
function snapFx(x, y, age, s = 1, col = '#FFFFFF') {
  if (age < 0 || age > 0.35) return '';
  const k = age / 0.35;
  let d = '';
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 - 0.4, r0 = (24 + 40 * k) * s, r1 = r0 + 34 * (1 - k) * s;
    d += `M${f(x + Math.cos(a) * r0)} ${f(y + Math.sin(a) * r0)} L${f(x + Math.cos(a) * r1)} ${f(y + Math.sin(a) * r1)} `;
  }
  return S.path(d, ln(8 * s * (1 - k) + 2, col)) + TFS('snap!', x + 90 * s, y - 50 * s, 34 * s, '#FFFFFF', { opacity: f(1 - k) });
}
// crayon doodle outline around a point (Bea's sign style), k draws it on
function crayonFrame(cx, cy, rx, ry, k, t, col = '#FF8A2A') {
  if (k <= 0.01) return '';
  let d = '';
  const n = 40, m = Math.ceil(n * clamp(k, 0, 1));
  for (let i = 0; i <= m; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2, wob = 1 + 0.05 * Math.sin(i * 2.7 + Math.floor(t * 6));
    d += (i ? 'L' : 'M') + `${f(cx + Math.cos(a) * rx * wob)} ${f(cy + Math.sin(a) * ry * wob)}`;
  }
  return S.path(d, { fill: 'none', stroke: col, 'stroke-width': 12, 'stroke-dasharray': '22 6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
}
// crayon lettering (wobbly colourful letters)
function crayonText(txt, x, y, size, t, k = 1, seed = 0) {
  if (k <= 0.01) return '';
  const cols = ['#E8453C', '#FF8A3D', '#2E7BD1', '#3BAA4A', '#B06BFF', '#FF6FA8'];
  const step = size * 0.62, x0 = x - (txt.length - 1) * step / 2;
  let o = '';
  const nShow = Math.ceil(txt.length * clamp(k, 0, 1));
  for (let i = 0; i < nShow; i++) {
    const ch = txt[i]; if (ch === ' ') continue;
    const r = (hash(i * 3 + seed) - 0.5) * 18 + Math.sin(t * 3 + i) * 3, c = cols[(i + seed) % cols.length];
    o += T(ch, x0 + i * step, y + (hash(i + seed) - 0.5) * 12, size, c, { stroke: '#FFFFFF', 'stroke-width': size * 0.18, 'paint-order': 'stroke', transform: `rotate(${f(r)} ${f(x0 + i * step)} ${f(y)})` });
  }
  return o;
}
// phone screen UI for Mom's video: progress bar "SENDING TO: WHOLE FAMILY"
function sendUI(k, sent, t) {
  let o = S.rect(-140, 170, 280, 96, 18, { fill: '#10162A', opacity: 0.88 });
  o += TF(sent > 0.5 ? 'SENT!' : 'SENDING TO:', 0, 202, 22, sent > 0.5 ? '#3DDC84' : '#9AA6C0');
  o += TF('WHOLE FAMILY (47)', 0, 230, 24, '#FFFFFF');
  o += S.rect(-110, 242, 220, 12, 6, { fill: '#2A3350' }) + S.rect(-110, 242, 220 * clamp(k, 0, 1), 12, 6, { fill: '#3DDC84' });
  if (sent > 0) o += S.g(S.circle(0, 0, 40, ol('#3DDC84', 5)) + S.path('M-18 0 L-4 14 L20 -14', ln(10, '#FFFFFF')), tf(96, 120, ease.outBack(sent)));
  // REC dot + time
  o += S.circle(-110, -236, 9, { fill: '#FF3B4E', opacity: f(0.5 + 0.5 * Math.sin(t * 8)) }) + TF('REC 0:47', -50, -228, 22, '#FFFFFF');
  return o;
}

// ================================================================ characters
const actor = K.actor;
// a rig character "sitting" in the foam: drawn standing lower (legs hidden by a foreground pile)
// lying face-down on the floor (side view, flipped = head to the right), x = hip centre
function lying(name, t, x, y, s, o = {}) {
  return actor(name, t, { x, y: y + 395 * s, s, view: 'side', flip: true, rot: -88, armL: 150, armR: 140, legL: -6, legR: 6, kneeL: 10, kneeR: 4, shadow: false, ...o }, { arms: false, energy: 0.2 });
}

module.exports = {
  times, ST, CABLE, LINE, W, H,
  at, toScr, camTf, view, shook, camLerp, whip, flashAt, zoomLines, letterbox, slowGrade, pop, TS, TFS, tf,
  magicTable, tableHat, wand, micStand, cable, shards, drips, dropAt, cricket, foamScape, bannerFoam,
  beams, discoBall, specks, bubbles, missingFlag, lockedButton, snapFx, crayonFrame, crayonText, sendUI, lying, starPath,
};
