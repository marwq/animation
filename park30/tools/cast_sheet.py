"""Лист персонажей: python3 tools/cast_sheet.py → docs/cast_sheet.png"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from scenes.kit import *  # noqa: E402,F401

s, ctx = D.surface(W, H)
D.vgrad(ctx, 0, 0, W, H, [(0, "#5ab8f0"), (0.62, "#bfe8fa"), (0.62, "#8f98a4"), (1, "#7a838e")])
D.text(ctx, "LAKESHORE INTERNATIONAL — CAST", W / 2, 90, 64, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=10)
cast = [("DANNY", R.DANNY, "front", "smile", {}), ("DANNY", R.DANNY, "side", "happy", {}),
        ("DAY 7+", R.DANNY_JACKET, "front", "determined", {}), ("PILOT DANNY", R.DANNY_PILOT, "side", "laugh", {}),
        ("WALT", R.WALT, "front", "smile", {}), ("GRANDMA JUNE", R.JUNE, "front", "smile", {})]
for i, (name, L, view, face, extra) in enumerate(cast):
    x = 150 + i * 220
    p = R.stand(view, 0.4 * i, i)
    p.update(face=face, **extra)
    R.Fig(L).draw(ctx, x, 560, 105, 1, p)
    D.text(ctx, name, x, 615, 27, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=7)
draw_lab(ctx, 1500, 560, 150, -1, dog_pose(0.3, "stand", wag=1.0))
D.text(ctx, "PICKLES", 1490, 615, 34, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=7)
draw_lab(ctx, 1700, 560, 120, -1, dog_pose(0.3, "sit", headset=True))
draw_parrot(ctx, 1830, 560, 130, -1, 0.2, talk=1.0)
D.text(ctx, "ROGER", 1830, 615, 30, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=7)
kinds = ["traveler", "business", "pajamas", "attendant", "pilot", "tsa", "ramp", "tourist", "kid", "grandma",
         "traveler", "attendant", "business"]
for i, k in enumerate(kinds):
    L = R.zombie_look(700 + i * 3, k)
    p = zombie_reach(0.3 * i, i) if i % 2 else zombie_idle(0.3 * i, i)
    x = 110 + i * 140
    R.Fig(L).draw(ctx, x, 1010, 80, 1 if i % 2 else -1, p)
    if i in (1, 6, 11):
        suitcase(ctx, x + 70, 1010, 0.55, BRIGHT[i % len(BRIGHT)] if False else "#e8423c")
s.write_to_png(os.path.join(ROOT, "docs", "cast_sheet.png"))
print("docs/cast_sheet.png")
