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
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runAnalysis = async () => {
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
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
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-3xl">
        <Link href="/" className="text-gray-500 hover:text-black">
          ← Back to Home
        </Link>

        <div className="mt-10">
          <h1 className="text-4xl font-semibold text-black">TAC Agent</h1>
          <p className="mt-3 text-gray-600">
            Evaluate a decision structure through Alignment, Tension, and Convergence.
          </p>
        </div>

        <div className="mt-8">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a decision question"
            className="w-full h-40 p-4 text-lg border rounded-lg resize-none focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <button
            onClick={runAnalysis}
            disabled={isLoading || !query.trim()}
            className="rounded-md bg-black px-6 py-3 text-white disabled:opacity-50"
          >
            {isLoading ? "Analyzing..." : "Run TAC Analysis"}
          </button>
        </div>

        {result && (
          <div className="mt-10 space-y-6">
            <section className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold">Alignment</h2>
              <p className="mt-2">{result.alignment.toFixed(2)}</p>
            </section>

            <section className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold">Tension</h2>
              <p className="mt-2">{result.tension.toFixed(2)}</p>
            </section>

            <section className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold">Convergence</h2>
              <p className="mt-2">{result.convergence.toFixed(2)}</p>
            </section>

            <section className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold">Topology</h2>
              <p className="mt-2">{result.topology}</p>
            </section>

            <section className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold">Summary</h2>
              <p className="mt-2">{result.summary}</p>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
