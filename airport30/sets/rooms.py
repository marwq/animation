"""Служебные помещения: багажный зал и туннели с лентами, кабина лайнера, тренажёр, ангар №9
с «Рози», бюро находок, подвал с генератором, раздевалка, вершина диспетчерской вышки.
Пол — FL, мир по x от -1400 до 6000."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1, W, H
from engine import draw as D
from . import sea as SEA
from .base import tone, logo, jerrycan, NAVY, TEAL, SUNC, WHITE, INK, NIGHT

FL = 900
BELT_Y = 740          # верх ленты в туннеле (на ней сидит Дэнни)
BAG_COLS = ["#e8423c", "#2f8fd8", "#3fbf6a", "#f2c230", "#7a4fc2", "#2b2f3a", "#ff9a3c", "#f08cb0"]


def _T(power, tod="night"):
    return lambda c: tone(c, "day" if power > 0 else tod)


def belt(ctx, x0, x1, y, t=0.0, run=1.0, T=lambda c: c, legs=True, h=36):
    """Багажная лента: чёрное полотно с бегущими швами, серая рама, ролики, ножки."""
    if legs:
        lx = math.ceil((x0 - 60) / 300) * 300 + 60
        while lx < x1:
            D.rect(ctx, lx, y + h, 18, FL - y - h, T("#8f99a3"), INK, 3, wob=0)
            lx += 300
    D.rect(ctx, x0, y, x1 - x0, h, T("#9aa3ac"), INK, 4, wob=0)
    D.rect(ctx, x0, y - 10, x1 - x0, 14, T("#22252c"), INK, 3, wob=0)
    off = (t * 160 * run) % 60
    xx = math.floor(x0 / 60) * 60 + off
    while xx < x1:
        if xx > x0:
            D.line(ctx, xx, y - 8, xx, y + 2, T("#3a3f48"), 3)
        xx += 60
    xx = math.ceil((x0 - 30) / 120) * 120 + 30
    while xx < x1:
        D.circle(ctx, xx, y + h / 2, 9, T("#c9d0d6"), INK, 2)
        xx += 120


def bags(ctx, x0, x1, y, t=0.0, run=1.0, seed=0, gap=170, T=lambda c: c, skip=None):
    """Чемоданы, едущие по ленте."""
    r = rng(seed)
    span = x1 - x0
    n = int(span / gap) + 1
    for k in range(n):
        base = r.uniform(0, gap * 0.5)
        x = x0 + ((k * gap + base + t * 160 * run) % span)
        if skip and skip[0] < x < skip[1]:
            continue
        c = r.choice(BAG_COLS)
        w, hh = r.uniform(70, 110), r.uniform(50, 80)
        D.rrect(ctx, x - w / 2, y - 10 - hh, w, hh, 10, T(c), INK, 3)
        D.line(ctx, x - 14, y - 10 - hh, x - 10, y - 18 - hh, INK, 4)
        D.line(ctx, x + 14, y - 10 - hh, x + 10, y - 18 - hh, INK, 4)
        D.line(ctx, x - 10, y - 18 - hh, x + 10, y - 18 - hh, INK, 4)
        if r.random() < 0.4:
            D.rect(ctx, x + w / 2 - 22, y - 10 - hh + 8, 14, 22, T("#fff6d8"), INK, 2, wob=0)


def curtain(ctx, x, y, w, h, t=0.0, push=0.0, T=lambda c: c):
    """Резиновые полосы на проходе ленты сквозь стену."""
    D.rect(ctx, x - 10, y - 20, w + 20, 20, T("#f2c230"), INK, 3, wob=0)
    n = int(w / 26)
    for k in range(n):
        sx = x + k * 26 + 4
        sw = math.sin(t * 4 + k) * 3 + push * (24 - abs(k - n / 2) * 4)
        D.poly(ctx, [(sx, y), (sx + 20, y), (sx + 20 + sw, y + h), (sx + sw, y + h)], T("#22252c"), INK, 2, wob=0,
               alpha=0.95)


def badge_door(ctx, x, T, light="red", label="AUTHORIZED ONLY"):
    D.rect(ctx, x - 130, 360, 260, FL - 360, T("#c9d0d6"), INK, 5, wob=0)
    D.rect(ctx, x - 110, 380, 220, FL - 380, T("#dfe5ea"), INK, 3, wob=0)
    D.rect(ctx, x - 60, 420, 120, 90, T("#9fd8ec"), INK, 4, wob=0)
    D.line(ctx, x + 70, 640, x + 100, 640, INK, 10)
    D.rect(ctx, x - 110, 300, 220, 50, T("#e8423c"), INK, 3, wob=0)
    D.text(ctx, label, x, 336, 26, D.FONT_TITLE, T("#fff6d8"))
    D.rrect(ctx, x + 150, 560, 50, 80, 8, T("#2b2f3a"), INK, 3)
    D.circle(ctx, x + 175, 585, 9, hexrgb("#4cff8a") if light == "green" else hexrgb("#ff4a3a"), None, 0)


def fire_door(ctx, x, T, open_k=0.0):
    D.rect(ctx, x - 150, 330, 300, FL - 330, T("#b8322c"), INK, 6, wob=0)
    D.rect(ctx, x - 130, 350, 260, FL - 350, T("#d8443c"), INK, 3, wob=0)
    D.rect(ctx, x - 120, 520, 240, 20, T("#c9d0d6"), INK, 3, wob=0)
    D.rect(ctx, x - 110, 260, 220, 56, T("#fff6d8"), INK, 3, wob=0)
    D.text(ctx, "FIRE DOOR", x, 300, 34, D.FONT_TITLE, T("#b8322c"))


def baggage_hall(ctx, power=1.0, tod="night", x0=-1400, x1=6000):
    """Сердце багажной системы: ленты на трёх уровнях, горки, сортировка (статичная часть)."""
    T = _T(power, tod)
    D.rect(ctx, x0, -600, x1 - x0, FL + 600, T("#4a5568"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 220)):
        D.rect(ctx, x0 + k * 220, -600, 8, FL + 600, T("#42495a"), None, 0, wob=0)
    # потолочные балки и лампы
    D.rect(ctx, x0, -1600, x1 - x0, 1140, T("#2b3040"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 400) + 1):
        lx = x0 + 200 + k * 400
        D.line(ctx, lx, -460, lx, -300, INK, 4)
        D.poly(ctx, [(lx - 50, -300), (lx + 50, -300), (lx + 30, -270), (lx - 30, -270)], T("#f2c230"), INK, 3,
               wob=0)
        if power > 0:
            D.poly(ctx, [(lx - 30, -270), (lx + 30, -270), (lx + 220, 260), (lx - 220, 260)], hexrgb("#ffe9a0"),
                   None, 0, wob=0, alpha=0.08)
    # жёлтые стальные стойки
    for k in range(int((x1 - x0) / 900) + 1):
        sx = x0 + 400 + k * 900
        D.rect(ctx, sx, -460, 40, FL + 460, T("#f2c230"), INK, 4, wob=0)
        for j in range(5):
            D.line(ctx, sx, -400 + j * 260, sx + 40, -270 + j * 260, INK, 4)
    # горка-спираль
    for k in range(4):
        y = -200 + k * 220
        D.poly(ctx, [(4000, y), (4700, y + 100), (4700, y + 150), (4000, y + 50)], T("#c9d0d6"), INK, 4, wob=0)
        D.poly(ctx, [(4700, y + 150), (4000, y + 260), (4000, y + 310), (4700, y + 200)], T("#aeb6bc"), INK, 4,
               wob=0)
    # таблички
    for i, (txt, sx, c) in enumerate((("BAG ROOM 3", 300, "#f2c230"), ("SORT LINE C", 2300, "#f2c230"),
                                      ("NO PASSENGERS", 3400, "#e8423c"))):
        D.rect(ctx, sx - 200, -230, 400, 80, T(c), INK, 4, wob=0)
        D.text(ctx, txt, sx, -174, 40, D.FONT_TITLE, T("#22252c" if c != "#e8423c" else "#fff6d8"))
    # тележки-«долли» с багажом у стены
    for k in range(3):
        cx = x0 + 300 + k * 520
        D.rect(ctx, cx, FL - 110, 360, 70, T("#c9d0d6"), INK, 4, wob=0)
        r = rng(k)
        for j in range(5):
            D.rrect(ctx, cx + 10 + j * 70, FL - 110 - r.uniform(50, 90), 60, 90, 8, T(r.choice(BAG_COLS)), INK, 3)
        for wx in (40, 320):
            D.circle(ctx, cx + wx, FL - 24, 22, T("#2b2f3a"), INK, 3)
    D.rect(ctx, x0, FL - 40, x1 - x0, 900, T("#5d6575"), None, 0, wob=0)
    D.rect(ctx, x0, FL - 40, x1 - x0, 14, T("#f2c230"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 80)):
        D.poly(ctx, [(x0 + k * 80, FL - 40), (x0 + k * 80 + 40, FL - 40), (x0 + k * 80 + 10, FL - 26),
                     (x0 + k * 80 - 30, FL - 26)], T("#22252c"), None, 0, wob=0)


def tunnel(ctx, power=1.0, tod="night", x0=-1400, x1=6000, label="T-7"):
    """Бетонный туннель с лентой посередине: трубы, кабели, лампы, разметка."""
    T = _T(power, tod)
    D.rect(ctx, x0, -400, x1 - x0, FL + 400, T("#5d6575"), None, 0, wob=0)
    ctx.move_to(x0, 200)
    for k in range(41):
        u = k / 40
        ctx.line_to(lerp(x0, x1, u), 200 - 40 * math.sin(math.pi * (u * 20 % 1)))
    ctx.line_to(x1, -400)
    ctx.line_to(x0, -400)
    ctx.close_path()
    D.col(ctx, T("#3e4452"))
    ctx.fill()
    for k in range(int((x1 - x0) / 400) + 1):
        D.line(ctx, x0 + k * 400, 160, x0 + k * 400, FL, T("#525a6a"), 6)
    for yy, c, w in ((230, "#c9d0d6", 22), (270, "#e8423c", 14), (300, "#2f8fd8", 10)):
        D.line(ctx, x0, yy, x1, yy, INK, w + 6)
        D.line(ctx, x0, yy, x1, yy, T(c), w)
    for k in range(int((x1 - x0) / 600) + 1):
        lx = x0 + 300 + k * 600
        D.rrect(ctx, lx - 50, 186, 100, 24, 10, hexrgb("#ffe08a") if power > 0 else T("#5a5f68"), INK, 3)
        if power > 0:
            D.radial(ctx, lx, 200, 260, "#ffe08a", 0.25, 0)
        D.text(ctx, "%s-%02d" % (label, k + 1), lx, 400, 44, D.FONT_TITLE, T("#f2c230"))
    D.rect(ctx, x0, FL - 40, x1 - x0, 900, T("#6b7383"), None, 0, wob=0)
    D.rect(ctx, x0, FL - 40, x1 - x0, 10, T("#f2c230"), None, 0, wob=0)


# --- кабины --------------------------------------------------------------------------------

def cockpit(ctx, tod="night", power=1.0, view=None, t=0.0, sim=False):
    """Кабина лайнера изнутри (вид вперёд): окна, приборная панель, штурвалы, РУДы.
    view(ctx) рисует то, что за стёклами (в мировых координатах кабины). Ширина ~2400."""
    T = _T(power, tod)
    # за стёклами
    ctx.save()
    win = [(-1000, -60), (-560, -260), (560, -260), (1000, -60), (900, 160), (-900, 160)]
    D.path(ctx, win)
    ctx.clip()
    if view:
        view(ctx)
    else:
        SEA.sky(ctx, -1200, -400, 2400, 600, tod)
    ctx.restore()
    # рамы
    D.poly(ctx, [(-2600, -1500), (2600, -1500), (2600, -60), (1000, -60), (560, -260), (-560, -260), (-1000, -60),
                 (-2600, -60)], T("#4a505c"), INK, 6, wob=0)
    for (a, b) in (((-560, -260), (-420, 160)), ((560, -260), (420, 160)), ((0, -260), (0, 160))):
        D.line(ctx, a[0], a[1], b[0], b[1], INK, 30)
        D.line(ctx, a[0], a[1], b[0], b[1], T("#5a606c"), 20)
    D.poly(ctx, [(-2600, -60), (-1000, -60), (-900, 160), (-2600, 160)], T("#4a505c"), INK, 6, wob=0)
    D.poly(ctx, [(2600, -60), (1000, -60), (900, 160), (2600, 160)], T("#4a505c"), INK, 6, wob=0)
    # верхняя панель с тумблерами
    D.rect(ctx, -500, -700, 1000, 300, T("#3a3f4a"), INK, 5, wob=0)
    r = rng(4)
    for k in range(40):
        bx, by = -460 + (k % 10) * 92, -660 + (k // 10) * 60
        D.rect(ctx, bx, by, 40, 30, T("#2b2f3a"), INK, 2, wob=0)
        if power > 0:
            D.circle(ctx, bx + 20, by + 15, 6, hexrgb(r.choice(["#4cff8a", "#ffd23a", "#ffffff", "#2b2f3a"])), None, 0)
    # приборная панель
    D.rect(ctx, -2600, 160, 5200, 1400, T("#3a3f4a"), INK, 6, wob=0)
    D.rect(ctx, -1200, 150, 2400, 40, T("#2b2f3a"), INK, 4, wob=0)
    for i, sx in enumerate((-980, -620, 260, 620)):
        D.rrect(ctx, sx, 230, 320, 260, 14, T("#15181f"), INK, 5)
        if power > 0:
            if i % 2 == 0:
                D.rect(ctx, sx + 20, 250, 280, 110, hexrgb("#2f8fd8"), None, 0, wob=0)
                D.rect(ctx, sx + 20, 360, 280, 110, hexrgb("#a86a3a"), None, 0, wob=0)
                D.line(ctx, sx + 20, 360, sx + 300, 360, hexrgb("#ffffff"), 3)
                D.poly(ctx, [(sx + 120, 360), (sx + 160, 345), (sx + 200, 360)], hexrgb("#ffd23a"), None, 0, wob=0)
            else:
                D.circle(ctx, sx + 160, 360, 100, hexrgb("#0e1a2a"), hexrgb("#4cff8a"), 3)
                a = t * 1.5
                D.line(ctx, sx + 160, 360, sx + 160 + math.cos(a) * 100, 360 + math.sin(a) * 100,
                       hexrgb("#4cff8a"), 3)
    D.rrect(ctx, -200, 230, 400, 180, 12, T("#15181f"), INK, 5)
    if power > 0:
        D.text(ctx, "121.5", 0, 340, 80, D.FONT_TITLE, hexrgb("#ffb03c"))
        D.text(ctx, "EMERGENCY", 0, 390, 30, D.FONT_TITLE, hexrgb("#ffb03c"))
    # пульт с РУДами
    D.poly(ctx, [(-180, 860), (-140, 520), (140, 520), (180, 860)], T("#2b2f3a"), INK, 5, wob=0)
    for k in (-1, 1):
        D.line(ctx, k * 50, 560, k * 50, 470, INK, 18)
        D.rrect(ctx, k * 50 - 30, 440, 60, 40, 12, T("#c9d0d6"), INK, 4)


def yoke(ctx, x, y, s=1.0, ang=0.0, T=lambda c: c):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.line(ctx, 0, 0, 0, 400, INK, 40)
    D.line(ctx, 0, 0, 0, 400, T("#3a3f4a"), 28)
    ctx.rotate(ang)
    D.poly(ctx, [(-150, -40), (-120, 60), (-90, 60), (-100, 0), (100, 0), (90, 60), (120, 60), (150, -40)],
           T("#2b2f3a"), INK, 6, wob=0)
    D.rect(ctx, -40, -20, 80, 40, T("#e8423c"), INK, 4, wob=0)
    ctx.restore()


def rosie_panel(ctx, x, y, s=1.0, t=0.0, power=1.0, rpm=0.0, fuel=1.0, T=lambda c: c):
    """Приборная доска «Рози»: шесть круглых стрелочных приборов, топливо, ключ."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.rrect(ctx, -620, -200, 1240, 400, 40, T("#3a3f4a"), INK, 6)
    labels = ["SPEED", "ATTITUDE", "ALT", "TURN", "HEADING", "RPM"]
    for i, lab in enumerate(labels):
        gx = -420 + (i % 3) * 280
        gy = -70 + (i // 3) * 190
        D.circle(ctx, gx, gy, 80, T("#15181f"), INK, 5)
        D.circle(ctx, gx, gy, 72, None, T("#5a606c"), 2)
        for k in range(12):
            a = k * TAU / 12
            D.line(ctx, gx + math.cos(a) * 58, gy + math.sin(a) * 58, gx + math.cos(a) * 68, gy + math.sin(a) * 68,
                   T("#f4f4f0"), 3)
        if lab == "ATTITUDE":
            ctx.save()
            ctx.arc(gx, gy, 60, 0, TAU)
            ctx.clip()
            D.rect(ctx, gx - 70, gy - 70, 140, 70, hexrgb("#2f8fd8"), None, 0, wob=0)
            D.rect(ctx, gx - 70, gy, 140, 70, hexrgb("#a86a3a"), None, 0, wob=0)
            ctx.restore()
        a = -math.pi * 0.75 + (rpm if lab == "RPM" else (0.3 + 0.1 * math.sin(t + i)) * power) * math.pi * 1.5
        D.line(ctx, gx, gy, gx + math.cos(a) * 54, gy + math.sin(a) * 54, hexrgb("#ffd23a"), 6)
        D.circle(ctx, gx, gy, 8, T("#c9d0d6"), INK, 2)
        D.text(ctx, lab, gx, gy + 40, 18, D.FONT_TITLE, T("#c9d0d6"))
    # топливо
    D.rrect(ctx, 400, -160, 160, 120, 10, T("#15181f"), INK, 4)
    D.text(ctx, "FUEL", 480, -128, 22, D.FONT_TITLE, T("#c9d0d6"))
    D.rect(ctx, 420, -110, 120 * clamp(fuel), 40, hexrgb("#4cff8a" if fuel > 0.25 else "#ff4a3a"), None, 0, wob=0)
    D.rect(ctx, 420, -110, 120, 40, None, T("#5a606c"), 2, wob=0)
    # ключ и тумблер MASTER
    D.circle(ctx, 450, 80, 30, T("#c9d0d6"), INK, 4)
    D.rect(ctx, 520, 40, 60, 90, T("#e8423c"), INK, 4, wob=0)
    D.text(ctx, "MASTER", 550, 160, 18, D.FONT_TITLE, T("#c9d0d6"))
    ctx.restore()


def sim_pod(ctx, x, gy, s=1.0, tilt=0.0, heave=0.0, T=lambda c: c, lit=1.0):
    """Тренажёр: белая капсула на шести гидравлических ногах."""
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    top = -560 - heave
    for k, lx in enumerate((-360, -180, 180, 360)):
        jx = lx * 0.7 + tilt * 200 * (1 if lx > 0 else -1) * 0.1
        D.line(ctx, lx, 0, jx, top + 160 + tilt * lx * 0.4, INK, 26)
        D.line(ctx, lx, 0, jx, top + 160 + tilt * lx * 0.4, T("#9aa3ac"), 16)
        D.line(ctx, lx, 0, lx * 0.85, -200, T("#5a606c"), 22)
        D.rect(ctx, lx - 40, -20, 80, 20, T("#5a606c"), INK, 3, wob=0)
    ctx.translate(0, top)
    ctx.rotate(tilt)
    D.rrect(ctx, -460, -380, 920, 540, 120, T("#f4f4f0"), INK, 7)
    D.rect(ctx, -460, 60, 920, 26, T(NAVY), None, 0, wob=0)
    D.rect(ctx, -460, 90, 920, 10, T(SUNC), None, 0, wob=0)
    D.rrect(ctx, 160, -260, 180, 300, 20, T("#e2e8ee"), INK, 5)
    D.text(ctx, "SIM 1", -120, -60, 90, D.FONT_TITLE, T(NAVY))
    logo(ctx, -300, -220, 60)
    if lit > 0:
        D.circle(ctx, 300, -330, 16, hexrgb("#4cff8a"), INK, 3)
    ctx.restore()


def sim_room(ctx, power=1.0, tod="night", x0=-1400, x1=4600):
    T = _T(power, tod)
    D.rect(ctx, x0, -1800, x1 - x0, FL + 1800, T("#2a3242"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 300)):
        D.line(ctx, x0 + k * 300, -1800, x0 + k * 300, FL, T("#323b4d"), 6)
    D.rect(ctx, x0 + 200, -560, 1200, 120, T(NAVY), INK, 4, wob=0)
    D.text(ctx, "PILOT TRAINING CENTER", x0 + 800, -484, 56, D.FONT_TITLE, T("#fff6d8"))
    # пульт инструктора
    D.rect(ctx, x0 + 300, FL - 260, 700, 220, T("#3a3f4a"), INK, 5, wob=0)
    for k in range(3):
        D.rrect(ctx, x0 + 340 + k * 220, FL - 420, 180, 140, 10, T("#15181f"), INK, 4)
        if power > 0:
            D.rect(ctx, x0 + 356 + k * 220, FL - 404, 148, 108, hexrgb(["#2f8fd8", "#4cff8a", "#ffb03c"][k]), None, 0,
                   wob=0, alpha=0.7)
    # мостик к капсуле
    D.rect(ctx, 2200, 120, 900, 30, T("#9aa3ac"), INK, 4, wob=0)
    for k in range(10):
        D.line(ctx, 2200 + k * 90, 120, 2200 + k * 90, 40, INK, 4)
    D.line(ctx, 2200, 40, 3100, 40, INK, 6)
    D.rect(ctx, x0, FL - 40, x1 - x0, 900, T("#4a5568"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 400)):
        D.poly(ctx, [(x0 + k * 400, FL - 40), (x0 + k * 400 + 200, FL - 40), (x0 + k * 400 + 120, FL),
                     (x0 + k * 400 - 80, FL)], T("#f2c230"), None, 0, wob=0, alpha=0.6)


# --- ангар №9 -------------------------------------------------------------------------------

HANGAR_DOOR = (1900, 3900)       # проём ворот справа


def hangar(ctx, tod="day", power=1.0, x0=-1400, x1=4600, outside=None):
    """Ангар изнутри: арочные фермы, верстак, перфопанель с инструментом, бочки, баннер."""
    T = _T(power, tod) if power > 0 else (lambda c: tone(c, tod))
    D.rect(ctx, x0, -1500, x1 - x0, FL + 1500, T("#c9d0d6"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 120)):
        D.line(ctx, x0 + k * 120, -1500, x0 + k * 120, FL, T("#bcc4ca"), 4)
    for k in range(int((x1 - x0) / 700) + 1):
        ax = x0 + k * 700
        D.curve(ctx, [(ax - 350, -300), (ax, -820), (ax + 350, -300)], T("#8f99a3"), 22)
        D.line(ctx, ax, -820, ax, -300, T("#8f99a3"), 10)
    D.line(ctx, x0, -300, x1, -300, T("#8f99a3"), 22)
    for k in range(int((x1 - x0) / 500) + 1):
        lx = x0 + 250 + k * 500
        D.line(ctx, lx, -820, lx, -420, INK, 4)
        D.poly(ctx, [(lx - 70, -420), (lx + 70, -420), (lx + 40, -380), (lx - 40, -380)], T("#e9edf0"), INK, 3,
               wob=0)
        if power > 0:
            D.poly(ctx, [(lx - 40, -380), (lx + 40, -380), (lx + 300, 600), (lx - 300, 600)], hexrgb("#fff3c8"), None,
                   0, wob=0, alpha=0.08)
    # высокие окна
    for k in range(6):
        D.rect(ctx, x0 + 200 + k * 260, -200, 180, 120, T("#9fd8ec") if tod not in NIGHT else T("#22305a"), INK, 4,
               wob=0)
    # проём ворот (что снаружи — функция outside)
    a, b = HANGAR_DOOR
    if outside:
        ctx.save()
        ctx.rectangle(a, -300, b - a, FL + 40 - (-300))
        ctx.clip()
        outside(ctx)
        ctx.restore()
    D.rect(ctx, a, -300, b - a, FL + 340, None, INK, 10, wob=0)
    # баннер
    D.rect(ctx, x0 + 150, 0, 1400, 120, T(NAVY), INK, 5, wob=0)
    D.text(ctx, "LAKESHORE FLIGHT SCHOOL", x0 + 850, 80, 62, D.FONT_TITLE, T("#fff6d8"))
    # перфопанель и инструмент
    D.rect(ctx, x0 + 200, 260, 900, 360, T("#d9b07a"), INK, 4, wob=0)
    for k in range(18):
        for j in range(7):
            D.circle(ctx, x0 + 230 + k * 48, 290 + j * 48, 4, T("#a8865a"), None, 0)
    r = rng(9)
    for k in range(8):
        tx = x0 + 260 + k * 105
        kind = k % 3
        if kind == 0:
            D.line(ctx, tx, 320, tx, 520, INK, 14)
            D.line(ctx, tx, 320, tx, 520, T("#e8423c"), 8)
        elif kind == 1:
            D.line(ctx, tx, 320, tx + 10, 500, T("#9aa3ac"), 12)
            D.circle(ctx, tx + 10, 500, 22, None, T("#9aa3ac"), 10)
        else:
            D.rect(ctx, tx - 20, 330, 40, 140, T("#f2c230"), INK, 3, wob=0)
    # верстак, ящик с инструментом, бочки
    D.rect(ctx, x0 + 150, FL - 230, 1000, 40, T("#8a5a34"), INK, 4, wob=0)
    for lx in (x0 + 180, x0 + 1100):
        D.rect(ctx, lx, FL - 190, 24, 150, T("#6a4428"), INK, 3, wob=0)
    D.rect(ctx, x0 + 1300, FL - 340, 260, 300, T("#e8423c"), INK, 5, wob=0)
    for k in range(5):
        D.line(ctx, x0 + 1300, FL - 300 + k * 55, x0 + 1560, FL - 300 + k * 55, INK, 3)
        D.rect(ctx, x0 + 1400, FL - 290 + k * 55, 60, 10, T("#c9d0d6"), None, 0, wob=0)
    for k in range(3):
        bx = x0 + 1650 + k * 110
        D.rect(ctx, bx, FL - 200, 90, 160, T(["#2f8fd8", "#3fbf6a", "#2f8fd8"][k]), INK, 4, wob=0)
        D.line(ctx, bx, FL - 150, bx + 90, FL - 150, INK, 3)
        D.line(ctx, bx, FL - 90, bx + 90, FL - 90, INK, 3)
    D.rect(ctx, x0, FL - 40, x1 - x0, 900, T("#9aa3ac"), None, 0, wob=0)
    for k in range(6):
        D.ellipse(ctx, x0 + 400 + k * 700, FL + 60 + (k % 2) * 40, 160, 20, T("#7d868f"), None, 0, alpha=0.6)


# --- бюро находок, подвал, раздевалка -------------------------------------------------------

def lost_found(ctx, power=1.0, x0=-600, x1=3800):
    T = _T(power, "night")
    D.rect(ctx, x0, -500, x1 - x0, FL + 500, T("#d8cfbc"), None, 0, wob=0)
    D.rect(ctx, x0 + 200, -160, 900, 110, T("#2f8fd8"), INK, 4, wob=0)
    D.text(ctx, "LOST & FOUND", x0 + 650, -82, 66, D.FONT_TITLE, T("#fff6d8"))
    r = rng(18)
    for row in range(4):
        sy = 40 + row * 210
        D.rect(ctx, x0 + 100, sy + 180, x1 - x0 - 200, 20, T("#8a6a4a"), INK, 3, wob=0)
        x = x0 + 130
        while x < x1 - 300:
            kind = r.randint(0, 6)
            c = T(r.choice(BAG_COLS + ["#e8c27a", "#f4f4f0"]))
            if kind == 0:   # мишка
                D.circle(ctx, x + 40, sy + 140, 36, T("#b8864a"), INK, 3)
                D.circle(ctx, x + 40, sy + 90, 26, T("#b8864a"), INK, 3)
                D.circle(ctx, x + 22, sy + 70, 10, T("#b8864a"), INK, 3)
                D.circle(ctx, x + 58, sy + 70, 10, T("#b8864a"), INK, 3)
                x += 100
            elif kind == 1:  # гитара
                D.ellipse(ctx, x + 40, sy + 140, 36, 40, T("#c9762a"), INK, 3)
                D.rect(ctx, x + 32, sy + 10, 16, 100, T("#6a4428"), INK, 3, wob=0)
                x += 100
            elif kind == 2:  # зонт
                D.line(ctx, x + 20, sy + 20, x + 40, sy + 180, INK, 6)
                D.poly(ctx, [(x, sy + 30), (x + 40, sy + 10), (x + 60, sy + 140)], c, INK, 3, wob=0)
                x += 80
            elif kind == 3:  # шляпа
                D.ellipse(ctx, x + 50, sy + 170, 50, 10, c, INK, 3)
                D.rrect(ctx, x + 20, sy + 120, 60, 50, 14, c, INK, 3)
                x += 110
            else:            # чемодан/коробка
                h = r.uniform(80, 150)
                D.rrect(ctx, x, sy + 180 - h, 90, h, 10, c, INK, 3)
                x += 110
    # каноэ на верхней полке и свадебное платье
    D.poly(ctx, [(x0 + 1700, -10), (x0 + 3100, -10), (x0 + 3000, 30), (x0 + 1800, 30)], T("#c9762a"), INK, 5, wob=0)
    D.line(ctx, x1 - 260, -40, x1 - 260, 20, INK, 4)
    D.poly(ctx, [(x1 - 300, 20), (x1 - 220, 20), (x1 - 160, 380), (x1 - 360, 380)], T("#fbfaf6"), INK, 4, wob=0)
    D.rect(ctx, x0, FL - 40, x1 - x0, 900, T("#b8a888"), None, 0, wob=0)


def basement(ctx, power=0.0, water=0.0, t=0.0, x0=-800, x1=3800, gen_on=0.0):
    T = _T(power, "deepnight")
    D.rect(ctx, x0, -1200, x1 - x0, FL + 1200, T("#4a5060"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 160)):
        for j in range(int((FL + 500) / 80)):
            D.rect(ctx, x0 + k * 160 + (j % 2) * 80, -500 + j * 80, 156, 76, T("#525a6a"), None, 0, wob=0)
    for yy, c in ((-300, "#8f99a3"), (-220, "#e8423c"), (-160, "#2f8fd8")):
        D.line(ctx, x0, yy, x1, yy, INK, 30)
        D.line(ctx, x0, yy, x1, yy, T(c), 22)
    D.rect(ctx, x0 + 200, -60, 600, 90, T("#f2c230"), INK, 4, wob=0)
    D.text(ctx, "B3 · POWER PLANT", x0 + 500, 6, 40, D.FONT_TITLE, T("#22252c"))
    # генератор
    gx = 1700
    D.rrect(ctx, gx - 600, FL - 520, 1200, 480, 30, T("#f2c230"), INK, 7)
    D.rect(ctx, gx - 560, FL - 480, 300, 200, T("#22252c"), INK, 4, wob=0)
    for k in range(8):
        D.line(ctx, gx - 540, FL - 460 + k * 24, gx - 280, FL - 460 + k * 24, T("#3a3f48"), 6)
    D.rect(ctx, gx - 200, FL - 470, 360, 140, T("#e9e4d8"), INK, 4, wob=0)
    D.text(ctx, "EMERGENCY", gx - 20, FL - 420, 40, D.FONT_TITLE, T("#e8423c"))
    D.text(ctx, "GENERATOR", gx - 20, FL - 370, 40, D.FONT_TITLE, T("#22252c"))
    D.rect(ctx, gx + 260, FL - 480, 280, 300, T("#3a3f48"), INK, 4, wob=0)
    D.circle(ctx, gx + 400, FL - 400, 40, hexrgb("#4cff8a") if gen_on > 0 else T("#2b2f3a"), INK, 4)
    D.line(ctx, gx + 600, FL - 230, gx + 700, FL - 140, INK, 6)        # шнур стартёра
    D.rrect(ctx, gx + 680, FL - 150, 60, 26, 10, T("#e8423c"), INK, 3)
    D.line(ctx, gx + 600, FL - 520, gx + 600, -300, INK, 26)
    D.line(ctx, gx + 600, FL - 520, gx + 600, -300, T("#5a606c"), 16)
    if gen_on > 0:
        for k in range(3):
            ph = (t * 1.2 + k / 3) % 1
            D.circle(ctx, gx + 600 + ph * 40, -300 - ph * 160, 30 + 40 * ph, T("#c9ccd2"), None, 0, alpha=0.5 * (1 - ph))
    D.rect(ctx, x0, FL - 40, x1 - x0, 900, T("#3e4452"), None, 0, wob=0)
    if water > 0:
        wy = FL - 40 - 140 * water
        pts = [(x0, wy + math.sin(t * 2) * 4)]
        for k in range(41):
            xx = lerp(x0, x1, k / 40)
            pts.append((xx, wy + math.sin(t * 2 + k * 0.6) * 6))
        pts += [(x1, FL + 900), (x0, FL + 900)]
        D.poly(ctx, pts, hexrgb("#2a5a7a"), None, 0, wob=0, alpha=0.75)
        D.polyline(ctx, pts[1:-2], hexrgb("#9fd8ec"), 4, 0.7)


def lockers(ctx, power=1.0, x0=-600, x1=3400):
    T = _T(power, "night")
    D.rect(ctx, x0, -500, x1 - x0, FL + 500, T("#dfe5ea"), None, 0, wob=0)
    D.rect(ctx, x0 + 200, 0, 700, 90, T(NAVY), INK, 4, wob=0)
    D.text(ctx, "CREW LOCKERS", x0 + 550, 64, 50, D.FONT_TITLE, T("#fff6d8"))
    for k in range(int((x1 - x0 - 200) / 160)):
        lx = x0 + 100 + k * 160
        D.rect(ctx, lx, 160, 150, FL - 200, T("#5f7fa8"), INK, 4, wob=0)
        for j in range(3):
            D.line(ctx, lx + 30, 200 + j * 24, lx + 120, 200 + j * 24, T("#4a6890"), 4)
        D.rect(ctx, lx + 110, 460, 14, 50, T("#c9d0d6"), INK, 2, wob=0)
        D.text(ctx, str(101 + k), lx + 75, 300, 30, D.FONT_TITLE, T("#fff6d8"))
    D.rect(ctx, x0 + 200, FL - 150, 2400, 40, T("#c9a46a"), INK, 4, wob=0)
    D.rect(ctx, x0, FL - 40, x1 - x0, 900, T("#b8c0c8"), None, 0, wob=0)


# --- вышка изнутри --------------------------------------------------------------------------

def tower_cab(ctx, tod="night", power=0.0, x0=-1200, x1=3200, view=None):
    """Кабина диспетчерской: наклонные стёкла по кругу, пульты. view(ctx) — вид наружу."""
    T = _T(power, tod) if power > 0 else (lambda c: tone(c, tod))
    ctx.save()
    ctx.rectangle(x0, -500, x1 - x0, 900)
    ctx.clip()
    if view:
        view(ctx)
    ctx.restore()
    for k in range(int((x1 - x0) / 700) + 1):
        mx = x0 + k * 700
        D.poly(ctx, [(mx - 20, -500), (mx + 20, -500), (mx + 60, 400), (mx + 20, 400)], T("#3a3f4a"), INK, 3, wob=0)
    D.rect(ctx, x0, -700, x1 - x0, 200, T("#3a3f4a"), INK, 5, wob=0)
    D.rect(ctx, x0, 400, x1 - x0, 140, T("#4a505c"), INK, 5, wob=0)
    D.rect(ctx, x0, 520, x1 - x0, FL, T("#2b2f3a"), None, 0, wob=0)
    for k in range(5):
        cx = x0 + 200 + k * 800
        D.rrect(ctx, cx, 420, 300, 90, 10, T("#15181f"), INK, 4)
        if power > 0:
            D.rect(ctx, cx + 16, 434, 268, 62, hexrgb("#4cff8a"), None, 0, wob=0, alpha=0.4)
