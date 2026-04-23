import { NextResponse } from "next/server"
import { supabaseAdmin } from "../../../lib/supabase-admin"

const FREE_LIMIT = 5
const PRO_LIMIT = 150
const UNLIMITED_EMAILS = ["sean4128@gmail.com"]

function safeText(value: unknown): string {
  return String(value || "").trim().toLowerCase()
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const user_id = safeText(body?.user_id || body?.email)

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id required" },
        { status: 400 }
      )
    }

    if (UNLIMITED_EMAILS.includes(user_id)) {
      return NextResponse.json({
        allowed: true,
        plan: "unlimited",
        used: 0,
        limit: null,
        remaining: null,
      })
    }

    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("plan,status")
      .eq("user_id", user_id)
      .eq("status", "active")
      .maybeSingle()

    if (subError) {
      console.error("check_quota subscription error:", subError)
      return NextResponse.json(
        { error: "failed to check subscription" },
        { status: 500 }
      )
    }

    const plan = subscription?.plan === "pro" ? "pro" : "free"
    const limit = plan === "pro" ? PRO_LIMIT : FREE_LIMIT

    const monthStart = new Date()
    monthStart.setUTCDate(1)
    monthStart.setUTCHours(0, 0, 0, 0)

    const { count, error: countError } = await supabaseAdmin
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)
      .eq("action", "tac_check")
      .gte("created_at", monthStart.toISOString())

    if (countError) {
      console.error("check_quota usage count error:", countError)
      return NextResponse.json(
        { error: "failed to check usage" },
        { status: 500 }
      )
    }

    const used = count || 0
    const remaining = Math.max(limit - used, 0)
    const allowed = used < limit

    return NextResponse.json({
      allowed,
      plan,
      used,
      limit,
      remaining,
    })
  } catch (error) {
    console.error("check_quota route error:", error)
    return NextResponse.json(
      { error: "server error" },
      { status: 500 }
    )
  }
}
