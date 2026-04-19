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

export default function ChatPage() {
  const [query, setQuery] = useState("")
  const [context, setContext] = useState("")
  const [layer1, setLayer1] = useState("")
  const [layer2, setLayer2] = useState("")
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
        query.trim(),
        context.trim() ? `Context: ${context.trim()}` : "",
        layer1.trim() ? `Supporting factor: ${layer1.trim()}` : "",
        layer2.trim() ? `Competing factor: ${layer2.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n")

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: combinedQuery }),
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error(error)
      setResult({
        alignment: 0,
        tension: 0,
        convergence: 0,
        topology: "error",
        summary: "Unable to complete analysis.",
        structural_verdict: "Analysis unavailable",
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
    setContext("")
    setLayer1("")
    setLayer2("")
    setResult(null)
    setIsLoading(false)
    setActiveStep(0)
  }

  const scoreWidth = (value: number) =>
    `${Math.max(0, Math.min(100, value * 100))}%`

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-mono text-xs tracking-[0.18em] text-blue-700">
              TAC AGENT
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="text-xs text-gray-500">
              Decision Readiness Interface
            </div>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            ← Home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <section className="py-6 text-center">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-blue-700">
            Universal Decision Interface
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Is your decision ready to move forward?
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-7 text-gray-600">
            Check alignment, conflict, and execution readiness before acting.
          </p>
        </section>

        <section className="mt-8 rounded-xl border bg-gray-50">
          <div className="border-b px-7 py-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-600 bg-blue-50 font-mono text-[10px] text-blue-700">
                1
              </span>
              Decision
            </div>
            <p className="mb-3 text-sm italic text-gray-500">
              Describe the decision you want to evaluate.
            </p>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Should TAC-3D be positioned as a decision audit layer or reasoning engine?"
              className="min-h-[110px] w-full rounded-lg border bg-white px-4 py-3 text-[15px] outline-none focus:border-blue-600"
            />
          </div>

          <div className="border-b px-7 py-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-600 bg-blue-50 font-mono text-[10px] text-blue-700">
                2
              </span>
              Supporting factor <span className="normal-case tracking-normal font-normal">(optional)</span>
            </div>
            <p className="mb-3 text-sm italic text-gray-500">
              Add evidence, assumptions, or considerations that support this decision.
            </p>

            <div className="rounded-lg border bg-white">
              <div className="border-b px-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">
                Evidence Layer 1
              </div>
              <textarea
                value={layer1}
                onChange={(e) => setLayer1(e.target.value)}
                placeholder="Add a supporting factor..."
                className="min-h-[90px] w-full resize-y rounded-b-lg border-0 bg-white px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>

          <div className="border-b px-7 py-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-600 bg-blue-50 font-mono text-[10px] text-blue-700">
                3
              </span>
              Competing factor <span className="normal-case tracking-normal font-normal">(optional)</span>
            </div>
            <p className="mb-3 text-sm italic text-gray-500">
              Add risks, tradeoffs, or concerns that may affect the decision.
            </p>

            <div className="rounded-lg border bg-white">
              <div className="border-b px-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">
                Evidence Layer 2
              </div>
              <textarea
                value={layer2}
                onChange={(e) => setLayer2(e.target.value)}
                placeholder="Add a competing factor..."
                className="min-h-[90px] w-full resize-y rounded-b-lg border-0 bg-white px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>

          <div className="px-7 py-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-600 bg-blue-50 font-mono text-[10px] text-blue-700">
                4
              </span>
              Constraints or timing <span className="normal-case tracking-normal font-normal">(optional)</span>
            </div>
            <p className="mb-3 text-sm italic text-gray-500">
              Add limits, deadlines, or external conditions.
            </p>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. limited budget, near-term timeline, external dependencies"
              className="min-h-[90px] w-full rounded-lg border bg-white px-4 py-3 text-sm outline-none focus:border-blue-600"
            />
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={runAnalysis}
            disabled={isLoading || !query.trim()}
            className="rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Analyzing..." : "Analyze Decision"}
          </button>

          <button
            onClick={resetAll}
            className="rounded-lg border px-6 py-3 text-sm text-gray-600 transition hover:border-gray-400 hover:text-black"
          >
            Reset
          </button>

          <div className="text-sm leading-6 text-gray-500">
            TAC Agent helps you understand whether a decision is aligned,
            conflicted, or ready to execute.
          </div>
        </div>

        {isLoading && (
          <section className="mt-8 rounded-xl border bg-gray-50 px-8 py-10 text-center">
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
                • Measuring conflict
              </div>
              <div className={activeStep >= 4 ? "text-blue-700" : "text-gray-400"}>
                • Testing readiness
              </div>
              <div className={activeStep >= 5 ? "text-blue-700" : "text-gray-400"}>
                • Generating result
              </div>
            </div>
          </section>
        )}

        {result && !isLoading && (
          <section className="mt-8">
            <div className="mb-6 rounded-xl border border-blue-600 bg-blue-50 px-6 py-5 text-blue-700">
              <div className="mb-2 font-mono text-xs uppercase tracking-[0.14em]">
                Decision Readiness
              </div>
              <div className="text-2xl font-semibold">
                {topologyLabel(result.topology)}
              </div>
              <div className="mt-2 text-sm leading-6 text-blue-700">
                {result.structural_verdict || result.summary}
              </div>
            </div>

            <div className="mb-6 rounded-xl border bg-gray-50 px-7 py-6">
              <div className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                Core Signals
              </div>

              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="font-medium">Alignment</div>
                      <div className="text-xs text-gray-500">
                        Do goals and constraints match?
                      </div>
                    </div>
                    <div className="font-mono text-sm">
                      {result.alignment.toFixed(2)}
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-gray-200">
                    <div
                      className="h-full rounded bg-blue-700"
                      style={{ width: scoreWidth(result.alignment) }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="font-medium">Conflict</div>
                      <div className="text-xs text-gray-500">
                        Are priorities competing?
                      </div>
                    </div>
                    <div className="font-mono text-sm">
                      {result.tension.toFixed(2)}
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-gray-200">
                    <div
                      className="h-full rounded bg-red-600"
                      style={{ width: scoreWidth(result.tension) }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="font-medium">Readiness</div>
                      <div className="text-xs text-gray-500">
                        Can this move forward?
                      </div>
                    </div>
                    <div className="font-mono text-sm">
                      {result.convergence.toFixed(2)}
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-gray-200">
                    <div
                      className="h-full rounded bg-green-600"
                      style={{ width: scoreWidth(result.convergence) }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border bg-gray-50">
                <div className="border-b px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  Decision Pattern
                </div>
                <div className="px-6 py-5 text-sm leading-7 text-gray-700">
                  {topologyLabel(result.topology)}
                </div>
              </div>

              <div className="rounded-xl border bg-gray-50">
                <div className="border-b px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  What this means
                </div>
                <div className="px-6 py-5 text-sm leading-7 text-gray-700">
                  {result.summary}
                </div>
              </div>

              {result.key_conflicts && result.key_conflicts.length > 0 && (
                <div className="rounded-xl border bg-gray-50">
                  <div className="border-b px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
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
                <div className="rounded-xl border bg-gray-50">
                  <div className="border-b px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Conditions to watch
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
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
