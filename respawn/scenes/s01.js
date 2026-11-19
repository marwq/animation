// SC 01 · COLD OPEN — RESPAWN. The hook: rapid-fire fails, each respawn done differently —
//  1) bike: "no hands" down the hill, over the bars, frozen mid-air under the full RESPAWNING 3·2·1, pop on the pad by the house;
//  2) bike again: he flies AT the camera, splats on the lens, slides down, blocks fall off the screen, fast white-flash pop (dizzy);
//  3) cafeteria: tray slip, slow-mo spaghetti onto Principal Pemberton, banner respawn, he tiptoes around the puddle;
//  4) gym: dodgeball to the face, a sports REPLAY with a corner respawn pill, pop, bullet-time one-handed catch without looking;
//  5) "Real life is just an obby": a parkour run over Main Street with STAGE ticks, he plants a checkpoint;
// then the hard switch: the same street at sunset, lagging, crowded with grey ghost copies looping his fails, the red
// SAVE FILE CORRUPTED sky window, a glitching Tip, RESPAWNS USED rolling to 9,999 (ghosts multiply with it), the sky cracks
// around a loading wheel, and a VHS rewind winds the whole cold open back to "MON 8:00 AM" (-> SC 02).
'use strict';

const K = require('./kit');
const R = require('./respawn');
const AC = require('./acting');
const SH = require('./sets_home');
const SS = require('./sets_school');
const X = require('../rig/extras');
const { draw } = require('../rig/cast');
const E = require('./s01_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, mod, at, toScr, shakeAll, frameTf, whip, smash, zoomLines, boing, impact, sweat, trail, bikeRig, failPose, ghostFail, replayFrame } = E;

const A = Array.from({ length: 8 }, (_, i) => L('01.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const END = K.V.scene('SC 02').start;
const ST = SH.SPOTS.street, TW = SH.SPOTS.town;
const standY = ST.standY;

// ================================================================= beats (all from the voice)
const tHit = w(0, 'messed');                      // the bike hits the bump
const tCr1 = w(0, 'up...');                       // mid-air crumble
const tFrz1 = tCr1 + 0.36;                        // the world pauses
const tPop1 = w(0, 'respawn?');
// 3·2·1 from "you could just", spread evenly so the digits never bunch up (elastic with the voice)
const tM0 = Math.max(tFrz1, Math.min(w(0, 'you', 1), tPop1 - 0.75)), dM = (tPop1 - 0.12 - tM0) / 3;
const marks1 = [tM0, tM0 + dM, tM0 + 2 * dM];
const tPop2 = w(1, 'Respawn.');                   // second bike fail -> fast respawn
const tCr2 = tPop2 - 0.3;
const tLens = Math.min(tCr2 - 0.14, w(1, 'bike?') + 0.12);
const tHit2 = tLens - 0.22;
const tSlip = w(1, 'spaghetti') + 0.05;
const tSplat = w(1, 'principal?');
const tCr3 = tSplat + 0.2;
const tPop3 = w(1, 'Respawn.', 1);
const tFace = w(2, 'face');
const tThrow1 = tFace - 0.55;
const tCr4 = tFace + 0.2;
const tPop4 = w(2, 'Respawn...');
const tCatch = w(2, 'catch');
const tPlant = w(3, 'checkpoints.');
const tWin = w(4, 'times?');
const t9k = w(5, 'thousand'), t9h = w(5, 'hundred...'), t99 = w(5, 'ninety-nine.');
const tLittle = w(6, 'LITTLE');
const tCrack = A[7].a;
const tRew = w(7, "Let's") - 0.1;

const CUT = {};
CUT.ride = 0;
CUT.pad1 = tPop1 - 0.12;
CUT.lens = A[1].a - 0.1;
CUT.pad2 = tCr2 + 0.22;
CUT.cafe = w(1, 'Spill') - 0.12;
CUT.gym = Math.min(w(2, 'hit') - 0.12, tFace - 0.8);
CUT.replay = Math.max(tCr4 + 0.14, w(2, 'with') - 0.05);
CUT.pop4 = tPop4 - 0.08;
CUT.easy = A[3].a - 0.12;
CUT.run = Math.min(w(3, 'Real') - 0.1, A[3].a + 0.5);
CUT.dark = A[4].a - 0.08;
CUT.tip = A[5].a - 0.12;
CUT.count = w(5, 'nine') - 0.15;
CUT.lot = w(5, "That's...") - 0.15;
CUT.okay = A[6].a - 0.1;
CUT.crack = A[7].a - 0.1;
CUT.rew = tRew;
{ // keep the cuts in order even if the real voice squeezes them
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
// rewind phases
const tRwA = CUT.rew, tRwB = Math.max(tRwA + 0.9, w(7, 'to') - 0.05), tRwC = Math.max(tRwB + 1.2, A[7].b + 0.15), tPlay = END - 0.5;

// ================================================================= shared bits
const HS = 0.34;                                  // hero scale on the street
const BUMP = ST.bump.x;
const PAD = { x: ST.checkpoint.x, y: ST.stand, s: HS };
const respawnsHUD = (t, n, tb, extra = {}) => R.counterHUD({ x: 54, y: 66, s: 0.82, t, label: 'RESPAWNS:', value: n, bump: seg(t, tb, tb + 0.45), k: seg(t, tb - 0.12, tb + 0.12), ...extra });
const street = (t, cam, o = {}) => SH.street.layers(t, cam, { time: 'morning', ...o });

// ---- the bike ride (world): approach -> bump -> endo/tumble. Returns bike + hero states at time tt.
const X0 = -1150;
function rideAt(tt, t0 = 0, tH = tHit, x0 = X0) {
  const u = clamp((tt - t0) / (tH - t0), 0, 1);
  const bx = lerp(x0, BUMP, 0.5 * u + 0.5 * u * u);
  const gy = standY(bx);
  const pitch = (Math.atan2(standY(bx + 60) - standY(bx - 60), 120) * 180) / Math.PI;
  return { bx, gy, pitch, spin: (tt - t0) * 26 };
}
// bike after the hit: endo + tumble, lands upside down at BUMP + 190
function bikeCrash(tau, s = HS) {
  const a = seg(tau, 0, 0.55);
  const rot = 200 * ease.out(a) - 20 * bump(tau, 0.55, 0.75);
  return { x: BUMP + 190 * ease.out(a), y: ST.stand - 130 * s * Math.sin(Math.PI * a), rot: Math.min(180, rot), spin: tau * 30 + 4, piv: 200 };
}
function drawBike(b, s = HS, grey = false) {
  let bike = X.bicycle({ x: 0, y: 0, s: 1, flip: true, wheelSpin: b.spin, bars: b.bars || 0 });
  if (grey) bike = R.tint(bike, 'ghost', 1);
  return S.g(bike, `translate(${f(b.x)} ${f(b.y)}) rotate(${f(b.rot)} 0 ${f(-(b.piv || 0) * s)}) scale(${f(s)})`);
}
// hero flight after the bars: ballistic from the seat (world coords), rot = forward somersault
function flight(tau, s = HS, x0 = BUMP - 64 * s, y0 = ST.stand - 82 * s) {
  const vx = 900, vy = -1000, g = 2600;
  return { x: x0 + vx * tau, y: y0 + vy * tau + 0.5 * g * tau * tau, rot: -150 * ease.out(seg(tau, 0, 0.5)) - 60 * tau };
}
const flailArms = (t) => ({ armL: 150 + 30 * Math.sin(t * 30), armR: 120 - 30 * Math.sin(t * 30 + 1), legL: 40 + 15 * Math.sin(t * 22), legR: -20 });

// ================================================================= SHOTS
// ---- 1. the ride: "What if every time you messed up..." -> over the bars -> frozen under RESPAWNING 3·2·1
function shRide(t) {
  const tw = Math.min(t, tFrz1);                  // world time (pauses at the freeze)
  const r = rideAt(Math.min(tw, tHit));
  const tau = tw - tHit;
  // camera: follows the bike, then the flight; zoom punch on the hit, slow dutch push while paused
  let tgt;
  if (tw < tHit) tgt = [r.bx + 210, r.gy - 175];
  else {
    const fl = flight(Math.min(tau, tCr1 - tHit));
    tgt = [lerp(r.bx + 210, fl.x + 100, ease.out(seg(tau, 0, 0.3))), lerp(r.gy - 175, fl.y - 190, ease.out(seg(tau, 0, 0.3)))];
  }
  const zIn = lerp(1.12, 1.32, ease.out(seg(t, 0, 0.7)));
  let zoom = zIn + 0.14 * bump(t, tHit - 0.02, tHit + 0.35) + 0.32 * ease.inOut(seg(t, tFrz1, tPop1));
  const cam = shakeAll(at(tgt[0], tgt[1], zoom), t, [[tHit, 0.35, 22], [tCr1, 0.25, 12]]);
  const Ls = street(tw, cam, { checkpoint: true });
  let w_ = '';
  // the checkpoint pad waiting by the house
  w_ += R.checkpoint({ ...PAD, t: tw, state: 'idle', part: 'back' });
  // speed lines behind him on the way down
  if (tw < tHit) {
    const k = seg(tw, 0.1, 0.5);
    for (let i = 0; i < 6; i++) {
      const yy = r.gy - (60 + 260 * hash(i * 3.1)) * HS * 2, len = (200 + 260 * hash(i)) * k, xx = r.bx - 260 - 500 * mod(hash(i * 5.3) + tw * 2.2, 1);
      w_ += S.rect(xx, yy, len, 9, 4.5, { fill: '#FFFFFF', opacity: 0.8 });
    }
  }
  // bike + rider
  const noHands = seg(tw, tHit - 0.85, tHit - 0.55);
  const cocky = tw > tHit - 0.95;
  if (tw < tHit) {
    const bk = bikeRig(tw, { x: r.bx, y: r.gy, s: HS, rot: r.pitch, spin: r.spin, pedal: tw * 14, face: cocky ? { name: 'smug', eyes: { look: [-0.6, 0.3] } } : 'excited' });
    w_ += bk.bike;
    // rider (rebuilt here to animate the arms: "look, no hands!")
    const ph = tw * 14;
    const pose = {
      x: -64, y: -82, s: 1, view: cocky ? 'front' : 'side', flip: true, turn: cocky ? -0.55 : 0, lean: cocky ? 0 : 14,
      armL: cocky ? lerp(40, 160, noHands) : 70, armR: cocky ? lerp(40, 150, noHands) : 64,
      legL: 62 + 16 * Math.sin(ph), kneeL: 74 + 26 * Math.cos(ph), legR: 62 - 16 * Math.sin(ph), kneeR: 74 - 26 * Math.cos(ph),
      face: cocky ? { name: 'smug', eyes: { look: [-0.7, 0.3] } } : { name: 'excited' }, shadow: false, volume: false, bodyY: cocky ? -10 : 0,
    };
    if (cocky) Object.assign(pose, { legL: 18, legR: 18, kneeL: 60, kneeR: 60 });
    w_ += S.g(actor('you', tw, pose, { arms: false }), `translate(${f(r.bx)} ${f(r.gy)}) rotate(${f(r.pitch)}) scale(${f(HS)})`);
  } else {
    const b = bikeCrash(tau);
    w_ += drawBike(b);
    w_ += E.impact(BUMP + 80, ST.stand - 60, seg(tw, tHit, tHit + 0.4), 0.7, '#FFE14D', 2);
    const fl = flight(tau);
    if (tw < tCr1) {
      w_ += actor('you', tw, { x: fl.x, y: fl.y, s: HS, view: 'side', flip: true, rot: fl.rot, ...flailArms(tw), face: { name: 'scream' }, shadow: false }, { arms: false });
      w_ += trail(fl.x - 40, fl.y - 470 * HS, 0.67, -0.74 + 2.6 * tau, 180, HS * 1.4);
    } else {
      const fc = flight(tCr1 - tHit);
      const ccx = fc.x, ccy = fc.y - 470 * HS;
      w_ += S.g(R.crumble({ x: fc.x, y: fc.y, s: HS, age: tw - tCr1, dir: [1, -0.3], seed: 2, floorY: fc.y + 900 }), `rotate(${f(-fc.rot)} ${f(ccx)} ${f(ccy)})`);
    }
  }
  w_ += R.checkpoint({ ...PAD, t: tw, state: 'idle', part: 'front' });
  let o = Ls.bg + Ls.mid + view(cam, w_, 1) + Ls.fg + Ls.light;
  // paused: slow dutch tilt of the frozen frame
  const dk = ease.inOut(seg(t, tFrz1, tPop1));
  if (dk > 0) o = S.g(o, frameTf(1 + 0.04 * dk, -4 * dk));
  // RESPAWNING 3·2·1 (full), digits on "you", "could", "just"
  o += R.respawnOverlay(t, { t0: tCr1 + 0.3, dur: tPop1 - 0.02 - (tCr1 + 0.3), style: 'full', reason: 'YOU FLEW OVER THE HANDLEBARS', marks: marks1 });
  // opening energy: a whip-in on the very first frames
  if (t < 0.16) { const k = 1 - t / 0.16; let d = ''; for (let i = 0; i < 14; i++) { const y = hash(i * 3.7) * 1080, len = 400 + hash(i) * 800, x = mod(hash(i * 5.1) * 2600 - t * 14000, 2600) - 400; d += `M${f(x)} ${f(y)}h${f(len)}v${f(8 + hash(i * 2.2) * 14)}h${f(-len)}Z`; } o += S.path(d, { fill: '#FFFFFF', opacity: f(0.8 * k) }); }
  return o;
}

// ---- 2. pop on the pad by the house: "...respawn?"
function shPad1(t) {
  const pa = t - tPop1;
  const cam = camKeys(t, [[CUT.pad1, at(PAD.x + 10, 770, 1.62)], [CUT.lens, at(PAD.x + 30, 760, 1.78)]]);
  const Ls = street(t, cam, { checkpoint: true });
  const b = bikeCrash(t - tHit);
  let w_ = R.checkpoint({ ...PAD, t, state: 'saved', save: seg(t, tPop1, tPop1 + 0.9), part: 'back' });
  w_ += drawBike({ ...b, spin: t * 9 });
  w_ += R.respawnPop({ ...PAD, age: pa, part: 'back' });
  const pp = R.popPose(pa, HS);
  if (!pp.hidden) {
    const look = pa < 0.38;
    const face = pa < 0.2 ? { name: 'shocked' } : look ? { name: 'amazed', eyes: { look: [0, 0.7] } } : { name: 'excited', eyes: { look: [0.2, 0.1] } };
    w_ += actor('you', t, { ...PAD, sx: pp.sx, sy: pp.sy, lift: pp.lift, turn: look ? 0 : 0.25, armL: look ? 38 : 20, armR: look ? 42 : 150 + 10 * Math.sin(t * 18), bodyY: look ? 10 : 0, face }, { arms: false });
  }
  w_ += R.respawnPop({ ...PAD, age: pa, part: 'front' }) + R.forcefield({ ...PAD, t, k: 1 - seg(t, CUT.lens - 0.3, CUT.lens) * 0.3 });
  w_ += R.checkpoint({ ...PAD, t, state: 'saved', save: seg(t, tPop1, tPop1 + 0.9), part: 'front' });
  let o = Ls.bg + Ls.mid + view(cam, w_, 1) + Ls.fg + Ls.light;
  o += respawnsHUD(t, 1, tPop1 + 0.1);
  return o;
}

// ---- 3. "Fall off your bike?" — attempt two: over the bars, AT the camera, splat on the lens, blocks slide off the screen
const LENS_CAM = at(40, 700, 1.22);
function shLens(t) {
  const r = rideAt(Math.min(t, tHit2), CUT.lens - 0.55, tHit2, -420);
  const tau = t - tHit2;
  const cam = shakeAll({ ...LENS_CAM, zoom: LENS_CAM.zoom + 0.05 * seg(t, CUT.lens, tHit2) }, t, [[tHit2, 0.3, 18]]);
  const Ls = street(t, cam, { checkpoint: true });
  let w_ = '';
  if (t < tHit2) {
    const bk = bikeRig(t, { x: r.bx, y: r.gy, s: HS, rot: r.pitch, spin: r.spin, pedal: t * 16, face: { name: 'determined' } });
    w_ += bk.bike + bk.rider;
    w_ += trail(r.bx - 120, r.gy - 200 * HS, 1, 0, 260, HS * 1.5);
  } else {
    w_ += drawBike(bikeCrash(tau));
    w_ += E.impact(BUMP + 80, ST.stand - 60, seg(t, tHit2, tHit2 + 0.4), 0.7, '#FFE14D', 5);
  }
  let o = Ls.bg + Ls.mid + view(cam, w_, 1) + Ls.fg + Ls.light;
  if (t >= tHit2) {
    // screen space: he grows toward the lens
    const [sx0, sy0] = toScr(cam, BUMP - 30, ST.stand - 60);
    const k = ease.in(seg(t, tHit2, tLens));
    const sTo = 2.35;
    const hs = lerp(HS * cam.zoom, sTo, k);
    const hit = t >= tLens;
    const slide = ease.in(seg(t, tLens + 0.05, tCr2)) * 120;
    const fx = lerp(sx0, 960, k), fy = lerp(sy0, 470 + 720 * sTo * 0.98, k) + slide;
    if (t < tCr2) {
      const sq = hit ? { sx: 1.2, sy: 0.86 } : { sx: 1, sy: 1 };
      o += actor('you', t, { x: fx, y: fy, s: hs, volume: false, rot: hit ? 4 : lerp(-30, 8, k), turn: 0, armL: hit ? 130 : 150, armR: hit ? 140 : 160, legL: 20, legR: -20, face: hit ? { name: 'oof', eyes: { type: 'x' } } : { name: 'scream' }, shadow: false, ...sq }, { arms: false });
      if (hit) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(0.16) });
    } else {
      o += R.crumble({ x: fx, y: fy, s: sTo * 0.92, age: t - tCr2, dir: [0, 0.4], seed: 9, floorY: 1500, spread: 0.45, gravity: 0.5 });
    }
    if (hit) {
      // smudge where the face hit the glass
      const u = seg(t, tLens, tLens + 0.5);
      o += S.ellipse(960, 420, 520 * (0.7 + 0.3 * u), 400 * (0.7 + 0.3 * u), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(30 * (1 - u)), opacity: f(0.7 * (1 - u)) });
      o += impact(1260, 200, seg(t, tLens, tLens + 0.3), 0.8, '#FFE14D', 3) + K.bang('SPLAT!', 1420, 190, pop(t, tLens, 0.12), 110, 12, '#FFFFFF');
      // glass crack lines from the impact
      let cr = '';
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.4, L1 = 260 + 200 * hash(i * 3.3); cr += `M${f(960 + Math.cos(a) * 60)} ${f(330 + Math.sin(a) * 60)} L${f(960 + Math.cos(a + 0.12) * L1 * 0.55)} ${f(330 + Math.sin(a + 0.12) * L1 * 0.55)} L${f(960 + Math.cos(a) * L1)} ${f(330 + Math.sin(a) * L1)} `; }
      o += S.path(cr, ln(6, '#FFFFFF', 0.85 * (1 - seg(t, tCr2, tCr2 + 0.2))));
    }
  }
  o += R.flash(0.95 * (1 - Math.abs(t - (tCr2 + 0.22)) / 0.08));
  return o;
}

// ---- 4. fast pop, dizzy, dutch angle: "Respawn."
function shPad2(t) {
  const pa = t - tPop2;
  const cam = at(PAD.x - 10, 790, 2.05 + 0.08 * seg(t, CUT.pad2, CUT.cafe));
  const Ls = street(t, cam, { checkpoint: true });
  let w_ = R.checkpoint({ ...PAD, t, state: 'saved', save: seg(t, tPop2, tPop2 + 0.9), part: 'back' });
  w_ += R.respawnPop({ ...PAD, age: pa, part: 'back' });
  const pp = R.popPose(pa, HS);
  if (!pp.hidden) {
    const wob = Math.sin(t * 9);
    w_ += actor('you', t, { ...PAD, sx: pp.sx, sy: pp.sy, lift: pp.lift, headRot: 10 * wob, lean: 4 * wob, armL: 20, armR: 24, face: { name: 'dizzy', eyes: { type: 'swirl' } } }, { arms: false });
    // orbiting stars
    for (let i = 0; i < 3; i++) {
      const a = t * 7 + (i * Math.PI * 2) / 3;
      w_ += S.path(R.star4(PAD.x + Math.cos(a) * 120 * HS * 1.6, PAD.y - 1010 * HS + Math.sin(a) * 30 * HS, 26 * HS, t * 200), { fill: '#FFE14D', stroke: '#151515', 'stroke-width': 3 });
    }
  }
  w_ += R.respawnPop({ ...PAD, age: pa, part: 'front' }) + R.forcefield({ ...PAD, t, k: 1 });
  w_ += R.checkpoint({ ...PAD, t, state: 'saved', save: seg(t, tPop2, tPop2 + 0.9), part: 'front' });
  let o = S.g(Ls.bg + Ls.mid + view(cam, w_, 1) + Ls.fg + Ls.light, frameTf(1.12, 7));
  o += respawnsHUD(t, 2, tPop2 + 0.05);
  return o;
}

// ---- 5. the cafeteria: tray slip -> slow-mo spaghetti -> SPLAT on Principal Pemberton -> banner respawn -> tiptoe
const CF = SS.SPOTS.cafeteria;
const CPAD = { x: 470, y: 960, s: 0.5 };
const SLIPX = CF.puddle.x - 10;
const PRIN_HIT = { x: 1190, y: 960, s: 0.52 };
const spagLand = [PRIN_HIT.x - 6, PRIN_HIT.y - 1010 * PRIN_HIT.s];
function cafeKids(t, shocked, tt) {
  // back + front table kids (cheap: no volume), react to the splat
  const back = [], front = [];
  const react = shocked ? (i) => ({ face: i % 2 ? 'shocked' : 'scream', armL: 120 + 20 * Math.sin(t * 20 + i), armR: 130, lift: 30 * bump(tt, tSplat + i * 0.04, tSplat + 0.35 + i * 0.04) }) : (i) => ({ face: i % 3 ? 'happy' : 'talkHappy', ...AC.breathe(t, i) });
  CF.seats.back.forEach((p, i) => { if (i < 4) back.push(K.draw.kid(3 + i * 2, { ...p, volume: false, turn: -0.4, ...react(i) })); });
  CF.seats.front.forEach((p, i) => { if (i > 0 && i < 4) front.push(K.draw.kid(10 + i * 3, { ...p, volume: false, turn: -0.5, ...react(i + 4) })); });
  return [back.join(''), front.join('')];
}
function principal(t, x, pose = {}) {
  return actor('principal', t, { x, y: PRIN_HIT.y, s: PRIN_HIT.s, volume: !(t >= tSplat - 0.06 && t < tCr3), ...pose });
}
function shCafe(t) {
  const reset = t >= tPop3 - 0.12;              // after the respawn the world rewinds to the start of the walk
  const tt = reset ? t - (tPop3 - CUT.cafe) + 0.25 : t;   // principal walk restarts (a bit further along)
  // --- camera
  let cam;
  if (!reset) {
    cam = camKeys(t, [[CUT.cafe, at(760, 690, 1.3)], [tSlip, at(900, 650, 1.36)], [tSplat - 0.4, at(1000, 610, 1.32)], [tSplat - 0.06, at(1050, 620, 1.36)], [tSplat, at(PRIN_HIT.x - 40, 520, 2.5)], [tPop3, at(PRIN_HIT.x - 60, 510, 2.75)]]);
  } else cam = camKeys(t, [[tPop3, at(640, 700, 1.45)], [CUT.gym, at(760, 690, 1.5)]]);
  shakeAll(cam, t, [[tSplat, 0.35, 16], [tSlip + 0.45, 0.25, 10]]);
  // --- principal: walks right -> left; stops and gets spaghetti'd
  const pWalk = (x0, x1, a, b) => lerp(x0, x1, seg(tt, a, b));
  let pr;
  if (!reset) {
    const px = pWalk(1660, PRIN_HIT.x, CUT.cafe, tSplat - 0.15);
    const walking = tt < tSplat - 0.15;
    const sp = ease.out(seg(t, tSplat, tSplat + 0.12));
    pr = principal(t, px, walking ? { view: 'side', ...AC.walk(tt * 7, 0.8), face: 'neutral' } : { turn: -0.2, armL: 60 + 30 * sp, armR: 70 + 30 * sp, spaghetti: sp, face: t > tSplat + 0.1 ? { name: 'angry', mouth: 'O' } : { name: 'shocked', eyes: { look: [-0.4, -0.8] } }, ...boing(t, tSplat, 0.12) });
  } else {
    const px = lerp(1380, 420, seg(t, tPop3 - 0.12, tPop3 + 2.2));
    pr = principal(t, px, { view: 'side', ...AC.walk(t * 7, 0.8), face: 'neutral' });
  }
  // --- hero
  let hero = '', fx = '';
  if (!reset) {
    if (t < tSlip) {
      const hx = lerp(CPAD.x + 120, SLIPX, seg(t, CUT.cafe, tSlip));
      hero = actor('you', t, { x: hx, y: 960, s: 0.5, view: 'side', flip: true, ...AC.walk(t * 11, 1.1), armL: 62, armR: 58, face: { name: 'happy' }, props: [{ svg: X.lunchTray({ x: -230, y: -450, s: 1.1, spaghetti: 1 }), layer: 'front' }] }, { arms: false });
      hero += K.C.musicNotes(t, hx + 40, 960 - 520);
    } else {
      const a = seg(t, tSlip, tSlip + 0.35);
      const lying = t > tSlip + 0.5;
      const x = SLIPX + 120 * ease.out(seg(t, tSlip, tSlip + 0.5));
      if (t < tCr3) {
        hero = actor('you', t, { x, y: 960, s: 0.5, view: 'side', flip: true, rot: lerp(0, 88, ease.out(a)), rotY: -260, lift: 150 * Math.sin(Math.PI * seg(t, tSlip, tSlip + 0.5)), legL: lerp(0, 70, a), legR: lerp(0, 40, a), kneeL: 10, kneeR: 10, armL: lerp(60, 160, a), armR: lerp(60, 140, a), face: lying ? { name: 'dizzy' } : { name: 'scream' }, ...boing(t, tSlip + 0.5, 0.15) }, { arms: false });
      } else {
        fx += R.crumble({ x: x - 240, y: 960 - 10, s: 0.5, age: t - tCr3, dir: [0.9, -0.9], spread: 1.3, seed: 11, floorY: 960, life: 0.9 });
      }
      fx += K.C.dust(x - 80, 960, tSlip + 0.48, t);
      // tray + spaghetti in slow motion
      const fu = seg(t, tSlip + 0.05, tSplat);
      const p0 = [SLIPX + 150, 960 - 500], p1 = spagLand;
      const sx = lerp(p0[0], p1[0], fu), sy = lerp(p0[1], p1[1], fu) - 330 * Math.sin(Math.PI * fu);
      const trayU = seg(t, tSlip + 0.05, tSlip + 0.75);
      const trx = lerp(p0[0], p0[0] + 200, trayU), try_ = lerp(p0[1], 960 - 16, trayU) - 300 * Math.sin(Math.PI * trayU);
      fx += X.lunchTray({ x: trx, y: Math.min(try_, 944), s: 0.55, rot: trayU < 1 ? 540 * trayU : 540 - 6 * bump(t, tSlip + 0.75, tSlip + 0.95), spaghetti: 0 });
      if (t < tSplat) fx += X.spaghetti({ x: sx, y: sy, s: 0.7, rot: 300 * fu, mode: 'fly', k: 0.2 + 0.6 * fu, t, seed: 4 });
      else fx += X.spaghetti({ x: PRIN_HIT.x + 180, y: 965, s: 0.55, mode: 'splat', seed: 6 });
      // the milk carton flips away
      fx += S.g(S.path('M-16 30 L-16 -30 L-6 -44 L14 -44 L24 -30 L24 30 Z', ol('#FFFFFF', 4)) + S.rect(-12, -14, 32, 22, 3, { fill: '#3B82F6' }), tf(lerp(p0[0], p0[0] - 260, fu), Math.min(940, p0[1] - 200 * Math.sin(Math.PI * fu * 1.2) + 500 * fu * fu), 1, 400 * fu));
      if (t >= tSplat) {
      }
    }
  } else {
    // respawned on the pad: tiptoe around the puddle, polite bow to the principal
    const pa = t - tPop3;
    const pp = R.popPose(pa, 0.5);
    const u = seg(t, tPop3 + 0.28, CUT.gym + 0.1);
    const hx = lerp(CPAD.x, CPAD.x + 360, u), hy = 960 - 70 * Math.sin(Math.PI * clamp(u * 1.3, 0, 1));
    if (!pp.hidden) {
      const tip = u > 0;
      hero = actor('you', t, { x: hx, y: hy, s: 0.5 - 0.03 * Math.sin(Math.PI * clamp(u * 1.3, 0, 1)), sx: pp.sx, sy: pp.sy, lift: pp.lift + (tip ? 18 * Math.abs(Math.sin(t * 12)) : 0), view: tip ? 'side' : 'front', flip: true, ...(tip ? { legL: 30 * Math.sin(t * 12), legR: -30 * Math.sin(t * 12), kneeL: 50, kneeR: 50, armL: 110, armR: 70, lean: -6 } : { armL: 14, armR: 14 }), face: { name: 'nervous', eyes: { look: [0.6, 0.5] } }, props: [{ svg: X.lunchTray({ x: tip ? -230 : 0, y: tip ? -450 : -330, s: 1.1, spaghetti: 1 }), layer: 'front' }] }, { arms: false });
    }
    fx += R.respawnPop({ ...CPAD, age: pa, part: 'front' }) + (pa > 0 ? R.forcefield({ x: hx, y: hy, s: 0.5, t, k: 1 - seg(pa, 0.6, 1.2) }) : '');
  }
  const padB = (reset ? R.respawnPop({ ...CPAD, age: t - tPop3, part: 'back' }) : '') + R.checkpoint({ ...CPAD, t, state: 'saved', save: reset ? seg(t, tPop3, tPop3 + 0.9) : 1, part: 'back' });
  const padF = R.checkpoint({ ...CPAD, t, state: 'saved', part: 'front' });
  const [bk, fr] = cafeKids(t, !reset && t >= tSplat, tt);
  const lady = actor('kid', t, { i: 21, ...CF.lunchLady, volume: false, turn: 0.3, face: !reset && t > tSplat ? 'shocked' : 'happy' });
  let o = SS.cafeteria.compose(t, { puddle: 1 }, [lady, bk, fr], padB + pr + hero + padF + fx, cam);
  if (!reset && t >= tSplat) o += K.bang('SPLAT!', 1480, 250, pop(t, tSplat, 0.2) * (1 - seg(t, tPop3 - 0.25, tPop3 - 0.1)), 120, 10, '#FFD21F') + impact(1180, 330, seg(t, tSplat, tSplat + 0.3), 1, '#FFD21F', 4);
  // slow-mo streaks while the spaghetti flies
  const sm = !reset ? bump(t, tSlip + 0.1, tSplat) : 0;
  if (sm > 0) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#9FD8FF', opacity: f(0.12 * sm) }) + TFS('SLOW-MO', 1780, 110, 44, '#FFFFFF', { opacity: f(sm), 'text-anchor': 'end' });
  // banner respawn: "SPAGHETTI INCIDENT"
  if (!reset) o += R.respawnOverlay(t, { t0: tCr3 + 0.04, dur: Math.max(0.3, tPop3 - 0.04 - (tCr3 + 0.04)), style: 'banner', y: 800, reason: 'SPAGHETTI INCIDENT' });
  if (reset) o += respawnsHUD(t, 3, tPop3 + 0.05);
  o += smash(t, tSplat, 0.12, 0.6) + smash(t, tPop3 - 0.12, 0.12, 0.8);
  return o;
}

// ---- 6. the gym: dodgeball to the face -> REPLAY (corner respawn) -> pop -> bullet-time catch without looking
const GY = SS.SPOTS.gym;
const DOD = { x: GY.dodge.x, y: 960, s: 0.5 };
const THR = GY.throwers[1];
const COACH = { x: 1840, y: 820, s: 0.44 };
const TEAM = { x: 1080, y: 905, s: 0.46 };
const faceP = [DOD.x - 36, DOD.y - 735 * DOD.s];
function gymKids(t, mood) {
  let o = '';
  GY.throwers.forEach((p, i) => {
    if (i === 1) return;
    o += K.draw.kid(5 + i * 4, { ...p, volume: false, view: 'side', flip: true, ...AC.breathe(t, i), armL: 30, armR: 40, face: mood });
  });
  o += K.draw.kid(14, { ...TEAM, volume: false, turn: 0.3, face: mood === 'amazed' ? 'amazed' : 'nervous', armL: 30, armR: 30 });
  return o;
}
function thrower(t, tThrow, tBonk = Infinity) {
  const wind = seg(t, tThrow - 0.35, tThrow), fol = seg(t, tThrow, tThrow + 0.2);
  if (t >= tBonk) {
    const k = ease.out(seg(t, tBonk, tBonk + 0.35));
    return K.draw.kid(2, { ...THR, volume: false, view: 'side', flip: true, rot: 80 * k, rotY: -200, lift: 60 * bump(t, tBonk, tBonk + 0.4), armL: 150, armR: 120, legL: 40, legR: 10, face: { name: 'oof', eyes: { type: 'x' } } });
  }
  return K.draw.kid(2, { ...THR, volume: false, view: 'side', flip: true, armL: lerp(lerp(20, -70, ease.out(wind)), 110, ease.out(fol)), armR: -20, lean: lerp(lerp(0, -10, wind), 14, fol), legL: 20 * fol, legR: -14 * fol, face: 'determined' });
}
const gymCompose = (t, cam, chars, o = {}) => SS.gym.compose(t, { scoreboard: ['HOME', '03', 'GUEST', '05'], ...o }, [], chars, cam);
function ballPos(t, tThrow, tArr, slow = false) {
  const u = seg(t, tThrow, tArr);
  const p0 = [THR.x + 120, THR.y - 520 * THR.s];
  return [lerp(p0[0], faceP[0] - 60, u), lerp(p0[1], faceP[1], u) - (slow ? 60 : 30) * Math.sin(Math.PI * u), u];
}
function gymHit(tt, camOverride) {
  // the first ball (world time tt), used live and in the replay
  const tThrow = tThrow1;
  const hitK = tt >= tFace;
  const cam = camOverride || shakeAll(camKeys(tt, [[CUT.gym, at(1150, 700, 1.25)], [tFace - 0.25, at(1250, 680, 1.32)], [tFace, at(1400, 640, 1.75)]]), tt, [[tFace, 0.3, 20]]);
  let ch = gymKids(tt, hitK ? 'shocked' : 'happy') + thrower(tt, tThrow);
  ch += actor('coach', tt, { ...COACH, volume: false, whistle: hitK ? 'chest' : 'mouth', face: hitK ? 'shocked' : undefined, armL: 20, armR: 20 });
  let fx = '';
  if (tt < tCr4) {
    const sn = hitK ? ease.out(seg(tt, tFace, tFace + 0.12)) : 0;
    ch += actor('you', tt, { ...DOD, turn: hitK ? -0.1 : 0.35, headRot: -26 * sn, lean: -10 * sn, rot: 10 * sn, rotY: -100, armL: 20 + 60 * sn, armR: 20 + 70 * sn, face: hitK ? { name: 'oof', eyes: { type: 'x' } } : { name: 'smug', eyes: { look: [0.8, 0.1] } }, ...boing(tt, tFace, 0.12) }, { arms: false });
  } else fx += R.crumble({ ...DOD, age: tt - tCr4, dir: [0.9, -0.35], seed: 21, life: 1.2 });
  const [bx, by] = ballPos(tt, tThrow, tFace);
  if (tt >= tThrow - 0.02 && tt < tFace) fx += trail(bx, by, 1, 0, 200, 0.6) + X.dodgeball({ x: bx, y: by, s: 0.5, rot: tt * 400 });
  if (hitK) {
    const v = seg(tt, tFace, tFace + 0.9);
    fx += X.dodgeball({ x: faceP[0] - 60 - 520 * v, y: faceP[1] - 260 * Math.sin(Math.PI * v) + 380 * v * v, s: 0.5, rot: -tt * 500, squash: 0.55 * (1 - seg(tt, tFace, tFace + 0.1)) });
    fx += impact(faceP[0] - 150, faceP[1] - 10, seg(tt, tFace, tFace + 0.3), 0.5, '#FFE14D', 7);
    fx += K.bang('BONK!', faceP[0] - 260, faceP[1] - 120, pop(tt, tFace, 0.16) * (1 - seg(tt, tFace + 0.5, tFace + 0.6)), 100, -12, '#FFE14D');
  }
  return { cam, svg: gymCompose(tt, cam, ch + fx) };
}
function shGym(t) {
  return gymHit(t).svg;
}
function shReplay(t) {
  // slow-motion replay of the hit, telestrator circle on the ball; corner pill counts 3·2·1
  const u = seg(t, CUT.replay, CUT.pop4);
  const tt = lerp(tFace - 0.32, tFace + 0.08, u);
  const cam = at(1330, 600, 2.15 + 0.15 * u);
  const H_ = gymHit(tt, cam);
  let o = H_.svg;
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#203050', opacity: 0.12 });
  const [bx, by] = ballPos(tt, tThrow1, tFace);
  if (tt < tFace) {
    const [sx, sy] = toScr(cam, bx, by);
    const dk = seg(t, CUT.replay + 0.05, CUT.replay + 0.4);
    o += S.path(`M${f(sx - 80)} ${f(sy)} a80 80 0 1 1 ${f(160 * dk)} ${f(-6 * dk)}`, ln(10, '#FFE14D')) + TFS('BALL', sx - 40, sy - 110, 48, '#FFE14D', { opacity: f(dk) });
    const [fx_, fy_] = toScr(cam, faceP[0] + 20, faceP[1]);
    o += S.path(`M${f(sx + 90)} ${f(sy + 20)} L${f(lerp(sx + 90, fx_ - 120, dk))} ${f(lerp(sy + 20, fy_ + 10, dk))}`, { ...ln(10, '#FFE14D'), 'stroke-dasharray': '24 18' }) + TFS('FACE', fx_ + 10, fy_ - 160, 48, '#FFE14D', { opacity: f(seg(t, CUT.replay + 0.3, CUT.replay + 0.5)) });
  }
  o += replayFrame(t, seg(t, CUT.replay, CUT.replay + 0.15));
  o += R.respawnOverlay(t, { t0: CUT.replay + 0.05, dur: CUT.pop4 - CUT.replay - 0.05, style: 'corner', x: 1880, y: 150 });
  return o + smash(t, CUT.replay, 0.1, 0.7);
}
const tBack = Math.min(A[2].b + 0.12, CUT.easy - 0.75);   // he flips the ball back without looking -> bonks the thrower
const tBonk = tBack + 0.42;
function shCatch(t) {
  // pop at the dodge spot, then bullet time: the ball comes back, he catches it without looking; then tosses it back (BONK)
  const pa = t - tPop4;
  const tThrow = Math.max(tPop4 + 0.35, tCatch - 0.75);
  const slow = seg(t, tPop4 + 0.3, tPop4 + 0.6) * (1 - seg(t, tCatch + 0.5, tCatch + 0.9));
  const caught = t >= tCatch, tossed = t >= tBack;
  const cam = shakeAll(camKeys(t, [[CUT.pop4, at(1150, 690, 1.22)], [tThrow, at(1250, 670, 1.3)], [tCatch - 0.05, at(1380, 640, 1.55)], [tCatch + 0.08, at(1380, 600, 2.05)], [tBack - 0.08, at(1395, 595, 2.15)], [tBack + 0.22, at(960, 690, 1.08)], [CUT.easy, at(930, 690, 1.12)]]), t, [[tBonk, 0.3, 12]]);
  let ch = gymKids(t, caught ? 'amazed' : 'determined') + thrower(t, tThrow, tBonk);
  ch += actor('coach', t, { ...COACH, volume: false, whistle: caught ? 'chest' : 'mouth', face: tossed ? (t > tBonk ? { name: 'shocked' } : 'amazed') : caught ? 'amazed' : 'neutral', armL: caught ? 40 : 20, armR: caught ? 40 : 20 });
  let fx = '';
  const pp = R.popPose(pa, 0.5);
  fx += R.checkpoint({ ...DOD, t, state: 'saved', save: seg(t, tPop4, tPop4 + 0.9), part: 'back' }) + R.respawnPop({ ...DOD, age: pa, part: 'back' });
  const reach = caught ? 1 : ease.outBack(seg(t, tCatch - 0.2, tCatch));
  let cAng = lerp(14, 98, reach);
  if (tossed) cAng = lerp(lerp(98, 70, ease.out(seg(t, tBack - 0.12, tBack))), 140, ease.out(seg(t, tBack, tBack + 0.14)));
  if (!pp.hidden) {
    fx += actor('you', t, { ...DOD, sx: pp.sx, sy: pp.sy, lift: pp.lift, turn: 0.4, headRot: 4, armL: cAng, armR: 12, face: caught ? { name: 'smug', eyes: { look: [0.85, 0], upper: 0.35 }, fx: t > tCatch + 0.3 ? ['sparkles'] : [] } : { name: 'smug', eyes: { look: [0.85, 0.1], upper: 0.3 } } }, { arms: false });
  }
  fx += R.respawnPop({ ...DOD, age: pa, part: 'front' }) + (pa > 0 ? R.forcefield({ ...DOD, t, k: 1 - seg(pa, 0.8, 1.5) }) : '');
  fx += R.checkpoint({ ...DOD, t, state: 'saved', part: 'front' });
  // the ball: slow flight, held in the outstretched left hand, then flipped back to the thrower's face
  const hand = AC.hand(98, -1);
  const hx = DOD.x + hand[0] * DOD.s - 20, hy = DOD.y + hand[1] * DOD.s - 6;
  const thF = [THR.x + 30, THR.y - 740 * THR.s];
  if (t >= tThrow && !caught) {
    const u = seg(t, tThrow, tCatch);
    const p0 = [THR.x + 120, THR.y - 520 * THR.s];
    const bx = lerp(p0[0], hx, u), by = lerp(p0[1], hy, u) - 80 * Math.sin(Math.PI * u);
    fx += trail(bx, by, 0.98, -0.1, 340, 0.8, '#FFFFFF', 5) + X.dodgeball({ x: bx, y: by, s: 0.5, rot: t * 160 });
  } else if (caught && !tossed) fx += X.dodgeball({ x: hx - 10 * (1 - seg(t, tCatch, tCatch + 0.1)), y: hy, s: 0.5, rot: (t - tCatch) * 300, squash: 0.35 * (1 - seg(t, tCatch, tCatch + 0.12)) });
  else if (tossed) {
    if (t < tBonk) {
      const u = seg(t, tBack, tBonk);
      const bx = lerp(hx, thF[0], u), by = lerp(hy, thF[1], u) - 140 * Math.sin(Math.PI * u);
      fx += trail(bx, by, -1, 0, 260, 0.7) + X.dodgeball({ x: bx, y: by, s: 0.5, rot: -t * 700 });
    } else {
      const v = seg(t, tBonk, tBonk + 0.8);
      fx += X.dodgeball({ x: thF[0] + 300 * v, y: thF[1] - 220 * Math.sin(Math.PI * v) + 300 * v * v, s: 0.5, rot: t * 500, squash: 0.5 * (1 - seg(t, tBonk, tBonk + 0.1)) });
      fx += impact(thF[0] + 40, thF[1], seg(t, tBonk, tBonk + 0.35), 0.7, '#FFE14D', 9);
    }
  }
  let o = gymCompose(t, cam, ch + fx, { slowmo: slow });
  if (caught) o += zoomLines(...toScr(cam, hx, hy), bump(t, tCatch, tCatch + 0.35), t, '#FFFFFF', 20, 220) + K.bang('CATCH!', 1400, 220, pop(t, tCatch, 0.2) * (1 - seg(t, tCatch + 0.7, tCatch + 0.85)), 110, 8, '#7CFF6B');
  if (t >= tBonk) { const [bxs, bys] = toScr(cam, thF[0], thF[1]); o += K.bang('BONK!', bxs + 60, bys - 160, pop(t, tBonk, 0.16) * (1 - seg(t, CUT.easy - 0.15, CUT.easy)), 90, -8, '#FFE14D'); }
  o += respawnsHUD(t, 4, tPop4 + 0.05);
  return o + smash(t, tPop4 - 0.08, 0.12, 0.85) + smash(t, tCatch, 0.08, 0.35);
}

// ---- 7. "Easy." close-up: ball spinning on his finger, coach + kids gawp behind
function shEasy(t) {
  const u = seg(t, CUT.easy, CUT.run);
  const cam = at(1500 - 30 * u, 560, 2.3 + 0.12 * u);
  let ch = gymKids(t, 'amazed') + K.draw.kid(2, { ...THR, volume: false, view: 'side', flip: true, armL: 20, armR: 10, face: 'shocked' });
  ch += actor('coach', t, { ...COACH, volume: false, face: { name: 'shocked' }, armL: 30, armR: 140 });
  const hand = AC.hand(140, 1);
  const hx = DOD.x + hand[0] * DOD.s, hy = DOD.y + hand[1] * DOD.s - 40;
  ch += actor('you', t, { ...DOD, turn: 0.3, armL: 14, armR: 140, volume: false, face: { name: 'smug', eyes: { look: [-0.5, 0.1], upper: 0.4 } } }, { arms: false, energy: 1.2 });
  ch += X.dodgeball({ x: hx, y: hy, s: 0.5, rot: t * 900 }) + S.path(`M${f(hx - 46)} ${f(hy - 44)} q46 -22 92 0`, ln(5, '#FFFFFF', 0.8)) + S.path(`M${f(hx - 40)} ${f(hy + 40)} q40 18 80 0`, ln(5, '#FFFFFF', 0.6));
  return gymCompose(t, cam, ch);
}

// ---- 8. "Real life is just an obby... with checkpoints." parkour over Main Street (town, day)
const BEN = TW.bench, BUS = TW.busRoof;
const FLAGX = 2160, TS_ = 0.26;
const PK = (() => {
  const t0 = CUT.run, tW = Math.max(w(3, 'with'), t0 + 1.6);
  return { t0, tL: lerp(t0, tW, 0.22), tJ: lerp(t0, tW, 0.47), tO: lerp(t0, tW, 0.74), tW, tP: Math.max(tPlant, tW + 0.2) };
})();
// hero path: run -> hop on the bench -> leap on the bus roof -> run -> front-flip off -> land -> plant
function parkour(t) {
  const { t0, tL, tJ, tO, tW } = PK;
  const benchY = BEN.y - 46, busY = BUS.y;
  if (t < tL - 0.18) { const x = lerp(560, BEN.x - 150, seg(t, t0, tL - 0.18)); return { x, y: 990, mode: 'run', ph: t * 15 }; }
  if (t < tL + 0.12) { const u = seg(t, tL - 0.18, tL + 0.12); return { x: lerp(BEN.x - 150, BEN.x - 20, u), y: lerp(990, benchY, u) - 130 * Math.sin(Math.PI * u), mode: 'jump', u }; }
  if (t < tJ - 0.1) { const u = seg(t, tL + 0.12, tJ - 0.1); return { x: lerp(BEN.x - 20, BEN.x + 60, u), y: benchY, mode: 'run', ph: t * 15, stage: 1 }; }
  if (t < tJ + 0.32) { const u = seg(t, tJ - 0.1, tJ + 0.32); return { x: lerp(BEN.x + 60, BUS.x0 + 70, u), y: lerp(benchY, busY, u) - 150 * Math.sin(Math.PI * u), mode: 'jump', u, stage: 1 }; }
  if (t < tO) { const u = seg(t, tJ + 0.32, tO); return { x: lerp(BUS.x0 + 70, BUS.x1 - 40, u), y: busY, mode: 'run', ph: t * 16, stage: 2 }; }
  if (t < tW) { const u = seg(t, tO, tW); return { x: lerp(BUS.x1 - 40, FLAGX - 110, u), y: lerp(busY, 990, u) - 200 * Math.sin(Math.PI * u), mode: 'flip', u, stage: 2 }; }
  return { x: FLAGX - 110, y: 990, mode: 'land', u: seg(t, tW, tW + 0.25), stage: 3 };
}
function stagePill(x, y, n, k, t) {
  if (k <= 0) return '';
  const g = S.rect(-120, -34, 240, 68, 20, ol('#1C2340', 6)) + S.rect(-120, -34, 240, 14, 7, { fill: '#5B6BFF', opacity: 0.6 }) + TF('STAGE ' + n, -18, 14, 36, '#FFFFFF') + S.circle(84, 0, 22, ol('#3DDC84', 4)) + S.path('M72 1 L82 11 L98 -10', ln(6, '#FFFFFF'));
  return S.g(g, `translate(${f(x)} ${f(y - 30 * k)}) scale(${f(ease.outBack(clamp(k * 1.6, 0, 1)) * 0.9)})`, { opacity: f(clamp(2 - k * 2, 0, 1)) });
}
function townDay(t, cam, chars, o = {}) {
  const Lt = SH.town.layers(t, cam, { time: 'day', ...o });
  return Lt.bg + Lt.mid + view(cam, chars, 1) + Lt.fg + Lt.light;
}
function shRun(t) {
  const p = parkour(t);
  const cx = clamp(p.x + 220, 900, FLAGX + 40);
  const cam = camKeys(t, [[CUT.run, at(820, 790, 1.8)], [PK.tL, at(BEN.x, 770, 1.75)], [PK.tJ, at(BEN.x + 280, 700, 1.62)], [PK.tO, at(BUS.x + 180, 690, 1.58)], [PK.tW, at(FLAGX - 60, 770, 1.7)], [CUT.dark, at(FLAGX - 60, 780, 1.72)]]);
  void cx;
  let ch = '';
  // flag + save
  const plant = seg(t, PK.tP - 0.12, PK.tP + 0.88);
  if (t >= PK.tP - 0.12) ch += R.checkpoint({ x: FLAGX, y: 990, s: TS_, t, state: 'saved', save: seg(t, PK.tP, PK.tP + 1), part: 'back', pole: false, flag: false });
  if (t >= PK.tP - 0.12) ch += R.flag({ x: FLAGX + 30, y: 990, s: TS_ * 1.3, t, plant, state: 'saved' });
  // hero
  let pose;
  if (p.mode === 'run') pose = { view: 'side', flip: true, ...AC.run(p.ph, 1.1), lean: 10, face: { name: 'excited' } };
  else if (p.mode === 'jump') pose = { view: 'side', flip: true, legL: 50, legR: -30, kneeL: 70, kneeR: 40, armL: 150, armR: 120, lean: 12, face: { name: 'excited' } };
  else if (p.mode === 'flip') pose = { view: 'side', flip: true, rot: -360 * ease.inOut(p.u), legL: 70, legR: 60, kneeL: 100, kneeR: 100, armL: 60, armR: 50, face: { name: 'joy' } };
  else {
    const pl = t >= PK.tP - 0.2;
    pose = { turn: 0.35, bodyY: 40 * bump(t, PK.tW, PK.tW + 0.3), armL: pl ? 20 : 60, armR: pl ? 60 + 30 * ease.out(seg(t, PK.tP - 0.2, PK.tP)) : 60, face: pl ? { name: 'smug', eyes: { look: [0.6, 0.1] } } : { name: 'joy' }, ...boing(t, PK.tW, 0.18) };
  }
  const flagHand = p.mode !== 'land' || t < PK.tP - 0.12;
  if (flagHand) pose.props = [{ svg: R.flag({ x: 0, y: -420, s: 0.95, rot: p.mode === 'flip' ? 20 : 30, t, grip: 0.3, wave: 1.4 }), layer: 'back' }];
  ch += actor('you', t, { x: p.x, y: p.y, s: TS_, ...pose }, { arms: false, energy: 1.2 });
  // stage ticks pop above the obstacles
  ch += stagePill(BEN.x, BEN.y - 360, 1, seg(t, PK.tL + 0.1, PK.tL + 1.1), t);
  ch += stagePill(BUS.x, BUS.y - 380, 2, seg(t, PK.tJ + 0.3, PK.tJ + 1.3), t);
  ch += stagePill(FLAGX - 110, 990 - 420, 3, seg(t, PK.tW + 0.05, PK.tW + 1.05), t);
  if (p.mode === 'land') ch += K.C.dust(p.x - 60, 990, PK.tW, t);
  let o = townDay(t, cam, ch);
  const [fsx] = toScr(cam, FLAGX, 990);
  o += R.saveWave(seg(t, PK.tP + 0.02, PK.tP + 0.85), { x: fsx });
  o += R.savedToast(60, 880, seg(t, PK.tP + 0.05, PK.tP + 0.45), { t, out: seg(t, CUT.dark - 0.35, CUT.dark - 0.05) });
  o += whip(t, CUT.run, 1);
  return o;
}

// ================================================================= the corrupted town
// ghost crowd: fixed lists per depth row; each ghost loops one fail with its own period + phase
const KINDS = ['slip', 'ball', 'skate', 'bike', 'trip', 'flail', 'stairs', 'facepalm'];
const ROWS = [
  { k: 0.25, s: 0.065, y: TW.street[3].y, n: 30, x0: -600, x1: 2600 },
  { k: 0.42, s: 0.11, y: TW.street[2].y, n: 32, x0: -700, x1: 2800 },
  { k: 0.68, s: 0.17, y: TW.street[1].y, n: 26, x0: -700, x1: 3100 },
  { k: 1, s: 0.26, y: 990, n: 10, x0: -400, x1: 3300 },
];
const CROWD = ROWS.map((r, ri) => {
  const list = [];
  for (let i = 0; i < r.n; i++) {
    const h1 = hash(i * 3.3 + ri * 17), h2 = hash(i * 7.1 + ri * 5), h3 = hash(i * 1.7 + ri * 11);
    list.push({ x: lerp(r.x0, r.x1, (i + 0.5 * h1) / r.n), dy: (h2 - 0.5) * 14 * (r.s / 0.1), kind: KINDS[Math.floor(h3 * KINDS.length)], per: 1.3 + 1.4 * h2, ph: h1, order: h2 });
  }
  return list;
});
// roof ghosts (stand on SPOTS.town.roofs)
const ROOFG = TW.roofs.map((a, i) => ({ ...a, kind: KINDS[(i * 3) % KINDS.length], per: 1.5 + hash(i) * 1.2, ph: hash(i * 2.3) }));
// shown(): fraction of the crowd visible (the counter grows it)
function crowdSvg(t, cam, frac = 1, freeze = null, lag = 0, opt = {}) {
  const { rows = [0, 1, 2, 3], alpha = 0.62, haze = 0, skip = null } = opt;
  let o = '';
  ROWS.forEach((r, ri) => {
    if (!rows.includes(ri)) return;
    const poses = [];
    // cull to the visible x range of this row's parallax layer
    const z = 1 + ((cam.zoom ?? 1) - 1) * r.k, fx = cam.fx ?? 960;
    const vx0 = (-60 - fx - (cam.sx || 0)) / z + fx + (cam.x || 0) * r.k - 320 * r.s, vx1 = (1980 - fx - (cam.sx || 0)) / z + fx + (cam.x || 0) * r.k + 320 * r.s;
    CROWD[ri].forEach((g, i) => {
      if (g.order > frac || g.x < vx0 || g.x > vx1) return;
      if (skip && ri === 3 && Math.abs(g.x - skip) < 520) return;
      let tt = freeze !== null ? freeze : t;
      if (lag > 0) tt = R.freezeT(tt, { every: 0.9 + g.ph, hold: 0.35 * lag, seed: i + ri * 40 });
      const u = mod(tt / g.per + g.ph, 1);
      const P = failPose(g.kind, u);
      poses.push({ x: g.x + (g.kind === 'trip' ? lerp(-60, 60, u) : 0) * r.s * 4, y: r.y + g.dy, s: r.s, ...P });
    });
    if (ri === 1 || ri === 2) ROOFG.forEach((g, i) => {
      if (Math.abs(g.k - r.k) > 0.01 || hash(i * 9.9) > frac || g.x < vx0 || g.x > vx1) return;
      const tt = freeze !== null ? freeze : t;
      poses.push({ x: g.x, y: g.y, s: g.s, ...failPose(g.kind, mod(tt / g.per + g.ph, 1)) });
    });
    // all rows share ONE translucent group (one offscreen layer instead of one per row); the haze sits after the far rows
    if (haze > 0 && ri === 2) { o += S.rect(0, 0, 1920, 1080, 0, { fill: '#3A0614', opacity: f(haze / alpha) }); }
    o += view(cam, draw.ghostCrowd(poses, { alpha: 1 }), r.k);
  });
  return S.g(o, null, { opacity: f(alpha) });
}
// the hero standing at his (now red) flag in the corrupted street; close full ghosts around him
function nearGhosts(t, freeze = null, close = false) {
  const tt = freeze !== null ? freeze : t;
  const G = close ? [
    ['slip', 2470, 990, 0.26, 1.7, 0.5, true],
    ['bike', 1560, 990, 0.26, 2.1, 0.1, false],
    ['skate', BUS.x - 120, BUS.y, 0.26, 1.9, 0.7, false],
  ] : [
    ['bike', 1500, 990, 0.26, 2.1, 0.1, false],
    ['slip', 2480, 990, 0.26, 1.7, 0.5, true],
    ['skate', BUS.x - 120, BUS.y, 0.26, 1.9, 0.7, false],
    ['flail', BEN.x, BEN.y - 46, 0.26, 1.3, 0.2, false],
  ];
  let o = '';
  for (const [k, x, y, s, per, ph, fl] of G) o += ghostFail(k, tt, mod(tt / per + ph, 1), { x, y, s, flip: fl, alpha: 0.6 });
  return o;
}
function townRed(t, cam, o = {}) {
  return SH.town.layers(o.tm ?? t, cam, { time: 'sunset', ...o });
}
const WIN = { x: 960, y: 250, w: 1180, h: 400 };
function redWindow(t, k, glitch = 0.15, scale = 1, dx = 0, dy = 0) {
  return R.sysWindow({ x: WIN.x + dx, y: WIN.y + dy, w: WIN.w * scale, h: WIN.h * scale, k, open: 'crt', t, theme: 'red', title: 'WARNING', lines: ['SAVE FILE CORRUPTED', 'Respawns used: 9,999'], small: 'Too many respawns. The world may lag.', glitch: glitch + 0.5 * (hash(Math.floor(t * 8) * 1.37) < 0.12 ? 1 : 0) });
}
const heroAtFlag = (t, pose = {}, act = {}) => actor('you', t, { x: FLAGX - 110, y: 990, s: TS_, ...pose }, act);
const redFlag = (t) => R.flag({ x: FLAGX + 30, y: 990, s: TS_ * 1.3, t, state: 'red' });

// ---- 9. the hard switch: same framing, sunset, lag, ghosts everywhere; pull back; the red window opens on "times?"
function shDark(t) {
  const u = seg(t, CUT.dark, tWin);
  const cam = camKeys(t, [[CUT.dark, at(FLAGX - 60, 780, 1.72)], [CUT.dark + 0.5, at(FLAGX - 80, 770, 1.6)], [tWin - 0.1, { zoom: 0.74, x: 520, y: 40 }], [CUT.tip, { zoom: 0.72, x: 500, y: 30 }]], ease.inOut);
  shakeAll(cam, t, [[tWin, 0.5, 14]]);
  const red = 0.25 + 0.7 * ease.inOut(seg(t, tWin - 0.2, tWin + 0.5));
  const Lt = townRed(t, cam, { red, frozen: 0.25 });
  let o = Lt.bg + Lt.mid;
  o += crowdSvg(t, cam, 0.4 + 0.6 * ease.out(u), null, 1);
  let ch = nearGhosts(t) + redFlag(t);
  const look = t > tWin - 0.3;
  ch += heroAtFlag(t, { turn: look ? 0 : -0.3, headRot: look ? -6 : 0, armL: look ? 30 : 14, armR: look ? 30 : 14, face: look ? { name: 'scared', eyes: { look: [0, -0.9] } } : { name: 'confused', eyes: { look: [-0.8, 0] } } }, { arms: false });
  o += view(cam, ch, 1) + Lt.fg + Lt.light;
  o += redWindow(t, seg(t, tWin, tWin + 0.6), 0.2);
  if (t >= tWin && t < tWin + 0.25) o += R.flash(0.5 * (1 - (t - tWin) / 0.25), '#FF3B4E');
  // the cut itself: a stutter (lag) from the bright day
  if (t < CUT.dark + 0.18) o += R.flash(0.8 * (1 - (t - CUT.dark) / 0.18), '#000000');
  return o;
}

// ---- 10. Tip glitching over the hero: "T-TIP: Respawns used:"
function shTip(t) {
  const u = seg(t, CUT.tip, CUT.count);
  const cam = at(FLAGX - 40, 760 - 40 * u, 2.3 + 0.15 * u);
  const Lt = townRed(t, cam, { red: 0.95, frozen: 0.25 });
  let o = Lt.bg + Lt.mid + crowdSvg(t, cam, 1, null, 1, { alpha: 0.5, haze: 0.28, skip: FLAGX, rows: [1, 2, 3] });
  let ch = nearGhosts(t, null, true) + redFlag(t);
  ch += heroAtFlag(t, { turn: 0.2, armL: 20, armR: 26, headRot: -4, face: { name: 'scared', eyes: { look: [0.3, -0.8] } } }, { arms: false });
  o += view(cam, ch, 1) + Lt.fg + Lt.light;
  const [hx, hy] = toScr(cam, FLAGX - 110 + 60, 990 - 300);
  const spike = Math.floor(t * 6) % 4 === 0 ? 1 : 0;
  o += R.tip({ x: hx + 190, y: hy - 70, s: 1.3, t, look: [-0.6, 0.4], glitch: 0.55 + 0.45 * spike, mood: 'worried', tail: -1 });
  o += redWindow(t, 1, 0.2, 1, 0, -170);
  return o + smash(t, CUT.tip, 0.08, 0.4, '#FF3B4E');
}

// ---- 11. RESPAWNS USED rolling to 9,999 — the ghosts multiply with the number
function shCount(t) {
  const u = seg(t, CUT.count, CUT.lot);
  const cam = shakeAll(camKeys(t, [[CUT.count, { zoom: 0.8, x: 520, y: 80 }], [CUT.lot, { zoom: 0.86, x: 560, y: 70 }]]), t, [[t99, 0.5, 16], [t9k, 0.25, 8], [t9h, 0.25, 8]]);
  // value steps: 0 -> 9,000 (thousand) -> 9,900 (hundred) -> 9,999 (ninety-nine)
  let from = 0, val = 9000, roll = seg(t, w(5, 'nine'), t9k + 0.35), tb = t9k + 0.35;
  if (t >= t9h - 0.1) { from = 9000; val = 9900; roll = seg(t, t9h - 0.1, t9h + 0.35); tb = t9h + 0.35; }
  if (t >= t99 - 0.15) { from = 9900; val = 9999; roll = seg(t, t99 - 0.15, t99 + 0.4); tb = t99 + 0.4; }
  const frac = 0.25 + 0.75 * (lerp(from, val, ease.out(roll)) / 9999);
  const Lt = townRed(t, cam, { red: 1, frozen: 0.25 });
  let o = Lt.bg + Lt.mid + crowdSvg(t, cam, frac, null, 1, { haze: 0.12 });
  let ch = nearGhosts(t) + redFlag(t);
  ch += heroAtFlag(t, { armL: 30, armR: 30, face: { name: 'scared', eyes: { look: [0, -0.9] } } }, { arms: false });
  o += view(cam, ch, 1) + Lt.fg + Lt.light;
  o += redWindow(t, 1, 0.12, 0.9, 0, -40);
  // new ghosts popping in: white rings across the frame on each step
  for (const [ts, sd] of [[t9k, 1], [t9h, 2], [t99, 3]]) {
    const a = t - ts;
    if (a < 0 || a > 0.45) continue;
    let d = '';
    for (let i = 0; i < 14; i++) { const x = hash(i * 3.1 + sd) * 1920, y = 560 + hash(i * 5.7 + sd) * 380, r = 20 + 70 * (a / 0.45); d += `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`; }
    o += S.path(d, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(10 * (1 - a / 0.45)), opacity: f(0.8 * (1 - a / 0.45)) });
  }
  // the big counter
  const kIn = seg(t, CUT.count, CUT.count + 0.3);
  o += S.g(R.counterHUD({ x: 0, y: 0, s: 1, t, label: 'RESPAWNS USED:', value: Math.round(lerp(from, val, ease.out(roll))), theme: 'red', bump: seg(t, tb, tb + 0.45), anchor: 'center', size: 80, labelSize: 34, k: kIn }), `translate(960 ${f(lerp(620, 600, u))}) scale(${f(1.55 + 0.25 * bump(t, t99 - 0.1, t99 + 0.5))}) rotate(-3)`);
  o += zoomLines(960, 600, bump(t, t99, t99 + 0.5), t, '#FFFFFF', 24, 520);
  return o + (t >= t99 && t < t99 + 0.2 ? R.flash(0.5 * (1 - (t - t99) / 0.2), '#FF3B4E') : '');
}

// ---- 12. "That's... a lot." two-shot, hero gulps, Tip worried
function shLot(t) {
  const u = seg(t, CUT.lot, CUT.okay);
  const cam = at(FLAGX - 20, 740, 2.6 + 0.35 * ease.inOut(u));
  const Lt = townRed(t, cam, { red: 1, frozen: 0.25 });
  let o = Lt.bg + Lt.mid + crowdSvg(t, cam, 1, null, 1, { alpha: 0.5, haze: 0.3, skip: FLAGX, rows: [1, 2, 3] });
  let ch = nearGhosts(t, null, true) + redFlag(t);
  const gulp = bump(t, w(5, 'lot.') + 0.1, w(5, 'lot.') + 0.5);
  ch += heroAtFlag(t, { turn: 0.25, armL: 14, armR: 14, bodyY: 8 * gulp, headY: 6 * gulp, face: { name: 'nervous', fx: ['sweat'], eyes: { look: [0.7, -0.3] }, mouth: gulp > 0.3 ? 'wavy' : 'line' } }, { arms: false });
  o += view(cam, ch, 1) + Lt.fg + Lt.light;
  const [hx, hy] = toScr(cam, FLAGX - 110, 990 - 300);
  o += sweat(hx - 20, hy - 280, t, 1.2);
  o += R.tip({ x: hx + 330, y: hy - 230, s: 1.5, t, look: [-0.8, 0.5], glitch: 0.3 + 0.5 * (Math.floor(t * 5) % 5 === 0), mood: 'worried' });
  return o;
}

// ---- 13. "Okay, okay! Maybe I respawned a LITTLE too much!" — panic close-up, ghosts failing right behind him
function shOkay(t) {
  const u = seg(t, CUT.okay, CUT.crack);
  const zl = bump(t, tLittle - 0.05, tLittle + 0.7);
  const cam = shakeAll(at(FLAGX - 90 + 60 * u, 760, 2.15 + 0.15 * u + 0.6 * zl), t, [[tLittle + 0.25, 0.4, 18]]);
  const Lt = townRed(t, cam, { red: 1, frozen: 0.25 });
  let o = Lt.bg + Lt.mid + crowdSvg(t, cam, 1, null, 1, { alpha: 0.5, haze: 0.3, skip: FLAGX, rows: [1, 2, 3] });
  let ch = redFlag(t);
  // ghosts right behind him
  ch += ghostFail('slip', t, mod(t / 1.6 + 0.2, 1), { x: FLAGX + 300, y: 975, s: 0.24 });
  ch += ghostFail('ball', t, mod(t / 1.4 + 0.6, 1), { x: FLAGX - 420, y: 975, s: 0.24, flip: true });
  ch += ghostFail('skate', t, mod(t / 1.8, 1), { x: FLAGX - 330, y: 955, s: 0.2, alpha: 0.5 });
  const little = t >= tLittle - 0.1 && t < tLittle + 0.75;
  const wave = Math.sin(t * 16);
  const pose = little ? { turn: 0.1, armL: 70, armR: 66, lean: 4, face: { name: 'nervous', eyes: { look: [0.2, 0] }, fx: ['sweat'] } }
    : { turn: 0.1 * wave, armL: 120 + 40 * wave, armR: 120 - 40 * wave, lift: 10 * Math.abs(wave), face: { name: 'scared', fx: ['sweat2'] } };
  ch += heroAtFlag(t, pose, { arms: false, energy: 1.6 });
  // a ghost cyclist crashes through the foreground on "LITTLE"
  const gu = seg(t, tLittle + 0.15, tLittle + 1.1);
  if (gu > 0 && gu < 1) ch += ghostFail('bike', t, lerp(0.05, 0.6, gu), { x: FLAGX + 170 + 260 * gu, y: 1050, s: 0.3, alpha: 0.7 });
  o += view(cam, ch, 1) + Lt.fg + Lt.light;
  if (little) {
    // the "little" gap between his hands
    const [hx, hy] = toScr(cam, FLAGX - 110, 990 - 1010 * TS_);
    const gk = pop(t, tLittle - 0.1, 0.2);
    o += S.g(S.path('M-70 -26 L-30 0 L-70 26 M70 -26 L30 0 L70 26', ln(12, '#FFFFFF')) + TFS('a LITTLE', 0, -50, 64, '#FFE14D'), tf(hx, hy - 40, gk));
  }
  return o;
}

// ---- 14. "Yeah. This needs some explaining." — the sky cracks like a phone screen around a loading wheel; the world freezes
function shCrack(t) {
  const u = seg(t, CUT.crack, CUT.rew);
  const cam = shakeAll(camKeys(t, [[CUT.crack, { zoom: 0.78, x: 560, y: 60 }], [tCrack + 0.2, { zoom: 0.76, x: 560, y: 50 }], [CUT.rew, { zoom: 0.92, x: 380, y: -40 }]]), t, [[tCrack, 0.6, 22]]);
  const frz = tCrack + 0.25;
  const tm = Math.min(t, frz);
  const Lt = townRed(t, cam, { red: 1, frozen: t > frz ? 1 : 0.25, freezeAt: frz, tm });
  let o = Lt.bg + Lt.mid + crowdSvg(tm, cam, 1, t > frz ? frz : null, 1);
  let ch = nearGhosts(tm) + redFlag(tm);
  ch += heroAtFlag(t, { armL: 20, armR: 20, headRot: -10, face: { name: 'shocked', eyes: { look: [0, -1] } } }, { arms: false });
  o += view(cam, ch, 1) + Lt.fg + Lt.light;
  o += redWindow(t, 1, 0.3 + 0.5 * seg(t, tCrack, tCrack + 0.4), 1, 0, -10 + 20 * ease.out(seg(t, tCrack, tCrack + 0.3)));
  o += R.skyCrack({ cx: 960 + 120, cy: 330, k: seg(t, tCrack, tCrack + 1.1), t, s: 1.05, seed: 4 });
  // the world lags: grey wash pulses
  o += R.greyWash(0.25 * seg(t, frz, frz + 0.6));
  return o + smash(t, tCrack, 0.12, 0.7);
}

// ---- 15. the rewind: the corrupted town winds back, then the whole cold open flickers backwards to "MON 8:00 AM"
const DAYS = ['FRI', 'THU', 'WED', 'TUE', 'MON'];
function osdClock(t) {
  const u = seg(t, tRwA, tRwC);
  const i = Math.min(4, Math.floor(u * 5));
  const hh = Math.floor(mod(18 - u * 70, 12)) + 1, mm = Math.floor(mod(47 - u * 900, 60));
  if (t >= tRwC) return 'MON 8:00 AM';
  return `${DAYS[i]} ${hh}:${String(mm).padStart(2, '0')} ${mod(Math.floor(u * 9), 2) ? 'AM' : 'PM'}`;
}
function shRewind(t) {
  let o = '';
  if (t < tRwB) {
    // phase A: the corrupt town reverses: crack heals, window folds, ghosts converge into blocks and vanish
    const u = seg(t, tRwA, tRwB);
    const cam = { zoom: lerp(0.92, 0.75, ease.inOut(u)), x: lerp(380, 520, u), y: lerp(-40, 40, u) };
    const tm = tCrack + 0.25 - u * 6;
    const Lt = townRed(t, cam, { red: 1 - 0.8 * u, tm });
    o += Lt.bg + Lt.mid + crowdSvg(tm, cam, 1 - u, null, 0);
    let ch = redFlag(tm);
    ch += heroAtFlag(t, { armL: 20, armR: 20, headRot: -10, face: { name: 'shocked', eyes: { look: [0, -1] } } }, { arms: false });
    // reverse crumbles: a few near ghosts reassemble backwards into nothing
    for (let i = 0; i < 4; i++) { const ag = 1.2 - u * 1.6 - i * 0.1; if (ag > 0.14) ch += R.crumble({ x: 1500 + i * 380, y: 990, s: 0.26, age: ag, seed: 30 + i, ghost: 1, pop: false }); }
    o += view(cam, ch, 1) + Lt.fg + Lt.light;
    o += redWindow(t, 1 - seg(u, 0.35, 0.8), 0.4);
    o += R.skyCrack({ cx: 1080, cy: 330, k: 1 - seg(u, 0, 0.5), t: -t, s: 1.05, seed: 4 });
  } else if (t < tRwC) {
    // phase B: the cold open in reverse at ~12x (source time runs from the parkour back to the first frames)
    const src = R.rewindT(t, tRwB, tRwC, CUT.dark - 0.1, 0.25, (x) => x);
    o += core(src);
  } else {
    // phase C: the morning street, the empty checkpoint by the house glowing — the first checkpoint
    const u = seg(t, tRwC, END);
    const cam = at(lerp(760, 720, u), lerp(700, 740, u), lerp(1.15, 1.9, ease.inOut(u)));
    const Ls = street(0.2 - (t - tRwC) * 0.5, cam, { checkpoint: true });
    // the blocks fly back together on the first checkpoint (reverse crumble), he stands there, PLAY
    const ag = lerp(1.25, 0, ease.inOut(seg(t, tRwC, Math.min(tRwC + 1.0, tPlay - 0.1))));
    let w_ = R.checkpoint({ ...PAD, t, state: 'saved', part: 'back' });
    if (ag > 0.001) w_ += R.crumble({ ...PAD, age: ag, seed: 2, dir: [-0.6, -0.3], pop: false });
    else w_ += actor('you', t, { ...PAD, ...boing(t, tRwC + 1.0, 0.18), face: t < tPlay ? { name: 'neutral', eyes: { look: [0, 0] } } : { name: 'confused', eyes: { look: [0.6, -0.2] } }, headRot: t < tPlay ? 0 : 6 });
    w_ += R.checkpoint({ ...PAD, t, state: 'saved', part: 'front' });
    o += Ls.bg + Ls.mid + view(cam, w_, 1) + Ls.fg + Ls.light;
  }
  // VHS overlay over everything
  const play = t >= tPlay;
  const k = 1 - 0.5 * seg(t, tPlay, END);
  o += R.rewind(t, k, { label: play ? '' : 'REWIND', clock: osdClock(t) });
  if (play) {
    const on = Math.floor(t * 4) % 2 === 0;
    o += S.g((on ? S.path('M44 70 L94 100 L44 130 Z', { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 6, 'stroke-linejoin': 'round' }) : '') + TF('PLAY', 112, 124, 64, '#FFFFFF', { 'text-anchor': 'start', 'letter-spacing': 4, stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke' }), 'translate(40 30)');
  }
  // hand-over: white flash into SC 02
  o += R.flash(ease.in(seg(t, END - 0.3, END)));
  return o + (Math.abs(t - tRwB) < 0.06 || Math.abs(t - tRwC) < 0.06 ? R.flash(0.5) : '');
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.ride, shRide], [CUT.pad1, shPad1], [CUT.lens, shLens], [CUT.pad2, shPad2], [CUT.cafe, shCafe], [CUT.gym, shGym], [CUT.replay, shReplay],
  [CUT.pop4, shCatch], [CUT.easy, shEasy], [CUT.run, shRun], [CUT.dark, shDark], [CUT.tip, shTip], [CUT.count, shCount], [CUT.lot, shLot],
  [CUT.okay, shOkay], [CUT.crack, shCrack], [CUT.rew, shRewind],
].sort((a, b) => a[0] - b[0]);
function shotAt(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return i;
}
// core(t): the shot at time t (used live and by the reverse montage)
function core(t) { return SHOTS[shotAt(t)][1](t); }
const WHIPS = [[CUT.cafe, 1], [CUT.gym, -1], [CUT.lens, 1]];
function scene(t) {
  let o = core(t);
  for (const [tc, d] of WHIPS) if (Math.abs(t - tc) < 0.1) o += whip(t, tc, d);
  return o;
}
function look(t) {
  if (t >= CUT.dark && t < tRwB) return { grade: null, vignette: 0.9 };
  if (t >= tRwB) return { grade: null, vignette: 0.6 };
  return { grade: null, vignette: 0.55 };
}

module.exports = { scene, look, SHOTS, CUT, _dbg: { crowdSvg, nearGhosts, townRed, redWindow, heroAtFlag }, beats: { marks1, tFrz1, tThrow1, tBack, tBonk, tHit, tCr1, tPop1, tHit2, tLens, tCr2, tPop2, tSlip, tSplat, tCr3, tPop3, tFace, tCr4, tPop4, tCatch, tPlant, tWin, t9k, t9h, t99, tLittle, tCrack, tRwA, tRwB, tRwC, tPlay, END, PK } };
