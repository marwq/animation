# Sound cue sheets

One JSON file per scene: `audio/cues/scNN.json` (`sc01.json` … `sc06b.json` … `sc13.json`). Times are ABSOLUTE video seconds
(the same global seconds the scene modules use, e.g. `inv(347.1, 347.25, t)`).

```json
{
  "scene": "SC 06",
  "start": 341.4,
  "end": 414.0,
  "music": [
    { "start": 341.4, "end": 362.0, "mood": "chase", "energy": 0.8, "in": "cut", "out": "sting" },
    { "start": 362.0, "end": 414.0, "mood": "game",  "energy": 0.6, "in": "fade", "out": "fade" }
  ],
  "ambience": [
    { "start": 341.4, "end": 414.0, "name": "birds", "gain_db": -6 }
  ],
  "footsteps": [
    { "start": 345.2, "end": 348.0, "interval": 0.22, "surface": "hard", "gain_db": -8, "pan": 0.2 }
  ],
  "sfx": [
    [347.1, "whoosh", 0, -0.3, "Speedy zooms past"],
    [354.1, "slide_up", -2, 0.5, "YOINK! egg snatched"]
  ]
}
```

- **music**: segments must tile `[start, end]` exactly with no gaps. Moods are in `vocab.json`.
  - `energy` is 0..1: how busy and loud the music is (0.3 = sparse bed, 1 = full).
  - `in` is `cut`, `fade` or `swell`.
  - `out` is one of:
    - `cut`;
    - `fade`;
    - `sting` (ends on a button hit);
    - `scratch` (record-scratch stop);
    - `tapestop` (slows down to a stop).
  - Make a new segment wherever the mood clearly changes. A scene can also have short music
    drop-outs (`silence`) for comedic beats, typically 0.5–3 s.
- **ambience**: continuous background beds. They may overlap each other.
- **footsteps**: the mixer generates alternating steps every `interval` seconds.
  - Run cycles in code look like `run(t * K)`: steps land every `π / K` seconds.
  - Walk cycles look like `walk(t * K)`: steps also land every `π / K` seconds.
  - `walkFront(t * K)`: steps land every `π / K` seconds as well.
- **sfx**: `[time, name, gain_db, pan, note]`.
  - `gain_db` 0 = normal level. Use +2…+4 for the biggest hits and −6…−14 for subtle background
    details.
  - `pan` runs −1 (left) to +1 (right); derive it from screen x: `(x − 960) / 960 × 0.7`.
  - `note` is free text describing what happens.

Validate with `python3 audio/validate_cues.py audio/cues/scNN.json`.

## Respawn video specifics

- There is NO voice yet: the timeline is provisional (estimated from the script) and the real voice will be mixed loud on top later, with music ducking under it. Plan the music as if the voice were there: `energy` 0.35–0.6 under dialogue, 0.8–1 for montages and wordless action.
- Moods written for this video (all built on one original main theme): `respawn` (MAIN theme: chiptune-pop "try again"), `tutorial` (Tip, rules, bubbly), `perfect` (the perfect-day montage), `loop` (Thursday x412: the same bar forever), `lag` (glitching reality), `corrupt` (alarm, ghost storm), `showtime` (talent-show band), `foam` (foam disco finale), plus `tender` / `sad` / `mystery` / `mystic` / `playful` / `wonder` etc. from `vocab.json`. Use `silence` drop-outs for comedic beats (the "dead silence + cricket" moments are written in the script).
- Every visual hit in the scene code needs a sound. Signature recipes:
  - **Fail → crumble into blocks:** `bonk`/`impact`/`body_fall` on the hit, then `pop` + `stone` (or `rock_drop`) for the blocks, a short `pixel_wipe`.
  - **Respawn overlay:** `powerdown` or `reverse_swell` as the world greys, `countdown_tick` on 3 and 2, `countdown_final` on 1, then `respawn` (+ `sparkle`/`forcefield`) on the pop.
  - **Checkpoint saved:** `achievement` or `level_up` (soft) + `chime`; planting the flag: `thud` + `confirm`.
  - **Pause menu:** `ui_pop` open, `click` per highlight, `confirm` on press; broken menu: `glitch` + `error`.
  - **Tip:** `chat_pop`/`heart_pop` when it pops in, `boing` for bounces, `glitch`/`static` when glitching, `sparkle` + `harp_up` for its goodbye.
  - **Counters/HUD:** `tap`/`click` per tick, `ka_ching`-free (no money in this video).
  - **Lag:** `glitch`, `glitch_long`, `static`, `record_scratch`, `vhs_clunk`; low graphics: `powerdown` + `pixel_wipe`.
  - **Corruption:** `siren`/`alarm`, `sub_drop`, `rumble`, `glitch_long`; ghosts appearing: `poof` (soft, many, panned); delete save: `confirm` → `shine` + `confetti` + `tada` (soft) + `reverse_swell`.
  - **School life:** skate `skate_roll`, `skid`, `land`, `whoosh`; dodgeball `slap`/`punch`/`boing`, Coach's `whistle`; laughter `giggle` / `kids_laugh` / `crowd_laugh`; audience `crowd_gasp`, `applause`, `crowd_cheer`; dead silence `cricket`.
  - **Home:** pancake flip `swish` + `splat`/`pan_clang`, `rimshot` after Dad's joke, stairs tumble `body_fall`×3 + `thud`, lightning `thunder` + `electric` + `shock`, rain ambience `rain`.
  - **Foam:** `riser` → `big_splash` + `bubbles` + `whoosh_up` + `steam_hiss`.
- A scene sheet covers exactly the scene's range from `scenes/main.js` RANGES (`start` = a, `end` = b). Because timing will move when the real voice arrives, generate the sheet from the scene code's own `L(id)` / `.word()` expressions with a small script and keep that script next to the sheet as `audio/cues/gen_scNN.js` so it can be re-run (see `/home/user/animation/admin-commands/audio/cues/gen_sc04.js` for the pattern).
