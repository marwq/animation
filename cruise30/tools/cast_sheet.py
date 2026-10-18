"""Лист персонажей: python3 tools/cast_sheet.py → docs/cast_sheet.png"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from engine import rig as R, draw as D  # noqa: E402
from engine.cat import draw_cat, cat_pose  # noqa: E402
from engine.core import W, H, hexrgb  # noqa: E402
from sets import deck as DK  # noqa: E402

s, ctx = D.surface(W, H)
ctx.save()
ctx.translate(W / 2, H / 2)
ctx.scale(0.5, 0.5)
ctx.translate(-1800, -500)
DK.backdrop(ctx, 1.0, "day", sun=(2900, 60, 50))
DK.far(ctx, "day", 1.0)
DK.floor(ctx, "day")
ctx.restore()
D.col(ctx, (1, 1, 1), 0.35)
ctx.paint()
D.text(ctx, "SEA EMPRESS — CAST", W / 2, 90, 70, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=10)
cast = [("LEO", R.LEO, "front", "smile", {}), ("CAPTAIN LEO", R.LEO_CAP, "side", "happy", {}),
        ("DOLORES", R.DOLORES, "front", "laugh", {}), ("MOM", R.MOM, "front", "smile", {}),
        ("MAX", R.MAX, "front", "laugh", {}), ("THE CAPTAIN", R.CAPTAIN, "front", "smile", {}),
        ("...LATER", R.CAPTAIN_Z, "front", "neutral", {"mouth": 0.7})]
for i, (name, L, view, face, extra) in enumerate(cast):
    x = 150 + i * 230
    p = R.stand(view, 0.4 * i, i)
    p.update(face=face, **extra)
    R.Fig(L).draw(ctx, x, 560, 105, 1, p)
    D.text(ctx, name, x, 615, 27, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=7)
draw_cat(ctx, 1770, 540, 190, -1, cat_pose(0.3, "sit", hat=True))
D.text(ctx, "ANCHOR", 1760, 615, 34, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=7)
kinds = ["hawaiian", "robe", "trunks", "waiter", "chef", "officer", "tourist", "grandma", "sundress", "crew",
         "lifevest", "tank", "hawaiian"]
for i, k in enumerate(kinds):
    L = R.zombie_look(700 + i * 3, k)
    p = R.stand("front" if i % 2 else "side", i * 0.3, i)
    p.update(mouth=0.5 + 0.1 * (i % 3), a1=(1.3, -0.1), a2=(1.15, 0.0), lean=0.12, neck=0.2)
    R.Fig(L).draw(ctx, 90 + i * 145, 1010, 82, 1, p)
D.text(ctx, "THE PASSENGERS", W / 2, 690, 44, D.FONT_TITLE, hexrgb("#9bd666"), stroke=D.INK, slw=8)
s.write_to_png(os.path.join(ROOT, "docs", "cast_sheet.png"))
print("docs/cast_sheet.png")
