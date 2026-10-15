// Рендер POV-теста в видео через headless Chromium (WebGL на SwiftShader) и ffmpeg.
//
// Нужны Playwright, three и шрифты:  npm i --no-save playwright three @fontsource/space-grotesk @fontsource/jetbrains-mono
// Видео:   node pov/render.js [fps]            -> pov/out/style_test.mp4 (60 к/с по умолчанию; со звуком, если есть pov/out/audio.wav)
// Кадры:   node pov/render.js --stills 2,9.5   -> pov/out/still_2.png, pov/out/still_9.5.png
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
  const stills = args[0] === '--stills' ? args[1].split(',').map(Number) : null;
  const fps = stills ? 0 : parseFloat(args[0] || String(SCENE.fps));
  fs.mkdirSync(OUT, { recursive: true });

  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/pov/index.html`;
  const browser = await chromium.launch({
    executablePath: executable(),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.error('page:', e.message));
  await page.goto(url);
  await page.waitForFunction('window.ready === true', null, { timeout: 120000 });
  const stage = await page.$('#stage');

  if (stills) {
    for (const t of stills) {
      await page.evaluate((s) => window.renderAt(s), t);
      const file = path.join(OUT, `still_${t}.png`);
      await stage.screenshot({ path: file });
      console.log(path.relative(ROOT, file));
    }
  } else {
    const video = path.join(OUT, 'video.mp4');
    const frames = Math.round(DURATION * fps);
    const started = Date.now();
    await run(
      'ffmpeg',
      ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', video],
      async (stdin) => {
        for (let i = 0; i < frames; i++) {
          await page.evaluate((s) => window.renderAt(s), i / fps);
          stdin.write(await stage.screenshot({ type: 'jpeg', quality: 95 }));
          if (i % 60 === 0) console.log(`frame ${i}/${frames}  ${((Date.now() - started) / 1000).toFixed(0)} s`);
        }
        stdin.end();
      }
    );
    const audio = path.join(OUT, 'audio.wav');
    const final = path.join(OUT, 'style_test.mp4');
    if (fs.existsSync(audio)) {
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
