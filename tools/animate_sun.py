"""Лёгкое движение солнечных лучей: 1 секунда, бесшовный цикл.

Центральный круг (чёрный диск и жёлтое кольцо вокруг него) не меняется ни на пиксель:
смещение равно нулю внутри радиуса PROTECT и плавно нарастает к кончикам лучей.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "animations" / "sun"
FPS = 30
SECONDS = 1.0

src = np.asarray(Image.open(OUT / "sun.png").convert("RGB")).astype(np.float32)
H, W, _ = src.shape

# Центр и радиус диска — самая большая чёрная область, не касающаяся краёв.
dark = src[..., 0] < 128
lab, n = ndimage.label(dark)
sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
disc = lab == (np.argsort(sizes)[-2] + 1)
ys, xs = np.nonzero(disc)
cx, cy = xs.mean(), ys.mean()
r_disc = np.sqrt(len(xs) / np.pi)

PROTECT = r_disc + 16      # кольцо целиком внутри — здесь смещение строго 0
RAMP = 90                  # на этом отрезке движение плавно набирает силу

yy, xx = np.mgrid[:H, :W].astype(np.float32)
dx, dy = xx - cx, yy - cy
rho = np.hypot(dx, dy)
theta = np.arctan2(dy, dx)

u = np.clip((rho - PROTECT) / RAMP, 0, 1)
weight = u * u * (3 - 2 * u)  # smoothstep


def frame(t):
    p = 2 * np.pi * t  # фаза цикла, t ∈ [0, 1)
    # Волна изгиба бежит от основания к кончику — лучи мягко «колышутся».
    sway = (0.030 * np.sin(p - rho / 38 + 3 * theta)
            + 0.014 * np.sin(2 * p + 5 * theta + 1.3))
    # Лёгкое «дыхание»: лучи чуть вытягиваются и втягиваются.
    breathe = 5.0 * np.sin(p + 2 * theta + 0.7)
    th = theta - weight * sway
    r = rho - weight * breathe
    sx = cx + r * np.cos(th)
    sy = cy + r * np.sin(th)
    out = np.empty_like(src)
    for c in range(3):
        out[..., c] = ndimage.map_coordinates(src[..., c], [sy, sx], order=1,
                                              mode="constant", cval=0)
    inside = rho < PROTECT
    out[inside] = src[inside]  # круг — точная копия оригинала
    return np.clip(out + 0.5, 0, 255).astype(np.uint8)


frames_dir = OUT / "frames"
frames_dir.mkdir(exist_ok=True)
count = int(FPS * SECONDS)
frames = []
for i in range(count):
    img = Image.fromarray(frame(i / count))
    img.save(frames_dir / f"{i:03d}.png")
    frames.append(img)

frames[0].save(OUT / "sun.gif", save_all=True, append_images=frames[1:],
               duration=int(1000 / FPS), loop=0, optimize=True)

pattern = str(frames_dir / "%03d.png")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS),
                "-i", pattern, "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16",
                "-movflags", "+faststart", str(OUT / "sun.mp4")], check=True)
print(f"{count} кадров, центр ({cx:.1f}, {cy:.1f}), r={r_disc:.1f}", file=sys.stderr)
