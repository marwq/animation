// SC 10 · THE FAMILY RAID — the battlefield at the foot of the obby tower: the family spawns, "Party formed: The Family"
// (banner + party frames), the slow-motion formation walk while the server cheers; the hero's orders ("Mom, you're the
// tank. Granny, we need gear!"); Granny's sword rain + her receipt ("Put it on my tab!"); Mom's formation + helmets for the
// noobs; the giant fist on the pot-lid shield ("Mommy's got you!"); the montage (Mom blocks, the hero leads, DarkBlade
// drops in: "Just this once." + fist bump); potions ("Family discount!" — 5 %); the raid plan (Noodle left, DarkBlade right)
// and the charge -> the shield dome rises, every hit bounces, "FOOLS!"; Noodle: the crystal on top of the tower (tilt up
// 100 floors); "I can't! If I leave..." (the team falls apart in his head); "Everybody... except one." -> the hot dog alone
// at the foot of the tower in the moonlight; "Son. I've been practicing." (the real Dad | the hot dog) -> SC 11.
// Every cut and beat comes from the voice via s09_env.times10() (shared with audio/cues/gen_sc10.js).
'use strict';

const K = require('./kit');
const G = require('./gameui');
const R = require('./respawn');
const GS = require('./sets_game');
const H = require('./sets_house');
const X = require('../rig/extras');
const AC = require('./acting');
const E = require('./s09_env_wip');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const V = K.V;
const TM = E.times10(V);
const { START, END, C, B } = TM;
const { camAt, camLerp, shook, punch, rotFrame, scr, flash, flashAt, whip, letterbox, wash, zoomLines } = E;
const view = K.view;
let VOL_OFF = false;
const actor = (name, t, pose = {}, act) => K.actor(name, t, VOL_OFF && pose.volume === undefined ? { ...pose, volume: false } : pose, act);
const player = (i, pose) => K.draw.player(i, { ...pose });
const noob = (i, pose) => K.draw.kid(i, { ...pose });
const LN = TM.n;
const prog = (t, a, d = 0.4) => (t > a && t < a + d ? (t - a) / d : 0);

// ================================================================ the battlefield (tower set)
const TW = GS.SPOTS.tower;
const TB = TW.boss;                                   // (-1750, 830)
const BSZ = 0.72;                                     // boss scale (fits the dome)
const DOME = { x: TB.x, y: 860, r: 1000 };
const sAt = (y) => 0.36 * (y - 420) / 540;
const CRYS = { x: TW.crystal.x, y: TW.crystal.y - 150 };
function tower(t, cam, o = {}, { back = '', chars = '', top = '' } = {}) {
  const Ly = GS.tower.layers(t, cam, o);
  return Ly.bg + Ly.mid + view(cam, back + chars, 1) + Ly.fg + Ly.light + (top ? view(cam, top, 1) : '');
}
function boss(t, pose = {}) { return actor('boss', t, { x: TB.x, y: TB.y, s: BSZ, t, shield: pose.shield ?? 0, ...pose }); }
const domeK = (t) => (t < B.dome ? 0 : seg(t, B.dome, B.dome + 0.5));
function dome(t, o = {}) { const k = o.k ?? domeK(t); return k > 0 ? G.shieldDome({ ...DOME, t, k, hits: o.hits || [] }) : ''; }
// hand point (world) for a front-view R6 avatar at (x, y, s) with the right arm at angle a
const handW = (x, y, s, a = 60, side = 1) => [x + side * s * (100 + 250 * Math.sin((a * Math.PI) / 180)), y + s * (-515 + 250 * Math.cos((a * Math.PI) / 180))];

// the cheering server: a back row + two wings round the family's rally point (x -90), an aisle in the middle (fixed layout)
const CROWD = (() => {
  const spots = [];
  for (let i = 0; i < 9; i++) spots.push([lerp(-900, 540, i / 8), 812]);
  for (const xy of [[-960, 866], [-850, 872], [-740, 864], [-630, 874], [-920, 928], [-790, 934], [-660, 926],
    [380, 868], [470, 874], [565, 864], [640, 872], [410, 930], [530, 926], [640, 934]]) spots.push(xy);
  return spots.map(([x, y], n) => ({ n, i: 3 + ((n * 7) % 37), x: x + (hash(n * 3.7) - 0.5) * 30, y, s: sAt(y), noob: n % 4 === 2 })).sort((a, b) => a.y - b.y);
})();
function crowd(t, o = {}) {
  let s = '';
  const cheer = o.cheer ?? 1, swords = o.swords ?? 0;
  for (const c of CROWD) {
    if (o.skip && o.skip(c)) continue;
    const ph = t * 9 + c.n * 1.7, up = cheer * (0.5 + 0.5 * Math.sin(ph));
    const turn = o.turn ? o.turn(c) : (c.x < -400 ? 0.35 : c.x > 300 ? -0.35 : 0);
    const pose = { x: c.x + (o.dx ? o.dx(c) : 0), y: c.y, s: c.s, t, armL: lerp(18, 150, up * (c.n % 2 ? 1 : 0.6)), armR: o.armR ?? (swords > 0 ? 70 + 80 * up : lerp(18, 160, up)), lift: 14 * cheer * Math.abs(Math.sin(ph)), turn, nametag: false, face: o.face || (cheer > 0.3 ? 'excited' : 'happy') };
    s += c.noob ? noob(c.n % 12 + 1, pose) : player(c.i, { ...pose, sword: swords > 0 && t >= (o.swordAt?.(c) ?? 0) ? 'gold' : undefined });
  }
  return s;
}
// little cheering chat bubbles over the wings (screen space), each with a user tab
const CHEERS = ['THE FAMILY!!', 'GO MOM!!', 'is that a HOT DOG', 'GRANNY!!!', 'LETS GOOO', 'YOU IS BACK!', 'family raid??', 'w family'];
function cheers(t, t0, n, cam, seed = 1) {
  let o = '';
  const wings = CROWD.filter((c) => c.y > 850);
  for (let i = 0; i < n; i++) {
    const c = wings[(i * 5 + seed) % wings.length];
    const a = t0 + i * 0.42 + hash(i + seed) * 0.2;
    const k = seg(t, a, a + 0.25), out = seg(t, a + 1.5, a + 1.8);
    if (k <= 0 || out >= 1) continue;
    const p = scr(cam, c.x, c.y - c.s * 1050);
    if (p.x < 140 || p.x > 1780) continue;
    o += G.chatBubble({ x: p.x, y: p.y, text: CHEERS[(i + seed) % CHEERS.length], k, out, t, s: 0.78, tail: p.x < 960 ? 0.5 : -0.5, user: G.FLOOD_USERS[(i * 3 + seed) % G.FLOOD_USERS.length] });
  }
  return o;
}

// the family's battle looks
const hero = (t, p = {}, act = {}) => actor('you', t, { nametag: 'YOU', crown: true, sword: 'gold', t, ...p }, { energy: 1, ...act });
const mom = (t, p = {}, act = {}) => actor('momAvatar', t, { armor: 1, t, ...p }, { energy: 0.8, ...act });
const gran = (t, p = {}, act = {}) => actor('grandmaAvatar', t, { t, ...p }, { energy: 0.8, ...act });
const hotdog = (t, p = {}, act = {}) => actor('dadAvatar', t, { t, ...p }, { energy: 0.6, ...act });
// Noodle has no sword option: put Granny's gold sword in his right hand (blade continuing the arm)
function noodle(t, p = {}, act = {}) {
  const props = [...(p.props || [])];
  if (p.sword) {
    const a = p.armR ?? 20;
    let hx, hy, rot;
    if (p.view === 'side') { const dir = p.flip ? 1 : -1; hx = dir * 250 * Math.sin((a * Math.PI) / 180); hy = -515 + 250 * Math.cos((a * Math.PI) / 180); rot = 180 - dir * a; }
    else { hx = 100 + 250 * Math.sin((a * Math.PI) / 180); hy = -515 + 250 * Math.cos((a * Math.PI) / 180); rot = 180 - a; }
    props.push({ svg: X.goldSword({ x: hx, y: hy, s: 0.9, rot }), layer: 'front' });
  }
  const { sword, ...rest } = p;
  return actor('noodle', t, { t, ...rest, props }, { energy: 1, ...act });
}
const dark = (t, p = {}, act = {}) => actor('darkblade', t, { t, ...p }, { energy: 0.8, ...act });

// HUD for the game shots
const PARTY = (o = {}) => {
  const m = [{ name: 'YOU', role: 'leader', hp: o.hpYou ?? 1 }, { name: 'MOM_OFFICIAL', role: 'tank', hp: o.hpMom ?? 1, hit: o.momHit || 0, gold: true }, { name: 'GrannyGoodies', role: 'gear', hp: 1, heal: o.heal || 0 }, { name: 'DadBod1978', role: 'noob', hp: 1 }];
  if (o.dark) m.push({ name: 'xX_DarkBlade_Xx', role: 'rogue', hp: 1 });
  return m.map((x) => ({ ...x, heal: o.heal || x.heal }));
};
const party = (t, k = 1, o = {}) => G.partyPanel({ x: 24, y: 120, s: 0.62, k, t, members: PARTY(o) });
const bossHP = (t) => (t < B.attackSlash ? 1 : 0.96);
const bossHud = (t, o = {}) => G.bossBar({ k: o.k ?? 1, value: o.value ?? bossHP(t), trail: o.trail, shield: o.shield ?? seg(t, B.dome, B.dome + 0.6), t, y: 76, s: 0.78, hit: o.hit || 0, sub: o.sub ?? (t >= TM.n[10].b ? 'BREAK THE CRYSTAL!' : '') });

// ================================================================ SHOTS
// A1 — "Party formed." white in from SC 09: four spawn pops in the aisle of the cheering server, the party banner unfurls
const SPAWN = [{ who: 'you', x: -210, y: 880 }, { who: 'mom', x: -420, y: 884 }, { who: 'gran', x: 10, y: 878 }, { who: 'dad', x: 220, y: 882 }];
const SPAWN_COL = ['#FF8A2B', '#FF5FA8', '#B57BFF', '#F2B705'];
function famPose(t, i, x, y, s, extra = {}) {
  const w = SPAWN[i].who;
  if (w === 'you') return hero(t, { x, y, s, ...extra });
  if (w === 'mom') return mom(t, { x, y, s, ...extra });
  if (w === 'gran') return gran(t, { x, y, s, ...extra });
  return hotdog(t, { x, y, s, ...extra });
}
function shotA1(t) {
  const u = seg(t, C.a1, C.a2);
  const cam = camLerp(camAt(-100, 650, 1.22), camAt(-100, 660, 1.32), u, ease.out);
  let back = '', chars = '', top = '';
  const cheer = seg(t, B.pops[3], B.pops[3] + 0.6);
  chars += crowd(t, { cheer, face: cheer > 0.3 ? 'excited' : 'amazed' });
  SPAWN.forEach((sp, i) => {
    const s = sAt(sp.y), age = t - B.pops[i];
    back += R.respawnPop({ x: sp.x, y: sp.y, s, age, col: SPAWN_COL[i], part: 'back', height: 1400 });
    const pp = R.popPose(age, s);
    if (!pp.hidden) chars += famPose(t, i, sp.x, sp.y, s, { sx: pp.sx, sy: pp.sy, lift: pp.lift, face: i === 3 ? { name: 'amazed' } : { name: 'determined' } });
    top += R.respawnPop({ x: sp.x, y: sp.y, s, age, col: SPAWN_COL[i], part: 'front', height: 1400 });
  });
  let o = tower(t, cam, {}, { back, chars, top });
  o += G.systemBanner({ theme: 'party', text: 'PARTY FORMED', sub: 'THE FAMILY · 4 PLAYERS', k: seg(t, B.formed - 0.1, B.formed + 0.45), out: seg(t, C.a2 - 0.25, C.a2), t, y: 150, s: 0.85 });
  return o + flash(1 - seg(t, C.a1, C.a1 + 0.3));
}
// A2 — "Party name: 'The Family.'" the slow-motion formation walk down the aisle toward camera; the server cheers
function shotA2(t) {
  const u = seg(t, C.a2, C.b1);
  const wk = ease.inOut(seg(t, C.a2, C.b1 + 0.3));
  const cam = camLerp(camAt(-110, 690, 1.1, 2), camAt(-110, 760, 1.34, -2), u, ease.inOut);
  const FORM = [[-200, 0], [-420, -16], [20, -10], [235, -22]];          // x and depth offset per member (V formation)
  let chars = crowd(t, { cheer: 1 });
  const arr = FORM.map(([x, dy], i) => {
    const y = lerp(880 + dy, 1000 + dy, wk), s = sAt(y), ph = t * 4.2 + i * 0.9;
    const wf = AC.walkFront(ph, 0.9);
    const extra = { ...wf, face: i === 3 ? { name: 'happy', eyes: { look: [0.4, 0] } } : { name: 'determined' } };
    if (i === 1) Object.assign(extra, { armR: 26 + 4 * Math.sin(ph), armL: 20 });
    if (i === 3) Object.assign(extra, { armR: 120 + 30 * Math.sin(t * 7), armL: 14 });            // the hot dog waves at his fans
    return [y, () => famPose(t, i, x, y, s, extra)];
  }).sort((a, b) => a[0] - b[0]);
  for (const [, fn] of arr) chars += fn();
  let o = tower(t, cam, {}, { chars });
  o += cheers(t, C.a2 + 0.15, 6, cam, 2);
  o += E.embers(t, 1, 22, 4);
  o += party(t, seg(t, B.name - 0.1, B.name + 1.1));
  const fk = seg(t, B.family - 0.05, B.family + 0.3);
  if (fk > 0) o += G.bigTitle({ text: 'THE FAMILY', theme: 'gold', k: fk, out: seg(t, C.b1 - 0.3, C.b1), t, x: 1060, y: 190, s: 0.6, rays: false });
  return o + letterbox(1 - seg(t, C.b1 - 0.2, C.b1));
}
// B1 — "Okay! Mom, you're the tank." the hero points at Mom; CLANG on the pot lid; TANK
function shotB1(t) {
  const u = seg(t, C.b1, C.b2);
  let cam = camLerp(camAt(-300, 720, 1.95), camAt(-305, 710, 2.1), u, ease.out);
  cam = shook(cam, t, [[B.tank, 0.25, 8]]);
  const pt = ease.outBack(seg(t, LN[1].word('Mom').t0 - 0.15, LN[1].word('Mom').t0 + 0.1));
  const clang = bump(t, B.tank - 0.12, B.tank + 0.25);
  let chars = mom(t, { x: -460, y: 985, s: 0.38, turn: 0.35, shieldUp: clang > 0.2, shieldFlash: prog(t, B.tank, 0.3) > 0 ? 1 - prog(t, B.tank, 0.3) : 0, armR: lerp(30, 130, clang), face: { name: 'determined', eyes: { look: [0.6, 0] } }, nametag: false }, { arms: false });
  chars += hero(t, { x: -150, y: 990, s: 0.39, turn: -0.5, armR: 20, armL: lerp(20, 100, pt), sword: 'gold', face: { name: 'determined', eyes: { look: [-0.8, 0] } }, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { chars });
  const ps = scr(cam, -460 - 120, 985 - 0.38 * 600);
  o += G.hitSpark({ x: ps.x, y: ps.y, age: t - B.tank, s: 1.2, text: 'CLANG!' });
  o += G.stamp({ text: 'TANK', k: seg(t, B.tank + 0.05, B.tank + 0.55), x: 270, y: 330, s: 0.8, rot: -12, col: '#3FA9F5' });
  return o + whip(t, C.b1, 1, 0.1);
}
// B2 — "Granny, we need gear!" Granny grins; her money bag spits coins
function shotB2(t) {
  const u = seg(t, C.b2, C.c1);
  const cam = camLerp(camAt(60, 745, 2.0), camAt(55, 735, 2.2), u, ease.out);
  const ck = seg(t, B.gear - 0.1, B.gear + 0.8);
  let chars = gran(t, { x: 40, y: 975, s: 0.38, coins: ck, armR: 30 + 40 * bump(t, B.gear - 0.1, B.gear + 0.6), face: t > B.gear - 0.1 ? { name: 'rich' } : { name: 'smug', eyes: { look: [-0.6, 0] } }, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { chars });
  o += G.coinCounter({ x: 1880, y: 70, anchor: 'right', value: 9999999, k: seg(t, B.gear - 0.2, B.gear + 0.2), t, s: 1, bump: prog(t, B.gear, 0.45) });
  return o + whip(t, C.b2, -1, 0.1);
}
// C1 — "Swords for everyone!" Granny raises the cane: golden swords rain into every hand (one lands next to the hot dog)
const SWORD_HANDS = () => CROWD.filter((c) => !c.noob).map((c) => handW(c.x, c.y, c.s, 70));
function shotC1(t) {
  const u = seg(t, C.c1, C.c2);
  let cam = camLerp(camAt(-110, 700, 1.08), camAt(-110, 690, 1.16), u, ease.out);
  const age = t - B.swords;
  const raise = ease.outBack(seg(t, B.swords - 0.25, B.swords + 0.1));
  const thunk = B.swords + 1.25;
  cam = shook(cam, t, [[thunk, 0.25, 6]]);
  let chars = crowd(t, { cheer: 0.35 + 0.5 * seg(t, B.swords + 0.5, B.swords + 1.5), swords: 0, armR: 70, face: 'amazed' });
  chars += mom(t, { x: -450, y: 995, s: sAt(995), turn: 0.3, face: 'happy' }, { arms: false });
  chars += hero(t, { x: -210, y: 1000, s: sAt(1000), turn: 0.3, face: 'amazed', armR: 70, sword: t > B.swords + 0.9 ? 'gold' : false }, { arms: false });
  chars += gran(t, { x: 30, y: 990, s: sAt(990), turn: -0.1, armL: lerp(20, 165, raise), face: { name: 'rich' } }, { arms: false });
  const dadLook = t > thunk ? { name: 'shocked', fx: ['sweat'], eyes: { look: [0.8, 0.3] } } : { name: 'amazed', eyes: { look: [0, -0.8] } };
  chars += hotdog(t, { x: 270, y: 995, s: sAt(995), armL: 20, armR: 60, sy: 1 - 0.05 * bump(t, thunk, thunk + 0.25), face: dadLook, nametag: false }, { arms: false });
  // Dad's sword misses his hand and sticks in the floor beside him
  const sf = seg(t, thunk - 0.35, thunk);
  let top = G.swordRain({ t, age, targets: SWORD_HANDS(), s: 0.55, dur: 0.75, stagger: 1.0, y0: -260 });
  if (sf > 0) top += X.goldSword({ x: 370, y: lerp(200, 870, ease.in(sf)), s: 0.42, rot: 180 + 8 * Math.sin((t - thunk) * 40) * (1 - seg(t, thunk, thunk + 0.5)) * (t > thunk ? 1 : 0) }) + (t > thunk ? E.dustPuff(360, 1000, t - thunk, { r: 40, n: 5, col: '#8A7A9A' }) : '');
  let o = tower(t, cam, {}, { chars, top });
  const pt = scr(cam, 370, 990);
  o += G.hitSpark({ x: pt.x, y: pt.y, age: t - thunk, s: 0.8, text: 'THUNK!' });
  o += G.coinCounter({ x: 1880, y: 70, anchor: 'right', value: 9975000, from: 9999999, roll: seg(t, B.swords + 0.2, B.swords + 1.6), t, s: 1 });
  return o + whip(t, C.c1, 1, 0.1);
}
// C2 — "Put it on my tab!" Granny's receipt unrolls from her bag; then (the beat) the server raises its new swords
function shotC2(t) {
  const u = seg(t, C.c2, C.d1);
  const cam = camLerp(camAt(0, 735, 1.95), camAt(-5, 725, 2.15), u, ease.out);
  const wink = t > B.tab - 0.05 && t < B.tab + 0.5;
  let chars = crowd(t, { cheer: 1, swords: 1 });
  chars += gran(t, { x: -60, y: 985, s: sAt(985), turn: 0.2, armR: 40, face: wink ? { name: 'happy', eyes: { type: 'happy' } } : { name: 'rich' }, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { chars });
  const ph = scr(cam, -60 + 0.38 * 300, 985 - 0.38 * 380);
  o += E.receipt(ph.x + 150, 170, seg(t, LN[2].word('Put').t0, LN[2].b + 0.9), { t, len: 640, w: 280, rot: 8, lines: [['GOLD SWORD x1', '50'], ['GOLD SWORD x1', '50'], ['GOLD SWORD x1', '50'], ['GOLD SWORD x1', '50'], ['GOLD SWORD x1', '50'], ['...x500', '...'], ['TOTAL', '25,000']] });
  const sk = seg(t, LN[2].b + 0.3, C.d1);
  if (sk > 0) o += K.sparkles([[300, 320, 30 * Math.sin(Math.PI * sk)], [1560, 260, 26 * Math.sin(Math.PI * sk)], [1200, 420, 22 * Math.sin(Math.PI * seg(sk, 0.3, 1))]], t);
  o += G.coinCounter({ x: 1880, y: 70, anchor: 'right', value: 9975000, t, s: 1 });
  return o + whip(t, C.c2, -1, 0.1);
}
// D1 — "Kids! Formation!" Mom raises her sword; the scattered server snaps into neat rows beside her
function shotD1(t) {
  const u = seg(t, C.d1, C.d2);
  const cam = camLerp(camAt(-130, 720, 1.02), camAt(-150, 710, 1.1), u, ease.out);
  const snap = ease.outBack(seg(t, B.formation - 0.05, B.formation + 0.4));
  const raise = ease.outBack(seg(t, B.kids - 0.15, B.kids + 0.15));
  let chars = '';
  CROWD.forEach((c, j) => {
    const col = j % 6, row = Math.floor(j / 6);
    const fx = -390 + col * 150 + row * 24, fy = 836 + row * 40;
    const x = lerp(c.x, fx, snap), y = lerp(c.y, fy, clamp(snap, 0, 1)), s = sAt(y);
    const pose = { x, y, s, t, turn: -0.3, armR: 60 + 20 * Math.sin(t * 9 + j), armL: 20, lift: 30 * bump(t, B.formation + j * 0.02, B.formation + 0.3 + j * 0.02), nametag: false, face: snap > 0.5 ? 'determined' : 'excited' };
    chars += c.noob ? noob(c.n % 12 + 1, pose) : player(c.i, { ...pose, sword: 'gold' });
  });
  chars += mom(t, { x: -660, y: 1000, s: sAt(1000), turn: 0.45, armR: lerp(30, 165, raise), swordGlow: raise, face: { name: 'determined', eyes: { look: [0.8, 0] } } }, { arms: false });
  let o = tower(t, cam, {}, { chars });
  const fk = seg(t, B.formation, B.formation + 0.6);
  const pb = scr(cam, -660 + sAt(1000) * 340, 1000 - sAt(1000) * 1240);
  if (fk > 0 && fk < 1) o += K.C.burst(pb.x, pb.y, fk, '#FFE14D');
  o += K.bang('FORMATION!', 1240, 250, ease.outBack(seg(t, B.formation, B.formation + 0.25)) * (1 - seg(t, C.d2 - 0.15, C.d2)), 96, -5, '#FFD23F');
  return o + party(t, 1) + whip(t, C.d1, 1, 0.1);
}
// D2 — "And wear your helmets!" three noobs in a row: plop, plop, plop (the KID's propeller sticks out of his)
function shotD2(t) {
  const u = seg(t, C.d2, C.e1);
  const cam = camLerp(camAt(-60, 760, 2.3), camAt(-60, 750, 2.45), u, ease.out);
  const KIDS = [[-250, 2], [-60, 0], [130, 5]];
  const ws = [LN[3].word('wear').t0, LN[3].word('your').t0, B.helmets];
  let chars = '', top = '';
  KIDS.forEach(([x, i], j) => {
    const y = 960, s = 0.36;
    const k = seg(t, ws[j] - 0.15, ws[j] + 0.25);
    const sq = bump(t, ws[j] + 0.05, ws[j] + 0.25);
    chars += noob(i, { x, y, s, t, nametag: false, sy: 1 - 0.08 * sq, sx: 1 + 0.06 * sq, face: k >= 1 ? { name: 'happy', eyes: { type: 'happy' } } : { name: 'neutral', eyes: { look: [0, -0.8] } }, armL: 20, armR: 20 });
    top += E.helmet(x, y - s * 640, s * 1.25, k, i === 0 ? '#FFC93C' : '#C9D2DE');
  });
  let o = tower(t, cam, {}, { chars, top });
  return o + whip(t, C.d2, -1, 0.1);
}
// E1 — "Mommy's got you!" the Block King's punch comes down on the pot-lid shield: BLOCKED (wide -> smash-zoom on the hit)
const MOMX = -1210, MOMY = 900, MOMS = sAt(900);
const SHIELD = [MOMX - MOMS * 205, MOMY - MOMS * 702];            // the pot lid's centre with armL 150 (world)
const PUNCH = { a: 30, b: 0 };                                        // boss right arm angle / bend that lands the fist on the lid
// the boss's right arm punching at each hit time (wind-up, strike, hold on the lid, retract) -> freeArms pose
function punchPose(t, hits, hold = 0.25) {
  let a = 40, b = 30, lean = 0;
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i], s0 = i ? Math.max(hits[i - 1] + hold, h - 0.5) : h - 0.5;
    if (t < s0) break;
    const ws = Math.min(h - 0.13, s0 + 0.35);
    if (t < ws) { const w = ease.out(seg(t, s0, ws)); a = lerp(i ? PUNCH.a : 40, 150, w); b = lerp(i ? PUNCH.b : 30, 50, w); lean = -3 * w; }
    else if (t < h - 0.13) { a = 150; b = 50; lean = -3; }
    else if (t < h) { const k = ease.in(seg(t, h - 0.13, h)); a = lerp(150, PUNCH.a, k); b = lerp(50, PUNCH.b, k); lean = lerp(-3, 5, k); }
    else if (t < h + hold) { a = PUNCH.a + 1.5 * Math.sin(t * 40); b = PUNCH.b; lean = 5; }
    else { const k = ease.inOut(seg(t, h + hold, h + hold + 0.4)); a = lerp(PUNCH.a, 40, k); b = lerp(PUNCH.b, 30, k); lean = 5 * (1 - k); }
  }
  return { freeArms: true, armR: a, bendR: b, armL: 30, bendL: 40, lean, jaw: 0.55 };
}
// the noobs hiding behind Mom (they flinch at every hit)
const HIDERS = [[-1090, 912, 0], [-1010, 944, 3], [-930, 918, 7]];
function hiders(t, hits, o = {}) {
  let s = '';
  HIDERS.forEach(([x, y, i], j) => {
    const fl = Math.max(0, ...hits.map((h) => bump(t, h, h + 0.3)));
    s += noob(i, { x: x + (o.dx || 0), y, s: sAt(y) * 1.05, t, turn: -0.3, armL: 160 - 20 * fl, armR: 165 - 20 * fl, sy: 1 - 0.1 * fl, bodyY: 10 * fl, nametag: false, face: { name: 'scared', fx: j === 1 ? ['sweat2'] : [] } });
  });
  return s;
}
function momTank(t, hits, o = {}) {
  const up = ease.outBack(seg(t, o.up ?? LN[4].a - 0.15, (o.up ?? LN[4].a - 0.15) + 0.3));
  const sq = Math.max(0, ...hits.map((h) => bump(t, h, h + 0.25)));
  const fl = Math.max(0, ...hits.map((h) => (t > h && t < h + 0.35 ? 1 - (t - h) / 0.35 : 0)));
  return mom(t, { x: MOMX + 10 * sq, y: MOMY, s: MOMS, turn: o.turn ?? -0.3, shieldUp: true, armL: lerp(24, 150, up), shieldFlash: fl, sy: 1 - 0.07 * sq, sx: 1 + 0.05 * sq, lean: 6 * sq, face: o.face || { name: 'determined', eyes: { look: [-0.6, -0.5] } }, nametag: false }, { arms: false });
}
function blockFx(cam, t, h, big = 1) {
  const age = t - h;
  if (age < 0) return '';
  const p = scr(cam, SHIELD[0], SHIELD[1]);
  return E.impactStar(p.x, p.y, age, 240 * big) + G.hitSpark({ x: p.x, y: p.y, age: age - 0.02, s: 1.3 * big }) + G.damageNumber({ x: p.x - 40, y: p.y - 150 * big, age, text: 'BLOCKED!', crit: true, s: big });
}
function shotE1(t) {
  const h = B.block;
  const zk = ease.out(seg(t, h - 0.08, h + 0.06));
  let cam = camLerp(camAt(-1400, 470, 0.84), camAt(-1250, 690, 1.5), zk, (x) => x);
  cam = { ...cam, zoom: cam.zoom * (1 + 0.04 * seg(t, h + 0.06, C.e2)) };
  cam = shook(cam, t, [[h, 0.6, 26]]);
  const back = boss(t, { ...punchPose(t, [h], 2), face: { name: 'angry', mouth: 'O' } });
  let chars = hiders(t, [h]) + momTank(t, [h]);
  const age = t - h;
  const top = E.shockRing(MOMX, MOMY, age, 520, { col: '#FFE9A8', w: 18 }) + E.dustPuff(MOMX, MOMY, age, { r: 90, col: '#8A7A9A', n: 7 }) + E.cubeDebris(SHIELD[0] - 30, SHIELD[1], age, { n: 10, s: 0.5, floorY: MOMY + 10, seed: 3 });
  let o = tower(t, cam, {}, { back, chars, top });
  o += blockFx(cam, t, h, 1.1);
  if (t < h - 0.08) o += zoomLines(scr(cam, SHIELD[0], SHIELD[1]).x, scr(cam, SHIELD[0], SHIELD[1]).y, seg(t, h - 0.5, h - 0.08) * 0.6, t, '#FFFFFF', 22, 300);
  return o + flashAt(t, h, 0.12, 0.7) + whip(t, C.e1, -1, 0.1);
}
// E2 — "Everybody behind me!" the fist keeps pressing, Mom holds; the server scrambles behind her; a sweet look back
function shotE2(t) {
  const u = seg(t, C.e2, C.f1);
  let cam = camLerp(camAt(-1030, 690, 1.16), camAt(-1060, 690, 1.24), u, ease.out);
  cam = { ...cam, sx: Math.sin(t * 50) * 3, sy: Math.cos(t * 43) * 3 };
  const lookBack = seg(t, LN[4].word('behind').t0 - 0.1, LN[4].word('behind').t0 + 0.35);
  const back = boss(t, { ...punchPose(t, [B.block], 9), face: { name: 'angry', mouth: 'teeth' } });
  let chars = '';
  CROWD.slice(0, 12).forEach((c, j) => {
    const r = seg(t, C.e2 + j * 0.06, C.e2 + 0.85 + j * 0.06);
    const x1 = -1120 + (j % 4) * 75 + Math.floor(j / 4) * 70, y = 842 + (j % 4) * 11 + Math.floor(j / 4) * 4;
    const x = lerp(-120 - (j % 3) * 90, x1, ease.out(r)), s = sAt(y);
    const hide = r >= 1;
    const pose = { x, y, s, t, view: hide ? 'front' : 'side', turn: hide ? -0.3 : 0, ...(hide ? {} : AC.run(t * 16 + j)), armL: 160, armR: 160, sy: hide ? 0.92 : 1, nametag: false, face: { name: 'scared' } };
    chars += c.noob ? noob(c.n % 12 + 1, pose) : player(c.i, pose);
  });
  chars += hiders(t, []);
  chars += momTank(t, [], { up: C.e2 - 1, turn: lerp(-0.3, 0.55, lookBack), face: lookBack > 0.4 ? { name: 'happy', eyes: { type: 'happy' }, fx: ['blush'] } : { name: 'determined', eyes: { look: [-0.6, -0.5] } } });
  let o = tower(t, cam, {}, { back, chars });
  const ph = scr(cam, SHIELD[0], SHIELD[1]);
  const fr = Math.floor(t * 12);
  if (fr % 3 === 0) o += G.hitSpark({ x: ph.x - 30, y: ph.y - 20, age: ((t * 12) % 1) * 0.3, s: 0.7, seed: fr });
  const hk = seg(t, LN[4].word('behind').t0 + 0.1, LN[4].word('behind').t0 + 0.6);
  if (hk > 0) { const pm = scr(cam, MOMX + 30, MOMY - MOMS * 1300); o += G.emoteHearts({ x: pm.x, y: pm.y, age: t - LN[4].word('behind').t0 - 0.1, n: 6, s: 0.8, seed: 3 }); }
  return o + bossHud(t) + party(t, 1, { momHit: 0.3 + 0.3 * Math.sin(t * 20), hpMom: 0.86 }) + whip(t, C.e2, 1, 0.1);
}
// F1 — "Mom blocked the punches." punch, punch: two blocks from two angles (whip between)
function shotF1(t) {
  const h1 = B.blocked + 0.05, h2 = B.punches + 0.05, mid = lerp(h1, h2, 0.55);
  const second = t >= mid;
  const tHit = second ? h2 : h1;
  let cam = second ? camAt(-1240, 690, 1.95, 5) : camAt(-1330, 600, 1.35, -4);
  cam = punch(cam, t, tHit, 0.07, 0.08);
  cam = shook(cam, t, [[tHit, 0.4, 20]]);
  const back = boss(t, { ...punchPose(t, [h1, h2], 0.12), face: { name: 'angry', mouth: 'teeth' } });
  let chars = hiders(t, [h1, h2]) + momTank(t, [h1, h2], { up: C.f1 - 1 });
  let o = tower(t, cam, {}, { back, chars });
  o += blockFx(cam, t, tHit, second ? 1.2 : 1);
  o = rotFrame(o, cam.rot);
  return o + bossHud(t) + party(t, 1, { momHit: prog(t, tHit, 0.4), hpMom: 0.82 }) + whip(t, C.f1, 1, 0.1) + whip(t, mid, -1, 0.08);
}
// F2 — "You led the attack." the hero charges with the army behind him; slash on the boss's leg
function shotF2(t) {
  const hx = lerp(-650, -1440, ease.inOut(seg(t, C.f2, B.attackSlash)));
  let cam = camAt(hx - 120, 660, 1.12);
  cam = shook(cam, t, [[B.attackSlash, 0.4, 16]]);
  const hs = sAt(990);
  const atk = t >= B.attackSlash - 0.12;
  let chars = '';
  for (let j = 0; j < 9; j++) {
    const c = CROWD[j * 2];
    const x = hx + 220 + j * 120 + 30 * Math.sin(j), y = 900 + (j % 3) * 35, s = sAt(y);
    chars += (c.noob ? noob : player)(c.noob ? c.n % 12 + 1 : c.i, { x, y, s, t, view: 'side', ...AC.run(t * 16 + j), armR: 150, sword: c.noob ? undefined : 'gold', nametag: false, face: { name: 'determined', mouth: 'scream' } });
  }
  const sw = atk ? ease.out(seg(t, B.attackSlash - 0.12, B.attackSlash + 0.05)) : 0;
  chars += hero(t, { x: hx, y: 990, s: hs, view: 'side', ...(atk ? {} : AC.run(t * 16)), armR: atk ? lerp(160, 30, sw) : 150, armL: atk ? -40 : undefined, lean: 8, face: { name: 'determined', mouth: 'scream' }, nametag: false }, { arms: false });
  const back = boss(t, t > B.attackSlash ? { pose: 'hit' } : { ...punchPose(t, [C.f2 - 2], 0) });
  let o = tower(t, cam, {}, { back, chars });
  const pS = scr(cam, -1600, 780);
  o += G.slash({ x: pS.x, y: pS.y, age: t - B.attackSlash + 0.06, angle: 200, s: 1.3, col: '#FFD23F' }) + G.hitSpark({ x: pS.x - 30, y: pS.y, age: t - B.attackSlash, s: 1.3 }) + G.damageNumber({ x: pS.x - 60, y: pS.y - 140, age: t - B.attackSlash, value: -250, crit: true });
  o += E.streaks(t, 0.7, 1, '#FFFFFF', 10, 5);
  return o + bossHud(t, { value: t < B.attackSlash ? 1 : 0.96, trail: t < B.attackSlash + 0.5 ? 1 : 0.96, hit: prog(t, B.attackSlash, 0.4) }) + whip(t, C.f2, -1, 0.1);
}
// F3 — "Even DarkBlade joined your team." DarkBlade drops out of the sky beside the hero; he joins the party
const HX = -980, DBX2 = -760;
function shotF3(t) {
  const u = seg(t, C.f3, C.f4);
  let cam = camLerp(camAt(-870, 690, 1.6), camAt(-870, 680, 1.72), u, ease.out);
  cam = shook(cam, t, [[B.dbLand, 0.4, 18]]);
  const fall = seg(t, C.f3, B.dbLand);
  const hs = sAt(990);
  let chars = hero(t, { x: HX, y: 990, s: hs, turn: 0.4, armR: 40, face: t > B.dbLand ? { name: 'shocked', eyes: { look: [0.8, 0] } } : { name: 'determined', eyes: { look: [-0.6, 0] } } }, { arms: false });
  const ly = lerp(-300, 990, ease.in(fall));
  const sq = bump(t, B.dbLand, B.dbLand + 0.3);
  chars += dark(t, { x: DBX2, y: ly, s: sAt(990), turn: -0.3, sy: 1 - 0.12 * sq, sx: 1 + 0.1 * sq, bodyY: 30 * sq, armR: 60, armL: 40, nametag: t > B.joined ? 'xX_DarkBlade_Xx' : false }, { arms: false });
  const top = E.dustPuff(DBX2, 990, t - B.dbLand, { r: 130, col: '#6B5A80' }) + E.shockRing(DBX2, 990, t - B.dbLand, 600, { col: '#FF4B5C', w: 16 });
  let o = tower(t, cam, {}, { back: boss(t, {}), chars, top });
  o += G.joinToast({ x: 960, y: 200, anchor: 'center', s: 1.05, user: 'xX_DarkBlade_Xx', text: 'joined the party', k: seg(t, B.joined - 0.1, B.joined + 0.3), out: seg(t, C.f4 + 0.6, C.f4 + 0.9), t });
  return o + party(t, 1, { dark: t > B.joined }) + whip(t, C.f3, 1, 0.1);
}
// F4 — the beat: the two rivals look at each other; DarkBlade slowly holds out a fist
function shotF4(t) {
  const u = seg(t, C.f4, C.g1);
  const cam = camLerp(camAt(-870, 700, 2.0), camAt(-870, 705, 2.3), u, ease.inOut);
  const ext = ease.inOut(seg(t, C.f4 + 0.8, C.g1));
  let chars = hero(t, { x: HX, y: 990, s: sAt(990), turn: 0.55, armR: 30, sword: false, face: { name: 'deadpan', eyes: { look: [0.8, 0], upper: 0.35 } }, nametag: false }, { arms: false });
  chars += dark(t, { x: DBX2, y: 990, s: sAt(990), turn: -0.55, armL: lerp(20, 80, ext), armR: 30, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { back: boss(t, {}), chars });
  return o + letterbox(1) + whip(t, C.f4, -1, 0.08);
}
// G1 — "Just this once." DarkBlade close-up; the fist bump
function shotG1(t) {
  const u = seg(t, C.g1, C.h1);
  let cam = camLerp(camAt(-860, 715, 2.45), camAt(-870, 712, 2.7), u, ease.inOut);
  const bk = t >= B.bump;
  let chars = dark(t, { x: DBX2, y: 990, s: sAt(990), turn: -0.45, armL: 80, armR: 30, nametag: false, headRot: t < LN[6].b ? -6 : 0 }, { arms: false });
  const hin = ease.out(seg(t, B.bump - 0.35, B.bump));
  chars += hero(t, { x: HX, y: 990, s: sAt(990), turn: 0.55, armR: lerp(20, 80, hin), sword: false, face: { name: bk ? 'smug' : 'deadpan', eyes: { look: [0.8, 0] } }, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { back: boss(t, {}), chars });
  o += E.bubbleAt(cam, DBX2 + 30, 990 - sAt(990) * 1050, { ...G.chatLine(t, '10.6', { hold: 2 }), t, s: 1.15, tail: 0, user: 'xX_DarkBlade_Xx' });
  const pb = scr(cam, (HX + DBX2) / 2, 990 - sAt(990) * 470);
  const ba = t - B.bump;
  if (ba > 0) o += G.hitSpark({ x: pb.x, y: pb.y, age: ba, s: 1.4, text: 'BUMP!' }) + E.glint(pb.x, pb.y - 40, seg(ba, 0, 0.5), 110);
  return o + letterbox(1 - seg(t, C.h1 - 0.2, C.h1));
}
// H1 — "Healing potions! A hundred of them!" Granny hurls potions over the server: pop, pop, pop, +HP; the party heals
function shotH1(t) {
  const u = seg(t, C.h1, C.h2);
  const cam = camLerp(camAt(-170, 690, 1.08), camAt(-150, 680, 1.16), u, ease.out);
  const thr = Math.sin(t * 14);
  let chars = crowd(t, { cheer: 0.6, swords: 1, skip: (c) => c.x < -560 && c.y > 850 });
  chars += mom(t, { x: -780, y: 990, s: sAt(990), turn: 0.3, shieldUp: true, face: 'happy' }, { arms: false });
  chars += hero(t, { x: -600, y: 1000, s: sAt(1000), turn: 0.3, armR: 60, face: { name: 'happy', eyes: { look: [0.6, -0.4] } } }, { arms: false });
  chars += gran(t, { x: -380, y: 995, s: sAt(995), turn: 0.15, armR: 90 + 60 * thr, coins: 0.4, face: { name: 'excited' } }, { arms: false });
  let top = '';
  const t0 = B.potions - 0.2;
  const tg = CROWD.filter((c) => c.x > -560 || c.y < 850);
  const hand = [-380 + sAt(995) * 330, 995 - sAt(995) * 640];
  for (let i = 0; i < 16; i++) {
    const a0 = t0 + i * 0.15;
    const c = tg[(i * 5) % tg.length];
    const [ex, ey] = [c.x, c.y - c.s * 1100];
    const fly = seg(t, a0, a0 + 0.45);
    if (fly > 0 && fly < 1) { const px = lerp(hand[0], ex, fly), py = lerp(hand[1], ey, fly) - 260 * Math.sin(Math.PI * fly); top += X.potion({ x: px, y: py, s: 0.4, rot: fly * 540, t }); }
    top += G.potionPop({ x: ex, y: ey, age: t - (a0 + 0.45), s: 0.62, seed: i });
  }
  // the family drinks too: green pluses over Mom and the hero on "hundred"
  top += G.potionPop({ x: -780, y: 990 - sAt(990) * 1300, age: t - B.hundred, s: 0.7, seed: 21 }) + G.potionPop({ x: -600, y: 1000 - sAt(1000) * 1150, age: t - B.hundred - 0.15, s: 0.7, seed: 22 });
  let o = tower(t, cam, {}, { chars, top });
  o += K.bang('x100!', 1500, 260, ease.outBack(seg(t, B.hundred, B.hundred + 0.25)) * (1 - seg(t, C.h2 - 0.15, C.h2)), 110, 8, '#5CFF8A');
  return o + party(t, 1, { dark: true, heal: bump(t, B.hundred, B.hundred + 1.2) }) + whip(t, C.h1, 1, 0.1);
}
// H2 — "Family discount!" Granny holds up the deal: FAMILY DISCOUNT 5% OFF (stamp); the hero's deadpan
function shotH2(t) {
  const u = seg(t, C.h2, C.i1);
  const cam = camLerp(camAt(-560, 700, 2.05), camAt(-560, 690, 2.2), u, ease.out);
  let chars = hero(t, { x: -700, y: 995, s: sAt(995), turn: 0.45, armR: 30, face: t > B.discount + 0.3 ? { name: 'deadpan', eyes: { look: [0.8, 0], upper: 0.4 } } : { name: 'happy', eyes: { look: [0.8, 0] } }, nametag: false }, { arms: false });
  chars += gran(t, { x: -460, y: 990, s: sAt(990), turn: -0.3, armR: 140, coins: 0.2, face: { name: 'smug', eyes: { type: t > B.discount ? 'happy' : undefined } }, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { chars });
  o += G.stamp({ text: 'FAMILY DISCOUNT', k: seg(t, B.discount - 0.1, B.discount + 0.35), x: 1230, y: 300, s: 0.62, rot: -8, col: '#B57BFF' });
  const k2 = seg(t, B.discount + 0.35, B.discount + 0.7);
  if (k2 > 0) o += S.g(S.rect(-130, -50, 260, 100, 24, ol('#FF4B5C', 7)) + T('5% OFF', 0, 22, 62, '#FFFFFF', { stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' }), `translate(1480 430) rotate(8) scale(${f(ease.outBack(k2))})`);
  return o + whip(t, C.h2, -1, 0.1);
}
// I1/I2 — "Noodle, left side! DarkBlade, right side!" the RAID PLAN: a tactical map next to the hero giving orders
function raidMap(t, k, o = {}) {
  if (k <= 0.001) return '';
  const kk = ease.outBack(clamp(k, 0, 1));
  const w = 760, h = 560;
  let c = S.rect(0, 0, w, h, 34, { fill: '#10203A', opacity: 0.94, stroke: '#151515', 'stroke-width': 8 }) + S.rect(10, 10, w - 20, h - 20, 26, { fill: 'none', stroke: '#17C3B2', 'stroke-width': 4, opacity: 0.8 });
  let grid = '';
  for (let i = 1; i < 8; i++) grid += `M${f((i * w) / 8)} 70 V${h - 20} `;
  for (let j = 1; j < 6; j++) grid += `M20 ${f(70 + (j * (h - 90)) / 6)} H${w - 20} `;
  c += S.path(grid, ln(2, '#2E5A7A'));
  c += S.rect(20, 18, 300, 46, 23, ol('#17C3B2', 5)) + TF('RAID PLAN', 170, 52, 30, '#FFFFFF');
  const bx = w / 2, by = 230;
  c += S.ellipse(bx, by, 150, 120, { fill: '#C77DFF', opacity: 0.22, stroke: '#C77DFF', 'stroke-width': 5, 'stroke-dasharray': '14 10' });
  c += G.portrait('boss', bx, by, 62);
  // the family at the bottom
  const fam = [['you', bx, 470], ['mom', bx - 110, 450], ['granny', bx + 110, 455]];
  for (const [who, x, y] of fam) c += G.portrait(who, x, y, 34);
  // Noodle -> left flank, DarkBlade -> right flank (curved arrows drawn on with nl / dr 0..1)
  const flank = (side, u, who, col, label) => {
    if (u <= 0) return '';
    const x0 = bx + side * 60, y0 = 450, cx = bx + side * 330, cy = 430, x1 = bx + side * 230, y1 = 210;
    const q = (v) => [(1 - v) * (1 - v) * x0 + 2 * (1 - v) * v * cx + v * v * x1, (1 - v) * (1 - v) * y0 + 2 * (1 - v) * v * cy + v * v * y1];
    let d = '';
    const n = 18;
    for (let i = 0; i <= n * u; i++) { const [px, py] = q(i / n); d += (i ? 'L' : 'M') + f(px) + ' ' + f(py); }
    const [hx, hy] = q(u);
    let s = S.path(d, { fill: 'none', stroke: col, 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-dasharray': '2 22' });
    s += G.portrait(who, hx, hy, 40, { col });
    if (u >= 1) s += S.g(S.rect(-90, -24, 180, 48, 24, ol(col, 5)) + TF(label, 0, 10, 26, '#FFFFFF'), `translate(${f(x1 + side * 10)} ${f(y1 - 78)})`);
    return s;
  };
  c += flank(-1, o.nl || 0, 'noodle', '#17C3B2', 'LEFT SIDE');
  c += flank(1, o.dr || 0, 'darkblade', '#FF4B5C', 'RIGHT SIDE');
  if (o.all > 0) {
    let d = '';
    for (const [x, y] of [[bx - 230, 210], [bx + 230, 210], [bx, 420]]) { const ex = lerp(x, bx, ease.in(o.all)), ey = lerp(y, by, ease.in(o.all)); d += `M${f(x)} ${f(y)} L${f(ex)} ${f(ey)} `; }
    c += S.path(d, { fill: 'none', stroke: '#FFD23F', 'stroke-width': 16, 'stroke-linecap': 'round', opacity: 0.9 });
  }
  return S.g(c, `translate(${f(o.x ?? 120)} ${f(o.y ?? 200)}) rotate(-3) scale(${f(kk)})`);
}
function orderShot(t, side) {
  const t0 = side < 0 ? C.i1 : C.i2, t1 = side < 0 ? C.i2 : C.i3;
  const u = seg(t, t0, t1);
  const cam = camLerp(camAt(-700, 660, 2.0, side * 3), camAt(-700, 650, 2.15, side * 3), u, ease.out);
  const pt = ease.outBack(seg(t, t0 + 0.05, t0 + 0.35));
  let chars = hero(t, { x: -700, y: 995, s: sAt(995), turn: side * 0.4, armL: side < 0 ? lerp(20, 95, pt) : 20, armR: side > 0 ? lerp(20, 95, pt) : 30, sword: side > 0 ? 'gold' : 'gold', face: { name: 'determined', eyes: { look: [side * 0.8, 0] } }, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { chars });
  o = rotFrame(o, cam.rot);
  o += raidMap(t, seg(t, C.i1, C.i1 + 0.35), { x: side < 0 ? 1080 : 80, y: 170, nl: seg(t, B.left - 0.2, B.left + 0.45), dr: seg(t, B.right - 0.2, B.right + 0.45) });
  o += E.arrowSign(side < 0 ? 380 : 1540, 850, side, seg(t, (side < 0 ? B.left : B.right) - 0.1, (side < 0 ? B.left : B.right) + 0.2), side < 0 ? 'LEFT SIDE' : 'RIGHT SIDE', side < 0 ? '#17C3B2' : '#FF4B5C', t);
  return o + whip(t, t0, -side, 0.1);
}
const shotI1 = (t) => orderShot(t, -1);
const shotI2 = (t) => orderShot(t, 1);
// I3 — "Everybody, ATTACK!" the whole server charges the Block King (Noodle's squad from the left, DarkBlade's from the right)
function charger(t, j, x0, x1, y, dir, t0, kind, dur = 2.2) {
  const r = seg(t, t0, t0 + dur);
  const x = lerp(x0, x1, r), s = sAt(y);
  const pose = { x, y, s, t, view: 'side', flip: dir > 0, ...AC.run(t * 16 + j), armR: 150, nametag: false, face: { name: 'determined', mouth: 'scream' } };
  if (kind === 'noodle') return noodle(t, { ...pose, sword: true }, { arms: false });
  if (kind === 'dark') return dark(t, pose, { arms: false });
  if (kind === 'clan') return actor('clan', t, { ...pose, i: j % 5 }, { arms: false });
  const c = CROWD[j % CROWD.length];
  return c.noob ? noob(c.n % 12 + 1, pose) : player(c.i, { ...pose, sword: 'gold' });
}
function shotI3(t) {
  const u = seg(t, C.i3, C.j1);
  let cam = camLerp(camAt(-1150, 430, 0.7), camAt(-1190, 440, 0.76), u, ease.out);
  cam = punch(cam, t, B.attack, 0.06, 0.08);
  cam = shook(cam, t, [[B.attack, 0.5, 16]]);
  const go = LN[8].word('Everybody').t0;
  let chars = '';
  const ys = [870, 905, 940, 975, 1005];
  // right flank (DarkBlade + clan + players), running left toward the boss
  for (let j = 0; j < 10; j++) chars += charger(t, j, -260 + (j % 5) * 110 + Math.floor(j / 5) * 60, -1000 + (j % 5) * 90, ys[j % 5], -1, go + j * 0.05, j === 2 ? 'dark' : j % 3 === 0 ? 'clan' : 'p');
  // left flank (Noodle + players), running right
  for (let j = 0; j < 6; j++) chars += charger(t, 20 + j, -2950 + (j % 3) * 120, -2450 + (j % 3) * 90, ys[(j + 1) % 5], 1, go - 0.3 + j * 0.06, j === 1 ? 'noodle' : 'p');
  // the family in front
  const fr = seg(t, go, go + 2.2);
  chars += mom(t, { x: lerp(-420, -1000, fr), y: 990, s: sAt(990), view: 'side', ...AC.run(t * 14), shieldUp: true, nametag: false }, { arms: false });
  chars += hero(t, { x: lerp(-250, -860, fr), y: 1002, s: sAt(1002), view: 'side', ...AC.run(t * 16), armR: 160, nametag: false, face: { name: 'determined', mouth: 'scream' } }, { arms: false });
  chars += gran(t, { x: lerp(-60, -620, fr * 0.8), y: 985, s: sAt(985), view: 'side', ...AC.run(t * 12, 0.7), armL: 150, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { back: boss(t, { pose: 'roar' }), chars });
  o += K.bang('ATTACK!', 1430, 330, ease.outBack(seg(t, B.attack, B.attack + 0.25)) * (1 - seg(t, C.j1 - 0.2, C.j1)), 150, -6, '#FFD23F');
  o += E.streaks(t, 0.5, -1, '#FFFFFF', 8, 9);
  return o + bossHud(t) + whip(t, C.i3, 1, 0.12);
}
// the attackers pressed against both sides of the dome; each bounces back when its hit lands (hits: [{side, age}] per fighter)
const EDGE_R = [[-800, 905, 'hero'], [-860, 975, 'mom'], [-700, 950, 'dark'], [-640, 880, 'p', 9], [-760, 1005, 'p', 14], [-600, 990, 'clan']];
const EDGE_L = [[-2690, 900, 'noodle'], [-2760, 965, 'p', 4], [-2630, 1000, 'gran'], [-2800, 880, 'p', 18]];
function edgeFighters(t, ageOf, o = {}) {
  let s = '';
  const draw = (arr, side) => arr.forEach(([x, y, k, i], j) => {
    const a = ageOf(side, j), kb = a > 0 && a < 0.65 ? Math.sin(Math.PI * a / 0.65) : 0;
    const sw = o.swing ? Math.sin(t * 9 + j * 1.3) : 0;
    const pose = { x: x + (side > 0 ? 1 : -1) * 130 * kb, y, s: sAt(y), t, view: 'side', flip: side < 0, armR: (k === 'gran' ? undefined : 150 - 110 * kb + 30 * sw), lift: 70 * kb, rot: (side > 0 ? 12 : -12) * kb, nametag: false, face: kb > 0.25 ? { name: 'dizzy' } : { name: 'determined', mouth: 'scream' } };
    if (k === 'hero') s += hero(t, { ...pose, face: kb > 0.25 ? { name: 'shocked' } : pose.face }, { arms: false });
    else if (k === 'mom') s += mom(t, { ...pose, shieldUp: true }, { arms: false });
    else if (k === 'dark') s += dark(t, pose, { arms: false });
    else if (k === 'clan') s += actor('clan', t, { ...pose, i: 1 }, { arms: false });
    else if (k === 'noodle') s += noodle(t, { ...pose, sword: true }, { arms: false });
    else if (k === 'gran') s += gran(t, { ...pose, armL: 120 + 40 * sw, face: kb > 0.25 ? { name: 'dizzy' } : { name: 'angry' } }, { arms: false });
    else s += player(i, { ...pose, sword: 'gold' });
  });
  draw(EDGE_L, -1); draw(EDGE_R, 1);
  return s;
}
// points on the dome where swords land: side +1 = right, a = elevation (deg)
const domePt = (side, a) => [DOME.x + side * DOME.r * Math.cos((a * Math.PI) / 180), DOME.y - DOME.r * Math.sin((a * Math.PI) / 180)];
// J1 — the dome rises out of the ground as the charge lands; every hit bounces off: IMMUNE, IMMUNE, IMMUNE
function shotJ1(t) {
  const u = seg(t, C.j1, C.k1);
  let cam = camLerp(camAt(-1720, 420, 0.7), camAt(-1730, 400, 0.76), u, ease.out);
  cam = shook(cam, t, [[B.dome, 0.5, 18], ...B.hits.map((h) => [h, 0.2, 8])]);
  const HT = B.hits.map((h, i) => ({ h, side: i % 2 ? -1 : 1, j: Math.floor(i / 2), a: [14, 24, 9][Math.floor(i / 2) % 3] }));
  const ageOf = (side, j) => { const e = HT.find((q) => q.side === side && q.j === j); return e ? t - e.h : -1; };
  const hits = HT.filter((q) => t > q.h - 0.01).map((q) => { const [x, y] = domePt(q.side, q.a); return { x, y, age: t - q.h }; });
  const back = boss(t, { pose: 'idle', shield: domeK(t), face: t > B.dome ? { name: 'smug' } : { name: 'angry' } }) + dome(t, { hits });
  let o = tower(t, cam, {}, { back, chars: edgeFighters(t, ageOf) });
  for (const hh of hits) {
    const p = scr(cam, hh.x, hh.y);
    o += G.slash({ x: p.x, y: p.y, age: hh.age + 0.05, angle: hh.x > DOME.x ? 180 : 0, s: 0.9, col: '#FFD23F' }) + G.hitSpark({ x: p.x, y: p.y, age: hh.age, s: 0.9, col: '#C77DFF' }) + G.damageNumber({ x: p.x + (hh.x > DOME.x ? 50 : -50), y: p.y - 70, age: hh.age, text: 'IMMUNE', col: '#C77DFF' });
  }
  const dk = seg(t, B.dome, B.dome + 0.4);
  const pc = scr(cam, DOME.x, DOME.y - 500);
  return o + bossHud(t) + flashAt(t, B.dome, 0.2, 0.6, '#E7C8FF') + (dk > 0 && dk < 1 ? zoomLines(pc.x, pc.y, 1 - dk, t, '#E7C8FF') : '') + whip(t, C.j1, -1, 0.1);
}
const bkRoar = () => ({ freeArms: true, armL: 72, armR: 72, bendL: 84, bendR: 84, lean: -3 });
// K1 — "FOOLS!" the Block King laughs inside his dome (low close-up, dutch)
function shotK1(t) {
  const u = seg(t, C.k1, C.k2);
  let cam = camLerp(camAt(-1750, 190, 1.45, -3), camAt(-1750, 175, 1.62, -4), u, ease.out);
  cam = shook(cam, t, [[LN[9].a, 0.5, 16]]);
  const laugh = Math.sin(t * 22);
  const back = boss(t, { ...bkRoar(), headRot: 5 * laugh, bodyY: 10 * Math.abs(laugh), shield: 1, glow: 1.3, face: { name: 'happy', eyes: { type: 'happy' } } }) + dome(t, { k: 1 });
  let o = tower(t, cam, {}, { back });
  o += E.embers(t, 0.7, 14, 8, ['#C77DFF', '#FF5FA8', '#FFFFFF']);
  o = rotFrame(o, cam.rot);
  const hk = seg(t, LN[9].a, LN[9].a + 0.2);
  if (hk > 0) { for (const [x, y, r, d] of [[380, 330, -14, 0], [1540, 300, 12, 0.18], [1420, 760, 8, 0.36]]) o += K.bang('HA', x, y, ease.outBack(seg(t, LN[9].a + d, LN[9].a + d + 0.2)) * (1 - seg(t, C.k2 - 0.15, C.k2)), 90, r, '#E7C8FF'); }
  return o + flashAt(t, LN[9].a, 0.12, 0.4, '#E7C8FF');
}
// K2 — "My shield cannot break!" wide: hits ripple all over the dome on every word; the bar says SHIELD
function shotK2(t) {
  const u = seg(t, C.k2, C.l1);
  const cam = camLerp(camAt(-1740, 420, 0.68), camAt(-1745, 410, 0.73), u, ease.inOut);
  const ws = [B.shield, B.cannot, B.break, LN[9].b + 0.35, LN[9].b + 0.75, LN[9].b + 1.1];
  const HT = ws.map((h, i) => ({ h, side: i % 2 ? -1 : 1, j: Math.floor(i / 2) + 1, a: [18, 30, 11][i % 3] }));
  const ageOf = (side, j) => { const e = HT.find((q) => q.side === side && q.j === j); return e ? t - e.h : -1; };
  const hits = HT.filter((q) => t > q.h - 0.01).map((q) => { const [x, y] = domePt(q.side, q.a); return { x, y, age: t - q.h }; });
  const chest = bump(t, B.break - 0.1, B.break + 0.3);
  const back = boss(t, { ...bkRoar(), shield: 1, headRot: 4 * Math.sin(t * 18), armL: 72 - 30 * chest, armR: 72 - 30 * chest }) + dome(t, { k: 1, hits });
  let o = tower(t, cam, {}, { back, chars: edgeFighters(t, ageOf, { swing: true }) });
  for (const hh of hits) { const p = scr(cam, hh.x, hh.y); o += G.hitSpark({ x: p.x, y: p.y, age: hh.age, s: 0.9, col: '#C77DFF' }) + G.damageNumber({ x: p.x, y: p.y - 70, age: hh.age, text: 'IMMUNE', col: '#C77DFF', s: 0.9 }); }
  return o + bossHud(t, { shield: 1 }) + party(t, 1, { dark: true }) + whip(t, C.k2, 1, 0.1);
}
// L1 — "The crystal!" Noodle points up, starry-eyed
function shotL1(t) {
  const u = seg(t, C.l1, C.l2);
  const cam = camLerp(camAt(-520, 690, 2.2), camAt(-520, 670, 2.4), u, ease.out);
  const up = ease.outBack(seg(t, C.l1, C.l1 + 0.3));
  let chars = noodle(t, { x: -520, y: 990, s: sAt(990), turn: 0.3, armR: lerp(30, 168, up), armL: 30, face: { name: 'excited', eyes: { type: 'star' } }, nametag: false, sword: true }, { arms: false });
  let o = tower(t, cam, {}, { back: dome(t, { k: 1 }), chars });
  const p = scr(cam, -520 + 0.36 * 300, 990 - 0.36 * 980);
  return o + K.sparkles([[p.x + 40, p.y - 60, 40 * bump(t, C.l1 + 0.1, C.l2)]], t) + whip(t, C.l1, -1, 0.1);
}
// L2 — "On top of the obby tower!" whip-tilt up a hundred floors to the crystal; TARGET
function shotL2(t) {
  const keys = [[C.l2, { ...TW.cams.base }], [lerp(C.l2, B.tower, 0.35), GS.towerCam(25, 0.7)], [lerp(C.l2, B.tower, 0.7), GS.towerCam(75, 0.7)], [B.tower, { ...TW.cams.top, zoom: 0.95 }], [C.l3, { ...TW.cams.top, zoom: 1.05 }]];
  const cam = K.camKeys(t, keys, ease.inOut);
  const top = G.crystal({ x: CRYS.x, y: CRYS.y, s: 0.8, t, beam: true });
  let o = tower(t, cam, {}, { top });
  const blur = bump(t, C.l2 + 0.1, B.tower - 0.05);
  o += E.streaks(t, blur, 1, '#FFFFFF', 14, 12);
  const tk = seg(t, B.tower - 0.05, B.tower + 0.3);
  if (tk > 0) {
    const p = scr(cam, CRYS.x, CRYS.y);
    const r = lerp(320, 190, ease.out(tk)), rot = t * 60;
    o += S.g(S.circle(0, 0, r, { fill: 'none', stroke: '#FF4B5C', 'stroke-width': 10, 'stroke-dasharray': '60 30' }) + S.path(`M${-r - 50} 0 H${-r + 40} M${r - 40} 0 H${r + 50} M0 ${-r - 50} V${-r + 40} M0 ${r - 40} V${r + 50}`, ln(10, '#FF4B5C')), `translate(${f(p.x)} ${f(p.y)}) rotate(${f(rot)})`, { opacity: f(tk) });
    o += S.g(S.rect(-150, -30, 300, 60, 30, ol('#FF4B5C', 6)) + TF('TARGET: CRYSTAL', 0, 11, 30, '#FFFFFF'), `translate(${f(p.x)} ${f(p.y + 270)}) scale(${f(ease.outBack(tk))})`);
  }
  return o + whip(t, C.l2, 1, 0.12);
}
// L3 — "Someone has to jump up there and break it!" back down at the dome: one by one everyone turns to the hero
function shotL3(t) {
  const u = seg(t, C.l3, C.m1);
  const cam = camLerp(camAt(-860, 720, 1.22), camAt(-860, 715, 1.36), u, ease.inOut);
  const look = (d) => ease.inOut(seg(t, B.jump - 0.5 + d, B.jump - 0.2 + d));
  const hx = -860;
  let chars = '';
  chars += dark(t, { x: -1290, y: 905, s: sAt(900), turn: lerp(-0.5, 0.55, look(0.1)), armR: 30, nametag: false }, { arms: false });
  chars += noodle(t, { x: -440, y: 905, s: sAt(905), turn: lerp(0.4, -0.55, look(0)), armR: lerp(160, 40, look(0)), sword: true, nametag: false }, { arms: false });
  chars += mom(t, { x: -1080, y: 985, s: sAt(985), turn: lerp(-0.4, 0.5, look(0.2)), shieldUp: true, face: { name: 'neutral', eyes: { look: [0.6, 0] } }, nametag: false }, { arms: false });
  chars += gran(t, { x: -640, y: 990, s: sAt(990), turn: lerp(0.2, -0.5, look(0.3)), face: { name: 'neutral', eyes: { look: [-0.6, 0] } }, nametag: false }, { arms: false });
  chars += hero(t, { x: hx, y: 1000, s: sAt(1000), face: t > B.jump ? { name: 'shocked', fx: ['sweat'] } : { name: 'determined' }, armR: 40, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { back: boss(t, { ...bkRoar(), shield: 1 }) + dome(t, { k: 1 }), chars });
  const ph = scr(cam, hx, 1000 - sAt(1000) * 1150);
  const qk = seg(t, B.jump, B.jump + 0.3);
  if (qk > 0) o += S.g(T('?', 0, 0, 160, '#FFD23F', { stroke: '#151515', 'stroke-width': 14, 'paint-order': 'stroke' }), `translate(${f(ph.x + 170)} ${f(ph.y)}) rotate(12) scale(${f(ease.outBack(qk))})`);
  return o + bossHud(t, { shield: 1 }) + whip(t, C.l3, -1, 0.1);
}
// M1 — "I can't! If I leave," the hero holds a fist off with his sword, straining
function shotM1(t) {
  const u = seg(t, C.m1, C.m2);
  let cam = camLerp(camAt(-760, 640, 2.2, 3), camAt(-760, 630, 2.4, 3), u, ease.out);
  cam = { ...cam, sx: Math.sin(t * 47) * 4, sy: Math.cos(t * 39) * 3 };
  const hs = sAt(1000);
  let chars = hero(t, { x: -760, y: 1000, s: hs, turn: -0.2, armR: 150, armL: 120, lean: 4, bodyY: 14, face: { name: 'scared', fx: ['sweat2'] }, nametag: false }, { arms: false, energy: 0.6 });
  const top = E.giantFist(-760 - 40 + 5 * Math.sin(t * 40), 1000 - hs * 1300, 0.6, { rot: -20, lw: 8 });
  let o = tower(t, cam, {}, { back: dome(t, { k: 1 }), chars, top });
  const ps = scr(cam, -700, 1000 - hs * 1000);
  if (Math.floor(t * 10) % 2 === 0) o += G.hitSpark({ x: ps.x, y: ps.y, age: (t * 10 % 1) * 0.25, s: 0.7, seed: Math.floor(t * 10) });
  return rotFrame(o, cam.rot) + party(t, 1, { dark: true, hpYou: 0.55 }) + whip(t, C.m1, 1, 0.1);
}
// M2 — "the whole team falls apart!" a thought bubble: without the leader the mini team topples over
function teamMini(t, fall) {
  let o = S.rect(-500, -320, 1000, 640, 0, { fill: '#2A1A4A' }) + S.rect(-500, 120, 1000, 200, 0, { fill: '#4A3A6A' });
  const ppl = [[-270, 'mom'], [-90, 'p'], [90, 'p2'], [270, 'gran']];
  ppl.forEach(([x, k], i) => {
    const fk = ease.in(seg(fall, i * 0.12, 0.5 + i * 0.12));
    const pose = { x, y: 180, s: 0.32, rot: (i % 2 ? 1 : -1) * 90 * fk, lift: -20 * fk, nametag: false, face: fk > 0.5 ? { name: 'dizzy' } : { name: 'happy' } };
    if (k === 'mom') o += K.draw.momAvatar({ ...pose, armor: 1, nametag: false, volume: false });
    else if (k === 'gran') o += K.draw.grandmaAvatar({ ...pose, volume: false });
    else o += player(k === 'p' ? 4 : 9, pose);
  });
  if (fall > 0.6) o += S.path('M-160 -220 L160 60 M160 -220 L-160 60', { fill: 'none', stroke: '#FF4B5C', 'stroke-width': 34, 'stroke-linecap': 'round', opacity: f(seg(fall, 0.6, 0.8)) });
  return o;
}
function shotM2(t) {
  const u = seg(t, C.m2, C.n1);
  const cam = camLerp(camAt(-860, 620, 2.0), camAt(-860, 615, 2.1), u, ease.out);
  let chars = hero(t, { x: -1080, y: 1000, s: sAt(1000), turn: 0.3, armR: 150, armL: 100, face: { name: 'scared', fx: ['sweat'], eyes: { look: [0.8, -0.5] } }, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { back: dome(t, { k: 1 }), chars });
  o += wash('#0A0414', 0.25);
  const fall = seg(t, B.falls - 0.15, B.falls + 0.95);
  const hp = scr(cam, -1080, 1000 - sAt(1000) * 1000);
  o += E.thoughtBubble(1250, 420, 470, 300, S.g(teamMini(t, fall), 'scale(0.88)'), seg(t, C.m2, C.m2 + 0.3), hp.x + 60, hp.y);
  return o;
}
// N1 — "Everybody was fighting." a slow pan across the fight round the dome
const N_END = camAt(-1150, 470, 0.78);
function shotN1(t) {
  const u = seg(t, C.n1, C.n2);
  const cam = camLerp(camAt(-2350, 480, 0.8), N_END, u, ease.inOut);
  const ageOf = (side, j) => ((t - C.n1) * 1.2 + j * 0.41 + (side > 0 ? 0 : 0.55)) % 1.25;
  const hits = [];
  for (const side of [-1, 1]) for (let j = 0; j < 3; j++) { const a = ageOf(side, j); if (a < 0.6) { const [x, y] = domePt(side, [12, 22, 8][j]); hits.push({ x, y, age: a }); } }
  const back = boss(t, { ...bkRoar(), shield: 1, headRot: 4 * Math.sin(t * 6) }) + dome(t, { k: 1, hits });
  let o = tower(t, cam, {}, { back, chars: edgeFighters(t, ageOf, { swing: true }) });
  for (const hh of hits) { const p = scr(cam, hh.x, hh.y); o += G.hitSpark({ x: p.x, y: p.y, age: hh.age, s: 0.8, col: '#C77DFF' }); }
  return o + bossHud(t, { shield: 1 }) + whip(t, C.n1, 1, 0.1);
}
// N2 — "Everybody... except one." the pan drifts away from the fight, over the lava, to the foot of the tower:
// the hot dog alone in the moonlight, looking up
function shotN2(t) {
  const u = seg(t, C.n2, C.o1);
  const pan = ease.inOut(seg(t, C.n2, B.one + 0.3));
  let cam = camLerp(N_END, { ...TW.cams.base, x: TW.cams.base.x - 40 }, pan, ease.inOut);
  cam = { ...cam, zoom: cam.zoom * (1 + 0.12 * ease.inOut(seg(t, B.one + 0.3, C.o1))) };
  const back = boss(t, { ...bkRoar(), shield: 1 }) + dome(t, { k: 1 });
  const ageOf = (side, j) => ((t - C.n1) * 1.2 + j * 0.41 + (side > 0 ? 0 : 0.55)) % 1.25;
  let chars = edgeFighters(t, ageOf, { swing: true });
  const bs = TW.base;
  chars += E.moonBeam(bs.x + 260, -300, bs.x, bs.y, 30, 150, 0.16);
  chars += hotdog(t, { x: bs.x, y: bs.y, s: bs.s, view: 'back', armL: 10, armR: 10, nametag: false }, { arms: false, energy: 0 });
  let o = tower(t, cam, {}, { back, chars });
  o += wash('#05030C', 0.18 * pan);
  return o + letterbox(seg(t, B.except, B.one + 0.4));
}
// O1 — "Son." the real living room: Dad at his laptop turns to his son at the PC
function livingNight(t, cam, seated, devices = '', o = {}) {
  const SPL = H.SPOTS.livingRoom;
  const Ly = H.livingRoom.layers(t, { time: 'night', clock: '11:20', lamp: 0, glow: 'all', glowK: 1, ...o });
  return view(cam, Ly.bg, 0.8) + view(cam, Ly.mid + seated + Ly.front + devices + Ly.table + Ly.fg + Ly.light, 1);
}
function shotO1(t) {
  const SPL = H.SPOTS.livingRoom;
  const u = seg(t, C.o1, C.o2);
  const cam = camLerp(camAt(840, 560, 1.9), camAt(860, 555, 2.05), u, ease.out);
  const turn = ease.inOut(seg(t, C.o1, C.o1 + 0.4));
  const hturn = ease.inOut(seg(t, LN[13].a + 0.2, LN[13].a + 0.6));
  let seated = actor('you', t, H.seatPose(SPL.seats.you, 1, { view: hturn > 0.5 ? 'front' : 'back', turn: hturn > 0.5 ? 0.45 : 0, headset: true, t, face: { name: 'shocked', eyes: { look: [0.8, 0] } } }), { arms: false, energy: 0 });
  seated += actor('dad', t, H.seatPose(SPL.seats.dad, 1.1, { glasses: 'on', t, turn: lerp(0, -0.6, turn), face: { name: 'determined', eyes: { look: [-0.8, 0] } }, armL: 30, armR: 30 }), { arms: false, energy: 0.4 });
  seated += actor('mom', t, H.seatPose(SPL.seats.mom, 1.04, { pajamas: true, cup: false, headset: 1, tablet: true, t, face: { name: 'determined', eyes: { upper: 0.4, look: [0, 0.4] } } }), { arms: false, energy: 0 });
  let o = livingNight(t, cam, seated, X.laptopOld({ ...SPL.devices.laptop, face: 'lid' }));
  return o + whip(t, C.o1, -1, 0.12, '#CFE0FF');
}
// O2 — "I've been practicing." split: the real Dad (glasses on, laptop light) | the hot dog in the moonlight, typing
function dadFace(t) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#142040' });
  o += actor('dad', t, { x: 900, y: 1640, s: 1.35, t, glasses: 'on', turn: -0.15, face: { name: 'determined', eyes: { upper: 0.3, look: [0, 0.2] } }, armL: 30, armR: 30, volume: false }, { arms: false, energy: 0.5 });
  o += G.screenGlow(900, 600, 1100, 900, '#9FC8FF', 0.55, { flicker: true, t });
  o += X.laptopOld({ x: 900, y: 1580, s: 1.6, face: 'lid' });
  return o;
}
function hotdogMoon(t) {
  const bs = TW.base;
  const cam = camAt(bs.x + 20, bs.y - 360, 1.9);
  const back = E.moonBeam(bs.x + 260, -300, bs.x, bs.y, 30, 150, 0.2);
  const ch = hotdog(t, { x: bs.x, y: bs.y, s: bs.s, turn: -0.3, armL: 12, armR: 12, face: { name: 'determined', mouth: 'smallSmile' }, nametag: false }, { arms: false, energy: 0 });
  return { svg: tower(t, cam, {}, { back, chars: ch }), cam };
}
function shotO2(t) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#05030C' });
  const k1 = seg(t, C.o2, C.o2 + 0.3), k2 = seg(t, C.o2 + 0.15, C.o2 + 0.45);
  o += E.panel(30, 60, 920, 840, dadFace(t), { k: k1, col: '#F2B705', sc: 0.82, ox: -60, oy: -20 });
  const HD = hotdogMoon(t);
  o += E.panel(970, 60, 920, 840, HD.svg, { k: k2, col: '#7FD3FF', sc: 0.82, ox: 40, oy: 0 });
  const cl = G.chatLine(t, '10.13', { from: "I've", hold: 3, text: "I'VE BEEN PRACTICING." });
  if (k2 > 0.9) o += G.chatBubble({ x: 1440, y: 318, caps: true, ...cl, typed: G.chatSync(t, '10.13', { from: "I've" }), k: seg(t, C.o2, C.o2 + 0.3), t, s: 0.9, tail: 0, user: 'DadBod1978' });
  return o + flashAt(t, C.o2, 0.1, 0.5);
}
// O3 — the hot dog turns to the tower, takes a step; the camera tilts up the tower toward the moon -> SC 11
function shotO3(t) {
  const u = seg(t, C.o3, END);
  const bs = TW.base;
  const cam = camLerp(camAt(bs.x + 120, bs.y - 300, 1.5), { x: 300, y: -420, zoom: 0.9 }, ease.inOut(seg(t, C.o3 + 0.5, END)), ease.inOut);
  const st = seg(t, C.o3 + 0.25, C.o3 + 1.0);
  const back = E.moonBeam(bs.x + 260, -300, bs.x, bs.y, 30, 150, 0.2);
  const ch = hotdog(t, { x: bs.x + 60 * ease.inOut(st), y: bs.y, s: bs.s, view: st > 0 ? 'side' : 'front', flip: true, ...(st > 0 && st < 1 ? AC.walk(t * 8) : {}), face: { name: 'determined' } }, { arms: false, energy: 0 });
  let o = tower(t, cam, {}, { back, chars: ch });
  return o + letterbox(1 - seg(t, END - 0.4, END)) + whip(t, C.o3, 1, 0.1);
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [C.a2, shotA1], [C.b1, shotA2], [C.b2, shotB1], [C.c1, shotB2], [C.c2, shotC1], [C.d1, shotC2],
  [C.d2, shotD1], [C.e1, shotD2], [C.e2, shotE1], [C.f1, shotE2], [C.f2, shotF1], [C.f3, shotF2],
  [C.f4, shotF3], [C.g1, shotF4], [C.h1, shotG1], [C.h2, shotH1], [C.i1, shotH2], [C.i2, shotI1],
  [C.i3, shotI2], [C.j1, shotI3], [C.k1, shotJ1], [C.k2, shotK1], [C.l1, shotK2], [C.l2, shotL1],
  [C.l3, shotL2], [C.m1, shotL3], [C.m2, shotM1], [C.n1, shotM2], [C.n2, shotN1], [C.o1, shotN2],
  [C.o2, shotO1], [C.o3, shotO2], [Infinity, shotO3],
];
const WIDE = new Set([shotA1, shotA2, shotC1, shotC2, shotD1, shotE2, shotF2, shotH1, shotI3, shotJ1, shotK2, shotN1, shotN2, shotL3]);
function pick(t) { for (const [end, g] of SHOTS) if (t < end) return g; return shotO3; }
function scene(t) {
  const fn = pick(t);
  VOL_OFF = !WIDE.has(fn);
  return fn(t);
}
function look(t) {
  const fn = pick(t);
  if (fn === shotO2) return { grade: null, vignette: 0.5 };
  return { grade: null, vignette: 0.75 };
}
function captionY(t) { return 1010; }

module.exports = { scene, look, captionY, TIMES: TM };
