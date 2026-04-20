import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import OpenAI from "openai"

const FREE_LIMIT = 5

const UNLIMITED_EMAILS = [
  "sean4128@gmail.com"
]

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()

    const runsCookie = cookieStore.get("tac_runs")
    let runs = runsCookie ? parseInt(runsCookie.value, 10) : 0

    const body = await req.json()

    const email = String(body?.email || "")
      .toLowerCase()
      .trim()

    const decisions = Array.isArray(body?.decisions)
      ? body.decisions
      : body?.query
      ? [
          {
            query: body.query,
            support: body.support || "",
            risks: body.risks || "",
            constraints: body.constraints || ""
          }
        ]
      : []

    if (
      !UNLIMITED_EMAILS.includes(email) &&
      runs >= FREE_LIMIT
    ) {
      return NextResponse.json(
        {
          error: "limit reached",
          upgrade: true
        },
        { status: 403 }
      )
    }

    runs += 1

    const tacPrompt = `
You are a TAC decision engine.

Evaluate the following decisions using three axes:

Alignment (goal fit)
Tension (risk/conflict)
Convergence (readiness)

Return JSON only:

{
alignment: number,
tension: number,
convergence: number,
topology: string,
recommendation: string,
summary: string
}

Decisions:

${JSON.stringify(decisions, null, 2)}
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are a structured decision evaluation engine."
        },
        {
          role: "user",
          content: tacPrompt
        }
      ]
    })

    const text = completion.choices[0].message.content || "{}"

    const result = JSON.parse(text)

    return NextResponse.json(result)

  } catch (err) {
    console.error(err)

    return NextResponse.json(
      {
        error: "analysis failed"
      },
      { status: 500 }
    )
  }
}

