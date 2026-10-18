"""День 17: Рози пьёт авиабензин, не керосин. Склад топлива в 400 ярдах через открытый перрон. Два
часа ночи, багажный тягач, двадцать пустых канистр. На полпути они слышат мотор. Глушишь. Замираешь.
Проходят мимо. Остаток пути толкаешь тягач руками."""
from scenes.kit import *
from scenes.shared import *


def shot_fuel(ctx, t, S):
    d = S.cue(1) - 0.1
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    for i, (lab, c, ok) in enumerate((("AVGAS 100LL", "#2f6fd0", True), ("JET A", "#f4f4f0", False))):
        k = ease_out_back(clamp((t - i * 0.8) / 0.35))
        if k <= 0:
            continue
        ctx.save()
        ctx.translate(W / 2 - 400 + i * 800, H / 2 + 40)
        ctx.scale(k, k)
        D.rrect(ctx, -220, -300, 440, 520, 30, hexrgb(c), D.INK, 8)
        D.text(ctx, lab, 0, -180, 56, D.FONT_TITLE, hexrgb("#fff6d8") if i == 0 else hexrgb("#1c3f7c"))
        D.circle(ctx, 0, 40, 130, hexrgb("#4cff8a") if ok else hexrgb("#ff4a3a"), D.INK, 8)
        if ok:
            D.polyline(ctx, [(-60, 40), (-15, 90), (70, -20)], hexrgb("#fff6d8"), 22)
        else:
            D.line(ctx, -60, -20, 60, 100, hexrgb("#fff6d8"), 22)
            D.line(ctx, 60, -20, -60, 100, hexrgb("#fff6d8"), 22)
        ctx.restore()


def shot_distance(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    D.rect(ctx, 0, 0, W, H, tone("#28402c", "night"), None, 0, wob=0)
    map_view(ctx, t, W / 2 - 400, H / 2 - 40, 0.3, "night", labels=True)
    ctx.save()
    ctx.translate(W / 2 - 400, H / 2 - 40)
    ctx.scale(0.3, 0.3)
    a, b = AP.MAP_HANGAR, AP.MAP_FUEL
    k = clamp(t / (d * 0.6))
    D.line(ctx, a[0], a[1], lerp(a[0], b[0], k), lerp(a[1], b[1], k), hexrgb("#ffe36a"), 30)
    D.circle(ctx, a[0], a[1], 50, hexrgb("#e8423c"), D.INK, 8)
    D.circle(ctx, b[0], b[1], 50, hexrgb("#2f6fd0"), D.INK, 8)
    ctx.restore()
    pop_text(ctx, "400 YARDS", W / 2 + 300, 260, t, d * 0.6, 100, "#ffe36a", dur=d, shake=False)
    pop_text(ctx, "OPEN TARMAC", W / 2 + 300, 380, t, d * 0.75, 70, "#fff6d8", dur=d, shake=False)


def night_apron(ctx, t, cam):
    apron_back(ctx, t, cam, "night", 0.0, moon=(4000, -100, 50), x0=2400, x1=7800)


def shot_drive(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    T_HEAR = d * 0.55
    x = 6200 - min(t, T_HEAR) * 360
    cam = Cam(lambda q: 6200 - min(q, T_HEAR) * 360, 640, 0.95)
    night_apron(ctx, t, cam)
    with layer(ctx, cam, t):
        PL.tug(ctx, x, AP.GY + 80, 0.7, -1, "night", beacon=0.0, carts=1, load=0.0)
        for k in range(10):
            jerrycan(ctx, x + 240 + (k % 5) * 50, AP.GY - 20 - (k // 5) * 60, 0.45, "#e8423c")
        p = sit_pose(t, 1, "determined" if t < T_HEAR else "scared", seat=0.7)
        p.update(h1=(0.8, -1.9), h2=(0.75, -1.85), blink=0)
        DANNY_JACKET.draw(ctx, x + 20, AP.GY - 10, 90, -1, p)
        draw_lab(ctx, x - 70, AP.GY - 30, 60, -1, dog_pose(t, "sit"))
        if t > T_HEAR:
            for i in range(5):
                zx = x - 800 + i * 300
                p = zombie_idle(t, i)
                p["hturn"] = 1.0 if t > T_HEAR + 0.2 * i else -1.0
                R.Fig(R.zombie_look(1700 + i)).draw(ctx, zx, AP.GY + 200 + (i % 2) * 60, 105, 1, p)
    fx.darkness(ctx, 0.55, [fx.Light(*cam.to_screen(t, x - 200, AP.GY + 40), 500, kind="cone", ang=math.pi,
                                     spread=0.35, power=0.9 if t < T_HEAR else 0.0, glow="#ffe9a0")])
    clock_badge(ctx, "02:00", t, W - 260, 150)
    if t < T_HEAR:
        pop_text(ctx, "VRRRR", W / 2 + 300, 330, t, 0.2, 80, "#fff6d8", dur=T_HEAR, shake=False)
    else:
        for i in range(5):
            D.text(ctx, "!", 300 + i * 160, 360 + (i % 2) * 40, 80, D.FONT_TITLE, hexrgb("#e8423c"), stroke=D.INK,
                   slw=8, alpha=clamp((t - T_HEAR - 0.1 * i) / 0.2))


def shot_freeze(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    x = 6200 - (S.cue(3) - S.cue(2)) * 0.55 * 360
    cam = Cam(x, 620, 1.2)
    night_apron(ctx, t, cam)
    with layer(ctx, cam, t):
        PL.tug(ctx, x, AP.GY + 80, 0.7, -1, "night", carts=1, load=0.0)
        p = sit_pose(0, 1, "scared", seat=0.7)
        p.update(h1=(0.8, -1.9), h2=(0.75, -1.85), blink=0, sweat=1.0)
        DANNY_JACKET.draw(ctx, x + 20, AP.GY - 10, 90, -1, p)
        draw_lab(ctx, x - 70, AP.GY - 30, 60, -1, dog_pose(0, "sit", wag=0.0))
        for i in range(5):
            zx = x - 900 + t * 110 + i * 260
            pz = R.gait(t * 1.2 + i * 0.3, "shamble", "side", i)
            pz.update(a1=(1.0, -0.1), a2=(0.9, 0.0), mouth=0.5)
            R.Fig(R.zombie_look(1700 + i)).draw(ctx, zx, AP.GY + 240 + (i % 2) * 70, 120, 1, pz)
    fx.darkness(ctx, 0.5, [])
    pop_text(ctx, "FREEZE.", W / 2, 230, t, 0.2, 110, "#9fd8ec", dur=d * 0.7, shake=False)


def shot_push(ctx, t, S):
    d = S.dur - S.cue(4)
    x0 = 6200 - (S.cue(3) - S.cue(2)) * 0.55 * 360
    x = x0 - t * 160
    cam = Cam(lambda q: x0 - q * 160, 620, 0.95)
    night_apron(ctx, t, cam)
    with layer(ctx, cam, t):
        PL.tug(ctx, x, AP.GY + 80, 0.7, -1, "night", carts=1, load=0.0)
        p = R.gait(t * 160 / 115 / R.GAITS["walk"]["L"], "walk", "side", 1)
        p.update(face="determined", h1=(0.7, -1.6), h2=(0.65, -1.55), lean=0.45, sweat=0.8)
        DANNY_JACKET.draw(ctx, x + 330, AP.GY + 80, 115, -1, p)
        draw_lab(ctx, x + 560, AP.GY + 80, 95, -1, dog_pose(t, "trot", phase=t * 1.8))
    fx.darkness(ctx, 0.45, [])
    pop_text(ctx, "PUSH...", W / 2 + 300, 280, t, 0.3, 100, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_fuel, "fade", 0.3),
        Shot(c(1) - 0.1, shot_distance, "fade", 0.25),
        Shot(c(2) - 0.1, shot_drive, "fade", 0.3),
        Shot(c(3) - 0.1, shot_freeze),
        Shot(c(4) - 0.1, shot_push, "fade", 0.25),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(c(2), "engine", 0.7), (c(2) + (c(3) - c(2)) * 0.55, "engine_down", 0.8), (c(3), "heartbeat", 0.9),
              (c(4) + 0.2, "strain", 0.8)]
    S.music = [(0, "plan", 0.8), (c(2), "sneak", 1.0), (c(3), "tension", 1.0)]
