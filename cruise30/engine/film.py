"""Камера, планы (shots), сегменты дней и кэш фонов."""
import math
from collections import OrderedDict
import cairo
from .core import W, H, FPS, Keys, lerp, clamp, noise1, fbm, ease_io


def K(v):
    """Число/кортеж или Keys → функция времени."""
    if callable(v):
        return v
    return lambda t: v


class Cam:
    """Камера: центр кадра (x, y) в мировых координатах, zoom, поворот (рад), тряска.

    Параллакс: слой с коэффициентом p смещается на p от движения камеры
    относительно опорной точки anchor (по умолчанию положение в t=0).
    """

    def __init__(self, x=960, y=540, z=1.0, r=0.0, shake=0.0, anchor=None, drift=0.0):
        self.x, self.y, self.z, self.r = K(x), K(y), K(z), K(r)
        self.shake = K(shake)
        self.anchor = anchor
        self.drift = drift          # лёгкий «дыхательный» дрейф ручной камеры

    def at(self, t):
        x, y, z, r = self.x(t), self.y(t), self.z(t), self.r(t)
        a = self.shake(t)
        if a:
            x += fbm(t * 9.0, 11) * 26 * a
            y += fbm(t * 9.0, 23) * 20 * a
            r += fbm(t * 7.0, 37) * 0.02 * a
        if self.drift:
            x += noise1(t * 0.4, 3) * 6 * self.drift
            y += noise1(t * 0.4, 7) * 4 * self.drift
        return x, y, z, r

    def apply(self, ctx, t, p=1.0):
        x, y, z, r = self.at(t)
        ax, ay = self.anchor if self.anchor else (self.x(0), self.y(0))
        zp = 1 + (z - 1) * p if p != 1 else z
        ctx.translate(W / 2, H / 2)
        ctx.scale(zp, zp)
        if r:
            ctx.rotate(r * p)
        ctx.translate(-(ax + (x - ax) * p), -(ay + (y - ay) * p))

    def to_screen(self, t, wx, wy, p=1.0):
        x, y, z, r = self.at(t)
        ax, ay = self.anchor if self.anchor else (self.x(0), self.y(0))
        zp = 1 + (z - 1) * p
        dx, dy = wx - (ax + (x - ax) * p), wy - (ay + (y - ay) * p)
        c, s = math.cos(r * p), math.sin(r * p)
        return W / 2 + zp * (dx * c - dy * s), H / 2 + zp * (dx * s + dy * c)


class layer:
    """with layer(ctx, cam, t, p): рисование в координатах мира с параллаксом p."""

    def __init__(self, ctx, cam, t, p=1.0):
        self.ctx, self.cam, self.t, self.p = ctx, cam, t, p

    def __enter__(self):
        self.ctx.save()
        self.cam.apply(self.ctx, self.t, self.p)
        return self.ctx

    def __exit__(self, *a):
        self.ctx.restore()


# --- кэш растровых фонов ----------------------------------------------------

_CACHE = OrderedDict()
_CACHE_BYTES = [0]
CACHE_LIMIT = 1500 * 1024 * 1024


def cached(key, x0, y0, w, h, fn, scale=1.0):
    """Отрисовать fn(ctx) в мировом прямоугольнике (x0, y0, w, h) один раз и запомнить."""
    k = (key, x0, y0, w, h, scale)
    if k in _CACHE:
        _CACHE.move_to_end(k)
        return _CACHE[k]
    pw, ph = int(math.ceil(w * scale)), int(math.ceil(h * scale))
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, pw, ph)
    c = cairo.Context(surf)
    c.scale(scale, scale)
    c.translate(-x0, -y0)
    fn(c)
    surf.flush()
    item = (surf, x0, y0, scale)
    _CACHE[k] = item
    _CACHE_BYTES[0] += pw * ph * 4
    while _CACHE_BYTES[0] > CACHE_LIMIT and len(_CACHE) > 1:
        _, (s, *_r) = _CACHE.popitem(last=False)
        _CACHE_BYTES[0] -= s.get_width() * s.get_height() * 4
    return item


def blit(ctx, item, alpha=1.0, filt=cairo.FILTER_GOOD):
    surf, x0, y0, scale = item
    ctx.save()
    ctx.translate(x0, y0)
    ctx.scale(1 / scale, 1 / scale)
    ctx.set_source_surface(surf, 0, 0)
    ctx.get_source().set_filter(filt)
    if alpha >= 1:
        ctx.paint()
    else:
        ctx.paint_with_alpha(alpha)
    ctx.restore()


def bg(ctx, key, rect, fn, scale=1.0, alpha=1.0):
    """Нарисовать кэшированный фон."""
    blit(ctx, cached(key, *rect, fn, scale), alpha)


# --- планы и сегменты --------------------------------------------------------

class Shot:
    """План: начало (сек от начала сегмента) и функция fn(ctx, t, S).

    S — объект сегмента (S.dur, S.cue(i), S.day и т. д.), t — время от начала плана.
    trans: 'cut' | 'fade' | 'black' | 'white' | 'whip' — переход В этот план.
    """

    def __init__(self, start, fn, trans="cut", tlen=0.35, name=""):
        self.start, self.fn, self.trans, self.tlen, self.name = start, fn, trans, tlen, name
        self.dur = None


class Segment:
    def __init__(self, key, dur, day=None, tod="day", shots=None, cues=None, tods=None):
        self.key, self.dur, self.day, self.tod = key, dur, day, tod
        self.shots = shots or []
        self.cues = cues or []      # [(начало, конец), ...] реплик озвучки
        self.tods = tods            # [(t, 'night'), ...] смена значка солнца/луны
        self.start = 0.0
        self.sfx = []               # [(t, имя, громкость)] — звуковые события от начала сегмента
        self.music = None           # настроение музыки сегмента

    def cue(self, i, end=False):
        if not self.cues:
            return 0.0
        i = max(0, min(i, len(self.cues) - 1))
        return self.cues[i][1 if end else 0]

    def finalize(self):
        self.shots.sort(key=lambda s: s.start)
        for a, b in zip(self.shots, self.shots[1:]):
            a.dur = b.start - a.start
        if self.shots:
            self.shots[-1].dur = self.dur - self.shots[-1].start

    def shot_at(self, t):
        cur = self.shots[0]
        for s in self.shots:
            if s.start <= t + 1e-9:
                cur = s
        return cur

    def tod_at(self, t):
        if not self.tods:
            return self.tod
        cur = self.tods[0][1]
        for tt, v in self.tods:
            if t >= tt:
                cur = v
        return cur
