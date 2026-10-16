// Снимок страницы из pov/thumbs (3D-сцена обложки или готовая обложка) в PNG.
//   node pov/thumbs/shot.js hole.html "pitch=-62&fov=60" pov/thumbs/src/hole.png [canvas]
// canvas — взять пиксели холста WebGL с прозрачностью; без него — снимок страницы (по умолчанию 1280×720 @2x;
// пятый аргумент — другой размер, например 800x800 для аватара канала).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { serve, executable } = require('./grab.js');

(async () => {
  const [page_, query = '', out, mode, size = '1280x720'] = process.argv.slice(2);
  const [CW, CH] = size.split('x').map(Number);
  const server = await serve();
  const browser = await chromium.launch({ executablePath: executable(), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: CW, height: CH }, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => console.error('page:', e.message));
  page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));
  await page.goto(`http://127.0.0.1:${server.address().port}/pov/thumbs/${page_}?${query}`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction('window.ready === true', null, { timeout: 600000, polling: 300 });
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  if (mode === 'canvas') {
    const url = await page.evaluate(() => { window.render && window.render(); return document.querySelector('canvas').toDataURL('image/png'); });
    fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  } else {
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: CW, height: CH } });
  }
  console.log(out);
  await browser.close();
  server.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
