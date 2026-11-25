// SC 07 · OBSESSION — what went wrong (mirrored by SC 11 · after).
// Room 12, cold HUD: Mrs. Krump taps the board ("Science fair. Partners.") -> smash-zoom on her glare ("Choose wisely."); Benji
// waves from the shared desk, jumps up with an idea bulb and his POTATO BATTERY (tooltip: SUCCESS 3%); "Actually, Benji..." the
// hero's eyes slide away -> whip-pan to the MATHLETES (ADA + ISAAC, INT 95, glasses glint) -> the INT 95 vs LV 4 card, PICKED;
// "Since when do you care about levels?" -> FRIENDSHIP −50: the red heart cracks and splits over Benji (silence) -> hold on
// Benji's face, his potato bulb goes out. The smart table: number bubbles fly back and forth over the hero's head, his
// forced laugh, the two stare, FUN: 0%; "...This is boring." — through the window Benji sits alone on the yard bench with
// his potato. Home, evening: Mom alone at the sink with a tower of dishes, a grey "!" — "Help Mom · +5 XP" (a tiny chip);
// "Sorry, Mom. Gotta go." — a big gold +50 XP waypoint glows in the doorway, Mom's marker greys out; "It's okay, sweetheart.
// I'm fine." (clean face) -> she is alone, ENERGY rolls 2% -> 1%, blinking. The living room: the hero rushing out skids to a
// stop on Grandpa's "Kid." -> "Stats don't lie." (pointing at Grandpa's plate) -> "Maybe not. But they don't tell the whole
// truth, either." (the plate flickers) -> the hero looks up at his own "???", the HUD clock rolls TUE -> SAT -> white (SC 08).
// Every cut and beat comes from the voice through times(V) (shared with audio/cues/gen_sc07.js).
'use strict';

const K = require('./kit');
const H = require('./hud');
const ST = require('./sets_town');
const SH = require('./sets_home');
const X = require('../rig/extras');
const AC = require('./acting');
const E = require('./s07_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const V = K.V;
const { camAt, camLerp, shook, scr, unscr, whip, flashAt, wash, bubble } = E;

// ================================================================ times (from the voice only)
function times(V) {
  const l = (i) => V.L('07.' + i);
  const START = V.scene('SC 07').start, END = V.scene('SC 08').start;
  const C = {}, B = {};
  C.board = START;
  B.tap1 = l(0).word('Science').t0; B.tap2 = l(0).word('Partners').t0;
  C.krump = l(0).word('Choose').t0 - 0.22;
  B.glare = l(0).word('wisely').t0 + 0.08;
  C.benji = l(1).a - 0.14;
  B.wave = l(1).a;
  C.idea = l(1).word('I').t0 - 0.16;
  B.stand = l(1).word('I').t0 - 0.06;
  B.idea = l(1).word('idea').t0;
  B.potato = l(1).word('potato').t0 - 0.05;
  B.battery = l(1).word('battery').t0;
  C.actually = l(2).a - 0.1;
  C.smart = l(2).word('working').t0 - 0.14;
  B.them = l(2).word('them').t0;
  C.vs = l(2).word('They').t0 - 0.32;
  B.ninety = l(2).word('ninety-five').t0;
  B.intel = l(2).word('intelligence').t0;
  C.since = l(3).a - 0.2;
  C.heart = l(3).b + 0.08;
  B.heart = l(3).b + 0.18;
  B.crack = B.heart + 0.45;
  B.split = B.heart + 0.74;
  C.hurt = l(4).a - 0.12;
  B.bulbOut = l(4).word('hurt').t0;
  C.partners = l(5).a - 0.1;
  B.smart = l(5).word('smart').t0;
  C.numbers = l(5).word('They').t0 - 0.18;
  C.laugh = l(5).word('They', 1).t0 - 0.18;
  B.laughStop = l(5).word('laughed').t0;
  B.once = l(5).word('once').t0;
  C.boring = l(6).a - 0.22;
  B.glance = l(6).b + 0.12;
  C.home = l(7).a - 0.16;
  B.quest = l(7).word('quest').t0;
  C.help = l(7).word('Help').t0 - 0.24;
  B.help = l(7).word('Help').t0;
  B.five = l(7).word('Five').t0;
  C.sorry = l(8).a - 0.16;
  B.go = l(8).word('go').t0;
  C.fifty = l(8).word("There's").t0 - 0.16;
  B.fifty = l(8).word('fifty-XP').t0;
  C.fine = l(9).a - 0.2;
  B.turn = l(9).a - 0.1;
  C.alone = l(9).b + 0.1;
  B.exit = C.alone + 0.15;
  C.energy = l(10).word('Her').t0 - 0.3;
  B.energy = l(10).word('energy').t0;
  B.one = l(10).word('one').t0;
  C.kid = l(10).b + 0.03;
  B.kid = l(11).word('Kid').t0 + 0.28;
  C.looking = l(11).word('What').t0 - 0.2;
  C.stats = l(12).a - 0.12;
  B.point = l(12).word('Stats', 1).t0;
  C.truth = l(13).a - 0.14;
  B.maybe = l(13).a;
  B.whole = l(13).word('whole').t0;
  C.out = l(13).b + 0.2;
  B.days = C.out + 0.75;
  B.flash = END - 0.22;
  return { START, END, C, B };
}
const TM = times(V);
const { START, END, C, B } = TM;

// close-ups render rig characters without the body-volume filter (perf); the router sets VOL_OFF per shot
let VOL_OFF = false;
const actor = (name, t, pose = {}, act) => K.actor(name, t, VOL_OFF && pose.volume === undefined ? { ...pose, volume: false } : pose, act);
const view = K.view;

// ================================================================ the cold HUD
// how cold the HUD is (0 cyan .. 1 steel): already half cold in class, fully cold from the smart table on
const coldK = (t) => clamp(0.45 + 0.55 * seg(t, START, C.partners), 0, 1);
const TH = (t) => H.mixTheme('cyan', 'cold', coldK(t));
// the world loses colour: a flat steel-blue wash, stronger as he gets colder
const coldWash = (t, extra = 0) => wash('#5D6E82', 0.08 + 0.1 * coldK(t) + extra);
const XPBAR = { level: 21, value: 0.3, text: '150 / 500' };            // = the end of SC 06
function frame(t, o = {}) {
  return H.hudFrame({ t, theme: TH(t), clock: o.clock || '10:15 AM', day: o.day || 'TUE', k: o.k ?? 1, quest: o.quest, questSub: o.questSub, dots: o.dots });
}
const xpBar = (t, o = {}) => H.xpBar({ ...XPBAR, t, s: 0.9, w: 1600, y: 1052, ...o });
// plate scale from the camera zoom
const pS = (z, base = 0.62) => clamp(base + 0.2 * z, 0.7, 1.35);
// head-top screen point for a cast member drawn with feet (x, y) and scale s under cam
function head(cam, who, x, y, s, pose = {}) {
  const p = H.overHead(who, x, y, s, 0, pose);
  const [sx, sy, z] = scr(cam, p.x, p.y);
  return { x: sx, y: sy, z };
}

// ================================================================ ROOM 12
const CL = ST.SPOTS.classroom;
const BOARD = ['SCIENCE FAIR', 'PARTNERS:', 'CHOOSE WISELY.'];
const KR = { x: 170, y: 1002, s: 0.52 };                                     // Mrs. Krump in front of her desk, left of the board text
const HERO = { ...CL.heroDesk };                                             // (988, 1082) s .5
const BENJI = { ...CL.benjiDesk };                                           // (1212, 1082)
const BENJI_UP = { x: BENJI.x, y: 975, s: BENJI.s };                        // Benji standing up behind the desk
const SMART_L = { x: 2530, y: 1000, s: 0.5, i: 2, name: 'ADA', lv: 31 };     // the INT 95 kids stand behind the MATHLETES table
const SMART_R = { x: 2958, y: 1000, s: 0.5, i: 3, name: 'ISAAC', lv: 33 };
const HERO_SMART = { x: 2706, y: 1013, s: 0.46 };                            // the hero squeezed in between them
const KIDS = (() => {                                                        // the rest of the class (lite kids), fixed looks
  const out = [];
  CL.rows.forEach((row, ri) => row.forEach((p, i) => {
    if (ri === 2 && i < 2) return;                                           // hero + Benji
    const id = ri === 1 && i === 3 ? 0 : 4 + ri * 6 + i;                    // kid 0 = the "my dog ate it" kid
    out.push({ ...p, ri, i: id, ph: hash(id * 3.7) * 6 });
  }));
  return out;
})();
function kidRow(t, ri, o = {}) {
  return KIDS.filter((k) => k.ri === ri).map((k) => K.draw.kid(k.i, { x: k.x, y: k.y, s: k.s, turn: o.turn ?? -0.25 + 0.1 * Math.sin(k.ph), headRot: 2 * Math.sin(t * 1.3 + k.ph), face: o.face || (k.i % 3 ? 'neutral' : 'deadpan') })).join('');
}
// Benji alone on the yard bench, seen through window 3 (drawn in bg space so it sits behind the glass at any camera)
// (wx, wy) = where his head top should appear, in room (mid-layer) coordinates; only head + shoulders show above the sill
function benjiOutside(t, cam, o = {}) {
  const [sx, sy] = scr(cam, o.wx ?? 2300, o.wy ?? 330, 1);
  const [hx, hy, zb] = unscr(cam, sx, sy, 0.6);
  const s = 0.27 * (cam.zoom ?? 1) / zb;                                    // on screen like a kid at s .27 in the room
  const by = hy + 1081 * 0.98 * s;                                          // feet (hidden under the sill)
  const plank = (y, c) => S.rect(hx - 300 * s, y, 600 * s, 34 * s, 10 * s, ol(c, 3));
  let g = plank(hy + 470 * s, '#B77B46') + plank(hy + 520 * s, '#C98A52') + S.path(`M${f(hx - 250 * s)} ${f(hy + 470 * s)} V${f(by)} M${f(hx + 250 * s)} ${f(hy + 470 * s)} V${f(by)}`, ln(14 * s, '#5A5470'));
  g += K.actor('benji', t, { x: hx, y: by, s, potato: true, glow: o.glow ?? 0.25, t, face: { name: 'sad', eyes: { look: [0, 0.7] } }, headRot: 6, bodyY: 14, volume: false, shadow: false }, { arms: false });
  return g;
}
function classWorld(t, cam, o = {}) {
  const row2 = kidRow(t, 1, o.kids) + (o.krumpBack || '');
  let row1 = kidRow(t, 2, o.kids);
  if (o.you !== false) row1 += actor('you', t, { ...HERO, ...(o.you || {}) }, o.youAct);
  if (o.benji !== false) row1 += actor('benji', t, { ...BENJI, t, ...(o.benji || {}) }, o.benjiAct);
  if (o.smart) {
    row1 += actor('kid', t, { x: SMART_L.x, y: SMART_L.y, s: SMART_L.s, i: SMART_L.i, turn: 0.35, ...(o.smart.L || {}) }, { arms: false });
    row1 += actor('kid', t, { x: SMART_R.x, y: SMART_R.y, s: SMART_R.s, i: SMART_R.i, turn: -0.35, ...(o.smart.R || {}) }, { arms: false });
    if (o.smart.you) row1 += actor('you', t, { ...HERO_SMART, ...o.smart.you }, o.smart.youAct);
  }
  const krump = o.krump ? actor('teacher', t, { ...KR, t, ...o.krump }, { arms: false }) : '';
  return ST.classroom.compose(t, { board: BOARD, clock: '10:15', blinds: 0.3, outside: o.outside ? benjiOutside(t, cam, o.outside) : '' }, [kidRow(t, 0, o.kids), row2, row1 + (o.extra || '')], krump + (o.front || ''), cam);
}
// smart kids' plates
function smartPlates(t, cam, k, o = {}) {
  let g = '';
  for (const [i, sk] of [SMART_L, SMART_R].entries()) {
    const hp = head(cam, 'kid', sk.x, sk.y, sk.s, { i: sk.i });
    g += H.statPlate({ x: hp.x, y: hp.y, s: pS(hp.z, 0.5), t, k: seg(k, i * 0.12, 0.7 + i * 0.12), name: sk.name, level: sk.lv, theme: TH(t), bars: [{ label: 'INT', value: 95 }], fade: o.fade || 0 });
  }
  return g;
}

// ---------------------------------------------------------------- 1 — "Science fair. Partners." the board, pointer taps
function krumpTapPose(t) {
  const tap = Math.max(bump(t, B.tap1 - 0.12, B.tap1 + 0.2), bump(t, B.tap2 - 0.12, B.tap2 + 0.2));
  return { pointer: true, freeArms: true, turn: 0.45, armR: 112 + 10 * tap, bendR: 18, pointerRot: 52 - 10 * tap, armL: 12, lean: -2 * tap };
}
function shotBoard(t) {
  const u = seg(t, C.board, C.krump);
  const cam = shook(camLerp(camAt(560, 520, 1.12), camAt(470, 470, 1.36), u), t, [[B.tap1, 0.18, 4], [B.tap2, 0.18, 4]]);
  const bj = Math.abs(Math.sin(t * 7));
  let o = classWorld(t, cam, {
    krump: krumpTapPose(t),
    you: { turn: -0.25, face: { name: 'deadpan', eyes: { look: [-0.7, -0.3] } } },
    benji: { turn: -0.55, lift: 10 * bj, face: { name: 'excited', eyes: { look: [-1, 0] } } },
  });
  // chalk dust where the pointer hits the board
  for (const [tb, wx, wy] of [[B.tap1, 330, 245], [B.tap2, 360, 300]]) { const [x, y, z] = scr(cam, wx, wy); o += E.chalkDust(x, y, t - tb, z * 0.9); }
  o += coldWash(t);
  const hk = head(cam, 'teacher', KR.x, KR.y, KR.s);
  o += H.plateFor('teacher', { x: hk.x, y: hk.y, s: pS(hk.z, 0.5), t, k: seg(t, START + 0.15, START + 0.7) });
  const hb = head(cam, 'benji', BENJI.x, BENJI.y, BENJI.s);
  o += H.plateFor('benji', { x: hb.x, y: hb.y, s: pS(hb.z, 0.45), t, theme: TH(t), k: seg(t, START + 0.5, START + 1.0) });
  o += frame(t) + xpBar(t);
  return o + flashAt(t, START, 0.18, 0.7);
}
// 2 — "Choose wisely." smash-zoom on Mrs. Krump, the glare
function shotKrump(t) {
  const u = seg(t, C.krump, C.benji);
  const cam = shook(camLerp(camAt(KR.x + 15, 585, 2.45), camAt(KR.x + 15, 575, 2.8), u, ease.out), t, [[B.glare, 0.25, 8]]);
  const glare = seg(t, B.glare - 0.12, B.glare + 0.15) * (1 - seg(t, C.benji - 0.25, C.benji));
  let o = classWorld(t, cam, { krump: { ...krumpTapPose(t), glare, face: glare > 0 ? undefined : { name: 'angry', mouth: 'line' } } });
  if (glare > 0.6) o += K.sparkles([[scr(cam, KR.x + 46, 1002 - 1340 * 0.52 + 170)[0], scr(cam, KR.x + 46, 1002 - 1340 * 0.52 + 170)[1], 30]], t);
  o += coldWash(t);
  const hk = head(cam, 'teacher', KR.x, KR.y, KR.s);
  o += H.plateFor('teacher', { x: 1480, y: 400, s: 1.25, t, k: 1, lift: 20 });
  o += frame(t);
  return o + whip(t, C.krump, 'up', 0.1);
}
// 3 — "Partners again?" Benji turns to the hero and waves; the hero is looking past him
function shotBenji(t) {
  const u = seg(t, C.benji, C.idea);
  const cam = camLerp(camAt(1100, 760, 1.6), camAt(1120, 745, 1.78), u);
  const wave = Math.sin((t - B.wave) * 13);
  let o = classWorld(t, cam, {
    you: { turn: 0.15, face: { name: 'deadpan', eyes: { look: [1, -0.1] } } },
    benji: { turn: -0.6, armR: 150 + 22 * wave, bendR: 20, armL: 14, lift: 14 * Math.abs(wave) * seg(t, B.wave, B.wave + 0.2) },
    benjiAct: { arms: false, energy: 1.4 },
  });
  o += coldWash(t);
  const hb = head(cam, 'benji', BENJI.x, BENJI.y, BENJI.s);
  o += H.plateFor('benji', { x: hb.x, y: hb.y, s: pS(hb.z, 0.45), t, theme: TH(t), k: 1 });
  const hh = head(cam, 'you', HERO.x, HERO.y, HERO.s);
  o += H.heroPlate({ x: hh.x, y: hh.y, s: 0.75, t, k: seg(t, C.benji + 0.2, C.benji + 0.7) });
  o += frame(t);
  return o + whip(t, C.benji, 1, 0.1);
}
// 4 — "I have an idea! A potato battery!" — he jumps up, an idea bulb, the potato battery + its tooltip
function ideaBulb(x, y, k, t) {
  if (k <= 0) return '';
  const sc = ease.outBack(clamp(k, 0, 1));
  let g = '';
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g += S.path(`M${f(Math.cos(a) * 70)} ${f(Math.sin(a) * 70 - 10)} L${f(Math.cos(a) * 96)} ${f(Math.sin(a) * 96 - 10)}`, ln(9, '#FFD23F')); }
  g += S.circle(0, -10, 50, ol('#FFF27A', 7)) + S.rect(-26, 34, 52, 34, 8, ol('#B9C0CC', 6)) + S.path('M-16 -14 Q0 -40 16 -14 M0 -20 V30', ln(6, '#E8B400'));
  g += S.path('M-26 -36 Q-34 -20 -28 -6', ln(7, '#FFFFFF', 0.85));
  return S.g(g, `translate(${f(x)} ${f(y + 6 * Math.sin(t * 6))}) rotate(${f(8 * Math.sin(t * 5))}) scale(${f(sc)})`);
}
function shotIdea(t) {
  const u = seg(t, C.idea, C.actually);
  const cam = camLerp(camAt(1212, 640, 2.15), camAt(1212, 625, 2.45), u);
  const up = ease.outBack(seg(t, B.stand, B.stand + 0.28));
  const pop = bump(t, B.potato, B.potato + 0.22);
  const hasPotato = t >= B.potato;
  const finger = !hasPotato ? seg(t, B.idea - 0.2, B.idea + 0.05) : 0;
  const by = lerp(BENJI.y, BENJI_UP.y, up);
  const pose = hasPotato
    ? { potato: true, glow: 0.35, turn: -0.2, sy: 1 + 0.08 * pop, sx: 1 - 0.05 * pop }
    : { turn: -0.3, armR: lerp(20, 168, ease.outBack(finger)), bendR: 0, armL: 16, sy: 1 - 0.06 * bump(t, B.stand, B.stand + 0.2) };
  let o = classWorld(t, cam, { you: { turn: 0.2, face: { name: 'deadpan', eyes: { look: [1, -0.2] } } }, benji: { x: BENJI.x, y: by, ...pose }, benjiAct: { arms: false, energy: 1.5 } });
  // sparkle pop of the potato battery
  const [px, py, z] = scr(cam, BENJI.x, by - 350 * 0.5 * 0.98 + 20);
  if (t >= B.potato && t < B.potato + 0.5) o += K.sparkles([[px - 140, py - 60, 30], [px + 150, py - 20, 26], [px, py - 150, 24]], t);
  o += coldWash(t);
  const hb = head(cam, 'benji', BENJI.x, by, BENJI.s);
  o += ideaBulb(hb.x + 250, hb.y + 130, seg(t, B.idea - 0.15, B.idea + 0.15) * (1 - seg(t, B.battery + 0.2, B.battery + 0.5)), t);
  o += H.tooltip({ x: px + 30, y: py - 150, t, k: seg(t, B.battery - 0.1, B.battery + 0.35), title: 'POTATO BATTERY', rarity: 'common', theme: TH(t), side: 'up', dist: 90, dx: 360, s: 1.0, lines: ['POWER: 0.5 V', 'SUCCESS: 3%'] });
  o += frame(t);
  return o;
}
// 5 — "Actually, Benji..." the hero, awkward, scratching his head, eyes sliding away
function shotActually(t) {
  const u = seg(t, C.actually, C.smart);
  const cam = camLerp(camAt(1020, 690, 2.2), camAt(1035, 680, 2.4), u);
  const scratch = Math.sin(t * 16) * seg(t, C.actually + 0.1, C.actually + 0.3);
  const away = seg(t, C.actually + 0.6, C.actually + 1.0);
  let o = classWorld(t, cam, {
    you: { turn: lerp(0.35, 0.1, away), armR: 22, bendR: -128 + 10 * scratch, armL: 10, face: { name: 'nervous', eyes: { look: [lerp(0.6, 1, away), lerp(0, -0.4, away)] }, fx: ['sweat'] } },
    youAct: { arms: false },
    benji: { x: BENJI.x, y: BENJI_UP.y, potato: true, glow: 0.35, turn: -0.5, face: { name: 'happy', eyes: { look: [-1, 0.2] } } },
  });
  o += coldWash(t);
  const hh = head(cam, 'you', HERO.x, HERO.y, HERO.s);
  o += H.heroPlate({ x: hh.x, y: hh.y, s: 1.0, t, k: 1 });
  o += frame(t);
  return o;
}
// 6 — "...I'm working with them." whip-pan to the MATHLETES; glasses glint; INT 95 plates
function shotSmart(t) {
  const u = seg(t, C.smart, C.vs);
  const cam = camLerp(camAt(2700, 690, 1.45), camAt(2780, 685, 1.62), u, ease.out);
  const glint = seg(t, B.them - 0.05, B.them + 0.25);
  const push = bump(t, B.them - 0.1, B.them + 0.3);
  let o = classWorld(t, cam, {
    you: false, benji: false,
    smart: { L: { face: { name: 'smug', eyes: { look: [0.2, 0] } }, armR: 150 * push, bendR: 140 * push }, R: { face: { name: 'smug', eyes: { look: [-0.2, 0] } }, armL: 150 * push, bendL: 140 * push } },
  });
  if (glint > 0 && glint < 1) {
    for (const sk of [SMART_L, SMART_R]) { const hp = head(cam, 'kid', sk.x, sk.y, sk.s, { i: sk.i }); o += K.sparkles([[hp.x + 26, hp.y + 110, 34 * (1 - glint) + 8]], t); }
  }
  o += coldWash(t);
  o += smartPlates(t, cam, seg(t, B.them - 0.25, B.them + 0.5));
  o += frame(t);
  return o + whip(t, C.smart, 1, 0.12);
}
// 7 — "They have ninety-five intelligence." the INT 95 vs LV 4 card -> PICKED
function shotVS(t) {
  const u = seg(t, C.vs, C.since);
  const cam = camLerp(camAt(1100, 740, 1.7), camAt(1100, 730, 1.82), u);
  let o = classWorld(t, cam, {
    you: { turn: 0.1, face: { name: 'deadpan', eyes: { look: [0.6, -0.6] } } },
    benji: { x: BENJI.x, y: BENJI_UP.y, potato: true, glow: 0.35, turn: -0.5, face: { name: 'happy', eyes: { look: [-1, 0.2] } } },
  });
  o += coldWash(t) + wash('#04080E', 0.58 * seg(t, C.vs, C.vs + 0.3));
  const choose = -ease.inOut(seg(t, B.ninety, B.ninety + 0.45));
  const hit = bump(t, B.intel, B.intel + 0.25);
  o += H.statCompare({ k: seg(t, C.vs + 0.05, C.vs + 0.75), t, choose, x: 960, y: 520, s: 1.05 + 0.03 * hit, title: 'PICK A PARTNER', right: { name: 'BENJI', stat: 'LV', value: 4, sub: 'CLUMSY' } });
  o += frame(t);
  return o + whip(t, C.vs, -1, 0.1);
}
// 8 — "Since when do you care about levels?" Benji, hurt, lowers the potato battery
function shotSince(t) {
  const u = seg(t, C.since, C.heart);
  const cam = camLerp(camAt(1190, 600, 2.1), camAt(1200, 595, 2.35), u);
  const low = ease.inOut(seg(t, C.since + 0.3, C.heart));
  let o = classWorld(t, cam, {
    you: { turn: 0.1, face: { name: 'deadpan', eyes: { look: [0.8, -0.5] } } },
    benji: { x: BENJI.x, y: BENJI_UP.y + 40 * low, potato: true, glow: 0.3, turn: -0.35, headRot: 4 * low, face: { name: 'sad', eyes: { look: [-0.8, 0.1 + 0.4 * low] } } },
  });
  o += coldWash(t);
  const hb = head(cam, 'benji', BENJI.x, BENJI_UP.y + 40 * low, BENJI.s);
  o += H.plateFor('benji', { x: hb.x, y: hb.y, s: 1.15, t, theme: TH(t), k: 1, fade: 0 });
  o += frame(t);
  return o;
}
// 9 — FRIENDSHIP −50: the heart pops, cracks, splits (silence); the hero flinches
function shotHeart(t) {
  const u = seg(t, C.heart, C.hurt);
  const cam = shook(camLerp(camAt(1100, 650, 1.62), camAt(1105, 640, 1.8), u), t, [[B.crack, 0.25, 6], [B.split, 0.3, 8]]);
  const flinch = seg(t, B.crack - 0.05, B.crack + 0.1);
  let o = classWorld(t, cam, {
    you: { turn: 0.45, sy: 1 - 0.04 * bump(t, B.crack, B.crack + 0.25), face: { name: flinch > 0 ? 'shocked' : 'deadpan', eyes: { look: [1, -0.3] }, fx: flinch > 0 ? ['sweat'] : [] } },
    benji: { x: BENJI.x, y: BENJI_UP.y + 40, potato: true, glow: 0.3, turn: -0.35, headRot: 4, face: { name: 'sad', eyes: { look: [-0.8, 0.5] } } },
  });
  o += coldWash(t);
  const hb = head(cam, 'benji', BENJI.x, BENJI_UP.y + 40, BENJI.s);
  o += H.plateFor('benji', { x: hb.x, y: hb.y, s: pS(hb.z, 0.45), t, theme: TH(t), k: 1, fade: seg(t, B.heart - 0.05, B.heart + 0.3) });
  const [hx, hy] = scr(cam, 1100, 470);
  o += H.friendshipPop({ x: hx, y: hy, age: t - B.heart, value: -50, s: 1.45, hold: true });
  o += frame(t);
  return o;
}
// 10 — "That number hurt more than any other." hold on Benji's face; the potato bulb goes out
function shotHurt(t) {
  const u = seg(t, C.hurt, C.partners);
  const cam = camLerp(camAt(1250, 640, 2.5), camAt(1240, 628, 3.0), u, ease.inOut);
  const fl = t < B.bulbOut ? 0.35 : t < B.bulbOut + 0.35 ? (Math.floor(t * 22) % 2 ? 0.35 : 0.05) : 0;
  // he holds the little battery up under his chin and looks down at it (our own, bigger prop in front of him)
  const bat = X.potatoBattery({ x: BENJI.x + 6, y: 815, s: 0.24, glow: fl, t, sign: false });
  let o = classWorld(t, cam, {
    you: { turn: 0.3, headRot: -6, face: { name: 'sad', eyes: { look: [0.4, 0.8] } } },
    benji: { x: BENJI.x, y: BENJI_UP.y + 40, turn: -0.2, headRot: 5, armL: 22, bendL: -120, armR: 22, bendR: -120, face: { name: 'sad', eyes: { look: [0, 0.9] }, fx: t > B.bulbOut + 0.4 ? ['tears'] : [] } },
    benjiAct: { arms: false },
    extra: bat,
  });
  if (t > B.bulbOut && t < B.bulbOut + 0.5) { const [bx, by, z] = scr(cam, BENJI.x + 6, 815 - 330 * 0.24); o += E.sparks(bx, by, t - B.bulbOut, z * 0.4, '#FFE45A', 5); }
  o += coldWash(t);
  const hb = head(cam, 'benji', BENJI.x, BENJI_UP.y + 40, BENJI.s);
  const fade = 1 - seg(t, V.L('07.4').b - 0.7, V.L('07.4').b - 0.1);
  if (fade > 0) o += S.g(H.friendshipPop({ x: hb.x - 330, y: hb.y + 70, age: 3, value: -50, s: 0.95, hold: true }), null, { opacity: f(fade) });
  return o;
}

// ---------------------------------------------------------------- the smart table
function smartFace(t, side, o = {}) {
  const talk = o.talk ? (Math.floor(t * 9 + side) % 2 ? 'o' : 'line') : 'line';
  return { name: 'deadpan', mouth: talk, eyes: { look: [side * (o.look ?? 0.6), 0] } };
}
// 11 — "Your new partners were very smart." the hero squeezed in between ADA and ISAAC
function shotPartners(t) {
  const u = seg(t, C.partners, C.numbers);
  const cam = camLerp(camAt(2770, 700, 1.42), camAt(2770, 690, 1.6), u);
  const glint = seg(t, B.smart - 0.05, B.smart + 0.3);
  const push = bump(t, B.smart - 0.15, B.smart + 0.3);
  let o = classWorld(t, cam, {
    you: false, benji: false,
    smart: {
      L: { face: smartFace(t, 1, { talk: t < B.smart - 0.2 }), armR: 150 * push, bendR: 140 * push },
      R: { face: smartFace(t, -1, { talk: t > B.smart + 0.4 }), armL: 150 * push, bendL: 140 * push },
      you: { turn: 0, face: { name: 'happy', mouth: 'smallSmile', eyes: { look: [0.6, -0.2] } } }, youAct: { arms: true },
    },
  });
  if (glint > 0 && glint < 1) for (const sk of [SMART_L, SMART_R]) { const hp = head(cam, 'kid', sk.x, sk.y, sk.s, { i: sk.i }); o += K.sparkles([[hp.x + 26, hp.y + 110, 34 * (1 - glint) + 8]], t); }
  o += coldWash(t);
  o += smartPlates(t, cam, 1);
  const hh = head(cam, 'you', HERO_SMART.x, HERO_SMART.y, HERO_SMART.s);
  o += H.heroPlate({ x: hh.x, y: hh.y, s: 0.8, t, k: 1 });
  o += frame(t) + xpBar(t);
  return o + whip(t, C.partners, 1, 0.1);
}
// 12 — "They talked only about numbers." bubbles of numbers fly back and forth; his head follows like a tennis match
const NUMS = ['3.14159265...', 'INT 95!', 'x = -b / 2a', '1, 1, 2, 3, 5, 8, 13', '6.022 E23', '99.97%', 'SQRT(2) = 1.414', '42'];
function numberBubbles(t, cam, t0, t1, n = 6) {
  let o = '';
  let side = 1;
  const items = [];
  for (let i = 0; i < n; i++) {
    const tb = lerp(t0 + 0.05, t1 - 0.5, i / (n - 1));
    side = i % 2 ? -1 : 1;
    items.push({ tb, side, text: NUMS[i % NUMS.length] });
  }
  for (const [i, it] of items.entries()) {
    const age = t - it.tb;
    if (age < 0 || age > 1.25) continue;
    const sk = it.side > 0 ? SMART_L : SMART_R;
    const hp = head(cam, 'kid', sk.x, sk.y, sk.s, { i: sk.i });
    const bx = hp.x + it.side * (120 + 40 * (i % 3)), by = hp.y - 70 - 50 * (i % 2) - 40 * age;
    o += bubble(bx, by, it.text, seg(age, 0, 0.18), { out: seg(age, 0.9, 1.25), tx: hp.x + it.side * 40, ty: hp.y + 40, size: 34, fill: '#DCE6EF', ink: '#24384C', rot: it.side * -3 });
  }
  return { o, items };
}
function shotNumbers(t) {
  const u = seg(t, C.numbers, C.laugh);
  const cam = camLerp(camAt(2775, 650, 1.75), camAt(2775, 640, 1.92), u);
  const nb = numberBubbles(t, cam, C.numbers, C.laugh, 6);
  const last = nb.items.filter((it) => it.tb <= t + 0.1).pop();
  const look = last ? last.side * -1 : 0;                                    // looks at whoever is talking
  let o = classWorld(t, cam, {
    you: false, benji: false,
    smart: {
      L: { face: smartFace(t, 1, { talk: last && last.side > 0 }) }, R: { face: smartFace(t, -1, { talk: last && last.side < 0 }) },
      you: { turn: look * 0.45, headRot: look * 4, face: { name: 'confused', eyes: { look: [look, -0.3] }, fx: ['sweat'] } }, youAct: { arms: true },
    },
  });
  o += coldWash(t);
  o += smartPlates(t, cam, 1, { fade: 0.7 });
  o += nb.o;
  o += frame(t);
  return o;
}
// 13 — "They never laughed once." his forced laugh; the two turn and stare; FUN: 0%
function shotLaugh(t) {
  const u = seg(t, C.laugh, C.boring);
  const cam = camLerp(camAt(2775, 670, 1.8), camAt(2775, 680, 1.65), u);
  const laughing = t < B.laughStop + 0.25;
  const lb = laughing ? Math.abs(Math.sin(t * 14)) : 0;
  const stare = seg(t, C.laugh + 0.25, C.laugh + 0.6);
  let o = classWorld(t, cam, {
    you: false, benji: false,
    smart: {
      L: { turn: lerp(0.35, 0.65, stare), face: { name: 'deadpan', mouth: 'line', eyes: { look: [0.9, 0.1] } } },
      R: { turn: lerp(-0.35, -0.65, stare), face: { name: 'deadpan', mouth: 'line', eyes: { look: [-0.9, 0.1] } } },
      you: laughing
        ? { turn: 0, armL: 30 + 20 * lb, armR: 30 + 20 * lb, bodyY: -6 * lb, face: { name: 'joy', mouth: 'bigGrin', eyes: { type: 'happy' } } }
        : { turn: 0, armL: 8, armR: 8, face: { name: 'deadpan', mouth: 'line', eyes: { look: [0.4, 0] }, fx: ['sweat2'] } },
      youAct: { arms: false },
    },
  });
  o += coldWash(t);
  const hh = head(cam, 'you', HERO_SMART.x, HERO_SMART.y, HERO_SMART.s);
  if (laughing) o += E.laughMarks(hh.x + 120, hh.y + 30, t, 1 - seg(t, B.laughStop, B.laughStop + 0.25), 1);
  o += smartPlates(t, cam, 1, { fade: 0.75 });
  const [tx, ty] = scr(cam, 2780, 790);
  o += H.tooltip({ x: tx, y: ty, t, k: seg(t, B.once - 0.15, B.once + 0.3), title: 'MATHLETES TABLE', rarity: 'common', theme: TH(t), side: 'up', dist: 330, dx: 40, s: 1.0, lines: [{ label: 'LAUGHS:', value: '0', col: '#9AA8B6' }, 'FUN: 0%'] });
  o += frame(t);
  return o;
}
// 14 — "...This is boring." slumped, chin on fist; through the window: Benji alone on the bench with his potato
function shotBoring(t) {
  const u = seg(t, C.boring, C.home);
  const cam = camLerp(camAt(2560, 580, 1.75), camAt(2585, 585, 2.0), u);
  const glance = seg(t, B.glance - 0.1, B.glance + 0.25);
  let o = classWorld(t, cam, {
    you: false, benji: false,
    outside: { wx: 2280, wy: 330, glow: Math.floor(t * 5) % 3 ? 0.22 : 0.08 },
    smart: {
      L: { turn: 0.6, face: { name: 'deadpan', mouth: Math.floor(t * 8) % 2 ? 'o' : 'line', eyes: { look: [1, 0] } } },
      R: { turn: -0.6, face: { name: 'deadpan', mouth: Math.floor(t * 8 + 1) % 2 ? 'o' : 'line', eyes: { look: [-1, 0] } } },
      you: { turn: lerp(0, -0.35, glance), armR: 14, bendR: -128, armL: 8, headRot: lerp(-6, 3, glance), bodyY: 8, face: { name: 'sleepy', eyes: { look: [lerp(0, -1, glance), lerp(0.2, -0.1, glance)] } } },
      youAct: { arms: false },
    },
  });
  o += coldWash(t, 0.04);
  o += frame(t);
  return o;
}

// ================================================================ HOME, evening: the kitchen
const KS = SH.SPOTS.kitchen;
const MOM = { ...KS.sinkStand };                                            // (375, 790) s .46
const DOOR = KS.door.enter;                                                 // (2120, 990)
const HSTOP = 1380;                                                         // where the hero stops after coming in
const scrub = (t) => ({ armL: 12 + 6 * Math.sin(t * 9), armR: 12 - 6 * Math.sin(t * 9 + 1), bodyY: 6 + 2 * Math.sin(t * 9), lean: 1.5 * Math.sin(t * 4.5) });
function kitchenWorld(t, cam, o = {}) {
  const Ly = SH.kitchen.layers(t, { time: 'evening', dishes: true, lamp: 1, clock: '6:40' });
  let s = view(cam, Ly.bg, 0.8) + view(cam, Ly.mid) + view(cam, Ly.front);
  let st = '';
  if (o.mom !== false) st += actor('mom', t, { ...MOM, view: 'back', tired: 1, ...scrub(t), ...(o.mom || {}) }, { arms: false, energy: 0.6 });
  if (o.you) st += actor('you', t, { y: 990, s: 0.5, backpack: true, ...o.you }, o.youAct || { arms: false });
  s += view(cam, st + (o.extra || ''));
  return s + view(cam, Ly.light);
}
// the hero's walk in from the doorway (world x at t)
const walkInX = (t) => lerp(DOOR.x + 60, HSTOP, ease.out(seg(t, C.home, C.home + 1.5)));
function heroIn(t) {
  const w = seg(t, C.home, C.home + 1.5);
  if (w < 1) return { x: walkInX(t), view: 'side', ...AC.walk((t - C.home) * 9, 1 - 0.6 * seg(w, 0.7, 1)), face: { name: 'neutral', eyes: { look: [-1, 0] } } };
  return { x: HSTOP, turn: -0.4, face: { name: 'deadpan', eyes: { look: [-1, -0.2] } } };
}
const momMarker = (t, cam, o = {}) => {
  const hm = head(cam, 'mom', MOM.x, MOM.y, MOM.s);
  const grey = o.grey || 0;
  return H.questMarker({ x: hm.x, y: hm.y - 6, s: (o.s ?? 0.8) * (1 - 0.3 * grey), t, k: o.k ?? 1, col: grey > 0.5 ? '#9AA8B6' : '#FFD21F', reward: '+5 XP', glow: grey < 0.5, seed: 3 });
};
// 15 — "At home, Mom had a quest." wide kitchen, evening: Mom at the sink, the hero walks in, a "!" over Mom
function shotHome(t) {
  const u = seg(t, C.home, C.help);
  const cam = camLerp({ zoom: 1.0, x: 40, y: 0 }, { zoom: 1.12, x: -60, y: -20 }, u);
  let o = kitchenWorld(t, cam, { you: { ...heroIn(t) } });
  o += coldWash(t);
  o += momMarker(t, cam, { k: seg(t, B.quest - 0.2, B.quest + 0.35), s: 0.85 });
  o += frame(t, { clock: '6:40 PM' }) + xpBar(t);
  return o + whip(t, C.home, -1, 0.14);
}
// 16 — '"Help Mom. Five XP."' the quest toast with its tiny reward; the hero is unimpressed
function shotHelp(t) {
  const u = seg(t, C.help, C.sorry);
  const cam = camLerp({ zoom: 1.45, x: -300, y: -10 }, { zoom: 1.56, x: -320, y: -15 }, u);
  const plates = Math.sin(t * 3) * 1.5;
  let o = kitchenWorld(t, cam, { you: { x: 900, turn: -0.5, face: { name: 'deadpan', eyes: { look: [-0.3, -1] } } }, mom: { lean: plates * 0.4 } });
  o += coldWash(t);
  o += momMarker(t, cam, { s: 1.0 });
  o += H.questToast({ k: seg(t, B.help - 0.2, B.five + 0.15), t, title: 'Help Mom', sub: 'Wash the dishes', reward: '+5 XP', kind: 'new', x: 1240, y: 250, s: 1.1, out: seg(t, C.sorry - 0.3, C.sorry) });
  o += frame(t, { clock: '6:40 PM' });
  return o;
}
// 17 — "Sorry, Mom. Gotta go." backing toward the door, thumb over the shoulder; Mom looks back
function shotSorry(t) {
  const u = seg(t, C.sorry, C.fifty);
  const cam = camLerp({ zoom: 1.22, x: -80, y: -40 }, { zoom: 1.28, x: -40, y: -45 }, u);
  const back = ease.inOut(seg(t, C.sorry + 0.3, C.fifty + 0.4));
  const look = seg(t, C.sorry + 0.2, C.sorry + 0.6);
  let o = kitchenWorld(t, cam, {
    you: { x: lerp(1280, 1560, back), turn: -0.45, armR: 120 + 10 * Math.sin(t * 8), bendR: 80, armL: 14, bodyY: 4 * Math.abs(Math.sin(t * 9)) * back, face: { name: 'talkHappy', eyes: { look: [0.6, -0.4] } } },
    youAct: { arms: false, energy: 0.8 },
    mom: { view: 'front', turn: lerp(-0.9, 0.55, look), armL: 20, armR: 26, face: { name: 'happy', eyes: { look: [1, 0] } } },
  });
  o += coldWash(t);
  o += momMarker(t, cam, { s: 0.9 });
  o += frame(t, { clock: '6:41 PM' });
  return o;
}
// 18 — "There's a fifty-XP quest down the street." a big gold +50 XP waypoint in the doorway; Mom's marker greys out
function waypoint(x, y, k, t, s = 1) {
  if (k <= 0) return '';
  const sc = ease.outBack(clamp(k, 0, 1)) * s;
  let g = H.glow(0, -40, 190, 190, '#FFC83A', 0.9 + 0.1 * Math.sin(t * 5));
  g += H.rays(0, -40, 12, 220, '#FFE88A', 0.22, t * 30, 70);
  g += S.path(H.diamondD(0, -40, 70, 80), ol('#FFC83A', 7)) + S.path(H.diamondD(0, -40, 56, 64), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 3, opacity: 0.7 });
  g += H.bangGlyph(0, -100, 116, '#FFFFFF', 6);
  g += S.g(S.path(H.para(-120, -34, 240, 68, 16), ol('#1E1404', 5)) + S.path(H.para(-116, -30, 232, 60, 14), { fill: 'none', stroke: '#FFC83A', 'stroke-width': 3 }) + H.TL('+50 XP', 0, 22, 54, '#FFE14D'), `translate(0 ${f(90 + 6 * Math.sin(t * 4))})`);
  g += H.TF('QUEST · 300 m', 0, 168, 24, '#FFD98A', { stroke: '#120A00', 'stroke-width': 6, 'paint-order': 'stroke', 'letter-spacing': 2 });
  return S.g(g, `translate(${f(x)} ${f(y + 8 * Math.sin(t * 3))}) scale(${f(sc)})`);
}
function shotFifty(t) {
  const u = seg(t, C.fifty, C.fine);
  const cam = camLerp({ zoom: 0.92, x: 250, y: 10 }, { zoom: 0.98, x: 270, y: 0 }, u);
  const grey = seg(t, B.fifty + 0.2, B.fifty + 0.6);
  let o = kitchenWorld(t, cam, {
    you: { x: 1600, turn: 0.55, face: { name: 'excited', eyes: { look: [1, -0.6] } }, armR: 40, armL: 20 },
    mom: { view: 'front', turn: 0.55, armL: 20, armR: 26, face: { name: 'happy', eyes: { look: [1, 0] } } },
  });
  o += coldWash(t);
  o += momMarker(t, cam, { s: lerp(0.8, 0.6, grey), grey });
  const [wx, wy] = scr(cam, 2080, 470);
  o += waypoint(wx, wy, seg(t, B.fifty - 0.2, B.fifty + 0.25), t, 0.95);
  const [fx_, fy_] = scr(cam, 1600, 990);
  o += H.questArrow({ x: fx_, y: fy_, angle: -8, t, k: seg(t, B.fifty, B.fifty + 0.4), s: 0.75, label: '+50 XP', dist: '300 m', col: '#FFC83A' });
  o += frame(t, { clock: '6:41 PM', quest: 'MOVE MR. PIKE\'S COUCH', questSub: '+50 XP · 300 m' });
  return o + whip(t, C.fifty, 1, 0.1);
}
// 19 — "It's okay, sweetheart. I'm fine." Mom's tired smile, clean face (plates faded)
function shotFine(t) {
  const u = seg(t, C.fine, C.alone);
  const cam = camLerp(camAt(MOM.x + 30, 470, 2.1), camAt(MOM.x + 30, 462, 2.35), u);
  let o = kitchenWorld(t, cam, { mom: { view: 'front', turn: 0.4, armL: 18, armR: 22, face: { name: 'happy', eyes: { look: [0.9, -0.1] } } } });
  o += coldWash(t, -0.04);
  o += momMarker(t, cam, { s: 0.9, grey: 1, k: 1 - seg(t, C.fine, C.fine + 0.4) });
  o += frame(t, { clock: '6:41 PM' });
  return o;
}
// 20 — the beat + "She said she was fine." alone: the hero is gone, she turns back to the dishes; slow pull-back
function shotAlone(t) {
  const u = seg(t, C.alone, C.energy);
  const cam = camLerp({ zoom: 1.4, x: -330, y: -60 }, { zoom: 1.08, x: -120, y: -20 }, u);
  const tb = seg(t, C.alone + 0.4, C.alone + 1.1);
  const mom = tb < 1 ? { view: 'front', turn: lerp(0.4, -0.9, tb), armL: 16, armR: 18, face: { name: 'neutral', eyes: { look: [lerp(0.8, -0.5, tb), 0.3] } }, bodyY: 10 * tb } : { bodyY: 12 };
  let o = kitchenWorld(t, cam, { mom });
  // the door frame swings: the hero's coat-tail just leaving at the right edge
  o += coldWash(t);
  o += frame(t, { clock: '6:42 PM' });
  return o;
}
// 21 — "Her energy said one percent." push-in on her back; ENERGY rolls 2% -> 1%, blinking
function shotEnergy(t) {
  const u = seg(t, C.energy, C.kid);
  const cam = camLerp(camAt(MOM.x + 20, 430, 1.7), camAt(MOM.x + 10, 420, 2.0), u);
  const nod = bump(t, B.one + 0.35, B.one + 1.05);
  let o = kitchenWorld(t, cam, { mom: { headY: 18 * nod, bodyY: 12 + 6 * nod } });
  o += coldWash(t);
  const hm = head(cam, 'mom', MOM.x, MOM.y, MOM.s);
  o += H.plateFor('mom', { x: hm.x, y: hm.y, s: 1.25, t, theme: TH(t), k: seg(t, B.energy - 0.3, B.energy + 0.25), bars: [{ label: 'ENERGY', value: 1, from: 2, roll: seg(t, B.one - 0.05, B.one + 0.45) }] });
  o += frame(t, { clock: '6:42 PM' });
  return o;
}

// ================================================================ the living room, evening: Grandpa
const LS = SH.SPOTS.livingRoom;
const GP = SH.seatPose(LS.seats.armchair, 1.1, { glasses: 'up' });
const HSKID = 1100;                                                          // where the hero skids to a stop
function livingWorld(t, cam, o = {}) {
  const Ly = SH.livingRoom.layers(t, { time: 'evening', lamp: 1 });
  let s = view(cam, Ly.bg, 0.8) + view(cam, Ly.mid);
  s += view(cam, actor('grandpa', t, { ...GP, ...(o.gp || {}) }, { arms: false, energy: 0.7 }));
  s += view(cam, Ly.front);
  s += view(cam, K.draw.biscuit({ ...LS.dogBed.dog, pose: 'sleep', t }));
  if (o.you) s += view(cam, actor('you', t, { y: 1000, s: 0.5, backpack: true, ...o.you }, o.youAct || { arms: false }));
  return s + view(cam, Ly.light);
}
function gpPlate(t, cam, o = {}) {
  const hg = head(cam, 'grandpa', GP.x, GP.y, GP.s);
  return H.plateFor('grandpa', { x: hg.x, y: hg.y, s: o.s ?? pS(hg.z, 0.5), t, theme: TH(t), k: o.k ?? 1, fade: o.fade || 0, glitch: o.glitch || 0, crown: true });
}
// 22 — "Kid." the hero rushes through the living room, skids to a stop
function shotKid(t) {
  const u = seg(t, C.kid, C.looking);
  const cam = camLerp({ zoom: 1.12, x: 130, y: -10 }, { zoom: 1.2, x: 180, y: -20 }, u);
  const run = t < B.kid;
  const skid = seg(t, B.kid, B.kid + 0.3);
  const x = run ? lerp(380, HSKID - 60, seg(t, C.kid - 0.1, B.kid)) : lerp(HSKID - 60, HSKID, ease.out(skid));
  const you = run
    ? { x, flip: true, view: 'side', ...AC.run((t - C.kid) * 16, 1), lean: 8, face: { name: 'determined' } }
    : { x, flip: true, view: 'side', lean: lerp(-14, 0, seg(t, B.kid + 0.2, B.kid + 0.6)), armL: 40, armR: -30, legL: 20, legR: -10, face: { name: 'shocked', fx: skid < 1 ? ['exclaim'] : [] } };
  let o = livingWorld(t, cam, { you, gp: { headRot: -6, face: { name: 'deadpan', eyes: { look: [-1, 0] } } } });
  if (!run && skid < 1) { const [dx, dy] = scr(cam, x - 40, 1000); o += K.C.dust(dx, dy, B.kid, t); }
  o += coldWash(t);
  o += gpPlate(t, cam);
  const hh = head(cam, 'you', x, 1000, 0.5);
  o += H.heroPlate({ x: hh.x, y: hh.y, s: 0.75, t, k: 1 });
  o += frame(t, { clock: '6:44 PM', quest: "MOVE MR. PIKE'S COUCH", questSub: '+50 XP · 290 m' });
  return o + whip(t, C.kid, 1, 0.12);
}
// 23 — "What are you really looking at?" Grandpa, gently, glasses down; his plate fades (clean face)
function shotLooking(t) {
  const u = seg(t, C.looking, C.stats);
  const cam = camLerp(camAt(1555, 535, 2.35), camAt(1550, 528, 2.6), u);
  let o = livingWorld(t, cam, { gp: { glasses: 'on', turn: -0.6, face: { name: 'neutral', eyes: { look: [-1, -0.1] } } } });
  o += coldWash(t, -0.03);
  o += gpPlate(t, cam, { s: 1.15, fade: seg(t, C.looking + 0.2, C.looking + 0.8) });
  return o;
}
// 24 — "Stats, Grandpa. Stats don't lie." defensive, pointing at the plate over Grandpa's head
function shotStats(t) {
  const u = seg(t, C.stats, C.truth);
  const cam = camLerp(camAt(1300, 640, 1.85), camAt(1305, 630, 2.0), u);
  const pt = ease.outBack(seg(t, B.point - 0.25, B.point + 0.05));
  let o = livingWorld(t, cam, { you: { x: HSKID, turn: 0.15, armR: lerp(20, 138, pt), bendR: 0, armL: 14, face: { name: 'angry', eyes: { look: [0.9, -0.3] } } }, youAct: { arms: false, energy: 1.2 } });
  o += coldWash(t);
  const hh = head(cam, 'you', HSKID, 1000, 0.5);
  o += H.heroPlate({ x: hh.x, y: hh.y, s: 1.0, t, k: 1 });
  o += gpPlate(t, cam, { s: 1.1, k: seg(t, C.stats + 0.05, C.stats + 0.5) });
  o += frame(t, { clock: '6:44 PM' });
  return o + whip(t, C.stats, -1, 0.1);
}
// 25 — "Maybe not. But they don't tell the whole truth, either." Grandpa close; his plate flickers on "whole truth"
function shotTruth(t) {
  const u = seg(t, C.truth, C.out);
  const cam = camLerp(camAt(1550, 548, 2.55), camAt(1548, 540, 2.95), u);
  const gl = bump(t, B.whole - 0.05, B.whole + 0.6);
  let o = livingWorld(t, cam, { gp: { glasses: 'on', turn: -0.55, face: { name: 'happy', mouth: 'smallSmile', eyes: { look: [-1, 0] } } } });
  o += coldWash(t, -0.03);
  o += gpPlate(t, cam, { s: 1.25, k: seg(t, C.truth + 0.1, C.truth + 0.5), glitch: gl, fade: 0.35 + 0.65 * seg(t, B.whole + 0.5, B.whole + 0.9) });
  return o;
}
// 26 — the beat: the hero, alone, looks up at his own "???"; the HUD clock rolls TUE -> SAT; white (SC 08: Saturday, the fair)
const DAYS = ['TUE', 'WED', 'THU', 'FRI', 'SAT'];
function shotOut(t) {
  const u = seg(t, C.out, END);
  const cam = camLerp(camAt(HSKID + 20, 640, 2.0), camAt(HSKID + 20, 610, 2.45), u, ease.inOut);
  const up = seg(t, C.out + 0.4, C.out + 0.9);
  let o = livingWorld(t, cam, { you: { x: HSKID, turn: 0.25, headRot: -4 * up, face: { name: 'confused', eyes: { look: [0.2, lerp(0, -1, up)] } } } });
  o += coldWash(t);
  const hh = head(cam, 'you', HSKID, 1000, 0.5);
  o += H.heroPlate({ x: hh.x, y: hh.y, s: 1.1, t, k: 1 });
  const dk = seg(t, B.days, END - 0.35);
  const di = Math.min(DAYS.length - 1, Math.floor(dk * DAYS.length * 0.999 + (dk >= 1 ? 1 : 0)));
  const clock = dk > 0 && dk < 1 ? `${1 + Math.floor((t * 37) % 12)}:${String(Math.floor((t * 613) % 60)).padStart(2, '0')} ${Math.floor(t * 9) % 2 ? 'AM' : 'PM'}` : dk >= 1 ? '9:00 AM' : '6:45 PM';
  o += frame(t, { clock, day: DAYS[di] });
  if (dk > 0) o += S.g(H.TL(DAYS[di], 0, 0, 120, '#DCE8F2', { stroke: '#050A10', 'stroke-width': 12, 'paint-order': 'stroke' }), `translate(330 ${f(330)}) scale(${f(0.6 + 0.4 * ease.outBack(seg((dk * DAYS.length) % 1, 0, 0.3)))})`, { opacity: f(0.85 * (1 - seg(t, END - 0.3, END))) });
  return o + E.fadeTo(t, B.flash, END, '#FFFFFF', 1);
}

// ================================================================ router
const SHOTS = [
  [C.krump, shotBoard], [C.benji, shotKrump], [C.idea, shotBenji], [C.actually, shotIdea], [C.smart, shotActually], [C.vs, shotSmart],
  [C.since, shotVS], [C.heart, shotSince], [C.hurt, shotHeart], [C.partners, shotHurt], [C.numbers, shotPartners], [C.laugh, shotNumbers],
  [C.boring, shotLaugh], [C.home, shotBoring], [C.help, shotHome], [C.sorry, shotHelp], [C.fifty, shotSorry], [C.fine, shotFifty],
  [C.alone, shotFine], [C.energy, shotAlone], [C.kid, shotEnergy], [C.looking, shotKid], [C.stats, shotLooking], [C.truth, shotStats],
  [C.out, shotTruth], [Infinity, shotOut],
];
const CLOSE = new Set([shotKrump, shotIdea, shotActually, shotSince, shotHurt, shotFine, shotLooking, shotStats, shotTruth, shotOut, shotBoring, shotEnergy]);
const shotAt = (t) => { for (const [end, g] of SHOTS) if (t < end) return g; return shotOut; };
function scene(t) {
  const fn = shotAt(t);
  VOL_OFF = CLOSE.has(fn);
  return fn(t);
}
function look(t) {
  if (t >= C.home) return { grade: 'cool', vignette: 0.95 };
  return { grade: 'cool', vignette: 0.85 };
}

module.exports = { scene, look, times, TIMES: TM, CUT: C, BEATS: B };
