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
const E = require('./s09_env');
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

// the cheering server: players + noobs spread over the right half of the battlefield (fixed layout)
const CROWD = (() => {
  const out = [];
  const lines = [[862, 9, -560, 520], [905, 8, -620, 560], [948, 7, -380, 600]];
  let n = 0;
  for (const [y, cnt, x0, x1] of lines) for (let i = 0; i < cnt; i++) {
    const x = lerp(x0, x1, (i + 0.5) / cnt) + (hash(n * 3.7) - 0.5) * 60;
    out.push({ n, i: 3 + ((n * 7) % 37), x, y: y + (hash(n * 1.3) - 0.5) * 14, s: sAt(y), noob: n % 4 === 2 });
    n++;
  }
  return out.sort((a, b) => a.y - b.y);
})();
function crowd(t, o = {}) {
  let s = '';
  const cheer = o.cheer ?? 1, swords = o.swords ?? 0, look = o.look ?? 0;
  for (const c of CROWD) {
    if (o.skip && o.skip(c)) continue;
    const ph = t * 9 + c.n * 1.7, up = cheer * (0.5 + 0.5 * Math.sin(ph));
    const pose = { x: c.x + (o.dx ? o.dx(c) : 0), y: c.y, s: c.s, armL: lerp(18, 150, up * (c.n % 2 ? 1 : 0.6)), armR: o.armR ?? (swords > 0 ? 60 + 70 * up : lerp(18, 160, up)), lift: 14 * cheer * Math.abs(Math.sin(ph)), turn: look, nametag: false, face: cheer > 0.3 ? 'excited' : 'happy' };
    s += c.noob ? noob(c.n % 12 + 1, pose) : player(c.i, { ...pose, sword: swords > 0 && t >= (o.swordAt?.(c) ?? 0) ? 'gold' : undefined });
  }
  return s;
}
// little cheering chat bubbles over the crowd (screen space), each with a user tab
const CHEERS = ['THE FAMILY!!', 'GO MOM!!', 'is that a HOT DOG', 'GRANNY!!!', 'LETS GOOO', 'YOU IS BACK!', 'family raid??', 'GG KING', 'w family', 'MOM OP'];
function cheers(t, t0, n = 6, cam, seed = 1) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const c = CROWD[(i * 5 + seed) % CROWD.length];
    const a = t0 + i * 0.32 + hash(i + seed) * 0.2;
    const k = seg(t, a, a + 0.25), out = seg(t, a + 1.4, a + 1.7);
    if (k <= 0 || out >= 1) continue;
    const p = scr(cam, c.x, c.y - c.s * 1000);
    if (p.x < 60 || p.x > 1860) continue;
    o += G.chatBubble({ x: p.x, y: p.y, text: CHEERS[(i + seed) % CHEERS.length], k, out, t, s: 0.72, user: G.FLOOD_USERS[(i * 3 + seed) % G.FLOOD_USERS.length] });
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
const bossHud = (t, o = {}) => G.bossBar({ k: o.k ?? 1, value: o.value ?? bossHP(t), trail: o.trail, shield: o.shield ?? seg(t, B.dome, B.dome + 0.6), t, y: 76, s: 0.78, hit: o.hit || 0, sub: o.sub ?? (t >= TM.n[10].b ? 'BREAK THE CRYSTAL!' : '') });
const bossHP = (t) => (t < B.attackSlash ? 1 : t < B.dome ? 0.96 : 0.96);

// ================================================================ SHOTS
// A1 — "Party formed." white in from SC 09: four spawn pops on the battlefield, the party banner unfurls
const SPAWN = [{ who: 'you', x: -60, y: 880 }, { who: 'mom', x: -270, y: 880 }, { who: 'gran', x: 150, y: 880 }, { who: 'dad', x: 360, y: 880 }];
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
  const cam = camLerp(camAt(80, 640, 1.3), camAt(60, 650, 1.4), u, ease.out);
  let back = '', chars = '', top = '';
  chars += crowd(t, { cheer: seg(t, B.pops[3], B.pops[3] + 0.6), skip: (c) => c.y > 920 || (c.x > -330 && c.x < 420 && c.y > 870) });
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
// A2 — "Party name: 'The Family.'" the slow-motion formation walk toward camera; the server cheers; party frames slide in
function shotA2(t) {
  const u = seg(t, C.a2, C.b1);
  const wk = ease.inOut(seg(t, C.a2, C.b1 + 0.3));
  const cam = camLerp(camAt(40, 700, 1.15, 2), camAt(40, 735, 1.32, -2), u, ease.inOut);
  const FORM = [[-60, 0], [-300, -20], [180, -14], [420, -26]];        // x and depth offset per member (V formation)
  let chars = crowd(t, { cheer: 1, skip: (c) => c.y > 935 || (c.x > -360 && c.x < 520 && c.y > 880) });
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
  o += cheers(t, C.a2 + 0.2, 8, cam, 2);
  o += E.embers(t, 1, 22, 4);
  o += party(t, seg(t, B.name - 0.1, B.name + 1.1));
  const fk = seg(t, B.family - 0.05, B.family + 0.3);
  if (fk > 0) o += G.bigTitle({ text: 'THE FAMILY', theme: 'gold', k: fk * 1, out: seg(t, C.b1 - 0.3, C.b1), t, x: 1180, y: 250, s: 0.55, rays: false });
  return o + letterbox(1 - seg(t, C.b1 - 0.2, C.b1));
}
// B1 — "Okay! Mom, you're the tank." the hero points the sword at Mom; CLANG on the pot lid; TANK
function shotB1(t) {
  const u = seg(t, C.b1, C.b2);
  let cam = camLerp(camAt(-170, 720, 1.95), camAt(-180, 710, 2.1), u, ease.out);
  cam = shook(cam, t, [[B.tank, 0.25, 8]]);
  const pt = ease.outBack(seg(t, LN[1].word('Mom').t0 - 0.15, LN[1].word('Mom').t0 + 0.1));
  const clang = bump(t, B.tank - 0.12, B.tank + 0.25);
  let chars = mom(t, { x: -330, y: 985, s: 0.38, turn: 0.35, shieldUp: clang > 0.2, shieldFlash: prog(t, B.tank, 0.3) > 0 ? 1 - prog(t, B.tank, 0.3) : 0, armR: lerp(30, 130, clang), face: { name: 'determined', eyes: { look: [0.6, 0] } }, nametag: false }, { arms: false });
  chars += hero(t, { x: -20, y: 990, s: 0.39, turn: -0.5, armR: 20, armL: lerp(20, 100, pt), sword: 'gold', face: { name: 'determined', eyes: { look: [-0.8, 0] } }, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { chars });
  const ps = scr(cam, -330 - 120, 985 - 0.38 * 600);
  o += G.hitSpark({ x: ps.x, y: ps.y, age: t - B.tank, s: 1.2, text: 'CLANG!' });
  o += G.stamp({ text: 'TANK', k: seg(t, B.tank + 0.05, B.tank + 0.55), x: 470, y: 290, s: 0.9, rot: -10, col: '#3FA9F5' });
  return o + whip(t, C.b1, 1, 0.1);
}
// B2 — "Granny, we need gear!" Granny grins; her money bag spits coins
function shotB2(t) {
  const u = seg(t, C.b2, C.c1);
  const cam = camLerp(camAt(170, 690, 2.25), camAt(170, 680, 2.45), u, ease.out);
  const ck = seg(t, B.gear - 0.1, B.gear + 0.8);
  let chars = gran(t, { x: 170, y: 975, s: 0.38, coins: ck, armR: 30 + 40 * bump(t, B.gear - 0.1, B.gear + 0.6), face: t > B.gear - 0.1 ? { name: 'rich' } : { name: 'smug', eyes: { look: [-0.6, 0] } }, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { chars });
  o += G.coinCounter({ x: 1880, y: 70, anchor: 'right', value: 9999999, k: seg(t, B.gear - 0.2, B.gear + 0.2), t, s: 1, bump: prog(t, B.gear, 0.45) });
  return o + whip(t, C.b2, -1, 0.1);
}
// C1 — "Swords for everyone!" Granny raises the cane: golden swords rain into every hand
const SWORD_HANDS = () => CROWD.filter((c) => !c.noob).map((c) => handW(c.x, c.y, c.s, 70));
function shotC1(t) {
  const u = seg(t, C.c1, C.c2);
  const cam = camLerp({ x: -840, y: -60, zoom: 0.9 }, { x: -860, y: -80, zoom: 0.96 }, u, ease.out);
  const age = t - B.swords;
  const raise = ease.outBack(seg(t, B.swords - 0.2, B.swords + 0.1));
  let chars = crowd(t, { cheer: 0.4, swords: 0, armR: 70 });
  chars += hero(t, { x: -620, y: 990, s: sAt(990), turn: 0.3, face: 'amazed', armR: 70, sword: t > B.swords + 0.9 ? 'gold' : false }, { arms: false });
  chars += mom(t, { x: -820, y: 980, s: sAt(980), turn: 0.3, face: 'happy' }, { arms: false });
  chars += gran(t, { x: -420, y: 985, s: sAt(985), turn: -0.2, armL: lerp(20, 165, raise), face: { name: 'rich' } }, { arms: false });
  let top = G.swordRain({ t, age, targets: SWORD_HANDS(), s: 0.55, dur: 0.75, stagger: 1.0, y0: -260 });
  let o = tower(t, cam, {}, { chars, top });
  const pg = scr(cam, -420, 985 - 380);
  o += G.coinCounter({ x: 1880, y: 70, anchor: 'right', value: 9975000, from: 9999999, roll: seg(t, B.swords + 0.2, B.swords + 1.6), t, s: 1 });
  return o + whip(t, C.c1, 1, 0.1);
}
// C2 — "Put it on my tab!" Granny's receipt unrolls from her bag; then (the beat) the server raises its new swords
function shotC2(t) {
  const u = seg(t, C.c2, C.d1);
  const cam = camLerp(camAt(-380, 700, 2.0), camAt(-390, 690, 2.2), u, ease.out);
  const wink = t > B.tab - 0.05 && t < B.tab + 0.5;
  let chars = crowd(t, { cheer: 1, swords: 1, dx: () => 0 });
  chars += gran(t, { x: -420, y: 985, s: sAt(985), turn: 0.2, armR: 40, face: wink ? { name: 'happy', eyes: { type: 'happy' } } : { name: 'rich' } }, { arms: false });
  let o = tower(t, cam, {}, { chars });
  const ph = scr(cam, -420 + 0.38 * 300, 985 - 0.38 * 300);
  o += E.receipt(ph.x + 40, ph.y - 60, seg(t, LN[2].word('Put').t0, LN[2].b + 0.9), { t, len: 640, w: 280, rot: 8, lines: [['GOLD SWORD x1', '50'], ['GOLD SWORD x1', '50'], ['GOLD SWORD x1', '50'], ['GOLD SWORD x1', '50'], ['GOLD SWORD x1', '50'], ['...x500', '...'], ['TOTAL', '25,000']] });
  const sk = seg(t, LN[2].b + 0.3, C.d1);
  if (sk > 0) o += K.sparkles([[300, 320, 30 * Math.sin(Math.PI * sk)], [1560, 260, 26 * Math.sin(Math.PI * sk)], [1200, 420, 22 * Math.sin(Math.PI * seg(sk, 0.3, 1))]], t);
  o += G.coinCounter({ x: 1880, y: 70, anchor: 'right', value: 9975000, t, s: 1 });
  return o + whip(t, C.c2, -1, 0.1);
}
// D1 — "Kids! Formation!" Mom raises her sword; the scattered players snap into neat rows behind her
function shotD1(t) {
  const u = seg(t, C.d1, C.d2);
  const cam = camLerp({ x: -760, y: -10, zoom: 0.98 }, { x: -760, y: -30, zoom: 1.06 }, u, ease.out);
  const snap = ease.outBack(seg(t, B.formation - 0.05, B.formation + 0.4));
  const raise = ease.outBack(seg(t, B.kids - 0.15, B.kids + 0.15));
  let chars = '';
  CROWD.forEach((c, j) => {
    const col = j % 6, row = Math.floor(j / 6);
    const fx = -520 + col * 150 + row * 30, fy = 880 + row * 36;
    const x = lerp(c.x, fx, snap), y = lerp(c.y, fy, clamp(snap, 0, 1)), s = sAt(y);
    const pose = { x, y, s, turn: -0.3, armR: 60 + 20 * Math.sin(t * 9 + j), armL: 20, lift: 30 * bump(t, B.formation + j * 0.02, B.formation + 0.3 + j * 0.02), nametag: false, face: 'excited' };
    chars += c.noob ? noob(c.n % 12 + 1, pose) : player(c.i, { ...pose, sword: 'gold' });
  });
  chars += mom(t, { x: -820, y: 1000, s: sAt(1000), turn: 0.4, armR: lerp(30, 165, raise), swordGlow: raise, face: { name: 'determined', eyes: { look: [0.8, 0] } } }, { arms: false });
  let o = tower(t, cam, {}, { chars });
  const fk = seg(t, B.formation, B.formation + 0.6);
  if (fk > 0 && fk < 1) o += K.C.burst(scr(cam, -820, 1000 - 0.39 * 1300).x, scr(cam, -820, 1000 - 0.39 * 1300).y, fk, '#FFE14D');
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
// E1 — "Mommy's got you!" the giant fist comes down on the pot-lid shield: BLOCKED
function fistOn(t, tHit, x, y, s, o = {}) {
  const fall = seg(t, tHit - 0.28, tHit), back = seg(t, tHit + (o.hold ?? 0.4), tHit + (o.hold ?? 0.4) + 0.5);
  if (fall <= 0 || back >= 1) return '';
  const press = t > tHit && back <= 0 ? 10 * Math.sin((t - tHit) * 40) * (1 - seg(t, tHit, tHit + 0.3)) : 0;
  const yy = back > 0 ? lerp(y, y - 1600, ease.in(back)) : lerp(y - 1500, y, ease.in(fall));
  const xx = back > 0 ? lerp(x, x - 900, ease.in(back)) : lerp(x - 1000, x, ease.in(fall));
  return E.giantFist(xx + press, yy, s, { rot: -32, armRot: 0, lw: 9 });
}
function shotE1(t) {
  const u = seg(t, C.e1, C.e2);
  let cam = camLerp(camAt(-760, 640, 1.8, -3), camAt(-770, 650, 1.95, -3), u, ease.out);
  cam = punch(cam, t, B.block, 0.08, 0.08);
  cam = shook(cam, t, [[B.block, 0.6, 24]]);
  const up = ease.outBack(seg(t, LN[4].a - 0.1, LN[4].a + 0.2));
  const sq = bump(t, B.block, B.block + 0.25);
  const mx = -760, my = 990, ms = sAt(990);
  let chars = mom(t, { x: mx + 10 * sq, y: my, s: ms, turn: -0.35, shieldUp: up > 0.3, shieldFlash: prog(t, B.block, 0.35) ? 1 - prog(t, B.block, 0.35) : 0, sy: 1 - 0.07 * sq, sx: 1 + 0.05 * sq, lean: 6 * sq, face: { name: 'determined', eyes: { look: [-0.6, -0.6] } }, nametag: false }, { arms: false });
  const hitP = [mx - 150, my - ms * 820];
  let top = fistOn(t, B.block, hitP[0] - 90, hitP[1] - 150, 0.8, { hold: 0.9 });
  const age = t - B.block;
  top += E.shockRing(mx, my, age, 700, { col: '#FFE9A8', w: 22 }) + E.dustPuff(mx, my, age, { r: 120, col: '#8A7A9A', n: 7 }) + E.cubeDebris(mx - 60, my - 10, age, { n: 10, s: 0.7, floorY: my + 10, seed: 3 });
  let o = tower(t, cam, {}, { chars, top });
  const ph = scr(cam, hitP[0], hitP[1]);
  o += E.impactStar(ph.x, ph.y, age, 260) + G.hitSpark({ x: ph.x, y: ph.y, age: age - 0.02, s: 1.4 }) + G.damageNumber({ x: ph.x + 60, y: ph.y - 140, age, text: 'BLOCKED!', crit: true, s: 1.1 });
  return o + flashAt(t, B.block, 0.12, 0.7) + whip(t, C.e1, -1, 0.1);
}
// E2 — "Everybody behind me!" the fist presses down, Mom holds; the players scramble behind her; a sweet look back
function shotE2(t) {
  const u = seg(t, C.e2, C.f1);
  let cam = camLerp({ x: -1180, y: -40, zoom: 1.04 }, { x: -1160, y: -50, zoom: 1.1 }, u, ease.out);
  cam = { ...cam, sx: Math.sin(t * 50) * 3, sy: Math.cos(t * 43) * 3 };
  const mx = -1240, my = 990, ms = sAt(990);
  const back = seg(t, LN[4].word('behind').t0, LN[4].word('behind').t0 + 0.6);
  let chars = '';
  CROWD.slice(0, 14).forEach((c, j) => {
    const r = seg(t, C.e2 + j * 0.05, C.e2 + 0.9 + j * 0.05);
    const x = lerp(-1700 + (j % 5) * 140, -1000 + (j % 7) * 150, ease.out(r)), y = 880 + (j % 4) * 35, s = sAt(y);
    const pose = { x, y, s, view: r < 1 ? 'side' : 'front', flip: true, ...(r < 1 ? AC.run(t * 16 + j) : {}), armL: 150, armR: 150, nametag: false, face: { name: 'scared' } };
    chars += c.noob ? noob(c.n % 12 + 1, pose) : player(c.i, pose);
  });
  chars += mom(t, { x: mx, y: my, s: ms, turn: lerp(-0.35, 0.5, back), shieldUp: true, shieldFlash: 0.3 + 0.3 * Math.sin(t * 30), lean: 5, face: back > 0.4 ? { name: 'happy', eyes: { type: 'happy' } } : { name: 'determined' } }, { arms: false });
  const hp = [mx - 160, my - ms * 820];
  const top = E.giantFist(hp[0] - 90 + 6 * Math.sin(t * 40), hp[1] - 150, 0.8, { rot: -32, lw: 9 });
  let o = tower(t, cam, {}, { chars, top });
  const ph = scr(cam, hp[0], hp[1]);
  if (Math.floor(t * 12) % 3 === 0) o += G.hitSpark({ x: ph.x, y: ph.y, age: (t * 12 % 1) * 0.3, s: 0.8, seed: Math.floor(t * 12) });
  return o + bossHud(t) + party(t, 1, { momHit: 0.3 + 0.3 * Math.sin(t * 20) }) + whip(t, C.e2, 1, 0.1);
}
// F1 — "Mom blocked the punches." two punches, two blocks (whip between)
function shotF1(t) {
  const second = t >= lerp(B.blocked, B.punches, 0.55);
  const tHit = second ? B.punches + 0.05 : B.blocked + 0.05;
  let cam = second ? camAt(-760, 660, 2.0, 4) : camAt(-760, 640, 1.7, -4);
  cam = punch(cam, t, tHit, 0.07, 0.08);
  cam = shook(cam, t, [[tHit, 0.4, 20]]);
  const mx = -760, my = 990, ms = sAt(990);
  const sq = bump(t, tHit, tHit + 0.25);
  let chars = mom(t, { x: mx, y: my, s: ms, turn: second ? 0.35 : -0.35, shieldUp: true, shieldFlash: prog(t, tHit, 0.3) ? 1 - prog(t, tHit, 0.3) : 0, sy: 1 - 0.06 * sq, face: { name: 'determined' }, nametag: false }, { arms: false });
  const hitP = second ? [mx + 150, my - ms * 800] : [mx - 150, my - ms * 820];
  let top = second ? (() => { const fall = seg(t, tHit - 0.25, tHit); return fall > 0 ? E.giantFist(lerp(hitP[0] + 900, hitP[0] + 110, ease.in(fall)), lerp(hitP[1] - 700, hitP[1] - 60, ease.in(fall)), 0.8, { rot: 70, lw: 9, side: -1 }) : ''; })() : fistOn(t, tHit, hitP[0] - 90, hitP[1] - 150, 0.8, { hold: 0.3 });
  let o = tower(t, cam, {}, { chars, top });
  const ph = scr(cam, hitP[0], hitP[1]);
  o += E.impactStar(ph.x, ph.y, t - tHit, 220) + G.damageNumber({ x: ph.x, y: ph.y - 120, age: t - tHit, text: 'BLOCKED!', crit: true });
  return rotFrame(o, 0) + whip(t, C.f1, 1, 0.1) + whip(t, lerp(B.blocked, B.punches, 0.55), -1, 0.08);
}
// F2 — "You led the attack." the hero charges with the army behind him; slash on the boss's foot
function shotF2(t) {
  const u = seg(t, C.f2, C.f3);
  const hx = lerp(-300, -1080, ease.inOut(seg(t, C.f2, B.attackSlash)));
  let cam = camAt(hx - 260, 700, 1.15);
  cam = shook(cam, t, [[B.attackSlash, 0.4, 16]]);
  const hs = sAt(990);
  const atk = t >= B.attackSlash - 0.12;
  let chars = '';
  for (let j = 0; j < 9; j++) {
    const c = CROWD[j * 2];
    const x = hx + 220 + j * 120 + 30 * Math.sin(j), y = 900 + (j % 3) * 35, s = sAt(y);
    chars += (c.noob ? noob : player)(c.noob ? c.n % 12 + 1 : c.i, { x, y, s, view: 'side', ...AC.run(t * 16 + j), armR: 150, sword: c.noob ? undefined : 'gold', nametag: false });
  }
  const sw = atk ? ease.out(seg(t, B.attackSlash - 0.12, B.attackSlash + 0.05)) : 0;
  chars += hero(t, { x: hx, y: 990, s: hs, view: 'side', ...(atk ? {} : AC.run(t * 16)), armR: atk ? lerp(160, 30, sw) : 150, armL: atk ? -40 : undefined, lean: 8, face: { name: 'determined', mouth: 'scream' }, nametag: false }, { arms: false });
  const back = boss(t, t > B.attackSlash ? { pose: 'hit' } : {});
  let o = tower(t, cam, {}, { back, chars });
  const pS = scr(cam, hx - 160, 990 - hs * 500);
  o += G.slash({ x: pS.x, y: pS.y, age: t - B.attackSlash + 0.06, angle: 200, s: 1.3, col: '#FFD23F' }) + G.hitSpark({ x: pS.x - 60, y: pS.y, age: t - B.attackSlash, s: 1.3 }) + G.damageNumber({ x: pS.x - 120, y: pS.y - 120, age: t - B.attackSlash, value: -250, crit: true });
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
  const cam = camLerp(camAt(-870, 650, 2.0), camAt(-870, 640, 2.35), u, ease.inOut);
  const ext = ease.inOut(seg(t, C.f4 + 0.8, C.g1));
  let chars = hero(t, { x: HX, y: 990, s: sAt(990), turn: 0.55, armR: 30, face: { name: 'deadpan', eyes: { look: [0.8, 0], upper: 0.35 } }, nametag: false }, { arms: false });
  chars += dark(t, { x: DBX2, y: 990, s: sAt(990), turn: -0.55, armL: lerp(20, 80, ext), armR: 30, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { back: boss(t, {}), chars });
  return o + letterbox(1) + whip(t, C.f4, -1, 0.08);
}
// G1 — "Just this once." DarkBlade close-up; the fist bump
function shotG1(t) {
  const u = seg(t, C.g1, C.h1);
  let cam = camLerp(camAt(-800, 640, 2.6), camAt(-830, 640, 2.8), u, ease.inOut);
  const bk = t >= B.bump;
  let chars = dark(t, { x: DBX2, y: 990, s: sAt(990), turn: -0.45, armL: 80, armR: 30, nametag: false, headRot: t < LN[6].b ? -6 : 0 }, { arms: false });
  const hin = ease.out(seg(t, B.bump - 0.35, B.bump));
  chars += hero(t, { x: HX, y: 990, s: sAt(990), turn: 0.55, armR: lerp(20, 80, hin), face: { name: bk ? 'smug' : 'deadpan', eyes: { look: [0.8, 0] } }, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { back: boss(t, {}), chars });
  o += E.bubbleAt(cam, DBX2 + 30, 990 - sAt(990) * 1050, { ...G.chatLine(t, '10.6', { hold: 2 }), t, s: 1.15, tail: 0, user: 'xX_DarkBlade_Xx' });
  const pb = scr(cam, (HX + DBX2) / 2, 990 - sAt(990) * 470);
  const ba = t - B.bump;
  if (ba > 0) o += G.hitSpark({ x: pb.x, y: pb.y, age: ba, s: 1.4, text: 'BUMP!' }) + E.glint(pb.x, pb.y - 40, seg(ba, 0, 0.5), 110);
  return o + letterbox(1 - seg(t, C.h1 - 0.2, C.h1));
}
// H1 — "Healing potions! A hundred of them!" Granny hurls potions over the crowd: pop, pop, pop, +HP
function shotH1(t) {
  const u = seg(t, C.h1, C.h2);
  const cam = camLerp({ x: -760, y: -60, zoom: 0.94 }, { x: -740, y: -70, zoom: 1.0 }, u, ease.out);
  const thr = Math.sin(t * 14);
  let chars = crowd(t, { cheer: 0.6, swords: 1 });
  chars += mom(t, { x: -900, y: 985, s: sAt(985), turn: 0.3, shieldUp: true, face: 'happy' }, { arms: false });
  chars += hero(t, { x: -700, y: 995, s: sAt(995), turn: 0.3, armR: 60, face: 'happy' }, { arms: false });
  chars += gran(t, { x: -460, y: 990, s: sAt(990), turn: -0.2, armR: 90 + 60 * thr, coins: 0.4, face: { name: 'excited' } }, { arms: false });
  let top = '';
  const t0 = B.potions - 0.2;
  for (let i = 0; i < 14; i++) {
    const a0 = t0 + i * 0.16;
    const c = CROWD[(i * 3) % CROWD.length];
    const [ex, ey] = [c.x, c.y - c.s * 1100];
    const fly = seg(t, a0, a0 + 0.45);
    if (fly > 0 && fly < 1) { const px = lerp(-460, ex, fly), py = lerp(990 - 400, ey, fly) - 280 * Math.sin(Math.PI * fly); top += X.potion({ x: px, y: py, s: 0.45, rot: fly * 540, t }); }
    top += G.potionPop({ x: ex, y: ey, age: t - (a0 + 0.45), s: 0.7, seed: i });
  }
  let o = tower(t, cam, {}, { chars, top });
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
function charger(t, j, x0, x1, y, dir, t0, kind) {
  const r = seg(t, t0, t0 + 2.4);
  const x = lerp(x0, x1, r), s = sAt(y);
  const pose = { x, y, s, view: 'side', flip: dir > 0, ...AC.run(t * 16 + j), armR: 150, nametag: false, face: { name: 'determined', mouth: 'scream' } };
  if (kind === 'noodle') return noodle(t, { ...pose, sword: true }, { arms: false });
  if (kind === 'dark') return dark(t, pose, { arms: false });
  if (kind === 'clan') return actor('clan', t, { ...pose, i: j % 5 }, { arms: false });
  const c = CROWD[j % CROWD.length];
  return c.noob ? noob(c.n % 12 + 1, pose) : player(c.i, { ...pose, sword: 'gold' });
}
function shotI3(t) {
  const u = seg(t, C.i3, C.j1);
  let cam = camLerp({ x: -1700, y: -170, zoom: 0.66 }, { x: -1700, y: -190, zoom: 0.72 }, u, ease.out);
  cam = punch(cam, t, B.attack, 0.06, 0.08);
  cam = shook(cam, t, [[B.attack, 0.5, 16]]);
  const go = LN[8].word('Everybody').t0;
  let chars = '';
  // right flank (DarkBlade + clan + players), running left
  for (let j = 0; j < 10; j++) chars += charger(t, j, 150 + (j % 5) * 130, -900 + (j % 5) * 90, 870 + (j % 4) * 38, -1, go + j * 0.05, j === 2 ? 'dark' : j % 3 === 0 ? 'clan' : 'p');
  // left flank (Noodle + players), running right
  for (let j = 0; j < 6; j++) chars += charger(t, 20 + j, -3500 + (j % 3) * 140, -2600 + (j % 3) * 90, 880 + (j % 3) * 40, 1, go + j * 0.06, j === 1 ? 'noodle' : 'p');
  // the family in front
  const fr = seg(t, go, go + 2.4);
  chars += mom(t, { x: lerp(-200, -900, fr), y: 995, s: sAt(995), view: 'side', ...AC.run(t * 14), shieldUp: true, nametag: false }, { arms: false });
  chars += hero(t, { x: lerp(-40, -760, fr), y: 1000, s: sAt(1000), view: 'side', ...AC.run(t * 16), armR: 160, nametag: false, face: { name: 'determined', mouth: 'scream' } }, { arms: false });
  chars += gran(t, { x: lerp(200, -420, fr * 0.8), y: 985, s: sAt(985), view: 'side', ...AC.run(t * 12, 0.7), armL: 150, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { back: boss(t, { pose: 'roar' }), chars });
  o += K.bang('ATTACK!', 960, 300, ease.outBack(seg(t, B.attack, B.attack + 0.25)) * (1 - seg(t, C.j1 - 0.2, C.j1)), 150, -6, '#FFD23F');
  o += E.streaks(t, 0.5, 1, '#FFFFFF', 8, 9);
  return o + bossHud(t) + whip(t, C.i3, 1, 0.12);
}
// J1 — the dome rises out of the ground; every hit bounces off: IMMUNE, IMMUNE, IMMUNE; players fly back
const HITS = (t) => B.hits.map((h, i) => ({ x: DOME.x + [960, 900, 980, 820, 940, 870][i % 6], y: [700, 560, 820, 460, 640, 760][i % 6], age: t - h }));
function shotJ1(t) {
  const u = seg(t, C.j1, C.k1);
  let cam = camLerp({ x: -1580, y: -120, zoom: 0.78 }, { x: -1520, y: -140, zoom: 0.84 }, u, ease.out);
  cam = shook(cam, t, [[B.dome, 0.5, 18], ...B.hits.map((h) => [h, 0.2, 8])]);
  const hits = HITS(t).filter((h) => h.age > -0.01);
  let chars = '';
  // attackers pressed against the dome's right edge, bouncing off at each hit
  const edge = [[-700, 900], [-740, 950], [-660, 990], [-780, 870], [-620, 940], [-720, 1000]];
  edge.forEach(([x, y], j) => {
    const hAge = t - (B.hits[j % B.hits.length] || 1e9);
    const kb = hAge > 0 && hAge < 0.7 ? Math.sin(Math.PI * hAge / 0.7) : 0;
    const pose = { x: x + 140 * kb + (j % 2) * 20, y, s: sAt(y), view: 'side', armR: 160 - 120 * kb, lift: 90 * kb, rot: 14 * kb, nametag: false, face: kb > 0.2 ? { name: 'dizzy' } : { name: 'determined' } };
    if (j === 0) chars += hero(t, { ...pose, x: pose.x - 60, face: kb > 0.2 ? { name: 'shocked' } : { name: 'determined' } }, { arms: false });
    else if (j === 1) chars += mom(t, { ...pose, shieldUp: true }, { arms: false });
    else if (j === 3) chars += dark(t, pose, { arms: false });
    else chars += player(CROWD[j * 4].i, { ...pose, sword: 'gold' });
  });
  const back = boss(t, { pose: 'idle', shield: domeK(t) }) + dome(t, { hits });
  let o = tower(t, cam, {}, { back, chars });
  for (const h of hits) {
    const p = scr(cam, h.x, h.y);
    o += G.slash({ x: p.x, y: p.y, age: h.age + 0.05, angle: 180, s: 1, col: '#FFD23F' }) + G.hitSpark({ x: p.x, y: p.y, age: h.age, s: 1, col: '#C77DFF' }) + G.damageNumber({ x: p.x + 40, y: p.y - 80, age: h.age, text: 'IMMUNE', col: '#C77DFF' });
  }
  const dk = seg(t, B.dome, B.dome + 0.4);
  return o + bossHud(t) + flashAt(t, B.dome, 0.2, 0.6, '#E7C8FF') + (dk > 0 && dk < 1 ? zoomLines(scr(cam, DOME.x, DOME.y - 400).x, scr(cam, DOME.x, DOME.y - 400).y, 1 - dk, t, '#E7C8FF') : '') + whip(t, C.j1, -1, 0.1);
}
// K1 — "FOOLS!" the Block King laughs inside his dome
function shotK1(t) {
  const u = seg(t, C.k1, C.k2);
  let cam = camLerp(camAt(TB.x, 380, 1.7, -3), camAt(TB.x, 370, 1.95, -4), u, ease.out);
  cam = shook(cam, t, [[LN[9].a, 0.5, 16]]);
  const laugh = Math.sin(t * 22);
  const back = boss(t, { ...bkRoar(), headRot: 5 * laugh, bodyY: 10 * Math.abs(laugh), shield: 1, glow: 1.3 }) + dome(t, { k: 1 });
  let o = tower(t, cam, {}, { back });
  o += E.embers(t, 0.7, 14, 8, ['#C77DFF', '#FF5FA8', '#FFFFFF']);
  return rotFrame(o, cam.rot) + flashAt(t, LN[9].a, 0.12, 0.4, '#E7C8FF');
}
const bkRoar = () => ({ freeArms: true, armL: 72, armR: 72, bendL: 84, bendR: 84, lean: -3 });
// K2 — "My shield cannot break!" wide: hits ripple all over the dome; the bar says SHIELD
function shotK2(t) {
  const u = seg(t, C.k2, C.l1);
  const cam = camLerp({ x: -1650, y: -160, zoom: 0.7 }, { x: -1650, y: -170, zoom: 0.76 }, u, ease.inOut);
  const ws = [B.shield, B.cannot, B.break, LN[9].b + 0.4, LN[9].b + 0.8];
  const hits = ws.map((w, i) => ({ x: DOME.x + [900, -880, 760, -700, 950][i], y: [640, 700, 420, 520, 820][i], age: t - w })).filter((h) => h.age > -0.01);
  let chars = '';
  const att = [[-750, 940, 'hero'], [-2780, 930, 'noodle'], [-820, 990, 'mom'], [-2700, 990, 'p'], [-680, 880, 'dark']];
  att.forEach(([x, y, k], j) => {
    const dir = x < DOME.x ? 1 : -1;
    const hA = hits[j] ? hits[j].age : -1, kb = hA > 0 && hA < 0.6 ? Math.sin(Math.PI * hA / 0.6) : 0;
    const pose = { x: x - dir * 110 * kb, y, s: sAt(y), view: 'side', flip: dir > 0, armR: 150 - 100 * kb, lift: 60 * kb, nametag: false };
    if (k === 'hero') chars += hero(t, pose, { arms: false });
    else if (k === 'mom') chars += mom(t, { ...pose, shieldUp: true }, { arms: false });
    else if (k === 'dark') chars += dark(t, pose, { arms: false });
    else if (k === 'noodle') chars += noodle(t, { ...pose, sword: true }, { arms: false });
    else chars += player(11, { ...pose, sword: 'gold' });
  });
  const chest = bump(t, B.break - 0.1, B.break + 0.3);
  const back = boss(t, { ...bkRoar(), shield: 1, headRot: 4 * Math.sin(t * 18), armL: 72 - 30 * chest, armR: 72 - 30 * chest }) + dome(t, { k: 1, hits });
  let o = tower(t, cam, {}, { back, chars });
  for (const h of hits) { const p = scr(cam, h.x, h.y); o += G.hitSpark({ x: p.x, y: p.y, age: h.age, s: 0.9, col: '#C77DFF' }) + G.damageNumber({ x: p.x, y: p.y - 70, age: h.age, text: 'IMMUNE', col: '#C77DFF', s: 0.9 }); }
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
// L3 — "Someone has to jump up there and break it!" back down: everyone turns to the hero
function shotL3(t) {
  const u = seg(t, C.l3, C.m1);
  const cam = camLerp({ x: -1180, y: -10, zoom: 1.25 }, { x: -1170, y: -20, zoom: 1.38 }, u, ease.inOut);
  const look = seg(t, B.jump - 0.4, B.jump);
  const hx = -760;
  let chars = '';
  chars += dark(t, { x: -980, y: 900, s: sAt(900), turn: lerp(-0.5, 0.5, look), nametag: false }, { arms: false });
  chars += noodle(t, { x: -560, y: 905, s: sAt(905), turn: lerp(0.4, -0.5, look), armR: 160 - 120 * look, nametag: false }, { arms: false });
  chars += mom(t, { x: -1000, y: 985, s: sAt(985), turn: lerp(-0.4, 0.5, look), shieldUp: true, face: { name: 'neutral', eyes: { look: [0.6, 0] } }, nametag: false }, { arms: false });
  chars += gran(t, { x: -520, y: 990, s: sAt(990), turn: lerp(0.2, -0.5, look), face: { name: 'neutral', eyes: { look: [-0.6, 0] } }, nametag: false }, { arms: false });
  chars += hero(t, { x: hx, y: 1000, s: sAt(1000), face: t > B.jump ? { name: 'shocked', fx: ['sweat'] } : { name: 'determined' }, armR: 40, nametag: false }, { arms: false });
  let o = tower(t, cam, {}, { back: dome(t, { k: 1 }), chars });
  const ph = scr(cam, hx, 1000 - sAt(1000) * 1150);
  const qk = seg(t, B.jump, B.jump + 0.3);
  if (qk > 0) o += S.g(T('?', 0, 0, 160, '#FFD23F', { stroke: '#151515', 'stroke-width': 14, 'paint-order': 'stroke' }), `translate(${f(ph.x + 150)} ${f(ph.y)}) rotate(12) scale(${f(ease.outBack(qk))})`);
  return o + whip(t, C.l3, -1, 0.1);
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
  const fall = seg(t, B.falls - 0.1, LN[11].b + 0.4);
  const hp = scr(cam, -1080, 1000 - sAt(1000) * 1000);
  o += E.thoughtBubble(1250, 420, 470, 300, S.g(teamMini(t, fall), 'scale(0.88)'), seg(t, C.m2, C.m2 + 0.3), hp.x + 60, hp.y);
  return o;
}
// N1 — "Everybody was fighting." a pan across the fight
function shotN1(t) {
  const u = seg(t, C.n1, C.n2);
  const cam = camLerp({ x: -2200, y: -140, zoom: 0.74 }, { x: -1300, y: -140, zoom: 0.74 }, u, ease.inOut);
  const ph = (t - C.n1) * 1.6;
  const hits = [0, 1, 2, 3, 4].map((i) => ({ x: DOME.x + [-900, 860, 940, -820, 700][i], y: [760, 620, 820, 560, 450][i], age: (ph + i * 0.37) % 0.8 }));
  let chars = '';
  const F = [[-2800, 950, 'noodle', 1], [-2680, 900, 'p', 1], [-2720, 1000, 'p', 1], [-760, 990, 'mom', -1], [-700, 920, 'dark', -1], [-620, 960, 'hero', -1], [-560, 880, 'p', -1], [-520, 1000, 'p', -1], [-380, 950, 'gran', -1]];
  F.forEach(([x, y, k, dir], j) => {
    const sw = Math.sin(t * 9 + j * 1.3);
    const pose = { x, y, s: sAt(y), view: 'side', flip: dir > 0, armR: 100 + 60 * sw, nametag: false };
    if (k === 'hero') chars += hero(t, pose, { arms: false });
    else if (k === 'mom') chars += mom(t, { ...pose, shieldUp: true }, { arms: false });
    else if (k === 'dark') chars += dark(t, pose, { arms: false });
    else if (k === 'noodle') chars += noodle(t, { ...pose, sword: true }, { arms: false });
    else if (k === 'gran') chars += gran(t, { ...pose, armR: undefined, armL: 90 + 50 * sw }, { arms: false });
    else chars += player(5 + j, { ...pose, sword: 'gold' });
  });
  const back = boss(t, { ...bkRoar(), shield: 1 }) + dome(t, { k: 1, hits });
  let o = tower(t, cam, {}, { back, chars });
  return o + bossHud(t, { shield: 1 }) + whip(t, C.n1, 1, 0.1);
}
// N2 — "Everybody... except one." the pan drifts away from the fight, over the lava, to the foot of the tower:
// the hot dog alone in the moonlight, looking up
function shotN2(t) {
  const u = seg(t, C.n2, C.o1);
  const pan = ease.inOut(seg(t, C.n2, B.one + 0.3));
  let cam = camLerp({ x: -1300, y: -140, zoom: 0.74 }, { ...TW.cams.base, x: TW.cams.base.x - 40 }, pan, ease.inOut);
  cam = { ...cam, zoom: cam.zoom * (1 + 0.12 * ease.inOut(seg(t, B.one + 0.3, C.o1))) };
  const back = boss(t, { ...bkRoar(), shield: 1 }) + dome(t, { k: 1 });
  let chars = '';
  for (const [x, y, j] of [[-760, 990, 0], [-620, 960, 1], [-700, 920, 2]]) chars += player(5 + j, { x, y, s: sAt(y), view: 'side', armR: 100 + 60 * Math.sin(t * 9 + j), sword: 'gold', nametag: false });
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
  const cam = camAt(bs.x + 40, bs.y - 260, 2.1);
  const back = E.moonBeam(bs.x + 260, -300, bs.x, bs.y, 30, 150, 0.2);
  const ch = hotdog(t, { x: bs.x, y: bs.y, s: bs.s, turn: -0.3, armL: 12, armR: 12, face: { name: 'determined', mouth: 'smallSmile' }, nametag: false }, { arms: false, energy: 0 });
  return { svg: tower(t, cam, {}, { back, chars: ch }), cam };
}
function shotO2(t) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#05030C' });
  const k1 = seg(t, C.o2, C.o2 + 0.3), k2 = seg(t, C.o2 + 0.15, C.o2 + 0.45);
  o += E.panel(30, 60, 920, 840, dadFace(t), { k: k1, col: '#F2B705', sc: 0.82, ox: -60, oy: -20 });
  const HD = hotdogMoon(t);
  o += E.panel(970, 60, 920, 840, HD.svg, { k: k2, col: '#7FD3FF', sc: 0.82, ox: -330, oy: 0 });
  const cl = G.chatLine(t, '10.13', { from: "I've", hold: 3, text: "I'VE BEEN PRACTICING." });
  if (k2 > 0.9) o += G.chatBubble({ x: 1430, y: 300, caps: true, ...cl, typed: G.chatSync(t, '10.13', { from: "I've" }), k: seg(t, C.o2, C.o2 + 0.3), t, s: 0.9, tail: 0, user: 'DadBod1978' });
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
