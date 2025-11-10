import {
  buildSystemPrompt,
  buildCharacterContext,
  buildCombatContext,
} from "@/lib/prompts/context-builder";

export async function generateStoryResponse(
  characterData: any,
  inventoryData: any[],
  skillsData: any[],
  userInput: string,
  combatData?: any
): Promise<string> {
  const systemPrompt = buildSystemPrompt();
  const characterContext = buildCharacterContext(
    characterData,
    inventoryData,
    skillsData
  );
  const combatContext = buildCombatContext(combatData);

  const userMessage = {
    character: characterContext.character,
    inventory: characterContext.inventory,
    skills: characterContext.skills,
    ...(combatContext && { combat: combatContext }),
    action: userInput,
  };

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(userMessage, null, 2) },
  ];

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "TaleSynth",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
        messages,
        temperature: 0.6, // creativity
        max_tokens: 4500,
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
