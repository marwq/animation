// SC 08 · ВНУТРИ — the floors of the Server Farm, each opened by the service elevator:
//   1  the Cooling Room (icy slapstick: Dex slides screaming "No respawn!", Grandpa figure-skates on his mop, Pip penguin-slides "Ding!")
//   2  the Cable Jungle (Dex frozen at the gap, Juno's coaching, "It's just an OBBY!", a real two-vine swing with slow-mo, "BABY!")
//   2½ the Lost and Found (treasure-hunt pan, Dex's first sword, Pip's bellhop cap "Ding!")
//   3  the Archive (quiet push-ins, Bubble Island — 3 visits, Grandpa's "gets a shelf", then the grey creeping in from the dark)
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const FM = require('./farm');
const E = require('./s08_env');
const { mop } = require('../rig/cast');
const LAG = require('../rig/lag');

const START = K.V.TL.scenes['SC 08'].start, END = K.V.TL.scenes['SC 09'].start;
const l = (i) => L('08.' + i);
const { at, pop, shakeAll, dutch, glow, ding } = E;
const J = FM.JUNGLE;

// ---------------------------------------------------------------- beats (all from the voice)
// floor 1
const tOne = l(0).a;
const cA2 = l(0).word('The').t0 - 0.1;                 // wide of the Cooling Room
const tWhere = l(0).word('Where').t0, tChill = l(0).word('chill').t0, tOut = l(0).word('out').t0;
const tSlip = tOut + 0.02;                              // Dex's foot goes
const cA3 = l(1).a - 0.05;                              // tracking slide
const tSpin = l(1).word('No', 1).t0;                    // he spins on the second "No"
const cA4 = l(1).word('No', 2).t0 - 0.12;                  // head-on: NO RESPAWN!
const tSmack = l(1).word('respawn', 2).t0 + 0.62;          // smacks into the ice
const cA5 = l(1).b + 0.15;                              // Grandpa glides in
const tKid = l(2).word('kid').t0, tBend = l(2).word('Bend').t0, tKnees = l(2).word('knees').t0;
const cA6 = l(3).a - 0.55;                              // Pip belly-slides
const tDing1 = l(3).a;
// floor 2
const cB1 = l(4).a, tJungle = l(4).word('Jungle').t0;
const cB2 = l(5).a - 0.1, tCant = l(5).word("can't").t0;
const cB3 = l(5).word("That's").t0 - 0.1, tGap1 = l(5).word('gap').t0, tReal2 = l(5).word('real', 1).t0, tFalling = l(5).word('falling').t0;
const cB4 = l(6).a - 0.08, tLook = l(6).word('Look').t0, tIt = l(6).word('it').t0;
const tPlat = l(6).word('Platforms').t0, tRopes = l(6).word('Swinging').t0, tGap2 = l(6).word('gap').t0;
const cB5 = l(6).word('What').t0 - 0.16;
const cB6 = l(7).a - 0.06, tAn = l(7).word('an').t0, tObby = l(7).word('obby').t0, tJust = l(7).word('just').t0, tOBBY = l(7).word('obby', 1).t0;
const tLand = l(8).word('BABY').t0 - 0.02;
// the swing: slow-mo around the leap, landing on "BABY!"
const SLOW0 = tOBBY - 0.14, SLOW1 = tOBBY + 0.8;
const WARP = E.makeWarp(SLOW0, SLOW1, 0.26, 0.16, tLand);
const tau = (t) => WARP.tau(t);
const realOf = (tauX) => { let a = cB6, b = tLand + 1; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (tau(m) < tauX) a = m; else b = m; } return (a + b) / 2; };
const tRunStart = realOf(0), tLeap = realOf(E.SIM.ev.leap), tCatch0 = realOf(E.SIM.ev.catch0), tRel0 = realOf(E.SIM.ev.release0), tCatch1 = realOf(E.SIM.ev.catch1), tRel1 = realOf(E.SIM.ev.release1);
const cB7 = tLeap + 0.05;                               // low-angle slow-mo leap
const cB8 = tCatch0 + 0.04;                             // wide: the swings
const cB9 = tLand;                                      // the landing
// floor 2½
const cC1 = l(9).a, tHalf = l(9).word('half').t0, tLost = l(9).word('Lost').t0, tEvery = l(9).word('Every').t0;
const cC2 = l(10).a - 0.25, tSword = l(10).word('sword').t0, tThird = l(10).word('lost').t0;
const cC3 = l(11).a - 0.32, tDing2 = l(11).a;
// floor 3
const cD1 = l(12).a - 0.05, tArchive = l(12).word('Archive').t0;
const cD2 = l(13).a - 0.12, tSingle = l(13).word('Every', 1).t0;
const cD3 = l(14).a - 0.16, tMine = l(14).word('mine').t0;
const cD4 = l(15).a - 0.12, tLove = l(15).word('love').t0, tShelf = l(15).word('shelf').t0, tWorld = l(15).word('world').t0;
const cD5 = l(16).a - 0.08, tThree = l(16).word('Three').t0, tVisits = l(16).word('visits').t0, tBut = l(16).word('But').t0, tKept = l(16).word('kept').t0;
const cD6 = l(17).a - 0.08, tMillion = l(17).word('million').t0, tJuno = l(17).word('Juno').t0, tSomeone = l(17).word('someone').t0;
const cD7 = l(18).a - 0.12, tEnd = l(18).word('end').t0;
const cD8 = l(18).word('the', 2).t0 - 0.1, tGrey = l(18).word('grey').t0;

// ---------------------------------------------------------------- small helpers
const ob = (u) => (u <= 0 ? 0 : ease.outBack(Math.min(1, u)));
const flash = (t, tc, k = 0.6, d = 0.12) => C.whiteFlash(k * bump(t, tc - 0.03, tc + d));
const headY = (y, s, z = 1) => y - 725 * s * z;           // head centre of a standing rig actor
const mouthY = (y, s, z = 1) => y - 640 * s * z;
const ZS = { juno: 0.95, dex: 1, pip: 0.72, grandpa: 1.06 };
const grandpaMop = (armR = 25, extra = {}) => ({ svg: mop({ x: A.hand(armR, 1)[0], y: 0, ...extra }), layer: 'front' });
// Grandpa's mop lying flat on the ice (he skates on it): head (front) at x, handle trailing behind; world space
function flatMop(x, y, len = 400, dir = 1) {
  let o = S.rect(dir > 0 ? x - len : x, y - 18, len, 13, 6, ol('#B07A45', 4)) + S.path(`M${f(x - dir * len + dir * 10)} ${f(y - 14)} L${f(x - dir * 20)} ${f(y - 14)}`, ln(3, '#D9A36A'));
  o += S.rect(x - 16, y - 30, 32, 26, 7, ol('#5B8DEF', 4));
  let st = '';
  for (let i = 0; i < 7; i++) st += `M${f(x + dir * 12)} ${f(y - 22 + i * 3)} Q${f(x + dir * (36 + i * 4))} ${f(y - 20 + i * 3)} ${f(x + dir * (58 + i * 5))} ${f(y - 6 + i * 1.2)} `;
  return o + S.path(st, ln(10)) + S.path(st, ln(6, '#EDE6D6'));
}
const shiver = (t, k = 1, seed = 0) => Math.sin(t * 47 + seed) * 3 * k;
const snowPuffs = (x, y, t0, t, n = 6, dir = 1) => {
  const age = t - t0;
  if (age < 0 || age > 0.6) return '';
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (hash(i * 3.1) - 0.5) * 2.2, v = 260 + hash(i) * 260;
    o += S.circle(x + Math.cos(a) * v * age * dir, y + Math.sin(a) * v * age + 500 * age * age, 10 + 22 * age + hash(i * 5) * 8, { fill: '#FFFFFF', opacity: f(0.9 * (1 - age / 0.6)), stroke: '#9FCBEA', 'stroke-width': 3 });
  }
  return o;
};
// the gang standing at the jungle's start ledge (world space, y = 800)
function gangLedge(t, o = {}) {
  const s = 0.42;
  let w = '';
  w += actor('grandpa', t, { x: -380, y: J.start.y, s, turn: 0.35, armR: 25, props: [grandpaMop()], keysSwing: 4 * Math.sin(t * 3), face: o.gFace || { name: 'happy', eyes: { look: [0.6, 0.2] } } }, { arms: false });
  w += actor('pip', t, { x: -200, y: J.start.y, s, turn: 0.4, armR: 120 + 10 * Math.sin(t * 6), armL: 20, face: o.pFace || { name: 'amazed', eyes: { look: [0.7, -0.2] } }, bodyY: 6 * Math.abs(Math.sin(t * 5)) }, { arms: false });
  if (!o.noJuno) w += actor('juno', t, { x: 30, y: J.start.y, s, turn: 0.45, armL: 14, armR: 30, face: o.jFace || { name: 'amazed', eyes: { look: [0.7, -0.4] } } }, { arms: o.jArms === undefined ? false : o.jArms });
  return w;
}

// ================================================================ FLOOR 1 · THE COOLING ROOM
// A1: the doors open from the outside; the gang inside the warm car gets hit by the cold
function shotDoors1(t) {
  const cam = camKeys(t, [[START, at(960, 520, 1.0)], [cA2, at(960, 545, 1.08)]]);
  const open = ease.inOut(seg(t, START + 0.12, START + 0.62));
  const blast = seg(t, START + 0.3, START + 0.55);
  const lf = E.liftFront(t, { open });
  const s = 0.44, fl = E.LF.floor;
  let ch = '';
  const lean = -6 * bump(t, START + 0.3, START + 0.9);
  const cold = blast > 0 ? 1 : 0;
  const hug = lerp(14, -24, blast);
  ch += actor('grandpa', t, { x: 650 + shiver(t, 0.4 * cold, 1), y: fl, s, turn: 0.25, lean, armL: lerp(14, -10, blast), armR: 25, props: [grandpaMop()], face: blast > 0 ? { name: 'happy', eyes: { upper: 0.3 } } : 'happy', keysSwing: 8 * Math.sin(t * 30) * cold }, { arms: false });
  ch += actor('dex', t, { x: 1235 + shiver(t, cold, 2), y: fl, s, turn: -0.2, lean, armL: hug, armR: hug, face: blast > 0 ? { name: 'scared', mouth: 'teeth' } : 'neutral', headY: 4 * Math.sin(t * 50) * cold }, { arms: false });
  ch += actor('juno', t, { x: 880 + shiver(t, cold * 0.8, 3), y: fl, s, lean, armL: lerp(14, -18, blast), armR: lerp(14, -18, blast), face: blast > 0 ? { name: 'happy', eyes: { upper: 0.2 } } : 'neutral', ...A.walkFront(t * 12, bump(t, START + 0.75, cA2 + 0.2) * 0.6) }, { arms: false, energy: 0.5 });
  ch += actor('pip', t, { x: 1065, y: fl + 22, s, turn: -0.1, armL: 30 + 40 * blast, armR: 30 + 40 * blast, face: blast > 0 ? { name: 'excited' } : 'cute', bodyY: 8 * Math.abs(Math.sin(t * 9)) * blast }, { arms: false });
  // breath puffs in the cold
  let br = '';
  if (blast > 0) for (const [x, sc, z, sd] of [[650, s, ZS.grandpa, 1], [880, s, ZS.juno, 2], [1235, s, ZS.dex, 3], [1065, s, ZS.pip, 4]]) br += FM.breath(x + 30, mouthY(fl, sc, z), t, blast, 1, sd * 0.3);
  let w = lf.back + ch + br + lf.front + lf.snow;
  let o = view(cam, w, 1);
  o += ding(1330, 260, seg(t, START, START + 0.95), 0.75, { text: '' });
  return o;
}
// A2: wide of the Cooling Room, the gang waddles out; push in for Juno's pun; Dex slips
function shotCoolWide(t) {
  const push = seg(t, tWhere - 0.35, tWhere + 0.15);
  const cam = camKeys(t, [[cA2, { zoom: 0.98, x: -330, y: 30 }], [tWhere - 0.35, { zoom: 1.02, x: -220, y: 25 }], [tWhere + 0.15, at(300, 650, 1.7)], [cA3, at(315, 652, 1.76)]]);
  shakeAll(cam, t, [[tSlip + 0.12, 0.3, 6]]);
  const Ly = FM.coolingRoom(t, cam, { snow: 34 });
  const s = 0.42, fl = FM.FLOOR.cooling;
  const walkU = seg(t, cA2, tWhere - 0.1);
  let w = '';
  // Grandpa strides out confidently, Pip waddles and slides around behind
  const gx = lerp(-330, -40, walkU) + 120 * seg(t, tWhere, cA3);
  w += actor('grandpa', t, { x: gx, y: fl, s, view: 'side', flip: true, ...A.walk(t * 9, 0.8), armR: 30, props: [{ svg: mop({ x: 40, y: 0, rot: -14 }), layer: 'front' }], face: 'happy', keysSwing: 6 * Math.sin(t * 9) }, { arms: false });
  const px = lerp(-480, -160, walkU) + 60 * Math.sin(t * 2.5);
  w += actor('pip', t, { x: px, y: fl, s, view: 'side', flip: Math.sin(t * 2.5) > -0.6, ...A.walk(t * 14, 0.7), armL: 70, armR: 70, lean: 8, face: 'excited' }, { arms: false });
  // Juno walks out, stops, turns to camera for the pun
  const jx = lerp(-120, 200, walkU);
  const jFront = t > tWhere - 0.15;
  const wink = t > tChill - 0.05;
  w += actor('juno', t, jFront ?
    { x: jx, y: fl, s, turn: 0.15, armR: wink ? lerp(20, 95, ob(seg(t, tChill - 0.05, tChill + 0.15))) : 30, armL: wink ? 60 : 16, face: wink ? { name: 'smug', eyeR: { type: 'closed' } } : { name: 'talkHappy' } } :
    { x: jx, y: fl, s, view: 'side', flip: true, ...A.walk(t * 10, 0.75), face: 'happy' }, { arms: false, energy: 0.8 });
  // Dex: tiptoes out shivering, then the slip
  const dx0 = lerp(80, 430, walkU);
  if (t < tSlip) {
    w += actor('dex', t, { x: dx0 + shiver(t, 0.6, 4), y: fl, s, turn: walkU < 1 ? 0 : -0.3, view: walkU < 1 ? 'side' : 'front', flip: true, ...(walkU < 1 ? A.walk(t * 10, 0.5) : {}), armL: -24, armR: -24, face: { name: 'nervous', mouth: 'teeth', eyes: { look: [0, 0.6] } } }, { arms: false });
  } else {
    const k = t - tSlip;
    const zip = k > 0.2 ? Math.pow(k - 0.2, 2) * 7000 : 0;
    w += actor('dex', t, { x: dx0 + 40 * Math.min(k, 0.2) / 0.2 + zip, y: fl, s, view: 'side', flip: true, legL: lerp(0, 55, seg(k, 0, 0.15)), legR: lerp(0, -45, seg(k, 0, 0.15)), kneeL: 5, kneeR: 5, armL: 160 + 40 * Math.sin(t * 30), armR: 120 + 50 * Math.sin(t * 27), lean: -14, rot: -8 * seg(k, 0, 0.2), face: { name: 'shocked', mouth: 'O' } }, { arms: false });
    w += C.dust(dx0 + 60, fl - 10, tSlip + 0.05, t);
  }
  // breath + the pun sparkle
  w += FM.breath(jx + (jFront ? 30 : 40), mouthY(fl, s, ZS.juno), t, 0.8, 1, 0.2);
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  const pk = seg(t, tChill + 0.1, tChill + 0.9);
  if (pk > 0 && pk < 1) o += K.sparkles([[1010, 260, 30], [940, 210, 18], [1080, 200, 14]], t) + K.bang('*chill*', 1000, 185, bump(t, tChill + 0.05, tChill + 0.95), 52, -8, '#BFEFFF');
  o += K.bang('WHOA!', 1500, 300, bump(t, tSlip + 0.05, tSlip + 0.5), 90, 8, '#FFFFFF');
  return o;
}
// A3: tracking slide — "No respawn! No respawn!"
function shotSlide(t) {
  const k = t - cA3;
  const dist = 1500 * k + 300 * Math.sin(k * 2);
  const cam = { zoom: 1.5, x: -40 + 16 * Math.sin(t * 7), y: 130 + 8 * Math.sin(t * 9) };
  const Ly = FM.coolingRoom(t, cam, { dist, snow: 30, fanSpeed: 1.4 });
  const s = 0.42, fl = FM.FLOOR.cooling;
  const x = 900 + 50 * Math.sin(k * 3.1);
  // spin on the second "No": side → front → side(other way) → back → side
  const sp = seg(t, tSpin - 0.05, tSpin + 0.45);
  const step = sp > 0 && sp < 1 ? Math.floor(sp * 4) : -1;
  const vw = step === 0 ? { view: 'front', turn: 0.6 } : step === 1 ? { view: 'side', flip: false } : step === 2 ? { view: 'back' } : step === 3 ? { view: 'front', turn: -0.6 } : { view: 'side', flip: true };
  const side = vw.view === 'side';
  const dex = actor('dex', t, {
    x, y: fl, s, ...vw, lift: 6 * Math.abs(Math.sin(t * 9)),
    legL: side ? 58 + 8 * Math.sin(t * 13) : 40, legR: side ? -34 + 6 * Math.sin(t * 11) : 40, kneeL: 4, kneeR: 8,
    armL: side ? 150 + 75 * Math.sin(t * 17) : 150 + 30 * Math.sin(t * 25), armR: side ? 160 + 75 * Math.sin(t * 17 + 2.4) : 150 + 30 * Math.cos(t * 23),
    rot: 7 * Math.sin(t * 6), lean: side ? 14 : 0, face: 'scream',
  }, { arms: false });
  // ice shavings spraying back from his shoes
  let spray = '';
  for (let i = 0; i < 22; i++) {
    const age = ((t * 2.2 + hash(i * 1.3)) % 1);
    const sx = x - 30 - age * (420 + hash(i) * 300), sy = fl - 12 - Math.sin(age * Math.PI) * (60 + hash(i * 3) * 90);
    spray += S.circle(sx, sy, 5 + hash(i * 7) * 7, { fill: '#FFFFFF', opacity: f(0.9 * (1 - age)), stroke: '#9FCBEA', 'stroke-width': 2 });
  }
  spray += S.path(`M${f(x - 60)} ${fl + 8} L${f(x - 900)} ${fl + 14}`, ln(10, '#FFFFFF', 0.7)) + S.path(`M${f(x - 40)} ${fl + 24} L${f(x - 700)} ${fl + 34}`, ln(5, '#FFFFFF', 0.5));
  let o = Ly.bg + Ly.mid;
  o += S.g(C.speedLines(-200, 1900, 600, 16, 7, '#FFFFFF', 760), null, { opacity: 0.4 });
  o += view(cam, spray + dex, 1) + Ly.fg + Ly.light;
  o += K.bang('NO RESPAWN!', 1420, 430, bump(t, tSpin - 0.2, tSpin + 0.6), 74, 8, '#FF5A6E');
  return o;
}
// A4: head-on — he slides at the lens and smacks into the ice
function shotSmack(t) {
  const cam = { zoom: 1.0, x: 0, y: 0 };
  shakeAll(cam, t, [[tSmack, 0.45, 26]]);
  const Ly = FM.coolingRoom(t, { ...cam, x: 120, y: 10 }, { snow: 26 });
  const u = seg(t, cA4, tSmack);
  const z = lerp(1, 0.2, Math.pow(u, 1.7));
  const s = 0.32 / z;
  const hit = t >= tSmack;
  const after = Math.max(0, t - tSmack);
  const horizon = 640;
  let fy = horizon + (900 - horizon) * (s / 0.42);
  let x = 960 + 140 * Math.sin(u * 7) * (1 - u);
  if (hit) fy += after > 0.12 ? Math.pow(after - 0.12, 2) * 2600 : 0;
  const pose = hit ? { x, y: fy, s, sx: 1.22, sy: 0.84, rotY: -700, armL: 150, armR: 150, legL: 30, legR: 30, face: { name: 'oof', mouth: 'O' } } :
    { x, y: fy, s, rot: 12 * Math.sin(t * 9), armL: 150 + 30 * Math.sin(t * 21), armR: 160 + 30 * Math.sin(t * 19 + 1), legL: 26 + 10 * Math.sin(t * 15), legR: 26 + 10 * Math.cos(t * 15), face: 'scream' };
  let o = Ly.bg + Ly.mid;
  // rushing streaks around him
  if (!hit) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.2, r0 = 380 + ((t * 900 + i * 90) % 500); o += S.path(`M${f(960 + Math.cos(a) * r0)} ${f(540 + Math.sin(a) * r0)} L${f(960 + Math.cos(a) * (r0 + 140))} ${f(540 + Math.sin(a) * (r0 + 140))}`, ln(8, '#FFFFFF', 0.5 * u)); }
  o += actor('dex', t, pose, { arms: false });
  o += Ly.fg;
  o += E.iceGlass(x, fy - 700 * s * 0.92, hit ? seg(t, tSmack, tSmack + 0.25) : 0, t);
  if (hit && after > 0.12) { for (let i = 0; i < 3; i++) o += S.path(`M${f(x - 300 + i * 240)} ${f(fy - 900 * s)} q20 -40 0 -80`, ln(8, '#FFFFFF', 0.8 * (1 - seg(after, 0.12, 0.5)))); }
  o += K.bang('THUNK!', 1460, 280, bump(t, tSmack, tSmack + 0.5), 120, 10, '#FFFFFF');
  o += flash(t, tSmack, 0.55);
  return o;
}
// A5: Grandpa figure-skates past on his mop; "Bend your knees!"; Dex tries
function shotSkate(t) {
  const gu = seg(t, cA5, tKid - 0.05);
  const gx = t < tKid - 0.05 ? lerp(-420, 640, ease.out(gu)) : t < tBend ? lerp(640, 820, seg(t, tKid - 0.05, tBend)) : lerp(820, 900, ease.out(seg(t, tBend, tKnees + 0.4))) + Math.pow(Math.max(0, t - tKnees - 0.55), 2) * 1600;
  const cam = camKeys(t, [[cA5, at(300, 560, 1.12)], [tKid, at(760, 580, 1.2)], [tBend + 0.2, at(980, 610, 1.42)], [cA6, at(1010, 615, 1.46)]]);
  shakeAll(cam, t, [[tKnees + 0.42, 0.3, 10]]);
  const Ly = FM.coolingRoom(t, cam, { snow: 30, skateMarks: true });
  const s = 0.42, fl = FM.FLOOR.cooling;
  let w = '';
  // skate trail: sparkly arcs behind Grandpa
  const pts = [];
  for (let i = 0; i <= 10; i++) { const tt = t - i * 0.06; if (tt < cA5) break; const xx = tt < tKid - 0.05 ? lerp(-420, 640, ease.out(seg(tt, cA5, tKid - 0.05))) : tt < tBend ? lerp(640, 820, seg(tt, tKid - 0.05, tBend)) : lerp(820, 900, ease.out(seg(tt, tBend, tKnees + 0.4))); pts.push([xx - 120, fl + 18 + 10 * Math.sin(tt * 6)]); }
  if (pts.length > 1) w += S.path('M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L'), ln(8, '#FFFFFF', 0.85)) + K.sparkles(pts.filter((_, i) => i % 3 === 1).map((p, i) => [p[0], p[1] - 24, 12 - i * 2]), t);
  // Dex: wobbly Bambi on the ice, tries to bend his knees, splits, collapses
  const dexX = 1180;
  const tryK = seg(t, tKnees, tKnees + 0.35), fall = seg(t, tKnees + 0.35, tKnees + 0.55);
  w += actor('dex', t, {
    x: dexX, y: fl, s, turn: -0.35, legL: lerp(18 + 10 * Math.sin(t * 9), 70, tryK), legR: lerp(18 + 10 * Math.sin(t * 8 + 1), 70, tryK), kneeL: 10 + 30 * Math.abs(Math.sin(t * 7)), kneeR: 10 + 30 * Math.abs(Math.cos(t * 7)),
    armL: 80 + 30 * Math.sin(t * 6), armR: 100 + 30 * Math.cos(t * 7), rot: 8 * Math.sin(t * 5) * (1 - fall), bodyY: 60 * tryK + 260 * fall, sy: 1 - 0.15 * fall, sx: 1 + 0.12 * fall,
    face: fall > 0.5 ? { name: 'dizzy' } : t > tBend ? { name: 'nervous', eyes: { look: [-0.6, 0] } } : { name: 'scared', eyes: { look: [-0.8, 0] } },
  }, { arms: false });
  // Grandpa: arabesque on the flat mop, pirouette on "kid!", knee-bend demo on "Bend your knees!"
  const spin = seg(t, tKid - 0.08, tKid + 0.42);
  let gpose;
  if (spin > 0 && spin < 1) {
    const st = Math.floor(spin * 6) % 4;
    const vw = [{ view: 'front', turn: 0.7 }, { view: 'back', turn: 0 }, { view: 'front', turn: -0.7 }, { view: 'back', turn: 0 }][st];
    gpose = { ...vw, armL: 170, armR: 170, legL: 4, legR: 4, sx: 0.92 + 0.08 * Math.abs(Math.cos(spin * Math.PI * 3)), face: { name: 'joy' } };
  } else if (t < tBend) {
    const sway = Math.sin(t * 3);
    gpose = { view: 'side', flip: true, armL: 118 + 8 * sway, armR: -105, legL: 0, kneeL: 6, legR: -96 + 6 * sway, kneeR: 0, lean: -26, headRot: -8, face: { name: 'happy', eyes: { type: 'closed' } } };
  } else {
    const dip = bump(t, tBend, tKnees + 0.5);
    gpose = { view: 'front', turn: 0.45, bodyY: 90 * dip, legL: 14, legR: 14, armL: 70 + 10 * dip, armR: 150 + 20 * Math.sin(t * 14), face: { name: 'talkHappy' }, keysSwing: 10 * Math.sin(t * 12) };
  }
  const glideBob = 3 * Math.sin(t * 5);
  w += flatMop(gx + 80, fl + 4, 400);
  w += actor('grandpa', t, { x: gx, y: fl, s, lift: 10 + glideBob, ...gpose }, { arms: false, energy: 0.6 });
  w += FM.breath(gx + 40, mouthY(fl - 12, s, ZS.grandpa), t, 0.7, 1, 0.5) + FM.breath(dexX - 30, mouthY(fl, s, 1), t, 0.9, -1, 0.1);
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  o += K.bang('BEND!', 600, 300, bump(t, tBend, tBend + 0.5), 80, -8, '#FFD21F');
  o += K.bang('*crack*', 1450, 330, bump(t, tKnees + 0.4, tKnees + 0.9), 60, 10, '#BFEFFF');
  return o;
}
// A6: Pip belly-slides past like a penguin — "Ding!"
function shotPenguin(t) {
  const u = seg(t, cA6, cB1);
  const px = lerp(1520, -120, u);
  const cam = { zoom: 2.0, x: lerp(160, -80, u), y: 215 };
  const Ly = FM.coolingRoom(t, cam, { snow: 24 });
  const fl = FM.FLOOR.cooling, ps = 0.5, Z = ZS.pip;
  let w = '';
  // Pip on his belly: side view rotated -90 (head first, belly down), flippers along the body
  const flap = 18 * Math.sin(t * 22);
  const pip = actor('pip', t, { x: px, y: fl + 300 * ps * Z, s: ps, view: 'side', rot: -90, rotY: -420, armL: -12 + flap, armR: -18 - flap, legL: -4, legR: 4, kneeL: 0, kneeR: 0, shadow: false, headRot: -10 + 6 * Math.sin(t * 9), face: { name: 'joy' } }, { arms: false });
  w += S.ellipse(px - 60, fl + 6, 330 * ps, 22 * ps, { fill: '#2A5A8A', opacity: 0.25 });
  // snow spray in front of him + a glittery wake
  for (let i = 0; i < 16; i++) { const a = ((t * 3 + hash(i)) % 1); w += S.circle(px - 380 * ps - a * 180, fl - Math.sin(a * Math.PI) * (40 + hash(i * 2) * 60), 4 + hash(i * 3) * 7, { fill: '#FFFFFF', opacity: f(1 - a), stroke: '#9FCBEA', 'stroke-width': 2 }); }
  w += S.path(`M${f(px + 60)} ${fl + 12} L${f(Math.min(2400, px + 900))} ${fl + 22}`, ln(10, '#FFFFFF', 0.7)) + S.path(`M${f(px + 60)} ${fl + 26} L${f(Math.min(2400, px + 700))} ${fl + 40}`, ln(5, '#FFFFFF', 0.5));
  w += K.sparkles([[px + 220, fl - 20, 14], [px + 420, fl - 10, 10], [px + 640, fl - 16, 8]], t);
  w += pip;
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  // the Ding! — over Pip, synced to the word
  const scrX = 960 + (px - 960 - cam.x) * cam.zoom, scrY = 540 + (fl - 230 - 540 - cam.y) * cam.zoom;
  o += ding(clamp(scrX + 40, 260, 1660), clamp(scrY, 200, 700), seg(t, tDing1 - 0.04, tDing1 + 0.9), 1.0);
  return o;
}

// ================================================================ FLOOR 2 · THE CABLE JUNGLE
// B1: doors part (POV) onto the jungle; pan to the gang at the ledge
function shotJungleOpen(t) {
  const cam = camKeys(t, [[cB1, at(1120, 470, 0.95)], [cB1 + 0.7, at(1000, 480, 0.92)], [tJungle + 0.1, at(250, 560, 0.86)], [cB2, at(160, 580, 0.9)]]);
  const Ly = FM.cableJungle(t, cam, {});
  let w = gangLedge(t, {});
  const dk = seg(t, cB1 + 1.0, cB2);
  w += actor('dex', t, { x: 270 + shiver(t, 0.5, 1), y: J.start.y, s: 0.42, turn: 0.35, armL: -20, armR: -20, bodyY: 10 * Math.abs(Math.sin(t * 20)), legL: 6 + 4 * Math.sin(t * 40), legR: 6 + 4 * Math.cos(t * 40), face: { name: 'scared', eyes: { look: [0.5, 0.9] } } }, { arms: false });
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  o += K.bang('gulp', 1180, 340, bump(t, cB2 - 0.6, cB2 - 0.1) * dk, 54, 8, '#BFE3FF');
  o += E.liftPOV(t, { open: ease.inOut(seg(t, cB1 + 0.08, cB1 + 0.6)), push: seg(t, cB1 + 0.45, cB1 + 1.0), label: '2', prev: '1', flipK: seg(t, cB1 - 0.05, cB1 + 0.2), spill: '#7CF7FF' });
  o += ding(1330, 320, seg(t, cB1, cB1 + 0.8), 0.6, { text: '' });
  return o;
}
// B2: Dex close-up at the edge, dutch angle — "Juno, I can't."
function shotDexScared(t) {
  const cam = camKeys(t, [[cB2, at(275, 505, 2.3)], [cB3, at(290, 510, 2.45)]]);
  const Ly = FM.cableJungle(t, cam, {});
  let w = '';
  const no = t > tCant ? Math.sin((t - tCant) * 16) * 9 * (1 - seg(t, tCant, tCant + 0.8)) : 0;
  w += actor('juno', t, { x: -40, y: J.start.y, s: 0.42, turn: 0.6, armL: 14, armR: 40, face: { name: 'neutral', eyes: { look: [0.9, 0.1] } } }, { arms: false });
  w += actor('dex', t, { x: 280 + shiver(t, 0.8, 1), y: J.start.y, s: 0.42, turn: -0.35, armL: 148, armR: 152, headRot: no, bodyY: 6 * Math.abs(Math.sin(t * 25)), face: { name: 'scared', eyes: { look: [-0.7, 0.3] } } }, { arms: false, energy: 0.6 });
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  return dutch(o, lerp(-8, -5, seg(t, cB2, cB3)));
}
// B3: POV straight down the shaft, dolly zoom, a bolt falls — "That's a real gap. With real... falling."
function shotShaft(t) {
  const fz = lerp(1, 1.75, ease.inOut(seg(t, cB3 + 0.05, tGap1 + 0.6))) + 0.12 * seg(t, tFalling, cB4);
  let o = E.shaftDown(t, { fz, bolt: t - (tReal2 + 0.05), toes: 1, tremble: 1 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s08vigCold)' });
  o += K.bang('...tink', 1180, 520, bump(t, tFalling + 0.62, cB4 + 0.1), 34, 6, '#9FB6E0');
  o += flash(t, cB3, 0.3);
  return dutch(o, 5 * Math.sin(t * 1.3));
}
// B4: Juno turns Dex to face it; the camera sweeps the course while she names the parts (chalk notes)
function shotLookAtIt(t) {
  const tPan = tPlat - 0.35;
  const cam = camKeys(t, [[cB4, at(165, 530, 2.0)], [tPan, at(190, 532, 2.05)], [tPlat + 0.25, at(760, 560, 1.12)], [tRopes + 0.5, at(1260, 470, 1.0)], [tGap2 - 0.1, at(1220, 560, 0.98)], [cB5, at(980, 520, 0.8)]]);
  const Ly = FM.cableJungle(t, cam, {});
  const s = 0.42;
  const turn = seg(t, tIt - 0.2, tIt + 0.25);
  let w = gangLedge(t, { noJuno: true, gFace: { name: 'happy', eyes: { look: [0.8, 0] } } });
  const jPoint = seg(t, tPan - 0.3, tPan);
  w += actor('juno', t, { x: 60, y: J.start.y, s, turn: lerp(0.55, 0.3, turn), armR: lerp(lerp(30, 80, seg(t, cB4, cB4 + 0.3)), 110, jPoint), armL: lerp(20, 60, turn), face: t < tIt ? 'happy' : { name: 'talkHappy', eyes: { look: [0.9, -0.2] } } }, { arms: false, energy: 0.7 });
  w += actor('dex', t, turn < 0.5 ?
    { x: 270, y: J.start.y, s, turn: -0.45, armL: -16, armR: -16, face: { name: 'scared', eyes: { look: [-0.8, 0] } } } :
    { x: 270, y: J.start.y, s, view: 'side', flip: true, armL: -10, armR: -10, lean: -6, face: { name: 'nervous', eyes: { look: [0.8, 0.4] } } }, { arms: false });
  // chalk notes in world space
  const P = J.platforms, ch = '#FFF6C8', yl = '#FFD84D';
  let nb = '';
  P.forEach((p, i) => { nb += E.chalkEllipse(p.x + p.w / 2, p.y + 34, p.w * 0.72, 66, seg(t, tPlat + i * 0.1, tPlat + 0.3 + i * 0.1), ch, 8); });
  nb += E.chalkLabel('PLATFORMS', 760, 590, seg(t, tPlat + 0.05, tPlat + 0.35), yl, 52, -5);
  J.vines.forEach((v, i) => {
    const R = v.len + 70, a0 = -26 * Math.PI / 180, a1 = 26 * Math.PI / 180;
    const p0 = [v.x + Math.sin(a0) * R, v.y + Math.cos(a0) * R], p1 = [v.x + Math.sin(a1) * R, v.y + Math.cos(a1) * R];
    const k = seg(t, tRopes + i * 0.18, tRopes + 0.45 + i * 0.18);
    nb += E.chalk(`M${f(p0[0])} ${f(p0[1])} A${R} ${R} 0 0 0 ${f(p1[0])} ${f(p1[1])}`, R * 0.92, k, ch, 8) + E.chalkArrowHead(p1[0], p1[1], -0.45, k, ch) + E.chalkArrowHead(p0[0], p0[1], Math.PI + 0.45, k, ch);
  });
  nb += E.chalkLabel('SWING!', 1250, 700, seg(t, tRopes + 0.2, tRopes + 0.5), yl, 52, 4);
  const gk = seg(t, tGap2 - 0.05, tGap2 + 0.35);
  nb += E.chalk('M1030 860 L1420 860', 390, gk, ch, 8) + E.chalkArrowHead(1420, 860, Math.PI, gk, ch) + E.chalkArrowHead(1030, 860, 0, gk, ch);
  nb += E.chalkLabel('GAP', 1225, 940, seg(t, tGap2 + 0.1, tGap2 + 0.4), yl, 64, -3);
  let o = Ly.bg + Ly.mid + view(cam, w + nb, 1) + Ly.fg + Ly.light;
  return o;
}
// B5: Juno close-up, warm — "What does that look like?"
function shotJunoAsk(t) {
  const cam = camKeys(t, [[cB5, at(70, 528, 2.6)], [cB6, at(76, 526, 2.8)]]);
  const Ly = FM.cableJungle(t, cam, {});
  let w = '';
  w += actor('juno', t, { x: 60, y: J.start.y, s: 0.42, turn: 0.35, armR: 55, armL: 18, headRot: 6, face: { name: 'happy', brows: { L: [-34, -20], R: [-10, -2] }, eyes: { look: [0.8, 0] } } }, { arms: false, energy: 0.5 });
  w += actor('dex', t, { x: 330, y: J.start.y, s: 0.42, view: 'side', flip: false, armL: -8, armR: -8, face: { name: 'nervous' } }, { arms: false });
  let o = Ly.bg + glow(700, 520, 900, 's08warm', 0.45) + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  o += K.F.sparkle(820, 380, 26 * bump(t, cB6 - 0.7, cB6 - 0.2));
  return o;
}
// B6: Dex realises — the world turns into a neon obby; pull back; ready, run, jump
function shotRealize(t) {
  const obbyK = ease.out(seg(t, tObby - 0.05, tObby + 0.45));
  const pull = seg(t, tJust - 0.3, tJust + 0.1);
  const cam = camKeys(t, [[cB6, at(200, 505, 2.6)], [tObby, at(200, 508, 2.8)], [tJust - 0.3, at(205, 510, 2.85)], [tJust + 0.1, at(420, 540, 1.15)], [cB7, at(520, 530, 1.05)]]);
  shakeAll(cam, t, [[tObby, 0.35, 10]]);
  const Ly = FM.cableJungle(t, cam, { obby: obbyK });
  const tt = tau(t);
  let w = '';
  if (pull < 0.5) {
    const amazed = t > tAn - 0.05;
    const face = t < tObby ? (amazed ? { name: 'amazed', eyes: { look: [0.6, 0] } } : { name: 'confused', eyes: { look: [0.6, 0.2] } }) : t < tJust - 0.5 ? { name: 'excited' } : { name: 'determined', mouth: 'bigGrin' };
    w += actor('dex', t, { x: 200, y: J.start.y, s: 0.42, turn: 0.45, armL: t > tObby ? 40 : 10, armR: t > tObby ? lerp(10, 150, ob(seg(t, tObby + 0.6, tObby + 0.9))) : 10, face, headRot: -4 }, { arms: false, energy: 0.6 });
  } else {
    const st = E.dexAt(tt);
    const pose = E.dexSwingPose(st, t);
    if (st.phase === 'ready') pose.bodyY = 50 * seg(t, tJust - 0.1, tJust + 0.2);
    const isRun = st.phase === 'ready' || st.phase === 'run';
    w += actor('dex', t, { ...pose, x: isRun ? st.feetX : st.hx, y: isRun ? st.feetY : st.hy + E.HANDY, s: E.DS, face: { name: 'determined', mouth: t > tOBBY ? 'scream' : 'bigGrin' } }, { arms: false });
    if (st.phase === 'leap') w += C.dust(E.RUN.x1 - 30, J.start.y - 10, tLeap, t);
  }
  // neon light on his face (no foreground cables over the close-up)
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + (pull < 0.5 ? '' : Ly.fg) + Ly.light;
  if (obbyK > 0 && pull < 0.5) o += glow(1200, 520, 700, 's08neon', 0.35 * obbyK);
  // the transform wave: a ring of pixels sweeping out from his eyes
  const wk = seg(t, tObby - 0.05, tObby + 0.5);
  if (wk > 0 && wk < 1) {
    let px = '';
    for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, r = 120 + wk * 1500 + hash(i) * 80; px += S.rect(960 + Math.cos(a) * r - 18, 420 + Math.sin(a) * r * 0.7 - 18, 36, 36, 6, { fill: ['#FF5A5A', '#FFB000', '#3BD16F', '#3B8BFF', '#B06BFF'][i % 5], opacity: f(1 - wk) }); }
    o += px;
  }
  o += E.obbyHud(t, seg(t, tObby + 0.1, tObby + 0.45), { jumpAt: tLeap - 0.05 });
  o += flash(t, tObby, 0.55, 0.16);
  return o;
}
// B7: low angle, slow motion — Dex flies over the abyss and grabs the vine
function shotLeap(t) {
  const tt = tau(t);
  const st = E.dexAt(tt);
  const Z = 1.75;
  // camera follows his hands with a lag; screen = (p - c) * Z + anchor
  const cx = lerp(st.hx, 640, 0.15) - 60, cy = lerp(st.hy, 420, 0.35);
  const toS = (x, y) => [960 + (x - cx) * Z, 400 + (y - cy) * Z];
  let o = E.lowAngleSky(t, 1, { pan: cx * 1.6 });
  // vine 0 in the same mapping
  const v = J.vines[0], a0 = st.a0 * Math.PI / 180;
  const ex = v.x + Math.sin(a0) * v.len, ey = v.y + Math.cos(a0) * v.len;
  const [sx0, sy0] = toS(v.x, v.y), [sx1, sy1] = toS(ex, ey);
  o += S.path(`M${f(sx0)} ${f(sy0)} Q${f((sx0 + sx1) / 2 + 30)} ${f((sy0 + sy1) / 2)} ${f(sx1)} ${f(sy1)}`, ln(52, '#151515')) + S.path(`M${f(sx0)} ${f(sy0)} Q${f((sx0 + sx1) / 2 + 30)} ${f((sy0 + sy1) / 2)} ${f(sx1)} ${f(sy1)}`, ln(36, '#3BD16F'));
  o += S.rect(sx1 - 32, sy1 - 18, 64, 76, 12, ol('#C9D2E0', 6)) + glow(sx1, sy1, 160, 's08neon', 0.6 * (1 - seg(tt, E.SIM.ev.catch0 - 0.02, E.SIM.ev.catch0 + 0.1)));
  // motion ghosts (flat, cheap) + Dex
  const pose = E.dexSwingPose(st, t);
  const face = { name: 'determined', mouth: K.V.talking('DEX', t) ? undefined : 'bigGrin' };
  for (const [dtau, op] of [[0.075, 0.18], [0.04, 0.3]]) {
    const g = E.dexAt(tt - dtau), gp = E.dexSwingPose(g, t);
    const [gx, gy] = toS(g.hx, g.hy);
    o += S.g(actor('dex', t, { ...gp, x: gx, y: gy + 755 * E.DS * Z, s: E.DS * Z, shade: false, face }, { arms: false }), null, { opacity: op });
  }
  const [hx, hy] = toS(st.hx, st.hy);
  o += actor('dex', t, { ...pose, x: hx, y: hy + 755 * E.DS * Z, s: E.DS * Z, face }, { arms: false });
  // slow-mo streaks
  let sl = '';
  for (let i = 0; i < 10; i++) { const y = 140 + hash(i * 3.3) * 820, x = ((hash(i) * 2400 - t * 300) % 2400 + 2400) % 2400 - 240; sl += S.rect(x, y, 260 + hash(i * 5) * 300, 6, 3, { fill: '#FFFFFF', opacity: 0.25 }); }
  o += sl;
  if (tt >= E.SIM.ev.catch0) o += C.burst(hx, hy, seg(t, tCatch0, tCatch0 + 0.35), '#FFFFFF');
  o += E.obbyHud(t, 1, {});
  o = dutch(o, -9);
  o += flash(t, cB7, 0.35);
  return o;
}
// B8: wide — the real swing: vine 0, let go, vine 1, let go, land
function shotSwing(t) {
  const tt = tau(t);
  const st = E.dexAt(tt);
  const cam = camKeys(t, [[cB8, at(980, 470, 0.9)], [tRel0, at(1450, 450, 0.9)], [tRel1, at(2000, 450, 0.92)], [cB9, at(2180, 470, 0.95)]]);
  const Ly = FM.cableJungle(t, cam, { obby: 1, swing: [st.a0, st.a1] });
  let w = gangLedge(t, { pFace: 'excited', gFace: { name: 'joy' }, jFace: { name: 'excited' }, jArms: false });
  // motion trail of his hands
  const pts = [];
  for (let i = 0; i <= 12; i++) { const g = E.dexAt(tt - i * 0.025); pts.push([g.hx, g.hy + 40]); }
  w += S.path('M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L'), ln(14, '#FFFFFF', 0.45)) + S.path('M' + pts.slice(0, 6).map((p) => `${f(p[0])} ${f(p[1])}`).join(' L'), ln(6, '#FFF1A8', 0.8));
  const pose = E.dexSwingPose(st, t);
  const landed = st.phase === 'land';
  w += actor('dex', t, { ...pose, x: landed ? st.feetX : st.hx, y: landed ? st.feetY : st.hy + E.HANDY, s: E.DS, face: { name: 'excited' } }, { arms: false });
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  for (const tc of [tRel0, tRel1]) o += K.bang('WHOOSH', 1500, 300, bump(t, tc - 0.05, tc + 0.4), 60, -6, '#FFFFFF');
  o += E.obbyHud(t, 1, {});
  return o;
}
// B9: the landing — low angle hero pose — "BABY!"
function shotLand(t) {
  const k = t - cB9;
  const lx = E.SIM.landX;
  const cam = at(lx - 150, 390, 1.7);
  shakeAll(cam, t, [[cB9, 0.4, 22]]);
  const Ly = FM.cableJungle(t, cam, { obby: 1 - 0.0 * seg(t, END, END) });
  const crouch = Math.exp(-k * 7);
  const up = ob(seg(t, cB9 + 0.12, cB9 + 0.38));
  let w = '';
  // dust ring
  if (k < 0.6) w += S.ellipse(lx, J.end.y + 6, 120 + 520 * ease.out(k / 0.6), 26 + 40 * ease.out(k / 0.6), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 16 * (1 - k / 0.6), opacity: f(1 - k / 0.6) });
  w += actor('dex', t, { x: lx, y: J.end.y, s: E.DS, turn: 0.25, bodyY: 200 * crouch * (1 - up), legL: 26, legR: 22, armL: lerp(60, 165, up), armR: lerp(18, 168, up), sy: 1 - 0.1 * crouch, sx: 1 + 0.08 * crouch, face: { name: 'excited' }, headRot: -6 * up }, { arms: false });
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.light;
  o += K.confetti(t, cB9 + 0.1, 50, 4);
  o = dutch(o, -6);
  o += E.obbyHud(t, 1, { clear: seg(t, cB9 + 0.15, cB9 + 0.45) });
  o += flash(t, cB9, 0.5);
  return o;
}

// ================================================================ FLOOR 2½ · THE LOST AND FOUND
const lostDist = (t) => { const k = Math.max(0, t - (tLost - 0.3)); return 660 * (k < 0.4 ? (k * k) / 0.8 : k - 0.2); };
// a mound of junk drawn in front of someone digging (world space)
function mound(x, base, w, h) {
  const d = `M${f(x - w)} ${f(base + 30)} Q${f(x - w * 0.7)} ${f(base - h * 0.7)} ${f(x)} ${f(base - h)} Q${f(x + w * 0.7)} ${f(base - h * 0.7)} ${f(x + w)} ${f(base + 30)} Z`;
  return S.path(d, { fill: 'url(#farmJunk)', stroke: '#151515', 'stroke-width': 7 }) + S.path(d, { fill: 'url(#farmHeapShade)' });
}
// C1: doors (2 → 2½), then the busy treasure-hunt pan
function shotLost(t) {
  const dist = lostDist(t);
  const cam = { zoom: 1.04, x: 0, y: 20 + 10 * Math.sin(t * 1.7) };
  const Ly = FM.lostAndFound(t, cam, { dist });
  const fl = FM.FLOOR.lost, s = 0.42;
  const X = (x) => x - dist;
  let w = '';
  // Grandpa tries on a top hat
  const gx = X(1200);
  if (gx > -500 && gx < 2400) {
    const hatUp = 0.5 + 0.5 * Math.sin(t * 3);
    w += actor('grandpa', t, { x: gx, y: fl, s, turn: 0.3, armL: 165, armR: 25, props: [grandpaMop(), { svg: FM.lostItem('tophat', -40, -1060 - 60 * hatUp, 1.5, -8), layer: 'top' }], face: { name: 'smug', eyes: { look: [0.3, -0.8] } } }, { arms: false });
  }
  // Juno digs, flinging items over her shoulder (ballistic)
  const jx = X(2080);
  if (jx > -500 && jx < 2400) {
    const dig = Math.sin(t * 11);
    w += actor('juno', t, { x: jx, y: fl, s, view: 'side', flip: true, lean: 22, armL: 60 + 60 * dig, armR: 60 - 60 * dig, face: 'excited' }, { arms: false });
    const kinds = ['crown', 'egg', 'skateboard', 'wings', 'headphones', 'shield', 'cat', 'wand'];
    for (let i = 0; i < 8; i++) {
      const t0 = tLost + i * 0.32, a = t - t0;
      if (a < 0 || a > 1.2) continue;
      const ix = jx + 60 - a * (520 + hash(i) * 260), iy = fl - 220 - a * (900 + hash(i * 3) * 300) + 0.5 * 2400 * a * a;
      w += FM.lostItem(kinds[i], ix, iy, 0.55, a * 500 * (i % 2 ? 1 : -1), t);
    }
  }
  w += mound(X(2260), fl, 220, 170);
  // Pip hugs a lost pet dog
  const pxx = X(2760);
  if (pxx > -500 && pxx < 2400) {
    w += FM.lostItem('dog', pxx + 170, fl - 40, 1.3, 0, t * 2);
    w += actor('pip', t, { x: pxx, y: fl, s, turn: 0.5, armL: 70, armR: 95, face: { name: 'love' }, bodyY: 6 * Math.abs(Math.sin(t * 6)) }, { arms: false });
    w += S.path('M0 0 C-14 -16 -30 -4 0 22 C30 -4 14 -16 0 0 Z', ol('#FF6FB5', 4)).replace('<path', `<path transform="translate(${f(pxx + 90)} ${f(fl - 420 - ((t * 120) % 120))})"`);
  }
  // Dex: head-first in a heap, legs kicking
  const dxx = X(3700);
  if (dxx > -500 && dxx < 2400) {
    w += actor('dex', t, { x: dxx, y: fl - 60, s, rot: 180, rotY: -480, legL: 20 + 22 * Math.sin(t * 14), legR: 20 + 22 * Math.cos(t * 14), armL: 20, armR: 20, shadow: false, face: 'neutral' }, { arms: false });
    w += mound(dxx, fl, 320, 350);
    if (Math.sin(t * 9) > 0.3) w += K.bang('rummage', dxx + 260, fl - 420, 1, 40, 8, '#FFE9A8');
  }
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  o += E.liftPOV(t, { open: ease.inOut(seg(t, tHalf + 0.12, tHalf + 0.62)), push: seg(t, tHalf + 0.5, tHalf + 1.05), label: '2½', prev: '2', flipK: seg(t, tHalf - 0.12, tHalf + 0.12), spill: '#FFD08A' });
  if (t < tHalf + 0.6) o += K.bang('½?', 1210, 300, bump(t, tHalf - 0.05, tHalf + 0.6), 70, 10, '#FFD21F');
  return o;
}
// C2: Dex bursts out of the heap with his first sword
function shotSword(t) {
  const dist = 2600;
  const cam = camKeys(t, [[cC2, at(740, 690, 1.85)], [tSword, at(745, 684, 1.92)], [cC3, at(750, 690, 2.02)]]);
  shakeAll(cam, t, [[cC2 + 0.15, 0.3, 12]]);
  const Ly = FM.lostAndFound(t, cam, { dist });
  const fl = FM.FLOOR.lost, s = 0.42;
  const pop1 = ob(seg(t, cC2 + 0.05, cC2 + 0.4));
  const raise = ob(seg(t, tSword - 0.25, tSword + 0.05));
  const hug = seg(t, tThird - 0.4, tThird - 0.1);
  let w = '';
  w += S.circle(720, 520, 520, { fill: 'url(#s08gold)', opacity: f(0.6 * raise) });
  const armR = hug > 0 ? lerp(170, -30, hug) : lerp(30, 170, raise);
  const armL = hug > 0 ? lerp(40, -24, hug) : lerp(30, 40, raise);
  const hp = A.hand(armR, 1);
  const swordRot = hug > 0 ? lerp(0, -150, hug) : lerp(30, 0, raise);
  const face = hug > 0.5 ? { name: 'joy', fx: ['tears', 'blush'] } : raise > 0.5 ? { name: 'amazed', fx: ['sparkles'] } : { name: 'shocked' };
  w += actor('dex', t, { x: 720, y: fl, s, lift: 160 * (1 - pop1), turn: 0.15, armR, armL, headRot: hug > 0 ? 8 * Math.sin(t * 7) : 0, props: [{ svg: S.g(E.swordHeld(1.4, swordRot), `translate(${f(hp[0])} ${f(hp[1])})`), layer: hug > 0.5 ? 'front' : 'front' }], face }, { arms: false });
  w += mound(720, fl + 30, 420, 150);
  // junk falling off him as he pops out
  for (let i = 0; i < 5; i++) { const a = t - cC2 - 0.08; if (a < 0 || a > 0.9) continue; w += FM.lostItem(['cap', 'balloon', 'egg', 'headphones', 'crown'][i], 720 + (i - 2) * 90 + a * (i - 2) * 160, fl - 420 + a * -500 + 0.5 * 2600 * a * a, 0.5, a * 300); }
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  if (raise > 0) o += K.rays(820, 140, 18, 1400, '#FFE88A', 0.12 * raise, t * 15) + K.sparkles([[900, 120, 40], [760, 230, 26], [1050, 260, 22]], t);
  o += K.bang('*shing*', 1340, 250, bump(t, tSword, tSword + 0.6), 70, 8, '#FFF1A8');
  return o;
}
// C3: Pip finds the tiny elevator-operator cap — "Ding!"
function shotCap(t) {
  const dist = 3400;
  const cam = camKeys(t, [[cC3, at(980, 690, 2.45)], [cD1, at(980, 690, 2.6)]]);
  const Ly = FM.lostAndFound(t, cam, { dist });
  const fl = FM.FLOOR.lost, s = 0.42;
  const drop = seg(t, cC3 + 0.02, tDing2 - 0.05);
  const capY = lerp(-1700, -985, ease.in(drop));
  const sq = t > tDing2 - 0.05 ? Math.exp(-(t - tDing2) * 10) : 0;
  const salute = ob(seg(t, tDing2, tDing2 + 0.18));
  let w = '';
  w += actor('pip', t, { x: 960, y: fl, s, turn: 0.1, armR: lerp(20, 160, salute), armL: 16, sy: 1 - 0.08 * sq, sx: 1 + 0.06 * sq, props: [{ svg: FM.lostItem('bellhop', 0, capY, 1.55, -6), layer: 'top' }], face: salute > 0.3 ? { name: 'joy' } : { name: 'cute', eyes: { look: [0, -0.9] } } }, { arms: false });
  w += mound(1220, fl, 260, 150) + mound(700, fl + 20, 240, 120);
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  o += ding(1330, 420, seg(t, tDing2, tDing2 + 0.85), 1.1);
  return o;
}

// ================================================================ FLOOR 3 · THE ARCHIVE
// D1: the doors part slowly on the endless hall; the gang walks in (from behind)
function shotArchiveOpen(t) {
  const cam = camKeys(t, [[cD1, { zoom: 1.0, x: 0, y: 0 }], [cD2, { zoom: 1.14, x: 0, y: -18 }]], ease.linear);
  const Ly = FM.archive(t, cam, { view: 'deep', glow: 0.9 });
  const walk = seg(t, cD1 + 1.0, cD2);
  const z = lerp(1, 1.35, walk);
  let w = '';
  const gang = [['dex', 700, 0], ['pip', 860, 1], ['grandpa', 1240, 2], ['juno', 1010, 3]];
  for (const [n, x, i] of gang) {
    const y = lerp(1250, 1040 - i * 6, ease.out(seg(t, cD1 + 0.9 + i * 0.1, cD2 + 0.3)));
    const sc = 0.5 / z;
    const ph = t * 8 + i;
    w += actor(n, t, { x: 960 + (x - 960) / z, y: 430 + (y - 430) / z, s: sc, view: 'back', ...A.walkFront(ph, 0.8), headRot: 6 * Math.sin(t * 0.8 + i), armL: n === 'grandpa' ? 14 : 12, armR: n === 'grandpa' ? 25 : 12, props: n === 'grandpa' ? [grandpaMop()] : [], shadow: false }, { arms: false });
  }
  let motes = '';
  for (let i = 0; i < 18; i++) { const x = hash(i * 3.1) * 1920, y = ((hash(i * 5.7) * 1080 - t * (16 + hash(i) * 20)) % 1080 + 1080) % 1080; motes += S.circle(x, y, 2 + hash(i * 2) * 4, { fill: '#C9FBFF', opacity: f(0.3 + 0.5 * Math.abs(Math.sin(t * 1.5 + i))) }); }
  let o = Ly.bg + motes + w + Ly.fg + Ly.light;
  o += E.liftPOV(t, { open: ease.inOut(seg(t, cD1 + 0.05, cD1 + 1.1)), push: seg(t, cD1 + 0.9, cD1 + 1.7), label: '3', prev: '2½', flipK: seg(t, cD1 - 0.1, cD1 + 0.2), spill: '#C9FBFF' });
  return o;
}
// D2: side track along the shelves — "Every game anyone ever made... is kept here."
function shotArchiveWalk(t) {
  const cam = camKeys(t, [[cD2, at(300, 520, 1.15)], [cD3, at(840, 540, 1.24)]], ease.linear);
  const Ly = FM.archive(t, cam, { glow: 0.85 });
  const fl = FM.FLOOR.archive, s = 0.42;
  const k = (t - cD2);
  const stopJ = cD3 - 0.4, stopG = tSingle - 0.15;
  const jx = 900 - 100 * Math.max(0, stopJ - t);
  const gx = 1130 - 100 * Math.max(0, stopG - t);
  const dx = 640 - 95 * Math.max(0, cD3 - 0.2 - t), px = 760 - 100 * Math.max(0, cD3 - 0.6 - t);
  let w = '';
  const walking = (x, tStop) => t < tStop;
  w += actor('dex', t, { x: dx, y: fl, s, view: 'side', flip: true, ...(walking(dx, cD3 - 0.2) ? A.walk(t * 8, 0.7) : {}), headRot: -8, face: { name: 'amazed', eyes: { look: [0.3, -0.8] } } }, { arms: false });
  w += actor('pip', t, { x: px, y: fl, s, view: 'side', flip: true, ...(walking(px, cD3 - 0.6) ? A.walk(t * 10, 0.7) : {}), armL: 40, headRot: -10, face: { name: 'cute', eyes: { look: [0.3, -0.9] } } }, { arms: false });
  const gStop = t >= stopG;
  w += actor('grandpa', t, gStop ?
    { x: gx, y: fl, s, turn: -0.2, armL: lerp(25, 110, seg(t, stopG, stopG + 0.4)), armR: lerp(25, 120, seg(t, stopG, stopG + 0.4)), props: [grandpaMop(lerp(25, 120, seg(t, stopG, stopG + 0.4)), { rot: 0 })], face: 'happy' } :
    { x: gx, y: fl, s, view: 'side', flip: true, ...A.walk(t * 7, 0.6), armR: 20, armL: lerp(-10, 70, bump(t, cD2 + 1.2, cD2 + 3.2)), props: [{ svg: mop({ x: 60, y: 0, rot: -10 }), layer: 'front' }], face: 'happy', keysSwing: 8 * Math.sin(t * 7) }, { arms: false, energy: 0.6 });
  const notice = seg(t, cD3 - 0.45, cD3 - 0.15);
  w += actor('juno', t, t < stopJ ?
    { x: jx, y: fl, s, view: 'side', flip: true, ...A.walk(t * 8, 0.7), headRot: -8, face: { name: 'amazed', eyes: { look: [0.2, -0.8] } } } :
    { x: jx, y: fl, s, turn: lerp(0.2, 0.6, notice), armL: 14, armR: 20, face: { name: notice > 0.5 ? 'shocked' : 'amazed', mouth: 'o', eyes: { look: [lerp(0.2, 0.9, notice), lerp(-0.6, 0.7, notice)] } } }, { arms: false });
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  return o;
}
// D3: close on the tiny bubble — "Even mine."
function shotEvenMine(t) {
  const cam = camKeys(t, [[cD3, at(950, 672, 2.6)], [cD4, at(960, 676, 2.85)]], ease.linear);
  const Ly = FM.archive(t, cam, { glow: 1 });
  const fl = FM.FLOOR.archive;
  const reach = seg(t, tMine - 0.35, tMine + 0.25);
  let w = actor('juno', t, { x: 835, y: fl, s: 0.42, turn: 0.62, bodyY: 160, armR: lerp(20, 88, reach), armL: 16, face: { name: 'happy', eyes: { look: [0.9, 0.5], pupil: 1.5 }, fx: t > tMine ? ['blush'] : [] } }, { arms: false, energy: 0.3 });
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  o += glow(1060, 700, 520, 's08cyan', 0.45) + glow(700, 470, 420, 's08warm', 0.22);
  return o;
}
// the label card that stays on the shelf when Juno holds her bubble (world space)
function shelfLabel(lit = 0) {
  const J0 = FM.ARCHIVE.juno, lab = 'Bubble Island — 3 visits', w = lab.length * 13 + 40;
  let o = S.ellipse(J0.x, J0.y + J0.r + 6, 54, 12, ol('#E0B84A', 4)) + S.rect(J0.x - w / 2, J0.y + J0.r + 22, w, 40, 10, ol('#FFF4DC', 4)) + TF(lab, J0.x, J0.y + J0.r + 50, 24, '#3A2A20');
  if (lit > 0) o += S.rect(J0.x - w / 2 - 6, J0.y + J0.r + 16, w + 12, 52, 14, { fill: 'none', stroke: '#FFD84D', 'stroke-width': 6, opacity: f(lit) }) + K.F.sparkle(J0.x + w / 2, J0.y + J0.r + 18, 18 * lit);
  return o + S.path(`M${J0.x - 50} -100 L${J0.x + 50} -100 L${J0.x + 150} ${J0.y + J0.r} L${J0.x - 150} ${J0.y + J0.r} Z`, { fill: 'url(#farmConeDown)', opacity: f(0.25 + 0.25 * lit) });
}
// Juno kneeling with the bubble cradled in front of her chest (world)
function junoHolding(t, x, o = {}) {
  const { bodyY = 150, face, turn = 0.3, headRot = 0 } = o;
  const s = 0.42, Z = ZS.juno;
  const by = FM.FLOOR.archive + (-468 + bodyY) * s * Z + Math.sin(t * 1.6) * 2;
  const bub = glow(x, by, 150, 's08cyan', 0.75) + FM.gameBubble(x, by, 52, t, { kind: 'island', glow: 1, seed: 3, bob: false });
  return actor('juno', t, { x, y: FM.FLOOR.archive, s, turn, bodyY, armL: -74, armR: -74, headRot, face }, { arms: false }) + bub;
}
// D4: two-shot, Grandpa crouches beside her — "Especially yours ... gets a shelf."
function shotEspecially(t) {
  const cam = camKeys(t, [[cD4, at(1010, 640, 1.85)], [cD5, at(1000, 650, 2.05)]], ease.linear);
  const Ly = FM.archive(t, cam, { glow: 0.85, juno: false });
  const fl = FM.FLOOR.archive, s = 0.42;
  const lit = seg(t, tShelf - 0.1, tShelf + 0.3);
  const sweep = seg(t, tWorld - 0.2, tWorld + 0.4) * (1 - seg(t, tShelf + 0.5, cD5));
  let w = shelfLabel(lit);
  w += actor('grandpa', t, { x: 1130, y: fl, s, turn: -0.5, bodyY: 110, armL: 62, armR: lerp(20, 115, sweep), keysSwing: 3 * Math.sin(t * 2), face: { name: 'happy', eyes: { look: [-0.8, 0.3] } } }, { arms: false, energy: 0.4 });
  const lookUp = seg(t, cD4 + 0.6, cD4 + 1.0);
  w += junoHolding(t, 900, { face: { name: 'happy', mouth: 'smallSmile', eyes: { look: [lerp(0, 0.8, lookUp), lerp(0.7, -0.2, lookUp)] } } });
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  o += glow(760, 640, 560, 's08warm', 0.2);
  return o;
}
// D5: Juno close — "I always thought my game didn't matter. Three visits. ... But somebody kept it anyway."
function shotJunoQuiet(t) {
  const cam = camKeys(t, [[cD5, at(912, 662, 2.6)], [cD6, at(905, 655, 2.95)]], ease.linear);
  const Ly = FM.archive(t, cam, { glow: 0.7, juno: false });
  const smile = seg(t, tKept - 0.3, tKept + 0.4);
  const face = smile > 0.3 ? { name: 'happy', mouth: K.V.talking('JUNO', t) ? undefined : 'smile', fx: ['tears', 'blush'], eyes: { look: [0.2, 0.6] } } : { name: 'sad', eyes: { look: [0.1, 0.8] } };
  let w = junoHolding(t, 900, { face, turn: 0.15, headRot: -4 + 3 * Math.sin(t * 0.8) });
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  o += glow(900, 870, 520, 's08cyan', 0.25 + 0.2 * smile);
  o += E.visitIcons(1450, 400, t, [tThree, tThree + 0.2, tVisits + 0.1], 1.25);
  return o;
}
// D6: Grandpa, reverse angle — "A game doesn't need a million visits to matter, Juno. It just needs someone who made it."
function shotSomeone(t) {
  const cam = camKeys(t, [[cD6, at(1000, 620, 2.0)], [cD7, at(1025, 612, 2.25)]], ease.linear);
  const Ly = FM.archive(t, cam, { glow: 0.85, juno: false });
  const fl = FM.FLOOR.archive, s = 0.42;
  const pat = seg(t, tJuno - 0.2, tJuno + 0.3) * (1 - seg(t, tSomeone + 1.2, cD7));
  const tap = pat > 0.9 ? 4 * Math.max(0, Math.sin((t - tJuno) * 14)) : 0;
  let w = junoHolding(t, 900, { face: { name: 'happy', mouth: 'smallSmile', fx: pat > 0.5 ? ['blush'] : [], eyes: { look: [0.8, -0.6] } }, turn: 0.35, bodyY: 150 - tap * 2 });
  w += actor('grandpa', t, { x: 1050, y: fl, s, turn: -0.55, bodyY: 80, armL: lerp(30, 150, pat), armR: 20, keysSwing: 3 * Math.sin(t * 2), face: { name: 'happy', eyes: { look: [-0.8, 0.2] } } }, { arms: false, energy: 0.5 });
  let o = Ly.bg + Ly.mid + view(cam, w, 1) + Ly.fg + Ly.light;
  o += glow(1150, 400, 700, 's08warm', 0.25);
  const sk = bump(t, tSomeone, tSomeone + 0.8);
  if (sk > 0) o += K.F.sparkle(740, 330, 30 * sk) + K.F.sparkle(820, 260, 18 * sk);
  return o;
}
// D7: back down the hall — the bubbles at the far end turn grey; something spins in the dark
function shotGreyHall(t) {
  const u = seg(t, cD7, cD8);
  const cam = { zoom: lerp(1.0, 1.12, u), x: 0, y: lerp(0, -40, u) };
  const greyFrom = lerp(0.98, 0.3, ease.inOut(seg(t, tEnd - 0.3, cD8 + 0.2)));
  const Ly = FM.archive(t, cam, { view: 'deep', greyFrom, glow: lerp(0.8, 0.55, u) });
  let o = Ly.bg;
  // the Lag: only a far shadow with two spinning eyes in the darkness
  const lk = seg(t, tEnd, cD8);
  if (lk > 0) o += view(cam, S.g(LAG.lag({ x: 960, y: 400, size: 0.42, t: K.stutterT(t, 6), mood: 'hungry', glitch: 0.2 }), null, { opacity: f(0.22 * lk) }), 1);
  o += Ly.fg;
  let w = '';
  const back = seg(t, tEnd, tEnd + 0.6);
  const gang = [['dex', 760 - 40 * back, 0], ['pip', 1080 + 60 * back, -0.02], ['juno', 960, 0], ['grandpa', 1180, 0]];
  for (const [n, x, dz] of gang) w += actor(n, t, { x, y: 1060 + (n === 'pip' ? 10 : 0), s: 0.44 + dz, view: 'back', headRot: n === 'juno' ? -6 * back : 4 * Math.sin(t + x), bodyY: n === 'dex' ? 20 * back : 0, armL: n === 'pip' ? 12 + 50 * back : 12, armR: n === 'grandpa' ? 25 : 12, props: n === 'grandpa' ? [grandpaMop()] : [], shadow: false }, { arms: false });
  o += w;
  o += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s08greyCreep)', opacity: f(0.15 + 0.4 * u) });
  return o;
}
// D8: one bubble on the shelf drains to grey and cracks — "...the bubbles were turning grey."
function shotGreyBubble(t) {
  const u = seg(t, cD8, END);
  const cam = { zoom: lerp(2.3, 2.5, u), x: lerp(1300, 1260, u) - 960, y: 600 - 540 };
  const gx = lerp(2300, 1250, ease.inOut(seg(t, cD8, tGrey + 0.2)));
  const Ly = FM.archive(t, cam, { glow: 0.6, greyX: gx, juno: false });
  let o = Ly.bg + Ly.mid + Ly.fg;
  const drain = ease.inOut(seg(t, tGrey - 0.7, tGrey + 0.25));
  const crack = seg(t, tGrey + 0.05, tGrey + 0.35);
  const lift = Math.max(0, t - tGrey - 0.5);
  o += glow(960, 560, 400, 's08cyan', 0.5 * (1 - drain));
  o += S.ellipse(960, 762, 150, 30, ol(drain > 0.5 ? '#9AA3B2' : '#E0B84A', 6));
  o += S.g(E.drainingBubble(960, 560 - lift * 110, 190, t, drain, 'castle', 2, crack), `rotate(${f(lift * 14)} 960 560)`);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#5A6070', opacity: f(0.18 * drain) });
  o += K.bang('crk', 1150, 330, bump(t, tGrey + 0.05, tGrey + 0.5), 48, 10, '#C8CED8');
  return o;
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [cA2, shotDoors1], [cA3, shotCoolWide], [cA4, shotSlide], [cA5, shotSmack], [cA6, shotSkate], [cB1, shotPenguin],
  [cB2, shotJungleOpen], [cB3, shotDexScared], [cB4, shotShaft], [cB5, shotLookAtIt], [cB6, shotJunoAsk], [cB7, shotRealize], [cB8, shotLeap], [cB9, shotSwing], [cC1, shotLand],
  [cC2, shotLost], [cC3, shotSword], [cD1, shotCap],
  [cD2, shotArchiveOpen], [cD3, shotArchiveWalk], [cD4, shotEvenMine], [cD5, shotEspecially], [cD6, shotJunoQuiet], [cD7, shotSomeone], [cD8, shotGreyHall], [Infinity, shotGreyBubble],
];
const WHIPS = [cA3, cA4, cA5, cA6, cB2, cB6, cC2, cC3];
function scene(t) {
  const sh = SHOTS.find(([b]) => t < b);
  let o = sh[1](t);
  for (const tc of WHIPS) o += C.whiteFlash(0.3 * bump(t, tc - 0.05, tc + 0.07));
  return o;
}
function look(t) {
  if (t < cB1) return { grade: 'cool', vignette: 0.55 };
  if (t < cB6) return { grade: 'cool', vignette: 1 };
  if (t < cC1) return { grade: null, vignette: 0.75 };
  if (t < cD1) return { grade: 'warm', vignette: 0.85 };
  if (t < cD3) return { grade: 'cool', vignette: 0.8 };
  if (t < cD7) return { grade: 'warm', vignette: 0.95 };
  return { grade: 'night', vignette: 1 };
}
function timer(t) {
  const sec = 3 * 3600 - (t - START);
  return { sec, glitch: t >= cD7 ? 0.15 + 0.35 * seg(t, cD8, END) : 0 };
}

module.exports = { scene, look, timer, DEFS: E.DEFS, _T: { cA2, cA3, cA4, cA5, cA6, cB1, cB2, cB3, cB4, cB5, cB6, cB7, cB8, cB9, cC1, cC2, cC3, cD1, cD2, cD3, cD4, cD5, cD6, cD7, cD8, tSmack, tRunStart, tLeap, tCatch0, tRel0, tCatch1, tRel1, tLand, SLOW0, SLOW1 } };
