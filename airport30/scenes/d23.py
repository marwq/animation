"""День 23: план с Уолтом. Рози нужно 800 футов, рулёжка «Кило» — 3000. Это твоя полоса. В шесть утра
тридцатого дня динамики играют «последнюю посадку» — терминал бежит к A1. Остальных уведёт самолётик.
Полный газ — и не оглядываться."""
from scenes.kit import *
from scenes.shared import *

BP = hexrgb("#1d4f8f")
BPL = hexrgb("#dceaff")


def board(ctx, t):
    D.rect(ctx, 0, 0, W, H, BP, None, 0, wob=0)
    D.col(ctx, (1, 1, 1), 0.08)
    ctx.set_line_width(2)
    for x in range(0, W, 60):
        ctx.move_to(x, 0)
        ctx.line_to(x, H)
    for y in range(0, H, 60):
        ctx.move_to(0, y)
        ctx.line_to(W, y)
    ctx.stroke()


def plan_map(ctx, t, step, k=1.0):
    """Схема плана: терминал, A1, рулёжка K, ангар, озеро. step — сколько шагов показано."""
    cx, cy, s = W / 2 - 90, 640, 0.28
    P = lambda x, y: (cx + x * s, cy + y * s)
    D.col(ctx, BPL)
    ctx.set_line_width(4)
    # озеро
    D.poly(ctx, [P(-4000, -1100), P(4000, -1100), P(4000, -1700), P(-4000, -1700)], None, BPL, 4, wob=0)
    D.text(ctx, "LAKE", *P(-2400, -1300), 40, D.FONT_TITLE, BPL)
    # терминал и выходы
    x0, y0 = P(-1800, -200)
    D.rect(ctx, x0, y0, 3600 * s, 400 * s, None, BPL, 4, wob=0)
    D.text(ctx, "TERMINAL", *P(0, 60), 36, D.FONT_TITLE, BPL)
    # рулёжка Кило
    (kx0, ky), (kx1, _) = AP.KILO
    D.line(ctx, *P(-2600, 760), *P(3400, 760), BPL, 18)
    D.text(ctx, "TAXIWAY K", *P(2000, 900), 36, D.FONT_TITLE, BPL)
    hx, hy = AP.MAP_HANGAR
    D.rect(ctx, *P(hx - 220, hy - 170), 440 * s, 230 * s, None, BPL, 4, wob=0)
    D.text(ctx, "HANGAR 9", *P(hx, hy - 220), 32, D.FONT_TITLE, BPL)
    if step >= 1:
        # 800 ft vs 3000 ft
        D.line(ctx, *P(2600, 760), *P(2600 - 800, 760), hexrgb("#4cff8a"), 22)
        D.text(ctx, "800 FT", *P(2200, 650), 40, D.FONT_TITLE, hexrgb("#4cff8a"))
        D.text(ctx, "3000 FT", *P(400, 650), 40, D.FONT_TITLE, BPL)
    if step >= 2:
        ax, ay = P(-1500, -60)
        D.circle(ctx, ax, ay, 26, hexrgb("#e8423c"), D.INK, 3)
        D.text(ctx, "A1", ax, ay - 40, 40, D.FONT_TITLE, hexrgb("#e8423c"))
        for i in range(6):
            sx, sy = P(-1200 + i * 450, 100)
            D.line(ctx, sx, sy, sx - 50, sy, hexrgb("#e8423c"), 6)
            D.poly(ctx, [(sx - 50, sy - 12), (sx - 74, sy), (sx - 50, sy + 12)], hexrgb("#e8423c"), None, 0, wob=0)
    if step >= 3:
        u = (t * 0.4) % 1
        px, py = P(lerp(3000, 0, u), lerp(700, -1300, u))
        PL.rc_plane(ctx, px, py, 0.8, -1, t, 0.3)
        D.line(ctx, *P(3000, 700), *P(0, -1300), hexrgb("#f2c230"), 6, 0.6)
    if step >= 4:
        u = clamp((t % 3) / 2.0)
        rx = P(lerp(2600, 1800, u), 760)
        PL.rosie(ctx, rx[0], rx[1] + 14, 0.12, -1, "day", shadow=False, spin=1.0)


def shot_plan(ctx, t, S):
    d = S.cue(2) - S.cue(0)
    board(ctx, t)
    step = 0 if t < S.cue(1) else 1
    plan_map(ctx, t, step)
    D.text(ctx, "THE PLAN", W - 120, 150, 80, D.FONT_TITLE, BPL, "right")


def shot_boarding(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    if t < d * 0.45:
        board(ctx, t)
        plan_map(ctx, t, 2)
        clock_badge(ctx, "06:00", t, W - 260, 150)
        speakers(ctx, t, [(260, 300), (W - 260, 300)], 1.0, "#e8423c")
        return
    tt = t - d * 0.45
    cam = Cam(Keys((0, 1300), (2, 900)), 300, 0.5)
    hall_back(ctx, tt, cam, "dawn", 1.0)
    with layer(ctx, cam, tt):
        r = rng(23)
        for i in range(50):
            y = TM.FL + r.uniform(0, 520)
            s = floor_s(y, s=95)
            x0 = r.uniform(-1300, 4400)
            v = r.uniform(500, 700)
            x = x0 - v * tt * (0.5 + 0.5 * clamp(tt / 0.5))
            p = R.gait(v * tt / s / R.GAITS["run"]["L"] + i * 0.3, "run", "side", i)
            p.update(a1=(1.4, -0.1), a2=(1.2, 0.0), mouth=0.9, lean=0.35)
            R.Fig(R.zombie_look(2300 + i)).draw(ctx, x, y, s, -1, p)
    pop_text(ctx, "FINAL BOARDING CALL", W / 2, 230, tt, 0.1, 80, "#ffe36a", dur=d, shake=False)


def shot_toy(ctx, t, S):
    board(ctx, t)
    plan_map(ctx, t, 3)


def shot_full(ctx, t, S):
    d = S.dur - S.cue(4)
    board(ctx, t)
    plan_map(ctx, t, 4)
    for i, (num, name, c) in enumerate((("1", "BOARDING CALL", "#e8423c"), ("2", "TOY PLANE", "#f2c230"),
                                        ("3", "FULL POWER", "#4cff8a"))):
        k = ease_out_back(clamp((t - i * 0.4) / 0.3))
        if k <= 0:
            continue
        ctx.save()
        ctx.translate(380 + i * 560, 170)
        ctx.scale(k, k)
        D.circle(ctx, 0, 0, 44, hexrgb(c), D.INK, 4)
        D.text(ctx, num, 0, 22, 60, D.FONT_TITLE, hexrgb("#fff6d8"))
        D.text(ctx, name, 60, 18, 40, D.FONT_TITLE, BPL, "left")
        ctx.restore()
    if t > d * 0.55:
        pop_text(ctx, "DON'T LOOK BACK.", W / 2, 960, t, d * 0.55, 80, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_plan, "fade", 0.3),
        Shot(c(2) - 0.1, shot_boarding),
        Shot(c(3) - 0.1, shot_toy),
        Shot(c(4) - 0.1, shot_full),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(c(1) + 0.3, "pencil", 0.8), (c(2) + 0.4, "pa_chime", 0.9), (c(3), "rc_buzz", 0.6), (c(4) + 0.2, "ding", 0.8)]
    S.music = "plan"
