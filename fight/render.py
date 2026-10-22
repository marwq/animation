"""Рендер ролика в MP4 (H.264, без звука) и листы кадров для проверки.

    python3 render.py skeleton_vs_lord                 # видео в export/
    python3 render.py skeleton_vs_lord --sheet 0 600 6 # лист кадров каждые 0,25 с
    python3 render.py skeleton_vs_lord --frames 135 458 # отдельные кадры PNG
"""
import argparse
import importlib
import multiprocessing as mp
import os
import subprocess
import sys

import cairo

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1920, 1080, 24
_film = None


def _load(name):
    global _film
    if _film is None:
        sys.path.insert(0, HERE)
        _film = importlib.import_module('film_' + name).Film()
    return _film


def frame_surface(name, f):
    film = _load(name)
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    film.draw(ctx, f)
    surf.flush()
    return surf


def _raw(args):
    name, f = args
    return bytes(frame_surface(name, f).get_data())


def video(name, out, workers=4):
    film = _load(name)
    n = film.frames
    os.makedirs(os.path.dirname(out), exist_ok=True)
    cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgra',
           '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
           '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
           '-movflags', '+faststart', '-an', out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with mp.Pool(workers) as pool:
        for i, data in enumerate(pool.imap(_raw, [(name, f) for f in range(n)], chunksize=2)):
            p.stdin.write(data)
            if i % 48 == 0:
                print(f'  кадр {i}/{n}', flush=True)
    p.stdin.close()
    p.wait()
    print('готово:', out)


def _thumb(args):
    name, f, tw = args
    s = frame_surface(name, f)
    th = int(tw * H / W)
    t = cairo.ImageSurface(cairo.FORMAT_ARGB32, tw, th)
    c = cairo.Context(t)
    c.scale(tw / W, th / H)
    c.set_source_surface(s, 0, 0)
    c.paint()
    t.flush()
    return f, bytes(t.get_data()), t.get_stride(), th


def sheet(name, a, b, step, out, cols=6, tw=480):
    """Лист кадров с номерами (номера — только на листе проверки, не в ролике)."""
    frames = list(range(a, b, step))
    with mp.Pool(4) as pool:
        thumbs = pool.map(_thumb, [(name, f, tw) for f in frames])
    th = thumbs[0][3]
    rows = (len(frames) + cols - 1) // cols
    S = cairo.ImageSurface(cairo.FORMAT_RGB24, cols * tw, rows * (th + 4))
    c = cairo.Context(S)
    c.set_source_rgb(0, 0, 0)
    c.paint()
    for i, (f, data, stride, th_) in enumerate(thumbs):
        t = cairo.ImageSurface.create_for_data(bytearray(data), cairo.FORMAT_ARGB32, tw, th_, stride)
        x, y = (i % cols) * tw, (i // cols) * (th + 4)
        c.set_source_surface(t, x, y)
        c.paint()
        c.set_source_rgba(0, 0, 0, 0.6)
        c.rectangle(x, y, 92, 26)
        c.fill()
        c.set_source_rgb(1, 1, 0)
        c.select_font_face('DejaVu Sans')
        c.set_font_size(18)
        c.move_to(x + 5, y + 19)
        c.show_text(f'{f} {f / FPS:.2f}s')
    S.write_to_png(out)
    print('лист:', out)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('name')
    ap.add_argument('--out')
    ap.add_argument('--sheet', nargs=3, type=int)
    ap.add_argument('--frames', nargs='+', type=int)
    ap.add_argument('--dir', default=os.path.join(HERE, 'export'))
    a = ap.parse_args()
    if a.sheet:
        sheet(a.name, *a.sheet, a.out or os.path.join(a.dir, f'{a.name}_sheet.png'))
    elif a.frames:
        os.makedirs(a.dir, exist_ok=True)
        for f in a.frames:
            frame_surface(a.name, f).write_to_png(os.path.join(a.dir, f'{a.name}_{f:03d}.png'))
    else:
        video(a.name, a.out or os.path.join(a.dir, f'{a.name}.mp4'))
