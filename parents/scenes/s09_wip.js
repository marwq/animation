// SC 09 · THE BLOCK KING — Cube City at night: the Block King rises behind the city (eyes, crown, boss bar), "CUBE CITY... IS
// MINE!" (roar, lightning); he smashes the arena, Tycoon Valley and Granny's cookie factory (cookies everywhere) -> the real
// Granny in curlers: "MY COOKIES!"; DarkBlade's clan charges and gets flicked into the sky ("Clan? CLAN?!" + tumbleweed);
// Noodle: "Bro, where ARE you?!"; the server health bar 90 -> 50 -> 20 %; the bedroom: "Dad... I can't win this alone." /
// "Then don't."; down the stairs into the living room; Mom in pajamas with tea + Granny in curlers: "It's eleven p.m., young
// man. Bedtime." -> silence: the tea goes down, the headset slowly goes on -> "...Five minutes. Let's go."; Granny cracks her
// knuckles; "your whole family logged in. Together." (the 2x2 faces in screen light) -> push into the monitor -> SC 10.
// Every cut and beat comes from the voice via s09_env.times09() (shared with audio/cues/gen_sc09.js).
'use strict';

const K = require('./kit');
const G = require('./gameui');
const R = require('./respawn');
const GS = require('./sets_game');
const H = require('./sets_house');
const X = require('../rig/extras');
const L6 = require('../rig/looks6');
const AC = require('./acting');
const E = require('./s09_env_wip');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const V = K.V;
const TM = E.times09(V);
const { START, END, C, B } = TM;
const { camAt, camLerp, shook, punch, rotFrame, scr, flash, flashAt, whip, letterbox, wash, zoomLines } = E;
const view = K.view;
// close-ups render the rig characters without the body-volume filter (perf; ENGINE.md). The router sets VOL_OFF.
let VOL_OFF = false;
const actor = (name, t, pose = {}, act) => K.actor(name, t, VOL_OFF && pose.volume === undefined ? { ...pose, volume: false } : pose, act);
const player = (i, pose) => K.draw.player(i, { shade: true, ...pose });
const LN = TM.n;
// progress 0..1 inside [a, a + d], exactly 0 outside (for the UI 'hit' inputs)
const prog = (t, a, d = 0.4) => (t > a && t < a + d ? (t - a) / d : 0);

// ================================================================ Cube City at night
const CN = GS.SPOTS.cityNight;
const SB = CN.boss;                                  // feet on the k .5 plaza
const BS = 0.75;                                     // boss scale there (~1000 px tall)
const BKP = L6.BK_POSES;
// blend two boss presets (a, b with their k) -> explicit arm fields (freeArms)
function bkMix(a, b, u, ka = 0, kb = 0) {
  const base = { armL: 16, armR: 16, bendL: 10, bendR: 10, lean: 0, headY: 0, bodyY: 0, fist: 1 };
  const A = { ...base, ...BKP[a](ka) }, Bq = { ...base, ...BKP[b](kb) };
  const o = { freeArms: true };
  for (const k of Object.keys(base)) o[k] = lerp(A[k], Bq[k], u);
  return o;
}
function boss(t, pose = {}) { return actor('boss', t, { x: SB.x, y: SB.y, s: BS, t, ...pose }); }
// city frame: behind = the boss is drawn behind the mid row (rising); ledge = characters on the rooftop ledge (k 1)
function city(t, cam, o = {}, { bossSvg = '', behind = false, ledge = '', top = '', far = '' } = {}) {
  const Ly = GS.cityNight.layers(t, cam, o);
  const b = bossSvg ? view(cam, bossSvg + far, SB.k) : '';
  return (behind ? Ly.sky + b + Ly.row : Ly.bg + b) + Ly.mid + (ledge ? view(cam, ledge, 1) : '') + Ly.light + (top ? view(cam, top, 1) : '');
}
// a scared player on the ledge, seen from behind (looking at the boss)
function ledgeBack(t, i, x, s, o = {}) {
  const sh = Math.sin(t * 30 + i) * 3;
  return player(i, { x: x + sh, y: CN.floor + (o.dy || 0), s, view: 'back', armL: o.armL ?? 30, armR: o.armR ?? 30, nametag: false, ...o.pose });
}

// ================================================================ the house at night
const SPL = H.SPOTS.livingRoom, SPB = H.SPOTS.bedroom, SPS = H.SPOTS.stairs;
const momSeat = (extra = {}) => H.seatPose(SPL.seats.mom, 1.04, { pajamas: true, ...extra });
const granSeat = (extra = {}) => H.seatPose(SPL.seats.grandma, 0.9, { curlers: true, ...extra });
function living(t, cam, o = {}, { seated = '', devices = '', standing = '', top = '' } = {}) {
  const Ly = H.livingRoom.layers(t, { time: 'night', clock: '11:00', lamp: 0.55, ...o });
  return view(cam, Ly.bg, 0.8) + view(cam, Ly.mid + seated + Ly.front + devices + Ly.table + standing + Ly.fg + Ly.light + top, 1);
}
// ================================================================ SHOTS
// A1 — "The Block King." The ground shakes, the crown and the glowing eyes rise behind the city
function shotA1(t) {
  const u = seg(t, C.a1, C.a2);
  let cam = camLerp(CN.cams.low, { x: 0, y: 50, zoom: 1.06 }, u, ease.out);
  cam = shook({ ...cam, sx: Math.sin(t * 61) * 6, sy: Math.cos(t * 47) * 5 }, t, [[B.king, 0.45, 14]]);
  const rise = lerp(0.05, 0.42, ease.inOut(u));
  const glow = t < B.king - 0.05 ? 0.35 : 1.4 - 0.35 * seg(t, B.king, B.king + 0.6);
  let far = E.dustPuff(SB.x - 200, SB.y - 6, (t - C.a1) % 1.2, { r: 220, col: '#5A3C74', seed: 3 }) + E.dustPuff(SB.x + 220, SB.y - 6, (t - C.a1 + 0.5) % 1.2, { r: 220, col: '#5A3C74', seed: 5 });
  far += E.cubeDebris(SB.x + 260, SB.y - 820 * rise * BS, (t - C.a1) % 0.9, { n: 5, s: 0.7, seed: 2, floorY: SB.y, power: 0.4, up: 0.4 });
  const bossSvg = boss(t, { pose: 'rise', rise, glow, idle: false });
  let ledge = ledgeBack(t, 3, 210, 0.37, { armR: 150, armL: 20 });
  ledge += ledgeBack(t, 8, 1660, 0.36, { armL: 60, armR: 60, dy: 4 });
  ledge += ledgeBack(t, 12, 1820, 0.34, { armL: 20, armR: 140, dy: -8 });
  let o = city(t, cam, { boss: 0.15 }, { bossSvg, behind: true, ledge, far });
  o += flashAt(t, C.a1, 0.35, 0.95, '#FF2E4D') + flashAt(t, B.king, 0.18, 0.35, '#C77DFF');
  return o;
}
// A2 — "The biggest boss in Cube City history." Tilt up as he rises all the way; the title card; the boss bar drops in
function shotA2(t) {
  const u = seg(t, C.a2, C.b1 - 0.2);
  let cam = camLerp({ x: 0, y: 50, zoom: 1.06 }, { x: 0, y: -330, zoom: 0.8 }, u, ease.inOut);
  cam = { ...cam, sx: Math.sin(t * 61) * 4 * (1 - u), sy: Math.cos(t * 47) * 4 * (1 - u) };
  const rise = lerp(0.42, 1, ease.out(seg(t, C.a2, B.history)));
  const stood = seg(t, B.history - 0.1, B.history + 0.4);
  let far = E.cubeDebris(SB.x - 300, SB.y - 700 * BS * rise, (t - C.a2) % 1.0, { n: 6, s: 0.8, seed: 7, floorY: SB.y, power: 0.45 });
  far += E.dustPuff(SB.x, SB.y, (t - C.a2) % 1.3, { r: 300, col: '#5A3C74', seed: 9 });
  const bossSvg = boss(t, { pose: 'rise', rise, glow: 1, idle: rise >= 1 });
  let ledge = ledgeBack(t, 3, 150, 0.37, { armR: 150, armL: 20 });
  ledge += ledgeBack(t, 8, 1760, 0.36, { armL: 150, armR: 150 });
  let o = city(t, cam, { boss: 0.2 }, { bossSvg, behind: true, ledge, far });
  o += G.bigTitle({ text: 'THE BLOCK KING', theme: 'night', sub: 'BIGGEST BOSS IN CUBE CITY HISTORY', k: seg(t, B.title - 0.15, B.title + 0.95), out: seg(t, C.b1 - 0.3, C.b1), t, x: 960, y: 770, s: 0.56 });
  o += G.bossBar({ k: stood, value: 1, t, y: 70, s: 0.78, hit: prog(t, B.history + 0.2, 0.35) });
  return o + flashAt(t, B.history + 0.1, 0.15, 0.35, '#C77DFF');
}
// B1 — "CUBE CITY..." the face: low close-up, jaw moving, eyes burning
function shotB1(t) {
  const u = seg(t, C.b1, C.b2);
  let cam = camLerp({ x: -20, y: -790, zoom: 2.75 }, { x: -20, y: -830, zoom: 3.05 }, u, ease.out);
  cam = shook(cam, t, [[B.cube, 0.3, 9], [B.city, 0.3, 9]]);
  const bossSvg = boss(t, { glow: 1.2 });
  const Ly = GS.cityNight.layers(t, cam, { boss: 0.5 });
  let o = Ly.bg + view(cam, bossSvg, SB.k) + Ly.light;
  o += E.embers(t, 1, 16, 3);
  o = rotFrame(o, -3);
  return o + whip(t, C.b1, 1, 0.1, '#E7C8FF');
}
// B2 — "IS MINE!" smash-zoom out to the roar, lightning, shockwave; then (the beat) the fists go up, aiming at the arena
function shotB2(t) {
  const pull = seg(t, C.b2, B.mine + 0.12);
  let cam = camLerp({ x: -20, y: -760, zoom: 2.3 }, { x: 0, y: -330, zoom: 0.82 }, pull, ease.out);
  cam = punch(cam, t, B.mine, 0.08, 0.1);
  cam = { ...cam, zoom: cam.zoom * (1 + 0.04 * seg(t, B.mineEnd, C.c1)) };
  cam = shook(cam, t, [[B.mine, 0.9, 22]]);
  const roar = seg(t, B.mine - 0.12, B.mine + 0.05), lift = seg(t, B.mineEnd + 0.3, C.c1 - 0.25);
  let pose;
  if (lift > 0) pose = bkMix('roar', 'smash', ease.inOut(lift), 0, 0);
  else pose = bkMix('rise', 'roar', ease.out(roar));
  const bossSvg = boss(t, { ...pose, glow: 1 + 0.4 * bump(t, B.mine, B.mine + 0.8), lean: lift > 0 ? -4 * lift : pose.lean, headRot: -10 * ease.inOut(lift) });
  const age = t - B.mine;
  const far = E.shockRing(SB.x, SB.y - 10, age, 1500, { col: '#E7C8FF', w: 30, dur: 0.8 }) + E.cubeDebris(SB.x, SB.y - 300, age, { n: 12, s: 1.2, seed: 4, floorY: SB.y, power: 0.9 });
  let ledge = '';
  // two players flee across the ledge
  for (const [i, x0, dir, dl, dy] of [[5, -150, 1, 0, 0], [10, 2100, -1, 0.2, -40]]) {
    const r = seg(t, B.mine + dl, C.c1);
    if (r > 0) ledge += player(i, { x: x0 + dir * 1500 * r, y: CN.floor + dy, s: 0.46 + dy * 0.002, view: 'side', flip: dir > 0, ...AC.run(t * 16), armL: 150, armR: 150, face: { name: 'scream' }, nametag: false });
  }
  let o = city(t, cam, { boss: lerp(0.2, 0.6, seg(t, B.mine, B.mine + 0.5)) }, { bossSvg, ledge, far });
  const p = scr(cam, SB.x, SB.y - 1000 * BS, SB.k);
  const lk = seg(t, B.mine - 0.02, B.mine + 0.3), lk2 = seg(t, B.mine + 0.25, B.mine + 0.55);
  o += R.lightning({ x0: p.x - 520, y0: -20, x1: p.x - 120, y1: p.y + 40, k: lk, seed: 3, col: '#E7C8FF' }) + R.lightning({ x0: p.x + 600, y0: -20, x1: p.x + 160, y1: p.y + 60, k: lk2, seed: 8, col: '#E7C8FF' });
  o += zoomLines(p.x, p.y + 120, 1 - seg(t, B.mine + 0.1, B.mine + 0.7), t, '#F3E3FF');
  o += G.bossBar({ k: seg(t, C.b2, C.b2 + 0.3), value: 1, t, y: 70, s: 0.78, hit: prog(t, B.mine, 0.4) });
  return o + flashAt(t, B.mine, 0.14, 0.6, '#E7C8FF');
}

// the giant fist over a set, world coords: falls from above onto (x, yHit) at tHit, rests, lifts away
function fistDrop(t, tHit, x, yHit, s, o = {}) {
  const fall = seg(t, tHit - (o.fall ?? 0.32), tHit), back = seg(t, tHit + (o.hold ?? 0.55), tHit + (o.hold ?? 0.55) + 0.6);
  if (fall <= 0) return '';
  const y = back > 0 ? lerp(yHit, yHit - 1900, ease.in(back)) : lerp(yHit - 1700, yHit, ease.in(fall));
  return E.giantFist(x + (o.dx || 0) * (1 - fall), y, s, { rot: (o.rot || 0) * (1 - fall), lw: 9, side: o.side || 1 });
}
function fistShadow(t, tHit, x, y, w) {
  const k = seg(t, tHit - 0.5, tHit);
  if (k <= 0 || t > tHit + 0.6) return '';
  return S.ellipse(x, y, w * (0.4 + 0.6 * k), w * 0.22 * (0.4 + 0.6 * k), { fill: '#120A1C', opacity: f(0.45 * k) });
}
function impactFx(t, tHit, x, y, o = {}) {
  const age = t - tHit;
  if (age < 0) return '';
  const s = o.s || 1;
  return E.dustPuff(x, y, age, { r: 170 * s, n: 7, col: o.dust || '#7A6390', seed: 4, dur: 0.8 }) + E.shockRing(x, y, age, 1100 * s, { col: '#FFFFFF', w: 26 }) +
    E.cubeDebris(x, y - 60, age, { n: 16, s: 1.1 * s, seed: o.seed || 6, floorY: y + 40, power: 1 }) + E.impactStar(x + 170 * s, y - 30 * s, age, 240 * s) + E.impactStar(x - 190 * s, y - 10 * s, age - 0.03, 180 * s);
}
// C1 — "He smashed the arena." The fist comes down on the ring: the arena breaks (raid)
function shotC1(t) {
  const u = seg(t, C.c1, C.c2);
  const SA = GS.SPOTS.arena;
  let cam = camLerp({ x: 0, y: -40, zoom: 0.82 }, { x: 0, y: -20, zoom: 0.9 }, u);
  cam = punch(cam, t, B.arena, 0.07, 0.08);
  cam = shook(cam, t, [[B.arena, 0.7, 30]]);
  const hit = t >= B.arena;
  const Ly = GS.arena.layers(t, cam, { time: 'night', raid: hit ? 1 : 0, crowd: hit ? 0 : 0.8, cheer: 0 });
  let w = fistShadow(t, B.arena, 960, 850, 520) + impactFx(t, B.arena, 960, 860, { s: 1.1 }) + fistDrop(t, B.arena, 960, 700, 1.05, { dx: -200, rot: 12 });
  let o = Ly.bg + Ly.mid + Ly.front + view(cam, w, 1) + Ly.light;
  o += flashAt(t, B.arena, 0.16, 0.9);
  return o + whip(t, C.c1, -1, 0.12);
}
// C2 — "He smashed Tycoon Valley." The fist knocks the castle towers off
function shotC2(t) {
  const u = seg(t, C.c2, C.c3);
  const ST = GS.SPOTS.tycoon;
  let cam = camLerp({ x: -1200, y: -60, zoom: 0.8 }, { x: -1290, y: -40, zoom: 0.88 }, u);
  cam = punch(cam, t, B.tycoon, 0.07, 0.08);
  cam = shook(cam, t, [[B.tycoon, 0.7, 28]]);
  const Ly = GS.tycoon.layers(t, cam, { time: 'night', granny: 3, smashed: t >= B.tycoon ? 1 : 0 });
  const w = impactFx(t, B.tycoon, -330, 500, { s: 0.9, seed: 9 }) + fistDrop(t, B.tycoon, -330, 330, 1.0, { dx: 260, rot: -14, side: -1 });
  let o = Ly.bg + Ly.mid + Ly.front + view(cam, w, 1) + Ly.fg + Ly.light;
  return o + flashAt(t, B.tycoon, 0.16, 0.9) + whip(t, C.c2, 1, 0.12);
}
// C3 — "He smashed Granny's cookie factory." + the beat: cookies everywhere in slow motion, one rolls up to the camera
function shotC3(t) {
  const u = seg(t, C.c3, C.d1);
  let cam = camLerp({ x: 640, y: -60, zoom: 0.78 }, { x: 600, y: -30, zoom: 0.95 }, u, ease.inOut);
  cam = punch(cam, t, B.factory, 0.07, 0.08);
  cam = shook(cam, t, [[B.factory, 0.8, 30]]);
  const Ly = GS.tycoon.layers(t, cam, { time: 'night', granny: 3, smashed: t >= B.factory ? 1 : 0, belt: t >= B.factory ? 0 : 1 });
  // slow motion after the line ends
  const a0 = t - B.factory, slow = LN[2].b + 0.1 - B.factory;
  const age = a0 < slow ? a0 : slow + (a0 - slow) * 0.3;
  let w = impactFx(t, B.factory, 1520, 600, { s: 1, seed: 12, dust: '#B07A9A' }) + fistDrop(t, B.factory, 1520, 420, 1.05, { dx: -220, rot: 10 });
  w += E.cookieBurst(1520, 560, age, { n: 12, s: 1.1, seed: 4, floorY: 880, life: 4 }) + E.cookieBurst(1450, 600, age - 0.08, { n: 8, s: 0.9, seed: 9, floorY: 900, life: 4, power: 0.8 });
  let o = Ly.bg + Ly.mid + Ly.front + view(cam, w, 1) + Ly.fg + Ly.light;
  // one cookie flies at the camera and cracks in half on the "lens"
  const ck = seg(t, LN[2].b + 0.15, C.d1 - 0.25);
  if (ck > 0) {
    const sc = lerp(0.6, 4.2, ease.in(ck)), x = lerp(1250, 1300, ck), y = lerp(500, 640, ck);
    o += X.cookie({ x, y, s: sc, rot: 200 * ck, bite: ck > 0.92 ? 1 : 0 });
  }
  if (t > C.d1 - 0.25) o += flash(seg(t, C.d1 - 0.25, C.d1) * 0.4, '#FFE9C8');
  return o + flashAt(t, B.factory, 0.16, 0.9) + whip(t, C.c3, -1, 0.12);
}
// D1 — "MY COOKIES!" The real Granny in curlers, phone at arm's length, screaming at the screen; Mom flinches beside her
function grannyPhoneScreen(t) {
  return (w, h) => {
    let o = S.rect(0, 0, w, h, 0, { fill: '#3A1E5C' }) + S.rect(0, h * 0.62, w, h * 0.38, 0, { fill: '#2E4A2E' });
    o += S.path(`M${w * 0.18} ${h * 0.62} L${w * 0.18} ${h * 0.4} L${w * 0.3} ${h * 0.34} L${w * 0.36} ${h * 0.44} L${w * 0.48} ${h * 0.3} L${w * 0.58} ${h * 0.42} L${w * 0.7} ${h * 0.36} L${w * 0.82} ${h * 0.45} L${w * 0.82} ${h * 0.62} Z`, ol('#E98AB8', 4));
    for (let i = 0; i < 3; i++) o += GS.fire(w * (0.3 + i * 0.2), h * 0.42 - (i % 2) * 14, 0.35, t, i);
    o += S.circle(w * 0.3, h * 0.74, 14, ol('#C98A4A', 3)) + S.circle(w * 0.62, h * 0.78, 12, ol('#C98A4A', 3));
    o += TF('FACTORY DESTROYED', w / 2, h * 0.16, 17, '#FFFFFF', { stroke: '#151515', 'stroke-width': 4, 'paint-order': 'stroke' });
    return o;
  };
}
function shotD1(t) {
  const u = seg(t, C.d1, C.e1);
  let cam = camLerp(camAt(1560, 570, 1.72), camAt(1600, 575, 1.85), u, ease.out);
  cam = punch(cam, t, B.cookies, 0.22, 0.08);
  cam = shook(cam, t, [[B.cookies, 0.6, 18]]);
  const scream = t >= B.cookies - 0.1;
  const seated = actor('mom', t, momSeat({ turn: 0.5, face: { name: 'shocked', eyes: { look: [0.8, 0] } }, bodyY: -18 * bump(t, B.cookies, B.cookies + 0.3), steam: 1, t }), { arms: false, energy: 0 }) +
    actor('grandma', t, granSeat({ phone: 'arm', phoneFace: 'screen', screen: grannyPhoneScreen(t), glow: 1, armR: 104 + 6 * Math.sin(t * 40) * (scream ? 1 : 0.3), t,
      face: scream ? { name: 'angry', mouth: 'scream', eyes: { look: [0.4, -0.2] }, fx: ['anger', 'steam'] } : { name: 'shocked', eyes: { look: [0.8, 0] } }, headRot: scream ? 4 * Math.sin(t * 30) : 0, bodyY: scream ? -10 * Math.abs(Math.sin(t * 18)) : 0 }), { arms: false, energy: 1.2 });
  const glow = [{ x: SPL.faces.grandma.x, y: SPL.faces.grandma.y, col: scream ? 'red' : 'phone', k: 1, r: 150 }];
  let o = living(t, cam, { glow, lamp: 0.4 }, { seated });
  return o + whip(t, C.d1, 1, 0.12);
}
// E1 — "Clan, attack!" DarkBlade on a rooftop, sword up; his clan leaps off toward the boss
const DBX = 720;
function clanLeap(t, i, t0) {
  const x0 = [960, 1130, 1300, 520][i], s0 = 0.43;
  const u = seg(t, t0, t0 + 0.9);
  if (u <= 0) return actor('clan', t, { i, x: x0, y: CN.floor, s: s0, t, view: 'side', flip: true, armL: 40, armR: 60, nametag: false }, { arms: false });
  const x = lerp(x0, 820 + i * 130, ease.out(u)), y = lerp(CN.floor, 700, u) - 520 * Math.sin(Math.PI * Math.min(1, u * 1.1)), s = lerp(s0, 0.13, ease.out(u));
  return actor('clan', t, { i, x, y, s, t, view: 'side', flip: true, ...AC.run(t * 18), armL: 150, armR: 120, nametag: false, rot: 20 * u }, { arms: false });
}
function shotE1(t) {
  const u = seg(t, C.e1, C.e2);
  let cam = camLerp(camAt(840, 640, 1.28), camAt(860, 610, 1.4), u, ease.out);
  const bossSvg = boss(t, { ...bkMix('idle', 'roar', 0.3), glow: 1 });
  let ledge = '';
  const tl = B.attack;
  for (let i = 3; i >= 0; i--) ledge += clanLeap(t, i, tl + i * 0.1);
  const raise = ease.outBack(seg(t, LN[4].a - 0.1, LN[4].a + 0.25));
  ledge += actor('darkblade', t, { x: DBX, y: CN.floor, s: 0.47, t, turn: 0.45, armR: lerp(40, 165, raise), armL: 30, swordGlow: raise, lean: -3 * raise, nametag: false }, { arms: false, energy: 1 });
  let o = city(t, cam, { boss: 0.6 }, { bossSvg, ledge });
  o += E.bubbleAt(cam, DBX, CN.floor - 0.47 * 1050 - 10, { text: 'Clan, attack!', typed: G.chatSync(t, '09.4', { to: 'attack!' }), k: seg(t, LN[4].a - 0.3, LN[4].a), t, s: 1.35, user: 'xX_DarkBlade_Xx', tail: 0.3 });
  return o + whip(t, C.e1, -1, 0.12);
}
// E2 — the flick: the boss flicks the clan into the sky (four twinkles); DarkBlade watches: "Clan?"
function shotE2(t) {
  const u = seg(t, C.e2, C.e3);
  let cam = camLerp({ x: 0, y: -170, zoom: 0.86 }, { x: 0, y: -195, zoom: 0.9 }, u);
  cam = shook(cam, t, [[B.flick, 0.3, 12]]);
  const fk = ease.out(seg(t, B.flick - 0.08, B.flick + 0.1));
  const pose = { freeArms: true, armL: 20, bendL: 12, armR: lerp(28, 118, fk), bendR: lerp(46, -10, fk), lean: lerp(4, -3, fk), headRot: 8 };
  const bossSvg = boss(t, { ...pose, face: { name: 'smug', mouth: fk > 0 && fk < 1 ? 'smirk' : undefined }, glow: 1 });
  // the clan on the plaza by his right fist (k .5), running in
  let far = '';
  const flyers = [];
  for (let i = 0; i < 4; i++) {
    const x = SB.x + 330 + i * 75, y = SB.y - 2 + (i % 2) * 10;
    if (t < B.flick + i * 0.04) far += actor('clan', t, { i, x: lerp(x + 420, x, ease.out(seg(t, C.e2, B.flick))), y, s: 0.2, t, view: 'side', ...AC.run(t * 18 + i), armR: 150, nametag: false }, { arms: false });
    else flyers.push([i, x, y]);
  }
  let o = city(t, cam, { boss: 0.6 }, { bossSvg, far });
  // the flight (screen space), twinkling out in the sky
  const SKY = [[230, 110], [700, 70], [1290, 80], [1720, 150]];
  for (const [i, x, y] of flyers) {
    const p = scr(cam, x, y, SB.k);
    const svg = actor('clan', t, { i, x: 0, y: 0, s: 0.24, t, armL: 160, armR: 140, nametag: false, face: 'dizzy' }, { arms: false });
    o += G.knockoutFly({ x0: p.x, y0: p.y, age: t - (B.flick + i * 0.05), dir: SKY[i][0] < p.x ? -1 : 1, svg, cy: 115, x1: SKY[i][0], y1: SKY[i][1], dur: 0.8 });
  }
  // DarkBlade in the foreground, from behind
  o += actor('darkblade', t, { x: 260, y: 1180, s: 0.6, t, view: 'back', armR: 150 - 70 * seg(t, B.flick + 0.3, B.flick + 0.8), armL: 24, nametag: false }, { arms: false, energy: 0.4 });
  const tc = LN[4].word('Clan', 1).t0;
  o += G.chatBubble({ x: 300, y: 520, text: 'Clan?', typed: G.chatSync(t, '09.4', { from: 2, to: 2 }), k: seg(t, tc - 0.25, tc), t, s: 1.25, tail: 0, user: 'xX_DarkBlade_Xx' });
  o += flashAt(t, B.flick, 0.08, 0.3);
  return o;
}

// E3 — "CLAN?!" + the beat: DarkBlade alone, looking left and right; a tumbleweed rolls by; the boss's shadow falls on him
function shotE3(t) {
  const pull = seg(t, LN[4].b + 0.05, C.f1 - 0.1);
  const cam = camLerp(camAt(DBX, 640, 2.05), camAt(DBX + 180, 650, 1.12), pull, ease.inOut);
  const look = t < LN[4].b + 0.2 ? Math.sin((t - C.e3) * 9) * 0.6 : 0;
  const up = seg(t, LN[4].b + 0.35, C.f1 - 0.2);
  const tw = seg(t, LN[4].b - 0.1, C.f1 + 0.2);
  const ledge = actor('darkblade', t, { x: DBX, y: CN.floor, s: 0.47, t, turn: look, armR: lerp(40, 16, up), armL: 20, swordRot: lerp(0, 60, up), headY: -8 * up, lean: -5 * up, nametag: false }, { arms: false, energy: 0.6 }) +
    G.tumbleweed({ x: lerp(1800, -100, tw), y: CN.floor + 4, s: 0.5, t, dir: -1 });
  let o = city(t, cam, { boss: 0.6 }, { bossSvg: boss(t, { glow: 1, ...bkMix('idle', 'roar', 0.15) }), ledge });
  o += wash('#0A0414', 0.4 * ease.inOut(up));
  o += E.bubbleAt(cam, DBX, CN.floor - 0.47 * 1050 - 10, { text: 'CLAN?!', size: 52, typed: G.chatSync(t, '09.4', { from: 3, to: 3 }), k: seg(t, B.clan2 - 0.2, B.clan2), out: seg(t, LN[4].b + 0.5, LN[4].b + 0.8), t, s: 1.2, tail: 0, user: 'xX_DarkBlade_Xx', dy: 70 });
  return o + whip(t, C.e3, 1, 0.1);
}

// F1 — "Bro, where ARE you?! We need you!" Noodle panicking on the rooftop; YOU is OFFLINE in the friends list
function friendsCard(t, k, ping) {
  if (k <= 0.001) return '';
  const kk = ease.outBack(clamp(k, 0, 1)), sh = Math.sin(t * 60) * 8 * ping;
  let c = S.rect(0, 0, 470, 150, 24, { fill: G.P.navy, opacity: 0.92, stroke: '#151515', 'stroke-width': 6 });
  c += TF('FRIENDS', 24, 40, 26, '#9FE8E0', { 'text-anchor': 'start', 'letter-spacing': 3 });
  c += G.portrait('you', 64, 98, 34, { col: '#8A8A9A' }) + S.rect(28, 62, 72, 72, 36, { fill: '#000000', opacity: 0.35 });
  c += TF('YOU', 118, 96, 32, '#C9CCD4', { 'text-anchor': 'start' }) + S.circle(124, 120, 8, { fill: '#8A8A9A' }) + TF('OFFLINE', 140, 128, 22, '#8A8A9A', { 'text-anchor': 'start' });
  if (ping > 0) c += S.g(S.rect(-80, -26, 160, 52, 26, ol('#FF4B5C', 5)) + TF('@YOU !!', 0, 10, 28, '#FFFFFF'), `translate(${f(380)} ${f(96)}) scale(${f(0.8 + 0.3 * ping)})`);
  return S.g(c, `translate(${f(40 + sh)} 60) scale(${f(kk)})`);
}
function shotF1(t) {
  const u = seg(t, C.f1, C.g1);
  let cam = camLerp(camAt(960, 590, 1.12), camAt(960, 585, 1.22), u, ease.out);
  const tc = B.need;
  cam = shook(cam, t, [[tc, 0.5, 18]]);
  const ph = (t - C.f1) * 1.4;
  const bk = (ph % 1);
  const bossSvg = boss(t, { ...bkMix('smash', 'smash', 0, Math.min(1, bk * 1.6), 0), glow: 1 });
  const hop = bump(t, tc, tc + 0.4);
  let ledge = actor('noodle', t, { x: 960 - 40 * hop, y: CN.floor - 30, s: 0.42, t, ...AC.walkFront(t * 22, 1.5), armL: 150 + 20 * Math.sin(t * 20), armR: 140 + 20 * Math.sin(t * 20 + 1), lift: 120 * hop, face: { name: 'scared', fx: ['sweat2'] }, nametag: false }, { arms: false, energy: 1.3 });
  // a block crashing down next to him
  const fall = seg(t, tc - 0.3, tc);
  if (fall > 0 && fall < 1) ledge += E.stoneCube(1320, lerp(-200, CN.floor - 60, ease.in(fall)), 150, 30 * fall, 7, 5);
  if (t >= tc) ledge += E.stoneCube(1320, CN.floor - 60 + 4 * bump(t, tc, tc + 0.2), 150, 30, 7, 5) + E.dustPuff(1320, CN.floor, t - tc, { r: 140, col: '#8A7A9A' }) + E.cubeDebris(1320, CN.floor - 40, t - tc, { n: 8, s: 0.6, floorY: CN.floor + 10, seed: 3 });
  let o = city(t, cam, { boss: 0.7 }, { bossSvg, ledge });
  o += E.bubbleAt(cam, 960 - 40 * hop + 150, CN.floor - 30 - 0.42 * 1166 - 120 * hop + 60, { ...G.chatLine(t, '09.5', { hold: 3 }), t, s: 1, tail: -0.8, user: 'NoodleBoi' });
  o += friendsCard(t, seg(t, C.f1 + 0.2, C.f1 + 0.5), bump(t, LN[5].word('ARE').t0, LN[5].word('ARE').t0 + 0.5) + bump(t, tc, tc + 0.6));
  return o + whip(t, C.f1, -1, 0.1);
}
// G — "The server health bar was dropping. Ninety percent. Fifty. Twenty." the bar over a montage of the destruction
const HP = (tt) => (tt < B.ninety ? lerp(1, 0.95, seg(tt, C.g1 + 0.6, B.ninety - 0.1)) : tt < B.fifty ? 0.9 : tt < B.twenty ? 0.5 : 0.2);
function health(t, o = {}) {
  const hit = Math.max(prog(t, B.ninety), prog(t, B.fifty), prog(t, B.twenty));
  return G.serverHealth({ value: HP(t), trail: HP(t - 0.45), hit, t, ...o });
}
function shotG1(t) {
  const u = seg(t, C.g1, C.g2);
  let cam = camLerp({ x: 0, y: -215, zoom: 0.8 }, { x: 0, y: -195, zoom: 0.87 }, u);
  const slams = [C.g1 + 0.55, C.g1 + 1.45];
  cam = shook(cam, t, slams.map((x) => [x, 0.5, 16]));
  // smash cycle: raise 0.45 s, slam 0.12 s
  let k = 0;
  for (const s0 of slams) { if (t > s0 - 0.5 && t <= s0) k = 1 - ease.in(seg(t, s0 - 0.5, s0)) * 0 - (1 - ease.in(seg(t, s0 - 0.14, s0))); if (t > s0 && t < s0 + 0.35) k = 1; }
  k = clamp(k, 0, 1);
  const bossSvg = boss(t, { pose: 'smash', k: t < slams[0] - 0.5 ? 0 : k, glow: 1 });
  let far = '';
  for (const s0 of slams) far += E.cubeDebris(SB.x, SB.y - 60, t - s0, { n: 10, s: 1.3, seed: s0, floorY: SB.y, power: 1 }) + E.shockRing(SB.x, SB.y, t - s0, 1300, { col: '#FFE0F0', w: 24 });
  let o = city(t, cam, { boss: 1 }, { bossSvg, far });
  o += health(t, { k: seg(t, C.g1 + 0.1, C.g1 + 0.5), y: 74, s: 0.78 });
  return o + whip(t, C.g1, 1, 0.1);
}
function shotG2(t) {
  const SA = GS.SPOTS.arena;
  const cam = camLerp({ x: -80, y: -120, zoom: 1.0 }, { x: -60, y: -110, zoom: 1.08 }, seg(t, C.g2, C.g3));
  const Ly = GS.arena.layers(t, cam, { time: 'night', raid: 1, crowd: 0 });
  let o = rotFrame(Ly.bg + Ly.mid + Ly.front + Ly.light, -4);
  o += wash('#2A0818', 0.25);
  o += health(t, { y: 540, s: 1.3, k: 1 });
  return o + flashAt(t, C.g2, 0.1, 0.8);
}
function shotG3(t) {
  const cam = camLerp({ x: 620, y: -40, zoom: 0.9 }, { x: 600, y: -30, zoom: 0.98 }, seg(t, C.g3, C.g4));
  const Ly = GS.tycoon.layers(t, cam, { time: 'night', granny: 3, smashed: 1, belt: 0 });
  let o = rotFrame(Ly.bg + Ly.mid + Ly.front + view(cam, E.cookieBurst(1520, 560, 3, { n: 10, s: 1.1, seed: 4, floorY: 880, life: 4 }), 1) + Ly.light, 4);
  o += wash('#2A0818', 0.3);
  o += health(t, { y: 540, s: 1.45, k: 1 });
  return o + flashAt(t, C.g3, 0.1, 0.8);
}

function shotG4(t) {
  let cam = { x: 0, y: -260, zoom: 0.8 };
  cam = shook(cam, t, [[B.twenty, 0.5, 20]]);
  const bossSvg = boss(t, { pose: 'roar', glow: 1.3 });
  let o = city(t, cam, { boss: 1 }, { bossSvg });
  o = rotFrame(o, -5);
  o += wash('#FF1E3C', 0.22 + 0.12 * Math.sin(t * 20)) + G.alarmEdges(t, 1, { rate: 4 });
  o += health(t, { y: 540, s: 1.6, k: 1 });
  return o + flashAt(t, C.g4, 0.1, 0.9, '#FFD0D8');
}
// H — the bedroom (continues SC 08): the monitor shows 20 %; "Dad... I can't win this alone." / "Then don't."
const HERO_B = { x: 1180, y: 985, s: 0.5 };
function bedroom(t, cam, chars, o = {}) {
  const Ly = H.bedroom.layers(t, { time: 'night', alarm: 0.75, clock: '11:00', door: 0.9, ...o });
  return view(cam, Ly.bg, 0.8) + view(cam, Ly.mid + Ly.front + chars + Ly.light, 1);
}
// Dad on the bed edge (SC 08 left him with his glasses off; he puts them back on with "Then don't.")
const dadBed = (t, extra = {}, act = {}) => actor('dad', t, H.seatPose(SPB.bed.sit, 1.1, { glasses: 'off', t, ...extra }), { energy: 0.8, ...act });
function shotH1(t) {
  const u = seg(t, C.h1, C.h2);
  const cam = camLerp({ zoom: 1.3, x: 60, y: 135 }, { zoom: 1.42, x: 35, y: 118 }, u, ease.out);
  const turn = lerp(0.1, -0.55, ease.inOut(seg(t, C.h1, C.h1 + 0.45)));
  const chars = dadBed(t, { face: { name: 'sad', eyes: { look: [0.7, -0.1] } }, turn: -0.2 }) + actor('you', t, { ...HERO_B, t, turn, armL: 14, armR: 14, face: { name: 'sad', eyes: { look: [-0.8, 0] } } }, { energy: 0.6 });
  return bedroom(t, cam, chars) + flashAt(t, C.h1, 0.12, 0.7, '#FFD0D8');
}
function shotH2(t) {
  const u = seg(t, C.h2, C.h3);
  const cam = camLerp(camAt(1150, 640, 2.35), camAt(1150, 630, 2.6), u, ease.out);
  const det = seg(t, LN[7].word('win').t0 - 0.2, LN[7].word('win').t0 + 0.2);
  const chars = actor('you', t, { ...HERO_B, t, turn: -0.5, armL: 14 + 20 * det, armR: 14 + 10 * det, face: det > 0.5 ? { name: 'determined', eyes: { look: [-0.7, 0], upper: 0.15 } } : { name: 'sad', eyes: { look: [-0.7, 0.2] } } }, { arms: false, energy: 0.8 });
  return bedroom(t, cam, chars);
}
function shotH3(t) {
  const u = seg(t, C.h3, C.i1);
  const cam = camLerp(camAt(860, 520, 2.3), camAt(870, 530, 2.5), u, ease.out);
  const nod = bump(t, B.dont, B.dont + 0.35);
  const gl = bump(t, B.dont - 0.28, B.dont + 0.3);
  const chars = dadBed(t, { face: { name: 'happy', eyes: { look: [0.6, 0] } }, turn: -0.05, headY: 10 * nod, glasses: t < B.dont ? 'off' : 'on', armR: 40 + 110 * gl, armL: 20 }, { arms: false });
  let o = bedroom(t, cam, chars, { alarm: 0.55 });
  const p = scr(cam, 860, 520);
  o += S.ellipse(p.x, p.y, 520, 420, { fill: '#FFC872', opacity: f(0.12 + 0.06 * nod) });
  const sk = seg(t, B.dont, B.dont + 0.6);
  if (sk > 0 && sk < 1) o += K.sparkles([[p.x + 260, p.y - 160, 34 * Math.sin(Math.PI * sk)], [p.x - 240, p.y - 60, 24 * Math.sin(Math.PI * sk)]], t);
  return o;
}
// I1 — "Mom! Grandma!" down the stairs at a run; Dad appears at the top
function stairsY(x) { return x >= 1380 ? 420 : x <= 420 ? 940 : Math.min(940, 460 + (1340 - x) * 0.5); }
function shotI1(t) {
  const u = seg(t, C.i1, C.i2);
  const hx = lerp(1560, 260, ease.inOut(u) * 0.3 + u * 0.7), hy = stairsY(hx);
  const cam = camAt(lerp(hx + 120, hx - 60, u), hy - 170, 1.45);
  const Ly = H.stairs.layers(t, { time: 'night', heroDoor: 1, heroLight: 'red' });
  let ch = actor('you', t, { x: hx, y: hy, s: 0.32, t, view: 'side', ...AC.run(t * 15), lean: 8, face: { name: 'determined' } }, { arms: false, energy: 1 });
  const du = seg(t, C.i1 + 0.55, C.i2);
  if (du > 0) { const dx = lerp(1640, 1180, du); ch += actor('dad', t, { x: dx, y: stairsY(dx), s: 0.35, t, view: 'side', ...AC.run(t * 12, 0.8), glasses: 'on', face: { name: 'determined' } }, { arms: false }); }
  let o = view(cam, Ly.mid + ch + Ly.front + Ly.light, 1);
  o += E.streaks(t, 0.6, -1, '#FFFFFF', 8, 3);
  return o + whip(t, C.i1, -1, 0.12);
}
// I2 — "The server needs us!" he bursts into the living room: Mom in pajamas with tea, Granny in curlers
function shotI2(t) {
  const u = seg(t, C.i2, C.j1);
  const cam = camLerp(camAt(1640, 620, 1.3), camAt(1520, 600, 1.38), u, ease.out);
  const run = seg(t, C.i2 - 0.2, C.i2 + 0.55);
  const hx = lerp(2120, 1535, ease.out(run));
  const stop = t > C.i2 + 0.5;
  const hero = stop ? actor('you', t, { x: hx, y: 1000, s: 0.5, t, turn: -0.3, armL: 120 + 30 * Math.sin(t * 9), armR: 130 + 30 * Math.sin(t * 9 + 1), face: { name: 'determined' }, lean: -4 * bump(t, C.i2 + 0.5, C.i2 + 0.8) }, { arms: false, energy: 1.2 })
    : actor('you', t, { x: hx, y: 1000, s: 0.5, t, view: 'side', ...AC.run(t * 15), lean: 10, face: { name: 'determined' } }, { arms: false });
  const seated = actor('mom', t, momSeat({ turn: 0.45, t, face: { name: 'neutral', eyes: { look: [0.7, 0], upper: 0.3 } } }), { arms: false, energy: 0.4 }) +
    actor('grandma', t, granSeat({ phone: 'arm', t, turn: -0.5, face: { name: 'confused', eyes: { look: [-0.4, 0.2] } } }), { arms: false, energy: 0.4 });
  let o = living(t, cam, {}, { seated, standing: hero });
  if (stop) o += E.dustPuff(scr(cam, hx + 60, 1000).x, scr(cam, hx, 1000).y, t - C.i2 - 0.5, { r: 70, col: '#C9B8A8', n: 5 });
  return o + whip(t, C.i2, -1, 0.12);
}
// J1 — "It's eleven p.m.," the wall clock ticks to 11:00
function shotJ1(t) {
  const u = seg(t, C.j1, C.j2);
  let cam = camLerp(camAt(1772, 210, 3.3), camAt(1772, 205, 3.6), u, ease.out);
  cam = shook(cam, t, [[B.eleven, 0.25, 8]]);
  let o = living(t, cam, { clock: t < B.eleven ? '10:59' : '11:00' });
  const p = scr(cam, SPL.clock.x, SPL.clock.y);
  const k = seg(t, B.eleven, B.eleven + 0.4);
  if (k > 0 && k < 1) {
    const r = SPL.clock.r * cam.zoom;
    let d = '';
    for (const a of [-0.6, -0.2, 0.2]) { d += `M${f(p.x + Math.cos(a - Math.PI / 2) * (r + 20 + 40 * k) * 1)} ${f(p.y + Math.sin(a - Math.PI / 2) * (r + 20 + 40 * k))} L${f(p.x + Math.cos(a - Math.PI / 2) * (r + 70 + 60 * k))} ${f(p.y + Math.sin(a - Math.PI / 2) * (r + 70 + 60 * k))} `; }
    o += S.path(d, { ...ln(12, '#FFFFFF'), opacity: f(1 - k) });
  }
  return o + whip(t, C.j1, 1, 0.1);
}
// Mom's stern talking mouth: small shapes only (the full lip-sync set reads as a grin with angry brows)
function sternMouth(t) {
  const v = V.viseme('MOM', t);
  if (!v || v === 'X' || v === 'A') return 'frown';
  return v === 'D' || v === 'C' ? 'O' : v === 'G' || v === 'F' ? 'line' : 'o';
}
// J2 — "young man." Mom on the couch in pajamas, tea cup, one eyebrow
function shotJ2(t) {
  const u = seg(t, C.j2, C.j3);
  const cam = camLerp(camAt(1330, 560, 2.25), camAt(1335, 555, 2.45), u, ease.out);
  const brow = bump(t, LN[10].word('young').t0 - 0.1, LN[10].word('man').t1 + 0.2);
  const seated = actor('mom', t, momSeat({ t, turn: 0.25, face: { name: 'angry', mouth: sternMouth(t), eyes: { look: [0.6, 0], upper: 0.35 + 0.1 * brow } }, headRot: -4 - 3 * brow, lean: -2 * brow }), { arms: false, energy: 0.5 });
  let o = living(t, cam, {}, { seated });
  return o;
}
// J3 — "Bedtime." over the hero's shoulder: Mom points up the stairs; he deflates
function shotJ3(t) {
  const u = seg(t, C.j3, C.k1);
  let cam = camLerp(camAt(1420, 590, 1.85), camAt(1410, 580, 2.0), u, ease.out);
  cam = punch(cam, t, B.bedtime, 0.1, 0.08);
  const pt = ease.outBack(seg(t, B.bedtime - 0.15, B.bedtime + 0.15));
  const seated = actor('mom', t, momSeat({ t, turn: 0.35, armR: lerp(20, 96, pt), lean: -3 * pt, face: { name: 'angry', mouth: sternMouth(t), eyes: { look: [0.8, -0.1] } } }), { arms: false, energy: 0.6 });
  const slump = seg(t, B.bedtime + 0.1, B.bedtime + 0.6);
  const hero = actor('you', t, { x: 1640, y: 1090, s: 0.62, t, view: 'back', armL: 14, armR: 14, bodyY: 14 * slump, headY: 10 * slump }, { arms: false });
  let o = living(t, cam, {}, { seated, standing: hero });
  o += K.bang('BEDTIME.', 470, 250, ease.outBack(seg(t, B.bedtime, B.bedtime + 0.25)), 104, -6, '#C9B8FF');
  return o;
}
// K1 — the silence: insert on the coffee table — her hand sets the tea cup down (clink) and leaves the frame
function pjArm(hx, hy, rot) {
  // an R6 pajama sleeve + hand reaching down to (hx, hy) from the upper right (world units, Mom at s .5)
  let c = S.rect(-27, -470, 54, 430, 10, ol('#B9A6E8', 6)) + S.rect(-27, -150, 54, 12, 3, { fill: '#FFF3B0', opacity: 0.8 }) + S.rect(-27, -330, 54, 12, 3, { fill: '#FFF3B0', opacity: 0.8 });
  c += S.rect(-29, -64, 58, 26, 6, ol('#9A86CC', 6)) + S.rect(-24, -42, 48, 50, 12, ol('#F6D5BC', 6)) + S.path('M-12 -8 L-12 8 M2 -6 L2 10', ln(4, '#E6BC9E'));
  return S.g(c, `translate(${f(hx)} ${f(hy)}) rotate(${f(rot)})`);
}
function shotK1(t) {
  const cam = camLerp(camAt(1300, 892, 3.1), camAt(1300, 898, 3.35), seg(t, C.k1, C.k2), ease.out);
  const dk = seg(t, C.k1, B.clink), lift = seg(t, B.clink + 0.08, C.k2 + 0.1);
  const cx = SPL.tea.x, cy = lerp(800, SPL.tea.y - 4, ease.inOut(dk));
  let top = X.teaCup({ x: cx, y: cy, s: 0.5, t, steam: 1 - 0.6 * lift });
  top += pjArm(cx + 34 + 60 * ease.in(lift), cy - 26 - 220 * ease.in(lift), 32);
  let o = living(t, cam, { tea: false }, { top });
  const ck = seg(t, B.clink, B.clink + 0.35);
  if (ck > 0 && ck < 1) { const p = scr(cam, cx, SPL.tea.y); o += S.ellipse(p.x, p.y + 20, 120 + 260 * ck, 30 + 60 * ck, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(8 * (1 - ck)), opacity: f(1 - ck) }) + K.sparkles([[p.x + 140, p.y - 140, 30 * Math.sin(Math.PI * ck)]], t); }
  return o + letterbox(1);
}
// K2 — ECU: the headset slowly lowers into frame onto her head... "...Five minutes." cold, focused; it clicks on, the cups light up
function shotK2(t) {
  const u = seg(t, C.k2, C.k3);
  let cam = camLerp(camAt(1340, 530, 3.0), camAt(1340, 528, 3.45), u, ease.inOut);
  cam = shook(cam, t, [[B.click, 0.2, 6]]);
  const hk = ease.inOut(seg(t, C.k2 - 0.05, B.click));
  const cold = seg(t, B.five - 0.12, B.five + 0.15);
  const face = cold > 0 ? { name: 'determined', eyes: { upper: 0.4 + 0.12 * cold, look: [0, 0] } } : { name: 'deadpan', eyes: { look: [0, 0.35], upper: 0.4 } };
  const seated = actor('mom', t, momSeat({ t, cup: false, headset: hk, armL: 18, armR: 18, face }), { arms: false, energy: 0.2 });
  let o = living(t, cam, { lamp: lerp(0.55, 0.1, u), glowK: 0.6 }, { seated });
  o += wash('#05030C', 0.15 + 0.3 * u);
  // the cups light up when it clicks on
  const on = seg(t, B.click, B.click + 0.3);
  if (on > 0) { const pl = scr(cam, 1340 - 100, 500), pr = scr(cam, 1340 + 100, 500); o += G.screenGlow(pl.x, pl.y, 420, 420, '#FF4FD8', 0.45 * on) + G.screenGlow(pr.x, pr.y, 420, 420, '#3DF2FF', 0.45 * on); }
  const gl = seg(t, B.click + 0.15, B.click + 0.6);
  const pg = scr(cam, 1372, 512);
  o += E.glint(pg.x, pg.y, gl, 160) + flashAt(t, B.click, 0.1, 0.25, '#FFE6FA');
  return o + letterbox(1);
}
// K3 — "Let's go." the EPIC: low angle, Mom standing, tablet up, headset blazing, rays, wind, smash-zoom
function shotK3(t) {
  const u = seg(t, C.k3, C.l1);
  let cam = camLerp(camAt(1340, 620, 1.9, -3), camAt(1340, 600, 2.15, -4), u, ease.out);
  cam = punch(cam, t, B.go, 0.12, 0.08);
  cam = shook(cam, t, [[B.go, 0.5, 14]]);
  const go = seg(t, B.go - 0.05, B.go + 0.3);
  const mom = actor('mom', t, { x: 1340, y: 1000, s: 0.5, t, pajamas: true, cup: false, headset: 1, tablet: true, tabletFace: 'back', face: { name: 'determined', eyes: { upper: 0.45 } }, lean: -2 }, { arms: false, energy: 0.5 });
  const Ly = H.livingRoom.layers(t, { time: 'night', clock: '11:00', lamp: 0, tea: true });
  let o = view(cam, Ly.bg, 0.8) + view(cam, Ly.mid + Ly.front + Ly.table, 1);
  o += wash('#08041A', 0.45);
  const pc = scr(cam, 1340, 500);
  o += K.rays(pc.x, pc.y, 18, 1400, '#FF4FD8', 0.12 + 0.18 * go, t * 12) + K.rays(pc.x, pc.y, 18, 1400, '#3DF2FF', 0.08 + 0.14 * go, -t * 9 + 10);
  o += view(cam, mom, 1);
  const tb = scr(cam, 1340, 810);
  o += G.screenGlow(tb.x, tb.y - 200, 560, 520, '#9FE8FF', 0.45);
  o += zoomLines(pc.x, pc.y, 0.4 + 0.6 * bump(t, B.go, B.go + 0.5), t, '#FFFFFF', 30, 520);
  o = rotFrame(o, cam.rot);
  o += E.embers(t, 0.8, 18, 7, ['#FF4FD8', '#3DF2FF', '#FFFFFF']);
  o += flashAt(t, B.go, 0.16, 0.55, '#FFE6FA');
  return o + letterbox(1 - seg(t, C.l1 - 0.25, C.l1));
}
// L1 — "Granny's coming, dear." knuckles crack (two pops), curlers and all
function shotL1(t) {
  const u = seg(t, C.l1, C.m1);
  let cam = camLerp(camAt(1745, 700, 1.6), camAt(1745, 690, 1.78), u, ease.out);
  cam = shook(cam, t, [[B.crack1, 0.2, 8], [B.crack2, 0.2, 8]]);
  const cr = Math.max(0.15, bump(t, B.crack1 - 0.05, B.crack1 + 0.35), bump(t, B.crack2 - 0.05, B.crack2 + 0.35));
  const gran = actor('grandma', t, { x: 1752, y: 1000, s: 0.45, t, curlers: true, cracking: cr, face: { name: 'smug', eyes: { look: [-0.3, 0] } }, bodyY: -6 * cr }, { arms: false, energy: 0.8 });
  let o = living(t, cam, { lamp: 0.2 }, { standing: gran });
  for (const tc of [B.crack1, B.crack2]) { const k = seg(t, tc, tc + 0.35); if (k > 0 && k < 1) { const p = scr(cam, 1752, 860); o += K.bang('CRACK!', p.x + (tc === B.crack2 ? -300 : 300), p.y - 120, ease.outBack(k) * (1 - seg(k, 0.7, 1)), 74, tc === B.crack2 ? 8 : -8, '#FFD21F'); } }
  return o + whip(t, C.l1, 1, 0.1);
}

// M1 — "And for the first time ever..." the living room goes dark; Dad flops onto the couch, the screens light up
function familySeated(t, o = {}) {
  const dropK = o.dadDrop ?? 1;
  const drop = (1 - ease.in(dropK)) * -170, sq = bump(dropK, 0.85, 1) * (dropK < 1 ? 1 : 0) + bump(t, (o.tDrop || 0), (o.tDrop || 0) + 0.3) * (dropK >= 1 ? 0.6 : 0);
  let s = '';
  s += actor('you', t, H.seatPose(SPL.seats.you, 1, { view: 'back', headset: true, t }), { arms: false, energy: 0 });
  s += actor('dad', t, H.seatPose(SPL.seats.dad, 1.1, { glasses: 'on', t, face: o.dadFace || { name: 'determined', eyes: { look: [0, 0.5] } }, bodyY: drop + 10 * sq, sy: 1 - 0.06 * sq, armL: 30, armR: 30 }), { arms: false, energy: 0.4 });
  s += actor('mom', t, momSeat({ cup: false, headset: 1, tablet: true, t, face: { name: 'determined', eyes: { upper: 0.4, look: [0, 0.4] } } }), { arms: false, energy: 0.3 });
  s += actor('grandma', t, granSeat({ phone: 'arm', t, face: { name: 'happy', eyes: { look: [0.6, 0] } } }), { arms: false, energy: 0.3 });
  return s;
}
const devices = (k = 1) => X.laptopOld({ ...SPL.devices.laptop, face: 'lid' }) + (k > 0 ? '' : '');
function pcGame(t, load = 1) {
  return (w, h) => {
    let o = S.rect(0, 0, w, h, 0, { fill: '#2A1450' }) + S.rect(0, h * 0.7, w, h * 0.3, 0, { fill: '#3E2370' });
    for (let i = 0; i < 9; i++) o += S.rect(i * w / 9, h * (0.45 + 0.2 * hash(i)), w / 9 - 3, h, 2, { fill: '#4A2C86' });
    o += G.cubeLogo(w / 2, h * 0.34, w / 600);
    o += S.rect(w * 0.2, h * 0.74, w * 0.6, h * 0.07, h * 0.035, { fill: '#120A24', stroke: '#FFFFFF', 'stroke-width': 2 }) + S.rect(w * 0.2, h * 0.74, w * 0.6 * clamp(load, 0, 1), h * 0.07, h * 0.035, { fill: '#17C3B2' });
    o += TF('JOINING SERVER...', w / 2, h * 0.92, h * 0.07, '#FFFFFF');
    return o;
  };
}
function shotM1(t) {
  const u = seg(t, C.m1, C.m2);
  const cam = camLerp({ zoom: 1.12, x: 170, y: 30 }, { zoom: 1.22, x: 190, y: 10 }, u, ease.out);
  const tDrop = C.m1 + 0.35;
  const dadDrop = seg(t, C.m1 + 0.05, tDrop);
  const glowK = lerp(0.2, 1, ease.inOut(seg(t, C.m1 + 0.3, C.m2)));
  const seated = familySeated(t, { dadDrop, tDrop });
  const o = living(t, cam, { lamp: lerp(0.55, 0, u), glow: 'all', glowK, pcScreen: pcGame(t, seg(t, C.m1, END)), tvScreen: pcGame(t, 0.3) }, { seated, devices: X.laptopOld({ ...SPL.devices.laptop, face: 'lid' }) });
  return o + whip(t, C.m1, -1, 0.1);
}
// M2 — "your whole family logged in." 2x2 faces in their screen light, one per word, each with its "joined" toast
function faceCard(t, who) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#0E1430' });
  if (who === 'you') {
    o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1B2B5A' });
    o += actor('you', t, { x: 960, y: 1700, s: 1.6, t, headset: true, face: { name: 'determined', eyes: { look: [0, 0.2] } }, armL: 30, armR: 30, volume: false }, { arms: false, energy: 0.3 });
    o += G.screenGlow(960, 600, 1100, 900, '#5FD8FF', 0.55, { flicker: true, t });
    o += S.rect(0, 990, 1920, 120, 0, { fill: '#0A0A14' }) + S.rect(0, 982, 1920, 14, 0, { fill: `hsl(${f((t * 120) % 360)} 90% 60%)` });
  } else if (who === 'mom') {
    o += S.rect(0, 0, 1920, 1080, 0, { fill: '#2A1640' });
    o += actor('mom', t, { x: 960, y: 1750, s: 1.45, t, pajamas: true, cup: false, headset: 1, face: { name: 'determined', eyes: { upper: 0.42, look: [0, 0.4] } }, armL: 30, armR: 30, volume: false }, { arms: false, energy: 0.3 });
    o += G.screenGlow(960, 640, 1100, 900, '#3DF2FF', 0.5, { flicker: true, t });
    o += X.tablet({ x: 960, y: 1270, s: 1.5, face: 'back', landscape: true });
  } else if (who === 'granny') {
    o += S.rect(0, 0, 1920, 1080, 0, { fill: '#3A1838' });
    o += actor('grandma', t, { x: 860, y: 1620, s: 1.6, t, curlers: true, face: { name: 'smug', eyes: { look: [0.6, 0] } }, armL: 20, armR: 20, volume: false }, { arms: false, energy: 0.3 });
    o += G.screenGlow(1100, 620, 1000, 900, '#FF8AD8', 0.5, { flicker: true, t });
    o += X.phone({ x: 1500, y: 700, s: 1.6, rot: -10, face: 'back' });
  } else {
    o += S.rect(0, 0, 1920, 1080, 0, { fill: '#142040' });
    o += actor('dad', t, { x: 960, y: 1600, s: 1.35, t, glasses: 'on', face: { name: 'determined', eyes: { look: [0, 0.3] } }, armL: 30, armR: 30, volume: false }, { arms: false, energy: 0.3 });
    o += G.screenGlow(960, 600, 1100, 900, '#9FC8FF', 0.55, { flicker: true, t });
    o += X.laptopOld({ x: 960, y: 1560, s: 1.6, face: 'lid' });
  }
  return o;
}
function shotM2(t) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#07050F' });
  const cells = [['you', 0, '#FF8A2B', 'YOU'], ['mom', 1, '#FF5FA8', 'MOM_OFFICIAL'], ['granny', 2, '#B57BFF', 'GrannyGoodies'], ['dad', 3, '#F2B705', 'DadBod1978']];
  const pw = 860, ph = 430, gx = 40, gy = 40;
  for (const [who, i, col, user] of cells) {
    const t0 = B.pan[i] - 0.1;
    const k = seg(t, t0, t0 + 0.3);
    if (k <= 0) continue;
    const x = (1920 - 2 * pw - gx) / 2 + (i % 2) * (pw + gx), y = 40 + Math.floor(i / 2) * (ph + gy);
    o += E.panel(x, y, pw, ph, faceCard(t, who), { k, col, border: 12 });
    const tk = seg(t, B.logged + i * 0.12 - 0.05, B.logged + i * 0.12 + 0.3);
    o += G.joinToast({ x: x + pw / 2, y: y + ph - 58, anchor: 'center', s: 0.78, user, k: tk, t });
  }
  return o + flashAt(t, C.m2, 0.1, 0.6);
}
// M3 — "Together." the four of them in screen light; push into the hero's monitor -> white -> Cube City
function shotM3(t) {
  const u = seg(t, C.m3, B.dive);
  let cam = camLerp({ zoom: 1.0, x: 120, y: 10 }, { zoom: 1.2, x: 60, y: -20 }, u, ease.inOut);
  const d = seg(t, B.dive, END - 0.05);
  if (d > 0) cam = camLerp(cam, camAt(217, 336, 6.0), d, ease.in);
  const seated = familySeated(t, { dadFace: { name: 'happy', eyes: { look: [0, 0.5] } } });
  let o = living(t, cam, { lamp: 0, glow: 'all', glowK: 1, pcScreen: pcGame(t, seg(t, C.m1, END - 0.2)), tvScreen: pcGame(t, 0.6) }, { seated, devices: X.laptopOld({ ...SPL.devices.laptop, face: 'lid' }) });
  const tk = seg(t, B.together - 0.05, B.together + 0.6);
  if (tk > 0 && d < 0.3) o += G.systemBanner({ theme: 'info', text: 'THE FAMILY IS ONLINE', k: tk, out: seg(t, B.dive - 0.2, B.dive + 0.1), t, y: 150, s: 0.8 });
  o += flash(seg(t, END - 0.22, END));
  return o + flashAt(t, C.m3, 0.1, 0.5);
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [C.a2, shotA1], [C.b1, shotA2], [C.b2, shotB1], [C.c1, shotB2],
  [C.c2, shotC1], [C.c3, shotC2], [C.d1, shotC3], [C.e1, shotD1],
  [C.e2, shotE1], [C.e3, shotE2], [C.f1, shotE3], [C.g1, shotF1],
  [C.g2, shotG1], [C.g3, shotG2], [C.g4, shotG3], [C.h1, shotG4],
  [C.h2, shotH1], [C.h3, shotH2], [C.i1, shotH3], [C.i2, shotI1], [C.j1, shotI2],
  [C.j2, shotJ1], [C.j3, shotJ2], [C.k1, shotJ3], [C.k2, shotK1], [C.k3, shotK2], [C.l1, shotK3],
  [C.m1, shotL1], [C.m2, shotM1], [C.m3, shotM2], [Infinity, shotM3],
];
// wide shots keep the full character shading; everything else is a close-up
const WIDE = new Set([shotA1, shotA2, shotB2, shotE2, shotI1, shotI2, shotM1, shotM3]);
function pick(t) { for (const [end, g] of SHOTS) if (t < end) return g; return shotM3; }
function scene(t) {
  const fn = pick(t);
  VOL_OFF = !WIDE.has(fn);
  return fn(t);
}
const HOUSE = new Set([shotD1, shotH1, shotH2, shotH3, shotI1, shotI2, shotJ1, shotJ2, shotJ3, shotK1, shotK2, shotK3, shotL1, shotM1, shotM2, shotM3]);
function look(t) {
  const fn = pick(t);
  if (fn === shotM2) return { grade: null, vignette: 0.5 };
  if (HOUSE.has(fn)) return { grade: null, vignette: 0.9 };
  return { grade: null, vignette: 0.75 };
}
function captionY(t) { return 1010; }

module.exports = { scene, look, captionY, TIMES: TM };
