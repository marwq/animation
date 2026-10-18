"""День 25: генератор — три этажа вниз, подвал, который никто не открывал три недели. Темно, вода по
колено — и там не пусто. Дизель в бак, одиннадцать рывков шнура — и бегом. Позади свет загорается этаж
за этажом. У аэропорта снова есть голос."""
from scenes.kit import *
from scenes.shared import *

GX = 1700


def shot_stairs(ctx, t, S):
    d = S.cue(1) - 0.1
    D.rect(ctx, 0, 0, W, H, hexrgb("#2b3040"), None, 0, wob=0)
    off = (t * 220) % 360
    for k in range(-1, 5):
        y = k * 360 + off - 200
        D.poly(ctx, [(200, y), (1700, y + 300), (1700, y + 340), (200, y + 40)], hexrgb("#5a606c"), D.INK, 5, wob=0)
        for j in range(10):
            D.line(ctx, 200 + j * 150, y + j * 30, 200 + j * 150, y + j * 30 + 40, D.INK, 3)
        D.text(ctx, "B%d" % (1 + (int(t * 0.6) + k) % 3), 1800, y + 200, 60, D.FONT_TITLE, hexrgb("#f2c230"))
    p = R.gait(t * 2.0, "walk", "side", 1)
    p.update(face="scared", lean=0.2)
    DANNY_JACKET.draw(ctx, 900, 700, 115, 1, p)
    fx.darkness(ctx, 0.6, [fx.Light(1000, 520, 500, kind="cone", ang=0.4, spread=0.35, power=1.0, glow="#ffe9a0")])
    counter_badge(ctx, "FLOOR", "B%d" % min(3, 1 + int(t / (d / 3))), W - 300, 160, "#f2c230", 420)


def shot_door(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    T_OPEN = 0.4
    D.vgrad(ctx, 0, 0, W, H, [(0, "#3a4050"), (1, "#22252c")])
    k = smooth(clamp((t - T_OPEN) / 0.8))
    D.rect(ctx, W / 2 - 300, 160, 600, 820, hexrgb("#0b0d14"), D.INK, 8, wob=0)
    ctx.save()
    ctx.translate(W / 2 - 300, 160)
    ctx.scale(1 - 0.8 * k, 1)
    D.rect(ctx, 0, 0, 600, 820, hexrgb("#8f99a3"), D.INK, 8, wob=0)
    D.rect(ctx, 100, 100, 400, 90, hexrgb("#f2c230"), D.INK, 4, wob=0)
    D.text(ctx, "B3 · POWER", 300, 166, 50, D.FONT_TITLE, hexrgb("#22252c"))
    ctx.restore()
    if k > 0.3:
        for j in range(2):
            zombie_glow_eyes(ctx, W / 2 + 60 + j * 160, 520 + j * 40, 12, clamp((t - T_OPEN - 0.6) / 0.3))
    pop_text(ctx, "CREEEAK", W / 2 + 500, 300, t, T_OPEN, 80, "#cfd8e0", dur=1.4, shake=False)


def shot_flooded(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    cam = Cam(Keys((0, 600), (d, 1100)), 560, 0.9)
    with layer(ctx, cam, t):
        bg(ctx, "basement", (-800, -1200, 4600, 3000), lambda c: RM.basement(c, 0.0, 0.0, 0.0), 0.7)
        w = Walk(Keys((0, 300), (d + 1, 1200, "lin")), RM.FL, 115, "sneak", t1=d + 2)
        w.draw(ctx, DANNY_JACKET, t, {"face": "scared", "sweat": 0.8})
        for i in range(3):
            x = 1500 + i * 300 + math.sin(t + i) * 30
            p = zombie_idle(t, i)
            p["mouth"] = 0.7
            R.Fig(R.zombie_look(2500 + i, ["ramp", "business", "tsa"][i])).draw(ctx, x, RM.FL + 20, 118, -1, p)
        wy = RM.FL - 40 - 140 * 0.6
        pts = [(-800, wy)] + [(lerp(-800, 3800, k / 40), wy + math.sin(t * 2 + k * 0.6) * 6) for k in range(41)] + \
              [(3800, RM.FL + 900), (-800, RM.FL + 900)]
        D.poly(ctx, pts, hexrgb("#2a5a7a"), None, 0, wob=0, alpha=0.75)
        D.polyline(ctx, pts[1:-2], hexrgb("#9fd8ec"), 4, 0.7)
    fx.darkness(ctx, 0.62, [fx.Light(*cam.to_screen(t, 300 + t * 900 / (d + 1) + 60, RM.FL - 330), 700, kind="cone",
                                     ang=0.0, spread=0.3, power=1.0, glow="#ffe9a0")])
    pop_text(ctx, "NOT EMPTY.", W / 2, 220, t, d * 0.55, 100, "#9fc86a", dur=d, shake=False)


def shot_pull(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    n = min(11, 1 + int(t / (d * 0.75) * 11))
    on = n >= 11
    cam = Cam(GX + 500, 600, 1.15, shake=lambda q: 0.15 if on else 0.0)
    with layer(ctx, cam, t):
        bg(ctx, "basement", (-800, -1200, 4600, 3000), lambda c: RM.basement(c, 0.0, 0.0, 0.0), 0.7)
        D.circle(ctx, GX + 400, RM.FL - 400, 40, hexrgb("#4cff8a") if on else hexrgb("#2b2f3a"), D.INK, 4)
        pull = abs(math.sin(t * 6)) if not on else 0.0
        p = R.stand("side", t, 1)
        p.update(face="determined" if not on else "laugh", h1=(0.7 - 0.6 * pull, -2.0), h2=(0.6 - 0.6 * pull, -1.95),
                 lean=-0.2 * pull, sweat=1.0)
        J = DANNY_JACKET.draw(ctx, GX + 900, RM.FL, 118, -1, p)
        hx, hy = DANNY_JACKET.world(GX + 900, RM.FL, 118, -1, J["hand1"])
        D.line(ctx, GX + 600, RM.FL - 230, hx, hy, D.INK, 6)
        D.rrect(ctx, hx - 30, hy - 13, 60, 26, 10, hexrgb("#e8423c"), D.INK, 3)
        if on:
            for k in range(3):
                ph = (t * 1.2 + k / 3) % 1
                D.circle(ctx, GX + 600 + ph * 40, -300 - ph * 160, 30 + 40 * ph, hexrgb("#c9ccd2"), None, 0,
                         alpha=0.5 * (1 - ph))
        wy = RM.FL - 40 - 84
        D.rect(ctx, -800, wy, 4600, 1200, hexrgb("#2a5a7a"), None, 0, wob=0, alpha=0.75)
    fx.darkness(ctx, 0.5 if not on else 0.2, [fx.Light(W / 2, H / 2, 700, power=0.6, glow_a=0.0)])
    counter_badge(ctx, "PULLS", n, W - 300, 160, "#4cff8a" if on else "#ffe36a", 420)
    if on:
        pop_text(ctx, "BRRRRRMMM!", W / 2 - 300, 280, t, d * 0.78, 120, "#4cff8a", dur=d)


def shot_floors(ctx, t, S):
    d = S.dur - S.cue(4)
    cam = Cam(900, 420, 0.62)
    k = clamp(t / (d * 0.7))
    apron_back(ctx, t, cam, "night", 0.0, clouds=False, x0=-1400, x1=4000)
    with layer(ctx, cam, t):
        a, b = AP.TERM_X
        n = 5
        for i in range(n):
            lit = k > i / n
            if lit:
                y = 620 - (i + 1) * 58
                D.rect(ctx, a, y, b - a, 58, hexrgb("#ffd978"), None, 0, wob=0, alpha=0.75)
        if k > 0.8:
            D.circle(ctx, AP.TOWER_X, -94, 14, hexrgb("#ff4a3a"), None, 0)
            D.radial(ctx, AP.TOWER_X, 70, 160, "#7fe0c8", 0.6, 0)
    speakers(ctx, t, [(260, 300), (W - 260, 300)], clamp((t - d * 0.7) / 0.3), "#4cff8a")
    if t > d * 0.7:
        pop_text(ctx, "IT HAS A VOICE AGAIN.", W / 2, 200, t, d * 0.7, 90, "#4cff8a", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_stairs, "fade", 0.3),
        Shot(c(1) - 0.1, shot_door),
        Shot(c(2) - 0.1, shot_flooded, "fade", 0.25),
        Shot(c(3) - 0.1, shot_pull, "whip", 0.25),
        Shot(c(4) - 0.1, shot_floors, "fade", 0.25),
    ]
    d3 = c(4) - c(3)
    S.sfx += [(c(1) + 0.4, "door_creak", 1.0), (c(2), "water", 0.8), (c(2) + 1.2, "zombie_groan", 0.9),
              (c(3) + 0.2, "pull_cord", 0.8), (c(3) + 1.0, "pull_cord", 0.8), (c(3) + d3 * 0.78, "generator", 1.0),
              (c(4) + 0.4, "power_up", 1.0)]
    S.music = [(0, "sneak", 1.0), (c(3), "chase", 1.0), (c(4), "hope", 1.0)]
