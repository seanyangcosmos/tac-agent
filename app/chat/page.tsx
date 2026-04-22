"use client"

import Link from "next/link"
import { useState } from "react"

type AnalyzeResult = {
  segments?: string[]
  decision_state: {
    intent: string
    resources: string
    risk_boundary: string
    execution_horizon: string
  }
  validation: {
    intent: { valid: boolean; reason: string }
    resources: { valid: boolean; reason: string }
    risk_boundary: { valid: boolean; reason: string }
    execution_horizon: { valid: boolean; reason: string }
  }
  readiness_score: number
  missing_layer: string | null
  missing_reason: string
  next_question: string
  recommendation: string
  topology: string
  summary: string
  alignment: number
  alignment_label: string
  tension: number
  tension_label: string
  convergence: number
  convergence_label: string
  structural_conflict: boolean
  conflict_type: string
  conflict_explanation: string
  repair_target?: {
    target_edge: string
    verification_type: string
    question_logic: string
    suggested_question: string
  } | null
  repair_question?: string
  clarification_mode?: string
  status: string
}

type DecisionState = {
  intent?: string
  resources?: string
  risk_boundary?: string
  execution_horizon?: string
}

export default function ChatPage() {
  const [query, setQuery] = useState("")
  const [context, setContext] = useState("")
  const [layer1, setLayer1] = useState("")
  const [layer2, setLayer2] = useState("")

  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [decisionState, setDecisionState] = useState<DecisionState>({})
  const [repairAnswer, setRepairAnswer] = useState("")
  const [activeQuestion, setActiveQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  const runAnalysis = async () => {
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setResult(null)
    setActiveQuestion("")
    setRepairAnswer("")
    setActiveStep(1)

    const timers = [
      setTimeout(() => setActiveStep(2), 700),
      setTimeout(() => setActiveStep(3), 1400),
      setTimeout(() => setActiveStep(4), 2200),
    ]

    try {
      const email = localStorage.getItem("email") || "sean4128@gmail.com"

      const combinedInput = [query.trim(), layer1.trim(), layer2.trim(), context.trim()]
        .filter(Boolean)
        .join("\n")

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          input: combinedInput,
          decision_state: decisionState,
        }),
      })

      const data = await response.json()

      if (data.upgrade) {
        window.open("https://sycds.com", "_blank")
        return
      }

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setResult(data)
      setDecisionState(data.decision_state || {})

      if (data.missing_layer && data.next_question) {
        setActiveQuestion(data.next_question)
      } else if (data.structural_conflict && data.repair_question) {
        setActiveQuestion(data.repair_question)
      } else {
        setActiveQuestion("")
      }

      setRepairAnswer("")
    } catch (error) {
      alert("Analysis unavailable. Please try again.")
    } finally {
      timers.forEach(clearTimeout)
      setIsLoading(false)
      setActiveStep(0)
    }
  }

  const submitRepairAnswer = async () => {
    if (!repairAnswer.trim() || isLoading) return

    setIsLoading(true)

    try {
      const email = localStorage.getItem("email") || "sean4128@gmail.com"

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          input: repairAnswer.trim(),
          decision_state: decisionState,
        }),
      })

      const data = await response.json()

      if (data.upgrade) {
        window.open("https://sycds.com", "_blank")
        return
      }

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setResult(data)
      setDecisionState(data.decision_state || {})

      if (data.missing_layer && data.next_question) {
        setActiveQuestion(data.next_question)
      } else if (data.structural_conflict && data.repair_question) {
        setActiveQuestion(data.repair_question)
      } else {
        setActiveQuestion("")
      }

      setRepairAnswer("")
    } catch (error) {
      alert("Analysis unavailable. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setQuery("")
    setContext("")
    setLayer1("")
    setLayer2("")
    setResult(null)
    setDecisionState({})
    setRepairAnswer("")
    setActiveQuestion("")
    setActiveStep(0)
  }

  function scoreLabel(value: number) {
    if (value >= 8) return "Strong"
    if (value >= 5) return "Moderate"
    if (value >= 3) return "Limited"
    return "Low"
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold mb-6">
        What decision are you trying to make?
      </h1>

      <textarea
        placeholder="Example: Should I enroll in a job-related certification course even if time is limited?"
        className="w-full border rounded-lg p-4 mb-4 min-h-[100px]"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <textarea
        placeholder="Add background details that support this decision (optional)"
        className="w-full border rounded-lg p-4 mb-4 min-h-[100px]"
        value={layer1}
        onChange={(e) => setLayer1(e.target.value)}
      />

      <textarea
        placeholder="Add risks or concerns that could affect this decision (optional)"
        className="w-full border rounded-lg p-4 mb-4 min-h-[100px]"
        value={layer2}
        onChange={(e) => setLayer2(e.target.value)}
      />

      <textarea
        placeholder="Add limits, timing, or external constraints (optional)"
        className="w-full border rounded-lg p-4 mb-6 min-h-[100px]"
        value={context}
        onChange={(e) => setContext(e.target.value)}
      />

      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={runAnalysis}
          disabled={isLoading || !query.trim()}
          className="bg-black text-white px-6 py-3 rounded-lg disabled:opacity-50"
        >
          Analyze Decision
        </button>

        <button
          onClick={resetForm}
          className="border px-6 py-3 rounded-lg"
        >
          Reset
        </button>

        <button
          onClick={() => window.open("https://sycds.com", "_blank")}
          className="border px-6 py-3 rounded-lg"
        >
          Upgrade to Pro ($29/month)
        </button>
      </div>

      <p className="text-gray-600 text-sm mb-8">
        TAC Agent helps you understand whether a decision makes sense, has hidden
        risks, or is ready to move forward. The first 5 evaluations are free.
      </p>

      {isLoading && (
        <p className="text-gray-500 mb-6">
          Evaluating decision structure...
        </p>
      )}

      {result?.segments?.length ? (
        <div className="border rounded-lg p-4 bg-gray-50 mb-6">
          <div className="font-semibold mb-3">
            Parsed decision structure
          </div>

          <ul className="space-y-1 text-sm text-gray-700">
            {result.segments.map((segment, idx) => (
              <li key={idx}>• {segment}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="text-lg font-semibold">
            Readiness Score: {result.readiness_score}%
          </div>

          {result.missing_layer && (
            <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
              <div className="font-semibold text-yellow-800">
                Missing or invalid layer: {result.missing_layer}
              </div>

              {result.missing_reason && (
                <div className="mt-2 text-sm text-yellow-700">
                  Reason: {result.missing_reason}
                </div>
              )}

              {result.next_question && (
                <div className="mt-2 text-sm text-yellow-900 font-medium">
                  Next step: {result.next_question}
                </div>
              )}
            </div>
          )}

          {result.validation && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="font-semibold mb-3">
                TAC Layer Validation
              </div>

              {(
                ["intent", "resources", "risk_boundary", "execution_horizon"] as const
              ).map((layer) => {
                const layerData = result.validation[layer]

                return (
                  <div
                    key={layer}
                    className="mb-2 flex justify-between items-start gap-4"
                  >
                    <div className="font-medium">{layer}</div>

                    <div className="text-right max-w-md">
                      <div
                        className={
                          layerData.valid ? "text-green-600" : "text-red-600"
                        }
                      >
                        {layerData.valid ? "valid" : "invalid"}
                      </div>

                      {!layerData.valid && layerData.reason && (
                        <div className="text-xs text-gray-600">
                          {layerData.reason}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {result.status === "decision_ready" && (
            <div className="border rounded-lg p-4 bg-green-50">
              <div className="text-lg font-semibold">
                Recommendation: {result.recommendation}
              </div>

              <div className="mt-2">
                Topology: {result.topology}
              </div>

              <div className="mt-4">
                Alignment: {result.alignment} ({result.alignment_label || scoreLabel(result.alignment)})
              </div>

              <div>
                Tension: {result.tension} ({result.tension_label || scoreLabel(result.tension)})
              </div>

              <div>
                Convergence: {result.convergence} ({result.convergence_label || scoreLabel(result.convergence)})
              </div>

              {result.structural_conflict && (
                <div className="mt-4 text-red-700">
                  Structural conflict detected: {result.conflict_type}
                </div>
              )}

              {result.conflict_explanation && (
                <div className="text-sm text-gray-700 mt-2">
                  {result.conflict_explanation}
                </div>
              )}

              {result.summary && (
                <div className="mt-4 text-gray-800">
                  {result.summary}
                </div>
              )}
            </div>
          )}

          {result.structural_conflict && result.repair_question ? (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="font-semibold text-red-800">
                Clarification required
              </div>

              {result.conflict_type && (
                <div className="mt-2 text-sm text-red-700">
                  Conflict type: {result.conflict_type}
                </div>
              )}

              {result.conflict_explanation && (
                <div className="mt-2 text-sm text-gray-700">
                  {result.conflict_explanation}
                </div>
              )}

              <div className="mt-3 text-sm font-medium text-red-900">
                Next verification:
              </div>

              <div className="text-sm text-gray-900">
                {result.repair_question}
              </div>
            </div>
          ) : null}

          {activeQuestion ? (
            <div className="border rounded-lg p-4 bg-blue-50">
              <div className="font-semibold mb-2">
                Answer this to continue
              </div>

              <div className="text-sm text-gray-800 mb-3">
                {activeQuestion}
              </div>

              <textarea
                value={repairAnswer}
                onChange={(e) => setRepairAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full border rounded-md p-3 min-h-[100px]"
              />

              <div className="mt-3">
                <button
                  onClick={submitRepairAnswer}
                  disabled={isLoading || !repairAnswer.trim()}
                  className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
                >
                  Continue Analysis
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
