// SC 04 · ЛОББИ — the spawn plaza (music `lobby`, `silence` drop-outs, `chaos` for the flood). The family pops in on the
// spawn pads with the stacked "joined the server" toasts (synced to SYSTEM), the hero's horror, the whole server slowly
// turning to stare, smash-zooms on Every. Single. Name.; Dad's CAPS LOCK (the key + LED), "HELLO SON. IT IS DAD. LOVE,
// DAD." typed letter by letter with his voice (split: the real Dad pecking | the hot dog's bubble), the players' "lol",
// Noodle "is that your DAD?!", the hero whisper-panicking from his PC chair → RULE NUMBER ONE smash; Mom finds the emote
// wheel on her tablet → the air kiss, hearts fly at the hero, the crowd "awww"; DarkBlade + clan stride in ("the legend
// brought his MOMMY") → dead silence, a cube tumbleweed, Mom's glasses glint; "Dad's got this" → the hot dog marches into
// the obby wall (BONK, walks in place), "Spacebar!" whisper, "SPACE! BAR!" yelled at the laptop, the untouched space bar
// with a cobweb, the family covering their ears, the finger pecking "DEAR EVERYONE." → the chat log → the FLOOD of 50
// "SPACEBAR" (typing dots over every head, smash-zoom on the log); the hero hoods up, dashes to the hide tree: "I'm a tree"
// (arms up as branches) — the family strolls over and parks right next to the tree (SC 05 starts there).
'use strict';

const K = require('./kit');
const G = require('./gameui');
const R = require('./respawn');
const H = require('./sets_house');
const GS = require('./sets_game');
const X = require('../rig/extras');
const AC = require('./acting');
const E = require('./s03_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, camAt, shakeCam, boing, whip, smash, zoomLines, streaks, tint, panel, panelTag, splitBg, hand, hunt, LR, PZ, sAt, mark, famRoom, keyboardShot } = E;

const A = Array.from({ length: 15 }, (_, i) => L('04.' + i));
const T0 = K.V.scene('SC 04').start, END = K.V.scene('SC 05').start;   // == main.js RANGES for SC 04
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const KB = H.SPOTS.keyboardClose;

// ---------------------------------------------------------------- cuts (all from the voice)
const CUT = {};
CUT.spawnDad = T0;
CUT.spawnMom = w(0, 'MOM_OFFICIAL') - 0.4;
CUT.spawnGran = w(0, 'GrannyGoodies') - 0.4;
CUT.horror = A[0].b - 0.1;
CUT.turn = A[1].a - 0.1;
CUT.names = w(1, 'Every') - 0.08;
CUT.caps = A[2].a - 0.5;
CUT.hello = w(2, 'HELLO') + 0.35;
CUT.itIsDad = w(2, 'IT') - 0.12;
CUT.loveDad = w(2, 'LOVE') - 0.15;
CUT.noodle = A[3].a - 0.12;
CUT.whisper = A[4].a - 0.1;
CUT.ruleOne = w(4, 'RULE', 1) - 0.12;
CUT.emote = A[5].a - 0.1;
CUT.wheel = w(5, 'emote') - 0.25;
CUT.kiss = A[6].a - 0.15;
CUT.love = w(6, 'Love') - 0.12;
CUT.dark = A[7].a - 0.15;
CUT.silence = A[7].b + 0.05;
CUT.dadGot = A[8].a - 0.1;
CUT.wall = w(8, "Dad's") - 0.15;
CUT.spacebar = A[9].a - 0.1;
CUT.spaceBar = A[10].a - 0.12;
CUT.notPress = A[11].a - 0.1;
CUT.saidIt = w(11, 'He', 1) - 0.12;
CUT.toComp = w(11, 'To') - 0.12;
CUT.dear = A[12].a - 0.12;
CUT.where = w(12, 'WHERE') - 0.25;
CUT.flood = A[13].a - 0.06;
CUT.flood2 = w(13, 'Fifty', 1) - 0.1;
CUT.hood = A[13].b + 0.25;
CUT.tree = A[14].a - 0.12;
{ const ks = Object.keys(CUT); for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2; }

// ---------------------------------------------------------------- beats
const B = {};
B.dad = w(0, 'DadBod1978') + 0.02; B.mom = w(0, 'MOM_OFFICIAL') + 0.02; B.gran = w(0, 'GrannyGoodies') + 0.02;
B.every = w(1, 'Every'); B.single = w(1, 'Single'); B.name = w(1, 'Name');
B.capsKey = CUT.caps + 0.2;
B.lol1 = A[2].b + 0.15; B.lol2 = A[2].b + 0.6;
B.rule = [w(4, 'RULE', 1), w(4, 'NUMBER', 1), w(4, 'ONE', 1)];
B.found = w(5, 'found'); B.btn = w(5, 'button') + 0.1;
B.mwah = w(6, 'Mwah'); B.aww = A[6].b + 0.1;
B.ha = w(7, 'Ha'); B.mommy = w(7, 'MOMMY');
B.bonk = CUT.wall + 0.85; B.how = w(8, 'How');
B.space = w(10, 'SPACE'); B.bar = w(10, 'BAR');
B.loud = w(11, 'Very');
B.send = A[12].b + 0.05;
B.answered = w(13, 'answered'); B.same = w(13, 'same'); B.spacebarW = w(13, 'SPACEBAR');
B.hoodUp = CUT.hood + 0.2; B.dash = CUT.hood + 0.55;
B.tree1 = w(14, 'tree'); B.tree2 = w(14, 'tree', 1);
B.famIn = A[14].b + 0.05;           // the family strolls over to the tree
B.hide = END - 0.75;                 // the hero ducks back behind the tree (SC 05 starts with him hidden)

// ---------------------------------------------------------------- where everyone stands
const PAD = { dad: PZ.pads[0], mom: PZ.pads[1], gran: PZ.pads[2] };
const HERO = { x: 800, y: 985, s: sAt(985) }, NOODLE = { x: 1010, y: 978, s: sAt(978) };
const DB = { x: 1200, y: 975, s: sAt(975) };
const CLAN = [{ x: 1330, y: 905, i: 0 }, { x: 1470, y: 935, i: 1 }, { x: 1100, y: 885, i: 2 }, { x: 1560, y: 890, i: 3 }].map((c) => ({ ...c, s: sAt(c.y) * 0.95 }));
const WALLD = PZ.wall.dad;                                        // the hot dog at the obby wall (side, facing right)
const TREE = PZ.tree;
const FAM_END = { dad: { x: -170, y: 930 }, mom: { x: 40, y: 915 }, gran: { x: 230, y: 935 } };   // SC 05's first frame

// the joined toasts (screen space, top right)
const toasts = (t) => (t < CUT.caps + 0.6 ? G.joinStack(t, [{ user: 'DadBod1978', at: B.dad - 0.1 }, { user: 'MOM_OFFICIAL', at: B.mom - 0.1 }, { user: 'GrannyGoodies', at: B.gran - 0.1 }], { x: 1880, y: 90, hold: CUT.caps - B.gran + 0.5, s: 0.95 }) : '');

// spawn pop (age since the spawn) wrapped around an actor
function popped(t, tSpawn, p, draw, col) {
  const age = t - tSpawn;
  if (age < -0.32) return '';
  let o = R.respawnPop({ x: p.x, y: p.y, s: p.s, age, col, part: 'back' });
  const pp = R.popPose(age, p.s);
  if (!pp.hidden) o += draw({ sx: pp.sx, sy: pp.sy, lift: pp.lift });
  return o + R.respawnPop({ x: p.x, y: p.y, s: p.s, age, col, part: 'front' });
}
const HAPPY = { name: 'happy', mouth: 'smile' };
// the family on their pads (o.dad / o.mom / o.gran = pose extras or false)
function family(t, o = {}) {
  let s = '';
  if (o.dad !== false) s += popped(t, B.dad, PAD.dad, (pp) => actor('dadAvatar', t, { ...PAD.dad, ...pp, armR: 20 + 120 * bump(t, B.dad + 0.4, B.dad + 1.6) + 30 * Math.sin(t * 10) * bump(t, B.dad + 0.4, B.dad + 1.6), face: HAPPY, ...(o.dad || {}) }), '#F2B705');
  if (o.mom !== false) s += popped(t, B.mom, PAD.mom, (pp) => actor('momAvatar', t, { ...PAD.mom, ...pp, armR: 16 + 70 * bump(t, B.mom + 0.4, B.mom + 1.4), face: HAPPY, ...(o.mom || {}) }), '#FF5FA8');
  if (o.gran !== false) s += popped(t, B.gran, PAD.gran, (pp) => actor('grandmaAvatar', t, { ...PAD.gran, ...pp, coins: seg(t, B.gran + 0.1, B.gran + 1.2), face: { name: 'smug', mouth: 'smile' }, ...(o.gran || {}) }), '#B57BFF');
  return s;
}
const heroAv = (t, extra = {}, act = { arms: false }) => actor('you', t, { ...HERO, nametag: 'YOU', crown: true, ...extra }, act);
const noodleAv = (t, extra = {}, act = {}) => actor('noodle', t, { ...NOODLE, ...extra }, act);

// ---------------------------------------------------------------- the crowd (lite players / noobs)
const CROWD = (() => {
  const out = [];
  for (const p of GS.placeCrowd(PZ.lines[0], 22, 3, { x0: -1500, x1: 2500 })) out.push(p);
  for (const p of GS.placeCrowd(PZ.lines[1], 18, 5, { x0: -1700, x1: 2500 })) if (p.x < -400 || p.x > 980) out.push(p);
  for (const p of GS.placeCrowd(PZ.lines[3], 14, 9, { x0: -1700, x1: 2500 })) if ((p.x < -420 || p.x > 1460) && p.x < 2450) out.push(p);
  out.sort((a, b) => a.y - b.y);
  out.forEach((p, j) => {
    p.kind = hash(j * 3.3) < 0.3 ? 'noob' : 'player'; p.id = 1 + Math.floor(hash(j * 7.7) * 40); p.ph = hash(j * 1.9) * 6;
    p.view0 = hash(j * 5.1) < 0.45 ? 'back' : 'side'; p.flip0 = hash(j * 2.7) < 0.5;
    p.delay = 0.12 + (Math.abs(p.x - 150) / 2600) * 1.25 + 0.3 * hash(j * 9.1);
  });
  return out;
})();
const drawLite = (p, pose) => (p.kind === 'noob' ? K.draw.noob : K.draw.player)(p.id, { x: p.x, y: p.y, s: p.s * (p.kind === 'noob' ? 1.25 : 1), nametag: false, ...pose });
const towards = (x, tx, k = 0.45) => clamp((tx - x) / 700, -1, 1) * k;
// mood: 'idle' | 'turn' (o.t0 ripple start) | 'stare' | 'laugh' | 'aww' | 'type' | 'frozen'; o.tx = what they look at
function crowd(t, cam, mood, o = {}) {
  let s = '';
  const tx = o.tx ?? 150;
  for (const [j, p] of CROWD.entries()) {
    if (!E.inView(cam, p.x, p.y, p.s, 1200)) continue;
    if (o.skip && o.skip(p)) continue;
    const br = AC.breathe(t, p.ph);
    let pose;
    let m = mood;
    if (m === 'turn') {
      const tt = (o.t0 ?? t) + p.delay;
      if (t < tt) m = 'idle';
      else if (t < tt + 0.2) pose = { view: 'side', flip: p.x < tx, face: 'neutral', ...br };
      else { const u = ease.out(seg(t, tt + 0.2, tt + 0.7)); pose = { turn: lerp(towards(p.x, tx, 0.75), towards(p.x, tx, 0.4), u), face: j % 3 ? { name: 'shocked', mouth: 'O' } : 'amazed', ...br }; }
    }
    if (m === 'idle') pose = { view: p.view0, flip: p.flip0, face: 'neutral', headRot: 3 * Math.sin(t * 1.3 + p.ph), ...br };
    else if (m === 'stare') pose = { turn: towards(p.x, tx), face: j % 3 ? { name: 'shocked', mouth: 'O' } : 'amazed', ...br };
    else if (m === 'laugh') { const b = Math.abs(Math.sin(t * 11 + p.ph)); pose = { turn: towards(p.x, tx), bodyY: 8 * b, headRot: 5 * Math.sin(t * 11 + p.ph), armL: 20 + 25 * b, armR: 24 + 20 * b, face: { name: 'joy', mouth: 'bigGrin', eyes: { type: 'happy' } } }; }
    else if (m === 'aww') pose = { turn: towards(p.x, tx), headRot: 8 * Math.sin(t * 2 + p.ph), armL: 30, armR: 30, face: { name: 'happy', eyes: { type: 'heart' }, mouth: 'smile', fx: ['blush'] }, ...br };
    else if (m === 'type') { const b = Math.abs(Math.sin(t * 16 + p.ph)); pose = { turn: towards(p.x, tx), armL: 34 + 10 * b, armR: 34 + 10 * Math.abs(Math.sin(t * 16 + p.ph + 1.3)), face: { name: 'excited', mouth: 'grin' }, ...br }; }
    else if (m === 'frozen') pose = { turn: towards(p.x, tx), face: { name: 'deadpan', eyes: { look: [p.x < tx ? 0.6 : -0.6, 0] } } };
    s += drawLite(p, pose);
  }
  return s;
}
// split the crowd in front of / behind a y line (the family on the pads stands at y 858)
const crowdBack = (t, cam, mood, o = {}) => crowd(t, cam, mood, { ...o, skip: (p) => p.y > (o.yCut ?? 860) || (o.skip && o.skip(p)) });
const crowdFront = (t, cam, mood, o = {}) => crowd(t, cam, mood, { ...o, skip: (p) => p.y <= (o.yCut ?? 860) || (o.skip && o.skip(p)) });

// chat log content (in order of the scene)
function logLines(t) {
  const ls = [
    { user: 'DadBod1978', sys: true, text: 'DadBod1978 joined the server', at: B.dad }, { sys: true, text: 'MOM_OFFICIAL joined the server', at: B.mom },
    { sys: true, text: 'GrannyGoodies joined the server', at: B.gran }, { user: 'DadBod1978', text: A[2].text, at: A[2].b + 0.1 },
    { user: 'PizzaKid', text: 'lol is that ur dad', at: B.lol1 }, { user: 'NoodleBoi', text: A[3].text, at: A[3].b }, { user: 'xX_DarkBlade_Xx', text: A[7].text, at: A[7].b },
    { user: 'DadBod1978', text: A[12].text, at: B.send },
  ];
  return ls.filter((l) => t >= l.at - 0.3).map((l) => (l.sys ? { text: l.text, at: l.at, sys: true } : l));
}

// ---------------------------------------------------------------- shots
// 1. "DadBod1978 joined the server." — pixel wipe in; pad 0 flashes, the hot dog pops in
function shSpawnDad(t) {
  const cam = camKeys(t, [[CUT.spawnDad, camAt(350, 600, 1.12)], [B.dad - 0.05, camAt(220, 620, 1.3)], [CUT.spawnMom, camAt(160, 640, 1.42)]]);
  const pads = [Math.max(seg(t, B.dad - 0.35, B.dad), 1 - seg(t, B.dad + 0.2, B.dad + 1.2)) * (t < B.dad + 1.2 ? 1 : 0), 0, 0, 0];
  const worried = { face: { name: 'nervous', eyes: { look: [-0.7, 0] } }, ...AC.breathe(t, 1) };
  let chars = crowdBack(t, cam, 'idle') + family(t, { mom: false, gran: false }) + crowdFront(t, cam, 'idle');
  chars += heroAv(t, { ...worried, armL: 20, armR: 20 }) + noodleAv(t, { face: { name: 'excited', eyes: { look: [-0.8, 0] } }, armL: 20 + 40 * bump(t, B.dad + 0.3, B.dad + 1.3) });
  let o = E.plaza(t, cam, { chars, set: { pads } });
  o += toasts(t);
  return o + K.C.pixelWipe(seg(t, T0 - 0.02, T0 + 0.38), 'reveal');
}

// 2. "MOM_OFFICIAL joined the server." — whip to pad 1
function shSpawnMom(t) {
  const cam = camKeys(t, [[CUT.spawnMom, camAt(330, 620, 1.5)], [CUT.spawnGran, camAt(300, 630, 1.6)]], ease.out);
  const pads = [0, Math.max(seg(t, B.mom - 0.35, B.mom), 1 - seg(t, B.mom + 0.2, B.mom + 1.2)) * (t < B.mom + 1.2 ? 1 : 0), 0, 0];
  let chars = crowdBack(t, cam, 'idle') + family(t, { gran: false, dad: { armR: 140 + 20 * Math.sin(t * 9), face: { name: 'joy', mouth: 'bigGrin' } } }) + crowdFront(t, cam, 'idle');
  let o = E.plaza(t, cam, { chars, set: { pads } });
  return o + toasts(t) + whip(t, CUT.spawnMom, 1, 0.1);
}

// 3. "GrannyGoodies joined the server." — pad 2, coins; pull back to all three
function shSpawnGran(t) {
  const cam = camKeys(t, [[CUT.spawnGran, camAt(520, 610, 1.5)], [B.gran + 0.5, camAt(450, 600, 1.42)], [CUT.horror, camAt(420, 600, 1.0)]], ease.inOut);
  const pads = [0, 0, Math.max(seg(t, B.gran - 0.35, B.gran), 1 - seg(t, B.gran + 0.2, B.gran + 1.2)) * (t < B.gran + 1.2 ? 1 : 0), 0];
  let chars = crowdBack(t, cam, 'idle') + family(t, { dad: { armR: 140 + 20 * Math.sin(t * 9), face: { name: 'joy', mouth: 'bigGrin' } }, mom: { armR: 40 + 30 * Math.sin(t * 5), face: HAPPY } }) + crowdFront(t, cam, 'idle');
  chars += heroAv(t, { face: { name: 'scared', fx: ['sweat'] }, armL: 30, armR: 30 }) + noodleAv(t, { face: { name: 'excited', eyes: { look: [-0.8, 0] } } });
  let o = E.plaza(t, cam, { chars, set: { pads } });
  const gp = GS.toScreen(cam, PAD.gran.x + 60, PAD.gran.y - 150, 1);
  for (let i = 0; i < 8; i++) { const k = seg(t, B.gran + i * 0.05, B.gran + 0.9 + i * 0.05); if (k > 0 && k < 1) o += G.coinIcon(gp.x + (hash(i) - 0.5) * 300 * k, gp.y - 260 * Math.sin(k * Math.PI) - 60 * k, 20, t * 8 + i, {}); }
  return o + toasts(t) + whip(t, CUT.spawnGran, 1, 0.1);
}

// 4. the beat — the hero's face: oh no
function shHorror(t) {
  const cam = camKeys(t, [[CUT.horror, camAt(HERO.x, 640, 2.6)], [CUT.turn, camAt(HERO.x, 650, 3.05)]]);
  const shiver = 3 * Math.sin(t * 60);
  const chars = family(t, { dad: { armR: 150 + 20 * Math.sin(t * 9) } }) + heroAv(t, { face: { name: 'scared', mouth: 'wavy', fx: ['sweat', 'sweat2'] }, headRot: shiver * 0.5, armL: 14, armR: 14, nametag: false, crown: true, volume: false }) + noodleAv(t);
  let o = E.plaza(t, cam, { chars });
  return o + toasts(t) + smash(t, CUT.horror, 0.1, 0.5);
}

// 5. "The whole server saw it." — wide, every player slowly turns
function shTurn(t) {
  const cam = camKeys(t, [[CUT.turn, camAt(520, 520, 0.68)], [CUT.names, camAt(400, 560, 0.78)]]);
  const t0 = A[1].a;
  let chars = crowdBack(t, cam, 'turn', { t0 }) + family(t, { dad: { armR: 140 + 20 * Math.sin(t * 9) } }) + crowdFront(t, cam, 'turn', { t0 });
  chars += heroAv(t, { face: { name: 'scared', fx: ['sweat'] } }) + noodleAv(t, { face: { name: 'shocked', mouth: 'O' } });
  return E.plaza(t, cam, { chars }) + toasts(t);
}

// 6. "Every. Single. Name." — three smash-zooms on the nametags
function shNames(t) {
  const sub = t < B.single - 0.06 ? 0 : t < B.name - 0.06 ? 1 : 2;
  const tc = [CUT.names, B.single - 0.06, B.name - 0.06][sub];
  const P = [PAD.dad, PAD.mom, PAD.gran][sub];
  const faceY = [560, 610, 590][sub];
  const cam = camKeys(t, [[tc, camAt(P.x, faceY, 2.5)], [tc + 0.7, camAt(P.x, faceY - 10, 2.85)]], ease.out);
  const fam = family(t, { dad: sub === 0 ? { nametag: false, volume: false, face: { name: 'happy', mouth: 'bigGrin' }, armR: 20 } : {}, mom: sub === 1 ? { nametag: false, volume: false } : {}, gran: sub === 2 ? { nametag: false, volume: false } : {} });
  let o = E.plaza(t, cam, { chars: crowdBack(t, cam, 'stare') + fam });
  const k = seg(t, tc + 0.02, tc + 0.3);
  o += zoomLines(960, 520, 0.7 * (1 - seg(t, tc, tc + 0.6)), t, '#FFFFFF', 22, 330);
  o += G.nametag({ who: ['dad', 'mom', 'granny'][sub], x: 960, y: 170, s: 2.5 * (1 + 0.3 * (1 - ease.outBack(k))), k, t });
  o += S.g(TS(['EVERY.', 'SINGLE.', 'NAME.'][sub], 0, 0, 120, '#FFE14D', { 'stroke-width': 16 }), tf(1560, 860, pop(t, tc + 0.05, 0.25), -8));
  return o + toasts(t) + smash(t, tc, 0.12, 0.8);
}

// 7. CAPS LOCK — the key, the LED, the first letters
function chatIn(t, id, o = {}) {
  const l = L(id);
  return E.chatScreen({ t, text: o.text || l.text, typed: G.chatSync(t, id, o.sync || {}), caps: true, send: o.send || 0, inner: o.inner });
}
function shCaps(t) {
  const ck = KB.keys.CAPS;
  const cam = camKeys(t, [[CUT.caps, camAt(560, 430, 1.25)], [CUT.hello, camAt(600, 420, 1.32)]]);
  const on = t >= B.capsKey;
  const typed = G.chatSync(t, '04.2');
  const tf_ = E.typingFinger('HELLO', clamp(typed * L('04.2').text.length / 5, 0, 1), t, [ck.x + 40, ck.y - 60]);
  const into = ease.inOut(seg(t, CUT.caps, B.capsKey - 0.03));
  const pre = t < B.capsKey + 0.25;
  const fx = pre ? lerp(ck.x + 160, ck.x, into) : tf_.x, fy = pre ? lerp(ck.y - 120, ck.y - 4, into) : tf_.y;
  const pr = pre ? bump(t, B.capsKey - 0.03, B.capsKey + 0.18) : tf_.pr;
  let hands = hand({ x: fx, y: fy, ax: 1450, ay: 1350, s: 1.1, press: pr, kind: 'dad', ring: true, ringCol: '#3DFF6A' });
  let over = S.g(S.rect(-170, -40, 340, 80, 40, ol('#FF4B5C', 6)) + S.circle(-126, 0, 14, { fill: '#7DFF8E' }) + T('CAPS LOCK', 22, 16, 44, '#FFFFFF'), tf(ck.x + 60, ck.y - 150, pop(t, B.capsKey, 0.3), -6));
  if (on) over += S.circle(ck.x - ck.w * 0.34, ck.y - ck.h * 0.16, 24 + 30 * seg(t, B.capsKey, B.capsKey + 0.4), { fill: 'none', stroke: '#3DFF6A', 'stroke-width': f(8 * (1 - seg(t, B.capsKey, B.capsKey + 0.4))) });
  return keyboardShot(t, cam, { screen: chatIn(t, '04.2'), caps: on, pressKeys: tf_.key && !pre ? [{ key: E.keyOf(tf_.key) ? tf_.key.toUpperCase() : 'H', k: tf_.pr }] : [{ key: 'CAPS', k: pr }], hands, over });
}

// 8. "HELLO SON." — the hot dog's caps bubble
function bubbleOver(t, x, y, s, who, id, o = {}) {
  const oh = G.overHead(x, y, s, who);
  return G.chatBubble({ x: x + (o.dx || 0), y: oh.chat - (o.dy || 0), caps: o.caps, t, s: o.bs || 1, user: o.user, tail: o.tail ?? 0, maxW: o.maxW, ...G.chatLine(t, id, o.line || {}) });
}
function shHello(t) {
  const cam = camKeys(t, [[CUT.hello, camAt(60, 560, 1.55)], [CUT.itIsDad, camAt(40, 540, 1.65)]]);
  let chars = crowdBack(t, cam, 'stare', { tx: PAD.dad.x }) + family(t, { dad: { face: { name: 'happy', mouth: 'smile' }, armL: 18 + 6 * Math.sin(t * 3), armR: 18 } });
  const bub = bubbleOver(t, PAD.dad.x, PAD.dad.y, PAD.dad.s, 'dadAvatar', '04.2', { caps: true, bs: 0.9, dx: 140, tail: -0.6 });
  return E.plaza(t, cam, { chars, over: bub }) + whip(t, CUT.hello, -1, 0.08);
}

// 9. "IT IS DAD." — split: the real Dad pecking with one finger | the bubble
function shItIsDad(t) {
  const peck = Math.abs(Math.sin(t * 9));
  const left = famRoom(t, camAt(1000, 560, 2.15), { dad: { face: { name: 'determined', fx: ['sweat'] }, headY: 18, bodyY: 6 * peck, armL: 16, armR: 26 + 14 * peck }, dadAct: { arms: false }, mom: { tablet: true, face: 'neutral' }, over: G.screenGlow(1000, 520, 320, 260, 'blue', 0.7, { flicker: true, t }) + K.C.sfx('tap', 1150, 700, peck > 0.9 ? 1 : 0, 34, -10, '#FFFFFF') });
  const camR = camAt(40, 560, 1.55);
  let chars = crowdBack(t, camR, 'stare', { tx: PAD.dad.x }) + family(t, { mom: false, gran: false, dad: { face: { name: 'happy', mouth: 'smile' } } });
  const right = E.plaza(t, camR, { chars, over: bubbleOver(t, PAD.dad.x, PAD.dad.y, PAD.dad.s, 'dadAvatar', '04.2', { caps: true, bs: 0.9, dx: 140, tail: -0.6 }) });
  let o = splitBg('#1E1430', '#F2B705') + panel(0, 0, 960, 1080, left, { border: 8 }) + panel(960, 0, 960, 1080, right, { border: 8, dx: 120 });
  o += panelTag(30, 30, 'REAL DAD', '#151A26', '#FFFFFF') + panelTag(990, 30, 'DadBod1978', '#F2B705', '#2A1640');
  return o + whip(t, CUT.itIsDad, 1, 0.08);
}

// 10. "LOVE, DAD." + the beat — the players snicker, the hero dies inside
function shLoveDad(t) {
  const cam = camKeys(t, [[CUT.loveDad, camAt(340, 600, 1.08)], [CUT.noodle, camAt(380, 610, 1.15)]]);
  const mood = t > B.lol1 - 0.2 ? 'laugh' : 'stare';
  let chars = crowdBack(t, cam, mood, { tx: PAD.dad.x }) + family(t, { dad: { face: HAPPY, armL: 20, armR: t > A[2].b ? 140 + 25 * Math.sin(t * 9) : 20 } }) + crowdFront(t, cam, mood, { tx: PAD.dad.x });
  chars += heroAv(t, { armR: 166, headRot: 9, face: { name: 'deadpan', eyes: { upper: 0.55 }, fx: ['sweat'] } }) + noodleAv(t, { face: { name: 'joy', mouth: 'bigGrin' } });
  let over = bubbleOver(t, PAD.dad.x, PAD.dad.y, PAD.dad.s, 'dadAvatar', '04.2', { caps: true, bs: 0.82, dx: 150, tail: -0.6 });
  const p1 = CROWD.find((p) => p.y < 720 && p.x > 400 && p.x < 900) || CROWD[3], p2 = CROWD.find((p) => p.y > 760 && p.x > 1100) || CROWD[8];
  over += G.chatBubble({ x: p1.x, y: G.overHead(p1.x, p1.y, p1.s, 'player').chat, t, s: 0.75, user: 'PizzaKid', text: 'lol', k: seg(t, B.lol1, B.lol1 + 0.3), tail: 0 });
  over += G.chatBubble({ x: p2.x, y: G.overHead(p2.x, p2.y, p2.s, 'player').chat, t, s: 0.75, user: 'ObbyQueen', text: 'is that ur DAD lmao', k: seg(t, B.lol2, B.lol2 + 0.3), tail: 0.5 });
  return E.plaza(t, cam, { chars, over });
}

// 11. Noodle: "Bro... is that your DAD?!"
function shNoodle(t) {
  const cam = camKeys(t, [[CUT.noodle, camAt(900, 640, 1.85)], [CUT.whisper, camAt(920, 645, 2.0)]]);
  const point = ease.outBack(seg(t, w(3, 'that') - 0.2, w(3, 'that')));
  const laugh = Math.abs(Math.sin(t * 12));
  let chars = heroAv(t, { face: { name: 'nervous', fx: ['sweat', 'sweat2'], eyes: { look: [0.5, 0] } }, armL: 12, armR: 12, headRot: -4 });
  chars += noodleAv(t, { armL: lerp(20, 100, point), armR: 25 + 30 * laugh, bodyY: 8 * laugh, headRot: 5 * Math.sin(t * 12) }, { arms: false, face: 'joy' });
  const over = bubbleOver(t, NOODLE.x, NOODLE.y, NOODLE.s, 'noodle', '04.3', { bs: 0.85, user: 'NoodleBoi', tail: 0.4, dx: 60 });
  return E.plaza(t, cam, { chars, over }) + whip(t, CUT.noodle, 1, 0.08);
}

// 12. "Rule number one, Dad!" — whisper-panic from the gaming chair
function shWhisper(t) {
  const cam = camKeys(t, [[CUT.whisper, camAt(800, 600, 1.6)], [CUT.ruleOne, camAt(760, 600, 1.75)]]);
  const you = { armR: 120 + 8 * Math.sin(t * 12), armL: 14, turn: 0.35, headRot: 6, face: { name: 'scared', fx: ['sweat'] } };
  const over = E.shoutWaves(680, 560, 0, t, 0.5, 0.5, '#FFFFFF') + K.C.sfx('psst!', 760, 430, bump(t, CUT.whisper + 0.1, CUT.ruleOne + 0.3), 50, -8, '#FFFFFF');
  return famRoom(t, cam, { you, dad: { face: { name: 'joy', mouth: 'bigGrin' }, armL: 16, armR: 30 + 14 * Math.abs(Math.sin(t * 9)) }, dadAct: { arms: false }, over, set: { pcScreen: (sw, sh) => S.rect(-sw / 2, -sh / 2, sw, sh, 0, { fill: '#7CCBFF' }) + S.rect(-sw / 2, 10, sw, sh / 2, 0, { fill: '#E6D6F2' }) } }) + whip(t, CUT.whisper, -1, 0.08);
}

// 13. "RULE NUMBER ONE!" — smash on every word
function shRuleOne(t) {
  const hits = B.rule;
  const n = hits.filter((x) => t >= x - 0.04).length;
  const z = [2.4, 2.7, 3.0, 3.3][n];
  const cam = shakeCam(camAt(598, 560, z), t, hits.map((x) => [x, 0.25, 14]));
  const you = { armR: 150, armL: 150, turn: 0.2, face: { name: 'angry' }, volume: false };
  let o = famRoom(t, cam, { you, youAct: { arms: false }, dad: false });
  o += tint('#FF2E4E', 0.12 * n);
  const words = ['RULE', 'NUMBER', 'ONE!'];
  for (let i = 0; i < n; i++) o += S.g(TS(words[i], 0, 0, 120 + 30 * i, '#FFE14D', { 'stroke-width': 16 }), tf([380, 1500, 960][i], [300, 330, 860][i], pop(t, hits[i], 0.2), [-10, 8, -4][i]));
  return o + smash(t, hits[0] - 0.04, 0.1, 0.6);
}

// 14. "Then Mom found the emote button." — Mom discovers something on her tablet
function shEmote(t) {
  const cam = camKeys(t, [[CUT.emote, camAt(1340, 570, 2.0)], [CUT.wheel, camAt(1340, 560, 2.3)]]);
  const fk = seg(t, B.found, B.found + 0.3);
  const mom = { tablet: true, tabletFace: 'back', headY: 10, face: fk > 0 ? { name: 'amazed', eyes: { type: 'star' }, fx: ['sparkles'] } : { name: 'confused', eyes: { look: [0, 0.6] } } };
  const over = K.sparkles([[1250, 430, 30 * fk], [1440, 410, 24 * fk]], t) + mark('!', 1460, 380, fk, 90, 10, '#FFE14D');
  return famRoom(t, cam, { mom, momAct: { arms: false }, over, glow: H.deviceGlows(['dad', 'mom', 'grandma'], 1) }) + whip(t, CUT.emote, 1, 0.08);
}

// 15. the emote wheel on Mom's tablet — the kiss
function shWheel(t) {
  const camIn = camAt(300, 600, 1.7);
  const wk = seg(t, CUT.wheel + 0.05, CUT.wheel + 0.55);
  const inner = (() => {
    let s = E.plaza(t, camIn, { chars: family(t, { gran: false, dad: { face: HAPPY } }) + heroAv(t, { face: 'nervous' }) });
    s += G.emoteWheel({ x: 1280, y: 520, k: wk, t, s: 1.05, selected: t >= B.btn - 0.25 ? 'kiss' : undefined, press: seg(t, B.btn, B.btn + 0.4) });
    return s;
  })();
  const ds = G.deviceSize('tablet');
  const sc = 1.3;
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#4A3A5A' }) + S.circle(960, 540, 800, { fill: '#6A4E7A', opacity: 0.5 });
  o += G.deviceFrame({ type: 'tablet', x: 960, y: 520, s: sc, screen: inner, t, glow: 0.5, rot: -2 });
  // the kiss slice: index 3 of the wheel (6 slices, starting at the top) -> screen point
  const am = (3 / 6) * Math.PI * 2 - Math.PI / 2, rr = (90 + 260) / 2 * 1.05;
  const coverS = Math.max(ds.sw / 1920, ds.sh / 1080) * sc;
  const kx = 960 + (1280 + Math.cos(am) * rr - 960) * coverS, ky = 520 + (520 + Math.sin(am) * rr - 540) * coverS;
  const reach = ease.inOut(seg(t, B.btn - 0.45, B.btn - 0.03));
  o += hand({ x: lerp(kx + 260, kx, reach), y: lerp(ky + 340, ky, reach), ax: kx + 500, ay: 1350, s: 1.0, press: bump(t, B.btn - 0.03, B.btn + 0.2), kind: 'mom', ring: true, ringCol: '#FF5FA8' });
  return o + smash(t, CUT.wheel, 0.1, 0.5);
}

// 16. "Mwah!" — the air kiss, hearts fly at the hero
function heroFace() { return [HERO.x, HERO.y - 760 * HERO.s]; }
function shKiss(t) {
  const cam = camKeys(t, [[CUT.kiss, camAt(470, 650, 1.3)], [CUT.love, camAt(500, 640, 1.38)]]);
  const blow = seg(t, B.mwah - 0.3, B.mwah), thr = seg(t, B.mwah, B.mwah + 0.25);
  const mom = { armR: thr > 0 ? lerp(150, 95, ease.out(thr)) : lerp(16, 150, ease.inOut(blow)), face: { name: 'happy', eyes: { type: 'closed' }, mouth: blow > 0.5 && thr < 1 ? 'o' : 'smile', fx: ['blush'] } };
  const hit = B.mwah + 1.05;
  const hk = seg(t, hit, hit + 0.3);
  let chars = crowdBack(t, cam, 'stare', { tx: PAD.mom.x }) + family(t, { mom, dad: { face: HAPPY }, gran: { face: HAPPY } });
  chars += heroAv(t, { face: hk > 0 ? { name: 'shocked', fx: ['blush'], mouth: 'wavy' } : { name: 'nervous', eyes: { look: [-0.6, 0] } }, ...boing(t, hit, 0.18), armL: 14 + 30 * hk, armR: 14 + 30 * hk });
  const mouth = [PAD.mom.x + 30, PAD.mom.y - 640 * PAD.mom.s];
  const [hx, hy] = heroFace();
  let over = G.kissEmote({ x: mouth[0] + 70, y: mouth[1], age: t - B.mwah, s: 0.75, to: [hx, hy] });
  if (hk > 0) over += G.emoteHearts({ x: hx, y: hy - 60, age: t - hit, n: 8, s: 0.6, seed: 5 });
  return E.plaza(t, cam, { chars, over }) + whip(t, CUT.kiss, 1, 0.08);
}

// 17. "Love you, honey!" + the beat — "awww"
function shLove(t) {
  const cam = camKeys(t, [[CUT.love, camAt(560, 600, 1.0)], [CUT.dark, camAt(600, 590, 0.94)]]);
  const aw = t > B.aww - 0.6 ? 'aww' : 'stare';
  let chars = crowdBack(t, cam, aw, { tx: HERO.x }) + family(t, { mom: { armR: 30 + 20 * Math.sin(t * 4), face: { name: 'happy', eyes: { type: 'happy' }, mouth: 'smile', fx: ['blush'] } }, dad: { face: HAPPY } }) + crowdFront(t, cam, aw, { tx: HERO.x });
  chars += heroAv(t, { face: { name: 'yuck', fx: ['blush', 'sweat'] }, headRot: -6 }) + noodleAv(t, { face: { name: 'joy', mouth: 'bigGrin' }, armL: 30, armR: 30 });
  let over = bubbleOver(t, PAD.mom.x, PAD.mom.y, PAD.mom.s, 'momAvatar', '04.6', { bs: 0.8, user: 'MOM_OFFICIAL', tail: -0.4, dx: 110, line: { from: 'Love', text: 'Love you, honey! <3' } });
  const [hx, hy] = heroFace();
  over += G.emoteHearts({ x: hx, y: hy - 30, age: (t - CUT.love) % 1.6, n: 6, s: 0.55, seed: 9 });
  const awws = CROWD.filter((p) => p.x > -300 && p.x < 1600).filter((_, j) => j % 4 === 1).slice(0, 5);
  awws.forEach((p, j) => {
    const ta = B.aww - 0.5 + j * 0.18;
    over += G.chatBubble({ x: p.x, y: G.overHead(p.x, p.y, p.s, 'player').chat, t, s: 0.62, text: ['awww', 'so cute', 'aww mom!!', 'awwwww', 'wholesome'][j], user: G.FLOOD_USERS[j * 3 % G.FLOOD_USERS.length], k: seg(t, ta, ta + 0.3), tail: 0 });
    over += G.emoteHearts({ x: p.x, y: p.y - 700 * p.s, age: t - ta, n: 4, s: 0.45, seed: j + 2 });
  });
  return E.plaza(t, cam, { chars, over });
}

// 18. DarkBlade: "Ha! The legend brought his MOMMY."
function shDark(t) {
  const sm = t >= B.mommy - 0.05;
  const cam = shakeCam(sm ? camKeys(t, [[B.mommy - 0.05, camAt(DB.x, 600, 2.3)], [CUT.silence, camAt(DB.x, 610, 2.15)]], ease.out) : camKeys(t, [[CUT.dark, camAt(1320, 620, 1.25)], [B.mommy - 0.05, camAt(1260, 620, 1.45)]]), t, [[B.mommy, 0.35, 16]]);
  const walkU = ease.out(seg(t, CUT.dark, CUT.dark + 0.7));
  const walking = walkU < 1;
  const dbx = lerp(DB.x + 500, DB.x, walkU);
  let chars = '';
  CLAN.forEach((c, j) => { const cx = lerp(c.x + 520, c.x, ease.out(seg(t, CUT.dark + 0.05 * j, CUT.dark + 0.75 + 0.05 * j))); const lb = Math.abs(Math.sin(t * 10 + j)); chars += actor('clan', t, { i: c.i, x: cx, y: c.y, s: c.s, volume: false, ...(cx > c.x + 5 ? { view: 'side', ...AC.walk(t * 9 + j) } : { bodyY: t > B.ha ? 6 * lb : 0, armL: 14, armR: 14 }) }); });
  chars += actor('darkblade', t, { x: dbx, y: DB.y, s: DB.s, volume: false, ...(walking ? { view: 'side', ...AC.walk(t * 9) } : { armL: 14 + (sm ? 40 : 0), armR: 20, swordRot: -20, headRot: sm ? -6 : 0 }) }, { arms: false });
  chars += noodleAv(t, { face: { name: 'scared' }, x: NOODLE.x - 90 });
  let over = '';
  if (!walking) over += bubbleOver(t, DB.x, DB.y, DB.s, 'darkblade', '04.7', { bs: sm ? 0.95 : 0.85, user: 'xX_DarkBlade_Xx', tail: 0.3, dx: -30, line: { pre: 0.2 } });
  if (t > B.ha && t < B.ha + 1.2) over += K.C.sfx('HA HA', CLAN[1].x - 40, CLAN[1].y - 520, seg(t, B.ha + 0.1, B.ha + 0.4), 50, 8, '#C9B8FF');
  let o = E.plaza(t, cam, { chars: crowdBack(t, cam, 'stare', { tx: DB.x }) + chars, over });
  if (sm) o += zoomLines(960, 420, 0.7 * (1 - seg(t, B.mommy, B.mommy + 0.6)), t) + tint('#2A0010', 0.12);
  return o + whip(t, CUT.dark, -1, 0.08) + smash(t, B.mommy - 0.05, 0.1, 0.6);
}

// 19. silence — the whole server stares; a cube tumbleweed; Mom's glasses glint
function shSilence(t) {
  const cam = camKeys(t, [[CUT.silence, camAt(560, 610, 0.86)], [CUT.dadGot, camAt(580, 620, 0.9)]]);
  const glint = bump(t, CUT.dadGot - 0.6, CUT.dadGot - 0.1);
  let chars = crowdBack(t, cam, 'frozen', { tx: DB.x }) + family(t, { mom: { turn: 0.5 * seg(t, CUT.silence + 0.2, CUT.dadGot - 0.6), face: { name: 'deadpan', eyes: { look: [0.8, 0] } } }, dad: { face: { name: 'neutral', mouth: 'line' } }, gran: { face: { name: 'neutral', mouth: 'line' } } }) + crowdFront(t, cam, 'frozen', { tx: DB.x });
  chars += heroAv(t, { face: { name: 'deadpan', eyes: { upper: 0.5 } } }) + noodleAv(t, { face: { name: 'neutral', mouth: 'line' } });
  chars += actor('darkblade', t, { ...DB, volume: false, armL: 14, armR: 20 }) + CLAN.map((c) => actor('clan', t, { i: c.i, x: c.x, y: c.y, s: c.s, volume: false })).join('');
  const twx = lerp(-900, 2000, seg(t, CUT.silence, CUT.dadGot));
  chars += G.tumbleweed({ x: twx, y: 1060, s: 0.7, t });
  const mp = [PAD.mom.x + 40, PAD.mom.y - 690 * PAD.mom.s];
  const over = K.F.sparkle(mp[0], mp[1], 40 * glint);
  return E.plaza(t, cam, { chars, over }) + whip(t, CUT.silence, 1, 0.06);
}

// 20. "Don't worry, son." — Dad, determined
function shDadGot(t) {
  const cam = camKeys(t, [[CUT.dadGot, camAt(1000, 560, 2.0)], [CUT.wall, camAt(1000, 545, 2.35)]]);
  const roll = Math.sin(t * 7);
  return famRoom(t, cam, { dad: { face: 'determined', armL: 40 + 20 * roll, armR: 40 - 20 * roll, ...boing(t, w(8, 'son'), 0.08) }, dadAct: { arms: false }, mom: { tablet: true, face: 'neutral' }, over: G.screenGlow(1000, 520, 320, 260, 'blue', 0.6, { flicker: true, t }) }) + whip(t, CUT.dadGot, -1, 0.08);
}

// 21. "Dad's got this. How do I jump?" — the hot dog marches into the obby wall
function hotdogAtWall(t, tArrive, o = {}) {
  const x = tArrive !== null && t < tArrive ? lerp(WALLD.x - 520, WALLD.x, seg(t, tArrive - 0.9, tArrive)) : WALLD.x;
  const stuck = t >= (tArrive ?? -1e9);
  const ph = t * 9;
  const squish = stuck ? 0.04 * Math.abs(Math.sin(ph)) : 0;
  return actor('dadAvatar', t, { x: x - (stuck ? 6 * Math.abs(Math.sin(ph)) : 0), y: WALLD.y, s: WALLD.s, view: 'side', flip: true, ...AC.walk(ph, stuck ? 0.8 : 1), face: o.face || HAPPY, sx: 1 - squish, ...(o.extra || {}) }) + (stuck ? K.C.dust(x - 40, WALLD.y - 10, t - (t % 0.5), t) : '');
}
function bleacherNoobs(t, mood = 'stare') {
  let s = '';
  PZ.bleachers.forEach((b, j) => { for (let i = 0; i < 4 - j; i++) { const x = lerp(b.x0 + 50, b.x1 - 50, (i + 0.5) / (4 - j)); const lb = Math.abs(Math.sin(t * 11 + i + j)); s += K.draw.noob(3 + i * 4 + j, { x, y: b.y, s: b.s * 1.25, nametag: false, turn: 0.45, ...(mood === 'laugh' ? { bodyY: 6 * lb, armL: 20 + 20 * lb, armR: 20 + 20 * lb, face: { name: 'joy', mouth: 'bigGrin', eyes: { type: 'happy' } } } : mood === 'type' ? { armL: 34 + 10 * lb, armR: 34 + 10 * lb, face: { name: 'excited', mouth: 'grin' } } : { face: { name: 'amazed', mouth: 'O' } }) }); } });
  return s;
}
function shWall(t) {
  const cam = shakeCam(camKeys(t, [[CUT.wall, camAt(2300, 620, 1.05)], [B.bonk, camAt(2420, 640, 1.2)], [CUT.spacebar, camAt(2460, 640, 1.32)]]), t, [[B.bonk, 0.3, 14]]);
  const face = t >= B.how ? { name: 'confused', mouth: 'line' } : t >= B.bonk ? { name: 'dizzy', mouth: 'line' } : { name: 'determined', mouth: 'smile' };
  let chars = bleacherNoobs(t) + hotdogAtWall(t, B.bonk, { face });
  let over = '';
  over += K.C.sfx('BONK!', WALLD.x + 60, WALLD.y - 560, seg(t, B.bonk, B.bonk + 0.25) * (1 - seg(t, B.bonk + 0.9, B.bonk + 1.1)), 60, -10, '#FFFFFF');
  if (t > B.bonk && t < B.how) over += G.koStars({ x: WALLD.x, y: WALLD.y - 520 * WALLD.s * 2.4, t, s: 0.45, n: 3 });
  over += mark('?', WALLD.x - 60, WALLD.y - 600, seg(t, B.how, B.how + 0.3), 70, -10, '#FFFFFF');
  return E.plaza(t, cam, { chars, over }) + whip(t, CUT.wall, 1, 0.1);
}

// 22. "Spacebar!" — the hero whisper-shouts from his chair
function shSpacebar(t) {
  const cam = camKeys(t, [[CUT.spacebar, camAt(700, 590, 2.0)], [CUT.spaceBar, camAt(720, 585, 2.15)]]);
  const you = { armR: 125 + 6 * Math.sin(t * 14), armL: 40, turn: 0.4, headRot: 6, face: { name: 'angry', fx: ['sweat'] } };
  const over = E.shoutWaves(700, 560, 0, t, 0.8, 0.5, '#FFFFFF');
  return famRoom(t, cam, { you, dad: { face: { name: 'confused' } }, over }) + whip(t, CUT.spacebar, -1, 0.08);
}

// 23. "SPACE! BAR!" — yelled at the laptop
function shSpaceBar(t) {
  const sm = t >= B.bar - 0.04;
  const cam = shakeCam(sm ? camAt(1000, 545, 3.0) : camKeys(t, [[CUT.spaceBar, camAt(1000, 560, 2.2)], [B.bar - 0.04, camAt(1000, 555, 2.4)]]), t, [[B.space, 0.35, 16], [B.bar, 0.45, 22]]);
  const yell = Math.max(bump(t, B.space - 0.05, w1(10, 'SPACE') + 0.1), bump(t, B.bar - 0.05, w1(10, 'BAR') + 0.1));
  const dad = { face: { name: 'angry' }, headY: 20 * yell, armL: 30 + 40 * yell, armR: 30 + 40 * yell, volume: !sm };
  const over = E.shoutWaves(1000, 600, 90, t, yell, 0.8, '#FFE45C');
  let o = famRoom(t, cam, { dad, dadAct: { arms: false }, mom: { tablet: true, face: { name: 'shocked', mouth: 'O' } }, over });
  o += K.C.sfx('SPACE!', 520, 300, seg(t, B.space, B.space + 0.2) * (sm ? 0 : 1), 140, -10, '#FFE14D');
  if (sm) o += K.C.sfx('BAR!', 1420, 320, seg(t, B.bar, B.bar + 0.2), 190, 8, '#FF4B5C') + zoomLines(960, 500, 0.6 * (1 - seg(t, B.bar, B.bar + 0.7)), t);
  if (t > A[10].b + 0.1) o += mark('...', 1300, 330, seg(t, A[10].b + 0.1, A[10].b + 0.4), 70, 0, '#FFFFFF');
  return o + smash(t, B.bar - 0.04, 0.1, 0.6);
}

// 24. "He did not press the spacebar." — the untouched space bar (with a cobweb)
function shNotPress(t) {
  const sp = KB.keys.SPACE;
  const cam = camKeys(t, [[CUT.notPress, camAt(sp.x, sp.y - 60, 1.85)], [CUT.saidIt, camAt(sp.x, sp.y - 30, 2.15)]]);
  const spot = seg(t, CUT.notPress + 0.1, CUT.notPress + 0.5);
  let over = S.path(`M${f(sp.x - 220)} -200 L${f(sp.x + 220)} -200 L${f(sp.x + sp.w / 2 + 60)} ${f(sp.y + 60)} L${f(sp.x - sp.w / 2 - 60)} ${f(sp.y + 60)} Z`, { fill: '#FFF6C8', opacity: f(0.18 * spot) });
  over += E.cobweb(sp.x + sp.w / 2 - 14, sp.y - sp.h / 2 + 6, 70, -1, 1) + E.cobweb(sp.x - sp.w / 2 + 14, sp.y + sp.h / 2 - 6, 50, 1, -1);
  over += S.g(S.rect(-200, -38, 400, 76, 38, { fill: '#14182A', stroke: '#FFE45C', 'stroke-width': 5 }) + TF('TIMES PRESSED: 0', 0, 12, 34, '#FFE45C'), tf(sp.x, sp.y - 160, pop(t, w(11, 'spacebar'), 0.3)));
  const [hx, hy] = hunt(t, sp.x + 360, sp.y - 320, 40);
  return keyboardShot(t, cam, { screen: chatIn(t, '04.2', { sync: { lead: 99 } }), highlight: spot > 0.5 ? 'SPACE' : null, caps: true, hands: hand({ x: hx, y: hy, ax: 1700, ay: 1300, s: 1.1, kind: 'dad' }), over }) + whip(t, CUT.notPress, 1, 0.08);
}

// 25. "He said it. Very loudly. To the computer." — the family covers their ears
function shSaidIt(t) {
  const cam = shakeCam(camKeys(t, [[CUT.saidIt, camAt(1290, 600, 1.42)], [CUT.toComp, camAt(1300, 600, 1.55)]]), t, [[B.loud, 0.5, 12]]);
  const yell = 0.6 + 0.4 * Math.abs(Math.sin(t * 7));
  const ears = seg(t, B.loud - 0.15, B.loud + 0.15);
  const dad = { face: { name: 'angry', mouth: 'scream' }, headY: 18 * yell, armL: 30 + 30 * yell, armR: 30 + 30 * yell };
  const over = E.shoutWaves(1000, 590, 90, t, 0.9, 0.9, '#FFE45C') + E.shoutWaves(1000, 560, 20, t, ears, 0.9, '#FFFFFF') + E.shoutWaves(1000, 560, 160, t, ears * 0.7, 0.9, '#FFFFFF');
  const covers = { armL: lerp(14, 160, ears), armR: lerp(14, 160, ears) };
  return famRoom(t, cam, {
    dad, dadAct: { arms: false },
    mom: { ...covers, face: ears > 0.5 ? { name: 'oof', eyes: { type: 'closed' } } : { name: 'shocked', mouth: 'O' } }, momAct: { arms: false },
    gran: { ...covers, flip: true, turn: 0.2, face: ears > 0.5 ? { name: 'oof', eyes: { type: 'closed' } } : { name: 'shocked', mouth: 'O' } }, granAct: { arms: false },
    over,
  }) + whip(t, CUT.saidIt, -1, 0.08);
}

// 26. "...To the computer." — meanwhile in the game: still walking into the wall
function shToComp(t) {
  const cam = camKeys(t, [[CUT.toComp, camAt(2470, 650, 1.6)], [CUT.dear, camAt(2490, 650, 1.75)]]);
  const chars = hotdogAtWall(t, null, { face: { name: 'happy', mouth: 'smile' } }) + bleacherNoobs(t);
  return E.plaza(t, cam, { chars, over: mark('?', WALLD.x - 40, WALLD.y - 540, seg(t, CUT.toComp + 0.3, CUT.toComp + 0.6), 60, 8, '#FFFFFF') });
}

// 27. "DEAR EVERYONE." — the finger pecks each letter
function shDear(t) {
  const cam = camKeys(t, [[CUT.dear, camAt(820, 430, 1.18)], [CUT.where, camAt(860, 440, 1.26)]]);
  const id = '04.12', txt = L(id).text;
  const typed = G.chatSync(t, id);
  const tfg = E.typingFinger(txt, typed, t, [820, 470]);
  const press = tfg.key && E.keyOf(tfg.key) ? [{ key: tfg.key === '.' ? '.' : tfg.key.toUpperCase(), k: tfg.pr }] : [];
  const hands = hand({ x: tfg.x, y: tfg.y, ax: 1500, ay: 1320, s: 1.08, press: tfg.pr, kind: 'dad', ring: true });
  let over = '';
  if (tfg.key && tfg.pr > 0.5) { const kp = E.keyOf(tfg.key); over += S.g(TS(tfg.key, 0, 0, 70, '#FFE45C'), tf(kp.x, kp.y - 90, 1), { opacity: f(tfg.pr) }); }
  return keyboardShot(t, cam, { screen: chatIn(t, id), caps: true, pressKeys: press, hands, over }) + whip(t, CUT.dear, 1, 0.08);
}

// 28. "WHERE IS THE JUMP BUTTON." — the wall, the caps bubble, the chat log; send
function shWhere(t) {
  const cam = camKeys(t, [[CUT.where, camAt(2400, 600, 1.15)], [CUT.flood, camAt(2380, 590, 1.2)]]);
  const chars = bleacherNoobs(t) + hotdogAtWall(t, null, { face: HAPPY });
  const over = bubbleOver(t, WALLD.x, WALLD.y, WALLD.s, 'dadAvatar', '04.12', { caps: true, bs: 0.85, dx: -160, tail: 0.6, line: { hold: 3 } });
  let o = E.plaza(t, cam, { chars, over });
  o += G.chatLog({ x: 30, y: 560, w: 680, h: 380, t, lines: logLines(t), input: t < B.send ? { text: L('04.12').text, typed: G.chatSync(t, '04.12') } : undefined, send: seg(t, B.send, B.send + 0.3) });
  return o + whip(t, CUT.where, -1, 0.08);
}

// 29. "Fifty players answered at the same time." — typing dots over every head, then SPACEBAR everywhere
function shFlood(t) {
  const cam = camKeys(t, [[CUT.flood, camAt(1700, 560, 0.8)], [CUT.flood2, camAt(1760, 570, 0.86)]]);
  const typing = t >= B.answered - 0.3;
  let chars = crowdBack(t, cam, typing ? 'type' : 'stare', { tx: WALLD.x }) + bleacherNoobs(t, typing ? 'type' : 'stare') + hotdogAtWall(t, null, { face: HAPPY }) + crowdFront(t, cam, typing ? 'type' : 'stare', { tx: WALLD.x });
  let over = '';
  const ps = CROWD.filter((p) => E.inView(cam, p.x, p.y, p.s, 1000)).filter((_, j) => j % 2 === 0).slice(0, 14);
  ps.forEach((p, j) => {
    const ta = B.answered - 0.1 + 0.06 * j, tb = B.same + 0.04 * j;
    const oh = G.overHead(p.x, p.y, p.s, 'player');
    if (t >= ta) over += G.chatBubble({ x: p.x, y: oh.chat, t, s: 0.6, user: G.FLOOD_USERS[(j * 5) % G.FLOOD_USERS.length], text: t >= tb ? ['SPACEBAR', 'SPACE', 'spacebar!!', 'press SPACE', 'SPACEBAR', 'the BIG one', 'SPACE BAR'][j % 7] : '', typed: t >= tb ? 1 : 0, k: seg(t, ta, ta + 0.25), tail: 0 });
  });
  let o = E.plaza(t, cam, { chars, over });
  const flood = seg(t, B.same - 0.2, CUT.flood2) * 0.45;
  o += G.chatLog({ x: 30, y: 560, w: 680, h: 380, t, lines: logLines(t), flood, floodSet: 'spacebar', shake: flood > 0 ? 0.4 : 0 });
  return o + whip(t, CUT.flood, 1, 0.08);
}

// 30. "Fifty players said "SPACEBAR."" — smash-zoom on the flooded chat
function shFlood2(t) {
  const big = t >= B.spacebarW - 0.04;
  const s = big ? 1.75 : lerp(1.25, 1.45, seg(t, CUT.flood2, B.spacebarW));
  const cam = shakeCam({ zoom: 1, x: 0, y: 0 }, t, [[B.spacebarW, 0.5, 22]]);
  let o = E.plaza(t, camAt(1760, 570, 0.86), { chars: crowdBack(t, camAt(1760, 570, 0.86), 'type', { tx: WALLD.x }) + hotdogAtWall(t, null, { face: HAPPY }) });
  o += tint('#14182A', 0.5);
  const flood = lerp(0.45, 1, seg(t, CUT.flood2 + 0.05, B.spacebarW));
  const log = G.chatLog({ x: 0, y: 0, w: 680, h: 420, t, lines: logLines(t), flood, floodSet: 'spacebar', shake: 0.6 });
  o += S.g(log, `translate(${f(960 + (cam.sx || 0))} ${f(500 + (cam.sy || 0))}) scale(${f(s)}) translate(-340 -210)`);
  if (big) o += S.g(TS('SPACEBAR', 0, 0, 230, '#FFE14D', { 'stroke-width': 26 }), tf(960, 930, pop(t, B.spacebarW, 0.25) * (1 + 0.03 * Math.sin(t * 20)), -5)) + zoomLines(960, 540, 0.6 * (1 - seg(t, B.spacebarW, B.spacebarW + 0.8)), t, '#FFFFFF', 22, 520);
  return o + smash(t, CUT.flood2, 0.1, 0.5) + smash(t, B.spacebarW - 0.04, 0.12, 0.7);
}

// 31. the beat — the hero hoods up and dashes for the tree
function shHood(t) {
  const dashing = t >= B.dash;
  const u = seg(t, B.dash, CUT.tree);
  const hx = lerp(HERO.x, HERO.x - 700, ease.in(u));
  const cam = camKeys(t, [[CUT.hood, camAt(HERO.x, 650, 2.0)], [B.dash, camAt(HERO.x - 30, 650, 2.1)], [CUT.tree, camAt(HERO.x - 760, 660, 1.6)]], ease.in);
  const hood = t >= B.hoodUp;
  const up = bump(t, B.hoodUp - 0.2, B.hoodUp + 0.2);
  const pose = dashing ? { x: hx, view: 'side', ...AC.run(t * 16), lean: 10, hood: true, nametag: false, crown: false, face: { name: 'scared', fx: ['sweat'] } } : { hood, nametag: false, crown: !hood, armL: 14 + 150 * up, armR: 14 + 150 * up, face: { name: 'nervous', fx: ['sweat', 'sweat2'] } };
  const chars = family(t, {}) + noodleAv(t, { face: { name: 'confused' } }) + actor('you', t, { ...HERO, ...pose }, { arms: false });
  let o = E.plaza(t, cam, { chars, over: E.poof(HERO.x, HERO.y - 820 * HERO.s, t - B.hoodUp + 0.05, 0.5, '#FFFFFF', 7, false) });
  if (dashing) o += streaks(t, 300, 900, 14, 7, '#FFFFFF', 0.6 * u, 3200, 1);
  return o + smash(t, CUT.hood, 0.08, 0.4);
}

// 32. "Nobody look at me. I'm a tree. I'm a tree." — then the family walks over and parks next to the tree
function shTree(t) {
  const hide = TREE.hide;
  const stepOut = seg(t, B.tree1 - 0.35, B.tree1 - 0.05), back = seg(t, B.hide, B.hide + 0.3);
  const outK = ease.inOut(stepOut) * (1 - ease.inOut(back));
  const hx = lerp(TREE.peekR.x + 40, -380, outK);
  const peekK = t < B.tree1 - 0.35 ? ease.inOut(seg(t, CUT.tree, CUT.tree + 0.4)) : 0;
  const cam = camKeys(t, [[CUT.tree, camAt(-560, 640, 1.25)], [B.tree1, camAt(-480, 630, 1.4)], [B.tree2 - 0.1, camAt(-440, 600, 1.45)], [B.tree2 + 0.3, camAt(-400, 520, 2.3)], [B.famIn + 0.2, camAt(-400, 525, 2.35)], [B.famIn + 0.75, camAt(-480, 650, 1.32)], [END, camAt(-560, 650, 1.32)]], ease.inOut);
  const branches = outK > 0.5;
  const sway = Math.sin(t * 3);
  const heroP = outK > 0.02
    ? { x: hx, y: hide.y + 10, s: hide.s, hood: true, armL: branches ? 150 + 6 * sway : 14, armR: branches ? 150 - 6 * sway : 14, headRot: 3 * sway, face: { name: 'nervous', eyes: { look: [Math.sin(t * 5) > 0 ? 0.7 : -0.7, 0] }, fx: t > B.tree2 ? ['sweat', 'sweat2'] : ['sweat'] }, props: branches ? [{ svg: leaves(), layer: 'front' }] : [] }
    : { x: lerp(hide.x, TREE.peekR.x, peekK), y: hide.y, s: hide.s, hood: true, view: 'front', turn: -0.3, face: { name: 'scared', eyes: { look: [Math.sin(t * 6) > 0 ? 0.8 : -0.8, 0] } } };
  // the family strolls in from the right and stops at SC 05's spots
  let fam = '';
  const fk = (j) => seg(t, B.famIn + 0.12 * j, B.famIn + 1.2 + 0.12 * j);
  const famOne = (key, who, j, extra = {}) => {
    const u = fk(j), p = FAM_END[key], s = sAt(p.y);
    if (u <= 0) return '';
    const x = lerp(p.x + 900, p.x, ease.out(u));
    const walking = u < 1;
    return actor(who, t, { x, y: p.y, s, ...(walking ? { view: 'side', ...AC.walk(t * 9 + j) } : { turn: -0.4, face: who === 'dadAvatar' ? { name: 'happy', mouth: 'smile' } : HAPPY, armR: who === 'dadAvatar' ? 120 + 30 * Math.sin(t * 9) : 16 }), ...extra });
  };
  fam += famOne('gran', 'grandmaAvatar', 2) + famOne('mom', 'momAvatar', 1) + famOne('dad', 'dadAvatar', 0);
  const heroSvg = actor('you', t, heroP, { arms: false });
  // hidden: behind the tree (before front); stepped out: in front
  const behind = outK > 0.02 ? '' : heroSvg;
  const chars = (outK > 0.02 ? heroSvg : '') + fam;
  let over = '';
  if (t > B.tree2 && t < B.famIn + 0.7) over += K.C.sfx('(tree)', hx + 200, hide.y - 520, seg(t, B.tree2 + 0.2, B.tree2 + 0.5), 46, 6, '#C9F2B0');
  // a noob kid wanders by and stares
  const kidU = seg(t, B.tree2 - 0.6, B.famIn + 0.4);
  if (kidU > 0 && kidU < 1) over += K.draw.noob(0, { x: lerp(-1200, -760, Math.min(1, kidU * 1.6)), y: 1000, s: sAt(1000) * 1.25, nametag: false, t, ...(kidU < 0.62 ? { view: 'side', flip: true, ...AC.walk(t * 9) } : { turn: 0.5, face: { name: 'confused' } }) }) + (kidU > 0.62 ? mark('?', -700, 600, seg(kidU, 0.62, 0.75), 60, -8, '#FFFFFF') : '');
  let o = E.plaza(t, cam, { behind, chars, over });
  return o + whip(t, CUT.tree, -1, 0.1);
}
function leaves() {
  let s = '';
  const pts = [[-330, -880, 20], [-300, -950, -30], [330, -880, -20], [300, -950, 25], [0, -1020, 0]];
  for (const [x, y, r] of pts) s += S.g(S.rect(-34, -22, 68, 44, 10, ol('#5CC96B', 5)) + S.path('M-24 0 H24', ln(4, '#3E9B4F')), tf(x, y, 1, r));
  return s;
}

// ---------------------------------------------------------------- the shot list
const SHOTS = [
  [CUT.spawnDad, shSpawnDad, null], [CUT.spawnMom, shSpawnMom, null], [CUT.spawnGran, shSpawnGran, null], [CUT.horror, shHorror, null], [CUT.turn, shTurn, null],
  [CUT.names, shNames, null], [CUT.caps, shCaps, 'warm'], [CUT.hello, shHello, null], [CUT.itIsDad, shItIsDad, null], [CUT.loveDad, shLoveDad, null],
  [CUT.noodle, shNoodle, null], [CUT.whisper, shWhisper, 'warm'], [CUT.ruleOne, shRuleOne, 'warm'], [CUT.emote, shEmote, 'warm'], [CUT.wheel, shWheel, 'warm'],
  [CUT.kiss, shKiss, null], [CUT.love, shLove, null], [CUT.dark, shDark, null], [CUT.silence, shSilence, null], [CUT.dadGot, shDadGot, 'warm'],
  [CUT.wall, shWall, null], [CUT.spacebar, shSpacebar, 'warm'], [CUT.spaceBar, shSpaceBar, 'warm'], [CUT.notPress, shNotPress, 'warm'], [CUT.saidIt, shSaidIt, 'warm'],
  [CUT.toComp, shToComp, null], [CUT.dear, shDear, 'warm'], [CUT.where, shWhere, null], [CUT.flood, shFlood, null], [CUT.flood2, shFlood2, null],
  [CUT.hood, shHood, null], [CUT.tree, shTree, null],
];
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x[0]) s = x; return s; };

module.exports = {
  scene(t) { return shotAt(t)[1](t); },
  look(t) { const g = shotAt(t)[2]; return g ? { grade: g, vignette: 0.75 } : { grade: null, vignette: 0.5 }; },
  captionY(t) { const f_ = shotAt(t)[1]; return f_ === shWhere || f_ === shFlood ? 1030 : 1010; },
  CUT, BEATS: { ...B, HERO, NOODLE, DB, PAD, WALLD, TREE, FAM_END },
};
