"""День 5: спортивная палуба, крем от загара, двадцать зомби. Наверх по скалодрому — рекорд.
Внизу тянутся и срываются с первой зацепки. Правило второе: они не умеют лазить.
Ночью Лео поднимает трап на мостик. Дом."""
from scenes.kit import *
from scenes.shared import *
from scenes.d04 import shot_rule as _rule_base

WX0, WX1 = OD.WALL_X
WALL_MID = (WX0 + WX1) / 2


def sports_bg(ctx, t, cam, tod="day", scale=1.0):
    sea_back(ctx, t, cam, tod, sun=(2400, -300, 70) if tod == "day" else None, hy=620, p=0.3)
    with layer(ctx, cam, t):
        bg(ctx, "sports_" + tod, (-1300, -1300, 4900, 2800), lambda c: OD.sports(c, tod), scale)


def horde(ctx, t, n=20, x0=-800, x1=600, target=None, k=0.0, reach=False, seed=51):
    r = rng(seed)
    for i in range(n):
        y = OD.OF + 20 + r.uniform(0, 260)
        s = 95 * (1 + (y - 1000) / 900)
        xa = r.uniform(x0, x1)
        x = lerp(xa, target + (i % 5 - 2) * 90 - (y - OD.OF) * 0.2, k) if target is not None else xa
        look = R.zombie_look(1600 + i)
        if reach:
            p = zombie_reach(t, i)
            p.update(a1=(2.5 + 0.25 * math.sin(t * 5 + i), 0.2), a2=(2.3, 0.3), lean=-0.1, neck=-0.2, mouth=0.9)
        else:
            p = R.gait(t * 1.4 + i * 0.37, "shamble", "side", i) if 0 < k < 1 else zombie_idle(t, i)
            p.update(a1=(1.4, -0.1), a2=(1.2, 0.0))
        R.Fig(look).draw(ctx, x, y, s, 1, p)


def shot_sunscreen(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, 1500), (d, 1100)), 640, Keys((0, 1.2), (d, 0.85)))
    sports_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        horde(ctx, t, 20, -1400, -600, target=900, k=0.75 * clamp((t - 1.0) / d))
        got = t > 1.6
        p = R.stand("side", t, 1)
        if not got:
            p.update(face="worried", lean=0.6, hip=(0, 0.25), h1=(0.9, -0.6 + 0.1 * math.sin(t * 9)), hturn=0.9)
        else:
            p.update(face="laugh", h1=(0.3, -3.6), hturn=0.5)
        J = LEO_CAP.draw(ctx, 1450, OD.OF + 60, 115, 1, p)
        hx, hy = LEO_CAP.world(1450, OD.OF + 60, 115, 1, J["hand1"])
        D.rrect(ctx, hx - 16, hy - 70, 32, 70, 8, hexrgb("#f2c230"), D.INK, 3)
        D.rect(ctx, hx - 10, hy - 84, 20, 16, hexrgb("#e8423c"), D.INK, 2, wob=0)
        D.rrect(ctx, 1520, OD.OF - 60, 220, 120, 10, hexrgb("#2f8fd8"), D.INK, 4)
        D.text(ctx, "TOWELS", 1630, OD.OF + 10, 34, D.FONT_TITLE, hexrgb("#fff6d8"))
    if t > 1.6:
        pop_text(ctx, "SPF 50!", 1200, 260, t, 1.65, 90, "#f2c230", dur=1.2)


def shot_surround(ctx, t, S):
    cam = Cam(Keys((0, 900), (1.2, 1250)), Keys((0, 600), (1.2, 400)), Keys((0, 0.8), (1.2, 1.3), (2.6, 1.0)))
    sports_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        horde(ctx, t, 20, -600, 0, target=WALL_MID - 300, k=0.55 + 0.35 * clamp(t / 3))
        p = R.stand("side", t, 1)
        p.update(face="scared", blink=0, hturn=-0.5 if t < 1.2 else 0.3, look=(0.0, -1.0) if t > 1.2 else (-1, 0),
                 lean=-0.08)
        LEO_CAP.draw(ctx, WALL_MID, OD.OF + 40, 115, -1, p)
    if t > 1.3:
        x, y = W / 2 + 40, 160
        for k in range(3):
            D.text(ctx, "↑", x + (k - 1) * 120, y + math.sin(t * 8 + k) * 12, 110, D.FONT_TITLE, hexrgb("#fff6d8"),
                   stroke=D.INK, slw=8)


def climb_u_at(t, dur=2.6):
    top_u = (OD.OF - (OD.WALL_TOP - 40)) / 115.0
    return top_u * ease_io(clamp(t / dur)), top_u


def shot_climb(ctx, t, S):
    u, top_u = climb_u_at(t)
    y_leo = OD.OF + 40 - u * 115
    cam = Cam(WALL_MID + 150, lambda tt: OD.OF + 40 - climb_u_at(tt)[0] * 115 - 200, 1.0, shake=0.12)
    sports_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        horde(ctx, t, 20, -300, 400, target=WALL_MID - 100, k=0.7 + 0.3 * clamp(t / 2), reach=t > 0.8)
        if u < top_u - 0.05:
            draw_climber(ctx, LEO_CAP, WALL_MID, OD.OF + 40, 115, u * 1.0, 1, "back", "scream")
        else:
            p = R.stand("side", t, 1)
            p.update(face="laugh")
            LEO_CAP.draw(ctx, WALL_MID, OD.WALL_TOP - 40, 115, 1, p)
    speed_lines(ctx, t, n=30, a=0.35)
    if t > 2.5:
        k = ease_out_back(clamp((t - 2.5) / 0.3))
        ctx.save()
        ctx.translate(W / 2 + 380, 300)
        ctx.rotate(-0.2)
        ctx.scale(k, k)
        D.rrect(ctx, -260, -70, 520, 140, 20, None, hexrgb("#e8423c"), 12)
        D.text(ctx, "NEW RECORD", 0, 26, 74, D.FONT_TITLE, hexrgb("#e8423c"))
        ctx.restore()


def shot_lookdown(ctx, t, S):
    """У подножия: тянутся, скребут, один хватается за зацепку и срывается."""
    cam = Cam(Keys((0, WALL_MID - 100), (5, WALL_MID - 40)), Keys((0, 560), (5, 600)), Keys((0, 1.0), (5, 1.15)))
    sports_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        horde(ctx, t, 16, -300, 400, target=WALL_MID - 100, k=1.0, reach=True, seed=52)
        # смельчак: хватается за первую зацепку и падает
        hx, hy, _ = OD._holds()[1]
        k = (t % 2.4) / 2.4
        look = R.zombie_look(1690, "trunks")
        if k < 0.45:
            p = zombie_reach(t, 3)
            p.update(h1=(0.3, -3.3), h2=(0.2, -3.2), mouth=0.9, f1=(0.2, -0.3 * (k / 0.45)))
            R.Fig(look).draw(ctx, hx - 40, OD.OF + 40, 100, 1, p)
        else:
            kk = (k - 0.45) / 0.55
            ctx.save()
            ctx.translate(hx - 60 - kk * 80, OD.OF + 40)
            ctx.rotate(-1.4 * ease_out(clamp(kk * 2)))
            p = R.stand("side", t, 3)
            p.update(a1=(2.7, 0.3), a2=(2.4, 0.5), mouth=1.0)
            R.Fig(look).draw(ctx, 0, 0, 100, 1, p)
            ctx.restore()
            if kk < 0.3:
                impact(ctx, hx - 200, OD.OF + 10, kk / 0.3, 80)
        for i in range(4):
            sx = WX0 + 30 + i * 90
            sy = OD.OF - 60 - (i % 2) * 40
            D.curve(ctx, [(sx, sy), (sx + 10, sy + 40), (sx, sy + 80)], hexrgb("#ffffff"), 5, 0.6 + 0.4 * math.sin(t * 9 + i))
    # Лео сверху смотрит вниз — врезка в углу
    ctx.save()
    D.rrect(ctx, 1380, 80, 470, 330, 30, hexrgb("#bfe6f2"), D.INK, 6)
    ctx.rectangle(1384, 84, 462, 322)
    ctx.clip()
    D.vgrad(ctx, 1380, 80, 470, 330, [(0, "#6cc4f4"), (1, "#c8efff")])
    p = R.stand("front", t, 1)
    p.update(face="laugh" if t > 2 else "scared", look=(0, 1), hip=(0, 0.3), h1=(-0.45, -2.2), h2=(0.45, -2.2))
    LEO_CAP.head_only(ctx, 1615, 270, 150, 1, {"view": "front", "face": "laugh" if t > 2.2 else "shock",
                                                 "look": (0, 1), "neck_line": False})
    ctx.restore()


def shot_rule2(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#16a39a"), (1, "#0f6a7a")])
    ctx.save()
    ctx.translate(W / 2, H / 2 + 20)
    ctx.rotate(0.03)
    D.rect(ctx, -620, -340, 1240, 680, hexrgb("#fbf6e6"), D.INK, 6, wob=0)
    for k in range(9):
        D.line(ctx, -600, -220 + k * 64, 600, -220 + k * 64, hexrgb("#9fd0f0"), 3)
    D.line(ctx, -480, -340, -480, 340, hexrgb("#f08a8a"), 4)
    D.text(ctx, "RULE #1: THEY FOLLOW NOISE.", -420, -150, 60, D.FONT_HAND, hexrgb("#7a8a9a"), "left")
    t1, t2 = "RULE #2:", "THEY CAN'T CLIMB."
    D.text(ctx, t1[:int(clamp(t / 0.4) * len(t1))], -420, -10, 110, D.FONT_HAND, hexrgb("#c23b33"), "left")
    D.text(ctx, t2[:int(clamp((t - 0.5) / 0.9) * len(t2))], -420, 150, 110, D.FONT_HAND, D.INK, "left")
    ctx.restore()


def shot_home(ctx, t, S):
    """Ночь: Лео на площадке у мостика поднимает трап."""
    lx = DK.LADDER_X
    up = smooth(clamp((t - 0.4) / 2.2))
    cam = Cam(lx + 60, Keys((0, 120), (3.5, 20)), Keys((0, 1.0), (3.5, 1.15)))
    deck_back(ctx, t, cam, "night", 1.0, moon=(lx + 900, -250, 45), has_ladder=False)
    with layer(ctx, cam, t):
        # окно мостика за спиной
        D.rect(ctx, lx - 330, -330, 760, 280, hexrgb("#eef0f0"), D.INK, 5, wob=0)
        D.rect(ctx, lx - 300, -300, 700, 150, hexrgb("#ffd978"), D.INK, 4, wob=0)
        for k in range(4):
            D.line(ctx, lx - 300 + k * 175, -300, lx - 300 + k * 175, -150, D.INK, 6)
        fx.glow(ctx, lx + 50, -220, 400, "#ffd978", 0.3)
        DK.ladder(ctx, lx + 40, 110 - 600 * up, 780 - 600 * up, "night")
        p = R.stand("side", t, 1)
        pull = math.sin(t * 7) * (1 - up)
        p.update(face="determined" if up < 1 else "smile", h1=(0.75, -1.8 + 0.4 * pull), h2=(0.65, -1.6 - 0.4 * pull),
                 lean=0.35 * (1 - up))
        LEO_CAP.draw(ctx, lx - 50, 62, 100, 1, p)
        draw_cat(ctx, lx - 130, 62, 80, 1, cat_pose(t, "sit", hat=True))
    if t > 2.6:
        pop_text(ctx, "HOME.", W / 2, 250, t, 2.6, 130, "#ffe36a", dur=3.0, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_sunscreen),
        Shot(c(1) - 0.1, shot_surround),
        Shot(c(2) - 0.1, shot_climb),
        Shot(c(3) - 0.1, shot_lookdown),
        Shot(c(4) - 0.1, shot_rule2, "fade", 0.25),
        Shot(c(5) - 0.1, shot_home, "black", 0.4),
    ]
    S.tods = [(0, "day"), (c(5), "night")]
    S.sfx += [(c(2), "whoosh", 0.8), (c(2) + 2.5, "ding", 0.8), (c(4), "pencil", 0.6)]
    S.music = "chase"
