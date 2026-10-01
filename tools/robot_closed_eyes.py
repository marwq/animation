"""Красный робот с закрытыми глазами — 4 варианта.

Глаза стираются с головы (заливка красным + восстановление контура головы справа,
где правый глаз сливался с обводкой), затем поверх рисуются закрытые глаза.
Всё рисуется в 4× и уменьшается — края сглажены как в оригинале.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.interpolate import PchipInterpolator

DIR = Path(__file__).resolve().parent.parent / "characters" / "red-robot"
SS = 4  # суперсэмплинг
INK = (0, 0, 0, 255)
LINE = 5.5  # толщина обводки как у оригинала, px

src = np.asarray(Image.open(DIR / "original.png").convert("RGB"))
H, W, _ = src.shape
im = src.astype(int)
BG = im[5, 5]
not_bg = np.abs(im - BG).sum(2) > 40
red = (im[..., 0] > 150) & (im[..., 1] < 120)
PINK = np.array([0xF8, 0xAD, 0xA7])

# --- маски глаз ---------------------------------------------------------------
cand = (~red) & not_bg
cand[:100] = cand[240:] = False
cand[:, :190] = cand[:, 500:] = False
lab, n = ndimage.label(ndimage.binary_closing(cand, iterations=2))
sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
eyes = [ndimage.binary_fill_holes(lab == k + 1) for k in np.argsort(sizes)[::-1][:2]]
eyes.sort(key=lambda m: np.nonzero(m)[1].mean())  # слева направо
EYE_L, EYE_R = eyes


def bbox(m):
    ys, xs = np.nonzero(m)
    return xs.min(), ys.min(), xs.max(), ys.max()


def scan(ok, x, rng):
    """Первые красные пиксели столбца по направлению — до чёрной линии, не дальше."""
    got = []
    for y in rng:
        if src[y, x].astype(int).sum() < 150 and not ok[y]:
            if got:
                break
            continue
        if ok[y]:
            got.append(y)
            if len(got) == 4:
                break
    return got


# --- стираем глаза ------------------------------------------------------------
def erase_eyes():
    """Заливка по столбцам: тени на голове вертикальные, поэтому каждый пиксель под
    глазом берёт цвет из того же столбца — интерполяция между красным выше и ниже глаза.
    Справа правый глаз лежит прямо на обводке головы: её силуэт не меняем, а
    перерисовываем розовый ободок и чёрный контур по исходному краю."""
    eye = ndimage.binary_dilation(EYE_L | EYE_R, iterations=3)
    body = red | (np.abs(im - PINK).sum(2) < 30)
    out = src.astype(np.float32).copy()
    x0, y0, x1, y1 = bbox(eye)
    last_up = None
    for x in range(x0, x1 + 1):
        col = eye[:, x]
        if not col.any():
            continue
        ys = np.nonzero(col)[0]
        ok = red[:, x] & ~col
        up = scan(ok, x, range(ys.min() - 1, max(0, ys.min() - 40), -1))
        dn = scan(ok, x, range(ys.max() + 1, min(H, ys.max() + 40)))
        if not up and not dn:
            continue
        good = lambda c: c is not None and c[0] > 200 and c[1] < 90
        cu = src[up, x].astype(np.float32).mean(0) if up else None
        if good(cu):
            last_up = cu
            cd = src[dn, x].astype(np.float32).mean(0) if dn else cu
            if not good(cd):
                cd = cu
        else:  # у края головы чистого красного сверху нет — берём соседний столбец
            cu = cd = last_up
        yu = np.mean(up) if up else ys.min()
        yd = np.mean(dn) if dn else ys.max()
        for y in ys:
            t = np.clip((y - yu) / max(1, yd - yu), 0, 1)
            out[y, x] = (1 - t) * cu + t * cd
    # мягко сгладим залитое и вклеим с растушёвкой, чтобы не было швов
    blur = np.stack([ndimage.gaussian_filter(out[..., c], (2.5, 7)) for c in range(3)], -1)
    feather = ndimage.gaussian_filter(
        ndimage.binary_dilation(eye, iterations=2).astype(np.float32), 1.5)[..., None]
    out = src * (1 - feather) + blur * feather

    # Правый край головы: гладкая кривая по исходному силуэту (без выступа и
    # зазубрин в местах, где глаз касался обводки).
    Y0, Y1 = 92, 238
    fit_y = [y for y in range(60, Y1) if not (118 <= y <= 136 or 216 <= y <= 232)]
    fit_x = [np.nonzero(not_bg[y, 300:560])[0].max() + 300.5 for y in fit_y]
    poly = np.polyfit(fit_y, fit_x, 3)
    yy, xx = np.mgrid[:H, :W].astype(np.float32)
    xe = np.full(H, -1e9, np.float32)
    xe[Y0:Y1 + 1] = np.polyval(poly, np.arange(Y0, Y1 + 1))
    d = xe[:, None] - xx
    ey0, ey1 = Y0, Y1
    zone = np.zeros((H, W), bool)
    zone[Y0:Y1 + 1] = True
    zone &= (xx > 400) & (d < 18)
    zone &= ~((yy >= 226) & (src.astype(int).sum(2) < 200))  # линию пояса не трогаем
    a_pink = np.clip(15.5 - d, 0, 1)[..., None]
    a_ink = np.clip(LINE + 0.5 - d, 0, 1)[..., None]
    a_bg = np.clip(0.5 - d, 0, 1)[..., None]
    col = out.copy()
    col = col + a_pink * (PINK - col)
    col = col + a_ink * (0 - col)
    col = col + a_bg * (BG - col)
    # стык с исходным ободком сверху и снизу — плавно
    fade = np.clip(np.minimum(yy - ey0, ey1 - yy) / 8, 0, 1)[..., None]
    fade = np.maximum(fade, (d < LINE + 1)[..., None])  # контур и фон — без растушёвки
    out = np.where(zone[..., None], out * (1 - fade) + col * fade, out)

    # Линия низа головы справа: глаз её касался — восстанавливаем по продолжению.
    dark = src.astype(int).sum(2) < 120
    lx = np.arange(300, 461, 4)
    ly = [np.nonzero(dark[236:258, x])[0].mean() + 236 if dark[236:258, x].any()
          else np.nan for x in lx]
    ok = ~np.isnan(ly)
    line = np.polyfit(lx[ok], np.array(ly)[ok], 2)
    yl = np.polyval(line, xx)
    near = (xx > 420) & (xx < 520) & (yy > 215) & (yy < 262)
    below = near & (yy > yl + LINE / 2 + 1.5)
    out = np.where(below[..., None], src, out)          # пояс — как в оригинале
    a_line = np.clip(LINE / 2 + 0.5 - np.abs(yy - yl), 0, 1)[..., None]
    a_line *= (near & (d > -1))[..., None]                # внутри силуэта головы
    out = out + a_line * (0 - out)
    return np.clip(out + 0.5, 0, 255).astype(np.uint8)


clean = erase_eyes()
Image.fromarray(clean).save(DIR / "no-eyes.png")

# --- геометрия глаз -----------------------------------------------------------
EYE_BOX = [bbox(EYE_L), bbox(EYE_R)]


def eye_geom(i):
    x0, y0, x1, y1 = EYE_BOX[i]
    return (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2


def quad(p0, c, p1, steps=40):
    t = np.linspace(0, 1, steps)[:, None]
    p0, c, p1 = map(np.array, (p0, c, p1))
    pts = (1 - t) ** 2 * p0 + 2 * (1 - t) * t * c + t ** 2 * p1
    return [tuple(p * SS) for p in pts]


def stroke(d, pts, w=LINE):
    d.line(pts, fill=INK, width=round(w * SS), joint="curve")
    r = w * SS / 2
    for x, y in (pts[0], pts[-1]):
        d.ellipse((x - r, y - r, x + r, y + r), fill=INK)


def tilt(i):
    # Правый глаз в оригинале наклонён и стоит чуть выше — повторяем это.
    return (0, 0) if i == 0 else (-6, -4)


def v_sleep(d):
    """Спокойно спит: дуги уголками вверх и пара ресничек."""
    for i in range(2):
        cx, cy, rx, ry = eye_geom(i)
        dx, dy = tilt(i)
        cx += dx
        cy += ry * 0.15 + dy
        w = rx * 0.78
        a, b = (cx - w, cy - ry * 0.12), (cx + w, cy - ry * 0.12)
        stroke(d, quad(a, (cx, cy + ry * 0.55), b))
        for s in (-1, 1):
            x, y = cx + s * w * 0.62, cy + ry * 0.18
            stroke(d, [(x * SS, y * SS), ((x + s * 7) * SS, (y + 11) * SS)], 4.5)


def v_happy(d):
    """Счастливый: дуги домиком ^^."""
    for i in range(2):
        cx, cy, rx, ry = eye_geom(i)
        dx, dy = tilt(i)
        cx += dx
        cy += ry * 0.2 + dy
        w = rx * 0.72
        stroke(d, quad((cx - w, cy + ry * 0.2), (cx, cy - ry * 0.75), (cx + w, cy + ry * 0.2)),
               LINE + 1)


def v_squeeze(d):
    """Зажмурился: > <."""
    for i in range(2):
        cx, cy, rx, ry = eye_geom(i)
        dx, dy = tilt(i)
        cx += dx
        cy += ry * 0.1 + dy
        s = 1 if i == 0 else -1  # левый глаз «>», правый «<»
        w, h = rx * 0.55, ry * 0.42
        tip = (cx + s * w, cy)
        stroke(d, quad((cx - s * w, cy - h), (cx + s * w * 0.1, cy - h * 0.35), tip), LINE + 1)
        stroke(d, quad(tip, (cx + s * w * 0.1, cy + h * 0.35), (cx - s * w, cy + h)), LINE + 1)


def v_lids(base):
    """Веки опущены: форма глаза сохраняется, внутри красное веко и линия ресниц."""
    out = Image.fromarray(src).convert("RGBA")
    arr = np.asarray(out).astype(np.float32)
    big = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    for i, m in enumerate((EYE_L, EYE_R)):
        inner = ndimage.binary_erosion(ndimage.binary_fill_holes(m), iterations=5)
        inner = ndimage.binary_dilation(inner, iterations=1)
        x0, y0, x1, y1 = bbox(inner)
        yy = np.arange(H)[:, None].repeat(W, 1).astype(np.float32)
        t = np.clip((yy - y0) / max(1, y1 - y0), 0, 1)[..., None]
        lid = (1 - t) * np.array([0xFF, 0x52, 0x48]) + t * np.array([0xD8, 0x1E, 0x1A])
        soft = ndimage.gaussian_filter(inner.astype(np.float32), 0.7)[..., None]
        arr[..., :3] = arr[..., :3] * (1 - soft) + lid * soft
        # блик на веке
        cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2
        hl = ImageDraw.Draw(big)
        hl.ellipse(((cx - rx * 0.45) * SS, (cy - ry * 0.62) * SS,
                    (cx - rx * 0.05) * SS, (cy - ry * 0.42) * SS), fill=(255, 170, 160, 200))
        # линия смыкания век и реснички
        ly = cy + ry * 0.35
        row = np.nonzero(inner[int(ly - ry * 0.12)])[0]
        a, b = (row.min() + 2, ly - ry * 0.12), (row.max() - 2, ly - ry * 0.12)
        cx = (a[0] + b[0]) / 2
        stroke(d, quad(a, (cx, ly + ry * 0.4), b))
        for k in (-0.5, 0, 0.5):
            x = cx + k * rx * 1.1
            y = ly + ry * 0.12 * (1 - abs(k)) + 1
            stroke(d, [(x * SS, y * SS), ((x + k * 8) * SS, (y + 10) * SS)], 4)
    out = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
    small = big.resize((W, H), Image.LANCZOS)
    return Image.alpha_composite(out, small)


def render(draw_fn):
    base = Image.fromarray(clean).convert("RGBA")
    big = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(big))
    return Image.alpha_composite(base, big.resize((W, H), Image.LANCZOS))


variants = {
    "1-sleep": render(v_sleep),
    "2-happy": render(v_happy),
    "3-lids": v_lids(None),
    "4-squeeze": render(v_squeeze),
}
for name, img in variants.items():
    img.convert("RGB").save(DIR / f"eyes-closed-{name}.png")

# Лист со всеми вариантами 2×2
sheet = Image.new("RGB", (W * 2, H * 2), tuple(BG))
for k, img in enumerate(variants.values()):
    sheet.paste(img.convert("RGB"), ((k % 2) * W, (k // 2) * H))
sheet.save(DIR / "eyes-closed-sheet.png")
