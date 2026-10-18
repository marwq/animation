"""День 4: первое правило — случайно. Локоть задевает микрофон у выхода A1: «Э-э. Проверка?» —
голос из каждого динамика. Три тысячи голов поворачиваются, все бегут к A1. Правило первое:
они идут на звук. А ты нашёл самый громкий микрофон Среднего Запада."""
from scenes.kit import *
from scenes.shared import *

GX = TM.gate_xs("A")[0]     # стойка A1


def shot_walk(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, GX - 400), (d, GX - 100)), 520, 0.9)
    term_back(ctx, t, cam, "day", 1.0, "A")
    with layer(ctx, cam, t):
        w = Walk(Keys((0, GX - 1100), (d + 0.5, GX - 120, "lin")), TM.FL + 60, 115, "sneak", t1=d + 2)
        w.draw(ctx, DANNY, t, {"face": "worried"})
        draw_lab(ctx, w.x(t) - 200, TM.FL + 60, 105, 1, dog_pose(t, "trot", phase=t * 2.2))


def shot_elbow(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    T_HIT = d * 0.25
    cam = Cam(Keys((0, GX + 40), (T_HIT, GX + 70)), TM.FL - 230, Keys((0, 2.2), (T_HIT, 2.6, "in")),
              shake=lambda q: shake_k(q, T_HIT, 0.4, 0.8))
    term_back(ctx, t, cam, "day", 1.0, "A")
    with layer(ctx, cam, t):
        p = R.stand("side", t, 1)
        lean = smooth(clamp((t - T_HIT + 0.4) / 0.4))
        p.update(face="shock" if t > T_HIT else "neutral", h2=(0.2 + 0.2 * lean, -1.6 - 0.3 * lean),
                 lean=-0.05 + 0.1 * lean, hturn=-0.6 if t > T_HIT else 0.6, blink=0 if t > T_HIT else p["blink"])
        DANNY.draw(ctx, GX + 160, TM.FL, 115, -1, p)
        if t > T_HIT:
            D.circle(ctx, GX + 92, TM.FL - 256, 16, hexrgb("#ff4a3a"), D.INK, 3)
    if t > T_HIT:
        pop_text(ctx, "CLICK", W / 2 - 300, 330, t, T_HIT, 100, "#ff4a3a", dur=1.2)
        speakers(ctx, t, [(260, 120), (W - 260, 120), (W / 2, 80)], 1.0)
        D.rrect(ctx, 120, 820, 480, 90, 20, hexrgb("#e8423c"), D.INK, 5)
        D.text(ctx, "● ALL SPEAKERS", 360, 880, 44, D.FONT_TITLE, hexrgb("#fff6d8"))


def shot_testing(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#f2c230"), (1, "#f2782e")])
    z = 1 + 0.06 * t
    ctx.save()
    ctx.translate(W / 2 - 300, H / 2 + 120)
    ctx.scale(z, z)
    DANNY.head_only(ctx, 0, 0, 420, 1, {"view": "front", "face": "worried", "mouth": 0.5 + 0.4 * abs(math.sin(t * 9)),
                                        "neck_line": False, "sweat": 0.6})
    ctx.restore()
    speech(ctx, W / 2 + 380, 300, "UH... TESTING?", t, 0.0, 80, tail=(-1, 1))
    for k in range(3):
        D.text(ctx, "TESTING?", W / 2 + 380 + k * 60, 520 + k * 110, 70 - k * 14, D.FONT_TITLE, hexrgb("#fff6d8"),
               stroke=D.INK, slw=6, alpha=clamp((t - 0.4 - k * 0.3) / 0.2) * (1 - k * 0.25))


def shot_turn(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    T_RUN = d * 0.4
    cam = Cam(Keys((0, 1300), (d, 1000)), 300, Keys((0, 0.48), (d, 0.55)), shake=0.15)
    hall_back(ctx, t, cam, "day", 1.0)
    with layer(ctx, cam, t):
        r = rng(4)
        for i in range(60):
            y = TM.FL + r.uniform(0, 520)
            s = floor_s(y, s=95)
            x0 = r.uniform(-1300, 4400)
            turn = t > r.uniform(0.1, T_RUN * 0.8)
            look = R.zombie_look(400 + i)
            if t < T_RUN:
                p = zombie_idle(t, i)
                p["hturn"] = -1.0 if turn else 1.0
                R.Fig(look).draw(ctx, x0, y, s, 1, p)
            else:
                tt = t - T_RUN
                v = r.uniform(500, 700)
                x = x0 - v * tt * (0.5 + 0.5 * clamp(tt / 0.5))
                p = R.gait(v * tt / s / R.GAITS["run"]["L"] + i * 0.3, "run", "side", i)
                p.update(a1=(1.4, -0.1), a2=(1.2, 0.0), mouth=0.9, lean=0.35)
                R.Fig(look).draw(ctx, x, y, s, -1, p)
    if t > T_RUN:
        motion_lines(ctx, W - 300, 700, -1, 6, 300, 50, a=0.6)
    for i in range(8):
        t0 = 0.15 + i * 0.08
        if t > t0:
            D.text(ctx, "!", 200 + i * 220, 360 + (i % 3) * 40, 90, D.FONT_TITLE, hexrgb("#e8423c"),
                   alpha=clamp(1.5 - (t - t0)), stroke=D.INK, slw=8)
    D.rrect(ctx, W - 500, 110, 420, 120, 24, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, "→ GATE A1", W - 290, 196, 70, D.FONT_TITLE, hexrgb("#ffd23a"))


def shot_rule(ctx, t, S):
    d = S.dur - S.cue(4)
    T_MIC = d * 0.5
    if t < T_MIC:
        cam = Cam(Keys((0, GX + 300), (T_MIC, GX + 200)), 520, Keys((0, 0.7), (T_MIC, 0.75)), shake=0.12)
        term_back(ctx, t, cam, "day", 1.0, "A")
        with layer(ctx, cam, t):
            r = rng(9)
            for i in range(30):
                x = GX - 500 + r.uniform(0, 1200)
                y = TM.FL + r.uniform(0, 300)
                p = zombie_reach(t, i)
                p.update(a1=(2.3 + 0.2 * math.sin(t * 6 + i), 0.2), a2=(2.1, 0.3), lean=-0.1, mouth=1.0)
                R.Fig(R.zombie_look(500 + i)).draw(ctx, x, y, floor_s(y), 1 if x < GX else -1, p)
        rule_card(ctx, t, 1, ["They follow", "sound."], 0.3, W / 2, H / 2 - 40)
        return
    tt = t - T_MIC
    D.vgrad(ctx, 0, 0, W, H, [(0, "#1c3f7c"), (1, "#0e1e40")])
    k = ease_out_back(clamp(tt / 0.4))
    ctx.save()
    ctx.translate(W / 2, H / 2 + 80)
    ctx.scale(2.6 * k, 2.6 * k)
    D.line(ctx, 0, 120, 0, -40, D.INK, 10)
    D.ellipse(ctx, 0, -60, 26, 36, hexrgb("#2b2f3a"), D.INK, 5)
    D.rect(ctx, -60, 120, 120, 30, hexrgb("#3a3f4a"), D.INK, 4, wob=0)
    ctx.restore()
    for j in range(4):
        fx.glow(ctx, W / 2, H / 2 - 80, 200 + j * 60, "#ffe36a", 0.12)
    pop_text(ctx, "LOUDEST MIC", W / 2, 230, tt, 0.2, 100, "#ffe36a", dur=d, shake=False)
    pop_text(ctx, "IN THE MIDWEST", W / 2, 860, tt, 0.6, 80, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_walk),
        Shot(c(1) - 0.1, shot_elbow, "whip", 0.25),
        Shot(c(2) - 0.1, shot_testing),
        Shot(c(3) - 0.1, shot_turn, "whip", 0.25),
        Shot(c(4) - 0.1, shot_rule, "fade", 0.3),
    ]
    S.sfx += [(c(1) + (c(2) - c(1)) * 0.25, "click", 1.0), (c(2), "pa_echo", 1.0), (c(3) + 0.2, "zombie_groan", 0.9),
              (c(3) + (c(4) - c(3)) * 0.4, "stampede", 1.0), (c(4) + 0.4, "pencil", 0.8)]
    S.music = [(0, "sneak", 1.0), (c(3), "chase", 1.0), (c(4), "comic", 0.8)]
