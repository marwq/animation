// Part 5 (4:21 - 5:41.4): inside Steal an Egg. Loading tip, YOU's Base, the conveyor belt prices,
// a glimpse of the ??? egg, the three rules, Touch Grass, the Dirt Egg hatches into Rocky.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const G = require('./env4');
const C = require('./common');
const U = require('./ui');
const A = require('./acting');
const { drawHero } = require('../rig/hero');
const { draw: cast, NAMES } = require('../rig/cast');
const { draw: cast2, NAMES2 } = require('../rig/cast2');
const { egg } = require('../rig/props');
const { chicken } = require('../rig/creatures');
const { f, ease, inv, lerp, clamp } = S;
const { W, H, bump, blinkAt, hash } = C;

const START = 261.0, END = 341.4;
const LINES = [
  [261.60, 264.60, 'SYSTEM', 'Welcome to Steal an Egg! Tip: always lock your base!'],
  [264.90, 265.90, 'NARRATOR', 'Remember that tip.'],
  [266.40, 267.20, 'NARRATOR', "You *won't.*"],
  [267.60, 270.20, 'NARRATOR', 'You spawn in your own empty base.'],
  [270.50, 272.80, 'NARRATOR', 'And the sign out front says... *"YOU\'s Base."*'],
  [273.10, 275.00, 'YOU', '"YOU\'s"? That\'s not even *grammar!*'],
  [275.40, 278.40, 'NARRATOR', 'In the middle of the map, a conveyor belt rolls eggs past every base.'],
  [278.60, 279.90, 'NARRATOR', 'Dirt Egg: *ten bucks.*'],
  [280.10, 281.60, 'NARRATOR', 'Rare Egg: *five thousand.*'],
  [281.80, 283.80, 'NARRATOR', 'Legendary Egg: one *MILLION.*'],
  [284.20, 287.40, 'NARRATOR', 'And for just one second... a glitchy egg with three question marks rolls by.'],
  [287.80, 288.90, 'NARRATOR', "Then it's *gone.*"],
  [289.20, 290.90, 'YOU', '...Did anyone else see that?'],
  [291.30, 292.40, 'NARRATOR', '*Rule one:*'],
  [292.50, 295.60, 'NARRATOR', 'eggs hatch into pets. Pets make money. Money buys better eggs.'],
  [296.00, 298.00, 'NARRATOR', "It's basically a job... with *chickens.*"],
  [298.40, 301.40, 'NARRATOR', '*Rule two:* you can steal *ANY* egg, from *ANY* base.'],
  [301.60, 305.00, 'NARRATOR', 'But when you carry one, it sits on top of your head, you run at *half speed...*'],
  [305.50, 307.00, 'NARRATOR', 'and *EVERYONE* can see it.'],
  [307.40, 309.00, 'NARRATOR', '*Rule three:* lock your base.'],
  [309.30, 310.50, 'YOU', 'Got it. *Easy.*'],
  [310.90, 312.40, 'NARRATOR', 'It was *not* easy.'],
  [312.80, 314.80, 'NARRATOR', 'You have *zero* dollars.'],
  [315.00, 317.60, 'NARRATOR', 'So you do the starter quest: *"Touch Grass."*'],
  [318.00, 319.30, 'NARRATOR', 'You touch the grass.'],
  [319.80, 320.80, 'NARRATOR', '*Ten dollars.*'],
  [321.20, 324.00, 'NARRATOR', 'Roblox literally paid you to *touch grass.*'],
  [324.40, 325.80, 'NARRATOR', 'You buy a Dirt Egg.'],
  [326.00, 327.00, 'NARRATOR', 'It wobbles...'],
  [327.20, 328.20, 'NARRATOR', 'it cracks...'],
  [328.40, 329.60, 'NARRATOR', 'and out comes—'],
  [330.40, 332.20, 'YOU', '...a rock. With *legs.*'],
  [332.60, 334.20, 'NARRATOR', '*One dollar* per second.'],
  [334.60, 336.60, 'YOU', "I'm gonna call you *Rocky.*"],
  [336.80, 338.00, 'YOU', "You're perfect."],
  [338.20, 340.60, 'YOU', 'I would *DIE* for you, Rocky.'],
];
const TRACK = C.makeTrack(LINES);
const vis = (sp, t) => C.visemeAt(TRACK, sp, t);
const tag = { name: 'YOU', health: 1 };
const whip = (t, a, b, inner) => { const k = bump(t, a, b); return k > 0.02 ? S.g(inner, `translate(${f((t < (a + b) / 2 ? -1 : 1) * k * 160)} 0)`, { filter: 'url(#whip)' }) : inner; };

// ---------------------------------------------------------------- YOU's base
const BASE = { x0: 300, x1: 1500, col: '#FF8FC8', sign: "YOU's Base", doorSide: 'right' };
const PED = (i) => BASE.x0 + ((i + 1) * (BASE.x1 - BASE.x0)) / 4; // 3 pedestals
function baseShot(t, cam, world = '', o = {}) {
  const M = G.eggMap(cam, t, { beltOff: t * 120, tags: o.tags });
  const b = G.base({ ...BASE, locked: false, lockLabel: o.lockLabel, unlockedBlink: o.blink, pedestals: o.peds || [null, null, null] }, t);
  return M.bg + M.ground + S.g(b + world, E.camTf(cam, 1));
}
const money = (t) => (t < 319.9 ? '$0' : t < 325.4 ? '$10' : t < 332.6 ? '$0' : `$${Math.max(0, Math.floor((t - 332.6) * 1.0))}`);

// ---------------------------------------------------------------- shots
function shotLoading(t) { // 261.0 - 267.4
  const p = ease.inOut(inv(261.2, 264.6, t));
  const zoom = 1 + 0.35 * ease.inOut(inv(264.8, 265.4, t));
  let o = S.g(G.loading(t, p, inv(261.8, 262.1, t), inv(266.45, 267.2, t)), `translate(960 900) scale(${f(zoom)}) translate(-960 -900)`);
  o += C.whiteFlash(1 - inv(261.0, 261.3, t));
  return o;
}

function shotSpawn(t) { // 267.4 - 273.0
  const cam = t < 270.4 ? { zoom: 1.2, fx: 960, fy: 720, x: -60 } : { zoom: lerp(1.2, 2.2, ease.inOut(inv(270.4, 271.2, t))), fx: 960, fy: lerp(720, 640, inv(270.4, 271.2, t)), x: lerp(-60, 700, ease.inOut(inv(270.4, 271.2, t))) };
  const sp = inv(267.5, 268.0, t);
  const you = { x: 900, y: 1000, s: 0.55, nametag: tag, face: t < 269.0 ? { name: 'amazed' } : { name: 'neutral', eyes: { look: [Math.sin(t * 2) * 0.8, 0] } }, ...A.breathe(t), lift: 120 * (1 - ease.out(sp)) };
  let w = drawHero(you) + G.forcefield(900, 1000, 0.55, t, 1 - inv(268.6, 269.2, t));
  // tumbleweed cube rolling through the empty base
  const tx = lerp(-100, 1700, inv(268.4, 270.6, t));
  if (t > 268.4 && t < 270.6) w += S.g(S.rect(-40, -40, 80, 80, 14, { fill: '#C9A36A', stroke: '#151515', 'stroke-width': 5 }) + S.path('M-30 -10 L30 10 M-10 -30 L10 30', { stroke: '#8A6A3A', 'stroke-width': 5 }), `translate(${f(tx)} ${f(1040 - Math.abs(Math.sin(t * 9)) * 40)}) rotate(${f(t * 400)})`);
  let o = baseShot(t, cam, w);
  if (t < 267.7) o += C.whiteFlash(1 - inv(267.4, 267.7, t));
  if (t > 271.9) o += S.g(S.path('M-40 -40 L40 40 M40 -40 L-40 40', { stroke: '#FF2D55', 'stroke-width': 0 }), '');
  return o;
}

function shotGrammar(t) { // 273.0 - 275.3
  const v = vis('YOU', t);
  const cam = { zoom: 1.6, fx: 960, fy: 640, x: 360 };
  const you = { x: 1380, y: 1000, s: 0.55, turn: 0.6, armR: 100, nametag: tag, face: { name: 'angry', mouth: v || 'teeth', eyes: { look: [1, -0.3] } }, headRot: 4 * Math.sin(t * 12) };
  let o = baseShot(t, cam, drawHero(you));
  const k = ease.out(inv(273.9, 274.3, t));
  if (k > 0) {
    // red pen correction on the sign
    const sx = (BASE.x1 + 120 - 960 - 360) * 1.6 + 960, sy = (700 - 640) * 1.6 + 640;
    o += S.path(`M${sx - 300} ${sy - 30} q60 -70 120 0`, { fill: 'none', stroke: '#FF2D55', 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-dasharray': '300', 'stroke-dashoffset': f(300 * (1 - k)) });
    o += S.g(F.markText("YOUR?", 0, 0, 64, -8, '#FF2D55'), `translate(${sx - 240} ${sy - 120}) scale(${f(k)})`);
  }
  return o;
}

function shotBelt(t) { // 275.3 - 289.1
  const hl = t >= 281.8 ? 'legendary' : t >= 280.1 ? 'rare' : t >= 278.6 ? 'common' : null;
  const slow = t > 284.0 && t < 288.9 ? 1 - 0.6 * bump(t, 284.0, 288.9) : 1;
  const off = (t - 275.3) * 120 * slow + 400;
  const secret = t > 284.4 && t < 288.0 ? lerp(-200, 2200, inv(284.4, 288.6, t)) + off * 0 : undefined;
  const zoom = 1.75 + (hl === 'legendary' ? 0.25 * ease.out(inv(281.8, 282.1, t)) : 0) + (secret !== undefined ? 0.1 : 0);
  const cam = { zoom, fx: 960, fy: 560, x: 0 };
  const M = G.eggMap(cam, t, { beltOff: off, tags: true, highlight: hl, secretX: secret === undefined ? undefined : secret - 0 });
  let o = M.bg + M.ground;
  if (hl === 'legendary') o += C.burst(960, 400, inv(281.9, 282.4, t)) + F.sparkle(700, 300, 30 * bump(t, 282, 283.6)) + F.sparkle(1300, 280, 24 * bump(t, 282.2, 283.6));
  if (secret !== undefined) {
    const gl = Math.sin(t * 37) > 0.5;
    if (gl) o += S.rect(0, hash(Math.floor(t * 37)) * H, W, 24, 0, { fill: '#00F0FF', opacity: 0.4 });
  }
  if (t > 287.8 && t < 288.3) o += S.rect(0, 0, W, H, 0, { fill: '#7B2FFF', opacity: f(0.5 * bump(t, 287.8, 288.3)) });
  return o;
}

function shotWhisper(t) { // 289.1 - 291.2
  const v = vis('YOU', t);
  const cam = { zoom: 1.5, fx: 960, fy: 650, x: -60 };
  const look = Math.sin((t - 289.1) * 5);
  let w = cast.pinky({ x: 420, y: 1000, s: 0.5, turn: 0.4, face: { name: 'happy', eyes: { look: [0, 0.7] } }, armR: -30, nametag: NAMES.pinky });
  w += cast.max({ x: 1380, y: 1000, s: 0.5, ...A.floss(t), face: 'joy', nametag: NAMES.max });
  w += drawHero({ x: 900, y: 1000, s: 0.55, nametag: tag, turn: look * 0.4, face: { name: 'nervous', mouth: v || 'o', eyes: { look: [look, 0], cross: 0 } }, armL: 20, armR: 20 });
  return baseShot(t, cam, w);
}

function cycleDiagram(t, k) {
  if (k <= 0) return '';
  const items = [egg({ x: 0, y: 0, size: 120, rarity: 'common', glow: false }), chicken({ x: 0, y: 60, s: 0.32, look: 0 }), F.robuxIcon ? S.g(S.circle(0, 0, 56, { fill: '#3BD16F', stroke: '#151515', 'stroke-width': 6 }) + S.el('text', { x: 0, y: 24, 'font-family': 'Lilita One', 'font-size': 70, fill: '#FFFFFF', 'text-anchor': 'middle' }, '$'), '') : '', egg({ x: 0, y: 0, size: 140, rarity: 'legendary', glow: true })];
  const pos = [[-540, 0], [-180, 0], [180, 0], [540, 0]];
  const beats = [292.5, 293.3, 294.2, 295.0];
  let o = '';
  items.forEach((it, i) => {
    const kk = ease.outBack(inv(beats[i], beats[i] + 0.2, t));
    if (kk > 0) o += S.g(S.circle(0, 0, 110, { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 7 }) + it, `translate(${pos[i][0]} ${pos[i][1]}) scale(${f(kk)})`);
    if (i > 0 && kk > 0) o += S.path(`M${pos[i - 1][0] + 120} 0 L${pos[i][0] - 130} 0 M${pos[i][0] - 160} -24 L${pos[i][0] - 130} 0 L${pos[i][0] - 160} 24`, { fill: 'none', stroke: '#151515', 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  });
  return S.g(o, `translate(960 560) scale(${f(ease.out(clamp(k, 0, 1)))})`);
}

function shotRule1(t) { // 291.2 - 298.3
  const cam = { zoom: 1.1, fx: 960, fy: 640, x: -60 };
  let o = S.g(baseShot(t, cam, ''), null, { filter: 'url(#blurBg)' }) + S.rect(0, 0, W, H, 0, { fill: '#1F2233', opacity: 0.35 });
  if (t < 296.0) o += cycleDiagram(t, inv(292.3, 292.6, t));
  else {
    // a chicken with a tie and a briefcase: "9 TO 5"
    const ph = (t - 296.0) * 8;
    let ck = chicken({ x: 0, y: 0, s: 1.1, look: 0.4, headRot: 4 * Math.sin(ph) });
    ck += S.path('M-14 -300 L14 -300 L22 -220 L0 -196 L-22 -220 Z', { fill: '#E0283F', stroke: '#151515', 'stroke-width': 5, 'stroke-linejoin': 'round' });
    ck += S.g(S.rect(-70, -50, 140, 100, 12, { fill: '#8A5A33', stroke: '#151515', 'stroke-width': 6 }) + S.path('M-30 -50 L-30 -76 L30 -76 L30 -50', { fill: 'none', stroke: '#151515', 'stroke-width': 8 }), 'translate(170 -150)');
    o += S.g(ck, `translate(${f(lerp(700, 1200, inv(296, 298.3, t)))} ${f(980 - Math.abs(Math.sin(ph)) * 16)})`);
    o += S.g(S.rect(-200, -70, 400, 140, 30, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 6 }) + S.el('text', { x: 0, y: 30, 'font-family': 'Lilita One', 'font-size': 92, fill: '#5CFF7A', 'text-anchor': 'middle' }, '9 TO 5'), `translate(1460 300) scale(${f(ease.outBack(inv(296.5, 296.7, t)))})`);
  }
  o += G.ruleCard(1, 'Eggs → pets → money', inv(291.3, 291.6, t));
  return o;
}

function shotRule2(t) { // 298.3 - 307.3
  const u = t - 298.3;
  // Max runs left with a stolen egg; the camera tracks him; half speed after 301.6
  const dist = t < 301.6 ? u * 300 : 3.3 * 300 + (t - 301.6) * 150;
  const mx = 3000 - dist;
  const cam = { zoom: 1.15, fx: 960, fy: 640, x: mx - 1100 };
  const M = G.eggMap(cam, t, { beltOff: t * 120 });
  let w = G.base({ x0: 2400, x1: 3600, col: '#34C3FF', sign: "Max's Base", doorSide: 'left', locked: false, lockPanel: false, pedCount: 3 }, t);
  const ph = (t < 301.6 ? u : 3.3 + (t - 301.6) * 0.5) * 22;
  const eggSvg = egg({ x: 0, y: -1180, size: 300, rarity: 'epic', glow: true, wobble: Math.sin(t * 8) * 6 });
  if (t > 305.5) { // everyone sees it
    const k = ease.outBack(inv(305.5, 305.8, t));
    const sx = (dx) => mx + dx;
    w += cast.pinky({ x: sx(-700), y: 1000, s: 0.48, turn: 0.5, armR: 90 * k, face: { name: 'shocked' }, nametag: NAMES.pinky });
    w += cast.speedy({ x: sx(-420), y: 1000, s: 0.48, turn: 0.5, armR: 90 * k, face: { name: 'smug' }, nametag: NAMES.speedy });
    w += cast2.jetkid({ x: sx(560), y: 1000, s: 0.45, turn: -0.5, armL: 90 * k, face: { name: 'shocked' }, nametag: NAMES2.jetkid });
    w += cast2.hotdog({ x: sx(860), y: 1000, s: 0.45, turn: -0.5, armL: 90 * k, face: { name: 'shocked' }, nametag: NAMES2.hotdog });
  }
  w += cast.max({ view: 'side', x: mx, y: 1000, s: 0.5, lean: -8, ...A.run(ph), face: { name: 'scared', mouth: 'teeth', fx: ['sweat2'] }, nametag: NAMES.max, props: [{ svg: eggSvg, layer: 'top' }] });
  if (t < 301.6) w += C.speedLines(mx + 120, mx + 600, 760, 6, 41);
  if (t > 305.5) {
    const k = ease.outBack(inv(305.5, 305.8, t));
    for (const dx of [-170, 170]) w += S.g(S.path('M0 -120 L0 -20 M-34 -56 L0 -20 L34 -56', { fill: 'none', stroke: '#FF2D55', 'stroke-width': 18, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), `translate(${f(mx + dx)} ${f(1000 - 0.5 * 1180 - 30 + 10 * Math.sin(t * 10))}) rotate(${dx > 0 ? -35 : 35}) scale(${f(k)})`);
  }
  let o = M.bg + M.ground + S.g(w, E.camTf(cam, 1));
  if (t > 301.6) o += S.g(S.rect(-120, -50, 240, 100, 24, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 5 }) + S.el('text', { x: 0, y: 26, 'font-family': 'Lilita One', 'font-size': 70, fill: '#FFE14D', 'text-anchor': 'middle' }, '0.5x'), 'translate(1680 300)') + S.rect(0, 0, W, H, 0, { fill: '#7CF7FF', opacity: 0.08 });
  o += G.ruleCard(2, 'Steal ANY egg', inv(298.4, 298.7, t));
  return o;
}

function shotRule3(t) { // 307.3 - 312.6
  const v = vis('YOU', t);
  const cam = { zoom: 1.45, fx: 960, fy: 650, x: 200 };
  const thumbs = ease.outBack(inv(309.3, 309.5, t));
  const you = { x: 1050, y: 1000, s: 0.55, nametag: tag, turn: -0.2, armR: lerp(9, 120, thumbs), face: { name: 'smug', mouth: v || 'smirk', eyes: { look: [-0.4, 0] } }, ...A.breathe(t) };
  let w = drawHero(you);
  if (thumbs > 0) { const [hx, hy] = A.hand(120); w += S.g(F.sparkle(0, 0, 26), `translate(${f(1050 + hx * 0.55)} ${f(1000 + hy * 0.55)})`); }
  let o = baseShot(t, cam, w, { lockLabel: true });
  o += G.ruleCard(3, 'Lock your base', inv(307.4, 307.7, t));
  if (t < 309.3) { // a big padlock icon
    const k = ease.outBack(inv(307.6, 307.9, t));
    o += S.g(S.rect(-110, -60, 220, 170, 30, { fill: '#FFE14D', stroke: '#151515', 'stroke-width': 10 }) + S.path('M-70 -60 L-70 -120 Q0 -200 70 -120 L70 -60', { fill: 'none', stroke: '#151515', 'stroke-width': 26 }) + S.circle(0, 30, 22, { fill: '#151515' }), `translate(1500 520) scale(${f(k * 0.9)})`);
  }
  if (t > 310.9) { // freeze, grey, NOT EASY stamp
    o += S.rect(0, 0, W, H, 0, { fill: '#7A7A8C', opacity: 0.35 });
    const st = ease.outBack(inv(311.1, 311.3, t));
    o += S.g(S.rect(-330, -90, 660, 180, 24, { fill: 'none', stroke: '#FF2D55', 'stroke-width': 16 }) + S.el('text', { x: 0, y: 40, 'font-family': 'Lilita One', 'font-size': 120, fill: '#FF2D55', 'text-anchor': 'middle' }, 'NOT EASY'), `translate(960 460) rotate(-12) scale(${f(2.2 - 1.2 * st)})`, { opacity: f(st) });
  }
  return o;
}

function shotZero(t) { // 312.6 - 317.9
  const cam = { zoom: 1.6, fx: 960, fy: 650, x: -60 };
  const shrug = ease.outBack(inv(313.2, 313.45, t));
  let w = drawHero({ x: 900, y: 1000, s: 0.55, nametag: tag, armL: lerp(9, 60, shrug), armR: lerp(9, 60, shrug), face: { name: 'sad', mouth: 'wavy' } });
  // a moth flies out of the empty pockets
  if (t > 313.5) { const k = inv(313.5, 315.5, t); w += S.g(S.ellipse(-18, 0, 20, 12, { fill: '#C9C1B0', stroke: '#151515', 'stroke-width': 3 }) + S.ellipse(18, 0, 20, 12, { fill: '#C9C1B0', stroke: '#151515', 'stroke-width': 3 }) + S.ellipse(0, 0, 6, 14, { fill: '#6B5A4A' }), `translate(${f(960 + 300 * k + Math.sin(t * 9) * 30)} ${f(840 - 320 * k)}) scale(${f(1 + 0.3 * Math.sin(t * 30))} 1)`); }
  let o = baseShot(t, cam, w);
  o += G.moneyHud('$0', bump(t, 312.8, 313.3)) + S.rect(1500, 40, 380, 92, 30, { fill: '#FF2D55', opacity: f(0.3 * bump(t, 312.8, 313.6)) });
  o += U.toast('NEW QUEST', 'Touch Grass', G.grassBlock(0, 40, 0.45), inv(315.6, 315.9, t));
  return o;
}

function shotGrass(t) { // 317.9 - 324.3
  const cam = { zoom: 1.6, fx: 960, fy: 820, x: 440 };
  const touch = ease.inOut(inv(318.2, 318.9, t)) * (1 - ease.inOut(inv(319.6, 320.0, t)));
  const happy = t > 319.8;
  const you = { x: 1380, y: 1000, s: 0.55, nametag: tag, turn: 0.5, bodyY: 80 * touch, lean: 18 * touch, armR: lerp(9, 40, touch), face: happy ? { name: 'excited' } : { name: 'determined', eyes: { look: [0.8, 0.6], cross: 0 } } };
  let w = G.grassBlock(1600, 1010, 1.0) + drawHero(you);
  if (happy) { const [hx, hy] = A.hand(140); you.armR = 140; w = G.grassBlock(1600, 1010, 1.0) + drawHero({ ...you, armR: 140, armL: 140, bodyY: 0, lean: 0, lift: 40 * bump(t, 319.8, 320.3) }) + G.cash(1380 + hx * 0.55 + 20, 1000 + hy * 0.55 - 30, 0.9, -10); }
  w += G.floatText('+$10', 1600, 840, t - 319.6, '#5CFF7A', 90);
  let o = baseShot(t, cam, w);
  o += G.moneyHud(money(t), bump(t, 319.8, 320.2));
  o += U.toast('QUEST COMPLETE', 'Touch Grass  +$10', G.grassBlock(0, 40, 0.45), inv(321.2, 321.5, t));
  return o;
}

// hatching: wobble / crack / pop
function dirtEgg(t) {
  const x = PED(1), y = 940 - 52;
  if (t < 324.6) return '';
  const fly = inv(324.6, 325.3, t);
  let o = '';
  if (t < 328.4) {
    const ex = lerp(x - 300, x, ease.out(fly)), ey = lerp(y - 600, y - 70, ease.out(fly)) - Math.sin(fly * Math.PI) * 200;
    const wob = t > 326.0 ? Math.sin(t * 30) * 12 * (t < 327.2 ? 1 : 1.6) : 0;
    o += egg({ x: ex, y: ey, size: 150, rarity: 'common', glow: false, rot: wob });
    if (t > 327.2) {
      const c = inv(327.2, 328.2, t);
      const pts = [[0, -60], [-14, -36], [10, -14], [-12, 10], [8, 30]].slice(0, 2 + Math.floor(c * 3));
      o += S.path('M' + pts.map(([a, b]) => `${f(ex + a)} ${f(ey + b)}`).join(' L'), { fill: 'none', stroke: '#151515', 'stroke-width': 7, 'stroke-linejoin': 'round' });
    }
  } else {
    const k = inv(328.4, 329.2, t);
    // two shell halves fly apart, smoke puff, Rocky revealed
    o += S.g(S.path('M-55 0 Q-60 -80 0 -80 L-10 -50 L10 -30 L-5 0 Z', { fill: '#FFF4DE', stroke: '#151515', 'stroke-width': 6 }), `translate(${f(x - 200 * k)} ${f(y - 70 - 200 * Math.sin(k * Math.PI))}) rotate(${f(-200 * k)})`);
    o += S.g(S.path('M55 0 Q60 -80 0 -80 L-10 -50 L10 -30 L-5 0 Z', { fill: '#FFF4DE', stroke: '#151515', 'stroke-width': 6 }), `translate(${f(x + 200 * k)} ${f(y - 70 - 200 * Math.sin(k * Math.PI))}) rotate(${f(200 * k)})`);
    if (k < 1) for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; o += S.circle(x + Math.cos(a) * 140 * k, y - 80 + Math.sin(a) * 90 * k, 50 * (1 - k * 0.7), { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 4, opacity: f(1 - k) }); }
    if (t > 329.0) o += G.rocky({ x, y, s: 0.95, t, blink: blinkAt(t, 329.7, 330.1), face: 'happy', sparkle: t < 330.2 });
  }
  return o;
}

function shotHatch(t) { // 324.3 - 330.3
  const zk = ease.inOut(inv(325.4, 328.3, t));
  const cam = { zoom: lerp(1.2, 1.8, zk), fx: 960, fy: lerp(760, 820, zk), x: -240 };
  if (t > 327.2 && t < 328.4) { cam.sx = Math.sin(t * 60) * 6; cam.sy = Math.cos(t * 51) * 5; }
  let w = drawHero({ x: 560, y: 1000, s: 0.55, nametag: tag, turn: 0.4, face: { name: t > 328.4 ? 'shocked' : 'amazed', eyes: { look: [0.9, -0.2], cross: 0 } }, lift: t > 328.4 ? 50 * bump(t, 328.4, 328.8) : 0 });
  w += dirtEgg(t);
  w += G.floatText('-$10', PED(1), 760, t - 325.0, '#FF4D6D', 80);
  let o = baseShot(t, cam, w, { peds: [null, null, null] });
  o += G.moneyHud(money(t));
  if (t > 328.4 && t < 328.8) o += C.whiteFlash(1 - inv(328.4, 328.8, t));
  return o;
}

function shotRocky(t) { // 330.3 - 334.5
  const v = vis('YOU', t);
  const cam = { zoom: 1.8, fx: 960, fy: 820, x: -240 };
  const legs = t > 331.4;
  let w = drawHero({ x: 560, y: 1000, s: 0.55, nametag: tag, turn: 0.45, face: { name: 'amazed', mouth: v || 'O', eyes: { look: [0.9, 0.3], cross: 0, pupil: 1.5, sparkle: true } } });
  w += G.rocky({ x: PED(1), y: 888 - (legs ? 30 * Math.abs(Math.sin(t * 8)) : 0), s: 0.95, t, walk: legs ? 1 : 0, blink: blinkAt(t, 330.9, 333.4), face: 'happy', look: -0.6 });
  if (t > 332.6) w += G.floatText('+$1', PED(1) + 60, 700, (t - 332.6) % 1.0, '#5CFF7A', 70);
  let o = baseShot(t, cam, w);
  o += G.moneyHud(money(t), t > 332.6 ? bump((t - 332.6) % 1, 0, 0.2) : 0);
  if (t > 332.6) o += S.g(S.rect(-170, -50, 340, 100, 24, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 5 }) + S.el('text', { x: 0, y: 26, 'font-family': 'Lilita One', 'font-size': 64, fill: '#5CFF7A', 'text-anchor': 'middle' }, '+$1 / SEC'), `translate(960 220) scale(${f(ease.outBack(inv(332.6, 332.8, t)))})`);
  return o;
}

function shotLove(t) { // 334.5 - 341.4
  const v = vis('YOU', t);
  const die = t > 338.2;
  const cam = { zoom: die ? 1.9 : 1.6, fx: 960, fy: 880, x: 60 };
  const kneel = ease.inOut(inv(334.6, 335.2, t));
  const you = { x: 980, y: 1000, s: 0.55, nametag: tag, turn: 0.2, bodyY: 70 * kneel, armL: lerp(9, -50, kneel), armR: lerp(9, -50, kneel),
    face: die ? { name: 'crying', mouth: v || 'wail', fx: ['tears', 'blush'] } : { name: 'love', mouth: v || 'grin', fx: ['blush'] }, headRot: 4 * Math.sin(t * 3) };
  let w = drawHero(you) + G.rocky({ x: 985, y: 1000 - 0.55 * (300 - 70 * kneel), s: 0.75, t, face: 'love', blink: 0 });
  let bg = '';
  if (die) { // shoujo sparkles background
    bg = S.rect(0, 0, W, H, 0, { fill: '#FFB3D1' });
    for (let i = 0; i < 16; i++) bg += S.path('M0 0 L-50 -1400 L50 -1400 Z', { fill: '#FFFFFF', opacity: 0.25, transform: `translate(960 600) rotate(${f(i * 22.5 + t * 20)})` });
    for (let i = 0; i < 14; i++) bg += F.sparkle(hash(i) * 1920, hash(i * 3) * 1080, 20 + 20 * Math.abs(Math.sin(t * 3 + i)), '#FFFFFF');
    return S.g(bg, null) + S.g(w, E.camTf(cam, 1));
  }
  let o = baseShot(t, cam, w);
  for (let i = 0; i < 6; i++) { const ph = ((t - 334.5) * 0.6 + i / 6) % 1; o += S.g(S.path(F.heartPath(0, 0, 26), { fill: '#FF5A9A', stroke: '#151515', 'stroke-width': 4 }), `translate(${f(760 + i * 80 + Math.sin(ph * 6 + i) * 30)} ${f(560 - ph * 320)})`, { opacity: f(1 - ph) }); }
  return o;
}

function scene(t) {
  if (t < 267.4) return shotLoading(t);
  if (t < 273.0) return shotSpawn(t);
  if (t < 275.3) return shotGrammar(t);
  if (t < 289.1) return whip(t, 275.15, 275.45, shotBelt(t));
  if (t < 291.2) return shotWhisper(t);
  if (t < 298.3) return shotRule1(t);
  if (t < 307.3) return shotRule2(t);
  if (t < 312.6) return shotRule3(t);
  if (t < 317.9) return shotZero(t);
  if (t < 324.3) return shotGrass(t);
  if (t < 330.3) return shotHatch(t);
  if (t < 334.5) return shotRocky(t);
  return shotLove(t);
}

module.exports = { scene, TRACK, LINES, START, END };
