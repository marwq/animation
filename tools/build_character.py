#!/usr/bin/env python3
"""Генератор разворота персонажа: вид спереди, сбоку и сзади.

Рисует персонажа в стиле «большая голова + руки и ноги палками»:
красная майка без рукавов, каштановые волосы с боковым пробором,
прядями у лица и хвостом, чёрно-серый рюкзак.

Запуск из корня репозитория:
    python3 tools/build_character.py
Результат: character/front.svg, side.svg, back.svg, turnaround.svg

Каждая часть тела лежит в своей группе <g id="..."> — удобно для анимации.
«left/right» в id — это левая/правая сторона самого персонажа, а не зрителя.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'character')

# ------------------------------------------------------------------ палитра
OUT = '#1c1a1a'       # контур
SKIN = '#f8ccb1'
SKIN_SH = '#e8ab8e'
FRECKLE = '#d4917a'
HAIR = '#8a4b2f'
HAIR_SH = '#6a3521'
TOP = '#c2423a'       # майка
TOP_SH = '#9c332e'
BAG = '#4b4f55'       # рюкзак
BAG_SH = '#3b3e43'    # карманы / тень рюкзака
BAG_DK = '#2a2c30'    # ремни, молнии, резинка для волос
BAG_LT = '#8e949b'    # пряжки, бегунки молний

SW = 8      # основной контур
LIMB = 11   # руки и ноги
DET = 5     # внутренние линии

W, H = 600, 1000   # холст одного вида; земля на y=952


# ------------------------------------------------------------------ helpers
def P(d, fill='none', sw=SW, stroke=OUT, extra=''):
    s = f'stroke="{stroke}" stroke-width="{sw}"' if stroke else 'stroke="none"'
    return (f'<path d="{d}" fill="{fill}" {s} stroke-linecap="round" '
            f'stroke-linejoin="round"{" " + extra if extra else ""}/>')


def shape(d, fill, sw=SW):
    return P(d, fill=fill, sw=sw)


def fill_only(d, fill, extra=''):
    return P(d, fill=fill, stroke=None, extra=extra)


def shade(cid, *items):
    """Тени, обрезанные по форме clipPath с id=cid."""
    return f'<g clip-path="url(#{cid})">' + ''.join(items) + '</g>'


def clip(cid, d):
    return f'<clipPath id="{cid}"><path d="{d}"/></clipPath>'


def grouper(pfx):
    def G(name, *items):
        return f'<g id="{pfx}-{name}">\n  ' + '\n  '.join(items) + '\n</g>'
    return G


def svg(w, h, body, defs='', title=''):
    t = f'<title>{title}</title>\n' if title else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'width="{w}" height="{h}">\n{t}<defs>\n{defs}\n</defs>\n{body}\n</svg>\n')


def rect_tie(cx, cy, w, h, angle=0):
    rot = f' rotate({angle})' if angle else ''
    return (f'<rect x="{-w / 2:g}" y="{-h / 2:g}" width="{w}" height="{h}" rx="{h / 2 - 1:g}" '
            f'fill="{BAG_DK}" stroke="{OUT}" stroke-width="6" '
            f'transform="translate({cx} {cy}){rot}"/>')


# Голова спереди и сзади — одна и та же форма (симметричная)
HEAD_FB = ('M300 150 C392 150 462 200 474 290 C486 360 500 420 494 468 '
           'C486 535 405 570 300 570 C195 570 114 535 106 468 '
           'C100 420 114 360 126 290 C138 200 208 150 300 150 Z')
# Уши в координатах холста: слева и справа от зрителя
EAR_VL = 'M124 392 C90 370 54 392 60 430 C66 462 92 474 118 464 Z'
EAR_VR = 'M476 392 C510 370 546 392 540 430 C534 462 508 474 482 464 Z'
# Ноги и руки в координатах холста (слева / справа от зрителя)
LEG_VL = 'M248 770 L248 950 L218 952'
LEG_VR = 'M352 770 L352 950 L382 952'
ARM_VL = 'M212 580 C186 624 164 700 168 802'
ARM_VR = 'M388 580 C414 624 436 700 432 802'
# Боковая тень на майке (правый край от зрителя)
TOP_EDGE_SH = 'M400 600 C396 680 398 740 404 800 L440 800 L440 600 Z'


# ================================================================== СПЕРЕДИ
def front(pfx='front'):
    defs, body = [], []
    G = grouper(pfx)
    FACE = HEAD_FB

    # хвост выглядывает из-за головы (на левой стороне персонажа)
    PONY = ('M468 440 C508 452 536 484 540 522 C543 552 534 580 516 604 '
            'C515 584 509 570 500 560 C501 578 495 594 484 606 '
            'C476 570 458 538 434 514 Z')
    body.append(G('ponytail', shape(PONY, HAIR),
                  P('M498 494 C510 514 516 540 512 568', sw=DET)))

    # волосы за головой (видны по бокам над ушами)
    HAIR_BACK = ('M300 100 C410 100 494 150 506 245 C512 300 508 350 494 392 '
                 'L106 392 C92 350 88 300 94 245 C106 150 190 100 300 100 Z')
    body.append(G('hair-back', shape(HAIR_BACK, HAIR)))

    # ноги и руки рисуем до майки — подол и проймы их перекрывают
    body.append(G('leg-right', P(LEG_VL, sw=LIMB)))
    body.append(G('leg-left', P(LEG_VR, sw=LIMB)))
    body.append(G('arm-right', P(ARM_VL, sw=LIMB)))
    body.append(G('arm-left', P(ARM_VR, sw=LIMB)))

    # шея в вырезе майки
    body.append(G('neck', fill_only('M236 540 L364 540 L364 620 L236 620 Z', SKIN_SH)))

    # майка без рукавов
    TOPD = ('M238 550 L216 552 C220 575 214 598 200 610 '
            'C197 670 194 730 192 790 C260 800 340 800 408 790 '
            'C406 730 403 670 400 610 C386 598 380 575 384 552 '
            'L362 550 C356 588 332 604 300 604 C268 604 244 588 238 550 Z')
    defs.append(clip(f'{pfx}-top-clip', TOPD))
    body.append(G('top',
                  fill_only(TOPD, TOP),
                  shade(f'{pfx}-top-clip',
                        fill_only(FACE, TOP_SH, extra='transform="translate(0 20)"'),
                        fill_only(TOP_EDGE_SH, TOP_SH)),
                  P(TOPD)))

    # лямки рюкзака, нагрудный ремешок, пряжки
    STRAP_R = ('M226 548 L262 548 C262 600 256 650 250 692 L222 692 '
               'C224 650 226 600 226 548 Z')
    STRAP_L = ('M374 548 L338 548 C338 600 344 650 350 692 L378 692 '
               'C376 650 374 600 374 548 Z')
    web_r = 'M236 700 C226 716 214 728 198 738'
    web_l = 'M364 700 C374 716 386 728 402 738'
    body.append(G('backpack-straps',
                  P(web_r, sw=13), P(web_r, sw=5, stroke=BAG_DK),
                  P(web_l, sw=13), P(web_l, sw=5, stroke=BAG_DK),
                  shape(STRAP_R, BAG, sw=6),
                  shape(STRAP_L, BAG, sw=6),
                  P('M234 560 L232 680', sw=3, stroke=BAG_SH),
                  P('M366 560 L368 680', sw=3, stroke=BAG_SH),
                  shape('M220 688 L252 688 L250 708 L222 708 Z', BAG_LT, sw=5),
                  shape('M380 688 L348 688 L350 708 L378 708 Z', BAG_LT, sw=5),
                  shape('M256 628 L344 628 L344 642 L256 642 Z', BAG_DK, sw=5),
                  shape('M287 623 L313 623 L313 647 L287 647 Z', BAG_LT, sw=5)))

    # уши
    body.append(G('ear-right', shape(EAR_VL, SKIN), P('M96 408 C80 414 78 434 90 446', sw=DET)))
    body.append(G('ear-left', shape(EAR_VR, SKIN), P('M504 408 C520 414 522 434 510 446', sw=DET)))

    # формы волос нужны заранее — от них падают тени на лицо
    CAP = ('M300 96 C410 96 494 150 506 245 C509 266 507 286 503 304 '
           'C484 286 458 270 430 262 '
           'C418 272 404 280 390 286 C384 270 374 258 356 250 '
           'C320 236 272 216 232 198 '
           'C212 214 192 230 176 244 '
           'C150 258 118 276 97 302 '
           'C92 283 91 264 94 245 C106 150 190 96 300 96 Z')
    LOCK_VR = ('M440 240 C476 262 500 296 504 340 C508 390 502 436 482 480 '
               'C478 444 470 410 460 372 C452 340 444 310 424 262 Z')
    LOCK_VL = ('M170 220 C140 250 108 300 100 350 C92 400 104 450 124 506 '
               'C130 460 140 410 152 372 C160 340 166 300 176 240 Z')

    # лицо
    defs.append(clip(f'{pfx}-face-clip', FACE))
    body.append(G('face',
                  fill_only(FACE, SKIN),
                  shade(f'{pfx}-face-clip',
                        fill_only(FACE, SKIN_SH),
                        fill_only(FACE, SKIN, extra='transform="translate(0 -16)"'),
                        fill_only(CAP, SKIN_SH, extra='transform="translate(4 13)"'),
                        fill_only(LOCK_VR, SKIN_SH, extra='transform="translate(-10 6)"'),
                        fill_only(LOCK_VL, SKIN_SH, extra='transform="translate(10 6)"')),
                  P(FACE)))

    feats = [
        f'<ellipse cx="232" cy="394" rx="10" ry="19" fill="{OUT}"/>',
        f'<ellipse cx="368" cy="394" rx="10" ry="19" fill="{OUT}"/>',
        P('M206 342 C220 332 238 330 254 336', sw=6),
        P('M346 336 C362 330 380 332 394 342', sw=6),
        P('M306 404 L292 440 L312 446', sw=6),
        P('M274 490 C290 494 312 494 328 488', sw=6),
    ]
    for (x, y) in ((196, 452), (210, 462), (224, 452), (376, 452), (390, 462), (404, 452)):
        feats.append(f'<circle cx="{x}" cy="{y}" r="3" fill="{FRECKLE}"/>')
    body.append(G('face-features', *feats))

    # пряди у лица (выходят из-под чёлки)
    defs.append(clip(f'{pfx}-lock-left-clip', LOCK_VR))
    defs.append(clip(f'{pfx}-lock-right-clip', LOCK_VL))
    body.append(G('hair-lock-left', fill_only(LOCK_VR, HAIR),
                  shade(f'{pfx}-lock-left-clip',
                        fill_only('M470 240 C500 300 506 400 480 500 L560 500 L560 240 Z', HAIR_SH)),
                  P(LOCK_VR)))
    body.append(G('hair-lock-right', fill_only(LOCK_VL, HAIR),
                  shade(f'{pfx}-lock-right-clip',
                        fill_only('M200 250 C170 300 150 380 140 500 L200 520 L240 250 Z', HAIR_SH)),
                  P(LOCK_VL)))

    # вихор и основная масса волос с пробором и чёлкой
    body.append(G('hair-tuft', shape('M348 104 C356 90 368 82 384 80 C378 90 378 98 382 108 Z', HAIR)))
    defs.append(clip(f'{pfx}-cap-clip', CAP))
    body.append(G('hair',
                  fill_only(CAP, HAIR),
                  shade(f'{pfx}-cap-clip',
                        fill_only('M380 80 C436 120 462 190 466 290 L600 360 L600 80 Z', HAIR_SH)),
                  P(CAP),
                  P('M232 198 C236 170 246 140 262 116', sw=DET),
                  P('M262 196 C310 160 380 146 440 162', sw=DET),
                  P('M214 214 C190 196 170 190 146 196', sw=DET)))

    return '\n'.join(defs), '\n'.join(body)


# ================================================================== СБОКУ
def side(pfx='side'):
    """Профиль: смотрит влево, видна правая сторона персонажа."""
    defs, body = [], []
    G = grouper(pfx)

    HEAD = ('M300 150 C205 150 135 205 122 290 C118 330 118 365 116 392 '
            'C110 405 98 425 94 436 C102 441 112 444 120 446 '
            'C116 470 114 492 118 510 C124 545 160 572 222 574 '
            'C300 576 380 566 430 540 C486 505 506 420 504 340 '
            'C500 220 410 150 300 150 Z')

    # хвост (за головой)
    PONY = ('M488 336 C530 350 556 392 560 440 C564 490 552 540 530 588 '
            'C528 562 522 546 512 536 C512 560 506 580 494 596 '
            'C494 540 486 490 470 440 Z')
    defs.append(clip(f'{pfx}-pony-clip', PONY))
    body.append(G('ponytail', fill_only(PONY, HAIR),
                  shade(f'{pfx}-pony-clip',
                        fill_only('M530 330 C560 400 560 500 530 600 L600 600 L600 330 Z', HAIR_SH)),
                  P(PONY),
                  P('M500 380 C522 420 530 470 526 520', sw=DET)))

    # ноги: дальняя (левая) и ближняя (правая)
    body.append(G('leg-left', P('M338 770 L338 950 L310 952', sw=LIMB)))
    body.append(G('leg-right', P('M282 770 L282 950 L252 952', sw=LIMB)))

    # рюкзак на спине
    BAG_SIDE = ('M372 590 C372 574 388 566 408 566 C434 566 452 580 456 604 '
                'L462 744 C463 762 452 772 434 772 L384 772 C374 772 368 764 368 752 Z')
    defs.append(clip(f'{pfx}-bag-clip', BAG_SIDE))
    body.append(G('backpack',
                  P('M392 570 C396 548 424 546 430 566', sw=8),          # ручка
                  fill_only(BAG_SIDE, BAG),
                  shade(f'{pfx}-bag-clip',
                        fill_only('M440 560 C452 620 456 700 452 780 L480 780 L480 560 Z', BAG_SH)),
                  P(BAG_SIDE),
                  shape('M384 686 C384 676 394 672 410 672 C428 672 446 676 448 690 '
                        'L450 744 C450 756 442 762 430 762 L396 762 C388 762 384 756 384 748 Z',
                        BAG_SH, sw=6),                                   # боковой карман
                  P('M392 700 L442 700', sw=4, stroke=BAG_DK),
                  P('M384 600 C392 586 414 580 440 588', sw=4, stroke=BAG_DK)))  # молния

    # майка
    TOPD = ('M262 552 L378 552 C384 600 388 700 392 790 '
            'C340 798 290 798 246 790 C252 720 256 640 262 552 Z')
    defs.append(clip(f'{pfx}-top-clip', TOPD))
    body.append(G('top', fill_only(TOPD, TOP),
                  shade(f'{pfx}-top-clip',
                        fill_only(HEAD, TOP_SH, extra='transform="translate(0 20)"')),
                  P(TOPD)))

    # лямка: по груди вниз до пряжки, дальше ремешок назад к низу рюкзака
    web = 'M282 706 C310 726 344 744 372 752'
    body.append(G('backpack-strap',
                  P(web, sw=13), P(web, sw=5, stroke=BAG_DK),
                  shape('M262 560 L298 560 C300 610 298 650 294 694 L266 694 '
                        'C264 650 262 610 262 560 Z', BAG, sw=6),
                  P('M280 570 L280 680', sw=3, stroke=BAG_SH),
                  shape('M264 690 L296 690 L294 710 L266 710 Z', BAG_LT, sw=5)))

    # ближняя (правая) рука
    body.append(G('arm-right', P('M322 588 C320 650 312 730 300 806', sw=LIMB)))

    CAP = ('M300 96 C412 96 504 160 518 262 C524 312 520 352 508 390 '
           'C500 440 484 480 452 512 C430 500 410 480 396 452 '
           'C380 410 352 372 320 340 C296 318 270 296 246 280 '
           'C226 268 206 260 188 258 C180 262 172 268 166 276 '
           'C160 262 152 252 140 246 C132 244 124 246 116 252 '
           'C108 232 108 206 116 184 C136 128 206 96 300 96 Z')
    LOCK = ('M232 250 C262 270 284 320 292 380 C298 430 292 480 272 528 '
            'C266 480 262 430 252 390 C244 350 230 310 206 276 Z')

    # голова
    defs.append(clip(f'{pfx}-head-clip', HEAD))
    body.append(G('head',
                  fill_only(HEAD, SKIN),
                  shade(f'{pfx}-head-clip',
                        fill_only(HEAD, SKIN_SH),
                        fill_only(HEAD, SKIN, extra='transform="translate(0 -16)"'),
                        fill_only(CAP, SKIN_SH, extra='transform="translate(-6 12)"'),
                        fill_only(LOCK, SKIN_SH, extra='transform="translate(-10 4)"')),
                  P(HEAD)))

    feats = [
        f'<ellipse cx="170" cy="394" rx="9" ry="19" fill="{OUT}"/>',
        P('M144 340 C158 331 176 330 192 336', sw=6),
        P('M118 490 C128 493 138 493 148 489', sw=6),
    ]
    for (x, y) in ((196, 452), (210, 462), (224, 452)):
        feats.append(f'<circle cx="{x}" cy="{y}" r="3" fill="{FRECKLE}"/>')
    body.append(G('face-features', *feats))

    body.append(G('ear-right',
                  shape('M330 396 C356 370 394 388 392 428 C390 464 360 478 334 464 '
                        'C318 446 318 412 330 396 Z', SKIN),
                  P('M352 408 C370 414 374 438 358 450', sw=DET)))

    # прядь перед ухом, вихор, волосы, резинка
    defs.append(clip(f'{pfx}-lock-clip', LOCK))
    body.append(G('hair-lock-right', fill_only(LOCK, HAIR),
                  shade(f'{pfx}-lock-clip',
                        fill_only('M270 260 C296 330 300 430 280 540 L340 540 L340 260 Z', HAIR_SH)),
                  P(LOCK)))
    body.append(G('hair-tuft', shape('M332 100 C340 86 352 78 368 76 C362 86 362 94 366 104 Z', HAIR)))
    defs.append(clip(f'{pfx}-cap-clip', CAP))
    body.append(G('hair', fill_only(CAP, HAIR),
                  shade(f'{pfx}-cap-clip',
                        fill_only('M400 80 C470 150 480 300 440 520 L600 520 L600 80 Z', HAIR_SH)),
                  P(CAP),
                  P('M168 170 C262 136 404 196 484 326', sw=DET),
                  P('M246 280 C314 256 410 292 486 360', sw=DET)))
    body.append(G('hair-tie', rect_tie(512, 360, 44, 18, -30)))

    return '\n'.join(defs), '\n'.join(body)


# ================================================================== СЗАДИ
def back(pfx='back'):
    defs, body = [], []
    G = grouper(pfx)
    HEAD = HEAD_FB

    # сзади левая сторона персонажа — слева от зрителя
    body.append(G('leg-left', P(LEG_VL, sw=LIMB)))
    body.append(G('leg-right', P(LEG_VR, sw=LIMB)))
    body.append(G('arm-left', P(ARM_VL, sw=LIMB)))
    body.append(G('arm-right', P(ARM_VR, sw=LIMB)))

    # майка (спина)
    TOPD = ('M216 552 L384 552 C380 575 386 598 400 610 '
            'C403 670 406 730 408 790 C340 800 260 800 192 790 '
            'C194 730 197 670 200 610 C214 598 220 575 216 552 Z')
    defs.append(clip(f'{pfx}-top-clip', TOPD))
    body.append(G('top', fill_only(TOPD, TOP),
                  shade(f'{pfx}-top-clip',
                        fill_only(HEAD, TOP_SH, extra='transform="translate(0 20)"'),
                        fill_only(TOP_EDGE_SH, TOP_SH)),
                  P(TOPD)))

    # рюкзак
    web_l = 'M236 748 C224 736 212 722 198 712'
    web_r = 'M364 748 C376 736 388 722 402 712'
    BAG_BACK = ('M222 612 C222 578 256 560 300 560 C344 560 378 578 378 612 '
                'L382 748 C382 766 370 776 352 776 L248 776 C230 776 218 766 218 748 Z')
    POCKET = ('M240 684 C240 674 248 668 260 668 L340 668 C352 668 360 674 360 684 '
              'L362 748 C362 758 354 764 344 764 L256 764 C246 764 238 758 238 748 Z')
    defs.append(clip(f'{pfx}-bag-clip', BAG_BACK))
    body.append(G('backpack',
                  P(web_l, sw=13), P(web_l, sw=5, stroke=BAG_DK),
                  P(web_r, sw=13), P(web_r, sw=5, stroke=BAG_DK),
                  fill_only(BAG_BACK, BAG),
                  shade(f'{pfx}-bag-clip',
                        fill_only('M356 550 C372 620 376 700 372 790 L400 790 L400 550 Z', BAG_SH)),
                  P(BAG_BACK),
                  P('M236 616 C250 594 276 584 300 584 C324 584 350 594 364 616',
                    sw=4, stroke=BAG_DK),                                # молния
                  shape('M244 604 L256 604 L256 628 L244 628 Z', BAG_LT, sw=4),
                  shape(POCKET, BAG_SH, sw=6),                           # передний карман
                  P('M252 686 L348 686', sw=4, stroke=BAG_DK),
                  shape('M330 680 L342 680 L342 704 L330 704 Z', BAG_LT, sw=4)))

    # уши торчат из-за головы
    body.append(G('ear-left', shape(EAR_VL, SKIN),
                  P('M100 404 C84 412 82 436 96 448', sw=DET, stroke=SKIN_SH)))
    body.append(G('ear-right', shape(EAR_VR, SKIN),
                  P('M500 404 C516 412 518 436 504 448', sw=DET, stroke=SKIN_SH)))

    # затылок: волосы до линии роста с короткими «пёрышками»
    HAIR_B = ('M300 96 C410 96 494 150 506 245 C512 300 508 350 496 392 '
              'C488 430 470 460 440 480 C420 490 398 498 378 502 '
              'L366 516 L350 506 C334 510 316 513 300 514 '
              'C272 513 248 510 226 504 L212 516 L204 498 '
              'C188 492 174 486 160 480 C130 460 112 430 104 392 '
              'C92 350 88 300 94 245 C106 150 190 96 300 96 Z')
    defs.append(clip(f'{pfx}-head-clip', HEAD))
    body.append(G('head', fill_only(HEAD, SKIN),
                  shade(f'{pfx}-head-clip',
                        fill_only(HEAD, SKIN_SH),
                        fill_only(HEAD, SKIN, extra='transform="translate(0 -16)"'),
                        fill_only(HAIR_B, SKIN_SH, extra='transform="translate(0 14)"')),
                  P(HEAD)))

    body.append(G('hair-tuft', shape('M252 102 C244 88 232 80 216 78 C222 88 222 96 218 106 Z', HAIR)))
    defs.append(clip(f'{pfx}-hair-clip', HAIR_B))
    body.append(G('hair', fill_only(HAIR_B, HAIR),
                  shade(f'{pfx}-hair-clip',
                        fill_only('M400 80 C456 150 470 260 452 520 L600 520 L600 80 Z', HAIR_SH)),
                  P(HAIR_B),
                  P('M232 112 C206 190 236 290 282 342', sw=DET),
                  P('M392 120 C410 200 368 290 320 344', sw=DET),
                  P('M104 318 C160 304 232 326 274 356', sw=DET),
                  P('M474 420 C440 424 374 402 326 372', sw=DET)))

    # хвост и резинка
    PONY = ('M276 360 C250 390 236 440 238 490 C240 530 252 566 270 596 '
            'C272 574 278 560 288 552 C290 572 298 588 310 600 '
            'C318 560 324 520 324 480 C324 430 318 390 324 360 Z')
    defs.append(clip(f'{pfx}-pony-clip', PONY))
    body.append(G('ponytail', fill_only(PONY, HAIR),
                  shade(f'{pfx}-pony-clip',
                        fill_only('M304 350 C316 420 318 500 304 610 L340 610 L340 350 Z', HAIR_SH)),
                  P(PONY),
                  P('M286 390 C270 430 266 480 276 530', sw=DET)))
    body.append(G('hair-tie', rect_tie(300, 360, 60, 22)))

    return '\n'.join(defs), '\n'.join(body)


# ================================================================== ЛИСТ
VIEWS = (('front', front, 'СПЕРЕДИ'), ('side', side, 'СБОКУ'), ('back', back, 'СЗАДИ'))
FONT = "'DejaVu Sans', 'Segoe UI', Arial, sans-serif"
PALETTE = (('Кожа', SKIN), ('Тень кожи', SKIN_SH), ('Волосы', HAIR), ('Тень волос', HAIR_SH),
           ('Майка', TOP), ('Тень майки', TOP_SH), ('Рюкзак', BAG), ('Карман', BAG_SH),
           ('Ремни', BAG_DK), ('Пряжки', BAG_LT), ('Контур', OUT))


def sheet():
    SW_, SH_ = 1800, 1230
    top = 30
    parts = [f'<rect width="{SW_}" height="{SH_}" fill="#fbf8f4"/>']
    # направляющие: макушка, глаза, подбородок, подол, земля
    for y in (96, 394, 570, 790, 952):
        parts.append(f'<line x1="30" y1="{y + top}" x2="{SW_ - 30}" y2="{y + top}" '
                     f'stroke="#d9d2c8" stroke-width="2" stroke-dasharray="10 10"/>')
    defs_all = []
    for i, (name, fn, label) in enumerate(VIEWS):
        defs, body = fn()
        defs_all.append(defs)
        x = i * W
        parts.append(f'<ellipse cx="{x + 300}" cy="{952 + top}" rx="120" ry="14" '
                     f'fill="#000" opacity="0.08"/>')
        parts.append(f'<g id="view-{name}" transform="translate({x} {top})">\n{body}\n</g>')
        parts.append(f'<text x="{x + 300}" y="{top + 1030}" text-anchor="middle" '
                     f'font-family="{FONT}" font-size="34" font-weight="700" '
                     f'letter-spacing="4" fill="#5b524a">{label}</text>')
    # палитра
    parts.append(f'<line x1="30" y1="{SH_ - 150}" x2="{SW_ - 30}" y2="{SH_ - 150}" '
                 f'stroke="#e6dfd5" stroke-width="2"/>')
    step = (SW_ - 120) / len(PALETTE)
    for i, (label, color) in enumerate(PALETTE):
        cx = 60 + step * i + step / 2
        parts.append(f'<rect x="{cx - 34:.0f}" y="{SH_ - 120}" width="68" height="44" rx="10" '
                     f'fill="{color}" stroke="{OUT}" stroke-width="3"/>')
        parts.append(f'<text x="{cx:.0f}" y="{SH_ - 50}" text-anchor="middle" font-family="{FONT}" '
                     f'font-size="17" font-weight="700" fill="#5b524a">{label}</text>')
        parts.append(f'<text x="{cx:.0f}" y="{SH_ - 26}" text-anchor="middle" font-family="{FONT}" '
                     f'font-size="15" fill="#8a8178">{color}</text>')
    return svg(SW_, SH_, '\n'.join(parts), '\n'.join(defs_all),
               title='Персонаж — разворот: спереди, сбоку, сзади')


TITLES = {'front': 'Персонаж — вид спереди',
          'side': 'Персонаж — вид сбоку',
          'back': 'Персонаж — вид сзади'}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, fn, _ in VIEWS:
        defs, body = fn()
        with open(os.path.join(OUT_DIR, f'{name}.svg'), 'w', encoding='utf-8') as f:
            f.write(svg(W, H, body, defs, title=TITLES[name]))
    with open(os.path.join(OUT_DIR, 'turnaround.svg'), 'w', encoding='utf-8') as f:
        f.write(sheet())
    print(f'SVG записаны в {os.path.relpath(OUT_DIR, ROOT)}/')


if __name__ == '__main__':
    main()
