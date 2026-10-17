"""Обложка для YouTube: python thumbnail.py --film burglar → out/<ролик>/thumbnail.png (1280×720)."""
import argparse
import importlib
import os

import numpy as np
import skia
from PIL import Image

from engine.core import BG, H, W, color
from engine.fx import Post

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--film", default="vacuum")
    args = ap.parse_args()
    arr = np.zeros((H, W, 4), np.uint8)
    c = skia.Canvas(arr)
    c.clear(color(BG))
    importlib.import_module(f"films.{args.film}.thumb").draw(c)
    img = Post().apply(arr, 0.0, 0, bloom=0.7)
    out = os.path.join(HERE, "out", args.film)
    os.makedirs(out, exist_ok=True)
    Image.fromarray(img).resize((1280, 720), Image.LANCZOS).save(os.path.join(out, "thumbnail.png"))
    print("→", os.path.join(out, "thumbnail.png"))


if __name__ == "__main__":
    main()
