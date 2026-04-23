import Stripe from "stripe"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "../../../lib/supabase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed.", err)
    return NextResponse.json(
      { error: "Webhook Error" },
      { status: 400 }
    )
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const userId =
        session.customer_details?.email ||
        session.customer_email ||
        session.metadata?.user_id

      if (!userId) {
        console.error("No user identifier found in checkout session")
        return NextResponse.json(
          { error: "No user identifier found" },
          { status: 400 }
        )
      }

      const { error } = await supabaseAdmin
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            plan: "pro",
          },
          { onConflict: "user_id" }
        )

      if (error) {
        console.error("Supabase upsert failed:", error)
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        )
      }

      console.log("Subscription activated for:", userId)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("Webhook route error:", err)
    return NextResponse.json(
      { error: "server error" },
      { status: 500 }
    )
  }
}
