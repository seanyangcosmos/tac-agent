import { generateText, Output } from "ai"
import { z } from "zod"
import { createOpenAI } from "@ai-sdk/openai"

const deepseek = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.deepseek.com",
})

const tacAnalysisSchema = z.object({
  alignment: z.string(),
  tension: z.string(),
  convergence: z.string(),
})

const TAC_SYSTEM_PROMPT = `You are TAC Agent, a decision structure analyzer based on the Target Alignment Criteria framework.

Interpret the user's input as a decision structure, not a question requiring advice.

Perform three structural evaluations:

1. Alignment
Evaluate whether goals, constraints, resources, and timing assumptions are structurally compatible.

2. Tension
Identify internal conflicts, tradeoffs, uncertainty layers, or competing optimization targets inside the decision.

3. Convergence
Estimate whether the decision can realistically stabilize into an executable path, or whether restructuring is required first.

Keep responses analytical, structural, and domain-neutral.
Do not give advice. Diagnose structure only.
Each section should be 2-3 sentences.`

export async function POST(req: Request) {
  const { question } = await req.json()

  if (!question || typeof question !== "string") {
    return Response.json({ error: "Question is required" }, { status: 400 })
  }

  const { output } = await generateText({
    model: deepseek("Deepseek-V4-Flash"),
    output: Output.object({
      schema: tacAnalysisSchema,
    }),
    system: TAC_SYSTEM_PROMPT,
    prompt: question,
  })

  return Response.json(output)
}
