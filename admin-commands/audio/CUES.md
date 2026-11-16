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

## Admin Commands video specifics

- There is NO voice yet: the timeline is provisional (estimated from the script) and the real voice will be mixed loud on top later, with music ducking under it. Plan the music as if the voice were there: `energy` 0.35–0.6 under dialogue, 0.8–1 for montages and wordless action.
- Moods written for this video: `hook` (main "admin" theme: bouncy, heroic), `power` (synth-brass drive for commands and the admin battle), `chaos` (frantic circus galop for the city chaos), `mystic` (music box + low strings: garage sale, the logs, the server room), `tender` (piano + strings for the emotional end). Use the other moods from `vocab.json` too.
- Every command needs a sound recipe: typing (`typing`) while letters appear, a confirm on ENTER (`confirm`/`click`), then the effect: fly (`whoosh_up`/`jetpack`), speed (`zoom_in`/`whoosh_long`/`skid`), size up (`upgrade`/`rumble`/`level_up`), size down (`harp_down`/`powerdown`), jail (`metal_clank`/`metal_hit` + `stamp`), teleport (`teleport`), god mode (`shine`/`angel`/`forcefield`), noclip (`portal_enter`), freeze (`glass`/`shock`), kick (`glitch_long`), errors (`error`/`buzzer_wrong`). The Admin's commands are heavier (`boom`/`sub_drop` under them).
- Every visual hit in the scene code (bang(), shake, flash, pops, stamps, whip-pans, smash-zooms) should get a sound; giant cats: `monster_growl` softened, `thud` for paws, `rumble`.
- A scene sheet covers exactly the scene's range from `scenes/main.js` RANGES (`start` = a, `end` = b). Because timing will move when the real voice arrives, generate the sheet from the scene code's own `L(id)` / `.word()` expressions with a small script and keep that script next to the sheet as `audio/cues/gen_scNN.js` so it can be re-run.
