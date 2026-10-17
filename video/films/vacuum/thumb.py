"""Обложка ролика про пылесос."""
from engine import kit as K
from engine import picto as P
from engine.core import RED, SOFT, WHITE, draw_text, font, glow_circle, paint, xf


def draw(c):
    fl = 900
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
