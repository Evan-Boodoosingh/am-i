import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PASTE YOUR EXISTING characterSources MAP HERE from the oracle route

// (the full map with all 101 characters and their fandom/wikipedia URLs)
interface CharacterSource {
  type: 'fandom' | 'wikipedia'
  url: string
}
const characterSources: Record<string, CharacterSource> = {
  'Satoru Gojo': { type: 'fandom', url: 'https://jujutsu-kaisen.fandom.com/api.php?action=parse&page=Satoru_Gojo&prop=wikitext&format=json&origin=*' },
  'Dio Brando': { type: 'fandom', url: 'https://jojo.fandom.com/api.php?action=parse&page=Dio_Brando&prop=wikitext&format=json&origin=*' },
  'Light Yagami': { type: 'fandom', url: 'https://deathnote.fandom.com/api.php?action=parse&page=Light_Yagami&prop=wikitext&format=json&origin=*' },
  'Naruto Uzumaki': { type: 'fandom', url: 'https://naruto.fandom.com/api.php?action=parse&page=Naruto_Uzumaki&prop=wikitext&format=json&origin=*' },
  'Monkey D. Luffy': { type: 'fandom', url: 'https://onepiece.fandom.com/api.php?action=parse&page=Monkey_D._Luffy&prop=wikitext&format=json&origin=*' },
  'Ichigo Kurosaki': { type: 'fandom', url: 'https://bleach.fandom.com/api.php?action=parse&page=Ichigo_Kurosaki&prop=wikitext&format=json&origin=*' },
  'Itachi Uchiha': { type: 'fandom', url: 'https://naruto.fandom.com/api.php?action=parse&page=Itachi_Uchiha&prop=wikitext&format=json&origin=*' },
  'Sosuke Aizen': { type: 'fandom', url: 'https://bleach.fandom.com/api.php?action=parse&page=Sousuke_Aizen&prop=wikitext&format=json&origin=*' },
  'Roronoa Zoro': { type: 'fandom', url: 'https://onepiece.fandom.com/api.php?action=parse&page=Roronoa_Zoro&prop=wikitext&format=json&origin=*' },
  'Hisoka Morow': { type: 'fandom', url: 'https://hunterxhunter.fandom.com/api.php?action=parse&page=Hisoka_Morow&prop=wikitext&format=json&origin=*' },
  'Goku': { type: 'fandom', url: 'https://dragonball.fandom.com/api.php?action=parse&page=Goku&prop=wikitext&format=json&origin=*' },
  'Levi Ackerman': { type: 'fandom', url: 'https://attackontitan.fandom.com/api.php?action=parse&page=Levi_Ackermann_(Anime)&prop=wikitext&format=json&origin=*' },
  'Makima': { type: 'fandom', url: 'https://chainsaw-man.fandom.com/api.php?action=parse&page=Makima&prop=wikitext&format=json&origin=*' },
  'Anya Forger': { type: 'fandom', url: 'https://spy-x-family.fandom.com/api.php?action=parse&page=Anya_Forger&prop=wikitext&format=json&origin=*' },
  'Rem': { type: 'fandom', url: 'https://rezero.fandom.com/api.php?action=parse&page=Rem&prop=wikitext&format=json&origin=*' },
  'Seto Kaiba': { type: 'fandom', url: 'https://yugioh.fandom.com/api.php?action=parse&page=Seto_Kaiba&prop=wikitext&format=json&origin=*' },
  'Saitama': { type: 'fandom', url: 'https://onepunchman.fandom.com/api.php?action=parse&page=Saitama&prop=wikitext&format=json&origin=*' },
  'All Might': { type: 'fandom', url: 'https://myheroacademia.fandom.com/api.php?action=parse&page=Toshinori_Yagi&prop=wikitext&format=json&origin=*' },
  'Ash Ketchum': { type: 'fandom', url: 'https://pokemon.fandom.com/api.php?action=parse&page=Ash_Ketchum&prop=wikitext&format=json&origin=*' },
  'Edward Elric': { type: 'fandom', url: 'https://fma.fandom.com/api.php?action=parse&page=Edward_Elric&prop=wikitext&format=json&origin=*' },
  'SpongeBob SquarePants': { type: 'fandom', url: 'https://spongebob.fandom.com/api.php?action=parse&page=SpongeBob_SquarePants_(character)&prop=wikitext&format=json&origin=*' },
  'Squidward Tentacles': { type: 'fandom', url: 'https://spongebob.fandom.com/api.php?action=parse&page=Squidward_Tentacles&prop=wikitext&format=json&origin=*' },
  'Timmy Turner': { type: 'fandom', url: 'https://fairlyoddparents.fandom.com/api.php?action=parse&page=Timmy_Turner&prop=wikitext&format=json&origin=*' },
  'Danny Phantom': { type: 'fandom', url: 'https://dannyphantom.fandom.com/api.php?action=parse&page=Danny_Phantom_(character)&prop=wikitext&format=json&origin=*' },
  'Jimmy Neutron': { type: 'fandom', url: 'https://jimmyneutron.fandom.com/api.php?action=parse&page=Jimmy_Neutron&prop=wikitext&format=json&origin=*' },
  'Aang': { type: 'fandom', url: 'https://avatar.fandom.com/api.php?action=parse&page=Aang&prop=wikitext&format=json&origin=*' },
  'Prince Zuko': { type: 'fandom', url: 'https://avatar.fandom.com/api.php?action=parse&page=Zuko&prop=wikitext&format=json&origin=*' },
  'Perry the Platypus': { type: 'fandom', url: 'https://phineasandferb.fandom.com/api.php?action=parse&page=Perry_the_Platypus&prop=wikitext&format=json&origin=*' },
  'Dr. Doofenshmirtz': { type: 'fandom', url: 'https://phineasandferb.fandom.com/api.php?action=parse&page=Heinz_Doofenshmirtz&prop=wikitext&format=json&origin=*' },
  'Bill Cipher': { type: 'fandom', url: 'https://gravityfalls.fandom.com/api.php?action=parse&page=Bill_Cipher&prop=wikitext&format=json&origin=*' },
  'Ben Tennyson': { type: 'fandom', url: 'https://ben10.fandom.com/api.php?action=parse&page=Ben_Tennyson_(Classic)&prop=wikitext&format=json&origin=*' },
  'Finn the Human': { type: 'fandom', url: 'https://adventuretime.fandom.com/api.php?action=parse&page=Finn&prop=wikitext&format=json&origin=*' },
  'Mordecai': { type: 'fandom', url: 'https://regularshow.fandom.com/api.php?action=parse&page=Mordecai&prop=wikitext&format=json&origin=*' },
  'Raven': { type: 'fandom', url: 'https://teentitans.fandom.com/api.php?action=parse&page=Raven&prop=wikitext&format=json&origin=*' },
  'Mojo Jojo': { type: 'fandom', url: 'https://powerpuffgirls.fandom.com/api.php?action=parse&page=Mojo_Jojo_(1998_TV_series)&prop=wikitext&format=json&origin=*' },
  'Courage the Cowardly Dog': { type: 'fandom', url: 'https://couragethecowardlydog.fandom.com/api.php?action=parse&page=Courage&prop=wikitext&format=json&origin=*' },
  'Grim': { type: 'fandom', url: 'https://grimadventures.fandom.com/api.php?action=parse&page=Grim&prop=wikitext&format=json&origin=*' },
  'Shego': { type: 'fandom', url: 'https://kimpossible.fandom.com/api.php?action=parse&page=Shego&prop=wikitext&format=json&origin=*' },
  'Scooby-Doo': { type: 'fandom', url: 'https://scoobydoo.fandom.com/api.php?action=parse&page=Scooby-Doo&prop=wikitext&format=json&origin=*' },
  'Ed': { type: 'fandom', url: 'https://ed.fandom.com/api.php?action=parse&page=Ed&prop=wikitext&format=json&origin=*' },
  'Pikachu': { type: 'fandom', url: 'https://pokemon.fandom.com/api.php?action=parse&page=Pikachu&prop=wikitext&format=json&origin=*' },
  'Mario': { type: 'fandom', url: 'https://mario.fandom.com/api.php?action=parse&page=Mario&prop=wikitext&format=json&origin=*' },
  'Kirby': { type: 'fandom', url: 'https://kirby.fandom.com/api.php?action=parse&page=Kirby&prop=wikitext&format=json&origin=*' },
  'Sonic the Hedgehog': { type: 'fandom', url: 'https://sonic.fandom.com/api.php?action=parse&page=Sonic_the_Hedgehog&prop=wikitext&format=json&origin=*' },
  'Donkey Kong': { type: 'fandom', url: 'https://donkeykong.fandom.com/api.php?action=parse&page=Donkey_Kong&prop=wikitext&format=json&origin=*' },
  'Trevor Philips': { type: 'fandom', url: 'https://gta.fandom.com/api.php?action=parse&page=Trevor_Philips&prop=wikitext&format=json&origin=*' },
  'Link': { type: 'fandom', url: 'https://zelda.fandom.com/api.php?action=parse&page=Link&prop=wikitext&format=json&origin=*' },
  'Bowser': { type: 'fandom', url: 'https://mario.fandom.com/api.php?action=parse&page=Bowser&prop=wikitext&format=json&origin=*' },
  'Master Chief': { type: 'fandom', url: 'https://halo.fandom.com/api.php?action=parse&page=John-117&prop=wikitext&format=json&origin=*' },
  'Kratos': { type: 'fandom', url: 'https://godofwar.fandom.com/api.php?action=parse&page=Kratos&prop=wikitext&format=json&origin=*' },
  'Creeper': { type: 'fandom', url: 'https://minecraft.fandom.com/api.php?action=parse&page=Creeper&prop=wikitext&format=json&origin=*' },
  'Pac-Man': { type: 'fandom', url: 'https://pacman.fandom.com/api.php?action=parse&page=Pac-Man&prop=wikitext&format=json&origin=*' },
  'Sans': { type: 'fandom', url: 'https://undertale.fandom.com/api.php?action=parse&page=Sans&prop=wikitext&format=json&origin=*' },
  'Steve': { type: 'fandom', url: 'https://minecraft.fandom.com/api.php?action=parse&page=Player&prop=wikitext&format=json&origin=*' },
  'Scorpion': { type: 'fandom', url: 'https://mortalkombat.fandom.com/api.php?action=parse&page=Hanzo_Hasashi&prop=wikitext&format=json&origin=*' },
  'CJ': { type: 'fandom', url: 'https://gta.fandom.com/api.php?action=parse&page=Carl_Johnson&prop=wikitext&format=json&origin=*' },
  'Isabelle': { type: 'fandom', url: 'https://animalcrossing.fandom.com/api.php?action=parse&page=Isabelle&prop=wikitext&format=json&origin=*' },
  'Mewtwo': { type: 'fandom', url: 'https://pokemon.fandom.com/api.php?action=parse&page=Mewtwo&prop=wikitext&format=json&origin=*' },
  'Sephiroth': { type: 'fandom', url: 'https://finalfantasy.fandom.com/api.php?action=parse&page=Sephiroth&prop=wikitext&format=json&origin=*' },
  'Crash Bandicoot': { type: 'fandom', url: 'https://crashbandicoot.fandom.com/api.php?action=parse&page=Crash_Bandicoot&prop=wikitext&format=json&origin=*' },
  'Shrek': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Shrek_(character)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Tony Stark': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Iron_Man&prop=extracts&explaintext=true&format=json&origin=*' },
  'The Joker': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Joker_(character)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Captain Jack Sparrow': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Jack_Sparrow&prop=extracts&explaintext=true&format=json&origin=*' },
  'Thanos': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Thanos&prop=extracts&explaintext=true&format=json&origin=*' },
  'Harry Potter': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Harry_Potter_(character)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Edward Cullen': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Edward_Cullen&prop=extracts&explaintext=true&format=json&origin=*' },
  'Katniss Everdeen': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Katniss_Everdeen&prop=extracts&explaintext=true&format=json&origin=*' },
  'Gollum': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Gollum&prop=extracts&explaintext=true&format=json&origin=*' },
  'Patrick Bateman': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Patrick_Bateman&prop=extracts&explaintext=true&format=json&origin=*' },
  'John Wick': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=John_Wick_(character)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Gru': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Gru_(Despicable_Me)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Barbie': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Barbie_(character)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Anakin Skywalker': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Anakin_Skywalker&prop=extracts&explaintext=true&format=json&origin=*' },
  'Dominic Toretto': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Dominic_Toretto&prop=extracts&explaintext=true&format=json&origin=*' },
  'Lord Voldemort': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Lord_Voldemort&prop=extracts&explaintext=true&format=json&origin=*' },
  'Miles Morales': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Miles_Morales&prop=extracts&explaintext=true&format=json&origin=*' },
  'Lightning McQueen': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Lightning_McQueen&prop=extracts&explaintext=true&format=json&origin=*' },
  'Pennywise': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Pennywise_(character)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Peter Parker': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Spider-Man&prop=extracts&explaintext=true&format=json&origin=*' },
  'Walter White': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Walter_White_(Breaking_Bad)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Michael Scott': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Michael_Scott_(The_Office)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Daenerys Targaryen': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Daenerys_Targaryen&prop=extracts&explaintext=true&format=json&origin=*' },
  'Homelander': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Homelander&prop=extracts&explaintext=true&format=json&origin=*' },
  'Negan': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Negan_(The_Walking_Dead)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Barney Stinson': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Barney_Stinson&prop=extracts&explaintext=true&format=json&origin=*' },
  'Ron Swanson': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Ron_Swanson&prop=extracts&explaintext=true&format=json&origin=*' },
  'Tony Soprano': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Tony_Soprano&prop=extracts&explaintext=true&format=json&origin=*' },
  'Eleven': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Eleven_(Stranger_Things)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Saul Goodman': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Saul_Goodman&prop=extracts&explaintext=true&format=json&origin=*' },
  'Ross Geller': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Ross_Geller&prop=extracts&explaintext=true&format=json&origin=*' },
  'Joffrey Baratheon': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Joffrey_Baratheon&prop=extracts&explaintext=true&format=json&origin=*' },
  'Dexter Morgan': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Dexter_Morgan&prop=extracts&explaintext=true&format=json&origin=*' },
  'Sue Sylvester': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Sue_Sylvester&prop=extracts&explaintext=true&format=json&origin=*' },
  'Dr. Gregory House': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Gregory_House&prop=extracts&explaintext=true&format=json&origin=*' },
  'Dean Winchester': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Dean_Winchester&prop=extracts&explaintext=true&format=json&origin=*' },
  'Frank Reynolds': { type: 'wikipedia', url: "https://en.wikipedia.org/w/api.php?action=query&titles=Frank_Reynolds_(It's_Always_Sunny_in_Philadelphia)&prop=extracts&explaintext=true&format=json&origin=*" },
  'Kendall Roy': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Kendall_Roy&prop=extracts&explaintext=true&format=json&origin=*' },
  'Rue Bennett': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Rue_Bennett&prop=extracts&explaintext=true&format=json&origin=*' },
  'Steve Harrington': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Steve_Harrington&prop=extracts&explaintext=true&format=json&origin=*' },
  'Darth Vader': { type: 'fandom', url: 'https://starwars.fandom.com/api.php?action=parse&page=Anakin_Skywalker&prop=wikitext&format=json&origin=*' },
  'Hannibal Lecter': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Hannibal_Lecter&prop=extracts&explaintext=true&format=json&origin=*' },
  'Scar': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Scar_(The_Lion_King)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Green Goblin': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Green_Goblin&prop=extracts&explaintext=true&format=json&origin=*' },
  'Plankton': { type: 'fandom', url: 'https://spongebob.fandom.com/api.php?action=parse&page=Sheldon_J._Plankton&prop=wikitext&format=json&origin=*' },
  'Michael Myers': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Michael_Myers_(character)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Freddy Krueger': { type: 'fandom', url: 'https://villains.fandom.com/api.php?action=parse&page=Freddy_Krueger_(original)&prop=wikitext&format=json&origin=*' },
  'Maleficent': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Maleficent&prop=extracts&explaintext=true&format=json&origin=*' },
  'Loki': { type: 'fandom', url: 'https://marvelcinematicuniverse.fandom.com/api.php?action=parse&page=Loki&prop=wikitext&format=json&origin=*' },
  'Cruella de Vil': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Cruella_de_Vil&prop=extracts&explaintext=true&format=json&origin=*' },
  'Chucky': { type: 'fandom', url: 'https://chucky.fandom.com/api.php?action=parse&page=Chucky&prop=wikitext&format=json&origin=*' },
  'Wicked Witch of the West': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Wicked_Witch_of_the_West&prop=extracts&explaintext=true&format=json&origin=*' },
  'Captain Hook': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Captain_Hook&prop=extracts&explaintext=true&format=json&origin=*' },
  'Kylo Ren': { type: 'fandom', url: 'https://starwars.fandom.com/api.php?action=parse&page=Ben_Solo&prop=wikitext&format=json&origin=*' },
}

const TRAIT_DEFINITIONS = `
resurrection: died and came back to life or was resurrected
secret_identity: hides their true identity, powers, or nature from most people
lost_family: lost a parent or close family member that shaped who they became
villain_to_hero: started as a villain or antagonist before becoming beloved
created_transformed: was created, experimented on, or transformed by someone else against their will
obsession: consumed by a single obsession or goal that drives everything they do
mask_pain: uses humor or a cheerful attitude to hide deep pain or trauma
extremely_powerful: considered extremely powerful or among the strongest in their world
adopted_orphan: an orphan or raised by someone other than their biological parents
loyal_found_family: fiercely loyal to a small group they consider chosen family
sacrifice: sacrificed themselves or gave up everything important for someone else
villain: primarily a villain or antagonist in their story
redemption_arc: went through a significant redemption arc from bad to good
trauma_driven: primarily driven by a traumatic event from their past
addiction: struggles with an addiction or compulsion they cannot control
neglected: neglected or failed by the adults or authority figures meant to care for them
genius: explicitly portrayed as a genius or exceptionally intelligent
underdog: an underdog or outcast underestimated by everyone around them
world_threat: has the power to threaten or destroy entire populations or worlds
double_life: lives a double life balancing two completely different identities
non_human: not human (animal, robot, monster, alien, deity, doll, or other species)
iconic_weapon: strongly associated with one signature weapon or item they are always seen with
leader: leads a team, organization, kingdom, crew, or group of followers
comedic: primarily a comedic character known for making audiences laugh
feared_by_enemies: widely feared by their enemies or the people around them
manipulator: manipulates or deceives others as a core part of their character
protects_hometown: dedicated to protecting their home, town, or world from threats
reluctant_hero: never wanted their role or power but accepted the responsibility
food_obsessed: known for a huge appetite or obsession with a specific food
immortal_or_ageless: immortal, undead, ageless, or has lived far beyond a normal lifespan
royalty: a prince, princess, king, queen, or member of a royal or noble bloodline
iconic_duo: inseparable from one famous best friend or partner they are always seen with
protects_younger_sibling: has a younger sibling they protect at all costs
revenge_driven: primarily motivated by revenge for a past wrong
silent_type: rarely or never speaks
deadpan: famous for a deadpan, monotone, or emotionless delivery
lazy: famously lazy or unmotivated
rich: extremely wealthy or controls vast fortunes
crime_world: operates within organized crime or a criminal enterprise
transformation_form: can transform into a more powerful alternate form or state
school_secret_life: balances school or student life with a secret second life
lab_experiment: was experimented on in a lab or created through scientific experimentation
animal_companion: has a loyal animal companion or pet by their side
scaredy_cat: famously cowardly or easily frightened
says_own_name: known for mostly saying or repeating their own name
trickster_deals: known for making deals, tricks, or bargains with others
lost_love: lost a spouse, partner, or great love
cursed_burden: carries a curse, entity, or burden inside them they never chose
chosen_one: prophesied, chosen, or destined for their role
saved_world_repeatedly: has saved the world or their people multiple times
unlucky_in_love: famously unlucky in love, divorced, or repeatedly failing at romance
hates_their_job: stuck in a job they hate or are comically bad at
desperate_for_approval: desperately craves approval, attention, or to be liked
delusional_confidence: has confidence wildly out of proportion to their actual ability
workplace_character: primarily defined by their workplace and coworkers
big_ego: famous for an enormous ego or vanity
terrible_boss: is or works for a comically terrible boss
petty: known for holding grudges or being hilariously petty
`.trim()

function cleanWikitext(raw: string): string {
  return raw
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2')
    .replace(/={2,}/g, '')
    .replace(/[']{2,}/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 5000)
}

async function getCharacterContext(name: string): Promise<string> {
  const source = characterSources[name]
  if (!source) return ''
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'AmIGame/1.0' },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return ''
    const data = await res.json()
    if (source.type === 'fandom') {
      const raw = data.parse?.wikitext?.['*'] ?? ''
      if (raw.startsWith('#REDIRECT')) return ''
      return cleanWikitext(raw)
    } else {
      const pages = data.query?.pages
      if (!pages) return ''
      const page = Object.values(pages)[0] as { extract?: string }
      return (page?.extract ?? '').slice(0, 5000)
    }
  } catch {
    return ''
  }
}

async function generateTraits(
  name: string,
  deck: string,
  description: string,
  context: string
): Promise<{ traits: Record<string, boolean>; notable_facts: string[] } | null> {
  const combined = [description, context].filter(Boolean).join('\n\n').slice(0, 5000)
  if (!combined) return null

  try {
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a character trait classifier for a pop culture game. Read the provided text about a character and evaluate each trait as true or false based ONLY on the provided text. If the text does not clearly support true, mark false.

Trait definitions:
${TRAIT_DEFINITIONS}

Also extract 5 notable facts about the character from the text — their most defining, interesting, or surprising characteristics.

Output a JSON object in this exact format:
{
  "traits": { "resurrection": false, "secret_identity": true, ... all 28 traits ... },
  "notable_facts": ["fact one", "fact two", "fact three", "fact four", "fact five"]
}`,
        },
        {
          role: 'user',
          content: `Character: ${name} (${deck})\n\nText:\n${combined}\n\nEvaluate all 28 traits and extract 5 notable facts. Output only the JSON object.`,
        },
      ],
      max_tokens: 700,
      temperature: 0,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? '{}'
    const parsed = JSON.parse(raw) as {
      traits?: Record<string, boolean>
      notable_facts?: string[]
    }
    if (!parsed.traits) return null
    return {
      traits: parsed.traits,
      notable_facts: parsed.notable_facts ?? [],
    }
  } catch (err) {
    console.error(`Trait generation failed for ${name}:`, err)
    return null
  }
}

async function run() {
  const { data: characters } = await supabase
    .from('characters')
    .select('id, name, deck, description')

  if (!characters) {
    console.error('Could not fetch characters')
    return
  }

  console.log(`Generating trait profiles for ${characters.length} characters...`)

  for (const character of characters) {
    // Skip characters that already have traits (allows resuming)
    const { data: existing } = await supabase
      .from('characters')
      .select('traits')
      .eq('id', character.id)
      .single()

    if (existing?.traits && Object.keys(existing.traits).length > 0) {
      console.log(`Skipping ${character.name} — already has traits`)
      continue
    }

    console.log(`Processing: ${character.name} (${character.deck})`)

    const context = await getCharacterContext(character.name)
    const result = await generateTraits(
      character.name,
      character.deck,
      character.description ?? '',
      context
    )

    if (!result) {
      console.log(`✗ ${character.name} — trait generation failed`)
      continue
    }

    const { error } = await supabase
      .from('characters')
      .update({
        traits: result.traits,
        notable_facts: result.notable_facts,
      })
      .eq('id', character.id)

    if (error) {
      console.error(`DB error for ${character.name}:`, error.message)
    } else {
      const trueTraits = Object.entries(result.traits)
        .filter(([, v]) => v)
        .map(([k]) => k)
      console.log(`✓ ${character.name} — traits: [${trueTraits.join(', ')}]`)
    }

    await new Promise(resolve => setTimeout(resolve, 300))
  }

  console.log('Done. Review the traits column in Supabase and correct any errors.')
}

run()