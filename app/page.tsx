import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-foreground">
          TAC Agent
        </h1>
        
        <p className="mt-4 text-lg md:text-xl text-muted-foreground font-medium tracking-wide uppercase">
          Target Alignment Criteria Agent
        </p>
        
        <p className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed text-balance">
          An AI decision agent based on Alignment, Tension, and Convergence.
        </p>
        
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="min-w-[160px]">
            <Link href="/chat">Enter Agent</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-w-[160px]">
            <Link href="/docs">Documentation</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
