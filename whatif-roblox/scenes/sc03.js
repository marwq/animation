// SC 03, 1:01 - 2:03.6 — "NEW WORLD": the alarm clock is loading, block hands, the mirror,
// the hair comes off, the nametag, Mom gets filtered, the pancake gets equipped.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const C = require('./common');
const U = require('./ui');
const { drawHero, YOU_DESIGN } = require('../rig/hero');
const { draw: cast } = require('../rig/cast');
const P = require('../rig/props');
const { chatBubble } = require('../rig/creatures');
const { f, ease, inv, lerp, clamp } = S;
const { W, H, bump, blinkAt, hash } = C;

const LINES = [
  [61.50, 62.30, 'NARRATOR', '*Morning!*'],
  [62.55, 64.10, 'NARRATOR', "Your alarm clock doesn't ring."],
  [64.50, 65.60, 'NARRATOR', "It's... *loading.*"],
  [65.80, 67.40, 'SYSTEM', 'Loading... twelve percent.'],
  [69.50, 71.00, 'NARRATOR', 'Then you look at your hands.'],
  [71.40, 73.30, 'NARRATOR', 'Blocks. Shiny plastic *blocks.*'],
  [73.60, 74.40, 'YOU', '*My hands!*'],
  [74.50, 76.10, 'YOU', 'Where are my *FINGERS?!*'],
  [76.40, 77.60, 'NARRATOR', 'You run to the mirror.'],
  [78.00, 79.30, 'NARRATOR', 'Your head is a *cube.*'],
  [79.40, 82.20, 'NARRATOR', 'And your hair is one solid piece... of *orange plastic.*'],
  [82.50, 83.50, 'NARRATOR', 'You grab it.'],
  [83.80, 85.60, 'NARRATOR', 'And it just... comes off.'],
  [86.00, 87.00, 'YOU', "I'm *BALD!*"],
  [87.40, 88.40, 'YOU', 'Okay, okay...'],
  [88.50, 89.60, 'YOU', 'it clicks back on.'],
  [89.70, 91.00, 'YOU', 'Hair is an accessory now.'],
  [91.10, 92.50, 'YOU', "That's fine. That's *FINE.*"],
  [92.70, 95.60, 'NARRATOR', 'And floating above your head, in big white letters... *"YOU."*'],
  [95.90, 96.40, 'YOU', 'Ugh.'],
  [96.60, 97.40, 'YOU', 'Two A.M. me...'],
  [97.50, 98.50, 'YOU', 'you absolute *noob.*'],
  [98.80, 100.90, 'NARRATOR', 'Downstairs, Mom calls you for breakfast.'],
  [101.10, 103.30, 'NARRATOR', 'But now her words pop up in a *chat bubble.*'],
  [103.50, 105.30, 'MOM', 'Breakfast is ready, *#####!*'],
  [105.70, 107.80, 'YOU', 'Mom... did you just get *filtered?*'],
  [108.10, 109.60, 'MOM', 'I said *#####!*'],
  [110.00, 112.00, 'NARRATOR', 'Roblox thinks "honey" is a bad word.'],
  [112.20, 114.90, 'NARRATOR', "Mom's been filtered *eleven times* since sunrise."],
  [115.30, 116.60, 'NARRATOR', 'Breakfast is a pancake.'],
  [116.80, 117.80, 'NARRATOR', "You don't eat it."],
  [118.00, 119.30, 'NARRATOR', 'You *EQUIP* it.'],
  [119.80, 120.60, 'YOU', 'Mmm...'],
  [121.30, 123.30, 'YOU', 'tastes like a plastic *frisbee.*'],
];
const TRACK = C.makeTrack(LINES);
const vis = (sp, t) => C.visemeAt(TRACK, sp, t);
const END = 123.6;

// ---------------------------------------------------------------- helpers
const BED = { x: 960, y: 1196, s: 0.9 };
// hand position (body space) for an outward arm angle, side +1 = screen-right arm
const hand = (a, side = 1) => [side * (100 + 250 * Math.sin((a * Math.PI) / 180)), -515 + 250 * Math.cos((a * Math.PI) / 180)];
// hair piece offset from where it sits on the head (dx, dy), rotated about its own centre
const hairAt = (dx, dy, rot = 0) => S.g(YOU_DESIGN.hairPiece(0), `translate(${f(dx)} ${f(dy)}) rotate(${f(rot)} 0 -780)`);
const HELD_A = 125;
const held = () => { const [hx, hy] = hand(HELD_A); return [hx + 64, hy - 80 + 780]; };
const tag = { name: 'YOU', health: 1 };

function dayBed(t, cam, o = {}) {
  const L = E.bedroomLayers(cam, t, { loading: o.loading, loadText: o.loadText });
  const hero = o.noHero ? '' : drawHero({ ...BED, bodyY: o.bodyY || 0, headY: o.headY || 0, headRot: o.headRot || 0, face: o.face, armL: o.armL ?? 9, armR: o.armR ?? 9, nametag: o.nametag === false ? null : tag });
  return L.back + S.g(hero, E.camTf(cam, 1)) + L.front + (o.extraWorld ? S.g(o.extraWorld, E.camTf(cam, 1)) : '');
}

function whip(t, a, b, inner) {
  const k = bump(t, a, b);
  return k > 0.02 ? S.g(inner, `translate(${f((t < (a + b) / 2 ? -1 : 1) * k * 160)} 0)`, { filter: 'url(#whip)' }) : inner;
}

// ---------------------------------------------------------------- bedroom part (61.0 - 78.0)
function shotCard(t) { // 61.0 - 62.5
  const cam = { zoom: 1.12 - 0.04 * inv(61, 62.5, t), fx: 960, fy: 560 };
  let o = dayBed(t, cam, { face: { name: 'neutral', eyes: { type: 'closed' }, mouth: 'smallSmile' }, loading: 0.05 });
  o += U.chapterCard('NEW WORLD', inv(61.1, 61.4, t) * (1 - inv(62.3, 62.5, t)), t, 'DAY 1');
  o += S.rect(0, 0, W, H, 0, { fill: '#000', opacity: f(1 - inv(61.0, 61.25, t)) });
  return o;
}

function shotClock(t) { // 62.5 - 67.8
  const u = t - 62.5;
  const cam = { zoom: 2.7 + 0.35 * ease.inOut(inv(2.0, 2.4, u)), fx: 1565, fy: 610 };
  const loading = t < 65.8 ? 0.02 + 0.08 * inv(0, 3.3, u) : 0.12;
  let o = dayBed(t, cam, { face: { name: 'neutral', eyes: { type: 'closed' } }, loading, loadText: t < 65.8 ? 'LOADING' + '.'.repeat(1 + (Math.floor(t * 3) % 3)) : '12%', nametag: false });
  // spinner
  let sp = '';
  for (let i = 0; i < 8; i++) sp += S.circle(Math.cos(i * Math.PI / 4) * 16, Math.sin(i * Math.PI / 4) * 16, 4, { fill: '#5CFF7A', opacity: f(((i + Math.floor(t * 12)) % 8) / 8) });
  o += S.g(S.g(sp, `translate(1565 560)`), E.camTf(cam, 1));
  return o;
}

function shotDeadpan(t) { // 67.8 - 69.4
  const cam = { zoom: 1.25, fx: 1100, fy: 600 };
  let o = dayBed(t, cam, { face: { name: 'deadpan', eyes: { look: [0.3, -0.9], cross: 0 }, blink: blinkAt(t, 68.6) }, loading: t < 68.9 ? 0.12 : 0.13, loadText: t < 68.9 ? '12%' : '13%' });
  o += C.sfx('*chirp*', 520, 300, inv(68.2, 68.35, t), 54, -6, '#FFFFFF');
  return o;
}

function povArms(t, k, flipK, shine) {
  let o = '';
  for (const side of [-1, 1]) {
    const x = 960 + side * 330, y = lerp(1500, 1180, ease.outBack(k));
    const sx = side * (1 - 2 * flipK) * 2.3;
    o += S.g(YOU_DESIGN.arm({ shade: true, view: 'front' }), `translate(${f(x)} ${f(y)}) rotate(${f(180 + side * 8 + Math.sin(t * 3 + side) * 3)}) scale(${f(sx)} 2.3)`);
    if (shine > 0) o += F.sparkle(x - side * 30, y - 560, 40 * shine) + F.sparkle(x + side * 40, y - 470, 26 * shine);
  }
  return o;
}

function shotPOV(t) { // 69.4 - 73.5
  const cam = { zoom: 2.0, fx: 300, fy: 380 };
  let bg = S.g(dayBed(t, cam, { noHero: true }), null, { filter: 'url(#blurBg)' });
  const k = inv(69.55, 70.0, t);
  const flips = [71.45, 72.0, 72.55];
  let flipK = 0;
  for (const fT of flips) flipK = Math.max(flipK, bump(t, fT, fT + 0.3) > 0 ? ease.inOut(inv(fT, fT + 0.3, t)) : 0);
  flipK = flips.filter((x) => t > x + 0.3).length % 2 ? 1 - flipK : flipK;
  const shine = bump(t, 72.3, 73.2);
  return bg + povArms(t, k, flipK, shine) + R0(0, 900, W, 200, '#4C7DFF', 0.0);
}
const R0 = (x, y, w, h, fill, op) => (op ? S.rect(x, y, w, h, 0, { fill, opacity: op }) : '');

function shotMyHands(t) { // 73.5 - 76.3
  const v = vis('YOU', t);
  const punch = ease.out(inv(74.5, 74.62, t));
  const cam = { zoom: 1.55 + 0.25 * punch, fx: 960, fy: 520 };
  const sh = Math.sin(t * 22);
  const face = { name: 'shocked', mouth: v || 'O', eyes: { pupil: 0.45, cross: 0.2, look: [sh * 0.6, 0.3] }, fx: ['sweat2'] };
  return dayBed(t, cam, { face, bodyY: -80, headY: -10, armL: 70 + 25 * sh, armR: 70 - 25 * sh, headRot: 4 * sh });
}

function shotRunToMirror(t) { // 76.3 - 78.0
  const u = t - 76.3;
  const cam = { zoom: 1.05, fx: 960, fy: 560 };
  const L = E.bedroomLayers(cam, t, { loading: 0.13, loadText: '13%' });
  const ph = u * 28;
  const x = lerp(700, 2400, ease.in(inv(0.1, 1.2, u)));
  const hero = drawHero({ view: 'side', flip: true, x, y: 1060, s: 0.62, lean: -10, legL: 44 * Math.sin(ph), kneeL: 26 + 34 * Math.max(0, -Math.sin(ph)), legR: -44 * Math.sin(ph), kneeR: 26 + 34 * Math.max(0, Math.sin(ph)), armL: -50 * Math.sin(ph), armR: 50 * Math.sin(ph), lift: 14 * Math.abs(Math.sin(ph)), face: { name: 'scared', mouth: 'scream', eyes: { pupil: 0.45 } }, nametag: tag });
  let o = L.back + L.front + S.g(hero + C.speedLines(x - 700, x - 150, 760, 7, 31) + C.dust(x - 120, 1060, 76.45, t), E.camTf(cam, 1));
  return whip(t, 77.8, 78.2, o);
}

// ---------------------------------------------------------------- bathroom part (78.0 - 98.6)
const MIR = { x: 1060, y: 1080, s: 0.75 };
function mirrorShot(t, cam, pose, extraInMirror = '') {
  const L = E.bathroomLayers(cam, t);
  const id = 'mirClip';
  const hero = drawHero({ ...MIR, flip: true, nametag: tag, ...pose });
  let o = L.back + S.clipDef(id, L.clip);
  o += S.g(L.glass + S.g(hero + extraInMirror, E.camTf(cam, 1)), null, { 'clip-path': `url(#${id})` });
  o += L.frame + L.front;
  return o;
}

function shotMirror(t) { // 78.0 - 86.0
  const v = (t) => null;
  const cam = { zoom: 1.4 + 0.1 * ease.inOut(inv(78, 86, t)), fx: 960, fy: 430 };
  const pose = { face: { name: 'neutral' } };
  let extra = '';
  if (t < 79.4) { // inspecting the cube head
    const k = (t - 78.0) / 1.4;
    pose.turn = 0.5 * Math.sin(k * Math.PI * 2);
    pose.face = { name: 'confused', fx: [] };
    if (t > 78.9) {
      const b = ease.outBack(inv(78.9, 79.1, t));
      extra += S.g(S.rect(-160, -905, 320, 360, 12, { fill: 'none', stroke: '#34C3FF', 'stroke-width': 9, 'stroke-dasharray': '26 16' }) + F.markText('CUBE', 0, -930, 70, -4, '#34C3FF'), `translate(${MIR.x} ${MIR.y}) scale(${f(-MIR.s * b)} ${f(MIR.s * b)})`);
    }
  } else if (t < 82.4) { // knock knock on the plastic hair
    const kn = Math.abs(Math.sin((t - 79.4) * 9));
    pose.armR = 150 + 10 * kn; pose.armL = 9;
    pose.face = { name: 'deadpan', eyes: { look: [0.6, -0.8], cross: 0.4 } };
    pose.headRot = -3 * kn;
    const knock = Math.floor((t - 79.4) * 9 / Math.PI);
    if (t > 79.6) extra += S.g(F.markText('tok', 0, 0, 56, -10, '#FFFFFF'), `translate(${MIR.x - 230} ${MIR.y - 860 * MIR.s}) scale(${f(0.7 + 0.3 * (knock % 2))})`);
    if (t > 81.1) { // plastic shine sweep
      const sx = lerp(-260, 260, inv(81.1, 81.8, t));
      extra += S.g(S.rect(sx - 20, -1010, 40, 380, 10, { fill: '#FFFFFF', opacity: 0.7, transform: `rotate(18 ${f(sx)} -820)` }), `translate(${MIR.x} ${MIR.y}) scale(${f(-MIR.s)} ${MIR.s})`);
      extra += F.sparkle(MIR.x - 110, MIR.y - 900 * MIR.s, 30 * bump(t, 81.5, 82.2));
    }
  } else if (t < 83.8) { // grab
    const k = ease.outBack(inv(82.45, 82.7, t));
    pose.armR = lerp(9, 162, k); pose.armL = lerp(9, 162, k);
    pose.face = { name: 'determined' };
  } else if (t < 85.0) { // pull ... strain
    const k = inv(83.8, 85.0, t);
    pose.armR = 162; pose.armL = 162;
    pose.face = { name: 'angry', fx: ['sweat'], hairLift: 36 * k + 6 * Math.sin(t * 60) * k, hairRot: 3 * Math.sin(t * 40) * k };
    pose.bodyY = 20 * k;
  } else { // POP! the hair comes off and ends up held beside the head
    const k = ease.out(inv(85.0, 85.3, t));
    const [hx, hy] = held();
    pose.armR = lerp(162, HELD_A, k); pose.armL = lerp(162, 30, k);
    pose.face = { name: 'shocked', hair: false, eyes: { pupil: 0.45, look: [-0.6, -0.2], cross: 0 } };
    const cx = lerp(0, hx, k), cy = lerp(-36, hy, k) - Math.sin(k * Math.PI) * 160;
    pose.props = [{ svg: hairAt(cx, cy, 20 * k), layer: 'top' }];
    if (t < 85.6) extra += S.g(F.markText('POP!', 0, 0, 90, 8, '#FFE14D'), `translate(${MIR.x - 260} ${MIR.y - 820 * MIR.s}) scale(${f(ease.outBack(inv(85.0, 85.15, t)))})`);
  }
  return mirrorShot(t, cam, pose, extra);
}

function shotBald(t) { // 86.0 - 92.6
  const v = vis('YOU', t);
  const punch = ease.out(inv(86.0, 86.12, t)) * (1 - inv(87.2, 87.6, t));
  const cam = { zoom: 1.55 + 0.15 * punch, fx: 960, fy: 430 };
  const [hx, hy] = held();
  const pose = {};
  let extra = '';
  if (t < 88.55) {
    pose.armR = HELD_A; pose.armL = 30 + 20 * Math.sin(t * 14);
    pose.props = [{ svg: hairAt(hx, hy, 20 + 5 * Math.sin(t * 8)), layer: 'top' }];
    pose.face = t < 87.3
      ? { name: 'scared', hair: false, mouth: v || 'scream', eyes: { pupil: 0.4 }, fx: ['sweat2'] }
      : { name: 'nervous', hair: false, mouth: v || 'teeth', eyes: { look: [-0.7, -0.2], cross: 0 }, fx: ['sweat'] };
    pose.headRot = t < 87.3 ? 4 * Math.sin(t * 30) : 0;
  } else if (t < 89.0) { // clicks back on
    const k = ease.inOut(inv(88.55, 88.95, t));
    pose.armR = lerp(HELD_A, 150, k); pose.armL = 30;
    pose.face = { name: 'nervous', hair: false, mouth: v || 'teeth', fx: ['sweat'] };
    pose.props = [{ svg: hairAt(lerp(hx, 0, k), lerp(hy, 0, k) - Math.sin(k * Math.PI) * 120, lerp(20, 0, k)), layer: 'top' }];
  } else {
    const fine = t > 91.1;
    pose.armR = lerp(150, 9, ease.out(inv(89.0, 89.3, t))); pose.armL = 9;
    pose.face = fine
      ? { name: 'nervous', mouth: v || 'teeth', eyes: { pupil: 0.6, cross: 0 }, eyeR: { upper: Math.sin(t * 45) > 0.5 ? 0.35 : 0 }, fx: ['sweat2'] }
      : { name: 'nervous', mouth: v || 'smile', eyes: { look: [0, 0] }, fx: ['sweat'] };
    pose.headRot = fine ? 3 * Math.sin(t * 20) : 0;
    if (t < 89.6) extra += S.g(F.markText('CLICK!', 0, 0, 90, -8, '#5CFF7A') + F.sparkle(-160, -80, 40) + F.sparkle(170, -40, 30), `translate(${MIR.x - 300} ${MIR.y - 860 * MIR.s}) scale(${f(ease.outBack(inv(88.95, 89.1, t)))})`);
  }
  let o = mirrorShot(t, cam, pose, extra);
  o += U.toast('ACCESSORY EQUIPPED', 'Orange Hair', S.g(YOU_DESIGN.hairPiece(0), 'scale(0.3) translate(0 800)'), inv(89.75, 90.0, t) * (1 - inv(92.2, 92.5, t)));
  return o;
}

function bathroomReal(t, cam, pose) {
  const L = E.bathroomLayers(cam, t);
  return S.g(L.back + L.glass + L.frame, null, { filter: 'url(#blurBg)' }) + S.g(drawHero({ x: 960, y: 1180, s: 0.8, nametag: tag, ...pose }), E.camTf(cam, 1));
}

function shotTag(t) { // 92.6 - 95.8
  const k = ease.inOut(inv(92.7, 94.6, t));
  const cam = { zoom: 1.7, fx: 960, fy: lerp(560, 330, k) };
  let o = bathroomReal(t, cam, { face: { name: 'amazed', eyes: { look: [0, -1], cross: 0.9, pupil: 1.1 }, fx: [] }, headRot: -2 });
  const big = ease.outBack(inv(95.0, 95.2, t));
  if (big > 0) o += S.g(S.el('text', { x: 0, y: 0, 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, 'font-size': 160, fill: '#FFFFFF', stroke: '#1b1b1b', 'stroke-width': 22, 'paint-order': 'stroke', 'text-anchor': 'middle' }, 'YOU') + F.sparkle(-220, -110, 40) + F.sparkle(240, -60, 34), `translate(960 330) scale(${f(big)})`);
  return o;
}

function shotFacepalm(t) { // 95.8 - 98.6
  const v = vis('YOU', t);
  const k = ease.outBack(inv(95.85, 96.1, t));
  const cam = { zoom: 1.55, fx: 960, fy: 520 };
  const o = bathroomReal(t, cam, { armR: lerp(9, -152, k), armL: 9, headRot: 8 * k, headY: 6 * k, face: { name: 'sad', mouth: v || 'frown', eyes: { upper: 0.6 }, fx: [] } });
  return whip(t, 98.45, 98.75, o + C.sfx('*sigh*', 1380, 420, inv(96.1, 96.3, t) * (1 - inv(96.9, 97.1, t)), 60, 6, '#FFFFFF'));
}

// ---------------------------------------------------------------- kitchen part (98.6 - 123.6)
const MOM = { x: 560, y: 960, s: 0.62 };
const DOOR = { x: 230, y: 960, s: 0.62 };
function momPose(t, o = {}) {
  const [hx, hy] = hand(o.armR ?? 40);
  return { ...MOM, turn: o.turn ?? 0.3, armR: o.armR ?? 40, armL: o.armL ?? 9, headRot: o.headRot || 0, face: o.face || 'happy', nametag: 'Mom', bodyY: o.bodyY || 0,
    props: [{ svg: P.apron(), layer: 'mid' }, { svg: P.spatula({ x: hx, y: hy + 20, rot: o.spRot ?? 18 }), layer: 'front' }] };
}

function kitchen(t, cam, o = {}) {
  const L = E.kitchenLayers(cam, t, { burner: true });
  let w = o.noPancakeInPan ? '' : P.pan({ x: 850, y: 606 });
  if (o.pancakeArc !== undefined) {
    const k = o.pancakeArc;
    w += P.pancake({ x: 850, y: 590 - Math.sin(k * Math.PI) * 260, s: 0.75, rot: 360 * k });
  } else if (!o.noPancakeInPan) w += P.pancake({ x: 850, y: 590, s: 0.75 });
  w += C.dust ? '' : '';
  // steam
  for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; w += S.path(`M${830 + i * 25} ${f(560 - ph * 160)} q14 -20 0 -40 q-14 -20 0 -40`, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: f(0.7 * (1 - ph)) }); }
  if (o.mom) w += cast.mom(o.mom);
  if (o.you) w += drawHero(o.you);
  return L.back + S.g(w + (o.extra || ''), E.camTf(cam, 1));
}

function shotKitchenWide(t) { // 98.6 - 103.4
  const cam = { zoom: 1.0 + 0.05 * inv(98.6, 103.4, t), fx: 900, fy: 560 };
  const flip = inv(99.2, 100.0, t);
  const turned = ease.inOut(inv(101.1, 101.4, t));
  const armR = lerp(40, 100, bump(t, 99.05, 99.6));
  let o = kitchen(t, cam, {
    pancakeArc: flip > 0 && flip < 1 ? flip : undefined,
    mom: momPose(t, { turn: lerp(0.3, -0.25, turned), armR, face: turned > 0.5 ? 'happy' : { name: 'joy' } }),
    extra: U.typingBubble(MOM.x, 300, t, inv(101.4, 101.6, t)),
  });
  if (flip > 0.92 && flip < 1.6) o += C.sfx('*flip*', 1100, 380, inv(99.95, 100.05, t) * (1 - inv(100.4, 100.6, t)), 56, -6, '#FFFFFF');
  return whip(t, 98.45, 98.75, o);
}

function bubbleFor(t, text, t0, x = MOM.x, y = 300, s = 0.8) {
  const k = ease.outBack(inv(t0, t0 + 0.15, t));
  const flick = Math.floor(t * 8) % 2 ? '#FF4D6D' : '#151515';
  return chatBubble(text, x, y, { s, pop: k, color: text.includes('#') ? flick : '#151515' });
}

function shotMomBubble(t) { // 103.4 - 105.6
  const v = vis('MOM', t);
  const cam = { zoom: 1.65, fx: MOM.x + 60, fy: 420 };
  let o = kitchen(t, cam, { mom: momPose(t, { turn: -0.25, face: { name: 'joy', mouth: v || 'smile' }, headRot: 3 * Math.sin(t * 6) }), extra: bubbleFor(t, 'Breakfast is ready, #####!', 103.5, MOM.x + 120, 290, 0.7) });
  o += C.sfx('BEEP!', 1500, 260, inv(104.75, 104.85, t) * (1 - inv(105.3, 105.5, t)), 90, 10, '#FF4D6D');
  return o;
}

function shotYouConfused(t) { // 105.6 - 108.0
  const v = vis('YOU', t);
  const cam = { zoom: 1.65, fx: DOOR.x + 100, fy: 420 };
  return kitchen(t, cam, { you: { ...DOOR, turn: 0.45, nametag: tag, face: { name: 'confused', mouth: v || 'wavy' }, headRot: 6 }, mom: momPose(t, { turn: -0.25 }) });
}

function shotMomAngry(t) { // 108.0 - 109.9
  const v = vis('MOM', t);
  const cam = { zoom: 1.85, fx: MOM.x + 60, fy: 420 };
  cam.sx = Math.sin(t * 60) * 5 * (1 - inv(108.1, 108.6, t)); cam.sy = Math.cos(t * 50) * 4 * (1 - inv(108.1, 108.6, t));
  let o = kitchen(t, cam, { mom: momPose(t, { turn: -0.25, armR: 70 + 10 * Math.sin(t * 20), face: { name: 'angry', mouth: v || 'grin', fx: ['anger'] } }), extra: bubbleFor(t, 'I said #####!', 108.15, MOM.x + 120, 290, 0.85) });
  o += S.rect(0, 0, W, H, 0, { fill: '#FF2D55', opacity: f(0.12 * bump(t, 108.1, 108.6)) });
  o += C.sfx('BEEP!', 1450, 300, inv(108.7, 108.8, t), 110, -8, '#FF4D6D');
  return o;
}

function shotFiltered(t) { // 109.9 - 115.2
  const cam = { zoom: 1.25, fx: MOM.x + 120, fy: 420 };
  let o = '';
  if (t < 112.1) {
    o += S.g(kitchen(t, cam, { mom: momPose(t, { turn: -0.25 }) }), null, { filter: 'url(#blurBg)' });
    // the word "honey" gets filtered
    const k = ease.outBack(inv(110.0, 110.2, t));
    let card = S.rect(-420, -150, 840, 300, 40, { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 8 });
    const word = 'honey';
    let txt = '';
    for (let i = 0; i < word.length; i++) txt += t > 110.85 + i * 0.07 ? '#' : word[i];
    card += S.el('text', { x: 0, y: 50, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 150, fill: txt.includes('#') ? '#FF4D6D' : '#1F2233', 'text-anchor': 'middle' }, txt);
    const st = ease.outBack(inv(111.3, 111.45, t));
    if (st > 0) card += S.g(S.rect(-230, -60, 460, 120, 16, { fill: 'none', stroke: '#FF2D55', 'stroke-width': 12 }) + S.el('text', { x: 0, y: 30, 'font-family': 'Lilita One, sans-serif', 'font-size': 88, fill: '#FF2D55', 'text-anchor': 'middle' }, 'FILTERED'), `translate(160 110) rotate(-14) scale(${f(2 - st)})`, { opacity: f(st) });
    o += S.g(card, `translate(960 480) scale(${f(k)})`);
    return o;
  }
  // a growing stack of filtered bubbles
  const n = Math.min(11, 1 + Math.floor(inv(112.3, 114.7, t) * 10.999));
  const texts = ['#####!', 'Good morning, #####!', 'Love you, #####!', '#####, eat!', 'Hi #####!'];
  let bub = '';
  const vis6 = Math.min(n, 6);
  for (let i = 0; i < vis6; i++) {
    const idx = n - vis6 + i;
    const y = 640 - (vis6 - 1 - i) * 72;
    bub += S.g(chatBubble(texts[idx % texts.length], MOM.x + 470, y, { s: 0.58, color: '#FF4D6D' }), null, { opacity: f(i === 0 && n > 6 ? 0.5 : 1) });
  }
  o += kitchen(t, cam, { mom: momPose(t, { turn: -0.25, face: { name: 'happy', eyeR: { upper: Math.sin(t * 30) > 0.7 ? 0.4 : 0 } } }), extra: bub });
  const pk = bump(t, 112.3 + (n - 1) * 0.24, 112.3 + (n - 1) * 0.24 + 0.2);
  o += S.g(S.rect(-250, -60, 500, 120, 34, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 6 }) + S.el('text', { x: 0, y: 26, 'font-family': 'Lilita One, sans-serif', 'font-size': 70, fill: '#FF4D6D', 'text-anchor': 'middle' }, `FILTERED x${n}`), `translate(1560 140) scale(${f(1 + 0.12 * pk)})`);
  return o;
}

function tableShot(t, o = {}) {
  const L = E.kitchenLayers({ zoom: 1.5, fx: 900, fy: 500 }, t);
  let s = S.g(L.back, null, { filter: 'url(#blurBg)' });
  s += S.rect(-100, 640, 2120, 600, 0, { fill: 'url(#wood)' }) + S.rect(-100, 630, 2120, 24, 0, { fill: '#B5703A' }) + S.path('M-100 640 L2020 640', { stroke: '#151515', 'stroke-width': 7 });
  s += P.plate({ x: 960, y: 820, s: 1.8 });
  if (o.pancake !== false) {
    const k = o.pancake || 0; // 0 on plate .. 1 gone
    s += P.pancake({ x: lerp(960, 330, k), y: lerp(790, 1000, k), s: 1.8 * (1 - k * 0.75), rot: k * 360 });
    for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; s += S.path(`M${920 + i * 40} ${f(700 - ph * 200)} q18 -24 0 -48 q-18 -24 0 -48`, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: f(0.8 * (1 - ph) * (1 - k)) }); }
  }
  return s;
}

function shotPancake(t) { // 115.2 - 119.8
  if (t < 118.85) {
    const z = 1 + 0.06 * inv(115.2, 118.8, t);
    const fly = inv(118.0, 118.35, t);
    let o = S.g(tableShot(t, { pancake: fly > 0 ? Math.min(1, fly * 1.2) : 0 }), `translate(960 700) scale(${f(z)}) translate(-960 -700)`);
    if (fly > 0) o += F.sparkle(960, 700, 70 * bump(t, 118.0, 118.4)) + burstStar(t);
    const slotPulse = bump(t, 118.35, 118.7);
    o += U.hotbar(inv(117.0, 117.3, t), [t > 118.35 ? P.pancake({ s: 0.55 }) : null, null, null, null, null], t > 118.35 ? 0 : -1, slotPulse);
    if (t > 118.35) o += C.sfx('EQUIPPED!', 960, 760, inv(118.35, 118.5, t), 100, -6, '#5CFF7A');
    return o;
  }
  // hero proudly holding the equipped pancake
  const cam = { zoom: 1.5, fx: 1250, fy: 430 };
  const [hx, hy] = hand(115);
  const you = { x: 1250, y: 960, s: 0.62, turn: 0.15, armR: 115, nametag: tag, face: { name: 'happy' }, props: [{ svg: P.pancake({ x: hx + 10, y: hy - 30, s: 1.1, rot: -10 }), layer: 'top' }] };
  let o = kitchen(t, cam, { you, noPancakeInPan: true });
  o += U.hotbar(1, [P.pancake({ s: 0.55 })], 0, 0);
  return o;
}
function burstStar(t) { return C.burst(960, 680, inv(118.0, 118.45, t), '#FFE14D'); }

function shotTaste(t) { // 119.8 - 123.6
  const v = vis('YOU', t);
  const chew = t > 119.95 && t < 120.7;
  const disappointed = t > 120.9;
  const cam = { zoom: 1.9, fx: 1290, fy: 440 };
  const [hx, hy] = hand(128);
  let face;
  if (chew) face = { name: 'happy', eyes: { type: 'closed' }, mouth: Math.floor(t * 10) % 2 ? 'B' : 'line' };
  else if (disappointed) face = { name: 'deadpan', mouth: v || 'frown', eyes: { upper: 0.5, look: [0.6, 0.2], cross: 0 } };
  else face = { name: 'happy', mouth: 'smile' };
  const you = { x: 1250, y: 960, s: 0.62, turn: 0.15, armR: 128, nametag: tag, face, headRot: disappointed ? -4 : 0,
    props: [{ svg: P.pancake({ x: hx - 20, y: hy - 10, s: 1.0, rot: -20 }), layer: 'top' }] };
  let o = kitchen(t, cam, { you, noPancakeInPan: true });
  o += C.sfx('*clack*', 1240, 360, inv(119.98, 120.08, t) * (1 - inv(120.5, 120.7, t)), 64, 8, '#FFFFFF');
  o += U.hotbar(1, [P.pancake({ s: 0.55 })], 0, 0);
  return o;
}

function scene(t) {
  if (t < 62.5) return shotCard(t);
  if (t < 67.8) return shotClock(t);
  if (t < 69.4) return shotDeadpan(t);
  if (t < 73.5) return shotPOV(t);
  if (t < 76.3) return shotMyHands(t);
  if (t < 78.0) return shotRunToMirror(t);
  if (t < 86.0) return whip(t, 77.8, 78.2, shotMirror(t));
  if (t < 92.6) return shotBald(t);
  if (t < 95.8) return shotTag(t);
  if (t < 98.6) return shotFacepalm(t);
  if (t < 103.4) return shotKitchenWide(t);
  if (t < 105.6) return shotMomBubble(t);
  if (t < 108.0) return shotYouConfused(t);
  if (t < 109.9) return shotMomAngry(t);
  if (t < 115.2) return shotFiltered(t);
  if (t < 119.8) return shotPancake(t);
  return shotTaste(t);
}

// captions move up while the hotbar is on screen
const captionY = () => 1018;

module.exports = { scene, TRACK, LINES, END, captionY };
