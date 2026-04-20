"use client"

import Link from "next/link"
import { useState } from "react"

type AnalyzeResult = {
  alignment: number
  tension: number
  convergence: number
  topology: string
  summary: string
}

export default function ChatPage() {
  const [query, setQuery] = useState("")
  const [context, setContext] = useState("")
  const [layer1, setLayer1] = useState("")
  const [layer2, setLayer2] = useState("")
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  const userEmail = "sean4128@gmail.com"

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
      const combinedQuery = [
        query.trim(),
        context.trim() ? `Context: ${context.trim()}` : "",
        layer1.trim() ? `Support: ${layer1.trim()}` : "",
        layer2.trim() ? `Risks: ${layer2.trim()}` : "",
      ].join("\n")

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          decisions: [
            {
              query,
              support,
              risks,
              constraints
            }
          ]
        })
      const data = await response.json()

      if (data.upgrade) {
        alert(
          "You've used your 5 free evaluations.\n\n" +
            "Continue using TAC-3D here:\nhttps://sycds.com\n\n" +
            "Or contact:\nservice@sycds.com"
        )
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setResult(data)
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
  }

  const getRecommendation = (topology: string) => {
    switch (topology) {
      case "aligned-convergent":
        return "Ready now"
      case "convergence-under-tension":
        return "Ready, but start small"
      case "misaligned-unstable":
        return "Not ready yet"
      case "high-tension-fragile":
        return "Too risky right now"
      default:
        return "Needs more clarity"
    }
  }

  function scoreLabel(value: number) {
    if (value >= 0.75) return "Strong" 
    if (value >= 0.5) return "Moderate"
    if (value >= 0.25) return "Limited"
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

        <Link
          href="https://sycds.com"
          className="border px-6 py-3 rounded-lg"
        >
          Upgrade to Pro ($29/month)
        </Link>

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

          <h2 className="text-xl font-semibold mb-2">
            Recommendation
          </h2>

          <p className="text-lg mb-4">
            {getRecommendation(result.topology)}
          </p>

          <h3 className="font-semibold mt-6 mb-2">
            Why this result
          </h3>

          <p className="text-gray-700 mb-6">
            {result.summary ||
              "This decision makes sense, but a smaller first step may reduce risk."}
          </p>

          <h3 className="font-semibold mb-2">
            What we checked
          </h3>

          <ul className="space-y-2 text-gray-700">

            <li>
              <strong>Goal fit(Alignment):</strong> Does this goal match your current situation?
              <br />
              Assessment: {scoreLabel(result.alignment)}
            </li>

            <li>
              <strong>Risks(Tension):</strong> Are there conflicts or uncertainties that could slow progress?
              <br />
              Assessment: {scoreLabel(result.tension)}
            </li>

            <li>
              <strong>Ready now?(Convergence)</strong> Is this stable enough to act on today?
              <br />
              Assessment: {scoreLabel(result.convergence)}
            </li>

          </ul>

        </div>
      )}

    </div>
  )
}
