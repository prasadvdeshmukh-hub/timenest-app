import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error("Missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key.");
  process.exit(1);
}

const client = new Anthropic({ apiKey });

try {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 120,
    messages: [
      {
        role: "user",
        content: "Reply with one short sentence confirming the API connection works."
      }
    ]
  });

  const text = response.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");

  console.log(text || "Connected, but no text content was returned.");
} catch (error) {
  console.error("Claude request failed.");
  console.error(error?.message ?? error);
  process.exit(1);
}
