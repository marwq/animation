"""День 2: Лео просыпается на мостике, в кресле капитана — кошка в фуражке. Рация шипит,
автопилот ведёт корабль в никуда. Фуражка капитана: велика. Теперь ты капитан."""
from scenes.kit import *
from scenes.shared import *

SUN = (2200, 150, 55)


def chair_with_cat(ctx, t, ang=1.0, meow=0.0, salute=0.0, scale=1.0):
    """Кресло капитана поворачивается (ang 0 — спинкой к нам, 1 — лицом)."""
    x, gy = BR.CHAIR_X, BR.BF
    ctx.save()
    ctx.translate(x, gy)
    sx = math.cos(math.pi * (1 - ang))
    ctx.scale(max(abs(sx), 0.15) * (1 if sx >= 0 else -1), 1)
    ctx.translate(-x, -gy)
    if ang > 0.5:
        p = cat_pose(t, "sit", hat=True, meow=meow)
        draw_cat(ctx, x + 10, gy - 205, 175 * scale, 1, p)
        if salute > 0:
            D.line(ctx, x + 60, gy - 360, x + 60 + 40 * salute, gy - 420 - 30 * salute, D.INK, 16)
            D.line(ctx, x + 60, gy - 360, x + 60 + 40 * salute, gy - 420 - 30 * salute, hexrgb("#f28a2c"), 9)
    ctx.restore()
    if ang <= 0.5:
        D.rrect(ctx, x - 100, gy - 430, 200, 260, 30, hexrgb("#2b2f3a"), D.INK, 4)


def shot_wake(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, 520), (d * 0.55, 560), (d, 900, "io")), Keys((0, 800), (d, 640)),
              Keys((0, 1.6), (d * 0.55, 1.5), (d, 1.25)))
    bridge_back(ctx, t, cam, "morning", 1.0, sun=SUN, wheel_ang=t * 0.1)
    with layer(ctx, cam, t):
        k = smooth(clamp((t - 1.2) / 1.0))
        p = R.stand("side", t, 1)
        p.update(face="sleep" if t < 1.0 else "worried", hturn=0.9, look=(0.6, -0.3))
        ctx.save()
        ctx.translate(420, BR.BF + 20)
        ctx.rotate(-1.45 * (1 - k * 0.55))
        p.update(k1=(1.5 * k, 1.6 * k), k2=(1.3 * k, 1.5 * k), a1=(0.4 + 1.2 * k, 0.6), a2=(-0.2, 0.4))
        LEO.draw(ctx, 0, 0, 115, 1, p)
        ctx.restore()
        chair_with_cat(ctx, t, ang=0.0)
    if t < 1.0:
        for i in range(3):
            ph = (t * 0.8 + i / 3) % 1
            x, y = cam.to_screen(t, 330, BR.BF - 120)
            D.text(ctx, "z", x + ph * 50, y - ph * 90, 40 + ph * 30, D.FONT_HAND, D.INK, alpha=1 - ph)


def shot_chair(ctx, t, S):
    cam = Cam(Keys((0, 860), (2.0, 880)), Keys((0, 640), (2.0, 600)), Keys((0, 1.35), (1.4, 1.75, "out")))
    ang = smooth(clamp((t - 0.2) / 1.0))
    bridge_back(ctx, t, cam, "morning", 1.0, sun=SUN, wheel_ang=t * 0.1)
    with layer(ctx, cam, t):
        chair_with_cat(ctx, t, ang, meow=1.0 if 1.6 < t < 2.0 else 0.0)
    if t > 1.6:
        pop_text(ctx, "meow.", 1240, 330, t, 1.6, 90, "#fff6d8", rot=0.08, dur=1.2)
    if t > 2.4:
        k = ease_out_back(clamp((t - 2.4) / 0.3))
        ctx.save()
        ctx.translate(960, 820)
        ctx.scale(k, k)
        D.rrect(ctx, -170, -55, 340, 110, 50, hexrgb("#e9b949"), D.INK, 6)
        D.text(ctx, "ANCHOR", 0, 22, 62, D.FONT_TITLE, D.INK)
        ctx.restore()


def shot_radio(ctx, t, S):
    cam = Cam(Keys((0, 1950), (2.5, 2050)), Keys((0, 560), (2.5, 540)), Keys((0, 1.45), (2.5, 1.6)))
    bridge_back(ctx, t, cam, "morning", 1.0, sun=SUN)
    with layer(ctx, cam, t):
        BR.radio_lit(ctx, t, 0.0)
        p = R.stand("side", t, 1)
        p.update(face="worried", h1=(0.62, -3.05), h2=(0.55, -2.2), hturn=0.5)
        J = LEO.draw(ctx, 1830, BR.BF + 30, 120, 1, p)
        mx, my = LEO.world(1830, BR.BF + 30, 120, 1, J["hand1"])
        BR.mic(ctx, mx, my)
        # шум в эфире
        for k in range(5):
            y = 470 - k * 22
            pts = [(BR.RADIO_X - 120 + i * 12, y + noise1(i * 0.9 + t * 30, k) * 14) for i in range(22)]
            D.polyline(ctx, pts, D.INK, 3, 0.7 * (1 - k / 5))
    pop_text(ctx, "KSSSHHH...", 1300, 260, t, 0.4, 100, "#d8dee2", dur=2.2)


def shot_autopilot(ctx, t, S):
    """Лайнер несётся по океану: на палубах — пять тысяч пассажиров, которых никто не везёт домой."""
    cam = Cam(lambda tt: 300 * tt, 520, Keys((0, 0.55), (4, 0.5)))
    sea_back(ctx, t, cam, "morning", sun=(900, 200, 60), p=0.15)
    ship_ext(ctx, t, cam, 300 * t, 760, 0.62, "morning", 0.0, wake=1.4)
    with layer(ctx, cam, t):
        r = rng(4)
        for i in range(40):
            x = 300 * t + r.uniform(-650, 450)
            y = 760 - 365 + r.uniform(-3, 3)
            look = R.zombie_look(1200 + i)
            fast_zombie(ctx, x, y, 11, 1 if i % 2 else -1, look, t, i, False)
    motion_lines(ctx, 300, 800, 1, n=5, L=260, gap=40, a=0.6)
    D.rrect(ctx, W / 2 - 250, 820, 500, 90, 20, hexrgb("#0e1e3a"), D.INK, 5)
    D.text(ctx, "AUTOPILOT: ON", W / 2, 882, 50, D.FONT_TITLE, hexrgb("#7fd0ff"), alpha=0.7 + 0.3 * math.sin(t * 5))


def shot_hat(ctx, t, S):
    """Поднял фуражку, надел — съехала на глаза, поправил."""
    T_ON, T_FIX = 1.3, 2.6
    cam = Cam(Keys((0, 1200), (T_ON, 1300)), Keys((0, 760), (T_ON, 470)), Keys((0, 1.4), (T_ON, 1.9)))
    bridge_back(ctx, t, cam, "morning", 1.0, sun=SUN)
    with layer(ctx, cam, t):
        p = R.stand("front", t, 1)
        if t < T_ON:
            k = smooth(clamp(t / 0.8))
            p.update(face="smile", h1=(-0.3, -1.0 - 2.2 * k), h2=(0.3, -1.0 - 2.2 * k), hip=(0, 0.35 * (1 - k)),
                     lean=0.2 * (1 - k))
            J = LEO.draw(ctx, 1300, BR.BF + 40, 125, 1, p)
            hx, hy = LEO.world(1300, BR.BF + 40, 125, 1, ((J["hand1"][0] + J["hand2"][0]) / 2,
                                                         (J["hand1"][1] + J["hand2"][1]) / 2))
            look = R.Look(**{**R.LEO_CAP.__dict__, "hair": None, "head": (0, 0, 0)})
            ctx.save()
            ctx.translate(hx, hy - 30)
            ctx.scale(125 * 1.1, 125 * 1.1)
            R.hat(ctx, R.LEO_CAP, 0.0, "front", 0.04)
            ctx.restore()
        else:
            big = 1.45 if t < T_FIX else 1.12
            down = 0.32 if t < T_FIX else 0.0
            look = R.Look(**{**R.LEO_CAP.__dict__, "hat_big": big})
            fig = R.Fig(R.Look(**{**look.__dict__, "hat": None}) if t < T_FIX else look)
            p.update(face="worried" if t < T_FIX else "happy", blink=1.0 if t < T_FIX else 0.0)
            if T_FIX - 0.4 < t < T_FIX + 0.2:
                p.update(h1=(-0.2, -3.6), h2=(0.25, -3.65))
            J = fig.draw(ctx, 1300, BR.BF + 40, 125, 1, p)
            if t < T_FIX:
                # фуражка закрыла глаза: рисуем её ниже поверх лица
                hx, hy = fig.world(1300, BR.BF + 40, 125, 1, J["head"])
                ctx.save()
                ctx.translate(hx, hy + 125 * down)
                ctx.scale(125 * big, 125 * big)
                R.hat(ctx, look, 0.0, "front", 0.04)
                ctx.restore()
    if T_ON < t < T_FIX:
        pop_text(ctx, "...", 1260, 330, t, T_ON + 0.2, 110, "#fff6d8", dur=1.2)


def shot_captain(ctx, t, S):
    cam = Cam(Keys((0, 1150), (3, 1250)), Keys((0, 520), (3, 560)), Keys((0, 1.0), (3, 1.12)))
    bridge_back(ctx, t, cam, "morning", 1.0, sun=(1300, 260, 70), wheel_ang=0.05 * math.sin(t))
    with layer(ctx, cam, t):
        sal = smooth(clamp((t - 0.4) / 0.4))
        p = R.stand("side", t, 1)
        p.update(face="determined", h2=(0.75, -2.15), a1=(2.6 * sal, 2.2 * sal) if sal > 0 else (0.1, 0.2))
        if sal > 0:
            p.update(h1=(0.32, -3.55))
        LEO_CAP.draw(ctx, 1240, BR.BF + 40, 125, 1, p)
        chair_with_cat(ctx, t, 1.0, salute=smooth(clamp((t - 0.9) / 0.4)), scale=1.0)
    fx.glow(ctx, *cam.to_screen(t, 1300, 260), 500, "#fff0c8", 0.35)
    k = ease_out_back(clamp((t - 0.6) / 0.3))
    if k > 0:
        ctx.save()
        ctx.translate(W / 2, 200)
        ctx.scale(k, k)
        D.text(ctx, "CAPTAIN LEO", 0, 0, 110, D.FONT_TITLE, hexrgb("#ffe36a"), stroke=D.INK, slw=12)
        ctx.restore()


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_wake),
        Shot(c(1) - 0.1, shot_chair),
        Shot(c(2) - 0.1, shot_radio),
        Shot(c(2) + 2.6, shot_autopilot, "fade", 0.3),
        Shot(c(3) - 0.1, shot_hat),
        Shot(c(4) - 0.1, shot_captain, "white", 0.3),
    ]
    S.sfx += [(c(1) + 1.5, "meow", 1.0), (c(2) + 0.4, "static", 0.8), (c(4) - 0.1, "fanfare", 0.7)]
    S.music = "eerie_morning"
