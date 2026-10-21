"""Concept sheets for the cast: lineup at relative scale plus expression sheets.

Every character is drawn in local coordinates with the origin at the centre of the
feet on the ground line (y grows downwards, so the body sits at negative y).
Outlines are made with two passes: all shapes of a silhouette are first drawn in the
outline colour with a thick stroke, then filled on top, so overlapping shapes merge
into one clean outline like a paper cut-out.

    python3 cast/tools/concepts.py      # writes cast/concepts/*.svg
"""

from pathlib import Path

OUT = "#2a1c15"
FONT = "DejaVu Sans, Arial, sans-serif"
_uid = [0]


def uid(prefix):
    _uid[0] += 1
    return f"{prefix}{_uid[0]}"


def el(tag, **a):
    attrs = " ".join(f'{k.rstrip("_").replace("_", "-")}="{v}"' for k, v in a.items())
    return f"<{tag} {attrs}/>"


def outline(shapes, w):
    return "".join(el(t, **{**d, "fill": OUT, "stroke": OUT, "stroke_width": 2 * w,
                             "stroke_linejoin": "round"}) for t, d in shapes)


def fill(shapes, colour, **extra):
    return "".join(el(t, **{**d, "fill": colour, **extra}) for t, d in shapes)


def cut(shapes, colour, w):
    """Outline pass + fill pass for one silhouette of a single colour."""
    return outline(shapes, w) + fill(shapes, colour)


def shadow(rx, ry=None):
    return el("ellipse", cx=0, cy=-4, rx=rx, ry=ry or rx * 0.1, fill="#000", opacity=0.18)


def text(x, y, s, size=34, colour="#222", anchor="middle", weight="bold", **extra):
    a = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in extra.items())
    return (f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" '
            f'fill="{colour}" text-anchor="{anchor}" {a}>{s}</text>')


def sub(x, y, s, colour, size=40):
    """A word styled like the channel's captions: bold, dark outline."""
    return (f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="bold" '
            f'fill="{colour}" stroke="#1a1a1a" stroke-width="{size * 0.16:.1f}" paint-order="stroke" '
            f'stroke-linejoin="round" text-anchor="middle">{s}</text>')


def group(body, x=0, y=0, s=1.0, rot=0):
    return f'<g transform="translate({x},{y}) rotate({rot}) scale({s})">{body}</g>'


# --------------------------------------------------------------------------- HANK

HANK = dict(skin="#f2b48a", skin_dark="#d9906a", shirt="#c93a2e", plaid="#3a1f1a", belt="#6a3b1c",
            gold="#f2c230", jeans="#2f4f86", boots="#6b4426", stache="#e07f2e",
            stache_dark="#b85f1c", nose="#e2604e", hat="#f7c531", hat_dark="#d9a514", mouth="#5a1414",
            tongue="#e0645a")


def hank_egg():
    y0, y1, w = -780, -40, 330
    h = y1 - y0
    return (f"M0,{y0} C{0.62 * w},{y0} {w},{y0 + 0.45 * h} {w},{y0 + 0.68 * h} "
            f"C{w},{y0 + 0.9 * h} {0.6 * w},{y1} 0,{y1} "
            f"C{-0.6 * w},{y1} {-w},{y0 + 0.9 * h} {-w},{y0 + 0.68 * h} "
            f"C{-w},{y0 + 0.45 * h} {-0.62 * w},{y0} 0,{y0} Z")


def hank_hand(x, y, flip=1):
    return [("circle", dict(cx=x, cy=y, r=62)), ("circle", dict(cx=x + flip * 46, cy=y - 44, r=26))]


def hank(brow="angry", eyes="dot", mouth="none", hands="down", sweat=False, armour=False):
    c = HANK
    pat, clip = uid("plaid"), uid("hankclip")
    hand_pos = {"down": [(-392, -320, 1), (392, -335, -1)],
                "up": [(-360, -640, 1), (360, -660, -1)],
                "point": [(-392, -320, 1), (420, -560, -1)],
                "hold": [(-392, -320, 1), (300, -300, -1)]}[hands]
    hands_shapes = [s for x, y, f in hand_pos for s in hank_hand(x, y, f)]
    feet = [("ellipse", dict(cx=-140, cy=-32, rx=105, ry=42)), ("ellipse", dict(cx=140, cy=-32, rx=105, ry=42))]
    egg = [("path", dict(d=hank_egg()))]
    parts = [shadow(330, 28)]
    parts.append(f'<defs><pattern id="{pat}" width="96" height="96" patternUnits="userSpaceOnUse">'
                 f'<rect width="96" height="96" fill="{c["shirt"]}"/>'
                 f'<rect width="38" height="96" fill="{c["plaid"]}" opacity="0.45"/>'
                 f'<rect width="96" height="38" fill="{c["plaid"]}" opacity="0.45"/>'
                 f'<rect x="60" width="6" height="96" fill="#fff" opacity="0.18"/>'
                 f'<rect y="60" width="96" height="6" fill="#fff" opacity="0.18"/></pattern>'
                 f'<clipPath id="{clip}"><path d="{hank_egg()}"/></clipPath></defs>')
    parts.append(outline(feet + egg + hands_shapes, 7))
    parts.append(fill(feet, c["boots"]))
    body = [el("rect", x=-400, y=-800, width=800, height=800, fill=c["skin"]),
            el("path", d="M-400,-484 L-95,-484 L0,-410 L95,-484 L400,-484 L400,-203 L-400,-203 Z",
               fill="#2b2b2b" if armour else f"url(#{pat})"),
            el("rect", x=-400, y=-203, width=800, height=38, fill=c["belt"]),
            el("rect", x=-400, y=-165, width=800, height=200, fill=c["jeans"]),
            el("path", d="M-400,-560 Q0,-470 400,-560", fill="none", stroke=c["skin_dark"], stroke_width=0)]
    if armour:
        body.append(el("path", d="M-200,-484 L200,-484 L170,-260 L-170,-260 Z", fill="#3b3540", stroke=OUT, stroke_width=6))
    parts.append(f'<g clip-path="url(#{clip})">{"".join(body)}</g>')
    for y in (-375, -315, -255):
        parts.append(el("circle", cx=0, cy=y, r=9, fill="#f4e3c0", stroke=OUT, stroke_width=3))
    parts.append(el("rect", x=-48, y=-213, width=96, height=58, rx=10, fill=c["gold"], stroke=OUT, stroke_width=5))
    parts.append(el("rect", x=-24, y=-197, width=48, height=26, rx=5, fill=c["belt"]))
    parts.append(fill(hands_shapes, c["skin"]))
    # face
    if mouth == "yell":
        parts.append(cut([("ellipse", dict(cx=0, cy=-462, rx=74, ry=58))], c["mouth"], 6))
        parts.append(el("ellipse", cx=0, cy=-432, rx=42, ry=20, fill=c["tongue"]))
        parts.append(el("rect", x=-52, y=-505, width=104, height=18, rx=6, fill="#fff"))
    elif mouth == "o":
        parts.append(cut([("ellipse", dict(cx=0, cy=-468, rx=30, ry=34))], c["mouth"], 5))
    elif mouth == "grit":
        parts.append(cut([("rect", dict(x=-80, y=-500, width=160, height=52, rx=14))], "#fff", 5))
        for x in (-40, 0, 40):
            parts.append(el("line", x1=x, y1=-498, x2=x, y2=-450, stroke=OUT, stroke_width=4))
        parts.append(el("line", x1=-78, y1=-474, x2=78, y2=-474, stroke=OUT, stroke_width=4))
    elif mouth == "smirk":
        parts.append(cut([("path", dict(d="M10,-482 Q80,-470 115,-500 Q90,-450 20,-462 Z"))], c["mouth"], 4))
    stache = [("circle", dict(cx=x, cy=y, r=r)) for x, y, r in
              [(-150, -505, 46), (-95, -522, 56), (-35, -530, 52), (35, -530, 52), (95, -522, 56),
               (150, -505, 46), (-195, -478, 30), (195, -478, 30)]]
    parts.append(cut(stache, c["stache"], 6))
    for x in (-95, -35, 35, 95):
        parts.append(el("path", d=f"M{x - 25},-500 Q{x},-488 {x + 25},-500", fill="none",
                        stroke=c["stache_dark"], stroke_width=6, stroke_linecap="round"))
    parts.append(cut([("ellipse", dict(cx=0, cy=-575, rx=50, ry=42))], c["nose"], 6))
    parts.append(el("ellipse", cx=-16, cy=-590, rx=14, ry=9, fill="#fff", opacity=0.7))
    for x in (-74, 74):
        if eyes == "dot":
            parts.append(el("ellipse", cx=x, cy=-624, rx=15, ry=19, fill=OUT))
            parts.append(el("circle", cx=x - 5, cy=-631, r=5, fill="#fff"))
        elif eyes == "big":
            parts.append(cut([("ellipse", dict(cx=x, cy=-628, rx=36, ry=42))], "#fff", 5))
            parts.append(el("circle", cx=x, cy=-624, r=11, fill=OUT))
        elif eyes == "half":
            parts.append(el("ellipse", cx=x, cy=-620, rx=17, ry=13, fill=OUT))
            parts.append(el("rect", x=x - 24, y=-650, width=48, height=28, fill=c["skin"]))
            parts.append(el("line", x1=x - 22, y1=-622, x2=x + 22, y2=-622, stroke=OUT, stroke_width=6,
                            stroke_linecap="round"))
        elif eyes == "closed":
            parts.append(el("path", d=f"M{x - 20},-618 Q{x},-640 {x + 20},-618", fill="none", stroke=OUT,
                            stroke_width=7, stroke_linecap="round"))
    brows = {"angry": "M-160,-702 Q-80,-690 0,-655 Q80,-690 160,-702",
             "raised": "M-155,-690 Q0,-760 155,-690",
             "flat": "M-150,-660 Q0,-668 150,-660",
             "sad": "M-150,-650 Q-60,-668 0,-705 Q60,-668 150,-650"}[brow]
    parts.append(el("path", d=brows, fill="none", stroke="#2a1a14", stroke_width=34, stroke_linecap="round",
                    stroke_linejoin="round"))
    # hard hat, a size too small, slightly tilted
    hat = [("path", dict(d="M-102,-770 Q-102,-872 0,-874 Q102,-872 102,-770 Z")),
           ("rect", dict(x=-132, y=-792, width=264, height=30, rx=15))]
    hat_body = outline(hat, 6) + fill(hat, c["hat"]) + el("rect", x=-14, y=-872, width=28, height=86, rx=8,
                                                           fill=c["hat_dark"])
    if armour:
        hat_body = (outline(hat, 6) + fill(hat, "#2b2b2b")
                    + el("rect", x=-14, y=-872, width=28, height=86, rx=8, fill="#46404a"))
    parts.append(f'<g transform="rotate(-8 0 -780)">{hat_body}</g>')
    if sweat:
        parts.append(cut([("path", dict(d="M205,-720 Q235,-670 205,-650 Q175,-670 205,-720 Z"))], "#8fd3ff", 4))
    return "".join(parts)


# --------------------------------------------------------------------------- PIP

PIP = dict(body="#ff6fb5", core="#ffb0d6", edge="#b8306f", cheek="#ff3f8e")


def pip(eyes="happy", mouth="smile", inside=None, sweat=False, tears=False, squash=1.0):
    c = PIP
    w, h = 200 / squash ** 0.5, 180 * squash
    x0, y0 = -w / 2, -h
    parts = [shadow(w * 0.55, 14)]
    if inside == "cookie":
        parts.append(group(el("circle", cx=0, cy=0, r=40, fill="#b8783c", stroke="#6e4220", stroke_width=5)
                           + "".join(el("circle", cx=x, cy=y, r=7, fill="#4a2a14")
                                     for x, y in [(-15, -10), (12, -18), (8, 14), (-12, 16), (20, 4)]),
                           x=45, y=-50))
    elif inside == "tnt":
        parts.append(group(el("rect", x=-42, y=-42, width=84, height=84, fill="#d8322c", stroke=OUT, stroke_width=5)
                           + el("rect", x=-42, y=-14, width=84, height=28, fill="#f2f2f2")
                           + text(0, 9, "TNT", 22, "#222"), x=40, y=-55, rot=12))
    elif inside == "cake":
        icing = "M-62,-34 L62,-34 L62,-10 " + "".join(f"q-8,14 -15.5,0 " for _ in range(8)) + "Z"
        parts.append(group(el("rect", x=-62, y=-34, width=124, height=70, rx=8, fill="#a8642e", stroke=OUT, stroke_width=5)
                           + el("path", d=icing, fill="#fff", stroke=OUT, stroke_width=4)
                           + "".join(el("circle", cx=x, cy=-38, r=9, fill="#d8322c", stroke=OUT, stroke_width=3)
                                     for x in (-36, 0, 36))
                           + el("rect", x=-5, y=-80, width=10, height=40, fill="#7fb2ff", stroke=OUT, stroke_width=3)
                           + el("path", d="M0,-104 q12,14 0,24 q-12,-10 0,-24 Z", fill="#ffb02e", stroke=OUT, stroke_width=3),
                           x=12, y=-52, rot=-6))
    body = [("rect", dict(x=x0, y=y0, width=w, height=h, rx=58))]
    parts.append(fill(body, c["body"], opacity=0.8, stroke=c["edge"], stroke_width=7))
    parts.append(el("rect", x=x0 + 26, y=y0 + 26, width=w - 52, height=h - 52, rx=40, fill=c["core"], opacity=0.35))
    parts.append(el("rect", x=x0 + 26, y=y0 + 18, width=50, height=22, rx=11, fill="#fff", opacity=0.9))
    parts.append(el("circle", cx=x0 + 92, cy=y0 + 29, r=8, fill="#fff", opacity=0.9))
    parts.append(el("path", d=f"M{x0 + 40},0 Q{x0 + 52},22 {x0 + 64},0 Z", fill=c["body"], opacity=0.8,
                    stroke=c["edge"], stroke_width=5))
    ey = y0 + h * 0.48
    for x in (-40, 40):
        if eyes == "happy":
            parts.append(el("ellipse", cx=x, cy=ey, rx=24, ry=30, fill=OUT))
            parts.append(el("circle", cx=x - 8, cy=ey - 11, r=9, fill="#fff"))
            parts.append(el("circle", cx=x + 8, cy=ey + 9, r=4, fill="#fff"))
        elif eyes == "closed":
            parts.append(el("path", d=f"M{x - 20},{ey + 6} Q{x},{ey - 20} {x + 20},{ey + 6}", fill="none",
                            stroke=OUT, stroke_width=8, stroke_linecap="round"))
        elif eyes == "side":
            parts.append(el("ellipse", cx=x, cy=ey, rx=24, ry=30, fill="#fff", stroke=OUT, stroke_width=5))
            parts.append(el("circle", cx=x + 12, cy=ey + 4, r=12, fill=OUT))
        elif eyes == "tiny":
            parts.append(el("ellipse", cx=x, cy=ey, rx=26, ry=32, fill="#fff", stroke=OUT, stroke_width=5))
            parts.append(el("circle", cx=x, cy=ey, r=6, fill=OUT))
        elif eyes == "teary":
            parts.append(el("ellipse", cx=x, cy=ey, rx=28, ry=34, fill=OUT))
            parts.append(el("circle", cx=x - 9, cy=ey - 12, r=11, fill="#fff"))
            parts.append(el("circle", cx=x + 9, cy=ey + 8, r=6, fill="#fff"))
            parts.append(el("path", d=f"M{x - 26},{ey + 18} Q{x},{ey + 34} {x + 26},{ey + 18}", fill="none",
                            stroke="#8fd3ff", stroke_width=7, stroke_linecap="round"))
    my = ey + 44
    mouths = {"smile": el("path", d=f"M-16,{my} Q0,{my + 16} 16,{my}", fill="none", stroke=OUT, stroke_width=6,
                          stroke_linecap="round"),
              "grin": el("path", d=f"M-30,{my - 6} Q0,{my + 34} 30,{my - 6} Z", fill="#7a1840", stroke=OUT,
                         stroke_width=5),
              "o": el("ellipse", cx=0, cy=my + 6, rx=14, ry=18, fill="#7a1840", stroke=OUT, stroke_width=5),
              "wobbly": el("path", d=f"M-30,{my + 4} q7,-10 15,0 q7,10 15,0 q7,-10 15,0 q7,10 15,0", fill="none",
                           stroke=OUT, stroke_width=6, stroke_linecap="round"),
              "chew": el("path", d=f"M-22,{my} q11,10 22,0 q11,-10 22,0", fill="none", stroke=OUT, stroke_width=6,
                         stroke_linecap="round"),
              "cry": el("path", d=f"M-24,{my + 14} Q0,{my - 12} 24,{my + 14} Z", fill="#7a1840", stroke=OUT,
                        stroke_width=5)}
    parts.append(mouths[mouth])
    cheek_r = 26 if mouth == "chew" else 16
    for x in (-70, 70):
        parts.append(el("ellipse", cx=x, cy=my - 4, rx=cheek_r, ry=cheek_r * 0.6, fill=c["cheek"], opacity=0.55))
    if sweat:
        parts.append(cut([("path", dict(d=f"M{w / 2 - 6},{y0 + 10} q24,40 0,56 q-24,-16 0,-56 Z"))], "#8fd3ff", 4))
    if tears:
        for x in (-52, 52):
            parts.append(el("path", d=f"M{x},{ey + 30} q-10,40 0,70 q10,-30 0,-70 Z", fill="#8fd3ff", stroke=OUT,
                            stroke_width=3))
    return "".join(parts)


# --------------------------------------------------------------------------- LID

LID = dict(wood="#b4743a", wood_dark="#8a5326", lid="#9a5f2c", iron="#a7b0ba", gold="#f2c230",
           tongue="#8e3fb8", inside="#1a0d10")


def lid_chest_body(c):
    p = [cut([("rect", dict(x=-170, y=-225, width=340, height=225, rx=10))], c["wood"], 7)]
    for y in (-170, -115, -60):
        p.append(el("line", x1=-165, y1=y, x2=165, y2=y, stroke=c["wood_dark"], stroke_width=6))
    for x in (-170, 140):
        p.append(cut([("rect", dict(x=x, y=-40, width=30, height=40, rx=4))], c["iron"], 4))
    return "".join(p)


def lid_char(mode="cute", eyes="puppy"):
    c = LID
    parts = [shadow(190, 18), lid_chest_body(c)]
    if mode == "cute":
        lid = [("path", dict(d="M-180,-225 L-180,-320 Q-180,-370 -130,-370 L130,-370 Q180,-370 180,-320 L180,-225 Z"))]
        parts.append(cut(lid, c["lid"], 7))
        parts.append(el("line", x1=-175, y1=-300, x2=175, y2=-300, stroke=c["wood_dark"], stroke_width=6))
        for x in (-180, 150):
            parts.append(cut([("rect", dict(x=x, y=-370, width=30, height=40, rx=4))], c["iron"], 4))
        parts.append(cut([("rect", dict(x=-34, y=-255, width=68, height=74, rx=10))], c["gold"], 5))
        parts.append(el("circle", cx=0, cy=-228, r=9, fill=OUT))
        parts.append(el("rect", x=-4, y=-228, width=8, height=22, fill=OUT))
        for x in (-92, 92):
            if eyes == "puppy":
                parts.append(cut([("ellipse", dict(cx=x, cy=-122, rx=48, ry=56))], "#fff", 5))
                parts.append(el("ellipse", cx=x + (8 if x < 0 else -8), cy=-112, rx=28, ry=34, fill=OUT))
                parts.append(el("circle", cx=x - 2, cy=-128, r=11, fill="#fff"))
                parts.append(el("circle", cx=x + 12, cy=-100, r=5, fill="#fff"))
            else:  # sly
                parts.append(cut([("path", dict(d=f"M{x - 46},-118 Q{x},-160 {x + 46},-118 Q{x},-96 {x - 46},-118 Z"))],
                                 "#fff", 5))
                parts.append(el("circle", cx=x + 14, cy=-120, r=13, fill=OUT))
        parts.append(el("path", d="M-26,-40 Q0,-22 26,-40", fill="none", stroke=OUT, stroke_width=6,
                        stroke_linecap="round"))
    else:  # monster: lid flips up like a jaw
        parts.append(cut([("path", dict(d="M-170,-225 L-150,-470 L150,-470 L170,-225 Z"))], c["inside"], 7))
        parts.append(el("path", d="M-150,-235 Q0,-200 150,-235 L120,-150 Q0,-120 -120,-150 Z", fill="#c0368a"))
        parts.append(group(cut([("path", dict(d="M-40,-200 Q0,-260 40,-200 L30,-60 Q0,-20 -30,-60 Z"))],
                               c["tongue"], 5), y=0))
        teeth_top = "".join(f"M{x},-470 l20,52 l20,-52 Z " for x in range(-150, 150, 40))
        teeth_bot = "".join(f"M{x},-225 l20,-52 l20,52 Z " for x in range(-160, 160, 40))
        parts.append(el("path", d=teeth_top + teeth_bot, fill="#fff", stroke=OUT, stroke_width=4, stroke_linejoin="round"))
        lid = [("path", dict(d="M-178,-470 L-160,-610 Q-150,-640 -110,-636 L110,-636 Q150,-640 160,-610 L178,-470 Z"))]
        parts.append(cut(lid, c["lid"], 7))
        parts.append(cut([("rect", dict(x=-34, y=-500, width=68, height=60, rx=10))], c["gold"], 5))
        for x in (-92, 92):
            parts.append(cut([("path", dict(d=f"M{x - 50},-570 L{x + 50},{-590 if x < 0 else -550} "
                                               f"L{x + 40},-540 Q{x},-525 {x - 44},-545 Z"))], "#ffe14d", 5))
            parts.append(el("ellipse", cx=x, cy=-556, rx=7, ry=13, fill="#d8322c"))
    return "".join(parts)


# --------------------------------------------------------------------------- GRANNY MOSS

GRANNY = dict(skin="#f6d5c1", shawl="#5f8f3e", shawl_light="#86b35a", dress="#b9a3d6", hair="#f2f2f2",
              glasses="#6b4e3a", cane="#8a5a2b", shoes="#5a3b5e")


def granny(face="sweet"):
    c = GRANNY
    parts = [shadow(150, 16)]
    feet = [("ellipse", dict(cx=x, cy=-16, rx=40, ry=18)) for x in (-48, 48)]
    dress = [("path", dict(d="M-115,-40 Q-120,-150 0,-150 Q120,-150 115,-40 Q0,-10 -115,-40 Z"))]
    shawl = [("ellipse", dict(cx=0, cy=-150, rx=128, ry=100))]
    head = [("circle", dict(cx=0, cy=-262, r=86))]
    bun = [("circle", dict(cx=0, cy=-352, r=50))]
    hands = [("circle", dict(cx=150, cy=-150, r=27)), ("circle", dict(cx=-150, cy=-120, r=27))]
    cane = [("path", dict(d="M150,0 L150,-190 Q150,-235 192,-232 Q222,-228 216,-196"))]
    parts.append(el("path", d=cane[0][1]["d"], fill="none", stroke=OUT, stroke_width=22, stroke_linecap="round"))
    parts.append(el("path", d=cane[0][1]["d"], fill="none", stroke=c["cane"], stroke_width=10, stroke_linecap="round"))
    parts.append(outline(feet + dress + shawl + bun + head + hands, 6))
    parts.append(fill(feet, c["shoes"]) + fill(dress, c["dress"]) + fill(shawl, c["shawl"]))
    knit = uid("knit")
    parts.append(f'<clipPath id="{knit}"><ellipse cx="0" cy="-150" rx="128" ry="100"/></clipPath>')
    stripes = "".join(el("path", d=f"M{i * 36 - 30},-250 L{i * 36 + 30},-50", stroke=c["shawl_light"], stroke_width=8,
                         opacity=0.7) for i in range(-4, 5))
    parts.append(f'<g clip-path="url(#{knit})">{stripes}</g>')
    parts.append(el("path", d="M-40,-62 L0,-22 L40,-62", fill="none", stroke=OUT, stroke_width=5))
    parts.append(fill(bun, c["hair"]))
    parts.append(el("line", x1=-60, y1=-400, x2=40, y2=-330, stroke="#c9a14a", stroke_width=9, stroke_linecap="round"))
    parts.append(el("line", x1=60, y1=-405, x2=-30, y2=-325, stroke="#c9a14a", stroke_width=9, stroke_linecap="round"))
    parts.append(fill(head, c["skin"]))
    parts.append(el("path", d="M-86,-262 Q-90,-345 0,-348 Q90,-345 86,-262 Q60,-310 0,-312 Q-60,-310 -86,-262 Z",
                    fill=c["hair"], stroke=OUT, stroke_width=5))
    parts.append(fill(hands, c["skin"]))
    for x in (-40, 40):
        parts.append(el("circle", cx=x, cy=-262, r=36, fill="#ddf1ff", stroke=c["glasses"], stroke_width=9))
        if face == "sweet":
            parts.append(el("path", d=f"M{x - 18},{-276} L{x + 6},{-290}", stroke="#fff", stroke_width=10,
                            stroke_linecap="round"))
            parts.append(el("path", d=f"M{x - 12},-252 Q{x},-266 {x + 12},-252", fill="none", stroke=OUT,
                            stroke_width=5, stroke_linecap="round"))
        else:  # glint: lenses go blank white, eyes hidden
            parts.append(el("circle", cx=x, cy=-262, r=30, fill="#fff"))
            parts.append(el("path", d=f"M{x + 6},-292 l6,14 l14,6 l-14,6 l-6,14 l-6,-14 l-14,-6 l14,-6 Z",
                            fill="#fff59a", stroke=OUT, stroke_width=2))
    parts.append(el("line", x1=-4, y1=-262, x2=4, y2=-262, stroke=c["glasses"], stroke_width=8))
    for x in (-64, 64):
        parts.append(el("ellipse", cx=x, cy=-222, rx=16, ry=9, fill="#f2899a", opacity=0.6))
    if face == "sweet":
        parts.append(el("path", d="M-24,-212 Q0,-192 24,-212", fill="none", stroke=OUT, stroke_width=6,
                        stroke_linecap="round"))
        parts.append(el("rect", x=-5, y=-206, width=10, height=10, fill="#fff", stroke=OUT, stroke_width=2))
    else:
        parts.append(el("path", d="M-26,-206 L26,-206", stroke=OUT, stroke_width=7, stroke_linecap="round"))
    return "".join(parts)


# --------------------------------------------------------------------------- ROCKY

ROCKY = dict(stone="#9a9a9a", stone_dark="#777", stone_light="#b8b8b8", helmet="#c8382d", gold="#f2c230",
             spear="#8a5a2b")


def rocky(face="eager", hands="spear"):
    c = ROCKY
    parts = [shadow(130, 15)]
    feet = [("ellipse", dict(cx=x, cy=-16, rx=44, ry=18)) for x in (-52, 52)]
    body = [("circle", dict(cx=0, cy=-130, r=114))]
    hand_pos = [(-142, -120), (138, -150)] if hands == "spear" else [(-142, -120), (122, -200)]
    hand = [("circle", dict(cx=x, cy=y, r=28)) for x, y in hand_pos]
    if hands == "spear":
        parts.append(el("line", x1=138, y1=-10, x2=138, y2=-330, stroke=OUT, stroke_width=20, stroke_linecap="round"))
        parts.append(el("line", x1=138, y1=-10, x2=138, y2=-330, stroke=c["spear"], stroke_width=9, stroke_linecap="round"))
        parts.append(cut([("path", dict(d="M138,-385 L162,-325 L114,-325 Z"))], "#8e8e8e", 4))
    parts.append(outline(feet + body + hand, 6))
    parts.append(fill(feet, "#5e5e5e") + fill(body, c["stone"]))
    for x, y, w, h in [(-80, -150, 50, 36), (30, -70, 60, 40), (-20, -200, 40, 28), (55, -160, 34, 30),
                       (-70, -70, 36, 28)]:
        parts.append(el("rect", x=x, y=y, width=w, height=h, rx=10, fill=c["stone_dark"], opacity=0.55))
    for x, y in [(-30, -110), (70, -110), (-90, -100)]:
        parts.append(el("circle", cx=x, cy=y, r=8, fill=c["stone_light"]))
    helmet = [("path", dict(d="M-108,-170 Q-110,-290 0,-292 Q110,-290 108,-170 Z"))]
    parts.append(cut(helmet, c["helmet"], 6))
    parts.append(cut([("rect", dict(x=-118, y=-185, width=236, height=30, rx=15))], c["gold"], 5))
    parts.append(cut([("path", dict(d="M-20,-290 Q-60,-370 10,-385 Q80,-380 60,-300 Q30,-340 -20,-290 Z"))],
                     c["helmet"], 5))
    for x in (-36, 36):
        if face == "eager":
            parts.append(cut([("ellipse", dict(cx=x, cy=-118, rx=25, ry=30))], "#fff", 4))
            parts.append(el("circle", cx=x + 3, cy=-112, r=12, fill=OUT))
            parts.append(el("circle", cx=x - 1, cy=-118, r=4, fill="#fff"))
        else:  # scared
            parts.append(cut([("ellipse", dict(cx=x, cy=-118, rx=28, ry=34))], "#fff", 4))
            parts.append(el("circle", cx=x, cy=-114, r=5, fill=OUT))
    if face == "eager":
        parts.append(el("path", d="M-20,-70 Q0,-50 20,-70 Z", fill="#5a1414", stroke=OUT, stroke_width=4))
    else:
        parts.append(el("path", d="M-24,-62 q8,-10 16,0 q8,10 16,0 q8,-10 16,0", fill="none", stroke=OUT,
                        stroke_width=5, stroke_linecap="round"))
    parts.append(fill(hand, "#a9a9a9"))
    return "".join(parts)


# --------------------------------------------------------------------------- SHEETS

def svg(w, h, body, bg="#ffffff"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<rect width="{w}" height="{h}" fill="{bg}"/>{body}</svg>')


def ground(w, y, h):
    p = [el("rect", x=0, y=y, width=w, height=h, fill="#7cbf52")]
    for i in range(0, w, 40):
        p.append(el("rect", x=i, y=y, width=40, height=16 + (i // 40 % 3) * 6, fill="#5ea53a"))
    p.append(el("rect", x=0, y=y + 40, width=w, height=h - 40, fill="#8a5a36"))
    for i in range(0, w, 60):
        p.append(el("rect", x=i + (i // 60 % 2) * 20, y=y + 60 + (i // 60 % 3) * 20, width=22, height=16, fill="#734a2c"))
    return "".join(p)


def block(x, y, s):
    return (el("rect", x=x, y=y, width=s, height=s, fill="#8a5a36", stroke=OUT, stroke_width=4)
            + el("rect", x=x, y=y, width=s, height=s * 0.22, fill="#6fb246")
            + "".join(el("rect", x=x + i * s / 8, y=y + s * 0.22, width=s / 8, height=s * (0.04 + 0.04 * (i % 3)),
                         fill="#6fb246") for i in range(8))
            + el("rect", x=x, y=y, width=s, height=s, fill="none", stroke=OUT, stroke_width=4))


CAST = [
    ("HANK", 1.00, "#ff8a1f", "Hank", lambda: hank(mouth="yell")),
    ("LID", 0.45, "#ffd23f", "Lid", lambda: lid_char()),
    ("GRANNY MOSS", 0.40, "#ffffff", "Granny Moss", lambda: granny()),
    ("ROCKY", 0.35, "#3fd3ff", "Rocky", lambda: rocky()),
    ("PIP", 0.22, "#ff5fb0", "Pip", lambda: pip(inside="cookie")),
]
NATIVE_H = {"HANK": 874, "LID": 370, "GRANNY MOSS": 402, "ROCKY": 385, "PIP": 180}


def lineup():
    W, H, G = 3000, 1300, 1060
    unit = 820  # Hank's height in px == 2 Minecraft blocks
    body = [el("rect", width=W, height=G, fill="#bfe6ff"), ground(W, G, H - G)]
    body.append(text(W / 2, 80, "Cast lineup — relative scale (Hank = 2 Minecraft blocks)", 46))
    bs = unit / 2
    body.append(block(70, G - bs, bs) + block(70, G - 2 * bs, bs))
    body.append(text(70 + bs / 2, G - 2 * bs - 20, "2 blocks", 30))
    for frac, label in [(1.0, "1.0"), (0.5, "0.5")]:
        y = G - unit * frac
        body.append(el("line", x1=540, y1=y, x2=W - 40, y2=y, stroke="#5b7da0", stroke_width=3, stroke_dasharray="14 12"))
        body.append(text(W - 50, y - 10, label, 26, "#5b7da0", anchor="end"))
    xs = [880, 1530, 1960, 2380, 2760]
    for (name, rel, colour, label, draw), x in zip(CAST, xs):
        s = unit * rel / 820 if name == "HANK" else unit * rel / NATIVE_H[name]
        if name == "HANK":
            s = unit / 874
        body.append(group(draw(), x=x, y=G, s=s))
        body.append(sub(x, G + 100, label, colour, 54))
        body.append(text(x, G + 160, f"{rel:.2f} H · {2 * rel:.2f} blocks", 30, "#fff"))
    return svg(W, H, "".join(body))


def sheet(title, cells, cell_w, cell_h, cols, scale, caption_colour, base_pad=70):
    rows = (len(cells) + cols - 1) // cols
    W, H = cols * cell_w, rows * cell_h + 110
    body = [text(W / 2, 70, title, 44)]
    for i, (cap, art) in enumerate(cells):
        r, c = divmod(i, cols)
        x0, y0 = c * cell_w, 110 + r * cell_h
        body.append(el("rect", x=x0 + 12, y=y0 + 6, width=cell_w - 24, height=cell_h - 18, rx=26, fill="#eef6fb"))
        body.append(group(art, x=x0 + cell_w / 2, y=y0 + cell_h - base_pad, s=scale))
        body.append(sub(x0 + cell_w / 2, y0 + cell_h - 22, cap, caption_colour, 34))
    return svg(W, H, "".join(body))


def main():
    out = Path(__file__).resolve().parent.parent / "concepts"
    out.mkdir(exist_ok=True)
    (out / "lineup.svg").write_text(lineup())
    (out / "hank.svg").write_text(sheet("HANK — expressions", [
        ("angry / yelling", hank(mouth="yell")),
        ("smug", hank(brow="flat", eyes="half", mouth="smirk", hands="hold")),
        ("deadpan  “Um… okay.”", hank(brow="flat", eyes="half")),
        ("shocked", hank(brow="raised", eyes="big", mouth="o", hands="up")),
        ("scared", hank(brow="sad", eyes="big", mouth="grit", hands="up", sweat=True)),
        ("proud (armour)", hank(brow="raised", eyes="closed", mouth="smirk", hands="point", armour=True)),
    ], 560, 600, 3, 0.56, "#ff8a1f"))
    (out / "pip.svg").write_text(sheet("PIP — expressions (see-through body keeps the evidence)", [
        ("happy", pip()),
        ("innocent", pip(eyes="closed", mouth="smile", inside="cake")),
        ("guilty", pip(eyes="side", mouth="wobbly", sweat=True, inside="cookie")),
        ("shocked", pip(eyes="tiny", mouth="o")),
        ("crying", pip(eyes="teary", mouth="cry", tears=True)),
        ("chewing", pip(eyes="closed", mouth="chew", squash=0.9)),
        ("ate the TNT", pip(eyes="happy", mouth="grin", inside="tnt")),
        ("squash (landing)", pip(eyes="closed", mouth="grin", squash=0.7)),
    ], 420, 380, 4, 1.15, "#ff5fb0", base_pad=80))
    (out / "lid.svg").write_text(sheet("LID — cute mode / monster mode", [
        ("cute  “Trust me, buddy!”", lid_char()),
        ("sly", lid_char(eyes="sly")),
        ("monster  “NO REFUNDS!”", lid_char(mode="monster")),
    ], 620, 820, 3, 1.0, "#ffd23f"))
    (out / "granny-rocky.svg").write_text(sheet("GRANNY MOSS & ROCKY", [
        ("Granny — sweet", granny()),
        ("Granny — glint", granny(face="glint")),
        ("Rocky — “Yes, boss!”", rocky(hands="salute")),
        ("Rocky — scared", rocky(face="scared")),
    ], 560, 620, 4, 1.15, "#ffffff"))
    print("written:", sorted(p.name for p in out.glob("*.svg")))


if __name__ == "__main__":
    main()
