// SC 12 · АУТРО — the hero's room, a bright normal morning. NARRATOR: "if YOU had admin commands... what would you type
// first?" — a giant empty chat bar cycles through ideas, then turns into a comment box ("Tell us in the comments!").
// "And remember: with great commands... comes great... cat problems." — behind him Pancake (crown) flops onto the laptop,
// ";fly all" — Command accepted — and everything on the left half of the frame starts floating up, the hero included.
// "Pancake! Put. The laptop. DOWN!" The last ~8 s keep the right side calm for YouTube's end screen: two video frames +
// a subscribe circle (plain placeholders on a soft panel).
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const { L } = K.V;
const E = require('./s09_env');
const { R, P, CI, EL, G, tr, outT, outTF, ob, io, eo, at, drift, withShake, white, whip, ST, A, CATS } = E;

const START = K.V.scene('SC 12').start, END = K.V.DURATION;
const l0 = L('12.0'), l1 = L('12.1'), l2 = L('12.2');

// ---------------------------------------------------------------- beats
const tYou = l0.word('YOU').t0, tHad = l0.word('had').t0, tWhat = l0.word('what').t0, tFirst = l0.word('first').t1;
const tTell = l0.word('Tell').t0, tComments = l0.word('comments').t0;
const tAnd = l1.a, tWith = l1.word('with').t0, tComes = l1.word('comes').t0, tCat = l1.word('cat').t0, tProblems = l1.word('problems').t0;
const tPancake = l2.a, tPut = l2.word('Put').t0, tLaptop = l2.word('laptop').t0, tDown = l2.word('DOWN').t0;
const tCard = Math.min(END - 8, tWith);                  // the end card is fully in by here (right side calm from now on)
const tPull = tAnd - 0.1;                                // camera pulls back to the end-card framing
const tFlop = tComes - 0.15;                             // Pancake flops onto the laptop
const tFloat = tComes + 0.55;                            // ...and everything starts floating
const tLift = tCat - 0.1;                                // the hero's feet leave the floor

// ---------------------------------------------------------------- layout
const HX = 420, HY = 990, HS = 0.58;
const LAP = { x: 760, y: 678, s: 0.32 };
const CAM_CARD = at(860, 560, 1.06);

// ---------------------------------------------------------------- floating junk (left half only)
const JUNK = [
  ['ball', 150, 965, 0.0, 1.0], ['shoe', 250, 990, 0.25, 0.8], ['sock', 330, 1000, 0.5, 1.2], ['book', 640, 676, 0.15, 0.9],
  ['pencils', 700, 676, 0.35, 1.1], ['pad', 860, 690, 0.6, 0.85], ['book2', 940, 676, 0.45, 1.0], ['plant', 80, 800, 0.7, 0.7],
];
function junkItem(kind, t) {
  switch (kind) {
    case 'ball': return CI(0, -36, 36, ol('#FFFFFF', 5)) + P('M0 -50 l12 9 l-5 14 h-14 l-5 -14 Z', { fill: E.LINE }) + P('M-34 -46 l12 4 M34 -46 l-12 4 M-20 -6 l6 -10 M20 -6 l-6 -10', ln(4));
    case 'shoe': return P('M-50 0 Q-56 -30 -30 -34 L0 -40 Q20 -60 40 -36 Q60 -24 56 0 Z', ol('#3A7BD5', 5)) + R(-56, -8, 114, 10, 5, ol('#FFFFFF', 4)) + P('M-14 -34 l10 10 M-2 -38 l10 10', ln(4, '#FFFFFF'));
    case 'sock': return P('M-12 -60 H14 V-20 Q30 -10 26 4 Q20 14 -6 6 Q-16 0 -14 -18 Z', ol('#FFFFFF', 5)) + R(-12, -60, 26, 12, 3, { fill: '#E8453C' });
    case 'book': return R(-40, -56, 80, 56, 5, ol('#E8453C', 5)) + R(-30, -48, 8, 40, 2, { fill: '#FFFFFF', opacity: 0.6 }) + TF('MATH', 6, -22, 16, '#FFFFFF');
    case 'book2': return R(-36, -50, 72, 50, 5, ol('#3BD16F', 5)) + TF('OBBY', 0, -18, 16, '#FFFFFF');
    case 'pencils': return R(-20, -44, 40, 44, 6, ol('#FFB13B', 4)) + P('M-10 -44 L-14 -76 M0 -44 L2 -80 M10 -44 L16 -72', ln(7)) + P('M-10 -44 L-14 -76 M0 -44 L2 -80 M10 -44 L16 -72', ln(4, '#FFD84D'));
    case 'pad': return R(-46, -24, 92, 30, 12, ol('#2B2E3A', 5)) + CI(-24, -10, 6, { fill: '#5AB0FF' }) + CI(22, -14, 4, { fill: '#FF5A5A' }) + CI(30, -6, 4, { fill: '#3BD16F' });
    case 'plant': return P('M-26 0 L-32 -40 H32 L26 0 Z', ol('#C8604A', 5)) + P('M0 -40 Q-30 -90 -46 -96 M0 -40 Q10 -100 4 -120 M0 -40 Q30 -80 50 -86', ln(14)) + P('M0 -40 Q-30 -90 -46 -96 M0 -40 Q10 -100 4 -120 M0 -40 Q30 -80 50 -86', ln(8, '#4CB65A'));
    default: return '';
  }
}
function floatK(t, delay, speed) { const u = Math.max(0, t - tFloat - delay); return u * u * 0.5 * 60 * speed + u * 30 * speed; }
function junk(t) {
  let o = '';
  for (const [kind, x, y, delay, speed] of JUNK) {
    const up = floatK(t, delay, speed);
    const rot = up > 0 ? Math.sin(t * 1.3 + x) * 14 + up * 0.08 * (x % 2 ? 1 : -1) : 0;
    o += G(junkItem(kind, t), `translate(${f(x + (up > 0 ? Math.sin(t * 1.1 + x) * 12 : 0))} ${f(y - up)}) rotate(${f(rot)})`);
  }
  return o;
}

// ---------------------------------------------------------------- UI overlays
const IDEAS = [';fly me', ';size pizza 100', ';tp me to the moon', ';skip homework'];
function ideaBar(t, k) {
  if (k <= 0) return '';
  // cycles through ideas during "what would you type first?": type → hold → delete
  let text = '', prog = 1;
  if (t >= tWhat - 0.1) {
    const span = Math.max(0.4, tTell - 0.1 - (tWhat - 0.1)), u = clamp((t - tWhat + 0.1) / span, 0, 0.999);
    const i = Math.floor(u * IDEAS.length), v = (u * IDEAS.length) % 1;
    text = IDEAS[i];
    prog = v < 0.55 ? v / 0.55 : v < 0.8 ? 1 : 1 - (v - 0.8) / 0.2;
  }
  return G(K.chatCommand(0, 0, text || ' ', text ? prog : 0, { t, s: 1.35, w: 640, user: 'YOU' }), `scale(${f(ob(k))})`);
}
function commentCard(t, k) {
  if (k <= 0) return '';
  let o = R(-380, -110, 760, 220, 30, ol('#FFFFFF', 8));
  o += CI(-296, -20, 52, ol('#FF8A3D', 6)) + P('M-336 -36 Q-296 -96 -256 -36 Z', ol('#B84B02', 5)) + R(-322, -40, 52, 52, 10, ol('#FFFFFF', 4)) + CI(-306, -18, 6, { fill: E.LINE }) + CI(-286, -18, 6, { fill: E.LINE });
  o += TF('@YOU', -220, -54, 30, '#7A8294', { 'text-anchor': 'start' });
  const txt = 'I would type ;', n = Math.floor(clamp((t - tComments) * 22, 0, txt.length));
  o += R(-226, -30, 576, 58, 16, ol('#F4F6FF', 5)) + TF(txt.slice(0, n) + (Math.floor(t * 4) % 2 ? '|' : ''), -210, 10, 32, '#2A1640', { 'text-anchor': 'start' });
  o += G(R(-104, -26, 208, 52, 20, ol('#2E7BFF', 5)) + T('COMMENT', 0, 16, 32, '#FFFFFF'), 'translate(246 70)');
  return G(o, `scale(${f(ob(k))})`);
}
function downArrow(x, y, t, k) {
  if (k <= 0) return '';
  return G(P('M-34 -54 L34 -54 L34 0 L70 0 L0 70 L-70 0 L-34 0 Z', ol('#FF4D8D', 8)), `translate(${x} ${f(y + Math.abs(Math.sin(t * 7)) * 24)}) scale(${f(0.7 * ob(k))})`);
}
// ---------------------------------------------------------------- end screen (plain placeholders on a soft panel)
const VID = [[1540, 290, 600, 338], [1540, 690, 600, 338]];
const SUB = [1080, 250, 100];
function endCard(t, k) {
  if (k <= 0) return '';
  const slide = (1 - eo(k)) * 900;
  let o = G(R(1160, 70, 820, 860, 44, { fill: '#2A2246', opacity: 0.55 }), `translate(${f(slide)} 0)`);
  VID.forEach(([x, y, w, h], i) => {
    const kk = ob(seg(k, 0.15 + i * 0.15, 0.75 + i * 0.15));
    if (kk <= 0) return;
    let g = R(-w / 2 + 10, -h / 2 + 14, w, h, 26, { fill: '#000', opacity: 0.16 }) + R(-w / 2, -h / 2, w, h, 26, { fill: '#1E1838', opacity: 0.9, stroke: '#FFFFFF', 'stroke-width': 10 });
    g += CI(0, 0, 52, { fill: '#FFFFFF', opacity: 0.2 }) + P('M-16 -26 L28 0 L-16 26 Z', { fill: '#FFFFFF', opacity: 0.6 });
    g += G(R(-120, -28, 240, 56, 20, ol('#FF4D8D', 6)) + T(i ? 'MORE VIDEOS' : 'WATCH NEXT', 0, 17, 34, '#FFFFFF'), `translate(${-w / 2 + 120} ${-h / 2})`);
    o += G(g, `translate(${x} ${y}) scale(${f(kk)})`);
  });
  const ks = ob(seg(k, 0.45, 1));
  if (ks > 0) {
    const [cx, cy, r] = SUB;
    let g = CI(6, 10, r, { fill: '#000', opacity: 0.16 }) + CI(0, 0, r, { fill: '#1E1838', opacity: 0.9, stroke: '#FFFFFF', 'stroke-width': 10 });
    g += G(R(-124, -30, 248, 60, 22, ol('#E8243C', 6)) + T('SUBSCRIBE', 0, 18, 38, '#FFFFFF'), `translate(0 ${r + 34})`);
    o += G(g, `translate(${cx} ${cy}) scale(${f(ks)})`);
  }
  return o;
}

// ---------------------------------------------------------------- the hero
function heroPose(t) {
  let pose = { x: HX, y: HY, s: HS, armL: 12, armR: 12, turn: 0, face: { name: 'happy' } };
  if (t < tYou - 0.1) {                                          // "So..." — a little wave hello
    const w = Math.sin((t - START) * 11) * 16 * (1 - seg(t, tYou - 0.4, tYou - 0.1));
    pose = { ...pose, armR: 140 + w, face: { name: 'joy' } };
  } else if (t < tWhat - 0.15) {                                 // "if YOU had admin commands" — points at you
    const k = ob(seg(t, tYou - 0.1, tYou + 0.1));
    pose = { ...pose, armR: lerp(30, 84, k), lean: 3 * k, turn: 0.1, face: { name: 'excited' } };
  } else if (t < tTell - 0.1) {                                  // "what would you type first?" — thinking
    pose = { ...pose, armL: 26, armR: 26, headRot: 8 * Math.sin((t - tWhat) * 2), face: { name: 'confused', eyes: { look: [0.9, -0.6] } } };
  } else if (t < tPull) {                                        // "Tell us in the comments!" — points down at the box
    const k = ob(seg(t, tTell - 0.1, tTell + 0.15));
    pose = { ...pose, armR: lerp(26, 40, k) + 4 * Math.sin(t * 12), armL: 12, turn: 0.25, face: { name: 'joy' } };
  } else if (t < tComes) {                                       // "And remember: with great commands..." — finger up, wise
    const k = ob(seg(t, tPull, tPull + 0.3));
    pose = { ...pose, armR: lerp(12, 156, k), armL: 12, headRot: -4, face: t < tWith ? { name: 'smug' } : { name: 'determined', eyes: { type: 'closed' } } };
  } else if (t < tPancake - 0.1) {                               // "comes great... cat problems." — oblivious, then floating
    const k = seg(t, tComes, tComes + 0.3);
    pose = { ...pose, armR: lerp(156, 130, k), armL: 12, headRot: -4, face: t < tLift ? { name: 'smug', eyes: { type: 'closed' } } : { name: 'shocked', eyes: { look: [0, 1] } } };
    if (t > tLift) pose = { ...pose, armR: 60 + 20 * Math.sin(t * 9), armL: 60 - 20 * Math.sin(t * 9) };
  } else {                                                       // "Pancake! Put. The laptop. DOWN!" — turns around, points
    const k = io(seg(t, tPancake - 0.1, tPancake + 0.25));
    const jab = bump(t, tPut - 0.05, tPut + 0.2) + bump(t, tLaptop - 0.05, tLaptop + 0.2) + 1.3 * bump(t, tDown - 0.05, tDown + 0.3);
    pose = { ...pose, turn: lerp(0, 0.75, k), armR: 90 + 10 * jab, armL: 30 + 25 * Math.sin(t * 8), lean: 4 * jab, face: { name: 'angry' } };
    if (t > l2.b + 0.2) pose = { ...pose, turn: lerp(0.75, 0, io(seg(t, l2.b + 0.2, l2.b + 0.6))), armR: 70 + 30 * Math.sin(t * 7), armL: 70 - 30 * Math.sin(t * 7), face: { name: 'deadpan' } };
  }
  const lift = t > tLift ? Math.min(220, Math.pow(t - tLift, 1.3) * 40) + Math.sin(t * 2.3) * 6 : 0;
  pose.lift = lift;
  if (lift > 0) { pose.legL = 6 + 6 * Math.sin(t * 5); pose.legR = 4 - 6 * Math.sin(t * 5); pose.rot = 3 * Math.sin(t * 1.4); }
  return pose;
}

// ---------------------------------------------------------------- Pancake + the laptop on the desk
function deskStuff(t) {
  const flop = io(seg(t, tFlop, tFlop + 0.35));
  const up = t > tFloat - 0.2 ? Math.min(260, Math.pow(Math.max(0, t - tFloat + 0.2), 1.4) * 52) + Math.sin(t * 2) * 5 : 0;
  const rot = up > 0 ? Math.sin(t * 1.2) * 6 - 4 : 0;
  const typed = t > tFlop + 0.25 ? ';fly all' : '';
  const scr = ST.adminScreen(t, { battery: 100, lines: t > tFlop + 0.5 ? ['kkkkkkkkkk', ';fly all', 'Command accepted.'] : ['Admin panel loaded.'], typed: t > tFlop + 0.5 ? '' : typed });
  let o = ST.laptop(0, 0, LAP.s, scr, { t, glow: t > tFlop + 0.4 ? 0.8 : 0.3, dust: 0.1 });
  if (flop < 0.02) o += CATS.pancake({ x: 230, y: 4, s: 0.62, pose: 'sit', mood: 'smug', crown: true, t, look: [-0.6, 0.2] });
  else o += CATS.pancake({ x: lerp(230, 0, flop), y: lerp(4, -22, flop) - Math.sin(flop * Math.PI) * 70, s: 0.62, pose: flop < 0.6 ? 'pounce' : 'loaf', mood: 'smug', keyboard: false, crown: true, t, flip: true, look: [-0.8, 0.3], blink: bump(t, tPut, tPut + 0.15) });
  return G(o, `translate(${f(LAP.x)} ${f(LAP.y - up)}) rotate(${f(rot)})`);
}

// ---------------------------------------------------------------- the frame
function scene(t) {
  const out = io(seg(t, tPull, tPull + 0.9));
  const camA = drift(K.camKeys(t, [[START, at(700, 600, 1.55)], [tYou - 0.05, at(700, 600, 1.58)], [tYou + 0.1, at(690, 590, 1.75)], [tWhat - 0.2, at(700, 590, 1.68)], [tPull, at(720, 600, 1.5)]]), t, 3);
  let cam = { zoom: lerp(camA.zoom, CAM_CARD.zoom, out), x: lerp(camA.x, CAM_CARD.x, out), y: lerp(camA.y, CAM_CARD.y, out) };
  cam = withShake(cam, t, [[tDown, 0.35, 12], [tYou, 0.2, 6]]);
  const Lr = ST.heroRoom.layers(t, { time: 'day' });
  const hero = K.actor('you', t, heroPose(t), { arms: false, energy: 0.8 });
  let o = K.view(cam, Lr.bg, 0.7) + K.view(cam, Lr.mid, 1) + K.view(cam, deskStuff(t), 1) + K.view(cam, (Lr.front || '') + junk(t) + hero, 1) + K.view(cam, Lr.fg || '', 1.2) + K.view(cam, Lr.light || '', 1);
  // phase 1 overlays (before the end card)
  const kb = seg(t, tHad - 0.15, tHad + 0.15) * (1 - seg(t, tTell - 0.2, tTell));
  if (kb > 0) o += G(ideaBar(t, kb), tr(1300, 330));
  if (t > tYou && t < tWhat) o += K.bang('YOU?!', 1560, 800, seg(t, tYou, tYou + 0.1) * (1 - seg(t, tWhat - 0.3, tWhat - 0.05)), 130, 8, '#FF4D8D');
  const kc = seg(t, tTell - 0.1, tTell + 0.25) * (1 - seg(t, tPull - 0.1, tPull + 0.3));
  o += G(commentCard(t, kc), tr(1310, 420));
  o += downArrow(1310, 700, t, kc > 0.6 ? kc : 0);
  // ;fly all — "Command accepted" over the laptop
  if (t > tFlop + 0.5) {
    o += K.accepted(560, 300, seg(t, tFlop + 0.5, tFlop + 0.7) * (1 - seg(t, tCat, tCat + 0.3)), 0.8);
  }
  if (t > tDown) o += K.bang('DOWN!', 770, 190, seg(t, tDown, tDown + 0.1) * (1 - seg(t, END - 0.6, END - 0.2)), 130, -8, '#FF6A3D');
  if (t > tPancake && t < tPut) o += K.bang('PANCAKE!', 430, 210, seg(t, tPancake, tPancake + 0.1) * (1 - seg(t, tPut - 0.25, tPut)), 100, -6, '#FFB13B');
  // the end card (right side calm for the last ~8 s)
  o += endCard(t, seg(t, tCard - 1.2, tCard));
  return o;
}
function look(t) { return { grade: 'warm', vignette: 0.45 }; }
function captionY() { return 1010; }

module.exports = { scene, look, captionY, beats: { tCard, tPull, tFlop, tFloat, tLift, START, END } };
