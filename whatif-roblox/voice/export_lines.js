// Dump every dialogue line of the animation (old timeline) -> voice/anim_lines.json
'use strict';
const path = require('path');
const fs = require('fs');
const mods = ['sc01b', 'sc02', 'sc03', 'sc04', 'sc05', 'sc06', 'sc07', 'sc08', 'sc10', 'sc10b', 'sc11', 'sc11b', 'sc12'];
const out = [];
const intro = require('../scenes/intro');
intro.CAPS.forEach((c, i) => out.push({ mod: 'intro', idx: i, a: c[0], b: c[1], sp: 'NARRATOR', text: c[2], cap: true }));
for (const m of mods) {
  const M = require('../scenes/' + m);
  M.LINES.forEach((l, i) => out.push({ mod: m, idx: i, a: l[0], b: l[1], sp: l[2], text: l[3] }));
}
out.sort((x, y) => x.a - y.a);
fs.writeFileSync(path.join(__dirname, 'anim_lines.json'), JSON.stringify(out, null, 1));
console.log(out.length, 'lines');
