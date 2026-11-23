// SC 02 — part 1: Cube City by day (the legend, the stats, the castle tour, Noodle, the Block King teaser, DarkBlade).
// Used by scenes/s02.js (which owns the dispatch); every time comes from the voice through s02_env.timing().
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const G = require('./gameui');
const R = require('./respawn');
const GS = require('./sets_game');
const H = require('./sets_house');
const X = require('../rig/extras');
const AC = require('./acting');
const E = require('./s02_env');
const CAST = require('../rig/cast');
const { tf, TS, TFS, pop, at, toScr, shakeAll, clipTo, faceAt, boing, hop, whip, smash, zoomLines, streaks, freeze, nameCard, speech, thought, star, infoCard, bossCard, ramenCup, silhouette, carpet, museumLabel, streakBadge } = E;

const { C, b, T0 } = E.timing();
const W = 1920, H_ = 1080;
const SPT = GS.SPOTS.tycoon, SPI = GS.SPOTS.castleInterior, SPA = GS.SPOTS.arena, SPC = GS.SPOTS.cityDay;

// ---------------------------------------------------------------- small composition helpers
// camera set: characters behind the front layer + on the floor (world, k 1)
function camSet(set, t, cam, o, behind = '', floor = '', extraMid = '') {
  const Ls = set.layers(t, cam, o);
  return Ls.bg + Ls.mid + view(cam, extraMid + behind) + Ls.front + view(cam, floor) + Ls.fg + Ls.light;
}
const castleRoom = (t, cam, behind = '', floor = '', o = {}) => GS.castleInterior.compose(t, o, behind, floor, cam);
// the hero in the game: crown + YOU · LVL 99 tag
// CHEAP: no body-volume filter (a game frame drawn inside a device screen at a huge zoom)
let CHEAP = false;
const nv = (pose) => (CHEAP ? { ...pose, volume: false } : pose);
const hero = (t, pose, act) => actor('you', t, nv({ crown: true, nametag: 'YOU', ...pose }), act);
const noodle = (t, pose, act) => actor('noodle', t, nv(pose), act);
const blade = (t, pose, act) => actor('darkblade', t, nv(pose), act);
const clan = (t, i, pose) => actor('clan', t, nv({ i, ...pose }));
const sparkleAt = (x, y, r, col = '#FFFFFF') => (r > 0.5 ? K.F.sparkle(x, y, r, col) : '');
// side-view walk / run poses
const walkP = (t, k = 9, amp = 1) => AC.walk(t * k, amp);
const runP = (t, k = 14, amp = 1) => AC.run(t * k, amp);

// ================================================================= 1. "This is you." — Cube City by day, crane down, freeze
function shOpen(t) {
  const fz = b.you + 0.06;
  const ft = Math.min(t, fz);
  const tLand = T0 + 0.42;
  const cam = shakeAll(camKeys(ft, [[T0, { zoom: 1.0, x: 0, y: 0 }], [tLand, { zoom: 1.08, x: 0, y: 30 }], [b.you - 0.08, { zoom: 1.3, x: 0, y: 110 }]], ease.inOut), ft, [[tLand, 0.3, 12]]);
  const Lc = GS.cityDay.layers(ft, cam, {});
  const turned = ft >= b.you - 0.06;
  const drop = ft < tLand ? 1200 * (1 - ease.in(seg(ft, T0 + 0.05, tLand))) : 0;
  const pose = {
    x: 960, y: 990, s: 0.45, view: turned ? 'front' : 'back', lift: drop + hop(ft, b.you - 0.16, 0.4, 90), ...boing(ft, tLand, 0.22),
    armL: turned ? 150 : 8 + 3 * Math.sin(ft * 3), armR: turned ? 120 : 8 + 3 * Math.sin(ft * 3 + 1), legL: turned ? 18 : 0, legR: turned ? -10 : 0,
    face: turned ? { name: 'joy', mouth: 'grin' } : { name: 'neutral' },
  };
  let o = Lc.bg + Lc.mid + view(cam, (ft > tLand ? K.C.dust(860, 990, tLand, ft) + K.C.dust(1060, 990, tLand + 0.02, ft) : '') + hero(ft, pose, { arms: false })) + Lc.light;
  const fk = seg(t, fz, fz + 0.14);
  o = freeze(o, fk, -2.5);
  if (t >= fz) {
    o += nameCard(t, fz + 0.02, 1470, 300, 'YOU', 'LVL 99 · THE HERO', '#FF8A2B', { ax: 1100, ay: 420 });
    o += smash(t, fz, 0.1, 0.7);
  }
  // hand-over from SC01's rewind: VHS PLAY tail + white flash
  const v = 1 - seg(t, T0, T0 + 0.4);
  if (v > 0) o += K.C.vhs(t, '▶ PLAY', v) + K.C.whiteFlash(0.8 * (1 - seg(t, T0, T0 + 0.22)));
  return o;
}

// ================================================================= 2. "In real life, you're just a kid." — the school photo
function photoBackdrop() {
  let g = S.rect(600, 200, 720, 540, 0, { fill: '#5B8ED4' });
  const blobs = [[700, 260, 260, 180, '#7DB0EC'], [1180, 330, 300, 200, '#4677C2'], [900, 620, 360, 180, '#3F6CB4'], [1240, 660, 200, 160, '#6FA2E2'], [640, 560, 200, 220, '#82B6F0']];
  for (const [x, y, rx, ry, c] of blobs) g += S.ellipse(x, y, rx, ry, { fill: c, opacity: 0.55 });
  g += S.ellipse(960, 380, 300, 220, { fill: '#BFDcFF', opacity: 0.35 });
  return g;
}
function shPhoto(t) {
  const flashT = b.kid - 0.04;
  const ft = Math.min(t, flashT);
  const k = pop(t, C.photo, 0.32);
  let o = S.rect(0, 0, W, H_, 0, { fill: '#EADBC2' }) + S.rect(0, 0, W, H_, 0, { fill: 'url(#s02Paper)' });
  // the photo
  const closed = t >= flashT;
  const face = closed ? { name: 'happy', eyes: { type: 'closed' }, mouth: 'grin', fx: [] } : { name: 'nervous', mouth: 'grin', fx: t > b.real ? ['sweat'] : [], eyes: { look: [0, 0] } };
  const kid = actor('you', ft, { x: 960, y: faceAt(445, 0.72), s: 0.72, armL: 6, armR: 6, headRot: closed ? 4 : 2 * Math.sin(ft * 2), face }, { arms: false });
  let ph = S.rect(560 + 14, 170 + 18, 800, 700, 10, { fill: '#000', opacity: 0.25 }) + S.rect(560, 170, 800, 700, 10, ol('#FFFFFF', 6));
  ph += clipTo(600, 200, 720, 540, photoBackdrop() + kid);
  ph += S.rect(600, 200, 720, 540, 0, { fill: 'none', stroke: '#151515', 'stroke-width': 4 });
  ph += TF('me · 6th grade', 960, 820, 46, '#3A3A60', { 'font-weight': 600, transform: 'rotate(-2 960 820)' });
  // masking tape + REAL LIFE label
  ph += S.g(S.rect(-150, -34, 300, 68, 4, { fill: '#F3E3A8', opacity: 0.92, stroke: '#C9B070', 'stroke-width': 3 }) + TF('REAL LIFE', 0, 14, 38, '#6A5530', { 'letter-spacing': 3 }), 'translate(960 172) rotate(-4)');
  const z = lerp(1, 1.07, seg(t, C.photo, C.legend));
  o += S.g(ph, `translate(960 540) rotate(${f(lerp(-8, -2, k))}) scale(${f(k * z)}) translate(-960 -540)`);
  // the photographer's flash
  if (t >= flashT) o += K.C.whiteFlash(0.95 * (1 - seg(t, flashT, flashT + 0.3)));
  o += G.stamp({ text: 'JUST A KID', x: 1250, y: 740, rot: -12, size: 92, k: seg(t, b.kid + 0.16, b.kid + 0.66), t });
  return o;
}

// ================================================================= 3. "But in Cube City... you're a legend." — crane up the castle
function shLegend(t) {
  const tR = b.legend - 0.22;
  let cam = camKeys(t, [[C.legend, at(-330, 900, 1.0)], [b.cube + 0.7, at(-330, 360, 1.45, 860, 640)], [b.legend - 0.1, at(-330, 310, 1.62, 800, 700)], [C.level, at(-330, 310, 1.75, 790, 706)]]);
  cam = shakeAll(cam, t, [[b.legend, 0.45, 16]]);
  const up = ease.outBack(seg(t, tR, tR + 0.3));
  const kR = seg(t, b.legend - 0.1, b.legend + 0.4);
  let behind = '';
  if (kR > 0) behind += K.rays(-330, 160, 18, 1100, '#FFF3B0', f(0.4 * kR), t * 25);
  const p = { x: -330, y: 310, s: 0.267, sword: 'gold', armR: lerp(28, 172, up), armL: 26, swordGlow: kR, face: t > tR ? { name: 'joy' } : { name: 'smug' }, lift: hop(t, tR, 0.3, 30) };
  let o = camSet(GS.tycoon, t, cam, {}, behind, hero(t, p, { arms: false }));
  if (kR > 0) {
    const [sx, sy] = toScr(cam, -330 + 0.267 * 330, 310 - 0.267 * 1260);
    o += sparkleAt(sx, sy, 60 * bump(t, b.legend - 0.05, b.legend + 0.6), '#FFFFFF') + sparkleAt(sx + 50, sy + 60, 30 * bump(t, b.legend + 0.1, b.legend + 0.7), '#FFE14D');
  }
  o += G.bigTitle({ text: 'LEGEND', theme: 'gold', x: 1400, y: 380, size: 200, k: seg(t, b.legend - 0.06, b.legend + 0.8), rays: false, t, stagger: 0.06 });
  o += K.confetti(t, b.legend + 0.05, 60, 4);
  o += smash(t, b.legend, 0.12, 0.6);
  return o;
}

// ================================================================= 4. "Level ninety-nine." — the LVL montage card
function shLevel(t) {
  let o = S.rect(0, 0, W, H_, 0, { fill: '#FF9A3C' }) + S.rect(-400, -200, 2720, 1480, 0, { fill: 'url(#s02Stripes)', transform: `translate(${f((t * 90) % 170)} 0)` });
  o += K.rays(1300, 470, 18, 1500, '#FFE9A8', f(0.22 + 0.2 * seg(t, b.ninety, b.ninety + 0.3)), t * 18);
  const lv = Math.max(1, Math.round(lerp(1, 99, ease.inOut(seg(t, b.level + 0.1, b.ninety)))));
  const landT = C.level + 0.42;
  const jx = lerp(-260, 560, ease.out(seg(t, C.level, landT)));
  const lift = t < landT ? 320 * Math.sin(seg(t, C.level, landT) * Math.PI) : 0;
  const cheer = t > b.ninety;
  const p = { x: jx, y: 950, s: 0.6, nametag: false, sword: 'gold', armR: cheer ? 172 : 150 + 8 * Math.sin(t * 6), armL: cheer ? 150 : 40, lift, rot: t < landT ? lerp(-25, 0, seg(t, C.level, landT)) : 0, face: cheer ? { name: 'joy' } : { name: 'determined' }, ...boing(t, landT, 0.18), ...boing(t, b.ninety, 0.12) };
  let w = hero(t, p, { arms: false });
  w += G.levelBadge({ x: 1300, y: 470, s: 2.5, level: lv, xp: seg(t, b.level, b.ninety), bump: seg(t, b.ninety, b.ninety + 0.9), t, k: seg(t, C.level + 0.05, C.level + 0.45) });
  const mk = pop(t, b.ninety + 0.25, 0.3);
  if (mk > 0.01) w += S.g(G.ribbon(0, 0, 520, 96, '#FF3B6B', 'MAX LEVEL', 60), tf(1300, 790, mk, -3));
  let cam = { zoom: lerp(1, 1.05, seg(t, C.level, C.base)), x: 0, y: 0 };
  cam = shakeAll(cam, t, [[landT, 0.3, 12], [b.ninety, 0.35, 14]]);
  o += view(cam, w);
  o += smash(t, b.ninety, 0.1, 0.55) + K.confetti(t, b.ninety + 0.05, 40, 7);
  return o;
}

// ================================================================= 5. "The best base in Tycoon Valley." — #1 BASE
function shBase(t) {
  const cam = camKeys(t, [[C.base, at(-330, 470, 0.6)], [C.arena, at(-330, 470, 0.8)]]);
  const R0 = SPT.castle.roof;
  const hp = { x: R0.x, y: R0.y, s: R0.s, armR: 150 + 22 * Math.sin(t * 12), armL: 20, face: { name: 'joy' } };
  let floor = hero(t, hp, { arms: false });
  let o = camSet(GS.tycoon, t, cam, {}, '', floor);
  o += K.badge(960, 175, '#1 BASE', 'TYCOON VALLEY', seg(t, b.best - 0.05, b.best + 0.35), t);
  for (let i = 0; i < 5; i++) {
    const sk = pop(t, b.tycoon + i * 0.11, 0.25);
    if (sk > 0.01) o += S.g(S.path(E.starD(40), ol('#FFD21F', 7)), tf(960 + (i - 2) * 100, 318 - (i % 2 ? 0 : 12), sk, (i - 2) * 6));
  }
  if (t > b.valley) {
    for (let i = 0; i < 6; i++) { const [sx, sy] = toScr(cam, -330 + (hash(i * 3.3) - 0.5) * 900, 300 + hash(i * 7.1) * 420); o += sparkleAt(sx, sy, 34 * bump(t, b.valley + i * 0.07, b.valley + i * 0.07 + 0.6)); }
  }
  return o;
}

// ================================================================= 6. "Two thousand wins in the arena." — KO
function shArena(t) {
  const tHit = b.arena - 0.02, tDash = b.wins - 0.2;
  let cam = camKeys(t, [[C.arena, at(960, 640, 1.12)], [C.one, at(1020, 630, 1.3)]]);
  cam = shakeAll(cam, t, [[tHit, 0.4, 16]]);
  const dash = seg(t, tDash, tHit - 0.12);
  const hx = lerp(700, 1060, ease.inOut(dash));
  const running = dash > 0 && dash < 1;
  const swing = seg(t, tHit - 0.14, tHit + 0.06);
  const hp = { x: hx, y: 900, s: 0.42, view: 'side', flip: true, sword: 'gold', ...(running ? runP(t, 16) : { bodyY: 4 * Math.sin(t * 8) }), armR: lerp(150, 30, ease.out(swing)), armL: running ? 30 : 20, face: { name: 'determined' } };
  if (swing > 0) hp.armR = lerp(150, 25, ease.out(swing));
  let floor = hero(t, hp, { arms: false });
  if (t < tHit) floor += actor('player', t, { i: 3, x: 1290, y: 900, s: 0.42, view: 'side', sword: 'steel', armR: 60 + 10 * Math.sin(t * 7), bodyY: 4 * Math.sin(t * 8 + 1), face: { name: t > tDash ? 'scared' : 'determined' } });
  else floor += G.knockoutFly({ x0: 1290, y0: 900, age: t - tHit, dir: 1, s: 0.42, x1: 1720, y1: 90, cy: 210, svg: actor('player', t, { i: 3, x: 0, y: 0, s: 0.42, nametag: false, face: { name: 'dizzy' } }) });
  floor += G.slash({ x: 1190, y: 690, age: t - (tHit - 0.08), angle: -20, col: '#FFD21F', s: 1 });
  floor += G.hitSpark({ x: 1250, y: 700, age: t - tHit, text: 'POW!' });
  let o = camSet(GS.arena, t, cam, { cheer: t > tHit ? 1 : 0.6, board: ['YOU', '2,000 WINS'] }, '', floor);
  o += G.winsCounter({ x: 50, y: 90, value: 2000, from: 1990, roll: seg(t, b.two, b.wins + 0.15), bump: seg(t, b.wins + 0.15, b.wins + 0.6), t, k: seg(t, C.arena, C.arena + 0.3), anchor: 'left' });
  return o;
}

// ================================================================= 7. "Two thousand and ONE." — +1
function shOne(t) {
  let cam = camKeys(t, [[C.one, at(1060, 690, 1.7, 760, 560)], [C.welcome, at(1060, 690, 1.82, 760, 560)]]);
  cam = shakeAll(cam, t, [[b.one, 0.3, 10]]);
  const upK = ease.outBack(seg(t, b.one - 0.12, b.one + 0.15));
  const hp = { x: 1060, y: 900, s: 0.42, turn: -0.15, sword: 'gold', armR: lerp(24, 172, upK), armL: 24, lean: -2, face: { name: 'smug', fx: t > b.one ? ['sparkles'] : [] }, ...boing(t, b.one, 0.12) };
  let o = camSet(GS.arena, t, cam, { cheer: 1, board: ['YOU', '2,001 WINS'] }, '', hero(t, hp, { arms: false }));
  // the KO'd player's twinkle pings in the sky on "ONE"
  const tw = t - (b.one - 0.12);
  if (tw > 0 && tw < 0.7) { const u = tw / 0.7, r = 70 * Math.sin(Math.min(1, u * 1.6) * Math.PI); o += S.path(R.star4(1640, 210, r * 1.3, u * 90), { fill: '#FFFFFF', stroke: '#FFE14D', 'stroke-width': 4 }) + S.path(R.star4(1640, 210, r * 0.6, 45 + u * 90), { fill: '#FFE14D' }); }
  o += G.winsCounter({ x: 1460, y: 420, s: 1.35, anchor: 'center', value: 2001, from: 2000, roll: seg(t, b.one, b.one + 0.3), bump: seg(t, b.one, b.one + 0.5), t, k: seg(t, C.one, C.one + 0.25) });
  const [hx, hy] = toScr(cam, 1060 + 0.42 * 120, 900 - 0.42 * 1100);
  o += K.bang('+1', hx + 230, hy + 230, pop(t, b.one, 0.22), 130, 10, '#3DDC84');
  return o;
}

// ================================================================= 8. "Welcome to my castle." — the red carpet
function shWelcome(t) {
  const cam = camKeys(t, [[C.welcome, at(-330, 700, 1.12, 960, 560)], [C.lava, at(-330, 690, 1.32, 960, 580)]]);
  const wide = seg(t, b.welcome - 0.1, b.welcome + 0.25) * (1 - seg(t, b.castle - 0.25, b.castle));
  const point = ease.outBack(seg(t, b.castle - 0.2, b.castle + 0.15));
  const hp = { x: -330, y: 930, s: 0.4, armL: lerp(lerp(12, 118, wide), 158, point), armR: lerp(12, 118, wide) * (1 - point) + 20 * point, turn: -0.35 * point, lean: 4 * wide, face: { name: 'joy' } };
  const floor = hero(t, hp, { arms: false });
  const extra = carpet(-330, 770, 1030, 150, 330, seg(t, C.welcome, C.welcome + 0.5));
  let o = camSet(GS.tycoon, t, cam, {}, '', floor, extra);
  if (t > b.castle) {
    const pts = [[-560, 330], [-100, 300], [-330, 180], [-700, 520], [40, 520]];
    pts.forEach(([x, y], i) => { const [sx, sy] = toScr(cam, x, y); o += sparkleAt(sx, sy, 44 * bump(t, b.castle + i * 0.08, b.castle + i * 0.08 + 0.6), i % 2 ? '#FFE14D' : '#FFFFFF'); });
  }
  return o;
}

// ================================================================= 9. "Lava pool." — a noob dives in
function shLava(t) {
  const cam = camKeys(t, [[C.lava, at(90, 650, 1.12)], [C.trophy, at(130, 650, 1.2)]]);
  const tJ = b.pool - 0.05, tIn = tJ + 0.5;
  const bx = 300, by = 738;
  let nb = '';
  if (t < tJ) {
    const bnc = Math.abs(Math.sin((t - C.lava) * 9));
    nb = K.draw.kid(6, { x: bx - 40, y: by + 6 * bnc, s: 0.42, view: 'side', lift: 40 * bnc, armL: 150, armR: 150, face: { name: 'excited' } });
  } else {
    const u = seg(t, tJ, tIn);
    const x = lerp(bx - 40, -120, u), y = lerp(by, 900, u) - 260 * Math.sin(u * Math.PI);
    const sink = Math.max(0, t - tIn) * 520;
    const body = K.draw.kid(6, { x, y: y + sink, s: 0.42, view: u < 1 ? 'side' : 'front', rot: u < 1 ? -160 * u : 0, armL: 160, armR: 160, face: { name: u < 1 ? 'excited' : 'shocked' } });
    nb = clipTo(-900, -400, 2000, 1300, body);
  }
  let fx = '';
  if (t > tIn) {
    const a = t - tIn;
    for (let i = 0; i < 9; i++) {
      const ang = -Math.PI / 2 + (hash(i * 3.1) - 0.5) * 2.2, sp = 260 + 280 * hash(i * 1.7);
      const x = -120 + Math.cos(ang) * sp * a, y = 900 + Math.sin(ang) * sp * a + 900 * a * a;
      if (a < 0.9) fx += S.circle(x, y, 18 - 10 * a, ol(i % 2 ? '#FF8A2B' : '#FFD23F', 4));
    }
    fx += S.ellipse(-120, 900, 140 * ease.out(seg(a, 0, 0.4)), 30 * ease.out(seg(a, 0, 0.4)), { fill: 'none', stroke: '#FFD23F', 'stroke-width': f(10 * (1 - seg(a, 0, 0.6))) });
  }
  const hp = { x: 600, y: 980, s: 0.5, turn: -0.45, armL: 100 + 6 * Math.sin(t * 5), armR: 14, face: { name: 'joy', eyes: { look: [-0.6, 0.1] } } };
  let o = castleRoom(t, cam, nb, fx + hero(t, hp, { arms: false }));
  if (t > tIn) { const [sx, sy] = toScr(cam, -120, 700); o += K.bang('OOF!', sx, sy, pop(t, tIn + 0.05, 0.2), 110, -8, '#FF8A2B'); }
  return o;
}

// ================================================================= 10. "Trophy room." — polishing the #1 cup
function shTrophy(t) {
  const cam = camKeys(t, [[C.trophy, at(1000, 430, 1.0)], [C.throne, at(1150, 450, 1.08)]]);
  const hp = { x: 1310, y: 980, s: 0.5, turn: -0.35, armL: 62 + 16 * Math.sin(t * 15), armR: 16, face: { name: 'smug', eyes: { look: [-0.5, -0.2] } } };
  let fx = '';
  for (let i = 0; i < 14; i++) {
    const x = 560 + hash(i * 3.7) * 1060, y = 120 + hash(i * 5.3) * 560, ph = (t * 1.3 + hash(i)) % 1;
    fx += sparkleAt(x, y, 26 * Math.sin(ph * Math.PI), i % 3 ? '#FFFFFF' : '#FFE14D');
  }
  const sw = seg(t, b.room - 0.1, b.room + 0.5);
  if (sw > 0 && sw < 1) { const x = lerp(400, 1800, sw); fx += S.path(`M${f(x)} 60 L${f(x + 120)} 60 L${f(x - 80)} 720 L${f(x - 200)} 720 Z`, { fill: '#FFFFFF', opacity: 0.35 }); }
  return castleRoom(t, cam, '', fx + hero(t, hp, { arms: false }));
}

// ================================================================= 11. "And this... is my throne." — walk + hop onto the throne
function shThrone(t) {
  const cam = camKeys(t, [[C.throne, at(1760, 600, 0.95)], [b.throne, at(2200, 585, 1.12)], [C.chair, at(2200, 575, 1.2)]]);
  const tW1 = b.is - 0.05, tLand = b.throne + 0.02;
  const TH = SPI.throne;
  let hp;
  if (t < tW1) {
    const x = lerp(1480, 1960, seg(t, C.throne, tW1));
    hp = { x, y: 980, s: 0.5, view: 'side', flip: true, ...walkP(t, 9), face: { name: 'smug' } };
  } else if (t < tLand) {
    const u = seg(t, tW1, tLand);
    hp = { x: lerp(1960, TH.x, u), y: lerp(980, TH.y, u) - 230 * Math.sin(u * Math.PI), s: 0.5, view: u < 0.5 ? 'side' : 'front', flip: true, armL: 120, armR: 120, legL: 30, legR: -20, kneeL: 40, kneeR: 40, face: { name: 'joy' } };
  } else {
    hp = { x: TH.x, y: TH.y, s: TH.s, ...TH.sit, armL: 32, armR: 32, lean: -2, face: { name: 'smug', fx: ['sparkles'] }, ...boing(t, tLand, 0.16) };
  }
  let back = '';
  const kb = seg(t, tLand - 0.1, tLand + 0.3);
  if (kb > 0) back += S.path(`M${TH.x - 90} -300 L${TH.x + 90} -300 L${TH.x + 300} 990 L${TH.x - 300} 990 Z`, { fill: '#FFF6C8', opacity: f(0.32 * kb) });
  let fx = '';
  if (t > tLand) for (let i = 0; i < 6; i++) fx += sparkleAt(TH.x + (hash(i * 2.1) - 0.5) * 520, 300 + hash(i * 4.4) * 500, 36 * Math.max(0, Math.sin((t - tLand) * 3 + i)), i % 2 ? '#FFE14D' : '#FFFFFF');
  return castleRoom(t, cam, '', back + hero(t, hp, { arms: false }) + fx);
}

// ================================================================= 12. "The throne was just a chair." — FIG. 1: A CHAIR
function shChair(t) {
  const cam = { zoom: lerp(1.0, 1.06, seg(t, C.chair, C.tag)), x: 2200 - 960, y: 610 - 540 };
  const TH = SPI.throne;
  const hp = { x: TH.x, y: TH.y, s: TH.s, ...TH.sit, armL: 30, armR: 30, face: { name: 'deadpan', eyes: { look: [0.2, -0.1] } } };
  let o = castleRoom(t, cam, '', hero(t, hp, { arms: false }));
  o += S.rect(0, 0, W, H_, 0, { fill: '#8E8E9A', opacity: 0.42 });
  const [ax, ay] = toScr(cam, TH.x + 150, 700);
  o += museumLabel(1540, 300, pop(t, b.chair - 0.05, 0.25), ax, ay);
  return o;
}

// ================================================================= 13. "A very expensive chair." — 99,999 -> 1 coin
function shTag(t) {
  let cam = camKeys(t, [[C.tag, at(2330, 430, 2.1)], [C.noodle, at(2335, 430, 2.4)]]);
  cam = shakeAll(cam, t, [[b.expensive, 0.35, 12]]);
  const TH = SPI.throne;
  const sweat = t > b.expensive;
  const hp = { x: TH.x, y: TH.y, s: TH.s, ...TH.sit, armL: 30, armR: 30, face: { name: sweat ? 'nervous' : 'smug', fx: sweat ? ['sweat2'] : [], eyes: { look: [0.7, 0] } } };
  let o = castleRoom(t, cam, '', hero(t, hp, { arms: false }));
  const [tx, ty] = toScr(cam, 2350, 420);
  o += K.coinBurst(tx, ty, t - b.expensive, 18, 900, 26, 5);
  o += G.coinCounter({ x: 50, y: 90, value: 1, from: 100000, roll: seg(t, b.expensive + 0.05, b.chair2 + 0.6), label: 'COINS', t, k: seg(t, b.very - 0.1, b.very + 0.2), anchor: 'left' });
  o += K.bang('-99,999', 1480, 250, pop(t, b.expensive + 0.08, 0.2), 120, 8, '#FF4B5C');
  return o;
}

// ================================================================= 14. "That's Noodle. Your best friend." — run in, freeze, fist bump
function shNoodle(t) {
  const fz0 = b.noodle + 0.08, fz1 = Math.max(fz0 + 0.3, b.friend - 0.6), d = fz1 - fz0;
  const tt = t < fz0 ? t : t < fz1 ? fz0 : t - d;
  const tEnd = b.friend - 0.08 - d;
  const cam = camKeys(tt, [[C.noodle, at(1250, 640, 0.9)], [tEnd, at(1840, 700, 1.3)], [C.met - d, at(1850, 705, 1.38)]]);
  const u = seg(tt, C.noodle, tEnd);
  const nx = lerp(420, 1745, u);
  const bumpK = seg(tt, tEnd - 0.05, tEnd + 0.15);
  const np = u < 1 ? { x: nx, y: 980, s: 0.5, view: 'side', flip: true, ...runP(tt, 14), armL: 150 + 25 * Math.sin(tt * 20), armR: 150 - 25 * Math.sin(tt * 20), face: { name: 'excited' } }
    : { x: nx, y: 980, s: 0.5, view: 'side', flip: true, armR: lerp(150, 80, bumpK), armL: 20, face: { name: 'joy' } };
  const hp = { x: 1960, y: 980, s: 0.5, view: 'side', armR: u < 1 ? 14 : lerp(14, 80, bumpK), armL: 12, face: { name: u < 1 ? 'happy' : 'joy' } };
  let fx = '';
  if (t > b.friend - 0.05) { const a = seg(t, b.friend - 0.05, b.friend + 0.4); fx += K.C.burst(1852, 715, a, '#FFE14D'); }
  let o = castleRoom(tt, cam, '', noodle(tt, np, { arms: false }) + hero(tt, hp, { arms: false }) + fx);
  const fk = t < fz1 ? seg(t, fz0, fz0 + 0.12) : 1 - seg(t, fz1, fz1 + 0.1);
  o = freeze(o, fk, 2.5);
  if (t > b.friend - 0.05) { const [sx, sy] = toScr(cam, 1852, 640); o += K.bang('BFF!', sx, sy - 330, pop(t, b.friend, 0.2), 110, -6, '#17C3B2'); }
  o += nameCard(t, fz0 + 0.02, 1010, 190, 'NOODLE', 'NoodleBoi · BEST FRIEND', '#17C3B2', { tOut: fz1 + 0.3, rot: 4, ax: 560, ay: 250 });
  o += smash(t, fz0, 0.1, 0.6);
  return o;
}

// ================================================================= 15. "You've never met in real life..." — split: you | ???
function shMet(t) {
  const sl = ease.out(seg(t, C.met, C.met + 0.25));
  // left: the real hero at his PC (bedroom, night), over the shoulder
  const monitor = (w, h) => S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#6FC3FF' }) + S.rect(-w / 2, h * 0.15, w, h * 0.35, 0, { fill: '#7ED86A' }) + G.portrait('noodle', 0, -6, 56) + TF('NoodleBoi', 0, h / 2 - 12, 20, '#FFFFFF', { stroke: '#151515', 'stroke-width': 4, 'paint-order': 'stroke' });
  const Lb = H.bedroom.layers(t, { time: 'night', monitor, lamp: 0.6 });
  const camL = at(1398, 520, 1.9, 470, 420);
  let left = view(camL, Lb.bg, 0.8) + view(camL, Lb.mid + Lb.front + Lb.fg + Lb.light, 1);
  left += actor('you', t, { x: 470, y: faceAt(820, 0.95), s: 0.95, view: 'back', volume: false, bodyY: 3 * Math.sin(t * 4) }, { arms: false });
  left += G.screenGlow(470, 420, 520, 340, 'blue', 0.6);
  let o = S.rect(0, 0, W, H_, 0, { fill: '#0C0E1A' });
  o += S.g(clipTo(0, 0, 950, H_, left), `translate(${f(-500 * (1 - sl))} 0)`);
  // right: ??? — a silhouette with a ramen cup
  let right = S.rect(970, 0, 950, H_, 0, { fill: '#121628' }) + S.ellipse(1445, 560, 420, 380, { fill: '#1E2A50', opacity: 0.8 }) + S.ellipse(1445, 600, 260, 240, { fill: '#2A3E78', opacity: 0.5 });
  right += silhouette(1400, 1060, 0.95, t);
  right += S.ellipse(1400, 560, 200, 260, { fill: '#33D6FF', opacity: 0.12 });
  right += S.rect(1020, 820, 900, 60, 8, ol('#2A2240', 5)) + S.path('M1660 820 L1690 640 L1900 640 L1920 820 Z', ol('#1A1A2A', 5)) + S.path('M1690 640 L1660 820', ln(6, '#33D6FF', 0.6));
  right += ramenCup(1150, 820, 0.9, t);
  o += S.g(clipTo(970, 0, 950, H_, right), `translate(${f(500 * (1 - sl))} 0)`);
  // the jagged divider
  o += S.path('M960 -20 L985 200 L940 330 L990 520 L935 700 L985 880 L955 1100', ln(22, '#FFFFFF')) + S.path('M960 -20 L985 200 L940 330 L990 520 L935 700 L985 880 L955 1100', ln(8, '#FFD21F'));
  const lk = pop(t, C.met + 0.15, 0.25);
  if (lk > 0.01) {
    o += S.g(S.rect(-190, -40, 380, 80, 26, ol('#1E1A2E', 6)) + TF('YOU · REAL LIFE', 0, 14, 36, '#FF8A2B'), tf(470, 90, lk, -2));
    o += S.g(S.rect(-210, -40, 420, 80, 26, ol('#1E1A2E', 6)) + TF('NOODLE · REAL LIFE', 0, 14, 36, '#17C3B2'), tf(1445, 90, lk, 2));
  }
  o += K.bang('???', 1400, 210, pop(t, b.real5, 0.22), 120, 6, '#FFFFFF');
  return o;
}

// ================================================================= 16. "...but you've beaten four hundred bosses together." — montage
const BOSS_CARDS = [[300, 300, 0, -12], [1620, 280, 1, 10], [260, 700, 2, 8], [1660, 690, 3, -8], [620, 170, 4, 6], [1300, 150, 5, -6], [130, 470, 1, -4], [1790, 470, 0, 5]];
function shBosses(t) {
  let o = S.rect(0, 0, W, H_, 0, { fill: '#5A2E9A' }) + K.rays(960, 560, 20, 1500, '#8A5AD8', 0.45, t * 30) + S.rect(-400, -200, 2720, 1480, 0, { fill: 'url(#s02StripesP)', transform: `translate(${f((t * 120) % 170)} 0)` });
  const n = BOSS_CARDS.length, t0 = b.but5 + 0.05, t1 = b.together - 0.05;
  BOSS_CARDS.forEach(([x, y, kind, rot], i) => { const ti = lerp(t0, t1, i / (n - 1)); o += bossCard(x, y, kind, pop(t, ti, 0.25), 0.95, rot + 4 * Math.sin(t * 2 + i), ['#BFE3F2', '#FFE0C0', '#D8F5C8', '#F5D8F0'][i % 4]); });
  // the two, back to back -> high five on "together"
  const five = t > b.together - 0.12;
  const hk = ease.outBack(seg(t, b.together - 0.12, b.together + 0.12));
  const nHand = (pose) => { const h = CAST.handAt(CAST.D.noodle, pose, 1); return [{ svg: X.goldSword({ x: h[0], y: h[1], s: 1, rot: pose.view === 'side' ? -40 : 0 }), layer: 'front' }]; };
  let w = '';
  if (!five) {
    const hp = { x: 800, y: 1020, s: 0.55, view: 'side', sword: 'gold', armR: 120 + 8 * Math.sin(t * 7), armL: 30, bodyY: 4 * Math.sin(t * 8), face: { name: 'determined' } };
    const np = { x: 1120, y: 1020, s: 0.55, view: 'side', flip: true, armR: 120 + 8 * Math.sin(t * 7 + 1), armL: 30, bodyY: 4 * Math.sin(t * 8 + 1), face: { name: 'determined' } };
    np.props = nHand(np);
    w += noodle(t, np, { arms: false }) + hero(t, hp, { arms: false });
  } else {
    const hp = { x: 820, y: 1020, s: 0.55, view: 'side', flip: true, armR: lerp(30, 165, hk), armL: 20, face: { name: 'joy' }, lift: hop(t, b.together - 0.12, 0.4, 50) };
    const np = { x: 1110, y: 1020, s: 0.55, view: 'side', armR: lerp(30, 165, hk), armL: 20, face: { name: 'joy' }, lift: hop(t, b.together - 0.12, 0.4, 50) };
    w += hero(t, hp, { arms: false }) + noodle(t, np, { arms: false });
    w += K.C.burst(965, 330, seg(t, b.together, b.together + 0.45), '#FFE14D');
    w += K.bang('TEAM!', 965, 230, pop(t, b.together + 0.02, 0.2), 110, -5, '#FFE14D');
  }
  o += view(shakeAll({ zoom: lerp(1, 1.06, seg(t, C.bosses, C.bro)) }, t, [[b.together, 0.3, 12]]), w);
  o += G.statPill({ x: 960, y: 70, anchor: 'center', label: 'BOSSES BEATEN', value: 400, from: 0, roll: seg(t, b.four - 0.15, b.bosses + 0.1), bump: seg(t, b.bosses + 0.1, b.bosses + 0.55), t, k: seg(t, C.bosses, C.bosses + 0.3), rim: '#FFD21F', col: '#FFD21F', icon: S.circle(0, 0, 33, { fill: '#3B2A20', stroke: '#151515', 'stroke-width': 4 }) + G.crown(0, 12, 20) });
  return o;
}

// ================================================================= 17. NOODLE: "Bro! Bro, bro, bro!" — close-up, hops
function shBro(t) {
  const camB = at(1850, 520, 1.55);
  let o = castleRoom(t, camB, '', '') + S.rect(0, 0, W, H_, 0, { fill: '#FFF4E0', opacity: 0.3 });
  let lift = 0, sq = { sx: 1, sy: 1 };
  b.bro.forEach((tb) => { lift += hop(t, tb - 0.04, 0.26, 70); });
  const last = b.bro.filter((x) => x <= t).pop();
  if (last) sq = boing(t, last + 0.22, 0.16);
  const wv = Math.sin(t * 22);
  const np = { x: 960, y: 1480, s: 0.98, volume: false, armL: 150 + 22 * wv, armR: 150 - 22 * wv, lift, ...sq, face: { name: 'excited' }, nametag: false };
  let cam = shakeAll({}, t, b.bro.map((x) => [x, 0.18, 9]));
  o += view(cam, noodle(t, np, { arms: false }));
  const spots = [[420, 300, -10], [1500, 260, 8], [380, 640, 6], [1540, 620, -8]];
  b.bro.forEach((tb, i) => { o += K.bang(i ? 'BRO!' : 'BRO!', spots[i][0], spots[i][1], pop(t, tb, 0.18), 120 + i * 10, spots[i][2], ['#17C3B2', '#FFD21F', '#FF6FB5', '#FFFFFF'][i]); });
  return o;
}

// ================================================================= 18. "New update!" — the banner
function shUpdate(t) {
  const cam = camKeys(t, [[C.update, at(1850, 560, 1.12)], [C.king, at(1850, 540, 1.2)]]);
  const look = seg(t, b.update - 0.1, b.update + 0.2);
  const np = { x: 1680, y: 980, s: 0.5, turn: 0.4, armR: 165, armL: 20, face: { name: 'excited', eyes: { look: [0.2, -0.8] } }, lift: hop(t, C.update, 0.3, 40) };
  const hp = { x: 2060, y: 980, s: 0.5, turn: -0.3, armL: 12, armR: 12, face: { name: look > 0.5 ? 'amazed' : 'happy', eyes: { look: [lerp(-0.6, 0, look), lerp(0, -0.9, look)] } } };
  let o = castleRoom(t, cam, '', noodle(t, np, { arms: false }) + hero(t, hp, { arms: false }));
  o += G.systemBanner({ theme: 'info', text: 'NEW UPDATE!', sub: 'The Block King is coming...', y: 170, k: seg(t, b.newW - 0.1, b.update + 0.45), t });
  return o;
}

// ================================================================= 19. "The Block King is coming!" — the teaser over the city
function shKing(t) {
  const dk = ease.inOut(seg(t, C.king, b.block + 0.3));
  const cam = camKeys(t, [[C.king, { zoom: 1.0, x: 0, y: -40 }], [C.gulp, { zoom: 1.08, x: 0, y: -90 }]]);
  const Lc = GS.cityDay.layers(t, cam, { ledge: false });
  const rise = lerp(0.15, 0.86, ease.out(seg(t, C.king, b.coming + 0.3)));
  const boss = actor('boss', t, { x: SPC.boss.x, y: SPC.boss.y, s: 0.78, pose: 'rise', rise, t, glow: 1 });
  let o = Lc.sky + S.rect(0, 0, W, H_, 0, { fill: '#2A0E4A', opacity: f(0.62 * dk) }) + view(cam, boss, SPC.boss.k) + Lc.row + Lc.mid + Lc.light;
  o += S.rect(0, 0, W, H_, 0, { fill: '#3A1060', opacity: f(0.3 * dk) });
  const lt = seg(t, b.coming - 0.05, b.coming + 0.3);
  o += G.lightning({ k: lt, x0: 1500, y0: -20, x1: 1300, y1: 520, seed: 3 }) + G.lightning({ k: seg(t, b.king, b.king + 0.3), x0: 380, y0: -20, x1: 560, y1: 480, seed: 7 });
  if (lt > 0 && lt < 0.4) o += K.C.whiteFlash(0.5 * (1 - lt / 0.4));
  o += G.bigTitle({ text: 'THE BLOCK KING', theme: 'night', sub: 'COMING SOON', x: 960, y: 118, size: 104, k: seg(t, b.block - 0.08, b.king + 0.7), rays: false, t });
  return o;
}

// ================================================================= 20. (beat) the two friends gulp
function shGulp(t) {
  const cam = at(1870, 520, 1.6);
  const np = { x: 1700, y: 980, s: 0.5, turn: 0.45, armL: 30, armR: 30, face: { name: 'scared', fx: ['sweat2'], eyes: { look: [0.8, 0] } }, ...boing(t, C.gulp + 0.05, 0.15) };
  const hp = { x: 2040, y: 980, s: 0.5, turn: -0.45, armL: 20, armR: 20, face: { name: 'shocked', fx: ['sweat'], eyes: { look: [-0.8, 0] } }, ...boing(t, C.gulp + 0.12, 0.15) };
  let o = castleRoom(t, cam, '', noodle(t, np, { arms: false }) + hero(t, hp, { arms: false }));
  o += S.rect(0, 0, W, H_, 0, { fill: '#2A0E4A', opacity: 0.18 });
  o += K.bang('gulp', 1500, 220, pop(t, C.gulp + 0.12, 0.2), 80, 6, '#FFFFFF');
  return o;
}

// ================================================================= 21. "And that's DarkBlade." — superhero landing, clan, freeze
const DB = { x: 120, y: 930, s: 0.4 };
const CLAN = [[300, 858, 0], [440, 852, 1], [580, 860, 3], [-40, 852, 4]];
function clanRow(t, o = {}) {
  let s = '';
  CLAN.forEach(([x, y, i], j) => {
    const land = o.land ? o.land + 0.12 * (j + 1) : null;
    const lift = land !== null ? Math.max(0, 1 - seg(t, land - 0.3, land)) * 900 : 0;
    if (land !== null && t < land - 0.3) return;
    s += clan(t, i, { x, y, s: GS.SPOTS.tycoon.sAt(y), lift, ...(land !== null ? boing(t, land, 0.2) : {}), bodyY: 3 * Math.sin(t * 4 + j), armR: o.laugh ? 40 + 12 * Math.abs(Math.sin(t * 14 + j)) : 20, armL: o.laugh ? 40 + 12 * Math.abs(Math.sin(t * 14 + j + 1)) : 16, headRot: o.laugh ? 8 * Math.sin(t * 16 + j) : 0, turn: x < DB.x ? 0.3 : -0.3, ...(o.pose || {}) });
  });
  return s;
}
function shDark(t) {
  const tLand = b.darkblade - 0.12;
  const fz = b.darkblade + 0.18;
  const ft = Math.min(t, fz);
  // wide on the two friends -> DarkBlade crashes down -> the camera snaps in on him for the freeze
  let cam = camKeys(ft, [[C.dark, at(-250, 560, 0.95)], [tLand, at(-170, 600, 1.02)], [tLand + 0.06, at(40, 690, 1.42)], [fz, at(60, 690, 1.5)]], ease.out);
  cam = shakeAll(cam, ft, [[tLand, 0.4, 18]]);
  const lift = Math.max(0, 1 - ease.in(seg(ft, C.dark, tLand))) * 1100;
  const dp = { ...DB, lift, armL: ft < tLand ? 160 : 40, armR: ft < tLand ? 120 : 60, legL: ft > tLand ? 30 : 0, legR: ft > tLand ? -20 : 0, kneeL: ft > tLand ? 40 : 0, bodyY: ft > tLand ? 30 * (1 - seg(ft, tLand, tLand + 0.4)) : 0, ...boing(ft, tLand, 0.25), face: { name: 'angry' } };
  let floor = clanRow(ft, { land: tLand }) + blade(ft, dp, { arms: false });
  floor += noodle(ft, { x: -820, y: 930, s: 0.4, turn: 0.4, face: { name: 'shocked' }, armL: 30, armR: 30 }) + hero(ft, { x: -660, y: 930, s: 0.4, turn: 0.35, face: { name: 'neutral', eyes: { look: [0.8, 0] } }, armL: 14, armR: 14 }, { arms: false });
  let extra = '';
  if (ft > tLand) {
    const a = ft - tLand;
    extra += S.path(`M${DB.x - 160} ${DB.y + 4} l60 -14 l40 18 l50 -10 l60 20 l60 -16 l50 12`, ln(8, '#3A2A20', 0.7 * (1 - seg(a, 0.5, 1.2))));
    extra += K.C.dust(DB.x - 120, DB.y, tLand, ft) + K.C.dust(DB.x + 120, DB.y, tLand + 0.02, ft);
  }
  let o = camSet(GS.tycoon, ft, cam, {}, '', extra + floor);
  o += S.rect(0, 0, W, H_, 0, { fill: '#2A1640', opacity: f(0.22 * seg(t, C.dark, C.dark + 0.4)) });
  o = freeze(o, seg(t, fz, fz + 0.14), 2.5, '#1A0C14', '#FFD0D0');
  if (t >= fz) {
    const [hx, hy] = toScr(cam, DB.x - 20, DB.y - 0.4 * 820);
    o += nameCard(t, fz + 0.02, 560, 230, 'DARKBLADE', 'xX_DarkBlade_Xx · RIVAL', '#FF4B5C', { rot: -4, size: 96, ax: 960 + 0.9 * (hx - 960) - 80, ay: 540 + 0.9 * (hy - 540) }) + smash(t, fz, 0.1, 0.6);
  }
  return o;
}

// ================================================================= 22. "Nobody knows who he really is." — close-up + profile
function shWho(t) {
  let o = S.rect(0, 0, W, H_, 0, { fill: '#3A0E18' }) + S.rect(-400, -200, 2720, 1480, 0, { fill: 'url(#s02StripesR)', transform: `translate(${f((t * 60) % 170)} 0)` });
  o += S.ellipse(620, 560, 520, 480, { fill: '#FF2E3E', opacity: 0.18 });
  const z = lerp(1, 1.08, seg(t, C.who, C.angry));
  const dp = { x: 620, y: faceAt(470, 1.0), s: 1.0, volume: false, nametag: false, turn: 0.15, sword: 'back', armL: 10, armR: 10, headRot: -3 + 2 * Math.sin(t * 1.5), face: { name: 'angry' } };
  o += E.zoomAbout(blade(t, dp, { arms: false }), 620, 470, z);
  // orbiting question marks
  for (let i = 0; i < 3; i++) {
    const k = pop(t, [b.who, b.really, b.is7][i] - 0.05, 0.25);
    if (k <= 0.01) continue;
    const a = t * 1.6 + (i * Math.PI * 2) / 3;
    o += S.g(TS('?', 0, 40, 130, '#FFE14D'), tf(620 + Math.cos(a) * 400, 215 + Math.sin(a) * 75, k, 12 * Math.sin(a)));
  }
  o += infoCard(t, 1110, 170, 700, 'PLAYER PROFILE', [
    { label: 'NAME', value: 'xX_DarkBlade_Xx', at: C.who + 0.15, size: 40, col: '#FF6A78' },
    { label: 'REAL NAME', value: '???', at: b.who - 0.05 },
    { label: 'AGE', value: '???', at: b.really - 0.05 },
    { label: 'FACE', value: '???', at: b.is7 - 0.05 },
  ], pop(t, C.who + 0.05, 0.3), { rot: 2 });
  return o;
}

// ================================================================= 23. "Nobody knows why he's always so angry." — the noob says hi
function shAngry(t) {
  const cam = camKeys(t, [[C.angry, at(260, 650, 1.35)], [C.taunt, at(300, 640, 1.45)]]);
  const tHi = b.why - 0.15, tRun = b.angry - 0.05;
  const flare = seg(t, b.always - 0.1, b.always + 0.15);
  const dp = { ...DB, turn: lerp(0, -0.55, seg(t, tHi, tHi + 0.3)), armL: 16, armR: 26, face: { name: 'angry', fx: flare > 0.5 ? ['anger', 'steam'] : ['anger'] }, ...boing(t, b.always, 0.12) };
  let floor = blade(t, dp, { arms: false });
  // the noob
  let nx, np;
  if (t < tRun) { nx = lerp(820, 470, ease.out(seg(t, C.angry, tHi))); np = { x: nx, y: 935, s: 0.34, view: t < tHi ? 'side' : 'front', armR: t > tHi ? 150 + 20 * Math.sin(t * 14) : 20, ...(t < tHi ? walkP(t, 11) : {}), face: { name: flare > 0.5 ? 'shocked' : 'happy' } }; }
  else { nx = lerp(470, 1300, seg(t, tRun, tRun + 0.9)); np = { x: nx, y: 935, s: 0.34, view: 'side', flip: true, ...runP(t, 18), armL: 160, armR: 160, face: { name: 'scared' } }; }
  floor += K.draw.kid(9, np);
  let o = camSet(GS.tycoon, t, cam, {}, '', floor);
  o += S.rect(0, 0, W, H_, 0, { fill: '#2A1640', opacity: 0.22 });
  const oh = toScr(cam, nx, 935 - 0.34 * 720);
  o += G.chatBubble({ x: oh[0], y: oh[1] - 30, text: 'hi :)', user: 'Guest_5129', t, k: seg(t, tHi, tHi + 0.3), out: seg(t, tRun, tRun + 0.2), size: 44 });
  // eye flare
  const [ex, ey] = toScr(cam, DB.x - 20, DB.y - 0.4 * 760);
  if (flare > 0) o += S.ellipse(ex, ey, 160 * flare, 60 * flare, { fill: '#FF2E3E', opacity: f(0.35 * (1 - seg(t, b.always + 0.15, b.angry + 0.4))) });
  if (t > tRun) o += K.bang('!!', oh[0] + 40, oh[1] - 40, pop(t, tRun, 0.18), 90, 8, '#FFE14D');
  o += G.statPill({ x: 1880, y: 80, anchor: 'right', label: 'MOOD', value: 'ANGRY 24/7', t, k: seg(t, b.angry - 0.1, b.angry + 0.25), rim: '#FF4B5C', col: '#FF6A78', size: 52 });
  return o;
}

// ================================================================= 24. "You got lucky last time, YOU." — the standoff
function shTaunt(t) {
  // wide standoff -> smash-in on "YOU": the sword points at the hero, the two friends tense up
  const tP = b.YOU8 - 0.08;
  let cam = t < tP ? camKeys(t, [[C.taunt, at(-300, 620, 0.95)], [tP, at(-250, 615, 1.05)]])
    : camKeys(t, [[tP, at(-300, 668, 1.5)], [C.little, at(-300, 664, 1.58)]], ease.out);
  cam = shakeAll(cam, t, [[tP, 0.3, 12]]);
  const point = ease.outBack(seg(t, b.YOU8 - 0.15, b.YOU8 + 0.15));
  const dp = { ...DB, view: point > 0.01 ? 'side' : 'front', turn: -0.45, armR: lerp(20, 86, point), armL: 14, swordRot: -70 * point, face: { name: 'angry' } };
  let floor = clanRow(t, { pose: {} }) + blade(t, dp, { arms: false });
  const tense = t > tP;
  floor += noodle(t, { x: -860, y: 930, s: 0.4, turn: 0.45, armL: tense ? 40 : 20, armR: tense ? 40 : 20, face: { name: tense ? 'scared' : 'nervous', fx: tense ? ['sweat'] : [], eyes: { look: [0.8, 0] } }, ...boing(t, tP + 0.05, 0.12) }) +
    hero(t, { x: -690, y: 930, s: 0.4, turn: 0.4, armL: 24, armR: 24, face: { name: tense ? 'determined' : 'neutral', eyes: { look: [0.8, 0] } }, ...boing(t, tP, 0.1) }, { arms: false });
  let o = camSet(GS.tycoon, t, cam, {}, '', floor);
  const oh = G.overHead(DB.x, DB.y, DB.s, 'darkblade');
  const [bx, by] = toScr(cam, DB.x, oh.chat - 30);
  o += G.chatBubble({ x: Math.min(bx, 1560), y: Math.max(by, 150), t, text: 'You got lucky last time, YOU.', typed: G.chatSync(t, '02.8', { to: 'YOU' }), k: seg(t, L8a() - 0.3, L8a()), user: 'xX_DarkBlade_Xx', col: '#2A1C24', textCol: '#FFFFFF', tail: 0.4 });
  if (tense) { const [hx, hy] = toScr(cam, -690, 930 - 0.4 * 1180); o += K.bang('!', hx, hy, pop(t, tP + 0.04, 0.2), 90, 8, '#FFE14D'); }
  return o;
}
const L8a = () => K.V.L('02.8').a;

// ================================================================= 25. "Enjoy your little castle." — the castle shrinks
function shLittle(t) {
  const sq = ease.inOut(seg(t, b.little - 0.05, b.castle8 + 0.2));
  const cam = { zoom: lerp(1.25, 0.72, sq), x: lerp(-330 - 960 + 120, -330 - 960 + 60, sq), y: lerp(420 - 540, 520 - 540, sq) };
  let o = camSet(GS.tycoon, t, cam, {}, '', '');
  // DarkBlade over the shoulder (back view, foreground)
  const dp = { x: 1420, y: 1500, s: 0.95, view: 'back', volume: false, nametag: false, armL: 10, armR: lerp(10, 40, seg(t, b.little - 0.1, b.little + 0.2)), bodyY: 3 * Math.sin(t * 3) };
  o += blade(t, dp, { arms: false });
  o += G.chatBubble({ x: 1240, y: 330, t, text: 'Enjoy your little castle.', typed: G.chatSync(t, '02.8', { from: 'Enjoy' }), k: seg(t, b.enjoy - 0.3, b.enjoy), user: 'xX_DarkBlade_Xx', col: '#2A1C24', textCol: '#FFFFFF', tail: 0.6 });
  const lk = pop(t, b.castle8 + 0.1, 0.2);
  o += speech(360, 220, 'HAHA', lk, { size: 54, tail: 1 }) + speech(620, 140, 'lol', pop(t, b.castle8 + 0.25, 0.2), { size: 46, tail: 1, rot: 6 });
  return o;
}

// ================================================================= 26. YOU: "Enjoy your little losing streak." — BURN
function shStreak(t) {
  const cam = camKeys(t, [[C.streak, at(-700, 620, 1.75, 760, 560)], [C.sat, at(-700, 615, 1.9, 760, 560)]]);
  const hp = { x: -690, y: 930, s: 0.4, turn: 0.25, armL: 26, armR: 26, lean: -2, face: { name: 'smug' } };
  const ooh = t > b.streak + 0.2;
  const np = { x: -860, y: 930, s: 0.4, turn: 0.4, armL: ooh ? 140 : 20, armR: ooh ? 140 : 20, face: { name: ooh ? 'excited' : 'nervous', mouth: ooh ? 'O' : undefined }, lift: hop(t, b.streak + 0.2, 0.3, 30) };
  let o = camSet(GS.tycoon, t, cam, {}, '', noodle(t, np, { arms: false }) + hero(t, hp, { arms: false }));
  o += streakBadge(1440, 360, pop(t, b.losing - 0.05, 0.3), t);
  if (ooh) {
    o += speech(215, 330, 'OOOOH!', pop(t, b.streak + 0.2, 0.22), { size: 56, tail: 1, rot: -5 });
    const bk = pop(t, b.streak + 0.35, 0.22);
    if (bk > 0.01) { let st = S.rect(-190, -95, 380, 190, 60, ol('#2A0C12', 8)); for (let i = 0; i < 4; i++) st += GS.fire(-120 + i * 80, 70, 0.5, t, i + 2); st += TS('BURN!', 0, 30, 110, '#FF8A2B'); o += S.g(st, tf(1460, 640, bk, -6)); }
  }
  return o;
}

// ================================================================= 27. (beat) DarkBlade fumes — the clan snickers behind him
function shFume(t, cheap = false) {
  CHEAP = cheap;
  try { return fumeFrame(t); } finally { CHEAP = false; }
}
function fumeFrame(t) {
  const t0 = C.fume;
  const c0 = at(DB.x, lerp(700, 690, seg(t, t0, C.sat)), lerp(2.15, 2.3, seg(t, t0, C.sat)));
  let cam = { ...c0, x: c0.x + 2 * Math.sin(t * 70) };
  cam = shakeAll(cam, t, [[t0 + 0.1, 0.4, 7]]);
  const dp = { ...DB, turn: 0.1, armL: 22, armR: 30, sx: 1 + 0.03 * Math.sin(t * 40), face: { name: 'angry', fx: ['anger', 'steam'], eyes: { look: [-0.9, 0] } }, ...boing(t, t0 + 0.05, 0.08) };
  const floor = clanRow(t, { laugh: true, pose: { volume: false } }) + blade(t, dp, { arms: false });
  let o = camSet(GS.tycoon, t, cam, {}, '', floor);
  o += S.rect(0, 0, W, H_, 0, { fill: '#FF2E3E', opacity: f(0.1 + 0.06 * Math.sin(t * 18)) });
  o += speech(1560, 250, 'lol', pop(t, t0 + 0.12, 0.18), { size: 54, tail: -1, rot: 6 }) + speech(1760, 470, 'hehe', pop(t, t0 + 0.26, 0.18), { size: 44, tail: -1, rot: -5 });
  o += K.bang('grrr', 960, 200, pop(t, t0 + 0.18, 0.2), 84, -6, '#FF4B5C');
  return o;
}

module.exports = {
  shOpen, shPhoto, shLegend, shLevel, shBase, shArena, shOne, shWelcome, shLava, shTrophy, shThrone, shChair, shTag, shNoodle, shMet,
  shBosses, shBro, shUpdate, shKing, shGulp, shDark, shWho, shAngry, shTaunt, shLittle, shStreak, shFume,
};
