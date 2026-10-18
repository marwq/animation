"""День 20: второй рейс за топливом — тягач глохнет посреди поля, и на этот раз они тебя видят. Пиклз
лает один раз и убегает в другую сторону — все за ней. Сорок галлонов до ангара руками. На рассвете
она возвращается в грязи и виляет хвостом. Бак Рози полон."""
from scenes.kit import *
from scenes.shared import *
from scenes.d17 import night_apron
from scenes.d11 import hangar_bg, ROSIE_X

TX = 5000


def shot_dies(ctx, t, S):
    d = S.cue(1) - 0.1
    T_DIE = d * 0.5
    x = TX + 600 - min(t, T_DIE) * 300
    cam = Cam(lambda q: TX + 600 - min(q, T_DIE) * 300, 640, 1.0, shake=lambda q: shake_k(q, T_DIE, 0.4, 0.8))
    night_apron(ctx, t, cam)
    with layer(ctx, cam, t):
        PL.tug(ctx, x, AP.GY + 80, 0.7, 1, "night", carts=1, load=0.0)
        for k in range(8):
            jerrycan(ctx, x - 240 - (k % 4) * 50, AP.GY - 20 - (k // 4) * 60, 0.45, "#e8423c")
        p = sit_pose(t, 1, "shock" if t > T_DIE else "determined", seat=0.7)
        p.update(h1=(0.8, -1.9), h2=(0.75, -1.85), blink=0)
        DANNY_JACKET.draw(ctx, x - 20, AP.GY - 10, 90, 1, p)
        draw_lab(ctx, x + 70, AP.GY - 30, 60, 1, dog_pose(t, "sit"))
        if t > T_DIE:
            for k in range(3):
                ph = ((t - T_DIE) * 1.2 + k / 3) % 1
                D.circle(ctx, x + 120 + ph * 60, AP.GY - 130 - ph * 200, 20 + 40 * ph, hexrgb("#5a606c"), None, 0,
                         alpha=0.7 * (1 - ph))
    fx.darkness(ctx, 0.5, [])
    if t > T_DIE:
        pop_text(ctx, "PUTT... PUTT...", W / 2 + 300, 280, t, T_DIE, 80, "#fff6d8", dur=2.0, shake=False)


def shot_seen(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    cam = Cam(TX, 600, Keys((0, 0.75), (d, 0.9)))
    night_apron(ctx, t, cam)
    with layer(ctx, cam, t):
        x = TX + 600 - (S.cue(1) - 0.1) * 0.5 * 300
        PL.tug(ctx, x, AP.GY + 80, 0.7, 1, "night", carts=1, load=0.0)
        p = R.stand("side", t, 1)
        p.update(face="scared", blink=0, sweat=1.0, hturn=-0.6)
        DANNY_JACKET.draw(ctx, x - 20, AP.GY + 80, 115, -1, p)
        r = rng(20)
        for i in range(14):
            zx = TX - 1900 + i * 110 + t * 80
            zy = AP.GY + 140 + r.uniform(0, 260)
            pz = zombie_reach(t, i)
            pz["mouth"] = 1.0
            R.Fig(R.zombie_look(2000 + i)).draw(ctx, zx, zy, floor_s(zy, AP.GY, 110), 1, pz)
            hx = zx + 0.25 * floor_s(zy, AP.GY, 110)
            hy = zy - 3.4 * floor_s(zy, AP.GY, 110)
            zombie_glow_eyes(ctx, hx, hy, floor_s(zy, AP.GY, 110) * 0.12, 1.0)
    fx.darkness(ctx, 0.45, [])
    pop_text(ctx, "THEY SEE YOU.", W / 2, 230, t, 0.4, 100, "#e8423c", dur=d, shake=True)


def shot_bark(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    T_RUN = 0.8
    cam = Cam(Keys((0, TX), (d, TX + 1200)), 600, 0.65)
    night_apron(ctx, t, cam)
    with layer(ctx, cam, t):
        dx = TX + 200 + max(0, t - T_RUN) * 700
        draw_lab(ctx, dx, AP.GY + 200, 110, 1,
                 dog_pose(t, "run" if t > T_RUN else "stand", phase=t * 3, bark=1.0 if t < T_RUN else 0.0))
        r = rng(20)
        for i in range(14):
            zx = TX - 1000 + i * 110 + max(0, t - T_RUN - 0.2) * 560
            zy = AP.GY + 140 + r.uniform(0, 260)
            s = floor_s(zy, AP.GY, 110)
            pz = R.gait(t * 2.2 + i * 0.3, "run", "side", i)
            pz.update(a1=(1.4, -0.1), a2=(1.2, 0.0), mouth=0.9, lean=0.35)
            R.Fig(R.zombie_look(2000 + i)).draw(ctx, zx, zy, s, 1, pz)
    fx.darkness(ctx, 0.4, [])
    pop_text(ctx, "WOOF!", W / 2 - 100, 300, t, 0.1, 150, "#ffe36a", dur=1.0)
    if t > T_RUN:
        motion_lines(ctx, W / 2 + 200, 700, 1, 5, 200, 40, a=0.6)


def shot_carry(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    cam = Cam(lambda q: 5800 + q * 120, 620, 0.85)
    night_apron(ctx, t, cam)
    with layer(ctx, cam, t):
        x = 5600 + t * 120
        p = R.gait(t * 120 / 115 / R.GAITS["walk"]["L"], "walk", "side", 1)
        p.update(face="determined", h1=(0.3, -1.0), h2=(-0.2, -1.0), sweat=1.0, lean=0.05)
        J = DANNY_JACKET.draw(ctx, x, AP.GY + 80, 115, 1, p)
        for k, hand in enumerate(("hand1", "hand2")):
            hx, hy = DANNY_JACKET.world(x, AP.GY + 80, 115, 1, J[hand])
            jerrycan(ctx, hx, hy + 70, 0.55, "#e8423c")
    fx.darkness(ctx, 0.35, [])
    n = int(40 * clamp(t / d))
    counter_badge(ctx, "GALLONS", n, W - 300, 160, "#4cff8a", 460)


def shot_dawn(ctx, t, S):
    d = S.dur - S.cue(4)
    T_FULL = d * 0.6
    if t < T_FULL:
        cam = Cam(1300, 620, 0.85)
        hangar_bg(ctx, t, cam, "dawn", 0.0, open_k=0.4)
        with layer(ctx, cam, t):
            PL.rosie(ctx, ROSIE_X, RM.FL + 40, 1.1, 1, "day", dirt=0.3)
            p = R.stand("side", t, 1)
            p.update(face="laugh", a1=(0.2, 1.2), a2=(0.2, 1.2), hturn=0.7)
            DANNY_JACKET.draw(ctx, 2000, RM.FL + 60, 115, 1, p)
            x = Keys((0, 3600), (1.6, 2300, "out"))(t)
            draw_lab(ctx, x, RM.FL + 60, 110, -1, dog_pose(t, "trot" if t < 1.6 else "sit", phase=t * 2, wag=1.0))
            r = rng(2)
            for k in range(14):
                D.circle(ctx, x - 50 + r.uniform(-60, 60), RM.FL - 30 - r.uniform(0, 60), r.uniform(6, 14),
                         hexrgb("#7a5a3a"), None, 0)
        return
    tt = t - T_FULL
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2b2f3a"), (1, "#15181f")])
    RM.rosie_panel(ctx, W / 2, H / 2 + 60, 1.25, tt, 0.0, rpm=0.0, fuel=clamp(tt / 1.0))
    if tt > 1.0:
        pop_text(ctx, "TANK: FULL", W / 2, 180, tt, 1.0, 110, "#4cff8a", dur=d)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_dies, "fade", 0.3),
        Shot(c(1) - 0.1, shot_seen),
        Shot(c(2) - 0.1, shot_bark, "whip", 0.25),
        Shot(c(3) - 0.1, shot_carry, "fade", 0.25),
        Shot(c(4) - 0.1, shot_dawn, "fade", 0.4),
    ]
    S.tods = [(0, "night"), (c(4), "dawn")]
    S.sfx += [(c(1) * 0.5, "engine_down", 0.9), (c(1), "zombie_groan", 1.0), (c(2) + 0.1, "bark", 1.0),
              (c(2) + 0.9, "stampede", 0.9), (c(4) + 0.5, "bark", 0.6)]
    S.music = [(0, "tension", 1.0), (c(2), "chase", 1.0), (c(4), "hope", 1.0)]
