"""Главы для описания YouTube по фактической раскладке: python3 tools/chapters.py [--write]

--write подставляет главы в docs/youtube_description.md вместо {CHAPTERS}."""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from scenes import timing  # noqa: E402

TITLES = {
    "d00": "Day 0: The Alert", "d01": "Day 1: Counting", "d02": "Day 2: The Lantern",
    "d03": "Day 3: The Power Dies", "d05": "Day 5: What Spoils First", "d07": "Day 7: The Knock",
    "d09": "Day 9: Count Them", "d11": "Day 11: Tap, Tap Tap", "d12": "Day 12: The Pharmacist",
    "d14": "Day 14: The Generator", "d16": "Day 16: The Roof", "d18": "Day 18: Bad Cans",
    "d20": "Day 20: Rats", "d22": "Day 22: The Crack", "d25": "Day 25: The Truck",
    "d28": "Day 28: The Glass Goes", "d30": "Day 30: The Highway",
}


def chapters():
    T = timing.load()
    t, out = 0.0, []
    for k in timing.ORDER:
        s = int(round(t))
        out.append("%d:%02d %s" % (s // 60, s % 60, TITLES[k]))
        t += T[k]["dur"]
    return out, t


def main():
    lines, total = chapters()
    print("\n".join(lines))
    print("total %d:%02d" % (int(total) // 60, int(total) % 60))
    if "--write" in sys.argv:
        p = os.path.join(ROOT, "docs", "youtube_description.md")
        s = open(p).read()
        s = s.replace("{CHAPTERS}", "\n".join(lines))
        open(p, "w").write(s)


if __name__ == "__main__":
    main()
