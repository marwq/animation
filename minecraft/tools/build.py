#!/usr/bin/env python3
"""Собирает концепт базового персонажа в minecraft/characters/steve/:

    front.svg, three-quarter.svg, side.svg, back.svg — отдельные виды
    turnaround.svg                                   — лист: 4 вида, направляющие, палитра

    python3 minecraft/tools/build.py
"""
import os

import steve
from blocky import DEFS, OUT, Camera, bounds, n, render, svg, text

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'characters', steve.NAME)

S = 34            # px на единицу
PITCH = 10        # камера чуть сверху — видна макушка, как на стикерах
VIEW_H = 1000
GROUND = 930
BG = '#fbf8f4'
INK = '#5b524a'
VIEWS = (('front', 'СПЕРЕДИ', 0), ('three-quarter', '3/4', -35), ('side', 'СБОКУ', -90),
         ('back', 'СЗАДИ', 180))


def centered_camera(boxes, yaw, cx):
    x0, _, x1, _ = bounds(boxes, Camera(yaw, PITCH, S, (0, GROUND)))
    return Camera(yaw, PITCH, S, (cx - (x0 + x1) / 2, GROUND))


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    boxes = steve.boxes()
    widths = []
    for _, _, yaw in VIEWS:
        x0, _, x1, _ = bounds(boxes, Camera(yaw, PITCH, S, (0, GROUND)))
        widths.append(x1 - x0)
    vw = int((max(widths) + 160) // 20 * 20)
    top = 70
    W = vw * len(VIEWS)
    H = top + VIEW_H + 60 + 150
    sheet = [f'<rect width="{W}" height="{H}" fill="{BG}"/>',
             text(40, 50, steve.TITLE, size=34, anchor='start', fill='#2e2823'),
             text(40, 82, f'рост {n(steve.HEIGHT)} ед. · голова 10×10×10, тело 7,2×7,6×4,6, '
                  'руки 2,9×6,8×3, ноги 3,6×5,8×3,9 · камера чуть сверху', size=19, weight=400,
                  anchor='start', fill='#8a8178')]
    for i, (key, label, yaw) in enumerate(VIEWS):
        cam = centered_camera(boxes, yaw, vw / 2)
        body = render(boxes, cam, pfx=key)
        with open(os.path.join(OUT_DIR, f'{key}.svg'), 'w', encoding='utf-8') as f:
            f.write(svg(vw, VIEW_H, body, title=f'{steve.TITLE} — {label.lower()}', defs=DEFS))
        x0, _, x1, _ = bounds(boxes, cam)
        sheet.append(f'<ellipse cx="{n(i * vw + (x0 + x1) / 2)}" cy="{top + GROUND}" '
                     f'rx="{n((x1 - x0) / 2 + 10)}" ry="16" fill="#3b2f5a" opacity="0.10"/>')
        sheet.append(f'<g id="view-{key}" transform="translate({i * vw} {top})">\n{body}\n</g>')
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
        f.write(svg(W, H, '\n'.join(sheet), title=f'{steve.TITLE} — разворот', defs=DEFS))
    print('SVG:', os.path.relpath(OUT_DIR, os.path.dirname(ROOT)) + '/')


if __name__ == '__main__':
    main()
