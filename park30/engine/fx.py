"""Пост-эффекты: тонирование, темнота с источниками света, дождь, зерно, виньетка."""
import math
import numpy as np
import cairo
from .core import W, H, hexrgb, clamp, noise1, rng, TAU
from . import draw as D

_TEX = {}


def _np_surface(arr):
    """uint8 HxWx4 (BGRA, premultiplied) → ImageSurface."""
    h, w = arr.shape[:2]
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, w, h)
    buf = np.ndarray((h, surf.get_stride() // 4, 4), np.uint8, buffer=surf.get_data())
    buf[:, :w] = arr
    surf.mark_dirty()
    return surf


def _blur(a, k):
    for axis in (0, 1):
        c = np.cumsum(np.pad(a, [(k, k) if i == axis else (0, 0) for i in range(2)], mode="wrap"), axis=axis)
        if axis == 0:
            a = (c[2 * k:] - c[:-2 * k]) / (2 * k)
        else:
            a = (c[:, 2 * k:] - c[:, :-2 * k]) / (2 * k)
    return a


def textures():
    if _TEX:
        return _TEX
    r = np.random.default_rng(7)
    grains = []
    for i in range(4):
        g = r.normal(128, 38, (H, W)).clip(0, 255).astype(np.uint8)
        a = np.stack([g, g, g, np.full_like(g, 255)], -1)
        grains.append(_np_surface(a))
    _TEX["grain"] = grains
    # бумага: мягкие пятна + волокна
    low = r.normal(0, 1, (H // 8, W // 8))
    low = _blur(_blur(low, 6), 3)
    low = np.kron(low, np.ones((8, 8)))[:H, :W]
    low = (low - low.min()) / (np.ptp(low) + 1e-6)
    fib = r.normal(0, 1, (H, W))
    fib = _blur(fib, 1)
    v = 236 + low * 19 + fib * 6
    v = v.clip(0, 255).astype(np.uint8)
    _TEX["paper"] = _np_surface(np.stack([v, v, v, np.full_like(v, 255)], -1))
    # виньетка
    s, c = D.surface(W, H)
    g = cairo.RadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 1.05)
    g.add_color_stop_rgba(0, 0.1, 0.07, 0.06, 0)
    g.add_color_stop_rgba(1, 0.1, 0.07, 0.06, 0.62)
    c.set_source(g)
    c.paint()
    _TEX["vignette"] = s
    _TEX["dark"] = D.surface(W, H)
    return _TEX


def paper_and_grain(ctx, frame, grain=0.09, paper=0.55, vignette=1.0):
    T = textures()
    if paper > 0:
        ctx.save()
        ctx.set_operator(cairo.OPERATOR_MULTIPLY)
        ctx.set_source_surface(T["paper"], 0, 0)
        ctx.paint_with_alpha(paper)
        ctx.restore()
    if vignette > 0:
        ctx.save()
        ctx.set_source_surface(T["vignette"], 0, 0)
        ctx.paint_with_alpha(vignette)
        ctx.restore()
    if grain > 0:
        ctx.save()
        ctx.set_operator(cairo.OPERATOR_OVERLAY)
        ctx.set_source_surface(T["grain"][(frame // 2) % 4], 0, 0)
        ctx.paint_with_alpha(grain)
        ctx.restore()


GRADES = {
    "day": None,
    "warm": ("#ffe2b8", 0.35, "multiply"),
    "dusk": ("#f2a77a", 0.45, "multiply"),
    "golden": ("#ffcf8a", 0.40, "multiply"),
    "night": ("#4d5687", 0.62, "multiply"),
    "deepnight": ("#2b3060", 0.75, "multiply"),
    "storm": ("#5d6a78", 0.55, "multiply"),
    "dark": ("#3a3446", 0.6, "multiply"),
    "memory": ("#f7d9a8", 0.5, "multiply"),
    "red": ("#c0504a", 0.35, "multiply"),
    "dawn": ("#f3b7a0", 0.38, "multiply"),
    "overcast": ("#b9bcc0", 0.35, "multiply"),
}


def grade(ctx, mode, amount=1.0):
    g = GRADES.get(mode)
    if not g or amount <= 0:
        return
    c, a, op = g
    ctx.save()
    ctx.set_operator(cairo.OPERATOR_MULTIPLY)
    D.col(ctx, c)
    ctx.paint_with_alpha(a * amount)
    ctx.restore()


def tint(ctx, c, a, op=cairo.OPERATOR_MULTIPLY):
    ctx.save()
    ctx.set_operator(op)
    D.col(ctx, c)
    ctx.paint_with_alpha(a)
    ctx.restore()


class Light:
    def __init__(self, x, y, r=300, kind="radial", ang=0.0, spread=0.35, power=1.0, glow="#ffd9a0",
                 glow_a=0.25):
        self.x, self.y, self.r, self.kind = x, y, r, kind
        self.ang, self.spread, self.power = ang, spread, power
        self.glow, self.glow_a = glow, glow_a


def darkness(ctx, level, lights=(), color="#0e0d18"):
    """Затемнить кадр, оставив «дырки» света. Координаты источников — экранные."""
    if level <= 0:
        return
    T = textures()
    s, c = T["dark"]
    c.save()
    c.set_operator(cairo.OPERATOR_SOURCE)
    D.col(c, color, level)
    c.paint()
    c.set_operator(cairo.OPERATOR_DEST_OUT)
    for L in lights:
        if L.kind == "radial":
            g = cairo.RadialGradient(L.x, L.y, 0, L.x, L.y, L.r)
            g.add_color_stop_rgba(0, 0, 0, 0, L.power)
            g.add_color_stop_rgba(0.55, 0, 0, 0, L.power * 0.6)
            g.add_color_stop_rgba(1, 0, 0, 0, 0)
            c.set_source(g)
            c.arc(L.x, L.y, L.r, 0, TAU)
            c.fill()
        else:  # конус фонарика
            g = cairo.RadialGradient(L.x, L.y, 0, L.x, L.y, L.r)
            g.add_color_stop_rgba(0, 0, 0, 0, L.power)
            g.add_color_stop_rgba(0.7, 0, 0, 0, L.power * 0.75)
            g.add_color_stop_rgba(1, 0, 0, 0, 0)
            c.set_source(g)
            c.move_to(L.x, L.y)
            c.arc(L.x, L.y, L.r, L.ang - L.spread, L.ang + L.spread)
            c.close_path()
            c.fill()
            # мягкий ореол вокруг
            g = cairo.RadialGradient(L.x, L.y, 0, L.x, L.y, L.r * 0.35)
            g.add_color_stop_rgba(0, 0, 0, 0, L.power * 0.5)
            g.add_color_stop_rgba(1, 0, 0, 0, 0)
            c.set_source(g)
            c.paint()
    c.restore()
    s.flush()
    ctx.save()
    ctx.set_source_surface(s, 0, 0)
    ctx.paint()
    # тёплое свечение
    ctx.set_operator(cairo.OPERATOR_ADD)
    for L in lights:
        if L.glow_a <= 0:
            continue
        gc = hexrgb(L.glow)
        rr = L.r * (0.6 if L.kind == "radial" else 0.9)
        g = cairo.RadialGradient(L.x, L.y, 0, L.x, L.y, rr)
        g.add_color_stop_rgba(0, gc[0], gc[1], gc[2], L.glow_a)
        g.add_color_stop_rgba(1, gc[0], gc[1], gc[2], 0)
        ctx.set_source(g)
        if L.kind == "radial":
            ctx.arc(L.x, L.y, rr, 0, TAU)
        else:
            ctx.move_to(L.x, L.y)
            ctx.arc(L.x, L.y, rr, L.ang - L.spread, L.ang + L.spread)
            ctx.close_path()
        ctx.fill()
    ctx.restore()


def glow(ctx, x, y, r, c="#ffd9a0", a=0.4):
    ctx.save()
    ctx.set_operator(cairo.OPERATOR_ADD)
    D.radial(ctx, x, y, r, c, a, 0)
    ctx.restore()


def rain(ctx, t, amount=1.0, wind=0.25, seed=1, color="#c9d6e8", alpha=0.45, rect=(0, 0, W, H), speed=1.0):
    """Косые струи дождя (экранные координаты)."""
    x0, y0, w, h = rect
    n = int(260 * amount)
    r = rng(seed)
    D.col(ctx, color, alpha)
    ctx.set_line_width(2.0)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    for i in range(n):
        sx = r.random()
        sy = r.random()
        sp = (1.4 + r.random() * 0.8) * speed
        L = 30 + r.random() * 40
        y = (sy + t * sp) % 1.0
        x = (sx + y * wind * 0.4) % 1.0
        px, py = x0 + x * w, y0 + y * h
        ctx.move_to(px, py)
        ctx.line_to(px + wind * L, py + L)
    ctx.stroke()


def drops_on_glass(ctx, t, rect, seed=3, n=60, alpha=0.5):
    """Капли, стекающие по стеклу."""
    x0, y0, w, h = rect
    r = rng(seed)
    for i in range(n):
        x = x0 + r.random() * w
        sp = 0.05 + r.random() * 0.25
        ph = r.random()
        y = y0 + ((ph + t * sp) % 1.0) * h
        rr = 2 + r.random() * 4
        D.col(ctx, "#dfe8f2", alpha)
        ctx.arc(x, y, rr, 0, TAU)
        ctx.fill()
        D.col(ctx, "#dfe8f2", alpha * 0.35)
        ctx.set_line_width(rr * 0.8)
        ctx.move_to(x, y)
        ctx.line_to(x + 1, y - rr * 6)
        ctx.stroke()


def flash(ctx, a, c="#ffffff"):
    if a <= 0:
        return
    ctx.save()
    D.col(ctx, c, clamp(a))
    ctx.paint()
    ctx.restore()


def dust(ctx, t, n=40, seed=5, alpha=0.35, rect=(0, 0, W, H)):
    """Пылинки в луче света."""
    x0, y0, w, h = rect
    r = rng(seed)
    for i in range(n):
        bx, by = r.random(), r.random()
        x = x0 + (bx + noise1(t * 0.2 + i, seed) * 0.05) * w
        y = y0 + ((by - t * 0.01 * (1 + r.random())) % 1.0) * h
        D.col(ctx, "#fff3d8", alpha * (0.4 + 0.6 * r.random()))
        ctx.arc(x, y, 1.5 + r.random() * 2, 0, TAU)
        ctx.fill()


def lightning(ctx, a):
    flash(ctx, a * 0.7, "#e8eeff")
