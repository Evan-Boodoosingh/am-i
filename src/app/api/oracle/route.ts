import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const llm = new OpenAI({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  apiKey: process.env.GEMINI_API_KEY!,
})

const MODEL = 'gemini-3.6-flash'

// GLOBAL THROTTLE + RETRY.
// Every LLM call in this route funnels through callLLM, and callLLM funnels
// through a single serial queue. No two calls ever run at the same time, and
// a minimum gap is enforced between the START of one call and the next. This
// makes it physically impossible to burst the rate limiter, which is what was
// tripping the 429s: one round fires ~10 calls, and firing them in parallel
// looked like an attack even when the per-minute budget had room.

// Allow up to MAX_CONCURRENT calls at once. Paid tier 1 permits ~1000
// req/min, so a handful in flight together is safe and collapses a round's
// slow sequential calls into a few parallel waits. A tiny stagger avoids a
// hard simultaneous burst.
const MAX_CONCURRENT = 4
const STAGGER_MS = 100
let inFlight = 0
const waiters: (() => void)[] = []
let lastStart = 0

async function throttle<T>(job: () => Promise<T>): Promise<T> {
  if (inFlight >= MAX_CONCURRENT) {
    await new Promise<void>(resolve => waiters.push(resolve))
  }
  inFlight++
  const now = Date.now()
  const wait = Math.max(0, lastStart + STAGGER_MS - now)
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastStart = Date.now()
  try {
    return await job()
  } finally {
    inFlight--
    const next = waiters.shift()
    if (next) next()
  }
}

// Retries any call that still comes back 429, waiting longer each time.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callLLM(params: any): Promise<any> {
  const delays = [500, 1000, 2000, 4000]
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await throttle(() => llm.chat.completions.create(params))
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status
      if (status === 429 && attempt < delays.length) {
        console.log(`  [rate limited, waiting ${delays[attempt]}ms]`)
        await new Promise(r => setTimeout(r, delays[attempt]))
        continue
      }
      throw err
    }
  }
}


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TRAIT_LABELS: Record<string, { label: string; tier: number }> = {
  says_own_name: { label: 'both mostly just say their own name', tier: 1 },
  scaredy_cat: { label: 'both are famous scaredy-cats', tier: 1 },
  food_obsessed: { label: 'both think with their stomach', tier: 1 },
  silent_type: { label: 'both almost never speak', tier: 1 },
  resurrection: { label: 'both have died and come back to life', tier: 1 },
  protects_younger_sibling: { label: 'both would do anything for their younger sibling', tier: 1 },
  school_secret_life: { label: 'both juggle school with a secret second life', tier: 1 },
  trickster_deals: { label: 'both love making deals you will regret', tier: 1 },
  lazy: { label: 'both are famously lazy', tier: 1 },
  lab_experiment: { label: 'both were made in a lab', tier: 1 },
  immortal_or_ageless: { label: 'both have been alive far longer than they should be', tier: 1 },
  cursed_burden: { label: 'both carry something inside them they never asked for', tier: 1 },
  lost_love: { label: 'both lost the love of their life', tier: 1 },
  addiction: { label: 'both struggle with something they cannot control', tier: 1 },
  unlucky_in_love: { label: 'both are hopeless at love', tier: 1 },
  delusional_confidence: { label: 'both have confidence their abilities cannot cash', tier: 1 },
  petty: { label: 'both hold legendary grudges', tier: 1 },
  royalty: { label: 'both are royalty', tier: 2 },
  deadpan: { label: 'both are famous for their deadpan delivery', tier: 2 },
  adopted_orphan: { label: 'both were raised by someone other than their birth parents', tier: 2 },
  villain_to_hero: { label: 'both started as the villain before becoming beloved', tier: 2 },
  redemption_arc: { label: 'both went through a major redemption arc', tier: 2 },
  created_transformed: { label: 'both were transformed against their will', tier: 2 },
  mask_pain: { label: 'both refuse to let anyone see their real pain', tier: 2 },
  revenge_driven: { label: 'both are driven by revenge', tier: 2 },
  transformation_form: { label: 'both have a far more powerful transformed state', tier: 2 },
  secret_identity: { label: 'both hide their true identity from the world', tier: 2 },
  double_life: { label: 'both live a double life', tier: 2 },
  animal_companion: { label: 'both are never far from a loyal animal companion', tier: 2 },
  iconic_duo: { label: 'both are inseparable from one famous best friend', tier: 2 },
  chosen_one: { label: 'both were chosen or prophesied for their role', tier: 2 },
  saved_world_repeatedly: { label: 'both have saved the world more than once', tier: 2 },
  neglected: { label: 'both were failed by the adults meant to protect them', tier: 2 },
  crime_world: { label: 'both operate deep in the criminal world', tier: 2 },
  rich: { label: 'both are absurdly rich', tier: 2 },
  obsession: { label: 'both are consumed by a single obsession', tier: 2 },
  lost_family: { label: 'both lost family that shaped who they became', tier: 2 },
  sacrifice: { label: 'both sacrificed everything for someone they love', tier: 2 },
  manipulator: { label: 'both are master manipulators', tier: 2 },
  reluctant_hero: { label: 'both never asked for their role but accepted it', tier: 2 },
  iconic_weapon: { label: 'both are famous for one signature weapon', tier: 2 },
  desperate_for_approval: { label: 'both just want everyone to like them', tier: 2 },
  hates_their_job: { label: 'both are trapped in a job they cannot stand', tier: 2 },
  terrible_boss: { label: 'both know the pain of a terrible boss', tier: 2 },
  big_ego: { label: 'both have egos with their own zip code', tier: 2 },
  genius: { label: 'both are certified geniuses', tier: 3 },
  underdog: { label: 'both are underdogs everyone underestimated', tier: 3 },
  extremely_powerful: { label: 'both are among the strongest in their world', tier: 3 },
  world_threat: { label: 'both hold power that could end worlds', tier: 3 },
  feared_by_enemies: { label: 'both are feared by everyone who crosses them', tier: 3 },
  loyal_found_family: { label: 'both are fiercely loyal to their chosen family', tier: 3 },
  leader: { label: 'both lead others who follow them', tier: 3 },
  trauma_driven: { label: 'both are driven by a traumatic past', tier: 3 },
  protects_hometown: { label: 'both protect their home from constant threats', tier: 3 },
  non_human: { label: 'both are not human', tier: 3 },
  villain: { label: 'both are the villain of their story', tier: 3 },
  comedic: { label: 'both are beloved for making people laugh', tier: 3 },
  workplace_character: { label: 'both are inseparable from their workplace', tier: 3 },
}

const FALLBACKS = [
  'Both of your characters have left a permanent mark on pop culture.',
  'Both of your characters are instantly recognizable around the world.',
  'Both of your characters have inspired countless memes and imitations.',
]

const STYLE_SEEDS = [
  'Make it sound like a dramatic movie-trailer line.',
  'Make it playful, almost teasing the players.',
  'Make it dry and matter-of-fact, like a deadpan host.',
  'Make it sound like a juicy piece of gossip.',
  'Make it short, punchy, and confident.',
  'Make it sound slightly ominous.',
  'Make it warm, like a host who loves these characters.',
  'Make it sound like the setup to a joke.',
]

interface CharacterRow {
  name: string
  traits: Record<string, boolean> | null
  wiki_dossier: string | null
}

function genericFallback(): string {
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)]
}

// STAGE A — UNFENCED comparer: proposes up to THREE ranked candidate
// connections from its own knowledge, pages attached as reference.
async function findConnections(
  nameOne: string,
  nameTwo: string,
  pageOne: string,
  pageTwo: string
): Promise<string[]> {
  try {
    const completion = await callLLM({
      model: MODEL,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a pop culture expert with encyclopedic knowledge. You will be given two characters. Using EVERYTHING you know about them — their stories, deaths, resurrections, tournaments, relationships, famous moments — find the most SURPRISING and SPECIFIC true connections between them.

The gold standard: Goku and Jesus Christ — "both have died and been resurrected." Surprising, specific, true for both, recognizable to casual fans.

Requirements:
- SYMMETRY IS MANDATORY: each connection must be the SAME fact, independently true for each character. Never project one character's fact onto the other. If only one of them had their dog killed, that is NOT a connection.
- IN-STORY FACTS ONLY: connections must be about the character's life inside their story — events, relationships, abilities, losses, habits. NEVER about the franchise or audience: being a protagonist, mascot, fan favorite, iconic, popular, or famous does NOT count.
- Must be recognizable to a casual fan of each story — no obscure deep-lore
- Prefer surprising and specific over generic
- Propose up to THREE candidates, ranked most surprising and specific first. It is better to include a solid safe connection as your third candidate than three risky ones.
- Keep each candidate under 25 words. Be concise.
- If you cannot find even one honest connection, return an empty list.

Output JSON: {"connections": ["best candidate", "second candidate", "third candidate"]}`,
        },
        {
          role: 'user',
          content: `CHARACTER ONE: ${nameOne}

Reference page:
${pageOne.slice(0, 20000)}

CHARACTER TWO: ${nameTwo}

Reference page:
${pageTwo.slice(0, 20000)}

Propose up to three ranked candidate connections. Output only the JSON object.`,
        },
      ],
      max_tokens: 8000,
      temperature: 0.7,
    })
    console.log(`  [findConnections finish_reason: ${completion.choices[0]?.finish_reason}]`)
    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) {
      console.error('findConnections: empty response from model')
      return []
    }
    let parsed: { connections?: string[] }
    try {
      parsed = JSON.parse(raw)
    } catch {
      console.error('findConnections: malformed JSON:', raw)
      return []
    }
    return (parsed.connections ?? [])
      .map(c => c?.trim())
      .filter((c): c is string => !!c && c.toUpperCase() !== 'NONE')
      .slice(0, 3)
  } catch (err) {
    console.error('findConnections error:', err)
    return []
  }
}

// STAGE B — writer phrases the verified connection
async function writeAnnouncement(connection: string): Promise<string | null> {
  const style = STYLE_SEEDS[Math.floor(Math.random() * STYLE_SEEDS.length)]
  try {
    const completion = await callLLM({
      model: MODEL,
      reasoning_effort: 'low',
      messages: [
        {
          role: 'system',
          content: `You are the witty host of a pop culture guessing game called "Am I?" You announce one true connection between two secret characters.

You will receive the verified connection. Express it — nothing more, nothing less.

RULES:
- Express ONLY the given connection. Add no other claims, no exaggerations, no hyperbole beyond what the connection states.
- EVERY WORD of your line must be true for BOTH characters equally. Never add a joke, image, or detail that fits only one of them.
- Keep the SPECIFIC detail of the connection — do not water it down into something vaguer.
- Never include names, source titles, places, or any detail that identifies either character.
- Maximum 14 words, starting with "Both of your characters..."
- ${style}
- Output only the announcement`,
        },
        {
          role: 'user',
          content: `Verified connection: ${connection}

Write the announcement.`,
        },
      ],
      max_tokens: 2000,
      temperature: 1.0,
    })
    return completion.choices[0]?.message?.content?.trim() ?? null
  } catch (err) {
    console.error('writeAnnouncement error:', err)
    return null
  }
}

// Candidate verification against the FULL wiki page, with reasoning.
async function verifyAgainstPage(
  claim: string,
  name: string,
  page: string
): Promise<{ ok: boolean; reason: string }> {
  try {
    const completion = await callLLM({
      model: MODEL,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a fact checker. You will be given a character's full wiki page and a claim about them.

IMPORTANT CONTEXT: The claim refers to TWO different secret characters. Judge ONLY whether it is true for THIS character. The word "both" does NOT require this page to mention any other character — ignore it and evaluate the claim as it applies to this character alone.

Verdict rules:
- Dramatic tone and wordplay are fine, but do NOT reinterpret concrete factual events as metaphors. If the claim asserts a specific event or action (trained someone, cloned, died, killed someone, faked their death, was expelled, married, had a pet killed), that event must be literally supported by the page for THIS character. If it is not, answer NO.
- Answer NO if the claim contradicts the page or asserts a specific fact about this character the page does not support.
- Otherwise answer YES.

Output JSON: {"verdict": "YES" or "NO", "reason": "under 15 words explaining your verdict"}`,
        },
        {
          role: 'user',
          content: `WIKI PAGE for ${name}:
${page.slice(0, 20000)}

Claim: "${claim}"

Output only the JSON object.`,
        },
      ],
      max_tokens: 8000,
      temperature: 0,
    })
    console.log(`  [verifyAgainstPage finish_reason: ${completion.choices[0]?.finish_reason}]`)
    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) {
      console.error('verifyAgainstPage: empty response from model')
      return { ok: false, reason: 'empty response from verifier' }
    }
    let parsed: { verdict?: string; reason?: string }
    try {
      parsed = JSON.parse(raw)
    } catch {
      console.error('verifyAgainstPage: malformed JSON:', raw)
      return { ok: false, reason: 'malformed verifier response' }
    }
    return {
      ok: parsed.verdict?.toUpperCase().startsWith('YES') ?? false,
      reason: parsed.reason ?? 'no reason given',
    }
  } catch (err) {
    console.error('verifyAgainstPage error:', err)
    return { ok: false, reason: 'verifier call failed' }
  }
}

// Line check: the connection is ALREADY verified — this only catches NEW
// claims or exaggerations the writer added beyond the connection.
async function verifyLineAddsNothing(
  line: string,
  connection: string,
  name: string,
  page: string
): Promise<{ ok: boolean; reason: string }> {
  try {
    const completion = await callLLM({
      model: MODEL,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a quality checker for a guessing game. The following connection has ALREADY been fact-checked and confirmed true for this character — do NOT re-judge it:

CONFIRMED CONNECTION: "${connection}"

You will be given a stylized announcement based on that connection, plus the character's wiki page. Your ONLY job: check whether the announcement adds any NEW claim, exaggeration, or intensification beyond the confirmed connection that is false or unsupported for THIS character (e.g. the connection says "protects their family" but the line says "would burn the world" — that is an added claim).

The announcement mentions two characters; judge only THIS one. Stylistic rephrasing of the confirmed connection is always acceptable.

Output JSON: {"verdict": "YES" if the line adds nothing false or unsupported, "NO" if it does, "reason": "under 15 words"}`,
        },
        {
          role: 'user',
          content: `WIKI PAGE for ${name}:
${page.slice(0, 20000)}

Announcement: "${line}"

Output only the JSON object.`,
        },
      ],
      max_tokens: 8000,
      temperature: 0,
    })
    console.log(`  [verifyLineAddsNothing finish_reason: ${completion.choices[0]?.finish_reason}]`)
    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) {
      console.error('verifyLineAddsNothing: empty response from model')
      return { ok: false, reason: 'empty response from checker' }
    }
    let parsed: { verdict?: string; reason?: string }
    try {
      parsed = JSON.parse(raw)
    } catch {
      console.error('verifyLineAddsNothing: malformed JSON:', raw)
      return { ok: false, reason: 'malformed checker response' }
    }
    return {
      ok: parsed.verdict?.toUpperCase().startsWith('YES') ?? false,
      reason: parsed.reason ?? 'no reason given',
    }
  } catch (err) {
    console.error('verifyLineAddsNothing error:', err)
    return { ok: false, reason: 'line check failed' }
  }
}

// Reviewer: identity leaks, drift, asymmetry; one repair max
async function reviewAndRepair(
  claim: string,
  connection: string
): Promise<{ verdict: 'PASS' | 'REPAIRED' | 'REJECT'; line?: string }> {
  try {
    const completion = await callLLM({
      model: MODEL,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are the final quality gate for a guessing game announcement about two secret characters. Players must NOT be able to identify the characters from the line.

Check for three problems:
1. IDENTIFYING DETAILS: unique items, places, catchphrases, or combos so specific they point to one famous character.
2. DRIFT: the line fails to express the intended connection.
3. ASYMMETRY: any word, image, or joke in the line that applies to only ONE of the two characters rather than both equally.

Decide:
- Clean and on-target: {"verdict": "PASS"}
- Fixable flaw: rewrite it (max 14 words, start with "Both of your characters...", express the intended connection, true for both equally, no identifying details) -> {"verdict": "REPAIRED", "line": "your rewrite"}
- Unsalvageable: {"verdict": "REJECT"}

Output only the JSON object.`,
        },
        {
          role: 'user',
          content: `Intended connection: ${connection}

Announcement: "${claim}"

Review and output the JSON verdict.`,
        },
      ],
      max_tokens: 8000,
      temperature: 0,
    })
    console.log(`  [reviewAndRepair finish_reason: ${completion.choices[0]?.finish_reason}]`)
    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) {
      console.error('reviewAndRepair: empty response from model')
      return { verdict: 'REJECT' }
    }
    let parsed: { verdict?: string; line?: string }
    try {
      parsed = JSON.parse(raw)
    } catch {
      console.error('reviewAndRepair: malformed JSON:', raw)
      return { verdict: 'REJECT' }
    }
    if (parsed.verdict === 'PASS') return { verdict: 'PASS' }
    if (parsed.verdict === 'REPAIRED' && parsed.line) return { verdict: 'REPAIRED', line: parsed.line.trim() }
    return { verdict: 'REJECT' }
  } catch (err) {
    console.error('reviewAndRepair error:', err)
    return { verdict: 'REJECT' }
  }
}

function leaksIdentity(claim: string, nameOne: string, nameTwo: string): boolean {
  const lower = claim.toLowerCase()
  const nameParts = [...nameOne.split(' '), ...nameTwo.split(' ')]
    .map(p => p.toLowerCase())
    .filter(p => p.length > 3)
  return nameParts.some(part => lower.includes(part))
}

// Verified fallback: trait-based fallback lines get fact-checked before shipping.
async function shipFallback(
  traitFallback: string | null,
  characterOne: string,
  characterTwo: string,
  pageOne: string,
  pageTwo: string
): Promise<string> {
  if (!traitFallback) return genericFallback()
  if (!pageOne || !pageTwo) return traitFallback

  const fOne = await verifyAgainstPage(traitFallback, characterOne, pageOne)
  const fTwo = await verifyAgainstPage(traitFallback, characterTwo, pageTwo)
  console.log(`Fallback verified — ${characterOne}: ${fOne.ok} (${fOne.reason})`)
  console.log(`Fallback verified — ${characterTwo}: ${fTwo.ok} (${fTwo.reason})`)

  if (fOne.ok && fTwo.ok) return traitFallback

  console.log(`Trait fallback failed verification — check this pair's trait booleans in Supabase. Using generic line.`)
  return genericFallback()
}

// Try to turn one verified connection into a shippable line.
async function attemptLine(
  connection: string,
  characterOne: string,
  characterTwo: string,
  pageOne: string,
  pageTwo: string
): Promise<string | null> {
  const line = await writeAnnouncement(connection)
  if (!line || leaksIdentity(line, characterOne, characterTwo)) {
    console.log(`  Writer failed or leaked name for this candidate`)
    return null
  }
  console.log(`  Generated: "${line}"`)

  const resOne = await verifyLineAddsNothing(line, connection, characterOne, pageOne)
  const resTwo = await verifyLineAddsNothing(line, connection, characterTwo, pageTwo)
  console.log(`  Line check — ${characterOne}: ${resOne.ok} (${resOne.reason})`)
  console.log(`  Line check — ${characterTwo}: ${resTwo.ok} (${resTwo.reason})`)

  if (!resOne.ok || !resTwo.ok) return null

  const review = await reviewAndRepair(line, connection)
  console.log(`  Review verdict: ${review.verdict}`)

  if (review.verdict === 'PASS') return line

  if (review.verdict === 'REPAIRED' && review.line) {
    const repaired = review.line
    if (leaksIdentity(repaired, characterOne, characterTwo)) return null
    console.log(`  Repaired to: "${repaired}"`)
    const rOne = await verifyLineAddsNothing(repaired, connection, characterOne, pageOne)
    const rTwo = await verifyLineAddsNothing(repaired, connection, characterTwo, pageTwo)
    console.log(`  Repair check — ${characterOne}: ${rOne.ok} (${rOne.reason})`)
    console.log(`  Repair check — ${characterTwo}: ${rTwo.ok} (${rTwo.reason})`)
    if (rOne.ok && rTwo.ok) return repaired
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const { characterOne, characterTwo } = await req.json()

    const { data: rows, error } = await supabase
      .from('characters')
      .select('name, traits, wiki_dossier')
      .in('name', [characterOne, characterTwo])

    if (error || !rows || rows.length < 2) {
      return NextResponse.json({ prompt: genericFallback() })
    }

    const charOne = rows.find((r: CharacterRow) => r.name === characterOne)
    const charTwo = rows.find((r: CharacterRow) => r.name === characterTwo)

    const traitsOne = charOne?.traits ?? {}
    const traitsTwo = charTwo?.traits ?? {}
    const pageOne = charOne?.wiki_dossier ?? ''
    const pageTwo = charTwo?.wiki_dossier ?? ''

    const shared = Object.keys(TRAIT_LABELS)
      .filter(key => traitsOne[key] === true && traitsTwo[key] === true)
      .sort((a, b) => TRAIT_LABELS[a].tier - TRAIT_LABELS[b].tier)

    console.log(`\n=== ORACLE ===`)
    console.log(`Pair: ${characterOne} vs ${characterTwo}`)
    console.log(`Shared traits:`, shared)

    const traitFallback =
      shared.length > 0
        ? `Both of your characters ${TRAIT_LABELS[shared[0]].label.replace(/^both /, '')}.`
        : null

    if (!pageOne || !pageTwo) {
      console.log(`Missing wiki page — fallback\n`)
      return NextResponse.json({
        prompt: await shipFallback(traitFallback, characterOne, characterTwo, pageOne, pageTwo),
      })
    }

    // STAGE A — propose up to three candidate connections
    const candidates = await findConnections(characterOne, characterTwo, pageOne, pageTwo)
    console.log(`Candidates:`, candidates)

    if (candidates.length === 0) {
      console.log(`No candidates — fallback\n`)
      return NextResponse.json({
        prompt: await shipFallback(traitFallback, characterOne, characterTwo, pageOne, pageTwo),
      })
    }

    // STAGE A2 — verify all candidates against both pages in parallel.
    // The throttle pool caps how many actually run at once.
    const candidateChecks = await Promise.all(
      candidates.map(async candidate => {
        const [cOne, cTwo] = await Promise.all([
          verifyAgainstPage(candidate, characterOne, pageOne),
          verifyAgainstPage(candidate, characterTwo, pageTwo),
        ])
        return { candidate, cOne, cTwo, ok: cOne.ok && cTwo.ok }
      })
    )

    for (const check of candidateChecks) {
      console.log(`Candidate: "${check.candidate}"`)
      console.log(`  ${characterOne}: ${check.cOne.ok} (${check.cOne.reason})`)
      console.log(`  ${characterTwo}: ${check.cTwo.ok} (${check.cTwo.reason})`)
    }

    const verified = candidateChecks.filter(c => c.ok)

    if (verified.length === 0) {
      console.log(`No candidate survived verification — fallback\n`)
      return NextResponse.json({
        prompt: await shipFallback(traitFallback, characterOne, characterTwo, pageOne, pageTwo),
      })
    }

    // STAGES B-D — try each verified connection in rank order until one
    // produces a shippable line.
    for (const check of verified) {
      console.log(`Attempting line for: "${check.candidate}"`)
      const shipped = await attemptLine(
        check.candidate,
        characterOne,
        characterTwo,
        pageOne,
        pageTwo
      )
      if (shipped) {
        console.log(`Shipping unique prompt: "${shipped}"\n`)
        return NextResponse.json({ prompt: shipped })
      }
    }

    console.log(`All verified candidates failed at the line stage — fallback\n`)
    return NextResponse.json({
      prompt: await shipFallback(traitFallback, characterOne, characterTwo, pageOne, pageTwo),
    })
  } catch (err) {
    console.error('Oracle error:', err)
    return NextResponse.json({ error: 'Oracle failed' }, { status: 500 })
  }
}