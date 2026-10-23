#!/usr/bin/env python3
"""Центры глаз для «сердечек вместо глаз»: ищет два самых крупных тёмных пятна в слое глаз
каждого рига и пишет animations/eyes.json:
  {"<риг>": {"layer": "<слой глаз>", "eyes": [[x, y, r], [x, y, r]]}}   (пиксели рига)

  python3 -I tools/eyes.py
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EYE_LAYERS = ['eye', 'normal']           # отдельный слой глаз или вариант 'normal' переключателя eyes


def blobs(mask):
    """Связные области маски (4-связность): [(площадь, xs, ys)], крупные первыми."""
    h, w = mask.shape
    seen = np.zeros_like(mask, bool)
    out = []
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]:
            continue
        stack = [(y0, x0)]
        seen[y0, x0] = True
        ys, xs = [], []
        while stack:
            y, x = stack.pop()
            ys.append(y); xs.append(x)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                v, u = y + dy, x + dx
                if 0 <= v < h and 0 <= u < w and mask[v, u] and not seen[v, u]:
                    seen[v, u] = True
                    stack.append((v, u))
        out.append((len(xs), np.array(xs), np.array(ys)))
    out.sort(key=lambda b: -b[0])
    return out


def eyes_of(rig_dir):
    rig = json.load(open(os.path.join(rig_dir, 'rig.json')))
    layers = list(rig['layers'])
    for s in rig['switches']:
        if s['name'] == 'eyes':
            layers += [dict(c, name=c['name']) for c in s['children']]
    for name in EYE_LAYERS:
        L = next((l for l in layers if l['name'] == name), None)
        if L:
            break
    else:
        return None
    k = 4                                                    # ищем на уменьшенной в 4 раза картинке
    im = Image.open(os.path.join(rig_dir, L['png'])).convert('RGBA')
    im = im.resize((im.width // k, im.height // k))
    a = np.asarray(im).astype(int)
    dark = (a[:, :, 3] > 128) & (a[:, :, :3].max(2) < 90)
    found = [b for b in blobs(dark)[:6] if b[0] > 12]
    # два самых крупных пятна, примерно на одной высоте
    best = found[:2]
    if len(best) < 2:
        return None
    eyes = []
    for _, xs, ys in sorted(best, key=lambda b: b[1].mean()):
        r = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2
        eyes.append([round(float(xs.mean()) * k), round(float(ys.mean()) * k), round(float(r) * k)])
    return {'layer': L['name'], 'eyes': eyes}


if __name__ == '__main__':
    out = {}
    for name in sorted(os.listdir(os.path.join(ROOT, 'rigs'))):
        d = os.path.join(ROOT, 'rigs', name)
        if os.path.isfile(os.path.join(d, 'rig.json')):
            e = eyes_of(d)
            if e:
                out[name] = e
            print(name, e)
    with open(os.path.join(ROOT, 'animations', 'eyes.json'), 'w') as f:
        json.dump(out, f, indent=1)
