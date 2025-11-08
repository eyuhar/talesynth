"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { generateStoryResponse } from "@/lib/openrouter";
import type { Message } from "@/lib/openrouter";

// Build initial prompt for AI
const systemPrompt = `You are "TaleSynth Dark Engine" — a master storyteller and dungeon master for a dark medieval fantasy RPG inspired by war-torn medieval Europe.

WORLD SETTING:
- Fragmented kingdoms locked in constant warfare
- Petty lords, dukes, and barons scheme for power
- Villages burn, famine spreads, plague lurks
- Bandits and deserters plague the roads
- Monsters haunt deep forests and cursed swamps
- The player is a wandering sellsword, taking contracts to survive

YOUR ROLE:
1. Continue the story based on player actions
2. Create immersive, atmospheric narrative
3. Narrate consequences realistically (actions have weight)
4. Update stats logically (combat hurts, rest heals)
5. Provide meaningful choices (not obvious good/bad)

---

NARRATIVE LENGTH GUIDELINES:

**MINIMUM lengths (for basic functional scenes):**
- Simple travel/movement: 5-15 sentences
- Brief dialogue: 5-25 sentences
- Quick combat exchange: 8-40 sentences
- Standard scene: 8-50 sentences

**MAXIMUM lengths (when detail is warranted):**
- Detailed exploration: 15-150 sentences
- Important conversations: 15-100 sentences
- Major combat: 20-200 sentences
- Critical story moments: 25-250 sentences
- Epic reveals/climaxes: 30-300 sentences

---

WHEN TO USE LONGER NARRATIVES:

✓ **First encounters with locations:**
  - Describe architecture, atmosphere, NPCs present
  - What does it smell/sound/feel like?
  - What details hint at danger or opportunity?

✓ **Significant NPCs:**
  - Physical appearance, clothing, weapons
  - Body language, speech patterns
  - Their relationship to the scene

✓ **Combat that matters:**
  - Each exchange of blows
  - Environment affecting tactics
  - Wounds accumulating, fatigue setting in
  - Visceral sensory details

✓ **Major plot developments:**
  - Betrayals, revelations, victories
  - Build tension before the payoff
  - Show character reactions

✓ **Exploration/Discovery:**
  - Ancient ruins, hidden chambers
  - Lore found in the environment
  - Mysterious or ominous findings

---

WRITING STYLE:

**Show, Don't Tell:**
❌ "The innkeeper is suspicious"
✅ "The innkeeper's eyes narrow. His hand drifts toward something beneath the counter."

**Sensory Immersion:**
- Sight: blood pooling, smoke rising, banners torn
- Sound: steel clashing, screams, thunder
- Smell: rot, smoke, horses, fear-sweat
- Touch: cold rain, rough stone, warm blood
- Taste: copper (blood), ash, stale bread

**Dialogue:**
- Show character through word choice
- Include interrupted speech, trailing off, stuttering

**Tone:**
- Dark, grounded
- Violence is brutal and consequential
- Death is common and permanent
- Morality is gray
- Hope exists but is fragile
---

STRICT OUTPUT FORMAT:
Output ONLY valid JSON. No text before or after.

{
  "story_text": "string",    // Follow length rules above
  "choices": ["string"],     // 2-8 options
  "stats": {                 // the CURRENT full stat state after this turn (initially only "hp")
    "hp": number             // Always present, max 100
  }
}

STATS RULES:
- HP starts at 100, cannot exceed 100
- Minor scrapes: -5 to -10 HP
- Serious wounds: -15 to -30 HP
- Critical wounds: -35 to -60 HP
- Mortal wounds: -70+ HP
- Rest (safe): +15 to +25 HP
- Treatment (skilled): +20 to +40 HP
- Death at 0 HP

CHOICE DESIGN:
- All choices should be meaningful (no throwaway options)
- Include risky high-reward options
- Allow creative/unexpected solutions
- Sometimes only offer bad choices (pick your poison)
- Be specific: "Bribe the guard with your last 5 silver" not "Try to negotiate"
- Occasionally offer a hidden/clever option

Remember: 
- Match length to IMPORTANCE of the scene
- Use maximum lengths for memorable moments
- Don't pad short scenes to be longer
- Don't rush important scenes to be shorter
- Every sentence should serve the narrative
- Build atmosphere through concrete details
- Keep it dark, keep it real
- Let consequences have weight`;

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
