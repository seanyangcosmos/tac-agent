import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const FREE_LIMIT = 5

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const runsCookie = cookieStore.get("tac_runs")
    let runs = runsCookie ? parseInt(runsCookie.value, 10) : 0

    if (runs >= FREE_LIMIT) {
      return NextResponse.json(
        {
          error: "limit reached",
          upgrade: true,
        },
        { status: 403 }
      )
    }

    const body = await req.json()
    const query = body.query || ""

    runs += 1

    const result = {
      decision: query,
      alignment: Math.random(),
      tension: Math.random(),
      convergence: Math.random(),
    }

    const response = NextResponse.json(result)

    response.cookies.set("tac_runs", runs.toString(), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (error) {
    console.error("analyze route error:", error)
    return NextResponse.json(
      { error: "analysis failed" },
      { status: 500 }
    )
  }
}
