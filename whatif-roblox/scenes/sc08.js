// Part 7 (6:54 - 7:46.4): Nova. Three eggs at full speed through EggLord's lasers, slide, wall-jump,
// backflip, door locked. "Nice name tag... YOU." Common shoes. Two decisions. The subscribe gag.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const G = require('./env4');
const C = require('./common');
const A = require('./acting');
const { drawHero } = require('../rig/hero');
const { drawNova } = require('../rig/nova');
const { draw: cast, NAMES } = require('../rig/cast');
const { egg } = require('../rig/props');
const { f, ease, inv, lerp, clamp } = S;
const { W, H, bump, blinkAt, hash } = C;

const START = 414.0, END = 466.4;
const LINES = [
  [414.60, 416.60, 'NARRATOR', "And that's when you see *her.*"],
  [417.00, 421.60, 'NARRATOR', "A blur. Running straight through EggLord's lasers... with *THREE* eggs stacked on her head. At *FULL* speed."],
  [421.90, 424.60, 'YOU', "That's... that's impossible! You're supposed to be *SLOW!*"],
  [425.00, 430.60, 'NARRATOR', 'She slides under one laser, wall-jumps over two, backflips over the guard... and lands in her base. *Door locked.* Perfect.'],
  [431.00, 432.60, 'NARRATOR', 'Her name tag says *"Nova."*'],
  [433.00, 434.80, 'NOVA', 'Nice name tag... *YOU.*'],
  [435.10, 438.20, 'YOU', "Thanks! It's— uh— it's a long story, I typed it at two A.M., and—"],
  [438.60, 442.00, 'NOVA', 'Tip, noob. Never steal a Legendary egg in *Common shoes.*'],
  [442.40, 443.40, 'NARRATOR', "And she's *gone.*"],
  [443.80, 445.60, 'YOU', '...She called me *noob.*'],
  [446.00, 448.00, 'NARRATOR', "That's when you decide two things."],
  [448.10, 450.90, 'NARRATOR', "One: you're gonna become the *greatest egg thief* this world has ever seen."],
  [451.10, 452.60, 'NARRATOR', 'Two... you need *better shoes.*'],
  [453.00, 457.00, 'NARRATOR', 'Oh! Quick thing. Everyone who *subscribes* gets a *FREE* Legendary egg in the new world.'],
  [457.40, 459.60, 'NARRATOR', "It's a normal egg. Painted gold. Don't tell anyone."],
  [460.00, 463.80, 'NARRATOR', "And if you *DON'T* subscribe... your only pet is a rock. Forever. Like me."],
  [464.20, 465.60, 'YOU', 'I miss Rocky.'],
];
const TRACK = C.makeTrack(LINES);
const vis = (sp, t) => C.visemeAt(TRACK, sp, t);
const tag = { name: 'YOU', health: 1 };

const YB = { x0: 300, x1: 1500, col: '#FF8FC8', sign: "YOU's Base", doorSide: 'right' };
const NB = { x0: 3700, x1: 4800, col: '#E0283F', sign: "Nova's Base", doorSide: 'right' };
const GB = { x0: 5100, x1: 6900, col: '#FFD34D', gold: true, sign: 'TRY IT.', doorSide: 'left' };

function world(t, cam, w, o = {}) {
  const M = G.eggMap(cam, t, { beltOff: t * 120 * (o.slow || 1) });
  let b = G.base({ ...YB, locked: false, pedestals: [null, null, null] }, t);
  const novaEggs = [egg({ x: 0, y: -58, size: 100, rarity: 'legendary', glow: true }), egg({ x: 0, y: -58, size: 100, rarity: 'epic', glow: true }), o.novaFull ? egg({ x: 0, y: -58, size: 100, rarity: 'rare', glow: true }) : null];
  b += G.base({ ...NB, locked: o.novaLocked, lockPanel: false, pedestals: novaEggs }, t);
  const goldEggs = [];
  for (let i = 0; i < 5; i++) goldEggs.push(i < 3 && o.stolen ? null : egg({ x: 0, y: -58, size: 110, rarity: 'legendary', glow: true }));
  b += G.base({ ...GB, locked: true, lockPanel: false, pedestals: goldEggs }, t);
  if (o.lasers !== false) for (let i = 0; i < 3; i++) { const a = Math.sin(t * (1.5 + i * 0.4) * (o.slow || 1) + i) * 0.25; b += E.beam(GB.x0, 600 + i * 110, GB.x1, 600 + i * 110 + Math.tan(a) * 900, 1); }
  return M.bg + M.ground + S.g(b + w, E.camTf(cam, 1));
}

const stack = (n = 3, t = 0, wob = 1) => {
  let o = '';
  const rar = ['legendary', 'epic', 'rare'];
  for (let k = 0; k < n; k++) o += egg({ x: Math.sin(t * 6 + k) * 6 * wob * k, y: -1022 - k * 142, size: 152, rarity: rar[k], glow: k === 0, rot: Math.sin(t * 5 + k) * 5 * wob });
  return { svg: o, layer: 'top' };
};
function slowmo(k) { return k > 0 ? S.rect(0, 0, W, H, 0, { fill: '#FF8FB0', opacity: f(0.12 * k) }) + S.rect(0, 0, W, 60, 0, { fill: '#000', opacity: f(0.8 * k) }) + S.rect(0, H - 60, W, 60, 0, { fill: '#000', opacity: f(0.8 * k) }) : ''; }

// ---------------------------------------------------------------- see her (414.0 - 421.8)
function shotSeeHer(t) {
  const cam = { zoom: 1.6 + 0.2 * ease.inOut(inv(414.0, 416.8, t)), fx: 960, fy: 540, x: 1100 - 960 + 120, y: 250 };
  const look = ease.inOut(inv(414.6, 415.3, t));
  const you = { x: 1100, y: 1000, s: 0.55, nametag: { name: 'YOU', health: 0.2 }, turn: 0.5 * look, face: { name: 'amazed', eyes: { look: [look, -0.2], cross: 0 }, fx: [] }, ...A.breathe(t) };
  let o = world(t, cam, drawHero(you));
  for (let i = 0; i < 10; i++) { const ph = (t * 0.5 + hash(i)) % 1; o += S.rect(ph * 2200 - 200, hash(i * 3) * 1080, 160, 4, 2, { fill: '#FFFFFF', opacity: 0.4 }); }
  return o + slowmo(inv(414.2, 414.8, t));
}

function shotBlurNova(t) { // 416.9 - 421.8
  const u = t - 416.9;
  const slow = t < 419.2 ? 0.3 : 1;
  const dist = t < 419.2 ? u * 300 * 0.3 : 2.3 * 90 + (t - 419.2) * 900;
  const nx = GB.x1 + 200 - dist;
  const cam = { zoom: 1.1, fx: 960, fy: 540, x: nx - 960 - 200, y: 100 };
  const ph = (t < 419.2 ? u * 0.3 : 0.69 + (t - 419.2)) * 30;
  let w = drawNova({ view: 'side', x: nx, y: 1000, s: 0.55, lean: -10, ...A.run(ph), face: { name: 'determined' }, nametag: 'Nova', props: [stack(3, t)] });
  if (slow === 1) w += C.speedLines(nx + 100, nx + 800, 700, 9, 7, '#FF8FB0');
  let o = world(t, cam, w, { slow, stolen: true });
  o += slowmo(t < 419.2 ? 1 : 1 - inv(419.2, 419.5, t));
  const lab = (txt, k, x, y, col) => (k > 0 ? S.g(F.markText(txt, 0, 0, 84, -6, col), `translate(${x} ${y}) scale(${f(ease.outBack(clamp(k, 0, 1)))})`) : '');
  o += lab('x3 EGGS', inv(418.6, 418.8, t), 1500, 260, '#FFE14D') + lab('FULL SPEED', inv(420.8, 421.0, t), 520, 260, '#FF5A8A');
  return o;
}

function shotImpossible(t) { // 421.8 - 424.9
  const v = vis('YOU', t);
  const cam = { zoom: 2.1, fx: 960, fy: 540, x: 1100 - 960, y: 160 };
  const you = { x: 1100, y: 1000, s: 0.55, nametag: { name: 'YOU', health: 0.2 }, turn: 0.4, armR: 95, face: { name: 'shocked', mouth: v || 'O', eyes: { look: [1, -0.2], cross: 0 }, fx: ['sweat'] } };
  let o = world(t, cam, drawHero(you));
  const k = inv(423.6, 423.8, t);
  if (k > 0) {
    o += G.ruleCard(2, 'Carry = HALF SPEED', 1);
    o += S.path('M80 70 L700 200', { stroke: '#FF2D55', 'stroke-width': 16, 'stroke-linecap': 'round', opacity: f(k) });
  }
  return o;
}

// ---------------------------------------------------------------- parkour (424.9 - 430.9)
function shotParkour(t) {
  let nx, p, extra = '';
  if (t < 426.35) { // slide under a laser
    const k = inv(424.9, 426.35, t);
    nx = lerp(GB.x0 + 900, GB.x0 + 200, k);
    const sl = bump(k, 0.25, 0.85);
    p = { view: 'side', x: nx, y: 1000, s: 0.55, bodyY: 150 * sl, lean: 30 * sl, legL: 70 * sl, kneeL: 10, legR: 50 * sl, kneeR: 40 * sl, armL: -50 * sl, armR: 40, face: { name: 'determined' } };
    if (sl < 0.2) Object.assign(p, A.run(t * 30));
    extra += E.beam(GB.x0 - 200, 800, GB.x1, 800, 1);
    if (sl > 0.3) extra += C.dust(nx + 100, 1000, 425.4, t);
  } else if (t < 427.85) { // wall-jump over two
    const k = inv(426.35, 427.85, t);
    nx = lerp(GB.x0 + 200, GB.x0 - 260, k);
    const j = Math.sin(k * Math.PI);
    p = { view: 'side', x: nx, y: 1000, s: 0.55, lift: 380 * j, legL: 40, kneeL: 70 * j, legR: 20, kneeR: 80 * j, armL: 160, armR: 140, rot: -12 * j, face: { name: 'determined' } };
    extra += E.beam(GB.x0 - 600, 760, GB.x0 + 400, 790, 1) + E.beam(GB.x0 - 600, 860, GB.x0 + 400, 880, 1);
    if (k > 0.3 && k < 0.5) extra += C.sfx('WALL JUMP!', nx + 250, 380, 1, 60, 8, '#FFFFFF');
  } else if (t < 429.45) { // backflip over the guard
    const k = inv(427.85, 429.45, t);
    nx = lerp(GB.x0 - 260, NB.x1 + 40, ease.inOut(k));
    const j = Math.sin(k * Math.PI);
    p = { view: 'side', x: nx, y: 1000, s: 0.55, lift: 420 * j, rot: 360 * ease.inOut(k), rotY: -520, legL: 40 + 40 * j, kneeL: 90 * j, legR: 30 + 40 * j, kneeR: 90 * j, armL: 150 * j, armR: 160 * j, face: { name: 'smug' } };
    extra += cast.egglord({ x: GB.x0 - 640, y: 1000, s: 0.5, turn: 0.4, armL: 70, armR: 70, face: { name: 'shocked', eyes: { look: [0, -1], cross: 0 } }, nametag: NAMES.egglord });
  } else { // lands in her base, door locks
    const k = inv(429.45, 429.75, t);
    nx = NB.x1 - 200;
    p = { x: nx, y: 1000, s: 0.55, turn: -0.4, bodyY: 60 * Math.sin(Math.min(1, k) * Math.PI), sx: 1 + 0.05 * Math.sin(Math.min(1, k) * Math.PI), armL: lerp(80, 9, k), armR: lerp(80, 9, k), face: { name: 'smug' } };
  }
  const cam = { zoom: 1.0, fx: 960, fy: 540, x: nx - 960 + (t > 429.45 ? 0 : -150), y: 40 };
  let w = extra + drawNova({ ...p, nametag: 'Nova', props: [stack(3, t)] });
  let o = world(t, cam, w, { stolen: true, novaLocked: t > 429.9, lasers: true });
  if (t > 429.9) o += C.sfx('*CLICK*', 1350, 320, inv(429.9, 430.05, t), 70, -6, '#5CFF7A');
  if (t > 430.2) o += S.g(S.rect(-260, -70, 520, 140, 20, { fill: 'none', stroke: '#5CFF7A', 'stroke-width': 12 }) + S.el('text', { x: 0, y: 30, 'font-family': 'Lilita One', 'font-size': 90, fill: '#5CFF7A', 'text-anchor': 'middle' }, 'PERFECT'), `translate(560 280) rotate(-8) scale(${f(ease.outBack(inv(430.2, 430.4, t)))})`);
  return o;
}

function shotNovaCard(t) { // 430.9 - 432.9
  const cam = { zoom: 1.5, fx: 960, fy: 540, x: NB.x1 - 1160, y: 240 };
  let o = S.g(world(t, cam, '', { novaLocked: true, novaFull: true }), null, { filter: 'url(#blurBg)' });
  const chr = drawNova({ x: 470, y: 1180, s: 0.95, turn: -0.3, armR: 150, armL: 30, face: { name: 'smug' }, headRot: -6, shadow: false });
  o += G.introCard('Nova', t > 431.6 ? ['RANK: #2', 'NEVER CAUGHT'] : ['RANK: #2'], '#E0283F', inv(431.0, 431.3, t), chr);
  return o + C.whiteFlash(1 - inv(430.9, 431.05, t));
}

// ---------------------------------------------------------------- the talk (432.9 - 445.9)
function talkCam(focus) { return focus === 'nova' ? { zoom: 2.0, fx: 960, fy: 540, x: 1440 - 960 + 60, y: 160 } : { zoom: 2.0, fx: 960, fy: 540, x: 1100 - 960 - 60, y: 160 }; }
function talk(t, focus, nova, you) {
  const cam = talkCam(focus);
  let w = drawHero({ x: 1100, y: 1000, s: 0.55, nametag: { name: 'YOU', health: 0.2 }, turn: 0.5, ...you });
  w += drawNova({ x: 1440, y: 1000, s: 0.55, nametag: 'Nova', turn: -0.5, ...nova });
  return world(t, cam, w, { novaLocked: true, novaFull: true });
}

function shotNiceTag(t) { // 432.9 - 435.0
  const v = vis('NOVA', t);
  const slip = t > 434.1 ? 14 * ease.out(inv(434.1, 434.4, t)) : 0;
  return talk(t, 'nova', { face: { name: 'smug', mouth: v || 'smirk', glassesDy: slip, eyes: { look: [-0.8, -0.3] } }, armL: 9, headRot: t > 434.1 ? -4 : 0 }, { face: { name: 'shocked' } });
}

function shotFlustered(t) { // 435.0 - 438.4
  const v = vis('YOU', t);
  const wave = Math.sin(t * 16);
  return talk(t, 'you', { face: { name: 'smug', eyes: { look: [-0.8, -0.3] } } }, { face: { name: 'nervous', mouth: v || 'teeth', eyes: { look: [0.9, 0], cross: 0 }, fx: ['blush', 'sweat'] }, armL: 120 + 30 * wave, armR: 120 - 30 * wave, headRot: 4 * wave });
}

function shotShoes(t) { // 438.4 - 442.2
  const v = vis('NOVA', t);
  if (t < 440.4) return talk(t, 'nova', { face: { name: 'smug', mouth: v || 'smirk', eyes: { look: [-0.6, 0.6] } }, armL: lerp(9, -40, ease.out(inv(438.7, 439.0, t))), armR: 9 }, { face: { name: 'confused' } });
  // split close-up: common shoes vs legendary shoes
  let o = S.rect(0, 0, W, H, 0, { fill: '#2A2E3E' }) + S.rect(960, 0, 960, H, 0, { fill: '#3A1020' });
  o += S.g(drawHero({ x: 0, y: 0, s: 1.6, shadow: false, nametag: null }), 'translate(480 760) translate(0 1300) scale(1) translate(0 -1300)').replace(/^/, '');
  // only shoes: draw both characters huge and let the frame crop at the feet
  o = S.rect(0, 0, W, H, 0, { fill: '#2A2E3E' }) + S.rect(960, 0, 960, H, 0, { fill: '#5A1428' });
  o += S.g(drawHero({ x: 480, y: 900, s: 1.8, shadow: false }), null, { 'clip-path': 'url(#leftHalf)' }) + S.clipDef('leftHalf', S.rect(0, 0, 960, H));
  o += S.g(drawNova({ x: 1440, y: 900, s: 1.8, shadow: false }), null, { 'clip-path': 'url(#rightHalf)' }) + S.clipDef('rightHalf', S.rect(960, 0, 960, H));
  o += S.path('M960 0 L960 1080', { stroke: '#FFFFFF', 'stroke-width': 10 });
  const tagC = ease.outBack(inv(440.5, 440.7, t)), tagL = ease.outBack(inv(441.1, 441.3, t));
  o += S.g(S.rect(-190, -60, 380, 120, 24, { fill: '#8A92A6', stroke: '#151515', 'stroke-width': 7 }) + S.el('text', { x: 0, y: 28, 'font-family': 'Lilita One', 'font-size': 80, fill: '#FFFFFF', 'text-anchor': 'middle' }, 'COMMON'), `translate(480 200) scale(${f(tagC)})`);
  o += S.g(S.rect(-230, -60, 460, 120, 24, { fill: '#FFC52E', stroke: '#151515', 'stroke-width': 7 }) + S.el('text', { x: 0, y: 28, 'font-family': 'Lilita One', 'font-size': 80, fill: '#FFFFFF', 'text-anchor': 'middle', stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' }, 'LEGENDARY'), `translate(1440 200) scale(${f(tagL)})`);
  if (tagL > 0) o += F.sparkle(1200, 760, 40 * Math.abs(Math.sin(t * 5))) + F.sparkle(1700, 820, 30 * Math.abs(Math.sin(t * 5 + 1))) + F.sparkle(1500, 640, 24 * Math.abs(Math.sin(t * 5 + 2)));
  return o;
}

function shotGone(t) { // 442.2 - 443.6
  const k = inv(442.35, 442.6, t);
  const cam = talkCam('you'); cam.zoom = 1.6; cam.x += 120;
  let w = drawHero({ x: 1100, y: 1000, s: 0.55, nametag: { name: 'YOU', health: 0.2 }, turn: 0.5, face: { name: 'shocked', eyes: { look: [1, 0], cross: 0 } } });
  if (k < 1) w += S.g(drawNova({ view: 'side', flip: true, x: lerp(1440, 2400, ease.in(k)), y: 1000, s: 0.55, lean: -12, ...A.run(t * 30), nametag: 'Nova' }), null, { filter: 'url(#whip)' });
  w += C.speedLines(1300, 2200, 760, 8, 61, '#FF8FB0') + C.dust(1440, 1000, 442.35, t);
  for (let i = 0; i < 5; i++) w += S.circle(1440 + i * 50, 980 - i * 6, 40 * (1 - inv(442.4, 443.4, t)), { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 4, opacity: f(1 - inv(442.4, 443.4, t)) });
  return world(t, cam, w, { novaLocked: true, novaFull: true });
}

function shotDreamy(t) { // 443.6 - 445.9
  const v = vis('YOU', t);
  const cam = { zoom: 2.2, fx: 960, fy: 540, x: 1100 - 960, y: 140 };
  let o = `<defs><radialGradient id="dreamBg"><stop offset="0" stop-color="#FFD1E3"/><stop offset="1" stop-color="#FF8FB0"/></radialGradient></defs>` + S.rect(0, 0, W, H, 0, { fill: 'url(#dreamBg)' });
  for (let i = 0; i < 12; i++) { const ph = (t * 0.4 + hash(i)) % 1; o += S.g(S.path(F.heartPath(0, 0, 26 + 14 * hash(i)), { fill: '#FF5A9A', stroke: '#151515', 'stroke-width': 4 }), `translate(${f(hash(i * 3) * 1920)} ${f(1100 - ph * 1200)})`, { opacity: f(0.8 * (1 - ph)) }); }
  o += S.g(drawHero({ x: 1100, y: 1000, s: 0.55, nametag: { name: 'YOU', health: 0.2 }, turn: 0.3, headRot: -8 + 3 * Math.sin(t * 2), face: { name: 'love', mouth: v || 'smallSmile', fx: ['blush', 'hearts'] } }), E.camTf(cam, 1));
  return o;
}

// ---------------------------------------------------------------- decisions (445.9 - 452.8)
function shotDecide(t) {
  const cam = { zoom: 1.5 + 0.1 * inv(445.9, 452.8, t), fx: 960, fy: 540, x: 1000 - 960, y: 220 };
  const shoes = t > 451.1;
  const you = { x: 1000, y: 1000, s: 0.55, nametag: { name: 'YOU', health: 1 }, armR: shoes ? 9 : lerp(9, 165, ease.outBack(inv(448.1, 448.4, t))), face: shoes ? { name: 'deadpan', eyes: { look: [0, 1], cross: 0 } } : t > 448.1 ? { name: 'determined', fx: ['sparkles'] } : { name: 'determined' }, headRot: shoes ? 10 : 0, lean: t > 448.1 && !shoes ? -3 : 0 };
  let o = world(t, cam, drawHero(you));
  if (t > 448.1 && !shoes) {
    let rays = '';
    for (let i = 0; i < 14; i++) rays += S.path('M0 0 L-70 -1300 L70 -1300 Z', { fill: '#FFE14D', opacity: 0.18, transform: `rotate(${f(i * 25.7 + t * 30)})` });
    o = S.g(rays, 'translate(960 520)') + o;
  }
  const card = (n, txt, k, y) => (k > 0 ? S.g(S.rect(-40, -60, 760, 120, 26, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 6 }) + S.circle(20, 0, 44, { fill: n === 1 ? '#FFC52E' : '#3BD16F', stroke: '#151515', 'stroke-width': 5 }) + S.el('text', { x: 20, y: 22, 'font-family': 'Lilita One', 'font-size': 64, fill: '#FFFFFF', 'text-anchor': 'middle' }, String(n)) + S.el('text', { x: 90, y: 22, 'font-family': 'Lilita One', 'font-size': 54, fill: '#FFFFFF' }, txt), `translate(${f(-800 + 900 * ease.outBack(clamp(k, 0, 1)))} ${y})`) : '');
  o += card(1, 'GREATEST EGG THIEF', inv(448.1, 448.4, t), 140) + card(2, 'BETTER SHOES', inv(451.1, 451.4, t), 290);
  return o;
}

// ---------------------------------------------------------------- subscribe gag (452.8 - 466.4)
function subButton(k, press = 0) {
  if (k <= 0) return '';
  let o = S.rect(-300, -80, 600, 160, 40, { fill: '#000', opacity: 0.25, transform: 'translate(0 14)' }) + S.rect(-300, -80, 600, 160, 40, { fill: press > 0.5 ? '#8A92A6' : '#E8243C', stroke: '#151515', 'stroke-width': 8 });
  o += S.el('text', { x: 40, y: 26, 'font-family': 'Lilita One', 'font-size': 86, fill: '#FFFFFF', 'text-anchor': 'middle' }, press > 0.5 ? 'SUBSCRIBED' : 'SUBSCRIBE');
  o += S.path('M-250 -30 L-200 0 L-250 30 Z', { fill: '#FFFFFF' });
  return S.g(o, `translate(960 ${f(lerp(-300, 380, ease.outBack(clamp(k, 0, 1))))}) scale(${f(1 - 0.06 * press)})`);
}

function shotSubscribe(t) {
  let o = `<defs><radialGradient id="subBg"><stop offset="0" stop-color="#FFE27A"/><stop offset="1" stop-color="#FF9F1C"/></radialGradient></defs>` + S.rect(0, 0, W, H, 0, { fill: 'url(#subBg)' });
  let rays = '';
  for (let i = 0; i < 16; i++) rays += S.path('M0 0 L-60 -1400 L60 -1400 Z', { fill: '#FFFFFF', opacity: 0.2, transform: `rotate(${f(i * 22.5 + t * 25)})` });
  o += S.g(rays, 'translate(960 640)');
  if (t < 457.3) {
    o += subButton(inv(453.1, 453.5, t), bump(t, 455.6, 456.2) > 0.5 ? 1 : t > 456.0 ? 1 : 0);
    const ek = ease.outBack(inv(455.0, 455.3, t));
    if (ek > 0) o += S.g(egg({ x: 0, y: 0, size: 300, rarity: 'legendary', glow: true, rot: 8 * Math.sin(t * 3) }), `translate(960 760) scale(${f(ek)})`) + S.g(F.markText('FREE!', 0, 0, 100, -8, '#FFFFFF'), `translate(1320 680) scale(${f(ek)})`);
    return o;
  }
  if (t < 459.8) { // whisper: it's painted
    o += S.rect(0, 0, W, H, 0, { fill: '#000', opacity: 0.45 });
    const p = inv(457.5, 459.4, t);
    const id = 'paintClip';
    o += S.g(egg({ x: 0, y: 0, size: 420, rarity: 'common', glow: false }), 'translate(960 560)');
    o += S.clipDef(id, S.rect(700, 300, 520 * p + 1, 560));
    o += S.g(S.g(egg({ x: 0, y: 0, size: 420, rarity: 'legendary', glow: false }), 'translate(960 560)'), null, { 'clip-path': `url(#${id})` });
    const bx = 700 + 520 * p, by = 560 + Math.sin(t * 14) * 120;
    o += S.g(S.rect(-14, 0, 28, 200, 8, { fill: '#8A5A33', stroke: '#151515', 'stroke-width': 5 }) + S.rect(-26, -60, 52, 70, 10, { fill: '#C9CED8', stroke: '#151515', 'stroke-width': 5 }) + S.rect(-26, -100, 52, 50, 14, { fill: '#FFC52E', stroke: '#151515', 'stroke-width': 5 }), `translate(${f(bx)} ${f(by)}) rotate(20)`);
    o += S.g(F.markText('shhh...', 0, 0, 70, -6, '#FFFFFF'), 'translate(1500 260)');
    return o;
  }
  // only pet: a rock. forever. (rain, hero alone with a photo of Rocky)
  o = S.rect(0, 0, W, H, 0, { fill: '#4A5370' });
  for (let i = 0; i < 60; i++) { const ph = (t * 1.6 + hash(i)) % 1; o += S.path(`M${f(hash(i * 3) * 1920 + ph * 60)} ${f(ph * 1200 - 100)} l-14 40`, { stroke: '#9FB4D0', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 }); }
  o += S.rect(0, 900, W, 180, 0, { fill: '#3A4258' });
  const v = vis('YOU', t);
  const [hx, hy] = A.hand(110);
  const photo = S.g(S.rect(-90, -110, 180, 220, 10, { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 6 }) + S.rect(-72, -92, 144, 150, 6, { fill: '#BFE9FF' }) + G.rocky({ x: 0, y: 50, s: 0.65, face: 'happy' }) + S.path(F.heartPath(50, 80, 14), { fill: '#FF5A9A' }), `translate(${f(hx * 0.8)} ${f(hy * 0.8 - 40)}) rotate(-8) scale(1.3)`);
  o += S.g(drawHero({ x: 0, y: 0, s: 1, armR: 110, face: { name: 'sad', mouth: v || 'frown', eyes: { look: [0.5, 0.6], cross: 0 }, fx: t > 464.0 ? ['tears'] : [] }, nametag: null, props: [{ svg: photo, layer: 'top' }] }), 'translate(960 1000) scale(0.68)');
  o += G.rainCloud(960, 260, 1.0, t);
  if (t > 461.3 && t < 463.2) o += S.g(S.rect(-200, -60, 400, 120, 20, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 6 }) + S.el('text', { x: 0, y: 30, 'font-family': 'Lilita One', 'font-size': 80, fill: '#FFFFFF', 'text-anchor': 'middle' }, 'FOREVER'), `translate(1500 500) scale(${f(ease.outBack(inv(461.4, 461.6, t)))})`);
  return o;
}

function scene(t) {
  if (t < 416.9) return shotSeeHer(t);
  if (t < 421.8) return shotBlurNova(t);
  if (t < 424.9) return shotImpossible(t);
  if (t < 430.9) return shotParkour(t);
  if (t < 432.9) return shotNovaCard(t);
  if (t < 435.0) return shotNiceTag(t);
  if (t < 438.4) return shotFlustered(t);
  if (t < 442.2) return shotShoes(t);
  if (t < 443.6) return shotGone(t);
  if (t < 445.9) return shotDreamy(t);
  if (t < 452.8) return shotDecide(t);
  return shotSubscribe(t);
}

module.exports = { scene, TRACK, LINES, START, END };
