"""Карточки в манере канала: чёрная «DAY N», кремовые правила / профили / запасы.

Анимация минимальная: элементы проявляются по очереди (0.25 с), значок чуть «подпрыгивает».
"""
import math
from .core import W, H, hexrgb, clamp, ease_out, ease_out_back, shade
from . import draw as D

FONT = "Inter"
CREAM = hexrgb("#f3f0e8")
NIGHT = hexrgb("#1b1d23")
TXT = hexrgb("#24252a")
GREY = hexrgb("#6d6e73")
RED = hexrgb("#c8392f")


def _a(t, t0, d=0.3):
    return ease_out(clamp((t - t0) / d))


def day_card(ctx, n, t):
    D.col(ctx, NIGHT)
    ctx.paint()
    a = _a(t, 0.05, 0.25)
    D.text(ctx, "DAY %d" % n, W / 2, H / 2 + 46, 132, FONT, hexrgb("#f4f4f2"), bold=True, alpha=a)


def cream(ctx):
    D.col(ctx, CREAM)
    ctx.paint()


def icon_at(ctx, fn, x, y, s, t, t0=0.0):
    k = clamp((t - t0) / 0.35)
    if k <= 0:
        return
    sc = s * (0.6 + 0.4 * ease_out_back(k))
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(sc, sc)
    ctx.push_group()
    fn(ctx)
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(clamp(k * 2))
    ctx.restore()


def rule_card(ctx, t, icon, title, sub, y0=0):
    """Значок по центру, заголовок капсом, подпись серым (как «SIEGE RULE 1»)."""
    cream(ctx)
    icon_at(ctx, icon, W / 2, 400 + y0, 1.0, t, 0.0)
    D.text(ctx, title, W / 2, 640 + y0, 60, FONT, TXT, bold=True, alpha=_a(t, 0.2))
    if sub:
        for i, line in enumerate(sub.split("\n")):
            D.text(ctx, line, W / 2, 725 + y0 + i * 52, 36, FONT, GREY, alpha=_a(t, 0.45))


profile_card = rule_card


def supplies_card(ctx, t, title, rows, caption=None):
    """rows: [(подпись, значение, [иконки...], доля_полных)] — иконки рисуются функцией (ctx, full)."""
    cream(ctx)
    n = len(rows)
    top = H / 2 - (n * 230) / 2 + 40
    D.text(ctx, title, W / 2, top - 20, 58, FONT, TXT, bold=True, alpha=_a(t, 0.0))
    x0 = W / 2 - 420
    for i, (label, value, icon, count, full) in enumerate(rows):
        y = top + 90 + i * 230
        a = _a(t, 0.25 + i * 0.3)
        D.text(ctx, label, x0, y, 32, FONT, GREY, align="left", alpha=a)
        D.text(ctx, value, x0 + 840, y + 10, 58, FONT, TXT, align="right", bold=True, alpha=a)
        for k in range(count):
            ka = _a(t, 0.35 + i * 0.3 + k * 0.04, 0.2)
            if ka <= 0:
                continue
            ctx.save()
            ctx.translate(x0 + 40 + k * 78, y + 85)
            ctx.push_group()
            icon(ctx, k < full)
            ctx.pop_group_to_source()
            ctx.paint_with_alpha(ka)
            ctx.restore()
    if caption:
        D.text(ctx, caption, W / 2, top + 90 + n * 230 - 20, 32, FONT, GREY, alpha=_a(t, 0.4 + n * 0.3))


# --- значки (цветные, «эмодзи»-манера: тёмный контур, мягкая тень) -------------------------

def icon_store(ctx):
    """Магазинчик: стена, зелёный полосатый навес, витрина, дверь."""
    ink = hexrgb("#2b2a2e")
    D.rrect(ctx, -150, -60, 300, 200, 14, hexrgb("#efe6d2"), ink, 7)
    D.rect(ctx, -150, -150, 300, 40, hexrgb("#e5dccb"), ink, 7, wob=0)
    for k in range(6):          # навес
        x = -160 + k * 53.3
        D.poly(ctx, [(x, -110), (x + 53.3, -110), (x + 53.3, -40), (x, -40)],
               hexrgb("#3f9d5a") if k % 2 == 0 else hexrgb("#f5f1e6"), ink, 6, wob=0)
    for k in range(6):
        cx = -160 + k * 53.3 + 26.6
        ctx.arc(cx, -40, 26.6, 0, math.pi)
        D.col(ctx, hexrgb("#3f9d5a") if k % 2 == 0 else hexrgb("#f5f1e6"))
        ctx.fill_preserve()
        D.col(ctx, ink)
        ctx.set_line_width(6)
        ctx.stroke()
    D.rect(ctx, -120, 10, 130, 90, hexrgb("#9fd2ea"), ink, 6, wob=0)
    D.line(ctx, -95, 25, -60, 60, hexrgb("#ffffff"), 7, 0.8)
    D.rect(ctx, 40, 10, 75, 130, hexrgb("#c98a4b"), ink, 6, wob=0)
    D.circle(ctx, 100, 80, 6, ink, None, 0)
    for k in range(3):          # фрукты на прилавке
        D.circle(ctx, -95 + k * 40, 120, 17, hexrgb(["#e8503a", "#f2b33a", "#7cc24a"][k]), ink, 5)


def icon_water(ctx, full=True):
    """Бутыль воды (синяя, как у канала), пустая — бледная."""
    ink = hexrgb("#2b2a2e")
    c = hexrgb("#4aa3e8") if full else hexrgb("#d9e6f0")
    D.rrect(ctx, -26, -30, 52, 70, 10, c, ink, 4)
    D.rect(ctx, -12, -44, 24, 14, shade(c, -0.15), ink, 4, wob=0)
    if full:
        D.line(ctx, -14, -18, -14, 26, hexrgb("#ffffff"), 5, 0.6)


def icon_can(ctx, full=True):
    ink = hexrgb("#2b2a2e")
    c = hexrgb("#ef8a2e") if full else hexrgb("#f1e3d3")
    D.rrect(ctx, -26, -34, 52, 72, 8, c, ink, 4)
    D.rect(ctx, -26, -12, 52, 26, hexrgb("#f7efe2") if full else hexrgb("#f7f2ea"), ink, 3, wob=0)


def icon_bulb(ctx):
    """Лампочка со свечением."""
    ink = hexrgb("#2b2a2e")
    D.radial(ctx, 0, -40, 190, hexrgb("#ffe27a"), 0.45, 0)
    for k in range(7):
        a = math.pi * (1.1 + k * 0.8 / 6)
        D.line(ctx, math.cos(a) * 150, -40 + math.sin(a) * 150, math.cos(a) * 185, -40 + math.sin(a) * 185,
               hexrgb("#f2b33a"), 12)
    ctx.move_to(-48, 40)
    ctx.curve_to(-48, 0, -95, -20, -95, -60)
    ctx.curve_to(-95, -120, -50, -150, 0, -150)
    ctx.curve_to(50, -150, 95, -120, 95, -60)
    ctx.curve_to(95, -20, 48, 0, 48, 40)
    ctx.close_path()
    D.col(ctx, hexrgb("#ffe27a"))
    ctx.fill_preserve()
    D.col(ctx, ink)
    ctx.set_line_width(8)
    ctx.stroke()
    D.curve(ctx, [(-22, 30), (-22, -40), (0, -60), (22, -40), (22, 30)], hexrgb("#c98a2a"), 6)
    D.ellipse(ctx, -45, -95, 14, 26, hexrgb("#ffffff"), None, 0, alpha=0.8, rot=0.5)
    D.rrect(ctx, -52, 40, 104, 70, 12, hexrgb("#a9adb4"), ink, 8)
    for k in range(2):
        D.line(ctx, -50, 62 + k * 22, 50, 62 + k * 22, ink, 5)
    D.rrect(ctx, -26, 108, 52, 22, 8, hexrgb("#5d6168"), ink, 6)
