// Рендер всего ролика в несколько браузеров параллельно: кадры делятся на куски равной «стоимости»
// (улица с городом рисуется дольше подземелья), куски склеиваются без перекодирования, потом звук.
//
//   node pov/render-all.js [jobs=3] [fps=60]   -> pov/out/style_test.mp4 (со звуком из pov/out/audio.wav)
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const SCENE = JSON.parse(fs.readFileSync(path.join(__dirname, 'scene.json'), 'utf8'));
const jobs = parseInt(process.argv[2] || '3', 10);
const fps = parseFloat(process.argv[3] || String(SCENE.fps));
const frames = Math.round(SCENE.duration * fps);
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
  for (let i = 0; i < frames; i++) total += cost(i);
  const cuts = [0];
  let acc = 0;
  for (let i = 0; i < frames && cuts.length < jobs; i++) {
    acc += cost(i);
    if (acc >= (total * cuts.length) / jobs) cuts.push(i + 1);
  }
  cuts.push(frames);
  const parts = [];
  const tasks = [];
  for (let j = 0; j < jobs; j++) {
    const file = path.join(OUT, `part_${j}.mp4`);
    parts.push(file);
    const range = `${cuts[j] / fps},${cuts[j + 1] / fps}`;
    console.log(`part ${j}: frames ${cuts[j]}–${cuts[j + 1]} (${range} s)`);
    tasks.push(run('node', ['pov/render.js', String(fps), '--range', range, '--out', file], path.join(OUT, `render_${j}.log`)));
  }
  await Promise.all(tasks);
  const list = path.join(OUT, 'parts.txt');
  fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n') + '\n');
  const video = path.join(OUT, 'video.mp4');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);
  const audio = path.join(OUT, 'audio.wav');
  const final = path.join(OUT, 'style_test.mp4');
  if (fs.existsSync(audio)) await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-i', audio, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', final]);
  else fs.copyFileSync(video, final);
  console.log(path.relative(ROOT, final));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
