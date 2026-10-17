"""Улица, фасад Liberty Mall, крыша, дом Розы, вертолёт."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1
from engine import draw as D
from . import common as C

INK = D.INK
MALL_CREAM = hexrgb("#e3d5bb")
MALL_TRIM = hexrgb("#6fa79a")      # медно-зелёный, как у статуи Свободы
BRICK = hexrgb("#b6694f")


# --- фасад торгового центра ----------------------------------------------------

def mall_facade(ctx, cx=960, ground=1000, tod="dusk", lights_on=1.0, doors_open=0.0, sign_on=1.0,
                upper_lights=None):
    """Фасад: центр по x = cx, земля = ground. Ширина 1500, высота 760."""
    x0, w = cx - 750, 1500
    top = ground - 760
    night = tod in ("night", "deepnight", "dusk", "storm")
    # корпус
    D.rect(ctx, x0, top, w, 760, MALL_CREAM, INK, 4, wob=1, seed=11)
    # карниз и вывеска
    D.rect(ctx, x0 - 20, top - 30, w + 40, 46, shade(MALL_CREAM, -0.12), INK, 4, wob=0.8, seed=12)
    D.rect(ctx, cx - 330, top + 40, 660, 96, hexrgb("#2f3d5c"), INK, 4, wob=0.6, seed=13)
    glow_c = mix(hexrgb("#8fc3b6"), hexrgb("#c9f2e2"), sign_on)
    D.text(ctx, "LIBERTY MALL", cx, top + 112, 66, D.FONT_TITLE, glow_c if sign_on > 0.5 else MALL_TRIM)
    # маленькая статуя-логотип
    ctx.save()
    ctx.translate(cx - 290, top + 88)
    D.circle(ctx, 0, -6, 13, MALL_TRIM, INK, 2)
    for k in range(5):
        a = -math.pi / 2 + (k - 2) * 0.45
        D.line(ctx, math.cos(a) * 12, -6 + math.sin(a) * 12, math.cos(a) * 24, -6 + math.sin(a) * 24, MALL_TRIM, 4)
    ctx.restore()
    # стеклянные этажи
    floors = 4
    for f in range(floors):
        fy = top + 170 + f * 120
        for i in range(10):
            wx = x0 + 70 + i * 137
            lit = upper_lights[f][i] if upper_lights else (lights_on * (0.6 + 0.4 * ((i * 7 + f * 3) % 5 > 1)))
            col = mix(hexrgb("#5d6f86") if night else hexrgb("#9db3c0"), hexrgb("#f2d89a"), lit * (1 if night else 0.35))
            D.rect(ctx, wx, fy, 118, 92, col, INK, 2.5, wob=0.5, seed=f * 20 + i)
            if not night:
                C.glass(ctx, wx, fy, 118, 92, alpha=0.0, frame=False)
    # витрины и вход
    gy = ground - 210
    for side in (-1, 1):
        for k in range(2):
            wx = cx + side * (220 + k * 270) - (0 if side > 0 else 240)
            col = mix(hexrgb("#4e5c70"), hexrgb("#f0d49a"), lights_on * (1 if night else 0.4))
            D.rect(ctx, wx, gy, 240, 190, col, INK, 3, wob=0.5, seed=30 + k + side)
            C.glass(ctx, wx, gy, 240, 190, alpha=0.18, frame=False)
            # постер
            D.rect(ctx, wx + 70, gy + 30, 100, 130, hexrgb("#d9483b") if k == 0 else hexrgb("#e2a33b"), INK, 2,
                   seed=40 + k)
            D.text(ctx, "SALE" if k == 0 else "NEW", wx + 120, gy + 108, 30, D.FONT_TITLE, hexrgb("#f6eedd"))
    # козырёк
    D.poly(ctx, [(cx - 200, gy - 40), (cx + 200, gy - 40), (cx + 230, gy - 6), (cx - 230, gy - 6)],
           hexrgb("#2f3d5c"), INK, 3, seed=50)
    # двери
    door_w = 150
    D.rect(ctx, cx - 180, gy, 360, 210, hexrgb("#3c4656") if night else hexrgb("#7d8d99"), INK, 3, wob=0.3)
    inner = mix(hexrgb("#4e5c70"), hexrgb("#f4dca6"), lights_on * (1 if night else 0.5))
    D.rect(ctx, cx - 170, gy + 10, 340, 200, inner, None, 0, wob=0)
    op = doors_open * 120
    for side in (-1, 1):
        dx = cx + side * (op + door_w / 2) - door_w / 2 + (0 if side > 0 else 0)
        dx = cx - door_w - op if side < 0 else cx + op
        C.glass(ctx, dx + 5, gy + 10, door_w, 200, alpha=0.3, seed=60 + side)
    # датчик над дверью
    D.rect(ctx, cx - 22, gy - 4, 44, 12, hexrgb("#2a2a30"), INK, 2, wob=0)
    D.circle(ctx, cx + 12, gy + 2, 3, hexrgb("#e05a4a"), None, 0)
    # тротуар
    D.rect(ctx, x0 - 400, ground, w + 800, 40, hexrgb("#b9b2a4"), INK, 3, wob=0.6)


def street(ctx, x0, x1, ground=1000, tod="dusk", seed=5, cabs=True, depth_y=1400):
    """Проезжая часть перед ТЦ (вид спереди): полосы, такси поперёк."""
    D.rect(ctx, x0, ground + 40, x1 - x0, depth_y - ground, hexrgb("#6b6a6e") if tod not in (
        "day", "morning") else hexrgb("#8b8a88"), None, 0, wob=0)
    D.col(ctx, "#e8e2c8", 0.8)
    for k in range(int((x1 - x0) / 160)):
        ctx.rectangle(x0 + k * 160, ground + 170, 90, 8)
    ctx.fill()
    if cabs:
        r = rng(seed)
        for k in range(4):
            cx = x0 + 300 + k * (x1 - x0 - 600) / 3 + r.uniform(-60, 60)
            taxi(ctx, cx, ground + 140 + r.uniform(0, 60), 1.0, r.random() < 0.5, ang=r.uniform(-0.15, 0.15),
                 door=r.random() < 0.5)


def taxi(ctx, x, y, s=1.0, flip=False, ang=0.0, door=False, color="#e8b830"):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(-s if flip else s, s)
    c = hexrgb(color)
    D.poly(ctx, [(-120, 0), (-120, -38), (-70, -42), (-40, -78), (55, -78), (85, -42), (125, -36), (125, 0)],
           c, INK, 3, wob=0.5, seed=7)
    D.poly(ctx, [(-32, -72), (50, -72), (72, -44), (-58, -44)], hexrgb("#9fb3bd"), INK, 2.5, wob=0.3)
    D.line(ctx, 10, -72, 10, -44, INK, 3)
    D.rect(ctx, -20, -96, 40, 18, hexrgb("#f4efe0"), INK, 2, wob=0)
    D.text(ctx, "TAXI", 0, -82, 13, D.FONT_TITLE, INK)
    D.col(ctx, INK)
    ctx.rectangle(-120, -24, 245, 6)
    ctx.fill()
    for wx in (-75, 75):
        D.circle(ctx, wx, 0, 22, hexrgb("#2c2a2a"), INK, 3)
        D.circle(ctx, wx, 0, 9, hexrgb("#8d8a84"), None, 0)
    if door:
        D.poly(ctx, [(10, -44), (60, -44), (70, -14), (20, -6)], shade(c, -0.1), INK, 2.5, wob=0.3)
    ctx.restore()


def car(ctx, x, y, s=1.0, flip=False, color="#b5523b", lights=False):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(-s if flip else s, s)
    c = hexrgb(color)
    D.poly(ctx, [(-130, 0), (-130, -40), (-80, -46), (-45, -84), (60, -84), (95, -46), (132, -40), (132, 0)],
           c, INK, 3, wob=0.5, seed=8)
    D.poly(ctx, [(-38, -78), (54, -78), (80, -48), (-66, -48)], hexrgb("#9fb3bd"), INK, 2.5, wob=0.3)
    for wx in (-80, 80):
        D.circle(ctx, wx, 0, 23, hexrgb("#2c2a2a"), INK, 3)
        D.circle(ctx, wx, 0, 9, hexrgb("#8d8a84"), None, 0)
    if lights:
        D.circle(ctx, 128, -30, 8, hexrgb("#fff2c0"), INK, 2)
    ctx.restore()


def subway_entrance(ctx, x, ground, s=1.0, water=0.0):
    """Вход в метро с перилами и зелёными шарами-фонарями."""
    ctx.save()
    ctx.translate(x, ground)
    ctx.scale(s, s)
    D.rect(ctx, -110, -70, 220, 70, hexrgb("#5e6a5e"), INK, 3)
    D.rect(ctx, -90, -60, 180, 60, hexrgb("#1d1d22"), None, 0, wob=0)
    for sx in (-100, 100):
        D.line(ctx, sx, -70, sx, -150, hexrgb("#3d5a46"), 7)
        D.line(ctx, sx, -70, sx, -150, INK, 2)
        D.circle(ctx, sx, -160, 15, hexrgb("#7fbf8a"), INK, 3)
    D.rect(ctx, -80, -132, 160, 32, hexrgb("#2a2a2a"), INK, 2.5)
    D.text(ctx, "SUBWAY", 0, -108, 22, D.FONT_TITLE, hexrgb("#f4f0e4"))
    if water > 0:
        D.col(ctx, "#6d7f8a", 0.85)
        ctx.rectangle(-90, -60, 180, 60)
        ctx.fill()
        # водопад
        D.col(ctx, "#cfdde6", 0.7)
        ctx.set_line_width(3)
        for k in range(9):
            xx = -80 + k * 20
            ctx.move_to(xx, -70)
            ctx.line_to(xx + 4, -4)
        ctx.stroke()
    ctx.restore()


# --- дом напротив (Роза) ---------------------------------------------------------

def rosa_tower(ctx, x, ground, w=520, floors=24, tod="dusk", lit=None, rosa_light=0.0, flh=44, seed=21):
    """Жилая башня напротив. Окно Розы — 20-й этаж, 4-я колонка. Возвращает центр окна Розы."""
    h = floors * flh + 60
    top = ground - h
    base_c = hexrgb("#c9b59a") if tod in ("day", "morning", "golden", "overcast") else hexrgb("#6f6680")
    if tod in ("night", "deepnight", "storm"):
        base_c = hexrgb("#3b3d5c")
    D.rect(ctx, x, top, w, h, base_c, INK, 3.5, wob=0.8, seed=seed)
    D.rect(ctx, x - 14, top - 18, w + 28, 22, shade(base_c, -0.15), INK, 3, wob=0.5)
    cols = 6
    r = rng(seed)
    rx = ry = None
    for f in range(floors):
        fy = top + 30 + f * flh
        floor_no = floors - f
        for i in range(cols):
            wx = x + 26 + i * (w - 40) / cols
            ww = (w - 40) / cols - 22
            on = (lit or 0) > r.random()
            c = hexrgb("#f2d18a") if on else shade(base_c, -0.28)
            if floor_no == 20 and i == 3:
                rx, ry = wx + ww / 2, fy + (flh - 14) / 2
                c = mix(shade(base_c, -0.28), hexrgb("#f7d98f"), rosa_light)
            D.rect(ctx, wx, fy, ww, flh - 14, c, INK, 2, wob=0.3, seed=f * 7 + i)
    return rx, ry


# --- крыша --------------------------------------------------------------------

def roof(ctx, x0=-400, x1=2320, floor=860, tod="day", door=True, tank=True, door_x=1450, door_open=0.0,
         paint=0.0, smear=0.0):
    """Крыша ТЦ: поверхность, парапет, вентблоки, выход на крышу, водонапорная бочка."""
    rc = hexrgb("#9a968c") if tod not in ("night", "deepnight", "storm") else hexrgb("#6a6878")
    D.rect(ctx, x0, floor - 140, x1 - x0, 140, shade(rc, 0.08), None, 0, wob=0)
    D.rect(ctx, x0, floor, x1 - x0, 400, rc, None, 0, wob=0)
    D.col(ctx, shade(rc, -0.1))
    ctx.set_line_width(2)
    for k in range(12):
        yy = floor + 20 + k * k * 4
        ctx.move_to(x0, yy)
        ctx.line_to(x1, yy)
    ctx.stroke()
    # дальний парапет
    D.rect(ctx, x0, floor - 170, x1 - x0, 34, shade(rc, -0.05), INK, 3, wob=0.6)
    if tank:
        tank_x = 300
        D.line(ctx, tank_x - 60, floor - 170, tank_x - 50, floor - 360, INK, 6)
        D.line(ctx, tank_x + 60, floor - 170, tank_x + 50, floor - 360, INK, 6)
        D.line(ctx, tank_x - 55, floor - 260, tank_x + 55, floor - 300, INK, 3)
        D.poly(ctx, [(tank_x - 75, floor - 360), (tank_x + 75, floor - 360), (tank_x + 75, floor - 500),
                     (tank_x - 75, floor - 500)], hexrgb("#8a6748"), INK, 3, seed=5)
        D.col(ctx, shade(hexrgb("#8a6748"), -0.2))
        ctx.set_line_width(2)
        for k in range(5):
            ctx.move_to(tank_x - 75 + k * 37, floor - 360)
            ctx.line_to(tank_x - 75 + k * 37, floor - 500)
        ctx.stroke()
        D.poly(ctx, [(tank_x - 85, floor - 500), (tank_x, floor - 570), (tank_x + 85, floor - 500)],
               hexrgb("#5d4a3a"), INK, 3)
    # вентблоки
    for hx in (700, 1000):
        D.rect(ctx, hx, floor - 110, 190, 110, hexrgb("#b5b3ac"), INK, 3, seed=hx)
        D.col(ctx, hexrgb("#8f8d86"))
        ctx.set_line_width(3)
        for k in range(5):
            ctx.move_to(hx + 15, floor - 95 + k * 20)
            ctx.line_to(hx + 175, floor - 95 + k * 20)
        ctx.stroke()
        D.circle(ctx, hx + 95, floor - 130, 30, hexrgb("#9a988f"), INK, 3)
    if door:
        roof_door(ctx, door_x, floor, door_open, tod)


def roof_door(ctx, x, floor, open_=0.0, tod="day"):
    D.rect(ctx, x, floor - 300, 330, 300, hexrgb("#c8b9a0"), INK, 3.5, seed=77)
    D.rect(ctx, x - 12, floor - 318, 354, 22, hexrgb("#8f8270"), INK, 3)
    D.rect(ctx, x + 110, floor - 220, 110, 220, hexrgb("#1c1a20"), INK, 3, wob=0)
    # дверь — сужается при открытии
    dw = 110 * (1 - 0.85 * clamp(open_))
    D.rect(ctx, x + 110, floor - 220, dw, 220, hexrgb("#6b7280"), INK, 3, wob=0.3)
    D.circle(ctx, x + 110 + dw - 16, floor - 110, 6, hexrgb("#d6b24c"), INK, 2)
    D.rect(ctx, x + 120, floor - 270, 90, 30, hexrgb("#3f8a84"), INK, 2)
    D.text(ctx, "ROOF", x + 165, floor - 247, 20, D.FONT_TITLE, hexrgb("#f6eedd"))


def parapet_front(ctx, x0, x1, y, h=80, tod="day"):
    rc = hexrgb("#a8a398") if tod not in ("night", "deepnight", "storm") else hexrgb("#5d5c6c")
    D.rect(ctx, x0, y - h, x1 - x0, h + 400, rc, INK, 4, wob=0.8, seed=81)
    D.rect(ctx, x0, y - h - 16, x1 - x0, 20, shade(rc, 0.1), INK, 3, wob=0.5)


# --- вертолёт ------------------------------------------------------------------

def helicopter(ctx, x, y, s=1.0, t=0.0, flip=False, door_open=1.0, tilt=0.0, inside=None):
    """Военный вертолёт сбоку. inside(ctx) — дорисовать людей в проёме двери."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(tilt)
    ctx.scale(-s if flip else s, s)
    body = hexrgb("#5f6648")
    # хвост
    D.poly(ctx, [(-120, -40), (-520, -70), (-540, -110), (-500, -100), (-120, -90)], body, INK, 4, seed=3)
    D.poly(ctx, [(-540, -110), (-570, -190), (-520, -180), (-500, -100)], body, INK, 4, seed=4)
    # хвостовой винт
    ctx.save()
    ctx.translate(-545, -150)
    ctx.rotate(t * 40)
    D.line(ctx, -55, 0, 55, 0, hexrgb("#3a3c34"), 6)
    ctx.restore()
    D.circle(ctx, -545, -150, 8, INK, None, 0)
    # корпус
    D.poly(ctx, [(-160, -140), (120, -150), (230, -110), (260, -40), (220, 10), (-150, 10), (-190, -60)],
           body, INK, 4, seed=5)
    D.poly(ctx, [(130, -138), (220, -106), (245, -50), (150, -50)], hexrgb("#9fb3bd"), INK, 3, seed=6)
    # дверной проём
    D.rect(ctx, -110, -128, 190, 128, hexrgb("#24261f"), INK, 3, wob=0.3)
    if inside:
        ctx.save()
        ctx.rectangle(-110, -128, 190, 128)
        ctx.clip()
        inside(ctx)
        ctx.restore()
    if door_open < 1:
        D.rect(ctx, -110 + 190 * door_open, -128, 190, 128, shade(body, 0.05), INK, 3)
    # полозья
    D.line(ctx, -170, 60, 220, 60, INK, 6)
    D.line(ctx, -120, 10, -110, 60, INK, 5)
    D.line(ctx, 150, 10, 140, 60, INK, 5)
    D.text(ctx, "US ARMY", -300, -60, 30, D.FONT_TITLE, hexrgb("#2a2c22"))
    # несущий винт
    D.rect(ctx, -30, -176, 60, 30, shade(body, -0.15), INK, 3)
    blur = 0.5 + 0.5 * math.sin(t * 50)
    D.col(ctx, "#3a3c34", 0.55)
    ctx.save()
    ctx.translate(0, -180)
    ctx.scale(1, 0.08)
    ctx.arc(0, 0, 520, 0, TAU)
    ctx.restore()
    ctx.fill()
    ph = (t * 7) % 1.0
    for k in range(2):
        a = math.cos((ph + k * 0.5) * TAU)
        D.line(ctx, -520 * a, -180, 520 * a, -180, INK, 7)
    ctx.restore()
