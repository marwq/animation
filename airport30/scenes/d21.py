"""День 21: аккумулятор Рози сел — прикуриваешь её от тягача. Уолт читает чек-лист: масса, смесь,
подкачка, «от винта». Мотор кашляет, подхватывает и ревёт — самое громкое за три недели. В этом и беда:
к моменту, когда ты глушишь, они колотят в ворота ангара."""
from scenes.kit import *
from scenes.shared import *
from scenes.d11 import hangar_bg, ROSIE_X

CHECK = ["MASTER SWITCH", "MIXTURE", "PRIME", "CLEAR PROP!"]


def shot_jump(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(1400, 600, 0.82)
    hangar_bg(ctx, t, cam, "day", 1.0)
    with layer(ctx, cam, t):
        PL.rosie(ctx, ROSIE_X, RM.FL + 40, 1.1, 1, "day", dirt=0.2)
        PL.tug(ctx, 2250, RM.FL + 60, 0.8, -1, "day", beacon=1.0)
        ax, ay = ROSIE_X + 1.1 * 330, RM.FL + 40 - 1.1 * 160
        for k, c in enumerate(("#e8423c", "#2b2f3a")):
            pts = [(ax + 10 * k, ay)] + [(lerp(ax, 2130, u) + 30 * k, lerp(ay, RM.FL - 60, u) + 120 * math.sin(math.pi * u))
                                         for u in (0.25, 0.5, 0.75, 1.0)]
            D.catmull(ctx, pts)
            D.col(ctx, D.INK)
            ctx.set_line_width(14)
            ctx.stroke_preserve()
            D.col(ctx, hexrgb(c))
            ctx.set_line_width(8)
            ctx.stroke()
        p = R.stand("side", t, 1)
        p.update(face="determined", h1=(0.6, -2.0), hturn=0.7)
        DANNY_JACKET.draw(ctx, 1750, RM.FL + 60, 115, 1, p)
        if (t * 3) % 1 < 0.3:
            for k in range(5):
                a = k * 1.3 + t * 9
                D.line(ctx, ax, ay, ax + math.cos(a) * 40, ay + math.sin(a) * 40, hexrgb("#ffe36a"), 5)
    pop_text(ctx, "JUMP START", W / 2, 230, t, 0.3, 100, "#ffe36a", dur=d, shake=False)


def shot_checklist(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    camR = Cam(OS.RADIO_X - 120, 560, 1.25)
    walt_radio(ctx, t, camR, 1.0, "determined", "day")
    k = ease_out_back(clamp(t / 0.35))
    ctx.save()
    ctx.translate(W - 520, 520)
    ctx.rotate(0.03)
    ctx.scale(k, k)
    D.rect(ctx, -360, -400, 720, 800, hexrgb("#fbf6ee"), D.INK, 6, wob=0)
    D.rect(ctx, -360, -400, 720, 110, hexrgb("#1c3f7c"), D.INK, 6, wob=0)
    D.text(ctx, "ENGINE START", 0, -324, 60, D.FONT_TITLE, hexrgb("#fff6d8"))
    for i, item in enumerate(CHECK):
        y = -200 + i * 150
        D.rect(ctx, -320, y - 40, 60, 60, hexrgb("#ffffff"), D.INK, 4, wob=0)
        t0 = 0.6 + i * (d - 1.0) / 4
        if t > t0:
            kk = clamp((t - t0) / 0.2)
            D.polyline(ctx, [(-310, y - 10), (-290, y + 14), (-250 + 0 * kk, y - 50)], hexrgb("#3fae4a"), 12)
        D.text(ctx, item, -230, y + 12, 52, D.FONT_TITLE, hexrgb("#1c3f7c"), "left")
    ctx.restore()


def shot_start(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    T_COUGH, T_CATCH = 0.4, d * 0.45
    spin = 0.0 if t < T_COUGH else (0.4 * abs(math.sin(t * 6)) if t < T_CATCH else 1.0)
    prop = t * (3 if t < T_CATCH else 40)
    cam = Cam(ROSIE_X + 300, RM.FL - 140, Keys((0, 1.5), (d, 1.7)),
              shake=lambda q: 0.2 if q > T_CATCH else 0.06)
    hangar_bg(ctx, t, cam, "day", 1.0)
    with layer(ctx, cam, t):
        cab = lambda c: DANNY_PILOT.head_only(c, 150, -195, 60, 1, {"view": "side", "hturn": 0.8,
                                                                    "face": "laugh" if t > T_CATCH else "worried",
                                                                    "neck_line": False})
        PL.rosie(ctx, ROSIE_X, RM.FL + 40, 1.1, 1, "day", prop=prop, spin=spin, cabin=cab)
        if t > T_COUGH:
            for k in range(6):
                ph = ((t - T_COUGH) * 1.5 + k / 6) % 1
                D.circle(ctx, ROSIE_X - 300 - ph * 600, RM.FL - 100 - ph * 120, 20 + 60 * ph, hexrgb("#8f99a3"),
                         None, 0, alpha=0.5 * (1 - ph))
    if t < T_CATCH:
        for k in range(3):
            pop_text(ctx, "COUGH", 500 + k * 350, 260 + (k % 2) * 80, t, T_COUGH + k * 0.5, 80, "#cfd8e0", dur=0.6)
    else:
        pop_text(ctx, "VROOOOM!!", W / 2, 240, t, T_CATCH, 160, "#ffe36a", dur=d)
        speed_lines(ctx, t, n=30, a=0.3)


def shot_loud(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    cam = Cam(Keys((0, 4000), (d, 3600)), 380, 0.5)
    apron_back(ctx, t, cam, "day", 1.0, sun=(3000, -300, 80), x0=1800, x1=7800)
    with layer(ctx, cam, t):
        for k in range(5):
            r = 200 + ((t * 600 + k * 300) % 1500)
            ctx.arc(AP.HANGAR_X, 600, r, math.pi * 0.9, math.pi * 2.1)
            D.col(ctx, hexrgb("#fff6d8"), 0.6 * (1 - r / 1700))
            ctx.set_line_width(14)
            ctx.stroke()
        r2 = rng(21)
        for i in range(30):
            x = r2.uniform(2000, 7600)
            y = AP.GY + r2.uniform(-40, 300)
            p = zombie_idle(t, i)
            p["hturn"] = 1.0 if x < AP.HANGAR_X else -1.0
            R.Fig(R.zombie_look(2100 + i)).draw(ctx, x, y, floor_s(y, AP.GY, 100), 1 if x < AP.HANGAR_X else -1, p)
    for i in range(10):
        t0 = 0.3 + i * 0.07
        if t > t0:
            D.text(ctx, "!", 200 + i * 170, 380 + (i % 3) * 50, 90, D.FONT_TITLE, hexrgb("#e8423c"),
                   alpha=clamp(1.5 - (t - t0)), stroke=D.INK, slw=8)


def shot_pound(ctx, t, S):
    d = S.dur - S.cue(4)
    cam = Cam(2400, 560, 0.85, shake=lambda q: 0.25 + 0.4 * (math.sin(q * 9) > 0.7))
    hangar_bg(ctx, t, cam, "day", 1.0, open_k=0.0)
    with layer(ctx, cam, t):
        PL.rosie(ctx, ROSIE_X, RM.FL + 40, 1.1, 1, "day", prop=1.2, spin=0.0)
        p = R.stand("side", t, 1)
        p.update(face="scared", blink=0, sweat=1.0, hturn=0.8)
        DANNY_JACKET.draw(ctx, 1600, RM.FL + 60, 115, 1, p)
        draw_lab(ctx, 1400, RM.FL + 60, 100, 1, dog_pose(t, "stand", bark=0.6))
        for k in range(8):
            bx = RM.HANGAR_DOOR[0] + 120 + k * 240
            bulge = 20 * max(0, math.sin(t * 9 + k))
            D.ellipse(ctx, bx, 300 + (k % 3) * 160, 40 + bulge, 40 + bulge, None, D.INK, 4, alpha=0.6)
        # пальцы под воротами
        for k in range(14):
            fx_ = RM.HANGAR_DOOR[0] + 60 + k * 140 + math.sin(t * 5 + k) * 10
            for j in range(4):
                D.line(ctx, fx_ + j * 16, RM.FL + 44, fx_ + j * 16 + math.sin(t * 7 + k + j) * 6, RM.FL + 70, D.INK, 12)
                D.line(ctx, fx_ + j * 16, RM.FL + 44, fx_ + j * 16 + math.sin(t * 7 + k + j) * 6, RM.FL + 70,
                       hexrgb(R.ZOMBIE_SKIN[k % 7]), 7)
    for k in range(4):
        pop_text(ctx, "BANG", 1200 + (k % 2) * 300, 260 + k * 80, t, 0.2 + k * 0.6, 90, "#fff6d8", dur=0.5)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_jump, "fade", 0.3),
        Shot(c(1) - 0.1, shot_checklist, "fade", 0.25),
        Shot(c(2) - 0.1, shot_start, "whip", 0.25),
        Shot(c(3) - 0.1, shot_loud),
        Shot(c(4) - 0.1, shot_pound, "whip", 0.25),
    ]
    S.sfx += [(0.6, "spark", 0.8), (c(2) + 0.4, "cough", 0.9), (c(2) + (c(3) - c(2)) * 0.45, "engine", 1.0),
              (c(3), "zombie_groan", 1.0), (c(4) + 0.2, "door_bang", 1.0), (c(4) + 0.8, "door_bang", 0.9),
              (c(4) + 1.4, "door_bang", 1.0)]
    S.music = [(0, "plan", 0.9), (c(2) + (c(3) - c(2)) * 0.45, "joy", 1.0), (c(3), "chase", 1.0)]
