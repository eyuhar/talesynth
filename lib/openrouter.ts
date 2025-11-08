// load environment variables from .env file
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL;

if (!OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set");
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Function to generate story response using OpenRouter API
export async function generateStoryResponse(
  messages: Message[]
): Promise<string> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        //        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "TaleSynth",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.9, // creativity (0.0 - 2.0)
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
