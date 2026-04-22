import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import OpenAI from "openai"

const FREE_LIMIT = 5
const UNLIMITED_EMAILS = ["sean4128@gmail.com"]

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type DecisionState = {
  intent: string
  resources: string
  risk_boundary: string
  execution_horizon: string
}

type ParsedInput = Partial<DecisionState>

function emptyState(): DecisionState {
  return {
    intent: "",
    resources: "",
    risk_boundary: "",
    execution_horizon: "",
  }
}

function mergeState(current: DecisionState, parsed: ParsedInput): DecisionState {
  return {
    intent: parsed.intent || current.intent,
    resources: parsed.resources || current.resources,
    risk_boundary: parsed.risk_boundary || current.risk_boundary,
    execution_horizon: parsed.execution_horizon || current.execution_horizon,
  }
}

function layerStatus(state: DecisionState) {
  return {
    intent: Boolean(state.intent.trim()),
    resources: Boolean(state.resources.trim()),
    risk_boundary: Boolean(state.risk_boundary.trim()),
    execution_horizon: Boolean(state.execution_horizon.trim()),
  }
}

function readinessScore(state: DecisionState) {
  const layers = layerStatus(state)
  const weights = {
    intent: 35,
    resources: 30,
    risk_boundary: 20,
    execution_horizon: 15,
  }

  let score = 0
  if (layers.intent) score += weights.intent
  if (layers.resources) score += weights.resources
  if (layers.risk_boundary) score += weights.risk_boundary
  if (layers.execution_horizon) score += weights.execution_horizon

  return score
}

function nextMissingLayer(state: DecisionState): keyof DecisionState | null {
  const layers = layerStatus(state)

  if (!layers.intent) return "intent"
  if (!layers.resources) return "resources"
  if (!layers.risk_boundary) return "risk_boundary"
  if (!layers.execution_horizon) return "execution_horizon"

  return null
}

function nextQuestionForLayer(layer: keyof DecisionState | null) {
  if (!layer) return ""

  const questions: Record<keyof DecisionState, string> = {
    intent: "What decision are you trying to make?",
    resources: "What resources, budget, or constraints will shape this decision?",
    risk_boundary: "What downside risk, loss, or tradeoff can you accept?",
    execution_horizon: "What is your intended timing or time horizon for this decision?",
  }

  return questions[layer]
}

function clamp10(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value)
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(10, n))
}

function scoreLabel10(value: number) {
  if (value >= 8) return "Strong"
  if (value >= 5) return "Moderate"
  if (value >= 3) return "Limited"
  return "Low"
}

function deriveRecommendation(
  alignment: number,
  tension: number,
  convergence: number
) {
  if (alignment >= 7 && tension <= 4 && convergence >= 8) {
    return "Proceed"
  }

  if (alignment >= 7 && tension <= 4 && convergence >= 5) {
    return "Proceed with caution"
  }

  if (alignment >= 7 && tension >= 7) {
    return "Needs clarification"
  }

  if (convergence <= 4) {
    return "Wait"
  }

  if (alignment <= 4) {
    return "Do not proceed"
  }

  return "Needs clarification"
}

function deriveTopology(
  alignment: number,
  tension: number,
  convergence: number
) {
  if (alignment >= 7 && tension <= 4 && convergence >= 8) {
    return "stable_alignment"
  }

  if (alignment >= 7 && tension <= 4 && convergence >= 5) {
    return "actionable_with_risk"
  }

  if (alignment >= 7 && tension >= 7) {
    return "latent_conflict"
  }

  if (convergence <= 4) {
    return "low_readiness"
  }

  if (alignment <= 4) {
    return "structural_misalignment"
  }

  return "uncertain_structure"
}

async function parseIntoDecisionState(
  userInput: string,
  currentState: DecisionState
): Promise<ParsedInput> {
  const prompt = `
You are a decision-structure parser.

Map the user's latest input into one or more of these four layers:

1. intent = what decision the user is trying to make
2. resources = budget, resources, limits, constraints
3. risk_boundary = acceptable downside, tradeoff, safety buffer, risk tolerance
4. execution_horizon = timing, holding period, short-term vs long-term, when to act

Return valid JSON only in this exact format:

{
  "intent": string,
  "resources": string,
  "risk_boundary": string,
  "execution_horizon": string
}

Rules:
- Only extract what is clearly present in the latest input.
- If a layer is not present, return "" for that field.
- Do not rewrite existing state.
- Do not infer missing layers unless directly stated.

Current decision state:
${JSON.stringify(currentState, null, 2)}

Latest user input:
${userInput}
`.trim()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: "Return valid JSON only. No markdown. No explanation.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
  })

  const raw = completion.choices[0].message.content || "{}"
  const parsed = JSON.parse(raw)

  return {
    intent: String(parsed.intent || "").trim(),
    resources: String(parsed.resources || "").trim(),
    risk_boundary: String(parsed.risk_boundary || "").trim(),
    execution_horizon: String(parsed.execution_horizon || "").trim(),
  }
}

async function evaluateDecisionState(state: DecisionState) {
  const prompt = `
You are a TAC evaluator.

Evaluate this decision state across three axes:

- alignment: does the decision goal fit the actual situation?
- tension: how much conflict, fragility, concentration risk, or tradeoff exists?
- convergence: how ready is this decision for action now?

Return valid JSON only in this exact format:

{
  "alignment": number,
  "tension": number,
  "convergence": number,
  "summary": string
}

Scores must be 0 to 10.

Decision state:
${JSON.stringify(state, null, 2)}
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
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
  })

  const raw = completion.choices[0].message.content || "{}"
  const parsed = JSON.parse(raw)

  const alignment = clamp10(parsed.alignment)
  const tension = clamp10(parsed.tension)
  const convergence = clamp10(parsed.convergence)
  const summary = String(parsed.summary || "").trim()

  return { alignment, tension, convergence, summary }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const runsCookie = cookieStore.get("tac_runs")
    let runs = runsCookie ? parseInt(runsCookie.value, 10) : 0

    const body = await req.json()

    const email = String(body?.email || "").trim().toLowerCase()
    const input = String(body?.input || "").trim()

    const currentState: DecisionState = {
      ...emptyState(),
      ...(body?.decision_state || {}),
    }

    if (!input) {
      return NextResponse.json(
        { error: "input required" },
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

    const parsed = await parseIntoDecisionState(input, currentState)
    const decision_state = mergeState(currentState, parsed)

    const readiness_score = readinessScore(decision_state)
    const missing_layer = nextMissingLayer(decision_state)
    const next_question = nextQuestionForLayer(missing_layer)

    if (!UNLIMITED_EMAILS.includes(email)) {
      runs += 1
    }

    const baseResponse: any = {
      decision_state,
      readiness_score,
      missing_layer,
      next_question,
      status:
        missing_layer ? "needs_one_more_condition" : "ready_for_evaluation",
    }

    if (missing_layer) {
      const response = NextResponse.json(baseResponse)
      response.cookies.set("tac_runs", String(runs), {
        httpOnly: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
      return response
    }

    const scored = await evaluateDecisionState(decision_state)
    const recommendation = deriveRecommendation(
      scored.alignment,
      scored.tension,
      scored.convergence
    )
    const topology = deriveTopology(
      scored.alignment,
      scored.tension,
      scored.convergence
    )

    const response = NextResponse.json({
      ...baseResponse,
      alignment: scored.alignment,
      alignment_label: scoreLabel10(scored.alignment),
      tension: scored.tension,
      tension_label: scoreLabel10(scored.tension),
      convergence: scored.convergence,
      convergence_label: scoreLabel10(scored.convergence),
      topology,
      recommendation,
      summary: scored.summary,
      status: "decision_ready",
    })

    response.cookies.set("tac_runs", String(runs), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (err) {
    console.error("tac route error:", err)
    return NextResponse.json(
      { error: "TAC decision engine failed" },
      { status: 500 }
    )
  }
}
