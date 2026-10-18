"""Крючок (день 30, рассвет): «Рози» разгоняется по рулёжке, впереди бегут зомби. Дэнни в
наушниках потеет, Пиклз на правом кресле. Затем заголовок. Кадры повторяются в дне 30."""
from scenes.kit import *
from scenes.shared import *

HY = 520            # горизонт в кадре разбега


def cabin_faces(ctx, t, face="scared", sweat=1.0, dog_bark=0.0):
    """Внутри кабины «Рози» (вид спереди): Дэнни слева, Пиклз справа — в координатах rosie_front."""
    sh = math.sin(t * 40) * 2
    DANNY_PILOT.head_only(ctx, -44 + sh, -232, 54, 1, {"view": "front", "face": face, "blink": 0, "mouth": 0.3,
                                                       "sweat": sweat, "neck_line": False})
    draw_lab(ctx, 34, -194, 34, -1, dog_pose(t, "sit", headset=True, bark=dog_bark))


def runway_run(ctx, t, run, tod="dawn", n=14, seed=30, approach=0.0, sun=(W / 2 + 120, HY - 40, 90)):
    """Вид из кабины на разбеге: рулёжка в перспективе и зомби, бегущие навстречу."""
    AP.sky(ctx, t, tod, 0, W, sun=sun, clouds=True, seed=8, hz=HY)
    fx.glow(ctx, sun[0], sun[1], 700, "#ffc890", 0.35)
    AP.runway_persp(ctx, t, tod, run=run, hy=HY)
    r = rng(seed)
    zs = []
    for i in range(n):
        lat = r.uniform(-0.9, 0.9)
        d0 = r.uniform(0.0, 0.35)
        sp = r.uniform(0.08, 0.16)
        d = d0 + approach * sp
        if d <= 0.01 or d > 1.1:
            continue
        zs.append((d, lat, i))
    zs.sort()
    for d, lat, i in zs:
        k = d ** 2.2
        y = HY + (H + 40 - HY) * k
        x = W / 2 + lat * (8 + 1300 * k)
        s = 6 + 330 * k
        p = R.gait(t * 2.2 + i * 0.37, "run", "side", i)
        p.update(view="front", a1=(1.4, -0.1), a2=(1.3, 0.0), mouth=1.0)
        p = zombie_reach(t, i)
        p.update(view="front", a1=(1.45 + 0.2 * math.sin(t * 8 + i), 0.1), a2=(1.35, 0.1), mouth=1.0,
                 f1=(0.15 * math.sin(t * 9 + i), 0), f2=(-0.15 * math.sin(t * 9 + i), 0), lean=0.0)
        R.Fig(R.zombie_look(4000 + i)).draw(ctx, x, y, s, 1, p)


def panel_overlay(ctx, t, rpm=1.0, shake=1.0):
    """Нижняя часть кадра: приборная доска «Рози» и штурвал (вид из кресла)."""
    sx = math.sin(t * 37) * 4 * shake
    sy = math.cos(t * 31) * 3 * shake
    ctx.save()
    ctx.translate(sx, sy)
    D.poly(ctx, [(-50, H - 280), (W + 50, H - 280), (W + 50, H + 50), (-50, H + 50)], hexrgb("#2b2f3a"), D.INK, 6,
           wob=0)
    RM.rosie_panel(ctx, W / 2, H - 120, 0.7, t, 1.0, rpm=rpm, fuel=1.0)
    D.poly(ctx, [(0, 0), (W, 0), (W, 70), (W - 180, 70), (W / 2 + 40, 40), (W / 2 - 40, 40), (180, 70), (0, 70)],
           hexrgb("#3a3f4a"), D.INK, 6, wob=0)
    D.line(ctx, W / 2, 40, W / 2, H - 280, D.INK, 16)
    D.line(ctx, W / 2, 40, W / 2, H - 280, hexrgb("#4a505c"), 8)
    ctx.restore()


def shot_cabin(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, -10), (d, 0)), Keys((0, -150), (d, -160)), Keys((0, 2.8), (d, 3.6, "io")),
              shake=lambda tt: 0.25)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#3a5aa8"), (0.45, "#e88aa0"), (0.62, "#ffd49a"), (0.62, "#8a8f9a"),
                              (1, "#6b707a")])
    fx.glow(ctx, 1500, 640, 600, "#ffc890", 0.45)
    with layer(ctx, cam, t):
        PL.rosie_front(ctx, 0, 100, 1.0, "dawn", spin=1.0, prop=t * 40, cabin=lambda c: cabin_faces(c, t))
    pop_text(ctx, "200 LANDINGS", 420, 230, t, 0.9, 80, "#ffe36a", dur=d, shake=False)
    if t > d * 0.62:
        pop_text(ctx, "(IN A SIMULATOR)", 420, 330, t, d * 0.62, 60, "#fff6d8", dur=d, shake=False)


def shot_runway(ctx, t, S):
    run = t * 14
    runway_run(ctx, t, run, approach=t * 2.4)
    speed_lines(ctx, t, n=40, a=0.45)
    panel_overlay(ctx, t, rpm=0.95)
    if t > 0.4:
        pop_text(ctx, "NOT EMPTY.", W / 2, 230, t, 0.4, 120, "#e8423c", dur=4, shake=True)


def shot_title(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#3a5aa8"), (0.6, "#e88aa0"), (1, "#ffd49a")])
    SEA.sun(ctx, 1500, 760, 110, "dawn")
    fx.glow(ctx, 1500, 760, 700, "#ffc890", 0.4)
    SEA.cloudbank(ctx, -200, 2200, 860, "dawn", seed=9, n=8, s0=1.0, s1=1.6)
    x = 300 + t * 160
    PL.rosie(ctx, x, 980 - t * 80, 0.42, 1, "dawn", spin=1.0, roll=-0.12, shadow=False)
    O.title_card(ctx, t)


def build(S):
    c = S.cue
    t_title = max(c(1, True) + 0.6, 7.0)
    S.shots = [
        Shot(0, shot_cabin),
        Shot(c(1) - 0.15, shot_runway, "whip", 0.25),
        Shot(t_title, shot_title, "white", 0.35),
    ]
    S.show_day = True
    S.sfx += [(0.0, "engine", 0.9), (c(1), "engine", 1.0), (c(1) + 0.3, "zombie_groan", 1.0),
              (t_title, "title_hit", 1.0)]
    S.music = "tension"
