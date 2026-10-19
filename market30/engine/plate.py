"""Нарисованные фоны (Kling): загрузка, кэш и камера в пикселях исходной картинки.

Мир плана = пиксели фона (2720×1536). PlateCam показывает фон целиком при k = 1 и
медленно наезжает (кен бёрнс). Фигуры рисуются в тех же координатах — двигаются вместе с фоном.
"""
import os
import cairo
from .core import W, H, Keys, lerp, clamp, smooth
from . import draw as D

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG = os.path.join(ROOT, "assets", "bg")
_IMG = {}


def image(name):
    if name not in _IMG:
        _IMG[name] = cairo.ImageSurface.create_from_png(os.path.join(BG, name + ".png"))
    return _IMG[name]


def size(name):
    s = image(name)
    return s.get_width(), s.get_height()


class PlateCam:
    """cx, cy — центр кадра в пикселях фона; k — увеличение относительно «весь фон в кадре».
    Каждый параметр — число или функция времени (Keys)."""

    def __init__(self, name, cx=None, cy=None, k=1.0):
        self.name = name
        iw, ih = size(name)
        self.base = max(W / iw, H / ih)
        f = lambda v, d: v if callable(v) else (lambda t, v=(d if v is None else v): v)
        self.cx, self.cy, self.k = f(cx, iw / 2), f(cy, ih / 2), f(k, 1.0)

    def at(self, t):
        iw, ih = size(self.name)
        z = self.base * self.k(t)
        hw, hh = W / 2 / z, H / 2 / z
        cx = clamp(self.cx(t), hw, iw - hw)
        cy = clamp(self.cy(t), hh, ih - hh)
        return cx, cy, z

    def apply(self, ctx, t):
        cx, cy, z = self.at(t)
        ctx.translate(W / 2, H / 2)
        ctx.scale(z, z)
        ctx.translate(-cx, -cy)

    def to_screen(self, t, x, y):
        cx, cy, z = self.at(t)
        return W / 2 + (x - cx) * z, H / 2 + (y - cy) * z

    def scale(self, t):
        return self.at(t)[2]


def paint(ctx, name, alpha=1.0):
    ctx.set_source_surface(image(name), 0, 0)
    ctx.get_source().set_filter(cairo.FILTER_GOOD)
    if alpha >= 1:
        ctx.paint()
    else:
        ctx.paint_with_alpha(alpha)


class on:
    """with on(ctx, cam, t): рисование в пикселях фона."""

    def __init__(self, ctx, cam, t):
        self.ctx, self.cam, self.t = ctx, cam, t

    def __enter__(self):
        self.ctx.save()
        self.cam.apply(self.ctx, self.t)
        return self.ctx

    def __exit__(self, *a):
        self.ctx.restore()


def kb(dur, k0=1.0, k1=1.06):
    """Медленный наезд кен бёрнс за план."""
    return Keys((0, k0), (dur, k1, "lin"))
