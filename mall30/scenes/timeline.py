"""Сборка фильма из сегментов: холодный старт, 30 дней, эпилог, концовка."""
import importlib
import os

from engine.film import Segment, Shot
from engine.render import Film
from engine.overlay import chunk_words
from engine.core import W, H, hexrgb
from engine import draw as D
from . import timing

HERE = os.path.dirname(os.path.abspath(__file__))

# время суток в начале сегмента (для значка ☀/☾)
TOD = {"cold": "night", "d01": "night", "d02": "day", "d03": "night", "d04": "morning", "d05": "day",
       "d06": "day", "d07": "day", "d08": "day", "d09": "day", "d10": "dusk", "d11": "night", "d12": "dusk",
       "d13": "day", "d14": "day", "d15": "day", "d16": "day", "d17": "day", "d18": "day", "d19": "dusk",
       "d20": "night", "d21": "day", "d22": "dawn", "d23": "night", "d24": "overcast", "d25": "storm",
       "d26": "storm", "d27": "overcast", "d28": "night", "d29": "night", "d30": "dawn", "epi": "dawn",
       "end": "night"}


def _placeholder(key):
    def fn(ctx, t, S):
        D.col(ctx, hexrgb("#2a2430"))
        ctx.paint()
        D.text(ctx, key.upper(), W / 2, H / 2, 120, D.FONT_TITLE, hexrgb("#f3e7d0"))
    return fn


def build(only=None):
    T = timing.load()
    segs = []
    for key in timing.ORDER:
        day = 28 if key == "cold" else (int(key[1:]) if key.startswith("d") else (30 if key == "epi" else None))
        S = Segment(key, timing.SEG_DUR[key], day=day, tod=TOD.get(key, "day"))
        S.cues = T.get(key, {}).get("cues", [])
        if only and key not in only:
            S.shots = [Shot(0, _placeholder(key))]
        elif os.path.exists(os.path.join(HERE, key + ".py")):
            mod = importlib.import_module("scenes." + key)
            mod.build(S)
        else:
            S.shots = [Shot(0, _placeholder(key))]
        segs.append(S)
    caps = {k: chunk_words(v["words"]) for k, v in T.items() if v.get("words")}
    return Film(segs, caps)
