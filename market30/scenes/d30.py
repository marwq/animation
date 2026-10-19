"""День 30: на рассвете магазин наконец стихает — они ушли на последний шум. Бегом к погрузке; грузовик
заводится со второй попытки. Рут открывает ворота, и ты едешь через парковку, через тележки, через них всех.
Позади Greenleaf Market всё меньше; впереди шоссе, полбака и целый мир, куда некуда ехать. Вторая часть скоро."""
import cairo

from scenes.kit import *

HERO = ST.HERO
RUTH = ST.RUTH
FD_HZ, FD_A = 760, 0.2
DK_HZ, DK_A = 760, 0.185
EXT_HZ, EXT_A = 786, 0.1
DOOR = (900, 300, 1822, 1146)


def shot(start, fn, trans="cut", tlen=0.3):
    return Shot(start, lambda ctx, t, S, f=fn, s0=start: f(ctx, s0 + t, S), trans, tlen)


def multiply(ctx, color, alpha, rect=None):
    if alpha <= 0:
        return
    ctx.save()
    if rect:
        ctx.rectangle(*rect)
        ctx.clip()
    ctx.set_operator(cairo.OPERATOR_MULTIPLY)
    D.col(ctx, hexrgb(color), alpha)
    ctx.paint()
    ctx.restore()


def door_open(ctx, T, S):
    """Камера изнутри: дверь приоткрывается, полоса тёплого света; тишина."""
    l = T - (S.cue(1) - 0.3)
    cam = PlateCam("walkin_freezer", 1360, 900, Keys((0, 1.15), (5, 1.1, "lin")))
    k = smooth(clamp((l - 0.6) / 2.5))
    with on(ctx, cam, l):
        paint(ctx, "walkin_freezer")
        multiply(ctx, "#18203a", 0.62 * (1 - 0.5 * k))
        x0 = 1030
        w = 680 * k * 0.45
        if k > 0:
            D.rect(ctx, x0, 520, w, 890, hexrgb("#f4e3b8"), None, 0, wob=0, alpha=0.9)
            fx.glow(ctx, x0 + w / 2, 960, 500, "#ffd9a0", 0.35 * k)
        p = pose(T, 3, face="worried", look=(0.5, -0.1), h1=(1.8, -4.1), h2=(0.3, -2.4))
        figure(ctx, 1450, 1470, 92, -1, p, HERO, tint=("#3a4868", 0.35 * (1 - k)))


def empty_store(ctx, T, S):
    """Магазин на рассвете: стекла нет, тележки опрокинуты, никого."""
    l = T - (S.word("they've", S.cue(1)) - 0.3)
    cam = PlateCam("front_day", 1500, 900, Keys((0, 1.0), (4, 1.06, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "front_day")
        ctx.save()
        ctx.rectangle(355, 340, 1765, 660)
        ctx.clip()
        D.col(ctx, hexrgb("#f4d8b0"), 0.12)
        ctx.paint()
        ctx.restore()
        front_day_fg(ctx)
        r_ = rng(8)
        for i in range(9):
            gy = 1100 + r_.uniform(0, 260)
            s = 4.4 * persp(gy, FD_A, FD_HZ)
            cart(ctx, 1250 + r_.uniform(0, 900), gy, s, 1 if i % 2 else -1, tilt=r_.uniform(-0.6, 0.6))
        for i in range(120):
            x = r_.uniform(1150, 2150)
            y = r_.uniform(1030, 1480)
            s = r_.uniform(5, 11)
            D.rect(ctx, x, y, s, s, hexrgb("#d4ecf6"), hexrgb("#6a8a9a"), 1, wob=0)
        fx.glow(ctx, 1700, 600, 900, "#ffcf8a", 0.1)


def start_truck(ctx, T, S):
    """Погрузка на рассвете: первая попытка — фары моргнули и погасли; вторая — завёлся, дым."""
    l = T - (S.cue(2) - 0.3)
    t_second = S.word("second", S.cue(2)) - 0.2
    cam = PlateCam("dock_truck", 1700, 900, Keys((0, 1.2), (5, 1.28, "lin")))
    first = S.word("starts", S.cue(2)) - 0.4
    lights = 0.0
    if first <= T < first + 0.35:
        lights = 0.5 * (math.sin((T - first) * 40) > 0)
    if T >= t_second:
        lights = 1.0
    shake_amp = 3 if T >= t_second else 0
    with on(ctx, cam, l):
        paint(ctx, "dock_truck")
        multiply(ctx, "#6a5a7a", 0.25)
        ctx.save()
        ctx.translate(math.sin(T * 50) * shake_amp, 0)
        if lights > 0:
            fx.glow(ctx, 2130, 1120, 160, "#fff2c0", 0.6 * lights)
            fx.glow(ctx, 2130, 1120, 420, "#fff2c0", 0.2 * lights)
        ctx.restore()
        if T >= t_second:
            for k in range(4):
                u = ((T - t_second) * 0.8 + k / 4) % 1.0
                D.circle(ctx, 880 - u * 160, 1240 - u * 120, 20 + u * 60, hexrgb("#9aa0aa"), None, 0,
                         alpha=0.5 * (1 - u))


def gate(ctx, T, S):
    """Рут поднимает ворота погрузки: за ними — утренний свет."""
    l = T - (S.cue(3) - 0.3)
    cam = PlateCam("dock_door", 1360, 800, Keys((0, 1.05), (3, 1.1, "lin")))
    k = smooth(clamp((l - 0.3) / 1.6))
    with on(ctx, cam, l):
        paint(ctx, "dock_door")
        x0, y0, x1, y1 = DOOR
        top = y0 + 100
        hole = (y1 - top) * k
        if hole > 0:
            D.rect(ctx, x0 + 20, y1 - hole, x1 - x0 - 40, hole, hexrgb("#f6d6a8"), None, 0, wob=0)
            fx.glow(ctx, (x0 + x1) / 2, y1 - hole / 2, 700, "#ffd9a0", 0.3 * k)
        gy = 1440
        r = persp(gy, DK_A, DK_HZ)
        p = pose(T, 5, face="determined", look=(-0.5, -0.4), h1=(-0.6, -5.3), h2=(-0.4, -5.2))
        figure(ctx, 1980, gy, r, -1, p, RUTH, tint=("#c9b8a8", 0.1))


def drive(ctx, T, S):
    """Парковка: грузовик несётся сквозь тележки и толпу — они разлетаются."""
    l = T - (S.word("drive", S.cue(3)) - 0.3)
    cam = PlateCam("exterior_day", 1360, 980, 1.12)
    with on(ctx, cam, l):
        paint(ctx, "exterior_day")
        multiply(ctx, "#f4c89a", 0.15)
        gy = 1420
        TS = 520
        tx = lerp(3400, -1200, clamp(l / 3.6))
        front = tx - 1.3 * TS
        r_ = rng(12)
        for i in range(10):
            zx = 400 + i * 200 + r_.uniform(-40, 40)
            zgy = 1260 + r_.uniform(-30, 60)
            r = persp(zgy, EXT_A, EXT_HZ)
            hit = front < zx + 40
            if hit:
                u = clamp((zx + 40 - front) / 700)
                ctx.save()
                ctx.translate(zx - u * 420, zgy - math.sin(u * math.pi) * 220)
                ctx.rotate(-u * 1.55)
                p = ST.stand(T, i)
                p.update(h1=(1.5, -5.0), h2=(-1.2, -4.8), mouth=1.0, blink=False)
                ST.draw(ctx, 0, 0, r, 1, p, zombie_look(90 + i))
                ctx.restore()
            else:
                p = shamble(T * 0.5 + i, i)
                p["blink"] = False
                ST.draw(ctx, zx, zgy, r, 1, p, zombie_look(90 + i))
        truck_side(ctx, tx, gy, TS, -1, T, 1.0, shake=2)


def smaller(ctx, T, S):
    """Позади: магазин уменьшается (камера отъезжает), грузовик уходит из кадра."""
    l = T - (S.cue(4) - 0.3)
    cam = PlateCam("exterior_day", 1360, Keys((0, 820), (4, 900, "lin")), Keys((0, 2.2), (4, 1.0, "io")))
    with on(ctx, cam, l):
        paint(ctx, "exterior_day")
        multiply(ctx, "#f4c89a", 0.18)
        D.text(ctx, "GREENLEAF MARKET", 1310, 563, 50, "Inter", hexrgb("#f7fff4"), bold=True, stroke=hexrgb("#1f5a33"),
               slw=5, tracking=3)


def highway(ctx, T, S):
    """Шоссе на рассвете: грузовик уменьшается к солнцу."""
    l = T - (S.cue(5) - 0.3)
    cam = PlateCam("highway_dawn", 1360, 800, Keys((0, 1.0), (8, 1.08, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "highway_dawn")
        k = clamp(l / 9.0)
        d = 1 / (1 + k * 6)
        x = lerp(1360, 1395, 1 - d)
        gy = lerp(1500, 830, 1 - d)
        truck_rear(ctx, x + 40 * d, gy, 520 * d)


def part2(ctx, T, S):
    l = T - (S.cue(6) - 0.4)
    D.col(ctx, hexrgb("#1b1d23"))
    ctx.paint()
    a = clamp(l / 0.4)
    D.text(ctx, "PART 2 IS COMING", W / 2, H / 2 + 30, 96, "Inter", hexrgb("#f4f4f2"), bold=True, alpha=a)


def build(S):
    c, w = S.cue, S.word
    S.shots = [
        Shot(0, day_shot(30)),
        shot(c(1) - 0.3, door_open),
        shot(w("they've", c(1)) - 0.3, empty_store),
        shot(c(2) - 0.3, start_truck),
        shot(c(3) - 0.3, gate),
        shot(w("drive", c(3)) - 0.3, drive),
        shot(c(4) - 0.3, smaller),
        shot(c(5) - 0.3, highway, "fade", 0.4),
        shot(c(6) - 0.4, part2, "fade", 0.4),
    ]
    S.amb = [(c(1) - 0.3, c(2) - 0.3, "birds", 0.35), (c(2) - 0.3, c(3) - 0.3, "birds", 0.3),
             (w("drive", c(3)) - 0.3, c(5) - 0.3, "truck_drive", 0.6), (c(5) - 0.3, c(6) - 0.4, "wind_loop", 0.4)]
    S.sfx = [(0.0, "day_hit", 0.7), (c(1) + 0.3, "freezer_door", 0.5),
             (w("starts", c(2)) - 0.4, "engine_fail", 0.8), (w("second", c(2)) - 0.2, "engine_start", 0.9),
             (c(3) - 0.1, "roll_door", 0.7), (w("drive", c(3)) + 0.4, "crash", 0.6),
             (w("drive", c(3)) + 1.2, "metal_hit", 0.5), (w("drive", c(3)) + 1.8, "crash", 0.5)]
    S.music = [(c(1) - 0.3, c(3) - 0.3, "mystery", 0.45), (c(3) - 0.3, c(4) - 0.3, "action", 0.6),
               (c(4) - 0.3, S.dur, "hope", 0.65)]
