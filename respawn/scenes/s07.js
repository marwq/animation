// SC 07 · ЛАГИ — the save file gets heavy and the world starts to lag.
// Night bedroom: the checkpoint blinks red, Tip glitches ("the s-s-save file... heavy": a giant floppy SAVE FILE drops like an
// anvil), the shot itself freezes on "l-l-lag", the hero's own body freezes on "can't lag". Friday morning: Mom stutters
// (pose frame-repeats + RGB split), birds freeze in the sky (loading wheels), the school bus rubber-bands back to the corner,
// the dog is stuck half inside the fence, Dad's pancake hangs in the air and spins like a loading icon ("thinking about it"),
// the street pops into GRAPHICS: LOW, "2006?!", the hero trips over a missing-collision box -> RESPAWNING (glitched) -> wrong
// places, each a quick gag with its own respawn device: the top of the flagpole (pull-out reveal), tiny in Gary's bowl (blocks
// float up like bubbles), the gym ball bin (balls rain, Coach Dee), Mr. Fig's birthday cake (all teachers frozen) -> the
// "UNSOLVED" case photo on a cork board. Hands over to SC 08 with a red alarm glitch.
'use strict';

const K = require('./kit');
const R = require('./respawn');
const H = require('./sets_home');
const SS = require('./sets_school');
const X = require('../rig/extras');
const AC = require('./acting');
const E = require('./s07_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { pop, at, toScr, shakeAll, boing, breathe, scaleG, TS, TFS } = E;

const A = Array.from({ length: 17 }, (_, i) => L('07.' + i));
const T0 = K.V.TL.scenes['SC 07'].start;
const END = K.V.TL.scenes['SC 08'].start;
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const draw = K.draw;

// ---------------------------------------------------------------- beats (all from the voice)
const CUT = {};
CUT.room = T0;
CUT.disk = w(0, 'sssave') - 0.25;
const tHeavy = w(0, 'heavy');
CUT.face = w(0, 'The', 1) - 0.1;
const tLag = w(0, 'lllag');
CUT.lagq = A[1].a - 0.1;
CUT.mom = A[2].a - 0.15;
CUT.birds = A[3].a - 0.1;
const tFroze = w(3, 'froze');
CUT.bus = w(3, 'The', 1) - 0.1;
CUT.dog = w(3, 'same') - 0.12;
CUT.pancake = w(3, 'And') - 0.12;
const tFlip = w(3, 'pancake') - 0.05, tHang = w(3, 'just');
CUT.dad = A[4].a - 0.1;
CUT.low = A[5].a - 0.1;
CUT.y2006 = A[6].a - 0.1;
CUT.walk = A[7].a - 0.1;
const tTrip = w(7, 'wrong') + 0.05;
const tOv = tTrip + 0.32;                                   // the (glitched) RESPAWNING overlay
const MARKS = ['three', 'two', 'one'].map((x) => w(8, x));
const tPop1 = Math.max(MARKS[2] + 0.3, A[8].b + 0.02);     // pop on top of the flagpole
CUT.pole = tPop1 - 0.02;
const tNot = w(9, 'NOT');
CUT.poleCr = Math.max(A[9].b - 0.05, A[10].a - 0.12);
const tCr2 = CUT.poleCr + 0.07;
CUT.bowl = Math.min(A[10].b + 0.08, A[11].a - 0.2);
const tCr3 = A[12].a - 0.06;
CUT.bin = Math.min(A[12].b + 0.05, A[12].a + 0.32);
const tCr4 = A[14].a - 0.05;
CUT.cake = Math.min(A[14].b + 0.08, A[14].a + 0.45);
CUT.fig = Math.max(w(15, 'my') - 0.12, w(15, 'birthday') - 0.15);
CUT.tableau = A[16].a - 0.1;
CUT.case = w(16, 'To') - 0.12;
const tNobody = w(16, 'nobody'), tHow = w(16, 'how');

// ================================================================= 1. NIGHT BEDROOM
const RM = H.SPOTS.heroRoom;
const PAD = { ...RM.checkpoint };
const roomOpts = (t) => ({ time: 'night', clock: '3:12', redBlink: 0.35 + 0.65 * (Math.floor(t * 2.5) % 2), lights: 0.5, chair: true, mess: 0.35 });
function room(t, cam, chars, over = '') {
  const Lr = H.heroRoom.layers(t, roomOpts(t));
  let w_ = Lr.mid + R.checkpoint({ ...PAD, t, state: 'red', part: 'back' }) + (Lr.front || '') + chars + R.checkpoint({ ...PAD, t, state: 'red', part: 'front' }) + over + Lr.light;
  return view(cam, Lr.bg, 0.85) + view(cam, w_, 1);
}
// Tip's glitch: spikes on the stuttered words
function tipGlitch(t, words) {
  let g = 0.45 + 0.15 * Math.sin(t * 7);
  for (const tw of words) g = Math.max(g, 1 - seg(t, tw + 0.25, tw + 0.55) * 0.55 - (t < tw ? 1 : 0));
  return clamp(g, 0, 1);
}
const TIP_SPIKES = [w(0, 'tttip'), w(0, 'sssave'), w(0, 'lllag')];

function shRoom(t) {
  const cam = shakeAll(camKeys(t, [[CUT.room, { zoom: 1.0, x: -20, y: 10 }], [CUT.disk, { zoom: 1.22, x: 60, y: 40 }]]), t, [[CUT.room + 0.05, 0.3, 10]]);
  let ch = actor('you', t, { x: 520, y: 990, s: 0.5, turn: 0.45, ...breathe(t), armL: 14, armR: 22, face: { name: 'nervous', eyes: { look: [0.8, -0.3] } } });
  let o = room(t, cam, ch);
  const [tx, ty] = toScr(cam, 1010, 470);
  o += R.tip({ x: tx, y: ty, s: 1.25, t, glitch: tipGlitch(t, TIP_SPIKES), look: [-0.6, 0.3], mood: 'worried' });
  // a counter hints the problem: respawns used keeps ticking
  const tR = w(0, 'respawns');
  o += R.counterHUD({ x: 60, y: 84, k: pop(t, tR - 0.05, 0.3), t, label: 'RESPAWNS:', value: 9000 + Math.floor(clamp((t - tR) * 260, 0, 999)), theme: 'red', icon: 'warn', bump: bump(t, tR, tR + 0.4) });
  // fade up from SC 06's dark blue + the red spike when the pad starts blinking
  o += R.flash(1 - seg(t, CUT.room, CUT.room + 0.28), '#0A0A30');
  o += R.flash(0.35 * bump(t, CUT.room + 0.1, CUT.room + 0.4), '#FF2E3E');
  return o;
}

// ---- 2. the giant floppy SAVE FILE gets heavy and drops like an anvil
function shDisk(t) {
  const tLand = tHeavy + 0.2;
  const landed = t >= tLand;
  const cam = shakeAll(camKeys(t, [[CUT.disk, at(880, 600, 1.45)], [tHeavy, at(880, 610, 1.5)], [CUT.face, at(880, 640, 1.58)]]), t, [[tLand, 0.5, 30]]);
  const swell = 1 + 0.25 * ease.out(seg(t, w(0, 'file') - 0.1, tHeavy)) + 0.05 * Math.sin(t * 9) * (1 - seg(t, tHeavy - 0.1, tHeavy));
  const fall = ease.in(seg(t, tHeavy, tLand));
  const fy = landed ? 905 - 112 + 10 * Math.exp(-(t - tLand) * 10) * Math.cos((t - tLand) * 30) : lerp(390 + 14 * Math.sin(t * 3), 905 - 112, fall);
  const frot = landed ? 4 : lerp(-6 + 3 * Math.sin(t * 2.6), 4, fall);
  const hop = landed ? 60 * bump(t, tLand, tLand + 0.35) : 0;
  let ch = actor('you', t, { x: 540, y: 990, s: 0.5, turn: 0.55, lift: hop, armL: landed ? 150 : 20, armR: landed ? 140 : 26, ...(landed ? {} : breathe(t)), face: landed ? 'shocked' : { name: 'nervous', eyes: { look: [0.9, -0.6] } } });
  let over = E.floppy(880, fy, 0.75 * swell, frot, { crack: landed ? 1 : 0, red: seg(t, w(0, 'file'), tHeavy) });
  if (landed) {
    // dust + floor cracks
    const u = seg(t, tLand, tLand + 0.6);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.05 + 0.9 * (i / 6));
      over += S.circle(880 - Math.cos(a) * (140 + 220 * ease.out(u)), 900 - Math.sin(a) * 60 * ease.out(u), 30 + 20 * hash(i), { fill: '#C9B8A8', opacity: f(0.7 * (1 - u)) });
    }
    over += S.path('M700 912 L660 930 L620 924 M1060 912 L1110 934 L1170 926 M820 916 L800 950', ln(6, '#2A1A10', 0.7));
  } else {
    // "weight" lines under the hovering floppy
    for (let i = 0; i < 3; i++) over += S.path(`M${820 + i * 60} ${f(fy + 130 + 10 * Math.sin(t * 12 + i))} v${f(30 + 20 * swell)}`, ln(6, '#FFFFFF', 0.5));
  }
  let o = room(t, cam, ch, over);
  const [tx, ty] = toScr(cam, 1180, 420);
  o += R.tip({ x: tx, y: ty, s: 1.15, t, glitch: tipGlitch(t, TIP_SPIKES), look: [-1, 0.2], mood: 'worried' });
  o += K.bang('THUD!', 700, 300, pop(t, tLand, 0.2) * (1 - seg(t, tLand + 0.6, tLand + 0.8)), 120, -8, '#FFD21F');
  o += E.smash(t, tLand, 0.12, 0.6);
  return o;
}

// ---- 3. close: "The world is starting to... l-l-lag." — the shot itself freezes on "lag"
function shFace(t0real) {
  const FR = [[tLag - 0.05, tLag + 0.42]];
  const t = E.lagT(t0real, FR);
  const frozen = t !== t0real;
  const ch_ = (tt) => {
    const cam = camKeys(tt, [[CUT.face, at(700, 610, 2.05)], [CUT.lagq, at(740, 600, 2.3)]]);
    const st = tt >= w(0, 'starting') ? E.choppy(tt, 9) : tt;
    let c = actor('you', tt, { x: 620, y: 990, s: 0.5, volume: false, turn: 0.5, ...breathe(st), armL: 10, armR: 14, headRot: 4 * Math.sin(st * 2), face: { name: 'scared', eyes: { look: [0.9, -0.4] }, fx: ['sweat'] } });
    let o = room(tt, cam, c);
    const [tx, ty] = toScr(cam, 920, 520);
    o += R.tip({ x: tx + 30 * Math.sin(st * 3), y: ty, s: 1.6, t: tt, glitch: tipGlitch(tt, TIP_SPIKES), look: [-1, 0.3], mood: 'worried' });
    return o;
  };
  let o = ch_(t);
  if (frozen) {
    o = R.glitchSlices(o, t0real, 0.7, 7, { n: 3, maxDx: 90 });
    o += S.rect(0, 0, 1920, 1080, 0, { fill: '#000', opacity: 0.25 }) + R.spinner(960, 540, 60, t0real, '#FFFFFF') + TFS('LAG', 960, 660, 50, '#FFFFFF', { 'letter-spacing': 8 });
  }
  return o + E.edgeDark(0.25);
}

// ---- 4. "Lag? Real life can't lag." — his own body freezes on "can't", then snaps
function shLagQ(t) {
  const tCant = w(1, 'cant');
  const fz = [[tCant + 0.05, A[1].b + 0.12]];
  const tp = E.lagT(t, fz);
  const frozen = tp !== t;
  const cam = camKeys(t, [[CUT.lagq, at(820, 640, 1.42)], [CUT.mom, at(800, 640, 1.52)]]);
  const wave = Math.sin(tp * 7);
  let pose = { x: 660, y: 990, s: 0.5, turn: 0.3, ...breathe(tp), armR: 60 + 30 * wave, armL: 18, headRot: 6 * Math.sin(tp * 3) };
  let hero = actor('you', t, pose, { arms: false, face: frozen ? 'scared' : undefined });
  if (frozen) hero = R.rgbSplit(hero, 0.8, { t, dx: 14 });
  let o = room(t, cam, hero);
  const [tx, ty] = toScr(cam, 1000, 460);
  o += R.tip({ x: tx, y: ty, s: 1.15, t, glitch: 0.4 + 0.3 * Math.sin(t * 5), look: [-1, 0.4], mood: 'worried', talk: false });
  if (frozen) {
    const [hx, hy] = toScr(cam, 660, 990 - 520);
    o += R.spinner(hx, hy - 60, 34, t, '#FFFFFF');
  }
  return o;
}

// ================================================================= 2. FRIDAY MORNING — KITCHEN
const KS = H.SPOTS.kitchen;
function kitchen(t, cam, behind, floor, o = {}) {
  const Lk = H.kitchen.layers(t, { time: 'morning', glitch: o.glitch ?? 0.12, panCake: o.panCake ?? true, clock: '7:30', ...(o.k || {}) });
  return view(cam, Lk.bg, 0.8) + view(cam, Lk.mid + behind + Lk.front + floor + (o.over || '') + Lk.light, 1);
}
const dadKitchen = (t, pose = {}) => actor('dad', t, { ...KS.dad, spatula: true, turn: 0.2, ...breathe(t, 1), armR: 46, ...pose });
const beaSeat = (t, pose = {}) => actor('bea', t, { x: KS.seats[0].x, y: KS.seats[0].y, s: KS.seats[0].s, turn: -0.3, t, spoon: true, ...breathe(t, 2), ...pose });
const heroSeat = (t, pose = {}) => actor('you', t, { x: KS.seats[1].x, y: KS.seats[1].y, s: KS.seats[1].s, turn: -0.4, ...breathe(t, 3), backpack: true, ...pose });

function shMom(t) {
  const tM = w(2, 'mmmmorning'), tS = w(2, 'swswsweetie');
  const tm = R.stutterVoiceT(R.stutterVoiceT(t, tM + 0.05, 0.13, 3), tS + 0.05, 0.15, 3);
  const stut = (t >= tM && t < tM + 0.45) || (t >= tS && t < tS + 0.5);
  const cam = camKeys(t, [[CUT.mom, at(1320, 640, 1.22)], [CUT.birds, at(1360, 630, 1.36)]]);
  // Mom leans in for the kiss on "sweetie" (repeats 3x with the stutter)
  const kiss = bump(tm, tS - 0.05, tS + 0.4);
  const jit = stut ? R.lagJitter(t, 3, 1, { fps: 15, amp: 18 }) : { dx: 0, dy: 0, rot: 0 };
  let mom = actor('mom', t, { x: 1180 + jit.dx, y: 990 + jit.dy, s: 0.5, turn: 0.55, thermos: true, lean: -14 * kiss + jit.rot * 2, bodyY: 4 * Math.sin(tm * 9), armR: 40 + 80 * bump(tm, tM - 0.1, tM + 0.5), headRot: -6 + 5 * Math.sin(tm * 11) }, { arms: false });
  if (stut && Math.floor(t * 15) % 2 === 0) mom = R.rgbSplit(mom, 1, { t, dx: 16 });
  let behind = dadKitchen(t, { face: 'happy', armR: 40 + 30 * Math.sin(t * 5) }) + beaSeat(t, { face: { name: 'neutral', eyes: { look: [-0.6, 0] } } }) + heroSeat(t, { face: { name: 'nervous', eyes: { look: [-1, 0] } } });
  let o = kitchen(t, cam, behind, mom, { glitch: stut ? 0.3 : 0.12 });
  o += R.counterHUD({ x: 60, y: 84, k: pop(t, CUT.mom + 0.1, 0.3) * (1 - seg(t, CUT.birds - 0.3, CUT.birds)), t, label: 'FRIDAY', value: '7:30 AM', theme: 'white', icon: 'cal', size: 54 });
  if (stut) o += E.glitchHit(t, Math.floor(t * 8) / 8 + 0.02, 0.1, 5, 0.6);
  return o;
}

// ================================================================= 3. THE STREET LAGS
const SR = H.SPOTS.street;
const BIRDS = Array.from({ length: 5 }, (_, i) => ({ x0: -300 + i * 380 + 120 * hash(i), y: 110 + 230 * hash(i * 3.3) + (i % 2) * 70, v: 150 + 60 * hash(i * 1.7), dly: 0.07 * i * hash(i * 7), s: 2.8 + 0.8 * hash(i * 2) }));
function shBirds(t) {
  const cam = camKeys(t, [[CUT.birds, { zoom: 1.0, x: 260, y: -330 }], [CUT.bus, { zoom: 1.06, x: 280, y: -380 }]]);
  const Ls = H.street.layers(t, cam, { time: 'morning', birds: false });
  let birds = '';
  for (const [i, b] of BIRDS.entries()) {
    const tf_ = tFroze + b.dly;
    const tb = Math.min(t, tf_);
    const bx = b.x0 + (tb - CUT.birds) * b.v, by = b.y + Math.sin(tb * 2 + i) * 18;
    const fr = t >= tf_;
    const jit = fr ? R.lagJitter(t, i, 0.5, { fps: 6, amp: 5 }) : { dx: 0, dy: 0 };
    const bsv = H.bird(0, 0, b.s, undefined, { flying: true, flip: true, flap: fr ? 0.2 + 0.15 * i : (tb * 4.5 + i * 0.37) % 1 });
    birds += S.g(bsv, `translate(${f(bx + jit.dx)} ${f(by + jit.dy)}) rotate(${f(fr && i === 2 ? 25 : 0)})`);
    if (fr) birds += E.loadRing(bx, by - 60 * b.s, 16 * b.s, t + i * 0.2, '#FFFFFF', pop(t, tf_ + 0.15, 0.25));
  }
  // the hero in the near foreground (screen space), looking up
  let hero = actor('you', t, { x: 1600, y: 1350, s: 0.78, volume: false, turn: -0.25, backpack: true, armL: 14, armR: 14, ...breathe(t), face: { name: t > tFroze + 0.3 ? 'confused' : 'neutral', eyes: { look: [-0.5, -1] } } });
  let o = Ls.bg + Ls.mid + view(cam, birds, 1) + Ls.fg + Ls.light + hero;
  o += K.bang('...?', 1300, 560, pop(t, tFroze + 0.6, 0.25), 80, -6, '#FFFFFF');
  return o;
}

// the bus: rubber-bands from the corner to the stop and teleports back
const BUS = { a: 4300, b: 3260, period: 1.6, hold: 0.22 };
const busRB = (t) => R.rubberBand(t, { period: BUS.period, a: BUS.a, b: BUS.b, hold: BUS.hold, t0: CUT.bus + 0.2, fps: 12 });
function busLayer(t) {
  const rb = busRB(t);
  const ph = E.mod(t - CUT.bus - 0.2, BUS.period);
  let o = '';
  if (ph < 0.45 && t > CUT.bus + 0.5) o += R.tint(H.schoolBus(BUS.b, SR.busLane.y, 1), 'ghost', 0.55 * (1 - ph / 0.45));
  o += H.schoolBus(rb.x, SR.busLane.y, 1, undefined, { sign: 0 });
  if (ph < 0.3 && t > CUT.bus + 0.5) o += R.pixelDissolve({ x: BUS.a - 390, y: SR.busLane.y - 330, w: 780, h: 330, k: ph / 0.3, mode: 'in', colors: ['#FFC21A', '#FFFFFF', '#222222', '#FF9A1A'], seed: 4 });
  return o;
}
function shBus(t) {
  const cam = camKeys(t, [[CUT.bus, { zoom: 1.0, x: 2620, y: -20 }], [CUT.dog, { zoom: 1.1, x: 2700, y: 0 }]]);
  const Ls = H.street.layers(t, cam, { time: 'morning' });
  const rb = busRB(t);
  const ph = E.mod(t - CUT.bus - 0.2, BUS.period);
  const look = clamp((rb.x - 3420) / 600, -1, 1);
  const snapT = ph < 0.35 && t > CUT.bus + 0.5;
  let ch = actor('kid', t, { i: 6, x: 3330, y: 935, s: 0.33, turn: 0.4, backpack: true, ...breathe(t, 1), face: { name: snapT ? 'shocked' : 'neutral', eyes: { look: [look, 0] } } });
  ch += actor('you', t, { x: 3560, y: 935, s: 0.34, turn: 0.2 * look, backpack: true, ...breathe(t), lift: snapT ? 22 * bump(ph, 0, 0.35) : 0, armL: snapT ? 60 : 10, armR: snapT ? 60 : 10, face: { name: snapT ? 'shocked' : 'confused', eyes: { look: [look, 0] } } });
  let o = Ls.bg + Ls.mid + view(cam, ch + busLayer(t), 1) + Ls.fg + Ls.light;
  if (snapT) o += K.bang('BLINK!', 1550, 300, pop(t, t - ph + 0.0, 0.15) * (1 - seg(ph, 0.25, 0.35)), 70, 6, '#7CF7FF');
  return o;
}
function shDog(t) {
  const cam = camKeys(t, [[CUT.dog, at(3080, 760, 1.55)], [CUT.pancake, at(3060, 750, 1.65)]]);
  const jit = R.lagJitter(t, 9, 1, { fps: 7, amp: 10 });
  const Ls = H.street.layers(t, cam, { time: 'morning', dog: { x: 2960 + jit.dx, through: true, walk: E.choppy(t, 10) * 9 } });
  let ch = actor('you', t, { x: 3330, y: 935, s: 0.34, turn: -0.4, backpack: true, ...breathe(t), face: { name: 'confused', eyes: { look: [-1, 0.3] } } });
  let o = Ls.bg + Ls.mid + view(cam, ch, 1) + Ls.fg + Ls.light;
  const [dx, dy] = toScr(cam, 2960, 760);
  o += E.loadRing(dx, dy - 40, 26, t, '#FFFFFF', pop(t, CUT.dog + 0.2, 0.25));
  // the bus blasts through the foreground and snaps back ("same corner")
  const u = seg(t, w(3, 'corner') - 0.1, w(3, 'corner') + 0.35);
  if (u > 0 && u < 1) o += S.g(H.schoolBus(lerp(2600, -500, u), 1160, 1.5), null, {}) + R.tint(H.schoolBus(lerp(2900, -200, u), 1160, 1.5), 'ghost', 0.3);
  const u2 = seg(t, w(3, 'corner') + 0.5, w(3, 'corner') + 0.62);
  if (u2 > 0 && u2 < 1) o += R.flash(0.3 * (1 - u2), '#7CF7FF');
  return o;
}

// ---- Dad's pancake goes up... and stays up there
const PAN = KS.pan, HANG = { x: KS.panHang.x, y: 130 };
function pancakeAt(t) {
  if (t < tFlip) return null;
  const u = seg(t, tFlip, tHang);
  const y = lerp(PAN.y, HANG.y, ease.out(u));
  const jit = t > tHang ? R.lagJitter(t, 4, 0.6, { fps: 6, amp: 6 }) : { dx: 0, dy: 0 };
  return { x: HANG.x + jit.dx, y: y + jit.dy, flip: t < tHang ? u * 0.75 : 0.75 + 0.02 * Math.sin(t * 3) };
}
function shPancake(t) {
  const cam = camKeys(t, [[CUT.pancake, at(900, 600, 1.15)], [tFlip, at(860, 560, 1.2)], [tHang + 0.2, at(780, 330, 1.4)], [CUT.dad, at(760, 320, 1.46)]]);
  const flipArm = bump(t, tFlip - 0.15, tFlip + 0.25);
  const pc = pancakeAt(t);
  const lookUp = t > tFlip + 0.2;
  let behind = dadKitchen(t, { armR: 46 + 90 * flipArm + (lookUp ? 50 : 0), face: { name: lookUp ? 'confused' : 'happy', eyes: { look: [0, lookUp ? -1 : 0.2] } }, headRot: lookUp ? -6 : 0 });
  behind += beaSeat(t, { face: { name: lookUp ? 'amazed' : 'neutral', eyes: { look: [-0.7, lookUp ? -0.9 : 0] } } }) + heroSeat(t, { face: { name: 'nervous', eyes: { look: [-0.8, lookUp ? -0.8 : 0] } } });
  let over = '';
  if (pc) over += X.pancake(pc.x, pc.y, 0.62, 0, pc.flip);
  if (t > tHang + 0.1) over += E.loadRing(pc.x, pc.y - 70, 22, t, '#FFFFFF', pop(t, tHang + 0.1, 0.25));
  let o = kitchen(t, cam, behind, '', { panCake: t < tFlip, over });
  o += K.bang('FLIP!', 520, 560, pop(t, tFlip, 0.18) * (1 - seg(t, tFlip + 0.4, tFlip + 0.6)), 80, -8, '#FFD21F');
  return o;
}
function shDad(t) {
  const tThink = w(4, 'thinking');
  const cam = camKeys(t, [[CUT.dad, at(700, 330, 1.75)], [tThink, at(690, 330, 1.85)], [CUT.low, at(680, 330, 1.92)]]);
  const pc = pancakeAt(t);
  const scratch = Math.sin(t * 14) * 8 * (t < tThink ? 1 : 0);
  let behind = actor('dad', t, { ...KS.dad, volume: false, spatula: true, turn: 0.1, armR: 70, armL: t < tThink ? 140 + scratch : 30, headRot: -8, ...breathe(t, 1), face: { name: t < tThink ? 'confused' : 'smug', eyes: { look: [0, -1] } } }, { arms: false });
  // the pancake spins like a loading icon
  const spin = t > tThink - 0.1 ? (t - tThink) * 260 : 0;
  let over = S.g(X.pancake(0, 0, 0.62, 0, pc ? pc.flip : 0.75), `translate(${f(pc.x)} ${f(pc.y)}) rotate(${f(spin)})`);
  const rk = pop(t, tThink - 0.1, 0.3);
  if (rk > 0) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t * 6;
      over += S.circle(pc.x + Math.cos(a) * 95 * rk, pc.y + Math.sin(a) * 60 * rk, 9 * rk, { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 3, opacity: f((0.35 + 0.65 * ((i + 1) / 8))) });
    }
  }
  let o = kitchen(t, cam, behind, '', { panCake: false, over, glitch: 0.2 });
  o += K.bang('...', 1240, 260, pop(t, w(4, 'That') - 0.1, 0.25), 90, 0, '#FFFFFF');
  return o;
}

// ---- the street switches to low graphics
const lowK = (t) => ease.inOut(seg(t, w(5, 'switched') - 0.1, Math.max(w(5, 'graphics') + 0.7, A[5].b + 0.9)));
function shLow(t) {
  const lk = lowK(t);
  const cam = camKeys(t, [[CUT.low, { zoom: 0.9, x: 40, y: -30 }], [CUT.y2006, { zoom: 0.98, x: 30, y: -10 }]]);
  const Ls = H.street.layers(t, cam, { time: 'morning', lowGfx: lk, dog: { x: 1280, walk: t * 7 } });
  let hero = actor('you', t, { x: 760, y: SR.stand, s: 0.34, backpack: true, turn: 0.1, ...breathe(t), face: { name: lk > 0.3 ? 'shocked' : 'neutral', eyes: { look: [lk > 0.3 ? 0.6 : 0, -0.2] } }, lift: 30 * bump(t, w(5, 'low'), w(5, 'low') + 0.35) });
  let o = Ls.bg + Ls.mid + view(cam, hero, 1) + Ls.fg + Ls.light;
  // a couple of houses go through a "texture not loaded" frame on their way down
  const [hx, hy] = toScr(cam, 380, 380);
  o += R.loadingTexture(hx, hy, 300, 220, t, { k: bump(lk, 0.15, 0.55) });
  const [ix, iy] = toScr(cam, 2180, 360);
  o += R.loadingTexture(ix, iy, 260, 200, t, { k: bump(lk, 0.4, 0.8), label: false });
  const tl = w(5, 'low');
  o += R.lowGfxBadge(60, 84, pop(t, tl - 0.05, 0.3), t, { bump: seg(t, tl, tl + 0.45) });
  return o;
}
function shY2006(t) {
  const tTwo = w(6, 'two'), tSix = w(6, 'six');
  const cam = shakeAll(camKeys(t, [[CUT.y2006, at(800, 680, 1.7)], [tTwo - 0.06, at(790, 670, 1.8)], [tTwo, at(770, 640, 2.4)], [CUT.walk, at(770, 640, 2.5)]]), t, [[tTwo, 0.3, 16], [tSix, 0.35, 20]]);
  const Ls = H.street.layers(t, cam, { time: 'morning', lowGfx: 1 });
  const grab = t > w(6, 'everything') - 0.1;
  let hero = actor('you', t, { x: 760, y: SR.stand, s: 0.34, volume: false, backpack: true, turn: 0.15 * Math.sin(t * 3), armL: grab ? 150 : 40, armR: grab ? 150 : 40, ...boing(t, tSix, 0.2), face: t > tTwo ? 'scream' : 'scared' }, { arms: false, energy: 1.6 });
  let o = Ls.bg + Ls.mid + view(cam, hero, 1) + Ls.fg + Ls.light;
  o += E.zoomLines(960, 450, bump(t, tTwo, tTwo + 0.5) + bump(t, tSix, tSix + 0.5), t, '#E6E6E6');
  // "2006?!" in chunky retro lettering
  const k = pop(t, tTwo + 0.05, 0.22);
  if (k > 0.01) {
    let g = T('2006?!', 6, 8, 170, '#3A3A3A') + T('2006?!', 0, 0, 170, '#BFC4C8', { stroke: '#1A1A1A', 'stroke-width': 10, 'paint-order': 'stroke' });
    o += S.g(g, `translate(1450 300) rotate(-8) scale(${f(k * (1 + 0.12 * bump(t, tSix, tSix + 0.3)))})`);
  }
  o += R.lowGfxBadge(60, 84, 1, t, {});
  o += E.smash(t, tTwo, 0.1, 0.5);
  return o;
}

// ---- he trips over a missing-collision box -> crumble -> the glitched RESPAWNING overlay
const WALK = { x0: 260, x1: 900, y: SR.stand, s: 0.34 };
function shWalk(t) {
  const ua = seg(t, CUT.walk, tTrip);
  const hx = lerp(WALK.x0, WALK.x1, ua);
  const cam = camKeys(t, [[CUT.walk, { zoom: 1.45, x: WALK.x0 - 760 + 30, y: 120 }], [tTrip, { zoom: 1.5, x: WALK.x1 - 760 + 30, y: 120 }], [tTrip + 0.3, { zoom: 1.62, x: WALK.x1 - 760 + 60, y: 130 }]], (u) => u);
  const camS = shakeAll(cam, t, [[tTrip + 0.1, 0.3, 18]]);
  const tFrz = t >= tOv ? tOv : t;                           // the world pauses under the overlay
  const Ls = H.street.layers(tFrz, camS, { time: 'morning', lowGfx: 1 });
  let ch = '';
  // the box he trips on
  const box = S.rect(WALK.x1 + 30, WALK.y - 46, 90, 56, 0, { fill: '#8E9296', stroke: '#5A5E62', 'stroke-width': 3 }) + S.path(`M${WALK.x1 + 30} ${WALK.y - 46} l20 -14 h90 v56 l-20 14`, { fill: '#6E7276' });
  ch += box;
  const age = tFrz - (tTrip + 0.1);
  if (age < 0) {
    const trip = seg(t, tTrip - 0.02, tTrip + 0.1);
    ch += actor('you', t, { x: hx, y: WALK.y, s: WALK.s, view: 'side', flip: true, backpack: true, ...(trip > 0 ? { legL: -30, legR: 40, armL: 120, armR: 140 } : AC.walk((t - CUT.walk) * 9)), rot: 40 * trip, face: trip > 0 ? 'scream' : 'sad' });
  } else {
    ch += R.crumble({ x: WALK.x1 + 40, y: WALK.y, s: WALK.s, age: Math.min(age, 0.36), dir: [1, -0.35], seed: 7 });
  }
  let o = Ls.bg + Ls.mid + view(camS, ch, 1) + Ls.fg + Ls.light;
  if (t >= tOv) {
    let ov = R.respawnOverlay(t, { t0: tOv, dur: tPop1 - tOv, marks: MARKS, reason: t > MARKS[2] ? 'SPAWN POINT: ???' : 'ERROR: CHECKPOINT NOT FOUND', style: 'full', label: t > MARKS[1] + 0.2 ? 'RESP@WN1NG' : 'RESPAWNING' });
    o += ov;
    o = R.glitchSlices(o, t, 0.35 + 0.4 * bump(t, MARKS[2], MARKS[2] + 0.3), 11, { n: 3, maxDx: 80 });
  }
  return o;
}

// ================================================================= 4. WRONG RESPAWNS
// ---- the top of the very tall flagpole
const SY = SS.SPOTS.schoolyard;
const HUG = SY.hug;
function hugPose(t, extra = {}) {
  const sw = Math.sin(t * 2.2) * 3;
  return { x: HUG.x, y: HUG.y, s: HUG.s, armL: 150, armR: 150, legL: 24, legR: 24, kneeL: 64, kneeR: 64, rot: sw, ...extra };
}
function yard(t, cam, behindPole, front = '', o = {}) {
  const Ly = SS.schoolyard.layers(t, cam, { time: 'day', ...o });
  return Ly.bg + Ly.mid + view(cam, behindPole, 1) + Ly.pole + Ly.front + view(cam, front, 1) + Ly.fg + Ly.light;
}
function shPole(t) {
  const age = t - tPop1;
  const close = SY.cams.poleClose, wide = SY.cams.poleWide;
  const near = at(170, -1700, 1.45);
  let cam;
  if (t < tNot - 0.05) cam = camKeys(t, [[CUT.pole, { ...near, zoom: 1.6 }], [tNot - 0.05, near]]);
  else {
    // zoom out exponentially while the hero's head stays in frame (screen anchor eased from near to wide)
    const e = ease.inOut(seg(t, tNot - 0.05, tNot + 0.5));
    const P = { x: HUG.x, y: HUG.y - 420 * HUG.s };
    const wideZ = lerp(wide.zoom, 0.37, seg(t, tNot + 0.5, CUT.poleCr));
    const w2 = { ...wide, zoom: wideZ };
    const [s0x, s0y] = toScr(near, P.x, P.y), [s1x, s1y] = toScr(w2, P.x, P.y);
    const z = Math.exp(lerp(Math.log(near.zoom), Math.log(wideZ), e));
    const sx = lerp(s0x, s1x, e), sy = lerp(s0y, s1y, e);
    cam = { zoom: z, x: P.x - 960 - (sx - 960) / z, y: P.y - 540 - (sy - 540) / z };
  }
  cam = shakeAll(cam, t, [[tNot, 0.3, 10]]);
  const pp = R.popPose(age, HUG.s);
  let hero = '';
  if (!pp.hidden) hero += actor('you', t, hugPose(t, { sx: pp.sx, sy: pp.sy, face: t > tNot - 0.1 ? 'scream' : 'scared' }), { arms: false });
  let back = R.respawnPop({ x: HUG.x, y: HUG.y, s: HUG.s, age, part: 'back', col: '#FF8A9A' }) + hero;
  let front = R.respawnPop({ x: HUG.x, y: HUG.y, s: HUG.s, age, part: 'front', col: '#FF8A9A' });
  if (age >= 0) front += R.forcefield({ x: HUG.x, y: HUG.y, s: HUG.s, t, k: 1 - seg(age, 1.0, 1.6), col: '#FF3B4E' });
  // wind streaks
  let wind = '';
  for (let i = 0; i < 6; i++) { const x = E.mod(hash(i * 3) * 2400 - t * 1800, 2400) - 240; wind += S.path(`M${f(x)} ${f(120 + i * 150)} h${180 + 120 * hash(i)}`, ln(5, '#FFFFFF', 0.5)); }
  let o = yard(t, cam, back, front) + wind;
  o += K.bang('NOT!', 1320, 330, pop(t, tNot, 0.2) * (1 - seg(t, tNot + 0.5, tNot + 0.7)) * (t < tNot + 0.3 ? 1 : 1), 110, 8, '#FF5A5A');
  return o;
}
function shPoleCrumble(t) {
  const cam = SY.cams.poleClose;
  const age = t - tCr2;
  let back = '';
  if (age < 0) back += actor('you', t, hugPose(t, { face: 'scream' }), { arms: false });
  let front = R.crumble({ x: HUG.x, y: HUG.y, s: HUG.s, age, dir: [0, 0.4], floorY: HUG.y + 2400, seed: 9, gravity: 0.6 });
  let o = yard(t, shakeAll(cam, t, [[tCr2, 0.25, 12]]), back, front);
  o += R.respawnOverlay(t, { t0: tCr2 - 0.05, dur: CUT.bowl - tCr2 + 0.05, style: 'corner', x: 1860, y: 90, label: 'RESPAWNING' });
  return o;
}

// ---- tiny in Gary's fishbowl
const BOWL = { x: 960, y: 958, s: 1.55 };
const TINY = { x: 760, y: BOWL.y - 44 * BOWL.s + 6, s: 0.12 };
function bowlBg(t) {
  let o = S.rect(-40, -40, 2000, 1160, 0, { fill: '#BDE8D6' });
  let d = '';
  for (let yy = 40; yy < 900; yy += 120) for (let xx = (yy / 120) % 2 ? 60 : 0; xx < 1920; xx += 120) d += `M${xx + 40} ${yy}h16M${xx + 48} ${yy - 8}v16`;
  o += S.path(d, ln(5, '#D8F4E8'));
  o += S.rect(-40, 930, 2000, 200, 0, { fill: '#C98E5A' }) + S.rect(-40, 930, 2000, 18, 0, { fill: '#E0A870' }) + S.path('M-40 930 H1960', ln(6));
  o += S.rect(1640, 120, 520, 760, 40, ol('#20232E', 10)) + S.rect(1670, 150, 470, 700, 20, { fill: '#2B3550' });
  o += H.wallClock(240, 200, 120, '7:41', undefined);
  return o;
}
function shBowl(t) {
  const age = t - CUT.bowl;
  const z = lerp(1.22, 1.32, ease.inOut(seg(t, CUT.bowl, CUT.bin)));
  const blinkK = bump(t, A[11].b + 0.15, A[11].b + 0.95);
  const crA = t - tCr3;
  const gLook = crA > 0 ? [-0.6, -0.9] : [-0.9, 0.5];
  const Bl = X.fishbowl.layers({ x: BOWL.x, y: BOWL.y, s: BOWL.s, t, garyFront: true, gary: { x: 130, y: -290, s: 1.12, yaw: -38, look: gLook, blink: blinkK, mouth: t > w(11, 'gary') ? 'o' : 'line', bubble: bump(t, A[11].b + 0.2, A[11].b + 0.9) }, line: 7 });
  let inside = '';
  const pp = R.popPose(age, TINY.s);
  inside += R.respawnPop({ ...TINY, age, part: 'back' });
  if (!pp.hidden && crA < 0) inside += actor('you', t, { ...TINY, volume: false, shadow: false, sx: pp.sx, sy: pp.sy, armR: bump(t, w(11, 'hi') - 0.1, w(11, 'hi') + 0.6) * 150 + 10, armL: 10, face: t > A[11].a ? 'nervous' : 'shocked' }, { arms: false });
  inside += R.respawnPop({ ...TINY, age, part: 'front' });
  // his words come out as bubbles
  for (let i = 0; i < 6; i++) {
    const tb = A[11].a + i * 0.12;
    const ub = t - tb;
    if (ub > 0 && ub < 2.2) inside += S.circle(TINY.x + 12 + Math.sin(ub * 6 + i) * 8, TINY.y - 80 - ub * 230, 7 + 4 * hash(i), { fill: '#FFFFFF', 'fill-opacity': 0.4, stroke: '#FFFFFF', 'stroke-width': 3 });
  }
  // the crumble floats UP like bubbles
  if (crA >= 0) inside += R.crumble({ ...TINY, age: crA, dir: [0, -0.6], gravity: -0.25, floorY: TINY.y - 3000, seed: 3, life: 0.8 });
  let o = bowlBg(t) + Bl.back + inside + Bl.front;
  o = scaleG(o, z, 900, 700);
  if (crA >= 0) o += R.respawnOverlay(t, { t0: tCr3, dur: CUT.bin - tCr3 + 0.02, style: 'banner', y: 250, label: 'RESPAWNING' });
  o += R.flash(0.8 * (1 - seg(t, CUT.bowl, CUT.bowl + 0.12)));
  return o;
}

// ---- the gym ball bin: balls rain on him, Coach Dee
const GY = SS.SPOTS.gym;
const BIN = { ...GY.bin };
const inBin = { x: BIN.x, y: BIN.y - 150 * BIN.s, s: BIN.s };
const BALLS = Array.from({ length: 9 }, (_, i) => ({ dt: 0.08 + i * 0.13, x: BIN.x + (hash(i * 3.3) - 0.5) * 300, col: ['#E8303F', '#3A7BFF', '#FFC21A', '#3BD16F', '#B06BFF', '#FF8A1A'][i % 6], head: i === 3 }));
function shBin(t) {
  const age = t - CUT.bin;
  const crA = t - tCr4;
  const cam = shakeAll(camKeys(t, [[CUT.bin, { ...GY.cams.bin, zoom: 1.75 }], [CUT.cake, { ...GY.cams.bin, zoom: 1.6 }]]), t, [[CUT.bin + 0.47, 0.25, 10]]);
  const Lg = SS.gym.layers(t, {});
  const Bb = X.ballBin.layers({ x: BIN.x, y: BIN.y, s: BIN.s, fill: 1, t, seed: 3 });
  const pp = R.popPose(age, inBin.s);
  const lvl = BIN.y - 460 * BIN.s;
  // balls falling from above; one bonks his head
  let balls = '';
  let bonk = -1;
  for (const [i, b] of BALLS.entries()) {
    const ub = age - b.dt;
    if (ub < 0) continue;
    const yTop = 120, land = b.head ? inBin.y - 980 * inBin.s : lvl - 10 - (i % 3) * 18;
    const tFall = Math.sqrt((2 * (land - yTop)) / 3200);
    let y, x = b.x;
    if (ub < tFall) y = yTop + 0.5 * 3200 * ub * ub;
    else { const ua = ub - tFall; y = land - Math.max(0, 600 * ua - 1600 * ua * ua) * (b.head ? 1.3 : 0.5); if (b.head) { x += ua * 380; if (ua > 0.3) y = Math.min(lvl, y + (ua - 0.3) * 900); } if (b.head && ua < 0.1) bonk = ub; }
    balls += X.dodgeball({ x, y, s: BIN.s * 0.9, col: b.col, rot: ub * 300 });
  }
  let hero = '';
  if (!pp.hidden && crA < 0) {
    const bonked = age > BALLS[3].dt + 0.3;
    hero = actor('you', t, { ...inBin, volume: false, sx: pp.sx, sy: pp.sy * (1 - 0.06 * bump(age, BALLS[3].dt + 0.25, BALLS[3].dt + 0.5)), armL: 150, armR: 150, headRot: 6 * Math.sin(t * 2), face: bonked ? { name: 'dizzy' } : 'shocked' }, { arms: false });
  }
  let world = Lg.mid + Bb.back + R.respawnPop({ ...inBin, age, part: 'back' }) + hero + R.respawnPop({ ...inBin, age, part: 'front' }) + Bb.front + balls;
  if (crA >= 0) world += R.crumble({ ...inBin, age: crA, dir: [0.2, -0.8], floorY: lvl, seed: 12 });
  // Coach Dee slowly takes the whistle out of her mouth
  const pull = seg(t, CUT.bin + 0.12, Math.max(CUT.bin + 0.3, A[13].a - 0.03));
  const coach = actor('coach', t, { ...GY.coach, s: 0.45, turn: 0.45, whistle: pull < 0.6 ? 'mouth' : 'chest', armR: lerp(150, 20, ease.inOut(pull)), armL: 10, ...breathe(t, 2), face: { name: pull < 0.6 ? 'shocked' : 'deadpan', eyes: { look: [1, -0.1] } } }, { arms: false });
  let o = view(cam, Lg.bg, 0.6) + view(cam, world + Lg.front + coach + (Lg.fg || '') + Lg.light, 1) + (Lg.screen || '');
  if (age > BALLS[3].dt + 0.25 && age < BALLS[3].dt + 0.9) { const [bx, by] = toScr(cam, inBin.x + 120, inBin.y - 1000 * inBin.s); o += K.bang('BONK!', bx + 140, by - 40, pop(t, CUT.bin + BALLS[3].dt + 0.25, 0.18), 70, 10, '#FFD21F'); }
  if (crA >= 0) { const [mx, my] = toScr(cam, inBin.x, inBin.y - 700 * inBin.s); o += R.respawnOverlay(t, { t0: tCr4, dur: CUT.cake - tCr4 + 0.02, style: 'mini', x: mx, y: my - 120 }); }
  o += R.flash(0.8 * (1 - seg(t, CUT.bin, CUT.bin + 0.12)));
  return o;
}

// ---- Mr. Fig's birthday cake (teachers' lounge, everyone frozen)
const LG = SS.SPOTS.lounge;
const CAKE = { ...LG.cake };
const smashK = (t) => ease.out(seg(t, CUT.cake + 0.04, CUT.cake + 0.34));
const inCake = (t) => ({ x: CAKE.x, y: CAKE.y + 210 - 120 * ease.outBack(seg(t, CUT.cake + 0.04, CUT.cake + 0.4)), s: 0.4 });
const FIG = { x: 300, y: 980, s: 0.5 };
function candleOnHead(x, y, s, t) {
  let o = S.rect(-9, -84, 18, 86, 5, ol('#6FD3FF', 4));
  const fl = 1 + 0.15 * Math.sin(t * 20);
  o += S.path(`M0 ${f(-124 * fl + 20)} Q14 -100 0 -86 Q-14 -100 0 ${f(-124 * fl + 20)} Z`, ol('#FFB020', 3.5));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)}) rotate(8)`);
}
function teachersFrozen(t, opts = {}) {
  let behind = '', floor = '';
  const hat = (x, y, s, rot, c) => E.partyHat(x, y, s, rot, c);
  // seated teachers (behind the table), frozen mid-motion
  behind += draw.adult(2, { x: LG.seats[0].x, y: LG.seats[0].y, s: LG.seats[0].s, turn: 0.35, armL: 120, armR: 60, face: { name: 'shocked', eyes: { look: [1, -0.2] } } }) + hat(LG.seats[0].x + 10, LG.seats[0].y - 1040 * LG.seats[0].s, 0.5, -10, '#3BD16F');
  behind += draw.adult(5, { x: LG.seats[1].x, y: LG.seats[1].y, s: LG.seats[1].s, turn: -0.35, armL: 70, armR: 150, face: { name: 'scream', eyes: { look: [-1, -0.2] } } }) + hat(LG.seats[1].x - 6, LG.seats[1].y - 1060 * LG.seats[1].s, 0.5, 8, '#FF6FB5');
  floor += draw.adult(8, { x: LG.ends[1].x, y: LG.ends[1].y, s: LG.ends[1].s, turn: -0.5, armL: 40, armR: 95, face: { name: 'amazed', eyes: { look: [-1, -0.1] } } }) + hat(LG.ends[1].x - 10, LG.ends[1].y - 1110 * LG.ends[1].s, 0.55, 6, '#FFC21A');
  // Mr. Fig at the left end (only his mouth moves)
  const figPose = { ...FIG, turn: 0.45, armL: 8, armR: 14, face: { name: 'neutral', eyes: { look: [1, 0], upper: 0.5 } }, ...(opts.fig || {}) };
  floor += actor('teacher', t, figPose, { arms: false, energy: 0 });
  floor += hat(FIG.x + 14, FIG.y - 1185 * FIG.s, 0.58, 10, '#B06BFF');
  if (opts.splat) floor += R.foamBlobs(FIG.x + 70, FIG.y - 880 * FIG.s, 0.42, 1, 3);
  return { behind, floor };
}
function lounge(t, cam, opts = {}) {
  const Ll = SS.lounge.layers(t, { frozen: opts.frozen ?? 0.6 });
  const sk = smashK(t);
  const Cb = X.birthdayCake.layers({ ...CAKE, smash: sk, t });
  const ic = inCake(t);
  const { behind, floor } = teachersFrozen(t, opts);
  let hero = '';
  if (t >= CUT.cake + 0.04) {
    const wave = opts.wave ? bump(t, opts.wave[0], opts.wave[1]) : 0;
    hero = actor('you', t, { ...ic, volume: false, armL: lerp(160, 14, seg(t, CUT.cake + 0.8, CUT.cake + 1.3)), armR: lerp(160, 14, seg(t, CUT.cake + 0.8, CUT.cake + 1.3)) + 120 * wave, foam: 0.6, face: t < CUT.cake + 0.9 ? 'scream' : { name: 'nervous', mouth: 'teeth' }, ...boing(t, CUT.cake + 0.3, 0.2) }, { arms: false });
    hero += candleOnHead(ic.x + 40, ic.y - 950 * ic.s, ic.s * 1.1, t);
  }
  const world = Ll.mid + behind + Cb.back + hero + Cb.front + Ll.front + floor + (Ll.fg || '') + Ll.light;
  return view(cam, Ll.bg, 0.6) + view(cam, world, 1);
}
function shCake(t) {
  const cam = shakeAll(camKeys(t, [[CUT.cake, at(960, 600, 1.45)], [CUT.fig, at(960, 590, 1.55)]]), t, [[CUT.cake + 0.06, 0.35, 22]]);
  let o = lounge(t, cam, {});
  o += K.bang('SPLAT!', 1450, 300, pop(t, CUT.cake + 0.08, 0.2) * (1 - seg(t, CUT.cake + 0.6, CUT.cake + 0.8)), 110, 8, '#FF8FC0');
  o += R.flash(0.85 * (1 - seg(t, CUT.cake, CUT.cake + 0.12)));
  return o;
}
function shFig(t) {
  const cam = camKeys(t, [[CUT.fig, at(FIG.x + 60, FIG.y - 600 * FIG.s, 2.3)], [CUT.tableau, at(FIG.x + 50, FIG.y - 610 * FIG.s, 2.45)]]);
  return lounge(t, cam, { splat: true, fig: { volume: false } });
}
function shTableau(t) {
  const ic = inCake(t);
  const cam = camKeys(t, [[CUT.tableau, { ...LG.cams.table, zoom: 1.15 }], [CUT.case, at(ic.x, ic.y - 420 * ic.s, 1.7)]]);
  const wave = [w(16, 'respawned') - 0.1, w(16, 'cake') + 0.4];
  let o = lounge(t, cam, { splat: true, wave });
  const tb = w(16, 'birthday');
  if (t > tb) o += K.sparkles([[1260, 380, 34 * pop(t, tb, 0.3)], [700, 420, 26 * pop(t, tb, 0.3)]], t);
  return o;
}
// ---- "To this day, nobody knows how." — the case photo on a cork board
function cork() {
  let o = S.rect(-40, -40, 2000, 1160, 0, { fill: '#B98A55' });
  let d = '';
  for (let i = 0; i < 260; i++) d += `M${f(hash(i * 1.3) * 1920)} ${f(hash(i * 2.9) * 1080)}h4`;
  o += S.path(d, ln(5, '#9C6F40', 0.8));
  o += S.rect(-40, -40, 2000, 50, 0, { fill: '#7A5230' }) + S.rect(-40, 1060, 2000, 60, 0, { fill: '#7A5230' });
  return o;
}
function note(x, y, rot, lines, col = '#FFF4A3', size = 40) {
  let g = S.rect(-150, -110, 300, 220, 4, ol(col, 5));
  lines.forEach((l, i) => { g += S.el('text', { x: 0, y: -40 + i * 52, 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, 'font-size': size, fill: '#2A2A9A', 'text-anchor': 'middle' }, l); });
  return S.g(g, E.tf(x, y, 1, rot)) + E.pin(x, y - 92);
}
function shCase(t) {
  const u = seg(t, CUT.case, END);
  const z = lerp(1.0, 1.12, ease.inOut(u));
  const drop = ease.outBack(seg(t, CUT.case, CUT.case + 0.4));
  let o = cork();
  o += note(330, 250, -6, ['WHO TOOK', 'MY YOGURT?']);
  o += note(1600, 760, 5, ['CAKE?', 'HOW??'], '#FFC7E0');
  o += S.path('M330 250 Q700 420 960 470 M1600 760 Q1300 640 960 470', ln(6, '#D81E2C'));
  // the tableau, frozen, as a photo
  const ph = lounge(CUT.case - 0.5, { ...LG.cams.table, zoom: 1.25 }, { splat: true });
  o += E.polaroid(960, lerp(-500, 470, drop), 1.25, lerp(-14, -4, drop), ph, { caption: "Mr. Fig's B-day" });
  o += E.pin(960, lerp(-500, 470, drop) - 250);
  o += E.stamp(1180, 640, seg(t, tNobody - 0.05, tNobody + 0.25), 'UNSOLVED', -14);
  const qk = pop(t, tHow, 0.25);
  if (qk > 0) o += T('???', 520, 820, 150 * qk, '#D81E2C', { transform: 'rotate(-10 520 820)' });
  o = scaleG(o, z);
  // hand-over to SC 08: the red alarm starts to bleed in
  const red = seg(t, END - 0.35, END);
  if (red > 0) o += E.glitchHit(t, END - 0.05, 0.3, 13, red) + R.flash(0.55 * red, '#FF1A2E');
  return o;
}

// ================================================================= dispatch
const RT = E.router([
  [CUT.room, shRoom], [CUT.disk, shDisk], [CUT.face, shFace], [CUT.lagq, shLagQ], [CUT.mom, shMom],
  [CUT.birds, shBirds], [CUT.bus, shBus], [CUT.dog, shDog], [CUT.pancake, shPancake], [CUT.dad, shDad],
  [CUT.low, shLow], [CUT.y2006, shY2006], [CUT.walk, shWalk], [CUT.pole, shPole], [CUT.poleCr, shPoleCrumble],
  [CUT.bowl, shBowl], [CUT.bin, shBin], [CUT.cake, shCake], [CUT.fig, shFig], [CUT.tableau, shTableau], [CUT.case, shCase],
], {
  whips: [[CUT.birds, 1], [CUT.bus, 1], [CUT.pancake, -1], [CUT.low, 1], [CUT.tableau, -1]],
  glitches: [[CUT.mom, 2], [CUT.dog, 3], [CUT.dad, 4], [CUT.walk, 6], [CUT.case, 8], [CUT.lagq, 9]],
});

function scene(t) { return RT.scene(t); }
function look(t) {
  if (t < CUT.mom) return { grade: null, vignette: 0.75 };
  if (t >= CUT.low && t < CUT.pole) return { grade: 'cool', vignette: 0.45 };
  if (t >= CUT.cake && t < CUT.case) return { grade: 'cool', vignette: 0.5 };
  if (t >= CUT.case) return { grade: 'warm', vignette: 0.7 };
  return { grade: 'warm', vignette: 0.5 };
}

module.exports = { scene, look, CUT, RT };
