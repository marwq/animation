#!/usr/bin/env python3
"""Трава Minecraft в рисованном стиле на прозрачном фоне: backgrounds/grass/grass_toon.png.

    python3 tools/mc_grass.py [--tex DIR] [--seed N]

Кустики травы, папоротника и высокой травы из текстур игры: пиксели крупно,
два плоских зелёных тона, толстая чёрная обводка, как у персонажей. Два ряда
вдоль нижнего края кадра 1080×1080: задний мельче и темнее, передний крупнее и
уходит корнями за край — слой кладётся поверх фона.
"""
import os
import random
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZE = 1080
LIGHT, DARK = (112, 198, 60), (78, 158, 46)     # как трава на рисованных фонах
LINE = (28, 26, 26)                             # как контур у персонажей
OUTLINE = 5                                     # толщина обводки, px


def args(a):
    tex = os.path.join(ROOT, 'backgrounds', 'textures')
    opt = {'tex': next(p for p in (os.path.join(tex, 'minecraft'), os.path.join(tex, 'pixel-perfection'))
                       if os.path.isdir(p)),
           'seed': 3, 'out': os.path.join(ROOT, 'backgrounds', 'grass', 'grass_toon.png')}
    for k, v in zip(a[::2], a[1::2]):
        k = k.lstrip('-')
        opt[k] = type(opt[k])(v)
    return opt


def sprite(tex, name):
    """Текстура → два тона по яркости, прозрачность как в игре."""
    if name == 'tall_grass':
        im = Image.new('RGBA', (16, 32))
        im.paste(Image.open(os.path.join(tex, 'tall_grass_top.png')).convert('RGBA'), (0, 0))
        im.paste(Image.open(os.path.join(tex, 'tall_grass_bottom.png')).convert('RGBA'), (0, 16))
    else:
        im = Image.open(os.path.join(tex, name + '.png')).convert('RGBA')
    a = np.asarray(im).astype(np.float32)
    solid = a[..., 3] > 127
    lum = a[..., :3].mean(-1)
    light = lum > np.median(lum[solid])
    out = np.zeros(a.shape, np.uint8)
    out[..., :3] = np.where(light[..., None], LIGHT, DARK)
    out[..., 3] = solid * 255
    return Image.fromarray(out)


def tuft(img, scale, shade):
    """Крупно, без сглаживания, с обводкой вокруг силуэта."""
    big = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
    pad = OUTLINE + 1
    canvas = Image.new('RGBA', (big.width + 2 * pad, big.height + 2 * pad))
    canvas.paste(big, (pad, pad))
    alpha = canvas.getchannel('A').filter(ImageFilter.MaxFilter(2 * OUTLINE + 1))
    out = Image.new('RGBA', canvas.size, (*LINE, 0))
    out.putalpha(alpha)
    if shade != 1:
        canvas = Image.fromarray((np.asarray(canvas) * [shade, shade, shade, 1]).astype(np.uint8))
    out.alpha_composite(canvas)
    return out


def main(opt):
    rng = random.Random(opt['seed'])
    sprites = {n: sprite(opt['tex'], n) for n in ('short_grass', 'fern', 'tall_grass')}
    out = Image.new('RGBA', (SIZE, SIZE))
    # ряд: (шаг по x, масштаб, тон, где низ кустика)
    for step, scales, shade, base in ((95, (8, 10), 0.86, SIZE - 30), (140, (12, 14), 1.0, SIZE + 12)):
        x = -rng.randint(10, step)
        while x < SIZE + 20:
            name = rng.choices(['short_grass', 'fern', 'tall_grass'], [5, 2, 2])[0]
            t = tuft(sprites[name], rng.randint(*scales), shade)
            if rng.random() < 0.5:
                t = t.transpose(Image.FLIP_LEFT_RIGHT)
            out.alpha_composite(t, (x - t.width // 2, base - t.height), )
            x += step + rng.randint(-25, 25)
    os.makedirs(os.path.dirname(opt['out']), exist_ok=True)
    out.save(opt['out'], optimize=True)
    print('PNG', opt['out'])


if __name__ == '__main__':
    main(args(sys.argv[1:]))
