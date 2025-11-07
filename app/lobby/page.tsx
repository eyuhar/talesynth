import { requireAuth } from "@/lib/auth";
import { deleteCharacter, getCharacters } from "../actions/characters";
import CharacterForm from "./CharacterForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CharacterList from "./CharacterList";

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
      <CharacterList characters={characters.characters} />
    </div>
  );
}
