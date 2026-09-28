"""Общие функции для персонажей: SVG-примитивы, лист-разворот и запись файлов.

Стиль у всех персонажей один: толстый чёрный контур, плоская заливка с одной
тенью, руки и ноги — палки. Каждый персонаж описан в своём модуле
(tools/ellie.py, tools/joel.py): палитра + функции front(), side(), back(),
которые возвращают пару (defs, body) с SVG-разметкой.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHAR_DIR = os.path.join(ROOT, 'characters')

OUT = '#1c1a1a'   # контур
SW = 8            # основной контур
LIMB = 11         # руки и ноги
DET = 5           # внутренние линии

FONT = "'DejaVu Sans', 'Segoe UI', Arial, sans-serif"
LABELS = {'front': 'СПЕРЕДИ', 'side': 'СБОКУ', 'back': 'СЗАДИ'}
VIEW_TITLES = {'front': 'вид спереди', 'side': 'вид сбоку', 'back': 'вид сзади'}


# ------------------------------------------------------------------ примитивы
def P(d, fill='none', sw=SW, stroke=OUT, extra=''):
    s = f'stroke="{stroke}" stroke-width="{sw}"' if stroke else 'stroke="none"'
    return (f'<path d="{d}" fill="{fill}" {s} stroke-linecap="round" '
            f'stroke-linejoin="round"{" " + extra if extra else ""}/>')


def shape(d, fill, sw=SW):
    return P(d, fill=fill, sw=sw)


def fill_only(d, fill, extra=''):
    return P(d, fill=fill, stroke=None, extra=extra)


def shade(cid, *items):
    """Тени, обрезанные по форме clipPath с id=cid."""
    return f'<g clip-path="url(#{cid})">' + ''.join(items) + '</g>'


def clip(cid, d):
    return f'<clipPath id="{cid}"><path d="{d}"/></clipPath>'


def grouper(pfx):
    def G(name, *items):
        return f'<g id="{pfx}-{name}">\n  ' + '\n  '.join(items) + '\n</g>'
    return G


def pill(cx, cy, w, h, fill, angle=0, sw=6):
    """Скруглённый прямоугольник с центром (cx, cy), повёрнутый на angle градусов."""
    rot = f' rotate({angle})' if angle else ''
    return (f'<rect x="{-w / 2:g}" y="{-h / 2:g}" width="{w}" height="{h}" rx="{h / 2 - 1:g}" '
            f'fill="{fill}" stroke="{OUT}" stroke-width="{sw}" '
            f'transform="translate({cx} {cy}){rot}"/>')


def svg(w, h, body, defs='', title=''):
    t = f'<title>{title}</title>\n' if title else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'width="{w}" height="{h}">\n{t}<defs>\n{defs}\n</defs>\n{body}\n</svg>\n')


# ------------------------------------------------------------------ лист
def sheet(char):
    """Три вида в ряд, пунктирные направляющие по высоте и палитра снизу."""
    vw, vh = char.W, char.H
    top = 30
    W, H = vw * 3, top + vh + 200
    parts = [f'<rect width="{W}" height="{H}" fill="#fbf8f4"/>']
    for y in char.GUIDES:
        parts.append(f'<line x1="30" y1="{y + top}" x2="{W - 30}" y2="{y + top}" '
                     f'stroke="#d9d2c8" stroke-width="2" stroke-dasharray="10 10"/>')
    defs_all = []
    for i, (name, fn) in enumerate(char.VIEWS):
        defs, body = fn()
        defs_all.append(defs)
        x = i * vw
        parts.append(f'<ellipse cx="{x + vw // 2}" cy="{char.GROUND + top}" rx="120" ry="14" '
                     f'fill="#000" opacity="0.08"/>')
        parts.append(f'<g id="view-{name}" transform="translate({x} {top})">\n{body}\n</g>')
        parts.append(f'<text x="{x + vw // 2}" y="{top + vh + 30}" text-anchor="middle" '
                     f'font-family="{FONT}" font-size="34" font-weight="700" '
                     f'letter-spacing="4" fill="#5b524a">{LABELS[name]}</text>')
    parts.append(f'<line x1="30" y1="{H - 150}" x2="{W - 30}" y2="{H - 150}" '
                 f'stroke="#e6dfd5" stroke-width="2"/>')
    step = (W - 120) / len(char.PALETTE)
    for i, (label, color) in enumerate(char.PALETTE):
        cx = 60 + step * i + step / 2
        parts.append(f'<rect x="{cx - 34:.0f}" y="{H - 120}" width="68" height="44" rx="10" '
                     f'fill="{color}" stroke="{OUT}" stroke-width="3"/>')
        parts.append(f'<text x="{cx:.0f}" y="{H - 50}" text-anchor="middle" font-family="{FONT}" '
                     f'font-size="17" font-weight="700" fill="#5b524a">{label}</text>')
        parts.append(f'<text x="{cx:.0f}" y="{H - 26}" text-anchor="middle" font-family="{FONT}" '
                     f'font-size="15" fill="#8a8178">{color}</text>')
    return svg(W, H, '\n'.join(parts), '\n'.join(defs_all),
               title=f'{char.TITLE} — разворот: спереди, сбоку, сзади')


def build(char):
    """Пишет characters/<name>/{front,side,back,turnaround}.svg."""
    out_dir = os.path.join(CHAR_DIR, char.NAME)
    os.makedirs(out_dir, exist_ok=True)
    for name, fn in char.VIEWS:
        defs, body = fn()
        with open(os.path.join(out_dir, f'{name}.svg'), 'w', encoding='utf-8') as f:
            f.write(svg(char.W, char.H, body, defs, title=f'{char.TITLE} — {VIEW_TITLES[name]}'))
    with open(os.path.join(out_dir, 'turnaround.svg'), 'w', encoding='utf-8') as f:
        f.write(sheet(char))
    return os.path.relpath(out_dir, ROOT)
