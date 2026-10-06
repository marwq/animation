#!/usr/bin/env python3
"""Собирает концепт базового персонажа в minecraft/characters/steve/:

    front.svg, three-quarter.svg, side.svg, back.svg — отдельные виды
    turnaround.svg                                   — лист: 4 вида, направляющие, палитра

    python3 minecraft/tools/build.py
"""
import os

import steve
from blocky import OUT, ROUGH, Camera, bounds, n, render, svg, text

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'characters', steve.NAME)

S = 30            # px на единицу (пиксель скина)
VIEW_H = 1080
GROUND = 1030
BG = '#fbf8f4'
INK = '#5b524a'
VIEWS = (('front', 'СПЕРЕДИ', 0), ('three-quarter', '3/4', -35), ('side', 'СБОКУ', -90),
         ('back', 'СЗАДИ', 180))


def centered_camera(boxes, yaw, cx):
    x0, _, x1, _ = bounds(boxes, Camera(yaw, 0, S, (0, GROUND)))
    return Camera(yaw, 0, S, (cx - (x0 + x1) / 2, GROUND))


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    boxes = steve.boxes()
    widths = []
    for _, _, yaw in VIEWS:
        x0, _, x1, _ = bounds(boxes, Camera(yaw, 0, S, (0, GROUND)))
        widths.append(x1 - x0)
    vw = int((max(widths) + 160) // 20 * 20)
    top = 70
    W = vw * len(VIEWS)
    H = top + VIEW_H + 60 + 150
    sheet = [f'<rect width="{W}" height="{H}" fill="{BG}"/>',
             text(40, 50, steve.TITLE, size=34, anchor='start', fill='#2e2823'),
             text(40, 82, 'рост 32 ед. · 1 ед. = 1 пиксель скина · голова 8×8×8, тело 8×12×4, '
                  'руки и ноги 4×12×4', size=19, weight=400, anchor='start', fill='#8a8178')]
    for gy in steve.GUIDES:
        y = top + GROUND - gy * S
        sheet.append(f'<line x1="30" y1="{n(y)}" x2="{W - 30}" y2="{n(y)}" stroke="#ddd5ca" '
                     f'stroke-width="2" stroke-dasharray="10 10"/>')
    for i, (key, label, yaw) in enumerate(VIEWS):
        cam = centered_camera(boxes, yaw, vw / 2)
        body = render(boxes, cam, pfx=key)
        with open(os.path.join(OUT_DIR, f'{key}.svg'), 'w', encoding='utf-8') as f:
            f.write(svg(vw, VIEW_H, f'<g filter="url(#rough)">\n{body}\n</g>',
                        title=f'{steve.TITLE} — {label.lower()}', defs=ROUGH))
        x0, _, x1, _ = bounds(boxes, cam)
        sheet.append(f'<ellipse cx="{n(i * vw + (x0 + x1) / 2)}" cy="{top + GROUND}" '
                     f'rx="{n((x1 - x0) / 2 + 20)}" ry="13" fill="#000" opacity="0.08"/>')
        sheet.append(f'<g id="view-{key}" transform="translate({i * vw} {top})" filter="url(#rough)">\n'
                     f'{body}\n</g>')
        sheet.append(text(i * vw + vw / 2, top + VIEW_H + 30, label, size=32, spacing=4, fill=INK))
    y = top + VIEW_H + 60
    sheet.append(f'<line x1="30" y1="{y}" x2="{W - 30}" y2="{y}" stroke="#e6dfd5" stroke-width="2"/>')
    step = (W - 120) / len(steve.PALETTE)
    for i, (label, color) in enumerate(steve.PALETTE):
        cx = 60 + step * i + step / 2
        sheet.append(f'<rect x="{n(cx - 34)}" y="{y + 26}" width="68" height="44" rx="10" fill="{color}" '
                     f'stroke="{OUT}" stroke-width="3"/>')
        sheet.append(text(cx, y + 96, label, size=17, fill=INK))
        sheet.append(text(cx, y + 120, color, size=15, weight=400, fill='#8a8178'))
    with open(os.path.join(OUT_DIR, 'turnaround.svg'), 'w', encoding='utf-8') as f:
        f.write(svg(W, H, '\n'.join(sheet), title=f'{steve.TITLE} — разворот', defs=ROUGH))
    print('SVG:', os.path.relpath(OUT_DIR, os.path.dirname(ROOT)) + '/')


if __name__ == '__main__':
    main()
