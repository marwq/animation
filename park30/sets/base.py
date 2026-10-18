"""Общее для декораций аэропорта: тон по времени суток, палитра, мелкие предметы."""
import math
from engine.core import hexrgb, mix, shade, TAU
from engine import draw as D

INK = D.INK
NIGHT = ("night", "deepnight", "dusk", "storm")

# фирменные цвета авиакомпании Lakeshore Air
NAVY = hexrgb("#1c3f7c")
TEAL = hexrgb("#19a7b0")
SUNC = hexrgb("#ffb22e")
WHITE = hexrgb("#fbfaf6")


def tone(c, tod):
    """Подкрасить цвет под время суток."""
    c = hexrgb(c) if isinstance(c, str) else c
    k = {"day": 0, "morning": 0.05, "dawn": 0.15, "golden": 0.12, "sunset": 0.22, "dusk": 0.38, "night": 0.55,
         "deepnight": 0.68, "storm": 0.42, "overcast": 0.15, "rain": 0.3}.get(tod, 0)
    t = {"morning": "#ffe8c8", "dawn": "#f2b0a0", "golden": "#ffc890", "sunset": "#f08a7a", "dusk": "#6a4a8a",
         "night": "#2a3a78", "deepnight": "#18224e", "storm": "#4a5560", "overcast": "#a8b4bc",
         "rain": "#6a7a8a"}.get(tod)
    return mix(c, hexrgb(t), k) if t else c


def logo(ctx, x, y, r, tod="day"):
    """Эмблема Lakeshore Air: восходящее солнце над волной."""
    ctx.save()
    ctx.arc(x, y, r, 0, TAU)
    ctx.clip()
    D.circle(ctx, x, y, r, tone(NAVY, tod), None, 0)
    D.circle(ctx, x, y + r * 0.15, r * 0.5, tone(SUNC, tod), None, 0)
    ctx.move_to(x - r, y + r * 0.25)
    for k in range(5):
        ctx.curve_to(x - r + (k + 0.3) * r * 0.4, y + r * 0.05, x - r + (k + 0.7) * r * 0.4, y + r * 0.45,
                     x - r + (k + 1) * r * 0.4, y + r * 0.25)
    ctx.line_to(x + r, y + r)
    ctx.line_to(x - r, y + r)
    ctx.close_path()
    D.col(ctx, tone(TEAL, tod))
    ctx.fill()
    ctx.restore()
    D.circle(ctx, x, y, r, None, INK, max(2, r * 0.08))


def jerrycan(ctx, x, gy, s=1.0, c="#e8423c"):
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.rrect(ctx, -30, -84, 60, 84, 8, hexrgb(c), INK, 4)
    D.line(ctx, -16, -84, -6, -100, INK, 6)
    D.line(ctx, -6, -100, 14, -100, INK, 6)
    D.rect(ctx, 14, -98, 10, 14, hexrgb("#2b2f3a"), INK, 2, wob=0)
    D.line(ctx, -20, -60, 20, -20, shade(hexrgb(c), -0.25), 4)
    D.line(ctx, 20, -60, -20, -20, shade(hexrgb(c), -0.25), 4)
    ctx.restore()
