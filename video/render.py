"""Рендер ролика из films/<ролик>/.

  python render.py --film burglar                     # весь ролик → out/burglar/video.mp4 (4 процесса)
  python render.py --film burglar --from 60 --to 75   # кусок для проверки → out/burglar/preview.mp4
  python render.py --film burglar --stills 3.2,40,95  # кадры → out/burglar/stills/*.png и лист sheet.png
"""
import argparse
import importlib
import json
import multiprocessing as mp
import os
import subprocess
import time

import numpy as np
import skia

from engine import hud
from engine.core import BG, CX, CY, FPS, H, W, color, layer
from engine.fx import Post
from engine.stage import Stage

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.environ.get("FILM", "vacuum")


def paths(film=None):
    film = film or FILM
    return os.path.join(HERE, "build", film), os.path.join(HERE, "out", film)


def film_modules(film=None):
    film = film or FILM
    return (importlib.import_module(f"films.{film}.script"), importlib.import_module(f"films.{film}.scenes"))


def build_stage(film=None):
    build, _ = paths(film)
    script, scenes = film_modules(film)
    tl = json.load(open(os.path.join(build, "timeline.json")))
    S = Stage(tl)
    scenes.build(S)
    S.finalize()
    return S


class Renderer:
    def __init__(self):
        self.script, scenes = film_modules()
        self.S = build_stage()
        self.caps = hud.Captions(self.S.tl, scenes.NOCAP)
        self.post = Post()
        self.arr = np.zeros((H, W, 4), np.uint8)
        self.c = skia.Canvas(self.arr)
        self.rule_t = [self.S.at(f"r{n}") for n in range(1, 8)]

    def frame(self, i):
        S, c, t = self.S, self.c, i / FPS
        sc = S.scene_at(t)
        c.clear(color(BG))
        scale, cx, cy = S.camera(sc, t)
        sx, sy = S.shake_xy(t)
        c.save()
        # камера: точка (cx, cy) сцены оказывается в центре кадра
        c.translate(CX + sx, CY + sy)
        c.scale(scale, scale)
        c.translate(-cx, -cy)
        with layer(c, S.scene_alpha(sc, t)):
            sc.draw(c, t)
        c.restore()
        rule = sum(1 for rt in self.rule_t if t >= rt - 0.05)
        if sc.hud:
            hud.hud(c, t, rule, self.script.FILE_NO, self.script.AGENCY, done=max(0, rule - 1))
        if sc.captions:
            self.caps.draw(c, t)
        return self.post.apply(self.arr, t, i, glitch=S.glitch_amt(t), flash=S.flash_amt(t))


def encode_range(args):
    a, b, path = args
    r = Renderer()
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
                           "-crf", "19", "-maxrate", "10M", "-bufsize", "20M", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
    t = time.time()
    for i in range(a, b):
        ff.stdin.write(r.frame(i).tobytes())
        if (i - a) % 300 == 0:
            print(f"  [{os.path.basename(path)}] {i - a}/{b - a}  {time.time() - t:.0f}s", flush=True)
    ff.stdin.close()
    ff.wait()
    return path


def audio_path():
    build, _ = paths()
    mix = os.path.join(build, "mix.wav")
    return mix if os.path.exists(mix) else os.path.join(build, "voice.wav")


def render_video(t_from, t_to, out, workers):
    build, outdir = paths()
    os.makedirs(outdir, exist_ok=True)
    tmp = os.path.join(build, "segments")
    os.makedirs(tmp, exist_ok=True)
    a, b = int(t_from * FPS), int(t_to * FPS)
    n = max(1, workers)
    step = (b - a + n - 1) // n
    jobs = [(a + k * step, min(b, a + (k + 1) * step), os.path.join(tmp, f"seg{k:02d}.mp4"))
            for k in range(n) if a + k * step < b]
    with mp.Pool(len(jobs)) as pool:
        segs = pool.map(encode_range, jobs)
    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w") as f:
        for s in segs:
            f.write(f"file '{s}'\n")
    silent = os.path.join(tmp, "video_silent.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", silent],
                   check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", silent, "-ss", f"{t_from:.3f}", "-t", f"{t_to - t_from:.3f}",
                    "-i", audio_path(), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k",
                    "-shortest", "-movflags", "+faststart", out], check=True)
    print("→", out)


def stills(times, sheet=True):
    from PIL import Image
    _, outdir = paths()
    d = os.path.join(outdir, "stills")
    os.makedirs(d, exist_ok=True)
    r = Renderer()
    ims = []
    for t in times:
        img = r.frame(int(round(t * FPS)))
        p = os.path.join(d, f"t{t:07.2f}.png")
        Image.fromarray(img).save(p)
        ims.append(Image.fromarray(img).resize((480, 270)))
    if sheet and ims:
        cols = 4
        rows = (len(ims) + cols - 1) // cols
        sh = Image.new("RGB", (cols * 480, rows * 270))
        for k, im in enumerate(ims):
            sh.paste(im, ((k % cols) * 480, (k // cols) * 270))
        sh.save(os.path.join(outdir, "sheet.png"))
        print("→", os.path.join(outdir, "sheet.png"))


def main():
    global FILM
    ap = argparse.ArgumentParser()
    ap.add_argument("--film", default=FILM)
    ap.add_argument("--from", dest="t_from", type=float, default=None)
    ap.add_argument("--to", dest="t_to", type=float, default=None)
    ap.add_argument("--stills", default=None)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--out", default=None)
    args = ap.parse_args()
    FILM = os.environ["FILM"] = args.film  # дочерние процессы наследуют выбор ролика
    if args.stills:
        stills([float(x) for x in args.stills.split(",")])
        return
    build, outdir = paths()
    dur = json.load(open(os.path.join(build, "timeline.json")))["duration"]
    a = args.t_from or 0.0
    b = args.t_to or dur
    out = args.out or os.path.join(outdir, "video.mp4" if args.t_from is None and args.t_to is None else "preview.mp4")
    render_video(a, b, out, args.workers)


if __name__ == "__main__":
    main()
