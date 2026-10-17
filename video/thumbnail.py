"""Обложка для YouTube: out/thumbnail.png (1280×720)."""
import os

import numpy as np
import skia
from PIL import Image

from engine import kit as K
from engine import picto as P
from engine.core import BG, H, RED, SOFT, W, WHITE, color, draw_text, font, glow_circle, paint, xf
from engine.fx import Post

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    arr = np.zeros((H, W, 4), np.uint8)
    c = skia.Canvas(arr)
    c.clear(color(BG))
    fl = 900
    with xf(c, 0, 0):
        K.floor(c, fl, 60, 1860, w=7)
        P.window(c, 420, 300, 200)
        P.bed(c, 640, fl, 900, zz=0.35)
        v = P.vacuum_side(c, 1330, fl, 420, led=RED)
        K.laser(c, v["lidar"][0], v["lidar"][1], 1092, v["lidar"][1], 1.0, w=5)
        glow_circle(c, v["led"][0], v["led"][1], 22, RED, 1.0, spread=4)
    f1 = font(150, "bold")
    draw_text(c, "DO NOT", 1340, 260, f1, paint(RED, 0.5, blur=20), "center", tracking=6)
    draw_text(c, "DO NOT", 1340, 260, f1, paint(RED), "center", tracking=6)
    draw_text(c, "GET UP", 1340, 420, f1, paint(WHITE), "center", tracking=6)
    draw_text(c, "RULE 1 OF 7", 1340, 500, font(40, "bold"), paint(SOFT), "center", tracking=10)
    img = Post().apply(arr, 0.0, 0, bloom=0.7)
    Image.fromarray(img).resize((1280, 720), Image.LANCZOS).save(os.path.join(HERE, "out", "thumbnail.png"))
    print("→ out/thumbnail.png")


if __name__ == "__main__":
    main()
