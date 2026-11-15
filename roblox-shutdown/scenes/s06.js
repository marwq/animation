// SC 06 · ДОРОГА — dawn at Dex's door ("It has snacks"), Pip the stowaway, the road gets laggier (frozen birds,
// rubber-banding truck, the loading cow), Betsy never over 40, the van lags BACKWARDS past the same cactus,
// "Recalculating...", the no-plan plan, the buffering cashier, "Are we there yet? Ding?", the canyon sunrise.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const C = K.C;
const A = require('./acting');
const FM = require('./farm');
const SETS = require('./sets');
const E = require('./s06_env');
const { G, tr, outT, outTF, R, P, Ci, flash } = E;
const { keyRing } = require('../rig/cast');
const { L } = K.V;

const START = K.V.scene('SC 06').start, END = K.V.scene('SC 07').start;
const l = Array.from({ length: 23 }, (_, i) => L('06.' + i));
const W = (i, w, n = 0) => l[i].word(w, n).t0;

// ---------------------------------------------------------------- cut times (all from the voice)
const tB = W(0, 'key') - 0.06, tC = W(0, 'and') - 0.05, tD1 = l[1].a - 0.32, tD2 = W(1, 'has') - 0.1;
const tE = l[2].a - 0.25, tF = l[3].a - 0.2, tG = l[4].a - 0.15, tG2 = l[5].a - 0.2;
const tH1 = l[6].a, tH2 = W(6, 'laggier') - 0.35, tI1 = l[7].a - 0.1, tI2 = W(7, 'That') - 0.15;
const tI3 = l[7].b + 0.4, tI4 = l[8].a - 0.3, tJ1 = W(8, 'Betsy') - 0.2, tJ2 = W(8, 'forty') - 0.25, tJ3 = W(8, 'since') - 0.3;
const tK1 = l[9].a - 0.15, tK2 = W(9, 'lag') - 0.3, tL1 = l[10].a - 0.15, tL2 = W(10, 're') - 0.45, tM = l[11].a - 0.3;
const tN1 = l[12].a - 0.1, tN2 = W(12, 'The', 1) - 0.15, tN3 = W(12, 'down') - 0.12, tO = l[13].a - 0.05, tP = l[14].a - 0.3;
const tQ = l[15].a - 0.1, tR1 = l[16].a - 0.05, tR2 = W(16, 'The') - 0.2, tS = l[17].a - 0.25, tU = l[19].a - 0.05;
const tV = l[20].a - 0.25, tW = l[21].a - 0.4, tX1 = l[22].a - 0.2, tX2 = W(22, 'The') - 0.14;
const tHonk = W(0, 'van'), tDing = l[4].a, tRe = [W(10, 're'), W(10, 're', 1), W(10, 'recalculating', 2)];
const tKick = [W(1, 'respawn'), W(1, 'checkpoints'), W(1, 'mini-map')];

// ---------------------------------------------------------------- small helpers
const Z = { juno: 0.95, dex: 1, pip: 0.72, grandpa: 1.06, cashier: 1.06 };
// world point of a front-view hand
const handAt = (x, y, s, name, a, side) => { const [hx, hy] = A.hand(a, side); const k = s * (Z[name] || 1); return [x + hx * k, y + hy * k]; };
// how much the world lags (grows on the road)
function lagAt(t) {
  if (t < tH1) return 0;
  if (t < tX1) return clamp(lerp(0.15, 0.8, (t - tH1) / (tL2 - tH1)), 0, 0.8) * (t >= tR1 && t < tV ? 0.6 : 1);
  return 0;
}
const blanketProps = (pose, t) => [...E.dexBlanket(), E.onHead(pose, E.nightcap(t))];
// Dex with his blanket + nightcap: needs explicit headRot so the cap follows the head
function dex(t, pose, act = {}) {
  const hr = pose.headRot ?? (K.V.talking('DEX', t) ? 4 * Math.sin(t * 2.3) : 0);
  const p = { headRot: hr, headY: 0, ...pose };
  return actor('dex', t, { ...p, props: [...(pose.props || []), ...(pose.cap === false ? [] : blanketProps(p, t))] }, act);
}
// van occupants (drawn in a window slot at the slot anchor)
function occupants(t, o = {}) {
  const vol = o.vol ?? false;
  const base = { x: 0, y: 0, s: 0.36, shadow: false, volume: vol };
  const w0 = o.grandpa === false ? '' : actor('grandpa', t, { ...base, turn: 0.55, ...(o.grandpa || {}) }, { energy: 0.6 });
  const w1 = o.juno === false ? '' : actor('juno', t, { ...base, turn: 0.35, ...(o.juno || {}) }, { energy: 0.6 });
  let w2 = '';
  if (o.pip !== false) w2 += actor('pip', t, { ...base, x: 95, turn: 0.4, ...(o.pip || {}) }, { energy: 0.6 });
  if (o.dex !== false) w2 += dex(t, { ...base, x: -60, turn: 0.3, ...(o.dex || {}) }, { energy: 0.7 });
  return [w0, w1, w2];
}
// Betsy on the road (side view, facing right); extra world-space svg behind/in front
function roadShot(t, cam, o = {}) {
  const Lr = FM.desertRoad(t, cam, { time: o.time ?? 0.2, dist: o.dist ?? 0, lag: o.lag ?? 0, truck: o.truck, clouds: o.clouds ?? 5, birds: o.birds ?? 4, fg: o.fg ?? true, sunX: o.sunX, sunY: o.sunY });
  const vx = o.vx ?? 960, vs = o.vs ?? 0.6;
  let w = o.behind || '';
  if (o.van !== false) {
    const van = FM.van(vx, FM.ROAD.near, vs, t, { windows: o.windows || occupants(t, o.occ || {}), bounce: o.bounce ?? 0.5, wheelSpin: o.spin ?? t * 420, smoke: o.smoke ?? 0.5, dust: o.dust ?? 0.5, lagK: o.lagK ?? 0 });
    w += o.vanGhost ? K.ghost(van, o.vanGhost, 0.3) : van;
  }
  w += o.front || '';
  return Lr.bg + E.fixMid(Lr, cam) + view(cam, w, 1) + Lr.fg + (o.after || '');
}
// van-rear interior: bg + bench (Dex, Pip, extra) + seat backs + front row (Juno, Grandpa) + dashboard
const VR = FM.VANIN.rear;
function vanRear(t, cam, o = {}) {
  const Lv = FM.vanInterior(t, { view: 'rear', cam, time: o.time ?? 0.2, lag: o.lag ?? lagAt(t), bounce: o.bounce ?? 0.35, steer: o.steer ?? 0 });
  const by = (o.bounce ?? 0.35) * (3 * Math.sin(t * 15) + 2 * Math.sin(t * 6.1));
  let bench = o.benchBack || '';
  if (o.dex !== false) bench += dex(t, { x: VR.dex.x, y: VR.dex.y + by, s: VR.dex.s, ...(o.dex || {}) }, o.dexAct || {});
  if (o.pip !== false) bench += actor('pip', t, { x: VR.pip.x, y: VR.pip.y + by, s: VR.pip.s, ...(o.pip || {}) }, o.pipAct || {});
  bench += o.bench || '';
  let front = '';
  if (o.juno !== false) front += actor('juno', t, { x: VR.passenger.x, y: VR.passenger.y + by * 1.2, s: VR.passenger.s, turn: 0.25, ...(o.juno || {}) }, o.junoAct || {});
  if (o.grandpa !== false) front += actor('grandpa', t, { x: VR.driver.x, y: VR.driver.y + by * 1.2, s: VR.driver.s, turn: -0.25, armL: 48, armR: 48, ...(o.grandpa || {}) }, { arms: false, ...(o.gpAct || {}) });
  front += o.front || '';
  return Lv.bg + view(cam, bench, 1) + Lv.mid + view(cam, front, 1) + Lv.fg + (o.dark ? E.wash('#14183A', o.dark) : '');
}
// camera helper: centre on world point (x, y) at zoom z
const JX = 1040; // Juno's mark on the sidewalk (left of Betsy)
const at = (x, y, zoom, extra = {}) => ({ zoom, x: x - 960, y: y - 540, ...extra });
const lerpCam = (a, b, u) => ({ zoom: lerp(a.zoom, b.zoom, u), x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
const blueRoll = (x, y, s, rot) => G(R(-110, -26, 220, 52, 26, ol('#2457A8', 6)) + Ci(-110, 0, 26, ol('#5C8AD8', 5)) + Ci(-110, 0, 10, { fill: '#2457A8' }) + P('M-60 -26 L-60 26 M20 -26 L20 26', ln(3, '#9CC0F0')), tr(x, y, s, rot));

// ================================================================ SHOTS
// A — dawn, Dex's street: Betsy at the kerb, Grandpa at the wheel, Juno on the sidewalk. HONK on "van".
function shotA(t) {
  const cam = camKeys(t, [[START, at(1300, 560, 0.9)], [tB, at(1380, 600, 1.06)]]);
  const sh = K.shake(t, tHonk, 0.35, 8); cam.sx = sh.sx; cam.sy = sh.sy;
  const Lh = E.dexHouse(t, cam);
  const honk = bump(t, tHonk - 0.05, tHonk + 0.35);
  const vanS = FM.van(E.DEXH.van.x, 1052, E.DEXH.van.s, t, { windows: occupants(t, { vol: true, juno: false, dex: false, pip: false, grandpa: { armR: 40 + 120 * honk, face: { name: 'joy' } } }), smoke: 0.8 + honk, bounce: 0.15 + 0.6 * honk, lights: 0.6 });
  const ja = seg(t, tHonk - 0.2, tHonk + 0.2);
  const juno = actor('juno', t, { x: JX, y: 975, s: 0.56, turn: lerp(0.1, 0.45, ja), armR: 20 + 60 * bump(t, tHonk - 0.3, tB), props: [{ svg: blueRoll(-170, -330, 1, -70), layer: 'front' }] }, { energy: 1.1 });
  let o = Lh.bg + Lh.mid + view(cam, vanS + juno, 1) + Lh.fg + Lh.light;
  o += view(cam, K.bang('HONK!', 1930, 610, seg(t, tHonk, tHonk + 0.12) * (1 - seg(t, tHonk + 0.6, tHonk + 0.75)), 110, -10, '#FFE14D'), 1);
  return o;
}
// B — insert: Grandpa holds up the key ring, the golden key glints on "key"
function shotB(t) {
  const u = seg(t, tB, tC);
  let o = R(0, 0, 1920, 1080, 0, { fill: 'url(#farmSkyDawn)' });
  for (let i = 0; i < 9; i++) o += Ci(hash(i * 3) * 1920, 200 + hash(i * 7) * 700, 60 + hash(i) * 120, { fill: i % 2 ? '#FFD98A' : '#FF9AB8', opacity: 0.18 });
  const lift = ease.outBack(clamp(u * 3, 0, 1));
  const sw = Math.sin(t * 9) * 16 * (1 - u * 0.6);
  let hand = P('M1920 760 L1240 520 L1180 640 L1920 960 Z', ol('#E0A53A', 8)) + P('M1260 540 L1200 640', ln(10, '#C48A26'));
  hand += R(1090, 470, 170, 150, 60, ol('#EDC1A0', 7)) + P('M1110 520 L1170 520 M1104 560 L1166 560', ln(5, '#D9A683'));
  const ring = keyRing({ x: 0, y: 0, s: 4.2, swing: sw, gold: true, n: 9 });
  let o2 = G(ring, tr(1120, 520));
  const glint = bump(t, W(0, 'key') - 0.02, W(0, 'key') + 0.5);
  o2 += K.F.sparkle(1060, 860, 70 * glint) + K.F.sparkle(1180, 760, 40 * glint) + K.rays(1100, 820, 10, 300, '#FFF1B0', 0.25 * glint, t * 50);
  o += G(hand + o2, `translate(0 ${f((1 - lift) * 500)}) translate(960 540) scale(${f(lerp(1, 1.08, u))}) translate(-960 -540)`);
  return o;
}
// C — Juno: "...and a team." She spreads her arms, then points at the house → whip-pan left
function shotC(t) {
  const cam = at(1240, 640, 1.5);
  cam.x += E.whipX(t, tD1, -1);
  const Lh = E.dexHouse(t, cam);
  const spread = ease.outBack(seg(t, W(0, 'team') - 0.3, W(0, 'team')));
  const point = seg(t, W(0, 'team') + 0.35, tD1 - 0.05);
  const juno = actor('juno', t, { x: JX, y: 975, s: 0.56, turn: lerp(0, -0.5, point), armL: lerp(lerp(20, 120, spread), 100, point), armR: lerp(20, 120, spread) * (1 - point) + 10 * point, face: { name: 'talkHappy' } }, { arms: false, energy: 1.2 });
  const vanS = FM.van(E.DEXH.van.x, 1052, E.DEXH.van.s, t, { windows: occupants(t, { vol: true, juno: false, dex: false, pip: false, grandpa: { turn: -0.2, armR: 30, face: { name: 'happy' } } }), smoke: 0.7, bounce: 0.1 });
  return Lh.bg + Lh.mid + view(cam, vanS + juno, 1) + Lh.fg + Lh.light + E.whipFx(t, tD1);
}
// D1 — Dex in his doorway (blanket, nightcap): "No way."
function shotD1(t) {
  const cam = camKeys(t, [[tD1, at(860, 560, 1.06)], [tD2, at(840, 570, 1.14)]]);
  cam.x += E.whipX(t, tD1, -1);
  const Lh = E.dexHouse(t, cam);
  const no = bump(t, l[1].a - 0.05, W(1, 'Real') - 0.1);
  const back = ease.out(seg(t, l[1].a, l[1].a + 0.4));
  const pose = { x: E.DEXH.door.x + 10 - 20 * back, y: E.DEXH.floor, s: 0.58, headRot: 14 * Math.sin(t * 22) * no, lean: -6 * back, armL: lerp(20, 62, back), armR: lerp(20, 30, back), face: { name: 'scared', fx: ['sweat'] } };
  return Lh.bg + Lh.mid + view(cam, dex(t, pose, { arms: false, energy: 1.2 }), 1) + Lh.fg + Lh.light + E.whipFx(t, tD1);
}
// D2 — closer: respawn / checkpoints / mini-map pop up next to him and get crossed out
function shotD2(t) {
  const steps = tKick.reduce((n, tk) => n + (t > tk - 0.05 ? 1 : 0), 0);
  const kick = Math.max(...tKick.map((tk) => bump(t, tk - 0.05, tk + 0.25)));
  const cam = at(1000 - steps * 12, 560 + steps * 6, 1.3 + steps * 0.06 - 0.02 * kick);
  const Lh = E.dexHouse(t, cam);
  const flinch = Math.max(...tKick.map((tk) => bump(t, tk + 0.25, tk + 0.6)));
  const end = seg(t, tKick[2], tKick[2] + 0.25);
  const pose = { x: E.DEXH.door.x - 10, y: E.DEXH.floor, s: 0.58, headRot: -6 * flinch + 4 * Math.sin(t * 3), lean: -4 * flinch, armL: lerp(70 + 30 * flinch, 165, end), armR: lerp(30 + 50 * kick, 165, end), lift: 26 * bump(t, tKick[2], tKick[2] + 0.45), face: { name: end > 0.5 ? 'scream' : 'scared', fx: ['sweat2'] } };
  let o = Lh.bg + Lh.mid + view(cam, dex(t, pose, { arms: false }), 1) + Lh.fg + Lh.light;
  ['respawn', 'checkpoint', 'minimap'].forEach((k, i) => {
    const tk = tKick[i], u = seg(t, tk - 0.08, tk + 0.12);
    if (u <= 0) return;
    const x = 1170 + i * 260, y = 360 + (i % 2) * 70;
    o += E.hudTile(k, x, y, 1.1 * ease.outBack(u), t) + E.stampX(x, y - 6, seg(t, tk + 0.32, tk + 0.42), 1.1);
  });
  o += K.bang('NOPE!', 1480, 760, seg(t, tKick[2] + 0.35, tKick[2] + 0.5), 130, 6, '#FF5A6E');
  return o;
}
// E — Juno, deadpan, holds up a bag of chips: "It has snacks."
function shotE(t) {
  const cam = at(JX + 60, 690, 1.75);
  const Lh = E.dexHouse(t, cam);
  const up = ease.outBack(seg(t, W(2, 'has') - 0.15, W(2, 'snacks') + 0.05));
  const pose = { x: JX, y: 975, s: 0.56, turn: 0, armR: lerp(10, 132, up), armL: 14 };
  const [hx, hy] = handAt(pose.x, pose.y, pose.s, 'juno', pose.armR, 1);
  const bag = E.snacks(hx + 10, hy - 50, 0.55, 8 * Math.sin(t * 3), t);
  const vanS = FM.van(E.DEXH.van.x, 1052, E.DEXH.van.s, t, { windows: occupants(t, { vol: true, juno: false, dex: false, pip: false, grandpa: { turn: -0.3 } }), smoke: 0.7, bounce: 0.1 });
  return Lh.bg + Lh.mid + view(cam, vanS + actor('juno', t, { ...pose, face: { name: 'deadpan' } }, { arms: false, energy: 0.4 }) + (up > 0.05 ? bag : ''), 1) + Lh.fg + Lh.light + flash(t, tE, 0.1, 0.4);
}
// F — smash cut: Dex is already in the van, munching. A dust trail from his door. "...I'm in."
function shotF(t) {
  const cam = camKeys(t, [[tF, at(1360, 790, 1.62)], [tG, at(1380, 790, 1.7)]]);
  const Lh = E.dexHouse(t, cam);
  const munch = Math.floor(t * 8) % 2;
  const occ = occupants(t, { vol: true, dex: { turn: 0.15, face: { name: 'happy', mouth: K.V.talking('DEX', t) ? undefined : munch ? 'cat' : 'smallSmile' }, armR: 120, props: [{ svg: E.snacks(...A.hand(120, 1), 0.9, -20, t), layer: 'front' }] }, juno: { turn: 0.3 } });
  occ[1] = ''; occ[2] = occ[2]; // Juno is still on the sidewalk
  const vanS = FM.van(E.DEXH.van.x, 1052, E.DEXH.van.s, t, { windows: occ, smoke: 0.9, bounce: 0.25 });
  let dust = '';
  for (let i = 0; i < 9; i++) { const k = clamp((t - tF) * 1.2 - i * 0.04, 0, 1); dust += Ci(700 + i * 70, 930 - Math.sin(i) * 20 - k * 30, (34 + i * 3) * (1 + k * 0.5), { fill: '#FFFFFF', opacity: f(0.75 * (1 - k)), stroke: '#151515', 'stroke-width': 4 }); }
  const juno = actor('juno', t, { x: JX - 30, y: 975, s: 0.56, turn: 0.6, armL: 20, armR: 30, face: { name: 'deadpan', eyes: { look: [1, 0] } } }, { energy: 0.3 });
  let o = Lh.bg + Lh.mid + view(cam, dust + juno + vanS, 1) + Lh.fg + Lh.light;
  o += C.speedLines(-200, 500, 820, 8, 4, '#FFFFFF', 200);
  return o + flash(t, tF, 0.08, 0.6);
}
// G — inside Betsy (driving): Pip pops out of his cardboard elevator — "Ding!" — Juno sighs: "And a stowaway."
function shotG(t) {
  const pop = ease.outBack(seg(t, tDing - 0.08, tDing + 0.14));
  const cam = t < tG2 ? camKeys(t, [[tG, at(930, 720, 1.42)], [tDing, at(940, 720, 1.46)], [tDing + 0.12, at(980, 700, 1.66)], [tG2, at(970, 710, 1.6)]])
    : camKeys(t, [[tG2, at(970, 710, 1.6)], [tG2 + 0.28, at(620, 760, 1.6)], [tH1, at(600, 760, 1.66)]], ease.out);
  const bx = 1010, by0 = 900, bs = 0.55;
  const hidden = 1 - pop;
  const pip = actor('pip', t, { x: bx + 10, y: by0 + 6 + hidden * 260, s: 0.36, armL: 40 + 120 * pop, armR: 40 + 120 * pop, face: { name: pop > 0.3 ? 'excited' : 'neutral' } }, { arms: false });
  const cid = S.uid('s06box');
  const boxBack = SETS.pipBox(bx, by0 + 4, bs, t, { part: 'back', ding: bump(t, tDing, tDing + 0.8), floor: 1 });
  const boxFront = SETS.pipBox(bx, by0 + 4, bs, t, { part: 'front', ding: bump(t, tDing, tDing + 0.8), floor: 1 });
  const bench = boxBack + S.clipDef(cid, R(bx - 200, 200, 400, by0 - 240 + 2)) + G(pip, null, { 'clip-path': `url(#${cid})` }) + boxFront;
  const jump = bump(t, tDing, tDing + 0.45);
  const dexP = { s: VR.dex.s, lift: 50 * jump, armL: 30 + 120 * jump, armR: 30 + 120 * jump, face: { name: jump > 0.2 ? 'shocked' : 'happy' }, turn: 0.4 };
  const sigh = seg(t, l[5].a - 0.1, l[5].a + 0.3);
  const sg = bump(t, l[5].a + 0.1, l[5].b + 0.3);
  let o = vanRear(t, cam, { pip: false, bench, dex: { ...dexP, x: 760 }, dexAct: { arms: false }, juno: { turn: lerp(0.5, 0, sigh), armR: 12, armL: 12, bodyY: 10 * sg, headRot: -9 * sigh, face: { name: sigh > 0.3 ? 'deadpan' : 'shocked', eyes: sigh > 0.3 ? { upper: 0.62 } : undefined } }, junoAct: { arms: false } });
  const fly = seg(t, tDing + 0.05, tDing + 0.9);
  o += view(cam, E.dingFx(bx + 60, by0 - 330, bump(t, tDing - 0.02, tDing + 0.9), t, 0.9) + (fly > 0 && fly < 1 ? E.snacks(740 - 160 * fly, 560 - 420 * fly + 500 * fly * fly, 0.35, fly * 720, t) : '') + (sg > 0 ? FM.breath(VR.passenger.x + 40, 560, t, sg, 1) : ''), 1);
  return o + flash(t, tG, 0.08, 0.5);
}
// H1 — the road (wide, tracking): "The closer we got to the Server Farm..."
function shotH1(t) {
  const u = seg(t, tH1, tH2);
  const cam = { zoom: lerp(0.82, 0.95, ease.inOut(u)), x: lerp(-60, 40, u), y: lerp(-60, -20, u) };
  return roadShot(t, cam, { time: lerp(0.15, 0.22, u), dist: 2000 + (t - tH1) * 720, lag: lerp(0.15, 0.35, u), vx: 900 + 30 * Math.sin(t * 0.8), vs: 0.55 });
}
// H2 — closer, the lag grows: frozen bird in front of us, the truck rubber-banding; a freeze-jump on "laggier"
function shotH2(t) {
  const hit = W(6, 'laggier');
  const tt = t > hit - 0.05 && t < hit + 0.3 ? hit - 0.05 : E.lagHold(t, 1.3, 0.18, 0.4);
  const u = seg(t, tH2, tI1);
  const cam = { zoom: lerp(1.18, 1.3, u), x: lerp(150, 230, u), y: 40 };
  const glitch = bump(t, hit + 0.25, hit + 0.55);
  const bird = G(P('M-6 -2 L-60 -50 L-12 8 Z M6 -2 L60 -50 L12 8 Z', ol('#3A3044', 5)) + R(-26, -14, 52, 30, 12, ol('#3A3044', 5)) + P('M26 -4 L44 2 L26 8 Z', { fill: '#FFB000' }), tr(1540, 260, 1.6)) + G(K.loadingWheel(0, 0, 26, t, '#FFFFFF', 8, 7), tr(1640, 170));
  let o = roadShot(tt, cam, { time: lerp(0.22, 0.28, u), dist: 2000 + (tt - tH1) * 720, lag: lerp(0.45, 0.75, u), vx: 960, vs: 0.6, lagK: glitch, truck: true });
  o += G(bird, `translate(0 ${f(Math.sin(t * 40) * 1.5)})`);
  if (glitch > 0) o += K.pixelBlocks(0, 0, 1920, 1080, t, glitch * 0.5, '#8A93A6', 120, 3);
  return o;
}
// I1 — close on the van's rear window: Dex whispers "Juno."
function vanClose(t, cam, o = {}) {
  return roadShot(t, cam, { time: o.time ?? 0.3, dist: o.dist ?? 9000 + (t - tI1) * (o.speed ?? 60), lag: o.lag ?? 0.6, vx: 960, vs: 0.6, bounce: 0.15, occ: { vol: true, ...(o.occ || {}) }, truck: false, birds: 2, after: o.after, front: o.front, fg: o.fg ?? false });
}
function shotI1(t) {
  const cam = camKeys(t, [[tI1, at(860, 700, 3.1)], [tI2, at(880, 700, 3.25)]]);
  const turn = seg(t, W(7, 'Juno') + 0.1, W(7, 'Juno') + 0.4);
  return vanClose(t, cam, { occ: { dex: { turn: -0.35, x: -40, face: { name: 'nervous' }, armL: 70, armR: 20 }, juno: { turn: lerp(0.4, -0.6, turn), face: { name: turn > 0.5 ? 'confused' : 'neutral' } }, pip: { turn: 0, face: { name: 'neutral' } } } });
}
// I2 — the cow on the roadside, still loading (four grey cubes → mosaic → almost)
const cowLoad = (t) => {
  if (t < tI2 + 0.35) return 0.05;
  const steps = [[W(7, 'cow'), 0.3], [W(7, 'is'), 0.55], [W(7, 'loading'), 0.62], [W(7, 'loading') + 0.6, 0.78], [tI3 - 0.1, 0.84], [tI4 + 0.25, 0.95], [tI4 + 0.4, 1]];
  let v = 0.05;
  for (const [ts, lv] of steps) if (t >= ts) v = lv;
  return v;
};
function shotI2(t) {
  const u = seg(t, tI2, tI3);
  const cam = at(1000, 820, lerp(1.55, 1.8, ease.inOut(u)));
  const cow = FM.cow(1000, 1040, 0.85, t, { load: cowLoad(t), flip: true });
  return roadShot(t, cam, { time: 0.3, dist: 9300 + (t - tI2) * 20, lag: 0.6, van: false, truck: false, front: cow, fg: false });
}
// I3 — the beat: everyone in the van stares at the cow (heads turning in unison)
function shotI3(t) {
  const u = seg(t, tI3, tI4);
  const cam = at(935, 700, lerp(2.85, 3.0, u));
  const look = { face: { name: 'deadpan', eyes: { look: [0, 0.6] } } };
  const tn = -0.2 * Math.sin(u * 2.4);
  return vanClose(t, cam, { speed: 15, occ: { grandpa: { turn: tn, ...look }, juno: { turn: tn, ...look }, dex: { turn: tn, x: -60, ...look }, pip: { turn: tn, ...look } } });
}
// I4 — the cow finishes loading … and moos, late
function shotI4(t) {
  const cam = at(1000, 820, 1.85);
  const moo = bump(t, tI4 + 0.42, tJ1 + 0.2);
  const cow = FM.cow(1000, 1040, 0.85, t, { load: cowLoad(t), moo, flip: true });
  let o = roadShot(t, cam, { time: 0.3, dist: 9320, lag: 0.6, van: false, truck: false, front: cow, fg: false });
  const mk = seg(t, tI4 + 0.42, tI4 + 0.55);
  if (mk > 0) o += K.bang('m . . o . . o', 1300, 300, mk, 120, -6, '#FFFFFF') + K.loadingWheel(1640, 230, 26, t, '#FFFFFF', 8, 7);
  return o;
}
// J1 — Grandpa at the wheel, cheerful: "Don't worry! Betsy hasn't gone over…"
function shotJ1(t) {
  const cam = camKeys(t, [[tJ1, at(1290, 760, 1.55)], [tJ2, at(1310, 750, 1.65)]]);
  const pat = Math.max(0, Math.sin(t * 9)) * bump(t, tJ1 + 0.2, tJ2);
  return vanRear(t, cam, { grandpa: { turn: -0.15, armR: 48 + 30 * pat, face: { name: 'joy' } }, gpAct: { energy: 1.3 }, juno: { turn: 0.5, face: { name: 'neutral' } } });
}
// J2 — insert: Betsy's speedometer ends at 40
function shotJ2(t) {
  const u = seg(t, tJ2, tJ3);
  let o = R(0, 0, 1920, 1080, 0, { fill: '#3E8F86' }) + R(0, 700, 1920, 400, 0, { fill: '#F2E2BC' }) + R(0, 690, 1920, 22, 0, { fill: '#F08A3C' });
  for (let i = 0; i < 6; i++) o += Ci(200 + i * 330, 160, 40, { fill: '#FFFFFF', opacity: 0.06 });
  const glow = bump(t, W(8, 'forty'), W(8, 'forty') + 0.7);
  o += E.speedo(t, 960, 560, lerp(1.7, 1.95, u), 38.5 + 1.2 * Math.sin(t * 13), glow);
  o += K.bang('MAX!', 1420, 300, seg(t, W(8, 'forty') + 0.05, W(8, 'forty') + 0.2), 80, 10, '#FF5A6E');
  return o + flash(t, tJ2, 0.1, 0.5);
}
// J3 — outside: Betsy chugs, a tumbleweed overtakes her. The "YOU ARE HERE" cactus slides by.
const C0 = 2350;
function cactusX(t) {
  if (t < tK1) return lerp(1650, 1150, seg(t, tJ3, tK1));
  if (t < tK1 + 0.3) return 1150;                                       // freeze
  if (t < tK1 + 0.7) return lerp(1150, 4200, ease.in(seg(t, tK1 + 0.3, tK1 + 0.7)));   // rewind whoosh
  if (t < tK2) return lerp(2300, 1500, seg(t, tK1 + 0.7, tK2));
  return lerp(1320, 420, seg(t, tK2, tL1));
}
function distJK(t) {
  if (t < tK1) return 500 + (t - tJ3) * 360;
  const d0 = 500 + (tK1 - tJ3) * 360;
  if (t < tK1 + 0.3) return d0;
  if (t < tK1 + 0.7) return d0 - 5200 * ease.inOut(seg(t, tK1 + 0.3, tK1 + 0.7));
  return d0 - 5200 + (t - tK1 - 0.7) * 360;
}
function shotJ3(t) {
  const cam = { zoom: 1.02, x: 40, y: -10 };
  const tw = lerp(-300, 2300, seg(t, tJ3 + 0.1, tK1));
  const cact = E.landmarkCactus(cactusX(t), FM.ROAD.shoulderFar + 4, 0.85, t, deserty(0.3));
  const wy = FM.ROAD.far - 70 - Math.abs(Math.sin(t * 6)) * 170;
  const weed = FM.tumbleweed(tw, wy, 95, t * 600) + FM.roadDust(tw - 40, FM.ROAD.far - 10, t, 0.8, -1);
  return roadShot(t, cam, { time: 0.3, dist: distJK(t), lag: 0.5, vx: 900, vs: 0.6, bounce: 0.7, smoke: 1, behind: cact + C.speedLines(tw - 640, tw - 140, FM.ROAD.far - 90, 5, 7, '#FFFFFF', 90) + weed, truck: false });
}
// desert colours (copy of the set's palette for our own cactus)
function deserty(k) {
  const mx = FM.mix;
  return { cactus: mx('#4B8C66', '#4DB35C', k), cactusSh: mx('#346A50', '#33884A', k), cactusHi: mx('#7AB88A', '#8FE07A', k) };
}
// K1 — "Did we just…" — freeze, then the world rewinds a kilometre (RGB ghosts), the same cactus comes back
function shotK1(t) {
  const cam = { zoom: 1.0, x: 40, y: -10 };
  const rw = bump(t, tK1 + 0.25, tK1 + 0.8);
  const frozen = t > tK1 + 0.02 && t < tK1 + 0.3;
  const tt = frozen ? tK1 + 0.02 : t;
  const cact = E.landmarkCactus(cactusX(t), FM.ROAD.shoulderFar + 4, 0.85, tt, deserty(0.3));
  let o = roadShot(tt, cam, { time: 0.3, dist: distJK(t), lag: 0.5 + 0.5 * rw, vx: 900 + 60 * rw * Math.sin(t * 60), vs: 0.6, lagK: rw, spin: rw > 0 ? -t * 1600 : tt * 300, behind: cact, truck: false });
  if (rw > 0) {
    o += K.pixelBlocks(0, 0, 1920, 1080, t, rw * 0.4, '#8A93A6', 160, 9);
    for (let i = 0; i < 16; i++) o += R(hash(i * 2.3 + Math.floor(t * 30)) * 1920 - 300, hash(i * 5.1) * 1080, 700, 14, 7, { fill: '#FFFFFF', opacity: f(0.5 * rw) });
    const bk = seg(t, tK1 + 0.28, tK1 + 0.4);
    o += G(P('M0 -70 L-90 0 L0 70 Z M100 -70 L10 0 L100 70 Z', ol('#FFFFFF', 8)), tr(780, 300, ease.outBack(bk))) + K.bang('-1 KM', 1080, 330, bk, 120, -4, '#FF5A6E');
  }
  if (frozen) o += K.loadingWheel(1760, 980, 30, t, '#FFFFFF', 8, 8);
  return o;
}
// K2 — Dex, deadpan, at the window; the same cactus slides past behind the van … again
function shotK2(t) {
  const cam = camKeys(t, [[tK2, at(850, 650, 2.8)], [tL1, at(860, 650, 2.9)]]);
  const cact = E.landmarkCactus(cactusX(t), FM.ROAD.shoulderFar + 4, 0.85, t, deserty(0.3));
  return roadShot(t, cam, { time: 0.3, dist: distJK(t), lag: 0.55, vx: 960, vs: 0.6, bounce: 0.15, behind: cact, truck: false, birds: 1, fg: false, occ: { vol: true, dex: { turn: 0, x: -50, face: { name: 'deadpan', eyes: { upper: 0.55, look: [0.3, 0] } } }, juno: { turn: 0.6, face: { name: 'confused' } }, pip: { turn: -0.3, face: { name: 'happy' } } } });
}
// L1 — the GPS: "Recalculating. Recalculating."
function gpsText(t) {
  if (t < tRe[0]) return 'RECALCULATING...';
  if (t < tRe[1]) return 'RE...';
  if (t < tRe[2]) return 'RE... RE...';
  if (t < l[10].b + 0.3) return 'RECALCULATING';
  return 'SERVER FARM · 121 MI';
}
function shotL1(t) {
  const u = seg(t, tL1, tL2);
  const cam = at(960, 470, lerp(2.5, 2.75, u));
  cam.sx = (hash(Math.floor(t * 20)) - 0.5) * 6 * bump(t, W(10, 'Recalculating', 1), W(10, 'Recalculating', 1) + 0.4);
  const Lv = FM.vanInterior(t, { view: 'fwd', cam, gps: gpsText(t), gpsLag: 1, time: 0.3, lag: 0.6, bounce: 0.2 });
  return Lv.bg + Lv.fg;
}
// L2 — wider: Grandpa smacks the GPS on every "re…"
function shotL2(t) {
  const u = seg(t, tL2, tM);
  const cam = at(960, 620, lerp(1.25, 1.32, u));
  const hit = Math.max(...tRe.map((x) => bump(t, x - 0.12, x + 0.12)));
  cam.sx = K.shake(t, tRe[0], 0.25, 8).sx + K.shake(t, tRe[1], 0.25, 8).sx;
  const g = gpsText(t);
  const Lv = FM.vanInterior(t, { view: 'fwd', cam, gps: g, gpsLag: g.startsWith('RE') ? 1 : 0, time: 0.3, lag: 0.6, bounce: 0.25 });
  const V2 = FM.VANIN.fwd;
  const slump = seg(t, tRe[2], tRe[2] + 0.6);
  let ch = actor('grandpa', t, { x: V2.driver.x, y: V2.driver.y, s: V2.driver.s, view: 'back', armL: 30, armR: 40, headRot: 6 * hit }, { arms: false });
  ch += actor('juno', t, { x: V2.passenger.x, y: V2.passenger.y + 40 * slump, s: V2.passenger.s, view: 'back', armL: 10, armR: 10, headRot: -10 * slump });
  // Grandpa's tapping arm (mustard sleeve + hand) reaching for the GPS
  const ex = lerp(860, 905, hit), ey = lerp(580, 520, hit);
  const arm = P(`M690 800 Q760 640 ${f(ex)} ${f(ey)}`, ln(70)) + P(`M690 800 Q760 640 ${f(ex)} ${f(ey)}`, ln(56, '#E0A53A')) + Ci(ex + 10, ey - 6, 34, ol('#EDC1A0', 6));
  let o = Lv.bg + view(cam, ch + arm, 1) + Lv.fg;
  tRe.slice(0, 2).forEach((x) => { o += view(cam, C.burst(930, 470, seg(t, x, x + 0.35), '#FFFFFF'), 1); });
  return o;
}
// M — high wide: "Twelve hours left. And we were going backwards." (the van rubber-bands again)
function shotM(t) {
  const u = seg(t, tM, tN1);
  const cam = { zoom: lerp(0.74, 0.8, u), x: lerp(-80, 0, u), y: -120 };
  const rb = K.rubber(t, W(11, 'backwards') - 0.1, 0.9, 170, 3);
  return roadShot(t, cam, { time: 0.32, dist: 14000 + (t - tM) * 650 - rb * 2, lag: 0.7, vx: 900 + rb, vs: 0.5, lagK: Math.abs(rb) > 1 ? 0.8 : 0, truck: true });
}
// N1 — Grandpa, serious (the canyon shadow falls across the van): "The Lag lives in the Core."
function shotN1(t) {
  const u = seg(t, tN1, tN2);
  const cam = at(lerp(1310, 1330, u), 740, lerp(1.6, 1.85, ease.inOut(u)));
  return vanRear(t, cam, { grandpa: { turn: -0.1, face: { name: 'determined' } }, gpAct: { energy: 0.6 }, juno: { turn: 0.55, face: { name: 'nervous' } }, dark: 0.22 * seg(t, tN1, tN1 + 0.6) + 0.1, lag: 0.7 });
}
// N2 — insert: Juno's blueprint of the farm, tilt down to the very bottom: the Core (red circle, cobwebs)
function shotN2(t) {
  const u = seg(t, tN2, tN3);
  const cam = { zoom: lerp(1.35, 1.25, u), x: 0, y: lerp(-40, 760, ease.inOut(seg(t, tN2, W(12, 'bottom') + 0.1))) };
  return E.blueprint(t, cam, seg(t, W(12, 'bottom') - 0.1, W(12, 'floor') + 0.5), seg(t, W(12, 'Nobodys') - 0.1, W(12, 'Nobodys') + 0.4)) + flash(t, tN2, 0.1, 0.4);
}
// N3 — the back bench: Dex gulps under his blanket; Pip's eyes are stars ("bottom floor!")
function shotN3(t) {
  const u = seg(t, tN3, tO);
  const cam = at(1000, 660, lerp(1.8, 1.9, u));
  const hide = seg(t, W(12, 'years') - 0.1, W(12, 'years') + 0.3);
  return vanRear(t, cam, { dex: { turn: 0.2, y: VR.dex.y + 30 * hide, face: { name: 'scared', fx: ['sweat', 'sweat2'] }, armL: 40, armR: 40 }, dexAct: { arms: false }, pip: { turn: -0.2, face: { name: 'amazed', eyes: { type: 'star' } }, armL: 120, armR: 120, lift: 10 * Math.abs(Math.sin(t * 9)) }, pipAct: { arms: false }, dark: 0.2, lag: 0.7 });
}
// O — Juno asks for the plan; the camera pans to Grandpa: "I was hoping you had one. You're the builder."
function shotO(t) {
  const cam = t < tP ? camKeys(t, [[tO, at(640, 760, 1.6)], [tP, at(660, 760, 1.66)]]) : camKeys(t, [[tP, at(660, 760, 1.66)], [tP + 0.35, at(1250, 750, 1.62)], [tQ, at(1270, 750, 1.7)]]);
  const point = seg(t, W(14, "You're") - 0.15, W(14, "You're") + 0.1);
  const roll = { svg: blueRoll(...A.hand(60, -1), 1, -10), layer: 'front' };
  const raise = seg(t, W(13, "what's") - 0.2, W(13, 'plan') + 0.1);
  return vanRear(t, cam, { juno: { turn: 0.55, armL: lerp(60, 128, raise) * (t < tP ? 1 : 0.5), armR: 20, props: [roll], face: t < tP ? undefined : { name: 'confused' } }, junoAct: { arms: false }, grandpa: { turn: lerp(-0.2, -0.6, point), armL: lerp(48, 95, point), face: { name: t > W(14, "You're") ? 'smug' : 'happy' } }, gpAct: { energy: 1 }, dark: 0.12, lag: 0.7 });
}
// Q — Juno, to camera: "Great." … smash zoom: "Great plan, Grandpa."
function shotQ(t) {
  const sm = W(15, 'Great', 1);
  const cam = t < sm ? at(560, 720, lerp(2.0, 2.1, seg(t, tQ, sm))) : at(530, 770, 2.75);
  cam.x += E.whipX(t, tR1, 1);
  return vanRear(t, cam, { juno: { turn: 0, armL: 10, armR: 10, face: { name: 'deadpan', eyes: { upper: 0.45 } } }, junoAct: { arms: false, energy: 0.3 }, dark: 0.1, lag: 0.7 }) + flash(t, sm, 0.08, 0.35) + E.whipFx(t, tR1);
}
// R1 — the gas station: Betsy pulls in (and rubber-bands to a stop)
function shotR1(t) {
  const u = seg(t, tR1, tR2);
  const cam = at(lerp(900, 980, u), 560, lerp(1.0, 1.06, u));
  cam.x += E.whipX(t, tR1, 1);
  const tStop = tR1 + 0.9;
  const vx = t < tStop ? lerp(-500, 620, ease.out(seg(t, tR1, tStop))) : 620 + K.rubber(t, tStop, 0.6, 50, 3);
  const cashier = actor('cashier', t, { ...FM.GAS.cashier, armR: 150, armL: 10, face: { name: 'sleepy', mouth: 'O' }, shadow: false });
  const Lg = FM.gasStation(t, { cam, time: 0.5, lag: 0.5, slushJerk: 1, inside: cashier });
  const vanS = FM.van(vx, FM.GAS.floor + 5, 0.5, t, { windows: occupants(t), bounce: t < tStop ? 0.5 : 0.1, wheelSpin: vx * 0.6, smoke: 0.6, dust: t < tStop ? 0.6 : 0 });
  return Lg.bg + view(cam, vanS, 1) + Lg.fg + E.whipFx(t, tR1);
}
// gas station interior: the frozen cashier (+ customers in front of the counter)
function cashierPose(t) {
  const thaw = t >= l[19].a - 0.02 && t < l[19].b + 0.4;
  if (!thaw) return { ...FM.GASIN.cashier, x: FM.GASIN.cashier.x + (Math.floor(t * 2) % 2) * 2, armR: 150, armL: 10, headRot: -6, face: { name: 'sleepy', mouth: 'O', eyes: { upper: 0.6 } } };
  // unfrozen: twitchy stop-motion wave, glued to the "have a nice day" loop
  const ph = Math.floor(t * 7) % 3;
  return { ...FM.GASIN.cashier, armR: [120, 160, 140][ph], armL: [20, 30, 10][ph], headRot: [-4, 4, 0][ph], bodyY: [0, -8, 4][ph], face: { name: 'happy', eyes: { upper: 0.3 } } };
}
function gasIn(t, cam, o = {}) {
  const thaw = t >= l[19].a;
  const Lg = FM.gasStationInside(t, { cam, register: thaw ? '$2.00' : '...', slushJerk: 1, coffee: seg(t, l[19].a + 0.15, l[19].a + 0.35), lag: thaw ? 0 : 1 });
  const cash = actor('cashier', t, cashierPose(t), { arms: false, energy: 1.5 });
  const ck = thaw ? cash : cash;
  let o2 = Lg.bg + view(cam, ck, 1) + Lg.fg;
  if (!thaw) o2 += view(cam, Ci(960, 300, 70, { fill: '#10131C', opacity: 0.8, stroke: '#E9EDF3', 'stroke-width': 6 }) + K.loadingWheel(960, 300, 44, t, '#E9EDF3', 8, 10), 1);
  return o2 + (o.front ? view(cam, o.front, 1) : '');
}
// R2 — inside: the cashier is frozen mid-yawn: "The cashier was… buffering."
function shotR2(t) {
  const u = seg(t, tR2, tS);
  const cam = at(960, lerp(560, 500, u), lerp(1.0, 1.25, ease.inOut(u)));
  let o = gasIn(t, cam);
  const bk = seg(t, W(16, 'buffering'), W(16, 'buffering') + 0.15);
  if (bk > 0) o += view(cam, G(R(-170, -36, 340, 72, 20, { fill: '#10131C', opacity: 0.85 }) + TF('BUFFERING ' + Math.min(99, Math.floor((t - W(16, 'buffering')) * 3 + 12)) + '%', 0, 14, 36, '#E9EDF3'), tr(960, 410, ease.outBack(bk))), 1);
  return o;
}
// S/T — customers: Grandpa orders politely; Dex leans in and waves a hand: "Is he okay?"
function shotST(t) {
  const lean = seg(t, l[18].a - 0.3, l[18].a + 0.1);
  const cam = t < l[18].a - 0.3 ? at(900, 620, 1.1) : camKeys(t, [[l[18].a - 0.3, at(900, 620, 1.1)], [l[18].a, at(1060, 600, 1.2)], [tU, at(1060, 600, 1.22)]]);
  const wave = Math.sin(t * 14) * 25 * lean;
  const front = actor('grandpa', t, { x: 470, y: 1215, s: 0.66, turn: 0.55, armL: 10, armR: 25 }, { energy: 0.8 }) +
    dex(t, { x: lerp(1560, 1380, ease.out(lean)), y: 1225, s: 0.64, turn: -0.5, lean: -8 * lean, armL: 20, armR: 20 + (120 + wave) * lean, face: { name: 'nervous', eyes: { look: [-0.6, -0.2] } }, cap: false, props: [] }, { arms: false });
  return gasIn(t, cam, { front });
}
// U — the cashier unfreezes: "That'll-be-two-dollars-have-a-nice-day×3" (smash zoom, then stuck on a loop)
function shotU(t) {
  const pull = seg(t, l[19].a + 1.6, l[19].a + 2.0);
  const cam = lerpCam(at(960, 470, 1.9), at(960, 600, 1.08), ease.inOut(pull));
  cam.sx = (hash(Math.floor(t * 24)) - 0.5) * 10 * (1 - pull);
  const back = seg(t, l[19].a + 2.0, tV);
  const front = actor('grandpa', t, { x: 470 - 140 * back, y: 1215, s: 0.66, turn: 0.4, armR: 70, face: { name: 'shocked' }, props: [{ svg: G(P('M-30 0 L30 0 L36 -76 L-36 -76 Z', ol('#FFFFFF', 6)) + R(-38, -84, 76, 14, 6, ol('#E8504A', 5)), tr(...A.hand(70, 1), 1)), layer: 'front' }] }, { arms: false }) +
    dex(t, { x: 1380 + 140 * back, y: 1225, s: 0.64, turn: -0.4, armL: 30, armR: 40, lean: 6 * back, face: { name: 'scared' }, cap: false, props: [] }, { arms: false });
  let o = gasIn(t, cam, { front: pull > 0 ? front : '' });
  o += flash(t, tU, 0.1, 0.6);
  return o;
}
// V — back bench: Pip knocks on the seat back: "Are we there yet? … Ding?"
function shotV(t) {
  const cam = camKeys(t, [[tV, at(1110, 700, 2.5)], [tW, at(1120, 700, 2.65)]]);
  const knock = K.V.talking('PIP', t) && t < W(20, 'Ding') - 0.3 ? 1 : 0;
  const dq = bump(t, W(20, 'Ding') - 0.05, W(20, 'Ding') + 0.9);
  const pip = { turn: -0.1, armR: 70 + 40 * Math.max(0, Math.sin(t * 16)) * knock, armL: 20 + 100 * dq, headRot: -12 * dq, face: { name: dq > 0.2 ? 'cute' : 'sad' } };
  let o = vanRear(t, cam, { pip: { ...pip, y: 835 }, pipAct: { arms: false }, dex: { turn: 0.2, headRot: 18, face: { name: 'sleepy' }, armL: 10, armR: 10 }, dexAct: { arms: false }, lag: 0.3 });
  o += view(cam, E.dingFx(1235, 470, dq, t, 0.45, 'DING?') + C.zzz(t, 840, 470), 1);
  return o;
}
// W — Grandpa, warm: "Not yet, little elevator."
function shotW(t) {
  const cam = camKeys(t, [[tW, at(1300, 750, 1.65)], [tX1, at(1290, 750, 1.72)]]);
  return vanRear(t, cam, { grandpa: { turn: -0.55, face: { name: 'joy' } }, gpAct: { energy: 0.9 }, juno: { turn: 0.1, face: { name: 'happy' } }, lag: 0.2, time: 0.15 });
}
// X1 — Dex at the window, golden light on his face: "Huh."
function shotX1(t) {
  const cam = camKeys(t, [[tX1, at(830, 690, 3.2)], [tX2, at(820, 690, 3.35)]]);
  return roadShot(t, cam, { time: 0.1, dist: 30000 + (t - tX1) * 200, lag: 0, vx: 960, vs: 0.6, bounce: 0.1, truck: false, birds: 3, fg: false, sunX: 1500, sunY: 560, occ: { vol: true, dex: { turn: -0.2, x: -50, face: { name: 'amazed', eyes: { look: [-0.2, -0.3] } } }, juno: { turn: -0.2, face: { name: 'happy' } }, pip: { turn: -0.2, face: { name: 'happy', eyes: { type: 'happy' } } } }, after: E.wash('#FFB04A', 0.12) + K.rays(1700, 200, 12, 1400, '#FFE6A0', 0.08, t * 6) });
}
// X2 — the canyon sunrise, wide. Graphics quality: MAX.
function shotX2(t) {
  const u = seg(t, tX2, END);
  const cam = { zoom: lerp(1.0, 0.86, ease.out(u)), x: lerp(-60, 0, u), y: lerp(-40, -100, u) };
  let o = roadShot(t, cam, { time: 0.1, dist: 32000 + (t - tX2) * 260, lag: 0, vx: 760 + (t - tX2) * 40, vs: 0.42, truck: false, birds: 5, clouds: 4, sunX: 1450, sunY: 600, smoke: 0.3, dust: 0.2, bounce: 0.25 });
  o += K.rays(1450, 600, 16, 1600, '#FFE6A0', 0.1, t * 4) + E.wash('#FF9A4D', 0.06);
  const g = seg(t, W(22, 'actually') - 0.1, W(22, 'good'));
  o += E.gfxBar(1590, 200, 0.3 + 0.7 * g, t, seg(t, tX2 + 0.3, tX2 + 0.6));
  return o;
}

// ================================================================ dispatch
const SHOTS = [
  [tB, shotA], [tC, shotB], [tD1, shotC], [tD2, shotD1], [tE, shotD2], [tF, shotE], [tG, shotF], [tH1, shotG],
  [tH2, shotH1], [tI1, shotH2], [tI2, shotI1], [tI3, shotI2], [tI4, shotI3], [tJ1, shotI4], [tJ2, shotJ1], [tJ3, shotJ2],
  [tK1, shotJ3], [tK2, shotK1], [tL1, shotK2], [tL2, shotL1], [tM, shotL2], [tN1, shotM], [tN2, shotN1], [tN3, shotN2],
  [tO, shotN3], [tQ, shotO], [tR1, shotQ], [tR2, shotR1], [tS, shotR2], [tU, shotST], [tV, shotU], [tW, shotV],
  [tX1, shotW], [tX2, shotX1], [Infinity, shotX2],
];
function scene(t) {
  for (const [tEnd, fn] of SHOTS) if (t < tEnd) return fn(t);
  return shotX2(t);
}
function timer(t) {
  if ((t >= tB && t < tC) || (t >= tJ2 && t < tJ3) || (t >= tN2 && t < tN3) || (t >= tL1 && t < tL2)) return null;
  const sec = 12 * 3600 - (t - START);
  const big = bump(t, W(11, 'Twelve') - 0.15, W(11, 'And') + 0.1);
  return { sec, glitch: clamp(lagAt(t) * 0.6 + 0.6 * big, 0, 1), s: 1 + 0.45 * big, y: 64 + 50 * big };
}
function look(t) {
  if (t >= tN2 && t < tN3) return { grade: null, vignette: 0.5 };
  if (t >= tR2 && t < tV) return { grade: 'warm', vignette: 0.6 };
  if (t >= tL1 && t < tM) return { grade: 'warm', vignette: 0.7 };
  return { grade: 'warm', vignette: 0.75 };
}
// the cashier's run-on line is one 70-letter "word": draw our own stuttering caption instead
const CASH = (() => {
  const a = l[19].a, b = l[19].b, d = (b - a - 1.0) / 3;
  return [[a, a + 1.0, "THAT'LL-BE-TWO-DOLLARS-"], [a + 1.0, a + 1.0 + d, 'HAVE-A-NICE-DAY-'], [a + 1.0 + d, a + 1.0 + 2 * d, 'HAVE-A-NICE-DAY-'], [a + 1.0 + 2 * d, b + 0.3, 'HAVE-A-NICE-DAY.']];
})();
const noCaptions = (t) => t >= l[19].a - 0.01 && t < l[19].b + 0.3;
function overlay(t) {
  if (!noCaptions(t)) return '';
  const c = CASH.find(([a, b]) => t >= a && t < b);
  if (!c) return '';
  const i = CASH.indexOf(c);
  const jit = i > 0 ? (Math.floor(t * 14) % 2) * 6 : 0;
  return G(E.caption(c[2], t, c[0], 'CASHIER', i > 0), `translate(${jit} 0)`);
}

module.exports = { scene, timer, look, noCaptions, overlay, captionY: () => 1010 };
