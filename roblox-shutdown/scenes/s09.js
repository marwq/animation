// SC 09 · THE LAG — the Core: a tower of servers rising into darkness and the stadium-sized Lag slurping server racks
// like spaghetti. World-map screens full of red dots and "LAST CHANCE!!!" spam. Dex's cocky boss attempt → no double
// jump in real life → face-plant; the Lag's slow "Ha. Ha. Ha. Ha."; "No more... elevators." → Pip's tiny angry
// "...Not the elevator."; Juno builds a wall ("I'm a BUILDER!") and the Lag phases through it ("Wall... not...
// loaded."); SYSTEM: five minutes; Grandpa's mop gets eaten; Juno's idea (ten seconds with NO traffic), Grandpa's
// realisation, Dex's disbelief, and "Then we ask. Everyone. At once." — pointing at the control wall.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const F = require('./farm');
const LG = require('../rig/lag');
const E = require('./s09_env');
const { CORE, FL, camAt, pop, who, SOOT, SOOT_SIDE, runSide, lagSprite, lagAura, coreShot, R, P, CI, EL, G, tr, OUT, TS, TFS } = E;

const START = K.V.scene('SC 09').start, END = K.V.scene('SC 10').start;
const m = (i) => L('09.' + i);
const M = Array.from({ length: 18 }, (_, i) => m(i));

// ---------------------------------------------------------------- beats
const s2 = M[0].word('more', 1).t0 - 0.1;              // wide: the scale of him
const s3 = M[0].word('more', 2).t0 - 0.1;           // smash: the mouth — MORE... FOOD.
const tFood = M[0].word('FOOD').t0;
const s4 = M[1].a - 0.1;                            // the world-map screens
const s5 = M[1].word('And').t0 - 0.1;               // the heroes hiding behind a rack
const s6 = M[2].a - 0.1;                            // Dex steps up
const tBoss = M[2].word('boss').t0;
const s7 = M[3].a - 0.05;                           // the jump
const s8 = M[4].a - 0.1;                            // face-plant close
const tSplat = s8 - 0.12;
const s9 = M[5].a - 0.4;                            // Ha. Ha. Ha. Ha.
const HA = [0, 1, 2, 3].map((i) => M[5].word('Ha', i).t0);
const s10 = M[6].a - 0.1;                           // "Tomorrow... no more... games."
const tGames = M[6].word('games').t0;
const s11 = M[6].word('No', 1).t0 - 0.1;            // "No more... obbies." — Dex looks up
const tObbies = M[6].word('obbies').t0;
const s12 = M[6].word('No', 2).t0 - 0.1;            // "No more..."
const s13 = M[6].word('elevators').t0 - 0.05;       // Pip ECU → "...Not the elevator."
const s14 = M[8].a - 0.1;                           // "My turn. I'm a BUILDER!"
const tBuilder = M[8].word('BUILDER').t0;
const s15 = M[9].a - 0.1;                           // "Wall... not... loaded."
const s16 = M[10].a - 0.08;                         // "Oh, come ON!"
const s17 = M[11].a - 0.05;                         // the wall timer jumps to five minutes
const tFive = M[11].word('five').t0;
const s18 = M[11].word('Thanks').t0 - 0.1;          // the Lag grows, eats the lamps
const s19 = M[11].b - 0.45;                         // Grandpa swings the mop
const tEat = M[12].word('mop').t0 - 0.05;
const s20 = M[12].word('He').t0 - 0.1;              // "He ate my MOP!"
const s21 = M[13].a - 0.1;                          // Juno thinks
const tEvery = M[13].word('Everybody').t0;
const s22 = M[14].a - 0.1;                          // "What if there was NO traffic?"
const tNo = M[14].word('NO').t0;
const s23 = M[14].word('Not').t0 - 0.1;             // the blueprint
const tTen = M[14].word('ten').t0;
const s24 = M[15].a - 0.1;                          // Grandpa realises
const s25 = M[15].word("he'd").t0 - 0.1;            // the Lag chomps on nothing
const s26 = M[16].a - 0.1;                          // Dex: Nobody logs off!
const s27 = M[17].a - 0.1;                          // Juno: Then we ask.
const s28 = M[17].word('At').t0 - 0.1;              // whip to the control wall
const tOnce = M[17].word('once').t0;

// ---------------------------------------------------------------- the countdown
function secAt(t) {
  if (t < tFive) return 900 - (t - START);
  return 300 - (t - tFive);
}
const clockAt = (t) => K.clock(t < tFive + 0.3 && t > tFive - 0.3 && Math.floor(t * 20) % 2 ? 300 : secAt(t));

// ---------------------------------------------------------------- shots
// S1: the Core from below: tilt up the tower to the stadium-sized Lag slurping racks
function shot1(t) {
  const u = ease.inOut(seg(t, START + 0.1, s2 - 0.1));
  const lift = lerp(-560, 0, u);
  const la = E.lowAngle(t, { alarm: 1, lift });
  const LY = 360 + lift, LS = 2.2;
  let mid = lagAura(t, 960, LY, LS, 1, 1, 10) + lagSprite(t, { x: 960, y: LY, size: LS, mood: 'hungry', glitch: 0.25, look: [0, 0.5] });
  mid += E.slurp(t, [[560, 1100 + lift * 0.4], [1360, 1100 + lift * 0.4], [960, 1150]], 960, LY + 92 * 0.76 * LS + 30, { w: 40, speed: 0.45 });
  let o = la.bg + mid + la.fg;
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#000', opacity: f(1 - seg(t, START, START + 0.4)) });
  return o;
}
// S2: wide side view — he dwarfs the tower; the heroes are tiny on the catwalk
function shot2(t) {
  const u = seg(t, s2, s3);
  const cam = K.camKeys(t, [[s2, { zoom: 0.55, x: 200, y: -200 }], [s3, { zoom: 0.6, x: 240, y: -180 }]]);
  const lx = 760, ly = 120, ls = 3.3;
  let back = lagAura(t, lx, ly, ls, 1, 2, 10) + lagSprite(t, { x: lx, y: ly, size: ls, mood: 'hungry', glitch: 0.25, look: [0.6, 0.6] }) + E.slurp(t, [[960, 900], [1250, 760], [700, 1100]], lx, ly + 92 * 0.76 * ls + 40, { w: 60, speed: 0.4 });
  let chars = '';
  ['juno', 'dex', 'pip', 'grandpa'].forEach((n, i) => { chars += who(n, t, { x: 1600 + i * 110, y: FL, s: 0.3, turn: -0.5, armL: 10, armR: 10, face: 'scared', volume: false }, { arms: false }); });
  return coreShot(t, cam, { alarm: 1, timer: clockAt(t) }, chars, { back, backK: 0.7 });
}
// S3: smash on the mouth — MORE... FOOD.
function shot3(t) {
  const u = seg(t, s3, s4);
  const z = t < tFood ? 1 : 1.18;
  const cam = E.shakes({ zoom: z, x: 0, y: 0 }, t, [[tFood, 0.6, 26], [s3, 0.25, 10]]);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#14081A' }) + S.circle(960, 900, 900, { fill: 'url(#farmGlowRed)', opacity: 0.6 });
  let mid = lagSprite(t, { x: 960, y: 60, size: 4.6, mood: 'hungry', glitch: 0.3 + 0.5 * bump(t, tFood, tFood + 0.5), look: [0, 0.6] });
  mid += E.slurp(t, [[420, 1200], [1500, 1200], [960, 1250]], 960, 60 + 92 * 0.76 * 4.6 + 60, { w: 56, speed: 0.6 });
  o += K.view(cam, mid, 1);
  o += E.flashAt(t, s3, 0.6) + E.flashAt(t, tFood, 0.4);
  void u;
  return o;
}
// S4: the world-map screens: red dots, LAST CHANCE spam; red traffic streams off toward him
function shot4(t) {
  const u = seg(t, s4, s5);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#05070F' });
  o += F.worldMap(140, 110, 1500, 844, t, { dots: 1, spam: true });
  o += E.traffic(t, [[430, 330], [700, 520], [1200, 300], [1050, 760], [380, 640]], 2100, 380, 1, '#FF5A6E', 4);
  o += lagSprite(t, { x: 1980, y: 420, size: 1.3, mood: 'hungry', glitch: 0.2, speak: false, look: [-1, 0] });
  return K.view({ zoom: lerp(1.0, 1.1, u), x: lerp(0, 60, u), y: 0 }, o, 1);
}
// S5: the heroes hide behind a rack; red traffic streams over their heads into him
function shot5(t) {
  const u = seg(t, s5, s6);
  const cam = { zoom: lerp(1.1, 1.18, u), x: 40, y: 80 };
  const back = lagSprite(t, { x: 900, y: 130, size: 2.0, mood: 'hungry', glitch: 0.2, speak: false, look: [0, 0.8] }) + lagAura(t, 900, 130, 2, 0.7, 4, 6);
  let chars = '';
  chars += who('grandpa', t, { x: 520, y: FL + 120, s: 0.6, turn: 0.3, volume: false, face: { name: 'scared', eyes: { look: [0.2, -1] } }, armL: 10, armR: 10 }, { arms: false });
  chars += who('dex', t, { x: 1430, y: FL + 140, s: 0.58, turn: -0.3, volume: false, face: { name: 'scared', eyes: { look: [-0.3, -1] } }, armL: 10, armR: 10 }, { arms: false });
  chars += who('pip', t, { x: 1170, y: FL + 70, s: 0.6, turn: -0.2, volume: false, face: { name: 'scared', eyes: { look: [0, -1] } }, armL: 10, armR: 10 }, { arms: false });
  chars += who('juno', t, { x: 860, y: FL + 140, s: 0.62, turn: 0.1, armL: 10, armR: 10, face: t < M[1].b ? undefined : 'sad' }, { energy: 0.4, arms: false }, SOOT);
  // a row of racks in front (they hide behind it)
  let racks = '';
  for (let i = 0; i < 6; i++) racks += F.rack(160 + i * 290, FL + 300, 1.5, 300, t, { seed: i + 3, alarm: 1, lw: 5 });
  const trf = E.traffic(t, [[-100, 700], [-100, 400], [2020, 600], [2020, 300]], 900, 300, 1, '#FF5A6E', 4);
  return coreShot(t, cam, { alarm: 1, timer: clockAt(t), frontRail: false }, chars + racks, { back, backK: 0.75, over: trf });
}
// S6: Dex steps up — boss HP bar parody
function shot6(t) {
  const u = seg(t, s6, s7);
  const cam = K.camKeys(t, [[s6, camAt(700, 500, 1.35)], [s7, camAt(720, 470, 1.5)]]);
  const back = lagSprite(t, { x: 260, y: 200, size: 2.2, mood: 'hungry', glitch: 0.2, speak: false, look: [1, 0.6] }) + lagAura(t, 260, 200, 2.2, 0.7, 5, 6);
  const step = ease.out(seg(t, s6, s6 + 0.5));
  const crack = bump(t, M[2].word('back').t0, M[2].word('back').t0 + 0.4);
  let chars = who('juno', t, { x: 1150, y: FL, s: 0.5, turn: -0.5, armL: 10, armR: 30, volume: false, face: { name: 'nervous', eyes: { look: [-1, 0] } } }, { arms: false }, SOOT);
  chars += who('dex', t, { x: lerp(900, 760, step), y: FL + 30, s: 0.58, turn: 0.15, armL: 30 + 40 * crack, armR: 30 + 40 * crack, face: 'smug', lean: -3 }, { energy: 1.2, arms: crack < 0.05 });
  let o = coreShot(t, cam, { alarm: 1, timer: clockAt(t) }, chars, { back, backK: 0.75 });
  if (crack > 0.2) o += K.bang('CRACK!', 1100, 560, crack, 60, -8, '#FFFFFF');
  // boss bar
  const bk = seg(t, tBoss - 0.2, tBoss + 0.1);
  if (bk > 0) {
    let b = R(-520, -40, 1040, 80, 18, ol('#10131C', 7)) + R(-500, -10, 1000, 30, 8, { fill: '#3A0A14' }) + R(-500, -10, 1000, 30, 8, { fill: '#E8243C' }) + R(-500, -10, 1000, 10, 5, { fill: '#FF7A8A' });
    b += T('BOSS: THE LAG', -490, -18, 34, '#FFFFFF', { 'text-anchor': 'start', ...OUT(6) }) + T('HP: ∞', 490, -18, 34, '#FFD21F', { 'text-anchor': 'end', ...OUT(6) });
    o += G(b, `translate(960 ${f(lerp(-80, 200, ease.outBack(bk)))})`);
  }
  return o;
}
// S7: the run, the jump, the double jump that doesn't exist, the fall
function dexJump(t) {
  const run = seg(t, s7, s7 + 0.45), up = seg(t, s7 + 0.45, s7 + 0.85), dj = seg(t, s7 + 0.85, s7 + 1.05), fall = seg(t, s7 + 1.05, tSplat);
  let x = lerp(380, 700, run) + 260 * up + 80 * dj + 220 * fall;
  let lift = 330 * Math.sin(up * Math.PI / 2) + 20 * Math.sin(dj * Math.PI) - 330 * ease.in(fall);
  let pose;
  if (run < 1) pose = { ...A.run(t * 16, 1.1), lean: -8 };
  else if (up < 1) pose = { legL: 60, kneeL: 80, legR: -30, kneeR: 50, armL: 160, armR: 120, lean: -6 };
  else if (dj < 1) pose = { legL: -40 + 100 * Math.sin(dj * 12), kneeL: 30, legR: 50 - 100 * Math.sin(dj * 12), kneeR: 30, armL: 170, armR: 170, lean: -10 };
  else pose = { legL: 20, kneeL: 20, legR: -10, kneeR: 20, armL: 150 + 20 * Math.sin(t * 40), armR: 140 + 20 * Math.cos(t * 40), lean: -10, rot: lerp(0, -70, fall), rotY: -500 };
  return { x, lift: Math.max(0, lift), pose, up, dj, fall };
}
function shot7(t) {
  const cam = E.shakes(K.camKeys(t, [[s7, camAt(820, 480, 0.95)], [s8, camAt(960, 470, 1.0)]]), t, [[tSplat, 0.4, 20]]);
  const d = dexJump(t);
  const back = lagSprite(t, { x: 1500, y: 160, size: 2.0, mood: 'hungry', glitch: 0.2, speak: false, look: [-0.4, 0.8] });
  let chars = who('juno', t, { x: 360, y: FL + 60, s: 0.6, turn: 0.5, armR: 100 + 10 * Math.sin(t * 20), armL: 20, lean: -6, face: 'scared' }, { arms: false }, SOOT);
  chars += who('dex', t, { x: d.x, y: FL, s: 0.5, view: 'side', flip: true, lift: d.lift, ...d.pose, face: d.fall > 0 ? 'scream' : d.dj > 0 ? 'confused' : 'excited' }, { arms: false });
  let o = coreShot(t, cam, { alarm: 1, timer: clockAt(t) }, chars, { back, backK: 0.75 });
  // the double-jump that isn't there
  if (d.dj > 0 && d.fall < 0.6) {
    const k = pop(seg(t, s7 + 0.85, s7 + 1.0)) * (1 - seg(t, s7 + 1.4, s7 + 1.6));
    o += K.view(cam, G(R(-200, -46, 400, 92, 22, ol('#E9EDF3', 6)) + T('DOUBLE JUMP?', 0, 18, 46, '#2A3140') + G(R(-30, -30, 60, 60, 10, ol('#5A6478', 4)) + TF('×2', 0, 12, 30, '#FFFFFF'), 'translate(-250 0)') + T('?', 240, 22, 70, '#FFD21F', OUT(8)), `translate(${f(d.x + 420)} ${f(FL - d.lift - 380)}) scale(${f(k)})`), 1);
  }
  if (d.fall > 0.3) o += K.view(cam, G(K.popup(0, 0, 560, 170, 'REAL LIFE', ['Double jump not found.'], 1, { size: 36, accent: '#E8243C' }), `translate(${f(d.x - 160)} 260) scale(${f(0.8 * pop(seg(t, s7 + 1.1, s7 + 1.35)))})`), 1);
  return o + E.flashAt(t, tSplat, 0.4);
}
// S8: face-down on the grate — "Real life is SO badly designed." + the 1 s beat
function shot8(t) {
  const u = seg(t, s8, s9);
  const cam = E.shakes(K.camKeys(t, [[s8, camAt(1200, 720, 1.8)], [s9, camAt(1210, 730, 1.95)]]), t, [[s8, 0.3, 12]]);
  let chars = who('dex', t, { x: 1060, y: FL + 72, s: 0.5, view: 'side', flip: true, rot: -88, rotY: -260, legL: 10, kneeL: 20, legR: -6, kneeR: 30, armL: 170, armR: 160, face: { name: 'oof', eyes: { type: 'x' } }, lean: 0, shadow: false, legLift: 0 }, { arms: false, energy: 0.2 });
  chars += C.dust(900, FL - 20, s8 - 0.15, t);
  let o = coreShot(t, cam, { alarm: 1, timer: clockAt(t) }, chars);
  // the muffled line puffs out of the grate
  if (t > M[4].a && t < M[4].b) for (let i = 0; i < 3; i++) { const ph = (t * 1.3 + i / 3) % 1; o += S.circle(1500 + ph * 80, 760 - ph * 120, 14 + ph * 20, { fill: '#FFFFFF', opacity: f(0.5 * (1 - ph)) }); }
  // the beat: a respawn prompt that never comes
  const rk = seg(t, M[4].b + 0.05, M[4].b + 0.3);
  if (rk > 0) {
    let r = R(-330, -70, 660, 140, 26, { fill: '#10131C', opacity: 0.85, stroke: '#E8243C', 'stroke-width': 6 }) + TF('RESPAWN IN...', 0, -14, 40, '#FFFFFF') + T('NOT AVAILABLE (REAL LIFE)', 0, 42, 40, '#FF5A6E');
    o += G(r, `translate(960 ${f(lerp(-120, 220, ease.outBack(rk)))})`);
  }
  void u;
  return o;
}
// S9: Ha. Ha. Ha. Ha. — jump-zooms in on each "Ha", the frame freezes between them
function shot9(t) {
  let z = 1, i = -1;
  HA.forEach((h, k) => { if (t >= h - 0.05) { z = [1.0, 1.25, 1.55, 1.95][k]; i = k; } });
  const hold = i >= 0 ? HA[i] + 0.12 : t;
  const tt = t < hold ? t : hold + (t - hold) * 0.15;
  const cam = E.shakes({ zoom: z, x: 0, y: -(z - 1) * 140 }, t, HA.map((h) => [h, 0.35, 18]));
  const la = E.lowAngle(tt, { alarm: 1, lift: 0 });
  let mid = lagAura(tt, 960, 420, 2.0, 1, 8, 9) + lagSprite(tt, { x: 960, y: 420, size: 2.0, mood: 'laugh', glitch: 0.2 + 0.5 * HA.reduce((a, h) => a + bump(t, h, h + 0.3), 0), look: [0, 0.4], fps: 0 });
  let o = la.bg + K.view(cam, mid, 1) + la.fg;
  HA.forEach((h, k) => { o += K.bang('HA.', [560, 1380, 520, 1400][k], [300, 280, 640, 620][k], seg(t, h, h + 0.12) * (1 - seg(t, h + 0.8, h + 1.0)), 110 + k * 20, k % 2 ? 8 : -8, '#D6DBE4'); });
  return o + E.flashAt(t, HA[0], 0.3);
}
// S10: "Tomorrow... no more... games." — game bubbles around him turn grey and crack
function shot10(t) {
  const u = seg(t, s10, s11);
  const cam = { zoom: lerp(1.0, 1.08, u), x: 0, y: -20 };
  const la = E.lowAngle(t, { alarm: 1, lamps: 1 });
  let mid = lagAura(t, 960, 430, 1.9, 1, 8, 8) + lagSprite(t, { x: 960, y: 430, size: 1.9, mood: 'angry', glitch: 0.3, look: [0, 0.5] });
  const kinds = ['obby', 'tycoon', 'race', 'castle', 'pet', 'space'];
  kinds.forEach((k, i) => {
    const a = (i / kinds.length) * Math.PI * 2 + t * 0.2;
    const bx = 960 + Math.cos(a) * 760, by = 430 + Math.sin(a) * 330;
    const g = seg(t, tGames - 0.2 + i * 0.12, tGames + 0.1 + i * 0.12);
    mid += F.gameBubble(bx, by, 70, t, { kind: k, grey: g > 0.5 ? 1 : 0, glow: g > 0.5 ? 0 : 0.8, seed: i });
    if (g > 0 && g < 1) mid += K.pixelBlocks(bx - 70, by - 70, 140, 140, t, g, '#8A93A6', 30, i);
  });
  return la.bg + K.view(cam, mid, 1) + la.fg;
}
// S11: "No more... obbies." — Dex, still on the floor, lifts his face
function shot11(t) {
  const cam = K.camKeys(t, [[s11, camAt(1250, 640, 1.65)], [s12, camAt(1250, 620, 1.8)]]);
  const lookUp = seg(t, s11 + 0.1, s11 + 0.4);
  let chars = who('dex', t, { x: 1060, y: FL + 72, s: 0.5, view: 'side', flip: true, rot: lerp(-88, -74, lookUp), rotY: -260, legL: 10, kneeL: 20, armL: 120, armR: 100, face: { name: 'shocked', eyes: { look: [1, -1] }, fx: ['sweat'] }, shadow: false }, { arms: false });
  let o = coreShot(t, cam, { alarm: 1, timer: clockAt(t) }, chars);
  const g = seg(t, tObbies, tObbies + 0.3);
  o += G(F.gameBubble(0, 0, 90, t, { kind: 'obby', grey: g > 0.5 ? 1 : 0, glow: 0.6, label: 'OBBY' }), `translate(1500 260) scale(${f(1 + 0.1 * bump(t, tObbies, tObbies + 0.3))})`);
  if (g > 0.5) o += K.bang('*crack*', 1500, 420, seg(t, tObbies + 0.1, tObbies + 0.25), 50, 6, '#D6DBE4');
  return o;
}
// S12: "No more..." — the Lag leans in over the catwalk; Pip stands his ground
function shot12(t) {
  const u = seg(t, s12, s13);
  const cam = { zoom: lerp(1.0, 1.06, u), x: 0, y: 0 };
  const la = E.lowAngle(t, { alarm: 1, lamps: 1 });
  let mid = lagAura(t, 960, 380, 2.2, 1, 6, 8) + lagSprite(t, { x: 960, y: 380 + 30 * u, size: 2.2, mood: 'angry', glitch: 0.3, look: [0.2, 0.9] });
  mid += who('pip', t, { x: 1460, y: 1240, s: 0.85, view: 'back', armL: 10, armR: 10 }, { arms: false });
  return la.bg + K.view(cam, mid, 1) + la.fg;
}
// S13: Pip ECU — "...Not the elevator."
function shot13(t) {
  const u = seg(t, s13, s14);
  const z = lerp(1.0, 1.22, ease.in(u));
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1A0A14' }) + S.circle(960, 540, 900, { fill: 'url(#farmGlowRed)', opacity: f(0.4 + 0.4 * u) });
  for (let i = 0; i < 10; i++) o += S.rect(-100, 80 + i * 110, 2120, 30, 15, { fill: '#FF2E4D', opacity: f(0.05 + 0.05 * Math.sin(t * 4 + i)) });
  const angry = t > M[7].a - 0.05;
  const face = angry ? { name: 'angry', fx: ['anger'], eyes: { upper: 0.45 } } : { name: 'shocked', eyes: { look: [0, -0.6] } };
  const pip = who('pip', t, { x: 960, y: 1430, s: 1.55, turn: 0, armL: 20, armR: 20, face, headRot: angry ? -3 : 0, shadow: false }, { arms: false, energy: 0.2 });
  o += G(pip, `translate(960 540) scale(${f(z)}) translate(-960 -540)`);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF2E4D', opacity: f(0.12 * u) });
  if (angry) o += K.F.sparkle ? '' : '';
  return o;
}
// S14: "My turn. I'm a BUILDER!" — panels slam into a wall
const WALL = { x: 880, y0: FL, cols: 4, rows: 4, w: 160, h: 140 };
function wallPanels(t, built, notLoaded = 0, lagX = -9999) {
  let o = '';
  for (let r = 0; r < WALL.rows; r++) for (let c = 0; c < WALL.cols; c++) {
    const i = r * WALL.cols + c;
    const k = built(i);
    if (k <= 0) continue;
    const x = WALL.x - (WALL.cols * WALL.w) / 2 + c * WALL.w, y = WALL.y0 - (r + 1) * WALL.h;
    const fx = x + (c - 1) * 600 * (1 - k) + (i % 2 ? 400 : -400) * (1 - k), fy = y - 700 * (1 - k);
    const nl = notLoaded > 0 && Math.abs(x + WALL.w / 2 - lagX) < 380 ? 1 : 0;
    if (nl) { o += K.pixelBlocks(fx, fy, WALL.w - 6, WALL.h - 6, t, 0.9, '#8A93A6', 36, i); continue; }
    o += G(R(0, 0, WALL.w - 6, WALL.h - 6, 10, ol('#151D3E', 6)) + R(8, 10, WALL.w - 22, WALL.h - 26, 4, { fill: 'url(#farmRackFar)' }) + R(8, 4, WALL.w - 22, 6, 3, { fill: '#FF5A6E' }), `translate(${f(fx)} ${f(fy)}) rotate(${f(30 * (1 - k) * (i % 2 ? 1 : -1))})`);
  }
  return o;
}
function shot14(t) {
  const u = seg(t, s14, s15);
  const cam = E.shakes(K.camKeys(t, [[s14, camAt(1000, 520, 1.05)], [s15, camAt(1020, 520, 1.12)]]), t, [[tBuilder, 0.4, 12]]);
  const tb = (i) => s14 + 0.4 + i * 0.075;
  const built = (i) => ease.out(seg(t, tb(i), tb(i) + 0.14));
  const back = lagSprite(t, { x: 300, y: 300, size: 1.9, mood: 'hungry', glitch: 0.2, speak: false, look: [1, 0.4] }) + lagAura(t, 300, 300, 1.8, 0.7, 2, 6);
  const pose = t > tBuilder - 0.1 ? { armL: 28, armR: 28, lean: 4, turn: -0.2 } : { armL: 40 + 80 * Math.abs(Math.sin(t * 14)), armR: 100 + 50 * Math.sin(t * 14), turn: -0.5 };
  let chars = who('juno', t, { x: 1380, y: FL, s: 0.55, ...pose, face: t > tBuilder - 0.1 ? 'smug' : 'determined' }, { arms: false }, SOOT);
  chars += wallPanels(t, built);
  let o = coreShot(t, cam, { alarm: 1, timer: clockAt(t) }, chars, { back, backK: 0.8 });
  for (let i = 0; i < 16; i += 3) { const tt = tb(i) + 0.14; if (t > tt && t < tt + 0.35) { const r = Math.floor(i / 4), c = i % 4; o += K.view(cam, C.dust(WALL.x - 320 + c * 160, FL - r * 140, tt, t) + K.bang('THUNK', WALL.x - 240 + c * 160, FL - r * 140 - 100, seg(t, tt, tt + 0.08), 34, -6, '#FFFFFF'), 1); } }
  if (t > tBuilder) o += K.view(cam, K.sparkles([[1380, 300, 30], [1300, 340, 20], [1460, 360, 22]], t) + C.burst(1380, 380, seg(t, tBuilder, tBuilder + 0.5)), 1);
  return o;
}
// S15: "Wall... not... loaded." — the Lag phases through it
function shot15(t) {
  const u = seg(t, s15, s16);
  const cam = K.camKeys(t, [[s15, camAt(980, 500, 0.95)], [s16, camAt(1000, 500, 1.0)]]);
  const lx = lerp(250, 1250, ease.inOut(u));
  let chars = who('juno', t, { x: 1560, y: FL, s: 0.55, turn: -0.6, armL: 30 + 40 * u, armR: 30 + 40 * u, lean: 6 * u, face: { name: 'shocked', eyes: { look: [-1, 0] } } }, { arms: false }, SOOT);
  chars += wallPanels(t, () => 1, 1, lx);
  chars += G(lagSprite(t, { x: lx, y: 520, size: 1.5, mood: 'neutral', glitch: 0.45, look: [1, 0], fps: 6 }), null, { opacity: 0.85 }) + lagAura(t, lx, 520, 1.4, 0.8, 4, 6);
  let o = coreShot(t, cam, { alarm: 1, timer: clockAt(t) }, chars);
  const wk = seg(t, M[9].a, M[9].a + 0.2);
  if (wk > 0) o += K.view(cam, G(R(-170, -30, 340, 60, 16, { fill: '#10131C', opacity: 0.85 }) + K.loadingWheel(-130, 0, 16, t, '#FFFFFF', 8, 4) + TF('LOADING WALL...', 20, 11, 28, '#FFFFFF'), `translate(${WALL.x} ${FL - 470})`), 1);
  return o;
}
// S16: "Oh, come ON!"
function shot16(t) {
  const cam = K.camKeys(t, [[s16, camAt(1500, 540, 1.85)], [s17, camAt(1500, 530, 1.95)]]);
  const throwUp = seg(t, M[10].word('come').t0, M[10].word('ON').t0);
  const hat = bump(t, M[10].word('ON').t0, M[10].word('ON').t0 + 0.35) * 40;
  let chars = who('juno', t, { x: 1500, y: FL, s: 0.55, turn: 0.1, armL: lerp(40, 160, throwUp), armR: lerp(40, 160, throwUp), headY: -hat, bodyY: -10 * throwUp, face: 'angry' }, { arms: false }, SOOT);
  return coreShot(t, cam, { alarm: 1, timer: clockAt(t) }, chars);
}
// S17: the wall timer: 00:14:xx → 00:05:00
function shot17(t) {
  const cam = E.shakes({ zoom: 2.0, x: 0, y: -700 }, t, [[tFive, 0.5, 16]]);
  let o = coreShot(t, cam, { alarm: 1, timer: clockAt(t) }, '');
  if (Math.abs(t - tFive) < 0.25) o += K.ghost('', 0) + S.rect(0, 0, 1920, 1080, 0, { fill: '#FF2E4D', opacity: 0.12 });
  const pk = seg(t, tFive + 0.05, tFive + 0.35);
  o += K.popup(960, 780, 820, 220, 'SYSTEM', ['Shutdown in 5 minutes.'], pk, { size: 46 });
  return o + E.flashAt(t, tFive, 0.35);
}
// S18: "Thanks for playing! Smiley face." — he grows, swallows the lamps, everything pixelates
function shot18(t) {
  const u = seg(t, s18, s19);
  const la = E.lowAngle(t, { alarm: 1, lamps: 1 - u, lowRes: 0.6 * u });
  let mid = lagAura(t, 960, 420, lerp(1.9, 2.5, u), 1, 5, 10) + lagSprite(t, { x: 960, y: 420 - 40 * u, size: lerp(1.9, 2.5, ease.inOut(u)), mood: 'hungry', glitch: 0.3, speak: false, look: [0, 0.4] });
  mid += K.pixelBlocks(0, 0, 1920, 400, t, 0.4 * u, '#8A93A6', 80, 7);
  let o = la.bg + mid + la.fg;
  const pk = seg(t, s18 + 0.05, s18 + 0.35);
  o += K.popup(960, 760, 760, 200, 'SYSTEM', ['Thanks for playing! :)'], pk, { size: 46 });
  if (t > M[11].word('Smiley').t0) o += G(CI(0, 0, 60, ol('#FFE14D', 8)) + CI(-20, -12, 8, { fill: '#151515' }) + CI(20, -12, 8, { fill: '#151515' }) + P('M-30 12 Q0 44 30 12', ln(8)), `translate(1310 690) scale(${f(pop(seg(t, M[11].word('Smiley').t0, M[11].word('Smiley').t0 + 0.25)))})`);
  return o;
}
// S19: Grandpa swings the mop — it loads into pixels and vanishes into the Lag
function shot19(t) {
  const cam = E.shakes(K.camKeys(t, [[s19, camAt(1100, 460, 1.3)], [s20, camAt(1080, 460, 1.4)]]), t, [[tEat, 0.4, 12]]);
  const swing = ease.in(seg(t, s19 + 0.15, tEat));
  const eat = seg(t, tEat, tEat + 0.45);
  const a = lerp(175, 45, swing);
  const cut = 600 * eat;
  let mopSvg = '';
  if (eat <= 0) mopSvg = E.mopInArm(a, 90, 760, 0.75);
  else mopSvg = G(G(R(-11, -760, 22, 760 - cut, 8, ol('#B07A45', 6)) + K.pixelBlocks(-45, -cut - 50, 90, 90, t, 0.9, '#8A93A6', 26, 3), `rotate(90) translate(0 ${760 * 0.75})`), `translate(4 -505) rotate(${f(a)}) translate(0 250)`);
  const lx = 620;
  let chars = lagAura(t, lx, 430, 1.7, 1, 6, 7) + lagSprite(t, { x: lx, y: 430, size: 1.7, mood: eat > 0 ? 'hungry' : 'neutral', glitch: 0.3, speak: false, look: [1, 0.4], mouth: eat > 0 && eat < 0.8 ? 'O' : null });
  chars += who('grandpa', t, { x: 1330, y: FL, s: 0.6, view: 'side', armL: a, armR: lerp(160, 30, swing), lean: lerp(10, -12, swing), legL: 20, legR: -20, kneeL: 10, face: eat > 0 ? 'shocked' : 'determined', props: [{ svg: mopSvg, layer: 'front' }] }, { arms: false });
  let o = coreShot(t, cam, { alarm: 1, timer: clockAt(t), lowRes: 0.4 }, chars);
  if (eat > 0.3) o += K.view(cam, K.bang('*GULP*', lx + 180, 220, seg(t, tEat + 0.15, tEat + 0.3), 60, -8, '#D6DBE4'), 1);
  return o;
}
// S20: "He ate my MOP!"
function shot20(t) {
  const cam = E.shakes(K.camKeys(t, [[s20, camAt(1330, 440, 2.0)], [s21, camAt(1330, 430, 2.15)]]), t, [[M[12].word('MOP').t0, 0.4, 14]]);
  let chars = who('grandpa', t, { x: 1330, y: FL, s: 0.6, turn: -0.2, armL: 70, armR: 80, face: 'shocked', keysSwing: 10 * Math.sin(t * 9), props: [{ svg: G(R(-11, -200, 22, 200, 8, ol('#B07A45', 6)) + K.pixelBlocks(-30, -260, 60, 60, t, 0.7, '#8A93A6', 18, 2), 'translate(250 -330) rotate(20)'), layer: 'front' }] }, { arms: false, energy: 1.4 });
  return coreShot(t, cam, { alarm: 1, timer: clockAt(t), lowRes: 0.4 }, chars);
}
// S21: Juno thinks out loud with Grandpa — red traffic behind them
function shot21(t) {
  const u = seg(t, s21, s22);
  const cam = K.camKeys(t, [[s21, camAt(1000, 470, 1.4)], [s22, camAt(1000, 470, 1.55)]]);
  let chars = who('grandpa', t, { x: 1220, y: FL, s: 0.56, turn: -0.5, armL: 14, armR: 14, face: { name: 'sad', eyes: { look: [-1, 0] } } }, { arms: false });
  chars += who('juno', t, { x: 800, y: FL + 10, s: 0.55, turn: t < M[13].word('Everybody').t0 ? 0.55 : 0.1, armL: 20, armR: t < tEvery ? 120 : 30 }, { arms: false, energy: 0.6 }, SOOT);
  const trf = t > tEvery - 0.2 ? E.traffic(t, [[-200, 300], [-200, 160], [2200, 260]], 1000, -400, seg(t, tEvery - 0.2, tEvery + 0.3), '#FF5A6E', 4) : '';
  return coreShot(t, cam, { alarm: 1, timer: clockAt(t), lowRes: 0.25 }, chars, { over: trf });
}
// S22: "What if there was NO traffic?" — the idea lands
function shot22(t) {
  const u = seg(t, s22, s23);
  const cam = K.camKeys(t, [[s22, camAt(800, 510, 2.0)], [s23, camAt(800, 500, 2.3)]]);
  const idea = t > tNo - 0.05;
  let chars = who('juno', t, { x: 800, y: FL + 10, s: 0.55, turn: 0.15, armL: 20, armR: idea ? 150 : 40, face: idea ? { name: 'amazed', eyes: { type: 'star' } } : { name: 'confused', eyes: { look: [0.6, -0.6] } } }, { arms: false, energy: 0.6 }, SOOT);
  let o = coreShot(t, cam, { alarm: 1, timer: clockAt(t), lowRes: 0.25 }, chars);
  if (idea) o += C.burst(1180, 260, seg(t, tNo, tNo + 0.6), '#FFE14D') + K.sparkles([[1150, 230, 30], [760, 200, 24]], t);
  void u;
  return o;
}
// S23: the blueprint: traffic 0 → no food → 10 seconds
function shot23(t) {
  const u = seg(t, s23, s24);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1E4D8C' });
  let grid = '';
  for (let x = 0; x <= 1920; x += 60) grid += `M${x} 0 L${x} 1080 `;
  for (let y = 0; y <= 1080; y += 60) grid += `M0 ${y} L1920 ${y} `;
  o += P(grid, ln(2, '#3A6AB0'));
  const draw = (k, svg) => (k > 0 ? G(svg, null, { opacity: f(Math.min(1, k * 3)) }) : '');
  const W = '#EAF4FF';
  // map with dots → 0
  const k1 = seg(t, s23 + 0.1, s23 + 0.7);
  o += draw(k1, G(R(-240, -140, 480, 280, 20, { fill: 'none', stroke: W, 'stroke-width': 6, 'stroke-dasharray': '18 10' }) + TF('TRAFFIC', 0, -160, 40, W) + T(t > M[14].word('forever').t0 ? '0' : '∞', 0, 50, 150, '#FFE14D'), 'translate(420 470)'));
  // arrow → the Lag drawn in chalk, hungry → shrinking
  const k2 = seg(t, s23 + 0.6, s23 + 1.2);
  o += draw(k2, P('M700 470 L900 470 M870 440 L900 470 L870 500', ln(10, W)));
  const shrink = seg(t, tTen - 0.3, tTen + 0.6);
  o += draw(k2, G(lagSprite(t, { x: 0, y: 0, size: 1, mood: shrink > 0.5 ? 'scared' : 'hungry', glitch: 0, speak: false, fps: 0 }), `translate(1160 470) scale(${f(lerp(0.9, 0.35, shrink))})`, { opacity: 0.9 }));
  // stopwatch: 10 SEC
  const k3 = seg(t, tTen - 0.15, tTen + 0.25);
  if (k3 > 0) o += G(CI(0, 0, 130, { fill: 'none', stroke: '#FFE14D', 'stroke-width': 12 }) + R(-24, -170, 48, 40, 8, { fill: '#FFE14D' }) + P(`M0 0 L${f(100 * Math.sin(t * 6))} ${f(-100 * Math.cos(t * 6))}`, ln(10, '#FFE14D')) + T('10 SEC', 0, 210, 70, '#FFE14D'), `translate(1600 430) scale(${f(pop(k3))})`);
  // Juno sketching (front, bottom-left)
  o += who('juno', t, { x: 230, y: 1300, s: 0.75, turn: 0.5, armR: 110 + 15 * Math.sin(t * 12), armL: 20, face: 'determined', shadow: false }, { arms: false, energy: 0.5 }, SOOT);
  void u;
  return o;
}
// S24: Grandpa realises
function shot24(t) {
  const u = seg(t, s24, s25);
  const cam = K.camKeys(t, [[s24, camAt(1220, 450, 1.9)], [s25, camAt(1220, 440, 2.15)]]);
  const real = seg(t, M[15].word('same').t0 - 0.2, M[15].word('same').t0 + 0.2);
  let chars = who('grandpa', t, { x: 1220, y: FL, s: 0.56, turn: -0.15, armL: 14, armR: lerp(20, 120, real), keysSwing: 12 * Math.sin(t * 7) * real, face: real > 0.5 ? { name: 'amazed', eyes: { look: [0, -0.3] } } : { name: 'confused', eyes: { look: [-0.5, -0.5] } } }, { arms: false, energy: 0.6 });
  let o = coreShot(t, cam, { alarm: 1, timer: clockAt(t), lowRes: 0.25 }, chars);
  // thought bubble: the map with the dots blinking out
  const tk = pop(seg(t, s24 + 0.3, s24 + 0.6));
  if (tk > 0) {
    let b = EL(0, 0, 330, 200, ol('#FFFFFF', 7)) + CI(-240, 230, 26, ol('#FFFFFF', 6)) + CI(-290, 280, 14, ol('#FFFFFF', 5));
    const n = 1 - seg(t, M[15].word('logged').t0, M[15].word('time').t0);
    b += F.worldMap(-260, -150, 520, 293, t, { dots: Math.max(0.001, n), spam: false, online: n < 0.01 ? '0' : null });
    o += G(b, `translate(620 300) scale(${f(tk * 0.9)})`);
  }
  void u;
  return o;
}
// S25: "...he'd have nothing to eat." — he chomps on empty air
function shot25(t) {
  const u = seg(t, s25, s26);
  const la = E.lowAngle(t, { alarm: 1, lamps: 0, lowRes: 0.3 });
  const gone = seg(t, s25 + 0.1, s25 + 0.6);
  let mid = E.slurp(t, [[560, 1060], [1360, 1080], [1700, 860], [240, 880]], 960, 560, { w: 42, drop: gone }) ;
  const chomp = Math.floor(t * 4) % 2 ? 'O' : 'X';
  mid += lagAura(t, 960, 400, 2.1, 1, 9, 8) + lagSprite(t, { x: 960, y: 400, size: 2.1, mood: 'neutral', glitch: 0.2, speak: false, mouth: gone > 0.6 ? chomp : null, look: [0, 0.6] });
  if (gone > 0.7) mid += T('?', 1420, 220, 160, '#FFE14D', OUT(14));
  return la.bg + K.view({ zoom: lerp(1, 1.05, u), x: 0, y: 0 }, mid, 1) + la.fg;
}
// S26: Dex — "Nobody logs off! Not on the LAST DAY!"
function shot26(t) {
  const cam = K.camKeys(t, [[s26, camAt(260, 420, 1.45)], [s27, camAt(260, 420, 1.6)]]);
  let chars = who('dex', t, { x: 230, y: FL, s: 0.56, turn: 0.4, face: 'shocked' }, { energy: 1.8 });
  chars += C.dust(150, FL - 300, s26, t);
  return coreShot(t, cam, { alarm: 1, timer: clockAt(t), lowRes: 0.2 }, chars);
}
// S27: Juno — "Then we ask. Everyone." → S28 whip to the control wall: "At once."
function shot27(t) {
  const cam = K.camKeys(t, [[s27, camAt(820, 520, 1.9)], [s28, camAt(860, 515, 2.05)]]);
  const point = seg(t, M[17].word('Everyone').t0 - 0.2, M[17].word('Everyone').t0 + 0.1);
  let chars = who('juno', t, { x: 820, y: FL + 10, s: 0.55, turn: lerp(0.2, 0.7, point), armR: lerp(30, 95, point), armL: 20, face: 'determined' }, { arms: false, energy: 0.5 }, SOOT);
  return coreShot(t, cam, { alarm: 1, timer: clockAt(t), lowRes: 0.15 }, chars);
}
function shot28(t) {
  const cam = K.camKeys(t, [[s28, camAt(2800, 520, 0.9)], [s28 + 0.2, camAt(3150, 500, 1.0)], [END, camAt(3450, 400, 1.45)]]);
  const glow = seg(t, tOnce, tOnce + 0.3);
  let o = coreShot(t, cam, { alarm: 1, timer: clockAt(t), broadcast: 0, pressed: glow > 0 ? [189, 190, 209, 210] : [] }, '');
  if (glow > 0) o += K.view(cam, CI(CORE.button.x, 330, 300, { fill: 'url(#farmGlowWarm)', opacity: f(0.6 * glow) }) + K.rays(CORE.button.x, 330, 14, 420, '#FFF4C8', 0.25 * glow, t * 30), 1);
  return o + E.whip(t, s28, 1, 0.14);
}

// ---------------------------------------------------------------- router
function scene(t) {
  E.STATE.wall = false;
  if (t < s2) return shot1(t);
  if (t < s3) return shot2(t);
  if (t < s4) return shot3(t);
  if (t < s5) return shot4(t);
  if (t < s6) return shot5(t);
  if (t < s7) return shot6(t);
  if (t < s8) return shot7(t);
  if (t < s9) return shot8(t);
  if (t < s10) return shot9(t);
  if (t < s11) return shot10(t);
  if (t < s12) return shot11(t);
  if (t < s13) return shot12(t);
  if (t < s14) return shot13(t);
  if (t < s15) return shot14(t);
  if (t < s16) return shot15(t);
  if (t < s17) return shot16(t);
  if (t < s18) return shot17(t);
  if (t < s19) return shot18(t);
  if (t < s20) return shot19(t);
  if (t < s21) return shot20(t);
  if (t < s22) return shot21(t);
  if (t < s23) return shot22(t);
  if (t < s24) return shot23(t);
  if (t < s25) return shot24(t);
  if (t < s26) return shot25(t);
  if (t < s27) return shot26(t);
  if (t < s28) return shot27(t);
  return shot28(t);
}
// cameras with the wall timer in view → hide the HUD
const WALLCAM = [[s2, s3], [s17, s18]];
function timer(t) {
  if (E.STATE.wall) return null;
  if (WALLCAM.some(([a, b]) => t >= a && t < b)) return null;
  if (t >= s23 && t < s24) return null;          // the blueprint: Juno's imagination
  const near = t < s4 || (t >= s9 && t < s11) || (t >= s18 && t < s19) || (t >= s25 && t < s26);
  return { sec: secAt(t), glitch: Math.abs(t - tFive) < 0.4 ? 1 : near ? 0.35 : 0 };
}
const look = (t) => (t >= s23 && t < s24 ? { grade: null, vignette: 0.5 } : { grade: 'cool', vignette: 1 });

module.exports = { scene, timer, look, secAt };
