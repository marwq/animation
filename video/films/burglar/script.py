"""Сценарий: «If You Ever Hear Someone Downstairs At Night… DO NOT GO DOWN».

Формат реплик тот же, что у первого ролика: (id, текст, пауза после, опции).
  *слово* — акцент (красным), say=... — произношение, card=(n, подзаголовок) — карточка правила.
"""

TITLE = "If You Ever Hear Someone Downstairs At Night… DO NOT GO DOWN"
TITLE_TOP = "IF YOU EVER HEAR SOMEONE DOWNSTAIRS AT NIGHT"
TITLE_MAIN = "DO NOT GO DOWN"
AGENCY = "OFFICE OF DOMESTIC CONTINUITY"
FILE_NO = "018"
NEXT_FILE = "019"
TARGET = 497.0  # 8:17

LINES = [
    # --- холодное начало ---
    ("o1", "If you ever wake up at three in the morning and hear someone downstairs,", 0.15, {}),
    ("o2", "*do not go down.*", 0.6, {}),
    ("o3", "Do not call out, “Hello?”", 0.45, {"say": "Do not call out: Hello?"}),
    ("o4", "And do not tell yourself it is the house settling.", 0.55, {}),
    ("o5", "Houses settle.", 0.5, {}),
    ("o6", "Houses do not open the *fridge.*", 1.1, {}),
    ("o7", "There are *seven* rules.", 0.35, {}),
    ("o8", "Six of them come from the police.", 0.35, {}),
    ("o9", "The seventh comes from the *burglar.*", 0.3, {}),

    # --- вступление ---
    ("i1", "Most burglars do not want to meet you.", 0.35, {}),
    ("i2", "They want an empty house and a few minutes alone.", 0.4, {}),
    ("i2b", "Some knock first, to make sure nobody is home.", 0.4, {}),
    ("i3", "But in America, more than one burglary in four happens while someone is *home.*", 0.4, {}),
    ("i4", "The police have a name for it.", 0.25, {}),
    ("i5", "A *hot prowl.*", 0.8, {}),
    ("i6", "In seven percent of all burglaries, someone at home is attacked or threatened.", 0.4, {}),
    ("i7", "Tonight, you would like to stay in the other *ninety-three.*", 0.8, {}),
    ("i8", "So listen carefully. We will only say this once.", 0.4, {}),
    ("i9", "We do not like to raise our voice at night.", 1.3, {}),

    # --- правило 1 ---
    ("r1", "Rule one. Do not go downstairs.", 0.8, {"card": (1, "STAY UPSTAIRS")}),
    ("a1", "You will want to check.", 0.3, {}),
    ("a2", "You have a phone, a flashlight, and a strong opinion.", 0.45, {}),
    ("a3", "That is not a *plan.*", 0.7, {}),
    ("a3b", "Do not even go to the top of the stairs to listen. That is where they would see you first.", 0.6, {}),
    ("a4", "A burglar who expected an empty house has just been surprised.", 0.3, {}),
    ("a5", "Surprised people do not make good decisions.", 0.4, {}),
    ("a6", "Neither do people holding a baseball bat at three in the morning.", 0.45, {}),
    ("a7", "Put it down. You have never hit anything with it. Including a baseball.", 1.0, {}),
    ("a8", "Your television can be replaced.", 0.35, {}),
    ("a9", "*You* cannot.", 0.9, {}),
    ("a10", "Stay upstairs. Pick up your phone. Put on your shoes.", 0.4, {}),
    ("a11", "Then move. Quietly. Toward a room with a lock.", 1.3, {}),

    # --- правило 2 ---
    ("r2", "Rule two. Lock yourself in.", 0.7, {"card": (2, "LOCK IN")}),
    ("b1", "Your bedroom will do.", 0.3, {}),
    ("b2", "Close the door. Lock it.", 0.6, {}),
    ("b3", "Many bedroom locks can be opened from the outside with a coin.", 0.3, {}),
    ("b4", "They were made to stop children, not *adults.*", 0.6, {}),
    ("b5", "So help it. Wedge a chair under the handle.", 0.45, {}),
    ("b6", "Then push the dresser against the door.", 0.3, {}),
    ("b7", "It is heavier than it looks. You have been meaning to move it anyway.", 0.7, {}),
    ("b7b", "If anyone else is in the house, bring them in. Children. Partner. Pets.", 0.35, {}),
    ("b7c", "The cat will refuse. That is its decision.", 0.8, {}),
    ("b8", "Now sit on the floor, away from the door and away from the window.", 0.4, {}),
    ("b9", "Low, quiet, and boring.", 0.35, {}),
    ("b10", "Be *furniture.*", 1.3, {}),

    # --- правило 3 ---
    ("r3", "Rule three. Call for help. Do not talk.", 0.7, {"card": (3, "SILENT CALL")}),
    ("c1", "Call the emergency number. If you can whisper, whisper.", 0.3, {}),
    ("c2", "Give your address first. Everything else is second.", 0.55, {}),
    ("c2b", "Someone is in my house. I am upstairs. I am locked in. That is enough.", 0.55, {}),
    ("c3", "If you cannot speak at all, do not hang up.", 0.4, {}),
    ("c4", "In Britain, there is a system for this. You dial 999.", 0.3, {"say": "In Britain, there is a system for this. You dial nine, nine, nine."}),
    ("c5", "When a recording asks, you press 5, 5.", 0.4, {"say": "When a recording asks, you press five, five."}),
    ("c6", "The call goes through to the police, and they ask questions you can answer with a tap.", 0.45, {}),
    ("c7", "In many parts of America, you can text 911 instead.", 0.3, {"say": "In many parts of America, you can text nine one one instead."}),
    ("c8", "The official advice is: call if you can, text if you can't.", 0.6, {}),
    ("c9", "Turn the screen brightness all the way down.", 0.3, {}),
    ("c10", "Your phone is the brightest thing in the house.", 0.45, {}),
    ("c11", "Downstairs, someone is looking for *bright things.*", 0.9, {}),
    ("c12", "Stay on the line. The dispatcher will tell you when officers are at your door.", 0.35, {}),
    ("c13", "Remember that. It *matters* later.", 1.3, {}),

    # --- правило 4 ---
    ("r4", "Rule four. Do not hide in the closet.", 0.7, {"card": (4, "NOT THE CLOSET")}),
    ("d1", "Every film has taught you to hide in the closet.", 0.3, {}),
    ("d2", "It is the first place anyone looks.", 0.55, {}),
    ("d3", "Also, check it.", 0.7, {}),
    ("d4", "Just *check* it.", 1.0, {}),
    ("d4b", "Coats. Shoes. A box you never unpacked.", 0.45, {}),
    ("d4c", "The top shelf is dark. Do not look at the top shelf yet.", 0.9, {}),
    ("d5", "In 2008, near Fukuoka in Japan, a man noticed that food was disappearing from his kitchen.", 0.3, {}),
    ("d6", "Not much. Just enough to notice.", 0.45, {}),
    ("d7", "He set up cameras that sent pictures to his phone while he was at work.", 0.3, {}),
    ("d8", "The pictures showed someone in his house.", 0.55, {}),
    ("d9", "Police searched every room. They found a woman on the top shelf of his closet.", 0.45, {}),
    ("d10", "She had been living there for about a year.", 0.35, {}),
    ("d11", "She had moved in a mattress. She took showers while he was out.", 0.6, {}),
    ("d12", "There is a name for this now. *Phrogging.*", 0.9, {"say": "There is a name for this now. Frogging."}),
    ("d13", "You live alone.", 0.7, {}),
    ("d14", "*Probably.*", 1.5, {}),

    # --- правило 5 ---
    ("r5", "Rule five. Let them take it.", 0.7, {"card": (5, "LET IT GO")}),
    ("e1", "Listen. Do not move. Count.", 0.55, {}),
    ("e2", "Footsteps. Drawers. Your laptop being unplugged.", 0.45, {}),
    ("e3", "Let it go. It was slow anyway.", 0.8, {}),
    ("e3b", "Remember what you hear. Voices. Names. How many of them there are. The police will ask.", 0.7, {}),
    ("e4", "In 2012, researchers asked four hundred and twenty-two burglars in prison what would make them pass a house by.", 0.3, {}),
    ("e5", "About sixty percent said an *alarm* would send them somewhere else.", 0.45, {}),
    ("e6", "So if you have an alarm with a panic button, press it. Let the house shout for you.", 0.6, {}),
    ("e6b", "No alarm? Your car keys have a panic button. Press it. Cars are very loud and very stupid.", 0.6, {}),
    ("e7", "Most burglars leave as soon as they realise someone is home.", 0.45, {}),
    ("e8", "*Most.*", 1.1, {}),
    ("e9", "Tonight, the footsteps do not leave.", 0.45, {}),
    ("e10", "They walk to the kitchen. You hear the fridge again.", 0.6, {}),
    ("e11", "Some burglars get comfortable.", 0.3, {}),
    ("e12", "In West Virginia, a man came home to a broken door and a stranger asleep in his bed.", 0.45, {}),
    ("e13", "He did not wake him. He called the police.", 0.3, {}),
    ("e14", "When they arrived, the stranger was *still asleep.*", 0.7, {}),
    ("e15", "That is not your problem tonight.", 0.3, {}),
    ("e16", "Your bed is upstairs. You are not in it.", 1.3, {}),

    # --- правило 6 ---
    ("r6", "Rule six. Do not open the door to a voice.", 0.7, {"card": (6, "NO VOICES")}),
    ("f1", "When help comes, you will hear it.", 0.3, {}),
    ("f2", "Sirens. Car doors. Heavy boots on your stairs.", 0.45, {}),
    ("f3", "Then a knock on your bedroom door.", 0.35, {}),
    ("f4", "Someone will say, “Police. You can come out now.”", 0.55, {"say": "Someone will say: Police. You can come out now."}),
    ("f5", "Do not open it.", 0.45, {}),
    ("f6", "Ask the dispatcher. They know where their officers are.", 0.3, {}),
    ("f7", "Anyone can say police. Only the dispatcher knows who is standing on your stairs.", 0.9, {}),
    ("f7b", "Real officers will not mind waiting. They do this every night.", 0.8, {}),
    ("f8", "Tonight, the dispatcher is quiet for a moment.", 0.9, {}),
    ("f9", "Then she says, “Our officers are still four minutes away.”", 1.1, {"say": "Then she says: Our officers are still four minutes away."}),
    ("f10", "*Do not open the door.*", 1.0, {}),
    ("f11", "Someone knocks again.", 0.45, {}),
    ("f12", "*Politely.*", 1.5, {}),

    # --- правило 7 ---
    ("r7", "Rule seven.", 1.2, {"card": (7, "")}),
    ("g1", "Rule seven comes from the burglar.", 0.45, {}),
    ("g2", "At 3:07, the dispatcher took a second call from your address.", 0.35, {"say": "At three oh seven, the dispatcher took a second call from your address."}),
    ("g3", "Not from you. From your kitchen. A man, whispering.", 0.45, {}),
    ("g4", "He said he had broken in. He said he would like to be *arrested.* Quickly.", 0.45, {}),
    ("g5", "He said he had followed his own first rule. If someone is home, leave.", 0.35, {}),
    ("g6", "But the back door was locked again. From the inside.", 0.35, {}),
    ("g7", "He had not locked it.", 0.7, {}),
    ("g8", "He said someone came down from the attic and watched him eat.", 0.45, {}),
    ("g8b", "It did not say anything. It just watched.", 0.45, {}),
    ("g8c", "Then it washed his plate.", 0.8, {}),
    ("g9", "He said it was not the owner.", 0.35, {}),
    ("g10", "The owner was upstairs, behind a dresser, following the rules.", 0.7, {}),
    ("g11", "Good. You were.", 1.3, {}),
    ("g11b", "In the morning, the police will find a broken door, a frightened burglar, and a very clean kitchen.", 0.9, {}),
    ("g12", "By now, you are wondering how we know where you were sitting.", 0.55, {}),
    ("g13", "We are a trusted government agency.", 0.45, {}),
    ("g14", "We do not break into people's homes.", 0.45, {}),
    ("g15", "We were never *out.*", 1.1, {}),
    ("g16", "We do not pay rent. We do the dishes.", 0.45, {}),
    ("g17", "You were out of milk.", 1.1, {}),
    ("g17b", "We bought more.", 1.1, {}),
    ("g18", "Rule seven. If you ever hear someone downstairs at night, do not go down.", 0.45, {}),
    ("g19", "It is not always a burglar.", 0.55, {}),
    ("g20", "Sometimes, it is *us.*", 1.5, {}),
    ("g21", "Thank you for your cooperation.", 1.2, {}),
    ("g22", "*Goodnight.*", 4.0, {}),
]

PRE_GAP = {"i1": 3.4, "r1": 0.6, "r2": 0.6, "r3": 0.6, "r4": 0.6, "r5": 0.6, "r6": 0.6, "r7": 1.0}
LEAD_IN = 1.2
GAP_SCALE = 1.0

# музыка: ми минор, своя тема
MUSIC = dict(
    root=41.2,
    chords=[(64, 67, 71), (60, 64, 67), (57, 60, 64), (59, 63, 66)],
    theme=[(76, 0.0), (79, 0.32), (83, 0.64), (81, 0.96), (79, 1.28), (78, 1.6), (75, 1.92), (76, 2.4)],
    curve=[("o9", 0, 0.7), ("i1", -1.0, 0.25), ("i1", 0, 0.5), ("r1", 0, 0.55), ("f8", 0, 0.75), ("f10", 0, 0.85),
           ("r7", -1.0, 0.6), ("r7", 0, 0.85), ("g12", 0, 0.95), ("g15", 0, 1.0), ("g18", 0, 0.85), ("g20", 0, 1.0)],
    hold="g22",
)
