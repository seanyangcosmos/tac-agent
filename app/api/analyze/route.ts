import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const FREE_LIMIT = 5

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()

    const runsCookie = cookieStore.get("tac_runs")
    let runs = runsCookie ? parseInt(runsCookie.value) : 0

    if (runs >= FREE_LIMIT) {
      return NextResponse.json({
        error: "limit reached",
        upgrade: true,
      })
    }

    runs += 1

    cookieStore.set("tac_runs", runs.toString(), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    const body = await req.json()
    const query = body.query || ""

    const result = {
      decision: query,
      alignment: Math.random(),
      tension: Math.random(),
      convergence: Math.random(),
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: "analysis failed" },
      { status: 500 }
    )
  }
}

