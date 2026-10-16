// Кадры для обложек: чистые (без надписей) и в двойном разрешении, с небольшим доворотом головы и своим углом обзора.
//   node pov/thumbs/grab.js '[{"name":"manhole","t":15.2,"pitch":-8,"fov":70}]'   -> pov/thumbs/src/manhole.png (2560×1440)
// Потом обложки собирает compose.js из pov/thumbs/thumbs.html.
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(__dirname, 'src');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg' };

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

function executable() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!fs.existsSync(base)) return undefined;
  for (const dir of fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
    const p = path.join(base, dir, 'chrome-linux', 'chrome');
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

module.exports = { serve, executable };

if (require.main === module) {
  (async () => {
    const jobs = JSON.parse(process.argv[2]);
    fs.mkdirSync(SRC, { recursive: true });
    const server = await serve();
    const browser = await chromium.launch({ executablePath: executable(), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
    page.on('pageerror', (e) => console.error('page:', e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/pov/index.html?dpr=2&alpha=1`, { waitUntil: 'commit', timeout: 180000 });
    await page.waitForFunction('window.ready === true', null, { timeout: 900000, polling: 500 });
    // только картинка: надписи и затемнения обложка рисует сама
    await page.addStyleTag({ content: '#hud, #caption, #title, #fade, #drops { display: none !important; }' });
    const canvas = await page.$('#c');
    // текстуры слоёв из deep.js — для обложки «туннель сквозь Землю»
    if (process.env.EXPORT_TEXTURES) {
      const names = await page.evaluate(() => Object.keys(window.__dbg.deep.textures).filter((k) => !k.endsWith('_v')));
      for (const n of names) {
        const url = await page.evaluate((k) => { const im = window.__dbg.deep.textures[k].image; return im && im.toDataURL ? im.toDataURL('image/png') : null; }, n);
        if (url) fs.writeFileSync(path.join(SRC, `tex_${n}.png`), Buffer.from(url.split(',')[1], 'base64'));
      }
      console.log('textures:', names.join(' '));
    }
    for (const j of jobs) {
      await page.evaluate((job) => {
        window.__thumb = { yaw: job.yaw || 0, pitch: job.pitch || 0, fov: job.fov || 76, shiftx: job.shiftx || 0 };
        window.renderAt(job.t);
        if (job.bodyOnly) {
          // только тело на прозрачном фоне — для склейки обложки
          const d = window.__dbg;
          // по желанию прячем корпус (он закрывает низ кадра) и/или ноги — остаются руки и кеды
          const parts = [];
          if (job.torso === false) for (const o of d.body.root.children) if (o.isMesh) parts.push(o);
          if (job.legs === false) for (const l of d.body.legs) parts.push(l.hip);
          if (job.rightArm === false) parts.push(d.body.arms[1].shoulder);
          for (const o of parts) o.visible = false;
          const keep = new Set();
          d.body.root.traverse((o) => keep.add(o));
          const hidden = [];
          for (const o of d.scene.children) if (!keep.has(o) && o.visible && !o.isLight) { hidden.push(o); o.visible = false; }
          const bg = d.scene.background;
          const fog = d.scene.fog;
          d.scene.background = null;
          d.scene.fog = null;
          d.renderer.setClearColor(0x000000, 0);
          d.renderer.render(d.scene, d.camera);
          for (const o of hidden) o.visible = true;
          for (const o of parts) o.visible = true;
          d.scene.background = bg;
          d.scene.fog = fog;
        }
      }, j);
      const file = path.join(SRC, `${j.name}.png`);
      if (j.bodyOnly) {
        // прозрачность есть только в самом холсте WebGL (страница под ним чёрная)
        const url = await page.evaluate(() => document.getElementById('c').toDataURL('image/png'));
        fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
      } else {
        await canvas.screenshot({ path: file });
      }
      console.log(path.relative(ROOT, file));
    }
    await browser.close();
    server.close();
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
