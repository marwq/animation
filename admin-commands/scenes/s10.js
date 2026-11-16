// SC 10 · ИСПРАВИТЬ ВСЁ — dawn. The hero is back on his roof with the old man's spare charger (it comes out of a little golden
// portal) and a cup of tea. ";size all cats 1" → the giant cats shrink into their owners' arms; ";unfly the bus" → it lands,
// everybody claps; the bath guy drops back into his own bathroom; giant Pancake shrinks into the hero's arms. Almost every
// Granny ("Leave me fast, sweetie!"). Dad lands in his chair, Mom finds the hero's own sticky note: "it's official now".
// The empty schoolyard: ";unjail Brick", the quiet talk, HALF the cookie, "...Deal." Back in the server room: "The panel can
// keep one command for you. Forever." — dreams of fast / big / picked first — a long silent look at the family on the
// monitors — ";unadmin me" — "Admin rights removed. Thanks for playing." — "...the second person to type that." — "Me." (wink)
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const { L } = K.V;
const E = require('./s09_env');
const { R, P, CI, G, tr, outT, outTF, ob, io, eo, at, drift, withShake, white, flashAt, whip, CS, ST, A, CATS } = E;

const START = K.V.scene('SC 10').start, END = K.V.scene('SC 11').start;
const M = Array.from({ length: 22 }, (_, i) => L('10.' + i));

// ---------------------------------------------------------------- beats
const tWith = M[0].word('With').t0, tCharger = M[0].word('charger').t0, tCup = M[0].word('cup').t0;
const c1 = tWith - 0.1;                                  // charger + tea
const c2 = M[1].a - 0.15;                                // ";size all cats 1" (over the shoulder)
const c3 = M[1].b + 0.06;                                // cats shrink into their owners' arms (+ ";unfly the bus")
const c4 = M[2].b + 0.12;                                // the bus lands, everybody claps
const c5 = M[3].word('flying').t0 - 0.05;                // the bath guy drops back into his bathroom
const c6 = M[3].word('every', 1).t0 - 0.1;               // "Every giant thing." — giant Pancake → the hero's arms
const c7 = M[3].word('every', 2).t0 - 0.1;               // "Every Granny. Well. Almost every Granny."
const tWell = M[3].word('Well').t0, tGranny2 = M[3].word('Granny', 1).t0;
const c8 = M[4].a - 0.1;                                 // Granny: "Leave me fast, sweetie!"
const tBefore = M[4].word('before').t0;
const c9 = M[4].b - 0.05;                                // Dad lands in his chair | split: Mom finds the note
const c10 = M[5].word('From').t0 - 0.12;                 // "From YOU? Oh, it's official now."
const tOh = M[5].word('Oh').t0, tOfficial = M[5].word('official').t0;
const c11 = M[6].a - 0.1;                                // the empty schoolyard; Brick in the cage; ";unjail Brick"
const tBrickW = M[8].word('Brick').t1;
const c12 = M[8].word('Hey').t0 - 0.12;                  // quiet two-shot
const c13 = M[9].word('Nobody').t0 - 0.15;               // Brick close: "Nobody else does."
const c14 = M[10].a - 0.08;                              // "Oh." — "You know you could just... sit with us?"
const c15 = M[12].a - 0.1;                               // cookie two-shot: "Can I still have the cookie?" "HALF the cookie." "...Deal."
const tHalf = M[13].a, tDeal = M[14].a;
const c16 = M[15].a - 0.12;                              // server room: "The panel can keep one command for you. Forever."
const tKeep = M[15].word('keep').t0, tForever = M[15].word('Forever').t0, tAny = M[15].word('Any').t0;
const c17 = M[16].a - 0.1;                               // dreams: fast forever / big forever / never picked last
const DREAM_T = [M[16].word('fast').t0, M[16].word('Big').t0, M[16].word('Never').t0];
const c17b = M[17].a - 0.1;                              // "You think about it..."
const c18 = M[17].word('for').t0 - 0.1;                  // ...for a long time — the silent look at the family monitors
const gS = M[17].b, gE = M[18].a;                        // the silent beat
const c19 = gS + 0.36 * (gE - gS);                       // the cursor blinks, ";unadmin me" typed slowly, Enter
const tEnter = gE - 0.14;
const c20 = gE - 0.02;                                   // SYSTEM: "Admin rights... removed. Thanks for playing."
const tRemoved = M[18].word('removed').t0, tThanks = M[18].word('Thanks').t0;
const c21 = M[19].a - 0.1;                               // "Hm. In two thousand years... the second person to type that."
const c22 = M[20].a - 0.1;                               // "Who was the first?" — "Me." (wink) → flash

// ---------------------------------------------------------------- shared bits
const DAWN = (fly = 0, extra = {}) => ({ time: 1, dawn: 1, flying: fly, ...extra });
const DY = CS.ROOF.dyMid;
// giant cats on the mid skyline (CITY mid-layer coords; rooftop() adds dyMid itself). sk = per-cat shrink 0..1
const GIANTS = [
  { kind: 'cat', coat: 'black', x: 720, y: 222, s: 1.0, pose: 'sit', mood: 'lazy' },
  { kind: 'cat', coat: 'white', x: 1100, y: 586, s: 0.62, pose: 'loaf', mood: 'happy' },
  { kind: 'pancake', x: 1328, y: 470, s: 1.15, pose: 'sleep' },
  { kind: 'cat', coat: 'siamese', x: 420, y: 470, s: 0.75, pose: 'sit', mood: 'smug' },
];
function giants(t, sk = () => 0, hide = []) {
  let o = '';
  GIANTS.forEach((g, i) => {
    if (hide.includes(i)) return;
    const k = clamp(sk(i), 0, 1);
    if (k >= 1) return;
    const s = g.s * (1 - eo(k) * 0.97);
    const opt = { x: g.x, y: g.y, s, pose: g.pose, mood: g.mood, t: t + i, keyboard: false, coat: g.coat, seed: i * 3 };
    o += g.kind === 'pancake' ? CATS.pancake(opt) : CATS.cat(opt);
    if (k > 0) o += poof(g.x, g.y - 120 * g.s, k, 160 * g.s);
  });
  return o;
}
// a soft sparkle "poof" (k 0..1)
function poof(x, y, k, r = 120) {
  if (k <= 0 || k >= 1) return '';
  let o = '';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, d = r * (0.3 + 0.9 * eo(k));
    o += CI(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, r * 0.22 * (1 - k), { fill: '#FFFFFF', stroke: E.LINE, 'stroke-width': 4, opacity: f(1 - k) });
  }
  return o + K.sparkles([[x, y, r * 0.35 * (1 - k)], [x + r * 0.5, y - r * 0.4, r * 0.2 * (1 - k)]], k * 10);
}
const roofHero = (t, pose = {}, act = {}, lap = {}) => E.heroLap(t, { x: 960, y: 905, s: 0.5, ...pose }, act, { battery: 100, glow: 0.5, ...lap });

// ---------------------------------------------------------------- shots
// 0. "So you go back." — flash; the hero lands on his roof at dawn; giant cats, a bus still floating
function shotArrive(t) {
  const cam = drift(K.camKeys(t, [[START, at(880, 545, 1.02)], [c1, at(900, 590, 1.18)]]), t, 4);
  const L0 = CS.rooftop(t, cam, DAWN(0.65, { onMid: giants(t), inStadium: CATS.cat({ x: 1690, y: 614, s: 0.9, pose: 'lie', coat: 'calico', t }) }));
  const tp = E.teleIn(t, START + 0.12, 960, 905, 0.5);
  const h = tp.show ? roofHero(t, { lift: tp.lift, sx: tp.sx, sy: tp.sy, face: { name: 'determined', eyes: { look: [0.2, -0.3] } } }, {}, { battery: 1 }) : '';
  return L0.bg + L0.mid + K.view(cam, tp.fx + h, 1) + L0.fg + L0.light + white(1 - seg(t, START, START + 0.45));
}
// 1. "With the old man's spare charger. And a cup of tea." — cable from a golden portal; battery 1% → 100%; a sip
function shotCharger(t) {
  const cam = drift(K.camKeys(t, [[c1, at(1010, 650, 1.85)], [tCup - 0.2, at(1000, 640, 1.95)], [c2, at(990, 630, 2.05)]]), t, 3);
  const L0 = CS.rooftop(t, cam, DAWN(0.6, { onMid: giants(t) }));
  const plug = seg(t, tCharger - 0.15, tCharger + 0.2);
  const batt = Math.round(lerp(1, 100, io(seg(t, tCharger + 0.1, tCharger + 1.3))));
  const sip = io(seg(t, tCup - 0.15, tCup + 0.35));
  const armR = 26, hR = A.hand(armR, 1);
  const lapX = hR[0] - 30, lapY = hR[1] + 40;
  const lap = ST.laptop(lapX, lapY, 0.42, ST.adminScreen(t, { battery: batt, lines: ['Admin panel loaded.', batt >= 100 ? 'Battery: 100% ⚡' : 'Charging...'] }), { glow: 0.6, t, dust: 0.2, rot: -6 });
  const hL = A.hand(lerp(10, 122, sip), -1);
  const props = [{ svg: lap, layer: 'front' }, { svg: E.teacup(hL[0] + 10, hL[1] + 70, 1.2, t, 1), layer: 'front' }];
  const h = K.actor('you', t, { x: 960, y: 905, s: 0.5, turn: 0.15, armL: lerp(10, 122, sip), armR, headRot: -4 * sip, face: sip > 0.6 ? { name: 'joy' } : { name: 'happy', eyes: { look: [0.6, -0.4] } }, props }, { arms: false });
  // cable from the laptop's side up into the portal
  const px = 1240, py = 420;
  const plugX = 960 + (lapX + 140) * 0.5 * 1.0, plugY = 905 + (lapY - 60) * 0.5;
  let w = E.portalRing(px, py, 0.8, t) + (plug > 0 ? E.cable(lerp(px, plugX, eo(plug)), lerp(py + 10, plugY, eo(plug)), px, py + 10, 90) : '');
  let o = L0.bg + L0.mid + K.view(cam, w + h, 1) + L0.fg + L0.light;
  if (batt >= 100) o += K.bang('100%!', 1500, 260, seg(t, tCharger + 1.3, tCharger + 1.45) * (1 - seg(t, tCup - 0.3, tCup)), 90, 8, '#3DFF9A');
  if (sip > 0.6) o += K.bang('sip', 700, 300, seg(t, tCup + 0.3, tCup + 0.4), 64, -10, '#FFFFFF');
  return o;
}
// 2. ";size all cats 1" — over the shoulder: the dawn skyline full of giant cats
function shotSizeCats(t) {
  const cam = drift(K.camKeys(t, [[c2, at(1010, 520, 1.18)], [c3, at(1030, 500, 1.26)]]), t, 3);
  const L0 = CS.rooftop(t, cam, DAWN(0.55, { onMid: giants(t), inStadium: CATS.cat({ x: 1690, y: 614, s: 0.9, pose: 'lie', coat: 'calico', t }) }));
  const back = K.actor('you', t, { x: 470, y: 1290, s: 0.95, view: 'back', armL: 22, armR: 22, headRot: Math.sin(t * 2) * 2, volume: false });
  let o = L0.bg + L0.mid + L0.fg + K.view(cam, back, 1) + L0.light;
  const enter = seg(t, M[1].b - 0.02, M[1].b + 0.35);
  o += K.chatCommand(1180, 140, ';size all cats 1', K.typeProgress(t, M[1]), { t, enter, s: 1.25 });
  if (t > M[1].b - 0.05) {
    GIANTS.forEach((g, i) => { const p = CS.toScreen(cam, { x: g.x, y: g.y + DY - 120 * g.s, k: CS.KF.mid }); o += K.commandBurst(p.x, p.y, t - M[1].b - i * 0.06, '#3DFF9A', 200); });
  }
  return o;
}
// 3. the giant cats on the shop roofs shrink, one by one, into their owners' arms (+ ";unfly the bus" typed meanwhile)
const STREET_K = 0.72;
const ROOF_CATS = [
  { x: -620, coat: 'black', seed: 7, t0: 0.0 },
  { x: 380, coat: 'grey', seed: 2, t0: 0.12, owner: { who: 'kid', i: 4, x: 560 } },
  { x: 1560, coat: 'calico', seed: 5, t0: 0.48, owner: { who: 'adult', i: 27, x: 1380 } },
  { x: 2520, coat: 'tabby', seed: 9, t0: 0.78 },
];
function shotOwners(t) {
  const dx = Math.sin(t * 0.6) * 12 - 40 * seg(t, c3, c4);
  let w = E.catStreet(t);
  let fx = '';
  ROOF_CATS.forEach((rc, i) => {
    const t0 = c3 + rc.t0, u = seg(t, t0, t0 + 0.55);
    const ow = rc.owner;
    if (!ow) {
      // no owner in frame: the giant just shrinks away with a poof
      if (u < 1) w += CATS.cat({ x: rc.x, y: 120, s: 2.2 * (1 - eo(u) * 0.95), pose: 'sit', mood: u > 0 ? 'surprised' : 'lazy', t: t + i, coat: rc.coat, seed: rc.seed });
      fx += poof(rc.x, 120 - 200, seg(u, 0, 0.7), 300);
      return;
    }
    const caught = u >= 1, hug = seg(t, t0 + 0.55, t0 + 0.8);
    const arm = caught ? lerp(55, 22, hug) : 55;
    const bodyH = ow.who === 'kid' ? 0.88 : 1.06;
    const hy = 990 - (515 - 252 * Math.cos((arm * Math.PI) / 180)) * 0.5 * bodyH;
    const face = caught ? { name: 'joy' } : { name: 'amazed', fx: [], eyes: { look: [ow.x < rc.x ? 0.4 : -0.4, -1] } };
    const catProp = caught ? [{ svg: CATS.cat({ x: 0, y: -330 + 40 * hug, s: 0.62, pose: 'sit', mood: 'happy', t, coat: rc.coat, seed: rc.seed }), layer: 'front' }] : [];
    w += K.draw[ow.who](ow.i, { x: ow.x, y: 990, s: 0.5, armL: arm, armR: arm, face, bodyY: caught ? 8 * bump(hug, 0, 0.5) : 0, props: catProp });
    if (u <= 0) w += CATS.cat({ x: rc.x, y: 120, s: 2.2, pose: 'sit', mood: 'lazy', t: t + i, coat: rc.coat, seed: rc.seed });
    else if (!caught) {
      const cs = lerp(2.2, 0.33, eo(u)), cy = lerp(120, hy + 10, io(u)), cx = lerp(rc.x, ow.x, io(u));
      fx += CATS.cat({ x: cx, y: cy, s: cs, pose: 'paw', mood: 'surprised', t, coat: rc.coat, seed: rc.seed }) + poof(rc.x, 120 - 200, seg(u, 0, 0.6), 300);
    }
    if (caught && hug < 1) fx += P(K.F.heartPath(ow.x + 90, hy - 150 - 60 * hug, 26), { fill: '#FF5A8A', stroke: E.LINE, 'stroke-width': 4, opacity: f(1 - hug * 0.6) });
  });
  let o = G(w + fx, `translate(${f(960 + dx)} 1000) scale(${STREET_K}) translate(-960 -1000)`);
  // the next command is already being typed
  const kc = seg(t, M[2].a - 0.25, M[2].a);
  if (kc > 0) o += K.chatCommand(460, 110, ';unfly the bus', K.typeProgress(t, M[2]), { t, enter: seg(t, M[2].b, c4), s: 1.05 });
  return o + whip(t, c3, 1);
}
// 4. "You bring back every flying thing." — the bus floats down onto the street; everybody claps
function shotBus(t) {
  const cam = drift(K.camKeys(t, [[c4, at(1000, 760, 1.42)], [c5, at(1010, 800, 1.5)]]), t, 3);
  const fly = lerp(0.35, 0, seg(t, c4, c5));
  const L0 = CS.city(t, cam, DAWN(fly, { flyNear: false }));
  const land = seg(t, c4, c4 + 0.7);
  const by = lerp(560, 1044, io(land));
  const sq = bump(t, c4 + 0.68, c4 + 0.95);
  const bus = CS.bus(1040, by + 4 * sq, 0.55 * (1 + 0.05 * sq), (1 - land) * -6, { t, wave: land >= 1 ? 1 : 0.3, label: '42' });
  let o = L0.bg + L0.mid + L0.fg + K.view(cam, bus, 1) + L0.light;
  if (land >= 1) {
    const k = seg(t, c4 + 0.75, c4 + 0.85);
    o += K.bang('CLAP!', 760, 360, k, 80, -10, '#FFFFFF') + K.bang('CLAP!', 1280, 300, seg(t, c4 + 0.95, c4 + 1.05), 70, 8, '#FFE14D');
    o += K.view(cam, K.C.dust(860, 1044, c4 + 0.68, t) + K.C.dust(1180, 1044, c4 + 0.7, t), 1);
  }
  return o;
}
// 5. the bath guy drops back into his own bathroom
function shotTub(t) {
  const u = seg(t, c5, c5 + 0.42);
  const y = lerp(-260, 930, u * u);
  const sq = bump(t, c5 + 0.4, c5 + 0.7);
  let o = E.bathroom(t, 1);
  o += CS.bathtubGuy(960, y + 10 * sq, 0.62 * (1 + 0.04 * sq), 0, { t, face: u >= 1 ? 'happy' : 'shock' });
  if (u >= 1) {
    const k = seg(t, c5 + 0.42, c5 + 0.9);
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI * (0.1 + 0.8 * (i / 9)); const r = 120 + 260 * eo(k); d += `M${f(960 + Math.cos(a) * r * 1.4 - 18)} ${f(700 + Math.sin(a) * r)} a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 Z`; }
    o += P(d, { fill: '#FFFFFF', stroke: E.LINE, 'stroke-width': 4, opacity: f(1 - k) });
    o += K.bang('PLOP!', 1400, 240, seg(t, c5 + 0.42, c5 + 0.5), 100, 8, '#7FD3FF');
  }
  return K.shaken(t, c5 + 0.42, o, 0.3, 10);
}
// 6. "Every giant thing." — giant Pancake shrinks right into the hero's arms
function shotPancake(t) {
  const cam = drift(K.camKeys(t, [[c6, at(1080, 600, 1.28)], [c7, at(1040, 640, 1.42)]]), t, 3);
  const t0 = c6 + 0.12, u = seg(t, t0, t0 + 0.75);
  const L0 = CS.rooftop(t, cam, DAWN(0, { onMid: giants(t, (i) => (i === 2 ? 0 : seg(t, c6 + 0.05 + i * 0.12, c6 + 0.6 + i * 0.12)), u > 0 ? [2] : []) }));
  const got = u >= 1;
  const hug = seg(t, t0 + 0.75, t0 + 1.0);
  const arm = got ? lerp(50, 24, hug) : lerp(18, 50, seg(t, c6, t0 + 0.3));
  const pc = got ? [{ svg: CATS.pancake({ x: 0, y: -300 + 30 * hug, s: 0.7, pose: 'sit', mood: hug > 0.5 ? 'happy' : 'surprised', t }), layer: 'front' }] : [];
  const h = K.actor('you', t, { x: 960, y: 905, s: 0.5, turn: 0.25, armL: arm, armR: arm, face: got ? { name: 'joy' } : { name: 'amazed', fx: [], eyes: { look: [0.8, -0.8] } }, props: pc }, { arms: false });
  let o = L0.bg + L0.mid + K.view(cam, h + ST.laptop(800, 905, 0.36, '', { lid: 0, t, dust: 0.2 }), 1) + L0.fg + L0.light;
  if (u > 0 && !got) {
    const p0 = CS.toScreen(cam, { x: 1328, y: 470 + DY, k: CS.KF.mid }), p1 = CS.toScreen(cam, { x: 960, y: 905 - 150, k: 1 });
    const cs = lerp(1.15 * p0.z, 0.35 * p1.z, eo(u)), x = lerp(p0.x, p1.x, io(u)), y = lerp(p0.y, p1.y, io(u)) - Math.sin(u * Math.PI) * 180;
    o += CATS.pancake({ x, y, s: cs, pose: u < 0.3 ? 'sleep' : 'pounce', mood: 'surprised', t }) + poof(p0.x, p0.y - 100, seg(u, 0, 0.5), 220);
  }
  return o;
}
// 7. "Every Granny. Well. Almost every Granny." — ";unspeed Granny"... a fire trail... she screeches to a stop
const GRANNY_X = 1300;
function grannyArrive(t) { return io(seg(t, tGranny2 - 0.55, tGranny2 + 0.05)); }
function shotGrannyStop(t) {
  const arr = grannyArrive(t);
  const cam = withShake(drift(K.camKeys(t, [[c7, at(980, 640, 1.5)], [tGranny2 - 0.4, at(1000, 640, 1.42)], [c8, at(1090, 640, 1.32)]]), t, 3), t, [[tGranny2, 0.35, 12]]);
  const L0 = CS.rooftop(t, cam, DAWN(0, { onMid: giants(t, () => 1) }));
  const hes = t > tWell - 0.1;
  const h = roofHero(t, { x: 900, turn: arr > 0.5 ? 0.45 : 0.1, face: arr > 0.3 ? { name: 'shocked', eyes: { look: [1, 0] } } : hes ? { name: 'nervous', fx: [] } : 'determined' }, {}, {});
  let w = h;
  // fire streak across the sky on "Well."
  const st = seg(t, tWell + 0.05, tWell + 0.65);
  if (st > 0 && st < 1) w += CAST_fire(lerp(2300, -500, st), 330, 900, 0, t);
  if (arr > 0) {
    const gx = lerp(2600, GRANNY_X, arr);
    w += CAST_fire(gx + 60, 860, 900 * (1 - arr) + 120 * (1 - seg(t, tGranny2, tGranny2 + 0.6)), 0, t, 1 - seg(t, tGranny2 + 0.2, tGranny2 + 0.8));
    w += K.actor('granny', t, { x: gx, y: 905, s: 0.5, fast: true, view: arr < 1 ? 'side' : 'front', lean: arr < 1 ? -10 : 0, turn: -0.4, ...(arr < 1 ? A.run(t * 40, 0.6) : {}), face: 'excited' }, { arms: arr >= 1 });
    if (arr >= 1) w += K.C.dust(GRANNY_X - 120, 905, tGranny2 + 0.02, t) + K.C.dust(GRANNY_X + 20, 905, tGranny2 + 0.05, t);
  }
  let o = L0.bg + L0.mid + K.view(cam, w, 1) + L0.fg + L0.light;
  const kc = seg(t, M[3].words[9][1] - 0.25, M[3].words[9][1]);
  if (kc > 0) o += K.chatCommand(680, 150, ';unspeed Granny', K.typeProgress(t, M[3], 9, 10), { t, s: 1.1 });
  if (arr >= 1) o += K.bang('SCREECH!', 1460, 260, seg(t, tGranny2, tGranny2 + 0.1) * (1 - seg(t, c8 - 0.2, c8)), 90, 6, '#FF8A3D');
  return o;
}
const CAST_fire = (x, y, len, angle, t, alpha = 1) => E.CAST.fireTrail({ x, y, len, angle, w: 90, t, alpha });
// 8. Granny: "Leave me fast, sweetie! I've never been early before!" — the command backspaces; she zooms away
function shotGrannyTalk(t) {
  const go = io(seg(t, tBefore - 0.05, tBefore + 0.45));
  const cam = drift(K.camKeys(t, [[c8, at(1100, 640, 1.62)], [tBefore - 0.1, at(1095, 645, 1.72)], [c9, at(1060, 640, 1.6)]]), t, 3);
  const L0 = CS.rooftop(t, cam, DAWN(0, { onMid: giants(t, () => 1) }));
  const jit = Math.sin(t * 40) * 3;
  let w = roofHero(t, { x: 900, turn: 0.45, headRot: -10 * bump(go, 0.2, 0.9), face: go > 0.2 ? { name: 'joy' } : { name: 'happy', eyes: { look: [1, -0.2] } } }, {}, {});
  if (go < 1) {
    const gx = lerp(GRANNY_X, -900, go);
    w += K.actor('granny', t, { x: gx + jit, y: 905, s: 0.5, fast: true, turn: go > 0 ? 0 : -0.4, view: go > 0.05 ? 'side' : 'front', ...(go > 0.05 ? A.run(t * 40, 0.6) : {}), lift: 6 * Math.abs(Math.sin(t * 20)), face: 'excited' }, { energy: 1.6 });
    if (go > 0.02) w += CAST_fire(gx + 80, 860, 1400 * go, 0, t);
  }
  let o = L0.bg + L0.mid + K.view(cam, w, 1) + L0.fg + L0.light;
  const prog = 1 - seg(t, M[4].word('never').t0, tBefore);
  if (prog > 0) o += K.chatCommand(700, 150, ';unspeed Granny', prog, { t, s: 1.05 });
  if (go > 0.1) o += K.bang('WHOOSH!', 520, 300, seg(t, tBefore + 0.05, tBefore + 0.15), 90, -8, '#FF8A3D');
  return o;
}
// 9. Dad drops into his chair, still on the call | split: Mom finds a sticky note
function dadFrame(t) {
  const ch = ST.SPOTS.livingRoom.dadChair;
  const cam = at(560, 600, 1.55);
  const Ld = ST.livingRoom.layers(t, { time: 'day', call: true, curtains: 0.6 });
  const drop = seg(t, c9, c9 + 0.3), sq = bump(t, c9 + 0.28, c9 + 0.55);
  const talk = Math.floor(t * 7) % 3 === 0 ? 'O' : 'smile';
  const dad = K.actor('dad', t, { x: ch.x, y: ch.feet, s: ch.s, view: 'side', legL: 82, kneeL: 86, legR: 72, kneeR: 82, lift: (1 - ease.in(drop)) * 700, sy: 1 - 0.1 * sq, sx: 1 + 0.06 * sq, armL: 40, face: { name: drop < 1 ? 'shocked' : 'happy', mouth: drop < 1 ? 'O' : talk } }, { arms: false });
  let o = K.view(cam, Ld.bg, 0.7) + K.view(cam, Ld.mid + dad + Ld.front, 1) + K.view(cam, Ld.fg || '', 1.2) + K.view(cam, Ld.light || '', 1);
  if (sq > 0) o += K.bang('PLOP', 1240, 260, seg(t, c9 + 0.3, c9 + 0.4), 80, -8, '#FFFFFF');
  return o;
}
function momPose(t, extra = {}) {
  const arm = 72;
  const h = A.hand(arm, 1);
  return { x: 1250, y: 990, s: 0.5, turn: 0.35, armR: arm, armL: 14, face: { name: 'confused', fx: [], eyes: { look: [1, -0.2] } }, props: [{ svg: E.heroNote(h[0] + 20, h[1] - 90, 0.9, -6), layer: 'front' }], ...extra };
}
function momFrame(t, cam) {
  const Lk = ST.kitchen.layers(t, { time: 'day' });
  return K.view(cam, Lk.bg, 0.7) + K.view(cam, Lk.mid, 1) + K.view(cam, Lk.front, 1) + K.view(cam, K.actor('mom', t, momPose(t), { arms: false }), 1) + K.view(cam, Lk.fg || '', 1.2) + K.view(cam, Lk.light || '', 1);
}
function shotSplit(t) {
  const k = io(seg(t, M[5].a - 0.12, M[5].a + 0.25));
  let o = '';
  if (k <= 0) return dadFrame(t);
  const idL = S.uid('s10sl'), idR = S.uid('s10sr');
  const xm = lerp(1920, 960, k);
  o += S.clipDef(idL, R(0, 0, xm, 1080)) + S.clipDef(idR, R(xm, 0, 1920 - xm, 1080));
  o += G(G(dadFrame(t), `translate(${f(-480 * k)} 0)`), null, { 'clip-path': `url(#${idL})` });
  const camM = at(1360, 650, 1.35);
  o += G(G(momFrame(t, camM), `translate(${f(xm - 480)} 0)`), null, { 'clip-path': `url(#${idR})` });
  o += R(xm - 9, -20, 18, 1120, 0, { fill: '#FFFFFF', stroke: E.LINE, 'stroke-width': 5 });
  return o;
}
// 10. "From YOU? Oh, it's official now." — the note close; she sticks it on the fridge
function shotMom(t) {
  const back = io(seg(t, tOh - 0.2, tOh + 0.4));
  const cam = drift(K.camKeys(t, [[c10, at(1420, 640, 2.35)], [tOh - 0.2, at(1425, 630, 2.5)], [tOh + 0.4, at(1380, 640, 1.6)], [c11, at(1370, 640, 1.66)]]), t, 3);
  const Lk = ST.kitchen.layers(t, { time: 'day' });
  const stick = io(seg(t, tOfficial - 0.35, tOfficial));
  const arm = lerp(72, 92, stick) * (1 - back * 0.0);
  const h = A.hand(arm, 1);
  // the note leaves her hand and stays on the fridge door
  const noteW = { x: 1250 + (h[0] + 20) * 0.53, y: 990 + (h[1] - 90) * 0.53 };
  const fridgeSpot = { x: 1478, y: 560 };
  const onFridge = t > tOfficial;
  const face = back > 0.5 ? { name: 'happy', fx: onFridge ? ['blush', 'hearts'] : ['blush'], eyes: { look: [0.6, -0.3] } } : { name: 'amazed', fx: [], eyes: { look: [1, -0.3] } };
  const props = onFridge ? [] : [{ svg: E.heroNote(lerp(h[0] + 20, (fridgeSpot.x - 1250) / 0.53, stick), lerp(h[1] - 90, (fridgeSpot.y - 990) / 0.53, stick), 0.9, -6 + 10 * stick), layer: 'front' }];
  const mom = K.actor('mom', t, { x: 1250, y: 990, s: 0.5, turn: 0.35, armR: arm, armL: back > 0.5 ? -24 : 14, face, props }, { arms: false });
  let w = Lk.mid + Lk.front + (onFridge ? E.heroNote(fridgeSpot.x, fridgeSpot.y, 0.48, 4) : '') + mom;
  let o = K.view(cam, Lk.bg, 0.7) + K.view(cam, w, 1) + K.view(cam, Lk.fg || '', 1.2) + K.view(cam, Lk.light || '', 1);
  if (onFridge) o += K.bang('OFFICIAL!', 1500, 230, seg(t, tOfficial, tOfficial + 0.12), 96, 8, '#FFD21F');
  return K.shaken(t, tOfficial, o, 0.25, 8);
}
// 11. "And then... Brick." — the empty schoolyard at dawn; the hero walks in; ";unjail Brick" — the cage dissolves
const CG = ST.SPOTS.schoolyard.cage;
const BRX = CG.x, HXY = 760;
function brickSad(extra = {}) { return { name: 'sad', eyes: { look: [-0.6, 0.6] }, fx: ['blush', 'sweat'], mouth: 'wavy', ...extra }; }
function shotYard(t) {
  const cam = drift(K.camKeys(t, [[c11, at(960, 560, 1.0)], [M[7].a, at(940, 580, 1.08)], [M[8].a - 0.1, at(930, 590, 1.28)], [c12, at(940, 590, 1.3)]]), t, 3);
  const Ly = ST.schoolyard.layers(t, { time: 'dawn' });
  const walk = seg(t, c11, M[7].a - 0.2);
  const hx = lerp(-150, HXY, io(walk));
  const van = seg(t, tBrickW + 0.05, tBrickW + 0.75);
  const up = io(seg(t, tBrickW + 0.4, tBrickW + 1.0));
  let hero;
  if (walk < 1) hero = K.actor('you', t, { x: hx, y: 960, s: 0.5, view: 'side', flip: true, ...A.walk((t - c11) * 9), face: 'sad' });
  else hero = E.heroLap(t, { x: HXY, y: 960, s: 0.5, turn: 0.4, face: t > M[8].a - 0.1 ? { name: 'happy', eyes: { look: [1, 0] } } : { name: 'sad', eyes: { look: [1, 0] } } }, { energy: 0.5 }, { battery: 100, glow: 0.5 });
  const brick = K.actor('brick', t, { x: BRX, y: CG.y + 10, s: 0.5, bodyY: lerp(150, 0, up), armL: lerp(30, 10, up), armR: lerp(30, 10, up), headRot: lerp(8, 0, up), face: brickSad({ eyes: { look: [-0.7, up > 0.5 ? 0 : 0.5] } }) }, { arms: false, energy: 0.4 });
  let w = Ly.mid + ST.cage(CG.x, CG.y, CG.s, t, { part: 'back', vanish: van }) + brick + ST.cage(CG.x, CG.y, CG.s, t, { part: 'front', vanish: van }) + Ly.front + hero;
  let o = K.view(cam, Ly.bg, 0.6) + K.view(cam, w, 1) + K.view(cam, Ly.light || '', 1);
  const kc = seg(t, M[8].a - 0.25, M[8].a);
  if (kc > 0) o += K.view(cam, K.chatCommand(700, 300, ';unjail Brick', K.typeProgress(t, M[8], 0, 1), { t, enter: seg(t, tBrickW, tBrickW + 0.4), s: 0.9 }), 1);
  if (van > 0) o += K.view(cam, K.commandBurst(BRX, 600, t - tBrickW, '#3DFF9A', 260), 1);
  return o;
}
// 12. the quiet two-shot: "Hey. Why do you always take my lunch?" — "...Because then you have to talk to me."
function yard(t, cam, chars) {
  const Ly = ST.schoolyard.layers(t, { time: 'dawn' });
  return K.view(cam, Ly.bg, 0.6) + K.view(cam, Ly.mid + Ly.front + ST.laptop(560, 962, 0.32, '', { lid: 0, t, dust: 0.2 }) + chars, 1) + K.view(cam, Ly.light || '', 1);
}
function shotTwo(t) {
  const cam = K.camKeys(t, [[c12, at(965, 560, 1.15)], [c13, at(975, 548, 1.34)]], ease.linear);
  const listening = t < M[9].a - 0.1;
  const h = K.actor('you', t, { x: HXY, y: 960, s: 0.5, turn: 0.45, armL: 10, armR: 10, face: listening ? { name: 'happy', eyes: { look: [1, 0] } } : { name: 'sad', fx: [], eyes: { look: [1, 0] } } }, { energy: 0.45 });
  const b = K.actor('brick', t, { x: BRX, y: 960, s: 0.5, turn: -0.35, armL: 6, armR: -14, headRot: 6, face: brickSad({ eyes: { look: listening ? [-0.8, 0.6] : [-0.3, 0.8] } }) }, { arms: false, energy: 0.35 });
  return yard(t, cam, h + b);
}
// 13. "Nobody else does." — Brick, close
function shotBrickClose(t) {
  const cam = K.camKeys(t, [[c13, at(BRX - 10, 470, 2.2)], [c14, at(BRX - 10, 465, 2.4)]], ease.linear);
  const b = K.actor('brick', t, { x: BRX, y: 960, s: 0.5, turn: -0.3, armL: 6, armR: -14, headRot: 8, face: brickSad({ eyes: { look: [-0.2, 0.9] }, fx: ['blush', 'tears'] }), volume: false }, { arms: false, energy: 0.3 });
  return yard(t, cam, b);
}
// 14. "Oh." — "You know you could just... sit with us?"
function shotHeroClose(t) {
  const cam = K.camKeys(t, [[c14, at(HXY + 10, 595, 2.25)], [c15, at(HXY + 15, 590, 2.45)]], ease.linear);
  const soft = io(seg(t, M[10].a, M[11].a));
  const face = t < M[11].a - 0.05 ? { name: 'amazed', fx: [], eyes: { look: [1, 0.2] } } : { name: 'happy', eyes: { look: [1, 0], lower: 0.22, pupil: 1.1 }, fx: ['blush'] };
  const h = K.actor('you', t, { x: HXY, y: 960, s: 0.5, turn: 0.4, headRot: -4 * soft, face, volume: false }, { energy: 0.5 });
  return yard(t, cam, h);
}
// 15. "...Can I still have the cookie?" — "HALF the cookie." — "...Deal."
function shotCookie(t) {
  const cam = K.camKeys(t, [[c15, at(965, 560, 1.3)], [tHalf - 0.1, at(965, 560, 1.36)], [c16, at(975, 548, 1.5)]]);
  const out = io(seg(t, M[12].b - 0.1, tHalf - 0.05));
  const snap = t >= M[13].word('HALF').t0 + 0.15;
  const give = io(seg(t, tHalf + 0.5, M[13].b + 0.1));
  const take = t >= tDeal - 0.15;
  const armR = lerp(10, lerp(48, 72, give), out);
  const hr = A.hand(armR, 1);
  let hp = [];
  if (out > 0.05) {
    if (!snap) hp.push({ svg: E.cookie(hr[0] + 10, hr[1] + 20, 1.6, 0, 0), layer: 'front' });
    else if (!take) hp.push({ svg: E.cookie(hr[0] + 2, hr[1] + 20, 1.6, -1, -10) + E.cookie(hr[0] + 46, hr[1] + 14, 1.6, 1, 14), layer: 'front' });
    else hp.push({ svg: E.cookie(hr[0] + 2, hr[1] + 20, 1.6, -1, -10), layer: 'front' });
  }
  const h = K.actor('you', t, { x: HXY, y: 960, s: 0.5, turn: 0.45, armR: take ? lerp(72, 30, seg(t, tDeal, tDeal + 0.4)) : armR, armL: 12, props: hp, face: t > tHalf - 0.1 ? { name: 'joy' } : { name: 'happy', eyes: { look: [1, 0] } } }, { arms: false, energy: 0.6 });
  const fid = Math.sin(t * 7) * 6;
  const reach = take ? io(seg(t, tDeal - 0.15, tDeal + 0.2)) : 0;
  const bp = take ? [{ svg: E.cookie(A.hand(lerp(10, 40, reach), -1)[0] - 20, A.hand(lerp(10, 40, reach), -1)[1] + 20, 1.25, 1, -20), layer: 'front' }] : [];
  const smile = take;
  const b = K.actor('brick', t, { x: BRX, y: 960, s: 0.5, turn: -0.35, armL: take ? lerp(10, 40, reach) : 8 + fid, armR: take ? 10 : 8 - fid, headRot: smile ? -4 : 4, props: bp, face: smile ? { name: 'happy', fx: ['blush'], eyes: { look: [-0.8, 0] } } : { name: 'sad', mouth: 'smallSmile', fx: ['blush'], eyes: { look: [-0.8, -0.4], upper: 0.05 } } }, { arms: false, energy: 0.4 });
  let o = yard(t, cam, h + b);
  if (snap && t < M[13].b + 0.4) o += K.bang('SNAP!', 760, 260, seg(t, M[13].word('HALF').t0 + 0.15, M[13].word('HALF').t0 + 0.25), 80, -8, '#E8B060');
  if (smile) o += K.view(cam, K.rays(1300, 230, 12, 800, '#FFF2C0', 0.1 * seg(t, tDeal, tDeal + 0.3), t * 8), 1) + K.sparkles([[1200, 300, 26 * seg(t, tDeal, tDeal + 0.2)], [1500, 380, 18]], t);
  return o;
}
// 16. server room: "One last thing. The panel can keep one command for you. Forever. Any command you want."
const HX = 1220, HS = 0.52;
function keepSlot(t, k) {
  if (k <= 0) return '';
  let o = R(-320, -150, 640, 64, 20, ol('#2A2246', 6)) + T('KEEP 1 COMMAND', -40, -103, 40, '#FFE14D');
  o += G(P('M-32 0 C-32 -22 -4 -22 0 0 C4 22 32 22 32 0 C32 -22 4 -22 0 0 C-4 22 -32 22 -32 0 Z', { fill: 'none', stroke: '#FFE14D', 'stroke-width': 9 }), `translate(220 -118) scale(${f(seg(t, tForever, tForever + 0.2))})`);
  o += K.chatCommand(0, 0, ';', 1, { t, theme: 'admin', user: 'you', s: 1.1, w: 560 });
  return G(o, `scale(${f(ob(k))})`);
}
function shotKeep(t) {
  const cam = drift(K.camKeys(t, [[c16, at(860, 560, 1.22)], [tAny - 0.2, at(900, 560, 1.28)], [tAny + 0.3, at(HX - 60, 610, 1.85)], [c17, at(HX - 60, 610, 1.92)]]), t, 3);
  const fin = io(seg(t, c16, c16 + 0.4)) * (1 - io(seg(t, M[15].word('The').t0, M[15].word('The').t0 + 0.4)));
  const o2 = E.oldSeated(t, { armR: lerp(24, 128, fin), armL: 24, face: { name: 'happy', eyes: { look: [0.7, -0.2] } } }, { arms: fin > 0.05 ? false : undefined, energy: 0.6 });
  const chips = t > tAny - 0.3;
  const h = E.heroLap(t, { x: HX, y: 960, s: HS, turn: -0.3, armL: chips ? 30 : 12, armR: chips ? 30 : 12, face: chips ? { name: 'amazed', fx: [], eyes: { look: [0, 0.8] } } : { name: 'happy', eyes: { look: [-0.8, -0.2] } } }, {}, { open: chips, s: chips ? 0.62 : 0.5, screen: chips ? ST.adminScreen(t, { commands: true, battery: 100 }) : null, battery: 100, glow: 0.6 });
  let o = E.room(t, cam, {}, o2, h);
  o += K.view(cam, G(keepSlot(t, seg(t, tKeep - 0.1, tKeep + 0.25) * (1 - seg(t, tAny, tAny + 0.3))), tr(HX - 160, 372)), 1);
  if (t > tForever) o += K.view(cam, K.sparkles([[HX + 140, 180, 24], [HX - 380, 200, 18], [HX + 200, 330, 14]], t), 1);
  return o;
}
// 17. "You could be fast forever. Big forever. Never picked last again." — dream bubbles over his head
function dreamFast(t, w, h) {
  let o = R(0, 0, w, h, 0, { fill: '#FFB347' }) + R(0, h * 0.7, w, h * 0.3, 0, { fill: '#D9604F' }) + P(`M0 ${h * 0.8} H${w} M0 ${h * 0.9} H${w}`, ln(5, '#FFFFFF', 0.7));
  o += K.C.speedLines(-200, w * 0.4, h * 0.45, 6, 7, '#FFFFFF', 160);
  o += K.actor('you', t, { x: w * 0.6, y: h * 0.86, s: 0.3, view: 'side', flip: true, ...A.run(t * 24), face: 'excited', volume: false, shadow: false });
  o += T('∞', w * 0.86, h * 0.3, 90, '#FFFFFF', E.OUT(8));
  return o;
}
function dreamBig(t, w, h) {
  let o = R(0, 0, w, h, 0, { fill: '#8ED4FF' }) + R(0, h * 0.82, w, h * 0.18, 0, { fill: '#7ED957' });
  for (const [hx, hw] of [[0.1, 40], [0.22, 34], [0.78, 38], [0.9, 44]]) o += G(R(-hw / 2, -hw * 0.7, hw, hw * 0.7, 3, ol('#F2C26B', 3)) + P(`M${-hw / 2 - 4} ${-hw * 0.7} L0 ${-hw * 1.2} L${hw / 2 + 4} ${-hw * 0.7} Z`, ol('#D9604F', 3)), tr(w * hx, h * 0.86));
  o += K.actor('you', t, { x: w * 0.5, y: h * 1.5, s: 0.42, armL: 120, armR: 120, face: 'excited', volume: false, shadow: false });
  return o;
}
function dreamPicked(t, w, h) {
  let o = R(0, 0, w, h, 0, { fill: '#7FB2F0' }) + R(0, h * 0.75, w, h * 0.25, 0, { fill: '#E8B060' });
  o += G(R(-120, -26, 240, 52, 14, ol('#FFD24F', 5)) + T('#1 PICK!', 0, 16, 38, '#5A3A00'), tr(w * 0.5, h * 0.17));
  o += K.draw.kid(4, { x: w * 0.2, y: h * 0.98, s: 0.26, armL: 150, armR: 150, face: 'joy', shadow: false }) + K.draw.kid(6, { x: w * 0.8, y: h * 0.98, s: 0.26, armL: 150, armR: 150, face: 'joy', shadow: false });
  o += K.actor('you', t, { x: w * 0.5, y: h * 1.0 - 20 * Math.abs(Math.sin(t * 6)), s: 0.3, armL: 160, armR: 160, face: 'excited', volume: false, shadow: false });
  return o;
}
function shotDreams(t) {
  const cam = drift(K.camKeys(t, [[c17, at(HX - 10, 520, 1.6)], [c17b, at(HX - 10, 530, 1.68)]]), t, 2);
  const h = E.heroLap(t, { x: HX, y: 960, s: HS, turn: -0.1, face: { name: 'happy', eyes: { look: [0, -0.9] } } }, {}, { battery: 100, glow: 0.6 });
  let o = E.room(t, cam, {}, '', h);
  const head = CS.toScreen(cam, { x: HX, y: 960 - 800 * HS, k: 1 });
  const ks = DREAM_T.map((w) => seg(t, w - 0.15, w + 0.2));
  o += E.dreamBubble(40, 300, 520, 320, ks[0], dreamFast(t, 520, 320), head.x - 160, head.y + 40);
  o += E.dreamBubble(690, 24, 540, 300, ks[1], dreamBig(t, 540, 300), head.x, head.y - 120);
  o += E.dreamBubble(1360, 300, 520, 320, ks[2], dreamPicked(t, 520, 320), head.x + 160, head.y + 40);
  return o;
}
// 17b. "You think about it..." — the bubbles fade; push in; the cursor glows on his face
function shotThink(t) {
  const cam = K.camKeys(t, [[c17b, at(HX - 10, 560, 1.95)], [c18, at(HX - 10, 575, 2.35)]], ease.linear);
  const h = E.heroLap(t, { x: HX, y: 960, s: HS, turn: -0.05, headRot: 4, face: { name: 'neutral', eyes: { look: [0, 0.9] } }, volume: false }, {}, { battery: 100, glow: 0.9 });
  let o = E.room(t, cam, { lamp: 0.8 }, '', h);
  const fade = 1 - seg(t, c17b, c17b + 0.5);
  if (fade > 0) o += G(E.dreamBubble(690, 24, 540, 300, 1, dreamBig(t, 540, 300), 960, 300), null, { opacity: f(fade) });
  return o;
}
// 18. the silent beat — Mom, Dad, Granny, Zoe, Brick on the wall monitors
function shotFamily(t) {
  const u = io(seg(t, c18, c19));
  const pan = lerp(-520, 2330, u);
  const look = Math.min(4, Math.round(u * 4));
  return E.familyWall(t, pan, look) + R(0, 0, 1920, 1080, 0, { fill: '#FFB347', opacity: 0.06 });
}
// 19. ";unadmin me" — slowly. Enter.
function shotUnadmin(t) {
  const typed = ';unadmin me';
  const prog = seg(t, c19 + 0.3, tEnter - 0.06);
  const n = Math.round(prog * typed.length);
  const enter = seg(t, tEnter, tEnter + 0.35);
  let o = E.room(t, at(1100, 600, 1.9), {}, '', '') + R(0, 0, 1920, 1080, 0, { fill: '#0A0608', opacity: 0.55 });
  o += ST.laptop(960, 1040, 1.66, ST.adminScreen(t, { battery: 100, lines: ['Admin panel loaded.', 'Battery: 100%', { text: 'Keep 1 command forever?', col: '#FFD24F' }], typed: typed.slice(0, n), cursor: enter <= 0 }), { t, glow: 0.6, dust: 0.15 });
  o += K.chatCommand(960, 140, typed, prog, { t, enter, s: 1.35, w: 640 });
  if (enter > 0) o += R(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(0.35 * (1 - enter)) });
  return o;
}
// 20. "Admin rights... removed. Thanks for playing." — the gold drains out of the laptop back to the crown
function sysMsg(lines, k) {
  if (k <= 0) return '';
  let o = R(-300, -46 - (lines.length - 1) * 30, 600, 92 + (lines.length - 1) * 60, 22, ol('#0E241A', 7));
  lines.forEach((s, i) => { o += TF(s, 0, 14 + (i - (lines.length - 1) / 2) * 60, 40, i ? '#FFE14D' : '#3DFF9A'); });
  return G(o, `scale(${f(ob(k))})`);
}
function shotRemoved(t) {
  const cam = drift(K.camKeys(t, [[c20, at(1480, 560, 1.25)], [c21, at(1500, 545, 1.32)]]), t, 3);
  const drain = seg(t, c20 + 0.1, tThanks + 0.4);
  const glow = 0.6 * (1 - drain);
  const h = E.heroLap(t, { x: HX, y: 960, s: HS, turn: 0.2, face: t > tThanks ? { name: 'happy', eyes: { look: [0.8, -0.6] } } : { name: 'neutral', eyes: { look: [0.6, -0.4] } } }, {}, { battery: 100, glow });
  // golden particles: laptop → crown
  let pt = '';
  const lx = HX, ly = 960 - 300 * HS, cx = CS.SERVER.crown.x, cy = CS.SERVER.crown.y;
  if (drain > 0 && drain < 1) for (let i = 0; i < 26; i++) {
    const u = ((t - c20) * 0.9 + hash(i * 3.7)) % 1;
    if (u > drain * 1.4) continue;
    const x = lerp(lx, cx, u) + Math.sin(u * 9 + i) * 26, y = lerp(ly, cy, u) - Math.sin(u * Math.PI) * 240, r = 6 + 8 * hash(i);
    pt += `M${f(x - r)} ${f(y)} l${f(r)} ${f(-r)} l${f(r)} ${f(r)} l${f(-r)} ${f(r)} Z`;
  }
  const front = pt ? P(pt, { fill: '#FFD24F', stroke: E.LINE, 'stroke-width': 3 }) : '';
  let o = E.room(t, cam, {}, '', h, front);
  const crownK = seg(t, tThanks - 0.2, tThanks + 0.6);
  if (crownK > 0) o += K.view(cam, K.rays(cx, cy, 12, 220, '#FFE58A', 0.25 * Math.sin(crownK * Math.PI), t * 30) + K.sparkles([[cx + 50, cy - 40, 22], [cx - 46, cy + 20, 16]], t), 1);
  const lines = t > tThanks - 0.05 ? ['Admin rights removed.', 'Thanks for playing! :)'] : ['Admin rights removed.'];
  o += K.view(cam, G(sysMsg(lines, seg(t, tRemoved - 0.15, tRemoved + 0.15)), tr(1250, 290)), 1);
  return o;
}
// 21. "Hm. In two thousand years... you're only the second person to type that."
function shotProud(t) {
  const cam = drift(K.camKeys(t, [[c21, at(484, 600, 2.3)], [c22, at(484, 606, 2.6)]]), t, 2);
  const nod = bump(t, M[19].a - 0.05, M[19].a + 0.4);
  const o2 = E.oldSeated(t, { headRot: 8 * nod, face: { name: 'happy', fx: ['sparkles'], eyes: { look: [0.6, -0.2] } } }, { energy: 0.6 });
  return E.room(t, cam, {}, o2, '');
}
// 22. "Who was the first?" — "Me." (wink) → flash into the morning
function shotMe(t) {
  const tMe = M[21].a;
  const cam = drift(K.camKeys(t, [[c22, at(850, 570, 1.28)], [tMe - 0.1, at(820, 580, 1.36)], [tMe + 0.25, at(520, 600, 2.1)], [END, at(505, 600, 2.3)]], ease.inOut), t, 2);
  const wink = t > tMe - 0.02;
  const o2 = E.oldSeated(t, { face: wink ? { name: 'happy', eyeR: { type: 'happy' }, fx: [] } : { name: 'happy', eyes: { look: [0.7, -0.2] } }, headRot: wink ? -6 : 0 }, { energy: 0.6 });
  const h = E.heroLap(t, { x: HX, y: 960, s: HS, turn: -0.35, headRot: t < tMe ? 8 : 0, face: t < tMe ? { name: 'confused', eyes: { look: [-0.8, -0.2] } } : { name: 'amazed', fx: [], eyes: { look: [-0.8, -0.2] } } }, {}, { battery: 100, glow: 0 });
  let o = E.room(t, cam, {}, o2, h);
  if (wink) o += G(K.F.sparkle(0, 0, 40 * ob(seg(t, tMe, tMe + 0.15))), tr(690, 350, 1, t * 90));
  o += white(seg(t, END - 0.45, END - 0.02));
  return o;
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [c1, shotArrive], [c2, shotCharger], [c3, shotSizeCats], [c4, shotOwners], [c5, shotBus], [c6, shotTub], [c7, shotPancake], [c8, shotGrannyStop],
  [c9, shotGrannyTalk], [c10, shotSplit], [c11, shotMom], [c12, shotYard], [c13, shotTwo], [c14, shotBrickClose], [c15, shotHeroClose], [c16, shotCookie],
  [c17, shotKeep], [c17b, shotDreams], [c18, shotThink], [c19, shotFamily], [c20, shotUnadmin], [c21, shotRemoved], [c22, shotProud], [Infinity, shotMe],
];
function scene(t) {
  for (const [end, fn] of SHOTS) if (t < end) return fn(t);
  return shotMe(t);
}
function look(t) {
  if (t < c9) return { grade: 'warm', vignette: 0.6 };
  if (t < c11) return { grade: 'warm', vignette: 0.5 };
  if (t < c16) return { grade: 'warm', vignette: 0.75 };
  return { grade: 'warm', vignette: 0.95 };
}

module.exports = { scene, look, beats: { c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c17b, c18, c19, c20, c21, c22, START, END } };
