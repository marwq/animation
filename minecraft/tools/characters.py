"""Персонажи серии: Герой, Подруга, Пёс, Зомби-хулиган.

Каждый персонаж — функция boxes(expr, pose, head_only) → список коробок (blocky.Box).
expr — эмоция лица, pose — поза ('stand' — нейтральная для разворота).
Координаты модели: x — к левому боку персонажа, y — вверх, z — вперёд; земля y = 0.
"""
import faces as F
from blocky import OUT, Box, ell, line, path, poly, rect, n

# ====================================================================== общие куски
def human_features(expr, skin, brow_color, eye_y=5.6, mouth_y=8.0, lashes=False, w=10.0, hairline=2.4):
    """Лицо человека на грани 10×10 для любой эмоции."""
    lx, rx_ = w * 0.3, w * 0.7          # центры глаз
    by = eye_y - 1.85                    # линия бровей
    L, R = -1, 1                         # сторона: левый / правый глаз от зрителя
    out = []

    def eyes(**kw):
        return (F.eye(lx, eye_y, lashes=-1 if lashes else 0, lid_color=skin, **kw) +
                F.eye(rx_, eye_y, lashes=1 if lashes else 0, lid_color=skin, **kw))

    def brows(inner=0.0, outer=0.0, dy=0.0, inner_r=None, outer_r=None):
        return (F.brow(lx, by + dy, L, brow_color, inner=inner, outer=outer) +
                F.brow(rx_, by + dy, R, brow_color,
                       inner=inner if inner_r is None else inner_r,
                       outer=outer if outer_r is None else outer_r))

    m = w / 2
    if expr == 'neutral':
        out += brows() + eyes(look=(0, 0.06)) + F.mouth_smile(m, mouth_y, w=0.8, depth=0.45)
    elif expr == 'happy':
        out += F.blush(lx - 0.5, eye_y + 1.6) + F.blush(rx_ + 0.5, eye_y + 1.6)
        out += brows(dy=-0.3) + F.eye_happy(lx, eye_y) + F.eye_happy(rx_, eye_y)
        out += F.mouth_open(m, mouth_y - 0.1, w=1.25, depth=1.3)
    elif expr == 'laugh':
        out += F.blush(lx - 0.5, eye_y + 1.5) + F.blush(rx_ + 0.5, eye_y + 1.5)
        out += brows(dy=-0.45, inner=-0.2) + F.eye_squeeze(lx, eye_y, L) + F.eye_squeeze(rx_, eye_y, R)
        out += F.tear(lx - 1.25, eye_y + 0.2, 0.7) + F.tear(rx_ + 1.25, eye_y + 0.2, 0.7)
        out += F.mouth_open(m, mouth_y - 0.35, w=1.65, depth=2.0)
    elif expr == 'shock':
        out += brows(dy=-0.85, inner=-0.15)
        out += eyes(rx=1.25, ry=1.55, pupil=(0.3, 0.36))
        out += F.mouth_o(m, mouth_y - 0.3, rx=0.8, ry=1.2)
        out += F.sweat(w * 0.9, eye_y - 2.0, 0.9)
    elif expr == 'sad':
        out += brows(inner=-0.55, outer=0.2)
        out += eyes(look=(0, 0.3), pupil=(0.62, 0.76))
        out += F.tear(lx + 0.15, eye_y + 1.55, 0.75)
        out += F.mouth_frown(m, mouth_y, w=0.85, depth=0.6)
    elif expr == 'crying':
        out += brows(inner=-0.65, outer=0.2)
        out += F.tear_stream(lx, eye_y + 0.35, w * 0.97) + F.tear_stream(rx_, eye_y + 0.35, w * 0.97)
        out += F.eye_closed_down(lx, eye_y) + F.eye_closed_down(rx_, eye_y)
        out += F.mouth_wail(m, mouth_y - 0.5)
    elif expr == 'angry':
        out += brows(inner=0.6, outer=-0.35, dy=0.15)
        out += eyes(pupil=(0.36, 0.44), lid=0.22)
        out += F.mouth_gritted(m, mouth_y - 0.1)
        out += F.vein(w * 0.86, by - 0.45)
    elif expr == 'smug':
        out += brows(inner=0.15, outer=0.15, inner_r=-0.45, outer_r=-0.75)
        out += eyes(look=(0.3, 0.05), lid=0.45)
        out += F.mouth_smirk(m + 0.1, mouth_y)
    elif expr == 'scared':
        out += F.gloom(w, hairline)
        out += brows(inner=-0.6, outer=0.05)
        out += eyes(look=(-0.25, 0), pupil=(0.3, 0.36), rx=1.15, ry=1.4)
        out += F.mouth_wavy(m, mouth_y + 0.1)
        out += F.sweat(w * 0.9, eye_y - 2.0, 0.9) + F.sweat(w * 0.1, eye_y - 1.4, 0.7)
    else:
        raise ValueError(expr)
    return out


def sleeve(color, length):
    """Рукав на всех вертикальных гранях руки."""
    def dec(ul, vl):
        return [rect(0, 0, ul, length, color), line([(0, length), (ul, length)])]
    return dec


def band(color, v0, v1, lines=True):
    def dec(ul, vl):
        out = [rect(0, v0, ul, v1 - v0, color)]
        if lines:
            out += [line([(0, v0), (ul, v0)]), line([(0, v1), (ul, v1)])] if v1 < vl else [line([(0, v0), (ul, v0)])]
        return out
    return dec


def merge(*decs):
    def dec(ul, vl):
        out = []
        for d in decs:
            out += d(ul, vl) if callable(d) else d
        return out
    return dec


def shoulder_arm(name, size, at, color, decals, rot, after=()):
    """Рука с точкой поворота в плече (центр верхней грани)."""
    w, h, d = size
    pivot = (at[0] + w / 2, at[1] + h - 0.3, at[2] + d / 2)
    return Box(name, size, at, color, decals, pivot=pivot, rot=rot, after=after)


# ====================================================================== ГЕРОЙ
class Hero:
    NAME = 'hero'
    TITLE = 'Герой'
    SKIN = '#eeb58f'
    HAIR = '#5b3a24'
    HAIR_DK = '#3a2416'
    SHIRT = '#35b5c4'
    STRAP = '#7b4a2a'
    METAL = '#d9d3c4'
    PANTS = '#4a46a6'
    SHOES = '#4b3a30'
    POUCH = '#9a6235'
    PALETTE = (('Кожа', SKIN), ('Волосы', HAIR), ('Брови', HAIR_DK), ('Футболка', SHIRT),
               ('Ремень', STRAP), ('Сумка', POUCH), ('Пряжка', METAL), ('Штаны', PANTS),
               ('Ботинки', SHOES), ('Контур', OUT))
    # направляющие (y модели): земля, низ тела, низ головы, глаза, макушка
    GUIDES = (0, 5.4, 12, 12 + 10 - 5.6, 22)
    EXPRESSIONS = ('neutral', 'happy', 'laugh', 'shock', 'sad', 'crying', 'angry', 'smug', 'scared')

    @classmethod
    def boxes(cls, expr='neutral', pose='stand', head_only=False):
        H, HD, S = cls.HAIR, cls.HAIR_DK, cls.SKIN
        front_hair = [poly([(0, 0), (10, 0), (10, 4.4), (9.3, 4.4), (9.3, 2.5), (7.8, 2.5), (6.6, 3.15),
                            (5.6, 2.4), (4.2, 2.4), (3.0, 2.95), (2.0, 2.3), (0.7, 2.3), (0.7, 4.4),
                            (0, 4.4)], H),
                      line([(3.6, 0.5), (4.6, 1.5)], sw=3, stroke=HD),
                      line([(6.4, 0.7), (7.2, 1.6)], sw=3, stroke=HD)]
        side_hair = [poly([(0, 0), (10, 0), (10, 7.6), (9.0, 7.6), (8.4, 8.1), (7.4, 7.2), (6.4, 7.3),
                           (5.8, 6.0), (6.0, 4.6), (5.2, 3.3), (4.0, 2.6), (2.4, 2.5), (0.8, 2.5),
                           (0.8, 4.4), (0, 4.4)], H),
                     rect(4.0, 4.9, 1.3, 1.8, S, stroke=OUT, r=0.35),
                     line([(4.45, 5.4), (4.85, 5.8), (4.45, 6.2)], sw=3),
                     line([(7.0, 1.0), (8.6, 2.6)], sw=3, stroke=HD)]
        back_hair = [poly([(0, 0), (10, 0), (10, 7.6), (9.0, 7.6), (8.4, 8.1), (7.4, 7.2), (6.0, 7.8),
                           (4.6, 7.1), (3.4, 7.9), (2.4, 7.3), (1.0, 7.7), (0, 7.6)], H),
                     line([(3.0, 2.0), (3.6, 5.0)], sw=3, stroke=HD),
                     line([(6.6, 1.6), (6.2, 4.6)], sw=3, stroke=HD)]
        top_hair = [line([(2.5, 2.5), (4.0, 6.0)], sw=3, stroke=HD), line([(6.5, 3.0), (7.2, 7.0)], sw=3, stroke=HD)]
        head = Box('head', (10, 10, 10), (-5, 12, -5), {'default': S, 'top': H, 'back': H},
                   {'front': front_hair + human_features(expr, S, HD), 'side': side_hair,
                    'back': back_hair, 'top': top_hair})
        tuft = Box('tuft', (1.4, 2.3, 1.4), (0.6, 21.7, -0.9), H, pivot=(1.3, 21.7, -0.2),
                   rot=(0, 0, -22), after=('head',))
        if head_only:
            return [tuft, head]

        shirt_front = [poly([(2.4, 0), (4.2, 0), (3.3, 1.15)], S),
                       poly([(0, 0), (1.3, 0), (6.6, 4.5), (6.6, 5.8)], cls.STRAP),
                       rect(4.25, 3.15, 0.85, 0.85, cls.METAL, stroke=OUT, r=0.12)]
        shirt_back = [poly([(5.3, 0), (6.6, 0), (0, 5.8), (0, 4.5)], cls.STRAP)]
        shirt_left = [rect(0, 4.5, 3.4, 1.3, cls.STRAP), line([(0, 4.5), (3.4, 4.5)]), line([(0, 5.8), (3.4, 5.8)])]
        body = Box('body', (6.6, 6.6, 3.4), (-3.3, 5.4, -1.7), cls.SHIRT,
                   {'front': shirt_front, 'back': shirt_back, 'left': shirt_left})
        pouch = Box('pouch', (2.6, 2.3, 1.2), (0.5, 5.7, -2.9), cls.POUCH,
                    {'back': [rect(0, 0, 2.6, 0.95, '#7d4c27'), line([(0, 0.95), (2.6, 0.95)]),
                              rect(1.05, 0.7, 0.5, 0.5, cls.METAL, stroke=OUT, r=0.1)]})
        arm_dec = {'around': sleeve(cls.SHIRT, 2.3)}
        ra, la = (0, 0, 0), (0, 0, 0)
        if pose == 'wave':
            ra = (20, 0, -118)
        arm_r = shoulder_arm('arm-right', (2.4, 6.4, 2.4), (-5.7, 5.6, -1.2), S, arm_dec, ra)
        arm_l = shoulder_arm('arm-left', (2.4, 6.4, 2.4), (3.3, 5.6, -1.2), S, arm_dec, la)
        legs_dec = {'around': band(cls.SHOES, 4.3, 5.4), 'bottom': [rect(0, 0, 3.3, 3.4, cls.SHOES)]}
        leg_r = Box('leg-right', (3.3, 5.4, 3.4), (-3.3, 0, -1.7), cls.PANTS, legs_dec)
        leg_l = Box('leg-left', (3.3, 5.4, 3.4), (0, 0, -1.7), cls.PANTS, legs_dec)
        return [pouch, leg_r, leg_l, body, arm_r, arm_l, tuft, head]


# ====================================================================== ПОДРУГА
class Friend:
    NAME = 'friend'
    TITLE = 'Подруга'
    SKIN = '#f7caa6'
    HAIR = '#ec7a2c'
    HAIR_DK = '#b4501a'
    FRECKLE = '#d98a5f'
    SHIRT = '#5fba49'
    SHIRT_DK = '#3f8f30'
    BELT = '#6f4426'
    GOLD = '#f2c94c'
    TROUSERS = '#7b5536'
    BOOTS = '#3f3029'
    MINT = '#5fd3bd'
    PALETTE = (('Кожа', SKIN), ('Волосы', HAIR), ('Брови', HAIR_DK), ('Веснушки', FRECKLE),
               ('Рубашка', SHIRT), ('Пояс', BELT), ('Пряжка', GOLD), ('Брюки', TROUSERS),
               ('Сапоги', BOOTS), ('Заколка', MINT), ('Контур', OUT))
    GUIDES = (0, 5.0, 11.6, 11.6 + 10 - 5.7, 21.6)
    EXPRESSIONS = ('neutral', 'happy', 'laugh', 'shock', 'sad', 'crying', 'angry', 'smug', 'scared')

    @classmethod
    def boxes(cls, expr='neutral', pose='stand', head_only=False):
        H, HD, S = cls.HAIR, cls.HAIR_DK, cls.SKIN
        y0 = 11.6   # низ головы
        bangs = path('M0 0 H10 V5.2 H9.3 V2.3 C7.9 2.5 5.8 3.0 4.0 3.5 C2.7 3.85 1.6 4.0 0.7 4.0 '
                     'V5.2 H0 Z', H)
        freckles = [ell(x, y, 0.13, 0.13, cls.FRECKLE, stroke=None)
                    for x, y in ((1.7, 7.2), (2.3, 7.55), (1.5, 7.75), (8.3, 7.2), (7.7, 7.55), (8.5, 7.75))]
        clip = [rect(6.6, 1.6, 1.5, 0.55, cls.MINT, stroke=OUT, r=0.2, extra='transform="rotate(-12 7.35 1.88)"')]
        front = [bangs, line([(5.0, 0.6), (3.4, 2.2)], sw=3, stroke=HD), line([(7.6, 0.4), (6.4, 1.5)], sw=3, stroke=HD)]
        front += freckles + human_features(expr, S, HD, eye_y=5.7, mouth_y=8.1, lashes=True, hairline=3.0) + clip
        side_hair = [poly([(0, 0), (10, 0), (10, 9.0), (9.0, 9.2), (8.2, 8.5), (7.2, 9.1), (6.4, 8.2),
                           (5.9, 6.4), (6.0, 4.6), (5.2, 3.2), (3.8, 2.4), (2.0, 2.3), (0.9, 2.3),
                           (0.9, 5.6), (0.45, 6.1), (0, 5.6)], H),
                     rect(4.0, 5.0, 1.3, 1.8, S, stroke=OUT, r=0.35),
                     line([(4.45, 5.5), (4.85, 5.9), (4.45, 6.3)], sw=3),
                     line([(6.8, 1.0), (8.4, 3.0)], sw=3, stroke=HD)]
        back_hair = [poly([(0, 0), (10, 0), (10, 9.0), (8.9, 9.3), (7.8, 8.6), (6.4, 9.4), (5.0, 8.7),
                           (3.6, 9.4), (2.2, 8.6), (1.1, 9.3), (0, 9.0)], H),
                     line([(3.2, 2.6), (3.0, 6.4)], sw=3, stroke=HD), line([(7.0, 2.4), (7.2, 6.0)], sw=3, stroke=HD)]
        head = Box('head', (10, 10, 10), (-5, y0, -5), {'default': S, 'top': H, 'back': H},
                   {'front': front, 'side': side_hair, 'back': back_hair,
                    'top': [line([(5, 0), (5, 10)], sw=3, stroke=HD)]})
        tail = Box('ponytail', (3.0, 5.6, 2.6), (-1.5, y0 + 8.2 - 5.6, -7.2), H,
                   {'around': [rect(0, 0.35, 3.0, 0.75, cls.MINT, stroke=OUT, sw=3),
                               line([(1.0, 2.0), (1.2, 4.8)], sw=3, stroke=HD)]},
                   pivot=(0, y0 + 8.2, -4.6), rot=(14, 0, 0))
        if head_only:
            return [tail, head]

        def shirt_dec(ul, vl):
            return [rect(0, 5.0, ul, 0.75, cls.BELT), line([(0, 5.0), (ul, 5.0)]), line([(0, 5.75), (ul, 5.75)])]
        body = Box('body', (6.6, 6.6, 3.4), (-3.3, 5.0, -1.7), cls.SHIRT,
                   {'around': shirt_dec,
                    'front': [path('M2.3 0 Q3.3 1.3 4.3 0 Z', S),
                              line([(3.3, 1.3), (3.3, 5.0)], sw=3, stroke=cls.SHIRT_DK),
                              rect(2.85, 4.95, 0.9, 0.85, cls.GOLD, stroke=OUT, r=0.12)]})
        arm_dec = {'around': sleeve(cls.SHIRT, 1.8)}
        ra = (0, 0, -128) if pose == 'wave' else (0, 0, 0)
        arm_r = shoulder_arm('arm-right', (2.0, 6.2, 2.2), (-5.3, 5.4, -1.1), S, arm_dec, ra)
        arm_l = shoulder_arm('arm-left', (2.0, 6.2, 2.2), (3.3, 5.4, -1.1), S, arm_dec, (0, 0, 0))

        def boot(ul, vl):
            return [rect(0, 3.2, ul, 1.8, cls.BOOTS), line([(0, 3.2), (ul, 3.2)]),
                    rect(0, 3.2, ul, 0.35, '#5a473b'), line([(0, 3.55), (ul, 3.55)], sw=2.5)]
        legs_dec = {'around': boot, 'bottom': [rect(0, 0, 3.3, 3.4, cls.BOOTS)]}
        leg_r = Box('leg-right', (3.3, 5.0, 3.4), (-3.3, 0, -1.7), cls.TROUSERS, legs_dec)
        leg_l = Box('leg-left', (3.3, 5.0, 3.4), (0, 0, -1.7), cls.TROUSERS, legs_dec)
        return [leg_r, leg_l, body, arm_r, arm_l, tail, head]


# ====================================================================== ПЁС
class Dog:
    NAME = 'dog'
    TITLE = 'Пёс'
    COAT = '#e4974a'
    COAT_DK = '#c47732'
    CREAM = '#fdf0d8'
    COLLAR = '#3a7be0'
    NOSE = '#2b2224'
    INNER_EAR = '#f2a7a1'
    PALETTE = (('Шерсть', COAT), ('Висячее ухо', COAT_DK), ('Морда, лапы', CREAM), ('Ошейник', COLLAR),
               ('Нос', NOSE), ('Внутри уха', INNER_EAR), ('Контур', OUT))
    GUIDES = (0, 3.0, 7.2, 11.4 - 2.3, 11.4)
    EXPRESSIONS = ('neutral', 'happy', 'smug', 'sad', 'shock', 'angry')

    @classmethod
    def features(cls, expr):
        """(наклейки лба 5.6×5.2, наклейки носа-морды 3.0×2.2)."""
        C = cls.COAT
        lx, rx_, ey, by = 1.45, 4.15, 2.0, 0.75
        head, snout = [], []

        def eyes(**kw):
            base = dict(rx=0.78, ry=0.95, pupil=(0.42, 0.52), lid_color=C)
            base.update(kw)
            return F.eye(lx, ey, **base) + F.eye(rx_, ey, **base)

        def brows(inner=0.0, outer=0.0, inner_r=None, outer_r=None, dy=0.0):
            return (F.brow(lx, by + dy, -1, OUT, half=0.6, inner=inner, outer=outer, arch=-0.1, sw=6.5) +
                    F.brow(rx_, by + dy, 1, OUT, half=0.6, inner=inner if inner_r is None else inner_r,
                           outer=outer if outer_r is None else outer_r, arch=-0.1, sw=6.5))

        nose = [rect(0.95, 0.12, 1.1, 0.68, cls.NOSE, stroke=OUT, r=0.28, sw=3),
                ell(1.75, 0.3, 0.16, 0.1, '#ffffff', stroke=None, extra='opacity="0.8"')]
        w_mouth = [line([(1.5, 0.8), (1.5, 1.2)], sw=4.5),
                   path('M0.75 1.1 Q1.1 1.55 1.5 1.2 Q1.9 1.55 2.25 1.1', sw=4.5)]
        if expr == 'neutral':
            head += brows() + eyes()
            snout += w_mouth + nose
        elif expr == 'happy':
            head += brows(dy=-0.2) + F.eye_happy(lx, ey, w=0.62) + F.eye_happy(rx_, ey, w=0.62)
            snout += [path('M0.55 1.0 L2.45 1.0 Q2.35 2.0 1.5 2.0 Q0.65 2.0 0.55 1.0 Z', F.MOUTH, sw=4.5),
                      path('M1.05 1.55 L1.95 1.55 L1.95 2.75 Q1.5 3.15 1.05 2.75 Z', F.TONGUE, sw=3.5),
                      line([(1.5, 1.75), (1.5, 2.6)], sw=2.5, stroke='#c24b55')] + nose
        elif expr == 'smug':
            head += brows(inner=0.25, outer=0.2, inner_r=-0.35, outer_r=-0.55)
            head += eyes(look=(0.2, 0.05), lid=0.48)
            snout += [path('M0.3 1.0 Q1.5 1.45 2.75 0.75 Q2.55 1.9 1.5 1.95 Q0.55 1.9 0.3 1.0 Z', F.TEETH, sw=4.5),
                      line([(0.45, 1.45), (2.65, 1.2)], sw=2.5)] + \
                     [line([(x, 1.0 + (x - 0.3) * 0.08), (x, 1.85)], sw=2.5) for x in (0.95, 1.5, 2.05)] + nose
        elif expr == 'sad':
            head += brows(inner=-0.4, outer=0.2)
            head += eyes(pupil=(0.55, 0.68), look=(0, 0.12))
            head += [ell(lx + 0.12, ey + 0.32, 0.12, 0.12, '#ffffff', stroke=None),
                     ell(rx_ + 0.12, ey + 0.32, 0.12, 0.12, '#ffffff', stroke=None)]
            snout += [line([(1.5, 0.8), (1.5, 1.15)], sw=4.5),
                      path('M0.9 1.6 Q1.5 1.0 2.1 1.6', sw=4.5)] + nose
        elif expr == 'shock':
            head += brows(dy=-0.35, inner=-0.1)
            head += eyes(rx=0.92, ry=1.1, pupil=(0.24, 0.3))
            snout += F.mouth_o(1.5, 0.95, rx=0.42, ry=0.55) + nose
        elif expr == 'angry':
            head += brows(inner=0.45, outer=-0.25)
            head += eyes(pupil=(0.3, 0.36), lid=0.22)
            snout += F.mouth_gritted(1.5, 1.15, w=1.0, h=0.75) + nose
        else:
            raise ValueError(expr)
        return head, snout

    @classmethod
    def boxes(cls, expr='neutral', pose='stand', head_only=False):
        C, CR = cls.COAT, cls.CREAM
        head_dec, snout_dec = cls.features(expr)
        hw, hh, hd = 6.4, 6.0, 5.0        # голова
        sw_, sh, sd = 3.4, 2.4, 2.6       # нос-морда
        hy, hz = 5.4, 4.2                 # низ и задняя грань головы
        # рисунок лица задан в сетке 5.6×5.2 (лоб) и 3.0×2.2 (морда) — растягиваем под размер
        grid = f'<g transform="scale({n(hw / 5.6)} {n(hh / 5.2)})">'
        blaze = path('M2.35 0 L3.25 0 L3.55 2.9 L2.05 2.9 Z', CR, stroke=None)
        head = Box('head', (hw, hh, hd), (-hw / 2, hy, hz), C,
                   {'around': band(cls.COLLAR, hh - 0.9, hh),
                    'front': [grid + blaze + ''.join(head_dec) + '</g>'],
                    'top': [path(f'M{n(hw / 2 - 0.5)} {n(hd)} L{n(hw / 2 + 0.5)} {n(hd)} '
                                 f'L{n(hw / 2 + 0.25)} {n(hd - 2.4)} L{n(hw / 2 - 0.25)} {n(hd - 2.4)} Z',
                                 CR, stroke=None)]})
        snout = Box('snout', (sw_, sh, sd), (-sw_ / 2, hy + 0.2, hz + hd), CR,
                    {'front': [f'<g transform="scale({n(sw_ / 3.0)} {n(sh / 2.2)})">' + ''.join(snout_dec) + '</g>']},
                    after=('head',))
        top = hy + hh
        ear_up = Box('ear-right', (1.7, 2.2, 1.0), (-hw / 2 + 0.2, top - 0.15, hz + 1.9), C,
                     {'front': [path('M0.4 2.1 L0.85 0.5 L1.3 2.1 Z', cls.INNER_EAR, stroke=None)]},
                     pivot=(-hw / 2 + 1.05, top, hz + 2.4), rot=(0, 0, 10), after=('head',))
        ear_flop = Box('ear-left', (0.75, 2.9, 1.9), (hw / 2, top - 2.7, hz + 1.6), cls.COAT_DK,
                       pivot=(hw / 2, top + 0.1, hz + 2.55), rot=(0, 0, 20), after=('head',))
        parts = [head, snout, ear_up, ear_flop]
        if head_only:
            return parts
        body = Box('body', (5.0, 4.2, 8.4), (-2.5, 3.0, -4.2), C,
                   {'front': [rect(0.9, 1.4, 3.2, 2.8, CR)], 'bottom': [rect(0.8, 1.0, 3.4, 6.4, CR)]})
        paw = band(CR, 2.1, 3.0)
        legs = [Box(name, (1.6, 3.0, 1.6), (x, 0, z), C, {'around': paw, 'bottom': [rect(0, 0, 1.6, 1.6, CR)]})
                for name, x, z in (('leg-front-right', -2.5, 2.4), ('leg-front-left', 0.9, 2.4),
                                   ('leg-back-right', -2.5, -4.0), ('leg-back-left', 0.9, -4.0))]

        def tail_side(ul, vl):
            return [rect(ul - 1.0, 0, 1.0, vl, CR), line([(ul - 1.0, 0), (ul - 1.0, vl)])]
        tail_rot = (40, 0, 0) if pose == 'stand' else (62, 0, 0)
        tail = Box('tail', (1.2, 1.2, 3.6), (-0.6, 6.0, -7.8), C,
                   {'side': tail_side, 'back': [rect(0, 0, 1.2, 1.2, CR)],
                    'top': [rect(0, 0, 1.2, 1.0, CR), line([(0, 1.0), (1.2, 1.0)])],
                    'bottom': [rect(0, 2.6, 1.2, 1.0, CR), line([(0, 2.6), (1.2, 2.6)])]},
                   pivot=(0, 6.6, -4.2), rot=tail_rot)
        return legs + [tail, body] + parts


# ====================================================================== ЗОМБИ-ХУЛИГАН
class Zombie:
    NAME = 'zombie'
    TITLE = 'Зомби-хулиган'
    SKIN = '#86b25e'
    SKIN_DK = '#6a9646'
    HAIR = '#3a3a26'
    SOCKET = '#3b5a2b'
    GLOW = '#ffe46b'
    TANK = '#dcd6c6'
    STAIN = '#b3a483'
    JEANS = '#4f6a95'
    SNEAKER = '#ece6da'
    RED = '#d6453c'
    CAP = '#3a3e48'
    BANDAGE = '#efe4c8'
    PALETTE = (('Кожа', SKIN), ('Пятна', SKIN_DK), ('Глазницы', SOCKET), ('Глаза', GLOW),
               ('Волосы', HAIR), ('Майка', TANK), ('Грязь', STAIN), ('Джинсы', JEANS),
               ('Кепка', CAP), ('Козырёк, полоски', RED), ('Кеды', SNEAKER), ('Бинт', BANDAGE),
               ('Контур', OUT))
    GUIDES = (0, 6.0, 13.0, 13.0 + 10 - 5.1, 23.0, 24.4)
    EXPRESSIONS = ('neutral', 'grin', 'laugh', 'shock', 'sad', 'angry')

    @classmethod
    def features(cls, expr):
        S = cls.SKIN
        lx, rx_, ey = 3.0, 7.0, 5.1
        out = []

        def sockets(big=1.0):
            return [ell(lx, ey, 1.45 * big, 1.35 * big, cls.SOCKET, stroke=None),
                    ell(rx_, ey + 0.15, 1.15 * big, 1.05 * big, cls.SOCKET, stroke=None)]

        def eyes(look=(0.0, 0.0), pr=0.45, lid=0.0):
            res = []
            for cx, cy, s in ((lx, ey, 1.0), (rx_, ey + 0.15, 0.82)):
                res.append(ell(cx + look[0], cy + look[1], pr * s, pr * 1.12 * s, cls.GLOW, sw=3))
                if lid:
                    ry = 1.35 if s == 1.0 else 1.05
                    rxx = 1.45 if s == 1.0 else 1.15
                    ly = cy - ry + 2 * ry * lid
                    k = max(0.0, 1 - ((ly - cy) / ry) ** 2) ** 0.5
                    res.append(path(f'M{n(cx - rxx * k)} {n(ly)} A{n(rxx)} {n(ry)} 0 0 1 {n(cx + rxx * k)} {n(ly)} Z',
                                    S, stroke=None))
                    res.append(line([(cx - rxx * k, ly), (cx + rxx * k, ly)], sw=F.FEATURE))
            return res

        def brows(inner=0.0, outer=0.0, dy=0.0):
            return (F.brow(lx, 3.15 + dy, -1, cls.HAIR, half=1.25, inner=inner, outer=outer, sw=9) +
                    F.brow(rx_, 3.35 + dy, 1, cls.HAIR, half=1.05, inner=inner, outer=outer, sw=9))

        scar = [line([(7.7, 6.6), (8.7, 8.3)], sw=3.5)] + \
               [line([(7.75 + 0.3 * i + 0.25, 6.9 + 0.5 * i - 0.1), (7.75 + 0.3 * i - 0.25, 6.9 + 0.5 * i + 0.25)], sw=3)
                for i in range(3)]
        out += scar
        if expr in ('neutral', 'grin', 'angry', 'shock', 'sad'):
            out += sockets(1.12 if expr == 'shock' else 1.0)
        if expr == 'neutral':
            out += brows(inner=0.1, outer=0.1) + eyes(look=(0, 0.1), lid=0.4)
            out += [path('M3.4 8.0 Q5.0 8.2 6.8 7.8', sw=F.FEATURE),
                    rect(4.3, 8.05, 0.55, 0.5, F.TEETH, stroke=OUT, sw=3)]
        elif expr == 'grin':
            out += brows(inner=0.45, outer=-0.25) + eyes(look=(0.18, 0.05), pr=0.42)
            out += [path('M2.3 7.4 Q5.0 9.8 7.9 7.0 Q5.2 8.3 2.3 7.4 Z', '#3a1f22', sw=F.FEATURE),
                    poly([(3.5, 7.75), (4.15, 7.85), (4.1, 8.45), (3.55, 8.35)], F.TEETH, sw=3),
                    poly([(5.0, 7.9), (5.7, 7.85), (5.75, 8.5), (5.05, 8.55)], F.TEETH, sw=3),
                    poly([(6.3, 7.75), (6.85, 7.55), (6.8, 8.15), (6.35, 8.4)], F.TEETH, sw=3)]
        elif expr == 'laugh':
            out += brows(inner=-0.2, outer=0.1, dy=-0.2)
            out += F.eye_squeeze(lx, ey, -1, w=1.0) + F.eye_squeeze(rx_, ey + 0.15, 1, w=0.85)
            out += F.mouth_open(5.0, 7.3, w=2.0, depth=2.2) + F.tear(8.6, 5.4, 0.7)
        elif expr == 'shock':
            out += brows(dy=-0.7, inner=-0.2) + eyes(pr=0.24)
            out += F.mouth_o(5.0, 7.3, rx=0.85, ry=1.1) + F.sweat(9.1, 3.6, 0.9)
        elif expr == 'sad':
            out += brows(inner=-0.55, outer=0.25) + eyes(look=(0, 0.35), pr=0.5)
            out += F.tear(3.4, 6.8, 0.8) + F.mouth_frown(5.0, 8.0, w=1.1, depth=0.6)
        elif expr == 'angry':
            out += brows(inner=0.75, outer=-0.35) + eyes(pr=0.3, lid=0.25)
            out += F.mouth_gritted(5.0, 7.7, w=1.7, h=1.0) + F.vein(8.8, 2.2)
        else:
            raise ValueError(expr)
        return out

    @classmethod
    def boxes(cls, expr='grin', pose='stand', head_only=False):
        S, SD = cls.SKIN, cls.SKIN_DK
        y0 = 13.0
        spots = [rect(1.3, 2.0, 0.8, 0.6, SD), rect(8.2, 4.0, 0.9, 0.7, SD), rect(1.6, 8.2, 0.7, 0.6, SD)]
        tufts = [poly([(0, 1.3), (1.4, 1.3), (1.0, 2.2), (0.5, 1.8), (0.3, 2.9), (0, 2.4)], cls.HAIR),
                 poly([(10, 1.3), (8.6, 1.3), (9.0, 2.2), (9.5, 1.8), (9.7, 2.9), (10, 2.4)], cls.HAIR)]
        head = Box('head', (10, 10, 10), (-5, y0, -5), S,
                   {'front': spots + tufts + cls.features(expr),
                    'side': [poly([(0, 1.3), (10, 1.3), (10, 4.2), (8.8, 3.6), (7.6, 4.4), (6.2, 3.4),
                                   (4.8, 4.0), (3.4, 2.9), (1.8, 3.1), (0.6, 2.3), (0, 2.6)], cls.HAIR),
                             rect(4.2, 5.0, 1.3, 1.8, S, stroke=OUT, r=0.35), rect(6.4, 7.2, 1.0, 0.8, SD)],
                    'back': [poly([(0, 1.3), (10, 1.3), (10, 4.2), (8.6, 4.8), (7.2, 4.0), (5.6, 5.0),
                                   (4.2, 4.1), (2.8, 4.9), (1.2, 4.0), (0, 4.2)], cls.HAIR),
                             rect(6.5, 7.0, 0.9, 0.7, SD)]})
        cap = Box('cap', (10.4, 2.8, 10.4), (-5.2, 21.6, -5.2), cls.CAP,
                  {'front': [path('M4.1 2.8 Q5.2 1.1 6.3 2.8 Z', cls.HAIR, sw=3),
                             rect(3.7, 2.0, 3.0, 0.35, cls.RED, stroke=OUT, sw=2.5)],
                   'top': [line([(5.2, 0.4), (5.2, 10.0)], sw=2.5), line([(0.4, 5.2), (10.0, 5.2)], sw=2.5),
                           rect(4.75, 4.75, 0.9, 0.9, cls.RED, stroke=OUT, sw=2.5)]},
                  after=('head',))
        brim = Box('brim', (4.8, 0.5, 3.6), (-2.4, 21.6, -8.8), cls.RED)
        if head_only:
            return [brim, head, cap]

        def tank_front(ul, vl):
            teeth = [(0, 6.2)] + [(ul * i / 8, 6.2 + (0.6 if i % 2 else 0.0)) for i in range(9)] + [(ul, 6.2)]
            hem = poly([(0, 7.0)] + teeth[1:-1] + [(ul, 7.0)], S, sw=3)
            return [poly([(0, 0), (1.6, 0), (1.1, 1.7), (0, 1.9)], S, sw=3),
                    poly([(ul, 0), (ul - 1.6, 0), (ul - 1.1, 1.7), (ul, 1.9)], S, sw=3),
                    path(f'M{n(ul / 2 - 1.1)} 0 Q{n(ul / 2)} 1.5 {n(ul / 2 + 1.1)} 0 Z', S, sw=3),
                    ell(ul * 0.3, 3.6, 0.7, 0.45, cls.STAIN, stroke=None),
                    ell(ul * 0.72, 4.9, 0.5, 0.35, cls.STAIN, stroke=None), hem]

        def tank_back(ul, vl):
            teeth = [(ul * i / 8, 6.2 + (0.6 if i % 2 else 0.0)) for i in range(9)]
            return [poly([(0, 0), (1.6, 0), (1.1, 1.7), (0, 1.9)], S, sw=3),
                    poly([(ul, 0), (ul - 1.6, 0), (ul - 1.1, 1.7), (ul, 1.9)], S, sw=3),
                    poly([(0, 7.0)] + teeth + [(ul, 7.0)], S, sw=3)]

        def tank_side(ul, vl):
            teeth = [(ul * i / 4, 6.2 + (0.6 if i % 2 else 0.0)) for i in range(5)]
            return [poly([(0, 7.0)] + teeth + [(ul, 7.0)], S, sw=3)]
        body = Box('body', (7.0, 7.0, 3.6), (-3.5, 6.0, -1.8), cls.TANK,
                   {'front': tank_front, 'back': tank_back, 'side': tank_side})
        bandage = band(cls.BANDAGE, 3.4, 4.8)

        def bandage_lines(ul, vl):
            return [line([(0, 3.9), (ul, 4.25)], sw=2.5), line([(0, 4.4), (ul, 4.7)], sw=2.5)]
        rot = (-90, 0, 0) if pose == 'reach' else (0, 0, 0)
        arm_r = shoulder_arm('arm-right', (2.5, 6.8, 2.5), (-6.0, 6.2, -1.25), S,
                             {'around': merge(bandage, bandage_lines), 'front': [rect(0.6, 1.2, 0.8, 0.6, SD)]}, rot)
        arm_l = shoulder_arm('arm-left', (2.5, 6.8, 2.5), (3.5, 6.2, -1.25), S,
                             {'front': [rect(1.2, 4.6, 0.7, 0.6, SD)]}, rot)

        def jeans(ul, vl):
            return [rect(0, 4.9, ul, 1.1, cls.SNEAKER), line([(0, 4.9), (ul, 4.9)]),
                    rect(0, 5.35, ul, 0.25, cls.RED)]
        rip = [poly([(0.7, 2.3), (1.5, 2.05), (2.4, 2.35), (2.8, 2.15), (2.6, 2.9), (1.9, 3.15), (1.0, 2.95)],
                    S, sw=3),
               line([(1.2, 2.55), (2.3, 2.6)], sw=2, stroke='#ffffff')]
        legs_dec = {'around': jeans, 'front': rip, 'bottom': [rect(0, 0, 3.5, 3.6, cls.SNEAKER)]}
        leg_r = Box('leg-right', (3.5, 6.0, 3.6), (-3.5, 0, -1.8), cls.JEANS, legs_dec)
        leg_l = Box('leg-left', (3.5, 6.0, 3.6), (0, 0, -1.8), cls.JEANS,
                    {'around': jeans, 'bottom': [rect(0, 0, 3.5, 3.6, cls.SNEAKER)]})
        return [brim, leg_r, leg_l, body, arm_r, arm_l, head, cap]


ALL = (Hero, Friend, Dog, Zombie)
