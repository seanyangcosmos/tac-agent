import { spawn } from "child_process"

export async function POST() {
  try {
    spawn("tac-agent", ["start"], {
      detached: true,
      stdio: "ignore",
    }).unref()

    return Response.json({
      status: "runtime_started",
    })
  } catch (error) {
    return Response.json(
      { error: "Failed to start TAC runtime" },
      { status: 500 }
    )
  }
}
