"""День 4: правило первое. Анкор идёт по пульту и наступает на гудок. Все зомби бегут на нос,
давятся у перил, первый ряд летит за борт. Они идут на шум."""
from scenes.kit import *
from scenes.shared import *

SUN = (1900, 140, 55)
CONSOLE_Y = 552        # верх пульта, по нему идёт кошка


def shot_walk(ctx, t, S):
    d = S.cue(1) + 1.5
    cx = Keys((0, 900), (d, BR.HORN_X - 150, "lin"))
    cam = Cam(lambda tt: cx(tt) + 200, 520, 1.5)
    bridge_back(ctx, t, cam, "day", 1.0, sun=SUN)
    with layer(ctx, cam, t):
        p = R.stand("side", t, 1)
        p.update(face="neutral", h1=(0.55, -2.3), h2=(0.5, -2.2), hturn=0.9)
        J = LEO_CAP.draw(ctx, 820, BR.BF + 40, 120, 1, p)
        hx, hy = LEO_CAP.world(820, BR.BF + 40, 120, 1, J["hand1"])
        D.poly(ctx, [(hx - 40, hy - 10), (hx + 40, hy - 10), (hx + 30, hy + 30), (hx - 30, hy + 30)],
               hexrgb("#ffffff"), D.INK, 3, wob=0)
        D.ellipse(ctx, hx, hy - 10, 40, 8, hexrgb("#f2c230"), D.INK, 2)
        draw_cat(ctx, cx(t), CONSOLE_Y, 110, 1, cat_pose(t, "walk", phase=cx(t) / 70.0, hat=True))


def shot_press(ctx, t, S):
    tp = 0.7
    cam = Cam(BR.HORN_X, 560, Keys((0, 2.4), (tp, 2.9, "in")), shake=lambda tt: shake_k(tt, tp, 0.8, 1.6))
    bridge_back(ctx, t, cam, "day", 1.0, sun=SUN)
    with layer(ctx, cam, t):
        press = clamp((t - tp) / 0.1)
        if press > 0:
            D.ellipse(ctx, BR.HORN_X, 588, 46, 18, hexrgb("#c02a2a"), D.INK, 3)
            D.ellipse(ctx, BR.HORN_X, 586, 40, 14, hexrgb("#e8423c"), D.INK, 3)
        k = smooth(clamp(t / tp))
        draw_cat(ctx, BR.HORN_X - 60 + 50 * k, CONSOLE_Y - 30 * (1 - k) + 6 * press, 120, 1,
                 cat_pose(t, "stand", hat=True))
        if press > 0:
            BR.screens(ctx, t, 1.0, horn_glow=1.0)
    if t > tp:
        impact(ctx, W / 2, H / 2 + 60, clamp((t - tp) / 0.4), 260, "#ffe36a")


def shot_blast(ctx, t, S):
    """Снаружи: звуковые волны от гудка, чайки разлетаются."""
    cam = Cam(Keys((0, 200), (2.2, 300)), 420, Keys((0, 0.75), (2.2, 0.62)), shake=lambda tt: 0.9 - tt * 0.3)
    sea_back(ctx, t, cam, "day", sun=(1200, 120, 60))
    ship_ext(ctx, t, cam, 0, 760, 0.8, "day", 0.0, wake=1.0)
    with layer(ctx, cam, t):
        hx, hy = 0.8 * 820, 760 - 0.8 * 760
        for k in range(6):
            r = ((t * 900 + k * 180) % 1100)
            ctx.arc(hx, hy, r, 0, TAU)
            D.col(ctx, (1, 1, 1), 0.7 * (1 - r / 1100))
            ctx.set_line_width(18)
            ctx.stroke()
        for i in range(10):
            gx = -600 + i * 160 + t * 300 * (1 if i % 2 else -1)
            SEA.gull(ctx, gx, -150 - t * 220 - i * 20, 26, t * 2, i)
    pop_text(ctx, "BWAAAAAAMP!", W / 2, 240, t, 0.0, 160, "#ffe36a", dur=2.4)


def shot_stampede(ctx, t, S):
    """Палуба: все головы разом поворачиваются — и толпа несётся к носу (вправо)."""
    T_RUN = 0.6
    cam = Cam(Keys((0, 1800), (4, 2600)), 640, Keys((0, 0.62), (4, 0.7)), shake=0.25)
    deck_back(ctx, t, cam, "day", 1.0, sun=(2600, 0, 60))
    with layer(ctx, cam, t):
        r = rng(41)
        for i in range(44):
            y = r.uniform(900, 1140)
            x0 = r.uniform(-400, 3800)
            look = R.zombie_look(1400 + i)
            s = deck_s(y)
            if t < T_RUN:
                p = zombie_idle(t, i)
                p["hturn"] = 1.0 if t > 0.25 else -1.0
                R.Fig(look).draw(ctx, x0, y, s, 1, p)
            else:
                tt = t - T_RUN
                v = r.uniform(500, 700)
                x = x0 + v * tt * (0.5 + 0.5 * clamp(tt / 0.5))
                p = R.gait(v * tt / s / R.GAITS["run"]["L"] + i * 0.3, "run", "side", i)
                p.update(a1=(1.4, -0.1), a2=(1.2, 0.0), mouth=0.9, lean=0.35)
                R.Fig(look).draw(ctx, x, y, s, 1, p)
        DK.water(ctx, t, *DK.POOL, DK.GF + 14, tod="day", slosh=0.4)
    if t > T_RUN:
        motion_lines(ctx, 600, 700, 1, 6, 300, 50, a=0.6)
        for i in range(8):
            D.text(ctx, "!", 200 + i * 220, 360 + (i % 3) * 40, 90, D.FONT_TITLE, hexrgb("#e8423c"),
                   alpha=clamp(1 - (t - T_RUN) * 1.5), stroke=D.INK, slw=8)


def shot_bow(ctx, t, S):
    """Нос: давка у перил, первый ряд летит за борт."""
    cam = Cam(Keys((0, 2500), (5, 2750)), Keys((0, 560), (5, 620)), Keys((0, 0.7), (5, 0.8)), shake=0.2)
    sea_back(ctx, t, cam, "day", sun=(2000, 100, 60), hy=500)
    with layer(ctx, cam, t):
        bg(ctx, "bow_day", (-1000, -400, 4800, 1900), lambda c: OD.bow(c, "day"))
        OD.flag(ctx, OD.BOW_TIP + 80, OD.OF - 520, t, "#2f8fd8")
        r = rng(5)
        for i in range(40):
            y = OD.OF + r.uniform(20, 300)
            s = 90 * (1 + (y - 1000) / 900)
            look = R.zombie_look(1500 + i)
            arrive = r.uniform(0, 3.0)
            target = OD.BOW_TIP - 40 - (i % 8) * 55 - (y - OD.OF) * 0.3
            x = lerp(target - 1400, target, clamp((t - arrive * 0.3) / (1.2 + arrive * 0.3)))
            over = i % 5 == 0 and t > 1.6 + (i % 3) * 0.4
            if over:
                k = t - (1.6 + (i % 3) * 0.4)
                fx_ = target + 60 + k * 220
                fy_ = y - 40 + 900 * k * k - 400 * k
                ctx.save()
                ctx.translate(fx_, fy_)
                ctx.rotate(k * 3)
                p = R.stand("side", t, i)
                p.update(a1=(2.8, 0.3), a2=(2.2, 0.5), mouth=1.0, k1=(1.0, 0.5))
                R.Fig(look).draw(ctx, 0, 0, s, 1, p)
                ctx.restore()
            else:
                p = zombie_reach(t, i)
                p.update(lean=0.3, mouth=0.8)
                R.Fig(look).draw(ctx, x, y, s, 1, p)
    for k in range(3):
        tt = 1.9 + k * 0.45
        pop_text(ctx, "SPLASH!", 1450 + k * 90, 820 - k * 80, t, tt, 80, "#7fd0ff", rot=0.1 * k, dur=0.7)


def shot_rule(ctx, t, S):
    """Блокнот: «ПРАВИЛО №1: ОНИ ИДУТ НА ШУМ»."""
    D.vgrad(ctx, 0, 0, W, H, [(0, "#1c3f7c"), (1, "#0f2a5a")])
    ctx.save()
    ctx.translate(W / 2, H / 2 + 20)
    ctx.rotate(-0.04)
    D.rect(ctx, -620, -340, 1240, 680, hexrgb("#fbf6e6"), D.INK, 6, wob=0)
    for k in range(9):
        D.line(ctx, -600, -220 + k * 64, 600, -220 + k * 64, hexrgb("#9fd0f0"), 3)
    D.line(ctx, -480, -340, -480, 340, hexrgb("#f08a8a"), 4)
    for k in range(6):
        D.circle(ctx, -560, -260 + k * 110, 18, hexrgb("#1c3f7c"), D.INK, 3)
    txt1, txt2 = "RULE #1:", "THEY FOLLOW NOISE."
    n1 = int(clamp(t / 0.5) * len(txt1))
    n2 = int(clamp((t - 0.6) / 1.0) * len(txt2))
    D.text(ctx, txt1[:n1], -420, -110, 110, D.FONT_HAND, hexrgb("#c23b33"), "left")
    D.text(ctx, txt2[:n2], -420, 60, 110, D.FONT_HAND, D.INK, "left")
    if t > 1.7:
        k = clamp((t - 1.7) / 0.4)
        D.line(ctx, -420, 90, -420 + 840 * k, 90, hexrgb("#c23b33"), 8)
    ctx.restore()


def shot_button(ctx, t, S):
    cam = Cam(Keys((0, 1550), (3, BR.HORN_X - 30)), Keys((0, 520), (3, 560)), Keys((0, 1.3), (3, 2.1)))
    bridge_back(ctx, t, cam, "day", 1.0, sun=SUN)
    with layer(ctx, cam, t):
        grin = t > 1.4
        p = R.stand("side", t, 1)
        p.update(face="smile" if grin else "worried", hturn=0.9 if not grin else 0.3, look=(0.7, 0.3))
        LEO_CAP.draw(ctx, 1460, BR.BF + 40, 125, 1, p)
        draw_cat(ctx, BR.HORN_X + 110, CONSOLE_Y, 110, -1, cat_pose(t, "sit", hat=True))
    fx.glow(ctx, *cam.to_screen(t, BR.HORN_X, 580), 160, "#ff6a5a", 0.25 + 0.15 * math.sin(t * 6))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_walk),
        Shot(c(1) + 1.5, shot_press),
        Shot(c(2) - 0.3, shot_blast),
        Shot(c(2) + 1.9, shot_stampede, "whip", 0.3),
        Shot(c(3) - 0.1, shot_bow),
        Shot(c(4) - 0.1, shot_rule, "fade", 0.25),
        Shot(c(5) - 0.1, shot_button, "fade", 0.25),
    ]
    S.sfx += [(c(1) + 1.5 + 0.7, "button", 0.8), (c(2) - 0.3, "horn", 1.0), (c(2) + 2.5, "stampede", 1.0),
              (c(3) + 1.8, "splash", 0.8), (c(3) + 2.3, "splash", 0.7), (c(3) + 2.7, "splash", 0.7),
              (c(4), "pencil", 0.6)]
    S.music = "comic"
