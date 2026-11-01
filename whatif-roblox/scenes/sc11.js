// Part 10 (9:36.8 - 10:42): the Admin Vault opens; one dollar short; Rocky's bloop; three players at
// the gate; Stage 1 the Laser Hall; Stage 2 the Hatchery and its teeth eggs.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const E2 = require('./env2');
const E5 = require('./env5');
const G = require('./env4');
const C = require('./common');
const A = require('./acting');
const { drawHero } = require('../rig/hero');
const { drawNova } = require('../rig/nova');
const { draw: cast, NAMES } = require('../rig/cast');
const { egg } = require('../rig/props');
const { f, ease, inv, lerp, clamp } = S;
const { W, H, bump, blinkAt, hash } = C;

const START = 576.8, END = 642.0;
const LINES = [
  [577.20, 580.80, 'SYSTEM', 'The Admin Vault is now *OPEN.* Entry fee: *ONE BILLION* dollars.'],
  [581.20, 585.40, 'NARRATOR', 'You check your money. Nine hundred ninety-nine million, nine hundred ninety-nine thousand, nine hundred ninety-nine.'],
  [585.80, 587.60, 'YOU', 'One dollar *SHORT?!* NOOO!'],
  [588.40, 589.80, 'NARRATOR', 'And then... *bloop.*'],
  [590.10, 591.10, 'SYSTEM', '*Plus one dollar!*'],
  [591.50, 594.00, 'NARRATOR', 'Rocky. One dollar per second. Right on time.'],
  [594.30, 595.90, 'YOU', 'ROCKY, I *LOVE* YOU!'],
  [596.30, 601.00, 'NARRATOR', 'The Admin Vault floats above the clouds. Four stages. One egg. And only *three players* brave enough to go in.'],
  [601.30, 604.60, 'EGGLORD', "Oh look, the noob and the girl. Good luck. You're gonna *need* it."],
  [604.90, 606.80, 'NOVA', 'Talk less, EggLord. *Run more.*'],
  [607.20, 610.00, 'NARRATOR', '*Stage one:* the Laser Hall. Red beams, sweeping in every direction.'],
  [610.30, 612.80, 'NARRATOR', 'Nova is fast. But not fast enough. One beam clips her shoe.'],
  [613.00, 613.60, 'NOVA', '*Ah—!*'],
  [614.00, 617.40, 'NARRATOR', "But you? You've been zapped *one thousand and forty-seven* times. You *KNOW* lasers."],
  [617.70, 620.00, 'YOU', 'Left. Wait... Jump— *NOW!*'],
  [620.40, 622.00, 'NARRATOR', 'She lands perfectly. And she looks at you.'],
  [622.30, 623.80, 'NOVA', '...Not bad, *noob.*'],
  [624.30, 627.40, 'NARRATOR', '*Stage two:* the Hatchery. A thousand eggs. One is real. The rest...'],
  [627.70, 628.80, 'NARRATOR', '...have *TEETH.*'],
  [629.10, 630.90, 'YOU', 'WHY DO THE EGGS HAVE *TEETH?!*'],
  [631.10, 632.80, 'NOVA', "DON'T TOUCH THE *PURPLE ONES!*"],
  [633.10, 634.30, 'NARRATOR', 'You touch a purple one.'],
  [634.70, 636.20, 'YOU', '...I touched a purple one.'],
  [636.60, 638.80, 'NARRATOR', "Nova grabs your legs and *PULLS.* Pop! You're free."],
  [639.10, 640.00, 'NOVA', 'You owe me.'],
  [640.30, 641.40, 'YOU', 'Put it on my *tab.*'],
];
const TRACK = C.makeTrack(LINES);
const vis = (sp, t) => C.visemeAt(TRACK, sp, t);
const tag = { name: 'YOU', health: 1 };
const whip = (t, a, b, inner) => { const k = bump(t, a, b); return k > 0.02 ? S.g(inner, `translate(${f((t < (a + b) / 2 ? -1 : 1) * k * 160)} 0)`, { filter: 'url(#whip)' }) : inner; };

const YB = { x0: 300, x1: 1500, col: '#FF8FC8', sign: "YOU's Base", doorSide: 'right' };
const PED = (i) => YB.x0 + ((i + 1) * (YB.x1 - YB.x0)) / 4;
function home(t, cam, w, o = {}) {
  const M = G.eggMap(cam, t, { beltOff: t * 120 });
  const b = G.base({ ...YB, locked: true, pedestals: [egg({ x: 0, y: -58, size: 100, rarity: 'legendary', glow: true }), G.rocky({ x: 0, y: 0, s: 0.95, t, blink: o.rBlink || 0, face: o.rFace || 'happy', sparkle: o.rSpark }), egg({ x: 0, y: -58, size: 100, rarity: 'mythic', glow: true })] }, t);
  let s = M.bg + M.ground + S.g(b + w, E.camTf(cam, 1));
  if (o.vault) { // the vault hangs in the sky above the map
    const L = E.vaultLayers({ zoom: 1 }, t, { eggOnPedestal: true });
    s = M.bg + S.g(S.g(L.bg, 'translate(960 540) scale(0.45) translate(-960 -540)'), `translate(0 ${f(-560 + 300 * ease.out(clamp(o.vault, 0, 1)))})`, { opacity: 0.95 }) + M.ground + S.g(b + w, E.camTf(cam, 1));
  }
  return s;
}
const money = (amt, pulse = 0, gold = false) => S.g(S.rect(-560, -90, 1120, 180, 40, { fill: gold ? '#FFC52E' : '#1F2233', stroke: '#FFFFFF', 'stroke-width': 8 }) + S.circle(-470, 0, 56, { fill: '#3BD16F', stroke: '#151515', 'stroke-width': 6 }) + S.el('text', { x: -470, y: 26, 'font-family': 'Lilita One', 'font-size': 76, fill: '#FFFFFF', 'text-anchor': 'middle' }, '$') + S.el('text', { x: 60, y: 34, 'font-family': 'Lilita One', 'font-size': 100, fill: gold ? '#1F2233' : '#5CFF7A', 'text-anchor': 'middle' }, amt), `translate(960 400) scale(${f(1 + 0.08 * pulse)})`);

// ---------------------------------------------------------------- 576.8 - 596.2: open, short, bloop
function shotOpen(t) {
  const cam = { zoom: 1.0, fx: 960, fy: 540, x: 200, y: 100 };
  let o = home(t, cam, drawHero({ x: 1300, y: 1000, s: 0.5, nametag: tag, face: { name: 'shocked', eyes: { look: [0, -1], cross: 0 } } }), { vault: inv(577.0, 578.6, t) });
  o += S.rect(0, 0, W, H, 0, { fill: '#1A0B3A', opacity: f(0.3 * inv(576.8, 577.4, t)) });
  if (t < 577.2) o += C.whiteFlash(1 - inv(576.8, 577.2, t));
  o += E2.skyMessage([{ text: 'THE ADMIN VAULT IS OPEN', col: '#FFE14D' }, { text: 'ENTRY FEE: $1,000,000,000', col: '#FFFFFF' }], inv(577.3, 577.6, t), { x: 1260, y: 640, h: 300, w: 1100, headCol: '#7B2FFF', title: '★ FINAL LEVEL' });
  return o;
}
function shotShort(t) { // 581.1 - 588.2
  if (t < 585.7) {
    const p = ease.inOut(inv(581.4, 585.2, t));
    const n = Math.floor(lerp(0, 999999999, p));
    let o = S.rect(0, 0, W, H, 0, { fill: '#121628' });
    for (let i = 0; i < 14; i++) o += S.path('M0 0 L-70 -1200 L70 -1200 Z', { fill: '#FFFFFF', opacity: 0.05, transform: `translate(960 400) rotate(${f(i * 25.7 + t * 20)})` });
    o += money(n.toLocaleString('en-US'), bump(t, 585.0, 585.5));
    o += S.g(S.rect(-330, -50, 660, 100, 24, { fill: '#1F2233', stroke: '#FF4D6D', 'stroke-width': 6 }) + S.el('text', { x: 0, y: 26, 'font-family': 'Lilita One', 'font-size': 60, fill: '#FF4D6D', 'text-anchor': 'middle' }, 'NEED: $1,000,000,000'), 'translate(960 640)');
    return o;
  }
  const v = vis('YOU', t);
  const cam = { zoom: 1.9, fx: 960, fy: 540, x: 1100 - 960, y: 180 };
  return home(t, cam, drawHero({ x: 1100, y: 1000, s: 0.55, nametag: tag, bodyY: 60, armL: 150, armR: 150, face: { name: 'crying', mouth: v || 'wail', fx: ['tears'] }, headRot: -8 })) + S.rect(0, 0, W, H, 0, { fill: '#2A1E4A', opacity: 0.2 });
}
function shotBloop(t) { // 588.2 - 596.2
  if (t < 594.2) {
    const cam = { zoom: 2.2, fx: 960, fy: 540, x: PED(1) - 960, y: 150 };
    const bl = t > 589.0;
    let o = home(t, cam, G.floatText('+$1', PED(1), 760, t - 589.2, '#5CFF7A', 90), { rBlink: blinkAt(t, 592.6), rFace: t > 591.4 ? 'happy' : 'happy', rSpark: t > 591.4 });
    if (bl) o += C.sfx('bloop.', 1300, 340, inv(589.0, 589.15, t) * (1 - inv(590.0, 590.2, t)), 70, -6, '#FFFFFF');
    if (t > 590.0) o += S.g(money('1,000,000,000', bump(t, 590.0, 590.4), true), 'translate(0 -260) scale(1)').replace('translate(960 400)', 'translate(960 400) scale(0.8)');
    if (t < 588.6) o += S.rect(0, 0, W, H, 0, { fill: '#000', opacity: f(0.4 * (1 - inv(588.2, 588.6, t))) });
    return o;
  }
  const v = vis('YOU', t);
  const cam = { zoom: 1.7, fx: 960, fy: 540, x: PED(1) - 960, y: 200 };
  const [hx, hy] = A.hand(160);
  let w = drawHero({ x: PED(1), y: 1000, s: 0.55, nametag: tag, armL: 160, armR: 160, lift: 50 * Math.abs(Math.sin(t * 6)), face: { name: 'joy', mouth: v || 'bigGrin', fx: ['blush'] } });
  w += G.rocky({ x: PED(1), y: 1000 - 0.55 * (1150 + 50 * Math.abs(Math.sin(t * 6))) + 10, s: 0.75, t, face: 'love' });
  let o = home(t, cam, w);
  for (let i = 0; i < 6; i++) { const ph = ((t - 594.2) * 0.8 + i / 6) % 1; o += S.g(S.path(F.heartPath(0, 0, 26), { fill: '#FF5A9A', stroke: '#151515', 'stroke-width': 4 }), `translate(${f(700 + i * 100)} ${f(500 - ph * 320)})`, { opacity: f(1 - ph) }); }
  return o;
}

// ---------------------------------------------------------------- 596.2 - 607.1: at the gate
function gate(t, cam, chars) {
  const L = E.vaultLayers(cam, t, { eggOnPedestal: true });
  let o = L.bg + L.platform;
  // a big gate in front of the tower
  let g = S.rect(700, 520, 520, 400, 24, { fill: '#151521', stroke: '#151515', 'stroke-width': 8 }) + S.rect(730, 550, 460, 370, 16, { fill: '#7B2FFF', opacity: f(0.5 + 0.2 * Math.sin(t * 4)) });
  g += S.el('text', { x: 960, y: 500, 'font-family': 'Lilita One', 'font-size': 56, fill: '#FFC52E', 'text-anchor': 'middle', stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke' }, '4 STAGES · 1 EGG');
  o += S.g(g, E.camTf(cam, 0.95));
  o += S.g(chars, E.camTf(cam, 1));
  return o;
}
function trio(t, faces = {}) {
  const v = (sp) => vis(sp, t);
  let w = cast.egglord({ x: 560, y: 990, s: 0.6, nametag: NAMES.egglord, turn: 0.3, face: faces.egg || { name: 'smug', mouth: v('EGGLORD') || 'smirk' }, armL: 30, armR: 30 });
  w += drawHero({ x: 960, y: 990, s: 0.6, nametag: tag, face: faces.you || { name: 'determined' }, armL: 9, armR: 9, ...A.breathe(t) });
  w += drawNova({ x: 1360, y: 990, s: 0.6, nametag: 'Nova', turn: -0.3, face: faces.nova || { name: 'cool', mouth: v('NOVA') || 'smallSmile' }, ...A.breathe(t, 1) });
  return w;
}
function shotGate(t) {
  if (t < 601.2) {
    const k = ease.inOut(inv(596.2, 601.0, t));
    const cam = { zoom: lerp(0.7, 1.05, k), fx: 960, fy: 540, x: 0, y: lerp(-200, 60, k) };
    let o = gate(t, cam, trio(t));
    o += C.whiteFlash(1 - inv(596.2, 596.5, t));
    return o;
  }
  if (t < 604.8) {
    const cam = { zoom: 2.2, fx: 960, fy: 540, x: 560 - 960 + 40, y: 120 };
    return gate(t, cam, trio(t, { egg: { name: 'smug', mouth: vis('EGGLORD', t) || 'smirk', eyes: { look: [0.9, 0] } } }));
  }
  const cam = { zoom: 2.2, fx: 960, fy: 540, x: 1360 - 960 - 40, y: 120 };
  return gate(t, cam, trio(t, { nova: { name: 'unimpressed', mouth: vis('NOVA', t) || 'short', eyes: { look: [-0.9, -0.3] } } }));
}

// ---------------------------------------------------------------- 607.1 - 624.2: the Laser Hall
function laserHall(t, cam, w) {
  const Hl = E5.hall(cam, t, { title: 'STAGE 1 · LASER HALL', titleX: 960 + (cam.x || 0) * 0.85 });
  return Hl.back + Hl.floor + S.g(E5.sweepers(t, -600, 4400, 9, 1) + w, E.camTf(cam, 1)) + S.rect(0, 0, W, H, 0, { fill: '#FF2D55', opacity: f(0.06 + 0.04 * Math.sin(t * 9)) });
}
function shotLaserHall(t) {
  if (t < 613.9) {
    const u = t - 607.1;
    const nx = 200 + u * 300;
    const cam = { zoom: 1.0, fx: 960, fy: 540, x: nx - 960 + 200, y: 100 };
    const clip = t > 612.4;
    let w = drawNova({ view: 'side', flip: true, x: nx, y: 1000, s: 0.55, lean: clip ? 10 : -10, ...A.run(u * 30, clip ? 0.4 : 1), rot: clip ? 10 * Math.sin(Math.min(1, (t - 612.4) * 3) * Math.PI) : 0, face: clip ? { name: 'shocked', mouth: vis('NOVA', t) || 'O', glassesDy: 16 } : { name: 'determined' }, nametag: 'Nova' });
    w += drawHero({ view: 'side', flip: true, x: nx - 360, y: 1000, s: 0.55, lean: -8, ...A.run(u * 28), face: { name: 'determined', eyes: { look: [1, -0.2] } }, nametag: tag });
    if (clip) for (let i = 0; i < 6; i++) { const a = hash(i) * Math.PI * 2, r = 40 + 80 * inv(612.4, 612.9, t); w += S.path(`M${f(nx + 30 + Math.cos(a) * r)} ${f(985 + Math.sin(a) * r * 0.5)} l${f(Math.cos(a) * 30)} ${f(Math.sin(a) * 15)}`, { stroke: '#FFE14D', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: f(1 - inv(612.4, 613.2, t)) }); }
    return laserHall(t, cam, w) + (clip ? C.sfx('ZZT!', 1300, 400, inv(612.4, 612.5, t), 100, 8, '#FFE14D') : '');
  }
  if (t < 617.6) { // lasers reflected in the hero's eyes
    const cam = { zoom: 2.6, fx: 960, fy: 540, x: 1600 - 960, y: 60 };
    let w = drawHero({ x: 1600, y: 1000, s: 0.55, nametag: tag, turn: 0.3, face: { name: 'determined', fx: ['sparkles'] }, headRot: -4 });
    let o = laserHall(t, cam, w);
    for (const ex of [860, 1060]) for (let i = 0; i < 2; i++) o += S.path(`M${ex - 40} ${f(470 + i * 30 + 20 * Math.sin(t * 6 + i))} L${ex + 40} ${f(450 + i * 30 + 20 * Math.sin(t * 6 + i))}`, { stroke: '#FF4D6D', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.9 });
    o += S.g(S.rect(-240, -55, 480, 110, 26, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 6 }) + S.el('text', { x: 0, y: 24, 'font-family': 'Lilita One', 'font-size': 62, fill: '#FF4D6D', 'text-anchor': 'middle' }, 'ZAPPED: 1,047'), `translate(1560 160) scale(${f(ease.outBack(inv(614.4, 614.6, t)))})`);
    return o;
  }
  // "Left. Wait... Jump— NOW!": hero calls it, Nova moves through the grid
  const v = vis('YOU', t);
  const nx = t < 618.4 ? lerp(2300, 2120, inv(617.7, 618.3, t)) : t < 619.4 ? 2120 : lerp(2120, 2700, inv(619.4, 620.3, t));
  const jump = t > 619.4 ? Math.sin(Math.min(1, inv(619.4, 620.3, t)) * Math.PI) : 0;
  const cam = { zoom: 1.2, fx: 960, fy: 540, x: 2150 - 960, y: 120 };
  let w = drawHero({ x: 1700, y: 1000, s: 0.55, nametag: tag, turn: 0.5, armR: t < 618.5 ? 60 : t < 619.4 ? 120 : 150, face: { name: 'determined', mouth: v || 'grin' } });
  w += drawNova({ x: nx, y: 1000, s: 0.55, lift: 340 * jump, rot: -20 * jump, armL: jump > 0 ? 160 : 20, armR: jump > 0 ? 160 : 20, legL: 20 * jump, kneeL: 60 * jump, legR: 20 * jump, kneeR: 60 * jump, turn: -0.3, face: { name: jump > 0 ? 'determined' : 'focused' }, nametag: 'Nova', bodyY: t > 618.8 && t < 619.4 ? 40 : 0 });
  w += E.beam(1900, 960, 3000, 990, 1);
  return laserHall(t, cam, w);
}
function shotNotBad(t) { // 620.3 - 624.2
  const land = inv(620.4, 620.7, t);
  const cam = { zoom: t < 622.2 ? 1.4 : 2.2, fx: 960, fy: 540, x: (t < 622.2 ? 2400 : 2700) - 960, y: t < 622.2 ? 160 : 120 };
  let w = drawHero({ x: 2150, y: 1000, s: 0.55, nametag: tag, turn: 0.4, face: { name: 'happy', eyes: { look: [1, 0], cross: 0 } } });
  w += drawNova({ x: 2700, y: 1000, s: 0.55, nametag: 'Nova', turn: -0.4, bodyY: 50 * Math.sin(Math.min(1, land) * Math.PI), face: t > 622.2 ? { name: 'softSmile', mouth: vis('NOVA', t) || 'smallSmile', glasses: 'half', eyes: { look: [-1, -0.3] } } : { name: 'cool', eyes: { look: [-1, -0.3] } } });
  return laserHall(t, cam, w);
}

// ---------------------------------------------------------------- 624.2 - 642.0: the Hatchery
function hatchery(t, cam, w, chomp = 1) {
  const Hl = E5.hall(cam, t, { title: 'STAGE 2 · HATCHERY', wall: '#2A1E3E', accent: '#B06BFF', titleX: 960 + (cam.x || 0) * 0.85 });
  return Hl.back + Hl.floor + S.g(E5.shelves(t, 0, 3800, { realAt: [1, 17], chomp }) + w, E.camTf(cam, 1));
}
function shotHatchery(t) {
  if (t < 629.0) {
    const k = ease.inOut(inv(624.3, 627.4, t));
    const cam = { zoom: lerp(0.8, 1.1, k), fx: 960, fy: 540, x: lerp(0, 1000, k), y: 40 };
    let o = hatchery(t, cam, '', t > 627.6 ? 1 : 0);
    if (t > 627.6) { // close-up chomp
      const kk = ease.outBack(inv(627.7, 627.9, t));
      o += S.rect(0, 0, W, H, 0, { fill: '#1A0B3A', opacity: f(0.5 * kk) }) + S.g(E5.teethEgg({ x: 0, y: 0, size: 420, open: Math.max(0, Math.sin(t * 9)), t }), `translate(960 520) scale(${f(kk)})`);
    }
    return o;
  }
  if (t < 631.0) {
    const v = vis('YOU', t);
    const cam = { zoom: 2.2, fx: 960, fy: 540, x: 1400 - 960, y: 100 };
    return hatchery(t, cam, drawHero({ x: 1400, y: 1000, s: 0.55, nametag: tag, armL: 150, armR: 150, face: { name: 'scared', mouth: v || 'scream', eyes: { pupil: 0.4 }, fx: ['sweat2'] }, headRot: 4 * Math.sin(t * 30) }));
  }
  if (t < 633.0) {
    const cam = { zoom: 2.2, fx: 960, fy: 540, x: 1800 - 960, y: 100 };
    return hatchery(t, cam, drawNova({ x: 1800, y: 1000, s: 0.55, nametag: 'Nova', turn: -0.4, armL: 110, face: { name: 'shout', mouth: vis('NOVA', t) || 'D' } }));
  }
  if (t < 636.5) { // touches one... CHOMP, head inside the egg
    const cam = { zoom: 1.6, fx: 960, fy: 540, x: 1500 - 960, y: 160 };
    const touch = t < 634.3;
    const k = ease.out(inv(633.2, 633.9, t));
    const egY = 1000 - 0.55 * 790;
    let w;
    if (touch) w = drawHero({ x: 1500, y: 1000, s: 0.55, nametag: tag, turn: 0.4, armR: lerp(9, 100, k), face: { name: 'confused', eyes: { look: [1, 0], cross: 0 } } }) + E5.teethEgg({ x: 1700, y: 760, size: 150, open: 0, t });
    else w = drawHero({ x: 1500, y: 1000, s: 0.55, nametag: tag, armL: 150 + 20 * Math.sin(t * 20), armR: 150 - 20 * Math.sin(t * 20), legL: 14 * Math.sin(t * 18), legR: -14 * Math.sin(t * 18), face: { name: 'oof' } }) + E5.teethEgg({ x: 1500, y: egY, size: 340, open: 0.1, t, eyes: true });
    let o = hatchery(t, cam, w);
    if (!touch) o += C.sfx('CHOMP!', 1350, 260, inv(634.3, 634.45, t), 120, 8, '#B06BFF');
    return o;
  }
  if (t < 639.0) { // Nova pulls his legs, POP
    const pop = t > 637.8;
    const cam = { zoom: 1.5, fx: 960, fy: 540, x: 1500 - 960, y: 160 };
    const egY = 1000 - 0.55 * 790;
    let w = '';
    if (!pop) {
      const tug = Math.sin(t * 14) * 10;
      w += drawHero({ x: 1500, y: 1000, s: 0.55, rot: -70, rotY: -700, nametag: tag, armL: 160, armR: 160, face: { name: 'oof' } });
      w += S.g(E5.teethEgg({ x: 0, y: 0, size: 340, open: 0.1, t }), `translate(${f(1500 - 330 + tug)} ${f(egY + 200)}) rotate(-70)`);
      w += drawNova({ x: 1880 + tug, y: 1000, s: 0.55, nametag: 'Nova', turn: -0.5, armL: 70, armR: 70, lean: 14, face: { name: 'angry', fx: ['sweat'] } });
    } else {
      const k = ease.out(inv(637.8, 638.3, t));
      w += drawHero({ x: 1500 + 120 * k, y: 1000, s: 0.55, nametag: tag, rot: lerp(-70, 0, k), rotY: -700, face: { name: 'dizzy' }, armL: 30, armR: 30 });
      w += E5.teethEgg({ x: 1200 - 300 * k, y: egY - 200 * Math.sin(k * Math.PI), size: 340 * (1 - 0.5 * k), open: 0.6, t });
      w += drawNova({ x: 1900, y: 1000, s: 0.55, nametag: 'Nova', turn: -0.5, armL: 30, armR: 30, bodyY: 40 * (1 - k), face: { name: 'smug' } });
    }
    let o = hatchery(t, cam, w);
    if (pop) o += C.sfx('POP!', 900, 300, inv(637.8, 637.95, t), 130, -8, '#FFE14D');
    return o;
  }
  // banter
  const focusNova = t < 640.2;
  const cam = { zoom: 2.0, fx: 960, fy: 540, x: (focusNova ? 1900 : 1620) - 960, y: 120 };
  let w = drawHero({ x: 1620, y: 1000, s: 0.55, nametag: tag, turn: 0.5, face: { name: 'happy', mouth: vis('YOU', t) || 'grin', eyes: { look: [1, 0], cross: 0 } } });
  w += drawNova({ x: 1900, y: 1000, s: 0.55, nametag: 'Nova', turn: -0.5, face: { name: 'smug', mouth: vis('NOVA', t) || 'smirk', eyes: { look: [-1, -0.3] } } });
  return hatchery(t, cam, w);
}

function scene(t) {
  if (t < 581.1) return shotOpen(t);
  if (t < 588.2) return shotShort(t);
  if (t < 596.2) return shotBloop(t);
  if (t < 607.1) return shotGate(t);
  if (t < 620.3) return shotLaserHall(t);
  if (t < 624.2) return shotNotBad(t);
  return shotHatchery(t);
}

module.exports = { scene, TRACK, LINES, START, END };
