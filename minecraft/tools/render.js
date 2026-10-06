// Рендер SVG серии в PNG через headless Chromium.
// Для каждого файла <папка>/<имя>.svg пишет <папка>/png/<имя>.png.
//
// Нужен Playwright:  npm i --no-save playwright && npx playwright install chromium
// Запуск из корня:   node minecraft/tools/render.js [масштаб] [папка ...]
//                    по умолчанию масштаб 1 и папка minecraft/characters (рекурсивно)
//
// Отдельные виды сохраняются с прозрачным фоном, листы — со своим фоном.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const [scaleArg, ...dirs] = process.argv.slice(2);
const scale = parseFloat(scaleArg || '1');
const targets = (dirs.length ? dirs : ['minecraft/characters']).map((d) => path.resolve(ROOT, d));

function svgFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'png') out.push(...svgFiles(p));
    else if (entry.isFile() && entry.name.endsWith('.svg')) out.push(p);
  }
  return out.sort();
}

(async () => {
  const browser = await chromium.launch();
  for (const dir of targets) {
    for (const file of svgFiles(dir)) {
      const svg = fs.readFileSync(file, 'utf8');
      const [, , w, h] = svg.match(/viewBox="([^"]+)"/)[1].trim().split(/\s+/).map(Number);
      const page = await browser.newPage({ viewport: { width: Math.ceil(w), height: Math.ceil(h) }, deviceScaleFactor: scale });
      await page.setContent(
        `<!doctype html><html><head><meta charset="utf-8"><style>` +
          `html,body{margin:0;background:transparent}svg{display:block;width:${w}px;height:${h}px}` +
          `</style></head><body>${svg}</body></html>`
      );
      const dst = path.join(path.dirname(file), 'png');
      fs.mkdirSync(dst, { recursive: true });
      const out = path.join(dst, path.basename(file).replace(/\.svg$/, '.png'));
      await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
      await page.close();
      console.log(`${path.relative(ROOT, out)}  ${Math.round(w * scale)}x${Math.round(h * scale)}`);
    }
  }
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
