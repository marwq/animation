"""Открытые палубы: нос с вертолётной площадкой, крыло мостика снаружи, спортивная палуба со
скалодромом на трубе, верх трубы с латунным гудком, корма для рыбалки.
Пол открытых палуб OF = 880 (как у бассейна)."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1
from engine import draw as D
from .deck import tone, ladder, lifering, palm_pot

INK = D.INK
OF = 880


def railing(ctx, x0, x1, y, tod="day", h=110, glass=True):
    T = lambda c: tone(c, tod)
    if glass:
        D.rect(ctx, x0, y - h, x1 - x0, h, T("#bfe6f2"), None, 0, wob=0, alpha=0.45)
    D.line(ctx, x0, y - h, x1, y - h, INK, 12)
    D.line(ctx, x0, y - h, x1, y - h, T("#f4f6f6"), 7)
    for x in range(int(x0), int(x1), 120):
        D.line(ctx, x, y - h, x, y, INK, 8)
        D.line(ctx, x, y - h, x, y, T("#d8dee2"), 4)


# --- нос корабля ---------------------------------------------------------------------

BOW_TIP = 3300


def bow(ctx, tod="day", power=1.0, chains=True):
    """Носовая палуба: слева надстройка с окнами мостика, справа острый нос с ограждением.
    Вертолётная площадка в середине."""
    T = lambda c: tone(c, tod)
    # надстройка с мостиком слева
    D.rect(ctx, -900, -200, 1500, 1090, T("#f6f6f2"), INK, 4, wob=0)
    for k in range(6):
        y = 380 + k * 80
        for i in range(8):
            D.rect(ctx, -860 + i * 170, y, 140, 50, T("#9fd8ec"), INK, 2, wob=0)
    D.poly(ctx, [(-900, 80), (640, 80), (600, 260), (-900, 260)], T("#1f2c44"), INK, 4, wob=0)
    for k in range(6):
        D.line(ctx, -800 + k * 240, 80, -820 + k * 240, 260, INK, 6)
    D.rect(ctx, 600, 120, 220, 40, T("#f6f6f2"), INK, 4, wob=0)        # крыло
    D.rect(ctx, -900, -40, 1500, 30, T("#1c3f7c"), None, 0, wob=0)
    # палуба
    D.poly(ctx, [(600, OF - 110), (BOW_TIP, OF - 60), (BOW_TIP, OF + 400), (600, OF + 400)], T("#c9cfd4"), None, 0,
           wob=0)
    D.rect(ctx, 600, OF - 10, BOW_TIP - 600, 400, T("#aeb6bc"), None, 0, wob=0)
    D.col(ctx, T("#98a2aa"))
    ctx.set_line_width(3)
    for k in range(8):
        y = OF + 10 + k * k * 6
        ctx.move_to(600, y)
        ctx.line_to(BOW_TIP, y)
    ctx.stroke()
    # вертолётная площадка
    D.ellipse(ctx, 1700, OF + 90, 620, 90, T("#4a525c"), INK, 4)
    D.ellipse(ctx, 1700, OF + 90, 540, 74, None, T("#f2c230"), 8)
    D.text(ctx, "H", 1700, OF + 128, 110, D.FONT_TITLE, T("#f4f4f0"))
    # якорные цепи и брашпиль
    if chains:
        for cx in (2600, 2800):
            D.ellipse(ctx, cx, OF + 10, 70, 40, T("#3a4048"), INK, 3)
            D.ellipse(ctx, cx, OF - 2, 50, 26, T("#5a6068"), INK, 3)
        for k in range(14):
            D.ellipse(ctx, 2620 + k * 32, OF + 50 + math.sin(k) * 4, 16, 9, None, INK, 4)
    # ограждение носа
    railing(ctx, 600, BOW_TIP + 20, OF - 30, tod, h=120)
    D.poly(ctx, [(BOW_TIP - 40, OF - 150), (BOW_TIP + 160, OF - 230), (BOW_TIP + 180, OF + 60),
                 (BOW_TIP, OF + 400)], T("#f6f6f2"), INK, 4, wob=0)
    # флагшток
    D.line(ctx, BOW_TIP + 80, OF - 220, BOW_TIP + 80, OF - 520, INK, 6)


def flag(ctx, x, y, t, c="#2f8fd8", w=120, h=70, wind=1.0):
    """Развевающийся флаг (каждый кадр)."""
    pts_top, pts_bot = [], []
    for k in range(9):
        u = k / 8
        dy = math.sin(t * 6 * wind - u * 5) * 10 * u * wind
        pts_top.append((x + u * w, y + dy))
        pts_bot.append((x + u * w, y + h + dy))
    D.path(ctx, pts_top + pts_bot[::-1])
    D.col(ctx, hexrgb(c))
    ctx.fill_preserve()
    D.col(ctx, INK)
    ctx.set_line_width(3)
    ctx.stroke()


# --- крыло мостика снаружи (ночь, шторм) ---------------------------------------------

WING_Y = 420        # пол крыла
WING_X0, WING_X1 = 700, 1700


def wing(ctx, tod="night", power=0.0):
    """Крыло мостика: площадка с ограждением над пропастью вдоль борта; слева дверь и окна
    мостика, ниже — отвесный борт с балконами (по нему лезет пирамида)."""
    T = lambda c: tone(c, tod)
    # стена мостика
    D.rect(ctx, -600, -400, WING_X0 + 600, WING_Y + 400, T("#eef0f0"), INK, 4, wob=0)
    D.rect(ctx, -500, -200, 900, 260, T("#1f2c44") if power <= 0 else hexrgb("#6fa8c8"), INK, 5, wob=0)
    for k in range(4):
        D.line(ctx, -500 + k * 225, -200, -500 + k * 225, 60, INK, 8)
    D.rect(ctx, 480, 60, 200, WING_Y - 60, T("#d8dee2"), INK, 4, wob=0)
    D.circle(ctx, 580, 160, 40, T("#9fd8ec") if power > 0 else T("#2a3a5a"), INK, 5)
    # крыша мостика с люком
    D.rect(ctx, -600, -420, 1400, 30, T("#c9d0d4"), INK, 4, wob=0)
    D.rect(ctx, 200, -440, 140, 24, T("#2e3644"), INK, 3, wob=0)
    # площадка крыла
    D.rect(ctx, WING_X0 - 20, WING_Y, WING_X1 - WING_X0 + 20, 40, T("#c9d0d4"), INK, 4, wob=0)
    railing(ctx, WING_X0, WING_X1, WING_Y, tod, h=110, glass=False)
    D.line(ctx, WING_X1, WING_Y - 110, WING_X1, WING_Y + 40, INK, 10)
    # борт под крылом: обрыв вниз, ряды балконов
    D.rect(ctx, -600, WING_Y + 40, WING_X0 + 600, 1400, T("#e6e8ea"), INK, 4, wob=0)
    for k in range(10):
        y = WING_Y + 110 + k * 120
        for i in range(6):
            bx = -560 + i * 210
            D.rect(ctx, bx, y, 170, 80, T("#9fd8ec") if power <= 0 else hexrgb("#ffd978"), INK, 2, wob=0)
            D.line(ctx, bx, y + 40, bx + 170, y + 40, T("#ffffff"), 3)
    # крыло нависает: снизу тень и кронштейны
    for k in range(4):
        x = WING_X0 + 60 + k * 260
        D.poly(ctx, [(x, WING_Y + 40), (x + 30, WING_Y + 40), (WING_X0 - 10, WING_Y + 300)], T("#b8c0c6"), INK, 3,
               wob=0)


# --- спортивная палуба: скалодром на трубе ----------------------------------------------

WALL_X = (900, 1300)       # стена скалодрома
WALL_TOP = -620
HOLDS = []


def _holds():
    if HOLDS:
        return HOLDS
    r = rng(12)
    y = OF - 60
    k = 0
    while y > WALL_TOP + 60:
        x = lerp(WALL_X[0] + 60, WALL_X[1] - 60, 0.5 + 0.38 * math.sin(k * 1.9))
        HOLDS.append((x + r.uniform(-30, 30), y, r.choice(["#e8423c", "#f2c230", "#3fbf6a", "#2f8fd8", "#f05a8a",
                                                         "#7a4fc2"])))
        y -= r.uniform(55, 80)
        k += 1
    return HOLDS


def sports(ctx, tod="day"):
    T = lambda c: tone(c, tod)
    # труба
    D.poly(ctx, [(700, OF), (760, -1100), (2100, -1150), (2200, OF)], T("#f6f6f2"), INK, 5, wob=0)
    D.rect(ctx, 700, -1100, 1600, 160, T("#1c3f7c"), None, 0, wob=0)
    D.rect(ctx, 700, -940, 1600, 18, T("#e9b949"), None, 0, wob=0)
    D.text(ctx, "SEA EMPRESS", 1650, -500, 90, D.FONT_TITLE, T("#1c3f7c"))
    # стена скалодрома
    x0, x1 = WALL_X
    D.poly(ctx, [(x0, OF), (x0 - 30, WALL_TOP), (x1 + 30, WALL_TOP - 20), (x1, OF)], T("#6a7a8c"), INK, 5, wob=0)
    D.col(ctx, T("#5a6a7c"))
    ctx.set_line_width(3)
    for k in range(10):
        y = OF - k * (OF - WALL_TOP) / 10
        ctx.move_to(x0 - 3 * k, y)
        ctx.line_to(x1 + 3 * k, y - 2 * k)
    ctx.stroke()
    for (hx, hy, c) in _holds():
        D.blob(ctx, [(hx - 16, hy), (hx - 6, hy - 14), (hx + 14, hy - 10), (hx + 16, hy + 6), (hx, hy + 12)],
               T(c), INK, 3)
    # площадка наверху
    D.rect(ctx, x0 - 60, WALL_TOP - 40, x1 - x0 + 120, 26, T("#c9d0d4"), INK, 4, wob=0)
    railing(ctx, x0 - 60, x1 + 60, WALL_TOP - 40, tod, h=80, glass=False)
    # мини-гольф и сетка баскетбола
    D.rect(ctx, -900, OF - 400, 1500, 400, T("#c9d0d4"), None, 0, wob=0, alpha=0.0)
    D.rect(ctx, 2300, OF - 320, 900, 320, T("#2b2f3a"), None, 0, wob=0, alpha=0.15)
    D.col(ctx, T("#4a525c"), 0.6)
    ctx.set_line_width(2)
    for x in range(2300, 3200, 40):
        ctx.move_to(x, OF - 320)
        ctx.line_to(x, OF)
    for y in range(int(OF - 320), OF, 40):
        ctx.move_to(2300, y)
        ctx.line_to(3200, y)
    ctx.stroke()
    D.line(ctx, 2900, OF, 2900, OF - 420, INK, 10)
    D.rect(ctx, 2840, OF - 500, 140, 90, T("#ffffff"), INK, 4, wob=0)
    D.ellipse(ctx, 2860, OF - 400, 40, 10, None, T("#e8423c"), 6)
    # пол: зелёное покрытие
    D.rect(ctx, -1200, OF, 4800, 500, T("#3fae6a"), None, 0, wob=0)
    D.col(ctx, T("#ffffff"))
    ctx.set_line_width(5)
    ctx.move_to(-1200, OF + 60)
    ctx.line_to(3600, OF + 60)
    ctx.stroke()
    D.line(ctx, -1200, OF, 3600, OF, INK, 3)
    # гольф
    D.ellipse(ctx, -300, OF + 120, 300, 40, T("#5fce7a"), INK, 3)
    D.line(ctx, -200, OF + 120, -200, OF - 60, INK, 5)
    D.poly(ctx, [(-200, OF - 60), (-120, OF - 40), (-200, OF - 20)], T("#e8423c"), INK, 2, wob=0)
    railing(ctx, -1200, 650, OF, tod, h=110)
    railing(ctx, 2250, 3600, OF, tod, h=110)
    for x in (-800, 2400):
        lifering(ctx, x + 60, OF - 55, tod)


# --- верх трубы с латунным гудком -------------------------------------------------------

FTOP = 600     # площадка на трубе


def funnel_top(ctx, tod="night", power=0.0):
    """Площадка наверху трубы: перила, латунный гудок с цепью; внизу далеко — палубы."""
    T = lambda c: tone(c, tod)
    D.rect(ctx, -300, FTOP, 2600, 600, T("#e8ecef"), INK, 5, wob=0)
    D.rect(ctx, -300, FTOP + 120, 2600, 140, T("#1c3f7c"), None, 0, wob=0)
    D.rect(ctx, -300, FTOP + 260, 2600, 18, T("#e9b949"), None, 0, wob=0)
    D.rect(ctx, -300, FTOP - 20, 2600, 30, T("#c9d0d4"), INK, 4, wob=0)
    railing(ctx, -300, 2300, FTOP - 20, tod, h=100, glass=False)
    horn(ctx, 1300, FTOP - 20, 1.0, tod)


def horn(ctx, x, gy, s=1.0, tod="night", chain_pull=0.0, blast=0.0):
    """Латунный гудок на стойке: раструб влево-вверх, цепь с ручкой свисает."""
    T = lambda c: tone(c, tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.rect(ctx, -20, -260, 40, 260, T("#5a6068"), INK, 4, wob=0)
    brass = T("#d9a43a")
    D.poly(ctx, [(-10, -300), (-260, -380), (-300, -250), (-10, -250)], brass, INK, 5, wob=0)
    D.ellipse(ctx, -280, -315, 30, 70, shade(brass, -0.25), INK, 5, rot=0.25)
    D.ellipse(ctx, -280, -315, 18, 48, hexrgb("#3a2a14"), None, 0, rot=0.25)
    D.rrect(ctx, -20, -320, 90, 80, 14, brass, INK, 5)
    D.line(ctx, -150, -360, 20, -300, shade(brass, 0.3), 4)
    # цепь
    py = -230 + chain_pull * 60
    for k in range(10):
        D.ellipse(ctx, 70, -240 + k * 18 * (1 + chain_pull * 0.4), 6, 10, None, INK, 3)
    D.rrect(ctx, 50, -240 + 190 * (1 + chain_pull * 0.4) - 20 + py * 0, 40, 30, 8, T("#c23b33"), INK, 3)
    if blast > 0:
        for k in range(4):
            r = 60 + k * 80 + blast * 60
            ctx.arc(-300, -320, r, math.pi * 0.75, math.pi * 1.25)
            D.col(ctx, (1, 1, 1), 0.7 * blast * (1 - k / 4))
            ctx.set_line_width(10)
            ctx.stroke()
    ctx.restore()


def deck_far_below(ctx, t, tod="night", crowd=None, seed=5):
    """Вид с трубы вниз: палуба в перспективе далеко внизу с крошечными зомби."""
    T = lambda c: tone(c, tod)
    D.rect(ctx, -2000, 0, 6000, 2000, T("#c08a52"), None, 0, wob=0)
    D.rrect(ctx, 300, 300, 900, 260, 40, T("#33c9e0"), INK, 4)
    D.rrect(ctx, 1500, 260, 380, 300, 40, T("#33c9e0"), INK, 4)
    r = rng(seed)
    for i in range(14):
        D.circle(ctx, r.uniform(-1500, 3500), r.uniform(100, 900), 40,
                 T(r.choice(["#e8423c", "#f2c230", "#2f8fd8", "#f05a8a"])), INK, 3)
    if crowd:
        for (x, y, c) in crowd:
            D.circle(ctx, x + math.sin(t * 2 + x) * 6, y + math.cos(t * 1.7 + y) * 4, 13, c, INK, 2)
