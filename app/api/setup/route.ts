import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  const body = await req.json();

  const envPath = path.join(process.cwd(), ".env.local");

  const content = `
LLM_PROVIDER=${body.provider}
OPENAI_API_KEY=${body.apiKey}
`;

  fs.writeFileSync(envPath, content);

  return Response.json({ ok: true });
}
