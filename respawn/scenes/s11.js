// SC 11 · ПОСЛЕ — the warm epilogue (rhymes with SC 06). Out of SC 10's foam wipe: SATURDAY, the bright kitchen, the whole
// family at the table (Mom is home); Dad's brand-new waffle joke (the waffle earns a graduation cap), the rimshot kit plays the
// full BA-DUM TSS this time, Bea: "Waffles are square." (the square gets a dashed outline), Dad deflates — and the hero
// laughs for real, Dad re-inflates on "I LOVE it". MONDAY: "7 × 9?" — his hand shoots up FIRST: "Sixty-four!" — Mr. Fig writes
// 63, the whole class laughs and he laughs with them. The skate park, for real (no pad, LIVES: 1): up the quarter-pipe, the
// board flips away in slow motion, he lands on his butt ("Ouch."), lies on the asphalt laughing, Ivy holds up 6/10, "Attempt
// TWO!". The workshop (bright, his trophy on the bench, no pad): Ivy gives him BOOK OF FAILS · VOL. 2, he writes "FAIL #1:
// Talent show — LESSON: totally worth it!" (the handwriting writes on with the words), they laugh. Dip to night for SC 12.
'use strict';

const K = require('./kit');
const R = require('./respawn');
const H = require('./sets_home');
const SS = require('./sets_school');
const X = require('../rig/extras');
const AC = require('./acting');
const CAST = require('../rig/cast');
const E6 = require('./s06_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, pop, at, toScr, shakeAll, drift, clipTo, zoomAbout, whip, smash, dip, zoomLines, room, SW, SK, BOWL, Z, flat } = E6;

// ================================================================= timing (all from the voice)
function timing() {
  const A = Array.from({ length: 11 }, (_, i) => L('11.' + i));
  const START = K.V.scene('SC 11').start, END = K.V.scene('SC 12').start;   // == main.js RANGES for SC 11
  const w = (i, word, n = 0) => A[i].word(word, n).t0;
  const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
  const C = {};
  C.sat = START;
  C.waffle = w(0, 'Why') - 0.12;
  C.rounded = w(0, 'To', 1) - 0.1;
  C.square = A[1].a - 0.1;
  C.minute = A[2].a - 0.25;
  C.laugh = A[3].a - 0.12;
  C.love = w(3, 'I') - 0.15;
  C.cls = A[4].a - 0.35;
  C.board = A[5].a - 0.1;
  C.classLaugh = A[6].a - 0.06;
  C.skate = A[7].a - 0.1;
  C.real = w(7, 'For') - 0.1;
  C.attempt = w(7, 'Attempt') - 0.18;
  C.ouch = w(7, 'Ouch') + 0.3;
  C.two = A[8].a - 0.3;
  C.gift = A[9].a - 0.15;
  C.write1 = A[10].a - 0.15;
  C.writeFace = w(10, 'Lesson') - 0.2;
  C.write2 = w(10, 'totally') - 0.2;
  C.end = A[10].b + 0.35;
  const ks = Object.keys(C);
  for (let i = 1; i < ks.length; i++) if (C[ks[i]] < C[ks[i - 1]] + 0.2) C[ks[i]] = C[ks[i - 1]] + 0.2;
  const B = {};
  B.satCard = START + 0.12; B.brandNew = w(0, 'brand'); B.school = w(0, 'school'); B.more = w(0, 'more'); B.rounded = w(0, 'well-rounded');
  B.ba = B.rounded + 0.5; B.dum = B.ba + 0.16; B.tss = B.ba + 0.36;
  B.square = w(1, 'square'); B.minute = w(2, 'minute');
  B.worst = w(3, 'worst'); B.LOVE = w(3, 'LOVE');
  B.hand = A[4].a - 0.22; B.sixtyFour = A[4].a; B.write63 = A[5].a + 0.25;
  B.wrong = w(6, 'wrong'); B.fine = w(6, 'fine');
  B.real = w(7, 'real'); B.attempt = w(7, 'Attempt'); B.one = w(7, 'one'); B.ouch = w(7, 'Ouch');
  B.card = B.ouch + 1.1; B.up = A[8].a - 0.12; B.TWO = w(8, 'TWO');
  B.offer = A[9].a + 0.1; B.take = w(9, 'one');
  B.fail = w(10, 'Fail'); B.one10 = w1(10, 'one'); B.talent = w(10, 'Talent'); B.show = w1(10, 'show');
  B.lesson = w(10, 'Lesson'); B.learned = w1(10, 'learned'); B.totally = w(10, 'totally'); B.worth = w1(10, 'it');
  return { A, START, END, C, B };
}
const { A, START, END, C: CUT, B } = timing();

// ================================================================= shared drawing
// the bright Saturday kitchen (everyone home: Mom at the table) + Gary on the counter
function kitchenShot(t, cam, o = {}) {
  const Lk = H.kitchen.layers(t, { time: 'morning', meal: 'pancakes', ...(o.set || {}) });
  const bowl = X.fishbowl({ ...BOWL, t, gary: { yaw: o.garyYaw ?? 30, s: 0.62, lids: 0.46, blink: bump(t % 4.1, 3.6, 3.9) } });
  return room(Lk, cam, { behind: bowl + (o.dad || '') + (o.seated || ''), floor: o.floor || '', over: o.over || '' });
}
const BEA_S = 0.36, YOU_S = SK.seats[1].s, MOM_S = SK.seats[2].s;
const beaSeat = (t, pose = {}, act = {}) => actor('bea', t, { x: SK.seats[0].x, y: SK.seats[0].hip + 306 * BEA_S * 0.68, s: BEA_S, t, ...pose }, act);
const youSeat = (t, pose = {}, act = {}) => actor('you', t, { x: SK.seats[1].x, y: SK.seats[1].y, s: YOU_S, ...pose }, act);
const momSeat = (t, pose = {}, act = {}) => actor('mom', t, { x: SK.seats[2].x + 10, y: SK.seats[2].y + 8, s: MOM_S, turn: -0.3, ...pose }, act);
function dad(t, armR, rot, item, extra = {}, act = {}) {
  const p = E6.dadSpatula({ ...SK.dad, armR, armL: 14, ...extra }, rot, item, extra.itemOpts || {});
  delete p._blade;
  return actor('dad', t, p, { arms: false, ...act });
}
// the hero laughing for real: rocking, tears of joy
const laughPose = (t, k = 1) => ({ bodyY: 7 * Math.abs(Math.sin(t * 13)) * k, headRot: 6 * Math.sin(t * 6.5) * k, lean: -4 * k, face: { name: 'joy', fx: k > 0.5 ? ['tears'] : [] } });
// the waffle Bea holds up (her right hand)
function beaWaffle(pose, outline = 0, t = 0) {
  const h = CAST.handAt(CAST.D.bea, pose, 1);
  let w = E6.waffle(h[0] - 20, h[1] - 110, 1.15, -6);
  if (outline > 0) w += S.g(S.rect(-110, -110, 220, 220, 6, { fill: 'none', stroke: '#FF3B6E', 'stroke-width': 10, 'stroke-dasharray': '26 16', 'stroke-dashoffset': f(t * 120) }), `translate(${f(h[0] - 20)} ${f(h[1] - 110)}) rotate(-6) scale(${f(1.15 * ease.outBack(outline))})`);
  return { ...pose, props: [...(pose.props || []), { svg: w, layer: 'front' }] };
}
// rimshot kit, bottom-right (as in SC 02): full BA-DUM TSS this time
function kitScreen(t) {
  const k = seg(t, B.rounded - 0.25, B.rounded) * (1 - seg(t, B.square - 0.35, B.square - 0.05));
  if (k <= 0) return '';
  let o = E6.drumKit(330, 1000, 0.9, t, { k, hits: [B.ba, B.dum], tss: B.tss });
  o += K.bang('BA-DUM TSS!', 560, 640, pop(t, B.tss - 0.05, 0.25) * k, 100, -6, '#FFE14D');
  return o;
}
const C_SQ = () => CUT.square;

// ================================================================= SHOTS
// ---- 1. SATURDAY: out of SC 10's foam wipe; the whole family; DAD: "Okay, brand new one!"
function foamClear(k) {
  // the foam bubbles keep rising off the top of the frame (continuing SC 10's wipe)
  if (k >= 1) return '';
  let d = '';
  for (let i = 0; i < 22; i++) {
    const x = (i % 6) * 380 - 40 + hash(i) * 80, y = lerp(200 + hash(i * 2.2) * 700, -900 - hash(i * 3.1) * 300, ease.in(k)), r = 260 + 120 * hash(i * 5.5);
    d += `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
  }
  return S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(1 - ease.out(seg(k, 0, 0.35))) }) + S.path(d, { fill: 'none', stroke: '#CFE0F2', 'stroke-width': 20 }) + S.path(d, { fill: '#FFFFFF' });
}
function shSat(t) {
  const cam = drift(t, CUT.sat, CUT.waffle, at(1000, 600, 1.08), at(980, 590, 1.16));
  const raise = ease.outBack(seg(t, B.brandNew - 0.3, B.brandNew + 0.1));
  const dd = dad(t, lerp(40, 160, raise), lerp(80, 20, raise), 'waffle', { face: 'joy', turn: 0.2, lift: 14 * bump(t, B.brandNew, B.brandNew + 0.3) }, { energy: 1.3 });
  const seated = beaSeat(t, { face: { name: 'neutral', eyes: { look: [-0.7, -0.2] } } }) + youSeat(t, { face: { name: 'happy', eyes: { look: [-0.8, -0.2] } } }, { arms: false }) + momSeat(t, { face: { name: 'happy', eyes: { look: [-0.9, -0.1] } } });
  let o = kitchenShot(t, cam, { dad: dd, seated });
  o += E6.calendarCard(1520, 260, seg(t, B.satCard, B.satCard + 0.3), 'SATURDAY', { sub: 'THE MORNING AFTER', col: '#FFB020', rot: 4, out: seg(t, CUT.waffle - 0.3, CUT.waffle) });
  return o + foamClear(seg(t, START, START + 0.55));
}
// ---- 2. DAD: "Why did the waffle go to school?" — the waffle gets a graduation cap
function shWaffle(t) {
  const cam = drift(t, CUT.waffle, CUT.rounded, at(710, 430, 1.8), at(710, 440, 1.95));
  const capK = t >= B.school ? 1 : 0;
  const dd = dad(t, 150, 22, capK ? 'waffleCap' : 'waffle', { face: 'joy', turn: 0.25, itemOpts: { sq: 1 + 0.15 * bump(t, B.school, B.school + 0.25) } }, { energy: 1.2 });
  let o = kitchenShot(t, cam, { dad: dd });
  if (capK) { const [sx, sy] = toScr(cam, 820, 300); o += K.C.burst(sx, sy, seg(t, B.school, B.school + 0.35), '#FFE14D'); }
  return o + whip(t, CUT.waffle, 1);
}
// ---- 3. "To be more... well-rounded!" — push-in; jazz hands; BA-DUM TSS (the full rimshot this time)
function shRounded(t) {
  const camA = drift(t, CUT.rounded, B.rounded, at(660, 470, 2.0), at(660, 470, 2.3));
  const cam = t < B.rounded ? camA : shakeAll(drift(t, B.rounded, CUT.square, at(700, 520, 1.5), at(700, 520, 1.55), ease.out), t, [[B.ba, 0.15, 8], [B.dum, 0.15, 8], [B.tss, 0.25, 12]]);
  const jazz = ease.outBack(seg(t, B.rounded - 0.1, B.rounded + 0.2));
  const dd = dad(t, lerp(150, 165, jazz), 18, 'waffleCap', { face: t < B.rounded ? 'smug' : { name: 'joy', fx: ['sparkles'] }, armL: lerp(14, 150, jazz), turn: 0.1, lift: 20 * bump(t, B.rounded, B.rounded + 0.35) });
  const seated = beaSeat(t, { face: { name: 'deadpan', eyes: { look: [-0.7, -0.2] } } }) + youSeat(t, { face: { name: 'happy', eyes: { look: [-0.8, -0.2] } } }, { arms: false }) + momSeat(t, { face: 'happy' });
  let o = kitchenShot(t, cam, { dad: dd, seated });
  if (t >= B.rounded) o += zoomLines(960, 400, 0.5 * bump(t, B.rounded, B.rounded + 0.5), t, '#FFFFFF');
  return o + kitScreen(t) + smash(t, B.rounded, 0.1, 0.4);
}
// ---- 4. BEA: "Waffles are square." — she holds up hers; the square gets a dashed outline
function shSquare(t) {
  const camA = drift(t, CUT.square, B.square, at(1300, 600, 2.4), at(1300, 600, 2.5));
  const cam = t < B.square ? camA : drift(t, B.square, CUT.minute, at(1295, 560, 3.1), at(1295, 560, 3.2), ease.out);
  const hold = ease.outBack(seg(t, CUT.square, CUT.square + 0.35));
  const pose = beaWaffle({ x: SK.seats[0].x, y: SK.seats[0].hip + 306 * BEA_S * 0.68, s: BEA_S, t, armR: lerp(20, 110, hold), armL: 14, face: { name: 'neutral', eyes: { look: [0, 0] } } }, seg(t, B.square, B.square + 0.3), t);
  let o = kitchenShot(t, cam, { seated: actor('bea', t, pose) + youSeat(t, { face: { name: 'shocked', eyes: { look: [-0.8, 0] } } }, { arms: false }) + momSeat(t, {}) });
  return o + kitScreen(t) + smash(t, B.square, 0.08, 0.3);
}
// ---- 5. DAD: "...I'm gonna need a minute." — he deflates; the cap slides off; the waffle flops into the pan
function shMinute(t) {
  const cam = drift(t, CUT.minute, CUT.laugh, at(660, 500, 1.9), at(660, 520, 1.75));
  const def = ease.inOut(seg(t, CUT.minute, CUT.minute + 0.9));
  const dd = dad(t, lerp(150, 40, def), lerp(22, 150, def), def < 0.5 ? 'waffle' : null, { face: { name: 'sad', fx: def > 0.5 ? ['sweat'] : [] }, bodyY: 30 * def, sy: 1 - 0.06 * def, sx: 1 + 0.04 * def, headRot: 6 * def });
  let over = '';
  if (def >= 0.5) { const k = ease.in(seg(t, CUT.minute + 0.45, CUT.minute + 0.75)); over += E6.waffle(lerp(820, 690, k), lerp(380, SK.pan.y - 10, k), 0.42, 40 * k, { sq: 1 + 0.2 * bump(k, 0.85, 1) }); }
  let o = kitchenShot(t, cam, { dad: dd, over });
  return o;
}
// ---- 6. YOU (laughing): "Dad, that's the worst joke ever." — he laughs for real; Bea giggles; Mom too (rhymes with SC 06's dinner)
function shLaugh(t) {
  const cam = drift(t, CUT.laugh, CUT.love, at(1240, 600, 1.55), at(1260, 600, 1.66));
  const k = seg(t, CUT.laugh, CUT.laugh + 0.3);
  const he = youSeat(t, { turn: -0.15, armL: 30 + 10 * Math.sin(t * 13), armR: 30 + 10 * Math.sin(t * 13 + 1), ...laughPose(t, k) }, { arms: false });
  const bea = beaSeat(t, { turn: 0.3, face: t < B.worst ? { name: 'shocked', eyes: { look: [0.9, 0] } } : { name: 'happy', mouth: 'grin', eyes: { type: 'happy' } }, bodyY: t > B.worst ? 4 * Math.abs(Math.sin(t * 15)) : 0 });
  const mom = momSeat(t, { face: t > B.worst ? 'joy' : 'happy', bodyY: t > B.worst ? 4 * Math.abs(Math.sin(t * 12)) : 0 });
  return kitchenShot(t, cam, { seated: bea + he + mom, dad: dad(t, 40, 150, null, { face: 'sad', bodyY: 30 }) });
}
// ---- 7. "I LOVE it." — Dad re-inflates: love eyes, sparkles, a little hop
function shLove(t) {
  const cam = drift(t, CUT.love, CUT.cls, at(660, 470, 2.0), at(660, 465, 2.2));
  const up = ease.outBack(seg(t, B.LOVE - 0.1, B.LOVE + 0.25));
  const dd = dad(t, lerp(40, 160, up), lerp(150, 20, up), null, { face: up > 0.3 ? 'love' : 'sad', bodyY: 30 * (1 - up), armL: lerp(14, 140, up), lift: 30 * bump(t, B.LOVE, B.LOVE + 0.35) });
  let o = kitchenShot(t, cam, { dad: dd });
  if (up > 0.3) o += K.sparkles([[640, 220, 40], [1300, 260, 34], [1180, 560, 26], [720, 600, 22]].map(([x, y, r], i) => [x, y, r * up * (0.6 + 0.4 * Math.sin(t * 8 + i))]), t);
  return o + smash(t, B.LOVE, 0.08, 0.3);
}
// ---- the classroom (MONDAY)
const CL = SS.SPOTS.classroom;
const KIDS = [[2, 7, 11, 3, 9], [5, 14, 1, 12, 6], [0, 8, 'you', 4, 10]];
function classShot(t, cam, o = {}) {
  const rows = CL.rows.map((row, r) => row.map((seat, c) => {
    const id = KIDS[r][c];
    if (id === 'you') return o.hero || '';
    if (seat.x < -200 || seat.x > 2120) return '';
    const laugh = o.laugh ? o.laugh * (0.7 + 0.3 * hash(r * 5 + c)) : 0;
    const raise = o.raise ? clamp(o.raise * 2 - hash(r * 3 + c) * 1.2, 0, 1) : 0;
    const pose = { x: seat.x, y: seat.y, s: seat.s, volume: false, shade: true, shadow: false, armR: raise ? lerp(10, 160, ease.out(raise)) : 10, armL: 10, bodyY: laugh ? 6 * Math.abs(Math.sin(t * 14 + r + c)) : 0, headRot: laugh ? 5 * Math.sin(t * 7 + c) : 0, face: laugh > 0.2 ? { name: 'joy' } : { name: 'neutral', eyes: { look: [hash(r + c * 3) - 0.5, -0.3] } } };
    return K.draw.kid(id, pose);
  }).join(''));
  Z.last = cam.zoom ?? 1;
  return SS.classroom.compose(t, { quiz: false, time: 'morning' }, rows, '', cam);
}
// ---- 8. YOU: "Sixty-four!" — "7 × 9?" — his hand shoots up FIRST
function shClass(t) {
  const cam = drift(t, CUT.cls, CUT.board, SS.camAt(1100, 760, 1.55), SS.camAt(1060, 730, 1.68));
  const hk = ease.outBack(seg(t, B.hand, B.hand + 0.14));
  const he = actor('you', t, { ...CL.heroDesk, armR: lerp(10, 172, hk), armL: 10, lift: 18 * bump(t, B.hand, B.hand + 0.3), face: t < B.hand ? { name: 'determined', eyes: { look: [0, -0.4] } } : 'smug' }, { arms: false });
  let o = classShot(t, cam, { hero: he, raise: seg(t, B.hand + 0.25, B.hand + 1.0) });
  const [sx, sy] = toScr(cam, CL.heroDesk.x + 260 * 0.5, CL.heroDesk.y - 1100 * 0.5);
  if (hk > 0.1) o += K.C.speedLines(sx - 40, sx + 40, sy + 160, 6, 3, '#FFFFFF', 160) + K.bang('FIRST!', sx + 230, sy + 40, pop(t, B.hand + 0.05, 0.2), 80, -10, '#FFE14D');
  // Mr. Fig's question
  o += S.g(S.rect(-200, -66, 400, 132, 40, ol('#FFFFFF', 7)) + S.path('M-120 60 L-160 120 L-70 62 Z', ol('#FFFFFF', 6)) + S.rect(-150, 56, 120, 14, 0, { fill: '#FFFFFF' }) + T('7 × 9 = ?', 0, 28, 80, '#2A62C0'), `translate(360 190) scale(${f(pop(t, CUT.cls, 0.22))}) rotate(-3)`);
  o += E6.dayTag(1720, 90, pop(t, CUT.cls, 0.25), 'MONDAY');
  return o + whip(t, CUT.cls, -1);
}
// ---- 9. TEACHER: "...Sixty-three." — Mr. Fig writes 63; the 64 gets a red cross
function shBoard(t) {
  const cam = drift(t, CUT.board, CUT.classLaugh, { x: 0, y: 0, zoom: 1.12 }, { x: 0, y: -10, zoom: 1.2 });
  const write = seg(t, B.write63 - 0.2, B.write63 + 0.2);
  const Lb = SS.classroom.layers(t, { view: 'board', board: [t < B.write63 ? '7 × 9 = ?' : '7 × 9 = 63'], time: 'morning' });
  const BD = CL.board;
  const tch = actor('teacher', t, { ...BD.teacher, turn: 0.4, marker: 'open', armR: lerp(30, 100, write) - 20 * bump(t, B.write63, B.write63 + 0.4), face: { name: 'deadpan', eyes: { look: [0.6, 0.2] } } }, { arms: false });
  const he = actor('you', t, { ...BD.seats[1], view: 'back', armR: lerp(170, 120, seg(t, CUT.board, CUT.board + 0.6)), volume: false });
  const kid = K.draw.kid(8, { ...BD.seats[0], view: 'back', volume: false });
  Z.last = cam.zoom;
  let o = view(cam, (Lb.mid || '') + tch + (Lb.front || '') + kid + he + (Lb.fg || '') + (Lb.light || ''));
  // the hero's "64" — crossed out in red
  const k64 = pop(t, CUT.board + 0.05, 0.25);
  if (k64 > 0) {
    let x = T('64?', 0, 0, 90, '#2A62C0');
    const cr = seg(t, B.write63 + 0.1, B.write63 + 0.4);
    if (cr > 0) x += S.path('M-80 -70 L80 10 M80 -70 L-80 10', { fill: 'none', stroke: '#E8453C', 'stroke-width': 14, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': `${f(cr)} 1.01` });
    const [sx, sy] = toScr(cam, 1500, 470);
    o += S.g(x, `translate(${f(sx)} ${f(sy)}) rotate(-6) scale(${f(k64)})`);
  }
  if (t >= B.write63) o += K.bang('squeak', 1200, 200, pop(t, B.write63, 0.2) * (1 - seg(t, B.write63 + 0.5, B.write63 + 0.7)), 56, 6, '#FFFFFF');
  return o;
}
// ---- 10. NARRATOR: "You were wrong. And it was fine." — the class laughs; he laughs with them
function shClassLaugh(t) {
  const cam = drift(t, CUT.classLaugh, CUT.skate, SS.camAt(1050, 740, 1.42), SS.camAt(980, 640, 1.0));
  const lk = seg(t, CUT.classLaugh, CUT.classLaugh + 0.4);
  const scratch = Math.sin(t * 9) * 8;
  const he = actor('you', t, { ...CL.heroDesk, armR: 150 + scratch, armL: 14, ...laughPose(t, lk), face: { name: 'joy', fx: ['blush'] } }, { arms: false });
  let o = classShot(t, cam, { hero: he, laugh: lk });
  const fine = seg(t, B.fine, B.fine + 0.6);
  if (fine > 0) o += K.sparkles([[760, 300, 34], [1180, 260, 28], [960, 200, 40]].map(([x, y, r]) => [x, y, r * bump(fine, 0, 1)]), t) + S.rect(0, 0, 1920, 1080, 0, { fill: '#FFE6A0', opacity: f(0.12 * bump(fine, 0, 1)) });
  return o;
}
// ---- the skate park (for real: no pad anywhere)
const RP = SS.SPOTS.schoolyard.ramp;
const CR = { x: RP.base.x, y: RP.lip.y, r: RP.lip.x - RP.base.x };          // the quarter-pipe arc (centre, radius)
function yard(t, cam, chars, over = '') {
  const Ly = SS.schoolyard.layers(t, cam, { time: 'day' });
  Z.last = cam.zoom ?? 1;
  return Ly.bg + Ly.mid + (Ly.pole || '') + (Ly.front || '') + view(cam, chars) + (Ly.fg || '') + (Ly.light || '') + view(cam, over);
}
// the hero standing on the board, drawn at (px, py) (= wheels contact), rotated rot about that point
function rider(t, px, py, rot, pose = {}, board = {}) {
  const s = 0.5;
  let g = X.skateboard({ x: 0, y: -26, s, flipK: board.flipK || 0 });
  g += actor('you', t, { x: 0, y: -34, s, view: 'side', flip: true, armL: 40, armR: -30, legL: 8, legR: -10, kneeL: 10, kneeR: 10, ...pose }, { arms: false });
  return S.g(g, `translate(${f(px)} ${f(py)}) rotate(${f(rot)})`);
}
const IVY_PARK = { x: 5010, y: 968, s: 0.5 };
const ivyPark = (t, pose = {}, act = {}) => actor('ivy', t, { ...IVY_PARK, turn: -0.4, ...pose }, act);
function livesHUD(t, k, val = 1, bmp = 0) {
  return R.counterHUD({ x: 56, y: 70, k, label: 'ATTEMPT', value: val, icon: 'retry', t, bump: bmp }) + R.counterHUD({ x: 56, y: 186, k, label: 'LIVES:', value: 1, theme: 'white', icon: 'heart', t, size: 56 });
}
// ---- 11. NARRATOR: "You tried the skateboard trick again." — he rolls in; Ivy watches with a card behind her back
function shSkate(t) {
  const u = seg(t, CUT.skate, CUT.real);
  const x = lerp(2980, 3600, ease.out(u));
  const cam = SS.camAt(lerp(3200, 3480, ease.inOut(u)), 640, 1.15);
  const push = u < 0.55 ? Math.sin((t - CUT.skate) * 8) : 0;
  const he = rider(t, x, 968, 0, { face: { name: 'determined', eyes: { look: [0.8, 0] } }, legL: 8 + 24 * push, kneeL: 10 + 16 * Math.max(0, push), lean: 6 });
  return yard(t, cam, he) + whip(t, CUT.skate, 1);
}
// ---- 12. "For real this time." — close: no pad, no flag; LIVES: 1, ATTEMPT 1
function shReal(t) {
  const cam = drift(t, CUT.real, CUT.attempt, SS.camAt(3640, 620, 2.0), SS.camAt(3650, 610, 2.25));
  const breath = Math.sin(t * 3);
  let g = X.skateboard({ x: 0, y: -26, s: 0.5 }) + actor('you', t, { x: 0, y: -34, s: 0.5, turn: 0.6, armL: 16, armR: 16, headRot: -2 + 2 * breath, face: { name: 'determined', eyes: { look: [0.9, -0.3] } } }, { arms: false });
  let o = yard(t, cam, S.g(g, 'translate(3640 968)'));
  return o + livesHUD(t, seg(t, B.real - 0.2, B.real + 0.15), 1, 0) + smash(t, CUT.real, 0.08, 0.3);
}
// ---- 13. "Attempt one... Ouch." — up the quarter-pipe, a slow-motion hang at the top, the board flips away, he lands on his butt
const LAND_X = 4110;
// the trick's beats (also used by audio/cues/gen_sc11.js)
const TR = { base: B.one - 0.15, lip: B.one + 0.12, apex: B.one + 0.37, off: B.ouch - 0.28, land: B.ouch };
function trickState(t) {
  const t0 = CUT.attempt, tBase = TR.base, tLip = TR.lip, tApex = TR.apex, tOff = TR.off, tLand = TR.land;
  if (t < tBase) { const k = seg(t, t0, tBase); return { px: lerp(3620, CR.x, ease.in(k)), py: 968, rot: 0, ride: true }; }
  if (t < tLip) { const a = lerp(90, 0, seg(t, tBase, tLip)) * Math.PI / 180; return { px: CR.x + CR.r * Math.cos(a), py: CR.y + CR.r * Math.sin(a), rot: -(90 - a * 180 / Math.PI), ride: true }; }
  if (t < tApex) { const k = ease.out(seg(t, tLip, tApex)); return { px: lerp(RP.lip.x, 4560, k), py: lerp(RP.lip.y, 400, k), rot: lerp(-90, -60, k), sep: 0 }; }
  if (t < tOff) { const k = seg(t, tApex, tOff); return { px: lerp(4560, 4500, k), py: 400 - 26 * Math.sin(k * Math.PI), rot: lerp(-60, -15, ease.inOut(k)), sep: ease.out(k), slow: true }; }
  if (t < tLand) { const k = ease.in(seg(t, tOff, tLand)); return { px: lerp(4500, LAND_X, k), py: lerp(400, 968, k), rot: lerp(-15, 0, k), sep: 1, falling: true }; }
  return { px: LAND_X, py: 968, landed: true };
}
// sitting on his butt (side view facing right, legs out); (x, y) = the butt on the ground; rot leans him back about it
function sitPose(t, x, y, rot = 0, pose = {}) {
  return S.g(actor('you', t, { x: 0, y: 150, s: 0.5, view: 'side', flip: true, legL: 118, legR: 124, kneeL: 6, kneeR: 14, armL: -40, armR: 30, shadow: false, ...pose }, { arms: false }), `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
}
function shAttempt(t) {
  const cam = shakeAll(camKeys(t, [[CUT.attempt, SS.camAt(4200, 620, 1.0)], [B.one - 0.1, SS.camAt(4320, 600, 1.0)], [B.one + 0.3, SS.camAt(4440, 470, 0.98)], [B.ouch - 0.3, SS.camAt(4420, 450, 1.02)], [B.ouch, SS.camAt(4300, 620, 1.04)], [CUT.ouch, SS.camAt(4290, 630, 1.06)]]), t, [[B.ouch, 0.4, 22]]);
  const st = trickState(t);
  let chars = ivyPark(t, { face: t > B.ouch - 0.05 ? { name: 'joy', eyes: { look: [-0.7, -0.2] } } : { name: 'excited', eyes: { look: [-0.6, -0.6] } }, armL: 120 + 10 * Math.sin(t * 9), armR: 20, props: [{ svg: E6.scoreCard(...AC.hand(20, 1), 0.9, 170, ''), layer: 'back' }] }, { arms: false });
  if (st.ride) chars += rider(t, st.px, st.py, st.rot, { face: 'determined' });
  else if (!st.landed) {
    const sep = st.sep || 0;
    const r = (st.rot * Math.PI) / 180;
    // the board leaves his feet and kickflips away up-right
    const bx = st.px + Math.sin(r) * 26 + 220 * sep, by = st.py - Math.cos(r) * -26 - 200 * sep;
    chars += X.skateboard({ x: bx, y: by, s: 0.5, rot: st.rot + 260 * sep, flipK: sep * 1.75 });
    const flail = sep > 0 ? Math.sin(t * 24) : 0;
    chars += S.g(actor('you', t, { x: 0, y: 0, s: 0.5, view: 'side', flip: true, armL: 150 + 25 * flail, armR: 130 - 25 * flail, legL: 30 + 20 * sep, legR: -20 + 30 * sep, kneeL: 30, kneeR: 40, face: sep > 0.2 ? { name: 'shocked', eyes: { look: [0.6, 0.8] } } : 'determined' }, { arms: false }), `translate(${f(st.px)} ${f(st.py - 34)}) rotate(${f(st.rot)})`);
  } else {
    chars += X.skateboard({ x: LAND_X + 360, y: 942, s: 0.5, rot: 10 });
    chars += sitPose(t, LAND_X, 968, 0, { face: { name: 'dizzy' }, sy: 1 - 0.12 * bump(t, B.ouch, B.ouch + 0.25), sx: 1 + 0.1 * bump(t, B.ouch, B.ouch + 0.25) });
  }
  let over = '';
  if (st.landed) over += K.C.dust(LAND_X - 80, 968, B.ouch, t) + stars(t, LAND_X + 40, 968 - 380, seg(t, B.ouch, B.ouch + 0.3));
  let o = yard(t, cam, chars, over);
  if (st.slow) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#BFE4FF', opacity: 0.12 }) + T('SLOW-MO', 1720, 100, 40, '#FFFFFF', { opacity: 0.8 });
  o += livesHUD(t, 1, 1, seg(t, B.attempt, B.attempt + 0.45));
  o += K.bang('OUCH!', 980, 360, pop(t, B.ouch, 0.2), 150, -8, '#FFE14D');
  return o;
}
function stars(t, x, y, k) {
  if (k <= 0) return '';
  let o = '';
  for (let i = 0; i < 4; i++) { const a = t * 5 + i * Math.PI / 2; o += S.g(S.path('M0 -26 L7 -8 L26 -8 L11 4 L17 23 L0 12 L-17 23 L-11 4 L-26 -8 L-7 -8 Z', ol('#FFE14D', 4)), `translate(${f(x + Math.cos(a) * 110)} ${f(y + Math.sin(a) * 30)}) scale(${f(0.9 * ease.outBack(k))})`); }
  return o;
}
// ---- 14. the beat: he flops onto his back laughing; Ivy walks over and holds up 6/10
const lying = (t, x, k = 1) => actor('you', t, { x, y: 968 + 112, s: 0.5, rot: 88, armL: 150 + 14 * Math.sin(t * 12), armR: 120 + 14 * Math.sin(t * 12 + 1), legL: 12, legR: -10, bodyY: 5 * Math.abs(Math.sin(t * 13)) * k, shadow: false, face: { name: 'joy', fx: ['tears'] } }, { arms: false });
function shOuch(t) {
  const cam = drift(t, CUT.ouch, CUT.two, SS.camAt(4130, 760, 1.42), SS.camAt(4140, 770, 1.52));
  const flop = seg(t, CUT.ouch, CUT.ouch + 0.35);
  const he = flop < 0.5 ? sitPose(t, LAND_X, 968, -60 * ease.in(flop * 2), { face: { name: 'joy', fx: ['tears'] } }) : lying(t, LAND_X - 40, 1);
  const walk = seg(t, CUT.ouch, B.card - 0.1);
  const ix = lerp(4700, 4420, ease.out(walk));
  const cardK = ease.outBack(seg(t, B.card - 0.1, B.card + 0.2));
  const armR = lerp(20, 165, cardK);
  const hand = AC.hand(armR, 1);
  const iv = actor('ivy', t, { x: ix, y: 968, s: 0.5, turn: -0.3, ...(walk < 1 ? AC.walkFront(t * 9) : {}), armR, armL: 14, face: cardK > 0.2 ? { name: 'joy', eyes: { look: [-0.7, 0.5] } } : 'happy', props: [{ svg: E6.scoreCard(hand[0], hand[1] + 40, 1.0, lerp(170, -8, cardK), cardK > 0.5 ? '6/10' : ''), layer: 'front' }] }, { arms: false });
  const board = X.skateboard({ x: LAND_X + 360, y: 942, s: 0.5, rot: 10 });
  let o = yard(t, cam, board + he + iv);
  if (flop >= 0.5) o += K.bang('ha ha ha!', 520, 330, pop(t, CUT.ouch + 0.25, 0.2), 70, -8, '#FFFFFF');
  return o + livesHUD(t, 1 - seg(t, CUT.ouch, CUT.ouch + 0.3), 1, 0);
}
// ---- 15. YOU: "Attempt TWO!" — he springs up, the board over his head; Ivy cheers with the 6/10
function shTwo(t) {
  const cam = drift(t, CUT.two, CUT.gift, SS.camAt(4230, 640, 1.42), SS.camAt(4230, 630, 1.52), ease.out);
  const up = ease.outBack(seg(t, B.up, B.up + 0.3));
  let he;
  if (t < B.up) he = lying(t, LAND_X - 40, 1);
  else he = actor('you', t, { x: LAND_X + 60 * up, y: 968, s: 0.5, turn: 0.2, armL: lerp(20, 170, up), armR: lerp(20, 170, up), lift: 90 * bump(t, B.up + 0.05, B.up + 0.5), sy: 1 + 0.08 * bump(t, B.up, B.up + 0.25), face: t > B.TWO - 0.1 ? { name: 'excited' } : 'determined', props: up > 0.5 ? [{ svg: X.skateboard({ x: 0, y: -1180, s: 1, rot: 0 }), layer: 'front' }] : [] }, { arms: false });
  const iv = actor('ivy', t, { x: 4420, y: 968, s: 0.5, turn: -0.3, armL: 150 + 10 * Math.sin(t * 9), armR: 150 + 10 * Math.sin(t * 9 + 1), lift: 20 * Math.abs(Math.sin(t * 7)) * seg(t, B.TWO, B.TWO + 0.2), face: 'excited', props: [{ svg: E6.scoreCard(...AC.hand(160, 1), 1.0, 0, '6/10'), layer: 'front' }] }, { arms: false });
  const board = up > 0.5 ? '' : X.skateboard({ x: LAND_X + 360, y: 942, s: 0.5, rot: 10 });
  let o = yard(t, cam, board + he + iv);
  o += R.counterHUD({ x: 56, y: 70, k: 1, label: 'ATTEMPT', value: t >= B.TWO ? 2 : 1, icon: 'retry', t, bump: seg(t, B.TWO, B.TWO + 0.45), size: 80 });
  return o + smash(t, B.TWO, 0.1, 0.4) + zoomLines(960, 480, 0.6 * bump(t, B.TWO, B.TWO + 0.5), t);
}
// ---- the bright workshop (no pad, the trophy on the bench)
function workshopBright(t, cam, o = {}) {
  const Lw = H.workshop.layers(t, { poster: true, days: 3 });
  const trophy = X.trophy({ x: 1330, y: SW.bench.top + 2, s: 0.34 });
  const table = X.flask({ x: 745, y: SW.flasks.y + 2, s: 0.45, col: '#3BD16F', kind: 'erlenmeyer', t }) + X.flask({ x: 820, y: SW.flasks.y + 2, s: 0.45, col: '#FF6FA8', kind: 'round', t: t + 1 });
  return room(Lw, cam, { behind: trophy + (o.ivy || ''), floor: table + (o.floor || ''), over: o.over || '' });
}
const IVY_WS = { x: SW.behindTable.x, y: SW.behindTable.y, s: SW.behindTable.s };
const HERO_WS = { x: 1320, y: 990, s: 0.5 };
// ---- 16. IVY: "Every inventor needs one." — she gives him his own book: BOOK OF FAILS · VOL. 2
function shGift(t) {
  const cam = drift(t, CUT.gift, CUT.write1, at(1100, 600, 1.55), at(1110, 590, 1.68));
  const off = ease.outBack(seg(t, B.offer - 0.1, B.offer + 0.3));
  const took = t >= B.take;
  const ih = AC.hand(lerp(30, 84, off), 1);
  const iv = actor('ivy', t, { ...IVY_WS, turn: 0.4, armR: took ? lerp(84, 30, seg(t, B.take, B.take + 0.4)) : lerp(30, 84, off), armL: 18, face: { name: 'happy', eyes: { look: [0.8, 0] } }, props: took ? [] : [{ svg: X.bookOfFails({ x: ih[0] + 60, y: ih[1] - 40, s: 0.95, vol: 2, rot: 6 }), layer: 'front' }] }, { arms: false });
  const hk = ease.out(seg(t, B.take - 0.25, B.take + 0.1));
  const he = actor('you', t, { ...HERO_WS, turn: -0.35, armL: took ? 34 : lerp(10, 60, hk), armR: took ? 34 : 10, face: took ? { name: 'happy', fx: ['sparkles'] } : { name: 'amazed', eyes: { look: [-0.8, 0] } }, props: took ? [{ svg: X.bookOfFails({ x: 0, y: -330, s: 1.0, vol: 2 }), layer: 'front' }] : [] }, { arms: false });
  let o = workshopBright(t, cam, { ivy: iv, floor: he });
  if (took) o += K.sparkles([[1250, 300, 30], [1420, 360, 22], [1100, 260, 18]].map(([x, y, r]) => [x, y, r * bump(t, B.take, B.take + 0.8)]), t);
  return o + whip(t, CUT.gift, 1);
}
// ---- 17/19. inserts: the open VOL. 2 on the purple star tablecloth; the pencil writes with his words
function bookLines(t) {
  return [
    { txt: 'FAIL #1:', x: -176, y: -60, size: 30, col: '#E8453C', k: seg(t, B.fail - 0.05, B.one10) },
    { txt: 'Talent show', x: -176, y: -18, size: 30, col: '#2A3A6A', k: seg(t, B.talent - 0.05, B.show + 0.05) },
    { txt: 'LESSON:', x: 22, y: -60, size: 28, col: '#3A8A3A', k: seg(t, B.lesson - 0.05, B.learned + 0.1) },
    { txt: 'totally', x: 22, y: -18, size: 30, col: '#2A3A6A', k: seg(t, B.totally - 0.05, B.totally + 0.35) },
    { txt: 'worth it!', x: 22, y: 24, size: 32, col: '#E8453C', k: seg(t, B.totally + 0.35, B.worth + 0.05) },
  ];
}
function insert(t, cam) {
  let o = S.rect(-400, -400, 2720, 1880, 0, { fill: '#5B3FA8' });
  for (let i = 0; i < 40; i++) o += S.g(S.path('M0 -16 L4 -5 L16 -5 L6 3 L10 15 L0 8 L-10 15 L-6 3 L-16 -5 L-4 -5 Z', { fill: '#FFD23F', opacity: 0.85 }), `translate(${f((i % 8) * 280 + (Math.floor(i / 8) % 2) * 140 - 80)} ${f(Math.floor(i / 8) * 260 - 80)}) rotate(${f(i * 23)})`);
  const bs = E6.bookSpread(960, 560, 2.9, -3, { vol: 2, lines: bookLines(t), doodles: doodle(t) });
  o += S.ellipse(980, 940, 640, 60, { fill: '#000', opacity: 0.18 }) + bs.svg;
  // the pencil follows the writing tip (rests at the right edge between words)
  const pen = bs.pen || [1560, 640];
  const wob = bs.pen ? Math.sin(t * 40) * 4 : 0;
  o += E6.pencilHand(pen[0] + 6, pen[1] + wob + 6, 1.15, 0);
  return view(cam, o);
}
// a gold star sticker slapped on the page after "worth it!"
function doodle(t) {
  const k = ease.outBack(seg(t, B.worth, B.worth + 0.25));
  if (k <= 0) return '';
  return S.g(S.path('M0 -26 L7 -8 L26 -8 L11 4 L17 23 L0 12 L-17 23 L-11 4 L-26 -8 L-7 -8 Z', ol('#FFD23F', 3.5)) + S.path('M-6 -12 L0 -20', ln(3, '#FFFFFF')), `translate(150 76) rotate(-12) scale(${f(1.2 * lerp(2.2, 1, k))})`, { opacity: f(clamp(k * 3, 0, 1)) });
}
function shWrite1(t) {
  const cam = drift(t, CUT.write1, CUT.writeFace, at(900, 560, 1.0), at(880, 560, 1.08));
  return insert(t, cam) + smash(t, CUT.write1, 0.08, 0.3);
}
// ---- 18. "Lesson learned:" — medium: he writes, smiling; Ivy leans in over the table
function shWriteFace(t) {
  const cam = drift(t, CUT.writeFace, CUT.write2, at(1090, 590, 1.68), at(1090, 590, 1.8));
  const wr = Math.sin(t * 22) * 4;
  const he = actor('you', t, { x: 1180, y: 990, s: 0.5, turn: -0.5, lean: 8, headRot: 8, armL: 40 + wr, armR: 30, face: { name: 'happy', eyes: { look: [-0.6, 0.8] } } }, { arms: false });
  const iv = actor('ivy', t, { ...IVY_WS, x: 990, turn: 0.4, lean: 8, headRot: 6, face: { name: 'happy', eyes: { look: [0.5, 0.8] } } }, { arms: false });
  const book = E6.bookSpread(1010, 742, 0.42, -2, { vol: 2, lines: bookLines(t) }).svg;
  return workshopBright(t, cam, { ivy: iv, floor: book + he });
}
function shWrite2(t) {
  const cam = drift(t, CUT.write2, CUT.end, at(1000, 560, 1.06), at(1040, 560, 1.16));
  return insert(t, cam);
}
// ---- 20. the last beat: wide warm workshop, they laugh; he hugs the book; dip to night for SC 12
function shEnd(t) {
  const cam = drift(t, CUT.end, END, at(1060, 600, 1.35), at(1040, 610, 1.18));
  const he = actor('you', t, { ...HERO_WS, turn: -0.3, armL: 36, armR: 36, ...laughPose(t, 1), face: { name: 'joy' }, props: [{ svg: X.bookOfFails({ x: 0, y: -330, s: 1.0, vol: 2 }), layer: 'front' }] }, { arms: false });
  const iv = actor('ivy', t, { ...IVY_WS, turn: 0.4, bodyY: 5 * Math.abs(Math.sin(t * 13)), face: 'joy', armL: 30, armR: 40 }, { arms: false });
  let o = workshopBright(t, cam, { ivy: iv, floor: he });
  return o + dip(seg(t, END - 0.38, END), '#0B1030');
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.sat, shSat], [CUT.waffle, shWaffle], [CUT.rounded, shRounded], [CUT.square, shSquare], [CUT.minute, shMinute], [CUT.laugh, shLaugh], [CUT.love, shLove],
  [CUT.cls, shClass], [CUT.board, shBoard], [CUT.classLaugh, shClassLaugh], [CUT.skate, shSkate], [CUT.real, shReal], [CUT.attempt, shAttempt],
  [CUT.ouch, shOuch], [CUT.two, shTwo], [CUT.gift, shGift], [CUT.write1, shWrite1], [CUT.writeFace, shWriteFace], [CUT.write2, shWrite2], [CUT.end, shEnd],
].sort((a, b) => a[0] - b[0]);
function shotAt(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return SHOTS[i][1];
}
function scene(t) {
  Z.last = 1;
  const o = shotAt(t)(t);
  return Z.last >= 1.75 ? flat(o) : o;
}
function look(t) {
  if (t >= CUT.skate && t < CUT.gift) return { grade: 'cool', vignette: 0.4 };
  return { grade: 'warm', vignette: 0.45 };
}

module.exports = { scene, look, SHOTS, CUT, B, timing, TR };
