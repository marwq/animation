"""Обложка для лонга (1280×720), в духе обложек @HugyTi: крупные персонажи
двумя командами по краям, белое «VS» в центре за ними, мягкие пиксельные
облака и размытая трава.

    python3 cover.py                 # export/cover.png и export/cover_no_vs.png
"""
import os
import random

import cairo

import fx
from rig import LORD_BIG, SKELETON_BIG, Ball, Big

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1280, 720


def soft_layer(draw, k=5):
    """Рисует слой в уменьшенном размере и растягивает — получается мягкий, «не в фокусе»."""
    small = cairo.ImageSurface(cairo.FORMAT_ARGB32, W // k + 2, H // k + 2)
    c = cairo.Context(small)
    c.scale(1 / k, 1 / k)
    draw(c)
    return small, k


def paint_soft(ctx, layer):
    small, k = layer
    ctx.save()
    ctx.scale(k, k)
    ctx.set_source_surface(small, 0, 0)
    ctx.get_source().set_filter(cairo.FILTER_BILINEAR)
    ctx.paint()
    ctx.restore()


def background(ctx):
    g = cairo.LinearGradient(0, 0, 0, H)
    g.add_color_stop_rgb(0.0, 0.42, 0.70, 0.96)
    g.add_color_stop_rgb(0.75, 0.73, 0.87, 0.98)
    g.add_color_stop_rgb(1.0, 0.85, 0.93, 0.99)
    ctx.set_source(g)
    ctx.paint()

    def clouds(c):
        c.set_source_rgba(1, 1, 1, 0.95)
        b = 44
        for x0, y0, rows in ((40, 70, ((0, 7), (-1, 9))), (760, 20, ((1, 9), (0, 12), (2, 10))),
                             (980, 300, ((0, 7), (-1, 8))), (-40, 300, ((0, 5),))):
            for r, (a, e) in enumerate(rows):
                c.rectangle(x0 + a * b, y0 + r * b, (e - a) * b, b)
            c.fill()
            c.set_source_rgba(0.84, 0.90, 0.97, 0.9)
            a, e = rows[-1]
            c.rectangle(x0 + a * b, y0 + len(rows) * b - b * 0.35, (e - a) * b, b * 0.35)
            c.fill()
            c.set_source_rgba(1, 1, 1, 0.95)

    def ground(c):
        rng = random.Random(3)
        c.set_source_rgb(0.38, 0.72, 0.30)
        c.rectangle(0, 560, W, H)
        c.fill()
        for yy in range(560, H, 40):
            for xx in range(0, W, 40):
                r = rng.random()
                if r < 0.3:
                    c.set_source_rgb(0.32, 0.64, 0.26)
                elif r < 0.45:
                    c.set_source_rgb(0.47, 0.80, 0.36)
                else:
                    continue
                c.rectangle(xx, yy, 40, 40)
                c.fill()
        c.set_source_rgb(0.62, 0.84, 0.55)
        c.rectangle(0, 548, W, 16)
        c.fill()

    paint_soft(ctx, soft_layer(clouds, 6))
    paint_soft(ctx, soft_layer(ground, 5))


def vs(ctx, x, y, size):
    """Белое «VS» с мягкой серой тенью, как у конкурента."""
    ctx.save()
    ctx.select_font_face('Inter', cairo.FONT_SLANT_ITALIC, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(size)
    ext = ctx.text_extents('VS')
    ox, oy = x - ext.width / 2 - ext.x_bearing, y - ext.height / 2 - ext.y_bearing
    for k in range(8, 0, -1):
        ctx.move_to(ox + k * 1.6, oy + k * 1.6)
        ctx.text_path('VS')
        ctx.set_source_rgba(0.25, 0.30, 0.45, 0.06)
        ctx.fill()
    ctx.move_to(ox, oy)
    ctx.text_path('VS')
    g = cairo.LinearGradient(0, oy - ext.height, 0, oy)
    g.add_color_stop_rgb(0, 1, 1, 1)
    g.add_color_stop_rgb(1, 0.86, 0.89, 0.95)
    ctx.set_source(g)
    ctx.fill_preserve()
    ctx.set_source_rgba(0.35, 0.40, 0.55, 0.55)
    ctx.set_line_width(3)
    ctx.stroke()
    ctx.restore()


def eye_centres(ball, key='normal'):
    """Центры двух глаз шарика (по фигурам слоя глаз)."""
    L = next(l for l in ball.layers if l.switch == 'eyes' and l.name == key)
    pts = []
    for sh in L.shapes:
        for loop in sh.loops:
            ps = [g[0] for g in loop]
            xs, ys = [p[0] for p in ps], [p[1] for p in ps]
            pts.append(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, max(xs) - min(xs)))
    pts.sort(key=lambda p: -p[2])
    two = sorted(pts[:2], key=lambda p: p[0])
    return [(p[0], p[1]) for p in two]


def cake(ctx, x, y, s=1.0):
    from film_lord_vs_fat import cake as draw_cake
    draw_cake(ctx, x, y, s)


def render(with_vs=True):
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    background(ctx)
    if with_vs:
        vs(ctx, 640, 300, 250)

    lord = Big(LORD_BIG)
    skel = Big(SKELETON_BIG)
    baby = Ball('child')
    girl = Ball('girl_small')
    fat = Ball('fat')

    # слева: лорд в шоке, тянет руку к центру
    lord.draw(ctx, dict(x=215, y=1062, dir=1, scale=1.28, eyes=(1.12, 1.12), mouth=(1.0, 1.15),
                        face_shift=0.0, head=-6.0, armF=(62.0, 18.0, 0.0), armN=(-12.0, 25.0, 0.0)))
    # справа: крылатый скелет, крылья вверх, злая ухмылка, тянет когти к центру
    skel.draw(ctx, dict(x=1075, y=1040, dir=-1, scale=1.25, wings=38.0, eyes=(1.0, 0.5),
                        face_shift=0.0, head=4.0, armF=(70.0, 25.0, 0.0), armN=(-15.0, 30.0, 0.0)))

    # впереди: малыш (слюнки, пропеллер), розовая с глазами‑сердечками, толстый с тортом
    bp = dict(x=360, y=790, dir=1, scale=1.12, face_shift=0.04, eyes='normal', eye_s=(1.15, 1.15),
              mouth_s=(1.15, 1.15), prop=20.0)
    baby.draw(ctx, bp)

    gp = dict(x=655, y=805, dir=1, scale=1.05, face_shift=0.0, eyes='normal', mouth='puzzlement',
              hide=('normal',))
    girl.draw(ctx, gp)
    for ex, ey in eye_centres(girl):
        px, py = girl.point(gp, (ex, ey), face=True)
        fx.heart(ctx, px, py, 34)
    for i, (dx, dy, r) in enumerate(((-150, -310, 22), (-90, -380, 16), (120, -340, 19))):
        fx.heart(ctx, 655 + dx, 805 + dy, r, alpha=0.95)

    fpose = dict(x=1010, y=830, dir=-1, scale=0.95, face_shift=0.10, eyes='normal', eye_s=(1.25, 1.25),
                 mouth='happy', mouth_s=(2.1, 2.1), mouth_off=(0.0, 0.10), eye_dy=-0.05)
    fat.draw(ctx, fpose)
    m = fat.point(fpose, (fat.mouth_c['happy'][0], fat.mouth_c['happy'][1] + 0.10), face=True)
    ctx.save()
    fat.swallow_clip(ctx, fpose, W, H)
    cake(ctx, m[0] - 70, m[1] - 10, 1.25)
    ctx.restore()
    fx.drool(ctx, m[0] + 40, m[1] + 70, 6, 1.6)

    return surf


if __name__ == '__main__':
    out = os.path.join(HERE, 'export')
    os.makedirs(out, exist_ok=True)
    render(True).write_to_png(os.path.join(out, 'cover.png'))
    render(False).write_to_png(os.path.join(out, 'cover_no_vs.png'))
    print('готово:', os.path.join(out, 'cover.png'))
