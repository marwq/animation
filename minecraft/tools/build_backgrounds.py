#!/usr/bin/env python3
"""Собирает фоны в minecraft/backgrounds/<фон>/:

    <вариант>.svg                 — фон целиком (все слои)
    layers/<вариант>-<слой>.svg   — слои far / mid / near / fx по отдельности (для параллакса)

    python3 minecraft/tools/build_backgrounds.py              # все фоны
    python3 minecraft/tools/build_backgrounds.py bg01-meadow  # один

PNG: node minecraft/tools/render.js 1 minecraft/backgrounds
"""
import os
import sys

from bgkit import H, W
from scenes import SCENES, SPRITES

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'backgrounds')
LAYERS = ('far', 'mid', 'props', 'near', 'fx')
LAYER_RU = {'far': 'дальний план', 'mid': 'средний план', 'props': 'реквизит', 'near': 'ближний план',
            'fx': 'виньетка и свет'}


def svg(body, defs, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">\n'
            f'<title>{title}</title>\n<defs>{defs}</defs>\n{body}\n</svg>\n')


def main(names):
    for name, variants in SCENES.items():
        if names and name not in names:
            continue
        out = os.path.join(OUT_DIR, name)
        os.makedirs(os.path.join(out, 'layers'), exist_ok=True)
        for variant, fn in variants:
            layers = fn()
            groups = {k: f'<g id="{k}">\n' + '\n'.join(layers.get(k, [])) + '\n</g>' for k in LAYERS}
            with open(os.path.join(out, f'{variant}.svg'), 'w', encoding='utf-8') as fh:
                fh.write(svg('\n'.join(groups[k] for k in LAYERS), layers['defs'], f'{name} — {variant}'))
            for k in LAYERS:
                if not layers.get(k):
                    continue
                with open(os.path.join(out, 'layers', f'{variant}-{k}.svg'), 'w', encoding='utf-8') as fh:
                    fh.write(svg(groups[k], layers['defs'], f'{name} — {variant}: {LAYER_RU[k]}'))
            print('SVG:', os.path.relpath(os.path.join(out, variant + '.svg'), os.path.dirname(ROOT)))
    if not names or 'sprites' in names:
        out = os.path.join(OUT_DIR, 'sprites')
        os.makedirs(out, exist_ok=True)
        for name, fn in SPRITES.items():
            sp = fn()
            w, h = sp['size']
            with open(os.path.join(out, f'{name}.svg'), 'w', encoding='utf-8') as fh:
                fh.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">\n'
                         f'<title>{name}</title>\n<defs>{sp["defs"]}</defs>\n{sp["body"]}\n</svg>\n')
            print('SVG:', os.path.relpath(os.path.join(out, name + '.svg'), os.path.dirname(ROOT)))


if __name__ == '__main__':
    main(sys.argv[1:])
