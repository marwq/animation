// SC 02 · ОБЫЧНЫЙ НУБ — Monday: the pigeon steals your sandwich, picked last in gym (after the kid with the cast),
// dying on stage 1 of "Easy Obby for Babies" (the whole floor is lava), Dad's "Can you hear me now?", Mom's sticky
// notes (incl. your forehead, now OFFICIAL), Granny at 4 mph overtaken by a snail, Pancake flops on the keyboard,
// Zoe roasts the password note, Brick takes the lunch money and BOTH cookies, the night dream of being strong —
// "Until the garage sale."
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const C = K.C;
const AC = require('./acting');
const SETS = require('./sets');
const { pancake } = require('../rig/cats');
const { fireTrail } = require('../rig/cast');
const X = require('./s02_env');
const { camAt, pop, OUT, FULL, tr, kIn, shakeCam, shakes, room, nightLight, playerCard, tag, stamp, callout, panel } = X;
const { SPOTS } = SETS;

const START = K.V.scene('SC 02').start, END = K.V.scene('SC 03').start;
const A = Array.from({ length: 20 }, (_, i) => L('02a.' + i));
const B = L('02b.0');
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const you = (t, pose, act = { arms: false }) => actor('you', t, pose, act);

// ---------------------------------------------------------------- cuts (all from the voice)
const c01 = START;
const c02 = w(0, 'Totally') - 0.1;
const c03 = w(0, 'Maybe') - 0.1;
const c04 = A[1].a - 0.05;
const c05 = w(1, 'Every') - 0.08;
const c06 = w(1, 'Even') - 0.08;
const c07 = A[2].a - 0.05;
const c08 = w(2, 'you') - 0.05;
const c09 = w(2, 'Even') - 0.08;
const c10 = A[3].a - 0.05;
const c11 = Math.min(A[3].b + 0.35, A[4].a - 0.4);
const c12 = w(4, 'The') - 0.08;
const c13 = w(4, 'It', 1) - 0.08;
const c14 = A[5].a - 0.05;
const c15 = w(5, 'Mostly') - 0.08;
const c16 = A[6].a - 0.05;
const c17 = w(6, 'How') - 0.08;
const c18 = w(6, 'NOW', 2) - 0.12;
const c19 = A[7].a - 0.05;
const c20 = w(7, 'She') - 0.08;
const c21 = A[8].a - 0.05;
const c22 = w(8, 'I') - 0.08;
const c23 = A[9].a - 0.05;
const c24 = w(9, 'and') - 0.08;
const c25 = w(9, 'at') - 0.08;
const c26 = A[10].a - 0.05;
const c27 = A[11].a - 0.05;
const c28 = w(11, 'He') - 0.08;
const c29 = w(11, 'Both') - 0.08;
const c30 = A[12].a - 0.05;
const c31 = w(12, 'She') - 0.08;
const c32 = w(12, 'and') - 0.08;
const c33 = A[13].a - 0.05;
const c34 = w(13, 'On') - 0.08;
const c35 = w(13, 'Facing') - 0.08;
const c36 = A[14].a - 0.05;
const c37 = A[15].a - 0.05;
const c38 = w(15, 'Brick') - 0.12;
const c39 = A[16].a - 0.05;
const c40 = w(16, 'Also') - 0.08;
const c41 = w(16, 'Also', 1) - 0.08;
const c42 = A[17].a - 0.05;
const c43 = w(17, 'Okay') - 0.08;
const c44 = A[18].a - 0.05;
const c45 = A[19].a - 0.05;
const c46 = w(19, 'Someone', 1) - 0.08;
const c47 = w(19, 'Someone', 2) - 0.08;
const c48 = w(19, 'Someone', 3) - 0.08;
const c49 = B.a - 0.05;
const c50 = B.word('Until').t0 - 0.08;
const tGarage = B.word('garage').t0 - 0.06;

const DEFS = X.DEFS + `<defs>
<linearGradient id="s02gymRays" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6C8" stop-opacity="0.5"/><stop offset="1" stop-color="#FFF6C8" stop-opacity="0"/></linearGradient>
</defs>`;

// ---------------------------------------------------------------- shared bits
const HR = SPOTS.heroRoom;
// the obby frame (game world + HUD) seen through cam; avatar = svg in world space between back and front
function gameFrame(t, cam, avatar = '', deaths = 4998, extra = '') {
  const W = X.obbyWorld(t);
  return view(cam, W.back + avatar + W.front + extra, 1) + X.obbyHUD(deaths);
}
const sitAtDesk = { view: 'side', legL: 90, kneeL: 90, legR: 84, kneeR: 96 };
const HERO_DESK = { x: 1062, y: 872, s: 0.5 };

// ================================================================= 1. street: THIS IS YOU
function walkX(t) { return 300 + 230 * (t - START); }
function shStreet(t) {
  const tf0 = w(0, 'is'), tf1 = w(0, 'Twelve') - 0.08;
  const te = t < tf0 ? t : t < tf1 ? tf0 : t - (tf1 - tf0);       // freeze-frame on "This is you"
  const frozen = t >= tf0 && t < tf1;
  const hx = walkX(te);
  const cam = { zoom: lerp(1.15, 1.25, seg(t, START, c02)), x: hx - 900, y: 60 };
  const ph = (te - START) * 7.5;
  const sand = { svg: X.sandwich(-150, -470, 1.3, -20), layer: 'front' };
  const hero = you(te, { x: hx, y: 940, s: 0.5, view: 'side', flip: true, ...AC.walk(ph), armR: 52, face: frozen ? 'happy' : 'happy', props: [sand] });
  const Ls = SETS.street.layers(te, cam, { time: 'morning', pigeon: false });
  let o = Ls.bg + Ls.mid + view(cam, SETS.pigeon(hx + 760, 944, 1.1, te, { state: 'peck' }) + hero, 1) + Ls.fg;
  if (frozen || t >= tf1) {
    const k = seg(t, tf0, tf0 + 0.18);
    if (frozen) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFF2C8', opacity: 0.18 }) + S.rect(30, 30, 1860, 1020, 30, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 10, opacity: 0.8 });
    const sx = 960 + (hx - 900 - cam.x - 60) * cam.zoom;
    o += callout('THIS IS YOU', sx + 520, 260, sx + 60, 380, k * (1 - seg(t, tf1, tf1 + 0.15)));
  }
  o += tag('12 YEARS OLD', 1380, 330, seg(t, w(0, 'Twelve'), w(0, 'Twelve') + 0.2), '#FFD21F', -5, 76);
  // "▶ PLAY · MONDAY" after the rewind
  const pk = seg(t, START, START + 0.15) * (1 - seg(t, START + 2.2, START + 2.5));
  if (pk > 0) o += S.g(S.rect(-10, -48, 520, 70, 12, { fill: '#000', opacity: 0.45 }) + TF('▶ PLAY · MONDAY 7:45 AM', 14, 0, 36, '#FFFFFF', { 'text-anchor': 'start', ...OUT(6) }), 'translate(70 110)', { opacity: f(pk) });
  o += C.whiteFlash(1 - seg(t, START, START + 0.3));
  return o;
}

// ================================================================= 2. "Totally normal" + 3. the pigeon
const SX = 1250; // hero stands here for the pigeon gag (world x on the street)
function streetMedium(t, cam, chars) {
  const Ls = SETS.street.layers(t, cam, { time: 'morning', pigeon: false });
  return Ls.bg + Ls.mid + view(cam, chars, 1) + Ls.fg;
}
function shNormal(t) {
  const tB = w(0, 'Totally'), tN = w(0, 'normal');
  const cam = camKeys(t, [[c02, camAt(SX + 60, 640, 1.75)], [c03, camAt(SX + 80, 650, 1.85)]]);
  const chew = Math.abs(Math.sin(t * 11)) * (t > tB + 0.15 ? 1 : 0);
  const bite = bump(t, tB - 0.1, tB + 0.25);
  const thumbs = ease.outBack(seg(t, tN, tN + 0.2));
  const props = [{ svg: X.sandwich(260, -790, 1.3, 20 - 30 * bite), layer: 'front' }];
  const th = AC.hand(lerp(10, 150, thumbs), -1);
  if (thumbs > 0) props.push({ svg: X.thumbUp(th[0] + 10, th[1] + 10, 1.3 * thumbs), layer: 'top' });
  const hero = you(t, { x: SX, y: 940, s: 0.5, turn: 0.35, armR: 150 + 15 * bite, armL: lerp(10, 150, thumbs), headRot: -4 * chew, face: { name: t > tN ? 'joy' : 'happy', mouth: bite > 0.5 ? 'O' : chew > 0.5 ? 'smile' : 'cat' }, props }, { arms: false });
  const pig = SETS.pigeon(SX + 420, 944, 1.15, t, { state: t > tN ? 'idle' : 'peck' });
  let o = streetMedium(t, cam, pig + hero);
  o += stamp('NORMAL', 1440, 330, seg(t, tN, tN + 0.25), '#2FA35A', -10, 96);
  return o;
}
function shPigeon(t) {
  const tToo = w(0, 'too'), tGrab = w(0, 'normal', 1), tGone = tGrab + 0.9;
  const cam = shakeCam(camKeys(t, [[c03, camAt(SX + 120, 650, 1.6)], [tGrab - 0.05, camAt(SX + 100, 640, 1.7)], [tGrab + 0.08, camAt(SX + 40, 560, 2.3)], [c04, camAt(SX + 40, 560, 2.4)]]), t, tGrab, 0.35, 16);
  const raise = ease.inOut(seg(t, c03 + 0.2, tGrab - 0.05));
  const got = t >= tGrab;
  // the sandwich in hand (body space) until the pigeon grabs it
  const hand = [100 + 250 * Math.sin((lerp(150, 168, raise) * Math.PI) / 180), -515 + 250 * Math.cos((lerp(150, 168, raise) * Math.PI) / 180)];
  const props = got ? [] : [{ svg: X.sandwich(hand[0] + 40, hand[1] - 40, 1.3, 20), layer: 'front' }];
  const chomp = t > tGrab ? bump(t, tGrab, tGrab + 0.18) : 0;
  const face = !got ? { name: 'happy', eyes: { type: 'closed' }, mouth: raise > 0.6 ? 'O' : 'smile' } : t < tGrab + 0.25 ? { name: 'happy', eyes: { type: 'closed' }, mouth: 'line' } : { name: 'shocked', fx: ['exclaim'] };
  const hero = you(t, { x: SX, y: 940, s: 0.5, turn: 0.35, armR: lerp(150, 168, raise), armL: 12, sy: 1 - 0.05 * chomp, face, props }, { arms: false });
  // pigeon: crouch -> launch at "too" -> snatch at "normal" -> flies off up-left
  let pig;
  const hx = SX + hand[0] * 0.5 + 20, hy = 940 + hand[1] * 0.5;
  if (t < tToo) pig = SETS.pigeon(SX + 420, 944, 1.15, t, { state: 'peck' });
  else if (t < tGrab) { const u = ease.in(seg(t, tToo, tGrab)); pig = SETS.pigeon(lerp(SX + 420, hx + 30, u), lerp(944, hy + 60, u) - Math.sin(u * Math.PI) * 120, 1.15, t, { state: 'fly' }); }
  else { const u = ease.in(seg(t, tGrab, tGone)); pig = SETS.pigeon(lerp(hx + 30, SX - 900, u), lerp(hy + 60, -300, u), 1.15, t, { state: 'fly', sandwich: true }); }
  let o = streetMedium(t, cam, hero + pig);
  o += K.bang('YOINK!', 1420, 300, seg(t, tGrab, tGrab + 0.12) * (1 - seg(t, c04 - 0.2, c04)), 130, -8, '#FFD21F');
  return o;
}

// ================================================================= 4. GYM — picked last
const PL = SPOTS.gym.pickLine;
const KIDS = [1, 4, 7, 9, 12, 15];
function gymLayers(t, cam, chars, behind = '', light = '') {
  return room(SETS.gym, t, cam, { scoreboard: ['HOME', '00', 'GUEST', '00'] }, { behind, chars, kbg: 1, over: light });
}
function pickedKid(t, i, tp, x0, side) {
  // a kid at the wall; after tp: jumps and runs off to a captain's side
  const u = seg(t, tp, tp + 0.7);
  if (u >= 1) return '';
  const x = x0 + side * 1300 * ease.in(u);
  const pose = u <= 0 ? { x, y: 828, s: 0.42, armL: 8, armR: 8, face: 'neutral' } : { x, y: 828, s: 0.42, lift: 70 * Math.sin(Math.min(1, u * 3) * Math.PI), view: u > 0.15 ? 'side' : 'front', flip: side > 0, ...(u > 0.15 ? AC.run(u * 30) : { armL: 160, armR: 160 }), face: 'excited' };
  return K.draw.kid(KIDS[i], { ...pose, volume: false });
}
function captain(t, x, i, point = 0, flip = false, vol = true) {
  return K.draw.kid(i, { x, y: 990, s: 0.5, view: 'back', armR: lerp(10, 100, point), armL: 10, bodyY: 3 * Math.sin(t * 4 + i), ...(vol ? {} : { volume: false }) });
}
function shGym(t) {
  const tLast = w(1, 'last');
  const cam = camKeys(t, [[c04, camAt(900, 560, 1.12)], [tLast, camAt(940, 600, 1.2)], [c05, camAt(980, 640, 1.42)]]);
  let chars = '';
  const order = [0, 5, 1, 4, 2, 3];
  order.forEach((i, j) => { const tp = lerp(c04 + 0.15, tLast - 0.25, j / 5); chars += pickedKid(t, i, tp, PL[i].x, j % 2 ? 1 : -1); });
  chars += X.castKid(t, { x: PL[6].x, y: 828, s: 0.42, volume: false, face: 'nervous' });
  const left = 6 - order.filter((i, j) => t > lerp(c04 + 0.15, tLast - 0.25, j / 5)).length;
  const hope = clamp(left / 6, 0, 1);
  chars += you(t, { x: PL[7].x, y: 828, s: 0.42, armR: hope > 0.2 ? 160 + 18 * Math.sin(t * 16) : 20, armL: 10, lift: hope > 0.2 ? 10 * Math.abs(Math.sin(t * 8)) : 0, face: hope > 0.5 ? 'excited' : hope > 0.2 ? 'nervous' : 'sad' });
  // captains + coach
  const pointA = Math.max(...order.map((i, j) => (j % 2 === 0 ? bump(t, lerp(c04 + 0.15, tLast - 0.25, j / 5) - 0.2, lerp(c04 + 0.15, tLast - 0.25, j / 5) + 0.3) : 0)));
  const pointB = Math.max(...order.map((i, j) => (j % 2 === 1 ? bump(t, lerp(c04 + 0.15, tLast - 0.25, j / 5) - 0.2, lerp(c04 + 0.15, tLast - 0.25, j / 5) + 0.3) : 0)));
  const front = captain(t, 640, 20, pointA) + captain(t, 1240, 21, pointB) + actor('coach', t, { x: 200, y: 990, s: 0.52, whistle: 'mouth', turn: 0.4 });
  let o = gymLayers(t, cam, front, chars);
  o += tag('PICKED LAST', 1420, 220, seg(t, tLast, tLast + 0.2), '#FF5A5A', 4, 66);
  return o;
}
function shEvery(t) {
  const tT = w(1, 'time');
  const comp = (seed, face) => {
    const cam = camAt(1000, 640, 1);
    return gymLayers(t, cam, captain(t, 640, 20 + seed, 0, false, false) + captain(t, 1240, 21 + seed, 0, false, false), you(t, { x: PL[7].x, y: 828, s: 0.42, face, headRot: -6, bodyY: 6, volume: false }));
  };
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#2A3A6A' }) + K.rays(960, 540, 16, 1400, '#3A4E8A', 0.6, t * 8);
  const days = [['MON', 'sad', c05 - 0.02], ['TUE', 'crying', tT - 0.05], ['WED', { name: 'sad', fx: ['tears'] }, tT + 0.3]];
  days.forEach(([d, face, tk], i) => { o += panel(70 + i * 610, 230, 560, 640, comp(i, face), seg(t, tk, tk + 0.22), { focus: [PL[7].x, 640], zoom: 2.2, rot: [-3, 2, -2][i], label: d, labelCol: ['#FFD21F', '#9FE0FF', '#FF9EC4'][i] }); });
  o += T('EVERY. TIME.', 960, 150, 96, '#FFFFFF', OUT(16));
  return o;
}
function shCast(t) {
  const tKid = w(1, 'kid'), tArm = w(1, 'arm');
  const cam = shakeCam(camKeys(t, [[c06, camAt(960, 640, 1.5)], [tArm - 0.05, camAt(960, 650, 1.56)], [tArm + 0.06, camAt(PL[7].x, 640, 2.7)], [c07, camAt(PL[7].x, 640, 2.8)]]), t, tArm, 0.3, 12);
  const u = seg(t, tKid + 0.25, tKid + 1.2);
  let chars = '';
  if (u < 1) chars += X.castKid(t, { x: PL[6].x - 1300 * ease.in(seg(u, 0.25, 1)), y: 828, s: 0.42, armR: t > tKid ? 165 : 10, lift: t > tKid ? 40 * Math.abs(Math.sin((t - tKid) * 9)) * (1 - seg(u, 0.2, 0.3)) : 0, face: t > tKid ? 'excited' : 'nervous' });
  const alone = t > tKid + 0.6;
  chars += you(t, { x: PL[7].x, y: 828, s: 0.42, armR: t < tKid ? 150 : lerp(150, 10, seg(t, tKid, tKid + 0.4)), armL: 10, bodyY: alone ? 8 : 0, face: t < tKid ? 'excited' : alone ? { name: 'sad', fx: ['tears'] } : 'shocked' });
  const front = captain(t, 640, 20, bump(t, tKid - 0.2, tKid + 0.6)) + captain(t, 1240, 21, 0);
  let o = gymLayers(t, cam, front, chars);
  o += stamp('LAST', 1560, 260, seg(t, tArm + 0.05, tArm + 0.3), '#E8243C', -12, 110);
  return o;
}

// ================================================================= 7. the obby
function avatarRun(t, x, y, ph, extra = {}) { return you(t, { x, y, s: 0.3, view: 'side', flip: true, ...AC.run(ph), shadow: false, ...extra }); }
function obbyAvatar(t) {
  // run from the spawn pad, jump at "first", fall short into the lava at "jump"
  const tRun = c08 + 0.08, tJ = w(2, 'first'), tS = Math.max(tJ + 0.42, w(2, 'jump') + 0.1);
  if (t < tRun) return { svg: you(t, { x: 500, y: 700, s: 0.3, view: 'side', flip: true, face: 'determined', shadow: false }), splash: tS };
  if (t < tJ) { const x = lerp(500, 628, ease.in(seg(t, tRun, tJ))); return { svg: avatarRun(t, x, 700, (t - tRun) * 22, { face: 'determined' }), splash: tS }; }
  if (t < tS) {
    const u = seg(t, tJ, tS), x = lerp(628, 712, u), y = 700 - 170 * Math.sin(u * Math.PI * 0.9) + (u > 0.5 ? 120 * (u - 0.5) * 2 : 0);
    return { svg: you(t, { x, y, s: 0.3, view: 'side', flip: true, armL: 160, armR: 170, legL: 30, kneeL: 60, legR: -20, kneeR: 40, rot: 10 * u, face: u > 0.55 ? 'scream' : 'excited', shadow: false }), splash: tS };
  }
  return { svg: '', splash: tS };
}
function splashFx(t, x, y, t0) {
  const k = t - t0;
  if (k < 0 || k > 0.8) return '';
  let d = '';
  for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + (hash(i * 3) - 0.5) * 2.2, v = 400 + 300 * hash(i); const px = x + Math.cos(a) * v * k, py = y + Math.sin(a) * v * k + 1400 * k * k; d += X.circD(px, py, 10 + 8 * hash(i * 5)); }
  return S.path(d, { fill: '#FFB13B', stroke: '#151515', 'stroke-width': 4, opacity: f(1 - k / 0.8) });
}
function shDesk(t) {
  const cam = camKeys(t, [[c07, camAt(980, 600, 1.25)], [c08 - 0.5, camAt(900, 560, 2.3)], [c08, camAt(864, 590, 4.6)]], ease.in);
  const mon = SETS.frameIn(gameFrame(t, camAt(760, 560, 1.25), you(t, { x: 500, y: 700, s: 0.3, view: 'side', flip: true, shadow: false }), 4998), 200, 132);
  const type = Math.sin(t * 26) * 6;
  const hero = you(t, { ...HERO_DESK, ...sitAtDesk, armL: 64 + type, armR: 58 - type, lean: -4, face: 'determined' });
  let o = room(SETS.heroRoom, t, cam, { time: 'day', monitor: mon }, { chars: hero });
  o += tag('EVERY OBBY', 1460, 230, seg(t, w(2, 'every'), w(2, 'every') + 0.2) * (1 - seg(t, c08 - 0.5, c08 - 0.3)), '#B06BFF', -4, 60);
  return o;
}
function shObby(t) {
  const av = obbyAvatar(t);
  const tS = av.splash;
  const cam = shakeCam(camKeys(t, [[c08, camAt(700, 560, 1.4)], [tS, camAt(720, 600, 1.55)], [c09, camAt(720, 620, 1.62)]]), t, tS, 0.4, 18);
  const deaths = t > tS ? 4999 : 4998;
  let o = gameFrame(t, cam, av.svg, deaths, splashFx(t, 712, X.OB.lava, tS));
  o += K.bang('OOF!', 1380, 360, seg(t, tS, tS + 0.12), 160, -6, '#FF8A3D');
  if (t > tS) o += S.g(S.rect(-250, -60, 500, 120, 30, { fill: '#000', opacity: 0.55 }) + TF('YOU DIED', 0, 20, 64, '#FF5A5A'), `translate(960 ${f(lerp(-100, 200, ease.outBack(seg(t, tS + 0.1, tS + 0.4))))})`);
  return o;
}
function titleShot(t, words, sub, circle, cam) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FFC2E2' }) + K.rays(960, 520, 18, 1500, '#FFFFFF', 0.35, t * 14);
  o += view(cam, S.g(X.obbyTitle(t, words, sub, circle), 'translate(960 520) rotate(-1.5)'), 1);
  return o;
}
function shTitle(t) {
  const ws = [w(2, 'Easy'), w(2, 'Obby', 1), w(2, 'for'), w(2, 'Babies')];
  const n = ws.reduce((a, tw, i) => a + seg(t, tw - 0.04, tw + 0.16), 0);
  const cam = camKeys(t, [[c09, camAt(960, 540, 0.92)], [c10, camAt(960, 530, 1.02)]]);
  return titleShot(t, n, 0.45, 0, cam);
}
function heroRoomMonitorLava(t) {
  return SETS.frameIn(gameFrame(t, camAt(720, 640, 1.5), '', 4999), 200, 132);
}
function shNowhere(t) {
  const tN = A[3].word('NOWHERE').t0;
  const cam = shakeCam(camKeys(t, [[c10, camAt(900, 620, 1.55)], [tN - 0.05, camAt(900, 600, 1.7)], [tN + 0.07, camAt(900, 640, 2.4)], [c11, camAt(900, 640, 2.45)]]), t, tN, 0.45, 16);
  const up = ease.outBack(seg(t, c10, c10 + 0.3));
  const rage = seg(t, tN - 0.05, tN + 0.1);
  const hero = you(t, { x: 900, y: lerp(1100, 990, up), s: 0.5, turn: -0.2, armL: lerp(30, 165, rage) + 8 * Math.sin(t * 20) * rage, armR: lerp(60, 165, rage) + 8 * Math.sin(t * 22) * rage, lean: -3 * rage, face: { name: 'angry', fx: rage > 0.5 ? ['anger', 'steam'] : ['anger'] } }, { arms: false, energy: 1.6 });
  let o = room(SETS.heroRoom, t, cam, { time: 'day', monitor: heroRoomMonitorLava(t) }, { chars: hero });
  return o;
}
function sinker(t, sink, thumb = 1) {
  const y = X.OB.lava + 40 + sink * 220;
  const props = thumb > 0 ? [{ svg: X.thumbUp(132, -756, 1.5 * thumb), layer: 'top' }] : [];
  return you(t, { x: 712, y, s: 0.3, turn: 0.25, armR: 172, armL: 20, face: { name: 'happy', fx: ['sweat'] }, shadow: false, props });
}
function shSink(t) {
  const sink = seg(t, c11 - 0.5, c13 + 1);
  const cam = camKeys(t, [[c11, camAt(712, 690, 2.6)], [c12, camAt(712, 700, 2.8)]]);
  return gameFrame(t, cam, sinker(t, sink, ease.outBack(seg(t, c11, c11 + 0.4))), 4999);
}
function shWhole(t) {
  const sink = seg(t, c11 - 0.5, c13 + 1);
  const tL = w(4, 'lava');
  const cam = camKeys(t, [[c12, camAt(712, 700, 2.8)], [c12 + 0.9, camAt(900, 520, 0.42)], [c13, camAt(900, 500, 0.4)]], ease.inOut);
  let o = gameFrame(t, cam, sinker(t, sink, 1), 4999);
  o += tag('THE FLOOR', 960, 860, seg(t, w(4, 'floor', 1), w(4, 'floor', 1) + 0.2), '#FF8A3D', -3, 64);
  o += K.bang('= LAVA', 1350, 760, seg(t, tL, tL + 0.14), 110, -6, '#FFE14D');
  return o;
}
function shName(t) {
  const tN = w(4, 'name');
  const cam = camKeys(t, [[c13, camAt(960, 560, 1.0)], [tN - 0.1, camAt(960, 650, 2.1)], [c14, camAt(960, 660, 2.2)]]);
  return titleShot(t, 4, 1, seg(t, tN - 0.1, tN + 0.35), cam);
}

// ================================================================= 14. DAD
const LR = SPOTS.livingRoom;
const DADX = 1010;
function shDad(t) {
  const tD = w(5, 'Dad'), tW = w(5, 'works'), tH = w(5, 'home', 1);
  const cam = camKeys(t, [[c14, camAt(DADX, 560, 2.5)], [tW - 0.1, camAt(DADX, 590, 2.4)], [tH + 0.1, camAt(DADX, 880, 2.1)], [c15, camAt(DADX, 860, 2.0)]]);
  const talk = Math.sin(t * 3) * 10;
  const dad = actor('dad', t, { x: DADX, y: 990, s: 0.5, turn: -0.2, volume: false, armL: 40 + talk, armR: 120 + 10 * Math.sin(t * 4), headRot: 3 * Math.sin(t * 2.5), face: { name: 'talkHappy', mouth: Math.sin(t * 13) > 0 ? 'O' : 'smile' } }, { arms: false });
  let o = room(SETS.livingRoom, t, cam, { call: true }, { chars: dad });
  o += view(cam, tag('WORK', DADX + 210, 600, seg(t, tW, tW + 0.2), '#5AB0FF', -6, 40) + tag('HOME', DADX + 220, 890, seg(t, tH, tH + 0.2), '#FF9EC4', 6, 40), 1);
  o += playerCard('dad', 'works from home', seg(t, tD - 0.1, tD + 0.25), seg(t, c15 - 0.3, c15), t, 70, 110, '#5AB0FF', 'ONLINE?');
  return o;
}
function dadSeated(t, extra = {}) {
  const c = LR.dadChair;
  return actor('dad', t, { x: c.x, y: c.seat + 155, s: c.s, view: 'side', legL: 88, kneeL: 92, legR: 82, kneeR: 98, armL: 62, armR: 58, ...extra }, { arms: false });
}
function shDadCall(t) {
  const tHear = w(5, 'hear');
  const cam = camKeys(t, [[c15, camAt(560, 600, 1.55)], [c16, camAt(540, 590, 1.75)]]);
  const tap = bump(t, tHear - 0.1, tHear + 0.6);
  const dad = dadSeated(t, { armR: lerp(58, 150, tap), headRot: -6 * tap, face: tap > 0.3 ? 'confused' : 'neutral' });
  return room(SETS.livingRoom, t, cam, { call: true }, { behind: dad });
}
function shCan1(t) {
  const tNow = w(6, 'now');
  const cam = camKeys(t, [[c16, camAt(960, 540, 1.0)], [c17, camAt(1000, 520, 1.1)]]);
  const self = (tw, th) => S.rect(-tw / 2, -th / 2, tw, th, 0, { fill: '#FFC9A6' }) + S.g(actor('dad', t, { x: 0, y: 0, s: 1, turn: 0.1, armR: 130, armL: 10, face: 'shocked' }, { arms: false, energy: 1.5 }), `translate(0 ${f(th * 1.25)}) scale(${f(th / 520)})`);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1B2030' });
  o += view(cam, SETS.videoCall(960, 520, 1700, 960, t, { bossFace: 'bored', self, muted: seg(t, tNow, tNow + 0.25), tiles: ['Dad', 'Kevin', 'Linda'] }), 1);
  return o;
}
function shCan2(t) {
  const tNow = w(6, 'now', 1);
  const cam = shakeCam(camKeys(t, [[c17, camAt(DADX, 640, 2.6)], [c18, camAt(DADX, 620, 3.0)]]), t, tNow, 0.3, 8);
  const tap = Math.max(0, Math.sin((t - c17) * 9));
  const dad = actor('dad', t, { x: DADX, y: 990, s: 0.5, turn: 0.3, volume: false, armR: 160 - 10 * tap, armL: 30, headRot: 10, lean: -4, face: 'confused' }, { arms: false, energy: 1.3 });
  return room(SETS.livingRoom, t, cam, { call: true }, { chars: dad });
}
function shCan3(t) {
  const tN = w(6, 'NOW', 2);
  const cam = shakeCam(camKeys(t, [[c18, camAt(760, 560, 1.05)], [c19, camAt(760, 560, 1.12)]]), t, tN, 0.7, 22);
  const Ls = SETS.houseExterior.layers(t, { time: 'day' });
  const sh = K.shake(t, tN, 0.7, 10);
  let o = view(cam, Ls.bg, 0.7) + view(cam, Ls.mid, 1) + view(cam, S.g(Ls.front, `translate(${f(sh.sx)} ${f(sh.sy)})`), 1) + (Ls.light ? view(cam, Ls.light, 1) : '');
  o += view(cam, X.birds(250, 420, seg(t, tN, tN + 1.4)), 1);
  o += K.bang('NOW?!', 1180, 300, seg(t, tN, tN + 0.12), 190, -8, '#FFFFFF');
  for (let i = 0; i < 3; i++) { const k = seg(t, tN + i * 0.12, tN + i * 0.12 + 0.6); if (k > 0 && k < 1) o += S.circle(760, 560, 80 + 700 * k, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 14 * (1 - k), opacity: f(1 - k) }); }
  return o;
}

// ================================================================= 19. MOM + sticky notes
const KS = SPOTS.kitchen;
function shMom(t) {
  const tM = w(7, 'Mom');
  const cam = camKeys(t, [[c19, camAt(1000, 600, 1.4)], [c20, camAt(1000, 600, 1.5)]]);
  const inK = ease.outBack(seg(t, c19, c19 + 0.4));
  const mom = actor('mom', t, { x: lerp(1500, 1000, inK), y: 990, s: 0.5, notes: true, armR: 120 + 20 * Math.sin(t * 6), armL: 20, face: 'happy', lean: -6 * (1 - inK) }, { arms: false });
  let o = room(SETS.kitchen, t, cam, { notes: 0.15 }, { chars: mom });
  o += playerCard('mom', 'runs the house', seg(t, tM - 0.1, tM + 0.25), seg(t, c20 - 0.3, c20), t, 70, 110, '#FFD21F', 'ADMIN?');
  return o;
}
function shNotes(t) {
  const tR = w(7, 'runs'), tN = w(7, 'notes');
  const n = kIn(t, tR, tN + 0.3);
  // Mom zips between three spots, slapping a note at each
  const spots = [500, 1480, 1000];
  const u = seg(t, c20, c21) * spots.length;
  const i = Math.min(spots.length - 1, Math.floor(u)), fr = u - i;
  const prev = i ? spots[i - 1] : 1000;
  const x = lerp(prev, spots[i], ease.out(clamp(fr * 3, 0, 1)));
  const slap = bump(fr, 0.35, 0.75);
  const dir = spots[i] > prev ? 1 : -1;
  const cam = camKeys(t, [[c20, camAt(1000, 560, 1.05)], [c21, camAt(1000, 560, 1.1)]]);
  const mom = actor('mom', t, { x, y: 990, s: 0.5, view: fr < 0.33 ? 'side' : 'front', flip: dir > 0, ...(fr < 0.33 ? AC.run(t * 30) : {}), notes: true, armR: lerp(30, 170, slap), armL: 15, face: 'excited' }, { arms: false });
  let o = room(SETS.kitchen, t, cam, { notes: n }, { chars: mom });
  if (fr < 0.33) o += view(cam, C.speedLines(x - dir * 400, x - dir * 100, 700, 6, i * 7, '#FFFFFF', 300), 1);
  if (slap > 0.6) o += view(cam, K.bang('SLAP!', spots[i] + 120, 420, 1, 70, -8, '#FFE14D'), 1);
  return o;
}
const NOTE_POS = [[0, -830, -6, 'ROOM', '#FFE45C'], [-130, -640, 12, 'CLEAN', '#9FF0A8'], [90, -400, -8, 'TODAY', '#FF9EC4']];
function heroNotes(k3, offStamp = 0) {
  const props = [];
  NOTE_POS.forEach(([x, y, r, txt, col], i) => { const k = clamp(k3 - i, 0, 1); if (k > 0) props.push({ svg: S.g(SETS.stickyNote(0, 0, r, txt, { w: 150, size: 34, col }), `translate(${x} ${y}) scale(${f(pop(k * 1.4))})`), layer: 'top' }); });
  if (offStamp > 0) props.push({ svg: S.g(stamp('OFFICIAL', 0, 0, offStamp, '#E8243C', -14, 30), 'translate(0 -810)'), layer: 'top' });
  return props;
}
function shRoom(t) {
  const ws = ['Room', 'Clean', 'Today'].map((x) => w(8, x));
  const k3 = ws.reduce((a, tw) => a + seg(t, tw - 0.02, tw + 0.12), 0);
  const zoom = 1.45 + 0.18 * Math.floor(k3 + 0.001);
  let cam = camAt(980, 660, zoom);
  for (const tw of ws) cam = shakeCam(cam, t, tw, 0.18, 10);
  const slap = Math.max(...ws.map((tw) => bump(t, tw - 0.12, tw + 0.15)));
  const flinch = Math.max(...ws.map((tw) => bump(t, tw, tw + 0.25)));
  const mom = actor('mom', t, { x: 760, y: 990, s: 0.5, turn: 0.35, notes: true, armR: lerp(60, 112, slap), armL: 12, face: 'determined', lean: 4 * slap });
  const hero = you(t, { x: 1150, y: 990, s: 0.5, turn: -0.3, armL: 12, armR: 12, sy: 1 - 0.06 * flinch, sx: 1 + 0.04 * flinch, headRot: 6 * flinch, face: flinch > 0.3 ? { name: 'oof', eyes: { type: 'closed' } } : 'nervous', props: heroNotes(k3) });
  return room(SETS.kitchen, t, cam, { notes: 1 }, { chars: mom + hero });
}
function shOfficial(t) {
  const tO = w(8, 'official'), tS = w(8, 'sticky');
  const cam = camKeys(t, [[c22, camAt(1150, 645, 2.5)], [c23, camAt(1150, 640, 2.75)]]);
  const sk = seg(t, tO - 0.05, tO + 0.2);
  // stamp comes in from the left and slams on the forehead note at "official"
  const reach = ease.inOut(seg(t, tS, tO - 0.05)) * (1 - ease.in(seg(t, tO + 0.35, tO + 0.8)));
  const hero = you(t, { x: 1150, y: 990, s: 0.5, turn: -0.15, volume: false, armL: 10, armR: 10, sy: 1 - 0.05 * bump(t, tO - 0.02, tO + 0.2), face: { name: 'deadpan', eyes: { look: [0, -0.8] }, fx: ['sweat'] }, props: heroNotes(3, sk) }, { arms: false, energy: 0.3 });
  const hold = S.g(S.rect(-30, -120, 60, 120, 20, ol('#8A5A33', 6)) + S.ellipse(0, -126, 46, 22, ol('#8A5A33', 6)) + S.rect(-70, 0, 140, 50, 10, ol('#3A3F4E', 6)) + S.rect(-180, 10, 120, 40, 14, ol('#F27A6B', 6)), tr(lerp(700, 1150, reach), 570 - 40 * bump(t, tO - 0.12, tO + 0.05), 0.6, 0));
  let o = room(SETS.kitchen, t, cam, { notes: 1 }, { chars: hero + (reach > 0.02 ? hold : '') });
  o += K.bang('KA-CHUNK!', 1460, 280, seg(t, tO, tO + 0.1) * (1 - seg(t, c23 - 0.2, c23)), 100, 8, '#FFE14D');
  return o;
}

// ================================================================= 23. GRANNY at 4 mph (+ the snail)
const CAR_V = 26; // px/s on the street (4 mph, roughly)
const carX = (t) => 600 + CAR_V * (t - c23);
function streetShot(t, cam, chars, opts = {}) {
  const Ls = SETS.street.layers(t, cam, { time: 'day', pigeon: false, ...opts });
  return Ls.bg + Ls.mid + view(cam, chars, 1) + Ls.fg;
}
function shGranny(t) {
  const tG = w(9, 'Granny'), tN = w(9, 'ninety-one');
  const x = carX(t);
  const cam = camKeys(t, [[c23, camAt(x + 40, 700, 1.5)], [c24, camAt(carX(c24) + 40, 690, 1.6)]]);
  const car = X.grannyCar(x, 978, 1, t, { face: 'happy' });
  let o = streetShot(t, cam, car);
  o += playerCard('granny', 'age 91 · loves driving', seg(t, tG - 0.1, tG + 0.25), seg(t, c24 - 0.3, c24), t, 70, 110, '#FF6FB0');
  o += tag('91!', 1500, 300, seg(t, tN, tN + 0.2), '#FF9EC4', 8, 110);
  return o;
}
function shCrawl(t) {
  const tD = w(9, 'drives'), tS = w(9, 'store');
  const x = carX(t);
  const cam = camKeys(t, [[c24, camAt(x + 500, 560, 0.85)], [c25, camAt(x + 520, 560, 0.88)]]);
  // the pigeon (sandwich thief) strolls past the car on the sidewalk
  const px = x - 300 + 140 * (t - c24);
  const sign = S.g(S.rect(-8, -300, 16, 300, 4, ol('#8A8FA0', 4)) + S.rect(-150, -380, 300, 110, 14, ol('#2FA35A', 6)) + TF('STORE  2 MI →', 0, -312, 40, '#FFFFFF'), tr(x + 1300, 940));
  let o = streetShot(t, cam, sign + SETS.pigeon(px, 944, 1.1, t, { state: 'walk', flip: true }) + X.grannyCar(x, 978, 1, t));
  o += tag('THE STORE', 1500, 240, seg(t, tS, tS + 0.2), '#FFFFFF', -4, 56);
  return o;
}
function shSpeedo(t) {
  const tF = w(9, 'four'), tH = w(9, 'hour');
  const mph = lerp(0, 4, ease.out(seg(t, tF - 0.1, tF + 0.4)));
  const cam = camKeys(t, [[c25, camAt(960, 560, 1.0)], [c26, camAt(960, 600, 1.35)]]);
  let o = view(cam, X.speedometer(960, 540, 1.15, mph, t), 1);
  o += tag('4 MPH', 1520, 260, seg(t, tH, tH + 0.2), '#9FF0A8', 6, 80);
  return o;
}
function shSnail(t) {
  const tJ = A[10].word('journey').t0, tS = A[10].word('sweetie').t0;
  const x = carX(t);
  const cam = camKeys(t, [[c26, camAt(x + 80, 800, 1.4)], [c27, camAt(carX(c27) + 80, 800, 1.45)]]);
  const wave = t > tS - 0.2 ? 1 : 0;
  const car = X.grannyCar(x, 978, 1, t, { face: { name: 'happy', eyes: { look: [wave ? 0.8 : -0.3, 0] } }, armR: wave ? 150 + 20 * Math.sin(t * 12) : 70 });
  // the snail overtakes: enters behind the car's rear wheel, passes on "journey", gone by "sweetie"
  const sx = lerp(x - 520, x + 720, ease.inOut(seg(t, c26 + 0.3, tS + 0.4)));
  const sn = X.snail(sx, 1010, 0.72, t, { speed: 1 });
  let o = streetShot(t, cam, car + sn);
  o += K.bang('ZOOM!', 1500, 380, seg(t, tJ, tJ + 0.12) * (1 - seg(t, tS + 0.4, tS + 0.6)), 110, -8, '#FFE14D');
  return o;
}

// ================================================================= 27. PANCAKE
function rosette(x, y, s, k) {
  if (k <= 0) return '';
  let o = S.path('M-40 40 L-70 170 L-30 140 L-10 180 L0 50 Z M40 40 L70 170 L30 140 L10 180 L0 50 Z', ol('#3A7BFF', 5));
  let d = '';
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; d += X.circD(Math.cos(a) * 80, Math.sin(a) * 80, 26); }
  o += S.path(d, ol('#FFD21F', 5)) + S.circle(0, 0, 76, ol('#FFE88A', 5)) + T('#1', 0, -6, 52, '#3A7BFF') + TF('LAZIEST', 0, 30, 24, '#151515');
  return S.g(o, `${tr(x, y, s, -10)} scale(${f(pop(k))})`);
}
function shPancake(t) {
  const tP = w(11, 'Pancake'), tL = w(11, 'laziest');
  const cb = LR.catBed;
  const cam = camKeys(t, [[c27, camAt(1300, 620, 1.3)], [c28, camAt(cb.x, 820, 2.6)]]);
  const cat = pancake({ x: cb.x, y: cb.y - 4, s: 0.55, t, pose: 'sleep', mood: 'lazy' });
  let o = room(SETS.livingRoom, t, cam, { call: false }, { chars: cat });
  o += playerCard('pancake', 'cat · moves 2x a day', seg(t, tP - 0.1, tP + 0.25), seg(t, c28 - 0.3, c28), t, 70, 110, '#FF8A2A', 'AFK');
  o += rosette(1500, 330, 1.1, seg(t, tL, tL + 0.25));
  return o;
}
function catWalkPanel(t, t0, clock) {
  const u = seg(t, t0, t0 + 1.6);
  return X.deskClose(t, X.textScreen(['Monday homework:', 'Q1: ...'], { title: 'Homework.doc' })) +
    pancake({ x: lerp(-200, 900, ease.out(u)), y: 1000, s: 1.3, t, pose: 'walk', flip: true, mood: 'smug' }) +
    S.g(S.circle(0, 0, 70, ol('#FFFFFF', 7)) + S.path(`M0 0 L0 -46 M0 0 L${clock === 'AM' ? 34 : -34} 10`, ln(8)) + T(clock, 0, 112, 50, '#FFFFFF', OUT(8)), 'translate(1340 270)');
}
function shTwice(t) {
  const tT = w(11, 'twice'), tD = w(11, 'day');
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FF9A3D' }) + K.rays(960, 540, 14, 1400, '#FFB86A', 0.7, t * 10);
  o += panel(80, 210, 860, 640, catWalkPanel(t, tT, 'AM'), seg(t, tT - 0.05, tT + 0.2), { focus: [800, 640], zoom: 1.05, rot: -2, label: 'MOVE #1', labelCol: '#FFD21F' });
  o += panel(980, 210, 860, 640, catWalkPanel(t, tD, 'PM'), seg(t, tD - 0.05, tD + 0.2), { focus: [800, 640], zoom: 1.05, rot: 2, label: 'MOVE #2', labelCol: '#9FE0FF' });
  o += T('MOVES PER DAY: 2', 960, 150, 84, '#FFFFFF', OUT(14));
  return o;
}
function shKeys(t) {
  const tSit = w(11, 'sit'), tK = w(11, 'keyboard');
  const land = tSit + 0.18;
  const nK = Math.floor(lerp(0, 70, seg(t, land, tK + 0.6)));
  const rows = [];
  for (let i = 0; i < Math.ceil(nK / 24); i++) rows.push('k'.repeat(Math.min(24, nK - i * 24)));
  const scr = X.textScreen(['Monday homework:', 'Q1: The answer is', ...rows], { title: 'Homework.doc' });
  const cam = shakeCam(camKeys(t, [[c29, camAt(960, 600, 1.0)], [land, camAt(960, 640, 1.08)], [c30, camAt(960, 560, 1.25)]]), t, land, 0.35, 16);
  let o = X.deskClose(t, scr);
  // the hero's hands typing (block hands + red sleeves), squeezed out when the cat lands
  const push = ease.out(seg(t, land, land + 0.25));
  const typ = (i) => (t < land ? Math.max(0, Math.sin(t * 22 + i * 2)) * 12 : 0);
  for (const [sx, i] of [[-1, 0], [1, 1]]) {
    const hx = 960 + sx * lerp(240, 600, push), hy = 960 - typ(i);
    o += S.g(S.path('M-70 300 L-50 40 L50 40 L70 300 Z', ol('#D8262E', 7)) + S.rect(-56, -40, 112, 96, 24, ol('#FFFFFF', 7)), tr(hx, hy, 1, sx * lerp(-8, 20, push)));
  }
  // Pancake falls from above, squash on landing
  const fall = seg(t, tSit - 0.25, land);
  if (t > tSit - 0.25) {
    const sq = bump(t, land, land + 0.3);
    o += S.g(pancake({ x: 0, y: 0, s: 1.6, t, pose: 'loaf', mood: t > land + 0.4 ? 'smug' : 'surprised', shadow: false }), `translate(960 ${f(lerp(-200, 1000, ease.in(fall)))}) scale(${f(1 + 0.18 * sq)} ${f(1 - 0.16 * sq)})`);
  }
  o = view(cam, o, 1);
  o += K.bang('FLOP!', 1500, 300, seg(t, land, land + 0.12) * (1 - seg(t, c30 - 0.3, c30)), 130, 8, '#FFE14D');
  return o;
}

// ================================================================= 30. ZOE
function hallShot(t, cam, chars) {
  const Ls = SETS.hallway.layers(t, cam, {});
  return Ls.bg + Ls.mid + view(cam, chars, 1) + Ls.fg;
}
function shZoe(t) {
  const tZ = w(12, 'Zoe'), tB = w(12, 'best');
  const zx = 900 + 200 * (t - c30);
  const cam = { zoom: 1.35, x: zx - 960 + 120, y: 120 };
  const ph = (t - c30) * 7.5;
  const zoe = actor('zoe', t, { x: zx, y: 960, s: 0.5, view: 'side', flip: true, laptop: true, ...AC.walk(ph), armL: 30, armR: 30, face: 'smug' }, { arms: false });
  const hero = you(t, { x: zx - 300, y: 960, s: 0.5, view: 'side', flip: true, ...AC.walk(ph + 1.5), face: 'happy' });
  let o = hallShot(t, cam, hero + zoe);
  o += playerCard('zoe', 'best friend · tech genius', seg(t, tZ - 0.1, tZ + 0.25), seg(t, c31 - 0.3, c31), t, 70, 110, '#B98CFF', 'PRO');
  o += tag('BEST FRIEND', 1440, 260, seg(t, tB, tB + 0.2), '#B98CFF', 5, 56);
  return o;
}
const GLYPHS = ['</>', '01', '{ }', 'sudo', '#!', '0x1F', '&&', 'ping', '404', ';;'];
function shZoeType(t) {
  const tC = w(12, 'computers');
  const cam = camKeys(t, [[c31, camAt(1060, 650, 1.6)], [c32, camAt(1040, 640, 1.75)]]);
  const fast = Math.sin(t * 40) * 10;
  const zoe = actor('zoe', t, { x: 900, y: 1000, s: 0.5, laptop: true, armL: 28 + fast, armR: 28 - fast, headRot: 2, face: { name: 'smug', eyes: { look: [0, 0.7] } } }, { arms: false });
  const hero = you(t, { x: 1300, y: 1000, s: 0.5, turn: -0.4, armL: 10, armR: 10, face: { name: 'confused', fx: t > tC ? ['question'] : [] } });
  let fx = '';
  for (let i = 0; i < 12; i++) { const ph = (t * 1.3 + hash(i * 3.1)) % 1; fx += TF(GLYPHS[i % GLYPHS.length], 900 + (hash(i) - 0.5) * 360 + Math.sin(t * 3 + i) * 20, 760 - ph * 420, 30 + 12 * hash(i * 2), '#3DFF9A', { opacity: f(1 - ph), ...OUT(5) }); }
  let o = hallShot(t, cam, zoe + hero + fx);
  if (t > tC) o += view(cam, K.F.sparkle(870 + 34, 640, 24 * bump(t, tC, tC + 0.5)), 1);
  return o;
}
function shZoeTell(t) {
  const tT = w(12, 'tell');
  const cam = camKeys(t, [[c32, camAt(1100, 640, 1.5)], [c33, camAt(1100, 640, 1.6)]]);
  const turnK = ease.out(seg(t, c32, c32 + 0.3));
  const zoe = actor('zoe', t, { x: 900, y: 1000, s: 0.5, turn: 0.5 * turnK, laptop: 'closed', armR: lerp(24, 150, seg(t, tT - 0.3, tT)), armL: 24, face: 'deadpan' }, { arms: false });
  const shrink = ease.out(seg(t, tT - 0.2, tT + 0.2));
  const hero = you(t, { x: 1320, y: 1000, s: 0.5, turn: -0.4, armL: 10, armR: 10, sy: 1 - 0.08 * shrink, face: { name: 'nervous', fx: ['sweat'] } });
  let o = hallShot(t, cam, zoe + hero);
  o += tag('ACTUALLY...', 760, 300, seg(t, tT - 0.1, tT + 0.15), '#B98CFF', -6, 60);
  return o;
}

// ================================================================= 33. the password note
function shPass(t) {
  const tP = w(13, 'password'), tS = w(13, 'sticky');
  const cam = camKeys(t, [[c33, camAt(1100, 640, 1.35)], [tS - 0.1, camAt(1060, 620, 1.45)], [c34, camAt(HR.note.x, HR.note.y, 2.4)]]);
  const zoe = actor('zoe', t, { x: 1250, y: 990, s: 0.5, turn: -0.4, armL: lerp(20, 120, seg(t, tP - 0.3, tP)), armR: 20, face: 'deadpan' }, { arms: false, energy: 0.6 });
  const hero = you(t, { x: 1560, y: 990, s: 0.5, turn: -0.3, armL: 10, armR: 10, face: 'nervous' });
  return room(SETS.heroRoom, t, cam, { time: 'day', laptopAt: false }, { chars: zoe + hero });
}
function shNote(t) {
  const tM = w(13, 'monitor');
  const cam = camKeys(t, [[c34, camAt(HR.note.x - 10, HR.note.y, 5.2)], [c35, camAt(HR.note.x, HR.note.y + 4, 5.8)]]);
  let o = room(SETS.heroRoom, t, cam, { time: 'day', laptopAt: false });
  const k = seg(t, tM, tM + 0.3);
  if (k > 0) o += S.path('M820 330 C640 340 650 760 960 760 C1260 760 1280 330 1000 320', { fill: 'none', stroke: '#FF2E4E', 'stroke-width': 16, 'stroke-linecap': 'round', 'stroke-dasharray': `${f(1500 * k)} 3000` });
  return o;
}
function shWindow(t) {
  const tW = w(13, 'window');
  const cam = camKeys(t, [[c35, camAt(560, 480, 1.45)], [c36, camAt(600, 470, 1.55)]]);
  const peek = ease.outBack(seg(t, c35 + 0.1, c35 + 0.45));
  const py = lerp(720, 566, peek), ps = 1.6;
  const pg = SETS.pigeon(330, py, ps, t, { state: 'idle', flip: true });
  const hx = 330 + 50 * ps, hy = py - 92 * ps;
  const glasses = S.g(S.rect(-30, -14, 30, 24, 8, { fill: '#151515' }) + S.rect(6, -14, 30, 24, 8, { fill: '#151515' }) + S.path('M0 -6 L6 -6 M-30 -8 L-46 -14', ln(4)), tr(hx + 4, hy - 4, 0.9, -6));
  let o = room(SETS.heroRoom, t, cam, { time: 'day', laptopAt: false }, { outside: pg + (t > tW - 0.1 ? glasses : '') });
  const sk = seg(t, tW, tW + 0.4);
  if (sk > 0) o += view(cam, S.path(`M${f(hx + 30)} ${f(hy)} L${f(lerp(hx + 30, HR.note.x, sk))} ${f(lerp(hy, HR.note.y, sk))}`, { fill: 'none', stroke: '#FF2E4E', 'stroke-width': 6, 'stroke-dasharray': '16 12' }), 1);
  o += view(cam, K.bang('!!', hx + 60, hy - 90, seg(t, c35 + 0.4, c35 + 0.55), 60, 10, '#FFFFFF'), 1);
  return o;
}
function shSecret(t) {
  const tS = A[14].word('SECRET').t0;
  const cam = shakeCam(camKeys(t, [[c36, camAt(1360, 620, 1.75)], [tS - 0.05, camAt(1380, 600, 1.85)], [tS + 0.06, camAt(1420, 560, 2.4)], [c37, camAt(1420, 560, 2.45)]]), t, tS, 0.35, 14);
  const hold = ease.outBack(seg(t, c36, c36 + 0.25));
  const note = { svg: S.g(SETS.stickyNote(0, 0, 0, ['TOP', 'SECRET'], { w: 190, size: 40, col: '#FFE45C', ink: '#E8243C' }), tr(250, -850, 1, 8)), layer: 'top' };
  const hero = you(t, { x: 1450, y: 990, s: 0.5, turn: -0.2, armR: lerp(20, 150, hold), armL: 20, lean: -3, face: { name: 'angry', fx: ['anger'] }, props: [note] }, { arms: false, energy: 1.5 });
  const zoe = actor('zoe', t, { x: 1050, y: 990, s: 0.5, turn: 0.4, armL: 20, armR: 20, face: 'deadpan' }, { arms: false });
  return room(SETS.heroRoom, t, cam, { time: 'day', laptopAt: false, note: [' ', ' '] }, { chars: zoe + hero });
}

// ================================================================= 37. BRICK
const CF = SPOTS.cafeteria;
const trayProp = (n, x = 0, y = -330) => ({ svg: SETS.tray(x, y, 1.1, { cookies: n }), layer: 'front' });
function cafe(t, cam, chars, over = '') { return room(SETS.cafeteria, t, cam, {}, { chars, over }); }
function shShadow(t) {
  const tT = w(15, 'then'), tB = w(15, "there's");
  const cam = shakes(camKeys(t, [[c37, camAt(860, 640, 1.45)], [c38, camAt(880, 620, 1.55)]]), t, [[tT, 0.25, 10], [tB, 0.25, 12]]);
  const look = ease.out(seg(t, tT, tT + 0.4));
  const hero = you(t, { x: 980, y: 990, s: 0.5, turn: lerp(0, 0.5, look), armL: 26, armR: 26, bodyY: 4 * Math.sin(t * 30) * look, face: { name: look > 0.5 ? 'scared' : 'happy', eyes: { look: [0.8 * look, -0.4 * look] } }, props: [trayProp(2)] });
  const zoe = actor('zoe', t, { x: 660, y: 990, s: 0.5, turn: lerp(0, 0.6, look), laptop: 'closed', face: { name: look > 0.5 ? 'shocked' : 'neutral', eyes: { look: [0.8 * look, -0.4 * look] } } }, { arms: false });
  const sh = ease.inOut(seg(t, c37, c38 + 0.1));
  const shadow = S.g(S.path('M-420 1400 L-380 380 Q-370 250 -240 220 L-150 200 L-170 40 Q-170 -160 0 -170 Q170 -160 170 40 L150 200 L240 220 Q370 250 380 380 L420 1400 Z M-200 -70 L-330 -90 L-180 -160 Z', { fill: '#140A2A' }), tr(lerp(2300, 1250, sh), 160, 1.25), { opacity: 0.6 });
  return cafe(t, cam, zoe + hero, shadow);
}
function shBrick(t) {
  const tB = w(15, 'Brick');
  const cam = shakeCam(camKeys(t, [[c38, camAt(1150, 520, 1.9)], [c39, camAt(1150, 500, 2.05)]]), t, tB, 0.45, 16);
  const crack = Math.max(bump(t, tB, tB + 0.25), bump(t, tB + 0.35, tB + 0.6));
  const brick = actor('brick', t, { x: 1150, y: 1180, s: 0.62, armL: 30 + 14 * crack, armR: 30 + 14 * crack, face: { name: 'smug', eyes: { look: [-0.3, 0.5] } }, lean: 2 * crack }, { arms: false });
  let o = cafe(t, cam, brick);
  o += K.bang('CRACK!', 1500, 760, seg(t, tB, tB + 0.1) * (1 - seg(t, tB + 0.7, tB + 0.9)), 100, -10, '#FFFFFF');
  o += playerCard('brick', 'the bully · takes lunch', seg(t, tB - 0.05, tB + 0.25), seg(t, c39 - 0.25, c39), t, 70, 110, '#FF5A5A', '⚠ HUGE');
  return o;
}
function brickTwo(t, cam, brickPose, heroPose, over = '') {
  const brick = actor('brick', t, { x: 1250, y: 1010, s: 0.5, turn: -0.35, ...brickPose }, { arms: false });
  const hero = you(t, { x: 760, y: 1000, s: 0.5, turn: 0.3, ...heroPose });
  return cafe(t, cam, hero + brick, over);
}
function shMoney(t) {
  const tM = w(16, 'money');
  const cam = camKeys(t, [[c39, camAt(1000, 560, 1.3)], [c40, camAt(1000, 560, 1.4)]]);
  const give = seg(t, tM - 0.2, tM + 0.4);
  // coins hop from the hero's hand to Brick's palm
  const hx = 760 + AC.hand(70, 1)[0] * 0.5, hy = 1000 + AC.hand(70, 1)[1] * 0.5;
  const bx = 1250 + AC.hand(75, -1)[0] * 0.5 * 1.3, by = 1010 + AC.hand(75, -1)[1] * 0.5 * 1.3;
  let coins = '';
  for (let i = 0; i < 3; i++) { const u = ease.inOut(seg(give, i * 0.15, i * 0.15 + 0.6)); coins += X.coinS(lerp(hx, bx, u) + i * 14, lerp(hy, by, u) - Math.sin(u * Math.PI) * 120 - 20, 16, i * 30); }
  return brickTwo(t, cam, { armL: 75, armR: 12, face: 'smug' }, { armR: 70, armL: 10, face: { name: 'nervous', fx: ['sweat'] }, props: [] }, coins) + K.bang('CLINK!', 1150, 380, seg(t, tM + 0.35, tM + 0.45) * (1 - seg(t, c40 - 0.2, c40)), 70, 6, '#FFE14D');
}
function shCookie(t) {
  const tC = w(16, 'cookie');
  const cam = camKeys(t, [[c40, camAt(960, 560, 1.0)], [c41, camAt(960, 560, 1.08)]]);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#E4F0FB' }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#setsCinder)', opacity: 0.6 }) + S.rect(0, 700, 1920, 400, 0, { fill: '#C9D6E8' });
  const grab = seg(t, tC - 0.35, tC + 0.1), away = ease.in(seg(t, tC + 0.1, tC + 0.7));
  o += SETS.tray(960, 640, 3.2, { cookies: t < tC ? 2 : 1 });
  // Brick's giant hand: reaches down from the top right, pinches the cookie, lifts it away
  const ex = lerp(1500, 1250, ease.out(grab)) + 400 * away, ey = lerp(-80, 560, ease.out(grab)) - 900 * away;
  o += S.g(S.path('M-120 -600 L-110 0 L130 0 L140 -600 Z', ol('#F0BE96', 8)) + S.rect(-150, -40, 300, 220, 46, ol('#F0BE96', 8)) + S.path('M-80 150 L-80 60 M-10 160 L-10 60 M60 150 L60 60', ln(8, '#B07A54')), tr(ex, ey, 1, -18));
  if (t >= tC) o += X.cookie(ex + 30, ey + 200, 56, 0, t * 90);
  o = view(cam, o, 1);
  o += tag('COOKIE #1', 420, 240, seg(t, tC, tC + 0.2), '#D9964E', -6, 66);
  return o;
}
function shOther(t) {
  const tO = w(16, 'OTHER');
  const cam = shakeCam(camKeys(t, [[c41, camAt(1000, 560, 1.35)], [tO - 0.05, camAt(1050, 520, 1.45)], [tO + 0.06, camAt(1215, 520, 2.4)], [c42, camAt(1215, 520, 2.5)]]), t, tO, 0.4, 14);
  const lean = ease.inOut(seg(t, c41, tO));
  const hide = { svg: X.cookie(-210, -330, 50), layer: 'back' };
  return brickTwo(t, cam, { armL: lerp(20, 100, lean), armR: 12, lean: -10 * lean, headY: 20 * lean, face: { name: 'smug', eyes: { look: [-0.6, 0.6] } } }, { armR: 6, armL: 34, face: { name: 'nervous', fx: ['sweat2'], eyes: { look: [0.6, -0.3] } }, props: [hide] });
}
function shNo(t) {
  const tNo = A[17].word('No').t0;
  const cam = camKeys(t, [[c42, camAt(760, 660, 1.6)], [c43, camAt(760, 600, 1.85)]]);
  const brave = ease.outBack(seg(t, tNo - 0.05, tNo + 0.25));
  const hero = you(t, { x: 760, y: 1000, s: 0.5, turn: 0.15, armL: lerp(10, 40, brave), armR: lerp(10, 40, brave), sy: 1 + 0.05 * brave, lean: -2, face: { name: 'determined', fx: ['anger'] } }, { arms: false });
  const rays = K.rays(760, 600, 18, 1600, '#FFE88A', 0.45 * clamp(brave, 0, 1), t * 30);
  let o = room(SETS.cafeteria, t, cam, {}, { chars: rays + hero });
  o += K.bang('NO!', 1460, 330, seg(t, tNo, tNo + 0.12), 160, -8, '#FFE14D');
  return o;
}
function shOkay(t) {
  const tH = A[17].word('Here').t0, tB = A[17].word('both').t0;
  const cam = camKeys(t, [[c43, camAt(1000, 560, 1.32)], [c44, camAt(1010, 560, 1.4)]]);
  const offer = ease.outBack(seg(t, tH - 0.2, tH + 0.2));
  const take = ease.inOut(seg(t, tB + 0.2, tB + 0.6));
  const hl = AC.hand(60, -1), hr = AC.hand(60, 1);
  const ck = take < 0.5 ? [{ svg: X.cookie(hl[0], hl[1] - 20, 62) + X.cookie(hr[0], hr[1] - 20, 62), layer: 'front' }] : [];
  const munch = t > tB + 0.6 ? Math.abs(Math.sin(t * 12)) : 0;
  const crumbs = t > tB + 0.6 ? Array.from({ length: 6 }, (_, i) => { const k = ((t * 1.5 + i / 6) % 1); return S.circle(1240 + (hash(i) - 0.5) * 80, 420 + k * 300, 6, { fill: '#D9964E', stroke: '#151515', 'stroke-width': 2 }); }).join('') : '';
  return brickTwo(t, cam,
    { armL: take > 0.5 ? 150 : lerp(20, 80, take * 2), armR: 12, face: munch ? { name: 'happy', eyes: { type: 'closed' }, mouth: munch > 0.5 ? 'O' : 'smile' } : 'smug' },
    { armL: lerp(10, 60, offer), armR: lerp(10, 60, offer), face: { name: 'nervous', mouth: 'smile', fx: ['sweat'] }, props: ck }, crumbs + (take > 0.5 ? X.cookie(1250 + AC.hand(150, -1)[0] * 0.65, 1010 + AC.hand(150, -1)[1] * 0.65, 28) : ''));
}
function shLegend(t) {
  const ws = [w(18, 'Very'), w(18, 'Very', 1), w(18, 'Truly')], tL = w(18, 'legend');
  const cam = camKeys(t, [[c44, camAt(880, 600, 1.55)], [c45, camAt(900, 600, 1.65)]]);
  const clap = Math.max(...ws.map((x) => bump(t, x, x + 0.3)));
  const zoe = actor('zoe', t, { x: 720, y: 1000, s: 0.5, turn: 0.2, armL: lerp(30, 14, clap), armR: lerp(30, 14, clap), face: 'deadpan' }, { arms: false });
  const medal = t > tL ? [{ svg: S.g(S.path('M-30 -120 L0 -40 L30 -120', ln(10, '#3A7BFF')) + S.circle(0, -10, 40, ol('#C9CED8', 6)) + TF('LEGEND', 0, 0, 16, '#151515'), `translate(-30 -420) scale(${f(1.7 * pop(seg(t, tL, tL + 0.3)))}) rotate(-12)`), layer: 'top' }] : [];
  const hero = you(t, { x: 1150, y: 1000, s: 0.5, turn: -0.2, armL: 10, armR: t > tL + 0.3 ? 140 : 10, face: { name: 'sad', mouth: t > tL + 0.3 ? 'smallSmile' : 'frown' }, props: medal });
  let o = cafe(t, cam, zoe + hero);
  for (const x of ws) o += view(cam, K.bang('clap', 720, 560, seg(t, x, x + 0.08) * (1 - seg(t, x + 0.35, x + 0.45)), 46, -6, '#FFFFFF'), 1);
  return o;
}

// ================================================================= 45. the night + the dream
function bedNight(t, cam, heroFace, over = '') {
  const hero = you(t, { ...HR.bed.lie, face: heroFace });
  return room(SETS.heroRoom, t, cam, { time: 'night', laptopAt: false }, { behind: hero, light: false, night: nightLight(1560, 640, 90, 760, 0.74) + SETS.glowSpot(1560, 640, Math.min(300, 420 / cam.zoom), 'setsGlowBlue', 0.3), over });
}
function dreamSky(t) {
  return S.rect(-400, -400, 2720, 1880, 0, { fill: 'url(#s02dream)' }) + SETS.cloud(300 + ((t * 30) % 300), 260, 1.4, '#FFFFFF', '#FFD3EC') + SETS.cloud(1500 - ((t * 24) % 300), 180, 1.1, '#FFFFFF', '#FFD3EC') + SETS.cloud(1100, 820, 1.8, '#FFFFFF', '#FFD3EC');
}
function dreamPicked(t) {
  // schoolyard: the hero flies over the school with a golden crown, kids cheer
  const Ls = SETS.schoolyard.layers(t, { time: 'day' });
  let o = Ls.bg + Ls.mid + (Ls.front || '');
  const fy = 330 + 20 * Math.sin(t * 3);
  for (let i = 0; i < 5; i++) o += K.draw.kid([2, 5, 8, 11, 14][i], { volume: false, x: 300 + i * 330, y: 990, s: 0.42, armL: 150 + 15 * Math.sin(t * 10 + i), armR: 160 + 15 * Math.sin(t * 9 + i * 2), lift: 20 * Math.abs(Math.sin(t * 7 + i)), face: 'excited', view: 'back' });
  o += you(t, { x: 960 + 60 * Math.sin(t * 1.3), y: fy + 480, s: 0.42, armL: 160, armR: 100, legL: 10, legR: -14, lean: 10, face: 'joy', props: [{ svg: X.crown(0, -1010, 1.2, -6), layer: 'top' }] });
  return o;
}
function shBed(t) {
  const tD = w(19, 'dream');
  const cam = camKeys(t, [[c45, camAt(1350, 560, 1.35)], [c46, camAt(1350, 480, 1.6)]]);
  const bk = seg(t, tD - 0.1, tD + 0.6);
  const bubble = X.dreamBubble(1200, 300, 720, 400, dreamPicked(t), bk, 1640, 760, [960, 600], 1.0);
  return bedNight(t, cam, { name: 'sad', eyes: { look: [0, -1] } }, bubble);
}
function shStrong(t) {
  const tS = w(19, 'strong');
  const cam = camKeys(t, [[c46, camAt(960, 560, 1.15)], [c47, camAt(960, 540, 1.25)]]);
  const lift = ease.outBack(seg(t, c46, c46 + 0.5));
  const hx = 960, hy = 1000;
  const hand = AC.hand(176, 1);
  const brick = actor('brick', t, { x: 0, y: 0, s: 0.36, rot: 90, rotY: -470, armL: 150 + 20 * Math.sin(t * 14), armR: 160 + 20 * Math.sin(t * 13), legL: 20 * Math.sin(t * 12), legR: -20 * Math.sin(t * 12), face: { name: 'scared', fx: ['sweat'] } });
  let o = dreamSky(t) + K.rays(960, 400, 16, 1400, '#FFFFFF', 0.35, t * 20);
  o += S.g(brick, `translate(${f(hx + hand[0] * 0.55 - 30)} ${f(hy + hand[1] * 0.55 + 30 - 200 * (1 - lift))})`);
  o += you(t, { x: hx, y: hy, s: 0.55, armR: 176, armL: 40, sx: 1.08, face: { name: 'smug' }, lean: -2 });
  o = view(cam, o, 1) + X.dreamFrame(t);
  o += tag('STRONG', 1500, 300, seg(t, tS, tS + 0.2), '#FFD21F', -6, 90);
  return o;
}
function shFast(t) {
  const tF = w(19, 'fast');
  const cam = camAt(960, 560, 1.1);
  const u = seg(t, c47, c48);
  const hx = lerp(-300, 2300, u), hy = 900;
  let o = dreamSky(t);
  o += C.speedLines(-200, 1920, 520, 14, Math.floor(t * 10), '#FFFFFF', 700);
  o += fireTrail({ x: hx - 120, y: hy - 300, len: 1100, angle: 180, w: 150, t });
  o += you(t, { x: hx, y: hy, s: 0.5, view: 'side', flip: true, ...AC.run(t * 40), lean: 14, face: 'excited' });
  o = view(cam, o, 1) + X.dreamFrame(t);
  o += tag('FAST', 1460, 300, seg(t, tF, tF + 0.2), '#FF8A3D', 6, 100);
  return o;
}
function shPicked(t) {
  const tN = w(19, 'never'), tL = w(19, 'last');
  const cam = camKeys(t, [[c48, camAt(960, 560, 1.15)], [c49, camAt(960, 500, 1.3)]]);
  let o = view(cam, dreamPicked(t) + K.confetti(t, tL, 40, 4), 1) + X.dreamFrame(t);
  o += tag('PICKED FIRST!', 960, 200, seg(t, tN, tN + 0.25), '#FFD21F', -4, 90);
  return o;
}
function shPop(t) {
  const tP = c49 + 0.25, tN = B.word('Monday').t0;
  const cam = camKeys(t, [[c49, camAt(1350, 480, 1.6)], [c50, camAt(1300, 560, 1.3)]]);
  const bk = 1 - seg(t, tP, tP + 0.08);
  const bubble = X.dreamBubble(1200, 300, 720, 400, dreamPicked(t), bk, 1640, 760, [960, 600], 1.0);
  let o = bedNight(t, cam, { name: 'sleepy', eyes: { type: 'closed' }, fx: ['zzz'] }, bubble);
  o += K.bang('POP!', 1200, 300, seg(t, tP, tP + 0.1) * (1 - seg(t, tP + 0.5, tP + 0.7)), 140, -8, '#FFFFFF');
  o += tag('MONDAY ✓', 1450, 820, seg(t, tN, tN + 0.2), '#9FE0FF', 4, 60);
  return o;
}
function shTease(t) {
  // the garage sale, glowing violet at the end of a street that shouldn't exist... then the dusty laptop
  if (t < tGarage) {
    const cam = camKeys(t, [[c50, { x: 1500, y: 0, zoom: 1.0 }], [tGarage, { x: 1700, y: 40, zoom: 1.3 }]], ease.in);
    const Ls = SETS.serverStreet.layers(t, cam, {});
    return Ls.bg + Ls.mid + Ls.fg;
  }
  const lap = SPOTS.garageSale.laptop;
  const cam = camKeys(t, [[tGarage, camAt(lap.x, lap.y - 60, 3.4)], [END, camAt(lap.x, lap.y - 60, 4.2)]]);
  const Ls = SETS.garageSale.layers(t, { glow: 0.5 + 0.5 * Math.abs(Math.sin(t * 4)) });
  let o = view(cam, Ls.bg, 0.7) + view(cam, Ls.mid + Ls.front, 1) + view(cam, Ls.light, 1);
  o += C.whiteFlash(seg(t, END - 0.15, END) * 0.9);
  return o;
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [c01, shStreet], [c02, shNormal], [c03, shPigeon], [c04, shGym], [c05, shEvery], [c06, shCast], [c07, shDesk], [c08, shObby],
  [c09, shTitle], [c10, shNowhere], [c11, shSink], [c12, shWhole], [c13, shName], [c14, shDad], [c15, shDadCall], [c16, shCan1],
  [c17, shCan2], [c18, shCan3], [c19, shMom], [c20, shNotes], [c21, shRoom], [c22, shOfficial], [c23, shGranny], [c24, shCrawl],
  [c25, shSpeedo], [c26, shSnail], [c27, shPancake], [c28, shTwice], [c29, shKeys], [c30, shZoe], [c31, shZoeType], [c32, shZoeTell],
  [c33, shPass], [c34, shNote], [c35, shWindow], [c36, shSecret], [c37, shShadow], [c38, shBrick], [c39, shMoney], [c40, shCookie],
  [c41, shOther], [c42, shNo], [c43, shOkay], [c44, shLegend], [c45, shBed], [c46, shStrong], [c47, shFast], [c48, shPicked],
  [c49, shPop], [c50, shTease],
];
const CUTS = SHOTS.slice(1).map((s) => s[0]).filter((c) => ![c08, c12, c46, c47, c48, c49].includes(c));
const WHIPS = [c04, c07, c14, c19, c23, c27, c30, c45];
function scene(t) {
  let fn = SHOTS[0][1];
  for (const [t0, s] of SHOTS) if (t >= t0) fn = s;
  let o = fn(t);
  o += X.cutFlash(t, CUTS, 0.35, 0.06);
  for (const tw of WHIPS) o += X.whip(t, tw, 0.13);
  // dream transitions: soft pink flash
  for (const tc of [c46, c47, c48, c49]) { const k = 1 - Math.abs(t - tc) / 0.12; if (k > 0) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFE3F4', opacity: f(0.7 * k) }); }
  return o;
}
function look(t) {
  if (t >= c08 && t < c14 && !(t >= c10 && t < c11)) return { grade: null, vignette: 0.4 };
  if (t >= c45 && t < c46) return { grade: 'cool', vignette: 0.9 };
  if (t >= c49 && t < c50) return { grade: 'cool', vignette: 0.9 };
  if (t >= c46 && t < c49) return { grade: 'warm', vignette: 0.3 };
  if (t >= c50) return { grade: 'night', vignette: 1 };
  if (t >= c04 && t < c07) return { grade: 'cool', vignette: 0.7 };
  if (t >= c30 && t < c33) return { grade: 'cool', vignette: 0.7 };
  if (t >= c37 && t < c45) return { grade: 'cool', vignette: 0.7 };
  return { grade: 'warm' };
}
module.exports = { scene, look, DEFS };
