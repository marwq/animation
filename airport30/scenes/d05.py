"""День 5: дьюти-фри. Набиваешь сумку шоколадом — они выходят из-за угла. Бежать некуда — и ты не
бежишь. Замираешь между двумя манекенами, Пиклз сидит и не моргает. Проходят мимо, так близко, что
слышен запах. Правило второе: они не видят того, кто не двигается."""
from scenes.kit import *
from scenes.shared import *

SPOT = 1500    # место между манекенами


def store(ctx, t, cam):
    room_back(ctx, t, cam, "duty", lambda c: TM.duty_free(c), (-600, -1500, 4600, 3300))


def frozen_pose(t):
    p = R.stand("front", t, 1)
    p.update(face="scared", blink=0, a1=(0.45, 0.6), a2=(0.2, 1.4), hip=(0, 0), lean=0.0, sweat=0.7)
    p["hip"] = (0.0, 0.0)
    return p


def mannequins(ctx, t):
    for i, (x, c, dr) in enumerate(((SPOT - 260, "#e8423c", True), (SPOT + 260, "#2f8fd8", False))):
        p = R.stand("front", 0, 9)
        p.update(a1=(0.45, 0.6) if i == 0 else (0.25, 1.3), a2=(0.2, 1.4) if i == 0 else (0.5, 0.5))
        R.Fig(mannequin_look(80 + i, c, dr)).draw(ctx, x, TM.FL, 112, 1, p)
        D.rect(ctx, x - 60, TM.FL - 10, 120, 16, hexrgb("#c9d0d6"), D.INK, 3, wob=0)


def shot_shop(ctx, t, S):
    d = S.cue(1) - 0.1
    T_COME = d * 0.6
    cam = Cam(Keys((0, 2100), (T_COME, 2000), (d, 1600)), 520, Keys((0, 0.95), (d, 0.8)))
    store(ctx, t, cam)
    with layer(ctx, cam, t):
        p = R.stand("side", t, 1)
        grab = math.sin(t * 6)
        stop = t > T_COME
        p.update(face="shock" if stop else "happy", h1=(0.8, -2.0 + 0.3 * grab) if not stop else (0.6, -2.3),
                 h2=(0.3, -1.4), hturn=-0.8 if stop else 0.8, blink=0 if stop else p["blink"])
        J = DANNY.draw(ctx, 2150, TM.FL, 115, 1 if not stop else -1, p)
        hx, hy = DANNY.world(2150, TM.FL, 115, 1 if not stop else -1, J["hand2"])
        D.rrect(ctx, hx - 40, hy - 10, 80, 90, 14, hexrgb("#f2c230"), D.INK, 4)
        for k in range(3):
            D.poly(ctx, [(hx - 30 + k * 20, hy), (hx - 18 + k * 20, hy - 34), (hx - 6 + k * 20, hy)],
                   hexrgb(["#e8423c", "#7a4a30", "#2f8fd8"][k]), D.INK, 2, wob=0)
        draw_lab(ctx, 2450, TM.FL, 105, -1, dog_pose(t, "stand", look=0.3))
        if t > T_COME:
            for i in range(4):
                x = Keys((0, 900), (3, 1500))(t - T_COME) - i * 260
                p = R.gait((t - T_COME) * 1.4 + i * 0.3, "shamble", "side", i)
                p.update(a1=(1.3, -0.1), a2=(1.2, 0.0), mouth=0.6)
                R.Fig(R.zombie_look(600 + i)).draw(ctx, x, TM.FL + 40 + (i % 2) * 40, 118, 1, p)
    if t > T_COME:
        pop_text(ctx, "!", W / 2 + 200, 280, t, T_COME, 200, "#e8423c", dur=1.5)


def shot_nowhere(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#7a4fc2"), (1, "#3a2a6a")])
    look = math.sin(t * 5)
    DANNY.head_only(ctx, W / 2, H / 2 + 60, 380, 1, {"view": "front", "face": "scared", "blink": 0,
                                                     "look": (look, 0.0), "neck_line": False, "sweat": 1.0})
    pop_text(ctx, "DON'T MOVE.", W / 2, 180, t, 0.6, 110, "#fff6d8", dur=4, shake=False)


def shot_freeze(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    T_DOG = d * 0.62
    if t < T_DOG:
        cam = Cam(SPOT, Keys((0, 520), (T_DOG, 540)), Keys((0, 1.0), (T_DOG, 1.15)))
        store(ctx, t, cam)
        with layer(ctx, cam, t):
            mannequins(ctx, t)
            D.rect(ctx, SPOT - 60, TM.FL - 10, 120, 16, hexrgb("#c9d0d6"), D.INK, 3, wob=0)
            DANNY.draw(ctx, SPOT, TM.FL, 112, 1, frozen_pose(0.0))
            draw_lab(ctx, SPOT + 520, TM.FL + 20, 100, -1, dog_pose(0.0, "sit", wag=0.0))
        pop_text(ctx, "FREEZE.", W / 2, 200, t, 0.3, 110, "#9fd8ec", dur=T_DOG, shake=False)
        return
    tt = t - T_DOG
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2f6fd0"), (1, "#1c3f7c")])
    ctx.save()
    ctx.translate(W / 2 + 120, H / 2 + 520)
    ctx.scale(1.0, 1.0)
    draw_lab(ctx, 0, 0, 560, -1, dog_pose(0.0, "sit", wag=0.0))
    ctx.restore()
    pop_text(ctx, "0 BLINKS", 420, 260, tt, 0.3, 100, "#ffe36a", dur=3, shake=False)


def shot_past(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    cam = Cam(SPOT + 60, 470, 1.35)
    store(ctx, t, cam)
    with layer(ctx, cam, t):
        mannequins(ctx, t)
        DANNY.draw(ctx, SPOT, TM.FL, 112, 1, frozen_pose(0.0))
        for i in range(3):
            x = -200 + t * 330 - i * 380 + SPOT - 800
            y = TM.FL + 130 + i * 30
            p = R.gait(t * 1.4 + i * 0.4, "shamble", "side", i)
            sniff = i == 0 and abs(x - SPOT) < 300
            p.update(a1=(1.0, -0.1), a2=(0.9, 0.0), mouth=0.4, neck=-0.3 if sniff else 0.2, hturn=-0.4 if sniff else 1)
            R.Fig(R.zombie_look(610 + i, ["business", "traveler", "attendant"][i])).draw(ctx, x, y, 125, 1, p)
    pop_text(ctx, "sniff...", W / 2 + 120, 320, t, d * 0.35, 70, "#9fc86a", dur=1.6, shake=False)


def shot_rule(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    z = 1 + 0.02 * t
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.scale(z, z)
    ctx.translate(-W / 2, -H / 2)
    rule_card(ctx, t, 2, ["They don't see", "what doesn't move."], 0.1, W / 2 - 120)
    draw_lab(ctx, W - 300, H - 60, 190, -1, dog_pose(t, "sit", wag=0.0 if t < 3 else 1.0))
    ctx.restore()


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_shop),
        Shot(c(1) - 0.1, shot_nowhere),
        Shot(c(2) - 0.1, shot_freeze, "whip", 0.25),
        Shot(c(3) - 0.1, shot_past),
        Shot(c(4) - 0.1, shot_rule, "fade", 0.3),
    ]
    S.sfx += [(c(1) * 0.6, "sting", 0.8), (c(2), "heartbeat", 0.8), (c(3) + 0.8, "zombie_groan", 0.6),
              (c(4) + 0.6, "pencil", 0.8)]
    S.music = [(0, "fun", 0.8), (c(1) * 0.6, "tension", 1.0), (c(4), "mystery", 0.6)]
