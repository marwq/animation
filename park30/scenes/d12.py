"""День 12 (ночь): 37 дыр, а ткань в парке — только костюмы: дракон, корова, танцующий хот-дог. Режешь всё.
Шьёшь всю ночь, Бандит ворует нитки. К утру шар будто в нём взорвался зоопарк. 13 дыр закрыто."""
from scenes.kit import *
from scenes.shared import *

RACK_X = 2200                 # вешалка в костюмерной (между шкафчиками и полкой с головами)
SEW_X = 1700 + 420            # швейная машинка в мастерской
STOOL_H = 168


def scissors(ctx, x, y, s=1.0, ang=0.0, open_k=0.5):
    """Большие портновские ножницы: (x, y) — кольца; лезвия вперёд по ang."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    for k in (-1, 1):
        a = k * 0.25 * open_k
        ctx.save()
        ctx.rotate(a)
        D.poly(ctx, [(30, -6 * k), (150, -2 * k), (150, 4 * k), (30, 10 * k)], hexrgb("#c9d0d6"), D.INK, 3, wob=0)
        D.ellipse(ctx, 0, 14 * k, 22, 14, None, D.INK, 9)
        D.ellipse(ctx, 0, 14 * k, 22, 14, None, hexrgb("#e8423c"), 5)
        ctx.restore()
    D.circle(ctx, 32, 2, 6, hexrgb("#5a606c"), D.INK, 2)
    ctx.restore()


def costume_back(ctx, t, cam):
    room_back(ctx, t, cam, "costume_night", lambda c: IN.costume_room(c, "night"), (-600, -900, 4200, 2700), 0.7)


def shot_fabric(ctx, t, S):
    """Костюмерная ночью: Тео с ножницами перед вешалкой — дракон, корова, хот-дог."""
    d = S.cue(1) - 0.1
    cam = Cam(RACK_X - 300, 420, Keys((0, 0.82), (d, 0.9)))
    costume_back(ctx, t, cam)
    with layer(ctx, cam, t):
        IN.costume_rack(ctx, RACK_X, IN.FL + 20, tod="night")
        p = R.stand("side", t, 1)
        p.update(face="worried", look=(1, -0.3), h1=(0.8, -2.5), h2=(0.3, -1.7), hturn=0.4)
        J = THEO_FUR.draw(ctx, RACK_X - 800, IN.FL + 60, 112, 1, p)
        hx, hy = THEO_FUR.world(RACK_X - 800, IN.FL + 60, 112, 1, J["hand1"])
        scissors(ctx, hx, hy, 1.0, -0.4, 0.3 + 0.3 * abs(math.sin(t * 3)))
        draw_raccoon(ctx, RACK_X - 1150, IN.FL + 80, 105, 1, raccoon_pose(t, "sit", look=0.3))
    counter_badge(ctx, "HOLES", 37, W - 300, 160, "#ff8a7a", 380)
    if t > d * 0.4:
        pop_text(ctx, "ONLY FABRIC: COSTUMES", W / 2 - 200, 230, t, d * 0.4, 70, "#fff6d8", dur=d, shake=False)


def shot_cut(ctx, t, S):
    """Три «снип»: дракон, корова, танцующий хот-дог — в каждом по вырезанному куску."""
    d = S.cue(2) - S.cue(1)
    step = d / 3.2
    i = min(2, int(t / step))
    cut = min(3, int((t + step * 0.45) / step))
    tx = RACK_X - 230 + i * 230
    cam = Cam(Keys((0, RACK_X - 230), (step, RACK_X - 230), (step * 1.25, RACK_X, "io"), (step * 2, RACK_X),
                   (step * 2.25, RACK_X + 230, "io")), 380, 1.25)
    costume_back(ctx, t, cam)
    with layer(ctx, cam, t):
        IN.costume_rack(ctx, RACK_X, IN.FL + 20, tod="night", cut=cut)
        p = R.stand("side", t, 1)
        snip = (t % step) / step
        p.update(face="neutral", look=(1, -0.2), h1=(1.0, -2.75), h2=(0.6, -2.4), lean=0.1)
        x = tx - 330
        J = THEO_FUR.draw(ctx, x, IN.FL + 60, 112, 1, p)
        hx, hy = THEO_FUR.world(x, IN.FL + 60, 112, 1, J["hand1"])
        scissors(ctx, hx, hy, 1.0, -0.15, abs(math.sin(snip * math.pi * 4)))
        if 0.45 < snip < 0.8:      # вырезанный кусок падает в руку
            k = (snip - 0.45) / 0.35
            col = ("#3fbf6a", "#fbfaf6", "#c8503a")[i]
            D.poly(ctx, [(tx - 40, IN.FL - 620 + k * 120), (tx + 50, IN.FL - 640 + k * 120),
                         (tx + 70, IN.FL - 480 + k * 120), (tx - 20, IN.FL - 450 + k * 120)], hexrgb(col), D.INK, 3,
                   wob=0)
    lab = ("THE DRAGON", "THE COW", "THE DANCING HOT DOG")[i]
    pop_text(ctx, lab, W / 2, 200, t, i * step + 0.1, 80, ("#7ee04a", "#fbfaf6", "#ffd23a")[i], dur=step - 0.1,
             shake=False)
    pop_text(ctx, "SNIP!", W / 2 + 420, 520, t, i * step + step * 0.45, 80, "#fff6d8", dur=0.5)


def shot_sew(ctx, t, S):
    """Мастерская ночью: Тео шьёт под лампой, часы бегут; Бандит утаскивает катушку — нитка тянется за ним."""
    d = S.cue(3) - S.cue(2)
    T_GRAB = d * 0.4
    hour = 23 + int(clamp(t / d) * 5)
    cam = Cam(SEW_X - 50, IN.FL - 380, Keys((0, 1.05), (d, 0.95)))
    room_back(ctx, t, cam, "workshop_night", lambda c: IN.workshop(c, "night", patches_done=6),
              (-600, -900, 4200, 2700), 0.6)
    with layer(ctx, cam, t):
        top = IN.FL - 280
        # табурет и Тео за машинкой
        D.rect(ctx, SEW_X - 470, IN.FL - STOOL_H, 120, 24, hexrgb("#8a5a34"), D.INK, 3, wob=0)
        for lx in (SEW_X - 460, SEW_X - 370):
            D.line(ctx, lx, IN.FL - STOOL_H + 20, lx, IN.FL + 20, D.INK, 8)
        p = sit_pose(t, 1, "worried" if t < T_GRAB + 0.4 else "shock", seat=STOOL_H / 112)
        push = math.sin(t * 7) * 0.06
        p.update(h1=(1.25 + push, -2.35), h2=(1.0 + push, -2.3), look=(1, 0.5), neck=0.2)
        if t > T_GRAB + 0.4:
            p.update(hturn=-0.8, look=(-1, 0.2), h1=(0.9, -2.6))
        THEO_FUR.draw(ctx, SEW_X - 410, IN.FL + 20, 112, 1, p)
        # ткань под иглой, ползёт
        off = (t * 60) % 120
        D.rect(ctx, SEW_X + 40 - off, top - 12, 420, 14, hexrgb("#3fbf6a"), D.INK, 3, wob=0)
        D.rect(ctx, SEW_X + 140 - off, top - 12, 120, 14, hexrgb("#fbfaf6"), D.INK, 3, wob=0)
        # катушка: на штыре машинки → у Бандита
        if t < T_GRAB:
            spx, spy = SEW_X + 40, top - 175
            draw_raccoon(ctx, SEW_X + 360, top, 95, -1, raccoon_pose(t, "sit", look=-0.4 + 0.3 * math.sin(t * 2)))
        else:
            u = clamp((t - T_GRAB) / (d - T_GRAB - 0.3))
            bx = lerp(SEW_X + 200, SEW_X - 1400, u)
            gy = IN.FL + 40 if u > 0.08 else lerp(top, IN.FL + 40, u / 0.08)
            draw_raccoon(ctx, bx, gy, 95, -1, raccoon_pose(t, "run", phase=t * 3.2))
            spx, spy = bx - 0.5 * 95, gy - 0.62 * 95
            D.curve(ctx, [(SEW_X + 120, top - 40), (SEW_X + 60, IN.FL), (lerp(SEW_X + 60, spx, 0.5), IN.FL + 50),
                          (spx, spy)], hexrgb("#ff4a6a"), 3)
        D.rect(ctx, spx - 16, spy - 26, 32, 52, hexrgb("#ff4a6a"), D.INK, 3, wob=0)
        D.rect(ctx, spx - 22, spy - 30, 44, 8, hexrgb("#e8d0a0"), D.INK, 2, wob=0)
        D.rect(ctx, spx - 22, spy + 22, 44, 8, hexrgb("#e8d0a0"), D.INK, 2, wob=0)
        D.radial(ctx, SEW_X + 120, top - 200, 520, "#fff2c0", 0.3, 0)
    fx.darkness(ctx, 0.45, [fx.Light(*cam.to_screen(t, SEW_X + 60, IN.FL - 420), 700, power=0.7, glow_a=0.0)])
    h12 = (hour % 24) % 12 or 12
    clock_badge(ctx, "%d %s" % (h12, "PM" if hour % 24 >= 12 else "AM"), t, W - 260, 150, "#ffd23a")
    if t > T_GRAB + 0.4:
        pop_text(ctx, "HEY!", W / 2 - 260, 260, t, T_GRAB + 0.4, 110, "#fff6d8", dur=1.0)


def shot_zoo(ctx, t, S):
    """Утро: шар разложен на траве — весь в пятнах коровы, чешуе дракона и горчице; Тео спит на нём."""
    d = S.dur - S.cue(3)
    cam = Cam(1700, 760, Keys((0, 0.85), (d, 0.92)))
    grass_back(ctx, t, cam, "morning", -1000, 5000, sun=(600, 200, 110))
    with layer(ctx, cam, t):
        BL.laid_out(ctx, 1000, PK.FL + 160, 0.8, "morning", patches=10, t=t)
        p = R.stand("side", t, 1)
        p.update(face="sleep", blink=1)
        draw_lying(ctx, THEO_FUR, 1700, PK.FL + 150, 100, 1, p, 0.0, t)
        draw_raccoon(ctx, 2050, PK.FL + 170, 95, -1, raccoon_pose(t, "sleep"))
        for j in range(3):
            ph = (t * 0.45 + j / 3) % 1
            D.text(ctx, "Z", 1720 + ph * 90, PK.FL - 10 - ph * 140, 40 + 26 * ph, D.FONT_TITLE, hexrgb("#2a3a7a"),
                   alpha=min(1.0, (1 - ph) * 2))
    for j in range(4):           # утренние птицы
        bx = (t * 120 + j * 380) % (W + 400) - 200
        by = 330 + j * 40 + 12 * math.sin(t * 2 + j)
        fl = 14 * math.sin(t * 9 + j)
        D.polyline(ctx, [(bx - 22, by - fl), (bx, by), (bx + 22, by - fl)], D.INK, 4)
    counter_badge(ctx, "FIXED", "13/37", W - 320, 160, "#7ee04a", 420)
    if t > 0.5:
        pop_text(ctx, "A ZOO EXPLODED", W / 2 - 200, 230, t, 0.5, 80, "#ffd23a", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_fabric, "fade", 0.4),
        Shot(c(1) - 0.1, shot_cut, "fade", 0.25),
        Shot(c(2) - 0.1, shot_sew, "fade", 0.3),
        Shot(c(3) - 0.1, shot_zoo, "white", 0.4),
    ]
    S.tods = [(0, "night"), (c(3), "morning")]
    step = (c(2) - c(1)) / 3.2
    S.sfx += [(c(1) + step * k + step * 0.45, "snip", 0.9) for k in range(3)]
    S.sfx += [(c(2) + 0.2, "sewing", 0.8), (c(2) + (c(3) - c(2)) * 0.4, "scamper", 0.8), (c(3) + 0.4, "birds", 0.6),
              (c(3) + 0.8, "snore", 0.5)]
    S.music = [(0, "mystery", 0.7), (c(1), "comic", 0.9), (c(2), "sneak", 0.8), (c(3), "warm", 0.8)]
