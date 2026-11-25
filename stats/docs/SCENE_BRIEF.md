# Brief for scene writers (Stats video)

You animate one or more scenes of "What If You Could See Everyone's STATS in Real Life?" in `/home/user/animation/stats`.

## Read first
1. `ENGINE.md` — module contract, voice timing API, actors, kit, visual language, performance, how to check.
2. `script/SCRIPT.md` — the story; your scene's section is the shot list (🎬 shot, 💥 effect, ⏱ silent beat) and the exact voice lines. Read the whole story once so your scene fits, then your section closely.
3. `docs/CAST.md`, `docs/HUD.md`, `docs/SETS_HOME.md`, `docs/SETS_TOWN.md`, `docs/SETS_FAIR.md` (plus the older UI/FX kits: `/home/user/animation/parents/docs/GAMEUI.md`, `/home/user/animation/respawn/docs/FX.md`) and the contact sheets in `concept/` (look at them with the Read tool) — everything you can draw already exists: use it, don't redraw it.
4. Quality references (same engine, earlier videos — level of dynamics and polish, **don't copy content**): `/home/user/animation/parents/scenes/s03.js`, `s05.js`, `s11.js`.

## What to deliver
- `scenes/sNN.js` (+ optional `scenes/sNN_env.js` helpers) for each of your scenes, covering exactly the scene's range from `node -e "console.log(require('./scenes/main').RANGES)"` (time `t` is absolute video seconds).
- Then the sound: `audio/cues/gen_scNN.js` → `audio/cues/scNN.json` per scene, following `audio/CUES.md` (music map with the moods of this video, ambience, footsteps, and an SFX for every visual hit). The generator must compute times from the same `L(id)` / `.word()` expressions your scene uses (require `../../scenes/vo` and re-derive them), so it can be re-run when the real voice arrives. Validate with `python3 audio/validate_cues.py audio/cues/scNN.json`.

## Rules
- **Time everything from the voice** (`L(id).a/.b`, `.word(w, n).t0/.t1`) — the real voice timeline is in place; no hard-coded absolute seconds.
- Follow the script's shots (you may add shots, reorder within a line, invent visual gags — make it better, funnier, more dynamic), but every spoken line must have a matching picture.
- **Dynamic, never static:** cut or move the camera about every 3–4 s (~17 cuts/min); push-ins, whip-pans, smash-zooms on punchlines, split-screens, montages synced to words. Characters always act (auto-acting while speaking + your own reactions, walks, squash & stretch). Every punchline gets an accent.
- **The HUD:** stat plates, tooltips, quest markers and XP pop-ups (`scenes/hud.js`) are the main comic device — sync them to the words; fade them where emotion needs clean faces; NO HUD at all while it is switched off (SC 10 and most of SC 11).
- The hero `you` stays on model; keep characters' scales consistent with the set docs.
- Captions are drawn automatically at the bottom (y ≈ 1010): keep faces and key action out of y > 950 or move captions with `captionY`.
- Performance: every frame < 250 ms (measure a few heavy frames; `volume: false` for huge close-ups, cheap crowds).
- Keep your scene files parseable at ALL times (write to a temp file and move it into place): renders of other scenes load every sNN.js.
- Scene boundaries: your first frame continues from the previous scene's end and your last frame hands over to the next scene (see the script); a 0.1–0.3 s transition (white flash, whip, pixel wipe, rewind) at the very start/end of your range is fine.
- Check with `node tools/stills.js /tmp/<your-dir>/x.png t1 t2 …` (3-column contact sheet) at least every ~1.5 s over your whole range plus every key beat, look at the sheets with Read, fix everything off-frame, overlapping, broken or boring. The module must not throw for any `t` in its range (also test the exact range ends).
- Write only your own files (`scenes/sNN*.js`, `audio/cues/gen_scNN.js`, `audio/cues/scNN.json`). Shared files are read-only: if you need a change in one, copy the function into your own file. Don't commit to git. Don't render videos. Temporary files go in `/tmp/<your-dir>`.
- Final report: what each scene shows (shot list with times), anything you couldn't do, perf numbers, and the cue validation result.
