"use client"

import Link from "next/link"
import { useState } from "react"

type AnalyzeResult = {
  recommendation?: string
  alignment?: number
  alignment_label?: string
  tension?: number
  tension_label?: string
  convergence?: number
  convergence_label?: string
  topology?: string
  summary?: string

  readiness_score?: number
  missing_layer?: string
  next_question?: string
  decision_state?: Record<string, any>
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

      {result && (
            <div className="border rounded-xl p-6">
                  {result.next_question ? (
                        <>
                              <h2 className="text-xl font-semibold mb-4">
                                    One more thing needed
                              </h2>

                              {typeof result.readiness_score === "number" && (
                                    <p className="text-sm text-gray-600 mb-4">
                                          Decision readiness: {result.readiness_score}%
                                    </p>
                              )}

                              <div className="mt-2 rounded-lg border p-4">
                                    <p className="mb-2">
                                          Missing layer: {result.missing_layer}
                                    </p>

                                    <p className="text-lg font-medium">
                                          {result.next_question}
                                    </p>
                              </div>
                        </>
                  ) : (
                        <>
                              <h2 className="text-xl font-semibold mb-2">
                                    Recommendation
                              </h2>

                              <p className="text-lg mb-4">
                                    {result.recommendation}
                              </p>

                              {typeof result.readiness_score === "number" && (
                                    <p className="text-sm text-gray-600 mb-4">
                                          Decision readiness: {result.readiness_score}%
                                    </p>
                              )}

                              <h3 className="font-semibold mt-6 mb-2">
                                    Why this result
                              </h3>

                              <p className="text-gray-700 mb-6">
                                    {result.summary || "No summary available."}
                              </p>

                              <h3 className="font-semibold mb-2">
                                    What we checked
                              </h3>

                              <ul className="space-y-2 text-gray-700">
                                    <li>
                                          <strong>Goal fit (Alignment):</strong> Does this goal match your current situation?
                                          <br />
                                          Assessment: {result.alignment_label || "N/A"}
                                    </li>

                                    <li>
                                          <strong>Risks (Tension):</strong> Are there conflicts or uncertainties that could slow progress?
                                          <br />
                                          Assessment: {result.tension_label || "N/A"}
                                    </li>

                                    <li>
                                          <strong>Ready now? (Convergence):</strong> Is this stable enough to act on today?
                                          <br />
                                          Assessment: {result.convergence_label || "N/A"}
                                    </li>
                              </ul>
                        </>
                  )}
            </div>
      )}


    </div>
  )
}
