import { NextResponse } from "next/server"
import { supabaseAdmin } from "../../../lib/supabase-admin"

const FREE_LIMIT = 5
const PRO_LIMIT = 150

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const user_id = String(body.user_id || "").trim()

    if (!user_id) {
      return NextResponse.json({ error: "missing user_id" }, { status: 400 })
    }

    // 1️⃣ 讀 subscription
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("plan,status")
      .eq("user_id", user_id)
      .single()

    let plan = "free"

    if (sub && sub.status === "active") {
      plan = sub.plan
    }

    const limit = plan === "pro" ? PRO_LIMIT : FREE_LIMIT

    // 2️⃣ 計算 usage
    const { count } = await supabaseAdmin
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)

    const runs_used = count || 0
    const runs_left = Math.max(limit - runs_used, 0)

    return NextResponse.json({
      allowed: runs_left > 0,
      plan,
      runs_used,
      runs_limit: limit,
      runs_left,
      upgrade_required: runs_left === 0
    })
  } catch (err) {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
