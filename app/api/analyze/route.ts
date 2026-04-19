import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const FREE_LIMIT = 5
const DB_PATH = path.join(process.cwd(), "email_runs.json")

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}))
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"))
}

function saveDB(db: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = body.email
    const query = body.query || ""

    if (!email) {
      return NextResponse.json(
        { error: "email required" },
        { status: 400 }
      )
    }

    const db = loadDB()

    let runs = db[email] || 0

    if (runs >= FREE_LIMIT) {
      return NextResponse.json({
        error: "limit reached",
        upgrade: true,
      })
    }

    runs += 1
    db[email] = runs
    saveDB(db)

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

