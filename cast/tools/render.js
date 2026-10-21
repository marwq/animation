// Render every cast/concepts/*.svg to a PNG next to it using headless Chromium.
//   NODE_PATH=$(npm root -g) node cast/tools/render.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const dir = path.join(__dirname, '..', 'concepts');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.svg'))) {
    const svg = fs.readFileSync(path.join(dir, file), 'utf8');
    const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/);
    await page.setViewportSize({ width: +w, height: +h });
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.screenshot({ path: path.join(dir, file.replace('.svg', '.png')), clip: { x: 0, y: 0, width: +w, height: +h } });
    console.log('rendered', file);
  }
  await browser.close();
})();
