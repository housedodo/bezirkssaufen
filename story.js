// ─────────────────────────────────────────────────────────────
//  BEZIRKSSAUFEN — story data
//  Everything the players read lives in this file.
//  Edit freely: the app reads ROUTE, DISTRICTS and STORIES.
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

// The order of the day. Every leg goes to a neighbouring district,
// so it is one big loop around the city ending at the brewery.
// Not numeric on purpose — otherwise "guess the next district" is just counting.
//   I → IV → XIII → XII → III → XI → X → II → IX → VIII → VII → VI → V → XIV → XV → XVI → XVII
const ROUTE = [1, 4, 13, 12, 3, 11, 10, 2, 9, 8, 7, 6, 5, 14, 15, 16, 17];

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
    intro: `Word on the street: <b>Jakob "Iceman" Eisner</b> — defenceman, number 99, the most eligible man in Graz who owns a mouthguard — is out on the town tonight.

He never stays anywhere long. But he talks. Bartenders, teammates, a Zamboni driver: everyone saw him leave, and everyone has an opinion about where he went.

It's your birthday, Sarah. Today you find him.`,
    stops: {
      1: {
        encounter: `The bartender under the Uhrturm is polishing a glass. "Tall guy, 99 on the jacket? Ordered a Spritzer and stared at the clock tower for ten minutes. Said the hands are the wrong way round — big hand for the hours. 'Just like our coach,' he said. 'Everything backwards.' Then he paid and left."`,
        item: { icon: "🧾", name: "A receipt, signed #99" },
        riddle: `"He skated across the blue line — well, the river — heading west. Said he was going to see the alien: the big blue blob with nozzles that looks like a puck from outer space. Behind it there's a market square where the farmers sell eggs in the morning and the cool kids drink at night."`,
        hint: "A blue, bubble-shaped art museum right on the west bank of the Mur. Locals call it the Friendly Alien.",
      },
      4: {
        encounter: `A barista at the market square slides you a flat white. "Iceman? Sat right there. Complained the beer here is too fancy, ate three Krapfen, said he needs <i>altitude training</i>. He was very serious about it."`,
        item: { icon: "🥐", name: "A napkin with a hockey stick doodle" },
        riddle: `"He went upstream — north along the west bank, until the valley gets narrow. Up on a wooded hill there's a castle that's been a ruin for centuries, and a cliff nearby named after a maiden's desperate leap. He said he'd practise his goalie dive up there. Hopefully not off the cliff."`,
        hint: "A castle ruin on the Plabutsch side, north-west of town, next to the 'Jungfernsprung' rock.",
      },
      13: {
        encounter: `The keeper of the little hut by the ruin is out of breath. "Your hockey player ran up here, did forty push-ups, looked at the view and said 'Graz, you beautiful thing.' Then he drank all my Almdudler."`,
        item: { icon: "🏰", name: "A pebble from the castle wall" },
        riddle: `"He crossed the river back to the east. Said he needed <i>recovery water</i> — from a clear spring the locals call 'the origin'. The district shares its name with a factory that builds turbines and paper machines for half the planet. It's where the trams run out of track up north."`,
        hint: "A machine factory famous worldwide, a spring called 'Ursprung', the northern end of the tram network.",
      },
      12: {
        encounter: `A guy in factory overalls at the spring is filling bottles too. "Number 99? Signed my hard hat! Then his phone rang — a teammate took a puck to the face. He ran off swearing in three languages."`,
        item: { icon: "🪖", name: "A photo of a signed hard hat" },
        riddle: `"He headed south, back toward town, where the big hospital stitches up players like him. The university's grand main building is there too, and glasshouses where palm trees never see a winter."`,
        hint: "The university district: main campus, botanical garden, the big LKH hospital.",
      },
      3: {
        encounter: `A med student on a smoke break outside the clinic grins. "The teammate's fine, six stitches. Iceman is not fine — he's still single. He sat on the steps and said 'I need a miracle.' Then he got on a tram and rode it all the way out."`,
        item: { icon: "🩹", name: "A roll of tape: “#99”" },
        riddle: `"The tram's last stop, out north-east. A yellow church with two towers sits up on the hill, at the top of a long stairway — pilgrims climb it looking for comfort. Retired trams live down at the bottom in a museum. He's lighting a candle for his love life."`,
        hint: "A pilgrimage basilica on a hill at the end of tram line 1. The district's name literally contains 'comfort'.",
      },
      11: {
        encounter: `The sacristan sighs. "He lit a candle. Then a second one. Then he asked if there's a patron saint of hat-tricks. There isn't. He said he'd go clear his head with some cardio and jogged off south."`,
        item: { icon: "🕯️", name: "Candle no. 99" },
        riddle: `"Over the hills, to a ridge road that climbs east out of the city. A hundred years ago people raced cars up it, with up to seventy thousand spectators. An old toll house still stands at the bottom. Fun fact: it's the only district in Graz without its own primary school — so nobody up there is checking his homework."`,
        hint: "A district named after a ridge, with two valleys (Stiftingtal and Ragnitz) and a famous uphill road.",
      },
      10: {
        encounter: `A cyclist catching his breath at the top of the hill. "Big guy, ran past me UPHILL. Then a car honked at him and he got a ticket for jaywalking. He took it very personally. Said he'd go and do his time like a man."`,
        item: { icon: "🎫", name: "A jaywalking ticket" },
        riddle: `"Two minutes in the box. He went to serve his penalty with the saint who looks after prisoners — the one they paint in chains. The saint's church is just east of the old town, and on the street with his name, music students practise until the windows rattle."`,
        hint: "The patron saint of prisoners (and cattle). Church, street and the arts university all carry his name.",
      },
      2: {
        encounter: `A cello student outside the music university. "He asked me to play the goal horn on my cello. I tried. It was awful. He loved it. Then he went all quiet and said the thing he misses most is skating on <i>natural</i> ice, like when he was a kid."`,
        item: { icon: "🎻", name: "Sheet music with a smudged phone number" },
        riddle: `"Out south-east there are two hills side by side — one wears an observatory, the other old villas. Between them, old clay pits used to freeze over in winter and Graz literally harvested its ice there. Today it's a nature reserve. The district's coat of arms shows a little castle."`,
        hint: "The hills are Ruckerlberg and Lustbühel. The castle in the coat of arms is the Hallerschloss.",
      },
      9: {
        encounter: `An astronomer by the observatory is packing up a telescope. "Your hockey player wanted to know which star is lucky number 99. I made one up. Then he patted his pockets and went pale — he'd lost the key to his locker."`,
        item: { icon: "🔭", name: "Star no. 99 (made up)" },
        riddle: `"Who has the most famous set of keys? A fisherman who became a saint and guards the gates of heaven. Go south to the old village church named after him. Nearby there's a TV studio shaped like a layer cake, and a tiny forgotten jungle with a giant sequoia in it."`,
        hint: "The saint with the keys. The 'cake' is the ORF Landesstudio. The jungle is the 'Grazer Urwald'.",
      },
      8: {
        encounter: `A sound engineer outside the TV studio. "He did a quick radio interview — found his key, by the way. Said hi to his mum on air. Then someone told him the puck drops in an hour and he sprinted out of here."`,
        item: { icon: "🗝️", name: "A spare locker key" },
        riddle: `"Home ice! Further south, where a 'lovely meadow' used to be: an ice stadium right next to the football stadium, whose forecourt is named after a legendary coach. There's a shopping mall where the trams turn around, and down the road a factory builds those boxy G-Class off-roaders."`,
        hint: "Graz's ice hockey arena, next to the Merkur Arena and the Murpark mall.",
      },
      7: {
        encounter: `The Zamboni driver kills the engine. "You JUST missed him. Game's over — he scored, by the way. He showered in forty seconds and said he's meeting the team where all the trams cross. He seemed in a hurry. Something about 'today being the day'."`,
        item: { icon: "🏒", name: "A broken stick, #99" },
        riddle: `"Back north toward the centre: the big square where every tram line in Graz meets, like players at a face-off — named after a merchant who built himself a whole neighbourhood. Nearby there's a riverside park with 'Au' in its name where he cools down after games."`,
        hint: "The city's main tram hub, plus the Augarten park.",
      },
      6: {
        encounter: `A teammate in a hoodie is waiting at the tram stop. "Iceman? He left. He said the team bars are too loud, he wants somewhere honest. Somewhere gritty. Like the ice after the third period."`,
        item: { icon: "🎟️", name: "A crumpled tram ticket" },
        riddle: `"Gritty is the word. Across the river to the west bank, into the district named after the coarse sand and gravel the Mur dumped on its banks. Find the big square with honest bars and kebab until late. And stay away from the long prison wall — that's one penalty box you don't want."`,
        hint: "The district's name is old German for coarse sand. The square has the same name.",
      },
      5: {
        encounter: `The kebab guy laughs. "Double Dürüm, extra spicy, no onions — 'for the breath,' he said. He said he's got a date soon. Then he saw a peacock on a poster and said he needs to learn how to show off properly."`,
        item: { icon: "🌯", name: "A napkin: “no onions”" },
        riddle: `"West, to a palace built like a calendar: three hundred and sixty-five windows, one for every day of the year. Peacocks strut around the park like they own it. He's studying their technique."`,
        hint: "A UNESCO-listed baroque palace on the west side of town. Watch out for peacocks.",
      },
      14: {
        encounter: `A gardener in the palace park shakes his head. "A peacock stole his puck. A grown man, chasing a peacock across the lawn. He lost. He went to report the theft to the police — I think he was joking. I'm not sure."`,
        item: { icon: "🦚", name: "A peacock feather (stolen back)" },
        riddle: `"South of here: a forested hill that shares its name with the Mount of Olives, with the motorway roaring through a tunnel deep underneath. The province's police headquarters is in this district too. The tram line ends at its edge."`,
        hint: "The hill is the Ölberg; the tunnel is the Plabutschtunnel. Look for the tram's western terminus.",
      },
      15: {
        encounter: `A police officer at the door, very tired. "Mr Eisner reported a puck stolen by a peacock. I filed it under 'wildlife'. He also asked if there's a law against being this nervous. There isn't. He said he needs a glass of wine."`,
        item: { icon: "🚓", name: "Police report no. 99" },
        riddle: `"Further south: a little church called 'Mary in Misery' sits on a hill above a road the Romans already used. There's a castle that has been a school for grown-ups for over a hundred years, a natural lake to cool off in, and vineyards — one of only two wine areas inside the city."`,
        hint: "Schloss St. Martin, the Naturbad, the Kehlberg vineyards.",
      },
      16: {
        encounter: `The waiter at a little wine tavern on the hillside clears a glass. "He drank one glass, very slowly, staring into it. Then he stood up and said: 'Tonight, at the very end, I'll be waiting for her. Where the beer is made.' Then he tipped me twenty euros. Romantic guy."`,
        item: { icon: "🍷", name: "An empty wine glass" },
        riddle: `"The final whistle blows where the city's beer is brewed — a family name that turned into a brewery and is now a whole new quarter of town. East of here, at the very south of Graz. He's waiting for you. Probably."`,
        hint: "The brewery that gives Graz its beer — and its name to the 17th district.",
      },
      17: {
        encounter: `You made it. Seventeen districts, seventeen drinks.

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
        encounter: `The man at the Würstelstand by the Hauptplatz points his tongs at you. "The old lady with the book cart and the fat cat? Sold me a cookbook ten minutes ago. She said someone would come asking. She left this for you."`,
        item: { icon: "🔖", name: "A bookmark with cat hair on it" },
        riddle: `<i>"Chapter Two is set across the river, where a strange blue creature with nozzles landed on the west bank and turned into an art museum. Behind it, farmers sell eggs by day and poets drink by night. I'll set up my cart there. Don't dawdle."</i>`,
        hint: "A bubble-shaped art museum on the west bank of the Mur — the 'Friendly Alien'.",
      },
      4: {
        encounter: `A poet at the market square is reading a book he clearly just bought. "Ottilie? Gone, five minutes ago. Herb sat on my laptop the whole time. She said she needed something darker for her stock — and pointed north."`,
        item: { icon: "📄", name: "Page 1: “In which Herb meets Kafk”" },
        riddle: `<i>"Every good shop needs a tragedy section. Follow the river north on the west bank, to a castle that has been a ruin for centuries on a wooded hill — and a cliff named after a maiden who leapt rather than surrender. Gothic novels sell themselves up there."</i>`,
        hint: "A castle ruin north-west of town, next to the 'Jungfernsprung' rock.",
      },
      13: {
        encounter: `The keeper of the hut by the ruin is reading by candlelight. "She sold me a ghost story and a bag of cat treats. Herb ate the treats. She said she needed paper, lots of it, and went down to the bridge."`,
        item: { icon: "📄", name: "Page 7: “Kafk refuses a bath”" },
        riddle: `<i>"Every story has an origin, and over the river to the east it's quite literal: a spring the locals call 'the origin'. The district shares its name with a factory that builds paper machines — and without paper, no books. The trams end there; so does my patience."</i>`,
        hint: "A machine factory famous worldwide, a spring called 'Ursprung', the northern end of the tram lines.",
      },
      12: {
        encounter: `A woman walking her dog by the spring. "The book lady? Herb hissed at my dog. My dog cried. She apologised with a children's book and said she's off to sell textbooks to people who can't afford them."`,
        item: { icon: "📄", name: "Page 12: “Herb sleeps for 19 hours”" },
        riddle: `<i>"The scholars' chapter. South, back toward town: the university's grand main building with its old reading hall, the glasshouses of the botanical garden, and the big hospital where Herb once needed stitches. Don't ask."</i>`,
        hint: "The university district — main campus, botanical garden, the LKH hospital.",
      },
      3: {
        encounter: `A librarian on the university steps. "Ottilie returned a book that was 41 years overdue and paid the fine in cat food vouchers. We accepted. Then she said she needed a miracle to find a worthy buyer and got on the tram."`,
        item: { icon: "📄", name: "Page 23: “A footnote about tuna”" },
        riddle: `<i>"A pilgrim's tale. Ride the tram to its north-eastern end: a yellow church with two towers up on a hill, at the top of a long stairway. Old trams rest there in a museum, like first editions in an archive."</i>`,
        hint: "A pilgrimage basilica at the end of tram line 1. The name contains 'comfort'.",
      },
      11: {
        encounter: `The sacristan is sweeping the stairs. "She prayed for a reader worthy of her last copy. Then Herb knocked over three candles and they had to leave quite quickly."`,
        item: { icon: "📄", name: "Page 31: “The candle incident”" },
        riddle: `<i>"A road novel next. Over the hills to the south: a ridge road climbing east out of town, where cars once raced uphill in front of up to seventy thousand people. An old toll house stands at its foot. There's no primary school in the whole district — so nobody up there has read my book."</i>`,
        hint: "A district named after a ridge, with the Stiftingtal and Ragnitz valleys.",
      },
      10: {
        encounter: `A cyclist resting at the top of the road. "An old lady pushing a book cart uphill. Faster than me. Her cat was riding on top of the books like a figurehead. She said something about music and chains."`,
        item: { icon: "📄", name: "Page 44: “Herb, Captain of the Cart”" },
        riddle: `<i>"The chapter of freedom: the saint who breaks prisoners' chains has his church just east of the old town. On the street named after him, the pianos of the music university drift out of the windows. Good music to read to."</i>`,
        hint: "The patron saint of prisoners. Church, street and arts university carry his name.",
      },
      2: {
        encounter: `A piano student with a book of sonnets. "She sold me this for two euros and a song. Literally — I had to play her a song. Then she said she wanted her cat's horoscope read and walked off south-east."`,
        item: { icon: "📄", name: "Page 58: “Kafk plays the piano (badly)”" },
        riddle: `<i>"A mystery! In the 1920s a famous medium held séances in the next district — they called her a seer. Today an observatory crowns one of its two hills and old villas line the other. In between, old clay pits became a nature reserve."</i>`,
        hint: "Ruckerlberg and Lustbühel (with the observatory). The 'Seherin von Waltendorf'.",
      },
      9: {
        encounter: `An astronomer by the observatory. "She asked me for Herb's horoscope. I told her Herb is a Taurus. She said that explains a lot. Then she said even the gatekeeper of heaven needs something to read."`,
        item: { icon: "📄", name: "Page 66: “Herb's horoscope: nap”" },
        riddle: `<i>"Find the old village church of the saint with the keys to heaven, to the south. Nearby there's a TV studio shaped like a layer cake, and a tiny forgotten jungle with a giant sequoia in it. Herb got lost in there once."</i>`,
        hint: "The saint with the keys. The 'cake' is the ORF studio, the jungle is the 'Grazer Urwald'.",
      },
      8: {
        encounter: `A radio host outside the TV studio. "She came on my show to plug the book. Herb meowed into the microphone for four minutes. Ratings were incredible. Then she said sports biographies sell best near the rink."`,
        item: { icon: "📄", name: "Page 70: “Herb on the radio”" },
        riddle: `<i>"Further south, where a 'lovely meadow' once was: the ice stadium and the football arena side by side, a mall where the trams turn around. A hockey player there owes me library fines, by the way. Number 99. Rude."</i>`,
        hint: "Graz's ice hockey arena, next to the Merkur Arena and the Murpark mall.",
      },
      7: {
        encounter: `The Zamboni driver chuckles. "The book lady sold a hockey player a book called <i>How to Talk to Women</i>. He bought two. Then she said she's off to sell travel guides where every tram in the city meets."`,
        item: { icon: "📄", name: "Page 81: “Kafk vs. the Zamboni”" },
        riddle: `<i>"Travel literature: the great square where every tram line in Graz meets, named after a merchant who built himself a whole neighbourhood. Nearby, a riverside garden with 'Au' in its name — I like to read on its benches."</i>`,
        hint: "The city's main tram hub, and the Augarten park.",
      },
      6: {
        encounter: `A man waiting for a tram. "She was on that bench all afternoon. Then she checked her watch and said, 'Late again, that girl,' and crossed the river. She sounded fond of you, though."`,
        item: { icon: "📄", name: "Page 92: “A bench, a cat, a sunset”" },
        riddle: `<i>"Across the Mur, to the district named after the gravel and sand the river left behind. A big square, many languages, strong coffee — I sell dictionaries there. The long wall with barbed wire? That library has very long loan periods."</i>`,
        hint: "The district's name is old German for coarse sand. The square has the same name.",
      },
      5: {
        encounter: `A kebab chef laughs. "She traded me a dictionary for a falafel. Herb got the meat. Then she said she's going to a palace — one window for every day she's kept that book safe."`,
        item: { icon: "📄", name: "Page 104: “Herb eats a falafel”" },
        riddle: `<i>"West, to a palace built like a calendar: three hundred and sixty-five windows. Peacocks strut through the park. Herb is NOT allowed to chase them. Herb will chase them."</i>`,
        hint: "A UNESCO-listed baroque palace in the west of Graz, with peacocks.",
      },
      14: {
        encounter: `A gardener in the palace park. "Her cat chased a peacock. The peacock won. Then a traffic warden gave her a ticket for parking the book cart on the lawn. She said she'd go and contest it."`,
        item: { icon: "📄", name: "Page 117: “The Peacock War”" },
        riddle: `<i>"Crime fiction! South of here sits the province's police headquarters, below a forested hill that shares its name with the Mount of Olives. A motorway tunnel runs deep underneath. The tram line ends at its edge."</i>`,
        hint: "The Ölberg, the Plabutschtunnel, and the tram's western terminus.",
      },
      15: {
        encounter: `A tired police officer. "She contested a parking ticket for a book cart. Then she sold my colleague a crime novel and told him who the murderer is. He's very upset. She went south, said she needs a glass of wine and a castle."`,
        item: { icon: "📄", name: "Page 128: “The butler did it”" },
        riddle: `<i>"Reading in a castle! Further south, a castle has been a school for grown-ups for over a hundred years. There's a little hilltop church called 'Mary in Misery', a lake to swim in, and vineyards — one of only two wine areas inside Graz."</i>`,
        hint: "Schloss St. Martin, the Naturbad, the Kehlberg vineyards.",
      },
      16: {
        encounter: `The waiter at the little wine tavern. "She drank half a glass and wrote a note. She made me promise to give it to someone called Sara. She said she's done running. She'll wait this time."`,
        item: { icon: "📄", name: "Page 139: “The last chapter (unfinished)”" },
        riddle: `<i>"The last chapter is written where the city's beer is brewed — a family name that became a brewery and now a whole new quarter of town. East of here, at the very south of Graz. I'm waiting. For real this time."</i>`,
        hint: "The brewery that gives Graz its beer — and its name to the 17th district.",
      },
      17: {
        encounter: `Seventeen districts, seventeen drinks — and for once, you're not late.

Ottilie is sitting on a beer crate. Herb is asleep on top of the cart. She hands you a heavy, slightly dusty book: <b>The Library of Herb and Kafk</b>.

<i>"I was never going to sell it to just anyone. Only to someone who'd chase it across a whole city with her friends. Happy birthday, Sara. Look after it. Herb approves."</i>

Your crew has a drink for you. Prost! 🎂`,
        item: { icon: "📕", name: "The Library of Herb and Kafk" },
      },
    },
  },
};
