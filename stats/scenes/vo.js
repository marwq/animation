// Voice-driven helpers: the master timeline (voice/timeline.py), captions, lip-sync, auto-acting.
// Every scene times itself from the real voice: L('03.4').start, L('03.4').word('MILLIONAIRE').t0 ...
'use strict';

const TL = require('./timeline.json');
const C = require('./common');
const S = require('../rig/svg');
const { clamp } = S;

const BY_ID = {};
for (const l of TL.lines) BY_ID[l.id] = l;

// ---------------------------------------------------------------- line access
function L(id) {
  const l = BY_ID[id];
  if (!l) throw new Error('no line ' + id);
  return {
    ...l,
    a: l.speechStart, b: l.speechEnd,
    // first word matching (case-insensitive, punctuation ignored); n-th occurrence with n
    word(w, n = 0) {
      const key = w.toLowerCase().replace(/[^a-z0-9#]/g, '');
      const hits = l.words.filter((x) => x[0].toLowerCase().replace(/[^a-z0-9#]/g, '') === key);
      const h = hits[n] || hits[hits.length - 1];
      if (!h) throw new Error(`word "${w}" not in line ${id}: ${l.text}`);
      return { t0: h[1], t1: h[2] };
    },
  };
}
const scene = (id) => TL.scenes[id];

// ---------------------------------------------------------------- captions + visemes (one global track)
const TRACK_LINES = TL.lines.map((l) => {
  const toks = l.words.map(([w]) => {
    const bare = w.replace(/[^A-Za-z]/g, '');
    return bare.length > 1 && bare === bare.toUpperCase() ? `*${w}*` : w;
  });
  return [l.speechStart, l.speechEnd, l.speaker, toks.join(' '), l.words.map(([, a, b]) => [a, b])];
});
const TRACK = C.makeTrack(TRACK_LINES);

function viseme(speaker, t) {
  return C.visemeAt(TRACK, speaker, t);
}
function lineAt(speaker, t, pad = 0) {
  return TL.lines.find((l) => l.speaker === speaker && t >= l.speechStart - pad && t <= l.speechEnd + pad) || null;
}
function talking(speaker, t) {
  return !!lineAt(speaker, t);
}

// ---------------------------------------------------------------- emotion from the line's [tags]
const TAG_FACE = [
  [/screams with joy|yells joyfully|giddy|hyped|excited|joy|giggl|crying happily|glowing|cheering|chanting|bubbly|singing/, 'excited'],
  [/skeptical|not laughing|honest|flatly|mumbling|facepalm|typing slowly|cold|gruff|dismissive|distracted|awkward/, 'deadpan'],
  [/sleepy/, 'sleepy'],
  [/laugh|chuckles/, 'joy'],
  [/proud|showing off|smug|evil grin|grudging|cocky|grinning|mocking|expert|casual|confident/, 'smug'],
  [/annoyed|outraged|offended|angry|frustrated|defensive|cold, booming|grumpy/, 'angry'],
  [/panick|scared|alarm|nervous|uneasy|hesitat|whimper|startled|stressed|shaky|breathless|sneez|worried|chattering|horrified|backing away|hugging the pole|looping|glitch|frozen/, 'scared'],
  [/stunned|shocked|horrified|gasps|disbelief|awed|surprised|amazed/, 'shocked'],
  [/devastat|defeated|ashamed|regret|sad|crying|sobbing|small|voice cracking|quiet|sulking|tired|groans|hurt|disappointed|whiny|miserable|deflating|sad smile|pleading|embarrassed/, 'sad'],
  [/deadpan|flat|bored|sarcastic|calm|muffled|unimpressed/, 'deadpan'],
  [/whisper|secretive|mysterious|mischievous|dramatic|greedy|hungry|grave|suspicious/, 'sneaky'],
  [/determined|grim|firm|brave|competitive|focused|serious|stern|shouting|booming|heroic|urgent|fierce|battle cry|commanding|inspiring|epic|cracking knuckles/, 'determined'],
  [/confused|calculating|thinking|realizing|curious/, 'confused'],
  [/warm|sincere|touched|encouraging|cheerful|content|sweet|simple|soft|delighted|pleased|happy|smiling|impressed|reflective|dreamy|gentle|nostalgic|polite|storyteller|announcing|warmly|touched|shy|kind|gently|carefully/, 'happy'],
];
function faceForLine(l) {
  if (!l) return null;
  const tags = (l.raw.match(/\[([^\]]*)\]/g) || []).join(' ').toLowerCase();
  for (const [re, name] of TAG_FACE) if (re.test(tags)) return name;
  return 'talkHappy';
}

// ---------------------------------------------------------------- auto-acting
// perform(speaker, t, base): returns pose fields (face, body bob, head tilt, gesture arms) for a character.
// base: { face?: name|object (overrides tag face), arms?: false to keep arms, energy?: 0..2, seed? }
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const GESTURES = [
  (u) => ({ armR: 30 + 50 * u, armL: 8 }),                  // offer hand
  (u) => ({ armR: 12, armL: 30 + 46 * u }),                 // other hand
  (u) => ({ armR: 60 * u + 10, armL: 60 * u + 10 }),        // both hands open
  (u) => ({ armR: 150 * u, armL: 10 }),                     // point up / raise
  (u) => ({ armR: 24 + 18 * u, armL: 24 + 18 * u, lean: 3 * u }), // shrug-ish
];
function perform(speaker, t, base = {}) {
  const seed = base.seed ?? speaker.length * 7.3;
  const l = lineAt(speaker, t, 0.05);
  const out = {};
  const energy = base.energy ?? 1;
  // idle breathing + automatic blinks
  out.bodyY = 3 + 3 * Math.sin(t * 4.2 + seed);
  out.headY = 2 * Math.sin(t * 4.2 + seed);
  const blinkT = (t + seed * 0.37) % 3.7;
  const blink = blinkT < 0.12 ? Math.sin((blinkT / 0.12) * Math.PI) : 0;
  let face = base.face !== undefined ? base.face : null;
  if (l) {
    const v = viseme(speaker, t);
    face = face || faceForLine(l);
    const w = l.words.find((x) => t >= x[1] && t <= x[2]);
    const wi = w ? l.words.indexOf(w) : 0;
    const beat = w ? Math.sin(((t - w[1]) / Math.max(0.08, w[2] - w[1])) * Math.PI) : 0;
    out.headRot = (base.headRot || 0) + energy * (4 * Math.sin(t * 2.3 + seed) + 3 * beat * (wi % 2 ? 1 : -1));
    out.bodyY += energy * 6 * beat;
    if (base.arms !== false) {
      // a new gesture every ~1.6 s, eased in and out
      const slot = Math.floor((t - l.speechStart) / 1.6);
      const g = GESTURES[Math.floor(hash(seed + slot * 3.1 + l.start) * GESTURES.length)];
      const ph = ((t - l.speechStart) % 1.6) / 1.6;
      const u = Math.sin(Math.min(1, ph * 1.4) * Math.PI) * clamp(energy, 0, 1.6);
      Object.assign(out, g(u));
    }
    const fo = typeof face === 'string' ? { name: face } : { ...face };
    fo.mouth = v || fo.mouth;
    if (blink) fo.blink = blink;
    out.face = fo;
  } else {
    const fo = face ? (typeof face === 'string' ? { name: face } : { ...face }) : { name: 'neutral' };
    if (blink && fo.blink === undefined) fo.blink = blink;
    out.face = fo;
    out.headRot = base.headRot || 0;
  }
  return out;
}

module.exports = { TL, L, scene, TRACK, viseme, lineAt, talking, faceForLine, perform, DURATION: TL.duration };
