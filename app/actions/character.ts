"use server";

import { prisma } from "@/lib/prisma";

export async function getCharacter(storyId: string) {
  const character = await prisma.story.findUnique({
    where: { id: storyId! },
    select: { character: true },
  });
  return character;
}
