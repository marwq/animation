"""День 24: «Айви» в полночь. Лайнер качает как игрушку в ванной, шезлонги летят сотнями, горки
ломаются. Зомби сотнями смывает за борт, волна за волной. На мостике: одна рука на штурвале, в другой
Анкор. И крик вместе с ветром — впервые тебя никто не слышит."""
from scenes.kit import *
from scenes.shared import *
from scenes.cold import bolt, bolt_line


def roll_at(t, amp=0.16, per=3.2):
    return math.sin(t * TAU / per) * amp


def rolled(ctx, ang, fn):
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.rotate(ang)
    ctx.scale(1.2, 1.2)
    ctx.translate(-W / 2, -H / 2)
    fn()
    ctx.restore()


def storm_fx(ctx, t, rain=1.4, flash_times=(0.6, 2.4, 4.1, 5.9, 7.7)):
    SEA.rain_streaks(ctx, t, 0, 0, W, H, rain, 0.7, alpha=0.5, speed=1.6)
    fx.flash(ctx, bolt(t, flash_times) * 0.55, "#e8f0ff")


def shot_ext(ctx, t, S):
    cam = Cam(0, 360, Keys((0, 0.55), (3, 0.62)), shake=0.4)
    sea_back(ctx, t, cam, "deepnight", hy=700, rough=1.0, p=0.3, clouds=False)
    with layer(ctx, cam, t, 0.3):
        SEA.cloudbank(ctx, -3000, 4000, 250, "storm", seed=24, n=12, s0=1.4, s1=2.2)
        bolt_line(ctx, 900, -700, 600, 5, bolt(t, (0.6, 2.4)))
    with layer(ctx, cam, t):
        ang = roll_at(t, 0.12, 2.6)
        heave = math.sin(t * TAU / 2.6 + 1) * 40
        ctx.save()
        ctx.translate(0, 760 + heave)
        ctx.rotate(ang)
        bg(ctx, "ship_night_dark08", (-1500, -1090, 3000, 1100), lambda c: SH.ship_side(c, 0, 0, 0.8, "night", 0.0))
        ctx.restore()
        # волны перед кораблём
        for k in range(8):
            x = -1600 + k * 450 + (t * 300) % 450
            y = 800 + math.sin(t * 3 + k) * 30
            D.poly(ctx, [(x - 260, y + 200), (x - 100, y - 60), (x, y - 120), (x + 60, y - 70), (x + 260, y + 200)],
                   hexrgb("#1a2a50"), D.INK, 4, wob=0)
            D.curve(ctx, [(x - 60, y - 90), (x, y - 125), (x + 50, y - 80)], hexrgb("#e8f0ff"), 8, 0.8)
    storm_fx(ctx, t)
    D.rrect(ctx, W - 420, 120, 300, 110, 16, hexrgb("#0e1410"), D.INK, 5)
    D.text(ctx, "00:00", W - 270, 200, 72, D.FONT_TITLE, hexrgb("#ff4a3a"))


def flying_chairs(ctx, t, n=16, seed=4, x0=200, x1=3800):
    r = rng(seed)
    for i in range(n):
        t0 = r.uniform(0, 3)
        tt = (t - t0) % 3.5
        x = r.uniform(x0, x1) + tt * r.uniform(500, 900)
        y = DK.GF - 40 - tt * r.uniform(200, 500) + 260 * tt * tt
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(tt * r.uniform(-6, 6))
        if i % 3 == 0:
            DK.umbrella(ctx, 0, 0, hexrgb(r.choice(["#e8423c", "#f2c230", "#2f8fd8"])), "storm", open_=0.6, h=180)
        else:
            DK.lounger(ctx, 0, 0, hexrgb(r.choice(["#e8423c", "#f2c230", "#2f8fd8", "#f05a8a"])), "storm")
        ctx.restore()


def shot_deck(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    T_SNAP = d * 0.72
    cam = Cam(Keys((0, 2600), (d, 3200)), 520, 0.62, shake=0.35)

    def scene():
        deck_back(ctx, t, cam, "storm", 0.0, rough=1.0, clouds=False, chairs=False, mess=0.5,
                  broken=t > T_SNAP, key="storm")
        with layer(ctx, cam, t):
            flying_chairs(ctx, t)
            DK.water(ctx, t, *DK.POOL, DK.GF + 14, tod="storm", slosh=1.0)
            if t > T_SNAP:
                k = t - T_SNAP
                ctx.save()
                ctx.translate(3800 + k * 300, 400 + k * 200 + 500 * k * k)
                ctx.rotate(k * 3)
                DK._tube(ctx, hexrgb("#c0a040"), [(-200, 0), (0, -80), (200, 0)], 60)
                ctx.restore()
    rolled(ctx, roll_at(t), scene)
    storm_fx(ctx, t)
    if t > T_SNAP:
        pop_text(ctx, "SNAP!", W / 2 + 300, 260, t, T_SNAP, 150, "#fff6d8", dur=1.2)


def shot_overboard(ctx, t, S):
    cam = Cam(Keys((0, 1800), (5, 2000)), 600, 0.7, shake=0.35)

    def scene():
        deck_back(ctx, t, cam, "storm", 0.0, rough=1.0, clouds=False, chairs=False, mess=0.6, broken=True,
                  key="storm")
        with layer(ctx, cam, t):
            r = rng(24)
            wave = int(t / 1.4)
            for i in range(36):
                grp = i % 4
                tt = t - grp * 1.4 * 0.6
                y = 950 + r.uniform(0, 260)
                x0 = r.uniform(-200, 2600)
                if tt < 0:
                    p = zombie_idle(t, i)
                    p.update(lean=-0.3, a1=(2.4, 0.3), a2=(2.1, 0.3))
                    R.Fig(R.zombie_look(2600 + i)).draw(ctx, x0, y, 95, 1, p)
                    continue
                x = x0 + 900 * tt * tt
                if x < 4300:
                    ctx.save()
                    ctx.translate(x, y)
                    ctx.rotate(-0.4 - 0.2 * math.sin(tt * 3))
                    p = R.stand("side", t, i)
                    p.update(a1=(2.8, 0.3), a2=(2.4, 0.4), k1=(0.8, 0.6), mouth=1.0)
                    R.Fig(R.zombie_look(2600 + i)).draw(ctx, 0, 0, 95, 1, p)
                    ctx.restore()
            # волна перехлёстывает через палубу
            k = (t % 1.4) / 1.4
            wx = lerp(-800, 4800, k)
            D.poly(ctx, [(wx - 900, DK.GF + 400), (wx - 300, DK.GF - 60), (wx, DK.GF - 200), (wx + 200, DK.GF - 120),
                         (wx + 400, DK.GF + 400)], hexrgb("#3f6aa8"), D.INK, 5, wob=0, alpha=0.85)
            D.curve(ctx, [(wx - 240, DK.GF - 120), (wx, DK.GF - 210), (wx + 180, DK.GF - 130)], hexrgb("#ffffff"), 12)
    rolled(ctx, roll_at(t, 0.2), scene)
    storm_fx(ctx, t)


def shot_wheel(ctx, t, S):
    roll = roll_at(t, 0.22, 2.8)
    cam = Cam(BR.WHEEL_X - 60, 560, 1.15, shake=0.3)
    bridge_back(ctx, t, cam, "deepnight", 0.0, rough=1.0, roll=-roll, battery=19, autopilot=False)
    with layer(ctx, cam, t):
        BR.wheel(ctx, BR.WHEEL_X, 640, 90, math.sin(t * 2.3) * 1.2, "night")
        p = R.stand("side", t, 1)
        p.update(face="scared", blink=0, h1=(0.85, -2.45), h2=(0.25, -2.0), lean=-roll * 0.8, hip=(roll * 0.4, 0))
        J = LEO_CAP.draw(ctx, BR.WHEEL_X - 240, BR.BF + 40, 125, 1, p)
        hx, hy = LEO_CAP.world(BR.WHEEL_X - 240, BR.BF + 40, 125, 1, J["hand2"])
        draw_cat(ctx, hx, hy - 30, 100, 1, cat_pose(t, "held", vest=True, meow=0.5 + 0.5 * math.sin(t * 6)))
        # кружка и бумаги скользят
        sx = 1700 + math.sin(t * TAU / 2.8) * 300
        D.rrect(ctx, sx, 600, 50, 60, 10, hexrgb("#ffffff"), D.INK, 3)
    storm_fx(ctx, t, 0.8)


def shot_scream(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#0a0f2a"), (1, "#1a2650")])
    p = R.stand("side", t, 1)
    p.update(face="scream", mouth=1.0, blink=0, hturn=0.6, lean=-0.1, h2=(0.3, -2.0))
    sh = math.sin(t * 50) * 6
    J = LEO_CAP.draw(ctx, 700 + sh, 1750, 360, 1, p)
    # буквы уносит ветром
    txt = "AAAAAAAAAAAH"
    for i, ch in enumerate(txt):
        tt = (t - i * 0.08) % 1.3
        if t - i * 0.08 < 0:
            continue
        x = 1050 + i * 40 + tt * 700
        y = 420 + math.sin(tt * 6 + i) * 40 - tt * 60
        D.text(ctx, ch, x, y, 130 - i * 4, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=10,
               alpha=clamp(1 - tt / 1.3), rot=tt * 0.6)
    SEA.rain_streaks(ctx, t, 0, 0, W, H, 1.6, 0.9, alpha=0.5, speed=2.0)
    fx.flash(ctx, bolt(t, (0.4, 2.0)) * 0.6, "#e8f0ff")


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_ext),
        Shot(c(1) - 0.1, shot_deck),
        Shot(c(2) - 0.1, shot_overboard),
        Shot(c(3) - 0.1, shot_wheel, "whip", 0.3),
        Shot(c(4) - 0.1, shot_scream),
    ]
    S.sfx += [(0.6, "thunder", 1.0), (c(1) + (c(2) - c(1)) * 0.72, "snap", 1.0), (c(2), "wave_crash", 1.0),
              (c(4), "scream", 1.0)]
    S.music = "hurricane"
