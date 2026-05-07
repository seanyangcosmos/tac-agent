"use client";

import { useState } from "react";

export default function SetupPage() {
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");

  async function saveKey() {
    await fetch("/api/setup", {
      method: "POST",
      body: JSON.stringify({
        provider,
        apiKey,
      }),
    });

    window.location.href = "/chat";
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Select your LLM provider</h2>

      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
      >
        <option value="openai">OpenAI</option>
        <option value="anthropic">Claude</option>
        <option value="groq">Groq</option>
        <option value="ollama">Local model</option>
      </select>

      <br /><br />

      <input
        placeholder="Enter your API key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />

      <br /><br />

      <button onClick={saveKey}>
        Save and continue
      </button>
    </div>
  );
}
