"""Мостик: окна во всю стену с океаном, пульты, штурвал, кнопка гудка, рация, кресло капитана,
внутренняя дверь с окошком (слева), дверь на крыло мостика (справа), люк на крышу.

Мир: x 0..3000, пол BF = 900, окна от WY0 до WY1.
"""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1
from engine import draw as D
from . import sea as SEA
from .deck import tone

INK = D.INK
BF = 900
WY0, WY1 = 130, 500
WIN_X = (330, 2580)
DOOR_X = 150          # центр внутренней двери
WING_X = 2800         # центр двери на крыло
HATCH_X = 2420
WHEEL_X = 1380
HORN_X = 1760
RADIO_X = 2120
CHAIR_X = 860
CHART_X = 2500


def outside(ctx, t, tod="day", rough=0.0, hy=360, roll=0.0, sun=None, moon=None, clip=True):
    """Вид за окнами (каждый кадр). roll — крен в радианах (шторм)."""
    ctx.save()
    if clip:
        _win_path(ctx)
        ctx.clip()
    ctx.translate(1460, hy)
    ctx.rotate(roll)
    ctx.translate(-1460, -hy)
    sky_tod = tod
    SEA.sky(ctx, -1400, -3000, 5800, hy + 3000, sky_tod)
    if tod in ("night", "deepnight"):
        SEA.stars(ctx, 0, -300, 3000, hy + 300, t, 3, 1.0)
    if sun:
        SEA.sun(ctx, *sun, tod)
    if moon:
        SEA.moon(ctx, *moon)
    if tod not in ("night", "deepnight"):
        SEA.cloudbank(ctx, 0, 3000, hy - 160, tod, seed=8, n=6, s0=0.4, s1=0.8)
    SEA.ocean(ctx, t, -1400, 4400, hy, hy + 1400, tod, rough=rough, seed=7, sun_x=(sun or moon or (None,))[0])
    ctx.restore()


def _win_path(ctx):
    x0, x1 = WIN_X
    ctx.move_to(x0, WY1)
    ctx.line_to(x0 + 40, WY0)
    ctx.line_to(x1 - 40, WY0)
    ctx.line_to(x1, WY1)
    ctx.close_path()


def room(ctx, tod="day", power=1.0, door_glass=True, hatch_open=0.0, battery=None):
    """Всё, кроме вида за окном и анимированных экранов (для кэша; окна прозрачные)."""
    T = lambda c: tone(c, "day" if power > 0 else tod)
    night = tod in ("night", "deepnight", "dusk", "storm")
    wall = T("#e8ecef") if not night else (hexrgb("#9aa4b8") if power > 0 else hexrgb("#4a5470"))
    # стены и потолок вокруг окон
    ctx.save()
    ctx.rectangle(-200, -300, 3400, 1500)
    _win_path(ctx)
    ctx.set_fill_rule(cairo.FILL_RULE_EVEN_ODD)
    D.col(ctx, wall)
    ctx.fill()
    ctx.restore()
    D.rect(ctx, -200, -300, 3400, 300, shade(wall, -0.12), None, 0, wob=0)
    # подвесная панель с приборами
    D.rect(ctx, 1150, -10, 700, 100, T("#3b4656"), INK, 4, wob=0)
    for k in range(5):
        D.circle(ctx, 1230 + k * 135, 40, 34, T("#f4f2ec"), INK, 3)
        a = -0.8 + k * 0.4
        D.line(ctx, 1230 + k * 135, 40, 1230 + k * 135 + math.cos(a) * 26, 40 + math.sin(a) * 26, T("#e8423c"), 4)
    # часы, фото капитана с кошкой, спасательный круг
    D.circle(ctx, DOOR_X, 90, 44, T("#ffffff"), INK, 5)
    D.line(ctx, DOOR_X, 90, DOOR_X, 60, INK, 5)
    D.line(ctx, DOOR_X, 90, DOOR_X + 22, 98, INK, 5)
    D.rect(ctx, WING_X - 80, 110, 160, 130, T("#a86a3a"), INK, 4, wob=0)
    D.rect(ctx, WING_X - 64, 126, 128, 98, T("#bfe6f2"), None, 0, wob=0)
    D.circle(ctx, WING_X - 20, 165, 22, T("#f3e6d6"), INK, 2)
    D.rect(ctx, WING_X - 42, 140, 44, 12, T("#ffffff"), INK, 2, wob=0)
    D.ellipse(ctx, WING_X + 30, 200, 24, 14, T("#f28a2c"), INK, 2)
    D.circle(ctx, WING_X + 46, 186, 11, T("#f28a2c"), INK, 2)
    from .deck import lifering
    lifering(ctx, 2990, 470, "day" if power > 0 else tod, 50)
    # потолочные лампы
    for x in range(400, 2700, 380):
        D.rrect(ctx, x, 20, 200, 26, 10, hexrgb("#fff7d6") if power > 0 else shade(wall, -0.2), INK, 3)
    # рамы окон
    x0, x1 = WIN_X
    D.col(ctx, INK)
    _win_path(ctx)
    ctx.set_line_width(10)
    ctx.stroke()
    for k in range(1, 5):
        u = k / 5
        xa = lerp(x0 + 40, x1 - 40, u)
        xb = lerp(x0, x1, u)
        D.line(ctx, xa, WY0, xb, WY1, INK, 14)
        D.line(ctx, xa, WY0, xb, WY1, shade(wall, -0.25), 7)
    # стёкла: лёгкий блик
    ctx.save()
    _win_path(ctx)
    ctx.clip()
    for k in range(5):
        gx = x0 + 120 + k * 450
        D.poly(ctx, [(gx, WY1), (gx + 50, WY1), (gx + 170, WY0), (gx + 120, WY0)], (1, 1, 1), None, 0, wob=0,
               alpha=0.12)
    ctx.restore()
    # пульт под окнами
    D.poly(ctx, [(260, WY1 + 10), (2650, WY1 + 10), (2700, 640), (210, 640)], T("#3b4656"), INK, 4, wob=0)
    D.rect(ctx, 210, 640, 2490, 200, T("#4a5668"), INK, 4, wob=0)
    D.rect(ctx, 210, 640, 2490, 16, T("#2e3644"), None, 0, wob=0)
    r = rng(4)
    for i in range(36):
        x = 300 + i * 66
        if abs(x - HORN_X) < 90 or abs(x - RADIO_X) < 150:
            continue
        D.rrect(ctx, x, 560 + (i % 2) * 22, 40, 16, 5, T(r.choice(["#e8423c", "#3fbf6a", "#f2c230", "#2f8fd8"])),
                INK, 1.5)
    for (sx, sw) in ((420, 260), (980, 220), (2260, 160)):
        D.rrect(ctx, sx, 520, sw, 34, 6, T("#1a2230"), INK, 3)
    # кнопка гудка
    D.rect(ctx, HORN_X - 60, 590, 120, 46, T("#2e3644"), INK, 3, wob=0)
    D.ellipse(ctx, HORN_X, 588, 46, 18, T("#c02a2a"), INK, 3)
    D.ellipse(ctx, HORN_X, 578, 40, 16, T("#e8423c"), INK, 3)
    D.rrect(ctx, HORN_X - 50, 660, 100, 34, 6, T("#f2c230"), INK, 2)
    D.text(ctx, "HORN", HORN_X, 687, 26, D.FONT_TITLE, INK)
    # рация
    D.rrect(ctx, RADIO_X - 130, 470, 260, 130, 12, T("#5a5f52"), INK, 4)
    D.rrect(ctx, RADIO_X - 110, 490, 130, 50, 6, T("#1a2a1a"), INK, 2)
    for k in range(3):
        D.circle(ctx, RADIO_X + 50 + k * 26, 515, 11, T("#c9c4b8"), INK, 2)
    D.rect(ctx, RADIO_X - 110, 555, 220, 30, T("#3a3f34"), None, 0, wob=0)
    for k in range(10):
        D.line(ctx, RADIO_X - 100 + k * 22, 560, RADIO_X - 100 + k * 22, 580, INK, 2)
    # аккумулятор
    D.rrect(ctx, RADIO_X - 300, 660, 150, 70, 8, T("#2e3644"), INK, 3)
    D.text(ctx, "BATTERY", RADIO_X - 225, 684, 20, D.FONT_TITLE, T("#f2c230"))
    # штурвал-стойка
    D.rect(ctx, WHEEL_X - 40, 640, 80, 260, T("#2e3644"), INK, 4, wob=0)
    # штурманский стол
    D.rect(ctx, CHART_X - 150, 690, 300, 30, T("#a86a3a"), INK, 3, wob=0)
    D.rect(ctx, CHART_X - 130, 720, 20, 180, T("#7a4a2a"), INK, 2, wob=0)
    D.rect(ctx, CHART_X + 110, 720, 20, 180, T("#7a4a2a"), INK, 2, wob=0)
    D.rect(ctx, CHART_X - 140, 676, 280, 16, T("#f2ead2"), INK, 2, wob=0)
    # пол
    D.rect(ctx, -200, 840, 3400, 400, T("#5a6678"), None, 0, wob=0)
    D.col(ctx, T("#4a5668"))
    ctx.set_line_width(3)
    for k in range(6):
        y = 860 + k * k * 12
        ctx.move_to(-200, y)
        ctx.line_to(3200, y)
    ctx.stroke()
    D.line(ctx, -200, 840, 3200, 840, INK, 3)
    # кресло капитана
    chair(ctx, CHAIR_X, BF, T)
    # внутренняя дверь
    door(ctx, DOOR_X, T, glass=door_glass)
    D.rect(ctx, DOOR_X - 70, 170, 140, 40, T("#1c3f7c"), INK, 3, wob=0)
    D.text(ctx, "BRIDGE", DOOR_X, 200, 28, D.FONT_TITLE, T("#fff6d8"))
    # дверь на крыло
    D.rect(ctx, WING_X - 110, 300, 220, 560, T("#d8dee2"), INK, 4, wob=0)
    D.circle(ctx, WING_X, 420, 50, T("#9fd8ec"), INK, 6)
    D.rect(ctx, WING_X + 70, 580, 20, 50, T("#8a96a0"), INK, 2, wob=0)
    # люк на крышу и трап
    D.rect(ctx, HATCH_X - 80, -10, 160, 26, T("#2e3644"), INK, 3, wob=0)
    if hatch_open > 0:
        D.rect(ctx, HATCH_X - 70, -10, 140, 20, hexrgb("#0e1430"), None, 0, wob=0)
    from .deck import ladder
    ladder(ctx, HATCH_X, 10, 680, "day" if power > 0 else tod, w=60)


def chair(ctx, x, gy, T):
    D.line(ctx, x, gy, x, gy - 160, INK, 14)
    D.line(ctx, x, gy, x, gy - 160, T("#8a96a0"), 8)
    D.ellipse(ctx, x, gy - 4, 90, 14, T("#3a4048"), INK, 3)
    D.rrect(ctx, x - 90, gy - 210, 180, 60, 18, T("#2b2f3a"), INK, 4)
    D.rrect(ctx, x - 100, gy - 430, 60, 260, 22, T("#2b2f3a"), INK, 4)
    D.rrect(ctx, x - 60, gy - 250, 150, 20, 8, T("#2b2f3a"), INK, 3)


def door(ctx, x, T, glass=True, crack=0.0):
    D.rect(ctx, x - 120, 280, 240, 580, T("#c9d0d4"), INK, 4, wob=0)
    D.rect(ctx, x - 100, 300, 200, 540, T("#d8dee2"), INK, 3, wob=0)
    D.rect(ctx, x - 50, 360, 100, 120, T("#1a2230") if glass else T("#9fd8ec"), INK, 5, wob=0)
    D.rect(ctx, x + 60, 580, 22, 60, T("#8a96a0"), INK, 2, wob=0)


def wheel(ctx, x, y, r, ang, tod="day"):
    """Штурвал."""
    c = tone("#b07a3a", tod)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    for k in range(8):
        a = k * TAU / 8
        D.line(ctx, 0, 0, math.cos(a) * r * 1.25, math.sin(a) * r * 1.25, INK, 16)
        D.line(ctx, 0, 0, math.cos(a) * r * 1.25, math.sin(a) * r * 1.25, c, 9)
        D.circle(ctx, math.cos(a) * r * 1.28, math.sin(a) * r * 1.28, 10, c, INK, 3)
    D.circle(ctx, 0, 0, r, None, INK, 22)
    D.circle(ctx, 0, 0, r, None, c, 14)
    D.circle(ctx, 0, 0, 22, tone("#e9b949", tod), INK, 4)
    ctx.restore()


def screens(ctx, t, power=1.0, autopilot=True, battery=None, horn_glow=0.0):
    """Анимированные экраны пульта и индикаторы (каждый кадр)."""
    if power <= 0 and battery is None:
        return
    if power > 0:
        # радар
        cx, cy = 550, 537
        D.rrect(ctx, 420, 520, 260, 34, 6, hexrgb("#0e2a1a"), None, 0)
        x = 420 + (t * 120) % 260
        D.rect(ctx, x, 522, 6, 30, hexrgb("#4cff8a"), None, 0, wob=0, alpha=0.8)
        if autopilot:
            D.rrect(ctx, 980, 520, 220, 34, 6, hexrgb("#0e1e3a"), None, 0)
            a = 0.6 + 0.4 * math.sin(t * 4)
            D.text(ctx, "AUTOPILOT", 1090, 546, 24, D.FONT_TITLE, hexrgb("#7fd0ff"), alpha=a)
        for k in range(10):
            on = (int(t * 3) + k * 7) % 5 != 0
            D.circle(ctx, 2280 + k * 14, 537, 4, hexrgb("#4cff8a") if on else hexrgb("#1a3a2a"), None, 0)
    if battery is not None:
        D.rrect(ctx, RADIO_X - 290, 694, 130, 28, 4, hexrgb("#0e1410"), None, 0)
        c = "#4cff8a" if battery > 20 else ("#f2c230" if battery > 8 else "#ff4a3a")
        D.text(ctx, "%d%%" % battery, RADIO_X - 225, 717, 26, D.FONT_TITLE, hexrgb(c))
    if horn_glow > 0:
        D.radial(ctx, HORN_X, 580, 90, "#ff6a5a", 0.6 * horn_glow, 0)


def radio_lit(ctx, t, talk=0.0):
    """Огонёк и «уровень» на рации."""
    D.rrect(ctx, RADIO_X - 110, 490, 130, 50, 6, hexrgb("#0e2a14"), None, 0)
    D.text(ctx, "CH 16", RADIO_X - 45, 524, 26, D.FONT_TITLE, hexrgb("#4cff8a"))
    D.circle(ctx, RADIO_X - 120, 480, 7, hexrgb("#ff4a3a") if talk > 0.1 else hexrgb("#4cff8a"), None, 0)
    if talk > 0:
        for k in range(10):
            h = 6 + 14 * abs(math.sin(t * 13 + k * 1.7)) * talk
            D.rect(ctx, RADIO_X - 100 + k * 22, 582 - h, 14, h, hexrgb("#4cff8a"), None, 0, wob=0, alpha=0.8)


def mic(ctx, x, y, hx=None, hy=None):
    """Тангента рации на витом шнуре: от рации к точке (x, y)."""
    sx, sy = RADIO_X - 120, 590
    pts = []
    for k in range(40):
        u = k / 39
        px = lerp(sx, x, u)
        py = lerp(sy, y, u) + math.sin(u * math.pi) * 60
        pts.append((px + math.sin(u * 60) * 6, py + math.cos(u * 60) * 6))
    D.polyline(ctx, pts, INK, 3)
    D.rrect(ctx, x - 22, y - 34, 44, 68, 12, hexrgb("#2b2f3a"), INK, 3)
    D.circle(ctx, x, y - 12, 9, hexrgb("#5a5f68"), None, 0)
