"""Общее для сцен: импорты, фигуры на фоне, перспектива, реквизит."""
import math

from engine.core import W, H, FPS, TAU, Keys, clamp, lerp, smooth, ease_io, ease_out, ease_in, ease_out_back, \
    hexrgb, shade, mix, rng, noise1, fbm
from engine.film import Shot
from engine import draw as D
from engine import fx
from engine import stick as ST
from engine import cards as CD
from engine.plate import PlateCam, on, paint, kb, image

INK = ST.INK


def persp(y, a, hz):
    """Радиус головы фигуры, стоящей на полу в y: r = a·(y − горизонт)."""
    return max(8.0, a * (y - hz))


def pose(t, seed=0, **kw):
    """Стойка с дыханием и морганием + поля."""
    p = ST.stand(t, seed)
    p["blink"] = ST.blinking(t, seed)
    p["t"] = t
    p.update(kw)
    return p


def figure(ctx, x, gy, r, f, p, look, tint=None, alpha=1.0):
    lk = dict(look)
    if tint:
        lk["tint"] = tint
    return ST.draw(ctx, x, gy, r, f, p, lk, alpha)


def at(J, x, gy, r, f, key):
    return ST.world(x, gy, r, f, J[key])


def mask_bg(ctx, name, pts):
    """Перекрыть фигуру куском фона (стойка, прилавок): многоугольник в пикселях фона."""
    ctx.save()
    D.path(ctx, pts)
    ctx.clip()
    paint(ctx, name)
    ctx.restore()


def blur_plate(ctx, name, cam, t, amount=0.5, darken=0.0):
    """Фон «не в фокусе» для крупных планов: рисуем уменьшенную копию и растягиваем."""
    import cairo
    key = (name, "blur")
    if key not in _BLUR:
        src = image(name)
        w, h = src.get_width() // 8, src.get_height() // 8
        sm = cairo.ImageSurface(cairo.FORMAT_ARGB32, w, h)
        c = cairo.Context(sm)
        c.scale(w / src.get_width(), h / src.get_height())
        c.set_source_surface(src, 0, 0)
        c.get_source().set_filter(cairo.FILTER_BEST)
        c.paint()
        _BLUR[key] = sm
    sm = _BLUR[key]
    with on(ctx, cam, t):
        paint(ctx, name)
        ctx.save()
        ctx.scale(image(name).get_width() / sm.get_width(), image(name).get_height() / sm.get_height())
        ctx.set_source_surface(sm, 0, 0)
        ctx.get_source().set_filter(cairo.FILTER_BILINEAR)
        ctx.paint_with_alpha(amount)
        ctx.restore()
    if darken:
        fx.flash(ctx, darken, "#0b0c12")


_BLUR = {}


def shake(t, t0, amp=18, d=0.5):
    """Смещение кадра от удара в момент t0."""
    k = clamp((t - t0) / d)
    if t < t0 or k >= 1:
        return 0.0, 0.0
    e = (1 - k) ** 2
    return amp * e * math.sin((t - t0) * 70), amp * 0.6 * e * math.cos((t - t0) * 55)


# --- реквизит ---------------------------------------------------------------------------

def phone(ctx, x, y, s, ang=0.0, glow=0.0, screen="#c8392f"):
    """Телефон в руке: корпус, экран; glow — красное свечение тревоги."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    if glow > 0:
        fx.glow(ctx, 0, 0, s * 3.2, screen, 0.35 * glow)
    D.rrect(ctx, -s * 0.5, -s * 0.95, s, s * 1.9, s * 0.16, hexrgb("#24252b"), INK, max(2, s * 0.08))
    D.rrect(ctx, -s * 0.4, -s * 0.82, s * 0.8, s * 1.64, s * 0.1, mix(hexrgb("#1c1f2a"), hexrgb(screen), glow),
            None, 0)
    if glow > 0.2:
        warn(ctx, 0, -s * 0.15, s * 0.42, alpha=glow)
    ctx.restore()


def warn(ctx, x, y, s, alpha=1.0, fill="#ffffff", mark="#c8392f"):
    """Предупреждающий треугольник с «!»."""
    pts = [(x, y - s * 0.9), (x + s, y + s * 0.75), (x - s, y + s * 0.75)]
    ctx.save()
    D.path(ctx, pts)
    ctx.set_line_join(1)
    D.col(ctx, hexrgb(fill), alpha)
    ctx.fill_preserve()
    ctx.set_line_width(s * 0.12)
    ctx.stroke()
    D.line(ctx, x, y - s * 0.38, x, y + s * 0.22, hexrgb(mark), s * 0.2, alpha)
    D.circle(ctx, x, y + s * 0.5, s * 0.1, hexrgb(mark), None, 0, alpha=alpha)
    ctx.restore()


def keyring(ctx, x, y, s, t=0.0, swing=0.0):
    """Связка ключей на кольце; swing — покачивание."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(math.sin(t * 9) * 0.25 * swing)
    D.circle(ctx, 0, 0, s * 0.55, None, hexrgb("#c9c3b4"), s * 0.12)
    D.circle(ctx, 0, 0, s * 0.55, None, INK, s * 0.04)
    cols = ["#d9b54a", "#b9bcc2", "#d9b54a", "#9aa0a8", "#c58a3a"]
    for k, c in enumerate(cols):
        a = math.pi * 0.25 + k * 0.32 + math.sin(t * 7 + k) * 0.06 * swing
        ctx.save()
        ctx.translate(math.cos(a) * s * 0.55, math.sin(a) * s * 0.55)
        ctx.rotate(a - math.pi / 2)
        D.circle(ctx, 0, s * 0.18, s * 0.2, hexrgb(c), INK, s * 0.05)
        D.circle(ctx, 0, s * 0.18, s * 0.07, hexrgb("#f3efe6"), INK, s * 0.03)
        D.rect(ctx, -s * 0.07, s * 0.35, s * 0.14, s * 0.75, hexrgb(c), INK, s * 0.05, wob=0)
        for j in range(2):
            D.rect(ctx, s * 0.07, s * 0.6 + j * 0.2 * s, s * 0.1, s * 0.08, hexrgb(c), INK, s * 0.03, wob=0)
        ctx.restore()
    ctx.restore()


def note(ctx, x, y, s, alpha=1.0, double=False, fill="#fff3d6"):
    """Нота (радио играет): светлая с чернильным контуром — видна и на тёмном."""
    heads = [(x, y)] + ([(x + s * 0.8, y - s * 0.2)] if double else [])
    stems = [(x + s * 0.32, y - s * 0.08, x + s * 0.32, y - s * 1.1)]
    if double:
        stems += [(x + s * 1.12, y - s * 0.28, x + s * 1.12, y - s * 1.3),
                  (x + s * 0.32, y - s * 1.1, x + s * 1.12, y - s * 1.3)]
    else:
        stems += [(x + s * 0.32, y - s * 1.1, x + s * 0.62, y - s * 0.7)]
    for c, grow in ((INK, s * 0.09), (hexrgb(fill), 0.0)):
        for hx, hy in heads:
            D.ellipse(ctx, hx, hy, s * 0.36 + grow, s * 0.26 + grow, c, None, 0, alpha=alpha, rot=-0.4)
        for x0, y0, x1, y1 in stems:
            D.line(ctx, x0, y0, x1, y1, c, s * 0.12 + grow * 2, alpha)
