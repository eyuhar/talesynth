"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generateStoryResponse } from "@/lib/llm/openrouter";
import {
  createCharacterWithLoadout,
  getInitialStoryPrompt,
} from "@/lib/game-setup";
import {
  validateItem,
  validateStats,
  validateCurrency,
  updateMultipleSkills,
  softValidateEnemies,
} from "@/lib/game-helpers";

// TYPES

export interface AIResponse {
  story_text: string;
  choices: Array<{ id: string; text: string }>;
  stats_changes?: { hp?: number };
  inventory_changes?: Array<{
    type: string;
    name: string;
    description?: string;
    stats: Record<string, number>;
    quantity: number;
  }>;
  currency_changes?: { gold?: number; silver?: number; copper?: number };
  skills_used?: Array<{ skillId: string; usage_count: number }>;
  enemies?: Array<{
    name: string;
    hp: number;
    maxHp: number;
    armor: number;
    minDmg: number;
    maxDmg: number;
  }>;
}

export interface ProgressEntry {
  story_text: string;
  choices: Array<{ id: string; text: string }>;
  stats_changes?: any;
  inventory_changes?: any[];
  currency_changes?: any;
  skills_used?: any[];
  combat_started?: boolean;
  enemies?: any[];
  user_input?: string;
}

// START STORY

export async function startStory(
  characterName: string,
  gender: string
): Promise<{ success: boolean; storyId?: string; error?: string }> {
  const user = await requireAuth();

  try {
    // Create character with starter loadout
    const character = await createCharacterWithLoadout(
      user.id,
      characterName,
      gender
    );

    // Load character data for context
    const characterWithData = await prisma.character.findUnique({
      where: { id: character.id },
      include: {
        items: true,
        skills: true,
      },
    });

    if (!characterWithData) {
      return { success: false, error: "Character creation failed" };
    }

    // Build context for AI
    const initialPrompt = getInitialStoryPrompt(characterName, gender);

    const context = {
      character: {
        name: characterWithData.name,
        gender: characterWithData.gender,
        current_stats: characterWithData.currentStats,
        currency: {
          gold: characterWithData.goldCoins,
          silver: characterWithData.silverCoins,
          copper: characterWithData.copperCoins,
        },
      },
      inventory: characterWithData.items.map((item) => ({
        type: item.type,
        name: item.name,
        stats: item.stats,
        quantity: item.quantity,
        equipped: item.equipped,
      })),
      skills: characterWithData.skills.map((skill) => ({
        skillId: skill.skillId,
        name: skill.name,
        level: skill.level,
      })),
      initial_prompt: initialPrompt,
    };

    // Call AI
    const aiResponseText = await generateStoryResponse(context);

    // Parse AI response
    let aiResponse: AIResponse;
    try {
      aiResponse = JSON.parse(aiResponseText);
    } catch (err) {
      console.error("Failed to parse AI response:", err);
      return { success: false, error: "AI response parsing failed" };
    }

    // Validate AI response (soft validation)
    const validatedResponse = validateAIResponse(
      aiResponse,
      characterWithData.currentStats as any
    );

    // Create Story with initial progress
    const story = await prisma.story.create({
      data: {
        name: `${characterName}'s Adventure`,
        userId: user.id,
        characterId: character.id,
        lastResponse: validatedResponse as any,
        progress: {
          entries: [validatedResponse],
        } as any,
      },
    });

    return { success: true, storyId: story.id };
  } catch (error) {
    console.error("Error starting story:", error);
    return { success: false, error: "Failed to start story" };
  }
}

// CONTINUE STORY

export async function continueStory(
  storyId: string,
  userInput: string
): Promise<{ success: boolean; lastResponse?: any; error?: string }> {
  const user = await requireAuth();

  try {
    // Load story with character data
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
      return { success: false, error: "Story not found" };
    }

    const character = story.character;
    const progress = story.progress as any;
    const lastResponse = story.lastResponse as any;

    // Add user input to last response and push to progress
    const entryWithUserInput = {
      ...lastResponse,
      user_input: userInput,
    };

    const updatedProgress = {
      entries: [...(progress.entries || []), entryWithUserInput],
    };

    // Check if in combat (lastResponse has enemies array)
    const inCombat =
      lastResponse.enemies &&
      Array.isArray(lastResponse.enemies) &&
      lastResponse.enemies.length > 0;

    // Build context for AI
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
      inventory: character.items.map((item) => ({
        type: item.type,
        name: item.name,
        stats: item.stats,
        quantity: item.quantity,
        equipped: item.equipped,
      })),
      skills: character.skills.map((skill) => ({
        skillId: skill.skillId,
        name: skill.name,
        level: skill.level,
      })),
      // Include combat state if in combat
      ...(inCombat && {
        combat: {
          active: true,
          enemies: lastResponse.enemies,
        },
      }),
      // Recent history for context (last 3 entries)
      recent_history: updatedProgress.entries.slice(-3),
      current_action: userInput,
    };

    // Call AI
    const aiResponseText = await generateStoryResponse(context);

    // Parse AI response
    let aiResponse: AIResponse;
    try {
      aiResponse = JSON.parse(aiResponseText);
    } catch (err) {
      console.error("Failed to parse AI response:", err);
      return { success: false, error: "AI response parsing failed" };
    }

    // Validate AI response
    const validatedResponse = validateAIResponse(
      aiResponse,
      character.currentStats as any
    );

    // Process game state changes
    await processGameStateChanges(
      character.id,
      validatedResponse,
      character.currentStats as any,
      character.goldCoins,
      character.silverCoins,
      character.copperCoins
    );

    // Update story with new progress and lastResponse
    await prisma.story.update({
      where: { id: storyId },
      data: {
        lastResponse: validatedResponse as any,
        progress: {
          entries: [...updatedProgress.entries, validatedResponse],
        } as any,
      },
    });

    return { success: true, lastResponse: validatedResponse };
  } catch (error) {
    console.error("Error continuing story:", error);
    return { success: false, error: "Failed to continue story" };
  }
}

// GET LAST RESPONSE (for UI)

export async function getLastResponse(storyId: string) {
  const user = await requireAuth();

  try {
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId: user.id,
      },
      select: {
        lastResponse: true,
      },
    });

    if (!story) {
      return { success: false, error: "Story not found" };
    }

    return { success: true, lastResponse: story.lastResponse };
  } catch (error) {
    console.error("Error fetching last response:", error);
    return { success: false, error: "Failed to fetch last response" };
  }
}

// HELPER FUNCTIONS

/**
 * Validates AI response and corrects critical errors
 */
function validateAIResponse(
  response: AIResponse,
  currentStats: any
): AIResponse {
  const validated = { ...response };

  // Validate stats if present
  if (validated.stats_changes) {
    const newStats = {
      ...currentStats,
      hp: (currentStats.hp || 0) + (validated.stats_changes.hp || 0),
    };
    const validatedStats = validateStats(newStats);

    // Recalculate stats_changes based on validated values
    validated.stats_changes = {
      hp: validatedStats.hp - currentStats.hp,
    };
  }

  // Validate items if present
  if (validated.inventory_changes && validated.inventory_changes.length > 0) {
    validated.inventory_changes = validated.inventory_changes.map((item) =>
      validateItem(item)
    );
  }

  // Validate currency if present
  if (validated.currency_changes) {
    validated.currency_changes = validateCurrency(validated.currency_changes);
  }

  // Validate enemies if present
  if (validated.enemies && validated.enemies.length > 0) {
    const { correctedEnemies } = softValidateEnemies(validated.enemies);
    validated.enemies = correctedEnemies.filter((e) => e.hp > 0);
  }

  return validated;
}

/**
 * Processes game state changes (stats, inventory, currency, skills)
 */
async function processGameStateChanges(
  characterId: string,
  response: AIResponse,
  currentStats: any,
  currentGold: number,
  currentSilver: number,
  currentCopper: number
) {
  // Update character stats
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

  // Update inventory
  if (response.inventory_changes && response.inventory_changes.length > 0) {
    for (const change of response.inventory_changes) {
      if (change.quantity > 0) {
        // Add item
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
        // Remove/consume item
        const existingItem = await prisma.characterItem.findFirst({
          where: {
            characterId,
            type: change.type,
          },
        });

        if (existingItem) {
          const newQuantity = existingItem.quantity + change.quantity;

          if (newQuantity <= 0) {
            // Delete item
            await prisma.characterItem.delete({
              where: { id: existingItem.id },
            });
          } else {
            // Update quantity
            await prisma.characterItem.update({
              where: { id: existingItem.id },
              data: { quantity: newQuantity },
            });
          }
        }
      }
    }
  }

  // Update currency
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

  // Update skills
  if (response.skills_used && response.skills_used.length > 0) {
    await updateMultipleSkills(characterId, response.skills_used);
  }
}
