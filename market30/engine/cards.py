"""Карточки в манере канала: чёрная «DAY N», кремовые правила / профили / запасы.

Анимация минимальная: элементы проявляются по очереди (0.25 с), значок чуть «подпрыгивает».
"""
import math
from .core import W, H, hexrgb, clamp, lerp, ease_out, ease_out_back, shade
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


def bar_card(ctx, t, title, bars, unit_max, caption=None):
    """Полоски, которые вырастают: bars = [(подпись, значение, текст значения, цвет)]."""
    cream(ctx)
    n = len(bars)
    top = H / 2 - n * 75 - 40
    D.text(ctx, title, W / 2, top, 58, FONT, TXT, bold=True, alpha=_a(t, 0.0))
    x0, wmax = W / 2 - 430, 860
    for i, (label, val, txt, col) in enumerate(bars):
        y = top + 110 + i * 160
        a = _a(t, 0.25 + i * 0.35)
        D.text(ctx, label, x0, y, 32, FONT, GREY, align="left", alpha=a)
        k = ease_out(clamp((t - 0.35 - i * 0.35) / 0.9))
        w = max(8, wmax * val / unit_max * k)
        D.rrect(ctx, x0, y + 22, wmax, 46, 23, hexrgb("#e4dfd3"), None, 0, alpha=a)
        D.rrect(ctx, x0, y + 22, w, 46, 23, hexrgb(col), None, 0, alpha=a)
        D.text(ctx, txt, x0 + wmax, y, 50, FONT, TXT, align="right", bold=True, alpha=a)
    if caption:
        D.text(ctx, caption, W / 2, top + 110 + n * 160 + 10, 32, FONT, GREY, alpha=_a(t, 0.4 + n * 0.35))


def timeline_card(ctx, t, title, items, caption=None, times=None):
    """Шкала слева направо: items = [(значок, подпись, срок)]; times — моменты появления (сек от начала)."""
    cream(ctx)
    n = len(items)
    D.text(ctx, title, W / 2, 300, 58, FONT, TXT, bold=True, alpha=_a(t, 0.0))
    x0, x1, y = 300, W - 300, 560
    k = ease_out(clamp((t - 0.2) / 0.8))
    D.line(ctx, x0 - 40, y + 120, lerp(x0 - 40, x1 + 60, k), y + 120, hexrgb("#cfc8b8"), 8)
    if k > 0.98:
        D.poly(ctx, [(x1 + 60, y + 104), (x1 + 92, y + 120), (x1 + 60, y + 136)], hexrgb("#cfc8b8"), None, 0, wob=0)
    for i, (icon, label, when) in enumerate(items):
        x = x0 + (x1 - x0) * i / max(1, n - 1)
        t0 = times[i] if times else 0.4 + i * 0.3
        icon_at(ctx, icon, x, y, 0.55, t, t0)
        a = _a(t, t0 + 0.1)
        D.circle(ctx, x, y + 120, 12, hexrgb("#8a826f"), None, 0, alpha=a)
        D.text(ctx, label, x, y + 185, 34, FONT, TXT, bold=True, alpha=a)
        D.text(ctx, when, x, y + 230, 30, FONT, GREY, alpha=a)
    if caption:
        D.text(ctx, caption, W / 2, 900, 32, FONT, GREY, alpha=_a(t, (times[-1] if times else 2.0) + 0.4))


def _ink():
    return hexrgb("#2b2a2e")


def icon_milk(ctx):
    ink = _ink()
    D.poly(ctx, [(-80, -60), (0, -150), (80, -60), (80, 150), (-80, 150)], hexrgb("#f4f6f8"), ink, 8, wob=0)
    D.poly(ctx, [(-80, -60), (0, -150), (80, -60)], hexrgb("#dfe6ee"), ink, 8, wob=0)
    D.rect(ctx, -20, -175, 40, 30, hexrgb("#4aa3e8"), ink, 6, wob=0)
    D.rect(ctx, -80, 10, 160, 70, hexrgb("#4aa3e8"), ink, 6, wob=0)
    for k in range(3):                      # волны запаха
        x = -50 + k * 50
        D.curve(ctx, [(x, -170), (x + 15, -200), (x - 10, -230), (x + 5, -260)], hexrgb("#8dbb4e"), 7)


def icon_steak(ctx):
    ink = _ink()
    D.blob(ctx, [(-150, -20), (-90, -100), (40, -110), (140, -50), (150, 40), (60, 100), (-80, 90), (-150, 40)],
           hexrgb("#d9534a"), ink, 8)
    D.blob(ctx, [(-110, -10), (-70, -60), (20, -70), (90, -30), (100, 30), (30, 60), (-60, 55)],
           hexrgb("#e8746a"), None, 0)
    D.circle(ctx, 60, 0, 34, hexrgb("#f4e7d4"), ink, 6)


def icon_bread(ctx):
    ink = _ink()
    D.rrect(ctx, -160, -60, 320, 150, 60, hexrgb("#d89a52"), ink, 8)
    for k in range(4):
        x = -100 + k * 65
        D.line(ctx, x, -45, x + 30, -10, hexrgb("#a66a2c"), 9)
    D.rrect(ctx, -140, 40, 280, 40, 20, hexrgb("#c48542"), None, 0)


def icon_can_big(ctx):
    ink = _ink()
    D.rrect(ctx, -95, -130, 190, 260, 16, hexrgb("#c7ccd2"), ink, 8)
    D.rect(ctx, -95, -80, 190, 160, hexrgb("#c23b2e"), ink, 6, wob=0)
    D.rect(ctx, -95, -20, 190, 50, hexrgb("#f4efe4"), None, 0, wob=0)
    D.ellipse(ctx, 0, -130, 95, 22, hexrgb("#dde1e6"), ink, 6)


def icon_sack(ctx):
    ink = _ink()
    D.blob(ctx, [(-120, 140), (-130, 0), (-90, -100), (-40, -130), (40, -130), (90, -100), (130, 0), (120, 140)],
           hexrgb("#efe6cf"), ink, 8)
    D.line(ctx, -50, -105, 50, -105, hexrgb("#8a6d3b"), 10)
    D.circle(ctx, 0, 40, 46, hexrgb("#f7f4ea"), ink, 5)
    for k in range(5):
        D.ellipse(ctx, -18 + (k % 3) * 18, 28 + (k // 3) * 22, 7, 4, hexrgb("#d9cfb5"), ink, 2, rot=0.4)


def icon_honey(ctx):
    ink = _ink()
    D.rrect(ctx, -110, -90, 220, 230, 40, hexrgb("#f2a93b"), ink, 8)
    D.rrect(ctx, -120, -140, 240, 60, 14, hexrgb("#e8e2d4"), ink, 8)
    D.blob(ctx, [(-110, -80), (-60, -60), (-40, -10), (-20, -60), (40, -40), (60, 20), (90, -60), (110, -80)],
           hexrgb("#ffc860"), None, 0)
    D.ellipse(ctx, -55, 40, 18, 40, hexrgb("#ffffff"), None, 0, alpha=0.5, rot=0.2)
    D.rrect(ctx, -70, 10, 140, 70, 10, hexrgb("#f7f0dc"), ink, 5)
    for k in range(3):                      # соты
        D.poly(ctx, [(-30 + k * 30 + 12 * math.cos(a * math.pi / 3), 45 + 12 * math.sin(a * math.pi / 3))
                     for a in range(6)], hexrgb("#f2a93b"), ink, 3, wob=0)


def icon_ear(ctx):
    ink = _ink()
    ctx.move_to(-60, 120)
    ctx.curve_to(-120, 60, -130, -120, 0, -140)
    ctx.curve_to(120, -140, 130, -20, 60, 30)
    ctx.curve_to(20, 60, 40, 130, -20, 150)
    ctx.curve_to(-50, 160, -60, 140, -60, 120)
    ctx.close_path()
    D.col(ctx, hexrgb("#f6f3ec"))
    ctx.fill_preserve()
    D.col(ctx, ink)
    ctx.set_line_width(8)
    ctx.stroke()
    D.curve(ctx, [(-40, 40), (-60, -60), (10, -90), (50, -40), (10, 0)], ink, 7)
    for k in range(3):
        ctx.arc(-20, -10, 190 + k * 40, -0.5, 0.5)
        D.col(ctx, hexrgb("#c8392f"), 0.9 - k * 0.25)
        ctx.set_line_width(10)
        ctx.stroke()


def zhead(ctx, x, y, s, alpha=1.0):
    """Значок-головка зомби для графиков."""
    ink = _ink()
    ctx.save()
    ctx.push_group()
    D.circle(ctx, x, y, s, hexrgb("#a7b48f"), ink, s * 0.12)
    D.circle(ctx, x - s * 0.33, y - s * 0.1, s * 0.22, hexrgb("#eef0dc"), ink, s * 0.07)
    D.circle(ctx, x + s * 0.3, y - s * 0.05, s * 0.17, hexrgb("#eef0dc"), ink, s * 0.07)
    D.circle(ctx, x - s * 0.3, y - s * 0.08, s * 0.07, ink, None, 0)
    D.circle(ctx, x + s * 0.32, y - s * 0.03, s * 0.06, ink, None, 0)
    D.ellipse(ctx, x, y + s * 0.45, s * 0.22, s * 0.13, hexrgb("#3a2a2a"), ink, s * 0.05)
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(alpha)
    ctx.restore()


def count_card(ctx, t, title, groups, caption=None, cols=5):
    """Столбики из головок по дням (как «IN THE HALLWAY»): groups = [(подпись, n, момент)]."""
    cream(ctx)
    D.text(ctx, title, W / 2, 250, 58, FONT, TXT, bold=True, alpha=_a(t, 0.0))
    base = 800
    gx = [W / 2 - 480 + i * 960 / max(1, len(groups) - 1) for i in range(len(groups))]
    D.line(ctx, gx[0] - 150, base + 10, gx[-1] + 150, base + 10, hexrgb("#cfc8b8"), 6, _a(t, 0.1))
    s = 26
    for (label, n, t0), x in zip(groups, gx):
        a = _a(t, t0)
        D.text(ctx, label, x, base + 70, 34, FONT, GREY, alpha=a)
        shown = int(n * clamp((t - t0) / 0.6) + 0.999) if t > t0 else 0
        rows = (n + cols - 1) // cols
        for k in range(shown):
            cx = x + ((k % cols) - (min(n, cols) - 1) / 2) * s * 2.25
            cy = base - s * 1.3 - (k // cols) * s * 2.25
            zhead(ctx, cx, cy, s)
        if shown >= n and n > 0:
            ty = base - s * 1.3 - (rows - 1) * s * 2.25 - 70
            D.text(ctx, str(n), x, ty, 54, FONT, RED, bold=True, alpha=_a(t, t0 + 0.6))
    if caption:
        D.text(ctx, caption, W / 2, base + 140, 32, FONT, GREY, alpha=_a(t, groups[-1][2] + 0.8))


def icon_ruth(ctx):
    """Профиль-значок: седой пучок, фиолетовые очки, белый халат."""
    ink = _ink()
    D.rrect(ctx, -150, 60, 300, 120, 50, hexrgb("#f4f6f8"), ink, 8)
    D.poly(ctx, [(-40, 60), (0, 130), (40, 60)], hexrgb("#c9d3dc"), ink, 6, wob=0)
    D.circle(ctx, 70, -175, 52, hexrgb("#e6e3df"), ink, 8)
    D.circle(ctx, 0, -60, 130, hexrgb("#f6f3ec"), ink, 9)
    ctx.save()
    ctx.arc(0, -60, 126, 0, 2 * math.pi)
    ctx.clip()
    D.ellipse(ctx, 0, -180, 150, 80, hexrgb("#e6e3df"), None, 0)
    ctx.restore()
    D.circle(ctx, 0, -60, 130, None, ink, 9)
    for x in (-45, 45):
        D.circle(ctx, x, -60, 36, None, hexrgb("#7a3a8a"), 9)
        D.circle(ctx, x, -60, 10, ink, None, 0)
    D.line(ctx, -9, -60, 9, -60, hexrgb("#7a3a8a"), 7)
    D.curve(ctx, [(-30, 10), (0, 22), (30, 10)], ink, 7)


def icon_generator(ctx):
    ink = _ink()
    D.rrect(ctx, -170, -110, 340, 200, 20, hexrgb("#e2b33a"), ink, 8)
    D.rrect(ctx, -120, -70, 150, 110, 12, hexrgb("#3a3c42"), ink, 6)
    for k in range(4):
        D.line(ctx, -105, -50 + k * 25, 15, -50 + k * 25, hexrgb("#6a6e78"), 5)
    D.circle(ctx, 90, -20, 34, hexrgb("#f4efe2"), ink, 6)
    D.line(ctx, 90, -20, 108, -38, ink, 5)
    D.rect(ctx, 50, 40, 90, 30, hexrgb("#c8392f"), ink, 5, wob=0)
    D.line(ctx, -190, -130, 190, -130, ink, 14)
    D.line(ctx, -190, -130, -190, 120, ink, 14)
    D.line(ctx, 190, -130, 190, 120, ink, 14)
    for x in (-140, 140):
        D.circle(ctx, x, 120, 26, hexrgb("#2b2c30"), ink, 5)


def icon_co(ctx):
    """Угарный газ: серое облако с черепом."""
    ink = _ink()
    D.blob(ctx, [(-170, 60), (-180, -10), (-120, -70), (-50, -110), (30, -120), (110, -80), (170, -20), (175, 60)],
           hexrgb("#c9cdd3"), ink, 8)
    D.circle(ctx, 0, -10, 70, hexrgb("#f4f2ec"), ink, 7)
    D.rrect(ctx, -40, 40, 80, 40, 10, hexrgb("#f4f2ec"), ink, 7)
    for x in (-25, 25):
        D.circle(ctx, x, -15, 18, ink, None, 0)
    D.poly(ctx, [(0, 10), (-9, 26), (9, 26)], ink, None, 0, wob=0)
    for x in (-15, 0, 15):
        D.line(ctx, x, 45, x, 75, ink, 4)


def icon_can_bulge(ctx):
    ink = _ink()
    ctx.move_to(-90, -130)
    ctx.curve_to(-150, -60, -150, 60, -90, 130)
    ctx.line_to(90, 130)
    ctx.curve_to(150, 60, 150, -60, 90, -130)
    ctx.close_path()
    D.col(ctx, hexrgb("#c7ccd2"))
    ctx.fill_preserve()
    D.col(ctx, ink)
    ctx.set_line_width(8)
    ctx.stroke()
    D.rect(ctx, -125, -60, 250, 120, hexrgb("#c23b2e"), None, 0, wob=0)
    D.rect(ctx, -125, -15, 250, 40, hexrgb("#f4efe4"), None, 0, wob=0)
    D.ellipse(ctx, 0, -138, 92, 30, hexrgb("#dde1e6"), ink, 7)
    D.ellipse(ctx, 0, -150, 50, 22, hexrgb("#eef0f2"), ink, 5)


def icon_leak(ctx):
    icon_can_big(ctx)
    for k, (x, y) in enumerate(((60, 140), (75, 185), (50, 225))):
        D.ellipse(ctx, x, y, 12, 18, hexrgb("#9a7a3a"), _ink(), 4)


def icon_hiss(ctx):
    icon_can_big(ctx)
    for k in range(3):
        y = -170 - k * 30
        D.curve(ctx, [(-60 + k * 10, y), (-20, y - 20), (20, y + 5), (60 - k * 10, y - 15)], hexrgb("#8a9098"), 7)


def icon_rat(ctx):
    ink = _ink()
    D.curve(ctx, [(140, 40), (200, 20), (230, -40), (260, -20)], hexrgb("#c99a9a"), 10)
    D.ellipse(ctx, 20, 20, 130, 80, hexrgb("#8a8a92"), ink, 8)
    D.ellipse(ctx, -110, 0, 70, 52, hexrgb("#8a8a92"), ink, 8, rot=-0.2)
    D.circle(ctx, -90, -55, 30, hexrgb("#c99a9a"), ink, 6)
    D.circle(ctx, -135, -10, 9, ink, None, 0)
    D.circle(ctx, -178, 10, 10, hexrgb("#e08a9a"), None, 0)
    for k in range(3):
        D.line(ctx, -170, 12, -215, -5 + k * 15, ink, 3)
    for x in (-40, 80):
        D.line(ctx, x, 90, x - 10, 110, ink, 8)


def icon_jar(ctx):
    ink = _ink()
    D.rrect(ctx, -90, -100, 180, 230, 30, hexrgb("#d9eef2"), ink, 8)
    D.rrect(ctx, -100, -140, 200, 50, 10, hexrgb("#c8392f"), ink, 8)
    D.rect(ctx, -90, 0, 180, 120, hexrgb("#f1e6c4"), None, 0, wob=0)
    D.rrect(ctx, -90, -100, 180, 230, 30, None, ink, 8)
    D.line(ctx, -55, -70, -55, 90, hexrgb("#ffffff"), 10, 0.7)


def icon_box(ctx):
    ink = _ink()
    D.rect(ctx, -110, -140, 220, 280, hexrgb("#d9b46a"), ink, 8, wob=0)
    D.rect(ctx, -80, -100, 160, 110, hexrgb("#f4e3b5"), ink, 5, wob=0)
    D.poly(ctx, [(-110, 140), (-60, 90), (-20, 140)], hexrgb("#f3efe6"), ink, 6, wob=0)    # прогрызено


def icon_bag(ctx):
    ink = _ink()
    D.poly(ctx, [(-100, -110), (100, -110), (120, 130), (-120, 130)], hexrgb("#e4e8ee"), ink, 8, wob=0)
    for k in range(4):
        D.line(ctx, -90 + k * 10, -110, -80 + k * 10, -140, ink, 5)
    D.rect(ctx, -70, -30, 140, 80, hexrgb("#f2c84b"), ink, 5, wob=0)


def icon_shield_pane(ctx):
    ink = _ink()
    D.rect(ctx, -160, -130, 320, 260, hexrgb("#cfe6f2"), ink, 8, wob=0)
    D.line(ctx, -120, 80, -60, -80, hexrgb("#ffffff"), 12, 0.8)


def icon_truck(ctx):
    ink = _ink()
    D.rrect(ctx, -220, -130, 300, 190, 10, hexrgb("#f4f4f2"), ink, 8)
    D.rect(ctx, -180, -170, 120, 40, hexrgb("#c9ccd2"), ink, 6, wob=0)
    D.poly(ctx, [(80, -60), (170, -60), (220, 0), (220, 60), (80, 60)], hexrgb("#f4f4f2"), ink, 8, wob=0)
    D.poly(ctx, [(100, -45), (160, -45), (195, 0), (100, 0)], hexrgb("#9fd2ea"), ink, 6, wob=0)
    for x in (-150, 150):
        D.circle(ctx, x, 70, 45, hexrgb("#2b2c30"), ink, 6)
        D.circle(ctx, x, 70, 16, hexrgb("#c9ccd2"), None, 0)


def icon_key(ctx):
    ink = _ink()
    D.circle(ctx, -110, 0, 70, hexrgb("#d9b54a"), ink, 8)
    D.circle(ctx, -110, 0, 26, hexrgb("#f3f0e8"), ink, 6)
    D.rect(ctx, -45, -18, 220, 36, hexrgb("#d9b54a"), ink, 7, wob=0)
    for x in (110, 150):
        D.rect(ctx, x, 18, 22, 40, hexrgb("#d9b54a"), ink, 6, wob=0)


def icon_snowflake_door(ctx):
    """Морозильная камера: стальная дверь с ручкой и снежинкой."""
    ink = _ink()
    D.rrect(ctx, -140, -180, 280, 360, 16, hexrgb("#d4dbe2"), ink, 8)
    D.rrect(ctx, 70, -30, 40, 110, 12, hexrgb("#8a9098"), ink, 6)
    for k in range(3):
        a = k * math.pi / 3
        D.line(ctx, -40 - 60 * math.cos(a), -60 - 60 * math.sin(a), -40 + 60 * math.cos(a),
               -60 + 60 * math.sin(a), hexrgb("#4aa3e8"), 10)


def split_card(ctx, t, title, left, right, caption=None, t_right=1.2):
    """Две колонки: left/right = (заголовок, цвет, [значки])."""
    cream(ctx)
    D.text(ctx, title, W / 2, 230, 58, FONT, TXT, bold=True, alpha=_a(t, 0.0))
    for side, (head, col, icons), t0 in ((-1, left, 0.3), (1, right, t_right)):
        cx = W / 2 + side * 420
        a = _a(t, t0)
        D.text(ctx, head, cx, 380, 56, FONT, hexrgb(col), bold=True, alpha=a)
        for i, ic in enumerate(icons):
            icon_at(ctx, ic, cx + (i - (len(icons) - 1) / 2) * 260, 620, 0.62, t, t0 + 0.15 + i * 0.2)
    D.line(ctx, W / 2, 330, W / 2, 860, hexrgb("#d8d1c2"), 5, _a(t, 0.2))
    if caption:
        D.text(ctx, caption, W / 2, 930, 34, FONT, GREY, alpha=_a(t, t_right + 0.6))
