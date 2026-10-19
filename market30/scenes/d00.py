"""День 0: 22:50, ночная смена в Greenleaf Market. Радио, тревога на всех телефонах, Дейл опускает ставню —
первый бьётся в стекло. «Машина за магазином. Две минуты.» Он не возвращается."""
from scenes.kit import *

HERO = ST.HERO
DALE = ST.DALE
ZOMB = dict(ST.ZOMBIE, hair="#4a4a3a")


def shot(start, fn, trans="cut", tlen=0.3):
    """План, функция которого получает время сегмента T."""
    return Shot(start, lambda ctx, t, S, f=fn, s0=start: f(ctx, s0 + t, S), trans, tlen)


# --- 1. фасад ночью -----------------------------------------------------------------

SIGN = (1154, 708, 1587, 788)


def ext(ctx, T, S):
    cam = PlateCam("exterior_night", Keys((0, 1360), (5, 1368, "lin")), Keys((0, 860), (5, 820, "lin")),
                   Keys((0, 1.0), (5, 1.12, "lin")))
    with on(ctx, cam, T):
        paint(ctx, "exterior_night")
        x0, y0, x1, y1 = SIGN
        fx.glow(ctx, (x0 + x1) / 2, (y0 + y1) / 2, 380, "#7cf09a", 0.12)
        D.text(ctx, "GREENLEAF MARKET", (x0 + x1) / 2, y1 - 22, 52, "Inter", hexrgb("#f7fff4"), bold=True,
               stroke=hexrgb("#1f5a33"), slw=5, tracking=3)
    fx.rain(ctx, T, 0.55, 0.18, seed=4, alpha=0.2, speed=1.3)


# --- 2. проход 7: расставляет банки ---------------------------------------------------

AIS_HZ, AIS_A = 750, 0.21


def aisle_wide(ctx, T, S):
    l = T - S.cue(1)
    cam = PlateCam("aisle_soup", 1560, 860, Keys((0, 1.0), (8, 1.07, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "aisle_soup")
        x, gy = 1835, 1390
        r = persp(gy, AIS_A, AIS_HZ)
        # рука переставляет банки: тянется к полке, поворачивает, к следующей
        k = (l % 1.6) / 1.6
        reach = smooth(clamp(k / 0.25)) * (1 - smooth(clamp((k - 0.75) / 0.25)))
        hy = -3.35 + 0.35 * ((int(l / 1.6)) % 2)
        p = pose(l, 3, h1=(lerp(0.9, 1.75, reach), lerp(-2.6, hy, reach)), look=(0.55, 0.15), face="neutral")
        figure(ctx, x, gy, r, 1, p, HERO, tint=("#efe2c0", 0.06))


def can(ctx, x, y, s, rot, alpha=1.0):
    """Банка супа крупно: цилиндр, красно-белая этикетка; rot — поворот (0 — этикетка к зрителю)."""
    w, h = s * 0.62, s
    ink = INK
    ctx.save()
    ctx.translate(x, y)
    D.rect(ctx, -w / 2, -h / 2, w, h, hexrgb("#c7ccd2"), ink, s * 0.035, wob=0)
    D.rect(ctx, -w / 2, -h * 0.36, w, h * 0.72, hexrgb("#c23b2e"), None, 0, wob=0)
    D.rect(ctx, -w / 2, -h * 0.05, w, h * 0.3, hexrgb("#f4efe4"), None, 0, wob=0)
    # «логотип» уезжает вбок при повороте
    ctx.save()
    ctx.rectangle(-w / 2, -h / 2, w, h)
    ctx.clip()
    for k in (-1, 0, 1):
        ox = (rot + k) * w * 1.6
        sq = max(0.05, math.cos(clamp((rot + k) * 1.6, -1.5, 1.5)))
        D.ellipse(ctx, ox, -h * 0.2, w * 0.3 * sq, h * 0.09, hexrgb("#f2c84b"), ink, s * 0.02)
        D.rect(ctx, ox - w * 0.3 * sq, h * 0.04, w * 0.6 * sq, h * 0.05, hexrgb("#c23b2e"), None, 0, wob=0)
    ctx.restore()
    # блик и тень цилиндра
    D.rect(ctx, -w * 0.32, -h / 2, w * 0.1, h, hexrgb("#ffffff"), None, 0, wob=0, alpha=0.35)
    D.rect(ctx, w * 0.22, -h / 2, w * 0.28, h, hexrgb("#000000"), None, 0, wob=0, alpha=0.18)
    D.rect(ctx, -w / 2, -h / 2, w, h, None, ink, s * 0.035, wob=0)
    D.ellipse(ctx, 0, -h / 2, w / 2, h * 0.07, hexrgb("#d9dde2"), ink, s * 0.03)
    ctx.restore()


def aisle_close(ctx, T, S):
    l = T - (S.word("soup", S.cue(1)) - 0.18)
    t_label = S.word("label", S.cue(1)) - 0.1
    cam = PlateCam("aisle_soup", 2150, 760, Keys((0, 1.75), (4, 1.82, "lin")))
    blur_plate(ctx, "aisle_soup", cam, l, 0.6)
    x, gy, r = 760, H + 610, 205
    rot = 0.0 if T > t_label else 0.9 * (1 - smooth(clamp((T - (t_label - 1.2)) / 1.2)))
    cx, cy = 1150, 640
    p = pose(T, 3, h1=((cx - 40 - x) / r, (cy + 60 - gy) / r), h2=((cx + 30 - x) / r, (cy + 120 - gy) / r),
             look=(0.7, 0.35), face="happy" if T > t_label + 0.2 else "neutral")
    figure(ctx, x, gy, r, 1, p, HERO, tint=("#efe2c0", 0.05))
    can(ctx, cx, cy, 300, rot)
    # пальцы поверх банки
    for (dx, dy) in ((-95, 50), (-90, 105), (95, 115)):
        D.circle(ctx, cx + dx, cy + dy, 13, INK, None, 0)


# --- 3. кассы: Дейл считает выручку, радио играет -------------------------------------

CNT = [(1345, 1045), (1640, 1048), (1900, 1095), (1900, 1430), (1345, 1430)]
DALE_X, DALE_GY, DALE_R = 1700, 1272, 86


def dale_till(ctx, T, l, face="neutral", look=(0.6, 0.35), counting=True):
    k = (l * 2.2) % 1.0
    flick = math.sin(k * TAU) if counting else 0.0
    p = pose(T, 7, h1=(1.25 + 0.08 * flick, -2.75 - 0.05 * flick), h2=(1.0, -2.6), look=look, face=face)
    J = figure(ctx, DALE_X, DALE_GY, DALE_R, -1, p, DALE, tint=("#f0dcb0", 0.07))
    # пачка купюр в руках
    hx, hy = at(J, DALE_X, DALE_GY, DALE_R, -1, "h2")
    for j in range(3):
        bill(ctx, hx - 20, hy - 4, 0.25 - j * 0.22)
    if counting and k < 0.5:
        hx1, hy1 = at(J, DALE_X, DALE_GY, DALE_R, -1, "h1")
        bill(ctx, hx1, hy1 - 6 - 10 * math.sin(k * TAU), -0.5 + 0.4 * k)
    mask_bg(ctx, "checkout", CNT)


def bill(ctx, x, y, ang):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    D.rect(ctx, -26, -12, 52, 24, hexrgb("#b9d9a3"), INK, 2.5, wob=0)
    D.ellipse(ctx, 0, 0, 7, 8, None, hexrgb("#5f8d4e"), 2)
    ctx.restore()


def checkout_wide(ctx, T, S):
    l = T - S.cue(2)
    cam = PlateCam("checkout", 1400, 900, Keys((0, 1.0), (4, 1.05, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "checkout")
        dale_till(ctx, T, l)


def notes(ctx, T, t0, t1, x, y, n=6, s=46):
    """Ноты плывут из угла (радио над динамиками), исчезают в t1."""
    for i in range(n):
        u = ((T - t0) * 0.28 + i / n) % 1.0
        a = clamp((T - t0) / 0.5) * math.sin(u * math.pi) * (1 - clamp((T - t1) / 0.12))
        if a <= 0.01:
            continue
        nx = x - u * 520 + math.sin(u * 9 + i) * 40
        ny = y + u * 260 + math.cos(u * 7 + i) * 20
        note(ctx, nx, ny, s * (0.8 + 0.3 * (i % 2)), a * 0.85, double=i % 2 == 0)


def checkout_med(ctx, T, S):
    t_cut = S.word("cuts", S.cue(3))
    l = T - S.cue(2)
    cam = PlateCam("checkout", 1640, 860, Keys((0, 1.9), (9, 2.0, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "checkout")
        if T < t_cut:
            face, look = ("angry" if T > S.word("nobody", S.cue(2)) - 0.3 else "neutral"), (0.6, 0.35)
        else:
            face, look = "worried", (0.25, -0.75)
        if S.word("likes", S.cue(2)) - 0.6 < T < t_cut:
            look = (0.3, -0.7)
        dale_till(ctx, T, l, face, look, counting=T < t_cut + 0.2)
    notes(ctx, T, S.cue(2) + 3.5, t_cut, 1650, 120)


# --- 4. все телефоны разом ----------------------------------------------------------

def phone_close(ctx, T, S):
    t0 = S.word("every", S.cue(3))
    l = T - t0
    cam = PlateCam("aisle_soup", 1500, 820, Keys((0, 1.45), (4, 1.52, "lin")))
    blur_plate(ctx, "aisle_soup", cam, l, 0.7, darken=0.12)
    x, gy, r = 820, H + 640, 215
    lift = smooth(clamp(l / 0.45))
    px, py = lerp(1000, 1130, lift), lerp(1250, 700, lift)
    jit = math.sin(T * 90) * 4 if l > 0 else 0
    p = pose(T, 3, h1=((px - 30 - x) / r, (py + 70 - gy) / r), h2=((px + 10 - x) / r, (py + 120 - gy) / r),
             look=(0.6, 0.55), face="shock" if l > 0.8 else "worried", sweat=l > 1.6)
    fx.glow(ctx, px, py, 650, "#ff3a2a", 0.22 * lift)
    figure(ctx, x, gy, r, 1, p, HERO, tint=("#ff6a50", 0.1 * lift))
    phone(ctx, px + jit, py, 110, -0.15, glow=lift * (0.75 + 0.25 * math.sin(T * 12)))
    for (dx, dy) in ((-70, 60), (-66, 110), (60, 125)):
        D.circle(ctx, px + dx + jit, py + dy, 13, INK, None, 0)


def alert_screen(ctx, T, S):
    """Экран телефона крупно: строки тревоги появляются под голос."""
    l = T - (S.cue(4) - 0.35)
    cam = PlateCam("aisle_soup", 1500, 820, 1.5)
    blur_plate(ctx, "aisle_soup", cam, 0, 0.85, darken=0.45)
    jit = math.sin(T * 80) * 5 * (1 - clamp(l / 0.8))
    s = 1.0 + 0.03 * clamp(l / 7)
    ctx.save()
    ctx.translate(W / 2 + jit, H / 2 + 40)
    ctx.scale(s, s)
    fx.glow(ctx, 0, 0, 900, "#ff3a2a", 0.18)
    # рука снизу
    D.line(ctx, -250, 700, -160, 330, INK, 22)
    D.line(ctx, 250, 700, 200, 340, INK, 22)
    D.rrect(ctx, -290, -560, 580, 1120, 64, hexrgb("#202128"), INK, 10)
    D.rrect(ctx, -262, -530, 524, 1060, 46, hexrgb("#14161d"), None, 0)
    D.rrect(ctx, -60, -512, 120, 26, 13, hexrgb("#000000"), None, 0)
    D.text(ctx, "10:52", 0, -380, 120, "Inter", hexrgb("#e9e9ee"), bold=True)
    # карточка тревоги
    pop = ease_out_back(clamp(l / 0.35))
    ctx.save()
    ctx.translate(0, -180)
    ctx.scale(pop, pop)
    D.rrect(ctx, -235, -70, 470, 560, 30, hexrgb("#f3f1ee"), None, 0)
    D.rrect(ctx, -235, -70, 470, 110, 30, hexrgb("#c8392f"), None, 0)
    D.rect(ctx, -235, 0, 470, 40, hexrgb("#c8392f"), None, 0, wob=0)
    warn(ctx, -180, -10, 30)
    D.text(ctx, "EMERGENCY ALERT", -135, 2, 34, "Inter", hexrgb("#ffffff"), align="left", bold=True)
    lines = [("Stay indoors.", "stay"), ("Lock your doors.", "lock"), ("Do not let", "let"), ("anyone in.", "let"),
             ("Do not help", "help"), ("the injured.", "help")]
    for i, (txt, w) in enumerate(lines):
        tw = S.word(w, S.cue(4)) - 0.08
        a = clamp((T - tw) / 0.18)
        if a > 0:
            D.text(ctx, txt, -200, 110 + i * 64 + (i >= 2) * 18 + (i >= 4) * 18, 40, "Inter", hexrgb("#1d1e22"),
                   align="left", bold=i >= 4, alpha=a)
    ctx.restore()
    ctx.restore()


# --- 5. ставня, удар в стекло --------------------------------------------------------

DR_HZ, DR_A = 700, 0.133
SH_X0, SH_X1 = 598, 2098           # ширина ставни (пиксели фона)
SH_TOP = 448                       # нижний край нарисованной ставни
WIN = (118, 420, 505, 1082)        # левое окно: снаружи появляется он


def shutter(ctx, yb):
    """Дорисованные ламели ставни от нарисованного края до yb."""
    if yb <= SH_TOP:
        return
    D.rect(ctx, SH_X0, SH_TOP, SH_X1 - SH_X0, yb - SH_TOP, hexrgb("#8e959b"), None, 0, wob=0)
    y = SH_TOP + 26
    while y < yb - 8:
        D.line(ctx, SH_X0, y, SH_X1, y, hexrgb("#5f666d"), 4)
        D.line(ctx, SH_X0, y + 5, SH_X1, y + 5, hexrgb("#b5bcc1"), 3)
        y += 30
    D.rect(ctx, SH_X0 - 4, yb - 30, SH_X1 - SH_X0 + 8, 34, hexrgb("#6c737a"), INK, 6, wob=0)
    D.rrect(ctx, (SH_X0 + SH_X1) / 2 - 60, yb - 22, 120, 16, 8, hexrgb("#3b3f44"), None, 0)
    D.line(ctx, SH_X0, SH_TOP, SH_X0, yb, INK, 6)
    D.line(ctx, SH_X1, SH_TOP, SH_X1, yb, INK, 6)


def shutter_y(T, S):
    t0 = S.word("pulls", S.cue(5)) - 0.1
    k = clamp((T - t0) / 1.3)
    # рывками: два коротких рывка и до упора
    e = 0.35 * smooth(clamp(k / 0.35)) + 0.65 * smooth(clamp((k - 0.42) / 0.58))
    return lerp(770, 935, e)


def zombie_at_glass(ctx, T, t_hit, x=318, gy=1300, r=100, pressed=1.0):
    """Снаружи за левым окном: выныривает из темноты и бьёт ладонями по стеклу."""
    k = clamp((T - (t_hit - 0.16)) / 0.16)
    if k <= 0:
        return
    x0, y0, x1, y1 = WIN
    ctx.save()
    ctx.rectangle(x0, y0, x1 - x0, y1 - y0)
    ctx.clip()
    sc = lerp(0.82, 1.0, ease_out(k))
    rr = r * sc
    p = ST.front(T, 11)
    hit = clamp((T - t_hit) / 0.12)
    up = lerp(-5.2, -6.25, ease_out(k))
    sway = math.sin(T * 3.1) * 0.08 * clamp((T - t_hit - 0.5) / 0.4)
    p.update(h1=(0.95 + sway, up + 0.1 * hit), h2=(-0.95 + sway, up - 0.15 + 0.1 * hit), face="neutral",
             mouth=0.7 + 0.3 * math.sin(T * 6), look=(0.0, 0.1), tilt=0.06 * math.sin(T * 2.3))
    J = ST.draw(ctx, x, gy, rr, 1, p, dict(ZOMB, tint=("#2a3a52", 0.18)), alpha=k)
    # ладони прижаты к стеклу
    if T >= t_hit:
        for hk in ("h1", "h2"):
            hx, hy = ST.world(x, gy, rr, 1, J[hk])
            D.ellipse(ctx, hx, hy - 6, 26, 32, hexrgb("#7f8a72"), INK, 4)
            for fi in range(4):
                fx_ = hx - 18 + fi * 12
                D.line(ctx, fx_, hy - 30, fx_ + (fi - 1.5) * 3, hy - 58, INK, 10)
                D.line(ctx, fx_, hy - 30, fx_ + (fi - 1.5) * 3, hy - 58, hexrgb("#7f8a72"), 5)
    ctx.restore()
    # стекло: блики и дрожь от удара
    a = 0.16 + 0.25 * (1 - clamp((T - t_hit) / 0.5)) * (T >= t_hit)
    for j in range(3):
        xx = x0 + 60 + j * 130
        D.poly(ctx, [(xx, y0), (xx + 40, y0), (xx - 160, y1), (xx - 200, y1)], hexrgb("#dfe9f2"), None, 0, wob=0,
               alpha=a * (0.6 if j == 1 else 0.35))


def doors(ctx, T, S):
    t_hit = S.word("hits", S.cue(5))
    l = T - (S.cue(5) - 0.25)
    sx, sy = shake(T, t_hit, 20, 0.6)
    cam = PlateCam("doors_front", Keys((0, 1240), (6, 1200, "lin")), Keys((0, 900), (6, 880, "lin")),
                   Keys((0, 1.0), (6, 1.05, "lin")))
    ctx.save()
    ctx.translate(sx, sy)
    with on(ctx, cam, l):
        paint(ctx, "doors_front")
        zombie_at_glass(ctx, T, t_hit)
        yb = shutter_y(T, S)
        shutter(ctx, yb)
        # Дейл со спины тянет ставню; после удара оборачивается
        dx, dgy = 1350, 1425
        dr = persp(dgy, DR_A, DR_HZ)
        if T < t_hit + 0.25:
            p = ST.front(T, 7)
            p.update(view="back", h1=(1.15, -(dgy - yb + 4) / dr), h2=(-1.15, -(dgy - yb + 4) / dr))
            p["hip"] = (0.0, ST.HIP_H - 0.25 * clamp((yb - 780) / 155))
            figure(ctx, dx, dgy, dr, 1, p, DALE, tint=("#f0dcb0", 0.06))
        else:
            f, view = ST.turn(T, t_hit + 0.25, 1, -1, 0.2)
            p = pose(T, 7, face="shock", look=(0.6, 0.0), view=view)
            if view == "front":
                p.update(ST.front(T, 7))
                p.update(face="shock", look=(-0.3, 0.0))
            p.update(h1=(0.6, -3.9), h2=(-0.2, -2.6))
            figure(ctx, dx, dgy, dr, -1 if view == "side" else 1, p, DALE, tint=("#f0dcb0", 0.06))
        # герой слева: смотрит на Дейла, на удар — подпрыгивает и оборачивается к окну
        hx, hgy = 790, 1505
        hr = persp(hgy, DR_A, DR_HZ)
        jump = math.sin(clamp((T - t_hit) / 0.32) * math.pi) * 0.45 if T > t_hit else 0.0
        f, view = ST.turn(T, t_hit + 0.05, 1, -1, 0.18)
        p = pose(T, 3, face="worried" if T < t_hit else "scared", look=(0.5, -0.1), view=view,
                 sweat=T > t_hit + 0.6)
        if view == "front":
            p.update(ST.front(T, 3))
            p.update(face="scared", look=(-0.4, 0.0))
        if T > t_hit:
            p.update(h1=(0.9, -4.3), h2=(0.4, -4.0))
            if view == "side":
                p.update(f1=(0.15, 0.0), f2=(-0.55, 0.0), lean=-0.12)
        figure(ctx, hx, hgy - jump * hr, hr, f, p, HERO, tint=("#f0dcb0", 0.06))
    ctx.restore()


def zombie_close(ctx, T, S):
    """Крупно: он прижался к стеклу, рот открывается, по стеклу дождь."""
    t_hit = S.word("hits", S.cue(5))
    l = T - (t_hit + 0.45)
    cam = PlateCam("doors_front", 318, 690, Keys((0, 2.75), (1.3, 2.9, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "doors_front")
        zombie_at_glass(ctx, T, t_hit)
    x0, y0 = cam.to_screen(l, WIN[0], WIN[1])
    x1, y1 = cam.to_screen(l, WIN[2], WIN[3])
    fx.drops_on_glass(ctx, T, (x0, y0, x1 - x0, y1 - y0), seed=5, n=40, alpha=0.35)


# --- 6. ключи: «Машина за магазином. Две минуты.» -------------------------------------

def keys_talk(ctx, T, S):
    l = T - (S.cue(6) - 0.3)
    t_grab = S.word("grabs", S.cue(6))
    t_toss = S.word("car's", S.cue(6)) + 0.1
    t_two = S.word("two", S.cue(6))
    cam = PlateCam("doors_front", 1240, 1010, Keys((0, 1.42), (5, 1.47, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "doors_front")
        zombie_at_glass(ctx, T, -10)
        shutter(ctx, 935)
        dx, dgy = 1520, 1440
        dr = persp(dgy, DR_A, DR_HZ)
        hx, hgy = 860, 1470
        hr = persp(hgy, DR_A, DR_HZ)
        talking = (S.word("my", S.cue(6)) <= T <= S.word("says", S.cue(6)) + 0.1) or (t_two <= T <= t_two + 0.75)
        lift = smooth(clamp((T - t_grab) / 0.3))
        throw = smooth(clamp((T - t_toss) / 0.25))
        p = pose(T, 7, face="talk" if talking else "worried", look=(0.55, 0.0),
                 h1=(lerp(0.4, 1.4, lift) + 0.4 * throw, lerp(-2.4, -4.3, lift) + 0.4 * throw), h2=(-0.1, -2.4))
        if T > t_two - 0.15:
            p["h2"] = (0.9, -5.7)
        J = figure(ctx, dx, dgy, dr, -1, p, DALE, tint=("#f0dcb0", 0.06))
        if T > t_two - 0.15:
            fx_, fy_ = at(J, dx, dgy, dr, -1, "h2")
            for a in (-0.28, 0.12):
                D.line(ctx, fx_, fy_, fx_ - math.sin(a) * 52, fy_ - math.cos(a) * 52, INK, 12)
        # связка ключей: в руке Дейла → летит герою
        k1 = at(J, dx, dgy, dr, -1, "h1")
        catch = clamp((T - t_toss) / 0.55)
        hp = pose(T, 3, face="worried" if catch < 1 else "scared", look=(0.5, -0.05 if catch < 1 else 0.3),
                  h1=(lerp(0.3, 1.5, smooth(clamp((T - t_toss) / 0.3))), lerp(-2.4, -3.6, smooth(clamp((T - t_toss) / 0.3)))))
        HJ = figure(ctx, hx, hgy, hr, 1, hp, HERO, tint=("#f0dcb0", 0.06))
        k2 = at(HJ, hx, hgy, hr, 1, "h1")
        if T < t_grab:
            pass
        elif catch <= 0:
            keyring(ctx, k1[0], k1[1] + 30, 46, T, 1.0)
        elif catch < 1:
            e = smooth(catch)
            kx, ky = lerp(k1[0], k2[0], e), lerp(k1[1], k2[1], e) - math.sin(e * math.pi) * 140
            keyring(ctx, kx, ky + 30, 46, T * 2, 1.0)
        else:
            keyring(ctx, k2[0], k2[1] + 30, 46, T, 0.6)


# --- 7. склад: бежит к задней двери -------------------------------------------------

STK_HZ, STK_A = 700, 0.188
DOOR = (1676, 470, 1952, 942)        # правая створка (x0, y0, x1, y1)


def back_door(ctx, T, open_k):
    """Правая створка распахивается наружу: видна ночь с дождём."""
    if open_k <= 0:
        return
    x0, y0, x1, y1 = DOOR
    w = x1 - x0
    lx = x0 + w * (1 - math.cos(open_k * 1.25)) * 0.95
    D.rect(ctx, x0, y0, lx - x0 + 4, y1 - y0, hexrgb("#0b1220"), None, 0, wob=0)
    ctx.save()
    ctx.rectangle(x0, y0, lx - x0 + 4, y1 - y0)
    ctx.clip()
    D.rect(ctx, x0, y1 - 90, w, 90, hexrgb("#1c2433"), None, 0, wob=0)
    fx.rain(ctx, T, 0.4, 0.15, seed=9, alpha=0.35, rect=(x0, y0, w, y1 - y0))
    ctx.restore()
    D.poly(ctx, [(lx, y0 - 10 * open_k), (x1, y0), (x1, y1), (lx, y1 + 10 * open_k)], hexrgb("#7d838c"), INK, 6,
           wob=0)


def stock_run(ctx, T, S):
    t0 = S.cue(6, end=True) + 0.08
    l = T - t0
    cam = PlateCam("stockroom", 1500, 900, 1.08)
    T_RUN = 1.25
    k = clamp(l / T_RUN)
    e = ease_in(k) * 0.3 + k * 0.7
    x = lerp(2650, 1760, e)
    gy = lerp(1420, 948, e)
    r = persp(gy, STK_A, STK_HZ)
    open_k = smooth(clamp((l - (T_RUN - 0.2)) / 0.2)) * (1 - smooth(clamp((l - (T_RUN + 0.45)) / 0.12)))
    with on(ctx, cam, l):
        paint(ctx, "stockroom")
        back_door(ctx, T, open_k)
        if l < T_RUN + 0.15:
            p = pose(T, 7, face="scared", look=(0.5, 0.0))
            p.update(ST.gait(l * 2.4, run=True))
            figure(ctx, x, gy, r, -1, p, DALE, tint=("#c7cdd8", 0.1), alpha=1 - clamp((l - T_RUN) / 0.15))


def stock_wait(ctx, T, S):
    l = T - (S.cue(7) - 0.3)
    cam = PlateCam("stockroom", 1450, 880, Keys((0, 1.12), (2, 1.16, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "stockroom")
        x, gy = 1230, 1390
        r = persp(gy, STK_A, STK_HZ)
        p = pose(T, 3, face="worried", look=(0.6, -0.15), h1=(0.35, -2.5), h2=(0.0, -2.6), sweat=True)
        figure(ctx, x, gy, r, 1, p, HERO, tint=("#c7cdd8", 0.1))


def key_close(ctx, T, S):
    l = T - S.word("you", S.cue(7))
    cam = PlateCam("stockroom", 1500, 900, 1.5)
    blur_plate(ctx, "stockroom", cam, 0, 0.75, darken=0.1)
    hx, hy = 1010, 520 + 6 * math.sin(T * 2)
    D.line(ctx, 520, H + 40, hx - 20, hy + 40, INK, 26)
    D.circle(ctx, hx, hy, 26, INK, None, 0)
    keyring(ctx, hx, hy + 70, 150, T, 0.5)


# --- 8. весь магазин сверху -----------------------------------------------------------

def overhead(ctx, T, S):
    t0 = S.word("store", S.cue(7)) - 0.25
    l = T - t0
    cam = PlateCam("overhead2", Keys((0, 1420), (3.5, 1380, "io")), Keys((0, 1180), (3.5, 900, "io")),
                   Keys((0, 2.2), (3.5, 1.0, "io")))
    with on(ctx, cam, l):
        paint(ctx, "overhead2")
        p = pose(T, 3, face="worried", look=(0.2, -0.4))
        figure(ctx, 1405, 1290, 34, 1, p, HERO, tint=("#efe2c0", 0.05))


def store_card(ctx, T, S):
    l = T - (S.cue(7, end=True) + 0.25)
    CD.rule_card(ctx, l, CD.icon_store, "GREENLEAF MARKET", "40,000 square feet of food.\nOne night stocker.")


def build(S):
    c = S.cue
    w = S.word
    t_soup = w("soup", c(1)) - 0.18
    t_med = w("the", c(2) + 1.5) - 0.12            # «The radio…»
    t_phone = w("every", c(3)) - 0.15
    t_store = w("store", c(7)) - 0.25
    t_you = w("you", c(7)) - 0.1
    S.shots = [
        shot(0, ext),
        shot(c(1) - 0.3, aisle_wide),
        shot(t_soup, aisle_close),
        shot(c(2) - 0.25, checkout_wide),
        shot(t_med, checkout_med),
        shot(t_phone, phone_close),
        shot(c(4) - 0.35, alert_screen),
        shot(c(5) - 0.25, doors),
        shot(w("hits", c(5)) + 0.45, zombie_close),
        shot(w("hits", c(5)) + 1.75, doors),
        shot(c(6) - 0.3, keys_talk),
        shot(c(6, end=True) + 0.08, stock_run),
        shot(c(7) - 0.3, stock_wait),
        shot(t_you, key_close),
        shot(t_store, overhead),
        shot(c(7, end=True) + 0.25, store_card, "fade", 0.3),
    ]
    t_cut = w("cuts", c(3))
    t_hit = w("hits", c(5))
    t_run = c(6, end=True) + 0.08
    S.amb = [(0, c(1) - 0.3, "rain_loop", 0.7), (c(1) - 0.3, c(5) - 0.25, "store_hum", 0.5),
             (c(1) - 0.3, t_cut + 0.05, "muzak", 0.32),
             (c(5) - 0.25, t_run, "rain_loop", 0.45), (c(5) - 0.25, S.dur, "store_hum", 0.4),
             (t_run + 1.0, t_run + 1.9, "rain_loop", 0.5)]
    S.sfx = [(t_cut + 0.03, "radio_cut", 0.6),
             (w("label", c(1)) - 0.15, "can_turn", 0.5),
             (w("every", c(3)) - 0.08, "eas_many", 0.75), (c(4) - 0.3, "eas", 0.35),
             (w("pulls", c(5)) - 0.1, "shutter", 0.7),
             (t_hit, "glass_slap", 0.95), (t_hit + 0.35, "zombie_groan", 0.55),
             (w("grabs", c(6)), "keys", 0.6), (w("car's", c(6)) + 0.1, "toss", 0.6),
             (t_run, "running", 0.55), (t_run + 1.05, "door_bang", 0.4), (t_run + 1.72, "door_bang", 0.85),
             (c(7, end=True) + 0.25, "card", 0.6)]
    S.music = [(t_cut + 0.6, c(7) - 0.3, "dread", 0.75), (c(7) - 0.3, S.dur, "lonely", 0.6)]
