// Contact sheet of single frames: node tools/stills.js out.png t1 t2 ...  (3 columns, 640px tiles, time labels)
'use strict';
const S = require('../rig/svg');
const { openRenderer } = require('./render');
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');
(async () => {
  const out = process.argv[2];
  const times = process.argv.slice(3).map(Number);
  const M = require('../scenes/main');
  const r = await openRenderer(1920, 1080, { staticDefs: M.STATIC_DEFS });
  const tmp = fs.mkdtempSync('/tmp/stills-');
  const files = [];
  for (const [i, t] of times.entries()) {
    S.resetIds();
    const svg = M.frame(t) + `<rect x="0" y="0" width="300" height="80" fill="#000" opacity="0.6"/><text x="20" y="58" font-size="52" fill="#FFE14D" font-family="Fredoka">${t.toFixed(2)}</text>`;
    const p = path.join(tmp, `f${String(i).padStart(3, '0')}.png`);
    fs.writeFileSync(p, await r.render(svg));
    files.push(p);
  }
  await r.close();
  const cols = 3, rows = Math.ceil(files.length / cols);
  const args = ['-v', 'error', '-y'];
  for (const p of files) args.push('-i', p);
  let fc = files.map((_, i) => `[${i}:v]scale=640:360[s${i}];`).join('');
  const pad = rows * cols - files.length;
  for (let i = 0; i < pad; i++) { args.push('-f', 'lavfi', '-i', 'color=c=black:s=640x360'); fc += `[${files.length + i}:v]null[s${files.length + i}];`; }
  const n = rows * cols;
  const layout = Array.from({ length: n }, (_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join('|');
  fc += Array.from({ length: n }, (_, i) => `[s${i}]`).join('') + `xstack=inputs=${n}:layout=${layout}`;
  execFileSync('ffmpeg', [...args, '-filter_complex', fc, '-frames:v', '1', out]);
  console.log('wrote', out);
})().catch((e) => { console.error(e); process.exit(1); });
