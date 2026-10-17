"""Повторяющиеся планы: галерея, атриум, окно на дом Розы, бинокль, телефон."""
from scenes.kit import *
from sets import stores as ST

GF = M.GAL_FLOOR


def gs(y=GF + 40):
    """Масштаб в галерее (фигура стоит у витрин, чуть ближе к камере)."""
    return 92 * (y - 300) / (GF + 40 - 300)


def gallery_bg(key, tod="day", lights=1.0, gates=None, start=0, x0=-1400, x1=6400):
    g = tuple(sorted((gates or {}).items()))

    def fn(c):
        M.gallery(c, x0, x1, tod, lights, dict(g), start=start)
    return lambda ctx: bg(ctx, "gal_%s_%s_%.2f_%d_%s" % (key, tod, lights, start, hash(g)), (x0, -50, x1 - x0, 1250),
                          fn, scale=1.0)


def gallery_rail(ctx, x0=-1400, x1=6400, y=1130):
    """Ограждение балкона на переднем плане (для параллакса)."""
    C.railing(ctx, x0, x1, y, 150, glass_a=0.22)


def atrium_bg(tod="day", lights=1.0, gates=None):
    g = tuple(sorted((gates or {}).items()))
    return lambda ctx: bg(ctx, "atr_%s_%.2f_%s" % (tod, lights, hash(g)), (-300, -200, 2520, 2900),
                          lambda c: M.atrium(c, tod, lights, gates=dict(g)), scale=0.75)


def atrium_s(y):
    """Масштаб фигуры на полу этажа атриума (вид издалека)."""
    return 34.0


# --- окно на дом напротив ------------------------------------------------------------

def window_view(ctx, t, cam, tod="dusk", rosa_light=0.0, crowd=None, crowd_fn=None, frame=True, rain=0.0):
    """Вид из окна 3-го этажа ТЦ на 34-ю улицу и башню Розы. Возвращает экранные коорд. окна Розы."""
    with layer(ctx, cam, t, 0.3):
        bg(ctx, "wv_sky_" + tod, (-1500, -1500, 5000, 3000), lambda c: (C.sky(c, -1500, -1500, 5000, 3000, tod,
                                                                             moon=(400, -300, 40) if tod in ("night", "deepnight") else None)))
        bg(ctx, "wv_far_" + tod, (-1500, -400, 5000, 1000),
           lambda c: C.skyline(c, -1500, 3500, 520, tod, depth=0, seed=51, hmin=300, hmax=800, esb_x=-300))
    with layer(ctx, cam, t, 0.7):
        bg(ctx, "wv_mid_" + tod, (-1500, -400, 5000, 1300),
           lambda c: C.skyline(c, -1500, 3500, 860, tod, depth=1, seed=53, hmin=300, hmax=900))
    with layer(ctx, cam, t):
        def tower(c):
            CITY.rosa_tower(c, 700, 1400, 560, 26, tod, lit=0.0, rosa_light=0.0)
            C.building(c, 1360, 1400, 420, 1000, hexrgb("#7d6f86") if tod in ("dusk", "night") else hexrgb("#a99a8a"),
                       seed=61)
            C.building(c, 160, 1400, 460, 900, hexrgb("#86707e") if tod in ("dusk", "night") else hexrgb("#b0a090"),
                       seed=62)
            CITY.street(c, -800, 3000, 1400, tod, seed=33, depth_y=2400)
        bg(ctx, "wv_tower_" + tod, (-800, -400, 3800, 2900), tower)
        # окно Розы (20-й этаж) — повторяем расчёт координат
        flh = 44
        top = 1400 - (26 * flh + 60)
        f = 26 - 20
        wx = 700 + 26 + 3 * (560 - 40) / 6
        ww = (560 - 40) / 6 - 22
        rx, ry = wx + ww / 2, top + 30 + f * flh + (flh - 14) / 2
        if rosa_light > 0:
            D.rect(ctx, wx, top + 30 + f * flh, ww, flh - 14, mix(hexrgb("#3b3d5c"), hexrgb("#f7d98f"), rosa_light),
                   D.INK, 2, wob=0)
            fx.glow(ctx, rx, ry, 70, "#ffe2a0", 0.35 * rosa_light)
        if crowd:
            draw_crowd(ctx, crowd, t, crowd_fn)
    if rain:
        fx.rain(ctx, t, rain)
    if frame:
        window_frame(ctx)
    return cam.to_screen(t, rx, ry)


def window_frame(ctx, c="#5d5a58"):
    """Рама окна ТЦ поверх вида (экранные координаты)."""
    col = hexrgb(c)
    D.rect(ctx, -20, -20, W + 40, 90, col, D.INK, 4, wob=0)
    D.rect(ctx, -20, H - 120, W + 40, 160, shade(col, -0.1), D.INK, 4, wob=0)
    for x in (-10, W / 2 - 15, W - 20):
        D.rect(ctx, x, 0, 30, H, col, D.INK, 4, wob=0)
    D.col(ctx, "#a8c2cc", 0.12)
    ctx.rectangle(0, 70, W, H - 190)
    ctx.fill()


def binocular(ctx, draw_fn, t):
    """Вид в бинокль: две круглые маски."""
    ctx.save()
    ctx.push_group()
    draw_fn(ctx)
    pat = ctx.pop_group()
    D.col(ctx, hexrgb("#0c0b10"))
    ctx.paint()
    ctx.new_path()
    ctx.arc(W / 2 - 300, H / 2, 470, 0, TAU)
    ctx.new_sub_path()
    ctx.arc(W / 2 + 300, H / 2, 470, 0, TAU)
    ctx.clip()
    ctx.set_source(pat)
    ctx.paint()
    ctx.restore()
    ctx.save()
    g = cairo.RadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 800)
    g.add_color_stop_rgba(0, 0, 0, 0, 0)
    g.add_color_stop_rgba(1, 0, 0, 0, 0.6)
    ctx.set_source(g)
    ctx.paint()
    ctx.restore()


def rosa_window_close(ctx, t, tod="dusk", sign=None, sign_k=1.0, pose_fn=None, light=1.0, flash=0.0):
    """Окно Розы крупно: рама, комната, Роза с табличкой."""
    wall = hexrgb("#6f6680") if tod in ("dusk", "night", "deepnight") else hexrgb("#c9b59a")
    D.rect(ctx, -200, -200, 2400, 1500, wall, None, 0, wob=0)
    D.col(ctx, shade(wall, -0.1))
    ctx.set_line_width(3)
    for y in range(-200, 1400, 60):
        ctx.move_to(-200, y)
        ctx.line_to(2200, y)
    ctx.stroke()
    room = mix(hexrgb("#2a2838"), hexrgb("#f2cf8a"), light)
    D.rect(ctx, 460, 140, 1000, 760, room, D.INK, 6, wob=0)
    # торшер и шторы
    D.poly(ctx, [(460, 140), (600, 140), (570, 900), (460, 900)], hexrgb("#b6503f"), D.INK, 3)
    D.poly(ctx, [(1320, 140), (1460, 140), (1460, 900), (1350, 900)], hexrgb("#b6503f"), D.INK, 3)
    D.line(ctx, 960, 140, 960, 900, hexrgb("#e9e4d8"), 14)
    D.line(ctx, 960, 140, 960, 900, D.INK, 3)
    p = pose_fn(t) if pose_fn else R.stand("front", t, 4)
    ROSA.draw(ctx, 960, 1180, 150, 1, p)
    if sign:
        sign_card(ctx, 960, 760, sign, sign_k, w=700)
    if flash > 0:
        fx.glow(ctx, 1120, 560, 260, "#fff2c8", 0.7 * flash)
        D.circle(ctx, 1120, 560, 30, hexrgb("#fff8e0"), None, 0, alpha=flash)
    D.rect(ctx, 460, 140, 1000, 760, None, D.INK, 6, wob=0)
    D.col(ctx, "#cfe0e8", 0.12)
    ctx.rectangle(460, 140, 1000, 760)
    ctx.fill()
    D.rect(ctx, 430, 890, 1060, 40, shade(wall, -0.2), D.INK, 4, wob=0)


def sign_card(ctx, x, y, lines, k=1.0, w=620, h=None, rot=-0.03, color="#c9a678"):
    """Табличка-картон с надписью маркером (центр x, y)."""
    if k <= 0:
        return
    lines = lines if isinstance(lines, (list, tuple)) else [lines]
    h = h or 110 + len(lines) * 80
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    sc = ease_out_back(clamp(k))
    ctx.scale(sc, sc)
    D.rect(ctx, -w / 2, -h / 2, w, h, hexrgb(color), D.INK, 4, wob=1.2, seed=len(lines[0]))
    for i, l in enumerate(lines):
        size = 300 if len(l) <= 3 and len(lines) == 1 else 92 if len(l) < 12 else 68 if len(l) < 18 else 52
        yy = size * 0.35 if size > 200 else -h / 2 + 100 + i * 86
        D.text(ctx, l, 0, yy, size, D.FONT_HAND, hexrgb("#1c1820"))
    ctx.restore()


# --- телефон -----------------------------------------------------------------------

def hand_phone(ctx, t, draw_screen, screen=1.0, bars=0, battery=0.4, light="#ffffff"):
    """Крупный план телефона в руке на тёмном фоне."""
    D.col(ctx, hexrgb("#14121a"))
    ctx.paint()
    fx.glow(ctx, W / 2, H / 2, 900, "#9fb6e0", 0.18 * screen)
    # рука-палочка снизу
    D.line(ctx, W / 2 + 120, H + 60, W / 2 + 40, H / 2 + 330, D.INK, 46)
    ST.phone(ctx, W / 2, H / 2 + math.sin(t * 1.3) * 6, 1.05, screen, bars, battery, draw_screen)
    D.line(ctx, W / 2 - 245, H / 2 + 150, W / 2 - 190, H / 2 + 90, D.INK, 40)


def lines_progress(t, start, per=0.06):
    return int(max(0, (t - start) / per))
