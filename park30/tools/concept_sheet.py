"""Лист концептов персонажей: виды, эмоции, цикл шага. Пишет PNG в docs/."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine import draw as D
from engine import rig as R
from engine.dog import draw_dog, dog_pose
from engine.core import hexrgb

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPER = hexrgb("#f3e7d0")


def label(ctx, s, x, y, size=34):
    D.text(ctx, s, x, y, size, D.FONT_HAND, D.INK)


def ground(ctx, x0, x1, y):
    D.line(ctx, x0, y, x1, y, hexrgb("#cdbb9a"), 3)


def sheet_main(path):
    W, H = 2400, 1700
    surf, ctx = D.surface(W, H)
    D.col(ctx, PAPER)
    ctx.paint()
    D.text(ctx, "LIBERTY MALL — CHARACTERS", 60, 80, 56, D.FONT_TITLE, D.INK, "left")
    hero = R.Fig(R.HERO)
    s = 105
    gy = 640
    ground(ctx, 60, 1300, gy)
    hero.draw(ctx, 200, gy, s, 1, R.stand("front", 0.4))
    hero.draw(ctx, 460, gy, s, 1, R.stand("side", 0.4))
    hero.draw(ctx, 720, gy, s, 1, R.stand("back", 0.4))
    p = R.stand("front", 0.4)
    p["hturn"] = 0.8
    hero.draw(ctx, 980, gy, s, 1, p)
    for i, (tx, x) in enumerate((("front", 200), ("side", 460), ("back", 720), ("3/4 head", 980))):
        label(ctx, tx, x, gy + 50)
    D.text(ctx, "HERO — night janitor (\"you\")", 60, 160, 40, D.FONT_HAND, D.INK, "left")
    # эмоции крупно
    exs = ["neutral", "happy", "laugh", "scared", "scream", "sad", "cry", "determined", "eat", "sleep"]
    D.text(ctx, "expressions", 1360, 160, 40, D.FONT_HAND, D.INK, "left")
    for i, ex in enumerate(exs):
        x = 1430 + (i % 5) * 190
        y = 300 + (i // 5) * 250
        p = {"view": "front", "face": ex, "blink": 0, "tears_t": 0.3, "hturn": 0.0, "neck_line": False}
        if ex == "eat":
            p["mouth"] = 0.6
        hero.head_only(ctx, x, y, 150, 1, p)
        label(ctx, ex, x, y + 112, 28)
    # цикл шага
    gy2 = 1080
    ground(ctx, 60, 2340, gy2)
    D.text(ctx, "walk cycle (8 frames) — feet stay planted, arms counter-swing", 60, 760, 36, D.FONT_HAND, D.INK, "left")
    for i in range(8):
        ph = i / 8
        hero.draw(ctx, 140 + i * 165, gy2, 78, 1, R.gait(ph, "walk"))
    D.text(ctx, "run", 1460, 760, 36, D.FONT_HAND, D.INK, "left")
    for i in range(5):
        hero.draw(ctx, 1480 + i * 180, gy2, 78, 1, R.gait(i / 5, "run"))
    # остальные
    gy3 = 1560
    ground(ctx, 60, 2340, gy3)
    others = [(R.ROSA, "Rosa"), (R.MOM, "Mom"), (R.LILY, "Lily"), (R.GUS, "Gus (guard)"), (R.GUS_Z, "Gus — zombie"),
              (R.LIBERTY, "\"Lady Liberty\""), (R.SOLDIER, "soldier")]
    for i, (lk, nm) in enumerate(others):
        x = 160 + i * 200
        f = R.Fig(lk)
        pose = R.stand("front", 0.7, seed=i)
        if lk.zombie:
            pose = R.gait(0.2, "shamble", "side")
        f.draw(ctx, x, gy3, 80, 1, pose)
        label(ctx, nm, x, gy3 + 45, 28)
    draw_dog(ctx, 1600, gy3, 95, 1, dog_pose(0.2, "stand"))
    label(ctx, "Pretzel", 1600, gy3 + 45, 28)
    draw_dog(ctx, 1800, gy3, 95, 1, dog_pose(0.2, "sit", bark=1.0))
    label(ctx, "bark", 1800, gy3 + 45, 28)
    for i in range(3):
        f = R.Fig(R.zombie_look(100 + i))
        f.draw(ctx, 2000 + i * 130, gy3, 70, -1, R.gait(i * 0.3, "shamble", "side", seed=i))
    label(ctx, "zombies", 2130, gy3 + 45, 28)
    surf.write_to_png(path)


if __name__ == "__main__":
    out = os.path.join(ROOT, "docs", "characters_sheet.png")
    sheet_main(out)
    print(out)
