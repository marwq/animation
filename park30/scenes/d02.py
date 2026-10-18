"""День 2: просыпаешься в костюмерной — кто-то ест твой сэндвич. Настоящая енотиха смотрит на тебя, на
костюм и решает, что ты её мама. Бандит. Ворота на цепи, мост забит машинами и кое-чем похуже.
Парк теперь остров. И ты на нём."""
from scenes.kit import *
from scenes.shared import *

BENCH_X = 1900       # лавка с ланчбоксом
SLEEP_X = 900        # где спит Тео


def costume_bg(ctx, t, cam, tod="morning"):
    room_back(ctx, t, cam, "costume_%s" % tod, lambda c: IN.costume_room(c, tod), (-600, -900, 4200, 2700), 0.7)


def lunchbox(ctx, x, gy, open_k=1.0, bites=0):
    D.rrect(ctx, x - 90, gy - 90, 180, 90, 14, hexrgb("#2f8fd8"), D.INK, 4)
    ctx.save()
    ctx.translate(x - 90, gy - 90)
    ctx.rotate(-1.2 * open_k)
    D.rrect(ctx, 0, -14, 180, 26, 10, hexrgb("#2f8fd8"), D.INK, 4)
    ctx.restore()
    star(ctx, x, gy - 45, 20, "#ffd23a")


def sandwich(ctx, x, y, s=1.0, bites=0):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.poly(ctx, [(-40, 0), (40, 0), (34, -14), (-34, -14)], hexrgb("#f2d6a0"), D.INK, 2, wob=0)
    D.rect(ctx, -42, -20, 84, 8, hexrgb("#3fbf6a"), None, 0, wob=0)
    D.rect(ctx, -40, -26, 80, 7, hexrgb("#e8423c"), None, 0, wob=0)
    D.poly(ctx, [(-40, -26), (40, -26), (34, -44), (-34, -44)], hexrgb("#f2d6a0"), D.INK, 2, wob=0)
    for k in range(bites):
        D.circle(ctx, 40 - k * 16, -24, 14, hexrgb("#d8eaf6"), None, 0)
    ctx.restore()


def shot_wake(ctx, t, S):
    d = S.cue(1) - 0.1
    T_UP = d * 0.45
    cam = Cam(Keys((0, SLEEP_X + 200), (T_UP, SLEEP_X + 300), (d, BENCH_X - 200, "io")), 560,
              Keys((0, 1.25), (d, 1.15)))
    costume_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        D.ellipse(ctx, SLEEP_X - 60, IN.FL - 30, 360, 40, hexrgb("#e8423c"), D.INK, 3)      # подстилка из костюмов
        RASCAL.head_only(ctx, SLEEP_X - 420, IN.FL - 110, 112 * 1.55, -1, {"view": "side", "hturn": 0.6,
                                                                           "neck_line": False})
        k = smooth(clamp((t - T_UP) / 0.5))
        p = floor_sit_pose(t, 1, "sleep" if t < T_UP else ("shock" if t < T_UP + 1.0 else "neutral"))
        p.update(blink=1.0 if t < T_UP else 0.0, look=(1.0, 0.0), hturn=1.0)
        draw_lying(ctx, THEO_FUR, SLEEP_X, IN.FL - 20, 112, 1, p, k, t)
        if t < T_UP:
            for j in range(3):
                ph = (t * 0.6 + j / 3) % 1
                D.text(ctx, "z", SLEEP_X - 120 + ph * 80, IN.FL - 300 - ph * 180, 50 + ph * 30, D.FONT_HAND,
                       hexrgb("#2a3a7a"), alpha=1 - ph)
        # лавка с ланчбоксом и енотиха с сэндвичем
        D.rect(ctx, BENCH_X - 260, IN.FL - 200, 520, 30, hexrgb("#a8743a"), D.INK, 3, wob=0)
        for lx in (BENCH_X - 230, BENCH_X + 210):
            D.rect(ctx, lx, IN.FL - 170, 20, 130, hexrgb("#8a5a34"), D.INK, 2, wob=0)
        lunchbox(ctx, BENCH_X + 130, IN.FL - 200)
        bites = min(3, int(t / 1.2))
        draw_raccoon(ctx, BENCH_X - 80, IN.FL - 200, 112, -1 if t < T_UP + 0.6 else 1,
                     raccoon_pose(t, "eat", chew=1.0 if t < T_UP + 0.6 else 0.3,
                                  hold=lambda c, x, y: sandwich(c, x + 0.08, y + 0.04, 0.0065, bites)))
    if t > 0.3:
        pop_text(ctx, "MUNCH MUNCH", W / 2 + 380, 230, t, 0.3, 70, "#8a5a34", dur=T_UP + 0.4, shake=False)
    if t > T_UP:
        pop_text(ctx, "?!", W / 2 - 420, 280, t, T_UP + 0.1, 130, "#ffd23a", dur=1.2)


def shot_mom(ctx, t, S):
    """Енотиха смотрит на Тео, на голову Раскала — и решает: мама. Залезает на колени."""
    d = S.cue(2) - S.cue(1)
    T_LOOK1, T_LOOK2, T_JUMP = 0.2, d * 0.25, d * 0.48
    cam = Cam(Keys((0, 1350), (d, 1300)), 600, Keys((0, 1.35), (d, 1.5)))
    costume_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        RASCAL.head_only(ctx, 820, IN.FL - 110, 112 * 1.55, 1, {"view": "side", "hturn": 0.7, "neck_line": False})
        p = floor_sit_pose(t, 1, "smile" if t > T_JUMP + 0.5 else "shock")
        p.update(hip=(0, R.HIP_H - 0.12), look=(1.0, 0.0), blink=0 if t < T_JUMP else R.blink(t))
        if t > T_JUMP + 0.4:
            p.update(h1=(0.62, -1.3), h2=(0.55, -1.25))
        J = THEO_FUR.draw(ctx, 1250, IN.FL - 20, 112, 1, p)
        k = smooth(clamp((t - T_JUMP) / 0.5))
        lx, ly = THEO_FUR.world(1250, IN.FL - 20, 112, 1, (0.45, -1.15))
        rx = lerp(1700, lx, k)
        ry = lerp(IN.FL - 20, ly, k) - math.sin(k * math.pi) * 180
        look = 0.0 if t < T_LOOK2 else -0.6
        if k <= 0:
            mode = "sit"
            draw_raccoon(ctx, rx, ry, 112, -1, raccoon_pose(t, mode, look=look * 0.5))
        elif k < 1:
            draw_raccoon(ctx, rx, ry, 112, -1, raccoon_pose(t, "jump", jump=k))
        else:
            draw_raccoon(ctx, rx, ry, 100, -1, raccoon_pose(t, "sleep"))
    if t < T_LOOK2:
        pop_text(ctx, "?", W / 2 + 330, 300, t, T_LOOK1, 140, "#fff6d8", dur=T_LOOK2 - T_LOOK1, shake=False)
    elif t < T_JUMP:
        pop_text(ctx, "!", W / 2 + 330, 300, t, T_LOOK2, 160, "#ffd23a", dur=T_JUMP - T_LOOK2, shake=False)
    if t > T_JUMP + 0.6:
        tk = ease_out_back(clamp((t - T_JUMP - 0.6) / 0.35))
        ctx.save()
        ctx.translate(W / 2 + 380, 230)
        ctx.rotate(-0.05)
        ctx.scale(tk, tk)
        D.rrect(ctx, -230, -70, 460, 140, 26, hexrgb("#fbf3dc"), D.INK, 6)
        D.text(ctx, "BANDIT", 0, 30, 90, D.FONT_TITLE, hexrgb("#2b2c31"))
        ctx.restore()
        for j in range(3):
            ph = (t * 0.7 + j / 3) % 1
            hx, hy = cam.to_screen(t, 1310 + j * 40, IN.FL - 300 - ph * 160)
            heart(ctx, hx, hy, 18 * (1 - ph * 0.4), 1 - ph)


def shot_gates(ctx, t, S):
    """Ворота на цепи → мост, забитый машинами; между машинами бредут они."""
    d = S.cue(3) - S.cue(2)
    T_BRIDGE = d * 0.4
    if t < T_BRIDGE:
        cam = Cam(0, 400, Keys((0, 0.62), (T_BRIDGE, 0.7)))
        sky_back(ctx, t, cam, "morning", -3000, 3000)
        with layer(ctx, cam, t):
            PK.plaza(ctx, "morning", -3000, 3000)
            PK.fence(ctx, -3000, -560, PK.FL - 40, 200, "morning")
            PK.fence(ctx, 560, 3000, PK.FL - 40, 200, "morning")
            PK.gate(ctx, 0, PK.FL - 40, 900, 700, "morning", chained=True, t=t)
            p = R.stand("back", t, 1)
            p.update(h1=(-0.3, -1.6), h2=(0.3, -1.6))
            THEO_FUR.draw(ctx, -60, PK.FL + 260, 130, 1, p)
            draw_raccoon(ctx, 160, PK.FL + 250, 110, 1, raccoon_pose(t, "sit", look=-0.4))
        pop_text(ctx, "LOCKED", W / 2 + 520, 520, t, 0.4, 100, "#e8423c", dur=T_BRIDGE, shake=False)
        return
    tt = t - T_BRIDGE
    cam = Cam(Keys((0, 1300), (d - T_BRIDGE, 1700)), 520, 0.5)
    with layer(ctx, cam, tt, 0.3):
        PK.sky(ctx, tt, "morning", -3000, 6000)
    with layer(ctx, cam, tt, 0.6):
        LK.town(ctx, -2600, 600, 560, "morning")
    with layer(ctx, cam, tt):
        LK.water(ctx, tt, -3000, 6000, 560, 2400, "morning")

        def crowd(c, x0, x1, deck):
            r = rng(4)
            for i in range(22):
                zx = r.uniform(x0 + 100, x1 - 100) + tt * 40
                p = R.gait(tt * 1.3 + i * 0.4, "shamble", "side", i)
                R.Fig(R.park_zombie(2000 + i)).draw(c, zx, deck - 10 + (i % 3) * 6, 70, 1, p)
        LK.bridge(ctx, -1000, 4200, 800, "morning", tt, cars=True, jam=1.0, crowd=crowd)
    pop_text(ctx, "...AND WORSE.", W / 2 + 300, 230, tt, 0.6, 90, "#9fc86a", dur=d, shake=False)


def shot_island(ctx, t, S):
    """Карта: парк — остров, мост забит; «ВЫ ЗДЕСЬ»."""
    d = S.dur - S.cue(3)
    s = lerp(0.36, 0.2, smooth(clamp(t / (d * 0.6))))
    D.rect(ctx, 0, 0, W, H, hexrgb("#4fb8e8"), None, 0, wob=0)
    LK.island_map(ctx, W / 2, H / 2 + 60, s, "day", t, labels=False, horde=0.0)
    ctx.save()
    ctx.translate(W / 2, H / 2 + 60)
    ctx.scale(s, s)
    bx0, by0 = LK.MAP["bridge1"]
    bx1, by1 = LK.MAP["bridge0"]
    for k in range(10):
        u = (k + 0.5) / 10
        D.rect(ctx, lerp(bx0, bx1, u) - 60, by0 - 40, 120, 80, hexrgb(LK.CAR_COLS[k % 8]), D.INK, 4, wob=0)
    cx, cy = LK.MAP["castle"]
    pk = ease_out_back(clamp((t - 0.5) / 0.4))
    ctx.restore()
    px, py = W / 2 + cx * s, H / 2 + 60 + cy * s
    if pk > 0:
        ctx.save()
        ctx.translate(px, py - 30)
        ctx.scale(pk, pk)
        D.poly(ctx, [(0, 0), (-40, -70), (40, -70)], hexrgb("#e8423c"), D.INK, 5, wob=0)
        D.circle(ctx, 0, -90, 46, hexrgb("#e8423c"), D.INK, 5)
        D.circle(ctx, 0, -90, 18, hexrgb("#fbfaf6"), None, 0)
        ctx.restore()
        D.rrect(ctx, px + 70, py - 190, 330, 90, 20, hexrgb("#fbf3dc"), D.INK, 5)
        D.text(ctx, "YOU", px + 235, py - 126, 60, D.FONT_TITLE, hexrgb("#e8423c"))
    if t > d * 0.45:
        pop_text(ctx, "ISLAND.", W / 2, 200, t, d * 0.45, 120, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_wake, "fade", 0.4),
        Shot(c(1) - 0.1, shot_mom, "fade", 0.25),
        Shot(c(2) - 0.1, shot_gates, "fade", 0.3),
        Shot(c(3) - 0.1, shot_island, "fade", 0.3),
    ]
    S.tods = [(0, "morning")]
    S.sfx += [(0.3, "munch", 0.9), (c(1) + (c(2) - c(1)) * 0.48, "jump_boing", 0.8), (c(2) + 0.4, "chain", 0.9),
              (c(2) + (c(3) - c(2)) * 0.4, "car_horns", 0.6), (c(3) + 0.5, "pop", 0.7)]
    S.music = [(0, "comic", 0.8), (c(1), "warm", 0.8), (c(2), "mystery", 0.9), (c(3), "lonely", 0.8)]
