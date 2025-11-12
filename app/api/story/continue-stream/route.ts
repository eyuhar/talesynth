import { NextRequest } from "next/server";
import { generateStoryResponseStream } from "@/lib/llm/openrouter";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  validateItem,
  validateStats,
  validateCurrency,
  updateMultipleSkills,
  softValidateEnemies,
} from "@/lib/game-helpers";

export async function POST(request: NextRequest) {
  try {
    // Auth Check
    const user = await requireAuth();
    if (!user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { storyId, userInput } = await request.json();

    // load story with character, items, skills
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: user.id,
      },
      include: {
        character: {
          include: {
            items: true,
            skills: true,
          },
        },
      },
    });

    if (!story) {
      return new Response(JSON.stringify({ error: "Story not found" }), {
        status: 404,
      });
    }

    const character = story.character;
    const progress = story.progress as any;
    const lastResponse = story.lastResponse as any;

    // build context
    const entryWithUserInput = {
      ...lastResponse,
      user_input: userInput,
    };

    const updatedProgress = {
      entries: [...(progress.entries || []), entryWithUserInput],
    };

    const inCombat =
      lastResponse.enemies &&
      Array.isArray(lastResponse.enemies) &&
      lastResponse.enemies.length > 0;

    const context = {
      character: {
        name: character.name,
        gender: character.gender,
        current_stats: character.currentStats,
        currency: {
          gold: character.goldCoins,
          silver: character.silverCoins,
          copper: character.copperCoins,
        },
      },
      inventory: character.items.map((item: any) => ({
        type: item.type,
        name: item.name,
        stats: item.stats,
        quantity: item.quantity,
        equipped: item.equipped,
      })),
      skills: character.skills.map((skill: any) => ({
        skillId: skill.skillId,
        name: skill.name,
        level: skill.level,
      })),
      ...(inCombat && {
        combat: {
          active: true,
          enemies: lastResponse.enemies,
        },
      }),
      recent_history: updatedProgress.entries.slice(-3),
      current_action: userInput,
    };

    // get stream from openrouter
    const stream = await generateStoryResponseStream(context);

    // Split stream: one for client, one for saving
    const [streamToClient, streamToSave] = stream.tee();

    // Save in background (non-blocking)
    saveStreamToDatabase(
      streamToSave,
      storyId,
      character.id,
      updatedProgress,
      character.currentStats as any,
      character.goldCoins,
      character.silverCoins,
      character.copperCoins
    );

    // send stream to client
    return new Response(streamToClient, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream error:", error);
    return new Response(JSON.stringify({ error: "Failed to stream story" }), {
      status: 500,
    });
  }
}

/**
 * Saves streamed response to database
 */
async function saveStreamToDatabase(
  stream: ReadableStream,
  storyId: string,
  characterId: string,
  updatedProgress: any,
  currentStats: any,
  currentGold: number,
  currentSilver: number,
  currentCopper: number
) {
  try {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              fullText += content;
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      }
    }

    // Parse AI Response
    const aiResponse = JSON.parse(fullText);

    // Validate Response
    const validatedResponse = validateAIResponse(aiResponse, currentStats);

    // Process Game State Changes
    await processGameStateChanges(
      characterId,
      validatedResponse,
      currentStats,
      currentGold,
      currentSilver,
      currentCopper
    );

    // Update Story
    await prisma.story.update({
      where: { id: storyId },
      data: {
        lastResponse: validatedResponse as any,
        progress: {
          entries: [...updatedProgress.entries, validatedResponse],
        } as any,
      },
    });
  } catch (error) {
    console.error("Error saving stream to DB:", error);
  }
}

/**
 * Validates AI response
 */
function validateAIResponse(response: any, currentStats: any): any {
  const validated = { ...response };

  if (validated.stats_changes) {
    const newStats = {
      ...currentStats,
      hp: (currentStats.hp || 0) + (validated.stats_changes.hp || 0),
    };
    const validatedStats = validateStats(newStats);
    validated.stats_changes = {
      hp: validatedStats.hp - currentStats.hp,
    };
  }

  if (validated.inventory_changes && validated.inventory_changes.length > 0) {
    validated.inventory_changes = validated.inventory_changes.map((item: any) =>
      validateItem(item)
    );
  }

  if (validated.currency_changes) {
    validated.currency_changes = validateCurrency(validated.currency_changes);
  }

  if (validated.enemies && validated.enemies.length > 0) {
    const { correctedEnemies } = softValidateEnemies(validated.enemies);
    validated.enemies = correctedEnemies.filter((e: any) => e.hp > 0);
  }

  return validated;
}

/**
 * Processes game state changes
 */
async function processGameStateChanges(
  characterId: string,
  response: any,
  currentStats: any,
  currentGold: number,
  currentSilver: number,
  currentCopper: number
) {
  if (response.stats_changes) {
    const newStats = {
      ...currentStats,
      hp: (currentStats.hp || 0) + (response.stats_changes.hp || 0),
    };
    const validatedStats = validateStats(newStats);

    await prisma.character.update({
      where: { id: characterId },
      data: {
        currentStats: validatedStats,
      },
    });
  }

  if (response.inventory_changes && response.inventory_changes.length > 0) {
    for (const change of response.inventory_changes) {
      if (change.quantity > 0) {
        await prisma.characterItem.create({
          data: {
            characterId,
            type: change.type,
            name: change.name,
            description: change.description || "",
            stats: change.stats,
            quantity: change.quantity,
            equipped: false,
          },
        });
      } else if (change.quantity < 0) {
        const existingItem = await prisma.characterItem.findFirst({
          where: {
            characterId,
            type: change.type,
          },
        });

        if (existingItem) {
          const newQuantity = existingItem.quantity + change.quantity;

          if (newQuantity <= 0) {
            await prisma.characterItem.delete({
              where: { id: existingItem.id },
            });
          } else {
            await prisma.characterItem.update({
              where: { id: existingItem.id },
              data: { quantity: newQuantity },
            });
          }
        }
      }
    }
  }

  if (response.currency_changes) {
    const newGold = currentGold + (response.currency_changes.gold || 0);
    const newSilver = currentSilver + (response.currency_changes.silver || 0);
    const newCopper = currentCopper + (response.currency_changes.copper || 0);

    const validatedCurrency = validateCurrency({
      gold: newGold,
      silver: newSilver,
      copper: newCopper,
    });

    await prisma.character.update({
      where: { id: characterId },
      data: {
        goldCoins: validatedCurrency.gold,
        silverCoins: validatedCurrency.silver,
        copperCoins: validatedCurrency.copper,
      },
    });
  }

  if (response.skills_used && response.skills_used.length > 0) {
    await updateMultipleSkills(characterId, response.skills_used);
  }
}
