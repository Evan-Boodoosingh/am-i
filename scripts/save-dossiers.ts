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

interface CharacterSource {
  type: 'fandom' | 'wikipedia'
  url: string
}

// PASTE YOUR FULL characterSources MAP HERE (same one as before)
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
    'Gru': { type: 'fandom', url: 'https://despicableme.fandom.com/api.php?action=parse&page=Felonious_Gru&prop=wikitext&format=json&origin=*' },
  'Barbie': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Barbie_(character)&prop=extracts&explaintext=true&format=json&origin=*' },
   'Anakin Skywalker': { type: 'fandom', url: 'https://starwars.fandom.com/api.php?action=parse&page=Anakin_Skywalker&prop=wikitext&format=json&origin=*' },
  'Dominic Toretto': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Dominic_Toretto&prop=extracts&explaintext=true&format=json&origin=*' },
  'Lord Voldemort': { type: 'fandom', url: 'https://harrypotter.fandom.com/api.php?action=parse&page=Tom_Riddle&prop=wikitext&format=json&origin=*' },
  'Miles Morales': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Miles_Morales&prop=extracts&explaintext=true&format=json&origin=*' },
  'Lightning McQueen': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Lightning_McQueen&prop=extracts&explaintext=true&format=json&origin=*' },
    'Pennywise': { type: 'fandom', url: 'https://stephenking.fandom.com/api.php?action=parse&page=It_(Creature)&prop=wikitext&format=json&origin=*' },
  'Peter Parker': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Spider-Man&prop=extracts&explaintext=true&format=json&origin=*' },
  'Walter White': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Walter_White_(Breaking_Bad)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Michael Scott': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Michael_Scott_(The_Office)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Daenerys Targaryen': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Daenerys_Targaryen&prop=extracts&explaintext=true&format=json&origin=*' },
  'Homelander': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Homelander&prop=extracts&explaintext=true&format=json&origin=*' },
 
  
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
  'Frank Reynolds': { type: 'fandom', url: 'https://itsalwayssunny.fandom.com/api.php?action=parse&page=Frank_Reynolds&prop=wikitext&format=json&origin=*' },

  'Kendall Roy': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Kendall_Roy&prop=extracts&explaintext=true&format=json&origin=*' },
  'Rue Bennett': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Rue_Bennett&prop=extracts&explaintext=true&format=json&origin=*' },
  'Steve Harrington': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Steve_Harrington&prop=extracts&explaintext=true&format=json&origin=*' },
  'Darth Vader': { type: 'fandom', url: 'https://starwars.fandom.com/api.php?action=parse&page=Anakin_Skywalker&prop=wikitext&format=json&origin=*' },
  'Hannibal Lecter': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Hannibal_Lecter&prop=extracts&explaintext=true&format=json&origin=*' },
  'Scar': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Scar_(The_Lion_King)&prop=extracts&explaintext=true&format=json&origin=*' },
  'Green Goblin': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Green_Goblin&prop=extracts&explaintext=true&format=json&origin=*' },
  'Plankton': { type: 'fandom', url: 'https://spongebob.fandom.com/api.php?action=parse&page=Sheldon_J._Plankton&prop=wikitext&format=json&origin=*' },
   'Michael Myers': { type: 'fandom', url: 'https://halloween.fandom.com/api.php?action=parse&page=Michael_Myers&prop=wikitext&format=json&origin=*' },
  'Freddy Krueger': { type: 'fandom', url: 'https://villains.fandom.com/api.php?action=parse&page=Freddy_Krueger_(original)&prop=wikitext&format=json&origin=*' },
  'Maleficent': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Maleficent&prop=extracts&explaintext=true&format=json&origin=*' },
  'Loki': { type: 'fandom', url: 'https://marvelcinematicuniverse.fandom.com/api.php?action=parse&page=Loki&prop=wikitext&format=json&origin=*' },
  'Cruella de Vil': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Cruella_de_Vil&prop=extracts&explaintext=true&format=json&origin=*' },
  'Chucky': { type: 'fandom', url: 'https://chucky.fandom.com/api.php?action=parse&page=Chucky&prop=wikitext&format=json&origin=*' },
  'Wicked Witch of the West': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Wicked_Witch_of_the_West&prop=extracts&explaintext=true&format=json&origin=*' },
  'Captain Hook': { type: 'wikipedia', url: 'https://en.wikipedia.org/w/api.php?action=query&titles=Captain_Hook&prop=extracts&explaintext=true&format=json&origin=*' },
  'Kylo Ren': { type: 'fandom', url: 'https://starwars.fandom.com/api.php?action=parse&page=Ben_Solo&prop=wikitext&format=json&origin=*' },
}

// Iteratively strip nested {{templates}} until none remain — fixes infobox junk
function stripTemplates(text: string): string {
  let prev = ''
  let current = text
  while (prev !== current) {
    prev = current
    current = current.replace(/\{\{[^{}]*\}\}/g, '')
  }
  return current
}

function cleanWikitext(raw: string): string {
  let text = stripTemplates(raw)
  text = text
    .replace(/\[\[File:[^\]]*\]\]/gi, '')
    .replace(/\[\[Category:[^\]]*\]\]/gi, '')
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/={2,}/g, '')
    .replace(/[']{2,}/g, '')
    .replace(/\|[^\n]*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text.slice(0, 6000)
}

async function fetchRaw(
  name: string
): Promise<{ text: string; reason?: string }> {
  const source = characterSources[name]
  if (!source) return { text: '', reason: 'NO SOURCE URL MAPPED' }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'AmIGame/1.0' },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return { text: '', reason: `HTTP ${res.status}` }
    const data = await res.json()
    if (source.type === 'fandom') {
      const raw = data.parse?.wikitext?.['*'] ?? ''
      if (!raw) return { text: '', reason: 'EMPTY WIKITEXT' }
      if (raw.startsWith('#REDIRECT')) return { text: '', reason: `REDIRECT PAGE — URL needs fixing: ${raw.slice(0, 80)}` }
      return { text: cleanWikitext(raw) }
    } else {
      const pages = data.query?.pages
      if (!pages) return { text: '', reason: 'NO PAGES IN RESPONSE' }
      const page = Object.values(pages)[0] as { extract?: string }
      const extract = page?.extract ?? ''
      if (!extract) return { text: '', reason: 'EMPTY WIKIPEDIA EXTRACT' }
      return { text: extract.slice(0, 6000) }
    }
  } catch {
    return { text: '', reason: 'FETCH TIMEOUT/NETWORK — re-run to retry' }
  }
}

// Normalize every character into the SAME dossier structure
async function normalizeDossier(
  name: string,
  deck: string,
  description: string,
  rawText: string
): Promise<string | null> {
  const combined = [description, rawText].filter(Boolean).join('\n\n').slice(0, 10000)
  if (!combined) return null

  try {
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You convert messy character wiki text into a clean standardized dossier. Use ONLY information from the provided text. If a section has no information in the text, write "Unknown."

Output EXACTLY this structure, plain text, no markdown:

IDENTITY: [species/type, age or apparent age, physical form in 1-2 sentences]
ORIGIN: [how they came to be who they are — birth, creation, transformation, key origin events]
FAMILY & LOVED ONES: [parents, siblings, partners, children, closest friends — including losses]
PERSONALITY: [core temperament, how they treat others, notable quirks]
DRIVES: [what motivates them — goals, obsessions, fears, traumas]
ABILITIES: [powers, skills, signature weapons or items]
STORY EVENTS: [the most famous things that happen to or because of them — deaths, resurrections, betrayals, victories, transformations]
ROLE: [hero/villain/other, occupation, who they lead or serve, where they live or protect]`,
        },
        {
          role: 'user',
          content: `Character: ${name} (${deck})

Raw text:
${combined}

Write the standardized dossier. Output only the dossier.`,
        },
      ],
      max_tokens: 700,
      temperature: 0,
    })
    return completion.choices[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

async function run() {
  const { data: characters } = await supabase
    .from('characters')
    .select('id, name, deck, description, wiki_dossier')

  if (!characters) {
    console.error('Could not fetch characters')
    return
  }

  console.log(`Building normalized dossiers for ${characters.length} characters...`)

  const failures: string[] = []

  for (const character of characters) {
    if (character.wiki_dossier && character.wiki_dossier.length > 200) {
      console.log(`Skipping ${character.name} — dossier exists`)
      continue
    }

    const { text, reason } = await fetchRaw(character.name)

    if (!text || text.length < 200) {
      console.log(`✗ ${character.name} — ${reason ?? `too thin (${text.length} chars)`}`)
      failures.push(`${character.name}: ${reason}`)
      continue
    }

    const dossier = await normalizeDossier(
      character.name,
      character.deck,
      character.description ?? '',
      text
    )

    if (!dossier || dossier.length < 200) {
      console.log(`✗ ${character.name} — normalization failed`)
      failures.push(`${character.name}: normalization failed`)
      continue
    }

    const { error } = await supabase
      .from('characters')
      .update({ wiki_dossier: dossier })
      .eq('id', character.id)

    if (error) {
      console.error(`DB error for ${character.name}:`, error.message)
    } else {
      console.log(`✓ ${character.name} — ${dossier.length} chars, normalized`)
    }

    await new Promise(resolve => setTimeout(resolve, 300))
  }

  console.log('\nDone.')
  if (failures.length > 0) {
    console.log('FAILURES — paste this list back to Claude:')
    failures.forEach(f => console.log(`  ${f}`))
  }
}

run()