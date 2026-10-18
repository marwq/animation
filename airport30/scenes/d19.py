"""День 19: тренажёр — боковой ветер, низкая облачность, ночь. Уолт молчит. Касание — мягко, по осевой.
Первая посадка, которую пережил бы пассажир. «Вот это посадка, сынок» — и слышно, как он сморкается.
«Роджер дэт», — говорит попугай."""
from scenes.kit import *
from scenes.shared import *


def night_view(c, t, k, wobble=1.0):
    """За стеклом тренажёра: ночная полоса с огнями, приближается; k 0..1 — до касания."""
    SEA.sky(c, -2400, -1600, 4800, 1600, "night")
    SEA.stars(c, -2400, -1600, 4800, 1500, t, 5, 0.6)
    c.save()
    c.translate(0, -170)
    c.rotate(0.12 * math.sin(t * 2.4) * wobble * (1 - k))
    c.translate(60 * math.sin(t * 1.7) * wobble * (1 - k), 0)
    D.rect(c, -2400, 0, 4800, 1600, tone("#28402c", "night"), None, 0, wob=0)
    w = 160 + 1400 * k ** 1.5
    D.poly(c, [(-w * 0.1, 0), (w * 0.1, 0), (w, 900), (-w, 900)], tone("#3a414c", "night"), None, 0, wob=0)
    for j in range(12):
        u = j / 12
        for side in (-1, 1):
            x = side * lerp(w * 0.1, w, u)
            D.circle(c, x, 900 * u, 6 + 16 * u, hexrgb("#ffe08a"), None, 0)
            D.radial(c, x, 900 * u, 30 + 50 * u, "#ffe08a", 0.6, 0)
    for j in range(6):
        u = ((j + t * 2 * k) % 6) / 6
        D.rect(c, -4 - 10 * u, 900 * u ** 1.5, 8 + 20 * u, 30 * u + 4, hexrgb("#f4f4f0"), None, 0, wob=0)
    c.restore()
    # облачность — клочья
    r = rng(19)
    for j in range(6):
        x = r.uniform(-1200, 1200) - ((t * 400) % 2400) + 1200
        D.ellipse(c, x, r.uniform(-300, 100), 400, 80, hexrgb("#9aa4b8"), None, 0, alpha=0.4 * (1 - k))


def shot_storm(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(0, 120, 0.85, 0.05 * math.sin(t * 2), shake=0.2)
    cockpit_scene(ctx, t, cam, "night", 1.0, view=lambda c: night_view(c, t, 0.0))
    with layer(ctx, cam, t):
        RM.yoke(ctx, -620, 560, 0.85, 0.3 * math.sin(t * 2.2))
    for i, (txt, c) in enumerate((("CROSSWIND", "#9fd8ec"), ("LOW CLOUDS", "#cfd8e0"), ("NIGHT", "#ffe36a"))):
        pop_text(ctx, txt, 400 + i * 560, 230, t, 0.4 + i * 0.6, 70, c, dur=d, shake=False)


def shot_silent(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    cam = Cam(OS.RADIO_X - 240, 520, Keys((0, 1.6), (d, 2.0)))
    walt_radio(ctx, t, cam, 0.0, "worried")
    D.rrect(ctx, W - 470, 110, 380, 130, 24, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, "...", W - 280, 200, 100, D.FONT_TITLE, hexrgb("#cfd8e0"))


def shot_touch(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    T_TD = d * 0.45
    k = smooth(clamp(t / T_TD))
    cam = Cam(0, 120, 0.85, shake=lambda q: shake_k(q, T_TD, 0.3, 0.5))
    cockpit_scene(ctx, t, cam, "night", 1.0, view=lambda c: night_view(c, t, k, 0.5))
    with layer(ctx, cam, t):
        RM.yoke(ctx, -620, 560, 0.85, 0.05 * math.sin(t * 2))
    if t > T_TD:
        pop_text(ctx, "TOUCHDOWN.", W / 2, 230, t, T_TD, 120, "#4cff8a", dur=d, shake=False)
        D.rrect(ctx, W / 2 - 300, 760, 600, 110, 24, hexrgb("#0e1410"), D.INK, 6)
        D.text(ctx, "CENTERLINE  OK", W / 2, 836, 52, D.FONT_TITLE,
               hexrgb("#4cff8a"))


def shot_blow(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    T_BLOW = d * 0.6
    camL = Cam(0, 300, 0.95)
    camR = Cam(OS.RADIO_X - 120, 560, 1.25)
    diag_split(ctx, lambda c: danny_radio(c, t, camL, 0.0, "laugh", DANNY_JACKET),
               lambda c: walt_radio(c, t, camR, 1.0 if t < T_BLOW else 0.0, "cry" if t > T_BLOW else "smile"), 1.0)
    speech(ctx, 1380, 200, "THAT'S A LANDING, SON.", t, 0.2, 52, tail=(-1, 1), dur=T_BLOW)
    if t > T_BLOW:
        pop_text(ctx, "HOOONK", 1400, 330, t, T_BLOW, 100, "#fff6d8", dur=1.5)


def shot_roger(ctx, t, S):
    cam = Cam(OS.PERCH_X - 20, 520, 3.0)
    walt_radio(ctx, t, cam, 0.0, "neutral", parrot_talk=1.0)
    speech(ctx, W / 2 - 280, 260, "ROGER THAT!", t, 0.2, 90, c="#3fae4a", tail=(1, 1))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_storm, "fade", 0.3),
        Shot(c(1) - 0.1, shot_silent, "fade", 0.25),
        Shot(c(2) - 0.1, shot_touch, "fade", 0.25),
        Shot(c(3) - 0.1, shot_blow),
        Shot(c(4) - 0.1, shot_roger),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(0.2, "wind", 0.8), (c(2) + (c(3) - c(2)) * 0.45, "thud", 0.6),
              (c(3) + (c(4) - c(3)) * 0.6, "nose_blow", 0.9), (c(4) + 0.2, "parrot", 1.0)]
    S.music = [(0, "tension", 0.8), (c(2) + (c(3) - c(2)) * 0.45, "hope", 1.0)]
