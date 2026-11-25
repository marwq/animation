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

## Stats video specifics

- The REAL voice is in place (`scenes/timeline.json` from the ElevenLabs takes); the voice is mixed loud on top with music ducking under it. Plan the music as if the voice were there: `energy` 0.35–0.6 under dialogue, 0.8–1 for montages and wordless action.
- Moods written for this video (all built on one original "level up" main theme): `levelup` (MAIN: cold open, XP spree, outro), `homey` (home, breakfast, the happy ending), `install` (the update + boot), `quest` (school with stats, dodgeball, cafeteria), `cold` (chasing numbers, dumping Benji), `carnival` (the fair), `overload` (Max lost, HUD overload), `search` (HUD off, the run with Benji and Tank), `tender` (Tank's reveal, Grandpa's bench, apologies, BIG BROTHER), `anthem` (Max found, the reunion), plus `playful`, `mystery`, `wonder`, `sad`, `warm`, `chaos` from `vocab.json`. Use `silence` drop-outs for comedic and emotional beats (the toaster burns, "Two XP? Not worth it.", the friendship −50, the HUD switching off → true silence for ~1.5 s before the world sounds come back).
- Every visual hit in the scene code needs a sound. Signature recipes:
  - **The HUD:** `ui_pop` when a stat plate pops in, `money_counter` (soft, −8) while numbers roll, `click`/`tap` for each status tag slapping on, `alarm_beep` (soft) for a low bar blinking red, `notify` for quest markers and toasts, `chime` + `achievement` for QUEST COMPLETE, `level_up` for level-ups, `coin`/`sparkle` for each "+10 XP" flying into the bar, `heart_pop` for +friendship, `glass` + `sad_trombone`(very soft) or `sub_drop` for the cracked −50 heart, `buzzer_wrong` for the LIE 99% meter, `error` for Biscuit's ERROR: TOO GOOD.
  - **The update:** `notify` for the window, `paper` + `whoosh_long` for 4,812 pages scrolling, `click` ACCEPT, `loading` + `riser` + `pixel_wipe` + `upgrade` for installing reality, `glitch` small hits for HUD glitches.
  - **Overload / off:** `glitch_long` + `static` + `heartbeat` + `riser` for the numbers flood, `toggle`/`click` for the X, `glass` + `explosion_small` (soft) + `shine` for the HUD shattering, then `silence` and a slow return of `crowd` ambience and `birds`.
  - **School:** `bell` (school bell), `step` crowds, `door_open`, `paper` (quiz), `boing`/`bonk`/`whoosh` for dodgeballs, `crowd_cheer` / `kids_laugh` for the gym, `chomp`/`gulp` for eating, `body_fall` + `thud` for Benji falling ("I'm okay!").
  - **Home:** `alarm` (alarm clock ENEMY), `toaster` = `pop` + `sizzle`, `pan_clang`, `dishes`, `dog_bark` (soft, Biscuit), `snore`, `pop` for pillows landing, `tada` for the fort.
  - **Fair:** `crowd` ambience, `bell`/`ka_ching` booth dings, `whistle`, `boing` + `squeak` for the inflatable dinosaur, `applause` + `crowd_cheer` when Max is found, `monster_growl` (softened, pitched cute) for Max's RAWR.
  - **Emotional:** almost nothing under Tank's reveal and Grandpa's bench (soft `tender`, ambience only); `heartbeat` for the moment the hero sees Tank's HP 3.
- A scene sheet covers exactly the scene's range from `scenes/main.js` RANGES (`start` = a, `end` = b). Generate the sheet from the scene code's own `L(id)` / `.word()` expressions with a small script kept next to it as `audio/cues/gen_scNN.js` (see `/home/user/animation/parents/audio/cues/gen_sc05.js` for the pattern).

## Parents video specifics

- The REAL voice is in place (scenes/timeline.json from the ElevenLabs takes); the voice is mixed loud on top with music ducking under it. Plan the music as if the voice were there: `energy` 0.35–0.6 under dialogue, 0.8–1 for montages and wordless action.
- Moods written for this video (all built on one original main theme): `family` (MAIN theme: warm bouncy pop), `lobby` (chill Cube City groove), `arena` (arena rock: Mom's fights), `tycoon` (Granny's money montage), `boss` (the Block King), `anthem` (JUMP DAD JUMP → VICTORY), plus `tender` / `sad` (bedroom talk), `playful`, `chaos`, `mystery`, `wonder`, `warm`, `epic`, `climax` from `vocab.json`. Use `silence` drop-outs for awkward beats (the whole server staring, the cereal falling, the slammed laptop).
- Every visual hit in the scene code needs a sound. Signature recipes:
  - **Typing / chat:** `typing` while letters appear (Dad's caps lock: slower, heavier `click`s), `chat_pop` when a bubble pops, `notify` for join toasts ("joined the server"), chat flood = many soft `chat_pop`s panned around.
  - **Spawning / game feel:** `respawn` or `teleport` + `sparkle` when an avatar spawns, `jump_game` for jumps, `land`, `splash`/`big_splash` when Dad falls into the water, `level_up`/`achievement` for ranks, `ui_pop`/`click` in the avatar editor, `ka_ching`/`coins`/`money_counter` for purchases and Granny's money.
  - **Combat:** `swish` / `whoosh` for swings, `punch` / `slap` / `impact` for hits, `boing` + `whoosh_up` + `sparkle` for a player flying out of the arena, `crowd_cheer` / `applause` for the stands, `orch_hit` for a big KO.
  - **Granny's empire:** `pop` for each block appearing, `rumble` + `riser` as the skyscraper grows, `stamp` for SOLD, a lone `squeak` / `cricket` for the 12 coins.
  - **Dad:** `rimshot` after his jokes, `kids_laugh`/`giggle` for the players laughing, `crowd_cheer` for "DAD!", `heart_pop` for the kid's "be my dad too".
  - **Emotional:** almost nothing under the bedroom talk (room ambience, soft `tender` music); `door_close` slam; `alarm`/`siren` + `sub_drop` for the Block King alert.
  - **Boss:** `monster_roar` (softened), `rumble`, `boom`/`explosion` for smashes, `stone`/`rock_drop` debris, `forcefield` for the shield dome, `glass` + `shine` + `reverse_swell` for the crystal, `explosion` + `confetti` + `tada` for VICTORY, `achievement` for MVP.
  - **Real life:** `kitchen`/`room`/`night` ambiences, `dishes`, `paper` (newspaper), `typing`, `tv_on`.
- A scene sheet covers exactly the scene's range from `scenes/main.js` RANGES (`start` = a, `end` = b). Generate the sheet from the scene code's own `L(id)` / `.word()` expressions with a small script kept next to it as `audio/cues/gen_scNN.js` (see `/home/user/animation/respawn/audio/cues/gen_sc05.js` for the pattern).
