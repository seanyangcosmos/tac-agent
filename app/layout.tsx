import "./globals.css"
import type { ReactNode } from "react"

export const metadata = {
  title: "TAC Agent",
  description: "Decision readiness interface",
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


