import { requireAuth } from "@/lib/auth";
import { getCharacters } from "../actions/characters";
import CharacterForm from "./CharacterForm";

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
      {characters.characters.map((char) => (
        <p>{char.name}</p>
      ))}
    </div>
  );
}
