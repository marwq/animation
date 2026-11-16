// SC 07 · АДМИН — the sky splits: the biggest chat message ever, then the ADMIN himself (white robe of code, golden
// crown, a face of pure light). "Who. Gave you. Admin?" — "...A garage sale?" The charge sheet (bus, child, 100,000 giant
// cats), a log longer than his beard, the happy cats; ";unfly all" → everyone falls → the giant cats catch everyone like
// mice (one licks the mailman's head); ";kick you" → you dissolve into pixels → ";god me" → gold; his eyes narrow;
// "the first admin battle in history" → VS card.
'use strict';

const K = require('./kit');
const E = require('./s07_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, actor, R, P, Ci, El, G, tr, outT, outTF, pop, at, shook, flash, whip } = E;
const CS = require('./city');
const SETS = require('./sets');
const CATS = require('../rig/cats');
const { L } = K.V;

const START = K.V.scene('SC 07').start, END = K.V.scene('SC 08').start;
const m = Array.from({ length: 12 }, (_, i) => L('07.' + i));
const Wd = (i, w, n = 0) => m[i].word(w, n).t0;
const We = (i, w, n = 0) => m[i].word(w, n).t1;

// ---------------------------------------------------------------- cuts (all from the voice)
const c1 = Wd(0, 'The', 1) - 0.1;           // B  the biggest chat message (rooftop, low angle)
const c2 = m[1].a - 0.1;                  // C  the Admin: "Who. Gave you. Admin?"
const c3 = m[2].a - 0.1;                  // D  "...A garage sale?"
const c4 = m[3].a - 0.1;                  // E1 the bus
const c5 = Wd(3, 'You', 1) - 0.1;         // E2 the jailed child
const c6 = Wd(3, 'You', 2) - 0.1;         // E3 100,000 giant cats
const c7 = Math.min(Wd(3, 'GIANT') - 0.08, m[4].a - 0.45);   // E4 smash: his eyes
const c8 = m[4].a - 0.1;                  // F1 the log unrolls
const c8b = Wd(4, 'than') - 0.12;         // F2 ... all the way down to the street
const c9 = m[5].a - 0.1;                  // G1 "In my defense..."
const c10 = Wd(5, 'the') - 0.1;           // G2 the happy cats
const c11 = m[6].a - 0.12;                // H  ;unfly all
const c12 = m[7].a - 0.05;                // I  everyone hangs... and falls
const c13 = Wd(7, 'Lucky') - 0.1;         // J1 a cat catches the mailman
const c13b = Wd(7, 'VERY') - 0.3;         // J2 catches, catches, catches
const c14 = Math.min(m[7].b + 0.05, m[8].a - 1.1);   // K  set down gently + a lick (the beat)
const c15 = m[8].a - 0.1;                 // L  "And now... you."
const c16 = Wd(8, 'Kick') - 0.15;         // M  ;kick you → dissolving
const c17 = Wd(9, 'God') - 0.1;           // N  ;god me → gold
const c18 = Wd(10, 'dare') - 0.1;         // O1 his eyes narrow
const c19 = Wd(10, 'against') - 0.1;      // O2 the flare
const c20 = m[11].a - 0.1;                // P1 the standoff
const c21 = Wd(11, 'admin') - 0.15;       // P2 VS card

const tCrack = Wd(0, 'crack'), tCame = Wd(0, 'came'), tMsg = Wd(0, 'message'), tBiggest = Wd(0, 'biggest');
const tFell = Wd(7, 'fell');
const tUnfly = m[6].b;                    // ENTER of ;unfly all
const tKick = m[8].b;                     // ENTER of ;kick you
const tGod = m[9].b;                      // ENTER of ;god me
const tFlare = Wd(10, 'ADMIN');
const tBegan = Wd(11, 'began');

// ---------------------------------------------------------------- shared looks
const flyingAt = (t) => (t < tFell ? 1 : 1 - ease.in(seg(t, tFell, tFell + 0.75)));
const CITY_O = (t, o = {}) => ({ time: 1, crack: 0, admin: 0.35, flying: flyingAt(t), street: true, flyNear: false, ...o });
// the crack is drawn by hand (behind the skyline, k .04) so its light beams don't wash the characters out
function crackArt(t, r = 560, k = 1) {
  const C_ = CS.CITY.crack;
  let b = '';
  for (let i = 0; i < 6; i++) {
    const a = (-40 + i * 16 + Math.sin(t * 0.7 + i * 1.3) * 3) * Math.PI / 180, hw = (2 + hash(i * 9.7) * 3) * Math.PI / 180, Lb = 1300;
    b += `M${C_.x} ${C_.y}L${f(C_.x + Math.sin(a - hw) * Lb)} ${f(C_.y + Math.cos(a - hw) * Lb)}L${f(C_.x + Math.sin(a + hw) * Lb)} ${f(C_.y + Math.cos(a + hw) * Lb)}Z`;
  }
  return P(b, { fill: 'url(#cityBeam)', opacity: f(0.35 * k) }) + CS.crack(C_.x, C_.y, r, k, { glow: 1 });
}
// a camera that frames layer point (X, Y) of parallax k at an effective zoom zEff
const camK = (X, Y, zEff, k, extra = {}) => ({ zoom: 1 + (zEff - 1) / k, x: (X - 960) / k, y: (Y - 540) / k, ...extra });
const adm = (t, pose, act) => actor('admin', t, { t, glow: 0.8, face: 'determined', ...pose }, act);
const youAct = { energy: 1.2 };
// the Admin's giant sky chat (screen/k-space svg)
const sky = (x, y, w, h, t, o) => CS.skyChat(x, y, w, h, t, o);
// draw a city frame: chars over the near row (k 1), mid = things on the mid layer (already viewed), back = in front of the far skyline
function cityFrame(t, cam, o, { back = '', mid = '', near = '', chars = '', over = '' } = {}) {
  const Ly = CS.city(t, cam, CITY_O(t, { ...o, onSky: crackArt(t, o.crackR || 560) + (o.onSky || '') }));
  return Ly.bg + back + Ly.mid + mid + Ly.fg + near + chars + Ly.light + over;
}
function roofFrame(t, cam, o, { skyArt = '', chars = '', over = '' } = {}) {
  const Ly = CS.rooftop(t, cam, CITY_O(t, { ...o, onSky: crackArt(t, o.crackR || 560) + (o.onSky || '') }));
  return Ly.bg + skyArt + Ly.mid + chars + Ly.fg + Ly.light + over;
}

// ================================================================ SHOTS
// A — the crack: a chat window squeezes out of the hole and hangs in the sky
function shotA(t) {
  const cam = shook(K.camKeys(t, [[START, at(960, 360, 1.35)], [tCame, at(960, 400, 1.25)], [c1, at(960, 470, 1.04)]]), t, [[tCrack, 0.35, 10]]);
  const e = ease.out(seg(t, tCame - 0.05, tMsg + 0.4));
  let chat = '';
  if (e > 0) chat = sky(960, lerp(195, 350, e), 980, 300, t, { text: '', progress: 0, glow: 0.4 + 0.6 * e, s: lerp(0.06, 1, e), cursor: true });
  const o = cityFrame(t, cam, { crackR: 560 + 40 * bump(t, tCrack, tCrack + 0.5) }, { mid: K.view(cam, chat, CS.KF.crack) });
  return o + flash(t, tCrack, 0.3, '#FFF6D0', 0.5) + flash(t, START, 0.2, '#FFFFFF', 0.6);
}
// B — rooftop low angle: the window keeps coming down until it covers the sky; the hero is TINY
function shotB(t) {
  const u = seg(t, c1, c2);
  const cam = K.camKeys(t, [[c1, at(960, 560, 1.12)], [c2, at(960, 520, 0.98)]]);
  const d = ease.inOut(seg(t, c1, c1 + 1.6));
  const grow = 1 + 0.08 * pop(seg(t, tBiggest - 0.05, tBiggest + 0.35)) - 0.08 * seg(t, tBiggest + 0.35, tBiggest + 0.6);
  const glowUp = seg(t, c2 - 1.2, c2);
  let art = '';
  // the light of something BIG behind the window
  if (glowUp > 0) art += K.view(cam, El(960, 120, 900 * glowUp, 300 * glowUp, { fill: '#FFF2C0', opacity: f(0.35 * glowUp) }) + K.rays(960, 60, 16, 1300, '#FFF6D8', 0.16 * glowUp, t * 8), 0.1);
  art += K.view(cam, sky(960, lerp(-300, 250, d), 1640, 470, t, { text: '', progress: 0, glow: 1, s: grow }), 0.1);
  const look = { name: 'shocked', eyes: { look: [0, -1], pupil: 0.45 }, fx: [] };
  const chars = K.view(cam, E.hero(t, { x: 960, y: CS.ROOF.floor, s: 0.3, laptop: 'back', face: look, headRot: -4, bodyY: 4 * Math.sin(t * 3) }), 1);
  void u;
  return roofFrame(t, cam, {}, { skyArt: art, chars });
}
// C — the Admin above the city, over the hero's shoulder; the sky chat types his words, a punch-in per word
function shotC(t) {
  const w1 = Wd(1, 'Who'), w2 = Wd(1, 'Gave'), w3 = Wd(1, 'Admin');
  const z = t < w2 ? 1 : t < w3 ? 1.07 : 1.15;
  const cam = shook(at(1010, 470, z), t, [[w1, 0.3, 12], [w2, 0.3, 12], [w3, 0.45, 18]]);
  const app = ease.out(seg(t, c2, c2 + 0.5));
  let art = K.view(cam, adm(t, { x: 1190, y: lerp(1250, 1060, app), s: 0.62, glow: 1, armL: 30, armR: 30, face: { name: 'angry', eyes: { upper: 0.25 }, fx: [] } }), 0.25);
  const prog = K.typeProgress(t, m[1], 0, 3);
  art += K.view(cam, sky(560, 250, 820, 290, t, { text: 'Who. Gave you. Admin?', progress: prog, glow: 1, size: 76 }), 0.12);
  const chars = K.view(cam, E.hero(t, { x: 400, y: 1290, s: 0.78, view: 'back', laptop: false, armL: 14, armR: 14, headRot: -6 }), 1.05);
  return roofFrame(t, cam, { admin: 0.8 }, { skyArt: art, chars }) + flash(t, c2, 0.2, '#FFFFFF', 0.7);
}
// D — "...A garage sale?" tiny voice, the $1 tag still on the laptop
function shotD(t) {
  const u = seg(t, c3, c4);
  const cam = at(960, 620, lerp(1.95, 2.1, u));
  const tag = G(P('M0 0L30 60', ln(3)) + G(P('M-34 0L34 0L48 26L34 52L-34 52Z', ol('#FFE14D', 4)) + Ci(36, 26, 6, ol('#FFFFFF', 2)) + T('$1', -4, 40, 34, '#2A2140'), 'translate(30 60) rotate(-14) translate(-34 0)'), 'translate(120 -420)');
  const shrug = bump(t, Wd(2, 'sale') - 0.2, m[2].b + 0.3);
  const chars = E.hero(t, { x: 960, y: CS.ROOF.floor, s: 0.5, laptop: 'back', props: [{ svg: tag, layer: 'top' }], armL: 26 + 6 * shrug, armR: 26 + 6 * shrug, sy: 1 - 0.04 * shrug, bodyY: 6 * shrug, headRot: -6 + 4 * Math.sin(t * 2),
    face: { name: 'nervous', eyes: { look: [0.15, -0.85], pupil: 0.6 }, fx: ['sweat'] } });
  return roofFrame(t, cam, { admin: 0.6 }, { chars: K.view(cam, E.spotCone(960, -400, 960, CS.ROOF.floor, 260, 0.7) + chars, 1) });
}
// E1 — the bus (exhibit A)
function shotE1(t) {
  const u = seg(t, c4, c5);
  const cam = at(lerp(900, 1020, u), 360, 1.25);
  const bx = lerp(520, 1180, u), by = 470 + Math.sin(t * 2) * 10;
  const near = K.view(cam, CS.bus(bx, by, 0.95, -6 + Math.sin(t * 1.4) * 3, { t, lights: 1, wave: 1 }) + CS.flyer(1420, 260, 1.5, 20, { t, seed: 2 }) + CS.dog(380, 220, 1.3, -10, { t }), 1);
  const k = seg(t, Wd(3, 'bus') - 0.1, Wd(3, 'bus') + 0.35);
  return cityFrame(t, cam, {}, { chars: near }) + E.logTag(1360, 790, '0412', ';fly all', k, -4, 0.95);
}
// E2 — the jailed child (exhibit B): Brick in the cage, swinging on the crane cable high above the city
function shotE2(t) {
  const u = seg(t, c5, c6);
  const cam = at(lerp(940, 1000, u), 330, 1.18);
  const sw = 6 * Math.sin(t * 1.3);
  const cs = 0.55, top = -60, bot = 900;
  let cg = P(`M760 ${top}V${f(bot - 680 * cs - 40)}`, ln(14)) + P(`M760 ${top}V${f(bot - 680 * cs - 40)}`, ln(7, '#B9C0D0')) + G(R(-26, -10, 52, 40, 10, ol('#E8B400', 5)) + P('M0 30q0 26 -20 30', ln(9, '#5A6070')), `translate(760 ${f(bot - 680 * cs - 70)})`);
  cg += SETS.cage(760, bot, cs, t, { theme: 'green', part: 'back' });
  cg += actor('brick', t, { x: 760, y: bot - 14, s: 0.24, armL: 150 + 6 * Math.sin(t * 5), armR: 150 - 6 * Math.sin(t * 5), face: { name: 'sad', eyes: { look: [0.6, 0.6] }, fx: ['blush', 'sweat'], mouth: 'wavy' } });
  cg += SETS.cage(760, bot, cs, t, { theme: 'green', part: 'front' });
  const k = seg(t, Wd(3, 'child') - 0.1, Wd(3, 'child') + 0.35);
  return cityFrame(t, cam, {}, { chars: G(cg, `rotate(${f(sw)} 760 ${top})`) }) + E.logTag(1380, 720, '0377', ';jail Brick', k, 5, 0.95);
}
// E3 — 100,000 giant cats (exhibit C) + the counter
function shotE3(t) {
  const u = seg(t, c6, c7);
  const cam = at(lerp(820, 1100, ease.inOut(u)), 470, 1.12);
  const T_ = CS.CITY.tower;
  let mid = CATS.pancake({ x: T_.x, y: T_.y, s: 1.1, t, pose: 'sit', mood: 'smug', blink: 0 });
  mid += CATS.cat({ x: 1110, y: 580, s: 0.9, t, pose: 'loaf', keyboard: false, coat: 'grey', seed: 3 });
  mid += CATS.cat({ x: 1340, y: 470, s: 0.75, t, pose: 'sit', coat: 'black', mood: 'smug', seed: 5 });
  const near = CATS.cat({ x: 360, y: 754, s: 1.25, t, pose: 'sit', coat: 'calico', mood: 'happy', seed: 2 }) + CATS.cat({ x: 1640, y: 834, s: 1.2, t, pose: 'lie', coat: 'white', seed: 8 }) + CATS.cat({ x: 2200, y: 844, s: 1.3, t, pose: 'sit', coat: 'tabby', mood: 'lazy', seed: 6 });
  const inStadium = CATS.cat({ x: 1690, y: 640, s: 0.62, t, pose: 'sleep', coat: 'siamese', seed: 4 });
  let o = cityFrame(t, cam, { inStadium }, { mid: K.view(cam, mid, CS.KF.mid), near: K.view(cam, near, CS.KF.near) });
  // the counter
  const ck = seg(t, Wd(3, 'one') - 0.2, Wd(3, 'one'));
  if (ck > 0) {
    const n = Math.round(100000 * ease.inOut(seg(t, Wd(3, 'one'), Wd(3, 'cats'))));
    let c = R(-330, -70, 660, 140, 30, ol('#FFFFFF', 7)) + R(-330, -70, 660, 46, 30, { fill: '#FFC93C' }) + R(-330, -40, 660, 16, 0, { fill: '#FFC93C' }) + P('M-330 -24H330', ln(6));
    c += TF('GIANT CATS', 0, -36, 28, '#5A3A00', { 'letter-spacing': 4 }) + T(n.toLocaleString('en-US'), 0, 50, 72, '#2A2140');
    o += G(c, tr(1400, 150, pop(ck) * 0.9));
  }
  return o;
}
// backdrop for the Admin's extreme close-ups: night sky, crack lines, cold white rays
function ecuBg(t, k) {
  let o = R(0, 0, 1920, 1080, 0, { fill: '#241C5C' }) + R(0, 0, 1920, 1080, 0, { fill: 'url(#cityAdminWash)', opacity: 0.5 });
  o += K.rays(960, 470, 20, 1500, '#FFFFFF', 0.06 + 0.1 * k, t * 12) + G(CS.crack(0, 0, 900, 1, { glow: 0.3 }), 'translate(960 200) scale(1.4)', { opacity: 0.35 });
  return o;
}
// E4 — smash: GIANT. His eyes flare.
function shotE4(t) {
  const fl = seg(t, c7, c7 + 0.25);
  const cam = shook(at(960, 540, lerp(1.25, 1.12, ease.out(seg(t, c7, c8)))), t, [[c7 + 0.02, 0.5, 26]]);
  let o = ecuBg(t, 0.5 + 0.5 * fl);
  o += K.view(cam, adm(t, { x: 960, y: 1985, s: 1.5, glow: 0.4, armL: 8, armR: 8, face: { name: 'angry', eyes: { upper: 0.2, pupil: 1.6 }, fx: [] } }, { arms: false }), 1);
  return o + flash(t, c7, 0.25, '#FFFFFF', 0.85);
}
// the log scroll: paper strip from (x, y0) down to y1 with command lines scrolling
const LOG = [';fly me', ';speed Granny', ';size Pancake 10', ';fly Dad', ';god me', ';jail Brick', ';tp me', ';noclip me', ';speed me', ';fly all', ';size all cats 100', ';fly me', ';god me', ';speed Granny'];
function scroll(x, y0, y1, t, w = 150, roll = true) {
  if (y1 <= y0 + 2) return '';
  const id = S.uid('s07scr');
  let o = `<clipPath id="${id}"><rect x="${f(x - w / 2)}" y="${f(y0)}" width="${w}" height="${f(y1 - y0)}"/></clipPath>`;
  let body = R(x - w / 2, y0, w, y1 - y0, 0, { fill: '#FFF7E2', stroke: '#151515', 'stroke-width': 5 });
  let txt = '';
  const lh = 42, off = (t * 120) % (lh * LOG.length);
  for (let yy = y0 + 30 - off, i = 0; yy < y1 + 40; yy += lh, i++) {
    if (yy < y0 - 40) continue;
    txt += TF(LOG[((i % LOG.length) + LOG.length) % LOG.length], x - w / 2 + 14, yy, 22, i % 5 === 4 ? '#E8243C' : '#3A3050', { 'text-anchor': 'start' });
  }
  body += txt + P(`M${f(x - w / 2 + 6)} ${f(y0)}V${f(y1)}`, ln(3, '#E8D8B0'));
  o += G(body, null, { 'clip-path': `url(#${id})` });
  if (roll) o += R(x - w / 2 - 14, y0 - 26, w + 28, 52, 26, ol('#F2E2B8', 6)) + Ci(x - w / 2 - 14, y0, 18, ol('#FFC93C', 5)) + Ci(x + w / 2 + 14, y0, 18, ol('#FFC93C', 5));
  return o;
}
// F1 — "Your log is longer..." the scroll unrolls out of the frame
function shotF1(t) {
  const u = seg(t, c8, c8b);
  const cam = at(960, lerp(470, 560, ease.inOut(u)), lerp(1.12, 1.02, u));
  const ax = 820, ay = 1060, as = 0.72, aS = as * 1.4;
  const [hx, hy] = E.A.hand(112, 1);
  const hand = [ax + hx * aS, ay + hy * aS];
  const len = 1400 * ease.in(seg(t, Wd(4, 'log') - 0.05, Wd(4, 'longer') + 0.4));
  const art = K.view(cam, adm(t, { x: ax, y: ay, s: as, glow: 0.9, armR: 112, armL: 22, face: { name: 'deadpan', eyes: { upper: 0.35 } } }), 0.25);
  const chars = K.view(cam, scroll(hand[0], hand[1], hand[1] + len, t, 170), 0.25);
  return roofFrame(t, cam, { admin: 0.8 }, { skyArt: art, chars });
}
// F2 — "...than my beard." the log hangs from the sky down to the street and piles up there
function shotF2(t) {
  const u = seg(t, c8b, c9);
  const cam = at(1000, lerp(660, 640, u), lerp(1.06, 1.0, u));
  const x = 1040;
  let near = scroll(x, -500, 1000, t, 150, false);
  // pile of folds on the street
  let pile = '';
  const n = 4 + Math.floor(seg(t, c8b, c9) * 5);
  for (let i = 0; i < n; i++) pile += R(x - 200 + (i % 2) * 40 - i * 6, 1004 - i * 24, 400, 30, 14, ol('#FFF7E2', 5));
  near += pile + T('!', x + 260, 900, 80, '#FFE14D', E.OUT(10)) ;
  const heroTiny = K.view(cam, E.hero(t, { x: CS.CITY.heroRoof.x, y: CS.CITY.heroRoof.y, s: 0.12, face: { name: 'shocked', eyes: { look: [-0.6, -0.6] } }, laptop: 'back' }), CS.KF.near);
  return cityFrame(t, cam, { admin: 0.7 }, { near: heroTiny, chars: K.view(cam, near, 1) });
}
// G1 — "In my defense..." finger up, nervous grin
function shotG1(t) {
  const u = seg(t, c9, c10);
  const cam = at(940, 610, lerp(1.9, 2.05, u));
  const up = ease.outBack(seg(t, Wd(5, 'In') - 0.05, Wd(5, 'In') + 0.25));
  const chars = E.hero(t, { x: 960, y: CS.ROOF.floor, s: 0.5, laptop: 'back', armR: lerp(26, 158, up), armL: 26, turn: 0.15, headRot: 4 * Math.sin(t * 3),
    face: { name: 'nervous', eyes: { look: [-0.2, -0.3] }, fx: ['sweat'] } });
  return roofFrame(t, cam, { admin: 0.8 }, { chars: K.view(cam, chars, 1) });
}
// purr vibration lines around a point
function purr(x, y, r, t) {
  let d = '';
  for (let i = 0; i < 3; i++) { const j = Math.sin(t * 40 + i) * 4; d += `M${f(x - r - 20 - i * 18)} ${f(y - 30 + i * 30 + j)}q-10 -12 0 -24M${f(x + r + 20 + i * 18)} ${f(y - 30 + i * 30 - j)}q10 -12 0 -24`; }
  return P(d, ln(6, '#FFFFFF', 0.85));
}
// G2 — "...the cats look really happy." purring; one flops onto its back
function shotG2(t) {
  const u = seg(t, c10, c11);
  const cam = camK(lerp(620, 700, u), 610, 1.75, CS.KF.near);
  const tRoll = Wd(5, 'really') - 0.15;
  let near = '';
  near += CATS.cat({ x: 330, y: 754, s: 1.25, t, pose: 'sit', coat: 'grey', mood: 'happy', seed: 3 }) + purr(330, 754 - 190, 110, t);
  // the roller
  const rk = seg(t, tRoll, tRoll + 0.3);
  if (rk < 1) near += CATS.cat({ x: 680, y: 864, s: 1.45, t, pose: 'sit', coat: 'calico', mood: 'happy', blink: 1, seed: 2, rot: -lerp(0, 75, ease.in(rk)) });
  else near += CATS.cat({ x: 690, y: 864, s: 1.45, t, pose: 'lie', coat: 'calico', mood: 'happy', seed: 2, rot: 6 * Math.sin((t - tRoll) * 6) * Math.exp(-(t - tRoll - 0.3) * 2) }) + K.sparkles([[600, 600, 22], [820, 560, 18], [700, 520, 14]], t);
  near += purr(680, 864 - 200, 140, t);
  near += CATS.cat({ x: 1000, y: 796, s: 1.2, t, pose: 'sit', coat: 'black', mood: 'happy', seed: 5 }) + purr(1000, 796 - 180, 105, t);
  // hearts
  let hearts = '';
  for (let i = 0; i < 4; i++) { const ph = (t * 0.7 + i / 4) % 1; hearts += G(P(K.F.heartPath(0, 0, 18), ol('#FF6F9A', 4)), tr(380 + i * 210 + Math.sin(ph * 6 + i) * 20, 560 - ph * 220, 1 - ph * 0.3), { opacity: f(1 - ph) }); }
  const o = cityFrame(t, cam, { admin: 0.5 }, { chars: K.view(cam, near + hearts, CS.KF.near) });
  return o + (t > tRoll + 0.25 ? K.bang('PRRR', 1450, 260, seg(t, tRoll + 0.25, tRoll + 0.45), 90, 8, '#FFB3D6') : K.bang('purr', 1450, 260, seg(t, c10 + 0.1, c10 + 0.3), 70, 8, '#FFFFFF'));
}
// H — ";unfly all" — the Admin types in the sky, ENTER slams the city
function shotH(t) {
  const cam = shook(at(960, 470, 1.0), t, [[tUnfly, 0.5, 22]]);
  const up = ease.out(seg(t, c11, c11 + 0.3)), slam = ease.in(seg(t, tUnfly - 0.08, tUnfly + 0.05));
  let art = K.view(cam, adm(t, { x: 1300, y: 1080, s: 0.78, glow: 1, armR: lerp(lerp(30, 170, up), 60, slam), armL: 24, face: { name: 'angry', eyes: { upper: 0.3 }, fx: [] } }), 0.22);
  const prog = K.typeProgress(t, m[6]);
  const ek = clamp((t - tUnfly) / 0.4, 0, 1);
  art += K.view(cam, sky(640, 300, 860, 250, t, { text: ';unfly all', progress: prog, glow: 1, size: 92, user: 'ADMIN' }) + (ek > 0 && ek < 1 ? R(640 - 430 - 30 * ek, 300 - 125 - 30 * ek, 860 + 60 * ek, 250 + 60 * ek, 50, { fill: 'none', stroke: '#FFC93C', 'stroke-width': 14, opacity: f(1 - ek) }) : ''), 0.12);
  let over = K.commandBurst(960, 560, t - tUnfly, '#FFE38A', 700) + flash(t, tUnfly, 0.3, '#FFF6D0', 0.7);
  return roofFrame(t, cam, { admin: 0.9 }, { skyArt: art, over });
}
// I — everyone hangs in the air for a beat, looks at us... and drops; the camera falls with them onto the cats
function shotI(t) {
  const hangT = Math.min(t, c12 + 0.12);
  const tc = t < tFell ? hangT : t;
  const g = 2600, dt = Math.max(0, t - tFell), fall = 0.5 * g * dt * dt;
  const cam = K.camKeys(t, [[c12, at(960, 400, 1.18)], [tFell, at(960, 410, 1.18)], [tFell + 0.9, at(960, 660, 1.12)], [c13, at(960, 680, 1.1)]]);
  const items = [
    ['mail', 900, 560, 0.24, -8], ['tub', 380, 420, 0.2, 10], ['bus', 1500, 330, 0.5, -6], ['fly', 1250, 620, 1.5, 15, 1], ['fly', 620, 260, 1.3, -20, 4], ['dog', 1720, 640, 1.4, 12], ['dog', 200, 680, 1.2, -14],
  ];
  let near = '';
  items.forEach(([k, x, y, s, r, seed], i) => {
    const yy = y + fall * (1 + 0.1 * i), rr = r + dt * (i % 2 ? 160 : -160);
    if (yy > 1900) return;
    if (dt > 0) near += R(x - 50, yy - 320, 10, 200, 5, { fill: '#FFFFFF', opacity: 0.45 }) + R(x + 40, yy - 380, 10, 240, 5, { fill: '#FFFFFF', opacity: 0.45 });
    if (k === 'mail') near += CS.mailman(x, yy + 230, s, { t: tc, rot: rr, face: 'shock', letters: 1 });
    else if (k === 'tub') near += CS.bathtubGuy(x, yy + 100, s, rr, { t: tc, face: 'shock' });
    else if (k === 'bus') near += CS.bus(x, yy + 60, s, rr, { t: tc, lights: 1, wave: 0 });
    else if (k === 'fly') near += CS.flyer(x, yy, s, rr, { t: tc, seed });
    else near += CS.dog(x, yy, s, rr, { t: tc, flip: i % 2 === 0 });
    // "!" during the hang
    const hk = seg(t, c12 + 0.15 + i * 0.05, c12 + 0.35 + i * 0.05) * (t < tFell ? 1 : 0);
    if (hk > 0) near += T('!', x + 40, y - (k === 'mail' ? 40 : k === 'tub' ? 120 : 90), 80 * pop(hk), '#FFE14D', E.OUT(10));
  });
  // the giant cats on the roofs below look up (revealed by the tilt down)
  const cats = CATS.cat({ x: 360, y: 754, s: 1.35, t, pose: 'sit', coat: 'white', mood: 'surprised', look: [0.2, -1], seed: 9 }) + CATS.cat({ x: 1640, y: 834, s: 1.3, t, pose: 'sit', coat: 'tabby', mood: 'surprised', look: [-0.3, -1], seed: 6 }) + CATS.cat({ x: 980, y: 796, s: 1.2, t, pose: 'sit', coat: 'grey', mood: 'surprised', look: [0, -1], seed: 3 });
  return cityFrame(tc, cam, { flying: flyingAt(t), admin: 0.6 }, { near: K.view(cam, cats, CS.KF.near), chars: K.view(cam, near, 1) });
}
// a falling item caught at tc into a cat paw at (px, py): returns the item position
function fallTo(t, tcatch, px, py, g = 4800) {
  if (t >= tcatch) { const b = Math.exp(-(t - tcatch) * 7) * Math.sin((t - tcatch) * 22) * 26; return [px, py + b, true]; }
  const d = tcatch - t;
  return [px, py - 0.5 * g * d * d, false];
}
// paw tip of a cat in pose 'paw' (cat at x, y, scale s) in the same space
const pawTip = (x, y, s) => [x + 138 * 0.68 * s * 0.92, y - 318 * 0.68 * s];
// J1 — "Lucky for them... cats" — a white giant cat snaps the mailman out of the air
function shotJ1(t) {
  const u = seg(t, c13, c13b);
  const cam = camK(lerp(990, 1010, u), 420, 1.3, CS.KF.near);
  const tc = Wd(7, 'cats');
  const cx = 960, cy = 796, cs = 2.1;
  const [px, py] = pawTip(cx, cy, cs);
  const caught = t >= tc;
  let near = '';
  near += CATS.cat({ x: cx, y: cy, s: cs, t, pose: caught ? 'paw' : 'sit', coat: 'white', mood: caught ? 'happy' : 'surprised', look: caught ? [0.5, -0.4] : [0.2, -1], seed: 9 });
  const [mx, my] = fallTo(t, tc, px - 10, py - 30);
  if (my > -600) near += CS.mailman(mx, my, 0.21, { t, rot: caught ? -14 : 30 + (t - c13) * 200, face: 'shock', letters: caught ? 0 : 1 });
  if (caught) near += K.sparkles([[px - 140, py - 120, 26 * (1 - seg(t, tc, tc + 0.5))], [px + 120, py - 60, 20 * (1 - seg(t, tc, tc + 0.5))]], t);
  const cam2 = shook(cam, t, [[tc, 0.3, 14]]);
  return cityFrame(t, cam2, { admin: 0.45 }, { chars: K.view(cam2, near, CS.KF.near) }) + (caught ? K.bang('CATCH!', 1460, 300, seg(t, tc, tc + 0.2), 90, -6, '#FFE14D') : '');
}
// J2 — "...VERY good at catching things." three catches on the words
function shotJ2(t) {
  const u = seg(t, c13b, c14);
  const cam = camK(lerp(990, 1020, u), 500, 1.15, CS.KF.near);
  const C = [
    { x: 420, y: 754, s: 1.45, coat: 'tabby', tc: Wd(7, 'VERY'), item: 'bus', seed: 6 },
    { x: 990, y: 796, s: 1.5, coat: 'grey', tc: Wd(7, 'catching'), item: 'tub', seed: 3 },
    { x: 1580, y: 834, s: 1.4, coat: 'black', tc: Wd(7, 'things'), item: 'dog', seed: 5 },
  ];
  let near = '', fx = '';
  for (const c of C) {
    const caught = t >= c.tc;
    near += CATS.cat({ x: c.x, y: c.y, s: c.s, t, pose: caught ? 'paw' : 'sit', coat: c.coat, mood: caught ? 'happy' : 'surprised', look: caught ? [0.4, -0.3] : [0.3, -1], seed: c.seed });
    const [px, py] = pawTip(c.x, c.y, c.s);
    const [ix, iy] = fallTo(t, c.tc, px - 6, py - 26);
    if (iy > -700) {
      if (c.item === 'bus') near += CS.bus(ix, iy + 50, 0.34, caught ? -8 : -30 + (t - c13b) * 90, { t, lights: 1, wave: caught ? 1 : 0 });
      else if (c.item === 'tub') near += CS.bathtubGuy(ix, iy + 24, 0.17, caught ? 8 : 40 - (t - c13b) * 120, { t, face: caught ? 'happy' : 'shock' });
      else near += CS.dog(ix - 20, iy - 20, 1.15, caught ? -10 : 70, { t, col: '#C98A4A' }) + CS.flyer(ix + 44, iy - 70, 1.0, caught ? 10 : -60, { t, seed: 7 });
    }
    if (caught) fx += K.C.burst(px, py - 40, seg(t, c.tc, c.tc + 0.45), '#FFE14D');
  }
  const cam2 = shook(cam, t, C.map((c) => [c.tc, 0.25, 10]));
  return cityFrame(t, cam2, { admin: 0.45 }, { chars: K.view(cam2, near + fx, CS.KF.near) });
}
// mouth of a sitting cat (x, y, s, rot) — head at (0, -222), mouth +40 in the 1.14-scaled head (cat units × .68 s)
function catMouth(x, y, s, rot) {
  const a = rot * Math.PI / 180, ly = -176 * 0.68 * s;
  return [x - ly * Math.sin(a), y + ly * Math.cos(a)];
}
// K — the beat: the cat carries the mailman down by his collar (like a kitten), sets him on the sidewalk... and licks his head
function shotK(t) {
  const u = seg(t, c14, c15);
  const cam = at(880, 640, lerp(1.45, 1.55, u));
  const rel = c14 + 0.55, lickA = c14 + 0.8, lickT = t - lickA;
  const lick = lickT > 0 ? Math.max(0, Math.sin(Math.min(lickT, 1.55) * Math.PI * 2 / 0.75)) : 0;
  const mx = 800, street = CS.CITY.street.y;
  const cs = 3.0, crot = -8;
  // the cat lowers its head while carrying, then raises it to lick from above
  const cy = t < rel ? lerp(1110, 1230, ease.inOut(seg(t, c14, rel))) : lerp(1230, 1040, ease.inOut(seg(t, rel, lickA)));
  const cx = mx + 50;
  const [mox, moy] = catMouth(cx, cy, cs, crot);
  let near = CATS.cat({ x: cx, y: cy, s: cs, t, pose: 'sit', coat: 'white', mood: 'happy', mouth: lick > 0.05 ? 'open' : t < rel ? 'o' : 'w', blink: lickT > 0 ? 1 : 0, rot: crot, seed: 9, shadow: false });
  // carried by the collar → standing
  const carried = t < rel;
  const my = carried ? Math.min(street, moy + 160) : street;
  const sq = 1 - 0.08 * lick;
  near += G(CS.mailman(0, 0, 0.25, { t, face: lickT > 1.3 ? 'happy' : 'shock', letters: 0, rot: carried ? Math.sin(t * 5) * 6 : 0 }), `translate(${mx} ${f(my)}) scale(1 ${f(sq)}) translate(${-mx} ${f(-my)}) translate(${mx} ${f(my)})`);
  if (lick > 0.02) near += E.tongue(mox, moy - 4, 0.5, 40 + 90 * lick, 4);
  // wet shine + drops on his cap after the first lick
  if (lickT > 0.35) near += P(`M${mx - 70} ${my - 250}q34 -22 80 -6`, ln(10, '#FFFFFF', 0.85)) + P(`M${mx - 100} ${my - 220}q-8 14 0 20q8 -6 0 -20Z M${mx + 80} ${my - 200}q-8 14 0 20q8 -6 0 -20Z`, ol('#9FE4FF', 3));
  if (lickT > 0.2) near += K.sparkles([[mx - 150, my - 300, 14], [mx + 130, my - 330, 12]], t);
  if (lickT > 0.9) near += G(P(K.F.heartPath(0, 0, 22), ol('#FF6F9A', 4)), tr(mx + 200, my - 420 - (lickT - 0.9) * 60, 1));
  return cityFrame(t, cam, { admin: 0.4, flyNear: false }, { chars: K.view(cam, near, 1) });
}
// the Admin's giant arm pointing along +x, fingertip at the origin (sleeve of code, gold cuff, light mitt + index finger)
function bigArm(x, y, ang, s, t) {
  let o = R(-2400, -150, 2100, 300, 60, ol('#FBFAF4', 10));
  let code = '';
  for (let r = 0; r < 6; r++) for (let i = 0; i < 9; i++) { const xx = -2300 + i * 220 + ((t * 90 + r * 70) % 220), w = 50 + hash(r * 9 + i) * 110; code += `M${f(xx)} ${f(-110 + r * 44)}h${f(w)}`; }
  o += P(code, ln(9, '#9FD8C0', 0.7)) + R(-2400, 70, 2100, 60, 0, { fill: '#E9E6F2', opacity: 0.8 });
  o += R(-330, -170, 70, 340, 20, ol('#FFC93C', 9));
  o += R(-270, -110, 190, 220, 70, ol('#FFFDF2', 9)) + R(-110, -40, 120, 70, 35, ol('#FFFDF2', 8));
  o += El(-30, -5, 30, 18, { fill: '#FFE7A0', opacity: 0.6 });
  return G(o, tr(x, y, s, ang));
}
// L1 — "And now..." the Admin turns his eyes to you
function shotL(t) {
  const tYou = Wd(8, 'you');
  if (t >= tYou - 0.12) return shotL2(t, tYou);
  const u = seg(t, c15, tYou);
  const cam = at(960, 470, lerp(1.0, 1.08, u));
  const lk = ease.inOut(seg(t, c15 + 0.1, Wd(8, 'now') + 0.3));
  const art = K.view(cam, adm(t, { x: 960, y: 1360, s: 0.95, glow: 1, armL: 22, armR: 22, face: { name: 'determined', eyes: { look: [0.8 * lk, 0.7 * lk], upper: 0.25 + 0.15 * lk } } }, { arms: false }), 0.25);
  return roofFrame(t, cam, { admin: 0.85 }, { skyArt: art });
}
// L2 — "...you." the finger of the Admin comes down at you; the spotlight snaps on
function shotL2(t, tYou) {
  const u = seg(t, tYou - 0.12, c16);
  const thr = ease.outBack(seg(t, tYou - 0.12, tYou + 0.18));
  const cam = shook(at(1020, 600, lerp(1.45, 1.55, u)), t, [[tYou + 0.05, 0.35, 14]]);
  const hx = 1120, hy = CS.ROOF.floor, hs = 0.5;
  const tip = [lerp(300, hx - 120, thr), lerp(-200, hy - 520 * hs * 1.9, thr)];
  let chars = E.spotCone(1100, -400, hx, hy, 240, seg(t, tYou, tYou + 0.15));
  chars += E.hero(t, { x: hx, y: hy, s: hs, laptop: 'back', face: { name: 'scared', eyes: { look: [-0.6, -0.8], pupil: 0.5 }, fx: ['sweat'] }, sy: 1 - 0.05 * thr, bodyY: 8 * thr, headRot: 6 });
  chars += bigArm(tip[0], tip[1], 35, 0.42, t);
  return roofFrame(t, cam, { admin: 0.9 }, { chars: K.view(cam, chars, 1) });
}
// M — ";kick you": ENTER, a golden strike, the KICKED window, you start to dissolve from the feet
const dissolveK = (t) => {
  const a = tKick + 0.12;
  const k = 0.55 * ease.out(seg(t, a, tGod)) ;
  return t < tGod ? k : k * (1 - ease.inOut(seg(t, tGod + 0.05, tGod + 0.6)));
};
function shotM(t) {
  const cam = shook(at(960, 560, 1.32), t, [[tKick, 0.4, 18]]);
  const prog = K.typeProgress(t, m[8], 3, 3);
  const pr = t < Wd(8, 'Kick') ? 0 : clamp((t - Wd(8, 'Kick')) / Math.max(0.15, tKick - Wd(8, 'Kick')), 0, 1);
  let art = K.view(cam, sky(960, 170, 780, 230, t, { text: ';kick you', progress: Math.max(prog, pr), glow: 1, size: 84 }), 0.1);
  const panic = Math.sin(t * 26) * 10 * seg(t, tKick, tKick + 0.2);
  const k = dissolveK(t);
  const inner = E.hero(t, { x: 960, y: CS.ROOF.floor, s: 0.42, laptop: 'back', armL: 26 + panic, armR: 26 - panic, face: { name: 'scared', eyes: { look: [0, 0.9] } }, headRot: 6 * Math.sin(t * 9) }, youAct);
  let chars = E.dissolve(inner, 960, CS.ROOF.floor, 0.42, k, t, { seed: 3 });
  const bk = bump(t, tKick - 0.02, tKick + 0.35);
  chars += E.tpBeam(960, CS.ROOF.floor, 0.42, bk, t, '#FFE38A') + K.commandBurst(960, CS.ROOF.floor - 200, t - tKick, '#FFC93C', 300);
  let over = E.kickedWindow(1480, 640, seg(t, tKick + 0.15, tKick + 0.4), 0.62, t) + flash(t, tKick, 0.2, '#FFF2C0', 0.7);
  return roofFrame(t, cam, { admin: 0.9 }, { skyArt: art, chars: K.view(cam, chars, 1), over });
}
// N — "God mode! GOD MODE ME!" — typing for your life; ENTER → gold, the pixels fly back
function shotN(t) {
  const u = seg(t, c17, c18);
  const cam = shook(K.camKeys(t, [[c17, at(960, 590, 1.85)], [tGod, at(960, 600, 1.95)], [c18, at(960, 560, 1.7)]]), t, [[tGod, 0.4, 16]]);
  const k = dissolveK(t);
  const gold = ease.out(seg(t, tGod, tGod + 0.4));
  const typing = Math.sin(t * 30) * 8 * (t < tGod ? 1 : 0);
  const face = t < tGod ? { name: 'scream', eyes: { look: [0, 0.4] }, fx: ['sweat'] } : t < tGod + 0.6 ? { name: 'amazed', eyes: { look: [0, -0.4] } } : { name: 'determined', eyes: { look: [0.4, -0.6] } };
  const inner = E.hero(t, { x: 960, y: CS.ROOF.floor, s: 0.42, laptop: 'back', armL: 26 + typing, armR: 26 - typing, face, gold }, youAct);
  let chars = E.dissolve(inner, 960, CS.ROOF.floor, 0.42, k, t, { seed: 3 });
  const prog = K.typeProgress(t, m[9], 'God', 'ME');
  const enter = clamp((t - tGod) / 0.35, 0, 1);
  let over = K.chatCommand(960, 150, ';god me', prog, { t, enter: t >= tGod ? enter : 0, s: 1.35 });
  over += E.kickedWindow(1560, 380, 1 - seg(t, tGod, tGod + 0.25), 0.42, t);
  over += K.accepted(960, 270, seg(t, tGod + 0.15, tGod + 0.4), 0.9, 'GOD MODE: ON') ;
  over += flash(t, tGod, 0.35, '#FFE07A', 0.9);
  void u;
  return roofFrame(t, cam, { admin: 0.75 }, { chars: K.view(cam, chars, 1) + K.view(cam, K.commandBurst(960, 520, t - tGod, '#FFC93C', 420), 1), over });
}
// O1 — "...dare... use god mode..." his eyes narrow
function shotO1(t) {
  const u = seg(t, c18, c19);
  const cam = at(960, 520, lerp(1.05, 1.25, ease.inOut(u)));
  let o = ecuBg(t, 0.5);
  const up = lerp(0.05, 0.62, ease.inOut(seg(t, c18, c19 - 0.2)));
  o += K.view(cam, adm(t, { x: 960, y: 1985, s: 1.5, glow: 0.4, armL: 8, armR: 8, face: { name: 'angry', eyes: { upper: up, tilt: 22 }, fx: [] } }, { arms: false }), 1);
  return o;
}
// O2 — "...against an ADMIN?" the flare; the sky splits further. You glow back.
function shotO2(t) {
  const u = seg(t, c19, c20);
  const fl = seg(t, tFlare - 0.05, tFlare + 0.3);
  const cam = shook(at(980, 470, lerp(1.25, 1.08, ease.out(u))), t, [[tFlare, 0.6, 24]]);
  const mid = K.view(cam, (fl > 0 ? K.rays(760, 230, 22, 1500, '#FFF6D0', 0.25 * fl, t * 30) : '') + adm(t, { x: 760, y: 960, s: 0.66, glow: 1, armL: lerp(20, 130, ease.outBack(fl)), armR: lerp(20, 130, ease.outBack(fl)), face: { name: 'angry', eyes: { upper: 0.5, tilt: 22 } } }, { arms: false }), 0.45);
  const H_ = CS.CITY.heroRoof;
  const near = K.view(cam, E.hero(t, { x: H_.x, y: H_.y, s: 0.16, laptop: 'back', gold: 1, face: { name: 'determined', eyes: { look: [-0.6, -0.6] } } }), CS.KF.near);
  return cityFrame(t, cam, { admin: 1, crackR: 560 + 260 * ease.out(fl) }, { mid, near }) + flash(t, tFlare, 0.3, '#FFFFFF', 0.8);
}
// P1 — the standoff: warm gold vs cold white-gold
function shotP1(t) {
  const u = seg(t, c20, c21);
  const cam = at(lerp(960, 990, u), lerp(540, 500, u), lerp(1.12, 1.0, ease.out(u)));
  const art = K.view(cam, adm(t, { x: 1340, y: 1050, s: 0.9, glow: 1, armL: 34, armR: 34, face: { name: 'angry', eyes: { upper: 0.45, look: [-0.6, 0.4] }, fx: [] } }, { arms: false }), 0.22);
  let wind = '';
  for (let i = 0; i < 14; i++) { const x = ((t * 500 + hash(i) * 2400) % 2400) - 240, y = 300 + hash(i * 3) * 600; wind += `M${f(x)} ${f(y)}h${f(60 + hash(i * 5) * 120)}`; }
  const chars = K.view(cam, E.hero(t, { x: 470, y: 1080, s: 0.62, laptop: 'back', gold: 1, turn: 0.35, face: { name: 'determined', eyes: { look: [0.8, -0.6] } } }), 1);
  return roofFrame(t, cam, { admin: 0.55 }, { skyArt: art, chars, over: P(wind, ln(4, '#FFFFFF', 0.35)) });
}
// P2 — VS card: YOU vs ADMIN — ROUND 1 — FIGHT!
function shotP2(t) {
  const u = seg(t, c21, END);
  const sl = ease.out(seg(t, c21, c21 + 0.35));
  let o = R(0, 0, 1920, 1080, 0, { fill: '#2A1640' });
  // warm half / cold half on a diagonal
  o += P('M0 0H1060L860 1080H0Z', { fill: '#FF7A2E' }) + P('M0 0H1060L860 1080H0Z', { fill: '#FFB13B', opacity: 0.35 + 0.15 * Math.sin(t * 6) });
  o += P('M1060 0H1920V1080H860Z', { fill: '#F4F2FA' }) + P('M1060 0H1920V1080H860Z', { fill: '#FFE9A0', opacity: 0.35 });
  o += K.rays(480, 540, 14, 1200, '#FFE14D', 0.22, t * 25) + K.rays(1440, 540, 14, 1200, '#FFFFFF', 0.4, -t * 25);
  o += P('M1060 0L860 1080', ln(26)) + P('M1060 0L860 1080', ln(12, '#FFFFFF'));
  // portraits slide in
  const hx = lerp(-500, 470, sl), ax = lerp(2400, 1400, sl);
  o += E.hero(t, { x: hx, y: 1300, s: 1.0, laptop: false, gold: 0.7, armL: 24, armR: 112, turn: 0.3, volume: false, face: { name: 'determined', eyes: { look: [0.8, 0] } } }, { arms: false });
  o += adm(t, { x: ax, y: 1470, s: 0.85, glow: 0.6, armL: 30, armR: 30, face: { name: 'angry', eyes: { upper: 0.45, look: [-0.6, 0.2] }, fx: [] }, shadow: false }, { arms: false });
  // name plates + HP bars
  const plate = (x, name, col, txtCol, rot) => G(R(-170, -44, 340, 88, 22, ol(col, 7)) + T(name, 0, 22, 62, txtCol), tr(x, 186, sl, rot));
  o += plate(250, 'YOU', '#D8262E', '#FFFFFF', -3) + plate(1700, 'ADMIN', '#FFC93C', '#221D44', 3);
  const bar = (x, w, fill, label, right) => R(x, 60, w, 54, 16, ol('#151515', 6)) + R(x + 8, 68, (w - 16) * fill, 38, 10, { fill: right ? '#FFC93C' : '#3DFF9A' }) + TF(label, right ? x + w - 18 : x + 18, 100, 30, '#FFFFFF', { 'text-anchor': right ? 'end' : 'start', ...E.OUT(6) });
  o += G(bar(60, 720, 1, 'HP 100  (GOD MODE)', false) + bar(1140, 720, 1, 'HP ∞', true), null, { opacity: f(sl) });
  // VS
  o += G(outT('VS', 0, 60, 230, '#FFE14D', 22) + K.F.sparkle(-150, -100, 40) + K.F.sparkle(160, 60, 30), tr(960, 520, pop(seg(t, c21 + 0.2, c21 + 0.5)) * (1 + 0.04 * Math.sin(t * 9)), -8));
  // ROUND 1 → FIGHT!
  const r1 = seg(t, tBegan - 0.55, tBegan - 0.3), fi = seg(t, tBegan, tBegan + 0.2);
  if (r1 > 0 && fi <= 0) o += G(outT('ROUND 1', 0, 0, 120, '#FFFFFF', 16), tr(960, 330, pop(r1), -4));
  if (fi > 0) o += G(outT('FIGHT!', 0, 0, 200, '#FF3B4E', 22), tr(960, 340, pop(fi) * (1 + 0.06 * Math.sin(t * 20)), -6)) + flash(t, tBegan, 0.25, '#FFFFFF', 0.6);
  void u;
  return K.shaken(t, tBegan, o, 0.4, 16) + whip(t, c21, 1, 0.18);
}

// ---------------------------------------------------------------- router
const SHOTS = [[c1, shotA], [c2, shotB], [c3, shotC], [c4, shotD], [c5, shotE1], [c6, shotE2], [c7, shotE3], [c8, shotE4], [c8b, shotF1], [c9, shotF2],
  [c10, shotG1], [c11, shotG2], [c12, shotH], [c13, shotI], [c13b, shotJ1], [c14, shotJ2], [c15, shotK], [c16, shotL], [c17, shotM], [c18, shotN],
  [c19, shotO1], [c20, shotO2], [c21, shotP1], [Infinity, shotP2]];
function scene(t) {
  for (const [end, fn] of SHOTS) if (t < end) return fn(t);
  return shotP2(t);
}
function look(t) {
  if (t >= c21) return { grade: null, vignette: 0.6 };
  if ((t >= c7 && t < c8) || (t >= c18 && t < c19)) return { grade: null, vignette: 1 };
  return { grade: 'cool', vignette: 0.85 };
}
// keep the captions off the VS name plates / the god chat bar
function captionY(t) { return 1010; }

module.exports = { scene, look, captionY, CUTS: { c1, c2, c3, c4, c5, c6, c7, c8, c8b, c9, c10, c11, c12, c13, c13b, c14, c15, c16, c17, c18, c19, c20, c21 } };
