"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";

// Get all characters (minimal data for list)
export async function getCharacters() {
  const user = await requireAuth();

  try {
    // NO include - only basic character data for list view
    const characters = await prisma.character.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        stats: true,
        createdAt: true,
        updatedAt: true,
        // Check if story exists without loading full data
        storyState: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, characters };
  } catch (error) {
    console.error("Error fetching characters:", error);
    return { error: "Failed to fetch characters", characters: [] };
  }
}

// Get single character with full story data
export async function getCharacter(characterId: string) {
  const user = await requireAuth();

  try {
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        userId: user.id, // Ensure ownership
      },
      include: {
        storyState: true,
      },
    });

    if (!character) {
      return { error: "Character not found" };
    }

    return { success: true, character };
  } catch (error) {
    console.error("Error fetching character:", error);
    return { error: "Failed to fetch character" };
  }
}

// Create character
export async function createCharacter(formData: FormData) {
  const user = await requireAuth();

  const name = formData.get("name") as string;

  // Validation
  if (!name || name.trim().length === 0) {
    return { error: "Character name is required" };
  }

  if (name.length <= 2 || name.length >= 40) {
    return { error: "Character name must be between 2 and 40 characters" };
  }

  try {
    const character = await prisma.character.create({
      data: {
        name: name.trim(),
        userId: user.id,
      },
    });

    revalidatePath("/lobby");
    return { success: true, character };
  } catch (error) {
    console.error("Error creating character:", error);
    return { error: "Failed to create character" };
  }
}

// Delete character
export async function deleteCharacter(characterId: string) {
  const user = await requireAuth();

  try {
    // RLS + Prisma ensure user can only delete their own character
    await prisma.character.delete({
      where: {
        id: characterId,
        userId: user.id,
      },
    });

    revalidatePath("/lobby");
    return { success: true };
  } catch (error) {
    console.error("Error deleting character:", error);
    return { error: "Failed to delete character" };
  }
}
