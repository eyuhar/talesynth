// OpenRouter API integration with context building

import { buildSystemPrompt } from "../prompts/context-builder";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL;

if (!OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set");
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Generates story response using OpenRouter API
 * @param context - Full game context (character, inventory, skills, combat, etc.)
 */
export async function generateStoryResponse(context: any): Promise<string> {
  // Build system prompt
  const systemPrompt = buildSystemPrompt();

  // Build user message with all context
  const userMessage = JSON.stringify(context, null, 2);

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "TaleSynth",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.6, // creativity (0.0 - 2.0)
        max_tokens: 4500, // max response length
        presence_penalty: 0.3, // encourage new topics
        frequency_penalty: 0.3, // reduce repetition
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();

  return data.choices[0].message.content;
}

/**
 * STREAMING VERSION
 * returns ReadableStream
 */
export async function generateStoryResponseStream(
  context: any
): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt = buildSystemPrompt();
  const userMessage = JSON.stringify(context, null, 2);

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "TaleSynth",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.6,
        max_tokens: 4500,
        presence_penalty: 0.3,
        frequency_penalty: 0.3,
        stream: true,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  return response.body!;
}
