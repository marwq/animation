// Part 9 (8:37.2 - 9:36.8): Nova keeps stealing, the banana peel trap, sunset talk at the egg belt
// about the Secret Egg and the Admin Vault, "Keep up, and maybe", climbing to #3, EGG RAIN.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const E3 = require('./env3');
const G = require('./env4');
const C = require('./common');
const A = require('./acting');
const { drawHero } = require('../rig/hero');
const { drawNova } = require('../rig/nova');
const { draw: cast, NAMES } = require('../rig/cast');
const { draw: cast2, NAMES2 } = require('../rig/cast2');
const { egg, secretEgg } = require('../rig/props');
const { f, ease, inv, lerp, clamp } = S;
const { W, H, bump, blinkAt, hash } = C;

const START = 517.2, END = 576.8;
const LINES = [
  [517.60, 520.80, 'NARRATOR', 'You keep running into Nova. Well... mostly, she keeps *stealing from you.*'],
  [521.00, 522.60, 'NOVA', 'Thanks for the egg, *YOU!*'],
  [522.80, 524.20, 'YOU', 'THAT WAS *MY* EGG!'],
  [524.50, 525.20, 'NOVA', '*Was.*'],
  [525.60, 527.00, 'NARRATOR', 'You try stealing from her once.'],
  [527.50, 528.80, 'NARRATOR', '*Banana peel* trap.'],
  [529.10, 529.90, 'NOVA', '*Classic.*'],
  [530.40, 532.80, 'NARRATOR', 'But then, one evening... at the egg belt...'],
  [533.10, 535.80, 'NOVA', "You saw it too, didn't you? The *question mark egg.*"],
  [536.10, 537.00, 'YOU', 'You saw it?!'],
  [537.30, 541.80, 'NOVA', "It's the *Secret Egg.* It's in the *Admin Vault.* The final level. Nobody's ever beaten it."],
  [542.10, 545.60, 'NOVA', 'Some people say... if you hatch it, the world goes back to *normal.*'],
  [545.90, 547.20, 'YOU', 'And what do *YOU* think?'],
  [547.50, 549.40, 'NOVA', "I think... I'm getting it *first.*"],
  [549.80, 551.00, 'YOU', 'Wanna... *team up?*'],
  [551.30, 552.30, 'NOVA', 'Ha. *No.*'],
  [552.60, 553.60, 'NARRATOR', 'She walks away.'],
  [554.10, 555.00, 'NARRATOR', 'Then she stops.'],
  [555.30, 557.00, 'NOVA', '...Keep up, and *maybe.*'],
  [557.50, 562.40, 'NARRATOR', 'So you *KEEP UP.* Leaderboard: number eight billion... fifty thousand... three hundred... number *THREE!*'],
  [562.60, 565.00, 'NARRATOR', 'Number two: *Nova.* Number one... *EggLord.*'],
  [565.40, 567.40, 'SYSTEM', 'Server event! *EGG RAIN!*'],
  [567.80, 573.60, 'NARRATOR', 'Eggs fall from the sky! The whole server goes crazy. Mom drives through in her *pink car.* And Dad catches one... with his *fishing rod.*'],
  [574.00, 576.00, 'DAD', 'Huh. Biggest fish I ever *caught.*'],
];
const TRACK = C.makeTrack(LINES);
const vis = (sp, t) => C.visemeAt(TRACK, sp, t);
const tag = { name: 'YOU', health: 1 };
const whip = (t, a, b, inner) => { const k = bump(t, a, b); return k > 0.02 ? S.g(inner, `translate(${f((t < (a + b) / 2 ? -1 : 1) * k * 160)} 0)`, { filter: 'url(#whip)' }) : inner; };

const YB = { x0: 300, x1: 1500, col: '#FF8FC8', sign: "YOU's Base", doorSide: 'right' };
const NB = { x0: 3700, x1: 4800, col: '#E0283F', sign: "Nova's Base", doorSide: 'right' };
const PED = (b, i, n = 3) => b.x0 + ((i + 1) * (b.x1 - b.x0)) / (n + 1);

function world(t, cam, w, o = {}) {
  const M = G.eggMap(cam, t, { beltOff: t * 120, secretX: o.secretX });
  let b = G.base({ ...YB, locked: o.yLocked ?? false, pedestals: o.yPeds || [egg({ x: 0, y: -58, size: 100, rarity: 'epic', glow: true }), G.rocky({ x: 0, y: 0, s: 0.8, t }), o.yEggGone ? null : egg({ x: 0, y: -58, size: 100, rarity: 'legendary', glow: true })] }, t);
  b += G.base({ ...NB, locked: o.nLocked ?? false, lockPanel: false, pedestals: [egg({ x: 0, y: -58, size: 100, rarity: 'legendary', glow: true }), o.novaSits ? null : egg({ x: 0, y: -58, size: 100, rarity: 'epic', glow: true }), egg({ x: 0, y: -58, size: 100, rarity: 'rare', glow: true })] }, t);
  return M.bg + M.ground + S.g(b + w, E.camTf(cam, 1));
}
const sunset = (k = 1) => `<defs><linearGradient id="sunsetGr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B3C88"/><stop offset="0.6" stop-color="#FF8A5B"/><stop offset="1" stop-color="#FFC36B"/></linearGradient></defs>` + S.rect(0, 0, W, H, 0, { fill: 'url(#sunsetGr)', opacity: f(0.3 * k), style: 'mix-blend-mode:multiply' }) + S.rect(0, 0, W, H, 0, { fill: '#FFB36B', opacity: f(0.12 * k) });
const bananaPeel = (x, y, s = 1, rot = 0) => S.g(S.path('M0 0 Q-60 -10 -80 30 Q-40 10 -10 20 Q-20 60 10 80 Q20 40 30 20 Q70 40 90 20 Q60 0 30 -10 Q30 -40 0 -40 Z', { fill: '#FFE14D', stroke: '#151515', 'stroke-width': 6, 'stroke-linejoin': 'round' }) + S.path('M-6 -40 L4 -60', { stroke: '#6B4A2A', 'stroke-width': 8, 'stroke-linecap': 'round' }), `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);

// ---------------------------------------------------------------- 517.2 - 525.4: Nova steals
function shotSteal(t) {
  const u = t - 517.2;
  if (t < 522.7) {
    const nx = lerp(PED(YB, 2) + 100, 2600, ease.in(inv(520.4, 522.6, t)));
    const grab = t > 519.6;
    const cam = { zoom: 1.2, fx: 960, fy: 540, x: Math.max(-60, nx - 1100), y: 140 };
    const ez = grab ? [{ svg: egg({ x: 0, y: -1022, size: 152, rarity: 'legendary', glow: true }), layer: 'top' }] : [];
    let w = '';
    if (t < 520.4) w += drawNova({ x: PED(YB, 2) + 100, y: 1000, s: 0.55, turn: -0.5, armL: grab ? 160 : lerp(9, 140, inv(519.0, 519.6, t)), face: { name: 'sneaky', glasses: 'half' }, nametag: 'Nova', props: ez });
    else w += drawNova({ view: 'side', flip: true, x: nx, y: 1000, s: 0.55, lean: -10, ...A.run(u * 30), face: { name: t > 521.6 ? 'happy' : 'smug', mouth: vis('NOVA', t) || 'smirk', eyeR: { type: t > 521.8 && t < 522.3 ? 'happy' : undefined } }, nametag: 'Nova', props: ez });
    w += drawHero({ x: 500, y: 1000, s: 0.55, nametag: tag, turn: 0.5, face: grab ? { name: 'shocked', eyes: { look: [1, 0], cross: 0 } } : { name: 'happy', eyes: { look: [0, 0.5] } } });
    let o = world(t, cam, w, { yEggGone: grab });
    if (t > 520.6) o += C.speedLines(0, 400, 760, 6, 5, '#FF8FB0');
    return o;
  }
  const v = vis('YOU', t);
  if (t < 524.4) {
    const cam = { zoom: 2.2, fx: 960, fy: 540, x: 500 - 960, y: 160 };
    return world(t, cam, drawHero({ x: 500, y: 1000, s: 0.55, nametag: tag, turn: 0.5, armR: 100 + 20 * Math.sin(t * 18), face: { name: 'angry', mouth: v || 'teeth', fx: ['anger'] }, lift: 30 * Math.abs(Math.sin(t * 9)) }), { yEggGone: true });
  }
  const cam = { zoom: 1.8, fx: 960, fy: 540, x: 2500 - 960, y: 140 };
  return world(t, cam, drawNova({ view: 'side', flip: true, x: 2500 + (t - 524.4) * 300, y: 1000, s: 0.55, ...A.run(t * 30), lean: -10, face: { name: 'smug', mouth: vis('NOVA', t) || 'smirk' }, nametag: 'Nova', props: [{ svg: egg({ x: 0, y: -1022, size: 152, rarity: 'legendary', glow: true }), layer: 'top' }] }), { yEggGone: true });
}

// ---------------------------------------------------------------- 525.4 - 530.3: banana peel trap
function shotPeel(t) {
  const px = PED(NB, 1);
  const cam = { zoom: 1.5, fx: 960, fy: 540, x: px - 960 - 100, y: 220 };
  const slip = inv(527.3, 528.2, t);
  let you;
  if (t < 527.3) {
    const x = lerp(NB.x1 + 200, px + 150, inv(525.5, 527.3, t));
    you = { x, y: 1000, s: 0.55, turn: -0.85, bodyY: 26 + 6 * Math.abs(Math.sin(t * 7)), armL: -24, armR: -20, face: { name: 'sneaky', eyes: { look: [-0.95, 0], cross: 0 }, fx: ['mask'] } };
  } else {
    const k = ease.out(slip);
    you = { x: px + 150 - 60 * k, y: 1000, s: 0.55, lift: Math.sin(Math.min(1, slip * 1.3) * Math.PI) * 200, rot: 200 * k, armL: 160, armR: 140, legL: 40, legR: -20, face: { name: 'oof' } };
    if (slip >= 1) you = { x: px + 90, y: 1000, s: 0.55, rot: -90, rotY: -300, face: { name: 'oof' }, armL: 150, armR: 150 };
  }
  let w = bananaPeel(px + 140, 1010, 0.8, 30 * slip);
  // Nova sits on her pedestal, eating a banana
  const [hx, hy] = A.hand(120);
  w += drawNova({ x: px, y: 900, s: 0.55, bodyY: 150, legL: 30, kneeL: 80, legR: 30, kneeR: 80, armR: 120, face: { name: 'smug', mouth: t > 529.1 ? vis('NOVA', t) || 'smirk' : Math.floor(t * 6) % 2 ? 'B' : 'line' }, nametag: 'Nova', shadow: false,
    props: [{ svg: S.g(S.path('M0 0 Q-20 -80 10 -140 Q30 -80 20 0 Z', { fill: '#FFE14D', stroke: '#151515', 'stroke-width': 5 }), `translate(${hx * 1} ${hy - 20})`), layer: 'top' }] });
  w += drawHero({ ...you, nametag: tag });
  let o = world(t, cam, w, { novaSits: true });
  if (slip > 0.2 && slip < 1) o += C.sfx('*SLIP*', 700, 320, 1, 80, -8, '#FFFFFF');
  if (t > 528.2) o += C.sfx('OOF!', 1250, 300, inv(528.2, 528.35, t), 120, 8, '#FFE14D');
  return o;
}

// ---------------------------------------------------------------- 530.3 - 557.4: sunset talk
const SIT = { you: 840, nova: 1080, y: 1000 };
function sitScene(t, cam, you = {}, nova = {}, extra = '') {
  // a long ledge in front of the belt; they sit on it with legs dangling
  let w = S.rect(400, 832, 1100, 330, 14, { fill: '#8A92A6', stroke: '#151515', 'stroke-width': 7 }) + S.rect(400, 832, 1100, 26, 10, { fill: '#C9CED8' });
  w += drawNova({ x: SIT.nova, y: SIT.y, s: 0.55, nametag: 'Nova', shadow: false, turn: -0.3, armL: 20, armR: 20, ...nova });
  w += drawHero({ x: SIT.you, y: SIT.y, s: 0.55, nametag: tag, shadow: false, turn: 0.3, armL: 20, armR: 20, ...you });
  const M = G.eggMap(cam, t, { beltOff: t * 60 });
  return M.bg + S.g(w + extra, E.camTf(cam, 1)) + sunset(1);
}
function shotSunset(t) {
  if (t < 533.0) { // wide: the two of them on the ledge, the belt rolling behind, the square sun setting
    const cam = { zoom: 1.0 + 0.1 * inv(530.3, 533, t), fx: 960, fy: 540, x: 0, y: 80 };
    return sitScene(t, cam, { face: { name: 'neutral', eyes: { look: [0.6, 0] } }, ...A.breathe(t) }, { face: { name: 'cool' }, ...A.breathe(t, 1) }) + C.whiteFlash(0.4 * (1 - inv(530.3, 530.8, t)));
  }
  const focusNova = (t >= 533.0 && t < 536.0) || (t >= 537.2 && t < 545.8) || (t >= 547.4 && t < 549.7) || (t >= 551.2 && t < 552.5);
  const v = vis(focusNova ? 'NOVA' : 'YOU', t);
  const cam = { zoom: 2.0, fx: 960, fy: 540, x: (focusNova ? SIT.nova : SIT.you) - 960 + (focusNova ? 80 : -80), y: 170 };
  let novaFace = { name: 'cool', mouth: vis('NOVA', t) || 'smallSmile', eyes: { look: [-0.7, -0.3] } };
  if (t > 542.1 && t < 545.8) novaFace = { name: 'softSmile', mouth: vis('NOVA', t) || 'smallSmile', eyes: { look: [0, -0.6] }, glasses: false };
  if (t > 547.4 && t < 549.6) novaFace = { name: 'smug', mouth: vis('NOVA', t) || 'smirk' };
  if (t > 551.2 && t < 552.6) novaFace = { name: 'laugh', mouth: vis('NOVA', t) || 'grin' };
  let youFace = { name: 'happy', mouth: vis('YOU', t) || 'smallSmile', eyes: { look: [0.7, 0], cross: 0 } };
  if (t > 536.0 && t < 537.2) youFace = { name: 'shocked', mouth: vis('YOU', t) || 'O' };
  if (t > 545.8 && t < 547.4) youFace = { name: 'happy', mouth: vis('YOU', t) || 'smile', eyes: { look: [0.7, 0], cross: 0 } };
  if (t > 549.7 && t < 551.2) youFace = { name: 'nervous', mouth: vis('YOU', t) || 'teeth', fx: ['blush'] };
  if (t > 551.2) youFace = { name: 'sad', mouth: 'frown', eyes: { look: [0.7, 0], cross: 0 } };
  let o = sitScene(t, cam, { face: youFace, armR: t > 549.7 && t < 551.2 ? 60 : 20 }, { face: novaFace });
  // the Admin Vault hologram while she explains
  if (t > 537.3 && t < 545.9) {
    const k = ease.outBack(inv(537.5, 537.8, t)) * (1 - inv(545.6, 545.9, t));
    const L = E.vaultLayers({ zoom: 1 }, t, { eggOnPedestal: true });
    const id = 'holoClip';
    let holo = S.clipDef(id, S.rect(-400, -230, 800, 460, 30)) + S.g(S.g(L.bg + L.platform, 'scale(0.42) translate(-960 -540)'), null, { 'clip-path': `url(#${id})` });
    holo += S.rect(-400, -230, 800, 460, 30, { fill: '#7CF7FF', opacity: 0.12, stroke: '#7CF7FF', 'stroke-width': 8 });
    for (let y = -230; y < 230; y += 14) holo += S.rect(-400, y, 800, 3, 0, { fill: '#7CF7FF', opacity: 0.15 });
    if (t > 539.4) holo += S.el('text', { x: 0, y: 210, 'font-family': 'Lilita One', 'font-size': 54, fill: '#FFE14D', 'text-anchor': 'middle', stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' }, 'FINAL LEVEL');
    o += S.g(holo, `translate(${focusNova ? 560 : 1360} 300) scale(${f(k)})`, { opacity: 0.95 });
    if (t > 542.1) o += S.g(S.rect(-330, -60, 660, 120, 26, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 6 }) + S.el('text', { x: 0, y: 26, 'font-family': 'Lilita One', 'font-size': 60, fill: '#5CFF7A', 'text-anchor': 'middle' }, 'HATCH IT = WORLD FIXED?'), `translate(${focusNova ? 560 : 1360} 610) scale(${f(ease.outBack(inv(542.4, 542.6, t)))})`);
  }
  if (t > 533.6 && t < 536.0) o += S.g(secretEgg({ x: 0, y: 0, size: 220, t }), `translate(${focusNova ? 560 : 1360} 330) scale(${f(ease.outBack(inv(533.7, 533.9, t)))})`);
  return o;
}
function shotWalkAway(t) { // 552.5 - 557.4
  const cam = { zoom: 1.4, fx: 960, fy: 540, x: 200, y: 160 };
  const stop = t > 554.1;
  const nx = stop ? 1500 : lerp(1080, 1500, inv(552.6, 554.0, t));
  const look = ease.inOut(inv(554.6, 555.2, t));
  let w = S.rect(400, 832, 1100, 330, 14, { fill: '#8A92A6', stroke: '#151515', 'stroke-width': 7 }) + S.rect(400, 832, 1100, 26, 10, { fill: '#C9CED8' });
  w += drawHero({ x: SIT.you, y: SIT.y, s: 0.55, nametag: tag, shadow: false, turn: 0.4, face: stop && t > 555.3 ? { name: 'amazed', fx: ['blush'] } : { name: 'sad', mouth: 'frown' } });
  const novaP = stop ? { view: 'back', x: nx, y: 1000, s: 0.55 } : { view: 'side', flip: true, x: nx, y: 1000, s: 0.55, ...A.walk(t * 6) };
  if (stop && look > 0.5) Object.assign(novaP, { view: 'front', turn: -0.9, face: { name: 'smug', mouth: vis('NOVA', t) || 'smirk', eyes: { look: [-1, -0.3] } }, headRot: -6 });
  w += drawNova({ ...novaP, nametag: 'Nova' });
  const M = G.eggMap(cam, t, { beltOff: t * 60 });
  return M.bg + S.g(w, E.camTf(cam, 1)) + sunset(1);
}

// ---------------------------------------------------------------- 557.4 - 565.3: keep up
function shotKeepUp(t) {
  if (t < 562.5) {
    const u = t - 557.4;
    const camX = 600 + u * 500;
    const cam = { zoom: 1.0, fx: 960, fy: 540, x: camX, y: 100 };
    const M = G.eggMap(cam, t, { beltOff: t * 200 });
    let w = drawHero({ view: 'side', flip: true, x: camX + 960, y: 1000, s: 0.55, lean: -14, ...A.run(u * 32), face: { name: 'determined' }, nametag: tag }) + C.speedLines(camX + 200, camX + 800, 760, 8, 15, '#7CF7FF');
    let o = M.bg + M.ground + S.g(w, E.camTf(cam, 1));
    const ranks = [[557.9, '#8,000,000,000'], [559.3, '#50,000'], [560.5, '#300'], [561.4, '#3']];
    let r = ranks[0][1]; for (const [b, v] of ranks) if (t > b) r = v;
    const pk = Math.max(...ranks.map(([b]) => bump(t, b, b + 0.25)));
    o += S.g(S.rect(-420, -80, 840, 160, 34, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 7 }) + S.el('text', { x: 0, y: 34, 'font-family': 'Lilita One', 'font-size': 100, fill: r === '#3' ? '#FFE14D' : '#FFFFFF', 'text-anchor': 'middle' }, `RANK ${r}`), `translate(960 200) scale(${f(1 + 0.15 * pk)})`);
    if (t > 561.4) o += C.burst(960, 200, inv(561.4, 561.9, t));
    return o;
  }
  const cam = { zoom: 1.0, fx: 960, fy: 540, x: 2400, y: 100 };
  let o = S.g(G.eggMap(cam, t, {}).bg, null, { filter: 'url(#blurBg)' }) + S.rect(0, 0, W, H, 0, { fill: '#121628', opacity: 0.4 });
  o += G.leaderboard([['#1', 'xX_EggLord_Xx', '$9.9B'], ['#2', 'Nova', '$8.4B'], ['#3', 'YOU', '$7.7B']], 1, t > 564.2 ? 0 : t > 563.0 ? 1 : 2);
  return o;
}

// ---------------------------------------------------------------- 565.3 - 576.8: egg rain
function rainEggs(t, t0, n = 40, ground = 1000) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const birth = t0 + hash(i) * 3;
    const age = t - birth; if (age < 0) continue;
    const x = hash(i * 3) * 2200 - 140, y = -200 + age * 900;
    const rr = ['common', 'rare', 'epic', 'legendary', 'mythic'][i % 5];
    if (y > ground - 40) { const k = Math.min(1, (y - ground + 40) / 200); o += egg({ x, y: ground - 40, size: 80, rarity: rr, glow: false }); if (k < 0.5) o += S.g(F.markText('THUD', 0, 0, 40, -6, '#FFFFFF'), `translate(${f(x)} ${ground - 120})`); }
    else o += egg({ x, y, size: 80, rarity: rr, glow: rr !== 'common', rot: age * 200 });
  }
  return o;
}
function shotEggRain(t) {
  if (t < 567.7) { // the event banner
    const cam = { zoom: 1.0, fx: 960, fy: 540, x: 1600, y: 100 };
    let o = world(t, cam, '');
    o += S.rect(0, 0, W, H, 0, { fill: '#3A1A5E', opacity: f(0.4 * inv(565.3, 565.8, t)) });
    const k = ease.outBack(inv(565.5, 565.8, t));
    o += S.g(S.rect(-560, -110, 1120, 220, 40, { fill: '#FFC52E', stroke: '#151515', 'stroke-width': 10 }) + S.el('text', { x: 0, y: -24, 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 46, fill: '#1F2233', 'text-anchor': 'middle' }, 'SERVER EVENT!') + S.el('text', { x: 0, y: 64, 'font-family': 'Lilita One', 'font-size': 110, fill: '#FFFFFF', 'text-anchor': 'middle', stroke: '#151515', 'stroke-width': 14, 'paint-order': 'stroke' }, 'EGG RAIN!'), `translate(960 400) scale(${f(k)}) rotate(${f(-3 + 2 * Math.sin(t * 6))})`);
    o += rainEggs(t, 566.6, 16, 1100);
    return o;
  }
  if (t < 573.7) { // chaos: players run, mom's pink car drives through
    const u = t - 567.7;
    const cam = { zoom: 1.0, fx: 960, fy: 540, x: 1600, y: 100 };
    let w = '';
    const runner = (fn, x0, sp, name, ph, flip = false) => { const x = x0 + (flip ? 1 : -1) * u * sp; w += fn({ view: 'side', flip, x, y: 1000, s: 0.45, lean: -10, ...A.run(t * 26 + ph), armL: 160, armR: 160, face: { name: 'excited' }, nametag: name }); };
    runner(cast.pinky, 3400, 260, NAMES.pinky, 0);
    runner(cast.max, 2100, 240, NAMES.max, 1, true);
    runner(cast.speedy, 3700, 520, NAMES.speedy, 2);
    runner(cast2.jetkid, 2300, 200, NAMES2.jetkid, 3, true);
    w += drawHero({ x: 2560, y: 1000, s: 0.5, nametag: tag, armL: 150, armR: 150, lift: 40 * Math.abs(Math.sin(t * 7)), face: { name: 'excited' } });
    if (t > 570.4) { const cx = lerp(1300, 3900, inv(570.4, 572.4, t)); w += E.car(cx, 1040, '#FF6FB5', t, 0.9, true) + cast.mom({ x: cx + 10, y: 900, s: 0.32, face: 'joy', armR: 150, shadow: false }); }
    let o = world(t, cam, w) + S.g(rainEggs(t, 566.6, 50, 1000), E.camTf(cam, 1));
    return o;
  }
  // Dad on the dock catches one with his fishing rod
  const v = vis('DAD', t);
  const cam = { zoom: 1.2, fx: 900, fy: 560 };
  let o = E3.lakeDock(t, cam, { bobber: t < 574.2 });
  const caught = t > 573.9;
  const k = ease.outBack(inv(573.9, 574.3, t));
  const tipX = lerp(1080, 1000, k), tipY = lerp(440, 300, k);
  let rod = S.path(`M640 640 L${f(tipX)} ${f(tipY)}`, { stroke: '#6B4A2A', 'stroke-width': 10, 'stroke-linecap': 'round' });
  if (!caught) rod += S.path(`M${tipX} ${tipY} Q1150 520 1180 690`, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 3 }) + egg({ x: 1180, y: lerp(-100, 640, inv(573.7, 573.9, t)), size: 120, rarity: 'legendary', glow: true });
  else rod += S.path(`M${tipX} ${tipY} L${tipX} ${tipY + 140}`, { stroke: '#FFFFFF', 'stroke-width': 3 }) + egg({ x: tipX, y: tipY + 200, size: 130, rarity: 'legendary', glow: true, rot: 10 * Math.sin(t * 6) });
  const dad = cast.dad({ view: 'side', flip: true, x: 520, y: 950, s: 0.55, bodyY: 168, legL: 88, kneeL: 88, legR: 86, kneeR: 86, armL: 70, armR: 64, face: caught ? { name: 'amazed', mouth: v || 'smile' } : { name: 'neutral' }, nametag: 'Dad', shadow: false });
  o += S.g(rod + dad, E.camTf(cam, 1));
  if (caught) o += C.sfx('LEGENDARY CATCH!', 1300, 240, inv(574.0, 574.2, t), 76, 6, '#FFE14D') + F.sparkle(1050, 520, 40 * Math.abs(Math.sin(t * 5)));
  return o;
}

function scene(t) {
  if (t < 525.4) return shotSteal(t);
  if (t < 530.3) return shotPeel(t);
  if (t < 552.5) return shotSunset(t);
  if (t < 557.4) return shotWalkAway(t);
  if (t < 565.3) return shotKeepUp(t);
  return shotEggRain(t);
}

module.exports = { scene, TRACK, LINES, START, END };
