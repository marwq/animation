"""День 1: облёт Манхэттена, толпы на 34-й улице, проход камеры сквозь стекло,
уборщик в наушниках, вежливые двери, огнетушитель, баррикада."""
from scenes.kit import *
from scenes.cold import barricade

ENT_H = 420.0


def es(y):
    """Масштаб у входа (изнутри)."""
    return depth_s(y, ENT_H, 770, 66)


# --- улица сверху -----------------------------------------------------------

def _sky(ctx):
    C.sky(ctx, -4000, -3500, 10000, 5200, "dusk")
    C.clouds(ctx, -2500, -1800, 6000, seed=4, color="#f0b8a0", alpha=0.35, n=9, scale=2.2)


def _far(ctx):
    C.skyline(ctx, -3000, 5000, 640, "dusk", depth=0, seed=31, lit=0.15, esb_x=1750, hmin=200, hmax=560)


def _mid(ctx):
    C.skyline(ctx, -3000, 5000, 820, "dusk", depth=1, seed=37, lit=0.25, hmin=160, hmax=480)


def _street(ctx):
    # дома по бокам от ТЦ
    for k, (x, w, h, c) in enumerate([(-1500, 520, 1500, "#8a6f7a"), (-980, 420, 1250, "#9a7f70"),
                                      (-560, 770, 1100, "#7f7088"), (1710, 600, 1350, "#86707e"),
                                      (2310, 480, 1550, "#957a6f"), (2790, 700, 1200, "#7d6f86")]):
        C.building(ctx, x, 1000, w, h, hexrgb(c), lit=0.35, seed=70 + k, top="step" if k % 2 else "flat")
    CITY.mall_facade(ctx, 960, 1000, "dusk", lights_on=1.0)
    CITY.street(ctx, -1600, 3600, 1000, "dusk", seed=9)
    CITY.subway_entrance(ctx, -260, 1040, 0.9)
    CITY.subway_entrance(ctx, 2200, 1040, 0.9)


STREET_CROWD = None
FG_CROWD = None


def crowds():
    global STREET_CROWD, FG_CROWD
    if STREET_CROWD is None:
        a = make_crowd(101, 70, -1200, 3200, 1045, 1250, 30, 52, vx=(-30, 30))
        b = make_crowd(102, 45, -1200, 3200, 1250, 1460, 52, 80, vx=(-25, 25))
        c = make_crowd(103, 16, 500, 1450, 1030, 1060, 30, 33, vx=(0, 0), face=1)
        STREET_CROWD = sorted(a + b + c, key=lambda m: m.y)
        FG_CROWD = make_crowd(104, 9, -1400, 3400, 1620, 1700, 150, 170, vx=(-70, 70))
    return STREET_CROWD, FG_CROWD


def shot_aerial(ctx, t, S):
    d = S.cue(1) - 0.15
    cam = Cam(Keys((0, 960), (d, 960)),
              Keys((0, -900), (2.6, 640), (d - 0.15, 905, "in")),
              Keys((0, 0.55), (2.6, 0.62), (d - 0.15, 3.3, "in")),
              anchor=(960, 640))
    crowd, fg = crowds()
    with layer(ctx, cam, t, 0.08):
        bg(ctx, "d01_sky", (-4000, -3500, 10000, 5200), _sky, scale=0.5)
    with layer(ctx, cam, t, 0.35):
        bg(ctx, "d01_far", (-3000, -700, 8000, 1400), _far, scale=0.6)
    with layer(ctx, cam, t, 0.6):
        bg(ctx, "d01_mid", (-3000, -200, 8000, 1100), _mid, scale=0.7)
    with layer(ctx, cam, t):
        bg(ctx, "d01_street", (-1700, -700, 5400, 2300), _street, scale=1.0)
        # у дверей — Статуя Свободы подходит к входу
        draw_crowd(ctx, crowd, t)
        lib = Walk(Keys((0, 760), (6, 900)), 1032, 31, "shamble", t1=8)
        lib.draw(ctx, LIBERTY, t)
    with layer(ctx, cam, t, 1.35):
        draw_crowd(ctx, fg, t)
    fx.grade(ctx, "dusk", 0.55)
    # переход сквозь стекло
    fx.flash(ctx, clamp((t - (d - 0.45)) / 0.45) * 0.55, "#f6e6c8")


# --- вход изнутри ----------------------------------------------------------------

OUT_CROWD = None


def out_crowd():
    global OUT_CROWD
    if OUT_CROWD is None:
        far = make_crowd(201, 80, -500, 2400, 650, 720, 16, 34, vx=(-15, 15))
        near = make_crowd(202, 22, -400, 2300, 725, 752, 40, 52, vx=(-10, 10))
        OUT_CROWD = far + near
    return OUT_CROWD


def entrance_scene(ctx, t, cam, doors=0.0, sensor=1.0, crowd_k=1.0, lights=1.0, extra_out=None, tod="dusk",
                   barr=0.0):
    with layer(ctx, cam, t):
        bg(ctx, "ent_out_" + tod, (-600, -200, 3120, 1000), lambda c: M.entrance_outside(c, tod, lit=0.2))
        crowd = out_crowd()
        n = int(len(crowd) * crowd_k)
        draw_crowd(ctx, crowd[:n], t)
        if extra_out:
            extra_out(ctx)
        M.entrance_glass(ctx, doors, sensor=sensor, tint=0.26)
        bg(ctx, "ent_in_%.1f" % lights, (-600, -100, 3120, 1700), lambda c: M.entrance_interior(c, tod, lights))
        if barr > 0:
            barricade(ctx, t, barr)


def headphones(ctx, J, on=True):
    """Наушники-вкладыши и провод (локальные координаты)."""
    hx, hy = J["head"]
    D.col(ctx, hexrgb("#f4f4f0"))
    ctx.arc(hx - 0.42, hy + 0.08, 0.07, 0, TAU)
    ctx.fill()
    if on:
        D.col(ctx, hexrgb("#f4f4f0"))
        ctx.set_line_width(0.025)
        ctx.move_to(hx - 0.42, hy + 0.12)
        ctx.curve_to(hx - 0.35, hy + 0.7, hx - 0.1, hy + 0.9, J["top"][0] - 0.05, J["top"][1] + 0.6)
        ctx.stroke()


def music_notes(ctx, x, y, t, s=1.0, alpha=1.0):
    for k in range(3):
        ph = (t * 0.6 + k / 3) % 1.0
        nx = x + (k - 1) * 40 * s + math.sin(ph * 6) * 10 * s
        ny = y - ph * 120 * s
        a = alpha * (1 - ph)
        D.ellipse(ctx, nx, ny, 9 * s, 7 * s, D.INK, None, 0, alpha=a, rot=-0.4)
        D.line(ctx, nx + 8 * s, ny, nx + 8 * s, ny - 34 * s, D.INK, 3 * s, alpha=a)


def janitor_pose(t, dance=1.0):
    """Уборщик моет пол в наушниках и пританцовывает (вид спереди)."""
    p = R.stand("front", t, 1)
    sw = math.sin(t * TAU * 0.9)
    bob = abs(math.sin(t * TAU * 1.0))
    p["hip"] = (0.05 * sw * dance, -0.05 * bob * dance)
    p["neck"] = 0.12 * math.sin(t * TAU * 1.0) * dance
    p["htilt"] = 0.12 * math.sin(t * TAU * 0.5) * dance
    p["face"] = "happy"
    lift = max(0, math.sin(t * TAU * 0.5)) * 0.12 * dance
    lift2 = max(0, -math.sin(t * TAU * 0.5)) * 0.12 * dance
    p["f1"] = (-0.18, -lift)
    p["f2"] = (0.18, -lift2)
    mx = 0.35 * sw
    p["h1"] = (mx - 0.05, -2.05)
    p["h2"] = (mx + 0.12, -1.55)
    return p


def mop_front(ctx, J, t):
    """Швабра в анфас: от рук к полу, тряпка гуляет по полу."""
    h1, h2 = J["hand1"], J["hand2"]
    sw = math.sin(t * TAU * 0.9)
    foot = (h2[0] + 0.25 + 0.15 * sw, -0.02)
    D.line(ctx, h1[0] - 0.05, h1[1] - 0.3, foot[0], foot[1] - 0.15, hexrgb("#a5764a"), 0.08)
    D.rect(ctx, foot[0] - 0.32, foot[1] - 0.16, 0.64, 0.14, hexrgb("#d9d2c2"), D.INK, 0.03, wob=0)
    D.ellipse(ctx, foot[0], foot[1] + 0.02, 0.5, 0.05, hexrgb("#bcd2dc"), None, 0, alpha=0.5)


def shot_inside(ctx, t, S):
    """Проход сквозь стекло и отъезд: внутри светло, один уборщик в наушниках."""
    cam = Cam(Keys((0, 960), (1.6, 1120), (4.5, 1200)), Keys((0, 560), (1.6, 640), (4.5, 660)),
              Keys((0, 2.6), (1.6, 1.3, "io3"), (4.5, 1.42)))

    def gus_out(c):
        pass

    entrance_scene(ctx, t, cam, doors=0.0, crowd_k=0.25)
    with layer(ctx, cam, t):
        # Гас уходит на заднем плане и машет
        gw = Walk(Keys((0, 600), (4.5, 1900)), 815, es(815), "walk", t1=6)
        extra = {"a1": (2.6 + 0.3 * math.sin(t * 9), 0.3), "hturn": 0.3} if 0.8 < t < 2.4 else None
        gw.draw(ctx, GUS, t, extra)
        hx, hy = 1350, 960
        p = janitor_pose(t)
        HERO.draw(ctx, hx, hy, es(hy), 1, p,
                  extra=lambda c, J, l: (mop_front(c, J, t) if l == "back" else headphones(c, J) if l == "front" else None))
        music_notes(ctx, hx + 90, hy - es(hy) * 4.2, t, 1.0)
    fx.grade(ctx, "warm", 0.25)
    fx.flash(ctx, (1 - clamp(t / 0.4)) * 0.55, "#f6e6c8")


def shot_look_out(ctx, t, S):
    """Со спины: герой поднимает глаза — улица полна."""
    cam = Cam(960, Keys((0, 600), (3, 570)), Keys((0, 1.0), (3, 1.12)))
    entrance_scene(ctx, t, cam, crowd_k=1.0)
    with layer(ctx, cam, t):
        p = R.stand("back", t, 2)
        k = smooth((t - 0.6) / 0.4)
        p["a1"] = (0.1 + 2.3 * k, 0.6 * k)       # тянется к наушнику
        p["neck"] = -0.1 * k
        HERO.draw(ctx, 1180, 1220, 175, 1, p)
    fx.grade(ctx, "warm", 0.2)


def shot_doors_polite(ctx, t, S):
    """Статуя Свободы у дверей: датчик мигает, двери вежливо разъезжаются."""
    cam = Cam(Keys((0, 960), (4, 980)), Keys((0, 560), (4, 570)), Keys((0, 1.55), (4, 1.7)))
    lib_x = Keys((0, 760), (1.0, 900), (2.2, 930), (2.9, 880), (3.6, 930))
    doors = clamp(remap(lib_x(t), 860, 905, 0, 1))
    sensor = 1.0 if (int(t * 6) % 2 == 0 and doors > 0) else 0.4

    def lady(c):
        Walk(lib_x, 762, 64, "shamble", t1=6).draw(c, LIBERTY, t, f=1)

    entrance_scene(ctx, t, cam, doors=doors, sensor=sensor, crowd_k=0.6, extra_out=lady)
    fx.grade(ctx, "warm", 0.2)


def shot_face(ctx, t, S):
    """Крупно: герой понял. Вынимает наушник."""
    cam = Cam(1350, 520, Keys((0, 2.6), (1.4, 2.9)))
    entrance_scene(ctx, t, cam, crowd_k=0.3)
    with layer(ctx, cam, t):
        p = R.stand("front", t, 1)
        k = smooth(t / 0.35)
        p.update(face="scared" if t > 0.3 else "neutral", blink=0, hturn=-0.2, look=(-0.6, -0.2),
                 a1=(0.2 + 2.2 * k, 0.9 * k))
        HERO.draw(ctx, 1350, 960, es(960), 1, p, extra=lambda c, J, l: headphones(c, J, False) if l == "front" else None)
    fx.grade(ctx, "warm", 0.2)


def extinguisher(ctx, x, y, s, ang=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    D.rrect(ctx, -0.16, -0.5, 0.32, 0.75, 0.12, hexrgb("#c8392f"), D.INK, 0.05)
    D.rect(ctx, -0.07, -0.66, 0.14, 0.16, hexrgb("#2a2a2a"), D.INK, 0.04, wob=0)
    D.line(ctx, 0.05, -0.62, 0.3, -0.55, D.INK, 0.06)
    D.rect(ctx, -0.12, -0.3, 0.24, 0.2, hexrgb("#f0ece0"), None, 0, wob=0)
    ctx.restore()


def shot_extinguisher(ctx, t, S):
    """Герой бросает огнетушитель в датчик: искры, двери захлопываются."""
    T_THROW, T_HIT = 1.05, 1.45
    cam = Cam(Keys((0, 1200), (T_THROW, 1080), (T_HIT, 990)), Keys((0, 600), (T_HIT, 520)),
              Keys((0, 1.25), (T_HIT, 1.45)), shake=lambda t: shake_k(t, T_HIT, 0.5, 1.2))
    sx, sy = 960, 309
    hero_x = Keys((0, 1700), (0.75, 1330, "out"))
    hy = 860
    s = es(hy)
    lib_x = Keys((0, 905), (T_HIT + 0.05, 905), (T_HIT + 0.35, 950, "out"))

    def lady(c):
        p = zombie_reach(t, 3)
        LIBERTY.draw(c, lib_x(t), 762, 64, 1, p)

    doors = 0.85 if t < T_HIT else clamp(0.85 - (t - T_HIT) / 0.2 * 0.85)
    sensor = 1.0 if t < T_HIT else 0.0
    entrance_scene(ctx, t, cam, doors=doors, sensor=sensor, crowd_k=0.6, extra_out=lady)
    with layer(ctx, cam, t):
        # поза броска из-за головы
        if t < 0.75:
            w = Walk(hero_x, hy, s, "run", t1=3)
            pose = w.pose(t)
            pose["a1"] = (2.2, 0.6)
            pose["a2"] = (2.1, 0.5)
            f = -1
        else:
            k1 = smooth((t - 0.75) / (T_THROW - 0.75))
            k2 = smooth((t - T_THROW) / 0.15)
            pose = R.stand("side", t, 1)
            arm = lerp(lerp(2.4, 3.6, k1), 1.9, k2)
            pose.update(a1=(arm, 0.2), a2=(arm - 0.1, 0.25), lean=lerp(lerp(0.0, -0.25, k1), 0.3, k2),
                        f1=(0.35, 0), f2=(-0.35, 0), face="determined", hturn=1.0, neck=-0.2)
            f = -1
        J = HERO.draw(ctx, hero_x(t), hy, s, f, pose)
        hx1, hy1 = HERO.world(hero_x(t), hy, s, f, J["hand1"])
        hx2, hy2 = HERO.world(hero_x(t), hy, s, f, J["hand2"])
        ex, ey = (hx1 + hx2) / 2, (hy1 + hy2) / 2
        if t < T_THROW:
            extinguisher(ctx, ex, ey + 0.2 * s, s, ang=0.3)
        elif t < T_HIT:
            k = (t - T_THROW) / (T_HIT - T_THROW)
            px = lerp(ex, sx + 20, k)
            py = lerp(ey, sy + 10, k) - math.sin(math.pi * k) * 160
            extinguisher(ctx, px, py, s, ang=k * 7)
        else:
            k = clamp((t - T_HIT) / 0.6)
            px = sx + 20 + k * 120
            py = sy + 10 + bounce_y(k) * (770 - sy - 40)
            extinguisher(ctx, px, py, s, ang=7 + k * 5)
        if T_HIT <= t < T_HIT + 0.4:
            sparks(ctx, sx, sy, t - T_HIT)
    fx.grade(ctx, "warm", 0.2)
    fx.flash(ctx, (1 - clamp((t - T_HIT) / 0.12)) * 0.5 if t >= T_HIT else 0, "#fff6d0")


def bounce_y(k):
    from engine.core import bounce_out
    return bounce_out(k)


def sparks(ctx, x, y, dt):
    r = rng(5)
    for i in range(18):
        a = r.uniform(0, TAU)
        sp = r.uniform(200, 500)
        px = x + math.cos(a) * sp * dt
        py = y + math.sin(a) * sp * dt + 400 * dt * dt
        D.line(ctx, px, py, px - math.cos(a) * 14, py - math.sin(a) * 14, hexrgb("#ffd36a"), 4, alpha=1 - dt / 0.4)


def push_shot(obj, x0, x1, ydraw, dur, off, hand=(0.55, -1.25), face=1):
    """Герой толкает предмет: obj(ctx, x, wobble) рисует предмет."""
    def fn(ctx, t, S):
        ox = Keys((0, x0), (dur, x1, "io"))
        cam = Cam(Keys((0, (x0 + x1) / 2 - 120 * face), (dur + 1, (x0 + x1) / 2 + 80 * face)), 600,
                  Keys((0, 1.35), (dur + 1, 1.45)), drift=0.5)
        entrance_scene(ctx, t, cam, crowd_k=1.0, sensor=0.0, barr=0.0 if x0 < 650 else 0.34 if x0 < 1500 else 0.67)
        with layer(ctx, cam, t):
            if x0 >= 650 and x0 < 1500:
                barricade(ctx, t, 0.01)
            elif x0 >= 1500:
                barricade(ctx, t, 0.4)
            wob = math.sin(t * 9) * 0.03
            obj(ctx, ox(t), wob)
            hy = ydraw + 25
            w = Walk(lambda tt: ox(tt) + off, hy, es(hy), "push", t1=dur + 3, face=face)
            p = w.pose(t, {"h1": hand, "h2": (hand[0] - 0.05, hand[1] + 0.12), "face": "determined", "neck": 0.1})
            HERO.draw(ctx, w.x(t), hy, es(hy), face, p)
        fx.grade(ctx, "warm", 0.2)
    return fn


def shot_barricade_done(ctx, t, S):
    """Готово: руки по стеклу, герой согнулся, тяжело дышит. Камера отъезжает."""
    cam = Cam(Keys((0, 960), (4, 960)), Keys((0, 600), (4, 560)), Keys((0, 1.35), (4, 1.02)))

    def pressed(c):
        for k, (x, sd) in enumerate([(720, 51), (860, 52), (1010, 53), (1150, 54), (580, 55), (1300, 56)]):
            p = zombie_reach(t, sd)
            p.update(a1=(1.6 + 0.06 * math.sin(t * 4 + k), -0.45), a2=(1.5, -0.35), lean=0.05)
            R.Fig(R.zombie_look(sd)).draw(c, x, 760, 62, 1 if k % 2 else -1, p)
        p = zombie_reach(t, 9)
        p.update(a1=(1.6, -0.45), a2=(1.5, -0.35), lean=0.05)
        LIBERTY.draw(c, 950, 762, 64, 1, p)

    entrance_scene(ctx, t, cam, crowd_k=1.0, sensor=0.0, extra_out=pressed, barr=1.0)
    with layer(ctx, cam, t):
        p = R.stand("side", t, 1)
        br = math.sin(t * 7) * 0.03
        p.update(lean=0.55 + br, h1=(0.5, -0.95), h2=(0.45, -0.9), f1=(0.25, 0), f2=(-0.2, 0), neck=0.2,
                 face="sad", mouth=0.5 + 0.4 * math.sin(t * 7))
        HERO.draw(ctx, 1450, 960, es(960), -1, p)
    fx.grade(ctx, "warm", 0.25)


def bench_obj(ctx, x, wob):
    C.bench(ctx, x, 830, 260, 1.15)


def chair_obj(ctx, x, wob):
    M.massage_chair(ctx, x, 840, 1.0, tilt=wob)


def gumball_obj(ctx, x, wob):
    M.gumball(ctx, x, 850, 1.0, tilt=wob * 2)


def build(S):
    c = S.cue
    t_in = c(1) - 0.15
    S.shots = [
        Shot(0, shot_aerial),
        Shot(t_in, shot_inside),
        Shot(c(2) - 0.1, shot_look_out),
        Shot(c(3) - 0.1, shot_doors_polite),
        Shot(c(3) + (c(4) - c(3)) * 0.62, shot_face),
        Shot(c(4) - 0.6, shot_extinguisher),
        Shot(c(5) - 0.1, push_shot(bench_obj, 150, 700, 830, 1.6, -40, (0.5, -1.1))),
        Shot(c(5) + 1.6, push_shot(chair_obj, 1700, 1090, 840, 1.2, 135, (0.55, -1.35), face=-1)),
        Shot(c(5) + 2.9, push_shot(gumball_obj, 300, 900, 850, 1.2, -110, (0.55, -1.5))),
        Shot(c(5, True) - 1.9, shot_barricade_done),
    ]
    S.sfx += [(0.0, "city_ambience", 0.5), (c(4) + 1.05 - 0.6 + 0.4, "metal_hit", 1.0)]
