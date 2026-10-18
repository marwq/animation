"""Эпилог: Ки-Уэст. Долорес ниже, чем ты думал. Бисквит обожает Анкор. Анкор не обожает Бисквита.
А на пляже Майами волна выносит бутылку: «Мама. Теперь я капитан»."""
from scenes.kit import *
from scenes.shared import *


def place_tag(ctx, txt, t, c="#fff6d8"):
    k = ease_out_back(clamp(t / 0.35))
    ctx.save()
    ctx.translate(70, 80)
    ctx.scale(k, k)
    D.rrect(ctx, 0, -50, 40 + 34 * len(txt), 100, 24, hexrgb("#1c3f7c"), D.INK, 6)
    D.text(ctx, txt, 20 + 17 * len(txt), 22, 62, D.FONT_TITLE, hexrgb(c))
    ctx.restore()


def heart(ctx, x, y, r, a=1.0):
    pts = []
    for i in range(40):
        u = i / 40 * TAU
        pts.append((x + r * 0.06 * 16 * math.sin(u) ** 3,
                    y - r * 0.06 * (13 * math.cos(u) - 5 * math.cos(2 * u) - 2 * math.cos(3 * u) - math.cos(4 * u))))
    D.poly(ctx, pts, hexrgb("#f05a8a"), D.INK, 4, wob=0, alpha=a)


def shot_keywest(ctx, t, S):
    d = S.cue(1) - 0.1
    t1, t2 = d * 0.42, d * 0.7
    GY = 1010
    cam = Cam(Keys((0, 1000), (t1, 900), (d, 760)), Keys((0, 560), (d, 620)), Keys((0, 0.9), (t1, 1.05), (d, 1.2)))
    with layer(ctx, cam, t):
        bg(ctx, "keywest", (-600, -400, 3200, 1800), lambda c: IN.keywest_porch(c, 0, "day"))
        SEA.gulls(ctx, t, 0, 1200, 0, 200, n=4)
        # Долорес и Лео обнимаются
        hug = smooth(clamp((t - 0.4) / 0.5))
        p = R.stand("side", t, 5)
        p.update(face="laugh", h1=(0.6, -2.6 + 0.4 * hug), h2=(0.55, -2.5 + 0.4 * hug), hturn=0.5)
        DOLORES.draw(ctx, lerp(420, 580, hug), GY, 115, 1, p)
        q = R.stand("side", t, 1)
        q.update(face="happy", h1=(0.5, -2.4), h2=(0.6, -2.2), hturn=0.5)
        LEO_CAP.draw(ctx, 800, GY, 115, -1, q)
        # Бисквит и Анкор
        if t > t1 - 0.3:
            bx = 1350 + math.sin(t * 5) * 60
            draw_beagle(ctx, bx, GY + 20, 95, -1 if math.cos(t * 5) > 0 else 1,
                        dog_pose(t, "trot", phase=t * 6, wag=1.0, bark=0.5 if t > t2 else 0.0))
        if t < t2:
            draw_cat(ctx, 1500, GY + 20, 80, -1, cat_pose(t, "sit", look=0.2))
        else:
            k = clamp((t - t2) / 0.35)
            hx, hy = 800, GY - 3.9 * 115
            draw_cat(ctx, lerp(1500, hx, k), lerp(GY + 20, hy, k) - math.sin(k * math.pi) * 200, 80, -1,
                     cat_pose(t, "jump" if k < 1 else "hiss", meow=1.0 if k >= 1 else 0.0))
    # «ниже, чем ты думал»: рост-линейка
    if 0.9 < t < t1 + 0.3:
        a = clamp((t - 0.9) / 0.2) * clamp((t1 + 0.3 - t) / 0.2)
        x0, y0 = cam.to_screen(t, 900, GY)
        _, yl = cam.to_screen(t, 0, GY - 3.95 * 115)
        _, yd = cam.to_screen(t, 0, GY - 3.95 * 115 * 0.9)
        D.line(ctx, x0, yl, x0 - 520, yl, hexrgb("#ffe36a"), 6, a)
        D.line(ctx, x0 - 380, yd, x0 - 700, yd, hexrgb("#f05a8a"), 6, a)
        D.text(ctx, "SHORTER!", x0 - 560, yd - 30, 56, D.FONT_TITLE, hexrgb("#f05a8a"), stroke=D.INK, slw=6, alpha=a)
    if t1 < t < t2 + 0.2:
        x, y = cam.to_screen(t, 1350 + math.sin(t * 5) * 60, GY - 120)
        for i in range(3):
            ph = (t * 1.2 + i / 3) % 1
            heart(ctx, x - 60 + i * 60, y - ph * 160, 28, 1 - ph)
    if t > t2 + 0.35:
        pop_text(ctx, "HSSSS!", 1250, 280, t, t2 + 0.35, 120, "#f2782e", dur=2.0)
    place_tag(ctx, "KEY WEST", t)


def shot_beach(ctx, t, S):
    d = S.dur - S.cue(1)
    T_LETTER = (S.cue(1, True) - S.cue(1)) * 0.5
    if t < T_LETTER:
        cam = Cam(Keys((0, 1000), (T_LETTER, 1150)), Keys((0, 620), (T_LETTER, 700)),
                  Keys((0, 1.0), (T_LETTER, 1.3)))
        with layer(ctx, cam, t):
            IN.beach(ctx, t, "day")
            k = smooth(clamp(t / (T_LETTER * 0.8)))
            IN.bottle(ctx, lerp(1500, 1180, k), lerp(700, 800, k) + math.sin(t * 4) * 8, 0.9, 1.2 - 0.5 * k)
            # Макс бежит, мама позади
            w = Walk(Keys((0, 300), (T_LETTER, 980, "out")), 1000, 80, "run", t1=T_LETTER + 1)
            w.draw(ctx, MAX, t, {"face": "laugh"})
            m = R.stand("side", t, 3)
            m.update(face="happy", h1=(0.4, -3.1), hturn=0.6)
            MOM.draw(ctx, 300 + 200 * k, 1010, 110, 1, m)
        place_tag(ctx, "MIAMI BEACH", t)
        return
    tt = t - T_LETTER
    D.vgrad(ctx, 0, 0, W, H, [(0, "#ffe2b0"), (1, "#f6a88a")])
    ctx.save()
    ctx.translate(W / 2, H / 2 + 20)
    ctx.rotate(-0.03)
    s = 1 + 0.03 * tt
    ctx.scale(s, s)
    D.rect(ctx, -560, -360, 1120, 720, hexrgb("#fbf3dc"), D.INK, 6, wob=0)
    for i, (txt, t0) in enumerate((("Dear Mom.", 0.0), ("I'm the captain now.", 0.9), ("— Leo  +  Anchor", 2.2))):
        n = int(clamp((tt - t0) / 0.8) * len(txt))
        D.text(ctx, txt[:n], -460, -170 + i * 160, 96 if i < 2 else 70, D.FONT_HAND, hexrgb("#2a3a7a"), "left")
    if tt > 2.9:
        k = ease_out_back(clamp((tt - 2.9) / 0.3))
        ctx.translate(380, 220)
        ctx.scale(k, k)
        D.circle(ctx, 0, 0, 70, None, hexrgb("#e8423c"), 6)
        D.text(ctx, "MAX", 0, 16, 44, D.FONT_TITLE, hexrgb("#e8423c"), rot=-0.2)
    ctx.restore()
    if tt > 1.0:
        k = ease_out_back(clamp((tt - 1.0) / 0.4))
        LEO_CAP.head_only(ctx, 1730, 820, 130 * k, 1, {"view": "front", "face": "happy", "neck_line": False})


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_keywest, "white", 0.4),
        Shot(c(1) - 0.1, shot_beach, "fade", 0.4),
    ]
    S.show_day = False
    S.sfx += [(1.0, "laugh", 0.6), ((c(1) - 0.1) * 0.7 + 0.35, "hiss_cat", 0.9), (c(1) + 0.3, "wave_soft", 0.8)]
    S.music = "happy_end"
