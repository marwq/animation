"""День 8: Бордвок ночью — карусель, кондитерская, тарзанка. Страшно всё лето, а сегодня никто
не смотрит: крик шёпотом. Казино: джекпот, миллион — и некому выплатить. Запомни тарзанку."""
from scenes.kit import *
from scenes.shared import *

(ZX0, ZY0), (ZX1, ZY1) = IN.ZIP


def zip_point(u):
    return lerp(ZX0, ZX1, u), lerp(ZY0, ZY1, u) + math.sin(math.pi * u) * 40


def boardwalk_bg(ctx, t, cam, power=1.0, scale=1.0):
    with layer(ctx, cam, t):
        bg(ctx, "bw_night_%s" % power, (-1700, -1500, 6800, 2600), lambda c: IN.boardwalk(c, "night", power), scale)
        IN.carousel(ctx, t, power=power, spin=1.0 if power > 0 else 0.0)


def bw_zombies(ctx, t, seed=7, n=10, look_up=0.0):
    r = rng(seed)
    for i in range(n):
        x = r.uniform(-300, 3600)
        if 900 < x < 2100:
            x += 1300
        y = IN.FL - 20 + r.uniform(10, 120)
        p = zombie_idle(t, i)
        if look_up > 0:
            p.update(neck=-0.6 * look_up, look=(0, -1), mouth=0.8)
        v = r.uniform(-40, 40)
        R.Fig(R.zombie_look(1800 + i)).draw(ctx, x + v * t, y, 85 * (1 + (y - 1000) / 900), 1 if v > 0 else -1, p)


def shot_crane(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, 1500), (d, 1400)), Keys((0, -600), (d * 0.6, 420), (d, 200)), Keys((0, 0.7), (d * 0.6, 0.62),
                                                                                            (d, 0.75)))
    boardwalk_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        bw_zombies(ctx, t)
        # пара зомби катается на карусели
        a = (t * 0.5) % 1.0 * TAU
        for k, off in enumerate((0.0, 0.5)):
            aa = a + off * TAU
            if math.cos(aa) > 0:
                px = IN.CAROUSEL_X + math.sin(aa) * 440
                p = R.stand("side", t, k)
                p.update(k1=(1.3, 1.4), k2=(1.1, 1.3), hip=(0, 0.6), mouth=0.7)
                R.Fig(R.zombie_look(1850 + k, "hawaiian")).draw(ctx, px, IN.FL - 240 + math.sin(t * 2.2 + k) * 40,
                                                               75, 1 if math.cos(aa) > 0 else -1, p)
    labels = [(0.6, "CAROUSEL"), (1.8, "CANDY SHOP"), (3.0, "ZIP LINE")]
    for i, (tt, txt) in enumerate(labels):
        pop_text(ctx, txt, 420 + i * 560, 190, t, tt, 70, "#ffe36a", dur=d - tt + 0.3, shake=False)


def shot_edge(ctx, t, S):
    """Платформа тарзанки: Лео в обвязке боится, смотрит вниз — и прыгает."""
    T_GO = S.cue(2) - S.cue(1) - 0.3
    cam = Cam(ZX0 - 60, ZY0 - 180, Keys((0, 1.25), (T_GO, 1.4)), shake=lambda tt: 0.15 * clamp(tt / T_GO))
    boardwalk_bg(ctx, t, cam, scale=1.0)
    with layer(ctx, cam, t):
        D.line(ctx, ZX0 - 300, ZY0 - 300, ZX0, ZY0, D.INK, 5)
        p = R.stand("side", t, 1)
        shiver = math.sin(t * 40) * 0.02
        p.update(face="scared", blink=0, h1=(0.15, -3.55), h2=(0.05, -3.5), lean=-0.1 + shiver, look=(0.5, 0.8))
        LEO_CAP.draw(ctx, ZX0 - 80, ZY0 + 20, 115, 1, p)
        draw_cat(ctx, ZX0 - 230, ZY0 + 20, 95, 1, cat_pose(t, "sit"))
        D.rect(ctx, ZX0 - 50, ZY0 - 18, 40, 22, hexrgb("#3a4048"), D.INK, 3, wob=0)
    sweat(ctx, *cam.to_screen(t, ZX0 - 60, ZY0 - 330), t, 1.2)
    pop_text(ctx, "gulp.", 1300, 300, t, 0.6, 90, "#fff6d8", dur=1.2)


def shot_ride(ctx, t, S):
    d = S.cue(3) - S.cue(2) + 0.3
    u = ease_in(clamp(t / d)) * 0.92
    x, y = zip_point(u)
    s = 105
    cam = Cam(lambda tt: zip_point(ease_in(clamp(tt / d)) * 0.92)[0] + 120,
              lambda tt: zip_point(ease_in(clamp(tt / d)) * 0.92)[1] + 260, 1.05, shake=0.25)
    boardwalk_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        bw_zombies(ctx, t, look_up=1.0)
        p = hang_pose(t, swing=-0.4, face="scream")
        p["mouth"] = 0.9
        LEO_CAP.draw(ctx, x - 10, y + 3.75 * s - 10, s, 1, p)
        D.rrect(ctx, x - 30, y - 22, 60, 30, 8, hexrgb("#3a4048"), D.INK, 3)
    speed_lines(ctx, t, n=40, a=0.5)
    sx, sy = cam.to_screen(t, x + 120, y + 60)
    D.text(ctx, "(aaaaaaaa)", sx + 60, sy, 50, D.FONT_HAND, hexrgb("#fff6d8"), stroke=D.INK, slw=6, rot=-0.05)


def shot_slot(ctx, t, S):
    T_WIN = 1.4
    cam = Cam(Keys((0, 760), (T_WIN, 680)), Keys((0, 560), (T_WIN, 520)), Keys((0, 1.4), (T_WIN, 1.8), (2.5, 1.5)),
              shake=lambda tt: shake_k(tt, T_WIN, 0.6, 0.8))
    with layer(ctx, cam, t):
        bg(ctx, "casino", (-700, -400, 3800, 1700), lambda c: IN.casino(c, 1.0))
        spin = 1.0 if 0.25 < t < T_WIN else 0.0
        IN.slot(ctx, 600, IN.FL - 10, t, 1.0, spin=spin, win=t >= T_WIN)
        p = R.stand("side", t, 1)
        pull = clamp(t / 0.25)
        p.update(face="worried" if t < T_WIN else "shock", blink=0 if t > T_WIN else p["blink"],
                 h1=(0.75, -3.1 + 0.8 * pull if t < 0.5 else -3.1), hturn=0.7)
        LEO_CAP.draw(ctx, 380, IN.FL - 10, 120, 1, p)
        if t > T_WIN:
            r = rng(9)
            for i in range(40):
                tt = t - T_WIN - r.uniform(0, 0.8)
                if tt < 0:
                    continue
                cx = 600 + r.uniform(-60, 60) + r.uniform(-1, 1) * 300 * tt
                cy = IN.FL - 280 - 500 * tt + 900 * tt * tt
                D.ellipse(ctx, cx, min(cy, IN.FL - 20), 14, 8 if cy < IN.FL - 20 else 4, hexrgb("#e9b949"), D.INK, 2)
    if t > T_WIN:
        fx.flash(ctx, clamp(1 - (t - T_WIN) / 0.3) * 0.6, "#fff6d8")
        pop_text(ctx, "JACKPOT!!!", W / 2, 230, t, T_WIN, 160, "#ffe36a", dur=2.0)


def shot_million(ctx, t, S):
    cam = Cam(Keys((0, 1200), (3, 1300)), 560, Keys((0, 1.1), (3, 1.2)))
    with layer(ctx, cam, t):
        bg(ctx, "casino", (-700, -400, 3800, 1700), lambda c: IN.casino(c, 1.0))
        r = rng(2)
        for i in range(140):
            x = 1200 + r.gauss(0, 160)
            y = IN.FL - 10 - abs(r.gauss(0, 1)) * 80 - max(0, 200 - abs(x - 1200)) * 0.8
            D.ellipse(ctx, x, y, 16, 7, hexrgb(r.choice(["#e9b949", "#e8423c", "#2f8fd8", "#ffffff"])), D.INK, 1.5)
        p = sit_pose(t, 1, "laugh", seat=1.6)
        p.update(a1=(2.6 + 0.4 * math.sin(t * 6), 0.3), a2=(2.4, 0.3))
        LEO_CAP.draw(ctx, 1200, IN.FL - 170, 115, 1, p)
        for i in range(12):
            tt = (t * 0.9 + i / 12) % 1
            D.ellipse(ctx, 1200 + (i - 6) * 30 + tt * (i - 6) * 20, IN.FL - 600 - 300 * tt + 600 * tt * tt, 12, 6,
                      hexrgb("#e9b949"), D.INK, 1.5)
        # зомби-крупье равнодушно смотрит
        p = zombie_idle(t, 3)
        R.Fig(R.zombie_look(1870, "waiter")).draw(ctx, 2250, IN.FL - 10, 110, -1, p)
    k = ease_out_back(clamp((t - 0.3) / 0.4))
    if k > 0:
        ctx.save()
        ctx.translate(W / 2, 210)
        ctx.scale(k, k)
        D.text(ctx, "$1,000,000", 0, 0, 140, D.FONT_TITLE, hexrgb("#3fbf6a"), stroke=D.INK, slw=12)
        ctx.restore()
    if t > 1.6:
        x, y = cam.to_screen(t, 2250, 520)
        D.rrect(ctx, x - 190, y - 120, 260, 90, 40, hexrgb("#ffffff"), D.INK, 4)
        D.text(ctx, "...", x - 60, y - 60, 60, D.FONT_HAND, D.INK)


def shot_remember(ctx, t, S):
    cam = Cam(Keys((0, 600), (3, 2600)), Keys((0, -200), (3, 300)), 1.3)
    boardwalk_bg(ctx, t, cam, power=1.0)
    with layer(ctx, cam, t):
        u = clamp(t / 3)
        gx, gy = zip_point(u)
        fx.glow(ctx, gx, gy, 80, "#ffffff", 0.7)
    fx.grade(ctx, "night", 0.3)
    D.rrect(ctx, W / 2 - 420, 140, 840, 110, 20, hexrgb("#0e1410"), D.INK, 5)
    D.text(ctx, "REMEMBER THE ZIP LINE", W / 2, 215, 60, D.FONT_TITLE, hexrgb("#ff4a3a"))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_crane),
        Shot(c(1) - 0.1, shot_edge),
        Shot(c(2) - 0.4, shot_ride),
        Shot(c(3) - 0.1, shot_slot, "whip", 0.3),
        Shot(c(4) - 0.1, shot_million),
        Shot(c(5) - 0.1, shot_remember, "black", 0.3),
    ]
    S.sfx += [(c(2) - 0.4, "zip", 1.0), (c(3) + 0.2, "slot_spin", 0.8), (c(3) + 1.3, "jackpot", 1.0),
              (c(5), "sting", 0.9)]
    S.music = "night_fun"
