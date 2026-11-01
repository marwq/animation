// Part 6 (5:41.4 - 6:54): noob mistakes. Showing Rocky to no one, the unlocked base, Speedy the
// 7-year-old thief, the chase, 200 rocks, the thief mask, EggLord's golden base, the fridge-heavy
// egg, "Bro. Seriously?", ZAP, respawn with no dignity.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const G = require('./env4');
const C = require('./common');
const A = require('./acting');
const { drawHero, YOU_DESIGN, standJ } = require('../rig/hero');
const { draw: cast, NAMES } = require('../rig/cast');
const { draw: cast2, NAMES2 } = require('../rig/cast2');
const { egg } = require('../rig/props');
const { f, ease, inv, lerp, clamp } = S;
const { W, H, bump, blinkAt, hash } = C;

const START = 341.4, END = 414.0;
const LINES = [
  [341.80, 344.60, 'NARRATOR', 'You spend three minutes showing Rocky to... literally *no one.*'],
  [344.90, 346.60, 'NARRATOR', 'And you forget *rule three.*'],
  [347.00, 348.60, 'NARRATOR', 'A tiny blur zooms into your base.'],
  [348.80, 350.20, 'NARRATOR', '*"xX_Speedy_Xx."*'],
  [350.40, 351.40, 'NARRATOR', "He's *seven.*"],
  [351.60, 353.80, 'NARRATOR', "He's the fastest thief on the server."],
  [354.10, 354.80, 'SPEEDY', '*Yoink!*'],
  [355.10, 356.90, 'YOU', '*ROCKY!* NOOOO!'],
  [357.30, 359.00, 'NARRATOR', "You chase him. You're fast."],
  [359.20, 360.20, 'NARRATOR', "He's *FASTER.*"],
  [360.60, 363.00, 'NARRATOR', 'He slams his laser door right in your face.'],
  [363.40, 366.40, 'NARRATOR', 'And behind it... Speedy has *two hundred* rocks.'],
  [366.80, 369.80, 'YOU', 'Why does a seven-year-old need two hundred *ROCKS?!*'],
  [370.20, 371.20, 'SPEEDY', '*Collection.*'],
  [371.80, 374.40, 'NARRATOR', 'Fine. If they can steal... so can *you.*'],
  [374.80, 378.60, 'NARRATOR', 'You pick the biggest target on the server. Number one on the leaderboard:'],
  [378.80, 380.20, 'NARRATOR', '*"xX_EggLord_Xx."*'],
  [380.60, 382.20, 'NARRATOR', 'His base is *solid gold.*'],
  [382.30, 383.10, 'NARRATOR', 'Lasers.'],
  [383.30, 385.00, 'NARRATOR', 'Ten *Legendary* eggs.'],
  [385.20, 387.60, 'NARRATOR', 'And a sign that says... *"TRY IT."*'],
  [388.00, 390.60, 'YOU', 'Sneak... sneak... sneak...'],
  [391.00, 393.00, 'NARRATOR', 'You grab a Legendary egg.'],
  [393.20, 394.60, 'NARRATOR', 'It lands on your head.'],
  [395.00, 396.90, 'NARRATOR', 'It weighs as much as a *fridge.*'],
  [397.20, 399.00, 'YOU', 'Why is it so *HEAVY?!*'],
  [399.40, 400.40, 'NARRATOR', 'Alarms. Sirens.'],
  [400.60, 402.40, 'NARRATOR', 'And EggLord... slowly turns around.'],
  [402.80, 404.40, 'EGGLORD', '...Bro. *Seriously?*'],
  [404.80, 406.00, 'NARRATOR', 'The lasers go *ZAP.*'],
  [406.60, 407.60, 'YOU', '...oof.'],
  [408.00, 410.00, 'NARRATOR', 'You respawn in your empty base.'],
  [410.20, 413.40, 'NARRATOR', '*No* Rocky. *No* egg. *No* dignity.'],
];
const TRACK = C.makeTrack(LINES);
const vis = (sp, t) => C.visemeAt(TRACK, sp, t);
const tag = { name: 'YOU', health: 1 };
const whip = (t, a, b, inner) => { const k = bump(t, a, b); return k > 0.02 ? S.g(inner, `translate(${f((t < (a + b) / 2 ? -1 : 1) * k * 160)} 0)`, { filter: 'url(#whip)' }) : inner; };

const YB = { x0: 300, x1: 1500, col: '#FF8FC8', sign: "YOU's Base", doorSide: 'right' };
const SB = { x0: 2400, x1: 3600, col: '#3BD16F', sign: "Speedy's Base", doorSide: 'left' };
const GB = { x0: 5100, x1: 6900, col: '#FFD34D', gold: true, sign: 'TRY IT.', doorSide: 'left' };
const PEDY = (i) => YB.x0 + ((i + 1) * (YB.x1 - YB.x0)) / 4;

function world(t, cam, w, o = {}) {
  const M = G.eggMap(cam, t, { beltOff: t * 120 });
  let b = G.base({ ...YB, locked: false, lockLabel: o.lockLabel, unlockedBlink: o.blink, pedestals: o.yPeds || [null, null, null] }, t);
  b += G.base({ ...SB, locked: o.speedyLocked ?? true, pedCount: 0, lockPanel: false }, t);
  if (o.pile) b += G.rockPile(3050, 1010, 900, 420, t);
  const goldEggs = [];
  for (let i = 0; i < 5; i++) goldEggs.push(o.takenEgg === i ? null : egg({ x: 0, y: -58, size: 110, rarity: 'legendary', glow: true, wobble: Math.sin(t * 3 + i) * 3 }));
  b += G.base({ ...GB, locked: true, lockPanel: false, pedestals: goldEggs }, t);
  return M.bg + M.ground + S.g(b + w, E.camTf(cam, 1));
}
const goldPed = (i) => GB.x0 + ((i + 1) * (GB.x1 - GB.x0)) / 6;

// ---------------------------------------------------------------- 341.4 - 346.9
function shotShowRocky(t) {
  const cam = { zoom: 1.3, fx: 960, fy: 720, x: 520 };
  const holdA = 150 + 6 * Math.sin(t * 6);
  const [hx, hy] = A.hand(holdA);
  const you = { x: 1100, y: 1000, s: 0.55, nametag: tag, turn: 0.2, armR: holdA, armL: 150 - 6 * Math.sin(t * 6), face: { name: 'joy' }, ...A.breathe(t) };
  let w = drawHero(you) + G.rocky({ x: 1100 + 0.55 * (hx - 100), y: 1000 + 0.55 * hy + 40, s: 0.7, t, face: 'happy' });
  // passers-by who don't care
  const px = lerp(2300, 400, inv(341.6, 344.6, t));
  w += cast.pinky({ view: 'side', x: px, y: 1000, s: 0.48, ...A.walk(t * 9), face: { name: 'deadpan', eyes: { look: [0, 0.8] } }, nametag: NAMES.pinky, props: [{ svg: S.rect(-150, -620, 60, 100, 10, { fill: '#2B2F3A', stroke: '#151515', 'stroke-width': 5 }), layer: 'top' }] });
  if (t > 343.0) { const mx = lerp(2500, 900, inv(343.0, 344.8, t)); w += cast.max({ view: 'side', x: mx, y: 1000, s: 0.48, ...A.walk(t * 9), face: { name: 'neutral', eyes: { type: 'closed' } }, nametag: NAMES.max }); }
  let o = world(t, cam, w);
  const mins = Math.min(3, Math.floor(inv(341.7, 344.4, t) * 3) + 1);
  o += S.g(S.rect(-150, -50, 300, 100, 24, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 5 }) + S.el('text', { x: 0, y: 26, 'font-family': 'Lilita One', 'font-size': 64, fill: '#FFE14D', 'text-anchor': 'middle' }, `${mins}:00 MIN`), 'translate(1650 120)');
  return o;
}

function shotUnlocked(t) { // 344.8 - 346.9
  const k = ease.inOut(inv(344.9, 345.6, t));
  const cam = { zoom: lerp(1.3, 2.6, k), fx: 960, fy: lerp(720, 600, k), x: lerp(520, 420, k), y: lerp(0, 480, k) };
  let o = world(t, cam, drawHero({ x: 1100, y: 1000, s: 0.55, nametag: tag, armR: 150, face: 'joy' }), { lockLabel: true, blink: true });
  o += S.rect(0, 0, W, H, 0, { fill: '#FF2D55', opacity: f(0.12 * (Math.floor(t * 4) % 2)) });
  return o;
}

// ---------------------------------------------------------------- the blur + intro card (346.9 - 353.9)
function speedyPose(t, extra = {}) { return { s: 0.5, nametag: NAMES.speedy, ...extra }; }
function shotBlur(t) { // 346.9 - 348.7
  const cam = { zoom: 1.3, fx: 960, fy: 720, x: 520 };
  const bx = lerp(2600, 1000, inv(347.0, 347.6, t)), back = lerp(1000, 1700, inv(347.8, 348.4, t));
  const sx = t < 347.8 ? bx : back;
  let w = drawHero({ x: 1350, y: 1000, s: 0.55, nametag: tag, turn: Math.sin(t * 14) * 0.8, face: { name: 'dizzy' }, armR: 150, armL: 150 });
  w += G.rocky({ x: 1560, y: 1000, s: 0.7, t, face: 'sad', look: -0.8 });
  w += S.g(cast.speedy({ view: 'side', x: sx, y: 1000, ...speedyPose(t), lean: -14, ...A.run(t * 30) }), null, { filter: 'url(#whip)' }) + C.speedLines(sx + 80, sx + 900, 760, 9, 13, '#B8F0A0');
  let o = world(t, cam, w);
  o += C.sfx('ZOOM!', 600, 260, inv(347.1, 347.25, t) * (1 - inv(348.3, 348.6, t)), 100, -8, '#3BD16F');
  return o;
}

function shotIntroCard(t) { // 348.7 - 353.9
  const cam = { zoom: 1.6, fx: 960, fy: 640, x: 600 };
  let o = S.g(world(t, cam, ''), null, { filter: 'url(#blurBg)' }) + S.rect(0, 0, W, H, 0, { fill: '#000', opacity: 0.2 });
  const lines = [];
  if (t > 350.4) lines.push('AGE: 7');
  if (t > 351.6) lines.push('FASTEST THIEF ON THE SERVER');
  const chr = cast.speedy({ x: 470, y: 1180, s: 0.95, turn: -0.3, armR: 150, armL: 30, face: { name: 'smug', eyes: { upper: 0.4 } }, headRot: -6, shadow: false });
  o += G.introCard('xX_Speedy_Xx', lines, '#3BD16F', inv(348.75, 349.1, t), chr);
  o += C.whiteFlash(1 - inv(348.7, 348.85, t));
  return o;
}

function shotYoink(t) { // 353.9 - 355.0
  const v = vis('SPEEDY', t);
  const cam = { zoom: 1.8, fx: 960, fy: 700, x: 450 };
  const grab = ease.out(inv(354.0, 354.35, t));
  const sx = 1650 - 120 * grab;
  let w = drawHero({ x: 1300, y: 1000, s: 0.55, nametag: tag, turn: 0.4, face: { name: 'shocked' }, armR: 60, armL: 60 });
  const rk = G.rocky({ x: 0, y: -1060, s: 1.3, t, face: 'sad', walk: 1 });
  w += cast.speedy({ x: sx, y: 1000, ...speedyPose(t), turn: -0.5, armL: lerp(30, 160, grab), armR: 160 * grab, face: { name: 'joy', mouth: v || 'bigGrin' }, props: grab > 0.5 ? [{ svg: rk, layer: 'top' }] : [] });
  if (grab <= 0.5) w += G.rocky({ x: lerp(1450, sx, grab * 2), y: lerp(780, 1000 - 0.5 * 0.84 * 1060, grab * 2), s: 0.7, t });
  let o = world(t, cam, w);
  o += C.sfx('YOINK!', 1500, 240, inv(354.1, 354.25, t), 110, 8, '#3BD16F');
  return o;
}

function shotNooo(t) { // 355.0 - 357.2
  const v = vis('YOU', t);
  const cam = { zoom: 2.2, fx: 960, fy: 640, x: 340 };
  let w = drawHero({ x: 1300, y: 1000, s: 0.55, nametag: tag, turn: 0.5, armR: 100 + 10 * Math.sin(t * 20), armL: 60, lean: 6, face: { name: 'crying', mouth: v || 'wail', fx: ['tears'] }, headRot: -6 });
  let o = world(t, cam, w);
  o += S.rect(0, 0, W, H, 0, { fill: '#2A1E4A', opacity: 0.15 });
  return o;
}

// ---------------------------------------------------------------- chase + laser door (357.2 - 371.6)
function shotChase(t) { // 357.2 - 360.5
  const u = t - 357.2;
  const yx = 1500 + u * 330;
  const cam = { zoom: 1.2, fx: 960, fy: 700, x: yx - 700 };
  const faster = t > 359.2;
  const sx = yx + 500 + u * 120 + (faster ? (t - 359.2) * 900 : 0);
  let w = drawHero({ view: 'side', flip: true, x: yx, y: 1000, s: 0.55, lean: -10, ...A.run(u * 26), face: { name: 'angry', fx: ['sweat'] }, nametag: tag });
  w += C.speedLines(yx - 700, yx - 160, 760, 6, 3);
  const rk = G.rocky({ x: 0, y: -1060, s: 1.3, t, face: 'sad', walk: 1 });
  w += cast.speedy({ view: 'side', flip: true, x: sx, y: 1000, ...speedyPose(t), lean: -14, ...A.run(u * 34), face: { name: 'joy' }, props: [{ svg: rk, layer: 'top' }] });
  if (faster) w += S.g(C.speedLines(sx - 900, sx - 140, 760, 12, 9, '#B8F0A0'), null, { opacity: 0.9 }) + C.dust(sx - 300, 1000, 359.2, t);
  let o = world(t, cam, w, { speedyLocked: false });
  if (faster) o += C.sfx('FASTER', 1350, 260, inv(359.25, 359.4, t), 110, -6, '#3BD16F');
  return o;
}

function shotDoorSlam(t) { // 360.5 - 363.3
  const cam = { zoom: 1.5, fx: 960, fy: 700, x: SB.x0 - 1100 };
  const slam = t > 361.3;
  const hit = inv(361.5, 361.75, t);
  const yx = t < 361.5 ? lerp(SB.x0 - 900, SB.x0 - 150, inv(360.5, 361.5, t)) : SB.x0 - 150 + 40 * Math.sin(hit * Math.PI);
  let you;
  if (t < 361.5) you = { view: 'side', flip: true, x: yx, y: 1000, s: 0.55, lean: -10, ...A.run(t * 26), face: { name: 'angry' } };
  else you = { view: 'side', flip: true, x: yx, y: 1000, s: 0.55, sx: 1 - 0.25 * bump(t, 361.5, 361.9), sy: 1 + 0.08 * bump(t, 361.5, 361.9), face: { name: 'dizzy' }, armL: 160, armR: 140, lean: 10 };
  let w = drawHero({ ...you, nametag: tag });
  if (t > 361.5) w += S.path(`M${SB.x0 - 30} 740 L${SB.x0 - 90} 800 L${SB.x0 - 40} 840 L${SB.x0 - 110} 920`, { fill: 'none', stroke: '#7CF7FF', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: f(Math.floor(t * 20) % 2) });
  let o = world(t, cam, w, { speedyLocked: slam });
  if (t > 361.3 && t < 361.7) o += C.sfx('SLAM!', 1200, 300, inv(361.3, 361.4, t), 110, 8, '#FF2D55');
  if (t > 361.55) o += C.sfx('BZZZT!', 700, 300, inv(361.55, 361.7, t), 100, -8, '#7CF7FF');
  return o;
}

function shotPile(t) { // 363.3 - 366.7
  const k = ease.inOut(inv(363.4, 365.6, t));
  const cam = { zoom: lerp(1.6, 1.15, k), fx: 960, fy: lerp(860, 640, k), x: 3050 - 960 };
  const rk = G.rocky({ x: 0, y: -1060, s: 1.3, t, face: 'sad' });
  let w = cast.speedy({ x: 3050, y: 1010 - 420, ...speedyPose(t), bodyY: 160, legL: 70, kneeL: 80, legR: 70, kneeR: 80, face: { name: 'smug' }, props: [{ svg: rk, layer: 'top' }] });
  let o = world(t, cam, w, { pile: true });
  if (t > 364.6) o += S.g(S.rect(-200, -60, 400, 120, 26, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 6 }) + S.el('text', { x: 0, y: 30, 'font-family': 'Lilita One', 'font-size': 80, fill: '#FFE14D', 'text-anchor': 'middle' }, `ROCKS: ${Math.min(200, Math.floor(inv(364.6, 366.2, t) * 200))}`), 'translate(1600 140)');
  return o;
}

function shotWhyRocks(t) { // 366.7 - 370.1
  const v = vis('YOU', t);
  const cam = { zoom: 2.0, fx: 960, fy: 700, x: SB.x0 - 1300 };
  let w = drawHero({ x: SB.x0 - 280, y: 1000, s: 0.55, nametag: tag, turn: 0.4, armL: 40, armR: 120 + 20 * Math.sin(t * 10), face: { name: 'crying', mouth: v || 'wail', fx: ['tears'] }, headRot: 5 * Math.sin(t * 7) });
  return world(t, cam, w);
}

function shotCollection(t) { // 370.1 - 371.6
  const v = vis('SPEEDY', t);
  const cam = { zoom: 1.3, fx: 960, fy: 540, x: 3050 - 960, y: -140 };
  const rk = G.rocky({ x: 0, y: -1060, s: 1.3, t, face: 'sad', blink: blinkAt(t, 370.9) });
  return world(t, cam, cast.speedy({ x: 3050, y: 1010 - 420, ...speedyPose(t), bodyY: 160, legL: 70, kneeL: 80, legR: 70, kneeR: 80, face: { name: 'smug', mouth: v || 'smirk', eyes: { upper: 0.5 } }, props: [{ svg: rk, layer: 'top' }] }), { pile: true });
}

// ---------------------------------------------------------------- the mask (371.6 - 374.7)
function shotMask(t) {
  const cam = { zoom: 2.1, fx: 960, fy: 600, x: 0 };
  const wipe = bump(t, 371.8, 372.6);
  const masked = t > 373.0;
  const mk = ease.outBack(inv(372.7, 373.0, t));
  const face = masked ? { name: 'determined', fx: ['mask'] } : { name: 'sad', mouth: 'frown', fx: wipe > 0.2 ? [] : ['tears'] };
  let w = drawHero({ x: 960, y: 1000, s: 0.55, nametag: tag, armR: 9 + 150 * wipe, headRot: -4 * wipe, face, lean: masked ? -3 : 0 });
  let o = `<defs><linearGradient id="dramaBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A1E4A"/><stop offset="1" stop-color="#7B2FFF"/></linearGradient></defs>` + S.rect(0, 0, W, H, 0, { fill: 'url(#dramaBg)' });
  for (let i = 0; i < 18; i++) { const ph = (t * 2 + hash(i)) % 1; o += S.rect(ph * 2200 - 200, hash(i * 3) * 1080, 300, 6, 3, { fill: '#FFFFFF', opacity: 0.25 }); }
  o += S.g(w, E.camTf(cam, 1));
  if (!masked && mk > 0) o += S.g(S.rect(-160, -40, 320, 80, 30, { fill: '#1B1B21', stroke: '#151515', 'stroke-width': 5 }), `translate(${f(lerp(1700, 960, mk))} ${f(lerp(200, 400, mk))}) rotate(${f(360 * (1 - mk))})`);
  if (masked) o += C.burst(1300, 300, inv(373.0, 373.5, t), '#FFFFFF');
  return o;
}

// ---------------------------------------------------------------- the target (374.7 - 387.9)
function shotLeaderboard(t) {
  const cam = { zoom: 1.0, fx: 960, fy: 640, x: 2400 };
  let o = S.g(world(t, cam, ''), null, { filter: 'url(#blurBg)' }) + S.rect(0, 0, W, H, 0, { fill: '#121628', opacity: 0.4 });
  const rows = [['#1', 'xX_EggLord_Xx', '$9.9B'], ['#2', 'Nova', '$8.1B'], ['#3', 'PinkPop', '$2.0B'], ['#4', 'xX_Speedy_Xx', '$1.4B'], ['...', '...', '...'], ['#8B', 'YOU', '$1']];
  o += G.leaderboard(rows, inv(374.9, 375.2, t), t > 378.8 ? 0 : -1);
  if (t > 378.8) o += C.burst(1360, 330, inv(378.8, 379.2, t)) + F.sparkle(540, 300, 30 * bump(t, 378.9, 380.3));
  return o;
}

function shotGoldBase(t) { // 380.5 - 387.9
  const u = t - 380.5;
  const cam = t < 385.1 ? { zoom: 1.15, fx: 960, fy: 640, x: lerp(GB.x0 - 1000, GB.x0 - 300, ease.inOut(inv(380.5, 385.0, t))) }
    : { zoom: lerp(1.15, 2.2, ease.inOut(inv(385.2, 386.0, t))), fx: 960, fy: lerp(640, 660, inv(385.2, 386, t)), x: lerp(GB.x0 - 300, GB.x0 - 1080, ease.inOut(inv(385.2, 386.0, t))) };
  let w = G.gamingChair(6500, 1000, 0.6);
  w += cast.egglord({ view: 'back', x: 6500, y: 1000 - 120, s: 0.45, nametag: NAMES.egglord, shadow: false });
  w += G.gamingChair(6500, 1000, 0.6).replace(/^/, '').slice(0, 0);
  // sweeping lasers across the base
  for (let i = 0; i < 3; i++) { const a = Math.sin(t * (1.5 + i * 0.4) + i) * 0.25; w += E.beam(GB.x0, 760 + i * 90, GB.x1, 760 + i * 90 + Math.tan(a) * 900, 1); }
  let o = world(t, cam, w);
  const lab = (txt, k, x, y) => (k > 0 ? S.g(F.markText(txt, 0, 0, 80, -6, '#FFE14D'), `translate(${x} ${y}) scale(${f(ease.outBack(clamp(k, 0, 1)))})`) : '');
  if (t < 385.1) {
    o += lab('SOLID GOLD', inv(380.7, 380.9, t), 560, 220) + lab('LASERS', inv(382.35, 382.55, t), 1380, 300) + lab('x10 LEGENDARY', inv(383.35, 383.55, t), 960, 420);
  }
  return o;
}

// ---------------------------------------------------------------- the heist (387.9 - 399.4)
function shotSneak(t) { // 387.9 - 391.0
  const v = vis('YOU', t);
  const u = t - 387.9;
  const x = GB.x0 + 120 + u * 140;
  const cam = { zoom: 1.5, fx: 960, fy: 720, x: x - 900 };
  const step = Math.sin(u * 7);
  let w = drawHero({ x, y: 1000, s: 0.55, nametag: tag, turn: 0.85, bodyY: 26 + 8 * Math.abs(step), legL: 8 * step, legR: -8 * step, armL: -24, armR: -20, lean: 6, face: { name: 'sneaky', mouth: v || 'smirk', eyes: { look: [0.95, 0], cross: 0 }, fx: ['mask'] } });
  for (let i = 0; i < 3; i++) { const at = 388.0 + i * 0.85; if (t > at && t < at + 0.8) w += S.g(F.markText('sneak', 0, 0, 44, -10, '#FFFFFF'), `translate(${f(x - 200 + i * 60)} ${f(560 - (t - at) * 80)})`, { opacity: f(1 - (t - at) / 0.8) }); }
  for (let i = 0; i < 2; i++) { const a = Math.sin(t * (1.5 + i * 0.4) + i) * 0.25; w += E.beam(GB.x0, 600 + i * 90, GB.x1, 600 + i * 90 + Math.tan(a) * 900, 0.9); }
  return world(t, cam, w);
}

function shotHeavy(t) { // 391.0 - 399.4
  const i = 1; // the pedestal he robs
  const px = goldPed(i);
  const cam = { zoom: t < 397.1 ? 1.5 : 2.1, fx: 960, fy: 540, x: px - 960, y: t < 397.1 ? 250 : 160 };
  const lift = ease.inOut(inv(391.2, 392.4, t));
  const onHead = t > 393.4;
  const heavy = onHead ? ease.out(inv(393.5, 394.0, t)) : 0;
  const shake = onHead ? Math.sin(t * 40) * 3 : 0;
  const bodyY = onHead ? 130 * heavy + 10 * Math.sin(t * 6) : 30 * (1 - lift);
  const eggY = -1035 + bodyY;
  const you = { x: px + 30 + shake, y: 1000, s: 0.55, nametag: null, bodyY, sy: 1 - 0.06 * heavy, sx: 1 + 0.05 * heavy, armL: onHead ? 150 : lerp(30, 160, lift), armR: onHead ? 150 : lerp(30, 160, lift),
    face: onHead ? { name: 'angry', mouth: vis('YOU', t) || 'teeth', fx: ['mask', 'sweat2', ...(t > 397.1 ? ['redface'] : [])] } : { name: 'excited', fx: ['mask'] },
    props: [] };
  let w = '';
  const eggSvg = egg({ x: 0, y: 0, size: 230, rarity: 'legendary', glow: true });
  if (onHead) you.props = [{ svg: S.g(eggSvg, `translate(0 ${f(eggY)})`), layer: 'top' }];
  else if (t > 391.2) w += S.g(eggSvg, `translate(${f(px)} ${f(lerp(940 - 58 - 60, 1000 - 0.55 * 1300, lift))}) scale(0.55)`);
  w = drawHero(you) + w;
  let o = world(t, cam, w, { takenEgg: t > 391.2 ? i : -1 });
  if (t > 393.5 && t < 394.2) o += C.sfx('THUD!', 1300, 300, inv(393.5, 393.6, t), 110, -8, '#FFE14D');
  if (t > 395.0 && t < 397.1) { // weight tag with a fridge
    const k = ease.outBack(inv(395.1, 395.3, t));
    let fr = S.rect(-40, -80, 80, 160, 12, { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 5 }) + S.path('M-40 -20 L40 -20 M-28 -60 L-28 -36 M-28 0 L-28 40', { fill: 'none', stroke: '#151515', 'stroke-width': 5 });
    o += S.g(S.rect(-240, -110, 480, 220, 30, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 6 }) + S.g(fr, 'translate(-140 0)') + S.el('text', { x: 60, y: -20, 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 40, fill: '#9AA3BC', 'text-anchor': 'middle' }, 'WEIGHT:') + S.el('text', { x: 60, y: 50, 'font-family': 'Lilita One', 'font-size': 76, fill: '#FFE14D', 'text-anchor': 'middle' }, '1 FRIDGE'), `translate(1500 260) scale(${f(k)})`);
  }
  return o;
}

// ---------------------------------------------------------------- alarm + EggLord (399.4 - 404.7)
function alarm(t) {
  let o = S.rect(0, 0, W, H, 0, { fill: '#FF2D55', opacity: f(0.08 + 0.12 * Math.max(0, Math.sin(t * 10))) });
  const a = t * 6;
  o += S.g(S.path('M0 0 L-180 -1400 L180 -1400 Z', { fill: '#FF2D55', opacity: 0.18 }) + S.path('M0 0 L-180 1400 L180 1400 Z', { fill: '#FF2D55', opacity: 0.18 }), `translate(960 80) rotate(${f(a * 57)})`);
  o += S.rect(900, 40, 120, 70, 20, { fill: '#FF2D55', stroke: '#151515', 'stroke-width': 6 });
  return o;
}

function shotAlarm(t) { // 399.4 - 402.7
  const turnK = ease.inOut(inv(400.8, 402.4, t));
  const cam = { zoom: 1.6, fx: 960, fy: 680, x: 6500 - 960 - 100 };
  let w = '';
  const chairW = Math.cos(turnK * Math.PI);
  // chair rotates: back (1) -> side (0) -> front (-1)
  if (chairW > 0) {
    w += cast.egglord({ view: 'back', x: 6500, y: 1000 - 120, s: 0.45, nametag: NAMES.egglord, shadow: false });
    w += S.g(G.gamingChair(0, 0, 0.6), `translate(6500 1000) scale(${f(Math.max(0.15, chairW))} 1)`);
  } else {
    w += S.g(G.gamingChair(0, 0, 0.6), `translate(6500 1000) scale(${f(Math.max(0.15, -chairW))} 1)`);
    w += cast.egglord({ x: 6500, y: 1000 - 120, s: 0.45, bodyY: 140, legL: 30, kneeL: 90, legR: 30, kneeR: 90, armL: 20, armR: 20, face: { name: 'deadpan' }, nametag: NAMES.egglord, shadow: false });
  }
  let o = world(t, cam, w) + alarm(t);
  if (t < 400.6) o += C.sfx('WEE-OO!', 1500, 250, inv(399.45, 399.6, t), 90, 8, '#FF2D55');
  return o;
}

function shotBro(t) { // 402.7 - 404.7
  const v = vis('EGGLORD', t);
  const cam = { zoom: 2.4, fx: 960, fy: 520, x: 6500 - 960 };
  let w = S.g(G.gamingChair(0, 0, 0.6), 'translate(6500 1000)');
  w += cast.egglord({ x: 6500, y: 1000 - 120, s: 0.45, bodyY: 140, legL: 30, kneeL: 90, legR: 30, kneeR: 90, armL: 20, armR: t > 403.6 ? 140 : 20, face: { name: 'deadpan', mouth: v || 'line', eyes: { upper: 0.55 } }, nametag: NAMES.egglord, shadow: false, headRot: t > 403.6 ? -4 : 0 });
  return world(t, cam, w) + alarm(t) + S.rect(0, 0, W, H, 0, { fill: '#000', opacity: 0.0 });
}

// ---------------------------------------------------------------- ZAP (404.7 - 407.9)
function heroPieces(x, y, s, k, t) {
  const D = YOU_DESIGN;
  const parts = [
    [D.head({ name: 'oof' }, 0, true), [0, -720], [-60, -900], 520],
    [D.torso(0, true, false), [0, -420], [80, -260], 120],
    [S.g(D.arm({}), 'translate(-100 -515)'), [-100, -400], [-620, -380], -400],
    [S.g(D.arm({}), 'translate(100 -515) scale(-1 1)'), [100, -400], [620, -440], 380],
    [S.g(D.leg({ J: standJ() }), 'translate(-48 -306)'), [-48, -150], [-460, 60], -260],
    [S.g(D.leg({ J: standJ() }), 'translate(48 -306) scale(-1 1)'), [48, -150], [480, 40], 300],
  ];
  let o = '';
  for (const [svg, c, d, r] of parts) {
    const dx = d[0] * k, dy = d[1] * k + 1400 * k * k * 0.5;
    o += S.g(svg, `translate(${f(dx)} ${f(Math.min(dy, -c[1] - 60 + 0))}) rotate(${f(r * k)} ${c[0]} ${c[1]})`);
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

function shotZap(t) { // 404.7 - 407.9
  const px = goldPed(1);
  const cam = { zoom: 1.5, fx: 960, fy: 540, x: px - 960, y: 250 };
  let w = '';
  const zap = t > 405.4;
  if (!zap) {
    w += drawHero({ x: px + 30, y: 1000, s: 0.55, nametag: null, bodyY: 130, sy: 0.94, sx: 1.05, armL: 150, armR: 150, face: { name: 'scared', eyes: { pupil: 0.4 }, fx: ['mask', 'sweat2'] }, props: [{ svg: S.g(egg({ x: 0, y: 0, size: 230, rarity: 'legendary', glow: true }), `translate(0 ${-1035 + 130})`), layer: 'top' }] });
    // lasers converge
    const k = ease.in(inv(404.8, 405.4, t));
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; w += E.beam(px + Math.cos(a) * 1400, 600 + Math.sin(a) * 700, lerp(px + Math.cos(a) * 900, px, k), lerp(600 + Math.sin(a) * 500, 760, k), 1); }
  } else {
    const k = ease.out(inv(405.4, 406.2, t));
    w += heroPieces(px + 30, 1000, 0.55, k, t);
    w += egg({ x: px + 30 + 300 * k, y: 1000 - 600 + 500 * k * k, size: 130, rarity: 'legendary', glow: true, rot: 300 * k });
  }
  let o = world(t, cam, w, { takenEgg: 1 }) + alarm(t);
  if (t > 405.4 && t < 405.7) o += C.whiteFlash(1 - inv(405.4, 405.7, t));
  if (zap) o += C.sfx('ZAP!', 600, 260, inv(405.4, 405.5, t), 130, -10, '#7CF7FF') + C.sfx('OOF!', 1350, 300, inv(405.6, 405.75, t), 140, 8, '#FFE14D');
  if (t > 406.5) o += S.rect(0, 0, W, H, 0, { fill: '#000', opacity: f(0.6 * inv(406.5, 407.0, t)) });
  return o;
}

function shotOof(t) { // 406.5 - 407.9 : head lying on the gold floor
  const v = vis('YOU', t);
  const cam = { zoom: 3.0, fx: 960, fy: 620, x: goldPed(1) - 960 + 230 };
  let w = S.g(YOU_DESIGN.head({ name: 'oof', mouth: v || 'O' }, 0, true), `translate(${goldPed(1) + 230} 1100) scale(0.55) rotate(80 0 -720) translate(0 0)`);
  for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.1; w += S.g(F.sparkle(0, 0, 14, '#FFE14D'), `translate(${f(goldPed(1) + 230 + Math.cos(a) * 120)} ${f(640 + Math.sin(a) * 30)})`); }
  return world(t, cam, w, { takenEgg: -1 });
}

// ---------------------------------------------------------------- respawn, no dignity (407.9 - 414.0)
function shotRespawn(t) {
  const cam = { zoom: 1.35, fx: 960, fy: 700, x: -60 };
  const sp = inv(408.0, 408.4, t);
  let w = drawHero({ x: 900, y: 1000, s: 0.55, nametag: { name: 'YOU', health: 0.2 }, face: t < 409.0 ? { name: 'dizzy' } : { name: 'sad', mouth: 'frown' }, headRot: t > 409.0 ? 6 : 0, lift: 100 * (1 - ease.out(sp)), bodyY: t > 409 ? 14 : 0 });
  w += G.forcefield(900, 1000, 0.55, t, 1 - inv(409.0, 409.6, t));
  if (t > 410.2) w += G.rainCloud(900, 1000 - 0.55 * 1250, 0.7, t);
  const tx = lerp(-100, 1700, inv(410.4, 413.6, t));
  if (t > 410.4) w += S.g(S.rect(-40, -40, 80, 80, 14, { fill: '#C9A36A', stroke: '#151515', 'stroke-width': 5 }) + S.path('M-30 -10 L30 10 M-10 -30 L10 30', { stroke: '#8A6A3A', 'stroke-width': 5 }), `translate(${f(tx)} ${f(1040 - Math.abs(Math.sin(t * 9)) * 40)}) rotate(${f(t * 400)})`);
  let o = world(t, cam, w);
  // three NO labels
  const beats = [[410.2, 'NO ROCKY', 560], [411.3, 'NO EGG', 960], [412.3, 'NO DIGNITY', 1380]];
  for (const [b, txt, x] of beats) if (t > b) o += S.g(S.rect(-170, -50, 340, 100, 20, { fill: '#1F2233', stroke: '#FF2D55', 'stroke-width': 6 }) + S.el('text', { x: 0, y: 24, 'font-family': 'Lilita One', 'font-size': 58, fill: '#FF4D6D', 'text-anchor': 'middle' }, txt), `translate(${x} 180) rotate(-4) scale(${f(ease.outBack(inv(b, b + 0.2, t)))})`);
  if (t < 408.3) o += C.whiteFlash(1 - inv(407.9, 408.3, t));
  return o;
}

function scene(t) {
  if (t < 344.8) return shotShowRocky(t);
  if (t < 346.9) return shotUnlocked(t);
  if (t < 348.7) return shotBlur(t);
  if (t < 353.9) return shotIntroCard(t);
  if (t < 355.0) return shotYoink(t);
  if (t < 357.2) return shotNooo(t);
  if (t < 360.5) return shotChase(t);
  if (t < 363.3) return shotDoorSlam(t);
  if (t < 366.7) return shotPile(t);
  if (t < 370.1) return shotWhyRocks(t);
  if (t < 371.6) return shotCollection(t);
  if (t < 374.7) return shotMask(t);
  if (t < 380.5) return shotLeaderboard(t);
  if (t < 387.9) return shotGoldBase(t);
  if (t < 391.0) return shotSneak(t);
  if (t < 399.4) return shotHeavy(t);
  if (t < 402.7) return shotAlarm(t);
  if (t < 404.7) return shotBro(t);
  if (t < 406.5) return shotZap(t);
  if (t < 407.9) return shotOof(t);
  return shotRespawn(t);
}

module.exports = { scene, TRACK, LINES, START, END };
