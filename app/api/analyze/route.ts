import { NextResponse } from "next/server"

type TacResult = {
  alignment: number
  tension: number
  convergence: number
  topology: string
  summary: string
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

function analyzeDecision(query: string): TacResult {
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

  if (alignment >= 0.7 && tension <= 0.4 && convergence >= 0.7) {
    topology = "aligned-convergent"
  } else if (tension >= 0.7 && convergence <= 0.5) {
    topology = "high-tension-fragile"
  } else if (alignment <= 0.45 && tension >= 0.55) {
    topology = "misaligned-unstable"
  } else if (alignment >= 0.6 && tension >= 0.55 && convergence >= 0.55) {
    topology = "convergence-under-tension"
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

  return { alignment, tension, convergence, topology, summary }
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

    const result = analyzeDecision(query)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { error: "invalid request body" },
      { status: 400 }
    )
  }
}
