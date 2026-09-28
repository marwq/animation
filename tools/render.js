// Рендер SVG персонажей в PNG через headless Chromium:
// characters/<имя>/*.svg -> characters/<имя>/png/*.png
//
// Нужен Playwright:  npm i --no-save playwright && npx playwright install chromium
// Запуск из корня:   node tools/render.js [масштаб] [имя ...]   (масштаб по умолчанию 2)
//
// Отдельные виды сохраняются с прозрачным фоном, лист разворота — со своим фоном.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const CHARS = path.join(ROOT, 'characters');
const [scaleArg, ...only] = process.argv.slice(2);
const scale = parseFloat(scaleArg || '2');

(async () => {
  const browser = await chromium.launch();
  const names = only.length ? only : fs.readdirSync(CHARS).filter((d) => fs.statSync(path.join(CHARS, d)).isDirectory());
  for (const name of names.sort()) {
    const src = path.join(CHARS, name);
    const dst = path.join(src, 'png');
    fs.mkdirSync(dst, { recursive: true });
    for (const file of fs.readdirSync(src).filter((f) => f.endsWith('.svg')).sort()) {
      const svg = fs.readFileSync(path.join(src, file), 'utf8');
      const [, , w, h] = svg.match(/viewBox="([^"]+)"/)[1].trim().split(/\s+/).map(Number);
      const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
      await page.setContent(
        `<!doctype html><html><head><meta charset="utf-8"><style>` +
          `html,body{margin:0;background:transparent}svg{display:block;width:${w}px;height:${h}px}` +
          `</style></head><body>${svg}</body></html>`
      );
      const out = path.join(dst, file.replace(/\.svg$/, '.png'));
      await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
      await page.close();
      console.log(`${path.relative(ROOT, out)}  ${w * scale}x${h * scale}`);
    }
  }
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
