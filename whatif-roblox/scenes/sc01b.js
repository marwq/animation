// SC 01, 0:10 - 0:20 — Nova's parkour, "You coming or what, noob?!", YOU falls off the edge,
// freeze frame, VHS rewind, "Okay. Okay. Let me back up."
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const C = require('./common');
const { drawHero } = require('../rig/hero');
const { drawNova } = require('../rig/nova');
const { secretEgg } = require('../rig/props');
const { f, ease, inv, lerp, clamp } = S;
const { W, H, bump, blinkAt } = C;

const LINES = [
  [11.85, 13.25, 'NOVA', 'You coming or what, *noob?!*'],
  [13.45, 14.35, 'YOU', "I'M COMING!"],
  [14.40, 15.20, 'YOU', "I'm totally fine, I'm—"],
  [15.25, 16.10, 'YOU', '*AAAAAH!*'],
  [17.00, 19.00, 'NARRATOR', 'Okay. Okay. Let me back up.'],
];
const TRACK = C.makeTrack(LINES);
const vis = (sp, t) => C.visemeAt(TRACK, sp, t);

const timerSec = (t) => Math.max(0, 10 - Math.floor(t - 8.62));
const run = (ph, amp = 1) => ({
  legL: 44 * amp * Math.sin(ph), kneeL: 26 + 34 * Math.max(0, -Math.sin(ph)), legR: -44 * amp * Math.sin(ph), kneeR: 26 + 34 * Math.max(0, Math.sin(ph)),
  armL: -50 * amp * Math.sin(ph), armR: 50 * amp * Math.sin(ph), lift: 14 * Math.abs(Math.sin(ph)),
});
const eggOnHead = (t, bodyY, size = 240, wob = 6, dy = 0, dx = 6) => ({ svg: secretEgg({ x: dx, y: -950 - size * 0.46 + bodyY + dy, size, t, rot: wob * Math.sin(t * 9) }), layer: 'top' });

// ---------------------------------------------------------------- F: Nova's parkour (10.0 - 11.7)
const NOVA_LAND_X = 1060;
function novaParkour(u, t) {
  const p = { y: 990, s: 0.6, nametag: 'Nova' };
  if (u < 0.45) {
    const k = u / 0.45;
    Object.assign(p, { view: 'side', x: lerp(2250, 1520, k), lean: -10, ...run(u * 30), face: 'determined' });
  } else if (u < 0.8) {
    const k = ease.out(inv(0.45, 0.8, u));
    Object.assign(p, { view: 'side', x: lerp(1520, 1180, k), bodyY: 170 * bump(u, 0.43, 0.84), lean: 32 * bump(u, 0.43, 0.84), legL: 82, kneeL: 4, legR: 58, kneeR: 34, armL: -40, armR: 26, face: 'smug' });
  } else if (u < 1.3) {
    const k = inv(0.8, 1.3, u), e = ease.inOut(k);
    const tuck = Math.sin(k * Math.PI);
    Object.assign(p, { view: 'side', x: lerp(1180, NOVA_LAND_X + 60, e), lift: Math.sin(k * Math.PI) * 300, rot: 360 * e, rotY: -520, legL: 40 + 30 * tuck, kneeL: 90 * tuck, legR: 30 + 30 * tuck, kneeR: 90 * tuck, armL: 150 * tuck, armR: 160 * tuck, face: 'smug' });
  } else if (u < 1.48) {
    const k = inv(1.3, 1.48, u);
    Object.assign(p, { x: NOVA_LAND_X, turn: -0.6, bodyY: 60 * Math.sin(k * Math.PI), sx: 1 + 0.06 * Math.sin(k * Math.PI), sy: 1 - 0.06 * Math.sin(k * Math.PI), armL: 70, armR: 70, face: 'determined' });
  } else {
    Object.assign(p, { x: NOVA_LAND_X, turn: -0.6, armL: lerp(70, 8, ease.out(inv(1.48, 1.62, u))), armR: lerp(70, 10, ease.out(inv(1.48, 1.62, u))), headRot: -4, face: 'smug' });
  }
  return p;
}

function shotParkour(t) {
  const u = t - 10.0;
  const flip = bump(u, 0.8, 1.3);
  const cam = { zoom: 1.02 + 0.08 * flip, fx: lerp(1100, 1000, inv(0, 1.7, u)), fy: 600, x: lerp(80, -40, inv(0, 1.7, u)) };
  cam.sx = Math.sin(t * 61) * 4; cam.sy = Math.cos(t * 53) * 3;
  const L = E.vaultLayers(cam, t, { eggOnPedestal: false });
  const np = novaParkour(u, t);
  const lookX = clamp((np.x - 470) / 700, -1, 1);
  const hero = drawHero({
    x: 470, y: 990, s: 0.62, bodyY: 50, turn: 0.3, armL: 150 + 6 * Math.sin(t * 30), armR: 152 - 6 * Math.sin(t * 30),
    face: u > 0.85 && u < 1.4 ? { name: 'amazed', eyes: { look: [lookX, -0.3], cross: 0 }, fx: [] } : { name: 'scared', eyes: { look: [lookX, -0.1], cross: 0 } },
    props: [eggOnHead(t, 50)],
  });
  let world = hero + drawNova(np);
  if (u > 0.2 && u < 0.92) world += E.beam(-400, 520, 2600, 520, Math.min(1, bump(u, 0.2, 0.92) * 3));
  if (u > 0.62 && u < 1.42) world += E.beam(-400, 940, 2600, 905, Math.min(1, bump(u, 0.62, 1.42) * 3));
  if (u < 0.45) world += C.speedLines(np.x + 120, np.x + 700, 760, 7, 11);
  if (u > 0.45 && u < 0.8) world += C.dust(np.x + 60, 990, 0.45, u);
  if (flip > 0.2) world += C.sfx('WHOOSH!', NOVA_LAND_X + 260, 420, flip, 76, 8, '#FF8FB0');
  let o = L.bg + L.platform + S.g(world, E.camTf(cam, 1));
  o += E.timerHud(timerSec(t), bump(t % 1, 0.62, 0.77));
  o += S.rect(0, 0, W, H, 0, { fill: '#FF2D55', opacity: f(0.05 + 0.05 * Math.max(0, Math.sin(t * 9))) });
  return o;
}

// ---------------------------------------------------------------- G: Nova close-up (11.7 - 13.4)
function shotNovaClose(t) {
  const u = t - 11.7;
  const cam = { zoom: 2.15 + 0.08 * inv(0, 1.7, u), fx: NOVA_LAND_X, fy: 560 };
  const L = E.vaultLayers(cam, t, { eggOnPedestal: false });
  const v = vis('NOVA', t);
  const noob = ease.outBack(inv(13.0, 13.15, t));
  const p = {
    x: NOVA_LAND_X, y: 990, s: 0.6, turn: -0.55, headRot: -3 + 5 * noob, bodyY: 2 * Math.sin(t * 4),
    armR: lerp(10, -58, noob), armL: 8,
    face: { name: 'smug', mouth: v || 'smirk', eyes: { look: [-0.7, -0.3] }, blink: blinkAt(t, 12.35) },
  };
  let o = S.g(L.bg + L.platform, null, { filter: 'url(#blurBg)' });
  o += S.g(drawNova(p), E.camTf(cam, 1));
  o += E.timerHud(timerSec(t), bump(t % 1, 0.62, 0.77));
  return o;
}

// ---------------------------------------------------------------- H1: "I'M COMING!" (13.4 - 14.4)
function shotYouComing(t) {
  const u = t - 13.4;
  const up = ease.outBack(inv(0, 0.25, u));
  const bodyY = lerp(50, 8, up);
  const cam = { zoom: 2.0 - 0.1 * inv(0, 1, u), fx: 470, fy: 560 };
  cam.sx = Math.sin(t * 61) * 3; cam.sy = Math.cos(t * 53) * 3;
  const L = E.vaultLayers(cam, t, { eggOnPedestal: false });
  const v = vis('YOU', t);
  const p = {
    x: 470, y: 990, s: 0.62, bodyY, turn: 0.4, headRot: 4 * Math.sin(t * 14),
    armL: 150 + 8 * Math.sin(t * 25), armR: 152 - 8 * Math.sin(t * 25),
    face: { name: 'determined', mouth: v || 'teeth', eyes: { look: [0.8, -0.2], cross: 0 }, fx: ['sweat'] },
    props: [eggOnHead(t, bodyY, 240, 10)],
  };
  let o = S.g(L.bg + L.platform, null, { filter: 'url(#blurBg)' });
  o += S.g(drawHero(p), E.camTf(cam, 1));
  o += E.timerHud(timerSec(t), bump(t % 1, 0.62, 0.77));
  return o;
}

// ---------------------------------------------------------------- H2: run + trip (14.4 - 15.25)
function shotYouRun(t) {
  const u = t - 14.4;
  const cam = { zoom: 1.35, fx: 800, fy: 620, x: lerp(-120, 80, inv(0, 0.85, u)) };
  const L = E.vaultLayers(cam, t, { eggOnPedestal: false });
  const v = vis('YOU', t);
  const trip = ease.in(inv(0.58, 0.85, u));
  const ph = u * 26;
  const r = run(ph, 1 - trip);
  const p = {
    view: 'side', flip: true, x: lerp(470, 860, ease.inOut(inv(0, 0.85, u))), y: 990, s: 0.62, lean: -8 + 10 * Math.sin(t * 17) * (1 - trip), ...r,
    rot: 75 * trip, lift: r.lift + 60 * Math.sin(trip * Math.PI),
    face: trip > 0.1 ? { name: 'scared', mouth: 'scream', eyes: { pupil: 0.4 }, fx: ['sweat2'] } : { name: 'nervous', mouth: v || 'teeth', fx: ['sweat'] },
    headRot: 8 * Math.sin(t * 15),
    props: [eggOnHead(t, 0, 240, 16 + 30 * trip, -120 * trip, 30 * trip)],
  };
  const nova = drawNova({ x: NOVA_LAND_X + 120, y: 990, s: 0.6, turn: -0.6, face: { name: 'deadpan', eyes: { look: [-0.8, -0.3] } } });
  let o = L.bg + L.platform + S.g(nova + drawHero(p), E.camTf(cam, 1));
  if (trip > 0.05) o += C.sfx('!!', 1280, 300, trip * 2, 110, 10, '#FF4D6D');
  o += E.timerHud(timerSec(t), bump(t % 1, 0.62, 0.77));
  return o;
}

// ---------------------------------------------------------------- H3: hanging (15.25 - 16.1) + freeze
const EDGE = 452;
function shotHang(t, freeze = 0) {
  const u = t - 15.25;
  const grab = ease.outBack(inv(0, 0.12, u));
  const cam = { zoom: 1.0 + 0.1 * inv(0, 0.85, u), fx: 900, fy: 560 };
  const sh = (1 - inv(0, 0.3, u)) * 16 + 5;
  if (!freeze) { cam.sx = Math.sin(t * 61) * sh; cam.sy = Math.cos(t * 53) * sh; }
  const L = E.vaultHangLayers(cam, t, EDGE);
  const s = 0.7;
  const feetY = EDGE + 747 * s - 40 * (1 - grab);
  const kick = Math.sin(t * 18);
  const p = {
    x: 900, y: feetY, s, armR: 150, armL: 60 + 50 * Math.sin(t * 21), shadow: false,
    legL: 18 * kick, kneeL: 30 + 25 * Math.max(0, kick), legR: -18 * kick, kneeR: 30 + 25 * Math.max(0, -kick),
    headRot: 6 * Math.sin(t * 13), lean: 3 * Math.sin(t * 9),
    face: { name: 'scared', mouth: 'scream', eyes: { pupil: 0.4, cross: 0.2 }, fx: ['sweat2'] },
    props: [eggOnHead(t, 0, 240, 22)],
  };
  let o = L.bg + L.platform + S.g(drawHero(p), E.camTf(cam, 1));
  // fingers over the edge
  o += S.g(S.rect(900 + 234 * s - 32, EDGE - 18, 64, 30, 10, { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 6 }), E.camTf(cam, 1));
  return o;
}

function shotFreeze(t) {
  const u = t - 16.1;
  let o = S.g(shotHang(16.08, 1), `translate(960 540) scale(${f(1 + 0.05 * ease.out(inv(0, 0.5, u)))}) translate(-960 -540)`);
  o += S.rect(0, 0, W, H, 0, { fill: '#7A7A8C', opacity: 0.28 });
  const k = ease.outBack(inv(0.05, 0.2, u));
  if (k > 0) {
    let a = S.path('M0 0 C60 -40 140 -40 200 -10', { fill: 'none', stroke: '#151515', 'stroke-width': 24, 'stroke-linecap': 'round' }) +
      S.path('M0 0 C60 -40 140 -40 200 -10', { fill: 'none', stroke: '#FFE14D', 'stroke-width': 12, 'stroke-linecap': 'round' }) +
      S.path('M185 -50 L230 0 L170 22 Z', { fill: '#FFE14D', stroke: '#151515', 'stroke-width': 7, 'stroke-linejoin': 'round' });
    a += F.markText('YOU.', -110, 20, 110, -6, '#FFE14D');
    o += S.g(a, `translate(470 260) scale(${f(k)})`);
  }
  o += C.sfx('*record scratch*', 1440, 960, inv(0, 0.1, u), 54, -4, '#FFFFFF');
  return o;
}

// ---------------------------------------------------------------- rewind + play (16.6 - 19.2)
function shotRewind(t, sceneAt) {
  const k = ease.in(inv(16.6, 19.1, t));
  const rt = lerp(16.05, 0.45, k);
  let o = S.g(sceneAt(rt), `translate(${f(Math.sin(t * 40) * 6)} 0)`);
  o += C.vhs(t, Math.floor(t * 3) % 2 ? '◀◀  REWIND' : '◀◀', 1);
  if (t > 19.05) o += C.staticNoise(t, inv(19.05, 19.2, t));
  return o;
}

function scene(t, sceneAt) {
  if (t < 11.7) return shotParkour(t);
  if (t < 13.4) return shotNovaClose(t);
  if (t < 14.4) return shotYouComing(t);
  if (t < 15.25) return shotYouRun(t);
  if (t < 16.1) return shotHang(t);
  if (t < 16.6) return shotFreeze(t);
  return shotRewind(t, sceneAt);
}

module.exports = { scene, TRACK, LINES };
