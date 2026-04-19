import { NextResponse } from "next/server"

type TacResult = {
  alignment: number
  tension: number
  convergence: number
  topology: string
  summary: string
  structural_verdict?: string
  key_conflicts?: string[]
  key_conditions?: string[]
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

function analyzeDecisionFallback(query: string): TacResult {
  const text = query.toLowerCase()

  let alignment = 0.6
  let tension = 0.4
  let convergence = 0.6

  if (text.includes("or")) tension += 0.12
  if (text.includes("vs")) tension += 0.12
  if (text.includes("but")) tension += 0.08
  if (text.includes("without")) tension += 0.08
  if (text.includes("risk")) tension += 0.1
  if (text.includes("uncertain")) tension += 0.1
  if (text.includes("conflict")) tension += 0.15

  if (text.includes("clear")) alignment += 0.08
  if (text.includes("aligned")) alignment += 0.12
  if (text.includes("budget")) alignment += 0.05
  if (text.includes("resource")) alignment += 0.05
  if (text.includes("timeline")) alignment += 0.05

  if (text.includes("now")) convergence -= 0.05
  if (text.includes("later")) convergence -= 0.03
  if (text.includes("wait")) convergence -= 0.05
  if (text.includes("execute")) convergence += 0.08
  if (text.includes("feasible")) convergence += 0.08
  if (text.includes("pilot")) convergence += 0.06

  alignment = clamp(alignment)
  tension = clamp(tension)
  convergence = clamp(convergence)

  let topology = "partial-convergence"
  let structural_verdict = "Partial structural compatibility"
  let key_conflicts: string[] = []
  let key_conditions: string[] = []

  if (alignment >= 0.7 && tension <= 0.4 && convergence >= 0.7) {
    topology = "aligned-convergent"
    structural_verdict = "Structurally ready"
    key_conditions = [
      "Goal and constraint pattern appears coherent",
      "Internal tension remains within manageable range",
      "Execution path appears relatively stable",
    ]
  } else if (tension >= 0.7 && convergence <= 0.5) {
    topology = "high-tension-fragile"
    structural_verdict = "Structurally fragile"
    key_conflicts = [
      "Internal tradeoffs are strongly competing",
      "Conflict density may block stabilization",
    ]
    key_conditions = [
      "Reduce tension before execution",
      "Clarify which priority dominates the decision",
    ]
  } else if (alignment <= 0.45 && tension >= 0.55) {
    topology = "misaligned-unstable"
    structural_verdict = "Structurally misaligned"
    key_conflicts = [
      "Goals and constraints appear poorly matched",
      "Tension remains high without stable convergence",
    ]
    key_conditions = [
      "Restructure the decision frame",
      "Clarify scope, timing, and governing objective",
    ]
  } else if (alignment >= 0.6 && tension >= 0.55 && convergence >= 0.55) {
    topology = "convergence-under-tension"
    structural_verdict = "Convergence possible under visible tension"
    key_conflicts = [
      "Competing priorities remain active inside the structure",
    ]
    key_conditions = [
      "Execution is possible if conflict is explicitly managed",
    ]
  } else {
    key_conditions = [
      "Clarify the decision proposition",
      "Improve structural visibility before execution",
    ]
  }

  const summary =
    topology === "aligned-convergent"
      ? "The decision structure appears relatively aligned and executable."
      : topology === "high-tension-fragile"
      ? "The decision contains strong internal tension and may not stabilize without restructuring."
      : topology === "misaligned-unstable"
      ? "Goals, constraints, or timing appear misaligned, reducing structural stability."
      : topology === "convergence-under-tension"
      ? "The decision may still converge, but only under visible structural tension."
      : "The decision shows partial structural compatibility but still requires clarification."

  return {
    alignment,
    tension,
    convergence,
    topology,
    summary,
    structural_verdict,
    key_conflicts,
    key_conditions,
  }
}

function isValidTacResult(data: unknown): data is TacResult {
  if (!data || typeof data !== "object") return false

  const obj = data as Record<string, unknown>

  return (
    typeof obj.alignment === "number" &&
    typeof obj.tension === "number" &&
    typeof obj.convergence === "number" &&
    typeof obj.topology === "string" &&
    typeof obj.summary === "string"
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const query = body?.query

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      )
    }

    const tac3dApiUrl = process.env.TAC3D_API_URL
    const tac3dApiKey = process.env.TAC3D_API_KEY

    if (tac3dApiUrl) {
      try {
        const response = await fetch(tac3dApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tac3dApiKey ? { Authorization: `Bearer ${tac3dApiKey}` } : {}),
          },
          body: JSON.stringify({ query }),
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`TAC3D upstream failed: ${response.status}`)
        }

        const data = await response.json()

        if (!isValidTacResult(data)) {
          throw new Error("Invalid TAC3D response schema")
        }

        return NextResponse.json(data)
      } catch (error) {
        console.error("TAC3D upstream error, using fallback:", error)
      }
    }

    const fallback = analyzeDecisionFallback(query)
    return NextResponse.json(fallback)
  } catch {
    return NextResponse.json(
      { error: "invalid request body" },
      { status: 400 }
    )
  }
}
