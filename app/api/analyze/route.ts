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

type LayerValidation = {
  valid: boolean
  reason: string
}

type ValidationResult = {
  intent: LayerValidation
  resources: LayerValidation
  risk_boundary: LayerValidation
  execution_horizon: LayerValidation
}

async function inferTacStructure(input: string) {
  const prompt = `
You are a TAC decision-structure inference engine.

Your job is to:
1. split the user's input into meaningful decision segments
2. map those segments into TAC layers

TAC layers:
- intent = the actual decision being made
- resources = usable resources, budget, time, constraints, practical limits
- risk_boundary = acceptable downside, conflict boundary, tradeoff limit, what must not be harmed
- execution_horizon = timing, deadline, duration, execution window

Return valid JSON only in this exact format:

{
  "segments": string[],
  "intent": string,
  "resources": string,
  "risk_boundary": string,
  "execution_horizon": string
}

Rules:
- Keep original meaning faithful
- Do not invent missing content
- If a layer is missing, return ""
- One input may contain multiple segments
- Segments should be concise and meaningful
- No markdown
- No explanation outside JSON

User input:
${input}
`.trim()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    messages: [
      { role: "system", content: "Return valid JSON only." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  })

  const raw = completion.choices[0].message.content || "{}"
  const parsed = JSON.parse(raw)

  return {
    segments: Array.isArray(parsed.segments) ? parsed.segments.map((x: any) => String(x).trim()).filter(Boolean) : [],
    parsedLayers: {
      intent: safeText(parsed.intent),
      resources: safeText(parsed.resources),
      risk_boundary: safeText(parsed.risk_boundary),
      execution_horizon: safeText(parsed.execution_horizon),
    },
  }
}


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

function safeText(value: unknown): string {
  return String(value || "").trim()
}

function makeInvalid(reason: string): LayerValidation {
  return { valid: false, reason }
}

function normalizeValidation(raw: any): ValidationResult {
  return {
    intent: {
      valid: Boolean(raw?.intent?.valid),
      reason: safeText(raw?.intent?.reason),
    },
    resources: {
      valid: Boolean(raw?.resources?.valid),
      reason: safeText(raw?.resources?.reason),
    },
    risk_boundary: {
      valid: Boolean(raw?.risk_boundary?.valid),
      reason: safeText(raw?.risk_boundary?.reason),
    },
    execution_horizon: {
      valid: Boolean(raw?.execution_horizon?.valid),
      reason: safeText(raw?.execution_horizon?.reason),
    },
  }
}

async function parseLatestInputIntoLayers(
  latestInput: string,
  const currentState: DecisionState
): Promise<ParsedLayers> {
  const prompt = `
You are a TAC decision-structure parser.

Map ONLY the user's latest input into one or more of these four layers:

1. intent = the actual decision being made
2. resources = usable resources, budget, constraints, capacity, practical conditions
3. risk_boundary = acceptable downside, conflict boundary, tradeoff limit, non-negotiable impact
4. execution_horizon = meaningful timing, duration, deadline, execution window

Return valid JSON only in this exact format:

{
  "intent": string,
  "resources": string,
  "risk_boundary": string,
  "execution_horizon": string
}

Rules:
- Extract only what is clearly present in the latest input.
- If a layer is not present, return "" for that layer.
- Do not explain.
- Do not use markdown.
- Be faithful to the user's wording.
- A single input may contribute to more than one layer if semantically justified.

Current decision state:
${JSON.stringify(currentState, null, 2)}

Latest user input:
${latestInput}
`.trim()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    messages: [
      { role: "system", content: "Return valid JSON only." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  })

  const raw = completion.choices[0].message.content || "{}"
  const parsed = JSON.parse(raw)

  return {
    intent: safeText(parsed.intent),
    resources: safeText(parsed.resources),
    risk_boundary: safeText(parsed.risk_boundary),
    execution_horizon: safeText(parsed.execution_horizon),
  }
}

async function validateTacLayers(
  decisionState: DecisionState
): Promise<ValidationResult> {
  const prompt = `
You are validating whether each layer in a TAC decision structure is semantically valid.

TAC layers:
1. intent = the actual decision being made
2. resources = usable resources, constraints, or practical conditions that shape the decision
3. risk_boundary = acceptable downside, conflict boundary, tradeoff limit, or what must not be harmed
4. execution_horizon = meaningful timing, duration, or execution window for action

Return valid JSON only in this exact format:

{
  "intent": {
    "valid": boolean,
    "reason": string
  },
  "resources": {
    "valid": boolean,
    "reason": string
  },
  "risk_boundary": {
    "valid": boolean,
    "reason": string
  },
  "execution_horizon": {
    "valid": boolean,
    "reason": string
  }
}

Rules:
- Judge semantic role, not just whether text exists.
- A layer may be present but invalid.
- Placeholder text, meaningless strings, random numbers, unrelated content, or vague filler should be invalid.
- Do not invent information.
- Keep reasons short and concrete.
- Return JSON only.

Decision state:
${JSON.stringify(decisionState, null, 2)}
`.trim()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    messages: [
      { role: "system", content: "Return valid JSON only." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  })

  const raw = completion.choices[0].message.content || "{}"
  return normalizeValidation(JSON.parse(raw))
}

function calculateReadinessScore(validation: ValidationResult): number {
  const validCount = [
    validation.intent.valid,
    validation.resources.valid,
    validation.risk_boundary.valid,
    validation.execution_horizon.valid,
  ].filter(Boolean).length

  return Math.round((validCount / 4) * 100)
}

function detectMissingOrInvalidLayer(
  state: DecisionState,
  validation: ValidationResult
): keyof DecisionState | null {
  if (!state.intent.trim() || !validation.intent.valid) return "intent"
  if (!state.resources.trim() || !validation.resources.valid) return "resources"
  if (!state.risk_boundary.trim() || !validation.risk_boundary.valid) return "risk_boundary"
  if (!state.execution_horizon.trim() || !validation.execution_horizon.valid) return "execution_horizon"
  return null
}

function nextQuestionForLayer(layer: keyof DecisionState | null): string {
  if (!layer) return ""

  const questions: Record<keyof DecisionState, string> = {
    intent: "What decision are you actually trying to make?",
    resources: "What resources, budget, capacity, or practical limits shape this decision?",
    risk_boundary: "What downside, conflict, or unacceptable impact must this decision avoid?",
    execution_horizon: "What timing, deadline, or execution window makes this decision meaningful?",
  }

  return questions[layer]
}

function reasonForLayer(
  layer: keyof DecisionState | null,
  state: DecisionState,
  validation: ValidationResult
): string {
  if (!layer) return ""

  if (!state[layer].trim()) {
    return "This TAC layer is still missing."
  }

  return validation[layer].reason || "This TAC layer is present but not yet valid."
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

async function detectStructuralConflict(state: DecisionState): Promise<{
  has_conflict: boolean
  conflict_type: string
  explanation: string
}> {
  const prompt = `
Check whether the following TAC decision layers contain a meaningful structural contradiction.

Return valid JSON only:

{
  "has_conflict": boolean,
  "conflict_type": string,
  "explanation": string
}

Rules:
- Look for contradiction between intent, resources, risk_boundary, and execution_horizon.
- Examples include feasibility mismatch, timing mismatch, unacceptable tradeoff, or internal conflict.
- If there is no clear contradiction, return false and leave the other fields empty or minimal.
- Return JSON only.

Decision state:
${JSON.stringify(state, null, 2)}
`.trim()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    messages: [
      { role: "system", content: "Return valid JSON only." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  })

  const raw = completion.choices[0].message.content || "{}"
  const parsed = JSON.parse(raw)

  return {
    has_conflict: Boolean(parsed.has_conflict),
    conflict_type: safeText(parsed.conflict_type),
    explanation: safeText(parsed.explanation),
  }
}

async function evaluateFullDecision(
  state: DecisionState,
  structuralConflict: {
    has_conflict: boolean
    conflict_type: string
    explanation: string
  }
): Promise<{
  alignment: number
  tension: number
  convergence: number
  summary: string
}> {
  const prompt = `
You are a TAC evaluator.

Evaluate this decision across three axes:

- alignment: does the decision fit the user's actual goal and situation?
- tension: how much conflict, fragility, tradeoff, or structural risk exists?
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
- If there is structural conflict, tension should reflect that.
- summary must be concise and decision-focused.
- Return JSON only.

Decision state:
${JSON.stringify(state, null, 2)}

Structural conflict check:
${JSON.stringify(structuralConflict, null, 2)}
`.trim()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    messages: [
      { role: "system", content: "Return valid JSON only." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  })

  const raw = completion.choices[0].message.content || "{}"
  const parsed = JSON.parse(raw)

  return {
    alignment: clamp10(parsed.alignment),
    tension: clamp10(parsed.tension),
    convergence: clamp10(parsed.convergence),
    summary: safeText(parsed.summary),
  }
}

function deriveRecommendation(
  alignment: number,
  tension: number,
  convergence: number,
  structuralConflict: { has_conflict: boolean }
): string {
  if (structuralConflict.has_conflict && tension >= 7) {
    return "Needs clarification"
  }

  if (alignment >= 8 && tension <= 4 && convergence >= 8) {
    return "Proceed"
  }

  if (alignment >= 7 && tension <= 6 && convergence >= 5) {
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
  convergence: number,
  structuralConflict: { has_conflict: boolean }
): string {
  if (structuralConflict.has_conflict) {
    return "structural_tension"
  }

  if (alignment >= 8 && tension <= 4 && convergence >= 8) {
    return "stable_alignment"
  }

  if (alignment >= 7 && tension <= 6 && convergence >= 5) {
    return "actionable_with_risk"
  }

  if (alignment <= 4) {
    return "structural_misalignment"
  }

  if (convergence <= 4) {
    return "low_readiness"
  }

  return "uncertain_structure"
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const email = safeText(body?.email).toLowerCase()
    const input = safeText(body?.input)

    if (!input) {
      return NextResponse.json(
        { error: "input required" },
        { status: 400 }
      )
    }
    
    const inferred = await inferTacStructure(input)

    const segments = inferred.segments
    const parsedLayers = inferred.parsedLayers

    const decision_state = mergeDecisionState(currentState, parsedLayers)


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

    const validation = await validateTacLayers(decision_state)
    const readiness_score = calculateReadinessScore(validation)
    const missing_layer = detectMissingOrInvalidLayer(decision_state, validation)
    const next_question = nextQuestionForLayer(missing_layer)
    const missing_reason = reasonForLayer(missing_layer, decision_state, validation)

    if (!UNLIMITED_EMAILS.includes(email)) {
      runs += 1
    }

    if (missing_layer) {
      const response = NextResponse.json({
        segments,
        decision_state,
        validation,
        readiness_score,
        missing_layer,
        missing_reason,
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
        structural_conflict: false,
        conflict_type: "",
        conflict_explanation: "",
        status: "needs_one_more_condition",
      })

      response.cookies.set("tac_runs", String(runs), {
        httpOnly: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })

      return response
    }

    const structuralConflict = await detectStructuralConflict(decision_state)
    const evaluated = await evaluateFullDecision(decision_state, structuralConflict)

    const recommendation = deriveRecommendation(
      evaluated.alignment,
      evaluated.tension,
      evaluated.convergence,
      structuralConflict
    )

    const topology = deriveTopology(
      evaluated.alignment,
      evaluated.tension,
      evaluated.convergence,
      structuralConflict
    )

    const response = NextResponse.json({
      segmants,
      decision_state,
      validation,
      readiness_score,
      missing_layer: null,
      missing_reason: "",
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
      structural_conflict: structuralConflict.has_conflict,
      conflict_type: structuralConflict.conflict_type,
      conflict_explanation: structuralConflict.explanation,
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
