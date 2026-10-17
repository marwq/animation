"""День 25: шторм. 34-я улица — река, входы в метро — водопады. Туннели заполняются, и всё внизу начинает двигаться."""
from scenes.kit import *
from scenes.d01 import _street, crowds
from sets import stores as ST


def storm_street(c):
    C.sky(c, -4000, -3500, 10000, 5200, "storm")
    C.skyline(c, -3000, 5000, 640, "storm", depth=0, seed=31, esb_x=1750, hmin=200, hmax=560)
    C.skyline(c, -3000, 5000, 820, "storm", depth=1, seed=37, hmin=160, hmax=480)
    for k, (x, w, h, col) in enumerate([(-1500, 520, 1500, "#3a3a4a"), (-980, 420, 1250, "#40404c"),
                                        (-560, 770, 1100, "#383848"), (1710, 600, 1350, "#3e3e4a"),
                                        (2310, 480, 1550, "#424250"), (2790, 700, 1200, "#3a3a48")]):
        C.building(c, x, 1000, w, h, hexrgb(col), lit=0.0, seed=70 + k, top="step" if k % 2 else "flat")
    CITY.mall_facade(c, 960, 1000, "storm", lights_on=0.0, sign_on=0.0)
    CITY.street(c, -1600, 3600, 1000, "storm", seed=9)


def shot_storm(ctx, t, S):
    cam = Cam(Keys((0, 960), (5, 1000)), Keys((0, 640), (5, 700)), Keys((0, 0.62), (5, 0.8)),
              shake=lambda t: 0.08)
    crowd, fg = crowds()
    with layer(ctx, cam, t):
        bg(ctx, "storm_street", (-4000, -3500, 10000, 5200), storm_street, scale=0.5)
        draw_crowd(ctx, crowd, t * 0.3)
        ST.water(ctx, -1600, 3600, 1080 + math.sin(t) * 6, t, depth=500, c="#4a5260", alpha=0.75)
    fx.grade(ctx, "storm", 0.5)
    fx.rain(ctx, t, 1.6, 0.9, alpha=0.5, speed=1.4)
    fl = 1.0 if (0.8 < t < 0.9 or 3.1 < t < 3.18) else 0.0
    fx.lightning(ctx, fl)


def shot_falls(ctx, t, S):
    """Вход в метро — водопад. По улице плывёт такси."""
    cam = Cam(960, 560, Keys((0, 1.4), (5, 1.6)))
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#2e3440"))
        ctx.paint()
        C.building(ctx, -200, 760, 2400, 900, hexrgb("#3a3a48"), lit=0.0, seed=251)
        D.rect(ctx, -200, 760, 2400, 600, hexrgb("#3c4450"), None, 0, wob=0)
        CITY.subway_entrance(ctx, 960, 900, 2.0, water=1.0)
        ST.water(ctx, -200, 2200, 880, t, depth=400, c="#4a5260", alpha=0.8)
        tx = lerp(-300, 2300, t / 6)
        CITY.taxi(ctx, tx, 900 + math.sin(t * 2) * 8, 1.0, False, ang=math.sin(t * 1.5) * 0.08)
        ST.water(ctx, -200, 2200, 905, t + 1, depth=400, c="#4a5260", alpha=0.55)
        # водопад вниз по ступеням
        D.col(ctx, hexrgb("#cfdde6"), 0.7)
        ctx.set_line_width(5)
        for k in range(14):
            ph = (t * 2 + k * 0.13) % 1
            xx = 960 - 160 + k * 24
            ctx.move_to(xx, 770 + ph * 30)
            ctx.line_to(xx + 6, 860 + ph * 30)
        ctx.stroke()
    fx.grade(ctx, "storm", 0.5)
    fx.rain(ctx, t, 1.4, 0.9, alpha=0.45, speed=1.4)


def shot_section(ctx, t, S):
    """Разрез: под улицей туннели наполняются водой."""
    D.col(ctx, hexrgb("#2a2830"))
    ctx.paint()
    D.rect(ctx, 0, 0, W, 300, hexrgb("#3a4250"), None, 0, wob=0)
    D.rect(ctx, 700, 80, 520, 220, hexrgb("#b9b2a4"), D.INK, 4)
    D.text(ctx, "LIBERTY MALL", 960, 210, 44, D.FONT_TITLE, D.INK)
    D.rect(ctx, 0, 300, W, 30, hexrgb("#5a5754"), D.INK, 3, wob=0)
    D.rect(ctx, 0, 330, W, 750, hexrgb("#6e5f4f"), None, 0, wob=0)
    lvl = clamp(t / 4.0)
    tunnels = [(120, 560, 760, 140), (900, 720, 900, 140), (300, 880, 1500, 120)]
    for i, (x, y, w, h) in enumerate(tunnels):
        D.rrect(ctx, x, y, w, h, 60, hexrgb("#1a181e"), D.INK, 4)
        wl = h * clamp(lvl * 1.5 - i * 0.25)
        if wl > 0:
            D.rrect(ctx, x + 4, y + h - wl, w - 8, wl - 4, 50, hexrgb("#3f6a8a"), None, 0)
    D.rect(ctx, 1150, 330, 90, 390, hexrgb("#1a181e"), D.INK, 3, wob=0)     # шахта к подвалу
    D.rect(ctx, 1110, 300, 170, 40, hexrgb("#7c7a74"), D.INK, 3, wob=0)
    D.text(ctx, "GATE", 1195, 290, 30, D.FONT_TITLE, hexrgb("#f7eedb"))
    # стрелки «вверх»
    if t > 2.0:
        for k in range(5):
            ph = (t * 1.2 + k / 5) % 1
            x = 300 + k * 330
            y = 900 - ph * 250
            D.poly(ctx, [(x - 20, y), (x + 20, y), (x, y - 30)], hexrgb("#d9483b"), None, 0, wob=0, alpha=1 - ph)
    D.text(ctx, "100 MILES OF TUNNELS", W / 2, 1040, 64, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=8,
           alpha=clamp((t - 0.4) / 0.3))


TUN = None


def shot_tunnel(ctx, t, S):
    """Тёмный туннель, вода прибывает. Неподвижные фигуры начинают двигаться."""
    global TUN
    if TUN is None:
        TUN = make_crowd(2501, 18, 200, 1800, 850, 930, 55, 70, face=1)
    cam = Cam(Keys((0, 900), (5, 1000)), 600, 1.15)
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#141218"))
        ctx.paint()
        D.col(ctx, hexrgb("#24222a"))
        ctx.arc(960, 900, 1100, math.pi, TAU)
        ctx.fill()
        D.line(ctx, -200, 920, 2200, 920, hexrgb("#4a4744"), 10)
        def fn(m, tt):
            if tt < 1.6:
                return zombie_idle(0.0, m.seed % 97)
            return R.gait((tt - 1.6) * 0.5 + m.ph0, "shamble", "side", m.seed)
        for m in TUN:
            m.vx = 0
        draw_crowd(ctx, TUN, t, fn, dx=max(0.0, t - 1.6) * 40)
        ST.water(ctx, -200, 2200, 930 - t * 20, t, depth=300, c="#2a3a4a", alpha=0.85)
    fl = 1.0 if (int(t * 7) % 9 == 0) else 0.0
    fx.darkness(ctx, 0.75 - 0.25 * fl, [fx.Light(W / 2, 200, 900, power=0.5, glow_a=0.0)])
    for m in TUN[::3]:
        x, y = cam.to_screen(t, m.x + max(0.0, t - 1.6) * 40, m.y - m.s * 3.4)
        fx.glow(ctx, x, y, 14, "#e8ffd0", 0.5)


def shot_gate(ctx, t, S):
    """Решётка изнутри: под ней сочится вода, в темноте за прутьями — приближаются."""
    cam = Cam(1460, Keys((0, 600), (5, 620)), Keys((0, 1.1), (5, 1.6, "in")))
    with layer(ctx, cam, t):
        bg(ctx, "basement", (-400, -100, 2800, 1400), lambda c: ST.basement(c, 0.6))
        for k in range(5):
            zx = 1300 + k * 90 - 20 * math.sin(t + k)
            fig = R.Fig(R.zombie_look(2600 + k))
            fig.draw(ctx, zx + t * 6, 820 + (k % 2) * 10, 60 + (k % 2) * 6, -1 if k % 2 else 1,
                     R.gait(t * 0.4 + k * 0.3, "shamble", "side"), alpha=0.35 + 0.08 * t)
        ST.gate_bars(ctx, locks=22)
        ST.water(ctx, 1100, 1800, 870, t, depth=40, c="#5a5e66", alpha=0.6)
    fx.darkness(ctx, 0.62, [fx.Light(*cam.to_screen(t, 900, 200), 1000, power=0.8, glow_a=0.1)])
    fx.grade(ctx, "dark", 0.3)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_storm),
        Shot(c(1) - 0.1, shot_falls),
        Shot(c(2) - 0.1, shot_section),
        Shot(c(3) - 0.1, shot_tunnel),
        Shot(c(4) - 0.1, shot_gate),
    ]
    S.sfx += [(0, "storm_loop", 0.8), (0.8, "thunder", 1.0)]
