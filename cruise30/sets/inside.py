"""Внутренние помещения и берег: ресторан, Бордвок с каруселью и тарзанкой, казино, марина,
коридор экипажа I-95 и кладовая, аварийная шахта, каюта капитана, детский клуб,
радиорубка Долорес в Ки-Уэсте, кухня мамы в Майами, пляж Майами, причал Ки-Уэста.
Пол FL = 900."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1
from engine import draw as D
from . import sea as SEA
from .deck import tone, ladder, lifering, palm_pot, umbrella

INK = D.INK
FL = 900


def _floor_tiles(ctx, x0, x1, y, c1, c2, step=120):
    D.rect(ctx, x0, y, x1 - x0, 600, c1, None, 0, wob=0)
    k = 0
    for x in range(int(x0), int(x1), step):
        for j in range(5):
            if (k + j) % 2:
                yy = y + j * 40 + j * j * 6
                D.rect(ctx, x, yy, step, 40 + j * 12, c2, None, 0, wob=0)
        k += 1
    D.line(ctx, x0, y, x1, y, INK, 3)


# --- ресторан «Horizon Buffet» -----------------------------------------------------------

OMELET_X = 700
CHOCO_X = 1500
ICE_X = 2050
CART_Y = FL


def buffet(ctx, tod="morning", power=1.0, rot=0.0):
    T = lambda c: tone(c, "day" if power > 0 else tod)
    D.rect(ctx, -400, -200, 3600, 1100, T("#fbf2e2"), None, 0, wob=0)
    # окна на океан
    for i in range(6):
        x = -300 + i * 560
        D.rect(ctx, x, 60, 460, 330, T("#7fd8f0"), INK, 5, wob=0)
        D.rect(ctx, x, 260, 460, 130, T("#2fb3d8"), None, 0, wob=0)
        D.line(ctx, x + 230, 60, x + 230, 390, INK, 6)
        D.poly(ctx, [(x + 40, 390), (x + 90, 390), (x + 190, 60), (x + 140, 60)], (1, 1, 1), None, 0, wob=0, alpha=0.3)
    # люстры-штурвалы
    for x in (400, 1400, 2400):
        D.line(ctx, x, -200, x, -40, INK, 4)
        D.circle(ctx, x, 0, 50, None, T("#b07a3a"), 10)
        for k in range(8):
            a = k * TAU / 8
            D.circle(ctx, x + math.cos(a) * 60, math.sin(a) * 60, 9, hexrgb("#fff2b0") if power > 0 else T("#d8d0b8"),
                     INK, 2)
    D.rect(ctx, 200, 420, 1200, 60, T("#e8423c"), INK, 4, wob=0)
    D.text(ctx, "HORIZON BUFFET", 800, 465, 44, D.FONT_TITLE, T("#fff6d8"))
    # стойки с едой
    D.rect(ctx, 300, 640, 2600, 260, T("#a86a3a"), INK, 4, wob=0)
    D.rect(ctx, 280, 620, 2640, 30, T("#f4f2ec"), INK, 3, wob=0)
    D.rect(ctx, 300, 520, 2600, 14, T("#c9d0d4"), INK, 2, wob=0)
    for x in range(320, 2900, 260):
        D.line(ctx, x, 534, x, 620, T("#c9d0d4"), 4)
    # омлетная станция: плита и сковородки
    D.rect(ctx, OMELET_X - 140, 590, 280, 34, T("#3a4048"), INK, 3, wob=0)
    for k in (-1, 1):
        D.ellipse(ctx, OMELET_X + k * 70, 588, 56, 12, T("#2b2f3a"), INK, 3)
        D.line(ctx, OMELET_X + k * 70 + 50, 588, OMELET_X + k * 70 + 110, 580, INK, 6)
    D.ellipse(ctx, OMELET_X - 70, 584, 30, 7, T("#f6d860"), None, 0)
    D.rect(ctx, OMELET_X - 120, 450, 240, 40, T("#f2c230"), INK, 3, wob=0)
    D.text(ctx, "OMELETS", OMELET_X, 480, 28, D.FONT_TITLE, INK)
    # подносы с беконом и блинчиками
    for i, (x, food) in enumerate(((1000, "bacon"), (1180, "pancakes"), (2350, "fruit"), (2600, "cake"))):
        D.rect(ctx, x - 80, 596, 160, 26, T("#c9d0d4"), INK, 3, wob=0)
        if food == "bacon":
            for k in range(4):
                D.curve(ctx, [(x - 60, 590 - k * 6), (x - 20, 582 - k * 6), (x + 20, 594 - k * 6), (x + 60, 586 - k * 6)],
                        T("#b8442a"), 10)
        elif food == "pancakes":
            for k in range(5):
                D.ellipse(ctx, x, 590 - k * 12, 60, 10, T("#e0a24a"), INK, 2)
            D.ellipse(ctx, x, 532, 30, 8, T("#f6e0a0"), None, 0)
        elif food == "fruit":
            r = rng(3)
            for k in range(14):
                D.circle(ctx, x - 50 + (k % 5) * 25 + (k // 5) * 12, 580 - (k // 5) * 22, 13,
                         T(r.choice(["#e8423c", "#f2c230", "#3fbf6a", "#f2783a"])), INK, 2)
        else:
            D.poly(ctx, [(x - 60, 596), (x + 60, 596), (x + 50, 520), (x - 50, 520)], T("#f6dce8"), INK, 3, wob=0)
            D.circle(ctx, x, 510, 12, T("#e8423c"), INK, 2)
    # шоколадный фонтан
    D.rect(ctx, CHOCO_X - 70, 580, 140, 40, T("#c9d0d4"), INK, 3, wob=0)
    for k, w in enumerate((120, 90, 60)):
        y = 560 - k * 70
        D.ellipse(ctx, CHOCO_X, y, w, 16, T("#e8eef0"), INK, 3)
    D.line(ctx, CHOCO_X, 580, CHOCO_X, 380, INK, 10)
    D.line(ctx, CHOCO_X, 580, CHOCO_X, 380, T("#e8eef0"), 5)
    # мороженое
    D.rrect(ctx, ICE_X - 90, 380, 180, 240, 20, T("#f4f2ec"), INK, 4)
    D.rrect(ctx, ICE_X - 70, 400, 140, 60, 10, T("#f05a8a"), INK, 3)
    D.text(ctx, "SOFT SERVE", ICE_X, 440, 22, D.FONT_TITLE, T("#fff6d8"))
    for k, c in enumerate(("#f6e3c4", "#7a4a30", "#f08cb0")):
        D.rect(ctx, ICE_X - 55 + k * 40, 480, 26, 50, T("#c9d0d4"), INK, 2, wob=0)
        D.circle(ctx, ICE_X - 42 + k * 40, 476, 12, T(c), INK, 2)
    # столики
    _floor_tiles(ctx, -400, 3200, FL, T("#e8d8bc"), T("#dccaa8"))
    for x in (-200, 3000):
        table(ctx, x, FL + 40, T)


def chocolate_flow(ctx, t, power=1.0):
    """Струи шоколада (каждый кадр)."""
    if power <= 0:
        return
    c = hexrgb("#6b3a24")
    for k, w in enumerate((120, 90, 60)):
        y = 560 - k * 70
        D.ellipse(ctx, CHOCO_X, y - 6, w * 0.9, 9, c, None, 0)
        for j in range(8):
            a = j / 8 * TAU + t * 2
            x = CHOCO_X + math.cos(a) * w * 0.9
            if math.sin(a) < 0:
                continue
            D.line(ctx, x, y, x, y + 60, c, 7)
    D.line(ctx, CHOCO_X, 370, CHOCO_X, 390, c, 14)


def table(ctx, x, gy, T):
    D.ellipse(ctx, x, gy - 150, 140, 22, T("#ffffff"), INK, 3)
    D.line(ctx, x, gy - 140, x, gy, INK, 10)
    D.ellipse(ctx, x, gy, 60, 10, T("#8a96a0"), INK, 2)
    for k in (-1, 1):
        D.rect(ctx, x + k * 170 - 30, gy - 110, 60, 14, T("#16a39a"), INK, 2, wob=0)
        D.line(ctx, x + k * 170 - 20, gy - 96, x + k * 170 - 20, gy, INK, 5)
        D.line(ctx, x + k * 170 + 20, gy - 96, x + k * 170 + 20, gy, INK, 5)
        D.line(ctx, x + k * 200, gy - 110, x + k * 205, gy - 230, INK, 6)


def room_cart(ctx, x, gy, s=1.0, load=1.0, f=1, wobble=0.0):
    """Тележка рум-сервиса с едой."""
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(f * s, s)
    ctx.rotate(wobble)
    for wx in (-80, 80):
        D.circle(ctx, wx, -18, 18, hexrgb("#3a4048"), INK, 3)
    D.rect(ctx, -110, -60, 220, 20, hexrgb("#c9d0d4"), INK, 3, wob=0)
    D.rect(ctx, -110, -150, 220, 16, hexrgb("#c9d0d4"), INK, 3, wob=0)
    D.line(ctx, -105, -150, -105, -40, INK, 6)
    D.line(ctx, 105, -150, 105, -40, INK, 6)
    D.line(ctx, -105, -150, -150, -200, INK, 6)
    D.rect(ctx, -110, -134, 220, 74, hexrgb("#ffffff"), INK, 2, wob=0)
    if load > 0:
        D.ellipse(ctx, -50, -158, 50, 20, hexrgb("#e0a24a"), INK, 2)
        D.ellipse(ctx, -50, -170, 40, 12, hexrgb("#e0a24a"), INK, 2)
        for k in range(6):
            D.rrect(ctx, 10 + (k % 3) * 28, -182 + (k // 3) * 16, 22, 18, 5,
                    hexrgb(["#e8423c", "#f2c230", "#7a4fc2"][k % 3]), INK, 1.5)
        D.curve(ctx, [(-90, -160), (-70, -170), (-50, -158)], hexrgb("#b8442a"), 7)
    ctx.restore()


# --- Бордвок ----------------------------------------------------------------------------

CAROUSEL_X = 1500
ZIP = ((-300, -380), (3300, 520))      # тарзанка: верхняя и нижняя точки троса


def boardwalk(ctx, tod="night", power=1.0):
    T = lambda c: tone(c, tod if power <= 0 else ("day" if tod not in ("night", "deepnight") else "dusk"))
    lit = power > 0 and tod in ("night", "deepnight", "dusk")
    SEA.sky(ctx, -800, -1400, 4800, 900, tod)
    if tod in ("night", "deepnight"):
        SEA.stars(ctx, -800, -1400, 4800, 700, 0, 4, 0.7)
    # стены кают по бокам «каньона» — дальняя стена с балконами
    D.rect(ctx, -800, -600, 4800, 1500, T("#f2f4f4"), INK, 4, wob=0)
    r = rng(9)
    for k in range(9):
        y = -560 + k * 110
        for i in range(24):
            x = -760 + i * 200
            win = hexrgb("#ffd978") if (lit and r.random() < 0.5) else T("#9fd8ec")
            D.rect(ctx, x, y, 160, 70, win, INK, 2, wob=0)
            D.line(ctx, x, y + 40, x + 160, y + 40, T("#ffffff"), 3)
    # лавки
    shop(ctx, -300, "SWEET SPOT", "#f05a8a", T, lit)
    shop(ctx, 2550, "HOT DOGS", "#f2c230", T, lit)
    shop(ctx, 3350, "ARCADE", "#7a4fc2", T, lit)
    # гирлянды
    for x0 in range(-700, 3900, 500):
        for i in range(10):
            u = (i + 0.5) / 10
            px, py = x0 + 500 * u, 300 + math.sin(math.pi * u) * 50
            if lit:
                D.radial(ctx, px, py, 26, "#ffe08a", 0.5, 0)
            D.circle(ctx, px, py, 7, hexrgb("#fff2b0") if lit else T("#f6f0d8"), INK, 1.2)
    # пол-деревянный настил
    D.rect(ctx, -800, FL - 20, 4800, 600, T("#c99a62"), None, 0, wob=0)
    D.col(ctx, T("#a87a48"))
    ctx.set_line_width(3)
    for k in range(9):
        y = FL - 20 + k * k * 7
        ctx.move_to(-800, y)
        ctx.line_to(4000, y)
    ctx.stroke()
    D.line(ctx, -800, FL - 20, 4000, FL - 20, INK, 3)
    # трос тарзанки
    (zx0, zy0), (zx1, zy1) = ZIP
    D.rect(ctx, zx0 - 200, zy0 - 20, 260, 40, T("#c9d0d4"), INK, 4, wob=0)
    D.rect(ctx, zx1 - 40, zy1 - 10, 300, 40, T("#c9d0d4"), INK, 4, wob=0)
    D.line(ctx, zx0, zy0, zx1, zy1, INK, 5)


def shop(ctx, x, name, c, T, lit):
    D.rect(ctx, x - 250, 380, 500, 520, T("#fbf6ec"), INK, 4, wob=0)
    for k in range(10):
        D.poly(ctx, [(x - 260 + k * 52, 380), (x - 208 + k * 52, 380), (x - 208 + k * 52, 440), (x - 234 + k * 52, 470),
                     (x - 260 + k * 52, 440)], T(c) if k % 2 else T("#ffffff"), INK, 2, wob=0)
    D.rect(ctx, x - 200, 300, 400, 70, T(c), INK, 4, wob=0)
    D.text(ctx, name, x, 350, 40, D.FONT_TITLE, T("#fff6d8"))
    D.rect(ctx, x - 200, 500, 400, 260, hexrgb("#ffe7a8") if lit else T("#bfe6f2"), INK, 3, wob=0)
    if name == "SWEET SPOT":
        r = rng(5)
        for k in range(12):
            D.circle(ctx, x - 160 + (k % 6) * 64, 560 + (k // 6) * 90, 26, T(r.choice(["#e8423c", "#f2c230", "#3fbf6a",
                                                                                    "#f05a8a"])), INK, 2)


def carousel(ctx, t, x=CAROUSEL_X, gy=FL - 20, tod="night", power=1.0, spin=1.0):
    """Карусель: купол, столбики, лошадки вверх-вниз (каждый кадр)."""
    T = lambda c: tone(c, "dusk" if power > 0 else tod)
    lit = power > 0 and tod in ("night", "deepnight", "dusk")
    D.ellipse(ctx, x, gy - 20, 520, 50, T("#d23a3a"), INK, 4)
    D.rect(ctx, x - 40, gy - 560, 80, 540, T("#e9b949"), INK, 4, wob=0)
    cols = ["#e8423c", "#ffffff"]
    for k in range(12):
        a0 = k / 12
        D.poly(ctx, [(x, gy - 760), (x - 560 + a0 * 1120, gy - 560), (x - 560 + (a0 + 1 / 12) * 1120, gy - 560)],
               T(cols[k % 2]), INK, 3, wob=0)
    D.rect(ctx, x - 570, gy - 580, 1140, 50, T("#e9b949"), INK, 4, wob=0)
    for k in range(14):
        D.circle(ctx, x - 540 + k * 83, gy - 555, 9, hexrgb("#fff2b0") if lit else T("#f6f0d8"), INK, 2)
    D.circle(ctx, x, gy - 780, 22, T("#e9b949"), INK, 3)
    ph = t * 0.5 * spin
    items = []
    for k in range(8):
        a = (k / 8 + ph) % 1.0 * TAU
        items.append((math.sin(a), math.cos(a), k))
    items.sort(key=lambda v: v[1])
    for (sx, cz, k) in items:
        px = x + sx * 440
        up = math.sin(t * 2.2 * spin + k * 1.3) * 40
        D.line(ctx, px, gy - 530, px, gy - 40, T("#e9b949"), 8)
        horse(ctx, px, gy - 220 + up, 0.9 + 0.15 * cz, 1 if math.cos((k / 8 + ph) * TAU) > 0 else -1,
              T(["#ffffff", "#f2c230", "#f05a8a", "#2f8fd8"][k % 4]), alpha=0.55 + 0.45 * (cz + 1) / 2)


def horse(ctx, x, y, s, f, c, alpha=1.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(f * s, s)
    ctx.push_group()
    D.ellipse(ctx, 0, 0, 90, 40, c, INK, 4)
    D.poly(ctx, [(60, -20), (110, -110), (150, -100), (100, 10)], c, INK, 4, wob=0)
    D.ellipse(ctx, 140, -100, 36, 22, c, INK, 4, rot=0.4)
    for lx in (-60, -30, 40, 70):
        D.line(ctx, lx, 30, lx + (20 if lx > 0 else -20), 90, INK, 9)
    D.curve(ctx, [(-90, -10), (-130, 20), (-120, 60)], INK, 10)
    D.rect(ctx, -30, -50, 60, 30, hexrgb("#e8423c"), INK, 3, wob=0)
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(alpha)
    ctx.restore()


# --- казино -------------------------------------------------------------------------------

SLOT_X = 1100


def casino(ctx, power=1.0):
    D.rect(ctx, -600, -300, 3600, 1300, hexrgb("#3a1a3a"), None, 0, wob=0)
    for x in range(-600, 3000, 140):
        D.rect(ctx, x, -300, 70, 1200, hexrgb("#4a2248"), None, 0, wob=0)
    for x in (300, 1300, 2300):
        D.line(ctx, x, -300, x, -40, hexrgb("#e9b949"), 4)
        for k in range(3):
            D.ellipse(ctx, x, -40 + k * 30, 120 - k * 30, 16, hexrgb("#fff2b0"), INK, 2)
    D.rect(ctx, 700, 80, 800, 110, hexrgb("#e8423c"), INK, 5, wob=0)
    D.text(ctx, "CASINO ROYAL", 1100, 160, 64, D.FONT_TITLE, hexrgb("#ffe36a"))
    # ковёр
    D.rect(ctx, -600, FL - 10, 3600, 600, hexrgb("#a3262e"), None, 0, wob=0)
    r = rng(2)
    for k in range(80):
        x, y = r.uniform(-600, 3000), FL + r.uniform(0, 200)
        D.circle(ctx, x, y, 10, hexrgb("#e9b949"), None, 0, alpha=0.6)
    D.line(ctx, -600, FL - 10, 3000, FL - 10, INK, 3)
    # рулетка
    D.ellipse(ctx, 2300, FL - 230, 260, 40, hexrgb("#1f7a4a"), INK, 4)
    D.ellipse(ctx, 2300, FL - 250, 80, 30, hexrgb("#7a4a2a"), INK, 3)
    D.rect(ctx, 2100, FL - 230, 400, 220, hexrgb("#5a2a1a"), INK, 4, wob=0)
    for x in (-300, 200, 600, 1600, 2000):
        slot(ctx, x, FL - 10, 0.0, power)


def slot(ctx, x, gy, t=0.0, power=1.0, spin=0.0, win=False, s=1.0):
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.rrect(ctx, -110, -520, 220, 520, 30, hexrgb("#d23a3a"), INK, 5)
    D.rrect(ctx, -90, -560, 180, 70, 30, hexrgb("#e9b949"), INK, 4)
    D.text(ctx, "777", 0, -508, 44, D.FONT_TITLE, hexrgb("#d23a3a"))
    D.rect(ctx, -80, -440, 160, 120, hexrgb("#ffffff"), INK, 4, wob=0)
    syms = ["7", "★", "♦", "●"]
    for k in range(3):
        if spin > 0:
            for j in range(4):
                yy = -380 + ((t * 900 + j * 40 + k * 23) % 160) - 80
                D.text(ctx, syms[(j + k) % 4], -52 + k * 52, yy + 14, 34, D.FONT_TITLE, INK, alpha=0.4)
        else:
            D.text(ctx, "7" if win else syms[(k + int(x)) % 4], -52 + k * 52, -366, 44, D.FONT_TITLE,
                   hexrgb("#d23a3a") if win else INK)
    D.rect(ctx, -90, -300, 180, 60, hexrgb("#2b2f3a"), INK, 3, wob=0)
    D.line(ctx, 110, -400, 160, -470, INK, 8)
    D.circle(ctx, 162, -476, 18, hexrgb("#e8423c"), INK, 3)
    if power > 0:
        for k in range(8):
            on = (int(t * 8) + k) % 2 == 0
            D.circle(ctx, -90 + k * 26, -540, 6, hexrgb("#fff2b0") if on else hexrgb("#a88a3a"), None, 0)
    ctx.restore()


# --- марина -------------------------------------------------------------------------------

MARINA_DOOR = (1400, 2900)    # проём в корме


def marina(ctx, tod="morning", open_=1.0):
    T = lambda c: tone(c, tod)
    D.rect(ctx, -600, -200, 4000, 1300, T("#d8dee2"), None, 0, wob=0)
    for x in range(-600, 3400, 300):
        D.line(ctx, x, -200, x, FL, T("#c2cad0"), 6)
    D.rect(ctx, -400, 60, 700, 90, T("#16a39a"), INK, 4, wob=0)
    D.text(ctx, "MARINA", -50, 130, 64, D.FONT_TITLE, T("#fff6d8"))
    # стеллаж со спасжилетами
    for k in range(7):
        x = -450 + k * 110
        D.line(ctx, x, 300, x, 340, INK, 4)
        D.poly(ctx, [(x - 40, 340), (x + 40, 340), (x + 46, 470), (x - 46, 470)], T("#f2782e"), INK, 3, wob=0)
        D.rect(ctx, x - 46, 400, 92, 10, T("#f2f0e6"), None, 0, wob=0)
    # гидроциклы на подставках
    for k, c in enumerate(("#e8423c", "#f2c230", "#2f8fd8")):
        jetski(ctx, 450 + k * 330, FL - 70, 0.8, c, tod=tod)
        D.rect(ctx, 380 + k * 330, FL - 70, 140, 70, T("#8a96a0"), INK, 3, wob=0)


def marina_opening(ctx, t, tod="morning", sun=None):
    """Проём в корме с видом на океан (каждый кадр, до пола)."""
    x0, x1 = MARINA_DOOR
    ctx.save()
    ctx.rectangle(x0, 120, x1 - x0, FL - 120)
    ctx.clip()
    SEA.sky(ctx, x0, 0, x1 - x0, 520, tod)
    if sun:
        SEA.sun(ctx, *sun, tod)
    SEA.ocean(ctx, t, x0, x1, 520, FL + 300, tod, seed=11, sun_x=sun[0] if sun else None)
    ctx.restore()
    D.rect(ctx, x0, 120, x1 - x0, FL - 120, None, INK, 8, wob=0)
    # платформа-пандус
    D.poly(ctx, [(x0 - 100, FL), (x1 + 400, FL), (x1 + 400, FL + 40), (x0 - 100, FL + 40)], tone("#aeb6bc", tod), INK,
           4, wob=0)


def jetski(ctx, x, y, s, c="#e8423c", f=1, tilt=0.0, tod="day"):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(tilt)
    ctx.scale(f * s, s)
    col = tone(c, tod)
    D.poly(ctx, [(-180, 0), (160, 0), (230, -40), (200, -70), (40, -80), (-60, -110), (-170, -100), (-200, -40)],
           tone("#ffffff", tod), INK, 5, wob=0)
    D.poly(ctx, [(-180, -10), (170, -10), (220, -42), (-190, -50)], col, None, 0, wob=0)
    D.rrect(ctx, -150, -140, 160, 40, 18, tone("#2b2f3a", tod), INK, 4)
    D.line(ctx, 40, -90, 90, -170, INK, 8)
    D.line(ctx, 60, -175, 130, -165, INK, 10)
    ctx.restore()


# --- коридор экипажа I-95, кладовая, шахта ----------------------------------------------

def corridor(ctx, power=0.0, x0=-600, x1=4400):
    """Длинный служебный коридор: трубы, жёлтая полоса, двери."""
    wall = hexrgb("#c9ced2") if power > 0 else hexrgb("#7a8290")
    D.rect(ctx, x0, -200, x1 - x0, 1300, wall, None, 0, wob=0)
    for k, (y, w, c) in enumerate(((110, 26, "#c23b33"), (160, 20, "#2f6fb3"), (200, 30, "#8a96a0"))):
        D.rect(ctx, x0, y, x1 - x0, w, hexrgb(c), INK, 3, wob=0)
    for x in range(int(x0), int(x1), 400):
        D.rect(ctx, x + 20, 104, 30, 140, hexrgb("#5a6068"), INK, 2, wob=0)
    signs = ["I-95", "GALLEY", "STORES", "LAUNDRY", "I-95", "ENGINE"]
    for i, x in enumerate(range(int(x0) + 200, int(x1), 700)):
        D.rect(ctx, x - 150, 380, 300, 480, hexrgb("#9aa4ac"), INK, 4, wob=0)
        D.rect(ctx, x - 120, 300, 240, 56, hexrgb("#f2c230"), INK, 3, wob=0)
        D.text(ctx, signs[i % len(signs)], x, 340, 34, D.FONT_TITLE, INK)
        D.rect(ctx, x + 90, 600, 20, 50, hexrgb("#5a6068"), INK, 2, wob=0)
    D.rect(ctx, x0, FL - 10, x1 - x0, 600, hexrgb("#6a727a"), None, 0, wob=0)
    D.rect(ctx, x0, FL + 60, x1 - x0, 24, hexrgb("#f2c230"), None, 0, wob=0)
    D.line(ctx, x0, FL - 10, x1, FL - 10, INK, 3)
    for x in range(int(x0), int(x1), 500):
        D.rect(ctx, x + 200, 20, 120, 30, hexrgb("#fff6d8") if power > 0 else hexrgb("#e85a4a"), INK, 2, wob=0)


def storeroom(ctx, power=0.0):
    wall = hexrgb("#c9ced2") if power > 0 else hexrgb("#7a8290")
    D.rect(ctx, -400, -200, 3200, 1300, wall, None, 0, wob=0)
    r = rng(8)
    labels = ["PEACHES", "RICE", "CRACKERS", "BEANS", "TUNA", "SOUP"]
    for lv in range(5):
        y = 150 + lv * 150
        D.rect(ctx, -300, y + 110, 3000, 18, hexrgb("#8a96a0"), INK, 3, wob=0)
        x = -280
        while x < 2650:
            c = hexrgb(r.choice(["#e8423c", "#f2c230", "#3fbf6a", "#2f8fd8", "#f2783a", "#f05a8a"]))
            if r.random() < 0.6:
                for k in range(4):
                    D.rect(ctx, x + k * 30, y + 50, 28, 60, c, INK, 1.5, wob=0)
                    D.rect(ctx, x + k * 30, y + 66, 28, 18, hexrgb("#f4f2ec"), None, 0, wob=0)
                x += 130
            else:
                D.rect(ctx, x, y + 10, 150, 100, hexrgb("#c99a62"), INK, 2.5, wob=0)
                D.text(ctx, r.choice(labels), x + 75, y + 70, 22, D.FONT_TITLE, INK)
                x += 165
    for x in range(-300, 2800, 600):
        D.line(ctx, x, 150, x, FL, INK, 8)
    D.rect(ctx, -400, FL - 10, 3200, 500, hexrgb("#6a727a"), INK, 3, wob=0)


def shaft(ctx, x=960, top=-3000, bot=1200, power=0.0):
    """Аварийная шахта: узкий колодец с лестницей и номерами палуб."""
    wall = hexrgb("#a8b0b8") if power > 0 else hexrgb("#6a7280")
    D.rect(ctx, x - 1500, top, 3000, bot - top, hexrgb("#2b2f3a"), None, 0, wob=0)
    D.rect(ctx, x - 300, top, 600, bot - top, wall, INK, 5, wob=0)
    ladder(ctx, x, top, bot, "day", w=120, c="#e9b949")
    for k in range(14):
        y = bot - 300 - k * 300
        D.rect(ctx, x + 170, y - 30, 110, 60, hexrgb("#f2c230"), INK, 3, wob=0)
        D.text(ctx, str(2 + k), x + 225, y + 14, 40, D.FONT_TITLE, INK)
        D.rect(ctx, x - 290, y + 40, 580, 12, hexrgb("#5a6068"), None, 0, wob=0)


# --- каюта капитана -----------------------------------------------------------------------

SEXTANT_X = 1500


def cabin(ctx, tod="night", power=0.0):
    T = lambda c: tone(c, tod)
    D.rect(ctx, -400, -200, 3200, 1300, T("#e6d6bc"), None, 0, wob=0)
    for x in range(-400, 2800, 90):
        D.line(ctx, x, -200, x, FL, T("#d8c6a8"), 3)
    for x in (100, 2400):
        D.circle(ctx, x, 340, 120, T("#1a2a5a"), INK, 12)
        D.circle(ctx, x, 340, 120, None, T("#b07a3a"), 6)
    D.rect(ctx, SEXTANT_X - 220, 330, 440, 280, T("#7a4a2a"), INK, 5, wob=0)
    D.rect(ctx, SEXTANT_X - 190, 360, 380, 220, T("#bfe6f2"), INK, 3, wob=0, alpha=0.6)
    D.rect(ctx, SEXTANT_X - 260, 620, 520, 280, T("#8a5a3a"), INK, 5, wob=0)
    for k in range(2):
        D.rect(ctx, SEXTANT_X - 230, 650 + k * 120, 460, 100, T("#a86a3a"), INK, 3, wob=0)
        D.circle(ctx, SEXTANT_X, 700 + k * 120, 10, T("#e9b949"), INK, 2)
    D.rect(ctx, 600, 200, 300, 220, T("#a86a3a"), INK, 5, wob=0)
    D.rect(ctx, 620, 220, 260, 180, T("#2f8fd8"), None, 0, wob=0)
    D.poly(ctx, [(640, 380), (720, 280), (780, 340), (860, 260), (860, 380)], T("#3fbf6a"), None, 0, wob=0)
    D.rect(ctx, 1900, 640, 600, 260, T("#2f4a7a"), INK, 5, wob=0)
    D.rect(ctx, 1900, 600, 600, 60, T("#f4f2ec"), INK, 4, wob=0)
    _floor_tiles(ctx, -400, 2800, FL, T("#8a5a3a"), T("#7a4a2a"), 160)


def sextant(ctx, x, y, s=1.0, rot=0.0, tod="night"):
    brass = tone("#d9a43a", tod)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(s, s)
    ctx.move_to(0, -120)
    ctx.line_to(-90, 60)
    ctx.arc_negative(0, -120, 205, math.pi * 0.66, math.pi * 0.34)
    ctx.close_path()
    D.col(ctx, brass)
    ctx.fill_preserve()
    D.col(ctx, INK)
    ctx.set_line_width(5)
    ctx.stroke()
    ctx.save()
    ctx.move_to(0, -120)
    ctx.line_to(-90, 60)
    ctx.arc_negative(0, -120, 205, math.pi * 0.66, math.pi * 0.34)
    ctx.close_path()
    ctx.clip()
    D.circle(ctx, 0, -40, 70, tone("#3a2a14", tod), None, 0)
    ctx.restore()
    for k in range(12):
        a = math.pi * (0.36 + k * 0.025)
        D.line(ctx, math.cos(a) * 190, -120 + math.sin(a) * 190, math.cos(a) * 205, -120 + math.sin(a) * 205, INK, 2)
    D.line(ctx, 0, -120, 40, 80, INK, 8)
    D.rrect(ctx, -60, -140, 90, 34, 10, brass, INK, 4)
    D.circle(ctx, 0, -120, 12, shade(brass, 0.3), INK, 3)
    ctx.restore()


# --- детский клуб ----------------------------------------------------------------------

def kids_club(ctx):
    D.rect(ctx, -400, -200, 3200, 1300, hexrgb("#fff2a8"), None, 0, wob=0)
    for k in range(12):
        D.circle(ctx, -300 + k * 260, 120, 60, hexrgb(["#e8423c", "#2f8fd8", "#3fbf6a", "#f05a8a"][k % 4]), None, 0,
                 alpha=0.5)
    D.rect(ctx, 300, 60, 1000, 110, hexrgb("#2f8fd8"), INK, 4, wob=0)
    D.text(ctx, "KIDS CLUB", 800, 140, 70, D.FONT_TITLE, hexrgb("#fff6d8"))
    for k in range(9):
        x = 300 + k * 160
        D.line(ctx, x, 300, x, 340, INK, 4)
        sz = 1.0 - k * 0.07
        D.poly(ctx, [(x - 50 * sz, 340), (x + 50 * sz, 340), (x + 56 * sz, 340 + 150 * sz),
                     (x - 56 * sz, 340 + 150 * sz)], hexrgb("#f2782e"), INK, 3, wob=0)
        D.rect(ctx, x - 56 * sz, 400, 112 * sz, 10, hexrgb("#f2f0e6"), None, 0, wob=0)
    _floor_tiles(ctx, -400, 2800, FL, hexrgb("#7fd0ff"), hexrgb("#5fc0f0"))


# --- Ки-Уэст: радиорубка Долорес -------------------------------------------------------------

def dolores_room(ctx, tod="night", sunset=False):
    D.rect(ctx, -400, -200, 3200, 1300, hexrgb("#f6d8b0"), None, 0, wob=0)
    for x in range(-400, 2800, 120):
        D.rect(ctx, x, -200, 60, 1300, hexrgb("#f0cc9e"), None, 0, wob=0)
    # окно на пальмы
    D.rect(ctx, 1500, 120, 700, 480, hexrgb("#7a4a2a"), INK, 6, wob=0)
    ctx.save()
    ctx.rectangle(1520, 140, 660, 440)
    ctx.clip()
    SEA.sky(ctx, 1520, 140, 660, 440, "sunset" if sunset else tod)
    if tod in ("night", "deepnight"):
        SEA.stars(ctx, 1520, 140, 660, 300, 0, 5, 1.5)
        SEA.moon(ctx, 2050, 230, 36)
    SEA.ocean(ctx, 0, 1520, 2180, 470, 600, "sunset" if sunset else tod, seed=3)
    for px in (1600, 2100):
        D.line(ctx, px, 600, px + 30, 300, INK, 12)
        for k in range(6):
            a = -math.pi / 2 + (k - 2.5) * 0.6
            D.curve(ctx, [(px + 30, 300), (px + 30 + math.cos(a) * 70, 300 + math.sin(a) * 50 + 10),
                          (px + 30 + math.cos(a) * 140, 300 + math.sin(a) * 60 + 50)], INK, 10)
    ctx.restore()
    D.line(ctx, 1850, 120, 1850, 600, INK, 8)
    # полки с рациями
    D.rect(ctx, -300, 420, 1500, 20, hexrgb("#7a4a2a"), INK, 3, wob=0)
    for k in range(4):
        x = -260 + k * 360
        D.rrect(ctx, x, 300, 300, 120, 12, hexrgb(["#5a5f52", "#3a3f4a", "#6a4a3a", "#4a5a6a"][k]), INK, 4)
        D.rrect(ctx, x + 20, 320, 140, 50, 6, hexrgb("#1a2a1a"), INK, 2)
        for j in range(3):
            D.circle(ctx, x + 200 + j * 30, 345, 12, hexrgb("#c9c4b8"), INK, 2)
    # фото на стене: моряки, флаг
    for k, x in enumerate((-200, 200, 600)):
        D.rect(ctx, x, 40, 220, 180, hexrgb("#a86a3a"), INK, 4, wob=0)
        D.rect(ctx, x + 14, 54, 192, 152, hexrgb("#d8dee2") if k != 1 else hexrgb("#2f4a7a"), None, 0, wob=0)
        if k == 1:
            for j in range(5):
                D.rect(ctx, x + 14, 54 + j * 30, 192, 15, hexrgb("#d23a3a"), None, 0, wob=0)
        else:
            for j in range(3):
                D.circle(ctx, x + 60 + j * 50, 120, 18, hexrgb("#f3e6d6"), INK, 2)
                D.rect(ctx, x + 45 + j * 50, 70, 30, 14, hexrgb("#ffffff"), INK, 2, wob=0)
    # стол с главной рацией
    D.rect(ctx, -200, 700, 1700, 40, hexrgb("#8a5a3a"), INK, 4, wob=0)
    D.rect(ctx, -160, 740, 40, 160, hexrgb("#7a4a2a"), INK, 3, wob=0)
    D.rect(ctx, 1380, 740, 40, 160, hexrgb("#7a4a2a"), INK, 3, wob=0)
    D.rrect(ctx, 500, 520, 420, 180, 16, hexrgb("#5a5f52"), INK, 5)
    D.rrect(ctx, 530, 545, 220, 80, 8, hexrgb("#0e2a14"), INK, 3)
    D.text(ctx, "CH 16", 640, 600, 40, D.FONT_TITLE, hexrgb("#4cff8a"))
    for j in range(2):
        D.circle(ctx, 810 + j * 60, 585, 22, hexrgb("#c9c4b8"), INK, 3)
    # кружка и кактус
    D.rrect(ctx, 1050, 620, 70, 80, 10, hexrgb("#ffffff"), INK, 3)
    D.text(ctx, "NAVY", 1085, 670, 18, D.FONT_TITLE, hexrgb("#1c3f7c"))
    D.rect(ctx, 1200, 640, 80, 60, hexrgb("#c97a4a"), INK, 3, wob=0)
    D.rrect(ctx, 1220, 540, 40, 110, 20, hexrgb("#3fae4f"), INK, 3)
    # пол и коврик
    _floor_tiles(ctx, -400, 2800, FL, hexrgb("#c99a62"), hexrgb("#b88a52"), 140)
    D.ellipse(ctx, 1700, FL + 60, 320, 40, hexrgb("#16a39a"), INK, 3)
    # вентилятор
    D.line(ctx, 1000, -200, 1000, -20, INK, 6)


def fan(ctx, t, x=1000, y=-10):
    for k in range(4):
        a = t * 4 + k * math.pi / 2
        D.ellipse(ctx, x + math.cos(a) * 110, y + math.sin(a) * 12, 100, 14, hexrgb("#a86a3a"), INK, 3)
    D.circle(ctx, x, y, 22, hexrgb("#e9b949"), INK, 3)


# --- Майами: кухня мамы -------------------------------------------------------------------

def miami_kitchen(ctx):
    D.rect(ctx, -400, -200, 3200, 1300, hexrgb("#bfe8d8"), None, 0, wob=0)
    for x in range(-400, 2800, 80):
        for y in range(400, 640, 80):
            D.rect(ctx, x + 2, y + 2, 76, 76, hexrgb("#e8f6f0"), None, 0, wob=0)
    D.rect(ctx, -300, 100, 1200, 260, hexrgb("#f4f2ec"), INK, 4, wob=0)
    for k in range(4):
        D.rect(ctx, -280 + k * 300, 120, 280, 220, hexrgb("#f2c230"), INK, 3, wob=0)
    D.rect(ctx, -300, 640, 1400, 260, hexrgb("#f4f2ec"), INK, 4, wob=0)
    D.rect(ctx, -320, 620, 1440, 30, hexrgb("#e8423c"), INK, 4, wob=0)
    D.rect(ctx, 1400, 100, 600, 500, hexrgb("#7a4a2a"), INK, 6, wob=0)
    ctx.save()
    ctx.rectangle(1420, 120, 560, 460)
    ctx.clip()
    SEA.sky(ctx, 1420, 120, 560, 460, "night")
    SEA.stars(ctx, 1420, 120, 560, 460, 0, 9)
    for k in range(6):
        D.rect(ctx, 1440 + k * 90, 380 - (k % 3) * 60, 70, 300, hexrgb("#2a3060"), None, 0, wob=0)
        for j in range(5):
            D.rect(ctx, 1455 + k * 90, 400 - (k % 3) * 60 + j * 40, 14, 18, hexrgb("#ffd978"), None, 0, wob=0)
    ctx.restore()
    # рисунок Макса на холодильнике
    D.rrect(ctx, 2200, 100, 400, 800, 30, hexrgb("#f4f2ec"), INK, 5)
    D.rect(ctx, 2260, 200, 200, 160, hexrgb("#ffffff"), INK, 3, wob=0)
    D.poly(ctx, [(2280, 320), (2440, 320), (2420, 300), (2300, 300)], hexrgb("#2f8fd8"), INK, 2, wob=0)
    D.rect(ctx, 2340, 260, 60, 40, hexrgb("#ffffff"), INK, 2, wob=0)
    D.circle(ctx, 2420, 230, 16, hexrgb("#f2c230"), None, 0)
    _floor_tiles(ctx, -400, 2800, FL, hexrgb("#e8e2d0"), hexrgb("#d8d0b8"))


def phone(ctx, x, y, s=1.0, ang=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    D.rrect(ctx, -22, -40, 44, 80, 10, hexrgb("#2b2f3a"), INK, 3)
    D.rrect(ctx, -17, -32, 34, 62, 6, hexrgb("#7fd0ff"), None, 0)
    ctx.restore()


def walkie(ctx, x, y, s=1.0, ang=0.0, on=0.0, t=0.0):
    """Игрушечная рация Макса: жёлтая с синей антенной и наклейкой-звездой."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    D.line(ctx, 18, -40, 22, -110, INK, 9)
    D.line(ctx, 18, -40, 22, -110, hexrgb("#2f8fd8"), 5)
    D.circle(ctx, 22, -112, 7, hexrgb("#e8423c"), INK, 2)
    D.rrect(ctx, -32, -50, 64, 110, 14, hexrgb("#f2c230"), INK, 4)
    D.rrect(ctx, -22, -36, 44, 30, 6, hexrgb("#2b2f3a"), INK, 2)
    for k in range(3):
        D.line(ctx, -16, 10 + k * 10, 16, 10 + k * 10, INK, 3)
    D.poly(ctx, [(0, 34), (5, 44), (16, 45), (8, 52), (11, 63), (0, 57), (-11, 63), (-8, 52), (-16, 45), (-5, 44)],
           hexrgb("#e8423c"), INK, 1.5, wob=0)
    if on > 0:
        D.circle(ctx, -18, -48, 6, hexrgb("#4cff8a"), None, 0)
        for k in range(3):
            r = 30 + k * 26 + (t * 60) % 26
            ctx.arc(22, -112, r, -math.pi * 0.8, -math.pi * 0.2)
            D.col(ctx, INK, on * (1 - k / 3))
            ctx.set_line_width(4)
            ctx.stroke()
    ctx.restore()


def bottle(ctx, x, y, s=1.0, ang=0.0, letter=True):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    D.rrect(ctx, -30, -60, 60, 120, 20, hexrgb("#7fc8a8"), INK, 4, alpha=0.85)
    D.rect(ctx, -12, -96, 24, 40, hexrgb("#7fc8a8"), INK, 3, wob=0, alpha=0.85)
    D.rect(ctx, -10, -108, 20, 16, hexrgb("#a86a3a"), INK, 2, wob=0)
    if letter:
        D.rrect(ctx, -18, -40, 36, 80, 8, hexrgb("#f6eedd"), INK, 2)
        D.line(ctx, -10, -20, 10, -20, INK, 2)
        D.line(ctx, -10, -5, 10, -5, INK, 2)
    D.line(ctx, -18, -50, -18, 40, hexrgb("#ffffff"), 4, 0.6)
    ctx.restore()


# --- берег: пляж Майами и причал Ки-Уэста ---------------------------------------------------

def beach(ctx, t, tod="day"):
    SEA.sky(ctx, -600, -400, 3200, 900, tod)
    SEA.sun(ctx, 1900, 120, 60, tod)
    SEA.cloudbank(ctx, -400, 2600, 260, tod, seed=6, n=6)
    SEA.ocean(ctx, t, -600, 2600, 500, 760, tod, seed=4, sun_x=1900)
    # набегающая волна
    k = (math.sin(t * 1.2) + 1) / 2
    yy = 740 + k * 40
    D.poly(ctx, [(-600, 700), (2600, 700), (2600, yy), (-600, yy + 10)], hexrgb("#7fe0e8"), None, 0, wob=0)
    SEA.foam_line(ctx, -600, 2600, yy, t, 2, 0.9)
    D.poly(ctx, [(-600, yy + 6), (2600, yy - 6), (2600, 1400), (-600, 1400)], hexrgb("#f6dca0"), INK, 3, wob=0)
    r = rng(4)
    for kk in range(40):
        D.circle(ctx, r.uniform(-600, 2600), r.uniform(900, 1100), 3, hexrgb("#e0c080"), None, 0)
    for x in (-300, 2200):
        palm_pot(ctx, x, 1000, tod, 1.3, math.sin(t + x) * 0.3)
    umbrella(ctx, 1700, 980, hexrgb("#e8423c"), tod)


def keywest_porch(ctx, t, tod="day"):
    SEA.sky(ctx, -600, -400, 3200, 1000, tod)
    SEA.sun(ctx, 300, 140, 60, tod)
    SEA.cloudbank(ctx, -400, 2600, 280, tod, seed=11, n=6)
    SEA.ocean(ctx, t, -600, 2600, 560, 1000, tod, seed=9, sun_x=300)
    # домик в карибском стиле
    D.rect(ctx, 1300, 120, 1300, 800, hexrgb("#7fd0c8"), INK, 5, wob=0)
    D.poly(ctx, [(1250, 140), (1950, -120), (2650, 140)], hexrgb("#e8423c"), INK, 5, wob=0)
    for k in range(3):
        D.rect(ctx, 1400 + k * 380, 300, 220, 260, hexrgb("#ffffff"), INK, 4, wob=0)
        D.rect(ctx, 1420 + k * 380, 320, 180, 220, hexrgb("#2f8fd8"), None, 0, wob=0)
        D.rect(ctx, 1370 + k * 380, 300, 30, 260, hexrgb("#f2c230"), INK, 2, wob=0)
        D.rect(ctx, 1620 + k * 380, 300, 30, 260, hexrgb("#f2c230"), INK, 2, wob=0)
    D.rect(ctx, 1300, 620, 1300, 30, hexrgb("#ffffff"), INK, 3, wob=0)
    for x in range(1300, 2600, 60):
        D.line(ctx, x, 650, x, 900, hexrgb("#ffffff"), 8)
    D.line(ctx, 2450, 120, 2450, -60, INK, 6)
    D.line(ctx, 2450, -50, 2600, -120, INK, 3)          # антенна
    # причал
    D.rect(ctx, -600, 900, 3200, 500, hexrgb("#c99a62"), INK, 3, wob=0)
    D.col(ctx, hexrgb("#a87a48"))
    ctx.set_line_width(3)
    for x in range(-600, 2600, 90):
        ctx.move_to(x, 900)
        ctx.line_to(x - 20, 1400)
    ctx.stroke()
    palm_pot(ctx, 1100, 900, tod, 1.4, math.sin(t * 0.8) * 0.3)
