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

type ParsedLayers = Partial<DecisionState>

function emptyDecisionState(): DecisionState {
  return {
    intent: "",
    resources: "",
    risk_boundary: "",
    execution_horizon: "",
  }
}

function mergeDecisionState(
  current: DecisionState,
  parsed: ParsedLayers
): DecisionState {
  return {
    intent: parsed.intent?.trim() || current.intent,
    resources: parsed.resources?.trim() || current.resources,
    risk_boundary: parsed.risk_boundary?.trim() || current.risk_boundary,
    execution_horizon:
      parsed.execution_horizon?.trim() || current.execution_horizon,
  }
}

function layerPresence(state: DecisionState) {
  return {
    intent: Boolean(state.intent.trim()),
    resources: Boolean(state.resources.trim()),
    risk_boundary: Boolean(state.risk_boundary.trim()),
    execution_horizon: Boolean(state.execution_horizon.trim()),
  }
}

function calculateReadinessScore(state: DecisionState): number {
  const layers = layerPresence(state)

  let score = 0
  if (layers.intent) score += 35
  if (layers.resources) score += 30
  if (layers.risk_boundary) score += 20
  if (layers.execution_horizon) score += 15

  return score
}

function detectMissingLayer(
  state: DecisionState
): keyof DecisionState | null {
  const layers = layerPresence(state)

  if (!layers.intent) return "intent"
  if (!layers.resources) return "resources"
  if (!layers.risk_boundary) return "risk_boundary"
  if (!layers.execution_horizon) return "execution_horizon"

  return null
}

function nextQuestionForLayer(layer: keyof DecisionState | null): string {
  if (!layer) return ""

  const questions: Record<keyof DecisionState, string> = {
    intent: "What decision are you trying to make?",
    resources: "What resources, budget, or constraints will shape this decision?",
    risk_boundary: "What risks, tradeoffs, or downside can you accept?",
    execution_horizon: "What is your intended timing or time horizon for this decision?",
  }

  return questions[layer]
}

function clamp10(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value)
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(10, n))
}

function scoreLabel10(value: number): string {
  if (value >= 8) return "Strong"
  if (value >= 5) return "Moderate"
  if (value >= 3) return "Limited"
  return "Low"
}

function deriveRecommendation(
  alignment: number,
  tension: number,
  convergence: number
): string {
  if (alignment >= 8 && tension <= 4 && convergence >= 8) {
    return "Proceed"
  }

  if (alignment >= 7 && tension <= 5 && convergence >= 6) {
    return "Proceed with caution"
  }

  if (alignment <= 4) {
    return "Do not proceed"
  }

  if (convergence <= 4) {
    return "Wait"
  }

  return "Needs clarification"
}

function deriveTopology(
  alignment: number,
  tension: number,
  convergence: number
): string {
  if (alignment >= 8 && tension <= 4 && convergence >= 8) {
    return "stable_alignment"
  }

  if (alignment >= 7 && tension <= 5 && convergence >= 6) {
    return "actionable_with_risk"
  }

  if (alignment <= 4) {
    return "structural_misalignment"
  }

  if (convergence <= 4) {
    return "low_readiness"
  }

  if (tension >= 7) {
    return "latent_conflict"
  }

  return "uncertain_structure"
}

async function parseLatestInputIntoLayers(
  latestInput: string,
  currentState: DecisionState
): Promise<ParsedLayers> {
  const prompt = `
You are a decision-structure parser.

Map ONLY the user's latest input into one or more of these four layers:

1. intent = what decision the user is trying to make
2. resources = budget, resources, constraints, conditions, practical limits
3. risk_boundary = risk tolerance, downside, tradeoff, concerns, safety buffer
4. execution_horizon = timing, deadline, short-term vs long-term, when to act, duration

Return valid JSON only in this exact format:

{
  "intent": string,
  "resources": string,
  "risk_boundary": string,
  "execution_horizon": string
}

Rules:
- Only extract what is clearly present in the latest input.
- If a layer is not present in the latest input, return "" for that field.
- Do not overwrite existing state unless the latest input clearly belongs to that layer.
- Keep the extracted text concise and faithful.
- No markdown.
- No explanation.

Current decision state:
${JSON.stringify(currentState, null, 2)}

Latest user input:
${latestInput}
`.trim()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: "Return valid JSON only.",
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
    intent: String(parsed.intent || ""),
    resources: String(parsed.resources || ""),
    risk_boundary: String(parsed.risk_boundary || ""),
    execution_horizon: String(parsed.execution_horizon || ""),
  }
}

async function evaluateFullDecision(
  state: DecisionState
): Promise<{
  alignment: number
  tension: number
  convergence: number
  summary: string
}> {
  const prompt = `
You are a TAC evaluator.

Evaluate this fully-formed decision across three axes:

- alignment: does the decision fit the user's actual goal and situation?
- tension: how much conflict, fragility, concentration risk, or tradeoff exists?
- convergence: how ready is this decision for action now?

Return valid JSON only in this exact format:

{
  "alignment": number,
  "tension": number,
  "convergence": number,
  "summary": string
}

Rules:
- Scores must be 0 to 10.
- summary must be concise, practical, and decision-focused.
- No markdown.
- No explanation outside JSON.

Decision state:
${JSON.stringify(state, null, 2)}
`.trim()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: "Return valid JSON only.",
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
    alignment: clamp10(parsed.alignment),
    tension: clamp10(parsed.tension),
    convergence: clamp10(parsed.convergence),
    summary: String(parsed.summary || "").trim(),
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const email = String(body?.email || "")
      .trim()
      .toLowerCase()

    const input = String(body?.input || "").trim()

    if (!input) {
      return NextResponse.json(
        { error: "input required" },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const runsCookie = cookieStore.get("tac_runs")
    let runs = runsCookie ? parseInt(runsCookie.value, 10) : 0

    if (!UNLIMITED_EMAILS.includes(email) && runs >= FREE_LIMIT) {
      return NextResponse.json(
        {
          error: "limit reached",
          upgrade: true,
        },
        { status: 403 }
      )
    }

    const currentState: DecisionState = {
      ...emptyDecisionState(),
      ...(body?.decision_state || {}),
    }

    const parsedLayers = await parseLatestInputIntoLayers(
      input,
      currentState
    )

    const decision_state = mergeDecisionState(
      currentState,
      parsedLayers
    )

    const readiness_score = calculateReadinessScore(decision_state)
    const missing_layer = detectMissingLayer(decision_state)
    const next_question = nextQuestionForLayer(missing_layer)

    if (!UNLIMITED_EMAILS.includes(email)) {
      runs += 1
    }

    if (missing_layer) {
      const response = NextResponse.json({
        decision_state,
        readiness_score,
        missing_layer,
        next_question,
        recommendation: "",
        topology: "",
        summary: "",
        alignment: 0,
        alignment_label: "",
        tension: 0,
        tension_label: "",
        convergence: 0,
        convergence_label: "",
        status: "needs_one_more_condition",
      })

      response.cookies.set("tac_runs", String(runs), {
        httpOnly: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })

      return response
    }

    const evaluated = await evaluateFullDecision(decision_state)

    const recommendation = deriveRecommendation(
      evaluated.alignment,
      evaluated.tension,
      evaluated.convergence
    )

    const topology = deriveTopology(
      evaluated.alignment,
      evaluated.tension,
      evaluated.convergence
    )

    const response = NextResponse.json({
      decision_state,
      readiness_score,
      missing_layer: null,
      next_question: "",
      recommendation,
      topology,
      summary: evaluated.summary,
      alignment: evaluated.alignment,
      alignment_label: scoreLabel10(evaluated.alignment),
      tension: evaluated.tension,
      tension_label: scoreLabel10(evaluated.tension),
      convergence: evaluated.convergence,
      convergence_label: scoreLabel10(evaluated.convergence),
      status: "decision_ready",
    })

    response.cookies.set("tac_runs", String(runs), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (error) {
    console.error("analyze route error:", error)
    return NextResponse.json(
      { error: "Analysis unavailable. Please try again." },
      { status: 500 }
    )
  }
}
