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
  const h = line.match(/^## (SC \d+) · (.+)$/);
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
out += `WHAT IF THE WHOLE WORLD BECAME ROBLOX... AND I HAD TO BEAT STEAL AN EGG?\n`;
out += `ElevenLabs Eleven v4 · Text to Dialogue · voice-over script\n`;
out += `Generated from script/SCRIPT.md — edit the script, then run: node tools/build_vo.js\n`;
out += `Spoken words: ${totalWords} · estimated runtime: ~${mmss(clock)} (incl. silent visual beats)\n`;
out += `${'='.repeat(78)}\n\n`;
out += `HOW TO USE (по-русски)\n`;
out += `- Модель: Eleven v4. Режим Text to Dialogue (кнопка "Add speaker"): каждая строка "SPEAKER: текст"\n`;
out += `  = отдельный блок с выбранным голосом. Имя спикера и двоеточие НЕ вставлять, только текст.\n`;
out += `- Теги в [квадратных скобках] оставляем как есть — это интонация, они не произносятся.\n`;
out += `  КАПС = ударение, "..." и [pause] = паузы, тире "—" = оборванная фраза.\n`;
out += `- Генерируйте по дублям (TAKE). Если строка звучит не так — перегенерируйте только этот дубль,\n`;
out += `  или поменяйте тег на соседний (например [excited] -> [amazed]).\n`;
out += `- NARRATOR и YOU — ОДИН И ТОТ ЖЕ голос (рассказчик и есть герой). Рассказ — бодро и тепло,\n`;
out += `  реплики YOU — живее, громче, с эмоциями.\n`;
out += `- MOM говорит "honey" — озвучиваем как есть, в монтаже закроем "бипом" (шутка про фильтр чата).\n`;
out += `- Файлы называйте по дублям: take01.mp3, take10a.mp3 ... — так я быстрее разложу их по таймлайну.\n\n`;
out += `CAST\n`;
const CAST = {
  NARRATOR: 'same voice as YOU — upbeat guy ~25, bright, smiling, fast, storyteller energy',
  YOU: 'same voice as NARRATOR — more emotional: yells, laughs, whispers, cracks when nervous',
  NOVA: 'young woman, confident, low and cool, a little raspy, playful smirk in the voice',
  EGGLORD: 'cocky teen gamer, drawling, smug, a bit nasal',
  SPEEDY: 'little kid ~7, high-pitched, giggly',
  MOM: 'warm, cheerful mom, sing-song',
  DAD: 'calm dad, dry deadpan humour',
  SYSTEM: 'game announcer — booming, slightly robotic; for "chirpy" lines a bright UI voice',
  BANANA: 'goofy friendly neighbour (can reuse DAD voice, higher and sillier)',
  MONSTER: 'scary creature voice, terrified (can reuse EGGLORD voice)',
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
  if (/^## SC \d+ · /.test(line)) { si++; return line; }
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
