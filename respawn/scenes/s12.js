// SC 12 · FINAL GAG + OUTRO. Night: the hero asleep in his attic room, Gary's bowl glowing on the desk, a tiny green flag
// blinking on the gravel ("Checkpoint saved." whisper toast). Push in: Gary saw the whole thing (slow blink) — and now Gary
// slowly turns to camera, eyes glowing green, a "GARY · LIVES: ∞" pill. Smash to the bright outro: the hero waves on a big
// checkpoint pad, a carousel of respawn moments (bike, spaghetti, dodgeball, foam), "what would YOU redo?" (smash zoom),
// comment bubbles stack up, LIVES: 1, "Make it count." jump + block confetti; then the END SCREEN (~10 s): the hero, Ivy and
// Gary idle on the left (waves, the Book of Fails, a tiny Gary respawn gag), two video slots + a subscribe circle left clear
// for the YouTube end-screen elements, drifting cubes.
'use strict';

const K = require('./kit');
const R = require('./respawn');
const AC = require('./acting');
const SH = require('./sets_home');
const X = require('../rig/extras');
const E = require('./s01_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, mod, at, toScr, shakeAll, frameTf, whip, smash, zoomLines, boing, impact, trail, bikeRig } = E;

const A = Array.from({ length: 3 }, (_, i) => L('12.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const START = K.V.scene('SC 12').start, END = K.V.DURATION;
const HR = SH.SPOTS.heroRoom;

// ================================================================= beats
const tSaved = A[0].a;
const tTurn0 = w(1, 'And'), tTurn1 = w(1, 'Gary', 1), tGlow = w(1, 'turn.');
const tYou = w(2, 'YOU', 1), tTell = w(2, 'Tell'), tRem = w(2, 'And'), tOne = w(2, 'one'), tMake = w(2, 'Make'), tCount = w(2, 'count.');
const CUT = {};
CUT.room = START;
CUT.bowl = A[1].a - 0.1;
CUT.turn = w(1, 'And') - 0.1;
CUT.outro = A[2].a - 0.12;
CUT.you = tYou - 0.1;
CUT.tell = tTell - 0.12;
CUT.one = tRem - 0.1;
CUT.end = Math.max(A[2].b + 0.25, END - 10.2);
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.3) CUT[ks[i]] = CUT[ks[i - 1]] + 0.3;
}

// ================================================================= the night room
const BOWL = { x: HR.bowl.x, y: HR.bowl.y, s: HR.bowl.s };
function bowlSvg(t, o = {}) {
  const yaw = o.yaw ?? 90 + 12 * Math.sin(t * 0.8);
  return X.fishbowl({ x: o.x ?? BOWL.x, y: o.y ?? BOWL.y, s: o.s ?? BOWL.s, t, line: o.line ?? 17.5,
    gary: { yaw, s: 0.62 * (o.gs || 1), x: o.gx ?? -40, y: -240, glowEyes: o.glow || 0, blink: o.blink || 0, lids: o.lids ?? 0.46, look: o.look || [0, 0], bubble: o.bubble || 0 },
    flagSvg: R.tinyFlag(0, 0, 2.4, t, { blink: true }) });
}
function room(t, cam, o = {}) {
  const Lr = SH.heroRoom.layers(t, { time: 'night', sleep: true, clock: '11:58', mess: 0.3, lights: 0.6 });
  const lie = HR.bed.lie;
  // the sleeping hero: rises and falls with his breath
  const br = Math.sin(t * 1.6);
  const heroSv = actor('you', t, { x: lie.x, y: lie.y, s: lie.s, rot: lie.rot, rotY: -470, bodyY: 3 * br, face: { name: 'sleepy', eyes: { type: 'closed' }, mouth: 'smallSmile', fx: [] }, shadow: false }, { arms: false });
  let o2 = view(cam, Lr.bg, 0.85) + view(cam, Lr.mid + heroSv + Lr.front, 1);
  o2 += view(cam, (Lr.fg || '') + Lr.light, 1);
  // the bowl is lit by its own flag (drawn over the night light, with a soft blue moon tint of its own)
  const bw = bowlSvg(t, o);
  o2 += view(cam, S.ellipse(BOWL.x, BOWL.y - 50, 190, 120, { fill: 'url(#rspGlowG)', opacity: f(0.45 + 0.25 * Math.sin(t * 5)) }) + bw, 1);
  // Zzz over the bed
  const [zx, zy] = toScr(cam, 260, 640);
  o2 += K.C.zzz(t, zx, zy);
  return o2;
}

// ---- 1. "Checkpoint saved." (whisper) — the dark room, the bowl glows on the desk
function shRoom(t) {
  const u = seg(t, CUT.room, CUT.bowl);
  const cam = { zoom: lerp(1.0, 1.35, ease.inOut(u)), x: lerp(0, 220, ease.inOut(u)), y: lerp(0, 60, u) };
  let o = room(t, cam);
  // soft green pulse from the bowl on the whisper
  const [bx, by] = toScr(cam, BOWL.x, BOWL.y - 60);
  const pk = seg(t, tSaved, tSaved + 1.2);
  if (pk > 0 && pk < 1) o += S.circle(bx, by, 40 + 700 * ease.out(pk), { fill: 'none', stroke: '#7CFFB2', 'stroke-width': f(18 * (1 - pk)), opacity: f(0.7 * (1 - pk)) });
  o += R.savedToast(70, 880, seg(t, tSaved - 0.05, tSaved + 0.35), { t, s: 0.7, out: seg(t, A[0].b + 0.3, A[0].b + 0.6) });
  // fade in from black (hand-over from SC 11's workshop)
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#05030C', opacity: f(0.85 * (1 - ease.out(seg(t, START, START + 0.3)))) });
  return o;
}
// ---- 2. "Gary saw the whole thing." — close on the bowl, slow blink
function shBowl(t) {
  const u = seg(t, CUT.bowl, CUT.turn);
  const cam = at(BOWL.x + 4, BOWL.y - 66, lerp(5.2, 5.6, ease.inOut(u)));
  const bl = bump(t, w(1, 'thing.') - 0.05, w(1, 'thing.') + 0.45);
  return room(t, cam, { blink: bl, yaw: 70 + 10 * Math.sin(t), look: [0.5, 0.2], bubble: seg(t, CUT.bowl + 0.3, CUT.bowl + 1.3), gs: 1.3, gx: 50 });
}
// ---- 3. "And now... Gary wants a turn." — he turns to camera, eyes glow green
function shTurn(t) {
  const yawK = ease.inOut(seg(t, tTurn0 + 0.1, tTurn1 + 0.1));
  const g = ease.out(seg(t, tGlow - 0.05, tGlow + 0.3));
  const cam = shakeAll(at(BOWL.x + 8, BOWL.y - 70, lerp(5.6, 6.1, yawK) + 1.4 * ease.in(seg(t, tGlow - 0.05, CUT.outro))), t, [[tGlow, 0.35, 6]]);
  let o = room(t, cam, { yaw: lerp(80, 0, yawK), glow: g, lids: lerp(0.46, 0.2, g), look: [0, 0], gs: 1.3 + 0.1 * g, gx: 50 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#2BFF8A', opacity: f(0.12 * g) });
  // GARY · LIVES: ∞
  o += R.counterHUD({ x: 1860, y: 110, s: 0.9, anchor: 'right', t, label: 'GARY · LIVES:', value: '∞', theme: 'green', icon: 'heart', k: seg(t, tGlow + 0.05, tGlow + 0.35), bump: seg(t, tGlow + 0.3, tGlow + 0.75) });
  return o + smash(t, tGlow, 0.1, 0.35, '#7CFFB2');
}

// ================================================================= the outro stage
function stageBg(t, hue = 0) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s12bg)' });
  // slow rotating rays + drifting obby squares
  o += K.rays(960, 1250, 18, 1700, '#FFFFFF', 0.05, t * 6);
  let sq = '';
  for (let i = 0; i < 26; i++) {
    const x = mod(hash(i * 3.1) * 2100 + t * (20 + 30 * hash(i)), 2100) - 90, y = mod(hash(i * 7.7) * 1200 - t * (30 + 40 * hash(i * 2)), 1200) - 60, s = 14 + 30 * hash(i * 5.5);
    sq += `M${f(x - s)} ${f(y - s)}h${f(2 * s)}v${f(2 * s)}h${f(-2 * s)}Z`;
  }
  o += S.path(sq, { fill: '#FFFFFF', opacity: 0.07 });
  // floor
  o += S.ellipse(960, 1080, 1300, 230, { fill: '#25165A', opacity: 0.6 });
  return o;
}
// mini "respawn moment" cards for the carousel
function miniCard(kind, t, x, y, s, rot) {
  const cid = S.uid('s12m');
  const W_ = 420, H_ = 270;
  let inner = '';
  const ph = mod(t * 0.9 + hash(kind.length) , 1);
  const bgs = { bike: ['#8FD3FF', '#9ED6A0'], spag: ['#FFE9A8', '#BFE8E0'], ball: ['#BFE3FF', '#E8C18A'], foam: ['#6A3FC0', '#B0702A'] };
  const [c1, c2] = bgs[kind];
  inner += S.rect(-W_ / 2, -H_ / 2, W_, H_, 0, { fill: c1 }) + S.rect(-W_ / 2, 40, W_, H_ / 2, 0, { fill: c2 });
  const gy = 90, hs = 0.2;
  if (kind === 'bike') {
    if (ph < 0.4) { const b = bikeRig(t, { x: lerp(-200, 40, ph / 0.4), y: gy, s: hs, pedal: t * 14, spin: t * 20 }); inner += b.bike + b.rider; }
    else inner += R.crumble({ x: 60, y: gy - 60, s: hs, age: (ph - 0.4) * 1.6, dir: [1, -0.3], seed: 3, floorY: gy });
  } else if (kind === 'spag') {
    if (ph < 0.45) inner += actor('you', t, { x: lerp(-150, 0, ph / 0.45), y: gy, s: hs, view: 'side', flip: true, ...AC.walk(t * 11), volume: false, shadow: false, face: 'happy', props: [{ svg: X.lunchTray({ x: -230, y: -450, s: 1.1 }), layer: 'front' }] });
    else inner += R.crumble({ x: 20, y: gy, s: hs, age: (ph - 0.45) * 1.6, seed: 5 }) + X.spaghetti({ x: 120, y: -40 + 200 * (ph - 0.45), s: 0.4, mode: 'fly', k: 0.6, seed: 2 });
  } else if (kind === 'ball') {
    const hit = ph > 0.35;
    if (!hit) inner += actor('you', t, { x: 60, y: gy, s: hs, volume: false, shadow: false, turn: 0.4, face: 'smug' }) + X.dodgeball({ x: lerp(-220, 40, ph / 0.35), y: gy - 150, s: 0.25 });
    else inner += R.crumble({ x: 60, y: gy, s: hs, age: (ph - 0.35) * 1.6, dir: [0.8, -0.3], seed: 7 }) + X.dodgeball({ x: 40 - 200 * (ph - 0.35), y: gy - 150 + 150 * (ph - 0.35), s: 0.25 });
  } else {
    inner += R.foamPile(0, gy + 10, 360, 110, { t, seed: 3 }) + actor('you', t, { x: -40, y: gy - 30, s: hs, volume: false, shadow: false, foam: 1, armL: 150 + 20 * Math.sin(t * 8), armR: 150 - 20 * Math.sin(t * 8), face: 'joy', lift: 20 * Math.abs(Math.sin(t * 6)) }) + actor('ivy', t, { x: 90, y: gy - 30, s: hs * 0.96, volume: false, shadow: false, foam: 0.8, armL: 140, armR: 160, face: 'joy' });
  }
  let g = S.rect(-W_ / 2 - 14 + 8, -H_ / 2 - 14 + 10, W_ + 28, H_ + 60, 14, { fill: '#000', opacity: 0.25 }) + S.rect(-W_ / 2 - 14, -H_ / 2 - 14, W_ + 28, H_ + 60, 14, ol('#FFFDF6', 6));
  g += S.clipDef(cid, S.rect(-W_ / 2, -H_ / 2, W_, H_, 6)) + S.g(inner, null, { 'clip-path': `url(#${cid})` }) + S.rect(-W_ / 2, -H_ / 2, W_, H_, 6, { fill: 'none', stroke: '#151515', 'stroke-width': 5 });
  g += TF({ bike: 'RESPAWN #1', spag: 'RESPAWN #3', ball: 'RESPAWN #4', foam: 'NO RESPAWN', }[kind], 0, H_ / 2 + 32, 30, kind === 'foam' ? '#E8243A' : '#2A1640');
  return S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
const PAD = { x: 960, y: 900, s: 0.42 };
function outroHero(t, pose = {}, act = {}) { return actor('you', t, { ...PAD, ...pose }, act); }
// ---- 4. "So... if you could respawn just once..." — he waves on the pad, a carousel of respawn moments
function shOutro(t) {
  const u = seg(t, CUT.outro, CUT.you);
  let o = stageBg(t);
  // carousel: four cards orbit behind him
  const kinds = ['bike', 'spag', 'ball', 'foam'];
  const spin = (t - CUT.outro) * 0.55;
  // four cards drift along an arc behind him (never in front of his face)
  const kin = ease.outBack(seg(t, CUT.outro + 0.1, CUT.outro + 0.6));
  const cards = kinds.map((k, i) => { const p = mod(spin * 0.32 + i / 4, 1); const a = Math.PI * (1.08 + 0.84 * p); return { k, a, z: -Math.sin(a) }; }).sort((p, q) => p.z - q.z);
  for (const c of cards) o += miniCard(c.k, t, 960 + Math.cos(c.a) * 760 * kin, 560 + Math.sin(c.a) * 300, (0.7 + 0.25 * c.z) * kin, Math.cos(c.a) * 10);
  o += R.checkpoint({ ...PAD, t, state: 'saved', part: 'back' });
  const wave = Math.sin((t - CUT.outro) * 9);
  o += outroHero(t, { turn: 0.15, armR: 150 + 22 * wave, armL: 14, ...boing(t, CUT.outro + 0.05, 0.2), face: { name: 'happy' } }, { arms: false });
  o += R.checkpoint({ ...PAD, t, state: 'saved', part: 'front' });
  o += TS('IF YOU COULD RESPAWN ONCE...', 960, 130, 76, '#FFFFFF', { opacity: f(seg(t, w(2, 'respawn') - 0.1, w(2, 'respawn') + 0.2)) });
  return o + R.flash(0.9 * (1 - seg(t, CUT.outro, CUT.outro + 0.25)), '#7CFFB2');
}
// ---- 5. "what would YOU redo?" — smash zoom, he points at the viewer
function shYou(t) {
  const k = ease.out(seg(t, CUT.you, CUT.you + 0.18));
  let o = stageBg(t);
  o += zoomLines(960, 520, 0.9, t, '#FFE14D', 26, 300);
  let h = R.checkpoint({ ...PAD, t, state: 'saved', part: 'back' }) + outroHero(t, { turn: -0.1, armR: 92, armL: 12, volume: false, lean: -4, face: { name: 'excited', eyes: { look: [0, 0.1] } } }, { arms: false }) + R.checkpoint({ ...PAD, t, state: 'saved', part: 'front' });
  const zz = lerp(1.4, 1.9, k);
  o += S.g(h, frameTf(zz, 0, -60, -80 - 49 * zz));
  o += S.g(TS('WHAT WOULD', 0, -230, 90, '#FFE14D') + TS('YOU', 0, 0, 260, '#FFFFFF') + TS('REDO?', 0, 150, 120, '#FFE14D'), tf(1460, 400, pop(t, tYou - 0.05, 0.22), 8));
  return o + smash(t, CUT.you, 0.1, 0.6);
}
// ---- 6. "Tell me in the comments!" — comment bubbles stack up
const COMMENTS = [
  ['player_one', 'My haircut. Definitely my haircut.', '#FF8A3D'],
  ['ivy_builds', 'Nothing! Fail #314 is next week', '#3DDC84'],
  ['mushroomfan', 'The time I waved at someone who was waving at someone else', '#B06BFF'],
  ['gary', '...', '#FF9F1C'],
];
function bubble(c, x, y, k, t, likes) {
  if (k <= 0) return '';
  const [name, text, col] = c;
  const lines = text.length > 34 ? [text.slice(0, text.lastIndexOf(' ', 34)), text.slice(text.lastIndexOf(' ', 34) + 1)] : [text];
  const hh = 64 + lines.length * 44;
  let g = S.rect(-6, -6 + 10, 760, hh, 26, { fill: '#000', opacity: 0.2 }) + S.rect(0, 0, 760, hh, 26, ol('#FFFFFF', 6));
  g += S.circle(56, 54, 36, ol(col, 5)) + T(name[0].toUpperCase(), 56, 70, 42, '#FFFFFF');
  g += TF('@' + name, 112, 44, 28, '#7A6A9A', { 'text-anchor': 'start' });
  lines.forEach((ln_, i) => { g += TF(ln_, 112, 88 + i * 44, 34, '#2A1640', { 'text-anchor': 'start' }); });
  g += S.path('M690 20 c-10 -14 -30 -4 -20 12 l20 18 l20 -18 c10 -16 -10 -26 -20 -12 Z', { fill: likes > 0 ? '#FF4D6D' : '#D8D0E8', stroke: '#151515', 'stroke-width': 3 }) + TF(String(likes), 690, 84, 24, '#7A6A9A');
  return S.g(g, `translate(${f(x + 300 * (1 - ease.out(clamp(k, 0, 1))))} ${f(y)}) scale(${f(ease.outBack(clamp(k, 0, 1)))})`, { opacity: f(clamp(k * 2, 0, 1)) });
}
function shTell(t) {
  let o = stageBg(t);
  o += R.checkpoint({ x: 470, y: 930, s: 0.42, t, state: 'saved', part: 'back' });
  const bob = Math.sin(t * 6);
  o += actor('you', t, { x: 470, y: 930, s: 0.42, turn: 0.4, armR: 120 + 20 * bob, armL: 20, face: { name: 'excited', eyes: { look: [0.8, -0.2] } } }, { arms: false });
  o += R.checkpoint({ x: 470, y: 930, s: 0.42, t, state: 'saved', part: 'front' });
  const step = Math.max(0.42, (CUT.one - CUT.tell - 0.2) / COMMENTS.length);
  COMMENTS.forEach((c, i) => {
    const t0 = CUT.tell + 0.15 + i * step;
    o += bubble(c, 980, 120 + i * 200, seg(t, t0, t0 + 0.3), t, Math.floor(clamp((t - t0) * 40, 0, 1) * (99 - i * 20)));
  });
  o += TS('COMMENT BELOW!', 470, 150, 76, '#FFE14D', { opacity: f(seg(t, CUT.tell, CUT.tell + 0.2)) });
  return o + whip(t, CUT.tell, 1);
}
// ---- 7. "And remember... one life. Make it count." — LIVES: 1, jump + block confetti
function shOne(t) {
  let o = stageBg(t);
  const jump = bump(t, tMake + 0.1, tCount + 0.35);
  o += R.checkpoint({ ...PAD, t, state: 'saved', part: 'back' });
  o += outroHero(t, { lift: 220 * jump, armL: lerp(14, 160, jump), armR: lerp(14, 160, jump), legL: 20 * jump, legR: 20 * jump, kneeL: 60 * jump, kneeR: 60 * jump, face: t > tMake ? { name: 'joy' } : { name: 'happy' }, ...boing(t, tCount + 0.35, 0.18) }, { arms: false });
  o += R.checkpoint({ ...PAD, t, state: 'saved', part: 'front' });
  o += R.counterHUD({ x: 960, y: 200, s: 1.6, anchor: 'center', t, label: 'LIVES:', value: 1, theme: 'white', icon: 'heart', k: seg(t, CUT.one, CUT.one + 0.25), bump: seg(t, tOne, tOne + 0.45) });
  o += TS('MAKE IT COUNT.', 960, 380, 110, '#FFE14D', { opacity: f(seg(t, tMake, tMake + 0.15)) });
  o += R.blockConfetti({ x: 960, y: 600, age: t - (tCount + 0.1), n: 70, spread: 1.3, power: 1.1, seed: 31 });
  return o + whip(t, CUT.one, -1);
}

// ================================================================= END SCREEN (≈ 10 s): left = cast, right = 2 video slots, subscribe circle
const SLOT = [{ x: 1200, y: 150, w: 620, h: 349, label: 'WATCH NEXT' }, { x: 1200, y: 590, w: 620, h: 349, label: 'MORE WHAT IFs' }];
const SUB = { x: 290, y: 320, r: 112 };
function slotSvg(sl, t, k, i) {
  if (k <= 0) return '';
  const pulse = 0.5 + 0.5 * Math.sin(t * 3 + i);
  let g = S.rect(-10, -10, sl.w + 20, sl.h + 20, 26, { fill: '#FFFFFF', opacity: f(0.08 + 0.05 * pulse) });
  g += S.rect(0, 0, sl.w, sl.h, 18, { fill: '#1A1040', opacity: 0.55, stroke: '#FFFFFF', 'stroke-width': 6, 'stroke-dasharray': '26 16', 'stroke-dashoffset': f(-t * 40) });
  g += S.path(`M${sl.w / 2 - 34} ${sl.h / 2 - 44} L${sl.w / 2 + 46} ${sl.h / 2} L${sl.w / 2 - 34} ${sl.h / 2 + 44} Z`, { fill: '#FFFFFF', opacity: 0.25 });
  g += TS(sl.label, sl.w / 2, -34, 52, '#FFE14D');
  return S.g(g, `translate(${f(sl.x + 60 * (1 - ease.out(k)))} ${f(sl.y)})`, { opacity: f(k) });
}
function shEnd(t) {
  const u = t - CUT.end;
  let o = stageBg(t);
  o += R.blockConfettiRain(t, { n: 24, seed: 5, speed: 0.5, s: 0.8 });
  // title strip
  o += TS('ONE LIFE. MAKE IT COUNT.', 70, 120, 58, '#FFFFFF', { opacity: f(seg(u, 0.3, 0.8)), 'text-anchor': 'start' });
  // subscribe circle (left clear for the end-screen element) + arrow
  const sk = ease.outBack(seg(u, 0.2, 0.6));
  if (sk > 0) {
    o += S.circle(SUB.x, SUB.y, SUB.r + 18 + 6 * Math.sin(t * 4), { fill: '#FFFFFF', opacity: 0.1 }) + S.circle(SUB.x, SUB.y, SUB.r * sk, { fill: '#1A1040', opacity: 0.5, stroke: '#FFFFFF', 'stroke-width': 6, 'stroke-dasharray': '22 14', 'stroke-dashoffset': f(t * 30) });
    const ax = SUB.x + 150 + 10 * Math.sin(t * 6);
    o += S.path(`M${f(ax)} ${SUB.y} l44 -28 v18 h70 v20 h-70 v18 Z`, { fill: '#FF5A5A', stroke: '#151515', 'stroke-width': 5, opacity: f(sk) }) + TS('SUBSCRIBE!', SUB.x + 290, SUB.y + 18, 54, '#FF5A5A', { opacity: f(sk), 'text-anchor': 'start' });
  }
  SLOT.forEach((sl, i) => { o += slotSvg(sl, t, seg(u, 0.35 + i * 0.15, 0.85 + i * 0.15), i); });
  // the cast on the left: the hero on his pad (waves every few seconds), Ivy writing in the Book of Fails, Gary's bowl
  const HP = { x: 560, y: 900, s: 0.42 };
  o += R.checkpoint({ ...HP, t, state: 'saved', part: 'back' });
  const wv = mod(u, 3.4) < 1.1 ? Math.sin(u * 10) : 0;
  const blinkLook = mod(u, 3.4) < 1.1;
  o += actor('you', t, { ...HP, turn: 0.2, armR: blinkLook ? 150 + 25 * wv : 18, armL: 14, ...AC.breathe(t), face: { name: blinkLook ? 'excited' : 'happy', eyes: { look: [0.1, 0] } }, ...boing(t, CUT.end + 0.1, 0.2) }, { arms: false });
  o += R.checkpoint({ ...HP, t, state: 'saved', part: 'front' });
  const write = Math.sin(t * 12);
  o += actor('ivy', t, { x: 820, y: 910, s: 0.4, turn: -0.3, book: 'open', headRot: 6 + 2 * write, ...AC.breathe(t, 1), face: { name: 'happy', eyes: { look: [0, 0.6] } } });
  // Gary's bowl on a stool, glowing eyes; the tiny Gary respawn gag
  const GB = { x: 170, y: 930, s: 0.42 };
  o += S.rect(GB.x - 120, GB.y, 240, 26, 8, ol('#8A5A3A', 5)) + S.path(`M${GB.x - 90} ${GB.y + 26} L${GB.x - 110} ${GB.y + 150} M${GB.x + 90} ${GB.y + 26} L${GB.x + 110} ${GB.y + 150}`, ln(14, '#6A4428'));
  const tg = CUT.end + 4.2;
  const gAge = t - tg;
  const garyGone = gAge > 0 && gAge < 1.1;
  const garyPos = [-40, -240];
  if (!garyGone) o += X.fishbowl({ x: GB.x, y: GB.y, s: GB.s, t, line: 7, gary: { yaw: lerp(30, -20, (Math.sin(t * 0.7) + 1) / 2), s: 0.62, glowEyes: 1, ...(gAge > 1.1 ? { look: [0.3, 0.3] } : {}), x: gAge > 1.1 ? 60 : garyPos[0] }, flagSvg: R.tinyFlag(0, 0, 2.4, t) });
  else {
    o += X.fishbowl({ x: GB.x, y: GB.y, s: GB.s, t, line: 7, gary: false, flagSvg: R.tinyFlag(0, 0, 2.4, t) });
    const cx = GB.x + garyPos[0] * GB.s, cy = GB.y + garyPos[1] * GB.s;
    o += R.crumble({ x: cx, y: cy + 60, s: 0.12, age: gAge, colors: ['#FF9F1C', '#FFB84D', '#F27A1A', '#FFFFFF'], seed: 4, floorY: GB.y - 30, spread: 0.5 });
  }
  if (gAge > 0.15 && gAge < 1.1) o += R.respawnOverlay(t, { t0: tg + 0.15, dur: 0.9, style: 'mini', x: GB.x, y: GB.y - 300, s: 0.6 });
  if (gAge > 1.1 && gAge < 2.2) o += R.respawnPop({ x: GB.x + 60 * GB.s - 20, y: GB.y - 30, s: 0.12, age: gAge - 1.1 });
  o += S.g(TF('GARY: ATTEMPT 1', 0, 0, 30, '#7CFFB2'), tf(GB.x, GB.y - 330, pop(t, tg + 1.15, 0.2)), { opacity: f(1 - seg(gAge, 2.6, 3)) });
  // a final hand-off: fade out in the last 0.4 s
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#000000', opacity: f(ease.in(seg(t, END - 0.5, END))) });
  return o + R.flash(0.6 * (1 - seg(t, CUT.end, CUT.end + 0.25)));
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.room, shRoom], [CUT.bowl, shBowl], [CUT.turn, shTurn], [CUT.outro, shOutro], [CUT.you, shYou], [CUT.tell, shTell], [CUT.one, shOne], [CUT.end, shEnd],
].sort((a, b) => a[0] - b[0]);
function shotAt(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return i;
}
function scene(t) { return SHOTS[shotAt(t)][1](t); }
function look(t) {
  if (t < CUT.bowl) return { grade: 'night', vignette: 0.9 };
  if (t < CUT.outro) return { grade: 'cool', vignette: 0.85 };
  return { grade: null, vignette: 0.5 };
}
function captionY(t) { return t >= CUT.tell && t < CUT.one ? 1030 : 1010; }

const DEFS = '<defs><linearGradient id="s12bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A2A8A"/><stop offset="0.6" stop-color="#6A3FC0"/><stop offset="1" stop-color="#2A1A5A"/></linearGradient></defs>';

module.exports = { DEFS, scene, look, captionY, CUT, beats: { tSaved, tTurn0, tTurn1, tGlow, tYou, tTell, tRem, tOne, tMake, tCount, START, END } };
