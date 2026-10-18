"""Крючок (день 28, полночь): гроза, пирамида зомби поднимается к крылу мостика, рука хватает
Лео за щиколотку. Затем заголовок. Сцена wing_scene повторяется в дне 28."""
from scenes.kit import *
from scenes.shared import *

PYR_X = 1790         # колонна пирамиды за краем крыла


def bolt(t, times=(0.4, 2.9, 5.6, 8.1)):
    """Яркость молнии в момент t."""
    a = 0.0
    for t0 in times:
        k = t - t0
        if 0 <= k < 0.35:
            a = max(a, (1 - k / 0.35) * (1.0 if k > 0.06 or k < 0.03 else 0.4))
    return a


def bolt_line(ctx, x, y0, y1, seed, a):
    if a <= 0:
        return
    r = rng(seed)
    pts = [(x, y0)]
    y = y0
    while y < y1:
        y += r.uniform(40, 90)
        pts.append((pts[-1][0] + r.uniform(-60, 60), y))
    D.polyline(ctx, pts, hexrgb("#ffffff"), 7, a)
    D.polyline(ctx, pts, hexrgb("#bfe0ff"), 16, a * 0.4)


def pyramid(ctx, t, height, x=PYR_X, s=100, seed=0, reach=1.0):
    """Колонны зомби на плечах друг у друга; height — уровень макушки верхнего (мировой y)."""
    lvl = (R.HIP_H + R.TORSO + 0.2) * s
    for col in range(2):
        cx = x + col * 150
        top = height + col * 90
        n = 7
        for k in range(n):
            gy = top + lvl * (k + 1) - 0.0
            if gy - lvl > 2400:
                continue
            look = R.zombie_look(900 + seed * 20 + col * 10 + k)
            p = R.stand("side", t, k)
            sw = math.sin(t * 3 + k + col) * 0.1
            if k == 0:
                p = zombie_reach(t, k)
                p.update(a1=(2.4 + sw * 2 * reach, 0.25), a2=(2.1 - sw, 0.4), lean=-0.1, neck=-0.1,
                         mouth=0.7 + 0.3 * math.sin(t * 6 + col))
            else:
                p.update(h1=(0.25, -3.1), h2=(-0.1, -3.05), mouth=0.5, lean=-0.04 + sw * 0.3)
            R.Fig(look).draw(ctx, cx + sw * 20, gy, s, -1, p)


def wing_scene(ctx, t, cam, height, grab=None, leo_x=1430, face="scared", cat_mode="held", rain=1.0, flash=0.0,
               hatch=False, release=None):
    """Крыло мостика ночью в грозу. grab — время хвата за щиколотку (или None)."""
    sea_back(ctx, t, cam, "deepnight", rough=0.9, hy=1500, clouds=False, p=0.2)
    with layer(ctx, cam, t, 0.2):
        SEA.cloudbank(ctx, -3000, 6000, 600, "night", seed=5, n=12, s0=1.2, s1=2.0)
        bolt_line(ctx, 2600, -900, 700, 3, flash)
    with layer(ctx, cam, t):
        bg(ctx, "wing_night_lower", (-700, -600, 3500, 3300), lambda c: OD.wing(c, "night", 0.0, lower=True))
        pyramid(ctx, t, height)
        pl = R.stand("side", t, 1)
        pl.update(face=face, blink=0, lean=-0.12, hturn=0.9, h1=(0.45, -2.15), h2=(0.38, -2.05))
        if grab is not None and t > grab:
            k = clamp((t - grab) / 0.25)
            pl.update(f1=(0.35 + 0.25 * k, -0.15 * k), face="scream")
            if release is not None and t > release - 0.3:
                kk = math.sin(clamp((t - release + 0.3) / 0.6) * math.pi)
                pl.update(f1=(0.6 + 0.55 * kk, -0.15 - 0.3 * kk), face="angry" if t < release + 0.6 else "shock")
        J = LEO_CAP.draw(ctx, leo_x, OD.WING_Y, 100, 1, pl)
        if cat_mode == "held":
            draw_held_cat(ctx, LEO_CAP, leo_x, OD.WING_Y, 100, 1, J, t, scale=0.85, vest=True, meow=0.0)
        if grab is not None and t > grab - 0.3 and (release is None or t < release):
            k = clamp((t - grab + 0.3) / 0.3)
            fx_, fy_ = LEO_CAP.world(leo_x, OD.WING_Y, 100, 1, J["foot1"])
            sx, sy = PYR_X - 20, OD.WING_Y - 130
            hx = lerp(sx - 30, fx_ + 10, ease_out(k))
            hy = lerp(sy + 10, fy_ - 10, ease_out(k))
            D.line(ctx, sx, sy, hx, hy, D.INK, 26)
            D.line(ctx, sx, sy, hx, hy, hexrgb("#4a5a6e"), 18)
            D.circle(ctx, hx, hy, 24, hexrgb(R.ZOMBIE_SKIN[1]), D.INK, 4)
            for j in range(4):
                a = math.pi + 0.5 - j * 0.35
                D.line(ctx, hx, hy, hx + math.cos(a) * 34, hy + math.sin(a) * 34 + 10, D.INK, 13)
                D.line(ctx, hx, hy, hx + math.cos(a) * 34, hy + math.sin(a) * 34 + 10, hexrgb(R.ZOMBIE_SKIN[1]), 7)
    fx.grade(ctx, "night", 0.18)
    SEA.rain_streaks(ctx, t, 0, 0, W, H, 1.2 * rain, 0.5, alpha=0.45, speed=1.3)
    if flash > 0:
        fx.flash(ctx, flash * 0.75, "#e8f0ff")


def shot_ext(ctx, t, S):
    """Лайнер в грозу, наезд на крыло мостика."""
    d = S.cue(1) - 0.2
    cam = Cam(Keys((0, 300), (d, 520)), Keys((0, 380), (d, 260)), Keys((0, 0.55), (d, 1.1)), shake=0.25)
    sea_back(ctx, t, cam, "storm", rough=1.0, hy=700, clouds=False, p=0.4)
    with layer(ctx, cam, t, 0.4):
        SEA.cloudbank(ctx, -3000, 4000, 300, "storm", seed=3, n=10, s0=1.0, s1=1.8)
        bolt_line(ctx, 1400, -600, 600, 7, bolt(t))
    ship_ext(ctx, t, cam, 0, 760, 0.9, "storm", 0.0, wake=0.3, smoke=False)
    fx.grade(ctx, "night", 0.3)
    SEA.rain_streaks(ctx, t, 0, 0, W, H, 1.3, 0.5, alpha=0.6, speed=1.4)
    fx.flash(ctx, bolt(t) * 0.6, "#e8f0ff")


def shot_pyramid(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    height = Keys((0, 1300), (d + 1.0, 330, "out"))(t)
    cam = Cam(Keys((0, 1450), (d, 1500)), Keys((0, 520), (d, 330)), Keys((0, 0.7), (d, 0.95)),
              shake=lambda tt: 0.35)
    wing_scene(ctx, t, cam, height, flash=bolt(t + S.cue(1)))


def shot_grab(ctx, t, S):
    tg = 0.5
    cam = Cam(Keys((0, 1560), (tg, 1560)), Keys((0, 280), (tg, 320)), Keys((0, 1.1), (tg + 0.1, 1.5, "out")),
              shake=lambda tt: 0.4 + shake_k(tt, tg, 0.6, 1.2))
    wing_scene(ctx, t, cam, 300, grab=tg, face="scream", flash=bolt(t + S.cue(2)))
    if t > tg:
        pop_text(ctx, "AAAH!", 640, 250, t, tg + 0.05, 150, "#fff6d8")
    if t > 1.6:
        fx.flash(ctx, clamp((t - 1.6) / 0.25), "#000000")


def shot_title(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#060a24"), (1, "#16296a")])
    cam = Cam(960, 540, Keys((0, 0.9), (3, 1.0)))
    with layer(ctx, cam, t):
        SEA.cloudbank(ctx, -400, 2300, 250, "night", seed=9, n=8, s0=1.0, s1=1.6)
        bolt_line(ctx, 1500, -100, 500, 11, bolt(t, (0.05, 1.9)))
    ship_ext(ctx, t, Cam(960, 540, 1.0), 960, 1020, 0.55, "night", 0.0, wake=0.2, smoke=False)
    SEA.rain_streaks(ctx, t, 0, 0, W, H, 0.8, 0.5, alpha=0.3)
    fx.flash(ctx, bolt(t, (0.05,)) * 0.5, "#e8f0ff")
    O.title_card(ctx, t)


def build(S):
    c = S.cue
    t_title = max(c(2, True) + 0.7, 7.0)
    S.shots = [
        Shot(0, shot_ext),
        Shot(c(1) - 0.2, shot_pyramid, "whip", 0.3),
        Shot(c(2) - 0.15, shot_grab),
        Shot(t_title, shot_title),
    ]
    S.show_day = True
    S.sfx += [(0.4, "thunder", 1.0), (2.9, "thunder", 0.8), (c(2) + 0.35, "grab", 1.0), (c(2) + 0.4, "scream", 1.0),
              (t_title, "title_hit", 1.0)]
    S.music = "storm"
