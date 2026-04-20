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
  if (alignment <= 2 && tension <= 2 && convergence <= 2) {
    return "Do not proceed"
  }

  if (alignment <= 4 && convergence <= 4) {
    return "Do not proceed"
  }

  if (alignment >= 7 && convergence >= 7 && tension >= 7) {
    return "Needs clarity"
  }

  if (alignment >= 7 && tension >= 7) {
    return "Needs clarity"
  }

  if (alignment >= 7 && convergence <= 5) {
    return "Wait"
  }

  if (alignment >= 7 && convergence >= 7 && tension <= 4) {
    return "Proceed"
  }

  if (convergence <= 5) {
    return "Wait"
  }

  return "Needs clarity"
}


function deriveTopology(
  alignment: number,
  tension: number,
  convergence: number
) {
  // 幾乎無法判定，資訊不足
  if (alignment <= 2 && tension <= 2 && convergence <= 2) {
    return "premature_commitment"
  }

  // 目標本身就不對位
  if (alignment <= 4 && convergence <= 4) {
    return "structural_misalignment"
  }

  // 看起來可做，但其實衝突很高
  if (alignment >= 7 && convergence >= 7 && tension >= 7) {
    return "false_convergence"
  }

  // 目標合理，但內部有明顯衝突
  if (alignment >= 7 && tension >= 7) {
    return "latent_conflict"
  }

  // 目標合理，但執行穩定度不足
  if (alignment >= 7 && convergence <= 5) {
    return "execution_fragility"
  }

  // 看起來方向對，但其實只是表面一致
  if (alignment >= 7 && tension >= 5 && convergence >= 5) {
    return "surface_alignment_only"
  }

  // 穩定可執行
  if (alignment >= 7 && convergence >= 7 && tension <= 4) {
    return "stable_alignment"
  }

  // 可前進，但要小步走
  if (alignment >= 5 && convergence >= 5 && tension >= 5) {
    return "convergence_under_tension"
  }

  // 還不適合行動
  if (convergence <= 5) {
    return "low_readiness"
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
