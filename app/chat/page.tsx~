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

function verdictText(verdict?: string, topology?: string) {
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
      return verdict || ""
  }
}

function SignalBar({
  label,
  helper,
  value,
  color,
}: {
  label: string
  helper: string
  value: number
  color: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-xs text-gray-500">{helper}</div>
        </div>
        <div className="font-mono text-sm">{value.toFixed(2)}</div>
      </div>

      <div className="h-2 overflow-hidden rounded bg-gray-200">
        <div
          className={`h-full rounded ${color}`}
          style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
        />
      </div>
    </div>
  )
}

export default function ChatPage() {
  const upgradeToPro = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
    })

    const data = await res.json()

    if (data.url) {
      window.location.href = data.url
    }
  }


  const [query, setQuery] = useState("")
  const [supportingSignals, setSupportingSignals] = useState("")
  const [risks, setRisks] = useState("")
  const [constraints, setConstraints] = useState("")
  const [showContext, setShowContext] = useState(false)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  const runAnalysis = async () => {
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setResult(null)
    setActiveStep(1)

    const timers = [
      setTimeout(() => setActiveStep(2), 700),
      setTimeout(() => setActiveStep(3), 1400),
      setTimeout(() => setActiveStep(4), 2200),
      setTimeout(() => setActiveStep(5), 2800),
    ]

    try {
      const combinedQuery = [
        `Decision: ${query.trim()}`,
        supportingSignals.trim()
          ? `Supporting signals: ${supportingSignals.trim()}`
          : "",
        risks.trim() ? `Risks or tradeoffs: ${risks.trim()}` : "",
        constraints.trim()
          ? `Constraints or timing: ${constraints.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n")

      const userEmail = "trial@sycds.com"

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          query: combinedQuery
        }), 
      })

      const data = await response.json()

      if (data.upgrade) {
        alert(
          "Free evaluation limit reached (5 runs)\n\n" +
          "Continue using TAC-3D:\nhttps://sycds.com\n\n" +
          "Contact:\nservice@sycds.com"
        )
        return
      }

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setResult(data)
    } catch (error) {
      console.error(error)
      setResult({
        alignment: 0,
        tension: 0,
        convergence: 0,
        topology: "error",
        summary: "Unable to complete analysis.",
        structural_verdict: "Analysis unavailable.",
        key_conflicts: [],
        key_conditions: [],
      })
    } finally {
      timers.forEach(clearTimeout)
      setTimeout(() => {
        setIsLoading(false)
        setActiveStep(0)
      }, 300)
    }
  }

  const resetAll = () => {
    setQuery("")
    setSupportingSignals("")
    setRisks("")
    setConstraints("")
    setShowContext(false)
    setResult(null)
    setIsLoading(false)
    setActiveStep(0)
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="font-mono text-xs tracking-[0.18em] text-blue-700">
            TAC AGENT
          </div>

          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            ← Home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-blue-700">
            Universal Decision Interface
          </div>

          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            What decision are you evaluating?
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-7 text-gray-600">
            Describe the situation. Add context if needed.
          </p>
        </section>

        <section className="mx-auto mt-10 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-900">
              Decision
            </label>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Example: Should TAC-3D be deployed now despite resource uncertainty?"
              className="min-h-[140px] w-full rounded-xl border border-gray-300 bg-white px-5 py-4 text-[16px] outline-none focus:border-blue-600"
            />
          </div>

          <div className="mt-4">
            <button
              onClick={() => setShowContext(!showContext)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {showContext ? "− Hide context" : "+ Add context (optional)"}
            </button>
          </div>

          {showContext && (
            <div className="mt-5 space-y-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  What supports this decision?
                </label>

                <textarea
                  value={supportingSignals}
                  onChange={(e) => setSupportingSignals(e.target.value)}
                  placeholder="Add evidence, assumptions, or supporting factors..."
                  className="min-h-[100px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  What could work against it?
                </label>

                <textarea
                  value={risks}
                  onChange={(e) => setRisks(e.target.value)}
                  placeholder="Add risks, tradeoffs, or concerns..."
                  className="min-h-[100px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Constraints or timing
                </label>

                <textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="Budget limits, deadlines, dependencies..."
                  className="min-h-[100px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-blue-600"
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={runAnalysis}
              disabled={isLoading || !query.trim()}
              className="rounded-xl bg-blue-700 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? "Analyzing..." : "Analyze Decision"}
            </button>

            <button
              onClick={upgradeToPro}
              className="mt-4 px-5 py-2 rounded-lg bg-black text-white"
            >
              Upgrade to Pro ($29/month)
            </button>


            <button
              onClick={resetAll}
              className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:text-black"
            >
              Reset
            </button>
          </div>

          <p className="mt-4 text-sm leading-6 text-gray-500">
            TAC Agent helps you understand whether a decision is aligned, conflicted, or ready to execute. The first 5 evaluations are free.
          </p>
        </section>

        {isLoading && (
          <section className="mx-auto mt-8 max-w-2xl rounded-2xl border border-gray-200 bg-gray-50 px-8 py-10 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-blue-700" />

            <div className="mt-5 font-mono text-xs tracking-[0.1em] text-gray-500">
              ANALYZING DECISION
            </div>

            <div className="mx-auto mt-6 max-w-sm space-y-2 text-left">
              <div className={activeStep >= 1 ? "text-blue-700" : "text-gray-400"}>
                • Reading the decision
              </div>
              <div className={activeStep >= 2 ? "text-blue-700" : "text-gray-400"}>
                • Checking alignment
              </div>
              <div className={activeStep >= 3 ? "text-blue-700" : "text-gray-400"}>
                • Measuring tension
              </div>
              <div className={activeStep >= 4 ? "text-blue-700" : "text-gray-400"}>
                • Testing convergence
              </div>
              <div className={activeStep >= 5 ? "text-blue-700" : "text-gray-400"}>
                • Generating result
              </div>
            </div>
          </section>
        )}

        {result && !isLoading && (
          <section className="mx-auto mt-8 max-w-2xl space-y-4">
            <div className="rounded-2xl border border-blue-300 bg-blue-50 px-6 py-5 text-blue-700">
              <div className="mb-2 text-sm font-semibold">Decision Readiness</div>

              <div className="text-2xl font-semibold">
                {verdictEmoji(result.topology)} {topologyLabel(result.topology)}
              </div>

              <div className="mt-2 text-sm leading-6">
                {verdictText(result.structural_verdict, result.topology)}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
              <div className="mb-5 text-sm font-semibold text-gray-900">
                Core Signals
              </div>

              <div className="space-y-5">
                <SignalBar
                  label="Alignment"
                  helper="Do goals and constraints match?"
                  value={result.alignment}
                  color="bg-blue-700"
                />

                <SignalBar
                  label="Tension"
                  helper="Are priorities competing?"
                  value={result.tension}
                  color="bg-red-600"
                />

                <SignalBar
                  label="Convergence"
                  helper="Can this move forward?"
                  value={result.convergence}
                  color="bg-green-600"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b px-6 py-4 text-sm font-semibold text-gray-900">
                Decision Pattern
              </div>

              <div className="px-6 py-5 text-sm leading-7 text-gray-700">
                {topologyDescription(result.topology)}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b px-6 py-4 text-sm font-semibold text-gray-900">
                What this means
              </div>

              <div className="px-6 py-5 text-sm leading-7 text-gray-700">
                {result.summary}
              </div>
            </div>

            {result.key_conflicts && result.key_conflicts.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b px-6 py-4 text-sm font-semibold text-gray-900">
                  Key conflicts
                </div>

                <div className="px-6 py-5">
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-gray-700">
                    {result.key_conflicts.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {result.key_conditions && result.key_conditions.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b px-6 py-4 text-sm font-semibold text-gray-900">
                  What needs attention
                </div>

                <div className="px-6 py-5">
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-gray-700">
                    {result.key_conditions.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
