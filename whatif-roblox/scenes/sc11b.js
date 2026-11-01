// Part 11 (10:42 - 11:34): Stage 3 the Top — EggLord grabs the Secret Egg, half speed, banana peel,
// YOU catches it; Stage 4 — ten seconds, the throw, Nova runs, the throw back, the double dive,
// two hands on the pad: CO-OP HATCH.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const E5 = require('./env5');
const G = require('./env4');
const C = require('./common');
const A = require('./acting');
const { drawHero, YOU_DESIGN } = require('../rig/hero');
const { drawNova, NOVA_DESIGN } = require('../rig/nova');
const { draw: cast, NAMES } = require('../rig/cast');
const { secretEgg } = require('../rig/props');
const { f, ease, inv, lerp, clamp } = S;
const { W, H, bump, blinkAt, hash } = C;

const START = 642.0, END = 694.0;
const LINES = [
  [642.40, 645.40, 'NARRATOR', '*Stage three:* the Top. And there it is... the *Secret Egg.*'],
  [645.70, 647.20, 'NARRATOR', 'But EggLord gets there first.'],
  [647.40, 648.20, 'EGGLORD', '*MINE!*'],
  [648.60, 651.00, 'NARRATOR', 'The Secret Egg lands on his head. And remember *rule two?*'],
  [651.30, 653.40, 'NARRATOR', '*Half speed.* And *EVERYONE* can see it.'],
  [653.80, 655.40, 'NOVA', "You thinking what I'm thinking?"],
  [655.70, 656.60, 'YOU', '*Banana peel?*'],
  [656.90, 657.80, 'NOVA', '*Banana peel.*'],
  [658.20, 660.60, 'NARRATOR', 'Slip! EggLord flies. The Secret Egg flies even higher—'],
  [660.80, 664.20, 'NARRATOR', 'You *JUMP!* You *CATCH* it! And now *YOU* are the one at half speed!'],
  [664.60, 666.60, 'SYSTEM', 'Vault closing in *TEN* seconds!'],
  [667.00, 670.60, 'NARRATOR', "Nine. The hatch pad is all the way across the vault. You're too slow. You'll never make it."],
  [671.00, 672.20, 'YOU', '*NOVA!* CATCH!'],
  [672.60, 675.40, 'NARRATOR', 'You throw it. She catches it. She runs. Full speed. *Seven. Six.*'],
  [675.80, 679.00, 'NARRATOR', 'Lasers. Teeth eggs. EggLord, still screaming somewhere. *Five. Four.*'],
  [679.40, 680.60, 'NOVA', '*YOU!* Your turn!'],
  [681.00, 683.80, 'NARRATOR', 'She throws it back. *Three.* You dive. *Two.* She dives.'],
  [684.20, 685.00, 'NARRATOR', '*ONE!*'],
  [686.20, 689.40, 'NARRATOR', 'Two hands. One egg. On the pad. At the exact same time.'],
  [689.80, 692.40, 'SYSTEM', 'VAULT COMPLETE! *CO-OP HATCH!*'],
];
const TRACK = C.makeTrack(LINES);
const vis = (sp, t) => C.visemeAt(TRACK, sp, t);
const tag = { name: 'YOU', health: 1 };
const PAD = 3900;
const timer = (t) => {
  const marks = [[667.0, 9], [669.4, 8], [674.6, 7], [675.2, 6], [678.2, 5], [678.8, 4], [681.8, 3], [682.8, 2], [684.2, 1], [685.2, 0]];
  let v = 10; for (const [m, n] of marks) if (t >= m) v = n; return v;
};

// ---------------------------------------------------------------- the track on top of the vault
function track(t, cam, w, o = {}) {
  const L = E.vaultLayers({ ...cam, x: (cam.x || 0) * 0.3 }, t, { eggOnPedestal: o.eggOnPedestal ?? false });
  let pf = S.rect(-1400, 930, 7800, 600, 0, { fill: '#262A40' }) + S.rect(-1400, 930, 7800, 600, 0, { fill: 'url(#metal)', opacity: 0.6 });
  pf += S.rect(-1400, 912, 7800, 44, 0, { fill: '#3A3F5E', stroke: '#151515', 'stroke-width': 6 }) + S.rect(-1400, 908, 7800, 10, 0, { fill: '#FFC52E' });
  for (let x = -1400; x < 6400; x += 120) pf += S.path(`M${x} 956 L${x + 60} 956 L${x + 20} 996 L${x - 40} 996 Z`, { fill: '#FFC52E', opacity: 0.85 });
  if (o.pad !== false) pf += E5.hatchPad(PAD, 960, t);
  if (o.obstacles) {
    for (const x of [1300, 2300, 3100]) pf += E.beam(x - 300, 600, x + 300, 960, 1) + E.beam(x + 300, 600, x - 300, 960, 1);
    for (const x of [1700, 2700]) pf += E5.teethEgg({ x, y: 900, size: 120, open: Math.max(0, Math.sin(t * 6 + x)), t });
  }
  let o2 = L.bg + E.layer(pf, cam, 1) + S.g(w, E.camTf(cam, 1));
  if (o.alarm) o2 += S.rect(0, 0, W, H, 0, { fill: '#FF2D55', opacity: f(0.08 + 0.1 * Math.max(0, Math.sin(t * 10))) });
  if (o.timer) o2 += E.timerHud(timer(t), bump((t * 1.7) % 1, 0, 0.2));
  return o2;
}
const eggOnHead = (t, bodyY = 0, size = 240) => ({ svg: secretEgg({ x: 0, y: -1035 + bodyY, size, t, rot: 6 * Math.sin(t * 9) }), layer: 'top' });
const slowmo = (k) => (k > 0 ? S.rect(0, 0, W, 70, 0, { fill: '#000', opacity: f(0.85 * k) }) + S.rect(0, H - 70, W, 70, 0, { fill: '#000', opacity: f(0.85 * k) }) : '');

// ---------------------------------------------------------------- 642.0 - 648.5: the Top, EggLord first
function shotTop(t) {
  if (t < 645.6) {
    const k = ease.inOut(inv(642.2, 645.0, t));
    const cam = { zoom: lerp(1.0, 2.4, k), fx: 960, fy: lerp(600, 340, k) };
    const L = E.vaultLayers(cam, t, { eggOnPedestal: true });
    let o = L.bg + L.platform + C.whiteFlash(1 - inv(642.0, 642.3, t));
    o += S.g(S.rect(-380, -70, 760, 140, 26, { fill: '#151521', stroke: '#151515', 'stroke-width': 7 }) + S.el('text', { x: 0, y: 26, 'font-family': 'Lilita One', 'font-size': 76, fill: '#FFC52E', 'text-anchor': 'middle' }, 'STAGE 3 · THE TOP'), `translate(960 160) scale(${f(ease.outBack(inv(642.3, 642.6, t)) * (1 - inv(644.4, 644.7, t)))})`);
    return o;
  }
  // EggLord sprints past both of them and leaps to the pedestal
  const u = t - 645.6;
  const cam = { zoom: 1.1, fx: 960, fy: 540 };
  const L = E.vaultLayers(cam, t, { eggOnPedestal: t < 647.4 });
  const leap = inv(646.6, 647.4, t);
  const ex = t < 646.6 ? lerp(-200, 700, inv(645.6, 646.6, t)) : lerp(700, 960, leap);
  const ey = t < 646.6 ? 990 : lerp(990, 520, ease.out(leap)) - Math.sin(leap * Math.PI) * 120;
  let w = drawHero({ x: 400, y: 990, s: 0.6, nametag: tag, turn: 0.5, face: { name: 'shocked', eyes: { look: [1, -0.5], cross: 0 } } });
  w += drawNova({ x: 560, y: 990, s: 0.6, nametag: 'Nova', turn: 0.5, face: { name: 'shocked', eyes: { look: [1, -0.5] } } });
  const v = vis('EGGLORD', t);
  if (t < 647.4) w += cast.egglord({ view: 'side', flip: true, x: ex, y: ey, s: 0.6, lean: -12, ...A.run(u * 32), face: { name: 'determined' }, nametag: NAMES.egglord, shadow: t < 646.6 });
  else w += cast.egglord({ x: 960, y: 520 + 0, s: 0.6, armL: 150, armR: 150, face: { name: 'joy', mouth: v || 'bigGrin' }, nametag: NAMES.egglord, shadow: false, props: [eggOnHead(t)] });
  let o = L.bg + L.platform + S.g(w, E.camTf(cam, 1));
  if (t > 647.4) o += C.sfx('MINE!', 1400, 260, inv(647.4, 647.55, t), 130, 8, '#FF4D6D');
  return o;
}

// ---------------------------------------------------------------- 648.5 - 653.7: half speed
function shotHalfSpeed(t) {
  const u = t - 648.5;
  const x = 600 + u * 110;
  const cam = { zoom: 1.2, fx: 960, fy: 540, x: x - 960, y: 100 };
  let w = cast.egglord({ view: 'side', flip: true, x, y: 990, s: 0.6, lean: -6, ...A.run(u * 9), face: { name: 'scared', mouth: 'teeth', fx: ['sweat2'] }, nametag: NAMES.egglord, props: [eggOnHead(t)] });
  if (t > 651.3) {
    const k = ease.outBack(inv(651.4, 651.7, t));
    for (const dx of [-200, 200]) w += S.g(S.path('M0 -140 L0 -30 M-34 -66 L0 -30 L34 -66', { fill: 'none', stroke: '#FF2D55', 'stroke-width': 18, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), `translate(${f(x + dx)} ${f(990 - 0.6 * 1150 + 10 * Math.sin(t * 10))}) rotate(${dx > 0 ? -35 : 35}) scale(${f(k)})`);
  }
  let o = track(t, cam, w, { pad: false });
  o += G.ruleCard(2, 'Carry = HALF SPEED', inv(649.9, 650.2, t));
  if (t > 651.3) o += S.g(S.rect(-120, -50, 240, 100, 24, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 5 }) + S.el('text', { x: 0, y: 26, 'font-family': 'Lilita One', 'font-size': 70, fill: '#FFE14D', 'text-anchor': 'middle' }, '0.5x'), 'translate(1680 300)');
  return o;
}

// ---------------------------------------------------------------- 653.7 - 658.1: banana peel?
function shotPlan(t) {
  const focusNova = t < 655.6 || t > 656.8;
  const cam = { zoom: 2.1, fx: 960, fy: 540, x: (focusNova ? 1180 : 900) - 960, y: 120 };
  const peel = t > 656.9;
  const [hx, hy] = A.hand(120);
  const peelSvg = S.g(S.path('M0 0 Q-60 -10 -80 30 Q-40 10 -10 20 Q-20 60 10 80 Q20 40 30 20 Q70 40 90 20 Q60 0 30 -10 Q30 -40 0 -40 Z', { fill: '#FFE14D', stroke: '#151515', 'stroke-width': 6 }), `translate(${-hx} ${hy - 40}) scale(1.2)`);
  let w = drawHero({ x: 900, y: 990, s: 0.6, nametag: tag, turn: 0.4, face: { name: 'smug', mouth: vis('YOU', t) || 'smirk', eyes: { look: [1, 0], cross: 0 } } });
  w += drawNova({ x: 1180, y: 990, s: 0.6, nametag: 'Nova', turn: -0.4, armL: peel ? 120 : 9, face: { name: peel ? 'wink' : 'smug', mouth: vis('NOVA', t) || 'smirk', eyes: { look: [-1, -0.3] } }, props: peel ? [{ svg: peelSvg, layer: 'top' }] : [] });
  return track(t, cam, w, { pad: false });
}

// ---------------------------------------------------------------- 658.1 - 664.5: slip, flies, catch
function shotSlip(t) {
  if (t < 660.7) {
    const k = inv(658.2, 659.0, t);
    const cam = { zoom: 1.0, fx: 960, fy: 540, x: 300, y: 0 };
    const px = lerp(800, 1450, ease.out(inv(658.2, 658.7, t)));
    let w = S.g(S.path('M0 0 Q-60 -10 -80 30 Q-40 10 -10 20 Q-20 60 10 80 Q20 40 30 20 Q70 40 90 20 Q60 0 30 -10 Q30 -40 0 -40 Z', { fill: '#FFE14D', stroke: '#151515', 'stroke-width': 6 }), `translate(${f(px)} 980) rotate(${f(t * 600)})`);
    const fl = inv(658.8, 659.8, t);
    w += cast.egglord({ view: 'side', flip: true, x: 1450 + 200 * fl, y: 990, s: 0.6, lift: Math.sin(Math.min(1, fl) * Math.PI) * 260, rot: 260 * fl, armL: 160, armR: 160, legL: 40, legR: -30, face: { name: fl > 0 ? 'oof' : 'scared' }, nametag: NAMES.egglord, props: fl > 0.15 ? [] : [eggOnHead(t)] });
    if (fl > 0.15) w += secretEgg({ x: 1500 + 100 * fl, y: 990 - 0.6 * 1100 - 1100 * ease.out(inv(658.95, 660.6, t)), size: 150, t, rot: t * 400 });
    let o = track(t, cam, w, { pad: false });
    if (fl > 0) o += C.sfx('SLIP!', 1500, 500, inv(658.8, 658.95, t), 110, -8, '#FFE14D');
    return o;
  }
  // the jump + catch (slow motion) and landing at half speed
  const j = inv(660.8, 662.6, t);
  const cam = { zoom: 1.2, fx: 960, fy: 540, x: 600, y: lerp(-400, 80, ease.inOut(inv(662.2, 663.2, t))) };
  const lift = Math.sin(Math.min(1, j) * Math.PI) * 900;
  const caught = t > 661.7;
  const land = inv(662.6, 662.9, t);
  let p = { view: 'side', flip: true, x: 1560, y: 990, s: 0.6, lift, armL: 170, armR: 170, legL: -20, kneeL: 60, legR: 30, kneeR: 50, face: { name: caught ? 'excited' : 'determined' }, nametag: tag, props: caught ? [eggOnHead(t)] : [] };
  if (t > 662.6) p = { x: 1560, y: 990, s: 0.6, bodyY: 100 * Math.sin(Math.min(1, land) * Math.PI) + 40, sy: 0.95, armL: 150, armR: 150, face: { name: 'joy', fx: ['sweat'] }, nametag: tag, props: [eggOnHead(t, 40)] };
  let w = drawHero(p);
  if (!caught) w += secretEgg({ x: 1560, y: 990 - 0.6 * 1100 - 900 + 200 * j, size: 150, t });
  let o = track(t, cam, w, { pad: false });
  o += slowmo(t < 662.6 ? 1 : 1 - inv(662.6, 662.9, t));
  if (caught && t < 662.6) o += C.sfx('CATCH!', 1400, 300, inv(661.7, 661.85, t), 110, 8, '#FFE14D');
  if (t > 663.0) o += S.g(S.rect(-120, -50, 240, 100, 24, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 5 }) + S.el('text', { x: 0, y: 26, 'font-family': 'Lilita One', 'font-size': 70, fill: '#FFE14D', 'text-anchor': 'middle' }, '0.5x'), 'translate(1680 300)');
  return o;
}

// ---------------------------------------------------------------- 664.5 - 686.1: the race
function heroRunning(t, x, slow = true, egg = true, extra = {}) {
  return drawHero({ view: 'side', flip: true, x, y: 990, s: 0.6, lean: -8, ...A.run(t * (slow ? 10 : 28), slow ? 0.6 : 1), face: { name: 'determined', fx: ['sweat'] }, nametag: tag, props: egg ? [eggOnHead(t)] : [], ...extra });
}
function shotRace(t) {
  if (t < 667.0) { // the announcement
    const cam = { zoom: 1.2, fx: 960, fy: 540, x: 600, y: 80 };
    let o = track(t, cam, heroRunning(t, 1560, true, true, { ...A.run(0, 0) }), { alarm: true, pad: false });
    const k = ease.outBack(inv(664.7, 665.0, t));
    o += S.g(S.rect(-560, -110, 1120, 220, 40, { fill: '#E8243C', stroke: '#151515', 'stroke-width': 10 }) + S.el('text', { x: 0, y: -20, 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 44, fill: '#FFFFFF', 'text-anchor': 'middle' }, 'VAULT CLOSING IN') + S.el('text', { x: 0, y: 72, 'font-family': 'Lilita One', 'font-size': 120, fill: '#FFE14D', 'text-anchor': 'middle', stroke: '#151515', 'stroke-width': 14, 'paint-order': 'stroke' }, '10 SECONDS'), `translate(960 420) scale(${f(k)})`);
    return o;
  }
  if (t < 671.0) { // so far: wide shot, the pad far away, he's slow
    const x = 1560 + (t - 667.0) * 60;
    const k = ease.inOut(inv(667.0, 668.6, t));
    const cam = { zoom: lerp(1.2, 0.5, k), fx: 960, fy: 540, x: lerp(600, 1800, k), y: lerp(80, -200, k) };
    let o = track(t, cam, heroRunning(t, x) + drawNova({ view: 'side', flip: true, x: x - 260, y: 990, s: 0.6, ...A.run(t * 10, 0.5), face: { name: 'determined' }, nametag: 'Nova' }), { alarm: true, timer: true, obstacles: true });
    if (t > 668.8) o += S.g(S.path('M0 0 L1100 0', { stroke: '#FFFFFF', 'stroke-width': 10, 'stroke-dasharray': '30 20' }) + S.el('text', { x: 550, y: -30, 'font-family': 'Lilita One', 'font-size': 60, fill: '#FFFFFF', 'text-anchor': 'middle', stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' }, 'TOO FAR!'), `translate(560 620) scale(${f(ease.outBack(inv(668.9, 669.2, t)))} 1)`);
    return o;
  }
  if (t < 672.6) { // NOVA! CATCH!
    const v = vis('YOU', t);
    const throwK = inv(671.9, 672.5, t);
    const cam = { zoom: 1.6, fx: 960, fy: 540, x: 1800 - 960, y: 120 };
    let w = drawHero({ x: 1800, y: 990, s: 0.6, turn: 0.4, nametag: tag, armR: throwK > 0 ? lerp(160, 60, throwK) : 160, armL: 30, face: { name: 'determined', mouth: v || 'D' }, props: throwK > 0 ? [] : [eggOnHead(t)] });
    if (throwK > 0) w += secretEgg({ x: 1800 + 900 * throwK, y: 990 - 0.6 * 1100 - Math.sin(throwK * Math.PI) * 300, size: 150, t, rot: t * 500 });
    return track(t, cam, w, { alarm: true, timer: true });
  }
  if (t < 679.3) { // Nova runs full speed through the obstacles
    const u = t - 672.6;
    const nx = 2200 + u * 230;
    const cam = { zoom: 1.0, fx: 960, fy: 540, x: nx - 960 - 200, y: 60 };
    let w = drawNova({ view: 'side', flip: true, x: nx, y: 990, s: 0.6, lean: -12, ...A.run(u * 30), face: { name: 'determined' }, nametag: 'Nova', props: [eggOnHead(t)] }) + C.speedLines(nx - 900, nx - 200, 700, 9, 17, '#FF8FB0');
    if (t > 675.8) w += cast.egglord({ x: 2600, y: 990, s: 0.55, rot: 90, rotY: -300, face: { name: 'scream' }, armL: 160, armR: 160, nametag: NAMES.egglord });
    w += drawHero({ view: 'side', flip: true, x: 1900 + u * 70, y: 990, s: 0.6, ...A.run(u * 20), face: { name: 'determined' }, nametag: tag });
    return track(t, cam, w, { alarm: true, timer: true, obstacles: true });
  }
  if (t < 681.0) { // YOU! Your turn!
    const throwK = inv(680.2, 680.9, t);
    const cam = { zoom: 1.5, fx: 960, fy: 540, x: 3700 - 960, y: 120 };
    let w = drawNova({ x: 3700, y: 990, s: 0.6, turn: -0.5, nametag: 'Nova', armL: throwK > 0 ? lerp(160, 60, throwK) : 160, face: { name: 'shout', mouth: vis('NOVA', t) || 'D' }, props: throwK > 0 ? [] : [eggOnHead(t)] });
    if (throwK > 0) w += secretEgg({ x: 3700 - 500 * throwK, y: 990 - 0.6 * 1100 - Math.sin(throwK * Math.PI) * 280, size: 150, t, rot: -t * 500 });
    return track(t, cam, w, { alarm: true, timer: true });
  }
  if (t < 684.1) { // the double dive
    const k = inv(681.8, 684.1, t);
    const cam = { zoom: 1.2, fx: 960, fy: 540, x: PAD - 960, y: 60 };
    const youX = lerp(3100, PAD - 120, ease.out(k)), novX = lerp(4700, PAD + 120, ease.out(inv(682.8, 684.1, t)));
    let w = drawHero({ view: 'side', flip: true, x: youX, y: 990, s: 0.6, lift: 160 * Math.sin(k * Math.PI), rot: 60 * k, armL: 170, armR: 170, legL: -30, legR: -40, face: { name: 'determined' }, nametag: tag, props: [eggOnHead(t)] });
    if (t > 682.8) w += drawNova({ view: 'side', x: novX, y: 990, s: 0.6, lift: 160 * Math.sin(inv(682.8, 684.1, t) * Math.PI), rot: -60 * inv(682.8, 684.1, t), armL: 170, armR: 170, legL: -30, legR: -40, face: { name: 'determined' }, nametag: 'Nova' });
    return track(t, cam, w, { alarm: true, timer: true }) + slowmo(inv(683.0, 683.5, t));
  }
  // ONE! (slow motion, freeze over the pad)
  const cam = { zoom: 1.6 + 0.2 * inv(684.1, 686.1, t), fx: 960, fy: 540, x: PAD - 960, y: 100 };
  let w = drawHero({ view: 'side', flip: true, x: PAD - 200, y: 990, s: 0.6, lift: 140, rot: 70, armL: 175, armR: 175, legL: -30, legR: -40, face: { name: 'scream' }, nametag: tag, shadow: false });
  w += drawNova({ view: 'side', x: PAD + 200, y: 990, s: 0.6, lift: 140, rot: -70, armL: 175, armR: 175, legL: -30, legR: -40, face: { name: 'shout' }, nametag: 'Nova', shadow: false });
  w += secretEgg({ x: PAD, y: 820, size: 170, t });
  let o = track(t, cam, w, { alarm: true, timer: true }) + slowmo(1);
  if (t > 685.0) o += S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.6 * inv(685.0, 686.1, t)) });
  return o;
}

// ---------------------------------------------------------------- 686.1 - 694.0: two hands, co-op hatch
function shotHands(t) {
  if (t < 689.7) {
    // macro close-up: two blocky hands touch the egg on the pad, the world stands still
    let o = S.rect(0, 0, W, H, 0, { fill: '#1A0B3A' });
    for (let i = 0; i < 16; i++) o += S.path('M0 0 L-60 -1400 L60 -1400 Z', { fill: '#C77DFF', opacity: 0.08, transform: `translate(960 700) rotate(${f(i * 22.5 + t * 6)})` });
    o += S.ellipse(960, 860, 700, 120, { fill: '#7B2FFF', opacity: 0.5 }) + S.ellipse(960, 860, 600, 100, { fill: 'none', stroke: '#C77DFF', 'stroke-width': 14 });
    o += secretEgg({ x: 960, y: 640, size: 420, t: 686.1 });
    const k = ease.out(inv(686.3, 687.4, t));
    o += S.g(YOU_DESIGN.arm({}), `translate(${f(lerp(-700, 150, k))} 660) rotate(-90) scale(2.4)`);
    o += S.g(NOVA_DESIGN.arm({}), `translate(${f(lerp(2620, 1770, k))} 660) scale(-1 1) rotate(-90) scale(2.4)`);
    if (k > 0.98) o += C.burst(960, 560, inv(687.4, 688.0, t), '#FFFFFF') + C.whiteFlash(0.5 * (1 - inv(687.4, 687.8, t)));
    o += S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.6 * (1 - inv(686.1, 686.5, t))) });
    return o;
  }
  // VAULT COMPLETE! confetti, fireworks
  const cam = { zoom: 1.3, fx: 960, fy: 540, x: PAD - 960, y: 100 };
  let w = drawHero({ x: PAD - 180, y: 990, s: 0.6, nametag: tag, armL: 160, armR: 160, lift: 60 * Math.abs(Math.sin(t * 6)), face: { name: 'joy' } });
  w += drawNova({ x: PAD + 180, y: 990, s: 0.6, nametag: 'Nova', armL: 150, armR: 150, lift: 60 * Math.abs(Math.sin(t * 6 + 1)), face: { name: 'laugh', glasses: false } });
  w += secretEgg({ x: PAD, y: 900, size: 180, t });
  let o = track(t, cam, w);
  for (let i = 0; i < 40; i++) { const ph = ((t - 689.7) * 0.5 + hash(i)) % 1; o += S.rect(hash(i * 3) * 1920, ph * 1200 - 80, 24, 24, 4, { fill: ['#FF5A5A', '#FFE14D', '#3BD16F', '#34C3FF', '#B06BFF'][i % 5], transform: `rotate(${f(ph * 500)} ${f(hash(i * 3) * 1920 + 12)} ${f(ph * 1200 - 68)})` }); }
  for (let i = 0; i < 3; i++) { const ph = ((t - 689.7) * 0.7 + i / 3) % 1; const fx = 400 + i * 560, fy = 300 - 60 * i; for (let j = 0; j < 12; j++) { const a = (j / 12) * Math.PI * 2; o += S.circle(fx + Math.cos(a) * 200 * ph, fy + Math.sin(a) * 200 * ph, 10 * (1 - ph), { fill: ['#FFE14D', '#FF6FB5', '#7CF7FF'][i] }); } }
  const k = ease.outBack(inv(689.8, 690.1, t));
  o += S.g(S.rect(-600, -120, 1200, 240, 44, { fill: '#3BD16F', stroke: '#151515', 'stroke-width': 10 }) + S.el('text', { x: 0, y: -18, 'font-family': 'Lilita One', 'font-size': 92, fill: '#FFFFFF', 'text-anchor': 'middle', stroke: '#151515', 'stroke-width': 12, 'paint-order': 'stroke' }, 'VAULT COMPLETE!') + S.el('text', { x: 0, y: 80, 'font-family': 'Lilita One', 'font-size': 78, fill: '#FFE14D', 'text-anchor': 'middle', stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke' }, 'CO-OP HATCH'), `translate(960 300) scale(${f(k)})`);
  return o;
}

function scene(t) {
  if (t < 648.5) return shotTop(t);
  if (t < 653.7) return shotHalfSpeed(t);
  if (t < 658.1) return shotPlan(t);
  if (t < 664.5) return shotSlip(t);
  if (t < 686.1) return shotRace(t);
  return shotHands(t);
}

module.exports = { scene, TRACK, LINES, START, END };
