"""Интерьеры Liberty Mall: вход изнутри, атриум, галерея магазинов, фудкорт, лифт, карта, эскалатор."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1
from engine import draw as D
from . import common as C

INK = D.INK
WALL = hexrgb("#ddd0b6")
WALL_D = hexrgb("#cdbfa3")
CEIL = hexrgb("#6e6a74")
TEAL = hexrgb("#3f8a84")
NAVY = hexrgb("#2f3d5c")
FLOOR = hexrgb("#e6d8bc")

# --- вход изнутри --------------------------------------------------------------

ENT_FLOOR = 770       # линия пола у стеклянной стены
ENT_DOOR_X = 960
ENT_TOP = 215


def entrance_outside(ctx, tod="dusk", lit=0.0, x0=-600, x1=2520):
    """Что видно сквозь стекло: небо, дома, улица (рисуется до толпы и стекла)."""
    C.sky(ctx, x0, 0, x1 - x0, ENT_FLOOR, tod, moon=(1420, 300, 34) if tod in ("night", "deepnight") else None)
    C.skyline(ctx, x0, x1, 560, tod, depth=0, seed=4, lit=lit * 0.5, hmin=110, hmax=250)
    C.skyline(ctx, x0, x1, 640, tod, depth=1, seed=8, lit=lit, hmin=80, hmax=200)
    road = hexrgb("#3f3e4a") if tod not in ("day", "morning", "overcast") else hexrgb("#8a8884")
    D.rect(ctx, x0, 640, x1 - x0, ENT_FLOOR - 640, road, None, 0, wob=0)
    D.col(ctx, "#e8e2c8", 0.6)
    for k in range(int((x1 - x0) / 200)):
        ctx.rectangle(x0 + k * 200, 700, 110, 6)
    ctx.fill()
    D.rect(ctx, x0, 735, x1 - x0, ENT_FLOOR - 735, hexrgb("#9c968a"), None, 0, wob=0)


def entrance_glass(ctx, doors_open=0.0, sensor=1.0, tint=0.30, x0=-600, x1=2520, broken=False):
    """Стеклянная стена со стойками и раздвижными дверями (поверх улицы и толпы)."""
    D.col(ctx, "#9fb6c2", tint)
    ctx.rectangle(x0, ENT_TOP, x1 - x0, ENT_FLOOR - ENT_TOP)
    ctx.fill()
    # стойки
    x = x0
    while x <= x1:
        if abs(x - ENT_DOOR_X) > 200:
            D.rect(ctx, x - 9, ENT_TOP, 18, ENT_FLOOR - ENT_TOP, hexrgb("#5d5a58"), INK, 2.5, wob=0)
        x += 240
    D.rect(ctx, x0, ENT_TOP + 250, x1 - x0, 12, hexrgb("#5d5a58"), INK, 2, wob=0)
    # блики
    ctx.save()
    ctx.rectangle(x0, ENT_TOP, x1 - x0, ENT_FLOOR - ENT_TOP)
    ctx.clip()
    D.col(ctx, "#ffffff", 0.08)
    for k in range(-3, 12):
        gx = k * 260
        ctx.move_to(gx, ENT_FLOOR)
        ctx.line_to(gx + 60, ENT_FLOOR)
        ctx.line_to(gx + 300, ENT_TOP)
        ctx.line_to(gx + 240, ENT_TOP)
        ctx.close_path()
    ctx.fill()
    ctx.restore()
    # дверной портал
    dx0, dx1 = ENT_DOOR_X - 200, ENT_DOOR_X + 200
    dtop = ENT_FLOOR - 400
    D.rect(ctx, dx0 - 14, dtop - 40, (dx1 - dx0) + 28, 40, hexrgb("#4a4744"), INK, 3, wob=0.3)
    D.rect(ctx, dx0 - 14, dtop - 40, 16, 440, hexrgb("#4a4744"), INK, 3, wob=0)
    D.rect(ctx, dx1 - 2, dtop - 40, 16, 440, hexrgb("#4a4744"), INK, 3, wob=0)
    # датчик
    D.rect(ctx, ENT_DOOR_X - 32, dtop - 78, 64, 34, hexrgb("#2a2a30"), INK, 3, wob=0)
    D.circle(ctx, ENT_DOOR_X + 18, dtop - 61, 5, mix(hexrgb("#4a3a3a"), hexrgb("#ff5a4a"), sensor), None, 0)
    # створки
    op = clamp(doors_open) * 190
    for side in (-1, 1):
        x_ = ENT_DOOR_X - 200 - op if side < 0 else ENT_DOOR_X + op
        D.col(ctx, "#a9c2cc", 0.22)
        ctx.rectangle(x_ + 4, dtop, 196, 400)
        ctx.fill()
        D.rect(ctx, x_ + 4, dtop, 196, 400, None, hexrgb("#5d5a58"), 7, wob=0)
        D.rect(ctx, x_ + 4, dtop, 196, 400, None, INK, 2, wob=0)
        D.line(ctx, x_ + 40, dtop + 170, x_ + 160, dtop + 170, hexrgb("#d9d2c2"), 4)
    if broken:
        D.col(ctx, INK)
        ctx.set_line_width(2)
        cx, cy = ENT_DOOR_X - 90, dtop + 160
        for k in range(9):
            a = k * TAU / 9 + 0.3
            ctx.move_to(cx, cy)
            ctx.line_to(cx + math.cos(a) * 90, cy + math.sin(a) * 90)
        ctx.stroke()


def entrance_interior(ctx, tod="dusk", lights=1.0, x0=-600, x1=2520):
    """Потолок, баннер и пол — рисуется после стекла."""
    D.rect(ctx, x0, 0, x1 - x0, ENT_TOP, shade(CEIL, -0.1 * (1 - lights)), INK, 3, wob=0)
    C.ceiling_lights(ctx, x0 + 80, x1, 60, 380, 170, lights)
    D.rect(ctx, x0, ENT_TOP - 70, x1 - x0, 70, TEAL, INK, 3, wob=0.4)
    D.text(ctx, "WELCOME TO LIBERTY MALL  •  OPEN 10 AM - 10 PM  •  WELCOME TO LIBERTY MALL",
           ENT_DOOR_X, ENT_TOP - 22, 30, D.FONT_TITLE, hexrgb("#f4ecd9"))
    C.tiles_floor(ctx, x0, ENT_FLOOR, x1, 1500, ENT_DOOR_X, 420, rows=7)
    # коврик
    D.poly(ctx, [(ENT_DOOR_X - 230, ENT_FLOOR + 6), (ENT_DOOR_X + 230, ENT_FLOOR + 6),
                 (ENT_DOOR_X + 300, ENT_FLOOR + 70), (ENT_DOOR_X - 300, ENT_FLOOR + 70)],
           hexrgb("#6e5a52"), INK, 2.5, seed=4)
    D.line(ctx, x0, ENT_FLOOR, x1, ENT_FLOOR, INK, 3)


# реквизит для баррикады ---------------------------------------------------------

def gumball(ctx, x, y, s=1.0, tilt=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(tilt)
    ctx.scale(s, s)
    D.rect(ctx, -40, -120, 80, 120, hexrgb("#c23b33"), INK, 3, seed=1)
    D.rect(ctx, -12, -70, 24, 20, hexrgb("#d9d2c2"), INK, 2, wob=0)
    D.circle(ctx, 0, -190, 75, hexrgb("#d6e6ec"), INK, 3)
    r = rng(5)
    cols = ["#e2a33b", "#3f8a84", "#c23b33", "#7a6aa3", "#f0ece0", "#6fa75a"]
    ctx.save()
    ctx.arc(0, -190, 72, 0, TAU)
    ctx.clip()
    for k in range(40):
        a, rr = r.random() * TAU, r.random() ** 0.5 * 64
        bx, by = math.cos(a) * rr, -190 + abs(math.sin(a)) * rr * 0.9 + 10
        D.circle(ctx, bx, by, 11, hexrgb(r.choice(cols)), INK, 1.5)
    ctx.restore()
    D.rect(ctx, -30, -275, 60, 20, hexrgb("#c23b33"), INK, 3, wob=0)
    ctx.restore()


def massage_chair(ctx, x, y, s=1.0, tilt=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(tilt)
    ctx.scale(s, s)
    c = hexrgb("#4a4e5a")
    D.poly(ctx, [(-70, 0), (-80, -80), (-90, -230), (-40, -250), (-20, -110), (80, -110), (90, -60), (70, 0)],
           c, INK, 3, seed=3)
    D.rect(ctx, -60, -130, 140, 40, shade(c, 0.15), INK, 3)
    D.rect(ctx, 40, -160, 50, 30, shade(c, -0.1), INK, 2.5)
    D.text(ctx, "RELAX $2", 0, -30, 18, D.FONT_TITLE, hexrgb("#e2a33b"))
    ctx.restore()


def vending(ctx, x, y, s=1.0, tilt=0.0, lit=1.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(tilt)
    ctx.scale(s, s)
    D.rect(ctx, -70, -260, 140, 260, hexrgb("#2f6f9a"), INK, 3, seed=6)
    D.rect(ctx, -58, -245, 90, 200, mix(hexrgb("#3a3a40"), hexrgb("#dfe8ec"), lit), INK, 2, wob=0)
    r = rng(2)
    for i in range(4):
        for j in range(5):
            D.rect(ctx, -52 + i * 21, -238 + j * 38, 15, 26, hexrgb(r.choice(["#c23b33", "#e2a33b", "#3f8a84", "#f0ece0"])),
                   INK, 1, wob=0)
    D.rect(ctx, 40, -200, 22, 60, hexrgb("#1f2a33"), INK, 2, wob=0)
    ctx.restore()


# --- атриум ----------------------------------------------------------------------

AT_LEVELS = [2600, 2120, 1640, 1160, 680]   # пол 1–5 этажа
AT_W = 1920


def atrium(ctx, tod="day", lights=1.0, fountain=1.0, gates=None, coins=True):
    """Атриум сбоку-спереди: пять этажей, балконы, эскалаторы, стеклянная крыша, фонтан."""
    night = tod in ("night", "deepnight", "storm", "dusk")
    # стеклянная крыша
    C.sky(ctx, -300, -200, AT_W + 600, 760, tod, moon=(1500, 160, 36) if night and tod != "dusk" else None,
          sun=None)
    D.col(ctx, INK)
    ctx.set_line_width(5)
    for k in range(-2, 14):
        ctx.move_to(-300 + k * 180, -200)
        ctx.line_to(-300 + k * 180 + 90, 560)
    for j in range(5):
        y = -200 + j * 150
        ctx.move_to(-300, y)
        ctx.line_to(AT_W + 300, y)
    ctx.stroke()
    D.rect(ctx, -300, 520, AT_W + 600, 60, CEIL, INK, 4, wob=0.5)
    # этажи
    store_cols = ["#b6503f", "#3f8a84", "#e2a33b", "#7a6aa3", "#5f8a5a", "#2f3d5c", "#c9805a", "#8a6a52"]
    names = [["PAWS & CLAWS", "NOVA TECH", "BELLA SHOES", "TOY TOWN"],
             ["GALAXY ARCADE", "BOUNCE NYC", "BOWL-O-RAMA", "PARTY PLANET"],
             ["FOOD COURT", "PRETZEL PALACE", "NOODLE BAR", "PIZZA 34"],
             ["SLEEP KINGDOM", "BIG APPLE SPORTS", "UPTOWN STYLE", "BOOK NOOK"],
             ["CINEMA 8", "CINEMA 8", "ROOF ACCESS", "STAFF ONLY"]]
    for lv, fy in enumerate(AT_LEVELS):
        top = fy - 420 if lv < 4 else fy - 420
        D.rect(ctx, -300, top, AT_W + 600, fy - top, WALL if lv % 2 == 0 else WALL_D, None, 0, wob=0)
        for i in range(4):
            sx = 60 + i * 470
            col = hexrgb(store_cols[(lv * 3 + i) % len(store_cols)])
            D.rect(ctx, sx, fy - 330, 400, 330, mix(hexrgb("#5a5866"), hexrgb("#f1dcae"), lights * 0.8), INK, 3,
                   seed=lv * 10 + i)
            C.sign(ctx, sx + 20, fy - 395, 360, 50, names[4 - lv][i] if lv < 5 else "", bg=col, seed=lv * 9 + i)
            g = (gates or {}).get(names[4 - lv][i], 1.0)
            C.shutter(ctx, sx, fy - 330, 400, 330, g, seed=lv * 5 + i)
        # колонны
        for cx in (-120, 1880):
            D.rect(ctx, cx, top, 80, fy - top, shade(WALL, -0.08), INK, 3, wob=0.5)
        # плита балкона
        D.rect(ctx, -300, fy - 6, AT_W + 600, 40, shade(WALL, -0.18), INK, 3.5, wob=0.6, seed=lv)
        if lv > 0:
            C.railing(ctx, -300, AT_W + 300, fy - 6, 95)
    # эскалаторы между этажами
    for lv in range(4):
        y0, y1 = AT_LEVELS[lv], AT_LEVELS[lv + 1]
        if lv % 2 == 0:
            escalator_band(ctx, 230, y0 - 4, 760, y1 + 26, width=58)
        else:
            escalator_band(ctx, 1690, y0 - 4, 1160, y1 + 26, width=58)
    # фонтан
    fy = AT_LEVELS[0]
    D.ellipse(ctx, 960, fy + 60, 330, 60, hexrgb("#a9a297"), INK, 3)
    D.ellipse(ctx, 960, fy + 48, 300, 48, hexrgb("#6c9fae") if fountain > 0 else hexrgb("#8a8f8f"), INK, 2.5)
    if coins:
        r = rng(9)
        for k in range(40):
            a, rr = r.random() * TAU, r.random() ** 0.5
            D.circle(ctx, 960 + math.cos(a) * rr * 260, fy + 48 + math.sin(a) * rr * 38, 4,
                     hexrgb("#d6b24c"), None, 0)
    D.rect(ctx, 930, fy - 70, 60, 110, hexrgb("#a9a297"), INK, 3)
    D.ellipse(ctx, 960, fy - 70, 90, 18, hexrgb("#a9a297"), INK, 3)


def fountain_water(ctx, t, on=1.0, fy=AT_LEVELS[0]):
    if on <= 0:
        return
    D.col(ctx, "#d4ebf2", 0.7 * on)
    ctx.set_line_width(4)
    for k in range(7):
        a = -math.pi / 2 + (k - 3) * 0.28
        ph = (t * 1.3 + k * 0.17) % 1.0
        ctx.move_to(960, fy - 85)
        ctx.curve_to(960 + math.cos(a) * 80, fy - 200 - 30 * math.sin(ph * TAU), 960 + math.cos(a) * 180,
                     fy - 160, 960 + math.cos(a) * 230, fy + 30)
    ctx.stroke()


def escalator_band(ctx, x0, y0, x1, y1, width=60, steps=True):
    """Эскалатор как наклонная лента (вид сбоку)."""
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy)
    nx, ny = -dy / L * width, dx / L * width
    side = hexrgb("#8f8a80")
    D.poly(ctx, [(x0, y0), (x1, y1), (x1 + nx * 0.0, y1 + 70), (x0, y0 + 70)], side, INK, 3, seed=int(x0))
    D.poly(ctx, [(x0, y0), (x1, y1), (x1, y1 + 16), (x0, y0 + 16)], hexrgb("#4a4744"), INK, 2.5, wob=0.2)
    if steps:
        D.col(ctx, hexrgb("#6a665f"))
        ctx.set_line_width(2)
        n = int(L / 26)
        for k in range(n):
            f = k / n
            px, py = x0 + dx * f, y0 + dy * f
            ctx.move_to(px, py + 16)
            ctx.line_to(px, py + 34)
        ctx.stroke()
    # поручень
    D.line(ctx, x0, y0 - 50, x1, y1 - 50, INK, 9)
    D.line(ctx, x0, y0 - 50, x1, y1 - 50, hexrgb("#2b2b2e"), 6)
    D.col(ctx, "#b9cdd2", 0.3)
    ctx.move_to(x0, y0 - 50)
    ctx.line_to(x1, y1 - 50)
    ctx.line_to(x1, y1)
    ctx.line_to(x0, y0)
    ctx.close_path()
    ctx.fill()


# --- галерея магазинов (боковой проход) ---------------------------------------

GAL_FLOOR = 860
STORES = [
    ("PRETZEL PALACE", "#c9805a", "food"), ("BELLA SHOES", "#b6503f", "shoes"), ("NOVA TECH", "#2f3d5c", "tv"),
    ("PAWS & CLAWS", "#5f8a5a", "pets"), ("UPTOWN STYLE", "#7a6aa3", "clothes"), ("TOY TOWN", "#e2a33b", "toys"),
    ("PARTY PLANET", "#c23b6a", "party"), ("BIG APPLE SPORTS", "#3f8a84", "sports"),
    ("SLEEP KINGDOM", "#4a6a9a", "beds"), ("BOOK NOOK", "#8a6a52", "books"),
]


def gallery(ctx, x0=-200, x1=6000, tod="day", lights=1.0, gates=None, store_w=560, start=0, stores=None):
    """Ряд магазинов сбоку. gates: {имя: доля закрытия}. Возвращает {имя: (x, w)}."""
    stores = stores or STORES
    D.rect(ctx, x0, 0, x1 - x0, 200, CEIL, None, 0, wob=0)
    C.ceiling_lights(ctx, x0 + 40, x1, 150, 420, 170, lights)
    D.rect(ctx, x0, 190, x1 - x0, GAL_FLOOR - 190, WALL, None, 0, wob=0)
    D.line(ctx, x0, 196, x1, 196, INK, 3)
    out = {}
    x = x0 + 120
    i = start
    while x < x1 - 100:
        name, col, kind = stores[i % len(stores)]
        out[name] = (x, store_w)
        storefront(ctx, x, GAL_FLOOR, store_w, name, col, kind, lights, (gates or {}).get(name, 0.0), seed=i)
        x += store_w + 140
        # колонна между магазинами
        D.rect(ctx, x - 110, 196, 80, GAL_FLOOR - 196, shade(WALL, -0.07), INK, 3, wob=0.5, seed=i * 3)
        i += 1
    # пол
    D.rect(ctx, x0, GAL_FLOOR, x1 - x0, 400, FLOOR, None, 0, wob=0)
    D.col(ctx, hexrgb("#d2c3a4"))
    ctx.set_line_width(2)
    for k in range(5):
        y = GAL_FLOOR + 18 + k * k * 9
        ctx.move_to(x0, y)
        ctx.line_to(x1, y)
    ctx.stroke()
    D.line(ctx, x0, GAL_FLOOR, x1, GAL_FLOOR, INK, 3)
    return out


def storefront(ctx, x, floor, w, name, col, kind, lights=1.0, gate=0.0, seed=0):
    h = 470
    top = floor - h
    col = hexrgb(col)
    D.rect(ctx, x - 10, top - 90, w + 20, 80, col, INK, 3.5, wob=0.6, seed=seed)
    C.sign(ctx, x + 30, top - 78, w - 60, 56, name, bg=shade(col, -0.18), seed=seed + 1, lw=2.5)
    inside = mix(hexrgb("#55525e"), hexrgb("#f3e1b8"), lights * 0.85)
    D.rect(ctx, x, top, w, h, inside, INK, 3, wob=0.5, seed=seed + 2)
    display(ctx, x, floor, w, h, kind, seed)
    C.glass(ctx, x, top, w, h, alpha=0.12, frame=False)
    D.rect(ctx, x, top, w, h, None, hexrgb("#5d5a58"), 8, wob=0)
    D.rect(ctx, x, top, w, h, None, INK, 2.5, wob=0)
    if gate > 0:
        C.shutter(ctx, x, top, w, h, gate, seed=seed)


def display(ctx, x, floor, w, h, kind, seed=0):
    r = rng(seed + 100)
    top = floor - h
    if kind == "tv":
        for i in range(3):
            for j in range(2):
                D.rect(ctx, x + 40 + i * (w - 80) / 3, top + 60 + j * 150, (w - 80) / 3 - 20, 110,
                       hexrgb(r.choice(["#3a5a7a", "#5a7a9a", "#2a3a5a"])), INK, 3, wob=0)
    elif kind == "shoes":
        for j in range(3):
            D.line(ctx, x + 30, top + 140 + j * 110, x + w - 30, top + 140 + j * 110, hexrgb("#8a6a52"), 6)
            for i in range(5):
                sx = x + 60 + i * (w - 120) / 5
                D.poly(ctx, [(sx, top + 136 + j * 110), (sx, top + 110 + j * 110), (sx + 22, top + 108 + j * 110),
                             (sx + 50, top + 124 + j * 110), (sx + 52, top + 136 + j * 110)],
                       hexrgb(r.choice(["#b6503f", "#2f3d5c", "#e2a33b", "#f0ece0"])), INK, 2, wob=0)
    elif kind == "clothes":
        for i in range(3):
            mx = x + 100 + i * (w - 200) / 2
            D.circle(ctx, mx, top + 120, 34, hexrgb("#e9dcc6"), INK, 2.5)
            D.rect(ctx, mx - 40, top + 160, 80, 150, hexrgb(r.choice(["#7a6aa3", "#c9805a", "#3f8a84"])), INK, 2.5)
            D.line(ctx, mx, top + 310, mx, floor - 10, INK, 5)
    elif kind == "toys":
        for i in range(6):
            bx = x + 40 + i * (w - 80) / 6
            D.rect(ctx, bx, floor - 120 - (i % 2) * 40, 60, 100, hexrgb(r.choice(["#e2a33b", "#c23b33", "#3f8a84", "#7a6aa3"])),
                   INK, 2.5)
        D.circle(ctx, x + w / 2, top + 140, 60, hexrgb("#c9805a"), INK, 3)
        D.circle(ctx, x + w / 2 - 45, top + 90, 24, hexrgb("#c9805a"), INK, 3)
        D.circle(ctx, x + w / 2 + 45, top + 90, 24, hexrgb("#c9805a"), INK, 3)
    elif kind == "pets":
        for i in range(3):
            for j in range(2):
                cx = x + 50 + i * (w - 100) / 3
                cy = top + 80 + j * 170
                D.rect(ctx, cx, cy, (w - 100) / 3 - 20, 130, hexrgb("#e9dfcb"), INK, 2.5)
                D.col(ctx, INK)
                ctx.set_line_width(2)
                for k in range(6):
                    ctx.move_to(cx + 10 + k * 22, cy)
                    ctx.line_to(cx + 10 + k * 22, cy + 130)
                ctx.stroke()
    elif kind == "party":
        for i in range(14):
            bx = x + 40 + r.random() * (w - 80)
            by = top + 60 + r.random() * 200
            D.line(ctx, bx, by + 30, bx + r.uniform(-10, 10), floor - 120, INK, 1.5)
            D.ellipse(ctx, bx, by, 26, 32, hexrgb(r.choice(["#c23b33", "#e2a33b", "#3f8a84", "#c23b6a", "#7a6aa3"])),
                      INK, 2)
    elif kind == "sports":
        for i in range(4):
            D.circle(ctx, x + 80 + i * 120, floor - 70, 40, hexrgb(r.choice(["#e8853a", "#f0ece0", "#2f3d5c"])), INK, 3)
        D.line(ctx, x + 60, top + 60, x + w - 60, top + 300, hexrgb("#8a6a52"), 10)
    elif kind == "beds":
        D.rect(ctx, x + 40, floor - 130, w - 80, 70, hexrgb("#f0ece0"), INK, 3)
        D.rect(ctx, x + 40, floor - 60, w - 80, 50, hexrgb("#4a6a9a"), INK, 3)
        D.rect(ctx, x + 40, floor - 250, 40, 240, hexrgb("#8a6a52"), INK, 3)
    elif kind == "books":
        for j in range(4):
            yy = top + 80 + j * 90
            D.line(ctx, x + 30, yy + 70, x + w - 30, yy + 70, hexrgb("#8a6a52"), 6)
            bx = x + 40
            while bx < x + w - 50:
                bw = r.uniform(14, 26)
                D.rect(ctx, bx, yy + 70 - r.uniform(50, 66), bw, 66, hexrgb(r.choice(
                    ["#b6503f", "#2f3d5c", "#e2a33b", "#3f8a84", "#7a6aa3", "#f0ece0"])), INK, 1.5, wob=0)
                bx += bw + 2
    elif kind == "food":
        D.rect(ctx, x + 30, floor - 160, w - 60, 150, hexrgb("#8a6a52"), INK, 3)
        for i in range(5):
            px = x + 70 + i * (w - 140) / 4
            ctx.save()
            ctx.translate(px, top + 160)
            D.col(ctx, hexrgb("#c9805a"))
            ctx.set_line_width(12)
            ctx.arc(0, 0, 28, 0.3, math.pi - 0.3)
            ctx.stroke()
            ctx.arc(-14, -10, 20, 0, TAU)
            ctx.stroke()
            ctx.arc(14, -10, 20, 0, TAU)
            ctx.stroke()
            ctx.restore()


# --- фудкорт -------------------------------------------------------------------

FC_FLOOR = 720
HATCHES = [(560, 930), (1180, 860), (1700, 960)]


def food_court(ctx, tod="night", lights=0.2, hatch_open=None):
    """Фудкорт: прилавки сзади, столы, люки в полу (позиции в HATCHES)."""
    x0, x1 = -400, 2400
    D.rect(ctx, x0, 0, x1 - x0, 150, CEIL, None, 0, wob=0)
    for k in range(4):
        sx = 100 + k * 520
        D.rect(ctx, sx, 20, 300, 110, mix(hexrgb("#2a2f50"), hexrgb("#c9d5d9"), 0.25 if tod in (
            "night", "deepnight") else 0.9), INK, 3, wob=0.3)
        if tod in ("night", "deepnight"):
            D.circle(ctx, sx + 230, 60, 16, hexrgb("#ece8d6"), None, 0)
    D.rect(ctx, x0, 150, x1 - x0, FC_FLOOR - 150, WALL_D, None, 0, wob=0)
    names = [("NOODLE BAR", "#b6503f"), ("PIZZA 34", "#e2a33b"), ("TACO LOCO", "#5f8a5a"),
             ("BURGER BROS", "#2f3d5c"), ("PRETZEL PALACE", "#c9805a")]
    for i, (nm, c) in enumerate(names):
        sx = -300 + i * 520
        c = hexrgb(c)
        C.sign(ctx, sx + 40, 200, 420, 70, nm, bg=c, seed=i)
        D.rect(ctx, sx + 40, 280, 420, 260, mix(hexrgb("#4a4856"), hexrgb("#f1dcae"), lights), INK, 3, seed=i + 5)
        D.rect(ctx, sx + 20, 540, 460, FC_FLOOR - 540, shade(c, -0.1), INK, 3, seed=i + 9)
        D.rect(ctx, sx + 20, 532, 460, 18, hexrgb("#d9d2c2"), INK, 2.5, wob=0)
        # меню
        for j in range(3):
            D.rect(ctx, sx + 70 + j * 130, 300, 110, 70, hexrgb("#2a2a2e"), INK, 2, wob=0)
    C.tiles_floor(ctx, x0, FC_FLOOR, x1, 1300, 960, 300, c="#ddd0b4", line="#c9b997", rows=7)
    D.line(ctx, x0, FC_FLOOR, x1, FC_FLOOR, INK, 3)
    for i, (hx, hy) in enumerate(HATCHES):
        o = (hatch_open or {}).get(i, 0.0)
        hatch(ctx, hx, hy, o, s=0.8 + (hy - 850) / 400)


def hatch(ctx, x, y, open_=0.0, s=1.0):
    w, h = 170 * s, 60 * s
    if open_ > 0:
        D.poly(ctx, [(x - w / 2, y - h / 2), (x + w / 2, y - h / 2), (x + w / 2 + 14 * s, y + h / 2),
                     (x - w / 2 - 14 * s, y + h / 2)], hexrgb("#141218"), INK, 3, wob=0.3)
        # крышка откинута назад
        lift = clamp(open_) * 1.0
        D.poly(ctx, [(x - w / 2, y - h / 2), (x + w / 2, y - h / 2), (x + w / 2, y - h / 2 - 150 * s * lift),
                     (x - w / 2, y - h / 2 - 150 * s * lift)], hexrgb("#8a8a86"), INK, 3, wob=0.3)
    else:
        D.poly(ctx, [(x - w / 2, y - h / 2), (x + w / 2, y - h / 2), (x + w / 2 + 14 * s, y + h / 2),
                     (x - w / 2 - 14 * s, y + h / 2)], hexrgb("#9a9a96"), INK, 3, wob=0.3)
        D.col(ctx, hexrgb("#7a7a76"))
        ctx.set_line_width(2)
        for k in range(1, 5):
            xx = x - w / 2 + k * w / 5
            ctx.move_to(xx, y - h / 2 + 4)
            ctx.line_to(xx + (k - 2.5) * 3 * s, y + h / 2 - 4)
        ctx.stroke()


def table_set(ctx, x, y, s=1.0, seed=0):
    """Круглый столик с двумя стульями (вид спереди)."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    for cx in (-95, 95):
        D.rect(ctx, cx - 30, -150, 60, 70, hexrgb("#c9805a"), INK, 2.5, seed=seed)
        D.rect(ctx, cx - 34, -84, 68, 12, hexrgb("#a86a4a"), INK, 2.5, wob=0)
        D.line(ctx, cx - 26, -72, cx - 26, 0, INK, 4)
        D.line(ctx, cx + 26, -72, cx + 26, 0, INK, 4)
    D.ellipse(ctx, 0, -105, 95, 18, hexrgb("#efe6d2"), INK, 3)
    D.line(ctx, 0, -95, 0, 0, INK, 6)
    D.line(ctx, -30, 0, 30, 0, INK, 6)
    ctx.restore()


# --- лифт, карта ----------------------------------------------------------------

def elevator(ctx, x=960, floor=880, open_=0.0, light=1.0, number="3", ding=0.0):
    """Лифт: двери раздвигаются (open_ 0..1). Внутри кабина — рисует сцена до вызова?"""
    D.rect(ctx, x - 230, floor - 520, 460, 520, hexrgb("#b9b6ae"), INK, 4, wob=0.5)
    D.rect(ctx, x - 190, floor - 470, 380, 470, hexrgb("#3a3836"), INK, 3, wob=0)
    D.rect(ctx, x - 70, floor - 512, 140, 34, hexrgb("#1e1e22"), INK, 2.5, wob=0)
    D.text(ctx, number + (" ▲" if ding > 0 else ""), x, floor - 486, 26, D.FONT_DAY, mix(hexrgb("#ff6a4a"), hexrgb("#ffd36a"), ding), bold=True)


def elevator_doors(ctx, x=960, floor=880, open_=0.0):
    op = clamp(open_) * 180
    for side in (-1, 1):
        dx = x - 190 - op if side < 0 else x + op
        D.rect(ctx, dx, floor - 470, 190, 470, hexrgb("#c9c6be"), INK, 3, wob=0)
        D.col(ctx, hexrgb("#e6e3dc"), 0.6)
        ctx.rectangle(dx + 20, floor - 450, 30, 430)
        ctx.fill()


def call_panel(ctx, x, y, pressed=0.0):
    D.rect(ctx, x - 26, y - 70, 52, 120, hexrgb("#c9c6be"), INK, 3, wob=0)
    D.circle(ctx, x, y - 30, 14, mix(hexrgb("#f0ece0"), hexrgb("#ffcf5a"), pressed), INK, 2.5)
    D.circle(ctx, x, y + 15, 14, hexrgb("#f0ece0"), INK, 2.5)
    D.poly(ctx, [(x - 6, y - 26), (x + 6, y - 26), (x, y - 36)], INK, None, 0, wob=0)
    D.poly(ctx, [(x - 6, y + 11), (x + 6, y + 11), (x, y + 21)], INK, None, 0, wob=0)


def mall_map(ctx, x=960, y=540, s=1.0, name_k=0.0, was_k=0.0, dot_pulse=0.0):
    """Справочная карта ТЦ с точкой YOU ARE HERE. name_k — сколько букв имени дописано."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.rect(ctx, -520, -340, 1040, 680, hexrgb("#2f3d5c"), INK, 5, wob=0.6)
    D.rect(ctx, -490, -310, 980, 620, hexrgb("#f1e8d4"), INK, 3, wob=0.4)
    D.text(ctx, "LIBERTY MALL  •  LEVEL 1", 0, -262, 34, D.FONT_TITLE, hexrgb("#2f3d5c"))
    r = rng(4)
    cols = ["#e9a99a", "#a9d0c8", "#f2d08a", "#c9bde0", "#b9d3a8", "#a9bfdf"]
    blocks = [(-460, -220, 220, 160), (-220, -220, 180, 160), (-20, -220, 240, 160), (240, -220, 220, 160),
              (-460, 60, 180, 220), (-260, 60, 240, 220), (220, 60, 240, 220), (0, 60, 200, 100)]
    for i, (bx, by, bw, bh) in enumerate(blocks):
        D.rect(ctx, bx, by, bw, bh, hexrgb(cols[i % len(cols)]), INK, 2.5, wob=0.5, seed=i)
        D.text(ctx, str(100 + i * 3), bx + bw / 2, by + bh / 2 + 10, 26, D.FONT_HAND, INK)
    # проход
    D.rect(ctx, -460, -40, 920, 80, hexrgb("#efe6d2"), None, 0, wob=0)
    # точка
    px, py = 60, 0
    pr = 18 + 6 * math.sin(dot_pulse * TAU)
    D.radial(ctx, px, py, pr * 2.2, "#d9483b", 0.35, 0)
    D.circle(ctx, px, py, 16, hexrgb("#d9483b"), INK, 3)
    D.text(ctx, "YOU ARE HERE", px, py + 52, 28, D.FONT_TITLE, hexrgb("#d9483b"))
    if name_k > 0:
        s_ = "SAM"[:int(math.ceil(name_k * 3))]
        D.text(ctx, s_, px + 40, py - 26, 54, D.FONT_HAND, hexrgb("#1f2a55"), "left", rot=-0.08)
    if was_k > 0:
        s_ = "WAS"[:int(math.ceil(was_k * 3))]
        D.text(ctx, s_, px + 170, py + 18, 46, D.FONT_HAND, hexrgb("#1f2a55"), "left", rot=0.05)
        # стрелка-вставка
        D.line(ctx, px + 160, py + 30, px + 150, py + 48, hexrgb("#1f2a55"), 4)
    ctx.restore()
