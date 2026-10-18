"""День 22: двести зомби у ангара, сутки напролёт. Самолёт, собака и игрушечный самолётик. Он вылетает в
окно, низко, жужжит, как злая пчела, и уводит их к озеру. Заряд пульта: одно деление. Беречь."""
from scenes.kit import *
from scenes.shared import *
from scenes.d11 import hangar_bg, ROSIE_X


def shot_siege(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, AP.HANGAR_X - 300), (d, AP.HANGAR_X)), 560, Keys((0, 0.55), (d, 0.62)))
    apron_back(ctx, t, cam, "day", 1.0, sun=(7000, -200, 80), x0=4200, x1=8200)
    with layer(ctx, cam, t):
        r = rng(22)
        for i in range(70):
            x = AP.HANGAR_X + r.uniform(-700, 700)
            y = AP.GY + r.uniform(-120, 380)
            p = zombie_reach(t, i)
            p.update(a1=(1.6, -0.2), a2=(1.4, -0.1), mouth=0.8, lean=0.2)
            R.Fig(R.zombie_look(2200 + i)).draw(ctx, x, y, floor_s(y, AP.GY, 85, 700), 1 if i % 2 else -1, p)
    counter_badge(ctx, "OUTSIDE", 200, W - 300, 160, "#ff4a3a", 460)
    clock_badge(ctx, "24 H", t, 260, 160, "#ffe36a")


def shot_inventory(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    cam = Cam(1300, 600, 0.82)
    hangar_bg(ctx, t, cam, "day", 1.0)
    with layer(ctx, cam, t):
        PL.rosie(ctx, ROSIE_X, RM.FL + 40, 1.1, 1, "day")
        p = sit_pose(t, 1, "worried", seat=0.0)
        p.update(f1=(0.8, 0.0), f2=(0.7, 0.0))
        DANNY_JACKET.draw(ctx, 1750, RM.FL + 60, 115, 1, p)
        draw_lab(ctx, 2000, RM.FL + 60, 105, -1, dog_pose(t, "lie"))
    for i, (txt, t0) in enumerate((("1 PLANE", 0.3), ("1 DOG", 1.0), ("1 TOY", 1.7))):
        pop_text(ctx, txt, 400 + i * 560, 240, t, t0, 90, ["#e8423c", "#ecc47e", "#f2c230"][i], dur=d, shake=False)
    if t > 1.7:
        PL.rc_plane(ctx, W / 2 + 560, 420, 2.0, -1, t, 0.0)


def shot_launch(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    cam = Cam(Keys((0, AP.HANGAR_X - 200), (d, AP.HANGAR_X - 1300)), 520, 0.75)
    apron_back(ctx, t, cam, "day", 1.0, sun=(7000, -200, 80), x0=3600, x1=8200)
    with layer(ctx, cam, t):
        x = AP.HANGAR_X - 300 - t * 600
        y = 380 + math.sin(t * 6) * 40 + 120 * clamp(t / 1.0)
        PL.rc_plane(ctx, x, y, 1.4, -1, t, 0.15 * math.sin(t * 6))
        r = rng(22)
        for i in range(30):
            zx = AP.HANGAR_X + r.uniform(-600, 600) - max(0, t - 0.6 - (i % 6) * 0.1) * 420
            zy = AP.GY + r.uniform(-60, 320)
            p = R.gait(t * 1.6 + i * 0.3, "shamble", "side", i)
            p.update(neck=-0.5, look=(-0.3, -1), a1=(2.0, -0.2), a2=(1.8, 0.0), mouth=0.8)
            R.Fig(R.zombie_look(2200 + i)).draw(ctx, zx, zy, floor_s(zy, AP.GY, 100, 700), -1, p)
    pop_text(ctx, "BZZZZZ", W / 2 - 300, 260, t, 0.2, 110, "#ffe36a", dur=d, shake=True)


def shot_lake(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    D.rect(ctx, 0, 0, W, H, tone("#86c46a", "day"), None, 0, wob=0)
    map_view(ctx, t, W / 2, H / 2 + 200, 0.3, "day", labels=False)
    ctx.save()
    ctx.translate(W / 2, H / 2 + 200)
    ctx.scale(0.3, 0.3)
    k = clamp(t / (d * 0.8))
    a, b = AP.MAP_HANGAR, (600, -1050)
    px, py = lerp(a[0], b[0], k), lerp(a[1], b[1], k)
    PL.rc_plane(ctx, px, py - 80, 3.0, -1, t, 0.2)
    r = rng(5)
    for i in range(60):
        u = clamp(k - r.uniform(0.05, 0.25))
        zx = lerp(a[0], b[0], u) + r.uniform(-300, 300)
        zy = lerp(a[1], b[1], u) + r.uniform(-200, 200)
        D.circle(ctx, zx, zy, 34, hexrgb(r.choice(R.ZOMBIE_SKIN)), D.INK, 5)
    ctx.restore()
    pop_text(ctx, "→ THE LAKE", W / 2 + 300, 200, t, d * 0.4, 90, "#2f8fd8", dur=d, shake=False)


def shot_battery(ctx, t, S):
    d = S.dur - S.cue(4)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    bars = 1 if t > 0.6 else 2
    k = 1 + 0.03 * math.sin(t * 4)
    PL.rc_controller(ctx, W / 2, H / 2 + 80, 3.0 * k, bars=bars)
    if (t * 2) % 1 < 0.6 and bars == 1:
        fx.glow(ctx, W / 2 - 3.0 * 22 + 3.0 * 6, H / 2 + 80 - 3.0 * 32, 80, "#ff4a3a", 0.6)
    pop_text(ctx, "1 BAR LEFT", W / 2, 200, t, 0.7, 110, "#ff4a3a", dur=d, shake=False)
    pop_text(ctx, "SAVE IT.", W / 2, 920, t, d * 0.5, 90, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_siege, "fade", 0.3),
        Shot(c(1) - 0.1, shot_inventory, "fade", 0.25),
        Shot(c(2) - 0.1, shot_launch, "whip", 0.25),
        Shot(c(3) - 0.1, shot_lake, "fade", 0.25),
        Shot(c(4) - 0.1, shot_battery, "fade", 0.25),
    ]
    S.sfx += [(0.2, "zombie_groan", 0.9), (c(2), "rc_buzz", 1.0), (c(3), "rc_buzz", 0.6), (c(4) + 0.6, "low_battery", 1.0)]
    S.music = [(0, "dread", 0.8), (c(2), "comic", 1.0), (c(4), "mystery", 0.7)]
