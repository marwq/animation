// SC 11 · JUMP, DAD! — the climax. The obby tower over lava under the moon: "the man who couldn't jump" (a grey REPLAY of
// the wall + the splash), a VS card, a whip-tilt up all 100 floors; the real Dad sweating over the JUMP!-taped space bar;
// the first jump (the server gasps), again, the slip on the ice ("...and didn't fall"), checkpoint 10; the whole server stops
// fighting and watches, Noodle starts the chant, montages up the floors with the chat flooding JUMP DAD, the battlefield
// chanting, DarkBlade's "JUMP!"; the wobble on icy floor 88 (real Dad leaning with the laptop), the final gap at floor 99,
// the hero's "JUMP, DAD, JUMP!"; "For my son." -> letterbox, the press, the slow-motion leap past the moon, short — GRAB —
// up, and the hot dog dives into the crystal (full-frame light); the dome shatters ("NO!"), everyone attacks, "Defeated...
// by a HOT DOG?!" (a spectator-cam inset), the Block King crumbles into cube confetti; VICTORY at dawn; the server teleports
// to the summit and tosses the hot dog, real Mom jumps on the couch ("That's my husband!"), "I did a jump!", real Dad turns
// to his son, one more giant JUMP, the hug ("a HUNDRED jumps"), MVP: DadBod1978 -> dip to night for SC 12.
// Every cut and beat comes from the voice through s11_env.times() (shared with audio/cues/gen_sc11.js).
'use strict';

const K = require('./kit');
const G = require('./gameui');
const R = require('./respawn');
const GS = require('./sets_game');
const H = require('./sets_house');
const X = require('../rig/extras');
const CAST = require('../rig/cast');
const AC = require('./acting');
const E = require('./s11_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const V = K.V;
const TM = E.times(V);
const { START, END, C, B } = TM;
const HOPS = E.route(TM);
const { SP, FL, camLerp, shook, camAt, toScr, view, whip, flashAt, letterbox, focusLines } = E;
const LR = H.SPOTS.livingRoom;
const KB = H.SPOTS.keyboardClose;
const L = (i) => V.L('11.' + i);

// close-ups render rig characters without the body-volume filter (perf); the router sets VOL_OFF per shot
let VOL_OFF = false;
const actor = (name, t, pose = {}, act) => K.actor(name, t, VOL_OFF && pose.volume === undefined ? { ...pose, volume: false } : pose, act);

// ================================================================ the tower world
const CRY = { x: SP.crystal.x, y: SP.crystal.y - 150, s: 0.8 };            // same as SC 10 (its own pedestal)
const TOPY = SP.top.y;                                         // feet on the summit
const EDGE = SP.finalGap.edge;                                  // the summit's lip (hands grab here)
function towerFrame(t, cam, o = {}, chars = '', over = '') {
  const Ly = GS.tower.layers(o.tw ?? t, cam, o.set || {});
  return E.roll(cam, Ly.bg + (o.bgx ? view(cam, o.bgx, o.bgk ?? 0.02) : '') + Ly.mid + view(cam, chars) + Ly.fg + Ly.light) + over;
}
const crystalW = (t, o = {}) => G.crystal({ x: CRY.x, y: CRY.y, s: CRY.s, t, beam: true, ...o });
// the hot dog on the route
function dadState(t) {
  const st = E.dadAt(t, HOPS);
  st.next = HOPS.find((h) => h.t0 > t && h.t0 - t < 0.25);
  return st;
}
const dadRoute = (t, o = {}) => actor('dadAvatar', t, E.dadPose(t, dadState(t), o), { arms: false });
const camOnDad = (t, z = 1, sx = 960, sy = 640, dy = 0) => { const st = dadState(t); return camAt(st.x, st.y - 120 + dy, z, sx, sy); };
// smooth camera that follows the route (averages the hot dog's position over a short window)
function camFollow(t, z = 1, sx = 960, sy = 640, win = 0.25, t0 = -1e9) {
  let x = 0, y = 0;
  for (let i = 0; i < 5; i++) { const st = dadState(Math.max(t0, t - win * (i / 4))); x += st.x; y += st.y; }
  return camAt(x / 5, y / 5 - 120, z, sx, sy);
}
// soft landing puff (two little clouds sliding out from the feet)
function puff(x, y, age, s = 1) {
  if (age < 0 || age > 0.45) return '';
  const u = age / 0.45;
  let o = '';
  for (const d of [-1, 1]) for (let i = 0; i < 3; i++) { const r = (14 + 18 * u) * s * (1 - i * 0.22); o += S.ellipse(x + d * (34 + 80 * u + i * 20) * s, y - (6 + 8 * i * u) * s, r * 1.3, r * 0.8, { fill: '#EDE8FA', opacity: f(0.85 * (1 - u)) }); }
  return o;
}
const landFX = (t, st) => (st.air || st.landAge < 0 || st.landAge > 0.45 ? '' : puff(st.x, st.y + 4, st.landAge));
const floorNow = (t) => { const st = dadState(t); return st.air ? (typeof st.hop.a === 'number' ? st.hop.a : 0) : typeof st.floor === 'number' ? st.floor : 0; };
const hud = (t, o = {}) => { const n = o.n ?? floorNow(t); const st = dadState(t); const bp = !st.air && st.landAge >= 0 && st.landAge < 0.45 ? seg(st.landAge, 0, 0.45) : 0; return n > 0 ? E.floorHUD(t, n, { bump: bp, ...o }) : ''; };

// ================================================================ the battlefield crowd
const BOSS = { x: SP.boss.x, y: SP.boss.y, s: 0.72 };                     // = SC 10
const DOME = { x: SP.boss.x, y: 860, r: 1000 };
const CROWD = [
  { k: 'player', i: 2, x: -1180, y: 868, ph: 0.3 },
  { k: 'clan', i: 1, x: 380, y: 878, ph: 1.1 },
  { k: 'player', i: 9, x: -540, y: 872, ph: 2.2 },
  { k: 'player', i: 12, x: 60, y: 884, ph: 0.9 },
  { k: 'grandmaAvatar', x: -330, y: 905, ph: 1.7 },
  { k: 'momAvatar', x: -1000, y: 935, o: { armor: 1 }, ph: 0.5 },
  { k: 'player', i: 5, x: -790, y: 925, o: { sword: 'gold' }, ph: 2.9 },
  { k: 'darkblade', x: 230, y: 948, o: { volume: false }, ph: 1.4 },
  { k: 'you', x: -640, y: 975, o: { nametag: 'YOU', crown: true, sword: 'gold' }, ph: 0.1 },
  { k: 'clan', i: 3, x: 470, y: 975, ph: 2.5 },
  { k: 'player', i: 14, x: -1250, y: 985, o: { sword: 'gold' }, ph: 1.9 },
  { k: 'noodle', x: -190, y: 995, ph: 0.7 },
  { k: 'player', i: 7, x: 110, y: 1002, o: { sword: 'gold' }, ph: 2.1 },
];
const memberBy = (k) => CROWD.find((m) => m.k === k);
const SPEAKS = { you: 'YOU', noodle: 'NOODLE', darkblade: 'DARKBLADE', momAvatar: 'MOM', grandmaAvatar: 'GRANDMA' };
const chantPump = (t, ph = 0) => { const c = (t * 1.85 + ph * 0.05) % 1; return c < 0.22 ? ease.out(c / 0.22) : 1 - ease.inOut(seg(c, 0.22, 1)); };
// pose for one member in a crowd mode: 'fight' | 'watch' | 'chant' | 'cheer' | 'attack'
function memberPose(m, t, mode, o = {}) {
  const s = SP.sAt(m.y), ph = m.ph || 0;
  const p = { x: m.x, y: m.y, s, t, ...(m.i !== undefined ? { i: m.i } : {}), ...(m.o || {}) };
  const talking = SPEAKS[m.k] && V.talking(SPEAKS[m.k], t);
  if (mode === 'fight') Object.assign(p, { turn: -0.6, armR: 100 + 55 * Math.sin(t * 9 + ph * 3), armL: 40 + 15 * Math.sin(t * 7 + ph), lean: -4, face: 'determined' });
  else if (mode === 'watch') {
    const tw = o.t0 !== undefined ? seg(t, o.t0 + ph * 0.18, o.t0 + ph * 0.18 + 0.25) : 1;
    Object.assign(p, { turn: lerp(-0.6, 0.55, tw), armR: lerp(100, 14, tw), armL: lerp(40, 14, tw), headRot: -5 * tw, face: { name: 'shocked', eyes: { look: [lerp(-0.6, 0.85, tw), lerp(0, -0.9, tw)] }, fx: tw > 0 && tw < 1 || (o.t0 !== undefined && t < o.t0 + ph * 0.18 + 0.9 && t > o.t0) ? ['exclaim'] : [] } });
    if (talking) delete p.face;
  } else if (mode === 'chant') {
    const pu = chantPump(t, ph);
    Object.assign(p, { turn: 0.45, armR: 118 + 52 * pu, armL: 18 + 12 * pu, lift: 12 * pu * s / 0.36, bodyY: -6 * pu, face: talking ? { name: 'excited', eyes: { look: [0.7, -0.8] } } : { name: 'excited', mouth: pu > 0.4 ? 'scream' : 'O', eyes: { look: [0.7, -0.8] } } });
  } else if (mode === 'cheer') {
    const w = Math.sin(t * 9 + ph * 2);
    Object.assign(p, { turn: (hash(ph * 7) - 0.5) * 0.6, armR: 150 + 22 * w, armL: 150 - 22 * w, lift: 22 * Math.abs(Math.sin(t * 6 + ph)) * s / 0.36, face: talking ? 'joy' : { name: 'joy', mouth: 'bigGrin' } });
  } else if (mode === 'attack') {
    const run = AC.run(t * 15 + ph * 2, 1);
    const dx = -(o.speed ?? 720) * Math.max(0, t - (o.t0 ?? t) - ph * 0.05);
    Object.assign(p, { x: m.x + dx, view: 'side', ...run, armR: 120 + 40 * Math.sin(t * 15 + ph), lean: -8, face: 'determined', shadow: true });
  }
  if (m.k === 'noodle') {
    const h = CAST.handAt(CAST.D.noodle, p, 1);
    p.props = [{ svg: X.goldSword({ x: h[0], y: h[1], rot: (p.view === 'side' ? -70 : 15) + (p.armR || 0) * 0.2, s: 0.85 }), layer: 'front' }];
  }
  return { ...p, ...(o.over && o.over[m.k] ? o.over[m.k] : {}) };
}
function crowd(t, mode, o = {}) {
  const list = CROWD.filter((m) => !(o.skip || []).includes(m.k) && (!o.filter || o.filter(m))).map((m) => ({ m, p: memberPose(m, t, typeof mode === 'function' ? mode(m) : mode, o) })).sort((a, b) => a.p.y - b.p.y);
  let out = '';
  for (const { m, p } of list) {
    if (p.y !== m.y && p.s === SP.sAt(m.y)) p.s = SP.sAt(p.y);
    out += m.k === 'player' ? K.draw.player(m.i, { shade: true, shadow: true, ...p }) : m.k === 'clan' ? actor('clan', t, p, { arms: false }) : actor(m.k, t, p, { arms: false, energy: 1.2 });
  }
  return out;
}
function bossW(t, o = {}) { return actor('boss', t, { x: BOSS.x, y: BOSS.y, s: BOSS.s, t, ...o }, { arms: false }); }
const domeW = (t, o = {}) => G.shieldDome({ ...DOME, t, ...o });
function battleFrame(t, cam, o = {}, chars = '', over = '') {
  let w = '';
  if (o.boss !== false) w += bossW(t, o.bossPose || {}) + (o.dome === false ? '' : domeW(t, o.domeO || {}));
  w += o.back || '';
  w += crowd(t, o.mode || 'fight', o.crowd || {});
  w += chars;
  return towerFrame(t, cam, { set: o.set || {}, tw: o.tw }, w, over);
}
// game chat window (bottom-left) for the chant
function chat(t, o = {}) {
  const lines = [
    { user: 'PizzaKid', text: 'wait... is that the hot dog??', at: C.watch + 0.2 },
    { user: 'ObbyQueen', text: 'HE JUMPED', at: C.watch + 0.6 },
    { user: 'NoodleBoi', text: 'JUMP DAD!!', at: B.chant[0] },
    ...(o.lines || []),
  ];
  return G.chatLog({ x: o.x ?? 34, y: o.y ?? 600, w: o.w ?? 560, h: o.h ?? 300, t, lines, flood: o.flood || 0, floodSet: 'jump', floodN: 60, k: o.k ?? 1, s: o.s ?? 0.9 });
}

// ================================================================ the real living room (night, game night)
const gameScreen = (w, h) => S.rect(0, 0, w, h, 0, { fill: '#2A1A5E' }) + S.circle(w * 0.78, h * 0.25, h * 0.12, { fill: '#FFF4D0' }) + S.rect(w * 0.45, h * 0.1, w * 0.1, h, 0, { fill: '#5B3FA8' }) +
  S.rect(w * 0.32, h * 0.55, w * 0.14, h * 0.06, 3, { fill: '#3BD16F' }) + S.rect(w * 0.55, h * 0.35, w * 0.14, h * 0.06, 3, { fill: '#FF6FB5' }) + S.rect(w * 0.37, h * 0.42, w * 0.035, h * 0.13, 4, { fill: '#E8453C' }) + S.rect(0, h * 0.88, w, h * 0.12, 0, { fill: '#FF6A1F' });
function living(t, cam, o = {}) {
  const Ly = H.livingRoom.layers(t, { time: 'night', glow: 'all', glowK: o.glowK ?? 1, chair: o.chair || 'back', pcScreen: gameScreen, tvScreen: gameScreen });
  let out = view(cam, Ly.bg, 0.8) + view(cam, Ly.mid);
  const youP = o.chair === 'front' ? H.seatPose(LR.seats.you, 1, { legL: 90, legR: 90, kneeL: 90, kneeR: 90, headset: true, ...(o.you || {}) }) : H.seatPose(LR.seats.you, 1, { view: 'back', headset: true, ...(o.you || {}) });
  let seated = o.you === false ? '' : actor('you', t, youP, { arms: !(o.you && o.you.armL !== undefined) });
  seated += actor('dad', t, H.seatPose(LR.seats.dad, 1.1, { glasses: 'on', ...(o.dad || {}) }), { arms: false, energy: 1 });
  if (!o.momStand) seated += actor('mom', t, H.seatPose(LR.seats.mom, 1.04, { pajamas: true, cup: false, headset: true, ...(o.mom || {}) }), { arms: false, energy: 1 });
  else seated += actor('mom', t, { x: LR.seats.mom.x, y: 744, s: 0.5, pajamas: true, cup: false, headset: true, ...o.momStand }, { arms: false, energy: 1.4 });
  if (o.granny !== false) seated += actor('grandma', t, H.seatPose(LR.seats.grandma, 0.9, { curlers: true, phone: 'arm', ...(o.granny || {}) }), { arms: false });
  out += view(cam, seated + (o.seatedOver || '')) + view(cam, Ly.front);
  let dev = X.laptopOld({ x: LR.devices.laptop.x + (o.laptopDx || 0), y: o.laptopY ?? 850, s: 0.5, face: 'lid', rot: o.laptopRot || 0 });
  if (!o.momStand) dev += X.tablet({ ...LR.devices.tablet, y: 760, face: 'back', landscape: true, rot: o.tabletRot || 0 });
  else dev += X.tablet({ x: 1300, y: 744, s: 0.5, face: 'back', landscape: true, rot: -12 });
  out += view(cam, dev) + view(cam, Ly.table) + view(cam, o.standing || '') + view(cam, Ly.fg, 1.2) + view(cam, Ly.light);
  return out + (o.over || '');
}
// the keyboard close-up with Dad's hand
function keys(t, cam, o = {}) {
  const Ly = H.keyboardClose.layers(t, { time: 'night', jumpLabel: true, glow: 1, press: o.press ? { key: 'SPACE', k: o.press } : undefined, highlight: o.highlight, crumbs: true });
  const sp = KB.space;
  const tip = o.tip || [sp.x + 70, sp.y - 150];
  const hand = E.dadHand(tip[0], tip[1], { s: 1.15, press: o.press || 0, t, shake: o.shake ?? 0.6 });
  return E.roll(cam, view(cam, Ly.bg, 0.6) + view(cam, Ly.mid + Ly.front + (o.under || '') + hand + (o.over || '') + Ly.fg + Ly.light));
}

// ================================================================ SHOTS
// 1 — "Dad." The hot dog at the foot of the tower, low close-up, looking up (continues SC 10's tilt up)
function shotDad(t) {
  const u = seg(t, C.dad, C.replay);
  const cam = camLerp(camAt(640, 640, 1.85, 1060, 560), camAt(620, 610, 2.15, 1040, 560), u);
  const gulp = bump(t, C.dad + 0.45, C.dad + 0.75);
  const d = actor('dadAvatar', t, { x: SP.base.x, y: SP.base.y, s: 0.36, t, turn: 0.6, headRot: -5, sy: 1 - 0.04 * gulp, nametag: false, armL: 12, armR: 18,
    face: { name: 'determined', eyes: { look: [0.6, -0.9] }, fx: gulp > 0.2 ? ['sweat'] : [] } }, { arms: false });
  return towerFrame(t, cam, {}, d) + whip(t, C.dad, 'up', 0.1);
}
// 2 — "The man who couldn't jump." A grey REPLAY: walking into the wall (BONK) ... and the splash
function replayFX(t, label = 'REPLAY') {
  let o = R.greyWash(1, { dark: 0.12 }) + K.C.vhs(t, '', 0.9);
  o += S.g(S.path('M0 -26 L-30 0 L0 26 Z M34 -26 L4 0 L34 26 Z', ol('#FFFFFF', 4)) + TF(label, 56, 18, 52, '#FFFFFF', { 'text-anchor': 'start', stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' }), 'translate(120 110)');
  if (Math.floor(t * 2.5) % 2) o += S.circle(96, 110, 14, { fill: '#FF3B4E' });
  return o;
}
function shotReplay(t) {
  if (t < C.splash) {
    const Ly = GS.plaza.layers(t, GS.SPOTS.plaza.cams.wall, { time: 'day' });
    const wd = GS.SPOTS.plaza.wall.dad;
    const cam = GS.SPOTS.plaza.cams.wall;
    const bk = bump(t, B.bonk, B.bonk + 0.2);
    const cyc = AC.walk(t * 11, 1);
    const d = actor('dadAvatar', t, { ...wd, t, ...cyc, x: wd.x - 14 * bk, rot: -6 * bk, sx: 1 - 0.08 * bk, face: { name: 'determined', mouth: 'line' }, nametag: false }, { arms: false });
    let o = Ly.bg + Ly.mid + view(cam, d) + Ly.front + Ly.fg + Ly.light;
    const [bx, by] = toScr(cam, GS.SPOTS.plaza.wall.x0, 600);
    o += view(cam, '') + G.hitSpark({ x: bx, y: by, age: t - B.bonk, s: 1.2, text: 'BONK!' });
    o += G.timerHUD({ x: 960, y: 210, sec: 3 * 3600 + 12 * 60 + 45 + (t - C.replay), t, label: 'TIME', s: 1.2 });
    return o + replayFX(t, '3 HOURS EARLIER') + whip(t, C.replay, 1, 0.1);
  }
  // the splash: off the start block, straight down into the water
  const P = GS.SPOTS.plaza;
  const cam = camAt(3000, 700, 1.15);
  const Ly = GS.plaza.layers(t, cam, { time: 'day' });
  const u = seg(t, C.splash, B.splash);
  const x = lerp(P.start.edge - 40, P.gap.mid, ease.out(u)), y = lerp(P.start.y, P.water.y + 240, ease.in(u)) - 90 * Math.sin(Math.PI * Math.min(1, u * 1.6));
  let d = t < B.splash + 0.05 ? actor('dadAvatar', t, { x, y, s: 0.4, t, view: 'side', flip: true, armL: 170, armR: 160, legL: -20, legR: 30, rot: 20 * u, nametag: false, face: { name: 'scared', mouth: 'scream' } }, { arms: false }) : '';
  let o = Ly.bg + Ly.mid + view(cam, d) + Ly.front + view(cam, R.foamSplash(P.water.splash.x, P.water.splash.y, t - B.splash, { s: 1.4, n: 16, seed: 4 })) + Ly.fg + Ly.light;
  o += replayFX(t, 'REPLAY');
  o += K.bang('SPLASH!', 1180, 330, seg(t, B.splash, B.splash + 0.15), 110, -8, '#7FD8FF');
  o += G.stamp({ text: "CAN'T JUMP", k: seg(t, B.splash + 0.08, B.splash + 0.4), x: 640, y: 420, s: 0.9, rot: -10, col: '#FF3B4E' });
  return o + flashAt(t, C.splash, 0.08, 0.6);
}
// 3 — the beat: back at the foot; he looks all the way up (the tower disappears into the night)
function shotLook(t) {
  const u = seg(t, C.look, C.vs);
  const cam = camLerp(camAt(900, 650, 0.8), camAt(960, 560, 0.74), u);
  const d = actor('dadAvatar', t, { x: SP.base.x, y: SP.base.y, s: 0.36, t, turn: 0.5, headRot: -6, nametag: false, face: { name: 'nervous', eyes: { look: [0.8, -1] }, fx: ['sweat'] } }, { arms: false });
  return towerFrame(t, cam, {}, d) + whip(t, C.look, -1, 0.1);
}
// 4 — "Versus": the fighting-game VS card
function shotVS(t) {
  const k = seg(t, C.vs, C.vs + 0.75);
  const hot = actor('dadAvatar', t, { x: 470, y: 1230, s: 0.66, t, turn: 0.3, armL: 120 + 10 * Math.sin(t * 6), armR: 40, lean: 3, nametag: false, volume: false, face: { name: 'determined' } }, { arms: false });
  let o = E.vsCard(t, k, { hotdog: hot, tower: E.vsTower(t) });
  o = K.shaken(t, B.vs + 0.12, o, 0.3, 16);
  return o + flashAt(t, B.vs + 0.12, 0.12, 0.6);
}
// 5 — "one hundred floors of obby": whip-tilt up the whole tower, the counter rolls 1 -> 100, the crystal on top
function shotTilt(t) {
  const u = seg(t, C.tilt, B.top);
  const yb = FL(1).y - 300, yt = TOPY - 260;
  const k = ease.inOut(u);
  const z = lerp(0.5, 0.42, bump(u, 0, 1)) + 0.25 * ease.out(seg(t, B.top, C.real));
  const cy = lerp(yb, yt, k);
  const cam = camAt(lerp(1100, 1500, k), cy, z);
  const n = clamp(Math.round((SP.floors[0].y - (cy + 300)) / 210) + 1, 1, 100);
  const vel = Math.sin(Math.PI * u);
  let w = crystalW(t);
  let o = towerFrame(t, cam, { tw: t }, w);
  o += E.vStreaks(t, vel, 3);
  const tk = seg(t, B.top, B.top + 0.3);
  o += E.floorHUD(t, u >= 1 ? 100 : n, { bump: tk, s: 1.05 });
  if (tk > 0) { const [px, py] = toScr(cam, CRY.x, CRY.y - 260); o += K.bang('100', px, py - 30, tk, 160, -6, '#FFD21F') + K.C.burst(px, py + 120, seg(t, B.top, B.top + 0.5), '#7FF6FF'); }
  return o + whip(t, C.tilt, 'up', 0.12);
}
// 6 — the real Dad: glasses on, tongue out, sweating; Mom and Granny lean in
function shotReal(t) {
  const u = seg(t, C.real, C.keys);
  const cam = camLerp({ zoom: 1.32, x: 300, y: -40 }, { zoom: 1.55, x: 150, y: -70 }, u);
  const wig = Math.sin(t * 14);
  const o = living(t, cam, {
    laptopY: 880,
    dad: { face: { name: 'nervous', mouth: 'tongue', eyes: { look: [0, 0.6] }, fx: ['sweat', 'sweat2'] }, armL: 34 + 6 * wig, armR: 34 - 6 * wig, headY: 4 },
    mom: { turn: -0.55, rot: -7, armL: 40, armR: 44, face: { name: 'scared', eyes: { look: [-0.9, 0.3] } } },
    granny: { turn: -0.6, rot: -6, face: { name: 'shocked', eyes: { look: [-0.9, 0.2] } } },
  });
  return o + whip(t, C.real, 1, 0.1);
}
// 7 — "Space..." the finger hovers over the JUMP! space bar, sweat drips; "bar." PRESS (smash zoom)
function shotKeys(t) {
  const sp = KB.space;
  const u = seg(t, C.keys, B.press);
  const pr = seg(t, B.press - 0.04, B.press + 0.06) * (1 - seg(t, B.press + 0.25, B.press + 0.4));
  const smash = ease.out(seg(t, B.press - 0.04, B.press + 0.06));
  let cam = camLerp(camAt(sp.x + 40, sp.y - 120, 1.25), camAt(sp.x + 40, sp.y - 70, 1.6), u);
  cam = { ...cam, zoom: cam.zoom + 0.55 * smash };
  cam = shook(cam, t, [[B.press, 0.3, 18]]);
  const hover = lerp(-260, -130, ease.inOut(seg(t, C.keys, C.keys + 0.5)));
  const tip = [sp.x + 70 + 8 * Math.sin(t * 3), sp.y + lerp(hover, -18, ease.in(seg(t, B.press - 0.12, B.press)))];
  const drops = E.sweatDrops(t, C.keys, [[sp.x - 160, sp.y - 10, 0.35], [sp.x + 240, sp.y + 4, 0.8], [sp.x - 20, sp.y - 6, 1.15]]);
  let o = keys(t, cam, { tip, press: pr, under: drops, shake: 1 - smash, highlight: t > B.press - 0.3 ? 'SPACE' : undefined });
  const [px, py] = toScr(cam, sp.x, sp.y);
  o += focusLines(px, py, smash * (1 - seg(t, B.press + 0.15, B.press + 0.3)), 4);
  o += K.bang('CLICK!', px + 330, py - 260, seg(t, B.press, B.press + 0.12) * (1 - seg(t, C.jump1 - 0.08, C.jump1)), 90, 8, '#FFFFFF');
  return o + flashAt(t, B.press, 0.1, 0.5) + whip(t, C.keys, -1, 0.1);
}
// 8 — "He jumped." base -> floor 1: he LANDS
function shotJump1(t) {
  const u = seg(t, C.jump1, C.gasp);
  const cam = shook(camLerp(camAt(860, 700, 1.12), camAt(980, 590, 1.25), u), t, [[B.land1, 0.25, 10]]);
  const st = dadState(t);
  let w = dadRoute(t) + landFX(t, st);
  let o = towerFrame(t, cam, {}, w);
  const [lx, ly] = toScr(cam, FL(1).x, FL(1).y - 430);
  const lk = seg(t, B.land1, B.land1 + 0.6);
  if (lk > 0 && lk < 1) o += K.C.burst(lx, ly, lk, '#FFE14D') + K.sparkles([[lx - 150, ly - 60, 34 * (1 - lk)], [lx + 160, ly - 20, 28 * (1 - lk)]], t);
  o += K.bang('!!!', lx + 230, ly + 40, seg(t, B.land1, B.land1 + 0.12), 120, 10, '#FFD21F');
  return o + hud(t, { k: seg(t, B.land1 - 0.1, B.land1 + 0.2) }) + whip(t, C.jump1, 1, 0.1);
}
// 9 — the gasp: the fighters freeze and turn (jaws drop)
function shotGasp(t) {
  const nd = memberBy('noodle');
  const cam = camLerp(camAt(nd.x - 60, 700, 1.25), camAt(nd.x - 40, 690, 1.38), seg(t, C.gasp, C.again));
  const o = battleFrame(t, cam, { mode: 'watch', crowd: { t0: C.gasp - 0.1 }, boss: false });
  const [bx, by] = toScr(cam, -540, 560);
  return o + G.chatBubble({ x: bx, y: by, t, text: 'HE JUMPED?!', user: 'PizzaKid', k: seg(t, C.gasp + 0.05, C.gasp + 0.3), size: 40 }) + whip(t, C.gasp, -1, 0.08);
}
// 10 — "He jumped again." floors 1 -> 2 -> 3, the camera rides up with him
function shotAgain(t) {
  const cam = camFollow(t, 1.0, 960, 660, 0.3, C.again);
  const st = dadState(t);
  const pump = st.floor === 3 && !st.air ? bump(st.landAge, 0.05, 0.45) : 0;
  let w = dadRoute(t, pump > 0 ? { armR: 40 + 120 * pump, face: { name: 'joy' } } : {}) + landFX(t, st);
  let o = towerFrame(t, cam, {}, w);
  return o + hud(t) + whip(t, C.again, 'up', 0.08);
}
// 11 — "He slipped... and didn't fall." icy floor 7: slide to the edge, windmill, teeter... catch
function slipState(t) {
  const st = dadState(t);
  if (t < B.slip) return { st, pose: {} };
  const p = FL(7);
  const sl = ease.out(seg(t, B.slip, B.slip + 0.55));
  const x = lerp(p.x - 20, p.x0 + 4, sl);
  const tee = seg(t, B.slip + 0.4, B.catch), ok = ease.outBack(seg(t, B.catch, B.catch + 0.35));
  const wob = Math.sin((t - B.slip) * 13) * (1 - ok);
  const rot = (-18 - 10 * wob) * seg(t, B.slip + 0.3, B.slip + 0.55) * (1 - ok);
  return { st, x: lerp(x, p.x0 + 40, ok), y: p.y, rot, wob, ok, tee,
    pose: { view: ok > 0.5 ? 'front' : 'side', flip: false, armL: ok > 0.5 ? 20 + 130 * bump(t, B.catch + 0.1, B.catch + 0.9) : 120 + 60 * Math.sin((t - B.slip) * 16), armR: ok > 0.5 ? 20 : 100 + 70 * Math.sin((t - B.slip) * 16 + 2),
      legL: ok > 0.5 ? 0 : -30 - 15 * wob, legR: ok > 0.5 ? 0 : 22, kneeL: ok > 0.5 ? 0 : 30, rot, nametag: false,
      face: ok > 0.5 ? { name: 'happy', eyes: { type: 'closed' }, fx: ['sweat'] } : { name: 'scared', mouth: 'scream', fx: ['sweat2'] } } };
}
function shotSlip(t) {
  const S7 = slipState(t);
  const p = FL(7);
  let cam = t < B.slip ? camFollow(t, 1.2, 960, 640, 0.2, C.slip) : camLerp(camAt(p.x + 30, p.y - 150, 1.35, 1000, 620), camAt(p.x - 10, p.y - 140, 1.55, 1000, 600), seg(t, B.slip, B.catch));
  cam = { ...cam, rot: t < B.catch ? -3 * seg(t, B.slip, B.slip + 0.4) + 1.5 * (S7.wob || 0) : -3 * (1 - seg(t, B.catch, B.catch + 0.3)) };
  let w;
  if (t < B.slip) w = dadRoute(t);
  else w = actor('dadAvatar', t, { x: S7.x, y: S7.y, s: 0.3, t, ...S7.pose }, { arms: false }) + puff(S7.x + 20, p.y + 4, t - B.slip);
  // ice sparkles under the feet while sliding
  let o = towerFrame(t, cam, {}, w);
  if (t > B.slip && t < B.slip + 0.6) { const [sx, sy] = toScr(cam, S7.x + 30, p.y); o += K.sparkles([[sx, sy, 26], [sx + 60, sy - 10, 18]], t); }
  o += K.bang('SKRRT!', 1360, 300, seg(t, B.slip, B.slip + 0.12) * (1 - seg(t, B.slip + 0.9, B.slip + 1.1)), 96, 8, '#BFF2FF');
  o += K.bang('PHEW!', 760, 280, seg(t, B.catch + 0.05, B.catch + 0.2), 96, -8, '#FFFFFF');
  return o + hud(t, { n: t < B.slip ? 6 : 7 }) + whip(t, C.slip, 'up', 0.1);
}
// 12 — checkpoint 10: the flag + "Checkpoint saved"
function shotCP10(t) {
  const p = FL(10);
  const cam = camLerp(camFollow(t, 1.05, 960, 640, 0.25, C.cp10), camAt(p.x, p.y - 140, 1.15, 960, 620), seg(t, B.land10, C.watch));
  const st = dadState(t);
  const pump = !st.air && st.floor === 10 ? bump(st.landAge, 0, 0.5) : 0;
  let w = dadRoute(t, pump > 0 ? { armL: 20 + 140 * pump, armR: 20 + 140 * pump, face: 'joy' } : {}) + landFX(t, st);
  let o = towerFrame(t, cam, {}, w);
  const [fx, fy] = toScr(cam, p.x, p.y);
  const sk = seg(t, B.land10, B.land10 + 0.8);
  if (sk > 0) o += R.saveWave(sk, { x: fx });
  o += R.savedToast(70, 860, seg(t, B.land10, B.land10 + 0.35), { t, text: 'Checkpoint 10 saved', size: 40 });
  return o + hud(t) + whip(t, C.cp10, 'up', 0.08);
}
// 13 — the whole server stops fighting and watches; Noodle starts the chant (push in)
function shotWatch(t) {
  const nd = memberBy('noodle');
  const u = seg(t, C.watch, C.noodle);
  const wide = camAt(-380, 560, 0.6), close = camAt(nd.x + 40, 700, 1.05, 900, 560);
  const cam = camLerp(wide, close, seg(t, B.chant[0] - 0.4, C.noodle + 0.05));
  const mode = (m) => (m.k === 'noodle' && t > B.chant[0] - 0.15 ? 'chant' : 'watch');
  const bossPose = { pose: 'idle', face: { name: t > C.watch + 0.4 ? 'shocked' : 'angry' } };
  let o = battleFrame(t, cam, { mode, crowd: { t0: C.watch + 0.05 }, bossPose });
  const [nx, ny] = toScr(cam, nd.x, nd.y - 1158 * SP.sAt(nd.y) - 30);
  o += G.chatBubble({ x: nx, y: ny, t, ...G.chatLine(t, '11.3', { to: 1, hold: 0.4 }), text: 'Jump, Dad!', s: 0.9 });
  // a tiny question mark over the Block King
  const [qx, qy] = toScr(cam, BOSS.x + 120, BOSS.y - 1450);
  if (t > C.watch + 0.5) o += K.bang('?', qx, qy, seg(t, C.watch + 0.5, C.watch + 0.7), 120, 10, '#FFFFFF');
  o += chat(t, { k: seg(t, C.watch, C.watch + 0.3), x: 1330, y: 170 });
  return o + whip(t, C.watch, -1, 0.1);
}
// 14 — "Jump, Dad!" #2: Noodle + the players next to him join in, fists on the beat
function shotNoodle(t) {
  const nd = memberBy('noodle');
  const cam = shook(camLerp(camAt(nd.x - 60, 690, 1.35, 960, 560), camAt(nd.x - 40, 680, 1.5, 960, 560), seg(t, C.noodle, C.climb2)), t, [[B.chant[2], 0.15, 6], [B.chant[3], 0.2, 8]]);
  const mode = (m) => (m.k === 'noodle' || m.k === 'player' || m.k === 'grandmaAvatar' ? 'chant' : 'watch');
  let o = battleFrame(t, cam, { mode, crowd: { t0: C.watch + 0.05 }, boss: false });
  const [nx, ny] = toScr(cam, nd.x, nd.y - 1158 * SP.sAt(nd.y) - 30);
  o += G.chatBubble({ x: nx, y: ny, t, text: 'Jump, Dad!', typed: G.chatSync(t, '11.3', { from: 2 }), k: seg(t, C.noodle, C.noodle + 0.2), out: seg(t, L(3).b + 0.5, L(3).b + 0.8), user: 'NoodleBoi', s: 0.95 });
  o += K.bang('JUMP!', 1500, 300, seg(t, B.chant[2], B.chant[2] + 0.1) * (1 - seg(t, B.chant[3] - 0.05, B.chant[3])), 120, 8, '#FFD21F');
  o += K.bang('DAD!', 1540, 320, seg(t, B.chant[3], B.chant[3] + 0.1), 140, -6, '#FF8A2B');
  return o + whip(t, C.noodle, 1, 0.08);
}
// 15 — montage: floors 21 -> 25, whip, 37 -> 41 (the chat floods JUMP DAD)
function shotClimb2(t) {
  const cam = camFollow(t, 0.95, 960, 640, 0.2, t >= C.climb2b ? C.climb2b : C.climb2);
  const st = dadState(t);
  let o = towerFrame(t, cam, {}, dadRoute(t) + landFX(t, st));
  o += chat(t, { flood: seg(t, C.climb2, C.chant + 1.2) * 0.6, lines: [{ user: 'Kitty4Ever', text: 'JUMP DAD!', at: B.chant[2] }, { user: 'CubeKid9', text: 'JUMP DAD', at: B.chant[3] }] });
  return o + hud(t) + whip(t, C.climb2, 'up', 0.08) + whip(t, C.climb2b, 'up', 0.1);
}
// 16 — "...started chanting." EVERYONE: fists on the beat, the chat at full flood, JUMP! DAD! in the sky
function shotChant(t) {
  const u = seg(t, C.chant, C.climb3);
  const cam = camLerp(camAt(-420, 700, 0.8), camAt(-380, 650, 0.88), u);
  const bossPose = { pose: 'idle', face: { name: 'shocked', eyes: { look: [0.8, -0.2] } } };
  let o = battleFrame(t, cam, { mode: 'chant', bossPose, set: { lava: 1 } });
  const beat = (t * 1.85) % 1, bi = Math.floor(t * 1.85);
  if (beat < 0.5) o += K.bang(bi % 2 ? 'DAD!' : 'JUMP!', 960 + (bi % 2 ? 260 : -220), 250 + (bi % 3) * 20, seg(beat, 0, 0.12) * (1 - seg(beat, 0.38, 0.5)), 150, bi % 2 ? 7 : -7, bi % 2 ? '#FF8A2B' : '#FFD21F');
  o += chat(t, { flood: lerp(0.6, 1, u), x: 1330, y: 170, lines: [{ user: 'Kitty4Ever', text: 'JUMP DAD!', at: B.chant[2] }] });
  return o + whip(t, C.chant, -1, 0.1);
}
// 17 — montage: 57 -> 60 checkpoint above the clouds
function shotClimb3(t) {
  const cam = camFollow(t, 0.9, 960, 660, 0.25, C.climb3);
  const st = dadState(t);
  let o = towerFrame(t, cam, {}, dadRoute(t) + landFX(t, st));
  const cp = HOPS.find((h) => h.b === 60);
  if (cp) o += R.savedToast(70, 860, seg(t, cp.t1, cp.t1 + 0.35), { t, text: 'Checkpoint 60 saved', size: 40 });
  return o + hud(t) + whip(t, C.climb3, 'up', 0.1);
}
// 18 — DarkBlade: "Jump, Mister Hot Dog!" (chat bubble: no mouth), sword pumping, the clan behind
const DBM = () => memberBy('darkblade');
const DBY = 1004;
function darkFrame(t, cam, smash = 0) {
  const db = DBM();
  const mode = (m) => (m.k === 'darkblade' || m.k === 'clan' || m.k === 'player' ? 'chant' : 'watch');
  const pu = chantPump(t, 0.4);
  const over = { darkblade: { y: DBY, armR: smash > 0 ? lerp(130, 178, smash) : 120 + 50 * pu, swordRot: smash > 0 ? 0 : undefined, swordGlow: 0.4 + 0.6 * smash, lift: 0, turn: 0.2, volume: false } };
  const filter = (m) => m.k === 'darkblade' || m.k === 'clan' || (m.k === 'player' && m.y < 900) || m.k === 'grandmaAvatar';
  let o = battleFrame(t, cam, { mode, crowd: { t0: C.watch + 0.05, over, filter }, boss: false });
  const [bx, by] = toScr(cam, db.x + 20, DBY - 1018 * SP.sAt(DBY) - 40);
  o += G.chatBubble({ x: bx, y: by, t, ...G.chatLine(t, '11.5', { hold: 0.6 }), user: 'xX_DarkBlade_Xx', s: 0.95, tail: 0.3, caps: smash > 0 });
  return o;
}
function shotDark(t) {
  const db = DBM();
  const cam = camLerp(camAt(db.x + 40, 720, 1.5, 960, 600), camAt(db.x + 30, 710, 1.65, 960, 600), seg(t, C.dark, C.dark2));
  return darkFrame(t, cam) + whip(t, C.dark, 1, 0.08);
}
function shotDark2(t) {
  const db = DBM();
  const sm = ease.out(seg(t, B.darkJump - 0.06, B.darkJump + 0.06));
  const cam = shook({ ...camAt(db.x + 20, 680, 1.65 + 0.75 * sm, 960, 600) }, t, [[B.darkJump, 0.35, 16]]);
  let o = darkFrame(t, cam, sm);
  o += focusLines(960, 500, sm * (1 - seg(t, B.darkJump + 0.3, B.darkJump + 0.6)), 7, '#FF4B5C');
  o += K.bang('JUMP!!', 1450, 300, seg(t, B.darkJump, B.darkJump + 0.12), 170, 8, '#FF4B5C');
  return o + flashAt(t, B.darkJump, 0.1, 0.5, '#FFD0D6');
}
// 19 — icy floor 88: lands, slides to the edge: "No no no no no..." (CAPS chat over him)
function wobState(t) {
  const p = FL(88);
  if (t < B.land88) return null;
  const sl = ease.out(seg(t, B.land88, B.land88 + 0.6));
  const ok1 = seg(t, B.okay1, B.okay1 + 0.6), ok2 = ease.outBack(seg(t, B.okay2, B.okay2 + 0.45)), ok3 = seg(t, B.okay3, B.okay3 + 0.3);
  const wob = Math.sin((t - B.land88) * 12) * (1 - 0.6 * ok1) * (1 - ok2);
  const x = lerp(lerp(p.x + 10, p.x1 + 6, sl), p.x + 20, ok2);
  const rot = (14 + 10 * wob) * seg(t, B.land88 + 0.3, B.land88 + 0.6) * (1 - ok2);
  const flail = 1 - ok2;
  return { x, y: p.y, rot, wob, ok2, ok3,
    pose: { view: ok2 > 0.5 ? 'front' : 'side', flip: true, rot, armL: ok2 > 0.5 ? 20 + 8 * Math.sin(t * 20) : 120 + 60 * Math.sin((t - B.land88) * 17), armR: ok2 > 0.5 ? (ok3 > 0 ? 20 + 130 * ok3 : 24) : 100 + 70 * Math.sin((t - B.land88) * 17 + 2),
      legL: ok2 > 0.5 ? 0 : 28 + 12 * wob, kneeL: ok2 > 0.5 ? 0 : 20, legR: ok2 > 0.5 ? 0 : -10, nametag: false, sy: ok2 > 0.5 ? 1 - 0.05 * Math.abs(Math.sin(t * 20)) : 1,
      face: ok2 > 0.5 ? { name: ok3 > 0 ? 'happy' : 'nervous', fx: ['sweat', 'sweat2'] } : { name: 'scared', fx: ['sweat2'] } } };
}
function dadWob(t) {
  const W = wobState(t);
  if (!W) return dadRoute(t);
  return actor('dadAvatar', t, { x: W.x, y: W.y, s: 0.3, t, ...W.pose }, { arms: false });
}
function capsChat(t, cam, x, y, part) {
  const [bx, by] = toScr(cam, x, y);
  const opts = part === 1 ? { to: 4 } : { from: 5 };
  const text = part === 1 ? 'NO NO NO NO NO...' : 'OKAY. OKAY! I\'M OKAY!';
  const l = L(6);
  const k = part === 1 ? seg(t, l.a - 0.25, l.a) : seg(t, B.okay1 - 0.25, B.okay1);
  return G.chatBubble({ x: bx, y: by, t, caps: true, text, typed: G.chatSync(t, '11.6', opts), k, out: part === 1 ? seg(t, C.realWob - 0.1, C.realWob) : seg(t, l.b + 0.4, l.b + 0.7), s: 0.85 });
}
function shotWobble(t) {
  const p = FL(88);
  const W = wobState(t);
  let cam = camLerp(camFollow(t, 1.25, 900, 640, 0.15, C.wobble), camAt(p.x1 - 60, p.y - 140, 1.45, 880, 620), seg(t, B.land88, B.land88 + 0.4));
  cam = { ...cam, rot: W ? 4 + 2 * W.wob : 0 };
  let o = towerFrame(t, cam, {}, dadWob(t));
  o += capsChat(t, cam, W ? W.x : p.x, p.y - 420, 1);
  return o + hud(t, { n: t < B.land88 ? 87 : 88 }) + whip(t, C.wobble, 'up', 0.08);
}
// 20 — real Dad leaning hard right with the laptop (body english) — Mom and Granny lean too
function shotRealWob(t) {
  const u = seg(t, C.realWob, C.okay);
  const lean = ease.out(seg(t, C.realWob, C.realWob + 0.3)) * (1 + 0.15 * Math.sin(t * 9));
  const cam = camLerp({ zoom: 1.35, x: 260, y: -40 }, { zoom: 1.45, x: 260, y: -50, rot: 2 }, u);
  const o = living(t, cam, {
    laptopY: 870, laptopRot: 14 * lean, laptopDx: 30 * lean,
    dad: { rot: 13 * lean, armL: 40, armR: 40, face: { name: 'scared', fx: ['sweat', 'sweat2'] } },
    mom: { rot: 11 * lean, turn: -0.3, armL: 60, armR: 30, face: { name: 'scared', mouth: 'O' } },
    granny: { rot: 9 * lean, turn: -0.4, face: { name: 'scared', mouth: 'O' } },
    you: { rot: 8 * lean },
  });
  return E.roll(cam, o) + whip(t, C.realWob, 1, 0.08);
}
// 21 — "Okay. Okay! I'm okay!" teetering over the abyss, back onto the ice, a shaky thumbs-up
function shotOkay(t) {
  const p = FL(88);
  const W = wobState(t);
  let cam = camLerp(camAt(p.x1 - 40, p.y - 220, 1.2, 760, 600), camAt(p.x1 - 110, p.y - 210, 1.4, 820, 620), seg(t, C.okay, C.gap));
  cam = { ...cam, rot: W ? -3 - 3 * W.wob * (1 - W.ok2) : 0 };
  let o = towerFrame(t, cam, {}, dadWob(t));
  o += capsChat(t, cam, W ? W.x : p.x, p.y - 420, 2);
  if (W && W.ok3 > 0) { const [tx, ty] = toScr(cam, W.x + 70, p.y - 330); o += K.sparkles([[tx, ty, 26 * W.ok3]], t); }
  return o + hud(t, { n: 88 }) + whip(t, C.okay, -1, 0.08);
}
// 22 — floor 99: he lands and looks at THE FINAL GAP; pull back to reveal the summit, the crystal, the moon
function shotGap(t) {
  const u = ease.inOut(seg(t, B.land99, C.you));
  const p = FL(99);
  const cam = camLerp(camAt(520, p.y - 170, 1.05, 960, 640), camAt(720, p.y - 160, 0.62, 960, 600), u, (x) => x);
  const st = dadState(t);
  const d = st.air ? dadRoute(t) : actor('dadAvatar', t, { x: p.x, y: p.y, s: 0.3, t, turn: 0.6, nametag: false, face: { name: 'nervous', eyes: { look: [0.9, -0.2] }, fx: ['sweat'] } }, { arms: false });
  let o = towerFrame(t, cam, {}, crystalW(t) + d + landFX(t, st));
  o += G.systemBanner({ theme: 'info', text: 'FINAL JUMP', sub: 'FLOOR 99 -> 100', k: seg(t, B.land99 + 0.1, B.land99 + 0.6), out: seg(t, C.you - 0.25, C.you), t, size: 66, y: 170 });
  return o + hud(t, { n: st.air ? 98 : 99 }) + whip(t, C.gap, 'up', 0.08);
}
// 23 — "JUMP, DAD, JUMP!" the hero at the foot of the tower, three smash-zooms
function shotYou(t) {
  const yu = memberBy('you');
  const steps = B.youW.map((w) => ease.out(seg(t, w - 0.04, w + 0.08)));
  const z = 1.45 + 0.28 * steps[0] + 0.28 * steps[1] + 0.32 * steps[2];
  const cam = shook(camAt(yu.x + 10, 740 - 50 * steps[2], z, 960, 620), t, B.youW.map((w) => [w, 0.22, 10]));
  const over = { you: { y: 1016, turn: 0.35, armR: 160, armL: 150, sword: false, face: { name: 'determined', eyes: { look: [0.6, -0.9] } }, volume: false, lift: 0 } };
  let o = battleFrame(t, cam, { mode: 'chant', crowd: { over }, boss: false });
  const [bx, by] = toScr(cam, yu.x, 1016 - 946 * SP.sAt(1016) - 70);
  o += G.chatBubble({ x: bx, y: by, t, caps: true, ...G.chatLine(t, '11.7', { hold: 0.3 }), s: 0.9, tail: -0.4 });
  const fk = Math.max(...steps.map((s_, i) => s_ * (1 - seg(t, B.youW[i] + 0.15, B.youW[i] + 0.35))));
  o += focusLines(960, 520, fk, 11, '#FFD21F');
  return o + whip(t, C.you, -1, 0.1);
}
// 24 — "For my..." the hot dog's face at the edge; wind; letterbox slides in
const LB = (t) => seg(t, C.son1, C.son1 + 0.5) * (1 - seg(t, C.no - 0.05, C.no + 0.15));
function windStreaks(t, k = 1) {
  let d = '';
  for (let i = 0; i < 14; i++) { const y = 160 + hash(i * 3.3) * 760, x = ((t * 1400 * (0.7 + hash(i)) + hash(i * 7.1) * 2400) % 2400) - 300; d += `M${f(x)} ${f(y)} q60 -10 140 0`; }
  return S.path(d, ln(5, '#FFFFFF', 0.35 * k));
}
function shotSon1(t) {
  const p = FL(99);
  const u = seg(t, C.son1, C.son2);
  const cam = camLerp(camAt(p.x + 30, p.y - 290, 2.4, 900, 560), camAt(p.x + 34, p.y - 300, 2.7, 900, 560), u);
  const d = actor('dadAvatar', t, { x: p.x + 60, y: p.y, s: 0.3, t, turn: 0.55, nametag: false, volume: false, face: { name: 'determined', eyes: { look: [0.9, -0.1] } }, armL: 20, armR: 26 }, { arms: false, energy: 0.3 });
  return towerFrame(t, cam, {}, d) + windStreaks(t) + letterbox(LB(t));
}
// 25 — "...son." the real Dad whispering, Mom and Granny leaning in behind him
function shotSon2(t) {
  const u = seg(t, C.son2, C.press2);
  const cam = camLerp({ zoom: 2.15, x: 80, y: -110 }, { zoom: 2.35, x: 70, y: -120 }, u);
  const stand = actor('grandma', t, { x: 800, y: 845, s: 0.5, curlers: true, turn: 0.5, rot: 8, armL: 30, armR: 30, face: { name: 'scared', eyes: { look: [0.9, 0.2] } } }, { arms: false });
  const o = living(t, cam, {
    laptopY: 900,
    dad: { face: { name: 'determined', eyes: { look: [0, 0.5] }, fx: ['sweat', 'tears'] }, armL: 34, armR: 34 },
    mom: { x: 1250, turn: -0.6, rot: -12, armL: 40, armR: 44, face: { name: 'sad', eyes: { look: [-0.9, 0.2] } } },
    granny: false, standing: stand,
  });
  return o + letterbox(LB(t)) + whip(t, C.son2, -1, 0.08);
}
// 26 — the press (smash zoom on the space bar)
function shotPress2(t) {
  const sp = KB.space;
  const sm = ease.out(seg(t, B.press2 - 0.05, B.press2 + 0.05));
  const cam = shook(camAt(sp.x + 30, sp.y - 60, 1.7 + 0.7 * sm), t, [[B.press2, 0.3, 20]]);
  const tip = [sp.x + 60, sp.y + lerp(-160, -16, ease.in(seg(t, C.press2, B.press2)))];
  let o = keys(t, cam, { tip, press: sm, shake: 0, highlight: 'SPACE' });
  o += focusLines(960, 560, sm, 9);
  return o + letterbox(LB(t)) + flashAt(t, B.press2, 0.14, 0.9);
}
// 27 — THE LEAP: slow motion past a giant moon; he's short...
const LEAP = { a: { x: FL(99).x1 - 20, y: FL(99).y }, b: { x: EDGE.x - 36, y: EDGE.y + 252 }, apex: -20090 };
const slowU = (p) => (p < 0.18 ? lerp(0, 0.32, p / 0.18) : p < 0.82 ? lerp(0.32, 0.7, (p - 0.18) / 0.64) : lerp(0.7, 1, (p - 0.82) / 0.18));
function leapAt(t) {
  const p = seg(t, B.launch, B.grab), u = slowU(p);
  const cy = 2 * LEAP.apex - (LEAP.a.y + LEAP.b.y) / 2;
  const y = (1 - u) * (1 - u) * LEAP.a.y + 2 * (1 - u) * u * cy + u * u * LEAP.b.y;
  return { x: lerp(LEAP.a.x, LEAP.b.x, u), y, u, p };
}
function leapDad(t, o = {}) {
  const q = leapAt(t);
  const short = seg(q.u, 0.62, 0.8);
  const run = AC.run((t - B.launch) * 6, 0.7);
  return actor('dadAvatar', t, { x: q.x, y: q.y, s: 0.3, t, view: 'side', flip: true, ...run, armL: lerp(150, 175, short), armR: lerp(130, 172, short), rot: lerp(-4, 10, q.u), shadow: false, nametag: false,
    face: short > 0.3 ? { name: 'scared', mouth: 'scream' } : { name: 'determined', mouth: 'O' }, ...o }, { arms: false });
}
function shotLeap(t) {
  const q = leapAt(t);
  const tn = GS.tone({ night: 0.2 });
  const bigMoon = GS.moon(1500, 210, 330, tn);
  // the camera drifts with him; the apex passes in front of the big moon
  const cam = camLerp(camAt(560, -20150, 0.82, 1250, 520), camAt(900, -20000, 0.86, 1450, 560), q.p, (x) => x);
  let w = '';
  // a faint slow-mo trail
  for (let i = 3; i >= 1; i--) { const tt = t - i * 0.07; if (tt > B.launch) w += S.g(leapDad(tt, { face: 'determined' }), null, { opacity: f(0.12 * (4 - i)) }); }
  w += crystalW(t * 0.3) + leapDad(t);
  let o = towerFrame(t, cam, { tw: lerp(C.leap, t, 0.3), bgx: bigMoon, bgk: 0.02 }, w);
  o += letterbox(1);
  o += TF('SLOW-MO', 1780, 1040, 30, '#FFFFFF', { opacity: f(0.6 * (Math.floor(t * 3) % 2)), 'text-anchor': 'end' });
  return o + flashAt(t, C.leap, 0.12, 0.6);
}
// 28 — GRAB! fingertips on the summit's lip, dangling over the abyss
function hangPose(t, k = 0) {
  const kick = Math.sin((t - B.grab) * 14);
  return { x: EDGE.x - 36, y: EDGE.y + 252 - 230 * k, s: 0.3, t, view: 'side', flip: true, armL: 172, armR: 176 - 20 * k, legL: 20 * kick, legR: -20 * kick, kneeL: 30 + 20 * k, kneeR: 20, rot: 4 - 20 * k, shadow: false, nametag: false };
}
function shotGrab(t) {
  const cam = shook(camAt(EDGE.x - 20, EDGE.y + 60, 1.9, 900, 520), t, [[B.grab, 0.35, 22]]);
  let d;
  if (t < B.grab) d = leapDad(t);
  else d = actor('dadAvatar', t, { ...hangPose(t), face: { name: 'scared', mouth: 'O', fx: ['sweat2'] } }, { arms: false });
  let o = towerFrame(t, cam, { tw: lerp(C.leap, t, 0.3) }, crystalW(t * 0.3) + d);
  const [gx, gy] = toScr(cam, EDGE.x - 30, EDGE.y);
  o += G.hitSpark({ x: gx, y: gy, age: t - B.grab, s: 0.9, col: '#FFD21F' });
  o += K.bang('GRAB!', gx - 260, gy - 180, seg(t, B.grab, B.grab + 0.1), 120, -10, '#FFD21F');
  return o + letterbox(1) + flashAt(t, B.grab, 0.08, 0.5);
}
// 29 — he hauls himself up onto the summit
function shotPull(t) {
  const k = ease.inOut(seg(t, C.pull, B.up));
  const cam = camLerp(camAt(EDGE.x + 120, EDGE.y - 80, 1.45, 820, 560), camAt(EDGE.x + 200, EDGE.y - 140, 1.4, 820, 580), k);
  let d;
  if (k < 0.75) d = actor('dadAvatar', t, { ...hangPose(t, k), x: EDGE.x - 36 + 120 * k, face: { name: 'determined', mouth: 'teeth', fx: ['sweat'] } }, { arms: false });
  else d = actor('dadAvatar', t, { x: EDGE.x + 100, y: TOPY, s: 0.3, t, view: 'side', flip: true, armL: 40, armR: 60, lean: 6, nametag: false, sy: 0.92 + 0.08 * seg(k, 0.75, 1), face: { name: 'determined' } }, { arms: false });
  return towerFrame(t, cam, {}, crystalW(t, { crack: 0.1 }) + d) + letterbox(1);
}
// 30 — the run and the DIVE: the hot dog hits the crystal head-first -> it shatters, full-frame light
function diveAt(t) {
  const x0 = EDGE.x + 100;
  if (t < B.dive) { const u = seg(t, C.dive, B.dive); return { x: lerp(x0, x0 + 170, u), y: TOPY, rot: 6, run: true, u }; }
  const p = seg(t, B.dive, B.hit), u = p < 0.6 ? lerp(0, 0.75, p / 0.6) : lerp(0.75, 1, ease.out((p - 0.6) / 0.4));
  const a = { x: x0 + 170, y: TOPY }, b = { x: CRY.x - 70, y: CRY.y + 120 };
  const cy = 2 * (TOPY - 150) - (a.y + b.y) / 2;
  return { x: lerp(a.x, b.x, u), y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * cy + u * u * b.y, rot: lerp(30, 88, ease.out(u)), run: false, u };
}
function shotDive(t) {
  const hit = t >= B.hit;
  const zoomPunch = ease.out(seg(t, B.hit - 0.08, B.hit + 0.05));
  const cam = shook(camLerp(camAt(EDGE.x + 330, TOPY - 150, 1.35, 860, 600), camAt(CRY.x - 140, CRY.y + 40, 1.55, 900, 560), seg(t, C.dive, B.hit), ease.in), t, [[B.hit, 0.6, 30]]);
  cam.zoom += 0.3 * zoomPunch;
  const D = diveAt(t);
  let w = '';
  if (!hit) {
    w += crystalW(t, { crack: seg(t, B.dive, B.hit) * 0.95 });
    w += actor('dadAvatar', t, { x: D.x, y: D.y, s: 0.3, t, view: 'side', flip: true, ...(D.run ? AC.run(t * 16, 1) : { armL: 178, armR: 178, legL: -10, legR: 10 }), rot: D.rot, shadow: false, nametag: false, face: { name: 'determined', mouth: 'scream' } }, { arms: false });
  } else {
    w += actor('dadAvatar', t, { x: CRY.x - 200, y: TOPY, s: 0.3, t, view: 'side', flip: true, rot: -70 * (1 - seg(t, B.hit, B.hit + 0.4)), armL: 150, armR: 160, nametag: false, face: { name: 'dizzy' } }, { arms: false });
    w += G.crystalShatter({ x: CRY.x, y: CRY.y, age: t - B.hit, s: 0.8 });
  }
  let o = towerFrame(t, cam, { set: { burst: seg(t, B.hit, B.hit + 1.4) } }, w);
  o += K.bang('CRACK!', 1300, 300, seg(t, B.hit - 0.02, B.hit + 0.1), 150, -6, '#7FF6FF');
  return o + letterbox(LB(t));
}
// 31 — "NO!" the light wave sweeps the battlefield, the dome shatters, the Block King recoils
function lightWave(t, t0, k = 1) {
  const u = seg(t, t0, t0 + 0.9);
  if (u <= 0 || u >= 1) return '';
  const x = lerp(2400, -600, ease.out(u));
  return S.rect(0, 0, 1920, 1080, 0, { fill: '#E8FDFF', opacity: f(0.75 * (1 - u) * k) }) + S.rect(x - 160, -100, 320, 1300, 0, { fill: '#FFFFFF', opacity: f(0.7 * (1 - u)), transform: `rotate(12 ${f(x)} 540)` });
}
const bossCrackAt = (t) => clamp(0.12 * seg(t, C.attack, C.attack + 0.2) + 0.3 * seg(t, C.attack, C.defeat) + 0.12 * seg(t, C.defeat, B.crumble), 0, 0.54);
const bossVal = (t) => 1 - 0.45 * seg(t, C.no, C.no + 0.3) - 0.45 * seg(t, C.attack, C.defeat + 0.3) - 0.1 * seg(t, B.hotdog, B.crumble);
function bossHUD(t, o = {}) {
  const sh = 1 - seg(t, C.no + 0.1, C.no + 0.6);
  return G.bossBar({ value: bossVal(t), trail: bossVal(t - 0.45), shield: sh, hit: o.hit || 0, t, k: o.k ?? 1, s: 0.9, y: 96, sub: sh > 0.5 ? '' : t > B.hotdog ? 'DEFEATED... BY A HOT DOG?!' : 'SHIELD BROKEN!' });
}
function shotNo(t) {
  const u = seg(t, C.no, C.attack);
  const cam = shook(camLerp(camAt(BOSS.x + 300, 180, 0.62, 960, 520), camAt(BOSS.x + 200, 120, 0.72, 960, 500), u), t, [[C.no + 0.1, 0.6, 18]]);
  const bossPose = { pose: 'idle', freeArms: true, armL: lerp(20, 150, ease.outBack(seg(t, C.no, C.no + 0.3))), armR: lerp(20, 140, ease.outBack(seg(t, C.no, C.no + 0.3))), bendL: 70, bendR: 60, lean: -7 * seg(t, C.no, C.no + 0.3), face: { name: 'shocked' }, shield: 1 - seg(t, C.no, C.no + 0.5) };
  let o = battleFrame(t, cam, { mode: 'watch', crowd: { t0: C.no - 0.5 }, bossPose, domeO: { shatter: seg(t, C.no + 0.05, C.no + 0.95) } });
  o += lightWave(t, C.no - 0.1);
  o += bossHUD(t, { hit: seg(t, C.no + 0.1, C.no + 0.5) });
  return o + flashAt(t, C.no, 0.2, 0.9, '#F2FDFF');
}
// 32 — everyone ATTACKS: the charge from the right, slashes, sparks, damage numbers
const HITS = (() => { const a = []; for (let i = 0; i < 9; i++) a.push({ dt: 0.25 + i * 0.13, x: -1750 + (hash(i * 3.1) - 0.5) * 600, y: 830 - 250 - hash(i * 5.3) * 520, v: Math.round(800 + 1200 * hash(i * 2.2)), crit: i % 4 === 3 }); return a; })();
function shotAttack(t) {
  const u = seg(t, C.attack, C.defeat);
  const cam = camLerp(camAt(-500, 440, 0.62), camAt(-1350, 400, 0.66), u, ease.inOut);
  const bossPose = { pose: 'hit', crack: bossCrackAt(t), face: { name: 'shocked' } };
  let fx = '';
  for (const h of HITS) {
    const age = t - C.attack - h.dt;
    if (age < 0 || age > 1) continue;
    fx += G.slash({ x: h.x, y: h.y, age, s: 1.6, angle: 160, col: h.crit ? '#FF8A2B' : '#FFD21F' }) + G.hitSpark({ x: h.x, y: h.y, age: age - 0.05, s: 1.5 });
    fx += G.damageNumber({ x: h.x + 60, y: h.y - 80, age: age - 0.08, value: h.v, crit: h.crit, s: 1.6 });
  }
  let o = battleFrame(t, cam, { mode: 'attack', crowd: { t0: C.attack, speed: 640 }, bossPose, dome: false }, fx);
  o += bossHUD(t, { hit: (t - C.attack) % 0.26 < 0.12 ? 0.3 : 0 });
  return o + whip(t, C.attack, -1, 0.1);
}
// 33 — "Defeated... by a HOT DOG?!" the Block King's face cracking; a spectator-cam shows the hot dog waving on the summit
function specCam(t, x, y, r, k) {
  if (k <= 0) return '';
  const id = S.uid('s11pip');
  const sc = ease.outBack(k);
  let inner = S.rect(-r, -r, 2 * r, 2 * r, 0, { fill: '#FFB88A' }) + S.rect(-r, r * 0.35, 2 * r, r, 0, { fill: '#F2B705' });
  inner += K.rays(0, -r * 0.2, 12, r * 1.6, '#FFFFFF', 0.25, t * 30);
  inner += actor('dadAvatar', t, { x: 0, y: r * 0.62, s: 0.36, t, armR: 150 + 25 * Math.sin(t * 12), armL: 20, nametag: false, volume: false, face: { name: 'happy', mouth: 'smile' } }, { arms: false });
  let o = S.clipDef(id, S.circle(0, 0, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
  o += S.circle(0, 0, r, { fill: 'none', stroke: '#151515', 'stroke-width': 12 }) + S.circle(0, 0, r - 8, { fill: 'none', stroke: '#FFD21F', 'stroke-width': 6 });
  o += S.g(S.rect(-70, -22, 140, 44, 22, ol('#FF3B4E', 5)) + TF('LIVE', 10, 11, 28, '#FFFFFF') + S.circle(-40, 0, 8, { fill: '#FFFFFF' }), `translate(0 ${f(-r - 6)})`);
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(sc)})`);
}
function shotDefeat(t) {
  const u = seg(t, C.defeat, C.crumble);
  const hy = BOSS.y - 1350 * BOSS.s;
  const cam = shook(camLerp(camAt(BOSS.x + 40, hy + 300, 1.3, 820, 560), camAt(BOSS.x + 30, hy + 290, 1.5, 820, 560), u), t, [[B.hotdog + 0.3, 0.4, 10]]);
  const dog = t >= B.hotdog + 0.3;
  const bossPose = dog ? { pose: 'hit', crack: bossCrackAt(t), face: { name: 'dizzy' } } : { pose: 'idle', freeArms: true, armL: 150, armR: 140, bendL: 60, bendR: 70, lean: -5, crack: bossCrackAt(t), face: { name: 'shocked', eyes: { look: [0.9, -0.3] } } };
  let fx = '';
  for (let i = 0; i < 4; i++) { const age = (t - C.defeat - i * 0.37) % 1.5; const x = BOSS.x + (hash(i * 3.3) - 0.5) * 560, y = hy + 520 + hash(i * 1.7) * 300; fx += G.hitSpark({ x, y, age, s: 1.3, seed: i }); }
  let o = towerFrame(t, cam, {}, bossW(t, bossPose) + fx);
  o += specCam(t, 1540, 500, 210, seg(t, B.hotdog - 0.35, B.hotdog));
  o += bossHUD(t, {});
  return o + whip(t, C.defeat, 1, 0.08);
}
// 34 — the Block King crumbles into cube confetti; the crown pops off; the server cheers
function crownFall(t, t0) {
  const a = t - t0;
  if (a < 0) return '';
  const x = BOSS.x + 220 * Math.min(a, 1.2), y0 = BOSS.y - 1350;
  let y = y0 - 600 * a + 1500 * a * a;
  const fl = BOSS.y + 40;
  let rot = 260 * a;
  if (y > fl) { y = fl; rot = 12; }
  return S.g(G.crown(0, 0, 130, '#FFD21F', 10), `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
}
function shotCrumble(t) {
  const u = seg(t, C.crumble, C.victory);
  const cam = shook(camLerp(camAt(-1150, 380, 0.5), camAt(-1000, 420, 0.56), u), t, [[B.crumble, 0.7, 24]]);
  const pre = t < B.crumble;
  let w = '';
  if (pre) w += bossW(t, { pose: 'hit', crack: lerp(0.54, 0.75, seg(t, C.crumble, B.crumble)), face: { name: 'dizzy' } });
  w += G.bossCrumble({ x: BOSS.x, y: BOSS.y, w: 1000, h: 1300, s: 1.4, age: t - B.crumble, n: 40 });
  w += crownFall(t, B.crumble);
  let o = towerFrame(t, cam, {}, w + crowd(t, 'cheer'));
  o += G.bossBar({ value: 0, trail: bossVal(t - 0.4), t, s: 0.9, y: 96, k: 1 - seg(t, B.crumble + 0.6, B.crumble + 1.0), sub: 'DEFEATED... BY A HOT DOG?!' });
  return o + flashAt(t, B.crumble, 0.25, 0.85) + whip(t, C.crumble, -1, 0.08);
}
// 35 — VICTORY! Server saved! dawn turns the sky gold; tilt from the cheering battlefield up to the summit
const DAWN = (t) => ease.inOut(seg(t, B.victory, B.victory + 2.6));
function shotVictory(t) {
  const u = seg(t, C.victory, C.summit);
  const cam = camLerp(camAt(-200, 520, 0.5), camAt(600, -300, 0.46), u, ease.inOut);
  let w = crowd(t, 'cheer') + R.blockConfetti({ x: BOSS.x, y: BOSS.y - 600, age: t - C.victory + 1.2, n: 30, s: 2, seed: 8 });
  let o = towerFrame(t, cam, { set: { dawn: DAWN(t) } }, w);
  o += R.blockConfettiRain(t, { t0: B.victory - 0.2, n: 55, s: 1.2 });
  o += G.victoryCard({ k: seg(t, B.victory - 0.1, B.victory + 1.1), t, y: 360, s: 0.9 });
  o += G.serverHealth({ value: lerp(0.2, 1, ease.out(seg(t, B.saved, B.saved + 1.2))), trail: 0.2, t, y: 880, w: 1000, s: 0.85, k: seg(t, B.saved - 0.2, B.saved + 0.1) });
  return o + flashAt(t, B.victory, 0.2, 0.7, '#FFF4C0');
}
// the summit at dawn (world): everyone teleported up, the broken pedestal, shards
const SUM = { dad: { x: 1420, y: TOPY }, mom: { x: 1190, y: TOPY + 6 }, you: { x: 1700, y: TOPY + 4 }, granny: { x: 1300, y: TOPY - 8 }, noodle: { x: 1830, y: TOPY - 6 }, dark: { x: 1090, y: TOPY - 10 },
  players: [[1560, TOPY - 14, 4], [1640, TOPY - 16, 11], [1150, TOPY - 18, 8], [1900, TOPY - 12, 1]] };
function summitProps(t) {
  let o = '';
  for (let i = 0; i < 9; i++) { const x = CRY.x - 160 + hash(i * 4.1) * 340, y = TOPY - 8 + hash(i * 2.7) * 14; o += S.path(`M${f(x)} ${f(y - 18)} l14 18 l-24 4 Z`, { fill: i % 2 ? '#7FF6FF' : '#B57BFF', stroke: '#151515', 'stroke-width': 3 }); }
  return o;
}
function summitCrowd(t, mode, o = {}) {
  const s = 0.3;
  const pose = (who, base, extra = {}) => {
    const ph = hash(base.x * 0.01);
    let p = { x: base.x, y: base.y, s, t };
    if (mode === 'cheer' || mode === 'toss') { const w = Math.sin(t * 9 + ph * 6); Object.assign(p, { armR: 150 + 22 * w, armL: 150 - 22 * w, lift: mode === 'cheer' ? 18 * Math.abs(Math.sin(t * 6 + ph * 5)) : 0, turn: (base.x < 1420 ? 0.4 : -0.4), face: { name: 'joy' } }); }
    if (mode === 'aww') Object.assign(p, { armL: 30, armR: 30, turn: base.x < 1420 ? 0.5 : -0.5, face: { name: 'happy', eyes: { type: 'heart' } } });
    return { ...p, ...extra };
  };
  const pop = (base, i) => { const age = t - (B.pops + i * 0.09); return age; };
  const items = [];
  const add = (key, base, extra, i) => items.push({ y: base.y, key, base, extra, i });
  if (o.dark !== false) add('darkblade', SUM.dark, { volume: false }, 0);
  SUM.players.forEach((q, j) => add('player', { x: q[0], y: q[1] }, { i: q[2] }, 1 + j));
  add('grandmaAvatar', SUM.granny, {}, 5);
  add('momAvatar', SUM.mom, { armor: 1 }, 6);
  if (o.you !== false) add('you', SUM.you, { nametag: 'YOU', crown: true }, 7);
  add('noodle', SUM.noodle, {}, 8);
  items.sort((a, b) => a.y - b.y);
  let out = '';
  for (const it of items) {
    const age = o.pops ? pop(it.base, it.i) : 9;
    if (age < -0.32) continue;
    let p = pose(it.key, it.base, { ...it.extra, ...((o.over || {})[it.key] || {}) });
    if (o.pops && age < 1) out += R.respawnPop({ x: p.x, y: p.y, s: 0.3, age, part: 'back' });
    if (age >= 0) { const pp = R.popPose(age, 0.3); p = { ...p, sx: pp.sx, sy: pp.sy, lift: (p.lift || 0) + pp.lift }; out += it.key === 'player' ? K.draw.player(p.i, { shade: true, shadow: true, ...p }) : actor(it.key, t, p, { arms: false, energy: 1.2 }); }
    if (o.pops && age < 1) out += R.respawnPop({ x: p.x, y: p.y, s: 0.3, age, part: 'front' });
  }
  return out;
}
// 36 — the summit: the whole server teleports in around the hot dog
function shotSummit(t) {
  const u = seg(t, C.summit, C.mom);
  const cam = camLerp(camAt(1460, TOPY - 200, 1.05, 960, 560), camAt(1460, TOPY - 220, 1.18, 960, 560), u);
  const lift = ease.out(seg(t, C.summit + 0.6, C.mom));
  let w = summitProps(t) + summitCrowd(t, 'cheer', { pops: true });
  w += actor('dadAvatar', t, { ...SUM.dad, s: 0.3, t, armL: 150 + 20 * Math.sin(t * 8), armR: 150 - 20 * Math.sin(t * 8), lift: 60 * lift, nametag: false, face: { name: 'joy' } }, { arms: false });
  let o = towerFrame(t, cam, { set: { dawn: 1 } }, w);
  o += G.joinToast({ x: 960, y: 170, anchor: 'center', s: 1.1, user: 'Everyone', text: 'teleported to the summit!', icon: 'cube', col: '#FFD21F', k: seg(t, C.summit + 0.1, C.summit + 0.45), t });
  return o + R.blockConfettiRain(t, { t0: B.victory - 0.2, n: 40, s: 1.1 }) + whip(t, C.summit, 'up', 0.1);
}
// 37 — the real Mom jumps up on the couch: "That's my husband!"
function shotMom(t) {
  const u = seg(t, C.mom, C.toss);
  const jumpK = seg(t, B.momJump, B.momJump + 0.25);
  const bounce = t > B.momJump + 0.25 ? Math.abs(Math.sin((t - B.momJump - 0.25) * 6.5)) : 0;
  const cam = shook(camLerp({ zoom: 1.32, x: 330, y: -40 }, { zoom: 1.5, x: 330, y: -90 }, u), t, [[B.momJump + 0.25, 0.3, 10]]);
  const standing = t >= B.momJump;
  const o = living(t, cam, {
    dad: { turn: 0.5, armL: 40 + 30 * Math.abs(Math.sin(t * 10)), armR: 120, face: { name: 'joy', eyes: { type: 'happy' } } },
    mom: { turn: -0.2, face: 'shocked' },
    momStand: standing ? { lift: 160 * Math.sin(Math.PI * Math.min(1, jumpK)) * (jumpK < 1 ? 1 : 0) + 70 * bounce, armL: 160 + 10 * Math.sin(t * 9), armR: 165 - 10 * Math.sin(t * 9), headset: true, face: { name: 'excited' } } : null,
    granny: { turn: -0.6, armL: 50 + 25 * Math.abs(Math.sin(t * 12)), armR: 60, face: { name: 'joy' } },
  });
  return o + whip(t, C.mom, -1, 0.1);
}
// 38 — "THAT'S MY HUSBAND!" the server tosses the hot dog into the sunrise; Mom's avatar types it in CAPS
function tossLift(t) {
  let l = 0;
  for (const t0 of B.toss) { const a = (t - t0) / 1.05; if (a > 0 && a < 1) l = Math.max(l, 520 * 4 * a * (1 - a)); }
  return l;
}
function shotToss(t) {
  const lift = tossLift(t);
  const cam = camAt(1420, TOPY - 260 - lift * 0.3, 0.95, 960, 560);
  const spin = B.toss.reduce((r, t0) => (t > t0 && t < t0 + 1.05 ? 360 * ease.inOut((t - t0) / 1.05) : r), 0);
  let w = summitProps(t) + summitCrowd(t, 'toss', { over: { momAvatar: { armR: 150, armL: 40, turn: 0.4, face: { name: 'love' } } } });
  w += actor('dadAvatar', t, { ...SUM.dad, s: 0.3, t, lift, rot: spin, armL: 150, armR: 160, legL: -20, legR: 20, nametag: false, shadow: lift < 20, face: { name: 'joy' } }, { arms: false });
  let o = towerFrame(t, cam, { set: { dawn: 1 } }, w);
  const [mx, my] = toScr(cam, SUM.mom.x, SUM.mom.y - 1192 * 0.3 - 40);
  o += G.chatBubble({ x: mx, y: my, t, caps: true, text: "THAT'S MY HUSBAND!", typed: G.chatSync(t, '11.11', { from: 3 }), k: seg(t, C.toss, C.toss + 0.25), s: 0.85, tail: 0.6 });
  o += G.emoteHearts({ x: mx, y: my + 40, age: (t - C.toss) % 1.8, n: 10, s: 1 });
  return o + R.blockConfettiRain(t, { t0: B.victory - 0.2, n: 40, s: 1.1 }) + whip(t, C.toss, 'up', 0.1);
}
// 39 — "I did a jump!" set down, hopping with joy; the hero pushes through the crowd toward him
function heroRun(t, from, to, t0, t1) {
  const u = seg(t, t0, t1);
  if (u >= 1) return null;
  return { x: lerp(from, to, u), view: 'side', ...AC.run(t * 14, 1), face: { name: 'joy' } };
}
function shotDid(t) {
  const u = seg(t, C.did, C.sonReal);
  const cam = camLerp(camAt(1500, TOPY - 190, 1.3, 960, 560), camAt(1520, TOPY - 190, 1.42, 960, 560), u);
  const hop = Math.abs(Math.sin((t - C.did) * 7.5)) * seg(t, C.did + 0.2, C.did + 0.4);
  const run = heroRun(t, 1900, 1620, C.did + 0.4, C.sonReal);
  let w = summitProps(t) + summitCrowd(t, 'cheer', { you: false });
  w += actor('dadAvatar', t, { ...SUM.dad, s: 0.3, t, lift: 50 * hop, armL: 160, armR: 160, sy: 1 + 0.05 * hop, nametag: false, face: { name: 'joy' } }, { arms: false, energy: 1.4 });
  w += actor('you', t, { x: run ? run.x : 1620, y: TOPY + 4, s: 0.3, t, nametag: 'YOU', crown: true, ...(run || { turn: -0.5, face: 'joy' }) }, { arms: !!run ? false : true });
  let o = towerFrame(t, cam, { set: { dawn: 1 } }, w);
  const [bx, by] = toScr(cam, SUM.dad.x, SUM.dad.y - 1240 * 0.3 - 50 * hop - 40);
  o += G.chatBubble({ x: bx, y: by, t, caps: true, text: 'I DID A JUMP!', typed: G.chatSync(t, '11.12', { to: 3 }), k: seg(t, C.did, C.did + 0.25), out: seg(t, C.sonReal - 0.2, C.sonReal), s: 0.9 });
  return o + R.blockConfettiRain(t, { t0: B.victory - 0.2, n: 40, s: 1.1 }) + whip(t, C.did, 1, 0.08);
}
// 40 — "Son, I did a..." the real Dad turns to his son at the PC (YOU spun around in the chair)
function shotSonReal(t) {
  const u = seg(t, C.sonReal, C.bigJump);
  const cam = camLerp({ zoom: 1.55, x: -160, y: -40 }, { zoom: 1.7, x: -150, y: -60 }, u);
  const up = ease.outBack(seg(t, C.sonReal + 0.5, C.sonReal + 0.9));
  const o = living(t, cam, {
    chair: 'front',
    you: { turn: 0.5, armL: 30, armR: 30 + 120 * up, face: { name: 'joy', fx: ['tears'] } },
    dad: { turn: -0.6, armL: 40 + 110 * up, armR: 40 + 110 * up, face: { name: 'joy', fx: ['tears'] } },
    laptopY: 880,
    mom: { turn: -0.4, face: { name: 'happy', eyes: { type: 'happy' } } },
    granny: false,
  });
  return o + whip(t, C.sonReal, -1, 0.1);
}
// 41 — "...JUMP!" one more giant jump, straight up into the sunrise
function shotBigJump(t) {
  const a = seg(t, B.bigJump, B.bigJump + 1.0);
  const lift = 420 * 4 * a * (1 - a);
  const cam = camAt(1460, TOPY - 300 - lift * 0.4, 1.05, 960, 600);
  let w = summitProps(t) + summitCrowd(t, 'cheer', { you: false });
  w += actor('you', t, { x: 1620, y: TOPY + 4, s: 0.3, t, nametag: 'YOU', crown: true, turn: -0.5, armL: 150, armR: 160, face: { name: 'joy' } }, { arms: false });
  w += actor('dadAvatar', t, { ...SUM.dad, s: 0.3, t, lift, rot: 360 * ease.inOut(seg(a, 0.1, 0.8)), armL: 170, armR: 170, sy: 1 - 0.15 * bump(t, B.bigJump - 0.15, B.bigJump), nametag: false, face: { name: 'joy' } }, { arms: false });
  let o = towerFrame(t, cam, { set: { dawn: 1 } }, w);
  const [jx, jy] = toScr(cam, SUM.dad.x, SUM.dad.y - 300 - lift);
  o += K.bang('JUMP!', jx + 260, jy - 40, seg(t, B.bigJump + 0.1, B.bigJump + 0.25), 150, -6, '#FFD21F');
  if (a > 0.1 && a < 0.9) o += K.sparkles([[jx - 130, jy, 34], [jx + 120, jy + 40, 28], [jx, jy - 120, 30]], t);
  return o + R.blockConfettiRain(t, { t0: B.victory - 0.2, n: 40, s: 1.1 }) + whip(t, C.bigJump, 'up', 0.08);
}
// 42 — the hug: "You did a HUNDRED jumps, Dad!" (the hero hits him at a run; the crowd goes awww)
function hugPair(t, o = {}) {
  const run = heroRun(t, 1700, 1520, C.hug, B.hug);
  const hk = seg(t, B.hug, B.hug + 0.25);
  const sway = Math.sin((t - B.hug) * 3) * 3 * hk;
  let w = '';
  w += actor('dadAvatar', t, { x: SUM.dad.x, y: TOPY, s: 0.3, t, view: 'side', flip: true, armL: lerp(30, 75, hk), armR: lerp(30, 82, hk), rot: sway - 6 * hk, nametag: false, mvp: o.mvp, face: { name: 'joy', fx: hk > 0 ? ['tears'] : [] } }, { arms: false });
  if (run) w += actor('you', t, { x: run.x, y: TOPY + 4, s: 0.3, t, nametag: 'YOU', crown: true, ...run }, { arms: false });
  else w += actor('you', t, { x: SUM.dad.x + 100, y: TOPY + 4, s: 0.3, t, view: 'side', armL: 80, armR: 86, rot: sway + 8, lift: 18 * (1 - hk), nametag: false, crown: true, face: { name: 'joy', fx: ['tears'] } }, { arms: false });
  return w;
}
function shotHug(t) {
  const u = seg(t, C.hug, C.mvp);
  const cam = camLerp(camAt(1500, TOPY - 200, 1.4, 960, 600), camAt(1475, TOPY - 185, 1.95, 960, 600), u);
  let w = summitProps(t) + summitCrowd(t, t > B.hug + 0.2 ? 'aww' : 'cheer', { you: false }) + hugPair(t);
  let o = towerFrame(t, cam, { set: { dawn: 1 } }, w);
  const [hx, hy] = toScr(cam, SUM.dad.x + 50, TOPY - 380);
  if (t > B.hug) o += G.emoteHearts({ x: hx, y: hy, age: (t - B.hug) % 1.7, n: 12, s: 1.1 });
  o += G.stamp({ text: '100 JUMPS', k: seg(t, B.hundred, B.hundred + 0.4), x: 1480, y: 250, s: 0.95, rot: -8, col: '#FFB000' });
  o += E.floorHUD(t, 100, { bump: seg(t, B.hundred, B.hundred + 0.45), rim: '#FFD21F' });
  return o + whip(t, C.hug, 1, 0.08);
}
// 43 — MVP: DadBod1978 (the card over the hugging pair at sunrise) -> pull back -> dip to night (SC 12)
function shotMVP(t) {
  const pull = ease.inOut(seg(t, B.out - 0.2, END));
  const cam = camLerp(camAt(1475, TOPY - 185, 1.95, 960, 600), camAt(1420, TOPY - 330, 0.62, 960, 600), pull);
  let w = summitProps(t) + summitCrowd(t, 'cheer', { you: false }) + hugPair(t, { mvp: t > B.mvpName });
  let o = towerFrame(t, cam, { set: { dawn: 1 } }, w);
  const kc = 0.5 * seg(t, B.mvpA, B.mvpA + 0.7) + 0.5 * seg(t, B.mvpName - 0.1, B.mvpName + 0.6);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#160C2E', opacity: f(0.45 * seg(t, B.mvpA, B.mvpA + 0.4) * (1 - seg(t, B.out, B.out + 0.3))) });
  const portrait = actor('dadAvatar', t, { x: 0, y: 390, s: 0.5, t, nametag: false, mvp: true, volume: false, face: { name: 'joy' } }, { arms: false });
  o += G.mvpCard({ k: kc, out: seg(t, B.out, B.out + 0.35), t, y: 520, s: 0.95, portrait, stats: [{ label: 'JUMPS', value: '100' }, { label: 'CRYSTALS', value: '1' }] });
  o += R.blockConfettiRain(t, { t0: B.victory - 0.2, n: 40, s: 1.1 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#0B0E2A', opacity: f(ease.in(seg(t, END - 0.4, END))) });
  return o + whip(t, C.mvp, -1, 0.08);
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [C.replay, shotDad], [C.look, shotReplay], [C.vs, shotLook], [C.tilt, shotVS], [C.real, shotTilt], [C.keys, shotReal], [C.jump1, shotKeys],
  [C.gasp, shotJump1], [C.again, shotGasp], [C.slip, shotAgain], [C.cp10, shotSlip], [C.watch, shotCP10], [C.noodle, shotWatch], [C.climb2, shotNoodle],
  [C.chant, shotClimb2], [C.climb3, shotChant], [C.dark, shotClimb3], [C.dark2, shotDark], [C.wobble, shotDark2], [C.realWob, shotWobble], [C.okay, shotRealWob],
  [C.gap, shotOkay], [C.you, shotGap], [C.son1, shotYou], [C.son2, shotSon1], [C.press2, shotSon2], [C.leap, shotPress2], [C.grab, shotLeap], [C.pull, shotGrab],
  [C.dive, shotPull], [C.no, shotDive], [C.attack, shotNo], [C.defeat, shotAttack], [C.crumble, shotDefeat], [C.victory, shotCrumble], [C.summit, shotVictory],
  [C.mom, shotSummit], [C.toss, shotMom], [C.did, shotToss], [C.sonReal, shotDid], [C.bigJump, shotSonReal], [C.hug, shotBigJump], [C.mvp, shotHug], [Infinity, shotMVP],
];
const CLOSE = new Set([shotDad, shotVS, shotReal, shotSon1, shotSon2, shotRealWob, shotMom, shotSonReal, shotDefeat, shotGasp, shotNoodle, shotDark, shotDark2, shotYou, shotHug, shotMVP, shotDid]);
const REAL = new Set([shotReal, shotKeys, shotRealWob, shotSon2, shotPress2, shotMom, shotSonReal]);
const shotAt = (t) => { for (const [end, g] of SHOTS) if (t < end) return g; return shotMVP; };
function scene(t) {
  const fn = shotAt(t);
  VOL_OFF = CLOSE.has(fn);
  return fn(t);
}
function look(t) {
  const fn = shotAt(t);
  if (REAL.has(fn)) return { grade: null, vignette: 0.85 };
  if (fn === shotReplay || fn === shotVS) return { grade: null, vignette: 0.6 };
  if (t >= C.son1 && t < C.no) return { grade: 'cool', vignette: 1 };
  if (t >= C.victory) return { grade: 'warm', vignette: 0.65 };
  return { grade: null, vignette: 0.75 };
}
function captionY(t) {
  if (t >= C.son1 && t < C.no + 0.1) return 1030;          // inside the letterbox bar
  return 1010;
}

module.exports = { scene, look, captionY, DEFS: E.DEFS, TIMES: TM, HOPS, CUT: C, BEATS: B };
