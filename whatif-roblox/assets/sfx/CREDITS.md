# SFX library: sources and licences

The library has three kinds of sounds:

- **Built by `audio/build_sfx.py`.** Each name in `audio/vocab.json` is one or more `.ogg` variants, and every variant is loudness-levelled.
- **Synthesized in code.** No samples are used for whooshes, risers, booms, glitches, slide whistles, sparkles, UI blips, sirens, portals, cracks, the chicken, ambience beds and so on.
- **Rendered with FluidSynth** from short original MIDI phrases on the FluidR3 GM SoundFont (MIT licence). This covers stings and fanfares: tada, sad trombone, dramatic, orchestra hit, harp glissandi, choir, music box, drum roll, rimshot and cymbals.

## Recorded sources

All recorded sources are **CC0 (public domain)** and come from OpenGameArt.org. `audio/fetch_sources.sh` downloads them.

| Pack | Author |
|---|---|
| RPG Sound Pack (50 RPG sound effects) | Kenney |
| Interface Sounds | Kenney |
| Casino Audio | Kenney |
| Digital Audio (63 digital sound effects) | Kenney |
| Sci-Fi Sounds | Kenney |
| UI Audio (51 UI sound effects) | Kenney |
| 85 short music jingles | Kenney (not used in the mix) |
| 100 CC0 SFX, 100 CC0 SFX #2 | rubberduck |
| 80 CC0 RPG SFX | rubberduck |
| 40 CC0 water / splash / slime SFX | rubberduck |
| 30 CC0 SFX loops | rubberduck |
| Footsteps (Grass/Sand & Stone) | Fantozzi |
| 37 hits/punches | Independent.nu |
| Swishes Sound Pack | artisticdude |
| 3 Pop Sounds | wubitog |
| BOING! | OGA contributor |
| Applause in a large hall | OGA contributor |
| Crowd shouting ambience | OGA contributor |
| Rain (loopable) | OGA contributor |
| 18 random video game sound effects | OGA contributor |

CC0 requires no attribution. This list is kept for provenance.

## Music

The music is original. `audio/music.py` composes it as a main theme plus Nova's motif across 19 mood styles and renders it with FluidSynth and the FluidR3 GM SoundFont.
