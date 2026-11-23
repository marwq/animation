// SC 12 · AFTER + FINALE + END SCREEN — up from SC 11's navy dip: the MVP screen on the TV, pull back: 00:30, the whole family
// asleep on the couch with their devices (the BEDTIME 11 PM note next to the clock), Mom mumbling "Five more minutes..." while her
// thumb still taps the tablet; the hero wakes, pulls Granny's knitted throw over Dad: "Same time next week, champ?" — "Same time,
// Dad. Every week." The calendar flips to the next Saturday: the hero calls the family meeting (his crayon flip chart, FAMILY GAME
// NIGHT!, SAME SERVER! SAME TIME! stamps), Granny's invoice: RENT 50 COINS. The Cube City montage: the hero shows Dad the double
// jump — Dad does ONE jump (progress!) and flops into the water; Mom's training class in the arena, the sign-up sheet with
// xX_DarkBlade_Xx first, his shy "Thank you, Mrs. Mom."; Granny buys the Block King's castle (SOLD) -> COOKIE MUSEUM (a giant
// cookie lands on the keep) -> TICKETS 10 COINS (the hero pays: 12 -> 2). SYSTEM: "DarkBlade's mom joined the server" — the
// class freezes, she spawns with a rolling pin — "...MOM?!" — the two moms high-five. The outro line-up at sunset: WHO'S THE NOOB?
// (the roulette spotlight lands on the hot dog), "Tell me in the comments!" (a comment card), then the END SCREEN: two video slots
// right, the subscribe circle top-left, and the family on the rooftop at sunset — Dad keeps trying the double jump and finally
// lands it, DarkBlade's mom chases DarkBlade across the roof.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const R = require('./respawn');
const G = require('./gameui');
const GS = require('./sets_game');
const H = require('./sets_house');
const X = require('../rig/extras');
const AC = require('./acting');
const V = require('./vo');
const E = require('./s01_env');
const E12 = require('./s12_env');
const { handAt, D: DSG } = require('../rig/cast');
const { L } = V;
const { mod, tf, TS, TFS, pop, at, toScr, shakeAll, boing, whip, smash, fadeBlack, zoomLines, streaks, firework, commentCard, pill } = E;

// ================================================================= timing (pure: only the voice timeline)
function timing() {
  const A = Array.from({ length: 13 }, (_, i) => L('12.' + i));
  const w = (i, word, n = 0) => A[i].word(word, n).t0, w1 = (i, word, n = 0) => A[i].word(word, n).t1;
  const T0 = V.scene('SC 12').start, END = V.DURATION;
  const C = {};
  C.open = T0;                                  // the MVP screen on the TV -> pull back: the family asleep
  C.clock = w(0, 'at') - 0.15;                  // the clock: 0:30 (BEDTIME 11 PM note)
  C.mom = w(0, 'Not') - 0.12;                   // push on Mom asleep
  C.momClose = A[1].a - 0.1;                    // "Five more minutes..." — her thumb still taps
  C.blanket = A[1].b + 0.05;                    // the hero pulls the throw over Dad
  C.dad = A[2].a - 0.1;                         // Dad half-awake: "Same time next week, champ?"
  C.you = A[3].a - 0.08;                        // the hero: "Same time, Dad. Every week." + pull back
  C.saturday = A[4].a - 0.1;                    // the calendar flips to the next Saturday
  C.meeting = w(4, 'YOU') - 0.3;                // the kitchen: the hero calls the family meeting
  C.gameNight = A[5].a - 0.1;                   // FAMILY GAME NIGHT! / SAME SERVER! / SAME TIME!
  C.rent = A[6].a - 0.1;                        // Granny's invoice
  C.dj = A[7].a - 0.05;                         // Cube City: the hero's double jump
  C.djDad = w(7, 'double') - 0.35;              // Dad: one jump... splash
  C.klass = w(7, 'Mom') - 0.15;                 // Mom's training class
  C.signup = w(7, 'DarkBlade') - 0.15;          // the sign-up sheet + DarkBlade in the front row
  C.thanks = A[8].a - 0.15;                     // "Thank you, Mrs. Mom."
  C.castle = A[9].a - 0.1;                      // Granny buys the Block King's castle (SOLD)
  C.museum = w(9, "It's") - 0.1;                // COOKIE MUSEUM
  C.tickets = w(9, 'Tickets') - 0.12;           // TICKETS 10 COINS
  C.joined = A[10].a - 0.2;                     // DarkBlade's mom joined the server
  C.momQ = A[11].a - 0.08;                      // "...MOM?!"
  C.chase = A[11].b + 0.15;                     // the rolling pin, the moms' high five
  C.outro = A[12].a - 0.1;                      // the line-up at sunset
  C.noob = w(12, 'who') - 0.1;                  // WHO'S THE NOOB? roulette
  C.comments = w(12, 'Tell') - 0.1;             // the comment card
  C.end = A[12].b + 0.15;                       // END SCREEN
  const ks = Object.keys(C);
  for (let i = 1; i < ks.length; i++) if (C[ks[i]] < C[ks[i - 1]] + 0.25) C[ks[i]] = C[ks[i - 1]] + 0.25;
  const b = {
    nobody: w(0, 'nobody'), eleven: w(0, 'eleven'), momW: w(0, 'Mom'),
    five: w(1, 'Five'), minutes: w(1, 'minutes'),
    champ: w(2, 'champ'), sameT: w(3, 'Same'), dadW: w(3, 'Dad'), every: w(3, 'Every'), week: w(3, 'week'),
    next: w(4, 'next'), saturday: w(4, 'Saturday'), youW: w(4, 'YOU'), called: w(4, 'called'), meetingW: w(4, 'meeting'),
    family: w(5, 'Family'), night: w(5, 'Night'), server: w(5, 'server'), time: w(5, 'time'),
    rentW: w(6, 'rent'), dear: w(6, 'dear'),
    double: w(7, 'double'), jump: w(7, 'jump'), momW7: w(7, 'Mom'), training: w(7, 'training'), klass: w(7, 'class'), darkblade: w(7, 'DarkBlade'), signed: w(7, 'signed'), first: w(7, 'first'),
    thank: w(8, 'Thank'), mrs: w(8, 'Mrs'),
    bought: w(9, 'bought'), castleW: w(9, 'castle'), cookie: w(9, 'cookie'), museum: w(9, 'museum'), tickets: w(9, 'Tickets'), ten: w(9, 'ten'), coins: w(9, 'coins'),
    sysMom: w(10, 'mom'), sysJoined: w(10, 'joined'),
    momQ: A[11].a,
    so: w(12, 'So'), your: w(12, 'YOUR'), parents: w(12, 'parents'), who: w(12, 'who'), noob: w(12, 'noob'), tell: w(12, 'Tell'), comments: w(12, 'comments'),
  };
  b.djHero1 = C.dj + 0.1; b.djHero2 = C.dj + 0.38;
  b.dadJ1 = C.djDad + 0.12; b.dadJ2 = b.jump - 0.05; b.splash = b.jump + 0.42;
  b.highFive = C.chase + 0.85;
  b.spawn = b.sysJoined + 0.05;
  b.dadDJ = END - 2.3;                          // the end screen: Dad finally lands the double jump
  b.hop = b.every - 0.12; b.land = b.hop + 0.4; // the hero hops onto the couch next to Dad, under the throw
  b.crownPop = b.cookie - 0.12; b.cookieLand = b.cookie + 0.16;
  return { A, C, b, T0, END };
}
const { A, C, b, T0, END } = timing();

// ================================================================= the living room at 00:30
const LS = H.SPOTS.livingRoom;
const AS = LS.asleep;
const breath = (t, ph = 0, a = 3) => ({ bodyY: a + a * Math.sin(t * 2.2 + ph) });
// the MVP / victory screen for the TV (fn(w, h), centred)
function tvVictory(t) {
  return (w, h) => {
    let s = S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#2A1E5A' }) + S.rect(-w / 2, -h / 2 + h * 0.55, w, h * 0.45, 0, { fill: '#FFB45A', opacity: 0.6 });
    s += K.rays(0, -h * 0.05, 12, w * 0.8, '#FFE9A0', 0.25, t * 30);
    s += S.circle(0, -h * 0.08, h * 0.26, ol('#FFD43B', 4)) + TS('MVP', 0, -h * 0.04, h * 0.17, '#FFFFFF');
    s += S.rect(-w * 0.36, h * 0.2, w * 0.72, h * 0.16, 6, ol('#FF8A2B', 3)) + TF('DadBod1978', 0, h * 0.32, h * 0.11, '#FFFFFF');
    return s;
  };
}
function livingAsleep(t, o = {}) {
  return H.livingRoom.layers(t, { asleep: true, blanket: o.blanket ?? 0, tvScreen: o.tvScreen, tvGlow: o.tvGlow, glow: o.glow });
}
// the sleeping family (seated); o.heroAwake -> the hero is not in the chair; o.heroSeat -> he sleeps on the couch next to Dad;
// o.dadAwake 0..1; o.vol: volume on. Dad's laptop sits low on his lap BEFORE the couch front, so the throw covers it.
const HERO_SEAT = { x: 846, hip: 772, s: 0.5 };
const DAD_SEAT = { ...AS.dad, x: AS.dad.x + 24 };   // Dad nudged right: room for the hero on the couch
function sleepers(t, o = {}) {
  const vol = o.vol ? undefined : false;
  let s = '';
  s += actor('grandma', t, H.seatPose(AS.grandma, 0.9, { shadow: false, volume: vol, rot: AS.grandma.rot, curlers: true, phone: false, face: { name: 'sleepy', fx: ['zzz'] }, ...breath(t, 1) }));
  const dw = o.dadAwake || 0;
  s += actor('dad', t, H.seatPose(DAD_SEAT, 1.1, { shadow: false, volume: vol, rot: AS.dad.rot + 3 * dw, glasses: 'on', armL: 12, armR: 12, headRot: 3 * dw, face: dw > 0.3 ? { name: 'sleepy', mouth: V.talking('DAD', t) ? undefined : 'smile', eyes: { upper: 0.55 } } : { name: 'sleepy', fx: ['zzz'] }, ...breath(t, 2, 4) }));
  s += dadLaptop(t);
  if (o.heroSeat) s += actor('you', t, H.seatPose(HERO_SEAT, 1, { shadow: false, volume: vol, rot: 0, headRot: 11, armL: 8, armR: 14, face: { name: 'sleepy', mouth: 'smallSmile', fx: ['zzz'] }, ...breath(t, 0.5, 2), ...(o.heroBoing || {}) }));
  const mp = { shadow: false, volume: vol, rot: AS.mom.rot, pajamas: true, cup: false, headset: true, tablet: true, tabletFace: o.momScreen ? 'screen' : undefined, screen: o.momScreen, glow: o.momScreen ? 0.6 : undefined, face: { name: 'sleepy', fx: V.talking('MOM', t) ? [] : ['zzz'] }, ...breath(t, 3) };
  s += actor('mom', t, H.seatPose(AS.mom, 1.04, mp));
  if (!o.heroAwake) s += actor('you', t, H.seatPose(LS.seats.you, 1, { shadow: false, volume: vol, legL: 90, legR: 90, kneeL: 90, kneeR: 90, headset: true, headRot: 14, armL: 10, armR: 10, face: { name: 'sleepy', fx: ['zzz'] }, ...breath(t, 0, 2) }));
  return s;
}
const dadLaptop = (t, glow = 0.3) => X.laptopOld({ x: LS.devices.laptop.x + 30, y: 866, s: 0.46, rot: -6, face: 'lid', glow });
// Granny's phone slipped onto her lap, still glowing (after the armchair front)
const grannyPhone = (t) => X.phone({ x: 1734, y: 800, s: 0.27, rot: -82, face: 'screen', glow: 0.45 });
function bedtimeNote(x, y, s = 1, rot = 6, cross = 0) {
  let g = S.rect(-95, -80, 190, 160, 6, { fill: '#000', opacity: 0.25, transform: 'translate(6 8)' }) + S.rect(-95, -80, 190, 160, 6, ol('#FFE66A', 5)) + S.rect(-95, -80, 190, 30, 6, { fill: '#F2C94A' });
  g += TF('BEDTIME', 0, -10, 38, '#C0392B') + TF('11 PM!', 0, 40, 46, '#C0392B') + TF('- Mom', 40, 70, 20, '#7A5A2A');
  if (cross > 0) g += S.path(`M-80 -60 L${f(-80 + 160 * clamp(cross * 2, 0, 1))} ${f(-60 + 120 * clamp(cross * 2, 0, 1))}` + (cross > 0.5 ? ` M80 -60 L${f(80 - 160 * clamp(cross * 2 - 1, 0, 1))} ${f(-60 + 120 * clamp(cross * 2 - 1, 0, 1))}` : ''), ln(12, '#E8202A'));
  return S.g(g, tf(x, y, s, rot));
}
const NOTE = { x: 1645, y: 205 };
function roomScene(t, cam, o = {}) {
  const l = livingAsleep(t, o);
  let w = l.bg + l.mid + sleepers(t, o) + l.front + grannyPhone(t) + l.table + (o.standing || '') + bedtimeNote(NOTE.x, NOTE.y, 0.9, 6, o.cross || 0) + l.fg + l.light;
  return view(cam, w);
}

// ---- 1. the MVP on the TV -> pull back: everybody asleep
function shOpen(t) {
  const tvCam = { zoom: 2.7, x: -748, y: -206 };
  const cam = camKeys(t, [[C.open, tvCam], [C.open + 0.35, tvCam], [b.nobody + 0.25, AS.cam], [C.clock, { ...AS.cam, zoom: 1.27 }]], ease.inOut);
  let o = roomScene(t, cam, { tvScreen: tvVictory(t), tvGlow: 1 });
  o += fadeBlack(0);
  // up from SC 11's navy dip
  const k = 1 - seg(t, C.open, C.open + 0.45);
  if (k > 0) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#0B0E2A', opacity: f(k) });
  return o;
}
// ---- 2. the clock: 0:30 — next to Mom's BEDTIME 11 PM note
function shClock(t) {
  const cam = camKeys(t, [[C.clock, { zoom: 3.4, x: NOTE.x - 960 - 10, y: NOTE.y - 540 + 30 }], [b.eleven + 0.05, { zoom: 3.4, x: NOTE.x - 960 + 20, y: NOTE.y - 540 + 30 }], [b.eleven + 0.3, { zoom: 3.3, x: 1772 - 960 - 30, y: 196 - 540 + 30 }], [C.mom, { zoom: 3.1, x: 1772 - 960 - 60, y: 196 - 540 + 40 }]]);
  let o = roomScene(t, cam, { cross: seg(t, b.eleven + 0.35, b.eleven + 0.75) });
  const k = pop(t, b.eleven + 0.35, 0.3);
  if (k > 0.01) o += pill(1290, 830, '12:30 AM', 64, '#3A2A8A', '#FFE14D', { s: k, rot: -4 });
  return o + whip(t, b.eleven + 0.17, 1, 0.12);
}
// ---- 3. "Not even Mom." — push in
function shMom(t) {
  const cam = camKeys(t, [[C.mom, { zoom: 1.55, x: 300, y: 10 }], [C.momClose, { zoom: 2.0, x: 320, y: -10 }]]);
  let o = roomScene(t, cam, {});
  const k = pop(t, b.momW - 0.05, 0.3);
  if (k > 0.01) o += pill(1450, 200, 'MOM: BEDTIME = 11 PM', 40, '#FF5FA8', '#FFFFFF', { s: k, rot: 4 });
  return o + smash(t, C.mom, 0.08, 0.35);
}
// ---- 4. "Five more minutes..." — the thumb still taps the tablet
function momTabletScreen(t) {
  return (w, h) => {
    const tap = mod(t * 2.2, 1);
    let s = S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#5A3A8A' }) + S.rect(-w / 2, h * 0.1, w, h * 0.4, 0, { fill: '#C9A26A' });
    s += S.rect(-w * 0.1, -h * 0.15, w * 0.12, h * 0.3, 4, { fill: '#FFD43B', stroke: '#151515', 'stroke-width': 3 }) + S.rect(w * 0.12, -h * 0.05, w * 0.1, h * 0.25, 4, { fill: '#8AD06A', stroke: '#151515', 'stroke-width': 3 });
    if (tap < 0.35) s += S.path(`M${f(-w * 0.02)} ${f(-h * 0.2)} Q${f(w * 0.12)} ${f(-h * 0.3)} ${f(w * 0.2)} ${f(h * 0.05)}`, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 8, opacity: f(1 - tap / 0.35) }) + TF('K.O.', w * 0.18, -h * 0.25, h * 0.14, '#FFE14D');
    return s;
  };
}
function shMomClose(t) {
  const cam = camKeys(t, [[C.momClose, { zoom: 2.9, x: 1268 - 960, y: 560 - 540 }], [C.blanket, { zoom: 3.1, x: 1268 - 960, y: 575 - 540 }]]);
  let o = roomScene(t, cam, { momScreen: momTabletScreen(t), glow: [{ x: 1300, y: 560, col: 'tablet', k: 1, r: 160 }] });
  const tap = mod(t * 2.2, 1);
  if (tap < 0.25) o += S.circle(1210, 860, 30 + 120 * tap, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 6, opacity: f(1 - tap / 0.25) });
  o += S.g(TF('tap', 0, 0, 40, '#FFFFFF', { opacity: f(tap < 0.3 ? 1 - tap / 0.3 : 0), stroke: '#151515', 'stroke-width': 6, 'paint-order': 'stroke' }), tf(1300, 820 - 40 * tap, 1, -8));
  return o;
}
// ---- 5. the hero pulls the throw over Dad (his hands ride up with its top edge)
function heroCovering(t, k, o = {}) {
  const rl = o.relax || 0;   // 0 = hands on the throw, 1 = arms down
  const p = { x: lerp(736, 792, ease.inOut(k)), y: AS.you.y, s: AS.you.s, turn: 0.5, lean: 7 * k * (1 - rl), armR: lerp(lerp(52, 132, k), 22, rl) + 3 * Math.sin(t * 3), armL: lerp(lerp(20, 44, k), 14, rl), headRot: 5, face: o.face || { name: 'happy', eyes: { type: 'happy' } }, ...breath(t, 0, 2) };
  return actor('you', t, p, { arms: false });
}
function shBlanket(t) {
  const k = ease.inOut(seg(t, C.blanket + 0.1, C.dad - 0.15));
  const cam = camKeys(t, [[C.blanket, { zoom: 1.55, x: 880 - 960, y: 705 - 540 }], [C.dad, { zoom: 1.75, x: 900 - 960, y: 680 - 540 }]]);
  let o = roomScene(t, cam, { heroAwake: true, blanket: k, standing: heroCovering(t, k) });
  // a soft sparkle as the throw reaches his chin
  if (k > 0.85) o += view(cam, K.sparkles([[900, 640, 22], [1110, 650, 18], [1010, 600, 14]], t), 1);
  return o + smash(t, C.blanket, 0.08, 0.3);
}
// ---- 6. Dad, half-awake: "Same time next week, champ?" (over the hero's shoulder)
function shDad(t) {
  const cam = camKeys(t, [[C.dad, { zoom: 2.2, x: 935 - 960, y: 615 - 540 }], [C.you, { zoom: 2.35, x: 940 - 960, y: 612 - 540 }]]);
  const wake = seg(t, C.dad - 0.05, C.dad + 0.3);
  const hero = heroCovering(t, 1, { face: { name: 'happy', eyes: { look: [0.6, -0.4] } } });
  return roomScene(t, cam, { heroAwake: true, blanket: 1, dadAwake: wake, standing: hero, vol: false });
}
// ---- 7. the hero: "Same time, Dad. Every week." -> he hops onto the couch beside Dad, under the throw -> pull back
function shYou(t) {
  const cam = camKeys(t, [[C.you, { zoom: 2.3, x: 860 - 960, y: 612 - 540 }], [b.hop - 0.05, { zoom: 2.2, x: 870 - 960, y: 615 - 540 }], [C.saturday, { ...AS.cam, zoom: 1.3 }]], ease.inOut);
  let standing = '', seated = false, heroBoing;
  if (t < b.hop) standing = heroCovering(t, 1, { relax: ease.inOut(seg(t, C.you, C.you + 0.45)), face: t < b.every - 0.3 ? { name: 'happy' } : { name: 'happy', eyes: { type: 'happy' } } });
  else if (t < b.land) {
    const u = seg(t, b.hop, b.land);
    standing = actor('you', t, { x: lerp(792, HERO_SEAT.x, ease.inOut(u)), y: lerp(AS.you.y, HERO_SEAT.hip + 153, ease.inOut(u)), s: AS.you.s, lift: 80 * Math.sin(u * Math.PI), turn: lerp(0.5, 0, u), armL: 70, armR: 70, kneeL: 40, kneeR: 40, legL: 20, legR: 20, face: { name: 'happy', eyes: { type: 'happy' } } }, { arms: false });
  } else { seated = true; heroBoing = boing(t, b.land, 0.12); }
  let o = roomScene(t, cam, { heroAwake: true, heroSeat: seated, heroBoing, blanket: 1, dadAwake: 1 - seg(t, b.every, b.every + 0.6), standing });
  o += view(cam, G.emoteHearts({ x: 935, y: 470, age: t - (b.land + 0.1), n: 7, s: 0.6, seed: 9, life: 1.6 }));
  return o;
}

// ================================================================= the next Saturday: the kitchen
// ---- 8. the calendar flips
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
function calendar(t) {
  const u = seg(t, C.saturday + 0.1, b.saturday + 0.1);
  const n = Math.min(6, Math.floor(u * 7));
  const flip = mod(u * 7, 1);
  const page = (i, extra = '') => {
    let g = S.rect(-330, -380, 660, 760, 30, ol('#FFFDF4', 9)) + S.rect(-330, -380, 660, 170, 30, { fill: '#E84A3A' }) + S.rect(-330, -250, 660, 40, 0, { fill: '#E84A3A' }) + S.path('M-330 -210 H330', ln(8));
    g += S.rect(-330, -380, 660, 760, 30, { fill: 'none', stroke: '#151515', 'stroke-width': 9 });
    g += TS(DAYS[i], 0, -250, 110, '#FFFFFF') + TS(String(15 + i), 0, 160, 300, i === 6 ? '#E84A3A' : '#2A2A3A');
    for (const x of [-200, -70, 70, 200]) g += S.rect(x - 14, -410, 28, 60, 12, ol('#B9BCC4', 5));
    return g + extra;
  };
  let g = '';
  if (n < 6) {
    g += page(n + 1);
    const sy = Math.cos(flip * Math.PI);   // the top page flips up
    if (sy > -0.99) g += S.g(page(n), `translate(0 -380) scale(1 ${f(Math.max(0.02, Math.abs(sy)))}) translate(0 380)`, sy < 0 ? { opacity: 0.0 } : {});
  } else {
    const c = seg(t, b.saturday + 0.15, b.saturday + 0.6);
    let ex = '';
    if (c > 0) ex += S.path(`M-160 160 a170 150 0 1 1 ${f(1)} 0`, { fill: 'none', stroke: '#2E7BFF', 'stroke-width': 16, 'stroke-dasharray': '1100', 'stroke-dashoffset': f(1100 * (1 - c)), 'stroke-linecap': 'round' });
    ex += S.g(TF('GAME NIGHT!', 0, 0, 52, '#2E7BFF') + G.heart(150, -12, 24, '#FF4B5C', 4), tf(0, 330, pop(t, b.saturday + 0.45, 0.3), -4));
    g += page(6, ex);
  }
  return g;
}
function kitchenScene(t, cam, o = {}) {
  const KS = H.SPOTS.kitchen.seats;
  const l = H.kitchen.layers(t, { next: true, time: 'day' });
  const look = o.look || [-0.8, 0];
  let seated = actor('dad', t, H.seatPose(KS.dad, 1.1, { shadow: false, ...(o.dad || {}), face: o.dadFace || { name: 'happy', eyes: { look } } }), { arms: !(o.dad && o.dad.armR !== undefined) });
  seated += actor('mom', t, H.seatPose(KS.mom, 1.04, { shadow: false, mug: true, ...(o.mom || {}), face: o.momFace || { name: 'happy', eyes: { look } } }), { arms: !(o.mom && o.mom.armR !== undefined) });
  seated += actor('grandma', t, H.seatPose(KS.grandma, 0.9, { shadow: false, knitting: !o.invoice, ...(o.gran || {}), face: o.granFace || { name: 'happy', eyes: { look } } }), { arms: !(o.gran && o.gran.armR !== undefined) });
  const HD = H.SPOTS.kitchen.head;
  const hero = actor('you', t, { x: HD.x, y: HD.y, s: HD.s, turn: 0.35, ...(o.hero || {}) }, { arms: !(o.hero && o.hero.armR !== undefined) });
  return view(cam, l.bg + l.mid + seated + l.front + hero + (o.extra || '') + l.fg + l.light);
}
function shSaturday(t) {
  let o = kitchenScene(t, { zoom: 1.05, x: 0, y: 0 }, {});
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#2A1E5A', opacity: f(0.55 * (1 - seg(t, C.meeting - 0.25, C.meeting))) });
  const k = ease.outBack(seg(t, C.saturday, C.saturday + 0.3)) * (1 - ease.in(seg(t, C.meeting - 0.25, C.meeting)));
  if (k > 0.01) o += S.g(calendar(t), tf(960, 520 + 700 * ease.in(seg(t, C.meeting - 0.25, C.meeting)), 0.95 * k, -3));
  o += TS('NEXT SATURDAY', 960, 120, 84, '#FFE14D', { opacity: f(seg(t, b.next - 0.1, b.next + 0.1) * (1 - seg(t, C.meeting - 0.2, C.meeting))) });
  // dark night -> morning: a quick flash from the previous scene
  return o + whip(t, C.saturday, 1, 0.12);
}
// ---- 9. the hero calls the meeting (ding ding ding)
function shMeeting(t) {
  const HD = H.SPOTS.kitchen.head;
  const cam = camKeys(t, [[C.meeting, { zoom: 1.0, x: 0, y: 0 }], [b.youW - 0.05, { zoom: 1.05, x: -40, y: 0 }], [b.youW + 0.15, { zoom: 1.7, x: HD.x - 960 + 150, y: 650 - 540 }], [C.gameNight, { zoom: 1.75, x: HD.x - 960 + 160, y: 650 - 540 }]]);
  // he taps a glass on the table with a spoon: ding ding ding
  const ding = Math.max(0, Math.sin((t - b.called) * 22)) * (t > b.called - 0.05 && t < b.meetingW + 0.6 ? 1 : 0);
  const hero = { armR: 66 - 10 * ding, armL: 24, face: { name: 'determined', mouth: 'smirk' }, ...boing(t, b.youW, 0.15) };
  const hd = handAt(DSG.you, { ...hero, turn: 0.35 }, 1), h0 = handAt(DSG.you, { ...hero, armR: 66, turn: 0.35 }, 1);
  const hx = HD.x + hd[0] * HD.s, hy = HD.y + hd[1] * HD.s, gx = HD.x + h0[0] * HD.s + 88;
  const spoon = S.g(S.rect(-6, -70, 12, 90, 5, ol('#C9D3E6', 3)) + S.ellipse(0, -80, 16, 22, ol('#C9D3E6', 3)), tf(hx, hy, HD.s * 2, 96 + 8 * ding));
  const glass = S.g(S.path('M-20 -50 L20 -50 L16 20 L-16 20 Z', { fill: '#BFEFFF', opacity: 0.75, stroke: '#151515', 'stroke-width': 4 }) + S.path('M-14 -20 L14 -20 L12 16 L-12 16 Z', { fill: '#FFB347', opacity: 0.8 }), tf(gx, 712 - 20 * HD.s * 2, HD.s * 2));
  let o = kitchenScene(t, cam, { hero, look: [-1, 0], extra: glass + spoon });
  if (ding > 0.5) o += view(cam, S.g(TF('DING!', 0, 0, 40, '#FFE14D', { stroke: '#151515', 'stroke-width': 7, 'paint-order': 'stroke' }), tf(gx + 30, 600 - 30 * ding, 1, -10)) + S.path(`M${f(gx - 34)} 640 l-18 -16 M${f(gx + 34)} 640 l18 -16 M${f(gx)} 626 v-22`, ln(4, '#FFFFFF')));
  const k = pop(t, b.youW - 0.02, 0.3);
  if (k > 0.01) o += S.g(S.rect(-300, -56, 600, 112, 34, { fill: '#000', opacity: 0.3, transform: 'translate(10 12)' }) + S.rect(-300, -56, 600, 112, 34, ol('#FF5A3D', 8)) + TS('CHAIRMAN: YOU', 0, 22, 62, '#FFFFFF'), tf(1480, 118, k, 4));
  return o + whip(t, C.meeting, -1, 0.1);
}
// ---- 10. FAMILY GAME NIGHT! / SAME SERVER! / SAME TIME!
function shGameNight(t) {
  const cam = camKeys(t, [[C.gameNight, { zoom: 1.3, x: -260, y: 20 }], [b.server - 0.25, { zoom: 1.25, x: -180, y: 20 }], [b.server - 0.05, { zoom: 1.6, x: 880 - 960, y: 520 - 540 }], [b.time - 0.05, { zoom: 1.6, x: 900 - 960, y: 520 - 540 }], [b.time + 0.12, { zoom: 1.6, x: 1180 - 960, y: 520 - 540 }], [C.rent, { zoom: 1.05, x: 0, y: 0 }]], ease.inOut);
  const jumpK = bump(t, b.family - 0.05, b.night + 0.4);
  const hero = { armL: 160 + 10 * Math.sin(t * 12), armR: 160 - 10 * Math.sin(t * 12), lift: 60 * jumpK, face: { name: 'excited' } };
  const dadUp = seg(t, b.server - 0.1, b.server + 0.15), momUp = seg(t, b.time - 0.1, b.time + 0.15);
  const o2 = {
    hero, look: [-1, -0.1],
    dad: { armR: lerp(12, 160, ease.outBack(dadUp)), armL: 12 },
    dadFace: dadUp > 0 ? { name: 'joy' } : undefined,
    mom: { mugUp: momUp > 0.5 }, momFace: momUp > 0 ? { name: 'happy', eyes: { type: 'happy' } } : undefined,
  };
  let o = kitchenScene(t, cam, o2);
  o += G.bigTitle({ text: 'FAMILY GAME NIGHT!', k: seg(t, b.family - 0.1, b.night + 0.3), out: seg(t, b.server - 0.3, b.server - 0.1), t, theme: 'gold', x: 960, y: 260, s: 0.75 });
  o += G.stamp({ text: 'SAME SERVER!', k: seg(t, b.server - 0.05, b.server + 0.45), out: seg(t, b.time - 0.1, b.time + 0.05), x: 1350, y: 230, s: 0.8, rot: -8, col: '#2E9E5B' });
  o += G.stamp({ text: 'SAME TIME!', k: seg(t, b.time - 0.05, b.time + 0.45), out: seg(t, C.rent - 0.2, C.rent), x: 620, y: 230, s: 0.8, rot: 7, col: '#2E7BFF' });
  o += R.blockConfetti({ x: 960, y: 520, age: t - (b.family - 0.05), n: 36, seed: 12, s: 0.8, power: 0.8 });
  return o + smash(t, b.server, 0.08, 0.35) + smash(t, b.time, 0.08, 0.35);
}
// ---- 11. Granny: "And don't forget your rent, dear."
function invoice(t, k) {
  if (k <= 0.01) return '';
  let g = S.rect(-230, -300, 460, 600, 14, { fill: '#000', opacity: 0.3, transform: 'translate(10 14)' }) + S.rect(-230, -300, 460, 600, 14, ol('#FFFDF4', 7));
  g += S.rect(-230, -300, 460, 90, 14, { fill: '#FF8FC8' }) + S.rect(-230, -240, 460, 30, 0, { fill: '#FF8FC8' }) + S.path('M-230 -210 H230', ln(6));
  g += TS('INVOICE', 0, -236, 60, '#FFFFFF');
  g += TF('TO: my grandson', -190, -150, 30, '#5A5F70', { 'text-anchor': 'start' }) + TF('CASTLE RENT', -190, -80, 40, '#2A2A3A', { 'text-anchor': 'start' });
  g += S.path('M-190 -50 H190', ln(4, '#D8D2C0')) + TF('1 week', -190, 0, 32, '#5A5F70', { 'text-anchor': 'start' }) + G.coinIcon(110, -12, 22) + TF('50', 170, 0, 40, '#2A2A3A', { 'text-anchor': 'end' });
  g += TF('family discount', -190, 60, 28, '#2E9E5B', { 'text-anchor': 'start' }) + TF('-0', 170, 60, 32, '#2E9E5B', { 'text-anchor': 'end' });
  g += S.path('M-190 100 H190', ln(5, '#2A2A3A')) + TF('TOTAL', -190, 150, 40, '#2A2A3A', { 'text-anchor': 'start' }) + G.coinIcon(100, 136, 24) + TF('50', 170, 152, 48, '#E84A3A', { 'text-anchor': 'end' });
  g += S.g(S.path('M-30 0 Q-30 -26 0 -14 Q30 -26 30 0 Q30 22 0 30 Q-30 22 -30 0 Z', { fill: '#E8607A', opacity: 0.85 }), tf(150, 240, 1, -14)) + TF('xoxo Granny', -60, 252, 28, '#B04A7A');
  return S.g(g, tf(1420, 520, ease.outBack(k), 5));
}
function shRent(t) {
  const KS = H.SPOTS.kitchen.seats;
  const toHero = b.dear + 0.05;
  const cam = camKeys(t, [[C.rent, { zoom: 2.3, x: KS.grandma.x - 960 - 40, y: 470 - 540 }], [toHero - 0.02, { zoom: 2.4, x: KS.grandma.x - 960 - 40, y: 475 - 540 }], [toHero + 0.1, { zoom: 2.6, x: H.SPOTS.kitchen.head.x - 960 + 20, y: 560 - 540 }], [C.dj, { zoom: 2.7, x: H.SPOTS.kitchen.head.x - 960 + 20, y: 560 - 540 }]]);
  const gran = { armR: 70 + 6 * Math.sin(t * 4), armL: 20 };
  const hero = t > toHero ? { armR: 10, armL: 10, face: { name: 'deadpan', fx: ['sweat'] } } : { armR: 20, armL: 20, face: { name: 'happy' } };
  let o = kitchenScene(t, cam, { gran, granFace: { name: 'happy', eyes: { type: t > b.dear ? 'happy' : undefined, look: [-0.6, 0] } }, invoice: true, hero, look: [-0.6, 0] });
  o += invoice(t, seg(t, b.rentW - 0.25, b.rentW + 0.05) * (t < toHero ? 1 : 1));
  if (t > toHero) o += K.bang('...', 660, 300, pop(t, toHero + 0.1, 0.2), 120, 0, '#FFFFFF');
  return o + whip(t, toHero, 1, 0.08);
}

// ================================================================= Cube City montage
const PZ = GS.SPOTS.plaza;
const ST = PZ.start;        // standing ON the obby start block (y 684)
function splash(x, y, age, s = 1) {
  if (age < 0 || age > 1.1) return '';
  let d = '';
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + (hash(i * 3.3) - 0.5) * 2.2, v = (500 + 500 * hash(i * 1.7)) * s;
    const px = x + Math.cos(a) * v * age, py = y + Math.sin(a) * v * age + 1400 * s * age * age, r = (10 + 12 * hash(i)) * s * (1 - age * 0.6);
    d += `M${f(px - r)} ${f(py)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`;
  }
  const ring = S.ellipse(x, y, 60 * s + 260 * s * age, 16 * s + 50 * s * age, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 8 * s, opacity: f(1 - age) });
  return S.path(d, { fill: '#E8FBFF', stroke: '#151515', 'stroke-width': 3 * s, opacity: f(1 - seg(age, 0.7, 1.1)) }) + ring;
}
function jumpRing(x, y, age, s = 1) {
  if (age < 0 || age > 0.45) return '';
  const u = age / 0.45;
  return S.ellipse(x, y, (40 + 140 * u) * s, (12 + 40 * u) * s, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 10 * s * (1 - u), opacity: f(1 - u) });
}
const jumpArc = (t, t0, dur, h) => (t > t0 && t < t0 + dur ? h * Math.sin(((t - t0) / dur) * Math.PI) : 0);
// ---- 12. the hero's double jump (tutorial): a real two-impulse jump (g 3600 px/s²)
function doubleJumpLift(t, t1, t2, v1 = 850, v2 = 1200, g = 3600) {
  if (t < t1) return 0;
  const h1 = (u) => v1 * u - 0.5 * g * u * u;
  if (t < t2) return Math.max(0, h1(t - t1));
  const h2 = Math.max(0, h1(t2 - t1)), u = t - t2;
  return Math.max(0, h2 + v2 * u - 0.5 * g * u * u);
}
function shDJ(t) {
  const cam = camKeys(t, [[C.dj, GS.camAt(2715, 455, 1.0)], [C.djDad, GS.camAt(2730, 445, 1.06)]]);
  const l = GS.plaza.layers(t, cam, { time: 'day' });
  const s = 0.4;
  const lift = doubleJumpLift(t, b.djHero1, b.djHero2);
  const inAir = lift > 1;
  const flip = t > b.djHero2 && t < b.djHero2 + 0.5 ? 360 * ease.inOut(seg(t, b.djHero2, b.djHero2 + 0.5)) : 0;   // a flip on the second jump
  const landT = b.djHero2 + 0.74;
  let hero = actor('you', t, { x: ST.x + 30, y: ST.y, s, nametag: flip ? false : 'YOU', crown: true, lift, armL: inAir ? 150 : 25, armR: inAir ? 150 : 25, legL: inAir ? 25 : 0, kneeL: inAir ? 50 : 0, legR: inAir ? -10 : 0, kneeR: inAir ? 20 : 0, face: { name: 'excited' }, ...(t > landT ? boing(t, landT, 0.2) : {}) }, { arms: false });
  if (flip) { const cy = ST.y - lift - 190 * s * 1.0; hero = S.g(hero, `rotate(${f(flip)} ${f(ST.x + 30)} ${f(cy)})`); }
  const dad = actor('dadAvatar', t, { x: ST.x - 160, y: ST.y, s, turn: 0.4, armR: 30 + 10 * Math.sin(t * 5), armL: 20, headRot: -6 * Math.min(1, lift / 200), face: { name: 'amazed', eyes: { look: [0.5, -0.8 * Math.min(1, lift / 200)] } } }, { arms: false });
  let w = dad + hero + jumpRing(ST.x + 30, ST.y - 10, t - b.djHero1, 0.8) + jumpRing(ST.x + 30, ST.y - doubleJumpLift(b.djHero2, b.djHero1, b.djHero2) - 10, t - b.djHero2, 1);
  let o = l.bg + l.mid + view(cam, w, 1) + l.front + l.light;
  const k = pop(t, C.dj + 0.05, 0.3);
  if (k > 0.01) {
    let g = S.rect(-360, -70, 720, 140, 40, { fill: '#1E2546', opacity: 0.9, stroke: '#151515', 'stroke-width': 7 }) + TF('DOUBLE JUMP:', -175, 16, 42, '#FFFFFF');
    g += G.keycap({ x: 105, y: 0, w: 150, h: 76, label: 'SPACE', t, press: bump(t, b.djHero1 - 0.04, b.djHero1 + 0.12) }) + G.keycap({ x: 270, y: 0, w: 150, h: 76, label: 'SPACE', t, press: bump(t, b.djHero2 - 0.04, b.djHero2 + 0.12) });
    o += S.g(g, tf(420, 112, 0.86 * k));
  }
  if (t > b.djHero2) o += K.bang('x2!', 1330, 300, pop(t, b.djHero2, 0.2) * (1 - seg(t, b.djHero2 + 0.6, b.djHero2 + 0.8)), 110, 10, '#FFE14D');
  return o + whip(t, C.dj, 1, 0.12);
}
// ---- 13. Dad: one jump... then the second one goes wrong -> splash
function shDJDad(t) {
  const cam = camKeys(t, [[C.djDad, GS.camAt(2800, 480, 1.0)], [b.splash - 0.12, GS.camAt(2900, 590, 0.98)], [C.klass, GS.camAt(2920, 600, 1.04)]]);
  shakeAll(cam, t, [[b.splash, 0.4, 12]]);
  const l = GS.plaza.layers(t, cam, { time: 'day' });
  const s = 0.4;
  // jump 1: up (he CAN jump now!) ; jump 2: flails, drifts over the gap and drops into the water
  const j1 = t < b.dadJ2 ? doubleJumpLift(t, b.dadJ1, 1e9, 800, 0, 3000) : 0;
  const fallU = seg(t, b.dadJ2, b.splash);
  let dx = 0, lift = j1, rot = 0;
  if (t > b.dadJ2) { dx = lerp(0, PZ.gap.mid - (ST.x - 40), ease.inOut(fallU)); lift = 120 * Math.sin(Math.min(1, fallU * 1.6) * Math.PI) - 520 * ease.in(fallU); rot = 40 * fallU; }
  const sunk = t > b.splash;
  const flail = t > b.dadJ2 ? Math.sin(t * 30) * 40 : 0;
  let w = '';
  const heroP = { x: ST.x + 140, y: ST.y, s, nametag: 'YOU', crown: true, turn: -0.4, armL: t > b.splash ? 160 : 30, armR: 20, face: t > b.splash ? { name: 'deadpan' } : { name: 'nervous' } };
  if (!sunk) w += actor('dadAvatar', t, { x: ST.x - 40 + dx, y: ST.y, s, lift, rot, armL: 60 + flail, armR: 60 - flail, nametag: t < b.dadJ2, face: t > b.dadJ2 ? { name: 'scared', mouth: 'O' } : { name: 'excited' } }, { arms: false });
  else if (t > b.splash + 0.3) {
    // he bobs back up, treading water and waving (the water's front layer covers him below the water line)
    const up = ease.outBack(seg(t, b.splash + 0.3, b.splash + 0.75)), bob = 6 * Math.sin(t * 6);
    w += actor('dadAvatar', t, { x: PZ.gap.mid, y: PZ.water.y + 560 - 340 * up + bob, s, nametag: false, shadow: false, armL: 150 + 25 * Math.sin(t * 9), armR: 40, headRot: 6 * Math.sin(t * 3), face: { name: 'happy', mouth: 'wavy', eyes: { type: 'swirl' } } }, { arms: false });
  }
  let o = l.bg + l.mid + view(cam, w, 1) + l.front;
  o += view(cam, actor('you', t, heroP, { arms: false }) + splash(PZ.water.splash.x, PZ.water.y, t - b.splash, 1.6) + jumpRing(ST.x - 40, ST.y - 10, t - b.dadJ1 - 0.45, 1), 1);
  o += l.light;
  if (t > b.dadJ1 + 0.15 && t < b.dadJ2) o += pill(1380, 200, 'JUMP 1 OK!', 54, '#3BD16F', '#FFFFFF', { s: pop(t, b.dadJ1 + 0.15, 0.25), rot: -6 });
  if (t > b.splash) o += pill(1240, 186, 'DOUBLE JUMP: FAILED', 54, '#FF4B5C', '#FFFFFF', { s: pop(t, b.splash + 0.05, 0.25), rot: 4 });
  return o;
}
// ---- 14. Mom's training class (arena, day)
const ARN = GS.SPOTS.arena;
const MOMT = { x: 1460, y: 870, s: 0.42 };
const KLASS = [   // [kind, i, x, y] back -> front; DarkBlade front row centre
  ['p', 3, 520, 780], ['n', 4, 700, 780], ['p', 10, 880, 780], ['n', 6, 1060, 780],
  ['p', 7, 430, 860], ['dark', 0, 760, 880], ['n', 2, 1050, 870],
];
const KLASS_CAM = GS.camAt(960, 640, 1.0);
function klassSvg(t, o = {}) {
  const swing = (ph) => 70 + 80 * Math.max(0, Math.sin(ph));
  const ph = (o.freeze !== undefined ? o.freeze : t) * 5;
  let w = '';
  for (const [kind, i, x, y] of KLASS) {
    const s = ARN.sAt ? ARN.sAt(y) : 0.42 * (y - 380) / 520;
    if (kind === 'dark') { if (!o.noDark) w += o.dark ? o.dark(s, x, y) : actor('darkblade', t, { x, y, s, turn: 0.35, armR: swing(ph + 0.2) + 10, sword: 'right', swordGlow: 0.6, ...breath(t, 1, 2) }, { arms: false }); continue; }
    const p = { x, y, s, turn: 0.35, armR: swing(ph + i * 0.05), sword: 'steel', face: o.faceAll || 'determined', ...breath(t, i, 2) };
    w += kind === 'p' ? K.draw.player(i, { shade: true, ...p }) : K.draw.noob(i, { shade: true, ...p });
  }
  return w;
}
function whistle(x, y, s, blow) {
  return S.g(S.rect(-30, -14, 60, 28, 10, ol('#C9D3E6', 4)) + S.circle(26, 0, 18, ol('#C9D3E6', 4)) + (blow > 0 ? S.path('M-40 -10 l-40 -20 M-42 0 h-46 M-40 10 l-40 20', ln(6, '#FFFFFF', blow)) : ''), tf(x, y, s));
}
function shClass(t) {
  const cam = camKeys(t, [[C.klass, GS.camAt(960, 600, 0.95)], [C.signup, GS.camAt(1000, 620, 1.1)]]);
  const l = GS.arena.layers(t, cam, { time: 'day', cheer: 0.3, board: ["MOM'S CLASS", 'STRETCH FIRST!'] });
  const demo = 70 + 80 * Math.max(0, Math.sin(t * 5));
  const mom = actor('momAvatar', t, { ...MOMT, armor: 1, turn: -0.5, armR: demo, armL: 30, swordGlow: 0.5, face: { name: 'happy' } }, { arms: false });
  let o = l.bg + l.mid + view(cam, klassSvg(t) + mom, 1) + l.front + l.light;
  const k = pop(t, b.training - 0.1, 0.3);
  if (k > 0.01) o += S.g(S.rect(-330, -60, 660, 120, 36, { fill: '#000', opacity: 0.3, transform: 'translate(10 12)' }) + S.rect(-330, -60, 660, 120, 36, ol('#FF5FA8', 8)) + TS("MOM'S TRAINING CLASS", 0, 22, 54, '#FFFFFF'), tf(960, 150, k, -3));
  if (k > 0.01) o += pill(1500, 270, 'FREE WATER!', 40, '#5CC8FF', '#FFFFFF', { s: pop(t, b.klass, 0.3), rot: 6 });
  return o + whip(t, C.klass, -1, 0.12);
}
// ---- 15. the sign-up sheet + DarkBlade in the front row
function signSheet(t, k) {
  if (k <= 0.01) return '';
  let g = S.rect(-300, -380, 600, 760, 30, { fill: '#000', opacity: 0.3, transform: 'translate(12 14)' }) + S.rect(-300, -380, 600, 760, 30, ol('#B9844A', 8)) + S.rect(-260, -330, 520, 680, 10, ol('#FFFDF4', 5));
  g += S.rect(-90, -410, 180, 70, 16, ol('#C9D3E6', 6));
  g += TS("MOM'S CLASS", 0, -250, 56, '#FF5FA8') + TF('SIGN-UP SHEET', 0, -200, 32, '#5A5F70');
  const names = ['xX_DarkBlade_Xx', 'PizzaKid', 'noob_2011', 'Kitty4Ever', 'ObbyQueen'];
  names.forEach((n, i) => {
    const ty = seg(t, b.signed + 0.0 + (i ? 0.2 + i * 0.1 : 0), b.signed + (i ? 0.45 + i * 0.1 : 0.4));
    const y = -120 + i * 90;
    g += TF(`${i + 1}.`, -220, y, 40, '#2A2A3A', { 'text-anchor': 'start' }) + S.path(`M-170 ${y + 10} H230`, ln(3, '#D8D2C0'));
    const txt = n.slice(0, Math.round(n.length * ty));
    g += TF(E.esc(txt), -160, y, i ? 34 : 38, i ? '#4A4F60' : '#E8202A', { 'text-anchor': 'start' });
  });
  const st = pop(t, b.first - 0.05, 0.3);
  if (st > 0.01) g += S.g(S.path('M0 -48 L14 -16 L48 -14 L22 8 L30 42 L0 24 L-30 42 L-22 8 L-48 -14 L-14 -16 Z', ol('#FFD43B', 5)) + TF('1st!', 0, 90, 34, '#E8202A'), tf(225, -140, st, 12));
  return S.g(g, tf(1450, 520, ease.outBack(k), 4));
}
function shSignup(t) {
  const cam = camKeys(t, [[C.signup, GS.camAt(760, 640, 1.6)], [C.thanks, GS.camAt(760, 630, 1.75)]]);
  const l = GS.arena.layers(t, cam, { time: 'day', cheer: 0.3, board: ["MOM'S CLASS", 'STRETCH FIRST!'] });
  const eager = Math.abs(Math.sin(t * 9));
  const dark = (s, x, y) => actor('darkblade', t, { x, y, s, turn: 0.2, armR: 165 + 8 * Math.sin(t * 14), armL: 20, sword: false, lift: 18 * eager, swordGlow: 0 }, { arms: false });
  let o = l.bg + l.mid + view(cam, klassSvg(t, { dark }), 1) + l.front + l.light;
  // a speech bubble from DarkBlade (no mouth): "ME! ME!"
  const [dx, dy] = toScr(cam, 760, 880 - 1020 * 0.42 * (880 - 380) / 520 / 0.42 * 0.42 - 60);
  o += G.chatBubble({ x: dx - 70, y: Math.max(300, dy + 110), t, text: 'me first!!', typed: seg(t, C.signup + 0.2, C.signup + 0.6), k: seg(t, C.signup + 0.1, C.signup + 0.35), out: seg(t, b.signed - 0.1, b.signed + 0.1), s: 1.1, user: 'xX_DarkBlade_Xx', tail: 0.85 });
  o += signSheet(t, seg(t, b.signed - 0.3, b.signed));
  return o + smash(t, C.signup, 0.08, 0.35);
}
// ---- 16. "Thank you, Mrs. Mom."
function shThanks(t) {
  // Mom offers him a water bottle (callback to "Drink some water!"); he takes it shyly on "Mrs. Mom"
  const DK = { x: 880, y: 900, s: 0.44 }, MM = { x: 1095, y: 900, s: 0.44 };
  const cam = camKeys(t, [[C.thanks, GS.camAt(990, 645, 1.9)], [C.castle, GS.camAt(990, 655, 2.05)]]);
  const l = GS.arena.layers(t, cam, { time: 'day', cheer: 0.2 });
  const offer = ease.inOut(seg(t, C.thanks + 0.05, b.thank + 0.35)), take = ease.inOut(seg(t, b.mrs - 0.35, b.mrs + 0.05));
  const pass = t > b.mrs - 0.12;
  const momP = { ...MM, armor: 1, sword: false, shield: false, turn: -0.45, armR: 20, armL: lerp(lerp(28, 72, offer), 30, pass ? seg(t, b.mrs, b.mrs + 0.35) : 0), face: { name: 'happy', mouth: 'smile', eyes: { type: 'happy' } } };
  const hm = handAt(DSG.momAvatar1, momP, -1);
  if (!pass) momP.props = [{ svg: E12.waterBottle(hm[0], hm[1] - 40, 1.25, -8), layer: 'front' }];
  const dkP = { ...DK, shy: true, turn: 0.35, headRot: -8 + 3 * Math.sin(t * 4), armL: 22, armR: lerp(22, 62, take), bodyY: 3 * Math.abs(Math.sin(t * 7)) * take, face: { name: 'cute', fx: ['blush'] } };
  const hd = handAt(DSG.darkblade, dkP, 1);
  if (pass) dkP.props = [{ svg: E12.waterBottle(hd[0], hd[1] - 40, 1.25, 10), layer: 'front' }];
  const dk = actor('darkblade', t, dkP, { arms: false });
  const mom = actor('momAvatar', t, momP, { arms: false });
  let o = l.bg + l.mid + view(cam, mom + dk + G.emoteHearts({ x: DK.x + 20, y: DK.y - 470, age: t - (b.mrs + 0.1), n: 8, s: 0.6, seed: 4 }), 1) + l.front + l.light;
  return o + smash(t, C.thanks, 0.08, 0.3);
}
// ---- 17. Granny buys the Block King's castle (SOLD) / 18. COOKIE MUSEUM / 19. TICKETS 10 COINS
// The castle is our own dark castle (s12_env) on the mushroom plot of Tycoon Valley — not the hero's castle.
const BK = E12.BK;
const TN_DAY = GS.tone(GS.timeTone({ time: 'day' }));
function castleLayers(t, cam, mu, crownPop, extra = '', after = '') {
  const l = GS.tycoon.layers(t, cam, { time: 'day', granny: 4 });
  const world = E12.bkCastle(TN_DAY, t, { museum: mu }) + E12.stoneCrown(BK.x, BK.keepTop - 30, TN_DAY, t, crownPop) + extra;
  return l.bg + l.mid + view(cam, world, 1) + l.front + view(cam, after, 1) + l.light;
}
function grannyWalkIn(t, t0, t1, x0, x1, y, s, extra = {}) {
  const u = seg(t, t0, t1), walking = u > 0 && u < 1;
  const x = lerp(x0, x1, ease.out(u));
  return actor('grandmaAvatar', t, { x, y, s, ...(walking ? { view: 'side', ...AC.walk((t - t0) * 9, 0.9) } : { turn: -0.35 }), ...extra }, { arms: !extra.armR });
}
function shCastle(t) {
  const cam = camKeys(t, [[C.castle, GS.camAt(BK.x, 330, 1.25)], [C.castle + 0.25, GS.camAt(BK.x, 340, 1.22)], [b.bought - 0.1, GS.camAt(BK.x + 90, 560, 0.9)], [C.museum, GS.camAt(BK.x + 110, 575, 0.95)]], ease.inOut);
  shakeAll(cam, t, [[b.bought + 0.12, 0.35, 12]]);
  const pay = bump(t, b.bought - 0.1, b.bought + 0.6);
  const g = grannyWalkIn(t, C.castle + 0.2, b.bought - 0.15, BK.x + 820, BK.front.x, BK.front.y, BK.front.s, t > b.bought - 0.15 ? { armR: 60 + 70 * pay, armL: 30, coins: pay, face: { name: 'smug' } } : { face: { name: 'smug' } });
  let o = castleLayers(t, cam, 0, 0, '', g + (t > b.bought ? K.coinBurst(BK.front.x - 40, BK.front.y - 260, seg(t, b.bought, b.bought + 1.2), 20, 700, 22, 7) : ''));
  o += G.stamp({ text: 'SOLD!', k: seg(t, b.bought + 0.05, b.bought + 0.5), x: 1010, y: 660, s: 1.1, rot: -12 });
  if (t > b.castleW - 0.1) o += pill(1450, 200, 'NEW OWNER: GrannyGoodies', 40, '#B57BFF', '#FFFFFF', { s: pop(t, b.castleW - 0.1, 0.3), rot: 4 });
  return o + whip(t, C.castle, 1, 0.12);
}
function giantCookie(t) {
  const u = seg(t, b.cookie - 0.3, b.cookieLand);
  if (u <= 0) return '';
  const y = lerp(BK.keepTop - 1500, BK.keepTop - 175, ease.in(u)), sq = boing(t, b.cookieLand, 0.25);
  const spin = 200 * (1 - u);
  return S.g(X.cookie({ x: 0, y: 0, r: 200, rot: spin }), `translate(${f(BK.x)} ${f(y)}) scale(${f(sq.sx)} ${f(sq.sy)})`) + (u >= 1 ? GS.glow(BK.x, BK.keepTop - 175, 300, 'gsGlowWarm', 0.25 * (1 - seg(t, b.cookieLand, b.cookieLand + 1))) : '');
}
function queueSvg(t, n = 6) {
  // players queue on the red carpet to get in (walk in from the right, then shuffle)
  let w = '';
  for (let i = n - 1; i >= 0; i--) {
    const x = BK.x + 160 + i * 115 + 6 * Math.sin(t * 3 + i), y = BK.base + 190 - (i % 2) * 14;
    w += K.draw.player(i + 3, { x, y, s: GS.SPOTS.tycoon.sAt(y), view: 'side', ...AC.walk(i + t * 3, 0.15), face: 'happy', shade: true, shadow: true });
  }
  return w;
}
function shMuseum(t) {
  const cam = camKeys(t, [[C.museum, GS.camAt(BK.x + 40, 420, 0.82)], [b.cookieLand, GS.camAt(BK.x + 30, 450, 0.86)], [C.tickets, GS.camAt(BK.x + 20, 500, 0.92)]], ease.inOut);
  shakeAll(cam, t, [[b.cookieLand, 0.4, 16]]);
  const mu = ease.inOut(seg(t, b.museum - 0.12, b.museum + 0.3));
  const crownPop = seg(t, b.crownPop, b.crownPop + 0.55);
  let o = castleLayers(t, cam, mu, crownPop, giantCookie(t) + (t > b.cookieLand ? K.C.burst(BK.x, BK.keepTop - 40, seg(t, b.cookieLand, b.cookieLand + 0.4), '#FFE9A0') : ''), queueSvg(t));
  if (t > b.cookieLand) o += K.bang('THUD!', 560, 220, pop(t, b.cookieLand, 0.2) * (1 - seg(t, b.cookieLand + 0.5, b.cookieLand + 0.7)), 100, -8, '#FFE14D');
  const k = pop(t, b.museum - 0.05, 0.3);
  if (k > 0.01) o += S.g(S.rect(-330, -62, 660, 124, 36, { fill: '#000', opacity: 0.3, transform: 'translate(10 12)' }) + S.rect(-330, -62, 660, 124, 36, ol('#C98A4E', 8)) + TS('COOKIE MUSEUM', 0, 24, 66, '#FFFFFF'), tf(1440, 150, k, 4));
  if (mu > 0 && mu < 1) o += K.C.whiteFlash(0.35 * Math.sin(mu * Math.PI));
  return o + smash(t, C.museum, 0.08, 0.35);
}
// the booth body with a window HOLE (evenodd) so Granny, drawn behind, shows through it
function boothBack(x, y, s) {
  return S.g(S.path('M-170 -380 H170 V0 H-170 Z M-130 -330 V-180 H130 V-330 Z', { fill: '#FF9FC8', 'fill-rule': 'evenodd', stroke: '#151515', 'stroke-width': 7, 'stroke-linejoin': 'round' }) + S.path('M-130 -330 V-180 H130 V-330 Z', { fill: 'none', stroke: '#151515', 'stroke-width': 6 }), tf(x, y, s));
}
function shTickets(t) {
  const BX = BK.x - 360, BY = BK.base + 210, BS = 0.9;
  const cam = camKeys(t, [[C.tickets, GS.camAt(BX + 150, BY - 260, 1.55)], [C.joined, GS.camAt(BX + 165, BY - 255, 1.65)]]);
  const pay = seg(t, b.ten, b.coins + 0.2);
  // inside the booth (behind): a warm back wall + Granny, then the booth body with the window hole
  const inner = S.rect(BX - 120 * BS, BY - 330 * BS, 240 * BS, 150 * BS, 0, { fill: '#FFE9D0' });
  const gran = actor('grandmaAvatar', t, { x: BX, y: BY + 50, s: 0.4, nametag: false, bag: false, cane: false, turn: 0.25, armR: 70 + 40 * bump(t, b.ten, b.coins + 0.3), armL: 20, face: { name: 'happy', eyes: { type: t > b.coins ? 'happy' : undefined } } }, { arms: false });
  let w = inner + gran + boothBack(BX, BY, BS);
  // the counter + roof + price board in front
  w += S.g(S.rect(-136, -186, 272, 14, 5, ol('#FFF6E8', 4)) + S.path('M-190 -380 L190 -380 L160 -450 L-160 -450 Z', ol('#E8607A', 7)) + S.path('M-130 -450 V-380 M-60 -450 V-380 M10 -450 V-380 M80 -450 V-380', ln(5, '#FFFFFF')) + S.rect(-150, -150, 300, 60, 10, ol('#FFFFFF', 5)) + TF('TICKETS', -40, -108, 34, '#E8607A') + G.coinIcon(60, -120, 18) + TF('10', 110, -106, 36, '#2A2A3A'), tf(BX, BY, BS));
  const hp = { x: BX + 300, y: BY + 10, s: 0.42, nametag: false, crown: true, turn: -0.55, armR: 20, armL: lerp(25, 80, bump(t, b.ten - 0.15, b.coins + 0.35)), face: pay > 0.5 ? { name: 'deadpan', fx: ['sweat'] } : { name: 'neutral', eyes: { look: [-0.6, 0] } } };
  const hh = handAt(DSG.you, hp, -1);
  let coinsFly = '';
  if (pay > 0 && pay < 1) for (let i = 0; i < 5; i++) { const u = clamp(pay * 1.4 - i * 0.08, 0, 1); if (u > 0 && u < 1) coinsFly += G.coinIcon(lerp(hp.x + hh[0] * hp.s, BX + 60, u), lerp(hp.y + hh[1] * hp.s, BY - 230, u) - 80 * Math.sin(u * Math.PI), 16); }
  w += actor('you', t, hp, { arms: false }) + coinsFly;
  let o = castleLayers(t, cam, 1, 1, '', queueSvg(t, 4) + w);
  o += G.coinCounter({ x: 60, y: 90, value: Math.round(lerp(12, 2, ease.inOut(pay))), bump: seg(t, b.coins + 0.2, b.coins + 0.65), k: pop(t, C.tickets + 0.05, 0.25), t, s: 1.25, anchor: 'left' });
  if (t > b.ten) o += K.bang('-10', 620, 230, pop(t, b.ten, 0.2) * (1 - seg(t, b.ten + 0.6, b.ten + 0.8)), 110, -6, '#FF4B5C');
  return o + whip(t, C.tickets, -1, 0.1);
}

// ================================================================= DarkBlade's mom
const DBM = { x: 420, y: 950, s: 0.46 };
function shJoined(t) {
  const cam = camKeys(t, [[C.joined, GS.camAt(820, 610, 1.0)], [b.spawn - 0.1, GS.camAt(700, 615, 1.0)], [C.momQ, GS.camAt(640, 620, 1.08)]]);
  const l = GS.arena.layers(t, cam, { time: 'day', cheer: 0.25, board: ["MOM'S CLASS", 'STRETCH FIRST!'] });
  const frozen = t > b.sysMom ? b.sysMom : null;
  const dark = (s, x, y) => actor('darkblade', t, { x, y, s, turn: frozen ? -0.6 : 0.35, armR: frozen ? 110 : 70 + 80 * Math.max(0, Math.sin(t * 5 + 0.2)), sword: 'right', swordGlow: 0.6, ...(frozen ? { sx: 1 - 0.04 * Math.sin(t * 60) } : breath(t, 1, 2)) }, { arms: false });
  let w = klassSvg(t, { dark, freeze: frozen ?? undefined, faceAll: frozen ? 'shocked' : 'determined' });
  w += actor('momAvatar', t, { ...MOMT, armor: 1, turn: -0.5, armR: frozen ? 30 : 70 + 80 * Math.max(0, Math.sin(t * 5)), armL: 30, face: frozen ? { name: 'confused' } : { name: 'happy' } }, { arms: false });
  // the spawn: a pop on the arena edge
  const age = t - b.spawn;
  w += R.respawnPop({ x: DBM.x, y: DBM.y, s: DBM.s, age, part: 'back', col: '#FF5FA8' });
  if (age >= 0) { const pp = R.popPose(age, DBM.s); if (!pp.hidden) w += actor('darkbladeMom', t, { ...DBM, turn: 0.4, armR: 150, sx: pp.sx, sy: pp.sy, lift: pp.lift, face: { name: 'angry', fx: ['anger'] } }); }
  w += R.respawnPop({ x: DBM.x, y: DBM.y, s: DBM.s, age, part: 'front', col: '#FF5FA8' });
  let o = l.bg + l.mid + view(cam, w, 1) + l.front + l.light;
  const tk = seg(t, C.joined, C.joined + 0.35), tout = seg(t, C.momQ - 0.15, C.momQ);
  const icon = E12.roundIcon(actor('darkbladeMom', t, { x: 0, y: 128, s: 0.115, nametag: false, rollingPin: false, volume: false, shadow: false, face: 'angry' }), 's12DbmIco');
  o += G.joinToast({ x: 1180, y: 150, anchor: 'center', s: 1.25, user: "DarkBlade's mom", col: '#FF9AE0', icon, k: tk, out: tout, t });
  if (frozen) o += view(cam, S.g(TS('!', 0, 0, 120, '#FF4B5C'), tf(800, 405, pop(t, b.sysMom, 0.25), 8)));
  return o + whip(t, C.joined, 1, 0.1);
}
function shMomQ(t) {
  const DK = { x: 960, y: 1080 + 690 * 1.05, s: 1.05 };
  const sh = K.shake(t, b.momQ, 0.7, 22);
  const l = GS.arena.layers(t, GS.camAt(760, 560, 2.3), { time: 'day', cheer: 0 });
  let o = l.bg + l.mid + l.front;
  o += zoomLines(960, 450, 1, t, '#FFFFFF', 26, 420);
  const vis = seg(t, C.momQ, C.momQ + 0.08);
  o += actor('darkblade', t, { x: DK.x + sh.sx, y: 470 + 690 * 1.05 + sh.sy, s: 1.05, volume: false, shadow: false, shy: vis > 0.5, sword: false, armL: 20, armR: 20, headRot: 4 * Math.sin(t * 40), face: { name: 'scream', fx: ['sweat2'] }, nametag: false });
  o += K.bang('!!!', 1500, 260, pop(t, b.momQ + 0.1, 0.2), 150, 10, '#FF4B5C');
  return o + smash(t, C.momQ, 0.14, 0.8);
}
function shChase(t) {
  const cam = camKeys(t, [[C.chase, GS.camAt(820, 640, 1.2)], [C.outro, GS.camAt(860, 640, 1.3)]]);
  const l = GS.arena.layers(t, cam, { time: 'day', cheer: 0.6 });
  const u = t - C.chase;
  const hf = b.highFive;
  const walkIn = seg(t, C.chase, hf - 0.1);
  const mx = lerp(DBM.x + 60, 900, ease.out(walkIn));
  const tap = Math.sin(t * 14);
  let w = '';
  // DarkBlade hides behind MOM_OFFICIAL (peeking out)
  w += actor('darkblade', t, { x: 1230, y: 880, s: 0.42, shy: true, sword: false, turn: -0.6, armL: 40, armR: 40, bodyY: 4 * Math.sin(t * 30), face: { name: 'scared', fx: ['sweat2'] }, nametag: false });
  const five = seg(t, hf - 0.15, hf), after = t > hf;
  w += actor('momAvatar', t, { x: 1120, y: 900, s: 0.44, armor: 1, sword: false, nametag: false, turn: -0.4, armL: after ? lerp(150, 120, seg(t, hf, hf + 0.4)) : lerp(30, 150, five), armR: 25, face: { name: 'happy', eyes: { type: after ? 'happy' : undefined } } }, { arms: false });
  w += actor('darkbladeMom', t, { x: mx, y: 900, s: 0.44, turn: 0.4, nametag: false, ...(walkIn < 1 ? AC.walkFront(u * 9, 1) : {}), armR: after ? lerp(150, 120, seg(t, hf, hf + 0.4)) : walkIn < 1 ? 120 + 20 * tap : lerp(120, 150, five), armL: 40, face: after ? { name: 'happy', eyes: { type: 'happy' } } : { name: 'angry', fx: ['anger'] } }, { arms: false });
  if (after) w += K.C.burst(1015, 900 - 0.44 * 1180, seg(t, hf, hf + 0.4), '#FFE14D') + G.emoteHearts({ x: 1010, y: 900 - 0.44 * 1250, age: t - hf, n: 8, s: 0.6, seed: 6 });
  let o = l.bg + l.mid + view(cam, w, 1) + l.front + l.light;
  if (after) o += K.bang('MOM HIGH FIVE!', 960, 270, pop(t, hf, 0.25), 90, -5, '#FF5FA8');
  return o + smash(t, hf, 0.08, 0.4);
}

// ================================================================= the outro line-up at sunset
const LINE_Y = 930;
const FAM = [
  { who: 'grandmaAvatar', x: 300 }, { who: 'momAvatar', x: 520, armor: 1 }, { who: 'you', x: 745 }, { who: 'dadAvatar', x: 985 },
];
function lineup(t, o = {}) {
  const s = PZ.sAt(LINE_Y);
  let w = '';
  FAM.forEach((m, i) => {
    let p = { x: m.x, y: LINE_Y, s, ...breath(t, i, 2) };
    if (m.who === 'you') p = { ...p, nametag: 'YOU', crown: true, armR: o.point ? 95 : 20 + 6 * Math.sin(t * 4), armL: 18, turn: 0.1, face: o.heroFace || { name: 'happy' } };
    if (m.who === 'momAvatar') p = { ...p, armor: 1, armR: o.wave ? 150 + 20 * Math.sin(t * 12) : 30, armL: 30, face: { name: 'happy' } };
    if (m.who === 'grandmaAvatar') p = { ...p, armL: 25, armR: o.wave ? 140 + 20 * Math.sin(t * 11 + 1) : 30, coins: 0.3 + 0.3 * Math.sin(t * 3), face: { name: 'smug' } };
    if (m.who === 'dadAvatar') p = { ...p, armL: o.dadSelf ? 110 + 10 * Math.sin(t * 8) : o.wave ? 150 + 20 * Math.sin(t * 13 + 2) : 20, armR: o.dadSelf ? 20 : 25 + 6 * Math.sin(t * 5), face: o.dadSelf ? { name: 'joy' } : { name: 'happy' } };
    if (o.laugh && m.who !== 'dadAvatar') p = { ...p, bodyY: 5 * Math.abs(Math.sin(t * 16 + i)), face: { name: 'joy' } };
    w += actor(m.who, t, p, { arms: false });
  });
  return w;
}
const OUT_CAM = GS.camAt(645, 640, 1.18);
function shOutro(t) {
  const cam = camKeys(t, [[C.outro, GS.camAt(645, 600, 1.0)], [b.your - 0.06, GS.camAt(660, 600, 1.05)], [b.your + 0.12, GS.camAt(745, 640, 1.75)], [b.parents + 0.45, GS.camAt(745, 645, 1.8)], [b.parents + 0.75, GS.camAt(645, 630, 1.12)], [C.noob, OUT_CAM]]);
  shakeAll(cam, t, [[b.your, 0.3, 10]]);
  const l = GS.plaza.layers(t, cam, { time: 'sunset' });
  const point = t > b.your - 0.1;
  let o = l.bg + l.mid + view(cam, lineup(t, { point, heroFace: point ? { name: 'excited' } : undefined, wave: t > b.parents - 0.1 && t < b.parents + 0.9 }), 1) + l.front + l.light;
  if (t > b.your) o += zoomLines(960, 420, seg(t, b.your, b.your + 0.12) * (1 - seg(t, b.your + 0.35, b.your + 0.55)), t, '#FFFFFF', 22, 460);
  return o + K.C.whiteFlash(0.7 * (1 - seg(t, C.outro, C.outro + 0.3))) + smash(t, b.your, 0.1, 0.4);
}
function shNoob(t) {
  const l = GS.plaza.layers(t, OUT_CAM, { time: 'sunset' });
  // the roulette spotlight: hops between the four, slows down, lands on the hot dog on "noob"
  const u = seg(t, C.noob, b.noob + 0.05);
  const hops = Math.floor(ease.out(u) * 9);
  const idx = u >= 1 ? 3 : hops % 4;
  const landed = u >= 1;
  const s = PZ.sAt(LINE_Y);
  const sx = FAM[idx].x;
  let w = S.g(S.path(`M${sx - 60} -200 L${sx + 60} -200 L${sx + 190} ${LINE_Y} L${sx - 190} ${LINE_Y} Z`, { fill: 'url(#s01Spot)' }) + S.ellipse(sx, LINE_Y, 200, 40, { fill: '#FFF6C8', opacity: 0.35 }));
  w += lineup(t, { dadSelf: landed, laugh: landed });
  let o = l.bg + l.mid + view(OUT_CAM, w, 1) + l.front + l.light;
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1040', opacity: 0.25 });
  o += TS("WHO'S THE NOOB?", 960, 118, 100, '#FFE14D', { opacity: f(seg(t, C.noob, C.noob + 0.15)) });
  if (landed) {
    const [nx, ny] = toScr(OUT_CAM, FAM[3].x, LINE_Y - 1240 * 1.06 * s - 85);
    o += S.g(S.rect(-130, -50, 260, 100, 26, ol('#FF4B5C', 7)) + TS('NOOB?', 0, 22, 64, '#FFFFFF') + S.path('M-16 50 L0 80 L16 50 Z', ol('#FF4B5C', 5)), tf(nx, ny, pop(t, b.noob + 0.05, 0.3), -6));
  }
  return o;
}
function shComments(t) {
  const l = GS.plaza.layers(t, OUT_CAM, { time: 'sunset' });
  let o = l.bg + l.mid + view(OUT_CAM, lineup(t, { point: true, heroFace: { name: 'excited' } }), 1) + l.front + l.light;
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1040', opacity: 0.2 });
  const k = seg(t, C.comments, C.comments + 0.3);
  o += commentCard(560, 170, k, { t, text: 'my dad. 100%', typed: seg(t, b.tell + 0.2, b.comments + 0.4), heartAt: b.comments + 0.3, w: 800 });
  o += TS('TELL ME IN THE COMMENTS!', 960, 110, 72, '#FFFFFF', { opacity: f(seg(t, b.tell, b.tell + 0.15)) });
  return o;
}

// ================================================================= END SCREEN (last ~9.5 s): slots right, subscribe top-left, family left
const SLOT = [{ x: 1150, y: 120, w: 700, h: 394, label: 'WATCH NEXT' }, { x: 1150, y: 586, w: 700, h: 394, label: 'MORE WHAT IFs' }];
const SUB = { x: 250, y: 235, r: 140 };
function slotSvg(sl, t, k, i) {
  if (k <= 0) return '';
  const pulse = 0.5 + 0.5 * Math.sin(t * 3 + i);
  let g = S.rect(-12, -12, sl.w + 24, sl.h + 24, 28, { fill: '#FFFFFF', opacity: f(0.1 + 0.06 * pulse) });
  g += S.rect(0, 0, sl.w, sl.h, 20, { fill: '#1A1040', opacity: 0.55, stroke: '#FFFFFF', 'stroke-width': 6, 'stroke-dasharray': '26 16', 'stroke-dashoffset': f(-t * 40) });
  g += S.path(`M${sl.w / 2 - 34} ${sl.h / 2 - 44} L${sl.w / 2 + 46} ${sl.h / 2} L${sl.w / 2 - 34} ${sl.h / 2 + 44} Z`, { fill: '#FFFFFF', opacity: 0.25 });
  return S.g(g, `translate(${f(sl.x + 80 * (1 - ease.out(k)))} ${f(sl.y)})`, { opacity: f(k) });
}
const ROOF = 1000, RS = 0.37;
function endFamily(t) {
  const u = t - C.end;
  let w = '';
  // the chase across the roof behind the family: DarkBlade runs, his mom follows with the rolling pin
  const lap = 4.2, cu = mod(u + 1.2, lap) / lap;
  const dir = cu < 0.5 ? 1 : -1, cx = cu < 0.5 ? lerp(-180, 860, cu * 2) : lerp(860, -180, (cu - 0.5) * 2);
  const chaseY = 965, cs = 0.32;
  w += actor('darkblade', t, { x: cx, y: chaseY, s: cs, view: 'side', flip: dir > 0, shy: true, sword: false, ...AC.run(t * 16, 1), face: { name: 'scream' }, nametag: false });
  w += actor('darkbladeMom', t, { x: cx - dir * 210, y: chaseY, s: cs, view: 'side', flip: dir > 0, ...AC.run(t * 14 + 1, 0.9), armR: 150, armL: 150, face: { name: 'angry' }, nametag: false });
  // Granny (coins), Mom (cheering), the hero (waves + points at the subscribe circle), Dad (double-jump attempts)
  w += actor('grandmaAvatar', t, { x: 150, y: ROOF, s: RS, coins: 0.5 + 0.5 * Math.sin(t * 3), armL: 25, armR: 40 + 20 * Math.sin(t * 5), turn: 0.2, face: { name: 'rich' }, nametag: true });
  const won = t > b.dadDJ + 0.9;
  const cheer = won ? Math.abs(Math.sin(t * 10)) : 0;
  w += actor('momAvatar', t, { x: 390, y: ROOF, s: RS, armor: 1, armL: won ? 150 + 15 * cheer : 30 + 20 * Math.sin(t * 4), armR: won ? 150 : 110 + 30 * Math.sin(t * 4), swordGlow: 0.5, lift: 20 * cheer, face: { name: won ? 'joy' : 'happy' } }, { arms: false });
  const wave = mod(u, 3.2) < 1.3;
  w += actor('you', t, { x: 640, y: ROOF, s: RS, nametag: 'YOU', crown: true, turn: -0.15, armL: won ? 160 : wave ? 150 + 22 * Math.sin(u * 11) : 20, armR: won ? 160 : 18, lift: 30 * cheer, face: { name: won ? 'excited' : 'happy' }, ...AC.breathe(t) }, { arms: false });
  // Dad: attempts every 2.4 s — jump 1 works, the second flips him onto his HEAD (he stays in his own column, clear of the
  // video slots), he flips back and tries again; the last attempt (b.dadDJ) is a real double jump
  const DX = 900, HC = 0.5 * 1240 * 1.06 * RS;   // body centre height (pivot for the flips)
  let dl = 0, drot = 0, dface = { name: 'determined' }, arms = { armL: 25, armR: 25 }, kick = 0;
  const dj = b.dadDJ;
  if (!won && t < dj) {
    const pu = mod(u - 0.6, 2.4);
    if (pu < 0.4) { dl = doubleJumpLift(pu, 0, 1e9, 760, 0, 3600); arms = { armL: 120, armR: 120 }; dface = { name: 'excited' }; }
    else if (pu < 0.85) { const q = (pu - 0.4) / 0.45; dl = 90 * Math.sin(q * Math.PI); drot = 180 * ease.inOut(q); arms = { armL: 60 + 60 * Math.sin(t * 30), armR: 60 - 60 * Math.sin(t * 30) }; dface = { name: 'scared', mouth: 'O' }; }
    else if (pu < 1.65) { drot = 180 + 7 * Math.sin(t * 14); kick = 1; dface = { name: 'dizzy' }; arms = { armL: 40, armR: 40 }; }
    else if (pu < 2.0) { const q = (pu - 1.65) / 0.35; dl = 70 * Math.sin(q * Math.PI); drot = 180 + 180 * ease.inOut(q); dface = { name: 'determined' }; }
  } else if (t >= dj && t < dj + 0.95) {
    dl = doubleJumpLift(t, dj, dj + 0.25, 700, 760, 3000);
    arms = { armL: 160, armR: 160 }; dface = { name: 'excited' };
  } else { arms = { armL: 150 + 15 * cheer, armR: 150 - 15 * cheer }; dface = { name: 'joy', fx: ['tears'] }; dl = 25 * cheer; }
  const legs = kick ? { legL: 30 * Math.sin(t * 18), legR: -30 * Math.sin(t * 18) } : {};
  const dad = actor('dadAvatar', t, { x: DX, y: ROOF, s: RS, lift: dl, ...arms, ...legs, face: dface, nametag: drot < 20 || drot > 340 }, { arms: false });
  w += drot > 0.5 && drot < 359.5 ? S.g(dad, `rotate(${f(drot)} ${f(DX)} ${f(ROOF - HC - dl)})`) : dad;
  if (kick) w += G.koStars({ x: DX, y: ROOF - 40, t, s: 0.45 });
  if (t > dj + 0.25 && t < dj + 0.7) w += S.ellipse(DX, ROOF - doubleJumpLift(dj + 0.25, dj, dj + 0.25, 700, 760, 3000) - 10, 60 + 200 * seg(t, dj + 0.25, dj + 0.7), 16 + 40 * seg(t, dj + 0.25, dj + 0.7), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 8, opacity: f(1 - seg(t, dj + 0.25, dj + 0.7)) });
  return w;
}
function shEnd(t) {
  const u = t - C.end;
  const cam = camKeys(t, [[C.end, { zoom: 1.06, x: -40, y: 20 }], [C.end + 1.2, { zoom: 1.0, x: 0, y: 0 }]], ease.out);
  const l = GS.cityDay.layers(t, cam, { time: 'sunset' });
  let o = l.bg + l.mid;
  o += view(cam, endFamily(t), 1);
  o += l.light;
  o += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s01Dark)' });
  // subscribe circle (left clear for the end-screen element) + arrow + label
  const sk = ease.outBack(seg(u, 0.25, 0.65));
  if (sk > 0) {
    o += S.circle(SUB.x, SUB.y, SUB.r + 20 + 6 * Math.sin(t * 4), { fill: '#FFFFFF', opacity: 0.12 }) + S.circle(SUB.x, SUB.y, SUB.r * sk, { fill: '#1A1040', opacity: 0.45, stroke: '#FFFFFF', 'stroke-width': 6, 'stroke-dasharray': '22 14', 'stroke-dashoffset': f(t * 30) });
    const ax = SUB.x + SUB.r + 30 + 10 * Math.sin(t * 6);
    o += S.path(`M${f(ax)} ${SUB.y} l46 -30 v20 h74 v20 h-74 v20 Z`, { fill: '#FF5A5A', stroke: '#151515', 'stroke-width': 5, opacity: f(sk) }) + TS('SUBSCRIBE!', SUB.x + SUB.r + 160, SUB.y + 20, 62, '#FF5A5A', { opacity: f(sk), 'text-anchor': 'start' });
    o += TFS('same server. same time.', SUB.x + SUB.r + 168, SUB.y + 74, 34, '#FFFFFF', { opacity: f(sk), 'text-anchor': 'start' });
  }
  SLOT.forEach((sl, i) => { o += slotSvg(sl, t, seg(u, 0.4 + i * 0.15, 0.9 + i * 0.15), i); });
  // the payoff: DOUBLE JUMP! + confetti
  const dj = b.dadDJ;
  if (t > dj + 0.45) o += S.g(S.rect(-300, -56, 600, 112, 34, { fill: '#000', opacity: 0.3, transform: 'translate(10 12)' }) + S.rect(-300, -56, 600, 112, 34, ol('#3BD16F', 8)) + TS('DOUBLE JUMP!', 0, 24, 70, '#FFFFFF'), tf(600, 470, pop(t, dj + 0.45, 0.3), -5));
  o += R.blockConfetti({ x: 900, y: 640, age: t - (dj + 0.85), n: 50, seed: 21, s: 0.8, power: 0.9 });
  o += K.C.whiteFlash(0.5 * (1 - seg(u, 0, 0.25)));
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#000000', opacity: f(ease.in(seg(t, END - 0.45, END))) });
  return o;
}

// ================================================================= dispatch
const SHOTS = [
  [C.open, shOpen], [C.clock, shClock], [C.mom, shMom], [C.momClose, shMomClose], [C.blanket, shBlanket], [C.dad, shDad], [C.you, shYou],
  [C.saturday, shSaturday], [C.meeting, shMeeting], [C.gameNight, shGameNight], [C.rent, shRent], [C.dj, shDJ], [C.djDad, shDJDad],
  [C.klass, shClass], [C.signup, shSignup], [C.thanks, shThanks], [C.castle, shCastle], [C.museum, shMuseum], [C.tickets, shTickets],
  [C.joined, shJoined], [C.momQ, shMomQ], [C.chase, shChase], [C.outro, shOutro], [C.noob, shNoob], [C.comments, shComments], [C.end, shEnd],
];
function shotAt(t) { let i = SHOTS.length - 1; while (i > 0 && t < SHOTS[i][0]) i--; return i; }
function scene(t) { return SHOTS[shotAt(t)][1](t); }
function look(t) {
  if (t < C.saturday) return { grade: null, vignette: 0.9 };
  if (t < C.dj) return { grade: 'warm', vignette: 0.6 };
  if (t >= C.end) return { grade: null, vignette: 0.35 };
  return { grade: null, vignette: 0.5 };
}
function captionY() { return 1010; }
function noCaptions(t) { return t >= C.end; }

module.exports = { scene, look, captionY, noCaptions, CUT: C, BEATS: b, timing, SLOT, SUB };
