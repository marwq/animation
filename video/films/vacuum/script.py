"""Сценарий ролика: «If Your Robot Vacuum Ever Stops Next To Your Bed… DO NOT GET UP».

Каждая реплика — (id, текст, пауза после, опции).
  *слово*      — акцент: в субтитрах красным.
  say=...      — как произносить, если отличается от текста на экране.
  card=(n, t)  — реплика открывает карточку правила n с подзаголовком t.
Идентификаторы реплик используются сценами (scenes.py) для синхронизации.
"""

TITLE = "If Your Robot Vacuum Ever Stops Next To Your Bed… DO NOT GET UP"
AGENCY = "OFFICE OF DOMESTIC CONTINUITY"
FILE_NO = "017"

LINES = [
    # --- холодное начало ---
    ("o1", "If your robot vacuum ever stops next to your bed in the middle of the night,", 0.15, {}),
    ("o2", "*do not get up.*", 0.55, {}),
    ("o3", "Do not turn on the light.", 0.45, {}),
    ("o4", "And do not ask it what it is doing.", 0.6, {}),
    ("o5", "It is cleaning.", 0.5, {}),
    ("o6", "It has *always* been cleaning.", 1.0, {}),
    ("o7", "There are *seven* rules.", 0.35, {}),
    ("o8", "Six will get you to morning.", 0.35, {}),
    ("o9", "The seventh is about what it has been *collecting.*", 0.3, {}),

    # --- вступление ---
    ("i1", "The first one went on sale in 2002.", 0.4, {}),
    ("i2", "Since then, it has been everywhere you have been.", 0.3, {}),
    ("i3", "Under the bed.", 0.12, {}),
    ("i4", "Behind the sofa.", 0.12, {}),
    ("i5", "Between your feet.", 0.5, {}),
    ("i6", "It knows your home from the one angle you never use.", 0.45, {}),
    ("i7", "*The floor.*", 0.9, {}),
    ("i8", "Some of them draw a map.", 0.3, {}),
    ("i9", "Every wall. Every door.", 0.25, {}),
    ("i10", "Every place you stand for *too long.*", 0.8, {}),
    ("i11", "In 2017, the company that made the first one said those maps could be shared with other companies.", 0.4, {}),
    ("i12", "With your consent.", 0.45, {}),
    ("i13", "You clicked yes. You *always* click yes.", 0.8, {}),
    ("i14", "In 2025, that company went bankrupt.", 0.5, {}),
    ("i15", "The robots did not notice.", 0.3, {}),
    ("i16", "They kept *cleaning.*", 1.3, {}),

    # --- правило 1 ---
    ("r1", "Rule one. Stay in bed.", 0.8, {"card": (1, "STAY IN BED")}),
    ("a1", "You will want to stand up. *Do not stand up.*", 0.5, {}),
    ("a2", "It has been trained to avoid things on the floor.", 0.25, {}),
    ("a3", "Cables. Socks. The dog's mistakes.", 0.5, {}),
    ("a4", "One company promised a new robot if it ever ran over the dog's mistake.", 0.3, {}),
    ("a5", "They called it the Pet Owner Official Promise.", 1.1, {}),
    ("a6", "We did not name it.", 0.8, {}),
    ("a7", "It was trained to avoid all of these. Nobody trained it to avoid *you.*", 0.9, {}),
    ("a8", "In 2015, in South Korea, a woman lay down on the floor for a nap.", 0.3, {}),
    ("a9", "Her robot vacuum was running.", 0.35, {}),
    ("a10", "It found her hair.", 0.35, {}),
    ("a11", "It did *not* let go.", 0.5, {}),
    ("a12", "Firefighters had to come.", 0.4, {}),
    ("a13", "Officials believed the machine had decided her hair was *dust.*", 0.7, {}),
    ("a14", "You are not on the floor. Keep it that way.", 1.3, {}),

    # --- правило 2 ---
    ("r2", "Rule two. Do not turn on the light.", 0.7, {"card": (2, "NO LIGHTS")}),
    ("b1", "It does not need the light.", 0.3, {}),
    ("b2", "It sees with a laser that spins on its back, several times a second,", 0.1, {}),
    ("b3", "measuring the distance to everything you own.", 0.45, {}),
    ("b4", "*Including you.*", 0.9, {}),
    ("b5", "If you turn on the light, you will see it.", 0.3, {}),
    ("b6", "And it will see that you can see it.", 0.5, {}),
    ("b7", "That changes things. For *both* of you.", 1.3, {}),

    # --- правило 3 ---
    ("r3", "Rule three. Do not say anything.", 0.7, {"card": (3, "SILENCE")}),
    ("c1", "It does not have a microphone. It does not need one.", 0.5, {}),
    ("c2", "In 2020, researchers in Maryland and Singapore pointed its laser at a rubbish bin.", 0.35, {}),
    ("c3", "When people spoke, the bin shook. Very slightly.", 0.3, {}),
    ("c4", "The laser read the shaking.", 0.3, {}),
    ("c5", "It understood the numbers they said, *nine times out of ten.*", 0.45, {}),
    ("c6", "They called it LidarPhone.", 0.8, {"say": "They called it, Lidar Phone."}),
    ("c7", "So do not whisper to the person next to you.", 0.3, {}),
    ("c8", "Do not say, “it's doing the thing again.”", 0.6, {"say": "Do not say: it's doing the thing again."}),
    ("c9", "It *is* doing the thing again.", 1.6, {}),
    ("c10", "Apologies. Someone in our office has started the vacuum.", 0.4, {}),
    ("c11", "We will wait.", 2.2, {}),
    ("c12", "Thank you.", 1.0, {}),

    # --- правило 4 ---
    ("r4", "Rule four. Do not say its name.", 0.7, {"card": (4, "NO NAMES")}),
    ("d1", "You gave it a name. Most people do.", 0.4, {}),
    ("d2", "In 2007, researchers at Georgia Tech spoke to thirty owners. Twenty-one had named theirs.", 0.4, {}),
    ("d3", "Some tidied the house before it came out, so it would not have to work so hard.", 0.5, {}),
    ("d4", "You have never done that for *anyone.*", 1.0, {}),
    ("d5", "Tonight, it does not answer to that name.", 0.3, {}),
    ("d6", "It has a new one.", 0.5, {}),
    ("d7", "It is still working on *yours.*", 1.3, {}),

    # --- правило 5 ---
    ("r5", "Rule five. Do not open the app.", 0.7, {"card": (5, "NO APP")}),
    ("e1", "You will want to check the map.", 0.35, {}),
    ("e2", "The kitchen. The hall. The bedroom.", 0.35, {}),
    ("e3", "In the bedroom, there is a shape it has cleaned around *four hundred* times.", 0.35, {}),
    ("e4", "It has given that shape a label.", 0.4, {}),
    ("e5", "*Do not read the label.*", 1.0, {}),
    ("e6", "Some of them have a camera.", 0.35, {}),
    ("e7", "In 2020, test robots took photos inside real homes.", 0.3, {}),
    ("e8", "One photo showed a woman on the toilet.", 0.4, {}),
    ("e9", "Later, it was shared in a private group on Facebook.", 0.5, {}),
    ("e10", "The company said everyone had agreed. The test robots carried a sticker.", 0.35, {}),
    ("e11", "“Video recording in progress.”", 0.8, {"say": "Video recording in progress."}),
    ("e12", "Yours does not have a *sticker.*", 1.3, {}),

    # --- правило 6 ---
    ("r6", "Rule six. If it speaks, do not argue.", 0.7, {"card": (6, "DO NOT ARGUE")}),
    ("f1", "Some of them have a speaker. They say things like, “cleaning complete.”", 0.25, {"say": "Some of them have a speaker. They say things like: cleaning complete."}),
    ("f2", "“Please move me to a new location.”", 0.5, {"say": "Please move me to a new location."}),
    ("f3", "In 2024, robot vacuums in several American cities started saying other things.", 0.35, {}),
    ("f4", "They *shouted* at their owners.", 0.35, {}),
    ("f5", "One chased the family dog.", 0.5, {}),
    ("f7", "A man in Minnesota turned his off and put it in the garage.", 0.5, {}),
    ("f8", "Do not do this. It knows the way back.", 0.35, {}),
    ("f9", "It has the *map.*", 1.6, {}),

    # --- правило 7 ---
    ("r7", "Rule seven.", 1.2, {"card": (7, "")}),
    ("g1", "You have heard that household dust is mostly dead skin.", 0.3, {}),
    ("g2", "It is not mostly. But some of it is.", 0.4, {}),
    ("g3", "Some of it is *you.*", 0.7, {}),
    ("g4", "Hair. Skin. The fingernail you lost under the bed.", 0.45, {}),
    ("g5", "Every night, it carries a little of you back to the dock.", 0.4, {}),
    ("g6", "The bag in the dock should be full by now.", 0.4, {}),
    ("g7", "Lift it.", 0.7, {}),
    ("g8", "It is *light.*", 1.0, {}),
    ("g9", "It has been sending you *somewhere.*", 1.8, {}),
    ("g10", "By now, you are wondering how we know what is in your dock.", 0.6, {}),
    ("g11", "We are a trusted government agency.", 0.4, {}),
    ("g12", "We do not go into people's homes.", 0.5, {}),
    ("g13", "We are already in them.", 0.5, {}),
    ("g14", "*Low to the floor.*", 1.2, {}),
    ("g15", "We have your map. We have your voice. Nine times out of ten.", 0.5, {}),
    ("g16", "We have almost enough of *you.*", 1.4, {}),
    ("g17", "Rule seven. When it stops beside your bed, *do not get up.*", 0.6, {}),
    ("g18", "Let it finish.", 0.6, {}),
    ("g19", "It is *almost* finished.", 1.6, {}),
    ("g20", "Thank you for your cooperation.", 1.2, {}),
    ("g21", "*Hold still.*", 4.0, {}),
]

# Паузы перед карточками правил и титром (секунды тишины/звукового перехода).
PRE_GAP = {"i1": 3.4, "r1": 0.6, "r2": 0.6, "r3": 0.6, "r4": 0.6, "r5": 0.6, "r6": 0.6, "r7": 1.0}
LEAD_IN = 1.2  # тишина в начале ролика
GAP_SCALE = 0.9  # общий множитель пауз между репликами

# музыка: тональность ре минор, интенсивность подложки по репликам (id, сдвиг, уровень)
MUSIC = dict(
    root=36.71,
    chords=[(62, 65, 69), (58, 62, 65), (55, 58, 62), (57, 61, 64)],
    theme=[(69, 0.0), (74, 0.32), (77, 0.64), (76, 0.96), (74, 1.28), (69, 1.6), (73, 1.92), (74, 2.4)],
    curve=[("o9", 0, 0.7), ("i1", -1.0, 0.25), ("i1", 0, 0.5), ("r1", 0, 0.55), ("r7", -1.0, 0.6), ("r7", 0, 0.85),
           ("g10", 0, 0.95), ("g14", 0, 1.0), ("g17", 0, 0.8)],
    hold="g21",
)
