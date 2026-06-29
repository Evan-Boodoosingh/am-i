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

const characters: { name: string; deck: string }[] = [
  // ANIME
  { name: 'Satoru Gojo', deck: 'anime' },
  { name: 'Dio Brando', deck: 'anime' },
  { name: 'Light Yagami', deck: 'anime' },
  { name: 'Naruto Uzumaki', deck: 'anime' },
  { name: 'Monkey D. Luffy', deck: 'anime' },
  { name: 'Ichigo Kurosaki', deck: 'anime' },
  { name: 'Itachi Uchiha', deck: 'anime' },
  { name: 'Sosuke Aizen', deck: 'anime' },
  { name: 'Roronoa Zoro', deck: 'anime' },
  { name: 'Hisoka Morow', deck: 'anime' },
  { name: 'Goku', deck: 'anime' },
  { name: 'Levi Ackerman', deck: 'anime' },
  { name: 'Makima', deck: 'anime' },
  { name: 'Anya Forger', deck: 'anime' },
  { name: 'Rem', deck: 'anime' },
  { name: 'Seto Kaiba', deck: 'anime' },
  { name: 'Saitama', deck: 'anime' },
  { name: 'All Might', deck: 'anime' },
  { name: 'Ash Ketchum', deck: 'anime' },
  { name: 'Edward Elric', deck: 'anime' },

  // MOVIES
  { name: 'Shrek', deck: 'movies' },
  { name: 'Tony Stark', deck: 'movies' },
  { name: 'The Joker', deck: 'movies' },
  { name: 'Captain Jack Sparrow', deck: 'movies' },
  { name: 'Thanos', deck: 'movies' },
  { name: 'Harry Potter', deck: 'movies' },
  { name: 'Edward Cullen', deck: 'movies' },
  { name: 'Katniss Everdeen', deck: 'movies' },
  { name: 'Gollum', deck: 'movies' },
  { name: 'Patrick Bateman', deck: 'movies' },
  { name: 'John Wick', deck: 'movies' },
  { name: 'Gru', deck: 'movies' },
  { name: 'Barbie', deck: 'movies' },
  { name: 'Anakin Skywalker', deck: 'movies' },
  { name: 'Dominic Toretto', deck: 'movies' },
  { name: 'Lord Voldemort', deck: 'movies' },
  { name: 'Miles Morales', deck: 'movies' },
  { name: 'Lightning McQueen', deck: 'movies' },
  { name: 'Pennywise', deck: 'movies' },
  { name: 'Peter Parker', deck: 'movies' },

  // TV SHOWS
  { name: 'Walter White', deck: 'tv' },
  { name: 'Michael Scott', deck: 'tv' },
  { name: 'Daenerys Targaryen', deck: 'tv' },
  { name: 'Homelander', deck: 'tv' },
  { name: 'Negan', deck: 'tv' },
  { name: 'Barney Stinson', deck: 'tv' },
  { name: 'Ron Swanson', deck: 'tv' },
  { name: 'Tony Soprano', deck: 'tv' },
  { name: 'Eleven', deck: 'tv' },
  { name: 'Saul Goodman', deck: 'tv' },
  { name: 'Ross Geller', deck: 'tv' },
  { name: 'Joffrey Baratheon', deck: 'tv' },
  { name: 'Dexter Morgan', deck: 'tv' },
  { name: 'Sue Sylvester', deck: 'tv' },
  { name: 'Dr. Gregory House', deck: 'tv' },
  { name: 'Dean Winchester', deck: 'tv' },
  { name: 'Frank Reynolds', deck: 'tv' },
  { name: 'Kendall Roy', deck: 'tv' },
  { name: 'Rue Bennett', deck: 'tv' },
  { name: 'Steve Harrington', deck: 'tv' },

  // CARTOONS
  { name: 'SpongeBob SquarePants', deck: 'cartoons' },
  { name: 'Squidward Tentacles', deck: 'cartoons' },
  { name: 'Timmy Turner', deck: 'cartoons' },
  { name: 'Danny Phantom', deck: 'cartoons' },
  { name: 'Jimmy Neutron', deck: 'cartoons' },
  { name: 'Aang', deck: 'cartoons' },
  { name: 'Prince Zuko', deck: 'cartoons' },
  { name: 'Perry the Platypus', deck: 'cartoons' },
  { name: 'Dr. Doofenshmirtz', deck: 'cartoons' },
  { name: 'Bill Cipher', deck: 'cartoons' },
  { name: 'Ben Tennyson', deck: 'cartoons' },
  { name: 'Finn the Human', deck: 'cartoons' },
  { name: 'Mordecai', deck: 'cartoons' },
  { name: 'Raven', deck: 'cartoons' },
  { name: 'Mojo Jojo', deck: 'cartoons' },
  { name: 'Courage the Cowardly Dog', deck: 'cartoons' },
  { name: 'Grim', deck: 'cartoons' },
  { name: 'Shego', deck: 'cartoons' },
  { name: 'Scooby-Doo', deck: 'cartoons' },
  { name: 'Ed', deck: 'cartoons' },

  // GAMES
  { name: 'Pikachu', deck: 'games' },
  { name: 'Mario', deck: 'games' },
  { name: 'Kirby', deck: 'games' },
  { name: 'Sonic the Hedgehog', deck: 'games' },
  { name: 'Donkey Kong', deck: 'games' },
  { name: 'Trevor Philips', deck: 'games' },
  { name: 'Link', deck: 'games' },
  { name: 'Bowser', deck: 'games' },
  { name: 'Master Chief', deck: 'games' },
  { name: 'Kratos', deck: 'games' },
  { name: 'Creeper', deck: 'games' },
  { name: 'Pac-Man', deck: 'games' },
  { name: 'Sans', deck: 'games' },
  { name: 'Steve', deck: 'games' },
  { name: 'Scorpion', deck: 'games' },
  { name: 'CJ', deck: 'games' },
  { name: 'Isabelle', deck: 'games' },
  { name: 'Mewtwo', deck: 'games' },
  { name: 'Sephiroth', deck: 'games' },
  { name: 'Crash Bandicoot', deck: 'games' },

  // VILLAINS
  { name: 'Darth Vader', deck: 'villains' },
  { name: 'The Joker', deck: 'villains' },
  { name: 'Thanos', deck: 'villains' },
  { name: 'Lord Voldemort', deck: 'villains' },
  { name: 'Hannibal Lecter', deck: 'villains' },
  { name: 'Scar', deck: 'villains' },
  { name: 'Green Goblin', deck: 'villains' },
  { name: 'Bowser', deck: 'villains' },
  { name: 'Plankton', deck: 'villains' },
  { name: 'Michael Myers', deck: 'villains' },
  { name: 'Freddy Krueger', deck: 'villains' },
  { name: 'Maleficent', deck: 'villains' },
  { name: 'Loki', deck: 'villains' },
  { name: 'Pennywise', deck: 'villains' },
  { name: 'Cruella de Vil', deck: 'villains' },
  { name: 'Gollum', deck: 'villains' },
  { name: 'Chucky', deck: 'villains' },
  { name: 'Wicked Witch of the West', deck: 'villains' },
  { name: 'Captain Hook', deck: 'villains' },
  { name: 'Kylo Ren', deck: 'villains' },
]

async function getDescription(name: string, deck: string): Promise<string> {
  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: `You are a writer for a pop culture deduction card game called "Am I?" where two players are each assigned a character. Each player can see their opponent's character card but not their own. Players ask yes or no questions to figure out who they are.

The description on each card helps the player who CAN see it answer yes or no questions accurately about their opponent's character.

Rules:
- Third person only ("This character", "They", "Their")
- One paragraph, no line breaks, no bullet points
- Start with the show, movie, or game title — you may reference the title even if it matches the character's name
- Include personality, iconic traits, meme-worthy moments, and one signature ability or moment
- Be factually accurate — do not misrepresent the character's age, role, species, or relationships
- Under 80 words
- Be specific enough that someone could confidently answer yes or no questions about this character

Examples of good descriptions:

"From the Nickelodeon cartoon SpongeBob SquarePants, this tiny one-eyed restaurant owner has dedicated their entire existence to stealing a secret recipe from a rival. Obsessed, dramatic, and perpetually failing, they became a beloved internet meme for hilariously over-the-top evil plans and a surprisingly wholesome relationship with their computer wife Karen."

"From the Nickelodeon animated series Avatar The Last Airbender, this 12-year-old airbender carries the weight of the entire world on his shoulders as the only person capable of mastering all four elements. Cheerful and playful despite the pressure, their flying bison and signature monk arrow tattoo are instantly recognizable across generations of fans."

"From the anime series Jujutsu Kaisen, this silver-haired sorcerer is widely considered the strongest in the world and never lets anyone forget it. Effortlessly cool, blindfolded in battle, and with a smile that has launched a thousand memes, their overwhelming power and carefree attitude made them an instant fan favorite from their very first appearance."

"From the DreamWorks animated film Shrek, this green ogre just wants to live alone in his swamp but keeps getting dragged into fairy tale adventures. Grumpy on the outside but deeply loyal underneath, their love story with a princess and iconic partnership with a talking donkey turned them into one of the most beloved and memed characters in internet history."

"From the God of War video game series, this Spartan warrior turned god-slayer has spent decades violently murdering every deity he encounters across multiple mythologies. Bald, covered in ash-white skin, and carrying legendary blades chained to his arms, their journey from rage-fueled antihero to reluctant father figure became one of gaming's most celebrated character arcs."`,
      },
      {
        role: 'user',
        content: `Write a description for: ${name} (from the ${deck} category)`,
      },
    ],
    max_tokens: 200,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content?.trim() ?? ''
}

async function ingest() {
  console.log(`Starting description update for ${characters.length} characters...`)

  const { data: existing } = await supabase
    .from('characters')
    .select('name')
    .not('description', 'is', null)

  const existingNames = new Set((existing ?? []).map((c: { name: string }) => c.name))
  console.log(`Found ${existingNames.size} characters already with descriptions. Skipping those.`)

  for (const character of characters) {
    if (existingNames.has(character.name)) {
      console.log(`Skipping ${character.name} — already has description`)
      continue
    }

    try {
      console.log(`Processing: ${character.name} (${character.deck})`)

      const description = await getDescription(character.name, character.deck)

      const { error } = await supabase
        .from('characters')
        .update({ description })
        .eq('name', character.name)
        .eq('deck', character.deck)

      if (error) {
        console.error(`Error updating ${character.name}:`, error.message)
      } else {
        console.log(`✓ ${character.name}`)
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      console.error(`Failed: ${character.name}`, err)
    }
  }

  console.log('Done.')
}

ingest()