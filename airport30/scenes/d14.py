"""День 14: HELP на перроне из четырёхсот чемоданов. В полдень — вертолёт новостей: два круга, тебя
снимают, улетает. Вечером Уолт: «Ты в новостях, тебя зовут „парень из аэропорта“». На заражённый
аэропорт никто не садится."""
from scenes.kit import *
from scenes.shared import *

LETTERS = {
    "H": [(0, 0), (0, 1), (0, 2), (0, 3), (0, 4), (1, 2), (2, 0), (2, 1), (2, 2), (2, 3), (2, 4)],
    "E": [(0, 0), (0, 1), (0, 2), (0, 3), (0, 4), (1, 0), (2, 0), (1, 2), (1, 4), (2, 4)],
    "L": [(0, 0), (0, 1), (0, 2), (0, 3), (0, 4), (1, 4), (2, 4)],
    "P": [(0, 0), (0, 1), (0, 2), (0, 3), (0, 4), (1, 0), (2, 0), (2, 1), (1, 2), (2, 2)],
}


def help_cells():
    out = []
    for li, ch in enumerate("HELP"):
        for (cx, cy) in LETTERS[ch]:
            out.append((li * 4 + cx, cy))
    return out


def draw_help(ctx, x, y, cell, k=1.0, seed=0):
    cells = help_cells()
    n = int(len(cells) * clamp(k))
    r = rng(seed)
    for i, (cx, cy) in enumerate(cells):
        c = r.choice(RM.BAG_COLS)
        if i >= n:
            continue
        D.rrect(ctx, x + cx * cell, y + cy * cell, cell * 0.92, cell * 0.92, cell * 0.12, hexrgb(c), D.INK,
                max(2, cell * 0.06))


def shot_spell(ctx, t, S):
    d = S.cue(1) - 0.1
    D.rect(ctx, 0, 0, W, H, tone("#7d868f", "day"), None, 0, wob=0)
    for k in range(12):
        D.line(ctx, 0, k * 100, W, k * 100 - 40, tone("#6e777f", "day"), 3)
    D.line(ctx, 0, 980, W, 940, hexrgb("#f2c230"), 10)
    draw_help(ctx, 260, 260, 88, t / (d * 0.85), seed=14)
    # Дэнни сверху: тащит чемодан
    u = (t * 0.5) % 1
    x = lerp(220, 1700, u)
    D.circle(ctx, x, 880, 34, hexrgb("#2a1d18"), D.INK, 4)
    D.rect(ctx, x - 26, 900, 52, 40, hexrgb("#ff8a1c"), D.INK, 3, wob=0)
    D.rrect(ctx, x + 40, 880, 60, 46, 8, hexrgb("#2f8fd8"), D.INK, 3)
    D.circle(ctx, x - 90, 900, 22, hexrgb("#ecc47e"), D.INK, 3)
    n = int(400 * clamp(t / (d * 0.85)))
    counter_badge(ctx, "SUITCASES", n, W - 300, 150, "#ffe36a", 480)


def shot_heli(ctx, t, S):
    d = S.cue(3) - S.cue(1)
    T_LEAVE = d * 0.7
    cam = Cam(Keys((0, 1700), (d, 1850)), 560, 0.7)
    apron_back(ctx, t, cam, "day", 1.0, sun=(2400, -300, 80), x0=-400, x1=4400)
    with layer(ctx, cam, t):
        draw_help(ctx, 700, AP.HZ + 170, 60, 1.0, seed=14)
        p = R.stand("front", t, 1)
        wave = math.sin(t * 9)
        p.update(face="laugh" if t < T_LEAVE else "sad", a1=(2.6 + 0.3 * wave, 0.3), a2=(2.6 - 0.3 * wave, 0.3))
        if t > T_LEAVE:
            p.update(a1=(0.3, 0.2), a2=(0.3, 0.2))
        DANNY_JACKET.draw(ctx, 1900, AP.GY + 60, 125, 1, p)
        draw_lab(ctx, 2140, AP.GY + 60, 110, -1, dog_pose(t, "sit", bark=1.0 if t < T_LEAVE else 0.0))
        if t < T_LEAVE:
            a = t / T_LEAVE * TAU * 2
            hx, hy = 2000 + math.cos(a) * 900, 100 + math.sin(a) * 120
            f = -1 if math.sin(a) > 0 else 1
        else:
            k = (t - T_LEAVE) / (d - T_LEAVE)
            hx, hy, f = 2900 + k * 2200, 100 - k * 300, 1
        PL.helicopter(ctx, hx, hy, 0.9, f, t)
        # камера оператора
        D.radial(ctx, hx - f * 20, hy + 40, 50, "#ff4a3a", 0.6 if (t * 2) % 1 < 0.5 else 0.1, 0)
    if t < T_LEAVE:
        D.circle(ctx, 80, 80, 18, hexrgb("#ff4a3a"), None, 0)
        D.text(ctx, "REC", 110, 92, 36, D.FONT_TITLE, hexrgb("#fff6d8"), "left")
    else:
        pop_text(ctx, "...BYE?", W / 2, 260, t, T_LEAVE + 0.3, 100, "#fff6d8", dur=d, shake=False)


def shot_tv(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    cam = Cam(OS.RADIO_X - 240, 520, 1.6)
    walt_radio(ctx, t, cam, 1.0, "smile")
    # «телевизор» в углу: новости
    k = ease_out_back(clamp(t / 0.4))
    ctx.save()
    ctx.translate(W - 520, 330)
    ctx.scale(k, k)
    D.rrect(ctx, -380, -240, 760, 480, 30, hexrgb("#2b2f3a"), D.INK, 8)
    D.rect(ctx, -340, -200, 680, 360, hexrgb("#7d868f"), D.INK, 4, wob=0)
    ctx.save()
    ctx.rectangle(-340, -200, 680, 360)
    ctx.clip()
    draw_help(ctx, -280, -150, 34, 1.0, seed=14)
    D.circle(ctx, 200, 60, 22, hexrgb("#2a1d18"), D.INK, 3)
    D.rect(ctx, 182, 82, 36, 30, hexrgb("#ff8a1c"), D.INK, 2, wob=0)
    ctx.restore()
    D.rect(ctx, -340, 110, 680, 50, hexrgb("#e8423c"), None, 0, wob=0)
    D.text(ctx, "THE KID AT THE AIRPORT", 0, 148, 36, D.FONT_TITLE, hexrgb("#fff6d8"))
    D.rect(ctx, -340, -200, 120, 40, hexrgb("#e8423c"), None, 0, wob=0)
    D.text(ctx, "LIVE", -280, -168, 30, D.FONT_TITLE, hexrgb("#fff6d8"))
    ctx.restore()


def shot_nobody(ctx, t, S):
    d = S.dur - S.cue(4)
    cam = Cam(Keys((0, 1800), (d, 1700)), 420, Keys((0, 0.55), (d, 0.5)))
    apron_back(ctx, t, cam, "dusk", 1.0, sun=(2400, 500, 90), x0=-400, x1=4400)
    with layer(ctx, cam, t):
        draw_help(ctx, 700, AP.GY + 60, 60, 1.0, seed=14)
        p = floor_sit_pose(t, 1, "sad", hug=True)
        DANNY_JACKET.draw(ctx, 2000, AP.GY + 260, 105, 1, p)
        draw_lab(ctx, 2200, AP.GY + 260, 95, -1, dog_pose(t, "lie"))
        for k in range(3):
            x = 4500 - t * 200 + k * 500
            PL.jet(ctx, x, -300 - k * 120, 0.12, -1, "dusk", shadow=False, gear=False)
    fx.grade(ctx, "dusk", 0.2)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_spell, "fade", 0.3),
        Shot(c(1) - 0.1, shot_heli, "fade", 0.3),
        Shot(c(3) - 0.1, shot_tv, "fade", 0.3),
        Shot(c(4) - 0.1, shot_nobody, "fade", 0.4),
    ]
    S.tods = [(0, "day"), (c(3), "night"), (c(4), "dusk")]
    S.sfx += [(c(1), "helicopter", 0.9), (c(3) + 0.3, "tv_jingle", 0.7)]
    S.music = [(0, "fun", 0.8), (c(1), "hope", 0.9), (c(4), "lonely", 0.8)]
