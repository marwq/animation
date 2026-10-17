"""День 10: в башне напротив мигает окно. «HI» — «HI. I'M ROSA». Смех — и сорок голов внизу."""
from scenes.kit import *
from scenes.shared import window_view, binocular, rosa_window_close, sign_card, window_frame


def blink_light(t):
    return 1.0 if int(t * 2.2) % 2 == 0 else 0.0


def shot_blink(ctx, t, S):
    """Из окна ТЦ: башня напротив в сумерках, одно окно мигает. Наезд."""
    cam = Cam(Keys((0, 960), (4, 1000)), Keys((0, 600), (4, 420)), Keys((0, 0.75), (4, 1.25)))
    window_view(ctx, t, cam, "dusk", rosa_light=blink_light(t))
    fx.grade(ctx, "dusk", 0.3)
    # силуэт героя со спины
    p = R.stand("back", t, 2)
    HERO.draw(ctx, 520, H + 330, 240, 1, p)


def shot_bino1(ctx, t, S):
    def scene(c):
        rosa_window_close(c, t, "dusk", pose_fn=lambda t: _rosa_wave(t), light=0.5, flash=blink_light(t))
    binocular(ctx, scene, t)


def _rosa_wave(t):
    p = R.stand("front", t, 4)
    p.update(a2=(2.6 + 0.3 * math.sin(t * 8), 0.3), face="happy")
    return p


def shot_write(ctx, t, S):
    """Маркер выводит HI на огромном плакате."""
    D.col(ctx, hexrgb("#d9cdb5"))
    ctx.paint()
    D.rect(ctx, 260, 140, 1400, 800, hexrgb("#f6f1e6"), D.INK, 5, wob=1.0)
    k = clamp((t - 0.3) / 1.4)
    # H
    ctx.set_line_width(70)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    D.col(ctx, hexrgb("#1c1820"))
    strokes = [((640, 300), (640, 780)), ((1000, 300), (1000, 780)), ((640, 540), (1000, 540)), ((1270, 300), (1270, 780))]
    pen = None
    for i, (a, b) in enumerate(strokes):
        kk = clamp(k * 4 - i)
        if kk <= 0:
            break
        ctx.move_to(*a)
        ctx.line_to(lerp(a[0], b[0], kk), lerp(a[1], b[1], kk))
        ctx.stroke()
        pen = (lerp(a[0], b[0], kk), lerp(a[1], b[1], kk))
    if pen and k < 1:
        D.line(ctx, pen[0] + 30, pen[1] + 30, pen[0] + 420, pen[1] + 600, D.INK, 34)
        D.rect(ctx, pen[0] - 20, pen[1] - 20, 60, 60, hexrgb("#1c1820"), D.INK, 3, wob=0)
    fx.grade(ctx, "dusk", 0.25)


def shot_hold(ctx, t, S):
    """Герой прижимает плакат к стеклу (вид с улицы)."""
    cam = Cam(960, 560, Keys((0, 1.0), (3, 1.1)))
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#5a5470"))
        ctx.paint()
        D.rect(ctx, 260, 120, 1400, 900, hexrgb("#3a3a50"), D.INK, 6, wob=0)
        fx.glow(ctx, 960, 560, 700, "#f2d08a", 0.25)
        p = R.stand("front", t, 2)
        p.update(h1=(-0.9, -3.0), h2=(0.9, -3.0), face="happy")
        HERO.draw(ctx, 960, 1180, 170, 1, p)
        sign_card(ctx, 960, 560, "HI", 1.0, w=700, h=420, rot=0.02, color="#f6f1e6")
        window_frame_local(ctx)
    fx.grade(ctx, "dusk", 0.3)


def window_frame_local(ctx):
    D.rect(ctx, 260, 120, 1400, 900, None, hexrgb("#5d5a58"), 30, wob=0)
    D.rect(ctx, 260, 120, 1400, 900, None, D.INK, 4, wob=0)
    D.col(ctx, "#cfe0e8", 0.1)
    ctx.rectangle(260, 120, 1400, 900)
    ctx.fill()


def shot_bino2(ctx, t, S):
    def scene(c):
        rosa_window_close(c, t, "dusk", sign=["HI.", "I'M ROSA :)"], sign_k=clamp((t - 0.3) / 0.3),
                          pose_fn=lambda t: _rosa_hold(t), light=0.8)
    binocular(ctx, scene, t)


def _rosa_hold(t):
    p = R.stand("front", t, 4)
    p.update(h1=(-0.8, -2.9), h2=(0.8, -2.9), face="happy")
    return p


def shot_laugh(ctx, t, S):
    cam = Cam(960, 520, Keys((0, 1.0), (3, 1.1)), shake=lambda t: 0.15)
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#3a3a50"))
        ctx.paint()
        fx.glow(ctx, 960, 500, 800, "#f2b07a", 0.25)
        bob = math.sin(t * 18) * 0.03
        p = {"view": "front", "face": "laugh", "hturn": 0.0, "neck_line": True, "hang": bob}
        HERO.head_only(ctx, 960, 470 + math.sin(t * 18) * 8, 360, 1, p)
        draw_dog(ctx, 1450, 1080 - abs(math.sin(t * 6)) * 120, 160, -1, dog_pose(t, "jump", jump=0.5, bark=0.0))
    fx.grade(ctx, "dusk", 0.25)
    for k in range(3):
        ph = (t * 1.5 + k / 3) % 1
        D.text(ctx, "HA", 600 + k * 180, 300 - ph * 120, 80, D.FONT_HAND, hexrgb("#f7eedb"), stroke=D.INK, slw=8,
               alpha=1 - ph, rot=-0.2 + k * 0.2)


def heads_up(m, t):
    p = zombie_idle(t, m.seed % 97, "side")
    k = smooth((t - 0.4 - (m.x % 80) / 400) / 0.15)
    if k > 0.5:
        p = dict(p)
        p.update(view="front", hturn=0.0, neck=-0.35, look=(0, -1), mouth=0.8)
    return p


CROWD = None


def shot_heads(ctx, t, S):
    """Камера падает вниз к улице: сорок голов поворачиваются вверх."""
    global CROWD
    if CROWD is None:
        CROWD = make_crowd(1001, 40, 300, 1700, 1440, 1560, 42, 52)
    cam = Cam(960, Keys((0, 700), (0.8, 1250, "io")), Keys((0, 0.7), (0.8, 1.15, "io")))
    window_view(ctx, t, cam, "dusk", 0.8, CROWD, heads_up, frame=False)
    fx.grade(ctx, "dusk", 0.3)


def shot_stop(ctx, t, S):
    """Смех обрывается: рука ко рту."""
    cam = Cam(960, 520, Keys((0, 1.15), (2, 1.25)))
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#3a3a50"))
        ctx.paint()
        fx.glow(ctx, 960, 500, 800, "#f2b07a", 0.2)
        p = R.stand("front", t, 1)
        p.update(face="scared", blink=0, h1=(0.05, -3.25), look=(0, 0.8))
        HERO.draw(ctx, 960, 1500, 330, 1, p)
    fx.grade(ctx, "dusk", 0.3)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_blink),
        Shot(c(1) - 0.2, shot_bino1),
        Shot(c(2) - 0.1, shot_write),
        Shot(c(2) + 2.0, shot_hold),
        Shot(c(3) + 1.2, shot_bino2),
        Shot(c(4) - 0.1, shot_laugh),
        Shot(c(5) - 0.1, shot_heads),
        Shot(c(5) + 1.9, shot_stop),
    ]
