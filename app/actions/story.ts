"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { generateStoryResponse } from "@/lib/llm/openrouter";
import type { Message } from "@/lib/llm/openrouter";
import systemPrompt from "@/lib/llm/systemPrompt";

// Types for StoryRecord and Progress
export type StoryRecord = {
  story_text: string;
  choices: string[];
  stats: { [key: string]: any };
  user_input: string | null;
};

export type Progress = {
  entries: StoryRecord[];
};

// Get last N entries from progress for context to LLM
function getRecentEntries(progress: Progress, n: number): StoryRecord[] {
  return progress.entries.slice(-n);
}

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

    return { success: true, lastResponse: storyState?.lastResponse };
  } catch (error) {
    console.error("Error fetching last response:", error);
    return { error: "Failed to fetch last response" };
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

  // verify ownership
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
  });
  if (!character) return { error: "Character not found" };

  // Prepare initial user message
  const initialUserMessage = `The player is traveling alone. They see a village in the distance that seems intact but shows signs of conflict. The player moves towards the village.`;

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: initialUserMessage },
  ];

  // Call AI
  let aiResponseText: string;
  try {
    aiResponseText = await generateStoryResponse(messages);
  } catch (err) {
    console.error("AI call failed:", err);
    return { error: "AI call failed" };
  }

  // Parse AI JSON response
  let aiResponse: StoryRecord;
  try {
    aiResponse = JSON.parse(aiResponseText);
  } catch (err) {
    console.error("Failed to parse AI response JSON:", err);
    return { error: "AI response parsing failed" };
  }

  // Build initial progress entry
  const initialProgress: Progress = {
    entries: [{ ...aiResponse, user_input: null }],
  };

  // Check if storyState exists
  let storyState = await prisma.storyState.findUnique({
    where: { characterId },
  });

  if (!storyState) {
    // Create new storyState with AI response
    storyState = await prisma.storyState.create({
      data: {
        characterId,
        progress: initialProgress as any,
        lastResponse: aiResponse,
      },
    });
  } else {
    // Or update existing storyState (optional, if re-start allowed)
    storyState = await prisma.storyState.update({
      where: { characterId },
      data: {
        progress: initialProgress as any,
        lastResponse: aiResponse,
      },
    });
  }

  // Return full storyState
  return { success: true, storyState };
}

// Continue story
export async function continueStory(characterId: string, userInput: string) {
  const user = await requireAuth();

  // Verify ownership
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
  });
  if (!character) return { error: "Character not found" };

  // Load current storyState
  const storyState = await prisma.storyState.findUnique({
    where: { characterId },
  });
  if (!storyState) return { error: "StoryState not found" };

  const progress: Progress = storyState.progress as Progress;
  const lastResponse: StoryRecord = storyState.lastResponse as StoryRecord;

  // Append last user input to progress
  const newEntry: StoryRecord = { ...lastResponse, user_input: userInput };
  const newProgressEntries = [...progress.entries, newEntry];

  // Prepare messages for LLM (last 5 entries for context)
  const recentEntries = getRecentEntries({ entries: newProgressEntries }, 5);

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(recentEntries) },
  ];

  // Call AI
  let aiResponseText: string;
  try {
    aiResponseText = await generateStoryResponse(messages);
    console.log(aiResponseText);
  } catch (err) {
    console.error("AI call failed:", err);
    return { error: "AI call failed" };
  }

  // Parse AI JSON response
  let aiResponse: StoryRecord;
  try {
    aiResponse = JSON.parse(aiResponseText);
  } catch (err) {
    console.error("Failed to parse AI response JSON:", err);
    return { error: "AI response parsing failed" };
  }

  // Update progress and lastResponse
  const updatedProgress: Progress = {
    entries: [...newProgressEntries, { ...aiResponse, user_input: null }],
  };

  const updatedStoryState = await prisma.storyState.update({
    where: { characterId },
    data: {
      progress: updatedProgress,
      lastResponse: aiResponse,
    },
  });

  return { success: true, lastResponse: aiResponse };
}
