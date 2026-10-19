"""Сборка фильма из сегментов дней."""
import importlib
import os

from engine.film import Segment, Shot
from engine.render import Film
from engine.core import W, H, hexrgb
from engine import draw as D
from . import timing

HERE = os.path.dirname(os.path.abspath(__file__))


def _placeholder(key):
    def fn(ctx, t, S):
        D.col(ctx, hexrgb("#1b1d23"))
        ctx.paint()
        D.text(ctx, key.upper(), W / 2, H / 2, 120, "Inter", hexrgb("#f3efe6"), bold=True)
    return fn


def build(only=None):
    T = timing.load()
    segs = []
    keys = [k for k in timing.ORDER if not only or k in only]
    for key in keys:
        S = Segment(key, T[key]["dur"], day=int(key[1:]))
        S.cues = T[key]["cues"]
        S.words = T[key]["words"]
        S.amb, S.sfx, S.music = [], [], []
        if os.path.exists(os.path.join(HERE, key + ".py")):
            importlib.import_module("scenes." + key).build(S)
        else:
            S.shots = [Shot(0, _placeholder(key))]
        segs.append(S)
    return Film(segs)
