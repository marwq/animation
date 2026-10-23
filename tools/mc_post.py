#!/usr/bin/env python3
"""Доводит слои фона после Blender (tools/mc_field.py).

    python3 tools/mc_post.py backgrounds/field/portal/layers

Делает в той же папке:
  portal_glow.png  — фиолетовый свет портала на траве и рамке, на чёрном фоне;
                     в Moho у слоя режим смешивания «Add» или «Screen»
  portal_mask.png  — проём портала белым: туда вставлять свою анимацию
и рядом с папкой:
  preview.png      — все слои вместе, итоговый кадр без запаса по краям
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def load(path):
    return np.asarray(Image.open(path).convert('RGBA'), np.float32) / 255


def save(a, path):
    Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)).save(path, optimize=True)


def over(dst, src):
    """src поверх dst, альфа не умножена на цвет (как в PNG)."""
    a, da = src[..., 3:], dst[..., 3:]
    oa = a + da * (1 - a)
    rgb = (src[..., :3] * a + dst[..., :3] * da * (1 - a)) / np.maximum(oa, 1e-6)
    return np.concatenate([rgb, oa], -1)


def glow(d, size):
    on = load(os.path.join(d, 'glow_on.png'))[..., :3]
    off = load(os.path.join(d, 'glow_off.png'))[..., :3]
    diff = np.clip(on - off - 0.02, 0, 1)         # порог срезает шум рендера
    img = Image.fromarray((diff * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    img = img.resize((size, size), Image.BICUBIC)
    return np.asarray(img, np.float32) / 255


def main(d):
    meta = json.load(open(os.path.join(d, 'scene.json')))
    size = Image.open(os.path.join(d, 'sky.png')).size[0]   # черновик бывает меньше
    k = size / meta['layer_size'][0]
    frame = round(meta['frame'][0] * k)
    pad = (size - frame) // 2

    g = glow(d, size)
    save(g, os.path.join(d, 'portal_glow.png'))

    mask = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(mask).polygon([(x * k + pad, y * k + pad) for x, y in meta['portal_inside']],
                                 fill=(255, 255, 255, 255))
    mask.save(os.path.join(d, 'portal_mask.png'), optimize=True)

    img = None
    for name in meta['order']:
        layer = load(os.path.join(d, name + '.png'))
        img = layer if img is None else over(img, layer)
        if name == 'portal':
            img[..., :3] = np.clip(img[..., :3] + g, 0, 1)
    save(img[pad:pad + frame, pad:pad + frame, :3], os.path.join(os.path.dirname(d), 'preview.png'))


if __name__ == '__main__':
    for d in sys.argv[1:]:
        main(os.path.abspath(d))
