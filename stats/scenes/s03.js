// SC 03 · THE UPDATE (music `install` → `homey`/`playful`). Night: the hero gaming in his headset, the "Update available ·
// Reality HUD v1.0" window pops on his monitor, the house at night (a SYSTEM bubble pops out of his window), the terms box —
// 4,812 pages blast out of the screen and bury the room, the split "Accept." (he clicks without even looking) / "Nobody reads
// those.", the narrator's echo over PAGE 1 drifting down onto the pile ("1.2 To switch the HUD off, press the little X…" —
// covered by the next page), "Installing... reality." → white flash, pixels burst out of the monitor, the room floods cyan, the
// house window bursts into the night sky with the boot log, everything goes dark. Morning: his eyes snap open, POV eyelids +
// LOADING REALITY → ONLINE, tooltips pop on EVERYTHING; "My bed has stats" (COMFORT +50, bouncing), "My SOCK has stats"
// (SMELL +99, arm's length), "My alarm clock is an ENEMY?!" → the mini boss fight: VS card, the pillow smash, −999 CRIT,
// ENEMY DEFEATED (+12 XP into his XP bar). Kitchen: the toaster's BURN CHANCE 80 % → it burned (smoke in his face, soot,
// cough); Mom smiling at ENERGY 2 % (low battery), "Good morning, sweetheart!", four coffees (+1 % each, the mugs slam down)
// → 6 % NEW RECORD (she dozes off smiling); Grandpa LV 87 (flex), Max HP ∞ (RAWR); "Why are you staring at the top of my
// head?" (he swats through his own plate), "No reason! Nice… hair" (thumbs up), "I don't have hair." (dome glint + HAIR
// FOUND: 0); "Watch this!" → Max's flip into the cereal (SPLASH, −50 … NO DAMAGE); "This… is… AMAZING." (the whole
// kitchen of stats, star eyes); Biscuit's stats stuck at 99 % → ERROR: TOO GOOD; the hero pets him → white whip to SC 04.
'use strict';

const K = require('./kit');
const HUD = require('./hud');
const SH = require('./sets_home');
const CAST = require('../rig/cast');
const X = require('../rig/extras');
const E = require('./s03_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, pop, camAt, toScr, shakeCam, clipPoly, boing, whip, whipOut, smash, tint, fadeIn, zoomLines, star4 } = E;

const A = Array.from({ length: 18 }, (_, i) => L('03.' + i));
const T0 = K.V.scene('SC 03').start, END = K.V.scene('SC 04').start;   // == main.js RANGES for SC 03
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const BR = SH.SPOTS.bedroom, KT = SH.SPOTS.kitchen;
const TNK = SH.tone({ morn: 1 });

// ---------------------------------------------------------------- cuts (all from the voice)
const CUT = {};
CUT.desk = T0;                                   // night, the hero gaming; the window pops on "Update available"
CUT.screen = w(0, 'Reality') - 0.25;             // monitor close-up: Reality HUD v1.0
CUT.night = A[1].a - 0.05;                       // the house at night: "That night, a strange update popped up."
CUT.terms = w(1, 'Terms') - 0.2;                 // the terms box starts scrolling, pages fly at the camera
CUT.flood = w(1, 'four') - 0.12;                 // the room buried in 4,812 pages
CUT.accept = A[2].a - 0.12;                      // split: the window | the hero not even looking
CUT.page = A[2].b + 0.1;                         // PAGE 1 drifts down onto the pile ("Nobody reads those.")
CUT.install = A[4].a - 0.1;                      // INSTALLING... REALITY
CUT.burst = w(4, 'reality') + 0.25;              // the room floods with pixels
CUT.house = CUT.burst + 1.55;                    // the window bursts into the night, everything goes dark
CUT.wake = A[5].a - 0.25;                        // morning: the eyes snap open
CUT.pov = w(5, 'morning') + 0.25;                // POV: LOADING REALITY → tooltips on everything
CUT.bed = A[6].a - 0.06;                         // "My bed has stats."
CUT.sock = w(6, 'My', 1) - 0.1;                  // "My SOCK has stats."
CUT.alarm = w(6, 'alarm') - 0.25;                // the alarm clock rings: ENEMY
CUT.vs = w(6, 'ENEMY') - 0.08;                   // VS card
CUT.fight = A[6].b + 0.1;                        // the pillow smash
CUT.toaster = A[7].a - 0.1;                      // BURN CHANCE 80 %
CUT.burned = w(7, 'burned') - 0.05;              // it burned
CUT.mom = A[8].a - 0.1;                          // Mom smiling
CUT.momPlate = w(8, 'Her') + 0.1;                // ENERGY 2 %
CUT.gm = A[9].a - 0.08;                          // "Good morning, sweetheart!"
CUT.coffee = A[10].a - 0.1;                      // coffee 1, 2
CUT.four = w(10, 'She') - 0.1;                   // coffee 3, 4
CUT.six = w(10, 'Six') - 0.1;                    // 6 % — NEW RECORD
CUT.gpa = A[11].a - 0.1;                         // Grandpa LV 87
CUT.max = w(11, 'And') - 0.08;                   // Max HP ∞
CUT.stare = A[12].a - 0.08;                      // the two-shot: staring
CUT.top = w(12, 'top') - 0.15;                   // Grandpa looks up at his own head
CUT.noreason = A[13].a - 0.08;                   // "No reason! Nice... hair"
CUT.nohair = A[14].a - 0.1;                      // "I don't have hair."
CUT.watch = A[15].a - 0.12;                      // "Watch this!"
CUT.jump = A[15].b + 0.05;                       // the flip into the cereal
CUT.immune = CUT.jump + 1.0;                     // −50 … NO DAMAGE
CUT.wow = A[16].a - 0.06;                        // the whole kitchen of stats
CUT.amazing = w(16, 'AMAZING') - 0.1;            // AMAZING (smash-zoom)
CUT.biscuit = A[17].a - 0.08;                    // Biscuit: stats loading...
CUT.error = w(17, 'Error') - 0.06;               // ERROR: TOO GOOD
CUT.end = A[17].b + 0.1;                         // the hero pets Biscuit → whip to SC 04
{ const ks = Object.keys(CUT); for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.3) CUT[ks[i]] = CUT[ks[i - 1]] + 0.3; }

// ---------------------------------------------------------------- beats inside shots
const B = {};
B.win = A[0].a;                                   // the update window pops on his monitor
B.reality = w(0, 'Reality'); B.one = w(0, 'one'); B.point = w(0, 'point'); B.zero = w(0, 'zero');
B.strange = w(1, 'strange'); B.popped = w(1, 'popped');
B.scroll0 = w(1, 'Terms'); B.scroll1 = w1(1, 'pages'); B.pages = w(1, 'pages');
B.click = w(2, 'Accept') + 0.14; B.nobody = w(2, 'Nobody');
B.land = A[3].a + 0.28; B.cover = A[3].b - 0.45;   // PAGE 1 lands on the pile … then the next page covers it
B.inst0 = A[4].a; B.reality2 = w(4, 'reality');
B.dark = CUT.house + 1.25;                        // the house goes dark
B.eyes = w(5, 'morning');
B.every = w(5, 'everything');
B.bootDur = 2.0; B.boot0 = B.every - 0.62 * B.bootDur;  // 100 % lands on "everything"
B.blink = CUT.pov + 0.75;
B.tipA = w(5, 'had') - 0.2; B.tipB = w1(5, 'stats') - 0.25;   // tooltips pop on every object between these
B.bed = w(6, 'bed'); B.stats1 = w(6, 'stats');
B.sock = w(6, 'SOCK'); B.stats2 = w(6, 'stats', 1);
B.alarm = w(6, 'alarm'); B.clock = w(6, 'clock'); B.enemy = w(6, 'ENEMY');
B.launch = CUT.fight + 0.08; B.hit = CUT.fight + 0.42; B.landF = CUT.fight + 0.62;
B.xpPop = B.hit + 0.3; B.xpLand = B.xpPop + HUD.XP_FLY;
B.eighty = w(7, 'eighty'); B.burn = w(7, 'burn'); B.burned = w(7, 'burned');
B.smiling = w(8, 'smiling'); B.energy = w(8, 'energy'); B.two = w(8, 'two');
B.sips = [w(10, 'coffee'), w(10, 'one'), w(10, 'drank'), w(10, 'four')];
B.lands = [B.sips[0] + HUD.XP_FLY, B.sips[1] + HUD.XP_FLY, B.sips[2] + 0.3, B.sips[3] + 0.3];
B.slams = [B.sips[2] + 0.22, B.sips[3] + 0.22];   // mugs 3 + 4 slam down on the counter
B.six = w(10, 'Six'); B.record = w(10, 'new'); B.doze = w(10, 'record') + 0.25;
B.gpa = A[11].a; B.e87 = w(11, 'eightyseven'); B.max = w(11, 'Max'); B.inf = w(11, 'infinite'); B.health = w(11, 'health');
B.top = w(12, 'top'); B.head = w(12, 'head');
B.nice = w(13, 'Nice'); B.hair = w(13, 'hair');
B.hair2 = w(14, 'hair');
B.launchM = A[15].b + 0.12; B.splash = B.launchM + 0.62;
B.amazing = w(16, 'AMAZING');
B.load = w(17, 'load'); B.error = w(17, 'Error'); B.good = w(17, 'good');
// the XP pop from the KO'd alarm clock (screen space, continues across the cut into the kitchen)
const XP_FROM = [430, 430];
const XP_TO = HUD.xpBarAt({ value: 0.12, text: '12 / 100' });

// ---------------------------------------------------------------- shared helpers
const NV = (cam) => ((cam && cam.zoom) || 1) >= 1.3 ? { volume: false } : {};
const ps = (cam, base = 1) => clamp((0.38 + 0.4 * ((cam && cam.zoom) || 1)) * base, 0.72, 1.7);
const headScr = (cam, who, pose) => { const p = HUD.overHead(who, pose.x, pose.y, pose.s, 0, pose); return toScr(cam, p.x, p.y); };
const inView = (cam, x, pad = 160) => { const v = SH.vis(cam, 1); return x > v.x0 - pad && x < v.x1 + pad; };
const clockAt = (t) => (t < B.hit ? '7:00 AM' : t < CUT.toaster ? '7:01 AM' : t < CUT.gpa ? '7:15 AM' : t < CUT.biscuit ? '7:31 AM' : '7:42 AM');
// the HUD over every shot from the boot on: frame + the hero's XP bar (+ the alarm clock's +12 XP flying in)
function hud(t, o = {}) {
  let g = E.hudLayer(t, { tLand: B.xpLand, clock: clockAt(t), ...o });
  const age = t - B.xpPop;
  if (age >= 0 && age < HUD.XP_FLY + 0.3) g += HUD.xpPop({ x: XP_FROM[0], y: XP_FROM[1], age, amount: 12, to: XP_TO });
  return g;
}
const heroQ = (t, cam, pose, s = 0.75, k = 1) => HUD.heroPlate({ ...headScr(cam, 'you', pose), s: ps(cam, s), t, k });

// bedroom compose: bg (k .85) + mid + seated + front + standing + light + over (world)
function bedroomShot(t, cam, o = {}) {
  const Lb = SH.bedroom.layers(t, o.set || {});
  return view(cam, Lb.bg, 0.85) + view(cam, Lb.mid + (o.seated || '') + Lb.front + (o.standing || '') + Lb.fg + Lb.light + (o.over || ''));
}
// kitchen compose; o.screenBehind = screen-space svg between the room and the people
function kitchenShot(t, cam, o = {}) {
  const Lk = SH.kitchen.layers(t, { time: 'morning', mess: o.mess || 0, toast: o.toast ?? 0, burnt: o.burnt ?? 1, smoke: o.smoke, ...(o.set || {}) });
  let s = view(cam, Lk.bg, 0.8) + view(cam, Lk.mid + (o.props || ''));
  if (o.screenBehind) s += o.screenBehind;
  return s + view(cam, (o.seated || '') + Lk.front + (o.standing || '') + Lk.fg + Lk.light + (o.over || ''));
}
// the family at breakfast: o.max / o.you / o.gpa / o.mom / o.dog = pose extras or false
const P = {
  max: (x = {}) => SH.seatPose(KT.seats.max, 0.56, x),
  you: (x = {}) => SH.seatPose(KT.seats.you, 1, { pajamas: true, ...x }),
  gpa: (x = {}) => SH.seatPose(KT.seats.grandpa, 1.1, { glasses: 'up', ...x }),
  mom: (x = {}) => ({ ...KT.counterStand, coffee: true, tired: 1, ...x }),
  dog: (x = {}) => ({ x: 1640, y: 992, s: 0.5, pose: 'sit', ...x }),
};
const MAXSTAND = { x: 948, y: 620, s: 0.45 };     // Max standing on his booster seat
function family(t, cam, o = {}) {
  const nv = o.flat ? { volume: false } : NV(cam);
  let seated = '', standing = '';
  if (o.max !== false && inView(cam, 948)) seated += actor('max', t, P.max({ ...nv, ...(o.max || {}) }), o.maxAct || {});
  if (o.you !== false && inView(cam, 1205)) seated += actor('you', t, P.you({ ...nv, ...(o.you || {}) }), o.youAct || {});
  if (o.gpa !== false && inView(cam, 1462)) seated += actor('grandpa', t, P.gpa({ ...nv, ...(o.gpa || {}) }), o.gpaAct || {});
  if (o.mom && inView(cam, 420)) standing += actor('mom', t, P.mom({ ...nv, ...o.mom }), o.momAct || {});
  if (o.dog && inView(cam, 1640)) standing += K.draw.biscuit({ t, ...P.dog(o.dog) });
  return { seated, standing };
}
// Mom's ENERGY bar: 2 % + one per coffee (the first two fly in as pops, the last two land fast)
function energy(t) {
  const n = B.lands.filter((x) => t >= x).length;
  if (!n) return { label: 'ENERGY', value: 2 };
  const last = B.lands[n - 1];
  return { label: 'ENERGY', value: 2 + n, from: 1 + n, roll: seg(t, last, last + 0.5), bump: bump(t, last, last + 0.45) };
}
// empty mugs on the counter (world): n so far, the newest slams down at tSlam
const MUGS = [[196, '#F27C6B'], [238, '#7CC4F2'], [280, '#FFD86B'], [322, '#B98CFF']];
function momMugs(t, n, slams = []) {
  let g = '';
  for (let i = 0; i < n; i++) {
    const ts = slams[i];
    const drop = ts !== undefined ? 1 - ease.in(seg(t, ts - 0.18, ts)) : 0;
    if (ts !== undefined && t < ts - 0.18) continue;
    const sq = ts !== undefined ? bump(t, ts, ts + 0.16) : 0;
    g += S.g(SH.mug(0, 0, 0.95, TNK, { col: MUGS[i][1], empty: true }), `translate(${MUGS[i][0]} ${f(548 - 160 * drop)}) scale(${f(1 + 0.25 * sq)} ${f(1 - 0.25 * sq)})`);
  }
  return g;
}
// a low-battery icon (screen space) next to Mom's plate
function lowBattery(x, y, t, s = 1) {
  const on = Math.floor(t * 3) % 2 === 0;
  let g = S.rect(-44, -22, 82, 44, 9, { fill: '#10141E', stroke: '#03101B', 'stroke-width': 6 }) + S.rect(-44, -22, 82, 44, 9, { fill: 'none', stroke: '#FF3355', 'stroke-width': 3.5 });
  g += S.rect(40, -10, 9, 20, 3, { fill: '#FF3355', stroke: '#03101B', 'stroke-width': 3 });
  if (on) g += S.rect(-37, -15, 9, 30, 3, { fill: '#FF3355' });
  g += HUD.TL('!', 4, 16, 38, on ? '#FF3355' : '#7A1424');
  return S.g(g, tf(x, y, s, -8));
}

// ================================================================= NIGHT — THE UPDATE
// 1. "Update available." — over the shoulder: DRAGON PEAK on the screen, the window pops, the push-in
function shDesk(t) {
  const cam = camKeys(t, [[CUT.desk, camAt(1190, 470, 1.32)], [CUT.screen, camAt(1318, 410, 2.25)]], ease.inOut);
  const wk = seg(t, B.win - 0.06, B.win + 0.5);
  const scr = (sw, sh) => {
    let s = SH.dragonTitle(sw, sh, t);
    if (wk > 0) s += S.rect(-sw / 2, -sh / 2, sw, sh, 0, { fill: '#050818', opacity: f(0.6 * wk) }) + HUD.updateWindow({ k: wk, t, x: 0, y: 2, s: 0.3 });
    return s;
  };
  const playing = 1 - seg(t, B.win, B.win + 0.2);
  const pose = SH.seatPose(BR.chair, 1, { headset: true, headRot: playing * 5 * Math.sin(t * 7) + 9 * seg(t, B.win + 0.1, B.win + 0.5), headY: playing * 3 * Math.abs(Math.sin(t * 7)), armL: 30 + 10 * playing * Math.sin(t * 14), armR: 30 - 10 * playing * Math.sin(t * 13), ...boing(t, B.win + 0.05, 0.08) });
  const hero = actor('you', t, pose, { arms: false });
  const rk = seg(t, B.win, B.win + 0.5);
  let over = rk > 0 && rk < 1 ? S.rect(1325 - 210 - 60 * rk, 344 - 125 - 40 * rk, 420 + 120 * rk, 250 + 80 * rk, 14, { fill: 'none', stroke: '#7FF4FF', 'stroke-width': f(10 * (1 - rk)), opacity: f(1 - rk) }) : '';
  let o = bedroomShot(t, cam, { set: { time: 'night', pcScreen: scr, glowCol: wk > 0.5 ? 'cyan' : 'blue' }, seated: hero, over });
  return o + fadeIn(t, CUT.desk, 0.22);
}

// 2. "Reality HUD, version one point zero." — the window fills the screen; a glint runs over the title
function shScreen(t) {
  const push = lerp(1.0, 1.1, ease.inOut(seg(t, CUT.screen, CUT.night)));
  const bz = 0.022 * (bump(t, B.one, B.one + 0.16) + bump(t, B.point, B.point + 0.16) + 1.6 * bump(t, B.zero, B.zero + 0.3));
  const s = 1.06 + bz;
  let inner = HUD.updateWindow({ k: 1, t, x: 960, y: 540, s });
  // a light streak sweeps over the title + a star rides along it
  const gk = seg(t, B.reality - 0.05, B.reality + 0.6);
  if (gk > 0 && gk < 1) {
    const tx = 960 + (-580 + 246) * s, ty = 540 + (-370 + 212) * s, gx = lerp(tx - 160, tx + 760 * s, ease.inOut(gk));
    inner += S.path(`M${f(gx)} ${f(ty - 110)}h90l-80 150h-90Z`, { fill: '#BFFFFF', opacity: f(0.35 * Math.sin(gk * Math.PI)) });
    inner += star4(gx + 20, ty - 70, 44 * Math.sin(gk * Math.PI), t * 300, '#FFFFFF');
  }
  const zk = bump(t, B.zero, B.zero + 0.6);
  if (zk > 0) inner += star4(960 + 175 * s, 540 - 205 * s, 34 * zk, t * 200, '#FFFFFF');
  return E.monitorCU(t, inner, { push }) + whip(t, CUT.screen, 1, 0.08);
}

// 3. "That night, a strange update popped up." — the house, the blue window; a SYSTEM bubble pops out of it
function shNight(t) {
  const cam = camKeys(t, [[CUT.night, { zoom: 1.0, x: 0, y: 0 }], [CUT.terms, { zoom: 1.8, x: 178, y: -258 }]], ease.inOut);
  const flick = bump(t, B.strange, B.strange + 0.35);
  let o = SH.houseExterior(t, cam, { time: 'night', heroWindow: flick > 0.3 && Math.floor(t * 20) % 2 ? 'lit' : 'glow' });
  const win = SH.toScreen(cam, SH.SPOTS.houseExterior.heroWindow);
  const pk = seg(t, B.popped - 0.1, B.popped + 0.45);
  if (pk > 0) {
    const bx = win.x + 40 * win.z, by = win.y - 135 * win.z;
    o += S.path(`M${f(win.x)} ${f(win.y - 30 * win.z)}L${f(bx - 20)} ${f(by + 40 * win.z)}`, { stroke: '#7FF4FF', 'stroke-width': 3, opacity: f(0.8 * pk) });
    o += HUD.systemMsg({ k: pk, t, text: 'Update available', icon: 'down', x: bx, y: by, s: 0.55 * win.z });
  }
  return o + whip(t, CUT.night, -1, 0.08);
}

// 4. "Terms and conditions…" — the page counter starts rolling; pages blast out of the screen at the camera
function shTerms(t) {
  const scroll = seg(t, B.scroll0, B.scroll1);
  const push = lerp(1.0, 1.16, ease.in(seg(t, CUT.terms, CUT.flood)));
  const jit = 4 * seg(t, B.scroll0, B.scroll0 + 0.6);
  let inner = HUD.updateWindow({ k: 1, t, x: 960 + Math.sin(t * 47) * jit, y: 540 + Math.cos(t * 41) * jit, s: 1.06, scroll });
  let o = E.monitorCU(t, inner, { push });
  o += E.pageStorm(t - B.scroll0 - 0.05, 960, 600, { n: 26, rate: 18, life: 0.85, s0: 0.4, s1: 4.2, seed: 2 });
  return o + smash(t, CUT.terms, 0.1, 0.4);
}

// 5. "…four thousand, eight hundred and twelve pages." — the room buried in pages; the counter slams 4,812
function shFlood(t) {
  const scroll = seg(t, B.scroll0, B.scroll1);
  const cam = shakeCam(camKeys(t, [[CUT.flood, camAt(1190, 520, 1.36)], [CUT.accept, camAt(1060, 560, 1.06)]], ease.out), t, [[B.pages, 0.45, 18]]);
  const scr = (sw, sh) => SH.dragonTitle(sw, sh, t) + S.rect(-sw / 2, -sh / 2, sw, sh, 0, { fill: '#050818', opacity: 0.6 }) + HUD.updateWindow({ k: 1, t, x: 0, y: 2, s: 0.3, scroll });
  const pk = ease.out(seg(t, CUT.flood - 0.3, B.pages + 0.3));
  const lean = seg(t, CUT.flood, B.pages);
  const pose = SH.seatPose(BR.chair, 1, { headset: true, headRot: -8 * lean + 3 * Math.sin(t * 9), armL: 40 + 80 * lean, armR: 40 + 80 * lean, bodyY: 6 * lean });
  let hero = actor('you', t, pose, { arms: false });
  // one page lands on his head on "pages"
  const ht = CAST.headTop('you', { ...pose, headset: true });
  const hk = seg(t, B.pages - 0.35, B.pages);
  if (hk > 0) hero += E.page(lerp(ht.x + 260, ht.x + 6, ease.out(hk)), lerp(ht.y - 260, ht.y + 6, hk) + (hk < 1 ? -60 * Math.sin(hk * Math.PI) : 0), 0.62, lerp(120, 8, hk));
  let piles = E.pilePaper(1110, 992, 320, pk, 1, 1) + E.pilePaper(1560, 994, 260, pk * 0.9, 1, 2) + E.pilePaper(720, 680, 280, pk * 0.8, 1, 3) + E.pilePaper(1900, 996, 240, pk * 0.7, 1, 4);
  const fountain = E.pageFountain(t - CUT.flood + 0.35, 1325, 360, { rate: 28, n: 34, dur: 1.0, s: 0.42, dx: 900, drop: 720, seed: 3 });
  let o = bedroomShot(t, cam, { set: { time: 'night', pcScreen: scr, glowCol: 'cyan' }, seated: hero, standing: piles + fountain });
  // the page counter
  const page = Math.max(1, Math.round(1 + 4811 * ease.inOut(scroll)));
  const sk = seg(t, B.pages - 0.06, B.pages + 0.24);
  if (sk <= 0) o += TS(`PAGE ${page.toLocaleString('en-US')} / 4,812`, 960, 160, 74, '#FFFFFF', { 'stroke-width': 12 }) + TS('TERMS & CONDITIONS', 960, 222, 34, '#7FF4FF', { 'stroke-width': 7 });
  else o += E.stamp('4,812 PAGES', 960, 190, sk, { size: 92, col: '#FFFFFF', ink: '#14223A', rot: -5 });
  return o + smash(t, B.pages, 0.12, 0.5);
}

// 6. "Accept. Nobody reads those." — split: the window + his cursor | the hero, not even looking
const SPLIT_X0 = 1010, SPLIT_X1 = 930;
function shAccept(t) {
  // left: the screen
  const wx = 470, wy = 500, wsc = 0.7;
  const [ax, ay] = HUD.updateAcceptAt({ x: wx, y: wy, s: wsc });
  const mv = ease.out(seg(t, CUT.accept, B.click - 0.06));
  const px = lerp(790, ax - 10, mv) + 30 * ease.inOut(seg(t, B.click + 0.4, B.click + 1.2)), py = lerp(960, ay - 6, mv) + 20 * ease.inOut(seg(t, B.click + 0.4, B.click + 1.2));
  let left = S.rect(0, 0, 1100, 1080, 0, { fill: '#120E2C' }) + S.g(SH.dragonTitle(1100, 1080, t), 'translate(550 1040)') + S.rect(0, 0, 1100, 1080, 0, { fill: '#070A1C', opacity: 0.7 });
  left += HUD.updateWindow({ k: 1, t, x: wx, y: wy, s: wsc, scroll: 1, accept: seg(t, B.click, B.click + 0.5), pointer: { x: px, y: py, s: 1.1, press: seg(t, B.click - 0.02, B.click + 0.35) } });
  const ak = seg(t, B.click + 0.15, B.click + 0.5);
  if (ak > 0) left += HUD.sparkleBurst(ax, ay, ak, 160, 8, '#3DFF8F', 4);
  left += E.edgeDark(0.35);
  // right: the hero's face, lit by the screen
  const bgCam = camAt(560, 430, 1.5);
  const Lb = SH.bedroom.layers(t, { time: 'night', tuck: 0 });
  let right = view(bgCam, Lb.bg, 0.85) + view(bgCam, Lb.mid) + S.rect(900, 0, 1100, 1080, 0, { fill: '#0A0F2E', opacity: 0.5 });
  right += SH.glow(1180, 520, 520, 'shGlowBlue', 0.7);
  const shrug = bump(t, B.nobody - 0.1, A[2].b + 0.1);
  const tap = bump(t, B.click - 0.08, B.click + 0.1);
  const face = t < B.nobody - 0.05 ? { name: 'deadpan', eyes: { upper: 0.45, look: [0.25, 0] } } : { name: 'smug', eyes: { upper: 0.35, look: [0.1, 0] } };
  right += actor('you', t, { x: 1470, y: 1430, s: 1.2, headset: true, volume: false, turn: -0.18, armL: 34 - 8 * tap + 20 * shrug, armR: 12 + 36 * shrug, bendR: 100 * shrug, bodyY: -14 * shrug, headRot: 6 * shrug + 2 * Math.sin(t * 2), face }, { arms: false });
  right += tint('#3A7BFF', 0.06);
  let o = clipPoly(`M0 0H${SPLIT_X0}L${SPLIT_X1} 1080H0Z`, left) + clipPoly(`M${SPLIT_X0} 0H1920V1080H${SPLIT_X1}Z`, right);
  o += S.path(`M${SPLIT_X0} -10L${SPLIT_X1} 1090`, { stroke: '#151515', 'stroke-width': 26 }) + S.path(`M${SPLIT_X0} -10L${SPLIT_X1} 1090`, { stroke: '#7FF4FF', 'stroke-width': 10 });
  // the click: a tiny "click" mark between the panels
  const ck = seg(t, B.click, B.click + 0.4);
  if (ck > 0 && ck < 1) o += S.g(E.TFS('*click*', 0, 0, 46, '#FFFFFF'), tf(965, 820 - 40 * ck, 1, -8), { opacity: f(1 - ck) });
  return o + whip(t, CUT.accept, 1, 0.08);
}

// 7. "Nobody reads those." (the narrator) — PAGE 1 drifts down onto the pile; the little X glints; the next page covers it
function shPage(t) {
  const cam = camAt(1130, 930, 2.4);
  const piles = E.pilePaper(1110, 992, 520, 1, 1, 1) + E.pilePaper(1560, 994, 300, 1, 1, 2) + E.pilePaper(760, 996, 360, 1, 1, 5);
  let o = bedroomShot(t, cam, { set: { time: 'night', glowCol: 'cyan' }, standing: piles });
  o += tint('#0A1030', 0.25);
  // the falling page (screen space) + the push-in after it lands
  const u = seg(t, CUT.page + 0.05, B.land);
  const sway = Math.sin(u * Math.PI * 2.3) * (1 - u);
  const px = 930 + 210 * sway, py = lerp(-260, 600, ease.inOut(u)), rot = lerp(30, -4, u) + 22 * sway;
  const push = 1 + 0.6 * ease.inOut(seg(t, B.land + 0.1, B.cover));
  let pg = E.page(px, py, 3.4, rot, { page1: true });
  // the little X glints on page one
  const gx = bump(t, B.land + 0.35, B.land + 1.0);
  if (gx > 0) pg += star4(px + 36 * 3.4 * 0.62, py - 7 * 3.4, 40 * gx, t * 150, '#FFFFFF') + S.ellipse(px + 4 * 3.4, py - 9.5 * 3.4, 92 * 1.7, 13, { fill: '#FFE14D', opacity: f(0.22 * gx) });
  // the next page slides over it
  const ck = seg(t, B.cover, B.cover + 0.3);
  if (ck > 0) pg += E.page(lerp(1500, 948, ease.out(ck)), lerp(-120, 612, ease.out(ck)), 3.4, lerp(-40, 5, ck));
  o += S.g(pg, `translate(940 600) scale(${f(push)}) translate(-940 -600)`);
  o += E.edgeDark(0.5);
  return o + whip(t, CUT.page, -1, 0.08);
}

// 8. "Installing... reality." — the install bar, glitch builds; on "reality": white flash, pixels burst at the camera
function shInstall(t) {
  const install = seg(t, B.inst0, B.reality2 + 0.06);
  const g = 0.45 * seg(t, B.reality2 - 0.8, B.reality2);
  const push = lerp(1.0, 1.25, ease.in(seg(t, CUT.install, CUT.burst)));
  const jit = 10 * g;
  let inner = HUD.updateWindow({ k: 1, t, x: 960 + Math.sin(t * 53) * jit, y: 540 + Math.cos(t * 47) * jit, s: 1.06, scroll: 1, accept: 1, install, glitch: g });
  let o = E.monitorCU(t, inner, { push, dim: 0.62 });
  const age = t - B.reality2;
  if (age >= 0) o += K.C.whiteFlash(0.9 * (1 - seg(age, 0, 0.2))) + HUD.pixelBurst({ x: 960, y: 540, age, n: 70, spread: 1.3, seed: 4 });
  return o + smash(t, CUT.install, 0.1, 0.35);
}

// 9. the room floods with pixels; the hero is blown back in his chair; pages whirl
function shBurst(t) {
  const px = seg(t, B.reality2 - 0.05, B.reality2 + 1.6);
  const cam = shakeCam(camKeys(t, [[CUT.burst, camAt(1190, 480, 1.22)], [CUT.house, camAt(1060, 540, 0.94)]], ease.out), t, [[CUT.burst, 1.2, 16]]);
  const blow = ease.out(seg(t, CUT.burst, CUT.burst + 0.25));
  const pose = SH.seatPose(BR.chair, 1, { headset: true, armL: 150 * blow + 8 * Math.sin(t * 30), armR: 150 * blow - 8 * Math.sin(t * 33), headRot: -10 * blow + 6 * Math.sin(t * 25), bodyY: -10 * blow });
  const hero = actor('you', t, pose, { arms: false });
  const piles = E.pilePaper(1110, 992, 320, 1 - 0.5 * blow, 1, 1) + E.pilePaper(1560, 994, 260, 0.9 - 0.4 * blow, 1, 2) + E.pilePaper(720, 680, 280, 0.8, 1, 3);
  const whirl = E.pageFountain(t - CUT.burst, 1200, 990, { rate: 30, n: 22, dur: 1.1, s: 0.42, dx: 1100, drop: -200, seed: 9, stop: 0.6 });
  // cyan shock rings from the monitor
  let rings = '';
  for (let i = 0; i < 3; i++) { const u = seg(t, CUT.burst + i * 0.28 - 0.25, CUT.burst + i * 0.28 + 0.6); if (u > 0 && u < 1) rings += S.circle(1325, 344, 80 + 1100 * ease.out(u), { fill: 'none', stroke: '#7FF4FF', 'stroke-width': f(30 * (1 - u)), opacity: f(0.8 * (1 - u)) }); }
  let o = bedroomShot(t, cam, { set: { time: 'night', pixels: px, glowCol: 'cyan' }, seated: hero, standing: piles + whirl, over: rings });
  return o + K.C.whiteFlash(0.6 * (1 - seg(t, CUT.burst, CUT.burst + 0.18)));
}

// 10. the house: the window bursts into the night sky with the boot log; everything goes dark
function shHouse(t) {
  const cam = camKeys(t, [[CUT.house, { zoom: 1.7, x: 150, y: -225 }], [B.dark, { zoom: 1.0, x: 0, y: 0 }]], ease.inOut);
  const upd = seg(t, CUT.house - 0.1, CUT.house + 1.25);
  const dark = t >= B.dark;
  let o = SH.houseExterior(t, cam, dark ? { time: 'night', heroWindow: 'off', windows: { porch: false } } : { time: 'night', update: upd });
  const win = SH.toScreen(cam, SH.SPOTS.houseExterior.heroWindow);
  if (!dark) {
    // shock rings + the boot log rising into the sky
    for (let i = 0; i < 3; i++) { const u = seg(t, CUT.house + i * 0.32, CUT.house + i * 0.32 + 0.9); if (u > 0 && u < 1) o += S.ellipse(win.x, win.y, 60 + 900 * ease.out(u), (60 + 900 * ease.out(u)) * 0.55, { fill: 'none', stroke: '#7FF4FF', 'stroke-width': f(18 * (1 - u)), opacity: f(0.8 * (1 - u)) }); }
    HUD.BOOT_LINES.forEach((l, i) => {
      const u = seg(t, CUT.house + 0.1 + i * 0.16, CUT.house + 0.1 + i * 0.16 + 1.1);
      if (u <= 0 || u >= 1) return;
      const x = win.x + (i % 2 ? 1 : -1) * (60 + 80 * hash(i)), y = win.y - 60 - 520 * ease.out(u);
      o += HUD.TF(l, x, y, 26 + 10 * u, i === HUD.BOOT_LINES.length - 1 ? '#FFD21F' : '#7FF4FF', { opacity: f(1 - u * u), 'font-family': 'Fredoka, monospace' });
    });
    const tk = seg(t, CUT.house + 0.3, CUT.house + 0.7) * (1 - seg(t, B.dark - 0.35, B.dark));
    if (tk > 0) o += S.g(HUD.TL('LOADING REALITY...', 0, 0, 64, '#E8FFFF', { stroke: '#03101B', 'stroke-width': 8, 'paint-order': 'stroke' }), tf(win.x, Math.max(120, win.y - 300), tk));
  } else {
    o += tint('#000008', 0.35 + 0.65 * seg(t, B.dark + 0.2, CUT.wake - 0.05));
  }
  return o + K.C.whiteFlash(0.7 * (1 - seg(t, CUT.house, CUT.house + 0.2)));
}

// ================================================================= MORNING — EVERYTHING HAS STATS
// 11. "The next morning…" — top-down on the pillow: asleep (zzz, morning light); the eyes snap open on "morning"
function shWake(t) {
  const open = t >= B.eyes;
  const push = lerp(1.0, 1.07, seg(t, CUT.wake, CUT.pov));
  let g = S.rect(-40, -200, 2000, 1400, 0, { fill: '#F3EEE2' }) + S.path('M-40 300 Q600 340 1960 260 M-40 820 Q700 760 1960 860', { fill: 'none', stroke: '#D9D1C0', 'stroke-width': 6 });
  // headboard + pillow
  g += S.rect(-40, -200, 2000, 140, 0, { fill: '#7A4A2A', stroke: '#151515', 'stroke-width': 8 }) + S.rect(-40, -80, 2000, 20, 0, { fill: '#5E3720' });
  g += E.pillow(960, 420, 4.4, 0);
  // the hero lying on his back (seen from above), head on the pillow
  const face = open ? { name: 'shocked', mouth: 'line', eyes: { pupil: 0.8 } } : { name: 'sleepy', eyes: { type: 'closed' }, mouth: 'O' };
  g += actor('you', t, { x: 960, y: 1390, s: 0.98, pajamas: true, volume: false, shadow: false, face, headRot: open ? 0 : -6, ...(open ? boing(t, B.eyes, 0.1) : { bodyY: 4 * Math.sin(t * 2.4) }) }, { arms: false });
  // the duvet (navy pixel hearts) up to the chin
  const dv = 'M-40 860 Q300 820 560 846 Q760 870 960 852 Q1180 834 1400 860 Q1700 890 1960 850 V1120 H-40 Z';
  g += S.path(dv, { fill: '#2B3270', stroke: '#151515', 'stroke-width': 8 }) + S.path(dv, { fill: 'url(#shHearts)' });
  g += S.path('M-40 900 Q300 860 560 886 Q760 910 960 892 Q1180 874 1400 900 Q1700 930 1960 890', { fill: 'none', stroke: '#4A55A8', 'stroke-width': 14 });
  // morning light across the bed
  g += S.path('M600 -40 L1100 -40 L700 1120 L200 1120 Z', { fill: '#FFE8B0', opacity: 0.16 }) + S.path('M1250 -40 L1450 -40 L1050 1120 L850 1120 Z', { fill: '#FFE8B0', opacity: 0.12 });
  let o = S.g(S.g(g, 'translate(0 -150)'), `translate(960 540) scale(${f(push)}) translate(-960 -540)`);
  if (!open) o += K.C.zzz(t, 1180, 230);
  const gk = bump(t, B.eyes, B.eyes + 0.5);
  if (gk > 0) o += star4(905, 412, 60 * gk, t * 300, '#BFFFFF') + star4(1035, 392, 44 * gk, t * 300 + 30, '#BFFFFF');
  return o + fadeIn(t, CUT.wake, 0.3) + (open ? tint('#9FF4FF', 0.35 * (1 - seg(t, B.eyes, B.eyes + 0.2))) : '');
}

// 12. POV: eyelids open, LOADING REALITY → ONLINE on "everything", tooltips on every object on "had stats"
const POV_TIPS = [
  [{ x: 640, y: 600 }, () => ({ ...HUD.TIPS.bed })],
  [{ x: 90, y: 520 }, () => ({ ...HUD.TIPS.alarm })],
  [{ x: 730, y: 898 }, () => ({ ...HUD.TIPS.sock })],
  [{ x: 1325, y: 300 }, () => ({ title: 'GAMING PC', rarity: 'legendary', lines: ['FUN +999'] })],
  [{ x: 870, y: 200 }, () => ({ title: 'DRAGON POSTER', rarity: 'epic', lines: ['COOL +90'] }), 'down'],
  [{ x: 1325, y: 640 }, () => ({ title: 'GAMING CHAIR', rarity: 'rare', lines: ['BACK PAIN +5'] }), 'down'],
  [{ x: 1755, y: 360 }, () => ({ title: 'MIRROR', rarity: 'mystery', lines: [{ label: 'SHOWS: ', value: '???', col: '#FF4FD8' }] })],
  [{ x: 1030, y: 930 }, () => ({ title: 'RUG', rarity: 'common', lines: ['COZY +10'] })],
];
function shPOV(t) {
  const cam = camKeys(t, [[CUT.pov, camAt(970, 560, 1.12)], [CUT.bed, camAt(950, 545, 1.02)]]);
  let o = bedroomShot(t, cam, { set: { time: 'morning', tuck: 0.2 } });
  const ta = B.tipA, tb = B.tipB;
  POV_TIPS.forEach(([pt, fn, side], i) => {
    const t0 = lerp(ta, tb, i / (POV_TIPS.length - 1));
    const k = seg(t, t0, t0 + 0.4);
    if (k <= 0) return;
    const p = toScr(cam, pt.x, pt.y);
    o += HUD.tooltip({ ...fn(), x: p.x, y: p.y, k, t, s: 0.78, side: side || 'up', dist: 50 });
  });
  const bootEnd = B.boot0 + B.bootDur;
  o += HUD.bootSequence(t, B.boot0, { dur: B.bootDur, clock: '7:00 AM' });
  if (t >= bootEnd) o += HUD.hudFrame({ t, clock: '7:00 AM', day: 'MON' });
  o += HUD.xpBar({ t, level: 1, value: 0, text: '0 / 100', k: seg(t, B.every + 0.5, B.every + 1.0) });
  const open = seg(t, CUT.pov, CUT.pov + 0.45) * (1 - bump(t, B.blink, B.blink + 0.2));
  return o + E.eyelids(open);
}

// 13. "My bed has stats." — sitting up in bed, bouncing: COMFORT +50; the "???" hangs over him
function shBed(t) {
  const cam = camKeys(t, [[CUT.bed, camAt(390, 470, 1.75)], [CUT.sock, camAt(410, 470, 1.95)]]);
  const bnc = bump(t, B.bed - 0.05, B.bed + 0.3) + bump(t, B.stats1, B.stats1 + 0.35);
  const pose = SH.seatPose(BR.bed.sitUp, 1, { pajamas: true, ...NV(cam), face: 'amazed', bodyY: -18 * bnc, ...boing(t, B.stats1, 0.1) });
  const hero = actor('you', t, pose, { energy: 1.3 });
  let o = bedroomShot(t, cam, { set: { time: 'morning', tuck: 0.7 }, seated: hero });
  const bp = toScr(cam, 660, 640 + 6 * bnc);
  o += HUD.tipFor('bed', { x: bp.x, y: bp.y, k: seg(t, B.bed - 0.18, B.bed + 0.3), t, s: 1.0 + 0.1 * bump(t, B.stats1, B.stats1 + 0.3), dist: 70, dx: 40 });
  o += heroQ(t, cam, pose, 0.72);
  return o + hud(t) + whip(t, CUT.bed, 1, 0.08);
}

// 14. "My SOCK has stats." — at arm's length: SMELL +99
function shSock(t) {
  const cam = shakeCam(camKeys(t, [[CUT.sock, camAt(840, 575, 2.1)], [CUT.alarm, camAt(850, 565, 2.35)]]), t, [[B.stats2, 0.35, 8]]);
  const gag = bump(t, B.stats2, B.stats2 + 0.5);
  const pose = SH.seatPose(BR.bed.edge, 1, { pajamas: true, volume: false, armR: 82 + 4 * Math.sin(t * 6), armL: 20, bendL: -120, lean: -5 - 4 * gag, headRot: -10 - 6 * gag, face: { name: 'yuck', fx: gag > 0.2 ? ['sweat'] : [] } });
  const hero = actor('you', t, pose, { arms: false });
  const [hx, hy] = CAST.handPos('you', pose, 1);
  const sock = X.sock({ x: hx + 6, y: hy + 40, s: 0.3, rot: 8 + 6 * Math.sin(t * 5), t, smell: 1 });
  let o = bedroomShot(t, cam, { set: { time: 'morning', tuck: 0.15, sock: false }, standing: hero + sock });
  const sp = toScr(cam, hx + 6, hy + 36);
  o += HUD.tipFor('sock', { x: sp.x, y: sp.y, k: seg(t, B.sock - 0.18, B.sock + 0.3), t, s: 1.15 + 0.12 * gag, dist: 90, dx: 60 });
  o += tint('#6BD13F', 0.08 * gag);
  return o + hud(t) + whip(t, CUT.sock, -1, 0.08);
}

// 15. "My alarm clock is an ENEMY?!" — it rings; the red ENEMY tooltip; the angry brows
function clockBrows(t, ring, x = 90, y = 604, s = 0.72) {
  const sh = ring * Math.sin(t * 60) * 7, jump = ring * Math.abs(Math.sin(t * 30)) * 8;
  return S.g(S.g(E.angryBrows(0, -54, 44), `translate(${f(sh)} ${f(-jump)}) rotate(${f(sh * 0.8)} 0 -54)`), tf(x, y, s));
}
function shAlarm(t) {
  const ring = seg(t, B.alarm - 0.05, B.alarm + 0.12);
  const cam = shakeCam(camKeys(t, [[CUT.alarm, camAt(120, 545, 2.7)], [CUT.vs, camAt(100, 540, 3.2)]]), t, [[B.alarm, 1.2, 9]]);
  const brow = seg(t, B.clock - 0.1, B.clock + 0.1);
  let o = bedroomShot(t, cam, { set: { time: 'morning', tuck: 0.15, ring }, standing: brow > 0 ? S.g(clockBrows(t, ring), null, { opacity: f(brow) }) : '' });
  const p = toScr(cam, 90, 520);
  o += HUD.tipFor('alarm', { x: p.x, y: p.y, k: seg(t, B.clock - 0.2, B.clock + 0.3), t, s: 1.25, dist: 70, dx: 120 });
  o += tint('#FF1E3C', 0.12 * ring * (0.5 + 0.5 * Math.sin(t * 18)));
  return o + hud(t) + whip(t, CUT.alarm, -1, 0.08);
}

// 16. VS — YOU vs ALARM CLOCK (mini boss)
function shVS(t) {
  const u = ease.out(seg(t, CUT.vs, CUT.vs + 0.26));
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#B3122E' }) + S.path('M0 0H1060L860 1080H0Z', { fill: '#1E3FA8' });
  o += K.rays(960, 540, 18, 1500, '#FFFFFF', 0.06, t * 30);
  o += K.C.speedLines(-200, 900, 300, 8, 3, '#5A7CFF', 500) + K.C.speedLines(1000, 2000, 760, 8, 7, '#FF5A6E', 500);
  // the clock (right) with brows
  const cx = lerp(2300, 1420, u), cy = 820 + 8 * Math.sin(t * 9);
  o += SH.alarmClock(cx, cy, 4.4, undefined, { ring: 1, t }) + clockBrows(t, 1, cx, cy, 4.4);
  // the hero (left), pillow raised
  const pose = { x: lerp(-400, 560, u), y: 1080, s: 0.78, pajamas: true, volume: false, turn: 0.3, armR: 155, bendR: 40, armL: 25, face: 'determined', ...boing(t, B.enemy, 0.08) };
  o += actor('you', t, pose, { arms: false });
  const [hx, hy] = CAST.handPos('you', pose, 1);
  o += E.pillow(hx + 30, hy - 95, 0.9, -20 + 4 * Math.sin(t * 8));
  // labels
  o += S.g(TS('YOU', 0, 0, 72, '#FFFFFF') + TS('LV 1', 0, 52, 36, '#7FF4FF'), tf(lerp(-200, 330, u), 860));
  o += S.g(TS('ALARM CLOCK', 0, 0, 72, '#FFFFFF') + TS('LV 1 · MINI BOSS', 0, 52, 36, '#FFD21F'), tf(lerp(2200, 1520, u), 860));
  // VS slams on "ENEMY"
  const vk = seg(t, B.enemy - 0.02, B.enemy + 0.2);
  if (vk > 0) o += S.g(TS('VS', 0, 90, 300, '#FFD21F', { 'stroke-width': 30 }), tf(960, 470, lerp(3, 1, ease.out(vk)) + 0.04 * Math.sin(t * 20), -8)) + HUD.sparkleBurst(960, 470, vk, 300, 10, '#FFF0A0', 3);
  o += HUD.bossBar({ k: seg(t, B.enemy, B.enemy + 0.5), t, name: 'ALARM CLOCK', sub: 'LV 1 · MINI BOSS', value: 1, y: 150, w: 900 });
  o += hud(t) + smash(t, B.enemy, 0.12, 0.7) + whip(t, CUT.vs, 1, 0.08);
  return o;
}

// 17. the fight: the leap, the pillow SMACK (−999 CRIT), the clock flies; ENEMY DEFEATED, +12 XP
function shFight(t) {
  const cam = shakeCam(camKeys(t, [[CUT.fight, camAt(400, 440, 1.45)], [CUT.toaster, camAt(340, 470, 1.58)]]), t, [[B.hit, 0.4, 22]]);
  const u = seg(t, B.launch, B.landF);
  const landed = t >= B.landF;
  const x = lerp(520, 230, ease.inOut(u)), y = lerp(680, 990, u) - 120 * Math.sin(Math.PI * Math.min(1, u * 1.05));
  const swing = seg(t, B.hit - 0.14, B.hit + 0.04);
  let pose;
  if (!landed) pose = { x, y, s: 0.5, pajamas: true, view: 'side', armL: lerp(175, 40, ease.in(swing)), armR: -30, legL: 50, kneeL: 70, legR: -10, kneeR: 50, face: 'angry' };
  else pose = { x: 230, y: 990, s: 0.5, pajamas: true, turn: 0.2, armR: 165, armL: 20, face: 'joy', ...boing(t, B.landF, 0.14) };
  const hero = actor('you', t, pose, { arms: false });
  let held = '';
  if (!landed) { const [hx, hy] = CAST.handPos('you', pose, -1); held = E.pillow(hx - 20, hy - 10, 0.42, lerp(-60, 40, swing), bump(t, B.hit - 0.02, B.hit + 0.12)); }
  else held = E.pillow(300, 975, 0.42, 8);
  // the clock: on the nightstand → knocked flying
  const fk = seg(t, B.hit, B.hit + 0.9);
  let clock = '';
  if (fk <= 0) clock = SH.alarmClock(90, 604, 0.72, undefined, { ring: 1, t }) + clockBrows(t, 1);
  else if (fk < 1) clock = S.g(SH.alarmClock(0, 0, 0.72, undefined, { ring: 0.3, t }), tf(90 - 520 * fk, 604 - 520 * fk + 900 * fk * fk, 1, -900 * fk));
  let o = bedroomShot(t, cam, { set: { time: 'morning', tuck: 0.15, alarmClock: false, ring: 0 }, standing: clock + hero + held });
  const hit = toScr(cam, 90, 560);
  o += E.feathers(hit.x, hit.y, t - B.hit, 12, 2);
  o += K.C.burst(hit.x, hit.y, seg(t, B.hit, B.hit + 0.4), '#FFE14D') + K.bang('POW!', hit.x + 60, hit.y - 120, pop(t, B.hit, 0.2) * (1 - seg(t, B.hit + 0.45, B.hit + 0.6)), 130, -10, '#FFD21F');
  o += E.dmgNum('-999', hit.x + 150, hit.y - 10, t - B.hit - 0.05, 96, '#FF3355', 'CRITICAL!');
  const bk = 1 - seg(t, B.hit + 0.6, B.hit + 0.85);
  o += HUD.bossBar({ k: bk, t, name: 'ALARM CLOCK', sub: 'LV 1 · MINI BOSS', value: 0, from: 1, roll: seg(t, B.hit, B.hit + 0.45), hit: seg(t, B.hit, B.hit + 0.35), y: 150, w: 900 });
  o += HUD.systemMsg({ k: seg(t, B.hit + 0.42, B.hit + 0.8), t, theme: 'ok', text: 'ENEMY DEFEATED!', sub: 'LOOT: 5 MORE MINUTES OF SLEEP', x: 1130, y: 300, s: 0.85 });
  o += hud(t) + smash(t, B.hit, 0.1, 0.6);
  return o + whip(t, CUT.fight, -1, 0.08);
}

// ================================================================= KITCHEN
// 18. "The toaster had an eighty percent chance to burn." — BURN CHANCE 80 %
const HERO_TOAST = { x: 880, y: 802, s: 0.46 };
function shToaster(t) {
  const cam = camKeys(t, [[CUT.toaster, camAt(720, 455, 2.2)], [CUT.burned, camAt(705, 430, 2.75)]], ease.in);
  const nerv = seg(t, B.burn - 0.2, B.burn + 0.3);
  const pose = { ...HERO_TOAST, pajamas: true, volume: false, turn: -0.6, lean: -3 - 5 * seg(t, CUT.toaster, B.burned), face: nerv > 0.5 ? { name: 'nervous', fx: ['sweat'], eyes: { look: [-0.8, 0.2] } } : { name: 'sneaky', eyes: { look: [-0.8, 0.3] } }, armL: 14, armR: 10 };
  const hero = actor('you', t, pose, { arms: false });
  let o = kitchenShot(t, cam, { toast: 0.03, burnt: lerp(0.25, 0.7, seg(t, CUT.toaster, B.burned)), smoke: t > B.burn ? t : false, standing: hero });
  const p = toScr(cam, 640, 452);
  const pulse = bump(t, B.burn, B.burn + 0.4) + 0.6 * bump(t, B.eighty + 0.15, B.eighty + 0.5);
  o += HUD.tipFor('toaster', { x: p.x, y: p.y, k: seg(t, B.eighty - 0.28, B.eighty + 0.15), t, s: 1.25 + 0.12 * pulse, dist: 80, dx: -60 });
  o += heroQ(t, cam, pose, 0.7);
  return o + hud(t) + whip(t, CUT.toaster, 1, 0.08);
}

// 19. "It burned." — POP: charcoal toast, smoke in his face, soot, a cough
function shBurned(t) {
  const cam = shakeCam(camKeys(t, [[CUT.burned, camAt(720, 420, 3.0)], [CUT.mom, camAt(735, 412, 3.2)]]), t, [[B.burned, 0.3, 12]]);
  const toast = 0.35 * ease.outBack(seg(t, B.burned, B.burned + 0.2));
  const cough = A[7].b + 0.55;
  const pose = { ...HERO_TOAST, pajamas: true, volume: false, turn: -0.6, lean: -8 + 6 * seg(t, B.burned, B.burned + 0.2), face: t < B.burned + 0.25 ? { name: 'shocked', eyes: { look: [-0.8, 0.2] } } : t < cough ? { name: 'deadpan', eyes: { look: [0.2, 0] } } : { name: 'deadpan', mouth: 'O', eyes: { type: 'closed' } }, armL: 14, armR: 10, ...boing(t, cough, 0.12) };
  const hero = actor('you', t, pose, { arms: false });
  let o = kitchenShot(t, cam, { toast, burnt: 1, smoke: t, standing: hero });
  const ts = toScr(cam, 640, 440);
  const head = headScr(cam, 'you', pose);
  const fc = { x: head.x + 10, y: head.y + 140 * pose.s * cam.zoom };
  // black smoke puffs from the slots into his face
  const sk = seg(t, B.burned + 0.05, B.burned + 0.6);
  if (sk > 0 && sk < 1) o += E.puff(lerp(ts.x, fc.x, ease.out(sk)), lerp(ts.y - 60, fc.y, ease.out(sk)), (t - B.burned) * 0.8, 80, 6, 3, '#3A3640');
  o += E.soot(fc.x, fc.y, 120 * pose.s * cam.zoom * 0.5, seg(t, B.burned + 0.3, B.burned + 0.55));
  o += E.puff(fc.x - 30, fc.y + 40, t - cough, 34, 4, 5, '#55505A');
  o += HUD.tipFor('toaster', { x: ts.x, y: ts.y + 10, k: 1, out: seg(t, B.burned, B.burned + 0.22), t, s: 1.3, dist: 80, dx: -60 });
  o += HUD.tipFor('toast', { x: ts.x - 10, y: ts.y - 30, k: seg(t, B.burned + 0.2, B.burned + 0.6), t, s: 1.35, dist: 70, dx: -140 });
  return o + hud(t) + smash(t, B.burned, 0.1, 0.55);
}

// 20. "Mom was smiling." — the biggest smile in the house (sparkles, humming)
function shMom(t) {
  const cam = camKeys(t, [[CUT.mom, camAt(455, 475, 1.9)], [CUT.momPlate, camAt(445, 455, 2.1)]]);
  const pose = P.mom({ ...NV(cam), face: 'joy', turn: 0.15, bodyY: 4 * Math.sin(t * 5), headRot: 5 * Math.sin(t * 2.5) });
  let o = kitchenShot(t, cam, { standing: actor('mom', t, pose) });
  const h = headScr(cam, 'mom', pose);
  const sk = seg(t, B.smiling - 0.1, B.smiling + 0.5);
  if (sk > 0) o += K.sparkles([[h.x - 170, h.y + 120, 34 * sk], [h.x + 160, h.y + 90, 28 * sk], [h.x + 120, h.y + 260, 22 * sk]], t);
  o += K.C.musicNotes(t, h.x + 170, h.y + 60);
  return o + hud(t) + whip(t, CUT.mom, -1, 0.08);
}

// 21. "Her energy was two percent." — the plate pops; smash-zoom on "two": ENERGY 2 % blinking, low battery
function shMomPlate(t) {
  const sm = t >= B.two - 0.03;
  const cam = shakeCam(sm ? camKeys(t, [[B.two, camAt(440, 395, 2.95)], [CUT.gm, camAt(440, 390, 3.05)]]) : camAt(442, 430, 2.25), t, [[B.two, 0.3, 14]]);
  const pose = P.mom({ volume: false, face: 'joy', turn: 0.15, bodyY: 4 * Math.sin(t * 5), headRot: 5 * Math.sin(t * 2.5) });
  let o = kitchenShot(t, cam, { standing: actor('mom', t, pose) });
  const h = headScr(cam, 'mom', pose);
  const s = ps(cam, 0.95);
  o += HUD.plateFor('mom', { ...h, s, t, k: seg(t, B.energy - 0.32, B.energy + 0.2), bars: [{ label: 'ENERGY', value: 2, bump: bump(t, B.two, B.two + 0.4) }] });
  const bk = pop(t, B.two + 0.05, 0.3);
  if (bk > 0) o += lowBattery(h.x + 250 * s, h.y - 120 * s, t, 1.1 * s * bk);
  if (sm) o += HUD.edgePulse(0, 0, 1920, 1080, 0.5 + 0.5 * Math.sin(t * 10));
  return o + hud(t) + smash(t, B.two - 0.03, 0.12, 0.6) + whip(t, CUT.momPlate, 1, 0.06);
}

// 22. "Good morning, sweetheart!" — Mom waves; he stares at her blinking 2 %
function shGM(t) {
  const cam = camKeys(t, [[CUT.gm, camAt(690, 520, 1.34)], [CUT.coffee, camAt(670, 510, 1.44)]]);
  const mom = P.mom({ turn: 0.45, face: 'joy' });
  const heroPose = { x: 1060, y: 998, s: 0.5, pajamas: true, turn: -0.55, face: { name: 'nervous', fx: ['sweat'], eyes: { look: [-0.7, -0.9] } }, armL: 12, armR: 30 + 30 * bump(t, A[9].a + 0.6, A[9].b), bendR: 40 };
  const fam = family(t, cam, { mom: { ...mom, ...NV(cam) }, momAct: { energy: 1.6 }, max: {}, you: false, gpa: false });
  let o = kitchenShot(t, cam, { seated: fam.seated, standing: fam.standing + actor('you', t, { ...heroPose, ...NV(cam) }, { arms: false }) });
  const h = headScr(cam, 'mom', mom);
  o += HUD.plateFor('mom', { ...h, s: ps(cam, 0.95), t, bars: [{ label: 'ENERGY', value: 2 }] });
  o += heroQ(t, cam, heroPose, 0.7);
  return o + hud(t) + whip(t, CUT.gm, -1, 0.08);
}

// 23. "Each coffee gave her one percent." — sip, +1 % ENERGY flies into the bar; sip again
function sipK(t, i) { const s0 = B.sips[i]; return t >= s0 - 0.2 && t < s0 + 0.55; }
function shCoffee(t) {
  const cam = camKeys(t, [[CUT.coffee, camAt(450, 440, 2.35)], [CUT.four, camAt(440, 430, 2.5)]]);
  const sipping = sipK(t, 0) || sipK(t, 1);
  const pose = P.mom({ volume: false, coffee: sipping ? 'sip' : true, face: sipping ? { name: 'joy', eyes: { type: 'closed' } } : 'joy', turn: 0.2 });
  let o = kitchenShot(t, cam, { standing: actor('mom', t, pose) });
  const h = headScr(cam, 'mom', pose);
  const s = ps(cam, 0.95);
  o += HUD.plateFor('mom', { ...h, s, t, bars: [energy(t)] });
  const mug = sipping ? toScr(cam, 474, 526) : toScr(cam, 443, 583);   // the mug in her hand (the coffee preset owns the arm)
  const mugPop = toScr(cam, 474, 520);
  o += HUD.tipFor('coffee', { x: mug.x - 30, y: mug.y - 10, k: seg(t, CUT.coffee + 0.05, CUT.coffee + 0.45), out: seg(t, B.sips[1] + 0.5, B.sips[1] + 0.8), t, s: 1.05, side: 'left', dist: 150, dy: 50 });
  for (let i = 0; i < 2; i++) o += HUD.xpPop({ x: mugPop.x, y: mugPop.y - 60, age: t - B.sips[i], text: '+1% ENERGY', col: '#FFE14D', to: [h.x + 40 * s, h.y - 70 * s], s: 0.9 });
  return o + hud(t) + whip(t, CUT.coffee, 1, 0.08);
}

// 24. "She drank four." — chug, chug: mugs slam onto the counter, ×4
function shFour(t) {
  const sl = [B.sips[0], B.sips[1], ...B.slams];
  const cam = shakeCam(camKeys(t, [[CUT.four, camAt(330, 450, 1.85)], [CUT.six, camAt(335, 440, 2.0)]]), t, [[sl[2], 0.2, 8], [sl[3], 0.2, 10]]);
  const chug = (t >= B.sips[2] - 0.15 && t < B.sips[2] + 0.3) || (t >= B.sips[3] - 0.15 && t < B.sips[3] + 0.4);
  const pose = P.mom({ volume: false, coffee: chug ? 'sip' : true, face: chug ? { name: 'joy', eyes: { type: 'closed' } } : 'joy', turn: 0.1, headRot: chug ? -12 : 0, ...boing(t, B.sips[2], 0.08), ...(t > B.sips[3] ? boing(t, B.sips[3], 0.1) : {}) });
  const n = 2 + (t >= sl[2] - 0.18 ? 1 : 0) + (t >= sl[3] - 0.18 ? 1 : 0);
  let o = kitchenShot(t, cam, { props: momMugs(t, n, [undefined, undefined, sl[2], sl[3]]), standing: actor('mom', t, pose) });
  const h = headScr(cam, 'mom', pose);
  o += HUD.plateFor('mom', { ...h, s: ps(cam, 0.9), t, bars: [energy(t)] });
  [2, 3].forEach((i) => { o += E.dmgNum('+1%', h.x - 150, h.y + 200, t - B.sips[i] - 0.1, 64, '#3DFF8F'); });
  const m0 = toScr(cam, 260, 470);
  const ck = pop(t, sl[2], 0.25);
  if (ck > 0) o += S.g(TS(`x${n}`, 0, 0, 78, '#FFD21F'), tf(m0.x - 10, m0.y - 60, ck * (1 + 0.2 * bump(t, sl[3], sl[3] + 0.25)), -8));
  if (chug) o += K.C.speedLines(h.x - 330, h.x - 200, h.y + 180, 5, Math.floor(t * 12), '#FFFFFF', 160);
  return o + hud(t) + whip(t, CUT.four, -1, 0.08);
}

// 25. "Six percent. A new record." — the bar on 6 %, NEW RECORD! (she dozes off, still smiling)
function shSix(t) {
  const cam = camKeys(t, [[CUT.six, camAt(432, 425, 2.55)], [CUT.gpa, camAt(430, 418, 2.68)]]);
  const doze = t >= B.doze;
  const pose = P.mom({ volume: false, coffee: true, asleep: doze, face: doze ? undefined : 'joy', headRot: doze ? 6 : 0 });
  let o = kitchenShot(t, cam, { props: momMugs(t, 4), standing: actor('mom', t, pose) });
  const h = headScr(cam, 'mom', pose);
  const s = ps(cam, 0.95);
  o += HUD.plateFor('mom', { ...h, s, t, bars: [{ label: 'ENERGY', value: 6, bump: bump(t, B.six, B.six + 0.4) }] });
  const rk = seg(t, B.record - 0.08, B.record + 0.25);
  if (rk > 0) {
    o += K.rays(h.x, h.y - 120 * s, 16, 700, '#FFE88A', 0.14 * rk, t * 40);
    o += E.stamp('NEW RECORD!', h.x + 300, h.y - 20, rk, { size: 60, rot: -9 });
    o += K.confetti(t, B.record, 46, 5);
  }
  return o + hud(t) + smash(t, CUT.six, 0.1, 0.45);
}

// 26. "Grandpa was level eighty-seven." — the plate (crown, LEGEND (RETIRED)); a flex on "eighty-seven"
function shGpa(t) {
  const cam = camKeys(t, [[CUT.gpa, camAt(1462, 470, 2.4)], [CUT.max, camAt(1462, 452, 2.6)]]);
  const flex = t >= B.e87 - 0.12;
  const pose = P.gpa({ volume: false, ...(flex ? { armwrestle: 'flex', ...boing(t, B.e87 - 0.12, 0.1) } : { face: { name: 'happy', mouth: Math.floor(t * 6) % 2 ? 'smile' : 'line' } }) });
  const fam = family(t, cam, { max: false, you: {}, gpa: false });
  let o = kitchenShot(t, cam, { seated: fam.seated + actor('grandpa', t, pose) });
  const h = headScr(cam, 'grandpa', pose);
  const s = ps(cam, 0.95), bz = 0.14 * bump(t, B.e87, B.e87 + 0.35);
  o += S.g(HUD.plateFor('grandpa', { x: 0, y: 0, s, t, k: seg(t, B.gpa - 0.15, B.gpa + 0.4) }), `translate(${f(h.x)} ${f(h.y)}) scale(${f(1 + bz)})`);
  o += HUD.sparkleBurst(h.x - 100 * s, h.y - 120 * s, seg(t, B.e87, B.e87 + 0.5), 170, 9, '#FFE9A0', 2);
  return o + hud(t) + whip(t, CUT.gpa, 1, 0.08);
}

// 27. "And Max had infinite health." — CHAOS 9999 overflow + HP ∞; RAWR on "health"
function shMax(t) {
  const cam = camKeys(t, [[CUT.max, camAt(955, 485, 2.5)], [CUT.stare, camAt(955, 470, 2.68)]]);
  const roar = t >= B.health - 0.08;
  const pose = P.max({ volume: false, roar, bodyY: roar ? 0 : -10 * Math.abs(Math.sin(t * 9)), ...(roar ? boing(t, B.health - 0.08, 0.14) : { face: 'excited' }) });
  const fam = family(t, cam, { max: false, you: {}, gpa: false });
  let o = kitchenShot(t, cam, { seated: actor('max', t, pose) + fam.seated });
  const h = headScr(cam, 'max', pose);
  const s = ps(cam, 0.9);
  const ib = bump(t, B.inf, B.inf + 0.5);
  o += HUD.plateFor('max', { ...h, s, t, k: seg(t, B.max - 0.25, B.max + 0.3), bars: [{ label: 'CHAOS', value: 9999, max: 100 }, { label: 'HP', value: Infinity, bump: ib }] });
  if (ib > 0) o += star4(h.x + 120 * s, h.y - 75 * s, 46 * ib, t * 200, '#FFFFFF') + star4(h.x - 60 * s, h.y - 80 * s, 30 * ib, t * 200 + 40, '#BFFFFF');
  if (roar) o += K.bang('RAWR!', h.x + 230, h.y + 210, pop(t, B.health - 0.05, 0.25), 90, 8, '#7CFF6B');
  return o + hud(t) + whip(t, CUT.max, -1, 0.08);
}

// 28. "Why are you staring at the top of my head?" — the hero gawps up; Grandpa turns, suspicious
function shStare(t) {
  const cam = camKeys(t, [[CUT.stare, camAt(1338, 472, 2.25)], [CUT.top, camAt(1350, 468, 2.38)]]);
  const you = { volume: false, face: { name: 'amazed', eyes: { look: [0.75, -1] } }, headRot: 8, turn: 0.2 };
  const gpa = { volume: false, turn: -0.45 * seg(t, CUT.stare, CUT.stare + 0.4) };
  const fam = family(t, cam, { you, youAct: { arms: false }, gpa, max: false });
  let o = kitchenShot(t, cam, { seated: fam.seated });
  o += HUD.plateFor('grandpa', { ...headScr(cam, 'grandpa', P.gpa(gpa)), s: ps(cam, 0.85), t });
  return o + hud(t) + whip(t, CUT.stare, 1, 0.08);
}

// 29. "…the top of my head?" — his eyes roll up; he swats at the air: his hand goes right through the plate
function shTop(t) {
  const cam = camKeys(t, [[CUT.top, camAt(1462, 482, 2.8)], [CUT.noreason, camAt(1462, 478, 2.95)]]);
  const sw = bump(t, B.head - 0.3, B.head + 0.45);
  const pose = P.gpa({ volume: false, face: { name: 'sneaky', eyes: { look: [0.1, -1] } }, armR: 20 + 150 * sw, bendR: 30 * sw, headRot: -4 });
  let o = kitchenShot(t, cam, { seated: actor('grandpa', t, pose, { arms: false }) });
  const h = headScr(cam, 'grandpa', pose);
  const wob = bump(t, B.head - 0.05, B.head + 0.5);
  o += HUD.plateFor('grandpa', { x: h.x + 40 * wob * Math.sin(t * 40), y: h.y, s: ps(cam, 0.85), t, glitch: 0.8 * wob });
  return o + hud(t, { glitch: 0.15 * wob }) + whip(t, CUT.top, -1, 0.06);
}

// 30. "No reason! Nice... hair, Grandpa." — the head shake, the eyes dart up, a forced grin + thumbs up
function shNoReason(t) {
  const cam = camKeys(t, [[CUT.noreason, camAt(1212, 486, 2.8)], [CUT.nohair, camAt(1210, 482, 3.0)]]);
  const a = A[13].a;
  const shake = 14 * Math.sin((t - a) * 32) * (1 - seg(t, a + 0.45, a + 0.7)) * (t >= a ? 1 : 0);
  const thumbs = seg(t, B.hair - 0.15, B.hair + 0.1);
  const face = t < B.nice - 0.05 ? { name: 'nervous', fx: ['sweat'] } : t < B.hair - 0.05 ? { name: 'nervous', eyes: { look: [0.7, -0.9] } } : { name: 'happy', mouth: 'teeth', fx: ['sweat'] };
  const pose = P.you({ volume: false, face, headRot: shake, armR: 20 + 110 * thumbs, bendR: 50 * thumbs, armL: 14 });
  let o = kitchenShot(t, cam, { seated: actor('you', t, pose, { arms: false }) });
  if (thumbs > 0.8) { const s = toScr(cam, ...CAST.handPos('you', pose, 1)); o += star4(s.x + 30, s.y - 40, 30 * bump(t, B.hair + 0.05, B.hair + 0.6), t * 200, '#FFFFFF'); }
  o += heroQ(t, cam, pose, 0.72);
  return o + hud(t) + whip(t, CUT.noreason, 1, 0.06);
}

// 31. "I don't have hair." — deadpan; the bald dome glints; HAIR · FOUND: 0
function shNoHair(t) {
  const cam = camKeys(t, [[CUT.nohair, camAt(1462, 480, 2.9)], [CUT.watch, camAt(1462, 476, 3.05)]]);
  const pose = P.gpa({ volume: false, face: { name: 'deadpan', eyes: { upper: 0.5 } } });
  let o = kitchenShot(t, cam, { seated: actor('grandpa', t, pose) });
  const h = headScr(cam, 'grandpa', pose);
  o += HUD.plateFor('grandpa', { ...h, s: ps(cam, 0.8), t, fade: seg(t, B.hair2 - 0.3, B.hair2 + 0.1) * 0.85 });
  const gk = bump(t, B.hair2 - 0.05, B.hair2 + 0.5);
  if (gk > 0) o += star4(h.x - 50, h.y + 50, 70 * gk, t * 120, '#FFFFFF');
  o += HUD.tooltip({ x: h.x + 60, y: h.y + 40, k: seg(t, B.hair2, B.hair2 + 0.4), t, s: 1.25, title: 'HAIR', rarity: 'mystery', lines: [{ label: 'FOUND: ', value: '0', col: '#FF4D66' }], side: 'right', dist: 120, dy: -60 });
  return o + hud(t) + whip(t, CUT.nohair, -1, 0.06);
}

// 32. "Watch this!" — Max stands on his booster, arms up; CHAOS overflows harder
function maxStand(t, extra = {}) { return { ...MAXSTAND, ...extra }; }
function shWatch(t) {
  const cam = camKeys(t, [[CUT.watch, camAt(1010, 445, 2.0)], [CUT.jump, camAt(990, 436, 2.12)]]);
  const up = ease.outBack(seg(t, CUT.watch, CUT.watch + 0.3));
  const pose = maxStand({ volume: false, armL: 20 + 140 * up, armR: 20 + 140 * up, face: 'excited', bodyY: -6 * Math.abs(Math.sin(t * 10)), lift: 20 * up });
  const fam = family(t, cam, { max: false, you: { volume: false, turn: -0.5, face: { name: 'nervous', eyes: { look: [-0.9, -0.6] } } }, youAct: { arms: false }, gpa: false });
  let o = kitchenShot(t, cam, { seated: actor('max', t, pose, { arms: false }) + fam.seated });
  const h = headScr(cam, 'max', pose);
  o += HUD.plateFor('max', { ...h, s: ps(cam, 0.85), t, bars: [{ label: 'CHAOS', value: 9999, max: 100, bump: bump(t, A[15].a, A[15].b) }, { label: 'HP', value: Infinity }] });
  return o + hud(t) + whip(t, CUT.watch, 1, 0.08);
}

// 33. the flip into the cereal — SPLASH! (milk everywhere)
function maxFlight(t) {
  const u = seg(t, B.launchM, B.splash);
  if (u <= 0) return { ...MAXSTAND, armL: 160, armR: 160, face: 'excited', bodyY: 16 };   // crouch
  if (u < 1) {
    const e = ease.inOut(u);
    return { x: lerp(948, 952, e), y: lerp(MAXSTAND.y, 696, e) - 330 * Math.sin(Math.PI * Math.pow(u, 0.8)), s: 0.45, rot: -360 * e, armL: 170, armR: 170, face: { name: 'excited', mouth: 'O' }, legL: 30, legR: -30 };
  }
  return { x: 952, y: 708, s: 0.45, armL: 150, armR: 150, face: { name: 'joy' } };
}
function shJump(t) {
  const cam = shakeCam(camKeys(t, [[CUT.jump, camAt(1200, 470, 1.5)], [CUT.immune, camAt(1180, 480, 1.56)]]), t, [[B.splash, 0.5, 24]]);
  const mess = ease.out(seg(t, B.splash, B.splash + 0.4));
  const after = t >= B.splash;
  const shocked = { name: 'shocked' };
  const fam = family(t, cam, { max: false, you: after ? { face: shocked } : { face: { name: 'nervous', eyes: { look: [-0.9, -0.8] } } }, gpa: after ? { face: shocked } : { face: { name: 'shocked', eyes: { look: [-1, -0.8] } } } });
  const mp = maxFlight(t);
  const maxSvg = actor('max', t, { ...mp, ...NV(cam) }, { arms: false });
  const inFront = t >= B.launchM + 0.15;
  const bowlSvg = after ? SH.bowl(952, 690, 1.25, TNK, { col: '#5FC46A', fill: 'milk', splash: seg(t, B.splash, B.splash + 0.8) }) : '';
  let o = kitchenShot(t, cam, { mess, seated: fam.seated + (inFront ? '' : maxSvg), standing: (inFront ? maxSvg : '') + bowlSvg });
  if (!after && t > B.launchM) o += K.C.speedLines(0, 1800, 500, 5, Math.floor(t * 14), '#FFFFFF', 600);
  if (after) {
    const fy = toScr(cam, 1205, 470), fg = toScr(cam, 1462, 480);
    o += E.milkSplats(fy.x, fy.y, seg(t, B.splash + 0.08, B.splash + 0.25), 4, 14, 3) + E.milkSplats(fg.x, fg.y + 30, seg(t, B.splash + 0.1, B.splash + 0.28), 5, 16, 6);
    const bp = toScr(cam, 952, 600);
    o += K.bang('SPLASH!', bp.x + 40, bp.y - 200, pop(t, B.splash, 0.25), 140, -8, '#7FD8FF');
  }
  o += HUD.plateFor('max', { ...headScr(cam, 'max', { ...mp, rot: 0 }), s: ps(cam, 0.8), t, fade: after ? 0 : bump(t, B.launchM, B.splash) * 0.7, bars: [{ label: 'CHAOS', value: 9999, max: 100 }, { label: 'HP', value: Infinity }] });
  return o + hud(t) + smash(t, B.splash, 0.14, 0.8) + whip(t, CUT.jump, -1, 0.06);
}

// 34. −50 … NO DAMAGE — Max grins in his milk bowl, cereal on his hood
function shImmune(t) {
  const cam = camKeys(t, [[CUT.immune, camAt(1000, 505, 2.0)], [CUT.wow, camAt(995, 500, 2.1)]]);
  const pose = { x: 952, y: 708, s: 0.45, volume: false, armL: 150 + 10 * Math.sin(t * 8), armR: 150 - 10 * Math.sin(t * 8), face: { name: 'joy' }, bodyY: -6 * Math.abs(Math.sin(t * 7)) };
  const fam = family(t, cam, { max: false, you: { face: 'shocked' }, gpa: false });
  const hd = CAST.headTop('max', pose);
  let o = kitchenShot(t, cam, { mess: 1, seated: fam.seated, standing: actor('max', t, pose, { arms: false }) + E.cerealRings(hd.x, hd.y + 40, 60, 5, 7, 0.9) + SH.bowl(952, 690, 1.25, TNK, { col: '#5FC46A', fill: 'milk' }) + E.milkSplats(952, 700, 1, 5, 18, 9) });
  const h = headScr(cam, 'max', pose);
  const s = ps(cam, 0.9);
  const d0 = CUT.immune + 0.1;
  o += HUD.plateFor('max', { ...h, s, t, bars: [{ label: 'CHAOS', value: 9999, max: 100 }, { label: 'HP', value: Infinity, bump: bump(t, d0, d0 + 0.3) }] });
  o += E.dmgNum('-50', h.x + 200, h.y - 60, t - d0, 80, '#FF3355');
  o += E.stamp('NO DAMAGE', h.x - 40, h.y + 30, seg(t, d0 + 0.3, d0 + 0.55), { size: 40, col: '#B9FFD0', ink: '#0B3A1E', rot: 7, stars: false });
  return o + hud(t);
}

// 35. "This... is..." — the whole kitchen of stats; he looks around in awe
function shWow(t) {
  const cam = camKeys(t, [[CUT.wow, camAt(1010, 530, 1.06)], [CUT.amazing, camAt(985, 530, 0.98)]]);
  const look = Math.sin((t - CUT.wow) * 2.2);
  const fam = family(t, cam, {
    max: false, you: { face: { name: 'amazed', eyes: { look: [look, -0.6] } }, headRot: 6 * look }, gpa: { face: { name: 'shocked', eyes: { look: [-0.6, 0] } } },
    mom: { coffee: true, face: 'joy' }, dog: { face: 'happy', tongue: true, look: -0.4 }, flat: true,
  });
  const mx = { x: 952, y: 708, s: 0.45, volume: false, armL: 140, armR: 140, face: 'joy', bodyY: -5 * Math.abs(Math.sin(t * 7)) };
  let o = kitchenShot(t, cam, { mess: 1, toast: 0.35, burnt: 1, props: momMugs(t, 4), seated: fam.seated, standing: fam.standing + actor('max', t, mx, { arms: false }) + SH.bowl(952, 690, 1.25, TNK, { col: '#5FC46A', fill: 'milk' }) });
  const s = ps(cam, 0.8);
  o += HUD.plateFor('mom', { ...headScr(cam, 'mom', P.mom()), s, t, bars: [{ label: 'ENERGY', value: 6 }] });
  o += HUD.plateFor('grandpa', { ...headScr(cam, 'grandpa', P.gpa()), s, t });
  o += HUD.plateFor('max', { ...headScr(cam, 'max', mx), s, t });
  const tp = toScr(cam, 640, 440), cp = toScr(cam, 952, 640);
  o += HUD.tipFor('toast', { x: tp.x, y: tp.y, t, s: 0.8, dist: 50, k: seg(t, CUT.wow + 0.1, CUT.wow + 0.5) });
  o += HUD.tipFor('cereal', { x: cp.x, y: cp.y, t, s: 0.8, side: 'down', dist: 150, dx: -80, k: seg(t, CUT.wow + 0.3, CUT.wow + 0.7) });
  o += heroQ(t, cam, P.you(), 0.7);
  return o + hud(t);
}

// 36. "AMAZING." — smash-zoom: star eyes, rays, the "???" bobbing over him
function shAmazing(t) {
  const cam = camKeys(t, [[CUT.amazing, camAt(1205, 492, 3.3)], [CUT.biscuit, camAt(1205, 489, 3.5)]]);
  const pose = P.you({ volume: false, face: { name: 'amazed', eyes: { type: 'star' } }, ...boing(t, B.amazing, 0.12) });
  const hd = headScr(cam, 'you', pose);
  const behind = K.rays(hd.x, hd.y + 160, 18, 1400, '#FFF2B0', 0.16, t * 25);
  let o = kitchenShot(t, cam, { mess: 1, screenBehind: behind, seated: actor('you', t, pose) });
  const fc = { x: hd.x, y: hd.y + 150 * pose.s * cam.zoom };
  o += E.milkSplats(fc.x + 90, fc.y + 60, 1, 3, 12, 11);
  o += K.sparkles([[hd.x - 280, hd.y + 120, 40], [hd.x + 300, hd.y + 60, 34], [hd.x + 250, hd.y + 360, 26], [hd.x - 300, hd.y + 380, 24]], t);
  o += heroQ(t, cam, pose, 0.7);
  return o + hud(t) + smash(t, CUT.amazing, 0.12, 0.6);
}

// 37. "Biscuit's stats didn't even load." — licking milk; LOADING STATS... stuck at 99 %
function shBiscuit(t) {
  const cam = camKeys(t, [[CUT.biscuit, camAt(1640, 862, 2.45)], [CUT.error, camAt(1640, 856, 2.6)]]);
  const tilt = t >= B.load ? 0.5 : 0;
  const dog = K.draw.biscuit({ ...P.dog(), t, face: 'happy', tongue: true, look: tilt ? [0.4, -0.6] : [0, 0.6], rot: tilt * 8 * Math.min(1, (t - B.load) * 4), wag: 0.8 });
  const puddle = S.ellipse(1640, 1000, 120, 16, { fill: '#FFFDF6', stroke: '#C9C2B0', 'stroke-width': 3 }) + E.cerealRings(1600, 996, 60, 3, 4, 0.8);
  let o = kitchenShot(t, cam, { mess: 1, standing: puddle + dog });
  const h = headScr(cam, 'biscuit', P.dog());
  const pct = Math.min(0.99, 1.2 * ease.out(seg(t, CUT.biscuit + 0.15, CUT.biscuit + 0.9)));
  o += E.loadingPlate(h.x, h.y, seg(t, CUT.biscuit, CUT.biscuit + 0.35), t, { s: 1.25, stall: t >= B.load, pct });
  return o + hud(t) + whip(t, CUT.biscuit, 1, 0.08);
}

// 38. "Error. Too good." — the ERROR plate slams, the HUD glitches; "good": the VERY good boy face
function shError(t) {
  const g = 0.7 * (1 - seg(t, B.error, B.error + 0.55));
  const cam = shakeCam(camKeys(t, [[CUT.error, camAt(1640, 852, 2.75)], [CUT.end, camAt(1640, 848, 2.9)]]), t, [[B.error, 0.4, 14]]);
  const good = t >= B.good - 0.05;
  const dog = K.draw.biscuit({ ...P.dog(), t, face: good ? 'good' : 'shocked', wag: good ? 1 : 0.3, ears: 1, ...(good ? {} : { look: [0, -0.4] }) });
  let o = kitchenShot(t, cam, { mess: 1, standing: dog });
  const h = headScr(cam, 'biscuit', P.dog());
  o += HUD.plateFor('biscuitError', { ...h, s: 1.35, t, k: seg(t, B.error - 0.04, B.error + 0.3) });
  if (good) o += K.sparkles([[h.x - 170, h.y + 120, 36], [h.x + 180, h.y + 80, 30], [h.x + 140, h.y + 300, 24]], t);
  o += tint('#FF2EC4', 0.28 * (1 - seg(t, B.error, B.error + 0.3)));
  return o + hud(t, { glitch: g }) + smash(t, B.error, 0.1, 0.5);
}

// 39. the hero kneels by Biscuit and pets him; the ERROR plate keeps glitching → white whip into SC 04
function shEnd(t) {
  const cam = camKeys(t, [[CUT.end, camAt(1520, 760, 1.75)], [END, camAt(1505, 752, 1.86)]]);
  const pat = Math.sin((t - CUT.end) * 9);
  const pose = { x: 1405, y: 998, s: 0.5, pajamas: true, volume: false, view: 'side', flip: true, legL: 70, kneeL: 110, legR: 20, kneeR: 120, lift: -70, lean: 10, armL: 62 + 9 * pat, armR: -20, face: { name: 'joy' } };
  const dog = K.draw.biscuit({ ...P.dog(), t, face: 'good', wag: 1, look: [-0.6, -0.4], rot: -3 - 3 * pat });
  let o = kitchenShot(t, cam, { mess: 1, standing: dog + actor('you', t, pose, { arms: false }) });
  const h = headScr(cam, 'biscuit', P.dog());
  const spike = Math.sin(t * 2.3) > 0.93 ? 1 : 0;
  o += HUD.plateFor('biscuitError', { x: h.x + 40, y: h.y, s: 1.05, t, glitch: 0.4 * spike });
  o += heroQ(t, cam, { ...pose, lift: -70 }, 0.65);
  o += K.sparkles([[h.x - 110, h.y + 200, 22 * (0.5 + 0.5 * pat)], [h.x + 120, h.y + 120, 18]], t);
  return o + hud(t, { glitch: 0.2 * spike }) + whipOut(t, END, 0.15);
}

// ---------------------------------------------------------------- the shot list
const SHOTS = [
  [CUT.desk, shDesk, 'night'], [CUT.screen, shScreen, null], [CUT.night, shNight, 'night'], [CUT.terms, shTerms, null], [CUT.flood, shFlood, 'night'],
  [CUT.accept, shAccept, 'night'], [CUT.page, shPage, 'night'], [CUT.install, shInstall, null], [CUT.burst, shBurst, 'night'], [CUT.house, shHouse, 'night'],
  [CUT.wake, shWake, 'warm'], [CUT.pov, shPOV, 'warm'], [CUT.bed, shBed, 'warm'], [CUT.sock, shSock, 'warm'], [CUT.alarm, shAlarm, 'warm'],
  [CUT.vs, shVS, null], [CUT.fight, shFight, 'warm'], [CUT.toaster, shToaster, 'warm'], [CUT.burned, shBurned, 'warm'], [CUT.mom, shMom, 'warm'],
  [CUT.momPlate, shMomPlate, 'warm'], [CUT.gm, shGM, 'warm'], [CUT.coffee, shCoffee, 'warm'], [CUT.four, shFour, 'warm'], [CUT.six, shSix, 'warm'],
  [CUT.gpa, shGpa, 'warm'], [CUT.max, shMax, 'warm'], [CUT.stare, shStare, 'warm'], [CUT.top, shTop, 'warm'], [CUT.noreason, shNoReason, 'warm'],
  [CUT.nohair, shNoHair, 'warm'], [CUT.watch, shWatch, 'warm'], [CUT.jump, shJump, 'warm'], [CUT.immune, shImmune, 'warm'], [CUT.wow, shWow, 'warm'],
  [CUT.amazing, shAmazing, 'warm'], [CUT.biscuit, shBiscuit, 'warm'], [CUT.error, shError, 'warm'], [CUT.end, shEnd, 'warm'],
];
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x[0]) s = x; return s; };

module.exports = {
  scene(t) { return shotAt(t)[1](t); },
  look(t) { const g = shotAt(t)[2]; return g ? { grade: g, vignette: g === 'night' ? 0.8 : 0.6 } : { grade: null, vignette: 0.5 }; },
  CUT, BEATS: B, SHOTS: SHOTS.map((s) => [s[0], s[1].name]),
};
