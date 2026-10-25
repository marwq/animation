"""Анимация «настроечная таблица глючит»: 1,5 с, 1920×1080 (16:9), 30 кадров/с.

Таблица нарисована в простом 2D-стиле, как персонажи: толстый неровный контур,
плоская заливка с одной тенью, бумажное зерно. Контур «дышит» — три варианта
линии сменяются каждые 3 кадра.

Глитч мягкий, без вспышек и резких скачков: плавная волна по строкам, полосы,
которые съезжают вбок и возвращаются с замедлением, небольшое расхождение
каналов, белые штрихи помех и медленная светлая полоса сверху вниз. Все движения
периодичны с периодом клипа, поэтому он закольцован без шва.

Запуск из корня:  python3 tools/tv_glitch.py      (нужны numpy, Pillow и ffmpeg)
Результат: animations/tv_glitch/tv_glitch.mp4 и preview.png
"""
import math
import os
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'animations', 'tv_glitch')

W, H = 1920, 1080
FPS = 30
FRAMES = 45          # 1,5 с
SS = 2               # рисуем в ×2 и уменьшаем — сглаженные края
BOIL = 3             # вариантов линии
BOIL_HOLD = 3        # кадров на вариант (45 / 3 / 3 = 5 полных циклов — без шва)

OUT = (28, 26, 26)   # контур, как у персонажей
LINE = 9             # толщина контура, px
WHITE_STREAK = (1.0, 0.99, 0.96)

PAL = {
    'gray':    (220, 217, 210),
    'yellow':  (241, 214, 74),
    'cyan':    (92, 207, 224),
    'green':   (108, 207, 95),
    'magenta': (212, 101, 207),
    'red':     (224, 90, 78),
    'blue':    (75, 91, 209),
    'black':   (42, 40, 48),
    'navy':    (44, 49, 98),
    'white':   (242, 238, 230),
}

# раскладка как на референсе: 7 полос, узкая средняя полоса, нижний ряд
Y1, Y2 = 724, 810
TOP = ['gray', 'yellow', 'cyan', 'green', 'magenta', 'red', 'blue']
MID = ['blue', 'black', 'magenta', 'yellow', 'cyan', 'black', 'white']
BOT = [(0, .105, 'navy'), (.105, .31, 'white'), (.31, .565, 'navy'),
       (.565, .9, 'white'), (.9, 1, 'black')]
CW = W / 7


def smooth(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0)
    return t * t * t * (t * (t * 6 - 15) + 10)


def wrap(t, c):
    """Расстояние по фазе клипа с учётом закольцовки, в [-0.5, 0.5)."""
    return (t - c + 0.5) % 1.0 - 0.5


def bump(t, c, w):
    return math.exp(-(wrap(t, c) / w) ** 2)


def envelope(t):
    """Сила глитча: спокойно → нарастает к 0,5 с → стихает → второй, меньший всплеск."""
    return 0.25 + 0.75 * bump(t, .32, .13) + 0.55 * bump(t, .74, .10)


# ------------------------------------------------------------------ рисунок
def cells():
    out = []
    for i in range(7):
        x0, x1 = i * CW, (i + 1) * CW
        out.append((x0, 0, x1, Y1, TOP[i]))
        out.append((x0, Y1, x1, Y2, MID[i]))
    for a, b, c in BOT:
        out.append((a * W, Y2, b * W, H, c))
    return out


def outline_paths():
    m = 30  # выходим за кадр, чтобы на краях не было концов линий
    paths = [((i * CW, -m), (i * CW, Y2 + 2)) for i in range(1, 7)]
    paths += [((-m, Y1), (W + m, Y1)), ((-m, Y2), (W + m, Y2))]
    paths += [((f * W, Y2 - 3), (f * W, H + m)) for f in (.105, .31, .565, .9)]
    return paths


def wobble_line(p0, p1, rng_fixed, rng_boil):
    """Точки неровной линии (в координатах ×SS) и радиус кисти в каждой точке."""
    (x0, y0), (x1, y1) = p0, p1
    L = math.hypot(x1 - x0, y1 - y0)
    n = max(2, int(L * SS / 1.6))
    s = np.linspace(0, L, n)
    ux, uy = (x1 - x0) / L, (y1 - y0) / L
    nx, ny = -uy, ux
    # постоянный лёгкий наклон линии + «дрожание», которое меняется с вариантом
    tilt = rng_fixed.uniform(-1.6, 1.6) * (s / L * 2 - 1)
    ph = rng_boil.uniform(0, 2 * math.pi, 5)
    lam = rng_boil.uniform(.85, 1.15, 5) * np.array([360, 130, 47, 220, 70])
    off = 1.9 * (0.6 * np.sin(2 * np.pi * s / lam[0] + ph[0]) +
                 0.3 * np.sin(2 * np.pi * s / lam[1] + ph[1]) +
                 0.1 * np.sin(2 * np.pi * s / lam[2] + ph[2])) + tilt
    r = LINE / 2 * (1 + 0.16 * np.sin(2 * np.pi * s / lam[3] + ph[3]) +
                    0.07 * np.sin(2 * np.pi * s / lam[4] + ph[4]))
    # кончики линии чуть сужаются
    taper = np.minimum(1, np.minimum(s, L - s) / 14) * 0.35 + 0.65
    xs = (x0 + ux * s + nx * off) * SS
    ys = (y0 + uy * s + ny * off) * SS
    return xs, ys, r * taper * SS


def brush(draw, xs, ys, rs, color):
    for x, y, r in zip(xs, ys, rs):
        draw.ellipse((x - r, y - r, x + r, y + r), fill=color)


def shade_color(c, k=0.86):
    return tuple(int(v * k) for v in c)


def draw_base(variant):
    img = Image.new('RGB', (W * SS, H * SS))
    d = ImageDraw.Draw(img)
    for x0, y0, x1, y1, name in cells():
        d.rectangle((x0 * SS, y0 * SS, x1 * SS, y1 * SS), fill=PAL[name])

    # одна тень: полоса у правого края каждой верхней полосы, с неровным краем
    rng_fixed = np.random.default_rng(11)
    rng_boil = np.random.default_rng(100 + variant)
    for i in range(7):
        xr = (i + 1) * CW
        xs, ys, _ = wobble_line((xr - CW * .16, -30), (xr - CW * .16, Y1), rng_fixed, rng_boil)
        poly = list(zip(xs, ys)) + [(xr * SS, Y1 * SS), (xr * SS, -30 * SS)]
        d.polygon(poly, fill=shade_color(PAL[TOP[i]]))

    rng_fixed = np.random.default_rng(21)
    for p0, p1 in outline_paths():
        brush(d, *wobble_line(p0, p1, rng_fixed, rng_boil), OUT)

    small = img.resize((W, H), Image.LANCZOS)
    return np.asarray(small, dtype=np.float32) / 255.0


def paper_texture():
    rng = np.random.default_rng(5)
    blotch = rng.normal(0, 1, (9, 16)).astype(np.float32)
    blotch = np.asarray(Image.fromarray(blotch).resize((W, H), Image.BICUBIC))
    grain = rng.normal(0, 1, (H, W)).astype(np.float32)
    return 1 + 0.014 * blotch / blotch.std() + 0.02 * grain


def glare_mask():
    """Мультяшный блик на стекле: две косые полоски в левом верхнем углу."""
    m = Image.new('L', (W * SS, H * SS), 0)
    d = ImageDraw.Draw(m)
    for (a, b), alpha in (((120, 260), 30), ((300, 340), 22)):
        poly = [(a, -10), (b, -10), (b - 330, 330), (a - 330, 330)]
        d.polygon([(x * SS, y * SS) for x, y in poly], fill=alpha)
    return np.asarray(m.resize((W, H), Image.LANCZOS), dtype=np.float32)[..., None] / 255.0


def vignette():
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.hypot((x - W / 2) / (W / 2), (y - H / 2) / (H / 2))
    return (1 - 0.16 * np.clip(r - 0.55, 0, None) ** 1.6 / 0.9 ** 1.6)[..., None]


def scanlines():
    y = np.arange(H, dtype=np.float32)
    return (1 - 0.045 * (0.5 + 0.5 * np.cos(2 * np.pi * y / 6)))[:, None, None]


# ------------------------------------------------------------------ глитч
# полосы, которые съезжают вбок: центр по фазе, длительность, y, высота, сдвиг px, дрейф по y
TEARS = [
    (.10, .16, 655, 18, 14, 0),
    (.27, .30, 470, 62, 38, 14),
    (.36, .22, 548, 26, -24, -8),
    (.47, .18, 205, 22, 16, 6),
    (.55, .20, 405, 30, 18, 0),
    (.70, .26, 300, 44, -30, 10),
    (.78, .18, 862, 34, 26, -6),
    (.92, .14, 590, 16, -12, 0),
]


def tear_rows(t):
    """Сдвиг каждой строки от полос и список краёв полос (y, сила)."""
    y = np.arange(H, dtype=np.float32)
    dx = np.zeros(H, np.float32)
    edges = []
    for c, dur, yc, h, amp, drift in TEARS:
        u = wrap(t, c) / dur + 0.5
        if not 0 < u < 1:
            continue
        k = smooth(0, .38, u) * (1 - smooth(.62, 1, u))
        off = amp * k * (1 + 0.08 * math.sin(2 * math.pi * 3 * t))
        top = yc + drift * (u - .5) - h / 2
        bot = top + h
        m = np.clip(np.minimum(y - top, bot - y) / 1.5 + 0.5, 0, 1)
        dx += off * m
        edges += [(top, abs(off)), (bot, abs(off))]
    return dx, edges


def make_streaks():
    """Белые штрихи помех; появляются чаще, когда глитч сильнее."""
    rng = np.random.default_rng(7)
    out = []
    while len(out) < 56:
        c = rng.uniform(0, 1)
        if rng.uniform(0, 1.3) > envelope(c):
            continue
        y = rng.uniform(410, 560) if rng.uniform() < .78 else rng.uniform(70, 1010)
        x = rng.uniform(-150, W)
        length = float(np.clip(rng.lognormal(math.log(130), .7), 30, 520))
        out.append(dict(c=c, dur=rng.uniform(.10, .26), x=x, y=y, len=length,
                        th=rng.uniform(3, 6.5), vx=rng.uniform(-70, 70),
                        a=rng.uniform(.65, .92)))
    return out


def streak_layer(t, streaks):
    lay = Image.new('L', (W * SS, H * SS), 0)
    d = ImageDraw.Draw(lay)
    for s in streaks:
        u = wrap(t, s['c']) / s['dur'] + 0.5
        if not 0 < u < 1:
            continue
        a = s['a'] * smooth(0, .3, u) * (1 - smooth(.7, 1, u))
        x0 = (s['x'] + s['vx'] * (u - .5)) * SS
        x1 = x0 + s['len'] * SS
        y = s['y'] * SS
        r = s['th'] * SS / 2
        v = int(255 * a)
        d.rectangle((x0, y - r, x1, y + r), fill=v)
        d.ellipse((x0 - r, y - r, x0 + r, y + r), fill=v)
        d.ellipse((x1 - r, y - r, x1 + r, y + r), fill=v)
    return np.asarray(lay.resize((W, H), Image.LANCZOS), dtype=np.float32)[..., None] / 255.0


XS = np.arange(W, dtype=np.float32)
ROWS = np.arange(H)[:, None]


def shift_rows(ch, dx):
    """Сдвиг строк канала по горизонтали на дробное число пикселей (края — повтор)."""
    src = np.clip(XS[None, :] - dx[:, None], 0, W - 1)
    x0 = np.floor(src).astype(np.int32)
    x1 = np.minimum(x0 + 1, W - 1)
    f = src - x0
    return ch[ROWS, x0] * (1 - f) + ch[ROWS, x1] * f


def render_frame(i, bases, paper, streaks, post, glare):
    t = i / FRAMES
    e = envelope(t)
    y = np.arange(H, dtype=np.float32)

    img = bases[(i // BOIL_HOLD) % BOIL] * paper[..., None]
    a = streak_layer(t, streaks)
    img = img * (1 - a) + np.array(WHITE_STREAK, np.float32) * a

    # медленная светлая полоса сверху вниз (за кадром в начале и в конце клипа)
    yr = -260 + t * (H + 520)
    g = np.exp(-((y - yr) / 85) ** 2)

    wave = e * (4.0 * np.sin(2 * np.pi * (y / 420 - t)) +
                1.4 * np.sin(2 * np.pi * (y / 97 + 2 * t)))
    tear, edges = tear_rows(t)
    dx = wave + tear + 2.5 * g * np.sin(2 * np.pi * (y / 23 + 3 * t))
    ca = 0.8 + 2.2 * e + 0.05 * np.abs(tear)

    out = np.stack([shift_rows(img[..., 0], dx + ca),
                    shift_rows(img[..., 1], dx),
                    shift_rows(img[..., 2], dx - ca)], axis=-1)

    # тонкие тёмные линии по краям съехавших полос — как разрез бумаги
    outline = np.array(OUT, np.float32) / 255
    for ye, strength in edges:
        k = 0.5 * min(1.0, strength / 12)
        prof = np.clip(1 - np.abs(y - ye) / 1.6, 0, 1) * k
        out = out * (1 - prof[:, None, None]) + outline * prof[:, None, None]

    gl = 0.055 * g[:, None, None]
    out = out * (1 - gl) + gl
    out = out * post
    out = out * (1 - glare) + glare
    return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    bases = [draw_base(v) for v in range(BOIL)]
    paper = paper_texture()
    post = vignette() * scanlines()
    glare = glare_mask()
    streaks = make_streaks()

    with tempfile.TemporaryDirectory() as tmp:
        frames = []
        for i in range(FRAMES):
            fr = render_frame(i, bases, paper, streaks, post, glare)
            Image.fromarray(fr).save(os.path.join(tmp, f'f{i:03d}.png'))
            frames.append(fr)
            print(f'кадр {i + 1}/{FRAMES}', end='\r', flush=True)
        print()

        mp4 = os.path.join(OUT_DIR, 'tv_glitch.mp4')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS),
                        '-i', os.path.join(tmp, 'f%03d.png'),
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '14',
                        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], check=True)
        print(os.path.relpath(mp4, ROOT))

    # превью: 6 кадров сеткой 3×2
    picks = [0, 8, 14, 21, 32, 38]
    tw, th = W // 3, H // 3
    sheet = Image.new('RGB', (tw * 3 + 40, th * 2 + 30), (251, 248, 244))
    for n, i in enumerate(picks):
        im = Image.fromarray(frames[i]).resize((tw, th), Image.LANCZOS)
        sheet.paste(im, (10 + (n % 3) * (tw + 10), 10 + (n // 3) * (th + 10)))
    prev = os.path.join(OUT_DIR, 'preview.png')
    sheet.save(prev)
    print(os.path.relpath(prev, ROOT))


if __name__ == '__main__':
    main()
