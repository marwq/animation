"""День 11: рассвет, переход через перрон к ангару №9. Под пыльным чехлом — маленький белый самолёт с
красной полосой: четыре места, один пропеллер, на носу имя: Рози. Аккумулятор сел, бак пуст.
Две проблемы. Девятнадцать дней."""
from scenes.kit import *
from scenes.shared import *

ROSIE_X = 900


def hangar_bg(ctx, t, cam, tod="dawn", power=0.0, open_k=0.0):
    room_back(ctx, t, cam, "hangar_%s_%s" % (tod, power),
              lambda c: RM.hangar(c, tod, power, outside=lambda cc: (AP.sky(cc, 0, tod, 1800, 4000, hz=600),
                                                                   AP.field(cc, tod, 1.0, 1800, 4000))),
              (-1400, -1500, 6000, 3300), 0.6)
    with layer(ctx, cam, t):
        AP.hangar_inside_door(ctx, (RM.HANGAR_DOOR[0] + RM.HANGAR_DOOR[1]) / 2,
                              RM.HANGAR_DOOR[1] - RM.HANGAR_DOOR[0], -300, RM.FL + 40, open_k, tod)


def shot_cross(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, 4300), (d, 5600)), 560, 0.6)
    apron_back(ctx, t, cam, "dawn", 1.0, sun=(5400, 500, 80), x0=2400, x1=8200)
    with layer(ctx, cam, t):
        w = Walk(Keys((0, 3700), (d + 0.3, 5900, "lin")), AP.GY + 80, 110, "sneak", t1=d + 2)
        w.draw(ctx, DANNY_JACKET, t, {"face": "worried"})
        draw_lab(ctx, w.x(t) - 230, AP.GY + 80, 100, 1, dog_pose(t, "trot", phase=t * 2.2))
        r = rng(11)
        for i in range(6):
            x = r.uniform(3000, 7600)
            y = AP.GY + r.uniform(-60, 40)
            R.Fig(R.zombie_look(1100 + i)).draw(ctx, x, y, floor_s(y, AP.GY, 110), 1 if i % 2 else -1,
                                                zombie_idle(t, i))
    D.rrect(ctx, W - 470, 110, 380, 120, 24, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, "→ HANGAR 9", W - 280, 196, 64, D.FONT_TITLE, hexrgb("#ffd23a"))


def shot_reveal(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    T_PULL, T_TAGS, T_NOSE = 1.0, d * 0.4, d * 0.72
    if t < T_NOSE:
        cam = Cam(Keys((0, 900), (T_TAGS, 1000)), Keys((0, 560), (T_TAGS, 520)), Keys((0, 0.95), (T_TAGS, 0.85)))
        hangar_bg(ctx, t, cam, "dawn", 0.0)
        with layer(ctx, cam, t):
            cover = 1 - smooth(clamp((t - T_PULL) / 0.6))
            PL.rosie(ctx, ROSIE_X, RM.FL + 40, 1.1, 1, "day", cover=cover, dirt=0.6)
            p = R.stand("side", t, 1)
            pull = clamp((t - T_PULL + 0.3) / 0.3)
            p.update(face="shock" if cover < 0.5 else "determined", h1=(0.8 - 0.6 * pull, -2.4), h2=(0.7 - 0.6 * pull,
                     -2.3), lean=-0.2 * pull, blink=0)
            DANNY_JACKET.draw(ctx, 1700, RM.FL + 60, 115, -1, p)
            draw_lab(ctx, 1950, RM.FL + 60, 100, -1, dog_pose(t, "sit", wag=1.0 if cover < 0.5 else 0))
            if T_PULL < t < T_PULL + 1.5:
                k = (t - T_PULL) / 1.5
                r = rng(4)
                for i in range(18):
                    D.circle(ctx, ROSIE_X + r.uniform(-500, 500) + k * 200, RM.FL - 200 - r.uniform(0, 300) - k * 100,
                             20 + 40 * k, hexrgb("#c9c0b0"), None, 0, alpha=0.5 * (1 - k))
        for i in range(5):
            fx.glow(ctx, 400 + i * 300, 200, 160, "#fff3c8", 0.15)
        tags = [("4 SEATS", "#fff6d8"), ("1 PROPELLER", "#ffe36a")]
        for i, (txt, c) in enumerate(tags):
            pop_text(ctx, txt, 420 + i * 520, 230, t, T_TAGS + i * 0.6, 80, c, dur=d, shake=False)
        return
    tt = t - T_NOSE
    cam = Cam(ROSIE_X + 1.1 * 330, RM.FL + 40 - 1.1 * 140, Keys((0, 2.2), (2, 2.6)))
    hangar_bg(ctx, tt, cam, "dawn", 0.0)
    with layer(ctx, cam, tt):
        PL.rosie(ctx, ROSIE_X, RM.FL + 40, 1.1, 1, "day", dirt=0.4)
    fx.glow(ctx, W / 2, H / 2, 300, "#fff3c8", 0.3)
    pop_text(ctx, "ROSIE.", W / 2, 230, tt, 0.4, 140, "#e8423c", dur=4, shake=False)


def shot_dead(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2b2f3a"), (1, "#15181f")])
    RM.rosie_panel(ctx, W / 2, H / 2 + 60, 1.25, t, 0.0, rpm=0.0, fuel=0.0)
    for i, txt in enumerate(("BATTERY: DEAD", "FUEL: 0")):
        pop_text(ctx, txt, 520 + i * 880, 180, t, 0.2 + i * d * 0.4, 80, "#ff4a3a", dur=d, shake=False)
    if (t * 2) % 1 < 0.5:
        D.rect(ctx, W / 2 + 1.25 * 420, H / 2 + 60 + 1.25 * -110, 1.25 * 120, 1.25 * 40, hexrgb("#ff4a3a"), None, 0,
               wob=0, alpha=0.7)


def shot_problems(ctx, t, S):
    d = S.dur - S.cue(3)
    cam = Cam(Keys((0, 1200), (d, 1150)), 520, Keys((0, 0.8), (d, 0.9)))
    hangar_bg(ctx, t, cam, "day", 0.0)
    with layer(ctx, cam, t):
        PL.rosie(ctx, ROSIE_X, RM.FL + 40, 1.1, 1, "day", dirt=0.4)
        p = R.stand("side", t, 1)
        p.update(face="determined", hturn=-0.8, h1=(0.3, -1.6))
        DANNY_JACKET.draw(ctx, 1750, RM.FL + 60, 115, -1, p)
        draw_lab(ctx, 2000, RM.FL + 60, 100, -1, dog_pose(t, "sit"))
    k = ease_out_back(clamp((t - 0.2) / 0.35))
    if k > 0:
        ctx.save()
        ctx.translate(W / 2, 220)
        ctx.scale(k, k)
        D.rrect(ctx, -520, -90, 1040, 180, 30, hexrgb("#0e1410"), D.INK, 6)
        D.text(ctx, "2 PROBLEMS · 19 DAYS", 0, 30, 76, D.FONT_TITLE, hexrgb("#ffe36a"))
        ctx.restore()


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_cross, "fade", 0.3),
        Shot(c(1) - 0.1, shot_reveal, "fade", 0.3),
        Shot(c(2) - 0.1, shot_dead, "whip", 0.25),
        Shot(c(3) - 0.1, shot_problems),
    ]
    S.tods = [(0, "dawn"), (c(2), "day")]
    S.sfx += [(c(1) + 1.0, "cloth", 0.9), (c(1) + 1.6, "shimmer", 0.9), (c(2) + 0.2, "click", 0.9),
              (c(2) + 0.8, "click", 0.9)]
    S.music = [(0, "sneak", 0.8), (c(1) + 1.4, "wonder", 1.0)]
