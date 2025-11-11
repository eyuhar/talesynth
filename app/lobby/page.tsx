import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StoryList from "./StoryList";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await requireAuth();

  // fetch characters server-side
  const stories = await prisma.story.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">Lobby</h1>
      {/* Link to create new story */}
      <Button variant={"outline"} asChild>
        <Link href={`/game`}>New Story</Link>
      </Button>
      {/* Client Component for Story List */}
      <StoryList stories={stories} />
    </div>
  );
}
