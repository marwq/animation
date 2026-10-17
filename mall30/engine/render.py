"""Рендер: кадр по глобальному времени, кадры в ffmpeg, стоп-кадры для проверки."""
import argparse
import math
import os
import subprocess
import sys
import time

import cairo

from .core import W, H, FPS, clamp
from . import fx, overlay
from . import draw as D

SHOW_CAPTIONS = True


class Film:
    def __init__(self, segments, captions=None):
        self.segments = segments
        t = 0.0
        for s in segments:
            s.start = t
            s.finalize()
            t += s.dur
        self.dur = t
        self.captions = captions or {}   # key -> [(текст, начало, конец)] от начала сегмента

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


def render_frame(film, ctx, T, frame):
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
    elif shot.trans == "whip" and prev is not None and t < shot.tlen / 2:
        _whip(ctx, prev, prev.dur + t, S, -1, 1 - t / (shot.tlen / 2))
    elif shot.trans == "whip" and t < shot.tlen:
        _whip(ctx, shot, t, S, 1, 1 - (t - shot.tlen / 2) / (shot.tlen / 2))
    else:
        _draw_shot(ctx, shot, t, S)
    # затемнения на стыках
    if shot.trans in ("black", "white") and t < shot.tlen:
        fx.flash(ctx, 1 - t / shot.tlen, "#000000" if shot.trans == "black" else "#ffffff")
    if nxt is not None and nxt.trans in ("black", "white") and t > shot.dur - nxt.tlen:
        fx.flash(ctx, (t - (shot.dur - nxt.tlen)) / nxt.tlen, "#000000" if nxt.trans == "black" else "#ffffff")
    # переход между сегментами (дни): затемнение не делаем — режем по счётчику
    fx.paper_and_grain(ctx, frame, grain=getattr(S, "grain", 0.085), paper=getattr(S, "paper", 0.5),
                       vignette=getattr(S, "vignette", 0.9))
    # надписи
    if getattr(S, "show_day", True) and not getattr(shot, "hide_day", False):
        prev_day = film.segments[i - 1].day if i > 0 else None
        tod = S.tod_at(st)
        tod_prev, t_tod = None, 99.0
        if S.tods:
            for k, (tt, v) in enumerate(S.tods):
                if st >= tt and k > 0:
                    tod_prev, t_tod = S.tods[k - 1][1], st - tt
        elif prev_day is not None and st < 0.6:
            tod_prev, t_tod = film.segments[i - 1].tod_at(film.segments[i - 1].dur), st
        overlay.day_counter(ctx, S.day, st, tod, tod_prev, t_tod, prev_day)
    if SHOW_CAPTIONS and S.key in film.captions and not getattr(shot, "hide_caps", False):
        overlay.caption(ctx, film.captions[S.key], st)


def _whip(ctx, shot, t, S, direction, k):
    """Смаз при резкой панораме: несколько сдвинутых копий."""
    k = clamp(k)
    ctx.push_group()
    _draw_shot(ctx, shot, t, S)
    pat = ctx.pop_group()
    n = 7
    off = (1 - k) * W * 0.25 * direction
    blur = (1 - k) * 160 + 20
    for j in range(n):
        ctx.save()
        ctx.translate(off + (j / (n - 1) - 0.5) * blur, 0)
        ctx.set_source(pat)
        ctx.paint_with_alpha(1.0 / n * 1.6 if j else 1.0)
        ctx.restore()


def open_ffmpeg(out, fps=FPS, crf=17):
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}", "-r", str(fps),
           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p",
           "-tune", "animation", out]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)


def render_range(film, f0, f1, out, fps=FPS, step=1):
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    proc = open_ffmpeg(out, fps / step)
    t0 = time.time()
    for fr in range(f0, f1, step):
        T = fr / fps
        ctx.save()
        render_frame(film, ctx, T, fr)
        ctx.restore()
        surf.flush()
        proc.stdin.write(bytes(surf.get_data()))
        if (fr - f0) % 300 == 0:
            el = time.time() - t0
            print(f"[{out}] frame {fr} ({(fr - f0) / max(el, 1e-6):.1f} fps)", flush=True)
    proc.stdin.close()
    proc.wait()


def still(film, T, path):
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    render_frame(film, ctx, T, int(T * FPS))
    surf.write_to_png(path)
