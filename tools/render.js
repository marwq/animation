// Рендер SVG из character/ в PNG (character/png/) через headless Chromium.
//
// Нужен Playwright:  npm i -D playwright && npx playwright install chromium
// Запуск из корня:   node tools/render.js [масштаб]   (по умолчанию 2)
//
// Отдельные виды сохраняются с прозрачным фоном, лист разворота — со своим фоном.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'character');
const DST = path.join(SRC, 'png');
const scale = parseFloat(process.argv[2] || '2');

(async () => {
  fs.mkdirSync(DST, { recursive: true });
  const browser = await chromium.launch();
  const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.svg')).sort();
  for (const file of files) {
    const svg = fs.readFileSync(path.join(SRC, file), 'utf8');
    const [, , w, h] = svg.match(/viewBox="([^"]+)"/)[1].trim().split(/\s+/).map(Number);
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"><style>` +
        `html,body{margin:0;background:transparent}svg{display:block;width:${w}px;height:${h}px}` +
        `</style></head><body>${svg}</body></html>`
    );
    const out = path.join(DST, file.replace(/\.svg$/, '.png'));
    await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    await page.close();
    console.log(`${path.relative(ROOT, out)}  ${w * scale}x${h * scale}`);
  }
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
