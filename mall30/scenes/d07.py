"""День 7: праздник — тележка-самокат, булочка размером с голову, чипсы по алфавиту,
стейки на крыше на закате, мороженое половником."""
from scenes.kit import *
from sets import stores as ST


def shot_cart_ride(ctx, t, S):
    """Разгон и проезд стоя на тележке вдоль полок. Претцель в корзине."""
    xk = Keys((0, -300), (1.0, 100, "in"), (4.0, 2600, "out"))
    cam = Cam(lambda t: xk(t) + 250, 560, Keys((0, 1.15), (4, 1.0)))
    with layer(ctx, cam, t):
        bg(ctx, "shelves_b", (-1500, -50, 5600, 1300), lambda c: ST.shelves_side(c, -1500, 4100, 880, seed=17))
        x = xk(t)
        if t < 1.0:
            w = Walk(xk, 920, 85, "run", t1=3)
            p = w.pose(t, {"h1": (0.7, -1.55), "h2": (0.65, -1.5), "face": "happy"})
            HERO.draw(ctx, x, 920, 85, 1, p)
        else:
            p = R.stand("side", t, 1)
            p.update(f1=(0.15, -0.2), f2=(-0.05, -0.2), hip=(0, -0.2), h1=(0.65, -1.75), h2=(0.6, -1.7), lean=0.1,
                     face="laugh", neck=-0.1)
            HERO.draw(ctx, x, 920, 85, 1, p)
        ST.cart(ctx, x + 175, 920, 1.05, 1, items=8, seed=3)
        draw_dog(ctx, x + 175, 920 - 168, 60, 1, dog_pose(t, "sit", wag=2.0))
        if t > 1.0:
            for k in range(6):
                D.line(ctx, x - 200 - k * 60, 700 + k * 30, x - 80 - k * 60, 700 + k * 30, D.INK, 3, alpha=0.4)
    fx.grade(ctx, "warm", 0.15)


def shot_roll(ctx, t, S):
    """Булочка с корицей размером с голову."""
    cam = Cam(960, 520, Keys((0, 1.0), (3, 1.1)))
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#e9d9b8"))
        ctx.paint()
        fx.glow(ctx, 960, 500, 700, "#fff6dc", 0.3)
        p = {"view": "front", "face": "happy" if t < 1.0 else "eat", "mouth": 0.5 + 0.5 * math.sin(t * 12),
             "hturn": 0.3, "neck_line": True, "blink": 0}
        HERO.head_only(ctx, 700, 480, 300, 1, p)
        # булочка
        x, y = 1200, 500
        D.circle(ctx, x, y, 150, hexrgb("#d9a25a"), D.INK, 5)
        D.col(ctx, hexrgb("#9a5a2a"))
        ctx.set_line_width(14)
        for k in range(5):
            ctx.arc(x, y, 25 + k * 26, k * 0.8, k * 0.8 + 4.5)
            ctx.stroke()
        D.col(ctx, hexrgb("#f7efe0"), 0.85)
        ctx.set_line_width(10)
        for k in range(6):
            ctx.move_to(x - 120 + k * 45, y - 110 + (k % 2) * 30)
            ctx.curve_to(x - 90 + k * 45, y - 60, x - 110 + k * 45, y, x - 80 + k * 45, y + 40)
            ctx.stroke()
        if t > 1.0:
            D.circle(ctx, x - 140, y - 10, 46, hexrgb("#e9d9b8"), None, 0)
    fx.grade(ctx, "warm", 0.2)


CHIPS = "ABCDEFGHIJ"


def shot_chips(ctx, t, S):
    """Ряд 4: пакеты чипсов летят в тележку по алфавиту."""
    cam = Cam(960, 560, Keys((0, 1.0), (4, 1.12)))
    with layer(ctx, cam, t):
        bg(ctx, "aisle4", (-200, -200, 2320, 1480), lambda c: ST.aisle(c))
        s = ST.aisle_scale(1000)
        p = R.stand("front", t, 1)
        throw = (t * 2.5) % 1.0
        p.update(face="laugh", a1=(0.3 + 2.2 * math.sin(throw * math.pi), 0.6), hturn=0.4)
        HERO.draw(ctx, 820, 1000, s, 1, p)
        ST.cart(ctx, 1220, 1010, 1.25, -1, items=min(20, int(t * 4)), seed=8)
        r = rng(3)
        for k in range(int(t * 2.5) + 1):
            if k >= len(CHIPS):
                break
            tk = t - k / 2.5
            if 0 <= tk < 0.4:
                f = tk / 0.4
                bx = lerp(900, 1220, f)
                by = lerp(620, 790, f) - math.sin(math.pi * f) * 200
                chip_bag(ctx, bx, by, CHIPS[k], f * 4, r.choice(ST.PROD))
    fx.grade(ctx, "warm", 0.12)


def chip_bag(ctx, x, y, letter, ang, c):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    D.poly(ctx, [(-40, -55), (40, -55), (46, 55), (-46, 55)], hexrgb(c), D.INK, 3, wob=0.6)
    D.circle(ctx, 0, 5, 26, hexrgb("#f4efe0"), D.INK, 2)
    D.text(ctx, letter, 0, 18, 36, D.FONT_TITLE, D.INK)
    ctx.restore()


def roof_sunset_bg(c):
    C.sky(c, -1000, -1200, 4000, 2300, "golden", sun=(1500, 300, 70))
    C.clouds(c, -600, -200, 3000, seed=7, color="#f6c9a0", alpha=0.5, n=6)
    C.skyline(c, -1000, 3000, 720, "golden", depth=0, seed=71, esb_x=1120, hmin=200, hmax=520)
    C.skyline(c, -1000, 3000, 760, "golden", depth=1, seed=73, hmin=120, hmax=300)
    CITY.roof(c, -1000, 3000, 860, "golden", door=True, tank=True)


def grill(ctx, x, floor, t, s=1.0):
    ctx.save()
    ctx.translate(x, floor)
    ctx.scale(s, s)
    D.line(ctx, -60, 0, -40, -180, D.INK, 6)
    D.line(ctx, 60, 0, 40, -180, D.INK, 6)
    D.poly(ctx, [(-110, -180), (110, -180), (90, -250), (-90, -250)], hexrgb("#2a2a30"), D.INK, 4)
    D.line(ctx, -100, -250, 100, -250, hexrgb("#8a8a86"), 6)
    for k in range(2):
        D.ellipse(ctx, -40 + k * 80, -258, 36, 12, hexrgb("#7a3a2a"), D.INK, 3)
    for k in range(4):
        ph = (t * 0.7 + k / 4) % 1
        D.circle(ctx, -30 + k * 20 + math.sin(ph * 6 + k) * 20, -290 - ph * 260, 20 + ph * 40, hexrgb("#d9d2c8"),
                 None, 0, alpha=0.45 * (1 - ph))
    ctx.restore()


def shot_grill(ctx, t, S):
    cam = Cam(Keys((0, 900), (5, 1000)), 560, Keys((0, 1.1), (5, 1.2)))
    with layer(ctx, cam, t):
        bg(ctx, "roof_golden", (-1000, -1200, 4000, 2600), roof_sunset_bg)
        grill(ctx, 1000, 900, t)
        p = R.stand("side", t, 1)
        flip = max(0, math.sin(t * 3))
        p.update(h1=(0.95, -2.3 - 0.3 * flip), face="happy", hturn=0.7)
        HERO.draw(ctx, 800, 905, 95, 1, p)
        draw_dog(ctx, 1220, 905, 85, -1, dog_pose(t, "sit", wag=2.0, look=0.3))
        # стейк у Претцеля
        D.ellipse(ctx, 1150, 900, 34, 12, hexrgb("#7a3a2a"), D.INK, 2.5)
    fx.grade(ctx, "golden", 0.4)


def shot_icecream(ctx, t, S):
    cam = Cam(960, 520, Keys((0, 1.0), (3, 1.08)))
    with layer(ctx, cam, t):
        bg(ctx, "roof_golden", (-1000, -1200, 4000, 2600), roof_sunset_bg)
        p = {"view": "front", "face": "eat", "mouth": 0.4 + 0.5 * abs(math.sin(t * 5)), "hturn": 0.2,
             "neck_line": True, "blink": R.blink(t, 3)}
        HERO.head_only(ctx, 820, 520, 280, 1, p)
        D.poly(ctx, [(1010, 640), (1310, 640), (1290, 980), (1030, 980)], hexrgb("#f4efe4"), D.INK, 5)
        D.ellipse(ctx, 1160, 640, 150, 34, hexrgb("#f2d6a8"), D.INK, 4)
        D.text(ctx, "VANILLA", 1160, 820, 44, D.FONT_TITLE, hexrgb("#c23b33"))
        a = -0.7 + 0.5 * math.sin(t * 5)
        D.line(ctx, 1160, 620, 1160 + math.cos(a) * 380, 620 + math.sin(a) * 380, hexrgb("#b9b6ae"), 16)
        D.circle(ctx, 1160 + math.cos(a) * 30, 620 + math.sin(a) * 30, 50, hexrgb("#b9b6ae"), D.INK, 4)
    fx.grade(ctx, "golden", 0.35)


def shot_richest(ctx, t, S):
    """Шезлонг на крыше, руки за головой. Камера отъезжает — закатный Манхэттен."""
    cam = Cam(Keys((0, 760), (5, 900)), Keys((0, 640), (5, 480)), Keys((0, 1.6), (5, 0.8)))
    with layer(ctx, cam, t):
        bg(ctx, "roof_golden", (-1000, -1200, 4000, 2600), roof_sunset_bg)
        # шезлонг
        D.poly(ctx, [(560, 880), (900, 880), (920, 860), (600, 800), (540, 700), (520, 712), (575, 820)],
               hexrgb("#3f8a84"), D.INK, 3)
        D.line(ctx, 580, 880, 600, 905, D.INK, 5)
        D.line(ctx, 880, 880, 870, 905, D.INK, 5)
        p = R.stand("side", t, 1)
        p.update(face="happy", a1=(3.5, 2.6), a2=(3.4, 2.6))
        p.update(k1=(0.5, 0.9), k2=(0.4, 0.8))
        ctx.save()
        ctx.translate(905, 868)
        ctx.rotate(-1.22)
        HERO.draw(ctx, 0, 0, 82, 1, p)
        ctx.restore()
        draw_dog(ctx, 980, 905, 70, -1, dog_pose(t, "lie"))
    fx.grade(ctx, "golden", 0.4)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_cart_ride),
        Shot(c(1) - 0.1, shot_roll),
        Shot(c(2) - 0.1, shot_chips),
        Shot(c(3) - 0.1, shot_grill, "fade", 0.3),
        Shot(c(4) + 1.2, shot_icecream),
        Shot(c(5) - 0.2, shot_richest, "fade", 0.3),
    ]
    S.tods = [(0, "day"), (c(3), "golden")]
    S.sfx += [(1.0, "cart_roll", 0.7), (c(3), "sizzle", 0.6)]
