"""День 13: Раскал цепляется за забор — дыра в боку. Впервые они тебя чуют. Зеркальный лабиринт: сто тебя,
сто их. Выход через заднюю дверь; бок зашит тканью шара — енот с радужной заплаткой."""
from scenes.kit import *
from scenes.shared import *

FENCE_X0, FENCE_X1 = 600, 2400
NAIL_X = 1500


def hole_pos(fig, x, gy, s, f, J):
    """Мировые координаты дыры в боку костюма (над тазом)."""
    hx, hy = fig.world(x, gy, s, f, J["hip"])
    return hx - f * 0.12 * s, hy - 0.46 * s


def shot_rip(ctx, t, S):
    """Раскал идёт вдоль забора, мех цепляется за гвоздь — дёрг, дёрг — РРРИП. Клок меха на гвозде."""
    d = S.cue(1) - 0.1
    T_SNAG, T_RIP = d * 0.3, d * 0.62
    x_stop = NAIL_X + 40
    w = Walk(Keys((0, NAIL_X - 600), (T_SNAG, x_stop, "lin")), PK.FL + 40, 112, "walk", t1=d + 1)
    zoom_k = smooth(clamp((t - T_RIP - 0.3) / 0.6))
    cam = Cam(lerp(NAIL_X + 80, x_stop - 10, zoom_k), lerp(560, PK.FL - 230, zoom_k), lerp(0.95, 1.7, zoom_k))
    street_back(ctx, t, cam, "day", -1400, 6000, shut=True, sun=(3000, -900, 110))
    with layer(ctx, cam, t):
        for i in range(3):
            zx = 400 + i * 900 + math.sin(t * 0.5 + i) * 70
            p = R.gait(t * 1.1 + i, "shamble", "side", i) if i % 2 else zombie_idle(t, i)
            R.Fig(R.park_zombie(1300 + i)).draw(ctx, zx, PK.FL - 10, 100, -1 if i % 2 else 1, p)
        PK.fence(ctx, FENCE_X0, FENCE_X1, PK.FL + 10, 170, "day")
        D.line(ctx, NAIL_X, PK.FL - 100, NAIL_X + 26, PK.FL - 104, D.INK, 6)        # гвоздь
        D.line(ctx, NAIL_X, PK.FL - 100, NAIL_X + 26, PK.FL - 104, hexrgb("#c9d0d6"), 3)
        if t < T_SNAG:
            p = w.pose(t)
            x = w.x(t)
            fig = RASCAL
        elif t < T_RIP:
            tug = abs(math.sin((t - T_SNAG) * 7))
            x = x_stop + 30 * tug
            p = R.stand("side", t, 1)
            p.update(lean=0.25 * tug, f1=(0.3, 0), f2=(-0.25, 0), h1=(-0.5, -2.0), h2=(0.6, -2.4))
            fig = RASCAL
        else:
            k = clamp((t - T_RIP) / 0.25)
            x = x_stop + 30 + 40 * ease_out(k)
            p = R.stand("side", t, 1)
            p.update(h1=(0.8, -2.5), h2=(0.6, -2.3), lean=-0.05)
            fig = RASCAL_RIP
        J = fig.draw(ctx, x, PK.FL + 40, 112, 1, rascal_pose(p, "scared" if t > T_RIP else "calm"))
        if t > T_SNAG:           # клок меха: тянется к гвоздю, после разрыва висит на нём
            hx, hy = hole_pos(fig, x, PK.FL + 40, 112, 1, J)
            if t < T_RIP:
                D.line(ctx, NAIL_X + 20, PK.FL - 102, hx, hy, D.INK, 14)
                D.line(ctx, NAIL_X + 20, PK.FL - 102, hx, hy, hexrgb("#9a9ea6"), 9)
            else:
                sw = math.sin((t - T_RIP) * 8) * math.exp(-(t - T_RIP) * 2) * 0.4
                D.poly(ctx, [(NAIL_X + 18, PK.FL - 104), (NAIL_X + 40 + 30 * sw, PK.FL - 60),
                             (NAIL_X + 6 + 30 * sw, PK.FL - 50)], hexrgb("#9a9ea6"), D.INK, 3, wob=0)
    if t > T_SNAG and t < T_RIP:
        pop_text(ctx, "SNAG", W / 2 - 300, 260, t, T_SNAG, 80, "#fff6d8", dur=0.8)
    if t > T_RIP:
        pop_text(ctx, "RRRIP!", W / 2 + 300, 240, t, T_RIP, 130, "#ff8a7a", dur=1.2)
    if t > T_RIP + 0.9:
        pop_text(ctx, "A HOLE.", W / 2 - 360, 260, t, T_RIP + 0.9, 90, "#fff6d8", dur=d, shake=False)


def shot_smell(ctx, t, S):
    """Запах человека из дыры: ближние зомби разом поворачивают головы, принюхиваются — и идут."""
    d = S.cue(2) - S.cue(1)
    T_TURN, T_GO = d * 0.25, d * 0.6
    x0 = NAIL_X + 110
    cam = Cam(x0 + 100, 520, Keys((0, 0.75), (d, 0.7)))
    street_back(ctx, t, cam, "day", -1400, 6000, shut=True, sun=(3000, -900, 110))
    with layer(ctx, cam, t):
        PK.fence(ctx, FENCE_X0, FENCE_X1, PK.FL + 10, 170, "day")
        p = R.stand("side", t, 1)
        p.update(h1=(0.8, -2.5), h2=(0.6, -2.3), hturn=0.7 if t > T_TURN else 0.0)
        J = RASCAL_RIP.draw(ctx, x0, PK.FL + 40, 112, 1, rascal_pose(p, "sweat" if t > T_TURN else "scared"))
        hx, hy = hole_pos(RASCAL_RIP, x0, PK.FL + 40, 112, 1, J)
        stink(ctx, hx - 30, hy, t, 1.2, 1.0, "#ff8a6a")
        r = rng(13)
        for i in range(9):
            side = -1 if i % 2 else 1
            zx = x0 + side * r.uniform(500, 1500)
            zy = PK.FL + r.uniform(-20, 220)
            f = -side
            turn = smooth(clamp((t - T_TURN - i * 0.07) / 0.2))
            if t < T_GO:
                q = sniff_pose(t, i) if turn > 0.5 else zombie_idle(t, i)
                if turn <= 0.5:
                    f = side if i % 3 else -side
                q.update(hturn=0.9 * turn)
            else:
                g = clamp((t - T_GO) / (d - T_GO))
                zx = lerp(zx, x0 + side * 260, g * 0.6)
                q = R.gait((t - T_GO) * 1.5 + i, "shamble", "side", i)
                q.update(a1=(1.5, -0.2), a2=(1.3, -0.1), mouth=0.8)
            L = R.park_zombie(1320 + i)
            jz = R.Fig(L).draw(ctx, zx, zy, floor_s(zy, PK.FL, 104), f, q)
            if turn > 0.5 and t < T_GO:
                nx, ny = R.Fig(L).world(zx, zy, floor_s(zy, PK.FL, 104), f, jz["head"])
                sniff_lines(ctx, nx + f * 70, ny + 10, t, 0.9)
    if t > T_TURN:
        pop_text(ctx, "SNIFF", W / 2 - 420, 260, t, T_TURN, 80, "#9fc86a", dur=T_GO - T_TURN)
        pop_text(ctx, "SNIFF", W / 2 + 420, 320, t, T_TURN + 0.3, 80, "#9fc86a", dur=T_GO - T_TURN)
    if t > T_GO:
        pop_text(ctx, "THEY SMELL YOU", W / 2, 200, t, T_GO, 90, "#ff8a7a", dur=d, shake=True)


def shot_maze(ctx, t, S):
    """Зеркальный лабиринт: Раскал бежит, в каждом зеркале — Раскалы и зомби. Сто тебя. Сто их."""
    d = S.cue(3) - S.cue(2)
    w = Walk(Keys((0, 380), (d, 2320, "lin")), IN.FL + 60, 112, "run", t1=d + 1)
    cam = Cam(lambda q: w.x(q) + 150, 420, 0.85)
    x_r = w.x(t)

    def refl(c, i, cx, rect):
        r = rng(i * 7 + 1)
        # отражения Раскала: бегут в такт, у каждого зеркала свой сдвиг и разворот
        for j in range(2):
            fx_ = -1 if (i + j) % 2 else 1
            rx = cx + (x_r - cx) * (0.35 if fx_ < 0 else -0.25) + (j - 0.5) * 120
            pp = w.pose(t)
            RASCAL_RIP.draw(c, rx, IN.FL - 70 - j * 30, 92 - j * 14, fx_, rascal_pose(pp, "sweat"))
        for j in range(2):
            zx = cx + r.uniform(-150, 150) + math.sin(t * 2 + i + j) * 30
            q = R.gait(t * 1.4 + i + j, "shamble", "side", i + j)
            q.update(a1=(1.5, -0.2), a2=(1.3, -0.1))
            R.Fig(R.park_zombie(1340 + i * 3 + j)).draw(c, zx, IN.FL - 110 - j * 20, 80 - j * 10,
                                                        1 if r.random() > 0.5 else -1, q)
        D.rect(c, *rect, hexrgb("#bcd8ec"), None, 0, wob=0, alpha=0.25)
    D.rect(ctx, 0, 0, W, H, hexrgb("#2a2448"), None, 0, wob=0)
    with layer(ctx, cam, t):
        IN.mirror_maze(ctx, "day", -600, 3600, t, reflections=refl)
        for j in range(3):          # настоящие зомби позади
            zx = x_r - 700 - j * 260 + 60 * math.sin(t * 2 + j)
            q = R.gait(t * 1.6 + j, "shamble", "side", j)
            q.update(a1=(1.6, -0.2), a2=(1.4, -0.1), mouth=0.8)
            R.Fig(R.park_zombie(1360 + j)).draw(ctx, zx, IN.FL + 50 + j * 20, 108, 1, q)
        RASCAL_RIP.draw(ctx, x_r, IN.FL + 60, 112, 1, rascal_pose(w.pose(t), "sweat"))
    if t > 0.3:
        pop_text(ctx, "A HUNDRED OF YOU", W / 2 - 250, 200, t, 0.3, 80, "#ffd23a", dur=d * 0.5, shake=False)
    if t > d * 0.5:
        pop_text(ctx, "A HUNDRED OF THEM", W / 2 + 200, 200, t, d * 0.5, 80, "#9fc86a", dur=d, shake=False)


def shot_patch(ctx, t, S):
    """Задняя дверь — хлоп; в мастерской Тео пришивает к боку радужный кусок ткани шара. Енот с заплаткой."""
    d = S.dur - S.cue(3)
    T_SEW, T_POSE = d * 0.22, d * 0.62
    if t < T_SEW:
        cam = Cam(1300, 520, 0.85)
        sky_back(ctx, t, cam, "day", -2000, 4000, sun=(2600, -900, 110))
        with layer(ctx, cam, t):
            PK.plaza(ctx, "day", -2000, 4000)
            D.rect(ctx, 400, -100, 1500, PK.FL + 100, hexrgb("#2a2448"), D.INK, 6, wob=0)
            for k in range(8):
                star(ctx, 500 + k * 190, -40, 22, hexrgb("#ffd23a"), 2)
            D.rect(ctx, 1060, PK.FL - 620, 360, 620, hexrgb("#1a1630"), D.INK, 5, wob=0)
            op = smooth(clamp(t / 0.3)) * (1 - smooth(clamp((t - 0.7) / 0.2)))
            D.poly(ctx, [(1060, PK.FL - 620), (1060 + 360 * (1 - op * 0.8), PK.FL - 620 - 30 * op),
                         (1060 + 360 * (1 - op * 0.8), PK.FL + 30 * op), (1060, PK.FL)], hexrgb("#5a4a8a"), D.INK, 5,
                   wob=0)
            D.rrect(ctx, 1120, PK.FL - 720, 240, 80, 14, hexrgb("#3fbf6a"), D.INK, 4)
            D.text(ctx, "EXIT", 1240, PK.FL - 662, 54, D.FONT_TITLE, hexrgb("#fbfaf6"))
            x = lerp(1240, 2100, clamp(t / T_SEW))
            p = R.gait(x / 112 / R.GAITS["run"]["L"], "run", "side", 1)
            RASCAL_RIP.draw(ctx, x, PK.FL + 60, 112, 1, rascal_pose(p, "sweat"))
        if t > 0.75:
            pop_text(ctx, "SLAM!", W / 2 - 300, 260, t, 0.75, 110, "#fff6d8", dur=0.8)
        return
    if t < T_POSE:
        tt = t - T_SEW
        cam = Cam(1100, 620, Keys((0, 1.4), (T_POSE - T_SEW, 1.5)))
        room_back(ctx, t, cam, "workshop_day13", lambda c: IN.workshop(c, "day", patches_done=13),
                  (-600, -900, 4200, 2700), 0.6)
        with layer(ctx, cam, t):
            D.rect(ctx, 1000, IN.FL - 160, 220, 24, hexrgb("#8a5a34"), D.INK, 3, wob=0)
            for lx in (1015, 1185):
                D.line(ctx, lx, IN.FL - 140, lx, IN.FL + 40, D.INK, 8)
            p = sit_pose(t, 1, "worried", seat=160 / 112)
            stitch = (tt * 1.6) % 1
            p.update(h1=(0.15 + 0.5 * stitch, -1.9 - 0.4 * math.sin(stitch * math.pi)), h2=(-0.1, -1.6),
                     look=(-0.3, 0.9), neck=0.35, hturn=-0.3)
            J = THEO_FUR_PATCH.draw(ctx, 1110, IN.FL + 40, 112, 1, p)
            nx, ny = THEO_FUR_PATCH.world(1110, IN.FL + 40, 112, 1, J["hand1"])
            px, py = hole_pos(THEO_FUR_PATCH, 1110, IN.FL + 40, 112, 1, J)
            D.line(ctx, nx, ny, nx + 26, ny - 26, hexrgb("#c9d0d6"), 3)            # игла
            D.curve(ctx, [(px, py), ((px + nx) / 2, max(py, ny) + 30), (nx, ny)], hexrgb("#ffd23a"), 2)
            RASCAL.head_only(ctx, 1500, IN.FL - 385, 112 * 1.15, -1, {"view": "side", "neck_line": False})
            D.rect(ctx, 1380, IN.FL - 280, 240, 280, hexrgb("#c8903a"), D.INK, 5, wob=0)
            draw_raccoon(ctx, 800, IN.FL + 60, 100, 1, raccoon_pose(t, "sit", look=0.4))
        pop_text(ctx, "BALLOON FABRIC", W / 2, 200, tt, 0.3, 80, "#ffd23a", dur=T_POSE, shake=False)
        return
    tt = t - T_POSE
    cam = Cam(1300, 560, Keys((0, 1.2), (d - T_POSE, 1.32)))
    room_back(ctx, t, cam, "workshop_day13", lambda c: IN.workshop(c, "day", patches_done=13),
              (-600, -900, 4200, 2700), 0.6)
    with layer(ctx, cam, t):
        p = R.stand("front", t, 1)
        p.update(h1=(0.62, -2.05), h2=(-0.62, -2.05), lean=0.0)
        J = RASCAL_PATCH.draw(ctx, 1300, IN.FL + 60, 112, 1, rascal_pose(p, "happy"))
        px, py = RASCAL_PATCH.world(1300, IN.FL + 60, 112, 1, J["hip"])
        for j in range(4):
            a = tt * 3 + j * TAU / 4
            star(ctx, px - 40 + math.cos(a) * 90, py - 50 + math.sin(a) * 50, 14 + 6 * math.sin(tt * 6 + j),
                 hexrgb("#ffd23a"), 2)
        draw_raccoon(ctx, 900, IN.FL + 60, 100, 1, raccoon_pose(t, "sit", look=0.3))
    pop_text(ctx, "RAINBOW PATCH", W / 2, 200, tt, 0.2, 100, "#ffd23a", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_rip, "fade", 0.4),
        Shot(c(1) - 0.1, shot_smell, "fade", 0.25),
        Shot(c(2) - 0.1, shot_maze, "whip", 0.25),
        Shot(c(3) - 0.1, shot_patch, "fade", 0.25),
    ]
    S.tods = [(0, "day")]
    d0 = c(1) - 0.1
    S.sfx += [(d0 * 0.62, "rip", 1.0), (c(1) + (c(2) - c(1)) * 0.25, "sniff", 0.9),
              (c(1) + (c(2) - c(1)) * 0.6, "zombie_groan", 1.0), (c(2) + 0.2, "glass_ring", 0.6),
              (c(2) + 0.5, "running", 0.8), (c(3) + 0.75, "door_slam", 0.9), (c(3) + (S.dur - c(3)) * 0.62, "ding", 0.7)]
    S.music = [(0, "sneak", 0.8), (d0 * 0.62, "tension", 1.0), (c(2), "chase", 1.0), (c(3) + 1.0, "comic", 0.8)]
