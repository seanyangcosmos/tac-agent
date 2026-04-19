"use client"

import Link from "next/link"
import { useState } from "react"

type AnalyzeResult = {
  alignment: number
  tension: number
  convergence: number
  topology: string
  summary: string
  structural_verdict?: string
  key_conflicts?: string[]
  key_conditions?: string[]
}

function topologyLabel(topology: string) {
  switch (topology) {
    case "aligned-convergent":
      return "Ready"
    case "convergence-under-tension":
      return "Ready with tradeoffs"
    case "partial-convergence":
      return "Partially ready"
    case "misaligned-unstable":
      return "Not ready"
    case "high-tension-fragile":
      return "High conflict"
    case "error":
      return "Analysis error"
    default:
      return topology
  }
}

function topologyDescription(topology: string) {
  switch (topology) {
    case "aligned-convergent":
      return "Signals are aligned and converging toward execution."
    case "convergence-under-tension":
      return "Signals may still converge, but only under visible tension."
    case "partial-convergence":
      return "Signals are partially converging but not yet stable."
    case "misaligned-unstable":
      return "Signals are misaligned and structurally unstable."
    case "high-tension-fragile":
      return "Signals show high tension and fragile decision stability."
    case "error":
      return "The pattern could not be determined."
    default:
      return topology
  }
}

function verdictEmoji(topology: string) {
  switch (topology) {
    case "aligned-convergent":
      return "🟢"
    case "convergence-under-tension":
      return "🟡"
    case "partial-convergence":
      return "🟡"
    case "misaligned-unstable":
      return "🔴"
    case "high-tension-fragile":
      return "🔴"
    default:
      return "⚪"
  }
}

/**
 * 修正 structural_verdict wording
 */

function verdictText(verdict?: string, topology?: string) {
  if (!verdict) return ""

  switch (topology) {
    case "aligned-convergent":
      return "Execution conditions are structurally aligned."
    case "convergence-under-tension":
      return "Execution is possible, but tension must be managed."
    case "partial-convergence":
      return "Execution is possible if key gaps are resolved."
    case "misaligned-unstable":
      return "Execution conditions are not structurally aligned."
    case "high-tension-fragile":
      return "Execution stability is currently fragile."
    default:
      return verdict
  }
}

export default function ChatPage() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runAnalysis = async () => {
    if (!query.trim()) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })

      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error(err)
    }

    setIsLoading(false)
  }

  const scoreWidth = (value: number) =>
    `${Math.max(0, Math.min(100, value * 100))}%`

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-3xl px-6 py-12">

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe the decision..."
          className="w-full rounded-lg border p-4"
        />

        <button
          onClick={runAnalysis}
          className="mt-4 rounded-lg bg-blue-700 px-6 py-3 text-white"
        >
          Analyze Decision
        </button>

        {result && (
          <div className="mt-8 space-y-6">

            <div className="rounded-xl border bg-blue-50 p-6">

              <div className="text-sm font-semibold text-gray-600">
                Decision Readiness
              </div>

              <div className="mt-1 text-2xl font-bold">

                {verdictEmoji(result.topology)}

                {" "}

                {topologyLabel(result.topology)}

              </div>

              <div className="mt-2 text-sm text-gray-700">

                {verdictText(
                  result.structural_verdict,
                  result.topology
                )}

              </div>

            </div>

            <div>

              <div className="text-sm font-semibold mb-3">
                Core Signals
              </div>

              <div className="space-y-4">

                <SignalBar
                  label="Alignment"
                  value={result.alignment}
                  color="bg-blue-700"
                />

                <SignalBar
                  label="Tension"
                  value={result.tension}
                  color="bg-red-600"
                />

                <SignalBar
                  label="Convergence"
                  value={result.convergence}
                  color="bg-green-600"
                />

              </div>

            </div>

            <div>

              <div className="text-sm font-semibold mb-2">
                Decision Pattern
              </div>

              <div className="text-gray-700">
                {topologyDescription(result.topology)}
              </div>

            </div>

          </div>
        )}
      </div>
    </main>
  )
}

function SignalBar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div>

      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value.toFixed(2)}</span>
      </div>

      <div className="h-2 bg-gray-200 rounded">

        <div
          className={`h-2 rounded ${color}`}
          style={{ width: `${value * 100}%` }}
        />

      </div>

    </div>
  )
}
