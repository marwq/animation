// SC 11 · AFTER — making it right (the mirror of SC 07). NO HUD anywhere: real colours, faces, warm morning light.
// Sunrise over the house -> the hero in a CHEF apron flips a pancake clean across the kitchen onto the FOR MOM stack; Mom
// shuffles in yawning — he glances above her head: nothing there, and he smiles; "Sit down, Mom." / "I can see you're tired."
// / "With my eyes." (smash-zoom, a twinkle) / "...Thank you, sweetheart." (happy tears, a sip of coffee). The science fair:
// the potato bulb insert flickers ON ("It works!"), dims ("Kind of! A little!"), Benji bouncing; "Best partner ever." the hero
// runs round the table and throws an arm round him; the apology in close-ups ("You're not level four. You're my best friend."
// — Benji's eyes well up); "Level four is still pretty good though, right?" -> laughter + a fist bump, the bulb flares.
// The cafeteria: Tank's shadow, shy, "Can I... sit here?" / "Always." / the lunch his dad made — an insert of the ketchup-
// soaked sandwich dripping (SPLAT on "ketchup") -> all three crack up. The kitchen in the afternoon: Mom washes, the hero
// dries (the "Help Mom" quest he skipped in SC 07, no XP now); Grandpa appears in the window: "Told you, kid." -> close:
// "Best things in life don't have numbers." + a wink. The living room: the hero picks up his tablet ("You turned the HUD on
// one last time."), Max on the rug looks up; insert: REALITY HUD app, OFF -> his thumb and Max's dino claw reach for the
// toggle together ("Just to check one thing.") -> ON, cyan glow -> SC 12 (pet stats).
// Every cut and beat comes from the voice through times(V) (shared with audio/cues/gen_sc11.js).
'use strict';

const K = require('./kit');
const ST = require('./sets_town');
const SH = require('./sets_home');
const X = require('../rig/extras');
const CAST = require('../rig/cast');
const AC = require('./acting');
const E = require('./s07_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const V = K.V;
const { camAt, camLerp, shook, scr, whip, flashAt, wash } = E;

// ================================================================ times (from the voice only)
function times(V) {
  const l = (i) => V.L('11.' + i);
  const START = V.scene('SC 11').start, END = V.scene('SC 12').start;
  const C = {}, B = {};
  C.dawn = START;
  C.stove = l(0).word('you').t0 - 0.12;
  B.flip = l(0).word('made').t0 - 0.06;
  B.land = l(0).word('breakfast').t0 + 0.28;
  C.mom = l(0).word('Without').t0 - 0.18;
  B.glance = l(0).word('checking').t0;
  B.yawn = l(0).word('energy').t0 - 0.12;
  C.sit = l(1).a - 0.12;
  C.tired = l(1).word('I').t0 - 0.2;
  C.eyes = l(1).word('With').t0 - 0.22;
  B.eyes = l(1).word('eyes').t0;
  C.thanks = l(2).a - 0.2;
  B.sip = l(2).b + 0.1;
  C.works = l(3).a - 0.3;
  B.works = l(3).word('works').t0;
  C.kindOf = l(3).word('Kind').t0 - 0.24;
  B.kind = l(3).word('Kind').t0;
  B.little = l(3).word('little').t0;
  C.best = l(4).a - 0.2;
  B.ever = l(4).word('ever').t0;
  C.sorry = l(5).a - 0.22;
  C.level = l(5).word("You're").t0 - 0.2;
  C.friend = l(5).word("You're", 1).t0 - 0.2;
  B.friend = l(5).word('friend').t0;
  C.thanksB = l(6).a - 0.14;
  C.right = l(6).word('Level').t0 - 0.25;
  B.right = l(6).word('right').t0;
  B.bump = l(6).b + 0.35;
  C.tank = l(7).a - 0.36;
  C.always = l(8).a - 0.12;
  C.lunch = l(9).a - 0.14;
  B.bag = l(9).word('lunch').t0;
  B.made = l(9).word('made').t0;
  C.ketchup = l(9).word("It's").t0 - 0.25;
  B.ketchup = l(9).word('ketchup').t0;
  C.laugh = l(9).b + 0.02;
  C.window = l(10).a - 0.28;
  B.tap = l(10).a - 0.05;
  C.wink = l(10).word('Best').t0 - 0.2;
  B.wink = l(10).word('numbers').t0;
  C.tablet = l(11).a - 0.12;
  B.pick = l(11).word('turned').t0;
  C.insert = l(11).word('Just').t0 - 0.25;
  B.reach = l(11).word('check').t0;
  B.on = l(11).b + 0.75;
  B.flash = END - 0.16;
  return { START, END, C, B };
}
const TM = times(V);
const { START, END, C, B } = TM;

let VOL_OFF = false;
const actor = (name, t, pose = {}, act) => K.actor(name, t, VOL_OFF && pose.volume === undefined ? { ...pose, volume: false } : pose, act);
const view = K.view;

// ================================================================ 1 — "The next morning," sunrise over the house
function shotDawn(t) {
  const u = seg(t, C.dawn, C.stove);
  const cam = camLerp({ zoom: 0.92, x: 0, y: 20 }, { zoom: 1.16, x: -40, y: -30 }, u, ease.out);
  return SH.houseExterior(t, cam, { time: 'morning', birds: true, smoke: true }) + flashAt(t, START, 0.3, 0.9);
}

// ================================================================ the kitchen, morning (pancakes)
const KS = SH.SPOTS.kitchen;
const STACK = { x: KS.momPlate.x, y: KS.momPlate.y - 80 };                  // top of the FOR MOM stack
const HERO_K = { x: 120, y: 990, s: 0.5 };                                   // the hero in front of the stove
const MOMSEAT = SH.seatPose(KS.seats.mom, 1.04, {});
function kitchenWorld(t, cam, o = {}) {
  const Ly = SH.kitchen.layers(t, { time: o.time || 'morning', pancakes: o.pancakes !== false, dishes: !!o.dishes, toaster: !o.dishes });
  let s = view(cam, Ly.bg, 0.8) + (o.outside ? view(cam, o.outside, 0.8) : '') + view(cam, Ly.mid);
  if (o.seated) s += view(cam, o.seated);
  s += view(cam, Ly.front);
  s += view(cam, o.stand || '');
  return s + view(cam, Ly.light);
}
// a pancake (golden, a little lopsided) at (x, y), rot, squash
function pancake(x, y, s = 1, rot = 0, sq = 0) {
  const g = S.ellipse(0, 0, 70, 16 * (1 - sq * 0.4), ol('#E8A44A', 6)) + S.path('M-56 4 Q0 18 56 4', ln(4, '#C98A3A')) + S.ellipse(-14, -4, 18, 5, { fill: '#C98A3A', 'fill-opacity': 0.6 });
  return S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s * (1 + sq * 0.2))} ${f(s)})`);
}
// the hero holding the pan (left hand), flip at B.flip
function heroPan(t, extra = {}) {
  const fl = bump(t, B.flip - 0.12, B.flip + 0.16);
  const pose = { ...HERO_K, apron: true, turn: 0.15, armL: 40 + 34 * fl, bendL: 70, armR: 14, face: { name: 'determined', mouth: 'tongue' }, ...extra };
  const [hx, hy] = CAST.handPos('you', pose, -1);
  const pan = X.fryingPan({ x: hx, y: hy, s: 0.5, rot: -8 - 26 * fl, egg: false });
  return { body: actor('you', t, { ...pose, props: [] }, { arms: false }), pan, hand: [hx, hy] };
}
function flyingPancake(t, from) {
  const u = seg(t, B.flip, B.land);
  if (t < B.flip) return pancake(from[0] - 140, from[1] - 14, 0.55);
  if (u < 1) {
    const P = (v) => [lerp(from[0] - 140, STACK.x, v), lerp(from[1] - 14, STACK.y, v) - 560 * 4 * v * (1 - v)];
    const [x, y] = P(u);
    let o = '';
    for (let i = 1; i <= 4; i++) { const [px, py] = P(Math.max(0, u - i * 0.05)); o += S.circle(px, py, 10 - i * 1.6, { fill: '#FFFFFF', 'fill-opacity': f(0.6 - i * 0.12) }); }
    return o + pancake(x, y, 0.55, 720 * ease.inOut(u));
  }
  return pancake(STACK.x, STACK.y + 4, 0.55, 0, bump(t, B.land, B.land + 0.2));
}
// 2 — "...you made breakfast." the flip: the pancake sails across the kitchen onto the stack
function shotStove(t) {
  const u = seg(t, C.stove, C.mom);
  const cam = shook(camLerp({ zoom: 1.16, x: -410, y: -40 }, { zoom: 1.1, x: -370, y: -40 }, u), t, [[B.land, 0.2, 5]]);
  const hp = heroPan(t);
  let o = kitchenWorld(t, cam, { stand: hp.body + hp.pan + flyingPancake(t, hp.hand) });
  if (t > B.land && t < B.land + 0.6) { const [x, y] = scr(cam, STACK.x, STACK.y); o += K.sparkles([[x - 60, y - 40, 26], [x + 70, y - 30, 22]], t); }
  return o + whip(t, C.stove, 1, 0.12);
}
// 3 — "Without checking anyone's energy." Mom shuffles in yawning; he glances above her head (nothing!) and smiles
const MOM_IN = { x0: 2160, x1: 1330 };
function momWalk(t) {
  const w = seg(t, C.mom - 0.4, C.mom + 1.5);
  const x = lerp(MOM_IN.x0, MOM_IN.x1, ease.out(w));
  const yawn = bump(t, B.yawn, B.yawn + 0.9);
  if (w < 1) return { x, y: 990, s: 0.5, view: 'side', ...AC.walk((t - C.mom) * 7, 0.7), tired: 1, face: { name: 'sleepy' }, t };
  return { x, y: 990, s: 0.5, tired: 1, turn: -0.3, armL: 10 + 150 * yawn, armR: 10 + 150 * yawn, bendL: 40 * yawn, bendR: 40 * yawn, face: { name: 'sleepy', mouth: yawn > 0.2 ? 'yawn' : 'smallSmile' }, t };
}
function shotMom(t) {
  const u = seg(t, C.mom, C.sit);
  const cam = camLerp({ zoom: 1.0, x: -90, y: 0 }, { zoom: 1.05, x: -70, y: -10 }, u);
  const look = seg(t, B.glance, B.glance + 0.3);
  const smile = seg(t, B.yawn + 0.5, B.yawn + 0.8);
  const hp = heroPan(t, { turn: lerp(0.15, 0.6, seg(t, C.mom + 0.3, C.mom + 0.6)), face: { name: smile > 0 ? 'happy' : 'neutral', mouth: smile > 0 ? 'smile' : 'line', eyes: { look: [1, lerp(0, -0.9, look)] } } });
  const mom = actor('mom', t, momWalk(t), { arms: false });
  let o = kitchenWorld(t, cam, { stand: mom + hp.body + hp.pan });
  return o;
}
// 4 — "Sit down, Mom." he steers her to her chair
function shotSit(t) {
  const u = seg(t, C.sit, C.tired);
  const cam = camLerp({ zoom: 1.32, x: -100, y: -40 }, { zoom: 1.4, x: -120, y: -48 }, u);
  const step = ease.inOut(seg(t, C.sit + 0.1, C.tired));
  const momX = lerp(1180, 980, step), youX = lerp(700, 760, step);
  const wk = step > 0 && step < 1 ? AC.walkFront((t - C.sit) * 8, 0.6) : {};
  const mom = actor('mom', t, { x: momX, y: 990, s: 0.5, tired: 1, turn: -0.35, ...wk, armL: 12, armR: 12, face: { name: 'sleepy', mouth: 'smallSmile', eyes: { look: [-0.8, 0] } }, t }, { arms: false });
  const you = actor('you', t, { x: youX, y: 990, s: 0.5, apron: true, turn: 0.45, armR: 80, bendR: -20, armL: 14, ...wk }, { arms: false, energy: 1.2 });
  return kitchenWorld(t, cam, { stand: mom + you }) + whip(t, C.sit, 1, 0.1);
}
// 5 — "I can see you're tired." Mom seated behind her FOR MOM pancakes, the hero beside her
function shotTired(t) {
  const u = seg(t, C.tired, C.eyes);
  const cam = camLerp(camAt(730, 560, 1.62), camAt(735, 552, 1.75), u);
  const blink = Math.floor((t - C.tired) * 1.3) % 3 === 2 ? { type: 'closed' } : { look: [-0.6, 0] };
  const mom = actor('mom', t, { ...MOMSEAT, tired: 1, flour: 0.6, face: { name: 'happy', mouth: 'smallSmile', eyes: blink } }, { arms: false });
  const you = actor('you', t, { x: 590, y: 990, s: 0.5, apron: true, turn: 0.4, armL: 14, armR: 22 }, { energy: 0.9 });
  return kitchenWorld(t, cam, { seated: mom, stand: you });
}
// 6 — "With my eyes." smash-zoom: he taps beside his eye, a twinkle
function shotEyes(t) {
  const u = seg(t, C.eyes, C.thanks);
  const cam = shook(camLerp(camAt(600, 640, 2.7), camAt(600, 632, 2.95), u, ease.out), t, [[B.eyes, 0.2, 5]]);
  const up = ease.outBack(seg(t, C.eyes + 0.05, B.eyes));
  const you = actor('you', t, { x: 600, y: 990, s: 0.5, apron: true, turn: 0.1, armR: lerp(20, 150, up), bendR: lerp(0, 30, up), armL: 14, face: { name: 'happy', eyes: t > B.eyes && t < B.eyes + 0.5 ? { type: 'star' } : { look: [0.3, -0.1] } } }, { arms: false });
  let o = kitchenWorld(t, cam, { stand: you });
  if (t > B.eyes - 0.05 && t < B.eyes + 0.6) { const [x, y] = scr(cam, 640, 990 - 790 * 0.5); o += K.sparkles([[x - 60, y - 20, 40], [x + 170, y - 60, 30]], t); }
  return o + whip(t, C.eyes, 'up', 0.08);
}
// 7 — "...Thank you, sweetheart." Mom close: happy tears, then a sip of coffee
function shotThanks(t) {
  const u = seg(t, C.thanks, C.works);
  const cam = camLerp(camAt(KS.seats.mom.x + 10, 532, 2.2), camAt(KS.seats.mom.x + 10, 524, 2.45), u);
  const sip = t > B.sip;
  const mom = actor('mom', t, { ...MOMSEAT, tired: 0.6, flour: 0.6, coffee: sip ? 'sip' : true, t, face: sip ? { name: 'happy', eyes: { type: 'happy' }, fx: ['blush'] } : { name: 'happy', fx: ['tears', 'blush'] } }, { arms: false });
  return kitchenWorld(t, cam, { seated: mom });
}

// ================================================================ the science fair (gym, fair: true)
const FS = ST.SPOTS.gym.fair;
const HERO_F = { x: 330, y: 1060, s: 0.5 }, BENJI_F = { x: 900, y: 1060, s: 0.5 };
const BEST_X = 1100;                                                        // where the hero ends up, right beside Benji
const MID = (BENJI_F.x + BEST_X) / 2;
function bulbK(t) {
  if (t < B.works - 0.3) return 0.02;
  if (t < B.works) return Math.floor(t * 30) % 3 === 0 ? 0.5 : 0.05;       // sputters
  let k = lerp(0.95, 0.55, seg(t, B.works, B.kind)) - 0.25 * seg(t, B.kind, B.little);
  k += 0.06 * Math.sin(t * 37) + (Math.floor(t * 9) % 7 === 0 ? -0.15 : 0);
  k += 0.7 * bump(t, B.bump, B.bump + 0.5);
  return clamp(k, 0.05, 1);
}
function fairWorld(t, cam, o = {}) {
  const front = (o.benji === false ? '' : actor('benji', t, { ...BENJI_F, t, ...(o.benji || {}) }, o.benjiAct || {})) + (o.you === false ? '' : actor('you', t, { ...HERO_F, ...(o.you || {}) }, o.youAct || {}));
  const back = FS.smartKids.slice(1).map((p, i) => K.draw.kid(2 + i, { ...p, i: 2 + i, turn: -0.4, face: 'neutral' })).join('');
  return ST.gym.compose(t, { fair: true, bulb: bulbK(t), parents: o.parents ?? 0.3 }, ['', back + front], o.after || '', cam) + (o.over || '');
}
// 8 — "It works!" insert: the bulb sputters and lights
function shotWorks(t) {
  const u = seg(t, C.works, C.kindOf);
  const cam = camLerp(camAt(FS.bulb.x, FS.bulb.y + 10, 3.0), camAt(FS.bulb.x, FS.bulb.y, 3.35), u, ease.out);
  let o = fairWorld(t, cam, { parents: 0, you: false, benji: { face: { name: 'excited' }, armL: 60, armR: 60, bendL: 60, bendR: 60 }, benjiAct: { arms: false } });
  const [bx, by, z] = scr(cam, FS.bulb.x, FS.bulb.y);
  o += E.sparks(bx, by, t - B.works, z * 0.5, '#FFE45A', 7) + E.sparks(bx, by, t - (B.works - 0.22), z * 0.35, '#FFFFFF', 5);
  return o + whip(t, C.works, 1, 0.12);
}
// 9 — "Kind of! A little!" Benji bouncing, the bulb dims with every word
function shotKindOf(t) {
  const u = seg(t, C.kindOf, C.best);
  const cam = camLerp(camAt(630, 700, 1.42), camAt(640, 690, 1.5), u);
  const hop = Math.abs(Math.sin((t - C.kindOf) * 8));
  let o = fairWorld(t, cam, {
    benji: { lift: 26 * hop, armL: 150, armR: 150, bendL: 30, bendR: 30, turn: -0.3, face: { name: 'excited' } }, benjiAct: { arms: false },
    you: { turn: 0.5, face: { name: 'joy', eyes: { look: [1, -0.2] } }, armL: 30, armR: 50 },
  });
  return o;
}
// 10 — "Best partner ever." he runs round the table, arm round Benji; both laugh
function shotBest(t) {
  const u = seg(t, C.best, C.sorry);
  const cam = camLerp(camAt(660, 700, 1.42), camAt(MID, 680, 1.62), u);
  const r = seg(t, C.best + 0.05, B.ever - 0.12);
  const lb = Math.abs(Math.sin(t * 12)) * seg(t, B.ever, B.ever + 0.2);
  let you;
  if (r < 1) you = { x: lerp(HERO_F.x, BEST_X, ease.inOut(r)), flip: true, view: 'side', ...AC.run((t - C.best) * 15, 0.8), face: { name: 'joy' } };
  else you = { x: BEST_X, turn: -0.4, armL: 108, bendL: 34, armR: 30 + 10 * lb, bodyY: -5 * lb, face: { name: 'joy', mouth: 'bigGrin' } };
  let o = fairWorld(t, cam, {
    benji: { turn: 0.3, lift: 10 * lb, bodyY: -6 * lb, armR: 20, armL: 40 + 20 * lb, face: t > B.ever ? { name: 'joy' } : { name: 'happy', eyes: { look: [1, 0] } } }, benjiAct: { arms: false },
    you, youAct: { arms: false },
  });
  if (t > B.ever) { const [x, y] = scr(cam, MID, 520); o += E.laughMarks(x, y, t, seg(t, B.ever, B.ever + 0.2) * (1 - seg(t, C.sorry - 0.4, C.sorry)), 0.9); }
  return o;
}
// 11 — "Benji... I'm sorry." two-shot, the hero turns to him
function shotSorry(t) {
  const u = seg(t, C.sorry, C.level);
  const cam = camLerp(camAt(MID, 640, 1.95), camAt(MID, 630, 2.15), u);
  return fairWorld(t, cam, {
    parents: 0,
    benji: { turn: 0.5, face: { name: 'neutral', eyes: { look: [1, 0] } } },
    you: { x: BEST_X, turn: -0.55, armL: 14, armR: 14, face: { name: 'sad', eyes: { look: [-1, 0.1] } } }, youAct: { energy: 0.6 },
  });
}
// 12 — "You're not level four." the hero close
function shotLevel(t) {
  const u = seg(t, C.level, C.friend);
  const cam = camLerp(camAt(BEST_X - 30, 610, 2.55), camAt(BEST_X - 30, 602, 2.75), u);
  return fairWorld(t, cam, { parents: 0, benji: { turn: 0.5 }, you: { x: BEST_X, turn: -0.55, face: { name: 'happy', eyes: { look: [-1, 0] } } }, youAct: { energy: 0.6 } });
}
// 13 — "You're my best friend." Benji close: eyes well up
function shotFriend(t) {
  const u = seg(t, C.friend, C.thanksB);
  const cam = camLerp(camAt(BENJI_F.x + 20, 600, 2.55), camAt(BENJI_F.x + 20, 592, 2.85), u);
  const moved = t > B.friend;
  return fairWorld(t, cam, {
    parents: 0,
    benji: { turn: 0.5, face: moved ? { name: 'happy', mouth: 'wavy', eyes: { look: [1, 0] }, fx: ['tears', 'blush'] } : { name: 'shocked', mouth: 'o', eyes: { look: [1, 0] } } }, benjiAct: { arms: true },
    you: { x: BEST_X + 90, turn: -0.55 },
  });
}
// 14 — "Thanks." Benji wipes his eye under the glasses
function shotThanksB(t) {
  const u = seg(t, C.thanksB, C.right);
  const cam = camLerp(camAt(BENJI_F.x + 20, 592, 2.85), camAt(BENJI_F.x + 20, 588, 2.95), u);
  const wipe = bump(t, C.thanksB + 0.1, C.right - 0.1);
  return fairWorld(t, cam, {
    parents: 0,
    benji: { turn: 0.45, armR: 14, armL: lerp(14, 34, wipe), bendL: lerp(0, 150, wipe), face: { name: 'joy', fx: ['tears', 'blush'] } }, benjiAct: { arms: false },
    you: { x: BEST_X + 90, turn: -0.55 },
  });
}
// 15 — "...Level four is still pretty good though, right?" both crack up; fist bump, the bulb flares
function shotRight(t) {
  const u = seg(t, C.right, C.tank);
  const cam = camLerp(camAt(MID, 650, 1.8), camAt(MID - 10, 660, 1.62), u);
  const bk = ease.outBack(seg(t, B.bump - 0.3, B.bump));
  const after = t > B.bump;
  const lb = after ? Math.abs(Math.sin(t * 12)) : 0;
  let o = fairWorld(t, cam, {
    parents: 0,
    benji: { turn: 0.4, armR: lerp(30, 86, bk), bendR: lerp(0, -20, bk), armL: 34, lift: 8 * lb, face: t < B.right + 0.3 ? { name: 'happy', mouth: 'grin', eyes: { look: [1, 0] } } : { name: 'joy' } }, benjiAct: { arms: false },
    you: { x: BEST_X, turn: -0.45, armL: lerp(30, 84, bk), bendL: lerp(0, -20, bk), armR: 20, bodyY: -4 * lb, face: t > B.right ? { name: 'joy', mouth: 'bigGrin' } : { name: 'happy' } }, youAct: { arms: false },
  });
  const [bx, by, z] = scr(cam, MID, 690);
  o += E.sparks(bx, by, t - B.bump, z * 0.6, '#FFE45A', 8);
  if (after) { const [x, y] = scr(cam, MID, 500); o += E.laughMarks(x, y, t, seg(t, B.bump, B.bump + 0.2), 0.9, 2); }
  return o;
}

// ================================================================ the cafeteria
const CF = ST.SPOTS.cafeteria;
const BENJI_C = { x: 330, y: CF.heroSeat.y, s: 0.5 }, HERO_C = { x: 540, y: CF.heroSeat.y, s: 0.5 };
const TANK_SEAT = { x: 775, y: 1157, s: 0.5 };
function cafWorld(t, cam, o = {}) {
  const trays = ST.tray(BENJI_C.x + 40, 846, 0.62, ['pizza', 'milk'], t) + ST.tray(HERO_C.x + 40, 846, 0.62, ['broccoli', 'pizza'], t);
  const seated = actor('benji', t, { ...BENJI_C, t, ...(o.benji || {}) }, o.benjiAct || {}) + actor('you', t, { ...HERO_C, ...(o.you || {}) }, o.youAct || {}) + (o.tankSeated || '');
  return ST.cafeteria.compose(t, { heroTray: false, quiet: 0 }, ['', seated, trays + (o.onTable || '')], o.lane || '', cam) + (o.over || '');
}
// 16 — "Can I... sit here?" Tank's shadow, then Tank, shy, lunch bag in both hands
function shotTank(t) {
  const u = seg(t, C.tank, C.always);
  const cam = camLerp(camAt(760, 620, 1.3), camAt(770, 610, 1.38), u);
  const w = seg(t, C.tank - 0.6, C.tank + 0.7);
  const x = lerp(1500, 1060, ease.out(w));
  const tank = w < 1
    ? actor('tank', t, { x, y: 1000, s: 0.5, view: 'side', ...AC.walk((t - C.tank) * 7, 0.7), lunch: true, face: { name: 'neutral' } }, { arms: false })
    : actor('tank', t, { x, y: 1000, s: 0.5, shy: true, turn: -0.35 }, { energy: 0.6 });
  const up = { eyes: { look: [0.8, -0.8] } };
  return cafWorld(t, cam, { lane: tank, benji: { turn: 0.4, face: { name: 'shocked', ...up } }, you: { turn: 0.4, face: { name: 'happy', ...up } } }) + whip(t, C.tank, -1, 0.12);
}
// 17 — "Always." the hero, pats the bench beside him
function shotAlways(t) {
  const u = seg(t, C.always, C.lunch);
  const cam = camLerp(camAt(HERO_C.x + 40, 700, 2.3), camAt(HERO_C.x + 40, 694, 2.45), u);
  const pat = Math.abs(Math.sin((t - C.always) * 10)) * seg(t, C.always + 0.2, C.always + 0.35);
  return cafWorld(t, cam, { you: { turn: 0.35, armR: 46 + 8 * pat, bendR: 10, face: { name: 'happy', eyes: { look: [0.8, -0.7] } } }, youAct: { arms: false }, benji: { turn: 0.4 } });
}
// Tank seated with his own lunch: the bag on the table, the sandwich in his hand (after B.made)
function tankSeated(t, o = {}) {
  const out = t >= B.made;
  const pose = { ...TANK_SEAT, turn: -0.3, shy: !o.laugh, armR: out ? 60 : 14, bendR: out ? 110 : 0, freeArms: true, ...(o.pose || {}) };
  if (o.laugh) Object.assign(pose, { armL: 20, armR: 60, bendR: 110, face: { name: 'joy', mouth: 'bigGrin' } });
  const body = actor('tank', t, pose, { arms: false });
  const [hx, hy] = CAST.handPos('tank', pose, 1);
  const sand = out ? X.sandwich({ x: hx - 6, y: hy - 30, s: 0.55, rot: -10, ketchup: true, bite: 0 }) : '';
  return { body, sand, hand: [hx, hy] };
}
// 18 — "I brought my own lunch today. My dad made it." the three at the table; the bag, the sandwich comes out
function shotLunch(t) {
  const u = seg(t, C.lunch, C.ketchup);
  const cam = camLerp(camAt(560, 720, 1.45), camAt(580, 715, 1.55), u);
  const ts = tankSeated(t);
  const open = seg(t, B.bag - 0.1, B.bag + 0.3);
  const bag = X.lunchBag({ x: 690, y: 870 - 230 * 0.5, s: 0.5, open: open > 0.5 });
  return cafWorld(t, cam, {
    tankSeated: ts.body,
    onTable: bag + ts.sand,
    benji: { turn: 0.45, face: { name: 'happy', eyes: { look: [1, -0.3] } } },
    you: { turn: 0.45, face: { name: 'happy', eyes: { look: [1, -0.3] } } },
  }) + whip(t, C.lunch, 1, 0.1);
}
// 19 — "It's... mostly ketchup." insert on the dripping sandwich; a drop SPLATS on "ketchup"
function shotKetchup(t) {
  const u = seg(t, C.ketchup, C.laugh);
  const ts = tankSeated(t);
  const [hx, hy] = ts.hand;
  const cam = camLerp(camAt(hx - 90, hy - 20, 2.3), camAt(hx - 90, hy - 30, 2.55), u, ease.out);
  let drops = '';
  for (let i = 0; i < 4; i++) { const t0 = B.ketchup - 0.25 - (3 - i) * 0.55; drops += E.ketchupDrop(hx - 40 + 22 * (i % 3), hy + 18, 872, t - t0, 0.7); }
  return cafWorld(t, cam, { tankSeated: ts.body, onTable: X.lunchBag({ x: 690, y: 870 - 115, s: 0.5, open: true }) + ts.sand + drops }) + whip(t, C.ketchup, 'down', 0.08);
}
// 20 — the beat: all three crack up (Tank's first laugh)
function shotLaugh(t) {
  const u = seg(t, C.laugh, C.window);
  const cam = camLerp(camAt(570, 715, 1.5), camAt(570, 705, 1.4), u);
  const lb = Math.abs(Math.sin(t * 12));
  const ts = tankSeated(t, { laugh: true, pose: { bodyY: -5 * lb } });
  let o = cafWorld(t, cam, {
    tankSeated: ts.body, onTable: X.lunchBag({ x: 690, y: 870 - 115, s: 0.5, open: true }) + ts.sand + E.ketchupDrop(ts.hand[0] - 40, ts.hand[1] + 18, 872, 3, 0.7) + E.ketchupDrop(ts.hand[0] - 18, ts.hand[1] + 18, 872, 2.5, 0.7),
    benji: { turn: 0.2, bodyY: -5 * lb, face: { name: 'joy', mouth: 'bigGrin' } }, benjiAct: { arms: true, energy: 1.6 },
    you: { turn: 0.1, bodyY: -5 * lb, face: { name: 'joy', mouth: 'bigGrin', eyes: { type: 'happy' } } }, youAct: { arms: true, energy: 1.6 },
  });
  const [x, y] = scr(cam, 560, 520);
  return o + E.laughMarks(x, y, t, 1, 1, 1);
}

// ================================================================ the kitchen, afternoon: drying dishes with Mom; Grandpa at the window
const GPWIN = KS.outside;                                                   // (380, 560) s .32 at k .8
function grandpaOutside(t, o = {}) {
  const lean = ease.outBack(seg(t, C.window - 0.2, C.window + 0.4));
  const x = lerp(GPWIN.x - 220, GPWIN.x, lean);
  return actor('grandpa', t, { x, y: GPWIN.y, s: GPWIN.s, glasses: 'up', turn: 0.15, armR: o.tap ? 150 : 10, bendR: o.tap ? 60 : 0, shadow: false, ...(o.pose || {}) }, { arms: false, energy: 0.7 });
}
function dryingPlate(x, y, s = 1, rot = 0) {
  return S.g(S.ellipse(0, 0, 70, 70, ol('#FFFFFF', 5)) + S.ellipse(0, 0, 44, 44, { fill: 'none', stroke: '#D8E0EA', 'stroke-width': 4 }) + S.path('M-60 30 Q-20 80 40 60 L70 100 Q0 120 -70 60 Z', ol('#FF8A8A', 4)), `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// 21 — "Told you, kid." Mom washes, the hero dries; Grandpa pops up in the window and taps the glass
function shotWindow(t) {
  const u = seg(t, C.window, C.wink);
  const cam = camLerp({ zoom: 1.5, x: -440, y: -120 }, { zoom: 1.62, x: -470, y: -135 }, u);
  const lookUp = seg(t, B.tap + 0.1, B.tap + 0.4);
  const rub = Math.sin(t * 10);
  const momP = { ...KS.sinkStand, tired: 0, flour: 0.3, view: lookUp > 0.5 ? 'front' : 'back', turn: -0.2, armL: 12 + 5 * Math.sin(t * 8), armR: 12 - 5 * Math.sin(t * 8), face: { name: 'happy', eyes: { look: [-0.4, -1] } } };
  const youP = lookUp < 0.5
    ? { x: 640, y: 800, s: 0.46, view: 'side', armL: 30, bendL: 80, armR: 40 + 6 * rub, face: { name: 'happy' } }
    : { x: 640, y: 800, s: 0.46, turn: -0.55, armL: 20, armR: 20, face: { name: 'happy', eyes: { look: [-1, -1] } } };
  const plate = lookUp < 0.5 ? dryingPlate(...CAST.handPos('you', youP, -1), 0.3, rub * 8) : '';
  return kitchenWorld(t, cam, { time: 'day', pancakes: false, dishes: true, outside: grandpaOutside(t, { tap: t > B.tap - 0.25 && t < B.tap + 0.3 }), stand: actor('mom', t, momP, { arms: false }) + actor('you', t, youP, { arms: false }) + plate }) + whip(t, C.window, -1, 0.12);
}
// 22 — "Best things in life don't have numbers." Grandpa close in the window; a wink on "numbers"
function shotWink(t) {
  const u = seg(t, C.wink, C.tablet);
  const cam = camLerp({ zoom: 2.5, x: -585, y: -280 }, { zoom: 2.75, x: -585, y: -290 }, u);
  const wink = t > B.wink && t < B.wink + 0.55;
  let o = kitchenWorld(t, cam, { time: 'day', pancakes: false, dishes: true, outside: grandpaOutside(t, { pose: { face: wink ? { name: 'happy', eyes: { type: 'happy' }, fx: ['blush'] } : { name: 'happy', eyes: { look: [0.3, 0.2] } } } }) });
  if (wink) { const [x, y] = scr(cam, GPWIN.x + 40, GPWIN.y - 982 * GPWIN.s + 90, 0.8); o += K.sparkles([[x + 90, y - 10, 34]], t); }
  return o;
}

// ================================================================ the living room: the tablet
const LS = SH.SPOTS.livingRoom;
const COUCH = SH.seatPose(LS.seats.couchM, 1, {});
function livingWorld(t, cam, o = {}) {
  const Ly = SH.livingRoom.layers(t, { time: 'day' });
  let s = view(cam, Ly.bg, 0.8) + view(cam, Ly.mid);
  s += view(cam, actor('grandpa', t, SH.seatPose(LS.seats.armchair, 1.1, { glasses: 'on', face: { name: 'sleepy' }, t }), { arms: false }) + (o.seated || ''));
  s += view(cam, Ly.front);
  s += view(cam, K.draw.biscuit({ ...LS.dogBed.dog, pose: 'sleep', t }) + (o.floor || ''));
  return s + view(cam, Ly.light);
}
// 23 — "You turned the HUD on one last time." he picks the tablet up off the cushion; Max looks up from the rug
function shotTablet(t) {
  const u = seg(t, C.tablet, C.insert);
  const cam = camLerp({ zoom: 1.18, x: -60, y: 30 }, camAt(820, 640, 1.65), u, ease.inOut);
  const held = t > B.pick + 0.35;
  const reach = bump(t, B.pick - 0.1, B.pick + 0.4);
  const you = held
    ? actor('you', t, { ...COUCH, tablet: true, tabletFace: 'back', face: { name: 'happy', mouth: 'smallSmile', eyes: { look: [0, 0.6] } } }, { arms: false })
    : actor('you', t, { ...COUCH, turn: 0.3, armR: 14 + 30 * reach, bendR: -20 * reach, face: { name: 'neutral', eyes: { look: [0.8, 0.6] } } }, { arms: false });
  const lying = held ? '' : X.tablet({ x: COUCH.x + 150, y: 742, s: 0.3, rot: 90, face: 'back' });
  const maxLook = seg(t, B.pick + 0.6, B.pick + 1.0);
  const max = actor('max', t, { x: LS.rugSit.x, y: LS.rugSit.y, s: 0.5, turn: lerp(-0.2, 0.5, maxLook), face: { name: maxLook > 0.5 ? 'amazed' : 'happy', eyes: { look: [lerp(-0.6, 0.8, maxLook), lerp(0.6, -0.5, maxLook)] } }, armL: 30, armR: 40 }, { arms: false });
  return livingWorld(t, cam, { seated: you + lying, floor: max }) + whip(t, C.tablet, 1, 0.12);
}
// 24 — "Just to check one thing." insert: REALITY HUD · OFF; his thumb and Max's claw reach for the toggle -> ON
function shotInsert(t) {
  const u = seg(t, C.insert, END);
  const cam = camLerp(camAt(860, 620, 2.2), camAt(860, 615, 2.35), u);
  const maxPeek = ease.out(seg(t, C.insert + 0.3, C.insert + 0.9));
  const max = actor('max', t, { x: 1150 - 40 * maxPeek, y: 1000, s: 0.5, turn: -0.5, face: { name: 'amazed', eyes: { look: [-1, 0.4] } }, armL: 20, armR: 20 }, { arms: false });
  let o = livingWorld(t, cam, { seated: actor('you', t, { ...COUCH, turn: 0.1, face: { name: 'happy', eyes: { look: [0, 0.7] } } }, { arms: false }), floor: max });
  o += wash('#1A1230', 0.25);
  const on = ease.inOut(seg(t, B.on, B.on + 0.25));
  const push = 1 + 0.04 * ease.inOut(u);
  // the tablet, big, screen to us
  o += S.g(X.tablet({ x: 0, y: 0, s: 1.55, face: 'screen', screen: E.hudApp(on, t), glow: 0.4 + 0.6 * on }), `translate(960 ${f(520 + 10 * Math.sin(t * 1.3))}) scale(${f(push)})`);
  if (on > 0) o += wash('#7FF6FF', 0.16 * on * (1 - 0.6 * seg(t, B.on + 0.3, B.on + 0.9)));
  // thumb from the bottom-left, claw from the right — they meet on the toggle (≈ (960, 520 + 0.07 * 1.55 * 420))
  const r = ease.inOut(seg(t, B.reach - 0.5, B.on));
  const press = bump(t, B.on - 0.05, B.on + 0.25);
  o += E.heroThumb(lerp(560, 900, r), lerp(1240, 640, r), 1.05, lerp(28, 32, r), press);
  o += E.dinoClaw(lerp(1500, 1040, r), lerp(1150, 650, r), 0.95, lerp(-40, -35, r));
  if (t > B.on && t < B.on + 0.5) o += E.sparks(980, 610, t - B.on, 1.2, '#7FF6FF', 8);
  return o + E.fadeTo(t, B.flash, END, '#E8FDFF', 0.85);
}

// ================================================================ router
const SHOTS = [
  [C.stove, shotDawn], [C.mom, shotStove], [C.sit, shotMom], [C.tired, shotSit], [C.eyes, shotTired], [C.thanks, shotEyes], [C.works, shotThanks],
  [C.kindOf, shotWorks], [C.best, shotKindOf], [C.sorry, shotBest], [C.level, shotSorry], [C.friend, shotLevel], [C.thanksB, shotFriend],
  [C.right, shotThanksB], [C.tank, shotRight], [C.always, shotTank], [C.lunch, shotAlways], [C.ketchup, shotLunch], [C.laugh, shotKetchup],
  [C.window, shotLaugh], [C.wink, shotWindow], [C.tablet, shotWink], [C.insert, shotTablet], [Infinity, shotInsert],
];
const CLOSE = new Set([shotEyes, shotThanks, shotWorks, shotLevel, shotFriend, shotThanksB, shotAlways, shotKetchup, shotWink, shotInsert, shotSorry]);
const shotAt = (t) => { for (const [end, g] of SHOTS) if (t < end) return g; return shotInsert; };
function scene(t) {
  const fn = shotAt(t);
  VOL_OFF = CLOSE.has(fn);
  return fn(t);
}
function look(t) {
  if (t >= C.insert) return { grade: 'warm', vignette: 0.8 };
  return { grade: 'warm', vignette: 0.6 };
}

// when the ketchup drops of shotKetchup() hit the table (for the cue sheet)
function ketchupSplats() {
  const ts = tankSeated(B.made + 1);
  const fall = Math.sqrt(Math.max(0, 872 - (ts.hand[1] + 18)) / 1400);
  return [0, 1, 2, 3].map((i) => B.ketchup - 0.25 - (3 - i) * 0.55 + fall);
}

module.exports = { scene, look, times, ketchupSplats, TIMES: TM, CUT: C, BEATS: B };
