"""Обложка ролика про грабителя: лестница вниз, фонарь снизу, крупная надпись."""
import skia

from engine import picto as P
from engine import picto2 as Q
from engine.core import RED, SOFT, WHITE, draw_text, font, paint


def draw(c):
    # лестница: сверху слева вниз направо
    p = skia.Path()
    x, y = 120, 380
    p.moveTo(x, y)
    for k in range(9):
        p.lineTo(x + 80, y)
        x += 80
        p.lineTo(x, y + 70)
        y += 70
    c.drawPath(p, paint(WHITE, stroke=10, join="miter"))
    # грабитель внизу светит вверх по лестнице
    Q.burglar(c, 930, 1010, 330, dict(armF=-110, foreF=-20), facing=-1, torch=1.0, torch_ang=-38, torch_len=2.6)
    # герой наверху, у края
    P.person_side(c, 190, 380, 250, Q.poses()["listen"], facing=1)
    f1 = font(150, "bold")
    draw_text(c, "DO NOT", 1450, 300, f1, paint(RED, 0.5, blur=20), "center", tracking=6)
    draw_text(c, "DO NOT", 1450, 300, f1, paint(RED), "center", tracking=6)
    draw_text(c, "GO DOWN", 1450, 460, f1, paint(WHITE), "center", tracking=6)
    draw_text(c, "RULE 1 OF 7", 1450, 540, font(40, "bold"), paint(SOFT), "center", tracking=10)
