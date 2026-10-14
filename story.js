// ─────────────────────────────────────────────────────────────
//  BEZIRKSSAUFEN — story data
//  Everything the players read lives in this file.
//  Edit freely: the app reads ROUTE, DISTRICTS, STOPS and STORIES.
// ─────────────────────────────────────────────────────────────

// All 17 districts of Graz.
const DISTRICTS = {
  1:  { roman: "I",    name: "Innere Stadt" },
  2:  { roman: "II",   name: "St. Leonhard" },
  3:  { roman: "III",  name: "Geidorf" },
  4:  { roman: "IV",   name: "Lend" },
  5:  { roman: "V",    name: "Gries" },
  6:  { roman: "VI",   name: "Jakomini" },
  7:  { roman: "VII",  name: "Liebenau" },
  8:  { roman: "VIII", name: "St. Peter" },
  9:  { roman: "IX",   name: "Waltendorf" },
  10: { roman: "X",    name: "Ries" },
  11: { roman: "XI",   name: "Mariatrost" },
  12: { roman: "XII",  name: "Andritz" },
  13: { roman: "XIII", name: "Gösting" },
  14: { roman: "XIV",  name: "Eggenberg" },
  15: { roman: "XV",   name: "Wetzelsdorf" },
  16: { roman: "XVI",  name: "Straßgang" },
  17: { roman: "XVII", name: "Puntigam" },
};

// The order of the day (from the "JJ Odyssey" plan).
//   I → VI → VII → VIII → IX → II → X → III → XI → XII → XIII → XIV → XV → XVI → XVII → V → IV
const ROUTE = [1, 6, 7, 8, 9, 2, 10, 3, 11, 12, 13, 14, 15, 16, 17, 5, 4];

// Where we actually drink, roughly when, and how we get there.
// Shown on the "next stop" screen only AFTER the district was guessed.
// `how` describes the leg that leads TO this stop.
const STOPS = {
  1:  { venue: "Auer Schmidtgasse",                  time: "09:00", how: "on foot" },
  6:  { venue: "Sägewerk Sport (Raiffeisenpark)",    time: "10:00", how: "Tram 5: Jakominiplatz → Josefkirche · ~20 min" },
  7:  { venue: "Gotthardt Cafe-Bar, Murpark",        time: "11:00", how: "Tram 4: Messe → Murpark · ~20 min" },
  8:  { venue: "Cuba Bar/Cafe",                      time: "12:00", how: "Bus 64: Murpark → Morrehof · ~10 min" },
  9:  { venue: "Martin Auer, Waltendorfer Hauptstraße 31", time: "13:00", how: "Bus 64: Morrehof → Schörgelgasse · ~15 min" },
  2:  { venue: "Martin Auer Schillerplatz",          time: "14:00", how: "1 km on foot · ~15 min" },
  10: { venue: "Auer, Ragnitzstraße 91",             time: "15:00", how: "Bus 64: Ruckerlberggasse → Klinikum, then 58: Klinikum → Rauchleitenstraße · ~30 min" },
  3:  { venue: "Bierbaron",                          time: "16:00", how: "Bus 58: Rauchleitenstraße → Uni/Liebiggasse · ~15 min" },
  11: { venue: "Sorger, Mariatrosterstraße 24",      time: "17:00", how: "Bus 58: Uni/Liebiggasse → Mariagrün · ~10 min" },
  12: { venue: "Flowers Cafe Lounge",                time: "18:00", how: "Bus 58: Mariagrün → Geidorfplatz, then 41: Geidorfplatz → Stukitzbad · ~40 min" },
  13: { venue: "Göstinger Hof",                      time: "19:00", how: "Bus 52: Stukitzbad → Shopping Nord · ~30 min" },
  14: { venue: "Das Eggenberg",                      time: "20:00", how: "Bus 65: Negrelligasse → Alte Poststraße · ~10 min (if buses get thin: taxi)" },
  15: { venue: "Liwi Pub",                           time: "21:00", how: "Bus 62: Eggenberger Allee → VS Peter Rosegger · ~10 min" },
  16: { venue: "Clocktower",                         time: "22:00", how: "Bus 65: Peter-Rosegger-Straße → Wagner-Jauregg-Straße · ~20 min · closes 23:00!" },
  17: { venue: "Pools, Bar & Billard (Cineplexx)",   time: "23:00", how: "Bus 65: Wagner-Jauregg-Straße → Puntigam Bahnhof · ~20 min" },
  5:  { venue: "Die Beate",                          time: "00:00", how: "E5: Brauquartier → Zentralfriedhof, then 67: Zentralfriedhof → Griesplatz" },
  4:  { venue: "Wherever we wanna verend",           time: "01:00", how: "on foot" },
};

// What the points (❤️ Sarah / 🔖 Sara) can buy. Earning is deliberately slow: events +2, intermissions +1,
// quizzes lose 1 per wrong answer (min +1). Tune here.
const COSTS = {
  hint: 1,    // buy a hint before a wrong guess unlocks it for free
  cancel: 2,  // cancel the penalty sips of the current stop (pass / wrong shop order)
  delegate: 3, // make someone else from the crew do an event/intermission challenge instead of you (no reward)
  reveal: 2,  // Sara: mark the real listing in the Bookbazaar
};
// After this many wrong guesses the hint is free. There is no "just tell us": a district always has to be guessed.
const HINT_AFTER = 1;

// ── Sarah's challenges ────────────────────────────────────────
// Two kinds, both earn likes (❤️) — events +2, intermissions +1:
//   event        – at a stop with no players ("No matches nearby"); done before the message + riddle
//   intermission – pops up suddenly when arriving at a player stop, before his profile
// Types: quiz (app checks answers) · confirm (group confirms) · timer (countdown)
//        write (crew writes Sarah's bio) · notes (crew writes super likes)
const CHALLENGES = {
  quiz: {
    type: "quiz", icon: "🧬", reward: 2,
    title: "Brains are sexy",
    story: "Jakob's teammates only swipe right on smart women. Three easy biochemistry questions — get all three right to boost your profile.",
    questions: [
      { q: "What does DNA stand for?", options: ["Double nitrogen acid", "Deoxyribonucleic acid", "Dinucleotide amine", "Deoxyribose nitrate"], answer: 1 },
      { q: "Which part of the cell is called its powerhouse?", options: ["Ribosome", "Nucleus", "Mitochondria", "Golgi apparatus"], answer: 2 },
      { q: "Proteins are built from…", options: ["Amino acids", "Fatty acids", "Sugars", "Nucleotides"], answer: 0 },
    ],
  },
  pickup: {
    type: "confirm", icon: "😏", reward: 2,
    title: "Flirt practice",
    story: "Your flirting is rusty. Deliver this line to the person behind the counter — straight face, full eye contact. Don't like the line? Get another one.",
    lines: [
      "Are you a Zamboni? Because you just smoothed out all my rough edges.",
      "Is your name Puck? Because I'd chase you for sixty minutes straight.",
      "Are you a goalie? Because you just saved my whole day.",
      "I'd drop the gloves for you.",
      "Are you the Stanley Cup? Because everybody wants to hold you.",
      "Call me a hat-trick: three times the fun.",
    ],
    confirmLabel: "✅ Delivered — the group says it counts",
  },
  profile: {
    type: "write", icon: "✍️", reward: 2, seconds: 90,
    title: "Profile makeover",
    story: "Your profile is empty — that's why nobody's matching. Hand the phone to your crew: they have 90 seconds to write your dating bio. It stays on your profile for the rest of the day.",
    placeholder: "Sarah, 2?. Loves … Hates … Looking for a man who …",
    confirmLabel: "💾 Save my profile",
  },
  shot: {
    type: "confirm", icon: "🥃", reward: 2, countdown: true,
    title: "Liquid courage",
    story: "Matches don't come to the shy. One shot. The whole bar can count down with you.",
    confirmLabel: "✅ Shot's gone — the group saw it",
  },
  penalty: {
    type: "timer", icon: "⏱️", reward: 2, seconds: 120,
    title: "Two minutes for interference",
    story: "You've been flirting too aggressively. Two minutes in the penalty box: no talking, no phone. Your crew is only allowed to say nice things about you the whole time.",
  },
  celebration: {
    type: "confirm", icon: "📣", reward: 2,
    title: "Show us your squad",
    story: "Jakob's team needs to know you've got a squad. The whole group does one big goal celebration together — chant, knee slide, team huddle. Somebody films it. If anyone sits it out, it doesn't count.",
    confirmLabel: "🎉 Everyone joined in — it counts",
  },
  emoji: {
    type: "quiz", icon: "🔣", reward: 1,
    title: "They only text in emojis",
    story: "Jakob's teammates can't spell. Decode their three messages to keep them talking to you.",
    questions: [
      { q: "🏒🎩🎩🎩", options: ["Top hat", "Hat-trick", "Three-piece suit", "Magic trick"], answer: 1 },
      { q: "🧊🔨", options: ["Ice pick", "Hammer time", "Icebreaker", "Cold call"], answer: 2 },
      { q: "🥊🧤⬇️", options: ["Drop the gloves", "Boxing day", "Knockout", "Glove compartment"], answer: 0 },
    ],
  },
  superlikes: {
    type: "notes", icon: "⭐", reward: 1, count: 3,
    title: "Super likes",
    story: "Your likes are running low. Three people from your crew each send you a super like: one thing they love about you. Pass the phone around.",
    placeholder: "From …: I love that Sarah …",
    confirmLabel: "⭐ Send the super likes",
  },
  nohands: {
    type: "confirm", icon: "🙌", reward: 1,
    title: "Goalie style",
    story: "Goalies use their whole body. Finish your drink without using your hands.",
    confirmLabel: "✅ No hands — the group saw it",
  },
  goal: {
    type: "confirm", icon: "🥅", reward: 1,
    title: "Score a goal",
    story: "Flick a bottle cap or a beer mat into a glass. Three tries. Miss all three and your crew picks a new target.",
    confirmLabel: "🚨 GOAL! The group saw it",
  },
};

// Each story: `stops` is keyed by district id.
//   encounter – what happens when they arrive (they just missed him / her)
//   item      – a souvenir added to the journal
//   riddle    – points to the NEXT district on the ROUTE (never names it)
//   hint      – a blunter nudge if they're stuck
// The last district has no riddle: its encounter is the finale.
const STORIES = {
  // ───────────────────────────── SARAH ─────────────────────────────
  sarah: {
    name: "Sarah",
    title: "The Hunt for #99",
    tagline: "A dating app, 17 districts, and one hockey player who's always one bar ahead.",
    theme: "dating",
    app: "icebreaker",
    narrator: "Overheard",
    clueLabel: "Where Jakob went next",
    howTo: [
      "In every district, someone has seen Jakob. His ten teammates show up as matches: <b>like</b> him and he tells you where Jakob went.",
      "<b>Pass</b> on a teammate and it costs you a sip — and he comes right back. He's your only lead.",
      "No players in a district? You're out of matches: complete a challenge to boost your profile and earn likes ❤️. Some challenges strike without warning.",
      "Read the tip, guess the district. Go there, have a drink, tap “We're in”.",
    ],
    intro: `<b>Jakob "Iceman" Eisner</b>, number 99, is out on the town today and nobody can pin him down. His teammates saw him leave every bar, and they all love to talk.

It's your adventure day, Sarah. Today you find him.`,
    stops: {
      1: {
        profile: { name: "Matze", age: 26, number: 14, position: "Center", photo: "img/players/matze.jpg", face: "img/players/matze-face.jpg",
          tags: ["Jakob's linemate", "Spritzer enjoyer"],
          bio: "We had a Spritzer under the Uhrturm at nine in the morning. Jakob kept staring at the clock tower — said the hands are backwards, like our coach. Then he left." },
        encounter: `His linemate <b>Matze (#14)</b> is still at the table, finishing a Spritzer at nine in the morning. "Jakob? Just left. We sat here and he kept staring at the clock tower — said the hands are the wrong way round, big hand for the hours. 'Just like our coach,' he said. 'Everything backwards.'"`,
        item: { icon: "🧾", name: "A receipt, signed #99" },
        riddle: `"He's meeting the rookie south of here, at the big square where every tram line in Graz meets — like players at a face-off. It's named after a merchant who built himself a whole neighbourhood. There's a riverside park nearby with 'Au' in its name."`,
        hint: "The city's main tram hub, plus the Augarten park.",
      },
      6: {
        profile: { name: "Elias", age: 22, number: 22, position: "Left wing", photo: "img/players/elias.jpg", face: "img/players/elias-face.jpg",
          tags: ["Rookie", "Elite hockey hair"],
          bio: "Jakob found me at the tram stop, bought me a Leberkässemmel and checked his watch. Warm-up! He forgot. He ran for the tram like it owed him money." },
        encounter: `<b>Elias (#22)</b>, the rookie with the hockey hair, waves you over. "Jakob found me at the tram stop, bought me a Leberkässemmel and checked his watch. Warm-up! He completely forgot. He ran for the tram like it owed him money."`,
        item: { icon: "🥖", name: "Half a Leberkässemmel" },
        riddle: `"Home ice. South-east, where a 'lovely meadow' used to be: the ice stadium right next to the football stadium, whose forecourt is named after a legendary coach. There's a shopping mall where the trams turn around, and down the road a factory builds those boxy G-Class off-roaders."`,
        hint: "Graz's ice hockey arena, next to the Merkur Arena and the Murpark mall.",
      },
      7: {
        intermission: "emoji",
        profile: { name: "Tomasz", age: 29, number: 31, position: "Goalie", photo: "img/players/tomasz.jpg", face: "img/players/tomasz-face.jpg",
          tags: ["\"The Wall\"", "Saves > feelings"],
          bio: "Jakob scored on me in warm-up. First time all year. He showered in forty seconds, said “today's the day” — and then lost his locker key." },
        encounter: `Goalie <b>Tomasz "The Wall" (#31)</b> is still in his pads. "Jakob scored on me in warm-up. First time all year. He didn't even celebrate — showered in forty seconds and said 'today's the day.' Then he realised he'd lost his locker key and went to find someone who's good with keys."`,
        item: { icon: "🏒", name: "A broken stick, #99" },
        riddle: `"Who has the most famous set of keys? A fisherman who became a saint and guards the gates of heaven. Go north-east to the old village church named after him. Nearby there's a TV studio shaped like a layer cake, and a tiny forgotten jungle with a giant sequoia in it."`,
        hint: "The saint with the keys. The 'cake' is the ORF Landesstudio, the jungle is the 'Grazer Urwald'.",
      },
      8: {
        profile: { name: "Felix", age: 25, number: 9, position: "Right wing", photo: "img/players/felix.jpg", face: "img/players/felix-face.jpg",
          tags: ["Radio voice", "Hands in pockets"],
          bio: "Jakob and I did a radio interview at the TV studio. He found his locker key in his sock — live on air — and said hi to his mum. Then he said what he misses most is skating on natural ice, like when he was a kid." },
        encounter: `A sound engineer on a smoke break outside the TV studio. "He did a quick radio interview — found his key in his sock, by the way. Said hi to his mum on air. And said what he misses most is skating on <i>natural</i> ice, like when he was a kid."`,
        item: { icon: "🗝️", name: "A spare locker key" },
        riddle: `"Up north there are two hills side by side — one wears an observatory, the other old villas. Between them, old clay pits used to freeze over in winter, and Graz literally harvested its ice there. Today it's a nature reserve. The district's coat of arms shows a little castle."`,
        hint: "The hills are Ruckerlberg and Lustbühel. The castle in the coat of arms is the Hallerschloss.",
      },
      9: {
        event: "quiz",
        from: { name: "Astronomer", avatar: "🔭" },
        encounter: `An astronomer packing up a telescope. "Your hockey player wanted to know which star is lucky number 99. I made one up. Then he tried to skate on the pond in the nature reserve. In October. Somebody wrote him a ticket. He said he'd go and serve his penalty like a man."`,
        item: { icon: "🔭", name: "Star no. 99 (made up)" },
        riddle: `"Two minutes in the box. He went north-west to serve his time with the saint who looks after prisoners — the one they paint in chains. The saint's church is just east of the old town, and on the street with his name, music students practise until the windows rattle."`,
        hint: "The patron saint of prisoners (and cattle). Church, street and the arts university all carry his name.",
      },
      2: {
        event: "pickup",
        from: { name: "Cello student", avatar: "🎻" },
        encounter: `A cello student outside the music university. "He asked me to play the goal horn on my cello. I tried. It was awful. He loved it. Then he said he'd had too many Krapfen today and needed cardio. Uphill. He pointed east."`,
        item: { icon: "🎻", name: "Sheet music with a smudged phone number" },
        riddle: `"East, up a ridge road that climbs out of the city. A hundred years ago people raced cars up it, with up to seventy thousand spectators. An old toll house still stands at the bottom. Fun fact: it's the only district in Graz without its own primary school — so nobody up there is checking his homework."`,
        hint: "A district named after a ridge, with two valleys (Stiftingtal and Ragnitz) and a famous uphill road.",
      },
      10: {
        intermission: "superlikes",
        profile: { name: "Marcus", age: 31, number: 77, position: "Defence · Captain", photo: "img/players/marcus.jpg", face: "img/players/marcus-face.jpg",
          tags: ["The C on his chest", "Beard of the year"],
          bio: "I was on my bike up here and Jakob ran past me. Uphill. Then his phone rang: Luca took a high stick to the face. Jakob turned around and sprinted straight back down toward town." },
        encounter: `A cyclist catching his breath at the top of the hill. "Big guy, number 99, ran past me UPHILL. Then his phone rang — a teammate took a high stick to the face. He turned around and sprinted back down toward town."`,
        item: { icon: "📱", name: "A screenshot of a missed call" },
        riddle: `"Back west, toward town, where the big hospital stitches up players like his teammate. The university's grand main building is there too, and glasshouses where palm trees never see a winter."`,
        hint: "The university district: main campus, botanical garden, the big LKH hospital.",
      },
      3: {
        profile: { name: "Luca", age: 33, number: 4, position: "Defence", photo: "img/players/luca.jpg", face: "img/players/luca-face.jpg",
          tags: ["Fresh stitches", "Team veteran"],
          bio: "Took a high stick to the face. Jakob drove me to the clinic and held my hand for every stitch. Then he sat on the steps and said: “I need a miracle.”" },
        encounter: `<b>Luca (#4)</b>, the team veteran, is holding a beer to his fresh scar. "Jakob drove me to the clinic and held my hand for every stitch. Then he sat on the steps and said: 'I need a miracle.' And he got on the bus going north-east."`,
        item: { icon: "🩹", name: "A roll of tape: “#99”" },
        riddle: `"Out north-east, a yellow church with two towers sits up on a hill, at the top of a long stairway. Pilgrims climb it looking for comfort. Retired trams live in a museum at the bottom. He's lighting a candle for his love life."`,
        hint: "A pilgrimage basilica on a hill at the end of tram line 1. The district's name literally contains 'comfort'.",
      },
      11: {
        event: "profile",
        from: { name: "Sacristan", avatar: "⛪" },
        encounter: `The sacristan sighs. "He lit a candle. Then a second one. Then he asked if there's a patron saint of hat-tricks. There isn't. Then he said he needs <i>recovery water</i> — the real stuff, straight from the ground."`,
        item: { icon: "🕯️", name: "Candle no. 99" },
        riddle: `"North-west, over the hills: a clear spring the locals call 'the origin'. The district shares its name with a factory that builds turbines and paper machines for half the planet. It's where the trams run out of track up north."`,
        hint: "A machine factory famous worldwide, a spring called 'Ursprung', the northern end of the tram network.",
      },
      12: {
        intermission: "nohands",
        profile: { name: "Jonas", age: 23, number: 17, position: "Center", photo: "img/players/jonas.jpg", face: "img/players/jonas-face.jpg",
          tags: ["Gym rat", "Hydration coach"],
          bio: "I met Jakob at the spring for recovery water. He drank two litres in one go. Then he said he needs to practise his diving — goalie-style, somewhere high." },
        encounter: `A guy in factory overalls is filling bottles at the spring too. "Number 99? Signed my hard hat! He drank two litres and said he needs to practise his diving. Goalie-style. Somewhere high."`,
        item: { icon: "🪖", name: "A photo of a signed hard hat" },
        riddle: `"Cross the river to the west. Up on a wooded hill there's a castle that has been a ruin for centuries, and a cliff nearby named after a maiden's desperate leap. He's practising his goalie dive up there. Hopefully not off the cliff."`,
        hint: "A castle ruin north-west of town, next to the 'Jungfernsprung' rock.",
      },
      13: {
        event: "shot",
        from: { name: "Hut keeper", avatar: "🏰" },
        encounter: `The keeper of the hut by the ruin is out of breath. "Your hockey player ran up here, did forty push-ups, looked at the view and said 'Graz, you beautiful thing.' Then he spotted peacocks down south and said he needs to learn how to show off properly."`,
        item: { icon: "🏰", name: "A pebble from the castle wall" },
        riddle: `"South, to a palace built like a calendar: three hundred and sixty-five windows, one for every day of the year. Peacocks strut around the park like they own it. He's studying their technique."`,
        hint: "A UNESCO-listed baroque palace on the west side of town. Watch out for peacocks.",
      },
      14: {
        profile: { name: "Nico", age: 28, number: 8, position: "Left wing", photo: "img/players/nico.jpg", face: "img/players/nico-face.jpg",
          tags: ["Team photographer", "Flow game strong"],
          bio: "A peacock stole Jakob's puck and I filmed the whole chase. He lost. To a bird. Then he said he'd report the theft to the police — I think he was joking. I'm not sure." },
        encounter: `A gardener in the palace park shakes his head. "A peacock stole his puck. A grown man, chasing a peacock across the lawn. He lost. He went to report the theft to the police — I think he was joking. I'm not sure."`,
        item: { icon: "🦚", name: "A peacock feather (stolen back)" },
        riddle: `"South of here: a forested hill that shares its name with the Mount of Olives, with the motorway roaring through a tunnel deep underneath. The province's police headquarters is in this district too. The tram line ends at its edge."`,
        hint: "The hill is the Ölberg; the tunnel is the Plabutschtunnel. Look for the tram's western terminus.",
      },
      15: {
        event: "penalty",
        from: { name: "Police officer", avatar: "🚓" },
        encounter: `A police officer at the door, very tired. "Mr Eisner reported a puck stolen by a peacock. I filed it under 'wildlife'. He also asked if there's a law against being this nervous. There isn't. He said he needs a glass of wine, and soon."`,
        item: { icon: "🚓", name: "Police report no. 99" },
        riddle: `"Further south: a little church called 'Mary in Misery' sits on a hill above a road the Romans already used. There's a castle that has been a school for grown-ups for over a hundred years, a natural lake to cool off in, and vineyards — one of only two wine areas inside the city."`,
        hint: "Schloss St. Martin, the Naturbad, the Kehlberg vineyards.",
      },
      16: {
        event: "celebration",
        from: { name: "Bartender", avatar: "🍷" },
        encounter: `The bartender clears a glass. "He drank one glass of wine, very slowly, watching the clock. Then he said wine is for nerves, but beer is for courage — and he wanted it straight from the source."`,
        item: { icon: "🍷", name: "An empty wine glass" },
        riddle: `"East, to where the city's beer is brewed — a family name that turned into a brewery and is now a whole new quarter of town. He's practising his aim there. Billiards counts as hockey, right?"`,
        hint: "The brewery that gives Graz its beer — and its name to the 17th district.",
      },
      17: {
        intermission: "goal",
        profile: { name: "Samuel", age: 24, number: 10, position: "Forward", photo: "img/players/samuel.jpg", face: "img/players/samuel-face.jpg",
          tags: ["Pool shark", "Hat-trick hero"],
          bio: "Jakob lost three games of pool to me and didn't even care. Kept saying “tonight's the night.” Then his stomach growled louder than the jukebox and he went to find Dragan for a kebab." },
        encounter: `A guy chalking his cue at the pool table. "Hockey guy? He lost three games in a row and didn't care. Kept saying 'tonight's the night.' Then his stomach growled louder than the jukebox and he went to see the enforcer for a late-night kebab."`,
        item: { icon: "🎱", name: "The 9-ball (he dropped it)" },
        riddle: `"North, across the tracks, into the district named after the coarse sand and gravel the Mur dumped on its banks. Find the big square with honest bars and kebab until late. And stay away from the long prison wall — that's one penalty box you don't want."`,
        hint: "The district's name is old German for coarse sand. The square has the same name.",
      },
      5: {
        profile: { name: "Dragan", age: 30, number: 55, position: "Enforcer", photo: "img/players/dragan.jpg", face: "img/players/dragan-face.jpg",
          tags: ["Tooth: lost in 2019", "Soft heart"],
          bio: "Jakob ordered a double Dürüm, no onions — “for the breath.” He has a date. I gave him my best advice: never drop the gloves before the second date. He said he'll be waiting at the very end." },
        encounter: `<b>Dragan (#55)</b>, the enforcer, grins with his famous gap. "Jakob ordered a double Dürüm, no onions — 'for the breath.' He has a date. I gave him my best advice: never drop the gloves before the second date. Then he left. He said he'll be waiting at the very end."`,
        item: { icon: "🌯", name: "A napkin: “no onions”" },
        riddle: `"The very end is just north of here: where a strange blue alien with nozzles landed on the riverbank and turned into an art museum, next to a market square where the cool kids drink at night. He's there. Wherever this night ends."`,
        hint: "A blue, bubble-shaped art museum on the west bank of the Mur — the 'Friendly Alien'. The district next to Gries.",
      },
      4: {
        from: { name: "Jakob", avatar: "🏒" },
        encounter: `You made it. Seventeen districts, seventeen drinks, one very long day.

There's no #99 at the bar. But there's a hockey jersey on your chair, and a note in very messy handwriting:

<i>"Sorry, Sarah. I'm always one bar ahead — that's my problem. But look around: everyone at this table followed you across the whole city today. That's the real team. Happy adventure day. Shoot your shot. — J."</i>

Your crew has a drink for you. Prost! 🎉`,
        item: { icon: "👕", name: "Jersey #99 — for you" },
      },
    },
  },

  // ───────────────────────────── SARA ─────────────────────────────
  sara: {
    name: "Sara",
    title: "The Last Copy",
    tagline: "One book. One bookseller. Always five minutes late.",
    theme: "paper",
    narrator: "Overheard",
    clueLabel: "A note from O.P.",
    intro: `There is exactly one copy left of <b>"The Library of Herbert and Kafka"</b>. It belongs to the travelling bookseller <b>Ottilie Pfotenhauer</b> and her cats, <b>Herbert the Gracious</b> and <b>Kafka the Schlimm</b>. She never waits, she only leaves notes.

It's your adventure day, Sara. Today you get that book.`,
    howTo: [
      "In every district, the locals tell you what Ottilie sold them.",
      "Open <b>Bookbazaar</b> and buy the one listing that matches. Wrong order = a dark romance in your haul and penalty sips (1, 2, 3 …).",
      "Now and then there's a reading-room challenge or a sudden plot twist first: complete it to earn bookmarks 🔖 and open Ottilie's cart.",
      "The parcel contains Ottilie's note — the riddle. Guess the district it points to.",
      "Go there. Have a drink. Tap “we've arrived”.",
    ],
    stops: {
      1: {
        encounter: `The woman behind the bakery counter points at the door. "The old lady with the book cart and the two cats? Sold me a cookbook ten minutes ago, paid for her coffee in bookmarks. She said someone would come asking. She left this for you."`,
        item: { icon: "🔖", name: "A bookmark with cat hair on it" },
        riddle: `<i>"Chapter Two: travel literature. South of here is the great square where every tram line in Graz meets, named after a merchant who built himself a whole neighbourhood. Nearby, a riverside garden with 'Au' in its name. I sell maps there. Don't dawdle."</i>`,
        hint: "The city's main tram hub, plus the Augarten park.",
      },
      6: {
        encounter: `A man waiting for the tram. "She was here all morning. Sold me a map of Graz — I live here. Then she said sports biographies sell best near the rink, and Herbert wanted to see the Zamboni."`,
        item: { icon: "📄", name: "Page 1: “In which Herbert meets Kafka”" },
        riddle: `<i>"South-east, where a 'lovely meadow' once was: the ice stadium and the football arena side by side, and a mall where the trams turn around. A hockey player there owes me library fines, by the way. Number 99. Rude."</i>`,
        hint: "Graz's ice hockey arena, next to the Merkur Arena and the Murpark mall.",
      },
      7: {
        encounter: `The Zamboni driver chuckles. "The book lady sold a hockey player a book called <i>How to Talk to Women</i>. He bought two. Then she said even the gatekeeper of heaven needs something to read."`,
        item: { icon: "📄", name: "Page 7: “Kafka vs. the Zamboni”" },
        riddle: `<i>"Find the old village church of the saint with the keys to heaven, north-east of here. Nearby there's a TV studio shaped like a layer cake, and a tiny forgotten jungle with a giant sequoia in it. Herbert got lost in there once."</i>`,
        hint: "The saint with the keys. The 'cake' is the ORF studio, the jungle is the 'Grazer Urwald'.",
      },
      8: {
        encounter: `A radio host outside the TV studio. "She came on my show to plug the book. Herbert meowed into the microphone for four minutes. Ratings were incredible. Then she said she wanted her cat's horoscope read, and walked north."`,
        item: { icon: "📄", name: "Page 12: “Herbert on the radio”" },
        riddle: `<i>"A mystery! In the 1920s a famous medium held séances in the next district — they called her a seer. Today an observatory crowns one of its two hills and old villas line the other. In between, old clay pits became a nature reserve."</i>`,
        hint: "Ruckerlberg and Lustbühel (with the observatory). The 'Seherin von Waltendorf'.",
      },
      9: {
        encounter: `An astronomer by the observatory. "She asked me for Herbert's horoscope. I told her Herbert is a Taurus. She said that explains a lot. Then she said the next chapter is about freedom."`,
        item: { icon: "📄", name: "Page 23: “Herbert's horoscope: nap”" },
        riddle: `<i>"The chapter of freedom: the saint who breaks prisoners' chains has his church just east of the old town, north-west of here. On the street named after him, the pianos of the music university drift out of the windows. Good music to read to."</i>`,
        hint: "The patron saint of prisoners. Church, street and arts university carry his name.",
      },
      2: {
        encounter: `A piano student with a book of sonnets. "She sold me this for two euros and a song. Literally — I had to play her a song. Then she said she was writing a road novel and pushed her cart uphill. East."`,
        item: { icon: "📄", name: "Page 31: “Kafka plays the piano (badly)”" },
        riddle: `<i>"A road novel! East, a ridge road climbs out of town, where cars once raced uphill in front of up to seventy thousand people. An old toll house stands at its foot. There's no primary school in the whole district — so nobody up there has read my book."</i>`,
        hint: "A district named after a ridge, with the Stiftingtal and Ragnitz valleys.",
      },
      10: {
        encounter: `A cyclist resting at the top of the road. "An old lady pushing a book cart uphill. Faster than me. One of her cats was riding on top of the books like a figurehead. Then she turned around and rolled all the way back down. Something about textbooks."`,
        item: { icon: "📄", name: "Page 44: “Herbert, Captain of the Cart”" },
        riddle: `<i>"The scholars' chapter. Back west toward town: the university's grand main building with its old reading hall, the glasshouses of the botanical garden, and the big hospital where Herbert once needed stitches. Don't ask."</i>`,
        hint: "The university district — main campus, botanical garden, the LKH hospital.",
      },
      3: {
        encounter: `A librarian having a beer after her shift. "Ottilie returned a book that was 41 years overdue and paid the fine in cat food vouchers. We accepted. Then she said she needed a miracle to find a worthy buyer, and took the bus north-east."`,
        item: { icon: "📄", name: "Page 58: “A footnote about tuna”" },
        riddle: `<i>"A pilgrim's tale. North-east, a yellow church with two towers sits up on a hill, at the top of a long stairway. Old trams rest down below in a museum, like first editions in an archive."</i>`,
        hint: "A pilgrimage basilica at the end of tram line 1. The name contains 'comfort'.",
      },
      11: {
        encounter: `The sacristan is sweeping the stairs. "She prayed for a reader worthy of her last copy. Then Herbert knocked over three candles and they had to leave quite quickly. She said she's running out of paper."`,
        item: { icon: "📄", name: "Page 66: “The candle incident”" },
        riddle: `<i>"Every story has an origin, and north-west of here it's quite literal: a spring the locals call 'the origin'. The district shares its name with a factory that builds paper machines — and without paper, no books. The trams end there; so does my patience."</i>`,
        hint: "A machine factory famous worldwide, a spring called 'Ursprung', the northern end of the tram lines.",
      },
      12: {
        encounter: `A woman walking her dog by the spring. "The book lady? Herbert hissed at my dog. My dog cried. She apologised with a children's book and said she needs something darker for her stock."`,
        item: { icon: "📄", name: "Page 70: “Herbert sleeps for 19 hours”" },
        riddle: `<i>"Every good shop needs a tragedy section. Across the river to the west: a castle that has been a ruin for centuries on a wooded hill, and a cliff named after a maiden who leapt rather than surrender. Gothic novels sell themselves up there."</i>`,
        hint: "A castle ruin north-west of town, next to the 'Jungfernsprung' rock.",
      },
      13: {
        encounter: `The keeper of the hut by the ruin is reading by candlelight. "She sold me a ghost story and a bag of cat treats. Herbert ate the treats. Then she said she's off to a palace — one window for every day she's kept that book safe."`,
        item: { icon: "📄", name: "Page 81: “Kafka refuses a bath”" },
        riddle: `<i>"South, to a palace built like a calendar: three hundred and sixty-five windows. Peacocks strut through the park. Herbert is NOT allowed to chase them. Herbert will chase them."</i>`,
        hint: "A UNESCO-listed baroque palace in the west of Graz, with peacocks.",
      },
      14: {
        encounter: `A gardener in the palace park. "One of her cats chased a peacock. The peacock won. Then a traffic warden gave her a ticket for parking the book cart on the lawn. She said she'd go and contest it."`,
        item: { icon: "📄", name: "Page 92: “The Peacock War”" },
        riddle: `<i>"Crime fiction! South of here sits the province's police headquarters, below a forested hill that shares its name with the Mount of Olives. A motorway tunnel runs deep underneath. The tram line ends at its edge."</i>`,
        hint: "The Ölberg, the Plabutschtunnel, and the tram's western terminus.",
      },
      15: {
        encounter: `A tired police officer. "She contested a parking ticket for a book cart. Then she sold my colleague a crime novel and told him who the murderer is. He's very upset. She went south, said she needs a glass of wine and a castle."`,
        item: { icon: "📄", name: "Page 104: “The butler did it”" },
        riddle: `<i>"Reading in a castle! Further south, a castle has been a school for grown-ups for over a hundred years. There's a little hilltop church called 'Mary in Misery', a lake to swim in, and vineyards — one of only two wine areas inside Graz."</i>`,
        hint: "Schloss St. Martin, the Naturbad, the Kehlberg vineyards.",
      },
      16: {
        encounter: `The bartender, polishing a glass. "She drank half a glass of wine and wrote in a notebook for an hour. Then she said every last chapter deserves a beer, and asked where the beer comes from."`,
        item: { icon: "📄", name: "Page 117: “Herbert, sommelier”" },
        riddle: `<i>"East of here, where the city's beer is brewed — a family name that became a brewery, and now a whole new quarter of town. I'll be at the pool table. Herbert cheats at billiards."</i>`,
        hint: "The brewery that gives Graz its beer — and its name to the 17th district.",
      },
      17: {
        encounter: `A guy chalking his cue. "The book lady won four games of pool. One of her cats sat on the table and nudged my balls into the wrong pockets. Then she said she needs dictionaries for the last chapter — and a falafel."`,
        item: { icon: "📄", name: "Page 128: “Herbert cheats at billiards”" },
        riddle: `<i>"North, to the district named after the gravel and sand the river left behind. A big square, many languages, strong coffee and kebab until late — I sell dictionaries there. The long wall with barbed wire? That library has very long loan periods."</i>`,
        hint: "The district's name is old German for coarse sand. The square has the same name.",
      },
      5: {
        encounter: `A kebab chef laughs. "She traded me a dictionary for a falafel. Herbert got the meat. Then she wrote a note and said: 'She's always a little late. This time, I'll wait.'"`,
        item: { icon: "📄", name: "Page 139: “The last chapter (unfinished)”" },
        riddle: `<i>"The last chapter ends just north of here, where a strange blue creature with nozzles landed on the riverbank and turned into an art museum, next to a market square where poets drink at night. I'm waiting. For real this time."</i>`,
        hint: "A bubble-shaped art museum on the west bank of the Mur — the 'Friendly Alien'. The district next to Gries.",
      },
      4: {
        encounter: `Seventeen districts, seventeen drinks — and for once, you're not late.

Ottilie is sitting on a beer crate. Herbert is asleep on top of the cart. She hands you a heavy, slightly dusty book: <b>The Library of Herbert and Kafka</b>.

<i>"I was never going to sell it to just anyone. Only to someone who'd chase it across a whole city with her friends. Happy adventure day, Sara. Look after it. Herbert the Gracious approves. Kafka the Schlimm does not, but that is normal."</i>

Your crew has a drink for you. Prost! 🎉`,
        item: { icon: "📕", name: "The Library of Herbert and Kafka" },
      },
    },
  },
};

// ─────────────────────── SARA'S BOOKBAZAAR (shop) ───────────────────────
// At every Sara stop with a riddle she lands on a fake marketplace. One listing
// is Ottilie's real page (its blurb quotes what the locals just told her);
// the rest are dark-romance decoys. Buying the real one unlocks the riddle,
// buying a decoy costs penalty sips (1, 2, 3 …) and goes into her "haul".
// Each stop shows 4 offers: the real one + 3 decoys taken from DECOYS.
// Spice is 1–5 🌶️. Titles are parodies, keep them PG-13.
const SARA_SHOP = {
  name: "Bookbazaar",
  tip: "Ottilie hides her pages inside other books. Exactly one blurb knows what the local just told you.",
  decoys: [
    { t: "Bound to the Baron", a: "L. Nightshade", d: "He owns the castle. And the contract. And, unfortunately, your attention.", s: 4, p: "€9.99" },
    { t: "Ruthless Kings & Velvet Crows", a: "V. Ravenscroft", d: "A crown, a cage, a very long staircase.", s: 3, p: "€11.49" },
    { t: "The Mafia Boss's Midnight Debt", a: "Dante Moretti-Black", d: "You owe him one favour. He wants it at 3 a.m.", s: 5, p: "€8.99" },
    { t: "Wicked Little Vows", a: "S. Thornfield", d: "Till death do us part. He's not joking.", s: 4, p: "€10.99" },
    { t: "Kiss of the Vampire Accountant", a: "Count A. Bilanz", d: "He drains your tax return. And your will to resist.", s: 3, p: "€7.99" },
    { t: "Captive of the Highland Duke", a: "M. McDarkly", d: "Rain, whisky, brooding. Mostly brooding.", s: 4, p: "€9.49" },
    { t: "Fifty Shades of Herbert", a: "E. L. Pfote", d: "A cat. A cushion. A very controlling nap schedule.", s: 2, p: "€6.66" },
    { t: "Hunted by the Hockey Villain", a: "Brooke Blackice", d: "Enemies on the rink, something worse in the penalty box.", s: 5, p: "€12.00" },
    { t: "Sinful Heirs of Schloss Schwarz", a: "G. von Verderben", d: "Eight siblings, one will, zero boundaries.", s: 4, p: "€10.49" },
    { t: "His Dark Obsession, Vol. 7", a: "N. Crimson", d: "Volumes 1–6 sold out. He's still obsessed.", s: 5, p: "€13.99" },
    { t: "Thorns, Crowns & Bad Decisions", a: "R. Hex", d: "Never trust a prince with a hedge trimmer.", s: 3, p: "€9.99" },
    { t: "The Devil Wears a Dirndl", a: "A. Teufel", d: "Fresh from the Almabtrieb. Seductive. Mostly sheep.", s: 3, p: "€8.49" },
    { t: "Forbidden by the Fallen Angel", a: "Seraphina Blackwing", d: "Heaven's loss, your bedtime reading.", s: 4, p: "€10.99" },
    { t: "Ruined by the Ruthless CEO", a: "K. Steelman", d: "He bought your company. Then your Sundays.", s: 4, p: "€11.99" },
    { t: "Claimed in the Catacombs", a: "Morgana Dusk", d: "Cold stone, warm candles, an unfortunate clause in the lease.", s: 5, p: "€9.99" },
    { t: "Dark Heart of the Dragon Dentist", a: "F. Zahn", d: "He breathes fire. And pulls teeth. Open wide.", s: 2, p: "€7.49" },
    { t: "Wedded to the Warlord", a: "Ilse Ironhand", d: "An arranged marriage, a very arranged castle.", s: 4, p: "€10.00" },
    { t: "Tangled in His Shadows", a: "J. Umbra", d: "He has no reflection. You have no excuse.", s: 3, p: "€8.99" },
    { t: "The Stalker Next Door, Season 2", a: "P. Spähmann", d: "He moved in. You moved on. He's coming.", s: 4, p: "€9.29" },
    { t: "Beauty and the Bastard", a: "Belle Grimm", d: "Fairy tales were never this rude.", s: 3, p: "€8.99" },
    { t: "Vengeance in Velvet", a: "Carmilla Reiter", d: "A masquerade. A dagger. Sensible shoes not included.", s: 4, p: "€11.49" },
    { t: "Blood, Bourbon & Bad Boys", a: "Tex Dark", d: "Nothing good happens after the third bourbon.", s: 4, p: "€9.99" },
    { t: "The Professor's Forbidden Footnotes", a: "Dr. E. Fußnote", d: "Office hours. After hours. Peer-reviewed passion.", s: 3, p: "€12.49" },
    { t: "Owned by the Outlaw", a: "Wylie Black", d: "Wanted: dead or alive. Preferably his.", s: 4, p: "€8.49" },
    { t: "Sold to the Shadow Sheikh", a: "N. Dunkelmann", d: "An auction, a desert, a laminated contract.", s: 5, p: "€10.99" },
    { t: "Obsessed with the Ex-Priest", a: "Magdalena Sünde", d: "Forgive me, Father, for the following 400 pages.", s: 4, p: "€9.49" },
    { t: "The Gravedigger's Reluctant Bride", a: "O. Moor", d: "Till death us do part. Again. For the third time.", s: 3, p: "€7.99" },
    { t: "Midnight Pact with the Mountain Lord", a: "A. Gipfel", d: "Cold peaks, hot temper, no mobile reception.", s: 4, p: "€9.99" },
    { t: "Possessive Pirates of the Mur", a: "Captain H. Schwarzbart", d: "The Mur has pirates. Nobody asked how.", s: 3, p: "€8.99" },
    { t: "Dangerous Liaisons at the Grazer Opernball", a: "Gräfin Dahlia Dunkel", d: "Waltz now. Regret later. Dress code: ruin.", s: 4, p: "€10.99" },
  ],
  // Passages (shown when a decoy is delivered) by decoy index; a decoy without a passage is "sold out".
  passages: {
  "0": "“You will marry me,” said the Baron, buttering his toast with menace. “I have a form in the drawer that says you already did.” Her eye twitched. It was the third time this week.",
  "2": "Dante cracked his knuckles, then his espresso cup. “You owe me,” he whispered. “Three euros and a favour.” She paid the euros. The favour is still pending. The pigeons know.",
  "3": "“Till death do us part,” the priest read. “Which is Thursday,” the groom added darkly. The guests clapped politely, because they had RSVP'd.",
  "5": "The Duke stared into the rain for forty pages. Forty. She counted. “Is it going to stop?” she asked. “Never,” he growled. It was Scotland.",
  "7": "He hip-checked her into the boards, and into his heart. “You play dirty,” she gasped. “I play Tuesdays,” he said, and sharpened his skates menacingly.",
  "8": "Eight siblings. One will. “It's mine,” hissed Ludovika. “I wrote my name on the fridge,” hissed Konrad. The butler poured something that was definitely not tea.",
  "10": "The prince handed her a rose. It had thorns. The thorns had thorns. “It's a metaphor,” he said, bleeding quietly on the carpet.",
  "11": "She yodelled at the full moon. Something howled back. “Is that a werewolf?” “That's my husband,” she sighed. “He's seen the dirndl bill.”",
  "12": "He fell from heaven, landed in her hedge and asked for tea. “Are you evil?” she asked. “Mostly I'm early,” said the angel.",
  "14": "Candles flickered. Skulls stared. “This is our first date,” he murmured, “and it's already the third circle of the cellar.” She checked her phone. No reception, obviously.",
  "15": "“Open wide,” breathed the dragon, a tiny mirror in his claw. Smoke curled from his nostrils. “This may cause mild scorching.” She nodded bravely. She had lost her insurance card.",
  "17": "His shadow kissed her hand. He did not. “That's rude,” she told the shadow. The shadow shrugged. The man looked embarrassed and slightly overdrawn.",
  "18": "She moved to a new city. He moved in next door. She moved in with her mother. He moved in with her mother's neighbour. By season two the neighbours had formed a union.",
  "20": "Behind her mask she smiled. Behind his mask he smiled. Behind the curtain a third person smiled and held a very small knife. Nobody had read the dress code.",
  "21": "“One more bourbon,” he growled. “That's your fourth,” she said. “And my fifth bad decision,” he agreed, and the jukebox played something sad in a minor key.",
  "23": "“Wanted: dead or alive,” the sheriff read. “Preferably available on weekends.” The outlaw tipped his hat at the sunset, then at her, then at his horse, who rolled his eyes.",
  "24": "He pressed a laminated contract into her hands. “Clause four is binding.” “Clause four is a recipe for hummus,” she said. He had not read clause four.",
  "26": "The gravedigger proposed beside a freshly dug hole. “I'm always buried in work,” he said. She said yes, mostly to avoid falling in.",
  "27": "No reception. No wifi. No mercy. “Here,” growled the Mountain Lord, “we communicate by yodel.” She yodelled. A glacier calved in shame.",
  "29": "They waltzed. They scowled. They waltzed again, scowling. By the third waltz the string quartet was openly rooting for a duel."
},
  // Sold-out notices (a decoy without passage, and the other stops' pages, get one of these).
  soldOut: [
  "Sold out. Somebody with a candlelit bathtub got there first.",
  "Unfortunately sold out. The last copy is currently being read aloud, dramatically, in a castle.",
  "Sorry, sold out. The author is “revising the ending” (killing off the Baron again).",
  "Out of stock. The warehouse cat sat on the last copy and refuses to move.",
  "Sold out! Apparently half of Graz is reading it in secret on the tram.",
  "Temporarily unavailable: confiscated by a very flustered librarian."
],
  // The real listing per district. It is disguised: same format as the decoys, no seller/badge/cover giveaway.
  // Its blurb only echoes what the local just said (the stop's encounter). The shop also shows ONE real listing of
  // another stop as a decoy (always "sold out"), so matching the blurb to *this* encounter is the puzzle.
  real: {
  "1": {
    "t": "Crumbs & Consequences",
    "a": "Brioche Blackwood",
    "d": "She paid for her coffee in paper. He soon learned that some debts can't be settled with bookmarks.",
    "s": 3,
    "p": "€9.49"
  },
  "6": {
    "t": "Last Tram to Ruin",
    "a": "Mara Schiene",
    "d": "He already knew every street. She sold him a map anyway. Some men have to get lost to be found.",
    "s": 2,
    "p": "€8.99"
  },
  "7": {
    "t": "Two Copies, One Broken Heart",
    "a": "Puck Valentine",
    "d": "He bought the same advice twice and still said the wrong thing. Frozen out. Mostly hopeless.",
    "s": 3,
    "p": "€10.99"
  },
  "8": {
    "t": "Dead Air, Hot Mic",
    "a": "Sloane Frequenz",
    "d": "Four minutes live on air and not one word. The ratings were incredible. Someone, somewhere, was purring.",
    "s": 2,
    "p": "€9.99"
  },
  "9": {
    "t": "Written in the Stars (and Signed in Blood)",
    "a": "Celeste Orion",
    "d": "His sign explains everything: stubborn, sensual, asleep by eight. The stars warned her. She did not listen.",
    "s": 3,
    "p": "€11.49"
  },
  "2": {
    "t": "A Song for a Sonnet",
    "a": "Lyra Dunkel",
    "d": "He paid in poetry. She asked for a melody. Neither could carry a tune, but both could carry a grudge.",
    "s": 2,
    "p": "€8.49"
  },
  "10": {
    "t": "Uphill Both Ways",
    "a": "Hartmut Steil",
    "d": "Her cargo was heavy, her will heavier. She passed him on the hill without a word and he never recovered.",
    "s": 3,
    "p": "€9.29"
  },
  "3": {
    "t": "Overdue for a Miracle",
    "a": "Prudence Mahnung",
    "d": "Forty-one years late. The fine was settled in tuna vouchers, but the librarian demanded a far steeper price.",
    "s": 4,
    "p": "€10.49"
  },
  "11": {
    "t": "Candlelit Sins",
    "a": "Magdalena Wachs",
    "d": "Three candles fell. Three vows broke. The sacristan swept up the ashes and swore he had seen nothing.",
    "s": 4,
    "p": "€9.99"
  },
  "12": {
    "t": "The Hound and the Hiss",
    "a": "Fenrir Bellmann",
    "d": "Her dog cried. His pride cried louder. Nothing apologises like a bedtime story.",
    "s": 2,
    "p": "€8.99"
  },
  "13": {
    "t": "Ghost Stories for Greedy Lovers",
    "a": "Ophelia Moor",
    "d": "She sold him a ghost and a snack. The ghost stayed. The snack didn't.",
    "s": 3,
    "p": "€10.00"
  },
  "14": {
    "t": "Parking Violations of the Heart",
    "a": "Winnie Strafzettel",
    "d": "He fought a bird and lost. He fought a ticket and lost harder. Love, at least, was free.",
    "s": 2,
    "p": "€9.49"
  },
  "15": {
    "t": "Whodunit? Him.",
    "a": "Dolores Spoiler",
    "d": "She named the murderer on page one. He arrested the wrong man out of pure spite.",
    "s": 3,
    "p": "€10.99"
  },
  "16": {
    "t": "Half a Glass of Obsession",
    "a": "Vino Veritas",
    "d": "One hour, one notebook, half a glass. She wrote his name on every page and never finished the wine.",
    "s": 4,
    "p": "€11.99"
  },
  "17": {
    "t": "Wrong Pockets",
    "a": "Carom Cue",
    "d": "Four games, four wins. Every ball ended up in the wrong pocket and every pocket in the wrong hands.",
    "s": 3,
    "p": "€9.79"
  },
  "5": {
    "t": "Dictionary of Desire",
    "a": "Falaf Bell",
    "d": "Fair trade: one dictionary, one falafel. He kept the meat. She kept him waiting.",
    "s": 3,
    "p": "€9.19"
  }
},
};

// ─────────────────────── SARA'S CHALLENGES ───────────────────────
// Same engine as Sarah's (see CHALLENGES above), but the reward is bookmarks (🔖, stored in `hearts`).
//   event        – "📖 Reading room", before the shop (+2 🔖)
//   intermission – "⚡ Sudden plot twist", pops up on arrival, before everything else (+1 🔖)
// Optional extras on a challenge: fieldLabel (write), noteLabel (notes), clockSub (timer), doneLabel (timer).
Object.assign(CHALLENGES, {
  s_catquiz: {
    type: "quiz", icon: "🐈", reward: 2,
    title: "Herbert's pop quiz",
    story: "Herbert only sits on the laps of well-read people. Three questions — get all three right and Ottilie's cart will open for you.",
    questions: [
      { q: "In Kafka's famous story “The Metamorphosis”, Gregor Samsa wakes up as a giant…", options: ["Cat", "Insect", "Teapot", "Librarian"], answer: 1 },
      { q: "The musical “Cats” is based on poems by…", options: ["Edgar Allan Poe", "Roald Dahl", "T. S. Eliot", "Dr. Seuss"], answer: 2 },
      { q: "In “Alice in Wonderland”, which cat slowly vanishes until only its grin is left?", options: ["Cheshire Cat", "Siamese Cat", "Persian Cat", "Bengal Cat"], answer: 0 },
    ],
  },
  s_reading: {
    type: "confirm", icon: "🎭", reward: 2,
    title: "Dramatic reading",
    story: "Ottilie needs a voice for her audiobook. Read one of these passages to the person behind the counter — lowest, most smouldering voice you own. Full commitment. Whoever giggles first drinks a sip. Don't like the passage? Get another one.",
    lines: [
      "You think you can run from me, Eleanor? The castle has three hundred doors. I own all of them.",
      "I should hate you. I do hate you. Pass me that wine.",
      "Your lips said no. Your eyebrows said 'continue'.",
      "He looked at her the way a lion looks at a very small, very expensive handbag.",
      "Tonight, the contract is void. Tonight, I am merely a man… with a very large library.",
      "Do not speak of my brooding. I brood in private, like a gentleman.",
    ],
    confirmLabel: "✅ Read with feeling — the group says it counts",
  },
  s_blurb: {
    type: "write", icon: "✍️", reward: 2, seconds: 90,
    title: "Back cover blurb",
    story: "Every great book needs a blurb. Hand the phone to your crew: 90 seconds to write the back cover of “Sara: A Life”. It gets printed in your finale.",
    fieldLabel: "Back cover of “Sara: A Life”",
    placeholder: "Sara — a woman who … Critics say …",
    confirmLabel: "💾 Print the blurb",
  },
  s_titles: {
    type: "confirm", icon: "📚", reward: 2,
    title: "Title this bar",
    story: "Everybody at the table invents a dark-romance title for tonight's bar — “The Duke of ___”, “Claimed in the ___”. The group votes for the best one. The author of the worst drinks a sip.",
    confirmLabel: "✅ We have a winner",
  },
  s_reviews: {
    type: "notes", icon: "⭐", reward: 2, count: 3,
    title: "Five-star reviews",
    story: "A book without reviews doesn't sell. Three people from your crew each write a five-star Bookbazaar review of Sara. Pass the phone around.",
    noteLabel: "Review",
    placeholder: "★★★★★ “Sara is …”",
    confirmLabel: "⭐ Publish the reviews",
  },
  s_toast: {
    type: "confirm", icon: "🥂", reward: 2, countdown: true,
    title: "Chapter toast",
    story: "Everyone names the last book that made them cry, laugh or fall asleep. Then a toast to Sara — the whole bar can count down with you.",
    confirmLabel: "✅ Prost! The group saw it",
  },
  s_story: {
    type: "confirm", icon: "🧵", reward: 1,
    title: "Plot twist: one word each",
    story: "Build a story around the table, one word at a time, starting with “Once upon a…”. It ends when somebody says “THE END” — or when it turns into a dark romance. Whoever breaks the chain takes a sip.",
    confirmLabel: "✅ The story has an ending",
  },
  s_nap: {
    type: "timer", icon: "😴", reward: 1, seconds: 45,
    title: "Herbert's nap",
    story: "Herbert sleeps 19 hours a day. For 45 seconds the whole table freezes like a sleeping cat. Anyone who moves, laughs or speaks drinks one sip.",
    clockSub: "Shhh. Herbert is dreaming about tuna.",
    doneLabel: "Herbert woke up — collect your bookmarks",
  },
  s_silence: {
    type: "timer", icon: "🤫", reward: 1, seconds: 60,
    title: "Silence in the library",
    story: "The librarian has spoken. One minute: no talking, no phone. Order your next drink by miming it. Whoever speaks drinks a sip.",
    clockSub: "Shhh. This is a library.",
    doneLabel: "Library's open — collect your bookmarks",
  },
  s_swap: {
    type: "confirm", icon: "🔖", reward: 1,
    title: "Book swap",
    story: "Everybody recommends one book to the person on their left and has to sell it in a single sentence. Sara's pick must be something she will actually read this year.",
    confirmLabel: "✅ Everyone recommended something",
  },
  s_firstlines: {
    type: "quiz", icon: "📖", reward: 2,
    title: "Name that first line",
    story: "Ottilie's cart has a trivia board: three famous opening lines, one book each. Get all three right.",
    questions: [
      { q: "“It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.”", options: ["Emma", "Pride and Prejudice", "Jane Eyre", "Wuthering Heights"], answer: 1 },
      { q: "“It was a bright cold day in April, and the clocks were striking thirteen.”", options: ["Brave New World", "Fahrenheit 451", "1984", "The Handmaid's Tale"], answer: 2 },
      { q: "“All children, except one, grow up.”", options: ["Matilda", "Peter Pan", "Alice in Wonderland", "Pinocchio"], answer: 1 },
    ],
  },
  s_poetry: {
    type: "confirm", icon: "📜", reward: 2,
    title: "Menu poetry",
    story: "No bookshelf to make spine poetry with — so use the drink menu. Everyone writes a two-line poem using only words from the menu or the beer mats. The best one gets read aloud to the table, in a dramatic voice.",
    confirmLabel: "✅ The poem has been read",
  },
  s_impression: {
    type: "confirm", icon: "🐱", reward: 1,
    title: "Herbert impression",
    story: "Everyone does a ten-second impression of Herbert: slow stretch, ignoring a human, staring at nothing. The group crowns the best Herbert. Everyone else takes a sip.",
    confirmLabel: "✅ A winning Herbert has been crowned",
  },
});
// Where they appear on Sara's route (district id → challenge key).
// Sarah and Sara play at the same time, so nothing of Sara's lands on a stop where Sarah has an
// intermission, and Sara's intermissions avoid Sarah's events too (check the ROUTE order in README.md).
// Stop I (Innere Stadt) is only the introduction: no challenges for either girl there, they start from the 2nd district.
const SARA_EVENTS = { 9: "s_catquiz", 2: "s_reading", 3: "s_firstlines", 8: "s_poetry", 11: "s_blurb", 13: "s_titles", 15: "s_reviews", 16: "s_toast" };
const SARA_INTERMISSIONS = { 6: "s_impression", 8: "s_story", 3: "s_nap", 14: "s_silence", 5: "s_swap" };
Object.entries(SARA_EVENTS).forEach(([d, k]) => { STORIES.sara.stops[d].event = k; });
Object.entries(SARA_INTERMISSIONS).forEach(([d, k]) => { STORIES.sara.stops[d].intermission = k; });

// ─────────────────────── SHARED MISSIONS (both girls) ───────────────────────
// Only sent by the host from admin.html ("Both" tab), never attached to a stop. Theme-neutral wording because the
// same text shows up on Sarah's and on Sara's phone; both do it at the same time, together.
Object.assign(CHALLENGES, {
  d_toast: {
    type: "confirm", icon: "🥂", reward: 2, shared: true,
    title: "Adventure clink",
    story: "Find each other, wherever you are in the bar. Clink glasses, look each other in the eye and say one genuinely nice thing about the other. No jokes. The crew judges.",
    confirmLabel: "✅ Clinked — the crew heard it",
  },
  d_selfie: {
    type: "confirm", icon: "🤳", reward: 2, shared: true,
    title: "Twin selfie",
    story: "Take a selfie of the two of you in the exact same pose, with the most dramatic faces you can pull. A third person from the crew has to approve it.",
    confirmLabel: "✅ Selfie approved",
  },
  d_swap: {
    type: "confirm", icon: "🔄", reward: 1, shared: true,
    title: "Drink swap",
    story: "Swap drinks. Each of you takes a proper sip of the other's glass and has to guess what's in it. Wrong guess: another sip of your own.",
    confirmLabel: "✅ Swapped and guessed",
  },
  d_compliments: {
    type: "timer", icon: "💬", reward: 2, seconds: 45, shared: true,
    title: "Compliment battle",
    story: "Take turns giving each other compliments, no repeats, no hesitation, for 45 seconds. Whoever gets stuck first drinks a sip.",
    clockSub: "Keep talking. Nice things only.",
    doneLabel: "Battle over — collect your reward",
  },
  d_dance: {
    type: "timer", icon: "💃", reward: 2, seconds: 30, shared: true,
    title: "Dance-off",
    story: "Thirty seconds, the two of you, full commitment, in the middle of the bar. The crew films it. Standing still counts as losing.",
    clockSub: "Dance. Now.",
    doneLabel: "Last move — collect your reward",
  },
  d_stare: {
    type: "confirm", icon: "👀", reward: 1, shared: true,
    title: "Staring contest",
    story: "Eye to eye, no blinking, no laughing. The first one to break takes a sip. A third person is the referee.",
    confirmLabel: "✅ We have a loser",
  },
  d_rps: {
    type: "confirm", icon: "✊", reward: 1, shared: true,
    title: "Rock, paper, scissors",
    story: "Best of three. The loser takes a sip and tells the winner one thing they are proud of this year.",
    confirmLabel: "✅ Winner decided",
  },
  d_wish: {
    type: "confirm", icon: "🌠", reward: 2, shared: true,
    title: "Adventure wishes",
    story: "Each of you makes one wish for the other's next year, out loud, in front of the whole crew. Then a drink to both wishes.",
    confirmLabel: "✅ Wishes made, drinks raised",
  },
});

// ─────────────────────── LOBBY + FIRST CLUE ───────────────────────
// Before the host presses "Start game" (admin.html) a phone that picked a name only shows "Under construction".
// These lines rotate on that screen.
const LOBBY_LINES = [
  "Our developers are still drinking. We mean: building. Hard.",
  "A very tired hamster is wiring this app together. He asked for five more minutes.",
  "Please do not touch anything. The paint is still wet. So is the beer.",
  "404 — Fun not found yet. Arriving at the speed of a Graz tram.",
  "Loading the pub crawl… 3% (the other 97% is in the fridge).",
  "The host is polishing the surprises. Please stand by and look busy.",
];

// When the game starts each girl reads her story plus this little clue to the first meeting point
// (Auer, Schmidtgasse, I Innere Stadt). Pressing "Start the quest" there begins stop I.
const FIRST_HINT = "It's the café-bar Auer in the Schmidtgasse, in the Innere Stadt (the old town). Open it in Maps.";
STORIES.sarah.firstClue = {
  label: "New message · Jakob “Iceman” Eisner",
  text: `<i>"You're late. I'm on my first drink in the old town, in the blacksmiths' lane near the main square with the town hall. The bar is named after a meadow. Find me."</i>`,
  hint: FIRST_HINT,
};
STORIES.sara.firstClue = {
  label: "A note from O.P.",
  text: `<i>"Chapter One is baked, not written. Find the old town's blacksmith lane, near the main square with the town hall. A bakery-bar named after the meadow. Your first page is waiting."</i>`,
  hint: FIRST_HINT,
};

// ─────────────────────── SARAH: pass timeout + chat with the match ───────────────────────
// For every teammate: `pass` = funny lines for the 10-second timeout after she swipes left (1st / 2nd / 3rd pass, then they
// repeat); `hi`, `ask`, `reveal` = what he texts in the Tinder-style chat before she gets the riddle. Whatever she
// answers, he carries on with `reveal` and then the profile's `bio` (what he heard about Jakob), then the riddle.
const SARAH_FLIRT = {
  "1": {
    "pass": [
      "Beggars can't be choosers, Sarah. Matze is the only guy who showed up before ten. 🥂",
      "Swipe left again and Matze finishes your Spritzer too. Ten seconds to reflect.",
      "Matze is crying into his Spritzer. At nine in the morning. Look what you've done."
    ],
    "hi": "hey 👋 sorry, small Spritzer situation over here",
    "ask": "so… are you looking for the ice hockey guy? 🏒",
    "reveal": "doesn't matter actually. here's what I know:"
  },
  "6": {
    "pass": [
      "He spent forty minutes on that hair. Ten seconds of respect is the least you can give it.",
      "Rookie mistake, Sarah. Elias has potential and an excellent conditioner.",
      "Elias is checking his reflection in the penalty box glass. Sad hair noises."
    ],
    "hi": "heyyy 😎 omg is this the Icebreaker? I'm new here lol",
    "ask": "wait are you the girl looking for Jakob?? 👀",
    "reveal": "oh it doesn't matter!! anyway, here's what I saw:"
  },
  "7": {
    "pass": [
      "Tomasz saves everything. Except, apparently, your attention. Ten seconds.",
      "Saves > feelings. That one still stung a little.",
      "The Wall has been breached. Please wait while he rebuilds."
    ],
    "hi": "Hi.",
    "ask": "You're looking for the hockey guy. Jakob.",
    "reveal": "Doesn't matter. I stop pucks, not conversations. Here's what happened:"
  },
  "8": {
    "pass": [
      "Felix has a radio voice and nobody to use it on. Ten seconds of dead air.",
      "He's rehearsing a heartbreak jingle. Please hold the line.",
      "This is Felix, live from the penalty box, and he is disappointed."
    ],
    "hi": "Hey hey, Felix here. Voice of the people. 🎙️",
    "ask": "Quick question, live on air: are you after the hockey guy?",
    "reveal": "doesn't matter, you're on air either way. here's the story:"
  },
  "10": {
    "pass": [
      "Captains don't get rejected. Captains get a ten-second timeout. Reflect.",
      "Marcus has seen things. He did not see this coming.",
      "The captain is writing “left-swiped by Sarah” on the whiteboard."
    ],
    "hi": "Evening. Captain Marcus. Very approachable, I promise.",
    "ask": "Let me guess. You're looking for the ice hockey guy.",
    "reveal": "doesn't matter, I look after my guys and my matches. here's what the boys told me:"
  },
  "3": {
    "pass": [
      "Luca has fresh stitches and now a fresh heartbreak. You monster.",
      "Careful, Sarah. He can't smile yet, but he's trying to cry.",
      "Ten seconds to think about the face you just rejected. It has stitches."
    ],
    "hi": "hey 🙂 (can't smile properly, stitches, sorry)",
    "ask": "so you're after the hockey guy, right? ow, don't make me laugh",
    "reveal": "doesn't matter, it hurts to talk anyway. here's what I know:"
  },
  "12": {
    "pass": [
      "Jonas is now doing sad squats. Drink some water and think about your choices.",
      "Hydrate or cry-drate, Sarah. Jonas chooses both.",
      "He skipped leg day for you and this is what he gets?"
    ],
    "hi": "hey!! 💪 have you had water today? asking for a friend (me)",
    "ask": "ok but real question: you're hunting the ice hockey guy, right? 🏒",
    "reveal": "doesn't matter, stay hydrated. here's what I know:"
  },
  "14": {
    "pass": [
      "Nico filmed that rejection. In slow motion. It is already in the team chat.",
      "He's cropping you out of the group photo. Ten seconds.",
      "Nico: “I will remember this in 4K.”"
    ],
    "hi": "hey 📸 don't move, great light. btw did you see the ex-#99 crying on Insta? so cringe 😬",
    "ask": "so are you the one chasing the hockey guy? asking for the caption",
    "reveal": "doesn't matter, I got it all on camera anyway. here's what I filmed:"
  },
  "17": {
    "pass": [
      "Samuel is chalking his cue and his feelings. Ten seconds.",
      "Hat-trick hero, one-swipe loser. Think about that.",
      "Samuel scratched on the eight ball. Out of heartbreak. Totally."
    ],
    "hi": "yo 🎱 wanna rack up? first game's on me",
    "ask": "so you're hunting the ice hockey guy, huh? 😏",
    "reveal": "doesn't matter, I never lose. well, to you maybe. here's what I know:"
  },
  "5": {
    "pass": [
      "Dragan has been hit in the face a lot, but never rejected. Ten seconds. Look him in the eye.",
      "Soft heart, missing tooth, and now this.",
      "Dragan is eating a kebab to cope. It's not helping."
    ],
    "hi": "hello beautiful lady 🥙 sorry, I am in the middle of kebab",
    "ask": "you are looking for my friend the hockey guy, yes?",
    "reveal": "doesn't matter, you listen to Dragan now, I tell you everything:"
  }
};
Object.entries(SARAH_FLIRT).forEach(([d, f]) => {
  const p = STORIES.sarah.stops[d].profile;
  p.passLines = f.pass;
  p.chat = { hi: f.hi, ask: f.ask, reveal: f.reveal };
});

// ─────────────────────── SARAH: red flags in the chat ───────────────────────
// Two red flags per guy, sent after her first answer and before he asks about the ice hockey guy. Made to be read out loud.
const SARAH_FLAGS = {
  "1": [
    "fun fact: I've never lost an argument. I just leave and order another Spritzer.",
    "also my ex and I are “just friends”. she has a key to my flat. and to my dog."
  ],
  "6": [
    "I take fourteen selfies before every first date and pick the one where I look like I didn't try.",
    "my mum helps me write my texts. she says hi."
  ],
  "7": [
    "I don't really do feelings. I do saves.",
    "I once ghosted a girl for four months because the playoffs started. we weren't even dating."
  ],
  "8": [
    "I narrate my own life out loud. you will hear it. in the shower too.",
    "I recorded our first date for content. you're in the podcast now."
  ],
  "10": [
    "I'm the captain of everything. also of this conversation.",
    "my last relationship ended in a performance review. she scored 6 out of 10. she was upset."
  ],
  "3": [
    "I'm not saying I'm accident-prone, but my ex calls me “a lot of paperwork”.",
    "I'll tell you the stitches story on every date. in detail. with diagrams."
  ],
  "12": [
    "I only eat things I can count. you'll be counted too.",
    "I have a protein shake schedule and a cheat day. you are not invited to the cheat day."
  ],
  "14": [
    "I photograph everything. food, sunsets, you crying. especially you crying.",
    "I'm not like other guys. I own a ring light and I'm not afraid to use it."
  ],
  "17": [
    "I never lose. I just let people win. that's what I tell myself.",
    "I once bet my car on a pool game. my cousin drives it now."
  ],
  "5": [
    "my love language is kebab. ten, maybe twenty kebabs. is that too much?",
    "my mother does not like any girl. she sits in the front. always."
  ]
};
Object.entries(SARAH_FLAGS).forEach(([d, f]) => { STORIES.sarah.stops[d].profile.chat.flags = f; });
