// SC 09 · THE X — quiet. Grandpa's hand on the hero's shoulder in the frozen sea of numbers ("Breathe, kid." — his face is the
// first face that comes back), the bench under the lamp; "Nineteen seventy-nine. The finals." (he taps his 79 patch); the
// truth: "I lost." -> a Super-8 sepia flashback of the 1979 fair: young Lou (brown pompadour!) flexing at the FINAL table in
// front of everybody; "You... LOST?"; the arm insert: two forearms locked, SLAM, 0:02; the whole town laughs, young Lou grins
// sheepishly; that night, alone on the same bench under the same lamp — a girl with a red bouffant sits down with cotton candy
// (a heart) -> match cut to the bench today: "Best loss of my whole life."; "Numbers tell you how strong somebody is" (his
// plate's STR flickers) "...they don't tell you who they are" (the plate dissolves: a clean face); "I only saw numbers." (the
// sky full of them); "What's that little X up in the corner?" — the X that was in the HUD frame all along lights up; a macro
// of the X; the terms window from that night: line 1.2, page one of 4,812; he reaches up, presses — "Reality HUD... off." —
// the whole HUD shatters like glass; then true silence: Grandpa's face, and a crowd of faces with no numbers at all.
// Every cut and beat comes from the voice through s09_env.times() (shared with audio/cues/gen_sc09.js).
'use strict';

const K = require('./kit');
const H = require('./hud');
const FS = require('./sets_fair');
const AC = require('./acting');
const E8 = require('./s08_env');
const E = require('./s09_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln } = K;
const V = K.V;
const TM = E.times(V);
const { START, END, C, B } = TM;
const { camAt, camLerp, shook, toScr, view, whip, flashAt, focusLines, dark, row } = E8;
const BS = FS.SPOTS.fairBench, FA = FS.SPOTS.fair;

let VOL_OFF = false;
const actor = (name, t, pose = {}, act) => K.actor(name, t, VOL_OFF && pose.volume === undefined ? { ...pose, volume: false } : pose, act);

// ================================================================ the HUD, calm and dim
const CLOCK = '4:52 PM';
// o: { dim (frame opacity), hl (the X highlight), press, numbers, sys }
function hudFrame9(t, o = {}) {
  return S.g(H.hudFrame({ t, clock: CLOCK, day: 'SAT', minimap: false, quest: 'FIND MAX', questSub: 'LOCATION: UNKNOWN', closeX: false }), null, { opacity: f(o.dim ?? 0.5) });
}
function theX(t, o = {}) {
  const hl = o.hl || 0;
  const x = H.closeX({ t, k: 1, highlight: hl, press: o.press || 0 });
  const a = lerp(o.dim ?? 0.5, 1, Math.max(hl, o.press ? 1 : 0));
  return a < 0.99 ? S.g(x, null, { opacity: f(a) }) : x;
}
const hud9 = (t, o = {}) => hudFrame9(t, o) + theX(t, o);
// slow, sparse drifting numbers (no tint), opacity k
const drift = (t, k, seed = 41, n = 22, rect = [0, 0, 1920, 300]) => (k > 0.01 ? S.g(H.numbersFlood({ t, k: 0.32, seed, n, tint: false, rect }), null, { opacity: f(k) }) : '');

// ================================================================ the bench today (fairBench room set)
const heroSeat = (extra = {}) => FS.seatPose(BS.hero, 1, extra);
const gpaSeat = (extra = {}) => FS.seatPose(BS.grandpa, 1.1, extra);
function bench(t, cam, o = {}) {
  let ch = '';
  if (o.you !== false) ch += actor('you', t, heroSeat(o.you || {}), { arms: o.youArms ?? true });
  if (o.gpa !== false) ch += actor('grandpa', t, gpaSeat(o.gpa || {}), { arms: o.gpaArms ?? true, energy: 0.8 });
  return FS.fairBench.compose(t, { time: 'dusk', quiet: o.quiet || 0, bokeh: 1, fgBokeh: true, balloon: false }, '', ch, cam);
}
// Grandpa's plate over his head (dim), screen coords for a cam
function gpaPlate(t, cam, o = {}) {
  const p = gpaSeat();
  const hp = H.overHead('grandpa', p.x, p.y, p.s);
  const [x, y] = toScr(cam, hp.x, hp.y);
  return H.plateFor('grandpa', { x, y, s: o.s ?? 0.85, t, fade: o.fade ?? 0.45, k: o.k ?? 1, bars: [{ label: 'STR', value: 79, bump: o.bump || 0 }] });
}

// ================================================================ SHOTS
// 1 — "Breathe, kid." in the frozen sea of numbers: Grandpa's hand on his shoulder; his plate slides off his face
function shotHand(t) {
  const u = seg(t, C.hand, C.bench);
  const cam = camLerp(camAt(2560, 700, 1.7), camAt(2560, 690, 1.85), u);
  const gin = ease.out(seg(t, C.hand - 0.2, B.hand + 0.2));
  const gx = lerp(2760, 2625, gin), gs = E8.sAt(1008);
  const ys = E8.sAt(1002);
  let w = actor('you', t, { x: 2480, y: 1002, s: ys, t, turn: lerp(0, 0.5, seg(t, B.hand, B.hand + 0.4)), face: { name: 'sad', fx: ['tears'], eyes: { look: [0.8, -0.2] } } }, { arms: false });
  w += actor('grandpa', t, { x: gx, y: 1008, s: gs, t, turn: -0.55, armL: lerp(12, 78, gin), bendL: -10, headRot: 4, face: 'happy' }, { arms: false, energy: 0.6 });
  const calm = seg(t, B.breathe, B.breathe + 1.2);
  let o = E8.crowdShot(t, cam, { back: E8.RING_B, front: E8.RING_F, quiet: 1, cold: true, pt: TM.START - 7, chars: w, k: () => 1 - 0.4 * calm,
    under: S.g(H.numbersFlood({ t: START - 7, k: 0.75, seed: 31, n: 60, tint: false }).replace(/#3BE8FF|#FFD21F|#3DFF8F|#FF4D66|#FF5ACD|#FFFFFF/g, '#B8C6D4'), null, { opacity: f(1 - 0.6 * calm) }) + dark(0.3, '#0A1020') });
  // Grandpa's face: a plate on it ... slides up and away on "Breathe"
  const hp = H.overHead('grandpa', gx, 1008, gs);
  const [fx, fy] = toScr(cam, hp.x - 10, hp.y + 210 * gs);
  const off = ease.inOut(seg(t, B.breathe - 0.1, B.breathe + 0.5));
  if (off < 1) o += S.g(E8.facePlates([{ x: fx, y: fy - 260 * off, r: 120 * gs * cam.zoom, i: 9, lv: 87 }], { t: START - 7 }), null, { opacity: f(1 - off) });
  o += dark(0.1, '#0A1020');
  return o + H.hudFrame({ t: START - 7, clock: CLOCK, day: 'SAT', theme: 'cold', quest: 'FIND MAX', questSub: 'LOCATION: UNKNOWN' });
}
// 2 — "Sit with me for one second." the bench under the lamp in a quiet gap of the crowd; the hero plops down
function shotBench(t) {
  const u = seg(t, C.bench, C.story);
  const cam = camLerp(camAt(-1040, 660, 1.15), camAt(-1060, 640, 1.3), u);
  const seats = FA.bench.seats;
  const arr = seg(t, C.bench, B.sit - 0.35), sit = ease.out(seg(t, B.sit - 0.35, B.sit));
  const sp = FS.seatPose(seats[0], 1, { turn: 0.3 });
  let hero;
  if (sit <= 0) hero = { x: lerp(-1560, seats[0].x, arr), y: 905, s: E8.sAt(905), t, view: 'side', flip: true, ...AC.walk(t * 8, 1), face: { name: 'sad' } };
  else hero = { ...sp, y: lerp(905, sp.y, sit) + 14 * bump(t, B.sit, B.sit + 0.25), legL: sp.legL * sit, legR: sp.legR * sit, kneeL: sp.kneeL * sit, kneeR: sp.kneeR * sit, t, sy: 1 - 0.05 * bump(t, B.sit, B.sit + 0.25), face: { name: 'sad', eyes: { look: [0, 0.6] } } };
  const pat = Math.abs(Math.sin((t - C.bench) * 7)) * (1 - seg(t, B.sit - 0.1, B.sit + 0.2));
  let w = actor('grandpa', t, FS.seatPose(seats[1], 1.1, { armL: 34 + 12 * pat, bendL: -20, face: 'happy' }), { arms: false, energy: 0.6 });
  w += actor('you', t, hero, { arms: false });
  let o = E8.fairWith(t, cam, { crowd: 0.9 }, w);
  const heads = E8.setPeople(cam, { crowd: 0.9 }, 'back').filter((h) => h.s > 0.12);
  o += S.g(E8.headTags(heads, { t, rim: '#7FA3BF', bar: '#7F96AA', glass: '#0B141E' }), null, { opacity: f(0.6 - 0.3 * u) });
  o += drift(t, 0.6, 43, 24);
  return o + hud9(t, { dim: 0.55 }) + whip(t, C.bench, -1, 0.12);
}
// 3 — "You know my story. Nineteen seventy-nine. The finals." (he taps his 79 patch)
function shotStory(t) {
  const u = seg(t, C.story, C.finals);
  const cam = camLerp(camAt(960, 600, 1.0), BS.cams.two, u);
  const tap = seg(t, B.patch - 0.1, B.patch + 0.25) * (1 - seg(t, B.patch + 1.3, B.patch + 1.6));
  const tp = Math.abs(Math.sin((t - B.patch) * 9)) * (t > B.patch && t < B.patch + 1.2 ? 1 : 0);
  let o = bench(t, cam, {
    you: { turn: 0.25, headRot: -4, face: { name: 'sad', eyes: { look: [0.1, 0.7] } } }, youArms: false,
    gpa: tap > 0 ? { armR: 22, bendR: lerp(0, -128, tap) + 8 * tp, face: 'smug' } : {}, gpaArms: tap <= 0,
  });
  o += gpaPlate(t, cam, { fade: 0.5 });
  o += drift(t, 0.45, 45, 18);
  return o + hud9(t) + whip(t, C.story, 1, 0.1);
}
// 4 — "The finals." Grandpa remembering (eyes up)
function shotFinals(t) {
  const cam = camLerp(BS.cams.grandpa, camAt(1180, 550, 1.75), seg(t, C.finals, C.end));
  let o = bench(t, cam, { gpa: { face: { name: 'happy', eyes: { look: [-0.5, -0.7] } }, headRot: -6 }, you: { turn: 0.3, face: { name: 'sad', eyes: { look: [0.7, 0] } } } });
  return o + drift(t, 0.35, 47, 14) + hud9(t) + whip(t, C.finals, -1, 0.08);
}
// 5 — "But I never told you the end." the hero looks up
function shotEnd(t) {
  const lk = ease.inOut(seg(t, C.end + 0.2, C.end + 0.8));
  const cam = camLerp(BS.cams.hero, camAt(760, 590, 1.75), seg(t, C.end, C.lost));
  let o = bench(t, cam, { you: { turn: 0.3, headRot: lerp(-6, 2, lk), face: { name: lk > 0.5 ? 'confused' : 'sad', eyes: { look: [lerp(0.1, 0.9, lk), lerp(0.7, -0.2, lk)] } } }, youArms: false });
  return o + drift(t, 0.35, 49, 14) + hud9(t) + whip(t, C.end, 1, 0.08);
}
// 6 — "I lost." Grandpa, smiling
function shotLost(t) {
  const cam = camLerp(camAt(1180, 560, 1.7), camAt(1185, 545, 1.95), seg(t, C.lost, C.fb1), ease.out);
  let o = bench(t, cam, { gpa: { face: 'happy', turn: -0.4 } });
  return o + drift(t, 0.3, 51, 12) + hud9(t) + whip(t, C.lost, -1, 0.08);
}
// ---- 1979
const SEP_LINE = E.LINE;
function fbFrame(t, inner, o = {}) {
  const k = seg(t, o.t0 ?? -1e9, (o.t0 ?? -1e9) + 0.3);
  return E.sepia(inner) + E.film(t, { k: 1 }) + E.burn(o.burnIn ? 1 - k : 0, 1) + (o.burnOut ? E.burn(o.burnOut, -1) : '');
}
// 7 — FLASHBACK: "Lost the final. In front of everybody." young Lou flexing at the FINAL table; pull back: the whole town
function shotFb1(t) {
  const u = seg(t, C.fb1 + 0.3, C.youLost - 0.1);
  const cam = camLerp(camAt(820, 330, 1.75), camAt(960, 470, 0.78), u, ease.inOut);
  const st = E.stage79(t, cam);
  const flex = Math.sin(t * 6) * 0.5 + 0.5;
  let w = E.draw79(E.LOU, { x: 790, y: 566, s: 0.36, t, armL: 96, armR: 96, bendL: 100 + 10 * flex, bendR: 100 + 10 * flex, face: { name: 'smug', mouth: 'grin' } });
  w += E.draw79(E.MIKE, { x: 1150, y: 566, s: 0.36, t, turn: -0.3, armL: 20, armR: 20, bendL: -110, bendR: -110, face: { name: 'smug' } });
  let o = st.bg + st.stage + S.g(w, FS.camTf(cam, 1)) + st.table;
  o += E.crowd79(t, cam, [E.row79(680, 3, 1), E.row79(740, 4, 1), E.row79(810, 5, 1), E.row79(890, 6, 1), E.row79(980, 7, 1), E.row79(1080, 8, 1)], { cheer: 0.5 });
  return fbFrame(t, o, { t0: C.fb1, burnIn: true });
}
// 8 — "You... LOST?" smash zoom on the hero
function shotYouLost(t) {
  const sm = ease.out(seg(t, B.LOST - 0.08, B.LOST + 0.1));
  let cam = camLerp(camAt(760, 600, 1.6), camAt(755, 585, 2.25), sm);
  cam = shook(cam, t, [[B.LOST, 0.4, 10]]);
  let o = bench(t, cam, { you: { turn: 0.35, face: { name: 'shocked', eyes: { look: [0.9, -0.1] } } }, youArms: false });
  o += focusLines(960, 470, bump(t, B.LOST - 0.05, B.LOST + 0.45), 3);
  return o + drift(t, 0.3, 53, 12) + hud9(t) + whip(t, C.youLost, 1, 0.1) + E.burn(1 - seg(t, C.youLost, C.youLost + 0.25), 1);
}
// 9 — FLASHBACK: "Arm went down in two seconds." the arms, locked ... SLAM. 0:02
function shotArm(t) {
  const u = seg(t, B.down - 0.1, B.down + 0.1);
  const slam = seg(t, B.down + 0.08, B.down + 0.7);
  const ins = E.armInsert(t, u, { shake: 1 - u, slam });
  const sh = K.shake(t, B.down + 0.08, 0.5, 26);
  let o = S.g(ins.svg, `translate(${f(sh.sx)} ${f(sh.sy)}) translate(960 760) scale(1.32) translate(-960 -760)`);
  if (slam > 0 && slam < 0.5) o += K.bang('BAM!', 960 + (ins.P[0] - 960) * 1.32 + 160, 600, seg(t, B.down + 0.08, B.down + 0.2), 140, -8, E.SEP('#FFF4C8'));
  // the stopwatch stamp: 0:02
  const sk = ease.outBack(seg(t, B.two - 0.05, B.two + 0.2));
  if (sk > 0) {
    let s_ = S.rect(-190, -90, 380, 180, 24, { fill: E.SEP('#C8402A'), stroke: SEP_LINE, 'stroke-width': 8 }) + S.rect(-172, -72, 344, 144, 16, { fill: 'none', stroke: E.SEP('#FFF4C8'), 'stroke-width': 4 });
    s_ += K.T('0:02', 0, 44, 120, E.SEP('#FFF4C8'), { stroke: SEP_LINE, 'stroke-width': 6, 'paint-order': 'stroke' });
    o += S.g(s_, `translate(1500 260) rotate(-10) scale(${f(lerp(2, 1, sk))})`, sk < 1 ? { opacity: f(clamp(sk * 2, 0, 1)) } : {});
  }
  return fbFrame(t, o, { t0: C.arm, burnIn: true });
}
// 10 — FLASHBACK: "The whole town laughed." the crowd roars, young Lou grins sheepishly; BIG MIKE flexes
function shotLaugh(t) {
  const u = seg(t, C.laugh, C.night);
  const cam = camLerp(camAt(960, 430, 0.95), camAt(950, 400, 1.08), u);
  const st = E.stage79(t, cam);
  const hb = Math.abs(Math.sin(t * 9));
  let w = E.draw79(E.LOU, { x: 790, y: 566, s: 0.36, t, turn: 0.2, armR: 150, bendR: 70, armL: 12, headRot: -6 + 3 * hb, face: { name: 'joy', mouth: 'grin', fx: ['sweat', 'blush'], eyes: { type: 'happy' } } });
  w += E.draw79(E.MIKE, { x: 1150, y: 566, s: 0.36, t, turn: -0.2, armL: 96, armR: 96, bendL: 104, bendR: 104, lift: 6 * hb, face: { name: 'joy', mouth: 'bigGrin' } });
  let o = st.bg + st.stage + S.g(w, FS.camTf(cam, 1)) + st.table;
  o += E.crowd79(t, cam, [E.row79(680, 3, 1), E.row79(740, 4, 1), E.row79(810, 5, 1), E.row79(890, 6, 1), E.row79(980, 7, 1)], { cheer: 1 });
  [[300, 420, 0.1], [1600, 380, 0.35], [560, 760, 0.6], [1380, 720, 0.85], [960, 300, 1.1]].forEach(([x, y, d], i) => {
    const k = seg(t, B.laughed - 0.6 + d, B.laughed - 0.45 + d);
    if (k > 0 && t < B.laughed + 1.6 + d) o += K.bang(i % 2 ? 'HA HA!' : 'HA!', x, y, k, 90 + 20 * (i % 3), i % 2 ? 8 : -8, E.SEP('#FFF4C8'));
  });
  return fbFrame(t, o);
}
// 11 — FLASHBACK: that night, alone on the same bench under the same lamp; "I met your grandma." — cotton candy, a heart
function night79(t, o = {}) {
  const arrive = seg(t, B.met - 0.9, B.met - 0.15), sitk = ease.out(seg(t, B.met - 0.15, B.met + 0.15));
  const look = ease.inOut(seg(t, B.met - 0.2, B.grandma + 0.1));
  const sp = FS.seatPose(BS.hero, 1.0, { turn: 0.35 });
  let ch = E.draw79(E.LOU, FS.seatPose(BS.grandpa, 1.1, { turn: lerp(0, -0.4, look), headRot: lerp(-10, 2, look), face: look > 0.6 ? { name: 'happy', eyes: { look: [-0.8, 0] } } : { name: 'sad', eyes: { look: [0, 0.8] } } }));
  let gma;
  if (sitk <= 0) gma = { x: lerp(-120, BS.hero.x, arrive), y: 1000, s: 0.6, t, view: 'side', flip: true, ...AC.walk(t * 7, 1), face: 'happy' };
  else gma = { ...sp, y: lerp(1000, sp.y, sitk), legL: sp.legL * sitk, legR: sp.legR * sitk, kneeL: sp.kneeL * sitk, kneeR: sp.kneeR * sitk, armR: lerp(20, 62, sitk), t, face: { name: 'happy', eyes: { look: [0.8, -0.1] } } };
  ch += E.draw79(E.GMA, gma);
  if (sitk > 0) { const hx = gma.x + 200 * 0.58, hy = gma.y - 520 * 0.58; ch += FS.cottonCandy(hx, hy, 0.4, E.SEP('#FFB3D6'), { tone: E.TN }); }
  let g = E.bench79(t) + ch + E.benchLight79();
  g += E.heart79(960, 300, seg(t, B.grandma + 0.15, B.grandma + 0.5), 1.1);
  return g;
}
function shotNight(t) {
  const u = seg(t, C.night, C.match);
  const cam = camLerp(camAt(1100, 620, 1.25), camAt(960, 600, 1.0), u);
  return fbFrame(t, S.g(night79(t), FS.camTf(cam, 1)), { t0: C.night });
}
// 12 — "Best loss of my whole life." match cut: the same bench today
function shotMatch(t) {
  const k = ease.inOut(seg(t, C.match, C.match + 0.8));
  const cam = camLerp(BS.cams.two, camAt(960, 630, 1.22), seg(t, C.match, C.numbers));
  let o = bench(t, cam, { gpa: { turn: -0.35, face: { name: 'joy', eyes: { type: 'happy' } } }, you: { turn: 0.35, face: { name: 'happy', mouth: 'smallSmile', eyes: { look: [0.8, -0.2] } } }, youArms: false });
  o += S.g(gpaPlate(t, cam, { fade: 0.6 }), null, { opacity: f(k) });
  o += hud9(t, { dim: 0.45 * k });
  if (k < 1) {
    const camF = camLerp(camAt(960, 600, 1.0), BS.cams.two, k);
    o += S.g(S.g(night79(t), FS.camTf(camF, 1)) + E.film(t, { k: 1 }), null, { opacity: f(1 - k) });
  }
  return o;
}
// 13 — "Numbers tell you how strong somebody is." his plate: STR 79 flickers
function shotNumbers(t) {
  const cam = camLerp(camAt(1170, 520, 1.5), camAt(1175, 525, 1.68), seg(t, C.numbers, C.who));
  let o = bench(t, cam, { gpa: { face: 'happy', turn: -0.45 } });
  o += gpaPlate(t, cam, { fade: 0.35, s: 0.95, bump: bump(t, B.strong - 0.05, B.strong + 0.5) });
  return o + drift(t, 0.3, 55, 14) + hud9(t) + whip(t, C.numbers, 1, 0.08);
}
// 14 — "They don't tell you who they are." he lays a hand on his heart; the plate dissolves: just his face (1.5 s beat)
function shotWho(t) {
  const cam = camLerp(BS.cams.two, camAt(960, 640, 1.3), seg(t, C.who, C.iThink));
  const hand = seg(t, B.who - 0.35, B.who);
  const fade = seg(t, B.who, B.who + 0.9);
  let o = bench(t, cam, { gpa: { turn: -0.4, armR: 22, bendR: -128 * hand, face: { name: 'happy', eyes: { look: [-0.7, 0] } } }, gpaArms: hand <= 0,
    you: { turn: 0.35, face: { name: 'neutral', eyes: { look: [0.8, -0.2] } } }, youArms: false });
  o += gpaPlate(t, cam, { fade: lerp(0.4, 1, fade) });
  return o + drift(t, 0.3 * (1 - fade), 57, 12) + hud9(t, { dim: 0.45 }) + whip(t, C.who, -1, 0.08);
}
// 15 — "I think I stopped seeing people, Grandpa." the hero, eyes down
function shotIThink(t) {
  const cam = camLerp(camAt(760, 600, 1.6), camAt(765, 590, 1.85), seg(t, C.iThink, C.onlySaw));
  let o = bench(t, cam, { you: { turn: 0.3, headRot: -6, face: { name: 'sad', fx: ['tears'], eyes: { look: [0.2, 0.7] } } }, youArms: false });
  return o + drift(t, 0.25, 59, 10) + hud9(t) + whip(t, C.iThink, 1, 0.08);
}
// 16 — "I only saw numbers." tilt up: the sky over the bench full of numbers
function shotOnlySaw(t) {
  const u = seg(t, C.onlySaw, C.x);
  const cam = camLerp(BS.cams.two, camAt(960, 380, 0.98), u);
  let o = bench(t, cam, { you: { turn: 0.2, headRot: 6, face: { name: 'sad', eyes: { look: [0.3, -0.9] } } }, youArms: false, gpa: { turn: -0.35, face: { name: 'neutral', eyes: { look: [-0.7, 0] } } } });
  o += S.g(H.numbersFlood({ t, k: lerp(0.3, 0.6, u) + 0.1 * bump(t, B.saw, B.saw + 0.6), seed: 61, n: 50, tint: false, rect: [0, 0, 1920, 520] }), null, { opacity: 0.8 });
  return o + hud9(t) + whip(t, C.onlySaw, 'down', 0.1);
}
// 17 — "Hey. What's that little X up in the corner?" Grandpa squints and points at the top-right corner of the frame
function shotX(t) {
  const u = seg(t, C.x, C.anX);
  const cam = camLerp(camAt(960, 470, 1.02), camAt(1010, 450, 1.1), u);
  const pt = ease.outBack(seg(t, B.hey + 0.3, B.X - 0.1));
  const lean = seg(t, B.hey, B.hey + 0.5);
  let o = bench(t, cam, { gpa: { turn: -0.2, lean: -5 * lean, armR: lerp(20, 140, pt), bendR: -14 * pt, face: { name: 'confused', eyes: { look: [0.9, -0.9] } } }, gpaArms: false,
    you: { turn: 0.35, face: { name: 'confused', eyes: { look: [lerp(0.8, 0.9, pt), lerp(-0.2, -0.9, pt)] } } }, youArms: false });
  o += drift(t, 0.3 * (1 - seg(t, B.X - 0.6, B.X)), 63, 12);
  return o + hud9(t, { dim: lerp(0.5, 0.3, seg(t, B.X - 0.4, B.X)), hl: seg(t, B.X - 0.2, B.X + 0.5) }) + whip(t, C.x, -1, 0.08);
}
// 18 — "...An X?" macro of the corner: the X, huge
function shotAnX(t) {
  const u = seg(t, C.anX, C.page);
  let o = bench(t, BS.cams.up, { quiet: 0 }) + dark(0.55, '#06081A');
  const z = lerp(4.2, 4.8, ease.out(u));
  const corner = hudFrame9(t, { dim: 0.6 }) + theX(t, { hl: 1 });
  o += S.g(corner, `translate(1060 520) scale(${f(z)}) translate(-1868 -50)`);
  return o + whip(t, C.anX, 1, 0.08);
}
// 19 — "It was on page one. Of four thousand, eight hundred and twelve." that night's terms window: line 1.2, PAGE 1 / 4,812
function shotPage(t) {
  const u1 = ease.inOut(seg(t, C.page, B.pageOne + 0.5));
  const u2 = ease.inOut(seg(t, B.of - 0.2, B.of + 0.5));
  // window-local focus: first line 1.2, then the page counter
  const cx = lerp(lerp(0, -210, u1), 400, u2), cy = lerp(lerp(30, 34, u1), -48, u2), z = lerp(lerp(1.05, 2.7, u1), 2.3, u2);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#0B1030' }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#hdScanD)', opacity: 0.4 });
  let win = H.updateWindow({ k: 1, t, scroll: 0, x: 0, y: 0, s: 1 });
  // the highlighter on line 1.2
  const hl = seg(t, B.pageOne - 0.15, B.pageOne + 0.45);
  if (hl > 0) win += S.rect(-512, 18, 650 * hl, 30, 6, { fill: '#FFE14D', opacity: 0.42 });
  // a red ring around "4,812"
  const rk = seg(t, B.twelve - 0.3, B.twelve + 0.2);
  if (rk > 0) {
    const n = 24, pts = [];
    for (let i = 0; i <= Math.round(n * rk); i++) { const a = -2.6 + (i / n) * Math.PI * 2.15; pts.push(`${f(420 + Math.cos(a) * 82)} ${f(-48 + Math.sin(a) * 34)}`); }
    if (pts.length > 1) win += S.path('M' + pts.join(' L'), ln(6, '#FF3355'));
  }
  o += S.g(win, `translate(960 540) scale(${f(z)}) translate(${f(-cx)} ${f(-cy)})`);
  o += K.C.vhs(t, '', 0.45);
  o += K.TF('◀◀ THAT NIGHT', 110, 76, 30, '#FFFFFF', { 'text-anchor': 'start', 'letter-spacing': 3, opacity: 0.85 });
  return o + whip(t, C.page, 1, 0.1, '#BFD8FF');
}
// 20 — "Reality HUD... off." he reaches up and presses the X; on "off" the whole HUD shatters like glass
function hudLayer(t, o = {}) {
  let g = hud9(t, { dim: 0.5, hl: 1, press: o.press || 0 });
  g += H.systemMsg({ t, theme: 'off', text: 'REALITY HUD... OFF', k: seg(t, B.press, B.press + 0.4), y: 150, s: 0.9, type: seg(t, B.press + 0.1, B.shatter - 0.1) });
  g += drift(t, 0.3, 65, 14);
  return g;
}
function shotPress(t) {
  const u = seg(t, C.press, B.shatter);
  const cam = camLerp(camAt(770, 560, 1.55), camAt(790, 540, 1.75), u);
  const reach = ease.inOut(seg(t, B.reach, B.press));
  const quiet = seg(t, B.shatter, B.shatter + 0.8);
  let o = bench(t, cam, { quiet, you: { turn: 0.15, armR: lerp(18, 158, reach), bendR: -20 * reach, face: { name: t < B.shatter ? 'determined' : 'amazed', eyes: { look: [0.9, -0.9] } } }, youArms: false,
    gpa: { turn: -0.4, face: { name: 'happy', eyes: { look: [-0.6, -0.4] } } } });
  const age = t - B.shatter;
  const layer = hudLayer(t, { press: seg(t, B.press, B.press + 0.4) });
  if (age < 0) o += layer;
  else o += H.hudShatter({ age, svg: hudLayer(B.shatter, { press: 1 }), cx: 1868, cy: 50 });
  o += flashAt(t, B.shatter, 0.3, 0.6);
  return o;
}
// 21 — silence. No HUD. Grandpa's face. The hero blinks.
function shotClean(t) {
  const u = seg(t, C.clean, C.look);
  const cam = camLerp(camAt(960, 640, 1.18), camAt(960, 630, 1.3), u);
  const blink = bump(t, C.clean + 0.25, C.clean + 0.5);
  let o = bench(t, cam, { quiet: 1, you: { turn: 0.35, face: { name: 'amazed', blink, eyes: { look: [0.8, -0.2] } } }, youArms: false, gpa: { turn: -0.35, face: { name: 'happy', eyes: { look: [-0.7, 0] } } }, gpaArms: false });
  return o;
}
// 22 — over his shoulder: the fair, and faces — no numbers at all (hand-off to SC 10: "No numbers. Just colors...")
const FACES = [
  ['adult', 9, -760, 930, 'joy', 0.2], ['kid', 4, -630, 960, 'happy', 1.1], ['adult', 15, -470, 915, 'joy', 2.3], ['kid', 10, -330, 975, 'excited', 0.7],
  ['adult', 3, -170, 935, 'happy', 1.7], ['kid', 21, -40, 965, 'joy', 2.9], ['adult', 20, 120, 925, 'happy', 0.4],
];
function shotLook(t) {
  const u = seg(t, C.look, END);
  const cam = camLerp(camAt(-330, 690, 1.42), camAt(-300, 680, 1.52), u);
  let ppl = '';
  for (const [kind, i, x, y, face, ph] of FACES) {
    const s = E8.sAt(y), b = Math.abs(Math.sin(t * 5 + ph));
    ppl += K.draw[kind](i, { x, y, s, t, turn: (hash(i) - 0.5) * 0.8, armR: face === 'joy' ? 30 + 30 * b : 12, lift: face === 'excited' ? 10 * b : 0, bodyY: 3 * b, face: { name: face, mouth: face === 'joy' ? 'bigGrin' : undefined } });
  }
  let o = E8.fairWith(t, cam, { crowd: 1, quiet: 1, cheer: 0.2 }, E.desat(ppl, 0.62));
  // the hero from behind (foreground): he looks from face to face
  o += actor('you', t, { x: 330, y: 1400, s: 0.8, t, view: 'back', headRot: 6 * Math.sin((t - C.look) * 1.6), volume: false }, { arms: false });
  return o;
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [C.bench, shotHand], [C.story, shotBench], [C.finals, shotStory], [C.end, shotFinals], [C.lost, shotEnd], [C.fb1, shotLost], [C.youLost, shotFb1],
  [C.arm, shotYouLost], [C.laugh, shotArm], [C.night, shotLaugh], [C.match, shotNight], [C.numbers, shotMatch], [C.who, shotNumbers], [C.iThink, shotWho],
  [C.onlySaw, shotIThink], [C.x, shotOnlySaw], [C.anX, shotX], [C.page, shotAnX], [C.press, shotPage], [C.clean, shotPress], [C.look, shotClean], [Infinity, shotLook],
];
const CLOSE = new Set([shotFinals, shotEnd, shotLost, shotYouLost, shotNumbers, shotIThink, shotPress, shotLook]);
const FLASH = new Set([shotFb1, shotArm, shotLaugh, shotNight]);
const shotAt = (t) => { for (const [end, g] of SHOTS) if (t < end) return g; return shotLook; };
function scene(t) {
  const fn = shotAt(t);
  VOL_OFF = CLOSE.has(fn);
  return fn(t);
}
function look(t) {
  const fn = shotAt(t);
  if (FLASH.has(fn)) return { grade: null, vignette: 0.6 };
  if (fn === shotPage) return { grade: 'cool', vignette: 0.9 };
  if (fn === shotHand) return { grade: 'night', vignette: 1 };
  if (t >= B.shatter) return { grade: 'warm', vignette: 0.7 };
  return { grade: 'warm', vignette: 0.85 };
}

module.exports = { scene, look, TIMES: TM, CUT: C, BEATS: B };
