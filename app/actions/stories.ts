"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

// Get only last response (for quick display)
export async function getLastResponse(characterId: string) {
  const user = await requireAuth();

  try {
    // Only load lastResponse field
    const storyState = await prisma.storyState.findUnique({
      where: {
        characterId,
        // Ensure ownership
        character: {
          userId: user.id,
        },
      },
      select: {
        lastResponse: true,
      },
    });

    return { success: true, storyState };
  } catch (error) {
    console.error("Error fetching last response:", error);
    return { error: "Failed to fetch story" };
  }
}

// Get full story state (when needed)
export async function getFullStoryState(characterId: string) {
  const user = await requireAuth();

  try {
    // Load all story data when explicitly needed
    const storyState = await prisma.storyState.findUnique({
      where: {
        characterId,
        // Ensure ownership
        character: {
          userId: user.id,
        },
      },
    });

    return { success: true, storyState };
  } catch (error) {
    console.error("Error fetching story state:", error);
    return { error: "Failed to fetch story state" };
  }
}

// Start new story
export async function startStory(characterId: string) {
  const user = await requireAuth();

  try {
    // Verify ownership
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        userId: user.id,
      },
    });

    if (!character) {
      return { error: "Character not found" };
    }

    // Create initial story state
    const storyState = await prisma.storyState.create({
      data: {
        characterId,
      },
    });

    // revalidatePath(`/game/${characterId}`);
    return { success: true, storyState };
  } catch (error) {
    console.error("Error starting story:", error);
    return { error: "Failed to start story" };
  }
}

// Continue story (update only necessary fields)
export async function continueStory(characterId: string, userInput: string) {
  const user = await requireAuth();

  try {
    // Verify ownership
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        userId: user.id,
      },
    });

    if (!character) {
      return { error: "Character not found" };
    }

    // TODO: Call AI API here to generate response
    const aiResponse = `AI response to: ${userInput}`;

    // Update only necessary fields
    const storyState = await prisma.storyState.update({
      where: { characterId },
      data: {
        lastResponse: aiResponse,
        // progress and summary updated only when needed
      },
      // Select only what to return
      select: {
        lastResponse: true,
      },
    });

    // revalidatePath(`/game/${characterId}`);
    return { success: true, storyState };
  } catch (error) {
    console.error("Error continuing story:", error);
    return { error: "Failed to continue story" };
  }
}
