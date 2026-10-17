"""День 5: что-то скребётся в зоомагазине. Попугай «hello» и щенок корги — Претцель."""
from scenes.kit import *
from scenes.shared import gallery_bg, gallery_rail, gs, GF
from sets import stores as ST

PET_GATES = {n: 1.0 for n, _, _ in M.STORES}
PET_X = 1220 + 120      # x витрины PAWS & CLAWS в галерее (4-я по счёту при start=0)


def broom(ctx, J, which="hand1", other="hand2", up=False):
    """Метла в руках (локальные координаты)."""
    hx, hy = J[which]
    ox, oy = J[other]
    dx, dy = hx - ox, hy - oy
    L = math.hypot(dx, dy) or 1
    ux, uy = dx / L, dy / L
    top = (ox - ux * 0.6, oy - uy * 0.6)
    bot = (hx + ux * 1.3, hy + uy * 1.3)
    D.line(ctx, *top, *bot, hexrgb("#a5764a"), 0.07)
    ctx.save()
    ctx.translate(*bot)
    ctx.rotate(math.atan2(uy, ux) - math.pi / 2)
    D.poly(ctx, [(-0.18, 0), (0.18, 0), (0.28, 0.42), (-0.28, 0.42)], hexrgb("#d6b24c"), D.INK, 0.03, wob=0)
    ctx.restore()


def store_x(name, start=0):
    x = -1400 + 120
    i = start
    while True:
        nm = M.STORES[i % len(M.STORES)][0]
        if nm == name and x > 0:
            return x
        x += 560 + 140
        i += 1


PX = store_x("PAWS & CLAWS")


def shot_scratch(ctx, t, S):
    w = Walk(Keys((0, PX - 900), (S.cue(1) - 0.3, PX - 120, "out")), GF + 40, gs(), "sneak", t1=10)
    shk = 0.6 + 0.4 * math.sin(t * 7)
    cam = Cam(Keys((0, PX - 300), (6, PX + 150)), 560, Keys((0, 1.05), (6, 1.35)))
    gates = dict(PET_GATES)
    gates["PAWS & CLAWS"] = 0.0
    with layer(ctx, cam, t):
        gallery_bg("d05", "day", 0.9, gates)(ctx)
        ctx.save()
        ctx.translate(math.sin(t * 60) * 4 * shk, 0)
        C.shutter(ctx, PX, GF - 470, 560, 470, 1.0, seed=7)
        ctx.restore()
        w.draw(ctx, HERO, t, {"face": "worried"}, props=lambda c, J, l: broom(c, J) if l == "front" else None)
    with layer(ctx, cam, t, 1.3):
        gallery_rail(ctx)
    fx.grade(ctx, "warm", 0.15)
    for k in range(3):
        ph = (t * 1.3 + k / 3) % 1
        D.text(ctx, "scratch", W / 2 + 260 + k * 60, 520 - ph * 120, 40, D.FONT_HAND, D.INK, alpha=(1 - ph) * 0.8,
               rot=-0.2)


def shot_open(ctx, t, S):
    """Решётка ползёт вверх, герой держит метлу над головой."""
    frac = 1 - smooth(t / 2.0)
    cam = Cam(PX + 280, 520, Keys((0, 1.25), (2.5, 1.4)))
    gates = dict(PET_GATES)
    gates["PAWS & CLAWS"] = 0.0
    with layer(ctx, cam, t):
        gallery_bg("d05", "day", 0.9, gates)(ctx)
        C.shutter(ctx, PX, GF - 470, 560, 470, frac, seed=7)
        p = R.stand("front", t, 1)
        p.update(h1=(-0.35, -3.9 - 0.1 * math.sin(t * 8)), h2=(0.35, -3.95), face="scared", blink=0, hip=(0, 0.06))
        HERO.draw(ctx, PX + 420, GF + 60, gs(GF + 60), 1, p,
                  extra=lambda c, J, l: broom(c, J, "hand2", "hand1") if l == "front" else None)
    fx.grade(ctx, "warm", 0.15)


def shot_parrot(ctx, t, S):
    cam = Cam(Keys((0, 500), (2.2, 1450)), 520, 1.15)
    with layer(ctx, cam, t):
        bg(ctx, "petstore", (-400, -100, 2800, 1400), ST.pet_store)
        talk = 1.0 if 1.4 < t < 2.0 else 0.0
        ST.parrot(ctx, 1500, 515, 1.6, t, talk)
    fx.grade(ctx, "warm", 0.1)
    if t > 1.45:
        k = clamp((t - 1.45) / 0.2)
        x, y = cam.to_screen(t, 1560, 280)
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(ease_out_back(k), ease_out_back(k))
        D.rrect(ctx, -150, -60, 300, 110, 40, hexrgb("#fffaf0"), D.INK, 4)
        D.poly(ctx, [(-40, 46), (-10, 46), (-60, 90)], hexrgb("#fffaf0"), D.INK, 4, wob=0)
        D.text(ctx, "HELLO", 0, 22, 64, D.FONT_HAND, D.INK)
        ctx.restore()


def treats_bag(ctx, x, y, s=1.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.poly(ctx, [(-50, 0), (50, 0), (40, -120), (10, -110), (-10, -130), (-40, -115)], hexrgb("#c23b33"), D.INK, 3)
    D.text(ctx, "TREATS", 0, -50, 22, D.FONT_TITLE, hexrgb("#f4efe4"))
    for k in range(6):
        D.ellipse(ctx, -70 + k * 30, 6 + (k % 2) * 8, 10, 6, hexrgb("#a86a3a"), D.INK, 1.5)
    ctx.restore()


def shot_puppy(ctx, t, S):
    """Щенок вылетает из-за клеток, прыгает на героя — тот падает. Облизывает лицо."""
    T_JUMP, T_HIT = 1.0, 1.35
    cam = Cam(Keys((0, 1100), (T_HIT, 900), (3, 760)), Keys((0, 560), (T_HIT, 660)),
              Keys((0, 1.2), (T_HIT, 1.5), (4, 1.6)), shake=lambda t: shake_k(t, T_HIT, 0.4, 0.6))
    with layer(ctx, cam, t):
        bg(ctx, "petstore", (-400, -100, 2800, 1400), ST.pet_store)
        treats_bag(ctx, 1500, 880, 1.0)
        hx, hy = 800, 900
        if t < T_HIT:
            p = R.stand("side", t, 1)
            p.update(face="scared" if t > 0.6 else "neutral", blink=0, a1=(0.9, 1.0), a2=(0.7, 1.2))
            HERO.draw(ctx, hx, hy, 92, 1, p)
        else:
            k = clamp((t - T_HIT) / 0.35)
            p = R.stand("side", t, 1)
            p.update(face="laugh" if t > T_HIT + 0.8 else "scared", k1=(1.4, 0.4), k2=(1.0, 0.2),
                     a1=(2.5, 0.4), a2=(2.2, 0.6), blink=0)
            ctx.save()
            ctx.translate(hx - 40, hy)
            ctx.rotate(-1.45 * ease_out(k))
            HERO.draw(ctx, 40, 0, 92, 1, p)
            ctx.restore()
        # щенок
        if t < T_JUMP:
            dx = lerp(1450, 1050, t / T_JUMP)
            draw_dog(ctx, dx, hy + 4, 92, -1, dog_pose(t, "run", phase=t * 3.2))
        elif t < T_HIT:
            k = (t - T_JUMP) / (T_HIT - T_JUMP)
            dx = lerp(1050, hx + 60, k)
            draw_dog(ctx, dx, hy + 4 - math.sin(math.pi * k) * 160, 92, -1, dog_pose(t, "jump", jump=k * 0.5))
        else:
            lick = math.sin(t * 14) * 10
            k = clamp((t - T_HIT) / 0.4)
            draw_dog(ctx, lerp(hx - 60, hx - 250, smooth(k)) + lick * 0.3, hy - 26, 92, -1,
                     dog_pose(t, "stand", wag=1.5, bark=0.0))
    fx.grade(ctx, "warm", 0.1)


def shot_bark(ctx, t, S):
    """Гав! Герой зажимает ему пасть, «тсс», косится на окна, потом смеётся."""
    T_B = 0.35
    cam = Cam(960, 690, Keys((0, 1.65), (3, 1.8)))
    with layer(ctx, cam, t):
        bg(ctx, "petstore", (-400, -100, 2800, 1400), ST.pet_store)
        p = R.stand("side", t, 1)
        p.update(k1=(1.9, 2.3), k2=(1.3, 2.1), hip=(0, 0.95), lean=0.25)
        if t < T_B + 0.4:
            p.update(face="shock", blink=0, a1=(0.4, 0.4))
        elif t < 2.2:
            p.update(face="worried", h1=(0.95, -2.35), hturn=0.2, look=(-0.6, -0.3))
        else:
            p.update(face="laugh", h1=(0.9, -1.2))
        HERO.draw(ctx, 850, 900, 120, 1, p)
        bark = 1.0 if T_B < t < T_B + 0.4 else 0.0
        draw_dog(ctx, 1080, 902, 120, -1, dog_pose(t, "sit", bark=bark, wag=1.2))
    fx.grade(ctx, "warm", 0.1)
    if T_B < t < T_B + 0.6:
        k = clamp((t - T_B) / 0.12)
        ctx.save()
        ctx.translate(1240, 330)
        ctx.rotate(-0.15)
        sc = ease_out_back(k) * (1 + 0.05 * math.sin(t * 40))
        ctx.scale(sc, sc)
        D.text(ctx, "WOOF!", 0, 0, 150, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=14)
        ctx.restore()
    if 1.1 < t < 2.2:
        D.text(ctx, "shhh...", 760, 300, 80, D.FONT_HAND, hexrgb("#f7eedb"), stroke=D.INK, slw=9,
               alpha=clamp((t - 1.1) / 0.2))


def shot_together(ctx, t, S):
    """Герой и Претцель идут по галерее."""
    w = Walk(Keys((0, 200), (8, 1650, "lin")), GF + 40, gs(), "walk", t1=10)
    cam = Cam(lambda t: w.x(t) + 160, 580, 1.2)
    with layer(ctx, cam, t):
        gallery_bg("d05b", "day", 0.9, PET_GATES)(ctx)
        w.draw(ctx, HERO, t, {"face": "smile"})
        dx = w.x(t) + 140
        draw_dog(ctx, dx, GF + 50, gs() * 0.95, 1, dog_pose(t, "trot", phase=w.dist(t) / 0.9 * 1.3))
    with layer(ctx, cam, t, 1.3):
        gallery_rail(ctx)
    fx.grade(ctx, "warm", 0.15)
    k = clamp((t - 0.5) / 0.3)
    if k > 0:
        x, y = cam.to_screen(t, dx, GF - 70)
        D.text(ctx, "PRETZEL", x, y - 40, 64, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=8, alpha=k)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_scratch),
        Shot(c(1) - 0.2, shot_open),
        Shot(c(2) - 0.4, shot_parrot),
        Shot(c(3) - 0.1, shot_puppy),
        Shot(c(4) + 0.9, shot_bark),
        Shot(c(5) - 0.3, shot_together, "fade", 0.3),
    ]
    S.sfx += [(c(4) + 1.25, "bark", 1.0), (c(2) + 1.0, "parrot_hello", 0.9)]
