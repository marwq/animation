#!/usr/bin/env python3
"""Качели делают полный оборот («солнышко») вокруг перекладины. Вид спереди, фон удалён.

    python3 tools/swing.py              # слои, кадры, GIF / WebP / APNG / WebM / MOV
    python3 tools/swing.py --preview    # только лист ключевых кадров

Исходник — swing/source.png. Картинка режется на неподвижную раму и качелю (цепи,
сиденье, смайлик). Качеля — плоская двусторонняя текстура с толщиной: она
поворачивается вокруг оси перекладины в 3D и проецируется перспективной камерой,
которая стоит прямо перед рамой. Рама остаётся пиксель в пиксель как на исходнике.
Нужны numpy, Pillow и ffmpeg.
"""
import os
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'swing')
SRC = os.path.join(OUT, 'source.png')

# --- исходник -----------------------------------------------------------------
CROP_W = 870                     # справа на скриншоте служебная полоса — отрезаем
BG = np.array([185, 187, 40.])   # фон
SH = np.array([122, 123, 26.])   # тень на фоне
OUTLINE = np.array([30, 28, 26.])    # чёрный контур вокруг всех предметов

# --- геометрия (в пикселях исходника) -----------------------------------------
PIVOT_Y = 220.0                  # ось вращения: низ перекладины, где крепятся цепи
SWING_X = (224, 539)             # качеля целиком лежит между столбами
SWING_Y0 = 235                   # ниже перекладины всё в этих колонках — качеля
UNDERSIDE = (208, 235)           # строки нижней грани перекладины
CHAINS = ((266, 297), (466, 497))    # колонки цепей
CHAIN_TOP = 219
CHAIN_PERIOD = 42                # шаг звеньев цепи по вертикали
SMILEY_C = (382.0, 499.4)        # центр смайлика
SMILEY_R = (108.7, 114.0)        # радиус жёлтой заливки и внешний радиус контура
YELLOW = (254, 205, 1)
PANEL = (248, 465, 514, 607)     # спинка сиденья: x0, y0, x1, y1 (с контуром)
BEAM_WOOD = (104, 174, 656, 207) # чистая текстура досок на лицевой грани перекладины
THICK = 18.0                     # толщина качели — видна, когда она идёт ребром

# --- камера, свет, анимация ---------------------------------------------------
CAM_X = 381.0                    # камера по центру рамы...
CAM_Y = PIVOT_Y + 150.0          # ...чуть ниже перекладины
CAM_D = 1700.0                   # расстояние до плоскости рамы
FRAME_FRONT = 30.0               # лицевые грани рамы ближе оси вращения на столько
CANVAS = (71, -265, 691, 785)    # x0, y0, x1, y1 в координатах исходника
FPS = 30
FRAMES = 90                      # один оборот = 3 с
TOP_SPEED = 0.5                  # скорость в верхней точке относительно нижней
SS = 2                           # суперсэмплинг
SUBFRAMES = 3                    # подкадры для размытия движения
SHUTTER = 0.5                    # доля кадра, пока «открыт затвор»
LIGHT = np.array([-0.45, -0.65, 0.62])  # свет слева сверху спереди (y вниз, z к зрителю)
LIGHT = LIGHT / np.linalg.norm(LIGHT)


# --- утилиты ------------------------------------------------------------------
def shifted(a, dx, dy):
    """out[y, x] = a[y + dy, x + dx], за краем — повтор крайних пикселей."""
    h, w = a.shape[:2]
    ys = np.clip(np.arange(h) + dy, 0, h - 1)
    xs = np.clip(np.arange(w) + dx, 0, w - 1)
    return a[ys][:, xs]


def dilate(mask, r):
    out = mask.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx or dy:
                out |= shifted(mask, dx, dy)
    return out


def premul(rgba):
    out = rgba.astype(np.float32).copy()
    out[..., :3] *= out[..., 3:]
    return out


def unpremul_u8(p):
    a = p[..., 3:]
    rgb = np.where(a > 1e-4, p[..., :3] / np.maximum(a, 1e-4), 0)
    return np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).round().astype(np.uint8)


def over(top, bottom):
    """Премультиплицированное «поверх»."""
    return top + bottom * (1 - top[..., 3:])


def save_png(p, path):
    Image.fromarray(unpremul_u8(p), 'RGBA').save(path, optimize=True)


# --- 1. удаление фона ---------------------------------------------------------
def matte(rgb):
    """RGBA (цвет 0..255, альфа 0..1) без фона и тени.

    Фон и тень — один оттенок разной яркости, поэтому «фоновые» пиксели — те, что
    близки к отрезку SH–BG. Край шириной до 2 px считаем смесью фона и цвета
    объекта — чёрного контура или ближайшего «чистого» пикселя (не из каймы),
    находим долю объекта (альфу) и убираем зелёную кайму."""
    P = rgb.astype(float)
    seg = BG - SH
    t = np.clip(((P - SH) @ seg) / (seg @ seg), 0, 1)
    core = np.linalg.norm(P - (SH + t[..., None] * seg), axis=-1) < 14
    band = dilate(core, 2) & ~core
    solid = ~core & ~band

    best = np.full(core.shape, np.inf)
    alpha = np.ones(core.shape)
    fcol = P.copy()
    bcol = np.zeros_like(P)
    def candidates():
        yield np.broadcast_to(OUTLINE, P.shape), band
        for dy in range(-3, 4):
            for dx in range(-3, 4):
                if dx or dy:
                    yield shifted(P, dx, dy), shifted(solid, dx, dy) & band

    for F, ok in candidates():
        for B in (BG, SH):
            d = F - B
            dd = (d * d).sum(-1) + 1e-6
            a = np.clip(((P - B) * d).sum(-1) / dd, 0, 1)
            res = np.linalg.norm(P - B - a[..., None] * d, axis=-1)
            score = res + 1500 / (np.sqrt(dd) + 1)
            upd = ok & (score < best)
            best[upd] = score[upd]
            alpha[upd] = a[upd]
            fcol[upd] = F[upd]
            bcol[upd] = B
    alpha[band & (best > 45)] = 1           # не похоже на смесь с фоном — объект
    alpha[band & (alpha > 0.96)] = 1
    # просветы в звеньях цепей: фон, смешанный с контуром, вдали от сплошного фона
    d = OUTLINE - BG
    a = np.clip(((P - BG) @ d) / (d @ d), 0, 1)
    res = np.linalg.norm(P - BG - a[..., None] * d, axis=-1)
    r, g, b = P[..., 0], P[..., 1], P[..., 2]
    hole = solid & (res < 10) & (a < 0.9) & (b < 0.7 * g) & (np.abs(r - g) < 14)
    alpha[hole] = a[hole]
    fcol[hole] = OUTLINE
    bcol[hole] = BG
    band = band | hole
    alpha[core] = 0
    a3 = alpha[..., None]
    pure = np.clip((P - (1 - a3) * bcol) / np.maximum(a3, 1e-3), 0, 255)
    w = np.clip((a3 - 0.25) / 0.5, 0, 1)
    col = np.where(band[..., None], w * pure + (1 - w) * fcol, P)
    return np.dstack([col, alpha]).astype(np.float32)


# --- 2. рама и качеля ---------------------------------------------------------
def split(rgba):
    h, w = rgba.shape[:2]
    ys, xs = np.mgrid[0:h, 0:w]
    r, g, b = rgba[..., 0], rgba[..., 1], rgba[..., 2]
    chain_col = (b >= r - 4) & (r + g + b < 200) & (rgba[..., 3] > 0)
    chain = np.zeros((h, w), bool)
    for x0, x1 in CHAINS:
        chain |= (xs >= x0) & (xs < x1) & (ys >= CHAIN_TOP) & (ys < SWING_Y0) & chain_col
    body = (ys >= SWING_Y0) & (xs >= SWING_X[0]) & (xs < SWING_X[1])
    swing_mask = body | chain

    swing = np.where(swing_mask[..., None], rgba, 0).astype(np.float32)
    frame = np.where(swing_mask[..., None], 0, rgba).astype(np.float32)
    # нижняя грань перекладины за цепями: берём её же из соседних колонок
    y0, y1 = UNDERSIDE
    for x0, x1 in CHAINS:
        hole = chain[y0:y1, x0:x1]
        frame[y0:y1, x0:x1][hole] = rgba[y0:y1, x0 - 36:x1 - 36][hole]
    return frame, swing


def disk_coverage(shape, cx, cy, r):
    """Доля пикселя внутри круга (сглаженный край ~1 px)."""
    h, w = shape
    ys, xs = np.mgrid[0:h, 0:w]
    d = np.hypot(xs + 0.5 - cx, ys + 0.5 - cy)
    return np.clip(r - d + 0.5, 0, 1)


def make_back(swing, frame):
    """Качеля сзади: та же раскладка (u, v), что у лицевой текстуры.

    Сзади видно спинку сиденья целиком (она закрывает смайлик и цепи под ней),
    над спинкой — жёлтый затылок смайлика без лица, цепи тянутся до спинки."""
    h, w = swing.shape[:2]
    back = premul(swing)
    cx, cy = SMILEY_C
    r_in, r_out = SMILEY_R
    px0, py0, px1, py1 = PANEL

    # затылок: убираем лицо, рисуем ровный жёлтый круг с контуром
    outer = disk_coverage((h, w), cx, cy, r_out)
    inner = disk_coverage((h, w), cx, cy, r_in)
    rows = np.arange(h)[:, None] < py1
    head = np.zeros((h, w, 4), np.float32)
    head[..., :3] = np.array(YELLOW, np.float32) * inner[..., None] + 12 * (outer - inner)[..., None]
    head[..., 3] = outer
    clear = (outer > 0) & rows
    back[clear] = 0
    back = over(head * rows[..., None], back)

    # цепи над спинкой, которые спереди закрыты смайликом: копия на 2 звена выше
    lift = 2 * CHAIN_PERIOD
    y_top = int(cy - r_out) - 1
    for x0, x1 in CHAINS:
        src = premul(swing[y_top - lift:py0 - lift, x0:x1]) * clear[y_top:py0, x0:x1, None]
        back[y_top:py0, x0:x1] = over(src, back[y_top:py0, x0:x1])

    # спинка: доски с лицевой грани перекладины, чуть темнее, четыре ряда со швами
    bx0, by0, bx1, by1 = BEAM_WOOD
    wood = frame[by0:by1, bx0:bx1, :3]
    ix0, iy0, ix1, iy1 = px0 + 3, py0 + 3, px1 - 3, py1
    panel = np.zeros((iy1 - iy0, ix1 - ix0, 3), np.float32)
    rows_n = 4
    edges = np.linspace(0, iy1 - iy0, rows_n + 1).round().astype(int)
    for k in range(rows_n):
        hh = edges[k + 1] - edges[k]
        off = (k * 137) % (wood.shape[1] - (ix1 - ix0))
        strip = wood[np.linspace(0, wood.shape[0] - 1, hh).round().astype(int), off:off + ix1 - ix0]
        panel[edges[k]:edges[k + 1]] = strip * (0.78 - 0.03 * k)
        if k:
            panel[edges[k] - 1:edges[k] + 1] = (38, 26, 13)
    back[py0:py1, px0:px1] = (24, 18, 10, 1)            # контур спинки
    back[iy0:iy1, ix0:ix1, :3] = panel
    back[iy0:iy1, ix0:ix1, 3] = 1

    # низ смайлика заходил на верх сиденья — сзади там чистая доска сиденья
    sx0, sx1 = int(cx - 45), int(cx + 45)
    back[py1:py1 + 7, sx0:sx1] = premul(swing[py1:py1 + 7, sx0 - 90:sx1 - 90])
    return back


# --- 3. движение --------------------------------------------------------------
def angle_curve():
    """θ(t) за один оборот: внизу быстрее, вверху медленнее, как у настоящих качелей."""
    th = np.linspace(0, 2 * np.pi, 4097)
    speed = np.sqrt(1 - (1 - TOP_SPEED ** 2) * (1 - np.cos(th)) / 2)
    dt = np.concatenate([[0], np.cumsum((1 / speed[1:] + 1 / speed[:-1]) / 2 * np.diff(th))])
    return lambda t: np.interp(t % 1.0, dt / dt[-1], th)


# --- 4. рендер ----------------------------------------------------------------
class Renderer:
    def __init__(self, frame, front, back):
        x0, y0, x1, y1 = CANVAS
        self.W, self.H = (x1 - x0) * SS, (y1 - y0) * SS
        # рама на холсте (z = 0, масштаб 1)
        fr = np.zeros(((y1 - y0), (x1 - x0), 4), np.float32)
        fh, fw = frame.shape[:2]
        fx0, fy0, fx1, fy1 = max(x0, 0), max(y0, 0), min(x1, fw), min(y1, fh)
        fr[fy0 - y0:fy1 - y0, fx0 - x0:fx1 - x0] = premul(frame[fy0:fy1, fx0:fx1])
        self.frame = fr.repeat(SS, 0).repeat(SS, 1)
        # глубина лицевой поверхности рамы: нижняя грань перекладины — за цепями
        zf = np.full(fr.shape[:2], FRAME_FRONT, np.float32)
        zf[UNDERSIDE[0] - y0:UNDERSIDE[1] - y0, :] = -FRAME_FRONT
        self.zf = zf.repeat(SS, 0).repeat(SS, 1)
        # текстуры: лицо, спина и ребро — тёмный силуэт только деревянного сиденья
        # (спинка, доска, плита); цепи и смайлик тонкие, ребра у них нет
        px0, py0, px1, py1 = PANEL
        seat = np.zeros(front.shape[:2], np.float32)
        seat[py0:py1, px0:px1] = 1
        seat[py1:] = 1
        edge = back * seat[..., None] * np.array([0.5, 0.48, 0.46, 1], np.float32)
        self.tex = {'front': premul(front), 'back': back, 'edge': edge}
        self.mips = {k: self._mips(v) for k, v in self.tex.items()}
        ys, xs = np.nonzero(front[..., 3] > 0)
        self.u0, self.u1 = xs.min(), xs.max() + 1
        self.v1 = ys.max() + 1
        self.reach = self.v1 - PIVOT_Y

    @staticmethod
    def _mips(t):
        """Текстура, размытая по вертикали (1, 2, 4, 8, 16 px) — против ряби при наклоне."""
        h = t.shape[0]
        c = np.concatenate([np.zeros((1,) + t.shape[1:]), np.cumsum(t, axis=0, dtype=np.float64)])
        out = [t]
        for k in range(1, 5):
            n = 2 ** k
            y = np.arange(h) - n // 2
            out.append(((c[np.clip(y + n, 0, h)] - c[np.clip(y, 0, h)]) / n).astype(np.float32))
        return out

    @staticmethod
    def sample(tex, u, v):
        """Билинейная выборка премультиплицированной текстуры; за краем — пусто."""
        h, w = tex.shape[:2]
        x = u - 0.5
        y = v - 0.5
        x0 = np.floor(x).astype(np.int64)
        y0 = np.floor(y).astype(np.int64)
        fx = (x - x0)[..., None].astype(np.float32)
        fy = (y - y0)[..., None].astype(np.float32)
        out = 0
        for dy, wy in ((0, 1 - fy), (1, fy)):
            for dx, wx in ((0, 1 - fx), (1, fx)):
                xi, yi = x0 + dx, y0 + dy
                ok = (xi >= 0) & (xi < w) & (yi >= 0) & (yi < h)
                val = tex[np.clip(yi, 0, h - 1), np.clip(xi, 0, w - 1)]
                out = out + val * (wx * wy * ok[..., None])
        return out

    def project(self, u, d, o, th):
        """Точка качели (u, d — расстояние от оси вдоль качели, o — по нормали) → экран."""
        s, c = np.sin(th), np.cos(th)
        Y = PIVOT_Y + d * c - o * s
        Z = d * s + o * c
        k = CAM_D / (CAM_D - Z)
        return CAM_X + (u - CAM_X) * k, CAM_Y + (Y - CAM_Y) * k

    def slice(self, th, o, name, light):
        """Один слой качели на смещении o по нормали. Возвращает (rgba, z, окно)."""
        s, c = np.sin(th), np.cos(th)
        corners = [self.project(u, d, o, th) for u in (self.u0, self.u1)
                   for d in (CHAIN_TOP - PIVOT_Y - 2, self.reach)]
        xs = [p[0] for p in corners]
        ys = [p[1] for p in corners]
        X0, Y0 = CANVAS[0], CANVAS[1]
        i0 = max(int((min(xs) - X0) * SS) - 2, 0)
        i1 = min(int((max(xs) - X0) * SS) + 3, self.W)
        j0 = max(int((min(ys) - Y0) * SS) - 2, 0)
        j1 = min(int((max(ys) - Y0) * SS) + 3, self.H)
        if i1 <= i0 or j1 <= j0:
            return None
        # сжатие текстуры по вертикали → уровень размытия
        top = self.project(CAM_X, 0, o, th)[1]
        bot = self.project(CAM_X, self.reach, o, th)[1]
        squeeze = max(abs(bot - top) / self.reach * SS, 1e-3)
        level = int(np.clip(np.floor(np.log2(1 / squeeze)), 0, 4))
        tex = self.mips[name][level]

        Xs = X0 + (np.arange(i0, i1) + 0.5) / SS
        Ys = Y0 + (np.arange(j0, j1) + 0.5) / SS
        X, Y = np.meshgrid(Xs, Ys)
        num = CAM_D * c - s * (CAM_Y - PIVOT_Y) - o
        den = s * (Y - CAM_Y) + CAM_D * c
        den = np.where(np.abs(den) < 1e-6, 1e-6, den)
        t = num / den
        valid = (t > 0) & (t < 50)
        t = np.where(valid, t, 1)
        Xw = CAM_X + t * (X - CAM_X)
        Yw = CAM_Y + t * (Y - CAM_Y)
        Zw = CAM_D * (1 - t)
        v = PIVOT_Y + (Yw - PIVOT_Y) * c + Zw * s
        rgba = self.sample(tex, Xw, v) * valid[..., None]
        rgba[..., :3] *= light
        return rgba, Zw, (j0, j1, i0, i1)

    def swing_layers(self, th):
        """Качеля перед рамой и за рамой (премультиплицированные холсты)."""
        s, c = np.sin(th), np.cos(th)
        n = np.array([0, -s, c])
        facing = CAM_D * c - s * (CAM_Y - PIVOT_Y) > 0
        nv = n if facing else -n
        light = float(np.clip(0.6 + 0.4 * max(nv @ LIGHT, 0) / LIGHT[2], 0.6, 1.1))
        # сколько промежуточных слоёв нужно, чтобы ребро было сплошным
        a = np.array(self.project(CAM_X, self.reach, 0, th))
        b = np.array(self.project(CAM_X, self.reach, -THICK, th))
        mid = int(np.clip(np.ceil(np.linalg.norm(a - b) * SS * 1.5), 0, 24))
        offsets = [0.0] + list(-THICK * (np.arange(mid) + 1) / (mid + 1)) + [-THICK]
        names = ['front'] + ['edge'] * mid + ['back']
        order = list(zip(offsets, names))
        if facing:
            order = order[::-1]            # дальние слои первыми
        front = np.zeros((self.H, self.W, 4), np.float32)
        behind = np.zeros((self.H, self.W, 4), np.float32)
        for o, name in order:
            res = self.slice(th, o, name, light if name != 'edge' else 1.0)
            if res is None:
                continue
            rgba, z, (j0, j1, i0, i1) = res
            ahead = (z > self.zf[j0:j1, i0:i1])[..., None]
            front[j0:j1, i0:i1] = over(rgba * ahead, front[j0:j1, i0:i1])
            behind[j0:j1, i0:i1] = over(rgba * ~ahead, behind[j0:j1, i0:i1])
        return front, behind

    def render(self, th):
        front, behind = self.swing_layers(th)
        return over(front, over(self.frame, behind))


def downsample(p):
    h, w = p.shape[0] // SS, p.shape[1] // SS
    return p.reshape(h, SS, w, SS, 4).mean(axis=(1, 3))


# --- 5. сборка ----------------------------------------------------------------
def build_layers():
    rgb = np.asarray(Image.open(SRC).convert('RGB'))[:, :CROP_W]
    cut = matte(rgb)
    frame, swing = split(cut)
    back = make_back(swing, frame)
    os.makedirs(os.path.join(OUT, 'layers'), exist_ok=True)
    save_png(premul(cut), os.path.join(OUT, 'layers', 'cutout.png'))
    save_png(premul(frame), os.path.join(OUT, 'layers', 'frame.png'))
    save_png(premul(swing), os.path.join(OUT, 'layers', 'swing_front.png'))
    save_png(back, os.path.join(OUT, 'layers', 'swing_back.png'))
    return frame, swing, back


def frame_at(rend, theta, k):
    acc = 0
    for s in range(SUBFRAMES):
        t = (k + (s + 0.5) / SUBFRAMES * SHUTTER - SHUTTER / 2) / FRAMES
        acc = acc + rend.render(theta(t))
    return downsample(acc / SUBFRAMES)


PREVIEW_KEYS = [0, 8, 14, 20, 30, 45, 60, 70, 76, 82]


def save_sheet(images):
    """Лист ключевых кадров на прозрачном фоне: два ряда по пять, в половину размера."""
    sheet = np.concatenate([np.concatenate(images[:5], 1), np.concatenate(images[5:], 1)], 0)
    h, w = sheet.shape[0] // 2, sheet.shape[1] // 2
    path = os.path.join(OUT, 'preview.png')
    save_png(sheet[:h * 2, :w * 2].reshape(h, 2, w, 2, 4).mean(axis=(1, 3)), path)
    print('лист:', path)


def preview(rend, theta):
    images = []
    for k in PREVIEW_KEYS:
        images.append(frame_at(rend, theta, k))
        print('кадр', k, 'θ = %.0f°' % np.degrees(theta(k / FRAMES)))
    save_sheet(images)


def ffmpeg(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def encode(frames_dir):
    pat = os.path.join(frames_dir, 'frame_%03d.png')
    base = os.path.join(OUT, 'swing_spin')
    # WebM VP9 с альфа-каналом — для сайтов и монтажа
    ffmpeg('-framerate', str(FPS), '-i', pat, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p',
           '-b:v', '0', '-crf', '24', '-row-mt', '1', '-auto-alt-ref', '0', base + '.webm')
    # ProRes 4444 с альфой — для After Effects / Premiere / DaVinci
    ffmpeg('-framerate', str(FPS), '-i', pat, '-c:v', 'prores_ks', '-profile:v', '4444',
           '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0', '-qscale:v', '9', base + '.mov')
    # анимированный WebP и APNG — полупрозрачные края сохраняются
    ffmpeg('-framerate', str(FPS), '-i', pat, '-c:v', 'libwebp_anim', '-lossless', '0',
           '-quality', '90', '-loop', '0', '-pix_fmt', 'yuva420p', base + '.webp')
    ffmpeg('-framerate', str(FPS), '-i', pat, '-plays', '0', '-f', 'apng', base + '.apng')
    # GIF: прозрачность только «да/нет»
    ffmpeg('-framerate', str(FPS), '-i', pat, '-filter_complex',
           '[0]split[a][b];[a]palettegen=reserve_transparent=1:stats_mode=full[p];'
           '[b][p]paletteuse=dither=none:alpha_threshold=128', '-loop', '0', base + '.gif')


def main(args):
    frame, swing, back = build_layers()
    rend = Renderer(frame, swing, back)
    theta = angle_curve()
    if '--preview' in args:
        preview(rend, theta)
        return
    frames_dir = os.path.join(OUT, 'frames')
    shutil.rmtree(frames_dir, ignore_errors=True)
    os.makedirs(frames_dir)
    keys = {}
    for k in range(FRAMES):
        img = frame_at(rend, theta, k)
        save_png(img, os.path.join(frames_dir, 'frame_%03d.png' % k))
        if k in PREVIEW_KEYS:
            keys[k] = img
        print('\rкадр %d/%d' % (k + 1, FRAMES), end='', flush=True)
    print()
    save_sheet([keys[k] for k in PREVIEW_KEYS])
    encode(frames_dir)
    print('готово:', OUT)


if __name__ == '__main__':
    main(sys.argv[1:])
