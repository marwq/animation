"""Рендер: python3 tools/render_all.py [ключи...] [--jobs N] [--name имя] → build/<имя>.mp4 (видео + звук)."""
import os
import subprocess
import sys
from multiprocessing import Process

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from engine.core import FPS  # noqa: E402
from engine.render import render_range  # noqa: E402
from scenes import timeline  # noqa: E402

BUILD = os.path.join(ROOT, "build")


def part(only, f0, f1, out):
    film = timeline.build(only)
    render_range(film, f0, f1, out)


def main():
    args = sys.argv[1:]
    jobs, name = 4, "Greenleaf_30days"
    if "--jobs" in args:
        i = args.index("--jobs")
        jobs = int(args[i + 1])
        del args[i:i + 2]
    if "--name" in args:
        i = args.index("--name")
        name = args[i + 1]
        del args[i:i + 2]
    only = args or None
    film = timeline.build(only)
    n = int(round(film.dur * FPS))
    os.makedirs(os.path.join(BUILD, "parts"), exist_ok=True)
    bounds = [n * k // jobs for k in range(jobs + 1)]
    outs = [os.path.join(BUILD, "parts", f"{name}_{k:02d}.mp4") for k in range(jobs)]
    ps = [Process(target=part, args=(only, bounds[k], bounds[k + 1], outs[k])) for k in range(jobs)]
    for p in ps:
        p.start()
    for p in ps:
        p.join()
    lst = os.path.join(BUILD, "parts", name + ".txt")
    with open(lst, "w") as f:
        for o in outs:
            f.write(f"file '{o}'\n")
    subprocess.run(["python3", os.path.join(ROOT, "tools", "audio.py")] + (only or []), check=True)
    out = os.path.join(BUILD, name + ".mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst,
                    "-i", os.path.join(BUILD, "audio", "mix.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                    "-af", "alimiter=limit=0.89:level=false", "-c:a", "aac", "-b:a", "256k", "-shortest",
                    "-movflags", "+faststart", out], check=True)
    print(out)


if __name__ == "__main__":
    main()
