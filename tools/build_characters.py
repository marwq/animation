#!/usr/bin/env python3
"""Собирает SVG персонажей: characters/<имя>/{front,side,back,turnaround}.svg

    python3 tools/build_characters.py            # все персонажи
    python3 tools/build_characters.py joel       # только один
"""
import sys

import charlib
import ellie
import joel
import sarah

CHARACTERS = {m.NAME: m for m in (ellie, joel, sarah)}


def main(names):
    for name in names or CHARACTERS:
        print('SVG:', charlib.build(CHARACTERS[name]) + '/')


if __name__ == '__main__':
    main(sys.argv[1:])
