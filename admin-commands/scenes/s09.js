// SC 09 · ПРАВДА — the hero lands in the warm server room; every screen a different city, live. In the big chair, behind
// THE DAILY SERVER, the old man from the garage sale: "Would you like some tea?" — "YOU'RE the Admin?!" Every hundred years
// one person gets the panel. Cutaways: the very first player (a very confused dinosaur, 65,000,000 BC) and the nine-foot
// fellow of 1964 who couldn't fit through any doors. "I read the logs. Every single one." — FIND: help → 0 RESULTS.
// Battery 1%. "Now I'll type undo all... Including you." — "Wait! Let me fix it. Myself. One by one." → teleport flash.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const { L } = K.V;
const E = require('./s09_env');
const { R, P, CI, G, tr, outT, outTF, ob, io, eo, at, drift, withShake, white, flashAt, whip, CS, ST, A } = E;

const START = K.V.scene('SC 09').start, END = K.V.scene('SC 10').start;
const l = (i) => L('09.' + i);
const M = Array.from({ length: 16 }, (_, i) => l(i));

// ---------------------------------------------------------------- beats (all from the voice)
const tFull = M[0].word('Full').t0;
const b1 = M[0].word('Every').t0 - 0.12;                // the wall of live cities
const tEvery2 = M[0].word('Every', 1).t0, tLive = M[0].word('live').t0;
const b2 = M[1].a - 0.1;                                // the big chair (newspaper)
const tVery = M[1].word('very').t0, tMan = M[1].word('man').t0;
const b3 = M[1].word('The', 1).t0 - 0.1;                  // "The old man from the garage sale."
const tGarage = M[1].word('garage').t0;
const b4 = M[2].a - 0.1;                                // "Ah. ... Would you like some tea?"
const tSit = M[2].word('Sit').t0, tTea = M[2].word('tea').t0;
const b5 = M[3].a - 0.08;                               // "YOU'RE the Admin?! You SOLD me the laptop!"
const tSold = M[3].word('SOLD').t0, tLaptop = M[3].word('laptop').t0, tYou2 = M[3].word('You', 0).t0;
const b6 = M[4].a - 0.1;                                // every hundred years (history on the main screen)
const b7 = M[5].a - 0.08;                               // "How old ARE you?"
const tYears = M[5].word('YEARS').t0, tAre = M[5].word('ARE').t0;
const b8 = M[6].a - 0.1;                                // "since the very first player joined"
const b9 = M[6].word('A').t0 - 0.3;                     // CUTAWAY: a very confused dinosaur
const tDino = M[6].word('dinosaur').t0;
const b10 = M[7].a - 0.05;                              // fly / fast / big / win
const WANT_T = [M[7].word('fly').t0, M[7].word('fast').t0, M[7].word('big').t0, M[7].word('Win').t0];
const b11 = M[8].a - 0.1;                               // CUTAWAY 1964: nine feet tall
const tMade = M[8].word('made').t0, tNine = M[8].word('nine', 0).t0, tTall = M[8].word('tall').t0;
const b12 = M[8].word('He', 0).t0 - 0.15;               // ...couldn't fit through any doors. He was very sad.
const tDoors = M[8].word('doors').t0, tSad = M[8].word('He', 1).t0;
const b13 = M[9].a - 0.1;                               // "...That's exactly what I did."
const b14 = M[10].a - 0.1;                              // "I read the logs. Every single one."
const tLogs = M[10].word('logs').t0, tSingle = M[10].word('Every').t0;
const b15 = M[11].a - 0.1;                              // FIND: help → 0 results
const tTyped = M[11].word('typed').t0, tCommand = M[11].word('command').t0;
const b16 = M[11].word('help').t0 - 0.12;               // the hero's face, green; "And he was right."
const b17 = M[13].a - 0.1;                              // battery one percent
const b18 = M[14].a - 0.1;                              // "Now I'll type undo all ... Including you."
const tUndo = M[14].word('undo').t0, tAll = M[14].word('all').t1, tGoes = M[14].word('Everything').t0, tIncl = M[14].word('Including').t0;
const b19 = M[15].a - 0.06;                             // "Wait!"
const b20 = M[15].word('Let').t0 - 0.1;                 // "Let me fix it. Myself. One by one."
const tMyself = M[15].word('Myself').t0, tOne = M[15].word('One').t0;

// ---------------------------------------------------------------- cast placement
const HX = 1220, HY = 960, HS = 0.52;          // the hero on the rug (two-shots)
const HX2 = 1430;                              // when the main screen must stay visible
const HEAD = (x = HX, s = HS) => [x, HY - 760 * s];

const hero = (t, pose = {}, act = {}, lap = {}) => E.heroLap(t, { x: HX, y: HY, s: HS, ...pose }, act, { battery: 1, glow: 0.5, ...lap });
const old = (t, pose = {}, act = {}) => E.oldSeated(t, pose, act);

// ---------------------------------------------------------------- shots
// 1. arrival: flash → the hero drops into the warm room and looks around; tilt up to the walls of screens
function shotArrive(t) {
  const cam = drift(K.camKeys(t, [[START, at(1290, 690, 1.6)], [START + 0.9, at(1290, 680, 1.55)], [tFull - 0.2, at(1260, 640, 1.42)], [tFull + 0.7, at(1170, 440, 1.27)], [b1, at(1160, 430, 1.26)]]), t, 4);
  const tp = E.teleIn(t, START + 0.08, HX, HY, HS);
  const look = t < tFull ? Math.sin((t - START) * 2.2) * 0.45 : lerp(0.2, -0.2, seg(t, tFull, b1));
  let h = '';
  if (tp.show) h = hero(t, { lift: tp.lift, sx: tp.sx, sy: tp.sy, turn: look * 0.5, headRot: -look * 6, face: { name: 'amazed', eyes: { look: [look, t > tFull ? -0.7 : -0.2] } } }, {}, { glow: 0.4 });
  const old0 = old(t, { paper: 1 });
  let o = E.room(t, cam, {}, old0, tp.fx + h);
  o += white(Math.max(1 - seg(t, START, START + 0.4), 0)) + white(0.6 * (tp.flash || 0) * (t > START + 0.1 ? 1 : 0));
  return o;
}
// 2. every screen a different city — every city live
function shotFeeds(t) {
  const onK = (i) => seg(t, b1 + 0.05 + i * 0.16, b1 + 0.4 + i * 0.16);
  const live = seg(t, tLive - 0.15, tLive + 0.2);
  const z = lerp(1.0, 1.07, io(seg(t, b1, b2))) + 0.03 * bump(t, tEvery2 - 0.1, tEvery2 + 0.5);
  const px = lerp(0, -30, io(seg(t, tEvery2, b2)));
  return G(E.feedWall(t, onK, live), `translate(960 540) scale(${f(z)}) translate(${f(-960 + px)} -540)`) + whip(t, b1, 1);
}
// 3. "And in the big chair... is a very old man." — POV push-in; the paper comes down
function shotChair(t) {
  const cam = K.camKeys(t, [[b2, at(600, 640, 1.3)], [tVery, at(510, 620, 1.85)], [b3, at(492, 615, 2.2)]]);
  const peek = io(seg(t, tVery - 0.2, tVery + 0.25)) * 0.22;
  const down = io(seg(t, tMan - 0.15, tMan + 0.35));
  const paper = clamp(1 - peek - down, 0, 1);
  const face = down > 0.5 ? { name: 'happy', eyes: { look: [0.5, 0] } } : { name: 'sneaky', eyes: { look: [0.6, 0] } };
  return E.room(t, cam, { lamp: lerp(0.55, 1, down) }, old(t, { paper, face, headRot: -4 * down }), '');
}
// 4. "The old man from the garage sale." — two-shot + a polaroid of Server Street
function polaroid(t, x, y, k, rot) {
  if (k <= 0) return '';
  const id = S.uid('s09pol');
  const sale = ST.garageSale(t, { glow: 0.6 });
  let o = R(-226, -200, 452, 400, 10, ol('#FFFFFF', 7)) + S.clipDef(id, R(-200, -176, 400, 280, 4));
  o += G(G(sale, 'translate(-250 -186) scale(0.26)'), null, { 'clip-path': `url(#${id})` }) + R(-200, -176, 400, 280, 4, { fill: 'none', stroke: E.LINE, 'stroke-width': 4 });
  o += TF('Server Street — $1', 0, 160, 34, '#3A2A55');
  o += R(-40, -214, 80, 34, 6, { fill: '#FFE45C', opacity: 0.85, transform: 'rotate(-6)' });
  return G(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot + 4 * (1 - eo(k)))}) scale(${f(0.78 * ob(k))})`);
}
function shotGarage(t) {
  const cam = drift(K.camKeys(t, [[b3, at(860, 640, 1.22)], [b4, at(840, 630, 1.28)]]), t, 4);
  const pk = seg(t, tGarage - 0.25, tGarage + 0.15);
  const dbl = bump(t, tGarage - 0.05, tGarage + 0.5);
  const h = hero(t, { turn: -0.45, headRot: 6 * dbl, bodyY: -10 * dbl, face: { name: 'shocked', eyes: { look: [t < tGarage ? -0.8 : -0.3, -0.2] } } });
  const o2 = old(t, { face: { name: 'happy', eyes: { look: [0.8, 0] } }, headRot: -6 });
  return E.room(t, cam, {}, o2, h, polaroid(t, 850, 470, pk, -7)) + flashAt(t, tGarage - 0.05, 0.25, 0.2);
}
// 5. "Ah. You found the server room. Sit down. Would you like some tea?"
function shotTea(t) {
  const cam = drift(K.camKeys(t, [[b4, at(500, 610, 2.05)], [tTea - 0.3, at(505, 612, 2.22)], [b5, at(520, 600, 2.3)]]), t, 3);
  const fold = 1 - seg(t, b4, b4 + 0.5);
  const cup = io(seg(t, tTea - 0.45, tTea + 0.05));
  const pat = t > tSit - 0.05 && t < tTea - 0.5 ? Math.abs(Math.sin((t - tSit) * 9)) : 0;
  const pose = { paper: fold * 0.3, face: { name: 'happy', eyes: { look: [0.6, -0.1] } }, headRot: -3 + 4 * Math.sin(t * 1.3) };
  if (fold < 0.05) { pose.cup = cup; pose.armL = 24 + 30 * pat; }
  return E.room(t, cam, {}, old(t, pose, { energy: 0.6 }), '');
}
// 6. "YOU'RE the Admin?! You SOLD me the laptop!" — point, then the laptop held up high
function shotSold(t) {
  const smash = t >= tSold - 0.04 ? 0.26 : 0;
  const cam0 = t < tYou2 - 0.1 ? K.camKeys(t, [[b5, at(HX - 30, 590, 2.15)], [tYou2, at(HX - 35, 595, 2.25)]]) : K.camKeys(t, [[tYou2 - 0.1, at(HX - 20, 690, 1.9)], [tSold - 0.05, at(HX - 20, 685, 1.98)], [b6, at(HX - 20, 680, 2.0)]]);
  const cam = withShake({ ...cam0, zoom: cam0.zoom + smash }, t, [[tSold, 0.3, 14], [tLaptop, 0.25, 8]]);
  let h;
  if (t < tYou2 - 0.1) {
    const k = ob(seg(t, b5, b5 + 0.18));
    h = K.actor('you', t, { x: HX, y: HY, s: HS, turn: -0.4, armL: lerp(10, 98, k), armR: 18, lean: -3 * k, face: 'shocked', volume: false }, { arms: false });
  } else {
    // the laptop thrust out toward the old man, screen first, shaken on "laptop!"
    const k = ob(seg(t, tYou2 - 0.1, tYou2 + 0.15));
    const shk = Math.sin(t * 26) * seg(t, tLaptop - 0.1, tLaptop + 0.05) * (1 - seg(t, tLaptop + 0.5, tLaptop + 0.7));
    const a = lerp(12, 34, k);
    const ly = -515 + 252 * Math.cos((a * Math.PI) / 180) + 40 - 30 * k;
    const lap = ST.laptop(10 * shk, ly + 12 * shk, lerp(0.5, 0.62, k), ST.adminScreen(t, { battery: 3, lines: ['Admin panel loaded.', 'Welcome... you.'] }), { glow: 0.6, t, dust: 0.2, rot: -4 + 5 * shk });
    h = K.actor('you', t, { x: HX, y: HY, s: HS, turn: -0.3, armL: a, armR: a, lean: -4 * k, face: { name: 'angry', fx: [] }, volume: false, props: [{ svg: lap, layer: 'front' }] }, { arms: false });
  }
  return E.room(t, cam, {}, old(t, { face: 'happy' }), h) + (t > tSold ? K.bang('SOLD!', 1500, 230, seg(t, tSold, tSold + 0.12) * (1 - seg(t, tLaptop + 0.2, tLaptop + 0.4)), 110, 8, '#FF6A3D') : '');
}
// 7. "Every hundred years, I give the panel to one person." — the panel holders on the main screen
function shotHistory(t) {
  const cam = drift(K.camKeys(t, [[b6, at(900, 520, 1.3)], [b7, at(930, 500, 1.4)]]), t, 4);
  const k = seg(t, M[4].word('hundred').t0, M[4].word('see').t0);
  const main = E.historyScreen(556, 350, t, k);
  const gest = io(seg(t, M[4].word('panel').t0 - 0.3, M[4].word('panel').t0)) * (1 - io(seg(t, M[4].b - 0.2, M[4].b + 0.2)));
  const o2 = old(t, { armR: 24 + 50 * gest, armL: 24, headRot: 6 * gest }, { arms: false });
  const h = hero(t, { x: HX2, turn: -0.35, headRot: 4, face: { name: 'confused', fx: [], eyes: { look: [-0.7, -0.5] } } });
  return E.room(t, cam, { mainScreen: main }, o2, h);
}
// 8. "Every hundred YEARS? How old ARE you?"
function shotHowOld(t) {
  const lean = io(seg(t, tAre - 0.15, tAre + 0.2));
  const cam = drift(K.camKeys(t, [[b7, at(HX - 20, 590, 2.2)], [tAre - 0.1, at(HX - 25, 595, 2.3)], [tAre + 0.1, at(HX - 30, 600, 2.55)], [b8, at(HX - 30, 600, 2.6)]]), t, 3);
  const jerk = bump(t, tYears - 0.05, tYears + 0.3);
  const h = hero(t, { turn: -0.35, lean: -5 * lean, headRot: 8 * jerk - 4 * lean, bodyY: -8 * jerk, face: { name: 'confused', eyes: { look: [-0.6, 0] } }, volume: false });
  return E.room(t, withShake(cam, t, [[tAre, 0.2, 5]]), {}, old(t, { face: 'happy' }), h);
}
// 9. "I've been the admin since the very first player joined."
function shotProud(t) {
  const cam = drift(K.camKeys(t, [[b8, at(482, 600, 2.35)], [b9, at(482, 606, 2.6)]]), t, 3);
  const o2 = old(t, { headRot: -7, face: { name: 'smug', eyes: { look: [0.3, -0.3] } } }, { energy: 0.8 });
  return E.room(t, cam, {}, o2, '');
}
// 10. CUTAWAY — 65,000,000 BC: player one joins. A very confused dinosaur.
function shotDino(t) {
  const u = seg(t, b9, b10);
  const cam = K.camKeys(t, [[b9, at(920, 560, 1.0)], [b10, at(960, 590, 1.12)]]);
  const reach = seg(u, 0.18, 0.25) * (1 - seg(u, 0.5, 0.56));
  const peck = bump(u, 0.55, 0.78);
  const look = seg(u, 0.84, 0.92);
  let w = E.prehistoric(t);
  w += E.dino(t, { x: 720, y: 900, s: 1.0, reach, peck, look, blink: bump(t, tDino + 0.3, tDino + 0.42) > 0.3 ? 1 : 0, confused: 1 });
  w += P('M1090 905 Q1080 770 1250 756 Q1420 762 1410 905 Z', ol('#9A8C86', 8)) + P('M1130 820 Q1200 790 1270 800', ln(6, '#BFB2AA'));
  w += ST.laptop(1250, 766, 0.42, ST.adminScreen(t, { lines: ['Admin panel loaded.', 'Welcome... Dino1.'], typed: u > 0.6 ? ';rrrawr' : '' }), { t, glow: 0.7, dust: 0 });
  let o = K.view(cam, w, 1);
  // server toast + chat
  const kt = seg(u, 0.04, 0.12) * (1 - seg(u, 0.5, 0.58));
  if (kt > 0) o += G(R(-330, -40, 660, 80, 18, { fill: '#000', opacity: 0.6 }) + TF('[SERVER]: Dino1 has joined the game', 0, 12, 34, '#FFE14D'), `${tr(420, 222)} scale(${f(ob(kt))})`);
  const kc = seg(u, 0.56, 0.62);
  if (kc > 0) o += K.chatCommand(1540, 140, ';rrrawr', seg(u, 0.58, 0.72), { t, user: 'Dino1', enter: seg(u, 0.74, 0.82), s: 1.05 });
  if (u > 0.78) o += K.denied(1530, 262, seg(u, 0.78, 0.86), 0.72, 'UNKNOWN COMMAND');
  if (u > 0.06 && u < 0.6) o += F_q(820, 150, t, seg(u, 0.06, 0.14));
  o += G(R(-6, -50, 520, 84, 16, ol('#5A3A22', 6)) + T('65,000,000 B.C.', 254, 14, 56, '#FFE2A0'), tr(70, 110, 1, -2));
  o += E.oldFilm(t, 0.45) + whip(t, b9, -1, '#FFE2A0');
  return o;
}
function F_q(x, y, t, k) {
  if (k <= 0) return '';
  return G(K.F.markText('?', 0, 0, 150, 10, '#FFFFFF'), `${tr(x, y + Math.sin(t * 6) * 8)} scale(${f(ob(k))})`);
}
// 11. "Most people want to fly. Be fast. Be big. Win." — old CRT replays, one per word
function shotWants(t) {
  const onK = (i) => seg(t, WANT_T[i] - 0.18, WANT_T[i] + 0.4);
  const z = lerp(1.0, 1.06, io(seg(t, b10, b11)));
  return G(E.wantsQuad(t, onK), `translate(960 520) scale(${f(z)}) translate(-960 -520)`) + whip(t, b10, 1);
}
// 12. CUTAWAY 1964 — ";size me 9 ft": BOING, nine feet tall
const MANX = 1290;
function shotGrow(t) {
  const g = ob(seg(t, tNine - 0.05, tNine + 0.45));
  const s = lerp(0.5, 0.76, g);
  const cam = withShake(K.camKeys(t, [[b11, at(1100, 600, 1.12)], [tNine - 0.1, at(1110, 590, 1.08)], [tNine + 0.4, at(1120, 520, 0.98)], [b12, at(1120, 520, 1.0)]]), t, [[tNine + 0.1, 0.35, 10]]);
  const proud = seg(t, tTall - 0.2, tTall + 0.1);
  const hands = A.hand(18, -1);
  const lap = ST.laptop(hands[0] + 110, hands[1] + 30, 0.36, ST.adminScreen(t, { lines: ['Welcome... Walter.'] }), { back: true, glow: 0.4, t, dust: 0 });
  const man = K.draw.adult(9, { x: MANX, y: 960, s, armL: 18, armR: lerp(18, 150, proud), sy: 1 + 0.08 * bump(t, tNine, tNine + 0.35), face: proud > 0.3 ? 'excited' : g > 0.5 ? 'amazed' : 'neutral', props: [{ svg: E.fedora(), layer: 'top' }, { svg: lap, layer: 'front' }] });
  let o = K.view(cam, E.house1964(t) + man, 1);
  const kc = seg(t, tMade - 0.3, tMade - 0.1) * (1 - seg(t, tTall, tTall + 0.2));
  if (kc > 0) o += K.chatCommand(560, 190, ';size me 9 ft', K.typeProgress(t, M[8], 'made', 'feet'), { t, user: 'Walter', enter: seg(t, tNine + 0.05, tNine + 0.4), s: 1.1 });
  if (t > tNine) o += K.bang('BOING!', 1650, 260, seg(t, tNine + 0.05, tNine + 0.15) * (1 - seg(t, tTall + 0.3, tTall + 0.5)), 100, 8, '#FFE9B8');
  return o + E.oldFilm(t, 1, '1964') + whip(t, b11, -1, '#FFE9B8');
}
// 13. "He couldn't fit through any doors. He was very sad."
function shotDoor(t) {
  const cam = K.camKeys(t, [[b12, at(1000, 540, 0.92)], [tDoors, at(900, 520, 1.0)], [tSad - 0.05, at(860, 520, 1.06)], [b13, at(850, 520, 1.12)]]);
  const s = 0.76;
  const bonk = seg(t, tDoors - 0.02, tDoors + 0.5);
  let man;
  const wx = lerp(1350, 880, io(seg(t, b12, tDoors)));
  if (t < tSad - 0.1) {
    const ph = (t - b12) * 9;
    const back = bonk > 0 ? -60 * Math.sin(bonk * Math.PI) : 0;
    const pose = bonk > 0 ? { rot: -14 * Math.sin(Math.min(1, bonk * 1.6) * Math.PI), armL: 120, armR: -20, face: { name: 'oof' } } : { ...A.walk(ph), face: 'determined' };
    man = K.draw.adult(9, { x: wx - back, y: 960, s, view: 'side', props: [{ svg: E.fedora(), layer: 'top' }], ...pose });
  } else {
    const k = io(seg(t, tSad - 0.1, tSad + 0.3));
    man = K.draw.adult(9, { x: 900, y: 960, s, turn: 0.2, armL: 4, armR: 4, lean: 3 * k, headRot: 10 * k, bodyY: 10 * k, face: { name: 'sad', eyes: { look: [0, 0.8] } }, props: [{ svg: E.fedora(), layer: 'top' }] });
    man += E.rainCloud(905, 960 - 820 * s - 190 + Math.sin(t * 2) * 6, 0.9, t);
  }
  let o = K.view(cam, E.house1964(t, 0.6) + man, 1);
  if (bonk > 0 && t < tSad) {
    o += K.bang('BONK!', 760, 220, seg(t, tDoors, tDoors + 0.1), 110, -10, '#FFE9B8');
    o += K.view(cam, K.sparkles([[720 + Math.cos(t * 9) * 70, 330 + Math.sin(t * 9) * 26, 26], [720 + Math.cos(t * 9 + 2) * 70, 330 + Math.sin(t * 9 + 2) * 26, 20], [720 + Math.cos(t * 9 + 4) * 70, 330 + Math.sin(t * 9 + 4) * 26, 22]], t), 1);
  }
  return o + E.oldFilm(t, 1, '1964');
}
// 14. "...That's exactly what I did."
function shotExactly(t) {
  const cam = drift(K.camKeys(t, [[b13, at(HX - 20, 600, 2.25)], [b14, at(HX - 20, 610, 2.45)]]), t, 2);
  const h = hero(t, { turn: -0.25, headRot: 6, bodyY: 6, armL: 10, armR: 10, face: { name: 'sad', eyes: { look: [-0.3, 0.8] }, fx: [] }, volume: false });
  return E.room(t, cam, {}, old(t, { face: 'happy' }), h);
}
// 15. "I know. I read the logs. Every single one." — the log fills the screens, the room turns green
function shotLogs(t) {
  const gk = io(seg(t, tSingle - 0.1, tSingle + 0.6));
  const cam = drift(K.camKeys(t, [[b14, at(760, 520, 1.55)], [tSingle - 0.1, at(780, 510, 1.5)], [b15, at(900, 500, 1.18)]]), t, 3);
  const n = Math.max(1, Math.floor(lerp(1, E.HERO_LOG.length, seg(t, tLogs - 0.2, tSingle + 0.4))));
  const turnK = io(seg(t, b14, b14 + 0.5));
  const o2 = old(t, { headRot: 8 * turnK, face: { name: 'happy', eyes: { look: [lerp(0.4, 1, turnK), -0.5 * turnK] } } });
  const h = hero(t, { x: 1490, turn: -0.3, face: { name: 'shocked', fx: [], eyes: { look: [-0.6, -0.7] } } });
  return E.room(t, cam, { logs: E.HERO_LOG.slice(0, n), green: gk }, o2, h);
}
// 16. "And you never once typed a command..." — FIND: help → 0 RESULTS
function shotSearch(t) {
  const cam = drift(K.camKeys(t, [[b15, at(960, 382, 2.38)], [b16, at(960, 380, 2.5)]]), t, 2);
  const q = 'help'.slice(0, Math.round(4 * seg(t, tTyped - 0.1, tCommand - 0.1)));
  const found = seg(t, tCommand + 0.05, tCommand + 0.3);
  const main = E.searchScreen(556, 350, t, q, found, seg(t, b15, tCommand));
  return E.room(t, withShake(cam, t, [[tCommand + 0.1, 0.25, 5]]), { mainScreen: main, logs: E.HERO_LOG, green: 1 }, '', '');
}
// 17. "...to help somebody else." / "And he was right." — slow push on the hero's face in the green light
function shotFace(t) {
  const cam = K.camKeys(t, [[b16, at(HX - 15, 590, 2.3)], [b17, at(HX - 10, 585, 2.85)]], ease.linear);
  const down = io(seg(t, M[12].a - 0.2, M[12].a + 0.6));
  const h = hero(t, { turn: -0.15, headRot: 3 + 4 * down, bodyY: 4 + 6 * down, armL: 10, armR: 10, face: { name: 'sad', eyes: { look: [-0.2, 0.3 + 0.5 * down] } }, volume: false });
  return E.room(t, cam, { green: 1, logs: E.HERO_LOG }, old(t, { face: 'happy' }), h);
}
// 18. SYSTEM: "Battery... one percent." — the laptop close-up, red pulse
function shotBattery(t) {
  const cam = at(1100, 600, 1.9);
  let o = E.room(t, cam, { green: 0.6, logs: E.HERO_LOG }, '', '');
  o += R(0, 0, 1920, 1080, 0, { fill: '#0A0608', opacity: 0.55 });
  const pulse = 0.5 + 0.5 * Math.sin((t - b17) * 9);
  const lines = ['tp me to the Admin', 'Teleported.', { text: 'Warning: battery 3%', col: '#FFB13B' }];
  if (t > M[13].word('one').t0 - 0.1) lines.push({ text: 'Warning: battery 1% !!', col: '#FF4D5E' });
  const s = lerp(1.62, 1.72, seg(t, b17, b18));
  o += ST.laptop(960, 1030, s, ST.adminScreen(t, { battery: t > M[13].word('one').t0 - 0.1 ? 1 : 3, lines }), { t, glow: 0.5, dust: 0.15 });
  o += R(0, 0, 1920, 1080, 0, { fill: '#FF2A3A', opacity: f(0.12 * pulse) });
  const kb = seg(t, M[13].word('one').t0, M[13].word('one').t0 + 0.15);
  if (kb > 0) o += G(R(-120, -60, 240, 120, 24, ol('#2A0C12', 7)) + R(-80, -30, 140, 60, 10, { fill: 'none', stroke: '#FF4D5E', 'stroke-width': 7 }) + R(60, -14, 12, 28, 4, { fill: '#FF4D5E' }) + R(-72, -22, 14, 44, 3, { fill: '#FF4D5E', opacity: f(pulse) }) + T('1%', 0, 90, 60, '#FF4D5E', E.OUT(8)), `${tr(1620, 240)} scale(${f(ob(kb))})`);
  return withShakeSvg(o, t, M[13].word('one').t0);
}
const withShakeSvg = (svg, t, t0) => K.shaken(t, t0, svg, 0.3, 8);
// 19. "Now I'll type undo all. Everything goes back. Including you."
function shotUndo(t) {
  const cam = drift(K.camKeys(t, [[b18, at(820, 560, 1.22)], [tIncl - 0.1, at(860, 560, 1.28)], [b19, at(900, 560, 1.32)]]), t, 3);
  const raise = io(seg(t, b18, M[14].word('type').t0));
  const o2 = old(t, { armR: lerp(24, 120, raise), armL: 24, headRot: -4, face: { name: 'happy', eyes: { look: [0.6, -0.3] } } }, { arms: false });
  const flick = t > tIncl ? seg(t, tIncl, M[14].b) : 0;
  const fl = flick > 0 && Math.floor(t * 18) % 3 === 0;
  let h = hero(t, { x: HX, turn: -0.35, armL: 12, armR: 12, face: { name: t > tIncl ? 'scared' : 'shocked', eyes: { look: t > tIncl ? [0.2, 0.9] : [-0.8, -0.4] } } });
  if (flick > 0) h = K.ghost(h, 14 * flick * (fl ? 1 : 0.4), 0.3 * flick);
  const gk = 1 - seg(t, b18, b18 + 0.8);
  let o = E.room(t, cam, { green: gk, logs: E.HERO_LOG }, o2, h);
  // rewind marks on the wall screens
  const rw = seg(t, tGoes - 0.1, tGoes + 0.2) * (1 - seg(t, M[14].b, M[14].b + 0.3));
  if (rw > 0) {
    let r = '';
    for (const [x, y] of [[160, 250], [480, 270], [1430, 290], [1450, 520], [1760, 230]]) r += G(P('M0 -40 L-50 0 L0 40 Z M50 -40 L0 0 L50 40 Z', ol('#FFFFFF', 6)), tr(x + Math.sin(t * 10) * 4, y, 0.8 * ob(rw)), { opacity: f(0.85 * rw) });
    o += K.view(cam, r, 1);
  }
  const kc = seg(t, M[14].word('type').t0 - 0.2, M[14].word('type').t0);
  if (kc > 0) o += K.view(cam, K.chatCommand(560, 220, ';undo all', K.typeProgress(t, M[14], 'undo', 'all'), { t, theme: 'admin', user: 'ADMIN', s: 1.0 }), 1);
  return o;
}
// 20. "Wait!"
function shotWait(t) {
  const cam0 = K.camKeys(t, [[b19, at(HX - 40, 600, 2.0)], [b19 + 0.12, at(HX - 60, 600, 2.45)], [b20, at(HX - 60, 600, 2.5)]], ease.out);
  const cam = withShake(cam0, t, [[b19 + 0.05, 0.3, 14]]);
  const k = ob(seg(t, b19, b19 + 0.2));
  const h = K.actor('you', t, { x: HX, y: HY, s: HS, turn: -0.5, armL: lerp(12, 92, k), armR: 20, lean: -6 * k, face: { name: 'scared', eyes: { look: [-0.9, -0.2] } }, volume: false }, { arms: false });
  return E.room(t, cam, {}, old(t, { armR: 120, face: 'happy' }, { arms: false }), h) + K.bang('WAIT!', 640, 260, seg(t, b19 + 0.02, b19 + 0.12), 120, -8, '#FF6A3D');
}
// 21. "Let me fix it. Myself. One by one." — the old man lowers his hand, the command backspaces; teleport flash
function shotFix(t) {
  const cam = drift(K.camKeys(t, [[b20, at(850, 560, 1.25)], [tOne, at(855, 590, 1.4)], [END, at(860, 600, 1.46)]]), t, 3);
  const lower = io(seg(t, tMyself - 0.2, tMyself + 0.5));
  const o2 = old(t, { armR: lerp(120, 24, lower), armL: 24, headRot: 6 * lower, face: lower > 0.5 ? { name: 'joy' } : { name: 'happy', eyes: { look: [0.8, 0] } } }, { arms: false });
  const out = seg(t, END - 0.55, END - 0.05);
  const hp = { x: HX, turn: -0.35, face: { name: 'determined', eyes: { look: [-0.7, -0.2] } }, headRot: -3 };
  let h = out < 0.6 ? hero(t, hp) : '';
  if (out > 0.2 && out < 0.6) h = G(h, null, { opacity: f(1 - (out - 0.2) / 0.4) });
  h += E.teleOut(out, HX, HY, HS);
  let o = E.room(t, cam, {}, o2, h);
  const prog = 1 - seg(t, tMyself, tOne + 0.2);
  if (prog > 0) o += K.view(cam, K.chatCommand(600, 250, ';undo all', prog, { t, theme: 'admin', user: 'ADMIN', s: 1.0 }), 1);
  o += white(seg(t, END - 0.3, END - 0.02));
  return o;
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [b1, shotArrive], [b2, shotFeeds], [b3, shotChair], [b4, shotGarage], [b5, shotTea], [b6, shotSold], [b7, shotHistory], [b8, shotHowOld],
  [b9, shotProud], [b10, shotDino], [b11, shotWants], [b12, shotGrow], [b13, shotDoor], [b14, shotExactly], [b15, shotLogs], [b16, shotSearch],
  [b17, shotFace], [b18, shotBattery], [b19, shotUndo], [b20, shotWait], [Infinity, shotFix],
];
function scene(t) {
  for (const [end, fn] of SHOTS) if (t < end) return fn(t);
  return shotFix(t);
}
function look(t) {
  if (t >= b9 && t < b10) return { grade: null, vignette: 0.5 };
  if (t >= b11 && t < b13) return { grade: null, vignette: 0.3 };
  if (t >= b1 && t < b2) return { grade: 'warm', vignette: 0.6 };
  return { grade: 'warm', vignette: 0.95 };
}

module.exports = { scene, look, beats: { b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17, b18, b19, b20, START, END } };
