// Headless-Chromium SVG renderer: stills (PNG) and videos (MP4 via ffmpeg).
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const S = require('../rig/svg');

const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts');

function fontCss() {
  const face = (family, file, weight = 400) => {
    const b64 = fs.readFileSync(path.join(FONT_DIR, file)).toString('base64');
    return `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:${weight};font-style:normal;}`;
  };
  return face('Fredoka', 'fredoka-latin-600-normal.woff2', 600) +
    face('Fredoka', 'fredoka-latin-700-normal.woff2', 700) +
    face('Lilita One', 'lilita-one-latin-400-normal.woff2', 400);
}

async function openRenderer(w, h) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const html = `<!doctype html><html><head><style>${fontCss()}html,body{margin:0;padding:0;background:#fff;overflow:hidden}
  svg{display:block}</style></head><body>
  <div style="position:absolute;opacity:0;font-family:Fredoka;font-weight:600">Aa<span style="font-family:'Lilita One'">Aa</span><b style="font-family:Fredoka;font-weight:700">Aa</b></div>
  <svg id="root" xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"></svg></body></html>`;
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const render = async (inner, type = 'png') => {
    await page.evaluate((s) => { document.getElementById('root').innerHTML = s; }, inner);
    return page.screenshot({ type, clip: { x: 0, y: 0, width: w, height: h }, ...(type === 'jpeg' ? { quality: 95 } : {}) });
  };
  return { browser, page, render, close: () => browser.close() };
}

async function renderStill(sceneFn, out, w, h) {
  const r = await openRenderer(w, h);
  S.resetIds();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, await r.render(sceneFn()));
  await r.close();
  console.log('wrote', out);
}

// frameFn(t, i) -> svg inner string. Pipes PNG frames into ffmpeg.
async function renderVideo(frameFn, { w = 1920, h = 1080, fps = 60, duration, out, audio = null, crf = 16 }) {
  const r = await openRenderer(w, h);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const args = ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-'];
  if (audio) args.push('-i', audio);
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  if (audio) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push(out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));
  const n = Math.round(duration * fps);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    S.resetIds();
    const buf = await r.render(frameFn(i / fps, i));
    if (!ff.stdin.write(buf)) await new Promise((res) => ff.stdin.once('drain', res));
    if (i % 60 === 0) process.stdout.write(`\rframe ${i}/${n} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  ff.stdin.end();
  await done;
  await r.close();
  console.log(`\nwrote ${out} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

module.exports = { openRenderer, renderStill, renderVideo };
