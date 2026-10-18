"""День 15: половина. Распорядок: отжимания с чемоданом на спине, блины в закусочной (Пиклз ворует),
тренажёр в полдень, Пиклз учится сидеть на правом кресле (садится на левое). Вечером — Уолт.
Крушения: 91. Посадки: 4."""
from scenes.kit import *
from scenes.shared import *
from scenes.d10 import sim_bg, POD_X


def shot_half(ctx, t, S):
    d = S.cue(1) - 0.1
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2f8fd8"), (1, "#1c3f7c")])
    k = clamp(t / (d * 0.8))
    cx, cy = W / 2, H / 2 + 40
    D.circle(ctx, cx, cy, 300, hexrgb("#1c2a4a"), D.INK, 10)
    ctx.move_to(cx, cy)
    ctx.arc(cx, cy, 290, -math.pi / 2, -math.pi / 2 + TAU * 0.5 * smooth(k))
    ctx.close_path()
    D.col(ctx, hexrgb("#ffe36a"))
    ctx.fill()
    D.circle(ctx, cx, cy, 300, None, D.INK, 10)
    D.text(ctx, "15/30", cx, cy + 40, 130, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=10)
    pop_text(ctx, "HALFWAY", W / 2, 150, t, 0.2, 110, "#fff6d8", dur=d, shake=False)


def pushup(ctx, t, x, gy, s):
    k = 0.5 + 0.5 * math.sin(t * 5)
    p = pushup_pose(k, "determined")
    ctx.save()
    ctx.translate(x, gy)
    ctx.rotate(1.32)
    J = DANNY_JACKET.draw(ctx, 0, 0, s, 1, p)
    ctx.restore()
    bx = x + math.cos(1.32 - math.pi / 2) * 0 - s * 2.6
    by = gy - s * (0.95 - 0.35 * k)
    suitcase(ctx, bx + s * 0.6, by, s / 120 * 0.9, "#e8423c", -0.05, handle=False)


def shot_routine(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    seg = d / 3
    i = min(2, int(t / seg))
    tt = t - i * seg
    clock = ["06:00", "08:00", "12:00"][i]
    if i == 0:
        cam = Cam(800, 700, 1.4)
        room_back(ctx, tt, cam, "baghall_on", lambda c: RM.baggage_hall(c, 1.0), (-1400, -1600, 7400, 3400), 0.7)
        with layer(ctx, cam, tt):
            k = 0.5 + 0.5 * math.sin(tt * 5)
            pp = pushup_pose(k, "determined")
            s_, fx_, ang = 110, 520, 1.32
            ctx.save()
            ctx.translate(fx_, RM.FL)
            ctx.rotate(ang)
            J = DANNY_JACKET.draw(ctx, 0, 0, s_, 1, pp)
            ctx.restore()
            # точка на спине (середина между тазом и плечами) в мировых координатах
            hx, hy = DANNY_JACKET.world(0, 0, s_, 1, J["hip"])
            tx, ty = DANNY_JACKET.world(0, 0, s_, 1, J["top"])
            bx, by = (hx + tx) / 2, (hy + ty) / 2
            ca, sa = math.cos(ang), math.sin(ang)
            wx, wy = fx_ + bx * ca - by * sa, RM.FL + bx * sa + by * ca
            suitcase(ctx, wx, wy - 0.18 * s_, 0.7, "#e8423c", ang - math.pi / 2, handle=False)
            draw_lab(ctx, 1150, RM.FL, 100, -1, dog_pose(tt, "sit", wag=1.0))
        counter_badge(ctx, "PUSH-UPS", 10 + int(tt * 2.5), 330, 360, "#ffe36a", 460)
    elif i == 1:
        cam = Cam(1100, 700, 1.4)
        room_back(ctx, tt, cam, "diner", lambda c: TM.diner(c), (-600, -1500, 4000, 3300))
        with layer(ctx, cam, tt):
            p = sit_pose(tt, 1, "happy", seat=1.1)
            p.update(h1=(0.7, -1.9 + 0.2 * math.sin(tt * 6)), hturn=0.6)
            DANNY_JACKET.draw(ctx, 1000, TM.FL - 30, 115, 1, p)
            D.ellipse(ctx, 1260, TM.FL - 230, 80, 16, hexrgb("#ffffff"), D.INK, 3)
            n = 3 if tt < seg * 0.5 else 2
            for k in range(n):
                D.ellipse(ctx, 1260, TM.FL - 240 - k * 14, 60, 12, hexrgb("#e8b84a"), D.INK, 3)
            if tt > seg * 0.5:
                kk = clamp((tt - seg * 0.5) / 0.5)
                draw_lab(ctx, lerp(1500, 1900, kk), TM.FL + 40, 100, 1, dog_pose(tt, "run", phase=tt * 3))
                D.ellipse(ctx, lerp(1500, 1900, kk) + 60, TM.FL - 70, 40, 10, hexrgb("#e8b84a"), D.INK, 3)
            else:
                draw_lab(ctx, 1500, TM.FL + 40, 100, -1, dog_pose(tt, "sit", look=0.4))
        if tt > seg * 0.5:
            pop_text(ctx, "HEY!", W / 2 + 300, 260, tt, seg * 0.5, 120, "#fff6d8", dur=1.0)
    else:
        bank = 0.2 * math.sin(tt * 2)
        cam = Cam(0, 120, 0.85, -bank * 0.15, shake=0.15)
        from scenes.d10 import sim_view
        cockpit_scene(ctx, tt, cam, "day", 1.0, view=lambda c: sim_view(c, tt, bank, 0.1, tt * 3))
        with layer(ctx, cam, tt):
            RM.yoke(ctx, -620, 560, 0.85, bank)
    clock_badge(ctx, clock, tt, W - 260, 150)


def shot_copilot(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    T_HOP = d * 0.45
    D.vgrad(ctx, 0, 0, W, H, [(0, "#9fd8ec"), (1, "#5ab8f0")])
    cam = Cam(0, -150, 2.4)
    with layer(ctx, cam, t):
        def cab(c):
            hop = t > T_HOP
            DANNY_PILOT.head_only(c, -58 if hop else -44, -232, 54, 1,
                                  {"view": "front", "face": "laugh" if hop else "smile", "neck_line": False})
            if hop:
                draw_lab(c, -30, -200, 34, 1, dog_pose(t, "sit", headset=True, wag=1.0))
            else:
                draw_lab(c, 34, -194, 34, -1, dog_pose(t, "sit", headset=True, wag=1.0))
        PL.rosie_front(ctx, 0, 100, 1.0, "day", spin=0.0, prop=0.0, cabin=cab)
    labels = [("CO-PILOT", 1300), ("PILOT", 560)]
    if t < T_HOP:
        pop_text(ctx, "SIT HERE →", 1350, 300, t, 0.2, 70, "#1c3f7c", dur=T_HOP, shake=False)
    else:
        pop_text(ctx, "NOPE.", 560, 300, t, T_HOP, 110, "#e8423c", dur=d)


def shot_walt(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    cam = Cam(OS.RADIO_X - 240, 520, 1.6)
    walt_radio(ctx, t, cam, 1.0, "laugh")
    clock_badge(ctx, "20:00", t, W - 260, 150)


def shot_score(ctx, t, S):
    d = S.dur - S.cue(4)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    for i, (lab, n, c) in enumerate((("CRASHES", 91, "#ff4a3a"), ("LANDINGS", 4, "#4cff8a"))):
        k = ease_out_back(clamp((t - i * 0.6) / 0.35))
        if k <= 0:
            continue
        ctx.save()
        ctx.translate(W / 2 - 420 + i * 840, H / 2)
        ctx.scale(k, k)
        D.rrect(ctx, -360, -220, 720, 440, 40, hexrgb("#0e1410"), D.INK, 8)
        D.text(ctx, lab, 0, -110, 70, D.FONT_TITLE, hexrgb("#cfd8e0"))
        val = int(n * clamp((t - i * 0.6) / 1.0))
        D.text(ctx, str(val), 0, 140, 240, D.FONT_TITLE, hexrgb(c))
        ctx.restore()


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_half),
        Shot(c(1) - 0.1, shot_routine, "whip", 0.25),
        Shot(c(2) - 0.1, shot_copilot, "whip", 0.25),
        Shot(c(3) - 0.1, shot_walt, "fade", 0.3),
        Shot(c(4) - 0.1, shot_score, "fade", 0.25),
    ]
    S.tods = [(0, "day"), (c(3), "night")]
    S.sfx += [(c(1) + (c(2) - c(1)) / 3 * 1.5, "bark", 0.7), (c(4) + 0.3, "ding", 0.8), (c(4) + 0.9, "ding", 0.8)]
    S.music = "routine"
