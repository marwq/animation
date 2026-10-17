"""День 15: половина пути. Распорядок: отжимания, уборка, ролики, карты, новости, кино."""
from scenes.kit import *
from scenes.shared import gallery_bg, gallery_rail, gs, GF, binocular, rosa_window_close
from scenes.cold import _fc, fs
from sets import stores as ST


def clock_badge(ctx, hh, label=None):
    x, y = W - 150, 150
    D.circle(ctx, x, y, 70, hexrgb("#f7eedb"), D.INK, 6)
    for k in range(12):
        a = k * TAU / 12
        D.line(ctx, x + math.cos(a) * 56, y + math.sin(a) * 56, x + math.cos(a) * 64, y + math.sin(a) * 64, D.INK, 3)
    a = (hh % 12) / 12 * TAU - math.pi / 2
    D.line(ctx, x, y, x + math.cos(a) * 36, y + math.sin(a) * 36, D.INK, 7)
    D.line(ctx, x, y, x, y - 52, D.INK, 4)
    D.circle(ctx, x, y, 6, D.INK, None, 0)
    lab = label or ("%d:00" % hh)
    D.text(ctx, lab, x, y + 125, 50, D.FONT_DAY, hexrgb("#f7eedb"), bold=True, stroke=D.INK, slw=8)


def shot_calendar(ctx, t, S):
    D.col(ctx, hexrgb("#d9cdb5"))
    ctx.paint()
    D.rect(ctx, 460, 120, 1000, 820, hexrgb("#f6f1e6"), D.INK, 5, wob=0.8)
    D.rect(ctx, 460, 120, 1000, 120, hexrgb("#c23b33"), D.INK, 5, wob=0.5)
    D.text(ctx, "30 DAYS", 960, 205, 70, D.FONT_TITLE, hexrgb("#f6f1e6"))
    for i in range(30):
        x = 520 + (i % 7) * 132
        y = 300 + (i // 7) * 125
        D.rect(ctx, x, y, 110, 100, None, D.INK, 2.5, wob=0.4, seed=i)
        D.text(ctx, str(i + 1), x + 20, y + 36, 30, D.FONT_DAY, D.INK, "left", bold=True)
        done = i < 14 or (i == 14 and t > 0.6)
        if done:
            k = 1.0 if i < 14 else clamp((t - 0.6) / 0.25)
            ctx.set_line_width(9)
            D.col(ctx, hexrgb("#c23b33"))
            ctx.move_to(x + 15, y + 15)
            ctx.line_to(x + 15 + 80 * k, y + 15 + 70 * k)
            ctx.stroke()
            if k > 0.5:
                ctx.move_to(x + 95, y + 15)
                ctx.line_to(x + 95 - 80 * (k - 0.5) * 2, y + 15 + 70 * (k - 0.5) * 2)
                ctx.stroke()
    if t > 1.0:
        D.text(ctx, "HALFWAY", 960, 1010, 90, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
               alpha=clamp((t - 1.0) / 0.3))


def shot_pushups(ctx, t, S):
    cam = Cam(960, 640, 1.4)
    with layer(ctx, cam, t):
        bg(ctx, "gal_sports", (-400, -50, 2800, 1250), lambda c: M.gallery(c, -400, 2400, "day", 0.9, {}, start=7))
        k = 0.5 + 0.5 * math.sin(t * 6)
        p = R.stand("side", t, 1)
        p.update(h1=(0.0, -0.0), h2=(-0.05, 0.0), face="determined")
        ctx.save()
        ctx.translate(1100, 900)
        ang = -1.25 + 0.15 * k
        ctx.rotate(ang)
        HERO.draw(ctx, 0, 0, 90, 1, p)
        ctx.restore()
    fx.grade(ctx, "warm", 0.15)
    clock_badge(ctx, 7)


def shot_mop(ctx, t, S):
    w = Walk(Keys((0, 400), (3, 900, "lin")), GF + 40, gs(), "walk", t1=5)
    cam = Cam(lambda t: w.x(t) + 100, 560, 1.25)
    with layer(ctx, cam, t):
        gallery_bg("d15", "day", 0.9, {n: 1.0 for n, _, _ in M.STORES})(ctx)
        sw = math.sin(t * 5)
        J = w.draw(ctx, HERO, t, {"h1": (0.85 + 0.3 * sw, -1.2), "h2": (0.35 + 0.3 * sw, -1.9)})
        from scenes.kit import mop
        x = w.x(t)
        ctx.save()
        ctx.translate(x, GF + 40)
        ctx.scale(gs(), gs())
        mop(ctx, J)
        ctx.restore()
    fx.grade(ctx, "warm", 0.15)
    clock_badge(ctx, 9)


def shot_skates(ctx, t, S):
    """Ролики по фудкорту: скольжение, руки в стороны."""
    xk = Keys((0, -200), (3, 2200, "lin"))
    cam = Cam(lambda t: xk(t), 640, 1.1)
    with layer(ctx, cam, t):
        bg(ctx, "fc_day", (-400, 0, 2800, 1300), lambda c: M.food_court(c, "day", 0.9))
        y = 930
        ph = t * 1.4
        p = R.stand("side", t, 1)
        push = math.sin(ph * TAU)
        p.update(f1=(0.3 * push, -0.05 * max(0, push)), f2=(-0.3 * push, -0.05 * max(0, -push)), lean=0.25,
                 a1=(1.5 + 0.3 * push, 0.2), a2=(1.3 - 0.3 * push, 0.2), face="laugh", hip=(0, 0.1))
        J = HERO.draw(ctx, xk(t), y, fs(y), 1, p)
        for i in (1, 2):
            fx_, fy_ = HERO.world(xk(t), y, fs(y), 1, J["foot%d" % i])
            D.rect(ctx, fx_ - 10, fy_ - 6, 44, 14, hexrgb("#c23b33"), D.INK, 2, wob=0)
            D.circle(ctx, fx_ - 2, fy_ + 12, 6, D.INK, None, 0)
            D.circle(ctx, fx_ + 26, fy_ + 12, 6, D.INK, None, 0)
        for k in range(5):
            D.line(ctx, xk(t) - 220 - k * 50, y - 200 + k * 40, xk(t) - 120 - k * 50, y - 200 + k * 40, D.INK, 3,
                   alpha=0.35)
    fx.grade(ctx, "warm", 0.12)
    clock_badge(ctx, 12)


def shot_cards(ctx, t, S):
    cam = Cam(960, 600, 1.5)
    with layer(ctx, cam, t):
        bg(ctx, "fc_day", (-400, 0, 2800, 1300), lambda c: M.food_court(c, "day", 0.9))
        M.table_set(ctx, 960, 960, 2.0)
        p = R.stand("side", t, 1)
        p.update(k1=(1.6, 1.6), k2=(1.5, 1.5), hip=(0, 0.7), h1=(0.7, -1.8), h2=(0.6, -1.75), face="worried")
        HERO.draw(ctx, 720, 980, 110, 1, p)
        draw_dog(ctx, 1210, 760, 100, -1, dog_pose(t, "sit", wag=1.0))
        for k in range(3):
            D.rect(ctx, 760 + k * 22, 690 - k * 4, 40, 60, hexrgb("#f6f1e6"), D.INK, 2, wob=0)
        # туз под лапой
        if t > 1.0:
            D.rect(ctx, 1130, 850, 46, 66, hexrgb("#f6f1e6"), D.INK, 2.5, wob=0)
            D.text(ctx, "A", 1153, 895, 36, D.FONT_TITLE, hexrgb("#c23b33"))
    fx.grade(ctx, "warm", 0.12)
    clock_badge(ctx, 15)
    if t > 1.2:
        D.text(ctx, "HE CHEATS", W / 2, 230, 80, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
               alpha=clamp((t - 1.2) / 0.3))


def shot_news(ctx, t, S):
    def scene(c):
        rosa_window_close(c, t, "dusk", sign=["WEATHER:", "RAIN :(", "BRING UMBRELLA"], sign_k=clamp(t / 0.3),
                          light=0.85)
    binocular(ctx, scene, t)
    clock_badge(ctx, 18)


def shot_movie(ctx, t, S):
    cam = Cam(Keys((0, 960), (4, 980)), Keys((0, 540), (4, 600)), Keys((0, 1.0), (4, 1.25)))
    with layer(ctx, cam, t):
        bg(ctx, "cinema", (-400, -100, 2800, 1400), lambda c: ST.cinema(c, 1.0))
        p = R.stand("back", t, 1)
        p.update(hip=(0, 0.8), h1=(-0.3, -1.6), neck=-0.05)
        HERO.draw(ctx, 900, 1060, 120, 1, p)
        # ведро попкорна
        D.poly(ctx, [(1030, 790), (1230, 790), (1210, 1030), (1050, 1030)], hexrgb("#f4efe4"), D.INK, 4)
        for k in range(4):
            D.rect(ctx, 1050 + k * 44, 790, 22, 240, hexrgb("#c23b33"), None, 0, wob=0)
        for k in range(14):
            D.circle(ctx, 1045 + (k % 7) * 28, 780 - (k // 7) * 22 + math.sin(k) * 6, 20, hexrgb("#f6e2a0"), D.INK, 2)
        draw_dog(ctx, 760, 1000, 90, 1, dog_pose(t, "sit"))
    fl = 0.85 + 0.15 * math.sin(t * 7)
    fx.darkness(ctx, 0.75, [fx.Light(*cam.to_screen(t, 960, 360), 1100, power=0.75 * fl, glow="#dfe8ff", glow_a=0.15)])
    ST.projector_beam(ctx, t, 0.07)
    clock_badge(ctx, 22, "10:00")


def shot_life(ctx, t, S):
    w = Walk(Keys((0, 300), (6, 1500, "lin")), GF + 40, gs(), "walk", t1=8)
    cam = Cam(lambda t: w.x(t) + 150, 560, Keys((0, 1.2), (6, 1.0)))
    with layer(ctx, cam, t):
        gallery_bg("d15n", "night", 0.25, {n: 1.0 for n, _, _ in M.STORES})(ctx)
        w.draw(ctx, HERO, t, {"face": "smile"})
        draw_dog(ctx, w.x(t) + 140, GF + 50, gs() * 0.95, 1, dog_pose(t, "trot", phase=w.dist(t) / 0.9 * 1.3))
    with layer(ctx, cam, t, 1.3):
        gallery_rail(ctx)
    fx.darkness(ctx, 0.5, [fx.Light(*cam.to_screen(t, w.x(t), 700), 700, power=0.7, glow_a=0.1)])
    fx.grade(ctx, "night", 0.4)


def build(S):
    c = S.cue
    m1 = (c(1, True) + c(1)) / 2
    m2 = (c(2, True) + c(2)) / 2
    S.shots = [
        Shot(0, shot_calendar),
        Shot(c(1) - 0.1, shot_pushups),
        Shot(m1, shot_mop),
        Shot(c(2) - 0.1, shot_skates),
        Shot(m2, shot_cards),
        Shot(c(3) - 0.1, shot_news),
        Shot(c(4) - 0.1, shot_movie),
        Shot(c(5) - 0.2, shot_life, "fade", 0.3),
    ]
    S.tods = [(0, "day"), (c(4), "night")]
