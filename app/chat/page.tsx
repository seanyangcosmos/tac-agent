"use client"

import Link from "next/link"
import { useState } from "react"

export default function ChatPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{
    alignment: string
    tension: string
    convergence: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runAnalysis = async () => {
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setResults(null)

    try {
      const response = await fetch("/api/tac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("TAC analysis error:", error)
      setResults({
        alignment: "Unable to complete analysis. Please try again.",
        tension: "Unable to complete analysis. Please try again.",
        convergence: "Unable to complete analysis. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
        >
          ← Back to Home
        </Link>

        <div className="mt-12 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-black">
            TAC Agent Interface
          </h1>
        </div>

        <div className="mt-12">
          <p className="text-gray-500 mb-4">
            Ask a strategic decision question to evaluate structure before action.
          </p>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your decision question"
            className="w-full h-40 p-4 text-lg border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black/20 transition-shadow"
          />
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Examples:</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li
                className="cursor-pointer hover:text-black transition-colors"
                onClick={() => setQuery("Should a biotech startup prioritize speed or certainty?")}
              >
                Should a biotech startup prioritize speed or certainty?
              </li>
              <li
                className="cursor-pointer hover:text-black transition-colors"
                onClick={() => setQuery("Should we expand now or wait for better market signals?")}
              >
                Should we expand now or wait for better market signals?
              </li>
              <li
                className="cursor-pointer hover:text-black transition-colors"
                onClick={() => setQuery("Should TAC-3D be positioned as a decision audit layer or reasoning engine?")}
              >
                Should TAC-3D be positioned as a decision audit layer or reasoning engine?
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            className="min-w-[200px] rounded-md bg-black px-6 py-3 text-white disabled:opacity-50"
            onClick={runAnalysis}
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? "Analyzing..." : "Run TAC Analysis"}
          </button>
        </div>

        <div className="mt-16 grid gap-8">
          <section className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold text-black mb-1">Alignment</h2>
            <p className="text-sm text-gray-500 mb-3">
              Are your goals and constraints compatible?
            </p>
            <p className="text-black">
              {isLoading ? "Analyzing..." : results ? results.alignment : "Analysis results will appear here..."}
            </p>
          </section>

          <section className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold text-black mb-1">Tension</h2>
            <p className="text-sm text-gray-500 mb-3">
              What conflicts exist inside the decision structure?
            </p>
            <p className="text-black">
              {isLoading ? "Analyzing..." : results ? results.tension : "Analysis results will appear here..."}
            </p>
          </section>

          <section className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold text-black mb-1">Convergence</h2>
            <p className="text-sm text-gray-500 mb-3">
              Can the decision realistically stabilize?
            </p>
            <p className="text-black">
              {isLoading ? "Analyzing..." : results ? results.convergence : "Analysis results will appear here..."}
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
