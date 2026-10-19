"""Рендер: кадр по глобальному времени, кадры в ffmpeg, стоп-кадры для проверки. Без субтитров и счётчиков."""
import subprocess
import time

import cairo

from .core import W, H, FPS, clamp
from . import fx
from . import draw as D


class Film:
    def __init__(self, segments):
        self.segments = segments
        t = 0.0
        for s in segments:
            s.start = t
            s.finalize()
            t += s.dur
        self.dur = t

    def seg_at(self, T):
        for i, s in enumerate(self.segments):
            if T < s.start + s.dur or i == len(self.segments) - 1:
                return i, s
        return len(self.segments) - 1, self.segments[-1]


def _draw_shot(ctx, shot, t, S):
    ctx.save()
    try:
        shot.fn(ctx, t, S)
    finally:
        ctx.restore()


def render_frame(film, ctx, T, frame=0):
    i, S = film.seg_at(T)
    st = T - S.start
    shot = S.shot_at(st)
    t = st - shot.start
    idx = S.shots.index(shot)
    prev = S.shots[idx - 1] if idx > 0 else None
    nxt = S.shots[idx + 1] if idx + 1 < len(S.shots) else None
    D.col(ctx, (0, 0, 0))
    ctx.paint()
    if shot.trans == "fade" and prev is not None and t < shot.tlen:
        _draw_shot(ctx, prev, prev.dur + t, S)
        ctx.push_group()
        _draw_shot(ctx, shot, t, S)
        ctx.pop_group_to_source()
        ctx.paint_with_alpha(clamp(t / shot.tlen))
    else:
        _draw_shot(ctx, shot, t, S)
    if shot.trans in ("black", "white") and t < shot.tlen:
        fx.flash(ctx, 1 - t / shot.tlen, "#000000" if shot.trans == "black" else "#ffffff")
    if nxt is not None and nxt.trans in ("black", "white") and t > shot.dur - nxt.tlen:
        fx.flash(ctx, (t - (shot.dur - nxt.tlen)) / nxt.tlen, "#000000" if nxt.trans == "black" else "#ffffff")
    # затемнение в начале и в конце фильма
    if T < 0.5:
        fx.flash(ctx, 1 - T / 0.5, "#000000")
    if T > film.dur - 0.6:
        fx.flash(ctx, (T - (film.dur - 0.6)) / 0.6, "#000000")


def open_ffmpeg(out, fps=FPS, crf=16):
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}", "-r", str(fps),
           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p", out]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)


def render_range(film, f0, f1, out, fps=FPS, step=1):
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    proc = open_ffmpeg(out, fps / step)
    t0 = time.time()
    for fr in range(f0, f1, step):
        ctx.save()
        render_frame(film, ctx, fr / fps, fr)
        ctx.restore()
        surf.flush()
        proc.stdin.write(bytes(surf.get_data()))
        if (fr - f0) % 300 == 0:
            print(f"[{out}] frame {fr} ({(fr - f0) / max(time.time() - t0, 1e-6):.1f} fps)", flush=True)
    proc.stdin.close()
    proc.wait()


def still(film, T, path):
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    render_frame(film, ctx, T, int(T * FPS))
    surf.write_to_png(path)
