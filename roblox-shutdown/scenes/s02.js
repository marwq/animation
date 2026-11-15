// SC 02 · THE BUILDER — Juno's attic workshop: Juno (hard hat, falls off her chair), Bubble Island (3 visits: her, the cat,
// Grandpa by accident), Grandpa Otto (soap weather, 100 keys, the door, the mop), Mom & Dad (games rot your brain),
// Dex (12,000 hours, NEVER fallen — clinging to the ladder, spawns on the floor), Pip (Elevator Simulator, Ding!, 41,000 rides).
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const SETS = require('./sets');
const { keyRing, mop } = require('../rig/cast');
const E2 = require('./s02_env');
const { camAt, pop, OUT, FULL, tr, shakeCam, shakes, nameCard, panel, tag, sticker, stool, junoSeated, tablet, gameIn, marks, dizzy, bubble, popFx, respawn, dingFx } = E2;

const START = K.V.scene('SC 02').start, END = K.V.scene('SC 03').start;
const l = {};
for (let i = 0; i <= 21; i++) l[i] = L('02.' + i);
const W = (id, w, n) => l[id].word(w, n).t0;

// ---------------------------------------------------------------- shot starts (all from the voice)
const tHi = START;
const tBuild = W(0, 'And') - 0.1;
const tHat = l[1].a - 0.08;
const tFall = W(1, 'Also') - 0.18;
const tNot = l[2].a - 0.05;
const tYears = W(2, 'For') - 0.1;
const tBub = l[3].a - 0.06;
const tInside = W(3, 'Islands') - 0.08;
const tFloat = W(3, 'You') - 0.08;
const tMaster = W(3, "It's", 1) - 0.08;
const tVisits = l[4].a - 0.06;
const tTrip = l[5].a - 0.06;
const tTripX = W(5, 'He') - 0.06, tGpa = tTripX + 0.34;
const tWeather = W(6, 'weather') - 0.15;
const tOtto = W(6, 'soap') - 0.08;
const tKeys = W(7, 'He', 1) - 0.08;
const tSecret = W(7, 'and') - 0.06;
const tDoors = l[8].a - 0.05;
const tMop = l[9].a - 0.06;
const tParents = l[10].a - 0.05;
const tRot = W(10, 'Dad', 1) - 0.08;
const tDex = l[11].a - 0.06;
const tBrag = l[12].a - 0.05;
const tNever = W(12, 'I') - 0.06;
const tAside = l[13].a - 0.06;
const tStairs = W(13, 'In', 1) - 0.06;
const tCheck = l[14].a - 0.06;
const tFloorA = l[15].a - 0.06;
const tFloorB = W(15, 'You') - 0.08;
const tPip = l[16].a - 0.06;
const tOne = W(16, 'He') - 0.08;
const tElev = l[17].a - 0.06;
const tDing1 = l[18].a - 0.06;
const tRides = l[19].a - 0.04;
const tButtons = W(19, 'He', 1) - 0.1;
const tDing2 = l[20].a - 0.06;
const tSigh = l[21].a - 0.1;
const tXmas = W(21, 'since') - 0.08;

const CUTS = [tBuild, tHat, tFall, tNot, tYears, tBub, tInside, tFloat, tMaster, tVisits, tTrip, tWeather, tOtto, tKeys, tSecret, tDoors, tMop, tParents, tRot, tDex, tBrag, tNever, tAside, tCheck, tFloorA, tFloorB, tPip, tOne, tElev, tDing1, tRides, tButtons, tDing2, tSigh];
const WHIPS = [tStairs, tBub];

const DEFS = `<defs>
<radialGradient id="s02spot" cx="0.5" cy="0.5" r="0.5"><stop offset="0.25" stop-color="#120820" stop-opacity="0"/><stop offset="1" stop-color="#120820" stop-opacity="0.82"/></radialGradient>
<radialGradient id="s02doorGlow" cx="0.5" cy="0.45" r="0.6"><stop offset="0" stop-color="#FFD86A" stop-opacity="0.85"/><stop offset="0.5" stop-color="#7A3AC8" stop-opacity="0.55"/><stop offset="1" stop-color="#1A0B2E" stop-opacity="1"/></radialGradient>
<linearGradient id="s02velvet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A1630"/><stop offset="1" stop-color="#4A0A1E"/></linearGradient>
<radialGradient id="s02museumSpot" cx="0.5" cy="0.4" r="0.6"><stop offset="0" stop-color="#FFF4C8" stop-opacity="0.45"/><stop offset="1" stop-color="#FFF4C8" stop-opacity="0"/></radialGradient>
<linearGradient id="s02gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE58A"/><stop offset="0.5" stop-color="#E0A21A"/><stop offset="1" stop-color="#FFD34D"/></linearGradient>
<radialGradient id="s02sepia" cx="0.5" cy="0.5" r="0.7"><stop offset="0.5" stop-color="#5A3A1A" stop-opacity="0"/><stop offset="1" stop-color="#3A220A" stop-opacity="0.75"/></radialGradient>
</defs>`;

// ---------------------------------------------------------------- set wrappers
function atticView(t, cam, opts, chars = '', extra = {}) {
  const Ls = SETS.attic.layers(t, opts);
  let o = view(cam, Ls.bg, 0.5) + view(cam, Ls.mid + (extra.behind || '') + chars + (extra.front || ''), 1) + view(cam, Ls.fg, 1.2);
  if (Ls.light) o += view(cam, Ls.light, 1);
  return o;
}
function hallView(t, cam, chars = '', extra = {}) {
  const Ls = SETS.atticStairs.layers(t, {});
  return view(cam, Ls.mid + (extra.behind || '') + (extra.charsBehindFg || ''), 1) + view(cam, Ls.fg, 1) + view(cam, chars + (extra.front || ''), 1) + view(cam, Ls.light, 1);
}
const JX = 880, JY = 1000, JS = 0.62; // Juno's standing mark in the attic

// ---------------------------------------------------------------- SC 02 shots
const junoCard = (t) => nameCard('JUNO', 'builder · age 11', seg(t, W(0, 'Juno') - 0.05, W(0, 'Juno') + 0.3), seg(t, tHat - 0.25, tHat), t, 90, 640, '#E9A50E');
function shotHi(t) {
  // wide attic; Juno pops up into frame and waves; the camera settles on her
  const cam = camKeys(t, [[tHi, camAt(960, 470, 1.18)], [tHi + 0.9, camAt(920, 580, 1.08)], [tBuild, camAt(900, 600, 1.12)]]);
  const jin = seg(t, tHi + 0.05, tHi + 0.42);
  const y = lerp(1560, JY, ease.outBack(jin));
  const land = bump(t, tHi + 0.36, tHi + 0.56);
  const tJ = W(0, 'Juno'), tE = W(0, 'eleven');
  const pose = { x: JX, y, s: JS, sy: 1 - 0.1 * land, sx: 1 + 0.1 * land };
  if (t < tJ) Object.assign(pose, { armR: 150 + 22 * Math.sin(t * 16), armL: 14, face: 'joy' });
  else if (t < tE) Object.assign(pose, { armR: -18, armL: 10, face: 'happy', lean: -3 });
  else Object.assign(pose, { armR: 150, armL: 150 * ease.out(seg(t, tE, tE + 0.2)) - 0, face: 'excited' });
  const juno = actor('juno', t, pose, { arms: false, energy: 1.2 });
  let o = atticView(t, cam, { cat: 'bed', juice: 2 }, juno);
  o += sticker('11', 'YEARS', 1460, 360, seg(t, tE, tE + 0.25), t);
  o += junoCard(t);
  o += C.whiteFlash(1 - seg(t, START, START + 0.35));
  // "24 HOURS EARLIER" VHS-style label (the rewind just ended)
  const lk = seg(t, START, START + 0.2) * (1 - seg(t, START + 2.4, START + 2.7));
  if (lk > 0) o += S.g(S.rect(-10, -48, 470, 70, 10, { fill: '#000', opacity: 0.45 }) + TF('▶ PLAY   24 HRS EARLIER', 12, 0, 36, '#FFFFFF', { 'text-anchor': 'start', ...OUT(6) }), 'translate(70 110)', { opacity: f(lk) });
  return o;
}

function shotBuild(t) {
  // smash-zoom: fists up — BUILDER!
  const tb = W(0, 'builder');
  const cam = t < tb ? camKeys(t, [[tBuild, camAt(JX, 640, 1.35)], [tb, camAt(JX, 630, 1.45)]]) : camKeys(t, [[tb, camAt(JX, 600, 1.85)], [tb + 0.2, camAt(JX, 610, 1.7)], [tHat, camAt(JX, 610, 1.74)]]);
  const c2 = shakeCam(cam, t, tb, 0.35, 14);
  const up = ease.outBack(seg(t, tb - 0.1, tb + 0.12));
  const juno = actor('juno', t, { x: JX, y: JY, s: JS, armL: lerp(20, 155, up), armR: lerp(20, 155, up), face: t > tb - 0.05 ? 'excited' : 'happy', sy: 1 + 0.05 * bump(t, tb - 0.05, tb + 0.2) }, { arms: false });
  let o = atticView(t, c2, { cat: 'bed', juice: 2 }, juno, { behind: t > tb ? K.rays(JX, 560, 16, 1200, '#FFF6C8', 0.28, t * 25) : '' });
  o += K.bang('BUILDER!', 1420, 340, seg(t, tb, tb + 0.14), 130, -8, '#FFD21F');
  o += junoCard(t);
  return o;
}

function shotHat(t) {
  // close-up: knuckles on the hard hat (TOK! TOK!), then a wise finger — "Builders wear hard hats."
  const tH1 = W(1, 'hard'), tH2 = W(1, 'hat'), tRule = W(1, 'Builders');
  const cam = camKeys(t, [[tHat, camAt(JX + 10, 520, 2.15)], [tRule, camAt(JX + 20, 520, 2.3)], [tFall, camAt(JX + 30, 540, 2.45)]]);
  const knock = Math.max(bump(t, tH1 - 0.05, tH1 + 0.12), bump(t, tH2 - 0.05, tH2 + 0.12));
  let pose;
  if (t < tRule - 0.1) pose = { armR: 165 - 12 * knock, armL: 10, headRot: 6 + 5 * knock, headY: 4 * knock, face: 'happy' };
  else pose = { armL: 150 + 6 * Math.sin(t * 5), armR: 10, headRot: -4 + 3 * Math.sin(t * 6), face: 'smug' };
  const juno = actor('juno', t, { x: JX, y: JY, s: JS, ...pose }, { arms: false, energy: 0.6 });
  let o = atticView(t, cam, { cat: 'bed', juice: 2 }, juno);
  for (const [tk, x, y, r] of [[tH1, 1250, 230, -10], [tH2, 1330, 330, 8]]) {
    const k = seg(t, tk, tk + 0.1) * (1 - seg(t, tk + 0.5, tk + 0.7));
    o += K.bang('TOK!', x, y, k, 110, r, '#FFFFFF');
    if (t > tk && t < tk + 0.3) o += C.burst(1130, 330, seg(t, tk, tk + 0.3), '#FFE14D');
  }
  // sticky-note rule
  const kr = seg(t, tRule, tRule + 0.25);
  if (kr > 0) {
    const n = S.rect(-170, -120, 340, 240, 6, ol('#FFE36E', 6)) + S.rect(-40, -136, 80, 30, 4, { fill: '#F4F1E6', opacity: 0.85 }) + T('RULE #1', 0, -40, 54, '#E8453C') + TF('BUILDERS WEAR', 0, 20, 34, '#2A2A33') + TF('HARD HATS', 0, 66, 40, '#2A2A33');
    o += S.g(n, `translate(500 380) rotate(${f(-8 + 2 * Math.sin(t * 3))}) scale(${f(pop(kr))})`);
  }
  return o;
}

function shotFall(t) {
  // wide: Juno on her stool, waving... the stool tips back on "fall" — BONK, legs in the air, dizzy stars
  const tF = W(1, 'fall'), tImp = tF + 0.42, tLot = W(1, 'lot');
  const cam = shakeCam(camKeys(t, [[tFall, camAt(1000, 610, 1.3)], [tF, camAt(1010, 620, 1.25)], [tNot, camAt(1080, 660, 1.35)]]), t, tImp, 0.45, 18);
  const u = ease.in(seg(t, tF, tImp));
  const bounce = bump(t, tImp, tImp + 0.22);
  const ang = 86 * u - 6 * bounce;
  const sx = 900, piv = [sx + 62, 880];
  const wave = t < tF ? 150 + 20 * Math.sin(t * 15) : lerp(150, 175, u);
  const legs = t < tF ? { legL: 86, kneeL: 88, legR: 80, kneeR: 92 } : { legL: 86 + 40 * u + 10 * Math.sin(t * 20) * (t > tImp ? 1 : 0), kneeL: 88 - 60 * u, legR: 80 + 50 * u, kneeR: 92 - 70 * u };
  const face = t < tF ? 'happy' : t < tImp ? 'scream' : t < tLot ? 'dizzy' : { name: 'joy' };
  const juno = actor('juno', t, { x: 930, y: 902, s: 0.5, view: 'side', ...legs, armL: t < tF ? 20 : 170 * u, armR: t > tLot ? 150 : wave, face }, { arms: false });
  const grp = S.g(stool(sx, 880) + juno, `rotate(${f(ang)} ${piv[0]} ${piv[1]})`);
  let fx = '';
  if (t > tImp) fx += C.dust(980, 870, tImp, t) + dizzy(1350, 720, t, seg(t, tImp, tImp + 0.2));
  let o = atticView(t, cam, { cat: 'bed', juice: 2, stool: false }, grp, { front: fx });
  o += K.bang('BONK!', 1420, 420, seg(t, tImp, tImp + 0.1) * (1 - seg(t, tImp + 0.7, tImp + 0.9)), 140, 8, '#FF7A59');
  return o;
}

function houseCard(cross, k, t) {
  let o = S.rect(-210, -190, 420, 380, 30, ol('#FFFFFF', 8)) + S.rect(-190, -170, 380, 340, 22, { fill: '#DDEBFF' });
  o += S.path('M-110 40 L-110 -40 L0 -120 L110 -40 L110 40 Z', ol('#FFB98A', 7)) + S.rect(-30, -20, 60, 60, 4, ol('#8A5530', 6)) + S.rect(50, -30, 40, 40, 4, ol('#9FE2FF', 5));
  o += S.path('M-130 50 L130 50', ln(8)) + TF('HOUSES', 0, 130, 50, '#2A2A33');
  if (cross > 0) {
    const a = clamp(cross * 2, 0, 1), b = clamp(cross * 2 - 1, 0, 1);
    o += S.path(`M-150 -150 L${f(-150 + 300 * a)} ${f(-150 + 300 * a)}`, ln(26, '#E8243C')) + (b > 0 ? S.path(`M150 -150 L${f(150 - 300 * b)} ${f(-150 + 300 * b)}`, ln(26, '#E8243C')) : '');
  }
  return S.g(o, `scale(${f(pop(k))}) rotate(${f(-5 + (cross > 0 ? -6 * cross : 0))})`);
}
function gameCard(k, t) {
  let o = S.rect(-210, -190, 420, 380, 30, ol('#FFFFFF', 8)) + S.rect(-190, -170, 380, 340, 22, { fill: '#FFE3A3' });
  o += S.g(SETS.avatar(0, 0, 1.15, t, { who: 'juno', pose: 'wave' }), 'translate(-70 70)');
  o += S.g(S.rect(-80, -42, 160, 84, 40, ol('#5A6478', 6)) + S.circle(-42, 0, 14, { fill: '#151515' }) + S.path('M30 -12 L30 12 M18 0 L42 0', ln(8, '#FFFFFF')) + S.circle(54, -18, 7, { fill: '#FF5A5A' }), 'translate(80 -40) rotate(12)');
  o += TF('GAMES!', 0, 130, 54, '#2A2A33');
  o += S.circle(150, -150, 46, ol('#3BD16F', 7)) + S.path('M126 -150 L144 -130 L176 -170', ln(12, '#FFFFFF'));
  return S.g(o, `scale(${f(pop(k))}) rotate(${f(5 - 3 * Math.sin(t * 4))})`);
}
function shotNot(t) {
  // Juno pops back up (hat a bit crooked): "Not houses." ✗  "Games." ✓
  const tHo = W(2, 'houses'), tGa = W(2, 'Games');
  const cam = camKeys(t, [[tNot, camAt(1000, 600, 1.3)], [tYears, camAt(1010, 590, 1.36)]]);
  const up = ease.outBack(seg(t, tNot, tNot + 0.3));
  const juno = actor('juno', t, { x: 760, y: lerp(1500, JY, up), s: JS, armR: t < tGa ? 150 : 40, armL: t < tGa ? 10 : 150, headRot: -7, face: t < tGa ? 'determined' : 'excited' }, { arms: false });
  let o = atticView(t, cam, { cat: 'bed', juice: 2 }, juno);
  const ko = seg(t, tGa - 0.05, tGa + 0.2);
  o += S.g(houseCard(seg(t, tHo + 0.05, tHo + 0.35), seg(t, tNot + 0.15, tNot + 0.4) * (1 - ko), t), `translate(${f(1400 - 300 * ko)} 430)`);
  o += S.g(gameCard(ko, t), 'translate(1400 430)');
  return o;
}

function shotYears(t) {
  // time-lapse: days and nights flicker by, juice boxes pile up, Juno builds, sleeps, stretches — YEAR 1 → 3
  const u = seg(t, tYears, tBub);
  const cam = camKeys(t, [[tYears, camAt(900, 560, 1.12)], [tBub, camAt(860, 560, 1.28)]], ease.linear);
  const ph = Math.floor((t - tYears) * 4.2);
  const time = ['day', 'evening', 'night'][ph % 3];
  const act = (Math.floor(ph / 3) + ph) % 4;
  const juice = Math.round(lerp(2, 12, u));
  const cat = time === 'night' ? 'keyboard' : 'bed';
  let jun;
  if (act === 2 && time === 'night') jun = junoSeated(t, { typing: 0, face: { name: 'sleepy' }, pose: { lean: -38, armL: 95, armR: 88, headRot: -10 } });
  else if (act === 1) jun = junoSeated(t, { typing: 0, face: 'joy', pose: { armL: 170, armR: 160, lean: 6 } });
  else jun = junoSeated(t, { typing: 1, face: time === 'night' ? 'determined' : 'happy' });
  let o = atticView(t, cam, { time, juice, cat, stoolX: 900 }, jun);
  // fast-forward overlay
  o += S.g(S.path('M0 -30 L36 0 L0 30 Z M40 -30 L76 0 L40 30 Z', ol('#FFFFFF', 5)), 'translate(1700 110)', { opacity: f(0.6 + 0.4 * Math.sin(t * 12)) });
  const ty = [W(2, 'three'), W(2, 'building'), W(2, 'Roblox')];
  const yr = t < ty[1] ? 1 : t < ty[2] ? 2 : 3;
  const tk = t < ty[1] ? ty[0] : t < ty[2] ? ty[1] : ty[2];
  o += tag(`YEAR ${yr}`, 1560, 230, seg(t, tk, tk + 0.18), '#FFD21F', -6, 70);
  return o;
}

// ---------------------------------------------------------------- Bubble Island
function bubTitle(k, t) {
  if (k <= 0) return '';
  let o = '';
  const word = (txt, y, size, col, stroke) => T(txt, 0, y, size, col, { stroke, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', 'letter-spacing': 4 });
  o += S.g(word('BUBBLE', -20, 200, '#FFFFFF', '#FF5AA8') + T('BUBBLE', 0, -20, 200, 'none', { stroke: '#151515', 'stroke-width': 6, 'letter-spacing': 4 }), `rotate(-4) translate(0 ${f(Math.sin(t * 3) * 8)})`);
  o += S.g(word('ISLAND', 160, 170, '#FFE14D', '#2F6FD6') + T('ISLAND', 0, 160, 170, 'none', { stroke: '#151515', 'stroke-width': 6, 'letter-spacing': 4 }), `rotate(3) translate(0 ${f(Math.sin(t * 3 + 1) * 8)})`);
  for (let i = 0; i < 7; i++) o += bubble(-420 + i * 140, -190 + 30 * Math.sin(t * 2 + i), 22 + (i % 3) * 10);
  o += K.F.sparkle(430, -150, 40) + K.F.sparkle(-450, 140, 30);
  return S.g(o, `translate(960 450) scale(${f(pop(k))})`);
}
function shotBub(t) {
  // into the game: pull out over the islands, the title bubbles up on "Bubble"
  const tB = W(3, 'Bubble');
  const cam = camKeys(t, [[tBub, camAt(720, 560, 1.6)], [tB, camAt(900, 520, 1.08)], [tInside, camAt(920, 520, 1.02)]]);
  let o = view(cam, SETS.bubbleIsland(t, {}), 1);
  o += bubTitle(seg(t, tB, tB + 0.3) * (1 - seg(t, tInside - 0.3, tInside)), t);
  return o;
}
function chalk(x1, y1, x2, y2, txt, k, tx, ty) {
  if (k <= 0) return '';
  const u = clamp(k * 1.4, 0, 1);
  const ex = lerp(x1, x2, u), ey = lerp(y1, y2, u);
  let o = S.path(`M${f(x1)} ${f(y1)} L${f(ex)} ${f(ey)}`, ln(16)) + S.path(`M${f(x1)} ${f(y1)} L${f(ex)} ${f(ey)}`, ln(9, '#FFFFFF'));
  if (u >= 1) { const a = Math.atan2(y2 - y1, x2 - x1); o += S.path(`M${f(x2 - 34 * Math.cos(a - 0.5))} ${f(y2 - 34 * Math.sin(a - 0.5))} L${f(x2)} ${f(y2)} L${f(x2 - 34 * Math.cos(a + 0.5))} ${f(y2 - 34 * Math.sin(a + 0.5))}`, ln(9, '#FFFFFF')); }
  o += S.g(T(txt, 0, 0, 64, '#FFFFFF', { stroke: '#2F6FD6', 'stroke-width': 12, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }), `translate(${f(tx)} ${f(ty)}) rotate(-5) scale(${f(pop(k * 1.5))})`);
  return o;
}
function shotInside(t) {
  // push into the house bubble; blueprint-chalk labels: ISLAND... inside BUBBLE
  const tI = W(3, 'Islands'), tIn = W(3, 'inside');
  const cam = camKeys(t, [[tInside, camAt(760, 560, 1.15)], [tFloat, camAt(720, 600, 1.55)]]);
  const b = SETS.bubbleIsland.ISLANDS[0];
  const bob = SETS.bubbleIsland.bob(0, t);
  let w = SETS.bubbleIsland(t, {});
  w += chalk(1180, 760, 860, b.top + bob + 30, 'ISLAND', seg(t, tI, tI + 0.4), 1240, 820);
  w += chalk(1160, 330, 720 + 272 * 0.72, b.y + bob - 272 * 0.69, 'BUBBLE', seg(t, tIn, tIn + 0.4), 1230, 300);
  if (t > tIn) w += popFx(720 + 272 * 0.72, b.y + bob - 272 * 0.69, seg(t, tIn + 0.3, tIn + 0.7), 50);
  return view(cam, w, 1);
}
function shotFloat(t) {
  // the avatar floats bubble to bubble; the camera rides along
  const IS = SETS.bubbleIsland.ISLANDS, bob = SETS.bubbleIsland.bob;
  const stand = (i, tt) => [IS[i].x + (i === 0 ? 120 : 0), IS[i].top + bob(i, tt)];
  const h1 = [W(3, 'float') - 0.1, W(3, 'one') + 0.1], h2 = [W(3, 'next') - 0.25, tMaster - 0.15];
  let x, y, pose = 'stand', rot = 0;
  const arc = (a, b, u) => [lerp(a[0], b[0], ease.inOut(u)), lerp(a[1], b[1], ease.inOut(u)) - Math.sin(u * Math.PI) * 260];
  if (t < h1[0]) [x, y] = stand(2, t);
  else if (t < h1[1]) { const u = seg(t, h1[0], h1[1]); [x, y] = arc(stand(2, t), stand(0, t), u); pose = 'jump'; rot = 8 * Math.sin(u * Math.PI); }
  else if (t < h2[0]) [x, y] = stand(0, t);
  else if (t < h2[1]) { const u = seg(t, h2[0], h2[1]); [x, y] = arc(stand(0, t), stand(1, t), u); pose = 'jump'; rot = -8 * Math.sin(u * Math.PI); }
  else [x, y] = stand(1, t);
  // camera: rides along, lagging a little behind, half of the hop height
  const g0 = (tt) => { if (tt < h1[0]) return stand(2, tt); if (tt < h1[1]) { const u = seg(tt, h1[0], h1[1]); const a = arc(stand(2, tt), stand(0, tt), u); return [a[0], a[1] + Math.sin(u * Math.PI) * 130]; } if (tt < h2[0]) return stand(0, tt); if (tt < h2[1]) { const u = seg(tt, h2[0], h2[1]); const a = arc(stand(0, tt), stand(1, tt), u); return [a[0], a[1] + Math.sin(u * Math.PI) * 130]; } return stand(1, tt); };
  const cp = g0(t - 0.12);
  const cam = camAt(cp[0], cp[1] - 110, 1.45 + 0.05 * Math.sin((t - tFloat) * 1.3));
  let w = SETS.bubbleIsland(t, {});
  // trail of tiny bubbles behind the avatar
  if (pose === 'jump') for (let i = 1; i <= 5; i++) w += bubble(x - i * 26 * Math.sign(1), y - 60 + i * 14 + Math.sin(t * 8 + i) * 8, 8 + i * 2);
  w += SETS.avatar(x, y, 1.5, t, { who: 'juno', pose, rot });
  return view(cam, w, 1);
}
function goldFrame(w, h) {
  let o = S.rect(-w / 2 - 70, -h / 2 - 70, w + 140, h + 140, 18, ol('url(#s02gold)', 10)) + S.rect(-w / 2 - 40, -h / 2 - 40, w + 80, h + 80, 10, { fill: 'none', stroke: '#B97A0E', 'stroke-width': 8 });
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) o += S.circle(sx * (w / 2 + 50), sy * (h / 2 + 50), 34, ol('#FFE58A', 6)) + S.circle(sx * (w / 2 + 50), sy * (h / 2 + 50), 14, { fill: '#E0A21A' });
  o += S.ellipse(0, -h / 2 - 62, 90, 30, ol('#FFE58A', 6)) + S.ellipse(0, h / 2 + 62, 90, 30, ol('#FFE58A', 6));
  return o;
}
function shotMaster(t) {
  // museum: the game hangs in a gold frame, velvet ropes, plaque; Juno the curator glows with pride
  const tM = W(3, 'masterpiece');
  const cam = camKeys(t, [[tMaster, camAt(960, 430, 2.4)], [tM, camAt(980, 500, 1.15)], [tVisits, camAt(990, 510, 1.08)]]);
  const FW = 1000, FH = 562;
  let w = S.rect(-800, -600, 3520, 1520, 0, { fill: 'url(#s02velvet)' });
  for (let x = -760; x < 2700; x += 120) w += S.rect(x, -600, 60, 1520, 0, { fill: '#000', opacity: 0.06 });
  w += S.rect(-800, 900, 3520, 600, 0, { fill: '#5A3A2A' }) + S.rect(-800, 896, 3520, 14, 0, { fill: '#2A1A12' });
  const cid = S.uid('s02mf');
  w += S.g(goldFrame(FW, FH) + S.clipDef(cid, S.rect(-FW / 2, -FH / 2, FW, FH)) + S.g(SETS.frameIn(SETS.bubbleIsland(t, {}), FW, FH), null, { 'clip-path': `url(#${cid})` }) + S.rect(-FW / 2, -FH / 2, FW, FH, 0, { fill: 'none', stroke: '#151515', 'stroke-width': 8 }), 'translate(900 420)');
  w += S.rect(-800, -600, 3520, 1600, 0, { fill: 'url(#s02museumSpot)' });
  w += S.g(S.rect(-190, -40, 380, 80, 10, ol('#E0A21A', 6)) + T('MASTERPIECE', 0, 10, 46, '#3A2410') + TF('Juno, age 11', 0, 34, 18, '#3A2410'), 'translate(900 840)');
  // velvet rope posts
  for (const px of [380, 1420]) w += S.rect(px - 14, 760, 28, 200, 8, ol('#E0A21A', 5)) + S.circle(px, 752, 22, ol('#FFE58A', 5)) + S.ellipse(px, 960, 50, 14, ol('#B97A0E', 5));
  w += S.path('M380 790 Q900 900 1420 790', ln(26)) + S.path('M380 790 Q900 900 1420 790', ln(16, '#C8102E'));
  const proud = bump(t, tM - 0.1, tM + 0.9);
  w += actor('juno', t, { x: 1620, y: 1000, s: 0.58, turn: -0.4, armR: 18, armL: 120 + 30 * proud, lean: -4, face: t > tM ? { name: 'joy' } : 'smug', headRot: -6 }, { arms: false });
  if (t > tM) w += K.sparkles([[420, 160, 34], [1380, 140, 28], [1500, 620, 22], [300, 660, 26]], t);
  return view(cam, w, 1);
}
function tumbleweed(x, y, r, rot) {
  let d = '';
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; d += `M${f(Math.cos(a) * r * 0.2)} ${f(Math.sin(a) * r * 0.2)} Q${f(Math.cos(a + 1) * r)} ${f(Math.sin(a + 1) * r)} ${f(Math.cos(a + 2.2) * r * 0.9)} ${f(Math.sin(a + 2.2) * r * 0.9)} `; }
  return S.g(S.circle(0, 0, r, { fill: 'none', stroke: '#8A6A3A', 'stroke-width': 7 }) + S.path(d, ln(5, '#B08A4A')) + S.path(d, { fill: 'none', stroke: '#6A4A1A', 'stroke-width': 2 }), `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
}
function shotVisits(t) {
  // smash-zoom on VISITS: 3 — a tumbleweed rolls by, crickets
  const t3 = W(4, 'three');
  const cam0 = t < t3 ? camKeys(t, [[tVisits, camAt(900, 520, 1.0)], [t3, camAt(500, 330, 1.4)]]) : camKeys(t, [[t3, camAt(330, 150, 3.1)], [t3 + 0.15, camAt(340, 170, 2.6)], [tTrip, camAt(360, 180, 2.5)]]);
  const cam = shakeCam(cam0, t, t3, 0.35, 16);
  let w = SETS.bubbleIsland(t, {});
  if (t > t3) {
    w += S.rect(36, 32, 360, 86, 26, { fill: 'none', stroke: '#FF5A6E', 'stroke-width': 8, opacity: f(0.5 + 0.5 * Math.sin(t * 14)) });
    const u = seg(t, t3 + 0.1, tTrip);
    w += tumbleweed(lerp(-80, 760, u), 300 - Math.abs(Math.sin(u * 9)) * 40, 38, u * 900);
  }
  let o = view(cam, w, 1);
  if (t > t3 + 0.2) o += TF('*chirp*  *chirp*', 1420, 860, 60, '#FFFFFF', { ...OUT(10), opacity: f(0.6 + 0.4 * Math.sin(t * 9)) });
  return o;
}

// ---------------------------------------------------------------- the three visitors
function bgBlue(t) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1F4E9E' });
  let g = '';
  for (let x = 0; x < 1920; x += 60) g += `M${x} 0 L${x} 1080 `;
  for (let y = 0; y < 1080; y += 60) g += `M0 ${y} L1920 ${y} `;
  return o + S.path(g, ln(2, '#FFFFFF', 0.12));
}
function gpaTabletPose(t, extra = {}) {
  // Grandpa holding his tablet at arm's length, squinting (body-space props)
  const d = 0.5 + 0.5 * Math.sin(t * 2.6);
  const arm = lerp(52, 84, d);
  const [hx, hy] = A.hand(arm, 1);
  const scr = gameIn(SETS.bubbleIsland(t, { hud: false }));
  return { armR: arm, armL: 12, turn: 0.25, face: { name: 'confused', eyes: { upper: 0.55, look: [0.6, 0] }, fx: [] }, props: [{ svg: tablet(hx + 40, hy - 70, 0.62, -8, scr), layer: 'front' }], ...extra };
}
function shotTrip(t) {
  // "VISITOR LOG": three panels slam in on each "One" — me / my cat / Grandpa (by accident); the third grows to full frame
  const t1 = W(5, 'One'), t2 = W(5, 'One', 1), t3 = W(5, 'one', 2), tAcc = W(5, 'accident');
  const grow = ease.inOut(seg(t, tTripX, tGpa));
  let o = bgBlue(t);
  o += T('VISITOR LOG', 960, 130, 96, '#FFFFFF', OUT(12));
  const n = t < t1 ? 0 : t < t2 ? 1 : t < t3 ? 2 : 3;
  o += T(`${n}/3`, 1640, 130, 80, '#FFD21F', OUT(10));
  const PW = 540, PH = 640, PY = 210;
  // 1: Juno points at herself
  const p1 = SETS.attic(t, { cat: 'bed' }) + actor('juno', t, { x: JX, y: JY, s: JS, armR: -24, armL: 12, face: 'joy', headRot: 4 }, { arms: false });
  o += panel(80, PY, PW, PH, p1, seg(t, t1 - 0.05, t1 + 0.2), { focus: [JX, 640], zoom: 1.55, from: 'left', rot: -2 });
  o += tag('#1 ME', 80 + PW / 2, PY + PH - 10, seg(t, t1 + 0.1, t1 + 0.3), '#FFD21F', -5);
  // 2: the cat strolls across the keyboard
  const ck = seg(t, t2, t2 + 1.2);
  const p2 = SETS.attic(t, { cat: false }) + SETS.cat(lerp(560, 690, ck), 588, 0.75, t, { pose: 'sit' }) + K.F.markText('asdfjkl;', 680, 400, 40, -6, '#FFFFFF');
  o += panel(690, PY, PW, PH, p2, seg(t, t2 - 0.05, t2 + 0.2), { focus: [640, 470], zoom: 2.3, from: 'top', rot: 1.5 });
  o += tag('#2 MY CAT', 690 + PW / 2, PY + PH - 10, seg(t, t2 + 0.1, t2 + 0.3), '#7CF7FF', 4);
  // 3: Grandpa squints at the tablet (grows into the next shot)
  const p3 = hallBg(t) + actor('grandpa', t, { x: 620, y: 1000, s: 0.62, ...gpaTabletPose(t) }, { arms: false });
  const x3 = lerp(1300, 0, grow), y3 = lerp(PY, 0, grow), w3 = lerp(PW, 1920, grow), h3 = lerp(PH, 1080, grow);
  const p3o = panel(x3, y3, w3, h3, p3, seg(t, t3 - 0.05, t3 + 0.2), { focus: [lerp(640, 680, grow), lerp(600, 600, grow)], zoom: lerp(1.5, 1.35, grow), from: 'right', rot: lerp(-1.5, 0, grow), bw: lerp(10, 0, grow) });
  if (grow < 1) {
    o += p3o;
    o += tag('#3 GRANDPA', x3 + w3 / 2, y3 + h3 - 10, seg(t, t3 + 0.1, t3 + 0.3) * (1 - grow), '#FFB13B', -3);
    const ka = seg(t, tAcc, tAcc + 0.15) * (1 - grow);
    if (ka > 0) o += S.g(S.rect(-230, -56, 460, 112, 14, { fill: '#FFF8EC', stroke: '#E8243C', 'stroke-width': 12 }) + T('BY ACCIDENT', 0, 24, 66, '#E8243C'), `translate(${f(x3 + w3 / 2)} ${f(y3 + h3 * 0.66)}) rotate(-14) scale(${f(lerp(2.2, 1, ease.out(ka)))})`, { opacity: f(clamp(ka * 3, 0, 1)) });
  } else o = p3o;
  return o;
}
const hallBg = (t) => { const Ls = SETS.atticStairs.layers(t, {}); return Ls.mid + Ls.fg; };

function shotGpa(t) {
  // hallway: Grandpa squints at the tablet; calls up the ladder "Juno, ...", back to the screen
  const tJ = W(6, 'Juno'), tWhy = W(6, 'why');
  const cam = camKeys(t, [[tGpa, camAt(680, 600, 1.35)], [tWeather, camAt(700, 560, 1.55)]]);
  const up = bump(t, tJ - 0.15, tWhy + 0.1);
  const pose = gpaTabletPose(t, up > 0.3 ? { face: { name: 'confused', eyes: { look: [0.9, -1] }, fx: [] }, headRot: -10 * up } : {});
  const g = actor('grandpa', t, { x: 620, y: 1000, s: 0.62, ...pose }, { arms: false });
  return hallView(t, cam, g);
}
function shotWeather(t) {
  // tablet POV: Bubble Island (sticky note on the bezel: "WEATHER →"); on "soap?" bubbles float out of the screen
  const tSo = W(6, 'soap');
  const cam = camKeys(t, [[tWeather, { zoom: 1, x: 0, y: 0 }], [tOtto, { zoom: 1.08, x: 0, y: 10 }]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: '#D9A066' }) + S.rect(-800, -600, 3520, 1250, 0, { fill: 'url(#setsWallpaper)' });
  const scr = (ww, hh) => SETS.frameIn(SETS.bubbleIsland(t, { visits: 3 }), ww, hh) + S.rect(-ww / 2, -hh / 2, ww, 26, 0, { fill: '#000', opacity: 0.5 }) + TF('9:41', -ww / 2 + 30, -hh / 2 + 19, 16, '#FFFFFF') + TF('Bubble Island', 0, -hh / 2 + 19, 16, '#FFFFFF');
  w += tablet(960, 520, 2.55, -2, scr);
  // grandpa's sticky note
  w += S.g(S.rect(-110, -70, 220, 140, 6, ol('#FFE36E', 6)) + TF('WEATHER', 0, -10, 40, '#2A2A33') + T('→', 0, 50, 60, '#E8453C'), 'translate(1470 850) rotate(8)');
  // giant thumb on the bezel
  w += S.g(S.rect(-70, -120, 140, 260, 70, ol('#EDC1A0', 7)) + S.path('M-40 -90 Q0 -110 40 -90', ln(5, '#D9A683')), 'translate(420 820) rotate(-25)');
  if (t > tSo - 0.1) for (let i = 0; i < 9; i++) {
    const k = t - tSo + 0.1 - i * 0.05;
    if (k > 0) w += bubble(960 + (hash(i * 3.1) - 0.5) * 900, 640 - k * (500 + 300 * hash(i)), 30 + 60 * hash(i * 7.3) * Math.min(1, k * 3));
  }
  let o = view(cam, w, 1);
  // squint: eyelids
  const sq = 0.5 + 0.5 * Math.sin(t * 2.4);
  o += S.rect(0, -10, 1920, 120 + 60 * sq, 0, { fill: '#2A1A12', opacity: 0.85 }) + S.rect(0, 970 - 60 * sq, 1920, 140, 0, { fill: '#2A1A12', opacity: 0.85 });
  return o;
}
function shotOtto(t) {
  // a bubble pops on Grandpa's nose — "That's Grandpa Otto" (name card); he waves
  const tPop = tOtto + 0.32, tLives = W(7, 'lives');
  const cam = camKeys(t, [[tOtto, camAt(640, 470, 2.0)], [tPop + 0.3, camAt(420, 520, 1.6)], [tKeys, camAt(380, 560, 1.4)]]);
  const blink = bump(t, tPop, tPop + 0.3);
  const lowered = ease.inOut(seg(t, tPop + 0.4, tPop + 0.9));
  const face = blink > 0.2 ? { name: 'oof', eyes: { type: 'closed' } } : t > tPop + 0.4 ? 'happy' : { name: 'confused', fx: [] };
  const wave = t > tLives ? 150 + 18 * Math.sin(t * 14) : lerp(48, 12, lowered);
  const [hx, hy] = A.hand(lerp(48, 12, lowered), 1);
  const scr = gameIn(SETS.bubbleIsland(t, { hud: false }));
  const props = lowered < 1 && t < tLives ? [{ svg: tablet(hx + 40, hy - 70 + 200 * lowered, 0.62, -8, scr), layer: 'front' }] : [];
  const g = actor('grandpa', t, { x: 620, y: 1000, s: 0.62, armR: t > tLives ? 12 : lerp(48, 12, lowered), armL: t > tLives ? wave : 12, face, props }, { arms: false });
  // bubble drifting to the nose then popping
  const nose = [620, 1000 - 0.62 * 650];
  let fx = '';
  const bk = seg(t, tOtto - 0.1, tPop);
  if (bk < 1) fx += bubble(lerp(820, nose[0] + 10, ease.out(bk)), lerp(560, nose[1], ease.inOut(bk)), 46);
  fx += popFx(nose[0], nose[1], seg(t, tPop, tPop + 0.3), 50);
  let o = hallView(t, cam, g, { front: fx });
  o += K.bang('POP!', 1100, 300, seg(t, tPop, tPop + 0.1) * (1 - seg(t, tPop + 0.5, tPop + 0.6)), 110, -8, '#BFEFFF');
  const tN = W(7, 'Grandpa');
  o += nameCard('GRANDPA OTTO', 'lives with us · carries keys', seg(t, tN - 0.05, tN + 0.3), seg(t, tKeys - 0.25, tKeys), t, 90, 640, '#C48A26');
  return o;
}
// a big bunch of keys for the close-up (world space; hangs from (x, y)); proportions read well at high zoom
function keyBunch(x, y, s, swing, t) {
  let o = S.rect(-6, -40, 12, 44, 4, ol('#7A5A3A', 3));
  const n = 17, R = 30;
  let back = '', front = '';
  for (let i = 0; i < n; i++) {
    const a = (-75 + (150 * i) / (n - 1) + Math.sin(t * 19 + i * 1.3) * swing * 0.15) * Math.PI / 180;
    const gold = i === 9;
    const col = gold ? '#FFC93C' : ['#D9DEE6', '#C9A86A', '#B9C2D0', '#E3E6EE'][i % 4];
    const len = 70 + (i % 4) * 14;
    let k = S.circle(0, 0, 13, ol(col, 3)) + S.circle(0, 0, 4.5, { fill: '#2A2A33' }) + S.rect(-5, 11, 10, len, 3, ol(col, 3));
    k += S.rect(4, 11 + len - 26, 12, 8, 2, ol(col, 2.5)) + S.rect(4, 11 + len - 12, 9, 8, 2, ol(col, 2.5)) + S.path(`M-2 16 L-2 ${10 + len}`, ln(2, '#FFFFFF', 0.6));
    const g = S.g(k, `translate(${f(Math.sin(a) * R)} ${f(R + Math.cos(a) * R)}) rotate(${f((-a * 180) / Math.PI)})`);
    if (i % 2) back += g; else front += g;
  }
  o += back + S.circle(0, R, R, { fill: 'none', stroke: '#151515', 'stroke-width': 10 }) + S.circle(0, R, R, { fill: 'none', stroke: '#C9CED8', 'stroke-width': 5 }) + front;
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)}) rotate(${f(swing)})`);
}
function shotKeys(t) {
  // extreme close-up: a ring of (far too many) keys jingling; the counter rolls to 100; the golden key twinkles
  const tC = W(7, 'carries'), tOne = W(7, 'one'), tKy = W(7, 'keys');
  const cam = camKeys(t, [[tKeys, camAt(1010, 830, 3.0)], [tSecret, camAt(1015, 845, 3.4)]]);
  const jing = Math.max(bump(t, tC - 0.05, tC + 0.6), bump(t, tKy - 0.05, tKy + 0.7)) * 1 + 0.15;
  const sw = 28 * jing * Math.sin(t * 22);
  const g = actor('grandpa', t, { x: 960, y: 1000, s: 0.62, keys: false, armR: 14, armL: 10, face: 'happy' }, { arms: false });
  let o = hallView(t, cam, g, { front: keyBunch(1008, 806, 0.62, sw, t) });
  const tw = 0.5 + 0.5 * Math.sin(t * 7);
  o += K.F.sparkle(1180, 760, 40 + 16 * tw) + K.F.sparkle(1230, 700, 18 * tw);
  const cnt = Math.round(lerp(1, 100, ease.in(seg(t, tOne - 0.1, tKy + 0.05))));
  const kk = seg(t, tOne - 0.15, tOne);
  if (kk > 0) o += S.g(S.rect(-260, -80, 520, 160, 40, ol('#2A2246', 8)) + TF('KEYS', -120, 28, 54, '#FFB13B') + T(String(cnt), 110, 40, 110, '#FFFFFF', OUT(10)), `translate(500 250) rotate(-5) scale(${f(pop(kk) * (1 + 0.15 * bump(t, tKy, tKy + 0.25)))})`);
  for (const tj of [tC + 0.1, tKy + 0.1]) o += K.bang('JINGLE!', 1420, 860, seg(t, tj, tj + 0.12) * (1 - seg(t, tj + 0.5, tj + 0.65)), 90, 6, '#FFE14D');
  return o;
}
function shotSecret(t) {
  // "...and he won't tell anyone what they open." — Grandpa: shh. Padlocks with question marks float by.
  const cam = camKeys(t, [[tSecret, camAt(960, 560, 1.7)], [tDoors, camAt(960, 540, 1.85)]]);
  const sh = seg(t, W(7, "won't") - 0.2, W(7, "won't") + 0.1);
  const g = actor('grandpa', t, { x: 960, y: 1000, s: 0.62, armR: lerp(14, 158, ease.outBack(sh)), armL: 10, keysSwing: 8 * Math.sin(t * 9), face: { name: 'sneaky', eyes: { look: [-0.4, 0] } }, headRot: -6 }, { arms: false });
  let w = '';
  for (let i = 0; i < 3; i++) {
    const k = seg(t, tSecret + 0.3 + i * 0.35, tSecret + 0.6 + i * 0.35);
    if (k <= 0) continue;
    const x = [560, 1360, 1460][i], y = [380, 300, 620][i] + Math.sin(t * 2 + i) * 12;
    w += S.g(S.path('M-34 -10 L-34 -50 Q0 -90 34 -50 L34 -10', ln(16, '#C9CED8')) + S.rect(-56, -14, 112, 96, 16, ol('#FFC93C', 7)) + T('?', 0, 64, 70, '#2A2246'), `translate(${x} ${y}) rotate(${(i - 1) * 10}) scale(${f(pop(k) * 0.9)})`);
  }
  let o = hallView(t, cam, g, { front: w });
  o += K.bang('SHHH...', 1300, 860, seg(t, W(7, 'tell'), W(7, 'tell') + 0.15), 90, -6, '#FFFFFF');
  return o;
}
function door(open, x0 = 100, y0 = 270, w = 260, h = 630) {
  // the hallway door re-drawn: dark mysterious doorway + leaf swinging on the left hinge (open 0..1)
  let o = S.rect(x0, y0, w, h, 4, { fill: 'url(#s02doorGlow)', stroke: '#151515', 'stroke-width': 6 });
  for (let i = 0; i < 5; i++) o += K.F.sparkle(x0 + 40 + hash(i * 3.3) * (w - 80), y0 + 80 + hash(i * 5.1) * (h - 200), 10 + 6 * hash(i));
  const sx = Math.cos(open * 1.35);
  let leaf = S.rect(0, 0, w, h, 6, ol('#B8794A', 5)) + S.rect(26, 30, w - 52, 250, 8, { fill: 'none', stroke: '#9A6238', 'stroke-width': 5 }) + S.rect(26, 320, w - 52, 270, 8, { fill: 'none', stroke: '#9A6238', 'stroke-width': 5 }) + S.circle(w - 30, 330, 12, ol('#FFD34D', 4));
  o += S.g(leaf, `translate(${x0} ${y0}) scale(${f(Math.max(0.04, sx))} 1)`);
  return o;
}
function shotDoors(t) {
  // spooky: underlit Grandpa whispers; the door behind him creaks... SLAM on "closed"
  const tCl = W(8, 'closed');
  const cam = shakeCam(camKeys(t, [[tDoors, camAt(520, 560, 1.35)], [tCl, camAt(560, 520, 1.9)], [tCl + 0.12, camAt(560, 500, 2.15)], [tMop, camAt(560, 500, 2.2)]]), t, tCl, 0.4, 16);
  const shut = ease.in(seg(t, tCl - 0.35, tCl));
  const g = actor('grandpa', t, { x: 600, y: 1000, s: 0.62, turn: -0.3, armR: 12, armL: 12, face: t > tCl ? { name: 'sneaky', eyes: { look: [-0.9, 0] } } : 'sneaky' }, { arms: false, energy: 0.4 });
  const Ls = SETS.atticStairs.layers(t, {});
  let w = Ls.mid + door(1 - shut) + g;
  w += S.ellipse(600, 360, 900, 700, { fill: 'url(#s02spot)' });
  w += S.rect(-800, -600, 3520, 2280, 0, { fill: '#2A1040', opacity: 0.18 });
  let o = view(cam, w, 1);
  if (t > tCl) o += C.dust(230, 860, tCl, t);
  o += K.bang('SLAM!', 1300, 300, seg(t, tCl, tCl + 0.1) * (1 - seg(t, tCl + 0.6, tCl + 0.8)), 150, -8, '#FFFFFF');
  return o;
}
function shotMop(t) {
  // Grandpa strolls down the hall, the mop as a walking stick (squeak... squeak), stops: "Nobody knows why."
  const tNb = W(9, 'Nobody');
  const stop = tNb - 0.2;
  const u = seg(t, tMop, stop);
  const gx = lerp(260, 1240, u);
  const cam = camKeys(t, [[tMop, camAt(480, 600, 1.3)], [stop, camAt(1180, 600, 1.3)], [stop + 0.4, camAt(1240, 580, 1.55)], [tParents, camAt(1250, 570, 1.62)]], ease.linear);
  let g, fx = '';
  // wet shiny trail
  fx += S.path(`M260 1012 L${f(gx)} 1012`, ln(26, '#BFEFFF', 0.45)) + S.path(`M270 1006 L${f(gx - 20)} 1006`, ln(6, '#FFFFFF', 0.7));
  if (t < stop) {
    const ph = (t - tMop) * 7.5;
    const cyc = A.walk(ph, 1);
    const plant = Math.sin(ph * 0.5);
    const mp = mop({ x: -225 + 24 * plant, y: 0, rot: -4 * plant, len: 640 });
    g = actor('grandpa', t, { x: gx, y: 1010, s: 0.62, view: 'side', flip: true, ...cyc, armR: 56, armL: cyc.armL, face: 'happy', keysSwing: 14 * Math.sin(ph), props: [{ svg: mp, layer: 'front' }] }, { arms: false });
    for (let i = 0; i < 3; i++) {
      const tq = tMop + 0.4 + i * 0.85;
      const k = seg(t, tq, tq + 0.12) * (1 - seg(t, tq + 0.35, tq + 0.5));
      if (k > 0) fx += K.bang('squeak', lerp(260, 1240, seg(tq, tMop, stop)) + 200, 780, k, 54, -10, '#BFEFFF');
    }
  } else {
    const [hx] = A.hand(26, 1);
    const tw = bump(t, stop + 0.6, stop + 1.0);
    g = actor('grandpa', t, { x: gx, y: 1010, s: 0.62, armR: 26, armL: 10, face: { name: 'sneaky', eyes: { look: [0, 0] } }, headRot: 8 * tw, props: [{ svg: mop({ x: hx, y: 0, rot: 2, len: 760 }), layer: 'front' }] }, { arms: false });
    fx += K.F.sparkle(gx + hx * 0.62, 1000 - 30, 30 * bump(t, stop + 0.2, stop + 0.8));
    fx += marks('?', gx, 440, t, seg(t, W(9, 'why') - 0.1, W(9, 'why') + 0.2), 3, '#FFFFFF');
  }
  return hallView(t, cam, g, { front: fx });
}

// ---------------------------------------------------------------- Mom & Dad
function book(open = 1) {
  return S.rect(-150, -100, 300, 200, 10, ol('#1FA39A', 6)) + S.path('M0 -100 L0 100', ln(6)) + TF('PUZZLES', -75, 10, 32, '#FFFFFF') + TF('& MORE', 75, 10, 32, '#FFFFFF');
}
function parentsWorld(t, o = {}) {
  const Ls = SETS.livingRoom.layers(t, { time: 'day' });
  const paper = o.paper ?? 1, bk = o.book ?? 1;
  const dad = actor('dad', t, { x: 820, y: 908, s: 0.55, armL: 12, armR: 12, face: o.dadFace || 'deadpan', headRot: o.dadHead || 0, props: [{ svg: SETS.newspaper(0, lerp(-420, -720, paper), 0.95, t, { glow: o.glow }), layer: 'front' }] }, { arms: false, energy: 0.3 });
  const mom = actor('mom', t, { x: 1110, y: 908, s: 0.55, armL: 10, armR: 10, face: o.momFace || 'deadpan', headRot: o.momHead || 0, props: [{ svg: S.g(book(), `translate(0 ${f(lerp(-330, -770, bk))}) scale(0.95)`), layer: 'front' }] });
  return { bg: Ls.bg, mid: Ls.mid + dad + mom + Ls.seat, light: Ls.light };
}
function shotParents(t) {
  // Mom and Dad on the couch, newspaper and book up; on "play" both lower them and stare at us
  const tPl = W(10, 'play');
  const cam = camKeys(t, [[tParents, camAt(960, 560, 1.12)], [tRot, camAt(960, 580, 1.18)]]);
  const k = ease.outBack(seg(t, tPl - 0.25, tPl + 0.05));
  const w = parentsWorld(t, { paper: 1 - k, book: 1 - k });
  let o = view(cam, w.bg, 0.5) + view(cam, w.mid, 1) + view(cam, w.light, 1);
  o += tag('GAMES PLAYED: 0', 960, 160, seg(t, tPl + 0.05, tPl + 0.25), '#FFFFFF', -3, 60);
  return o;
}
function shotRot(t) {
  // Dad solemnly nods; smash-zoom into the headline on "rot"; something glows behind the paper...
  const tR = W(10, 'rot');
  const cam0 = t < tR ? camKeys(t, [[tRot, camAt(830, 470, 1.9)], [tR, camAt(830, 470, 2.05)]]) : camKeys(t, [[tR, camAt(760, 590, 3.4)], [tR + 0.2, camAt(765, 585, 3.0)], [tDex, camAt(770, 585, 3.1)]]);
  const cam = shakeCam(cam0, t, tR, 0.3, 14);
  const nod = Math.sin((t - tRot) * 9) * 7 * (1 - seg(t, tR - 0.2, tR));
  const sly = seg(t, tDex - 0.6, tDex - 0.4);
  const w = parentsWorld(t, { paper: 0.25, book: 0, dadFace: sly > 0 ? { name: 'sneaky', eyes: { look: [-0.9, 0] } } : 'determined', dadHead: nod, glow: sly > 0 });
  return view(cam, w.bg, 0.5) + view(cam, w.mid, 1) + view(cam, w.light, 1);
}

// ---------------------------------------------------------------- Dex
const DX = 1300;
function dexHatch(t, rise, pose = {}, act = {}) {
  const yFeet = lerp(1460, 1190, ease.outBack(rise));
  return actor('dex', t, { x: DX, y: yFeet, s: 0.62, ...pose }, act);
}
function shotDex(t) {
  // the hatch bangs open, Dex rises out of it in his headset, finger guns; name card
  const tO = W(11, 'this') - 0.1, tD = W(11, 'Dex');
  const cam = camKeys(t, [[tDex, camAt(1180, 640, 1.25)], [tD, camAt(1230, 600, 1.4)], [tBrag, camAt(1240, 600, 1.42)]]);
  const open = ease.outBack(seg(t, tO, tO + 0.35));
  const rise = seg(t, tO + 0.3, tO + 0.75);
  const guns = seg(t, tD - 0.25, tD);
  const d = rise > 0 ? dexHatch(t, rise, { armL: lerp(20, 70, guns), armR: lerp(20, 70, guns), face: guns > 0.5 ? 'smug' : 'happy', headRot: -6 * guns }, { arms: false }) : '';
  let o = atticView(t, cam, { cat: 'bed', hatchOpen: open, juice: 2 }, d, { front: SETS.attic.hatchFront(t, { hatchOpen: open }) });
  o += K.bang('CLACK!', 1550, 380, seg(t, tO + 0.1, tO + 0.2) * (1 - seg(t, tO + 0.6, tO + 0.8)), 90, 8, '#FFFFFF');
  o += nameCard('DEX', 'best friend · pro gamer', seg(t, tD - 0.05, tD + 0.3), 0, t, 90, 640, '#1E8BFF');
  return o;
}
function hudCard(lines, t, x, y, k) {
  if (k <= 0) return '';
  let o = S.rect(0, 0, 560, 110, 22, { fill: '#10162A', opacity: 0.85, stroke: '#27C4FF', 'stroke-width': 5 });
  o += lines;
  return S.g(o, `translate(${f(x + lerp(-700, 0, ease.out(clamp(k, 0, 1))))} ${f(y)})`);
}
function shotBrag(t) {
  // Dex out on the floor, cocky; gamer stat cards: 12,000 HOURS, OBBIES ✓ BOSSES ✓ BADGES ✓
  const tH = W(12, 'hours');
  const ev = [W(12, 'obby'), W(12, 'boss'), W(12, 'badge')];
  const cam = camKeys(t, [[tBrag, camAt(1100, 600, 1.35)], [tNever, camAt(1060, 590, 1.42)]]);
  const hop = bump(t, tBrag, tBrag + 0.35);
  const d = actor('dex', t, { x: 1250, y: 1000, s: 0.62, lift: 120 * hop, turn: -0.2, face: 'smug' }, { energy: 1.4 });
  let o = atticView(t, cam, { cat: 'bed', hatchOpen: 1, juice: 2 }, d);
  o += C.dust(1180, 990, tBrag + 0.32, t);
  const hrs = Math.round(lerp(0, 12000, ease.out(seg(t, tBrag + 0.05, tH))));
  o += hudCard(TF('PLAYTIME', 30, 44, 26, '#27C4FF', { 'text-anchor': 'start' }) + T(`${hrs.toLocaleString('en-US')} HRS`, 30, 96, 60, '#FFFFFF', { 'text-anchor': 'start' }), t, 70, 170, seg(t, tBrag, tBrag + 0.3));
  ['EVERY OBBY', 'EVERY BOSS', 'EVERY BADGE'].forEach((s, i) => {
    const k = seg(t, ev[i] - 0.1, ev[i] + 0.15);
    const chk = S.circle(490, 55, 34, ol('#3BD16F', 5)) + S.path('M472 55 L486 70 L510 40', ln(8, '#FFFFFF'));
    o += hudCard(T(s, 30, 74, 54, '#FFFFFF', { 'text-anchor': 'start' }) + S.g(chk, `translate(490 55) scale(${f(pop(seg(t, ev[i] + 0.05, ev[i] + 0.25)))}) translate(-490 -55)`), t, 70, 310 + i * 130, k);
  });
  return o;
}
function shotNever(t) {
  // low hero angle, rays: "I have NEVER fallen." smash-zoom; "Not once." finger wag + tooth sparkle
  const tN = W(12, 'NEVER'), tO = W(12, 'Not');
  const cam0 = t < tN ? camKeys(t, [[tNever, camAt(1250, 560, 1.7)], [tN, camAt(1250, 540, 1.8)]]) : camKeys(t, [[tN, camAt(1250, 420, 2.6)], [tN + 0.2, camAt(1250, 450, 2.3)], [tAside, camAt(1250, 460, 2.35)]]);
  const cam = shakeCam(cam0, t, tN, 0.35, 12);
  const wag = t > tO ? { armR: 150, armL: -20 } : { armL: -35, armR: -35 };
  const d = actor('dex', t, { x: 1250, y: 1000, s: 0.62, ...wag, headRot: t > tO ? 6 * Math.sin(t * 18) : -4, face: t > tN ? 'determined' : 'smug' }, { arms: false });
  let o = atticView(t, cam, { cat: 'bed', hatchOpen: 1, juice: 2 }, d, { behind: K.rays(1250, 500, 18, 1400, '#BFE8FF', 0.3, t * 30) });
  o += K.bang('NEVER!', 560, 300, seg(t, tN, tN + 0.12), 160, -8, '#27C4FF');
  if (t > tO) o += K.F.sparkle(1010, 600, 30 + 10 * Math.sin(t * 20));
  return o;
}
function shotAside(t) {
  // Juno, extreme close-up, deadpan to camera: "In the game."
  const cam = camKeys(t, [[tAside, camAt(700, 470, 2.5)], [tStairs, camAt(700, 470, 2.6)]]);
  const j = actor('juno', t, { x: 700, y: 1000, s: 0.62, armL: 8, armR: 8, face: { name: 'deadpan', eyes: { look: [0, 0] } } }, { arms: false, energy: 0.2 });
  let o = atticView(t, cam, { cat: 'bed', juice: 2, hatchOpen: 1 }, j);
  o += TF('*in the game', 1500, 900, 46, '#FFFFFF', { ...OUT(8), opacity: f(seg(t, W(13, 'game'), W(13, 'game') + 0.2)) });
  return o;
}
// Dex hugging the banister at the foot of the attic ladder. drop: 0..1 face-plant progress (pivot at the toes)
const DEXF = { x: 1010, y: 930 };
function dexLadder(t, o = {}) {
  const tremble = (o.tremble ?? 1) * Math.sin(t * 60) * 3;
  const pose = { x: DEXF.x + tremble, y: DEXF.y, s: 0.6, view: 'side', flip: true, legL: 70, kneeL: 80, legR: 10, kneeR: 20, armL: 95, armR: 70, lean: 8, face: o.face || 'scared', ...(o.pose || {}) };
  return actor('dex', t, pose, { arms: false, ...(o.act || {}) });
}
function shotStairs(t) {
  // hallway: Dex clings to the banister with arms and legs, trembling
  const tSt = W(13, 'stairs');
  const cam = camKeys(t, [[tStairs, camAt(1040, 520, 1.85)], [tSt, camAt(1040, 560, 1.6)], [tCheck, camAt(1040, 560, 1.55)]]);
  const d = dexLadder(t, { face: 'scared' });
  const Ls = SETS.atticStairs.layers(t, {});
  let o = view(cam, Ls.mid + d + Ls.fg + Ls.light, 1);
  return o;
}
function shotCheck(t) {
  // close: Dex screams up the ladder; CHECKPOINT: NONE; smash-zoom on "spawn?!"
  const tCk = W(14, 'checkpoints'), tSp = W(14, 'spawn');
  const cam0 = t < tSp ? camKeys(t, [[tCheck, camAt(1040, 480, 2.1)], [tSp, camAt(1050, 470, 2.3)]]) : camKeys(t, [[tSp, camAt(1070, 470, 3.0)], [tFloorA, camAt(1070, 475, 2.85)]]);
  const cam = shakeCam(cam0, t, tSp, 0.4, 14);
  const d = dexLadder(t, { face: t > tSp - 0.1 ? 'scream' : 'scared', pose: { headRot: -12 } });
  const Ls = SETS.atticStairs.layers(t, {});
  let o = view(cam, Ls.mid + d + Ls.fg + Ls.light, 1);
  const kc = seg(t, tCk - 0.1, tCk + 0.15);
  if (kc > 0) {
    let b = S.rect(-330, -70, 660, 140, 24, { fill: '#2A0610', opacity: 0.9, stroke: '#FF3B5C', 'stroke-width': 8 });
    b += S.g(S.path('M-10 40 L-10 -50', ln(8, '#FFFFFF')) + S.path('M-10 -50 L40 -36 L-10 -20 Z', ol('#3BD16F', 4)), 'translate(-250 10) scale(0.9)') + S.path('M-300 -40 L-200 50 M-200 -40 L-300 50', ln(10, '#FF3B5C'));
    b += TF('CHECKPOINT', 50, -8, 44, '#FFB0B0') + T('NONE', 50, 52, 66, '#FF3B5C');
    o += S.g(b, `translate(520 250) rotate(-4) scale(${f(pop(kc))})`);
  }
  if (t > tSp) o += K.bang('SPAWN?!', 1400, 760, seg(t, tSp, tSp + 0.12), 130, 8, '#FFD21F');
  return o;
}
function junoUpsideDown(t, hx, hy, face) {
  // Juno lying on the attic floor, head poking down through the hatch (upside-down), clipped by the ceiling
  const s = 0.62;
  const j = actor('juno', t, { x: 0, y: 0, s, armL: 8, armR: 8, face }, { arms: false, energy: 0.3 });
  const id = S.uid('s02h');
  return S.clipDef(id, S.path('M940 20 L1380 20 L1330 150 L2720 150 L2720 1500 L-800 1500 L-800 150 L990 150 Z')) + S.g(S.g(j, `translate(${f(hx)} ${f(hy)}) rotate(180) translate(0 ${f(770 * s)})`), null, { 'clip-path': `url(#${id})` });
}
function shotFloorA(t) {
  // Juno's upside-down head pops through the hatch: "On the floor, Dex."
  const cam = camKeys(t, [[tFloorA, camAt(1150, 300, 1.75)], [tFloorB, camAt(1150, 290, 1.85)]]);
  const drop = ease.outBack(seg(t, tFloorA, tFloorA + 0.3));
  const Ls = SETS.atticStairs.layers(t, {});
  const j = junoUpsideDown(t, 1160, lerp(-120, 190, drop), { name: 'deadpan', eyes: { look: [0, 0.2] } });
  return view(cam, Ls.mid + j + Ls.fg + Ls.light, 1);
}
function shotFloorB(t) {
  // wide reveal: he was on the bottom rung all along — lets go on "spawn", face-plants on "floor"; respawn sparkle + badge
  const tSp = W(15, 'spawn'), tFl = W(15, 'floor', 1);
  const tImp = tFl + 0.05;
  const cam = shakeCam(camKeys(t, [[tFloorB, camAt(1000, 560, 1.0)], [tImp, camAt(1080, 640, 1.12)], [tPip, camAt(1100, 660, 1.2)]]), t, tImp, 0.35, 16);
  const Ls = SETS.atticStairs.layers(t, {});
  const fall = ease.in(seg(t, tSp + 0.15, tImp));
  let d;
  if (fall <= 0) d = dexLadder(t, { face: 'scared' });
  else {
    // pivot near the toes (on the floor), rotate forward (screen-right) to lie face-down
    const ang = 90 * fall - 4 * bump(t, tImp, tImp + 0.2);
    const yFeet = lerp(DEXF.y, 1000, fall);
    const lying = t > tImp + 0.35;
    const thumbs = lying && t > tImp + 0.9;
    const dd = actor('dex', t, { x: 0, y: 0, s: 0.6, view: 'side', flip: true, legL: lerp(70, 0, fall), kneeL: lerp(80, 5, fall), legR: lerp(10, -10, fall), kneeR: 10, armL: lerp(95, 175, fall), armR: thumbs ? 90 : lerp(70, 170, fall), face: lying ? { name: 'oof' } : 'scream' }, { arms: false });
    d = S.g(dd, `translate(${f(DEXF.x + 40 * fall)} ${f(yFeet)}) rotate(${f(ang)} 0 -40)`);
  }
  let fx = '';
  if (t > tImp) fx += C.dust(1200, 990, tImp, t) + C.dust(1420, 990, tImp + 0.03, t);
  fx += respawn(1330, 1000, 520, seg(t, tImp + 0.35, tImp + 1.0), t);
  const j = junoUpsideDown(t, 1160, 190, { name: 'deadpan', eyes: { look: [-0.3, 0.6] } });
  let o = view(cam, Ls.mid + j + d + Ls.fg + fx + Ls.light, 1);
  o += K.bang('THUD!', 1500, 520, seg(t, tImp, tImp + 0.1) * (1 - seg(t, tImp + 0.5, tImp + 0.65)), 130, 6, '#FFFFFF');
  o += K.badge(1440, 170, 'FLOOR SPAWN', 'BADGE EARNED!', seg(t, tImp + 0.45, tImp + 0.75), t);
  return o;
}

// ---------------------------------------------------------------- Pip
const BOX = { x: 1300, y: 960, s: 1.15 };
function pipInBox(t, rise, o = {}) {
  // rise 0 = hidden, 0.5 = eyes peek over the edge, 1 = popped up (chest out)
  const b = o.box || BOX;
  const yFeet = b.y - 60 * b.s + lerp(420, -40, rise);
  const p = actor('pip', t, { x: b.x - 10, y: yFeet, s: 0.5 * b.s, ...(o.pose || {}) }, o.act || {});
  const bo = { floor: o.floor ?? 1, ding: o.ding || 0, doors: o.doors || 0, tilt: o.tilt || 0 };
  return SETS.pipBox(b.x, b.y, b.s, t, { ...bo, part: 'back' }) + p + SETS.pipBox(b.x, b.y, b.s, t, { ...bo, part: 'front' });
}
function shotPip(t) {
  // Juno points at the cardboard elevator; on "Pip" he pops out — Ding! sparkle; name card; "He's six." sticker
  const tP = W(16, 'Pip'), tSix = W(16, 'six');
  const cam = camKeys(t, [[tPip, camAt(1050, 600, 1.2)], [tP, camAt(1150, 600, 1.35)], [tOne, camAt(1170, 590, 1.4)]]);
  const rise = t < tP - 0.1 ? 0.6 + 0.04 * Math.sin(t * 6) : ease.outBack(seg(t, tP - 0.1, tP + 0.2)) * 0.4 + 0.6;
  const ding = seg(t, tP - 0.05, tP + 0.9);
  const pip = pipInBox(t, rise, { ding: ding > 0 && ding < 1 ? 1 - ding : 0, pose: { armL: t > tP ? 150 : 10, armR: t > tP ? 150 : 10, face: t > tP ? 'excited' : { name: 'cute' } } });
  const j = actor('juno', t, { x: 720, y: 1000, s: 0.62, turn: 0.45, armR: 92, armL: 10, face: 'happy' }, { arms: false });
  let o = atticView(t, cam, { cat: 'bed', juice: 2 }, j + pip);
  o += S.g(dingFx(0, 0, seg(t, tP, tP + 0.9), 1, false), 'translate(1510 330)');
  o += nameCard('PIP', 'little brother · dino hood', seg(t, tP + 0.05, tP + 0.35), seg(t, tOne - 0.2, tOne + 0.05), t, 90, 170, '#45A037');
  o += sticker('6', 'YEARS', 1700, 600, seg(t, tSix, tSix + 0.25), t, '#7EE05A');
  return o;
}
function shotOne(t) {
  // close on Pip: one finger up — "exactly one game"
  const tO = W(16, 'one');
  const cam = camKeys(t, [[tOne, camAt(1290, 560, 2.0)], [tElev, camAt(1290, 540, 2.2)]]);
  const pip = pipInBox(t, 1, { pose: { armR: t > tO - 0.2 ? 160 : 20, armL: 12, face: t > tO ? 'excited' : 'happy', headRot: 6 * Math.sin(t * 7) } });
  let o = atticView(t, cam, { cat: 'bed', juice: 2 }, pip);
  o += tag('GAMES PLAYED: 1', 960, 170, seg(t, tO, tO + 0.2), '#7EE05A', -4, 64);
  return o;
}
function elevLogo(k, t) {
  if (k <= 0) return '';
  let o = S.rect(-560, -150, 1120, 300, 40, ol('#2A2246', 10)) + S.rect(-540, -130, 1080, 260, 30, { fill: 'none', stroke: '#FFD34D', 'stroke-width': 6 });
  o += T('ELEVATOR', 0, -10, 150, '#FFD34D', OUT(14)) + T('SIMULATOR', 0, 100, 96, '#FFFFFF', OUT(10));
  o += S.path('M-470 -60 L-430 -110 L-390 -60 Z', { fill: '#FFB13B' }) + S.path('M390 -110 L430 -60 L470 -110 Z', { fill: '#FFB13B' });
  o += K.F.sparkle(-520, -150, 40) + K.F.sparkle(540, 120, 34);
  return S.g(o, `translate(960 420) rotate(-3) scale(${f(pop(k))})`);
}
function shotElev(t) {
  // the game: a title plate slams in; Pip bounces up into the corner with star eyes
  const tE = W(17, 'Elevator');
  const cam = camKeys(t, [[tElev, camAt(960, 520, 1.25)], [tDing1, camAt(960, 540, 1.05)]]);
  let o = view(cam, SETS.elevatorGame(t, { doors: 0, floor: 1 }), 1);
  o += elevLogo(seg(t, tE, tE + 0.25), t);
  const up = ease.outBack(seg(t, tE + 0.1, tE + 0.45));
  o += actor('pip', t, { x: 640, y: lerp(1500, 1110, up), s: 0.75, armL: 160, armR: 160, face: 'excited', headRot: 5 * Math.sin(t * 10) }, { arms: false });
  return o;
}
function shotDing(t, t0, t1, proud) {
  // Pip pops out of his box elevator: DING!
  const cam = camKeys(t, [[t0, camAt(1290, 640, 1.75)], [t1, camAt(1290, 600, 1.95)]]);
  const tD = proud ? L('02.20').a : L('02.18').a;
  const rise = ease.outBack(seg(t, tD - 0.12, tD + 0.08)) * 0.6 + 0.4;
  const dk = seg(t, tD - 0.05, tD + 0.8);
  const pip = pipInBox(t, rise, { ding: dk > 0 && dk < 1 ? 1 - dk : 0, floor: proud ? 41 : 1, pose: { armL: 150, armR: 150, face: proud ? { name: 'smug', fx: ['blush'] } : 'excited' } });
  let o = atticView(t, cam, { cat: 'bed', juice: 2 }, pip);
  o += S.g(dingFx(0, 0, dk, 1.2, false), 'translate(1420 300)');
  return o;
}
function shotRides(t) {
  // the elevator, again and again: doors open/close, floors fly by, RIDES counter rolls up to 41,000 on "times"
  const t41 = W(19, 'forty-one'), tTimes = W(19, 'times');
  const cyc = (t - tRides) / 0.6;
  const doors = 0.5 - 0.5 * Math.cos(cyc * Math.PI * 2);
  const floor = 1 + (Math.floor(cyc) % 16);
  const rides = Math.round(lerp(1, 41000, Math.pow(seg(t, tRides + 0.2, tTimes), 2.2)));
  const cam0 = t < t41 ? camKeys(t, [[tRides, camAt(960, 560, 1.15)], [t41, camAt(900, 500, 1.05)]]) : camKeys(t, [[t41, camAt(700, 360, 1.5)], [tTimes, camAt(330, 160, 2.6)], [tTimes + 0.2, camAt(330, 170, 2.35)], [tButtons, camAt(340, 180, 2.4)]]);
  const cam = shakeCam(cam0, t, tTimes, 0.35, 14);
  let o = view(cam, SETS.elevatorGame(t, { doors, floor, rides, dir: 'up', wave: doors > 0.7 ? doors : 0, ding: doors > 0.9 ? (doors - 0.9) * 10 : 0 }), 1);
  if (t > tTimes) o += K.confetti(t, tTimes, 50, 4);
  o += K.bang('41,000!', 1300, 680, seg(t, tTimes, tTimes + 0.12), 140, -6, '#FFD34D');
  return o;
}
const PANEL_STYLES = [['#E3C27A', '#EFD597', '#FFB13B'], ['#B9C2D0', '#D9DEE6', '#7CF7FF'], ['#2A2246', '#3A3260', '#FF6FB5'], ['#9A6238', '#B8794A', '#FFE14D'], ['#3FBF5A', '#7FDB8E', '#FFFFFF'], ['#5B8DEF', '#8FB2FF', '#FFD21F'], ['#E8603C', '#FF9A76', '#FFFFFF'], ['#1A1D26', '#2C303C', '#3BFF7A'], ['#B07CFF', '#D2B4FF', '#FFE14D']];
function buttonPanel(w, h, i, t) {
  const [frame, face, lit] = PANEL_STYLES[i % PANEL_STYLES.length];
  let o = S.rect(0, 0, w, h, 0, { fill: face }) + S.rect(10, 10, w - 20, h - 20, 18, { fill: 'none', stroke: frame, 'stroke-width': 10 });
  const cols = 3, rows = 4, bw = (w - 60) / cols, bh = (h - 60) / rows, r = Math.min(bw, bh) * 0.34;
  const on = Math.floor(t * 9 + i * 3.7) % (cols * rows);
  for (let j = 0; j < cols * rows; j++) {
    const cx = 30 + bw * (j % cols + 0.5), cy = 30 + bh * (Math.floor(j / cols) + 0.5);
    const isOn = j === on || j === (on + 5) % 12;
    if (isOn) o += S.circle(cx, cy, r * 1.6, { fill: lit, opacity: 0.35 });
    o += S.circle(cx, cy, r, ol(isOn ? lit : '#F7F2E6', 4)) + TF(String(12 - j), cx, cy + r * 0.35, r, isOn ? '#151515' : '#5A4A2A');
  }
  return o;
}
function shotButtons(t) {
  // every button in every elevator: panels multiply 2x2 → 3x3, buttons blink as Pip presses them
  const tEv = W(19, 'every', 1);
  const big = t >= tEv;
  const n = big ? 3 : 2;
  const pad = 24, top = 60, cw = (1920 - pad * (n + 1)) / n, ch = (1000 - top - pad * n) / n;
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1B2340' });
  for (let j = 0; j < n * n; j++) {
    const cx = pad + (j % n) * (cw + pad), cy = top + Math.floor(j / n) * (ch + pad);
    const k = seg(t, (big ? tEv : tButtons) + j * 0.05, (big ? tEv : tButtons) + j * 0.05 + 0.18);
    if (k <= 0) continue;
    const id = S.uid('s02bp');
    const inner = S.clipDef(id, S.rect(0, 0, cw, ch, 16)) + S.g(buttonPanel(cw, ch, j + (big ? 4 : 0), t), null, { 'clip-path': `url(#${id})` }) + S.rect(0, 0, cw, ch, 16, { fill: 'none', stroke: '#151515', 'stroke-width': 8 });
    o += S.g(inner, `translate(${f(cx + cw / 2)} ${f(cy + ch / 2)}) scale(${f(pop(k))}) translate(${f(-cw / 2)} ${f(-ch / 2)})`);
  }
  o += tag(big ? 'EVERY ELEVATOR' : 'EVERY BUTTON', 960, 64, seg(t, big ? tEv : tButtons, (big ? tEv : tButtons) + 0.2), '#FFD34D', -2, 60);
  return o;
}
function xmasTree(x, y, s, t) {
  let o = S.rect(-24, -60, 48, 70, 6, ol('#8A5530', 5));
  for (let i = 0; i < 3; i++) o += S.path(`M${-220 + i * 50} ${-60 - i * 130} L0 ${-260 - i * 130} L${220 - i * 50} ${-60 - i * 130} Z`, ol('#2E9E4E', 6));
  const cols = ['#FF5A5A', '#FFD21F', '#5BC0EB', '#FF6FB5'];
  for (let i = 0; i < 12; i++) { const yy = -100 - (i % 4) * 90 - Math.floor(i / 4) * 30, xx = (hash(i * 3.1) - 0.5) * (300 - (i % 4) * 60); o += S.circle(xx, yy, 14, ol(cols[i % 4], 4)) + S.circle(xx, yy, 24, { fill: cols[i % 4], opacity: f(0.2 + 0.2 * Math.sin(t * 6 + i)) }); }
  o += S.path(starPathD(0, -560, 46), ol('#FFD21F', 6));
  return S.g(o, tr(x, y, s));
}
function starPathD(cx, cy, r) { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + f(cx + Math.cos(a) * rr) + ' ' + f(cy + Math.sin(a) * rr); } return d + 'Z'; }
function shotSigh(t) {
  // Juno sighs beside the box; on "since Christmas" a sepia flashback: Pip unwraps the box — and his first "DING!"
  const tSi = W(21, 'only'), tCh = W(21, 'Christmas');
  const cam = camKeys(t, [[tSigh, camAt(1020, 600, 1.35)], [tXmas, camAt(1040, 600, 1.45)], [END, camAt(1040, 600, 1.5)]]);
  const sigh = bump(t, tSigh, tSi + 0.6);
  const j = actor('juno', t, { x: 760, y: 1000, s: 0.62, turn: 0.2, armL: 6, armR: 6, bodyY: 18 * sigh, lean: 3 * sigh, face: sigh > 0.4 ? { name: 'deadpan', eyes: { type: 'closed' } } : 'deadpan' }, { arms: false, energy: 0.3 });
  const k = seg(t, tXmas, tXmas + 0.3);
  const pip = k < 0.7 ? pipInBox(t, 0.8, { pose: { armL: 20, armR: 20, face: 'happy' } }) : '';
  let o = atticView(t, cam, { cat: 'bed', juice: 2 }, (k < 0.7 ? j : '') + pip);
  // flashback card
  if (k > 0) {
    let fb = S.rect(-800, -600, 3520, 2280, 0, { fill: '#7A3A2A' }) + S.rect(-800, 700, 3520, 1000, 0, { fill: '#5A2A1A' });
    for (let i = 0; i < 6; i++) fb += S.rect(-200 + i * 420, 120, 18, 580, 0, { fill: '#000', opacity: 0.08 });
    fb += xmasTree(560, 860, 1.1, t);
    const open = seg(t, tXmas + 0.25, tXmas + 0.6);
    const bx = 1180, by = 900;
    const pk = ease.outBack(seg(t, tCh + 0.15, tCh + 0.45));
    fb += SETS.pipBox(bx, by, 1.2, t, { part: 'back' });
    fb += actor('pip', t, { x: bx - 10, y: by - 72 + lerp(420, -40, pk), s: 0.6, armL: 160, armR: 160, face: 'excited' }, { arms: false });
    fb += SETS.pipBox(bx, by, 1.2, t, { part: 'front' });
    // wrapping paper + bow flying off
    if (open < 1) fb += S.g(S.rect(-190, -290, 380, 300, 8, ol('#E8243C', 6)) + S.path('M-190 -150 L190 -150 M0 -290 L0 10', ln(26, '#FFD21F')) + S.path('M0 -290 Q-80 -380 -60 -290 Q-20 -310 0 -290 Q20 -310 60 -290 Q80 -380 0 -290 Z', ol('#FFD21F', 5)), `translate(${bx} ${f(by - 10 - open * 600)}) rotate(${f(open * 40)})`);
    for (let i = 0; i < 26; i++) { const sx = (hash(i * 3.3) * 2000 + t * 30) % 2000 - 40, sy = (hash(i * 7.1) * 1100 + t * 120 * (0.5 + hash(i))) % 1100; fb += S.circle(sx, sy, 5 + 5 * hash(i), { fill: '#FFFFFF', opacity: 0.8 }); }
    if (pk > 0.5) fb += K.F.markText('DING!', 1480, 360, 110, 8, '#FFE14D');
    fb += S.rect(-800, -600, 3520, 2280, 0, { fill: '#C89A5A', opacity: 0.32 }) + S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#s02sepia)' });
    const FW = 1400, FH = 788;
    const id = S.uid('s02fb');
    let card = S.rect(-FW / 2 - 30, -FH / 2 - 30, FW + 60, FH + 120, 10, ol('#FFF8EC', 6)) + S.clipDef(id, S.rect(-FW / 2, -FH / 2, FW, FH, 4));
    card += S.g(SETS.frameIn(fb, FW, FH), null, { 'clip-path': `url(#${id})` });
    card += TF('DEC 25', FW / 2 - 120, FH / 2 + 66, 50, '#7A3A2A');
    o += S.rect(0, 0, 1920, 1080, 0, { fill: '#000', opacity: f(0.4 * k) });
    o += S.g(card, `translate(960 500) rotate(${f(lerp(-12, -3, ease.out(k)))}) scale(${f(lerp(0.4, 1, ease.outBack(k)))})`);
  }
  // whip out to SC 03
  o += C.whiteFlash(seg(t, END - 0.12, END));
  return o;
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [tHi, shotHi], [tBuild, shotBuild], [tHat, shotHat], [tFall, shotFall], [tNot, shotNot], [tYears, shotYears],
  [tBub, shotBub], [tInside, shotInside], [tFloat, shotFloat], [tMaster, shotMaster], [tVisits, shotVisits], [tTrip, shotTrip],
  [tGpa, shotGpa], [tWeather, shotWeather], [tOtto, shotOtto], [tKeys, shotKeys], [tSecret, shotSecret], [tDoors, shotDoors], [tMop, shotMop],
  [tParents, shotParents], [tRot, shotRot], [tDex, shotDex], [tBrag, shotBrag], [tNever, shotNever], [tAside, shotAside], [tStairs, shotStairs],
  [tCheck, shotCheck], [tFloorA, shotFloorA], [tFloorB, shotFloorB], [tPip, shotPip], [tOne, shotOne], [tElev, shotElev],
  [tDing1, (t) => shotDing(t, tDing1, tRides, false)], [tRides, shotRides], [tButtons, shotButtons], [tDing2, (t) => shotDing(t, tDing2, tSigh, true)], [tSigh, shotSigh],
];
function scene(t) {
  let fn = SHOTS[0][1];
  for (const [t0, s] of SHOTS) if (t >= t0) fn = s;
  let o = fn(t);
  o += E2.cutFlash(t, CUTS, 0.35, 0.07);
  for (const tw of WHIPS) o += E2.whip(t, tw, 0.14);
  return o;
}
function look(t) {
  if (t >= tBub && t < tTrip) return { grade: null, vignette: 0.5 };
  if (t >= tElev && t < tDing1) return { grade: null, vignette: 0.5 };
  if (t >= tRides && t < tDing2) return { grade: null, vignette: 0.5 };
  if (t >= tDoors && t < tMop) return { grade: 'night', vignette: 1 };
  return { grade: 'warm' };
}
module.exports = { scene, look, DEFS };
