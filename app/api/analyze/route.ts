import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

function deriveRecommendation(
  alignment: number,
  tension: number,
  convergence: number
) {

  console.log("NEW RULE ENGINE ACTIVE")
  // 強 misalignment
  if (alignment <= 4 && convergence <= 4) {
    return "Do not proceed"
  }

  // 高 tension
  if (tension >= 7) {
    return "Needs clarity"
  }

  // readiness 不足
  if (convergence <= 5) {
    return "Wait"
  }

  // 穩定可執行
  if (alignment >= 7 && convergence >= 7 && tension <= 6) {
    return "Proceed"
  }

  return "Needs clarity"
}

function deriveTopology(alignment: number, tension: number, convergence: number) {
  if (alignment >= 7 && convergence >= 7 && tension <= 6) {
    return "stable_alignment"
  }

  if (alignment >= 7 && tension >= 7) {
    return "hidden_conflict"
  }

  if (convergence <= 5) {
    return "low_readiness"
  }

  if (alignment <= 4) {
    return "misaligned_goal"
  }

  return "uncertain_structure"
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const tacPrompt = `
Evaluate this decision using TAC criteria.

Return JSON:

{
  "alignment": number (0-10),
  "tension": number (0-10),
  "convergence": number (0-10),
  "summary": string
}

Decision:

${body.decision}

Background:

${body.background || "None"}

Risks:

${body.risks || "None"}

Constraints:

${body.constraints || "None"}
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "Return valid JSON only."
        },
        {
          role: "user",
          content: tacPrompt
        }
      ],
      response_format: { type: "json_object" }
    })

    const raw = completion.choices[0].message.content || "{}"
    const parsed = JSON.parse(raw)

    const alignment = parsed.alignment ?? 5
    const tension = parsed.tension ?? 5
    const convergence = parsed.convergence ?? 5

    const topology = deriveTopology(
      alignment,
      tension,
      convergence
    )

    const recommendation = deriveRecommendation(
      alignment,
      tension,
      convergence
    )

    return NextResponse.json({
      alignment,
      tension,
      convergence,
      topology,
      recommendation,
      summary: parsed.summary || ""
    })

  } catch (err) {
    console.error(err)

    return NextResponse.json({
      error: "Analysis unavailable"
    })
  }
}
