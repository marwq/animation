"""Базовый персонаж в стиле чиби-стикеров по Minecraft.

Пропорции чиби: голова 10×10×10 — больше 40 % роста и в 1,4 раза шире тела; тело
7,2×7,6×4,6; руки 2,9×6,8×3,0; ноги 3,6×5,8×3,9. Рост 23,2 единицы. Углы блоков скруглены.
Лицо маленькое и сидит низко: глаза — скруглённые прямоугольники с фиолетовым зрачком и
бликом, под ними тёмная «борода» вокруг рта, как в скине Стива.

Девушку, зомби и других героев рисуем из этой же модели: меняем цвета и дорисовываем
волосы и детали.
"""
import random

from blocky import OUT, SHADE, Box, path, rect

NAME = 'steve'
TITLE = 'Стив — базовый персонаж'

SKIN = '#f0c39c'
BEARD = '#a8714d'
HAIR = '#6b4226'
HAIR_LIGHT = '#a0704a'
SHIRT = '#38c0d6'
PANTS = '#4b48b0'
SHOES = '#8a8a93'
EYE = '#ffffff'
PUPIL = '#4b3c9e'
PALETTE = (('Кожа', SKIN), ('Борода, рот', BEARD), ('Волосы', HAIR), ('Светлые пиксели', HAIR_LIGHT),
           ('Футболка', SHIRT), ('Штаны', PANTS), ('Обувь', SHOES), ('Зрачки', PUPIL),
           ('Контур', OUT))

HEAD = 10.0
LEG_H, BODY_H = 5.8, 7.6
HEAD_Y = LEG_H + BODY_H - 0.2           # голова чуть заходит на плечи — без щели
HEIGHT = HEAD_Y + HEAD


# ------------------------------------------------------------------ текстура
def pixels(ul, vl, seed, colors, count, size=1.0, opacity=0.35):
    """Редкие «пиксели» чуть другого тона — намёк на скин Minecraft."""
    rnd = random.Random(seed)
    out = []
    for _ in range(count):
        x = rnd.randrange(0, max(1, int(ul / size))) * size
        y = rnd.randrange(0, max(1, int(vl / size))) * size
        out.append(rect(x, y, size, size, rnd.choice(colors), extra=f'opacity="{opacity}"'))
    return out


def cast_shadow(depth):
    """Падающая тень сверху грани (от головы на теле, от тела на ногах)."""
    def dec(ul, vl):
        return [rect(0, 0, ul, depth, SHADE[0], extra='style="mix-blend-mode:multiply"')]
    return dec


# ------------------------------------------------------------------ голова 10×10
FRONT_HAIR = ('M0 0 H10 V4.4 Q9.6 4.65 9.3 4.2 L9.2 3.4 Q8.6 3.05 7.6 3.3 L6.6 3.2 '
              'Q5.6 3.0 4.6 3.3 Q3.4 3.6 2.3 3.2 Q1.4 2.95 1.15 3.6 L1.05 4.9 Q0.55 5.25 0 4.9 Z')
SIDE_HAIR = ('M0 0 H10 V7.0 Q9.3 7.35 8.8 6.8 Q8.3 6.1 7.6 6.3 Q6.8 6.5 6.6 5.6 '
             'Q6.4 4.4 5.4 4.0 Q4.2 3.4 2.6 3.3 Q1.5 3.2 1.05 3.7 L0.95 4.9 Q0.5 5.2 0 4.9 Z')
BACK_HAIR = ('M0 0 H10 V7.0 Q9.1 7.6 8.2 7.1 Q7.2 6.6 6.2 7.2 Q5.2 7.75 4.2 7.15 '
             'Q3.2 6.6 2.2 7.2 Q1.0 7.8 0 7.0 Z')


def hair_texture(ul, vl, seed, top=3.0):
    return pixels(ul, top, seed, (HAIR_LIGHT, '#4d2e18'), 7)


def face():
    out = [path(FRONT_HAIR, HAIR)]
    out += hair_texture(10, 10, 1)
    # «борода» и рот
    out.append(rect(3.35, 7.25, 3.3, 1.35, BEARD, r=0.35, extra='opacity="0.55"'))
    out.append(path('M4.25 7.75 Q5.0 8.15 5.75 7.75', stroke='#5c3520', sw=3.4))
    # глаза: белок, зрачок у переносицы, блик
    for x0, px in ((2.35, 3.0), (6.3, 6.3)):
        out.append(rect(x0, 5.1, 1.35, 1.65, EYE, stroke=OUT, sw=3.2, r=0.28))
        out.append(rect(px, 5.22, 0.7, 1.41, PUPIL, r=0.2))
        out.append(rect(px + 0.36, 5.38, 0.24, 0.3, EYE, r=0.06))
        out.append(rect(x0, 5.1, 1.35, 1.65, 'none', stroke=OUT, sw=3.2, r=0.28))
    return out


def side_hair():
    return [path(SIDE_HAIR, HAIR)] + hair_texture(10, 10, 2)


def back_hair():
    return [path(BACK_HAIR, HAIR)] + pixels(10, 6.5, 3, (HAIR_LIGHT, '#4d2e18'), 10)


# ------------------------------------------------------------------ тело
def shirt_front(ul, vl):
    return pixels(ul, vl, 4, ('#7fe0ee', '#2a9fb8'), 6) + \
           [path('M2.55 0 H4.65 L4.35 0.75 L3.6 1.35 L2.85 0.75 Z', SKIN)]


def sleeve(ul, vl):
    return [rect(0, 0, ul, 2.7, SHIRT)] + pixels(ul, 2.7, 5, ('#7fe0ee', '#2a9fb8'), 2)


def leg_dec(ul, vl):
    return pixels(ul, 4.6, 6, ('#6a67cc', '#36338a'), 3) + [rect(0, 4.7, ul, vl - 4.7, SHOES)]


def boxes(pose='stand'):
    head = Box('head', (HEAD, HEAD, HEAD), (-5, HEAD_Y, -5), {'default': SKIN, 'top': HAIR},
               {'front': face(), 'side': side_hair(), 'back': back_hair(),
                'top': pixels(10, 10, 7, (HAIR_LIGHT, '#4d2e18'), 12)},
               round=2.0)
    neck_shadow = cast_shadow(1.4)
    body = Box('body', (7.2, BODY_H, 4.6), (-3.6, LEG_H, -2.3), SHIRT,
               {'front': lambda ul, vl: shirt_front(ul, vl) + neck_shadow(ul, vl),
                'back': lambda ul, vl: pixels(ul, vl, 8, ('#7fe0ee', '#2a9fb8'), 6) + neck_shadow(ul, vl),
                'side': neck_shadow},
               round=0.7)
    arm_dec = {'around': sleeve}
    arm_r = Box('arm-right', (2.9, 6.8, 3.0), (-6.5, LEG_H + BODY_H - 6.8, -1.5),
                {'default': SKIN, 'top': SHIRT}, arm_dec,
                pivot=(-5.05, LEG_H + BODY_H - 0.4, 0), rot=(0, 0, -7), round=0.7)
    arm_l = Box('arm-left', (2.9, 6.8, 3.0), (3.6, LEG_H + BODY_H - 6.8, -1.5),
                {'default': SKIN, 'top': SHIRT}, arm_dec,
                pivot=(5.05, LEG_H + BODY_H - 0.4, 0), rot=(0, 0, 7), round=0.7)
    legs = {'around': lambda ul, vl: leg_dec(ul, vl) + cast_shadow(0.9)(ul, vl)}
    leg_r = Box('leg-right', (3.6, LEG_H, 3.9), (-3.6, 0, -1.95), {'default': PANTS, 'bottom': SHOES},
                legs, pivot=(-1.8, LEG_H - 0.2, 0), round=0.5)
    leg_l = Box('leg-left', (3.6, LEG_H, 3.9), (0, 0, -1.95), {'default': PANTS, 'bottom': SHOES},
                legs, pivot=(1.8, LEG_H - 0.2, 0), round=0.5)
    return [leg_r, leg_l, body, arm_r, arm_l, head]
