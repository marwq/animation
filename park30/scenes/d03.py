"""День 3: правило первое — они охотятся по запаху, а Раскал пахнет тридцатью летами попкорна и пота.
В костюме ты невидим: проходишь сквозь тысячу зомби к хот-догам. Никто даже не смотрит."""
from scenes.kit import *
from scenes.shared import *

HOTDOG_X = 3110      # витрина HOT DOGS на Главной улице (main_street с x0 = -1400)


def stink(ctx, x, y, t, s=1.0, a=1.0, c="#b8c860"):
    """Волны запаха: зелёно-жёлтые завитки поднимаются вверх."""
    for k in range(5):
        ph = (t * 0.7 + k / 5) % 1
        xx = x + math.sin(k * 2.3) * 60 * s
        yy = y - ph * 260 * s
        D.curve(ctx, [(xx, yy), (xx + 30 * s, yy - 30 * s), (xx - 10 * s, yy - 60 * s), (xx + 20 * s, yy - 90 * s)],
                hexrgb(c), 9 * s, a * (1 - ph) * 0.9)


def hot_dog(ctx, x, y, s=1.0, ang=0.0, bite=0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    D.rrect(ctx, -60, -16, 120, 32, 16, hexrgb("#e8b070"), D.INK, 3)
    D.rrect(ctx, -68, -10, 136 - bite * 30, 20, 10, hexrgb("#c8503a"), D.INK, 3)
    D.curve(ctx, [(-50, -6), (-25, -14), (0, -4), (25, -14), (45 - bite * 30, -6)], hexrgb("#f2c230"), 4)
    ctx.restore()


def shot_why(ctx, t, S):
    """Тео (без головы костюма) рассматривает голову Раскала, нюхает — фу!"""
    d = S.cue(1) - 0.1
    T_SNIFF = d * 0.5
    cam = Cam(1250, 560, Keys((0, 1.35), (d, 1.5)))
    room_back(ctx, t, cam, "costume_day", lambda c: IN.costume_room(c, "day"), (-600, -900, 4200, 2700), 0.7)
    with layer(ctx, cam, t):
        p = R.stand("side", t, 1)
        near = smooth(clamp((t - T_SNIFF + 0.4) / 0.4))
        # держит голову костюма на вытянутых руках перед собой, потом подносит к носу
        p.update(face="neutral" if t < T_SNIFF else "scared", mouth=0.0 if t < T_SNIFF else 0.5,
                 h1=(1.05 - 0.35 * near, -2.3 - 0.4 * near), h2=(0.95 - 0.35 * near, -2.15 - 0.4 * near),
                 hturn=0.8, look=(1.0, 0.3 - 0.3 * near), lean=-0.05 - 0.1 * near)
        J = THEO_FUR.draw(ctx, 1000, IN.FL, 112, 1, p)
        hx, hy = THEO_FUR.world(1000, IN.FL, 112, 1, J["hand1"])
        RASCAL.head_only(ctx, hx + 95, hy - 10, 112 * 1.15, -1, {"view": "side", "hturn": 0.6, "neck_line": False})
        draw_raccoon(ctx, 1500, IN.FL, 105, -1, raccoon_pose(t, "sit", look=-0.3))
        if t > T_SNIFF:
            stink(ctx, hx + 20, hy - 120, t, 1.0)
    if t < T_SNIFF:
        pop_text(ctx, "HMM...", W / 2 - 360, 260, t, 0.3, 90, "#fff6d8", dur=T_SNIFF, shake=False)
    else:
        pop_text(ctx, "PEW!", W / 2 + 330, 240, t, T_SNIFF + 0.1, 150, "#b8c860", dur=d)


def shot_rule(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    T_CLOUD = d * 0.45
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    if t < T_CLOUD:
        rule_card(ctx, t, 1, ["They hunt", "by SMELL."], 0.0)
        return
    tt = t - T_CLOUD
    # голова Раскала в облаке запаха: попкорн + пот × 30 лет
    k = ease_out_back(clamp(tt / 0.35))
    ctx.save()
    ctx.translate(W / 2, H / 2 + 60)
    ctx.scale(k, k)
    for j in range(9):
        a = j / 9 * TAU + tt * 0.4
        D.circle(ctx, math.cos(a) * 330, math.sin(a) * 230, 120, hexrgb("#c8d878"), None, 0, alpha=0.5)
    RASCAL.head_only(ctx, 0, 0, 300, 1, {"view": "front", "neck_line": False, "inner": None})
    ctx.restore()
    for j, (lab, x, y) in enumerate((("POPCORN", W / 2 - 520, 300), ("SWEAT", W / 2 + 520, 300),
                                     ("× 30 SUMMERS", W / 2, 170))):
        t0 = 0.3 + j * 0.45
        if tt > t0:
            pop_text(ctx, lab, x, y, tt, t0, 76, ["#fff3c4", "#9fe0ff", "#ffd23a"][j], dur=d, shake=False)
    if tt > 0.3:
        r = rng(3)
        for k2 in range(14):
            px = W / 2 - 520 + r.uniform(-150, 150)
            py = 420 + r.uniform(-60, 120) + math.sin(tt * 3 + k2) * 10
            D.circle(ctx, px, py, 16, hexrgb("#fff3c4"), D.INK, 2)
    if tt > 0.75:
        for k2 in range(6):
            ph = (tt * 0.8 + k2 / 6) % 1
            D.ellipse(ctx, W / 2 + 460 + k2 * 30, 420 + ph * 200, 14, 20, hexrgb("#9fe0ff"), D.INK, 2, alpha=1 - ph)


def shot_walk(ctx, t, S):
    """Сквозь толпу по Главной улице: ближние нюхают и отворачиваются."""
    d = S.cue(3) - S.cue(2)
    x0, x1 = -300, HOTDOG_X - 220
    w = Walk(Keys((0, x0), (d, x1, "lin")), PK.FL + 150, 112, "walk", t1=d + 1)
    cam = Cam(lambda q: w.x(q) + 120, 520, 0.88)
    street_back(ctx, t, cam, "day", -1400, 6000, shut=True, sun=(3000, -900, 110))
    with layer(ctx, cam, t):
        x = w.x(t)

        def back_row(m):
            return m.y < PK.FL + 150

        def front_row(m):
            return m.y >= PK.FL + 150

        def pose(m, tt):
            dx = m.x + m.vx * tt - x
            if abs(dx) < 260:
                p = sniff_pose(tt, m.seed % 97)
                p["hturn"] = 1.0
                return p
            return R.gait(m.ph0 + abs(m.vx) * tt / m.s / R.GAITS["shamble"]["L"], "shamble", "side", m.seed) \
                if abs(m.vx) > 1 else zombie_idle(tt, m.seed % 97)
        crowd_floor(ctx, t, 31, 70, -1400, 4600, PK.FL + 30, PK.FL + 320, 100, 128, vx=(-40, 40), pose_fn=pose,
                    filt=back_row)
        p = w.pose(t, rascal_pose({}, "calm"))
        p.update(hturn=0.6)
        RASCAL.draw(ctx, x, PK.FL + 150, 112, 1, p)
        crowd_floor(ctx, t, 31, 70, -1400, 4600, PK.FL + 30, PK.FL + 320, 100, 128, vx=(-40, 40), pose_fn=pose,
                    filt=front_row)
    counter_badge(ctx, "ZOMBIES", 1000, W - 300, 160, "#9fc86a", 460)
    if t > 0.6:
        pop_text(ctx, "INVISIBLE", 460, 250, t, 0.6, 90, "#fff6d8", dur=d, shake=False)


def shot_hotdog(ctx, t, S):
    """У ларька: Раскал ест хот-дог сквозь сетку рта, вокруг бродят — ноль внимания."""
    d = S.dur - S.cue(3)
    T_THUMB = d * 0.5
    cam = Cam(HOTDOG_X - 40, 560, Keys((0, 1.05), (d, 1.18)))
    street_back(ctx, t, cam, "day", -1400, 6000, shut=True, sun=(3000, -900, 110))
    with layer(ctx, cam, t):
        for i in range(4):
            zx = HOTDOG_X - 700 + i * 380 + math.sin(t * 0.5 + i) * 60
            zy = PK.FL + 40 + (i % 2) * 30
            p = R.gait(t * 1.2 + i * 0.6, "shamble", "side", i) if i % 2 else zombie_idle(t, i)
            R.Fig(R.park_zombie(3300 + i)).draw(ctx, zx, zy, floor_s(zy, PK.FL, 105), 1 if i % 2 else -1, p)
        bite = int(clamp(t / (d * 0.45)) * 3)
        p = R.stand("side", t, 1)
        chew = math.sin(t * 14) * 0.04
        if t < T_THUMB:
            p.update(h1=(0.95, -2.75 + chew), h2=(0.45, -1.6), hturn=0.6)
        else:
            p.update(h1=(1.05, -2.6), h2=(0.45, -1.6), hturn=0.3)
        J = RASCAL.draw(ctx, HOTDOG_X + 40, PK.FL + 170, 112, -1, rascal_pose(p, "happy"))
        hx, hy = RASCAL.world(HOTDOG_X + 40, PK.FL + 170, 112, -1, J["hand1"])
        if t < T_THUMB:
            hot_dog(ctx, hx - 30, hy - 10, 1.0, 0.2, bite)
        else:
            D.circle(ctx, hx, hy, 20, hexrgb("#fbfaf6"), D.INK, 3)
            D.rrect(ctx, hx - 8, hy - 52, 16, 38, 8, hexrgb("#fbfaf6"), D.INK, 3)
        for i in range(2):
            zx = HOTDOG_X + 500 + i * 300 - t * 40
            p = R.gait(t * 1.3 + i, "shamble", "side", 10 + i)
            R.Fig(R.park_zombie(3400 + i)).draw(ctx, zx, PK.FL + 290, floor_s(PK.FL + 290, PK.FL, 105), -1, p)
    if t < T_THUMB:
        pop_text(ctx, "NOM", W / 2 - 330, 300, t, 0.4, 80, "#fff6d8", dur=T_THUMB - 0.4, shake=False)
    else:
        pop_text(ctx, "BEST DISGUISE EVER", W / 2, 200, t, T_THUMB, 80, "#ffd23a", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_why, "fade", 0.4),
        Shot(c(1) - 0.1, shot_rule, "fade", 0.25),
        Shot(c(2) - 0.1, shot_walk, "fade", 0.3),
        Shot(c(3) - 0.1, shot_hotdog, "fade", 0.25),
    ]
    S.tods = [(0, "day")]
    S.sfx += [((c(1) - 0.1) * 0.5, "sniff", 0.9), ((c(1) - 0.1) * 0.5 + 0.4, "yuck", 0.8), (c(1) + 0.1, "stamp", 0.9),
              (c(2), "shuffle", 0.8), (c(2) + 1.0, "sniff", 0.6), (c(3) + 0.4, "munch", 0.8),
              (c(3) + (S.dur - c(3)) * 0.5, "ding", 0.7)]
    S.music = [(0, "comic", 0.8), (c(1), "mystery", 0.7), (c(2), "sneak", 1.0), (c(3), "fun", 0.8)]
