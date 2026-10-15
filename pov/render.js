// Рендер POV-теста в видео через headless Chromium (WebGL на SwiftShader) и ffmpeg.
//
// Нужны Playwright, three и шрифты:  npm i --no-save playwright three @fontsource/space-grotesk @fontsource/jetbrains-mono
// Видео:   node pov/render.js [fps]            -> pov/out/style_test.mp4 (60 к/с по умолчанию; со звуком, если есть pov/out/audio.wav)
// Кусок:   node pov/render.js 60 --range 30,60 --out pov/out/part.mp4   (кадры с 30 по 60 с, без звука; см. render-all.js)
// Кадры:   node pov/render.js --stills 2,9.5   -> pov/out/still_2.png, pov/out/still_9.5.png
// Позы:    node pov/render.js --debug 14,20 front,side -> вид на героя со стороны: pov/out/debug_14_front.png …
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const SCENE = JSON.parse(fs.readFileSync(path.join(__dirname, 'scene.json'), 'utf8'));
const DURATION = SCENE.duration;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff' };

// Модули ES и шрифты не грузятся со страницы file://, поэтому отдаём корень репозитория по HTTP
function serve() {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// Браузер из предустановленных (/opt/pw-browsers), если версия Playwright ждёт другую ревизию
function executable() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!fs.existsSync(base)) return undefined;
  for (const dir of fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
    for (const sub of ['chrome-linux64', 'chrome-linux']) {
      const p = path.join(base, dir, sub, 'chrome');
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

function run(cmd, args, input) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: [input ? 'pipe' : 'ignore', 'ignore', 'inherit'] });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`))));
    if (input) input(p.stdin);
  });
}

(async () => {
  const args = process.argv.slice(2);
  const debug = args[0] === '--debug' ? { times: args[1].split(',').map(Number), views: (args[2] || 'front,side').split(',') } : null;
  const stills = args[0] === '--stills' ? args[1].split(',').map(Number) : null;
  const fps = stills || debug ? 0 : parseFloat(args[0] || String(SCENE.fps));
  const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
  const range = opt('--range') ? opt('--range').split(',').map(Number) : null;
  fs.mkdirSync(OUT, { recursive: true });

  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/pov/index.html`;
  const browser = await chromium.launch({
    executablePath: executable(),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.error('page:', e.message));
  await page.goto(url, { waitUntil: 'commit', timeout: 180000 });
  await page.waitForFunction('window.ready === true', null, { timeout: 900000, polling: 500 });
  const stage = await page.$('#stage');

  if (debug) {
    for (const t of debug.times) {
      for (const v of debug.views) {
        await page.evaluate(([s, view]) => window.renderDebug(s, view), [t, v]);
        const file = path.join(OUT, `debug_${t}_${v}.png`);
        await stage.screenshot({ path: file });
        console.log(path.relative(ROOT, file));
      }
    }
  } else if (stills) {
    for (const t of stills) {
      await page.evaluate((s) => window.renderAt(s), t);
      const file = path.join(OUT, `still_${t}.png`);
      await stage.screenshot({ path: file });
      console.log(path.relative(ROOT, file));
    }
  } else {
    const video = opt('--out') ? path.resolve(opt('--out')) : path.join(OUT, 'video.mp4');
    const first = range ? Math.round(range[0] * fps) : 0;
    const last = range ? Math.round(range[1] * fps) : Math.round(DURATION * fps);
    const started = Date.now();
    await run(
      'ffmpeg',
      ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', video],
      async (stdin) => {
        for (let i = first; i < last; i++) {
          await page.evaluate((s) => window.renderAt(s), i / fps);
          stdin.write(await stage.screenshot({ type: 'jpeg', quality: 95 }));
          if ((i - first) % 60 === 0) console.log(`frame ${i - first}/${last - first}  ${((Date.now() - started) / 1000).toFixed(0)} s`);
        }
        stdin.end();
      }
    );
    const audio = path.join(OUT, 'audio.wav');
    const final = path.join(OUT, 'style_test.mp4');
    if (range) {
      console.log(path.relative(ROOT, video));
    } else if (fs.existsSync(audio)) {
      await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-i', audio, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', final]);
    } else {
      fs.copyFileSync(video, final);
    }
    console.log(path.relative(ROOT, final));
  }
  await browser.close();
  server.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
