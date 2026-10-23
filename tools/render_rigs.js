// Рендер риговых персонажей в PNG через headless Chromium:
//   rigs/<имя>/svg/*.svg -> rigs/<имя>/png/*.png   слои: прозрачный фон, общий холст персонажа
//   rigs/<имя>/*.svg     -> rigs/<имя>/*.png       превью, кости, лист вариантов
//
// Нужен Playwright:  npm i --no-save playwright && npx playwright install chromium
// Запуск из корня:   node tools/render_rigs.js [имя ...]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const RIGS = path.join(ROOT, 'rigs');
const only = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch();
  const names = only.length ? only : fs.readdirSync(RIGS).filter((d) => fs.existsSync(path.join(RIGS, d, 'svg')));
  const render = async (pairs) => {
    let page = null;
    let size = '';
    for (const [from, to] of pairs) {
      const svg = fs.readFileSync(from, 'utf8');
      const [, , w, h] = svg.match(/viewBox="([^"]+)"/)[1].trim().split(/\s+/).map(Number);
      if (`${w}x${h}` !== size) {
        if (page) await page.close();
        page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
        size = `${w}x${h}`;
      }
      await page.setContent(
        `<!doctype html><html><head><meta charset="utf-8"><style>` +
          `html,body{margin:0;background:transparent}body>svg{display:block;width:${w}px;height:${h}px}` +
          `</style></head><body>${svg}</body></html>`
      );
      await page.screenshot({ path: to, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    }
    if (page) await page.close();
    return size;
  };
  for (const name of names.sort()) {
    const dir = path.join(RIGS, name);
    const src = path.join(dir, 'svg');
    const dst = path.join(dir, 'png');
    fs.rmSync(dst, { recursive: true, force: true });
    fs.mkdirSync(dst, { recursive: true });
    const files = fs.readdirSync(src).filter((f) => f.endsWith('.svg')).sort();
    const size = await render(files.map((f) => [path.join(src, f), path.join(dst, f.replace(/\.svg$/, '.png'))]));
    const sheets = fs.readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();
    await render(sheets.map((f) => [path.join(dir, f), path.join(dir, f.replace(/\.svg$/, '.png'))]));
    console.log(`rigs/${name}/  ${files.length} PNG слоёв ${size}  + ${sheets.map((f) => f.replace(/\.svg$/, '.png')).join(', ')}`);
  }
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
