import { NextResponse } from "next/server"

const FREE_LIMIT = 5

let runs = 0

export async function POST(req: Request) {
  try {
    if (runs >= FREE_LIMIT) {
      return NextResponse.json({
        error: "limit reached",
        upgrade: true,
      })
    }

    runs++

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
