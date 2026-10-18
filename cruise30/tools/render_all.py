"""Рендер всего ролика: по файлу на сегмент (параллельно), склейка, звук.

python tools/render_all.py [--jobs 4] [--only d01,d02] [--force]
  → build/render/<сегмент>.mp4, build/video_noaudio.mp4, build/LibertyMall_30days.mp4
Уже отрендеренные сегменты пропускаются, если файл новее сцен и тайминга (или нет --force).
"""
import argparse
import os
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
RDIR = os.path.join(ROOT, "build", "render")
FPS = 30

_FILM = None


def _init():
    global _FILM
    sys.path.insert(0, ROOT)
    from scenes import timeline
    _FILM = timeline.build()


def _render(key):
    from engine import render
    seg = next(s for s in _FILM.segments if s.key == key)
    f0 = int(round(seg.start * FPS))
    f1 = int(round((seg.start + seg.dur) * FPS))
    out = os.path.join(RDIR, key + ".mp4")
    tmp = out + ".part.mp4"
    t = time.time()
    render.render_range(_FILM, f0, f1, tmp, FPS)
    os.replace(tmp, out)
    with open(os.path.join(RDIR, key + ".sig"), "w") as fh:
        fh.write(timing_sig(key))
    return key, f1 - f0, time.time() - t


def timing_sig(key):
    import hashlib
    import json
    p = os.path.join(ROOT, "build", "voice", "timing.json")
    if not os.path.exists(p):
        return "none"
    seg = json.load(open(p))["segments"].get(key)
    return hashlib.md5(json.dumps(seg, sort_keys=True).encode()).hexdigest() if seg else "none"


def stale(key):
    """Сегмент перерисовывается, если файла нет или изменилась его разметка озвучки."""
    out = os.path.join(RDIR, key + ".mp4")
    sig = os.path.join(RDIR, key + ".sig")
    if not os.path.exists(out) or not os.path.exists(sig):
        return True
    return open(sig).read().strip() != timing_sig(key)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", type=int, default=4)
    ap.add_argument("--only", default="")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--no-mux", action="store_true")
    a = ap.parse_args()
    os.makedirs(RDIR, exist_ok=True)
    from scenes import timing
    keys = a.only.split(",") if a.only else timing.ORDER
    todo = [k for k in keys if a.force or stale(k)]
    # тяжёлые сегменты — первыми
    heavy = ["d01", "cold", "d28", "d29", "d25", "d21", "d30", "d10"]
    todo.sort(key=lambda k: (k not in heavy, timing.ORDER.index(k)))
    print("render:", todo, flush=True)
    if todo:
        with ProcessPoolExecutor(a.jobs, initializer=_init) as ex:
            futs = [ex.submit(_render, k) for k in todo]
            for f in as_completed(futs):
                k, n, dt = f.result()
                print(f"done {k}: {n} frames in {dt:.0f}s ({n / dt:.1f} fps)", flush=True)
    if a.no_mux or a.only:
        return
    lst = os.path.join(RDIR, "list.txt")
    with open(lst, "w") as fh:
        for k in timing.ORDER:
            fh.write(f"file '{os.path.join(RDIR, k + '.mp4')}'\n")
    vid = os.path.join(ROOT, "build", "video_noaudio.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", vid],
                   check=True)
    mix = os.path.join(ROOT, "build", "audio", "mix.wav")
    final = os.path.join(ROOT, "build", "LibertyMall_30days.mp4")
    if os.path.exists(mix):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vid, "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v",
                        "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", final],
                       check=True)
        print(final)


if __name__ == "__main__":
    main()
