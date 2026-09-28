"""Джоэл: короткие тёмные волосы, борода, рубашка хаки без рукавов с карманами,
коричневый рюкзак с клапаном. Холст вида 600×1100, земля y=1052 — он выше Элли.

Группы <g id="вид-часть">; «left/right» — сторона самого персонажа, а не зрителя.
"""
from charlib import DET, LIMB, OUT, P, clip, fill_only, grouper, shade, shape

NAME = 'joel'
TITLE = 'Джоэл'
W, H = 600, 1100
GROUND = 1052
GUIDES = (58, 376, 610, 884, 1052)   # макушка, глаза, борода, подол, земля

# ------------------------------------------------------------------ палитра
SKIN = '#f0c09c'
SKIN_SH = '#d99f7e'
HAIR = '#4b3c31'
HAIR_SH = '#34291f'
BEARD = '#65574b'
BEARD_SH = '#51453a'
SHIRT = '#7a7955'     # хаки
SHIRT_SH = '#5f5e41'
BAG = '#8a6039'       # рюкзак
BAG_SH = '#6c4a2b'    # клапан, карманы
STRAP = '#553a24'     # лямки и ремешки
METAL = '#b9b4a8'     # кольца и пряжки

PALETTE = (('Кожа', SKIN), ('Тень кожи', SKIN_SH), ('Волосы', HAIR), ('Борода', BEARD),
           ('Рубашка', SHIRT), ('Тень рубашки', SHIRT_SH), ('Рюкзак', BAG), ('Клапан', BAG_SH),
           ('Лямки', STRAP), ('Пряжки', METAL), ('Контур', OUT))

# Голова спереди и сзади — одна форма (симметричная, шире в челюсти)
HEAD_FB = ('M300 118 C404 118 480 172 492 270 C502 344 514 410 510 470 '
           'C506 548 422 592 300 592 C178 592 94 548 90 470 '
           'C86 410 98 344 108 270 C120 172 196 118 300 118 Z')
EAR_VL = 'M112 366 C76 344 38 366 44 406 C50 440 78 452 106 442 Z'
EAR_VR = 'M488 366 C524 344 562 366 556 406 C550 440 522 452 494 442 Z'
LEG_VL = 'M246 870 L246 1050 L212 1052'
LEG_VR = 'M354 870 L354 1050 L388 1052'
ARM_VL = 'M194 604 C162 654 142 764 148 896'
ARM_VR = 'M406 604 C438 654 458 764 452 896'
SHIRT_EDGE_SH = 'M416 640 C412 740 414 820 420 900 L460 900 L460 640 Z'
# короткие волосы: силуэт от левого виска через макушку к правому (вид спереди)
CAP_OUTER = ('M102 330 C94 290 94 240 104 196 C114 150 144 116 186 96 '
             'C220 80 260 74 300 74 L316 58 L328 74 C374 76 416 88 448 112 L466 104 L466 126 '
             'C490 150 502 190 504 240 C506 280 504 310 498 330')
# короткая борода по линии челюсти с усами (вид спереди)
BEARD_FRONT = ('M100 300 L124 300 C124 360 126 420 132 452 C142 490 170 516 214 526 '
               'C222 526 230 524 236 520 C244 500 264 488 286 486 C294 486 298 488 300 490 '
               'C302 488 306 486 314 486 C336 488 356 500 364 520 C370 524 378 526 386 526 '
               'C430 516 458 490 468 452 C474 420 476 360 476 300 L500 300 '
               'C506 360 514 420 512 470 C510 550 424 600 300 604 '
               'C176 600 90 550 88 470 C86 420 92 360 100 300 Z')


def mirror(d, width=W):
    """Отражает путь из команд M/L/C/Z по горизонтали (x -> width - x)."""
    out, nums = [], []
    for tok in d.replace(',', ' ').split():
        if tok[0].isalpha():
            out.append(tok[0])
            tok = tok[1:]
            if not tok:
                continue
        nums.append(float(tok))
        if len(nums) == 2:
            out.append(f'{width - nums[0]:g} {nums[1]:g}')
            nums = []
    return ' '.join(out).replace('M ', 'M').replace('L ', 'L').replace('C ', 'C')


def ring(x, y, w=26, h=18):
    """Металлическое D-кольцо на лямке: чёрный контур + светлый металл."""
    d = f'M{x - w / 2:g} {y:g} L{x + w / 2:g} {y:g} C{x + w / 2:g} {y + h:g} {x - w / 2:g} {y + h:g} {x - w / 2:g} {y:g} Z'
    return P(d, sw=11) + P(d, sw=5, stroke=METAL)


def buckle(x, y, w=34, h=20):
    return shape(f'M{x - w / 2:g} {y:g} L{x + w / 2:g} {y:g} L{x + w / 2 - 2:g} {y + h:g} '
                 f'L{x - w / 2 + 2:g} {y + h:g} Z', METAL, sw=5)


# ================================================================== СПЕРЕДИ
def front(pfx='front'):
    defs, body = [], []
    G = grouper(pfx)
    FACE = HEAD_FB

    # короткие волосы за головой (чуть видны над ушами)
    HAIR_BACK = ('M300 80 C410 80 500 146 506 250 C510 300 506 344 496 376 '
                 'L104 376 C94 344 90 300 94 250 C100 146 190 80 300 80 Z')
    body.append(G('hair-back', shape(HAIR_BACK, HAIR)))

    body.append(G('leg-right', P(LEG_VL, sw=LIMB)))
    body.append(G('leg-left', P(LEG_VR, sw=LIMB)))
    body.append(G('arm-right', P(ARM_VL, sw=LIMB)))
    body.append(G('arm-left', P(ARM_VR, sw=LIMB)))

    # шея в расстёгнутом вороте
    body.append(G('neck', fill_only('M244 560 L356 560 L356 690 L244 690 Z', SKIN_SH)))

    # рубашка без рукавов с V-вырезом
    SHIRTD = ('M214 572 C222 598 212 626 188 640 '
              'C184 720 178 800 174 872 C220 884 262 890 300 890 C338 890 380 884 426 872 '
              'C422 800 416 720 412 640 C388 626 378 598 386 572 '
              'L346 572 L300 668 L254 572 Z')
    defs.append(clip(f'{pfx}-shirt-clip', SHIRTD))
    body.append(G('shirt',
                  fill_only(SHIRTD, SHIRT),
                  shade(f'{pfx}-shirt-clip',
                        fill_only(FACE, SHIRT_SH, extra='transform="translate(0 30)"'),
                        fill_only(SHIRT_EDGE_SH, SHIRT_SH)),
                  P(SHIRTD),
                  # планка
                  P('M300 668 L300 888', sw=DET),
                  # нагрудные карманы с клапанами
                  shape('M232 694 L286 694 L286 764 C286 770 282 774 276 774 L242 774 '
                        'C236 774 232 770 232 764 Z', SHIRT, sw=DET),
                  shape('M228 690 L290 690 L290 710 L259 722 L228 710 Z', SHIRT, sw=DET),
                  f'<circle cx="259" cy="712" r="4" fill="{SHIRT_SH}" stroke="{OUT}" stroke-width="3"/>',
                  shape('M314 694 L368 694 L368 764 C368 770 364 774 358 774 L324 774 '
                        'C318 774 314 770 314 764 Z', SHIRT, sw=DET),
                  shape('M310 690 L372 690 L372 710 L341 722 L310 710 Z', SHIRT, sw=DET),
                  f'<circle cx="341" cy="712" r="4" fill="{SHIRT_SH}" stroke="{OUT}" stroke-width="3"/>',
                  # пуговицы
                  *[f'<circle cx="300" cy="{y}" r="6" fill="{SHIRT_SH}" stroke="{OUT}" stroke-width="3"/>'
                    for y in (700, 770, 840)],
                  # воротник
                  shape('M254 572 L230 590 L246 652 L284 634 Z', SHIRT, sw=DET),
                  shape('M346 572 L370 590 L354 652 L316 634 Z', SHIRT, sw=DET)))

    # лямки рюкзака с D-кольцами
    STRAP_R = ('M190 568 L228 568 C228 640 224 720 222 800 L188 800 '
               'C188 720 190 640 190 568 Z')
    STRAP_L = ('M410 568 L372 568 C372 640 376 720 378 800 L412 800 '
               'C412 720 410 640 410 568 Z')
    web_r = 'M206 812 C200 832 192 846 180 856'
    web_l = 'M394 812 C400 832 408 846 420 856'
    body.append(G('backpack-straps',
                  P(web_r, sw=15), P(web_r, sw=7, stroke=STRAP),
                  P(web_l, sw=15), P(web_l, sw=7, stroke=STRAP),
                  shape(STRAP_R, STRAP, sw=6), shape(STRAP_L, STRAP, sw=6),
                  P('M199 584 L198 784', sw=3, stroke=BAG),
                  P('M401 584 L402 784', sw=3, stroke=BAG),
                  ring(209, 700), ring(391, 700),
                  buckle(205, 796), buckle(395, 796)))

    body.append(G('ear-right', shape(EAR_VL, SKIN), P('M84 382 C66 388 64 410 78 422', sw=DET)))
    body.append(G('ear-left', shape(EAR_VR, SKIN), P('M516 382 C534 388 536 410 522 422', sw=DET)))

    # волосы: виски, линия роста и пара прядей на лоб
    CAP = (CAP_OUTER + ' C492 330 486 330 480 330 '
           'C476 300 470 262 446 222 C420 210 380 204 330 206 '
           'C310 222 290 236 262 256 C262 244 256 232 244 222 '
           'C234 228 224 234 212 240 C212 232 206 224 196 218 '
           'C170 218 150 228 140 248 C130 270 126 300 124 330 Z')

    # лицо: тень от волос на лбу
    defs.append(clip(f'{pfx}-face-clip', FACE))
    body.append(G('face',
                  fill_only(FACE, SKIN),
                  shade(f'{pfx}-face-clip',
                        fill_only(CAP, SKIN_SH, extra='transform="translate(4 12)"')),
                  P(FACE)))

    feats = [
        f'<ellipse cx="232" cy="376" rx="10" ry="18" fill="{OUT}"/>',
        f'<ellipse cx="368" cy="376" rx="10" ry="18" fill="{OUT}"/>',
        P('M198 322 C216 312 242 312 262 320', sw=9),
        P('M402 322 C384 312 358 312 338 320', sw=9),
        P('M308 388 L288 440 L314 448', sw=6),
        P('M216 406 C226 412 240 412 250 406', sw=3, stroke=SKIN_SH),
        P('M350 406 C360 412 374 412 384 406', sw=3, stroke=SKIN_SH),
    ]
    body.append(G('face-features', *feats))

    # короткая борода, рот, усы
    defs.append(clip(f'{pfx}-beard-clip', BEARD_FRONT))
    body.append(G('beard',
                  fill_only(BEARD_FRONT, BEARD),
                  shade(f'{pfx}-beard-clip',
                        fill_only('M440 320 C476 400 486 500 430 620 L560 620 L560 320 Z', BEARD_SH)),
                  P(BEARD_FRONT),
                  shape('M280 524 C292 520 308 520 320 524 C314 531 307 534 300 534 '
                        'C293 534 286 531 280 524 Z', SKIN_SH, sw=DET),
                  shape('M232 522 C244 500 266 488 300 492 C334 488 356 500 368 522 '
                        'C346 528 322 524 300 518 C278 524 254 528 232 522 Z', BEARD, sw=DET)))

    # волосы поверх лба
    defs.append(clip(f'{pfx}-hair-clip', CAP))
    body.append(G('hair',
                  fill_only(CAP, HAIR),
                  shade(f'{pfx}-hair-clip',
                        fill_only('M390 40 C450 100 470 180 472 300 L600 360 L600 40 Z', HAIR_SH)),
                  P(CAP),
                  P('M330 206 C340 168 360 136 392 110', sw=DET),
                  P('M244 222 C242 180 256 140 284 110', sw=DET),
                  P('M196 218 C192 190 196 160 214 136', sw=DET)))

    return '\n'.join(defs), '\n'.join(body)


# ================================================================== СБОКУ
def side(pfx='side'):
    """Профиль: смотрит влево, видна правая сторона персонажа."""
    defs, body = [], []
    G = grouper(pfx)

    HEAD = ('M300 118 C196 118 120 178 106 272 C100 316 102 350 100 376 '
            'C94 392 82 414 76 430 C86 436 98 438 106 440 '
            'C102 466 100 490 104 508 C110 556 148 594 224 598 '
            'C304 602 392 590 444 558 C502 522 520 430 518 340 '
            'C514 208 420 118 300 118 Z')

    body.append(G('leg-left', P('M344 870 L344 1050 L312 1052', sw=LIMB)))
    body.append(G('leg-right', P('M286 870 L286 1050 L252 1052', sw=LIMB)))

    # рюкзак
    BAG_D = ('M386 628 C386 606 404 596 428 596 C456 596 476 612 482 640 '
             'L490 830 C491 850 478 862 458 862 L402 862 C390 862 382 852 382 840 Z')
    FLAP = ('M380 634 C380 604 402 588 430 588 C462 588 486 606 492 640 '
            'L496 704 C470 712 438 712 410 706 C396 704 386 700 380 694 Z')
    defs.append(clip(f'{pfx}-bag-clip', BAG_D))
    body.append(G('backpack',
                  P('M404 598 C406 572 440 570 446 594', sw=9),          # ручка
                  fill_only(BAG_D, BAG),
                  shade(f'{pfx}-bag-clip',
                        fill_only('M466 590 C480 680 484 780 478 870 L520 870 L520 590 Z', BAG_SH)),
                  P(BAG_D),
                  shape('M396 764 C396 754 404 748 416 748 L462 748 C474 748 480 756 480 766 '
                        'L482 836 C482 846 474 852 464 852 L412 852 C402 852 396 846 396 836 Z',
                        BAG_SH, sw=6),                                   # боковой карман
                  P('M398 780 L480 780', sw=4, stroke=STRAP),
                  shape(FLAP, BAG_SH, sw=7),
                  P('M470 700 L476 806', sw=10, stroke=OUT), P('M470 700 L476 806', sw=4, stroke=STRAP),
                  buckle(470, 700, 26, 16)))

    # рубашка
    SHIRTD = ('M262 580 L392 580 C398 660 404 760 412 878 '
              'C362 890 300 892 246 882 C252 790 256 690 262 580 Z')
    defs.append(clip(f'{pfx}-shirt-clip', SHIRTD))
    body.append(G('shirt', fill_only(SHIRTD, SHIRT),
                  shade(f'{pfx}-shirt-clip',
                        fill_only(HEAD, SHIRT_SH, extra='transform="translate(0 30)"')),
                  P(SHIRTD),
                  shape('M256 608 L286 612 L270 652 Z', SHIRT, sw=DET)))    # воротник

    # лямка: по груди вниз, D-кольцо, пряжка, ремешок назад к рюкзаку
    web = 'M296 818 C324 836 356 850 386 852'
    body.append(G('backpack-strap',
                  P(web, sw=15), P(web, sw=7, stroke=STRAP),
                  shape('M276 590 L314 590 C316 660 314 740 310 806 L280 806 '
                        'C278 740 276 660 276 590 Z', STRAP, sw=6),
                  P('M295 600 L295 790', sw=3, stroke=BAG),
                  ring(296, 700, 24, 17),
                  buckle(295, 802)))

    body.append(G('arm-right', P('M332 620 C330 700 322 800 310 898', sw=LIMB)))

    CAP = ('M300 74 L316 58 L330 74 C420 76 506 134 520 240 '
           'C528 300 524 370 510 430 C502 464 486 490 464 506 '
           'C444 490 426 466 414 440 C404 400 392 366 368 348 '
           'C346 336 322 330 302 326 C290 300 280 270 262 248 '
           'C244 228 222 216 196 212 C176 214 158 222 146 236 '
           'C144 244 142 252 140 262 C136 246 128 234 116 226 '
           'C106 190 118 140 150 110 L166 96 L180 100 C210 82 254 74 300 74 Z')
    BEARD_D = ('M290 330 L314 330 C318 380 322 420 330 450 '
               'C352 480 388 510 418 530 C424 550 418 566 402 578 '
               'C360 602 300 612 230 612 C150 612 108 586 98 540 '
               'C94 520 96 504 100 490 C104 480 106 472 108 466 '
               'C130 468 150 474 166 486 C186 500 212 506 240 500 '
               'C272 490 290 470 294 440 C296 400 294 360 290 330 Z')

    defs.append(clip(f'{pfx}-head-clip', HEAD))
    body.append(G('head',
                  fill_only(HEAD, SKIN),
                  shade(f'{pfx}-head-clip',
                        fill_only(CAP, SKIN_SH, extra='transform="translate(-6 12)"')),
                  P(HEAD)))

    body.append(G('ear-right',
                  shape('M334 372 C362 346 402 364 400 406 C398 444 366 460 338 446 '
                        'C322 428 322 392 334 372 Z', SKIN),
                  P('M356 386 C376 392 380 418 364 430', sw=DET)))

    feats = [
        f'<ellipse cx="164" cy="376" rx="9" ry="18" fill="{OUT}"/>',
        P('M134 324 C152 314 174 312 194 318', sw=9),
        P('M150 406 C160 412 172 412 182 406', sw=3, stroke=SKIN_SH),
    ]
    body.append(G('face-features', *feats))

    defs.append(clip(f'{pfx}-beard-clip', BEARD_D))
    body.append(G('beard',
                  fill_only(BEARD_D, BEARD),
                  shade(f'{pfx}-beard-clip',
                        fill_only('M300 580 C360 590 410 560 440 520 L440 640 L200 640 Z', BEARD_SH)),
                  P(BEARD_D),
                  P('M100 503 C112 504 124 504 134 503', sw=6)))

    defs.append(clip(f'{pfx}-hair-clip', CAP))
    body.append(G('hair', fill_only(CAP, HAIR),
                  shade(f'{pfx}-hair-clip',
                        fill_only('M420 60 C490 140 500 300 460 520 L600 520 L600 60 Z', HAIR_SH)),
                  P(CAP),
                  P('M180 150 C260 116 380 136 470 226', sw=DET),
                  P('M226 228 C300 204 400 236 474 318', sw=DET)))

    return '\n'.join(defs), '\n'.join(body)


# ================================================================== СЗАДИ
def back(pfx='back'):
    defs, body = [], []
    G = grouper(pfx)
    HEAD = HEAD_FB

    body.append(G('leg-left', P(LEG_VL, sw=LIMB)))
    body.append(G('leg-right', P(LEG_VR, sw=LIMB)))
    body.append(G('arm-left', P(ARM_VL, sw=LIMB)))
    body.append(G('arm-right', P(ARM_VR, sw=LIMB)))

    # рубашка (спина)
    SHIRTD = ('M214 572 L386 572 C378 598 388 626 412 640 '
              'C416 720 422 800 426 872 C380 884 338 890 300 890 C262 890 220 884 174 872 '
              'C178 800 184 720 188 640 C212 626 222 598 214 572 Z')
    defs.append(clip(f'{pfx}-shirt-clip', SHIRTD))
    body.append(G('shirt', fill_only(SHIRTD, SHIRT),
                  shade(f'{pfx}-shirt-clip',
                        fill_only(HEAD, SHIRT_SH, extra='transform="translate(0 30)"'),
                        fill_only(SHIRT_EDGE_SH, SHIRT_SH)),
                  P(SHIRTD)))

    # рюкзак: лямки уходят за голову, клапан с двумя ремешками
    BAG_D = ('M206 650 C206 616 246 598 300 598 C354 598 394 616 394 650 '
             'L400 842 C400 862 386 874 366 874 L234 874 C214 874 200 862 200 842 Z')
    FLAP = ('M200 648 C200 612 244 590 300 590 C356 590 400 612 400 648 '
            'L402 712 C402 730 390 742 372 744 C348 746 324 748 300 748 '
            'C276 748 252 746 228 744 C210 742 198 730 198 712 Z')
    web_l = 'M216 860 C204 842 194 826 182 814'
    web_r = 'M384 860 C396 842 406 826 418 814'
    defs.append(clip(f'{pfx}-bag-clip', BAG_D))
    body.append(G('backpack',
                  shape('M214 640 L208 572 L242 572 L246 640 Z', STRAP, sw=6),
                  shape('M386 640 L392 572 L358 572 L354 640 Z', STRAP, sw=6),
                  P(web_l, sw=15), P(web_l, sw=7, stroke=STRAP),
                  P(web_r, sw=15), P(web_r, sw=7, stroke=STRAP),
                  fill_only(BAG_D, BAG),
                  shade(f'{pfx}-bag-clip',
                        fill_only('M372 590 C392 680 398 780 392 880 L420 880 L420 590 Z', BAG_SH)),
                  P(BAG_D),
                  P('M214 800 L386 800', sw=4, stroke=BAG_SH),
                  shape(FLAP, BAG_SH, sw=7),
                  shape('M244 622 L264 622 L264 812 L244 812 Z', STRAP, sw=6),
                  shape('M336 622 L356 622 L356 812 L336 812 Z', STRAP, sw=6),
                  buckle(254, 736, 34, 22), buckle(346, 736, 34, 22)))

    body.append(G('ear-left', shape(EAR_VL, SKIN),
                  P('M88 380 C70 388 68 412 82 424', sw=DET, stroke=SKIN_SH)))
    body.append(G('ear-right', shape(EAR_VR, SKIN),
                  P('M512 380 C530 388 532 412 518 424', sw=DET, stroke=SKIN_SH)))

    # затылок: короткие волосы до шеи, по краю — «пёрышки»
    HAIR_B = (mirror(CAP_OUTER) + ' C100 380 104 430 118 460 '
              'C140 490 180 504 214 508 L224 522 L238 510 C258 514 280 516 300 516 '
              'C320 516 342 514 362 510 L376 522 L386 508 C420 504 460 490 482 460 '
              'C496 430 500 380 498 330 Z')
    defs.append(clip(f'{pfx}-head-clip', HEAD))
    body.append(G('head', fill_only(HEAD, SKIN),
                  shade(f'{pfx}-head-clip',
                        fill_only(HEAD, SKIN_SH),
                        fill_only(HEAD, SKIN, extra='transform="translate(0 -16)"'),
                        fill_only(HAIR_B, SKIN_SH, extra='transform="translate(0 14)"')),
                  P(HEAD)))

    defs.append(clip(f'{pfx}-hair-clip', HAIR_B))
    body.append(G('hair', fill_only(HAIR_B, HAIR),
                  shade(f'{pfx}-hair-clip',
                        fill_only('M400 50 C456 130 470 260 452 540 L600 540 L600 50 Z', HAIR_SH)),
                  P(HAIR_B),
                  P('M292 100 C272 170 274 250 294 320', sw=DET),
                  P('M206 120 C178 190 176 270 200 350', sw=DET),
                  P('M394 120 C422 190 424 270 400 350', sw=DET)))

    return '\n'.join(defs), '\n'.join(body)


VIEWS = (('front', front), ('side', side), ('back', back))
