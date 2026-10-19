"""Concept sheet for the red-hoodie stickman hero (Ifverse-like 2D style).

Builds standalone SVGs of the turnaround views and an HTML concept sheet,
then renders the sheet to PNG with Playwright/Chromium.

    python3 stickman/hero_concept.py

Character units: head diameter = 100, feet on y = 0, y grows downward,
so the whole figure lives in negative y (about 4 heads tall).
"""

import math
import os
import random
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
SVG_DIR = os.path.join(HERE, "svg")

# --- palette ---------------------------------------------------------------
INK = "#120E13"      # head, neck, hands, legs
LINE = "#1B1016"     # outline on clothes
RED = "#D93B3B"      # hoodie
RED_SH = "#B02E33"   # hoodie shadow side
RED_DK = "#86222A"   # cuffs, hem band, hood inside
FACE = "#F5EBD7"     # eyes, brows, mouth
STRING = "#F3F1EE"   # drawstrings
AGLET = "#CFCAC4"
RIM_COOL = "#8DB6FF"
RIM_WARM = "#F4B46A"
TEAR = "#8FC3FF"

OW = 3.2             # clothes outline width

# --- proportions -----------------------------------------------------------
R = 50               # head radius
HEAD_Y = -360        # head centre
TOP = -292           # hoodie shoulders
HEM = -140           # hoodie bottom
HEIGHT = 410         # top of head to ground

_uid = [0]


def uid(prefix):
    _uid[0] += 1
    return f"{prefix}{_uid[0]}"


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def pt(p):
    return f"{f(p[0])},{f(p[1])}"


# --- primitives ------------------------------------------------------------
def stroke(d, color, w, cap="round", extra=""):
    return (f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{f(w)}" '
            f'stroke-linecap="{cap}" stroke-linejoin="round" {extra}/>')


def shape(d, fill, outline=True, extra=""):
    s = f' stroke="{LINE}" stroke-width="{OW}" stroke-linejoin="round"' if outline else ""
    return f'<path d="{d}" fill="{fill}"{s} {extra}/>'


def circle(c, r, fill, extra=""):
    return f'<circle cx="{f(c[0])}" cy="{f(c[1])}" r="{f(r)}" fill="{fill}" {extra}/>'


def ellipse(c, rx, ry, fill, extra=""):
    return (f'<ellipse cx="{f(c[0])}" cy="{f(c[1])}" rx="{f(rx)}" ry="{f(ry)}" '
            f'fill="{fill}" {extra}/>')


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def clipped(clip_d, body):
    cid = uid("clip")
    return (f'<clipPath id="{cid}"><path d="{clip_d}"/></clipPath>'
            f'<g clip-path="url(#{cid})">{body}</g>')


# --- body parts ------------------------------------------------------------
def sleeve(p0, c, p1, fill=RED, cuff=RED_DK, w=17):
    """Arm in a hoodie sleeve: quadratic curve shoulder -> wrist, black hand."""
    dx, dy = p1[0] - c[0], p1[1] - c[1]
    n = math.hypot(dx, dy) or 1
    hand = (p1[0] + dx / n * 9, p1[1] + dy / n * 9)
    full = f"M{pt(p0)} Q{pt(c)} {pt(p1)}"
    t = 0.84
    part = f"M{pt(p0)} Q{pt(lerp(p0, c, t))} {pt(lerp(lerp(p0, c, t), lerp(c, p1, t), t))}"
    return (circle(hand, 10.5, INK)
            + stroke(full, LINE, w + 2 * OW)
            + stroke(full, cuff, w)
            + stroke(part, fill, w, cap="butt")
            + circle(p0, w / 2, fill))


def leg(hip, ankle):
    return stroke(f"M{pt(hip)} L{pt(ankle)}", INK, 10)


def foot(c, rx=14, ry=7, rot=0):
    return ellipse(c, rx, ry, INK, f'transform="rotate({rot} {f(c[0])} {f(c[1])})"')


def drawstring(a, b):
    tip = lerp(a, b, 0.86)
    return stroke(f"M{pt(a)} L{pt(b)}", STRING, 2.6) + stroke(f"M{pt(tip)} L{pt(b)}", AGLET, 3.8)


def torso_path(lx_top, rx_top, lx_hem, rx_hem):
    """Hoodie body: rounded shoulders, slightly flared hem."""
    t, h = TOP, HEM
    return (f"M{f(lx_top + 20)},{t} C{f(lx_top + 8)},{t} {f(lx_top)},{t + 8} {f(lx_top)},{t + 22} "
            f"L{f(lx_hem)},{h - 12} C{f(lx_hem)},{h - 4} {f(lx_hem + 4)},{h} {f(lx_hem + 10)},{h} "
            f"L{f(rx_hem - 10)},{h} C{f(rx_hem - 4)},{h} {f(rx_hem)},{h - 4} {f(rx_hem)},{h - 12} "
            f"L{f(rx_top)},{t + 22} C{f(rx_top)},{t + 8} {f(rx_top - 8)},{t} {f(rx_top - 20)},{t} Z")


def torso(d, shade_d, details=""):
    body = (f'<rect x="-80" y="{HEM - 16}" width="160" height="20" fill="{RED_DK}"/>'
            + f'<path d="{shade_d}" fill="{RED_SH}"/>'
            + stroke(f"M-80,{HEM - 16} L80,{HEM - 16}", LINE, 2, extra='opacity="0.7"')
            + details)
    return shape(d, RED, outline=False) + clipped(d, body) + shape(d, "none")


# --- faces (head-local: centre 0,0, r = 50) -----------------------------------
def brow(a, b, w=3.6):
    return stroke(f"M{pt(a)} L{pt(b)}", FACE, w)


def lidded_eye(x, y, look=0):
    """Half-closed eye: flat lid on top, round bottom."""
    return (f'<path d="M{f(x - 7.5)},{f(y)} L{f(x + 7.5)},{f(y - 1)} '
            f'Q{f(x + 7)},{f(y + 7.5)} {f(x + look)},{f(y + 7.5)} '
            f'Q{f(x - 7)},{f(y + 7.5)} {f(x - 7.5)},{f(y)} Z" fill="{FACE}"/>'
            + brow((x - 9, y - 3), (x + 9, y - 4.5), 3.4))


def face_neutral():
    return (ellipse((-15, -6), 6, 8.5, FACE) + ellipse((15, -6), 6, 8.5, FACE)
            + brow((-22, -22), (-9, -24)) + brow((9, -24), (22, -22))
            + stroke("M-9,17 Q0,21 9,17", FACE, 3.6))


def face_smug():
    return (lidded_eye(-15, -6) + lidded_eye(15, -6)
            + stroke("M-9,18 L8,16", FACE, 3.8))


def face_angry():
    return (ellipse((-14, -4), 5.5, 7, FACE) + ellipse((14, -4), 5.5, 7, FACE)
            + brow((-25, -21), (-7, -12), 4.4) + brow((25, -21), (7, -12), 4.4)
            + stroke("M-9,21 Q0,14 9,21", FACE, 3.8))


def face_shock():
    eye = lambda x: (circle((x, -8), 10.5, FACE) + circle((x, -8), 6.5, INK)
                     + circle((x, -8), 2.2, FACE))
    return (eye(-15) + eye(15)
            + stroke("M-24,-27 Q-15,-33 -6,-28", FACE, 3.2)
            + stroke("M6,-28 Q15,-33 24,-27", FACE, 3.2)
            + ellipse((0, 22), 7.5, 10, FACE) + ellipse((0, 22.5), 4.2, 6.5, INK))


def face_happy():
    return (stroke("M-22,-4 Q-15,-14 -8,-4", FACE, 3.8)
            + stroke("M8,-4 Q15,-14 22,-4", FACE, 3.8)
            + '<path d="M-13,11 Q0,13 13,11 Q12,27 0,27 Q-12,27 -13,11 Z" fill="%s"/>' % FACE)


def face_sad():
    return (ellipse((-14, -2), 5, 6.5, FACE) + ellipse((14, -2), 5, 6.5, FACE)
            + brow((-24, -13), (-9, -20)) + brow((24, -13), (9, -20))
            + stroke("M-9,23 Q0,15 9,23", FACE, 3.6)
            + '<path d="M17,6 Q13,14 13,18 A4.2,4.2 0 0 0 21.4,18 Q21,14 17,6 Z" fill="%s"/>' % TEAR)


def face_scared():
    return (ellipse((-14, -6), 4.2, 5.8, FACE) + ellipse((14, -6), 4.2, 5.8, FACE)
            + brow((-23, -17), (-9, -25)) + brow((23, -17), (9, -25))
            + stroke("M-10,21 L-5,17 L0,21 L5,17 L10,21", FACE, 3.2)
            + '<path d="M38,-30 Q34,-22 34,-19 A4,4 0 0 0 42,-19 Q42,-22 38,-30 Z" fill="%s"/>' % TEAR)


def face_smirk():
    return (lidded_eye(-13, -6, look=3) + lidded_eye(17, -7, look=3)
            + '<path d="M-14,15 Q4,27 18,8 Q6,21 -14,15 Z" fill="%s"/>' % FACE
            + stroke("M-14,15 Q4,27 18,8", FACE, 2.6))


def face_power():
    gid = uid("glow")
    return (f'<defs><radialGradient id="{gid}"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/>'
            f'<stop offset="0.35" stop-color="#FFE7A8" stop-opacity="0.8"/>'
            f'<stop offset="1" stop-color="#FFE7A8" stop-opacity="0"/></radialGradient></defs>'
            + lidded_eye(-15, -5)
            + ellipse((15, -2), 7, 6, FACE)
            + brow((6, -12), (24, -10), 3.4)
            + circle((15, -2), 20, f"url(#{gid})")
            + '<path d="M15,-17 L17,-4 L30,-2 L17,0 L15,13 L13,0 L0,-2 L13,-4 Z" fill="#FFFFFF"/>'
            + stroke("M-8,18 L8,18", FACE, 3.8))


FACES = {
    "neutral": face_neutral, "smug": face_smug, "angry": face_angry,
    "shock": face_shock, "happy": face_happy, "sad": face_sad,
    "scared": face_scared, "smirk": face_smirk, "power": face_power,
}


def head(face=None, face_transform=""):
    g = circle((0, HEAD_Y), R, INK)
    if face:
        g += f'<g transform="translate(0 {HEAD_Y}) {face_transform}">{FACES[face]()}</g>'
    return g


# --- views -----------------------------------------------------------------
def view_front(face="neutral"):
    shade = f"M26,{TOP - 4} C34,{TOP + 50} 34,{HEM - 50} 30,{HEM + 4} L70,{HEM + 4} L70,{TOP - 4} Z"
    pocket = stroke(f"M-28,{HEM - 18} L-22,{HEM - 60} L22,{HEM - 60} L28,{HEM - 18}",
                    LINE, 2, extra='opacity="0.55"')
    return "".join([
        leg((-15, HEM - 4), (-17, -10)), leg((15, HEM - 4), (17, -10)),
        foot((-22, -6), rot=-6), foot((22, -6), rot=6),
        shape(f"M-34,{TOP + 2} C-38,{TOP - 20} -20,{TOP - 30} 0,{TOP - 30} "
              f"C20,{TOP - 30} 38,{TOP - 20} 34,{TOP + 2} Z", RED_SH),
        stroke(f"M0,{HEAD_Y + 40} L0,{TOP + 6}", INK, 10),
        torso(torso_path(-46, 46, -50, 50), shade, pocket),
        stroke(f"M-15,{TOP} Q0,{TOP + 9} 15,{TOP}", LINE, 2.4),
        drawstring((-7, TOP + 4), (-9, TOP + 48)), drawstring((7, TOP + 4), (10, TOP + 52)),
        sleeve((-40, TOP + 16), (-54, TOP + 64), (-55, -170)),
        sleeve((40, TOP + 16), (54, TOP + 64), (55, -170)),
        head(face),
    ])


def view_three_quarter(face="neutral"):
    shade = f"M22,{TOP - 4} C30,{TOP + 50} 30,{HEM - 50} 26,{HEM + 4} L70,{HEM + 4} L70,{TOP - 4} Z"
    pocket = stroke(f"M-14,{HEM - 18} L-9,{HEM - 60} L30,{HEM - 60} L35,{HEM - 18}",
                    LINE, 2, extra='opacity="0.55"')
    return "".join([
        foot((34, -7), 14, 6.5), leg((14, HEM - 4), (24, -11)),
        sleeve((30, TOP + 18), (54, TOP + 70), (50, -172), fill=RED_SH),
        leg((-12, HEM - 4), (-8, -10)), foot((4, -6), 15, 7),
        stroke(f"M2,{HEAD_Y + 40} L4,{TOP + 6}", INK, 10),
        torso(torso_path(-42, 44, -46, 48), shade, pocket),
        stroke(f"M-6,{TOP} Q8,{TOP + 9} 22,{TOP}", LINE, 2.4),
        drawstring((6, TOP + 4), (6, TOP + 48)), drawstring((18, TOP + 4), (22, TOP + 52)),
        sleeve((-34, TOP + 16), (-50, TOP + 66), (-46, -170)),
        # hood bunched behind the neck, peeking out on the back side
        shape(f"M-6,{TOP + 4} C-26,{TOP + 8} -46,{TOP - 2} -46,{TOP - 20} "
              f"C-46,{TOP - 40} -30,{TOP - 50} -16,{TOP - 44} Z", RED_SH),
        stroke(f"M-38,{TOP - 22} Q-28,{TOP - 10} -14,{TOP - 8}", RED_DK, 3),
        head(face, "translate(17 0) scale(0.86 1)"),
    ])


def view_side():
    shade = f"M20,{TOP - 4} C26,{TOP + 50} 28,{HEM - 50} 24,{HEM + 4} L70,{HEM + 4} L70,{TOP - 4} Z"
    side_face = (ellipse((31, -6), 4.6, 8.5, FACE) + brow((23, -22), (38, -21))
                 + stroke("M32,17 Q39,19 45,14", FACE, 3.6))
    return "".join([
        leg((-4, HEM - 4), (-6, -11)), foot((6, -7), 15, 6.5),
        leg((8, HEM - 4), (12, -10)), foot((22, -6), 15, 7),
        stroke(f"M2,{HEAD_Y + 40} L4,{TOP + 6}", INK, 10),
        torso(torso_path(-30, 32, -32, 36), shade,
              stroke(f"M36,{HEM - 18} L28,{HEM - 60} L14,{HEM - 60}", LINE, 2, extra='opacity="0.55"')),
        drawstring((18, TOP + 4), (24, TOP + 50)),
        sleeve((0, TOP + 16), (8, TOP + 66), (4, -170)),
        shape(f"M2,{TOP + 4} C-18,{TOP + 8} -38,{TOP} -40,{TOP - 18} "
              f"C-42,{TOP - 40} -26,{TOP - 50} -12,{TOP - 44} Z", RED_SH),
        stroke(f"M-32,{TOP - 22} Q-22,{TOP - 10} -8,{TOP - 6}", RED_DK, 3),
        circle((2, HEAD_Y), R, INK),
        f'<g transform="translate(2 {HEAD_Y})">{side_face}</g>',
    ])


def view_back():
    shade = f"M-26,{TOP - 4} C-34,{TOP + 50} -34,{HEM - 50} -30,{HEM + 4} L-70,{HEM + 4} L-70,{TOP - 4} Z"
    hood = (f"M-32,{TOP + 2} C-38,{TOP + 30} -26,{TOP + 62} 0,{TOP + 70} "
            f"C26,{TOP + 62} 38,{TOP + 30} 32,{TOP + 2} C18,{TOP - 8} -18,{TOP - 8} -32,{TOP + 2} Z")
    return "".join([
        leg((-15, HEM - 4), (-17, -10)), leg((15, HEM - 4), (17, -10)),
        foot((-22, -6), rot=-6), foot((22, -6), rot=6),
        stroke(f"M0,{HEAD_Y + 40} L0,{TOP + 6}", INK, 10),
        torso(torso_path(-46, 46, -50, 50), shade),
        shape(hood, RED_SH),
        clipped(hood, shape(f"M-40,{TOP - 10} Q0,{TOP + 22} 40,{TOP - 10} Z", RED_DK, outline=False)),
        stroke(f"M0,{TOP + 14} L0,{TOP + 66}", LINE, 1.8, extra='opacity="0.6"'),
        sleeve((-40, TOP + 16), (-54, TOP + 64), (-55, -170)),
        sleeve((40, TOP + 16), (54, TOP + 64), (55, -170)),
        circle((0, HEAD_Y), R, INK),
    ])


def bust(face):
    """Head and shoulders for the expression grid (head centre at 0,0)."""
    t = 72
    d = (f"M-30,{t} C-46,{t} -56,{t + 10} -58,{t + 26} L-62,{t + 90} L62,{t + 90} "
         f"L58,{t + 26} C56,{t + 10} 46,{t} 30,{t} Z")
    shade = f"M30,{t - 4} C38,{t + 30} 40,{t + 60} 38,{t + 94} L80,{t + 94} L80,{t - 4} Z"
    return "".join([
        shape(f"M-36,{t + 2} C-40,{t - 22} -20,{t - 32} 0,{t - 32} "
              f"C20,{t - 32} 40,{t - 22} 36,{t + 2} Z", RED_SH),
        stroke(f"M0,40 L0,{t + 6}", INK, 10),
        shape(d, RED, outline=False),
        clipped(d, f'<path d="{shade}" fill="{RED_SH}"/>'),
        shape(d, "none"),
        stroke(f"M-15,{t} Q0,{t + 9} 15,{t}", LINE, 2.4),
        drawstring((-7, t + 4), (-9, t + 46)), drawstring((7, t + 4), (10, t + 50)),
        circle((0, 0), R, INK),
        FACES[face](),
    ])


# --- light -----------------------------------------------------------------
def rim_filter(fid, rim, tint=None, dx=-3.5, dy=-2.5):
    """Coloured rim light around the whole silhouette, plus optional scene tint."""
    tint_steps = ""
    src = "SourceGraphic"
    if tint:
        tint_steps = (f'<feFlood flood-color="{tint}" result="tc"/>'
                      f'<feBlend in="SourceGraphic" in2="tc" mode="multiply" result="tb"/>'
                      f'<feComposite in="tb" in2="SourceAlpha" operator="in" result="tinted"/>')
        src = "tinted"
    return (f'<filter id="{fid}" x="-30%" y="-15%" width="160%" height="130%" '
            f'color-interpolation-filters="sRGB">'
            f'<feMorphology in="SourceAlpha" operator="dilate" radius="4.5" result="d"/>'
            f'<feOffset in="d" dx="{dx}" dy="{dy}" result="o"/>'
            f'<feFlood flood-color="{rim}"/>'
            f'<feComposite in2="o" operator="in" result="rim"/>'
            f'<feGaussianBlur in="rim" stdDeviation="9" result="glow"/>'
            f'{tint_steps}'
            f'<feMerge><feMergeNode in="glow"/><feMergeNode in="rim"/><feMergeNode in="{src}"/></feMerge>'
            f'</filter>')


# --- scenes (stand-ins for Kling backgrounds) ------------------------------
W, H = 640, 320


def city(rng, y0, color, n, hmin, hmax, wmin, wmax, lights=None):
    out, x = [], -10
    while x < W + 10:
        w = rng.uniform(wmin, wmax)
        h = rng.uniform(hmin, hmax)
        out.append(f'<rect x="{f(x)}" y="{f(y0 - h)}" width="{f(w)}" height="{f(h + 60)}" fill="{color}"/>')
        if lights and rng.random() < 0.8:
            for _ in range(rng.randint(2, 6)):
                lx = x + rng.uniform(4, max(5, w - 8))
                ly = y0 - h + rng.uniform(8, max(9, h - 10))
                out.append(f'<rect x="{f(lx)}" y="{f(ly)}" width="3" height="4" fill="{lights}" opacity="0.55"/>')
        x += w + rng.uniform(0, 6)
        if len(out) > 4 * n:
            break
    return "".join(out)


def scene(kind):
    rng = random.Random(7 if kind == "night" else 11)
    p = uid("sc")
    if kind == "night":
        sky = ("#121833", "#232D55", "#33406E")
        far, near, ground, lights = "#2A335E", "#1B2244", "#11152B", "#F3D58A"
        sun = (470, 70, 20, "#EEF1FF", "#AFC2FF")
        rim, tint = RIM_COOL, "#B7C3EC"
        fig, face, x = view_three_quarter, "smug", 300
    else:
        sky = ("#F7CB91", "#E8A07A", "#9B6168")
        far, near, ground, lights = "#B47E72", "#7C5159", "#4F3540", None
        sun = (430, 200, 38, "#FFF3D6", "#FFD394")
        rim, tint = RIM_WARM, "#F6DFCB"
        fig, face, x = view_front, "power", 250

    defs = (f'<linearGradient id="{p}sky" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{sky[0]}"/><stop offset=".6" stop-color="{sky[1]}"/>'
            f'<stop offset="1" stop-color="{sky[2]}"/></linearGradient>'
            f'<radialGradient id="{p}sun"><stop offset="0" stop-color="{sun[4]}" stop-opacity=".9"/>'
            f'<stop offset="1" stop-color="{sun[4]}" stop-opacity="0"/></radialGradient>'
            f'<radialGradient id="{p}vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/>'
            f'<stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>'
            f'<filter id="{p}b1"><feGaussianBlur stdDeviation="2.6"/></filter>'
            f'<filter id="{p}b2"><feGaussianBlur stdDeviation="1.2"/></filter>'
            + rim_filter(f"{p}rim", rim, tint))
    rain = ""
    if kind == "night":
        rain = "".join(
            f'<path d="M{f(rx)},{f(ry)} l-2,9" stroke="#C9D6FF" stroke-width="1.2" opacity=".35"/>'
            for rx, ry in ((rng.uniform(0, W), rng.uniform(0, H)) for _ in range(70)))
    s = 0.66
    body = (f'<rect width="{W}" height="{H}" fill="url(#{p}sky)"/>'
            + circle(sun[:2], sun[2] * 4, f"url(#{p}sun)")
            + circle(sun[:2], sun[2], sun[3])
            + f'<g filter="url(#{p}b1)">{city(rng, 250, far, 30, 50, 140, 26, 60)}</g>'
            + f'<g filter="url(#{p}b2)">{city(rng, 275, near, 30, 20, 90, 40, 90, lights)}</g>'
            + f'<rect y="270" width="{W}" height="60" fill="{ground}"/>'
            + rain
            + f'<g transform="translate({x} 300) scale({s})" filter="url(#{p}rim)">{fig(face)}</g>'
            + f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>'
            + f'<rect width="{W}" height="14" fill="#000"/><rect y="{H - 14}" width="{W}" height="14" fill="#000"/>')
    return f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg"><defs>{defs}</defs>{body}</svg>'


# --- sheet sections --------------------------------------------------------
def turnaround_svg():
    sc = 1.7
    ground = 790
    views = [(view_front, 250), (view_three_quarter, 545), (view_side, 835), (view_back, 1120)]
    guides = [(0, "земля"), (HEM, "низ худи"), (HEAD_Y + R, "подбородок"), (HEAD_Y - R, "макушка")]
    g = []
    for y, label in guides:
        yy = ground + y * sc
        g.append(f'<line x1="120" x2="1270" y1="{f(yy)}" y2="{f(yy)}" stroke="#B9B0A3" '
                 f'stroke-width="1.5" stroke-dasharray="6 7"/>')
        g.append(f'<text x="108" y="{f(yy + 5)}" text-anchor="end" class="guide">{label}</text>')
    for i in range(1, 5):
        yy = ground - i * (HEIGHT / 4) * sc
        g.append(f'<text x="1282" y="{f(yy + 5)}" class="guide">{i}</text>')
    for fn, x in views:
        arg = () if fn in (view_side, view_back) else ("neutral",)
        g.append(f'<ellipse cx="{x}" cy="{ground}" rx="70" ry="9" fill="#000" opacity=".08"/>')
        g.append(f'<g transform="translate({x} {ground}) scale({sc})">{fn(*arg)}</g>')
    for (_, x), label in zip(views, ["СПЕРЕДИ", "3/4", "СБОКУ", "СЗАДИ"]):
        g.append(f'<text x="{x}" y="{ground + 44}" text-anchor="middle" class="view">{label}</text>')
    return f'<svg viewBox="0 0 1300 850" xmlns="http://www.w3.org/2000/svg">{"".join(g)}</svg>'


EXPRESSIONS = [
    ("neutral", "Нейтрально"), ("smug", "Уверенность"), ("angry", "Злость"),
    ("shock", "Шок"), ("happy", "Радость"), ("sad", "Грусть"),
    ("scared", "Страх"), ("smirk", "Ухмылка"), ("power", "Сила / озарение"),
]


def expression_cell(face):
    cid = uid("cell")
    return (f'<svg viewBox="-110 -86 220 214" xmlns="http://www.w3.org/2000/svg">'
            f'<clipPath id="{cid}"><rect x="-110" y="-86" width="220" height="214"/></clipPath>'
            f'<g clip-path="url(#{cid})"><g transform="scale(1.08)">{bust(face)}</g></g></svg>')


PALETTE = [
    (INK, "Голова и тело"), (RED, "Худи"), (RED_SH, "Худи — тень"),
    (RED_DK, "Манжеты, резинка, капюшон"), (FACE, "Глаза, брови, рот"),
    (STRING, "Шнурки"), (RIM_COOL, "Контурный свет — ночь"), (RIM_WARM, "Контурный свет — закат"),
]

RULES = [
    "Голова — идеальный чёрный круг без обводки. Лицо — только кремовые глаза, брови и рот.",
    "Шея и ноги — тонкие чёрные палки, кисти — круглые чёрные «варежки».",
    "Худи длинное, до середины бедра. Капюшон всегда снят и лежит за шеей. Белые шнурки — главная примета.",
    "Тонкий тёмный контур — только у одежды. Тень — одна плоская заливка, без градиентов.",
    "Вокруг фигуры — контурный свет в цвет освещения фона: так герой «садится» в фон из Kling.",
    "Фон приглушённый и чуть размытый, герой — самое контрастное пятно в кадре. Кадр 2:1 с полосами.",
]

CSS = """
* { box-sizing: border-box; }
body { margin: 0; background: #ECE7DE; font-family: Inter, sans-serif; color: #231C1F; }
.page { width: 2400px; padding: 56px 64px 64px; }
header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 36px; }
h1 { font-family: 'Inter Display', Inter, sans-serif; font-weight: 800; font-size: 68px;
     letter-spacing: -1.5px; margin: 0; line-height: 1; }
h1 span { color: #D93B3B; }
.sub { font-size: 24px; color: #7A706A; margin-top: 14px; }
.tag { font-size: 20px; color: #7A706A; text-align: right; line-height: 1.5; }
.row { display: grid; grid-template-columns: 1300px 1fr; gap: 32px; margin-bottom: 32px; }
.card { background: #F6F2EC; border-radius: 22px; padding: 26px 28px; }
.card.dark { background: #1C1B22; color: #ECE7DE; }
h2 { font-size: 17px; font-weight: 700; letter-spacing: 2.4px; text-transform: uppercase;
     color: #9A8F87; margin: 0 0 14px; }
.dark h2 { color: #8C8794; }
.guide { font: 500 15px Inter; fill: #9A8F87; }
.view { font: 700 18px Inter; fill: #6E6460; letter-spacing: 2.4px; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.cell { background: #E9E3DA; border-radius: 16px; overflow: hidden; position: relative; }
.cell svg { display: block; width: 100%; }
.cell span { position: absolute; left: 14px; top: 11px; font-size: 16px; font-weight: 600; color: #6E6460; }
.scenes { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.scenes svg { display: block; width: 100%; border-radius: 12px; }
.cap { font-size: 18px; margin-top: 12px; color: #C9C3CE; }
.cap b { color: #fff; font-weight: 600; }
.cap i { font-style: normal; font-family: 'DejaVu Sans Mono', monospace; font-size: 15px; color: #8C8794; }
.info { display: grid; grid-template-columns: 0.8fr 1.3fr; gap: 32px; }
.sw { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; font-size: 17px; }
.sw div { width: 36px; height: 36px; border-radius: 11px; flex: none; box-shadow: inset 0 0 0 1.5px rgba(0,0,0,.12); }
.sw code { font-family: 'DejaVu Sans Mono', monospace; font-size: 14px; color: #8A807A; display: block; }
ol { margin: 0; padding-left: 26px; font-size: 18px; line-height: 1.42; }
ol li { margin-bottom: 9px; }
ol li::marker { color: #D93B3B; font-weight: 700; }
"""


def sheet_html():
    cells = "".join(f'<div class="cell">{expression_cell(k)}<span>{label}</span></div>'
                    for k, label in EXPRESSIONS)
    swatches = "".join(f'<div class="sw"><div style="background:{c}"></div>'
                       f'<p style="margin:0">{name}<code>{c}</code></p></div>' for c, name in PALETTE)
    rules = "".join(f"<li>{r}</li>" for r in RULES)
    return f"""<!doctype html><html lang="ru"><head><meta charset="utf-8">
<title>Герой в красном худи — концепт</title><style>{CSS}</style></head><body><div class="page">
<header><div><h1>Герой в <span>красном худи</span></h1>
<div class="sub">Концепт персонажа · 2D-стикмен, плоский вектор · v1</div></div>
<div class="tag">рост ≈ 4 головы<br>голова = 100 ед.</div></header>
<div class="row">
  <div class="card"><h2>Разворот</h2>{turnaround_svg()}</div>
  <div class="card"><h2>Эмоции</h2><div class="grid">{cells}</div></div>
</div>
<div class="row">
  <div class="card dark"><h2>Свет и фон</h2><div class="scenes">
    <div>{scene("night")}<div class="cap"><b>Ночь</b> — холодный контурный свет <i>{RIM_COOL}</i></div></div>
    <div>{scene("sunset")}<div class="cap"><b>Закат</b> — тёплый контурный свет <i>{RIM_WARM}</i></div></div>
  </div><div class="cap" style="margin-top:16px">Фоны здесь — заглушки. В роликах фон из Kling, персонаж кладётся сверху отдельным слоем.</div></div>
  <div class="card"><div class="info">
    <div><h2>Палитра</h2>{swatches}</div>
    <div><h2>Правила стиля</h2><ol>{rules}</ol></div>
  </div></div>
</div>
</div></body></html>"""


def standalone(fn, name, *args):
    pad = 20
    body = fn(*args)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-90 - pad} {-HEIGHT - pad} '
            f'{180 + 2 * pad} {HEIGHT + 2 * pad}" width="{180 + 2 * pad}" height="{HEIGHT + 2 * pad}">'
            f'<title>{name}</title>{body}</svg>')


RENDER_JS = """
const { chromium } = require('playwright');
(async () => {
  const [html, png] = process.argv.slice(1);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2400, height: 1000 } });
  await page.goto('file://' + html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: png, fullPage: true });
  await browser.close();
})();
"""


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(SVG_DIR, exist_ok=True)
    for fn, name, args in [(view_front, "front", ("neutral",)),
                           (view_three_quarter, "three_quarter", ("neutral",)),
                           (view_side, "side", ()), (view_back, "back", ())]:
        with open(os.path.join(SVG_DIR, f"hero_{name}.svg"), "w", encoding="utf-8") as fh:
            fh.write(standalone(fn, f"hero {name}", *args))
    html = os.path.join(OUT, "hero_concept.html")
    with open(html, "w", encoding="utf-8") as fh:
        fh.write(sheet_html())
    png = os.path.join(OUT, "hero_concept.png")
    subprocess.run(["node", "-e", RENDER_JS, html, png], check=True)
    print(png)


if __name__ == "__main__":
    main()
