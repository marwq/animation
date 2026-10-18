"""День 25 (ночь): план с Гасом. В полночь 30-го начинается салют, и все зомби посмотрят вверх. Ветер в ту ночь — на
запад, через озеро, к маяку. Четыре мили, полчаса в воздухе. «А если ветер переменится?» — «Тогда плыви, малыш»."""
from scenes.kit import *
from scenes.shared import *


def shot_plan(ctx, t, S):
    """Разрезанный экран: Тео над картой в башне — Гас на маяке."""
    d = S.cue(1) - 0.1
    camL = Cam(IN.TOWER_CRATE_X + 720, 520, 1.1)
    camR = Cam(IN.GUS_RADIO_X - 820, 520, Keys((0, 1.0), (d, 1.06)))
    k = smooth(clamp((t - 0.2) / 0.5))
    diag_split(ctx, lambda c: theo_radio(c, t, camL, 0.0, "neutral", "night", fig=THEO_FUR_PATCH),
               lambda c: gus_radio(c, t, camR, 1.0, "neutral", "night"), k)
    place_tag(ctx, "THE PLAN", t, 70, 210, "#fff6d8", "#2f6fd0")


def shot_lookup(ctx, t, S):
    """Полночь 30-го: салют — и десять тысяч голов задираются вверх."""
    d = S.cue(2) - S.cue(1)
    up = smooth(clamp((t - 0.8) / 0.8))
    D.vgrad(ctx, 0, 0, W, H, [(0, "#060a1a"), (1, "#1a1a3a")])
    LK.show(ctx, t + 2.0, 100, W - 100, 80, 700, 1.0, seed=25, period=1.3)
    heads_sea(ctx, t, -100, W + 100, 520, 1180, 60, seed=25, s0=50, s1=150, up=up, arms=0.0, glow=0.3)
    D.radial(ctx, W / 2, 200, 1100, "#ffd23a", 0.12 * (0.5 + 0.5 * math.sin(t * 7)), 0)
    clock_badge(ctx, "12:00", t, W - 260, 150, "#ff3a2a")
    if t > 0.9:
        pop_text(ctx, "EVERYONE LOOKS UP", W / 2, 230, t, 0.9, 80, "#fff6d8", dur=d, shake=False)


def compass(ctx, x, y, r, rot):
    """Роза ветров; rot — поворот карты (здесь север внизу: карта нарисована от парка к маяку)."""
    ctx.save()
    ctx.translate(x, y)
    D.circle(ctx, 0, 0, r, hexrgb("#fbf3dc"), D.INK, 4)
    for k, lab in enumerate("NESW"):
        a = rot + k * math.pi / 2 - math.pi / 2
        D.poly(ctx, [(math.cos(a) * r * 0.9, math.sin(a) * r * 0.9), (math.cos(a + 1.3) * r * 0.2,
                                                                        math.sin(a + 1.3) * r * 0.2),
                     (math.cos(a - 1.3) * r * 0.2, math.sin(a - 1.3) * r * 0.2)],
               hexrgb("#e8423c" if lab == "W" else "#2b2f3a"), D.INK, 2, wob=0)
        D.text(ctx, lab, math.cos(a) * r * 1.35, math.sin(a) * r * 1.35 + r * 0.18, r * 0.5, D.FONT_TITLE,
               hexrgb("#e8423c" if lab == "W" else "#fbf3dc"), stroke=D.INK, slw=4)
    ctx.restore()


def shot_route(ctx, t, S):
    """Карта: ветер на запад — от замка через озеро к маяку; шар ползёт по пунктиру. 4 мили, 30 минут."""
    d = S.cue(3) - S.cue(2)
    D.rect(ctx, 0, 0, W, H, hexrgb("#0e1430"), None, 0, wob=0)
    s = 0.23
    cx, cy = 760, H / 2 + 20
    LK.island_map(ctx, cx, cy, s, "dusk", t, labels=False, sky_ride=False)
    x0, y0 = cx + LK.MAP["castle"][0] * s, cy + LK.MAP["castle"][1] * s
    x1, y1 = cx + LK.MAP["lighthouse"][0] * s, cy + LK.MAP["lighthouse"][1] * s
    # ветер: бегущие стрелки в сторону маяка
    for j in range(10):
        ph = (t * 0.4 + j / 10) % 1
        ax = lerp(x0 - 300, x1 + 100, ph)
        ay = y0 - 260 + (j % 4) * 170 + 20 * math.sin(ph * 6)
        D.curve(ctx, [(ax - 60, ay), (ax, ay - 12), (ax + 60, ay)], hexrgb("#c9e8ff"), 6, 1 - abs(ph - 0.5) * 2)
    k = smooth(clamp((t - 0.6) / (d * 0.6)))
    pts = [(lerp(x0, x1, u), lerp(y0, y1, u) - math.sin(u * math.pi) * 120) for u in [j / 40 for j in range(41)]]
    n = int(k * 40)
    for j in range(0, n, 2):
        D.line(ctx, *pts[j], *pts[j + 1], hexrgb("#ffd23a"), 8)
    bx, by = pts[max(0, n)]
    BL.envelope(ctx, bx, by - 20, 0.05, 1.0, "night", t=t)
    D.circle(ctx, x1, y1, 26, None, hexrgb("#ffd23a"), 6)
    compass(ctx, W - 230, H - 250, 80, math.pi)
    if t > 0.4:
        pop_text(ctx, "WIND: WEST", 380, 200, t, 0.4, 80, "#c9e8ff", dur=d, shake=False)
    if t > d * 0.5:
        counter_badge(ctx, "4 MILES ·", "30 MIN", W - 370, 160, "#ffd23a", 580)


def shot_swim(ctx, t, S):
    """«А если ветер переменится?» — Гас ухмыляется: «Тогда плыви, малыш»."""
    d = S.dur - S.cue(3)
    L = S.cue(3, True) - S.cue(3)
    T_GUS = L * 0.45
    if t < T_GUS:
        cam = Cam(IN.TOWER_CRATE_X + 600, 520, Keys((0, 1.15), (T_GUS, 1.2)))
        theo_radio(ctx, t, cam, 1.0, "worried", "night", fig=THEO_FUR_PATCH)
        speech(ctx, 1300, 230, "AND IF THE WIND CHANGES?", t, 0.1, 58, tail=(-1, 1))
        return
    cam = Cam(IN.GUS_RADIO_X - 700, 460, Keys((0, 1.25), (d - T_GUS, 1.4)))
    gus_radio(ctx, t, cam, 1.0 if t < L + 0.3 else 0.0, "laugh" if t > L else "smile", "night")
    speech(ctx, 1380, 220, "THEN YOU SWIM, KID.", t, T_GUS + 0.1, 64, tail=(-1, 1))
    if t > L + 0.4:
        pop_text(ctx, "HA!", W / 2 + 420, 520, t, L + 0.4, 100, "#ffd23a", dur=1.2)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_plan, "fade", 0.4),
        Shot(c(1) - 0.1, shot_lookup, "fade", 0.3),
        Shot(c(2) - 0.1, shot_route, "fade", 0.3),
        Shot(c(3) - 0.1, shot_swim, "fade", 0.25),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(0.2, "radio_beep", 0.7), (c(1) + 0.2, "firework", 0.8), (c(1) + 1.2, "firework", 0.6),
              (c(1) + 0.9, "crowd_groan", 0.5), (c(2) + 0.3, "wind", 0.7), (c(3) + 0.2, "radio_beep", 0.5)]
    S.music = [(0, "mystery", 0.7), (c(1), "wonder", 0.9), (c(2), "hope", 0.8), (c(3), "warm", 0.7)]
