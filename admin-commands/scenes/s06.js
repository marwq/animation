// SC 06 · CITY IN CHAOS — Saturday, sunset → night. "Think bigger": ";fly all" → a green shockwave and the whole town lifts
// off (montage on the narrator's list: the mailman, a bus, a guy in his bath). Pancake floats asleep next to YOU; you mean
// ";size pancake 2" but type ";size all cats 100" without looking → TYPO → SYSTEM: command accepted, 100,000 cats →
// every cat in the city balloons: a black cat curled up in the stadium, Pancake licking his paw on the tallest tower (≡ SC 01),
// a calico batting the NEWS 7 blimp like a ball of yarn, and (silent beat) a grey cat slowly pushing the water tower off its
// roof while staring at us. "I'm the king of the city!" on the rooftop → pull back across the flying city. Zoe flies up with
// the log counter. Rex Ratings' breaking news (Granny footage, the giant paw on the studio window, the cat sitting on the
// mayor) → "Who is doing this?" → YOU, caught, floating with the laptop (≡ SC 01): ";unfly all", ";size all cats 1" →
// PERMISSION DENIED ×2 → ADMIN RIGHTS UNDER REVIEW → the camera tilts up and the sky cracks (the Admin himself is SC 07).
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, actor } = K;
const { L } = K.V;
const C = K.C;
const CS = require('./city');
const SETS = require('./sets');
const CATS = require('../rig/cats');
const AC = require('./acting');
const E = require('./s06_env');
const { CITY, KF, ROOF } = CS;
const { pop, camOn, scr, withShake, whip, flash, punch, zoomAt, outT, outTF } = E;

const START = K.V.scene('SC 06').start, END = K.V.scene('SC 07').start;
const m = Array.from({ length: 13 }, (_, i) => L('06.' + i));
const w = (i, word, n = 0) => m[i].word(word, n).t0;
const w1 = (i, word, n = 0) => m[i].word(word, n).t1;

// ---------------------------------------------------------------- beats (all from the voice)
const t2 = w(0, 'You') - 0.1;                     // rooftop: "You decide to think bigger."
const tBigger = w(0, 'bigger');
const t3 = m[1].a - 0.12;                         // close-up: ";fly all" typed on "Fly... ALL!"
const tFlyEnter = m[1].b + 0.04;
const t4 = m[2].a - 0.08;                         // wide: the whole town takes off
const tOff = w1(2, 'off');
const t5 = w(2, 'Including') - 0.1;               // the mailman
const t6 = w(2, 'Including', 1) - 0.1;            // a bus
const t7 = w(2, 'Including', 2) - 0.1;            // the guy in the bath
const tBath = w(2, 'bath');
const t8 = m[3].a - 0.08;                         // Pancake floating asleep next to YOU
const tBigAgain = w(3, 'big');
const t9 = w(3, 'Just') - 0.1;                    // typing without looking
const tTypoEnter = w1(3, 'little') + 0.22;
const t10 = w(3, 'But') - 0.1;                    // smash zoom: TYPO
const tTypo = w(3, 'typo');
const t11 = m[4].a - 0.08;                        // laptop screen: command accepted, cats found
const t12 = w(4, 'One') - 0.1;                    // wide: every cat balloons on "hundred"
const tHundred = w(4, 'hundred');
const t13 = m[5].a - 0.06;                        // the stadium cat
const t14 = w(5, 'in') - 0.05;                    // Pancake on the tower
const t15 = w(5, 'One') - 0.1;                    // the blimp, batted like yarn
const t16 = m[5].b - 0.05;                        // (silent beat) the water tower
const t17 = m[6].a - 0.08;                        // "I'm the king of the city!"
const t18 = w(6, "I'm", 1) - 0.1;                 // pull back: ADMIN OF EVERYTHING
const tEverything = w(6, 'EVERYTHING');
const t19 = m[7].a - 0.08;                        // Zoe flies up
const t20 = w(7, 'Somebody') - 0.1;               // Zoe close-up
const tDef = w(7, 'DEFINITELY');
const t21 = m[8].a - 0.08;                        // news studio
const t22 = w(8, 'Grandmas') - 0.1;               // footage: Granny
const tBarrier = w(8, 'barrier');
const t23 = w(8, 'And') - 0.1;                    // studio: the paw on the glass
const tGiant = w(8, 'giant');
const t24 = w(8, 'on') - 0.12;                    // footage: the cat on the mayor
const t25 = m[9].a - 0.08;                        // anchor: "Experts are asking one question."
const t26 = w(9, 'Who') - 0.12;                   // anchor ECU: "Who is doing this?"
const t27 = w(9, 'this');                         // YOU, caught (≡ SC 01)
const t28 = w(10, 'Un-fly') - 0.14;               // close-up: both commands
const tE1 = w1(10, 'all') + 0.06, tE2 = m[10].b + 0.05;
const t29 = m[11].a - 0.06;                       // DENIED ×2
const tD1 = m[11].a, tD2 = w(11, 'Permission', 1);
const t31 = w(11, 'Your') - 0.08;                 // ADMIN RIGHTS UNDER REVIEW
const t32 = m[12].a - 0.06;                       // the sky… cracked
const tSky = w(12, 'sky'), tCracked = w(12, 'cracked');

// time of day: sunset (.5) → night (1) by the time you're caught
const tod = (t) => 0.5 + 0.5 * ease.inOut(seg(t, START, t27 - 2));

// ---------------------------------------------------------------- small UI helpers
function titleCard(txt, x, y, k, t, col = '#FFE14D') {
  if (k <= 0) return '';
  let o = K.rays(0, 0, 12, 260, '#FFF1B8', 0.28, t * 25);
  o += outT(txt, 0, 34, 130, col, 18) + K.sparkles([[-330, -60, 26], [330, -40, 22], [260, 70, 14]], t);
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(-4) scale(${f(pop(k))})`);
}
function thought(x, y, k, inner, s = 1) {
  if (k <= 0) return '';
  let o = S.circle(-150, 150, 16, ol('#FFFFFF', 5)) + S.circle(-110, 110, 24, ol('#FFFFFF', 5));
  o += S.path('M-160 40 Q-200 -60 -110 -90 Q-60 -170 40 -140 Q130 -180 180 -100 Q260 -60 220 30 Q240 110 150 120 Q80 170 -10 130 Q-120 150 -160 40 Z', ol('#FFFFFF', 6));
  o += inner;
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s * pop(k))})`);
}
// the hero standing on the rooftop with the laptop held in front
function heroRoof(t, x, y, s, o = {}) {
  const lap = SETS.laptop(0, -300, 0.42, SETS.adminScreen(t, o.screen || {}), { t, glow: 0.7, dust: 0 });
  const pose = { x, y, s, armL: o.armL ?? 22, armR: o.armR ?? 22, turn: o.turn || 0, headRot: o.headRot, props: o.noLap ? [] : [{ svg: lap, layer: 'front' }], volume: o.volume, lean: o.lean || 0 };
  if (o.face) pose.face = o.face;
  return actor('you', t, pose, { arms: false, energy: o.energy ?? 1 });
}

// ---------------------------------------------------------------- 1. "Saturday." — the calm city at sunset
function shot1(t) {
  const u = seg(t, START, t2);
  const cam = { zoom: lerp(1.0, 1.05, ease.inOut(u)), x: lerp(-60, 40, u), y: -120 };
  const HR = CITY.heroRoof;
  let o = E.chaosWide(t, cam, {
    time: tod(t), flying: 0, popups: 0, grow: 0, cage: false, dad: false, granny: true, blimp: true, waterFall: 0, flyNear: false,
    hero: { x: HR.x - 40, y: HR.y, s: 0.1, legs: 'stand', bob: 0, typing: 0, face: 'smug' }, heroK: KF.near,
  });
  o += titleCard('SATURDAY', 960, 260, seg(t, START, START + 0.3), t);
  return o;
}

// ---------------------------------------------------------------- 2. "You decide to think bigger." — the rooftop
function shot2(t) {
  const u = seg(t, t2, t3);
  const z = lerp(1.0, 1.25, ease.inOut(u)) * punch(t, tBigger, 0.12);
  const cam = { zoom: z, x: 0, y: lerp(-20, -150, ease.inOut(u)) };
  const L0 = CS.rooftop(t, cam, { time: tod(t), flying: 0, popups: 0, blimp: true });
  const grin = t >= tBigger;
  let ch = heroRoof(t, 960, ROOF.floor, 0.62, { face: grin ? { name: 'smug', fx: ['sparkles'] } : 'smug', screen: { lines: [';fly me', ';speed Granny', ';jail Brick'], typed: '' }, energy: 0.6 });
  let o = L0.bg + L0.mid + K.view(cam, ch, 1) + L0.fg + L0.light;
  if (grin) o += K.sparkles([[1180, 260, 40 * pop(seg(t, tBigger, tBigger + 0.2))], [760, 330, 26]], t);
  o += whip(t, t2, 1);
  return o;
}

// ---------------------------------------------------------------- 3. "Fly... ALL!" — typed on his words, ENTER
function shot3(t) {
  const z = 1.0 * punch(t, w(1, 'ALL'), 0.16) * punch(t, tFlyEnter, 0.08);
  const cam = withShake({ zoom: 1.0, x: 0, y: -60 }, t, [[tFlyEnter, 0.5, 18]]);
  const L0 = CS.rooftop(t, cam, { time: tod(t), flying: 0, popups: 0, blimp: true });
  const prog = K.typeProgress(t, m[1], 'Fly', 'ALL');
  const ent = seg(t, tFlyEnter, tFlyEnter + 0.3);
  let ch = heroRoof(t, 700, 1380, 1.0, { volume: false, face: t > w(1, 'ALL') ? { name: 'excited', eyes: { type: 'star' } } : 'determined', screen: { lines: [';jail Brick'], typed: ';fly all'.slice(0, Math.round(prog * 8)) }, energy: 1.4 });
  let o = L0.bg + L0.mid + K.view(cam, ch, 1) + L0.fg + L0.light;
  let ui = K.chatCommand(1330, 330, ';fly all', prog, { t, enter: ent, s: 1.6 });
  ui += K.commandBurst(1330, 330, t - tFlyEnter, '#3DFF9A', 360);
  o += ui;
  o = zoomAt(o, z, 900, 520);
  o += flash(t, tFlyEnter, 0.14, 0.6, '#B8FFD8');
  o += whip(t, t3, -1);
  return o;
}

// ---------------------------------------------------------------- 4. "The whole town took off." — the shockwave
function shot4(t) {
  const u = seg(t, t4, t5);
  const fly = ease.inOut(seg(t, t4 + 0.1, tOff + 0.2));
  const cam = withShake({ zoom: lerp(1.25, 1.0, ease.out(u)), x: lerp(180, 20, ease.out(u)), y: lerp(-40, -200, ease.inOut(u)) }, t, [[t4, 0.7, 14]]);
  const HR = CITY.heroRoof;
  const cageUp = seg(t, t4 + 0.8, t5);
  let o = E.chaosWide(t, cam, {
    time: tod(t), flying: fly, popups: 0.55 * seg(t, tOff - 0.6, t5), grow: 0, cage: cageUp > 0.5, dad: false, blimp: true, waterFall: 0,
    hero: { x: HR.x - 40, y: HR.y, s: 0.1, legs: 'stand', bob: 0, typing: 0, armsUp: 0, face: 'excited' }, heroK: KF.near,
  });
  // green shockwave from the hero's roof
  const p = scr(cam, { x: HR.x - 40, y: HR.y - 60, k: KF.near });
  const age = t - (t4 + 0.02);
  if (age >= 0 && age < 1.4) {
    const q = ease.out(age / 1.4);
    o += S.ellipse(p.x, p.y, 80 + 2600 * q, 30 + 900 * q, { fill: 'none', stroke: '#3DFF9A', 'stroke-width': f(40 * (1 - q) + 4), opacity: f(0.85 * (1 - q)) });
    o += S.ellipse(p.x, p.y, 40 + 1700 * q, 16 + 560 * q, { fill: '#3DFF9A', opacity: f(0.12 * (1 - q)) });
  }
  o += K.commandBurst(p.x, p.y, age, '#3DFF9A', 220);
  return o;
}

// ---------------------------------------------------------------- 5–7. "Including the mailman / a bus / a guy who was in the bath"
function riseBg(t, t0, t1, tilt = 260) {
  const u = ease.inOut(seg(t, t0, t1));
  const cam = { zoom: 1.08, x: 0, y: -40 - tilt * u };
  const X = E.midExtras(t, { grow: 0, cage: true, pancake: false });
  return { cam, L: CS.rooftop(t, cam, { time: tod(t), flying: 1, popups: 0.6, flyNear: false, blimp: true, onMid: X.onMid }) };
}
function shot5(t) {
  const { cam, L: L0 } = riseBg(t, t5, t6);
  const r = ease.out(seg(t, t5, t5 + 1.1));
  const x = 960 + Math.sin(t * 1.3) * 30, y = lerp(1700, 900, r) + Math.sin(t * 2.2) * 12;
  let o = L0.bg;
  o += CS.dog(1500, lerp(1300, 520, ease.out(seg(t, t5 + 0.3, t6))), 1.3, -12 + Math.sin(t * 3) * 8, { t, col: '#F2F2F2' });
  o += CS.mailman(x, y, 0.5, { t, rot: Math.sin(t * 1.7) * 8 - 6, letters: 1, face: 'shock' });
  o += L0.fg + L0.light;
  o += whip(t, t5, 1);
  return o;
}
function shot6(t) {
  const { cam, L: L0 } = riseBg(t, t6, t7, 200);
  const r = ease.out(seg(t, t6, t6 + 1.3));
  const x = lerp(600, 980, r), y = lerp(1500, 760, r);
  let o = L0.bg;
  o += CS.flyer(320, lerp(1250, 420, ease.out(seg(t, t6 + 0.2, t7))), 1.6, 18, { t, seed: 3 }) + CS.flyer(1650, lerp(1300, 300, ease.out(seg(t, t6, t7))), 1.4, -12, { t, seed: 6 });
  o += CS.bus(x, y, 1.05, -8 + Math.sin(t * 1.6) * 4, { t, wave: 1, lights: 0.4 });
  o += L0.fg + L0.light;
  o += K.bang('BUS?!', 1500, 240, seg(t, w(2, 'bus'), w(2, 'bus') + 0.15) * (1 - seg(t, t7 - 0.2, t7)), 110, 8, '#FFB52E');
  o += whip(t, t6, -1);
  return o;
}
function shot7(t) {
  const { cam, L: L0 } = riseBg(t, t7, t8, 160);
  const r = ease.out(seg(t, t7, t7 + 1.4));
  const x = 980 + Math.sin(t * 0.9) * 20, y = lerp(1700, 860, r) + Math.sin(t * 1.8) * 10;
  const calm = t >= tBath;
  let o = L0.bg;
  o += CS.bathtubGuy(x, y, 0.62, Math.sin(t * 1.1) * 4, { t, face: calm ? 'happy' : 'shock' });
  if (calm) o += C.musicNotes(t, x + 330, y - 520);
  o += L0.fg + L0.light;
  o += whip(t, t7, 1);
  return o;
}

// ---------------------------------------------------------------- 8–9. Pancake floating asleep; typing without looking
function pancakeFloat(t, x, y, s) {
  return CATS.pancake({ x, y: y + Math.sin(t * 1.6) * 12, s, t, pose: 'sleep', rot: Math.sin(t * 0.8) * 6, shadow: false });
}
function shot8(t) {
  const u = seg(t, t8, t9);
  const cam = { zoom: lerp(1.05, 1.14, u), x: lerp(-30, 10, u), y: -60 };
  const X = E.midExtras(t, { grow: 0, cage: true });
  const L0 = CS.rooftop(t, cam, { time: tod(t), flying: 1, popups: 0.6, flyNear: false, blimp: true, onMid: X.onMid });
  let ch = heroRoof(t, 760, ROOF.floor, 0.62, { turn: 0.3, face: { name: 'happy', eyes: { look: [0.8, -0.2] } }, screen: { lines: [';fly all', 'Everyone is flying!'] }, energy: 0.4 });
  ch += pancakeFloat(t, 1220, 600, 0.95);
  let o = L0.bg + L0.mid + K.view(cam, ch, 1) + L0.fg + L0.light;
  // "big again… just a little": a thought bubble with what he MEANS to type
  const tk = seg(t, tBigAgain - 0.15, tBigAgain + 0.1);
  o += thought(560, 250, tk, CATS.pancake({ x: -40, y: 50, s: 0.42, t, pose: 'sit', mood: 'smug' }) + outTF(';size pancake 2', 60, 100, 34, '#3A7BFF', 6), 1.1);
  o += whip(t, t8, -1);
  return o;
}
function shot9(t) {
  const u = seg(t, t9, t10);
  const cam = { zoom: 1.0, x: 0, y: -80 };
  const L0 = CS.rooftop(t, cam, { time: tod(t), flying: 1, popups: 0.6, flyNear: false, blimp: true });
  const prog = seg(t, t9 + 0.1, tTypoEnter - 0.08);
  const typed = ';size all cats 100'.slice(0, Math.round(prog * 18));
  let ch = heroRoof(t, 640, 1360, 0.98, { volume: false, turn: 0.35, headRot: 6, face: { name: 'happy', eyes: { look: [1, -0.3] } }, screen: { lines: [';fly all'], typed }, energy: 0.3 });
  ch += pancakeFloat(t, 1540, 760, 1.15);
  let o = L0.bg + L0.mid + K.view(cam, ch, 1) + L0.fg + L0.light;
  o += K.chatCommand(1180, 210, ';size all cats 100', prog, { t, enter: seg(t, tTypoEnter, tTypoEnter + 0.3), s: 1.25 });
  o += thought(380, 210, 1, outTF(';size pancake 2', 20, 20, 40, '#3A7BFF', 6), 0.8);
  o += whip(t, t9, 1);
  void u;
  return o;
}

// ---------------------------------------------------------------- 10. "But you made a typo." — smash zoom on the chat
function shot10(t) {
  const L0 = CS.rooftop(t, { zoom: 1.4, x: 120, y: -200 }, { time: tod(t), flying: 1, popups: 0.6, flyNear: false });
  let o = L0.bg + L0.mid + L0.fg + L0.light + S.rect(0, 0, 1920, 1080, 0, { fill: '#0C0A2A', opacity: 0.55 });
  const z = punch(t, t10, 0.25, 0.08) * (1 + 0.04 * seg(t, t10, t11));
  let ui = K.chatCommand(960, 520, ';size all cats 100', 1, { t, s: 2.3, cursor: false });
  // what he meant, in grey above; red marker circles around the typo
  ui += outTF('meant: ;size pancake 2', 960, 330, 52, '#9AA6C0', 8);
  const mk = seg(t, tTypo - 0.35, tTypo + 0.1);
  // chat text spans ≈ x 640..1360 at s 2.3: "all cats" ≈ 980..1190, "100" ≈ 1215..1300
  const ell = (cx, cy, rx, ry, k) => (k > 0 ? S.path(`M${f(cx + rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 1 1 ${f(cx + rx - 1)} ${f(cy - 6)}`, { ...ln(10, '#FF3B4E'), 'stroke-dasharray': `${f(7 * Math.max(rx, ry) * k)} 9999` }) : '');
  ui += ell(985, 515, 178, 66, mk) + ell(1222, 515, 84, 62, seg(t, tTypo - 0.1, tTypo + 0.25));
  o += zoomAt(ui, z, 960, 520);
  o += K.bang('TYPO!', 1480, 790, seg(t, tTypo, tTypo + 0.12), 150, -8, '#FF4D5E');
  o += flash(t, t10, 0.1, 0.6);
  return o;
}

// ---------------------------------------------------------------- 11. SYSTEM: "Command: size... all cats. One hundred."
function catScreen(t) {
  const a = w(4, 'Command'), b = w(4, 'all'), c = w(4, 'One');
  const lines = [';fly all', ';size all cats 100'];
  if (t > a) lines.push('Command accepted.');
  if (t > b) lines.push('Scanning for cats...');
  if (t > b + 0.4) lines.push(`Cats found: ${Math.round(lerp(0, 100000, ease.out(seg(t, b + 0.4, c)))).toLocaleString('en-US')}`);
  if (t > c) lines.push({ text: 'Resizing x100 . . .', col: '#FFB13B' });
  return SETS.adminScreen(t, { lines, typed: '', battery: 64 });
}
function shot11(t) {
  const u = seg(t, t11, t12);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#0B0A1E' });
  const s = lerp(3.3, 3.55, ease.inOut(u));
  o += SETS.laptop(960, 540 + 296 * s + 10, s, catScreen(t), { t, glow: 0.4, dust: 0 });
  o += K.accepted(1460, 230, seg(t, w(4, 'Command'), w(4, 'Command') + 0.2), 0.95);
  // progress bar on "One hundred"
  const pb = seg(t, w(4, 'One') - 0.2, t12 + 0.3);
  if (pb > 0) o += S.g(S.rect(-400, -30, 800, 60, 20, ol('#0C1C14', 6)) + S.rect(-392, -22, 784 * pb, 44, 14, { fill: '#3DFF9A' }) + TF('CAT SIZE x100', 0, 14, 34, '#0C1C14'), 'translate(960 900)');
  o += whip(t, t11, -1);
  return o;
}

// ---------------------------------------------------------------- 12. "...One hundred." — every cat balloons (wide)
const growOrder = [0, 3, 1, 4, 2, 6, 5];
const growAt = (t, i) => {
  const t0 = tHundred - 0.05 + growOrder.indexOf(i) * 0.09;
  return lerp(0.07, 1, ease.outBack(seg(t, t0, t0 + 0.45)));
};
function shot12(t) {
  const u = seg(t, t12, t13);
  const cam = withShake({ zoom: lerp(1.08, 1.0, u), x: 0, y: -220 }, t, [[tHundred, 0.6, 18]]);
  let o = E.chaosWide(t, cam, { time: tod(t), flying: 1, popups: 0.7, growEach: (i) => growAt(t, i), cage: true, dad: tod(t) > 0.65, waterFall: 0 });
  // command bursts at each cat
  const spots = [{ ...CITY.tower, y: CITY.tower.y - 80 }, { x: 1290, y: 440, k: KF.mid }, { x: 1110, y: 560, k: KF.mid }, { x: CITY.stadium.x, y: CITY.stadium.y, k: KF.mid }, { x: CITY.roofs[5].x0 + 70, y: CITY.roofs[5].y - 30, k: KF.near }, { x: CITY.roofs[7].x1 - 60, y: CITY.roofs[7].y - 40, k: KF.near }, { x: CITY.roofs[1].x0 + 90, y: CITY.roofs[1].y - 40, k: KF.near }];
  spots.forEach((sp, i) => { const p = scr(cam, sp); o += K.commandBurst(p.x, p.y, t - (tHundred - 0.05 + growOrder.indexOf(i) * 0.09), '#3DFF9A', 170); });
  o += K.bang('x100', 1520, 210, seg(t, tHundred, tHundred + 0.15), 140, 6, '#7DFF8A');
  o += whip(t, t12, 1);
  return o;
}

// ---------------------------------------------------------------- 13. "Every cat" — the black cat curled up in the stadium
function shot13(t) {
  const u = seg(t, t13, t14);
  const cam = camOn(CITY.stadium.x - 20, CITY.stadium.y - 60, KF.mid, lerp(2.15, 2.3, u), 960, 500);
  const L0 = CS.city(t, cam, { time: tod(t), flying: 1, popups: 0.5, blimp: false, flyNear: false, street: false, inStadium: CATS.cat({ x: CITY.stadium.x, y: CITY.stadium.y + 28, s: 0.95, t, pose: 'sleep', coat: 'black', seed: 1 }) });
  let o = L0.bg + L0.mid + L0.fg + L0.light;
  o += whip(t, t13, -1);
  return o;
}

// ---------------------------------------------------------------- 14. "in the city." — Pancake licking his paw on the tower (≡ SC 01)
function shot14(t) {
  const u = seg(t, t14, t15);
  const cam = { zoom: lerp(1.12, 1.18, u), x: lerp(-90, -70, u), y: -300 };
  let o = E.chaosWide(t, cam, { time: tod(t), flying: 1, popups: 0.8, grow: 1, cage: true, dad: tod(t) > 0.65, waterFall: 0 });
  o += whip(t, t14, 1);
  return o;
}

// ---------------------------------------------------------------- 15. "One hundred times bigger." — batting the blimp like yarn
function shot15(t) {
  const u = seg(t, t15, t16);
  const cam = camOn(1230, 360, KF.mid, lerp(1.9, 2.05, u), 960, 520);
  const X = E.midExtras(t, { grow: 1, calico: false, pancake: true });
  const L0 = CS.city(t, cam, { time: tod(t), flying: 1, popups: 0.4, blimp: false, flyNear: false, street: false, onMid: X.onMid, inStadium: X.inStadium });
  // swats: period .62 s; the blimp gets knocked left and spins back
  const ph = (t - t15) / 0.62, k = ph - Math.floor(ph), hit = Math.floor(ph);
  const swing = Math.sin(Math.min(1, k / 0.35) * Math.PI);
  const kick = Math.exp(-k * 3.2) * (hit >= 0 ? 1 : 0);
  const bx = 1150 - 70 * kick * (hit % 2 ? 0.6 : 1) + Math.sin(t * 0.7) * 10, by = 330 + 30 * Math.sin(t * 2.3) - 26 * kick;
  const brot = -18 * kick * (hit % 2 ? -1 : 1) + Math.sin(t * 3) * 3;
  const zk = 1 + (cam.zoom - 1) * KF.mid;
  const pB = scr(cam, { x: bx, y: by, k: KF.mid });
  const pC = scr(cam, { x: 1320, y: 470, k: KF.mid });
  let o = L0.bg + L0.mid;
  o += CS.blimp(pB.x, pB.y, 0.42 * zk, { t, lights: 0.6, rot: brot, text: 'NEWS 7' });
  o += CATS.cat({ x: pC.x, y: pC.y, s: 0.95 * zk, t, pose: 'paw', coat: 'calico', seed: 2, mood: 'happy', flip: true, rot: -12 * swing + 3, look: [1, -0.3] });
  if (kick > 0.6) o += K.bang('BOP!', pB.x - 40, pB.y - 170, 1, 70, -10, '#FFFFFF');
  o += L0.fg + L0.light;
  o += whip(t, t15, -1);
  return o;
}

// ---------------------------------------------------------------- 16. (silent beat) pushing the water tower off the roof
function shot16(t) {
  const u = seg(t, t16, t17);
  const D = t17 - t16;
  const tTouch = t16 + 0.22 * D, tTeeter = t16 + 0.55 * D, tFall = t16 + 0.66 * D;
  const wob = 0.06 * Math.sin((t - tTouch) * 14) * bump(t, tTeeter - 0.25, tTeeter + 0.1);
  const tip = clamp(lerp(0, 0.55, ease.inOut(seg(t, tTouch, tTeeter))) + wob + 0.45 * ease.in(seg(t, tTeeter + 0.05, tFall)), 0, 1);
  const fall = seg(t, tFall, tFall + 0.35 * D);
  const cam = camOn(1080, 470, KF.mid, lerp(2.55, 2.7, u), 960, 500);
  const L0 = CS.city(t, cam, { time: tod(t), flying: 1, popups: 0.3, blimp: false, flyNear: false, flyMid: false, street: false, waterTip: tip, waterFall: fall });
  const zk = 1 + (cam.zoom - 1) * KF.mid;
  // the tank's left side moves as the tower tips (pivot = right foot)
  const W0 = CITY.waterTower, pv = { x: W0.x + 70 * W0.s, y: W0.y }, a = (ease.in(Math.min(tip, 1)) * 100) * Math.PI / 180;
  const tx0 = W0.x - 70 * W0.s - pv.x, ty0 = W0.y - 250 * W0.s - pv.y;
  const tgt = { x: pv.x + tx0 * Math.cos(a) - ty0 * Math.sin(a), y: pv.y + tx0 * Math.sin(a) + ty0 * Math.cos(a), k: KF.mid };
  // the paw follows the tank while teetering, stays put once it goes over, then pulls back
  const aHold = (ease.in(Math.min(tip, 0.55)) * 100) * Math.PI / 180;
  const hold = { x: pv.x + tx0 * Math.cos(aHold) - ty0 * Math.sin(aHold), y: pv.y + tx0 * Math.sin(aHold) + ty0 * Math.cos(aHold), k: KF.mid };
  const reach = seg(t, t16 + 0.05, tTouch) * (1 - seg(t, tFall + 0.1, tFall + 0.45));
  const pT = scr(cam, t < tTeeter + 0.05 ? tgt : hold), pC = scr(cam, { x: 1004, y: 586, k: KF.mid });
  const lookDown = seg(t, tFall + 0.05, tFall + 0.25) * (1 - seg(t, tFall + 0.75, tFall + 1.0));
  let o = L0.bg + L0.mid;
  o += E.pushCat(pC.x, pC.y, 0.82 * zk, t, pT.x, pT.y, reach, { coat: 'grey', seed: 8, mood: 'lazy', look: [0, lerp(0.15, 0.9, lookDown)] });
  o += L0.fg + L0.light;
  const sp = seg(t, tFall + 0.3 * D, tFall + 0.3 * D + 0.15);
  o += K.bang('SPLOOSH!', 1360, 860, sp * (1 - seg(t, t17 - 0.15, t17)), 120, -6, '#7FD3FF');
  o += whip(t, t16, 1);
  return o;
}

// ---------------------------------------------------------------- 17. "I'm the king of the city!" — the rooftop
function kingPose(t, x, y, s, spread = 1) {
  const lap = SETS.laptop(-330, -820, 0.36, SETS.adminScreen(t, { lines: [';fly all', ';size all cats 100'] }), { t, glow: 0.6, dust: 0, rot: -20 });
  return actor('you', t, { x, y, s, armL: lerp(20, 150, spread) + 6 * Math.sin(t * 5), armR: lerp(20, 150, spread) + 6 * Math.sin(t * 5 + 1), legL: 6, legR: -6, face: 'joy', props: [{ svg: lap, layer: 'back' }] }, { arms: false, energy: 1.4 });
}
function shot17(t) {
  const u = seg(t, t17, t18);
  const cam = { zoom: lerp(1.0, 1.16, ease.inOut(u)), x: 0, y: lerp(0, -70, u) };
  const X = E.midExtras(t, { grow: 1 });
  const L0 = CS.rooftop(t, cam, { time: tod(t), flying: 1, popups: 0.7, blimp: true, onMid: X.onMid, inStadium: X.inStadium, waterFall: 1 });
  const spread = ease.out(seg(t, t17, t17 + 0.35));
  const ch = kingPose(t, 960, ROOF.floor, 0.62, spread);
  let o = L0.bg + K.view(cam, K.rays(960, 400, 16, 900, '#FFE9A0', 0.12 * spread, t * 15), 1) + L0.mid + K.view(cam, ch, 1) + L0.fg + L0.light;
  o += whip(t, t17, -1);
  return o;
}

// ---------------------------------------------------------------- 18. "I'm the ADMIN OF EVERYTHING!" — pull back across the city
function shot18(t) {
  const HR = CITY.heroRoof;
  const u = ease.inOut(seg(t, t18 + 0.1, tEverything + 0.6));
  const zk = Math.exp(lerp(Math.log(4.6), Math.log(1.0), u));
  const cam0 = camOn(HR.x - 40, HR.y - 60, KF.near, zk, lerp(960, 1020, u), lerp(560, 480, u));
  const cam = u >= 1 ? cam0 : cam0;
  const sp = seg(t, t18, t18 + 0.3);
  let o = E.chaosWide(t, cam, {
    time: tod(t), flying: 1, popups: 0.8, grow: 1, cage: true, dad: tod(t) > 0.65, waterFall: 1,
    heroSvg: kingPose(t, HR.x - 40, HR.y, 0.1), heroK: KF.near,
    extraNear: K.rays(HR.x - 40, HR.y - 55, 14, 260, '#FFE9A0', 0.3 * sp, t * 30) + K.sparkles([[HR.x - 90, HR.y - 120, 9], [HR.x + 20, HR.y - 110, 7]], t),
  });
  void cam;
  o += whip(t, t18, 1);
  return o;
}

// ---------------------------------------------------------------- 19–20. Zoe flies up: "Your log is nine thousand lines long!"
function zoeScreen(t) {
  const n = Math.round(lerp(8240, 9000, ease.out(seg(t, w(7, 'nine'), w1(7, 'thousand')))) + Math.max(0, t - w1(7, 'thousand')) * 37);
  let o = S.rect(-110, -70, 220, 140, 0, { fill: '#0B1020' });
  o += TF('LOG SIZE', 0, -38, 20, '#9AA6C0') + TF(n.toLocaleString('en-US') + '+', 0, 4, 40, '#FF4D5E');
  for (let i = 0; i < 3; i++) o += S.rect(-90, 22 + i * 14, 120 + hash(i + Math.floor(t * 6)) * 60, 6, 3, { fill: '#3DFF9A', opacity: 0.6 });
  return o;
}
function zoeFly(t, x, y, s, o = {}) {
  const sw = Math.sin(t * 1.9);
  return actor('zoe', t, { x, y: y + Math.sin(t * 2.3) * 10, s, laptop: 'screen', laptopScreen: zoeScreen(t), legL: 8 + 6 * sw, kneeL: 30, legR: -10 - 6 * sw, kneeR: 40, shadow: false, turn: o.turn ?? -0.3, ...(o.pose || {}), volume: o.volume }, { energy: 1.3, ...(o.act || {}) });
}
function shot19(t) {
  const u = seg(t, t19, t20);
  const cam = { zoom: lerp(1.05, 1.12, u), x: 20, y: -40 };
  const X = E.midExtras(t, { grow: 1 });
  const L0 = CS.rooftop(t, cam, { time: tod(t), flying: 1, popups: 0.8, blimp: true, onMid: X.onMid, inStadium: X.inStadium, waterFall: 1, flyNear: false });
  const rise = ease.out(seg(t, t19, t19 + 0.9));
  let ch = heroRoof(t, 640, ROOF.floor, 0.6, { turn: 0.4, face: t > w(7, 'nine') ? { name: 'nervous', eyes: { look: [0.8, 0] } } : { name: 'happy', eyes: { look: [0.8, 0] } }, noLap: false, screen: { lines: [';size all cats 100'] }, energy: 0.4 });
  ch += zoeFly(t, 1280, lerp(1500, 860, rise), 0.6, { turn: -0.35 });
  let o = L0.bg + L0.mid + K.view(cam, ch, 1) + L0.fg + L0.light;
  o += whip(t, t19, -1);
  return o;
}
function shot20(t) {
  const u = seg(t, t20, t21);
  const z = lerp(1.0, 1.06, u) * punch(t, tDef, 0.14);
  const cam = withShake({ zoom: 1.0, x: 0, y: -60 }, t, [[tDef, 0.35, 10]]);
  const L0 = CS.rooftop(t, cam, { time: tod(t), flying: 1, popups: 0.8, blimp: true, waterFall: 1, flyNear: false, admin: 0 });
  const point = ease.out(seg(t, tDef - 0.2, tDef + 0.1));
  let o = L0.bg + L0.mid + K.view(cam, zoeFly(t, 1000, 1290, 1.0, { turn: -0.1, volume: false, pose: { armR: lerp(24, 165, point), armL: 24 }, act: { arms: false, face: { name: 'scared', fx: ['sweat'] } } }), 1) + L0.fg + L0.light;
  o = zoomAt(o, z, 960, 420);
  o += whip(t, t20, 1);
  return o;
}

// ---------------------------------------------------------------- 21, 23, 25, 26. Breaking news in the studio
const TICKER = 'THE CITY IS FLYING  •  GRANDMAS BREAK THE SOUND BARRIER  •  GIANT CAT SITS ON MAYOR  •  WHO IS DOING THIS?';
function studio(t, cam, chaos, o = {}) {
  const Ls = SETS.newsStudio.layers(t, { chaos, logo: 'NEWS 7' });
  const A = SETS.SPOTS.newsStudio.anchor;
  const flinch = o.flinch || 0;
  const anchor = actor('anchor', t, { x: A.x + (o.dx || 0), y: A.y, s: A.s, lean: -8 * flinch, turn: o.turn || 0, face: o.face, volume: o.volume, headRot: o.headRot }, { energy: o.energy ?? 1.2 });
  let out = K.view(cam, Ls.bg + Ls.mid + anchor + Ls.front, 1);
  if (o.ticker !== false) out += SETS.newsStudio.ticker(t, TICKER, { y: 870 });
  return out;
}
function shot21(t) {
  const u = seg(t, t21, t22);
  const cam = { zoom: lerp(1.0, 1.12, ease.inOut(u)), x: 0, y: lerp(0, 40, u) };
  let o = studio(t, cam, 0.45);
  const bk = seg(t, t21, t21 + 0.25) * (1 - seg(t, w1(8, 'news') + 0.3, w1(8, 'news') + 0.5));
  if (bk > 0) o += S.g(S.rect(-520, -70, 1040, 140, 20, { fill: '#E8243C', stroke: '#151515', 'stroke-width': 8 }) + T('BREAKING NEWS', 0, 34, 96, '#FFFFFF'), `translate(960 300) rotate(-3) scale(${f(pop(bk))})`);
  o += whip(t, t21, -1);
  return o;
}
function shot23(t) {
  const hit = seg(t, tGiant - 0.05, tGiant + 0.15);
  const cam = withShake({ zoom: lerp(1.15, 1.08, seg(t, t23, t24)), x: 40, y: 30 }, t, [[tGiant + 0.05, 0.5, 22]]);
  let o = studio(t, cam, lerp(0.5, 0.86, hit), { flinch: bump(t, tGiant, tGiant + 0.8), face: t > tGiant ? { name: 'scared', fx: ['sweat'] } : undefined });
  o += K.bang('THUMP!', 1500, 230, seg(t, tGiant + 0.05, tGiant + 0.18) * (1 - seg(t, t24 - 0.2, t24)), 100, 8, '#FFB347');
  o += whip(t, t23, 1);
  return o;
}
function shot25(t) {
  const u = seg(t, t25, t26);
  const A = SETS.SPOTS.newsStudio.anchor;
  const cam = camOn(A.x, 540, 1, lerp(1.6, 1.85, ease.inOut(u)), 960, 470);
  let o = studio(t, cam, 0.86, { energy: 1.4, ticker: false });
  o += SETS.newsStudio.ticker(t, TICKER, { y: 870 });
  o += whip(t, t25, -1);
  return o;
}
function shot26(t) {
  const A = SETS.SPOTS.newsStudio.anchor;
  const u = ease.out(seg(t, t26, t27));
  const cam = camOn(A.x + 10, 520, 1, lerp(2.5, 3.2, u), 960, 520);
  let o = studio(t, cam, 0.86, { energy: 0.5, ticker: false, face: { name: 'determined' }, volume: false });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF2A3C', opacity: f(0.12 * u) });
  o += flash(t, t26, 0.1, 0.5);
  return o;
}

// ---------------------------------------------------------------- 22, 24. News footage: Granny / the cat on the mayor
function footage(t, inner, title, sub, t0) {
  let o = inner + E.liveBug(t);
  o += E.lowerThird(title, sub, seg(t, t0 + 0.05, t0 + 0.35), 780);
  // scanlines + slight TV tint
  o += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#setsScan)', opacity: 0.4 });
  return o + flash(t, t0, 0.12, 0.5);
}
function shot22(t) {
  const cam = withShake({ zoom: 1.2, x: 900 - (t - t22) * 1300, y: -200 }, t, [[tBarrier, 0.5, 20]]);
  const Lc = CS.city(t, cam, { time: tod(t), flying: 1, popups: 0.5, blimp: false, waterFall: 1, flyNear: false });
  let inner = Lc.bg + Lc.mid + Lc.fg + Lc.light;
  inner += C.speedLines(-300, 2200, 480, 12, 21, '#FFFFFF', 800).replace(/<rect/g, '<rect opacity="0.18"');
  const boom = seg(t, tBarrier, tBarrier + 0.6);
  inner += E.grannyRun(t, 980 + 140 * seg(t, t22, tBarrier) - 240 * ease.out(boom), 690 + Math.sin(t * 9) * 8, 0.44, { boom: t >= tBarrier ? boom : 0, len: 1400 });
  inner += K.bang('BOOM!', 520, 300, seg(t, tBarrier, tBarrier + 0.12), 140, -8, '#FFFFFF');
  return footage(t, inner, 'GRANDMA, 91', 'Speed: MACH 1.4  •  "I like to enjoy the journey"', t22);
}
function cityHall(x, y, s) {
  let o = S.rect(-520, -40, 1040, 60, 6, ol('#D9D2C4', 6)) + S.rect(-470, -90, 940, 56, 6, ol('#E6E0D2', 6));
  o += S.rect(-440, -560, 880, 470, 0, ol('#EFE9DC', 6));
  for (let i = 0; i < 6; i++) o += S.rect(-400 + i * 152, -540, 56, 450, 10, ol('#FFFFFF', 5));
  o += S.path('M-500 -560 L0 -800 L500 -560 Z', ol('#E6E0D2', 7)) + S.rect(-520, -580, 1040, 30, 6, ol('#D9D2C4', 6));
  o += S.circle(0, -660, 50, ol('#FFF6D8', 6)) + S.path('M0 -660 L0 -690 M0 -660 L22 -660', ln(6));
  o += S.rect(-200, -540, 400, 64, 10, ol('#3A4A8A', 5)) + TF('CITY HALL', 0, -494, 44, '#FFFFFF');
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function shot24(t) {
  const u = seg(t, t24, t25);
  const cam = { zoom: 1.0, x: 0, y: -60 };
  const Lc = CS.city(t, { zoom: 1.6, x: 100, y: -260 }, { time: tod(t), flying: 1, popups: 0.4, blimp: false, waterFall: 1, flyNear: false, street: false });
  let inner = Lc.bg + Lc.mid;
  inner += S.rect(-100, 760, 2200, 400, 0, { fill: '#5A5470' }) + S.path('M-100 760 H2100', ln(6));
  inner += cityHall(1060, 780, 0.95);
  const z = lerp(1.0, 1.05, u);
  // the mayor, flattened under the cat: legs kicking out one side, a tiny hand waving the other, his top hat on the steps
  const kick = Math.sin(t * 9);
  let mayor = S.g(S.rect(-14, 0, 28, 120, 12, ol('#2A2633', 5)) + S.rect(-26, 108, 52, 26, 10, ol('#151515', 4)), `translate(1300 800) rotate(${f(-70 + 14 * kick)})`);
  mayor += S.g(S.rect(-14, 0, 28, 120, 12, ol('#2A2633', 5)) + S.rect(-26, 108, 52, 26, 10, ol('#151515', 4)), `translate(1300 822) rotate(${f(-100 - 14 * kick)})`);
  mayor += S.g(S.rect(-12, -100, 24, 100, 10, ol('#2A2633', 4)) + S.circle(0, -110, 20, ol('#F5CFA8', 4)), `translate(1270 700) rotate(${f(40 + 25 * Math.sin(t * 7))})`);
  mayor += S.g(S.rect(-40, -70, 80, 66, 8, ol('#151515', 5)) + S.rect(-62, -10, 124, 16, 6, ol('#151515', 5)) + S.rect(-40, -26, 80, 12, 0, { fill: '#C9302C' }), 'translate(1640 790) rotate(-14)');
  inner += mayor;
  inner += CATS.cat({ x: 1040, y: 870, s: 2.3, t, pose: 'sit', coat: 'white', seed: 4, mood: 'happy', blink: 0 });
  inner += S.g(S.rect(-110, -24, 220, 48, 10, ol('#FFE14D', 4)) + TF('MAYOR', 0, 13, 30, '#2A2246'), `translate(1450 640) rotate(${f(-20 + 6 * kick)})`);
  inner = zoomAt(inner, z, 1040, 600);
  return footage(t, inner, 'LIVE: CITY HALL', 'Mayor "fine", currently under cat', t24);
}

// ---------------------------------------------------------------- 27–31. Caught: YOU float with the laptop (≡ SC 01)
const LOG = [';fly all', ';size all cats 100'];
function shot27(t) {
  const u = seg(t, t27, t28);
  const cam = { zoom: lerp(1.08, 1.0, ease.out(u)), x: -20, y: 0 };
  const gulp = t < m[10].a;
  return E.floatShot(t, {
    cam, time: 1, popups: 1, dim: 0.22,
    hero: { x: 900, y: 1040, s: 0.66, typing: gulp ? 0 : 1, face: gulp ? { name: 'nervous', fx: ['sweat', 'sweat2'], eyes: { look: [0, 0] } } : { name: 'scared', fx: ['sweat'] }, energy: 1.3, screen: { lines: LOG, typed: '' } },
  }) + flash(t, t27, 0.1, 0.5);
}
function stackFor(t) {
  const p1 = K.typeProgress(t, m[10], 'Un-fly', 'all'), p2 = K.typeProgress(t, m[10], 'Size', 'one');
  const cmds = [{ text: ';unfly all', prog: p1, enter: seg(t, tE1, tE1 + 0.3), spin: t > tE1 ? 1 : 0, denied: seg(t, tD1, tD1 + 0.22) }];
  if (t > w(10, 'Size') - 0.15) cmds.push({ text: ';size all cats 1', prog: p2, enter: seg(t, tE2, tE2 + 0.3), spin: t > tE2 ? 1 : 0, denied: seg(t, tD2, tD2 + 0.22) });
  return cmds;
}
function shot28to30(t) {
  const u = seg(t, t28, t31);
  const z = (1 + 0.05 * ease.inOut(u)) * punch(t, tD1, 0.1) * punch(t, tD2, 0.08);
  const cam = withShake({ zoom: 1.0, x: 0, y: 0 }, t, [[tD1, 0.45, 24], [tD2, 0.45, 26]]);
  const denied1 = t >= tD1, denied2 = t >= tD2;
  const lines = [...LOG, ';unfly all', ...(t > tE2 ? [';size all cats 1'] : []), ...(denied1 ? ['PERMISSION DENIED'] : []), ...(denied2 ? ['PERMISSION DENIED'] : [])];
  const typed = t < tE1 ? ';unfly all'.slice(0, Math.round(K.typeProgress(t, m[10], 'Un-fly', 'all') * 10)) : t < tE2 ? ';size all cats 1'.slice(0, Math.round(K.typeProgress(t, m[10], 'Size', 'one') * 16)) : '';
  let o = E.floatShot(t, {
    cam, time: 1, popups: 1, dim: 0.22,
    hero: { x: 640, y: 1390, s: 1.02, volume: false, typing: denied1 ? 0.3 : 1, face: denied2 ? { name: 'scream', fx: ['sweat2'] } : denied1 ? { name: 'shocked', fx: ['sweat'] } : { name: 'determined', fx: ['sweat'] }, energy: 1.4, screen: { lines, typed, glitch: denied1 ? 0.4 : 0 } },
  });
  o += E.cmdStack(t, 1330, 470, stackFor(t), 1.2);
  o = zoomAt(o, z, 900, 520);
  if (denied2) o = E.tilt(o, -4 * ease.out(seg(t, tD2, tD2 + 0.2)), 960, 540);
  o += E.redHit(t, tD1, 0.45) + E.redHit(t, tD2, 0.45);
  o += whip(t, t28, 1);
  return o;
}
function shot31(t) {
  const u = seg(t, t31, t32);
  const cam = { zoom: lerp(1.0, 1.1, ease.inOut(u)), x: 0, y: 0 };
  const rk = seg(t, w(11, 'Your') - 0.05, w(11, 'Your') + 0.25);
  const lookUp = seg(t, w(11, 'review'), w(11, 'review') + 0.4);
  let o = E.floatShot(t, {
    cam, time: 1, popups: 1, dim: 0.3, admin: 0.12 * lookUp,
    hero: { x: 560, y: 1180, s: 0.82, typing: 0, face: { name: 'scared', fx: ['sweat', 'sweat2'], eyes: { look: [0.3, lerp(0.3, -1, lookUp)] } }, headRot: lerp(0, -6, lookUp), energy: 0.6, screen: { lines: ['PERMISSION DENIED', 'PERMISSION DENIED', { text: 'ADMIN RIGHTS: UNDER REVIEW', col: '#FFB13B' }], glitch: 0.8 } },
  });
  o += E.reviewWin(1290, 420, rk, t, 0.9);
  o += flash(t, w(11, 'Your'), 0.1, 0.3, '#FFB13B');
  return o + whip(t, t31, -1);
}

// ---------------------------------------------------------------- 32. "And that's when the sky... cracked." (≡ SC 01's crack wide)
function shot32(t) {
  const u = ease.inOut(seg(t, t32 + 0.1, tSky + 0.2));
  const ck = 0.8 * ease.out(seg(t, tCracked - 0.02, tCracked + 0.5));
  const cam = withShake(K.camKeys(t, [[t32, { zoom: 1.7, x: 0, y: 160 }], [tSky + 0.2, { zoom: 1.0, x: 0, y: -240 }]]), t, [[tCracked, 0.7, 28]]);
  let o = E.chaosWide(t, cam, {
    time: 1, crack: ck, admin: 0.25 * ck / 0.8, waterFall: 1, popups: 1,
    hero: { x: 960, y: 640, s: 0.22, typing: 0, face: { name: 'scared', eyes: { look: [0, lerp(0.2, -1, u)] } }, headRot: -8 * u, screen: { lines: ['ADMIN RIGHTS: UNDER REVIEW'] } },
  });
  o += flash(t, tCracked, 0.25, 0.95);
  void u;
  return o + whip(t, t32, 1);
}

// ---------------------------------------------------------------- routing
const SHOTS = [
  [START, shot1], [t2, shot2], [t3, shot3], [t4, shot4], [t5, shot5], [t6, shot6], [t7, shot7], [t8, shot8], [t9, shot9],
  [t10, shot10], [t11, shot11], [t12, shot12], [t13, shot13], [t14, shot14], [t15, shot15], [t16, shot16], [t17, shot17],
  [t18, shot18], [t19, shot19], [t20, shot20], [t21, shot21], [t22, shot22], [t23, shot23], [t24, shot24], [t25, shot25],
  [t26, shot26], [t27, shot27], [t28, shot28to30], [t31, shot31], [t32, shot32],
];
function scene(t) {
  let fn = SHOTS[0][1];
  for (const [t0, s] of SHOTS) if (t >= t0) fn = s;
  return fn(t);
}
function look(t) {
  if (t >= t21 && t < t27) return { grade: null, vignette: 0.8 };
  if (t >= t11 && t < t12) return { grade: null, vignette: 0.9 };
  return tod(t) < 0.78 ? { grade: 'warm', vignette: 0.8 } : { grade: 'cool', vignette: 0.85 };
}

module.exports = { scene, look };
