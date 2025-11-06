import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  // load character
  const character = await prisma.character.findUnique({
    where: {
      id,
      userId: user.id, // verify ownership
    },
  });

  if (!character) {
    redirect("/lobby");
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">{character.name}</h1>
      <p>Story startet hier...</p>
    </div>
  );
}
