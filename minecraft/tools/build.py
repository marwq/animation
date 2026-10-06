#!/usr/bin/env python3
"""Собирает SVG персонажей серии в minecraft/characters/:

    <имя>/front.svg, three-quarter.svg, side.svg, three-quarter-back.svg, back.svg
    <имя>/turnaround.svg   — лист-разворот с направляющими и палитрой
    <имя>/expressions.svg  — лист эмоций
    lineup.svg             — все персонажи рядом в одном масштабе

    python3 minecraft/tools/build.py            # все
    python3 minecraft/tools/build.py dog        # только один (без lineup)
"""
import os
import sys

from blocky import FONT, OUT, Camera, bounds, n, render, svg, text
from characters import ALL

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'characters')

S = 36            # px на единицу-пиксель блока в разворотах
VIEW_H = 1000
GROUND = 950
BG = '#fbf8f4'
INK = '#5b524a'
VIEWS = (('front', 'СПЕРЕДИ', 0), ('three-quarter', '3/4', -35), ('side', 'СБОКУ', -90),
         ('three-quarter-back', '3/4 СЗАДИ', -145), ('back', 'СЗАДИ', 180))
EXPR_RU = {'neutral': 'спокойствие', 'happy': 'радость', 'laugh': 'смех', 'shock': 'шок',
           'sad': 'грусть', 'crying': 'плач', 'angry': 'злость', 'smug': 'ухмылка',
           'scared': 'страх', 'grin': 'злорадство'}


def default_expr(char):
    return 'grin' if 'grin' in char.EXPRESSIONS else 'neutral'


def view_width(char):
    widths = []
    for _, _, yaw in VIEWS:
        x0, _, x1, _ = bounds(char.boxes(default_expr(char)), Camera(yaw, 0, S, (0, GROUND)))
        widths.append(x1 - x0)
    return int((max(widths) + 120) // 20 * 20 + 20)


def centered_camera(boxes, yaw, pitch, scale, cx, ground):
    x0, _, x1, _ = bounds(boxes, Camera(yaw, pitch, scale, (0, ground)))
    return Camera(yaw, pitch, scale, (cx - (x0 + x1) / 2, ground))


def palette_row(char, W, y):
    parts = [f'<line x1="30" y1="{y}" x2="{W - 30}" y2="{y}" stroke="#e6dfd5" stroke-width="2"/>']
    step = (W - 120) / len(char.PALETTE)
    for i, (label, color) in enumerate(char.PALETTE):
        cx = 60 + step * i + step / 2
        parts.append(f'<rect x="{n(cx - 34)}" y="{y + 30}" width="68" height="44" rx="10" fill="{color}" '
                     f'stroke="{OUT}" stroke-width="3"/>')
        parts.append(text(cx, y + 100, label, size=17, fill=INK))
        parts.append(text(cx, y + 124, color, size=15, weight=400, fill='#8a8178'))
    return parts


def build_views(char, out_dir):
    vw = view_width(char)
    boxes = char.boxes(default_expr(char))
    sheet = [f'<rect width="{vw * len(VIEWS)}" height="{VIEW_H + 230}" fill="{BG}"/>']
    top = 40
    for gy in char.GUIDES:
        y = top + GROUND - gy * S
        sheet.append(f'<line x1="30" y1="{n(y)}" x2="{vw * len(VIEWS) - 30}" y2="{n(y)}" stroke="#d9d2c8" '
                     f'stroke-width="2" stroke-dasharray="10 10"/>')
    for i, (key, label, yaw) in enumerate(VIEWS):
        cam = centered_camera(boxes, yaw, 0, S, vw / 2, GROUND)
        body = render(boxes, cam, pfx=key)
        with open(os.path.join(out_dir, f'{key}.svg'), 'w', encoding='utf-8') as f:
            f.write(svg(vw, VIEW_H, body, title=f'{char.TITLE} — {label.lower()}'))
        x0, _, x1, _ = bounds(boxes, cam)
        sheet.append(f'<ellipse cx="{n(i * vw + (x0 + x1) / 2)}" cy="{top + GROUND}" rx="{n((x1 - x0) / 2 + 10)}" '
                     f'ry="14" fill="#000" opacity="0.08"/>')
        sheet.append(f'<g id="view-{key}" transform="translate({i * vw} {top})">\n{body}\n</g>')
        sheet.append(text(i * vw + vw / 2, top + VIEW_H + 20, label, size=34, spacing=4, fill=INK))
    W = vw * len(VIEWS)
    height_units = max(char.GUIDES)
    sheet.append(text(40, 46, f'{char.TITLE}', size=40, anchor='start', fill='#2e2823'))
    sheet.append(text(40, 82, f'рост {n(height_units)} ед. · 1 ед. = 1 пиксель блока', size=20,
                      weight=400, anchor='start', fill='#8a8178'))
    sheet += palette_row(char, W, top + VIEW_H + 50)
    H = top + VIEW_H + 50 + 140
    sheet[0] = f'<rect width="{W}" height="{H}" fill="{BG}"/>'
    with open(os.path.join(out_dir, 'turnaround.svg'), 'w', encoding='utf-8') as f:
        f.write(svg(W, H, '\n'.join(sheet), title=f'{char.TITLE} — разворот'))


def build_expressions(char, out_dir):
    exprs = char.EXPRESSIONS
    cols = 5 if len(exprs) > 6 else 3
    rows = (len(exprs) + cols - 1) // cols
    cw, ch = 360, 420
    W, H = cols * cw, rows * ch + 90
    parts = [f'<rect width="{W}" height="{H}" fill="{BG}"/>',
             text(30, 52, f'{char.TITLE} — эмоции', size=36, anchor='start', fill='#2e2823')]
    scale = 22 if char.NAME != 'dog' else 30
    for i, e in enumerate(exprs):
        r, c = divmod(i, cols)
        cx, cy = c * cw + cw / 2, 90 + r * ch
        boxes = char.boxes(e, head_only=True)
        cam0 = Camera(-24, 12, scale, (0, 0))
        x0, y0, x1, y1 = bounds(boxes, cam0)
        cam = Camera(-24, 12, scale, (cx - (x0 + x1) / 2, cy + 180 - (y0 + y1) / 2))
        parts.append(f'<rect x="{c * cw + 14}" y="{cy + 8}" width="{cw - 28}" height="{ch - 28}" rx="22" '
                     f'fill="#ffffff" stroke="#e6dfd5" stroke-width="2"/>')
        parts.append(f'<g id="expr-{e}">\n{render(boxes, cam, pfx=e)}\n</g>')
        parts.append(text(cx, cy + ch - 44, EXPR_RU.get(e, e), size=24, fill=INK))
    with open(os.path.join(out_dir, 'expressions.svg'), 'w', encoding='utf-8') as f:
        f.write(svg(W, H, '\n'.join(parts), title=f'{char.TITLE} — эмоции'))


def build_lineup():
    poses = {'hero': ('happy', 'wave'), 'friend': ('smug', 'stand'), 'dog': ('happy', 'wag'),
             'zombie': ('grin', 'reach')}
    sc, ground = 30, 900
    yaw, pitch = -30, 6
    slots = []
    x = 80
    for char in ALL:
        e, p = poses[char.NAME]
        boxes = char.boxes(e, p)
        x0, y0, x1, y1 = bounds(boxes, Camera(yaw, pitch, sc, (0, ground)))
        w = x1 - x0
        slots.append((char, boxes, x - x0 + 20, w))
        x += w + 90
    W, H = int(x + 40), 1060
    parts = [f'<rect width="{W}" height="{H}" fill="{BG}"/>',
             text(40, 60, 'Персонажи серии — в одном масштабе', size=38, anchor='start', fill='#2e2823')]
    # линейка в единицах
    for u in range(0, 26, 2):
        y = ground - u * sc
        parts.append(f'<line x1="20" y1="{y}" x2="{W - 20}" y2="{y}" stroke="#ece5db" stroke-width="{2 if u % 10 else 3}"/>')
        parts.append(text(34, y - 4, str(u), size=14, weight=400, fill='#a39a90', anchor='start'))
    for char, boxes, ox, w in slots:
        cam = Camera(yaw, pitch, sc, (ox, ground))
        x0, _, x1, _ = bounds(boxes, cam)
        parts.append(f'<ellipse cx="{n((x0 + x1) / 2)}" cy="{ground}" rx="{n(w / 2 + 6)}" ry="12" fill="#000" opacity="0.1"/>')
        parts.append(f'<g id="lineup-{char.NAME}">\n{render(boxes, cam, pfx=char.NAME)}\n</g>')
        parts.append(text((x0 + x1) / 2, ground + 60, char.TITLE, size=30, fill='#2e2823'))
        parts.append(text((x0 + x1) / 2, ground + 92, f'{n(max(char.GUIDES))} ед.', size=20, weight=400, fill='#8a8178'))
    with open(os.path.join(OUT_DIR, 'lineup.svg'), 'w', encoding='utf-8') as f:
        f.write(svg(W, H, '\n'.join(parts), title='Персонажи серии — в одном масштабе'))


def main(names):
    chars = [c for c in ALL if not names or c.NAME in names]
    for char in chars:
        out_dir = os.path.join(OUT_DIR, char.NAME)
        os.makedirs(out_dir, exist_ok=True)
        build_views(char, out_dir)
        build_expressions(char, out_dir)
        print('SVG:', os.path.relpath(out_dir, os.path.dirname(ROOT)) + '/')
    if not names:
        build_lineup()
        print('SVG: minecraft/characters/lineup.svg')


if __name__ == '__main__':
    main(sys.argv[1:])
