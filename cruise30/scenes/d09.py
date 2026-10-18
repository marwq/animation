"""День 9: две горки, пустой бассейн внизу. 41 спуск — Анкор не впечатлена. На закате большой экран
без звука и мультфильм. Триста лиц внизу поднимаются к свету. Смотрят до конца. Никто не смеётся."""
from scenes.kit import *
from scenes.shared import *

TUBE = [(DK.TOWER[1], 160), (3700, 90), (3900, 260), (3600, 380), (3500, 520), (3720, 640), (3820, 760)]
SWIM_LEO = R.Fig(R.Look(**{**R.LEO_CAP.__dict__, "body": "#2f8fd8", "details": ("trunks",), "hat": None}))


def tube_point(u):
    """Точка на трубе горки (линейно по ломаной)."""
    n = len(TUBE) - 1
    f = clamp(u) * n
    i = min(int(f), n - 1)
    k = f - i
    (x0, y0), (x1, y1) = TUBE[i], TUBE[i + 1]
    return lerp(x0, x1, k), lerp(y0, y1, k), math.atan2(y1 - y0, x1 - x0)


def slider(ctx, t, u, s=90):
    x, y, a = tube_point(u)
    ctx.save()
    ctx.translate(x, y + 10)
    ctx.rotate(a * 0.4)
    p = R.stand("side", t, 1)
    p.update(face="laugh", hip=(0, 1.2), f1=(0.9, -0.4), f2=(0.85, -0.35), a1=(2.9, 0.2), a2=(2.7, 0.3), lean=-0.5)
    SWIM_LEO.draw(ctx, 0, 0, s, 1 if math.cos(a) >= 0 else -1, p)
    ctx.restore()


def shot_slide(ctx, t, S):
    d = S.cue(1) - 0.6
    u = ease_in(clamp(t / (d - 0.6)))
    cam = Cam(lambda tt: tube_point(ease_in(clamp(tt / (d - 0.6))))[0], lambda tt: tube_point(
        ease_in(clamp(tt / (d - 0.6))))[1] + 120, Keys((0, 1.3), (d - 0.6, 1.0)), shake=0.12)
    deck_back(ctx, t, cam, "day", 1.0, sun=(3000, -200, 60))
    with layer(ctx, cam, t):
        if u < 1:
            slider(ctx, t, u)
        else:
            p = R.stand("front", t, 1)
            p.update(face="laugh", a1=(2.6, 0.3), a2=(2.6, 0.3))
            SWIM_LEO.draw(ctx, 3700, DK.GF + 110, 92, 1, p)
        DK.water(ctx, t, DK.SPLASH[0] + 20, DK.SPLASH[1] - 20, DK.GF + 12, 100, "day", ripples=[(3780, d - 0.6)])
        SEA.splash(ctx, 3780, DK.GF + 10, (t - (d - 0.6)) / 0.8, 1.4, seed=6, c="#e8fbff")
    if u < 1:
        speed_lines(ctx, t, n=30, a=0.4)
        pop_text(ctx, "WHEEEEE!", 600, 260, t, 0.2, 110, "#ffe36a", dur=d - 0.8, shake=False)


def shot_count(ctx, t, S):
    """41 раз: врезки со всплесками и счётчик; Анкор на шезлонге — без восторга."""
    cam = Cam(3500, 760, 1.15)
    deck_back(ctx, t, cam, "golden", 1.0, sun=(4200, 300, 60))
    with layer(ctx, cam, t):
        ph = (t * 1.2) % 1
        if ph < 0.5:
            slider(ctx, t, 0.6 + ph * 0.8)
        else:
            SEA.splash(ctx, 3780, DK.GF + 10, (ph - 0.5) / 0.5, 1.3, seed=int(t * 1.2), c="#e8fbff")
        DK.water(ctx, t, DK.SPLASH[0] + 20, DK.SPLASH[1] - 20, DK.GF + 12, 100, "golden")
        DK.lounger(ctx, 3000, DK.GF + 60, hexrgb("#f05a8a"), "golden")
        draw_cat(ctx, 3010, DK.GF - 25, 95, 1, cat_pose(t, "lie", blink=1.0))
    n = min(41, 38 + int(t * 1.2))
    D.rrect(ctx, 80, 830, 300, 130, 24, hexrgb("#fff6d8"), D.INK, 5)
    D.text(ctx, "x%d" % n, 230, 925, 96, D.FONT_TITLE, hexrgb("#e8423c"))
    x, y = cam.to_screen(t, 3010, DK.GF - 200)
    D.rrect(ctx, x - 140, y - 90, 220, 80, 36, hexrgb("#ffffff"), D.INK, 4)
    D.text(ctx, "meh.", x - 30, y - 37, 50, D.FONT_HAND, D.INK)


def shot_screen_on(ctx, t, S):
    T_ON = 0.9
    cam = Cam(Keys((0, 2400), (3, 2150)), Keys((0, 600), (3, 380)), Keys((0, 0.95), (3, 0.62)))
    deck_back(ctx, t, cam, "sunset", 1.0, sun=(3200, 480, 75), screen=False)
    with layer(ctx, cam, t):
        if t > T_ON:
            DK.screen_cartoon(ctx, t - T_ON, alpha=clamp((t - T_ON) / 0.3))
            DK.screen_glow(ctx, clamp((t - T_ON) / 0.3))
        p = R.stand("side", t, 1)
        p.update(face="smile", h1=(0.7, -2.0) if t < T_ON else (0.4, -1.6), hturn=0.3)
        LEO_CAP.draw(ctx, 2700, DK.GF + 60, 105, -1, p)
        D.rrect(ctx, 2480, DK.GF - 140, 140, 90, 10, hexrgb("#3a4048"), D.INK, 4)
        D.circle(ctx, 2550, DK.GF - 95, 18, hexrgb("#3fbf6a") if t > T_ON else hexrgb("#e8423c"), D.INK, 3)
    # «без звука»
    ctx.save()
    ctx.translate(W - 220, 200)
    D.poly(ctx, [(-60, -25), (-30, -25), (0, -55), (0, 55), (-30, 25), (-60, 25)], hexrgb("#fff6d8"), D.INK, 5, wob=0)
    D.line(ctx, 20, -30, 70, 30, hexrgb("#e8423c"), 10)
    D.line(ctx, 70, -30, 20, 30, hexrgb("#e8423c"), 10)
    ctx.restore()


def faces_up(ctx, t, cam, k=1.0):
    with layer(ctx, cam, t):
        r = rng(91)
        for i in range(60):
            x = r.uniform(600, 3600)
            y = 1150 + r.uniform(0, 260)
            s = 110 * (1 + (y - 1200) / 700)
            p = zombie_idle(t, i)
            p.update(neck=-0.7 * k, look=(0, -1), mouth=0.4 + 0.4 * k, hturn=r.uniform(-0.3, 0.3))
            R.Fig(R.zombie_look(1900 + i)).draw(ctx, x, y, s, 1 if i % 2 else -1, p)


def shot_faces(ctx, t, S):
    cam = Cam(Keys((0, 2100), (3, 2050)), Keys((0, 700), (3, 820)), Keys((0, 0.75), (3, 0.85)))
    deck_back(ctx, t, cam, "dusk", 1.0, screen=False)
    with layer(ctx, cam, t):
        DK.screen_cartoon(ctx, t + 3)
        DK.screen_glow(ctx)
    faces_up(ctx, t, cam, clamp(t / 1.0))
    fx.tint(ctx, "#8fc8ff", 0.12, cairo.OPERATOR_ADD)


def shot_the_end(ctx, t, S):
    cam = Cam(2200, Keys((0, 420), (3, 460)), Keys((0, 0.8), (3, 0.75)))
    deck_back(ctx, t, cam, "dusk", 1.0, screen=False)
    with layer(ctx, cam, t):
        sx, sy, sw, sh = DK.SCREEN
        D.rect(ctx, sx, sy, sw, sh, hexrgb("#1a1f2c"), None, 0, wob=0)
        D.text(ctx, "THE END", sx + sw / 2, sy + sh / 2 + 40, 140, D.FONT_TITLE, hexrgb("#fff6d8"))
        DK.screen_glow(ctx, 0.5)
        # Лео с кошкой и попкорном на краю экрана
        ex, ey = sx + sw - 120, sy - 30
        p = sit_pose(t, 1, "neutral", seat=0.0)
        p.update(h1=(0.6, -1.8), f1=(0.5, 0.9), f2=(0.42, 0.95))
        LEO_CAP.draw(ctx, ex, ey, 85, -1, p)
        draw_cat(ctx, ex + 120, ey, 70, -1, cat_pose(t, "sit"))
        D.poly(ctx, [(ex - 110, ey - 160), (ex - 70, ey - 160), (ex - 76, ey - 105), (ex - 104, ey - 105)],
               hexrgb("#e8423c"), D.INK, 2, wob=0)
        for k in range(5):
            D.circle(ctx, ex - 106 + k * 9, ey - 166 - (k % 2) * 6, 7, hexrgb("#fff6d8"), D.INK, 1.5)
    faces_up(ctx, t, cam, 1.0)
    pop_text(ctx, "...", 1500, 900, t, 0.8, 120, "#fff6d8", dur=2.5, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_slide),
        Shot(c(1) - 0.6, shot_count),
        Shot(c(2) - 0.1, shot_screen_on, "fade", 0.4),
        Shot(c(3) - 0.1, shot_faces),
        Shot(c(4) - 0.1, shot_the_end),
    ]
    S.tods = [(0, "day"), (c(2), "dusk")]
    S.sfx += [(c(1) - 1.2, "splash", 1.0), (c(2) + 0.8, "click", 0.7)]
    S.music = "fun_to_eerie"
