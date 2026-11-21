// SC 03 · СОЗДАНИЕ АВАТАРОВ — avatar creation (music `family` → `playful`). The evening living room turns into a "gaming
// setup" (devices pop in; the loadout cards: YOUR PC ★★★★★ vs Dad's 1998 laptop ★☆☆☆☆…), Dad hunts for the B key with one
// finger (POV keyboard, D… A… D…), the hero jabs at the glowing B, "DadBod1978" types into the avatar editor on the ancient
// laptop (split: the hero yelling | "1978" circled: AGE!), the PASSWORD sticky note → "password" → WEAK!, "Dad. NO.";
// the avatar shop: Dad's starter noob walks to the podium, the clicking spree (hat tower, wings, a tutu… 37 ITEMS IN CART,
// the HOT DOG SUIT) → POOF → the hot dog; split real Dad | hot dog "why am I a hot dog?", "I'm keeping it" + SAVED!;
// Mom slides her tablet away, the grey MOM_OFFICIAL ("Grey is classy" split: Mom sipping tea | the grey avatar sipping
// tea); Granny shouts at her phone (voice typing HELLO PHONE MAKE ME A GAME PERSON), jabs at a shop with no GO button,
// "Oh! I bought something", buys at random → the billionaire transformation; Rule number one, "Got it, champ!", the three
// PLAY buttons → pixel wipe into SC 04's spawn plaza.
'use strict';

const K = require('./kit');
const G = require('./gameui');
const R = require('./respawn');
const H = require('./sets_house');
const GS = require('./sets_game');
const X = require('../rig/extras');
const CAST = require('../rig/cast');
const E = require('./s03_env');
const AC = require('./acting');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, camAt, shakeCam, clipTo, boing, whip, smash, zoomLines, streaks, tint, panel, panelTag, splitBg, hand, hunt, LR, room, seat, mark } = E;

const A = Array.from({ length: 19 }, (_, i) => L('03.' + i));
const T0 = K.V.scene('SC 03').start, END = K.V.scene('SC 04').start;   // == main.js RANGES for SC 03
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const KB = H.SPOTS.keyboardClose;

// ---------------------------------------------------------------- cuts (all from the voice)
const CUT = {};
CUT.ext = T0;
CUT.setup = w(0, 'living') - 0.12;
CUT.kindof = w(0, 'Kind') - 0.1;
CUT.dad = A[1].a - 0.45;
CUT.keys = w(1, 'D') - 0.2;
CUT.heroB = A[2].a - 0.08;
CUT.keysB = w(2, 'RIGHT') - 0.1;
CUT.name = w(3, 'DadBod') - 0.3;
CUT.age = A[4].a - 0.12;
CUT.pass = A[5].a - 0.1;
CUT.pass2 = w(5, 'password', 1) - 0.12;
CUT.no = A[6].a - 0.1;
CUT.shop = A[7].a - 0.05;
CUT.click = w(7, 'And') - 0.12;
CUT.poof = A[8].a - 0.45;
CUT.why = w(8, 'why') - 0.08;
CUT.did = A[9].a - 0.05;
CUT.know = A[10].a - 0.12;
CUT.like = w(10, 'I') - 0.1;
CUT.mom = A[11].a - 0.4;
CUT.grey = A[12].a - 0.08;
CUT.grey2 = w(12, 'completely') - 0.12;
CUT.classy = A[13].a - 0.08;
CUT.gran = A[14].a - 0.15;
CUT.voice = w(14, 'MAKE') - 0.2;
CUT.which = A[15].a - 0.12;
CUT.oh = w(15, 'Oh') - 0.12;
CUT.spree = A[15].b + 0.05;
CUT.trans = w(16, 'buttons') - 0.1;
CUT.rule = A[17].a - 0.1;
CUT.rule2 = w(17, 'Do') - 0.15;
CUT.champ = A[18].a - 0.1;
CUT.play = A[18].b + 0.25;
{ const ks = Object.keys(CUT); for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2; }

// ---------------------------------------------------------------- beats inside shots
const B = {};
B.pc = w(0, 'turned'); B.laptop = w(0, 'into'); B.tablet = w(0, 'a'); B.phone = w(0, 'gaming'); B.setup = w(0, 'setup');
B.kind = w(0, 'Kind'); B.of = w(0, 'of');
B.glasses = A[1].a + 0.05;
B.pD1 = w(1, 'D') + 0.28; B.pA = w(1, 'A') + 0.28; B.pD2 = w(1, 'D', 1) + 0.3;
B.right = w(2, 'RIGHT'); B.there = w(2, 'there');
B.pB = A[3].a + 0.12;                                    // "Got it!" — the B
B.age = w(4, 'age');
B.note = w(5, 'password') + 0.15;                        // the sticky note
B.pw0 = w(5, 'password', 1); B.pw1 = w1(5, 'password', 1); B.weak = w1(5, 'password', 1) + 0.02;
B.no1 = A[6].a; B.no2 = w(6, 'NO');
B.shopOn = w(7, 'shop');
B.poof = CUT.poof + 0.18;
B.hot = w(8, 'hot');
B.like = w(10, 'like'); B.keep = w(10, 'keeping');
B.slide = w(11, "I'll"); B.sip = w(11, 'watch');
B.greyW = w(12, 'grey'); B.classy = w(13, 'classy'); B.sip2 = w(13, 'Grey');
B.hello = A[14].a; B.phoneW = w(14, 'PHONE');
B.goQ = w(15, 'go'); B.press1 = CUT.oh - 0.28;
B.reveal = w(16, 'billionaire');
B.rule = w(17, 'Rule'); B.not = w(17, 'NOT'); B.talk = w(17, 'talk');
B.champ = w(18, 'champ');
B.play = [CUT.play + 0.18, CUT.play + 0.42, CUT.play + 0.66];

// ---------------------------------------------------------------- the living room cast
const LAP = { x: LR.devices.laptop.x, y: 870, s: 0.46 };
const dadP = (extra = {}) => seat('dad', 1.1, { glasses: 'on', ...extra });
const momP = (extra = {}) => seat('mom', 1.04, extra);
const granP = (extra = {}) => seat('grandma', 0.9, { flip: true, turn: 0.2, ...extra });
const lapSvg = (o = {}) => X.laptopOld({ x: LAP.x, y: o.y ?? LAP.y, s: o.s ?? LAP.s, face: 'lid', rot: o.rot || 0 });
const GLOWS = (k = 1, who = ['dad', 'mom', 'grandma']) => H.deviceGlows(who, k);
// the whole family on their seats (culling by cam); o.dad / o.mom / o.gran / o.you = pose extras or false
function family(t, cam, o = {}) {
  let seated = '', devices = '';
  if (o.you && E.inView(cam, LR.seats.you.x, 1000, 0.5)) seated += actor('you', t, seat('you', 1, { view: 'back', ...(o.you || {}) }), { arms: false });
  if (o.dad !== false && E.inView(cam, 1000, 930, 0.55)) { seated += actor('dad', t, dadP(o.dad || {}), o.dadAct || {}); if (o.laptop !== false) devices += lapSvg(o.lap || {}); }
  if (o.mom !== false && E.inView(cam, 1340, 930, 0.55)) seated += actor('mom', t, momP(o.mom || { tablet: true }), o.momAct || {});
  if (o.gran !== false && E.inView(cam, 1752, 930, 0.5)) seated += actor('grandma', t, granP(o.gran || { phone: 'arm' }), o.granAct || {});
  return { seated, devices };
}
function livingShot(t, cam, o = {}) {
  const fam = family(t, cam, o);
  return room(t, cam, { set: { glow: o.glow ?? GLOWS(), ...(o.set || {}) }, seated: fam.seated + (o.seated || ''), devices: fam.devices + (o.devices || ''), standing: o.standing, over: o.over });
}
const heroStand = (t, x, y, extra = {}, act = {}) => actor('you', t, { x, y, s: 0.5, ...extra }, act);

// ---------------------------------------------------------------- the editor (Dad's laptop)
const NOOB_DAD = 3, NOOB_GRAN = 17;
const ED = { x: 960, y: 540, s: 1 };
// the clicking spree: [tab, id] in order; the first two clicks on "clicked…", the rest accelerate after "everything"
const SPREE = (() => {
  const seq = [['HATS', 'tophat'], ['HATS', 'cowboy'], ['HATS', 'crown'], ['HATS', 'propeller'], ['HATS', 'chef'], ['HATS', 'viking'],
    ['FACES', 'sunglasses'], ['FACES', 'mustache'], ['FACES', 'monocle'], ['EXTRAS', 'wings'], ['EXTRAS', 'cape'], ['EXTRAS', 'pearls'],
    ['EXTRAS', 'potlid'], ['COSTUMES', 'tutu'], ['COSTUMES', 'banana'], ['COSTUMES', 'shark'], ['COSTUMES', 'hotdog']];
  const t1 = w(7, 'clicked') + 0.05, t2 = w(7, 'everything'), tEnd = CUT.poof - 0.5;
  const out = [{ t: t1 }, { t: t1 + 0.48 }];
  for (let i = 2; i < seq.length; i++) out.push({ t: lerp(t2, tEnd, Math.pow((i - 2) / (seq.length - 3), 0.85)) });
  out.forEach((c, i) => { c.tab = seq[i][0]; c.id = seq[i][1]; c.cart = i === seq.length - 1 ? 37 : Math.round(1 + (35 * i) / (seq.length - 1)); });
  return out;
})();
const spreeIdx = (t) => { let i = -1; for (let j = 0; j < SPREE.length; j++) if (t >= SPREE[j].t) i = j; return i; };
const spreeItems = (t) => SPREE.filter((c) => t >= c.t).map((c) => ({ id: c.id, k: seg(t, c.t, c.t + 0.25) }));
const dadNoob = (t, items = [], pose = {}) => E.dressedNoob(NOOB_DAD, t, 0, 0, 0.55, items, { face: 'happy', ...pose });
// the editor as Dad sees it (username typing + password) — svg for the 1920x1080 frame
function editor(t, o = {}) {
  return G.avatarEditor({ ...ED, t, tab: o.tab || 'HATS', username: 'DadBod1978', typed: o.typed ?? 1, nameOk: o.nameOk, password: o.password, coins: o.coins ?? 1000,
    preview: o.preview ?? dadNoob(t), selected: o.selected, purchased: o.purchased, press: o.press, owned: o.owned, bought: o.bought, pointer: o.pointer, hover: o.hover });
}
const usernameN = (t) => {           // letters of 'DadBod1978' typed so far
  if (t < B.pD1) return 0; if (t < B.pA) return 1; if (t < B.pD2) return 2; if (t < B.pB) return 3;
  const ws = [[w(3, 'DadBod'), w1(3, 'DadBod'), 4, 6], [w(3, 'nineteen'), w1(3, 'nineteen'), 6, 8], [w(3, 'seventy-eight'), w1(3, 'seventy-eight') - 0.2, 8, 10]];
  let n = 4;
  for (const [a, b, n0, n1] of ws) if (t >= a) n = Math.round(lerp(n0, n1, seg(t, a, b)));
  return n;
};
// the laptop showing the editor (deviceFrame) zoomed by a world cam
function laptopEditor(t, cam, o = {}) {
  const fr = G.deviceFrame({ type: 'laptopOld', x: 960, y: 500, s: 1.62, screen: editor(t, o), t, glow: 0.4 });
  return S.rect(0, 0, 1920, 1080, 0, { fill: '#2A2236' }) + S.circle(960, 500, 900, { fill: '#3A2E52', opacity: 0.6 }) + view(cam, fr);
}
// editor point (1920x1080 editor coords) -> world point on the laptopEditor device (s 1.62, screen centre 960,500, 960x600 cover)
const edToDev = (x, y) => { const sc = 0.5556 * 1.62; return [960 + (x - 960) * sc, 500 + (y - 540) * sc]; };

// ---------------------------------------------------------------- shots
// 1. "That evening," — the house at dusk, push into the bay window
function shExt(t) {
  const u = seg(t, CUT.ext, CUT.setup);
  const cam = camKeys(t, [[CUT.ext, { zoom: 0.92, x: 0, y: -30 }], [CUT.setup, { zoom: 2.3, x: -214, y: 40 }]], ease.in);
  let o = H.houseExterior(t, cam, { time: 'evening', silhouettes: true });
  const win = H.toScreen(cam, { x: 736, y: 584 });
  o += K.sparkles([[win.x - 80, win.y - 60, 30 * bump(t, CUT.ext + 0.3, CUT.setup)], [win.x + 90, win.y - 20, 22 * bump(t, CUT.ext + 0.45, CUT.setup)]], t);
  o += panelTag(60, 60, '7:00 PM · GAME NIGHT', '#2A1640', '#FFE14D', 1.1);
  return o + K.C.whiteFlash(0.8 * (1 - seg(t, CUT.ext, CUT.ext + 0.18))) + whip(t, CUT.setup, 1, 0.1) + zoomLines(960, 540, seg(u, 0.6, 1) * 0.6, t);
}

// 2. "the living room turned into a gaming setup" — devices pop in on the words
function shSetup(t) {
  const cam = camKeys(t, [[CUT.setup, { zoom: 1.02, x: 30, y: 10 }], [CUT.kindof, { zoom: 1.1, x: 60, y: 0 }]]);
  const pc = seg(t, B.pc, B.pc + 0.3), lk = pop(t, B.laptop, 0.3), tb = t >= B.tablet, ph = t >= B.phone;
  const glowK = 0.3 + 0.7 * seg(t, B.pc, B.phone + 0.2) + 0.6 * bump(t, B.setup, B.setup + 0.6);
  const pcScreen = (sw, sh) => (pc > 0 ? S.rect(-sw / 2, -sh / 2, sw, sh, 0, { fill: '#7CCBFF' }) + S.rect(-sw / 2, 10, sw, sh / 2, 0, { fill: '#9BE06A' }) + G.cubeLogo(0, -20, 0.45) + S.rect(-sw / 2, -sh / 2, sw, sh, 0, { fill: '#FFFFFF', opacity: f(1 - pc) }) : S.rect(-sw / 2, -sh / 2, sw, sh, 0, { fill: '#0B0E18' }));
  const fam = family(t, cam, {
    you: { view: 'back', headRot: 4 * Math.sin(t * 3) },
    dad: { armL: 20 + 20 * bump(t, B.laptop, B.laptop + 0.5), armR: 20 + 20 * bump(t, B.laptop, B.laptop + 0.5), face: lk > 0.5 ? 'excited' : 'happy', ...boing(t, B.laptop, 0.12) },
    laptop: false,
    mom: tb ? { tablet: true, face: 'happy', ...boing(t, B.tablet, 0.12) } : { face: 'neutral', mug: true },
    gran: ph ? { phone: 'arm', face: 'amazed', ...boing(t, B.phone, 0.12) } : { knitting: true, face: 'happy', flip: false, turn: -0.25 },
  });
  let dev = lk > 0 ? lapSvg({ s: LAP.s * lk }) : '';
  let over = '';
  const bursts = [[B.laptop, 1000, 720], [B.tablet, 1340, 700], [B.phone, 1620, 560], [B.pc, 598, 380]];
  for (const [tb0, x, y] of bursts) over += K.C.burst(x, y, seg(t, tb0, tb0 + 0.45), '#FFE14D');
  const lbl = (txt, x, y, t0, col) => { const k = pop(t, t0, 0.3) * (1 - seg(t, CUT.kindof - 0.25, CUT.kindof)); return k > 0 ? S.g(panelTag(-txt.length * 9.5 - 20, -25, txt, col, '#FFFFFF', 1), tf(x, y, k)) : ''; };
  over += lbl('GAMING PC', 598, 220, B.pc, '#7A3CFF') + lbl('LAPTOP', 1000, 345, B.laptop, '#FF8A2B') + lbl('TABLET', 1340, 335, B.tablet, '#17C3B2') + lbl('PHONE', 1700, 380, B.phone, '#FF5FA8');
  let o = room(t, cam, { set: { glow: GLOWS(glowK, ['dad', 'mom', 'grandma', 'you']), pcScreen, lamp: 1 }, seated: fam.seated, devices: fam.devices + dev, over });
  const tk = seg(t, B.setup, B.setup + 0.5);
  if (tk > 0) o += G.bigTitle({ text: 'GAMING SETUP', k: tk, t, theme: 'gold', x: 960, y: 150, size: 110 }) + K.sparkles([[420, 140, 30 * tk], [1500, 120, 26 * tk], [1380, 230, 18 * tk]], t);
  return o + whip(t, CUT.setup, 1, 0.1);
}

// 3. "Kind of." — the loadout cards: YOUR PC ★★★★★ … and the rest
function shKindOf(t) {
  const sc = 1 + 0.04 * seg(t, CUT.kindof, CUT.dad);
  let o = splitBg('#1E1430', '#2E1E4A');
  o += K.rays(960, 1200, 18, 1500, '#FFFFFF', 0.03, t * 6);
  o += TS('THE GAMING SETUP', 960, 120, 72, '#FFE14D', { 'stroke-width': 11 });
  o += S.g(TS('(kind of)', 0, 0, 46, '#C9B8FF', { 'stroke-width': 8 }), tf(1340, 168, pop(t, B.of, 0.3), -6));
  const cards = [
    { who: 'YOU', title: 'GAMING PC', stars: 5, stats: ['SPEED 5/5', 'RGB: YES!!'], col: '#FF8A2B', art: X.gamingPC({ x: -10, y: 105, s: 0.32, t }), t0: CUT.kindof + 0.02 },
    { who: 'DAD', title: 'DELL-O LAPTOP', stars: 1, stats: ['SPEED 1/5', 'MADE IN 1998'], col: '#F2B705', art: X.laptopOld({ x: 0, y: 92, s: 0.44 }), t0: B.kind + 0.12, loading: true },
    { who: 'MOM', title: 'LIBRARY TABLET', stars: 2, stats: ['SPEED 2/5', 'RETURN BY FRIDAY'], col: '#FF5FA8', art: X.tablet({ x: 0, y: -10, s: 0.5, face: 'back', landscape: true }), t0: B.of },
    { who: 'GRANNY', title: 'GRANNY PHONE', stars: 1, stats: ['FONT SIZE: XXL', 'BEEPS A LOT'], col: '#B57BFF', art: X.phone({ x: 0, y: -14, s: 0.6, face: 'back' }), t0: B.of + 0.22 },
  ];
  let c = '';
  cards.forEach((cd, i) => {
    const k = seg(t, cd.t0, cd.t0 + 0.32);
    const droop = i > 0 ? 3 * Math.sin(t * 2 + i) + (i === 1 ? 6 * seg(t, B.of + 0.6, B.of + 1.2) : 0) : 0;
    c += E.loadoutCard({ ...cd, x: 285 + i * 450, y: 600, k, t, s: 1.06 * (i === 0 ? 1 + 0.03 * Math.sin(t * 5) : 1), rot: droop });
    if (i > 0 && k > 0.9) c += K.C.sfx('meh', 285 + i * 450 + 130, 320, seg(t, cd.t0 + 0.3, cd.t0 + 0.6), 40, 10, '#C9C4D8');
  });
  o += S.g(c, `translate(960 590) scale(${f(sc)}) translate(-960 -590)`);
  if (t > CUT.dad - 0.9) o += S.g(TFS('LOADING... 3%', 0, 0, 30, '#FFFFFF'), tf(740, 960, pop(t, CUT.dad - 0.9, 0.3)));
  return o + smash(t, CUT.kindof, 0.12, 0.6);
}

// 4. "Okay. Username." — Dad pulls his glasses down and leans into the screen
function shDad(t) {
  const lean = ease.inOut(seg(t, w(1, 'Username') - 0.2, CUT.keys - 0.3));
  const cam = camKeys(t, [[CUT.dad, camAt(1000, 548, 1.9)], [CUT.keys, camAt(1000, 575, 2.35)]]);
  const g = bump(t, B.glasses - 0.15, B.glasses + 0.35);
  const glasses = t < B.glasses + 0.1 ? 'up' : 'on';
  const face = t < B.glasses + 0.1 ? 'neutral' : { name: 'confused', eyes: { upper: 0.45 * lean + 0.1 } };
  const dad = { glasses, armR: 20 + 140 * g, armL: 18, headY: 26 * lean, bodyY: 10 * lean, face };
  let over = G.screenGlow(1000, 520 + 26 * lean, 300, 260, 'blue', 0.4 + 0.6 * lean, { flicker: true, t });
  if (lean > 0.3) over += mark('?', 1150, 400, seg(t, CUT.keys - 0.9, CUT.keys - 0.6), 70, 10, '#FFFFFF');
  return livingShot(t, cam, { dad, dadAct: { arms: false }, lap: { y: LAP.y - 12 * lean }, over, mom: { tablet: true, face: 'neutral' } });
}

// keyboard POV: o.presses = [{t, key}], o.hunt = [cx, cy], the field text/typed, extra hands
function fingerAt(t, presses, centre, r = 90) {
  let [x, y] = hunt(t, centre[0], centre[1], r);
  let pr = 0;
  for (const p of presses) {
    const kp = KB.keys[p.key];
    const wgt = ease.inOut(seg(t, p.t - 0.42, p.t - 0.06)) * (1 - ease.inOut(seg(t, p.t + 0.2, p.t + 0.55)));
    if (wgt > 0) { x = lerp(x, kp.x, wgt); y = lerp(y, kp.y - 6, wgt); }
    pr = Math.max(pr, bump(t, p.t - 0.05, p.t + 0.16));
  }
  return { x, y, pr };
}
function keyboardShot(t, cam, o = {}) {
  const Ly = H.keyboardClose.layers(t, { screen: o.screen, highlight: o.highlight, press: o.pressKeys, caps: o.caps });
  let s = view(cam, Ly.bg + Ly.mid + Ly.front);
  if (o.hands) s += view(cam, o.hands);
  s += view(cam, Ly.light);
  if (o.over) s += view(cam, o.over);
  return s;
}

// 5. "D… A… D… Where's the B?"
function shKeys(t) {
  const cam = camKeys(t, [[CUT.keys, { zoom: 1.08, x: -70, y: -30 }], [A[1].b - 1.0, { zoom: 1.14, x: -40, y: -10 }], [CUT.heroB, { zoom: 1.26, x: -40, y: 40 }]]);
  const presses = [{ t: B.pD1, key: 'D' }, { t: B.pA, key: 'A' }, { t: B.pD2, key: 'D' }];
  const lost = seg(t, w(1, 'Where\'s') - 0.3, A[1].b);
  const centre = [lerp(560, 900, lost), lerp(470, 560, lost)];
  const fp = fingerAt(t, presses, centre, 70 + 140 * lost);
  const cur = presses.filter((p) => t >= p.t - 0.05 && t < p.t + 0.2).map((p) => ({ key: p.key, k: bump(t, p.t - 0.05, p.t + 0.2) }));
  const n = usernameN(t);
  const screen = E.nameScreen({ t, text: 'DadBod1978', typed: n / 10, fy: 110 });
  const hands = hand({ x: fp.x, y: fp.y, ax: 1560, ay: 1300, s: 1.1, press: fp.pr, kind: 'dad', ring: true });
  let over = '';
  for (const p of presses) { const k = seg(t, p.t, p.t + 0.5); if (k > 0 && k < 1) over += S.g(TS(p.key, 0, 0, 120, '#FFE45C', { 'stroke-width': 14 }), tf(KB.keys[p.key].x, KB.keys[p.key].y - 140 - 80 * k, 0.6 + 0.6 * ease.out(k)), { opacity: f(1 - k) }); }
  if (lost > 0.2) over += mark('?', fp.x + 120, fp.y - 120, seg(t, w(1, 'Where\'s'), w(1, 'Where\'s') + 0.3), 90, 12, '#FFFFFF') + mark('?', fp.x - 140, fp.y - 60, seg(t, w(1, 'B'), w(1, 'B') + 0.3), 70, -14, '#FFFFFF');
  return keyboardShot(t, cam, { screen, pressKeys: cur, hands, over });
}

// 6. "Dad, it's…" — the hero leans in by the couch, pointing
function shHeroB(t) {
  const cam = camKeys(t, [[CUT.heroB, camAt(880, 600, 1.75)], [CUT.keysB, camAt(900, 610, 1.9)]]);
  const hero = heroStand(t, 745, 1004, { turn: 0.55, armR: 105 + 10 * Math.sin(t * 14), armL: 12, lean: 4, face: 'angry' }, { arms: false });
  return livingShot(t, cam, { dad: { face: { name: 'confused', eyes: { upper: 0.4 } }, headY: 20, bodyY: 8 }, standing: hero, mom: { tablet: true, face: 'neutral' } }) + whip(t, CUT.heroB, -1, 0.08);
}

// 7. "RIGHT there!" + "Got it!" — the B glows, the hero's finger jabs at it, Dad's finger slams it
function shKeysB(t) {
  const b = KB.keys.B;
  const cam = shakeCam(camKeys(t, [[CUT.keysB, camAt(b.x + 30, b.y - 40, 1.8)], [CUT.name, camAt(b.x + 30, b.y - 70, 1.62)]], ease.out), t, [[B.pB, 0.3, 14]]);
  const jab = Math.max(bump(t, B.right - 0.02, B.right + 0.22), bump(t, B.there - 0.02, B.there + 0.25), bump(t, B.there + 0.3, B.there + 0.5));
  const heroIn = ease.out(seg(t, CUT.keysB, CUT.keysB + 0.2)) * (1 - ease.in(seg(t, B.pB - 0.35, B.pB - 0.1)));
  let hands = '';
  if (heroIn > 0) hands += hand({ x: lerp(b.x - 520, b.x - 52, heroIn) - 26 * (1 - jab), y: lerp(b.y + 120, b.y + 14, heroIn) + 10 * (1 - jab), ax: b.x - 1100, ay: b.y + 330, s: 1.05, press: jab * 0.6, kind: 'you' });
  const dadIn = ease.inOut(seg(t, B.pB - 0.4, B.pB - 0.04));
  const [hx, hy] = hunt(t, b.x + 160, b.y - 150, 60);
  hands += hand({ x: lerp(hx, b.x, dadIn), y: lerp(hy, b.y - 4, dadIn), ax: 1600, ay: 1300, s: 1.1, press: bump(t, B.pB - 0.04, B.pB + 0.2), kind: 'dad', ring: true });
  const screen = E.nameScreen({ t, text: 'DadBod1978', typed: usernameN(t) / 10, fy: 110 });
  let over = S.g(zoomLines(0, 0, 0.6 * bump(t, CUT.keysB, CUT.keysB + 0.5), t, '#FFE45C', 20, 180), tf(b.x, b.y));
  const gk = seg(t, B.pB, B.pB + 0.5);
  if (gk > 0 && gk < 1) over += S.circle(b.x, b.y, 60 + 200 * gk, { fill: 'none', stroke: '#FFE45C', 'stroke-width': f(16 * (1 - gk)) });
  over += S.g(TS('GOT IT!', 0, 0, 90, '#7DFF8E', { 'stroke-width': 12 }), tf(b.x + 220, b.y - 200, pop(t, B.pB, 0.25) * (1 - seg(t, CUT.name - 0.2, CUT.name)), -8));
  return keyboardShot(t, cam, { screen, highlight: t >= B.right - 0.05 ? 'B' : null, pressKeys: [{ key: 'B', k: bump(t, B.pB - 0.04, B.pB + 0.2) }], hands, over }) + smash(t, CUT.keysB, 0.12, 0.7);
}

// 8. "DadBod nineteen seventy-eight." — the editor on the ancient laptop; the name types with the voice
function shName(t) {
  const [fx, fy] = edToDev(420, 820);
  const cam = camKeys(t, [[CUT.name, { zoom: 1.0, x: 0, y: 0 }], [CUT.age, { zoom: 1.55, x: (fx - 960) * 0.9, y: (fy - 540) * 0.75 }]], ease.inOut);
  const n = usernameN(t);
  let o = laptopEditor(t, cam, { typed: n / 10, tab: 'HATS' });
  // PiP: Dad, very proud
  const pk = pop(t, w(3, 'nineteen') - 0.2, 0.3) * (1 - seg(t, CUT.age - 0.25, CUT.age));
  if (pk > 0) {
    const pip = S.rect(0, 0, 1920, 1080, 0, { fill: '#E2CFAE' }) + actor('dad', t, { x: 960, y: 1480, s: 1.15, glasses: 'on', face: 'smug', volume: false, armL: 10, armR: 10 });
    o += S.g(E.panel(1500, 650, 340, 340, pip, { r: 170, zoom: 2.3, dy: -40 }) + panelTag(1530, 940, 'SO PROUD', '#F2B705', '#2A1640', 0.9), `translate(1670 820) scale(${f(pk)}) translate(-1670 -820)`);
  }
  return o + whip(t, CUT.name, 1, 0.08);
}

// 9. "Why would you tell everyone your age?!" — split: the hero | "1978" circled
function shAge(t) {
  const cam = camAt(800, 660, 1.75);
  const heroP = { turn: 0.25, armL: 160 + 6 * Math.sin(t * 9), armR: 160 + 6 * Math.sin(t * 9 + 1), face: 'angry', ...boing(t, B.age, 0.1) };
  const left = livingShot(t, cam, { standing: heroStand(t, 780, 1004, heroP, { arms: false }), dad: { face: 'happy' }, mom: { tablet: true, face: 'neutral' } });
  // right: the name field, giant
  let r = S.rect(0, 0, 1920, 1080, 0, { fill: '#FFF7EC' }) + S.rect(0, 0, 1920, 180, 0, { fill: '#2BC2B4' });
  r += S.rect(560, 420, 1240, 220, 50, ol('#FFFFFF', 12)) + S.rect(580, 440, 280, 180, 38, { fill: '#2BC2B4' }) + TF('NAME', 720, 555, 64, '#FFFFFF');
  const dbw = G.textW('DadBod', 120, 'F'), x78 = 900 + dbw + 8, w78 = G.textW('1978', 120, 'F'), c78 = x78 + w78 / 2;
  r += TF('DadBod', 900, 568, 120, '#1C2333', { 'text-anchor': 'start' }) + TF('1978', x78, 568, 120, '#E8453C', { 'text-anchor': 'start' });
  const ck = ease.out(seg(t, w(4, 'everyone'), B.age + 0.1));
  const per = 1200;
  r += S.ellipse(c78 + 6, 528, w78 / 2 + 30, 100, { fill: 'none', stroke: '#FF2E4E', 'stroke-width': 16, 'stroke-dasharray': `${f(per * ck)} ${per}`, transform: `rotate(-8 ${f(c78)} 528)`, 'stroke-linecap': 'round' });
  const ak = pop(t, B.age, 0.3);
  if (ak > 0) r += S.g(S.path('M0 0 L-80 -160', ln(16, '#FF2E4E')) + S.path('M-80 -160 l-6 46 M-80 -160 l40 22', ln(16, '#FF2E4E')) + TS('AGE: 48', -120, -190, 96, '#FF2E4E', { 'stroke-width': 0, stroke: 'none' }), tf(c78 - 40, 410, ak, 0));
  let o = splitBg();
  o += panel(0, 0, 960, 1080, left, { border: 8 }) + panel(960, 0, 960, 1080, r, { border: 8, dx: 220, dy: -30, zoom: 0.74 });
  return o + smash(t, CUT.age, 0.1, 0.5);
}

// 10. "And for the password…" — the sticky note on the bezel already says it
function shPass(t) {
  const cam = camKeys(t, [[CUT.pass, { zoom: 1.12, x: -60, y: 10 }], [B.note - 0.1, { zoom: 1.12, x: -60, y: 10 }], [B.note + 0.45, camAt(300, 370, 2.6)], [CUT.pass2, camAt(300, 372, 2.75)]]);
  const screen = E.nameScreen({ t, text: 'DadBod1978', typed: 1, fy: 110, ok: 1 });
  const [hx, hy] = hunt(t, 820, 520, 50);
  const to = ease.inOut(seg(t, B.note, B.note + 0.4));
  let hands = hand({ x: lerp(hx, 360, to), y: lerp(hy, 410, to), ax: 1500, ay: 1300, s: 1.1, press: bump(t, B.note + 0.45, B.note + 0.65), kind: 'dad' });
  let over = '';
  const nk = seg(t, B.note + 0.4, B.note + 0.9);
  if (nk > 0) over += K.sparkles([[200, 300, 26 * bump(nk, 0, 1)], [400, 290, 20 * bump(nk, 0.2, 1)]], t) + S.g(TS('!!', 0, 0, 70, '#FF4B5C'), tf(400, 270, pop(t, B.note + 0.5, 0.25), 12));
  return keyboardShot(t, cam, { screen, hands, over });
}

// 11. "password." — dots type with the word, WEAK!
function shPass2(t) {
  const [fx, fy] = edToDev(420, 905);
  const cam = shakeCam(camKeys(t, [[CUT.pass2, { zoom: 1.75, x: (fx - 960) * 0.97, y: (fy - 540) * 0.85 }], [CUT.no, { zoom: 1.9, x: (fx - 960) * 0.97, y: (fy - 540) * 0.88 }]]), t, [[B.weak, 0.35, 16]]);
  const typed = seg(t, B.pw0, B.pw1 - 0.05), warn = seg(t, B.weak, B.weak + 0.3);
  let o = laptopEditor(t, cam, { typed: 1, tab: 'HATS', password: { text: 'password', typed, warn } });
  o += tint('#FF2E4E', 0.25 * bump(t, B.weak, B.weak + 0.4));
  return o + whip(t, CUT.pass2, 1, 0.08);
}

// 12. "Dad. NO." — facepalm, then the smash
function shNo(t) {
  const smashed = t >= B.no2 - 0.04;
  const cam = shakeCam(smashed ? camAt(760, 580, 3.1) : camKeys(t, [[CUT.no, camAt(760, 640, 2.2)], [B.no2, camAt(760, 620, 2.45)]]), t, [[B.no2, 0.4, 18]]);
  const hero = heroStand(t, 760, 1004, smashed ? { armL: 40, armR: 40, face: 'angry', turn: 0, lean: 0 } : { armR: 168, headRot: 9, face: 'deadpan', turn: 0.1 }, { arms: false });
  let o = livingShot(t, cam, { standing: hero });
  if (smashed) o += tint('#FF2E4E', 0.18) + zoomLines(960, 420, 0.8, t, '#FFFFFF', 24, 420) + K.C.sfx('NO.', 1420, 330, seg(t, B.no2, B.no2 + 0.25), 170, -8, '#FF4B5C');
  return o + smash(t, B.no2 - 0.04, 0.12, 0.8);
}

// 13. "Then Dad went to the avatar shop." — the starter noob walks to the podium
function shShop(t) {
  const sp = GS.SPOTS.avatarShop;
  const u = seg(t, CUT.shop, B.shopOn);
  const cam = camKeys(t, [[CUT.shop, { x: -120, y: 30, zoom: 1.12 }], [B.shopOn, { x: 0, y: 80, zoom: 1.3 }], [CUT.click, { x: 0, y: 100, zoom: 1.4 }]]);
  const x = lerp(260, sp.podium.x, ease.out(u));
  const walking = u < 1;
  const noob = K.draw.noob(NOOB_DAD, { x, y: sp.podium.y, s: 0.62, nametag: 'DadBod1978', view: walking ? 'side' : 'front', flip: walking, ...(walking ? AC.walk(t * 9) : {}), face: walking ? 'happy' : { name: 'amazed', mouth: 'O' }, ...boing(t, B.shopOn, 0.15) });
  const spot = seg(t, B.shopOn - 0.1, B.shopOn + 0.2);
  let o = GS.avatarShop.compose(t, { spot }, '', noob, cam);
  o += K.sparkles([[760, 300, 34 * bump(t, B.shopOn, B.shopOn + 0.6)], [1180, 260, 28 * bump(t, B.shopOn + 0.1, B.shopOn + 0.7)]], t);
  return o + whip(t, CUT.shop, 1, 0.1);
}

// 14. "And he clicked… everything." + the 2 s beat — the spree
function shClick(t) {
  const i = spreeIdx(t), cur = i >= 0 ? SPREE[i] : null, nxt = SPREE[Math.min(SPREE.length - 1, i + 1)];
  // tab: the next click's tab once the pointer heads for it
  const prevT = cur ? cur.t : CUT.click, mid = lerp(prevT, nxt.t, 0.35);
  const tab = !cur || t >= mid ? nxt.tab : cur.tab;
  const owned = SPREE.filter((c, j) => j < i).map((c) => c.id);
  const sel = cur && cur.tab === tab ? cur.id : undefined;
  const opts = { ...ED, tab };
  // pointer
  const from = cur ? G.editorCard({ ...ED, tab: cur.tab }, cur.id) : { bx: 1300, by: 700 };
  const to = G.editorCard({ ...ED, tab: nxt.tab }, nxt.id);
  const mv = ease.inOut(seg(t, prevT + 0.04, lerp(prevT, nxt.t, 0.8)));
  const done = i === SPREE.length - 1;
  const px = done ? from.bx : lerp(from.bx, to.bx, mv), py = done ? from.by : lerp(from.by, to.by, mv);
  const press = Math.max(...SPREE.map((c) => bump(t, c.t - 0.03, c.t + 0.12)));
  const coins = Math.max(0, Math.round(1000 * (1 - (i + 1) / SPREE.length)));
  const last = SPREE[SPREE.length - 1];
  const cam = shakeCam(camKeys(t, [[CUT.click, { zoom: 1.0, x: 0, y: 0 }], [last.t - 0.2, { zoom: 1.08, x: 40, y: 20 }], [last.t + 0.05, { zoom: 1.32, x: 220, y: -70 }], [CUT.poof, { zoom: 1.38, x: 230, y: -70 }]]), t,
    SPREE.map((c) => [c.t, 0.16, c.id === 'hotdog' ? 18 : 6]));
  const ed = G.avatarEditor({ ...opts, t, username: 'DadBod1978', typed: 1, coins, preview: dadNoob(t, spreeItems(t), { face: i > 8 ? 'excited' : 'happy' }), selected: sel, purchased: cur ? seg(t, cur.t, cur.t + 0.3) : 0, press: bump(t, (cur || { t: -9 }).t - 0.03, (cur || { t: -9 }).t + 0.12), owned, bought: cur ? cur.cart : 0, pointer: { x: px, y: py, press } });
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#2A2236' }) + view(cam, ed);
  // "CLICK!" marks
  for (const c of SPREE) { const k = seg(t, c.t, c.t + 0.35); if (k > 0 && k < 1) { const p = E.toScr(cam, G.editorCard({ ...ED, tab: c.tab }, c.id).bx, G.editorCard({ ...ED, tab: c.tab }, c.id).by); o += S.g(TS('CLICK!', 0, 0, 46, '#FFFFFF'), tf(p.x + 60, p.y - 60 - 40 * k, 0.8 + 0.4 * ease.outBack(k), -10 + 20 * hash(c.t)), { opacity: f(1 - k) }); } }
  // PiP: the real Dad, clicking like mad
  const pk = pop(t, w(7, 'everything') + 0.1, 0.3) * (1 - seg(t, last.t - 0.15, last.t));
  if (pk > 0) {
    const bob = Math.abs(Math.sin(t * 22));
    const pip = S.rect(0, 0, 1920, 1080, 0, { fill: '#3A5A86' }) + G.screenGlow(960, 520, 900, 700, 'blue', 0.6) + actor('dad', t, { x: 960, y: 1500 + 20 * bob, s: 1.15, glasses: 'on', face: { name: 'excited', mouth: 'bigGrin', eyes: { type: 'star' } }, volume: false, armL: 30 + 20 * bob, armR: 30 + 20 * Math.abs(Math.sin(t * 22 + 1)) });
    o += S.g(panel(1530, 700, 330, 330, pip, { r: 165, zoom: 2.3, dy: -30 }) + panelTag(1560, 990, 'CLICK CLICK', '#F2B705', '#2A1640', 0.85), `translate(1695 865) scale(${f(pk)}) translate(-1695 -865)`);
  }
  // the hot dog: big stamp
  if (t >= last.t) { const k = seg(t, last.t, last.t + 0.3); o += zoomLines(1300, 420, 0.7 * k, t, '#FFE45C', 22, 260); }
  return o + smash(t, last.t, 0.1, 0.6);
}

// 15. POOF — the hot dog; "Son…"
function shPoof(t) {
  const sp = GS.SPOTS.avatarShop.podium;
  const cam = shakeCam(camKeys(t, [[CUT.poof, { x: 0, y: 60, zoom: 1.55 }], [B.poof + 0.1, { x: 0, y: 70, zoom: 1.4 }], [CUT.why, { x: 0, y: 40, zoom: 1.5 }]], ease.out), t, [[B.poof, 0.35, 16]]);
  const age = t - B.poof - 0.08;
  let ch = '';
  if (age < 0.05) ch += E.dressedNoob(NOOB_DAD, t, sp.x, sp.y, 0.62, SPREE.map((c) => ({ id: c.id, k: 1 })), { face: { name: 'excited', mouth: 'bigGrin' }, ...boing(t, B.poof - 0.25, 0.2) });
  else {
    const pp = R.popPose(age, 0.42);
    const look = seg(t, A[8].a, A[8].a + 0.4);
    if (!pp.hidden) ch += actor('dadAvatar', t, { x: sp.x, y: sp.y, s: 0.42, nametag: false, sx: pp.sx, sy: pp.sy, lift: pp.lift, armL: 20 + 50 * look, armR: 20 + 50 * look, headRot: -8 * look, face: { name: look > 0.5 ? 'confused' : 'amazed', mouth: look > 0.5 ? 'uh' : 'O' } });
  }
  let o = GS.avatarShop.compose(t, { spot: 1 }, '', ch, cam);
  o += view(cam, E.poof(sp.x, sp.y - 230, age + 0.06, 1.3) + (age > 0 ? E.sparkleRing(sp.x, sp.y - 260, t, seg(age, 0, 0.3) * (1 - seg(age, 0.8, 1.2)), 260) : ''));
  if (age > 0.6) o += mark('?', 1180, 300, seg(age, 0.9, 1.15), 110, 12, '#FFFFFF');
  return o + smash(t, B.poof, 0.15, 0.85);
}

// 16. "why am I a hot dog?" — split: the real Dad | the hot dog, same head tilt
function shWhy(t) {
  const tilt = -10 * ease.inOut(seg(t, CUT.why, CUT.why + 0.4));
  const left = livingShot(t, camAt(1000, 560, 2.1), { dad: { face: { name: 'confused' }, headRot: tilt, armL: 14, armR: 14 }, dadAct: { arms: false } });
  const sp = GS.SPOTS.avatarShop.podium;
  const zk = ease.outBack(seg(t, B.hot, B.hot + 0.3));
  const right = GS.avatarShop.compose(t, { spot: 1 }, '', actor('dadAvatar', t, { x: sp.x, y: sp.y, s: 0.42, nametag: false, headRot: tilt, armL: 40, armR: 40, face: { name: 'confused', mouth: 'uh' } }), { x: 0, y: 40 - 60 * zk, zoom: 1.45 + 0.35 * zk });
  let o = splitBg('#2A1640', '#FF8A2B') + panel(0, 0, 960, 1080, left, { border: 8 }) + panel(960, 0, 960, 1080, right, { border: 8 });
  o += panelTag(30, 30, 'REAL DAD', '#151A26', '#FFFFFF') + panelTag(990, 30, 'DadBod1978', '#F2B705', '#2A1640');
  o += S.g(TS('HOT DOG?!', 0, 0, 110, '#FFD21F', { 'stroke-width': 14 }), tf(1440, 880, pop(t, B.hot, 0.25), -6));
  return o + whip(t, CUT.why, 1, 0.08);
}

// 17. "I don't know, Dad. You did that." — deadpan
function shDid(t) {
  const cam = camKeys(t, [[CUT.did, camAt(740, 640, 2.1)], [CUT.know, camAt(740, 610, 2.45)]]);
  const point = seg(t, w(9, 'You') - 0.1, w(9, 'You') + 0.15);
  const hero = heroStand(t, 740, 1004, { turn: 0.15, armR: 12 + 78 * point, armL: 10, face: { name: 'deadpan', eyes: { upper: 0.5 } } }, { arms: false });
  return livingShot(t, cam, { standing: hero, dad: { face: { name: 'confused' } } });
}

// 18. "You know what?" — Dad thinks it over
function shKnow(t) {
  const cam = camKeys(t, [[CUT.know, camAt(1000, 540, 2.3)], [CUT.like, camAt(1000, 530, 2.5)]]);
  const dad = { armR: 140 + 6 * Math.sin(t * 6), armL: 16, headRot: -6, face: { name: 'confused', eyes: { look: [0.4, -0.6] } } };
  return livingShot(t, cam, { dad, dadAct: { arms: false } });
}

// 19. "I like it. I'm keeping it." — the hot dog poses, SAVED!
function shLike(t) {
  const sp = GS.SPOTS.avatarShop.podium;
  const cam = shakeCam(camKeys(t, [[CUT.like, { x: 0, y: 70, zoom: 1.45 }], [B.keep, { x: 0, y: 50, zoom: 1.6 }], [CUT.mom, { x: 0, y: 40, zoom: 1.5 }]]), t, [[B.keep + 0.15, 0.3, 12]]);
  const k1 = seg(t, B.like - 0.1, B.like + 0.2), dance = t > B.keep ? Math.sin((t - B.keep) * 10) : 0;
  const hd = actor('dadAvatar', t, { x: sp.x, y: sp.y, s: 0.42, nametag: false, armL: 20 + 140 * k1 + 20 * dance, armR: 20 + 140 * k1 - 20 * dance, lean: 4 * dance, face: { name: 'joy', mouth: 'bigGrin' }, ...boing(t, B.like, 0.15) });
  let o = GS.avatarShop.compose(t, { spot: 1 }, '', hd, cam);
  o += view(cam, E.sparkleRing(sp.x, sp.y - 260, t, k1, 300, 8) + (t > B.keep ? G.danceNotes({ x: sp.x + 200, y: sp.y - 520, t, k: seg(t, B.keep, B.keep + 0.3), s: 0.9 }) : ''));
  const tg = G.nametag({ who: 'dad', x: 960, y: 170, s: 1.4, k: seg(t, B.keep, B.keep + 0.3), t });
  o += tg + G.stamp({ text: 'SAVED!', k: seg(t, B.keep + 0.05, B.keep + 0.55), x: 1450, y: 640, s: 0.9, rot: -12, col: '#1E9E52' });
  return o + whip(t, CUT.like, 1, 0.08);
}

// 20. Mom: "I'm not really a gamer, sweetie. I'll just watch." — she slides the tablet onto the coffee table
function momTabletScreen(t) {
  return (sw, sh) => S.rect(-sw / 2, -sh / 2, sw, sh, 0, { fill: '#2BC2B4' }) + S.ellipse(0, sh * 0.32, sw * 0.32, sh * 0.07, { fill: '#7FE3D6', stroke: LINE, 'stroke-width': 4 }) + actor('momAvatar', t, { x: 0, y: sh * 0.32, s: 0.2, nametag: false, face: { name: 'happy', mouth: 'smile' } });
}
const LINE = '#151515';
function shMom(t) {
  const cam = camKeys(t, [[CUT.mom, camAt(1310, 610, 1.85)], [CUT.grey, camAt(1290, 640, 1.95)]]);
  const sl = ease.inOut(seg(t, B.slide - 0.05, B.slide + 0.55));
  const holding = sl <= 0;
  const sip = seg(t, B.sip, B.sip + 0.3);
  const mom = holding ? { tablet: true, face: 'happy' } : { mug: sip > 0, mugUp: sip > 0.5, armL: 14, armR: sip > 0 ? undefined : 20 + 20 * (1 - sl), face: { name: 'happy', eyes: sip > 0.5 ? { type: 'happy' } : undefined } };
  let dev = '';
  if (!holding) {
    const tx = lerp(1340, 1478, sl), ty = lerp(716, 742, sl) - 60 * Math.sin(sl * Math.PI), sy = lerp(1, 0.42, sl);
    dev += S.g(X.tablet({ x: 0, y: 0, s: 0.5, face: sl > 0.5 ? 'screen' : 'back', landscape: true, screen: momTabletScreen(t), glow: 0.5 }), `translate(${f(tx)} ${f(ty)}) scale(1 ${f(sy)})`);
  }
  // the tablet lies on the table: draw it after the table so it sits on top
  const fam = family(t, cam, { mom, momAct: { arms: false } });
  return room(t, cam, { set: { glow: GLOWS(1, holding ? ['dad', 'mom', 'grandma'] : ['dad', 'grandma']) }, seated: fam.seated, devices: fam.devices, standing: dev }) + whip(t, CUT.mom, -1, 0.08);
}

// 21. "Mom…" — the hero picks up the tablet, confused
function shGrey(t) {
  const cam = camKeys(t, [[CUT.grey, camAt(1250, 705, 1.95)], [CUT.grey2, camAt(1250, 690, 2.15)]]);
  const hero = heroStand(t, 1250, 1010, { tablet: true, tabletFace: 'screen', screen: momTabletScreen(t), glow: 0.6, face: 'confused', headRot: -6 }, { arms: false });
  let over = mark('?', 1380, 500, seg(t, CUT.grey + 0.2, CUT.grey + 0.45), 80, 10, '#FFFFFF');
  return livingShot(t, cam, { standing: hero, over, mom: { mug: true, face: 'happy' } });
}

// 22. "you're completely grey." — the grey MOM_OFFICIAL on the pedestal, nothing bought
function shGrey2(t) {
  const zk = ease.inOut(seg(t, B.greyW - 0.3, B.greyW + 0.3));
  const cam = camKeys(t, [[CUT.grey2, { zoom: 1.0, x: 0, y: 0 }], [B.greyW - 0.3, { zoom: 1.05, x: -60, y: 0 }], [B.greyW + 0.3, { zoom: 1.55, x: -540, y: 0 }], [CUT.classy, { zoom: 1.6, x: -540, y: -10 }]]);
  const turn = 0.55 * Math.sin((t - CUT.grey2) * 2.4);
  const pv = actor('momAvatar', t, { x: 0, y: 0, s: 0.44, nametag: false, turn, face: { name: 'happy', mouth: 'smile' } });
  const ed = G.avatarEditor({ ...ED, t, tab: 'FACES', username: 'MOM_OFFICIAL', typed: 1, coins: 1000, preview: pv });
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#2A2236' }) + view(cam, ed);
  // a little colour picker: everything greyed out but GREY
  const ck = pop(t, B.greyW, 0.3);
  if (ck > 0) {
    let pal = S.rect(-150, -120, 300, 240, 28, ol('#FFFFFF', 6)) + TF('COLOR', 0, -78, 30, '#2A3140');
    ['#FF5A5A', '#FFB000', '#3BD16F', '#34C3FF', '#B06BFF', '#FF6FB5', '#8E939F', '#3A3F52'].forEach((c, i) => { pal += S.rect(-118 + (i % 4) * 62, -52 + Math.floor(i / 4) * 70, 50, 54, 12, { fill: c, stroke: i === 6 ? '#FF8A2B' : LINE, 'stroke-width': i === 6 ? 7 : 3, opacity: i === 6 ? 1 : 0.35 }); });
    o += S.g(pal, tf(1440, 560, ck, 4));
    o += G.stamp({ text: '100% GREY', k: seg(t, B.greyW + 0.15, B.greyW + 0.6), x: 980, y: 700, s: 0.8, rot: -10, col: '#6E727C' });
  }
  return o + whip(t, CUT.grey2, 1, 0.08);
}

// 23. "Grey is classy, sweetie." — split: Mom sipping tea | the grey avatar sipping tea
function shClassy(t) {
  const sip = seg(t, B.sip2 - 0.1, B.sip2 + 0.3);
  const left = livingShot(t, camAt(1340, 560, 2.2), { mom: { mug: true, mugUp: sip > 0.5, face: { name: 'happy', eyes: { type: 'closed' } } }, momAct: { arms: false } });
  const pose = { x: 960, y: 900, s: 0.5, nametag: false, armR: 20 + 120 * sip, armL: 10, face: { name: 'happy', eyes: { type: 'closed' }, mouth: 'smile' } };
  const hnd = CAST.handAt(CAST.D.momAvatar, pose, 1);
  const av = actor('momAvatar', t, { ...pose, props: [{ svg: X.teaMug({ x: hnd[0] + 30, y: hnd[1] - 10, s: 1.0, t, steam: 1 }), layer: 'front' }] });
  let right = S.rect(0, 0, 1920, 1080, 0, { fill: '#1FA39A' }) + S.path('M760 0 H1160 L1500 1080 H420 Z', { fill: '#FFFFFF', opacity: 0.12 });
  right += S.ellipse(960, 914, 300, 60, ol('#7FE3D6', 7)) + av;
  const gk = bump(t, B.classy, B.classy + 0.7);
  right += K.sparkles([[1080, 300, 60 * gk], [860, 290, 34 * gk], [1160, 420, 24 * gk]], t);
  let o = splitBg('#2A1640', '#FF5FA8') + panel(0, 0, 960, 1080, left, { border: 8 }) + panel(960, 0, 960, 1080, right, { border: 8, zoom: 1.25, dy: 120 });
  o += panelTag(30, 30, 'REAL MOM', '#151A26', '#FFFFFF') + panelTag(990, 30, 'MOM_OFFICIAL', '#FF5FA8', '#FFFFFF');
  o += S.g(TS('classy.', 0, 0, 90, '#FFFFFF', { 'stroke-width': 12, 'font-style': 'italic' }), tf(1440, 900, pop(t, B.classy, 0.3), -5));
  return o + whip(t, CUT.classy, -1, 0.08);
}

// 24. Granny: "HELLO, PHONE." — shouting at arm's length; Mom covers her ears
function shGran(t) {
  const cam = shakeCam(camKeys(t, [[CUT.gran, camAt(1680, 540, 2.25)], [CUT.voice, camAt(1690, 545, 2.5)]]), t, [[B.hello, 0.3, 10], [B.phoneW, 0.35, 14]]);
  const loud = Math.max(bump(t, B.hello - 0.05, w1(14, 'HELLO')), bump(t, B.phoneW - 0.05, w1(14, 'PHONE')));
  const ears = seg(t, B.hello + 0.15, B.hello + 0.4);
  const gran = { phone: 'arm', face: { name: 'scream' }, headRot: 6 * loud, ...boing(t, B.phoneW, 0.08) };
  const mom = { tablet: false, armL: 10 + 150 * ears, armR: 10 + 150 * ears, face: ears > 0.5 ? { name: 'oof', eyes: { type: 'closed' } } : 'neutral', headRot: -6 * ears };
  // the phone sits at the end of her flipped arm (screen side away from us)
  const over = E.shoutWaves(1690, 625, 185, t, 0.5 + 0.5 * loud, 0.75, '#FFE45C') + K.C.sfx('!!', 1590, 440, seg(t, B.phoneW, B.phoneW + 0.2), 60, 10, '#FFFFFF');
  return livingShot(t, cam, { gran, granAct: { arms: false }, mom, momAct: { arms: false }, over, glow: GLOWS(1, ['dad', 'grandma']) });
}

// 25. "MAKE ME. A GAME. PERSON." — the phone's voice typing
function voiceWords(t) {
  const lst = [['HELLO', A[14].word('HELLO')], ['PHONE', A[14].word('PHONE')], ['MAKE', A[14].word('MAKE')], ['ME', A[14].word('ME')], ['A', A[14].word('A')], ['GAME', A[14].word('GAME')], ['PERSON', A[14].word('PERSON')]];
  return lst.map(([text, ww]) => ({ text, k: seg(t, ww.t0, ww.t0 + 0.2), on: t >= ww.t0 && t <= ww.t1 }));
}
function shVoice(t) {
  const ws = voiceWords(t);
  const level = ws.some((x) => x.on) ? 0.8 + 0.2 * Math.abs(Math.sin(t * 20)) : 0.2;
  const hit = Math.max(...['MAKE', 'ME', 'GAME', 'PERSON'].map((x) => bump(t, A[14].word(x).t0, A[14].word(x).t0 + 0.18)));
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#5A3A2E' });
  for (let i = 0; i < 9; i++) o += S.circle(150 + i * 210 + 40 * Math.sin(i * 2.1), 200 + 600 * hash(i * 3.3), 60 + 70 * hash(i), { fill: i % 2 ? '#FFC879' : '#9FD0FF', opacity: 0.18 });
  const rot = 4 * Math.sin(t * 1.5) + 2 * hit * Math.sin(t * 40);
  o += G.deviceFrame({ type: 'phone', x: 960 + 8 * hit * Math.sin(t * 50), y: 500, s: 1.12, rot, screen: E.voiceScreen({ t, words: ws, level }), t, glow: 0.6, glowCol: '#FFB8DA' });
  // the shouted words fly at the phone
  for (const x of ['MAKE', 'ME', 'A', 'GAME', 'PERSON']) {
    const ww = A[14].word(x), k = seg(t, ww.t0, ww.t0 + 0.45);
    if (k > 0 && k < 1) o += S.g(TS(x, 0, 0, 130, '#FFFFFF', { 'stroke-width': 16 }), tf(lerp(x.length % 2 ? 300 : 1620, 960, ease.in(k)), lerp(880, 430, ease.in(k)), 1.4 - 0.9 * k, x.length % 2 ? -10 : 10), { opacity: f(1 - seg(k, 0.7, 1)) });
  }
  return o + smash(t, CUT.voice, 0.1, 0.5);
}

// 26. "Which button is "go"?" — every button says BUY; Granny's finger hunts
function phonePOV(t, scr, fingerXY, press, o = {}) {
  const cam = o.cam || { zoom: 1, x: 0, y: 0 };
  let s = S.rect(0, 0, 1920, 1080, 0, { fill: '#5A3A2E' });
  for (let i = 0; i < 7; i++) s += S.circle(200 + i * 260, 250 + 500 * hash(i * 7.3), 80, { fill: '#FFC879', opacity: 0.14 });
  const ph = G.deviceFrame({ type: 'phone', x: 960, y: 520, s: 1.08, rot: o.rot ?? -3, screen: scr, t, glow: 0.5, glowCol: '#FFB8DA' });
  s += view(cam, ph + (fingerXY ? hand({ x: fingerXY[0], y: fingerXY[1], ax: 1500, ay: 1400, s: 1.3, press, kind: 'granny', ring: true, ringCol: '#FF4FA0' }) : '') + (o.over || ''));
  return s;
}
// phone screen point (380x790 screen px) -> frame point (device s 1.2 at 960,520, rot -3)
function phonePt(px, py, rot = -3) {
  const sx = (px - 190) * 1.08, sy = (py - 395) * 1.08, a = (rot * Math.PI) / 180;
  return [960 + sx * Math.cos(a) - sy * Math.sin(a), 520 + sx * Math.sin(a) + sy * Math.cos(a)];
}
const cardPt = (i) => { const cw = 108, gx = (380 - cw * 3 - 20) / 2; return [gx + (i % 3) * (cw + 10) + cw / 2, 124 + Math.floor(i / 3) * 162 + 75]; };
function shWhich(t) {
  const centre = phonePt(190, 380);
  let [fx, fy] = hunt(t, centre[0], centre[1], 160, 2.0);
  const tgt = phonePt(...cardPt(0));
  const dive = ease.inOut(seg(t, B.press1 - 0.35, B.press1 - 0.04));
  fx = lerp(fx, tgt[0], dive); fy = lerp(fy, tgt[1], dive);
  const press = bump(t, B.press1 - 0.04, B.press1 + 0.18);
  const scr = E.buyScreen({ t, bought: { furcoat: seg(t, B.press1, B.press1 + 0.4) }, note: seg(t, B.goQ + 0.3, B.goQ + 0.6) });
  const over = mark('?', fx - 200, fy - 220, seg(t, B.goQ, B.goQ + 0.25), 110, -10, '#FFFFFF');
  return phonePOV(t, scr, [fx, fy], press, { over, cam: camKeys(t, [[CUT.which, { zoom: 1.0, x: 0, y: 0 }], [CUT.oh, { zoom: 1.12, x: 0, y: -20 }]]) }) + whip(t, CUT.which, 1, 0.08);
}

// 27. "Oh! I bought something." — Granny's face
function shOh(t) {
  const cam = shakeCam(camKeys(t, [[CUT.oh, camAt(1680, 560, 2.5)], [CUT.spree, camAt(1685, 570, 2.75)]]), t, [[A[15].word('Oh').t0, 0.25, 10]]);
  const ohK = seg(t, CUT.oh, CUT.oh + 0.2);
  const gran = { phone: 'arm', face: t < w(15, 'I') ? { name: 'amazed' } : { name: 'happy', fx: ['blush'] }, ...boing(t, w(15, 'Oh'), 0.15) };
  const ph = H.toScreen(cam, { x: 1570, y: 560 });
  let o = livingShot(t, cam, { gran, granAct: { arms: false }, glow: GLOWS(1, ['grandma']) });
  o += S.g(S.rect(-130, -40, 260, 80, 16, { fill: 'none', stroke: '#1E9E52', 'stroke-width': 8 }) + T('BOUGHT!', 0, 22, 62, '#1E9E52'), tf(ph.x - 120, ph.y - 160, pop(t, w(15, 'bought'), 0.3), -12));
  o += G.coinIcon(ph.x + 20, ph.y - 280 - 120 * seg(t, w(15, 'bought'), w(15, 'bought') + 0.8), 30, t * 8, {});
  o += mark('!', 1250, 300, ohK, 110, -6, '#FFE14D');
  return o;
}

// 28. the beat + "Granny pressed buttons at random…" — jab, jab, jab
function shSpree(t) {
  const N = 6, t0 = CUT.spree + 0.15, dt = (CUT.trans - 0.1 - t0) / N;
  const order = [1, 2, 3, 6, 5, 4];
  let pIdx = -1;
  for (let j = 0; j < N; j++) if (t >= t0 + j * dt - 0.12) pIdx = j;
  const card = pIdx >= 0 ? order[pIdx] : 1;
  const tp = t0 + Math.max(0, pIdx) * dt;
  const tg = phonePt(...cardPt(card));
  const prevTg = pIdx > 0 ? phonePt(...cardPt(order[pIdx - 1])) : phonePt(190, 500);
  const mv = ease.inOut(seg(t, tp - 0.12, tp - 0.02));
  const fx = lerp(prevTg[0], tg[0], mv), fy = lerp(prevTg[1], tg[1], mv) - 40 * (1 - bump(t, tp - 0.03, tp + 0.12));
  const press = bump(t, tp - 0.03, tp + 0.12);
  const bought = { furcoat: 1 };
  for (let j = 0; j <= pIdx; j++) bought[E.GRAN_ITEMS[order[j]]] = seg(t, t0 + j * dt, t0 + j * dt + 0.4) + (t > t0 + j * dt + 0.5 ? 1 : 0);
  const coinsN = [1000, 3000, 25000, 800000, 2500000, 9999999][Math.max(0, pIdx)];
  const scr = E.buyScreen({ t, bought, coins: coinsN > 99999 ? (Math.floor(coinsN / 1e4) / 100) + 'M' : coinsN.toLocaleString('en-US') });
  let over = '';
  for (let j = 0; j <= pIdx; j++) { const k = seg(t, t0 + j * dt, t0 + j * dt + 0.5); if (k < 1) { const p = phonePt(...cardPt(order[j])); over += S.g(G.coinIcon(0, 0, 26, t * 9), tf(p[0] + 40, p[1] - 80 - 160 * k, 1), { opacity: f(1 - k) }); } }
  return phonePOV(t, scr, [fx, fy], press, { over, rot: -3 + 2 * Math.sin(t * 7), cam: shakeCam({ zoom: 1.08, x: 0, y: 0 }, t, Array.from({ length: N }, (_, j) => [t0 + j * dt, 0.12, 8])) }) + whip(t, CUT.spree, -1, 0.08);
}

// 29. "…and somehow ended up looking like a billionaire." — the transformation
function shTrans(t) {
  const sp = GS.SPOTS.avatarShop.podium;
  const TI = [['furcoat', w(16, 'buttons')], ['pearls', w(16, 'random')], ['monocle', w(16, 'somehow')], ['cane', w(16, 'ended')], ['bag', w(16, 'looking')]];
  const tR = B.reveal - 0.05;
  const revealed = t >= tR;
  const cam = shakeCam(camKeys(t, [[CUT.trans, { x: 0, y: 40, zoom: 1.5 }], [tR - 0.05, { x: 0, y: 50, zoom: 2.0 }], [tR + 0.25, { x: 0, y: 40, zoom: 1.38 }], [CUT.rule, { x: 0, y: 30, zoom: 1.45 }]], ease.inOut), t, [[tR, 0.5, 20]]);
  const u = Math.max(0, t - CUT.trans);
  const phase = 2 * Math.PI * (0.5 * u + 0.32 * u * u);
  let ch = '', behind = '';
  // rays behind the podium
  behind += K.rays(sp.x, sp.y - 260, 16, 1400, revealed ? '#FFD23F' : '#C77DFF', revealed ? 0.35 : 0.16 + 0.1 * seg(t, CUT.trans, tR), t * (revealed ? 25 : 60));
  if (!revealed) {
    const items = TI.filter(([id]) => id !== 'bag').map(([id, tt]) => ({ id, k: seg(t, tt, tt + 0.2) }));
    let body = E.dressedNoob(NOOB_GRAN, t, 0, 0, 0.72, items, { face: { name: 'amazed', mouth: 'O' }, armL: 30, armR: 30 });
    if (t >= TI[4][1]) body += S.g(X.coinBag({ x: -150 * 0.72, y: -230 * 0.72, s: 0.55 }), '');
    const sxv = Math.cos(phase);
    const whiteK = seg(t, w(16, 'like') - 0.25, tR);
    body = S.g(body, `translate(${f(sp.x)} ${f(sp.y)}) scale(${f(Math.abs(sxv) < 0.08 ? 0.08 * Math.sign(sxv || 1) : sxv)} 1)`);
    ch += body + (whiteK > 0 ? S.g(R.tint(body, 'white', whiteK), '') : '');
    // sparkle tornado
    let sw = '';
    for (let i = 0; i < 10; i++) { const a = phase * 0.7 + i * 0.63, r = 190 + 30 * Math.sin(i); sw += K.F.sparkle(sp.x + Math.cos(a) * r, sp.y - 40 - i * 46, 16 + 10 * (Math.sin(a) > 0 ? 1 : 0.4)); }
    ch += sw;
    // the items flying in
    for (const [id, tt] of TI) {
      const k = seg(t, tt - 0.35, tt);
      if (k <= 0 || k >= 1) continue;
      const from = [sp.x + (hash(tt) > 0.5 ? 900 : -900), sp.y - 900 + 300 * hash(tt * 3)];
      const at = E.ITEM_AT[id] || { y: -240 };
      const x = lerp(from[0], sp.x + (at.x || 0) * 0.72, ease.in(k)), y = lerp(from[1], sp.y + at.y * 0.72, ease.in(k)) - 160 * Math.sin(k * Math.PI);
      ch += S.g(id === 'bag' ? X.coinBag({ x: 0, y: 0, s: 0.9 }) : G.itemIcon(id), tf(x, y, 1.2 - 0.4 * k, k * 360));
    }
    for (const [, tt] of TI) ch += K.C.burst(sp.x, sp.y - 260, seg(t, tt, tt + 0.4), '#FFE14D');
  } else {
    const age = t - tR;
    const pp = R.popPose(age, 0.5);
    if (!pp.hidden) ch += actor('grandmaAvatar', t, { x: sp.x, y: sp.y, s: 0.5, nametag: false, sx: pp.sx, sy: pp.sy, lift: pp.lift, coins: seg(age, 0.2, 1.4), armL: 20, armR: 40 + 10 * Math.sin(t * 5), face: { name: 'smug', mouth: 'smile' } }, { arms: false });
    ch += E.sparkleRing(sp.x, sp.y - 260, t, 1, 300, 9);
    ch += E.poof(sp.x, sp.y - 260, age, 1.4, '#FFF4C4', 9, false);
  }
  let o = GS.avatarShop.compose(t, { spot: 1 }, behind, ch, cam);
  o += tint('#2A1640', revealed ? 0 : 0.2 * seg(t, CUT.trans, CUT.trans + 0.5));
  if (revealed) {
    const age = t - tR;
    for (let i = 0; i < 26; i++) { const yy = ((age * 700 * (0.7 + 0.5 * hash(i)) + hash(i * 3) * 1300) % 1300) - 150; o += G.coinIcon(80 + hash(i * 7.1) * 1760, yy - 200 * (1 - seg(age, 0, 0.6)), 22 + 12 * hash(i), t * 6 + i, {}); }
    o += G.nametag({ who: 'granny', x: 960, y: 140, s: 1.4, k: seg(age, 0.1, 0.4), t });
    o += G.coinCounter({ x: 60, y: 260, value: 9999999, from: 1000, roll: seg(age, 0.1, 0.6), rocket: 1, k: seg(age, 0, 0.3), t, anchor: 'left', s: 1.1 });
    o += K.C.whiteFlash(0.9 * (1 - seg(age, 0, 0.25)));
  } else o += K.C.whiteFlash(0.7 * seg(t, w(16, 'like') - 0.1, tR));
  return o + whip(t, CUT.trans, 1, 0.08);
}

// 30. "Okay. Rule number one." — the hero lays down the law
function shRule(t) {
  const cam = camKeys(t, [[CUT.rule, camAt(1080, 620, 1.28)], [CUT.rule2, camAt(1000, 620, 1.42)]]);
  const up = ease.outBack(seg(t, B.rule - 0.1, B.rule + 0.2));
  const hero = heroStand(t, 720, 1006, { turn: 0.45, armR: lerp(12, 160, up), armL: 10, bodyY: 10 * (1 - up), face: t < B.rule ? { name: 'sad', eyes: { upper: 0.5 } } : 'determined', ...boing(t, B.rule, 0.1) }, { arms: false });
  let o = livingShot(t, cam, { standing: hero, dad: { face: 'happy' }, mom: { tablet: true, face: 'neutral' }, gran: { phone: 'arm', face: 'happy' } });
  o += G.bigTitle({ text: 'RULE #1', k: seg(t, B.rule, B.rule + 0.5), t, theme: 'alarm', x: 960, y: 150, size: 120 });
  return o + whip(t, CUT.rule, -1, 0.08);
}

// 31. "Do NOT talk to my friends."
function shRule2(t) {
  const sm = t >= B.not;
  const cam = shakeCam(sm ? camKeys(t, [[B.not, camAt(720, 560, 2.9)], [CUT.champ, camAt(720, 575, 2.7)]], ease.out) : camAt(720, 600, 2.3), t, [[B.not, 0.45, 20]]);
  const wag = Math.sin(t * 16);
  const hero = heroStand(t, 720, 1006, { turn: 0.3, armR: 150 + 12 * wag, armL: 12, headRot: 4 * wag, face: sm ? 'angry' : 'determined' }, { arms: false });
  let o = livingShot(t, cam, { standing: hero });
  if (sm) o += tint('#FF2E4E', 0.15 * (1 - seg(t, B.not, B.not + 0.8))) + zoomLines(960, 400, 0.6 * (1 - seg(t, B.not, B.not + 0.6)), t);
  o += G.bigTitle({ text: 'RULE #1', k: 1, t, theme: 'alarm', x: 960, y: 120, size: 96, sub: t >= B.talk - 0.1 ? 'DO NOT TALK TO MY FRIENDS' : undefined });
  return o + smash(t, B.not, 0.1, 0.7);
}

// 32. "Got it, champ!" — thumbs up all round
function shChamp(t) {
  const cam = camKeys(t, [[CUT.champ, camAt(1360, 600, 1.5)], [CUT.play, camAt(1330, 590, 1.6)]]);
  const up = ease.outBack(seg(t, A[18].a, A[18].a + 0.3));
  const ding = bump(t, B.champ, B.champ + 0.5);
  let o = livingShot(t, cam, {
    dad: { armR: lerp(20, 160, up), armL: 20, face: { name: 'joy', eyes: ding > 0.3 ? { type: 'happy' } : undefined } }, dadAct: { arms: false },
    mom: { armR: lerp(14, 140, seg(t, B.champ - 0.2, B.champ + 0.1)), armL: 14, face: 'happy' }, momAct: { arms: false },
    gran: { phone: 'arm', face: 'happy' },
    over: K.sparkles([[1060, 420, 40 * ding], [1110, 470, 22 * ding]], t),
  });
  return o + whip(t, CUT.champ, 1, 0.08);
}

// 33. the three PLAY buttons → into the laptop → pixel wipe (SC 04 reveals the plaza)
function shPlay(t) {
  let o = splitBg('#1E1430', '#2E1E4A');
  const devs = [
    { type: 'laptopOld', x: 380, y: 440, s: 0.64, kind: 'dad', label: 'DAD', ax: 640, ay: 1100 },
    { type: 'tablet', x: 1060, y: 440, s: 0.56, kind: 'mom', label: 'MOM', ax: 1300, ay: 1100 },
    { type: 'phone', x: 1650, y: 430, s: 0.76, kind: 'granny', label: 'GRANNY', ax: 1880, ay: 1100 },
  ];
  const zoomK = ease.in(seg(t, B.play[2] + 0.12, END - 0.05));
  let g = '';
  devs.forEach((d, i) => {
    const tp = B.play[i], k = pop(t, CUT.play + i * 0.08, 0.3);
    const ds = G.deviceSize(d.type);
    const scr = E.playScreen({ t, press: seg(t, tp - 0.02, tp + 0.4), load: seg(t, tp + 0.18, tp + 0.3) });
    let dv = G.deviceFrame({ type: d.type, x: d.x, y: d.y, s: d.s * k, screen: scr, t, glow: 0.5 });
    const bx = d.x, by = d.y + (ds.sh * 0.58 - ds.sh / 2) * d.s;
    const ia = ease.out(seg(t, tp - 0.35, tp - 0.05)) * (1 - ease.in(seg(t, tp + 0.15, tp + 0.4)));
    if (ia > 0) dv += hand({ x: lerp(d.ax, bx, ia), y: lerp(d.ay, by, ia), ax: d.ax + 200, ay: d.ay + 300, s: 0.6, press: bump(t, tp - 0.03, tp + 0.15), kind: d.kind, ring: true });
    dv += panelTag(d.x - 60, d.y + 360, d.label, '#151A26', '#FFFFFF', 1.1);
    g += dv;
  });
  o += S.g(g, `translate(380 440) scale(${f(1 + 3.6 * zoomK)}) translate(-380 -440)`);
  o += TS('JOINING CUBE CITY...', 960, 930, 64, '#FFFFFF', { opacity: f(1 - zoomK) });
  return o + K.C.pixelWipe(seg(t, END - 0.32, END + 0.02), 'cover') + whip(t, CUT.play, 1, 0.08);
}

// ---------------------------------------------------------------- the shot list
const SHOTS = [
  [CUT.ext, shExt, 'warm'], [CUT.setup, shSetup, 'warm'], [CUT.kindof, shKindOf, null], [CUT.dad, shDad, 'warm'], [CUT.keys, shKeys, 'warm'],
  [CUT.heroB, shHeroB, 'warm'], [CUT.keysB, shKeysB, 'warm'], [CUT.name, shName, null], [CUT.age, shAge, null], [CUT.pass, shPass, 'warm'],
  [CUT.pass2, shPass2, null], [CUT.no, shNo, 'warm'], [CUT.shop, shShop, null], [CUT.click, shClick, null], [CUT.poof, shPoof, null],
  [CUT.why, shWhy, null], [CUT.did, shDid, 'warm'], [CUT.know, shKnow, 'warm'], [CUT.like, shLike, null], [CUT.mom, shMom, 'warm'],
  [CUT.grey, shGrey, 'warm'], [CUT.grey2, shGrey2, null], [CUT.classy, shClassy, null], [CUT.gran, shGran, 'warm'], [CUT.voice, shVoice, 'warm'],
  [CUT.which, shWhich, 'warm'], [CUT.oh, shOh, 'warm'], [CUT.spree, shSpree, 'warm'], [CUT.trans, shTrans, null], [CUT.rule, shRule, 'warm'],
  [CUT.rule2, shRule2, 'warm'], [CUT.champ, shChamp, 'warm'], [CUT.play, shPlay, null],
];
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x[0]) s = x; return s; };

module.exports = {
  scene(t) { return shotAt(t)[1](t); },
  look(t) { const g = shotAt(t)[2]; return g ? { grade: g, vignette: 0.75 } : { grade: null, vignette: 0.45 }; },
  CUT, BEATS: { ...B, SPREE },
};
