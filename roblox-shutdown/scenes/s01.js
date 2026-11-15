// SC 01 · COLD OPEN — one minute to shutdown. Night in the Core, red alarms, the wall timer at 00:01:00. Juno, Dex,
// Pip and Grandpa run along the catwalk with the giant Lag behind them; "Pip! Press the button!" — "Ding!" — FREEZE
// FRAME + record scratch; Juno, frozen mid-jump, turns to camera; "Let's go back twenty-four hours": she grabs the
// countdown and spins it; everything rewinds (flashes of the day) while the clock spins 00:01:00 → 24:00:00.
// The Lag shot, "Pip! Press the button!" and "Ding!" are SHARED with SC 10 (s09_env.shotMinute/shotPress/shotDing).
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const F = require('./farm');
const SETS = require('./sets');
const E = require('./s09_env');
const { CORE, FL, camAt, pop, who, SOOT, SOOT_SIDE, runSide, runFront, lagSprite, lagAura, coreShot } = E;

const l0 = L('01.0'), l1 = L('01.1'), l2 = L('01.2'), l3 = L('01.3'), l4 = L('01.4'), l5 = L('01.5'), l6 = L('01.6'), l7 = L('01.7');
const END = 25.659;
const tShut = l0.word('shut').t0, tForever = l0.word('FOREVER').t0;
const tB = tShut - 0.12;                      // A → B: tracking chase
const tC = l1.a - 0.08;                       // B → C: the Lag (shared shot)
const tMinute = l1.word('minute').t0;          // the timer starts ticking (it stutters on 00:01:00 before)
const tD = l2.a - 0.05;                       // D: running at camera, Dex: no respawn
const tChecked = l2.word('checked').t0;
const tE = l3.a - 0.05;                       // E: Grandpa
const tF = l4.a - 0.05;                       // F: "Pip! Press the button!" (shared)
const tG = l5.a - 0.25;                       // G: "Ding!" (shared)
const tFreeze = l5.b + 0.05;                  // FREEZE FRAME
const tTurn = l6.a - 0.05, tGiant = l6.word('giant').t0;
const tI = tGiant - 0.1;                      // I: the frozen Lag
const tJ = l7.a - 0.3;                        // J: Juno grabs the clock
const tBack = l7.word('back').t0, tTwenty = l7.word('twenty-four').t0, tRw = l7.word('hours').t0;
const tDay = tRw + 1.05;                      // rewind: flashes of the day

// ---------------------------------------------------------------- the countdown
function secAt(t) {
  if (t < tMinute) return 60 - (Math.floor(t * 2.2) % 3 === 2 ? 1 : 0); // lag: 00:01:00 ↔ 00:00:59 rubber-bands
  return 60 - (Math.min(t, tFreeze) - tMinute);
}

// ---------------------------------------------------------------- A: the wall timer → tilt down to the chase
function runners(t, x0, speed, s, o = {}) {
  const x = x0 + (t - (o.t0 ?? 0)) * speed;
  const gap = o.gap ?? 210 * s / 0.5;
  let c = '';
  const flat = s > 0.45 ? { volume: false } : {};
  c += runSide('grandpa', t, x - gap * 3, FL, s, { rate: 13, act: { face: 'scared' }, pose: { ...flat, props: [{ svg: E.mopInArm(70, -80), layer: 'front' }] } });
  c += runSide('pip', t, x - gap * 1.95, FL, s, { rate: 18, act: { face: 'scared' }, pose: flat });
  c += runSide('dex', t, x - gap, FL, s, { rate: 15, act: { face: 'scream' }, pose: flat });
  c += runSide('juno', t, x, FL, s, { rate: 15, head: SOOT_SIDE });
  return c;
}
function shotA(t) {
  const u = ease.inOut(seg(t, 0.25, tB - 0.1));
  const cam = E.shakes(K.camKeys(t, [[0, { zoom: 2.0, x: 0, y: -700 }], [0.5, { zoom: 2.0, x: 0, y: -700 }], [tB, { zoom: 0.8, x: -330, y: 60 }]], ease.inOut), t, [[0.9, 0.5, 10]]);
  const lagX = -760 + t * 150;
  const back = lagSprite(t, { x: lagX, y: 420, size: 2.4, mood: 'hungry', glitch: 0.3, speak: false, look: [1, 0.3] }) + lagAura(t, lagX, 420, 2.2, 1, 2, 7);
  const chars = runners(t, -100, 340, 0.36);
  let o = coreShot(t, cam, { alarm: 1, timer: K.clock(secAt(t)) }, chars, { back, backK: 0.8 });
  // alarm opening: black → red pulse
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#000', opacity: f(1 - seg(t, 0, 0.35)) });
  void u;
  return o;
}

// ---------------------------------------------------------------- B: tracking chase, the Lag lunges on FOREVER
const runX = (tt) => -500 + (tt - tB) * 420;
const camB = (t) => E.shakes({ zoom: 1.28, x: runX(t) - 960 - 250, y: 150 }, t, [[tForever, 0.6, 22]]);
function shotB(t) {
  const jx = runX(t);
  const cam = camB(t);
  const lunge = bump(t, tForever - 0.1, tForever + 0.7);
  const lagX = jx - 1250 + 160 * lunge + K.rubber(t, tForever + 0.4, 0.5, 60, 3);
  const lagSvg = lagSprite(t, { x: lagX, y: 520, size: 1.9, mood: t > tForever - 0.1 ? 'angry' : 'hungry', glitch: 0.2 + 0.25 * lunge, speak: false, look: [1, 0.2], mouth: lunge > 0.3 ? 'scream' : null }) + lagAura(t, lagX, 520, 1.7, 1, 4, 8);
  let chars = lagSvg;
  chars += runners(t, runX(tB), 420, 0.5, { t0: tB, gap: 230 });
  let o = coreShot(t, cam, { alarm: 1, timer: K.clock(secAt(t)) }, chars);
  o += C.speedLines(-200, 400, 640, 10, 7, '#FFFFFF', 600).replace(/<rect/g, '<rect opacity="0.25"');
  o += K.bang('FOREVER?!', 1530, 250, seg(t, tForever, tForever + 0.15) * (1 - seg(t, tC - 0.25, tC)), 120, -6, '#FF5A6E');
  o += E.whip(t, tB, 1);
  return o;
}

// ---------------------------------------------------------------- D: running at the camera — "no respawn in real life!"
function shotD(t) {
  const u = seg(t, tD, tE);
  const cam = E.shakes({ zoom: lerp(1.0, 1.1, u), x: 0, y: 30 }, t, [[tChecked, 0.3, 10]]);
  const run = (t - tD) * 900;
  const dp = E.catwalkDeep(t, { alarm: 1, run });
  // the Lag fills the far end
  const lagY = 300 + Math.sin(t * 2) * 10;
  let w = dp.bg + lagAura(t, 960, lagY, 1.6, 1, 6, 8) + lagSprite(t, { x: 960, y: lagY - 30, size: lerp(1.7, 2.0, u), mood: 'hungry', glitch: 0.3, speak: false, look: [0, 0.4] });
  // Grandpa + Pip behind, Juno + Dex in front
  const ph = t * 14;
  w += who('grandpa', t, { x: 1090, y: 735, s: E.deepS(760), ...runFront(ph + 1, 0.9), keysSwing: 25 * Math.sin(ph * 2), face: 'scared', props: [{ svg: E.mopProp({ x: -330, y: -260, rot: -60, len: 700 }), layer: 'back' }] }, { arms: false });
  w += who('pip', t, { x: 860, y: 790, s: E.deepS(790), ...runFront(ph * 1.25, 1), face: 'scared' }, { arms: false });
  const dexLook = t > l2.a && t < tChecked ? -0.5 : 0.2;
  w += who('dex', t, { x: 1400, y: 1060, s: 0.64, ...runFront(ph + 2.2, 1.1), turn: dexLook, lean: -3 }, { arms: false, energy: 1.6 });
  w += who('juno', t, { x: 520, y: 1030, s: 0.6, ...runFront(ph, 1), turn: 0.35, face: 'determined' }, { arms: false }, SOOT);
  let o = K.view(cam, w + dp.fg, 1);
  o += K.view(cam, K.F.sweatDrop ? K.F.sweatDrop(1530, 420, 1.6) : '', 1);
  o += K.bang('NO RESPAWN!', 400, 200, seg(t, l2.word('respawn').t0, l2.word('respawn').t0 + 0.15) * (1 - seg(t, tE - 0.3, tE)), 90, 6, '#3FA9FF');
  o += E.whip(t, tD, -1);
  return o;
}

// ---------------------------------------------------------------- E: Grandpa — "Hold on to your helmets!"
const xE = (t) => 400 + (t - tE) * 500;
const camE = (t) => E.shakes({ zoom: 1.4, x: xE(t) - 960 - 120, y: 0 }, t, [[l3.word('helmets').t0, 0.4, 14]]);
function shotE(t) {
  const x = xE(t);
  const cam = camE(t);
  const lagX = x - 900 + 80 * Math.sin(t * 3);
  let chars = lagAura(t, lagX, 560, 1.4, 1, 8, 6) + lagSprite(t, { x: lagX, y: 560, size: 1.5, mood: 'angry', glitch: 0.4, speak: false, look: [1, 0] });
  chars += K.pixelBlocks(x - 1100, FL - 60, 600, 160, t, 0.7, '#8A93A6', 50, 3);
  chars += runSide('pip', t, x - 420, FL, 0.42, { rate: 19, act: { face: 'scared' } });
  chars += runSide('grandpa', t, x, FL, 0.6, { rate: 13, amp: 1.1, lean: -14, pose: { armR: 60, props: [{ svg: E.mopInArm(95, -96, 760, 0.42), layer: 'front' }] }, act: { energy: 1.6 } });
  let o = coreShot(t, cam, { alarm: 1, timer: K.clock(secAt(t)) }, chars);
  o += E.whip(t, tE, 1);
  return o;
}

// ---------------------------------------------------------------- H/J: FREEZE FRAME — Juno turns to camera
const FZ = E.dingState(tFreeze, '01.5', { freeze: tFreeze });
function frozenBase(t) {
  // the ding shot, frozen at tFreeze, without Juno; cool grey "paused" tint
  return E.shotDing(t, '01.5', { freeze: tFreeze, hideJuno: true, timer: K.clock(secAt(tFreeze)) });
}
function shotFreeze(t) {
  const st = FZ;
  const jx = st.junoPose.x, jy = st.junoPose.y;
  const u = ease.inOut(seg(t, tFreeze + 0.25, tI));
  const camEnd = camAt(jx - 60, jy - 340, 1.55);
  const T0 = E.dingTimes('01.5');
  const cam0 = K.camKeys(tFreeze, [[T0.a, camAt(3020, 560, 0.86)], [T0.land + 0.6, camAt(3060, 560, 0.9)]]);
  const cam = K.camKeys(t, [[tFreeze, cam0], [tFreeze + 0.25, cam0], [tI, camEnd]]);
  // re-draw the frozen frame with the moving camera: shotDing uses its own camera, so rebuild it here
  const Ly = F.core(tFreeze, cam, { alarm: 1, timer: K.clock(secAt(tFreeze)), broadcast: 0 });
  const back = lagSprite(tFreeze, { ...st.lag, mood: 'angry', glitch: 0.4, speak: false }) + lagAura(tFreeze, st.lag.x, st.lag.y, 2.2, 1, 9, 8);
  let chars = runSide('grandpa', tFreeze, st.gx, FL - 6, 0.42, { ph: tFreeze * 13, pose: { armL: 100, armR: 30, volume: false }, act: { face: 'scared' } });
  chars += runSide('dex', tFreeze, st.dx, FL, 0.42, { ph: tFreeze * 15 + 1, pose: { volume: false }, act: { face: 'scream' } });
  chars += who('pip', tFreeze, { ...st.pipPose, volume: false }, { arms: false });
  let o = Ly.bg + K.view(cam, back, 0.85) + Ly.mid + K.view(cam, chars, 1) + Ly.fg + Ly.light;
  o += K.view(cam, E.ding(st.pipPose.x + 70, st.pipPose.y - 360, seg(tFreeze, T0.d, T0.d + 0.9), 0.9), 1);
  // freeze tint (the frozen world is a little desaturated and blue)
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#9AA6C8', opacity: 0.32 });
  // Juno: live, turns to camera
  const turned = t >= tTurn;
  const pk = seg(t, tTurn, tTurn + 0.22);
  let jun;
  if (!turned) jun = who('juno', tFreeze, st.junoPose, { arms: false }, SOOT_SIDE);
  else {
    const thumb = seg(t, l6.word('lag').t0 - 0.5, l6.word('lag').t0) ;
    jun = who('juno', t, { x: jx, y: jy, s: 0.6, turn: 0.15, legL: 30, kneeL: 40, legR: -10, kneeR: 50, armL: lerp(30, 120, thumb), armR: 18, sx: lerp(0.85, 1, pop(pk)), sy: lerp(1.15, 1, pop(pk)), shadow: false, lift: 0 }, { arms: thumb < 0.05, energy: 0.7 }, SOOT);
  }
  o += K.view(cam, jun, 1);
  // record scratch
  const sk = seg(t, tFreeze, tFreeze + 0.12) * (1 - seg(t, tFreeze + 0.7, tFreeze + 0.9));
  if (sk > 0) {
    o += K.bang('SCRRRATCH!', 1380, 250, sk, 100, -10, '#FFFFFF');
    o += S.g(S.circle(0, 0, 90, ol('#1A1A22', 8)) + S.circle(0, 0, 30, ol('#FF5A6E', 5)) + S.circle(0, 0, 6, { fill: '#000' }) + S.path('M-70 -20 Q0 -80 70 -20', ln(4, '#4A4A58')), `translate(1640 420) rotate(${f(t * 900)}) scale(${f(E.pop(sk))})`);
  }
  o += flashAt0(t, tFreeze);
  // paused badge
  o += S.g(S.rect(-120, -36, 240, 72, 20, { fill: '#10131C', opacity: 0.8 }) + S.rect(-90, -20, 14, 40, 3, { fill: '#FFFFFF' }) + S.rect(-66, -20, 14, 40, 3, { fill: '#FFFFFF' }) + TF('PAUSED', 30, 14, 34, '#FFFFFF'), `translate(${f(180)} ${f(180)})`, { opacity: f(seg(t, tFreeze + 0.3, tFreeze + 0.5)) });
  return o;
}
const flashAt0 = (t, tc) => E.flashAt(t, tc, 0.9, 0.12);

// ---------------------------------------------------------------- I: the frozen Lag — "...a giant lag monster."
function shotLagFrozen(t) {
  const st = FZ;
  const u = seg(t, tI, tJ);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1A0E22' });
  o += S.circle(960, 540, 900, { fill: 'url(#farmGlowRed)', opacity: 0.5 });
  const z = lerp(1.0, 1.12, u);
  let lg = lagSprite(tFreeze, { x: 0, y: 0, size: 2.6, mood: 'angry', glitch: 0.35, speak: false, look: [0.6, 0.3], mouth: 'scream' }) + lagAura(tFreeze, 0, 0, 2.4, 1, 9, 8);
  o += S.g(lg, `translate(${f(1000 + 60 * u)} 560) scale(${f(z)})`);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#9AA6C8', opacity: 0.3 });
  // "buffering" spinner on top of the frozen monster
  o += S.circle(1600, 230, 70, { fill: '#10131C', opacity: 0.75 }) + K.loadingWheel(1600, 230, 44, t, '#FFFFFF', 8, 10, 1.4);
  o += S.g(S.rect(-120, -36, 240, 72, 20, { fill: '#10131C', opacity: 0.8 }) + S.rect(-90, -20, 14, 40, 3, { fill: '#FFFFFF' }) + S.rect(-66, -20, 14, 40, 3, { fill: '#FFFFFF' }) + TF('PAUSED', 30, 14, 34, '#FFFFFF'), 'translate(180 180)');
  o += K.bang('GIANT LAG MONSTER', 960, 160, seg(t, l6.word('lag').t0, l6.word('lag').t0 + 0.15), 70, -4, '#FFE14D');
  return o;
}

// ---------------------------------------------------------------- J: "Let's go back twenty-four hours." — she spins the clock
function shotGrab(t) {
  const st = FZ;
  const jx = st.junoPose.x, jy = st.junoPose.y;
  const cam = K.camKeys(t, [[tJ, camAt(jx - 40, jy - 420, 1.95)], [tRw, camAt(jx - 40, jy - 440, 2.1)]]);
  const Ly = F.core(tFreeze, cam, { alarm: 1, timer: K.clock(secAt(tFreeze)), broadcast: 0 });
  const back = lagSprite(tFreeze, { ...st.lag, mood: 'angry', glitch: 0.4, speak: false });
  let chars = who('pip', tFreeze, { ...st.pipPose, volume: false }, { arms: false });
  let o = Ly.bg + K.view(cam, back, 0.85) + Ly.mid + K.view(cam, chars, 1) + Ly.fg + Ly.light;
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#9AA6C8', opacity: 0.32 });
  const reach = seg(t, tBack - 0.3, tBack + 0.05);
  const spin = seg(t, tTwenty - 0.1, tRw + 0.2);
  o += K.view(cam, who('juno', t, { x: jx, y: jy, s: 0.6, turn: 0.2, legL: 30, kneeL: 40, legR: -10, kneeR: 50, armR: lerp(20, 150, ease.out(reach)) + 20 * Math.sin(spin * 30) * spin, armL: 20, shadow: false, face: spin > 0 ? 'smug' : undefined }, { arms: false, energy: 0.6 }, SOOT), 1);
  // the countdown drops into her hand (screen space)
  const drop = ease.outBack(seg(t, tBack - 0.45, tBack));
  if (drop > 0) {
    const sec = lerp(secAt(tFreeze), 60, ease.in(spin));
    o += E.bigClock(1240, lerp(-200, 170, drop), 0.55, sec, t, spin * 0.8);
    if (spin > 0) for (let i = 0; i < 3; i++) o += S.path(`M${1240 - 300 + i * 30} ${100 + i * 40} A300 120 0 0 1 ${1240 + 300 - i * 30} ${100 + i * 40}`, ln(8, '#FFFFFF', f(0.5 * spin)));
  }
  return o;
}

// ---------------------------------------------------------------- live (for the rewind)
function live(t) {
  if (t < tB) return shotA(t);
  if (t < tC) return shotB(t);
  if (t < tD) return E.shotMinute(t, '01.1');
  if (t < tE) return shotD(t);
  if (t < tF) return shotE(t);
  if (t < tG) return E.shotPress(t, '01.4', { timer: K.clock(secAt(t)) });
  if (t < tFreeze) return E.shotDing(t, '01.5', { timer: K.clock(secAt(t)) });
  return shotFreeze(t);
}
// flashes of the day, in reverse (rewind)
const DAY = [
  (t) => '' + F.archive(t, { zoom: 1, x: 0, y: 0 }, { greyFrom: 0.6 }),
  (t) => '' + F.cableJungle(t, { zoom: 1, x: 0, y: 0 }, {}),
  (t) => '' + F.coolingRoom(t, { zoom: 1, x: 0, y: 0 }, {}),
  (t) => '' + F.farmDoor(t, { doorScreen: 'KEY EXPIRED: 1998' }),
  (t) => '' + F.farmExterior(t, { storm: 0.8 }),
  (t) => '' + F.desertRoad(t, { zoom: 1, x: 0, y: 0 }, { time: 0.3, speed: 900 }) + K.view({ zoom: 1 }, F.van(960, F.ROAD.near, 0.62, t, { bounce: 0.5 }), 1),
  (t) => SETS.livingRoom(t, { time: 'evening' }),
  (t) => SETS.attic(t, { time: 'evening' }),
];

function scene(t) {
  E.STATE.wall = false;
  if (t < tFreeze) {
    let o = live(t);
    return o;
  }
  if (t < tI) return shotFreeze(t);
  if (t < tJ) return shotLagFrozen(t);
  if (t < tRw) return shotGrab(t);
  // REWIND
  let o;
  if (t < tDay) {
    const src = Math.max(0.3, tFreeze - 0.05 - (t - tRw) * 13);
    o = live(src);
  } else {
    const i = Math.min(DAY.length - 1, Math.floor((t - tDay) / ((END - 0.15 - tDay) / DAY.length)));
    o = DAY[i](t * 0.5);
  }
  o += C.vhs(t, '◀◀ REWIND', 1);
  const spin = seg(t, tRw, END - 0.2);
  const sec = lerp(60, 24 * 3600, ease.in(spin));
  o += E.bigClock(960, 520, 0.9 + 0.15 * spin, Math.round(sec), t, spin < 0.98 ? 1 : 0, spin > 0.98 ? '#FFFFFF' : '#FF3B4E');
  o += C.whiteFlash(seg(t, END - 0.2, END));
  return o;
}

function timer(t) {
  if (E.STATE.wall) return null;
  if (t < tB) return null;                                  // the wall timer is in shot
  if (t < tC && E.wallTimerVisible(camB(t))) return null;
  if (t >= tE && t < tF && E.wallTimerVisible(camE(t))) return null;
  if (t < tFreeze) return { sec: secAt(t), glitch: t < tMinute ? 0.6 : 0.25 };
  if (t < tI) return { sec: secAt(tFreeze), glitch: 0 };       // frozen with everything else
  return null;                                              // Juno grabs it (drawn in the scene) / rewind
}
const look = (t) => (t >= tRw ? { grade: null, vignette: 0.6 } : t >= tFreeze ? { grade: 'cool', vignette: 0.9 } : { grade: 'cool', vignette: 1 });

module.exports = { scene, look, timer, secAt };
