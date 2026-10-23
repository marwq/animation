// Рендер анимации из animations/<сцена>/ в MP4 через headless Chromium + ffmpeg.
//
//   node tools/render_anim.js animations/skeleton-vs-lord           # всё видео -> <сцена>/<имя>.mp4
//   node tools/render_anim.js animations/skeleton-vs-lord --still 4.0,7.4 --out /tmp/kadry
//                                                                # отдельные кадры (секунды) в PNG
//   node tools/render_anim.js animations/<сцена> --audio-only     # пересвести только звук
//   node tools/render_anim.js animations/<сцена> --mute           # видео без звука
//
// Звук: если сцена отдаёт window.SCENE.audio() (метки звуковых эффектов), tools/sfx.py
// сводит его в WAV, и он кладётся в MP4 дорожкой AAC.
//
// Сцена — index.html, который выставляет window.READY (Promise), window.SCENE
// ({fps, duration, width, height, name}) и window.renderFrame(номер кадра).
// Нужны Playwright (см. README) и ffmpeg с libx264.
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const sceneDir = path.resolve(args[0] || 'animations/skeleton-vs-lord');
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const page_ = opt('--page') || 'index.html';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };

function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

function run(cmd, argv) {
  return new Promise((ok, fail) => {
    const p = spawn(cmd, argv, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('close', (c) => (c ? fail(new Error(`${cmd} ${c}`)) : ok()));
  });
}

// звук сцены -> WAV -> дорожка AAC в готовом MP4 (видео копируется без пережатия)
async function addSound(page, mp4) {
  const audio = await page.evaluate(() => (window.SCENE.audio ? window.SCENE.audio() : null));
  if (!audio) return;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sound-'));
  const cues = path.join(tmp, 'cues.json'), wav = path.join(tmp, 'sound.wav'), out = path.join(tmp, 'out.mp4');
  fs.writeFileSync(cues, JSON.stringify(audio));
  await run('python3', [path.join(__dirname, 'sfx.py'), cues, wav]);
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  fs.copyFileSync(out, mp4);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`звук: ${audio.cues.length} меток`);
}

(async () => {
  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/${path.relative(ROOT, sceneDir)}/${page_}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', (m) => console.log('[page]', m.text()));
  page.on('pageerror', (e) => { console.error('[page error]', e); process.exitCode = 1; });
  await page.goto(url);
  await page.evaluate(() => window.READY);
  const scene = await page.evaluate(() => window.SCENE);
  await page.setViewportSize({ width: scene.width, height: scene.height });
  const clip = { x: 0, y: 0, width: scene.width, height: scene.height };

  const stills = opt('--still');
  if (args.includes('--audio-only')) {
    await addSound(page, path.join(sceneDir, `${scene.name}.mp4`));
  } else if (stills) {
    const out = path.resolve(opt('--out') || path.join(sceneDir, 'stills'));
    fs.mkdirSync(out, { recursive: true });
    for (const s of stills.split(',')) {
      const f = Math.round(parseFloat(s) * scene.fps);
      await page.evaluate((n) => window.renderFrame(n), f);
      const file = path.join(out, `t${parseFloat(s).toFixed(2)}.png`);
      await page.screenshot({ path: file, clip });
      console.log(file);
    }
  } else {
    const total = Math.round(scene.duration * scene.fps);
    const mp4 = path.join(sceneDir, `${scene.name}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(scene.fps),
      '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((ok, fail) => ff.on('close', (c) => (c ? fail(new Error('ffmpeg ' + c)) : ok())));
    for (let f = 0; f < total; f++) {
      await page.evaluate((n) => window.renderFrame(n), f);
      const buf = await page.screenshot({ clip });
      if (!ff.stdin.write(buf)) await new Promise((ok) => ff.stdin.once('drain', ok));
      if (f % 50 === 0) console.log(`кадр ${f}/${total}`);
    }
    ff.stdin.end();
    await done;
    if (!args.includes('--mute')) await addSound(page, mp4);
    console.log(`${path.relative(ROOT, mp4)}  ${total} кадров, ${scene.fps} fps`);
  }
  await browser.close();
  server.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
