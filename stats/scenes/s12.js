// SC 12 · FINALE + OUTRO (SC 12 start … end of video). The living room, the HUD on one last time: Max's claw pokes the
// tablet → PET STATS: ON → "Pet stats enabled." → the scan finds Biscuit: LV 1000 (counting up), GOOD BOY ∞ (the very-good-boy
// face, rays, choir); Max gasps; Grandpa: "Level one thousand?" (his glasses drop onto his nose) "That dog has never done
// anything!" → Biscuit asleep, NAPS TODAY: 14; Max hugs him: "He's a GOOD BOY, Grandpa!" / "I KNEW it!"; "What does yours
// say?" — over Max's shoulder the tablet sees the hero: "???"; the HUD fades, the ??? slowly dissolves (No level. No
// numbers.) and warms into BIG BROTHER on "Just two words."; "Big brother." … "That's a good stat." — the side hug, pull
// back to the family (Mom in the doorway); the outro: everyone in a row with callback plates (Mom ENERGY 100%, Tank HP
// 100/100 …), "YOUR STAT: ___?", the comment box; the end screen (two video slots, SUBSCRIBE +100 XP → LEVEL UP), fade out.
'use strict';

const K = require('./kit');
const H = require('./hud');
const SH = require('./sets_home');
const X = require('../rig/extras');
const AC = require('./acting');
const E = require('./s01_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, sc, camAt, toScr, shakeAll, boing, dim, whip, smash, zoomLines, rings } = E;

const A = Array.from({ length: 9 }, (_, i) => L('12.' + i));
const T0 = K.V.scene('SC 12').start, END = K.V.DURATION;           // == main.js RANGES for SC 12
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const LS = SH.SPOTS.livingRoom, FL = SH.FLOOR.livingRoom;

// ================================================================= the cut list (all from the voice)
const CUT = {};
CUT.poke = T0;
CUT.room = w(0, 'enabled') - 0.1;
CUT.biscuit = A[1].a - 0.1;
CUT.good = w(1, 'Good') - 0.12;
CUT.gasp = A[1].b + 0.3;
CUT.grandpa = A[2].a - 0.12;
CUT.never = w(2, 'That') - 0.1;
CUT.nap = w(2, 'done') - 0.1;
CUT.defend = A[3].a - 0.1;
CUT.knew = A[4].a - 0.15;
CUT.point = A[5].a - 0.15;
CUT.loaded = A[6].a - 0.1;
CUT.reveal = w(6, 'No') - 0.1;
CUT.bigbro = A[7].a - 0.1;
CUT.goodstat = w(7, "That's") - 0.1;
CUT.outro = A[8].a - 0.1;
CUT.yourstat = w(8, 'what') - 0.1;
CUT.comments = w(8, 'Tell') - 0.1;
CUT.end = A[8].b + 0.2;
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
// beats
const B = {};
B.poke = T0 + 0.28;                                                // the claw taps PET STATS
B.sys = A[0].a - 0.05;                                             // SYSTEM pop-up types with the voice
B.scan = CUT.room + 0.1;                                           // the pink scan sweeps the room
B.lock = CUT.room + 0.65;                                          // …and locks onto Biscuit
B.name = A[1].a; B.lv0 = w(1, 'Level'); B.lv1 = w1(1, 'thousand');
B.good = w(1, 'Good'); B.inf = w(1, 'infinite');
B.glasses = w(2, 'one');                                           // Grandpa's glasses drop onto his nose
B.naps = w(2, 'anything');
B.goodBoy = w(3, 'GOOD');
B.knew = w(4, 'KNEW');
B.loaded = w(6, 'loaded');
B.noLevel = w(6, 'level'); B.noNum = w(6, 'numbers');
B.two = w(6, 'two'); B.words1 = w1(6, 'words');
B.pull = A[7].b + 0.05;                                            // pull back to the family
B.momIn = CUT.goodstat + 0.4;
B.pops = [w(8, 'So'), w(8, 'if'), w(8, 'see'), w(8, 'one'), w(8, 'stat'), w(8, 'above'), w(8, "everyone's")];
B.head = w(8, 'head');
B.click = CUT.end + 1.35;                                           // SUBSCRIBE clicked
B.fadeOut = END - 0.5;

// ================================================================= helpers
const hudPet = (t, o = {}) => H.hudFrame({ t, clock: '4:12 PM', day: 'SUN', label: 'PET STATS', theme: 'pet', ...o });
const seat = (spot, size, extra) => SH.seatPose(spot, size, extra);
const heroSeat = (extra = {}) => seat(LS.seats.couchM, 1, extra);
const DOG = { x: LS.dogBed.dog.x, y: LS.dogBed.dog.y, s: LS.dogBed.dog.s };
const MAXP = { x: 1135, y: FL, s: 0.5 };
// the room with characters: o.chars = svg drawn after `front` (standing), o.seated = before `front`
function room(t, cam, o = {}) {
  const Lr = SH.livingRoom.layers(t, { time: 'day', lamp: 0.4 });
  return view(cam, Lr.bg, 0.8) + view(cam, Lr.mid + (o.seated || '') + Lr.front + (o.chars || '') + (Lr.fg || '') + Lr.light);
}
const biscuitDraw = (t, p = {}) => K.draw.biscuit({ ...DOG, t, pose: 'sit', ...p });
// Biscuit's pet plate (screen space) — lv / bar animate
function petPlate(t, cam, o = {}) {
  const pose = o.pose || 'sit';
  const hd = H.overHead('biscuit', DOG.x, DOG.y, DOG.s, 0, { pose });
  const q = toScr(cam, hd.x, hd.y);
  const lvU = ease.out(seg(t, B.lv0, B.lv1));
  const lv = o.level ?? (t < B.lv0 ? '?' : String(Math.round(lerp(1, 1000, lvU))));
  const gb = t >= B.inf ? Infinity : Math.round(100 * ease.inOut(seg(t, B.good, B.inf)));
  return H.plateFor('biscuit', { x: q.x + (o.dx || 0), y: q.y + (o.dy || 0), s: o.s ?? 1.0, t, k: o.k ?? 1, level: lv, fade: o.fade || 0, bars: [{ label: 'GOOD BOY', value: gb, blink: false, bump: bump(t, B.inf, B.inf + 0.4) + bump(t, B.goodBoy, B.goodBoy + 0.4) }], tags: o.tags });
}
// the hero's plate over him on the couch
function heroPlateAt(t, cam, o = {}) {
  const hs = heroSeat(o.pose || {});
  const hd = H.overHead('you', hs.x, hs.y, hs.s, 0, o.pose || {});
  const q = toScr(cam, hd.x, hd.y);
  return H.heroPlate({ x: q.x, y: q.y, s: o.s ?? 1, t, k: o.k ?? 1, reveal: o.reveal || 0, fade: o.fade || 0 });
}
// reveal curve: ??? → dissolve on "No level. No numbers." → BIG BROTHER on "Just two words."
function revealAt(t) {
  if (t < B.loaded) return 0;
  if (t < B.noLevel) return lerp(0, 0.2, seg(t, B.loaded, B.noLevel));
  if (t < B.two - 0.25) return lerp(0.2, 0.44, seg(t, B.noLevel, B.two - 0.25));
  return lerp(0.44, 1, ease.inOut(seg(t, B.two - 0.25, B.words1 + 0.35)));
}
// little glyphs falling off the dissolving plate ("No level. No numbers.")
function fallingBits(x, y, t, t0, txts, seed = 1, s = 1) {
  let o = '';
  txts.forEach((tx, i) => {
    const a = t - t0 - i * 0.12;
    if (a < 0 || a > 1.6) return;
    const dx = (hash(i * 3.1 + seed) - 0.5) * 300 * s + (hash(i * 3.1 + seed) - 0.5) * 160 * a * s, vy = -40 - 120 * a;
    o += H.TL(tx, x + dx + 20 * Math.sin(a * 3 + i), y + vy * s, 34 * s, '#7CF7FF', { opacity: f(1 - seg(a, 0.6, 1.6)), stroke: '#03101B', 'stroke-width': 6 * s, 'paint-order': 'stroke', transform: `rotate(${f((hash(i + seed) - 0.5) * 120 * a)} ${f(x + dx)} ${f(y + vy * s)})` });
  });
  return o;
}
// the tablet SETTINGS screen (screen space, centred at (cx, cy); w × h screen); on 0..1 = the PET STATS toggle
function settingsScreen(cx, cy, w, h, t, on, press) {
  let o = S.rect(cx - w / 2 - 40, cy - h / 2 - 40, w + 80, h + 80, 48, ol('#2A3550', 10));
  o += S.rect(cx - w / 2, cy - h / 2, w, h, 16, { fill: '#0E1A33' });
  o += S.circle(cx - w / 2 - 20, cy, 7, { fill: '#4A5A7A' });
  const th = H.theme('cyan');
  o += H.eyeLogo(cx - w / 2 + 54, cy - h / 2 + 56, 18, th.rim, t) + H.TL('REALITY HUD · SETTINGS', cx - w / 2 + 90, cy - h / 2 + 68, 40, '#EAFBFF', { 'text-anchor': 'start' });
  const rows = [['PEOPLE STATS', 1, '#3BE8FF'], ['OBJECT TOOLTIPS', 1, '#3BE8FF'], ['QUEST MARKERS', 1, '#FFD21F'], ['PET STATS', on, '#FF6FB5']];
  rows.forEach(([lab, v, col], i) => {
    const y = cy - h / 2 + 150 + i * 92;
    const pet = i === 3;
    if (pet) o += S.rect(cx - w / 2 + 20, y - 40, w - 40, 80, 14, { fill: '#FF6FB5', opacity: f(0.12 + 0.12 * Math.sin(t * 6)) });
    o += H.TL(lab, cx - w / 2 + 50, y + 14, 38, pet ? '#FFD6EC' : '#CFE9F5', { 'text-anchor': 'start' });
    if (pet && v < 0.5) o += S.g(S.rect(-46, -18, 92, 36, 18, ol('#FFD21F', 3)) + H.TF('NEW!', 0, 9, 20, '#1A1020'), tf(cx - w / 2 + 330, y + 2, 1 + 0.08 * Math.sin(t * 9), -6));
    const sx = cx + w / 2 - 120;
    const vv = clamp(v, 0, 1);
    o += S.rect(sx - 60, y - 26, 120, 52, 26, ol(vv > 0.5 ? col : '#3A4560', 4));
    o += S.circle(sx + lerp(-34, 34, vv), y, 20 * (1 - 0.15 * (pet ? press : 0)), ol('#FFFFFF', 4));
    if (pet && vv > 0.5) o += H.TF('ON', sx - 22, y + 8, 22, '#FFFFFF');
  });
  return o;
}
// Max's dino claw mitten (screen space), pointing up-left; (x, y) = fingertip
function claw(x, y, s = 1, rot = -30) {
  let g = S.path('M-60 30 Q-70 -30 -30 -60 Q10 -80 40 -50 Q70 -20 60 40 L60 200 L-60 200 Z', ol('#5DBB4A', 7));
  g += S.path('M-40 -50 L-50 -96 L-22 -62 Z M-6 -66 L-4 -112 L16 -64 Z M28 -50 L44 -92 L46 -42 Z', ol('#FFF8E8', 5));
  g += S.path('M-60 130 Q0 150 60 130', ln(6, '#3E8A30')) + S.circle(-20, -6, 9, { fill: '#7CD86A' }) + S.circle(18, 10, 7, { fill: '#7CD86A' });
  return S.g(g, `${tf(x, y, s, rot)} translate(4 100)`);
}
// a hand (the hero's white mitt) holding the tablet edge
const mitt = (x, y, s, rot) => S.g(S.path('M-50 -40 Q-60 -80 -20 -84 L30 -84 Q60 -80 56 -40 L56 40 Q56 70 20 70 L-20 70 Q-56 70 -56 40 Z', ol('#FFFFFF', 6)) + S.path('M-56 120 L-56 40 M56 40 L56 120', ln(6)) + S.rect(-62, 60, 124, 80, 10, ol('#D8352E', 6)), tf(x, y, s, rot));

// ================================================================= SHOTS
// ---- 1. (SC11 → SC12) Max's claw pokes the hero's tablet: PET STATS → ON
function shPoke(t) {
  const cam = camAt(900, 560, 1.7);
  let o = room(t, cam, {}) + dim(0.45, '#2A1E3A');
  const press = bump(t, B.poke - 0.05, B.poke + 0.2);
  const on = ease.outBack(seg(t, B.poke + 0.02, B.poke + 0.25));
  const sc0 = lerp(0.96, 1.02, seg(t, CUT.poke, CUT.room));
  let scr = settingsScreen(960, 520, 960, 520, t, on, press);
  scr += mitt(380, 900, 1.1, 16) + mitt(1540, 900, 1.1, -16);
  // the claw: comes in from the bottom right, taps the PET STATS switch, pulls back
  const sx = 960 + 960 / 2 - 120 + 34 * on, sy = 520 - 260 + 150 + 3 * 92;
  const inn = ease.out(seg(t, CUT.poke - 0.1, B.poke - 0.05)), back = ease.in(seg(t, B.poke + 0.25, CUT.room));
  const cx = lerp(1800, sx + 6, inn) + 300 * back, cy = lerp(1200, sy + 8, inn) + 260 * back;
  scr += claw(cx, cy, 1, -32);
  scr += rings(sx, sy, t - B.poke, '#FF9FD0', 2, 160, 0.4);
  o += S.g(scr, `translate(960 540) scale(${f(sc0)}) translate(-960 -540)`);
  o += K.bang('tap!', 1640, 430, pop(t, B.poke, 0.18) * (1 - seg(t, B.poke + 0.4, B.poke + 0.55)), 64, 8, '#FF9FD0');
  return o;
}

// ---- 2. SYSTEM: "Pet stats enabled." — the wide room; the pink HUD; the scan sweeps … locks on Biscuit
function shRoom(t) {
  const cam = camKeys(t, [[CUT.room, { x: 0, y: 30, zoom: 1.05 }], [CUT.biscuit, camAt(1180, 640, 1.25)]], ease.inOut);
  const seated = actor('you', t, heroSeat({ tablet: true, tabletFace: 'back', face: { name: 'amazed', eyes: { look: [0.6, 0.4] } } })) + actor('grandpa', t, seat(LS.seats.armchair, 1.1, { face: 'neutral', glasses: 'up' }));
  const chars = biscuitDraw(t, { look: -0.3 }) + actor('max', t, { ...MAXP, hood: 'down', turn: 0.4, armL: 30, armR: 140 + 20 * Math.sin(t * 9), face: 'excited', t }, { arms: false });
  let o = room(t, cam, { seated, chars });
  // the pink scan beam sweeping left → right
  const u = seg(t, B.scan, B.lock);
  if (u > 0 && u < 1) {
    const sx = lerp(-100, 1500, ease.inOut(u));
    o += S.rect(sx - 8, 0, 16, 1080, 0, { fill: '#FF6FB5', opacity: 0.75 }) + S.rect(sx - 70, 0, 70, 1080, 0, { fill: '#FF6FB5', opacity: 0.12 });
  }
  const dq = toScr(cam, DOG.x, DOG.y - 210 * DOG.s);
  const lk = seg(t, B.lock - 0.05, B.lock + 0.25);
  if (lk > 0) o += E.scanReticle(dq.x, dq.y, 130 * cam.zoom * 0.5 + 40, t, lk, '#FF6FB5');
  o += hudPet(t, { glitch: 0.4 * bump(t, CUT.room, CUT.room + 0.4) });
  o += H.systemMsg({ t, theme: 'ok', icon: 'paw', text: 'Pet stats enabled.', k: seg(t, B.sys, B.sys + 0.4), type: seg(t, A[0].a, A[0].b - 0.2), y: 170 });
  return o;
}

// ---- 3. "Biscuit. Level one thousand." — Biscuit sits up proud; plate: name types, LV counts 1 → 1000
function shBiscuit(t) {
  const cam = camKeys(t, [[CUT.biscuit, camAt(DOG.x, DOG.y - 150, 2.3)], [CUT.good, camAt(DOG.x, DOG.y - 170, 2.55)]], ease.inOut);
  const chars = biscuitDraw(t, { face: 'happy', wag: 0.9, ...boing(t, B.lv1 - 0.1, 0.12) });
  let o = room(t, cam, { chars });
  o += petPlate(t, cam, { s: 1.35, k: seg(t, B.name - 0.15, B.name + 0.4) });
  o += hudPet(t);
  o += H.systemMsg({ t, theme: 'ok', icon: 'paw', text: 'Pet stats enabled.', k: 1, out: seg(t, CUT.biscuit, CUT.biscuit + 0.35), y: 170 });
  return o;
}

// ---- 4. "Good boy: infinite." — smash-zoom: the very-good-boy face, rays, the bar fills past ∞
function shGood(t) {
  const cam = shakeAll(camKeys(t, [[CUT.good, camAt(DOG.x, DOG.y - 190, 2.9)], [CUT.gasp, camAt(DOG.x, DOG.y - 200, 3.2)]], ease.out), t, [[B.inf, 0.35, 8]]);
  const glowK = seg(t, B.inf - 0.1, B.inf + 0.4);
  const hq = toScr(cam, DOG.x, DOG.y - 300 * DOG.s);
  let back = '';
  const Lr = SH.livingRoom.layers(t, { time: 'day' });
  let o = view(cam, Lr.bg, 0.8) + view(cam, Lr.mid);
  if (glowK > 0) o += K.rays(hq.x, hq.y, 16, 1400, '#FFE6A8', 0.35 * glowK, t * 25) + H.glow(hq.x, hq.y, 360, 300, '#FFF1C8', 0.5 * glowK, 4);
  o += view(cam, Lr.front + biscuitDraw(t, { face: t > B.good + 0.1 ? 'good' : 'happy', wag: 1, ...boing(t, B.inf, 0.15) }) + Lr.light);
  o += K.sparkles([[hq.x - 260, hq.y - 120, 26], [hq.x + 270, hq.y - 60, 22], [hq.x - 200, hq.y + 180, 18], [hq.x + 230, hq.y + 200, 24]].map(([x, y, r]) => [x, y, r * glowK]), t);
  o += petPlate(t, cam, { s: 1.5, dy: 0 });
  o += hudPet(t);
  return o + smash(t, CUT.good, 0.1, 0.5) + smash(t, B.inf, 0.12, 0.35, '#FFF4D8');
}

// ---- 5. (beat) Max gasps: star eyes, hands on his cheeks
function shGasp(t) {
  const cam = camKeys(t, [[CUT.gasp, camAt(MAXP.x, MAXP.y - 260, 2.5)], [CUT.grandpa, camAt(MAXP.x, MAXP.y - 260, 2.7)]], ease.inOut);
  const chars = actor('max', t, { ...MAXP, hood: 'down', armL: 150, armR: 150, bendL: 120, bendR: 120, face: { name: 'excited', mouth: 'O' }, lift: 30 * bump(t, CUT.gasp, CUT.gasp + 0.4), t, volume: false }, { arms: false });
  let o = room(t, cam, { chars });
  const q = toScr(cam, MAXP.x + 150, MAXP.y - 560 * MAXP.s);
  o += S.g(H.infinity(0, 0, 90, '#FF6FB5', 14), tf(q.x, q.y, pop(t, CUT.gasp + 0.15, 0.25), -8));
  o += hudPet(t);
  return o;
}

// ---- 6. GRANDPA: "Level one thousand?" — the tablet in his hands; his glasses drop onto his nose
const GP = seat(LS.seats.armchair, 1.1, {});
function grandpaTablet(t, o = {}) {
  if (o.lap) return X.tablet({ x: GP.x + 10, y: GP.y - 150, s: 0.36, rot: 76, face: 'back' });
  return X.tablet({ x: GP.x - 20, y: GP.y - 205, s: 0.4, rot: -6, face: 'back' });
}
function shGrandpa(t) {
  const cam = camKeys(t, [[CUT.grandpa, camAt(1470, 600, 1.6)], [CUT.never, camAt(1520, 560, 1.85)]], ease.inOut);
  const on = t > B.glasses;
  const gp = actor('grandpa', t, { ...GP, glasses: on ? 'on' : 'up', armL: 28, armR: 28, bendL: -112, bendR: -112, lean: 4, headY: on ? 6 * Math.exp(-(t - B.glasses) * 8) : 0, face: on ? { name: 'shocked' } : { name: 'confused' } }, { arms: false });
  const mx = 1330;
  const chars = actor('max', t, { x: mx, y: FL, s: 0.5, hood: 'down', turn: 0.6, armR: 120 + 15 * Math.sin(t * 10), armL: 20, face: 'excited', t }, { arms: false });
  let o = room(t, cam, { seated: gp + grandpaTablet(t), chars });
  o += K.bang('!?', toScr(cam, GP.x + 120, GP.y - 1000 * GP.s).x, toScr(cam, GP.x + 120, GP.y - 1000 * GP.s).y, pop(t, B.glasses + 0.05, 0.2), 90, 10, '#FFD21F');
  o += hudPet(t);
  return o;
}

// ---- 7. "That dog has never done anything!" — he points across the room, outraged
function shNever(t) {
  const cam = camKeys(t, [[CUT.never, camAt(1450, 640, 1.42)], [CUT.nap, camAt(1430, 650, 1.36)]], ease.out);
  const pt = ease.outBack(seg(t, CUT.never, CUT.never + 0.25));
  const gp = actor('grandpa', t, { ...GP, glasses: 'on', armL: lerp(28, 96, pt), bendL: lerp(-112, 0, pt), armR: 28, bendR: -112, lean: -4, face: { name: 'angry' } }, { arms: false, energy: 1.4 });
  let o = room(t, cam, { seated: gp + grandpaTablet(t, { lap: true }), chars: biscuitDraw(t, { face: 'neutral', wag: 0.2, look: 0.6 }) });
  const gq = toScr(cam, GP.x - 200, GP.y - 560);
  o += K.bang('NOTHING!', gq.x - 120, gq.y - 40, pop(t, w(2, 'never') - 0.05, 0.2), 70, -8, '#FFD21F');
  o += hudPet(t);
  return o;
}

// ---- 8. (…"done anything!") — Biscuit is asleep. NAPS TODAY: 14
function shNap(t) {
  const cam = camKeys(t, [[CUT.nap, camAt(DOG.x, DOG.y - 110, 2.4)], [CUT.defend, camAt(DOG.x, DOG.y - 110, 2.6)]], ease.inOut);
  let o = room(t, cam, { chars: biscuitDraw(t, { pose: 'sleep', face: 'sleep' }) });
  o += petPlate(t, cam, { pose: 'sleep', s: 1.25, tags: [{ text: 'NAPS TODAY: 14', col: '#B06BFF', k: seg(t, B.naps, B.naps + 0.35) }] });
  o += hudPet(t);
  return o;
}

// ---- 9. MAX: "He's a GOOD BOY, Grandpa!" — he throws his arms around Biscuit
function shDefend(t) {
  const cam = camKeys(t, [[CUT.defend, camAt(1215, 790, 2.1)], [CUT.knew, camAt(1215, 780, 2.25)]], ease.inOut);
  const shout = seg(t, B.goodBoy - 0.1, B.goodBoy + 0.15) * (1 - seg(t, A[3].b - 0.2, A[3].b + 0.1));
  const mx = 1150;
  const max = actor('max', t, { x: mx, y: FL - 10, s: 0.5, hood: 'down', turn: 0.5, armR: lerp(80, 150, shout), bendR: lerp(-60, 30, shout), armL: lerp(20, 150, shout), lean: lerp(10, -4, shout), face: shout > 0.5 ? { name: 'angry', mouth: 'scream' } : { name: 'happy', eyes: { type: 'closed' } }, t, ...boing(t, B.goodBoy, 0.15) }, { arms: false });
  const dog = biscuitDraw(t, { face: 'love', wag: 1, look: -0.5 });
  let o = room(t, cam, { chars: dog + max });
  o += petPlate(t, cam, { s: 1.15, dx: 60 });
  o += hudPet(t);
  return o;
}

// ---- 10. MAX: "I KNEW it!" — he jumps, fists up; Biscuit begs; hearts + confetti
function shKnew(t) {
  const cam = shakeAll(camKeys(t, [[CUT.knew, camAt(1215, 760, 1.9)], [CUT.point, camAt(1215, 760, 2.0)]], ease.inOut), t, [[B.knew, 0.3, 10]]);
  const jump = bump(t, B.knew - 0.15, B.knew + 0.45);
  const max = actor('max', t, { x: 1120, y: FL - 10, s: 0.5, hood: 'down', lift: 150 * jump, armL: 160, armR: 160, bendL: 30, bendR: 30, face: { name: 'excited' }, legL: -20 * jump, legR: 20 * jump, kneeL: 40 * jump, kneeR: 40 * jump, ...boing(t, B.knew + 0.45, 0.2), t }, { arms: false });
  const dog = biscuitDraw(t, { pose: t > B.knew ? 'beg' : 'sit', face: 'good', wag: 1 });
  let o = room(t, cam, { chars: dog + max });
  o += petPlate(t, cam, { pose: t > B.knew ? 'beg' : 'sit', s: 1.1, dx: 70 });
  const hq = toScr(cam, 1120, FL - 400);
  o += H.friendshipPop({ x: hq.x + 40, y: hq.y - 60, age: t - B.knew - 0.05, value: 1, label: 'GOOD BOY CONFIRMED' });
  o += K.confetti(t, B.knew, 50, 4);
  o += hudPet(t);
  return o + smash(t, B.knew, 0.08, 0.35);
}

// ---- 11. MAX: "What does yours say?" — over his shoulder, the tablet finds the hero: ???
function tabletView(t) {
  return (w, h) => {
    // a little live view of the couch: the hero + "???"
    let g = S.rect(0, 0, w, h, 0, { fill: '#9DC79A' }) + S.rect(0, h * 0.62, w, h * 0.38, 0, { fill: '#7A5A3A' });
    g += S.rect(-20, h * 0.48, w + 40, h * 0.3, 30, ol('#3E68B8', 5));
    g += S.g(actor('you', t, { x: 0, y: 0, s: 1, face: { name: 'neutral', eyes: { look: [0, 0] } }, volume: false }), `translate(${w / 2} ${h * 0.98}) scale(${f(h / 1500)})`);
    g += H.heroPlate({ x: w / 2, y: h * 0.98 - 951 * h / 1500, s: 0.48, t, k: 1 });
    // viewfinder brackets
    const b = 26;
    g += S.path(`M14 ${14 + b}V14H${14 + b}M${w - 14 - b} 14H${w - 14}V${14 + b}M14 ${h - 14 - b}V${h - 14}H${14 + b}M${w - 14 - b} ${h - 14}H${w - 14}V${h - 14 - b}`, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 5 });
    g += S.circle(w - 30, 30, 8, { fill: Math.floor(t * 2) % 2 ? '#FF3355' : '#7A1020' });
    return g;
  };
}
function shPoint(t) {
  const cam = camKeys(t, [[CUT.point, camAt(1000, 620, 1.45)], [CUT.loaded, camAt(960, 600, 1.55)]], ease.inOut);
  const seated = actor('you', t, heroSeat({ face: { name: 'confused', eyes: { look: [0.3, 0.3] } }, armL: 18, armR: 18 }));
  let o = room(t, cam, { seated, chars: biscuitDraw(t, { face: 'happy' }) });
  o += heroPlateAt(t, cam, { s: 0.85 });
  // Max in the foreground (screen space, back view), tablet raised
  const raise = ease.outBack(seg(t, CUT.point, CUT.point + 0.4));
  o += actor('max', t, { x: 1400, y: 1330, s: 1.3, view: 'back', hood: 'down', armL: lerp(20, 150, raise), armR: lerp(20, 150, raise), bendL: 40, bendR: 40, volume: false, t }, { arms: false });
  const tq = { x: lerp(1500, 1360, raise), y: lerp(1150, 500, raise) };
  o += X.tablet({ x: tq.x, y: tq.y, s: 1.12, rot: -4, face: 'screen', screen: tabletView(t), glow: 0.5 });
  o += hudPet(t, { k: 1 - seg(t, CUT.loaded - 0.6, CUT.loaded) * 0.6 });
  return o;
}

// ---- 12. "For the first time, your stats loaded." — the hero on the couch; the HUD fades; the ??? begins to stir
function shLoaded(t) {
  const cam = camKeys(t, [[CUT.loaded, camAt(960, 560, 1.55)], [CUT.reveal, camAt(900, 520, 1.85)]], ease.inOut);
  const seated = actor('you', t, heroSeat({ face: { name: 'amazed', eyes: { look: [0, -0.9] } }, armL: 16, armR: 16 }), { arms: false });
  const max = actor('max', t, seat(LS.seats.couchR, 0.56, { x: LS.seats.couchR.x - 40, hood: 'down', turn: -0.45, tablet: true, screen: tabletView(t), glow: 0.4, face: { name: 'happy', eyes: { look: [-0.7, -0.3] } }, t }));
  let o = room(t, cam, { seated: seated + max });
  o += heroPlateAt(t, cam, { s: 1.15 * Math.pow(cam.zoom / 1.55, 0.6), reveal: revealAt(t) });
  o += hudPet(t, { k: 1 - seg(t, CUT.loaded, CUT.loaded + 1.2) });
  return o;
}

// ---- 13. "No level. No numbers. Just two words." — one slow push: the ??? dissolve, the glass warms → BIG BROTHER
function shReveal(t) {
  const hs = heroSeat();
  const hd = H.overHead('you', hs.x, hs.y, hs.s);
  const cam = camKeys(t, [[CUT.reveal, camAt(hs.x, hd.y + 60, 2.15)], [CUT.bigbro, camAt(hs.x, hd.y + 40, 2.75)]], ease.inOut);
  const seated = actor('you', t, heroSeat({ face: { name: 'amazed', eyes: { look: [0, -1] } }, armL: 16, armR: 16, volume: false }), { arms: false });
  let o = room(t, cam, { seated });
  const rv = revealAt(t);
  o += dim(0.12 * (1 - seg(rv, 0.45, 0.8)), '#1A1030');
  const q = toScr(cam, hd.x, hd.y);
  const ps = 1.25 * Math.pow(cam.zoom / 2.15, 0.5);
  o += H.heroPlate({ x: q.x, y: q.y, s: ps, t, k: 1, reveal: rv });
  o += fallingBits(q.x - 60 * ps, q.y - 90 * ps, t, B.noLevel, ['LV', '?', '?'], 3, ps);
  o += fallingBits(q.x + 40 * ps, q.y - 90 * ps, t, B.noNum, ['99', '1000', '87', '%', '3'], 7, ps);
  return o;
}

// ---- 14. YOU: "...Big brother." — the warm close-up
function shBigbro(t) {
  const hs = heroSeat();
  const hd = H.overHead('you', hs.x, hs.y, hs.s);
  const cam = camKeys(t, [[CUT.bigbro, camAt(hs.x, hd.y + 150, 2.9)], [CUT.goodstat, camAt(hs.x, hd.y + 140, 3.1)]], ease.inOut);
  const seated = actor('you', t, heroSeat({ face: { name: 'happy', fx: ['blush'] }, armL: 16, armR: 16, volume: false }), { arms: false, energy: 0.4 });
  let o = room(t, cam, { seated });
  const q = toScr(cam, hd.x, hd.y);
  o += H.heroPlate({ x: q.x, y: Math.max(q.y, 260), s: 1.4, t, k: 1, reveal: 1 });
  return o;
}

// ---- 15. "That's a good stat." — Max climbs up for a side hug; pull back to the family; Mom leans in the doorway
function shGoodstat(t) {
  const cam = camKeys(t, [[CUT.goodstat, camAt(960, 560, 1.9)], [B.pull, camAt(960, 560, 1.85)], [B.pull + 2.2, { x: 110, y: 10, zoom: 0.98 }], [CUT.outro, { x: 110, y: 10, zoom: 0.96 }]], ease.inOut);
  const hug = ease.inOut(seg(t, CUT.goodstat, CUT.goodstat + 0.6));
  const vol = cam.zoom > 1.25 ? false : undefined;                // big close-ups: flat bodies (perf)
  const hero = actor('you', t, heroSeat({ turn: 0.35 * hug, armR: lerp(16, 100, hug), bendR: lerp(0, 30, hug), armL: 16, headRot: 6 * hug, face: { name: 'happy', fx: ['blush'] }, volume: vol }), { arms: false, energy: 0.5 });
  const max = actor('max', t, seat(LS.seats.couchR, 0.56, { x: LS.seats.couchR.x - 70, hood: 'down', rot: -8 * hug, armL: lerp(20, 80, hug), bendL: -40 * hug, face: { name: 'happy', eyes: { type: 'closed' }, fx: ['blush'] }, volume: vol, t }), { arms: false });
  const gp = actor('grandpa', t, { ...GP, glasses: 'on', face: { name: 'happy' }, volume: vol });
  const mw = ease.inOut(seg(t, B.momIn, B.momIn + 1.6));
  const mom = actor('mom', t, { x: lerp(2140, 1770, mw), y: FL, s: 0.5, flour: 0.3, ...(mw > 0 && mw < 1 ? { view: 'side', ...AC.walk(t * 6, 0.8) } : { turn: -0.4, face: { name: 'happy', eyes: { type: 'closed' } }, armL: 20, armR: 20, bendL: -110, bendR: -110 }) }, { arms: false });
  let o = room(t, cam, { seated: hero + max + gp, chars: biscuitDraw(t, { face: 'good', wag: 0.8 }) + mom });
  o += heroPlateAt(t, cam, { s: lerp(1.25, 0.95, seg(t, B.pull, B.pull + 2.2)), reveal: 1 });
  return o;
}

// ---- 16. NARRATOR: "So... if you could see one stat above everyone's head..." — the family line-up, callback plates
const LINEUP = [
  ['tank', 200, 0.38, {}, 300], ['benji', 455, 0.38, {}, 480], ['mom', 715, 0.38, { flour: 0 }, 300], ['you', 965, 0.4, {}, 480],
  ['max', 1220, 0.4, { hood: 'down' }, 300], ['biscuit', 1455, 0.42, {}, 480], ['grandpa', 1715, 0.38, { glasses: 'on' }, 300],
];   // [who, x, s, pose, plate bottom y (two rows so neighbours never overlap)]
const LY = 1010;
function plateFor(who, t, x, y, k, lift) {
  const s = 0.8, L_ = lift / s;
  switch (who) {
    case 'tank': return H.plateFor('tank', { x, y, s, t, k, lift: L_, tags: ['FULL', 'HAPPY'], bars: [{ label: 'HP', value: 100, from: 3, roll: seg(k, 0.6, 1) }] });
    case 'benji': return H.plateFor('benjiBest', { x, y, s, t, k, lift: L_ });
    case 'mom': return H.plateFor('mom', { x, y, s, t, k, lift: L_, bars: [{ label: 'ENERGY', value: 100, from: 2, roll: seg(k, 0.6, 1) }] });
    case 'you': return H.heroPlate({ x, y, s: 0.95, t, k, reveal: 1, lift: lift / 0.95 });
    case 'max': return H.plateFor('max', { x, y, s, t, k, lift: L_ });
    case 'biscuit': return H.plateFor('biscuit', { x, y, s, t, k, lift: L_ });
    case 'grandpa': return H.statPlate({ x, y, s, t, k, lift: L_, name: 'GRANDPA LOU', level: 87, crown: true, title: 'TOLD THE 1979 STORY', bars: [{ label: 'TIMES', value: Infinity }] });
  }
  return '';
}
function lineup(t, o = {}) {
  let g = '';
  const wave = o.wave || 0;
  LINEUP.forEach(([who, x, s, extra], i) => {
    const bob = Math.abs(Math.sin(t * 3 + i)) * 6;
    const wv = who !== 'biscuit' ? { armR: 30 + 120 * wave * (0.5 + 0.5 * Math.sin(t * 9 + i)), armL: 20 } : {};
    const face = who === 'tank' ? { name: 'happy' } : who === 'you' ? { name: 'happy' } : 'happy';
    g += who === 'biscuit' ? K.draw.biscuit({ x, y: LY, s, t, face: 'good', wag: 1 }) : actor(who, t, { x, y: LY, s, bodyY: -bob, face, ...wv, ...extra, t }, { arms: !wave });
  });
  return g;
}
function lineupPlates(t, k0s, o = {}) {
  let g = '';
  LINEUP.forEach(([who, x, s, extra, py], i) => {
    const k = k0s[i];
    if (k <= 0) return;
    const hd = H.overHead(who, x, LY, s, 0, extra);
    const hop = bump(t, B.head + i * 0.04, B.head + 0.35 + i * 0.04) * -14;
    g += plateFor(who, t, hd.x, hd.y + hop, k, Math.max(20, hd.y - py));
  });
  return g;
}
function shOutro(t) {
  const cam = camKeys(t, [[CUT.outro, { x: 0, y: 0, zoom: 1.08 }], [CUT.yourstat, { x: 0, y: 0, zoom: 1.0 }]], ease.inOut);
  let o = E.hudBg(t, { col: '#16224A', ray: '#253A78', cy: 900 });
  o += S.rect(-20, LY - 10, 1960, 120, 0, { fill: '#0E1838' }) + S.rect(-20, LY - 14, 1960, 8, 0, { fill: '#3BE8FF', opacity: 0.6 });
  let w_ = lineup(t);
  const ks = B.pops.map((p, i) => seg(t, p - 0.15, p + 0.35));
  w_ += lineupPlates(t, ks);
  o += view(cam, w_);
  o += H.TL('WHAT STAT WOULD YOU SEE?', 960, 96, 66, '#FFFFFF', { stroke: '#03101B', 'stroke-width': 10, 'paint-order': 'stroke', opacity: f(seg(t, CUT.outro, CUT.outro + 0.4)) });
  return o + whip(t, CUT.outro, 1, 0.12);
}

// ---- 17. "...what would it be?" — the blank plate: YOUR STAT ____
function shYourStat(t) {
  let o = E.hudBg(t, { col: '#16224A', ray: '#253A78', cy: 900 });
  const cam = { x: 0, y: 40, zoom: 1.0 };
  let w_ = lineup(t) + lineupPlates(t, LINEUP.map(() => 1));
  o += view(cam, w_) + dim(0.55, '#0B1030');
  const k = seg(t, CUT.yourstat, CUT.yourstat + 0.45);
  const blink = Math.floor(t * 3) % 2 ? '_' : ' ';
  o += E.chip(960, 470, 'YOUR STAT:', '? ? ?' + blink, k, t, { theme: 'gold', size: 96, rot: -2, col: '#FFE6A0' });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t * 0.8, r = 520 + 30 * Math.sin(t * 3 + i);
    o += H.TL('?', 960 + Math.cos(a) * r, 470 + Math.sin(a) * r * 0.5 + 20, 80, '#FFD21F', { opacity: f(0.7 * k), stroke: '#03101B', 'stroke-width': 9, 'paint-order': 'stroke' });
  }
  return o + smash(t, CUT.yourstat, 0.1, 0.5);
}

// ---- 18. "Tell me in the comments!" — the comment box: typed idea, bubbles fly up
const IDEAS = ['MOOD: 87%', 'SLEEP: 2 HRS', 'LUCK: 99', 'HUNGER LVL', 'SECRET SKILL?'];
function commentBox(t, t0, k) {
  if (k <= 0) return '';
  const y = lerp(1250, 760, ease.outBack(k));
  let g = S.rect(260, y - 90, 1400, 180, 36, ol('#FFFFFF', 8));
  g += S.circle(360, y, 52, ol('#FFC83D', 6)) + H.TL('?', 360, y + 22, 64, '#1A1020');
  const txt = "I'd want to see...";
  const n = Math.floor(clamp((t - t0 - 0.3) / 0.9, 0, 1) * txt.length);
  g += H.TF(n ? txt.slice(0, n) : 'Add a comment...', 440, y + 16, 48, n ? '#1A1020' : '#9AA0AE', { 'text-anchor': 'start' });
  if (Math.floor(t * 3) % 2) g += S.rect(440 + n * 23.5, y - 26, 5, 52, 2, { fill: '#1A1020' });
  const press = bump(t, t0 + 1.25, t0 + 1.45);
  g += S.rect(1400, y - 44, 220, 88, 44, ol(press > 0.2 ? '#2EA35A' : '#3BD16F', 6)) + H.TL('COMMENT', 1510, y + 16, 42, '#FFFFFF');
  return g;
}
function shComments(t) {
  let o = E.hudBg(t, { col: '#16224A', ray: '#253A78', cy: 900 });
  const cam = { x: 0, y: 40, zoom: 1.0 };
  o += view(cam, lineup(t, { wave: 1 }) + lineupPlates(t, LINEUP.map(() => 1))) + dim(0.35, '#0B1030');
  o += commentBox(t, CUT.comments, seg(t, CUT.comments, CUT.comments + 0.4));
  // idea bubbles float up
  IDEAS.forEach((txt, i) => {
    const a = t - CUT.comments - 0.4 - i * 0.18;
    if (a < 0) return;
    const x = 380 + i * 300 + 30 * Math.sin(a * 3 + i), y = 640 - a * 260;
    const sc0 = ease.outBack(seg(a, 0, 0.25));
    o += S.g(S.rect(-130, -40, 260, 80, 40, ol('#FFFFFF', 6)) + S.path('M-20 38 L-36 70 L10 38 Z', ol('#FFFFFF', 5)) + H.TL(txt, 0, 14, 34, '#2A1E4A'), tf(x, y, sc0 * 0.9, (hash(i) - 0.5) * 10), { opacity: f(1 - seg(a, 1.2, 1.6)) });
  });
  return o;
}

// ---- 19. the END SCREEN — two video slots, SUBSCRIBE (+100 XP → LEVEL UP), the hero + Max + Biscuit waving
function slot(x, y, w, h, label, t, k) {
  if (k <= 0) return '';
  const th = H.theme('cyan');
  let g = H.panel(x, y, w, h, th, { c: 22, br: 30, scan: false });
  g += S.rect(x + 12, y + 12, w - 24, h - 24, 10, { fill: '#050A18', opacity: 0.65 });
  g += S.path(H.para(x + 20, y - 34, TFw(label) + 60, 48, 12), ol('#FFD21F', 4)) + H.TL(label, x + 50, y + 2, 32, '#1A1020', { 'text-anchor': 'start' });
  return S.g(g, `translate(${f(x + w / 2)} ${f(y + h / 2)}) scale(${f(ease.outBack(k))}) translate(${f(-x - w / 2)} ${f(-y - h / 2)})`);
}
const TFw = (s) => s.length * 17;
function shEnd(t) {
  let o = E.hudBg(t, { col: '#101A3C', ray: '#1C3066', cy: 540 });
  const k1 = seg(t, CUT.end, CUT.end + 0.4), k2 = seg(t, CUT.end + 0.15, CUT.end + 0.55), k3 = seg(t, CUT.end + 0.3, CUT.end + 0.7);
  o += slot(90, 190, 720, 405, 'NEXT QUEST', t, k1);
  o += slot(90, 650, 720, 405, 'BONUS LEVEL', t, k2);
  // subscribe circle + button
  const cx = 1460, cy = 250;
  const ring = ease.outBack(k3);
  if (ring > 0) {
    o += S.circle(cx, cy, 150 * ring, { fill: '#050A18', 'fill-opacity': 0.6, stroke: '#3BE8FF', 'stroke-width': 8 }) + S.circle(cx, cy, 170 * ring, { fill: 'none', stroke: '#FFD21F', 'stroke-width': 4, 'stroke-dasharray': '18 14', transform: `rotate(${f(t * 30)} ${cx} ${cy})` });
  }
  const clicked = t > B.click;
  const press = bump(t, B.click - 0.05, B.click + 0.15);
  const bk = ease.outBack(seg(t, CUT.end + 0.5, CUT.end + 0.9));
  if (bk > 0) {
    const bw = clicked ? 500 : 440;
    let b = S.rect(-bw / 2, -54, bw, 108, 54, ol(clicked ? '#5A6478' : '#E8303A', 7));
    b += H.TL(clicked ? 'SUBSCRIBED' : 'SUBSCRIBE', clicked ? -30 : 0, 18, 52, '#FFFFFF');
    if (clicked) b += S.path('M150 -4 L166 14 L194 -20', ln(10, '#FFFFFF'));
    b += S.g(S.rect(-70, -22, 140, 44, 22, ol('#FFD21F', 4)) + H.TL('+100 XP', 0, 12, 30, '#1A1020'), tf(bw / 2 - 30, -62, 1, 8));
    o += S.g(b, tf(cx, cy + 250, bk * (1 - 0.08 * press)));
    // bell rings after the click
    if (clicked) {
      const r = Math.sin((t - B.click) * 18) * 18 * Math.exp(-(t - B.click) * 2);
      o += S.g(S.path('M-34 20 Q-34 -34 0 -38 Q34 -34 34 20 L44 30 L-44 30 Z', ol('#FFD21F', 6)) + S.circle(0, 40, 10, ol('#FFD21F', 5)), `${tf(cx + 330, cy + 236, 1, r)}`);
    }
    // the cursor
    const cu = ease.inOut(seg(t, B.click - 0.9, B.click - 0.1));
    const px = lerp(1900, cx + 40, cu), py = lerp(1150, cy + 262, cu);
    if (t < B.click + 1.2) o += S.g(S.path('M0 0 L0 58 L14 44 L26 70 L36 65 L24 40 L44 40 Z', ol('#FFFFFF', 5)), tf(px, py, 1.3 * (1 - 0.1 * press)));
    o += H.sparkleBurst(cx, cy + 250, seg(t, B.click, B.click + 0.6), 260, 10, '#FFE9A0', 3);
  }
  // the family waving at the bottom right
  const wy = 1040;
  let fam = actor('max', t, { x: 1250, y: wy, s: 0.38, hood: 'down', armR: 140 + 25 * Math.sin(t * 10), armL: 20, face: 'excited', t }, { arms: false });
  fam += actor('you', t, { x: 1470, y: wy, s: 0.36, armR: 140 + 25 * Math.sin(t * 9 + 1), armL: 20, face: { name: 'happy' } }, { arms: false });
  fam += K.draw.biscuit({ x: 1690, y: wy, s: 0.4, t, face: 'good', wag: 1 });
  o += fam;
  // the hero's XP bar fills → LEVEL UP
  const xu = seg(t, CUT.end + 0.3, B.click + 0.2);
  o += H.xpBar({ t, k: seg(t, CUT.end, CUT.end + 0.4), value: ease.inOut(xu), level: t > B.click + 0.1 ? 2 : 1, text: `${Math.round(100 * ease.inOut(xu))} / 100`, levelBump: seg(t, B.click + 0.1, B.click + 0.5), w: 1640, y: 1056 });
  o += H.levelUp({ t, k: seg(t, B.click + 0.15, B.click + 1.45), level: 2, from: 1, x: 1460, y: 250, s: 0.75, out: seg(t, B.click + 2.4, B.click + 2.8) });
  o += H.TL('THANKS FOR PLAYING!', 1460, 640, 50, '#FFFFFF', { stroke: '#03101B', 'stroke-width': 9, 'paint-order': 'stroke', opacity: f(seg(t, CUT.end + 0.4, CUT.end + 0.8)) });
  o += dim(seg(t, B.fadeOut, END) * 1.0, '#000000');
  return o;
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.poke, shPoke], [CUT.room, shRoom], [CUT.biscuit, shBiscuit], [CUT.good, shGood], [CUT.gasp, shGasp], [CUT.grandpa, shGrandpa], [CUT.never, shNever],
  [CUT.nap, shNap], [CUT.defend, shDefend], [CUT.knew, shKnew], [CUT.point, shPoint], [CUT.loaded, shLoaded], [CUT.reveal, shReveal], [CUT.bigbro, shBigbro],
  [CUT.goodstat, shGoodstat], [CUT.outro, shOutro], [CUT.yourstat, shYourStat], [CUT.comments, shComments], [CUT.end, shEnd],
].sort((a, b) => a[0] - b[0]);
function shotIndex(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return i;
}
function scene(t) {
  return SHOTS[shotIndex(t)][1](t);
}
function look(t) {
  if (t >= CUT.outro) return { grade: null, vignette: 0.5 };
  if (t >= CUT.loaded) return { grade: 'warm', vignette: 0.75 };
  return { grade: 'warm', vignette: 0.4 };
}
module.exports = { scene, look, SHOTS, CUT, BEATS: B };
