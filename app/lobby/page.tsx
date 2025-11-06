import { requireAuth } from "@/lib/auth";
import { getCharacters } from "../actions/characters";
import CharacterForm from "./CharacterForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireAuth();

  // fetch characters server-side
  const characters = await getCharacters();

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">Lobby</h1>

      {/* Client Component for Character creation */}
      <CharacterForm />

      {/* Client Component for Character List */}
      <div className="flex flex-col gap-2">
        {characters.characters.map((char) => (
          <div key={char.id} className="flex gap-2 items-center">
            <p>{char.name}</p>
            <Button>
              <Link href={`/game/${char.id}`}>Load Story</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
