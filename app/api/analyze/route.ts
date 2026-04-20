import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import OpenAI from "openai"

const FREE_LIMIT = 5

const UNLIMITED_EMAILS = ["sean4128@gmail.com"]

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type GptTacResult = {
  alignment: number
  tension: number
  convergence: number
  summary: string
  has_enough_context: boolean
  missing_condition: string
  follow_up_question: string
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value)
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(10, n))
}

function deriveRecommendation(
  alignment: number,
  tension: number,
  convergence: number,
  hasEnoughContext: boolean
) {
  if (!hasEnoughContext) {
    return "One key condition missing"
  }

  if (alignment <= 4 && convergence <= 4) {
    return "Do not proceed"
  }

  if (tension >= 7) {
    return "Needs clarity"
  }

  if (convergence <= 5) {
    return "Wait"
  }

  if (alignment >= 7 && convergence >= 7 && tension <= 4) {
    return "Proceed"
  }

  return "Needs clarity"
}

function deriveTopology(
  alignment: number,
  tension: number,
  convergence: number,
  hasEnoughContext: boolean
) {
  if (!hasEnoughContext) {
    return "missing_key_condition"
  }

  if (alignment <= 2 && tension <= 2 && convergence <= 2) {
    return "premature_commitment"
  }

  if (alignment <= 4 && convergence <= 4) {
    return "structural_misalignment"
  }

  if (alignment >= 7 && convergence >= 7 && tension >= 7) {
    return "false_convergence"
  }

  if (alignment >= 7 && tension >= 7) {
    return "latent_conflict"
  }

  if (alignment >= 7 && convergence <= 5) {
    return "execution_fragility"
  }

  if (alignment >= 7 && tension >= 5 && convergence >= 5) {
    return "surface_alignment_only"
  }

  if (alignment >= 7 && convergence >= 7 && tension <= 4) {
    return "stable_alignment"
  }

  if (alignment >= 5 && convergence >= 5 && tension >= 5) {
    return "convergence_under_tension"
  }

  if (convergence <= 5) {
    return "low_readiness"
  }

  return "uncertain_structure"
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const runsCookie = cookieStore.get("tac_runs")
    let runs = runsCookie ? parseInt(runsCookie.value, 10) : 0

    const body = await req.json()

    const email = String(body?.email || "").trim().toLowerCase()
    const decision = String(body?.query || "").trim()
    const background = String(body?.layer1 || "").trim()
    const risk = String(body?.layer2 || "").trim()
    const constraint = String(body?.context || "").trim()
    console.log({
      decision,
      background,
      risk,
      constraint,
    })



    if (!decision) {
      return NextResponse.json(
        { error: "decision required" },
        { status: 400 }
      )
    }

    if (!UNLIMITED_EMAILS.includes(email) && runs >= FREE_LIMIT) {
      return NextResponse.json(
        {
          error: "limit reached",
          upgrade: true,
        },
        { status: 403 }
      )
    }

    const tacPrompt = `
Evaluate this decision using TAC criteria.

Return valid JSON only in this exact format:

{
  "alignment": number,
  "tension": number,
  "convergence": number,
  "summary": string,
  "has_enough_context": boolean,
  "missing_condition": string,
  "follow_up_question": string
}

Rules:
- Scores are from 0 to 10.
- If the decision can be judged with reasonable confidence, set "has_enough_context" to true.
- If the decision cannot be judged well because one critical condition is missing, set "has_enough_context" to false.
- When "has_enough_context" is false, identify only ONE most important missing condition.
- "follow_up_question" must ask for that one missing condition in plain language.
- Do not invent extra missing conditions.
- "all-in", "single point of failure", "no fallback", and irreversible downside should increase tension strongly.
- Convergence means readiness for action now, not whether the idea sounds interesting.

Decision:
${decision}

Background:
${background || "None"}

Risks:
${risks || "None"}

Constraints:
${constraints || "None"}
`.trim()

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "Return valid JSON only. No markdown. No explanation.",
        },
        {
          role: "user",
          content: tacPrompt,
        },
      ],
      response_format: { type: "json_object" },
    })

    const raw = completion.choices[0].message.content || "{}"
    const parsed = JSON.parse(raw) as Partial<GptTacResult>

    const alignment = clampScore(parsed.alignment)
    const tension = clampScore(parsed.tension)
    const convergence = clampScore(parsed.convergence)
    const hasEnoughContext = Boolean(parsed.has_enough_context)
    const missingCondition = String(parsed.missing_condition || "")
    const followUpQuestion = String(parsed.follow_up_question || "")
    const summary = String(
      parsed.summary || "The decision needs more clarification before moving forward."
    )

    const topology = deriveTopology(
      alignment,
      tension,
      convergence,
      hasEnoughContext
    )

    const recommendation = deriveRecommendation(
      alignment,
      tension,
      convergence,
      hasEnoughContext
    )

    if (!UNLIMITED_EMAILS.includes(email)) {
      runs += 1
    }

    const response = NextResponse.json({
      alignment,
      tension,
      convergence,
      topology,
      recommendation,
      summary,
      has_enough_context: hasEnoughContext,
      missing_condition: missingCondition,
      follow_up_question: followUpQuestion,
    })

    response.cookies.set("tac_runs", String(runs), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (err) {
    console.error("analyze route error:", err)
    return NextResponse.json(
      { error: "analysis failed" },
      { status: 500 }
    )
  }
}
