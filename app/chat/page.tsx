"use client"

import Link from "next/link"
import { useState } from "react"

type AnalyzeResult = {
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

  segments?: string[]

  status: string
}
export default function ChatPage() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [layer1, setLayer1] = useState("")
  const [layer2, setLayer2] = useState("")
  const [context, setContext] = useState("")
  const [decisionState, setDecisionState] = useState({})

  const runAnalysis = async () => {
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setResult(null)
    setActiveStep(1)

    const timers = [
      setTimeout(() => setActiveStep(2), 700),
      setTimeout(() => setActiveStep(3), 1400),
      setTimeout(() => setActiveStep(4), 2200),
    ]

    try {

      const email = localStorage.getItem("email") || "sean4128@gmail.com"

      const combinedInput = [
        query.trim(),
        context.trim(),
        layer1.trim(),
        layer2.trim(),
      ].filter(Boolean).join("\n")

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
    } catch (error) {
      alert("Analysis unavailable. Please try again.")
    } finally {
      timers.forEach(clearTimeout)
      setIsLoading(false)
      setActiveStep(0)
    }
  }

  const resetForm = () => {
    setQuery("")
    setContext("") 
    setLayer1("")
    setLayer2("")
    setResult(null)
    setDecisionState({})
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
        placeholder="Example: Should we launch TAC-3D now even if resources are still unclear?"
        className="w-full border rounded-lg p-4 mb-4"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <textarea
        placeholder="Add background details that support this decision (optional)"
        className="w-full border rounded-lg p-4 mb-4"
        value={layer1}
        onChange={(e) => setLayer1(e.target.value)}
      />

      <textarea
        placeholder="Add risks or concerns that could affect this decision (optional)"
        className="w-full border rounded-lg p-4 mb-4"
        value={layer2}
        onChange={(e) => setLayer2(e.target.value)}
      />

      <textarea
        placeholder="Add limits, timing, or external constraints (optional)"
        className="w-full border rounded-lg p-4 mb-6"
        value={context}
        onChange={(e) => setContext(e.target.value)}
      />

      <div className="flex gap-3 mb-6">

        <button
          onClick={runAnalysis}
          className="bg-black text-white px-6 py-3 rounded-lg"
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
        TAC Agent helps you understand whether a decision makes sense,
        has hidden risks, or is ready to move forward. The first 5 evaluations are free.
      </p>

      {isLoading && (
        <p className="text-gray-500 mb-6">
          Evaluating decision structure...
        </p>
      )}

      {result.segments && result.segments.length > 0 && (   
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="font-semibold mb-3">
            Parsed decision structure
          </div>

          <ul className="space-y-1 text-sm text-gray-700">
            {result.segments.map((segment, idx) => (
              <li key={idx}>• {segment}</li>
            ))}
          </ul>
        </div>
      )}
      {result && (
        <div className="mt-8 space-y-6">

          {/* Readiness score */}
          <div className="text-lg font-semibold">
            Readiness Score: {result.readiness_score}%
          </div>

          {/* Missing layer block */}
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

          {/* Layer validation panel */}
          {result.validation && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="font-semibold mb-3">
                TAC Layer Validation
              </div>

              {["intent", "resources", "risk_boundary", "execution_horizon"].map(
                (layer) => {
                  const layerData = result.validation[layer]

                  return (
                    <div
                      key={layer}
                      className="mb-2 flex justify-between items-start"
                    >
                      <div className="font-medium">{layer}</div>

                      <div className="text-right max-w-md">
                        <div
                          className={
                            layerData.valid
                              ? "text-green-600"
                              : "text-red-600"
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
                }
              )}
            </div>
          )}

          {/* Final decision block */}
          {result.status === "decision_ready" && (
            <div className="border rounded-lg p-4 bg-green-50">

              <div className="text-lg font-semibold">
                Recommendation: {result.recommendation}
              </div>

              <div className="mt-2">
                Topology: {result.topology}
              </div>

              <div className="mt-4">
                Alignment: {result.alignment} ({result.alignment_label})
              </div>

              <div>
                Tension: {result.tension} ({result.tension_label})
              </div>

              <div>
                Convergence: {result.convergence} ({result.convergence_label})
              </div>

              {result.structural_conflict && (
                <div className="mt-4 text-red-700">
                  Structural conflict detected: {result.conflict_type}
                </div>
              )}

              {result.conflict_explanation && (
                <div className="text-sm text-gray-700">
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

        </div>
      )}
    </div>
  )
}
