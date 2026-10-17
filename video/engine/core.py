"""Базовые вещи движка: размеры кадра, палитра, кисти, шрифты, сглаживание движений."""
import math
import os
from contextlib import contextmanager

import skia

W, H, FPS = 1920, 1080, 30
CX, CY = W / 2, H / 2 - 40  # центр «сцены» (над субтитрами)

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(HERE, "fonts")

# --- палитра ---
BG = (7, 8, 10)
WHITE = (242, 241, 236)
SOFT = (196, 198, 200)
GREY = (118, 122, 128)
DIM = (54, 57, 62)
DARK = (26, 28, 31)
RED = (255, 52, 44)
DRED = (150, 24, 20)
GREEN = (46, 214, 120)
AMBER = (255, 186, 48)
BLUE = (60, 140, 255)
PAPER = (200, 193, 174)


def color(rgb, a=1.0):
    a = max(0.0, min(1.0, a))
    return skia.Color(int(rgb[0]), int(rgb[1]), int(rgb[2]), int(round(a * 255)))


def mix(c1, c2, t):
    t = clamp(t)
    return tuple(c1[i] + (c2[i] - c1[i]) * t for i in range(3))


def paint(rgb=WHITE, a=1.0, stroke=None, cap="round", join="round", blur=None, blend=None):
    p = skia.Paint(AntiAlias=True, Color=color(rgb, a))
    if stroke is not None:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(stroke)
        p.setStrokeCap({"round": skia.Paint.kRound_Cap, "butt": skia.Paint.kButt_Cap,
                        "square": skia.Paint.kSquare_Cap}[cap])
        p.setStrokeJoin({"round": skia.Paint.kRound_Join, "miter": skia.Paint.kMiter_Join}[join])
    if blur:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    if blend:
        p.setBlendMode(blend)
    return p


def dashed(p, on, off, phase=0):
    p.setPathEffect(skia.DashPathEffect.Make([on, off], phase))
    return p


# --- шрифты ---
# Все надписи — Lucida Sans Unicode (файл кладётся в fonts/, см. fonts/README.md).
# Пока его нет — DejaVu Sans. У Lucida одно начертание, жирное — программным утолщением.
LUCIDA = ("l_10646.ttf", "LSANSUNI.TTF", "LucidaSansUnicode.ttf")
_tf = {}


def _font_files():
    for name in LUCIDA:
        if os.path.exists(os.path.join(FONTS, name)):
            return name, None
    return "DejaVuSans.ttf", "DejaVuSans-Bold.ttf"


REGULAR_FILE, BOLD_FILE = _font_files()


def typeface(fname):
    if fname not in _tf:
        _tf[fname] = skia.Typeface.MakeFromFile(os.path.join(FONTS, fname))
    return _tf[fname]


def font(size, weight="bold"):
    """weight: "regular" или "bold"."""
    bold = weight != "regular"
    if bold and BOLD_FILE:
        f = skia.Font(typeface(BOLD_FILE), size)
    else:
        f = skia.Font(typeface(REGULAR_FILE), size)
        if bold:
            f.setEmbolden(True)
    f.setEdging(skia.Font.Edging.kAntiAlias)
    f.setSubpixel(True)
    return f


def text_width(s, f, tracking=0.0):
    return f.measureText(s) + tracking * max(0, len(s) - 1)


def draw_text(c, s, x, y, f, p, align="left", tracking=0.0):
    """Строка с выравниванием и межбуквенным интервалом (tracking в пикселях)."""
    w = text_width(s, f, tracking)
    if align == "center":
        x -= w / 2
    elif align == "right":
        x -= w
    if tracking == 0:
        c.drawString(s, x, y, f, p)
        return w
    for ch in s:
        c.drawString(ch, x, y, f, p)
        x += f.measureText(ch) + tracking
    return w


# --- время и сглаживание ---
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def lerp(a, b, t):
    return a + (b - a) * t


def prog(t, t0, dur):
    """0..1 линейно от t0 за dur секунд."""
    if dur <= 0:
        return 1.0 if t >= t0 else 0.0
    return clamp((t - t0) / dur)


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_in(x):
    x = clamp(x)
    return x ** 3


def ease_io(x):
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def out_back(x, s=1.9):
    x = clamp(x)
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def spring(t, freq=2.2, damp=5.0):
    """Отклик пружины на ступеньку: 0 → 1 с затухающим перелётом."""
    if t <= 0:
        return 0.0
    return 1 - math.exp(-damp * t) * math.cos(2 * math.pi * freq * t)


def pop(t, t0, dur=0.38):
    """Появление с перелётом: масштаб 0 → 1."""
    return out_back(prog(t, t0, dur))


def fade(t, t0, dur=0.25):
    return ease_out(prog(t, t0, dur))


def window(t, t0, t1, fin=0.2, fout=0.2):
    """1 внутри [t0, t1], мягкие края."""
    return min(ease_out(prog(t, t0, fin)), 1 - ease_in(prog(t, t1 - fout, fout)))


def blink(t, rate=1.0, duty=0.5):
    return 1.0 if (t * rate) % 1.0 < duty else 0.0


def wobble(t, seed=0.0, amp=1.0, speed=1.0):
    """Плавный псевдошум."""
    return amp * (math.sin(t * 1.7 * speed + seed * 3.1) * 0.6 +
                  math.sin(t * 2.9 * speed + seed * 1.3) * 0.3 +
                  math.sin(t * 5.3 * speed + seed * 7.7) * 0.1)


def hash01(*args):
    h = 0
    for a in args:
        h = (h * 1000003 + int(a * 1000) + 0x9E3779B9) & 0xFFFFFFFF
    h ^= h >> 15
    h = (h * 0x2C1B3C6D) & 0xFFFFFFFF
    h ^= h >> 12
    return (h & 0xFFFFFF) / float(0xFFFFFF)


# --- трансформации и слои ---
@contextmanager
def xf(c, x=0.0, y=0.0, s=1.0, r=0.0, sx=None, sy=None):
    c.save()
    c.translate(x, y)
    if r:
        c.rotate(r)
    if sx is not None or sy is not None:
        c.scale(sx if sx is not None else s, sy if sy is not None else s)
    elif s != 1.0:
        c.scale(s, s)
    try:
        yield
    finally:
        c.restore()


@contextmanager
def layer(c, alpha=1.0):
    """Группа с общей прозрачностью."""
    if alpha >= 0.999:
        yield
        return
    c.saveLayerAlpha(None, int(clamp(alpha) * 255))
    try:
        yield
    finally:
        c.restore()


def rrect(x, y, w, h, r):
    return skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r)


def capsule(c, x1, y1, x2, y2, w, p_fill, gap=0.0):
    """Толстая линия с круглыми концами; gap — обводка цвета фона (разрыв между деталями)."""
    if gap > 0:
        c.drawLine(x1, y1, x2, y2, paint(BG, stroke=w + 2 * gap))
    pp = skia.Paint(p_fill)
    pp.setStyle(skia.Paint.kStroke_Style)
    pp.setStrokeWidth(w)
    pp.setStrokeCap(skia.Paint.kRound_Cap)
    c.drawLine(x1, y1, x2, y2, pp)


def glow_circle(c, x, y, r, rgb, a=1.0, spread=2.2):
    c.drawCircle(x, y, r * spread, paint(rgb, 0.35 * a, blur=r * spread * 0.6))
    c.drawCircle(x, y, r, paint(rgb, a))


def path_from(points, close=False):
    p = skia.Path()
    p.moveTo(*points[0])
    for pt in points[1:]:
        p.lineTo(*pt)
    if close:
        p.close()
    return p
