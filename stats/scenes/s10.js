// SC 10 · WITHOUT STATS — the climax payoff. NO HUD AT ALL. The HUD has just shattered at Grandpa's bench: the hero opens
// his eyes on a silent grey fair, colour floods back ("Just colors"), the fair is alive ("And sounds"), a dolly across
// laughing faces in golden light ("And faces"), the hero seeing them for the first time. He stands ("you didn't need stats to
// know your brother"), thinks — memory bubbles of who Max IS (dinosaurs; RAWR at Biscuit, the toaster, Grandpa; up high on
// the pillow fort) -> eureka. Benji skids in with the fair map (insert: the route), proud of his eleven visits; Tank's shadow,
// "I'm tall." (low angle, sun behind him), "Get on." — he kneels, the hero hops onto his shoulders, Tank rises over the
// crowd. The run: a charge under the Ferris wheel, side-tracking past the cotton candy and the teacups, a crane over the fair;
// the slow-motion heroic trio (letterbox, flare: Benji, Tank, then up to the hero). "Not the Ferris wheel" (the wheel barely
// turns: a kid asleep in a gondola), "Cotton candy?" (a swarm of kids), "No... DINOSAUR. Up high." (smash zoom, the look up),
// "THERE!" (whip to the dinosaur, Max on its head), Tank's boost, the leap onto the wobbly dinosaur, Max's RAWR while the
// hero climbs the neck, "Found you, T-rex." (the hug), "I was the king of the dinosaurs! RAWR!" (the dino roars along, the
// crowd applauds), Tank and Benji's high five (Benji lifted into the air) while the boys slide down the tail, Mom's crying-
// happy hug "Don't you EVER...", Max "...Can we do it again?", Mom's deadpan, everybody laughs, crane back -> warm white.
// Every cut and beat comes from the voice through s10_env.times() (shared with audio/cues/gen_sc10.js).
'use strict';

const K = require('./kit');
const FS = require('./sets_fair');
const X = require('../rig/extras');
const CAST = require('../rig/cast');
const AC = require('./acting');
const E = require('./s10_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const V = K.V;
const TM = E.times(V);
const { START, END, C, B } = TM;
const { camAt, camLerp, toScr, whip, flash } = E;
const SP = FS.SPOTS.fair, BN = FS.SPOTS.fairBench, DT = FS.SPOTS.dinoTop;

// close-ups render rig characters without the body-volume filter (perf); the router sets VOL_OFF per shot
let VOL_OFF = false;
const actor = (name, t, pose = {}, act) => K.actor(name, t, VOL_OFF && pose.volume === undefined ? { ...pose, volume: false } : pose, act);
const io = (t, a, b) => ease.inOut(seg(t, a, b));
const GOLD = { time: 'golden', crowd: 0.7 };

// ================================================================ composition
function fairFrame(t, cam, o, chars = '', opt = {}) {
  const Ly = FS.fair.layers(t, cam, o);
  const nn = noNumbers(cam, o);
  return Ly.bg + Ly.mid + nn.mid + (opt.behind ? K.view(cam, opt.behind) : '') + Ly.front + nn.front + K.view(cam, chars) + Ly.crowd + (opt.near ? K.view(cam, opt.near) : '') + Ly.fg + Ly.light;
}
// NO NUMBERS in this scene: cover the two price signs of the set (cotton candy "$3", the booth's "3 DARTS $2")
function noNumbers(cam, o) {
  const v = FS.vis(cam, 1), tn = FS.frameState(o, 'dusk').tn, FC = FS.C;
  let mid = '', front = '';
  if (v.x0 < 2000 && v.x1 > 1800) {
    const sc = SP.sAt(845), lw = 6 / sc;
    mid = K.view(cam, S.g(FS.signBoard(560, -760, 180, 110, '', 80, tn, lw * 0.8, { fill: FC.yellow, txt: FC.cherry, trim: FC.white, r: 20 }) +
      S.circle(535, -762, 26, tn.ol(FC.bubble, lw * 0.5)) + S.circle(570, -772, 30, tn.ol(FC.bubble, lw * 0.5)) + S.circle(596, -756, 22, tn.ol(FC.bubble, lw * 0.5)), `translate(1720 845) scale(${f(sc)})`));
  }
  if (v.x0 < 260 && v.x1 > 40) {
    const sc = SP.sAt(830), lw = 6 / sc;
    front = K.view(cam, S.g(S.rect(-260, -420, 520, 110, 20, tn.ol(FC.white, lw * 0.8)) + T('DARTS', 0, -340, 74, tn.c(FC.navy)), `translate(150 830) scale(${f(sc)})`));
  }
  return { mid, front };
}
const benchFrame = (t, cam, o, chars = '') => FS.fairBench.compose(t, o, '', chars, cam);
function topFrame(t, cam, o, chars = '') { const Ly = FS.dinoTop.layers(t, cam, o); return Ly.bg + Ly.mid + K.view(cam, chars) + Ly.light; }

// ================================================================ the trio
// Tank carrying the hero: Tank's arms up on the hero's shins, the hero drawn through actor() (lip-sync) at carryAt()
function tankCarry(t, tp, hero = {}, act = {}) {
  const side = tp.view === 'side';
  const p = { t, ...tp, ...(side ? { armL: 172, armR: 158, bendL: 0, bendR: 0 } : { armL: 166, armR: 166, bendL: 0, bendR: 0 }), ...(tp.arms || {}) };
  delete p.arms;
  let o = actor('tank', t, p, { arms: false, ...act });
  const c = CAST.carryAt(p);
  const hp = { x: c.x + (side ? (p.flip ? -24 : 24) * p.s : 0), y: c.y, s: c.s, t, turn: side ? (p.flip ? 0.5 : -0.5) : 0, legL: 74, legR: 74, kneeL: 80, kneeR: 80, armL: 30, armR: 40, shadow: false, ...hero };
  o += actor('you', t, hp, { arms: false, ...(hero.act || {}) });
  return o;
}
const riderAt = (tp) => CAST.carryAt(tp);
// front-view running toward the camera: knees lift alternately, arms pump, body bounces
const frontRun = (ph, amp = 1) => ({
  kneeL: 70 * amp * Math.max(0, Math.sin(ph)), kneeR: 70 * amp * Math.max(0, -Math.sin(ph)), legL: 6 * Math.sin(ph) * amp, legR: -6 * Math.sin(ph) * amp,
  bodyY: -14 * amp * Math.abs(Math.sin(ph)), armL: 30 + 22 * amp * Math.sin(ph), armR: 30 - 22 * amp * Math.sin(ph), bendL: 80, bendR: 80,
});
const sideRun = (t, rate, amp = 1, ph = 0) => ({ view: 'side', flip: true, ...AC.run(t * rate + ph, amp), lean: 8 });

// ================================================================ SHOTS
// 1 — continues SC 09's over-the-shoulder shot (the hero looking at laughing fairgoers, silent, grey): the reverse — his face,
// eyes widening ("No numbers.")
const HERO_FAIR = { x: -470, y: 1000 };
// the laughing fairgoers in front of the BALLOON POP booth the hero is looking at (same group as the end of SC 09)
const GOERS = [
  { k: 'adult', i: 9, x: -250, y: 930 }, { k: 'kid', i: 15, x: -120, y: 962 }, { k: 'adult', i: 3, x: 20, y: 918 }, { k: 'adult', i: 14, x: 170, y: 948 },
  { k: 'kid', i: 9, x: 300, y: 975 }, { k: 'adult', i: 20, x: 430, y: 926 }, { k: 'kid', i: 18, x: 540, y: 956 },
];
function goers(t) {
  return GOERS.map((m, n) => {
    const s = SP.sAt(m.y), bob = Math.abs(Math.sin(t * 5 + n * 1.7)) * 8;
    return K.draw[m.k](m.i, { x: m.x, y: m.y, s, turn: (hash(n * 5.1) - 0.5) * 1.2, bodyY: -bob, headRot: 5 * Math.sin(t * 4 + n), armR: n % 3 === 0 ? 140 + 20 * Math.sin(t * 9 + n) : 12, armL: 12, face: { name: 'joy', mouth: n % 2 ? 'bigGrin' : 'grin' } });
  }).join('');
}
function heroFairClose(t, face, o = {}) {
  const s = SP.sAt(HERO_FAIR.y);
  return actor('you', t, { x: HERO_FAIR.x, y: HERO_FAIR.y, s, t, turn: o.turn ?? 0.3, headRot: o.headRot || 0, armL: 12, armR: 12, face }, { arms: false });
}
function shotWake(t) {
  const u = seg(t, C.wake, C.pov);
  const s = SP.sAt(HERO_FAIR.y), fy = HERO_FAIR.y - 700 * s;
  const cam = camLerp(camAt(HERO_FAIR.x + 30, fy + 10, 2.7, 900, 520), camAt(HERO_FAIR.x + 30, fy + 5, 2.95, 900, 520), ease.out(u));
  const open = ease.inOut(seg(t, B.open, B.open + 0.5));
  const w = heroFairClose(t, { name: open > 0.4 ? 'amazed' : 'neutral', eyes: { look: [0.55, -0.1], pupil: 1 + 0.5 * open }, mouth: open > 0.4 ? 'o' : 'line', fx: [] }, { turn: 0.3, headRot: -2 * open });
  let out = fairFrame(t, cam, { time: 'dusk', quiet: 1, lights: 0.5, crowd: 0.7 }, w) + S.rect(0, 0, 1920, 1080, 0, { fill: '#77727F', opacity: 0.3 });
  // the last glints of the shattered HUD glass settle and vanish (no numbers)
  const gk = 1 - seg(t, C.wake + 0.4, C.wake + 1.3);
  if (gk > 0) out += S.g(K.sparkles([[1320, 260 + (t - C.wake) * 90, 24], [420, 180 + (t - C.wake) * 120, 18], [1560, 560 + (t - C.wake) * 60, 18]], t), null, { opacity: f(gk) });
  return out;
}
// 2 — POV: the grey, silent fair; he blinks — "Just colors." — colour blooms back from the centre (quiet 1 -> 0, dusk -> golden)
function shotPOV(t) {
  const u = seg(t, C.pov, C.sounds);
  const kc = ease.inOut(seg(t, B.colors - 0.1, B.colors + 0.9));
  const cam = camLerp(camAt(-120, 600, 0.98), camAt(-60, 590, 1.07), ease.inOut(u));
  const o = { time: { dusk: 1 - kc, golden: kc }, quiet: 1 - kc, crowd: 0.75, cheer: 0.25 * kc, canopy: true, lights: lerp(0.5, 0.65, kc) };
  let out = fairFrame(t, cam, o, goers(t)) + (kc < 1 ? S.rect(0, 0, 1920, 1080, 0, { fill: '#77727F', opacity: f(0.3 * (1 - kc)) }) : '');
  out += E.motes(t, 22, 3, kc) + E.bloomRing(960, 520, seg(t, B.colors, B.colors + 1.1));
  out += flash(t, B.colors, 0.35, 0.4, '#FFF1C8');
  // he blinks — and opens his eyes on colour
  return out + E.eyelids(bump(t, B.colors - 0.34, B.colors + 0.02)) + whip(t, C.pov, 1, 0.1);
}
// 3 — "And sounds." — the fair alive: a dart pops a balloon at the booth, a kid jumps with joy, balloons rise
function shotSounds(t) {
  const u = seg(t, C.sounds, C.faces);
  const cam = camLerp(camAt(170, 600, 1.35), camAt(205, 590, 1.45), ease.out(u));
  const pk = seg(t, B.pop, B.pop + 0.35);
  let behind = '';
  // the target balloon (an empty slot on the booth wall) pops
  const bx = 150 - 84 * 0.3037, by = 830 - 1250 * 0.3037;
  if (t < B.pop) behind += S.ellipse(bx, by, 20, 24, { fill: '#FF5A7A', stroke: '#151515', 'stroke-width': 3 }) + S.path(`M${f(bx - 4)} ${f(by + 28)} L${f(bx + 4)} ${f(by + 28)} L${f(bx)} ${f(by + 23)} Z`, { fill: '#FF5A7A' });
  // a dart flying in
  const dk = seg(t, B.pop - 0.25, B.pop);
  if (dk > 0 && dk < 1) behind += S.g(S.path('M-40 0 L20 0', ln(5, '#2E3448')) + S.path('M20 -6 L34 0 L20 6 Z', { fill: '#C7CEDC', stroke: '#151515', 'stroke-width': 2 }) + S.path('M-40 0 l-14 -10 l4 10 l-4 10 Z', { fill: '#EE3B4C' }), `translate(${f(lerp(bx - 300, bx - 30, dk))} ${f(lerp(by + 120, by, dk))}) rotate(-20)`);
  let w = '';
  // a kid laughing + jumping in the foreground, a dad pointing, a girl with a balloon
  const jump = Math.max(0, Math.sin((t - C.sounds) * 9)) * 24;
  w += K.draw.adult(5, { x: 620, y: 1032, s: SP.sAt(1032), turn: -0.4, armL: 120, armR: 20, face: { name: 'joy' } });
  w += K.draw.kid(8, { x: 140, y: 1050, s: SP.sAt(1050), turn: 0.4, lift: jump, armL: 150 + 12 * Math.sin(t * 14), armR: 150 - 12 * Math.sin(t * 14), face: { name: 'joy', mouth: 'bigGrin' } });
  w += K.draw.kid(12, { x: 820, y: 1060, s: SP.sAt(1060), turn: -0.3, armR: 150, face: 'happy' }) + FS.balloon(870, 470 + Math.sin(t * 2) * 6, 0.45, '#FFD23F', t, { string: 300 });
  let out = fairFrame(t, cam, { ...GOLD, crowd: 0.8, cheer: 0.45 }, w, { behind });
  const [px, py] = toScr(cam, bx, by);
  if (pk > 0 && pk < 1) out += K.C.burst(px, py, pk, '#FFFFFF');
  // released balloons floating up
  for (let i = 0; i < 3; i++) { const k = t - (B.pop + 0.1 + i * 0.25); if (k > 0) out += FS.balloon(px + 80 + i * 120 + Math.sin(t * 2 + i) * 20, py + 140 - k * 260, 0.55, ['#FF6FAE', '#5CC6F2', '#A6E05A'][i], t + i, { string: 180 }); }
  return out + E.motes(t, 16, 5) + whip(t, C.sounds, 1);
}
// 4 — "And faces." — a dolly across laughing faces in golden light
const FACES = [
  { k: 'adult', i: 9, x: 880, y: 1020, face: 'joy', arm: 'wave' },
  { k: 'kid', i: 15, x: 1010, y: 1050, face: { name: 'joy', mouth: 'bigGrin' }, candy: '#FF9FC4' },
  { k: 'adult', i: 3, x: 1150, y: 1010, face: 'talkHappy', arm: 'laugh' },
  { k: 'adult', i: 14, x: 1300, y: 1035, face: { name: 'happy', eyes: { type: 'happy' } } },
  { k: 'kid', i: 9, x: 1420, y: 1055, face: 'excited', balloon: '#5CC6F2' },
  { k: 'adult', i: 20, x: 1560, y: 1015, face: 'joy', arm: 'laugh' },
  { k: 'kid', i: 18, x: 1690, y: 1045, face: { name: 'joy', mouth: 'bigGrin' }, arm: 'cheer' },
  { k: 'adult', i: 11, x: 1820, y: 1025, face: { name: 'happy', eyes: { type: 'happy' } }, candy: '#C9A6FF' },
  { k: 'kid', i: 4, x: 1950, y: 1050, face: 'joy' },
];
function shotFaces(t) {
  const u = seg(t, C.faces, C.heroFace);
  const cam = camLerp(camAt(1120, 760, 1.55), camAt(1640, 745, 1.62), ease.inOut(u));
  let w = '';
  FACES.forEach((m, n) => {
    const s = SP.sAt(m.y), bob = Math.abs(Math.sin(t * 5 + n * 1.3)) * 10;
    const p = { x: m.x, y: m.y, s, turn: (hash(n * 3.3) - 0.5) * 0.8, bodyY: -bob, headRot: 4 * Math.sin(t * 4 + n), face: m.face, armL: 10, armR: 10 };
    if (m.arm === 'wave') p.armR = 150 + 20 * Math.sin(t * 10);
    if (m.arm === 'laugh') { p.armL = 20; p.armR = 30; p.bendR = -120; p.lean = 4 * Math.sin(t * 8); }
    if (m.arm === 'cheer') { p.armL = 160; p.armR = 160; }
    if (m.candy) { p.armR = 34; p.bendR = 70; }
    if (m.balloon) p.armR = 140;
    w += K.draw[m.k](m.i, p);
    if (m.carry !== undefined) w += K.draw.kid(m.carry, { x: m.x, y: m.y - 900 * s - bob, s, legL: 74, legR: 74, kneeL: 80, kneeR: 80, armL: 150, armR: 150, face: { name: 'joy' }, shadow: false });
    if (m.candy) { const h = AC.hand(34, 1); w += FS.cottonCandy(m.x + h[0] * s + 10, m.y - bob + (h[1] - 160) * s, s * 0.7, m.candy); }
    if (m.balloon) w += FS.balloon(m.x + 330 * s, m.y - 1150 * s - bob, s * 1.1, m.balloon, t, { string: 260 });
  });
  let out = fairFrame(t, cam, { ...GOLD, crowd: 0.75, cheer: 0.35, canopy: true }, w);
  out += E.sunRays(1700, 120, t, 0.9) + E.motes(t, 24, 7);
  return out + whip(t, C.faces, 1);
}
// 5 — the hero, seeing faces for the first time (eyes full of light)
function shotHeroFace(t) {
  const u = seg(t, C.heroFace, C.stand);
  const s = SP.sAt(HERO_FAIR.y), fy = HERO_FAIR.y - 700 * s;
  const cam = camLerp(camAt(HERO_FAIR.x + 10, fy, 3.1, 960, 500), camAt(HERO_FAIR.x + 10, fy - 5, 3.35, 960, 500), ease.out(u));
  const w = heroFairClose(t, { name: 'amazed', mouth: 'smallSmile', eyes: { pupil: 1.75, sparkle: true, look: [0.45 * Math.sin(t * 2.2), -0.15] }, fx: ['sparkles'] }, { turn: 0.15, headRot: -3 + 2 * Math.sin(t * 2) });
  let out = fairFrame(t, cam, { ...GOLD, crowd: 0.75, cheer: 0.3 }, w);
  out += E.lensFlare(1500, 160, 0.8) + E.motes(t, 20, 9);
  return out + whip(t, C.heroFace, -1, 0.1);
}
// 6 — "And you didn't need stats to know your brother." — he turns back to Grandpa on the bench; a step, a fist; Grandpa nods
function shotStand(t) {
  const u = seg(t, C.stand, C.think);
  const cam = camLerp(camAt(940, 640, 1.12), camAt(860, 600, 1.32), ease.inOut(u));
  const up = ease.inOut(seg(t, B.up, B.up + 0.45));
  const fist = ease.outBack(seg(t, B.fist, B.fist + 0.3));
  const step = bump(t, B.up, B.up + 0.45);
  let w = actor('grandpa', t, FS.seatPose(BN.grandpa, 1.1, { t, turn: -0.5, headRot: -6 * bump(t, B.fist - 0.1, B.fist + 0.5), face: { name: 'happy', eyes: { look: [-0.8, -0.3] } } }));
  w += actor('you', t, {
    t, x: lerp(560, 700, up), y: 1012, s: 0.6, turn: lerp(-0.35, 0.3, up), lift: 18 * step, legL: 10 * step, legR: -10 * step,
    armL: 14, armR: lerp(14, 96, fist), bendR: 104 * fist,
    face: { name: up > 0.5 ? 'determined' : 'happy', eyes: { look: [lerp(-0.4, 0.6, up), -0.2] } },
  }, { arms: false });
  return benchFrame(t, cam, { time: 'golden', lights: 0.6 }, w) + E.motes(t, 14, 11) + whip(t, C.stand, -1);
}
// 7 — thinking: memory bubbles of who Max IS
const HERO_TH = { x: 700, y: 1012, s: 0.6 };
function bubbleA(t) {   // "Max loves dinosaurs": Max with his balloon, roaring happily at a toy dino
  return (w, h) => {
    let o = E.memRoom(w, h, '#BFE3F2', '#F2C98A', 0.36, 'stars');
    o += S.g(FS.inflatableDino(t, { wobble: 0.8, sign: false, ropes: false, lw: 30 }), `translate(150 ${f(h * 0.36 + 10)}) scale(0.19)`);
    o += K.draw.max({ x: -110, y: h * 0.36 + 20, s: 0.42, t, volume: false, balloon: true, turn: 0.4, face: { name: 'joy', mouth: 'bigGrin' }, shadow: true, lift: 14 * Math.abs(Math.sin(t * 6)) });
    return o;
  };
}
function bubbleRawr(t, kind, t0) {
  return (w, h) => {
    const r = ease.outBack(seg(t, t0, t0 + 0.25)), fy = h * 0.34 + 14;
    let o = E.memRoom(w, h, kind === 'dog' ? '#FFE0B8' : kind === 'toast' ? '#D8F0D0' : '#E8D8F8', kind === 'grandpa' ? '#C9A27A' : '#F2C98A', 0.34, kind === 'toast' ? 'tiles' : 'none');
    o += K.draw.max({ x: -w * 0.24, y: fy, s: 0.34, t, volume: false, roar: r > 0.3, turn: 0.55, lean: -6 * r, face: r > 0.3 ? { name: 'angry', mouth: 'scream', fx: [] } : 'happy' });
    if (kind === 'dog') o += X.biscuit({ x: w * 0.2, y: fy, s: 0.36, pose: 'sit', face: r > 0.3 ? 'shocked' : 'happy', ears: r > 0.3 ? 0.2 : 1, t, rot: -6 * r });
    if (kind === 'toast') o += S.rect(w * 0.02, fy - 20, w * 0.44, 24, 6, ol('#C98A4E', 5)) + X.toaster({ x: w * 0.22, y: fy - 18, s: 0.42, pop: r > 0.3 ? 0.5 + 0.5 * seg(t, t0 + 0.05, t0 + 0.4) : 0, t, rot: 6 * Math.sin(t * 40) * r });
    if (kind === 'grandpa') o += K.draw.grandpa({ x: w * 0.24, y: fy + 230, s: 0.42, t, volume: false, view: 'side', glasses: r > 0.3 ? 'up' : 'on', lean: -8 * r, armL: 30 + 50 * r, armR: 20, face: r > 0.3 ? 'shocked' : 'happy' });
    if (r > 0) o += K.bang('RAWR!', -w * 0.18, -h * 0.22, r, 64, -8, '#7AE05A');
    return o;
  };
}
function bubbleC(t) {   // "up high": Max on top of the pillow fort, arms up, flag waving
  return (w, h) => {
    const fy = h * 0.46;
    let o = E.memRoom(w, h, '#FFE9C8', '#C9A27A', 0.46, 'stars');
    o += X.pillowFort({ x: 0, y: fy + 10, s: 0.19, k: 1, t });
    o += K.draw.max({ x: 20, y: fy - 268, s: 0.36, t, volume: false, armL: 160 + 10 * Math.sin(t * 9), armR: 160 - 10 * Math.sin(t * 9), lift: 10 * Math.abs(Math.sin(t * 7)), face: { name: 'joy', mouth: 'bigGrin' } });
    return o;
  };
}
function shotThink(t) {
  const cutB = t >= C.rawrs, cutC = t >= C.high;
  const cam = cutC ? camLerp(camAt(1000, 560, 1.72), camAt(980, 520, 1.9), ease.in(seg(t, C.high, C.benji)))
    : cutB ? camLerp(camAt(1060, 600, 1.55), camAt(1050, 590, 1.62), seg(t, C.rawrs, C.high))
      : camLerp(camAt(1010, 560, 1.68), camAt(1000, 556, 1.78), seg(t, C.think, C.rawrs));
  const eu = seg(t, B.eureka, B.eureka + 0.15);
  const camF = E.withShake(eu > 0 ? { ...cam, zoom: cam.zoom * (1 + 0.06 * bump(t, B.eureka, B.eureka + 0.3)) } : cam, t, B.eureka, 0.3, 10);
  const eyes = eu > 0 ? { look: [0.3, -1], pupil: 0.9 } : { look: [0.75, -0.55] };
  const w = actor('you', t, {
    ...HERO_TH, t, turn: 0.3, armL: eu > 0 ? 14 : 10, bendL: eu > 0 ? 0 : -105, armR: eu > 0 ? lerp(10, 150, ease.outBack(eu)) : 10, bendR: eu > 0 ? 0 : -105, headRot: eu > 0 ? -6 : 3 * Math.sin(t * 1.5),
    face: eu > 0 ? { name: 'amazed', eyes, fx: ['exclaim'] } : { name: 'determined', eyes, brows: { L: [6, -8], R: [-20, -6] } },
  }, { arms: false, energy: 0.6 });
  let out = benchFrame(t, camF, { time: 'golden', lights: 0.6, bokeh: 1 }, w);
  const [hx, hy] = toScr(camF, HERO_TH.x + 60, HERO_TH.y - 900 * HERO_TH.s);
  const tail = [hx + 130, hy + 40];
  if (!cutB) out += E.memBubble(1330, 400, 720, 470, seg(t, B.memA, B.memA + 0.35), bubbleA(t), { tail, rot: -2 });
  else if (!cutC) {
    out += E.memBubble(1330, 400, 720, 470, 1, bubbleA(t), { tail, rot: -2, out: seg(t, C.rawrs, C.rawrs + 0.2) });
    out += E.memBubble(1120, 250, 520, 330, seg(t, B.rawr1 - 0.12, B.rawr1 + 0.2), bubbleRawr(t, 'dog', B.rawr1), { tail, rot: -4 });
    out += E.memBubble(1610, 330, 480, 330, seg(t, B.rawr2 - 0.12, B.rawr2 + 0.2), bubbleRawr(t, 'toast', B.rawr2), { rot: 5 });
    out += E.memBubble(1360, 700, 540, 330, seg(t, B.rawr3 - 0.12, B.rawr3 + 0.2), bubbleRawr(t, 'grandpa', B.rawr3), { rot: -2 });
  } else {
    const ok = seg(t, C.high, C.high + 0.18);
    if (ok < 1) for (const [x, y, w_, h_, kind, t0, r] of [[1120, 250, 520, 330, 'dog', B.rawr1, -4], [1610, 330, 480, 330, 'toast', B.rawr2, 5], [1360, 700, 540, 330, 'grandpa', B.rawr3, -2]]) out += E.memBubble(x, y, w_, h_, 1, bubbleRawr(t, kind, t0), { rot: r, out: ok });
    out += E.memBubble(1340, 410, 740, 500, seg(t, B.memC, B.memC + 0.35), bubbleC(t), { tail: eu > 0 ? null : tail, rot: 2, out: seg(t, B.eureka, B.eureka + 0.18) });
    if (eu > 0) { out += K.C.burst(1340, 410, seg(t, B.eureka, B.eureka + 0.4), '#FFE14D') + E.focusLines(hx, hy + 120, 1 - seg(t, B.eureka + 0.1, B.eureka + 0.32), t, 26, '#FFF4C8'); }
  }
  return out + E.motes(t, 12, 13) + (cutB && !cutC ? whip(t, C.rawrs, 1, 0.1) : '') + (cutC ? flash(t, C.high, 0.12, 0.3) : '') + flash(t, B.eureka, 0.18, 0.5, '#FFF4C8');
}
// 8 — BENJI skids in: "I heard! I know the fair map!"
function benjiArrive(t) {
  const r = seg(t, C.benji, B.skid);
  const x = lerp(1900, 900, ease.out(r));
  if (t < B.skid) return { x, y: 1018, s: 0.6, t, ...AC.run(t * 15, 1), view: 'side', lean: 10, face: { name: 'determined', mouth: 'O' } };
  const sk = seg(t, B.skid, B.skid + 0.35);
  const pant = t < B.mapOut ? Math.abs(Math.sin(t * 9)) : 0;
  return { x: x - 20 * ease.out(sk), y: 1018, s: 0.6, t, turn: -0.5, lean: lerp(-14, 8 * (t < B.mapOut ? 1 : 0), ease.out(sk)), bodyY: 14 * pant, armL: 24, armR: 24, map: t >= B.mapOut, face: t < B.mapOut ? { name: 'excited', fx: ['sweat'] } : undefined };
}
function shotBenji(t) {
  const u = seg(t, C.benji, C.mapIns);
  const cam = camLerp(camAt(820, 660, 1.16), camAt(800, 640, 1.26), ease.inOut(u));
  let w = actor('grandpa', t, FS.seatPose(BN.grandpa, 1.1, { t, turn: -0.2, face: { name: 'happy', eyes: { look: [0, 0] } } }));
  w += actor('you', t, { ...HERO_TH, x: 560, t, turn: 0.45, armL: 14, armR: 20, face: { name: t < B.skid ? 'shocked' : 'happy', eyes: { look: [0.9, 0] } } }, { arms: false });
  const bp = benjiArrive(t);
  w += actor('benji', t, bp, { energy: 1.4 });
  let out = benchFrame(t, cam, { time: 'golden', lights: 0.6 }, w);
  // skid dust
  for (const d of [0, 0.1, 0.2]) { const [dx, dy] = toScr(cam, bp.x + 60, 1020); out += E.dustPuff(dx, dy, t - B.skid - d, 1.1, 1); }
  return out + whip(t, C.benji, -1);
}
// 8b — the fair map, close: the route draws itself, Benji's finger taps it
function shotMapIns(t) {
  const u = seg(t, C.mapIns, C.eleven);
  const Ly = FS.fairBench.layers(t, { time: 'golden', bokeh: 1 });
  let out = K.view(camAt(1100, 420, 1.5), Ly.bg, 0.6);
  out += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFE0B0', opacity: 0.18 });
  const unf = ease.outBack(seg(t, C.mapIns, C.mapIns + 0.3));
  const sc = 2.55 + 0.12 * u;
  out += S.g(X.fairMap({ x: 0, y: 0, s: 1, fold: 1 - unf, mark: false }) +
    (unf > 0.8 ? routeDots(seg(t, C.mapIns + 0.2, C.eleven - 0.1)) : ''), `translate(960 ${f(500 - 10 * u)}) rotate(${f(-3 + 2 * u)}) scale(${f(sc)})`);
  // Benji's hands at the map edges + a finger tracing the route
  const sk = '#B07450';
  out += E.hand(960 - 470 * sc / 2.55, 520, 1.25, 12, sk) + E.hand(960 + 470 * sc / 2.55, 520, 1.25, -12, sk);
  const rp = routePt(seg(t, C.mapIns + 0.2, C.eleven - 0.1));
  out += E.hand(960 + rp[0] * sc + 30, 500 + rp[1] * sc + 90, 1.05, -25 + 6 * Math.sin(t * 14), sk);
  return out + flash(t, C.mapIns, 0.12, 0.35);
}
const ROUTE = [[-150, 110], [-60, 120], [0, 60], [60, 0], [120, -30]];
function routePt(u) {
  const q = (a, b, c, v) => [(1 - v) * (1 - v) * a[0] + 2 * (1 - v) * v * b[0] + v * v * c[0], (1 - v) * (1 - v) * a[1] + 2 * (1 - v) * v * b[1] + v * v * c[1]];
  u = clamp(u, 0, 1);
  return u < 0.5 ? q(ROUTE[0], ROUTE[1], ROUTE[2], u * 2) : q(ROUTE[2], ROUTE[3], ROUTE[4], u * 2 - 1);
}
function routeDots(u) {
  let d = '';
  const n = Math.floor(30 * u);
  for (let i = 0; i <= n; i++) { const [x, y] = routePt(i / 30); d += `M${f(x - 3)} ${f(y)}a3 3 0 1 1 6 0a3 3 0 1 1 -6 0Z`; }
  let o = S.path(d, { fill: '#E8231E' }) + S.circle(-150, 110, 9, ol('#FFC93C', 3));
  if (u > 0.95) o += S.path('M108 -50 L132 -26 M132 -50 L108 -26', ln(6, '#E8231E'));
  return o;
}
// 8c — "I've been here eleven times!" — proud Benji (glasses glint) ... and a tiny trip on his laces
function shotEleven(t) {
  const u = seg(t, C.eleven, C.tank);
  const cam = camLerp(camAt(1000, 560, 1.85), camAt(1005, 548, 2.0), ease.out(u));
  const tr = bump(t, B.trip, B.trip + 0.4);
  let w = actor('you', t, { ...HERO_TH, x: 640, t, turn: 0.5, armL: 14, armR: 20, face: { name: 'happy', eyes: { look: [0.9, 0] } } }, { arms: false });
  w += actor('benji', t, { x: 1010, y: 1018, s: 0.6, t, turn: -0.3, map: true, bodyY: -10 * (1 - tr), lean: 14 * tr, rot: 5 * tr * Math.sin(t * 30), face: tr > 0.2 ? { name: 'nervous' } : { name: 'excited' } }, { energy: 1.3 });
  let out = benchFrame(t, cam, { time: 'golden', lights: 0.6 }, w);
  const [gx, gy] = toScr(cam, 985, 1018 - 0.6 * 0.98 * 735);
  const gl = bump(t, C.eleven + 0.25, C.eleven + 0.7);
  if (gl > 0) out += K.F.sparkle(gx + 40, gy - 10, 40 * gl) + K.F.sparkle(gx - 50, gy + 10, 22 * gl);
  return out + whip(t, C.eleven, 1, 0.1);
}
// 9 — TANK: "I'm tall." — his shadow falls over them; low angle over their shoulders, the sun behind his head
function shotTank(t) {
  const u = seg(t, C.tank, C.getOn);
  const cam = camLerp(camAt(1060, 560, 1.0, 960, 600), camAt(1060, 540, 1.08, 960, 600), ease.out(u));
  const step = ease.out(seg(t, C.tank, C.tank + 0.45));
  const tp = { x: 1060, y: lerp(960, 1005, step), s: 0.62, t, ...AC.walkFront(t * 8, 1 - step), face: { name: 'deadpan', eyes: { look: [0, 0.5] } }, armL: 10, armR: 10 };
  let w = actor('tank', t, tp, { arms: false, energy: 0.3 });
  w += actor('you', t, { x: 700, y: 1150, s: 0.82, t, view: 'back', headRot: 4, armL: 12, armR: 22 });
  w += actor('benji', t, { x: 1390, y: 1160, s: 0.82, t, view: 'back', map: true, headRot: -4, armL: 20 });
  let out = benchFrame(t, cam, { time: 'golden', lights: 0.6 }, w);
  const [sx, sy] = toScr(cam, 1060, tp.y - 1237 * 0.62 - 30);
  out += E.sunRays(sx, sy, t, 0.9 * step, 1400, 16) + E.lensFlare(sx + 40, sy - 20, 0.7 * step);
  return out;
}
// 10 — "Get on." — he kneels, pats his shoulder; the hero hops on
function tankKneelPose(t, x, y, s) {
  const kn = ease.inOut(seg(t, B.kneel, B.kneel + 0.32)) * (1 - ease.inOut(seg(t, C.rise + 0.1, C.rise + 0.6)));
  return { x, y, s, t, legL: 30 * kn, legR: 30 * kn, kneeL: 100 * kn, kneeR: 100 * kn, bodyY: 230 * kn, kn };
}
function shotGetOn(t) {
  const u = seg(t, C.getOn, C.rise);
  const cam = camLerp(camAt(820, 640, 1.15), camAt(860, 600, 1.22), ease.inOut(u));
  const tk = tankKneelPose(t, 1080, 1030, 0.62);
  const landed = t >= B.hopLand;
  const pat = t < B.hop ? Math.abs(Math.sin((t - B.kneel) * 9)) : 0;
  const tp = { ...tk, turn: -0.35, armL: landed ? 166 : 12, armR: landed ? 166 : lerp(12, 150, seg(t, B.kneel, B.kneel + 0.25)), bendR: landed ? 0 : 70 + 30 * pat, face: { name: 'happy', mouth: 'smallSmile', eyes: { look: [-0.6, 0] } } };
  let w = actor('benji', t, { x: 330, y: 1015, s: 0.6, t, turn: 0.5, map: true, face: { name: 'excited' } }, { arms: false });
  const c = riderAt(tp);
  if (!landed) {
    w += actor('tank', t, tp, { arms: false, energy: 0.4 });
    const h = seg(t, B.hop, B.hopLand);
    const hx = lerp(640, c.x, ease.inOut(h)), hy = lerp(1012, c.y, ease.inOut(h)) - 260 * Math.sin(h * Math.PI);
    w += actor('you', t, { x: hx, y: hy, s: 0.6, t, turn: 0.45, armL: h > 0 ? 150 : 14, armR: h > 0 ? 150 : 20, legL: 30 * h * (1 - h) * 4, legR: 30 * h * (1 - h) * 4, kneeL: 60 * Math.sin(h * Math.PI), kneeR: 60 * Math.sin(h * Math.PI), shadow: h <= 0, face: { name: h > 0 ? 'joy' : 'happy', eyes: { look: [0.8, 0.2] } } }, { arms: false });
  } else {
    const ld = bump(t, B.hopLand, B.hopLand + 0.2);
    w += tankCarry(t, { ...tp, bodyY: tp.bodyY + 20 * ld }, { face: 'joy', armL: 40, armR: 150 });
  }
  return benchFrame(t, cam, { time: 'golden', lights: 0.6 }, w) + whip(t, C.getOn, -1, 0.1);
}
// 11 — the rise: low angle, Tank stands up with the hero on his shoulders, the camera cranes up into the sun
function shotRise(t) {
  const u = seg(t, C.rise, C.run1);
  const cam = camLerp(camAt(1080, 700, 1.05, 960, 700), camAt(1080, 330, 1.0, 960, 560), ease.inOut(seg(t, C.rise + 0.05, C.run1 - 0.1)));
  const tk = tankKneelPose(t, 1080, 1030, 0.62);
  const pt = ease.outBack(seg(t, B.point, B.point + 0.3));
  let w = actor('benji', t, { x: 560, y: 1060, s: 0.64, t, turn: 0.35, armL: 30, armR: lerp(30, 160, pt), face: { name: 'determined', mouth: 'grin' } }, { arms: false });
  w += tankCarry(t, { ...tk, turn: -0.1, face: { name: 'determined' } }, { face: { name: 'determined', mouth: 'grin' }, armL: 30, armR: lerp(60, 112, pt), turn: 0.35 });
  let out = benchFrame(t, cam, { time: 'golden', lights: 0.6, bokeh: 1 }, w);
  const c = riderAt({ ...tk, s: 0.62 });
  const [hx, hy] = toScr(cam, c.x - 160, c.y - 951 * 0.62);
  out += E.sunRays(hx, hy, t, 0.6 + 0.4 * u, 1600, 16) + E.lensFlare(hx, hy, 0.5 + 0.5 * u) + E.motes(t, 18, 15);
  return out;
}
// 12 — "You ran past the Ferris wheel." — the trio charges at the camera under the wheel
function shotRun1(t) {
  const u = seg(t, C.run1, C.run2);
  const y = lerp(960, 1070, u), s = SP.sAt(y);
  const cam = E.withShake(camAt(1300, y - 640 * s, 1.0 * 0.43 / s, 960, 640), t, C.run1 + 0.1 + 0.32 * Math.floor((t - C.run1) / 0.32), 0.12, 3);
  const ph = (t - C.run1) * 14;
  let w = actor('benji', t, { x: 1300 - 300 * s / 0.4, y: y + 12, s: SP.sAt(y + 12), t, ...frontRun(ph + 1.2, 1), map: true, face: { name: 'determined', mouth: 'grin' } }, { arms: false });
  w += tankCarry(t, { x: 1300 + 40 * s / 0.4, y, s, ...frontRun(ph, 0.8), face: { name: 'determined' } }, { face: { name: 'determined', mouth: 'grin' }, armL: 40, armR: 120, bodyY: 0 });
  let out = fairFrame(t, cam, { ...GOLD, crowd: 0.8, cheer: 0.2 }, w);
  for (const [dx, d] of [[-300, 0], [40, 0.13]]) { const [px, py] = toScr(cam, 1300 + dx * s / 0.4, y + 6); const age = ((t - C.run1 + d) % 0.45); out += E.dustPuff(px - 40, py, age, 1.1, -1) + E.dustPuff(px + 40, py, age, 1.1, 1); }
  return out + E.focusLines(960, 420, 0.35, t, 24, '#FFF6DE') + E.motes(t, 14, 17) + whip(t, C.run1, 'up', 0.14);
}
// 13/14 — side tracking: "Past the cotton candy." / "Past the giant teacups."
function trackRun(t, t0, t1, x0, x1, camZ, camY, o = {}) {
  const u = seg(t, t0, t1);
  const x = lerp(x0, x1, u);
  const cam = camAt(x + 90, camY, camZ, 960, 560);
  const tp = { x, y: 990, s: SP.sAt(990), ...sideRun(t, 13, 0.95), face: { name: 'determined' } };
  let w = tankCarry(t, tp, { face: { name: 'determined', mouth: 'grin', eyes: { look: [0.8, 0] } }, armL: 30, armR: 100 });
  w += actor('benji', t, { x: x + 250, y: 1035, s: SP.sAt(1035), t, ...sideRun(t, 15, 1, 1.4), map: true, face: { name: 'determined' } });
  let behind = '';
  if (o.vendor) behind += K.draw.adult(o.vendor.i, { x: SP.cotton.vendor.x, y: SP.cotton.vendor.y, s: SP.cotton.vendor.s, turn: -0.3, armR: 150 + 20 * Math.sin(t * 10), face: 'joy' });
  let out = fairFrame(t, cam, { ...GOLD, crowd: 0.75, cheer: 0.3, canopy: true, ...(o.set || {}) }, w, { behind });
  for (const [dx, yy, d] of [[0, 990, 0], [250, 1035, 0.11]]) { const [px, py] = toScr(cam, x + dx - 40, yy + 4); out += E.dustPuff(px, py, (t - t0 + d) % 0.36, 0.9, -1); }
  return out + E.speedStreaks(t, 0.7, o.seed || 1, -1, 150, 520);
}
const shotRun2 = (t) => trackRun(t, C.run2, C.run3, 1300, 2150, 0.95, 600, { vendor: { i: 16 }, seed: 2 }) + whip(t, C.run2, 1);
const shotRun3 = (t) => trackRun(t, C.run3, C.scan, 2750, 3620, 0.82, 560, { set: { spin: 1.8 }, seed: 3 }) + whip(t, C.run3, 1);
// 15 — the crane over the fair: the trio cuts through the crowd, the hero scanning from Tank's shoulders
function shotScan(t) {
  const u = seg(t, C.scan, C.trio);
  const cam = camLerp(camAt(2500, 640, 0.74), camAt(2600, 470, 0.64), ease.inOut(u));
  const x = lerp(2700, 3250, u);
  const look = Math.sin((t - C.scan) * 4);
  let w = tankCarry(t, { x, y: 1010, s: SP.sAt(1010), ...sideRun(t, 12, 0.9) }, { armL: 30, armR: 150, bendR: 110, turn: 0.6 * look, headRot: 8 * look, face: { name: 'determined', eyes: { look: [look, -0.2] } } });
  w += actor('benji', t, { x: x + 230, y: 1040, s: SP.sAt(1040), t, ...sideRun(t, 15, 1, 0.7), map: true });
  return fairFrame(t, cam, { ...GOLD, crowd: 0.9, cheer: 0.2 }, w) + whip(t, C.scan, 'up', 0.12);
}
// 16 — THE HEROIC TRIO in slow motion: "The kid with level four. The kid with three health. And you."
const TRIO = { x: 2980, bx: 2670, y0: 1000, y1: 1045 };
function trioState(t) {
  const u = seg(t, C.trio, C.notFerris);
  const y = lerp(TRIO.y0, TRIO.y1, u), s = SP.sAt(y);
  const ph = (t - C.trio) * 3.4;
  return { y, s, ph };
}
function shotTrio(t) {
  const st = trioState(t);
  const { y, s, ph } = st;
  const wide = camAt(TRIO.x - 140, y - 760 * s, lerp(1.0, 1.08, seg(t, C.trio, B.four)), 960, 800);
  const onBenji = camAt(TRIO.bx, y - 820 * s, 1.75, 900, 520);
  const onTank = camAt(TRIO.x, y - 1020 * s, 1.55, 960, 560);
  const onYou = camAt(TRIO.x, y - 1500 * s, 1.6, 960, 520);
  let cam = wide;
  if (t >= B.four - 0.15) cam = camLerp(wide, onBenji, ease.inOut(seg(t, B.four - 0.15, B.four + 0.2)));
  if (t >= B.three - 0.15) cam = camLerp(onBenji, onTank, ease.inOut(seg(t, B.three - 0.15, B.three + 0.2)));
  if (t >= B.you - 0.12) cam = camLerp(onTank, onYou, ease.inOut(seg(t, B.you - 0.12, B.you + 0.3)));
  const glasses = ease.out(seg(t, B.four + 0.1, B.four + 0.45)) * (1 - seg(t, B.three - 0.1, B.three + 0.2));
  const fr = frontRun(ph, 0.75);
  let w = actor('benji', t, { x: TRIO.bx, y: y + 14, s: SP.sAt(y + 14), t, ...frontRun(ph + 1.6, 0.75), map: glasses < 0.05, armR: glasses > 0.05 ? lerp(30, 34, glasses) : undefined, bendR: glasses > 0.05 ? -150 * glasses + 80 * (1 - glasses) : undefined, face: { name: 'determined', eyes: { upper: 0.15 } } }, { arms: false });
  const flexK = ease.out(seg(t, B.three, B.three + 0.4));
  w += tankCarry(t, { x: TRIO.x, y, s, ...fr, face: { name: 'determined', brows: { L: [14, -4], R: [14, -4] }, mouth: flexK > 0.3 ? 'smirk' : 'line' } }, {
    face: { name: 'determined', mouth: 'grin', eyes: { look: [0.2, -0.1] } }, armL: 40, armR: lerp(40, 118, ease.outBack(seg(t, B.you, B.you + 0.35))), headRot: -4, bodyY: 0,
  });
  let out = fairFrame(t, cam, { ...GOLD, crowd: 0.55, lights: 0.7 }, w);
  // light: the sun behind them, slow dust, letterbox
  const sun = toScr(cam, TRIO.x - 250, 380, 0.6);
  out += E.sunRays(sun[0], sun[1], t * 0.5, 1, 1800, 18) + E.lensFlare(sun[0], sun[1], 0.9) + E.motes(t * 0.35, 30, 19, 1.2);
  if (glasses > 0.6) { const [gx, gy] = toScr(cam, TRIO.bx + 10, y + 14 - 0.98 * 740 * SP.sAt(y + 14)); out += K.F.sparkle(gx + 30, gy, 46 * bump(t, B.four + 0.3, B.four + 0.9)); }
  const lb = ease.inOut(seg(t, C.trio, C.trio + 0.4)) * (1 - ease.inOut(seg(t, C.notFerris - 0.3, C.notFerris)));
  return out + E.letterbox(lb, 96) + whip(t, C.trio, 1, 0.1);
}
// 17 — BENJI: "Not the Ferris wheel. Max hates the Ferris wheel." — map in hand, thumb at the wheel
function shotNotFerris(t) {
  if (t >= C.hates) return shotHates(t);
  const u = seg(t, C.notFerris, C.hates);
  const y = lerp(1075, 1090, u);
  const cam = camLerp(camAt(1180, 600, 1.12, 960, 560), camAt(1180, 595, 1.18, 960, 560), u);
  const ph = (t - C.notFerris) * 9;
  const shake = Math.sin(t * 14) * bump(t, C.notFerris + 0.1, C.notFerris + 0.9);
  let w = tankCarry(t, { x: 1500, y: 975, s: SP.sAt(975), ...AC.walkFront(ph, 1.4), turn: -0.2 }, { armL: 30, armR: 40, face: { name: 'happy', eyes: { look: [-0.7, 0.3] } } });
  w += actor('benji', t, { x: 900, y, s: SP.sAt(y), t, ...AC.walkFront(ph + 1, 1.6), turn: 0.15, headRot: 7 * shake, map: true, armL: 34, armR: lerp(34, 150, bump(t, C.notFerris + 0.2, C.hates)), bendR: 0 }, { arms: false });
  return fairFrame(t, cam, { ...GOLD, crowd: 0.8 }, w) + whip(t, C.notFerris, -1, 0.1);
}
// 17b — "Max hates the Ferris wheel." — the wheel looms over the trio (low angle)
function shotHates(t) {
  const u = seg(t, C.hates, C.slow);
  const cam = camLerp(camAt(1150, 380, 0.92, 960, 620), camAt(1150, 330, 0.98, 960, 600), ease.out(u));
  let w = tankCarry(t, { x: 1320, y: 1050, s: SP.sAt(1050), turn: 0.2, ...AC.walkFront(t * 8, 0.8) }, { armL: 30, armR: 30, headRot: -6, face: { name: 'neutral', eyes: { look: [-0.4, -1] } } });
  w = actor('benji', t, { x: 820, y: 955, s: SP.sAt(995), t, turn: 0.35, map: true, headRot: 4, face: { name: 'neutral', eyes: { look: [0.3, -1] } } }) + w;
  return fairFrame(t, cam, { ...GOLD, crowd: 0.8 }, w) + whip(t, C.hates, 'up', 0.1);
}
// 18 — "It's too slow." — the wheel barely turns; a kid in a gondola has fallen asleep
const SLOW_SPEED = 0.08, SLOW_A = 5.76;
// a cam that puts point (px, py) of the parallax-k layer at screen (sx, sy) with zoom Z
const camAtK = (px, py, Z, k, sx = 960, sy = 540) => { const zk = 1 + (Z - 1) * k; return { x: (px - 960 - (sx - 960) / zk) / k, y: (py - 540 - (sy - 540) / zk) / k, zoom: Z }; };
function slowGondola(t) {
  const n = 12, r = 430, gw = r * 0.2;
  let best = 0, bd = 1e9;
  const tau = Math.PI * 2;
  for (let i = 0; i < n; i++) { const a = (((C.slow * 0.1 * SLOW_SPEED + (i / n) * tau) % tau) + tau) % tau; const d = Math.abs(a - SLOW_A); if (d < bd) { bd = d; best = i; } }
  const a = t * 0.1 * SLOW_SPEED + (best / n) * tau;
  return { i: best, x: 1150 + Math.cos(a) * r + Math.sin(t * 1.3 + best) * 2, y: 190 + Math.sin(a) * r, gw };
}
function shotSlow(t) {
  const u = seg(t, C.slow, C.candy);
  const g0 = slowGondola(C.slow);
  const cam = camLerp(camAtK(g0.x - 40, g0.y + 60, 3.1, 0.6, 960, 560), camAtK(g0.x - 40, g0.y + 60, 3.3, 0.6, 960, 560), u);
  let out = fairFrame(t, cam, { ...GOLD, crowd: 0.6, wheel: SLOW_SPEED });
  const g = slowGondola(t), gw = g.gw;
  const zk = 1 + (cam.zoom - 1) * 0.6;
  const [sx, sy] = toScr(cam, g.x, g.y, 0.6);
  // the kid's head over the gondola rim, asleep (his body hidden by the cabin front redrawn on top)
  const ks = 0.2;
  const kcl = S.uid('s10kc');
  const kid = S.clipDef(kcl, S.rect(-gw, -gw * 2, gw * 2, gw * 2.6, 0)) + S.g(K.draw.kid(10, { x: 0, y: gw * 0.36 + 560 * ks * (CAST.kidSpec(10).size || 0.8) / 0.8, s: ks, face: { name: 'sleepy', mouth: 'o', fx: [] }, headRot: 12 + 3 * Math.sin(t * 2), armL: 10, armR: 10, shadow: false }), null, { 'clip-path': `url(#${kcl})` });
  const cab = `M${f(-gw / 2)} ${f(gw * 0.42)}H${f(gw / 2)}V${f(gw * 0.8)}Q${f(gw / 2)} ${f(gw * 1.18)} 0 ${f(gw * 1.18)}Q${f(-gw / 2)} ${f(gw * 1.18)} ${f(-gw / 2)} ${f(gw * 0.8)}Z`;
  const col = FS.tone({ golden: 0.9 }).c(['#EE3B4C', '#FFD23F', '#22B4BE', '#FF6FAE', '#4A72E6', '#FF8A2E'][g.i % 6]);
  out += S.g(kid + S.path(cab, { fill: col, stroke: '#151515', 'stroke-width': 3, 'stroke-linejoin': 'round' }), `translate(${f(sx)} ${f(sy)}) scale(${f(zk)})`);
  out += S.g(K.C.zzz(t * 0.7, 0, 0), `translate(${f(sx + 22 * zk)} ${f(sy - 6 * zk)}) scale(0.8)`);
  return out + whip(t, C.slow, 1, 0.1);
}
// 19 — TANK: "Cotton candy?" — he stops by the stand, eyebrow up
function shotCandy(t) {
  const u = seg(t, C.candy, C.kids);
  const cam = camLerp(camAt(1560, 580, 1.22), camAt(1590, 570, 1.3), ease.out(u));
  const stop = ease.out(seg(t, C.candy, C.candy + 0.3));
  const tp = { x: lerp(1250, 1400, stop), y: 1010, s: SP.sAt(1010), turn: 0.55, lean: -8 * bump(t, C.candy + 0.15, C.candy + 0.45), face: { name: 'confused', fx: [] } };
  let w = tankCarry(t, tp, { armL: 30, armR: 40, turn: 0.5, face: { name: 'neutral', eyes: { look: [0.9, 0.2] } } });
  w += actor('benji', t, { x: lerp(1000, 1130, stop), y: 1040, s: SP.sAt(1040), t, turn: 0.5, map: true, face: { name: 'neutral', eyes: { look: [0.9, 0] } } });
  return fairFrame(t, cam, { ...GOLD, crowd: 0.8 }, w, { behind: K.draw.adult(16, { x: SP.cotton.vendor.x, y: SP.cotton.vendor.y, s: SP.cotton.vendor.s, turn: -0.4, face: 'happy' }) }) + whip(t, C.candy, 1, 0.1);
}
// 20 — "Every kid goes to cotton candy." — a swarm of sugar-high kids around the stand
const SWARM = Array.from({ length: 16 }, (_, i) => ({ i: 20 + i + (20 + i >= 32 ? 1 : 0), x: 1430 + (i % 8) * 84 + (i > 7 ? 42 : 0) + (hash(i * 2.1) - 0.5) * 30, y: i > 7 ? 1005 : 945, ph: hash(i * 4.4) * 6, candy: hash(i * 7.7) > 0.4, col: ['#FF9FC4', '#C9A6FF', '#8AD8FF', '#FFE68A'][i % 4] }));
function shotKids(t) {
  const u = seg(t, C.kids, C.no);
  const cam = camLerp(camAt(1745, 700, 1.28), camAt(1745, 690, 1.42), ease.out(u));
  let w = '';
  for (const k of SWARM) {
    const s = SP.sAt(k.y), j = Math.max(0, Math.sin(t * 11 + k.ph));
    const p = { x: k.x, y: k.y, s, turn: -0.2 + 0.4 * hash(k.i), lift: 40 * j, armL: 150 + 20 * Math.sin(t * 13 + k.ph), armR: k.candy ? 170 : 150 - 20 * Math.sin(t * 13 + k.ph), face: { name: hash(k.i * 3) > 0.5 ? 'excited' : 'joy', mouth: 'bigGrin' }, back: hash(k.i) > 0.7 };
    if (p.back) p.view = 'back';
    w += K.draw.kid(k.i, p);
    if (k.candy) { const hx = k.x + (100 + 250 * Math.sin((170 * Math.PI) / 180)) * s * 0.9, hy = k.y - 40 * j - (515 + 250) * s; w += FS.cottonCandy(hx, hy, s * 0.75, k.col); }
  }
  // the overwhelmed vendor behind the counter
  const behind = K.draw.adult(16, { x: SP.cotton.vendor.x, y: SP.cotton.vendor.y, s: SP.cotton.vendor.s, turn: -0.1, armL: 120 + 30 * Math.sin(t * 16), armR: 120 - 30 * Math.sin(t * 16), face: { name: 'scared', fx: ['sweat2'] } });
  return fairFrame(t, cam, { ...GOLD, crowd: 0.7, cheer: 0.6 }, w, { behind }) + whip(t, C.kids, 1, 0.1);
}
// 21-24 — the hero on Tank's shoulders: "No." / "Max doesn't want sweets." / smash zoom "DINOSAUR." / "Up high." (looks up)
const RIDE = { x: 1500, y: 1010 };
function rideCams(t) {
  const tp = { x: RIDE.x, y: RIDE.y, s: SP.sAt(RIDE.y), turn: -0.2 };
  const c = riderAt(tp);
  const faceY = c.y - 720 * c.s;      // the hero's face centre (world)
  return { tp, c, faceY };
}
function shotRide(t) {
  const { tp, c, faceY } = rideCams(t);
  let cam, extra = '', face, look = [0.2, -0.1], headRot = 0, arms = { armL: 30, armR: 40 };
  if (t < C.sweets) {          // "No." — head shake
    const u = seg(t, C.no, C.sweets);
    cam = camLerp(camAt(c.x + 60, faceY + 80, 2.0, 960, 520), camAt(c.x + 60, faceY + 70, 2.1, 960, 520), u);
    headRot = 9 * Math.sin((t - C.no) * 18) * (1 - seg(t, C.no + 0.15, C.no + 0.7));
    face = { name: 'determined', eyes: { look: [0, 0] } };
  } else if (t < C.dino) {     // "Max doesn't want sweets. Max wants to be a..." — slow push, eyes narrowing
    const u = seg(t, C.sweets, C.dino);
    cam = camLerp(camAt(c.x - 40, faceY + 30, 2.1, 860, 520), camAt(c.x - 30, faceY + 10, 2.7, 860, 520), ease.in(u));
    face = { name: 'determined', eyes: { look: [0.5, -0.4], upper: 0.25 + 0.15 * u }, brows: { L: [14, -6], R: [14, -6] } };
    arms = { armL: 10, armR: 10, bendL: -105, bendR: -105 };
  } else if (t < C.upHigh) {   // "DINOSAUR." — SMASH ZOOM
    const u = seg(t, C.dino, C.upHigh);
    cam = E.withShake(camLerp(camAt(c.x, faceY, 3.6, 960, 500), camAt(c.x, faceY, 3.75, 960, 500), ease.out(u)), t, C.dino, 0.35, 16);
    face = { name: 'amazed', eyes: { pupil: 1.9, sparkle: true, look: [0, 0] }, fx: [] };
    extra = E.focusLines(960, 500, 1 - 0.6 * u, t) + flash(t, C.dino, 0.15, 0.6);
    arms = { armL: 150, armR: 150, bendL: 40, bendR: 40 };
  } else {                     // "Up high." — he looks up; tilt up past him into the sky
    const u = seg(t, C.upHigh, C.there);
    cam = camLerp(camAt(c.x, faceY, 2.5, 960, 600), camAt(c.x + 40, faceY - 60, 2.1, 960, 680), ease.inOut(u));
    face = { name: 'amazed', eyes: { look: [lerp(-0.8, 0.9, ease.inOut(u)), -1], pupil: 1.2 }, mouth: 'o', fx: [] };
    headRot = -6 - 6 * Math.sin(u * 3);
    arms = { armL: 30, armR: lerp(40, 120, u) };
  }
  const w = tankCarry(t, { ...tp, ...AC.walkFront(t * 5, 0.4), face: { name: 'neutral', eyes: { look: [0.3, -0.6] } } }, { ...arms, headRot, face: { ...face } });
  let out = fairFrame(t, cam, { ...GOLD, crowd: 0.85 }, w);
  if (t >= C.upHigh) out += E.lensFlare(1500, 160, seg(t, C.upHigh, C.there)) + E.sunRays(1500, 160, t, seg(t, C.upHigh, C.there));
  out += extra;
  return out + (t < C.sweets ? whip(t, C.no, 1, 0.1) : '') + (t >= C.sweets && t < C.dino ? flash(t, C.sweets, 0.1, 0.25) : '');
}
// 25 — "THERE!" — whip to the dinosaur: the hero points over the crowd, Max tiny on its head
function shotThere(t) {
  const u = seg(t, C.there, C.top);
  const cam = camLerp(SP.cams.dinoFar, camAt(4720, -120, 0.78, 1100, 420), ease.inOut(seg(t, C.there + 0.12, C.top)));
  const wob = 0.6;
  const st = SP.dino.seat(t, wob);
  const mx = actor('max', t, FS.seatPose({ ...st, pose: FS.SIT }, 0.56, { t, rot: st.rot, armL: 140 + 20 * Math.sin(t * 9), armR: 150, face: { name: 'joy' } }));
  let out = fairFrame(t, cam, { ...GOLD, crowd: 0.95, cheer: 0.3, packed: 0.35, wobble: wob }, mx);
  // over-the-shoulder: Tank + the hero from behind in the foreground (screen space), the hero pointing at the dino
  const fg = tankCarry(t, { x: 360, y: 1560, s: 0.78, view: 'back' }, { view: 'back', armL: 20, armR: 120, headRot: 0, legL: 74, legR: 74 });
  out += fg;
  out += E.focusLines(1100, 420, 1 - seg(t, C.there + 0.1, C.there + 0.45), t, 26, '#FFF6DE');
  return out + whip(t, C.there, 1, 0.14);
}
// 26 — "On top of the dinosaur!" — Max on the head, kicking his legs, rawr-ing at the crowd
function shotTop(t) {
  const u = seg(t, C.top, C.dash);
  const cam = camLerp(DT.cams.max, camAt(810, 330, 1.5), ease.out(u));
  const wob = 0.55;
  const st = DT.seat(t, wob);
  const kick = Math.sin(t * 8);
  const w = actor('max', t, FS.seatPose({ ...st, pose: FS.SIT }, 0.56, { t, rot: st.rot, turn: 0.15, kneeL: 60 + 30 * kick, kneeR: 60 - 30 * kick, armL: 130 + 20 * Math.sin(t * 6), armR: 130 - 20 * Math.sin(t * 6), bendL: 50, bendR: 50, face: { name: 'joy', mouth: 'bigGrin' } }));
  return topFrame(t, cam, { cheer: 0.6, wobble: wob }, w) + whip(t, C.top, 1, 0.1);
}
// 27 — the dash: Tank charges to the dinosaur, plants, boosts the hero — the leap onto its back (BOING) — up the back
function dashState(t) {
  const wobBase = 0.55, boing = Math.exp(-Math.max(0, t - B.land) * 2.5) * (t >= B.land ? 1 : 0);
  const wob = wobBase + 0.6 * boing;
  return { wob, boing };
}
function shotDash(t) {
  const u = seg(t, C.dash, C.rawr);
  const cam = camLerp(camAt(4820, 520, 0.72), camAt(5080, 160, 0.66), ease.inOut(seg(t, C.dash + 0.3, B.land + 0.25)));
  const { wob, boing } = dashState(t);
  const run = ease.out(seg(t, C.dash, B.plant));
  const tx = lerp(4300, 4930, run), ty = 1010, ts = SP.sAt(ty);
  const plant = seg(t, B.plant, B.leap);
  const st = SP.dino.seat(t, wob);
  let w = actor('max', t, FS.seatPose({ ...st, pose: FS.SIT }, 0.56, { t, rot: st.rot, armL: 150, armR: 150, face: { name: 'joy' } }));
  const tp = t < B.plant ? { x: tx, y: ty, s: ts, ...sideRun(t, 14, 1) } : { x: tx, y: ty, s: ts, turn: 0.3, bodyY: 40 * bump(t, B.plant, B.leap + 0.15), legL: 14, legR: 14 };
  w += actor('benji', t, { x: lerp(4000, 4650, ease.out(seg(t, C.dash + 0.1, B.plant + 0.2))), y: 1040, s: SP.sAt(1040), t, ...(t < B.plant + 0.2 ? sideRun(t, 15, 1, 0.5) : { turn: 0.4, armR: 150, map: true }), face: { name: 'excited' } });
  if (t < B.leap) {
    // still riding; during the plant the hero gets up into a crouch on the shoulders
    w += tankCarry(t, tp, t < B.plant ? { armL: 30, armR: 110, face: { name: 'determined', mouth: 'grin' } } : { legL: lerp(74, 30, plant), legR: lerp(74, 30, plant), kneeL: lerp(80, 110, plant), kneeR: lerp(80, 110, plant), armL: 150, armR: 150, face: { name: 'determined' } });
  } else {
    w += actor('tank', t, { ...tp, t, armL: 170, armR: 170, face: { name: 'determined', mouth: 'grin' } }, { arms: false });
    const c0 = riderAt(tp), c1 = SP.dino.climbAt(0.52, t, wob);
    const lu = seg(t, B.leap, B.land);
    if (lu < 1) {
      const hx = lerp(c0.x, c1.x, lu), hy = lerp(c0.y, c1.y, lu) - 380 * Math.sin(lu * Math.PI), hs = lerp(c0.s, c1.s, lu);
      w += actor('you', t, { x: hx, y: hy, s: hs, t, view: 'side', flip: true, rot: 20 * lu, armL: 160, armR: 140, legL: 60, legR: 20, kneeL: 90, kneeR: 40, face: { name: 'determined', mouth: 'grin' }, shadow: false }, { arms: false });
    } else {
      const cu = lerp(0.52, 0.62, ease.out(seg(t, B.land + 0.1, C.rawr)));
      const c = SP.dino.climbAt(cu, t, wob);
      const sq = bump(t, B.land, B.land + 0.2);
      w += actor('you', t, { x: c.x, y: c.y, s: c.s, t, view: 'side', rot: clamp(c.rot * 0.4, -25, 25), sy: 1 - 0.15 * sq, sx: 1 + 0.1 * sq, ...E.climb((t - B.land) * 12, 0.9), face: { name: 'determined' }, shadow: false }, { arms: false });
    }
  }
  let out = fairFrame(t, cam, { ...GOLD, crowd: 0.9, cheer: 0.35 + 0.4 * boing, wobble: wob }, w);
  if (t >= B.land && t < B.land + 0.4) { const c = SP.dino.climbAt(0.52, t, wob); const [px, py] = toScr(cam, c.x, c.y); out += K.C.burst(px, py, seg(t, B.land, B.land + 0.4), '#FFFFFF'); }
  return out + whip(t, C.dash, 1, 0.1);
}
// 28 — MAX: "RAWR!" — on the head, roaring at the crowd ... while his brother climbs up the neck into view
function shotRawr(t) {
  const u = seg(t, C.rawr, C.found);
  const cam = camLerp(camAt(900, 470, 1.15), camAt(900, 420, 1.24), ease.out(u));
  const wob = 0.7;
  const st = DT.seat(t, wob);
  const roar = bump(t, B.rawr - 0.1, B.rawr + 0.8) > 0.05;
  const seen = seg(t, B.rawr + 0.75, B.rawr + 0.95);
  let w = actor('max', t, FS.seatPose({ ...st, pose: FS.SIT }, 0.56, { t, rot: st.rot, roar, turn: lerp(0, 0.6, seen), face: roar ? { name: 'angry', mouth: 'scream', fx: [] } : { name: 'joy', eyes: { look: [0.8, 0.7] } } }));
  const cu = lerp(0.12, 0.97, ease.inOut(seg(t, C.rawr, C.found + 0.05)));
  const c = DT.climbAt(cu, t, wob);
  const ck = 1 - seg(cu, 0.72, 0.92), cl = E.climb((t - C.rawr) * 13, ck);
  w += actor('you', t, { x: c.x, y: c.y, s: c.s, t, view: ck > 0.5 ? 'side' : 'front', turn: -0.5, rot: clamp(c.rot * 0.3, -22, 22) * ck, ...cl, lean: cl.lean * ck, legL: cl.legL * ck, legR: cl.legR * ck, kneeL: cl.kneeL * ck, kneeR: cl.kneeR * ck, armL: lerp(40, cl.armL, ck), armR: lerp(40, cl.armR, ck), face: { name: ck > 0.5 ? 'determined' : 'joy', mouth: 'grin' }, shadow: false }, { arms: false });
  let out = topFrame(t, cam, { cheer: 0.8, wobble: wob, dinoFace: roar ? 'roar' : undefined }, w);
  const [mx, my] = toScr(cam, st.x, st.y - 120);
  if (roar) out += K.bang('RAWR!', mx - 300, Math.max(150, my), seg(t, B.rawr, B.rawr + 0.2), 110, -10, '#7AE05A');
  return out + whip(t, C.rawr, 'up', 0.12);
}
// 29 — "Found you, T-rex." — the hug on top of the dinosaur
function hugPair(t, o = {}) {
  const wob = o.wob ?? 0.45;
  const st = DT.seat(t, wob), hg = DT.hug(t, wob);
  const hk = ease.out(seg(t, B.hug - 0.1, B.hug + 0.25)), sq = bump(t, B.hug + 0.05, B.hug + 0.45);
  const sway = Math.sin((t - B.hug) * 3) * 2.5 * hk;
  let w = actor('max', t, FS.seatPose({ ...st, pose: FS.SIT }, 0.56, { t, rot: st.rot + sway, turn: 0.6 * hk, armL: lerp(30, 120, hk), armR: lerp(30, 150, hk), bendR: 40 * hk, face: o.maxFace || { name: 'joy', fx: hk > 0.5 ? ['blush'] : [] } }));
  w += actor('you', t, { x: hg.x - 40 * hk, y: hg.y + 18, s: DT.s, t, rot: hg.rot - 6 * hk + sway, turn: -0.55, bodyY: 150 * hk, legL: 30 * hk, legR: 30 * hk, kneeL: 100 * hk, kneeR: 100 * hk,
    armL: lerp(40, 78, hk), bendL: -70 * hk, armR: 30 + 10 * sq, sx: 1 + 0.04 * sq, sy: 1 - 0.05 * sq, face: o.youFace || { name: 'joy', fx: ['tears'] }, shadow: false }, { arms: false });
  return w;
}
function shotFound(t) {
  const u = seg(t, C.found, C.king);
  const cam = camLerp(camAt(880, 360, 1.4), camAt(890, 350, 1.62), ease.inOut(u));
  let out = topFrame(t, cam, { cheer: 0.6, wobble: 0.45 }, hugPair(t));
  const [hx, hy] = toScr(cam, 900, 120);
  out += E.motes(t, 18, 23) + FS.glow(hx, hy - 120, 300, 'sfGlowGold', 0.35);
  return out + whip(t, C.found, -1, 0.1);
}
// 30 — "I was the king of the dinosaurs!" — Max stands up on the head, arms wide; the hero laughing, holding him
function shotKing(t) {
  const u = seg(t, C.king, C.below);
  const cam = camLerp(camAt(870, 330, 1.45), camAt(880, 360, 1.25), ease.inOut(u));
  const wob = 0.5;
  const st = DT.seat(t, wob), hg = DT.hug(t, wob);
  const up = ease.outBack(seg(t, B.stand, B.stand + 0.35));
  const mp = up > 0.02 ? { x: st.x, y: st.y + 6, s: DT.s, t, rot: st.rot, turn: 0.1, lift: 20 * bump(t, B.stand, B.stand + 0.35), armL: lerp(30, 150, up), armR: lerp(30, 150, up), face: { name: 'excited' } } : FS.seatPose({ ...st, pose: FS.SIT }, 0.56, { t, rot: st.rot, face: { name: 'joy' } });
  let w = actor('max', t, mp, { arms: false });
  w += actor('you', t, { x: hg.x - 10, y: hg.y + 18, s: DT.s, t, rot: hg.rot, turn: -0.3, bodyY: 150, legL: 30, legR: 30, kneeL: 100, kneeR: 100, armL: 70, bendL: -40, armR: 30 + 20 * Math.abs(Math.sin(t * 8)), face: { name: 'joy' }, shadow: false }, { arms: false });
  return topFrame(t, cam, { cheer: 0.7, wobble: wob, confetti: 0.4 * up }, w) + E.motes(t, 14, 29) + whip(t, C.king, 1, 0.1);
}
// 31 — "RAWR!" — tilt down to the crowd below: everybody roars back and applauds (the dinosaur roars too)
function shotBelow(t) {
  const u = seg(t, C.below, C.high5);
  const cam = camLerp(camAt(860, 430, 1.05), DT.cams.below, ease.inOut(seg(t, C.below + 0.3, C.high5)));
  const wob = 0.8;
  const st = DT.seat(t, wob), hg = DT.hug(t, wob);
  const roar = t >= B.roar - 0.05 && t < B.roar + 0.9;
  let w = actor('max', t, { x: st.x, y: st.y + 6, s: DT.s, t, rot: st.rot, roar, turn: 0.1, armL: 150, armR: 150, face: roar ? { name: 'angry', mouth: 'scream', fx: [] } : { name: 'excited' } }, { arms: false });
  w += actor('you', t, { x: hg.x - 10, y: hg.y + 18, s: DT.s, t, rot: hg.rot, turn: -0.3, bodyY: 150, legL: 30, legR: 30, kneeL: 100, kneeR: 100, armL: 150, armR: 150, face: { name: 'joy' }, shadow: false }, { arms: false });
  let out = topFrame(t, cam, { cheer: 1, wobble: wob, confetti: 0.6 + 0.4 * u, dinoFace: roar ? 'roar' : undefined }, w);
  if (roar) { const [mx, my] = toScr(cam, st.x, st.y - 280); out += K.bang('RAWR!', mx - 200, Math.max(140, my), seg(t, B.roar, B.roar + 0.2), 120, -8, '#7AE05A'); }
  return out;
}
// 32 — the beat: Tank + Benji high-five — Benji lifted into the air by it — then the boys slide down the whole dinosaur
function tankBenji(t) {
  const hi = seg(t, B.high5 - 0.15, B.high5), lifted = ease.outBack(seg(t, B.high5 + 0.1, B.high5 + 0.5));
  const tp = { x: 4760, y: 1010, s: SP.sAt(1010), t, turn: 0.35, armL: 20, armR: lerp(lerp(40, 172, ease.out(hi)), 172, lifted), face: { name: 'joy' } };
  let w = actor('tank', t, tp, { arms: false });
  const h = CAST.handPos('tank', tp, 1);
  const bs = SP.sAt(1020);
  const kick = Math.sin(t * 14) * lifted;
  const bp = { x: 0, y: 0, s: bs, t, armL: 172, armR: lerp(60, 130, lifted), legL: 25 * kick, legR: -25 * kick, kneeL: 30 * lifted, kneeR: 30 * lifted, face: { name: 'excited' }, shadow: lifted < 0.2 };
  const bh = CAST.handPos('benji', bp, -1);
  const ground = { x: 4990, y: 1020 };
  const bx = lerp(ground.x, h[0] - bh[0], Math.max(hi * 0.4, lifted)), by = lerp(ground.y, h[1] - bh[1], lifted) - 60 * bump(t, B.high5 - 0.25, B.high5 + 0.05);
  w += actor('benji', t, { ...bp, x: bx, y: by, armL: lerp(lerp(20, 160, hi), 172, lifted), map: false }, { arms: false });
  return { w, hand: h };
}
function shotHigh5(t) {
  if (t >= C.slide) return shotSlide(t);
  const u = seg(t, C.high5, C.slide);
  const cam = camLerp(camAt(4860, 640, 1.25), camAt(4870, 600, 1.38), ease.out(u));
  const tb = tankBenji(t);
  let out = fairFrame(t, cam, { ...GOLD, crowd: 0.9, cheer: 0.8, wobble: 0.6 }, tb.w);
  if (t >= B.high5 && t < B.high5 + 0.4) { const [px, py] = toScr(cam, tb.hand[0], tb.hand[1] - 20); out += K.C.burst(px, py, seg(t, B.high5, B.high5 + 0.4), '#FFE14D'); }
  return out + whip(t, C.high5, 1, 0.1);
}
function shotSlide(t) {
  const u = seg(t, C.slide, C.mom);
  const cam = camLerp(camAt(5350, 200, 0.62), camAt(5420, 260, 0.66), ease.inOut(u));
  const wob = 0.6 + 0.4 * bump(t, B.slide, B.slideEnd);
  // from the head (u 1) down the neck, the back, the tail (u 0) — Max in the hero's lap, arms up
  const su = 1 - ease.inOut(seg(t, B.slide, B.slideEnd));
  let w = tankBenji(t).w;
  if (t < B.slideEnd) {
    const c = SP.dino.climbAt(clamp(su, 0, 1), t, wob);
    const sp = { x: c.x, y: c.y, s: c.s, t, view: 'side', flip: true, rot: clamp(c.rot, -40, 40), legL: 88, legR: 88, kneeL: 10, kneeR: 10, armL: 165, armR: 150, shadow: false };
    w += actor('you', t, { ...sp, face: { name: 'joy', mouth: 'bigGrin' } }, { arms: false });
    w += actor('max', t, { ...sp, x: c.x + 40 * c.s, y: c.y - 30 * c.s, armL: 170, armR: 160, face: { name: 'excited' } }, { arms: false });
  } else {
    const k = seg(t, B.slideEnd, B.slideEnd + 0.3), base = SP.dino.climbAt(0, t, wob);
    w += actor('you', t, { x: base.x + 120 + 80 * k, y: 1000, s: SP.sAt(1000), t, lift: 160 * Math.sin(k * Math.PI), armL: 150, armR: 150, face: { name: 'joy' } }, { arms: false });
    w += actor('max', t, { x: base.x + 260 + 100 * k, y: 1010, s: SP.sAt(1010), t, lift: 130 * Math.sin(k * Math.PI), armL: 160, armR: 160, face: { name: 'excited' } }, { arms: false });
  }
  const out = fairFrame(t, cam, { ...GOLD, crowd: 0.9, cheer: 0.8, wobble: wob }, w);
  return out + E.speedStreaks(t, 0.4 * bump(t, B.slide, B.slideEnd), 9, -1, 100, 600, 10) + whip(t, C.slide, 'down', 0.1);
}
// 33 — MOM: "Don't you EVER do that again!" — she runs in and scoops both boys into a crying-happy hug
const HUG = { x: 6600, y: 1000 };
function hugGroup(t, o = {}) {
  const s = SP.sAt(HUG.y);
  const grab = ease.out(seg(t, B.grab - 0.05, B.grab + 0.2));
  const sq = bump(t, B.ever - 0.05, B.ever + 0.4), rock = Math.sin((t - B.grab) * 2.6) * 2.5 * grab;
  const run = seg(t, C.mom, B.grab);
  let w = '';
  // Mom (behind) — runs in from the left, then kneels behind them, arms around them
  if (t < B.grab - 0.05) {
    w += actor('mom', t, { x: lerp(HUG.x - 900, HUG.x - 120, run), y: HUG.y - 10, s, t, dayoff: true, view: 'side', flip: true, ...AC.run(t * 14, 1), lean: 10, face: { name: 'crying' } }, { arms: false });
  } else {
    w += actor('mom', t, { x: HUG.x, y: HUG.y - 14, s, t, dayoff: true, bodyY: 230 * grab, rot: rock, sy: 1 - 0.03 * sq, armL: 80, armR: 80, bendL: -30, bendR: -30, legL: 30 * grab, legR: 30 * grab, kneeL: 100 * grab, kneeR: 100 * grab, face: o.momFace || { name: 'crying', fx: ['tears'] } }, { arms: false, energy: 0.6 });
  }
  const bx = 165 * s / 0.4 * (1 - 0.15 * grab);
  const boysFace = o.boysFace || { name: 'joy' };
  w += actor('you', t, { x: HUG.x - bx, y: HUG.y + 8, s, t, turn: 0.5 * grab, rot: rock - 4 * sq, armL: 20, armR: lerp(20, 30, grab), sx: 1 + 0.03 * sq, face: o.youFace || boysFace, shadow: true }, { arms: false });
  w += actor('max', t, { x: HUG.x + bx * 0.9, y: HUG.y + 12, s, t, turn: -0.5 * grab, rot: rock + 4 * sq, armL: lerp(20, 70, grab), armR: 20, headY: o.maxPop || 0, face: o.maxFace || boysFace, shadow: true }, { arms: false });
  // Mom's hands on their far shoulders (over the boys)
  if (grab > 0.3) {
    w += E.hand(HUG.x - bx - 70 * s, HUG.y - 500 * s, s * 1.2, 35 + rock, '#F6D2B8') + E.hand(HUG.x + bx * 0.9 + 72 * s, HUG.y - 190 * s, s * 1.05, -50 + rock, '#F6D2B8');
  }
  return w;
}
function shotMom(t) {
  const u = seg(t, C.mom, C.again);
  const s = SP.sAt(HUG.y);
  const cam = E.withShake(camLerp(camAt(HUG.x - 60, HUG.y - 520 * s, 1.85, 960, 520), camAt(HUG.x, HUG.y - 560 * s, 2.0, 960, 500), ease.inOut(u)), t, B.ever, 0.35, 10);
  let w = hugGroup(t);
  // Grandpa arrives in the background with his cane, smiling
  const ga = seg(t, B.grab + 0.6, C.again);
  if (ga > 0) w = actor('grandpa', t, { x: lerp(6080, 6280, ga), y: 900, s: SP.sAt(900), t, cane: true, view: ga < 0.95 ? 'side' : undefined, flip: true, ...(ga < 0.95 ? AC.walk(t * 7, 0.8) : {}), face: { name: 'happy' } }, { arms: false }) + w;
  let out = fairFrame(t, cam, { ...GOLD, crowd: 0.85, cheer: 0.5, wobble: 0.4 }, w);
  if (t > B.grab) { const [fx, fy] = toScr(cam, HUG.x, HUG.y - 14 - (1073 - 250) * s * 1.0 + 330 * s); out += E.tearDrops(fx, fy, 1.6, t); }
  return out + whip(t, C.mom, 1, 0.1);
}
// 34 — MAX: "...Can we do it again?" — he pops up out of the hug with huge hopeful eyes
function shotAgain(t) {
  const u = seg(t, C.again, C.react);
  const s = SP.sAt(HUG.y);
  const pop = ease.outBack(seg(t, C.again + 0.05, C.again + 0.3));
  const mxX = HUG.x + 165 * s / 0.4 * 0.85 * 0.9;
  const cam = camLerp(camAt(mxX - 20, HUG.y - 420 * s, 3.0, 900, 520), camAt(mxX - 10, HUG.y - 430 * s, 3.2, 900, 520), ease.out(u));
  const w = hugGroup(t, { maxFace: { name: 'cute', fx: ['sparkles'] }, maxPop: -30 * pop, momFace: { name: 'crying', mouth: 'wail', fx: ['tears'] } });
  return fairFrame(t, cam, { ...GOLD, crowd: 0.85, cheer: 0.3 }, w) + whip(t, C.again, 1, 0.1);
}
// 35 — Mom's deadpan stare ... then everybody bursts out laughing
function shotReact(t) {
  const u = seg(t, C.react, C.pull);
  const s = SP.sAt(HUG.y);
  const laugh = t >= B.laugh;
  const cam = camLerp(camAt(HUG.x - 30, HUG.y - 560 * s, 2.6), camAt(HUG.x - 30, HUG.y - 545 * s, laugh ? 2.2 : 2.7), ease.out(u));
  const momFace = laugh ? { name: 'joy', mouth: 'bigGrin', fx: ['tears'] } : { name: 'deadpan', eyes: { upper: 0.6, look: [0.6, 0.2] }, mouth: 'line', fx: ['sweat'] };
  const w = hugGroup(t, { momFace, youFace: laugh ? { name: 'joy', mouth: 'bigGrin' } : { name: 'happy', eyes: { look: [0.6, -0.4] } }, maxFace: laugh ? { name: 'joy' } : { name: 'cute' } });
  return fairFrame(t, cam, { ...GOLD, crowd: 0.85, cheer: laugh ? 0.6 : 0.1 }, w) + whip(t, C.react, -1, 0.1);
}
// 36 — crane back: the whole gang laughing at the dinosaur's tail (Benji up on Tank's shoulders now), Grandpa, the golden
// fair — then warm white into the next morning (SC 11)
function shotPull(t) {
  const u = seg(t, C.pull, END);
  const s = SP.sAt(HUG.y);
  const cam = camLerp(camAt(HUG.x - 80, HUG.y - 520 * s, 1.9), camAt(6000, 260, 0.62), ease.inOut(seg(t, C.pull, END - 0.2)));
  let w = actor('grandpa', t, { x: 6300, y: 960, s: SP.sAt(960), t, cane: true, headRot: 4 * Math.sin(t * 6), bodyY: -6 * Math.abs(Math.sin(t * 9)), face: { name: 'joy' } }, { arms: false });
  const tp = { x: 7000, y: 980, s: SP.sAt(980), turn: -0.3, bodyY: -8 * Math.abs(Math.sin(t * 8)), face: { name: 'joy' } };
  const c = riderAt(tp);
  w += actor('tank', t, { ...tp, t, armL: 166, armR: 166 }, { arms: false });
  w += actor('benji', t, { x: c.x, y: c.y, s: c.s, t, legL: 74, legR: 74, kneeL: 80, kneeR: 80, armL: 150 + 15 * Math.sin(t * 10), armR: 160, face: { name: 'joy' }, shadow: false }, { arms: false });
  w += hugGroup(t, { momFace: { name: 'joy', mouth: 'bigGrin' }, youFace: { name: 'joy', mouth: 'bigGrin' }, maxFace: { name: 'joy' } });
  let out = fairFrame(t, cam, { ...GOLD, crowd: 0.9, cheer: 0.7, wobble: 0.5 }, w);
  const [sx, sy] = toScr(cam, 4800, -400, 0.3);
  out += E.sunRays(sx, sy, t, 0.8 * u) + E.motes(t, 20, 31, u);
  for (let i = 0; i < 4; i++) { const k = t - C.pull - 0.3 - i * 0.25; if (k > 0) out += FS.balloon(500 + i * 330 + Math.sin(t + i) * 30, 1100 - k * 330, 0.7, ['#FF6FAE', '#FFD23F', '#5CC6F2', '#A6E05A'][i], t + i, { string: 200 }); }
  out += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFF6E6', opacity: f(ease.in(seg(t, B.out, END))) });
  return out + whip(t, C.pull, 'up', 0.08);
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [C.pov, shotWake], [C.sounds, shotPOV], [C.faces, shotSounds], [C.heroFace, shotFaces], [C.stand, shotHeroFace], [C.think, shotStand],
  [C.benji, shotThink], [C.mapIns, shotBenji], [C.eleven, shotMapIns], [C.tank, shotEleven], [C.getOn, shotTank], [C.rise, shotGetOn],
  [C.run1, shotRise], [C.run2, shotRun1], [C.run3, shotRun2], [C.scan, shotRun3], [C.trio, shotScan], [C.notFerris, shotTrio],
  [C.slow, shotNotFerris], [C.candy, shotSlow], [C.kids, shotCandy], [C.no, shotKids], [C.there, shotRide], [C.top, shotThere],
  [C.dash, shotTop], [C.rawr, shotDash], [C.found, shotRawr], [C.king, shotFound], [C.below, shotKing], [C.high5, shotBelow],
  [C.mom, shotHigh5], [C.again, shotMom], [C.react, shotAgain], [C.pull, shotReact], [Infinity, shotPull],
];
const CLOSE = new Set([shotHeroFace, shotThink, shotEleven, shotRide, shotFound, shotAgain, shotReact, shotMom, shotWake, shotPull, shotThere, shotTank, shotRise]);
const shotAt = (t) => { for (const [end, g] of SHOTS) if (t < end) return g; return shotPull; };
function scene(t) {
  const fn = shotAt(t);
  VOL_OFF = CLOSE.has(fn);
  return fn(t);
}
function look(t) {
  if (t < B.colors) return { grade: null, vignette: 0.9 };
  if (t < B.colors + 0.9) return { grade: 'warm', vignette: 0.8 };
  return { grade: 'warm', vignette: 0.6 };
}
function captionY(t) {
  const fn = shotAt(t);
  if (fn === shotTrio) return 1030;
  return 1010;
}

module.exports = { scene, look, captionY, TIMES: TM, CUT: C, BEATS: B };
