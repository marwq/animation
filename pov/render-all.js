// Рендер всего ролика в несколько браузеров параллельно: кадры делятся на куски равной «стоимости»
// (улица с городом рисуется дольше подземелья), куски склеиваются без перекодирования, потом звук.
//
//   node pov/render-all.js [jobs=3] [fps=60]   -> pov/out/style_test.mp4 (со звуком из pov/out/audio.wav)
//   node pov/render-all.js 3 60 --range 180,240 --out pov/out/min/video_180_240.mp4   (одна минута, без звука)
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const APP = process.env.APP || 'pov'; // APP=spin — ролик из папки spin (см. render.js)
const OUT = path.join(ROOT, APP, 'out');
const SCENE = JSON.parse(fs.readFileSync(path.join(ROOT, APP, 'scene.json'), 'utf8'));
const argv = process.argv.slice(2);
const opt = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const plain = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
const jobs = parseInt(plain[0] || '3', 10);
const fps = parseFloat(plain[1] || String(SCENE.fps));
const span = opt('--range') ? opt('--range').split(',').map(Number) : [0, SCENE.duration];
const first = Math.round(span[0] * fps);
const frames = Math.round(span[1] * fps);
const tag = opt('--range') ? `_${span[0]}_${span[1]}` : '';
const cost = (i) => (i / fps < SCENE.under ? 1.7 : 1.0);

function run(cmd, args, log) {
  return new Promise((resolve, reject) => {
    const out = log ? fs.openSync(log, 'w') : 'inherit';
    const p = spawn(cmd, args, { cwd: ROOT, stdio: ['ignore', out, out] });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`))));
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  // границы кусков по накопленной стоимости кадров
  let total = 0;
  for (let i = first; i < frames; i++) total += cost(i);
  const cuts = [first];
  let acc = 0;
  for (let i = first; i < frames && cuts.length < jobs; i++) {
    acc += cost(i);
    if (acc >= (total * cuts.length) / jobs) cuts.push(i + 1);
  }
  cuts.push(frames);
  const parts = [];
  const tasks = [];
  for (let j = 0; j < jobs; j++) {
    const file = path.join(OUT, `part${tag}_${j}.mp4`);
    parts.push(file);
    const range = `${cuts[j] / fps},${cuts[j + 1] / fps}`;
    console.log(`part ${j}: frames ${cuts[j]}–${cuts[j + 1]} (${range} s)`);
    tasks.push(run('node', ['pov/render.js', String(fps), '--range', range, '--out', file], path.join(OUT, `render${tag}_${j}.log`)));
  }
  await Promise.all(tasks);
  const list = path.join(OUT, `parts${tag}.txt`);
  fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n') + '\n');
  const video = opt('--out') ? path.resolve(ROOT, opt('--out')) : path.join(OUT, 'video.mp4');
  fs.mkdirSync(path.dirname(video), { recursive: true });
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);
  if (opt('--out')) {
    for (const p of parts) fs.unlinkSync(p);
    console.log(path.relative(ROOT, video));
    return;
  }
  const audio = path.join(OUT, 'audio.wav');
  const final = path.join(OUT, 'style_test.mp4');
  if (fs.existsSync(audio)) await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-i', audio, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', final]);
  else fs.copyFileSync(video, final);
  console.log(path.relative(ROOT, final));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
