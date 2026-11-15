// Builds the ElevenLabs v4 voice-over file (and a JSON line list for the animation
// timeline) from script/SCRIPT.md, and estimates the runtime.
// Usage: node tools/build_vo.js
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'script', 'SCRIPT.md');
const OUT_TXT = path.join(ROOT, 'script', 'VOICEOVER_eleven_v4.txt');
const OUT_JSON = path.join(ROOT, 'script', 'lines.json');

const WPS = 2.75;           // measured on the reference video (165 wpm while speaking)
const LINE_GAP = 0.3;       // breath / speaker switch
const PAUSE = { '[pause]': 0.5, '[long pause]': 1.1 };
const MAX_TAKE_CHARS = 1800; // keeps every take well under the per-generation limit

const md = fs.readFileSync(SRC, 'utf8').split('\n');
const scenes = [];
let cur = null;
for (const raw of md) {
  const line = raw.trimEnd();
  const h = line.match(/^## (SC \d+[a-z]?) · (.+)$/);
  if (h) { cur = { id: h[1], title: h[2], lines: [], silent: 0 }; scenes.push(cur); continue; }
  if (!cur) continue;
  const m = line.match(/^> \*\*([A-Z ]+):\*\* (.+)$/);
  if (m) { cur.lines.push({ speaker: m[1].trim(), text: m[2].trim() }); continue; }
  for (const s of line.matchAll(/⏱ \+([\d.]+)s/g)) cur.silent += Number(s[1]);
}

const spoken = (t) => t.replace(/\[[^\]]*\]/g, ' ').replace(/[—–]/g, ' ').trim();
const words = (t) => spoken(t).split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
function lineSeconds(t) {
  let s = words(t) / WPS + LINE_GAP;
  for (const [tag, v] of Object.entries(PAUSE)) s += (t.split(tag).length - 1) * v;
  s += (t.match(/\.\.\./g) || []).length * 0.3;
  return s;
}
const mmss = (s) => { const r = Math.round(s); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; };

// timing
let clock = 0;
const json = [];
for (const sc of scenes) {
  sc.start = clock;
  for (const l of sc.lines) {
    l.start = clock; l.dur = lineSeconds(l.text); clock += l.dur;
    json.push({ scene: sc.id, speaker: l.speaker, text: l.text, estStart: +l.start.toFixed(2), estDur: +l.dur.toFixed(2) });
  }
  clock += sc.silent;
  sc.end = clock;
  sc.words = sc.lines.reduce((a, l) => a + words(l.text), 0);
}
const totalWords = scenes.reduce((a, s) => a + s.words, 0);

// takes: one per scene, split at line boundaries if too long
const takes = [];
for (const sc of scenes) {
  let chunk = [], len = 0, part = 0;
  const flush = () => {
    if (!chunk.length) return;
    const suffix = part || chunk.length < sc.lines.length ? String.fromCharCode(97 + part) : '';
    takes.push({ sc, part: suffix, lines: chunk });
    part++; chunk = []; len = 0;
  };
  for (const l of sc.lines) {
    const n = l.speaker.length + 2 + l.text.length + 1;
    if (len + n > MAX_TAKE_CHARS) flush();
    chunk.push(l); len += n;
  }
  flush();
}
// fix suffix for scenes that ended up in a single take
for (const t of takes) if (takes.filter((x) => x.sc === t.sc).length === 1) t.part = '';

const speakers = [...new Set(scenes.flatMap((s) => s.lines.map((l) => l.speaker)))];
const count = (sp) => scenes.reduce((a, s) => a + s.lines.filter((l) => l.speaker === sp).length, 0);

let out = '';
out += `WHAT IF ROBUX BECAME REAL MONEY?\n`;
out += `ElevenLabs Eleven v4 · Text to Dialogue · voice-over script\n`;
out += `Generated from script/SCRIPT.md — edit the script, then run: node tools/build_vo.js\n`;
out += `Spoken words: ${totalWords} · estimated runtime: ~${mmss(clock)} (incl. silent visual beats)\n`;
out += `${'='.repeat(78)}\n\n`;
out += `HOW TO USE (по-русски)\n`;
out += `- Модель: Eleven v4. Режим Text to Dialogue: каждая строка "SPEAKER: текст" = отдельный блок\n`;
out += `  с выбранным голосом. Имя спикера и двоеточие НЕ вставлять, только текст.\n`;
out += `- Теги в [квадратных скобках] оставляем — это интонация, они не произносятся.\n`;
out += `  КАПС = ударение, "..." и [pause] = паузы, тире "—" = оборванная фраза.\n`;
out += `- TY — рассказчик и герой (от первого лица): один голос на весь ролик.\n`;
out += `- Генерируйте по дублям (TAKE), файлы называйте take01.mp3, take05a.mp3 ... и кладите рядом .txt/JSON,\n`;
out += `  как в прошлый раз, — так я разложу всё по таймлайну автоматически.\n\n`;
out += `CAST\n`;
const CAST = {
  TY: 'narrator & hero, 12 — energetic young voice, fast, funny, self-ironic (NEW voice, not last video\'s)',
  MIA: 'sister, 16 — sarcastic, dry, bored teen; eye-roll in the voice',
  PICKLE: 'best friend, 12 — goofy, high, super sincere and sweet',
  DAD: 'tired, dramatic dad',
  MOM: 'calm, practical mom, dry humour',
  GRANDMA: 'lively, cheeky gamer grandma',
  THIRTY: 'Thirty Percent Guy — nasal, fast-talking goblin accountant; later huge and booming',
  ANCHOR: 'classic over-the-top TV news anchor',
  SYSTEM: 'bright game-UI voice; booming for BANNED / alarm lines',
  SCAMMER: 'smooth, oily, too-friendly salesman',
  BUTLER: 'polite British robot butler',
};
for (const sp of speakers) out += `  ${sp.padEnd(9)} (${String(count(sp)).padStart(2)} lines)  ${CAST[sp] || ''}\n`;
out += `\n${'='.repeat(78)}\n`;

for (const t of takes) {
  const sc = t.sc;
  const n = String(sc.id.replace('SC ', '')).padStart(2, '0');
  const chars = t.lines.reduce((a, l) => a + l.text.length, 0);
  out += `\n=== TAKE ${n}${t.part} · ${sc.id} ${sc.title} · ~${mmss(sc.start)}–${mmss(sc.end)} · ${t.lines.length} lines · ${chars} chars ===\n\n`;
  for (const l of t.lines) out += `${l.speaker}: ${l.text}\n`;
}
out += `\n=== END ===\n`;

fs.writeFileSync(OUT_TXT, out);

// keep the scene time ranges in SCRIPT.md in sync with the estimate
let si = -1;
const synced = md.map((line) => {
  if (/^## SC \d+[a-z]? · /.test(line)) { si++; return line; }
  if (si >= 0 && /^\*~\d+:\d\d–\d+:\d\d/.test(line)) {
    const sc = scenes[si];
    return line.replace(/^\*~\d+:\d\d–\d+:\d\d/, `*~${mmss(sc.start)}–${mmss(sc.end)}`);
  }
  return line;
});
fs.writeFileSync(SRC, synced.join('\n'));
fs.writeFileSync(OUT_JSON, JSON.stringify(json, null, 1));

console.log(`scenes ${scenes.length}, lines ${json.length}, words ${totalWords}, est. runtime ${mmss(clock)}`);
for (const sc of scenes) console.log(`${sc.id.padEnd(6)} ${mmss(sc.start).padStart(5)}–${mmss(sc.end).padEnd(5)} ${String(sc.words).padStart(4)}w  ${sc.title}`);
console.log('takes:', takes.map((t) => t.sc.id.replace('SC ', '') + t.part).join(' '));
