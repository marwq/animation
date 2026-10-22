"""Обложка для лонга (1280×720), в духе обложек @HugyTi: крупные персонажи
по краям, белое «VS» в центре за ними (шрифт M PLUS Rounded 1c Black — fonts/),
мягкие пиксельные облака и размытая трава.

Слева влюблённый лорд, справа большая розовая, за ней влюблённый скелет;
снизу малыш и толстый злобно смотрят друг на друга.

    python3 cover.py                 # export/cover.png и export/cover_no_vs.png
"""
import os
import random

import cairo

import fx
from rig import GIRL_BIG, LORD_BIG, SKELETON_BIG, Ball, Big

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


FONT = os.path.join(HERE, 'fonts', 'MPLUSRounded1c-Black-latin.ttf')


def vs(ctx, x, y, size):
    """Белое «VS» жирным округлым шрифтом с мягкой размытой тенью, как у конкурента."""
    import numpy as np
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
    font = ImageFont.truetype(FONT, size)
    l, t, r, b = ImageDraw.Draw(Image.new('L', (1, 1))).textbbox((0, 0), 'V S', font=font)
    ox, oy = x - (l + r) / 2, y - (t + b) / 2
    text = Image.new('L', (W, H), 0)
    ImageDraw.Draw(text).text((ox, oy), 'V S', font=font, fill=255)
    shadow = Image.new('L', (W, H), 0)
    ImageDraw.Draw(shadow).text((ox + 7, oy + 11), 'V S', font=font, fill=255)
    shadow = shadow.filter(ImageFilter.GaussianBlur(11))
    a_txt = np.asarray(text, dtype=np.float32) / 255
    a_sh = np.asarray(shadow, dtype=np.float32) / 255 * 0.55
    # белый сверху, чуть сероватый к низу букв
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    k = np.clip((yy * H - (oy + t)) / max(1, b - t), 0, 1)
    white = np.stack([1 - 0.10 * k, 1 - 0.08 * k, 1 - 0.03 * k], -1) * np.ones((H, W, 1), np.float32)
    shade = np.array([0.40, 0.45, 0.62], np.float32)
    a = a_txt + a_sh * (1 - a_txt)
    rgb = (white * a_txt[..., None] + shade * (a_sh * (1 - a_txt))[..., None])   # премультиплицировано
    bgra = np.dstack([rgb[..., 2], rgb[..., 1], rgb[..., 0], a])
    buf = (np.clip(bgra, 0, 1) * 255 + 0.5).astype(np.uint8)
    surf = cairo.ImageSurface.create_for_data(bytearray(buf.tobytes()), cairo.FORMAT_ARGB32, W, H, W * 4)
    ctx.set_source_surface(surf, 0, 0)
    ctx.paint()


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


def render(with_vs=True):
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    background(ctx)
    if with_vs:
        vs(ctx, 585, 300, 220)

    lord = Big(LORD_BIG)
    skel = Big(SKELETON_BIG)
    girl = Big(GIRL_BIG)
    baby = Ball('child')
    fat = Ball('fat')

    # слева: лорд влюблённо смотрит на розовую — глаза‑сердечки, румянец, тянется к ней
    lp = dict(x=200, y=1062, dir=1, scale=1.28, hearts=1.1, face_shift=0.06, head=7.0,
              lean=4.0, armF=(78.0, 12.0, 0.0), armN=(-10.0, 25.0, 0.0))
    lord.draw(ctx, lp)
    # справа сзади: крылатый скелет тоже влюблён, тянется к ней из‑за спины
    sp = dict(x=1215, y=1030, dir=-1, scale=1.22, wings=34.0, hearts=1.15, face_shift=0.035,
              head=-10.0, lean=10.0, armF=(40.0, 35.0, 0.0), armN=(-20.0, 30.0, 0.0))
    skel.draw(ctx, sp)
    # справа впереди: большая розовая — красуется
    gp = dict(x=880, y=1048, dir=-1, scale=1.25, face_shift=0.0, sw_eyes='normal', sw_mouth='happy',
              armF=(128.0, 28.0, 0.0), armN=(-40.0, 80.0, 0.0), head=-4.0)
    girl.draw(ctx, gp)

    # слюнки и сердечки над влюблёнными
    for rig_, pose, mouth_pt in ((lord, lp, (-0.10, -0.47)), (skel, sp, (-0.02, -0.40))):
        top = rig_.joint(pose, 'head', (0.05, -0.92))
        fx.hearts_up(ctx, top[0], top[1] + 10, 11, 3, 1.4)
        fx.drool(ctx, *rig_.joint(pose, 'face', mouth_pt), 9, 1.6)

    # снизу: малыш и толстый злобно смотрят друг на друга
    bp = dict(x=330, y=800, dir=1, scale=1.12, face_shift=0.14, eyes='angry', mouth_s=(1.1, 0.9), prop=20.0)
    baby.draw(ctx, bp)
    fpose = dict(x=760, y=812, dir=-1, scale=0.92, face_shift=0.14, eyes='angry', mouth='theeth smile')
    fat.draw(ctx, fpose)
    # злятся друг на друга: жилки злости сбоку от лица
    fx.anger(ctx, 205, 590, 2, 1.1)
    fx.anger(ctx, 905, 470, 5, 1.1)
    return surf


if __name__ == '__main__':
    out = os.path.join(HERE, 'export')
    os.makedirs(out, exist_ok=True)
    render(True).write_to_png(os.path.join(out, 'cover.png'))
    render(False).write_to_png(os.path.join(out, 'cover_no_vs.png'))
    print('готово:', os.path.join(out, 'cover.png'))
