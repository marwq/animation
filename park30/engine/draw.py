"""Примитивы рисования с «рукописным» контуром."""
import math
import cairo
from .core import hexrgb, noise1, shade, mix

INK = hexrgb("#2a201c")          # основной контур
INK_SOFT = hexrgb("#4a3d36")

FONT_DAY = "Montserrat"
FONT_HAND = "Patrick Hand"
FONT_TITLE = "Archivo Black"


def col(ctx, c, a=1.0):
    if isinstance(c, str):
        c = hexrgb(c)
    if len(c) == 4:
        ctx.set_source_rgba(*c)
    else:
        ctx.set_source_rgba(c[0], c[1], c[2], a)


def C(c):
    return hexrgb(c) if isinstance(c, str) else c


# --- контуры ---------------------------------------------------------------

def wobble(pts, amp=1.2, seed=0, step=28.0, closed=True):
    """Разбивает ломаную на короткие отрезки и чуть смещает точки шумом."""
    out = []
    n = len(pts)
    m = n if closed else n - 1
    k = 0
    for i in range(m):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % n]
        L = math.hypot(x1 - x0, y1 - y0)
        segs = max(1, int(L / step))
        nx, ny = (-(y1 - y0) / L, (x1 - x0) / L) if L > 0 else (0, 0)
        for j in range(segs):
            t = j / segs
            d = noise1(k * 0.37, seed) * amp
            out.append((x0 + (x1 - x0) * t + nx * d, y0 + (y1 - y0) * t + ny * d))
            k += 1
    if not closed:
        out.append(pts[-1])
    return out


def path(ctx, pts, closed=True):
    ctx.move_to(*pts[0])
    for p in pts[1:]:
        ctx.line_to(*p)
    if closed:
        ctx.close_path()


def fill_stroke(ctx, fill=None, stroke=INK, lw=3.0, alpha=1.0):
    if fill is not None:
        col(ctx, fill, alpha)
        if stroke is not None and lw > 0:
            ctx.fill_preserve()
        else:
            ctx.fill()
    if stroke is not None and lw > 0:
        col(ctx, stroke, alpha)
        ctx.set_line_width(lw)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.stroke()
    elif fill is None:
        ctx.new_path()


def poly(ctx, pts, fill=None, stroke=INK, lw=3.0, wob=1.0, seed=0, closed=True, alpha=1.0):
    if wob > 0:
        pts = wobble(pts, wob, seed, closed=closed)
    path(ctx, pts, closed)
    fill_stroke(ctx, fill, stroke, lw, alpha)


def rect(ctx, x, y, w, h, fill=None, stroke=INK, lw=3.0, wob=1.0, seed=0, alpha=1.0):
    poly(ctx, [(x, y), (x + w, y), (x + w, y + h), (x, y + h)], fill, stroke, lw, wob, seed, alpha=alpha)


def rrect_path(ctx, x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    ctx.new_sub_path()
    ctx.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    ctx.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    ctx.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    ctx.close_path()


def rrect(ctx, x, y, w, h, r, fill=None, stroke=INK, lw=3.0, alpha=1.0):
    rrect_path(ctx, x, y, w, h, r)
    fill_stroke(ctx, fill, stroke, lw, alpha)


def circle(ctx, x, y, r, fill=None, stroke=INK, lw=3.0, alpha=1.0):
    ctx.new_sub_path()
    ctx.arc(x, y, max(r, 0.01), 0, 2 * math.pi)
    fill_stroke(ctx, fill, stroke, lw, alpha)


def ellipse(ctx, x, y, rx, ry, fill=None, stroke=INK, lw=3.0, alpha=1.0, rot=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(max(rx, 0.01), max(ry, 0.01))
    ctx.new_sub_path()
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()
    fill_stroke(ctx, fill, stroke, lw, alpha)


def line(ctx, x1, y1, x2, y2, c=INK, lw=3.0, alpha=1.0):
    col(ctx, c, alpha)
    ctx.set_line_width(lw)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.move_to(x1, y1)
    ctx.line_to(x2, y2)
    ctx.stroke()


def polyline(ctx, pts, c=INK, lw=3.0, alpha=1.0):
    col(ctx, c, alpha)
    ctx.set_line_width(lw)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    path(ctx, pts, closed=False)
    ctx.stroke()


def curve(ctx, pts, c=INK, lw=3.0, alpha=1.0):
    """Гладкая кривая через точки (Catmull-Rom)."""
    col(ctx, c, alpha)
    ctx.set_line_width(lw)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    catmull(ctx, pts)
    ctx.stroke()


def catmull(ctx, pts, closed=False):
    n = len(pts)
    ctx.move_to(*pts[0])
    rng_ = range(n if closed else n - 1)
    for i in rng_:
        p0 = pts[(i - 1) % n] if (closed or i > 0) else pts[i]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if (closed or i + 2 < n) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        ctx.curve_to(*c1, *c2, *p2)
    if closed:
        ctx.close_path()


def blob(ctx, pts, fill=None, stroke=INK, lw=3.0, alpha=1.0):
    catmull(ctx, pts, closed=True)
    fill_stroke(ctx, fill, stroke, lw, alpha)


# --- текст -----------------------------------------------------------------

def font(ctx, family, size, bold=False):
    ctx.select_font_face(family, cairo.FONT_SLANT_NORMAL,
                         cairo.FONT_WEIGHT_BOLD if bold else cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(size)


def text(ctx, s, x, y, size=40, family=FONT_HAND, c=INK, align="center", bold=False,
         alpha=1.0, stroke=None, slw=0.0, rot=0.0, tracking=0.0):
    """Текст по базовой линии y. align: left/center/right."""
    ctx.save()
    font(ctx, family, size, bold)
    if tracking:
        widths = [ctx.text_extents(ch).x_advance + tracking for ch in s]
        tw = sum(widths) - tracking
    else:
        tw = ctx.text_extents(s).x_advance
    dx = {"left": 0, "center": -tw / 2, "right": -tw}[align]
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.move_to(dx, 0)
    if tracking:
        for ch, w in zip(s, widths):
            ctx.text_path(ch)
            ctx.rel_move_to(w - ctx.text_extents(ch).x_advance, 0)
    else:
        ctx.text_path(s)
    if stroke is not None and slw > 0:
        col(ctx, stroke, alpha)
        ctx.set_line_width(slw)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.stroke_preserve()
    col(ctx, c, alpha)
    ctx.fill()
    ctx.restore()
    return tw


def text_width(ctx, s, size, family=FONT_HAND, bold=False):
    ctx.save()
    font(ctx, family, size, bold)
    w = ctx.text_extents(s).x_advance
    ctx.restore()
    return w


# --- градиенты и свет ------------------------------------------------------

def radial(ctx, x, y, r, c, a0=1.0, a1=0.0, r0=0.0):
    c = C(c)
    g = cairo.RadialGradient(x, y, r0, x, y, max(r, 1))
    g.add_color_stop_rgba(0, c[0], c[1], c[2], a0)
    g.add_color_stop_rgba(1, c[0], c[1], c[2], a1)
    ctx.set_source(g)
    ctx.arc(x, y, max(r, 1), 0, 2 * math.pi)
    ctx.fill()


def vgrad(ctx, x, y, w, h, stops):
    g = cairo.LinearGradient(x, y, x, y + h)
    for t, c, *a in stops:
        c = C(c)
        g.add_color_stop_rgba(t, c[0], c[1], c[2], a[0] if a else 1.0)
    ctx.set_source(g)
    ctx.rectangle(x, y, w, h)
    ctx.fill()


def hgrad(ctx, x, y, w, h, stops):
    g = cairo.LinearGradient(x, y, x + w, y)
    for t, c, *a in stops:
        c = C(c)
        g.add_color_stop_rgba(t, c[0], c[1], c[2], a[0] if a else 1.0)
    ctx.set_source(g)
    ctx.rectangle(x, y, w, h)
    ctx.fill()


def surface(w, h):
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, int(w), int(h))
    return s, cairo.Context(s)


def paste(ctx, surf, x, y, scale=1.0, alpha=1.0, filt=cairo.FILTER_GOOD):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.set_source_surface(surf, 0, 0)
    ctx.get_source().set_filter(filt)
    ctx.paint_with_alpha(alpha)
    ctx.restore()


__all__ = [n for n in dir() if not n.startswith("_")] + ["mix", "shade", "hexrgb"]
