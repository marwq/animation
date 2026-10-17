"""День 11: дождь, голосовое от мамы, лазанья и угловой кусочек. Слёзы — и удар в стекло."""
from scenes.kit import *
from scenes.shared import hand_phone
from scenes.d01 import out_crowd
from sets import stores as ST

GLASS_Y0, GLASS_Y1 = 120, 860


def window_night(ctx, t, rain=1.0, crack=0.0, lady=None):
    """Большая витрина изнутри, ночь, дождь. lady(ctx) — кто снаружи."""
    C.sky(ctx, -400, -200, 2800, 900, "night", moon=None)
    C.skyline(ctx, -400, 2400, 560, "night", depth=0, seed=111, hmin=160, hmax=360)
    D.rect(ctx, -400, 560, 2800, 300, hexrgb("#2c2c3a"), None, 0, wob=0)
    if lady:
        lady(ctx)
    fx.rain(ctx, t, rain, 0.3, rect=(-400, GLASS_Y0, 2800, GLASS_Y1 - GLASS_Y0))
    D.col(ctx, "#8fa8b8", 0.22)
    ctx.rectangle(-400, GLASS_Y0, 2800, GLASS_Y1 - GLASS_Y0)
    ctx.fill()
    fx.drops_on_glass(ctx, t, (-400, GLASS_Y0, 2800, GLASS_Y1 - GLASS_Y0), n=120, alpha=0.35)
    for x in (-60, 700, 1460, 2220):
        D.rect(ctx, x - 12, GLASS_Y0, 24, GLASS_Y1 - GLASS_Y0, hexrgb("#4a4744"), D.INK, 3, wob=0)
    if crack > 0:
        cx, cy = 1110, 690
        D.col(ctx, hexrgb("#e9eef2"), 0.85)
        ctx.set_line_width(3)
        r = rng(4)
        for k in range(11):
            a = k * TAU / 11 + r.uniform(-0.2, 0.2)
            L = r.uniform(90, 230) * crack
            ctx.move_to(cx, cy)
            mx, my = cx + math.cos(a) * L * 0.5 + r.uniform(-12, 12), cy + math.sin(a) * L * 0.5 + r.uniform(-12, 12)
            ctx.line_to(mx, my)
            ctx.line_to(cx + math.cos(a) * L, cy + math.sin(a) * L)
        for rr in (40, 90):
            ctx.arc(cx, cy, rr * crack, 0, TAU)
        ctx.stroke()
    D.rect(ctx, -400, GLASS_Y0 - 40, 2800, 40, hexrgb("#4a4744"), D.INK, 3, wob=0)
    D.rect(ctx, -400, GLASS_Y1, 2800, 40, hexrgb("#4a4744"), D.INK, 3, wob=0)
    D.rect(ctx, -400, GLASS_Y1 + 40, 2800, 400, hexrgb("#c9bca2"), None, 0, wob=0)
    D.line(ctx, -400, GLASS_Y1 + 40, 2400, GLASS_Y1 + 40, D.INK, 3)


def sit_pose(t, face="sad", lean=0.0):
    p = R.stand("side", t, 2)
    p.update(k1=(2.15, 1.85), k2=(2.0, 1.7), hip=(0, 1.5), lean=-0.05 + lean, neck=0.35, h1=(0.75, -1.2),
             h2=(0.7, -1.15), face=face)
    return p


def shot_rain(ctx, t, S):
    cam = Cam(Keys((0, 960), (5, 1000)), Keys((0, 560), (5, 640)), Keys((0, 1.0), (5, 1.3)))
    with layer(ctx, cam, t):
        window_night(ctx, t, 1.0)
        HERO.draw(ctx, 1000, GLASS_Y1 + 120, 120, 1, sit_pose(t))
        draw_dog(ctx, 1290, GLASS_Y1 + 124, 100, -1, dog_pose(t, "lie"))
    fx.darkness(ctx, 0.45, [fx.Light(*cam.to_screen(t, 1100, 900), 700, power=0.7, glow="#bcd2ff", glow_a=0.1)])
    fx.grade(ctx, "night", 0.5)


def shot_voicemail(ctx, t, S):
    def scr(ctx, x, y, w, h):
        D.text(ctx, "Voicemail", x + w / 2, y + 130, 40, D.FONT_DAY, hexrgb("#1c1c22"), bold=True)
        D.circle(ctx, x + w / 2, y + 260, 70, hexrgb("#c9805a"), None, 0)
        D.text(ctx, "Mom", x + w / 2, y + 380, 44, D.FONT_DAY, hexrgb("#1c1c22"), bold=True)
        D.text(ctx, "Day 1, 9:41 PM", x + w / 2, y + 425, 26, D.FONT_DAY, hexrgb("#8a8d96"))
        # волна
        for k in range(24):
            hh = 10 + 60 * abs(math.sin(k * 0.7 + t * 6)) * (1 if t > 0.6 else 0.1)
            D.rect(ctx, x + 30 + k * 15, y + 520 - hh / 2, 8, hh, hexrgb("#3f8ae0"), None, 0, wob=0)
        D.circle(ctx, x + w / 2, y + 650, 50, hexrgb("#3f8ae0"), None, 0)
        if t < 0.6:
            D.poly(ctx, [(x + w / 2 - 14, y + 625), (x + w / 2 - 14, y + 675), (x + w / 2 + 24, y + 650)],
                   hexrgb("#ffffff"), None, 0, wob=0)
        else:
            D.rect(ctx, x + w / 2 - 18, y + 628, 12, 44, hexrgb("#ffffff"), None, 0, wob=0)
            D.rect(ctx, x + w / 2 + 6, y + 628, 12, 44, hexrgb("#ffffff"), None, 0, wob=0)
    hand_phone(ctx, t, scr, bars=0, battery=0.5)


def shot_memory(ctx, t, S):
    """Воспоминание: тёплая кухня, мама и Лили с лазаньей."""
    cam = Cam(Keys((0, 1200), (6, 1350)), Keys((0, 600), (6, 620)), Keys((0, 1.0), (6, 1.15)))
    with layer(ctx, cam, t):
        bg(ctx, "kitchen", (-400, -100, 2800, 1400), ST.kitchen)
        p = R.stand("side", t, 5)
        p.update(face="smile", a1=(0.9, 1.2), hturn=0.4)
        MOM.draw(ctx, 1080, 880, 110, 1, p)
        p2 = R.stand("front", t, 6)
        p2.update(face="happy", h1=(-0.2, -2.9 + 0.1 * math.sin(t * 3)), h2=(0.3, -2.9))
        LILY.draw(ctx, 1560, 880, 110, 1, p2)
        # угловой кусочек на тарелке
        px = 1560
        py = 880 - 110 * 0.72 * 2.95
        D.ellipse(ctx, px, py, 70, 16, hexrgb("#f4efe4"), D.INK, 3)
        D.poly(ctx, [(px - 40, py - 6), (px + 30, py - 6), (px + 30, py - 40), (px - 40, py - 40)], hexrgb("#c9502f"),
               D.INK, 2.5, wob=0)
        D.rect(ctx, px - 40, py - 30, 70, 8, hexrgb("#f2c45a"), None, 0, wob=0)
    fx.grade(ctx, "memory", 0.6)
    # рамка воспоминания
    ctx.save()
    g = cairo.RadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1000)
    g.add_color_stop_rgba(0, 1, 0.95, 0.85, 0)
    g.add_color_stop_rgba(1, 1, 0.95, 0.85, 0.85)
    ctx.set_source(g)
    ctx.paint()
    ctx.restore()


def shot_replay(ctx, t, S):
    cam = Cam(960, 560, Keys((0, 1.6), (3, 1.75)))
    with layer(ctx, cam, t):
        window_night(ctx, t, 1.0)
        p = sit_pose(t, "sad")
        tap = max(0, math.sin(t * 5)) * 0.08
        p.update(h1=(0.85, -1.75 - tap), h2=(0.8, -1.7))
        HERO.draw(ctx, 1000, GLASS_Y1 + 120, 120, 1, p)
        x, y = HERO.world(1000, GLASS_Y1 + 120, 120, 1, (0.85, -1.75))
        D.rect(ctx, x - 6, y - 40, 26, 46, hexrgb("#1c1c22"), D.INK, 2, wob=0)
        fx.glow(ctx, x + 6, y - 20, 90, "#cfe0ff", 0.3)
    fx.darkness(ctx, 0.45, [fx.Light(*cam.to_screen(t, 1100, 700), 600, power=0.75, glow_a=0.05)])
    fx.grade(ctx, "night", 0.5)


def shot_cry(ctx, t, S):
    """Плачет. Претцель встаёт и лижет лицо."""
    cam = Cam(1060, 640, 2.0)
    with layer(ctx, cam, t):
        window_night(ctx, t, 1.0)
        p = sit_pose(t, "cry")
        p["tears_t"] = t * 0.7
        p["hturn"] = 0.6 if t > 1.2 else 1.0
        HERO.draw(ctx, 1000, GLASS_Y1 + 120, 120, 1, p)
        k = smooth((t - 0.6) / 0.6)
        lick = math.sin(t * 16) * 6 * (1 if t > 1.2 else 0)
        draw_dog(ctx, lerp(1300, 1190, k) + lick, GLASS_Y1 + 124 - 120 * k, 100, -1,
                 dog_pose(t, "sit" if k > 0.5 else "lie", wag=1.5))
    fx.darkness(ctx, 0.4, [fx.Light(*cam.to_screen(t, 1100, 700), 700, power=0.75, glow_a=0.05)])
    fx.grade(ctx, "night", 0.5)


def shot_bang(ctx, t, S):
    """БАМ: лицо в стекло прямо рядом с его головой. Тряска, трещина, герой отпрыгивает."""
    T = 0.25
    cam = Cam(Keys((0, 1060), (T, 1060), (T + 0.4, 1000)), Keys((0, 600), (T + 0.4, 560)),
              Keys((0, 2.0), (T, 2.0), (T + 0.4, 1.5, "out")), shake=lambda t: shake_k(t, T, 0.8, 2.2))

    def lady(c):
        k = clamp(t / T)
        x = lerp(1500, 1090, ease_in(k))
        p = zombie_reach(t, 5)
        p.update(a1=(1.7, -0.6), a2=(1.6, -0.5), lean=0.1 if t > T else 0.35, mouth=1.0)
        LIBERTY.draw(c, x, 1200, 145, -1, p)
    with layer(ctx, cam, t):
        window_night(ctx, t, 1.0, crack=clamp((t - T) / 0.05), lady=lady)
        if t < T:
            HERO.draw(ctx, 1000, GLASS_Y1 + 120, 120, 1, sit_pose(t, "cry"))
        else:
            k = ease_out(clamp((t - T) / 0.35))
            p = R.stand("side", t, 2)
            p.update(face="scream", blink=0, k1=(1.9, 1.2), k2=(1.4, 0.9), hip=(0, 1.2 - 0.3 * k), lean=-0.4,
                     a1=(2.8, 0.4), a2=(2.5, 0.6), hturn=0.3)
            HERO.draw(ctx, 1000 - 300 * k, GLASS_Y1 + 140 + 60 * k, 128, -1, p)
        draw_dog(ctx, 1190 - 400 * clamp((t - T) / 0.4), GLASS_Y1 + 130, 100, -1,
                 dog_pose(t, "run" if t > T else "sit", phase=t * 3, bark=1.0 if t > T else 0))
    fx.darkness(ctx, 0.4, [fx.Light(*cam.to_screen(t, 1100, 700), 800, power=0.75, glow_a=0.05)])
    fx.grade(ctx, "night", 0.45)
    if t >= T:
        fx.flash(ctx, (1 - clamp((t - T) / 0.15)) * 0.7, "#ffffff")
        k = clamp((t - T) / 0.1)
        ctx.save()
        ctx.translate(W / 2 + 300, 300)
        ctx.rotate(0.12)
        sc = ease_out_back(k) * (1.0 + 0.04 * math.sin(t * 50))
        ctx.scale(sc, sc)
        D.text(ctx, "BANG!", 0, 0, 180, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=16,
               alpha=clamp(1.8 - (t - T)))
        ctx.restore()


def shot_holds(ctx, t, S):
    """Общий план: она прижата к треснувшему стеклу, стекло держит. Он дышит на полу."""
    cam = Cam(Keys((0, 1000), (4, 960)), Keys((0, 600), (4, 560)), Keys((0, 1.3), (4, 1.05)))

    def lady(c):
        p = zombie_reach(t, 5)
        p.update(a1=(1.7, -0.6), a2=(1.6, -0.5), lean=0.1, mouth=0.8)
        LIBERTY.draw(c, 1090, 1200, 145, -1, p)
    with layer(ctx, cam, t):
        window_night(ctx, t, 1.0, crack=1.0, lady=lady)
        p = R.stand("side", t, 2)
        br = math.sin(t * 8) * 0.04
        p.update(face="scared", blink=0, k1=(1.9, 1.2), k2=(1.4, 0.9), hip=(0, 0.9), lean=-0.35 + br, a1=(-0.6, 0.3),
                 a2=(-0.7, 0.2), hturn=0.5, mouth=0.4 + 0.4 * math.sin(t * 8))
        HERO.draw(ctx, 700, GLASS_Y1 + 200, 128, -1, p)
        draw_dog(ctx, 520, GLASS_Y1 + 205, 100, 1, dog_pose(t, "stand", bark=0.6))
    fx.darkness(ctx, 0.4, [fx.Light(*cam.to_screen(t, 1100, 700), 900, power=0.75, glow_a=0.05)])
    fx.grade(ctx, "night", 0.45)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_rain),
        Shot(c(1) - 0.1, shot_voicemail),
        Shot(c(2) - 0.2, shot_memory, "white", 0.4),
        Shot(c(3) - 0.1, shot_replay, "fade", 0.4),
        Shot(c(4) - 0.1, shot_cry),
        Shot(c(5) - 0.05, shot_bang),
        Shot(c(6) - 0.1, shot_holds),
    ]
    S.sfx += [(c(5) + 0.2, "glass_bang", 1.2), (0, "rain_loop", 0.5)]
