"""День 17: надпись на крыше «ALIVE · 1 PERSON + 1 DOG». Ночью дождь, к утру — серое пятно."""
from scenes.kit import *

LETTERS = ["ALIVE", "1 PERSON + 1 DOG"]


def roof_bg(tod):
    def fn(c):
        C.sky(c, -1200, -1400, 4400, 2400, tod, sun=(1600, 200, 60) if tod == "day" else None,
              moon=None)
        C.skyline(c, -1200, 3200, 720, tod, depth=0, seed=171, esb_x=1300, hmin=220, hmax=520)
        CITY.roof(c, -1200, 3200, 860, tod)
    return lambda ctx: bg(ctx, "roof17_" + tod, (-1200, -1400, 4400, 2800), fn)


def shot_paint(ctx, t, S):
    """Герой катит валик, банки краски выстроены в ряд."""
    w = Walk(Keys((0, 500), (5, 1100, "lin")), 980, 100, "push", t1=7, face=1)
    cam = Cam(lambda t: w.x(t) + 100, 620, 1.2)
    with layer(ctx, cam, t):
        roof_bg("day")(ctx)
        D.rect(ctx, 300, 960, w.x(t) - 200, 30, hexrgb("#f6f4ee"), None, 0, wob=0.5)
        for k in range(8):
            D.rect(ctx, 200 + k * 70, 930, 56, 60, hexrgb("#f4f1ea"), D.INK, 2.5, wob=0)
            D.rect(ctx, 200 + k * 70, 942, 56, 12, hexrgb("#3f8a84"), None, 0, wob=0)
        J = w.draw(ctx, HERO, t, {"h1": (0.7, -1.2), "h2": (0.6, -1.15), "face": "determined"})
        D.line(ctx, w.x(t) + 60, 880, w.x(t) + 150, 975, D.INK, 6)
        D.rect(ctx, w.x(t) + 120, 965, 80, 26, hexrgb("#f6f4ee"), D.INK, 3, wob=0)
    fx.grade(ctx, "warm", 0.15)


def roof_top(ctx, t, letters_k=1.0, smear=0.0, tod="day", rain=0.0):
    """Крыша сверху: гравий, вентблоки, буквы."""
    base = hexrgb("#9a968c") if tod != "night" else hexrgb("#5a5868")
    D.rect(ctx, -400, -300, 2800, 1700, base, None, 0, wob=0)
    r = rng(5)
    for k in range(500):
        D.circle(ctx, r.uniform(-400, 2400), r.uniform(-300, 1400), r.uniform(2, 5), shade(base, -0.1), None, 0)
    for (x, y) in ((150, 150), (1650, 820)):
        D.rect(ctx, x, y, 220, 160, hexrgb("#b5b3ac"), D.INK, 4)
        D.circle(ctx, x + 110, y + 80, 50, hexrgb("#9a988f"), D.INK, 3)
    D.rect(ctx, 1500, 80, 300, 260, hexrgb("#c8b9a0"), D.INK, 4)
    D.rect(ctx, -400, -300, 2800, 60, hexrgb("#a8a398"), D.INK, 4, wob=0)
    D.rect(ctx, -400, 1340, 2800, 60, hexrgb("#a8a398"), D.INK, 4, wob=0)
    for i, line in enumerate(LETTERS):
        k = clamp(letters_k * 2 - i)
        n = int(len(line) * k)
        if n <= 0:
            continue
        s = line[:n]
        c = mix(hexrgb("#f8f6f0"), shade(base, 0.12), smear * 0.7)
        D.text(ctx, s, 960, 620 + i * 300, 260 if i == 0 else 150, D.FONT_TITLE, c, alpha=1 - 0.35 * smear)
        if smear > 0:
            for j in range(3):
                D.text(ctx, s, 960 + (j - 1) * 14, 640 + i * 300 + j * 10, 260 if i == 0 else 150, D.FONT_TITLE, c,
                       alpha=0.25 * smear)
    if rain:
        fx.rain(ctx, t, rain, 0.1, alpha=0.5)


def shot_top(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    cam = Cam(960, 600, Keys((0, 1.3), (d, 0.85)))
    with layer(ctx, cam, t):
        roof_top(ctx, t, clamp(t / (d - 0.5)))
        x = 960 + math.sin(t * 2) * 500
        D.circle(ctx, x, 300 + t * 60, 40, hexrgb("#f4efe4"), D.INK, 3)
        D.circle(ctx, x, 300 + t * 60, 46, None, hexrgb("#e2a33b"), 8)
    fx.grade(ctx, "warm", 0.12)


def shot_tired(ctx, t, S):
    """Закат, руки дрожат от усталости."""
    cam = Cam(960, 600, Keys((0, 1.5), (3, 1.7)))
    with layer(ctx, cam, t):
        roof_bg("golden")(ctx)
        p = R.stand("front", t, 1)
        sh = math.sin(t * 40) * 0.05
        p.update(lean=0.15, a1=(0.15 + sh, 0.2 + sh), a2=(0.15 - sh, 0.2 - sh), face="sad", neck=0.3,
                 mouth=0.4 + 0.3 * math.sin(t * 6))
        HERO.draw(ctx, 960, 990, 110, 1, p)
    fx.grade(ctx, "golden", 0.4)


def shot_rain(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    cam = Cam(960, 600, 0.9)
    night = t < d * 0.5
    with layer(ctx, cam, t):
        roof_top(ctx, t, 1.0, smear=clamp((t - d * 0.15) / (d * 0.5)), tod="night" if night else "day",
                 rain=1.2 if night else 0.0)
    if night:
        fx.grade(ctx, "night", 0.6)
        fx.lightning(ctx, 1.0 if 0.5 < t < 0.6 else 0.0)
    else:
        fx.grade(ctx, "overcast", 0.4)


def shot_heli(ctx, t, S):
    """Далеко над Гудзоном вертолёты: слишком далеко, слишком быстро."""
    from scenes.d12 import heli_far
    cam = Cam(Keys((0, 900), (6, 980)), 540, 0.8)
    with layer(ctx, cam, t, 0.3):
        bg(ctx, "hudson_sky", (-1500, -1200, 5000, 2600), lambda c: (
            C.sky(c, -1500, -1200, 5000, 2600, "overcast"),
            C.skyline(c, -1500, 3500, 640, "overcast", depth=0, seed=177, hmin=60, hmax=180)))
    with layer(ctx, cam, t):
        bg(ctx, "roof17_overcast", (-1200, -1400, 4400, 2800), lambda c: CITY.roof(c, -1200, 3200, 860, "overcast"))
        p = R.stand("front", t, 2)
        wave = math.sin(t * 10)
        p.update(a1=(2.7 + 0.25 * wave, 0.2), a2=(2.7 - 0.25 * wave, 0.2), face="scream" if t < 3.5 else "sad",
                 neck=-0.25, hturn=-0.4)
        if t > 3.8:
            p.update(a1=(0.1, 0.1), a2=(0.1, 0.1), face="sad", neck=0.2)
        HERO.draw(ctx, 1240, 920, 70, 1, p)
    for k in range(2):
        hx = lerp(-200 + k * 300, 900 + k * 300, t / 6)
        heli_far(ctx, hx, 260 + k * 40, 0.22, t + k, light=False)
    fx.grade(ctx, "overcast", 0.3)
    D.text(ctx, "TOO FAR", 1500, 300, 80, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
           alpha=clamp((t - 1.0) / 0.3))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_paint),
        Shot(c(1) - 0.1, shot_top),
        Shot(c(2) - 0.1, shot_tired),
        Shot(c(3) - 0.1, shot_rain, "black", 0.4),
        Shot(c(4) - 0.1, shot_heli),
    ]
    S.tods = [(0, "day"), (c(2), "golden"), (c(3), "night"), (c(3) + 2.5, "overcast")]
