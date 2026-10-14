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

// After this many wrong guesses the hint button lights up,
// after GIVE_UP_AFTER wrong guesses the "just tell us" button appears.
const HINT_AFTER = 1;
const GIVE_UP_AFTER = 3;

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
    tagline: "He's tall. He's on skates. He's always one bar ahead.",
    theme: "ice",
    narrator: "Overheard",
    clueLabel: "The clue",
    intro: `Word on the street: <b>Jakob "Iceman" Eisner</b> — defenceman, number 99, the most eligible man in Graz who owns a mouthguard — is out on the town today, from breakfast until whenever.

He never stays anywhere long. But he talks. Teammates, bartenders, a cello student, a police officer: everyone saw him leave, and everyone has an opinion about where he went.

It's your birthday, Sarah. Today you find him.`,
    stops: {
      1: {
        encounter: `His linemate <b>Matze (#14)</b> is still at the table, finishing a Spritzer at nine in the morning. "Jakob? Just left. We sat here and he kept staring at the clock tower — said the hands are the wrong way round, big hand for the hours. 'Just like our coach,' he said. 'Everything backwards.'"`,
        item: { icon: "🧾", name: "A receipt, signed #99" },
        riddle: `"He's meeting the rookie south of here, at the big square where every tram line in Graz meets — like players at a face-off. It's named after a merchant who built himself a whole neighbourhood. There's a riverside park nearby with 'Au' in its name."`,
        hint: "The city's main tram hub, plus the Augarten park.",
      },
      6: {
        encounter: `<b>Elias (#22)</b>, the rookie with the hockey hair, waves you over. "Jakob found me at the tram stop, bought me a Leberkässemmel and checked his watch. Warm-up! He completely forgot. He ran for the tram like it owed him money."`,
        item: { icon: "🥖", name: "Half a Leberkässemmel" },
        riddle: `"Home ice. South-east, where a 'lovely meadow' used to be: the ice stadium right next to the football stadium, whose forecourt is named after a legendary coach. There's a shopping mall where the trams turn around, and down the road a factory builds those boxy G-Class off-roaders."`,
        hint: "Graz's ice hockey arena, next to the Merkur Arena and the Murpark mall.",
      },
      7: {
        encounter: `Goalie <b>Tomasz "The Wall" (#31)</b> is still in his pads. "Jakob scored on me in warm-up. First time all year. He didn't even celebrate — showered in forty seconds and said 'today's the day.' Then he realised he'd lost his locker key and went to find someone who's good with keys."`,
        item: { icon: "🏒", name: "A broken stick, #99" },
        riddle: `"Who has the most famous set of keys? A fisherman who became a saint and guards the gates of heaven. Go north-east to the old village church named after him. Nearby there's a TV studio shaped like a layer cake, and a tiny forgotten jungle with a giant sequoia in it."`,
        hint: "The saint with the keys. The 'cake' is the ORF Landesstudio, the jungle is the 'Grazer Urwald'.",
      },
      8: {
        encounter: `A sound engineer on a smoke break outside the TV studio. "He did a quick radio interview — found his key in his sock, by the way. Said hi to his mum on air. And said what he misses most is skating on <i>natural</i> ice, like when he was a kid."`,
        item: { icon: "🗝️", name: "A spare locker key" },
        riddle: `"Up north there are two hills side by side — one wears an observatory, the other old villas. Between them, old clay pits used to freeze over in winter, and Graz literally harvested its ice there. Today it's a nature reserve. The district's coat of arms shows a little castle."`,
        hint: "The hills are Ruckerlberg and Lustbühel. The castle in the coat of arms is the Hallerschloss.",
      },
      9: {
        encounter: `An astronomer packing up a telescope. "Your hockey player wanted to know which star is lucky number 99. I made one up. Then he tried to skate on the pond in the nature reserve. In October. Somebody wrote him a ticket. He said he'd go and serve his penalty like a man."`,
        item: { icon: "🔭", name: "Star no. 99 (made up)" },
        riddle: `"Two minutes in the box. He went north-west to serve his time with the saint who looks after prisoners — the one they paint in chains. The saint's church is just east of the old town, and on the street with his name, music students practise until the windows rattle."`,
        hint: "The patron saint of prisoners (and cattle). Church, street and the arts university all carry his name.",
      },
      2: {
        encounter: `A cello student outside the music university. "He asked me to play the goal horn on my cello. I tried. It was awful. He loved it. Then he said he'd had too many Krapfen today and needed cardio. Uphill. He pointed east."`,
        item: { icon: "🎻", name: "Sheet music with a smudged phone number" },
        riddle: `"East, up a ridge road that climbs out of the city. A hundred years ago people raced cars up it, with up to seventy thousand spectators. An old toll house still stands at the bottom. Fun fact: it's the only district in Graz without its own primary school — so nobody up there is checking his homework."`,
        hint: "A district named after a ridge, with two valleys (Stiftingtal and Ragnitz) and a famous uphill road.",
      },
      10: {
        encounter: `A cyclist catching his breath at the top of the hill. "Big guy, number 99, ran past me UPHILL. Then his phone rang — a teammate took a high stick to the face. He turned around and sprinted back down toward town."`,
        item: { icon: "📱", name: "A screenshot of a missed call" },
        riddle: `"Back west, toward town, where the big hospital stitches up players like his teammate. The university's grand main building is there too, and glasshouses where palm trees never see a winter."`,
        hint: "The university district: main campus, botanical garden, the big LKH hospital.",
      },
      3: {
        encounter: `<b>Luca (#4)</b>, the team veteran, is holding a beer to his fresh scar. "Jakob drove me to the clinic and held my hand for every stitch. Then he sat on the steps and said: 'I need a miracle.' And he got on the bus going north-east."`,
        item: { icon: "🩹", name: "A roll of tape: “#99”" },
        riddle: `"Out north-east, a yellow church with two towers sits up on a hill, at the top of a long stairway. Pilgrims climb it looking for comfort. Retired trams live in a museum at the bottom. He's lighting a candle for his love life."`,
        hint: "A pilgrimage basilica on a hill at the end of tram line 1. The district's name literally contains 'comfort'.",
      },
      11: {
        encounter: `The sacristan sighs. "He lit a candle. Then a second one. Then he asked if there's a patron saint of hat-tricks. There isn't. Then he said he needs <i>recovery water</i> — the real stuff, straight from the ground."`,
        item: { icon: "🕯️", name: "Candle no. 99" },
        riddle: `"North-west, over the hills: a clear spring the locals call 'the origin'. The district shares its name with a factory that builds turbines and paper machines for half the planet. It's where the trams run out of track up north."`,
        hint: "A machine factory famous worldwide, a spring called 'Ursprung', the northern end of the tram network.",
      },
      12: {
        encounter: `A guy in factory overalls is filling bottles at the spring too. "Number 99? Signed my hard hat! He drank two litres and said he needs to practise his diving. Goalie-style. Somewhere high."`,
        item: { icon: "🪖", name: "A photo of a signed hard hat" },
        riddle: `"Cross the river to the west. Up on a wooded hill there's a castle that has been a ruin for centuries, and a cliff nearby named after a maiden's desperate leap. He's practising his goalie dive up there. Hopefully not off the cliff."`,
        hint: "A castle ruin north-west of town, next to the 'Jungfernsprung' rock.",
      },
      13: {
        encounter: `The keeper of the hut by the ruin is out of breath. "Your hockey player ran up here, did forty push-ups, looked at the view and said 'Graz, you beautiful thing.' Then he spotted peacocks down south and said he needs to learn how to show off properly."`,
        item: { icon: "🏰", name: "A pebble from the castle wall" },
        riddle: `"South, to a palace built like a calendar: three hundred and sixty-five windows, one for every day of the year. Peacocks strut around the park like they own it. He's studying their technique."`,
        hint: "A UNESCO-listed baroque palace on the west side of town. Watch out for peacocks.",
      },
      14: {
        encounter: `A gardener in the palace park shakes his head. "A peacock stole his puck. A grown man, chasing a peacock across the lawn. He lost. He went to report the theft to the police — I think he was joking. I'm not sure."`,
        item: { icon: "🦚", name: "A peacock feather (stolen back)" },
        riddle: `"South of here: a forested hill that shares its name with the Mount of Olives, with the motorway roaring through a tunnel deep underneath. The province's police headquarters is in this district too. The tram line ends at its edge."`,
        hint: "The hill is the Ölberg; the tunnel is the Plabutschtunnel. Look for the tram's western terminus.",
      },
      15: {
        encounter: `A police officer at the door, very tired. "Mr Eisner reported a puck stolen by a peacock. I filed it under 'wildlife'. He also asked if there's a law against being this nervous. There isn't. He said he needs a glass of wine, and soon."`,
        item: { icon: "🚓", name: "Police report no. 99" },
        riddle: `"Further south: a little church called 'Mary in Misery' sits on a hill above a road the Romans already used. There's a castle that has been a school for grown-ups for over a hundred years, a natural lake to cool off in, and vineyards — one of only two wine areas inside the city."`,
        hint: "Schloss St. Martin, the Naturbad, the Kehlberg vineyards.",
      },
      16: {
        encounter: `The bartender clears a glass. "He drank one glass of wine, very slowly, watching the clock. Then he said wine is for nerves, but beer is for courage — and he wanted it straight from the source."`,
        item: { icon: "🍷", name: "An empty wine glass" },
        riddle: `"East, to where the city's beer is brewed — a family name that turned into a brewery and is now a whole new quarter of town. He's practising his aim there. Billiards counts as hockey, right?"`,
        hint: "The brewery that gives Graz its beer — and its name to the 17th district.",
      },
      17: {
        encounter: `A guy chalking his cue at the pool table. "Hockey guy? He lost three games in a row and didn't care. Kept saying 'tonight's the night.' Then his stomach growled louder than the jukebox and he went to see the enforcer for a late-night kebab."`,
        item: { icon: "🎱", name: "The 9-ball (he dropped it)" },
        riddle: `"North, across the tracks, into the district named after the coarse sand and gravel the Mur dumped on its banks. Find the big square with honest bars and kebab until late. And stay away from the long prison wall — that's one penalty box you don't want."`,
        hint: "The district's name is old German for coarse sand. The square has the same name.",
      },
      5: {
        encounter: `<b>Dragan (#55)</b>, the enforcer, grins with his famous gap. "Jakob ordered a double Dürüm, no onions — 'for the breath.' He has a date. I gave him my best advice: never drop the gloves before the second date. Then he left. He said he'll be waiting at the very end."`,
        item: { icon: "🌯", name: "A napkin: “no onions”" },
        riddle: `"The very end is just north of here: where a strange blue alien with nozzles landed on the riverbank and turned into an art museum, next to a market square where the cool kids drink at night. He's there. Wherever this night ends."`,
        hint: "A blue, bubble-shaped art museum on the west bank of the Mur — the 'Friendly Alien'. The district next to Gries.",
      },
      4: {
        encounter: `You made it. Seventeen districts, seventeen drinks, one very long day.

There's no #99 at the bar. But there's a hockey jersey on your chair, and a note in very messy handwriting:

<i>"Sorry, Sarah. I'm always one bar ahead — that's my problem. But look around: everyone at this table followed you across the whole city today. That's the real team. Happy birthday. Shoot your shot. — J."</i>

Your crew has a drink for you. Prost! 🎂`,
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
    intro: `There is exactly one copy left in the world of <b>"The Library of Herb and Kafk"</b> — the definitive book about cats, out of print since forever.

It belongs to <b>Ottilie Pfotenhauer</b>, a travelling bookseller with a squeaky book cart and a fat grey cat named Herb. She'll sell it to the right person. But she never stays anywhere long, and she leaves notes instead of waiting.

It's your birthday, Sara. Today you get that book. You just have to be on time for once.`,
    stops: {
      1: {
        encounter: `The woman behind the bakery counter points at the door. "The old lady with the book cart and the fat cat? Sold me a cookbook ten minutes ago, paid for her coffee in bookmarks. She said someone would come asking. She left this for you."`,
        item: { icon: "🔖", name: "A bookmark with cat hair on it" },
        riddle: `<i>"Chapter Two: travel literature. South of here is the great square where every tram line in Graz meets, named after a merchant who built himself a whole neighbourhood. Nearby, a riverside garden with 'Au' in its name. I sell maps there. Don't dawdle."</i>`,
        hint: "The city's main tram hub, plus the Augarten park.",
      },
      6: {
        encounter: `A man waiting for the tram. "She was here all morning. Sold me a map of Graz — I live here. Then she said sports biographies sell best near the rink, and Herb wanted to see the Zamboni."`,
        item: { icon: "📄", name: "Page 1: “In which Herb meets Kafk”" },
        riddle: `<i>"South-east, where a 'lovely meadow' once was: the ice stadium and the football arena side by side, and a mall where the trams turn around. A hockey player there owes me library fines, by the way. Number 99. Rude."</i>`,
        hint: "Graz's ice hockey arena, next to the Merkur Arena and the Murpark mall.",
      },
      7: {
        encounter: `The Zamboni driver chuckles. "The book lady sold a hockey player a book called <i>How to Talk to Women</i>. He bought two. Then she said even the gatekeeper of heaven needs something to read."`,
        item: { icon: "📄", name: "Page 7: “Kafk vs. the Zamboni”" },
        riddle: `<i>"Find the old village church of the saint with the keys to heaven, north-east of here. Nearby there's a TV studio shaped like a layer cake, and a tiny forgotten jungle with a giant sequoia in it. Herb got lost in there once."</i>`,
        hint: "The saint with the keys. The 'cake' is the ORF studio, the jungle is the 'Grazer Urwald'.",
      },
      8: {
        encounter: `A radio host outside the TV studio. "She came on my show to plug the book. Herb meowed into the microphone for four minutes. Ratings were incredible. Then she said she wanted her cat's horoscope read, and walked north."`,
        item: { icon: "📄", name: "Page 12: “Herb on the radio”" },
        riddle: `<i>"A mystery! In the 1920s a famous medium held séances in the next district — they called her a seer. Today an observatory crowns one of its two hills and old villas line the other. In between, old clay pits became a nature reserve."</i>`,
        hint: "Ruckerlberg and Lustbühel (with the observatory). The 'Seherin von Waltendorf'.",
      },
      9: {
        encounter: `An astronomer by the observatory. "She asked me for Herb's horoscope. I told her Herb is a Taurus. She said that explains a lot. Then she said the next chapter is about freedom."`,
        item: { icon: "📄", name: "Page 23: “Herb's horoscope: nap”" },
        riddle: `<i>"The chapter of freedom: the saint who breaks prisoners' chains has his church just east of the old town, north-west of here. On the street named after him, the pianos of the music university drift out of the windows. Good music to read to."</i>`,
        hint: "The patron saint of prisoners. Church, street and arts university carry his name.",
      },
      2: {
        encounter: `A piano student with a book of sonnets. "She sold me this for two euros and a song. Literally — I had to play her a song. Then she said she was writing a road novel and pushed her cart uphill. East."`,
        item: { icon: "📄", name: "Page 31: “Kafk plays the piano (badly)”" },
        riddle: `<i>"A road novel! East, a ridge road climbs out of town, where cars once raced uphill in front of up to seventy thousand people. An old toll house stands at its foot. There's no primary school in the whole district — so nobody up there has read my book."</i>`,
        hint: "A district named after a ridge, with the Stiftingtal and Ragnitz valleys.",
      },
      10: {
        encounter: `A cyclist resting at the top of the road. "An old lady pushing a book cart uphill. Faster than me. Her cat was riding on top of the books like a figurehead. Then she turned around and rolled all the way back down. Something about textbooks."`,
        item: { icon: "📄", name: "Page 44: “Herb, Captain of the Cart”" },
        riddle: `<i>"The scholars' chapter. Back west toward town: the university's grand main building with its old reading hall, the glasshouses of the botanical garden, and the big hospital where Herb once needed stitches. Don't ask."</i>`,
        hint: "The university district — main campus, botanical garden, the LKH hospital.",
      },
      3: {
        encounter: `A librarian having a beer after her shift. "Ottilie returned a book that was 41 years overdue and paid the fine in cat food vouchers. We accepted. Then she said she needed a miracle to find a worthy buyer, and took the bus north-east."`,
        item: { icon: "📄", name: "Page 58: “A footnote about tuna”" },
        riddle: `<i>"A pilgrim's tale. North-east, a yellow church with two towers sits up on a hill, at the top of a long stairway. Old trams rest down below in a museum, like first editions in an archive."</i>`,
        hint: "A pilgrimage basilica at the end of tram line 1. The name contains 'comfort'.",
      },
      11: {
        encounter: `The sacristan is sweeping the stairs. "She prayed for a reader worthy of her last copy. Then Herb knocked over three candles and they had to leave quite quickly. She said she's running out of paper."`,
        item: { icon: "📄", name: "Page 66: “The candle incident”" },
        riddle: `<i>"Every story has an origin, and north-west of here it's quite literal: a spring the locals call 'the origin'. The district shares its name with a factory that builds paper machines — and without paper, no books. The trams end there; so does my patience."</i>`,
        hint: "A machine factory famous worldwide, a spring called 'Ursprung', the northern end of the tram lines.",
      },
      12: {
        encounter: `A woman walking her dog by the spring. "The book lady? Herb hissed at my dog. My dog cried. She apologised with a children's book and said she needs something darker for her stock."`,
        item: { icon: "📄", name: "Page 70: “Herb sleeps for 19 hours”" },
        riddle: `<i>"Every good shop needs a tragedy section. Across the river to the west: a castle that has been a ruin for centuries on a wooded hill, and a cliff named after a maiden who leapt rather than surrender. Gothic novels sell themselves up there."</i>`,
        hint: "A castle ruin north-west of town, next to the 'Jungfernsprung' rock.",
      },
      13: {
        encounter: `The keeper of the hut by the ruin is reading by candlelight. "She sold me a ghost story and a bag of cat treats. Herb ate the treats. Then she said she's off to a palace — one window for every day she's kept that book safe."`,
        item: { icon: "📄", name: "Page 81: “Kafk refuses a bath”" },
        riddle: `<i>"South, to a palace built like a calendar: three hundred and sixty-five windows. Peacocks strut through the park. Herb is NOT allowed to chase them. Herb will chase them."</i>`,
        hint: "A UNESCO-listed baroque palace in the west of Graz, with peacocks.",
      },
      14: {
        encounter: `A gardener in the palace park. "Her cat chased a peacock. The peacock won. Then a traffic warden gave her a ticket for parking the book cart on the lawn. She said she'd go and contest it."`,
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
        item: { icon: "📄", name: "Page 117: “Herb, sommelier”" },
        riddle: `<i>"East of here, where the city's beer is brewed — a family name that became a brewery, and now a whole new quarter of town. I'll be at the pool table. Herb cheats at billiards."</i>`,
        hint: "The brewery that gives Graz its beer — and its name to the 17th district.",
      },
      17: {
        encounter: `A guy chalking his cue. "The book lady won four games of pool. Her cat sat on the table and nudged my balls into the wrong pockets. Then she said she needs dictionaries for the last chapter — and a falafel."`,
        item: { icon: "📄", name: "Page 128: “Herb cheats at billiards”" },
        riddle: `<i>"North, to the district named after the gravel and sand the river left behind. A big square, many languages, strong coffee and kebab until late — I sell dictionaries there. The long wall with barbed wire? That library has very long loan periods."</i>`,
        hint: "The district's name is old German for coarse sand. The square has the same name.",
      },
      5: {
        encounter: `A kebab chef laughs. "She traded me a dictionary for a falafel. Herb got the meat. Then she wrote a note and said: 'She's always a little late. This time, I'll wait.'"`,
        item: { icon: "📄", name: "Page 139: “The last chapter (unfinished)”" },
        riddle: `<i>"The last chapter ends just north of here, where a strange blue creature with nozzles landed on the riverbank and turned into an art museum, next to a market square where poets drink at night. I'm waiting. For real this time."</i>`,
        hint: "A bubble-shaped art museum on the west bank of the Mur — the 'Friendly Alien'. The district next to Gries.",
      },
      4: {
        encounter: `Seventeen districts, seventeen drinks — and for once, you're not late.

Ottilie is sitting on a beer crate. Herb is asleep on top of the cart. She hands you a heavy, slightly dusty book: <b>The Library of Herb and Kafk</b>.

<i>"I was never going to sell it to just anyone. Only to someone who'd chase it across a whole city with her friends. Happy birthday, Sara. Look after it. Herb approves."</i>

Your crew has a drink for you. Prost! 🎂`,
        item: { icon: "📕", name: "The Library of Herb and Kafk" },
      },
    },
  },
};
